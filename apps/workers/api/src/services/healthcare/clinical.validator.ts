/**
 * Clinical Data Validator Service
 * Validates healthcare data for clinical safety and data integrity
 *
 * Features:
 * - Vital signs validation with clinical ranges
 * - Laboratory results validation
 * - Drug interaction checking
 * - Age/sex-specific reference ranges
 * - Critical value alerts
 */

import { logger } from '../../utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  field: string;
  value: any;
  message: string;
  severity: 'info' | 'warning' | 'critical' | 'error';
  referenceRange?: string;
  clinicalNote?: string;
}

export interface ValidationContext {
  age?: number;
  sex?: 'male' | 'female';
  weight?: number;          // kg
  height?: number;          // cm
  pregnant?: boolean;
  chronicConditions?: string[];
  currentMedications?: string[];
}

// ============================================================================
// Vital Signs Validation
// ============================================================================

export interface VitalSigns {
  heartRate?: number;           // bpm
  systolicBP?: number;          // mmHg
  diastolicBP?: number;         // mmHg
  temperature?: number;         // °C
  respiratoryRate?: number;     // breaths/min
  oxygenSaturation?: number;    // %
  weight?: number;              // kg
  height?: number;              // cm
  bmi?: number;
  bloodGlucose?: number;        // mg/dL
  painScore?: number;           // 0-10
}

export class VitalSignsValidator {
  /**
   * Validate all vital signs
   */
  static validate(vitals: VitalSigns, context?: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];

    if (vitals.heartRate !== undefined) {
      results.push(this.validateHeartRate(vitals.heartRate, context));
    }

    if (vitals.systolicBP !== undefined || vitals.diastolicBP !== undefined) {
      results.push(...this.validateBloodPressure(
        vitals.systolicBP,
        vitals.diastolicBP,
        context
      ));
    }

    if (vitals.temperature !== undefined) {
      results.push(this.validateTemperature(vitals.temperature));
    }

    if (vitals.respiratoryRate !== undefined) {
      results.push(this.validateRespiratoryRate(vitals.respiratoryRate, context));
    }

    if (vitals.oxygenSaturation !== undefined) {
      results.push(this.validateOxygenSaturation(vitals.oxygenSaturation, context));
    }

    if (vitals.bmi !== undefined) {
      results.push(this.validateBMI(vitals.bmi, context));
    } else if (vitals.weight && vitals.height) {
      const bmi = vitals.weight / Math.pow(vitals.height / 100, 2);
      results.push(this.validateBMI(bmi, context));
    }

    if (vitals.bloodGlucose !== undefined) {
      results.push(this.validateBloodGlucose(vitals.bloodGlucose, context));
    }

    if (vitals.painScore !== undefined) {
      results.push(this.validatePainScore(vitals.painScore));
    }

