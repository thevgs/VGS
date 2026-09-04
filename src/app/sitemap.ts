import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/queries";
import { absoluteUrl } from "@/lib/seo";

/** @see SITEMAP_REVALIDATE_SECONDS in @/lib/cache */
export const revalidate = 86400;

type SitemapEntry = MetadataRoute.Sitemap[number];

const STATIC_PAGES: Array<{
  path: string;
  changeFrequency: SitemapEntry["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/products", changeFrequency: "weekly", priority: 0.9 },
  { path: "/verify", changeFrequency: "monthly", priority: 0.85 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/reviews", changeFrequency: "monthly", priority: 0.65 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  try {
    const { products, posts } = await getSitemapEntries();

    return [
      ...staticRoutes,
      ...products.map((product) => ({
        url: absoluteUrl(`/products/${product.slug}`),
        lastModified: product.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.85,
      })),
      ...posts.map((post) => ({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: post.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
    ];
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return staticRoutes;
  }
}
