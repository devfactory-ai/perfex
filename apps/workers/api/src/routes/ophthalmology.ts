/**
 * Ophthalmology Routes
 * /api/v1/ophthalmology
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
  ophthalmologyOctScans,
  ophthalmologyVisualFields,
  ophthalmologyBiometry,
  ophthalmologyIolImplants,
  ophthalmologyIvtInjections,
  ophthalmologySurgeries,
  ophthalmologyRefraction,
  ophthalmologyTonometry,
  ophthalmologyFundusPhotos,
  ophthalmologyOsdiScores,
  contacts,
} from '@perfex/database';

const ophthalmology = new Hono<{ Bindings: Env }>();

// All routes require authentication
ophthalmology.use('/*', requireAuth);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const listQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  status: z.string().optional(),
  eye: z.enum(['od', 'os', 'ou']).optional(),
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
  physicalExamination: z.string().optional(),
  assessment: z.string().optional(),
  diagnosis: z.array(z.string()).optional(),
  treatmentPlan: z.string().optional(),
  prescriptions: z.array(z.any()).optional(),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
});

const createOctSchema = z.object({
  patientId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  scanDate: z.string(),
  eye: z.enum(['od', 'os', 'ou']),
  octType: z.enum(['macula', 'optic_nerve', 'anterior_segment', 'angiography', 'wide_field']),
  scanPattern: z.string().optional(),
  signalStrength: z.number().optional(),
  centralMacularThickness: z.number().optional(),
  avgMacularThickness: z.number().optional(),
  rnflAverage: z.number().optional(),
  cupDiscRatio: z.number().optional(),
  findings: z.string().optional(),
  interpretation: z.string().optional(),
  conclusion: z.string().optional(),
  recommendations: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  performedById: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const createVisualFieldSchema = z.object({
  patientId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  testDate: z.string(),
  eye: z.enum(['od', 'os']),
  testType: z.enum(['sita_standard', 'sita_fast', 'sita_faster', 'full_threshold', 'screening', 'kinetic']),
  testPattern: z.string().optional(),
  fixationLosses: z.number().optional(),
  falsePositives: z.number().optional(),
  falseNegatives: z.number().optional(),
  meanDeviation: z.number().optional(),
  patternStandardDeviation: z.number().optional(),
  visualFieldIndex: z.number().optional(),
  ghtResult: z.enum(['within_normal', 'borderline', 'outside_normal', 'generalized_reduction', 'abnormally_high']).optional(),
  glaucomaStage: z.string().optional(),
  findings: z.string().optional(),
  interpretation: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  performedById: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const createBiometrySchema = z.object({
  patientId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  measurementDate: z.string(),
  eye: z.enum(['od', 'os']),
  deviceType: z.enum(['optical', 'ultrasound', 'swept_source']),
  axialLength: z.number(),
  k1: z.number(),
  k1Axis: z.number().optional(),
  k2: z.number(),
  k2Axis: z.number().optional(),
  avgK: z.number().optional(),
  acd: z.number().optional(),
  lensThickness: z.number().optional(),
  wtw: z.number().optional(),
  cct: z.number().optional(),
  targetRefraction: z.number().optional(),
  iolCalculations: z.array(z.any()).optional(),
  performedById: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const createIolSchema = z.object({
  patientId: z.string().uuid(),
  surgeryId: z.string().uuid().optional(),
  biometryId: z.string().uuid().optional(),
  implantDate: z.string(),
  eye: z.enum(['od', 'os']),
  manufacturer: z.string(),
  model: z.string(),
  iolType: z.enum(['monofocal', 'toric', 'multifocal', 'edof', 'toric_multifocal', 'toric_edof', 'accommodating', 'phakic']),
  sphericalPower: z.number(),
  cylinderPower: z.number().optional(),
  cylinderAxis: z.number().optional(),
  addPower: z.number().optional(),
  serialNumber: z.string().optional(),
  lotNumber: z.string().optional(),
  formulaUsed: z.string().optional(),
  targetRefraction: z.number().optional(),
  surgeonId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const createIvtSchema = z.object({
  patientId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  injectionDate: z.string(),
  eye: z.enum(['od', 'os']),
  indication: z.enum(['wet_amd', 'dme', 'rvo_me', 'cnv', 'pdr', 'uveitis', 'endophthalmitis', 'other']),
  indicationDetails: z.string().optional(),
  medication: z.enum(['aflibercept', 'ranibizumab', 'bevacizumab', 'brolucizumab', 'faricimab', 'dexamethasone_implant', 'fluocinolone_implant', 'triamcinolone', 'vancomycin', 'ceftazidime', 'other']),
  medicationBrand: z.string().optional(),
  dose: z.string(),
  lotNumber: z.string().optional(),
  treatmentProtocol: z.enum(['loading', 'prn', 'treat_and_extend', 'fixed', 'observe_and_extend']).optional(),
  injectionInSeries: z.number().optional(),
  quadrant: z.enum(['inferotemporal', 'inferonasal', 'superotemporal', 'superonasal']).optional(),
  preIop: z.number().optional(),
  postIop: z.number().optional(),
  performedById: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const createSurgerySchema = z.object({
  patientId: z.string().uuid(),
  surgeryDate: z.string(),
  eye: z.enum(['od', 'os', 'ou']),
  surgeryType: z.enum(['phaco', 'ecce', 'icce', 'iol_exchange', 'vitrectomy', 'retinal_detachment', 'glaucoma_trab', 'glaucoma_tube', 'migs', 'corneal_transplant', 'pterygium', 'strabismus', 'oculoplastics', 'laser_refractive', 'prk', 'lasik', 'smile', 'other']),
  surgerySubtype: z.string().optional(),
  indication: z.string().optional(),
  anesthesiaType: z.enum(['topical', 'local', 'peribulbar', 'retrobulbar', 'general']).optional(),
  surgeonId: z.string().uuid().optional(),
  procedureDetails: z.string().optional(),
  intraOpFindings: z.string().optional(),
  surgeryOutcome: z.enum(['successful', 'complicated', 'converted', 'aborted']).optional(),
  postOpMedications: z.array(z.any()).optional(),
  postOpInstructions: z.string().optional(),
  notes: z.string().optional(),
});

const createRefractionSchema = z.object({
  patientId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  examinationDate: z.string(),
  refractionType: z.enum(['manifest', 'cycloplegic', 'autorefractor', 'retinoscopy', 'trial_frame']),
  odSphere: z.number().optional(),
  odCylinder: z.number().optional(),
  odAxis: z.number().optional(),
  odAdd: z.number().optional(),
  osSphere: z.number().optional(),
  osCylinder: z.number().optional(),
  osAxis: z.number().optional(),
  osAdd: z.number().optional(),
  odUcvaDistance: z.string().optional(),
  osUcvaDistance: z.string().optional(),
  odBcvaDistance: z.string().optional(),
  osBcvaDistance: z.string().optional(),
  performedById: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const createTonometrySchema = z.object({
  patientId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  measurementDate: z.string(),
  measurementTime: z.string().optional(),
  tonometryMethod: z.enum(['goldmann', 'non_contact', 'icare', 'tono_pen', 'palpation']),
  iopOd: z.number().optional(),
  iopOs: z.number().optional(),
  cctOd: z.number().optional(),
  cctOs: z.number().optional(),
  targetIopOd: z.number().optional(),
  targetIopOs: z.number().optional(),
  isOnGlaucomaMedications: z.boolean().optional(),
  currentMedications: z.array(z.string()).optional(),
  performedById: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const createOsdiSchema = z.object({
  patientId: z.string().uuid(),
  consultationId: z.string().uuid().optional(),
  assessmentDate: z.string(),
  q1LightSensitivity: z.number().min(0).max(4).optional(),
  q2GrittyFeeling: z.number().min(0).max(4).optional(),
  q3PainfulEyes: z.number().min(0).max(4).optional(),
  q4BlurredVision: z.number().min(0).max(4).optional(),
  q5PoorVision: z.number().min(0).max(4).optional(),
  q6Reading: z.number().min(0).max(4).optional(),
  q7Driving: z.number().min(0).max(4).optional(),
  q8Computer: z.number().min(0).max(4).optional(),
  q9Television: z.number().min(0).max(4).optional(),
  q10WindyConditions: z.number().min(0).max(4).optional(),
  q11LowHumidity: z.number().min(0).max(4).optional(),
  q12AirConditioning: z.number().min(0).max(4).optional(),
  notes: z.string().optional(),
});

// ============================================================================
// DASHBOARD & STATS
// ============================================================================

/**
 * GET /ophthalmology/dashboard/stats
 * Get ophthalmology dashboard statistics
 */
