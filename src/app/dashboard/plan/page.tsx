import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { Icon } from "@/components/icons";
import { Badge, Card, PageHeader, Skeleton, buttonClass } from "@/components/ui";
import { db } from "@/db";
import { renewals } from "@/db/schema";
import { ensureProfile } from "@/data/owner";
import { getPremiumPricePaise } from "@/data/premium";
import { formatInr } from "@/lib/money";
import { PREMIUM_MONTHS_METAL, PREMIUM_MONTHS_PVC, daysUntil, formatPlanDate, isPremium } from "@/lib/premium";
import { requireVerifiedUser } from "@/lib/session";
import { RenewButton } from "./renew-button";

export const metadata: Metadata = { title: "Plan" };

export default function PlanPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <Plan />
    </Suspense>
  );
}

const PREMIUM_FEATURES = [
  "Services with prices, gallery, video and reviews",
  "Brochures, location, UPI payments and links",
  "Custom themes and accent colour",
  "Analytics: views, taps, saves and clicks",
];

const BASIC_FEATURES = ["Your card keeps working", "Name, photo and contact buttons", "Save contact and Share yours", "Leads you receive"];

async function Plan() {
  const session = await requireVerifiedUser("/dashboard/plan");
  const profile = await ensureProfile(session.user.id, session.user.name);
  const [pricePaise, history] = await Promise.all([
    getPremiumPricePaise(),
    db
      .select()
      .from(renewals)
      .where(and(eq(renewals.userId, session.user.id), eq(renewals.status, "paid")))
      .orderBy(desc(renewals.paidAt))
      .limit(5),
  ]);

  const active = isPremium(profile.premiumUntil);
  const daysLeft = daysUntil(profile.premiumUntil);

  return (
    <>
      <PageHeader title="Plan" description="Your card always works. Premium adds business sections, themes and analytics." />
      <div className="grid max-w-3xl gap-6">
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={active ? "green" : "amber"}>{active ? "Premium" : "Basic"}</Badge>
            <p className="text-sm text-ink-600">
              {active && profile.premiumUntil
                ? `Active until ${formatPlanDate(profile.premiumUntil)} (${daysLeft} day${daysLeft === 1 ? "" : "s"} left)`
                : profile.premiumUntil
                  ? `Premium ended on ${formatPlanDate(profile.premiumUntil)}. Your sections are saved and hidden until you renew.`
                  : `Premium comes free with every card: ${PREMIUM_MONTHS_METAL} months with metal, ${PREMIUM_MONTHS_PVC} with PVC.`}
            </p>
          </div>
          <div className="mt-6">
            {pricePaise ? (
              <RenewButton label={`${active ? "Add 1 year" : "Renew 1 year"} for ${formatInr(pricePaise)}`} />
            ) : active ? (
              <p className="text-sm text-ink-500">Renewal is not open yet. Your Premium stays active until the date above.</p>
            ) : (
              <Link href="/shop" className={buttonClass("primary")}>
                Get a card with Premium
              </Link>
            )}
          </div>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2">
          <Card className="p-6">
            <h2 className="font-medium">Premium</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-ink-700">
              {PREMIUM_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-emerald-600" /> {feature}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-6">
            <h2 className="font-medium">Basic, always free</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-ink-700">
              {BASIC_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <Icon name="check" size={16} className="mt-0.5 shrink-0 text-ink-400" /> {feature}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {history.length ? (
          <Card className="p-6">
            <h2 className="font-medium">Payments</h2>
            <ul className="mt-3 divide-y divide-ink-100 text-sm">
              {history.map((item) => (
                <li key={item.id} className="flex justify-between py-2.5">
                  <span>
                    Premium, {item.months} months{item.paidAt ? ` · ${formatPlanDate(item.paidAt)}` : ""}
                  </span>
                  <span className="font-medium">{formatInr(item.amountPaise)}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </div>
    </>
  );
}
