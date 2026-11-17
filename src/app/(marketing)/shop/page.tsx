import type { Metadata } from "next";
import Link from "next/link";
import { CardRender, toFinish } from "@/components/marketing/card-render";
import { getCatalog } from "@/data/products";
import { formatInr } from "@/lib/money";

export const metadata: Metadata = {
  title: "Shop NFC cards",
  description: "Metal and premium NFC business cards, personalised and shipped across India.",
};

export default async function ShopPage() {
  const catalog = await getCatalog();

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
      <p className="text-xs font-medium tracking-[0.22em] text-gold-300 uppercase">Shop</p>
      <h1 className="mt-4 font-display text-6xl text-ink-50">Choose your card</h1>
      <p className="mt-4 max-w-xl text-lg text-ink-300">
        Every card includes your profile, unlimited edits, lead capture and analytics. Pay once.
      </p>

      {catalog.length === 0 ? (
        <p className="mt-16 text-ink-400">Products are being restocked. Please check back soon.</p>
      ) : (
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {catalog.map((product) => {
            const lowest = Math.min(...product.variants.map((variant) => variant.pricePaise));
            const first = product.variants[0];
            return (
              <Link
                key={product.id}
                href={`/shop/${product.slug}`}
                className="group flex flex-col rounded-3xl border border-white/5 bg-ink-900/60 p-6 transition hover:border-white/15"
              >
                <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-ink-950/60 p-8">
                  <CardRender
                    finish={toFinish(first?.finish)}
                    className="w-full transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[-2deg]"
                  />
                </div>
                <div className="mt-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-medium text-ink-50">{product.name}</h2>
                    <p className="mt-1 text-sm text-ink-400">{product.tagline}</p>
                  </div>
                  <p className="shrink-0 text-ink-100">from {formatInr(lowest)}</p>
                </div>
                <div className="mt-4 flex gap-1.5">
                  {product.variants.map((variant) => (
                    <span
                      key={variant.id}
                      title={variant.name}
                      className={`size-5 rounded-full ring-1 ring-white/20 metal-${toFinish(variant.finish)}`}
                    />
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
