/**
 * RPM (Remote Patient Monitoring) Routes
 * /api/v1/rpm
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { requireAuth } from '../middleware/auth';
import type { Env } from '../types';
import { deviceService, readingService, programService, complianceService } from '../services/rpm';

const rpm = new Hono<{ Bindings: Env }>();

// All routes require authentication
rpm.use('/*', requireAuth);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const listQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  page: z.coerce.number().min(1).default(1),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Device schemas
const createDeviceSchema = z.object({
  deviceNumber: z.string().min(1),
  serialNumber: z.string().min(1),
  imei: z.string().optional(),
  macAddress: z.string().optional(),
  deviceType: z.enum([
    'blood_pressure_monitor', 'glucometer', 'pulse_oximeter', 'weight_scale',
    'thermometer', 'ecg_monitor', 'spirometer', 'activity_tracker',
    'continuous_glucose_monitor', 'heart_rate_monitor', 'peak_flow_meter', 'other'
  ]),
  deviceSubtype: z.string().optional(),
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  firmwareVersion: z.string().optional(),
  connectivityType: z.enum(['bluetooth', 'wifi', 'cellular', 'usb', 'manual_entry', 'api']),
  connectionDetails: z.string().optional(),
  calibrationIntervalDays: z.number().optional(),
  readingIntervalMinutes: z.number().optional(),
  alertsEnabled: z.boolean().optional(),
  deviceSettings: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  notes: z.string().optional(),
});

const updateDeviceSchema = createDeviceSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'maintenance', 'lost', 'retired', 'pending_activation']).optional(),
  statusReason: z.string().optional(),
  batteryLevel: z.number().min(0).max(100).optional(),
  isOnline: z.boolean().optional(),
});

const deviceListQuerySchema = listQuerySchema.extend({
  deviceType: z.string().optional(),
  patientId: z.string().optional(),
  unassigned: z.coerce.boolean().optional(),
});

// Reading schemas
const createReadingSchema = z.object({
  deviceId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  readingType: z.enum([
    'blood_pressure', 'blood_glucose', 'oxygen_saturation', 'weight',
    'temperature', 'heart_rate', 'respiratory_rate', 'peak_flow',
    'ecg', 'activity', 'sleep', 'spirometry', 'other'
  ]),
  measuredAt: z.string(),
  primaryValue: z.number(),
  primaryUnit: z.string().min(1),
  secondaryValue: z.number().optional(),
  secondaryUnit: z.string().optional(),
  tertiaryValue: z.number().optional(),
  tertiaryUnit: z.string().optional(),
  readingData: z.string().optional(),
  context: z.enum([
    'fasting', 'post_meal', 'before_meal', 'before_exercise', 'after_exercise',
    'resting', 'morning', 'evening', 'before_medication', 'after_medication',
    'random', 'scheduled'
  ]).optional(),
  bodyPosition: z.enum(['sitting', 'standing', 'lying', 'other']).optional(),
  activityLevel: z.enum(['resting', 'light', 'moderate', 'vigorous']).optional(),
  qualityScore: z.number().min(0).max(100).optional(),
  entryMethod: z.enum(['device_automatic', 'device_manual', 'patient_manual', 'provider_entry', 'api_sync']),
  patientNotes: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
});

const readingListQuerySchema = listQuerySchema.extend({
  readingType: z.string().optional(),
  deviceId: z.string().optional(),
  programId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isValid: z.coerce.boolean().optional(),
  triggeredAlert: z.coerce.boolean().optional(),
});

// Program schemas
const createProgramSchema = z.object({
  programCode: z.string().min(1),
  programName: z.string().min(1),
  description: z.string().optional(),
  programType: z.enum([
    'hypertension', 'diabetes', 'ckd', 'chf', 'copd', 'weight_management',
    'post_surgery', 'pregnancy', 'cardiac_rehab', 'general_wellness', 'custom'
  ]),
  associatedModule: z.enum(['dialyse', 'cardiology', 'ophthalmology', 'general']).optional(),
  requiredReadingTypes: z.array(z.string()),
  readingFrequency: z.record(z.string()).optional(),
  minimumReadingsPerWeek: z.number().optional(),
  alertThresholds: z.record(z.any()).optional(),
  complianceTargetPercent: z.number().min(0).max(100).optional(),
  complianceWindowDays: z.number().optional(),
  programDurationDays: z.number().optional(),
  cptCode: z.string().optional(),
  billingRatePerMonth: z.number().optional(),
  notes: z.string().optional(),
});

const updateProgramSchema = createProgramSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'archived']).optional(),
});

// Enrollment schemas
const createEnrollmentSchema = z.object({
  patientId: z.string().uuid(),
  programId: z.string().uuid(),
  startDate: z.string(),
  expectedEndDate: z.string().optional(),
  primaryPhysicianId: z.string().uuid().optional(),
  careCoordinatorId: z.string().uuid().optional(),
  customAlertThresholds: z.record(z.any()).optional(),
  customReadingFrequency: z.record(z.string()).optional(),
  patientGoals: z.record(z.any()).optional(),
  assignedDevices: z.array(z.string().uuid()).optional(),
  notes: z.string().optional(),
});

const updateEnrollmentSchema = createEnrollmentSchema.partial().extend({
  status: z.enum(['active', 'paused', 'completed', 'discontinued', 'expired']).optional(),
  statusReason: z.string().optional(),
  consentObtained: z.boolean().optional(),
  consentDocumentUrl: z.string().optional(),
});

// Time log schema
const timeLogSchema = z.object({
  patientId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  providerId: z.string().uuid(),
  activityDate: z.string(),
  durationMinutes: z.number().min(1),
  activityType: z.enum([
    'data_review', 'patient_education', 'care_coordination',
    'phone_consultation', 'alert_response', 'treatment_adjustment',
    'documentation', 'device_setup', 'other'
  ]),
  description: z.string().optional(),
  relatedAlertId: z.string().uuid().optional(),
  relatedReadingIds: z.array(z.string().uuid()).optional(),
  isBillable: z.boolean().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// DEVICES
// ============================================================================

/**
 * List devices
 */
