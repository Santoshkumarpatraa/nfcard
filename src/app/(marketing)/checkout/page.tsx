import type { Metadata } from "next";
import { Suspense } from "react";
import { requireVerifiedUser } from "@/lib/session";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
      <h1 className="font-display text-5xl text-ink-50">Checkout</h1>
      <Suspense fallback={<div className="mt-10 h-96 animate-pulse rounded-3xl bg-ink-900/60" />}>
        <Checkout />
      </Suspense>
    </div>
  );
}

async function Checkout() {
  const session = await requireVerifiedUser("/checkout");
  return <CheckoutForm defaultName={session.user.name} defaultPhone={session.user.phoneNumber ?? ""} />;
}
