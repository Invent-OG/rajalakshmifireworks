import { db } from '@/db';
import { categories, products, settings } from '@/db/schema';
import { eq, and, asc, desc } from 'drizzle-orm';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const TTL_MS = 60 * 1000; // 60-second memory cache TTL

let cachedCategories: CacheEntry<any[]> | null = null;
let cachedAllActiveProducts: CacheEntry<any[]> | null = null;
let cachedSettingsMap: CacheEntry<Map<string, string>> | null = null;
let cachedHeroConfig: CacheEntry<string | null> | null = null;

/**
 * Invalidate all catalog memory caches (called on admin updates / imports)
 */
export function invalidateCatalogCache(): void {
  cachedCategories = null;
  cachedAllActiveProducts = null;
  cachedSettingsMap = null;
  cachedHeroConfig = null;
}

/**
 * Helper to retry a database query up to 2 times for transient DNS or connection drops
 */
async function queryWithRetry<T>(fn: () => Promise<T>, retries = 2, delayMs = 250): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err?.code === 'ENOTFOUND' ||
        err?.code === 'ECONNRESET' ||
        err?.code === 'ETIMEDOUT' ||
        err?.code === 'EAI_AGAIN' ||
        err?.message?.includes('ENOTFOUND') ||
        err?.message?.includes('Connection terminated');

      if (attempt < retries && isTransient) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        continue;
      }
      break;
    }
  }
  throw lastError;
}

/**
 * Get all active categories with 60s memory caching and resilient error fallback
 */
export async function getCachedCategories(): Promise<any[]> {
  const now = Date.now();
  if (cachedCategories && now - cachedCategories.timestamp < TTL_MS) {
    return cachedCategories.data;
  }

  try {
    const data = await queryWithRetry(() =>
      db.query.categories.findMany({
        where: eq(categories.isActive, true),
        orderBy: (c, { asc }) => [asc(c.sortOrder), asc(c.name)],
      })
    );
    cachedCategories = { data, timestamp: now };
    return data;
  } catch (error) {
    console.warn('[catalog-cache] Failed to fetch categories from database (transient network/db issue):', error instanceof Error ? error.message : error);
    if (cachedCategories) return cachedCategories.data;
    return [];
  }
}

/**
 * Get all active products (with media and category) with 60s memory caching and resilient error fallback
 */
export async function getCachedAllActiveProducts(): Promise<any[]> {
  const now = Date.now();
  if (cachedAllActiveProducts && now - cachedAllActiveProducts.timestamp < TTL_MS) {
    return cachedAllActiveProducts.data;
  }

  try {
    const data = await queryWithRetry(() =>
      db.query.products.findMany({
        where: eq(products.isActive, true),
        with: {
          category: true,
          media: {
            orderBy: (m, { asc }) => [asc(m.sortOrder)],
            limit: 1,
          },
        },
        orderBy: [desc(products.createdAt)],
      })
    );
    cachedAllActiveProducts = { data, timestamp: now };
    return data;
  } catch (error) {
    console.warn('[catalog-cache] Failed to fetch active products from database (transient network/db issue):', error instanceof Error ? error.message : error);
    if (cachedAllActiveProducts) return cachedAllActiveProducts.data;
    return [];
  }
}

/**
 * Get store settings map with 60s memory caching
 */
export async function getCachedSettingsMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (cachedSettingsMap && now - cachedSettingsMap.timestamp < TTL_MS) {
    return cachedSettingsMap.data;
  }

  try {
    const rows = await queryWithRetry(() => db.query.settings.findMany());
    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.key && r.value !== undefined) {
        map.set(r.key, r.value);
      }
    }
    cachedSettingsMap = { data: map, timestamp: now };
    return map;
  } catch (error) {
    console.warn('[catalog-cache] Failed to fetch settings from database:', error instanceof Error ? error.message : error);
    if (cachedSettingsMap) return cachedSettingsMap.data;
    return new Map<string, string>();
  }
}

/**
 * Get HERO_SLIDES_CONFIG setting with caching
 */
export async function getCachedHeroConfig(): Promise<string | null> {
  const now = Date.now();
  if (cachedHeroConfig && now - cachedHeroConfig.timestamp < TTL_MS) {
    return cachedHeroConfig.data;
  }

  try {
    const row = await queryWithRetry(() =>
      db.query.settings.findFirst({
        where: eq(settings.key, 'HERO_SLIDES_CONFIG'),
      })
    );
    const val = row?.value ?? null;
    cachedHeroConfig = { data: val, timestamp: now };
    return val;
  } catch (error) {
    console.warn('[catalog-cache] Failed to fetch hero config from database:', error instanceof Error ? error.message : error);
    if (cachedHeroConfig) return cachedHeroConfig.data;
    return null;
  }
}
