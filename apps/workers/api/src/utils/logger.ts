/**
 * Structured Logger for Cloudflare Workers
 * Provides consistent, structured logging with log levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  organizationId?: string;
  route?: string;
  method?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel = 'info';
  private context: LogContext = {};

  setLevel(level: LogLevel) {
    this.level = level;
  }

  setContext(context: LogContext) {
    this.context = { ...this.context, ...context };
  }

  clearContext() {
    this.context = {};
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatEntry(level: LogLevel, message: string, context?: LogContext, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    const mergedContext = { ...this.context, ...context };
    if (Object.keys(mergedContext).length > 0) {
      entry.context = mergedContext;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error) {
    if (!this.shouldLog(level)) return;

    const entry = this.formatEntry(level, message, context, error);
    const output = JSON.stringify(entry);

    switch (level) {
      case 'debug':
      case 'info':
        // In production, we only output warn and error to avoid log noise
        // but in development, we output all levels
        if (this.level === 'debug' || this.level === 'info') {
          console.log(output);
        }
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    const err = error instanceof Error ? error : new Error(String(error));
    this.log('error', message, context, err);
  }

  // Create a child logger with additional context
  child(context: LogContext): Logger {
    const childLogger = new Logger();
    childLogger.level = this.level;
    childLogger.context = { ...this.context, ...context };
    return childLogger;
  }
}

// Global logger instance
export const logger = new Logger();

// Helper to create request-scoped logger
export function createRequestLogger(requestId: string, env: { LOG_LEVEL?: string }): Logger {
  const reqLogger = new Logger();

  // Set log level from environment
  const level = (env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  if (LOG_LEVELS[level] !== undefined) {
    reqLogger.setLevel(level);
  }

  reqLogger.setContext({ requestId });
  return reqLogger;
}

// Export for use in middleware
export { Logger };
