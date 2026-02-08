/**
 * Standardized API response utilities
 * Ensures consistent response format across all endpoints
 */

import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { AppError, isAppError, wrapError, type ErrorCode } from './errors';

// ============================================================================
// Response Types
// ============================================================================

/**
 * Standard success response structure
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Paginated response metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * General response metadata
 */
export interface ResponseMeta {
  pagination?: PaginationMeta;
  timestamp?: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * API Response type union
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

// ============================================================================
// Response Builder Class
// ============================================================================

/**
 * Builder class for creating consistent API responses
 */
export class ResponseBuilder<T> {
  private data: T | null = null;
  private meta: ResponseMeta = {};
  private statusCode = 200;

  /**
   * Set response data
   */
  setData(data: T): this {
    this.data = data;
    return this;
  }

  /**
   * Set HTTP status code
   */
  setStatus(code: number): this {
    this.statusCode = code;
    return this;
  }

  /**
   * Add pagination metadata
   */
  setPagination(page: number, limit: number, total: number): this {
    const totalPages = Math.ceil(total / limit);
    this.meta.pagination = {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
    return this;
  }

  /**
   * Add custom metadata
   */
  addMeta(key: string, value: unknown): this {
    this.meta[key] = value;
    return this;
  }

  /**
   * Build and send response through Hono context
   */
  send(c: Context): Response {
    const response: SuccessResponse<T | null> = {
      success: true,
      data: this.data,
    };

    if (Object.keys(this.meta).length > 0) {
      response.meta = this.meta;
    }

    return c.json(response, this.statusCode as ContentfulStatusCode);
  }
}

// ============================================================================
// Response Helper Functions
// ============================================================================

/**
 * Send a success response
 */
export function sendSuccess<T>(
  c: Context,
  data: T,
  statusCode = 200,
  meta?: ResponseMeta
): Response {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (meta && Object.keys(meta).length > 0) {
    response.meta = meta;
  }

  return c.json(response, statusCode as ContentfulStatusCode);
}

/**
 * Send a created response (201)
 */
export function sendCreated<T>(c: Context, data: T, meta?: ResponseMeta): Response {
  return sendSuccess(c, data, 201, meta);
}

/**
 * Send a no content response (204)
 */
export function sendNoContent(c: Context): Response {
  return new Response(null, { status: 204 });
}

/**
 * Send a paginated list response
 */
export function sendPaginated<T>(
  c: Context,
  items: T[],
  page: number,
  limit: number,
  total: number
): Response {
  const totalPages = Math.ceil(total / limit);

  return sendSuccess(c, items, 200, {
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}

/**
 * Send an error response from AppError
 */
export function sendError(c: Context, error: AppError): Response {
  return c.json(error.toJSON(), error.statusCode as ContentfulStatusCode);
}

/**
 * Send an error response from any error
 */
export function sendErrorFromUnknown(c: Context, error: unknown): Response {
  const appError = isAppError(error) ? error : wrapError(error);
  return sendError(c, appError);
}

/**
 * Send a custom error response
 */
export function sendCustomError(
  c: Context,
  code: ErrorCode,
  message: string,
  statusCode: number,
  details?: Record<string, unknown>
): Response {
  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return c.json(response, statusCode as ContentfulStatusCode);
}

// ============================================================================
// Common Error Response Shortcuts
// ============================================================================

/**
 * Send 400 Bad Request
 */
export function sendBadRequest(
  c: Context,
  message = 'Bad request',
  details?: Record<string, unknown>
): Response {
  return sendCustomError(c, 'BAD_REQUEST', message, 400, details);
}

/**
 * Send 401 Unauthorized
 */
export function sendUnauthorized(
  c: Context,
  message = 'Authentication required'
): Response {
  return sendCustomError(c, 'UNAUTHORIZED', message, 401);
}

/**
 * Send 403 Forbidden
 */
export function sendForbidden(
  c: Context,
  message = 'Access denied',
  details?: Record<string, unknown>
): Response {
  return sendCustomError(c, 'FORBIDDEN', message, 403, details);
}

/**
 * Send 404 Not Found
 */
export function sendNotFound(
  c: Context,
  resource = 'Resource'
): Response {
  return sendCustomError(c, 'NOT_FOUND', `${resource} not found`, 404);
}

/**
 * Send 409 Conflict
 */
export function sendConflict(
  c: Context,
  message = 'Resource conflict',
  details?: Record<string, unknown>
): Response {
  return sendCustomError(c, 'CONFLICT', message, 409, details);
}

/**
 * Send 429 Rate Limit Exceeded
 */
export function sendRateLimitExceeded(
  c: Context,
  retryAfterSeconds?: number
): Response {
  if (retryAfterSeconds) {
    c.header('Retry-After', String(retryAfterSeconds));
  }
  return sendCustomError(c, 'RATE_LIMIT_EXCEEDED', 'Too many requests', 429, {
    retryAfter: retryAfterSeconds,
  });
}

/**
 * Send 500 Internal Server Error
 */
export function sendInternalError(
  c: Context,
  message = 'An unexpected error occurred'
): Response {
  return sendCustomError(c, 'INTERNAL_SERVER_ERROR', message, 500);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Extract pagination params from query string
 */
export function getPaginationParams(c: Context): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Create a response builder
 */
export function createResponse<T>(): ResponseBuilder<T> {
  return new ResponseBuilder<T>();
}

// ============================================================================
// Aliases for compatibility
// ============================================================================

/**
 * Alias for sendSuccess - returns JSON response
 */
export function jsonResponse<T>(
  c: Context,
  data: T,
  statusCode: 200 | 201 | 202 | 203 | 206 = 200
): Response {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };
  return c.json(response, statusCode);
}

/**
 * Alias for sendCustomError - returns error response
 */
export function errorResponse(
  c: Context,
  code: ErrorCode,
  message: string,
  statusCode: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 = 400
): Response {
  const response: ErrorResponse = {
    success: false,
    error: { code, message },
  };
  return c.json(response, statusCode);
}

/**
 * Alias for sendPaginated - returns paginated response
 */
export function paginatedResponse<T>(
  c: Context,
  items: T[],
  pagination: { page: number; limit: number; total: number }
): Response {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  const response: SuccessResponse<T[]> = {
    success: true,
    data: items,
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    },
  };
  return c.json(response, 200);
}
