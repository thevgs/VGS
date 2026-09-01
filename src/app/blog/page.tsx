import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { plainTextPreview } from "@/lib/sanitize-html";
import { getPublishedPosts } from "@/lib/queries";
import { buildPageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: `Blog | ${SITE.name}`,
  description: "Skincare tips, product reviews, and Vita Glow brand stories for brighter, healthier-looking skin.",
  path: "/blog",
});


/** @see PUBLIC_REVALIDATE_SECONDS in @/lib/cache */
export const revalidate = 3600;

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-muted">Journal</p>
      <h1 className="mt-3 font-display text-3xl text-ink sm:text-5xl">Blog</h1>
      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="overflow-hidden rounded-[1.5rem] border border-border bg-card"
          >
            <Link href={`/blog/${post.slug}`} className="relative block aspect-[16/10] bg-zinc-50">
              {post.coverImageUrl && (
                <Image
                  src={post.coverImageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              )}
            </Link>
            <div className="p-5">
              <time className="text-xs text-muted">
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              <h2 className="mt-2 font-display text-2xl">
                <Link href={`/blog/${post.slug}`} className="hover:text-ink">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted">
                {plainTextPreview(post.excerpt, 160)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
