import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/icons";
import { getCatalog, getProduct } from "@/data/products";
import { ProductConfigurator } from "./configurator";

export const ensureStatic = "navigation";
// Entry pages opened from taps and links; prefetch-instant validation does not apply, the full page is static.
export const instant = false;

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.length ? catalog.map((product) => ({ slug: product.slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.tagline };
}

export default async function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:py-20">
      <Link href="/shop" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100">
        <Icon name="arrowRight" size={14} className="rotate-180" /> All cards
      </Link>
      <ProductConfigurator product={product} />

      <div className="mt-20 grid gap-12 border-t border-white/5 pt-16 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl text-ink-50">About this card</h2>
          <p className="mt-5 leading-relaxed whitespace-pre-line text-ink-300">{product.description}</p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2">
          {product.features.map((feature) => (
            <li key={feature} className="flex gap-3 rounded-2xl border border-white/5 bg-ink-900/60 p-5 text-sm text-ink-200">
              <Icon name="check" size={16} className="mt-0.5 shrink-0 text-gold-300" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
