/**
 * Cardiology Routes
 * /api/v1/cardiology
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth, requirePermission } from '../middleware/auth';
import type { Env } from '../types';
import { getDb } from '../db';
import { eq, desc, and, sql, like, or, count } from 'drizzle-orm';
import {
  healthcarePatients,
  healthcareConsultations,
  healthcareExaminations,
  healthcareImplantedDevices,
  healthcareChronicConditions,
  healthcareAlerts,
  healthcareAppointments,
  cardiologyEcgRecords,
  cardiologyEchocardiograms,
  cardiologyHolterRecords,
  cardiologyPacemakers,
  cardiologyPacemakerInterrogations,
  cardiologyStents,
  cardiologyRiskScores,
  cardiologyCardiacEvents,
  cardiologyMedications,
  contacts,
} from '@perfex/database';

const cardiology = new Hono<{ Bindings: Env }>();

// All routes require authentication
cardiology.use('/*', requireAuth);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const listQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  status: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

const patientQuerySchema = listQuerySchema.extend({
  patientStatus: z.enum(['active', 'inactive', 'deceased', 'transferred']).optional(),
});

const createPatientSchema = z.object({
  contactId: z.string().uuid(),
  medicalId: z.string().min(1),
  nationalId: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  bloodType: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  medicalHistory: z.any().optional(),
  familyHistory: z.any().optional(),
  surgicalHistory: z.array(z.string()).optional(),
  currentMedications: z.array(z.any()).optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  referringPhysician: z.string().optional(),
  notes: z.string().optional(),
});

const updatePatientSchema = createPatientSchema.partial();

const createConsultationSchema = z.object({
  patientId: z.string().uuid(),
  consultationDate: z.string(),
  consultationType: z.enum(['initial', 'follow_up', 'emergency', 'pre_operative', 'post_operative']),
  providerId: z.string().uuid().optional(),
  chiefComplaint: z.string().optional(),
  historyOfPresentIllness: z.string().optional(),
  weightKg: z.number().optional(),
  heightCm: z.number().optional(),
  systolicBp: z.number().optional(),
  diastolicBp: z.number().optional(),
  heartRate: z.number().optional(),
  respiratoryRate: z.number().optional(),
  temperature: z.number().optional(),
  oxygenSaturation: z.number().optional(),
  physicalExamination: z.string().optional(),
  assessment: z.string().optional(),
  diagnosis: z.array(z.string()).optional(),
  treatmentPlan: z.string().optional(),
  prescriptions: z.array(z.any()).optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

const createEcgSchema = z.object({
  patientId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  recordingDate: z.string(),
  ecgType: z.enum(['standard_12_lead', 'rhythm_strip', 'stress_test', 'signal_averaged']),
  paperSpeed: z.number().optional(),
  gain: z.number().optional(),
  heartRate: z.number().optional(),
  prInterval: z.number().optional(),
  qrsDuration: z.number().optional(),
  qtInterval: z.number().optional(),
  qtcInterval: z.number().optional(),
  axis: z.number().optional(),
  rhythm: z.enum(['sinus', 'afib', 'aflutter', 'svt', 'vt', 'paced', 'other']).optional(),
  interpretation: z.string().optional(),
  ecgImageUrl: z.string().optional(),
  performedById: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const createEchoSchema = z.object({
  patientId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  studyDate: z.string(),
  echoType: z.enum(['tte', 'tee', 'stress', 'contrast', 'strain']),
  indication: z.string().optional(),
  lvEf: z.number().optional(),
  lvEfMethod: z.enum(['visual', 'biplane', 'simpson', '3d']).optional(),
  lvedd: z.number().optional(),
  lvesd: z.number().optional(),
  laVolume: z.number().optional(),
  mitralRegurgitation: z.enum(['none', 'trivial', 'mild', 'moderate', 'severe']).optional(),
  aorticRegurgitation: z.enum(['none', 'trivial', 'mild', 'moderate', 'severe']).optional(),
  tricuspidRegurgitation: z.enum(['none', 'trivial', 'mild', 'moderate', 'severe']).optional(),
  rvsp: z.number().optional(),
  diastolicFunction: z.enum(['normal', 'grade_1', 'grade_2', 'grade_3', 'indeterminate']).optional(),
  pericardialEffusion: z.enum(['none', 'trivial', 'small', 'moderate', 'large']).optional(),
  interpretation: z.string().optional(),
  conclusion: z.string().optional(),
  recommendations: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  performedById: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const createPacemakerSchema = z.object({
  patientId: z.string().uuid(),
  deviceType: z.enum(['single_chamber_pacemaker', 'dual_chamber_pacemaker', 'crt_p', 'single_chamber_icd', 'dual_chamber_icd', 'crt_d', 'leadless']),
  indication: z.string(),
  manufacturer: z.string(),
  model: z.string(),
  serialNumber: z.string(),
  implantDate: z.string(),
  implantedById: z.string().uuid().optional(),
  implantCenter: z.string().optional(),
  mode: z.string().optional(),
  lowerRate: z.number().optional(),
  upperRate: z.number().optional(),
  batteryStatus: z.enum(['ok', 'elective_replacement', 'end_of_life']).optional(),
  remoteMonitoringEnabled: z.boolean().optional(),
  mriConditional: z.boolean().optional(),
  notes: z.string().optional(),
});

const createStentSchema = z.object({
  patientId: z.string().uuid(),
  procedureDate: z.string(),
  procedureType: z.enum(['primary_pci', 'elective_pci', 'rescue_pci', 'staged_pci']),
  indication: z.string(),
  clinicalPresentation: z.enum(['stemi', 'nstemi', 'unstable_angina', 'stable_angina', 'silent_ischemia']).optional(),
  vesselName: z.string(),
  vesselSegment: z.string().optional(),
  stentType: z.enum(['des', 'bms', 'bioresorbable', 'drug_coated_balloon']),
  stentManufacturer: z.string().optional(),
  stentModel: z.string().optional(),
  stentDiameter: z.number().optional(),
  stentLength: z.number().optional(),
  procedureSuccess: z.boolean().optional(),
  operatorId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const createRiskScoreSchema = z.object({
  patientId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  scoreType: z.enum(['score2', 'score2_op', 'cha2ds2_vasc', 'has_bled', 'heart', 'timi', 'grace', 'crusade', 'framingham', 'euroscore2', 'syntax']),
  inputParameters: z.any(),
  scoreValue: z.number(),
  riskCategory: z.enum(['very_low', 'low', 'moderate', 'high', 'very_high']).optional(),
  riskPercentage: z.number().optional(),
  interpretation: z.string().optional(),
  recommendations: z.string().optional(),
  notes: z.string().optional(),
});

const createMedicationSchema = z.object({
  patientId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  medicationName: z.string(),
  genericName: z.string().optional(),
  medicationClass: z.enum(['antiplatelet', 'anticoagulant', 'statin', 'beta_blocker', 'ace_inhibitor', 'arb', 'arni', 'calcium_channel_blocker', 'diuretic', 'mra', 'antiarrhythmic', 'nitrate', 'sglt2i', 'other']).optional(),
  dose: z.string(),
  frequency: z.string(),
  route: z.enum(['oral', 'iv', 'sc', 'im', 'topical', 'sublingual']).optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  indication: z.string().optional(),
  prescribedById: z.string().uuid().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// DASHBOARD & STATS
// ============================================================================

/**
 * GET /cardiology/dashboard/stats
 * Get cardiology dashboard statistics
 */
