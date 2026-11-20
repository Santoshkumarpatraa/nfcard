import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { renewals } from "@/db/schema";
import { markRenewalPaid } from "@/data/renewals";
import { auth } from "@/lib/auth";
import { verifyPaymentSignature } from "@/lib/razorpay";

const verifySchema = z.object({
  renewalId: z.uuid(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return Response.json({ error: "Please sign in again" }, { status: 401 });

  const parsed = verifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid payment response" }, { status: 400 });
  const body = parsed.data;

  const [renewal] = await db
    .select({ id: renewals.id, razorpayOrderId: renewals.razorpayOrderId })
    .from(renewals)
    .where(and(eq(renewals.id, body.renewalId), eq(renewals.userId, session.user.id)))
    .limit(1);
  if (!renewal || renewal.razorpayOrderId !== body.razorpay_order_id) {
    return Response.json({ error: "Renewal not found" }, { status: 404 });
  }
  if (!verifyPaymentSignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) {
    return Response.json({ error: "Payment could not be verified" }, { status: 400 });
  }

  await markRenewalPaid(renewal.id, body.razorpay_payment_id);
  return Response.json({ ok: true });
}
