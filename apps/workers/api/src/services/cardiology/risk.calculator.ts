/**
 * Cardiology Risk Calculator Service
 * Calculates cardiovascular risk scores
 *
 * Implements:
 * - CAC Score (Coronary Artery Calcium) interpretation
 * - Framingham Risk Score (FRS)
 * - ASCVD 10-year Risk (Pooled Cohort Equations)
 * - HEART Score (for chest pain)
 * - CHA2DS2-VASc Score (for atrial fibrillation)
 * - HAS-BLED Score (bleeding risk)
 * - TIMI Risk Score
 * - GRACE Score
 */

import { logger } from '../../utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface PatientDemographics {
  age: number;
  sex: 'male' | 'female';
  race?: 'white' | 'african_american' | 'hispanic' | 'asian' | 'other';
}

export interface LipidProfile {
  totalCholesterol: number;      // mg/dL
  hdlCholesterol: number;        // mg/dL
  ldlCholesterol?: number;       // mg/dL
  triglycerides?: number;        // mg/dL
}

export interface CardiovascularRiskFactors {
  systolicBP: number;            // mmHg
  diastolicBP?: number;          // mmHg
  onBPMedication: boolean;
  diabetic: boolean;
  smoker: boolean;
  familyHistoryCAD?: boolean;    // First-degree relative with premature CAD
  chronicKidneyDisease?: boolean;
}

export interface CACScoreInput {
  agatstonScore: number;
  volumeScore?: number;
  massScore?: number;
  percentile?: number;
}

export interface HEARTScoreInput {
  history: 0 | 1 | 2;            // Slightly suspicious=0, Moderately=1, Highly=2
  ecg: 0 | 1 | 2;                // Normal=0, Non-specific=1, Significant ST deviation=2
  age: 0 | 1 | 2;                // <45=0, 45-64=1, ≥65=2
  riskFactors: 0 | 1 | 2;        // None=0, 1-2=1, ≥3 or known CAD=2
  troponin: 0 | 1 | 2;           // Normal=0, 1-3x normal=1, >3x normal=2
}

export interface CHADSVASCInput {
  age: number;
  sex: 'male' | 'female';
  congestiveHeartFailure: boolean;
  hypertension: boolean;
  strokeTIAHistory: boolean;
  vascularDisease: boolean;      // MI, PAD, aortic plaque
  diabetes: boolean;
}

export interface HASBLEDInput {
  hypertension: boolean;         // SBP >160 mmHg
  renalDisease: boolean;         // Dialysis, transplant, Cr >2.26 mg/dL
  liverDisease: boolean;         // Cirrhosis, bilirubin >2x normal, AST/ALT >3x
  strokeHistory: boolean;
  bleedingHistory: boolean;
  labilINR: boolean;             // <60% time in therapeutic range
  elderly: boolean;              // Age >65
  drugsAlcohol: boolean;         // NSAIDs, antiplatelets, >8 drinks/week
}

export interface TIMIRiskInput {
  age65OrOlder: boolean;
  atLeast3CADRiskFactors: boolean;
  knownCAD50Stenosis: boolean;
  aspirinUseLast7Days: boolean;
  severeAnginaLast24h: boolean;
  stDeviations05mm: boolean;
  elevatedCardiacMarkers: boolean;
}

export interface GRACEScoreInput {
  age: number;
  heartRate: number;
  systolicBP: number;
  creatinine: number;            // mg/dL
  killipClass: 1 | 2 | 3 | 4;
  cardiacArrest: boolean;
  stDeviation: boolean;
  elevatedCardiacMarkers: boolean;
}

export interface RiskScoreResult {
  scoreName: string;
  scoreValue: number;
  interpretation: string;
  riskLevel: 'very_low' | 'low' | 'intermediate' | 'high' | 'very_high';
  riskPercentage?: number;
  recommendations: string[];
  clinicalNotes: string[];
}

// ============================================================================
// CAC Score Calculator
// ============================================================================

