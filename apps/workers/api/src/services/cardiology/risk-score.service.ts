/**
 * Cardiac Risk Score Service
 * Implements Framingham Risk Score and ASCVD Risk Calculator
 */

import { logger } from '../../utils/logger';

export interface PatientRiskData {
  age: number;
  gender: 'male' | 'female';
  totalCholesterol: number; // mg/dL
  hdlCholesterol: number; // mg/dL
  ldlCholesterol?: number; // mg/dL
  systolicBP: number; // mmHg
  diastolicBP?: number; // mmHg
  isSmoker: boolean;
  hasDiabetes: boolean;
  isOnBPMedication: boolean;
  hasHypertension?: boolean;
  familyHistoryCVD?: boolean;
  bmi?: number;
}

export interface RiskScoreResult {
  score: number;
  riskPercentage: number;
  riskCategory: 'low' | 'moderate' | 'high' | 'very_high';
  recommendations: string[];
  calculatedAt: Date;
}

export interface FraminghamResult extends RiskScoreResult {
  type: 'framingham';
  tenYearRisk: number;
  heartAge: number;
}

export interface ASCVDResult extends RiskScoreResult {
  type: 'ascvd';
  tenYearRisk: number;
  lifetimeRisk: number;
  optimalRisk: number;
}

export class CardiacRiskScoreService {
  constructor(private db: D1Database) {}

  /**
   * Calculate Framingham Risk Score
   * Based on the Framingham Heart Study algorithm
   */
  calculateFraminghamScore(data: PatientRiskData): FraminghamResult {
    let points = 0;
    const isMale = data.gender === 'male';

    // Age points
    if (isMale) {
      if (data.age >= 20 && data.age <= 34) points += -9;
      else if (data.age >= 35 && data.age <= 39) points += -4;
      else if (data.age >= 40 && data.age <= 44) points += 0;
      else if (data.age >= 45 && data.age <= 49) points += 3;
      else if (data.age >= 50 && data.age <= 54) points += 6;
      else if (data.age >= 55 && data.age <= 59) points += 8;
      else if (data.age >= 60 && data.age <= 64) points += 10;
      else if (data.age >= 65 && data.age <= 69) points += 11;
      else if (data.age >= 70 && data.age <= 74) points += 12;
      else if (data.age >= 75) points += 13;
    } else {
      if (data.age >= 20 && data.age <= 34) points += -7;
      else if (data.age >= 35 && data.age <= 39) points += -3;
      else if (data.age >= 40 && data.age <= 44) points += 0;
      else if (data.age >= 45 && data.age <= 49) points += 3;
      else if (data.age >= 50 && data.age <= 54) points += 6;
      else if (data.age >= 55 && data.age <= 59) points += 8;
      else if (data.age >= 60 && data.age <= 64) points += 10;
      else if (data.age >= 65 && data.age <= 69) points += 12;
      else if (data.age >= 70 && data.age <= 74) points += 14;
      else if (data.age >= 75) points += 16;
    }

    // Total Cholesterol points (age-adjusted)
    const cholPoints = this.getCholesterolPoints(data.totalCholesterol, data.age, isMale);
    points += cholPoints;

    // Smoking points (age-adjusted)
    if (data.isSmoker) {
      if (isMale) {
        if (data.age >= 20 && data.age <= 39) points += 8;
        else if (data.age >= 40 && data.age <= 49) points += 5;
        else if (data.age >= 50 && data.age <= 59) points += 3;
        else if (data.age >= 60 && data.age <= 69) points += 1;
        else points += 1;
      } else {
        if (data.age >= 20 && data.age <= 39) points += 9;
        else if (data.age >= 40 && data.age <= 49) points += 7;
        else if (data.age >= 50 && data.age <= 59) points += 4;
        else if (data.age >= 60 && data.age <= 69) points += 2;
        else points += 1;
      }
    }

    // HDL Cholesterol points
    if (data.hdlCholesterol >= 60) points += -1;
    else if (data.hdlCholesterol >= 50 && data.hdlCholesterol <= 59) points += 0;
    else if (data.hdlCholesterol >= 40 && data.hdlCholesterol <= 49) points += 1;
    else if (data.hdlCholesterol < 40) points += 2;

    // Blood Pressure points
    const bpPoints = this.getBPPoints(data.systolicBP, data.isOnBPMedication, isMale);
    points += bpPoints;

    // Calculate 10-year risk percentage
    const tenYearRisk = this.pointsToRisk(points, isMale);

    // Calculate heart age
    const heartAge = this.calculateHeartAge(points, data.age, isMale);

    // Determine risk category
    const riskCategory = this.getRiskCategory(tenYearRisk);

    // Generate recommendations
    const recommendations = this.generateRecommendations(data, tenYearRisk, riskCategory);

    logger.info('Framingham score calculated', { points, tenYearRisk, riskCategory });

    return {
      type: 'framingham',
      score: points,
      riskPercentage: tenYearRisk,
      tenYearRisk,
      heartAge,
      riskCategory,
      recommendations,
      calculatedAt: new Date(),
    };
  }

