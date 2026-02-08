/**
 * Patient Portal Routes
 * API endpoints for patient-facing portal functionality
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { PatientPortalService } from '../services/patient-portal/portal.service';

const portalRoutes = new Hono<{ Bindings: Env }>();
const portalService = new PatientPortalService();

// Apply authentication to all routes
portalRoutes.use('*', authMiddleware);

// =============================================================================
// Validation Schemas
// =============================================================================

const messageSchema = z.object({
  to: z.string(),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  category: z.enum(['general', 'appointment', 'results', 'prescription', 'billing', 'urgent']),
  threadId: z.string().optional()
});

const appointmentRequestSchema = z.object({
  preferredDates: z.array(z.string().transform(s => new Date(s))).min(1).max(5),
  preferredTimeOfDay: z.enum(['morning', 'afternoon', 'any']),
  appointmentType: z.string(),
  reason: z.string().max(500),
  urgency: z.enum(['routine', 'soon', 'urgent']),
  notes: z.string().max(1000).optional()
});

const symptomTrackerSchema = z.object({
  date: z.string().transform(s => new Date(s)),
  symptoms: z.array(z.object({
    name: z.string(),
    severity: z.number().min(1).max(5),
    notes: z.string().optional()
  })),
  vitals: z.object({
    weight: z.number().optional(),
    bloodPressureSystolic: z.number().optional(),
    bloodPressureDiastolic: z.number().optional()
  }).optional(),
  mood: z.number().min(1).max(5).optional(),
  notes: z.string().max(1000).optional()
});

// =============================================================================
// Dashboard Routes
// =============================================================================

/**
 * GET /dashboard - Get patient portal dashboard
 */
portalRoutes.get('/dashboard', async (c) => {
  const user = c.get('user' as never) as { sub: string };
  const patientId = c.req.query('patientId') || user.sub;

  try {
    const dashboard = await portalService.getDashboard(patientId);

    return c.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load dashboard'
    }, 500);
  }
});

// =============================================================================
// Appointments Routes
// =============================================================================

/**
 * GET /appointments - Get patient appointments
 */
portalRoutes.get('/appointments', async (c) => {
  const user = c.get('user' as never) as { sub: string };
  const patientId = c.req.query('patientId') || user.sub;
  const limit = parseInt(c.req.query('limit') || '10');

  try {
    const appointments = await portalService.getUpcomingAppointments(patientId, limit);

    return c.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load appointments'
    }, 500);
  }
});

/**
 * POST /appointments/request - Request a new appointment
 */
portalRoutes.post(
  '/appointments/request',
  zValidator('json', appointmentRequestSchema),
  async (c) => {
    const user = c.get('user' as never) as { sub: string };
    const patientId = c.req.query('patientId') || user.sub;
    const data = c.req.valid('json');

    try {
      const result = await portalService.requestAppointment(patientId, data);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to request appointment'
      }, 500);
    }
  }
);

/**
 * POST /appointments/:id/cancel - Cancel an appointment
 */
portalRoutes.post('/appointments/:id/cancel', async (c) => {
  const user = c.get('user' as never) as { sub: string };
  const patientId = c.req.query('patientId') || user.sub;
  const appointmentId = c.req.param('id');
  const body = await c.req.json();

  try {
    const result = await portalService.cancelAppointment(patientId, appointmentId, body.reason || '');

    return c.json({
      success: true,
      data: result
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel appointment'
    }, 500);
  }
});

// =============================================================================
// Lab Results Routes
// =============================================================================

/**
 * GET /lab-results - Get patient lab results
 */
portalRoutes.get('/lab-results', async (c) => {
  const user = c.get('user' as never) as { sub: string };
  const patientId = c.req.query('patientId') || user.sub;
  const days = parseInt(c.req.query('days') || '90');

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const results = await portalService.getRecentLabResults(patientId, since);

    return c.json({
      success: true,
      data: results
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load lab results'
    }, 500);
  }
});

// =============================================================================
// Medications Routes
// =============================================================================

/**
 * GET /medications - Get patient medications
 */
