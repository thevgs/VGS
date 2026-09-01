import type { Metadata } from "next";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { getPublishedTestimonials } from "@/lib/queries";
import { buildPageMetadata } from "@/lib/seo";
import { SITE } from "@/lib/site";

export const metadata: Metadata = buildPageMetadata({
  title: `Reviews | ${SITE.name}`,
  description: "Customer testimonials for Vita Glow skin whitening products.",
  path: "/reviews",
});

/** @see PUBLIC_REVALIDATE_SECONDS in @/lib/cache */
export const revalidate = 3600;

export default async function ReviewsPage() {
  const testimonials = await getPublishedTestimonials();

  return (
    <div className="pt-8">
      <TestimonialsSection testimonials={testimonials} />
    </div>
  );
}
