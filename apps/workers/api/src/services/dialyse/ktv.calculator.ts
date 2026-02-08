/**
 * Kt/V Calculator Service
 * Clinical calculations for dialysis adequacy assessment
 *
 * Implements:
 * - Single-pool Kt/V (spKt/V) - Daugirdas II formula
 * - Equilibrated Kt/V (eKt/V)
 * - URR (Urea Reduction Ratio)
 * - nPCR (Normalized Protein Catabolic Rate)
 * - stdKt/V for peritoneal dialysis
 */

import { logger } from '../../utils/logger';

// ============================================================================
// Types
// ============================================================================

export interface KtVInput {
  /** Pre-dialysis BUN (mg/dL) */
  preDialysisBUN: number;
  /** Post-dialysis BUN (mg/dL) */
  postDialysisBUN: number;
  /** Session duration in minutes */
  sessionDuration: number;
  /** Ultrafiltration volume in liters */
  ultrafiltrationVolume: number;
  /** Post-dialysis weight in kg */
  postDialysisWeight: number;
  /** Pre-dialysis weight in kg (optional, calculated from post + UF) */
  preDialysisWeight?: number;
}

export interface KtVResult {
  /** Single-pool Kt/V (Daugirdas II) */
  spKtV: number;
  /** Equilibrated Kt/V */
  eKtV: number;
  /** Urea Reduction Ratio (%) */
  urr: number;
  /** Adequacy status */
  adequacy: 'adequate' | 'borderline' | 'inadequate';
  /** Target achieved */
  targetAchieved: boolean;
  /** Recommendations */
  recommendations: string[];
  /** Calculation details */
  details: {
    ureaDistributionVolume: number;
    clearance: number;
    sessionHours: number;
  };
}

export interface NPCRInput {
  /** Pre-dialysis BUN (mg/dL) */
  preDialysisBUN: number;
  /** Post-dialysis BUN from previous session (mg/dL) */
  previousPostBUN: number;
  /** Time between sessions in hours */
  interdialyticInterval: number;
  /** Patient weight in kg */
  weight: number;
  /** Kt/V value */
  ktv: number;
}

export interface NPCRResult {
  /** Normalized Protein Catabolic Rate (g/kg/day) */
  npcr: number;
  /** Status */
  status: 'low' | 'normal' | 'high';
  /** Dietary recommendation */
  recommendation: string;
}

export interface StdKtVInput {
  /** Weekly Kt/V values */
  weeklyKtV: number[];
  /** Session durations in hours */
  sessionDurations: number[];
  /** Urea distribution volume in liters */
  ureaVolume: number;
}

// ============================================================================
// Constants
// ============================================================================

const KTV_TARGETS = {
  /** Minimum acceptable spKt/V for HD */
  minimumSpKtV: 1.2,
  /** Target spKt/V for HD */
  targetSpKtV: 1.4,
  /** Minimum URR (%) */
  minimumURR: 65,
  /** Target URR (%) */
  targetURR: 70,
  /** Minimum stdKt/V for PD */
  minimumStdKtV: 1.7,
};

const NPCR_TARGETS = {
  /** Low protein intake threshold */
  low: 0.8,
  /** High protein intake threshold */
  high: 1.4,
  /** Recommended range */
  recommended: { min: 1.0, max: 1.2 },
};

// ============================================================================
// Kt/V Calculator Service
// ============================================================================

