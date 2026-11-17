import type { MetadataRoute } from "next";
import { getCatalog } from "@/data/products";
import { absoluteUrl } from "@/lib/site";

// Public profiles are intentionally left out: owners share them directly, they are not a directory.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalog = await getCatalog();
  const pages = ["/", "/shop", "/business", "/about", "/contact", "/legal/terms", "/legal/privacy", "/legal/refund", "/legal/shipping"];
  return [
    ...pages.map((path) => ({ url: absoluteUrl(path) })),
    ...catalog.map((product) => ({ url: absoluteUrl(`/shop/${product.slug}`) })),
  ];
}
