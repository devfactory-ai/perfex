/**
 * Patient Portal Authentication Service
 * Handles patient authentication for the self-service portal
 */

import { drizzle } from 'drizzle-orm/d1';
import { eq, and } from 'drizzle-orm';
import {
  portalUsers,
  portalSessions,
  portalNotifications,
  healthcarePatients,
} from '@perfex/database';
import {
  hashPassword,
  comparePassword,
  generateRandomToken,
  hashToken,
} from '../../utils/crypto';
import {
  checkRateLimit,
  incrementRateLimit,
  RATE_LIMITS,
} from '../../utils/rate-limit';
import { EmailService } from '../../utils/email';

// ============================================================================
// TYPES
// ============================================================================

export interface PortalRegisterInput {
  patientId: string;
  email: string;
  password: string;
  phone?: string;
  language?: 'fr' | 'en';
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

export interface PortalLoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface PortalAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PortalUser {
  id: string;
  patientId: string;
  companyId: string;
  email: string;
  phone?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  twoFactorEnabled: boolean;
  language: string;
  status: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
  };
}

export interface PortalAuthResponse {
  user: PortalUser;
  tokens: PortalAuthTokens;
}

// ============================================================================
// SERVICE
// ============================================================================

export class PortalAuthService {
  private drizzleDb: ReturnType<typeof drizzle>;
  private emailService: EmailService;

  constructor(
    private db: D1Database,
    private cache: KVNamespace,
    private portalSessions: KVNamespace,
    private jwtSecret: string,
    private environment: string = 'production'
  ) {
    this.drizzleDb = drizzle(db);
    this.emailService = new EmailService({
      environment: environment as 'development' | 'staging' | 'production'
    });
  }

  // ==========================================================================
  // REGISTRATION
  // ==========================================================================