    return results;
  }

  static validateHeartRate(hr: number, context?: ValidationContext): ValidationResult {
    const age = context?.age || 50;

    // Age-adjusted ranges
    let normalMin = 60;
    let normalMax = 100;

    if (age < 1) { normalMin = 100; normalMax = 160; }
    else if (age < 3) { normalMin = 90; normalMax = 150; }
    else if (age < 5) { normalMin = 80; normalMax = 140; }
    else if (age < 12) { normalMin = 70; normalMax = 120; }
    else if (age < 18) { normalMin = 60; normalMax = 100; }
    else { normalMin = 60; normalMax = 100; }

    if (hr < 30 || hr > 200) {
      return {
        isValid: false,
        field: 'heartRate',
        value: hr,
        message: `Fréquence cardiaque critique: ${hr} bpm`,
        severity: 'critical',
        referenceRange: `${normalMin}-${normalMax} bpm`,
        clinicalNote: hr < 30 ? 'Bradycardie sévère - risque syncope/arrêt' : 'Tachycardie sévère - évaluation urgente requise',
      };
    } else if (hr < normalMin - 10 || hr > normalMax + 20) {
      return {
        isValid: true,
        field: 'heartRate',
        value: hr,
        message: `Fréquence cardiaque anormale: ${hr} bpm`,
        severity: 'warning',
        referenceRange: `${normalMin}-${normalMax} bpm`,
      };
    }

    return {
      isValid: true,
      field: 'heartRate',
      value: hr,
      message: 'Fréquence cardiaque normale',
      severity: 'info',
      referenceRange: `${normalMin}-${normalMax} bpm`,
    };
  }

  static validateBloodPressure(
    systolic?: number,
    diastolic?: number,
    context?: ValidationContext
  ): ValidationResult[] {
    const results: ValidationResult[] = [];

    if (systolic !== undefined) {
      if (systolic < 70) {
        results.push({
          isValid: false,
          field: 'systolicBP',
          value: systolic,
          message: `Hypotension sévère: ${systolic} mmHg`,
          severity: 'critical',
          referenceRange: '90-140 mmHg',
          clinicalNote: 'Choc probable - intervention urgente requise',
        });
      } else if (systolic >= 180) {
        results.push({
          isValid: false,
          field: 'systolicBP',
          value: systolic,
          message: `Crise hypertensive: ${systolic} mmHg`,
          severity: 'critical',
          referenceRange: '90-140 mmHg',
          clinicalNote: 'Urgence hypertensive - rechercher atteinte d\'organe cible',
        });
      } else if (systolic < 90 || systolic >= 140) {
        results.push({
          isValid: true,
          field: 'systolicBP',
          value: systolic,
          message: `Pression artérielle anormale: ${systolic} mmHg`,
          severity: 'warning',
          referenceRange: '90-140 mmHg',
        });
      } else {
        results.push({
          isValid: true,
          field: 'systolicBP',
          value: systolic,
          message: 'Pression systolique normale',
          severity: 'info',
          referenceRange: '90-140 mmHg',
        });
      }
    }

    if (diastolic !== undefined) {
      if (diastolic >= 120) {
        results.push({
          isValid: false,
          field: 'diastolicBP',
          value: diastolic,
          message: `Diastolique critique: ${diastolic} mmHg`,
          severity: 'critical',
          referenceRange: '60-90 mmHg',
        });
      } else if (diastolic < 50 || diastolic >= 90) {
        results.push({
          isValid: true,
          field: 'diastolicBP',
          value: diastolic,
          message: `Diastolique anormale: ${diastolic} mmHg`,
          severity: 'warning',
          referenceRange: '60-90 mmHg',
        });
      } else {
        results.push({
          isValid: true,
          field: 'diastolicBP',
          value: diastolic,
          message: 'Pression diastolique normale',
          severity: 'info',
          referenceRange: '60-90 mmHg',
        });
      }
    }

    // Check pulse pressure
    if (systolic !== undefined && diastolic !== undefined) {
      const pulsePressure = systolic - diastolic;
      if (pulsePressure > 60) {
        results.push({
          isValid: true,
          field: 'pulsePressure',
          value: pulsePressure,
          message: `Pression pulsée élevée: ${pulsePressure} mmHg`,
          severity: 'warning',
          clinicalNote: 'Rigidité artérielle ou insuffisance aortique possible',
        });
      } else if (pulsePressure < 25) {
        results.push({
          isValid: true,
          field: 'pulsePressure',
          value: pulsePressure,
          message: `Pression pulsée basse: ${pulsePressure} mmHg`,
          severity: 'warning',
          clinicalNote: 'Sténose aortique ou tamponnade possible',
        });
      }
    }

    return results;
  }

  static validateTemperature(temp: number): ValidationResult {
    if (temp < 35.0) {
      return {
        isValid: false,
        field: 'temperature',
        value: temp,
        message: `Hypothermie: ${temp}°C`,
        severity: temp < 32 ? 'critical' : 'warning',
        referenceRange: '36.5-37.5°C',
        clinicalNote: temp < 32 ? 'Hypothermie sévère - réchauffement urgent' : 'Hypothermie modérée',
      };
    } else if (temp > 40.0) {
      return {
        isValid: false,
        field: 'temperature',
        value: temp,
        message: `Hyperthermie sévère: ${temp}°C`,
        severity: 'critical',
        referenceRange: '36.5-37.5°C',
        clinicalNote: 'Risque de convulsions - refroidissement urgent',
      };
    } else if (temp >= 38.5) {
      return {
        isValid: true,
        field: 'temperature',
        value: temp,
        message: `Fièvre élevée: ${temp}°C`,
        severity: 'warning',
        referenceRange: '36.5-37.5°C',
      };
    } else if (temp >= 37.5) {
      return {
        isValid: true,
        field: 'temperature',
        value: temp,
        message: `Fébricule: ${temp}°C`,
        severity: 'info',
        referenceRange: '36.5-37.5°C',
      };
    }

    return {
      isValid: true,
      field: 'temperature',
      value: temp,
      message: 'Température normale',
      severity: 'info',
      referenceRange: '36.5-37.5°C',
    };
  }

  static validateRespiratoryRate(rr: number, context?: ValidationContext): ValidationResult {
    const age = context?.age || 50;

    let normalMin = 12;
    let normalMax = 20;

    if (age < 1) { normalMin = 30; normalMax = 60; }
    else if (age < 3) { normalMin = 24; normalMax = 40; }
    else if (age < 6) { normalMin = 22; normalMax = 34; }
    else if (age < 12) { normalMin = 18; normalMax = 30; }
    else if (age < 18) { normalMin = 12; normalMax = 20; }

    if (rr < 8 || rr > 40) {
      return {
        isValid: false,
        field: 'respiratoryRate',
        value: rr,
        message: `Fréquence respiratoire critique: ${rr}/min`,
        severity: 'critical',
        referenceRange: `${normalMin}-${normalMax}/min`,
        clinicalNote: rr < 8 ? 'Bradypnée sévère - support ventilatoire à considérer' : 'Tachypnée sévère - détresse respiratoire probable',
      };
    } else if (rr < normalMin || rr > normalMax) {
      return {
        isValid: true,
        field: 'respiratoryRate',
        value: rr,
        message: `Fréquence respiratoire anormale: ${rr}/min`,
        severity: 'warning',
        referenceRange: `${normalMin}-${normalMax}/min`,
      };
    }

    return {
      isValid: true,
      field: 'respiratoryRate',
      value: rr,
      message: 'Fréquence respiratoire normale',
      severity: 'info',
      referenceRange: `${normalMin}-${normalMax}/min`,
    };
  }

  static validateOxygenSaturation(spo2: number, context?: ValidationContext): ValidationResult {
    const hasCOPD = context?.chronicConditions?.includes('COPD') ||
                    context?.chronicConditions?.includes('BPCO');

    if (spo2 < 88) {
      return {
        isValid: false,
        field: 'oxygenSaturation',
        value: spo2,
        message: `Hypoxémie sévère: SpO2 ${spo2}%`,
        severity: 'critical',
        referenceRange: hasCOPD ? '88-92%' : '95-100%',
        clinicalNote: 'Oxygénothérapie urgente requise',
      };
    } else if (spo2 < 92) {
      return {
        isValid: hasCOPD || false,
        field: 'oxygenSaturation',
        value: spo2,
        message: `SpO2 basse: ${spo2}%`,
        severity: hasCOPD ? 'info' : 'warning',
        referenceRange: hasCOPD ? '88-92%' : '95-100%',
        clinicalNote: hasCOPD ? 'Acceptable si BPCO' : 'Évaluer besoin en oxygène',
      };
    } else if (spo2 < 95 && !hasCOPD) {
      return {
        isValid: true,
        field: 'oxygenSaturation',
        value: spo2,
        message: `SpO2 limite: ${spo2}%`,
        severity: 'warning',
        referenceRange: '95-100%',
      };
    }

    return {
      isValid: true,
      field: 'oxygenSaturation',
      value: spo2,
      message: 'Saturation normale',
      severity: 'info',
      referenceRange: hasCOPD ? '88-92%' : '95-100%',
    };
  }

  static validateBMI(bmi: number, context?: ValidationContext): ValidationResult {
    let category: string;
    let severity: ValidationResult['severity'] = 'info';

    if (bmi < 16) {
      category = 'Maigreur sévère';
      severity = 'critical';
    } else if (bmi < 18.5) {
      category = 'Insuffisance pondérale';
      severity = 'warning';
    } else if (bmi < 25) {
      category = 'Poids normal';
    } else if (bmi < 30) {
      category = 'Surpoids';
      severity = 'warning';
    } else if (bmi < 35) {
      category = 'Obésité classe I';
      severity = 'warning';
    } else if (bmi < 40) {
      category = 'Obésité classe II';
      severity = 'warning';
    } else {
      category = 'Obésité classe III (morbide)';
      severity = 'critical';
    }

    return {
      isValid: bmi >= 16 && bmi < 40,
      field: 'bmi',
      value: Math.round(bmi * 10) / 10,
      message: `IMC: ${bmi.toFixed(1)} kg/m² - ${category}`,
      severity,
      referenceRange: '18.5-24.9 kg/m²',
    };
  }

  static validateBloodGlucose(glucose: number, context?: ValidationContext): ValidationResult {
    const diabetic = context?.chronicConditions?.includes('diabetes') ||
                     context?.chronicConditions?.includes('diabete');

    if (glucose < 40) {
      return {
        isValid: false,
        field: 'bloodGlucose',
        value: glucose,
        message: `Hypoglycémie sévère: ${glucose} mg/dL`,
        severity: 'critical',
        referenceRange: '70-100 mg/dL (à jeun)',
        clinicalNote: 'Resucrage urgent - risque de coma',
      };
    } else if (glucose < 70) {
      return {
        isValid: false,
        field: 'bloodGlucose',
        value: glucose,
        message: `Hypoglycémie: ${glucose} mg/dL`,
        severity: 'warning',
        referenceRange: '70-100 mg/dL (à jeun)',
        clinicalNote: 'Resucrage recommandé',
      };
    } else if (glucose > 400) {
      return {
        isValid: false,
        field: 'bloodGlucose',
        value: glucose,
        message: `Hyperglycémie sévère: ${glucose} mg/dL`,
        severity: 'critical',
        referenceRange: '70-100 mg/dL (à jeun)',
        clinicalNote: 'Risque d\'acidocétose - correction urgente',
      };
    } else if (glucose > 200) {
      return {
        isValid: true,
        field: 'bloodGlucose',
        value: glucose,
        message: `Hyperglycémie: ${glucose} mg/dL`,
        severity: 'warning',
        referenceRange: diabetic ? '<180 mg/dL (PP)' : '70-100 mg/dL',
      };
    } else if (glucose > 126 && !diabetic) {
      return {
        isValid: true,
        field: 'bloodGlucose',
        value: glucose,
        message: `Glycémie élevée: ${glucose} mg/dL`,
        severity: 'warning',
        referenceRange: '70-100 mg/dL (à jeun)',
        clinicalNote: 'Possible diabète - confirmer par HbA1c',
      };
    }

    return {
      isValid: true,
      field: 'bloodGlucose',
      value: glucose,
      message: 'Glycémie normale',
      severity: 'info',
      referenceRange: '70-100 mg/dL (à jeun)',
    };
  }

  static validatePainScore(score: number): ValidationResult {
    if (score < 0 || score > 10) {
      return {
        isValid: false,
        field: 'painScore',
        value: score,
        message: 'Score de douleur invalide',
        severity: 'error',
        referenceRange: '0-10',
      };
    }

    if (score >= 7) {
      return {
        isValid: true,
        field: 'painScore',
        value: score,
        message: `Douleur sévère: ${score}/10`,
        severity: 'warning',
        clinicalNote: 'Analgésie urgente requise',
      };
    } else if (score >= 4) {
      return {
        isValid: true,
        field: 'painScore',
        value: score,
        message: `Douleur modérée: ${score}/10`,
        severity: 'info',
      };
    }

    return {
      isValid: true,
      field: 'painScore',
      value: score,
      message: `Douleur légère: ${score}/10`,
      severity: 'info',
    };
  }
}

