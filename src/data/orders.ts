import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { cards, orderItems, orders, user } from "@/db/schema";
import { ensureProfile } from "@/data/owner";
import { generateCardCode } from "@/lib/card-code";
import { sendEmail } from "@/lib/email";
import { formatInr } from "@/lib/money";
import { absoluteUrl, site } from "@/lib/site";

/** Marks a pending order paid exactly once (checkout callback, webhook or admin) and creates one card per unit linked to the buyer. */
export async function markOrderPaid(orderId: string, paymentId: string | null): Promise<boolean> {
  const transitioned = await db.transaction(async (tx) => {
    const [order] = await tx
      .update(orders)
      .set({ status: "paid", razorpayPaymentId: paymentId, paidAt: new Date() })
      .where(and(eq(orders.id, orderId), eq(orders.status, "pending")))
      .returning();
    if (!order) return null;

    const [buyer] = await tx.select().from(user).where(eq(user.id, order.userId)).limit(1);
    if (!buyer) throw new Error(`Order ${order.number} has no buyer`);
    const profile = await ensureProfile(buyer.id, buyer.name, tx);

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    for (const item of items) {
      for (let unit = 0; unit < item.quantity; unit++) {
        await tx.insert(cards).values({
          code: generateCardCode(),
          status: "active",
          userId: buyer.id,
          profileId: profile.id,
          label: `${item.productName} - ${item.variantName}`,
          orderItemId: item.id,
          activatedAt: new Date(),
        });
      }
    }
    return { order, buyer };
  });

  if (!transitioned) {
    await flagPaymentOnClosedOrder(orderId, paymentId);
    return false;
  }

  const { order, buyer } = transitioned;
  await sendEmail({
    to: buyer.email,
    subject: `Order #${order.number} confirmed`,
    text: [
      `Thank you for your order, ${buyer.name.split(" ")[0]}.`,
      "",
      `Order #${order.number} - ${formatInr(order.totalPaise)} paid.`,
      "We will share a design proof and then start production. Your card is already linked to your profile.",
      "",
      `Track your order: ${absoluteUrl("/dashboard/orders")}`,
      "",
      site.name,
    ].join("\n"),
  }).catch((error: unknown) => console.error("[orders] confirmation email failed", error));

  return true;
}

// A payment that lands on a cancelled order must not vanish: record it and alert support for a refund.
async function flagPaymentOnClosedOrder(orderId: string, paymentId: string | null) {
  if (!paymentId) return;
  const [order] = await db
    .update(orders)
    .set({ razorpayPaymentId: paymentId })
    .where(and(eq(orders.id, orderId), eq(orders.status, "cancelled"), isNull(orders.razorpayPaymentId)))
    .returning({ number: orders.number, totalPaise: orders.totalPaise });
  if (!order) return;

  console.error(`[orders] payment ${paymentId} captured on cancelled order #${order.number}; refund needed`);
  await sendEmail({
    to: site.supportEmail,
    subject: `Refund needed: payment on cancelled order #${order.number}`,
    text: `Payment ${paymentId} for ${formatInr(order.totalPaise)} was captured after order #${order.number} was cancelled. Refund it in Razorpay or reopen the order.`,
  }).catch((error: unknown) => console.error("[orders] refund alert email failed", error));
}
