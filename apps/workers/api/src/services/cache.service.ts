/**
 * Cache Service
 * Centralized caching layer using Cloudflare KV
 */

import { logger } from '../utils/logger';

/**
 * Cache key prefix for different data types
 */
export const CACHE_PREFIXES = {
  USER: 'user:',
  ORGANIZATION: 'org:',
  SESSION: 'session:',
  PATIENT: 'patient:',
  INVOICE: 'invoice:',
  DASHBOARD: 'dashboard:',
  STATS: 'stats:',
  LIST: 'list:',
  CONFIG: 'config:',
  RATE_LIMIT: 'rate:',
} as const;

/**
 * Cache TTL in seconds
 */
export const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,          // 1 hour
  DAY: 86400,          // 24 hours
  WEEK: 604800,        // 7 days
  SESSION: 86400,      // Session duration
  CONFIG: 3600,        // Config cache
  STATS: 300,          // Stats cache (5 min)
} as const;

/**
 * Cache entry metadata
 */
export interface CacheMetadata {
  createdAt: number;
  expiresAt?: number;
  version?: string;
  tags?: string[];
}

/**
 * Cache options
 */
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  version?: string;
}

/**
 * Cache Service class
 */
export class CacheService {
  private prefix: string;

  constructor(
    private kv: KVNamespace,
    prefix: string = ''
  ) {
    this.prefix = prefix;
  }

  /**
   * Generate cache key with prefix
   */
  private key(key: string): string {
    return this.prefix ? `${this.prefix}${key}` : key;
  }

  /**
   * Get value from cache
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(this.key(key), 'json');
      return value as T | null;
    } catch (error) {
      logger.warn('Cache get error', { key, error });
      return null;
    }
  }

  /**
   * Get value with metadata
   */
  async getWithMetadata<T = unknown>(
    key: string
  ): Promise<{ value: T | null; metadata: CacheMetadata | null }> {
    try {
      const result = await this.kv.getWithMetadata<T, CacheMetadata>(
        this.key(key),
        'json'
      );
      return {
        value: result.value,
        metadata: result.metadata,
      };
    } catch (error) {
      logger.warn('Cache getWithMetadata error', { key, error });
      return { value: null, metadata: null };
    }
  }

  /**
   * Set value in cache
   */
  async set<T = unknown>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    try {
      const { ttl = CACHE_TTL.MEDIUM, tags, version } = options;

      const metadata: CacheMetadata = {
        createdAt: Date.now(),
        expiresAt: ttl ? Date.now() + ttl * 1000 : undefined,
        version,
        tags,
      };

      await this.kv.put(this.key(key), JSON.stringify(value), {
        expirationTtl: ttl,
        metadata,
      });

      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      await this.kv.delete(this.key(key));
      return true;
    } catch (error) {
      logger.warn('Cache delete error', { key, error });
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Invalidate multiple keys by pattern
   */
  async invalidateByPrefix(prefix: string): Promise<number> {
    try {
      const list = await this.kv.list({ prefix: this.key(prefix) });
      let count = 0;

      for (const key of list.keys) {
        await this.kv.delete(key.name);
        count++;
      }

      return count;
    } catch (error) {
      logger.error('Cache invalidateByPrefix error', { prefix, error });
      return 0;
    }
  }

  /**
   * Invalidate by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    try {
      const list = await this.kv.list();
      let count = 0;

      for (const key of list.keys) {
        const metadata = key.metadata as CacheMetadata | undefined;
        if (metadata?.tags?.some((tag) => tags.includes(tag))) {
          await this.kv.delete(key.name);
          count++;
        }
      }

      return count;
    } catch (error) {
      logger.error('Cache invalidateByTags error', { tags, error });
      return 0;
    }
  }

  /**
   * Memoize a function with caching
   */
  memoize<TArgs extends unknown[], TResult>(
    fn: (...args: TArgs) => Promise<TResult>,
    keyGenerator: (...args: TArgs) => string,
    options: CacheOptions = {}
  ): (...args: TArgs) => Promise<TResult> {
    return async (...args: TArgs): Promise<TResult> => {
      const key = keyGenerator(...args);
      return this.getOrSet(key, () => fn(...args), options);
    };
  }
}

/**
 * Cache key builders
 */
export const CacheKeys = {
  user: (userId: string) => `${CACHE_PREFIXES.USER}${userId}`,

  organization: (orgId: string) => `${CACHE_PREFIXES.ORGANIZATION}${orgId}`,

  session: (sessionId: string) => `${CACHE_PREFIXES.SESSION}${sessionId}`,

  patient: (orgId: string, patientId: string) =>
    `${CACHE_PREFIXES.PATIENT}${orgId}:${patientId}`,

  patientList: (orgId: string, page: number, filters?: string) =>
    `${CACHE_PREFIXES.LIST}patients:${orgId}:${page}${filters ? `:${filters}` : ''}`,

  invoice: (orgId: string, invoiceId: string) =>
    `${CACHE_PREFIXES.INVOICE}${orgId}:${invoiceId}`,

  dashboardStats: (orgId: string, type: string) =>
    `${CACHE_PREFIXES.DASHBOARD}${orgId}:${type}`,

  stats: (orgId: string, entity: string) =>
    `${CACHE_PREFIXES.STATS}${orgId}:${entity}`,

  config: (orgId: string, key: string) =>
    `${CACHE_PREFIXES.CONFIG}${orgId}:${key}`,

  rateLimit: (key: string) => `${CACHE_PREFIXES.RATE_LIMIT}${key}`,
};

/**
 * Cache invalidation helpers
 */
export const CacheInvalidators = {
  /**
   * Invalidate all user-related cache
   */
  user: async (cache: CacheService, userId: string) => {
    await cache.delete(CacheKeys.user(userId));
  },

  /**
   * Invalidate organization cache
   */
  organization: async (cache: CacheService, orgId: string) => {
    await Promise.all([
      cache.delete(CacheKeys.organization(orgId)),
      cache.invalidateByPrefix(`${CACHE_PREFIXES.DASHBOARD}${orgId}`),
      cache.invalidateByPrefix(`${CACHE_PREFIXES.STATS}${orgId}`),
    ]);
  },

  /**
   * Invalidate patient cache
   */
  patient: async (
    cache: CacheService,
    orgId: string,
    patientId: string
  ) => {
    await Promise.all([
      cache.delete(CacheKeys.patient(orgId, patientId)),
      cache.invalidateByPrefix(`${CACHE_PREFIXES.LIST}patients:${orgId}`),
      cache.delete(CacheKeys.stats(orgId, 'patients')),
    ]);
  },

  /**
   * Invalidate invoice cache
   */
  invoice: async (
    cache: CacheService,
    orgId: string,
    invoiceId: string
  ) => {
    await Promise.all([
      cache.delete(CacheKeys.invoice(orgId, invoiceId)),
      cache.invalidateByPrefix(`${CACHE_PREFIXES.LIST}invoices:${orgId}`),
      cache.delete(CacheKeys.stats(orgId, 'invoices')),
      cache.delete(CacheKeys.dashboardStats(orgId, 'finance')),
    ]);
  },
};

/**
 * Factory to create cache service from environment
 */
export function createCacheService(
  kv: KVNamespace,
  prefix: string = 'perfex:'
): CacheService {
  return new CacheService(kv, prefix);
}
