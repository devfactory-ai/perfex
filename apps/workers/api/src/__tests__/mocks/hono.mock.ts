/**
 * Hono Mocks
 * Mock Hono context for testing routes
 */

import { vi } from 'vitest';
import type { Context } from 'hono';

export interface MockContext {
  req: {
    json: () => Promise<any>;
    query: (key: string) => string | undefined;
    param: (key: string) => string | undefined;
    header: (key: string) => string | undefined;
    url: string;
    method: string;
    path: string;
  };
  json: ReturnType<typeof vi.fn>;
  status: ReturnType<typeof vi.fn>;
  header: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  get: ReturnType<typeof vi.fn>;
  env: any;
  var: Record<string, any>;
}

export const createMockContext = (options: {
  body?: any;
  query?: Record<string, string>;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  env?: any;
  variables?: Record<string, any>;
} = {}): MockContext => {
  const {
    body = {},
    query = {},
    params = {},
    headers = {},
    env = {},
    variables = {},
  } = options;

  const context: MockContext = {
    req: {
      json: vi.fn().mockResolvedValue(body),
      query: vi.fn((key: string) => query[key]),
      param: vi.fn((key: string) => params[key]),
      header: vi.fn((key: string) => headers[key]),
      url: 'http://localhost/api/v1/test',
      method: 'GET',
      path: '/api/v1/test',
    },
    json: vi.fn().mockImplementation((data, status = 200) => {
      return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' },
      });
    }),
    status: vi.fn().mockReturnThis(),
    header: vi.fn().mockReturnThis(),
    set: vi.fn((key: string, value: any) => {
      context.var[key] = value;
    }),
    get: vi.fn((key: string) => context.var[key]),
    env,
    var: { ...variables },
  };

  return context;
};

export const createAuthenticatedContext = (options: {
  userId?: string;
  organizationId?: string;
  email?: string;
  role?: string;
  body?: any;
  query?: Record<string, string>;
  params?: Record<string, string>;
  env?: any;
} = {}) => {
  const {
    userId = 'user-test-001',
    organizationId = 'org-test-001',
    email = 'test@example.com',
    role = 'admin',
    ...rest
  } = options;

  return createMockContext({
    ...rest,
    headers: {
      'Authorization': 'Bearer test-token',
      'x-organization-id': organizationId,
    },
    variables: {
      userId,
      organizationId,
      userEmail: email,
      userRole: role,
    },
  });
};
