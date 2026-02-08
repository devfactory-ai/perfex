/**
 * Healthcare Calculators Routes
 * /api/v1/calculators
 *
 * Provides endpoints for clinical calculations:
 * - Dialysis Kt/V calculation
 * - IOL Power calculation
 * - Cardiology risk scores
 * - Clinical data validation
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { requireAuth, requirePermission } from '../middleware/auth';
import type { Env } from '../types';

// Import calculators
import { ktvCalculator, type KtVInput } from '../services/dialyse/ktv.calculator';
import { IOLCalculator, type BiometryData, type IOLConstants, type PatientData, STANDARD_IOL_CONSTANTS } from '../services/ophthalmology/iol.calculator';
import {
  CardiologyRiskCalculator,
  type PatientDemographics,
  type LipidProfile,
  type CardiovascularRiskFactors,
  type CACScoreInput,
  type HEARTScoreInput,
  type CHADSVASCInput,
  type HASBLEDInput,
  type GRACEScoreInput,
} from '../services/cardiology/risk.calculator';
import { ClinicalValidator, type VitalSigns, type LabResults, type ValidationContext } from '../services/healthcare/clinical.validator';

const calculators = new Hono<{ Bindings: Env }>();

// All routes require authentication
calculators.use('/*', requireAuth);

// ============================================================================
// DIALYSIS Kt/V CALCULATOR
// ============================================================================

const ktVInputSchema = z.object({
  preDialysisBUN: z.number().min(0).describe('Pre-dialysis BUN (mg/dL)'),
  postDialysisBUN: z.number().min(0).describe('Post-dialysis BUN (mg/dL)'),
  ultrafiltrationVolume: z.number().min(0).describe('UF volume (L)'),
  sessionDuration: z.number().min(0).describe('Session duration (minutes)'),
  preDialysisWeight: z.number().min(0).optional().describe('Pre-dialysis weight (kg)'),
  postDialysisWeight: z.number().min(0).describe('Post-dialysis weight (kg)'),
});

/**
 * POST /calculators/dialysis/ktv
 * Calculate Kt/V for a dialysis session
 */
calculators.post(
  '/dialysis/ktv',
  requirePermission('dialyse:sessions:read'),
  zValidator('json', ktVInputSchema),
  async (c) => {
    try {
      const input = c.req.valid('json') as KtVInput;
      const result = ktvCalculator.calculate(input);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Kt/V calculation error', { error });
      return c.json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'Calculation failed',
        },
      }, 400);
    }
  }
);

/**
 * GET /calculators/dialysis/ktv/recommendations
 * Get Kt/V clinical recommendations
 */
calculators.get(
  '/dialysis/ktv/recommendations',
  requirePermission('dialyse:sessions:read'),
  async (c) => {
    try {
      const ktV = parseFloat(c.req.query('ktv') || '0');

      if (ktV <= 0) {
        return c.json({
          success: false,
          error: { code: 'INVALID_INPUT', message: 'ktv query parameter required' },
        }, 400);
      }

      // Determine adequacy and recommendations based on kt/V value
      let adequacy: string;
      const recommendations: string[] = [];

      if (ktV >= 1.4) {
        adequacy = 'adequate';
        recommendations.push('Excellent adequacy achieved');
      } else if (ktV >= 1.2) {
        adequacy = 'borderline';
        recommendations.push('Consider increasing session duration');
        recommendations.push('Verify blood flow rate');
      } else {
        adequacy = 'inadequate';
        recommendations.push('Increase dialysis time');
        recommendations.push('Check vascular access function');
        recommendations.push('Consider increasing frequency');
      }

      return c.json({
        success: true,
        data: {
          ktV,
          adequacy,
          targetKtV: 1.4,
          minimumKtV: 1.2,
          recommendations,
        },
      });
    } catch (error) {
      logger.error('Kt/V recommendations error', { error });
      return c.json({
        success: false,
        error: {
          code: 'ERROR',
          message: error instanceof Error ? error.message : 'Failed to get recommendations',
        },
      }, 500);
    }
  }
);

