/**
 * Redis cache layer via Upstash.
 *
 * Environment variables required (add to .env.local for dev, Vercel for prod):
 *   UPSTASH_REDIS_REST_URL=https://...
 *   UPSTASH_REDIS_REST_TOKEN=...
 *
 * If the variables are missing, all cache calls are no-ops so the app
 * continues to work without Redis (just slower).
 */

import { Redis } from "@upstash/redis";

// ─── TTLs (seconds) ──────────────────────────────────────────
export const TTL = {
  adminKpis:    5 * 60,   // 5 min  — KPI dashboard counters
  adminCharts:  10 * 60,  // 10 min — chart time-series data
  spotDetail:   30 * 60,  // 30 min — public spot page
  spotSearch:   5 * 60,   // 5 min  — search results
  homeStats:    15 * 60,  // 15 min — landing page spot count
} as const;

// ─── Singleton ───────────────────────────────────────────────
let _redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;          // graceful degradation
  _redis = new Redis({ url, token });
  return _redis;
}

// ─── Cache helpers ───────────────────────────────────────────

/**
 * Read a cached value. Returns null on miss or if Redis is unavailable.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedis();
    if (!redis) return null;
    const raw = await redis.get<T>(key);
    return raw ?? null;
  } catch {
    return null;
  }
}

/**
 * Write a value to cache with a TTL in seconds.
 */
export async function cacheSet<T>(key: string, value: T, ttl: number): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.set(key, value, { ex: ttl });
  } catch {
    // ignore write errors — always serve fresh data as fallback
  }
}

/**
 * Delete one or more cache keys.
 */
export async function cacheDel(...keys: string[]): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) return;
    await redis.del(...keys);
  } catch {
    // ignore
  }
}

/**
 * Stale-while-revalidate pattern:
 * Returns cached value if present, otherwise calls `fn`, caches the result,
 * and returns it. On any error, falls back to calling `fn` uncached.
 */
export async function cachedOr<T>(
  key: string,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const fresh = await fn();
  void cacheSet(key, fresh, ttl);   // fire-and-forget
  return fresh;
}

// ─── Cache key factories ─────────────────────────────────────
export const CacheKeys = {
  adminKpis:        () => "admin:kpis",
  adminBookings30:  () => "admin:bookings:30d",
  adminRevenue30:   () => "admin:revenue:30d",
  adminAreas:       (n: number) => `admin:areas:${n}`,
  adminGrowth90:    () => "admin:growth:90d",
  spotDetail:       (id: string) => `spot:${id}`,
  spotSearch:       (lat: number, lng: number, r: number) =>
    `search:${lat.toFixed(3)}:${lng.toFixed(3)}:${r}`,
  homeSpotCount:    () => "home:spotcount",
} as const;
