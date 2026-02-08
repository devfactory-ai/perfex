/**
 * Perfex API Worker
 * Main entry point for the Hono.js API
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { logger } from './utils/logger';
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
import companiesRoutes from './routes/companies';
import contactsRoutes from './routes/contacts';
import pipelineRoutes from './routes/pipeline';
import opportunitiesRoutes from './routes/opportunities';
import projectsRoutes from './routes/projects';
import inventoryRoutes from './routes/inventory';
import hrRoutes from './routes/hr';
import procurementRoutes from './routes/procurement';
import salesRoutes from './routes/sales';
import manufacturingRoutes from './routes/manufacturing';
import assetsRoutes from './routes/assets';
import notificationsRoutes from './routes/notifications';
import documentsRoutes from './routes/documents';
import workflowsRoutes from './routes/workflows';
import aiRoutes from './routes/ai';
import auditRoutes from './routes/audit';
import modulesRoutes from './routes/modules';
import recipesRoutes from './routes/recipes';
import traceabilityRoutes from './routes/traceability';
import payrollRoutes from './routes/payroll';
import integrationsRoutes from './routes/integrations';
import dialyseRoutes from './routes/dialyse';
import cardiologyRoutes from './routes/cardiology';
import ophthalmologyRoutes from './routes/ophthalmology';
import calculatorsRoutes from './routes/healthcare-calculators';
import healthcareAnalyticsRoutes from './routes/healthcare-analytics';
import healthcareIntegrationsRoutes from './routes/healthcare-integrations';
import cdssRoutes from './routes/cdss';
import patientPortalRoutes from './routes/patient-portal';
import clinicalAiRoutes from './routes/clinical-ai';
import fhirRoutes from './routes/fhir';
import rpmRoutes from './routes/rpm';
import imagingAiRoutes from './routes/imaging-ai';
import populationHealthRoutes from './routes/population-health';
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
      // Reject requests without origin (except for same-origin requests)
      if (!origin) {
        return null;
      }

      // In development, allow localhost
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return origin;
      }

      // Allow specific Cloudflare Pages deployments (strict pattern matching)
      const allowedPagesPatterns = [
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

      // SECURITY: Reject unknown origins instead of returning fallback
      return allowedOrigins.includes(origin) ? origin : null;
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Organization-Id', 'X-CSRF-Token'],
    maxAge: 86400,
  })
);

// Pretty JSON in development (disabled - causes issues with body parsing)
// app.use('*', prettyJSON());

// CSRF Protection - Protects against Cross-Site Request Forgery
// Excludes: login, register, refresh, forgot-password, reset-password, health, test
app.use('/api/v1/*', csrfMiddleware());

// Set CSRF token after authentication
app.use('/api/v1/*', setCsrfToken());

// Global API Rate Limiting - 100 requests per minute per user/IP
// Excludes: auth routes (have their own stricter limits), health check, test endpoint
app.use('/api/v1/*', apiRateLimitMiddleware(RATE_LIMITS.API_AUTH));

/**
 * Health check endpoint
 */
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    service: 'perfex-api',
    version: '0.1.0',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
  });
});

/**
 * API v1 routes
 */
const apiV1 = new Hono<{ Bindings: Env }>();