  /**
   * Register a patient for portal access
   * PORTAL-AUTH-001
   */
  async register(
    companyId: string,
    data: PortalRegisterInput,
    ipAddress: string
  ): Promise<PortalAuthResponse> {
    // Rate limiting
    const rateLimitKey = `portal-register:${ipAddress}`;
    const canProceed = await checkRateLimit(
      this.cache,
      rateLimitKey,
      RATE_LIMITS.REGISTER
    );

    if (!canProceed) {
      throw new Error('Trop de tentatives d\'inscription. Veuillez réessayer plus tard.');
    }

    await incrementRateLimit(this.cache, rateLimitKey, RATE_LIMITS.REGISTER);

    // Verify patient exists
    const patient = await this.drizzleDb
      .select()
      .from(healthcarePatients)
      .where(
        and(
          eq(healthcarePatients.id, data.patientId),
          eq(healthcarePatients.companyId, companyId)
        )
      )
      .get() as any;

    if (!patient) {
      throw new Error('Patient non trouvé');
    }

    // Check if already registered
    const existingPortalUser = await this.drizzleDb
      .select()
      .from(portalUsers)
      .where(
        and(
          eq(portalUsers.email, data.email),
          eq(portalUsers.companyId, companyId)
        )
      )
      .get() as any;

    if (existingPortalUser) {
      throw new Error('Cet email est déjà enregistré');
    }

    // Check if patient already has portal access
    const existingPatientPortal = await this.drizzleDb
      .select()
      .from(portalUsers)
      .where(
        and(
          eq(portalUsers.patientId, data.patientId),
          eq(portalUsers.companyId, companyId)
        )
      )
      .get() as any;

    if (existingPatientPortal) {
      throw new Error('Ce patient a déjà un compte portail');
    }

    // Validate terms acceptance
    if (!data.acceptTerms || !data.acceptPrivacy) {
      throw new Error('Vous devez accepter les conditions d\'utilisation');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create portal user
    const userId = crypto.randomUUID();
    const now = new Date();

    await this.drizzleDb.insert(portalUsers).values({
      id: userId,
      patientId: data.patientId,
      companyId,
      email: data.email,
      passwordHash,
      phone: data.phone,
      isEmailVerified: false,
      isPhoneVerified: false,
      twoFactorEnabled: false,
      language: data.language || 'fr',
      timezone: 'Europe/Paris',
      termsAcceptedAt: now,
      termsVersion: '1.0',
      privacyAcceptedAt: now,
      privacyVersion: '1.0',
      status: 'pending_verification',
      createdAt: now,
      updatedAt: now,
    });

    // Generate verification token
    const verificationToken = generateRandomToken();
    const tokenHash = hashToken(verificationToken);

    // Store verification token in cache (24h expiry)
    await this.cache.put(
      `portal-verify:${tokenHash}`,
      JSON.stringify({ userId, email: data.email }),
      { expirationTtl: 86400 }
    );

    // Send verification email
    await this.sendVerificationEmail(data.email, verificationToken, data.language || 'fr');

    // Create welcome notification
    await this.drizzleDb.insert(portalNotifications).values({
      id: crypto.randomUUID(),
      portalUserId: userId,
      companyId,
      type: 'general',
      title: 'Bienvenue sur votre espace patient',
      body: 'Votre compte a été créé avec succès. Veuillez vérifier votre email pour activer votre compte.',
      channels: JSON.stringify(['email']),
      createdAt: now,
    });

    // Generate tokens
    const tokens = await this.generateTokens(userId, companyId, data.email, ipAddress);

    // Get full user data
    const user = await this.getPortalUser(userId, companyId);

    return { user, tokens };
  }

  /**
   * Verify email address
   * PORTAL-AUTH-002
   */
  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const tokenHash = hashToken(token);
    const cached = await this.cache.get(`portal-verify:${tokenHash}`);

    if (!cached) {
      throw new Error('Lien de vérification invalide ou expiré');
    }

    const { userId, email } = JSON.parse(cached);

    // Update user
    await this.drizzleDb
      .update(portalUsers)
      .set({
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(portalUsers.id, userId));

    // Delete token
    await this.cache.delete(`portal-verify:${tokenHash}`);

    return { success: true, message: 'Email vérifié avec succès' };
  }

  /**
   * Resend verification email
   * PORTAL-AUTH-003
   */
  async resendVerificationEmail(
    email: string,
    companyId: string,
    ipAddress: string
  ): Promise<{ success: boolean }> {
    // Rate limiting
    const rateLimitKey = `portal-resend:${ipAddress}`;
    const canProceed = await checkRateLimit(
      this.cache,
      rateLimitKey,
      { maxAttempts: 3, windowMs: 3600000 } // 3 per hour
    );

    if (!canProceed) {
      throw new Error('Trop de demandes. Veuillez réessayer plus tard.');
    }

    await incrementRateLimit(this.cache, rateLimitKey, { maxAttempts: 3, windowMs: 3600000 });

    const portalUser = await this.drizzleDb
      .select()
      .from(portalUsers)
      .where(
        and(
          eq(portalUsers.email, email),
          eq(portalUsers.companyId, companyId)
        )
      )
      .get() as any;

    if (!portalUser) {
      // Don't reveal if email exists
      return { success: true };
    }

    if (portalUser.isEmailVerified) {
      throw new Error('Email déjà vérifié');
    }

    // Generate new verification token
    const verificationToken = generateRandomToken();
    const tokenHash = hashToken(verificationToken);

    await this.cache.put(
      `portal-verify:${tokenHash}`,
      JSON.stringify({ userId: portalUser.id, email }),
      { expirationTtl: 86400 }
    );

    await this.sendVerificationEmail(email, verificationToken, portalUser.language || 'fr');

    return { success: true };
  }

  // ==========================================================================
  // LOGIN
  // ==========================================================================

  /**
   * Login to patient portal
   * PORTAL-AUTH-004
   */
  async login(
    companyId: string,
    data: PortalLoginInput,
    ipAddress: string,
    userAgent: string
  ): Promise<PortalAuthResponse> {
    // Rate limiting
    const rateLimitKey = `portal-login:${ipAddress}`;
    const canProceed = await checkRateLimit(
      this.cache,
      rateLimitKey,
      RATE_LIMITS.LOGIN
    );

    if (!canProceed) {
      throw new Error('Trop de tentatives de connexion. Veuillez réessayer plus tard.');
    }

    // Find portal user
    const portalUser = await this.drizzleDb
      .select()
      .from(portalUsers)
      .where(
        and(
          eq(portalUsers.email, data.email),
          eq(portalUsers.companyId, companyId)
        )
      )
      .get() as any;

    if (!portalUser) {
      await incrementRateLimit(this.cache, rateLimitKey, RATE_LIMITS.LOGIN);
      throw new Error('Email ou mot de passe incorrect');
    }

    // Check if locked
    if (portalUser.lockedUntil && new Date(portalUser.lockedUntil) > new Date()) {
      throw new Error('Compte temporairement bloqué. Veuillez réessayer plus tard.');
    }

    // Check status
    if (portalUser.status === 'suspended') {
      throw new Error('Compte suspendu. Veuillez contacter le support.');
    }

    if (portalUser.status === 'deactivated') {
      throw new Error('Compte désactivé.');
    }

    // Verify password
    const isValid = await comparePassword(data.password, portalUser.passwordHash);

    if (!isValid) {
      await incrementRateLimit(this.cache, rateLimitKey, RATE_LIMITS.LOGIN);

      // Increment failed attempts
      const failedAttempts = (portalUser.failedLoginAttempts || 0) + 1;
      const updates: any = {
        failedLoginAttempts: failedAttempts,
        updatedAt: new Date(),
      };

      // Lock account after 5 failed attempts
      if (failedAttempts >= 5) {
        updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        updates.status = 'locked';
      }

      await this.drizzleDb
        .update(portalUsers)
        .set(updates)
        .where(eq(portalUsers.id, portalUser.id));

      throw new Error('Email ou mot de passe incorrect');
    }

    // Check if email verified
    if (!portalUser.isEmailVerified) {
      throw new Error('Veuillez vérifier votre email avant de vous connecter');
    }

    // Check if 2FA is enabled
    if (portalUser.twoFactorEnabled) {
      // Return partial response indicating 2FA required
      const tempToken = generateRandomToken();
      await this.cache.put(
        `portal-2fa:${tempToken}`,
        JSON.stringify({ userId: portalUser.id, email: data.email }),
        { expirationTtl: 300 } // 5 minutes
      );

      return {
        user: await this.getPortalUser(portalUser.id, companyId),
        tokens: {
          accessToken: '',
          refreshToken: tempToken,
          expiresIn: 0,
        },
      };
    }

    // Reset failed attempts and update last login
    await this.drizzleDb
      .update(portalUsers)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        lastLoginUserAgent: userAgent,
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(portalUsers.id, portalUser.id));

    // Generate tokens
    const tokens = await this.generateTokens(
      portalUser.id,
      companyId,
      data.email,
      ipAddress,
      userAgent,
      data.rememberMe
    );

    // Get full user data
    const user = await this.getPortalUser(portalUser.id, companyId);

    return { user, tokens };
  }

