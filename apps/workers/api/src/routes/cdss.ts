/**
 * Clinical Decision Support System (CDSS) Routes
 * API endpoints for clinical guidelines and drug interaction checking
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { requirePermissions } from '../middleware/permissions';
import { CDSSService, type PatientClinicalData } from '../services/cdss/cdss.service';
import { DrugInteractionsService } from '../services/cdss/drug-interactions.service';

const cdssRoutes = new Hono<{ Bindings: Env }>();
const cdssService = new CDSSService();
const drugService = new DrugInteractionsService();

// Apply authentication to all routes
cdssRoutes.use('*', authMiddleware);

// =============================================================================
// Validation Schemas
// =============================================================================

const patientDataSchema = z.object({
  patientId: z.string(),
  demographics: z.object({
    age: z.number().min(0).max(150),
    sex: z.enum(['male', 'female']),
    weight: z.number().optional(),
    height: z.number().optional()
  }),
  vitals: z.object({
    systolicBP: z.number().optional(),
    diastolicBP: z.number().optional(),
    heartRate: z.number().optional(),
    temperature: z.number().optional(),
    oxygenSaturation: z.number().optional()
  }).optional(),
  labs: z.object({
    creatinine: z.number().optional(),
    egfr: z.number().optional(),
    potassium: z.number().optional(),
    hemoglobin: z.number().optional(),
    hba1c: z.number().optional(),
    cholesterolTotal: z.number().optional(),
    ldl: z.number().optional(),
    hdl: z.number().optional(),
    triglycerides: z.number().optional(),
    calcium: z.number().optional(),
    phosphorus: z.number().optional(),
    pth: z.number().optional(),
    albumin: z.number().optional(),
    inr: z.number().optional(),
    bnp: z.number().optional(),
    troponin: z.number().optional()
  }).optional(),
  conditions: z.array(z.string()).optional(),
  medications: z.array(z.object({
    name: z.string(),
    dose: z.string().optional(),
    frequency: z.string().optional(),
    atcCode: z.string().optional()
  })).optional(),
  allergies: z.array(z.string()).optional(),
  dialysis: z.object({
    isOnDialysis: z.boolean(),
    ktv: z.number().optional(),
    accessType: z.string().optional(),
    lastSessionDate: z.string().optional()
  }).optional(),
  cardiology: z.object({
    lvef: z.number().optional(),
    hasAF: z.boolean().optional(),
    hasCHF: z.boolean().optional(),
    hasCAD: z.boolean().optional(),
    hasPacemaker: z.boolean().optional(),
    hasStent: z.boolean().optional()
  }).optional(),
  ophthalmology: z.object({
    iop: z.object({
      left: z.number(),
      right: z.number()
    }).optional(),
    hasDME: z.boolean().optional(),
    hasAMD: z.boolean().optional(),
    hasGlaucoma: z.boolean().optional()
  }).optional()
});

const drugInteractionCheckSchema = z.object({
  medications: z.array(z.string()).min(1),
  conditions: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  egfr: z.number().optional(),
  isOnDialysis: z.boolean().optional()
});

const singleDrugCheckSchema = z.object({
  drugName: z.string(),
  egfr: z.number().optional(),
  isOnDialysis: z.boolean().optional()
});

// =============================================================================
// CDSS Evaluation Routes
// =============================================================================

/**
 * POST /evaluate - Evaluate all CDSS rules for a patient
 */
cdssRoutes.post(
  '/evaluate',
  requirePermissions('healthcare.read'),
  zValidator('json', patientDataSchema),
  async (c) => {
    const patientData = c.req.valid('json') as PatientClinicalData;

    try {
      const result = await cdssService.evaluatePatient(patientData);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Evaluation failed'
      }, 500);
    }
  }
);

/**
 * POST /evaluate/:module - Evaluate rules for a specific module
 */