// ============================================================================
// Laboratory Results Validation
// ============================================================================

export interface LabResults {
  // Hematology
  hemoglobin?: number;          // g/dL
  hematocrit?: number;          // %
  wbc?: number;                 // x10^9/L
  platelets?: number;           // x10^9/L
  inr?: number;

  // Chemistry
  sodium?: number;              // mEq/L
  potassium?: number;           // mEq/L
  chloride?: number;            // mEq/L
  bicarbonate?: number;         // mEq/L
  bun?: number;                 // mg/dL
  creatinine?: number;          // mg/dL
  glucose?: number;             // mg/dL
  calcium?: number;             // mg/dL
  magnesium?: number;           // mg/dL
  phosphorus?: number;          // mg/dL

  // Liver function
  ast?: number;                 // U/L
  alt?: number;                 // U/L
  alkalinePhosphatase?: number; // U/L
  totalBilirubin?: number;      // mg/dL
  albumin?: number;             // g/dL

  // Cardiac markers
  troponin?: number;            // ng/mL
  bnp?: number;                 // pg/mL
  ntProBnp?: number;            // pg/mL

  // Inflammatory
  crp?: number;                 // mg/L
  procalcitonin?: number;       // ng/mL

  // Thyroid
  tsh?: number;                 // mIU/L
  t3?: number;                  // ng/dL
  t4?: number;                  // μg/dL

