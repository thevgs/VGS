import { cache } from "react";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CarouselSlideView } from "@/lib/admin-types";
import { CACHE_TAGS, DATA_REVALIDATE_SECONDS, SITEMAP_REVALIDATE_SECONDS } from "@/lib/cache";

const productListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrls: true,
  sortOrder: true,
  published: true,
} satisfies Prisma.ProductSelect;

const relatedProductSelect = {
  id: true,
  name: true,
  slug: true,
  imageUrls: true,
} satisfies Prisma.ProductSelect;

const blogPostListSelect = {
  id: true,
  title: true,
  slug: true,
  excerpt: true,
  coverImageUrl: true,
  publishedAt: true,
  published: true,
} satisfies Prisma.BlogPostSelect;

const testimonialListSelect = {
  id: true,
  author: true,
  body: true,
  sortOrder: true,
  published: true,
} satisfies Prisma.TestimonialSelect;

const carouselSelect = {
  id: true,
  title: true,
  subtitle: true,
  ctaLabel: true,
  ctaHref: true,
  secondaryCtaLabel: true,
  secondaryCtaHref: true,
  imageUrl: true,
  imageAlt: true,
  sortOrder: true,
  published: true,
} satisfies Prisma.CarouselSlideSelect;

export type ProductListItem = Prisma.ProductGetPayload<{ select: typeof productListSelect }>;
export type RelatedProductItem = Prisma.ProductGetPayload<{ select: typeof relatedProductSelect }>;
export type BlogPostListItem = Prisma.BlogPostGetPayload<{ select: typeof blogPostListSelect }>;
export type TestimonialListItem = Prisma.TestimonialGetPayload<{ select: typeof testimonialListSelect }>;

const DEFAULT_CAROUSEL_SLIDES: CarouselSlideView[] = [
  {
    id: "default-1",
    title: "Glow that feels natural",
    subtitle: "Night creams, capsules & soaps crafted with glutathione and botanicals.",
    ctaLabel: "Shop Our Range",
    ctaHref: "/products",
    secondaryCtaLabel: "Know About Us",
    secondaryCtaHref: "/about",
    imageUrl: null,
    imageAlt: null,
    sortOrder: 1,
    published: true,
  },
  {
    id: "default-2",
    title: "Verify every purchase",
    subtitle: "Authentic Vita Glow products carry a code. Check yours in seconds.",
    ctaLabel: "Verify Product",
    ctaHref: "/verify",
    secondaryCtaLabel: "Know About Us",
    secondaryCtaHref: "/about",
    imageUrl: null,
    imageAlt: null,
    sortOrder: 2,
    published: true,
  },
  {
    id: "default-3",
    title: "Talk to us on WhatsApp",
    subtitle: "Questions about routine or authenticity? We're one message away.",
    ctaLabel: "Message Us",
    ctaHref: "/contact",
    secondaryCtaLabel: "Know About Us",
    secondaryCtaHref: "/about",
    imageUrl: null,
    imageAlt: null,
    sortOrder: 3,
    published: true,
  },
];

export const getPublishedCarouselSlides = unstable_cache(
  async (): Promise<CarouselSlideView[]> => {
    try {
      const slides = await prisma.carouselSlide.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        select: carouselSelect,
      });
      if (slides.length === 0) return DEFAULT_CAROUSEL_SLIDES;
      return slides;
    } catch {
      return DEFAULT_CAROUSEL_SLIDES;
    }
  },
  ["published-carousel"],
  { tags: [CACHE_TAGS.carousel], revalidate: DATA_REVALIDATE_SECONDS },
);

export const getPublishedProducts = unstable_cache(
  async (): Promise<ProductListItem[]> => {
    try {
      return await prisma.product.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        select: productListSelect,
      });
    } catch {
      return [];
    }
  },
  ["published-products"],
  { tags: [CACHE_TAGS.products], revalidate: DATA_REVALIDATE_SECONDS },
);

export async function getRelatedProducts(excludeId: string, limit = 3): Promise<RelatedProductItem[]> {
  const products = await getPublishedProducts();
  return products
    .filter((product) => product.id !== excludeId)
    .slice(0, limit)
    .map((product) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      imageUrls: product.imageUrls,
    }));
}

export const getProductBySlug = cache(async (slug: string) => {
  return unstable_cache(
    async () => {
      try {
        return await prisma.product.findFirst({
          where: { slug, published: true },
        });
      } catch {
        return null;
      }
    },
    ["product-by-slug", slug],
    { tags: [CACHE_TAGS.products], revalidate: DATA_REVALIDATE_SECONDS },
  )();
});

export const getPublishedPosts = unstable_cache(
  async (): Promise<BlogPostListItem[]> => {
    try {
      return await prisma.blogPost.findMany({
        where: { published: true },
        orderBy: { publishedAt: "desc" },
        select: blogPostListSelect,
      });
    } catch {
      return [];
    }
  },
  ["published-posts"],
  { tags: [CACHE_TAGS.posts], revalidate: DATA_REVALIDATE_SECONDS },
);

export const getPostBySlug = cache(async (slug: string) => {
  return unstable_cache(
    async () => {
      try {
        return await prisma.blogPost.findFirst({
          where: { slug, published: true },
        });
      } catch {
        return null;
      }
    },
    ["post-by-slug", slug],
    { tags: [CACHE_TAGS.posts], revalidate: DATA_REVALIDATE_SECONDS },
  )();
});

export const getPublishedTestimonials = unstable_cache(
  async (): Promise<TestimonialListItem[]> => {
    try {
      return await prisma.testimonial.findMany({
        where: { published: true },
        orderBy: { sortOrder: "asc" },
        select: testimonialListSelect,
      });
    } catch {
      return [];
    }
  },
  ["published-testimonials"],
  { tags: [CACHE_TAGS.testimonials], revalidate: DATA_REVALIDATE_SECONDS },
);

export const getSitemapEntries = unstable_cache(
  async () => {
    const [products, posts] = await Promise.all([
      prisma.product.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
        orderBy: { publishedAt: "desc" },
      }),
    ]);
    return { products, posts };
  },
  ["sitemap-entries"],
  {
    tags: [CACHE_TAGS.products, CACHE_TAGS.posts],
    revalidate: SITEMAP_REVALIDATE_SECONDS,
  },
);
