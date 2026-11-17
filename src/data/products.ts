import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "@/db";
import { productVariants, products } from "@/db/schema";

export const PRODUCTS_TAG = "products";

export type CatalogVariant = {
  id: string;
  name: string;
  finish: string;
  pricePaise: number;
  compareAtPaise: number | null;
};

export type CatalogProduct = {
  id: string;
  slug: string;
  name: string;
  material: string;
  tagline: string;
  description: string;
  features: string[];
  variants: CatalogVariant[];
};

async function loadCatalog(): Promise<CatalogProduct[]> {
  const rows = await db
    .select({ product: products, variant: productVariants })
    .from(products)
    .innerJoin(productVariants, and(eq(productVariants.productId, products.id), eq(productVariants.isActive, true)))
    .where(eq(products.isActive, true))
    .orderBy(asc(products.position), asc(productVariants.position));

  const byId = new Map<string, CatalogProduct>();
  for (const { product, variant } of rows) {
    const entry = byId.get(product.id) ?? {
      id: product.id,
      slug: product.slug,
      name: product.name,
      material: product.material,
      tagline: product.tagline,
      description: product.description,
      features: product.features,
      variants: [],
    };
    entry.variants.push({
      id: variant.id,
      name: variant.name,
      finish: variant.finish,
      pricePaise: variant.pricePaise,
      compareAtPaise: variant.compareAtPaise,
    });
    byId.set(product.id, entry);
  }
  return [...byId.values()];
}

export async function getCatalog(): Promise<CatalogProduct[]> {
  "use cache";
  cacheLife("max");
  cacheTag(PRODUCTS_TAG);
  return loadCatalog();
}

export async function getProduct(slug: string): Promise<CatalogProduct | null> {
  const catalog = await getCatalog();
  return catalog.find((product) => product.slug === slug) ?? null;
}

/** Uncached, for checkout pricing: prices must come from the database at the moment of payment. */
export async function getVariantsForCheckout(variantIds: string[]) {
  const catalog = await loadCatalog();
  const result = new Map<string, { product: CatalogProduct; variant: CatalogVariant }>();
  for (const product of catalog) {
    for (const variant of product.variants) {
      if (variantIds.includes(variant.id)) result.set(variant.id, { product, variant });
    }
  }
  return result;
}