  // Lipids
  totalCholesterol?: number;    // mg/dL
  ldl?: number;                 // mg/dL
  hdl?: number;                 // mg/dL
  triglycerides?: number;       // mg/dL

  // Diabetes
  hba1c?: number;               // %
  fastingGlucose?: number;      // mg/dL

  // Kidney
  egfr?: number;                // mL/min/1.73m²
  uricAcid?: number;            // mg/dL
}

interface LabReference {
  name: string;
  unit: string;
  normalMin: number;
  normalMax: number;
  criticalLow?: number;
  criticalHigh?: number;
  maleRange?: [number, number];
  femaleRange?: [number, number];
}

export class LabResultsValidator {
  private static references: Record<string, LabReference> = {
    hemoglobin: {
      name: 'Hémoglobine',
      unit: 'g/dL',
      normalMin: 12,
      normalMax: 16,
      criticalLow: 7,
      criticalHigh: 20,
      maleRange: [13.5, 17.5],
      femaleRange: [12, 16],
    },
    hematocrit: {
      name: 'Hématocrite',
      unit: '%',
      normalMin: 36,
      normalMax: 48,
      criticalLow: 20,
      criticalHigh: 60,
      maleRange: [40, 54],
      femaleRange: [36, 48],
    },
    wbc: {
      name: 'Leucocytes',
      unit: 'x10⁹/L',
      normalMin: 4,
      normalMax: 10,
      criticalLow: 2,
      criticalHigh: 30,
    },
    platelets: {
      name: 'Plaquettes',
      unit: 'x10⁹/L',
      normalMin: 150,
      normalMax: 400,
      criticalLow: 50,
      criticalHigh: 1000,
    },
    inr: {
      name: 'INR',
      unit: '',
      normalMin: 0.8,
      normalMax: 1.2,
      criticalHigh: 4.5,
    },
    sodium: {
      name: 'Sodium',
      unit: 'mEq/L',
      normalMin: 136,
      normalMax: 145,
      criticalLow: 120,
      criticalHigh: 160,
    },
    potassium: {
      name: 'Potassium',
      unit: 'mEq/L',
      normalMin: 3.5,
      normalMax: 5.0,
      criticalLow: 2.5,
      criticalHigh: 6.5,
    },
    creatinine: {
      name: 'Créatinine',
      unit: 'mg/dL',
      normalMin: 0.7,
      normalMax: 1.3,
      criticalHigh: 10,
      maleRange: [0.7, 1.3],
      femaleRange: [0.6, 1.1],
    },
    bun: {
      name: 'Urée (BUN)',
      unit: 'mg/dL',
      normalMin: 7,
      normalMax: 20,
      criticalHigh: 100,
    },
    calcium: {
      name: 'Calcium',
      unit: 'mg/dL',
      normalMin: 8.5,
      normalMax: 10.5,
      criticalLow: 6.5,
      criticalHigh: 13,
    },
    magnesium: {
      name: 'Magnésium',
      unit: 'mg/dL',
      normalMin: 1.7,
      normalMax: 2.2,
      criticalLow: 1.0,
      criticalHigh: 4.0,
    },
    phosphorus: {
      name: 'Phosphore',
      unit: 'mg/dL',
      normalMin: 2.5,
      normalMax: 4.5,
      criticalLow: 1.0,
      criticalHigh: 9.0,
    },
    ast: {
      name: 'ASAT (AST)',
      unit: 'U/L',
      normalMin: 10,
      normalMax: 40,
      criticalHigh: 1000,
    },
    alt: {
      name: 'ALAT (ALT)',
      unit: 'U/L',
      normalMin: 7,
      normalMax: 56,
      criticalHigh: 1000,
    },
    totalBilirubin: {
      name: 'Bilirubine totale',
      unit: 'mg/dL',
      normalMin: 0.1,
      normalMax: 1.2,
      criticalHigh: 15,
    },
    albumin: {
      name: 'Albumine',
      unit: 'g/dL',
      normalMin: 3.5,
      normalMax: 5.0,
      criticalLow: 2.0,
    },
    troponin: {
      name: 'Troponine',
      unit: 'ng/mL',
      normalMin: 0,
      normalMax: 0.04,
      criticalHigh: 0.5,
    },
    bnp: {
      name: 'BNP',
      unit: 'pg/mL',
      normalMin: 0,
      normalMax: 100,
      criticalHigh: 500,
    },
    tsh: {
      name: 'TSH',
      unit: 'mIU/L',
      normalMin: 0.4,
      normalMax: 4.0,
      criticalLow: 0.01,
      criticalHigh: 100,
    },
    egfr: {
      name: 'DFGe',
      unit: 'mL/min/1.73m²',
      normalMin: 90,
      normalMax: 120,
      criticalLow: 15,
    },
    hba1c: {
      name: 'HbA1c',
      unit: '%',
      normalMin: 4,
      normalMax: 5.7,
      criticalHigh: 14,
    },
    crp: {
      name: 'CRP',
      unit: 'mg/L',
      normalMin: 0,
      normalMax: 5,
      criticalHigh: 200,
    },
  };