cardiology.get(
  '/dashboard/stats',
  requirePermission('cardiology:read'),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');

      // Get patient counts
      const [totalPatients] = await db
        .select({ count: count() })
        .from(healthcarePatients)
        .where(and(
          eq(healthcarePatients.organizationId, organizationId),
          sql`JSON_EXTRACT(${healthcarePatients.enrolledModules}, '$') LIKE '%cardiology%'`
        ));

      // Get today's appointments
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [todayAppointments] = await db
        .select({ count: count() })
        .from(healthcareAppointments)
        .where(and(
          eq(healthcareAppointments.organizationId, organizationId),
          eq(healthcareAppointments.module, 'cardiology'),
          sql`${healthcareAppointments.scheduledDate} >= ${today.getTime()}`,
          sql`${healthcareAppointments.scheduledDate} < ${tomorrow.getTime()}`
        ));

      // Get pending ECGs
      const [pendingEcgs] = await db
        .select({ count: count() })
        .from(cardiologyEcgRecords)
        .where(and(
          eq(cardiologyEcgRecords.organizationId, organizationId),
          eq(cardiologyEcgRecords.status, 'pending')
        ));

      // Get active pacemakers
      const [activePacemakers] = await db
        .select({ count: count() })
        .from(cardiologyPacemakers)
        .where(and(
          eq(cardiologyPacemakers.organizationId, organizationId),
          eq(cardiologyPacemakers.status, 'active')
        ));

      // Get critical alerts
      const [criticalAlerts] = await db
        .select({ count: count() })
        .from(healthcareAlerts)
        .where(and(
          eq(healthcareAlerts.organizationId, organizationId),
          eq(healthcareAlerts.module, 'cardiology'),
          eq(healthcareAlerts.status, 'active'),
          eq(healthcareAlerts.severity, 'critical')
        ));

      // Get recent cardiac events (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [recentEvents] = await db
        .select({ count: count() })
        .from(cardiologyCardiacEvents)
        .where(and(
          eq(cardiologyCardiacEvents.organizationId, organizationId),
          sql`${cardiologyCardiacEvents.eventDate} >= ${thirtyDaysAgo.getTime()}`
        ));

      return c.json({
        success: true,
        data: {
          totalPatients: totalPatients?.count || 0,
          todayAppointments: todayAppointments?.count || 0,
          pendingEcgs: pendingEcgs?.count || 0,
          activePacemakers: activePacemakers?.count || 0,
          criticalAlerts: criticalAlerts?.count || 0,
          recentEvents: recentEvents?.count || 0,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

// ============================================================================
// PATIENTS ROUTES
// ============================================================================

/**
 * GET /cardiology/patients
 * List cardiology patients
 */
cardiology.get(
  '/patients',
  requirePermission('cardiology:patients:read'),
  zValidator('query', patientQuerySchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [
        eq(healthcarePatients.organizationId, organizationId),
        sql`JSON_EXTRACT(${healthcarePatients.enrolledModules}, '$') LIKE '%cardiology%'`
      ];

      if (query.patientStatus) {
        conditions.push(eq(healthcarePatients.patientStatus, query.patientStatus));
      }

      if (query.search) {
        conditions.push(
          or(
            like(healthcarePatients.medicalId, `%${query.search}%`),
            like(healthcarePatients.nationalId, `%${query.search}%`)
          )!
        );
      }

      const patients = await db
        .select({
          patient: healthcarePatients,
          contact: contacts,
        })
        .from(healthcarePatients)
        .leftJoin(contacts, eq(healthcarePatients.contactId, contacts.id))
        .where(and(...conditions))
        .orderBy(desc(healthcarePatients.createdAt))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(healthcarePatients)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: patients.map(p => ({
          ...p.patient,
          contact: p.contact,
        })),
        meta: {
          total: totalResult?.count || 0,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * GET /cardiology/patients/:id
 * Get a single cardiology patient
 */
cardiology.get(
  '/patients/:id',
  requirePermission('cardiology:patients:read'),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const patientId = c.req.param('id');

      const [result] = await db
        .select({
          patient: healthcarePatients,
          contact: contacts,
        })
        .from(healthcarePatients)
        .leftJoin(contacts, eq(healthcarePatients.contactId, contacts.id))
        .where(and(
          eq(healthcarePatients.id, patientId),
          eq(healthcarePatients.organizationId, organizationId)
        ))
        .limit(1);

      if (!result) {
        return c.json({ success: false, error: 'Patient not found' }, 404);
      }

      // Get chronic conditions
      const chronicConditions = await db
        .select()
        .from(healthcareChronicConditions)
        .where(and(
          eq(healthcareChronicConditions.patientId, patientId),
          eq(healthcareChronicConditions.module, 'cardiology')
        ));

      // Get implanted devices (pacemakers, stents)
      const pacemakers = await db
        .select()
        .from(cardiologyPacemakers)
        .where(and(
          eq(cardiologyPacemakers.patientId, patientId),
          eq(cardiologyPacemakers.status, 'active')
        ));

      const stents = await db
        .select()
        .from(cardiologyStents)
        .where(eq(cardiologyStents.patientId, patientId));

      // Get recent consultations
      const recentConsultations = await db
        .select()
        .from(healthcareConsultations)
        .where(and(
          eq(healthcareConsultations.patientId, patientId),
          eq(healthcareConsultations.module, 'cardiology')
        ))
        .orderBy(desc(healthcareConsultations.consultationDate))
        .limit(5);

      // Get active medications
      const medications = await db
        .select()
        .from(cardiologyMedications)
        .where(and(
          eq(cardiologyMedications.patientId, patientId),
          eq(cardiologyMedications.status, 'active')
        ));

      return c.json({
        success: true,
        data: {
          ...result.patient,
          contact: result.contact,
          chronicConditions,
          pacemakers,
          stents,
          recentConsultations,
          medications,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * POST /cardiology/patients
 * Create a new cardiology patient
 */
cardiology.post(
  '/patients',
  requirePermission('cardiology:patients:write'),
  zValidator('json', createPatientSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const patientId = crypto.randomUUID();
      const now = new Date();

      await db.insert(healthcarePatients).values({
        id: patientId,
        organizationId,
        contactId: data.contactId,
        medicalId: data.medicalId,
        nationalId: data.nationalId,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        gender: data.gender,
        bloodType: data.bloodType,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        allergies: data.allergies ? JSON.stringify(data.allergies) : undefined,
        medicalHistory: data.medicalHistory ? JSON.stringify(data.medicalHistory) : undefined,
        familyHistory: data.familyHistory ? JSON.stringify(data.familyHistory) : undefined,
        surgicalHistory: data.surgicalHistory ? JSON.stringify(data.surgicalHistory) : undefined,
        currentMedications: data.currentMedications ? JSON.stringify(data.currentMedications) : undefined,
        insuranceProvider: data.insuranceProvider,
        insuranceNumber: data.insuranceNumber,
        referringPhysician: data.referringPhysician,
        enrolledModules: JSON.stringify(['cardiology']),
        patientStatus: 'active',
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [patient] = await db
        .select()
        .from(healthcarePatients)
        .where(eq(healthcarePatients.id, patientId))
        .limit(1);

      return c.json({
        success: true,
        data: patient,
      }, 201);
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * PUT /cardiology/patients/:id
 * Update a cardiology patient
 */
cardiology.put(
  '/patients/:id',
  requirePermission('cardiology:patients:write'),
  zValidator('json', updatePatientSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const patientId = c.req.param('id');
      const data = c.req.valid('json');

      // Check patient exists
      const [existing] = await db
        .select()
        .from(healthcarePatients)
        .where(and(
          eq(healthcarePatients.id, patientId),
          eq(healthcarePatients.organizationId, organizationId)
        ))
        .limit(1);

      if (!existing) {
        return c.json({ success: false, error: 'Patient not found' }, 404);
      }

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.medicalId) updateData.medicalId = data.medicalId;
      if (data.nationalId !== undefined) updateData.nationalId = data.nationalId;
      if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);
      if (data.gender) updateData.gender = data.gender;
      if (data.bloodType !== undefined) updateData.bloodType = data.bloodType;
      if (data.emergencyContactName !== undefined) updateData.emergencyContactName = data.emergencyContactName;
      if (data.emergencyContactPhone !== undefined) updateData.emergencyContactPhone = data.emergencyContactPhone;
      if (data.emergencyContactRelation !== undefined) updateData.emergencyContactRelation = data.emergencyContactRelation;
      if (data.allergies) updateData.allergies = JSON.stringify(data.allergies);
      if (data.medicalHistory) updateData.medicalHistory = JSON.stringify(data.medicalHistory);
      if (data.familyHistory) updateData.familyHistory = JSON.stringify(data.familyHistory);
      if (data.surgicalHistory) updateData.surgicalHistory = JSON.stringify(data.surgicalHistory);
      if (data.currentMedications) updateData.currentMedications = JSON.stringify(data.currentMedications);
      if (data.insuranceProvider !== undefined) updateData.insuranceProvider = data.insuranceProvider;
      if (data.insuranceNumber !== undefined) updateData.insuranceNumber = data.insuranceNumber;
      if (data.referringPhysician !== undefined) updateData.referringPhysician = data.referringPhysician;
      if (data.notes !== undefined) updateData.notes = data.notes;

      await db
        .update(healthcarePatients)
        .set(updateData)
        .where(eq(healthcarePatients.id, patientId));

      const [updated] = await db
        .select()
        .from(healthcarePatients)
        .where(eq(healthcarePatients.id, patientId))
        .limit(1);

      return c.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

// ============================================================================
// CONSULTATIONS ROUTES
// ============================================================================

/**
 * GET /cardiology/consultations
 * List cardiology consultations
 */
cardiology.get(
  '/consultations',
  requirePermission('cardiology:consultations:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [
        eq(healthcareConsultations.organizationId, organizationId),
        eq(healthcareConsultations.module, 'cardiology'),
      ];

      if (query.patientId) {
        conditions.push(eq(healthcareConsultations.patientId, query.patientId));
      }

      const consultations = await db
        .select()
        .from(healthcareConsultations)
        .where(and(...conditions))
        .orderBy(desc(healthcareConsultations.consultationDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(healthcareConsultations)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: consultations,
        meta: {
          total: totalResult?.count || 0,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * POST /cardiology/consultations
 * Create a new consultation
 */
cardiology.post(
  '/consultations',
  requirePermission('cardiology:consultations:write'),
  zValidator('json', createConsultationSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const consultationId = crypto.randomUUID();
      const now = new Date();

      // Generate consultation number
      const [countResult] = await db
        .select({ count: count() })
        .from(healthcareConsultations)
        .where(eq(healthcareConsultations.organizationId, organizationId));
      const consultationNumber = `CARDIO-C-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(healthcareConsultations).values({
        id: consultationId,
        organizationId,
        patientId: data.patientId,
        consultationNumber,
        consultationDate: new Date(data.consultationDate),
        module: 'cardiology',
        consultationType: data.consultationType,
        providerId: data.providerId,
        chiefComplaint: data.chiefComplaint,
        historyOfPresentIllness: data.historyOfPresentIllness,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        systolicBp: data.systolicBp,
        diastolicBp: data.diastolicBp,
        heartRate: data.heartRate,
        respiratoryRate: data.respiratoryRate,
        temperature: data.temperature,
        oxygenSaturation: data.oxygenSaturation,
        physicalExamination: data.physicalExamination,
        assessment: data.assessment,
        diagnosis: data.diagnosis ? JSON.stringify(data.diagnosis) : undefined,
        treatmentPlan: data.treatmentPlan,
        prescriptions: data.prescriptions ? JSON.stringify(data.prescriptions) : undefined,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : undefined,
        status: 'completed',
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [consultation] = await db
        .select()
        .from(healthcareConsultations)
        .where(eq(healthcareConsultations.id, consultationId))
        .limit(1);

      return c.json({
        success: true,
        data: consultation,
      }, 201);
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

// ============================================================================
// ECG ROUTES
// ============================================================================

/**
 * GET /cardiology/ecg
 * List ECG records
 */
cardiology.get(
  '/ecg',
  requirePermission('cardiology:ecg:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(cardiologyEcgRecords.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(cardiologyEcgRecords.patientId, query.patientId));
      }

      if (query.status) {
        conditions.push(eq(cardiologyEcgRecords.status, query.status as 'pending' | 'interpreted' | 'reviewed' | 'verified'));
      }

      const ecgs = await db
        .select()
        .from(cardiologyEcgRecords)
        .where(and(...conditions))
        .orderBy(desc(cardiologyEcgRecords.recordingDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(cardiologyEcgRecords)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: ecgs,
        meta: {
          total: totalResult?.count || 0,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * POST /cardiology/ecg
 * Create a new ECG record
 */
cardiology.post(
  '/ecg',
  requirePermission('cardiology:ecg:write'),
  zValidator('json', createEcgSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const ecgId = crypto.randomUUID();
      const now = new Date();

      // Generate ECG number
      const [countResult] = await db
        .select({ count: count() })
        .from(cardiologyEcgRecords)
        .where(eq(cardiologyEcgRecords.organizationId, organizationId));
      const ecgNumber = `ECG-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(cardiologyEcgRecords).values({
        id: ecgId,
        organizationId,
        patientId: data.patientId,
        consultationId: data.consultationId,
        ecgNumber,
        recordingDate: new Date(data.recordingDate),
        ecgType: data.ecgType,
        paperSpeed: data.paperSpeed,
        gain: data.gain,
        heartRate: data.heartRate,
        prInterval: data.prInterval,
        qrsDuration: data.qrsDuration,
        qtInterval: data.qtInterval,
        qtcInterval: data.qtcInterval,
        axis: data.axis,
        rhythm: data.rhythm,
        interpretation: data.interpretation,
        ecgImageUrl: data.ecgImageUrl,
        performedBy: data.performedById,
        status: 'pending',
        urgency: 'routine',
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [ecg] = await db
        .select()
        .from(cardiologyEcgRecords)
        .where(eq(cardiologyEcgRecords.id, ecgId))
        .limit(1);

      return c.json({
        success: true,
        data: ecg,
      }, 201);
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

// ============================================================================
// ECHOCARDIOGRAM ROUTES
// ============================================================================

/**
 * GET /cardiology/echo
 * List echocardiograms
 */
cardiology.get(
  '/echo',
  requirePermission('cardiology:echo:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(cardiologyEchocardiograms.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(cardiologyEchocardiograms.patientId, query.patientId));
      }

      const echos = await db
        .select()
        .from(cardiologyEchocardiograms)
        .where(and(...conditions))
        .orderBy(desc(cardiologyEchocardiograms.studyDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(cardiologyEchocardiograms)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: echos,
        meta: {
          total: totalResult?.count || 0,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * POST /cardiology/echo
 * Create a new echocardiogram
 */
cardiology.post(
  '/echo',
  requirePermission('cardiology:echo:write'),
  zValidator('json', createEchoSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const echoId = crypto.randomUUID();
      const now = new Date();

      // Generate echo number
      const [countResult] = await db
        .select({ count: count() })
        .from(cardiologyEchocardiograms)
        .where(eq(cardiologyEchocardiograms.organizationId, organizationId));
      const echoNumber = `ECHO-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(cardiologyEchocardiograms).values({
        id: echoId,
        organizationId,
        patientId: data.patientId,
        consultationId: data.consultationId,
        echoNumber,
        studyDate: new Date(data.studyDate),
        echoType: data.echoType,
        indication: data.indication,
        lvEf: data.lvEf,
        lvEfMethod: data.lvEfMethod,
        lvedd: data.lvedd,
        lvesd: data.lvesd,
        laVolume: data.laVolume,
        mitralRegurgitation: data.mitralRegurgitation,
        aorticRegurgitation: data.aorticRegurgitation,
        tricuspidRegurgitation: data.tricuspidRegurgitation,
        rvsp: data.rvsp,
        diastolicFunction: data.diastolicFunction,
        pericardialEffusion: data.pericardialEffusion,
        interpretation: data.interpretation,
        conclusion: data.conclusion,
        recommendations: data.recommendations,
        imageUrls: data.imageUrls ? JSON.stringify(data.imageUrls) : undefined,
        sonographer: data.performedById,
        status: 'pending',
        urgency: 'routine',
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [echo] = await db
        .select()
        .from(cardiologyEchocardiograms)
        .where(eq(cardiologyEchocardiograms.id, echoId))
        .limit(1);

      return c.json({
        success: true,
        data: echo,
      }, 201);
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

// ============================================================================
// PACEMAKER ROUTES
// ============================================================================

/**
 * GET /cardiology/pacemakers
 * List pacemakers
 */
cardiology.get(
  '/pacemakers',
  requirePermission('cardiology:pacemakers:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(cardiologyPacemakers.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(cardiologyPacemakers.patientId, query.patientId));
      }

      if (query.status) {
        conditions.push(eq(cardiologyPacemakers.status, query.status as 'active' | 'replaced' | 'explanted' | 'end_of_life'));
      }

      const pacemakers = await db
        .select()
        .from(cardiologyPacemakers)
        .where(and(...conditions))
        .orderBy(desc(cardiologyPacemakers.implantDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(cardiologyPacemakers)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: pacemakers,
        meta: {
          total: totalResult?.count || 0,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * POST /cardiology/pacemakers
 * Create a new pacemaker record
 */
cardiology.post(
  '/pacemakers',
  requirePermission('cardiology:pacemakers:write'),
  zValidator('json', createPacemakerSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const pacemakerId = crypto.randomUUID();
      const now = new Date();

      // Generate device number
      const [countResult] = await db
        .select({ count: count() })
        .from(cardiologyPacemakers)
        .where(eq(cardiologyPacemakers.organizationId, organizationId));
      const deviceNumber = `PM-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(cardiologyPacemakers).values({
        id: pacemakerId,
        organizationId,
        patientId: data.patientId,
        deviceNumber,
        deviceType: data.deviceType,
        indication: data.indication,
        manufacturer: data.manufacturer,
        model: data.model,
        serialNumber: data.serialNumber,
        implantDate: new Date(data.implantDate),
        implantedBy: data.implantedById,
        implantCenter: data.implantCenter,
        mode: data.mode,
        lowerRate: data.lowerRate,
        upperRate: data.upperRate,
        batteryStatus: data.batteryStatus || 'ok',
        remoteMonitoringEnabled: data.remoteMonitoringEnabled,
        mriConditional: data.mriConditional,
        status: 'active',
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [pacemaker] = await db
        .select()
        .from(cardiologyPacemakers)
        .where(eq(cardiologyPacemakers.id, pacemakerId))
        .limit(1);

      return c.json({
        success: true,
        data: pacemaker,
      }, 201);
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

// ============================================================================
// STENT ROUTES
// ============================================================================

/**
 * GET /cardiology/stents
 * List stents
 */
cardiology.get(
  '/stents',
  requirePermission('cardiology:stents:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(cardiologyStents.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(cardiologyStents.patientId, query.patientId));
      }

      const stents = await db
        .select()
        .from(cardiologyStents)
        .where(and(...conditions))
        .orderBy(desc(cardiologyStents.procedureDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(cardiologyStents)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: stents,
        meta: {
          total: totalResult?.count || 0,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * POST /cardiology/stents
 * Create a new stent record
 */
cardiology.post(
  '/stents',
  requirePermission('cardiology:stents:write'),
  zValidator('json', createStentSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const stentId = crypto.randomUUID();
      const now = new Date();

      // Generate stent number
      const [countResult] = await db
        .select({ count: count() })
        .from(cardiologyStents)
        .where(eq(cardiologyStents.organizationId, organizationId));
      const stentNumber = `STENT-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(cardiologyStents).values({
        id: stentId,
        organizationId,
        patientId: data.patientId,
        stentNumber,
        procedureDate: new Date(data.procedureDate),
        procedureType: data.procedureType,
        indication: data.indication,
        clinicalPresentation: data.clinicalPresentation,
        vesselName: data.vesselName,
        vesselSegment: data.vesselSegment,
        stentType: data.stentType,
        stentManufacturer: data.stentManufacturer,
        stentModel: data.stentModel,
        stentDiameter: data.stentDiameter,
        stentLength: data.stentLength,
        procedureSuccess: data.procedureSuccess ?? true,
        operator: data.operatorId,
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [stent] = await db
        .select()
        .from(cardiologyStents)
        .where(eq(cardiologyStents.id, stentId))
        .limit(1);

      return c.json({
        success: true,
        data: stent,
      }, 201);
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

// ============================================================================
// RISK SCORES ROUTES
// ============================================================================

/**
 * GET /cardiology/risk-scores
 * List risk scores
 */
cardiology.get(
  '/risk-scores',
  requirePermission('cardiology:risk-scores:read'),
  zValidator('query', listQuerySchema.extend({
    patientId: z.string().uuid().optional(),
    scoreType: z.string().optional(),
  })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(cardiologyRiskScores.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(cardiologyRiskScores.patientId, query.patientId));
      }

      if (query.scoreType) {
        conditions.push(eq(cardiologyRiskScores.scoreType, query.scoreType as any));
      }

      const scores = await db
        .select()
        .from(cardiologyRiskScores)
        .where(and(...conditions))
        .orderBy(desc(cardiologyRiskScores.calculationDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(cardiologyRiskScores)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: scores,
        meta: {
          total: totalResult?.count || 0,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * POST /cardiology/risk-scores
 * Calculate and save a risk score
 */
cardiology.post(
  '/risk-scores',
  requirePermission('cardiology:risk-scores:write'),
  zValidator('json', createRiskScoreSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const scoreId = crypto.randomUUID();
      const now = new Date();

      await db.insert(cardiologyRiskScores).values({
        id: scoreId,
        organizationId,
        patientId: data.patientId,
        consultationId: data.consultationId,
        scoreType: data.scoreType,
        calculationDate: now,
        inputParameters: JSON.stringify(data.inputParameters),
        scoreValue: data.scoreValue,
        riskCategory: data.riskCategory,
        riskPercentage: data.riskPercentage,
        interpretation: data.interpretation,
        recommendations: data.recommendations,
        calculatedBy: userId,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      });

      const [score] = await db
        .select()
        .from(cardiologyRiskScores)
        .where(eq(cardiologyRiskScores.id, scoreId))
        .limit(1);

      return c.json({
        success: true,
        data: score,
      }, 201);
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

// ============================================================================
// MEDICATIONS ROUTES
// ============================================================================

/**
 * GET /cardiology/medications
 * List medications
 */
cardiology.get(
  '/medications',
  requirePermission('cardiology:medications:read'),
  zValidator('query', listQuerySchema.extend({
    patientId: z.string().uuid().optional(),
    status: z.enum(['active', 'discontinued', 'on_hold', 'completed']).optional(),
  })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(cardiologyMedications.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(cardiologyMedications.patientId, query.patientId));
      }

      if (query.status) {
        conditions.push(eq(cardiologyMedications.status, query.status));
      }

      const medications = await db
        .select()
        .from(cardiologyMedications)
        .where(and(...conditions))
        .orderBy(desc(cardiologyMedications.startDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(cardiologyMedications)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: medications,
        meta: {
          total: totalResult?.count || 0,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

/**
 * POST /cardiology/medications
 * Create a new medication
 */
cardiology.post(
  '/medications',
  requirePermission('cardiology:medications:write'),
  zValidator('json', createMedicationSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const medicationId = crypto.randomUUID();
      const now = new Date();

      await db.insert(cardiologyMedications).values({
        id: medicationId,
        organizationId,
        patientId: data.patientId,
        consultationId: data.consultationId,
        medicationName: data.medicationName,
        genericName: data.genericName,
        medicationClass: data.medicationClass,
        dose: data.dose,
        frequency: data.frequency,
        route: data.route || 'oral',
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        isOngoing: !data.endDate,
        indication: data.indication,
        prescribedBy: data.prescribedById,
        status: 'active',
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [medication] = await db
        .select()
        .from(cardiologyMedications)
        .where(eq(cardiologyMedications.id, medicationId))
        .limit(1);

      return c.json({
        success: true,
        data: medication,
      }, 201);
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

// ============================================================================
// ALERTS ROUTES
// ============================================================================

/**
 * GET /cardiology/alerts
 * List cardiology alerts
 */
cardiology.get(
  '/alerts',
  requirePermission('cardiology:alerts:read'),
  zValidator('query', listQuerySchema.extend({
    patientId: z.string().uuid().optional(),
    severity: z.enum(['info', 'warning', 'critical']).optional(),
    status: z.enum(['active', 'acknowledged', 'resolved', 'dismissed', 'snoozed']).optional(),
  })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [
        eq(healthcareAlerts.organizationId, organizationId),
        eq(healthcareAlerts.module, 'cardiology'),
      ];

      if (query.patientId) {
        conditions.push(eq(healthcareAlerts.patientId, query.patientId));
      }

      if (query.severity) {
        conditions.push(eq(healthcareAlerts.severity, query.severity));
      }

      if (query.status) {
        conditions.push(eq(healthcareAlerts.status, query.status));
      }

      const alerts = await db
        .select()
        .from(healthcareAlerts)
        .where(and(...conditions))
        .orderBy(desc(healthcareAlerts.createdAt))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(healthcareAlerts)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: alerts,
        meta: {
          total: totalResult?.count || 0,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

// ============================================================================
// APPOINTMENTS ROUTES
// ============================================================================

/**
 * GET /cardiology/appointments
 * List cardiology appointments
 */
cardiology.get(
  '/appointments',
  requirePermission('cardiology:appointments:read'),
  zValidator('query', listQuerySchema.extend({
    patientId: z.string().uuid().optional(),
    status: z.string().optional(),
    fromDate: z.string().optional(),
    toDate: z.string().optional(),
  })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [
        eq(healthcareAppointments.organizationId, organizationId),
        eq(healthcareAppointments.module, 'cardiology'),
      ];

      if (query.patientId) {
        conditions.push(eq(healthcareAppointments.patientId, query.patientId));
      }

      if (query.status) {
        conditions.push(eq(healthcareAppointments.status, query.status as any));
      }

      if (query.fromDate) {
        conditions.push(sql`${healthcareAppointments.scheduledDate} >= ${new Date(query.fromDate).getTime()}`);
      }

      if (query.toDate) {
        conditions.push(sql`${healthcareAppointments.scheduledDate} <= ${new Date(query.toDate).getTime()}`);
      }

      const appointments = await db
        .select()
        .from(healthcareAppointments)
        .where(and(...conditions))
        .orderBy(desc(healthcareAppointments.scheduledDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(healthcareAppointments)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: appointments,
        meta: {
          total: totalResult?.count || 0,
          limit: query.limit,
          offset: query.offset,
        },
      });
    } catch (error) {
      console.error('Route error:', error);
      return c.json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred'
        }
      }, 500);
    }
  }
);

export default cardiology;
