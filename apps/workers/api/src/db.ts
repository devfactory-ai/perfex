// Database connection setup for Cloudflare Workers
import { drizzle } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import * as schema from '@perfex/database';

// Singleton instance
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Initialize the database connection
 * Must be called at the start of each request
 */
export function initializeDb(d1: D1Database) {
  dbInstance = drizzle(d1, { schema });
  return dbInstance;
}

/**
 * Get the current database instance
 * Throws if not initialized
 */
export function getDb() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initializeDb first.');
  }
  return dbInstance;
}

/**
 * Export for use in services
 * Note: This will throw if accessed before initialization
 */
export const drizzleDb = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    if (!dbInstance) {
      throw new Error('Database not initialized. Call initializeDb first.');
    }
    return (dbInstance as any)[prop];
  }
});

/**
 * Type helper for the database instance
 */
export type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;
