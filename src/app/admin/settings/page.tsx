import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, PageHeader, Skeleton } from "@/components/ui";
import { getPremiumPricePaise } from "@/data/premium";
import { PREMIUM_MONTHS_METAL, PREMIUM_MONTHS_PVC } from "@/lib/premium";
import { requireAdmin } from "@/lib/session";
import { GrantPremiumForm, PremiumPriceForm } from "./forms";

export const metadata: Metadata = { title: "Admin settings" };

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <AdminSettings />
    </Suspense>
  );
}

async function AdminSettings() {
  await requireAdmin();
  const pricePaise = await getPremiumPricePaise();

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid max-w-2xl gap-6">
        <Card className="p-5">
          <h2 className="font-medium">Premium renewal price (per year)</h2>
          <p className="mt-1 text-sm text-ink-500">
            Cards include free Premium: {PREMIUM_MONTHS_METAL} months with metal, {PREMIUM_MONTHS_PVC} with PVC. This is
            what customers pay to renew for a year. Set 0 to keep renewal closed.
          </p>
          <PremiumPriceForm rupees={pricePaise ? pricePaise / 100 : 0} />
        </Card>
        <Card className="p-5">
          <h2 className="font-medium">Give Premium to a customer</h2>
          <p className="mt-1 text-sm text-ink-500">Adds months on top of any Premium they already have. Useful for offers and support.</p>
          <GrantPremiumForm />
        </Card>
      </div>
    </>
  );
}