  /**
   * Verify 2FA code
   * PORTAL-AUTH-005
   */
  async verify2FA(
    tempToken: string,
    code: string,
    ipAddress: string,
    userAgent: string
  ): Promise<PortalAuthResponse> {
    const cached = await this.cache.get(`portal-2fa:${tempToken}`);

    if (!cached) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    const { userId, email } = JSON.parse(cached);

    const portalUser = await this.drizzleDb
      .select()
      .from(portalUsers)
      .where(eq(portalUsers.id, userId))
      .get() as any;

    if (!portalUser) {
      throw new Error('Utilisateur non trouvé');
    }

    // Verify TOTP code
    const isValid = await this.verifyTOTP(portalUser.twoFactorSecret, code);

    if (!isValid) {
      // Check backup codes
      if (portalUser.backupCodes) {
        const backupCodes = JSON.parse(portalUser.backupCodes);
        const codeIndex = backupCodes.indexOf(code);

        if (codeIndex === -1) {
          throw new Error('Code invalide');
        }

        // Remove used backup code
        backupCodes.splice(codeIndex, 1);
        await this.drizzleDb
          .update(portalUsers)
          .set({
            backupCodes: JSON.stringify(backupCodes),
            updatedAt: new Date(),
          })
          .where(eq(portalUsers.id, userId));
      } else {
        throw new Error('Code invalide');
      }
    }

    // Delete temp token
    await this.cache.delete(`portal-2fa:${tempToken}`);

    // Update last login
    await this.drizzleDb
      .update(portalUsers)
      .set({
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
        lastLoginUserAgent: userAgent,
        updatedAt: new Date(),
      })
      .where(eq(portalUsers.id, userId));

    // Generate tokens
    const tokens = await this.generateTokens(userId, portalUser.companyId, email, ipAddress, userAgent);

    const user = await this.getPortalUser(userId, portalUser.companyId);

    return { user, tokens };
  }

