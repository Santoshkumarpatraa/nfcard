"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type CartItem, useCart } from "@/lib/cart";
import { formatInr } from "@/lib/money";
import { loadRazorpay } from "@/lib/razorpay-client";
import { site } from "@/lib/site";
import { uploadDesign } from "@/lib/upload-client";

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
          logoKey: item.logoKey,
          notes: item.notes?.trim() || undefined,
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
      <div className="flex min-w-0 flex-col gap-8">
      <div className="grid gap-4 rounded-3xl border border-white/5 bg-ink-900/60 p-5 sm:p-6">
        <h2 className="text-lg font-medium text-ink-50">Customise your cards</h2>
        <p className="-mt-2 text-sm text-ink-400">Add your logo and any design notes. We send a proof before production.</p>
        {cart.items.map((item) => (
          <CustomiseItem key={item.id} item={item} onChange={(patch) => cart.update(item.id, patch)} />
        ))}
      </div>
      <div className="grid gap-4 rounded-3xl border border-white/5 bg-ink-900/60 p-5 sm:p-6">
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

function CustomiseItem({ item, onChange }: { item: CartItem; onChange: (patch: Partial<CartItem>) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onChange({ logoKey: await uploadDesign(file), logoName: file.name });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-white/5 p-4">
      <p className="text-sm text-ink-100">
        {item.productName}, {item.variantName} <span className="text-ink-400">for {item.nameOnCard}</span>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="cursor-pointer rounded-full border border-white/15 px-4 py-2 text-sm text-ink-100 hover:border-white/40">
          {busy ? "Uploading..." : item.logoKey ? "Replace logo" : "Upload logo (optional)"}
          <input
            type="file"
            accept="image/png,image/jpeg,application/pdf"
            className="hidden"
            disabled={busy}
            onChange={(event) => onFile(event.target.files?.[0])}
          />
        </label>
        {item.logoKey ? (
          <span className="flex min-w-0 items-center gap-2 text-sm text-gold-200">
            <span className="truncate">{item.logoName ?? "Logo added"}</span>
            <button type="button" className="text-ink-400 underline" onClick={() => onChange({ logoKey: undefined, logoName: undefined })}>
              Remove
            </button>
          </span>
        ) : (
          <span className="text-xs text-ink-400">PNG, JPG or PDF, up to 4 MB. Vector logos as PDF.</span>
        )}
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <textarea
        value={item.notes ?? ""}
        maxLength={300}
        rows={2}
        placeholder="Design notes (optional), e.g. logo on the back, name in capitals"
        onChange={(event) => onChange({ notes: event.target.value })}
        className={field}
      />
    </div>
  );
}