cdssRoutes.post(
  '/evaluate/:module',
  requirePermissions('healthcare.read'),
  zValidator('json', patientDataSchema),
  async (c) => {
    const module = c.req.param('module') as 'dialyse' | 'cardiology' | 'ophthalmology' | 'general';
    const patientData = c.req.valid('json') as PatientClinicalData;

    if (!['dialyse', 'cardiology', 'ophthalmology', 'general'].includes(module)) {
      return c.json({
        success: false,
        error: 'Invalid module. Must be: dialyse, cardiology, ophthalmology, or general'
      }, 400);
    }

    try {
      const result = await cdssService.evaluateByModule(patientData, module);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Evaluation failed'
      }, 500);
    }
  }
);

/**
 * GET /rules - Get all available CDSS rules
 */
cdssRoutes.get(
  '/rules',
  requirePermissions('healthcare.read'),
  async (c) => {
    const module = c.req.query('module');

    const rules = cdssService.getRules(module);

    return c.json({
      success: true,
      data: {
        rules: rules.map(r => ({
          id: r.id,
          name: r.name,
          description: r.description,
          category: r.category,
          module: r.module,
          guidelineSource: r.guidelineSource,
          priority: r.priority,
          isActive: r.isActive
        })),
        total: rules.length
      }
    });
  }
);

/**
 * GET /rules/summary - Get summary of active rules
 */
cdssRoutes.get(
  '/rules/summary',
  requirePermissions('healthcare.read'),
  async (c) => {
    const summary = cdssService.getActiveRulesCount();

    return c.json({
      success: true,
      data: summary
    });
  }
);

// =============================================================================
// Drug Interaction Routes
// =============================================================================

/**
 * POST /interactions/check - Check drug interactions
 */
cdssRoutes.post(
  '/interactions/check',
  requirePermissions('healthcare.read'),
  zValidator('json', drugInteractionCheckSchema),
  async (c) => {
    const { medications, conditions, allergies, egfr, isOnDialysis } = c.req.valid('json');

    try {
      const result = drugService.checkInteractions(
        medications,
        conditions,
        allergies,
        egfr,
        isOnDialysis
      );

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Interaction check failed'
      }, 500);
    }
  }
);

/**
 * POST /interactions/renal-dose - Get renal dose adjustment for a drug
 */
cdssRoutes.post(
  '/interactions/renal-dose',
  requirePermissions('healthcare.read'),
  zValidator('json', singleDrugCheckSchema),
  async (c) => {
    const { drugName, egfr, isOnDialysis } = c.req.valid('json');

    const adjustment = drugService.getDoseAdjustment(drugName, egfr, isOnDialysis);

    if (!adjustment) {
      return c.json({
        success: true,
        data: null,
        message: 'No renal dose adjustment data available for this drug'
      });
    }

    // Determine which dose applies
    let applicableDose = adjustment.normalDose;
    let renalCategory = 'normal';

    if (isOnDialysis) {
      applicableDose = adjustment.dialysis;
      renalCategory = 'dialysis';
    } else if (egfr !== undefined) {
      if (egfr < 15) {
        applicableDose = adjustment.egfrBelow15;
        renalCategory = 'egfr_below_15';
      } else if (egfr < 30) {
        applicableDose = adjustment.egfr15_29;
        renalCategory = 'egfr_15_29';
      } else if (egfr < 60) {
        applicableDose = adjustment.egfr30_59;
        renalCategory = 'egfr_30_59';
      }
    }

    return c.json({
      success: true,
      data: {
        ...adjustment,
        applicableDose,
        renalCategory,
        patientEgfr: egfr,
        isOnDialysis
      }
    });
  }
);

/**
 * GET /interactions/drug-classes - Get drug class reference
 */
cdssRoutes.get(
  '/interactions/drug-classes',
  requirePermissions('healthcare.read'),
  async (c) => {
    const drugClasses = drugService.getDrugClasses();

    return c.json({
      success: true,
      data: drugClasses
    });
  }
);