  /**
   * Validate all lab results
   */
  static validate(labs: LabResults, context?: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];

    for (const [key, value] of Object.entries(labs)) {
      if (value !== undefined && this.references[key]) {
        results.push(this.validateSingle(key, value, context));
      }
    }

    // Check for specific patterns
    results.push(...this.checkPatterns(labs, context));

    return results;
  }

  private static validateSingle(
    field: string,
    value: number,
    context?: ValidationContext
  ): ValidationResult {
    const ref = this.references[field];
    if (!ref) {
      return {
        isValid: true,
        field,
        value,
        message: 'Paramètre non validé',
        severity: 'info',
      };
    }

    // Use sex-specific ranges if available
    let normalMin = ref.normalMin;
    let normalMax = ref.normalMax;

    if (context?.sex === 'male' && ref.maleRange) {
      [normalMin, normalMax] = ref.maleRange;
    } else if (context?.sex === 'female' && ref.femaleRange) {
      [normalMin, normalMax] = ref.femaleRange;
    }

    // Check critical values
    if (ref.criticalLow !== undefined && value < ref.criticalLow) {
      return {
        isValid: false,
        field,
        value,
        message: `${ref.name} critique bas: ${value} ${ref.unit}`,
        severity: 'critical',
        referenceRange: `${normalMin}-${normalMax} ${ref.unit}`,
        clinicalNote: 'Valeur critique - action immédiate requise',
      };
    }

    if (ref.criticalHigh !== undefined && value > ref.criticalHigh) {
      return {
        isValid: false,
        field,
        value,
        message: `${ref.name} critique haut: ${value} ${ref.unit}`,
        severity: 'critical',
        referenceRange: `${normalMin}-${normalMax} ${ref.unit}`,
        clinicalNote: 'Valeur critique - action immédiate requise',
      };
    }

    // Check normal range
    if (value < normalMin || value > normalMax) {
      return {
        isValid: true,
        field,
        value,
        message: `${ref.name} anormal: ${value} ${ref.unit}`,
        severity: 'warning',
        referenceRange: `${normalMin}-${normalMax} ${ref.unit}`,
      };
    }

    return {
      isValid: true,
      field,
      value,
      message: `${ref.name} normal`,
      severity: 'info',
      referenceRange: `${normalMin}-${normalMax} ${ref.unit}`,
    };
  }

  private static checkPatterns(labs: LabResults, context?: ValidationContext): ValidationResult[] {
    const patterns: ValidationResult[] = [];

    // Anemia pattern
    if (labs.hemoglobin && labs.hemoglobin < 10) {
      const severity: ValidationResult['severity'] = labs.hemoglobin < 7 ? 'critical' : 'warning';
      patterns.push({
        isValid: labs.hemoglobin >= 7,
        field: 'pattern:anemia',
        value: labs.hemoglobin,
        message: `Anémie ${labs.hemoglobin < 7 ? 'sévère' : 'modérée'}`,
        severity,
        clinicalNote: labs.hemoglobin < 7 ? 'Transfusion à considérer' : 'Bilan étiologique recommandé',
      });
    }

    // Kidney disease pattern
    if (labs.egfr !== undefined) {
      let stage = '';
      if (labs.egfr < 15) stage = 'Stade 5 (insuffisance rénale terminale)';
      else if (labs.egfr < 30) stage = 'Stade 4';
      else if (labs.egfr < 45) stage = 'Stade 3b';
      else if (labs.egfr < 60) stage = 'Stade 3a';
      else if (labs.egfr < 90) stage = 'Stade 2';

      if (stage) {
        patterns.push({
          isValid: labs.egfr >= 15,
          field: 'pattern:ckd',
          value: labs.egfr,
          message: `Insuffisance rénale chronique ${stage}`,
          severity: labs.egfr < 15 ? 'critical' : labs.egfr < 30 ? 'warning' : 'info',
          clinicalNote: labs.egfr < 15 ? 'Dialyse ou greffe à prévoir' : 'Néphroprotection requise',
        });
      }
    }

    // Electrolyte imbalance pattern
    if (labs.potassium && labs.sodium) {
      if (labs.potassium > 5.5 && labs.creatinine && labs.creatinine > 2) {
        patterns.push({
          isValid: labs.potassium < 6.0,
          field: 'pattern:hyperkalemia_ckd',
          value: labs.potassium,
          message: 'Hyperkaliémie sur insuffisance rénale',
          severity: labs.potassium >= 6.0 ? 'critical' : 'warning',
          clinicalNote: 'Risque arythmie - ECG et traitement urgent',
        });
      }
    }

    // Hepatic pattern
    if (labs.ast && labs.alt && labs.totalBilirubin) {
      if (labs.ast > 1000 || labs.alt > 1000) {
        patterns.push({
          isValid: false,
          field: 'pattern:acute_hepatitis',
          value: Math.max(labs.ast, labs.alt),
          message: 'Cytolyse hépatique aiguë',
          severity: 'critical',
          clinicalNote: 'Hépatite aiguë - bilan étiologique urgent',
        });
      } else if (labs.totalBilirubin > 5 && labs.ast > 100) {
        patterns.push({
          isValid: false,
          field: 'pattern:liver_failure',
          value: labs.totalBilirubin,
          message: 'Insuffisance hépatique probable',
          severity: 'critical',
          clinicalNote: 'Rechercher signes d\'encéphalopathie',
        });
      }
    }

    // Cardiac marker pattern
    if (labs.troponin && labs.troponin > 0.04) {
      patterns.push({
        isValid: labs.troponin < 0.5,
        field: 'pattern:myocardial_injury',
        value: labs.troponin,
        message: 'Lésion myocardique détectée',
        severity: labs.troponin > 0.5 ? 'critical' : 'warning',
        clinicalNote: labs.troponin > 0.5 ?
          'Infarctus probable - coronarographie urgente' :
          'Troponine élevée - diagnostic différentiel requis',
      });
    }

    return patterns;
  }

  /**
   * Calculate eGFR using CKD-EPI equation
   */
  static calculateEGFR(
    creatinine: number,
    age: number,
    sex: 'male' | 'female',
    race: 'african_american' | 'other' = 'other'
  ): number {
    let kappa = sex === 'female' ? 0.7 : 0.9;
    let alpha = sex === 'female' ? -0.329 : -0.411;
    let sexMultiplier = sex === 'female' ? 1.018 : 1;
    let raceMultiplier = race === 'african_american' ? 1.159 : 1;

    const crKappa = creatinine / kappa;

    const egfr = 141 *
      Math.pow(Math.min(crKappa, 1), alpha) *
      Math.pow(Math.max(crKappa, 1), -1.209) *
      Math.pow(0.993, age) *
      sexMultiplier *
      raceMultiplier;

    return Math.round(egfr);
  }
}