// ============================================================================
// OPHTHALMOLOGY IOL CALCULATOR
// ============================================================================

const biometrySchema = z.object({
  axialLength: z.number().min(15).max(40).describe('Axial length (mm)'),
  k1: z.number().min(35).max(55).describe('K1 flattest meridian (D)'),
  k2: z.number().min(35).max(55).describe('K2 steepest meridian (D)'),
  acd: z.number().min(1).max(6).optional().describe('Anterior chamber depth (mm)'),
  lensThickness: z.number().min(2).max(8).optional().describe('Lens thickness (mm)'),
  wtw: z.number().min(9).max(15).optional().describe('White-to-white (mm)'),
  cct: z.number().min(400).max(700).optional().describe('Central corneal thickness (μm)'),
});

const iolPatientSchema = z.object({
  targetRefraction: z.number().min(-5).max(2).default(-0.25),
  postLasik: z.boolean().optional(),
  postPrk: z.boolean().optional(),
  preLasikK1: z.number().optional(),
  preLasikK2: z.number().optional(),
  preLasikRefraction: z.number().optional(),
  currentRefraction: z.number().optional(),
});

const iolCalculateSchema = z.object({
  biometry: biometrySchema,
  patient: iolPatientSchema.optional(),
  iolModel: z.string().optional().default('default'),
  iolConstants: z.object({
    aConstant: z.number(),
    surgeonFactor: z.number().optional(),
    haigisA0: z.number().optional(),
    haigisA1: z.number().optional(),
    haigisA2: z.number().optional(),
  }).optional(),
});

/**
 * POST /calculators/ophthalmology/iol
 * Calculate IOL power using all formulas
 */
calculators.post(
  '/ophthalmology/iol',
  requirePermission('ophthalmology:consultations:read'),
  zValidator('json', iolCalculateSchema),
  async (c) => {
    try {
      const { biometry, patient, iolModel, iolConstants } = c.req.valid('json');

      const constants: IOLConstants | string = iolConstants || iolModel || 'default';
      const patientData: PatientData = patient || { targetRefraction: -0.25 };

      const calculator = new IOLCalculator(
        biometry as BiometryData,
        constants,
        patientData
      );

      const result = calculator.calculateAll();

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('IOL calculation error', { error });
      return c.json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'IOL calculation failed',
        },
      }, 400);
    }
  }
);

/**
 * POST /calculators/ophthalmology/iol/:formula
 * Calculate IOL power using a specific formula
 */
calculators.post(
  '/ophthalmology/iol/:formula',
  requirePermission('ophthalmology:consultations:read'),
  zValidator('json', iolCalculateSchema),
  async (c) => {
    try {
      const formula = c.req.param('formula').toLowerCase();
      const { biometry, patient, iolModel, iolConstants } = c.req.valid('json');

      const constants: IOLConstants | string = iolConstants || iolModel || 'default';
      const patientData: PatientData = patient || { targetRefraction: -0.25 };

      const calculator = new IOLCalculator(
        biometry as BiometryData,
        constants,
        patientData
      );

      let result;
      switch (formula) {
        case 'srkt':
          result = calculator.calculateSRKT();
          break;
        case 'holladay1':
          result = calculator.calculateHolladay1();
          break;
        case 'haigis':
          result = calculator.calculateHaigis();
          break;
        case 'barrett':
          result = calculator.calculateBarrett();
          break;
        default:
          return c.json({
            success: false,
            error: {
              code: 'INVALID_FORMULA',
              message: `Unknown formula: ${formula}. Available: srkt, holladay1, haigis, barrett`,
            },
          }, 400);
      }

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('IOL calculation error', { error });
      return c.json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'IOL calculation failed',
        },
      }, 400);
    }
  }
);

/**
 * GET /calculators/ophthalmology/iol/constants
 * Get available IOL constants
 */