export class CACScoreCalculator {
  /**
   * Interpret CAC Agatston Score
   * Based on Multi-Ethnic Study of Atherosclerosis (MESA)
   */
  static interpret(
    input: CACScoreInput,
    demographics: PatientDemographics
  ): RiskScoreResult {
    const score = input.agatstonScore;
    let interpretation: string;
    let riskLevel: RiskScoreResult['riskLevel'];
    let riskPercentage: number;
    const recommendations: string[] = [];
    const clinicalNotes: string[] = [];

    // CAC Score Categories (Agatston)
    if (score === 0) {
      interpretation = 'Absence de calcification coronaire';
      riskLevel = 'very_low';
      riskPercentage = 1.1; // 10-year MACE risk
      recommendations.push(
        'Risque cardiovasculaire très faible',
        'Poursuivre mesures hygiéno-diététiques',
        'Contrôle standard des facteurs de risque',
        'Pas de traitement par statine recommandé si LDL normal'
      );
    } else if (score >= 1 && score <= 10) {
      interpretation = 'Calcification coronaire minime';
      riskLevel = 'low';
      riskPercentage = 4.1;
      recommendations.push(
        'Athérosclérose débutante détectée',
        'Optimiser contrôle des facteurs de risque',
        'Considérer statine si facteurs de risque associés',
        'Suivi régulier recommandé'
      );
    } else if (score >= 11 && score <= 100) {
      interpretation = 'Calcification coronaire légère';
      riskLevel = 'low';
      riskPercentage = 6.4;
      recommendations.push(
        'Plaque athéroscléreuse confirmée',
        'Statine modérée recommandée',
        'Objectif LDL-C < 1.0 g/L',
        'Aspirine à considérer si bénéfice > risque hémorragique'
      );
    } else if (score >= 101 && score <= 400) {
      interpretation = 'Calcification coronaire modérée';
      riskLevel = 'intermediate';
      riskPercentage = 11.3;
      recommendations.push(
        'Athérosclérose significative',
        'Statine haute intensité recommandée',
        'Objectif LDL-C < 0.7 g/L',
        'Aspirine faible dose recommandée',
        'Considérer épreuve d\'effort ou imagerie de stress'
      );
    } else if (score > 400 && score <= 1000) {
      interpretation = 'Calcification coronaire sévère';
      riskLevel = 'high';
      riskPercentage = 19.5;
      recommendations.push(
        'Athérosclérose avancée',
        'Statine haute intensité + ézétimibe si nécessaire',
        'Objectif LDL-C < 0.55 g/L',
        'Aspirine faible dose',
        'Imagerie de stress ou coronarographie à considérer',
        'Évaluation cardiologique approfondie'
      );
    } else {
      interpretation = 'Calcification coronaire très sévère';
      riskLevel = 'very_high';
      riskPercentage = 25.8;
      recommendations.push(
        'Athérosclérose très avancée',
        'Traitement intensif obligatoire',
        'Statine + ézétimibe ± iPCSK9',
        'Objectif LDL-C < 0.55 g/L (-50% du baseline)',
        'Coronarographie à considérer fortement',
        'Recherche d\'ischémie myocardique',
        'Suivi cardiologique régulier'
      );
    }

    // Add percentile context if available
    if (input.percentile !== undefined) {
      if (input.percentile >= 75) {
        clinicalNotes.push(
          `Percentile ${input.percentile}% pour âge/sexe - risque supérieur à la moyenne`
        );
        if (riskLevel === 'low') riskLevel = 'intermediate';
      } else if (input.percentile <= 25) {
        clinicalNotes.push(
          `Percentile ${input.percentile}% pour âge/sexe - favorable`
        );
      }
    }

    // Age-specific notes
    if (demographics.age < 45 && score > 0) {
      clinicalNotes.push(
        'CAC positif avant 45 ans - athérosclérose précoce, bilan lipidique génétique à considérer'
      );
    }

    if (demographics.age > 75 && score === 0) {
      clinicalNotes.push(
        'CAC nul après 75 ans - excellent pronostic cardiovasculaire'
      );
    }

    return {
      scoreName: 'CAC Agatston Score',
      scoreValue: score,
      interpretation,
      riskLevel,
      riskPercentage,
      recommendations,
      clinicalNotes,
    };
  }

