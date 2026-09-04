import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { RichContent } from "@/components/content/RichContent";
import { plainTextPreview } from "@/lib/sanitize-html";
import { buildPageMetadata } from "@/lib/seo";
import { buttonVariants } from "@/components/ui/button";
import { getProductBySlug, getPublishedProducts, getRelatedProducts } from "@/lib/queries";
import { SITE, whatsappUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

/** @see PUBLIC_REVALIDATE_SECONDS in @/lib/cache */
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const products = await getPublishedProducts();
    return products.map((product) => ({ slug: product.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };

  const title = product.metaTitle || product.name;
  const description = product.metaDescription || plainTextPreview(product.description, 160);

  return buildPageMetadata({
    title,
    description,
    path: `/products/${product.slug}`,
    image: product.imageUrls[0],
  });
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const others = await getRelatedProducts(product.id, 3);
  const image = product.imageUrls[0] || "/products/placeholder.svg";

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Products", path: "/products" },
          { name: product.name, path: `/products/${product.slug}` },
        ]}
      />
      <ProductJsonLd
        name={product.name}
        description={product.description}
        image={product.imageUrls[0]}
        slug={product.slug}
      />
      <article className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <div className="grid gap-8 sm:gap-10 lg:grid-cols-2 lg:items-start">
          <div className="product-image-frame relative aspect-square overflow-hidden rounded-2xl border border-border bg-white lg:sticky lg:top-28">
            <Image
              src={image}
              alt={product.name}
              fill
              className="object-contain p-1 sm:p-2"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted">{SITE.name}</p>
            <h1 className="mt-3 font-display text-3xl text-ink sm:text-5xl">{product.name}</h1>
            <RichContent content={product.description} className="mt-6 text-base leading-relaxed text-muted" />
            {product.usageInstructions && (
              <div className="mt-8 rounded-2xl border border-border bg-card p-6">
                <h2 className="font-display text-2xl text-ink">How to use</h2>
                <RichContent
                  content={product.usageInstructions}
                  className="mt-3 text-sm leading-relaxed text-muted"
                />
              </div>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={whatsappUrl(`Hi, I'm interested in ${product.name}`)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "whatsapp", size: "lg" }), "w-full sm:w-auto")}
              >
                Enquire on WhatsApp
              </a>
              <Link
                href="/verify"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full sm:w-auto")}
              >
                Verify product
              </Link>
            </div>
          </div>
        </div>

        {others.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-3xl text-ink">You may also like</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              {others.map((p) => {
                const thumb = p.imageUrls[0] || "/products/placeholder.svg";
                return (
                  <Link
                    key={p.id}
                    href={`/products/${p.slug}`}
                    className="overflow-hidden rounded-2xl border border-border bg-white transition hover:shadow-md"
                  >
                    <div className="relative aspect-square overflow-hidden bg-zinc-100">
                      <Image
                        src={thumb}
                        alt={p.name}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                    <p className="border-t border-border p-2 font-display text-sm sm:p-3 sm:text-base">{p.name}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
