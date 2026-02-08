/**
 * Clinical Decision Support System (CDSS) Service
 * Evidence-based clinical guidelines engine for healthcare decision support
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

export type AlertSeverity = 'info' | 'warning' | 'critical' | 'contraindicated';
export type AlertCategory = 'medication' | 'lab' | 'vitals' | 'guideline' | 'protocol' | 'reminder';
export type GuidelineSource = 'KDIGO' | 'ESC' | 'AHA' | 'AAO' | 'WHO' | 'FDA' | 'INTERNAL';

export interface CDSSAlert {
  id: string;
  patientId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  message: string;
  guidelineSource?: GuidelineSource;
  guidelineReference?: string;
  recommendations: string[];
  data?: Record<string, unknown>;
  createdAt: Date;
  expiresAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface CDSSRule {
  id: string;
  name: string;
  description: string;
  category: AlertCategory;
  module: 'dialyse' | 'cardiology' | 'ophthalmology' | 'general';
  guidelineSource: GuidelineSource;
  condition: (patientData: PatientClinicalData) => boolean;
  generateAlert: (patientData: PatientClinicalData) => Omit<CDSSAlert, 'id' | 'patientId' | 'createdAt'>;
  priority: number;
  isActive: boolean;
}

export interface PatientClinicalData {
  patientId: string;
  demographics: {
    age: number;
    sex: 'male' | 'female';
    weight?: number;
    height?: number;
  };
  vitals?: {
    systolicBP?: number;
    diastolicBP?: number;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
  };
  labs?: {
    creatinine?: number;
    egfr?: number;
    potassium?: number;
    hemoglobin?: number;
    hba1c?: number;
    cholesterolTotal?: number;
    ldl?: number;
    hdl?: number;
    triglycerides?: number;
    calcium?: number;
    phosphorus?: number;
    pth?: number;
    albumin?: number;
    inr?: number;
    bnp?: number;
    troponin?: number;
  };
  conditions?: string[];
  medications?: {
    name: string;
    dose?: string;
    frequency?: string;
    atcCode?: string;
  }[];
  allergies?: string[];
  dialysis?: {
    isOnDialysis: boolean;
    ktv?: number;
    accessType?: string;
    lastSessionDate?: Date;
  };
  cardiology?: {
    lvef?: number;
    hasAF?: boolean;
    hasCHF?: boolean;
    hasCAD?: boolean;
    hasPacemaker?: boolean;
    hasStent?: boolean;
  };
  ophthalmology?: {
    iop?: { left: number; right: number };
    hasDME?: boolean;
    hasAMD?: boolean;
    hasGlaucoma?: boolean;
  };
}

export interface CDSSEvaluationResult {
  patientId: string;
  evaluatedAt: Date;
  rulesEvaluated: number;
  alertsGenerated: CDSSAlert[];
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
}

// =============================================================================
// Clinical Guidelines Rules Database
// =============================================================================

const CDSS_RULES: CDSSRule[] = [
  // =========================================================================
  // DIALYSIS (KDIGO) GUIDELINES
  // =========================================================================
  {
    id: 'kdigo-ktv-001',
    name: 'Inadequate Dialysis Kt/V',
    description: 'Kt/V below target per KDIGO guidelines',
    category: 'guideline',
    module: 'dialyse',
    guidelineSource: 'KDIGO',
    priority: 1,
    isActive: true,
    condition: (data) => {
      return data.dialysis?.isOnDialysis === true &&
             data.dialysis?.ktv !== undefined &&
             data.dialysis.ktv < 1.2;
    },
    generateAlert: (data) => ({
      category: 'guideline',
      severity: data.dialysis?.ktv && data.dialysis.ktv < 1.0 ? 'critical' : 'warning',
      title: 'Dialyse inadéquate - Kt/V insuffisant',
      message: `Le Kt/V actuel (${data.dialysis?.ktv?.toFixed(2)}) est inférieur à la cible KDIGO de 1.2`,
      guidelineSource: 'KDIGO',
      guidelineReference: 'KDIGO 2015 Hemodialysis Guidelines',
      recommendations: [
        'Augmenter la durée de la séance de dialyse',
        'Augmenter le débit sanguin si toléré',
        'Vérifier l\'accès vasculaire (recirculation)',
        'Considérer un dialyseur à surface plus grande',
        'Réévaluer le poids sec du patient'
      ]
    })
  },
  {
    id: 'kdigo-phosphorus-001',
    name: 'Hyperphosphatemia',
    description: 'Elevated phosphorus per KDIGO guidelines',
    category: 'lab',
    module: 'dialyse',
    guidelineSource: 'KDIGO',
    priority: 2,
    isActive: true,
    condition: (data) => {
      return data.dialysis?.isOnDialysis === true &&
             data.labs?.phosphorus !== undefined &&
             data.labs.phosphorus > 5.5;
    },
    generateAlert: (data) => ({
      category: 'lab',
      severity: data.labs?.phosphorus && data.labs.phosphorus > 7.0 ? 'critical' : 'warning',
      title: 'Hyperphosphatémie',
      message: `Phosphore élevé (${data.labs?.phosphorus} mg/dL) - Cible: 3.5-5.5 mg/dL`,
      guidelineSource: 'KDIGO',
      guidelineReference: 'KDIGO CKD-MBD 2017',
      recommendations: [
        'Renforcer les conseils diététiques (réduction phosphore alimentaire)',
        'Optimiser les chélateurs de phosphate',
        'Vérifier la compliance au traitement',
        'Considérer augmentation durée/fréquence dialyse'
      ]
    })
  },
  {
    id: 'kdigo-pth-001',
    name: 'Secondary Hyperparathyroidism',
    description: 'Elevated PTH in dialysis patient',
    category: 'lab',
    module: 'dialyse',
    guidelineSource: 'KDIGO',
    priority: 2,
    isActive: true,
    condition: (data) => {
      return data.dialysis?.isOnDialysis === true &&
             data.labs?.pth !== undefined &&
             data.labs.pth > 600;
    },
    generateAlert: (data) => ({
      category: 'lab',
      severity: data.labs?.pth && data.labs.pth > 900 ? 'critical' : 'warning',
      title: 'Hyperparathyroïdie secondaire',
      message: `PTH élevée (${data.labs?.pth} pg/mL) - Cible: 2-9x normale (130-600 pg/mL)`,
      guidelineSource: 'KDIGO',
      guidelineReference: 'KDIGO CKD-MBD 2017',
      recommendations: [
        'Optimiser les niveaux de calcium et phosphore',
        'Initier ou ajuster calcimimétiques (Cinacalcet)',
        'Considérer vitamine D active si calcium permet',
        'Référer chirurgie si PTH réfractaire (>1000 pg/mL)'
      ]
    })
  },
  {
    id: 'kdigo-anemia-001',
    name: 'Anemia in CKD/Dialysis',
    description: 'Hemoglobin below target',
    category: 'lab',
    module: 'dialyse',
    guidelineSource: 'KDIGO',
    priority: 2,
    isActive: true,
    condition: (data) => {
      return data.labs?.hemoglobin !== undefined && data.labs.hemoglobin < 10.0;
    },
    generateAlert: (data) => ({
      category: 'lab',
      severity: data.labs?.hemoglobin && data.labs.hemoglobin < 8.0 ? 'critical' : 'warning',
      title: 'Anémie',
      message: `Hémoglobine basse (${data.labs?.hemoglobin} g/dL) - Cible: 10-11.5 g/dL`,
      guidelineSource: 'KDIGO',
      guidelineReference: 'KDIGO Anemia Guidelines 2012',
      recommendations: [
        'Vérifier les réserves en fer (ferritine, TSAT)',
        'Supplémenter en fer IV si carence',
        'Ajuster les agents stimulant l\'érythropoïèse (ASE)',
        'Rechercher causes de résistance aux ASE',
        'Exclure saignement occulte'
      ]
    })
  },
  {
    id: 'kdigo-potassium-001',
    name: 'Hyperkalemia',
    description: 'Elevated potassium - life threatening',
    category: 'lab',
    module: 'dialyse',
    guidelineSource: 'KDIGO',
    priority: 1,
    isActive: true,
    condition: (data) => {
      return data.labs?.potassium !== undefined && data.labs.potassium > 5.5;
    },
    generateAlert: (data) => ({
      category: 'lab',
      severity: data.labs?.potassium && data.labs.potassium > 6.5 ? 'critical' : 'warning',
      title: 'Hyperkaliémie',
      message: `Potassium élevé (${data.labs?.potassium} mEq/L) - Risque arythmie cardiaque`,
      guidelineSource: 'KDIGO',
      guidelineReference: 'KDIGO AKI Guidelines',
      recommendations: [
        data.labs?.potassium && data.labs.potassium > 6.5
          ? 'URGENT: ECG immédiat, envisager dialyse en urgence'
          : 'ECG de contrôle recommandé',
        'Conseils diététiques (restriction potassium)',
        'Vérifier les médicaments hyperkaliémiants (IEC, ARA2, spironolactone)',
        'Résines échangeuses d\'ions (Kayexalate, Patiromer)',
        'Considérer augmentation fréquence dialyse'
      ]
    })
  },

  // =========================================================================
  // CARDIOLOGY (ESC/AHA) GUIDELINES
  // =========================================================================
  {
    id: 'esc-hf-lvef-001',
    name: 'Reduced LVEF Heart Failure',
    description: 'LVEF < 40% per ESC guidelines',
    category: 'guideline',
    module: 'cardiology',
    guidelineSource: 'ESC',
    priority: 1,
    isActive: true,
    condition: (data) => {
      return data.cardiology?.lvef !== undefined && data.cardiology.lvef < 40;
    },
    generateAlert: (data) => ({
      category: 'guideline',
      severity: data.cardiology?.lvef && data.cardiology.lvef < 30 ? 'critical' : 'warning',
      title: 'Insuffisance cardiaque à FEVG réduite (HFrEF)',
      message: `FEVG ${data.cardiology?.lvef}% - Classification HFrEF (<40%)`,
      guidelineSource: 'ESC',
      guidelineReference: 'ESC Heart Failure Guidelines 2021',
      recommendations: [
        'Initier quadrithérapie si non contre-indiquée:',
        '  - IEC/ARA2/ARNI',
        '  - Bêta-bloquant',
        '  - Antagoniste minéralocorticoïde (ARM)',
        '  - Inhibiteur SGLT2',
        'Évaluer indication CRT/DAI si FEVG ≤35%',
        'Optimiser traitement diurétique',
        'Restriction sodée et pesée quotidienne'
      ]
    })
  },
  {
    id: 'esc-af-chadsvasc-001',
    name: 'AF Anticoagulation Required',
    description: 'CHA2DS2-VASc indicates anticoagulation',
    category: 'guideline',
    module: 'cardiology',
    guidelineSource: 'ESC',
    priority: 1,
    isActive: true,
    condition: (data) => {
      if (!data.cardiology?.hasAF) return false;
      // Calculate CHA2DS2-VASc
      let score = 0;
      if (data.cardiology?.hasCHF) score += 1;
      if (data.vitals?.systolicBP && data.vitals.systolicBP >= 140) score += 1;
      if (data.demographics.age >= 75) score += 2;
      else if (data.demographics.age >= 65) score += 1;
      if (data.conditions?.includes('diabetes')) score += 1;
      if (data.conditions?.includes('stroke') || data.conditions?.includes('tia')) score += 2;
      if (data.cardiology?.hasCAD) score += 1;
      if (data.demographics.sex === 'female') score += 1;
      return score >= 2 || (score >= 1 && data.demographics.sex === 'male');
    },
    generateAlert: (data) => ({
      category: 'guideline',
      severity: 'warning',
      title: 'Anticoagulation recommandée - FA',
      message: 'Patient avec FA et score CHA2DS2-VASc indiquant anticoagulation',
      guidelineSource: 'ESC',
      guidelineReference: 'ESC AF Guidelines 2020',
      recommendations: [
        'Initier anticoagulation orale (AOD préféré aux AVK)',
        'Calculer score HAS-BLED pour évaluer risque hémorragique',
        'AOD recommandés: Apixaban, Rivaroxaban, Dabigatran, Edoxaban',
        'Contrôle FC/rythme selon symptômes',
        'Éducation patient sur signes AVC'
      ]
    })
  },
  {
    id: 'esc-bp-001',
    name: 'Uncontrolled Hypertension',
    description: 'Blood pressure above target',
    category: 'vitals',
    module: 'cardiology',
    guidelineSource: 'ESC',
    priority: 2,
    isActive: true,
    condition: (data) => {
      return data.vitals?.systolicBP !== undefined &&
             (data.vitals.systolicBP >= 140 || (data.vitals.diastolicBP !== undefined && data.vitals.diastolicBP >= 90));
    },
    generateAlert: (data) => ({
      category: 'vitals',
      severity: data.vitals?.systolicBP && data.vitals.systolicBP >= 180 ? 'critical' : 'warning',
      title: 'Hypertension non contrôlée',
      message: `TA ${data.vitals?.systolicBP}/${data.vitals?.diastolicBP} mmHg - Cible <140/90 mmHg`,
      guidelineSource: 'ESC',
      guidelineReference: 'ESC Hypertension Guidelines 2018',
      recommendations: [
        data.vitals?.systolicBP && data.vitals.systolicBP >= 180
          ? 'URGENT: Évaluer HTA maligne/urgence hypertensive'
          : 'Optimiser traitement antihypertenseur',
        'Bithérapie recommandée en 1ère intention (IEC/ARA2 + CCB ou diurétique)',
        'Vérifier compliance médicamenteuse',
        'Mesures hygiéno-diététiques (sel, poids, exercice)',
        'MAPA/auto-mesure pour confirmer'
      ]
    })
  },
  {
    id: 'esc-acs-troponin-001',
    name: 'Elevated Troponin - ACS',
    description: 'Elevated cardiac markers suggesting ACS',
    category: 'lab',
    module: 'cardiology',
    guidelineSource: 'ESC',
    priority: 1,
    isActive: true,
    condition: (data) => {
      return data.labs?.troponin !== undefined && data.labs.troponin > 0.04;
    },
    generateAlert: (data) => ({
      category: 'lab',
      severity: 'critical',
      title: 'Troponine élevée - Suspicion SCA',
      message: `Troponine ${data.labs?.troponin} ng/mL (seuil: 0.04 ng/mL) - Évaluer syndrome coronarien aigu`,
      guidelineSource: 'ESC',
      guidelineReference: 'ESC NSTE-ACS Guidelines 2020',
      recommendations: [
        'URGENT: ECG 12 dérivations immédiat',
        'Évaluer douleur thoracique et facteurs de risque',
        'Calculer score GRACE/TIMI',
        'Considérer coronarographie selon risque',
        'Double antiagrégation si SCA confirmé',
        'Hospitalisation en USIC si haut risque'
      ]
    })
  },
  {
    id: 'esc-lipids-001',
    name: 'LDL Above Target',
    description: 'LDL cholesterol above cardiovascular risk target',
    category: 'lab',
    module: 'cardiology',
    guidelineSource: 'ESC',
    priority: 2,
    isActive: true,
    condition: (data) => {
      // Very high risk: LDL target <55 mg/dL
      const isVeryHighRisk = data.cardiology?.hasCAD ||
                            data.conditions?.includes('stroke') ||
                            data.conditions?.includes('diabetes');
      const ldlTarget = isVeryHighRisk ? 55 : 70;
      return data.labs?.ldl !== undefined && data.labs.ldl > ldlTarget;
    },
    generateAlert: (data) => ({
      category: 'lab',
      severity: 'warning',
      title: 'LDL-cholestérol au-dessus de la cible',
      message: `LDL ${data.labs?.ldl} mg/dL - Patient à haut risque CV`,
      guidelineSource: 'ESC',
      guidelineReference: 'ESC Dyslipidemia Guidelines 2019',
      recommendations: [
        'Intensifier statine haute intensité (Atorvastatine 40-80mg, Rosuvastatine 20-40mg)',
        'Si cible non atteinte: ajouter Ézétimibe',
        'Si toujours non atteint: considérer inhibiteur PCSK9',
        'Mesures hygiéno-diététiques',
        'Contrôle LDL à 4-6 semaines'
      ]
    })
  },

  // =========================================================================
  // OPHTHALMOLOGY (AAO) GUIDELINES
  // =========================================================================
  {
    id: 'aao-iop-001',
    name: 'Elevated IOP - Glaucoma Risk',
    description: 'Intraocular pressure above normal',
    category: 'vitals',
    module: 'ophthalmology',
    guidelineSource: 'AAO',
    priority: 2,
    isActive: true,
    condition: (data) => {
      return (data.ophthalmology?.iop?.left !== undefined && data.ophthalmology.iop.left > 21) ||
             (data.ophthalmology?.iop?.right !== undefined && data.ophthalmology.iop.right > 21);
    },
    generateAlert: (data) => ({
      category: 'vitals',
      severity: (data.ophthalmology?.iop?.left && data.ophthalmology.iop.left > 30) ||
                (data.ophthalmology?.iop?.right && data.ophthalmology.iop.right > 30)
                ? 'critical' : 'warning',
      title: 'Pression intraoculaire élevée',
      message: `PIO: OD ${data.ophthalmology?.iop?.right} mmHg, OG ${data.ophthalmology?.iop?.left} mmHg - Normal: 10-21 mmHg`,
      guidelineSource: 'AAO',
      guidelineReference: 'AAO Glaucoma PPP 2020',
      recommendations: [
        'Pachymétrie cornéenne pour correction PIO',
        'Examen du nerf optique (rapport cup/disc)',
        'Champ visuel de référence',
        'OCT RNFL si suspicion glaucome',
        'Considérer traitement hypotonisant si facteurs de risque'
      ]
    })
  },
  {
    id: 'aao-dme-001',
    name: 'Diabetic Macular Edema',
    description: 'DME requiring treatment',
    category: 'guideline',
    module: 'ophthalmology',
    guidelineSource: 'AAO',
    priority: 1,
    isActive: true,
    condition: (data) => {
      return data.ophthalmology?.hasDME === true;
    },
    generateAlert: (data) => ({
      category: 'guideline',
      severity: 'warning',
      title: 'Œdème maculaire diabétique',
      message: 'OMD détecté - Traitement anti-VEGF recommandé',
      guidelineSource: 'AAO',
      guidelineReference: 'AAO Diabetic Retinopathy PPP 2019',
      recommendations: [
        'Initier injections anti-VEGF (Aflibercept, Ranibizumab, Bevacizumab)',
        'OCT mensuel pour suivi épaisseur maculaire',
        'Optimiser contrôle glycémique (HbA1c <7%)',
        'Contrôler TA et lipides',
        'Considérer laser focal si OMD persistant',
        'Coordination avec diabétologue'
      ]
    })
  },
  {
    id: 'aao-amd-001',
    name: 'Wet AMD Detected',
    description: 'Neovascular AMD requiring urgent treatment',
    category: 'guideline',
    module: 'ophthalmology',
    guidelineSource: 'AAO',
    priority: 1,
    isActive: true,
    condition: (data) => {
      return data.ophthalmology?.hasAMD === true;
    },
    generateAlert: (data) => ({
      category: 'guideline',
      severity: 'critical',
      title: 'DMLA exsudative',
      message: 'DMLA néovasculaire - Traitement anti-VEGF urgent',
      guidelineSource: 'AAO',
      guidelineReference: 'AAO AMD PPP 2019',
      recommendations: [
        'URGENT: Initier anti-VEGF dans les 2 semaines',
        'Protocole: 3 injections mensuelles de charge',
        'Puis traitement Treat-and-Extend ou PRN',
        'OCT et angiographie de suivi',
        'Arrêt tabac impératif',
        'Supplémentation AREDS2 pour l\'autre œil'
      ]
    })
  },

  // =========================================================================
  // GENERAL SAFETY RULES
  // =========================================================================
  {
    id: 'safety-egfr-001',
    name: 'Severe Renal Impairment',
    description: 'eGFR indicating severe CKD',
    category: 'lab',
    module: 'general',
    guidelineSource: 'KDIGO',
    priority: 1,
    isActive: true,
    condition: (data) => {
      return data.labs?.egfr !== undefined && data.labs.egfr < 30 && !data.dialysis?.isOnDialysis;
    },
    generateAlert: (data) => ({
      category: 'lab',
      severity: data.labs?.egfr && data.labs.egfr < 15 ? 'critical' : 'warning',
      title: 'Insuffisance rénale sévère',
      message: `DFGe ${data.labs?.egfr} mL/min/1.73m² - Stade ${data.labs?.egfr && data.labs.egfr < 15 ? '5' : '4'} MRC`,
      guidelineSource: 'KDIGO',
      guidelineReference: 'KDIGO CKD Guidelines 2012',
      recommendations: [
        data.labs?.egfr && data.labs.egfr < 15
          ? 'Référer néphrologue en urgence - préparer suppléance rénale'
          : 'Suivi néphrologique rapproché',
        'Ajuster doses médicaments selon DFG',
        'Éviter néphrotoxiques (AINS, produits de contraste)',
        'Vacciner (Hépatite B, grippe, pneumocoque)',
        'Éducation patient sur options de suppléance'
      ]
    })
  },
  {
    id: 'safety-glucose-001',
    name: 'Hyperglycemia',
    description: 'Elevated HbA1c',
    category: 'lab',
    module: 'general',
    guidelineSource: 'AHA',
    priority: 2,
    isActive: true,
    condition: (data) => {
      return data.labs?.hba1c !== undefined && data.labs.hba1c > 8.0;
    },
    generateAlert: (data) => ({
      category: 'lab',
      severity: data.labs?.hba1c && data.labs.hba1c > 10.0 ? 'critical' : 'warning',
      title: 'Contrôle glycémique insuffisant',
      message: `HbA1c ${data.labs?.hba1c}% - Cible généralement <7%`,
      guidelineSource: 'AHA',
      guidelineReference: 'ADA Standards of Care 2024',
      recommendations: [
        'Optimiser traitement antidiabétique',
        'Privilégier SGLT2i ou GLP1-RA si maladie CV ou rénale',
        'Renforcer éducation thérapeutique',
        'Dépistage complications (rétinopathie, néphropathie, neuropathie)',
        'Objectif individualisé selon profil patient'
      ]
    })
  }
];

// =============================================================================
// CDSS Service Class
// =============================================================================

export class CDSSService {
  private rules = CDSS_RULES;

  /**
   * Evaluate all active rules for a patient
   */
  async evaluatePatient(patientData: PatientClinicalData): Promise<CDSSEvaluationResult> {
    const alerts: CDSSAlert[] = [];
    const activeRules = this.rules.filter(r => r.isActive);

    for (const rule of activeRules) {
      try {
        if (rule.condition(patientData)) {
          const alertData = rule.generateAlert(patientData);
          const alert: CDSSAlert = {
            id: `${rule.id}-${Date.now()}`,
            patientId: patientData.patientId,
            ...alertData,
            createdAt: new Date()
          };
          alerts.push(alert);
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }

    // Sort by severity priority
    const severityOrder: Record<AlertSeverity, number> = {
      'critical': 0,
      'contraindicated': 1,
      'warning': 2,
      'info': 3
    };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      patientId: patientData.patientId,
      evaluatedAt: new Date(),
      rulesEvaluated: activeRules.length,
      alertsGenerated: alerts,
      summary: {
        critical: alerts.filter(a => a.severity === 'critical' || a.severity === 'contraindicated').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      }
    };
  }

  /**
   * Evaluate rules for a specific module
   */
  async evaluateByModule(
    patientData: PatientClinicalData,
    module: 'dialyse' | 'cardiology' | 'ophthalmology' | 'general'
  ): Promise<CDSSEvaluationResult> {
    const moduleRules = this.rules.filter(r => r.isActive && (r.module === module || r.module === 'general'));
    const alerts: CDSSAlert[] = [];

    for (const rule of moduleRules) {
      try {
        if (rule.condition(patientData)) {
          const alertData = rule.generateAlert(patientData);
          const alert: CDSSAlert = {
            id: `${rule.id}-${Date.now()}`,
            patientId: patientData.patientId,
            ...alertData,
            createdAt: new Date()
          };
          alerts.push(alert);
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }

    const severityOrder: Record<AlertSeverity, number> = {
      'critical': 0,
      'contraindicated': 1,
      'warning': 2,
      'info': 3
    };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      patientId: patientData.patientId,
      evaluatedAt: new Date(),
      rulesEvaluated: moduleRules.length,
      alertsGenerated: alerts,
      summary: {
        critical: alerts.filter(a => a.severity === 'critical' || a.severity === 'contraindicated').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length
      }
    };
  }

  /**
   * Get all available rules
   */
  getRules(module?: string): CDSSRule[] {
    if (module) {
      return this.rules.filter(r => r.module === module || r.module === 'general');
    }
    return this.rules;
  }

  /**
   * Get active rules count
   */
  getActiveRulesCount(): { total: number; byModule: Record<string, number> } {
    const activeRules = this.rules.filter(r => r.isActive);
    const byModule: Record<string, number> = {};

    for (const rule of activeRules) {
      byModule[rule.module] = (byModule[rule.module] || 0) + 1;
    }

    return {
      total: activeRules.length,
      byModule
    };
  }
}
