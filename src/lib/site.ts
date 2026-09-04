export const SITE = {
  name: "Vita Glow",
  legalName: "Vita Glow Products",
  tagline: "Natural glow. Fairer skin. Real results.",
  description:
    "Vita Glow Products is an international skincare brand offering glutathione night creams, capsules, and soaps made with natural herbs for a fair, pink, glowing complexion.",
  email: process.env.NEXT_PUBLIC_EMAIL || "info@thevitaglowcosmetics.com",
  phone: process.env.NEXT_PUBLIC_PHONE || "+971562717889",
  phoneDisplay: process.env.NEXT_PUBLIC_PHONE_DISPLAY || "+971 56 271 7889",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || "971562717889",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  logoUrl:
    process.env.NEXT_PUBLIC_LOGO_URL ||
    "https://res.cloudinary.com/rzkuraxy/image/upload/v1786447739/logoVitaglow.png",
  copyright: "Vita Glow Products",
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Products", href: "/products" },
  { label: "Blog", href: "/blog" },
  { label: "Reviews", href: "/reviews" },
  { label: "Contact Us", href: "/contact" },
] as const;

export const ABOUT_CONTENT = {
  title: "Know About Us",
  intro:
    "Vita Glow Products is a pioneering international brand in the skincare industry with a growing base of long-term customers.",
  body: [
    "We have earned trust through customer satisfaction and accurate results. Almost all our customers are regular repeat and long-term users.",
    "All our skin whitening products are made from natural herbs. They help you achieve a fair, pink complexion with a natural glow. Both men and women can use our products.",
    "Vita Glow Night Cream and our wider whitening range use ingredients such as Glutathione, Vitamin C, Avocado, Jojoba Oil, Mulberry Extract, and Kojic Acid — working together for satisfying results with zero side effects when used as directed.",
  ],
} as const;

export const FAQ_ITEMS = [
  {
    q: "How do I verify my product is authentic?",
    a: "Enter the verification code printed on your packaging on our Verify page. Genuine codes confirm authenticity. Need help? Message us on WhatsApp.",
  },
  {
    q: "Who can use Vita Glow products?",
    a: "Our creams, soaps, and capsules are formulated for both men and women across oily, dry, and normal skin types.",
  },
  {
    q: "How long before I see results?",
    a: "Results vary by product and skin type. Many customers notice visible improvement within days to a few weeks with consistent use.",
  },
  {
    q: "Are Vita Glow products natural?",
    a: "Yes. Our formulas are built around natural herbs and skin-loving actives including Glutathione, Vitamin C, and botanical extracts.",
  },
] as const;

export function whatsappUrl(message?: string) {
  const text = encodeURIComponent(
    message || `Hello ${SITE.name}, I would like to know more about your products.`,
  );
  return `https://wa.me/${SITE.whatsapp}?text=${text}`;
}

export function telUrl() {
  return `tel:${SITE.phone.replace(/\s/g, "")}`;
}