  /**
   * Calculate ASCVD Risk Score
   * Based on American College of Cardiology/American Heart Association Pooled Cohort Equations
   */
  calculateASCVDScore(data: PatientRiskData): ASCVDResult {
    const isMale = data.gender === 'male';
    const isBlack = false; // Would need race data for accurate calculation

    // Pooled Cohort Equations coefficients
    let lnAge = Math.log(data.age);
    let lnTotalChol = Math.log(data.totalCholesterol);
    let lnHDL = Math.log(data.hdlCholesterol);
    let lnSBP = Math.log(data.systolicBP);
    let smoke = data.isSmoker ? 1 : 0;
    let diabetes = data.hasDiabetes ? 1 : 0;
    let bpTreat = data.isOnBPMedication ? 1 : 0;

    let sum: number;
    let baselineSurvival: number;
    let meanCoeffSum: number;

    if (isMale && !isBlack) {
      // White Male coefficients
      sum = 12.344 * lnAge +
            11.853 * lnTotalChol +
            -2.664 * lnAge * lnTotalChol +
            -7.990 * lnHDL +
            1.769 * lnAge * lnHDL +
            (bpTreat ? 1.797 * lnSBP : 1.764 * lnSBP) +
            7.837 * smoke +
            -1.795 * lnAge * smoke +
            0.658 * diabetes;
      baselineSurvival = 0.9144;
      meanCoeffSum = 61.18;
    } else if (!isMale && !isBlack) {
      // White Female coefficients
      sum = -29.799 * lnAge +
            4.884 * lnAge * lnAge +
            13.540 * lnTotalChol +
            -3.114 * lnAge * lnTotalChol +
            -13.578 * lnHDL +
            3.149 * lnAge * lnHDL +
            (bpTreat ? 2.019 * lnSBP : 1.957 * lnSBP) +
            7.574 * smoke +
            -1.665 * lnAge * smoke +
            0.661 * diabetes;
      baselineSurvival = 0.9665;
      meanCoeffSum = -29.18;
    } else if (isMale && isBlack) {
      // Black Male coefficients
      sum = 2.469 * lnAge +
            0.302 * lnTotalChol +
            -0.307 * lnHDL +
            (bpTreat ? 1.916 * lnSBP : 1.809 * lnSBP) +
            0.549 * smoke +
            0.645 * diabetes;
      baselineSurvival = 0.8954;
      meanCoeffSum = 19.54;
    } else {
      // Black Female coefficients
      sum = 17.114 * lnAge +
            0.940 * lnTotalChol +
            -18.920 * lnHDL +
            4.475 * lnAge * lnHDL +
            (bpTreat ? 29.291 * lnSBP - 6.432 * lnAge * lnSBP : 27.820 * lnSBP - 6.087 * lnAge * lnSBP) +
            0.691 * smoke +
            0.874 * diabetes;
      baselineSurvival = 0.9533;
      meanCoeffSum = 86.61;
    }

    // Calculate 10-year risk
    const tenYearRisk = (1 - Math.pow(baselineSurvival, Math.exp(sum - meanCoeffSum))) * 100;
    const clampedRisk = Math.max(0, Math.min(100, tenYearRisk));

    // Calculate lifetime risk (simplified)
    const lifetimeRisk = this.calculateLifetimeRisk(data);

    // Calculate optimal risk (if all modifiable factors were optimal)
    const optimalRisk = this.calculateOptimalRisk(data, isMale);

    const riskCategory = this.getASCVDRiskCategory(clampedRisk);
    const recommendations = this.generateASCVDRecommendations(data, clampedRisk, riskCategory);

    logger.info('ASCVD score calculated', { tenYearRisk: clampedRisk, riskCategory });

    return {
      type: 'ascvd',
      score: Math.round(clampedRisk * 10) / 10,
      riskPercentage: clampedRisk,
      tenYearRisk: clampedRisk,
      lifetimeRisk,
      optimalRisk,
      riskCategory,
      recommendations,
      calculatedAt: new Date(),
    };
  }