  /**
   * Get expected CAC percentile based on MESA data
   */
  static getExpectedPercentile(
    score: number,
    age: number,
    sex: 'male' | 'female',
    race: 'white' | 'african_american' | 'hispanic' | 'asian' = 'white'
  ): number {
    // Simplified percentile estimation based on MESA reference values
    // Real implementation would use lookup tables

    // Age and sex adjustment factors
    let ageFactor = (age - 45) / 10;
    let sexFactor = sex === 'male' ? 1.3 : 1.0;

    // Race adjustment
    let raceFactor = 1.0;
    if (race === 'african_american') raceFactor = 0.8;
    if (race === 'hispanic') raceFactor = 0.85;
    if (race === 'asian') raceFactor = 0.75;

    // Expected median score for age/sex/race
    const medianExpected = Math.exp(0.1 * ageFactor) * 50 * sexFactor * raceFactor;

    if (score === 0) return 0;

    // Percentile estimation (simplified log-normal distribution)
    const ratio = score / medianExpected;
    const percentile = 50 + 30 * Math.log(ratio);

    return Math.max(0, Math.min(100, Math.round(percentile)));
  }
}

// ============================================================================
// ASCVD Risk Calculator (Pooled Cohort Equations)
// ============================================================================

export class ASCVDCalculator {
  /**
   * Calculate 10-year ASCVD risk using Pooled Cohort Equations
   * ACC/AHA 2013 Guidelines
   */
  static calculate(
    demographics: PatientDemographics,
    lipids: LipidProfile,
    riskFactors: CardiovascularRiskFactors
  ): RiskScoreResult {
    const { age, sex, race } = demographics;
    const { totalCholesterol, hdlCholesterol } = lipids;
    const { systolicBP, onBPMedication, diabetic, smoker } = riskFactors;

    // Validate inputs
    if (age < 40 || age > 79) {
      return {
        scoreName: 'ASCVD 10-Year Risk',
        scoreValue: -1,
        interpretation: 'Âge hors limites (40-79 ans requis)',
        riskLevel: 'low',
        recommendations: ['Calcul non applicable pour cet âge'],
        clinicalNotes: [],
      };
    }

    let riskPercentage: number;

    // Coefficients for Pooled Cohort Equations
    if (sex === 'female') {
      if (race === 'african_american') {
        riskPercentage = this.calculateFemaleAA(
          age, totalCholesterol, hdlCholesterol, systolicBP, onBPMedication, diabetic, smoker
        );
      } else {
        riskPercentage = this.calculateFemaleWhite(
          age, totalCholesterol, hdlCholesterol, systolicBP, onBPMedication, diabetic, smoker
        );
      }
    } else {
      if (race === 'african_american') {
        riskPercentage = this.calculateMaleAA(
          age, totalCholesterol, hdlCholesterol, systolicBP, onBPMedication, diabetic, smoker
        );
      } else {
        riskPercentage = this.calculateMaleWhite(
          age, totalCholesterol, hdlCholesterol, systolicBP, onBPMedication, diabetic, smoker
        );
      }
    }

    // Cap at 100%
    riskPercentage = Math.min(100, Math.max(0, riskPercentage));

    // Determine risk level and recommendations
    let riskLevel: RiskScoreResult['riskLevel'];
    let interpretation: string;
    const recommendations: string[] = [];
    const clinicalNotes: string[] = [];

    if (riskPercentage < 5) {
      riskLevel = 'low';
      interpretation = 'Risque ASCVD faible à 10 ans';
      recommendations.push(
        'Mesures hygiéno-diététiques recommandées',
        'Pas d\'indication systématique de statine',
        'Réévaluation dans 4-6 ans'
      );
    } else if (riskPercentage < 7.5) {
      riskLevel = 'intermediate';
      interpretation = 'Risque ASCVD limite à 10 ans';
      recommendations.push(
        'Discussion patient-médecin sur bénéfice/risque statine',
        'Considérer score CAC pour affiner le risque',
        'Optimisation des facteurs de risque modifiables'
      );
    } else if (riskPercentage < 20) {
      riskLevel = 'intermediate';
      interpretation = 'Risque ASCVD intermédiaire à 10 ans';
      recommendations.push(
        'Statine d\'intensité modérée recommandée',
        'Objectif LDL-C < 1.0 g/L',
        'Score CAC peut guider l\'intensité du traitement',
        'Contrôle tensionnel optimal'
      );
    } else {
      riskLevel = 'high';
      interpretation = 'Risque ASCVD élevé à 10 ans';
      recommendations.push(
        'Statine haute intensité recommandée',
        'Objectif LDL-C < 0.7 g/L (< 0.55 g/L si très haut risque)',
        'Aspirine à considérer si bénéfice > risque hémorragique',
        'Contrôle strict de tous les facteurs de risque'
      );
    }

    // Risk enhancers (ACC/AHA 2018)
    if (riskFactors.familyHistoryCAD) {
      clinicalNotes.push('Histoire familiale de maladie coronaire précoce - facteur aggravant');
    }
    if (riskFactors.chronicKidneyDisease) {
      clinicalNotes.push('Insuffisance rénale chronique - risque majoré');
    }
    if (lipids.triglycerides && lipids.triglycerides > 175) {
      clinicalNotes.push('Hypertriglycéridémie - syndrome métabolique probable');
    }

    return {
      scoreName: 'ASCVD 10-Year Risk (PCE)',
      scoreValue: Math.round(riskPercentage * 10) / 10,
      interpretation,
      riskLevel,
      riskPercentage,
      recommendations,
      clinicalNotes,
    };
  }

