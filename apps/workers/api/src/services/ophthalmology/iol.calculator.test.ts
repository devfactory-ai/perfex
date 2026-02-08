/**
 * IOL Calculator Tests
 * Tests for intraocular lens power calculations
 */

import { describe, it, expect } from 'vitest';
import {
  IOLCalculator,
  type BiometryData,
  type IOLConstants,
  type PatientData,
  STANDARD_IOL_CONSTANTS,
  calculateSphericalEquivalent,
  estimatePowerChange,
  calculateToricCylinder,
} from './iol.calculator';

describe('IOLCalculator', () => {
  // =========================================================================
  // SRK/T Formula Tests
  // =========================================================================
  describe('SRK/T Formula', () => {
    it('should calculate IOL power for normal eye', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
      };
      const patientData: PatientData = {
        targetRefraction: -0.25,
      };

      const calculator = new IOLCalculator(biometry, 'default', patientData);
      const result = calculator.calculateSRKT();

      expect(result.formula).toBe('SRK/T');
      expect(result.recommendedPower).toBeGreaterThan(15);
      expect(result.recommendedPower).toBeLessThan(25);
      expect(result.confidence).toBe('high');
    });

    it('should calculate lower power for long eye', () => {
      const biometry: BiometryData = {
        axialLength: 27.0,
        k1: 43.0,
        k2: 43.5,
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateSRKT();

      expect(result.recommendedPower).toBeLessThan(15);
      expect(result.confidence).toBe('low');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should calculate higher power for short eye', () => {
      const biometry: BiometryData = {
        axialLength: 21.5,
        k1: 45.0,
        k2: 45.5,
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateSRKT();

      expect(result.recommendedPower).toBeGreaterThan(25);
      expect(result.confidence).not.toBe('high');
    });

    it('should warn about high astigmatism', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 42.0,
        k2: 45.0, // 3D difference
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateSRKT();

      const hasAstigmatismWarning = result.warnings.some(w =>
        w.toLowerCase().includes('astigmatisme') || w.toLowerCase().includes('torique')
      );
      expect(hasAstigmatismWarning).toBe(true);
    });
  });

  // =========================================================================
  // Holladay 1 Formula Tests
  // =========================================================================
  describe('Holladay 1 Formula', () => {
    it('should calculate IOL power for normal eye', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
        wtw: 11.5,
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateHolladay1();

      expect(result.formula).toBe('Holladay 1');
      expect(result.recommendedPower).toBeGreaterThan(15);
      expect(result.recommendedPower).toBeLessThan(25);
      expect(result.elp).toBeGreaterThan(0);
    });

    it('should provide power options', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateHolladay1();

      expect(result.powerOptions.length).toBeGreaterThan(0);
      expect(result.powerOptions[0]).toHaveProperty('power');
      expect(result.powerOptions[0]).toHaveProperty('expectedRefraction');
      expect(result.powerOptions[0]).toHaveProperty('deviation');
    });
  });

  // =========================================================================
  // Haigis Formula Tests
  // =========================================================================
  describe('Haigis Formula', () => {
    it('should calculate IOL power with ACD measurement', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
        acd: 3.2,
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateHaigis();

      expect(result.formula).toBe('Haigis');
      expect(result.recommendedPower).toBeGreaterThan(15);
      expect(result.recommendedPower).toBeLessThan(25);
      expect(result.confidence).toBe('high');
    });

    it('should warn when ACD is not provided', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
        // No ACD
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateHaigis();

      expect(result.confidence).not.toBe('high');
    });

    it('should use custom Haigis constants when provided', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
        acd: 3.2,
      };
      const iolConstants: IOLConstants = {
        aConstant: 118.7,
        haigisA0: 1.5,
        haigisA1: 0.35,
        haigisA2: 0.15,
      };

      const calculator = new IOLCalculator(biometry, iolConstants);
      const result = calculator.calculateHaigis();

      expect(result.elp).toBeDefined();
    });
  });

  // =========================================================================
  // Barrett Universal II Formula Tests
  // =========================================================================
  describe('Barrett Universal II Formula', () => {
    it('should calculate IOL power with complete biometry', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
        acd: 3.2,
        lensThickness: 4.5,
        wtw: 11.7,
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateBarrett();

      expect(result.formula).toBe('Barrett Universal II');
      expect(result.recommendedPower).toBeGreaterThan(15);
      expect(result.recommendedPower).toBeLessThan(25);
      expect(result.confidence).toBe('high');
    });

    it('should reduce confidence with incomplete biometry', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
        // Missing ACD and LT
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateBarrett();

      expect(result.confidence).toBe('medium');
    });

    it('should adjust for long eyes', () => {
      const normalBiometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
        acd: 3.2,
        lensThickness: 4.5,
      };
      const longBiometry: BiometryData = {
        axialLength: 27.5,
        k1: 43.5,
        k2: 44.0,
        acd: 3.5,
        lensThickness: 4.5,
      };

      const normalCalc = new IOLCalculator(normalBiometry);
      const longCalc = new IOLCalculator(longBiometry);

      const normalResult = normalCalc.calculateBarrett();
      const longResult = longCalc.calculateBarrett();

      expect(longResult.recommendedPower).toBeLessThan(normalResult.recommendedPower);
    });
  });

  // =========================================================================
  // Multi-Formula Tests
  // =========================================================================
  describe('calculateAll Multi-Formula', () => {
    it('should calculate with all formulas', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
        acd: 3.2,
        lensThickness: 4.5,
        wtw: 11.7,
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateAll();

      expect(result.srkt).toBeDefined();
      expect(result.holladay1).toBeDefined();
      expect(result.haigis).toBeDefined();
      expect(result.barrett).toBeDefined();
      expect(result.optimizedRecommendation).toBeDefined();
    });

    it('should provide optimized recommendation', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
        acd: 3.2,
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateAll();

      expect(result.optimizedRecommendation.power).toBeGreaterThan(0);
      expect(result.optimizedRecommendation.agreementScore).toBeLessThanOrEqual(100);
      expect(result.optimizedRecommendation.formulas.length).toBeGreaterThan(0);
    });

    it('should recommend specific formulas for short eyes', () => {
      const biometry: BiometryData = {
        axialLength: 21.0,
        k1: 45.0,
        k2: 45.5,
        acd: 2.8,
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateAll();

      const hasShortEyeRecommendation = result.recommendations.some(r =>
        r.toLowerCase().includes('court') || r.toLowerCase().includes('short')
      );
      expect(hasShortEyeRecommendation).toBe(true);
    });

    it('should recommend specific formulas for long eyes', () => {
      const biometry: BiometryData = {
        axialLength: 27.5,
        k1: 42.0,
        k2: 42.5,
        acd: 3.8,
      };

      const calculator = new IOLCalculator(biometry);
      const result = calculator.calculateAll();

      const hasLongEyeRecommendation = result.recommendations.some(r =>
        r.toLowerCase().includes('long') || r.toLowerCase().includes('barrett')
      );
      expect(hasLongEyeRecommendation).toBe(true);
    });
  });

  // =========================================================================
  // Post-Refractive Surgery Tests
  // =========================================================================
  describe('Post-Refractive Surgery', () => {
    it('should use corrected K for post-LASIK patients', () => {
      const biometry: BiometryData = {
        axialLength: 24.0,
        k1: 38.0, // Flat post-LASIK
        k2: 38.5,
      };
      const patientData: PatientData = {
        targetRefraction: 0,
        postLasik: true,
        preLasikK1: 43.5,
        preLasikK2: 44.0,
        preLasikRefraction: -5.0,
        currentRefraction: 0,
      };

      const calculator = new IOLCalculator(biometry, 'default', patientData);
      const result = calculator.calculateAll();

      expect(result.recommendations.some(r =>
        r.toLowerCase().includes('lasik') || r.toLowerCase().includes('réfractive')
      )).toBe(true);
    });

    it('should warn about missing pre-op data', () => {
      const biometry: BiometryData = {
        axialLength: 24.0,
        k1: 38.0,
        k2: 38.5,
      };
      const patientData: PatientData = {
        targetRefraction: 0,
        postLasik: true,
        // No pre-op data
      };

      const calculator = new IOLCalculator(biometry, 'default', patientData);
      const result = calculator.calculateSRKT();

      const hasMissingDataWarning = result.warnings.some(w =>
        w.toLowerCase().includes('pré-lasik') || w.toLowerCase().includes('manquant')
      );
      expect(hasMissingDataWarning).toBe(true);
    });
  });

  // =========================================================================
  // IOL Constants Tests
  // =========================================================================
  describe('IOL Constants', () => {
    it('should have standard constants for common lenses', () => {
      expect(STANDARD_IOL_CONSTANTS['SA60AT']).toBeDefined();
      expect(STANDARD_IOL_CONSTANTS['SA60AT'].aConstant).toBe(118.7);
    });

    it('should use default constants when lens not found', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
      };

      const calculator = new IOLCalculator(biometry, 'unknown_lens');
      const result = calculator.calculateSRKT();

      expect(result.recommendedPower).toBeGreaterThan(0);
    });

    it('should accept custom constants', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
      };
      const customConstants: IOLConstants = {
        aConstant: 119.5,
        haigisA0: 1.8,
        haigisA1: 0.5,
        haigisA2: 0.2,
      };

      const calculator = new IOLCalculator(biometry, customConstants);
      const result = calculator.calculateSRKT();

      expect(result.recommendedPower).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Static Method Tests
  // =========================================================================
  describe('Static Methods', () => {
    it('should recommend formulas based on axial length', () => {
      const shortEyeFormulas = IOLCalculator.getRecommendedFormulas(21.0);
      expect(shortEyeFormulas).toContain('Haigis');

      const normalEyeFormulas = IOLCalculator.getRecommendedFormulas(23.5);
      expect(normalEyeFormulas).toContain('Barrett Universal II');

      const longEyeFormulas = IOLCalculator.getRecommendedFormulas(28.0);
      expect(longEyeFormulas).toContain('Barrett Universal II');
    });

    it('should recommend post-refractive formulas', () => {
      const formulas = IOLCalculator.getRecommendedFormulas(24.0, true);
      expect(formulas).toContain('Barrett True K');
      expect(formulas).toContain('Haigis-L');
    });
  });

  // =========================================================================
  // Utility Function Tests
  // =========================================================================
  describe('Utility Functions', () => {
    it('should calculate spherical equivalent', () => {
      const se = calculateSphericalEquivalent(-2.0, -1.5);
      expect(se).toBe(-2.75);
    });

    it('should estimate power change', () => {
      const powerChange = estimatePowerChange(1.0);
      expect(powerChange).toBe(1.5);
    });

    it('should calculate toric cylinder', () => {
      const result = calculateToricCylinder(2.5, 0.3, 90);
      expect(result.cylinder).toBeGreaterThan(0);
      expect(result.axis).toBe(90);
    });
  });

  // =========================================================================
  // Edge Cases & Validation Tests
  // =========================================================================
  describe('Edge Cases & Validation', () => {
    it('should handle extreme axial length values', () => {
      const nanophthalmic: BiometryData = {
        axialLength: 19.5,
        k1: 48.0,
        k2: 48.5,
      };

      const calculator = new IOLCalculator(nanophthalmic);
      const result = calculator.calculateSRKT();

      expect(result.warnings.some(w =>
        w.toLowerCase().includes('nanophtalme') || w.toLowerCase().includes('très court')
      )).toBe(true);
    });

    it('should handle steep keratometry', () => {
      const steepK: BiometryData = {
        axialLength: 23.5,
        k1: 48.0,
        k2: 49.0,
      };

      const calculator = new IOLCalculator(steepK);
      const result = calculator.calculateSRKT();

      expect(result.warnings.some(w =>
        w.toLowerCase().includes('kératocône') || w.toLowerCase().includes('cambrée')
      )).toBe(true);
    });

    it('should handle narrow ACD', () => {
      const narrowACD: BiometryData = {
        axialLength: 22.0,
        k1: 44.0,
        k2: 44.5,
        acd: 2.2,
      };

      const calculator = new IOLCalculator(narrowACD);
      const result = calculator.calculateHaigis();

      expect(result.warnings.some(w =>
        w.toLowerCase().includes('chambre') || w.toLowerCase().includes('étroite')
      )).toBe(true);
    });

    it('should generate power options sorted by deviation', () => {
      const biometry: BiometryData = {
        axialLength: 23.5,
        k1: 43.5,
        k2: 44.0,
      };
      const patientData: PatientData = {
        targetRefraction: -0.5,
      };

      const calculator = new IOLCalculator(biometry, 'default', patientData);
      const result = calculator.calculateSRKT();

      // Power options should be sorted by deviation (smallest first)
      for (let i = 1; i < result.powerOptions.length; i++) {
        expect(result.powerOptions[i].deviation).toBeGreaterThanOrEqual(
          result.powerOptions[i - 1].deviation
        );
      }
    });
  });
});
