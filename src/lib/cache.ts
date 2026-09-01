/** ISR TTL for public pages — admin saves bust cache via revalidatePath immediately. */
export const PUBLIC_REVALIDATE_SECONDS = 3600;

/** Sitemap changes rarely; crawlers do not need fresh DB reads every hour. */
export const SITEMAP_REVALIDATE_SECONDS = 86400;

/** Next.js segment config requires literal `export const revalidate = N` in route files. */
