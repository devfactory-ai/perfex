/**
 * Pharmacy Management Service
 * Comprehensive pharmacy operations including formulary, inventory, dispensing, and compounding
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

export type DrugSchedule = 'OTC' | 'Rx' | 'Schedule_II' | 'Schedule_III' | 'Schedule_IV' | 'Schedule_V';
export type DrugForm = 'tablet' | 'capsule' | 'liquid' | 'injection' | 'cream' | 'ointment' | 'patch' | 'inhaler' | 'drops' | 'suppository' | 'powder';
export type DispenseStatus = 'pending' | 'verified' | 'prepared' | 'checked' | 'dispensed' | 'picked_up' | 'delivered' | 'returned' | 'cancelled';
export type InventoryAlertType = 'low_stock' | 'expiring' | 'expired' | 'recall' | 'reorder_point';

export interface Drug {
  id: string;
  ndc: string; // National Drug Code
  rxNormCode?: string;
  atcCode?: string;
  name: string;
  genericName: string;
  brandNames: string[];
  manufacturer: string;
  form: DrugForm;
  strength: string;
  unit: string;
  schedule: DrugSchedule;
  therapeutic_class: string;
  dea_schedule?: string;

  // Clinical info
  indications: string[];
  contraindications: string[];
  blackBoxWarning?: string;
  pregnancyCategory?: string;
  lactationWarning?: string;
  renalAdjustment?: string;
  hepaticAdjustment?: string;

  // Storage
  storageConditions: string;
  requiresRefrigeration: boolean;
  lightSensitive: boolean;

  // Formulary
  isFormulary: boolean;
  formularyTier?: number;
  requiresPriorAuth: boolean;
  maxDailyDose?: number;
  maxDailyDoseUnit?: string;

  // Pricing
  awp: number; // Average Wholesale Price
  costPerUnit: number;

  isActive: boolean;
}

export interface FormularyEntry {
  id: string;
  drugId: string;
  drugName: string;
  tier: 1 | 2 | 3 | 4 | 5;
  restrictions?: string[];
  alternatives?: { drugId: string; drugName: string; reason: string }[];
  priorAuthCriteria?: string;
  quantityLimit?: { amount: number; days: number };
  stepTherapyRequired: boolean;
  stepTherapyDrugs?: string[];
  effectiveDate: Date;
  endDate?: Date;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  drugId: string;
  drugName: string;
  ndc: string;
  lotNumber: string;
  expirationDate: Date;

  // Quantities
  quantityOnHand: number;
  quantityAllocated: number;
  quantityAvailable: number;
  unit: string;
  packageSize: number;

  // Location
  locationId: string;
  locationName: string;
  binLocation?: string;

  // Reorder
  reorderPoint: number;
  reorderQuantity: number;
  parLevel: number;

  // Costs
  unitCost: number;
  totalValue: number;

  // Tracking
  receivedDate: Date;
  receivedBy: string;
  supplierId?: string;
  supplierName?: string;
  poNumber?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface Prescription {
  id: string;
  rxNumber: string;
  patientId: string;
  patientName: string;
  dateOfBirth: Date;

  // Prescriber
  prescriberId: string;
  prescriberName: string;
  prescriberNpi?: string;
  prescriberDea?: string;

  // Drug
  drugId: string;
  drugName: string;
  ndc: string;
  strength: string;
  form: DrugForm;

  // Instructions
  sig: string; // Signatura - patient instructions
  quantity: number;
  daysSupply: number;
  refillsAuthorized: number;
  refillsRemaining: number;
  dawCode: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // Dispense As Written

  // Dates
  writtenDate: Date;
  expirationDate: Date;
  lastFilledDate?: Date;
  nextFillDate?: Date;

  // Clinical
  diagnosis?: string;
  icd10Code?: string;
  priorAuthNumber?: string;

  // Status
  status: 'active' | 'on_hold' | 'discontinued' | 'expired' | 'transferred';
  discontinuedReason?: string;

  // Notes
  pharmacistNotes?: string;
  patientCounselingNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface DispenseRecord {
  id: string;
  prescriptionId: string;
  rxNumber: string;
  patientId: string;
  patientName: string;

  // Drug dispensed
  drugId: string;
  drugName: string;
  ndc: string;
  lotNumber: string;
  expirationDate: Date;
  quantityDispensed: number;

  // Workflow
  status: DispenseStatus;
  enteredAt: Date;
  enteredBy: string;
  verifiedAt?: Date;
  verifiedBy?: string; // RPh verification
  preparedAt?: Date;
  preparedBy?: string; // Tech preparation
  checkedAt?: Date;
  checkedBy?: string; // RPh final check
  dispensedAt?: Date;
  dispensedBy?: string;
  pickedUpAt?: Date;
  pickedUpBy?: string;

  // Counseling
  counselingProvided: boolean;
  counselingDeclined: boolean;
  counselingBy?: string;
  counselingNotes?: string;

  // Patient info
  allergiesVerified: boolean;
  interactionsChecked: boolean;
  interactionsFound?: string[];

  // Billing
  insuranceBilled: boolean;
  copayAmount?: number;
  copayCollected?: number;
  claimNumber?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface CompoundingOrder {
  id: string;
  orderNumber: string;
  prescriptionId?: string;
  patientId?: string;
  patientName?: string;

  // Formula
  formulaId?: string;
  formulaName: string;
  finalForm: DrugForm;
  finalQuantity: number;
  finalUnit: string;
  beyondUseDate: Date;

  // Ingredients
  ingredients: {
    drugId: string;
    drugName: string;
    quantity: number;
    unit: string;
    lotNumber: string;
    expirationDate: Date;
  }[];

  // Preparation
  instructions: string;
  equipmentUsed: string[];
  qualityChecks: { checkName: string; result: 'pass' | 'fail'; notes?: string }[];

  // Verification
  preparedBy: string;
  preparedAt: Date;
  verifiedBy?: string;
  verifiedAt?: Date;

  // Status
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  failureReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

export interface InventoryAlert {
  id: string;
  type: InventoryAlertType;
  drugId: string;
  drugName: string;
  lotNumber?: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  createdAt: Date;
}

export interface DrugRecall {
  id: string;
  recallNumber: string;
  recallClass: 'I' | 'II' | 'III';
  drugName: string;
  ndc?: string;
  lotNumbers: string[];
  manufacturer: string;
  reason: string;
  distributionDates: { start: Date; end: Date };
  instructions: string;
  affectedInventory: { inventoryId: string; quantity: number; status: 'identified' | 'quarantined' | 'returned' }[];
  issuedDate: Date;
  createdAt: Date;
}

// =============================================================================
// Pharmacy Service
// =============================================================================

export class PharmacyService {
  private formulary: Map<string, FormularyEntry> = new Map();
  private drugDatabase: Map<string, Drug> = new Map();

  constructor() {
    this.initializeFormulary();
  }

  /**
   * Initialize with sample formulary
   */
  private initializeFormulary(): void {
    const drugs: Drug[] = [
      {
        id: 'drug-metformin',
        ndc: '0378-0221-01',
        rxNormCode: '861007',
        name: 'Metformin HCl',
        genericName: 'Metformin',
        brandNames: ['Glucophage', 'Fortamet'],
        manufacturer: 'Mylan',
        form: 'tablet',
        strength: '500',
        unit: 'mg',
        schedule: 'Rx',
        therapeutic_class: 'Antidiabetic - Biguanide',
        indications: ['Type 2 Diabetes Mellitus'],
        contraindications: ['eGFR < 30 mL/min', 'Acidose métabolique', 'Insuffisance cardiaque décompensée'],
        renalAdjustment: 'Contre-indiqué si DFG < 30 mL/min. Prudence si DFG 30-45 mL/min',
        storageConditions: 'Température ambiante 15-30°C',
        requiresRefrigeration: false,
        lightSensitive: false,
        isFormulary: true,
        formularyTier: 1,
        requiresPriorAuth: false,
        maxDailyDose: 2550,
        maxDailyDoseUnit: 'mg',
        awp: 15.50,
        costPerUnit: 0.08,
        isActive: true
      },
      {
        id: 'drug-amlodipine',
        ndc: '0378-0077-01',
        rxNormCode: '329528',
        name: 'Amlodipine Besylate',
        genericName: 'Amlodipine',
        brandNames: ['Norvasc'],
        manufacturer: 'Mylan',
        form: 'tablet',
        strength: '10',
        unit: 'mg',
        schedule: 'Rx',
        therapeutic_class: 'Calcium Channel Blocker',
        indications: ['Hypertension', 'Angina'],
        contraindications: ['Hypersensibilité aux dihydropyridines'],
        storageConditions: 'Température ambiante 15-30°C',
        requiresRefrigeration: false,
        lightSensitive: true,
        isFormulary: true,
        formularyTier: 1,
        requiresPriorAuth: false,
        maxDailyDose: 10,
        maxDailyDoseUnit: 'mg',
        awp: 45.00,
        costPerUnit: 0.15,
        isActive: true
      },
      {
        id: 'drug-epo',
        ndc: '55513-144-01',
        rxNormCode: '105014',
        name: 'Epoetin Alfa',
        genericName: 'Erythropoietin',
        brandNames: ['Epogen', 'Procrit'],
        manufacturer: 'Amgen',
        form: 'injection',
        strength: '4000',
        unit: 'UI/mL',
        schedule: 'Rx',
        therapeutic_class: 'Erythropoiesis-Stimulating Agent',
        indications: ['Anémie de l\'IRC', 'Anémie chimio-induite'],
        contraindications: ['Hypertension non contrôlée', 'Hypersensibilité'],
        blackBoxWarning: 'Risque accru de décès, événements cardiovasculaires et thromboemboliques',
        storageConditions: 'Réfrigéré 2-8°C. Ne pas congeler.',
        requiresRefrigeration: true,
        lightSensitive: true,
        isFormulary: true,
        formularyTier: 3,
        requiresPriorAuth: true,
        awp: 850.00,
        costPerUnit: 212.50,
        isActive: true
      },
      {
        id: 'drug-pantoprazole',
        ndc: '0093-0112-01',
        rxNormCode: '282452',
        name: 'Pantoprazole Sodium',
        genericName: 'Pantoprazole',
        brandNames: ['Protonix'],
        manufacturer: 'Teva',
        form: 'tablet',
        strength: '40',
        unit: 'mg',
        schedule: 'Rx',
        therapeutic_class: 'Proton Pump Inhibitor',
        indications: ['GERD', 'Ulcère gastrique', 'Zollinger-Ellison'],
        contraindications: ['Hypersensibilité aux benzimidazoles'],
        storageConditions: 'Température ambiante 15-30°C',
        requiresRefrigeration: false,
        lightSensitive: false,
        isFormulary: true,
        formularyTier: 2,
        requiresPriorAuth: false,
        maxDailyDose: 80,
        maxDailyDoseUnit: 'mg',
        awp: 180.00,
        costPerUnit: 0.60,
        isActive: true
      }
    ];

    drugs.forEach(drug => this.drugDatabase.set(drug.id, drug));

    // Add formulary entries
    this.formulary.set('drug-metformin', {
      id: 'form-metformin',
      drugId: 'drug-metformin',
      drugName: 'Metformin HCl',
      tier: 1,
      stepTherapyRequired: false,
      effectiveDate: new Date('2024-01-01')
    });

    this.formulary.set('drug-amlodipine', {
      id: 'form-amlodipine',
      drugId: 'drug-amlodipine',
      drugName: 'Amlodipine',
      tier: 1,
      stepTherapyRequired: false,
      effectiveDate: new Date('2024-01-01')
    });

    this.formulary.set('drug-epo', {
      id: 'form-epo',
      drugId: 'drug-epo',
      drugName: 'Epoetin Alfa',
      tier: 3,
      restrictions: ['Hb < 10 g/dL', 'DFG < 30 mL/min ou dialyse'],
      priorAuthCriteria: 'Documentation de l\'anémie de l\'IRC requise',
      stepTherapyRequired: false,
      effectiveDate: new Date('2024-01-01')
    });
  }

  /**
   * Search drug database
   */
  searchDrugs(query: string, options?: { formularyOnly?: boolean; limit?: number }): Drug[] {
    const queryLower = query.toLowerCase();
    let results = Array.from(this.drugDatabase.values()).filter(drug =>
      drug.name.toLowerCase().includes(queryLower) ||
      drug.genericName.toLowerCase().includes(queryLower) ||
      drug.brandNames.some(b => b.toLowerCase().includes(queryLower)) ||
      drug.ndc.includes(query)
    );

    if (options?.formularyOnly) {
      results = results.filter(d => d.isFormulary);
    }

    return results.slice(0, options?.limit || 50);
  }

  /**
   * Get drug by ID
   */
  getDrug(drugId: string): Drug | undefined {
    return this.drugDatabase.get(drugId);
  }

  /**
   * Check formulary status
   */
  checkFormulary(drugId: string): { isFormulary: boolean; entry?: FormularyEntry; alternatives?: Drug[] } {
    const drug = this.drugDatabase.get(drugId);
    const entry = this.formulary.get(drugId);

    if (!drug) {
      return { isFormulary: false };
    }

    if (entry) {
      return { isFormulary: true, entry };
    }

    // Find alternatives in same therapeutic class
    const alternatives = Array.from(this.drugDatabase.values())
      .filter(d => d.therapeutic_class === drug.therapeutic_class && d.isFormulary && d.id !== drugId);

    return { isFormulary: false, alternatives };
  }

  /**
   * Create prescription
   */
  async createPrescription(data: {
    patientId: string;
    patientName: string;
    dateOfBirth: Date;
    prescriberId: string;
    prescriberName: string;
    prescriberNpi?: string;
    drugId: string;
    sig: string;
    quantity: number;
    daysSupply: number;
    refillsAuthorized: number;
    diagnosis?: string;
    icd10Code?: string;
  }): Promise<Prescription> {
    const drug = this.drugDatabase.get(data.drugId);
    if (!drug) {
      throw new Error('Drug not found in database');
    }

    const rxNumber = `RX${Date.now().toString(36).toUpperCase()}`;
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 1);

    const prescription: Prescription = {
      id: `rx-${Date.now()}`,
      rxNumber,
      patientId: data.patientId,
      patientName: data.patientName,
      dateOfBirth: data.dateOfBirth,
      prescriberId: data.prescriberId,
      prescriberName: data.prescriberName,
      prescriberNpi: data.prescriberNpi,
      drugId: drug.id,
      drugName: drug.name,
      ndc: drug.ndc,
      strength: drug.strength,
      form: drug.form,
      sig: data.sig,
      quantity: data.quantity,
      daysSupply: data.daysSupply,
      refillsAuthorized: data.refillsAuthorized,
      refillsRemaining: data.refillsAuthorized,
      dawCode: 0,
      writtenDate: new Date(),
      expirationDate,
      diagnosis: data.diagnosis,
      icd10Code: data.icd10Code,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return prescription;
  }

  /**
   * Process dispense
   */
  async processDispense(data: {
    prescriptionId: string;
    rxNumber: string;
    patientId: string;
    patientName: string;
    drugId: string;
    quantityToDispense: number;
    lotNumber: string;
    expirationDate: Date;
    enteredBy: string;
  }): Promise<DispenseRecord> {
    const drug = this.drugDatabase.get(data.drugId);

    const dispense: DispenseRecord = {
      id: `disp-${Date.now()}`,
      prescriptionId: data.prescriptionId,
      rxNumber: data.rxNumber,
      patientId: data.patientId,
      patientName: data.patientName,
      drugId: data.drugId,
      drugName: drug?.name || '',
      ndc: drug?.ndc || '',
      lotNumber: data.lotNumber,
      expirationDate: data.expirationDate,
      quantityDispensed: data.quantityToDispense,
      status: 'pending',
      enteredAt: new Date(),
      enteredBy: data.enteredBy,
      counselingProvided: false,
      counselingDeclined: false,
      allergiesVerified: false,
      interactionsChecked: false,
      insuranceBilled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return dispense;
  }

  /**
   * Pharmacist verification
   */
  async verifyDispense(dispenseId: string, verifiedBy: string, allergiesVerified: boolean, interactionsChecked: boolean, interactionsFound?: string[]): Promise<DispenseRecord> {
    // Would update in database
    return {
      id: dispenseId,
      prescriptionId: '',
      rxNumber: '',
      patientId: '',
      patientName: '',
      drugId: '',
      drugName: '',
      ndc: '',
      lotNumber: '',
      expirationDate: new Date(),
      quantityDispensed: 0,
      status: 'verified',
      enteredAt: new Date(),
      enteredBy: '',
      verifiedAt: new Date(),
      verifiedBy,
      allergiesVerified,
      interactionsChecked,
      interactionsFound,
      counselingProvided: false,
      counselingDeclined: false,
      insuranceBilled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Complete dispense with counseling
   */
  async completeDispense(
    dispenseId: string,
    dispensedBy: string,
    counselingProvided: boolean,
    counselingDeclined: boolean,
    counselingNotes?: string
  ): Promise<DispenseRecord> {
    return {
      id: dispenseId,
      prescriptionId: '',
      rxNumber: '',
      patientId: '',
      patientName: '',
      drugId: '',
      drugName: '',
      ndc: '',
      lotNumber: '',
      expirationDate: new Date(),
      quantityDispensed: 0,
      status: 'dispensed',
      enteredAt: new Date(),
      enteredBy: '',
      dispensedAt: new Date(),
      dispensedBy,
      counselingProvided,
      counselingDeclined,
      counselingNotes,
      allergiesVerified: true,
      interactionsChecked: true,
      insuranceBilled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Add inventory
   */
  async addInventory(data: {
    drugId: string;
    lotNumber: string;
    expirationDate: Date;
    quantity: number;
    unit: string;
    packageSize: number;
    locationId: string;
    locationName: string;
    unitCost: number;
    supplierId?: string;
    supplierName?: string;
    poNumber?: string;
    receivedBy: string;
  }): Promise<InventoryItem> {
    const drug = this.drugDatabase.get(data.drugId);

    const item: InventoryItem = {
      id: `inv-${Date.now()}`,
      drugId: data.drugId,
      drugName: drug?.name || '',
      ndc: drug?.ndc || '',
      lotNumber: data.lotNumber,
      expirationDate: data.expirationDate,
      quantityOnHand: data.quantity,
      quantityAllocated: 0,
      quantityAvailable: data.quantity,
      unit: data.unit,
      packageSize: data.packageSize,
      locationId: data.locationId,
      locationName: data.locationName,
      reorderPoint: Math.floor(data.quantity * 0.2),
      reorderQuantity: data.quantity,
      parLevel: Math.floor(data.quantity * 1.5),
      unitCost: data.unitCost,
      totalValue: data.quantity * data.unitCost,
      receivedDate: new Date(),
      receivedBy: data.receivedBy,
      supplierId: data.supplierId,
      supplierName: data.supplierName,
      poNumber: data.poNumber,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return item;
  }

  /**
   * Check inventory levels and generate alerts
   */
  async checkInventoryAlerts(): Promise<InventoryAlert[]> {
    const alerts: InventoryAlert[] = [];
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Would check actual inventory
    // Sample alerts
    alerts.push({
      id: `alert-${Date.now()}`,
      type: 'low_stock',
      drugId: 'drug-metformin',
      drugName: 'Metformin HCl 500mg',
      message: 'Stock bas - 50 unités restantes (seuil: 100)',
      severity: 'medium',
      createdAt: new Date()
    });

    alerts.push({
      id: `alert-${Date.now() + 1}`,
      type: 'expiring',
      drugId: 'drug-pantoprazole',
      drugName: 'Pantoprazole 40mg',
      lotNumber: 'LOT2024001',
      message: 'Expiration dans 25 jours',
      severity: 'high',
      createdAt: new Date()
    });

    return alerts;
  }

  /**
   * Process drug recall
   */
  async processRecall(data: {
    recallNumber: string;
    recallClass: 'I' | 'II' | 'III';
    drugName: string;
    ndc?: string;
    lotNumbers: string[];
    manufacturer: string;
    reason: string;
    instructions: string;
  }): Promise<DrugRecall> {
    const recall: DrugRecall = {
      id: `recall-${Date.now()}`,
      recallNumber: data.recallNumber,
      recallClass: data.recallClass,
      drugName: data.drugName,
      ndc: data.ndc,
      lotNumbers: data.lotNumbers,
      manufacturer: data.manufacturer,
      reason: data.reason,
      distributionDates: { start: new Date(), end: new Date() },
      instructions: data.instructions,
      affectedInventory: [], // Would identify affected inventory
      issuedDate: new Date(),
      createdAt: new Date()
    };

    return recall;
  }

  /**
   * Create compounding order
   */
  async createCompoundingOrder(data: {
    formulaName: string;
    finalForm: DrugForm;
    finalQuantity: number;
    finalUnit: string;
    beyondUseDate: Date;
    ingredients: CompoundingOrder['ingredients'];
    instructions: string;
    equipmentUsed: string[];
    prescriptionId?: string;
    patientId?: string;
    patientName?: string;
  }): Promise<CompoundingOrder> {
    const order: CompoundingOrder = {
      id: `comp-${Date.now()}`,
      orderNumber: `CPD${Date.now().toString(36).toUpperCase()}`,
      prescriptionId: data.prescriptionId,
      patientId: data.patientId,
      patientName: data.patientName,
      formulaName: data.formulaName,
      finalForm: data.finalForm,
      finalQuantity: data.finalQuantity,
      finalUnit: data.finalUnit,
      beyondUseDate: data.beyondUseDate,
      ingredients: data.ingredients,
      instructions: data.instructions,
      equipmentUsed: data.equipmentUsed,
      qualityChecks: [],
      preparedBy: '',
      preparedAt: new Date(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return order;
  }

  /**
   * Get pharmacy workload statistics
   */
  async getWorkloadStats(): Promise<{
    pendingDispenses: number;
    verificationQueue: number;
    completedToday: number;
    avgFillTimeMinutes: number;
    lowStockAlerts: number;
    expiringAlerts: number;
    recallsActive: number;
    compoundingPending: number;
  }> {
    return {
      pendingDispenses: 23,
      verificationQueue: 8,
      completedToday: 145,
      avgFillTimeMinutes: 12,
      lowStockAlerts: 5,
      expiringAlerts: 3,
      recallsActive: 1,
      compoundingPending: 2
    };
  }

  /**
   * Get drug interaction check
   */
  async checkInteractions(drugIds: string[]): Promise<{
    interactions: {
      drug1: string;
      drug2: string;
      severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
      description: string;
      recommendation: string;
    }[];
  }> {
    // Would integrate with drug interaction database
    return { interactions: [] };
  }

  /**
   * Get patient medication profile
   */
  async getPatientMedProfile(patientId: string): Promise<{
    activePrescriptions: Prescription[];
    allergies: string[];
    recentDispenses: DispenseRecord[];
    adherenceScore?: number;
  }> {
    return {
      activePrescriptions: [],
      allergies: ['Pénicilline', 'Aspirine'],
      recentDispenses: [],
      adherenceScore: 85
    };
  }
}
