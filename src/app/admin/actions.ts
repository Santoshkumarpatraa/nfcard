"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { cards, orders, productVariants, user } from "@/db/schema";
import { markOrderPaid } from "@/data/orders";
import { extendPremium, refreshPublicProfile, setPremiumPricePaise } from "@/data/premium";
import { PRODUCTS_TAG } from "@/data/products";
import type { ActionResult } from "@/app/dashboard/actions";
import { auth } from "@/lib/auth";
import { generateCardCode } from "@/lib/card-code";
import { sendEmail } from "@/lib/email";
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS } from "@/lib/money";
import { absoluteUrl } from "@/lib/site";
import { ensureProfile } from "@/data/owner";

async function isAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.role === "admin";
}

const statusSchema = z.object({
  orderId: z.uuid(),
  status: z.enum(["pending", "paid", "in_production", "shipped", "delivered", "cancelled"]),
  courier: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(60).optional(),
});

export async function updateOrderStatus(input: z.input<typeof statusSchema>): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "Not allowed" };
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { orderId, status, courier, trackingNumber } = parsed.data;

  const [current] = await db.select({ status: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!current) return { ok: false, error: "Order not found" };

  const changing = status !== current.status;
  if (changing && !ORDER_TRANSITIONS[current.status].includes(status)) {
    return { ok: false, error: `An order that is ${ORDER_STATUS_LABEL[current.status].toLowerCase()} cannot move to ${ORDER_STATUS_LABEL[status].toLowerCase()}` };
  }

  if (changing && status === "paid") {
    const done = await markOrderPaid(orderId, null);
    return done ? { ok: true, message: "Marked paid. Cards created and the buyer was emailed." } : { ok: false, error: "Order is no longer pending" };
  }

  const withTracking = status === "shipped" || status === "delivered";
  const [order] = await db
    .update(orders)
    .set({
      status,
      ...(withTracking && courier !== undefined ? { courier: courier || null } : {}),
      ...(withTracking && trackingNumber !== undefined ? { trackingNumber: trackingNumber || null } : {}),
    })
    .where(and(eq(orders.id, orderId), eq(orders.status, current.status)))
    .returning();
  if (!order) return { ok: false, error: "Order changed meanwhile. Reload and try again." };

  const [buyer] = await db.select({ email: user.email, name: user.name }).from(user).where(eq(user.id, order.userId));
  if (changing && buyer && (status === "in_production" || status === "shipped" || status === "delivered")) {
    await sendEmail({
      to: buyer.email,
      subject: `Order #${order.number}: ${ORDER_STATUS_LABEL[status]}`,
      text: [
        `Hi ${buyer.name.split(" ")[0]}, your order #${order.number} is now ${ORDER_STATUS_LABEL[status].toLowerCase()}.`,
        status === "shipped" && order.trackingNumber ? `Courier: ${order.courier ?? "-"}, tracking number ${order.trackingNumber}.` : null,
        "",
        `Details: ${absoluteUrl("/dashboard/orders")}`,
      ]
        .filter((line) => line !== null)
        .join("\n"),
    }).catch((error: unknown) => console.error("[admin] status email failed", error));
  }
  return { ok: true, message: changing ? "Order updated" : "Tracking saved" };
}

export async function generateCards(count: number, label: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "Not allowed" };
  const total = Math.trunc(count);
  if (!Number.isFinite(total) || total < 1 || total > 500) return { ok: false, error: "Generate between 1 and 500 cards" };

  const values = Array.from({ length: total }, () => ({
    code: generateCardCode(),
    label: label.trim().slice(0, 60) || null,
  }));
  await db.insert(cards).values(values).onConflictDoNothing({ target: cards.code });
  return { ok: true, message: `${total} unassigned cards created. Export the CSV for programming.` };
}

const variantSchema = z.object({
  variantId: z.uuid(),
  priceRupees: z.number().int().min(1).max(1_000_000),
  compareAtRupees: z.number().int().min(0).max(1_000_000),
  isActive: z.boolean(),
});

export async function updateVariant(input: z.input<typeof variantSchema>): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "Not allowed" };
  const parsed = variantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const { variantId, priceRupees, compareAtRupees, isActive } = parsed.data;
  if (compareAtRupees && compareAtRupees <= priceRupees) return { ok: false, error: "MRP must be higher than the price, or 0 for none" };

  await db
    .update(productVariants)
    .set({ pricePaise: priceRupees * 100, compareAtPaise: compareAtRupees ? compareAtRupees * 100 : null, isActive })
    .where(eq(productVariants.id, variantId));
  updateTag(PRODUCTS_TAG);
  return { ok: true, message: "Saved. Shop pages refresh on next visit." };
}

const priceSchema = z.object({ rupees: z.number().int().min(0).max(100_000) });

export async function updatePremiumPrice(input: z.input<typeof priceSchema>): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "Not allowed" };
  const parsed = priceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a price in rupees, or 0 to turn renewal off" };
  await setPremiumPricePaise(parsed.data.rupees ? parsed.data.rupees * 100 : null);
  return { ok: true, message: parsed.data.rupees ? "Renewal price saved" : "Renewal turned off until a price is set" };
}

const grantSchema = z.object({
  username: z
    .string()
    .transform((value) => value.trim().toLowerCase().replace(/^@/, ""))
    .pipe(z.string().min(3)),
  months: z.number().int().min(1).max(36),
});

export async function grantPremium(input: z.input<typeof grantSchema>): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "Not allowed" };
  const parsed = grantSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a username and 1 to 36 months" };

  const [owner] = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.username, parsed.data.username))
    .limit(1);
  if (!owner) return { ok: false, error: `No customer with username @${parsed.data.username}` };

  const profile = await ensureProfile(owner.id, owner.name);
  const until = await extendPremium(profile.id, parsed.data.months);
  refreshPublicProfile(profile.id);
  return { ok: true, message: `@${parsed.data.username} now has Premium until ${until?.toLocaleDateString("en-IN") ?? "-"}` };
}