  /**
   * Logout from portal
   * PORTAL-AUTH-006
   */
  async logout(sessionId: string): Promise<void> {
    await this.drizzleDb
      .update(portalSessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'user_logout',
      })
      .where(eq(portalSessions.id, sessionId));
  }

  /**
   * Logout from all devices
   * PORTAL-AUTH-007
   */
  async logoutAll(userId: string): Promise<void> {
    await this.drizzleDb
      .update(portalSessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'logout_all',
      })
      .where(eq(portalSessions.portalUserId, userId));
  }

  // ==========================================================================
  // PASSWORD MANAGEMENT
  // ==========================================================================

  /**
   * Request password reset
   * PORTAL-AUTH-008
   */
  async requestPasswordReset(
    email: string,
    companyId: string,
    ipAddress: string
  ): Promise<{ success: boolean }> {
    // Rate limiting
    const rateLimitKey = `portal-reset:${ipAddress}`;
    const canProceed = await checkRateLimit(
      this.cache,
      rateLimitKey,
      { maxAttempts: 3, windowMs: 3600000 }
    );

    if (!canProceed) {
      throw new Error('Trop de demandes. Veuillez réessayer plus tard.');
    }

    await incrementRateLimit(this.cache, rateLimitKey, { maxAttempts: 3, windowMs: 3600000 });

    const portalUser = await this.drizzleDb
      .select()
      .from(portalUsers)
      .where(
        and(
          eq(portalUsers.email, email),
          eq(portalUsers.companyId, companyId)
        )
      )
      .get() as any;

    // Always return success to not reveal if email exists
    if (!portalUser) {
      return { success: true };
    }

    // Generate reset token
    const resetToken = generateRandomToken();
    const tokenHash = hashToken(resetToken);

    await this.cache.put(
      `portal-reset:${tokenHash}`,
      JSON.stringify({ userId: portalUser.id, email }),
      { expirationTtl: 3600 } // 1 hour
    );

    // Send reset email
    await this.sendPasswordResetEmail(email, resetToken, portalUser.language || 'fr');

    return { success: true };
  }

  /**
   * Reset password with token
   * PORTAL-AUTH-009
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    const tokenHash = hashToken(token);
    const cached = await this.cache.get(`portal-reset:${tokenHash}`);

    if (!cached) {
      throw new Error('Lien de réinitialisation invalide ou expiré');
    }

    const { userId } = JSON.parse(cached);

    // Validate password strength
    if (newPassword.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user
    await this.drizzleDb
      .update(portalUsers)
      .set({
        passwordHash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        updatedAt: new Date(),
      })
      .where(eq(portalUsers.id, userId));

    // Invalidate all sessions
    await this.logoutAll(userId);

    // Delete token
    await this.cache.delete(`portal-reset:${tokenHash}`);

    return { success: true };
  }

  /**
   * Change password (authenticated)
   * PORTAL-AUTH-010
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean }> {
    const portalUser = await this.drizzleDb
      .select()
      .from(portalUsers)
      .where(eq(portalUsers.id, userId))
      .get() as any;

    if (!portalUser) {
      throw new Error('Utilisateur non trouvé');
    }

    // Verify current password
    const isValid = await comparePassword(currentPassword, portalUser.passwordHash);

    if (!isValid) {
      throw new Error('Mot de passe actuel incorrect');
    }

    // Validate new password
    if (newPassword.length < 8) {
      throw new Error('Le mot de passe doit contenir au moins 8 caractères');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user
    await this.drizzleDb
      .update(portalUsers)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(portalUsers.id, userId));

    return { success: true };
  }

  // ==========================================================================
  // TWO-FACTOR AUTHENTICATION
  // ==========================================================================

  /**
   * Enable 2FA
   * PORTAL-AUTH-011
   */
  async enable2FA(
    userId: string,
    method: 'app' | 'sms' | 'email'
  ): Promise<{ secret?: string; qrCode?: string; backupCodes: string[] }> {
    const portalUser = await this.drizzleDb
      .select()
      .from(portalUsers)
      .where(eq(portalUsers.id, userId))
      .get() as any;

    if (!portalUser) {
      throw new Error('Utilisateur non trouvé');
    }

    if (portalUser.twoFactorEnabled) {
      throw new Error('2FA déjà activé');
    }

    // Generate secret for TOTP
    const secret = this.generateTOTPSecret();

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Store secret temporarily (not enabled until verified)
    await this.cache.put(
      `portal-2fa-setup:${userId}`,
      JSON.stringify({ secret, method, backupCodes }),
      { expirationTtl: 600 } // 10 minutes
    );

    // Generate QR code URL for authenticator apps
    const qrCode = method === 'app'
      ? `otpauth://totp/PortailPatient:${portalUser.email}?secret=${secret}&issuer=PortailPatient`
      : undefined;

    return {
      secret: method === 'app' ? secret : undefined,
      qrCode,
      backupCodes,
    };
  }

  /**
   * Confirm 2FA setup with verification code
   * PORTAL-AUTH-012
   */
  async confirm2FA(userId: string, code: string): Promise<{ success: boolean }> {
    const cached = await this.cache.get(`portal-2fa-setup:${userId}`);

    if (!cached) {
      throw new Error('Configuration 2FA expirée. Veuillez recommencer.');
    }

    const { secret, method, backupCodes } = JSON.parse(cached);

    // Verify the code
    const isValid = await this.verifyTOTP(secret, code);

    if (!isValid) {
      throw new Error('Code invalide');
    }

    // Enable 2FA
    await this.drizzleDb
      .update(portalUsers)
      .set({
        twoFactorEnabled: true,
        twoFactorSecret: secret,
        twoFactorMethod: method,
        backupCodes: JSON.stringify(backupCodes),
        updatedAt: new Date(),
      })
      .where(eq(portalUsers.id, userId));

    // Delete setup cache
    await this.cache.delete(`portal-2fa-setup:${userId}`);

    return { success: true };
  }

  /**
   * Disable 2FA
   * PORTAL-AUTH-013
   */
  async disable2FA(userId: string, password: string): Promise<{ success: boolean }> {
    const portalUser = await this.drizzleDb
      .select()
      .from(portalUsers)
      .where(eq(portalUsers.id, userId))
      .get() as any;

    if (!portalUser) {
      throw new Error('Utilisateur non trouvé');
    }

    // Verify password
    const isValid = await comparePassword(password, portalUser.passwordHash);

    if (!isValid) {
      throw new Error('Mot de passe incorrect');
    }

    // Disable 2FA
    await this.drizzleDb
      .update(portalUsers)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorMethod: null,
        backupCodes: null,
        updatedAt: new Date(),
      })
      .where(eq(portalUsers.id, userId));

    return { success: true };
  }

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  /**
   * Validate session token
   * PORTAL-AUTH-014
   */
  async validateSession(token: string): Promise<PortalUser | null> {
    const tokenHash = await hashToken(token);

    const session = await this.drizzleDb
      .select()
      .from(portalSessions)
      .where(
        and(
          eq(portalSessions.token, tokenHash),
          eq(portalSessions.isActive, true)
        )
      )
      .get() as any;

    if (!session) {
      return null;
    }

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      return null;
    }

    // Update last activity
    await this.drizzleDb
      .update(portalSessions)
      .set({ lastActivityAt: new Date() })
      .where(eq(portalSessions.id, session.id));

    return this.getPortalUser(session.portalUserId, session.companyId);
  }

  /**
   * Refresh access token
   * PORTAL-AUTH-015
   */
  async refreshToken(
    refreshToken: string,
    ipAddress: string
  ): Promise<PortalAuthTokens> {
    const tokenHash = await hashToken(refreshToken);

    const session = await this.drizzleDb
      .select()
      .from(portalSessions)
      .where(
        and(
          eq(portalSessions.refreshToken, tokenHash),
          eq(portalSessions.isActive, true)
        )
      )
      .get() as any;

    if (!session) {
      throw new Error('Session invalide');
    }

    // Check refresh token expiry
    if (session.refreshExpiresAt && new Date(session.refreshExpiresAt) < new Date()) {
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    // Get user
    const portalUser = await this.drizzleDb
      .select()
      .from(portalUsers)
      .where(eq(portalUsers.id, session.portalUserId))
      .get() as any;

    if (!portalUser || portalUser.status !== 'active') {
      throw new Error('Compte inactif');
    }

    // Generate new tokens
    return this.generateTokens(
      portalUser.id,
      portalUser.companyId,
      portalUser.email,
      ipAddress
    );
  }

  /**
   * Get active sessions
   * PORTAL-AUTH-016
   */
  async getActiveSessions(userId: string): Promise<any[]> {
    const sessions = await this.drizzleDb
      .select()
      .from(portalSessions)
      .where(
        and(
          eq(portalSessions.portalUserId, userId),
          eq(portalSessions.isActive, true)
        )
      )
      .all() as any[];

    return sessions.map((s: any) => ({
      id: s.id,
      deviceType: s.deviceType,
      deviceName: s.deviceName,
      ipAddress: s.ipAddress,
      lastActivityAt: s.lastActivityAt,
      createdAt: s.createdAt,
    }));
  }

  /**
   * Revoke specific session
   * PORTAL-AUTH-017
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    await this.drizzleDb
      .update(portalSessions)
      .set({
        isActive: false,
        revokedAt: new Date(),
        revokedReason: 'user_revoked',
      })
      .where(
        and(
          eq(portalSessions.id, sessionId),
          eq(portalSessions.portalUserId, userId)
        )
      );
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  private async getPortalUser(userId: string, companyId: string): Promise<PortalUser> {
    const portalUser = await this.drizzleDb
      .select()
      .from(portalUsers)
      .where(
        and(
          eq(portalUsers.id, userId),
          eq(portalUsers.companyId, companyId)
        )
      )
      .get() as any;

    if (!portalUser) {
      throw new Error('Utilisateur non trouvé');
    }

    // Get patient info
    const patient = await this.drizzleDb
      .select()
      .from(healthcarePatients)
      .where(eq(healthcarePatients.id, portalUser.patientId))
      .get() as any;

    return {
      id: portalUser.id,
      patientId: portalUser.patientId,
      companyId: portalUser.companyId,
      email: portalUser.email,
      phone: portalUser.phone,
      isEmailVerified: !!portalUser.isEmailVerified,
      isPhoneVerified: !!portalUser.isPhoneVerified,
      twoFactorEnabled: !!portalUser.twoFactorEnabled,
      language: portalUser.language,
      status: portalUser.status,
      patient: patient ? {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
      } : undefined,
    };
  }

  private async generateTokens(
    userId: string,
    companyId: string,
    email: string,
    ipAddress: string,
    userAgent?: string,
    rememberMe = false
  ): Promise<PortalAuthTokens> {
    const accessToken = generateRandomToken();
    const refreshToken = generateRandomToken();

    const accessTokenHash = await hashToken(accessToken);
    const refreshTokenHash = await hashToken(refreshToken);

    // Token expiry
    const expiresIn = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30 days or 1 day
    const refreshExpiresIn = rememberMe ? 90 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 90 days or 7 days

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresIn * 1000);
    const refreshExpiresAt = new Date(now.getTime() + refreshExpiresIn * 1000);

    // Detect device type from user agent
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (userAgent) {
      if (/mobile/i.test(userAgent)) {
        deviceType = 'mobile';
      } else if (/tablet|ipad/i.test(userAgent)) {
        deviceType = 'tablet';
      }
    }

    // Create session
    await this.drizzleDb.insert(portalSessions).values({
      portalUserId: userId,
      companyId,
      token: accessTokenHash,
      refreshToken: refreshTokenHash,
      expiresAt,
      refreshExpiresAt,
      ipAddress,
      userAgent,
      deviceType,
      isActive: true,
      createdAt: now,
      lastActivityAt: now,
    } as any);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  private async sendVerificationEmail(email: string, token: string, language: string): Promise<void> {
    const verifyUrl = `${this.getPortalUrl()}/verify-email?token=${token}`;

    const subject = language === 'fr'
      ? 'Vérifiez votre adresse email'
      : 'Verify your email address';

    const body = language === 'fr'
      ? `Bonjour,\n\nMerci de vous être inscrit sur notre portail patient.\n\nCliquez sur le lien suivant pour vérifier votre email:\n${verifyUrl}\n\nCe lien expire dans 24 heures.\n\nCordialement`
      : `Hello,\n\nThank you for registering on our patient portal.\n\nClick the following link to verify your email:\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nBest regards`;

    await this.emailService.send({
      to: email,
      subject,
      text: body,
    });
  }

  private async sendPasswordResetEmail(email: string, token: string, language: string): Promise<void> {
    const resetUrl = `${this.getPortalUrl()}/reset-password?token=${token}`;

    const subject = language === 'fr'
      ? 'Réinitialisation de votre mot de passe'
      : 'Reset your password';

    const body = language === 'fr'
      ? `Bonjour,\n\nVous avez demandé la réinitialisation de votre mot de passe.\n\nCliquez sur le lien suivant:\n${resetUrl}\n\nCe lien expire dans 1 heure.\n\nSi vous n'avez pas fait cette demande, ignorez cet email.\n\nCordialement`
      : `Hello,\n\nYou requested a password reset.\n\nClick the following link:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request this, ignore this email.\n\nBest regards`;

    await this.emailService.send({
      to: email,
      subject,
      text: body,
    });
  }

  private getPortalUrl(): string {
    if (this.environment === 'production') {
      return 'https://portal.perfex.io';
    } else if (this.environment === 'staging') {
      return 'https://portal-staging.perfex.io';
    }
    return 'http://localhost:5173';
  }

  private generateTOTPSecret(): string {
    // Generate a random 20-byte secret encoded as base32
    const bytes = new Uint8Array(20);
    crypto.getRandomValues(bytes);

    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';

    for (let i = 0; i < bytes.length; i += 5) {
      const chunk = bytes.slice(i, i + 5);
      const bits = (chunk[0] << 32) | (chunk[1] << 24) | (chunk[2] << 16) | (chunk[3] << 8) | chunk[4];

      for (let j = 0; j < 8; j++) {
        const index = (bits >> (35 - j * 5)) & 0x1f;
        secret += base32Chars[index];
      }
    }

    return secret.substring(0, 32);
  }

  private async verifyTOTP(secret: string, code: string): Promise<boolean> {
    // Simple TOTP verification
    // In production, use a proper TOTP library
    const timeStep = 30;
    const digits = 6;
    const currentTime = Math.floor(Date.now() / 1000);
    const timeCounter = Math.floor(currentTime / timeStep);

    // Check current and adjacent time windows
    for (let i = -1; i <= 1; i++) {
      const counter = timeCounter + i;
      const expectedCode = await this.generateTOTP(secret, counter, digits);

      if (expectedCode === code) {
        return true;
      }
    }

    return false;
  }

  private async generateTOTP(secret: string, counter: number, digits: number): Promise<string> {
    // This is a simplified TOTP implementation
    // In production, use a proper library like otpauth
    const counterBuffer = new ArrayBuffer(8);
    const view = new DataView(counterBuffer);
    view.setBigUint64(0, BigInt(counter), false);

    // Decode base32 secret
    const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let bitsCount = 0;
    const keyBytes: number[] = [];

    for (const char of secret.toUpperCase()) {
      const val = base32Chars.indexOf(char);
      if (val === -1) continue;

      bits = (bits << 5) | val;
      bitsCount += 5;

      if (bitsCount >= 8) {
        keyBytes.push((bits >> (bitsCount - 8)) & 0xff);
        bitsCount -= 8;
      }
    }

    const key = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(keyBytes),
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, counterBuffer);
    const hmac = new Uint8Array(signature);

    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary = ((hmac[offset] & 0x7f) << 24) |
                   ((hmac[offset + 1] & 0xff) << 16) |
                   ((hmac[offset + 2] & 0xff) << 8) |
                   (hmac[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits);
    return otp.toString().padStart(digits, '0');
  }
}
