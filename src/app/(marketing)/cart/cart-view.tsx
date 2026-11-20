"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { CardRender, toFinish } from "@/components/marketing/card-render";
import { useCart } from "@/lib/cart";
import { formatInr } from "@/lib/money";

export function CartView() {
  const cart = useCart();

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
    <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <ul className="flex flex-col gap-4">
        {cart.items.map((item) => (
          <li key={item.id} className="flex gap-4 rounded-3xl border border-white/5 bg-ink-900/60 p-4 sm:gap-5 sm:p-5">
            <CardRender finish={toFinish(item.finish, item.productSlug)} name={item.nameOnCard} title={item.titleOnCard ?? ""} className="w-24 shrink-0 self-start sm:w-40" />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink-50">{item.productName}</p>
                  <p className="text-sm text-ink-400">{item.variantName}</p>
                  <p className="mt-1 truncate text-sm text-ink-400">Engraving: {item.nameOnCard}</p>
                </div>
                <p className="shrink-0 text-ink-50">{formatInr(item.pricePaise * item.quantity)}</p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-3">
                <div className="flex items-center rounded-full border border-white/10 text-sm">
                  <button
                    type="button"
                    aria-label="Decrease"
                    className="px-3 py-1.5 text-ink-300"
                    onClick={() => cart.update(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-ink-50">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase"
                    className="px-3 py-1.5 text-ink-300"
                    onClick={() => cart.update(item.id, { quantity: Math.min(50, item.quantity + 1) })}
                  >
                    +
                  </button>
                </div>
                <button type="button" onClick={() => cart.remove(item.id)} className="flex items-center gap-1 text-sm text-ink-400 hover:text-ink-100">
                  <Icon name="trash" size={14} /> Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="h-fit rounded-3xl border border-white/5 bg-ink-900/60 p-6">
        <div className="flex justify-between text-ink-300">
          <span>Subtotal</span>
          <span className="text-ink-50">{formatInr(cart.subtotalPaise)}</span>
        </div>
        <div className="mt-2 flex justify-between text-sm text-ink-400">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <p className="mt-4 text-xs text-ink-400">Prices include GST. Final amount is confirmed at checkout.</p>
        <Link
          href="/checkout"
          className="mt-6 flex justify-center rounded-full bg-gold-300 px-6 py-3.5 text-[15px] font-semibold text-ink-950 transition hover:bg-gold-200"
        >
          Checkout
        </Link>
      </aside>
    </div>
  );
}
