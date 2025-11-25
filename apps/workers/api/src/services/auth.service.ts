/**
 * Authentication Service
 * Handles all authentication operations
 */

import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import {
  users,
  organizations,
  organizationMembers,
  sessions,
  type User,
  type Organization,
} from '@perfex/database';
import type {
  SafeUser,
  AuthResponse,
  AuthTokens,
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
} from '@perfex/shared';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateRandomToken,
} from '../utils/crypto';
import {
  checkRateLimit,
  incrementRateLimit,
  RATE_LIMITS,
} from '../utils/rate-limit';
import { EmailService } from '../utils/email';

/**
 * Convert User to SafeUser (remove password hash)
 */
function toSafeUser(user: User): SafeUser {
  const { passwordHash, ...safeUser } = user;
  return safeUser as SafeUser;
}

/**
 * Generate slug from organization name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export class AuthService {
  private emailService: EmailService;

  constructor(
    private db: D1Database,
    private cache: KVNamespace,
    private sessions: KVNamespace,
    private jwtSecret: string,
    private environment: string = 'production'
  ) {
    this.emailService = new EmailService(environment);
  }

  /**
   * Register a new user
   * AUTH-041
   */
  async register(
    data: RegisterInput,
    ipAddress: string
  ): Promise<AuthResponse> {
    const drizzleDb = drizzle(this.db);

    // Rate limiting
    const rateLimitKey = `register:${ipAddress}`;
    const canProceed = await checkRateLimit(
      this.cache,
      rateLimitKey,
      RATE_LIMITS.REGISTER
    );

    if (!canProceed) {
      throw new Error('Too many registration attempts. Please try again later.');
    }

    await incrementRateLimit(this.cache, rateLimitKey, RATE_LIMITS.REGISTER);

    // Check if user already exists
    const existingUser = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .get();

    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user
    const userId = crypto.randomUUID();
    const now = new Date();

    await drizzleDb.insert(users).values({
      id: userId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      emailVerified: false,
      active: true,
      createdAt: now,
      updatedAt: now,
    });

    // Get created user
    const user = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      throw new Error('Failed to create user');
    }

    // Create organization if provided
    if (data.organizationName) {
      const orgId = crypto.randomUUID();
      const slug = generateSlug(data.organizationName);

      await drizzleDb.insert(organizations).values({
        id: orgId,
        name: data.organizationName,
        slug,
        createdAt: now,
        updatedAt: now,
      });

      // Add user as owner
      await drizzleDb.insert(organizationMembers).values({
        id: crypto.randomUUID(),
        organizationId: orgId,
        userId: user.id,
        role: 'owner',
        joinedAt: now,
      });
    }

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.firstName || 'User');
    } catch (error) {
      // Don't fail registration if email fails
      console.error('Failed to send welcome email:', error);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, ipAddress);

    return {
      user: toSafeUser(user),
      tokens,
    };
  }

  /**
   * Login user
   * AUTH-042
   */
  async login(
    data: LoginInput,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    const drizzleDb = drizzle(this.db);

    // Rate limiting
    const rateLimitKey = `login:${ipAddress}`;
    const canProceed = await checkRateLimit(
      this.cache,
      rateLimitKey,
      RATE_LIMITS.LOGIN
    );

    if (!canProceed) {
      throw new Error('Too many login attempts. Please try again later.');
    }

    await incrementRateLimit(this.cache, rateLimitKey, RATE_LIMITS.LOGIN);

    // Find user
    const user = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .get();

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const passwordValid = await comparePassword(data.password, user.passwordHash);

    if (!passwordValid) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.active) {
      throw new Error('Account is disabled');
    }

    // Update last login
    await drizzleDb
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Get user's first organization
    const membership = await drizzleDb
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, user.id))
      .get();

    // Generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      ipAddress,
      userAgent
    );

    return {
      user: toSafeUser({
        ...user,
        lastLoginAt: new Date(),
        organizationId: membership?.organizationId || null,
      }),
      tokens,
    };
  }

  /**
   * Refresh access token
   * AUTH-043
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    // Verify refresh token
    const payload = verifyToken<{ sub: string; sessionId: string; type: string }>(
      refreshToken,
      this.jwtSecret
    );

    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    // Check if session exists in KV
    const sessionKey = `session:${payload.sessionId}`;
    const sessionData = await this.sessions.get(sessionKey);

    if (!sessionData) {
      throw new Error('Session not found or expired');
    }

    // Get user
    const drizzleDb = drizzle(this.db);
    const user = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.id, payload.sub))
      .get();

    if (!user || !user.active) {
      throw new Error('User not found or inactive');
    }

    // Generate new access token
    const accessToken = generateAccessToken(
      user.id,
      user.email,
      this.jwtSecret
    );

    return { accessToken };
  }

  /**
   * Logout user
   * AUTH-044
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      const payload = verifyToken<{ sessionId: string }>(
        refreshToken,
        this.jwtSecret
      );

      // Delete session from KV
      const sessionKey = `session:${payload.sessionId}`;
      await this.sessions.delete(sessionKey);

      // Optionally delete from D1 as well
      const drizzleDb = drizzle(this.db);
      await drizzleDb
        .delete(sessions)
        .where(eq(sessions.id, payload.sessionId));
    } catch (error) {
      // Ignore errors on logout
      console.error('Logout error:', error);
    }
  }

  /**
   * Get user profile
   * AUTH-045
   */
  async getProfile(userId: string): Promise<SafeUser> {
    const drizzleDb = drizzle(this.db);

    const user = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      throw new Error('User not found');
    }

    return toSafeUser(user);
  }

  /**
   * Update user profile
   * AUTH-046
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileInput
  ): Promise<SafeUser> {
    const drizzleDb = drizzle(this.db);

    await drizzleDb
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    const user = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user) {
      throw new Error('User not found');
    }

    return toSafeUser(user);
  }

  /**
   * Forgot password - send reset email
   * AUTH-047
   */
  async forgotPassword(email: string, ipAddress: string): Promise<void> {
    // Rate limiting
    const rateLimitKey = `password-reset:${ipAddress}`;
    const canProceed = await checkRateLimit(
      this.cache,
      rateLimitKey,
      RATE_LIMITS.PASSWORD_RESET
    );

    if (!canProceed) {
      throw new Error('Too many password reset attempts. Please try again later.');
    }

    await incrementRateLimit(this.cache, rateLimitKey, RATE_LIMITS.PASSWORD_RESET);

    const drizzleDb = drizzle(this.db);

    const user = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    // Don't reveal if user exists
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = generateRandomToken(32);

    // Store token in KV (expires in 1 hour)
    const tokenKey = `password-reset:${resetToken}`;
    await this.cache.put(tokenKey, user.id, { expirationTtl: 3600 });

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(email, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }

  /**
   * Request passwordless login link
   * AUTH-049
   */
  async requestPasswordlessLogin(email: string, ipAddress: string): Promise<void> {
    // Rate limiting
    const rateLimitKey = `passwordless:${ipAddress}`;
    const canProceed = await checkRateLimit(
      this.cache,
      rateLimitKey,
      RATE_LIMITS.PASSWORD_RESET
    );

    if (!canProceed) {
      throw new Error('Too many passwordless login attempts. Please try again later.');
    }

    await incrementRateLimit(this.cache, rateLimitKey, RATE_LIMITS.PASSWORD_RESET);

    const drizzleDb = drizzle(this.db);

    const user = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    // Don't reveal if user exists
    if (!user) {
      return;
    }

    // Check if user is active
    if (!user.active) {
      return;
    }

    // Generate login token
    const loginToken = generateRandomToken(32);

    // Store token in KV (expires in 15 minutes)
    const tokenKey = `passwordless-login:${loginToken}`;
    await this.cache.put(tokenKey, user.id, { expirationTtl: 900 }); // 15 minutes

    // Send passwordless login email
    try {
      await this.emailService.sendPasswordlessLoginEmail(email, loginToken);
    } catch (error) {
      console.error('Failed to send passwordless login email:', error);
      throw new Error('Failed to send login link');
    }
  }

  /**
   * Verify passwordless login token
   * AUTH-050
   */
  async verifyPasswordlessLogin(
    token: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    // Get user ID from token
    const tokenKey = `passwordless-login:${token}`;
    const userId = await this.cache.get(tokenKey);

    if (!userId) {
      throw new Error('Invalid or expired login link');
    }

    // Get user
    const drizzleDb = drizzle(this.db);
    const user = await drizzleDb
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();

    if (!user || !user.active) {
      throw new Error('User not found or inactive');
    }

    // Delete token (single use)
    await this.cache.delete(tokenKey);

    // Update last login
    await drizzleDb
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      ipAddress,
      userAgent
    );

    return {
      user: toSafeUser({ ...user, lastLoginAt: new Date() }),
      tokens,
    };
  }

  /**
   * Reset password with token
   * AUTH-048
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Get user ID from token
    const tokenKey = `password-reset:${token}`;
    const userId = await this.cache.get(tokenKey);

    if (!userId) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    const drizzleDb = drizzle(this.db);
    await drizzleDb
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Delete token
    await this.cache.delete(tokenKey);

    // Invalidate all sessions for this user
    // TODO: Implement session invalidation
  }

  /**
   * Generate tokens and store session
   * Private helper method
   */
  private async generateTokens(
    userId: string,
    email: string,
    ipAddress: string,
    userAgent?: string
  ): Promise<AuthTokens> {
    const sessionId = crypto.randomUUID();

    // Generate tokens
    const accessToken = generateAccessToken(userId, email, this.jwtSecret);
    const refreshToken = generateRefreshToken(userId, sessionId, this.jwtSecret);

    // Hash refresh token for storage
    const refreshTokenHash = await hashPassword(refreshToken);

    // Store session in KV (expires in 7 days)
    const sessionKey = `session:${sessionId}`;
    const sessionData = {
      userId,
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
    };

    await this.sessions.put(sessionKey, JSON.stringify(sessionData), {
      expirationTtl: 7 * 24 * 60 * 60, // 7 days
    });

    // Store session in D1 as backup
    const drizzleDb = drizzle(this.db);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await drizzleDb.insert(sessions).values({
      id: sessionId,
      userId,
      refreshTokenHash,
      ipAddress,
      userAgent,
      expiresAt,
      createdAt: new Date(),
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
