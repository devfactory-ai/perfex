/**
 * Cardiac Risk Score Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CardiacRiskScoreService, PatientRiskData } from './risk-score.service';
import { createMockD1Database } from '../../__tests__/mocks/database.mock';

describe('CardiacRiskScoreService', () => {
  let service: CardiacRiskScoreService;
  let mockDb: D1Database;

  beforeEach(() => {
    mockDb = createMockD1Database();
    service = new CardiacRiskScoreService(mockDb);
  });

  describe('calculateFraminghamScore', () => {
    it('should calculate low risk for young healthy patient', () => {
      const data: PatientRiskData = {
        age: 35,
        gender: 'male',
        totalCholesterol: 180,
        hdlCholesterol: 55,
        systolicBP: 120,
        isSmoker: false,
        hasDiabetes: false,
        isOnBPMedication: false,
      };

      const result = service.calculateFraminghamScore(data);

      expect(result.type).toBe('framingham');
      expect(result.riskCategory).toBe('low');
      expect(result.tenYearRisk).toBeLessThan(5);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should calculate high risk for older smoker with elevated cholesterol', () => {
      const data: PatientRiskData = {
        age: 65,
        gender: 'male',
        totalCholesterol: 280,
        hdlCholesterol: 35,
        systolicBP: 160,
        isSmoker: true,
        hasDiabetes: true,
        isOnBPMedication: true,
      };

      const result = service.calculateFraminghamScore(data);

      expect(result.riskCategory).toBe('very_high');
      expect(result.tenYearRisk).toBeGreaterThan(20);
      expect(result.recommendations).toContain('Arret du tabac recommande - priorite elevee');
      expect(result.recommendations).toContain('Consultation cardiologique recommandee');
    });

    it('should calculate moderate risk for middle-aged patient with risk factors', () => {
      const data: PatientRiskData = {
        age: 60,
        gender: 'female',
        totalCholesterol: 250,
        hdlCholesterol: 38,
        systolicBP: 145,
        isSmoker: false,
        hasDiabetes: true,
        isOnBPMedication: false,
      };

      const result = service.calculateFraminghamScore(data);

      expect(['moderate', 'high', 'very_high']).toContain(result.riskCategory);
      expect(result.tenYearRisk).toBeGreaterThanOrEqual(5);
    });

    it('should calculate heart age correctly', () => {
      const data: PatientRiskData = {
        age: 45,
        gender: 'male',
        totalCholesterol: 250,
        hdlCholesterol: 40,
        systolicBP: 150,
        isSmoker: true,
        hasDiabetes: false,
        isOnBPMedication: false,
      };

      const result = service.calculateFraminghamScore(data);

      expect(result.heartAge).toBeGreaterThan(data.age);
    });

    it('should provide correct recommendations based on risk factors', () => {
      const data: PatientRiskData = {
        age: 50,
        gender: 'male',
        totalCholesterol: 260,
        hdlCholesterol: 35,
        systolicBP: 145,
        isSmoker: true,
        hasDiabetes: true,
        isOnBPMedication: false,
        bmi: 28,
      };

      const result = service.calculateFraminghamScore(data);

      expect(result.recommendations).toContain('Arret du tabac recommande - priorite elevee');
      expect(result.recommendations).toContain('Reduire le cholesterol total (regime, statines si necessaire)');
      expect(result.recommendations).toContain('Augmenter le HDL-cholesterol (exercice, regime)');
      expect(result.recommendations).toContain('Controler la pression arterielle (regime DASH, medicaments si necessaire)');
      expect(result.recommendations).toContain('Optimiser le controle glycemique (HbA1c < 7%)');
      expect(result.recommendations).toContain('Perte de poids recommandee (objectif IMC < 25)');
    });
  });

  describe('calculateASCVDScore', () => {
    it('should calculate ASCVD 10-year risk', () => {
      const data: PatientRiskData = {
        age: 55,
        gender: 'male',
        totalCholesterol: 213,
        hdlCholesterol: 50,
        systolicBP: 120,
        isSmoker: false,
        hasDiabetes: false,
        isOnBPMedication: false,
      };

      const result = service.calculateASCVDScore(data);

      expect(result.type).toBe('ascvd');
      expect(result.tenYearRisk).toBeGreaterThanOrEqual(0);
      expect(result.tenYearRisk).toBeLessThanOrEqual(100);
      expect(result.lifetimeRisk).toBeDefined();
      expect(result.optimalRisk).toBeDefined();
    });

    it('should return higher risk for patients with multiple risk factors', () => {
      const lowRiskData: PatientRiskData = {
        age: 45,
        gender: 'female',
        totalCholesterol: 180,
        hdlCholesterol: 60,
        systolicBP: 110,
        isSmoker: false,
        hasDiabetes: false,
        isOnBPMedication: false,
      };

      const highRiskData: PatientRiskData = {
        age: 65,
        gender: 'male',
        totalCholesterol: 280,
        hdlCholesterol: 35,
        systolicBP: 160,
        isSmoker: true,
        hasDiabetes: true,
        isOnBPMedication: true,
      };

      const lowRiskResult = service.calculateASCVDScore(lowRiskData);
      const highRiskResult = service.calculateASCVDScore(highRiskData);

      expect(highRiskResult.tenYearRisk).toBeGreaterThan(lowRiskResult.tenYearRisk);
    });

    it('should provide statin recommendations based on risk level', () => {
      const highRiskData: PatientRiskData = {
        age: 60,
        gender: 'male',
        totalCholesterol: 250,
        hdlCholesterol: 40,
        ldlCholesterol: 150,
        systolicBP: 150,
        isSmoker: true,
        hasDiabetes: true,
        isOnBPMedication: true,
      };

      const result = service.calculateASCVDScore(highRiskData);

      // High risk patients should get statin recommendations
      const hasStatinRec = result.recommendations.some(r =>
        r.toLowerCase().includes('statine')
      );
      expect(hasStatinRec).toBe(true);
    });
  });

  describe('saveRiskScore', () => {
    it('should save risk score to database', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      mockPrepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
      });

      const result = {
        type: 'framingham' as const,
        score: 15,
        riskPercentage: 12,
        tenYearRisk: 12,
        heartAge: 65,
        riskCategory: 'moderate' as const,
        recommendations: ['Rec 1', 'Rec 2'],
        calculatedAt: new Date(),
      };

      const id = await service.saveRiskScore(
        'patient-001',
        'org-001',
        'framingham',
        result,
        'user-001'
      );

      expect(id).toBeDefined();
      expect(mockPrepare).toHaveBeenCalled();
    });
  });

  describe('getPatientRiskHistory', () => {
    it('should return patient risk score history', async () => {
      const mockPrepare = mockDb.prepare as ReturnType<typeof vi.fn>;
      const mockHistory = [
        {
          id: 'score-001',
          patient_id: 'patient-001',
          score_type: 'framingham',
          score_value: 15,
          risk_percentage: 12,
          risk_category: 'moderate',
          recommendations: JSON.stringify(['Rec 1']),
          calculation_date: '2024-01-15T10:00:00Z',
        },
        {
          id: 'score-002',
          patient_id: 'patient-001',
          score_type: 'ascvd',
          score_value: 8.5,
          risk_percentage: 8.5,
          risk_category: 'moderate',
          recommendations: JSON.stringify(['Rec 2']),
          calculation_date: '2024-01-10T10:00:00Z',
        },
      ];

      mockPrepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: mockHistory }),
      });

      const history = await service.getPatientRiskHistory('patient-001', 'org-001');

      expect(history).toHaveLength(2);
      expect(history[0].recommendations).toEqual(['Rec 1']);
      expect(history[1].recommendations).toEqual(['Rec 2']);
    });
  });
});