export class KtVCalculatorService {
  /**
   * Calculate Kt/V and related dialysis adequacy metrics
   */
  calculate(input: KtVInput): KtVResult {
    // Validate input
    this.validateInput(input);

    const {
      preDialysisBUN,
      postDialysisBUN,
      sessionDuration,
      ultrafiltrationVolume,
      postDialysisWeight,
    } = input;

    // Calculate pre-dialysis weight if not provided
    const preDialysisWeight = input.preDialysisWeight || (postDialysisWeight + ultrafiltrationVolume);

    // Calculate URR
    const urr = this.calculateURR(preDialysisBUN, postDialysisBUN);

    // Calculate session time in hours
    const sessionHours = sessionDuration / 60;

    // Calculate R (BUN ratio)
    const R = postDialysisBUN / preDialysisBUN;

    // Calculate spKt/V using Daugirdas II formula
    // spKt/V = -ln(R - 0.008*t) + (4 - 3.5*R) * UF/W
    // where t = session time in hours, UF = ultrafiltration in L, W = post-dialysis weight in kg
    const spKtV = -Math.log(R - 0.008 * sessionHours) +
      (4 - 3.5 * R) * (ultrafiltrationVolume / postDialysisWeight);

    // Calculate eKt/V (equilibrated Kt/V)
    // eKt/V = spKt/V - 0.6 * spKt/V / t + 0.03
    const eKtV = spKtV - (0.6 * spKtV / sessionHours) + 0.03;

    // Estimate urea distribution volume (Watson formula approximation)
    // For simplicity, using 0.58 * body weight for males, 0.55 for females
    // In production, should use actual gender and height
    const ureaDistributionVolume = 0.58 * postDialysisWeight;

    // Estimate clearance (K = Kt/V * V / t)
    const clearance = (spKtV * ureaDistributionVolume) / sessionHours;

    // Determine adequacy
    const adequacy = this.assessAdequacy(spKtV, urr);
    const targetAchieved = spKtV >= KTV_TARGETS.targetSpKtV && urr >= KTV_TARGETS.targetURR;

    // Generate recommendations
    const recommendations = this.generateRecommendations(spKtV, urr, sessionDuration, ultrafiltrationVolume);

    const result: KtVResult = {
      spKtV: Math.round(spKtV * 100) / 100,
      eKtV: Math.round(eKtV * 100) / 100,
      urr: Math.round(urr * 10) / 10,
      adequacy,
      targetAchieved,
      recommendations,
      details: {
        ureaDistributionVolume: Math.round(ureaDistributionVolume * 10) / 10,
        clearance: Math.round(clearance),
        sessionHours: Math.round(sessionHours * 10) / 10,
      },
    };

    logger.info('Kt/V calculation completed', {
      spKtV: result.spKtV,
      urr: result.urr,
      adequacy: result.adequacy,
    });

    return result;
  }

  /**
   * Calculate URR (Urea Reduction Ratio)
   */
  calculateURR(preBUN: number, postBUN: number): number {
    if (preBUN <= 0) {
      throw new Error('Pre-dialysis BUN must be greater than 0');
    }
    return ((preBUN - postBUN) / preBUN) * 100;
  }

  /**
   * Calculate nPCR (Normalized Protein Catabolic Rate)
   * Estimates protein intake from BUN kinetics
   */
  calculateNPCR(input: NPCRInput): NPCRResult {
    const {
      preDialysisBUN,
      previousPostBUN,
      interdialyticInterval,
      weight,
      ktv,
    } = input;

    // Calculate normalized protein catabolic rate
    // nPCR = 0.22 + (0.36 * G * 24 * 7) / (Kt/V * V)
    // where G = urea generation rate

    // Simplified Gotch formula
    // nPCR = (preBUN - postBUN) / (interdialytic time) * correction factor
    const ureaGeneration = (preDialysisBUN - previousPostBUN) / interdialyticInterval;

    // Convert to protein catabolic rate (g/kg/day)
    // Using simplified relation: nPCR ≈ 0.22 + 0.036 * midweek preBUN
    const npcr = 0.22 + 0.036 * preDialysisBUN * (1 - Math.exp(-ktv));

    // Determine status
    let status: 'low' | 'normal' | 'high';
    let recommendation: string;

    if (npcr < NPCR_TARGETS.low) {
      status = 'low';
      recommendation = 'Apport protéique insuffisant. Augmenter les protéines alimentaires à 1.0-1.2 g/kg/jour. Consulter diététicien(ne).';
    } else if (npcr > NPCR_TARGETS.high) {
      status = 'high';
      recommendation = 'Apport protéique élevé. Surveiller la charge urémique. Ajuster la prescription si nécessaire.';
    } else {
      status = 'normal';
      recommendation = 'Apport protéique adéquat. Maintenir le régime alimentaire actuel.';
    }

    return {
      npcr: Math.round(npcr * 100) / 100,
      status,
      recommendation,
    };
  }

