/**
 * Unified Electronic Health Record (EHR) Service
 * Provides longitudinal patient view across all healthcare modules
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

export type EHREventType =
  | 'consultation' | 'diagnosis' | 'procedure' | 'medication'
  | 'lab_result' | 'imaging' | 'vital_signs' | 'allergy'
  | 'immunization' | 'hospitalization' | 'surgery' | 'referral'
  | 'prescription' | 'note' | 'alert' | 'device_implant';

export type EHREventSource = 'dialyse' | 'cardiology' | 'ophthalmology' | 'general' | 'laboratory' | 'pharmacy' | 'external';

export interface EHREvent {
  id: string;
  patientId: string;
  type: EHREventType;
  source: EHREventSource;
  timestamp: Date;
  title: string;
  summary: string;

  // Clinical data
  data: Record<string, unknown>;
  codes?: {
    icd10?: string[];
    snomed?: string[];
    loinc?: string[];
    cpt?: string[];
  };

  // Metadata
  providerId?: string;
  providerName?: string;
  facilityId?: string;
  facilityName?: string;

  // Links
  relatedEventIds?: string[];
  documentIds?: string[];

  // Audit
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface PatientProblem {
  id: string;
  patientId: string;
  code: string;
  codeSystem: 'ICD10' | 'SNOMED' | 'ICD9';
  description: string;
  category: 'chronic' | 'acute' | 'resolved' | 'inactive';
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  onsetDate?: Date;
  resolvedDate?: Date;
  source: EHREventSource;
  notes?: string;
  isActive: boolean;
  lastReviewedAt?: Date;
  lastReviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicationEntry {
  id: string;
  patientId: string;
  medicationName: string;
  genericName?: string;
  rxNormCode?: string;
  ndc?: string;
  dosage: string;
  unit: string;
  frequency: string;
  route: 'oral' | 'iv' | 'im' | 'sc' | 'topical' | 'inhaled' | 'rectal' | 'ophthalmic' | 'other';
  startDate: Date;
  endDate?: Date;
  prescriberId: string;
  prescriberName: string;
  status: 'active' | 'completed' | 'stopped' | 'on_hold' | 'discontinued';
  stopReason?: string;
  instructions?: string;
  isReconciled: boolean;
  reconciledAt?: Date;
  reconciledBy?: string;
  source: EHREventSource;
  createdAt: Date;
  updatedAt: Date;
}

export interface AllergyEntry {
  id: string;
  patientId: string;
  allergen: string;
  allergenType: 'medication' | 'food' | 'environmental' | 'biological' | 'other';
  rxNormCode?: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  onsetDate?: Date;
  status: 'active' | 'inactive' | 'resolved' | 'refuted';
  verifiedBy?: string;
  verifiedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImmunizationEntry {
  id: string;
  patientId: string;
  vaccineName: string;
  cvxCode?: string;
  manufacturer?: string;
  lotNumber?: string;
  expirationDate?: Date;
  doseNumber?: number;
  doseUnit?: string;
  site?: string;
  route?: string;
  administeredAt: Date;
  administeredBy: string;
  facilityName?: string;
  status: 'completed' | 'entered_in_error' | 'not_done';
  reasonNotGiven?: string;
  nextDueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface VitalSignsEntry {
  id: string;
  patientId: string;
  timestamp: Date;

  // Core vitals
  temperature?: { value: number; unit: 'C' | 'F' };
  heartRate?: number;
  respiratoryRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  oxygenSaturation?: number;

  // Additional measurements
  weight?: { value: number; unit: 'kg' | 'lb' };
  height?: { value: number; unit: 'cm' | 'in' };
  bmi?: number;
  painLevel?: number; // 0-10
  glucoseLevel?: number;

  // Context
  position?: 'sitting' | 'standing' | 'supine' | 'prone';
  recordedBy: string;
  source: EHREventSource;
  deviceUsed?: string;
  notes?: string;

  createdAt: Date;
}

export interface PatientTimeline {
  patientId: string;
  patientName: string;
  dateOfBirth: Date;
  gender: string;
  mrn: string;

  // Summary counts
  totalEvents: number;
  eventsByType: Record<EHREventType, number>;
  eventsBySource: Record<EHREventSource, number>;

  // Aggregated data
  activeProblems: PatientProblem[];
  activeMedications: MedicationEntry[];
  allergies: AllergyEntry[];
  recentVitals?: VitalSignsEntry;
  immunizations: ImmunizationEntry[];

  // Timeline events (paginated)
  events: EHREvent[];

  // Metadata
  lastUpdated: Date;
}

export interface MedicationReconciliation {
  id: string;
  patientId: string;
  performedAt: Date;
  performedBy: string;
  context: 'admission' | 'discharge' | 'transfer' | 'outpatient' | 'routine';

  // Medications reviewed
  medicationsReviewed: {
    medicationId: string;
    medicationName: string;
    previousStatus: MedicationEntry['status'];
    newStatus: MedicationEntry['status'];
    action: 'continue' | 'modify' | 'discontinue' | 'add';
    notes?: string;
  }[];

  // Discrepancies found
  discrepancies: {
    type: 'omission' | 'commission' | 'wrong_dose' | 'wrong_frequency' | 'duplication' | 'interaction';
    description: string;
    resolution: string;
  }[];

  // Sign-off
  pharmacistReview?: { reviewedBy: string; reviewedAt: Date; notes?: string };
  physicianApproval?: { approvedBy: string; approvedAt: Date; notes?: string };

  createdAt: Date;
}

// =============================================================================
// Unified EHR Service
// =============================================================================

export class UnifiedEHRService {

  /**
   * Get complete patient timeline
   */
  async getPatientTimeline(
    patientId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      eventTypes?: EHREventType[];
      sources?: EHREventSource[];
      limit?: number;
      offset?: number;
    }
  ): Promise<PatientTimeline> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    // Mock patient data - would come from database
    const patient = {
      id: patientId,
      firstName: 'Jean',
      lastName: 'Dupont',
      dateOfBirth: new Date('1965-03-15'),
      gender: 'male',
      mrn: `MRN-${patientId.slice(0, 8).toUpperCase()}`
    };

    // Aggregate events from all modules
    const events = await this.aggregateEvents(patientId, options);
    const problems = await this.getActiveProblems(patientId);
    const medications = await this.getActiveMedications(patientId);
    const allergies = await this.getAllergies(patientId);
    const immunizations = await this.getImmunizations(patientId);
    const recentVitals = await this.getRecentVitals(patientId);

    // Calculate summaries
    const eventsByType: Record<string, number> = {};
    const eventsBySource: Record<string, number> = {};

    for (const event of events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySource[event.source] = (eventsBySource[event.source] || 0) + 1;
    }

    return {
      patientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      mrn: patient.mrn,
      totalEvents: events.length,
      eventsByType: eventsByType as Record<EHREventType, number>,
      eventsBySource: eventsBySource as Record<EHREventSource, number>,
      activeProblems: problems,
      activeMedications: medications,
      allergies,
      recentVitals,
      immunizations,
      events: events.slice(offset, offset + limit),
      lastUpdated: new Date()
    };
  }

  /**
   * Aggregate events from all healthcare modules
   */
  private async aggregateEvents(
    patientId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      eventTypes?: EHREventType[];
      sources?: EHREventSource[];
    }
  ): Promise<EHREvent[]> {
    const events: EHREvent[] = [];
    const now = new Date();

    // Sample dialysis events
    events.push({
      id: `ehr-dial-1-${patientId}`,
      patientId,
      type: 'procedure',
      source: 'dialyse',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      title: 'Séance de dialyse',
      summary: 'HD 4h - KT/V 1.42 - Poids sec atteint',
      data: {
        duration: 240,
        ktv: 1.42,
        ufVolume: 2500,
        accessType: 'FAV'
      },
      codes: { cpt: ['90935'] },
      providerName: 'Dr. Martin',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });

    // Sample cardiology events
    events.push({
      id: `ehr-cardio-1-${patientId}`,
      patientId,
      type: 'procedure',
      source: 'cardiology',
      timestamp: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      title: 'Échocardiographie',
      summary: 'ETT - FEVG 55% - Pas d\'anomalie valvulaire',
      data: {
        type: 'TTE',
        lvef: 55,
        findings: ['Normal LV function', 'No valvular abnormality']
      },
      codes: { cpt: ['93306'] },
      providerName: 'Dr. Cardio',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });

    // Sample lab result
    events.push({
      id: `ehr-lab-1-${patientId}`,
      patientId,
      type: 'lab_result',
      source: 'laboratory',
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      title: 'Bilan rénal',
      summary: 'Créatinine 450 µmol/L - DFG 12 mL/min',
      data: {
        creatinine: 450,
        egfr: 12,
        urea: 25,
        potassium: 5.2
      },
      codes: { loinc: ['2160-0', '33914-3'] },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });

    // Sample diagnosis
    events.push({
      id: `ehr-diag-1-${patientId}`,
      patientId,
      type: 'diagnosis',
      source: 'dialyse',
      timestamp: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      title: 'Insuffisance rénale chronique stade 5',
      summary: 'IRC terminale nécessitant hémodialyse',
      data: {
        stage: 5,
        etiology: 'Nephropathie diabétique'
      },
      codes: { icd10: ['N18.5'], snomed: ['46177005'] },
      providerName: 'Dr. Néphro',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system'
    });

    // Filter by date range
    let filteredEvents = events;
    if (options?.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= options.startDate!);
    }
    if (options?.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= options.endDate!);
    }
    if (options?.eventTypes?.length) {
      filteredEvents = filteredEvents.filter(e => options.eventTypes!.includes(e.type));
    }
    if (options?.sources?.length) {
      filteredEvents = filteredEvents.filter(e => options.sources!.includes(e.source));
    }

    // Sort by timestamp descending
    return filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get active problems for patient
   */
  async getActiveProblems(patientId: string): Promise<PatientProblem[]> {
    return [
      {
        id: `prob-1-${patientId}`,
        patientId,
        code: 'N18.5',
        codeSystem: 'ICD10',
        description: 'Insuffisance rénale chronique, stade 5',
        category: 'chronic',
        severity: 'severe',
        onsetDate: new Date('2020-01-15'),
        source: 'dialyse',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `prob-2-${patientId}`,
        patientId,
        code: 'E11.65',
        codeSystem: 'ICD10',
        description: 'Diabète type 2 avec hyperglycémie',
        category: 'chronic',
        severity: 'moderate',
        onsetDate: new Date('2015-06-20'),
        source: 'general',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `prob-3-${patientId}`,
        patientId,
        code: 'I10',
        codeSystem: 'ICD10',
        description: 'Hypertension artérielle essentielle',
        category: 'chronic',
        severity: 'moderate',
        onsetDate: new Date('2012-03-10'),
        source: 'cardiology',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get active medications for patient
   */
  async getActiveMedications(patientId: string): Promise<MedicationEntry[]> {
    return [
      {
        id: `med-1-${patientId}`,
        patientId,
        medicationName: 'Érythropoïétine',
        genericName: 'Epoetin alfa',
        dosage: '4000',
        unit: 'UI',
        frequency: '3x/semaine',
        route: 'sc',
        startDate: new Date('2020-02-01'),
        prescriberId: 'dr-1',
        prescriberName: 'Dr. Martin',
        status: 'active',
        isReconciled: true,
        source: 'dialyse',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `med-2-${patientId}`,
        patientId,
        medicationName: 'Amlodipine',
        genericName: 'Amlodipine besylate',
        dosage: '10',
        unit: 'mg',
        frequency: '1x/jour',
        route: 'oral',
        startDate: new Date('2018-05-15'),
        prescriberId: 'dr-2',
        prescriberName: 'Dr. Cardio',
        status: 'active',
        isReconciled: true,
        source: 'cardiology',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `med-3-${patientId}`,
        patientId,
        medicationName: 'Metformine',
        genericName: 'Metformin hydrochloride',
        dosage: '500',
        unit: 'mg',
        frequency: '2x/jour',
        route: 'oral',
        startDate: new Date('2015-07-01'),
        prescriberId: 'dr-3',
        prescriberName: 'Dr. Endo',
        status: 'active',
        instructions: 'Prendre avec les repas',
        isReconciled: true,
        source: 'general',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get allergies for patient
   */
  async getAllergies(patientId: string): Promise<AllergyEntry[]> {
    return [
      {
        id: `allergy-1-${patientId}`,
        patientId,
        allergen: 'Pénicilline',
        allergenType: 'medication',
        reaction: 'Urticaire, angio-œdème',
        severity: 'severe',
        onsetDate: new Date('2010-03-15'),
        status: 'active',
        verifiedBy: 'Dr. Martin',
        verifiedAt: new Date('2020-01-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `allergy-2-${patientId}`,
        patientId,
        allergen: 'Produits de contraste iodés',
        allergenType: 'medication',
        reaction: 'Réaction anaphylactoïde',
        severity: 'life_threatening',
        status: 'active',
        notes: 'Prémédication obligatoire avant tout examen avec contraste',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get immunizations for patient
   */
  async getImmunizations(patientId: string): Promise<ImmunizationEntry[]> {
    return [
      {
        id: `imm-1-${patientId}`,
        patientId,
        vaccineName: 'Vaccin Hépatite B',
        cvxCode: '45',
        manufacturer: 'GSK',
        doseNumber: 3,
        administeredAt: new Date('2020-03-15'),
        administeredBy: 'Infirmière Dupont',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `imm-2-${patientId}`,
        patientId,
        vaccineName: 'Vaccin Grippe 2023-2024',
        cvxCode: '158',
        manufacturer: 'Sanofi',
        doseNumber: 1,
        administeredAt: new Date('2023-10-15'),
        administeredBy: 'Dr. Martin',
        status: 'completed',
        nextDueDate: new Date('2024-10-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: `imm-3-${patientId}`,
        patientId,
        vaccineName: 'Vaccin Pneumocoque (PPSV23)',
        cvxCode: '33',
        manufacturer: 'Merck',
        doseNumber: 1,
        administeredAt: new Date('2021-06-20'),
        administeredBy: 'Dr. Martin',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  }

  /**
   * Get recent vitals for patient
   */
  async getRecentVitals(patientId: string): Promise<VitalSignsEntry | undefined> {
    return {
      id: `vitals-1-${patientId}`,
      patientId,
      timestamp: new Date(),
      temperature: { value: 36.8, unit: 'C' },
      heartRate: 72,
      respiratoryRate: 16,
      bloodPressure: { systolic: 145, diastolic: 85 },
      oxygenSaturation: 97,
      weight: { value: 75.5, unit: 'kg' },
      height: { value: 175, unit: 'cm' },
      bmi: 24.7,
      position: 'sitting',
      recordedBy: 'Infirmière Dupont',
      source: 'dialyse',
      createdAt: new Date()
    };
  }

  /**
   * Add new event to patient timeline
   */
  async addEvent(event: Omit<EHREvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<EHREvent> {
    const newEvent: EHREvent = {
      id: `ehr-${Date.now()}`,
      ...event,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Would save to database
    return newEvent;
  }

  /**
   * Add or update problem
   */
  async upsertProblem(problem: Omit<PatientProblem, 'id' | 'createdAt' | 'updatedAt'>): Promise<PatientProblem> {
    const newProblem: PatientProblem = {
      id: `prob-${Date.now()}`,
      ...problem,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return newProblem;
  }

  /**
   * Add medication
   */
  async addMedication(medication: Omit<MedicationEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<MedicationEntry> {
    const newMedication: MedicationEntry = {
      id: `med-${Date.now()}`,
      ...medication,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return newMedication;
  }

  /**
   * Perform medication reconciliation
   */
  async performMedicationReconciliation(
    patientId: string,
    performedBy: string,
    context: MedicationReconciliation['context'],
    medications: MedicationReconciliation['medicationsReviewed']
  ): Promise<MedicationReconciliation> {
    const reconciliation: MedicationReconciliation = {
      id: `recon-${Date.now()}`,
      patientId,
      performedAt: new Date(),
      performedBy,
      context,
      medicationsReviewed: medications,
      discrepancies: [],
      createdAt: new Date()
    };

    // Check for discrepancies
    for (const med of medications) {
      if (med.previousStatus === 'active' && med.newStatus === 'discontinued' && !med.notes) {
        reconciliation.discrepancies.push({
          type: 'omission',
          description: `${med.medicationName} arrêté sans documentation`,
          resolution: 'Documentation requise'
        });
      }
    }

    return reconciliation;
  }

  /**
   * Add vital signs
   */
  async addVitalSigns(vitals: Omit<VitalSignsEntry, 'id' | 'createdAt'>): Promise<VitalSignsEntry> {
    const entry: VitalSignsEntry = {
      id: `vitals-${Date.now()}`,
      ...vitals,
      createdAt: new Date()
    };

    // Calculate BMI if weight and height provided
    if (entry.weight && entry.height) {
      const weightKg = entry.weight.unit === 'kg' ? entry.weight.value : entry.weight.value * 0.453592;
      const heightM = entry.height.unit === 'cm' ? entry.height.value / 100 : entry.height.value * 0.0254;
      entry.bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
    }

    return entry;
  }

  /**
   * Add allergy
   */
  async addAllergy(allergy: Omit<AllergyEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<AllergyEntry> {
    const entry: AllergyEntry = {
      id: `allergy-${Date.now()}`,
      ...allergy,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return entry;
  }

  /**
   * Add immunization
   */
  async addImmunization(immunization: Omit<ImmunizationEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ImmunizationEntry> {
    const entry: ImmunizationEntry = {
      id: `imm-${Date.now()}`,
      ...immunization,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return entry;
  }

  /**
   * Search patient records
   */
  async searchRecords(
    patientId: string,
    query: string,
    options?: {
      eventTypes?: EHREventType[];
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<EHREvent[]> {
    const allEvents = await this.aggregateEvents(patientId, options);
    const queryLower = query.toLowerCase();

    return allEvents.filter(event =>
      event.title.toLowerCase().includes(queryLower) ||
      event.summary.toLowerCase().includes(queryLower) ||
      JSON.stringify(event.data).toLowerCase().includes(queryLower)
    ).slice(0, options?.limit || 20);
  }

  /**
   * Get patient summary for clinical handoff
   */
  async getClinicalSummary(patientId: string): Promise<{
    patient: { name: string; mrn: string; age: number; gender: string };
    activeProblems: string[];
    activeMedications: string[];
    allergies: string[];
    recentLabs: { name: string; value: string; date: Date }[];
    recentVitals: { bp: string; hr: number; temp: number; spo2: number };
    alerts: string[];
  }> {
    const timeline = await this.getPatientTimeline(patientId);
    const now = new Date();
    const age = Math.floor((now.getTime() - timeline.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    return {
      patient: {
        name: timeline.patientName,
        mrn: timeline.mrn,
        age,
        gender: timeline.gender
      },
      activeProblems: timeline.activeProblems.map(p => `${p.description} (${p.code})`),
      activeMedications: timeline.activeMedications.map(m => `${m.medicationName} ${m.dosage}${m.unit} ${m.frequency}`),
      allergies: timeline.allergies.map(a => `${a.allergen} - ${a.severity}`),
      recentLabs: [
        { name: 'Créatinine', value: '450 µmol/L', date: new Date() },
        { name: 'DFG', value: '12 mL/min', date: new Date() },
        { name: 'Potassium', value: '5.2 mmol/L', date: new Date() }
      ],
      recentVitals: {
        bp: timeline.recentVitals ? `${timeline.recentVitals.bloodPressure?.systolic}/${timeline.recentVitals.bloodPressure?.diastolic}` : 'N/A',
        hr: timeline.recentVitals?.heartRate || 0,
        temp: timeline.recentVitals?.temperature?.value || 0,
        spo2: timeline.recentVitals?.oxygenSaturation || 0
      },
      alerts: [
        'Allergie sévère: Pénicilline',
        'IRC stade 5 - Adapter les doses',
        'HTA non contrôlée - TA > 140/90'
      ]
    };
  }
}
