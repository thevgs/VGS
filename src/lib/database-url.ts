/**
 * Neon + Prisma connection string helpers.
 * @see https://neon.com/docs/guides/prisma
 *
 * Runtime (Prisma Client via HTTP adapter): DATABASE_URL — pooled hostname (-pooler)
 * CLI (db push, migrate):                   DIRECT_URL  — direct hostname (no -pooler)
 */

export function stripChannelBinding(url: string) {
  return url.replace(/[&?]channel_binding=[^&]*/g, "").replace(/\?&/, "?").replace(/&$/, "");
}

export function ensureSslModeRequire(url: string) {
  if (/[?&]sslmode=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}sslmode=require`;
}

export function ensureConnectTimeout(url: string, seconds = 15) {
  if (/[?&]connect_timeout=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}connect_timeout=${seconds}`;
}

/** Neon pooler + Prisma TCP engine on serverless (Vercel) needs pgbouncer=true. */
export function ensurePgBouncer(url: string) {
  if (!url.includes("-pooler.") || /[?&]pgbouncer=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}pgbouncer=true`;
}

/** One Prisma connection per serverless isolate — avoids connection storms on TCP. */
export function ensureConnectionLimit(url: string, limit = 1) {
  if (/[?&]connection_limit=/.test(url)) return url;
  return `${url}${url.includes("?") ? "&" : "?"}connection_limit=${limit}`;
}

function stripPrismaEngineParams(url: string) {
  return url
    .replace(/[&?]pgbouncer=[^&]*/g, "")
    .replace(/[&?]connection_limit=[^&]*/g, "")
    .replace(/[&?]connect_timeout=[^&]*/g, "")
    .replace(/[&?]pool_timeout=[^&]*/g, "")
    .replace(/\?&/, "?")
    .replace(/[?&]$/, "");
}

/** HTTP adapter URL — Neon fetch driver, no persistent TCP / Prisma engine params. */
export function getHttpDatabaseUrl(url = process.env.DATABASE_URL) {
  if (!url) return url;
  let normalized = stripChannelBinding(url);
  normalized = stripPrismaEngineParams(normalized);
  normalized = ensureSslModeRequire(normalized);
  return normalized;
}

/** Pooled URL for Prisma Client TCP fallback. */
export function getRuntimeDatabaseUrl(url = process.env.DATABASE_URL) {
  if (!url) return url;
  let normalized = stripChannelBinding(url);
  normalized = ensureSslModeRequire(normalized);
  normalized = ensureConnectTimeout(normalized);
  normalized = ensurePgBouncer(normalized);
  normalized = ensureConnectionLimit(normalized);
  return normalized;
}

/** Direct URL for Prisma CLI — falls back to DATABASE_URL without -pooler. */
export function getDirectDatabaseUrl(
  directUrl = process.env.DIRECT_URL,
  pooledUrl = process.env.DATABASE_URL,
) {
  const raw =
    directUrl ||
    (pooledUrl ? pooledUrl.replace("-pooler.", ".") : undefined);
  if (!raw) return raw;
  let normalized = stripChannelBinding(raw);
  normalized = ensureSslModeRequire(normalized);
  normalized = ensureConnectTimeout(normalized);
  return normalized;
}

export function assertPooledHostname(url: string | undefined) {
  if (process.env.NODE_ENV === "production" && url && !url.includes("-pooler.")) {
    console.warn(
      "[database] DATABASE_URL should use Neon pooled hostname (-pooler) for runtime connections.",
    );
  }
}
