import type { Metadata } from "next";
import { ProductGrid } from "@/components/home/ProductGrid";
import { getPublishedProducts } from "@/lib/queries";
import { buildPageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: `Products | ${SITE.name}`,
  description: `Browse ${SITE.name} night creams, glutathione capsules, and whitening soaps. Verify authenticity on every purchase.`,
  path: "/products",
});

/** @see PUBLIC_REVALIDATE_SECONDS in @/lib/cache */
export const revalidate = 3600;

export default async function ProductsPage() {
  const products = await getPublishedProducts();

  return (
    <div className="pt-8">
      <ProductGrid products={products} title="All Products" />
    </div>
  );
}