portalRoutes.get('/medications', async (c) => {
  const user = c.get('user' as never) as { sub: string };
  const patientId = c.req.query('patientId') || user.sub;

  try {
    const medications = await portalService.getActiveMedications(patientId);

    return c.json({
      success: true,
      data: medications
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load medications'
    }, 500);
  }
});

// =============================================================================
// Messages Routes
// =============================================================================

/**
 * GET /messages - Get patient messages
 */
portalRoutes.get('/messages', async (c) => {
  const user = c.get('user' as never) as { sub: string };
  const patientId = c.req.query('patientId') || user.sub;
  const category = c.req.query('category');
  const isRead = c.req.query('isRead');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    const result = await portalService.getMessages(patientId, {
      category,
      isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
      limit,
      offset
    });

    return c.json({
      success: true,
      data: result.messages,
      pagination: {
        total: result.total,
        limit,
        offset
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load messages'
    }, 500);
  }
});

/**
 * POST /messages - Send a message
 */
portalRoutes.post(
  '/messages',
  zValidator('json', messageSchema),
  async (c) => {
    const user = c.get('user' as never) as { sub: string };
    const patientId = c.req.query('patientId') || user.sub;
    const data = c.req.valid('json');

    try {
      const message = await portalService.sendMessage(patientId, data);

      return c.json({
        success: true,
        data: message
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      }, 500);
    }
  }
);

/**
 * POST /messages/:id/read - Mark message as read
 */
portalRoutes.post('/messages/:id/read', async (c) => {
  const user = c.get('user' as never) as { sub: string };
  const patientId = c.req.query('patientId') || user.sub;
  const messageId = c.req.param('id');

  try {
    await portalService.markMessageAsRead(patientId, messageId);

    return c.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark message as read'
    }, 500);
  }
});

// =============================================================================
// Documents Routes
// =============================================================================

/**
 * GET /documents - Get patient documents
 */
portalRoutes.get('/documents', async (c) => {
  const user = c.get('user' as never) as { sub: string };
  const patientId = c.req.query('patientId') || user.sub;
  const type = c.req.query('type');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    const result = await portalService.getDocuments(patientId, { type, limit, offset });

    return c.json({
      success: true,
      data: result.documents,
      pagination: {
        total: result.total,
        limit,
        offset
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load documents'
    }, 500);
  }
});

// =============================================================================
// Education Routes
// =============================================================================

/**
 * GET /education - Get educational materials
 */
portalRoutes.get('/education', async (c) => {
  const user = c.get('user' as never) as { sub: string };
  const patientId = c.req.query('patientId') || user.sub;
  const module = c.req.query('module');

  try {
    const materials = await portalService.getEducationalMaterials(patientId, module);

    return c.json({
      success: true,
      data: materials
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load educational materials'
    }, 500);
  }
});

// =============================================================================
// Symptom Tracker Routes
// =============================================================================

/**
 * POST /symptoms - Submit symptom tracker entry
 */
portalRoutes.post(
  '/symptoms',
  zValidator('json', symptomTrackerSchema),
  async (c) => {
    const user = c.get('user' as never) as { sub: string };
    const patientId = c.req.query('patientId') || user.sub;
    const data = c.req.valid('json');

    try {
      const result = await portalService.submitSymptomTracker(patientId, data);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit symptoms'
      }, 500);
    }
  }
);

/**
 * GET /symptoms - Get symptom history
 */
portalRoutes.get('/symptoms', async (c) => {
  const user = c.get('user' as never) as { sub: string };
  const patientId = c.req.query('patientId') || user.sub;
  const days = parseInt(c.req.query('days') || '30');

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  try {
    const history = await portalService.getSymptomHistory(patientId, startDate, endDate);

    return c.json({
      success: true,
      data: history
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load symptom history'
    }, 500);
  }
});

// =============================================================================
// Notifications Routes
// =============================================================================

/**
 * GET /notifications - Get patient notifications
 */
portalRoutes.get('/notifications', async (c) => {
  const user = c.get('user' as never) as { sub: string };
  const patientId = c.req.query('patientId') || user.sub;

  try {
    const notifications = await portalService.getNotifications(patientId);

    return c.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load notifications'
    }, 500);
  }
});

export default portalRoutes;
