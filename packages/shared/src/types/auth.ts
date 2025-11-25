/**
 * Authentication types
 */

/**
 * User from database (with password hash)
 */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

/**
 * Safe user (without password hash - for API responses)
 */
export interface SafeUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  active: boolean;
  organizationId: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

/**
 * JWT tokens pair
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Complete auth response
 */
export interface AuthResponse {
  user: SafeUser;
  tokens: AuthTokens;
}

/**
 * Organization
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  settings: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization member role
 */
export type OrganizationRole = 'owner' | 'admin' | 'member';

/**
 * Organization member
 */
export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  joinedAt: Date;
}

/**
 * Role with permissions
 */
export interface Role {
  id: string;
  organizationId: string | null;
  name: string;
  permissions: string[];
  createdAt: Date;
}

/**
 * Session
 */
export interface Session {
  id: string;
  userId: string;
  refreshTokenHash: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * JWT payload for access token
 */
export interface AccessTokenPayload {
  sub: string; // user ID
  email: string;
  type: 'access';
  iat: number;
  exp: number;
}

/**
 * JWT payload for refresh token
 */
export interface RefreshTokenPayload {
  sub: string; // user ID
  sessionId: string;
  type: 'refresh';
  iat: number;
  exp: number;
}

/**
 * Helper to convert User to SafeUser
 */
export function toSafeUser(user: User & { organizationId?: string | null }): SafeUser {
  const { passwordHash, ...safeUser } = user;
  return { ...safeUser, organizationId: safeUser.organizationId || null };
}