calculators.get(
  '/ophthalmology/iol/constants',
  requirePermission('ophthalmology:consultations:read'),
  async (c) => {
    return c.json({
      success: true,
      data: STANDARD_IOL_CONSTANTS,
    });
  }
);

/**
 * GET /calculators/ophthalmology/iol/formulas
 * Get recommended formulas for eye characteristics
 */
calculators.get(
  '/ophthalmology/iol/formulas',
  requirePermission('ophthalmology:consultations:read'),
  async (c) => {
    try {
      const axialLength = parseFloat(c.req.query('axialLength') || '24');
      const postRefractive = c.req.query('postRefractive') === 'true';

      const recommendations = IOLCalculator.getRecommendedFormulas(axialLength, postRefractive);

      return c.json({
        success: true,
        data: {
          axialLength,
          postRefractive,
          recommendedFormulas: recommendations,
        },
      });
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'ERROR',
          message: error instanceof Error ? error.message : 'Failed to get recommendations',
        },
      }, 500);
    }
  }
);

// ============================================================================
// CARDIOLOGY RISK CALCULATORS
// ============================================================================

const demographicsSchema = z.object({
  age: z.number().min(1).max(120),
  sex: z.enum(['male', 'female']),
  race: z.enum(['white', 'african_american', 'hispanic', 'asian']).optional(),
});

const lipidsSchema = z.object({
  totalCholesterol: z.number().min(0),
  hdlCholesterol: z.number().min(0),
  ldlCholesterol: z.number().min(0).optional(),
  triglycerides: z.number().min(0).optional(),
});

const riskFactorsSchema = z.object({
  systolicBP: z.number().min(0),
  diastolicBP: z.number().min(0).optional(),
  onBPMedication: z.boolean(),
  diabetic: z.boolean(),
  smoker: z.boolean(),
  familyHistoryCAD: z.boolean().optional(),
  chronicKidneyDisease: z.boolean().optional(),
});

const cacScoreSchema = z.object({
  agatstonScore: z.number().min(0),
  volumeScore: z.number().min(0).optional(),
  massScore: z.number().min(0).optional(),
  percentile: z.number().min(0).max(100).optional(),
});

const ascvdCalculateSchema = z.object({
  demographics: demographicsSchema,
  lipids: lipidsSchema,
  riskFactors: riskFactorsSchema,
});

const cacInterpretSchema = z.object({
  score: cacScoreSchema,
  demographics: demographicsSchema,
});

/**
 * POST /calculators/cardiology/ascvd
 * Calculate ASCVD 10-year risk
 */
calculators.post(
  '/cardiology/ascvd',
  requirePermission('cardiology:consultations:read'),
  zValidator('json', ascvdCalculateSchema),
  async (c) => {
    try {
      const { demographics, lipids, riskFactors } = c.req.valid('json');

      const result = CardiologyRiskCalculator.ASCVD.calculate(
        demographics as PatientDemographics,
        lipids as LipidProfile,
        riskFactors as CardiovascularRiskFactors
      );

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('ASCVD calculation error', { error });
      return c.json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'ASCVD calculation failed',
        },
      }, 400);
    }
  }
);

/**
 * POST /calculators/cardiology/cac
 * Interpret CAC (Coronary Artery Calcium) score
 */
calculators.post(
  '/cardiology/cac',
  requirePermission('cardiology:consultations:read'),
  zValidator('json', cacInterpretSchema),
  async (c) => {
    try {
      const { score, demographics } = c.req.valid('json');

      const result = CardiologyRiskCalculator.CAC.interpret(
        score as CACScoreInput,
        demographics as PatientDemographics
      );

      // Add percentile if not provided
      if (!score.percentile) {
        const percentile = CardiologyRiskCalculator.CAC.getExpectedPercentile(
          score.agatstonScore,
          demographics.age,
          demographics.sex,
          demographics.race
        );
        (result as unknown as Record<string, unknown>).calculatedPercentile = percentile;
      }

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('CAC interpretation error', { error });
      return c.json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'CAC interpretation failed',
        },
      }, 400);
    }
  }
);