  private static calculateMaleWhite(
    age: number, tc: number, hdl: number, sbp: number,
    onBPMed: boolean, diabetes: boolean, smoker: boolean
  ): number {
    const lnAge = Math.log(age);
    const lnTC = Math.log(tc);
    const lnHDL = Math.log(hdl);
    const lnSBP = Math.log(sbp);

    const treated = onBPMed ? 1 : 0;
    const untreated = onBPMed ? 0 : 1;

    const sum =
      12.344 * lnAge +
      11.853 * lnTC +
      -2.664 * lnAge * lnTC +
      -7.990 * lnHDL +
      1.769 * lnAge * lnHDL +
      1.797 * lnSBP * treated +
      1.764 * lnSBP * untreated +
      7.837 * (smoker ? 1 : 0) +
      -1.795 * lnAge * (smoker ? 1 : 0) +
      0.658 * (diabetes ? 1 : 0);

    const baseline = 0.9144;
    const mean = 61.18;

    return (1 - Math.pow(baseline, Math.exp(sum - mean))) * 100;
  }

  private static calculateFemaleWhite(
    age: number, tc: number, hdl: number, sbp: number,
    onBPMed: boolean, diabetes: boolean, smoker: boolean
  ): number {
    const lnAge = Math.log(age);
    const lnTC = Math.log(tc);
    const lnHDL = Math.log(hdl);
    const lnSBP = Math.log(sbp);

    const treated = onBPMed ? 1 : 0;
    const untreated = onBPMed ? 0 : 1;

    const sum =
      -29.799 * lnAge +
      4.884 * lnAge * lnAge +
      13.540 * lnTC +
      -3.114 * lnAge * lnTC +
      -13.578 * lnHDL +
      3.149 * lnAge * lnHDL +
      2.019 * lnSBP * treated +
      1.957 * lnSBP * untreated +
      7.574 * (smoker ? 1 : 0) +
      -1.665 * lnAge * (smoker ? 1 : 0) +
      0.661 * (diabetes ? 1 : 0);

    const baseline = 0.9665;
    const mean = -29.18;

    return (1 - Math.pow(baseline, Math.exp(sum - mean))) * 100;
  }

  private static calculateMaleAA(
    age: number, tc: number, hdl: number, sbp: number,
    onBPMed: boolean, diabetes: boolean, smoker: boolean
  ): number {
    const lnAge = Math.log(age);
    const lnTC = Math.log(tc);
    const lnHDL = Math.log(hdl);
    const lnSBP = Math.log(sbp);

    const treated = onBPMed ? 1 : 0;
    const untreated = onBPMed ? 0 : 1;

    const sum =
      2.469 * lnAge +
      0.302 * lnTC +
      -0.307 * lnHDL +
      1.916 * lnSBP * treated +
      1.809 * lnSBP * untreated +
      0.549 * (smoker ? 1 : 0) +
      0.645 * (diabetes ? 1 : 0);

    const baseline = 0.8954;
    const mean = 19.54;

    return (1 - Math.pow(baseline, Math.exp(sum - mean))) * 100;
  }

  private static calculateFemaleAA(
    age: number, tc: number, hdl: number, sbp: number,
    onBPMed: boolean, diabetes: boolean, smoker: boolean
  ): number {
    const lnAge = Math.log(age);
    const lnTC = Math.log(tc);
    const lnHDL = Math.log(hdl);
    const lnSBP = Math.log(sbp);

    const treated = onBPMed ? 1 : 0;
    const untreated = onBPMed ? 0 : 1;

    const sum =
      17.114 * lnAge +
      0.940 * lnTC +
      -18.920 * lnHDL +
      4.475 * lnAge * lnHDL +
      29.291 * lnSBP * treated +
      -6.432 * lnAge * lnSBP * treated +
      27.820 * lnSBP * untreated +
      -6.087 * lnAge * lnSBP * untreated +
      0.691 * (smoker ? 1 : 0) +
      0.874 * (diabetes ? 1 : 0);

    const baseline = 0.9533;
    const mean = 86.61;

    return (1 - Math.pow(baseline, Math.exp(sum - mean))) * 100;
  }
}

