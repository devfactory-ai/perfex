/**
 * Safe JSON Utilities
 * Provides error-safe JSON parsing with fallback values
 */

import { logger } from './logger';

/**
 * Safely parse JSON with error handling
 * Returns defaultValue if parsing fails instead of throwing
 */
export function safeJsonParse<T>(
  jsonString: string | null | undefined,
  defaultValue: T,
  context?: string
): T {
  if (!jsonString) {
    return defaultValue;
  }

  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    logger.warn('JSON parse failed', {
      context: context || 'safeJsonParse',
      error: error instanceof Error ? error.message : 'Unknown error',
      inputLength: jsonString.length,
      inputPreview: jsonString.substring(0, 100),
    });
    return defaultValue;
  }
}

/**
 * Safely parse JSON array with error handling
 * Returns empty array if parsing fails
 */
export function safeJsonParseArray<T>(
  jsonString: string | null | undefined,
  context?: string
): T[] {
  return safeJsonParse<T[]>(jsonString, [], context);
}

/**
 * Safely parse JSON object with error handling
 * Returns empty object if parsing fails
 */
export function safeJsonParseObject<T extends object>(
  jsonString: string | null | undefined,
  context?: string
): T {
  return safeJsonParse<T>(jsonString, {} as T, context);
}

/**
 * Safely stringify JSON with error handling
 * Returns null if stringification fails
 */
export function safeJsonStringify(
  value: unknown,
  context?: string
): string | null {
  try {
    return JSON.stringify(value);
  } catch (error) {
    logger.warn('JSON stringify failed', {
      context: context || 'safeJsonStringify',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}
