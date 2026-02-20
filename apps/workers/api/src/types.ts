/**
 * Type definitions for the API worker
 */

/**
 * Environment bindings type
 */
export interface Env {
  // Database
  DB: D1Database;

  // KV Namespaces
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;

  // AI
  AI: Ai;

  // Vectorize
  VECTORIZE: VectorizeIndex;

  // Queue
  JOBS: Queue;

  // R2 (when enabled)
  // STORAGE: R2Bucket;

  // Environment variables
  ENVIRONMENT: string;
  LOG_LEVEL: string;

  // Secrets (set via wrangler secret)
  JWT_SECRET: string;

  // SMS Integration (Twilio)
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_FROM_NUMBER?: string;

  // Lab Integration
  LAB_API_ENDPOINT?: string;
  LAB_API_KEY?: string;

  // Email Integration (Resend)
  RESEND_API_KEY?: string;

  // Seed key for demo environments
  SEED_SECRET_KEY?: string;
}