// ============================================================================
// Drug Interaction Checker (Simplified)
// ============================================================================

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  recommendation: string;
}

export class DrugInteractionChecker {
  private static interactions: DrugInteraction[] = [
    // Anticoagulants
    {
      drug1: 'warfarin',
      drug2: 'aspirin',
      severity: 'major',
      description: 'Risque hémorragique augmenté',
      recommendation: 'Surveillance INR rapprochée, éviter si possible',
    },
    {
      drug1: 'warfarin',
      drug2: 'amiodarone',
      severity: 'major',
      description: 'Amiodarone inhibe le métabolisme de la warfarine',
      recommendation: 'Réduire dose warfarine de 30-50%, surveillance INR',
    },
    {
      drug1: 'rivaroxaban',
      drug2: 'ketoconazole',
      severity: 'contraindicated',
      description: 'Inhibition CYP3A4 augmente concentration rivaroxaban',
      recommendation: 'Association contre-indiquée',
    },

    // Cardiovascular
    {
      drug1: 'digoxin',
      drug2: 'amiodarone',
      severity: 'major',
      description: 'Amiodarone augmente concentration de digoxine',
      recommendation: 'Réduire dose digoxine de 50%, surveiller digoxinémie',
    },
    {
      drug1: 'beta-blocker',
      drug2: 'verapamil',
      severity: 'major',
      description: 'Risque de bradycardie sévère et bloc AV',
      recommendation: 'Association à éviter, surveillance ECG si nécessaire',
    },
    {
      drug1: 'ace-inhibitor',
      drug2: 'potassium',
      severity: 'moderate',
      description: 'Risque d\'hyperkaliémie',
      recommendation: 'Surveiller kaliémie régulièrement',
    },
    {
      drug1: 'ace-inhibitor',
      drug2: 'nsaid',
      severity: 'moderate',
      description: 'AINS diminuent effet antihypertenseur, risque rénal',
      recommendation: 'Surveiller TA et fonction rénale',
    },

    // Diabetes
    {
      drug1: 'metformin',
      drug2: 'contrast-agent',
      severity: 'major',
      description: 'Risque d\'acidose lactique post-produit de contraste',
      recommendation: 'Arrêter metformine 48h avant et après injection',
    },
    {
      drug1: 'sulfonylurea',
      drug2: 'fluconazole',
      severity: 'major',
      description: 'Inhibition CYP2C9 augmente risque hypoglycémie',
      recommendation: 'Surveiller glycémie, ajuster dose sulfamide',
    },

    // Nephrology
    {
      drug1: 'lithium',
      drug2: 'nsaid',
      severity: 'major',
      description: 'AINS augmentent lithiémie',
      recommendation: 'Éviter AINS, si nécessaire surveiller lithiémie',
    },
    {
      drug1: 'cyclosporine',
      drug2: 'erythromycin',
      severity: 'major',
      description: 'Érythromycine augmente concentration cyclosporine',
      recommendation: 'Surveillance taux cyclosporine, ajuster dose',
    },

    // Psychiatric
    {
      drug1: 'ssri',
      drug2: 'mao-inhibitor',
      severity: 'contraindicated',
      description: 'Syndrome sérotoninergique potentiellement fatal',
      recommendation: 'Association absolument contre-indiquée - wash-out requis',
    },
    {
      drug1: 'ssri',
      drug2: 'tramadol',
      severity: 'major',
      description: 'Risque de syndrome sérotoninergique',
      recommendation: 'Éviter association, surveillance clinique',
    },
  ];

