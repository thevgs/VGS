import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CarouselSlideView } from "@/lib/admin-types";

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

export async function getPublishedCarouselSlides(): Promise<CarouselSlideView[]> {
  try {
    const slides = await prisma.carouselSlide.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    });
    if (slides.length === 0) return DEFAULT_CAROUSEL_SLIDES;
    return slides;
  } catch {
    return DEFAULT_CAROUSEL_SLIDES;
  }
}

export async function getPublishedProducts(): Promise<ProductListItem[]> {
  try {
    return await prisma.product.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      select: productListSelect,
    });
  } catch {
    return [];
  }
}

export async function getRelatedProducts(excludeId: string, limit = 3): Promise<RelatedProductItem[]> {
  try {
    return await prisma.product.findMany({
      where: { published: true, id: { not: excludeId } },
      orderBy: { sortOrder: "asc" },
      take: limit,
      select: relatedProductSelect,
    });
  } catch {
    return [];
  }
}

export const getProductBySlug = cache(async (slug: string) => {
  try {
    return await prisma.product.findFirst({
      where: { slug, published: true },
    });
  } catch {
    return null;
  }
});

export async function getPublishedPosts(limit?: number): Promise<BlogPostListItem[]> {
  try {
    return await prisma.blogPost.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: blogPostListSelect,
    });
  } catch {
    return [];
  }
}

export const getPostBySlug = cache(async (slug: string) => {
  try {
    return await prisma.blogPost.findFirst({
      where: { slug, published: true },
    });
  } catch {
    return null;
  }
});

export async function getPublishedTestimonials(): Promise<TestimonialListItem[]> {
  try {
    return await prisma.testimonial.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
      select: testimonialListSelect,
    });
  } catch {
    return [];
  }
}
