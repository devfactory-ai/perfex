/**
 * Auth Routes Tests
 * Tests for register, login, refresh, logout, profile, and forgot-password endpoints
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Env } from '../types';
import { createMockD1Database, createMockKVNamespace } from '../__tests__/mocks/database.mock';
import { testUser, testJWT } from '../__tests__/mocks/fixtures';

// Mock AuthService
const mockRegister = vi.fn();
const mockLogin = vi.fn();
const mockRefresh = vi.fn();
const mockLogout = vi.fn();
const mockGetProfile = vi.fn();
const mockUpdateProfile = vi.fn();
const mockForgotPassword = vi.fn();
const mockResetPassword = vi.fn();
const mockRequestPasswordlessLogin = vi.fn();
const mockVerifyPasswordlessLogin = vi.fn();

vi.mock('../services/auth.service', () => ({
  AuthService: vi.fn().mockImplementation(() => ({
    register: mockRegister,
    login: mockLogin,
    refresh: mockRefresh,
    logout: mockLogout,
    getProfile: mockGetProfile,
    updateProfile: mockUpdateProfile,
    forgotPassword: mockForgotPassword,
    resetPassword: mockResetPassword,
    requestPasswordlessLogin: mockRequestPasswordlessLogin,
    verifyPasswordlessLogin: mockVerifyPasswordlessLogin,
  })),
}));

// Mock auth middleware to simply set userId from token
vi.mock('../middleware/auth', () => ({
  authMiddleware: vi.fn().mockImplementation(async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } },
        401
      );
    }
    const token = authHeader.substring(7);
    if (token === 'invalid-token') {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Token verification failed' } },
        401
      );
    }
    c.set('userId', testUser.id);
    c.set('userEmail', testUser.email);
    await next();
  }),
}));

// Mock rate limit middleware to be a pass-through
vi.mock('../utils/rate-limit', () => ({
  authRateLimitMiddleware: () => {
    return async (_c: any, next: any) => next();
  },
  RATE_LIMITS: {
    LOGIN: { maxAttempts: 10, windowMs: 300000 },
    REGISTER: { maxAttempts: 10, windowMs: 3600000 },
    PASSWORD_RESET: { maxAttempts: 5, windowMs: 3600000 },
    PASSWORDLESS: { maxAttempts: 5, windowMs: 900000 },
  },
}));

// Import auth routes after mocks are defined (vi.mock is hoisted)
import authRoutes from './auth';

// Create mock env bindings
function createMockEnv(): Env {
  return {
    DB: createMockD1Database(),
    CACHE: createMockKVNamespace(),
    SESSIONS: createMockKVNamespace(),
    JWT_SECRET: 'test-jwt-secret',
    ENVIRONMENT: 'test',
  } as unknown as Env;
}

// Helper to build a test app
function createTestApp() {
  const app = new Hono<{ Bindings: Env }>();
  app.route('/auth', authRoutes);
  return app;
}

// Helper to make requests with env bindings via app.fetch()
async function makeRequest(
  app: Hono<{ Bindings: Env }>,
  method: string,
  path: string,
  body?: any,
  headers?: Record<string, string>
) {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  const req = new Request(`http://localhost${path}`, init);
  return app.fetch(req, createMockEnv());
}

describe('Auth Routes', () => {
  let app: Hono<{ Bindings: Env }>;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  // ──────────────────────────────────────────
  // POST /auth/register
  // ──────────────────────────────────────────
  describe('POST /auth/register', () => {
    const validRegistration = {
      email: 'newuser@example.com',
      password: 'SecurePass1!',
      firstName: 'New',
      lastName: 'User',
      organizationName: 'Test Org',
    };

    it('should register a new user and return 201 with tokens', async () => {
      const mockResult = {
        user: { id: 'user-new', email: validRegistration.email },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      mockRegister.mockResolvedValue(mockResult);

      const res = await makeRequest(app, 'POST', '/auth/register', validRegistration);

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.data).toEqual(mockResult);
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({ email: validRegistration.email }),
        expect.any(String)
      );
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await makeRequest(app, 'POST', '/auth/register', { email: 'a@b.com' });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe('REGISTRATION_FAILED');
    });

    it('should return 400 when password is too weak', async () => {
      const res = await makeRequest(app, 'POST', '/auth/register', {
        ...validRegistration,
        password: 'weak',
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('REGISTRATION_FAILED');
    });

    it('should return 400 when email is invalid', async () => {
      const res = await makeRequest(app, 'POST', '/auth/register', {
        ...validRegistration,
        email: 'not-an-email',
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('REGISTRATION_FAILED');
    });

    it('should return 400 when service throws duplicate email error', async () => {
      mockRegister.mockRejectedValue(new Error('Email already registered'));

      const res = await makeRequest(app, 'POST', '/auth/register', validRegistration);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('REGISTRATION_FAILED');
      expect(json.error.message).toBe('Email already registered');
    });
  });

  // ──────────────────────────────────────────
  // POST /auth/login
  // ──────────────────────────────────────────
  describe('POST /auth/login', () => {
    const validLogin = {
      email: 'test@example.com',
      password: 'SecurePass1!',
    };

    it('should login successfully and return user with tokens', async () => {
      const mockResult = {
        user: { id: testUser.id, email: testUser.email },
        accessToken: testJWT.accessToken,
        refreshToken: testJWT.refreshToken,
      };
      mockLogin.mockResolvedValue(mockResult);

      const res = await makeRequest(app, 'POST', '/auth/login', validLogin);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual(mockResult);
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ email: validLogin.email }),
        expect.any(String), // ipAddress
        undefined // userAgent (not set in our helper by default)
      );
    });

    it('should return 401 on invalid credentials', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid email or password'));

      const res = await makeRequest(app, 'POST', '/auth/login', validLogin);

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('LOGIN_FAILED');
      expect(json.error.message).toBe('Invalid email or password');
    });

    it('should return 401 when email is missing', async () => {
      const res = await makeRequest(app, 'POST', '/auth/login', { password: 'SomePass1!' });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('should return 401 when password is missing', async () => {
      const res = await makeRequest(app, 'POST', '/auth/login', { email: 'test@example.com' });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error).toBeDefined();
    });

    it('should forward user-agent header to the service', async () => {
      mockLogin.mockResolvedValue({ user: {}, accessToken: 'a', refreshToken: 'r' });

      await makeRequest(app, 'POST', '/auth/login', validLogin, {
        'User-Agent': 'TestBrowser/1.0',
      });

      expect(mockLogin).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        'TestBrowser/1.0'
      );
    });
  });

  // ──────────────────────────────────────────
  // POST /auth/refresh
  // ──────────────────────────────────────────
  describe('POST /auth/refresh', () => {
    it('should return new access token for valid refresh token', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };
      mockRefresh.mockResolvedValue(mockResult);

      const res = await makeRequest(app, 'POST', '/auth/refresh', {
        refreshToken: testJWT.refreshToken,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual(mockResult);
      expect(mockRefresh).toHaveBeenCalledWith(testJWT.refreshToken);
    });

    it('should return 401 for invalid refresh token', async () => {
      mockRefresh.mockRejectedValue(new Error('Invalid or expired refresh token'));

      const res = await makeRequest(app, 'POST', '/auth/refresh', {
        refreshToken: 'invalid-token',
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('REFRESH_FAILED');
      expect(json.error.message).toBe('Invalid or expired refresh token');
    });

    it('should return 400 when refreshToken field is missing', async () => {
      const res = await makeRequest(app, 'POST', '/auth/refresh', {});

      // zValidator returns 400 for validation errors
      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────
  // POST /auth/logout
  // ──────────────────────────────────────────
  describe('POST /auth/logout', () => {
    it('should return 200 on successful logout', async () => {
      mockLogout.mockResolvedValue(undefined);

      const res = await makeRequest(app, 'POST', '/auth/logout', {
        refreshToken: testJWT.refreshToken,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe('Logged out successfully');
      expect(mockLogout).toHaveBeenCalledWith(testJWT.refreshToken);
    });

    it('should still return 200 even when logout fails (graceful)', async () => {
      mockLogout.mockRejectedValue(new Error('Token not found'));

      const res = await makeRequest(app, 'POST', '/auth/logout', {
        refreshToken: 'expired-token',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe('Logged out successfully');
    });

    it('should return 400 when refreshToken field is missing', async () => {
      const res = await makeRequest(app, 'POST', '/auth/logout', {});

      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────
  // GET /auth/me
  // ──────────────────────────────────────────
  describe('GET /auth/me', () => {
    it('should return user profile with valid token', async () => {
      const mockProfile = {
        id: testUser.id,
        email: testUser.email,
        firstName: testUser.firstName,
        lastName: testUser.lastName,
      };
      mockGetProfile.mockResolvedValue(mockProfile);

      const res = await makeRequest(app, 'GET', '/auth/me', undefined, {
        Authorization: `Bearer ${testJWT.accessToken}`,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data).toEqual(mockProfile);
      expect(mockGetProfile).toHaveBeenCalledWith(testUser.id);
    });

    it('should return 401 without authorization header', async () => {
      const res = await makeRequest(app, 'GET', '/auth/me');

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const res = await makeRequest(app, 'GET', '/auth/me', undefined, {
        Authorization: 'Bearer invalid-token',
      });

      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 when profile is not found', async () => {
      mockGetProfile.mockRejectedValue(new Error('User not found'));

      const res = await makeRequest(app, 'GET', '/auth/me', undefined, {
        Authorization: `Bearer ${testJWT.accessToken}`,
      });

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error.code).toBe('PROFILE_ERROR');
      expect(json.error.message).toBe('User not found');
    });
  });

  // ──────────────────────────────────────────
  // PUT /auth/me
  // ──────────────────────────────────────────
  describe('PUT /auth/me', () => {
    it('should update profile with valid data', async () => {
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const mockUpdated = { ...testUser, ...updateData };
      mockUpdateProfile.mockResolvedValue(mockUpdated);

      const res = await makeRequest(app, 'PUT', '/auth/me', updateData, {
        Authorization: `Bearer ${testJWT.accessToken}`,
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.data.firstName).toBe('Updated');
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        testUser.id,
        expect.objectContaining(updateData)
      );
    });

    it('should return 401 without authorization header', async () => {
      const res = await makeRequest(app, 'PUT', '/auth/me', { firstName: 'Test' });

      expect(res.status).toBe(401);
    });

    it('should return 400 when service throws an error', async () => {
      mockUpdateProfile.mockRejectedValue(new Error('Update failed'));

      const res = await makeRequest(app, 'PUT', '/auth/me', { firstName: 'Updated' }, {
        Authorization: `Bearer ${testJWT.accessToken}`,
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('UPDATE_FAILED');
    });
  });

  // ──────────────────────────────────────────
  // POST /auth/forgot-password
  // ──────────────────────────────────────────
  describe('POST /auth/forgot-password', () => {
    it('should return success message for valid email', async () => {
      mockForgotPassword.mockResolvedValue(undefined);

      const res = await makeRequest(app, 'POST', '/auth/forgot-password', {
        email: 'test@example.com',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toContain('password reset link');
      expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com', expect.any(String));
    });

    it('should return same success message for non-existent email (no user leak)', async () => {
      mockForgotPassword.mockRejectedValue(new Error('User not found'));

      const res = await makeRequest(app, 'POST', '/auth/forgot-password', {
        email: 'unknown@example.com',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toContain('password reset link');
    });

    it('should return 400 when email is missing', async () => {
      const res = await makeRequest(app, 'POST', '/auth/forgot-password', {});

      // zValidator rejects missing email
      expect(res.status).toBe(400);
    });
  });

  // ──────────────────────────────────────────
  // POST /auth/reset-password
  // ──────────────────────────────────────────
  describe('POST /auth/reset-password', () => {
    it('should reset password with valid token and new password', async () => {
      mockResetPassword.mockResolvedValue(undefined);

      const res = await makeRequest(app, 'POST', '/auth/reset-password', {
        token: 'valid-reset-token',
        newPassword: 'NewSecure1!',
      });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.message).toBe('Password reset successfully');
      expect(mockResetPassword).toHaveBeenCalledWith('valid-reset-token', 'NewSecure1!');
    });

    it('should return 400 when reset token is invalid', async () => {
      mockResetPassword.mockRejectedValue(new Error('Invalid or expired reset token'));

      const res = await makeRequest(app, 'POST', '/auth/reset-password', {
        token: 'invalid-token',
        newPassword: 'NewSecure1!',
      });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('RESET_FAILED');
      expect(json.error.message).toBe('Invalid or expired reset token');
    });

    it('should return 400 when new password is too weak', async () => {
      const res = await makeRequest(app, 'POST', '/auth/reset-password', {
        token: 'valid-token',
        newPassword: 'weak',
      });

      expect(res.status).toBe(400);
    });
  });
});