ophthalmology.get(
  '/dashboard/stats',
  requirePermission('ophthalmology:read'),
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
          sql`JSON_EXTRACT(${healthcarePatients.enrolledModules}, '$') LIKE '%ophthalmology%'`
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
          eq(healthcareAppointments.module, 'ophthalmology'),
          sql`${healthcareAppointments.scheduledDate} >= ${today.getTime()}`,
          sql`${healthcareAppointments.scheduledDate} < ${tomorrow.getTime()}`
        ));

      // Get pending OCT scans
      const [pendingOcts] = await db
        .select({ count: count() })
        .from(ophthalmologyOctScans)
        .where(and(
          eq(ophthalmologyOctScans.organizationId, organizationId),
          eq(ophthalmologyOctScans.status, 'pending')
        ));

      // Get scheduled surgeries (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const [scheduledSurgeries] = await db
        .select({ count: count() })
        .from(ophthalmologySurgeries)
        .where(and(
          eq(ophthalmologySurgeries.organizationId, organizationId),
          sql`${ophthalmologySurgeries.surgeryDate} >= ${today.getTime()}`,
          sql`${ophthalmologySurgeries.surgeryDate} <= ${nextWeek.getTime()}`
        ));

      // Get IVT injections this month
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const [monthlyIvts] = await db
        .select({ count: count() })
        .from(ophthalmologyIvtInjections)
        .where(and(
          eq(ophthalmologyIvtInjections.organizationId, organizationId),
          sql`${ophthalmologyIvtInjections.injectionDate} >= ${firstOfMonth.getTime()}`
        ));

      // Get critical alerts
      const [criticalAlerts] = await db
        .select({ count: count() })
        .from(healthcareAlerts)
        .where(and(
          eq(healthcareAlerts.organizationId, organizationId),
          eq(healthcareAlerts.module, 'ophthalmology'),
          eq(healthcareAlerts.status, 'active'),
          eq(healthcareAlerts.severity, 'critical')
        ));

      return c.json({
        success: true,
        data: {
          totalPatients: totalPatients?.count || 0,
          todayAppointments: todayAppointments?.count || 0,
          pendingOcts: pendingOcts?.count || 0,
          scheduledSurgeries: scheduledSurgeries?.count || 0,
          monthlyIvts: monthlyIvts?.count || 0,
          criticalAlerts: criticalAlerts?.count || 0,
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
 * GET /ophthalmology/patients
 * List ophthalmology patients
 */
ophthalmology.get(
  '/patients',
  requirePermission('ophthalmology:patients:read'),
  zValidator('query', patientQuerySchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [
        eq(healthcarePatients.organizationId, organizationId),
        sql`JSON_EXTRACT(${healthcarePatients.enrolledModules}, '$') LIKE '%ophthalmology%'`
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
 * GET /ophthalmology/patients/:id
 * Get a single ophthalmology patient
 */
ophthalmology.get(
  '/patients/:id',
  requirePermission('ophthalmology:patients:read'),
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
          eq(healthcareChronicConditions.module, 'ophthalmology')
        ));

      // Get IOL implants
      const iolImplants = await db
        .select()
        .from(ophthalmologyIolImplants)
        .where(and(
          eq(ophthalmologyIolImplants.patientId, patientId),
          eq(ophthalmologyIolImplants.status, 'implanted')
        ));

      // Get recent consultations
      const recentConsultations = await db
        .select()
        .from(healthcareConsultations)
        .where(and(
          eq(healthcareConsultations.patientId, patientId),
          eq(healthcareConsultations.module, 'ophthalmology')
        ))
        .orderBy(desc(healthcareConsultations.consultationDate))
        .limit(5);

      // Get latest refraction
      const [latestRefraction] = await db
        .select()
        .from(ophthalmologyRefraction)
        .where(eq(ophthalmologyRefraction.patientId, patientId))
        .orderBy(desc(ophthalmologyRefraction.examinationDate))
        .limit(1);

      // Get latest tonometry
      const [latestTonometry] = await db
        .select()
        .from(ophthalmologyTonometry)
        .where(eq(ophthalmologyTonometry.patientId, patientId))
        .orderBy(desc(ophthalmologyTonometry.measurementDate))
        .limit(1);

      return c.json({
        success: true,
        data: {
          ...result.patient,
          contact: result.contact,
          chronicConditions,
          iolImplants,
          recentConsultations,
          latestRefraction,
          latestTonometry,
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
 * POST /ophthalmology/patients
 * Create a new ophthalmology patient
 */
ophthalmology.post(
  '/patients',
  requirePermission('ophthalmology:patients:write'),
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
        enrolledModules: JSON.stringify(['ophthalmology']),
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

// ============================================================================
// CONSULTATIONS ROUTES
// ============================================================================

/**
 * GET /ophthalmology/consultations
 * List ophthalmology consultations
 */
ophthalmology.get(
  '/consultations',
  requirePermission('ophthalmology:consultations:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [
        eq(healthcareConsultations.organizationId, organizationId),
        eq(healthcareConsultations.module, 'ophthalmology'),
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
 * POST /ophthalmology/consultations
 * Create a new consultation
 */
ophthalmology.post(
  '/consultations',
  requirePermission('ophthalmology:consultations:write'),
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
      const consultationNumber = `OPHTH-C-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(healthcareConsultations).values({
        id: consultationId,
        organizationId,
        patientId: data.patientId,
        consultationNumber,
        consultationDate: new Date(data.consultationDate),
        module: 'ophthalmology',
        consultationType: data.consultationType,
        providerId: data.providerId,
        chiefComplaint: data.chiefComplaint,
        historyOfPresentIllness: data.historyOfPresentIllness,
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
// OCT ROUTES
// ============================================================================

/**
 * GET /ophthalmology/oct
 * List OCT scans
 */
ophthalmology.get(
  '/oct',
  requirePermission('ophthalmology:oct:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(ophthalmologyOctScans.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(ophthalmologyOctScans.patientId, query.patientId));
      }

      if (query.eye) {
        conditions.push(eq(ophthalmologyOctScans.eye, query.eye));
      }

      if (query.status) {
        conditions.push(eq(ophthalmologyOctScans.status, query.status as 'pending' | 'interpreted' | 'reviewed' | 'verified'));
      }

      const octs = await db
        .select()
        .from(ophthalmologyOctScans)
        .where(and(...conditions))
        .orderBy(desc(ophthalmologyOctScans.scanDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(ophthalmologyOctScans)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: octs,
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
 * POST /ophthalmology/oct
 * Create a new OCT scan
 */
ophthalmology.post(
  '/oct',
  requirePermission('ophthalmology:oct:write'),
  zValidator('json', createOctSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const octId = crypto.randomUUID();
      const now = new Date();

      // Generate OCT number
      const [countResult] = await db
        .select({ count: count() })
        .from(ophthalmologyOctScans)
        .where(eq(ophthalmologyOctScans.organizationId, organizationId));
      const octNumber = `OCT-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(ophthalmologyOctScans).values({
        id: octId,
        organizationId,
        patientId: data.patientId,
        consultationId: data.consultationId,
        octNumber,
        scanDate: new Date(data.scanDate),
        eye: data.eye,
        octType: data.octType,
        scanPattern: data.scanPattern,
        signalStrength: data.signalStrength,
        centralMacularThickness: data.centralMacularThickness,
        avgMacularThickness: data.avgMacularThickness,
        rnflAverage: data.rnflAverage,
        cupDiscRatio: data.cupDiscRatio,
        findings: data.findings,
        interpretation: data.interpretation,
        conclusion: data.conclusion,
        recommendations: data.recommendations,
        imageUrls: data.imageUrls ? JSON.stringify(data.imageUrls) : undefined,
        performedBy: data.performedById,
        status: 'pending',
        urgency: 'routine',
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [oct] = await db
        .select()
        .from(ophthalmologyOctScans)
        .where(eq(ophthalmologyOctScans.id, octId))
        .limit(1);

      return c.json({
        success: true,
        data: oct,
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
// VISUAL FIELDS ROUTES
// ============================================================================

/**
 * GET /ophthalmology/visual-fields
 * List visual field tests
 */
ophthalmology.get(
  '/visual-fields',
  requirePermission('ophthalmology:visual-fields:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(ophthalmologyVisualFields.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(ophthalmologyVisualFields.patientId, query.patientId));
      }

      if (query.eye) {
        conditions.push(eq(ophthalmologyVisualFields.eye, query.eye as 'od' | 'os'));
      }

      const vfs = await db
        .select()
        .from(ophthalmologyVisualFields)
        .where(and(...conditions))
        .orderBy(desc(ophthalmologyVisualFields.testDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(ophthalmologyVisualFields)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: vfs,
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
 * POST /ophthalmology/visual-fields
 * Create a new visual field test
 */
ophthalmology.post(
  '/visual-fields',
  requirePermission('ophthalmology:visual-fields:write'),
  zValidator('json', createVisualFieldSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const vfId = crypto.randomUUID();
      const now = new Date();

      // Generate VF number
      const [countResult] = await db
        .select({ count: count() })
        .from(ophthalmologyVisualFields)
        .where(eq(ophthalmologyVisualFields.organizationId, organizationId));
      const vfNumber = `VF-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(ophthalmologyVisualFields).values({
        id: vfId,
        organizationId,
        patientId: data.patientId,
        consultationId: data.consultationId,
        vfNumber,
        testDate: new Date(data.testDate),
        eye: data.eye,
        testType: data.testType,
        testPattern: data.testPattern,
        fixationLosses: data.fixationLosses,
        falsePositives: data.falsePositives,
        falseNegatives: data.falseNegatives,
        meanDeviation: data.meanDeviation,
        patternStandardDeviation: data.patternStandardDeviation,
        visualFieldIndex: data.visualFieldIndex,
        ghtResult: data.ghtResult,
        glaucomaStage: data.glaucomaStage,
        findings: data.findings,
        interpretation: data.interpretation,
        imageUrls: data.imageUrls ? JSON.stringify(data.imageUrls) : undefined,
        performedBy: data.performedById,
        status: 'pending',
        urgency: 'routine',
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [vf] = await db
        .select()
        .from(ophthalmologyVisualFields)
        .where(eq(ophthalmologyVisualFields.id, vfId))
        .limit(1);

      return c.json({
        success: true,
        data: vf,
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
// BIOMETRY ROUTES
// ============================================================================

/**
 * GET /ophthalmology/biometry
 * List biometry records
 */
ophthalmology.get(
  '/biometry',
  requirePermission('ophthalmology:biometry:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(ophthalmologyBiometry.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(ophthalmologyBiometry.patientId, query.patientId));
      }

      if (query.eye) {
        conditions.push(eq(ophthalmologyBiometry.eye, query.eye as 'od' | 'os'));
      }

      const biometries = await db
        .select()
        .from(ophthalmologyBiometry)
        .where(and(...conditions))
        .orderBy(desc(ophthalmologyBiometry.measurementDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(ophthalmologyBiometry)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: biometries,
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
 * POST /ophthalmology/biometry
 * Create a new biometry record
 */
ophthalmology.post(
  '/biometry',
  requirePermission('ophthalmology:biometry:write'),
  zValidator('json', createBiometrySchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const biometryId = crypto.randomUUID();
      const now = new Date();

      // Generate biometry number
      const [countResult] = await db
        .select({ count: count() })
        .from(ophthalmologyBiometry)
        .where(eq(ophthalmologyBiometry.organizationId, organizationId));
      const biometryNumber = `BIO-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(ophthalmologyBiometry).values({
        id: biometryId,
        organizationId,
        patientId: data.patientId,
        consultationId: data.consultationId,
        biometryNumber,
        measurementDate: new Date(data.measurementDate),
        eye: data.eye,
        deviceType: data.deviceType,
        axialLength: data.axialLength,
        k1: data.k1,
        k1Axis: data.k1Axis,
        k2: data.k2,
        k2Axis: data.k2Axis,
        avgK: data.avgK,
        acd: data.acd,
        lensThickness: data.lensThickness,
        wtw: data.wtw,
        cct: data.cct,
        targetRefraction: data.targetRefraction,
        iolCalculations: data.iolCalculations ? JSON.stringify(data.iolCalculations) : undefined,
        performedBy: data.performedById,
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [biometry] = await db
        .select()
        .from(ophthalmologyBiometry)
        .where(eq(ophthalmologyBiometry.id, biometryId))
        .limit(1);

      return c.json({
        success: true,
        data: biometry,
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
// IOL IMPLANTS ROUTES
// ============================================================================

/**
 * GET /ophthalmology/iol-implants
 * List IOL implants
 */
ophthalmology.get(
  '/iol-implants',
  requirePermission('ophthalmology:iol:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(ophthalmologyIolImplants.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(ophthalmologyIolImplants.patientId, query.patientId));
      }

      if (query.eye) {
        conditions.push(eq(ophthalmologyIolImplants.eye, query.eye as 'od' | 'os'));
      }

      const iols = await db
        .select()
        .from(ophthalmologyIolImplants)
        .where(and(...conditions))
        .orderBy(desc(ophthalmologyIolImplants.implantDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(ophthalmologyIolImplants)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: iols,
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
 * POST /ophthalmology/iol-implants
 * Create a new IOL implant record
 */
ophthalmology.post(
  '/iol-implants',
  requirePermission('ophthalmology:iol:write'),
  zValidator('json', createIolSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const iolId = crypto.randomUUID();
      const now = new Date();

      // Generate IOL number
      const [countResult] = await db
        .select({ count: count() })
        .from(ophthalmologyIolImplants)
        .where(eq(ophthalmologyIolImplants.organizationId, organizationId));
      const iolNumber = `IOL-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(ophthalmologyIolImplants).values({
        id: iolId,
        organizationId,
        patientId: data.patientId,
        surgeryId: data.surgeryId,
        biometryId: data.biometryId,
        iolNumber,
        implantDate: new Date(data.implantDate),
        eye: data.eye,
        manufacturer: data.manufacturer,
        model: data.model,
        iolType: data.iolType,
        sphericalPower: data.sphericalPower,
        cylinderPower: data.cylinderPower,
        cylinderAxis: data.cylinderAxis,
        addPower: data.addPower,
        serialNumber: data.serialNumber,
        lotNumber: data.lotNumber,
        formulaUsed: data.formulaUsed,
        targetRefraction: data.targetRefraction,
        surgeon: data.surgeonId,
        status: 'implanted',
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [iol] = await db
        .select()
        .from(ophthalmologyIolImplants)
        .where(eq(ophthalmologyIolImplants.id, iolId))
        .limit(1);

      return c.json({
        success: true,
        data: iol,
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
// IVT INJECTIONS ROUTES
// ============================================================================

/**
 * GET /ophthalmology/ivt-injections
 * List IVT injections
 */
ophthalmology.get(
  '/ivt-injections',
  requirePermission('ophthalmology:ivt:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(ophthalmologyIvtInjections.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(ophthalmologyIvtInjections.patientId, query.patientId));
      }

      if (query.eye) {
        conditions.push(eq(ophthalmologyIvtInjections.eye, query.eye as 'od' | 'os'));
      }

      const ivts = await db
        .select()
        .from(ophthalmologyIvtInjections)
        .where(and(...conditions))
        .orderBy(desc(ophthalmologyIvtInjections.injectionDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(ophthalmologyIvtInjections)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: ivts,
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
 * POST /ophthalmology/ivt-injections
 * Create a new IVT injection record
 */
ophthalmology.post(
  '/ivt-injections',
  requirePermission('ophthalmology:ivt:write'),
  zValidator('json', createIvtSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const ivtId = crypto.randomUUID();
      const now = new Date();

      // Generate IVT number
      const [countResult] = await db
        .select({ count: count() })
        .from(ophthalmologyIvtInjections)
        .where(eq(ophthalmologyIvtInjections.organizationId, organizationId));
      const ivtNumber = `IVT-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(ophthalmologyIvtInjections).values({
        id: ivtId,
        organizationId,
        patientId: data.patientId,
        consultationId: data.consultationId,
        ivtNumber,
        injectionDate: new Date(data.injectionDate),
        eye: data.eye,
        indication: data.indication,
        indicationDetails: data.indicationDetails,
        medication: data.medication,
        medicationBrand: data.medicationBrand,
        dose: data.dose,
        lotNumber: data.lotNumber,
        treatmentProtocol: data.treatmentProtocol,
        injectionInSeries: data.injectionInSeries,
        quadrant: data.quadrant,
        preIopOd: data.eye === 'od' ? data.preIop : undefined,
        preIopOs: data.eye === 'os' ? data.preIop : undefined,
        postIop: data.postIop,
        performedBy: data.performedById,
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [ivt] = await db
        .select()
        .from(ophthalmologyIvtInjections)
        .where(eq(ophthalmologyIvtInjections.id, ivtId))
        .limit(1);

      return c.json({
        success: true,
        data: ivt,
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
// SURGERIES ROUTES
// ============================================================================

/**
 * GET /ophthalmology/surgeries
 * List surgeries
 */
ophthalmology.get(
  '/surgeries',
  requirePermission('ophthalmology:surgeries:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(ophthalmologySurgeries.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(ophthalmologySurgeries.patientId, query.patientId));
      }

      if (query.eye) {
        conditions.push(eq(ophthalmologySurgeries.eye, query.eye));
      }

      const surgeries = await db
        .select()
        .from(ophthalmologySurgeries)
        .where(and(...conditions))
        .orderBy(desc(ophthalmologySurgeries.surgeryDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(ophthalmologySurgeries)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: surgeries,
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
 * POST /ophthalmology/surgeries
 * Create a new surgery record
 */
ophthalmology.post(
  '/surgeries',
  requirePermission('ophthalmology:surgeries:write'),
  zValidator('json', createSurgerySchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const surgeryId = crypto.randomUUID();
      const now = new Date();

      // Generate surgery number
      const [countResult] = await db
        .select({ count: count() })
        .from(ophthalmologySurgeries)
        .where(eq(ophthalmologySurgeries.organizationId, organizationId));
      const surgeryNumber = `SURG-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(ophthalmologySurgeries).values({
        id: surgeryId,
        organizationId,
        patientId: data.patientId,
        surgeryNumber,
        surgeryDate: new Date(data.surgeryDate),
        eye: data.eye,
        surgeryType: data.surgeryType,
        surgerySubtype: data.surgerySubtype,
        indication: data.indication,
        anesthesiaType: data.anesthesiaType,
        surgeon: data.surgeonId,
        procedureDetails: data.procedureDetails,
        intraOpFindings: data.intraOpFindings,
        surgeryOutcome: data.surgeryOutcome || 'successful',
        postOpMedications: data.postOpMedications ? JSON.stringify(data.postOpMedications) : undefined,
        postOpInstructions: data.postOpInstructions,
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [surgery] = await db
        .select()
        .from(ophthalmologySurgeries)
        .where(eq(ophthalmologySurgeries.id, surgeryId))
        .limit(1);

      return c.json({
        success: true,
        data: surgery,
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
// REFRACTION ROUTES
// ============================================================================

/**
 * GET /ophthalmology/refraction
 * List refraction records
 */
ophthalmology.get(
  '/refraction',
  requirePermission('ophthalmology:refraction:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(ophthalmologyRefraction.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(ophthalmologyRefraction.patientId, query.patientId));
      }

      const refractions = await db
        .select()
        .from(ophthalmologyRefraction)
        .where(and(...conditions))
        .orderBy(desc(ophthalmologyRefraction.examinationDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(ophthalmologyRefraction)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: refractions,
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
 * POST /ophthalmology/refraction
 * Create a new refraction record
 */
ophthalmology.post(
  '/refraction',
  requirePermission('ophthalmology:refraction:write'),
  zValidator('json', createRefractionSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const refractionId = crypto.randomUUID();
      const now = new Date();

      // Generate refraction number
      const [countResult] = await db
        .select({ count: count() })
        .from(ophthalmologyRefraction)
        .where(eq(ophthalmologyRefraction.organizationId, organizationId));
      const refractionNumber = `REF-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(ophthalmologyRefraction).values({
        id: refractionId,
        organizationId,
        patientId: data.patientId,
        consultationId: data.consultationId,
        refractionNumber,
        examinationDate: new Date(data.examinationDate),
        refractionType: data.refractionType,
        odSphere: data.odSphere,
        odCylinder: data.odCylinder,
        odAxis: data.odAxis,
        odAdd: data.odAdd,
        osSphere: data.osSphere,
        osCylinder: data.osCylinder,
        osAxis: data.osAxis,
        osAdd: data.osAdd,
        odUcvaDistance: data.odUcvaDistance,
        osUcvaDistance: data.osUcvaDistance,
        odBcvaDistance: data.odBcvaDistance,
        osBcvaDistance: data.osBcvaDistance,
        performedBy: data.performedById,
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [refraction] = await db
        .select()
        .from(ophthalmologyRefraction)
        .where(eq(ophthalmologyRefraction.id, refractionId))
        .limit(1);

      return c.json({
        success: true,
        data: refraction,
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
// TONOMETRY ROUTES
// ============================================================================

/**
 * GET /ophthalmology/tonometry
 * List tonometry records
 */
ophthalmology.get(
  '/tonometry',
  requirePermission('ophthalmology:tonometry:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(ophthalmologyTonometry.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(ophthalmologyTonometry.patientId, query.patientId));
      }

      const tonometries = await db
        .select()
        .from(ophthalmologyTonometry)
        .where(and(...conditions))
        .orderBy(desc(ophthalmologyTonometry.measurementDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(ophthalmologyTonometry)
        .where(and(...conditions));

      return c.json({
        success: true,
        data: tonometries,
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
 * POST /ophthalmology/tonometry
 * Create a new tonometry record
 */
ophthalmology.post(
  '/tonometry',
  requirePermission('ophthalmology:tonometry:write'),
  zValidator('json', createTonometrySchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const tonometryId = crypto.randomUUID();
      const now = new Date();

      // Generate measurement number
      const [countResult] = await db
        .select({ count: count() })
        .from(ophthalmologyTonometry)
        .where(eq(ophthalmologyTonometry.organizationId, organizationId));
      const measurementNumber = `IOP-${String((countResult?.count || 0) + 1).padStart(6, '0')}`;

      await db.insert(ophthalmologyTonometry).values({
        id: tonometryId,
        organizationId,
        patientId: data.patientId,
        consultationId: data.consultationId,
        measurementNumber,
        measurementDate: new Date(data.measurementDate),
        measurementTime: data.measurementTime,
        tonometryMethod: data.tonometryMethod,
        iopOd: data.iopOd,
        iopOs: data.iopOs,
        cctOd: data.cctOd,
        cctOs: data.cctOs,
        targetIopOd: data.targetIopOd,
        targetIopOs: data.targetIopOs,
        isOnGlaucomaMedications: data.isOnGlaucomaMedications,
        currentMedications: data.currentMedications ? JSON.stringify(data.currentMedications) : undefined,
        performedBy: data.performedById,
        notes: data.notes,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });

      const [tonometry] = await db
        .select()
        .from(ophthalmologyTonometry)
        .where(eq(ophthalmologyTonometry.id, tonometryId))
        .limit(1);

      return c.json({
        success: true,
        data: tonometry,
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
// OSDI SCORES ROUTES
// ============================================================================

/**
 * GET /ophthalmology/osdi-scores
 * List OSDI scores
 */
ophthalmology.get(
  '/osdi-scores',
  requirePermission('ophthalmology:osdi:read'),
  zValidator('query', listQuerySchema.extend({ patientId: z.string().uuid().optional() })),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const query = c.req.valid('query');

      const conditions = [eq(ophthalmologyOsdiScores.organizationId, organizationId)];

      if (query.patientId) {
        conditions.push(eq(ophthalmologyOsdiScores.patientId, query.patientId));
      }

      const scores = await db
        .select()
        .from(ophthalmologyOsdiScores)
        .where(and(...conditions))
        .orderBy(desc(ophthalmologyOsdiScores.assessmentDate))
        .limit(query.limit)
        .offset(query.offset);

      const [totalResult] = await db
        .select({ count: count() })
        .from(ophthalmologyOsdiScores)
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
 * POST /ophthalmology/osdi-scores
 * Calculate and save OSDI score
 */
ophthalmology.post(
  '/osdi-scores',
  requirePermission('ophthalmology:osdi:write'),
  zValidator('json', createOsdiSchema),
  async (c) => {
    try {
      const db = getDb();
      const organizationId = c.get('organizationId');
      const userId = c.get('userId');
      const data = c.req.valid('json');

      const osdiId = crypto.randomUUID();
      const now = new Date();

      // Calculate OSDI score
      // OSDI = (Sum of scores for answered questions × 25) / Number of questions answered
      const questions = [
        data.q1LightSensitivity, data.q2GrittyFeeling, data.q3PainfulEyes,
        data.q4BlurredVision, data.q5PoorVision, data.q6Reading, data.q7Driving,
        data.q8Computer, data.q9Television, data.q10WindyConditions,
        data.q11LowHumidity, data.q12AirConditioning
      ].filter(q => q !== undefined && q !== null) as number[];

      const totalScore = questions.length > 0
        ? (questions.reduce((sum, q) => sum + q, 0) * 25) / questions.length
        : 0;

      // Determine severity
      let severity: 'normal' | 'mild' | 'moderate' | 'severe' = 'normal';
      if (totalScore > 32) severity = 'severe';
      else if (totalScore > 22) severity = 'moderate';
      else if (totalScore > 12) severity = 'mild';

      await db.insert(ophthalmologyOsdiScores).values({
        id: osdiId,
        organizationId,
        patientId: data.patientId,
        consultationId: data.consultationId,
        assessmentDate: new Date(data.assessmentDate),
        q1LightSensitivity: data.q1LightSensitivity,
        q2GrittyFeeling: data.q2GrittyFeeling,
        q3PainfulEyes: data.q3PainfulEyes,
        q4BlurredVision: data.q4BlurredVision,
        q5PoorVision: data.q5PoorVision,
        q6Reading: data.q6Reading,
        q7Driving: data.q7Driving,
        q8Computer: data.q8Computer,
        q9Television: data.q9Television,
        q10WindyConditions: data.q10WindyConditions,
        q11LowHumidity: data.q11LowHumidity,
        q12AirConditioning: data.q12AirConditioning,
        totalScore,
        severity,
        administeredBy: userId,
        notes: data.notes,
        createdAt: now,
        updatedAt: now,
      });

      const [osdi] = await db
        .select()
        .from(ophthalmologyOsdiScores)
        .where(eq(ophthalmologyOsdiScores.id, osdiId))
        .limit(1);

      return c.json({
        success: true,
        data: osdi,
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
 * GET /ophthalmology/alerts
 * List ophthalmology alerts
 */
ophthalmology.get(
  '/alerts',
  requirePermission('ophthalmology:alerts:read'),
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
        eq(healthcareAlerts.module, 'ophthalmology'),
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
 * GET /ophthalmology/appointments
 * List ophthalmology appointments
 */
ophthalmology.get(
  '/appointments',
  requirePermission('ophthalmology:appointments:read'),
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
        eq(healthcareAppointments.module, 'ophthalmology'),
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

export default ophthalmology;
