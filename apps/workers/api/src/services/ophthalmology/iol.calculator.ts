/**
 * IOL Power Calculator Service
 * Calculates intraocular lens power for cataract surgery
 *
 * Implements multiple formulas:
 * - SRK/T (Sanders-Retzlaff-Kraff/Theoretical)
 * - Holladay 1 & 2
 * - Haigis
 * - Barrett Universal II (simplified)
 *
 * Includes post-LASIK/PRK adjustments
 */

import { logger } from '../../utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface BiometryData {
  // Axial Length (mm) - typically 22-26mm
  axialLength: number;

  // Keratometry readings (diopters)
  k1: number;  // Flattest meridian
  k2: number;  // Steepest meridian

  // Anterior Chamber Depth (mm) - typically 2.5-4.0mm
  acd?: number;

  // Lens Thickness (mm) - typically 4-5mm
  lensThickness?: number;

  // White-to-White corneal diameter (mm) - typically 11-13mm
  wtw?: number;

  // Corneal thickness (μm)
  cct?: number;
}

export interface IOLConstants {
  // A-constant for SRK formulas (typically 118-119)
  aConstant: number;

  // Surgeon factor for Holladay 1
  surgeonFactor?: number;

  // Haigis constants (a0, a1, a2)
  haigisA0?: number;
  haigisA1?: number;
  haigisA2?: number;

  // pACD for Holladay 2
  pACD?: number;
}

export interface PatientData {
  // Target refraction (diopters) - typically -0.5 to 0
  targetRefraction: number;

  // Previous refractive surgery?
  postLasik?: boolean;
  postPrk?: boolean;

  // Pre-LASIK/PRK keratometry (if available)
  preLasikK1?: number;
  preLasikK2?: number;

  // Pre-LASIK/PRK refraction
  preLasikRefraction?: number;

  // Current refraction (for post-refractive calculations)
  currentRefraction?: number;
}

export interface IOLCalculationResult {
  // Recommended IOL power
  recommendedPower: number;

  // Expected refraction with recommended power
  expectedRefraction: number;

  // Power options (±0.5D increments)
  powerOptions: {
    power: number;
    expectedRefraction: number;
    deviation: number;
  }[];

  // Formula used
  formula: string;

  // Effective Lens Position used
  elp: number;

  // Warnings or notes
  warnings: string[];

  // Confidence level
  confidence: 'high' | 'medium' | 'low';
}

export interface MultiFormulaResult {
  // Results from each formula
  srkt?: IOLCalculationResult;
  holladay1?: IOLCalculationResult;
  holladay2?: IOLCalculationResult;
  haigis?: IOLCalculationResult;
  barrett?: IOLCalculationResult;

  // Optimized average recommendation
  optimizedRecommendation: {
    power: number;
    expectedRefraction: number;
    agreementScore: number;
    formulas: string[];
  };

  // Clinical recommendations (French)
  recommendations: string[];
}

// ============================================================================
// Constants
// ============================================================================

// Standard IOL constants for common lenses
export const STANDARD_IOL_CONSTANTS: Record<string, IOLConstants> = {
  // Alcon AcrySof
  'SA60AT': { aConstant: 118.7, haigisA0: 1.321, haigisA1: 0.400, haigisA2: 0.100 },
  'SN60WF': { aConstant: 118.7, haigisA0: 1.321, haigisA1: 0.400, haigisA2: 0.100 },
  'MA60MA': { aConstant: 118.9, haigisA0: 1.560, haigisA1: 0.400, haigisA2: 0.100 },

  // J&J Vision (AMO)
  'ZCB00': { aConstant: 119.1, haigisA0: 1.629, haigisA1: 0.400, haigisA2: 0.100 },
  'ZXR00': { aConstant: 119.1, haigisA0: 1.629, haigisA1: 0.400, haigisA2: 0.100 },

  // Bausch & Lomb
  'enVista': { aConstant: 119.1, haigisA0: 1.691, haigisA1: 0.400, haigisA2: 0.100 },
  'LI61AO': { aConstant: 118.0, haigisA0: 0.969, haigisA1: 0.400, haigisA2: 0.100 },

  // Zeiss
  'CT_Lucia': { aConstant: 118.6, haigisA0: 1.243, haigisA1: 0.400, haigisA2: 0.100 },
  'AT_Lisa': { aConstant: 118.6, haigisA0: 1.321, haigisA1: 0.400, haigisA2: 0.100 },

  // Default
  'default': { aConstant: 118.7, haigisA0: 1.321, haigisA1: 0.400, haigisA2: 0.100 },
};