// ============================================================================
// HEART Score Calculator
// ============================================================================

export class HEARTScoreCalculator {
  /**
   * Calculate HEART Score for chest pain risk stratification
   */
  static calculate(input: HEARTScoreInput): RiskScoreResult {
    const score = input.history + input.ecg + input.age + input.riskFactors + input.troponin;

    let riskLevel: RiskScoreResult['riskLevel'];
    let interpretation: string;
    let riskPercentage: number;
    const recommendations: string[] = [];

    if (score <= 3) {
      riskLevel = 'low';
      interpretation = 'Risque faible de MACE (Major Adverse Cardiac Events)';
      riskPercentage = 1.7;
      recommendations.push(
        'Risque de MACE à 6 semaines: 1-2%',
        'Sortie précoce des urgences envisageable',
        'Suivi ambulatoire recommandé',
        'Éducation aux symptômes d\'alarme'
      );
    } else if (score <= 6) {
      riskLevel = 'intermediate';
      interpretation = 'Risque intermédiaire de MACE';
      riskPercentage = 16.6;
      recommendations.push(
        'Risque de MACE à 6 semaines: 12-21%',
        'Observation hospitalière recommandée',
        'Exploration non invasive à réaliser',
        'Dosages répétés de troponine',
        'Considérer coronarographie si tests positifs'
      );
    } else {
      riskLevel = 'high';
      interpretation = 'Risque élevé de MACE';
      riskPercentage = 50.0;
      recommendations.push(
        'Risque de MACE à 6 semaines: >50%',
        'Hospitalisation obligatoire',
        'Coronarographie précoce à considérer',
        'Traitement antithrombotique intensif',
        'Surveillance en unité de soins intensifs'
      );
    }

    return {
      scoreName: 'HEART Score',
      scoreValue: score,
      interpretation,
      riskLevel,
      riskPercentage,
      recommendations,
      clinicalNotes: [
        `H (History): ${input.history}`,
        `E (ECG): ${input.ecg}`,
        `A (Age): ${input.age}`,
        `R (Risk factors): ${input.riskFactors}`,
        `T (Troponin): ${input.troponin}`,
      ],
    };
  }
}

// ============================================================================
// CHA2DS2-VASc Score Calculator
// ============================================================================

