/**
 * Standardized Healthcare Authentication Middleware Stack
 * Provides consistent authentication, authorization, and validation for healthcare routes
 */

import { createMiddleware } from 'hono/factory';
import type { Context, Next } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from './auth';
import { checkPermission } from './rbac';
import { apiRateLimitMiddleware, RATE_LIMITS } from '../utils/rate-limit';

/**
 * Healthcare module types
 */
export type HealthcareModule = 'dialyse' | 'cardiology' | 'ophthalmology';

/**
 * Permission action types
 */
export type PermissionAction = 'read' | 'create' | 'update' | 'delete' | 'export';

/**
 * Build permission string for healthcare modules
 */
export function buildPermission(module: HealthcareModule, action: PermissionAction): string {
  return `${module}:${action}`;
}

/**
 * Validate organization context exists
 */
export const requireOrganization = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const organizationId = c.get('organizationId');

  if (!organizationId) {
    return c.json({
      error: {
        code: 'MISSING_ORGANIZATION',
        message: 'Organization ID is required for healthcare operations',
      },
    }, 400);
  }

  await next();
});

/**
 * Validate patient exists and belongs to organization
 */
export function requirePatient(patientIdParam: string = 'patientId') {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const patientId = c.req.param(patientIdParam) || c.req.param('id');
    const organizationId = c.get('organizationId');

    if (!patientId) {
      return c.json({
        error: {
          code: 'MISSING_PATIENT_ID',
          message: 'Patient ID is required',
        },
      }, 400);
    }

    // Verify patient exists in organization
    const patient = await c.env.DB.prepare(`
      SELECT id FROM dialyse_patients WHERE id = ? AND organization_id = ?
      UNION
      SELECT id FROM healthcare_patients WHERE id = ? AND company_id = ?
    `).bind(patientId, organizationId, patientId, organizationId).first();

    if (!patient) {
      return c.json({
        error: {
          code: 'PATIENT_NOT_FOUND',
          message: 'Patient not found in this organization',
        },
      }, 404);
    }

    // Store patient ID for later use
    c.set('patientId', patientId);
    await next();
  });
}

/**
 * Rate limiting for sensitive healthcare operations
 */
export const healthcareSensitiveRateLimit = apiRateLimitMiddleware(RATE_LIMITS.API_SENSITIVE);

/**
 * Rate limiting for healthcare read operations
 */
export const healthcareReadRateLimit = apiRateLimitMiddleware(RATE_LIMITS.API_AUTH);

/**
 * Rate limiting for healthcare export operations
 */
export const healthcareExportRateLimit = apiRateLimitMiddleware({
  maxAttempts: 10,
  windowMs: 60 * 1000,
});

/**
 * Audit logging for healthcare operations
 */
export function auditHealthcareAccess(action: string, resourceType: string) {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const startTime = Date.now();
    const userId = c.get('userId');
    const organizationId = c.get('organizationId');
    const patientId = c.get('patientId') || c.req.param('id') || c.req.param('patientId');

    // Execute the request
    await next();

    // Log access (async, don't block response)
    const duration = Date.now() - startTime;
    const status = c.res.status;

    try {
      await c.env.DB.prepare(`
        INSERT INTO audit_logs (
          id, organization_id, user_id, action, resource_type, resource_id,
          ip_address, user_agent, status_code, duration_ms, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        organizationId,
        userId,
        action,
        resourceType,
        patientId || null,
        c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
        c.req.header('User-Agent') || 'unknown',
        status,
        duration,
        new Date().toISOString()
      ).run();
    } catch (error) {
      // Don't fail request if audit logging fails
      console.error('Audit log error:', error);
    }
  });
}

/**
 * Combined middleware stack for healthcare read operations
 */
export function withHealthcareRead(module: HealthcareModule) {
  const permission = buildPermission(module, 'read');
  return [
    authMiddleware,
    checkPermission(permission),
    requireOrganization,
    healthcareReadRateLimit,
    auditHealthcareAccess('read', module),
  ];
}

/**
 * Combined middleware stack for healthcare create operations
 */
export function withHealthcareCreate(module: HealthcareModule) {
  const permission = buildPermission(module, 'create');
  return [
    authMiddleware,
    checkPermission(permission),
    requireOrganization,
    healthcareSensitiveRateLimit,
    auditHealthcareAccess('create', module),
  ];
}

/**
 * Combined middleware stack for healthcare update operations
 */
export function withHealthcareUpdate(module: HealthcareModule) {
  const permission = buildPermission(module, 'update');
  return [
    authMiddleware,
    checkPermission(permission),
    requireOrganization,
    healthcareSensitiveRateLimit,
    auditHealthcareAccess('update', module),
  ];
}

/**
 * Combined middleware stack for healthcare delete operations
 */
export function withHealthcareDelete(module: HealthcareModule) {
  const permission = buildPermission(module, 'delete');
  return [
    authMiddleware,
    checkPermission(permission),
    requireOrganization,
    healthcareSensitiveRateLimit,
    auditHealthcareAccess('delete', module),
  ];
}

/**
 * Combined middleware stack for patient-specific operations
 */
export function withPatientAccess(module: HealthcareModule, action: PermissionAction) {
  const permission = buildPermission(module, action);
  return [
    authMiddleware,
    checkPermission(permission),
    requireOrganization,
    requirePatient(),
    action === 'read' ? healthcareReadRateLimit : healthcareSensitiveRateLimit,
    auditHealthcareAccess(action, `${module}_patient`),
  ];
}

/**
 * Combined middleware stack for export operations
 */
export function withHealthcareExport(module: HealthcareModule) {
  const permission = buildPermission(module, 'export');
  return [
    authMiddleware,
    checkPermission(permission),
    requireOrganization,
    healthcareExportRateLimit,
    auditHealthcareAccess('export', module),
  ];
}

/**
 * Helper to apply middleware stack to a route
 * Usage: dialyse.get('/patients', ...applyMiddleware(withHealthcareRead('dialyse')), handler)
 */
export function applyMiddleware(middlewares: any[]): any[] {
  return middlewares;
}

/**
 * Healthcare context type extension
 */
declare module 'hono' {
  interface ContextVariableMap {
    patientId?: string;
  }
}
