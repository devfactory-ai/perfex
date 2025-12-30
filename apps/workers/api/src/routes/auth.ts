/**
 * Authentication Routes
 * All auth endpoints: register, login, logout, profile, password reset
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types';
import { AuthService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth';
import {
  authRateLimitMiddleware,
  RATE_LIMITS,
} from '../utils/rate-limit';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  requestPasswordlessLoginSchema,
  verifyPasswordlessLoginSchema,
} from '@perfex/shared';

const auth = new Hono<{ Bindings: Env }>();

/**
 * POST /auth/register
 * Register a new user
 * AUTH-051
 * Rate limited: 3 attempts per hour
 */
auth.post('/register', authRateLimitMiddleware(RATE_LIMITS.REGISTER), async (c) => {
  const ipAddress = c.req.header('cf-connecting-ip') || 'unknown';

  try {
    const body = await c.req.json();
    const data = registerSchema.parse(body);

    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.SESSIONS,
      c.env.JWT_SECRET,
      c.env.ENVIRONMENT || 'production'
    );

    const result = await authService.register(data, ipAddress);

    return c.json({ data: result }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';

    return c.json(
      {
        error: {
          code: 'REGISTRATION_FAILED',
          message,
        },
      },
      400
    );
  }
});

/**
 * POST /auth/login
 * Login user
 * AUTH-052
 * Rate limited: 5 attempts per 15 minutes
 */
auth.post('/login', authRateLimitMiddleware(RATE_LIMITS.LOGIN), async (c) => {
  const ipAddress = c.req.header('cf-connecting-ip') || 'unknown';
  const userAgent = c.req.header('user-agent');

  try {
    const body = await c.req.json();
    const data = loginSchema.parse(body);

    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.SESSIONS,
      c.env.JWT_SECRET,
      c.env.ENVIRONMENT || 'production'
    );

    const result = await authService.login(data, ipAddress, userAgent);

    return c.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';

    return c.json(
      {
        error: {
          code: 'LOGIN_FAILED',
          message,
        },
      },
      401
    );
  }
});

/**
 * POST /auth/refresh
 * Refresh access token
 * AUTH-053
 */
auth.post('/refresh', zValidator('json', refreshTokenSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');

  try {
    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.SESSIONS,
      c.env.JWT_SECRET,
      c.env.ENVIRONMENT || 'production'
    );

    const result = await authService.refresh(refreshToken);

    return c.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed';

    return c.json(
      {
        error: {
          code: 'REFRESH_FAILED',
          message,
        },
      },
      401
    );
  }
});

/**
 * POST /auth/logout
 * Logout user
 * AUTH-054
 */
auth.post('/logout', zValidator('json', refreshTokenSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');

  try {
    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.SESSIONS,
      c.env.JWT_SECRET,
      c.env.ENVIRONMENT || 'production'
    );

    await authService.logout(refreshToken);

    return c.json({ message: 'Logged out successfully' });
  } catch (error) {
    // Always return success for logout
    return c.json({ message: 'Logged out successfully' });
  }
});

/**
 * GET /auth/me
 * Get current user profile
 * AUTH-055
 */
auth.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');

  try {
    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.SESSIONS,
      c.env.JWT_SECRET,
      c.env.ENVIRONMENT || 'production'
    );

    const user = await authService.getProfile(userId);

    return c.json({ data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get profile';

    return c.json(
      {
        error: {
          code: 'PROFILE_ERROR',
          message,
        },
      },
      404
    );
  }
});

/**
 * PUT /auth/me
 * Update user profile
 * AUTH-056
 */
auth.put('/me', authMiddleware, zValidator('json', updateProfileSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');

  try {
    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.SESSIONS,
      c.env.JWT_SECRET,
      c.env.ENVIRONMENT || 'production'
    );

    const user = await authService.updateProfile(userId, data);

    return c.json({ data: user });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update profile';

    return c.json(
      {
        error: {
          code: 'UPDATE_FAILED',
          message,
        },
      },
      400
    );
  }
});

/**
 * POST /auth/forgot-password
 * Request password reset
 * AUTH-057
 * Rate limited: 3 attempts per hour
 */
auth.post('/forgot-password', authRateLimitMiddleware(RATE_LIMITS.PASSWORD_RESET), zValidator('json', forgotPasswordSchema), async (c) => {
  const { email } = c.req.valid('json');
  const ipAddress = c.req.header('cf-connecting-ip') || 'unknown';

  try {
    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.SESSIONS,
      c.env.JWT_SECRET,
      c.env.ENVIRONMENT || 'production'
    );

    await authService.forgotPassword(email, ipAddress);

    // Always return success to avoid user enumeration
    return c.json({
      message: 'If an account exists with this email, a password reset link will be sent.',
    });
  } catch (error) {
    // Always return success to avoid user enumeration
    return c.json({
      message: 'If an account exists with this email, a password reset link will be sent.',
    });
  }
});

/**
 * POST /auth/reset-password
 * Reset password with token
 * AUTH-058
 */
auth.post('/reset-password', zValidator('json', resetPasswordSchema), async (c) => {
  const { token, newPassword } = c.req.valid('json');

  try {
    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.SESSIONS,
      c.env.JWT_SECRET,
      c.env.ENVIRONMENT || 'production'
    );

    await authService.resetPassword(token, newPassword);

    return c.json({ message: 'Password reset successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password reset failed';

    return c.json(
      {
        error: {
          code: 'RESET_FAILED',
          message,
        },
      },
      400
    );
  }
});

/**
 * POST /auth/passwordless/request
 * Request a passwordless login link via email
 * AUTH-059
 * Rate limited: 5 attempts per 15 minutes
 */
auth.post('/passwordless/request', authRateLimitMiddleware(RATE_LIMITS.PASSWORDLESS), async (c) => {
  const ipAddress = c.req.header('cf-connecting-ip') || 'unknown';

  try {
    const body = await c.req.json();
    const { email } = requestPasswordlessLoginSchema.parse(body);

    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.SESSIONS,
      c.env.JWT_SECRET,
      c.env.ENVIRONMENT || 'production'
    );

    await authService.requestPasswordlessLogin(email, ipAddress);

    return c.json({
      message: 'If an account exists with this email, a login link has been sent.',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to send login link';

    return c.json(
      {
        error: {
          code: 'PASSWORDLESS_REQUEST_FAILED',
          message,
        },
      },
      400
    );
  }
});

/**
 * POST /auth/passwordless/verify
 * Verify a passwordless login token and log in
 * AUTH-060
 */
auth.post('/passwordless/verify', async (c) => {
  const ipAddress = c.req.header('cf-connecting-ip') || 'unknown';
  const userAgent = c.req.header('user-agent');

  try {
    const body = await c.req.json();
    const { token } = verifyPasswordlessLoginSchema.parse(body);

    const authService = new AuthService(
      c.env.DB,
      c.env.CACHE,
      c.env.SESSIONS,
      c.env.JWT_SECRET,
      c.env.ENVIRONMENT || 'production'
    );

    const result = await authService.verifyPasswordlessLogin(
      token,
      ipAddress,
      userAgent
    );

    return c.json({ data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid or expired login link';

    return c.json(
      {
        error: {
          code: 'PASSWORDLESS_VERIFY_FAILED',
          message,
        },
      },
      401
    );
  }
});

export default auth;
