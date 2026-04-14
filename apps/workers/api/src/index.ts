/**
 * Perfex Bakery API Worker
 * Main entry point for the Hono.js API
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { logger } from './utils/logger';
import { AppError } from './utils/errors';
import { initializeDb } from './db';
import { csrfMiddleware, setCsrfToken } from './middleware/csrf';
import { apiRateLimitMiddleware, RATE_LIMITS } from './utils/rate-limit';
import authRoutes from './routes/auth';
import organizationsRoutes from './routes/organizations';
import rolesRoutes from './routes/roles';
import accountsRoutes from './routes/accounts';
import journalsRoutes from './routes/journals';
import journalEntriesRoutes from './routes/journal-entries';
import invoicesRoutes from './routes/invoices';
import paymentsRoutes from './routes/payments';
import bankAccountsRoutes from './routes/bank-accounts';
import reportsRoutes from './routes/reports';
import inventoryRoutes from './routes/inventory';
import hrRoutes from './routes/hr';
import modulesRoutes from './routes/modules';
import recipesRoutes from './routes/recipes';
import traceabilityRoutes from './routes/traceability';
import integrationsRoutes from './routes/integrations';
import bakeryRoutes from './routes/bakery';
import adminRoutes from './routes/admin';
import seedRoutes from './routes/seed';
import { docs as docsRoutes } from './routes/docs';
import openapi from './openapi';
import type { Env } from './types';
import { ScheduledService } from './services/scheduled.service';

/**
 * Create and configure Hono app
 */
const app = new Hono<{ Bindings: Env }>();

/**
 * Global Middleware
 */

// Logging
app.use('*', honoLogger());

// Database initialization middleware
app.use('*', async (c, next) => {
  initializeDb(c.env.DB);
  await next();
});

// CORS - Strict origin validation
app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) {
        return null;
      }

      // In development, allow localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return origin;
      }

      // Allow Cloudflare Pages deployments
      const allowedPagesPatterns = [
        /^https:\/\/[a-z0-9-]+\.perfex-bakery\.pages\.dev$/,
        /^https:\/\/perfex-bakery\.pages\.dev$/,
        /^https:\/\/[a-z0-9-]+\.perfex-web(-dev|-staging)?\.pages\.dev$/,
        /^https:\/\/perfex-web(-dev|-staging)?\.pages\.dev$/,
      ];

      if (allowedPagesPatterns.some(pattern => pattern.test(origin))) {
        return origin;
      }

      // In production, only allow specific domains
      const allowedOrigins = [
        'https://app.perfex.com',
        'https://perfex.com',
        'https://dev.perfex-web-dev.pages.dev',
        'https://staging.perfex-web-staging.pages.dev',
        'https://perfex-web.pages.dev',
      ];

      return allowedOrigins.includes(origin) ? origin : null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'X-CSRF-Token'],
    maxAge: 86400,
  })
);

// CSRF Protection
app.use('/api/v1/*', csrfMiddleware());
app.use('/api/v1/*', setCsrfToken());

// Global API Rate Limiting
app.use('/api/v1/*', apiRateLimitMiddleware(RATE_LIMITS.API_AUTH));

/**
 * Health check endpoint
 */
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'perfex-bakery-api',
    version: '0.1.0',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

/**
 * API v1 routes
 */
const apiV1 = new Hono<{ Bindings: Env }>();

