import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders, renewals } from "@/db/schema";
import { markOrderPaid } from "@/data/orders";
import { markRenewalPaid } from "@/data/renewals";
import { verifyWebhookSignature } from "@/lib/razorpay";

const eventSchema = z.object({
  event: z.string(),
  payload: z.object({
    payment: z
      .object({ entity: z.object({ id: z.string(), order_id: z.string().nullable().optional() }) })
      .optional(),
    order: z.object({ entity: z.object({ id: z.string() }) }).optional(),
  }),
});

// Source of truth for payment: fires even when the buyer closes the tab before the checkout callback.
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return new Response("Invalid signature", { status: 400 });

  const parsed = eventSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) return new Response("Ignored", { status: 200 });
  const { event, payload } = parsed.data;

  if (event !== "order.paid" && event !== "payment.captured") return new Response("Ignored", { status: 200 });

  const razorpayOrderId = payload.order?.entity.id ?? payload.payment?.entity.order_id;
  if (!razorpayOrderId) return new Response("Ignored", { status: 200 });

  const [order] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.razorpayOrderId, razorpayOrderId))
    .limit(1);
  const paymentId = payload.payment?.entity.id ?? null;
  if (order) {
    await markOrderPaid(order.id, paymentId);
    return new Response("OK", { status: 200 });
  }

  // Premium renewals use their own Razorpay orders.
  const [renewal] = await db
    .select({ id: renewals.id })
    .from(renewals)
    .where(eq(renewals.razorpayOrderId, razorpayOrderId))
    .limit(1);
  if (!renewal) return new Response("Unknown order", { status: 200 });

  await markRenewalPaid(renewal.id, paymentId);
  return new Response("OK", { status: 200 });
}
