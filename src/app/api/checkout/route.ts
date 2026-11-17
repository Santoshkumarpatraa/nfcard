import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { markOrderPaid } from "@/data/orders";
import { getVariantsForCheckout } from "@/data/products";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { toE164 } from "@/lib/phone";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";
import { site } from "@/lib/site";

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z.number().int().min(1).max(50),
        nameOnCard: z.string().trim().min(1, "Add the name to print on each card").max(40),
        titleOnCard: z.string().trim().max(50).optional(),
        notes: z.string().trim().max(300).optional(),
      }),
    )
    .min(1, "Your cart is empty")
    .max(20),
  shipping: z.object({
    name: z.string().trim().min(1, "Enter the recipient name").max(80),
    phone: z.string().trim().min(1, "Enter a phone number for delivery"),
    line1: z.string().trim().min(1, "Enter the address").max(120),
    line2: z.string().trim().max(120).optional(),
    city: z.string().trim().min(1, "Enter the city").max(60),
    state: z.string().trim().min(1, "Enter the state").max(60),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
  }),
  gstin: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^$|^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, "Enter a valid GSTIN or leave it empty")
    .optional(),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Please log in to check out" }, { status: 401 });
  if (!session.user.phoneNumberVerified) {
    return Response.json({ error: "Verify your phone number before checking out" }, { status: 403 });
  }

  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Check your details" }, { status: 400 });
  }
  const input = parsed.data;

  const shippingPhone = toE164(input.shipping.phone);
  if (!shippingPhone) return Response.json({ error: "Enter a valid delivery phone number" }, { status: 400 });

  if (!razorpayConfigured() && env.isProduction) {
    return Response.json({ error: "Payments are not available right now" }, { status: 503 });
  }

  // Prices always come from the database, never from the browser.
  const variants = await getVariantsForCheckout(input.items.map((item) => item.variantId));
  if (input.items.some((item) => !variants.has(item.variantId))) {
    return Response.json({ error: "An item in your cart is no longer available" }, { status: 409 });
  }
  const lines = input.items.flatMap((item) => {
    const match = variants.get(item.variantId);
    return match ? [{ ...item, product: match.product, variant: match.variant }] : [];
  });

  const subtotalPaise = lines.reduce((sum, line) => sum + line.variant.pricePaise * line.quantity, 0);
  const shippingPaise = site.shippingPaise;
  const totalPaise = subtotalPaise + shippingPaise;

  const order = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(orders)
      .values({
        userId: session.user.id,
        subtotalPaise,
        shippingPaise,
        totalPaise,
        shipping: { ...input.shipping, phone: shippingPhone },
        gstin: input.gstin || null,
      })
      .returning();
    if (!created) throw new Error("Could not create order");

    await tx.insert(orderItems).values(
      lines.map((line) => ({
        orderId: created.id,
        productId: line.product.id,
        variantId: line.variant.id,
        productName: line.product.name,
        variantName: line.variant.name,
        unitPricePaise: line.variant.pricePaise,
        quantity: line.quantity,
        customisation: { nameOnCard: line.nameOnCard, titleOnCard: line.titleOnCard, notes: line.notes },
      })),
    );
    return created;
  });

  if (!razorpayConfigured()) {
    // Local development without Razorpay keys: complete the order so the full flow can be tried.
    await markOrderPaid(order.id, null);
    return Response.json({ orderId: order.id, number: order.number, testMode: true });
  }

  const razorpayOrder = await createRazorpayOrder({
    amountPaise: totalPaise,
    receipt: `order_${order.number}`,
    notes: { orderId: order.id },
  });
  await db.update(orders).set({ razorpayOrderId: razorpayOrder.id }).where(eq(orders.id, order.id));

  return Response.json({
    orderId: order.id,
    number: order.number,
    razorpayOrderId: razorpayOrder.id,
    amountPaise: totalPaise,
    keyId: env.razorpay.keyId,
    prefill: { name: session.user.name, email: session.user.email, contact: session.user.phoneNumber ?? "" },
  });
}