// Refractive indices
const CORNEA_REFRACTIVE_INDEX = 1.3375;
const AQUEOUS_REFRACTIVE_INDEX = 1.336;

// ============================================================================
// IOL Calculator Class
// ============================================================================

export class IOLCalculator {
  private biometry: BiometryData;
  private iolConstants: IOLConstants;
  private patientData: PatientData;

  constructor(
    biometry: BiometryData,
    iolConstants: IOLConstants | string = 'default',
    patientData: PatientData = { targetRefraction: -0.25 }
  ) {
    this.biometry = biometry;
    this.iolConstants = typeof iolConstants === 'string'
      ? STANDARD_IOL_CONSTANTS[iolConstants] || STANDARD_IOL_CONSTANTS['default']
      : iolConstants;
    this.patientData = patientData;
  }

  /**
   * Calculate average keratometry
   */
  private getAverageK(): number {
    return (this.biometry.k1 + this.biometry.k2) / 2;
  }

  /**
   * Get corrected K for post-refractive surgery
   */
  private getCorrectedK(): number {
    const avgK = this.getAverageK();

    if (!this.patientData.postLasik && !this.patientData.postPrk) {
      return avgK;
    }

    // Clinical History Method (most accurate if pre-op data available)
    if (this.patientData.preLasikK1 && this.patientData.preLasikK2 &&
        this.patientData.preLasikRefraction !== undefined &&
        this.patientData.currentRefraction !== undefined) {
      const preOpK = (this.patientData.preLasikK1 + this.patientData.preLasikK2) / 2;
      const refractionChange = this.patientData.preLasikRefraction - this.patientData.currentRefraction;
      return preOpK + (0.7 * refractionChange);
    }

    // Masket Regression Method (approximation)
    // K_corrected = K_measured + (0.47 × correction attempted)
    if (this.patientData.preLasikRefraction !== undefined &&
        this.patientData.currentRefraction !== undefined) {
      const correctionAttempted = Math.abs(this.patientData.preLasikRefraction);
      return avgK + (0.47 * correctionAttempted);
    }

    // Modified Maloney Method (if no history available)
    // Subtract 4.98 from central corneal power, multiply by 1.114
    const centralPower = 337.5 / ((337.5 / avgK) - 0.050);
    return (centralPower - 4.98) * 1.114;
  }

  /**
   * Validate biometry data
   */
  private validateBiometry(): string[] {
    const warnings: string[] = [];

    // Axial length validation
    if (this.biometry.axialLength < 20) {
      warnings.push('Longueur axiale très courte (<20mm) - œil nanophtalme');
    } else if (this.biometry.axialLength < 22) {
      warnings.push('Longueur axiale courte - risque de surprise réfractive');
    } else if (this.biometry.axialLength > 26) {
      warnings.push('Longueur axiale longue - risque de myopisation');
    } else if (this.biometry.axialLength > 28) {
      warnings.push('Longueur axiale très longue (>28mm) - utiliser formules adaptées');
    }

    // Keratometry validation
    const avgK = this.getAverageK();
    if (avgK < 40) {
      warnings.push('Kératométrie plate (<40D) - cornée plate inhabituelle');
    } else if (avgK > 47) {
      warnings.push('Kératométrie cambrée (>47D) - vérifier kératocône');
    }

    // K difference (astigmatism)
    const kDiff = Math.abs(this.biometry.k1 - this.biometry.k2);
    if (kDiff > 2) {
      warnings.push(`Astigmatisme cornéen significatif (${kDiff.toFixed(2)}D) - envisager IOL torique`);
    }

    // ACD validation
    if (this.biometry.acd) {
      if (this.biometry.acd < 2.5) {
        warnings.push('Chambre antérieure étroite - risque bloc pupillaire');
      } else if (this.biometry.acd > 4.0) {
        warnings.push('Chambre antérieure profonde - vérifier mesure');
      }
    }

    // Post-refractive surgery warning
    if (this.patientData.postLasik || this.patientData.postPrk) {
      warnings.push('Post-chirurgie réfractive - utiliser kératométrie corrigée');
      if (!this.patientData.preLasikK1) {
        warnings.push('Données pré-LASIK manquantes - précision réduite');
      }
    }

    return warnings;
  }

