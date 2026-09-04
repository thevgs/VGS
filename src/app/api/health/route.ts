import { NextResponse } from "next/server";
import { isCloudinaryConfigured } from "@/lib/cloudinary";

/** Public health check — env booleans only by default (no DB wake-ups). */
export async function GET(request: Request) {
  const deepCheck = new URL(request.url).searchParams.get("db") === "1";

  const checks = {
    jwtSecret: Boolean(process.env.JWT_SECRET),
    databaseUrl: Boolean(process.env.DATABASE_URL),
    directUrl: Boolean(process.env.DIRECT_URL),
    siteUrl:
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null),
    cloudinary: isCloudinaryConfigured(),
    database: false as boolean,
    adminUser: false as boolean,
    error: null as string | null,
  };

  if (deepCheck) {
    try {
      const { prisma } = await import("@/lib/prisma");
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
      const adminCount = await prisma.adminUser.count();
      checks.adminUser = adminCount > 0;
    } catch (error) {
      checks.error = error instanceof Error ? error.message : "Database connection failed";
    }
  }

  const ok =
    checks.jwtSecret &&
    checks.databaseUrl &&
    (deepCheck ? checks.database && checks.adminUser : true);

  return NextResponse.json(
    { ok, deepCheck, ...checks },
    { status: ok ? 200 : 503 },
  );
}