export class CHADSVASCCalculator {
  /**
   * Calculate CHA2DS2-VASc Score for stroke risk in atrial fibrillation
   */
  static calculate(input: CHADSVASCInput): RiskScoreResult {
    let score = 0;

    // Congestive heart failure: +1
    if (input.congestiveHeartFailure) score += 1;

    // Hypertension: +1
    if (input.hypertension) score += 1;

    // Age ≥75: +2, 65-74: +1
    if (input.age >= 75) score += 2;
    else if (input.age >= 65) score += 1;

    // Diabetes: +1
    if (input.diabetes) score += 1;

    // Stroke/TIA history: +2
    if (input.strokeTIAHistory) score += 2;

    // Vascular disease: +1
    if (input.vascularDisease) score += 1;

    // Sex category (female): +1
    if (input.sex === 'female') score += 1;

    // Risk stratification
    let riskLevel: RiskScoreResult['riskLevel'];
    let interpretation: string;
    let riskPercentage: number;
    const recommendations: string[] = [];
    const clinicalNotes: string[] = [];

    // Annual stroke risk
    const strokeRiskByScore: Record<number, number> = {
      0: 0.0, 1: 1.3, 2: 2.2, 3: 3.2, 4: 4.0,
      5: 6.7, 6: 9.8, 7: 9.6, 8: 6.7, 9: 15.2,
    };
    riskPercentage = strokeRiskByScore[Math.min(score, 9)] || 15.2;

    if (score === 0) {
      riskLevel = 'low';
      interpretation = 'Risque thromboembolique faible';
      recommendations.push(
        'Anticoagulation non recommandée (homme)',
        'Aspirine seule non recommandée',
        'Réévaluer périodiquement le score'
      );
    } else if (score === 1) {
      riskLevel = 'low';
      interpretation = 'Risque thromboembolique faible-modéré';
      if (input.sex === 'female') {
        recommendations.push(
          'Score 1 chez femme = facteur unique (sexe)',
          'Anticoagulation non systématique',
          'Évaluer autres facteurs de risque'
        );
      } else {
        recommendations.push(
          'Anticoagulation à considérer',
          'Discussion bénéfice/risque avec patient',
          'AOD préféré aux AVK si anticoagulation'
        );
      }
    } else {
      riskLevel = score >= 4 ? 'high' : 'intermediate';
      interpretation = `Risque thromboembolique ${score >= 4 ? 'élevé' : 'modéré'}`;
      recommendations.push(
        'Anticoagulation recommandée',
        'AOD (Anticoagulants Oraux Directs) en première intention',
        'AVK si valve mécanique ou RM modéré-sévère',
        'Évaluer risque hémorragique (HAS-BLED)'
      );
    }

    // Score breakdown
    if (input.congestiveHeartFailure) clinicalNotes.push('C: Insuffisance cardiaque (+1)');
    if (input.hypertension) clinicalNotes.push('H: Hypertension (+1)');
    if (input.age >= 75) clinicalNotes.push('A2: Âge ≥75 (+2)');
    else if (input.age >= 65) clinicalNotes.push('A: Âge 65-74 (+1)');
    if (input.diabetes) clinicalNotes.push('D: Diabète (+1)');
    if (input.strokeTIAHistory) clinicalNotes.push('S2: AVC/AIT (+2)');
    if (input.vascularDisease) clinicalNotes.push('V: Maladie vasculaire (+1)');
    if (input.sex === 'female') clinicalNotes.push('Sc: Sexe féminin (+1)');

    return {
      scoreName: 'CHA2DS2-VASc',
      scoreValue: score,
      interpretation,
      riskLevel,
      riskPercentage,
      recommendations,
      clinicalNotes,
    };
  }
}

// ============================================================================
// HAS-BLED Score Calculator
// ============================================================================

export class HASBLEDCalculator {
  /**
   * Calculate HAS-BLED Score for bleeding risk assessment
   */
  static calculate(input: HASBLEDInput): RiskScoreResult {
    let score = 0;

    if (input.hypertension) score += 1;
    if (input.renalDisease) score += 1;
    if (input.liverDisease) score += 1;
    if (input.strokeHistory) score += 1;
    if (input.bleedingHistory) score += 1;
    if (input.labilINR) score += 1;
    if (input.elderly) score += 1;
    if (input.drugsAlcohol) score += 1; // Can be +2 if both drugs AND alcohol

    let riskLevel: RiskScoreResult['riskLevel'];
    let interpretation: string;
    let riskPercentage: number;
    const recommendations: string[] = [];
    const clinicalNotes: string[] = [];

    // Annual major bleeding risk
    const bleedRiskByScore: Record<number, number> = {
      0: 1.13, 1: 1.02, 2: 1.88, 3: 3.74, 4: 8.70, 5: 12.50,
    };
    riskPercentage = bleedRiskByScore[Math.min(score, 5)] || 12.50;

    if (score <= 2) {
      riskLevel = 'low';
      interpretation = 'Risque hémorragique faible';
      recommendations.push(
        'Anticoagulation sûre si indiquée',
        'Surveillance standard',
        'Éducation patient sur signes de saignement'
      );
    } else {
      riskLevel = score >= 4 ? 'high' : 'intermediate';
      interpretation = `Risque hémorragique ${score >= 4 ? 'élevé' : 'modéré'}`;
      recommendations.push(
        'Ne pas contre-indiquer systématiquement l\'anticoagulation',
        'Identifier et corriger facteurs modifiables',
        'Surveillance rapprochée recommandée',
        'Considérer AOD plutôt que AVK',
        'Éducation renforcée du patient'
      );
    }

    // Score breakdown
    if (input.hypertension) clinicalNotes.push('H: HTA non contrôlée (+1)');
    if (input.renalDisease) clinicalNotes.push('A: Anomalie rénale (+1)');
    if (input.liverDisease) clinicalNotes.push('A: Anomalie hépatique (+1)');
    if (input.strokeHistory) clinicalNotes.push('S: AVC (+1)');
    if (input.bleedingHistory) clinicalNotes.push('B: Saignement antérieur (+1)');
    if (input.labilINR) clinicalNotes.push('L: INR labile (+1)');
    if (input.elderly) clinicalNotes.push('E: Âge >65 ans (+1)');
    if (input.drugsAlcohol) clinicalNotes.push('D: Médicaments/Alcool (+1)');

    return {
      scoreName: 'HAS-BLED',
      scoreValue: score,
      interpretation,
      riskLevel,
      riskPercentage,
      recommendations,
      clinicalNotes,
    };
  }
}

