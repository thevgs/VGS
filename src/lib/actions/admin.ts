"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath, updateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import {
  AUTH_COOKIE,
  authCookieOptions,
  createAdminToken,
  hashPassword,
  isUnauthorized,
  requireAdmin,
  verifyPassword,
} from "@/lib/auth";
import { generateVerificationCode } from "@/lib/codes";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export type ActionResult = { error?: string; success?: boolean; published?: boolean };

function revalidateProductSitePaths(slug?: string | null) {
  updateTag(CACHE_TAGS.products);
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/products/${slug}`);
}

function revalidateBlogSitePaths(slug?: string | null) {
  updateTag(CACHE_TAGS.posts);
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin");
  if (slug) revalidatePath(`/blog/${slug}`);
}

function revalidateTestimonialSitePaths() {
  updateTag(CACHE_TAGS.testimonials);
  revalidatePath("/");
  revalidatePath("/reviews");
  revalidatePath("/admin");
}

function revalidateCarouselSitePaths() {
  updateTag(CACHE_TAGS.carousel);
  revalidatePath("/");
  revalidatePath("/admin");
}

export async function loginFormAction(
  _prevState: ActionResult | undefined,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") || "")
    .toLowerCase()
    .trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  if (!process.env.JWT_SECRET) {
    return { error: "Server misconfigured: JWT_SECRET is missing on Vercel." };
  }

  if (!process.env.DATABASE_URL) {
    return { error: "Server misconfigured: DATABASE_URL is missing on Vercel." };
  }

  try {
    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return { error: "Invalid login credentials." };
    }

    const token = await createAdminToken({ id: user.id, email: user.email });
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, token, authCookieOptions());

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message.includes("JWT_SECRET")) {
      return { error: "Server misconfigured: JWT_SECRET is invalid or missing." };
    }
    if (message.includes("Can't reach database") || message.includes("DATABASE_URL")) {
      return {
        error:
          "Cannot reach Neon database. On Vercel, set DATABASE_URL to the pooled Neon URL with sslmode=require.",
      };
    }
    return { error: "Login failed. Check Vercel env vars and Neon connection." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
  redirect("/admin/login");
}

export async function saveProductAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    const id = String(formData.get("id") || "");
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const usageInstructions = String(formData.get("usageInstructions") || "").trim();
    const imageUrl = String(formData.get("imageUrl") || "").trim();
    const metaTitle = String(formData.get("metaTitle") || "").trim() || null;
    const metaDescription = String(formData.get("metaDescription") || "").trim() || null;
    const sortOrder = Number(formData.get("sortOrder") || 0);
    const published = formData.get("published") === "on";
    const slug = slugify(String(formData.get("slug") || name));

    if (!name || !description || !slug) {
      return { error: "Name and description are required" };
    }

    const data = {
      name,
      slug,
      description,
      usageInstructions,
      imageUrls: imageUrl ? [imageUrl] : [],
      metaTitle,
      metaDescription,
      sortOrder,
      published,
    };

    if (id) {
      const existing = await prisma.product.findUnique({
        where: { id },
        select: { slug: true },
      });
      await prisma.product.update({ where: { id }, data });
      revalidateProductSitePaths(slug);
      if (existing && existing.slug !== slug) {
        revalidatePath(`/products/${existing.slug}`);
      }
    } else {
      await prisma.product.create({ data });
      revalidateProductSitePaths(slug);
    }

    return { success: true };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    console.error("saveProductAction:", error);
    return { error: "Could not save product. Check the database connection." };
  }
}

export async function toggleProductPublishedAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    const id = String(formData.get("id") || "");
    if (!id) return { error: "Missing id" };

    const product = await prisma.product.findUnique({
      where: { id },
      select: { published: true, slug: true },
    });
    if (!product) return { error: "Product not found" };

    const published = !product.published;
    await prisma.product.update({
      where: { id },
      data: { published },
    });

    revalidateProductSitePaths(product.slug);
    return { success: true, published };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    console.error("toggleProductPublishedAction:", error);
    return { error: "Could not update product visibility." };
  }
}

export async function deleteProductAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") || "");
    if (!id) return { error: "Missing id" };
    const existing = await prisma.product.findUnique({
      where: { id },
      select: { slug: true },
    });
    await prisma.product.delete({ where: { id } });
    revalidateProductSitePaths(existing?.slug);
    return { success: true };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    console.error("deleteProductAction:", error);
    return { error: "Could not delete product." };
  }
}

export async function saveBlogAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    const id = String(formData.get("id") || "");
    const title = String(formData.get("title") || "").trim();
    const excerpt = String(formData.get("excerpt") || "").trim();
    const body = String(formData.get("body") || "").trim();
    const coverImageUrl = String(formData.get("coverImageUrl") || "").trim() || null;
    const metaTitle = String(formData.get("metaTitle") || "").trim() || null;
    const metaDescription = String(formData.get("metaDescription") || "").trim() || null;
    const published = formData.get("published") === "on";
    const slug = slugify(String(formData.get("slug") || title));

    if (!title || !excerpt || !body || !slug) {
      return { error: "Title, excerpt, and body are required" };
    }

    const data = {
      title,
      slug,
      excerpt,
      body,
      coverImageUrl,
      metaTitle,
      metaDescription,
      published,
    };

    if (id) {
      await prisma.blogPost.update({ where: { id }, data });
    } else {
      await prisma.blogPost.create({ data });
    }

    revalidateBlogSitePaths(slug);
    return { success: true };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    console.error("saveBlogAction:", error);
    return { error: "Could not save post. Check the database connection." };
  }
}

export async function deleteBlogAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") || "");
    if (!id) return { error: "Missing id" };
    await prisma.blogPost.delete({ where: { id } });
    revalidateBlogSitePaths();
    return { success: true };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    console.error("deleteBlogAction:", error);
    return { error: "Could not delete post." };
  }
}

export async function saveTestimonialAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    const id = String(formData.get("id") || "");
    const author = String(formData.get("author") || "").trim();
    const body = String(formData.get("body") || "").trim();
    const sortOrder = Number(formData.get("sortOrder") || 0);
    const published = formData.get("published") === "on";

    if (!author || !body) return { error: "Author and body are required" };

    const data = { author, body, sortOrder, published };

    if (id) {
      await prisma.testimonial.update({ where: { id }, data });
    } else {
      await prisma.testimonial.create({ data });
    }

    revalidateTestimonialSitePaths();
    return { success: true };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    console.error("saveTestimonialAction:", error);
    return { error: "Could not save testimonial. Check the database connection." };
  }
}

export async function deleteTestimonialAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") || "");
    if (!id) return { error: "Missing id" };
    await prisma.testimonial.delete({ where: { id } });
    revalidateTestimonialSitePaths();
    return { success: true };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    console.error("deleteTestimonialAction:", error);
    return { error: "Could not delete testimonial." };
  }
}

export async function generateCodesAction(formData: FormData) {
  try {
    await requireAdmin();

    const productId = String(formData.get("productId") || "");
    const customerName = String(formData.get("customerName") || "").trim();
    const count = Math.max(1, Math.min(20000, Number(formData.get("count") || 1)));

    if (!productId || !customerName) {
      return { error: "Product and customer name are required" };
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return { error: "Product not found" };

    const generated: string[] = [];
    const batchSize = 500;

    while (generated.length < count) {
      const remaining = count - generated.length;
      const size = Math.min(batchSize, remaining);
      const codes = new Set<string>();
      while (codes.size < size) codes.add(generateVerificationCode());

      const candidates = Array.from(codes);
      const existing = await prisma.verificationCode.findMany({
        where: { code: { in: candidates } },
        select: { code: true },
      });
      const existingSet = new Set(existing.map((e) => e.code));
      const unique = candidates.filter((c) => !existingSet.has(c));
      if (unique.length === 0) continue;

      await prisma.verificationCode.createMany({
        data: unique.map((code) => ({
          code,
          customerName,
          productId,
          maxValidations: 3,
          validationCount: 0,
          status: "Active",
        })),
        skipDuplicates: true,
      });

      generated.push(...unique);
    }

    revalidatePath("/admin");
    return {
      success: true,
      codes: generated.slice(0, count),
      count: Math.min(generated.length, count),
      productName: product.name,
      customerName,
    };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    console.error("generateCodesAction:", error);
    return { error: "Could not generate codes. Check the database connection." };
  }
}

export async function searchCodeAction(formData: FormData) {
  try {
    await requireAdmin();
    const code = String(formData.get("code") || "")
      .trim()
      .toUpperCase();
    if (!code) return { error: "Code is required" };

    const result = await prisma.verificationCode.findUnique({
      where: { code },
      include: { product: { select: { name: true } } },
    });

    if (!result) return { error: "Code not found" };
    return { result };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    console.error("searchCodeAction:", error);
    return { error: "Could not search code." };
  }
}

export async function updateCodeStatusAction(formData: FormData) {
  try {
    await requireAdmin();
    const id = String(formData.get("id") || "");
    const status = String(formData.get("status") || "");
    if (!id || (status !== "Active" && status !== "Expired")) {
      return { error: "Invalid status" };
    }
    await prisma.verificationCode.update({ where: { id }, data: { status } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    console.error("updateCodeStatusAction:", error);
    return { error: "Could not update code status." };
  }
}

export async function changePasswordAction(formData: FormData) {
  try {
    const user = await requireAdmin();
    const password = String(formData.get("password") || "");
    if (password.length < 8) return { error: "Password must be at least 8 characters" };
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    });
    return { success: true };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    return { error: "Could not change password." };
  }
}

export async function saveCarouselSlideAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    const id = String(formData.get("id") || "");
    const title = String(formData.get("title") || "").trim();
    const subtitle = String(formData.get("subtitle") || "").trim();
    const ctaLabel = String(formData.get("ctaLabel") || "").trim();
    const ctaHref = String(formData.get("ctaHref") || "").trim();
    const secondaryCtaLabel = String(formData.get("secondaryCtaLabel") || "").trim() || null;
    const secondaryCtaHref = String(formData.get("secondaryCtaHref") || "").trim() || null;
    const imageUrl = String(formData.get("imageUrl") || "").trim() || null;
    const imageAlt = String(formData.get("imageAlt") || "").trim() || null;
    const sortOrder = Number(formData.get("sortOrder") || 0);
    const published = formData.get("published") === "on";

    if (!title || !subtitle || !ctaLabel || !ctaHref) {
      return { error: "Title, subtitle, and primary button are required" };
    }

    const data = {
      title,
      subtitle,
      ctaLabel,
      ctaHref,
      secondaryCtaLabel,
      secondaryCtaHref,
      imageUrl,
      imageAlt,
      sortOrder,
      published,
    };

    if (id) {
      await prisma.carouselSlide.update({ where: { id }, data });
    } else {
      await prisma.carouselSlide.create({ data });
    }

    revalidateCarouselSitePaths();
    return { success: true };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    console.error("saveCarouselSlideAction:", error);
    return { error: "Could not save carousel slide." };
  }
}

export async function deleteCarouselSlideAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const id = String(formData.get("id") || "");
    if (!id) return { error: "Missing id" };
    await prisma.carouselSlide.delete({ where: { id } });
    revalidateCarouselSitePaths();
    return { success: true };
  } catch (error) {
    if (isUnauthorized(error)) return { error: "Session expired. Please log in again." };
    console.error("deleteCarouselSlideAction:", error);
    return { error: "Could not delete carousel slide." };
  }
}