// Enhanced health check with actual connectivity tests
apiV1.get('/health', async (c) => {
  const startTime = Date.now();
  const checks: {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    latency?: number;
    message?: string;
  }[] = [];

  // Test database connectivity
  if (c.env.DB) {
    const dbStart = Date.now();
    try {
      await c.env.DB.prepare('SELECT 1 as test').first();
      checks.push({
        name: 'database',
        status: 'healthy',
        latency: Date.now() - dbStart,
      });
    } catch (error) {
      checks.push({
        name: 'database',
        status: 'unhealthy',
        latency: Date.now() - dbStart,
        message: error instanceof Error ? error.message : 'Connection failed',
      });
    }
  } else {
    checks.push({ name: 'database', status: 'unhealthy', message: 'Not configured' });
  }

  // Test KV cache connectivity
  if (c.env.CACHE) {
    const cacheStart = Date.now();
    try {
      const testKey = `health_check_${Date.now()}`;
      await c.env.CACHE.put(testKey, 'ok', { expirationTtl: 1 });
      await c.env.CACHE.delete(testKey);
      checks.push({
        name: 'cache',
        status: 'healthy',
        latency: Date.now() - cacheStart,
      });
    } catch (error) {
      checks.push({
        name: 'cache',
        status: 'degraded',
        latency: Date.now() - cacheStart,
        message: error instanceof Error ? error.message : 'Cache test failed',
      });
    }
  } else {
    checks.push({ name: 'cache', status: 'degraded', message: 'Not configured' });
  }

  // Test sessions KV
  if (c.env.SESSIONS) {
    const sessionsStart = Date.now();
    try {
      const testKey = `session_health_${Date.now()}`;
      await c.env.SESSIONS.put(testKey, 'ok', { expirationTtl: 1 });
      await c.env.SESSIONS.delete(testKey);
      checks.push({
        name: 'sessions',
        status: 'healthy',
        latency: Date.now() - sessionsStart,
      });
    } catch (error) {
      checks.push({
        name: 'sessions',
        status: 'degraded',
        latency: Date.now() - sessionsStart,
        message: error instanceof Error ? error.message : 'Sessions test failed',
      });
    }
  } else {
    checks.push({ name: 'sessions', status: 'degraded', message: 'Not configured' });
  }

  // Determine overall status
  const hasUnhealthy = checks.some((c) => c.status === 'unhealthy');
  const hasDegraded = checks.some((c) => c.status === 'degraded');
  const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

  const response = {
    status: overallStatus,
    version: '1.0.0',
    environment: c.env.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
    totalLatency: Date.now() - startTime,
    checks,
  };

  // Return appropriate status code
  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;
  return c.json(response, statusCode);
});

// Test endpoint for debugging
apiV1.post('/test', async (c) => {
  try {
    const body = await c.req.json();
    return c.json({ success: true, received: body });
  } catch (error) {
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 400);
  }
});

// Mount auth routes
apiV1.route('/auth', authRoutes);

// Mount organization routes
apiV1.route('/organizations', organizationsRoutes);

// Mount role routes
apiV1.route('/roles', rolesRoutes);

// Mount finance routes
apiV1.route('/accounts', accountsRoutes);
apiV1.route('/journals', journalsRoutes);
apiV1.route('/journal-entries', journalEntriesRoutes);
apiV1.route('/invoices', invoicesRoutes);
apiV1.route('/payments', paymentsRoutes);
apiV1.route('/bank-accounts', bankAccountsRoutes);
apiV1.route('/reports', reportsRoutes);

// Mount CRM routes
apiV1.route('/companies', companiesRoutes);
apiV1.route('/contacts', contactsRoutes);
apiV1.route('/pipeline', pipelineRoutes);
apiV1.route('/opportunities', opportunitiesRoutes);

// Mount Projects routes
apiV1.route('/projects', projectsRoutes);

// Mount Inventory routes
apiV1.route('/inventory', inventoryRoutes);

// Mount HR routes
apiV1.route('/hr', hrRoutes);

// Mount Procurement routes
apiV1.route('/procurement', procurementRoutes);

// Mount Sales routes
apiV1.route('/sales', salesRoutes);

// Mount Manufacturing routes
apiV1.route('/manufacturing', manufacturingRoutes);

// Mount Assets routes
apiV1.route('/assets', assetsRoutes);

// Mount Notifications routes
apiV1.route('/notifications', notificationsRoutes);

// Mount Documents routes
apiV1.route('/documents', documentsRoutes);

// Mount Workflows routes
apiV1.route('/workflows', workflowsRoutes);

// Mount AI routes
apiV1.route('/ai', aiRoutes);

// Mount Audit routes (Smart Audit System)
apiV1.route('/audit', auditRoutes);

// Mount Modules routes (Module activation system)
apiV1.route('/modules', modulesRoutes);

// Mount Recipes routes (Recipe management for bakeries)
apiV1.route('/recipes', recipesRoutes);

// Mount Traceability routes (Lot tracking and HACCP)
apiV1.route('/traceability', traceabilityRoutes);

