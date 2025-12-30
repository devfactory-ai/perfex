/**
 * Custom error classes for consistent API error handling
 */

/**
 * Standard API error codes
 */
export const ErrorCodes = {
  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Client errors (400)
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource errors (404, 409)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Server errors (500)
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Base application error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Indicates this is a known/expected error

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to JSON response format
   */
  toJSON(): {
    success: false;
    error: {
      code: ErrorCode;
      message: string;
      details?: Record<string, unknown>;
    };
  } {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

// ============================================================================
// Specific Error Classes
// ============================================================================

/**
 * 400 Bad Request
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request', details?: Record<string, unknown>) {
    super(ErrorCodes.BAD_REQUEST, message, 400, details);
    this.name = 'BadRequestError';
  }
}

/**
 * 400 Validation Error
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: Record<string, unknown>) {
    super(ErrorCodes.VALIDATION_ERROR, message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', details?: Record<string, unknown>) {
    super(ErrorCodes.UNAUTHORIZED, message, 401, details);
    this.name = 'UnauthorizedError';
  }
}

/**
 * 401 Invalid Token
 */
export class InvalidTokenError extends AppError {
  constructor(message = 'Invalid or expired token', details?: Record<string, unknown>) {
    super(ErrorCodes.INVALID_TOKEN, message, 401, details);
    this.name = 'InvalidTokenError';
  }
}

/**
 * 403 Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied', details?: Record<string, unknown>) {
    super(ErrorCodes.FORBIDDEN, message, 403, details);
    this.name = 'ForbiddenError';
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource', details?: Record<string, unknown>) {
    super(ErrorCodes.NOT_FOUND, `${resource} not found`, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details?: Record<string, unknown>) {
    super(ErrorCodes.CONFLICT, message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * 409 Already Exists
 */
export class AlreadyExistsError extends AppError {
  constructor(resource = 'Resource', details?: Record<string, unknown>) {
    super(ErrorCodes.ALREADY_EXISTS, `${resource} already exists`, 409, details);
    this.name = 'AlreadyExistsError';
  }
}

/**
 * 429 Rate Limit Exceeded
 */
export class RateLimitError extends AppError {
  constructor(
    message = 'Too many requests',
    details?: Record<string, unknown>
  ) {
    super(ErrorCodes.RATE_LIMIT_EXCEEDED, message, 429, details);
    this.name = 'RateLimitError';
  }
}

/**
 * 500 Internal Server Error
 */
export class InternalServerError extends AppError {
  constructor(message = 'An unexpected error occurred', details?: Record<string, unknown>) {
    super(ErrorCodes.INTERNAL_SERVER_ERROR, message, 500, details);
    this.name = 'InternalServerError';
  }
}

/**
 * 500 Database Error
 */
export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', details?: Record<string, unknown>) {
    super(ErrorCodes.DATABASE_ERROR, message, 500, details);
    this.name = 'DatabaseError';
  }
}

/**
 * 503 Service Unavailable
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', details?: Record<string, unknown>) {
    super(ErrorCodes.SERVICE_UNAVAILABLE, message, 503, details);
    this.name = 'ServiceUnavailableError';
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Wrap unknown errors into AppError
 */
export function wrapError(error: unknown): AppError {
  if (isAppError(error)) {
    return error;
  }

  if (error instanceof Error) {
    // Try to infer error type from message
    const message = error.message.toLowerCase();

    if (message.includes('not found') || message.includes('no such')) {
      return new NotFoundError('Resource', { originalMessage: error.message });
    }

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return new UnauthorizedError(error.message);
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return new ForbiddenError(error.message);
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return new ValidationError(error.message);
    }

    if (message.includes('duplicate') || message.includes('already exists')) {
      return new AlreadyExistsError('Resource', { originalMessage: error.message });
    }

    return new InternalServerError(error.message, { stack: error.stack });
  }

  return new InternalServerError('An unexpected error occurred');
}

/**
 * Create a validation error with field details
 */
export function createValidationError(
  fields: Record<string, string>
): ValidationError {
  const fieldNames = Object.keys(fields).join(', ');
  return new ValidationError(`Validation failed for: ${fieldNames}`, { fields });
}

/**
 * Create a not found error for a specific resource
 */
export function createNotFoundError(
  resourceType: string,
  identifier?: string | number
): NotFoundError {
  const details = identifier ? { id: identifier } : undefined;
  return new NotFoundError(resourceType, details);
}
