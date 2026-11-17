import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { markOrderPaid } from "@/data/orders";
import { auth } from "@/lib/auth";
import { verifyPaymentSignature } from "@/lib/razorpay";

const verifySchema = z.object({
  orderId: z.uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Please log in again" }, { status: 401 });

  const parsed = verifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid payment response" }, { status: 400 });
  const body = parsed.data;

  const [order] = await db
    .select({ id: orders.id, razorpayOrderId: orders.razorpayOrderId })
    .from(orders)
    .where(and(eq(orders.id, body.orderId), eq(orders.userId, session.user.id)))
    .limit(1);

  if (!order || order.razorpayOrderId !== body.razorpay_order_id) {
    return Response.json({ error: "Order not found" }, { status: 404 });
  }
  if (!verifyPaymentSignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) {
    return Response.json({ error: "Payment could not be verified" }, { status: 400 });
  }

  await markOrderPaid(order.id, body.razorpay_payment_id);
  return Response.json({ ok: true });
}
