"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { formatInr } from "@/lib/money";
import { site } from "@/lib/site";

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: "INR";
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

type CheckoutResponse =
  | { orderId: string; number: number; testMode: true }
  | {
      orderId: string;
      number: number;
      razorpayOrderId: string;
      amountPaise: number;
      keyId: string;
      prefill: { name: string; email: string; contact: string };
    };

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const field =
  "w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-base text-ink-50 placeholder:text-ink-400 sm:text-[15px] focus:border-gold-300 focus:outline-none";

export function CheckoutForm({ defaultName, defaultPhone }: { defaultName: string; defaultPhone: string }) {
  const router = useRouter();
  const cart = useCart();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish(number: number) {
    cart.clear();
    router.replace(`/dashboard/orders?placed=${number}`);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (name: string) => String(form.get(name) ?? "");

    setPending(true);
    setError(null);

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
          nameOnCard: item.nameOnCard,
          titleOnCard: item.titleOnCard,
        })),
        shipping: {
          name: text("name"),
          phone: text("phone"),
          line1: text("line1"),
          line2: text("line2") || undefined,
          city: text("city"),
          state: text("state"),
          pincode: text("pincode"),
        },
        gstin: text("gstin"),
      }),
    }).catch(() => null);

    const body: (CheckoutResponse & { error?: string }) | null = response ? await response.json().catch(() => null) : null;
    if (!response?.ok || !body) {
      setPending(false);
      setError(body?.error ?? "Could not start checkout. Please try again.");
      return;
    }

    if ("testMode" in body) {
      await finish(body.number);
      return;
    }

    if (!(await loadRazorpay()) || !window.Razorpay) {
      setPending(false);
      setError("Could not load the payment window. Check your connection.");
      return;
    }

    const razorpay = new window.Razorpay({
      key: body.keyId,
      amount: body.amountPaise,
      currency: "INR",
      name: site.name,
      description: `Order #${body.number}`,
      order_id: body.razorpayOrderId,
      prefill: body.prefill,
      theme: { color: "#c8a96a" },
      modal: { ondismiss: () => setPending(false) },
      handler: async (payment) => {
        const verify = await fetch("/api/checkout/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: body.orderId, ...payment }),
        }).catch(() => null);
        if (verify?.ok) {
          await finish(body.number);
        } else {
          setPending(false);
          setError("Payment received but not yet confirmed. Your order will update shortly, no need to pay again.");
        }
      },
    });
    razorpay.open();
  }

  if (cart.items.length === 0) {
    return (
      <div className="mt-10 rounded-3xl border border-white/5 bg-ink-900/60 px-6 py-16 text-center">
        <p className="text-ink-300">Your cart is empty.</p>
        <Link href="/shop" className="mt-6 inline-flex rounded-full bg-gold-300 px-6 py-3 text-sm font-semibold text-ink-950">
          Shop cards
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid min-w-0 gap-4 rounded-3xl border border-white/5 bg-ink-900/60 p-5 sm:p-6">
        <h2 className="text-lg font-medium text-ink-50">Delivery address</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <input name="name" required defaultValue={defaultName} placeholder="Full name" autoComplete="name" className={field} />
          <input name="phone" required type="tel" defaultValue={defaultPhone} placeholder="Phone" autoComplete="tel" className={field} />
        </div>
        <input name="line1" required placeholder="House, building, street" autoComplete="address-line1" className={field} />
        <input name="line2" placeholder="Area, landmark (optional)" autoComplete="address-line2" className={field} />
        <div className="grid gap-4 sm:grid-cols-3">
          <input name="city" required placeholder="City" autoComplete="address-level2" className={field} />
          <select name="state" required defaultValue="" className={field}>
            <option value="" disabled>
              State
            </option>
            {STATES.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
          <input name="pincode" required inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} placeholder="PIN code" autoComplete="postal-code" className={field} />
        </div>
        <input name="gstin" placeholder="GSTIN for business invoice (optional)" maxLength={15} className={`${field} uppercase`} />
      </div>

      <aside className="h-fit rounded-3xl border border-white/5 bg-ink-900/60 p-6">
        <h2 className="text-lg font-medium text-ink-50">Summary</h2>
        <ul className="mt-4 flex flex-col gap-3 text-sm">
          {cart.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 text-ink-300">
              <span>
                {item.productName}, {item.variantName} x {item.quantity}
              </span>
              <span className="text-ink-50">{formatInr(item.pricePaise * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex justify-between border-t border-white/10 pt-4 text-ink-50">
          <span>Total</span>
          <span className="text-xl">{formatInr(cart.subtotalPaise)}</span>
        </div>
        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="mt-6 w-full rounded-full bg-gold-300 px-6 py-3.5 text-[15px] font-semibold text-ink-950 transition hover:bg-gold-200 disabled:opacity-60"
        >
          {pending ? "Processing..." : "Pay securely"}
        </button>
        <p className="mt-3 text-center text-xs text-ink-400">UPI, cards and netbanking via Razorpay</p>
      </aside>
    </form>
  );
}