  /**
   * Check for drug interactions
   */
  static check(medications: string[]): DrugInteraction[] {
    const found: DrugInteraction[] = [];
    const normalizedMeds = medications.map(m => this.normalizeDrugName(m));

    for (let i = 0; i < normalizedMeds.length; i++) {
      for (let j = i + 1; j < normalizedMeds.length; j++) {
        const interaction = this.findInteraction(normalizedMeds[i], normalizedMeds[j]);
        if (interaction) {
          found.push(interaction);
        }
      }
    }

    return found.sort((a, b) => {
      const severityOrder = { contraindicated: 0, major: 1, moderate: 2, minor: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  private static normalizeDrugName(name: string): string {
    const lower = name.toLowerCase().trim();

    // Drug class mappings
    const classMap: Record<string, string[]> = {
      'beta-blocker': ['metoprolol', 'atenolol', 'bisoprolol', 'carvedilol', 'propranolol', 'nebivolol'],
      'ace-inhibitor': ['lisinopril', 'enalapril', 'ramipril', 'perindopril', 'captopril', 'fosinopril'],
      'arb': ['losartan', 'valsartan', 'irbesartan', 'candesartan', 'olmesartan', 'telmisartan'],
      'statin': ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin', 'fluvastatin'],
      'nsaid': ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'meloxicam', 'indomethacin'],
      'ssri': ['fluoxetine', 'sertraline', 'paroxetine', 'citalopram', 'escitalopram', 'fluvoxamine'],
      'sulfonylurea': ['glibenclamide', 'gliclazide', 'glimepiride', 'glipizide'],
      'aod': ['rivaroxaban', 'apixaban', 'dabigatran', 'edoxaban'],
    };

    for (const [className, drugs] of Object.entries(classMap)) {
      if (drugs.some(d => lower.includes(d))) {
        return className;
      }
    }

    return lower;
  }

  private static findInteraction(drug1: string, drug2: string): DrugInteraction | null {
    return this.interactions.find(i =>
      (i.drug1 === drug1 && i.drug2 === drug2) ||
      (i.drug1 === drug2 && i.drug2 === drug1)
    ) || null;
  }
}

// ============================================================================
// Main Clinical Validator Export
// ============================================================================

export class ClinicalValidator {
  static VitalSigns = VitalSignsValidator;
  static LabResults = LabResultsValidator;
  static DrugInteractions = DrugInteractionChecker;

  /**
   * Comprehensive validation of all clinical data
   */
  static validateAll(data: {
    vitals?: VitalSigns;
    labs?: LabResults;
    medications?: string[];
    context?: ValidationContext;
  }): {
    results: ValidationResult[];
    criticalAlerts: ValidationResult[];
    warnings: ValidationResult[];
    drugInteractions: DrugInteraction[];
    summary: string;
  } {
    let results: ValidationResult[] = [];
    const context = data.context || {};

    // Validate vitals
    if (data.vitals) {
      results.push(...this.VitalSigns.validate(data.vitals, context));
    }

    // Validate labs
    if (data.labs) {
      results.push(...this.LabResults.validate(data.labs, context));
    }

    // Check drug interactions
    const drugInteractions = data.medications ?
      this.DrugInteractions.check(data.medications) : [];

    // Separate by severity
    const criticalAlerts = results.filter(r => r.severity === 'critical');
    const warnings = results.filter(r => r.severity === 'warning');

    // Generate summary
    const summary = this.generateSummary(criticalAlerts, warnings, drugInteractions);

    return {
      results,
      criticalAlerts,
      warnings,
      drugInteractions,
      summary,
    };
  }

  private static generateSummary(
    criticals: ValidationResult[],
    warnings: ValidationResult[],
    interactions: DrugInteraction[]
  ): string {
    const parts: string[] = [];

    if (criticals.length > 0) {
      parts.push(`${criticals.length} ALERTE(S) CRITIQUE(S)`);
    }
    if (warnings.length > 0) {
      parts.push(`${warnings.length} avertissement(s)`);
    }

    const contraindicated = interactions.filter(i => i.severity === 'contraindicated').length;
    const majorInteractions = interactions.filter(i => i.severity === 'major').length;

    if (contraindicated > 0) {
      parts.push(`${contraindicated} interaction(s) contre-indiquée(s)`);
    }
    if (majorInteractions > 0) {
      parts.push(`${majorInteractions} interaction(s) majeure(s)`);
    }

    if (parts.length === 0) {
      return 'Validation clinique: aucune anomalie détectée';
    }

    return `Validation clinique: ${parts.join(', ')}`;
  }
}

export default ClinicalValidator;
