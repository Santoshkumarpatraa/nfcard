"use server";

import { and, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { cards, orders, productVariants, user } from "@/db/schema";
import { markOrderPaid } from "@/data/orders";
import { PRODUCTS_TAG } from "@/data/products";
import type { ActionResult } from "@/app/dashboard/actions";
import { auth } from "@/lib/auth";
import { generateCardCode } from "@/lib/card-code";
import { sendEmail } from "@/lib/email";
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS } from "@/lib/money";
import { absoluteUrl } from "@/lib/site";

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

  await db
    .update(productVariants)
    .set({ pricePaise: priceRupees * 100, compareAtPaise: compareAtRupees ? compareAtRupees * 100 : null, isActive })
    .where(eq(productVariants.id, variantId));
  updateTag(PRODUCTS_TAG);
  return { ok: true, message: "Saved. Shop pages refresh on next visit." };
}
