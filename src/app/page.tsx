import type { Metadata } from "next";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductGrid } from "@/components/home/ProductGrid";
import { AboutTeaser } from "@/components/home/AboutTeaser";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { VerifyCta } from "@/components/home/VerifyCta";
import { BlogPreview } from "@/components/home/BlogPreview";
import { WebSiteJsonLd } from "@/components/seo/JsonLd";
import {
  getPublishedCarouselSlides,
  getPublishedPosts,
  getPublishedProducts,
  getPublishedTestimonials,
} from "@/lib/queries";
import { buildHomeMetadata } from "@/lib/seo";

export const metadata: Metadata = buildHomeMetadata();

/** @see PUBLIC_REVALIDATE_SECONDS in @/lib/cache */
export const revalidate = 3600;

export default async function HomePage() {
  const [slides, products, testimonials, posts] = await Promise.all([
    getPublishedCarouselSlides(),
    getPublishedProducts(),
    getPublishedTestimonials(),
    getPublishedPosts(),
  ]);

  return (
    <>
      <WebSiteJsonLd />
      <HeroCarousel slides={slides} />
      <ProductGrid products={products} compact />
      <AboutTeaser />
      <TestimonialsSection testimonials={testimonials} />
      <VerifyCta />
      <BlogPreview posts={posts.slice(0, 3)} />
    </>
  );
}
