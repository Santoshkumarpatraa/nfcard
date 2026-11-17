"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/icons";
import { CardRender, toFinish } from "@/components/marketing/card-render";
import type { CatalogProduct } from "@/data/products";
import { useCart } from "@/lib/cart";
import { formatInr } from "@/lib/money";

const field =
  "w-full rounded-xl border border-white/10 bg-ink-900 px-4 py-3 text-base text-ink-50 placeholder:text-ink-400 sm:text-[15px] focus:border-gold-300 focus:outline-none";

export function ProductConfigurator({ product }: { product: CatalogProduct }) {
  const router = useRouter();
  const cart = useCart();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [nameOnCard, setNameOnCard] = useState("");
  const [titleOnCard, setTitleOnCard] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  if (!variant) return null;

  function addToCart(goToCart: boolean) {
    if (!variant) return;
    if (!nameOnCard.trim()) {
      setError("Add the name to engrave on the card");
      return;
    }
    cart.add({
      variantId: variant.id,
      productSlug: product.slug,
      productName: product.name,
      variantName: variant.name,
      finish: variant.finish,
      pricePaise: variant.pricePaise,
      quantity,
      nameOnCard: nameOnCard.trim(),
      titleOnCard: titleOnCard.trim() || undefined,
    });
    setError(null);
    if (goToCart) router.push("/cart");
    else setAdded(true);
  }

  return (
    <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex items-center justify-center rounded-3xl border border-white/5 bg-ink-900/60 p-10 sm:p-16">
        <CardRender
          finish={toFinish(variant.finish)}
          name={nameOnCard || "Your Name"}
          title={titleOnCard || "Your title"}
          className="w-full max-w-[460px] -rotate-3"
        />
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.22em] text-gold-300 uppercase">{product.material}</p>
        <h1 className="mt-3 font-display text-5xl text-ink-50">{product.name}</h1>
        <p className="mt-3 text-ink-300">{product.tagline}</p>
        <div className="mt-6 flex items-baseline gap-3">
          <span className="text-3xl text-ink-50">{formatInr(variant.pricePaise)}</span>
          {variant.compareAtPaise ? (
            <span className="text-ink-400 line-through">{formatInr(variant.compareAtPaise)}</span>
          ) : null}
          <span className="text-sm text-ink-400">incl. GST</span>
        </div>

        <div className="mt-8">
          <p className="text-sm font-medium text-ink-200">Finish: {variant.name}</p>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {product.variants.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setVariantId(option.id)}
                aria-pressed={option.id === variant.id}
                className={`flex items-center gap-2.5 rounded-full border px-4 py-2 text-sm transition ${
                  option.id === variant.id ? "border-gold-300 text-ink-50" : "border-white/10 text-ink-300 hover:border-white/30"
                }`}
              >
                <span className={`size-4 rounded-full ring-1 ring-white/20 metal-${toFinish(option.finish)}`} />
                {option.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-ink-200">Name to engrave</span>
            <input className={field} value={nameOnCard} maxLength={40} onChange={(e) => setNameOnCard(e.target.value)} placeholder="Aarav Mehta" />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-ink-200">Title or company (optional)</span>
            <input className={field} value={titleOnCard} maxLength={50} onChange={(e) => setTitleOnCard(e.target.value)} placeholder="Founder, Northwind" />
          </label>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-ink-200">Quantity</span>
            <div className="flex items-center rounded-full border border-white/10">
              <button type="button" aria-label="Decrease" className="px-3.5 py-2 text-ink-300" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                -
              </button>
              <span className="w-8 text-center text-ink-50">{quantity}</span>
              <button type="button" aria-label="Increase" className="px-3.5 py-2 text-ink-300" onClick={() => setQuantity((q) => Math.min(50, q + 1))}>
                +
              </button>
            </div>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}
        {added && !error ? (
          <p className="mt-4 text-sm text-gold-200">
            Added to cart.{" "}
            <Link href="/cart" className="underline">
              View cart
            </Link>
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => addToCart(true)}
            className="flex-1 rounded-full bg-gold-300 px-7 py-4 text-[15px] font-semibold text-ink-950 transition hover:bg-gold-200"
          >
            Buy now - {formatInr(variant.pricePaise * quantity)}
          </button>
          <button
            type="button"
            onClick={() => addToCart(false)}
            className="rounded-full border border-white/15 px-7 py-4 text-[15px] font-medium text-ink-100 hover:border-white/40"
          >
            Add to cart
          </button>
        </div>

        <ul className="mt-8 grid gap-2.5 text-sm text-ink-400">
          {["Design proof before production", "Ships in 5 to 7 working days", "Profile, leads and analytics included"].map((line) => (
            <li key={line} className="flex items-center gap-2">
              <Icon name="check" size={15} className="text-gold-300" /> {line}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
