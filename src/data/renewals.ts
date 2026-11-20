import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { renewals, user } from "@/db/schema";
import { extendPremium, refreshPublicProfile } from "@/data/premium";
import { sendEmail } from "@/lib/email";
import { formatInr } from "@/lib/money";
import { formatPlanDate } from "@/lib/premium";
import { absoluteUrl, site } from "@/lib/site";

/** Marks a renewal paid exactly once (checkout callback, webhook or test mode) and adds its months to Premium. */
export async function markRenewalPaid(renewalId: string, paymentId: string | null): Promise<boolean> {
  const result = await db.transaction(async (tx) => {
    const [paid] = await tx
      .update(renewals)
      .set({ status: "paid", razorpayPaymentId: paymentId, paidAt: new Date() })
      .where(and(eq(renewals.id, renewalId), eq(renewals.status, "pending")))
      .returning();
    if (!paid) return null;
    return { renewal: paid, until: await extendPremium(paid.profileId, paid.months, tx) };
  });
  if (!result) return false;
  const { renewal, until } = result;
  refreshPublicProfile(renewal.profileId);

  const [owner] = await db.select({ email: user.email, name: user.name }).from(user).where(eq(user.id, renewal.userId)).limit(1);
  if (owner && until) {
    await sendEmail({
      to: owner.email,
      subject: `Premium renewed until ${formatPlanDate(until)}`,
      text: [
        `Thank you, ${owner.name.split(" ")[0]}. We received ${formatInr(renewal.amountPaise)}.`,
        `Your ${site.name} Premium is active until ${formatPlanDate(until)}.`,
        "",
        `Manage your plan: ${absoluteUrl("/dashboard/plan")}`,
      ].join("\n"),
    }).catch((error: unknown) => console.error("[renewals] receipt email failed", error));
  }
  return true;
}