  /**
   * SRK/T Formula (Sanders-Retzlaff-Kraff/Theoretical)
   * Most widely used formula, good for average eyes
   */
  calculateSRKT(): IOLCalculationResult {
    const AL = this.biometry.axialLength;
    const K = this.getCorrectedK();
    const A = this.iolConstants.aConstant;
    const target = this.patientData.targetRefraction;
    const warnings = this.validateBiometry();

    // Corneal radius in mm
    const r = 337.5 / K;

    // Corneal width factor (estimated from AL if WTW not available)
    const Cw = this.biometry.wtw || (0.0836 * AL + 9.416);

    // Corneal height
    const H = r - Math.sqrt(r * r - (Cw * Cw / 4));

    // Offset
    const offset = (0.62467 * A) - 68.74709;

    // A-constant to ACD
    const ACDconst = 0.62467 * A - 68.74709;

    // Estimated corneal refractive power
    const Kd = K;

    // Retinal thickness
    const Rethick = 0.65696 - 0.02029 * AL;

    // Optical axial length
    const LCOR = AL > 24.4
      ? -3.446 + 1.715 * AL - 0.0237 * AL * AL
      : AL;

    const ALadj = LCOR + Rethick;

    // Estimated ELP (Effective Lens Position)
    const ACD = H + offset;
    const ELP = ACD;

    // IOL power calculation
    const V = 12; // Vertex distance
    const n1 = 1.336; // Aqueous refractive index
    const nc = 1.333; // Corneal refractive index

    // Calculated IOL power
    const x = n1 * r - nc * ALadj + ALadj * r * K / 1000;
    const y = n1 * (r - ELP) + ELP * r * K / 1000;

    let P = (1336 * (n1 * r - nc * ALadj + ELP * r * K / 1000)) /
            ((ALadj - ELP) * (n1 * r - nc * ELP + ELP * r * K / 1000));

    // Adjust for target refraction
    P = P - (1.5 * target);

    // Round to nearest 0.5D
    const recommendedPower = Math.round(P * 2) / 2;

    // Calculate expected refraction
    const expectedRefraction = (P - recommendedPower) / 1.5;

    // Power options
    const powerOptions = this.generatePowerOptions(P, K, AL, ELP);

    // Confidence assessment
    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (AL < 22 || AL > 26) confidence = 'medium';
    if (AL < 21 || AL > 27) confidence = 'low';
    if (this.patientData.postLasik || this.patientData.postPrk) confidence = 'medium';

    return {
      recommendedPower,
      expectedRefraction,
      powerOptions,
      formula: 'SRK/T',
      elp: ELP,
      warnings,
      confidence,
    };
  }

  /**
   * Holladay 1 Formula
   * Good for normal to long eyes
   */
  calculateHolladay1(): IOLCalculationResult {
    const AL = this.biometry.axialLength;
    const K = this.getCorrectedK();
    const target = this.patientData.targetRefraction;
    const SF = this.iolConstants.surgeonFactor || 1.9;
    const warnings = this.validateBiometry();

    // Corneal radius
    const R = 337.5 / K;

    // Anatomical anterior chamber depth
    const AG = 12.4 * Math.exp(-0.011 * K);

    // Corneal height
    const Cw = this.biometry.wtw || 11.7;
    const H = R - Math.sqrt(R * R - (Cw * Cw / 4));

    // Estimated ELP
    const ELP = H + SF;

    // Optical axial length correction
    let ALopt = AL;
    if (AL > 25.3) {
      ALopt = AL + (AL - 25.3) * 0.35;
    }

    // IOL power calculation using vergence formula
    const n = 1.336;
    const nc = 1.3375;
    const Dc = (nc - 1) / (R / 1000); // Corneal power in diopters

    // Vergence calculation
    const ALm = ALopt / 1000; // Convert to meters
    const ELPm = ELP / 1000;

    const P = (n / (ALm - ELPm)) - (n / ((n / Dc) + ELPm));

    // Adjust for target
    const Padj = P - (target * 1.5);

    const recommendedPower = Math.round(Padj * 2) / 2;
    const expectedRefraction = (Padj - recommendedPower) / 1.5;

    const powerOptions = this.generatePowerOptions(Padj, K, AL, ELP);

    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (AL < 22 || AL > 26) confidence = 'medium';
    if (this.patientData.postLasik || this.patientData.postPrk) confidence = 'medium';

    return {
      recommendedPower,
      expectedRefraction,
      powerOptions,
      formula: 'Holladay 1',
      elp: ELP,
      warnings,
      confidence,
    };
  }