  /**
   * Calculate standard Kt/V for peritoneal dialysis
   * Accounts for continuous nature of PD
   */
  calculateStdKtV(input: StdKtVInput): number {
    const { weeklyKtV, sessionDurations, ureaVolume } = input;

    if (weeklyKtV.length !== sessionDurations.length) {
      throw new Error('Number of Kt/V values must match number of sessions');
    }

    // Standard Kt/V calculation (Gotch)
    // stdKt/V = 10080 * (1 - e^(-eKt/V)) / (t + 10080/(Kru + Kd))
    // Simplified version for weekly stdKt/V

    const totalKtV = weeklyKtV.reduce((sum, ktv) => sum + ktv, 0);
    const totalHours = sessionDurations.reduce((sum, t) => sum + t, 0);
    const sessionsPerWeek = weeklyKtV.length;

    // stdKt/V = (spKt/V per session * sessions/week * correction factor)
    const avgSpKtV = totalKtV / sessionsPerWeek;
    const correctionFactor = 1 - 0.7 / sessionsPerWeek; // Approximation

    const stdKtV = avgSpKtV * sessionsPerWeek * correctionFactor * (168 / (168 - totalHours + totalHours / sessionsPerWeek));

    return Math.round(stdKtV * 100) / 100;
  }

  /**
   * Calculate required session time to achieve target Kt/V
   */
  calculateRequiredTime(
    targetKtV: number,
    clearance: number, // mL/min
    ureaVolume: number // L
  ): number {
    // t = Kt/V * V / K
    // Convert clearance from mL/min to L/hour: K * 60 / 1000
    const clearanceLH = (clearance * 60) / 1000;
    const requiredHours = (targetKtV * ureaVolume) / clearanceLH;

    return Math.round(requiredHours * 60); // Return minutes
  }

  /**
   * Assess dialysis adequacy based on Kt/V and URR
   */
  private assessAdequacy(spKtV: number, urr: number): 'adequate' | 'borderline' | 'inadequate' {
    if (spKtV >= KTV_TARGETS.targetSpKtV && urr >= KTV_TARGETS.targetURR) {
      return 'adequate';
    }

    if (spKtV >= KTV_TARGETS.minimumSpKtV && urr >= KTV_TARGETS.minimumURR) {
      return 'borderline';
    }

    return 'inadequate';
  }

  /**
   * Generate clinical recommendations based on results
   */
  private generateRecommendations(
    spKtV: number,
    urr: number,
    sessionDuration: number,
    ultrafiltrationVolume: number
  ): string[] {
    const recommendations: string[] = [];

    // Kt/V recommendations
    if (spKtV < KTV_TARGETS.minimumSpKtV) {
      recommendations.push(`Kt/V sous le seuil minimum (${KTV_TARGETS.minimumSpKtV}). Action immédiate requise.`);
      recommendations.push('Envisager: augmentation du temps de séance, augmentation du débit sanguin, ou changement de dialyseur.');
    } else if (spKtV < KTV_TARGETS.targetSpKtV) {
      recommendations.push(`Kt/V sous la cible optimale (${KTV_TARGETS.targetSpKtV}). Optimisation recommandée.`);
    }

    // URR recommendations
    if (urr < KTV_TARGETS.minimumURR) {
      recommendations.push(`URR insuffisant (<${KTV_TARGETS.minimumURR}%). Vérifier l'accès vasculaire.`);
    }

    // Session duration
    if (sessionDuration < 240 && spKtV < KTV_TARGETS.targetSpKtV) {
      recommendations.push('Augmenter la durée de séance à minimum 4 heures pourrait améliorer l\'efficacité.');
    }

    // Ultrafiltration
    if (ultrafiltrationVolume > 4) {
      recommendations.push('Volume d\'ultrafiltration élevé (>4L). Surveiller la tolérance hémodynamique.');
    }

    // Good result
    if (spKtV >= KTV_TARGETS.targetSpKtV && urr >= KTV_TARGETS.targetURR) {
      recommendations.push('Dialyse adéquate. Maintenir le protocole actuel.');
    }

    return recommendations;
  }