// =============================================================================
// Clinical Calculators Routes (Extended)
// =============================================================================

/**
 * POST /calculate/ckd-stage - Calculate CKD stage from eGFR
 */
cdssRoutes.post(
  '/calculate/ckd-stage',
  requirePermissions('healthcare.read'),
  zValidator('json', z.object({ egfr: z.number() })),
  async (c) => {
    const { egfr } = c.req.valid('json');

    let stage: string;
    let description: string;
    let recommendations: string[];

    if (egfr >= 90) {
      stage = '1';
      description = 'Fonction rénale normale ou augmentée';
      recommendations = [
        'Traiter la cause sous-jacente si présente',
        'Réduction des facteurs de risque CV',
        'Contrôle annuel'
      ];
    } else if (egfr >= 60) {
      stage = '2';
      description = 'Légère diminution du DFG';
      recommendations = [
        'Estimer la progression',
        'Contrôler TA (cible <130/80)',
        'Éviter les néphrotoxiques',
        'Contrôle annuel'
      ];
    } else if (egfr >= 45) {
      stage = '3a';
      description = 'Diminution légère à modérée du DFG';
      recommendations = [
        'Référer néphrologie si protéinurie',
        'Ajuster les médicaments au DFG',
        'Surveiller anémie, MBD',
        'Contrôle tous les 6 mois'
      ];
    } else if (egfr >= 30) {
      stage = '3b';
      description = 'Diminution modérée à sévère du DFG';
      recommendations = [
        'Suivi néphrologique recommandé',
        'Traiter anémie, troubles phosphocalciques',
        'Vaccinations (Hépatite B)',
        'Contrôle tous les 3-6 mois'
      ];
    } else if (egfr >= 15) {
      stage = '4';
      description = 'Diminution sévère du DFG';
      recommendations = [
        'Suivi néphrologique obligatoire',
        'Préparation à la suppléance rénale',
        'Éducation patient (options: HD, DP, greffe)',
        'Création accès vasculaire si HD prévue',
        'Contrôle tous les 1-3 mois'
      ];
    } else {
      stage = '5';
      description = 'Insuffisance rénale terminale';
      recommendations = [
        'Initiation suppléance rénale',
        'Évaluation pour transplantation',
        'Gestion symptômes urémiques',
        'Suivi rapproché (mensuel)'
      ];
    }

    return c.json({
      success: true,
      data: {
        egfr,
        stage,
        description,
        recommendations,
        kdigo_classification: `CKD G${stage}`
      }
    });
  }
);

/**
 * POST /calculate/creatinine-clearance - Calculate Cockcroft-Gault CrCl
 */
cdssRoutes.post(
  '/calculate/creatinine-clearance',
  requirePermissions('healthcare.read'),
  zValidator('json', z.object({
    age: z.number().min(18).max(120),
    weight: z.number().min(30).max(300),
    sex: z.enum(['male', 'female']),
    creatinine: z.number().min(0.1).max(20)
  })),
  async (c) => {
    const { age, weight, sex, creatinine } = c.req.valid('json');

    // Cockcroft-Gault formula
    let crcl = ((140 - age) * weight) / (72 * creatinine);
    if (sex === 'female') {
      crcl *= 0.85;
    }

    let category: string;
    if (crcl >= 90) category = 'Normal';
    else if (crcl >= 60) category = 'Légère diminution';
    else if (crcl >= 30) category = 'Diminution modérée';
    else if (crcl >= 15) category = 'Diminution sévère';
    else category = 'Insuffisance rénale terminale';

    return c.json({
      success: true,
      data: {
        creatinineClearance: Math.round(crcl * 10) / 10,
        unit: 'mL/min',
        category,
        formula: 'Cockcroft-Gault',
        inputs: { age, weight, sex, creatinine },
        note: 'CrCl Cockcroft-Gault souvent utilisée pour ajustement médicamenteux'
      }
    });
  }
);

