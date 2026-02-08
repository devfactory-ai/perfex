/**
 * Cardiology Risk Calculator Tests
 * Tests for clinical risk score calculations
 */

import { describe, it, expect } from 'vitest';
import {
  CACScoreCalculator,
  ASCVDCalculator,
  HEARTScoreCalculator,
  CHADSVASCCalculator,
  HASBLEDCalculator,
  GRACEScoreCalculator,
  type PatientDemographics,
  type LipidProfile,
  type CardiovascularRiskFactors,
  type HEARTScoreInput,
  type CHADSVASCInput,
  type HASBLEDInput,
  type GRACEScoreInput,
} from './risk.calculator';

describe('CardiologyRiskCalculators', () => {
  // =========================================================================
  // CAC Score Tests
  // =========================================================================
  describe('CACScoreCalculator', () => {
    const demographics: PatientDemographics = { age: 55, sex: 'male' };

    it('should interpret zero CAC score as very low risk', () => {
      const result = CACScoreCalculator.interpret({ agatstonScore: 0 }, demographics);

      expect(result.scoreValue).toBe(0);
      expect(result.riskLevel).toBe('very_low');
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should interpret moderate CAC score correctly', () => {
      const result = CACScoreCalculator.interpret({ agatstonScore: 150 }, demographics);

      expect(result.scoreValue).toBe(150);
      expect(['intermediate', 'high']).toContain(result.riskLevel);
    });

    it('should interpret high CAC score as high risk', () => {
      const result = CACScoreCalculator.interpret({ agatstonScore: 450 }, demographics);

      expect(result.scoreValue).toBe(450);
      expect(['high', 'very_high']).toContain(result.riskLevel);
    });

    it('should return valid result structure', () => {
      const result = CACScoreCalculator.interpret({ agatstonScore: 100 }, demographics);

      expect(result.scoreName).toBeDefined();
      expect(result.scoreValue).toBeDefined();
      expect(result.interpretation).toBeDefined();
      expect(result.riskLevel).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.clinicalNotes).toBeDefined();
    });
  });

  // =========================================================================
  // ASCVD Calculator Tests
  // =========================================================================
  describe('ASCVDCalculator', () => {
    it('should calculate low risk for young healthy patient', () => {
      const demographics: PatientDemographics = {
        age: 40,
        sex: 'female',
        race: 'white',
      };
      const lipids: LipidProfile = {
        totalCholesterol: 180,
        hdlCholesterol: 60,
      };
      const riskFactors: CardiovascularRiskFactors = {
        systolicBP: 120,
        onBPMedication: false,
        diabetic: false,
        smoker: false,
      };

      const result = ASCVDCalculator.calculate(demographics, lipids, riskFactors);

      expect(result.riskPercentage).toBeLessThan(10);
      expect(['very_low', 'low', 'intermediate']).toContain(result.riskLevel);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate higher risk for patient with risk factors', () => {
      const demographics: PatientDemographics = {
        age: 65,
        sex: 'male',
        race: 'african_american',
      };
      const lipids: LipidProfile = {
        totalCholesterol: 280,
        hdlCholesterol: 35,
      };
      const riskFactors: CardiovascularRiskFactors = {
        systolicBP: 160,
        onBPMedication: true,
        diabetic: true,
        smoker: true,
      };

      const result = ASCVDCalculator.calculate(demographics, lipids, riskFactors);

      expect(result.riskPercentage).toBeGreaterThan(10);
      expect(['intermediate', 'high', 'very_high']).toContain(result.riskLevel);
    });

    it('should provide valid interpretation', () => {
      const demographics: PatientDemographics = { age: 55, sex: 'male' };
      const lipids: LipidProfile = { totalCholesterol: 220, hdlCholesterol: 45 };
      const riskFactors: CardiovascularRiskFactors = {
        systolicBP: 140,
        onBPMedication: false,
        diabetic: false,
        smoker: false,
      };

      const result = ASCVDCalculator.calculate(demographics, lipids, riskFactors);

      expect(result.interpretation).toBeDefined();
      expect(result.interpretation.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // HEART Score Tests
  // =========================================================================
  describe('HEARTScoreCalculator', () => {
    it('should calculate low risk HEART score', () => {
      const input: HEARTScoreInput = {
        history: 0,    // Slightly suspicious
        ecg: 0,        // Normal
        age: 0,        // <45
        riskFactors: 0, // No known risk factors
        troponin: 0,   // Normal
      };

      const result = HEARTScoreCalculator.calculate(input);

      expect(result.scoreValue).toBe(0);
      expect(result.riskLevel).toBe('low');
    });

    it('should calculate high risk HEART score', () => {
      const input: HEARTScoreInput = {
        history: 2,    // Highly suspicious
        ecg: 2,        // Significant ST deviation
        age: 2,        // >=65
        riskFactors: 2, // >=3 risk factors or history of CVD
        troponin: 2,   // >3x normal
      };

      const result = HEARTScoreCalculator.calculate(input);

      expect(result.scoreValue).toBe(10);
      expect(['high', 'very_high']).toContain(result.riskLevel);
    });

    it('should provide recommendations for each risk level', () => {
      const lowRisk: HEARTScoreInput = { history: 0, ecg: 0, age: 0, riskFactors: 0, troponin: 0 };
      const highRisk: HEARTScoreInput = { history: 2, ecg: 2, age: 2, riskFactors: 2, troponin: 2 };

      const lowResult = HEARTScoreCalculator.calculate(lowRisk);
      const highResult = HEARTScoreCalculator.calculate(highRisk);

      expect(lowResult.recommendations.length).toBeGreaterThan(0);
      expect(highResult.recommendations.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // CHA2DS2-VASc Tests
  // =========================================================================
  describe('CHADSVASCCalculator', () => {
    it('should calculate score of 0 for young male without risk factors', () => {
      const input: CHADSVASCInput = {
        age: 50,
        sex: 'male',
        congestiveHeartFailure: false,
        hypertension: false,
        strokeTIAHistory: false,
        vascularDisease: false,
        diabetes: false,
      };

      const result = CHADSVASCCalculator.calculate(input);

      expect(result.scoreValue).toBe(0);
      expect(result.riskPercentage).toBeDefined();
    });

    it('should calculate maximum score for patient with all risk factors', () => {
      const input: CHADSVASCInput = {
        age: 80,  // 2 points
        sex: 'female',  // 1 point
        congestiveHeartFailure: true,  // 1 point
        hypertension: true,  // 1 point
        strokeTIAHistory: true,  // 2 points
        vascularDisease: true,  // 1 point
        diabetes: true,  // 1 point
      };

      const result = CHADSVASCCalculator.calculate(input);

      expect(result.scoreValue).toBe(9);
      expect(['high', 'very_high']).toContain(result.riskLevel);
    });

    it('should recommend anticoagulation for higher scores', () => {
      const input: CHADSVASCInput = {
        age: 70,  // 1 point
        sex: 'male',
        congestiveHeartFailure: true,  // 1 point
        hypertension: false,
        strokeTIAHistory: false,
        vascularDisease: false,
        diabetes: false,
      };

      const result = CHADSVASCCalculator.calculate(input);

      expect(result.scoreValue).toBe(2);
      const hasAnticoagRecommendation = result.recommendations.some(
        (r: string) => r.toLowerCase().includes('anticoag') || r.toLowerCase().includes('warfarin') || r.toLowerCase().includes('doac')
      );
      expect(hasAnticoagRecommendation).toBe(true);
    });
  });

  // =========================================================================
  // HAS-BLED Tests
  // =========================================================================
  describe('HASBLEDCalculator', () => {
    it('should calculate low bleeding risk', () => {
      const input: HASBLEDInput = {
        hypertension: false,
        renalDisease: false,
        liverDisease: false,
        strokeHistory: false,
        bleedingHistory: false,
        labilINR: false,
        elderly: false,
        drugsAlcohol: false,
      };

      const result = HASBLEDCalculator.calculate(input);

      expect(result.scoreValue).toBe(0);
      expect(['very_low', 'low']).toContain(result.riskLevel);
    });

    it('should calculate high bleeding risk', () => {
      const input: HASBLEDInput = {
        hypertension: true,
        renalDisease: true,
        liverDisease: true,
        strokeHistory: true,
        bleedingHistory: true,
        labilINR: true,
        elderly: true,
        drugsAlcohol: true,
      };

      const result = HASBLEDCalculator.calculate(input);

      expect(result.scoreValue).toBeGreaterThanOrEqual(7);
      expect(['high', 'very_high']).toContain(result.riskLevel);
    });

    it('should provide bleeding risk percentage', () => {
      const input: HASBLEDInput = {
        hypertension: true,
        renalDisease: false,
        liverDisease: false,
        strokeHistory: false,
        bleedingHistory: true,
        labilINR: false,
        elderly: true,
        drugsAlcohol: false,
      };

      const result = HASBLEDCalculator.calculate(input);

      expect(result.riskPercentage).toBeDefined();
      expect(result.riskPercentage).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // GRACE Score Tests
  // =========================================================================
  describe('GRACEScoreCalculator', () => {
    it('should calculate low risk for stable patient', () => {
      const input: GRACEScoreInput = {
        age: 50,
        heartRate: 70,
        systolicBP: 130,
        creatinine: 1.0,
        killipClass: 1,
        cardiacArrest: false,
        stDeviation: false,
        elevatedCardiacMarkers: false,
      };

      const result = GRACEScoreCalculator.calculate(input);

      expect(['very_low', 'low', 'intermediate']).toContain(result.riskLevel);
      expect(result.riskPercentage).toBeDefined();
    });

    it('should calculate high risk for unstable patient', () => {
      const input: GRACEScoreInput = {
        age: 80,
        heartRate: 110,
        systolicBP: 85,
        creatinine: 2.5,
        killipClass: 4,
        cardiacArrest: true,
        stDeviation: true,
        elevatedCardiacMarkers: true,
      };

      const result = GRACEScoreCalculator.calculate(input);

      expect(['high', 'very_high']).toContain(result.riskLevel);
      expect(result.riskPercentage).toBeGreaterThan(3);
    });

    it('should provide intervention recommendations', () => {
      const input: GRACEScoreInput = {
        age: 65,
        heartRate: 90,
        systolicBP: 110,
        creatinine: 1.5,
        killipClass: 2,
        cardiacArrest: false,
        stDeviation: true,
        elevatedCardiacMarkers: true,
      };

      const result = GRACEScoreCalculator.calculate(input);

      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // RiskScoreResult Structure Tests
  // =========================================================================
  describe('RiskScoreResult Structure', () => {
    it('should have consistent structure across all calculators', () => {
      const cacResult = CACScoreCalculator.interpret({ agatstonScore: 100 }, { age: 55, sex: 'male' });
      const heartResult = HEARTScoreCalculator.calculate({ history: 1, ecg: 1, age: 1, riskFactors: 1, troponin: 1 });
      const chadsResult = CHADSVASCCalculator.calculate({
        age: 65, sex: 'male', congestiveHeartFailure: false,
        hypertension: true, strokeTIAHistory: false, vascularDisease: false, diabetes: false
      });
      const hasbledResult = HASBLEDCalculator.calculate({
        hypertension: true, renalDisease: false, liverDisease: false,
        strokeHistory: false, bleedingHistory: false, labilINR: false, elderly: true, drugsAlcohol: false
      });
      const graceResult = GRACEScoreCalculator.calculate({
        age: 60, heartRate: 80, systolicBP: 120, creatinine: 1.2,
        killipClass: 1, cardiacArrest: false, stDeviation: false, elevatedCardiacMarkers: false
      });

      // All should have the base RiskScoreResult properties
      for (const result of [cacResult, heartResult, chadsResult, hasbledResult, graceResult]) {
        expect(result).toHaveProperty('scoreName');
        expect(result).toHaveProperty('scoreValue');
        expect(result).toHaveProperty('interpretation');
        expect(result).toHaveProperty('riskLevel');
        expect(result).toHaveProperty('recommendations');
        expect(result).toHaveProperty('clinicalNotes');
        expect(['very_low', 'low', 'intermediate', 'high', 'very_high']).toContain(result.riskLevel);
      }
    });
  });
});