  /**
   * Validate input parameters
   */
  private validateInput(input: KtVInput): void {
    const errors: string[] = [];

    if (input.preDialysisBUN <= 0 || input.preDialysisBUN > 300) {
      errors.push('Pre-dialysis BUN doit être entre 0 et 300 mg/dL');
    }

    if (input.postDialysisBUN < 0 || input.postDialysisBUN >= input.preDialysisBUN) {
      errors.push('Post-dialysis BUN doit être positif et inférieur au pre-dialysis BUN');
    }

    if (input.sessionDuration < 60 || input.sessionDuration > 600) {
      errors.push('Durée de séance doit être entre 60 et 600 minutes');
    }

    if (input.ultrafiltrationVolume < 0 || input.ultrafiltrationVolume > 10) {
      errors.push('Volume d\'ultrafiltration doit être entre 0 et 10 litres');
    }

    if (input.postDialysisWeight < 20 || input.postDialysisWeight > 250) {
      errors.push('Poids post-dialyse doit être entre 20 et 250 kg');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join('; ')}`);
    }
  }

  /**
   * Get target ranges for reference
   */
  getTargetRanges(): typeof KTV_TARGETS {
    return { ...KTV_TARGETS };
  }

  /**
   * Calculate trending data from historical Kt/V values
   */
  analyzeTrend(
    historicalValues: { date: string; spKtV: number; urr: number }[]
  ): {
    trend: 'improving' | 'stable' | 'declining';
    averageKtV: number;
    averageURR: number;
    percentBelowTarget: number;
    recommendation: string;
  } {
    if (historicalValues.length < 3) {
      throw new Error('At least 3 historical values required for trend analysis');
    }

    // Sort by date
    const sorted = [...historicalValues].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate averages
    const averageKtV = sorted.reduce((sum, v) => sum + v.spKtV, 0) / sorted.length;
    const averageURR = sorted.reduce((sum, v) => sum + v.urr, 0) / sorted.length;

    // Calculate percent below target
    const belowTarget = sorted.filter(v => v.spKtV < KTV_TARGETS.minimumSpKtV).length;
    const percentBelowTarget = (belowTarget / sorted.length) * 100;

    // Determine trend (compare first half to second half)
    const midpoint = Math.floor(sorted.length / 2);
    const firstHalfAvg = sorted.slice(0, midpoint).reduce((sum, v) => sum + v.spKtV, 0) / midpoint;
    const secondHalfAvg = sorted.slice(midpoint).reduce((sum, v) => sum + v.spKtV, 0) / (sorted.length - midpoint);

    let trend: 'improving' | 'stable' | 'declining';
    let recommendation: string;

    const difference = secondHalfAvg - firstHalfAvg;

    if (difference > 0.1) {
      trend = 'improving';
      recommendation = 'Tendance positive. Continuer les ajustements actuels.';
    } else if (difference < -0.1) {
      trend = 'declining';
      recommendation = 'Tendance à la baisse. Réévaluer la prescription de dialyse et l\'accès vasculaire.';
    } else {
      trend = 'stable';
      recommendation = averageKtV >= KTV_TARGETS.targetSpKtV
        ? 'Dialyse stable et adéquate.'
        : 'Dialyse stable mais sous-optimale. Envisager des ajustements.';
    }

    return {
      trend,
      averageKtV: Math.round(averageKtV * 100) / 100,
      averageURR: Math.round(averageURR * 10) / 10,
      percentBelowTarget: Math.round(percentBelowTarget),
      recommendation,
    };
  }
}

// Export singleton instance
export const ktvCalculator = new KtVCalculatorService();