const heartScoreSchema = z.object({
  history: z.number().min(0).max(2),
  ecg: z.number().min(0).max(2),
  age: z.number().min(0).max(2),
  riskFactors: z.number().min(0).max(2),
  troponin: z.number().min(0).max(2),
});

/**
 * POST /calculators/cardiology/heart
 * Calculate HEART score for chest pain
 */
calculators.post(
  '/cardiology/heart',
  requirePermission('cardiology:consultations:read'),
  zValidator('json', heartScoreSchema),
  async (c) => {
    try {
      const input = c.req.valid('json') as HEARTScoreInput;
      const result = CardiologyRiskCalculator.HEART.calculate(input);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('HEART score error', { error });
      return c.json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'HEART score calculation failed',
        },
      }, 400);
    }
  }
);

const chadsvascSchema = z.object({
  age: z.number().min(1).max(120),
  sex: z.enum(['male', 'female']),
  congestiveHeartFailure: z.boolean(),
  hypertension: z.boolean(),
  strokeTIAHistory: z.boolean(),
  vascularDisease: z.boolean(),
  diabetes: z.boolean(),
});

/**
 * POST /calculators/cardiology/chadsvasc
 * Calculate CHA2DS2-VASc score for atrial fibrillation
 */
calculators.post(
  '/cardiology/chadsvasc',
  requirePermission('cardiology:consultations:read'),
  zValidator('json', chadsvascSchema),
  async (c) => {
    try {
      const input = c.req.valid('json') as CHADSVASCInput;
      const result = CardiologyRiskCalculator.CHADSVASC.calculate(input);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('CHA2DS2-VASc score error', { error });
      return c.json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'CHA2DS2-VASc calculation failed',
        },
      }, 400);
    }
  }
);

const hasbledSchema = z.object({
  hypertension: z.boolean(),
  renalDisease: z.boolean(),
  liverDisease: z.boolean(),
  strokeHistory: z.boolean(),
  bleedingHistory: z.boolean(),
  labilINR: z.boolean(),
  elderly: z.boolean(),
  drugsAlcohol: z.boolean(),
});

/**
 * POST /calculators/cardiology/hasbled
 * Calculate HAS-BLED bleeding risk score
 */
calculators.post(
  '/cardiology/hasbled',
  requirePermission('cardiology:consultations:read'),
  zValidator('json', hasbledSchema),
  async (c) => {
    try {
      const input = c.req.valid('json') as HASBLEDInput;
      const result = CardiologyRiskCalculator.HASBLED.calculate(input);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('HAS-BLED score error', { error });
      return c.json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'HAS-BLED calculation failed',
        },
      }, 400);
    }
  }
);

const graceScoreSchema = z.object({
  age: z.number().min(1).max(120),
  heartRate: z.number().min(0),
  systolicBP: z.number().min(0),
  creatinine: z.number().min(0),
  killipClass: z.number().min(1).max(4),
  cardiacArrest: z.boolean(),
  stDeviation: z.boolean(),
  elevatedCardiacMarkers: z.boolean(),
});

/**
 * POST /calculators/cardiology/grace
 * Calculate GRACE score for ACS
 */
calculators.post(
  '/cardiology/grace',
  requirePermission('cardiology:consultations:read'),
  zValidator('json', graceScoreSchema),
  async (c) => {
    try {
      const input = c.req.valid('json') as GRACEScoreInput;
      const result = CardiologyRiskCalculator.GRACE.calculate(input);

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('GRACE score error', { error });
      return c.json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'GRACE calculation failed',
        },
      }, 400);
    }
  }
);

/**
 * POST /calculators/cardiology/comprehensive
 * Calculate multiple cardiovascular risk scores
 */