  /**
   * Haigis Formula
   * Triple optimization for ACD prediction
   */
  calculateHaigis(): IOLCalculationResult {
    const AL = this.biometry.axialLength;
    const K = this.getCorrectedK();
    const ACD = this.biometry.acd || 3.37; // Default if not measured
    const target = this.patientData.targetRefraction;
    const warnings = this.validateBiometry();

    // Haigis constants
    const a0 = this.iolConstants.haigisA0 || 1.321;
    const a1 = this.iolConstants.haigisA1 || 0.400;
    const a2 = this.iolConstants.haigisA2 || 0.100;

    // Predicted ELP using Haigis formula
    const d = a0 + (a1 * ACD) + (a2 * AL);

    // Corneal radius in mm
    const R = 337.5 / K;

    // Refractive indices
    const nc = 1.3315;
    const na = 1.336;

    // Corneal power
    const Dc = (nc - 1) / (R / 1000);

    // IOL power calculation
    const ALm = AL / 1000;
    const dm = d / 1000;

    const denominator = (ALm - dm) * (na / ((na / Dc) - dm + dm * Dc / na));
    const P = na / (ALm - dm) - denominator / (ALm - dm);

    // Simplified vergence formula
    const P_simple = (1336 / (AL - d)) - (1336 / ((1336 / K) + d - AL));

    // Adjust for target
    const Padj = P_simple - (target * 1.5);

    const recommendedPower = Math.round(Padj * 2) / 2;
    const expectedRefraction = (Padj - recommendedPower) / 1.5;

    const powerOptions = this.generatePowerOptions(Padj, K, AL, d);

    // Haigis is good for eyes with unusual ACD
    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (!this.biometry.acd) {
      confidence = 'medium';
      warnings.push('ACD non mesuré - utilisation valeur par défaut');
    }
    if (this.patientData.postLasik || this.patientData.postPrk) confidence = 'medium';

    return {
      recommendedPower,
      expectedRefraction,
      powerOptions,
      formula: 'Haigis',
      elp: d,
      warnings,
      confidence,
    };
  }

  /**
   * Barrett Universal II (Simplified approximation)
   * Best for all axial lengths, especially long eyes
   */
  calculateBarrett(): IOLCalculationResult {
    const AL = this.biometry.axialLength;
    const K = this.getCorrectedK();
    const ACD = this.biometry.acd || 3.37;
    const LT = this.biometry.lensThickness || 4.5;
    const WTW = this.biometry.wtw || 11.7;
    const target = this.patientData.targetRefraction;
    const A = this.iolConstants.aConstant;
    const warnings = this.validateBiometry();

    // Barrett uses a more sophisticated ELP prediction
    // This is a simplified approximation of the Barrett formula

    // Lens factor from A-constant
    const LF = (A - 118.0) * 0.5;

    // Corneal radius
    const R = 337.5 / K;

    // Estimated lens position
    const C = 0.44 * ACD + 0.11 * LT - 0.16 * K + 0.035 * AL + 0.3 * WTW / 11.7;
    const ELP = 4.5 + LF + C;

    // Corrected axial length for long/short eyes
    let ALadj = AL;
    if (AL > 26) {
      ALadj = AL - 0.25 * (AL - 26);
    } else if (AL < 22) {
      ALadj = AL + 0.1 * (22 - AL);
    }

    // Barrett vergence calculation
    const n = 1.336;
    const Dc = (n - 1) / (R / 1000) * 1000;

    const Popt = (1000 * n) / (ALadj - ELP) -
                 (1000 * n) / (((1000 * n) / Dc) + ELP);

    // Adjust for target
    const Padj = Popt - (target * 1.5);

    const recommendedPower = Math.round(Padj * 2) / 2;
    const expectedRefraction = (Padj - recommendedPower) / 1.5;

    const powerOptions = this.generatePowerOptions(Padj, K, AL, ELP);

    // Barrett is most accurate for extreme eyes
    let confidence: 'high' | 'medium' | 'low' = 'high';
    if (!this.biometry.acd || !this.biometry.lensThickness) {
      confidence = 'medium';
      warnings.push('Données biométriques incomplètes pour Barrett');
    }

    return {
      recommendedPower,
      expectedRefraction,
      powerOptions,
      formula: 'Barrett Universal II',
      elp: ELP,
      warnings,
      confidence,
    };
  }

