/**
 * Healthcare Analytics Routes
 * /api/v1/healthcare/analytics
 *
 * Provides endpoints for healthcare analytics and reporting:
 * - Dashboard statistics
 * - Module-specific analytics
 * - Report generation
 * - KPIs and trends
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { sql, count, avg, desc, gte, lte, and, eq } from 'drizzle-orm';
import { logger } from '../utils/logger';
import { requireAuth, requirePermission } from '../middleware/auth';
import type { Env } from '../types';

// Import analytics services
import { DialyseAnalyticsService } from '../services/analytics/dashboard.service';

const analytics = new Hono<{ Bindings: Env }>();

// All routes require authentication
analytics.use('/*', requireAuth);

// ============================================================================
// DASHBOARD ANALYTICS
// ============================================================================

const dashboardQuerySchema = z.object({
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * GET /healthcare/analytics/dialysis/dashboard
 * Get dialysis module dashboard analytics
 */
analytics.get(
  '/dialysis/dashboard',
  requirePermission('dialyse:dashboard:read'),
  zValidator('query', dashboardQuerySchema),
  async (c) => {
    try {
      const { period, startDate, endDate } = c.req.valid('query');
      const db = c.env.DB;
      const organizationId = (c.get('user') as { organizationId?: string })?.organizationId || '';

      const dateRange = {
        startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: endDate ? new Date(endDate) : new Date(),
      };

      const service = new DialyseAnalyticsService(db);
      const data = await service.getDashboardAnalytics(organizationId, dateRange);

      return c.json({
        success: true,
        data: {
          period,
          dateRange,
          ...data,
        },
      });
    } catch (error) {
      logger.error('Dialysis dashboard error', { error });
      return c.json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load analytics',
        },
      }, 500);
    }
  }
);

/**
 * GET /healthcare/analytics/cardiology/dashboard
 * Get cardiology module dashboard analytics
 */