// Mount Payroll routes (French payroll system)
apiV1.route('/payroll', payrollRoutes);

// Mount Integrations routes (Tunisian market connectors)
apiV1.route('/integrations', integrationsRoutes);

// Mount Dialyse routes (Healthcare - Dialysis module)
apiV1.route('/dialyse', dialyseRoutes);

// Mount Cardiology routes (Healthcare - Cardiology module)
apiV1.route('/cardiology', cardiologyRoutes);

// Mount Ophthalmology routes (Healthcare - Ophthalmology module)
apiV1.route('/ophthalmology', ophthalmologyRoutes);

// Mount Healthcare Calculators routes (Clinical calculators for all modules)
apiV1.route('/calculators', calculatorsRoutes);

// Mount Healthcare Analytics routes (Dashboard analytics and reports)
apiV1.route('/healthcare/analytics', healthcareAnalyticsRoutes);

// Mount Healthcare Integrations routes (SMS, FHIR, Lab connectors)
apiV1.route('/healthcare/integrations', healthcareIntegrationsRoutes);

// Mount CDSS routes (Clinical Decision Support System)
apiV1.route('/cdss', cdssRoutes);

// Mount Patient Portal routes (Patient-facing API)
apiV1.route('/patient-portal', patientPortalRoutes);

// Mount Clinical AI routes (AI-powered clinical assistance)
apiV1.route('/clinical-ai', clinicalAiRoutes);

// Mount FHIR R4 routes (HL7 FHIR Interoperability)
apiV1.route('/fhir', fhirRoutes);

// Mount RPM routes (Remote Patient Monitoring)
apiV1.route('/rpm', rpmRoutes);

// Mount Imaging AI routes (AI-powered diagnostic imaging analysis)
apiV1.route('/imaging-ai', imagingAiRoutes);

// Mount Population Health routes (Predictive analytics and quality indicators)
apiV1.route('/population-health', populationHealthRoutes);

// Mount API Documentation routes
apiV1.route('/docs', docsRoutes);

// Mount OpenAPI/Swagger Documentation
apiV1.route('/', openapi);

// Mount API routes
app.route('/api/v1', apiV1);

/**
 * 404 handler
 */
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found',
        path: c.req.path,
      },
    },
    404
  );
});

/**
 * Error handler with proper error classification
 */
app.onError((err, c) => {
  const isProduction = c.env.ENVIRONMENT === 'production';

  // Determine error type and status code
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';

  const errorMessage = err.message.toLowerCase();

  // Map common error patterns to appropriate HTTP status codes
  if (errorMessage.includes('not found') || errorMessage.includes('no such')) {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
    message = isProduction ? 'Resource not found' : err.message;
  } else if (errorMessage.includes('unauthorized') || errorMessage.includes('invalid token') || errorMessage.includes('authentication')) {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
    message = isProduction ? 'Authentication required' : err.message;
  } else if (errorMessage.includes('forbidden') || errorMessage.includes('permission') || errorMessage.includes('access denied')) {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
    message = isProduction ? 'Access denied' : err.message;
  } else if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = isProduction ? 'Invalid request' : err.message;
  } else if (errorMessage.includes('conflict') || errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
    statusCode = 409;
    errorCode = 'CONFLICT';
    message = isProduction ? 'Resource conflict' : err.message;
  } else {
    message = isProduction ? 'An unexpected error occurred' : err.message;
  }

  // Log error with context
  logger.error('Request error', {
    error: err,
    path: c.req.path,
    method: c.req.method,
    statusCode,
    errorCode,
  });

  return c.json(
    {
      error: {
        code: errorCode,
        message,
        ...(!isProduction && { stack: err.stack }),
      },
    },
    statusCode as any
  );
});

/**
 * Export the worker with scheduled handler
 */
export default {
  /**
   * HTTP fetch handler - Hono app
   */
  fetch: app.fetch,

  /**
   * Scheduled event handler - Cron triggers
   */
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const scheduledService = new ScheduledService(env);
    ctx.waitUntil(scheduledService.handleScheduledEvent(event));
  },
};