  /**
   * Generate power options around the calculated power
   */
  private generatePowerOptions(
    calculatedPower: number,
    K: number,
    AL: number,
    ELP: number
  ): { power: number; expectedRefraction: number; deviation: number }[] {
    const options: { power: number; expectedRefraction: number; deviation: number }[] = [];
    const target = this.patientData.targetRefraction;

    // Generate options from -2.0D to +2.0D in 0.5D steps
    for (let offset = -2.0; offset <= 2.0; offset += 0.5) {
      const power = Math.round((calculatedPower + offset) * 2) / 2;
      const expectedRefraction = (calculatedPower - power) / 1.5;
      const deviation = Math.abs(expectedRefraction - target);

      options.push({
        power,
        expectedRefraction: Math.round(expectedRefraction * 100) / 100,
        deviation: Math.round(deviation * 100) / 100,
      });
    }

    return options.sort((a, b) => a.deviation - b.deviation);
  }

  /**
   * Calculate using all formulas and provide optimized recommendation
   */
  calculateAll(): MultiFormulaResult {
    const results: MultiFormulaResult = {
      optimizedRecommendation: {
        power: 0,
        expectedRefraction: 0,
        agreementScore: 0,
        formulas: [],
      },
      recommendations: [],
    };

    const AL = this.biometry.axialLength;
    const warnings: string[] = [];

    // Calculate with all formulas
    try {
      results.srkt = this.calculateSRKT();
    } catch (e) {
      logger.error('SRK/T calculation failed', { error: e });
    }

    try {
      results.holladay1 = this.calculateHolladay1();
    } catch (e) {
      logger.error('Holladay 1 calculation failed', { error: e });
    }

    try {
      results.haigis = this.calculateHaigis();
    } catch (e) {
      logger.error('Haigis calculation failed', { error: e });
    }

    try {
      results.barrett = this.calculateBarrett();
    } catch (e) {
      logger.error('Barrett calculation failed', { error: e });
    }

    // Collect all powers
    const powers: number[] = [];
    const formulasUsed: string[] = [];

    if (results.srkt) {
      powers.push(results.srkt.recommendedPower);
      formulasUsed.push('SRK/T');
    }
    if (results.holladay1) {
      powers.push(results.holladay1.recommendedPower);
      formulasUsed.push('Holladay 1');
    }
    if (results.haigis) {
      powers.push(results.haigis.recommendedPower);
      formulasUsed.push('Haigis');
    }
    if (results.barrett) {
      powers.push(results.barrett.recommendedPower);
      formulasUsed.push('Barrett');
    }

    // Calculate optimized recommendation based on eye characteristics
    let optimizedPower: number;
    let primaryFormulas: string[];

    if (AL < 22) {
      // Short eyes: prefer Haigis and Holladay 1
      optimizedPower = results.haigis?.recommendedPower ||
                       results.holladay1?.recommendedPower ||
                       powers[0];
      primaryFormulas = ['Haigis', 'Holladay 1'];
      results.recommendations.push(
        'Œil court: Haigis et Holladay 1 recommandés',
        'Risque de surprise hypermétropique - viser légèrement myope',
        'Considérer mesures biométriques par immersion'
      );
    } else if (AL > 26) {
      // Long eyes: prefer Barrett and SRK/T optimized
      optimizedPower = results.barrett?.recommendedPower ||
                       results.srkt?.recommendedPower ||
                       powers[0];
      primaryFormulas = ['Barrett Universal II', 'SRK/T'];
      results.recommendations.push(
        'Œil long: Barrett Universal II fortement recommandé',
        'Risque de surprise myopique - viser emmétropie',
        'Considérer IOL à faible puissance ou calcul spécialisé'
      );
    } else if (this.patientData.postLasik || this.patientData.postPrk) {
      // Post-refractive: use modified formulas
      optimizedPower = results.haigis?.recommendedPower ||
                       results.barrett?.recommendedPower ||
                       powers[0];
      primaryFormulas = ['Haigis (avec K corrigé)', 'Barrett'];
      results.recommendations.push(
        'Post-LASIK/PRK: utiliser kératométrie corrigée',
        'Haigis-L ou Barrett True K recommandés',
        'Obtenir données pré-opératoires si possible',
        'Prévoir possible ajustement réfractif post-op'
      );
    } else {
      // Normal eyes: use average with preference for Barrett
      optimizedPower = results.barrett?.recommendedPower ||
                       this.calculateWeightedAverage(powers);
      primaryFormulas = ['Barrett Universal II', 'SRK/T', 'Haigis'];
      results.recommendations.push(
        'Œil normal: toutes les formules applicables',
        'Barrett Universal II offre la meilleure précision',
        'Vérifier cohérence entre formules'
      );
    }

    // Calculate agreement score
    const avgPower = powers.reduce((a, b) => a + b, 0) / powers.length;
    const variance = powers.reduce((sum, p) => sum + Math.pow(p - avgPower, 2), 0) / powers.length;
    const agreementScore = Math.max(0, 100 - (Math.sqrt(variance) * 50));

    if (agreementScore < 90) {
      results.recommendations.push(
        `Désaccord inter-formules (${agreementScore.toFixed(0)}%) - vérifier biométrie`
      );
    }

    results.optimizedRecommendation = {
      power: Math.round(optimizedPower * 2) / 2,
      expectedRefraction: (optimizedPower - Math.round(optimizedPower * 2) / 2) / 1.5,
      agreementScore: Math.round(agreementScore),
      formulas: primaryFormulas,
    };

    // Add general recommendations
    const kDiff = Math.abs(this.biometry.k1 - this.biometry.k2);
    if (kDiff > 1.5) {
      results.recommendations.push(
        `Astigmatisme ${kDiff.toFixed(2)}D - envisager IOL torique`
      );
    }

    return results;
  }