calculators.post(
  '/cardiology/comprehensive',
  requirePermission('cardiology:consultations:read'),
  zValidator('json', z.object({
    demographics: demographicsSchema,
    lipids: lipidsSchema.optional(),
    riskFactors: riskFactorsSchema.optional(),
    cacScore: cacScoreSchema.optional(),
  })),
  async (c) => {
    try {
      const { demographics, lipids, riskFactors, cacScore } = c.req.valid('json');

      const result = CardiologyRiskCalculator.calculateComprehensive(
        demographics as PatientDemographics,
        lipids as LipidProfile | undefined,
        riskFactors as CardiovascularRiskFactors | undefined,
        cacScore as CACScoreInput | undefined
      );

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Comprehensive risk calculation error', { error });
      return c.json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'Risk calculation failed',
        },
      }, 400);
    }
  }
);

// ============================================================================
// CLINICAL VALIDATION
// ============================================================================

const vitalsSchema = z.object({
  heartRate: z.number().min(0).optional(),
  systolicBP: z.number().min(0).optional(),
  diastolicBP: z.number().min(0).optional(),
  temperature: z.number().min(30).max(45).optional(),
  respiratoryRate: z.number().min(0).optional(),
  oxygenSaturation: z.number().min(0).max(100).optional(),
  weight: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  bmi: z.number().min(0).optional(),
  bloodGlucose: z.number().min(0).optional(),
  painScore: z.number().min(0).max(10).optional(),
});

const labsSchema = z.object({
  hemoglobin: z.number().optional(),
  hematocrit: z.number().optional(),
  wbc: z.number().optional(),
  platelets: z.number().optional(),
  sodium: z.number().optional(),
  potassium: z.number().optional(),
  creatinine: z.number().optional(),
  bun: z.number().optional(),
  glucose: z.number().optional(),
  calcium: z.number().optional(),
  phosphorus: z.number().optional(),
  albumin: z.number().optional(),
  troponin: z.number().optional(),
  egfr: z.number().optional(),
}).passthrough();

const validationContextSchema = z.object({
  age: z.number().optional(),
  sex: z.enum(['male', 'female']).optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  pregnant: z.boolean().optional(),
  chronicConditions: z.array(z.string()).optional(),
  currentMedications: z.array(z.string()).optional(),
});

const validateVitalsSchema = z.object({
  vitals: vitalsSchema,
  context: validationContextSchema.optional(),
});

const validateLabsSchema = z.object({
  labs: labsSchema,
  context: validationContextSchema.optional(),
});

const validateAllSchema = z.object({
  vitals: vitalsSchema.optional(),
  labs: labsSchema.optional(),
  medications: z.array(z.string()).optional(),
  context: validationContextSchema.optional(),
});

/**
 * POST /calculators/validate/vitals
 * Validate vital signs
 */
calculators.post(
  '/validate/vitals',
  requirePermission('patients:read'),
  zValidator('json', validateVitalsSchema),
  async (c) => {
    try {
      const { vitals, context } = c.req.valid('json');

      const results = ClinicalValidator.VitalSigns.validate(
        vitals as VitalSigns,
        context as ValidationContext
      );

      const criticalAlerts = results.filter(r => r.severity === 'critical');
      const warnings = results.filter(r => r.severity === 'warning');

      return c.json({
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            critical: criticalAlerts.length,
            warnings: warnings.length,
            valid: results.filter(r => r.isValid).length,
          },
          criticalAlerts,
          warnings,
        },
      });
    } catch (error) {
      logger.error('Vitals validation error', { error });
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Validation failed',
        },
      }, 400);
    }
  }
);

/**
 * POST /calculators/validate/labs
 * Validate laboratory results
 */
calculators.post(
  '/validate/labs',
  requirePermission('patients:read'),
  zValidator('json', validateLabsSchema),
  async (c) => {
    try {
      const { labs, context } = c.req.valid('json');

      const results = ClinicalValidator.LabResults.validate(
        labs as LabResults,
        context as ValidationContext
      );

      const criticalAlerts = results.filter(r => r.severity === 'critical');
      const warnings = results.filter(r => r.severity === 'warning');

      return c.json({
        success: true,
        data: {
          results,
          summary: {
            total: results.length,
            critical: criticalAlerts.length,
            warnings: warnings.length,
            valid: results.filter(r => r.isValid).length,
          },
          criticalAlerts,
          warnings,
        },
      });
    } catch (error) {
      logger.error('Labs validation error', { error });
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Validation failed',
        },
      }, 400);
    }
  }
);

