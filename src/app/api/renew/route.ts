import { eq } from "drizzle-orm";
import { db } from "@/db";
import { renewals } from "@/db/schema";
import { ensureProfile } from "@/data/owner";
import { getPremiumPricePaise } from "@/data/premium";
import { markRenewalPaid } from "@/data/renewals";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { RENEWAL_MONTHS } from "@/lib/premium";
import { createRazorpayOrder, razorpayConfigured } from "@/lib/razorpay";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.phoneNumberVerified) return Response.json({ error: "Please sign in again" }, { status: 401 });

  // The price is managed in Admin; renewal stays closed until one is set.
  const pricePaise = await getPremiumPricePaise();
  if (!pricePaise) return Response.json({ error: "Renewal is not available yet" }, { status: 503 });
  if (!razorpayConfigured() && env.isProduction) {
    return Response.json({ error: "Payments are not available right now" }, { status: 503 });
  }

  const profile = await ensureProfile(session.user.id, session.user.name);
  const [renewal] = await db
    .insert(renewals)
    .values({ userId: session.user.id, profileId: profile.id, months: RENEWAL_MONTHS, amountPaise: pricePaise })
    .returning();
  if (!renewal) return Response.json({ error: "Could not start renewal" }, { status: 500 });

  if (!razorpayConfigured()) {
    // Local development without Razorpay keys: complete the renewal so the flow can be tried end to end.
    await markRenewalPaid(renewal.id, null);
    return Response.json({ renewalId: renewal.id, testMode: true });
  }

  const order = await createRazorpayOrder({
    amountPaise: pricePaise,
    receipt: `renewal_${renewal.id.slice(0, 8)}`,
    notes: { renewalId: renewal.id },
  });
  await db.update(renewals).set({ razorpayOrderId: order.id }).where(eq(renewals.id, renewal.id));

  return Response.json({
    renewalId: renewal.id,
    razorpayOrderId: order.id,
    amountPaise: pricePaise,
    keyId: env.razorpay.keyId,
    prefill: { name: session.user.name, email: session.user.email, contact: session.user.phoneNumber ?? "" },
  });
}
