import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BlogPostingJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { RichContent } from "@/components/content/RichContent";
import { getPostBySlug, getPublishedPosts } from "@/lib/queries";
import { buildPageMetadata } from "@/lib/seo";

/** @see PUBLIC_REVALIDATE_SECONDS in @/lib/cache */
export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const posts = await getPublishedPosts();
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post not found" };

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;

  return buildPageMetadata({
    title,
    description,
    path: `/blog/${post.slug}`,
    image: post.coverImageUrl,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: post.title, path: `/blog/${post.slug}` },
        ]}
      />
      <BlogPostingJsonLd
        title={post.title}
        description={post.excerpt}
        slug={post.slug}
        publishedAt={post.publishedAt}
        image={post.coverImageUrl}
      />
      <article className="mx-auto max-w-3xl px-4 py-10 sm:py-16">
        <time className="text-xs uppercase tracking-wider text-muted">
          {new Date(post.publishedAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </time>
        <h1 className="mt-3 font-display text-4xl text-ink sm:text-5xl">{post.title}</h1>
        <p className="mt-4 text-lg text-muted">{post.excerpt}</p>
        {post.coverImageUrl && (
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[1.5rem] bg-cream">
            <Image
              src={post.coverImageUrl}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        )}
        <RichContent
          content={post.body}
          className="mt-10 text-base leading-relaxed text-ink/85"
        />
      </article>
    </>
  );
}
