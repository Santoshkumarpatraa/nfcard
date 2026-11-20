import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { Suspense } from "react";
import { Card, PageHeader, Skeleton } from "@/components/ui";
import { db } from "@/db";
import { productVariants, products } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { VariantForm } from "./variant-form";

export const metadata: Metadata = { title: "Admin products" };

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      <AdminProducts />
    </Suspense>
  );
}

async function AdminProducts() {
  await requireAdmin();
  const rows = await db
    .select({ product: products, variant: productVariants })
    .from(products)
    .innerJoin(productVariants, eq(productVariants.productId, products.id))
    .orderBy(asc(products.position), asc(productVariants.position));

  const grouped = new Map<string, { name: string; variants: (typeof rows)[number]["variant"][] }>();
  for (const { product, variant } of rows) {
    const entry = grouped.get(product.id) ?? { name: product.name, variants: [] };
    entry.variants.push(variant);
    grouped.set(product.id, entry);
  }

  return (
    <>
      <PageHeader title="Products" description="Prices in rupees, GST inclusive. Shop pages update right after saving." />
      <div className="flex flex-col gap-6">
        {[...grouped.entries()].map(([id, product]) => (
          <Card key={id} className="p-5">
            <h2 className="font-medium">{product.name}</h2>
            <div className="mt-4 flex flex-col divide-y divide-ink-100">
              {product.variants.map((variant) => (
                <VariantForm
                  key={variant.id}
                  variantId={variant.id}
                  name={variant.name}
                  priceRupees={variant.pricePaise / 100}
                  compareAtRupees={variant.compareAtPaise ? variant.compareAtPaise / 100 : 0}
                  isActive={variant.isActive}
                />
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