// ============================================================================
// TIMI Risk Score Calculator
// ============================================================================

export class TIMIRiskCalculator {
  /**
   * Calculate TIMI Risk Score for UA/NSTEMI
   */
  static calculate(input: TIMIRiskInput): RiskScoreResult {
    let score = 0;

    if (input.age65OrOlder) score += 1;
    if (input.atLeast3CADRiskFactors) score += 1;
    if (input.knownCAD50Stenosis) score += 1;
    if (input.aspirinUseLast7Days) score += 1;
    if (input.severeAnginaLast24h) score += 1;
    if (input.stDeviations05mm) score += 1;
    if (input.elevatedCardiacMarkers) score += 1;

    // 14-day risk of death, MI, or urgent revascularization
    const riskByScore: Record<number, number> = {
      0: 4.7, 1: 4.7, 2: 8.3, 3: 13.2,
      4: 19.9, 5: 26.2, 6: 40.9, 7: 40.9,
    };
    const riskPercentage = riskByScore[score];

    let riskLevel: RiskScoreResult['riskLevel'];
    let interpretation: string;
    const recommendations: string[] = [];

    if (score <= 2) {
      riskLevel = 'low';
      interpretation = 'Risque TIMI faible';
      recommendations.push(
        'Stratégie conservatrice envisageable',
        'Test de stress avant sortie',
        'Traitement médical optimal'
      );
    } else if (score <= 4) {
      riskLevel = 'intermediate';
      interpretation = 'Risque TIMI intermédiaire';
      recommendations.push(
        'Stratégie invasive précoce à considérer',
        'Coronarographie dans les 24-72h',
        'Traitement antithrombotique intensif'
      );
    } else {
      riskLevel = 'high';
      interpretation = 'Risque TIMI élevé';
      recommendations.push(
        'Stratégie invasive urgente recommandée',
        'Coronarographie dans les 2-24h',
        'Anti-GP IIb/IIIa à considérer',
        'Unité de soins intensifs cardiologiques'
      );
    }

    return {
      scoreName: 'TIMI Risk Score (UA/NSTEMI)',
      scoreValue: score,
      interpretation,
      riskLevel,
      riskPercentage,
      recommendations,
      clinicalNotes: [],
    };
  }
}

// ============================================================================
// GRACE Score Calculator
// ============================================================================

