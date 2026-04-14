import { vi } from 'vitest';

// Mock API response factory
export function createMockApiResponse<T>(data: T, status = 200) {
  return {
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: {},
  };
}

// Mock API error factory
export function createMockApiError(
  message: string,
  status = 400,
  code?: string
) {
  const error = new Error(message) as Error & {
    response?: { data: { error: { message: string; code?: string } }; status: number };
    isAxiosError: boolean;
  };
  error.response = {
    data: { error: { message, code } },
    status,
  };
  error.isAxiosError = true;
  return error;
}

// Mock fetch implementation
export const mockFetch = vi.fn();

// Standard API mock responses
export const mockApiResponses = {
  // Auth responses
  login: {
    success: createMockApiResponse({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      },
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    }),
    invalidCredentials: createMockApiError('Invalid credentials', 401, 'INVALID_CREDENTIALS'),
    userNotFound: createMockApiError('User not found', 404, 'USER_NOT_FOUND'),
    accountLocked: createMockApiError('Account locked', 423, 'ACCOUNT_LOCKED'),
  },

  // User responses
  currentUser: {
    success: createMockApiResponse({
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      createdAt: '2024-01-01T00:00:00Z',
    }),
    unauthorized: createMockApiError('Unauthorized', 401, 'UNAUTHORIZED'),
  },

  // Generic responses
  success: createMockApiResponse({ success: true }),
  notFound: createMockApiError('Not found', 404, 'NOT_FOUND'),
  serverError: createMockApiError('Internal server error', 500, 'INTERNAL_ERROR'),
  validationError: createMockApiError('Validation failed', 422, 'VALIDATION_ERROR'),
};

// Axios mock
export const createMockAxios = () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  create: vi.fn().mockReturnThis(),
  interceptors: {
    request: { use: vi.fn(), eject: vi.fn() },
    response: { use: vi.fn(), eject: vi.fn() },
  },
  defaults: {
    headers: {
      common: {},
    },
  },
});

export const mockAxios = createMockAxios();
