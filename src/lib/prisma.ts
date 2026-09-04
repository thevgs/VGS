import { PrismaNeonHTTP } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import {
  assertPooledHostname,
  getHttpDatabaseUrl,
} from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = getHttpDatabaseUrl();
assertPooledHostname(databaseUrl);

function createPrismaClient() {
  if (!databaseUrl) {
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  // HTTP queries do not hold a TCP session, so Neon compute can idle after traffic stops.
  const adapter = new PrismaNeonHTTP(databaseUrl, {
    arrayMode: false,
    fullResults: true,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse client across serverless invocations (Vercel)
globalForPrisma.prisma = prisma;