export class GRACEScoreCalculator {
  /**
   * Calculate GRACE Score for ACS mortality risk
   */
  static calculate(input: GRACEScoreInput): RiskScoreResult {
    let score = 0;

    // Age points
    if (input.age < 30) score += 0;
    else if (input.age < 40) score += 8;
    else if (input.age < 50) score += 25;
    else if (input.age < 60) score += 41;
    else if (input.age < 70) score += 58;
    else if (input.age < 80) score += 75;
    else if (input.age < 90) score += 91;
    else score += 100;

    // Heart rate points
    if (input.heartRate < 50) score += 0;
    else if (input.heartRate < 70) score += 3;
    else if (input.heartRate < 90) score += 9;
    else if (input.heartRate < 110) score += 15;
    else if (input.heartRate < 150) score += 24;
    else if (input.heartRate < 200) score += 38;
    else score += 46;

    // Systolic BP points
    if (input.systolicBP < 80) score += 58;
    else if (input.systolicBP < 100) score += 53;
    else if (input.systolicBP < 120) score += 43;
    else if (input.systolicBP < 140) score += 34;
    else if (input.systolicBP < 160) score += 24;
    else if (input.systolicBP < 200) score += 10;
    else score += 0;

    // Creatinine points (mg/dL)
    if (input.creatinine < 0.4) score += 1;
    else if (input.creatinine < 0.8) score += 4;
    else if (input.creatinine < 1.2) score += 7;
    else if (input.creatinine < 1.6) score += 10;
    else if (input.creatinine < 2.0) score += 13;
    else if (input.creatinine < 4.0) score += 21;
    else score += 28;

    // Killip class points
    const killipPoints: Record<number, number> = { 1: 0, 2: 20, 3: 39, 4: 59 };
    score += killipPoints[input.killipClass] || 0;

    // Binary variables
    if (input.cardiacArrest) score += 39;
    if (input.stDeviation) score += 28;
    if (input.elevatedCardiacMarkers) score += 14;

    // In-hospital mortality estimation
    let riskPercentage: number;
    if (score <= 108) riskPercentage = 1;
    else if (score <= 118) riskPercentage = 2;
    else if (score <= 127) riskPercentage = 3;
    else if (score <= 140) riskPercentage = 5;
    else if (score <= 154) riskPercentage = 8;
    else if (score <= 168) riskPercentage = 13;
    else if (score <= 182) riskPercentage = 20;
    else if (score <= 196) riskPercentage = 30;
    else riskPercentage = 50;

    let riskLevel: RiskScoreResult['riskLevel'];
    let interpretation: string;
    const recommendations: string[] = [];

    if (score <= 108) {
      riskLevel = 'low';
      interpretation = 'Risque GRACE faible';
      recommendations.push(
        'Mortalité hospitalière estimée <1%',
        'Stratification non invasive acceptable',
        'Sortie précoce si tests négatifs'
      );
    } else if (score <= 140) {
      riskLevel = 'intermediate';
      interpretation = 'Risque GRACE intermédiaire';
      recommendations.push(
        'Mortalité hospitalière 1-3%',
        'Stratégie invasive dans les 72h',
        'Surveillance en unité de cardiologie'
      );
    } else {
      riskLevel = 'high';
      interpretation = 'Risque GRACE élevé';
      recommendations.push(
        `Mortalité hospitalière estimée: ${riskPercentage}%`,
        'Stratégie invasive urgente (<24h)',
        'Soins intensifs cardiologiques',
        'Support hémodynamique si nécessaire'
      );
    }

    return {
      scoreName: 'GRACE Score',
      scoreValue: score,
      interpretation,
      riskLevel,
      riskPercentage,
      recommendations,
      clinicalNotes: [
        `Killip class: ${input.killipClass}`,
        input.cardiacArrest ? 'Arrêt cardiaque: Oui' : '',
        input.stDeviation ? 'Déviation ST: Oui' : '',
        input.elevatedCardiacMarkers ? 'Marqueurs élevés: Oui' : '',
      ].filter(Boolean),
    };
  }
}

// ============================================================================
// Main Calculator Export
// ============================================================================

export class CardiologyRiskCalculator {
  static CAC = CACScoreCalculator;
  static ASCVD = ASCVDCalculator;
  static HEART = HEARTScoreCalculator;
  static CHADSVASC = CHADSVASCCalculator;
  static HASBLED = HASBLEDCalculator;
  static TIMI = TIMIRiskCalculator;
  static GRACE = GRACEScoreCalculator;

  /**
   * Calculate all applicable scores for a patient
   */
  static calculateComprehensive(
    demographics: PatientDemographics,
    lipids?: LipidProfile,
    riskFactors?: CardiovascularRiskFactors,
    cacScore?: CACScoreInput
  ): {
    ascvd?: RiskScoreResult;
    cac?: RiskScoreResult;
    summary: string[];
  } {
    const results: {
      ascvd?: RiskScoreResult;
      cac?: RiskScoreResult;
      summary: string[];
    } = { summary: [] };

    // Calculate ASCVD if we have all required data
    if (lipids && riskFactors) {
      results.ascvd = this.ASCVD.calculate(demographics, lipids, riskFactors);
      results.summary.push(
        `Risque ASCVD 10 ans: ${results.ascvd.scoreValue}% (${results.ascvd.interpretation})`
      );
    }

    // Interpret CAC score if provided
    if (cacScore) {
      results.cac = this.CAC.interpret(cacScore, demographics);
      results.summary.push(
        `Score CAC: ${results.cac.scoreValue} (${results.cac.interpretation})`
      );

      // CAC can modify ASCVD risk categorization
      if (results.ascvd && cacScore.agatstonScore === 0) {
        results.summary.push(
          'CAC = 0 peut justifier de différer statine si risque intermédiaire'
        );
      } else if (results.ascvd && cacScore.agatstonScore >= 100) {
        results.summary.push(
          'CAC ≥100 renforce indication de statine haute intensité'
        );
      }
    }

    return results;
  }
}

export default CardiologyRiskCalculator;