  /**
   * Store risk score in database
   */
  async saveRiskScore(
    patientId: string,
    organizationId: string,
    scoreType: 'framingham' | 'ascvd',
    result: RiskScoreResult,
    calculatedBy: string
  ): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await this.db.prepare(`
      INSERT INTO cardiology_risk_scores (
        id, patient_id, organization_id, score_type, score_value,
        risk_percentage, risk_category, recommendations, calculated_by,
        calculation_date, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, patientId, organizationId, scoreType, result.score,
      result.riskPercentage, result.riskCategory,
      JSON.stringify(result.recommendations), calculatedBy,
      now, now
    ).run();

    return id;
  }

  /**
   * Get patient's risk score history
   */
  async getPatientRiskHistory(
    patientId: string,
    organizationId: string,
    limit: number = 10
  ): Promise<any[]> {
    const result = await this.db.prepare(`
      SELECT * FROM cardiology_risk_scores
      WHERE patient_id = ? AND organization_id = ?
      ORDER BY calculation_date DESC
      LIMIT ?
    `).bind(patientId, organizationId, limit).all();

    return (result.results || []).map((row: any) => ({
      ...row,
      recommendations: JSON.parse(row.recommendations || '[]'),
    }));
  }

  // Helper methods
  private getCholesterolPoints(chol: number, age: number, isMale: boolean): number {
    const ageGroup = age < 40 ? 0 : age < 50 ? 1 : age < 60 ? 2 : age < 70 ? 3 : 4;

    if (isMale) {
      const maleTable = [
        [0, 0, 0, 0, 0], // <160
        [4, 3, 2, 1, 0], // 160-199
        [7, 5, 3, 1, 0], // 200-239
        [9, 6, 4, 2, 1], // 240-279
        [11, 8, 5, 3, 1], // >=280
      ];
      const cholGroup = chol < 160 ? 0 : chol < 200 ? 1 : chol < 240 ? 2 : chol < 280 ? 3 : 4;
      return maleTable[cholGroup][ageGroup];
    } else {
      const femaleTable = [
        [0, 0, 0, 0, 0],
        [4, 3, 2, 1, 1],
        [8, 6, 4, 2, 1],
        [11, 8, 5, 3, 2],
        [13, 10, 7, 4, 2],
      ];
      const cholGroup = chol < 160 ? 0 : chol < 200 ? 1 : chol < 240 ? 2 : chol < 280 ? 3 : 4;
      return femaleTable[cholGroup][ageGroup];
    }
  }

  private getBPPoints(sbp: number, onMeds: boolean, isMale: boolean): number {
    if (isMale) {
      if (onMeds) {
        if (sbp < 120) return 0;
        if (sbp < 130) return 1;
        if (sbp < 140) return 2;
        if (sbp < 160) return 2;
        return 3;
      } else {
        if (sbp < 120) return 0;
        if (sbp < 130) return 0;
        if (sbp < 140) return 1;
        if (sbp < 160) return 1;
        return 2;
      }
    } else {
      if (onMeds) {
        if (sbp < 120) return 0;
        if (sbp < 130) return 3;
        if (sbp < 140) return 4;
        if (sbp < 160) return 5;
        return 6;
      } else {
        if (sbp < 120) return 0;
        if (sbp < 130) return 1;
        if (sbp < 140) return 2;
        if (sbp < 160) return 3;
        return 4;
      }
    }
  }

  private pointsToRisk(points: number, isMale: boolean): number {
    if (isMale) {
      if (points < 0) return 1;
      if (points === 0) return 1;
      if (points <= 4) return 1;
      if (points <= 6) return 2;
      if (points === 7) return 3;
      if (points === 8) return 4;
      if (points === 9) return 5;
      if (points === 10) return 6;
      if (points === 11) return 8;
      if (points === 12) return 10;
      if (points === 13) return 12;
      if (points === 14) return 16;
      if (points === 15) return 20;
      if (points === 16) return 25;
      return 30;
    } else {
      if (points < 9) return 1;
      if (points <= 12) return 1;
      if (points <= 14) return 2;
      if (points === 15) return 3;
      if (points === 16) return 4;
      if (points === 17) return 5;
      if (points === 18) return 6;
      if (points === 19) return 8;
      if (points === 20) return 11;
      if (points === 21) return 14;
      if (points === 22) return 17;
      if (points === 23) return 22;
      if (points === 24) return 27;
      return 30;
    }
  }

  private calculateHeartAge(points: number, actualAge: number, isMale: boolean): number {
    // Estimate heart age based on risk score
    const baseAge = isMale ? 30 : 30;
    const heartAge = baseAge + (points * 2);
    return Math.max(actualAge, Math.min(85, heartAge));
  }

  private getRiskCategory(risk: number): 'low' | 'moderate' | 'high' | 'very_high' {
    if (risk < 5) return 'low';
    if (risk < 10) return 'moderate';
    if (risk < 20) return 'high';
    return 'very_high';
  }

  private getASCVDRiskCategory(risk: number): 'low' | 'moderate' | 'high' | 'very_high' {
    if (risk < 5) return 'low';
    if (risk < 7.5) return 'moderate';
    if (risk < 20) return 'high';
    return 'very_high';
  }

  private calculateLifetimeRisk(data: PatientRiskData): number {
    // Simplified lifetime risk calculation
    let baseRisk = 30; // Base lifetime risk

    if (data.isSmoker) baseRisk += 10;
    if (data.hasDiabetes) baseRisk += 15;
    if (data.systolicBP > 140) baseRisk += 10;
    if (data.totalCholesterol > 240) baseRisk += 5;
    if (data.hdlCholesterol < 40) baseRisk += 5;

    return Math.min(80, baseRisk);
  }

  private calculateOptimalRisk(data: PatientRiskData, isMale: boolean): number {
    // Calculate risk with optimal modifiable factors
    const optimalData: PatientRiskData = {
      ...data,
      totalCholesterol: 170,
      hdlCholesterol: 60,
      systolicBP: 110,
      isSmoker: false,
      hasDiabetes: data.hasDiabetes, // Can't change diabetes status
      isOnBPMedication: false,
    };

    const result = this.calculateFraminghamScore(optimalData);
    return result.tenYearRisk;
  }

  private generateRecommendations(
    data: PatientRiskData,
    risk: number,
    category: string
  ): string[] {
    const recommendations: string[] = [];

    if (data.isSmoker) {
      recommendations.push('Arret du tabac recommande - priorite elevee');
    }

    if (data.totalCholesterol > 200) {
      recommendations.push('Reduire le cholesterol total (regime, statines si necessaire)');
    }

    if (data.hdlCholesterol < 40) {
      recommendations.push('Augmenter le HDL-cholesterol (exercice, regime)');
    }

    if (data.systolicBP > 130) {
      recommendations.push('Controler la pression arterielle (regime DASH, medicaments si necessaire)');
    }

    if (data.hasDiabetes) {
      recommendations.push('Optimiser le controle glycemique (HbA1c < 7%)');
    }

    if (data.bmi && data.bmi > 25) {
      recommendations.push('Perte de poids recommandee (objectif IMC < 25)');
    }

    // Risk-category specific recommendations
    if (category === 'high' || category === 'very_high') {
      recommendations.push('Consultation cardiologique recommandee');
      recommendations.push('Considerer traitement par statine');
      recommendations.push('Bilan cardiovasculaire complet (ECG, echo, epreuve deffort)');
    } else if (category === 'moderate') {
      recommendations.push('Suivi regulier des facteurs de risque');
      recommendations.push('Mode de vie sain (alimentation, exercice)');
    } else if (category === 'low') {
      // Always provide baseline recommendations even for low risk
      recommendations.push('Maintenir un mode de vie sain');
      recommendations.push('Controle annuel des facteurs de risque cardiovasculaires');
    }

    if (risk > 20) {
      recommendations.push('Aspirine faible dose a considerer (apres evaluation benefice/risque)');
    }

    return recommendations;
  }

  private generateASCVDRecommendations(
    data: PatientRiskData,
    risk: number,
    category: string
  ): string[] {
    const recommendations = this.generateRecommendations(data, risk, category);

    // ASCVD-specific statin recommendations based on ACC/AHA guidelines
    if (risk >= 20) {
      recommendations.push('Statine haute intensite recommandee (atorvastatine 40-80mg ou rosuvastatine 20-40mg)');
    } else if (risk >= 7.5) {
      recommendations.push('Statine intensite moderee a haute recommandee');
    } else if (risk >= 5) {
      recommendations.push('Discussion sur les statines recommandee (decision partagee)');
    }

    // LDL targets
    if (data.ldlCholesterol && data.ldlCholesterol > 70 && risk >= 20) {
      recommendations.push('Objectif LDL < 70 mg/dL pour risque tres eleve');
    } else if (data.ldlCholesterol && data.ldlCholesterol > 100 && risk >= 7.5) {
      recommendations.push('Objectif LDL < 100 mg/dL recommande');
    }

    return recommendations;
  }
}