analytics.get(
  '/cardiology/dashboard',
  requirePermission('cardiology:dashboard:read'),
  async (c) => {
    try {
      const db = c.env.DB;
      const drizzleDb = drizzle(db);

      // Get basic stats from cardiology tables
      const [patientCount] = await drizzleDb.all(
        sql`SELECT COUNT(*) as count FROM cardiology_patients WHERE deleted_at IS NULL`
      ) as { count: number }[];

      const [consultationCount] = await drizzleDb.all(
        sql`SELECT COUNT(*) as count FROM cardiology_consultations WHERE deleted_at IS NULL`
      ) as { count: number }[];

      return c.json({
        success: true,
        data: {
          kpis: {
            totalPatients: patientCount?.count || 0,
            totalConsultations: consultationCount?.count || 0,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Cardiology dashboard error', { error });
      return c.json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load analytics',
        },
      }, 500);
    }
  }
);

/**
 * GET /healthcare/analytics/ophthalmology/dashboard
 * Get ophthalmology module dashboard analytics
 */
analytics.get(
  '/ophthalmology/dashboard',
  requirePermission('ophthalmology:dashboard:read'),
  async (c) => {
    try {
      const db = c.env.DB;
      const drizzleDb = drizzle(db);

      // Get basic stats from ophthalmology tables
      const [patientCount] = await drizzleDb.all(
        sql`SELECT COUNT(*) as count FROM ophthalmology_patients WHERE deleted_at IS NULL`
      ) as { count: number }[];

      const [consultationCount] = await drizzleDb.all(
        sql`SELECT COUNT(*) as count FROM ophthalmology_consultations WHERE deleted_at IS NULL`
      ) as { count: number }[];

      return c.json({
        success: true,
        data: {
          kpis: {
            totalPatients: patientCount?.count || 0,
            totalConsultations: consultationCount?.count || 0,
          },
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Ophthalmology dashboard error', { error });
      return c.json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load analytics',
        },
      }, 500);
    }
  }
);

/**
 * GET /healthcare/analytics/executive/dashboard
 * Get executive summary across all healthcare modules
 */
analytics.get(
  '/executive/dashboard',
  requirePermission('healthcare:executive:read'),
  async (c) => {
    try {
      const db = c.env.DB;
      const drizzleDb = drizzle(db);

      // Get counts from all modules
      const [dialysePatients] = await drizzleDb.all(
        sql`SELECT COUNT(*) as count FROM dialyse_patients WHERE deleted_at IS NULL`
      ) as { count: number }[];

      const [cardiologyPatients] = await drizzleDb.all(
        sql`SELECT COUNT(*) as count FROM cardiology_patients WHERE deleted_at IS NULL`
      ) as { count: number }[];

      const [ophthalmologyPatients] = await drizzleDb.all(
        sql`SELECT COUNT(*) as count FROM ophthalmology_patients WHERE deleted_at IS NULL`
      ) as { count: number }[];

      return c.json({
        success: true,
        data: {
          modules: {
            dialyse: {
              totalPatients: dialysePatients?.count || 0,
            },
            cardiology: {
              totalPatients: cardiologyPatients?.count || 0,
            },
            ophthalmology: {
              totalPatients: ophthalmologyPatients?.count || 0,
            },
          },
          totalPatients: (dialysePatients?.count || 0) + (cardiologyPatients?.count || 0) + (ophthalmologyPatients?.count || 0),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Executive dashboard error', { error });
      return c.json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to load analytics',
        },
      }, 500);
    }
  }
);

// ============================================================================
// REPORTS
// ============================================================================

/**
 * GET /healthcare/analytics/reports/templates
 * Get available report templates
 */
analytics.get(
  '/reports/templates',
  requirePermission('healthcare:reports:read'),
  async (c) => {
    return c.json({
      success: true,
      data: {
        templates: [
          {
            id: 'monthly',
            name: 'Rapport Mensuel',
            description: 'Rapport mensuel complet avec statistiques de tous les modules',
            requiredParams: ['startDate', 'endDate'],
            optionalParams: ['module', 'format', 'includeCharts'],
          },
          {
            id: 'kdqoi',
            name: 'Rapport KDQOI',
            description: 'Indicateurs de qualité KDQOI pour la dialyse (Kt/V, anémie, accès vasculaire)',
            requiredParams: ['startDate', 'endDate'],
            optionalParams: ['format', 'includeCharts'],
          },
          {
            id: 'patient_summary',
            name: 'Résumé Patient',
            description: 'Résumé clinique complet pour un patient spécifique',
            requiredParams: ['patientId', 'startDate', 'endDate'],
            optionalParams: ['module', 'format'],
          },
          {
            id: 'quality_indicators',
            name: 'Indicateurs Qualité',
            description: 'Tableau de bord des indicateurs de qualité avec benchmarks',
            requiredParams: ['startDate', 'endDate'],
            optionalParams: ['module', 'format'],
          },
        ],
      },
    });
  }
);

// ============================================================================
// KPIS
// ============================================================================

/**
 * GET /healthcare/analytics/kpis
 * Get current KPIs for all modules
 */
analytics.get(
  '/kpis',
  requirePermission('healthcare:analytics:read'),
  async (c) => {
    try {
      const db = c.env.DB;
      const drizzleDb = drizzle(db);

      // Get session counts
      const [todaySessions] = await drizzleDb.all(
        sql`SELECT COUNT(*) as count FROM dialyse_sessions WHERE DATE(session_date) = DATE('now') AND deleted_at IS NULL`
      ) as { count: number }[];

      const [monthSessions] = await drizzleDb.all(
        sql`SELECT COUNT(*) as count FROM dialyse_sessions WHERE session_date >= DATE('now', '-30 days') AND deleted_at IS NULL`
      ) as { count: number }[];

      // Get active alerts
      const [activeAlerts] = await drizzleDb.all(
        sql`SELECT COUNT(*) as count FROM dialyse_alerts WHERE status = 'active' AND deleted_at IS NULL`
      ) as { count: number }[];

      return c.json({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          kpis: {
            dialysis: {
              sessionsToday: todaySessions?.count || 0,
              sessionsThisMonth: monthSessions?.count || 0,
              activeAlerts: activeAlerts?.count || 0,
            },
          },
        },
      });
    } catch (error) {
      logger.error('KPIs error', { error });
      return c.json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get KPIs',
        },
      }, 500);
    }
  }
);

/**
 * GET /healthcare/analytics/alerts
 * Get active clinical alerts across all modules
 */
analytics.get(
  '/alerts',
  requirePermission('healthcare:alerts:read'),
  async (c) => {
    try {
      const db = c.env.DB;
      const drizzleDb = drizzle(db);

      // Get recent alerts
      const alerts = await drizzleDb.all(
        sql`SELECT id, type, severity, message, patient_id, created_at, status
            FROM dialyse_alerts
            WHERE status IN ('active', 'pending') AND deleted_at IS NULL
            ORDER BY CASE WHEN severity = 'critical' THEN 1 WHEN severity = 'high' THEN 2 ELSE 3 END, created_at DESC
            LIMIT 50`
      );

      return c.json({
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          alerts: alerts || [],
          count: (alerts as unknown[])?.length || 0,
        },
      });
    } catch (error) {
      logger.error('Alerts error', { error });
      return c.json({
        success: false,
        error: {
          code: 'ANALYTICS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get alerts',
        },
      }, 500);
    }
  }
);

export { analytics };
export default analytics;
