/** ISR TTL for public HTML — admin saves bust cache via revalidatePath immediately. */
export const PUBLIC_REVALIDATE_SECONDS = 3600;

/** Sitemap changes rarely; crawlers do not need fresh DB reads every hour. */
export const SITEMAP_REVALIDATE_SECONDS = 86400;

/**
 * Cross-request data cache for Prisma reads.
 * Admin mutations call `updateTag` so the next visit fetches fresh rows.
 * Next.js segment config still requires literal `export const revalidate = N` in route files.
 */
export const DATA_REVALIDATE_SECONDS = 86400;

export const CACHE_TAGS = {
  products: "catalog-products",
  posts: "catalog-posts",
  testimonials: "catalog-testimonials",
  carousel: "catalog-carousel",
} as const;