/**
 * POST /calculate/bmi - Calculate BMI and classification
 */
cdssRoutes.post(
  '/calculate/bmi',
  requirePermissions('healthcare.read'),
  zValidator('json', z.object({
    weight: z.number().min(20).max(500),
    height: z.number().min(100).max(250) // in cm
  })),
  async (c) => {
    const { weight, height } = c.req.valid('json');

    const heightM = height / 100;
    const bmi = weight / (heightM * heightM);

    let category: string;
    let recommendations: string[];

    if (bmi < 18.5) {
      category = 'Insuffisance pondérale';
      recommendations = ['Évaluation nutritionnelle', 'Rechercher cause sous-jacente'];
    } else if (bmi < 25) {
      category = 'Poids normal';
      recommendations = ['Maintenir activité physique régulière', 'Alimentation équilibrée'];
    } else if (bmi < 30) {
      category = 'Surpoids';
      recommendations = ['Conseils hygiéno-diététiques', 'Augmenter activité physique', 'Dépister complications métaboliques'];
    } else if (bmi < 35) {
      category = 'Obésité grade I';
      recommendations = ['Prise en charge nutritionnelle', 'Programme d\'activité physique', 'Dépistage diabète, HTA, dyslipidémie'];
    } else if (bmi < 40) {
      category = 'Obésité grade II';
      recommendations = ['Prise en charge multidisciplinaire', 'Considérer traitement médicamenteux', 'Évaluer comorbidités'];
    } else {
      category = 'Obésité grade III (morbide)';
      recommendations = ['Évaluation pour chirurgie bariatrique', 'Prise en charge spécialisée', 'Suivi rapproché'];
    }

    return c.json({
      success: true,
      data: {
        bmi: Math.round(bmi * 10) / 10,
        category,
        recommendations,
        idealWeightRange: {
          min: Math.round(18.5 * heightM * heightM),
          max: Math.round(24.9 * heightM * heightM)
        }
      }
    });
  }
);

/**
 * POST /calculate/qtc - Calculate corrected QT interval
 */
cdssRoutes.post(
  '/calculate/qtc',
  requirePermissions('healthcare.read'),
  zValidator('json', z.object({
    qt: z.number().min(200).max(800), // ms
    heartRate: z.number().min(30).max(200),
    formula: z.enum(['bazett', 'fridericia', 'framingham']).default('bazett')
  })),
  async (c) => {
    const { qt, heartRate, formula } = c.req.valid('json');

    const rr = 60000 / heartRate; // RR interval in ms
    let qtc: number;

    switch (formula) {
      case 'fridericia':
        qtc = qt / Math.pow(rr / 1000, 1/3);
        break;
      case 'framingham':
        qtc = qt + 0.154 * (1000 - rr);
        break;
      case 'bazett':
      default:
        qtc = qt / Math.sqrt(rr / 1000);
    }

    let interpretation: string;
    let riskLevel: string;

    if (qtc < 440) {
      interpretation = 'QTc normal';
      riskLevel = 'low';
    } else if (qtc < 460) {
      interpretation = 'QTc limite';
      riskLevel = 'borderline';
    } else if (qtc < 500) {
      interpretation = 'QTc prolongé';
      riskLevel = 'moderate';
    } else {
      interpretation = 'QTc sévèrement prolongé - Risque de torsades de pointes';
      riskLevel = 'high';
    }

    return c.json({
      success: true,
      data: {
        qtc: Math.round(qtc),
        unit: 'ms',
        formula,
        interpretation,
        riskLevel,
        recommendations: qtc >= 500 ? [
          'Revoir médicaments allongeant le QT',
          'Corriger hypokaliémie/hypomagnésémie',
          'ECG de surveillance',
          'Considérer hospitalisation si symptomatique'
        ] : []
      }
    });
  }
);

export default cdssRoutes;