/**
 * POST /calculators/validate/medications
 * Check drug interactions
 */
calculators.post(
  '/validate/medications',
  requirePermission('patients:read'),
  zValidator('json', z.object({ medications: z.array(z.string()).min(1) })),
  async (c) => {
    try {
      const { medications } = c.req.valid('json');

      const interactions = ClinicalValidator.DrugInteractions.check(medications);

      const contraindicated = interactions.filter(i => i.severity === 'contraindicated');
      const major = interactions.filter(i => i.severity === 'major');

      return c.json({
        success: true,
        data: {
          interactions,
          summary: {
            total: interactions.length,
            contraindicated: contraindicated.length,
            major: major.length,
            moderate: interactions.filter(i => i.severity === 'moderate').length,
            minor: interactions.filter(i => i.severity === 'minor').length,
          },
          contraindicated,
          major,
        },
      });
    } catch (error) {
      logger.error('Medication check error', { error });
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Medication check failed',
        },
      }, 400);
    }
  }
);

/**
 * POST /calculators/validate/comprehensive
 * Validate all clinical data
 */
calculators.post(
  '/validate/comprehensive',
  requirePermission('patients:read'),
  zValidator('json', validateAllSchema),
  async (c) => {
    try {
      const { vitals, labs, medications, context } = c.req.valid('json');

      const result = ClinicalValidator.validateAll({
        vitals: vitals as VitalSigns,
        labs: labs as LabResults,
        medications,
        context: context as ValidationContext,
      });

      return c.json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Comprehensive validation error', { error });
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error instanceof Error ? error.message : 'Validation failed',
        },
      }, 400);
    }
  }
);

/**
 * POST /calculators/renal/egfr
 * Calculate eGFR
 */
calculators.post(
  '/renal/egfr',
  requirePermission('patients:read'),
  zValidator('json', z.object({
    creatinine: z.number().min(0),
    age: z.number().min(1).max(120),
    sex: z.enum(['male', 'female']),
    race: z.enum(['african_american', 'white', 'hispanic', 'asian']).optional().default('white'),
  })),
  async (c) => {
    try {
      const { creatinine, age, sex, race } = c.req.valid('json');

      // Convert race to the expected format
      const raceForEgfr = race === 'african_american' ? 'african_american' : 'other';
      const egfr = ClinicalValidator.LabResults.calculateEGFR(
        creatinine,
        age,
        sex,
        raceForEgfr
      );

      // CKD staging
      let stage = '';
      let description = '';
      if (egfr >= 90) { stage = '1'; description = 'Normal ou élevé'; }
      else if (egfr >= 60) { stage = '2'; description = 'Légèrement diminué'; }
      else if (egfr >= 45) { stage = '3a'; description = 'Légèrement à modérément diminué'; }
      else if (egfr >= 30) { stage = '3b'; description = 'Modérément à sévèrement diminué'; }
      else if (egfr >= 15) { stage = '4'; description = 'Sévèrement diminué'; }
      else { stage = '5'; description = 'Insuffisance rénale terminale'; }

      return c.json({
        success: true,
        data: {
          egfr,
          unit: 'mL/min/1.73m²',
          ckdStage: stage,
          description,
          inputs: { creatinine, age, sex, race },
        },
      });
    } catch (error) {
      logger.error('eGFR calculation error', { error });
      return c.json({
        success: false,
        error: {
          code: 'CALCULATION_ERROR',
          message: error instanceof Error ? error.message : 'eGFR calculation failed',
        },
      }, 400);
    }
  }
);

export { calculators };
export default calculators;