rpm.get('/devices', zValidator('query', deviceListQuerySchema), async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.valid('query');

    const result = await deviceService.list(user.organizationId, {
      status: query.status,
      deviceType: query.deviceType,
      patientId: query.patientId,
      unassigned: query.unassigned,
      search: query.search,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return c.json({
      success: true,
      data: result.devices,
      pagination: {
        total: result.total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(result.total / query.limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to list devices:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get device by ID
 */
rpm.get('/devices/:id', async (c) => {
  try {
    const user = c.get('user');
    const deviceId = c.req.param('id');

    const device = await deviceService.getById(user.organizationId, deviceId);
    if (!device) {
      return c.json({ success: false, error: 'Device not found' }, 404);
    }

    // Get device events
    const events = await deviceService.getDeviceEvents(user.organizationId, deviceId, 20);

    return c.json({
      success: true,
      data: { ...device, events },
    });
  } catch (error: any) {
    logger.error('Failed to get device:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Create device
 */
rpm.post('/devices', zValidator('json', createDeviceSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = c.req.valid('json');

    const device = await deviceService.create(user.organizationId, user.id, data);

    return c.json({ success: true, data: device }, 201);
  } catch (error: any) {
    logger.error('Failed to create device:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Update device
 */
rpm.patch('/devices/:id', zValidator('json', updateDeviceSchema), async (c) => {
  try {
    const user = c.get('user');
    const deviceId = c.req.param('id');
    const data = c.req.valid('json');

    const device = await deviceService.update(user.organizationId, deviceId, user.id, data);
    if (!device) {
      return c.json({ success: false, error: 'Device not found' }, 404);
    }

    return c.json({ success: true, data: device });
  } catch (error: any) {
    logger.error('Failed to update device:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Assign device to patient
 */
rpm.post('/devices/:id/assign', zValidator('json', z.object({ patientId: z.string().uuid() })), async (c) => {
  try {
    const user = c.get('user');
    const deviceId = c.req.param('id');
    const { patientId } = c.req.valid('json');

    const device = await deviceService.assignToPatient(user.organizationId, deviceId, user.id, patientId);
    if (!device) {
      return c.json({ success: false, error: 'Device not found' }, 404);
    }

    return c.json({ success: true, data: device });
  } catch (error: any) {
    logger.error('Failed to assign device:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Unassign device from patient
 */
rpm.post('/devices/:id/unassign', async (c) => {
  try {
    const user = c.get('user');
    const deviceId = c.req.param('id');

    const device = await deviceService.unassignFromPatient(user.organizationId, deviceId, user.id);
    if (!device) {
      return c.json({ success: false, error: 'Device not found' }, 404);
    }

    return c.json({ success: true, data: device });
  } catch (error: any) {
    logger.error('Failed to unassign device:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Delete device
 */
rpm.delete('/devices/:id', async (c) => {
  try {
    const user = c.get('user');
    const deviceId = c.req.param('id');

    const deleted = await deviceService.delete(user.organizationId, deviceId, user.id);
    if (!deleted) {
      return c.json({ success: false, error: 'Device not found' }, 404);
    }

    return c.json({ success: true, message: 'Device retired successfully' });
  } catch (error: any) {
    logger.error('Failed to delete device:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get devices needing attention
 */
rpm.get('/devices/alerts/summary', async (c) => {
  try {
    const user = c.get('user');

    const [needingCalibration, offline, lowBattery] = await Promise.all([
      deviceService.getDevicesNeedingCalibration(user.organizationId),
      deviceService.getOfflineDevices(user.organizationId, 24),
      deviceService.getLowBatteryDevices(user.organizationId, 20),
    ]);

    return c.json({
      success: true,
      data: {
        needingCalibration,
        offline,
        lowBattery,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get device alerts:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// READINGS
// ============================================================================

/**
 * List readings for a patient
 */
rpm.get('/patients/:patientId/readings', zValidator('query', readingListQuerySchema), async (c) => {
  try {
    const user = c.get('user');
    const patientId = c.req.param('patientId');
    const query = c.req.valid('query');

    const result = await readingService.list(user.organizationId, {
      patientId,
      readingType: query.readingType,
      deviceId: query.deviceId,
      programId: query.programId,
      startDate: query.startDate,
      endDate: query.endDate,
      isValid: query.isValid,
      triggeredAlert: query.triggeredAlert,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return c.json({
      success: true,
      data: result.readings,
      pagination: {
        total: result.total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(result.total / query.limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to list readings:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get latest readings for a patient
 */
rpm.get('/patients/:patientId/readings/latest', async (c) => {
  try {
    const user = c.get('user');
    const patientId = c.req.param('patientId');

    const readings = await readingService.getLatestByType(user.organizationId, patientId);

    return c.json({ success: true, data: readings });
  } catch (error: any) {
    logger.error('Failed to get latest readings:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get reading statistics
 */
rpm.get('/patients/:patientId/readings/stats', async (c) => {
  try {
    const user = c.get('user');
    const patientId = c.req.param('patientId');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await readingService.getStats(user.organizationId, patientId, start, end);

    return c.json({ success: true, data: stats });
  } catch (error: any) {
    logger.error('Failed to get reading stats:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Create reading
 */
rpm.post('/patients/:patientId/readings', zValidator('json', createReadingSchema), async (c) => {
  try {
    const user = c.get('user');
    const patientId = c.req.param('patientId');
    const data = c.req.valid('json');

    const reading = await readingService.create(user.organizationId, patientId, data);

    return c.json({ success: true, data: reading }, 201);
  } catch (error: any) {
    logger.error('Failed to create reading:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get reading by ID
 */
rpm.get('/readings/:id', async (c) => {
  try {
    const user = c.get('user');
    const readingId = c.req.param('id');

    const reading = await readingService.getById(user.organizationId, readingId);
    if (!reading) {
      return c.json({ success: false, error: 'Reading not found' }, 404);
    }

    return c.json({ success: true, data: reading });
  } catch (error: any) {
    logger.error('Failed to get reading:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Mark reading as invalid
 */
rpm.post('/readings/:id/invalidate', zValidator('json', z.object({ reason: z.string().min(1) })), async (c) => {
  try {
    const user = c.get('user');
    const readingId = c.req.param('id');
    const { reason } = c.req.valid('json');

    const reading = await readingService.markInvalid(user.organizationId, readingId, user.id, reason);
    if (!reading) {
      return c.json({ success: false, error: 'Reading not found' }, 404);
    }

    return c.json({ success: true, data: reading });
  } catch (error: any) {
    logger.error('Failed to invalidate reading:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Review reading
 */
rpm.post('/readings/:id/review', zValidator('json', z.object({ notes: z.string().optional() })), async (c) => {
  try {
    const user = c.get('user');
    const readingId = c.req.param('id');
    const { notes } = c.req.valid('json');

    const reading = await readingService.review(user.organizationId, readingId, user.id, notes);
    if (!reading) {
      return c.json({ success: false, error: 'Reading not found' }, 404);
    }

    return c.json({ success: true, data: reading });
  } catch (error: any) {
    logger.error('Failed to review reading:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// PROGRAMS
// ============================================================================

/**
 * List programs
 */
rpm.get('/programs', zValidator('query', listQuerySchema.extend({
  programType: z.string().optional(),
  associatedModule: z.string().optional(),
})), async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.valid('query');

    const result = await programService.listPrograms(user.organizationId, {
      status: query.status,
      programType: query.programType,
      associatedModule: query.associatedModule,
      search: query.search,
      page: query.page,
      limit: query.limit,
    });

    return c.json({
      success: true,
      data: result.programs,
      pagination: {
        total: result.total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(result.total / query.limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to list programs:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get program by ID
 */
rpm.get('/programs/:id', async (c) => {
  try {
    const user = c.get('user');
    const programId = c.req.param('id');

    const program = await programService.getProgramById(user.organizationId, programId);
    if (!program) {
      return c.json({ success: false, error: 'Program not found' }, 404);
    }

    // Get enrollment counts
    const enrollmentCounts = await programService.getEnrollmentCountsByProgram(user.organizationId);
    const activeEnrollments = enrollmentCounts.find(e => e.programId === programId)?.count || 0;

    return c.json({
      success: true,
      data: { ...program, activeEnrollments },
    });
  } catch (error: any) {
    logger.error('Failed to get program:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Create program
 */
rpm.post('/programs', zValidator('json', createProgramSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = c.req.valid('json');

    const program = await programService.createProgram(user.organizationId, user.id, data);

    return c.json({ success: true, data: program }, 201);
  } catch (error: any) {
    logger.error('Failed to create program:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Update program
 */
rpm.patch('/programs/:id', zValidator('json', updateProgramSchema), async (c) => {
  try {
    const user = c.get('user');
    const programId = c.req.param('id');
    const data = c.req.valid('json');

    const program = await programService.updateProgram(user.organizationId, programId, data);
    if (!program) {
      return c.json({ success: false, error: 'Program not found' }, 404);
    }

    return c.json({ success: true, data: program });
  } catch (error: any) {
    logger.error('Failed to update program:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Delete program
 */
rpm.delete('/programs/:id', async (c) => {
  try {
    const user = c.get('user');
    const programId = c.req.param('id');

    const deleted = await programService.deleteProgram(user.organizationId, programId);
    if (!deleted) {
      return c.json({ success: false, error: 'Program not found' }, 404);
    }

    return c.json({ success: true, message: 'Program archived successfully' });
  } catch (error: any) {
    logger.error('Failed to delete program:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// ENROLLMENTS
// ============================================================================

/**
 * List enrollments
 */
rpm.get('/enrollments', zValidator('query', listQuerySchema.extend({
  patientId: z.string().optional(),
  programId: z.string().optional(),
})), async (c) => {
  try {
    const user = c.get('user');
    const query = c.req.valid('query');

    const result = await programService.listEnrollments(user.organizationId, {
      patientId: query.patientId,
      programId: query.programId,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });

    return c.json({
      success: true,
      data: result.enrollments,
      pagination: {
        total: result.total,
        page: query.page,
        limit: query.limit,
        pages: Math.ceil(result.total / query.limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to list enrollments:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get enrollment by ID
 */
rpm.get('/enrollments/:id', async (c) => {
  try {
    const user = c.get('user');
    const enrollmentId = c.req.param('id');

    const enrollment = await programService.getEnrollmentById(user.organizationId, enrollmentId);
    if (!enrollment) {
      return c.json({ success: false, error: 'Enrollment not found' }, 404);
    }

    // Get compliance history
    const compliance = await complianceService.getComplianceHistory(
      user.organizationId,
      enrollmentId,
      'weekly',
      10
    );

    return c.json({
      success: true,
      data: { ...enrollment, complianceHistory: compliance },
    });
  } catch (error: any) {
    logger.error('Failed to get enrollment:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Enroll patient
 */
rpm.post('/enrollments', zValidator('json', createEnrollmentSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = c.req.valid('json');

    const enrollment = await programService.enrollPatient(user.organizationId, user.id, data);

    return c.json({ success: true, data: enrollment }, 201);
  } catch (error: any) {
    logger.error('Failed to enroll patient:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Update enrollment
 */
rpm.patch('/enrollments/:id', zValidator('json', updateEnrollmentSchema), async (c) => {
  try {
    const user = c.get('user');
    const enrollmentId = c.req.param('id');
    const data = c.req.valid('json');

    const enrollment = await programService.updateEnrollment(user.organizationId, enrollmentId, user.id, data);
    if (!enrollment) {
      return c.json({ success: false, error: 'Enrollment not found' }, 404);
    }

    return c.json({ success: true, data: enrollment });
  } catch (error: any) {
    logger.error('Failed to update enrollment:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Pause enrollment
 */
rpm.post('/enrollments/:id/pause', zValidator('json', z.object({ reason: z.string().min(1) })), async (c) => {
  try {
    const user = c.get('user');
    const enrollmentId = c.req.param('id');
    const { reason } = c.req.valid('json');

    const enrollment = await programService.pauseEnrollment(user.organizationId, enrollmentId, user.id, reason);
    if (!enrollment) {
      return c.json({ success: false, error: 'Enrollment not found' }, 404);
    }

    return c.json({ success: true, data: enrollment });
  } catch (error: any) {
    logger.error('Failed to pause enrollment:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Resume enrollment
 */
rpm.post('/enrollments/:id/resume', async (c) => {
  try {
    const user = c.get('user');
    const enrollmentId = c.req.param('id');

    const enrollment = await programService.resumeEnrollment(user.organizationId, enrollmentId, user.id);
    if (!enrollment) {
      return c.json({ success: false, error: 'Enrollment not found' }, 404);
    }

    return c.json({ success: true, data: enrollment });
  } catch (error: any) {
    logger.error('Failed to resume enrollment:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Complete enrollment
 */
rpm.post('/enrollments/:id/complete', zValidator('json', z.object({ notes: z.string().optional() })), async (c) => {
  try {
    const user = c.get('user');
    const enrollmentId = c.req.param('id');
    const { notes } = c.req.valid('json');

    const enrollment = await programService.completeEnrollment(user.organizationId, enrollmentId, user.id, notes);
    if (!enrollment) {
      return c.json({ success: false, error: 'Enrollment not found' }, 404);
    }

    return c.json({ success: true, data: enrollment });
  } catch (error: any) {
    logger.error('Failed to complete enrollment:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Discontinue enrollment
 */
rpm.post('/enrollments/:id/discontinue', zValidator('json', z.object({ reason: z.string().min(1) })), async (c) => {
  try {
    const user = c.get('user');
    const enrollmentId = c.req.param('id');
    const { reason } = c.req.valid('json');

    const enrollment = await programService.discontinueEnrollment(user.organizationId, enrollmentId, user.id, reason);
    if (!enrollment) {
      return c.json({ success: false, error: 'Enrollment not found' }, 404);
    }

    return c.json({ success: true, data: enrollment });
  } catch (error: any) {
    logger.error('Failed to discontinue enrollment:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// COMPLIANCE
// ============================================================================

/**
 * Calculate compliance for enrollment
 */
rpm.post('/enrollments/:id/compliance/calculate', zValidator('json', z.object({
  periodType: z.enum(['daily', 'weekly', 'monthly']),
  periodStart: z.string(),
  periodEnd: z.string(),
})), async (c) => {
  try {
    const user = c.get('user');
    const enrollmentId = c.req.param('id');
    const { periodType, periodStart, periodEnd } = c.req.valid('json');

    const compliance = await complianceService.calculateCompliance(
      user.organizationId,
      enrollmentId,
      periodType,
      new Date(periodStart),
      new Date(periodEnd)
    );

    return c.json({ success: true, data: compliance });
  } catch (error: any) {
    logger.error('Failed to calculate compliance:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get non-compliant patients
 */
rpm.get('/compliance/non-compliant', async (c) => {
  try {
    const user = c.get('user');
    const threshold = c.req.query('threshold') ? parseInt(c.req.query('threshold')!) : 80;

    const patients = await complianceService.getNonCompliantPatients(user.organizationId, threshold);

    return c.json({ success: true, data: patients });
  } catch (error: any) {
    logger.error('Failed to get non-compliant patients:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get organization compliance summary
 */
rpm.get('/compliance/summary', async (c) => {
  try {
    const user = c.get('user');

    const summary = await complianceService.getOrganizationComplianceSummary(user.organizationId);

    return c.json({ success: true, data: summary });
  } catch (error: any) {
    logger.error('Failed to get compliance summary:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// TIME TRACKING
// ============================================================================

/**
 * Log time
 */
rpm.post('/time-logs', zValidator('json', timeLogSchema), async (c) => {
  try {
    const user = c.get('user');
    const data = c.req.valid('json');

    const timeLog = await complianceService.logTime(user.organizationId, user.id, data);

    return c.json({ success: true, data: timeLog }, 201);
  } catch (error: any) {
    logger.error('Failed to log time:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get time logs for enrollment
 */
rpm.get('/enrollments/:id/time-logs', async (c) => {
  try {
    const user = c.get('user');
    const enrollmentId = c.req.param('id');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    const logs = await complianceService.getTimeLogs(
      user.organizationId,
      enrollmentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return c.json({ success: true, data: logs });
  } catch (error: any) {
    logger.error('Failed to get time logs:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// BILLING
// ============================================================================

/**
 * Calculate billing period
 */
rpm.post('/enrollments/:id/billing/calculate', zValidator('json', z.object({
  periodMonth: z.number(), // YYYYMM format
})), async (c) => {
  try {
    const user = c.get('user');
    const enrollmentId = c.req.param('id');
    const { periodMonth } = c.req.valid('json');

    const billing = await complianceService.calculateBillingPeriod(
      user.organizationId,
      enrollmentId,
      periodMonth
    );

    return c.json({ success: true, data: billing });
  } catch (error: any) {
    logger.error('Failed to calculate billing:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get billing periods for enrollment
 */
rpm.get('/enrollments/:id/billing', async (c) => {
  try {
    const user = c.get('user');
    const enrollmentId = c.req.param('id');

    const periods = await complianceService.getBillingPeriods(user.organizationId, enrollmentId);

    return c.json({ success: true, data: periods });
  } catch (error: any) {
    logger.error('Failed to get billing periods:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Mark billing period as billed
 */
rpm.post('/billing/:id/mark-billed', zValidator('json', z.object({
  claimNumber: z.string().min(1),
  billedAmount: z.number().min(0),
})), async (c) => {
  try {
    const user = c.get('user');
    const billingPeriodId = c.req.param('id');
    const { claimNumber, billedAmount } = c.req.valid('json');

    const billing = await complianceService.markBilled(
      user.organizationId,
      billingPeriodId,
      claimNumber,
      billedAmount
    );

    return c.json({ success: true, data: billing });
  } catch (error: any) {
    logger.error('Failed to mark as billed:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Record payment
 */
rpm.post('/billing/:id/record-payment', zValidator('json', z.object({
  paidAmount: z.number().min(0),
})), async (c) => {
  try {
    const user = c.get('user');
    const billingPeriodId = c.req.param('id');
    const { paidAmount } = c.req.valid('json');

    const billing = await complianceService.recordPayment(
      user.organizationId,
      billingPeriodId,
      paidAmount
    );

    return c.json({ success: true, data: billing });
  } catch (error: any) {
    logger.error('Failed to record payment:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default rpm;