  /**
   * Calculate weighted average of powers
   */
  private calculateWeightedAverage(powers: number[]): number {
    if (powers.length === 0) return 0;
    return powers.reduce((a, b) => a + b, 0) / powers.length;
  }

  /**
   * Get formula recommendation based on eye characteristics
   */
  static getRecommendedFormulas(axialLength: number, postRefractive: boolean = false): string[] {
    if (postRefractive) {
      return ['Barrett True K', 'Haigis-L', 'Shammas-PL'];
    }

    if (axialLength < 22) {
      return ['Haigis', 'Hoffer Q', 'Holladay 2'];
    } else if (axialLength < 22.5) {
      return ['Haigis', 'Holladay 1', 'SRK/T'];
    } else if (axialLength >= 22.5 && axialLength <= 25) {
      return ['Barrett Universal II', 'SRK/T', 'Holladay 1', 'Haigis'];
    } else if (axialLength > 25 && axialLength <= 26) {
      return ['Barrett Universal II', 'SRK/T'];
    } else {
      return ['Barrett Universal II', 'Wang-Koch AL adjustment'];
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert spherical equivalent to expected refraction
 */
export function calculateSphericalEquivalent(sphere: number, cylinder: number): number {
  return sphere + (cylinder / 2);
}

/**
 * Estimate IOL power change for target refraction change
 * Approximately 1.5D IOL power = 1D refraction change
 */
export function estimatePowerChange(refractionChange: number): number {
  return refractionChange * 1.5;
}

/**
 * Calculate toric IOL cylinder power
 */
export function calculateToricCylinder(
  cornealAstigmatism: number,
  incisionInducedAstigmatism: number = 0.3,
  axis: number
): { cylinder: number; axis: number } {
  // Simplified calculation - real-world uses vector analysis
  const effectiveCylinder = cornealAstigmatism - incisionInducedAstigmatism;
  const iolCylinder = effectiveCylinder * 1.4; // Approximate IOL plane conversion

  return {
    cylinder: Math.round(iolCylinder * 2) / 2,
    axis: axis,
  };
}

export default IOLCalculator;
