/**
 * Monitoring and Error Tracking
 * Integration with Sentry for error reporting
 */

import { logger } from './logger';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * Error context
 */
export interface ErrorContext {
  userId?: string;
  organizationId?: string;
  action?: string;
  requestId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  extra?: Record<string, any>;
}

/**
 * Performance span
 */
export interface PerformanceSpan {
  name: string;
  startTime: number;
  endTime?: number;
  status?: 'ok' | 'error';
  data?: Record<string, any>;
}

/**
 * Initialize monitoring (Sentry-like interface)
 */
export class MonitoringService {
  private dsn: string | null;
  private environment: string;
  private enabled: boolean;
  private sampleRate: number;
  private spans: Map<string, PerformanceSpan> = new Map();

  constructor(options: {
    dsn?: string;
    environment?: string;
    sampleRate?: number;
  }) {
    this.dsn = options.dsn || null;
    this.environment = options.environment || 'development';
    this.enabled = !!options.dsn;
    this.sampleRate = options.sampleRate || 1.0;
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: ErrorContext): string {
    const eventId = crypto.randomUUID();

    if (!this.enabled) {
      logger.error('Exception captured', {
        eventId,
        error: error.message,
        stack: error.stack,
        ...context,
      });
      return eventId;
    }

    // In production, this would send to Sentry
    // For now, we log structured data
    const event = {
      eventId,
      timestamp: new Date().toISOString(),
      level: ErrorSeverity.ERROR,
      message: error.message,
      exception: {
        type: error.name,
        value: error.message,
        stacktrace: error.stack,
      },
      tags: {
        environment: this.environment,
        userId: context?.userId,
        organizationId: context?.organizationId,
      },
      extra: context?.extra,
      request: context?.path
        ? {
            url: context.path,
            method: context.method,
            headers: {
              'user-agent': context.userAgent,
            },
          }
        : undefined,
    };

    logger.error('Sentry event', event);

    // Would send to Sentry API here
    // fetch(this.dsn, { method: 'POST', body: JSON.stringify(event) });

    return eventId;
  }

  /**
   * Capture a message
   */
  captureMessage(
    message: string,
    level: ErrorSeverity = ErrorSeverity.INFO,
    context?: ErrorContext
  ): string {
    const eventId = crypto.randomUUID();

    const event = {
      eventId,
      timestamp: new Date().toISOString(),
      level,
      message,
      tags: {
        environment: this.environment,
        userId: context?.userId,
        organizationId: context?.organizationId,
      },
      extra: context?.extra,
    };

    if (level === ErrorSeverity.ERROR || level === ErrorSeverity.FATAL) {
      logger.error('Captured message', event);
    } else if (level === ErrorSeverity.WARNING) {
      logger.warn('Captured message', event);
    } else {
      logger.info('Captured message', event);
    }

    return eventId;
  }

  /**
   * Start a performance transaction
   */
  startTransaction(name: string, data?: Record<string, any>): string {
    const spanId = crypto.randomUUID();

    this.spans.set(spanId, {
      name,
      startTime: Date.now(),
      data,
    });

    return spanId;
  }

  /**
   * Finish a performance transaction
   */
  finishTransaction(
    spanId: string,
    status: 'ok' | 'error' = 'ok'
  ): PerformanceSpan | null {
    const span = this.spans.get(spanId);

    if (!span) {
      return null;
    }

    span.endTime = Date.now();
    span.status = status;

    const duration = span.endTime - span.startTime;

    // Log slow transactions
    if (duration > 1000) {
      logger.warn('Slow transaction', {
        name: span.name,
        duration,
        status,
        data: span.data,
      });
    }

    this.spans.delete(spanId);

    return span;
  }

  /**
   * Create a child span
   */
  startSpan(parentId: string, name: string): string {
    return this.startTransaction(`${name} (child of ${parentId})`);
  }

  /**
   * Set user context
   */
  setUser(user: {
    id: string;
    email?: string;
    organizationId?: string;
  }): void {
    // In production, this would set Sentry user context
    logger.debug('Set user context', user);
  }

  /**
   * Set tags
   */
  setTags(tags: Record<string, string>): void {
    logger.debug('Set tags', tags);
  }

  /**
   * Add breadcrumb
   */
  addBreadcrumb(breadcrumb: {
    category: string;
    message: string;
    level?: ErrorSeverity;
    data?: Record<string, any>;
  }): void {
    logger.debug('Breadcrumb', breadcrumb);
  }

  /**
   * Flush events (for worker shutdown)
   */
  async flush(timeout: number = 2000): Promise<boolean> {
    // In production, would flush Sentry queue
    return true;
  }
}

/**
 * Create monitoring instance from environment
 */
export function createMonitoring(env: {
  SENTRY_DSN?: string;
  ENVIRONMENT?: string;
}): MonitoringService {
  return new MonitoringService({
    dsn: env.SENTRY_DSN,
    environment: env.ENVIRONMENT || 'development',
    sampleRate: 1.0,
  });
}

/**
 * Error handler middleware for Hono
 */
export function errorHandler(monitoring: MonitoringService) {
  return async (c: any, next: () => Promise<void>) => {
    const spanId = monitoring.startTransaction(`${c.req.method} ${c.req.path}`);

    try {
      await next();
      monitoring.finishTransaction(spanId, 'ok');
    } catch (error) {
      monitoring.finishTransaction(spanId, 'error');

      const eventId = monitoring.captureException(error as Error, {
        userId: c.get('userId'),
        organizationId: c.get('organizationId'),
        path: c.req.path,
        method: c.req.method,
        userAgent: c.req.header('User-Agent'),
      });

      // Return error response with event ID for support
      const statusCode = (error as any).status || 500;
      return c.json(
        {
          error: 'Internal Server Error',
          message: statusCode === 500 ? 'An unexpected error occurred' : (error as Error).message,
          eventId,
        },
        statusCode
      );
    }
  };
}

/**
 * Metric recording
 */
export interface Metric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'percent' | 'bytes';
  tags?: Record<string, string>;
}

/**
 * Record custom metric
 */
export function recordMetric(metric: Metric): void {
  logger.debug('Metric recorded', metric as unknown as Record<string, unknown>);
}

/**
 * Health check response
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    name: string;
    status: 'pass' | 'fail';
    message?: string;
    latency?: number;
  }[];
  version: string;
  uptime: number;
}

/**
 * Perform health checks
 */
export async function performHealthCheck(
  db: D1Database,
  startTime: number
): Promise<HealthStatus> {
  const checks: HealthStatus['checks'] = [];

  // Database check
  const dbStart = Date.now();
  try {
    await db.prepare('SELECT 1').first();
    checks.push({
      name: 'database',
      status: 'pass',
      latency: Date.now() - dbStart,
    });
  } catch (error) {
    checks.push({
      name: 'database',
      status: 'fail',
      message: (error as Error).message,
    });
  }

  const allPass = checks.every((c) => c.status === 'pass');
  const anyFail = checks.some((c) => c.status === 'fail');

  return {
    status: anyFail ? 'unhealthy' : allPass ? 'healthy' : 'degraded',
    checks,
    version: '1.0.0',
    uptime: Date.now() - startTime,
  };
}
