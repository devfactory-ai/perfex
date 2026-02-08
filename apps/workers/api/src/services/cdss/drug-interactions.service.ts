/**
 * Drug Interactions Service
 * Comprehensive drug-drug and drug-disease interaction checking
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

export type InteractionSeverity = 'minor' | 'moderate' | 'major' | 'contraindicated';

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: InteractionSeverity;
  mechanism: string;
  effect: string;
  management: string;
  references: string[];
}

export interface DrugDiseaseInteraction {
  drug: string;
  condition: string;
  severity: InteractionSeverity;
  mechanism: string;
  effect: string;
  management: string;
}

export interface DrugAllergyCheck {
  drug: string;
  allergen: string;
  crossReactivity: boolean;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  recommendation: string;
}

export interface RenalDoseAdjustment {
  drug: string;
  normalDose: string;
  egfr30_59: string;
  egfr15_29: string;
  egfrBelow15: string;
  dialysis: string;
  notes: string;
}

export interface InteractionCheckResult {
  drugDrugInteractions: DrugInteraction[];
  drugDiseaseInteractions: DrugDiseaseInteraction[];
  allergyAlerts: DrugAllergyCheck[];
  renalAdjustments: RenalDoseAdjustment[];
  summary: {
    contraindicated: number;
    major: number;
    moderate: number;
    minor: number;
  };
}

// =============================================================================
// Drug-Drug Interactions Database
// =============================================================================

const DRUG_DRUG_INTERACTIONS: DrugInteraction[] = [
  // ACE Inhibitors + Potassium-sparing diuretics
  {
    drug1: 'lisinopril',
    drug2: 'spironolactone',
    severity: 'major',
    mechanism: 'Both drugs increase potassium retention',
    effect: 'Risque d\'hyperkaliémie sévère pouvant être fatale',
    management: 'Surveiller kaliémie régulièrement (hebdomadaire au début). Éviter si K+ >5.0 mEq/L. Envisager réduction de dose.',
    references: ['ESC Heart Failure Guidelines 2021', 'RALES Trial']
  },
  {
    drug1: 'ramipril',
    drug2: 'spironolactone',
    severity: 'major',
    mechanism: 'Both drugs increase potassium retention',
    effect: 'Risque d\'hyperkaliémie sévère pouvant être fatale',
    management: 'Surveiller kaliémie régulièrement. Éviter si K+ >5.0 mEq/L.',
    references: ['ESC Heart Failure Guidelines 2021']
  },
  {
    drug1: 'enalapril',
    drug2: 'eplerenone',
    severity: 'major',
    mechanism: 'Both drugs increase potassium retention',
    effect: 'Risque d\'hyperkaliémie',
    management: 'Surveillance kaliémie. Contre-indiqué si K+ >5.0 mEq/L ou DFG <30.',
    references: ['EPHESUS Trial', 'ESC Guidelines']
  },

  // ACE Inhibitors + NSAIDs
  {
    drug1: 'lisinopril',
    drug2: 'ibuprofen',
    severity: 'major',
    mechanism: 'NSAIDs inhibit prostaglandin-mediated renal effects of ACE inhibitors',
    effect: 'Diminution effet antihypertenseur, risque IRA, hyperkaliémie',
    management: 'Éviter AINS si possible. Si nécessaire, utiliser dose minimale pour durée minimale. Surveiller fonction rénale et kaliémie.',
    references: ['FDA Drug Safety Communication', 'KDIGO Guidelines']
  },
  {
    drug1: 'ramipril',
    drug2: 'diclofenac',
    severity: 'major',
    mechanism: 'NSAIDs reduce renal blood flow and antagonize ACE inhibitor effects',
    effect: 'Risque de détérioration fonction rénale et hyperkaliémie',
    management: 'Éviter association. Alternative: paracétamol ou opioïdes faibles.',
    references: ['EMA Safety Review']
  },

  // Anticoagulants + Antiplatelets
  {
    drug1: 'warfarin',
    drug2: 'aspirin',
    severity: 'major',
    mechanism: 'Additive anticoagulant and antiplatelet effects',
    effect: 'Risque hémorragique significativement augmenté',
    management: 'Évaluer bénéfice/risque. Si nécessaire, utiliser aspirine faible dose (75-100mg). Surveiller INR étroitement. PPI recommandé.',
    references: ['WOEST Trial', 'ESC Guidelines on Dual Antithrombotic Therapy']
  },
  {
    drug1: 'rivaroxaban',
    drug2: 'clopidogrel',
    severity: 'major',
    mechanism: 'Additive antithrombotic effects',
    effect: 'Risque hémorragique augmenté',
    management: 'Limiter durée de triple thérapie. Utiliser rivaroxaban 15mg. PPI systématique.',
    references: ['PIONEER AF-PCI Trial']
  },
  {
    drug1: 'apixaban',
    drug2: 'aspirin',
    severity: 'moderate',
    mechanism: 'Additive bleeding risk',
    effect: 'Augmentation risque hémorragique',
    management: 'Évaluer nécessité de l\'association. Préférer apixaban 2.5mg bid si association nécessaire.',
    references: ['ARISTOTLE Trial', 'ESC AF Guidelines 2020']
  },

  // Digoxin interactions
  {
    drug1: 'digoxin',
    drug2: 'amiodarone',
    severity: 'major',
    mechanism: 'Amiodarone inhibits P-glycoprotein and CYP3A4',
    effect: 'Augmentation concentration digoxine de 70-100%',
    management: 'Réduire dose digoxine de 50% lors de l\'introduction amiodarone. Surveiller digoxinémie.',
    references: ['Product Monograph Cordarone']
  },
  {
    drug1: 'digoxin',
    drug2: 'verapamil',
    severity: 'major',
    mechanism: 'Verapamil inhibits P-glycoprotein',
    effect: 'Augmentation concentration digoxine de 50-75%',
    management: 'Réduire dose digoxine de 30-50%. Surveiller FC et digoxinémie.',
    references: ['Clinical Pharmacology Database']
  },
  {
    drug1: 'digoxin',
    drug2: 'clarithromycin',
    severity: 'major',
    mechanism: 'Macrolides inhibit P-glycoprotein and gut flora',
    effect: 'Augmentation concentration digoxine jusqu\'à 100%',
    management: 'Éviter association si possible. Sinon surveiller digoxinémie et signes toxicité.',
    references: ['FDA Warning Letter']
  },

  // Statins interactions
  {
    drug1: 'simvastatin',
    drug2: 'amiodarone',
    severity: 'major',
    mechanism: 'CYP3A4 inhibition by amiodarone',
    effect: 'Risque accru de myopathie et rhabdomyolyse',
    management: 'Ne pas dépasser simvastatine 10mg/jour. Préférer pravastatine ou rosuvastatine.',
    references: ['FDA Drug Safety Communication 2011']
  },
  {
    drug1: 'atorvastatin',
    drug2: 'clarithromycin',
    severity: 'major',
    mechanism: 'CYP3A4 inhibition',
    effect: 'Risque myopathie significativement augmenté',
    management: 'Suspendre statine pendant antibiothérapie ou utiliser azithromycine à la place.',
    references: ['Product Monograph', 'CMAJ Study']
  },
  {
    drug1: 'simvastatin',
    drug2: 'diltiazem',
    severity: 'moderate',
    mechanism: 'CYP3A4 inhibition',
    effect: 'Augmentation exposition simvastatine',
    management: 'Limiter simvastatine à 10mg/jour. Alternative: atorvastatine ou rosuvastatine.',
    references: ['FDA Guidance']
  },

  // Metformin interactions
  {
    drug1: 'metformin',
    drug2: 'contrast_media',
    severity: 'major',
    mechanism: 'Risk of contrast-induced nephropathy potentiating lactic acidosis',
    effect: 'Risque d\'acidose lactique si IRA post-injection',
    management: 'Suspendre metformine 48h avant et après injection iodée. Vérifier créatinine 48h après.',
    references: ['ESUR Guidelines', 'ACR Manual on Contrast Media']
  },

  // Potassium and ACE-I/ARB
  {
    drug1: 'potassium_chloride',
    drug2: 'lisinopril',
    severity: 'major',
    mechanism: 'ACE inhibitors reduce potassium excretion',
    effect: 'Risque d\'hyperkaliémie sévère',
    management: 'Éviter supplémentation potassique sauf si kaliémie documentée basse. Surveillance étroite.',
    references: ['KDIGO CKD Guidelines']
  },

  // Anticoagulants and CYP interactions
  {
    drug1: 'warfarin',
    drug2: 'fluconazole',
    severity: 'major',
    mechanism: 'CYP2C9 and CYP3A4 inhibition',
    effect: 'Augmentation INR pouvant être massive',
    management: 'Réduire dose warfarine de 25-50%. Contrôler INR après 3-5 jours.',
    references: ['Clinical Pharmacology']
  },
  {
    drug1: 'warfarin',
    drug2: 'amoxicillin',
    severity: 'moderate',
    mechanism: 'Reduction of vitamin K-producing gut flora',
    effect: 'Augmentation modérée de l\'INR',
    management: 'Surveiller INR pendant et après antibiothérapie.',
    references: ['BJCP Study']
  },

  // Beta-blockers
  {
    drug1: 'metoprolol',
    drug2: 'verapamil',
    severity: 'major',
    mechanism: 'Additive negative inotropic and chronotropic effects',
    effect: 'Risque de bradycardie sévère, BAV, insuffisance cardiaque',
    management: 'Éviter association. Si nécessaire, surveillance ECG étroite.',
    references: ['ESC Guidelines']
  },
  {
    drug1: 'bisoprolol',
    drug2: 'diltiazem',
    severity: 'major',
    mechanism: 'Additive AV node suppression',
    effect: 'Risque de bradycardie et BAV',
    management: 'Éviter si possible. ECG de contrôle si association nécessaire.',
    references: ['Product Monograph']
  },

  // QT-prolonging drugs
  {
    drug1: 'amiodarone',
    drug2: 'sotalol',
    severity: 'contraindicated',
    mechanism: 'Both drugs prolong QT interval',
    effect: 'Risque de torsades de pointes potentiellement fatal',
    management: 'CONTRE-INDIQUÉ. Ne jamais associer.',
    references: ['CredibleMeds QT Database', 'ESC Arrhythmia Guidelines']
  },
  {
    drug1: 'amiodarone',
    drug2: 'haloperidol',
    severity: 'major',
    mechanism: 'Additive QT prolongation',
    effect: 'Risque de torsades de pointes',
    management: 'Éviter association. ECG avant et surveillance si nécessaire. Corriger hypokaliémie.',
    references: ['CredibleMeds']
  },
  {
    drug1: 'ciprofloxacin',
    drug2: 'ondansetron',
    severity: 'moderate',
    mechanism: 'Both drugs can prolong QT',
    effect: 'Risque modéré d\'allongement QT',
    management: 'ECG si facteurs de risque (hypokaliémie, cardiopathie). Préférer métoclopramide.',
    references: ['FDA Warning']
  },

  // Hypoglycemic agents
  {
    drug1: 'glimepiride',
    drug2: 'fluconazole',
    severity: 'major',
    mechanism: 'CYP2C9 inhibition increases sulfonylurea levels',
    effect: 'Risque d\'hypoglycémie sévère',
    management: 'Réduire dose sulfamide. Surveillance glycémique renforcée.',
    references: ['Diabetes Care']
  },
  {
    drug1: 'metformin',
    drug2: 'alcohol',
    severity: 'major',
    mechanism: 'Both impair gluconeogenesis and lactate metabolism',
    effect: 'Risque accru d\'acidose lactique et hypoglycémie',
    management: 'Limiter consommation alcool. Éviter alcool à jeun.',
    references: ['Product Monograph']
  },

  // Ophthalmology specific
  {
    drug1: 'timolol_eye_drops',
    drug2: 'metoprolol',
    severity: 'moderate',
    mechanism: 'Systemic absorption of ophthalmic beta-blocker',
    effect: 'Effet bêta-bloquant additif, risque bradycardie',
    management: 'Surveillance FC et TA. Occlusion punctale après instillation.',
    references: ['AAO Guidelines']
  },
  {
    drug1: 'latanoprost',
    drug2: 'bimatoprost',
    severity: 'moderate',
    mechanism: 'Same prostaglandin analog class',
    effect: 'Pas de bénéfice additif, risque irritation accru',
    management: 'Ne pas associer deux analogues des prostaglandines.',
    references: ['AAO Glaucoma PPP']
  },

  // Dialysis-relevant
  {
    drug1: 'gentamicin',
    drug2: 'vancomycin',
    severity: 'major',
    mechanism: 'Additive nephrotoxicity and ototoxicity',
    effect: 'Risque néphrotoxicité et ototoxicité augmenté',
    management: 'Éviter si possible. Dosages thérapeutiques obligatoires. Surveiller fonction rénale et audition.',
    references: ['IDSA Guidelines']
  },
  {
    drug1: 'ciclosporine',
    drug2: 'verapamil',
    severity: 'major',
    mechanism: 'CYP3A4 and P-glycoprotein inhibition',
    effect: 'Augmentation concentration ciclosporine de 40-50%',
    management: 'Réduire dose ciclosporine. Surveiller taux résiduels.',
    references: ['Transplantation Guidelines']
  }
];

// =============================================================================
// Drug-Disease Interactions Database
// =============================================================================

const DRUG_DISEASE_INTERACTIONS: DrugDiseaseInteraction[] = [
  // Renal impairment
  {
    drug: 'metformin',
    condition: 'ckd_stage_4_5',
    severity: 'contraindicated',
    mechanism: 'Reduced renal clearance increases lactic acid accumulation',
    effect: 'Risque d\'acidose lactique potentiellement fatale',
    management: 'CONTRE-INDIQUÉ si DFG <30 mL/min. Réduire dose si DFG 30-45.'
  },
  {
    drug: 'metformin',
    condition: 'dialysis',
    severity: 'contraindicated',
    mechanism: 'Cannot adequately clear metformin',
    effect: 'Accumulation et acidose lactique',
    management: 'CONTRE-INDIQUÉ en dialyse.'
  },
  {
    drug: 'nsaids',
    condition: 'ckd',
    severity: 'major',
    mechanism: 'NSAIDs reduce renal blood flow and GFR',
    effect: 'Aggravation insuffisance rénale, rétention hydrosodée',
    management: 'Éviter AINS. Utiliser paracétamol. Si nécessaire, durée minimale.'
  },
  {
    drug: 'spironolactone',
    condition: 'ckd_stage_4_5',
    severity: 'major',
    mechanism: 'Reduced potassium excretion',
    effect: 'Risque majeur d\'hyperkaliémie',
    management: 'Éviter si DFG <30. Surveillance kaliémie rapprochée si DFG 30-45.'
  },

  // Heart failure
  {
    drug: 'nsaids',
    condition: 'heart_failure',
    severity: 'major',
    mechanism: 'Sodium retention and vasoconstriction',
    effect: 'Aggravation insuffisance cardiaque, rétention hydrique',
    management: 'Éviter AINS en IC. Paracétamol préféré.'
  },
  {
    drug: 'verapamil',
    condition: 'heart_failure_reduced_ef',
    severity: 'contraindicated',
    mechanism: 'Negative inotropic effect',
    effect: 'Aggravation IC, risque décompensation',
    management: 'CONTRE-INDIQUÉ dans IC à FEVG réduite. Alternative: amlodipine si CCB nécessaire.'
  },
  {
    drug: 'diltiazem',
    condition: 'heart_failure_reduced_ef',
    severity: 'contraindicated',
    mechanism: 'Negative inotropic effect',
    effect: 'Aggravation IC',
    management: 'CONTRE-INDIQUÉ dans HFrEF.'
  },
  {
    drug: 'glitazones',
    condition: 'heart_failure',
    severity: 'contraindicated',
    mechanism: 'Fluid retention',
    effect: 'Aggravation IC, œdème',
    management: 'CONTRE-INDIQUÉ. Préférer SGLT2i (bénéfique dans IC).'
  },

  // Atrial fibrillation
  {
    drug: 'digoxin',
    condition: 'wpw_syndrome',
    severity: 'contraindicated',
    mechanism: 'May accelerate conduction through accessory pathway',
    effect: 'Risque de fibrillation ventriculaire',
    management: 'CONTRE-INDIQUÉ. Utiliser procaïnamide ou cardioversion.'
  },

  // Diabetes
  {
    drug: 'beta_blockers',
    condition: 'diabetes_insulin_treated',
    severity: 'moderate',
    mechanism: 'May mask hypoglycemia symptoms',
    effect: 'Masquage signes hypoglycémie (tachycardie, tremblements)',
    management: 'Éducation patient sur signes alternatifs. Préférer BB cardiosélectifs.'
  },
  {
    drug: 'thiazides',
    condition: 'diabetes',
    severity: 'moderate',
    mechanism: 'Impair glucose tolerance',
    effect: 'Aggravation contrôle glycémique',
    management: 'Surveillance glycémique. Ajuster antidiabétiques si nécessaire.'
  },

  // Glaucoma
  {
    drug: 'anticholinergics',
    condition: 'narrow_angle_glaucoma',
    severity: 'contraindicated',
    mechanism: 'Pupillary dilation may precipitate acute angle closure',
    effect: 'Risque de crise de glaucome aigu',
    management: 'CONTRE-INDIQUÉ. Vérifier type glaucome avant prescription.'
  },
  {
    drug: 'corticosteroids',
    condition: 'open_angle_glaucoma',
    severity: 'major',
    mechanism: 'Increase intraocular pressure',
    effect: 'Élévation PIO, aggravation glaucome',
    management: 'Éviter si possible. Surveillance PIO si nécessaire. Forme oculaire à haut risque.'
  },

  // Asthma/COPD
  {
    drug: 'beta_blockers_non_selective',
    condition: 'asthma',
    severity: 'contraindicated',
    mechanism: 'Beta-2 blockade causes bronchoconstriction',
    effect: 'Bronchospasme sévère potentiellement fatal',
    management: 'CONTRE-INDIQUÉ. Utiliser BB cardiosélectifs avec prudence si nécessaire.'
  },
  {
    drug: 'beta_blockers_non_selective',
    condition: 'copd_severe',
    severity: 'major',
    mechanism: 'Beta-2 blockade reduces bronchodilation',
    effect: 'Risque de bronchospasme',
    management: 'Préférer BB cardiosélectifs à dose progressive.'
  },

  // Bleeding disorders
  {
    drug: 'anticoagulants',
    condition: 'active_bleeding',
    severity: 'contraindicated',
    mechanism: 'Will worsen bleeding',
    effect: 'Aggravation hémorragie',
    management: 'CONTRE-INDIQUÉ en saignement actif non contrôlé.'
  },
  {
    drug: 'nsaids',
    condition: 'peptic_ulcer',
    severity: 'major',
    mechanism: 'Inhibit protective prostaglandins and platelet function',
    effect: 'Risque hémorragie digestive haute',
    management: 'Éviter AINS. Si nécessaire, associer IPP à forte dose.'
  },

  // Hepatic impairment
  {
    drug: 'statins',
    condition: 'active_liver_disease',
    severity: 'contraindicated',
    mechanism: 'Hepatotoxicity risk increased',
    effect: 'Risque hépatotoxicité',
    management: 'CONTRE-INDIQUÉ si transaminases >3x normale.'
  },
  {
    drug: 'methotrexate',
    condition: 'liver_cirrhosis',
    severity: 'contraindicated',
    mechanism: 'Hepatotoxic in impaired liver',
    effect: 'Risque hépatotoxicité sévère',
    management: 'CONTRE-INDIQUÉ en cirrhose.'
  }
];

// =============================================================================
// Allergen Cross-Reactivity Database
// =============================================================================

const ALLERGEN_CROSS_REACTIVITY: DrugAllergyCheck[] = [
  // Penicillin cross-reactivity
  {
    drug: 'amoxicillin',
    allergen: 'penicillin',
    crossReactivity: true,
    severity: 'life_threatening',
    recommendation: 'CONTRE-INDIQUÉ si allergie vraie pénicilline. Utiliser macrolide ou fluoroquinolone.'
  },
  {
    drug: 'ampicillin',
    allergen: 'penicillin',
    crossReactivity: true,
    severity: 'life_threatening',
    recommendation: 'CONTRE-INDIQUÉ si allergie pénicilline.'
  },
  {
    drug: 'cephalexin',
    allergen: 'penicillin',
    crossReactivity: true,
    severity: 'severe',
    recommendation: 'Risque réactivité croisée ~1-2%. Éviter si antécédent anaphylaxie. C3G ont risque plus faible.'
  },
  {
    drug: 'ceftriaxone',
    allergen: 'penicillin',
    crossReactivity: false,
    severity: 'moderate',
    recommendation: 'Risque très faible (<0.5%). Peut être utilisé avec précaution si allergie non anaphylactique.'
  },
  {
    drug: 'meropenem',
    allergen: 'penicillin',
    crossReactivity: false,
    severity: 'moderate',
    recommendation: 'Risque réactivité croisée très faible (<1%). Utilisable sous surveillance si nécessaire.'
  },

  // Sulfonamide allergies
  {
    drug: 'sulfamethoxazole',
    allergen: 'sulfonamide_antibiotics',
    crossReactivity: true,
    severity: 'life_threatening',
    recommendation: 'CONTRE-INDIQUÉ si allergie sulfamides antibiotiques.'
  },
  {
    drug: 'furosemide',
    allergen: 'sulfonamide_antibiotics',
    crossReactivity: false,
    severity: 'mild',
    recommendation: 'Structure différente. Risque de réactivité croisée NON démontré. Peut être utilisé.'
  },
  {
    drug: 'hydrochlorothiazide',
    allergen: 'sulfonamide_antibiotics',
    crossReactivity: false,
    severity: 'mild',
    recommendation: 'Pas de réactivité croisée prouvée. Peut être utilisé avec prudence.'
  },

  // NSAIDs
  {
    drug: 'ibuprofen',
    allergen: 'aspirin',
    crossReactivity: true,
    severity: 'severe',
    recommendation: 'Réaction croisée possible (15-20%). Préférer paracétamol ou COX-2 sélectif.'
  },
  {
    drug: 'naproxen',
    allergen: 'aspirin',
    crossReactivity: true,
    severity: 'severe',
    recommendation: 'Réaction croisée fréquente entre AINS. Éviter tous AINS si anaphylaxie aspirine.'
  },
  {
    drug: 'celecoxib',
    allergen: 'aspirin',
    crossReactivity: false,
    severity: 'moderate',
    recommendation: 'Risque réactivité croisée très faible (~4%). Alternative possible sous surveillance.'
  },

  // Opioids
  {
    drug: 'codeine',
    allergen: 'morphine',
    crossReactivity: true,
    severity: 'severe',
    recommendation: 'Réaction croisée possible (phénanthrènes). Préférer fentanyl (phénylpipéridine).'
  },
  {
    drug: 'fentanyl',
    allergen: 'morphine',
    crossReactivity: false,
    severity: 'mild',
    recommendation: 'Structure différente (phénylpipéridine). Alternative sûre aux phénanthrènes.'
  },

  // Contrast media
  {
    drug: 'iodinated_contrast',
    allergen: 'iodinated_contrast',
    crossReactivity: true,
    severity: 'life_threatening',
    recommendation: 'Prémédication obligatoire (corticoïdes + antihistaminiques). Utiliser produit iso-osmolaire.'
  }
];

// =============================================================================
// Renal Dose Adjustments Database
// =============================================================================

const RENAL_DOSE_ADJUSTMENTS: RenalDoseAdjustment[] = [
  // Cardiovascular
  {
    drug: 'Lisinopril',
    normalDose: '10-40 mg/jour',
    egfr30_59: '5-20 mg/jour',
    egfr15_29: '2.5-10 mg/jour',
    egfrBelow15: '2.5-5 mg/jour',
    dialysis: 'Dialysable - donner après séance',
    notes: 'Surveiller kaliémie et créatinine'
  },
  {
    drug: 'Ramipril',
    normalDose: '2.5-10 mg/jour',
    egfr30_59: '1.25-5 mg/jour',
    egfr15_29: '1.25-2.5 mg/jour',
    egfrBelow15: '1.25 mg/jour max',
    dialysis: 'Partiellement dialysable',
    notes: 'Initier à dose faible'
  },
  {
    drug: 'Bisoprolol',
    normalDose: '2.5-10 mg/jour',
    egfr30_59: 'Pas d\'ajustement',
    egfr15_29: 'Pas d\'ajustement',
    egfrBelow15: 'Pas d\'ajustement',
    dialysis: 'Non dialysable',
    notes: 'Pas d\'ajustement nécessaire'
  },
  {
    drug: 'Métoprolol',
    normalDose: '50-200 mg/jour',
    egfr30_59: 'Pas d\'ajustement',
    egfr15_29: 'Pas d\'ajustement',
    egfrBelow15: 'Pas d\'ajustement',
    dialysis: 'Non dialysable',
    notes: 'Métabolisme hépatique'
  },
  {
    drug: 'Aténolol',
    normalDose: '50-100 mg/jour',
    egfr30_59: '50 mg/jour',
    egfr15_29: '25-50 mg/jour',
    egfrBelow15: '25 mg/jour',
    dialysis: 'Dialysable - 25mg après séance',
    notes: 'Réduction significative nécessaire'
  },
  {
    drug: 'Digoxine',
    normalDose: '0.125-0.25 mg/jour',
    egfr30_59: '0.125 mg/jour',
    egfr15_29: '0.0625-0.125 mg/jour',
    egfrBelow15: '0.0625 mg/48h',
    dialysis: 'Non dialysable - prudence',
    notes: 'Surveiller digoxinémie cible 0.5-1 ng/mL'
  },
  {
    drug: 'Spironolactone',
    normalDose: '25-50 mg/jour',
    egfr30_59: '12.5-25 mg/jour',
    egfr15_29: 'Éviter si possible',
    egfrBelow15: 'Contre-indiqué',
    dialysis: 'Contre-indiqué',
    notes: 'Risque hyperkaliémie majeur'
  },

  // Anticoagulants
  {
    drug: 'Rivaroxaban',
    normalDose: '20 mg/jour',
    egfr30_59: '15 mg/jour',
    egfr15_29: '15 mg/jour avec prudence',
    egfrBelow15: 'Non recommandé',
    dialysis: 'Non recommandé',
    notes: 'Éviter si ClCr <15 mL/min'
  },
  {
    drug: 'Apixaban',
    normalDose: '5 mg x2/jour',
    egfr30_59: '5 mg x2/jour',
    egfr15_29: '2.5 mg x2/jour',
    egfrBelow15: '2.5 mg x2/jour si bénéfice>risque',
    dialysis: 'Données limitées - 2.5mg x2',
    notes: 'Moins dépendant fonction rénale que autres AOD'
  },
  {
    drug: 'Dabigatran',
    normalDose: '150 mg x2/jour',
    egfr30_59: '110 mg x2/jour',
    egfr15_29: 'Contre-indiqué',
    egfrBelow15: 'Contre-indiqué',
    dialysis: 'Contre-indiqué',
    notes: 'Très dépendant élimination rénale'
  },
  {
    drug: 'Enoxaparine',
    normalDose: '1 mg/kg x2/jour',
    egfr30_59: 'Pas d\'ajustement',
    egfr15_29: '1 mg/kg x1/jour',
    egfrBelow15: '0.5 mg/kg x1/jour',
    dialysis: 'Éviter - anti-Xa si nécessaire',
    notes: 'Surveiller anti-Xa si IRC sévère'
  },

  // Antibiotics
  {
    drug: 'Amoxicilline',
    normalDose: '500 mg x3/jour',
    egfr30_59: '500 mg x2/jour',
    egfr15_29: '500 mg x1/jour',
    egfrBelow15: '250-500 mg x1/jour',
    dialysis: 'Donner après dialyse',
    notes: 'Ajustement important'
  },
  {
    drug: 'Ciprofloxacine',
    normalDose: '500 mg x2/jour',
    egfr30_59: '250-500 mg x2/jour',
    egfr15_29: '250-500 mg x1/jour',
    egfrBelow15: '250 mg x1/jour',
    dialysis: 'Après dialyse si possible',
    notes: 'Risque tendinopathie accru si IRC'
  },
  {
    drug: 'Lévofloxacine',
    normalDose: '500-750 mg/jour',
    egfr30_59: '500 mg puis 250 mg/jour',
    egfr15_29: '500 mg puis 250 mg/48h',
    egfrBelow15: '500 mg puis 250 mg/48h',
    dialysis: 'Après dialyse',
    notes: 'Ajustement intervalle'
  },
  {
    drug: 'Vancomycine',
    normalDose: '15 mg/kg x2/jour',
    egfr30_59: 'Selon taux résiduels',
    egfr15_29: '15 mg/kg puis selon taux',
    egfrBelow15: '15 mg/kg puis 500-1000mg/48-72h',
    dialysis: '15-20 mg/kg post-HD selon taux',
    notes: 'OBLIGATOIRE: dosage taux résiduels'
  },
  {
    drug: 'Gentamicine',
    normalDose: '5-7 mg/kg/jour',
    egfr30_59: '5 mg/kg puis intervalle prolongé',
    egfr15_29: '5 mg/kg puis selon taux',
    egfrBelow15: 'Éviter sauf nécessité absolue',
    dialysis: '2 mg/kg post-HD',
    notes: 'Néphro/ototoxique - durée minimale'
  },

  // Antidiabetics
  {
    drug: 'Metformine',
    normalDose: '500-2000 mg/jour',
    egfr30_59: '500-1000 mg/jour max',
    egfr15_29: 'Contre-indiqué',
    egfrBelow15: 'Contre-indiqué',
    dialysis: 'Contre-indiqué',
    notes: 'Risque acidose lactique'
  },
  {
    drug: 'Sitagliptine',
    normalDose: '100 mg/jour',
    egfr30_59: '50 mg/jour',
    egfr15_29: '25 mg/jour',
    egfrBelow15: '25 mg/jour',
    dialysis: '25 mg/jour - non dialysable',
    notes: 'Ajustement simple par paliers'
  },
  {
    drug: 'Empagliflozine',
    normalDose: '10-25 mg/jour',
    egfr30_59: '10 mg/jour',
    egfr15_29: 'Éviter pour glycémie (OK pour IC)',
    egfrBelow15: 'Non recommandé glycémie',
    dialysis: 'Non recommandé',
    notes: 'Efficacité glycémique diminue si DFG bas'
  },

  // Pain medications
  {
    drug: 'Gabapentine',
    normalDose: '300-1200 mg x3/jour',
    egfr30_59: '200-700 mg x2/jour',
    egfr15_29: '100-300 mg x1-2/jour',
    egfrBelow15: '100-300 mg/jour',
    dialysis: '125-350 mg après HD',
    notes: 'Ajustement majeur nécessaire'
  },
  {
    drug: 'Prégabaline',
    normalDose: '75-300 mg x2/jour',
    egfr30_59: '75-150 mg x2/jour',
    egfr15_29: '25-75 mg x1-2/jour',
    egfrBelow15: '25-75 mg/jour',
    dialysis: 'Supplément post-HD',
    notes: 'Risque sédation si surdosage'
  },
  {
    drug: 'Morphine',
    normalDose: 'Variable',
    egfr30_59: 'Réduire 25%',
    egfr15_29: 'Réduire 50%',
    egfrBelow15: 'Réduire 75% ou éviter',
    dialysis: 'Éviter - métabolite M6G accumule',
    notes: 'Préférer hydromorphone ou fentanyl'
  },
  {
    drug: 'Tramadol',
    normalDose: '50-100 mg x4/jour',
    egfr30_59: '50-100 mg x2-3/jour',
    egfr15_29: '50 mg x2/jour max',
    egfrBelow15: '50 mg x2/jour max',
    dialysis: '50 mg x2/jour - non dialysable',
    notes: 'Risque convulsions si surdosage'
  }
];

// =============================================================================
// Drug Interactions Service Class
// =============================================================================

export class DrugInteractionsService {

  /**
   * Check all interactions for a medication list
   */
  checkInteractions(
    medications: string[],
    conditions: string[],
    allergies: string[],
    egfr?: number,
    isOnDialysis?: boolean
  ): InteractionCheckResult {
    const normalizedMeds = medications.map(m => m.toLowerCase().trim());
    const normalizedConditions = conditions.map(c => c.toLowerCase().trim());
    const normalizedAllergies = allergies.map(a => a.toLowerCase().trim());

    const drugDrugInteractions = this.findDrugDrugInteractions(normalizedMeds);
    const drugDiseaseInteractions = this.findDrugDiseaseInteractions(normalizedMeds, normalizedConditions);
    const allergyAlerts = this.checkAllergyContraindications(normalizedMeds, normalizedAllergies);
    const renalAdjustments = this.getRenalDoseAdjustments(normalizedMeds, egfr, isOnDialysis);

    return {
      drugDrugInteractions,
      drugDiseaseInteractions,
      allergyAlerts,
      renalAdjustments,
      summary: {
        contraindicated:
          drugDrugInteractions.filter(i => i.severity === 'contraindicated').length +
          drugDiseaseInteractions.filter(i => i.severity === 'contraindicated').length +
          allergyAlerts.filter(a => a.severity === 'life_threatening').length,
        major:
          drugDrugInteractions.filter(i => i.severity === 'major').length +
          drugDiseaseInteractions.filter(i => i.severity === 'major').length +
          allergyAlerts.filter(a => a.severity === 'severe').length,
        moderate:
          drugDrugInteractions.filter(i => i.severity === 'moderate').length +
          drugDiseaseInteractions.filter(i => i.severity === 'moderate').length +
          allergyAlerts.filter(a => a.severity === 'moderate').length,
        minor:
          drugDrugInteractions.filter(i => i.severity === 'minor').length +
          drugDiseaseInteractions.filter(i => i.severity === 'minor').length +
          allergyAlerts.filter(a => a.severity === 'mild').length
      }
    };
  }

  /**
   * Find drug-drug interactions
   */
  private findDrugDrugInteractions(medications: string[]): DrugInteraction[] {
    const interactions: DrugInteraction[] = [];

    for (let i = 0; i < medications.length; i++) {
      for (let j = i + 1; j < medications.length; j++) {
        const med1 = medications[i];
        const med2 = medications[j];

        for (const interaction of DRUG_DRUG_INTERACTIONS) {
          if (
            (this.matchesDrug(med1, interaction.drug1) && this.matchesDrug(med2, interaction.drug2)) ||
            (this.matchesDrug(med1, interaction.drug2) && this.matchesDrug(med2, interaction.drug1))
          ) {
            interactions.push(interaction);
          }
        }
      }
    }

    // Sort by severity
    const severityOrder: Record<InteractionSeverity, number> = {
      'contraindicated': 0,
      'major': 1,
      'moderate': 2,
      'minor': 3
    };
    return interactions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Find drug-disease interactions
   */
  private findDrugDiseaseInteractions(medications: string[], conditions: string[]): DrugDiseaseInteraction[] {
    const interactions: DrugDiseaseInteraction[] = [];

    for (const med of medications) {
      for (const condition of conditions) {
        for (const interaction of DRUG_DISEASE_INTERACTIONS) {
          if (this.matchesDrug(med, interaction.drug) && this.matchesCondition(condition, interaction.condition)) {
            interactions.push(interaction);
          }
        }
      }
    }

    const severityOrder: Record<InteractionSeverity, number> = {
      'contraindicated': 0,
      'major': 1,
      'moderate': 2,
      'minor': 3
    };
    return interactions.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }

  /**
   * Check allergy contraindications
   */
  private checkAllergyContraindications(medications: string[], allergies: string[]): DrugAllergyCheck[] {
    const alerts: DrugAllergyCheck[] = [];

    for (const med of medications) {
      for (const allergy of allergies) {
        for (const check of ALLERGEN_CROSS_REACTIVITY) {
          if (this.matchesDrug(med, check.drug) && this.matchesAllergen(allergy, check.allergen)) {
            alerts.push(check);
          }
        }
      }
    }

    return alerts;
  }

  /**
   * Get renal dose adjustments
   */
  private getRenalDoseAdjustments(
    medications: string[],
    egfr?: number,
    isOnDialysis?: boolean
  ): RenalDoseAdjustment[] {
    if (egfr === undefined && !isOnDialysis) {
      return [];
    }

    const adjustments: RenalDoseAdjustment[] = [];

    for (const med of medications) {
      for (const adjustment of RENAL_DOSE_ADJUSTMENTS) {
        if (this.matchesDrug(med, adjustment.drug)) {
          adjustments.push(adjustment);
        }
      }
    }

    return adjustments;
  }

  /**
   * Match drug name (fuzzy matching)
   */
  private matchesDrug(medication: string, drugPattern: string): boolean {
    const medLower = medication.toLowerCase();
    const patternLower = drugPattern.toLowerCase();

    // Exact match
    if (medLower === patternLower) return true;

    // Contains match
    if (medLower.includes(patternLower) || patternLower.includes(medLower)) return true;

    // Class matches
    const classMatches: Record<string, string[]> = {
      'nsaids': ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'meloxicam', 'piroxicam', 'ketoprofen'],
      'beta_blockers': ['metoprolol', 'bisoprolol', 'carvedilol', 'atenolol', 'propranolol', 'nebivolol'],
      'beta_blockers_non_selective': ['propranolol', 'nadolol', 'timolol', 'carvedilol', 'labetalol'],
      'ace_inhibitors': ['lisinopril', 'ramipril', 'enalapril', 'perindopril', 'captopril'],
      'arbs': ['losartan', 'valsartan', 'irbesartan', 'candesartan', 'telmisartan', 'olmesartan'],
      'statins': ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin', 'fluvastatin'],
      'thiazides': ['hydrochlorothiazide', 'chlorthalidone', 'indapamide', 'metolazone'],
      'anticoagulants': ['warfarin', 'rivaroxaban', 'apixaban', 'dabigatran', 'edoxaban'],
      'glitazones': ['pioglitazone', 'rosiglitazone'],
      'anticholinergics': ['oxybutynin', 'tolterodine', 'solifenacin', 'atropine', 'scopolamine']
    };

    if (classMatches[patternLower]?.some(d => medLower.includes(d))) {
      return true;
    }

    return false;
  }

  /**
   * Match condition name
   */
  private matchesCondition(condition: string, pattern: string): boolean {
    const condLower = condition.toLowerCase();
    const patternLower = pattern.toLowerCase();

    if (condLower === patternLower) return true;
    if (condLower.includes(patternLower) || patternLower.includes(condLower)) return true;

    // Synonyms
    const synonyms: Record<string, string[]> = {
      'ckd': ['renal_impairment', 'kidney_disease', 'chronic_kidney'],
      'ckd_stage_4_5': ['severe_ckd', 'esrd', 'kidney_failure'],
      'heart_failure': ['chf', 'cardiac_failure', 'hf'],
      'heart_failure_reduced_ef': ['hfref', 'systolic_heart_failure'],
      'diabetes': ['dm', 'type_2_diabetes', 'diabetic'],
      'asthma': ['reactive_airway', 'bronchial_asthma'],
      'copd_severe': ['severe_copd', 'emphysema_severe'],
      'narrow_angle_glaucoma': ['angle_closure_glaucoma', 'closed_angle'],
      'open_angle_glaucoma': ['poag', 'primary_open_angle'],
      'peptic_ulcer': ['gastric_ulcer', 'duodenal_ulcer', 'gi_bleed_history']
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if (patternLower === key || patternLower.includes(key)) {
        if (values.some(v => condLower.includes(v)) || condLower.includes(key)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Match allergen
   */
  private matchesAllergen(allergy: string, pattern: string): boolean {
    const allergyLower = allergy.toLowerCase();
    const patternLower = pattern.toLowerCase();

    if (allergyLower === patternLower) return true;
    if (allergyLower.includes(patternLower) || patternLower.includes(allergyLower)) return true;

    // Allergen synonyms
    const synonyms: Record<string, string[]> = {
      'penicillin': ['penicilline', 'amoxicillin', 'ampicillin', 'pen_allergy'],
      'sulfonamide_antibiotics': ['sulfamide', 'bactrim', 'cotrimoxazole', 'sulfa'],
      'aspirin': ['asa', 'acetylsalicylic', 'aspirin_allergy'],
      'morphine': ['opioid', 'codeine', 'opiate'],
      'iodinated_contrast': ['contrast', 'iodine', 'iode', 'produit_contraste']
    };

    for (const [key, values] of Object.entries(synonyms)) {
      if (patternLower === key) {
        if (values.some(v => allergyLower.includes(v))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get dose adjustment for specific drug and renal function
   */
  getDoseAdjustment(drugName: string, egfr?: number, isOnDialysis?: boolean): RenalDoseAdjustment | null {
    for (const adjustment of RENAL_DOSE_ADJUSTMENTS) {
      if (this.matchesDrug(drugName, adjustment.drug)) {
        return adjustment;
      }
    }
    return null;
  }

  /**
   * Get all drug classes for reference
   */
  getDrugClasses(): Record<string, string[]> {
    return {
      'IEC (Inhibiteurs Enzyme Conversion)': ['lisinopril', 'ramipril', 'enalapril', 'perindopril', 'captopril'],
      'ARA2 (Antagonistes Récepteurs Angiotensine)': ['losartan', 'valsartan', 'irbesartan', 'candesartan', 'telmisartan'],
      'Bêta-bloquants': ['metoprolol', 'bisoprolol', 'carvedilol', 'atenolol', 'propranolol', 'nebivolol'],
      'Inhibiteurs Calciques': ['amlodipine', 'nifedipine', 'verapamil', 'diltiazem'],
      'Diurétiques': ['furosemide', 'hydrochlorothiazide', 'spironolactone', 'eplerenone', 'indapamide'],
      'Anticoagulants Oraux': ['warfarin', 'rivaroxaban', 'apixaban', 'dabigatran', 'edoxaban'],
      'Antiagrégants': ['aspirin', 'clopidogrel', 'prasugrel', 'ticagrelor'],
      'Statines': ['atorvastatin', 'rosuvastatin', 'simvastatin', 'pravastatin'],
      'AINS': ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib', 'meloxicam'],
      'Antidiabétiques': ['metformin', 'glimepiride', 'sitagliptine', 'empagliflozine', 'liraglutide']
    };
  }
}

export const drugInteractionsService = new DrugInteractionsService();