// Health check with connectivity tests
apiV1.get('/health', async (c) => {
  const startTime = Date.now();
  const checks: {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    latency?: number;
    message?: string;
  }[] = [];

  if (c.env.DB) {
    const dbStart = Date.now();
    try {
      await c.env.DB.prepare('SELECT 1 as test').first();
      checks.push({ name: 'database', status: 'healthy', latency: Date.now() - dbStart });
    } catch (error) {
      checks.push({ name: 'database', status: 'unhealthy', latency: Date.now() - dbStart, message: error instanceof Error ? error.message : 'Connection failed' });
    }
  } else {
    checks.push({ name: 'database', status: 'unhealthy', message: 'Not configured' });
  }

  if (c.env.CACHE) {
    const cacheStart = Date.now();
    try {
      const testKey = `health_check_${Date.now()}`;
      await c.env.CACHE.put(testKey, 'ok', { expirationTtl: 1 });
      await c.env.CACHE.delete(testKey);
      checks.push({ name: 'cache', status: 'healthy', latency: Date.now() - cacheStart });
    } catch (error) {
      checks.push({ name: 'cache', status: 'degraded', latency: Date.now() - cacheStart, message: error instanceof Error ? error.message : 'Cache test failed' });
    }
  } else {
    checks.push({ name: 'cache', status: 'degraded', message: 'Not configured' });
  }

  if (c.env.SESSIONS) {
    const sessionsStart = Date.now();
    try {
      const testKey = `session_health_${Date.now()}`;
      await c.env.SESSIONS.put(testKey, 'ok', { expirationTtl: 1 });
      await c.env.SESSIONS.delete(testKey);
      checks.push({ name: 'sessions', status: 'healthy', latency: Date.now() - sessionsStart });
    } catch (error) {
      checks.push({ name: 'sessions', status: 'degraded', latency: Date.now() - sessionsStart, message: error instanceof Error ? error.message : 'Sessions test failed' });
    }
  } else {
    checks.push({ name: 'sessions', status: 'degraded', message: 'Not configured' });
  }

  const hasUnhealthy = checks.some((c) => c.status === 'unhealthy');
  const hasDegraded = checks.some((c) => c.status === 'degraded');
  const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

  return c.json({
    status: overallStatus,
    version: '1.0.0',
    environment: c.env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
    totalLatency: Date.now() - startTime,
    checks,
  }, overallStatus === 'unhealthy' ? 503 : 200);
});

// Test endpoint
apiV1.post('/test', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({ success: true, received: body });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 400);
  }
});

// Auth
apiV1.route('/auth', authRoutes);

// Core
apiV1.route('/organizations', organizationsRoutes);
apiV1.route('/roles', rolesRoutes);
apiV1.route('/modules', modulesRoutes);

// Finance
apiV1.route('/accounts', accountsRoutes);
apiV1.route('/journals', journalsRoutes);
apiV1.route('/journal-entries', journalEntriesRoutes);
apiV1.route('/invoices', invoicesRoutes);
apiV1.route('/payments', paymentsRoutes);
apiV1.route('/bank-accounts', bankAccountsRoutes);
apiV1.route('/reports', reportsRoutes);

// Inventory & HR
apiV1.route('/inventory', inventoryRoutes);
apiV1.route('/hr', hrRoutes);

// Bakery
apiV1.route('/bakery', bakeryRoutes);
apiV1.route('/recipes', recipesRoutes);
apiV1.route('/traceability', traceabilityRoutes);
apiV1.route('/integrations', integrationsRoutes);

// Admin & Seed
apiV1.route('/admin', adminRoutes);
apiV1.route('/seed', seedRoutes);

// Documentation
apiV1.route('/docs', docsRoutes);
apiV1.route('/', openapi);

// Mount API routes
app.route('/api/v1', apiV1);

/**
 * 404 handler
 */
app.notFound((c) => {
  return c.json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found',
      path: c.req.path,
    },
  }, 404);
});

/**
 * Error handler
 */
app.onError((err, c) => {
  const isProduction = c.env.ENVIRONMENT === 'production';

  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.code;
    message = err.message;
  } else {
    const errorMessage = err.message.toLowerCase();
    if (errorMessage.includes('not found') || errorMessage.includes('no such')) {
      statusCode = 404; errorCode = 'NOT_FOUND'; message = isProduction ? 'Resource not found' : err.message;
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('invalid token') || errorMessage.includes('authentication')) {
      statusCode = 401; errorCode = 'UNAUTHORIZED'; message = isProduction ? 'Authentication required' : err.message;
    } else if (errorMessage.includes('forbidden') || errorMessage.includes('permission') || errorMessage.includes('access denied')) {
      statusCode = 403; errorCode = 'FORBIDDEN'; message = isProduction ? 'Access denied' : err.message;
    } else if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
      statusCode = 400; errorCode = 'VALIDATION_ERROR'; message = isProduction ? 'Invalid request' : err.message;
    } else if (errorMessage.includes('conflict') || errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      statusCode = 409; errorCode = 'CONFLICT'; message = isProduction ? 'Resource conflict' : err.message;
    } else {
      message = isProduction ? 'An unexpected error occurred' : err.message;
    }
  }

  logger.error('Request error', { error: err, path: c.req.path, method: c.req.method, statusCode, errorCode });

  return c.json({
    error: {
      code: errorCode,
      message,
      ...(!isProduction && { stack: err.stack }),
    },
  }, statusCode as any);
});

/**
 * Export the worker
 */
export default {
  fetch: app.fetch,

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const scheduledService = new ScheduledService(env);
    ctx.waitUntil(scheduledService.handleScheduledEvent(event));
  },
};
