/**
 * Error Handling Utilities
 * Centralized error handling for the frontend
 */

import { toast } from 'sonner';

/**
 * Error codes with French translations
 */
export const ERROR_CODES: Record<string, string> = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'Identifiants invalides',
  AUTH_TOKEN_EXPIRED: 'Session expirée, veuillez vous reconnecter',
  AUTH_UNAUTHORIZED: 'Accès non autorisé',
  AUTH_FORBIDDEN: 'Vous n\'avez pas les permissions nécessaires',

  // Validation errors
  VALIDATION_ERROR: 'Erreur de validation',
  VALIDATION_REQUIRED_FIELD: 'Ce champ est obligatoire',
  VALIDATION_INVALID_EMAIL: 'Email invalide',
  VALIDATION_INVALID_PHONE: 'Numéro de téléphone invalide',
  VALIDATION_MIN_LENGTH: 'Longueur minimum non respectée',
  VALIDATION_MAX_LENGTH: 'Longueur maximum dépassée',

  // Network errors
  NETWORK_ERROR: 'Erreur de connexion au serveur',
  NETWORK_TIMEOUT: 'Délai de connexion dépassé',
  NETWORK_OFFLINE: 'Vous êtes hors ligne',

  // Resource errors
  RESOURCE_NOT_FOUND: 'Ressource non trouvée',
  RESOURCE_ALREADY_EXISTS: 'Cette ressource existe déjà',
  RESOURCE_DELETED: 'Cette ressource a été supprimée',

  // Server errors
  SERVER_ERROR: 'Erreur serveur, veuillez réessayer',
  SERVER_UNAVAILABLE: 'Service temporairement indisponible',
  SERVER_RATE_LIMITED: 'Trop de requêtes, veuillez patienter',

  // Form errors
  FORM_SUBMIT_ERROR: 'Erreur lors de la soumission du formulaire',
  FORM_INVALID_DATA: 'Données du formulaire invalides',

  // Generic
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite',
};

export type ErrorCode = keyof typeof ERROR_CODES;

/**
 * API Error class
 */
export class ApiError extends Error {
  constructor(
    public code: ErrorCode | string,
    public message: string,
    public status: number,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(response: Response, data?: any): ApiError {
    const status = response.status;
    let code: ErrorCode = 'UNKNOWN_ERROR';
    let message = ERROR_CODES.UNKNOWN_ERROR;

    switch (status) {
      case 400:
        code = 'VALIDATION_ERROR';
        message = data?.message || ERROR_CODES.VALIDATION_ERROR;
        break;
      case 401:
        code = 'AUTH_UNAUTHORIZED';
        message = ERROR_CODES.AUTH_UNAUTHORIZED;
        break;
      case 403:
        code = 'AUTH_FORBIDDEN';
        message = ERROR_CODES.AUTH_FORBIDDEN;
        break;
      case 404:
        code = 'RESOURCE_NOT_FOUND';
        message = ERROR_CODES.RESOURCE_NOT_FOUND;
        break;
      case 409:
        code = 'RESOURCE_ALREADY_EXISTS';
        message = data?.message || ERROR_CODES.RESOURCE_ALREADY_EXISTS;
        break;
      case 429:
        code = 'SERVER_RATE_LIMITED';
        message = ERROR_CODES.SERVER_RATE_LIMITED;
        break;
      case 500:
      case 502:
      case 503:
        code = 'SERVER_ERROR';
        message = ERROR_CODES.SERVER_ERROR;
        break;
    }

    return new ApiError(code, message, status, data);
  }
}

/**
 * Network error class
 */
export class NetworkError extends Error {
  constructor(
    public code: 'NETWORK_ERROR' | 'NETWORK_TIMEOUT' | 'NETWORK_OFFLINE',
    message?: string
  ) {
    super(message || ERROR_CODES[code]);
    this.name = 'NetworkError';
  }
}

/**
 * Parse error from API response
 */
export async function parseApiError(response: Response): Promise<ApiError> {
  let data: any;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return ApiError.fromResponse(response, data);
}

/**
 * Handle error with toast notification
 */
export function handleError(error: unknown, showToast: boolean = true): void {
  let message = ERROR_CODES.UNKNOWN_ERROR;
  let code: string = 'UNKNOWN_ERROR';

  if (error instanceof ApiError) {
    message = error.message;
    code = error.code;
  } else if (error instanceof NetworkError) {
    message = error.message;
    code = error.code;
  } else if (error instanceof Error) {
    message = error.message || ERROR_CODES.UNKNOWN_ERROR;
    code = 'UNKNOWN_ERROR';
  }

  // Log error for debugging
  console.error(`[${code}]`, error);

  if (showToast) {
    toast.error(message, {
      duration: 5000,
      action: {
        label: 'Fermer',
        onClick: () => {},
      },
    });
  }
}

/**
 * Handle form validation errors
 */
export function handleValidationErrors(
  errors: Record<string, string[]> | undefined
): Record<string, string> {
  if (!errors) return {};

  const formattedErrors: Record<string, string> = {};

  for (const [field, messages] of Object.entries(errors)) {
    formattedErrors[field] = messages.join(', ');
  }

  return formattedErrors;
}

/**
 * Error boundary fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Format error for display
 */
export function formatError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof NetworkError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return ERROR_CODES.UNKNOWN_ERROR;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401 || error.status === 403;
  }
  return false;
}

/**
 * Check if error should trigger logout
 */
export function shouldLogout(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.status === 401 && error.code === 'AUTH_TOKEN_EXPIRED';
  }
  return false;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  delay: number;
  backoff: 'linear' | 'exponential';
  retryOn: number[];
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delay: 1000,
  backoff: 'exponential',
  retryOn: [408, 429, 500, 502, 503, 504],
};

/**
 * Fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<Response> {
  const { maxRetries, delay, backoff, retryOn } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!retryOn.includes(response.status)) {
        return response;
      }

      lastError = new ApiError(
        'SERVER_ERROR',
        `Server returned ${response.status}`,
        response.status
      );
    } catch (error) {
      if (!navigator.onLine) {
        throw new NetworkError('NETWORK_OFFLINE');
      }
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt < maxRetries) {
      const waitTime = backoff === 'exponential'
        ? delay * Math.pow(2, attempt)
        : delay * (attempt + 1);

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  throw lastError || new NetworkError('NETWORK_ERROR');
}
