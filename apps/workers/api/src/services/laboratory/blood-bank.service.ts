/**
 * Blood Bank Service - Banque de Sang & Transfusion
 *
 * Comprehensive blood bank management including:
 * - Blood typing and compatibility testing
 * - Blood product inventory management
 * - Transfusion ordering and tracking
 * - Adverse reaction monitoring
 * - Donor management
 * - Regulatory compliance (EFS)
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types & Interfaces
// ============================================================================

// Blood Type & Compatibility
export interface BloodType {
  aboGroup: ABOGroup;
  rhFactor: RhFactor;
  phenotype?: BloodPhenotype;
  antibodies: Antibody[];
}

export type ABOGroup = 'A' | 'B' | 'AB' | 'O';
export type RhFactor = 'positive' | 'negative';

export interface BloodPhenotype {
  kell: 'K+' | 'K-';
  kidd: {
    jka: boolean;
    jkb: boolean;
  };
  duffy: {
    fya: boolean;
    fyb: boolean;
  };
  mns: {
    m: boolean;
    n: boolean;
    s: boolean;
  };
  lewis: {
    lea: boolean;
    leb: boolean;
  };
  p1: boolean;
  lutheran: {
    lua: boolean;
    lub: boolean;
  };
}

export interface Antibody {
  id: string;
  name: string;
  specificity: string;
  clinicalSignificance: 'high' | 'moderate' | 'low';
  detectedAt: string;
  titerLevel?: string;
  notes?: string;
}

// Patient Blood Record
export interface PatientBloodRecord {
  id: string;
  organizationId: string;
  patientId: string;
  patientName: string;
  mrn: string;
  dateOfBirth: string;

  // Blood Type
  bloodType: BloodType;
  bloodTypeConfirmed: boolean;
  bloodTypeHistory: BloodTypeTest[];

  // Antibodies
  antibodyScreenHistory: AntibodyScreen[];
  identifiedAntibodies: Antibody[];

  // Transfusion History
  transfusionHistory: TransfusionRecord[];
  totalUnitsReceived: number;
  lastTransfusionDate?: string;

  // Special Requirements
  specialRequirements: TransfusionRequirement[];
  irradiatedRequired: boolean;
  cmvNegativeRequired: boolean;
  washedRequired: boolean;
  leukoreducedRequired: boolean;

  // Adverse Reactions
  transfusionReactions: TransfusionReaction[];
  hasHistoryOfReactions: boolean;

  // Compatibility
  crossmatchHistory: CrossmatchResult[];

  // Notes
  clinicalNotes?: string;
  alerts: BloodBankAlert[];

  createdAt: string;
  updatedAt: string;
}

export interface BloodTypeTest {
  id: string;
  testDate: string;
  aboForward: ABOGroup;
  aboReverse: ABOGroup;
  rhType: RhFactor;
  method: 'tube' | 'gel_card' | 'solid_phase';
  testedBy: string;
  verifiedBy?: string;
  sampleId: string;
  result: BloodType;
  discrepancy?: string;
}

export interface AntibodyScreen {
  id: string;
  testDate: string;
  method: 'tube' | 'gel_card' | 'solid_phase';
  reagentLot: string;
  result: 'positive' | 'negative';
  testedBy: string;
  verifiedBy?: string;
  sampleId: string;
  cellPanelUsed?: string;
  identifiedAntibodies?: Antibody[];
}

export interface TransfusionRequirement {
  requirement: string;
  reason: string;
  addedAt: string;
  addedBy: string;
  expiresAt?: string;
  permanent: boolean;
}

export interface BloodBankAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
}

// Blood Products
export interface BloodProduct {
  id: string;
  organizationId: string;
  donationId: string;
  productCode: string;
  productType: BloodProductType;
  componentCode: string; // ISBT 128

  // Product Details
  bloodType: BloodType;
  volume: number; // mL
  weight?: number; // grams

  // Collection
  collectionDate: string;
  collectionSite: string;
  donorId?: string;
  donationType: 'whole_blood' | 'apheresis' | 'autologous';

  // Processing
  processedAt?: string;
  processingMethod?: string;
  irradiated: boolean;
  irradiatedAt?: string;
  leukoreduced: boolean;
  washed: boolean;
  cmvStatus: 'negative' | 'positive' | 'untested';

  // Storage
  storageLocation: string;
  storageTemperature: number;
  segment1Attached: boolean;
  segment2Attached: boolean;

  // Expiry
  expiryDate: string;
  expiryTime?: string;

  // Status
  status: ProductStatus;
  reservedForPatient?: string;
  reservedUntil?: string;

  // Quality
  visualInspection: 'pass' | 'fail';
  qualityCheckDate?: string;
  qualityCheckBy?: string;

  // Tracking
  receivedAt?: string;
  receivedFrom?: string;
  issuedAt?: string;
  issuedTo?: string;
  returnedAt?: string;
  discardedAt?: string;
  discardReason?: string;

  createdAt: string;
  updatedAt: string;
}

export type BloodProductType =
  | 'prbc'              // Packed Red Blood Cells (CGR)
  | 'ffp'               // Fresh Frozen Plasma (PFC)
  | 'platelets'         // Platelets (CP/CPA)
  | 'cryoprecipitate'   // Cryoprecipitate
  | 'whole_blood'       // Sang total
  | 'granulocytes'      // Granulocytes
  | 'albumin'           // Albumine
  | 'immunoglobulin'    // Immunoglobulines
  | 'clotting_factor';  // Facteurs de coagulation

export type ProductStatus =
  | 'available'
  | 'reserved'
  | 'crossmatched'
  | 'issued'
  | 'transfused'
  | 'returned'
  | 'expired'
  | 'quarantine'
  | 'discarded';

// Crossmatch
export interface CrossmatchResult {
  id: string;
  organizationId: string;
  patientId: string;
  productId: string;
  productCode: string;

  // Testing
  testDate: string;
  method: 'immediate_spin' | 'antiglobulin' | 'electronic';
  patientSample: string;
  segmentUsed: boolean;

  // Results
  result: 'compatible' | 'incompatible';
  immediateSpinResult?: 'negative' | 'positive';
  ahtResult?: 'negative' | 'positive'; // Antiglobulin test
  incompatibilityReason?: string;

  // Validity
  validUntil: string;
  expired: boolean;

  // Personnel
  testedBy: string;
  verifiedBy?: string;

  createdAt: string;
}

// Transfusion Order
export interface TransfusionOrder {
  id: string;
  organizationId: string;
  orderNumber: string;
  patientId: string;
  patientName: string;
  mrn: string;
  location: string;
  bedNumber?: string;

  // Clinical
  diagnosis: string;
  indication: TransfusionIndication;
  urgency: OrderUrgency;
  specialRequirements: string[];

  // Order Details
  productType: BloodProductType;
  unitsOrdered: number;
  unitsIssued: number;
  unitsTransfused: number;

  // Timing
  orderedAt: string;
  orderedBy: string;
  neededBy?: string;
  sampleCollectedAt?: string;
  sampleReceivedAt?: string;

  // Status
  status: OrderStatus;
  bloodTypingComplete: boolean;
  antibodyScreenComplete: boolean;
  crossmatchComplete: boolean;

  // Products
  products: OrderProduct[];

  // Pre-transfusion
  preMedications?: string[];
  preTransfusionVitals?: VitalSigns;

  // Notes
  clinicalNotes?: string;
  bloodBankNotes?: string;

  createdAt: string;
  updatedAt: string;
}

export type TransfusionIndication =
  | 'anemia'
  | 'hemorrhage'
  | 'surgery'
  | 'coagulopathy'
  | 'thrombocytopenia'
  | 'plasma_exchange'
  | 'prophylaxis'
  | 'other';

export type OrderUrgency =
  | 'routine'       // Routine (2-4h)
  | 'urgent'        // Urgent (1h)
  | 'stat'          // Stat (<30min)
  | 'emergency'     // Emergency (O neg/AB)
  | 'massive';      // Massive transfusion protocol

export type OrderStatus =
  | 'pending'
  | 'sample_needed'
  | 'in_testing'
  | 'ready'
  | 'partially_issued'
  | 'issued'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface OrderProduct {
  productId: string;
  productCode: string;
  productType: BloodProductType;
  bloodType: BloodType;
  status: 'pending' | 'crossmatched' | 'issued' | 'transfused' | 'returned';
  issuedAt?: string;
  issuedBy?: string;
  transfusedAt?: string;
  returnedAt?: string;
  returnReason?: string;
}

export interface VitalSigns {
  temperature: number;
  heartRate: number;
  bloodPressure: {
    systolic: number;
    diastolic: number;
  };
  respiratoryRate: number;
  oxygenSaturation: number;
  recordedAt: string;
  recordedBy: string;
}

// Transfusion Record
export interface TransfusionRecord {
  id: string;
  organizationId: string;
  orderId: string;
  patientId: string;
  productId: string;
  productCode: string;
  productType: BloodProductType;
  bloodType: BloodType;

  // Verification
  verifiedPatientId: boolean;
  verifiedProductLabel: boolean;
  verifiedByNurse: string;
  verifiedBySecondNurse?: string;
  compatibilityTagChecked: boolean;
  bedsideCheck: boolean;

  // Administration
  startTime: string;
  endTime?: string;
  duration?: number; // minutes
  volume: number;
  volumeTransfused?: number;
  rate?: number; // mL/hour
  accessSite: string;
  accessType: 'peripheral_iv' | 'central_line' | 'picc' | 'port';

  // Monitoring
  preVitals: VitalSigns;
  duringVitals: VitalSigns[];
  postVitals?: VitalSigns;
  monitoringFrequency: number; // minutes

  // Outcome
  status: 'in_progress' | 'completed' | 'stopped' | 'reaction';
  completedSuccessfully: boolean;
  stoppedReason?: string;

  // Reaction
  reactionOccurred: boolean;
  reaction?: TransfusionReaction;

  // Notes
  nurseNotes?: string;

  createdAt: string;
  updatedAt: string;
}

// Transfusion Reaction
export interface TransfusionReaction {
  id: string;
  organizationId: string;
  transfusionId: string;
  patientId: string;
  productId: string;

  // Timing
  onsetTime: string;
  recognizedAt: string;
  reportedAt: string;
  reportedBy: string;

  // Symptoms
  symptoms: ReactionSymptom[];
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';

  // Classification
  reactionType: ReactionType;
  confirmedType?: ReactionType;

  // Vitals
  vitalsAtOnset: VitalSigns;

  // Actions
  transfusionStopped: boolean;
  stoppedAt?: string;
  actionsTaken: ReactionAction[];
  medicationsGiven: ReactionMedication[];

  // Workup
  workupOrdered: boolean;
  workupResults?: ReactionWorkup;

  // Outcome
  outcome: 'resolved' | 'hospitalized' | 'icu' | 'death';
  resolvedAt?: string;

  // Investigation
  investigationStatus: 'pending' | 'in_progress' | 'completed';
  rootCause?: string;
  preventiveMeasures?: string[];

  // Reporting
  reportedToEFS: boolean;
  reportedToEFSAt?: string;
  efsReferenceNumber?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ReactionSymptom {
  symptom: string;
  severity: 'mild' | 'moderate' | 'severe';
  onsetTime: string;
}

export type ReactionType =
  | 'febrile_non_hemolytic'   // FNHTR
  | 'allergic_mild'          // Urticaire
  | 'allergic_severe'        // Anaphylaxie
  | 'acute_hemolytic'        // AHTR
  | 'delayed_hemolytic'      // DHTR
  | 'trali'                  // TRALI
  | 'taco'                   // TACO
  | 'septic'                 // Sepsis
  | 'hypotensive'            // Hypotension
  | 'hypothermia'            // Hypothermie
  | 'air_embolism'           // Embolie gazeuse
  | 'iron_overload'          // Surcharge en fer
  | 'gvhd'                   // GVH transfusionnelle
  | 'pta'                    // PTA
  | 'other';

export interface ReactionAction {
  action: string;
  performedAt: string;
  performedBy: string;
}

export interface ReactionMedication {
  medication: string;
  dose: string;
  route: string;
  givenAt: string;
  givenBy: string;
}

export interface ReactionWorkup {
  dacResult?: 'positive' | 'negative';
  hemolysisEvidence?: boolean;
  bilirubin?: number;
  ldh?: number;
  haptoglobin?: number;
  urineHemoglobin?: boolean;
  bloodCultures?: 'positive' | 'negative' | 'pending';
  bnpOrProbnp?: number;
  chestXray?: string;
  tryptase?: number;
}

// Donor Management (for autologous/directed)
export interface Donor {
  id: string;
  organizationId: string;
  donorNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female';
  bloodType: BloodType;

  // Contact
  phone: string;
  email?: string;
  address: string;

  // Eligibility
  status: 'active' | 'deferred' | 'permanently_deferred';
  deferralReason?: string;
  deferralUntil?: string;

  // Donation History
  totalDonations: number;
  lastDonationDate?: string;
  nextEligibleDate?: string;
  donations: DonationRecord[];

  // Health
  weight: number;
  hemoglobin?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };

  // Testing Results
  testingHistory: DonorTestResult[];

  createdAt: string;
  updatedAt: string;
}

export interface DonationRecord {
  id: string;
  date: string;
  type: 'whole_blood' | 'platelets' | 'plasma' | 'double_red';
  site: string;
  collectedBy: string;
  volume: number;
  successful: boolean;
  adverseEvents?: string[];
  productsCreated: string[];
}

export interface DonorTestResult {
  id: string;
  testDate: string;
  testType: string;
  result: 'negative' | 'positive' | 'indeterminate';
  method: string;
  testedBy: string;
}

// Inventory
export interface BloodInventory {
  productType: BloodProductType;
  bloodType: BloodType;
  available: number;
  reserved: number;
  crossmatched: number;
  expiringToday: number;
  expiringSoon: number; // within 3 days
  optimal: number;
  critical: boolean;
}

// Dashboard
export interface BloodBankDashboard {
  inventory: BloodInventory[];
  pendingOrders: TransfusionOrder[];
  pendingCrossmatch: CrossmatchResult[];
  expiringProducts: BloodProduct[];
  recentTransfusions: TransfusionRecord[];
  unresolvedReactions: TransfusionReaction[];
  stats: BloodBankStats;
  alerts: BloodBankAlert[];
}

export interface BloodBankStats {
  totalProductsInStock: number;
  ordersToday: number;
  transfusionsToday: number;
  unitsIssuedToday: number;
  unitsDiscardedThisMonth: number;
  wastageRate: number;
  reactionRate: number;
  crossmatchToTransfusionRatio: number;
}

// ============================================================================
// Blood Bank Service Class
// ============================================================================

export class BloodBankService {
  private db: D1Database;
  private organizationId: string;

  constructor(db: D1Database, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
  }

  // ==========================================================================
  // Patient Blood Record
  // ==========================================================================

  async createPatientRecord(data: {
    patientId: string;
    patientName: string;
    mrn: string;
    dateOfBirth: string;
    bloodType?: BloodType;
  }): Promise<PatientBloodRecord> {
    const record: PatientBloodRecord = {
      id: this.generateId(),
      organizationId: this.organizationId,
      patientId: data.patientId,
      patientName: data.patientName,
      mrn: data.mrn,
      dateOfBirth: data.dateOfBirth,
      bloodType: data.bloodType || {
        aboGroup: 'O',
        rhFactor: 'positive',
        antibodies: []
      },
      bloodTypeConfirmed: !!data.bloodType,
      bloodTypeHistory: [],
      antibodyScreenHistory: [],
      identifiedAntibodies: [],
      transfusionHistory: [],
      totalUnitsReceived: 0,
      specialRequirements: [],
      irradiatedRequired: false,
      cmvNegativeRequired: false,
      washedRequired: false,
      leukoreducedRequired: true, // Universal leukoreduction
      transfusionReactions: [],
      hasHistoryOfReactions: false,
      crossmatchHistory: [],
      alerts: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await PatientBloodRecordDB.create(this.db, record);
    return record;
  }

  async getPatientRecord(patientId: string): Promise<PatientBloodRecord | null> {
    return PatientBloodRecordDB.getByPatientId(this.db, this.organizationId, patientId);
  }

  async performBloodTyping(patientId: string, data: {
    sampleId: string;
    aboForward: ABOGroup;
    aboReverse: ABOGroup;
    rhType: RhFactor;
    method: BloodTypeTest['method'];
    testedBy: string;
    phenotype?: BloodPhenotype;
  }): Promise<BloodTypeTest> {
    let record = await this.getPatientRecord(patientId);
    if (!record) {
      throw new Error('Patient blood record not found');
    }

    // Check for ABO discrepancy
    const discrepancy = data.aboForward !== data.aboReverse
      ? `ABO discrepancy: Forward ${data.aboForward}, Reverse ${data.aboReverse}`
      : undefined;

    const test: BloodTypeTest = {
      id: this.generateId(),
      testDate: new Date().toISOString(),
      aboForward: data.aboForward,
      aboReverse: data.aboReverse,
      rhType: data.rhType,
      method: data.method,
      testedBy: data.testedBy,
      sampleId: data.sampleId,
      result: {
        aboGroup: data.aboForward,
        rhFactor: data.rhType,
        phenotype: data.phenotype,
        antibodies: record.identifiedAntibodies
      },
      discrepancy
    };

    record.bloodTypeHistory.push(test);

    // Update confirmed blood type if no discrepancy and verified
    if (!discrepancy) {
      record.bloodType = test.result;

      // Confirm only after two matching tests
      if (record.bloodTypeHistory.length >= 2) {
        const previousTest = record.bloodTypeHistory[record.bloodTypeHistory.length - 2];
        if (previousTest.result.aboGroup === test.result.aboGroup &&
            previousTest.result.rhFactor === test.result.rhFactor) {
          record.bloodTypeConfirmed = true;
        }
      }
    }

    record.updatedAt = new Date().toISOString();
    await PatientBloodRecordDB.update(this.db, record.id, record);

    return test;
  }

  async performAntibodyScreen(patientId: string, data: {
    sampleId: string;
    method: AntibodyScreen['method'];
    reagentLot: string;
    testedBy: string;
    result: 'positive' | 'negative';
    cellPanelUsed?: string;
  }): Promise<AntibodyScreen> {
    const record = await this.getPatientRecord(patientId);
    if (!record) throw new Error('Patient blood record not found');

    const screen: AntibodyScreen = {
      id: this.generateId(),
      testDate: new Date().toISOString(),
      method: data.method,
      reagentLot: data.reagentLot,
      result: data.result,
      testedBy: data.testedBy,
      sampleId: data.sampleId,
      cellPanelUsed: data.cellPanelUsed
    };

    record.antibodyScreenHistory.push(screen);
    record.updatedAt = new Date().toISOString();

    await PatientBloodRecordDB.update(this.db, record.id, record);
    return screen;
  }

  async identifyAntibodies(patientId: string, antibodies: Omit<Antibody, 'id'>[]): Promise<Antibody[]> {
    const record = await this.getPatientRecord(patientId);
    if (!record) throw new Error('Patient blood record not found');

    const newAntibodies: Antibody[] = antibodies.map(ab => ({
      id: this.generateId(),
      ...ab
    }));

    // Add to patient record (avoid duplicates)
    for (const ab of newAntibodies) {
      const exists = record.identifiedAntibodies.some(
        existing => existing.name === ab.name
      );
      if (!exists) {
        record.identifiedAntibodies.push(ab);
        record.bloodType.antibodies.push(ab);
      }
    }

    // Update last antibody screen with identified antibodies
    if (record.antibodyScreenHistory.length > 0) {
      const lastScreen = record.antibodyScreenHistory[record.antibodyScreenHistory.length - 1];
      lastScreen.identifiedAntibodies = newAntibodies;
    }

    record.updatedAt = new Date().toISOString();
    await PatientBloodRecordDB.update(this.db, record.id, record);

    return newAntibodies;
  }

  async addTransfusionRequirement(patientId: string, data: {
    requirement: string;
    reason: string;
    addedBy: string;
    permanent: boolean;
    expiresAt?: string;
  }): Promise<TransfusionRequirement> {
    const record = await this.getPatientRecord(patientId);
    if (!record) throw new Error('Patient blood record not found');

    const req: TransfusionRequirement = {
      requirement: data.requirement,
      reason: data.reason,
      addedAt: new Date().toISOString(),
      addedBy: data.addedBy,
      permanent: data.permanent,
      expiresAt: data.expiresAt
    };

    record.specialRequirements.push(req);

    // Update flags based on requirement
    if (data.requirement.toLowerCase().includes('irradiated')) {
      record.irradiatedRequired = true;
    }
    if (data.requirement.toLowerCase().includes('cmv')) {
      record.cmvNegativeRequired = true;
    }
    if (data.requirement.toLowerCase().includes('washed')) {
      record.washedRequired = true;
    }

    record.updatedAt = new Date().toISOString();
    await PatientBloodRecordDB.update(this.db, record.id, record);

    return req;
  }

  // ==========================================================================
  // Blood Products
  // ==========================================================================

  async createBloodProduct(data: Partial<BloodProduct>): Promise<BloodProduct> {
    const product: BloodProduct = {
      id: this.generateId(),
      organizationId: this.organizationId,
      donationId: data.donationId || '',
      productCode: data.productCode || await this.generateProductCode(),
      productType: data.productType || 'prbc',
      componentCode: data.componentCode || '',
      bloodType: data.bloodType || { aboGroup: 'O', rhFactor: 'negative', antibodies: [] },
      volume: data.volume || 0,
      weight: data.weight,
      collectionDate: data.collectionDate || new Date().toISOString(),
      collectionSite: data.collectionSite || '',
      donorId: data.donorId,
      donationType: data.donationType || 'whole_blood',
      processedAt: data.processedAt,
      processingMethod: data.processingMethod,
      irradiated: data.irradiated || false,
      leukoreduced: data.leukoreduced || true,
      washed: data.washed || false,
      cmvStatus: data.cmvStatus || 'untested',
      storageLocation: data.storageLocation || '',
      storageTemperature: data.storageTemperature || 4,
      segment1Attached: true,
      segment2Attached: true,
      expiryDate: data.expiryDate || this.calculateExpiry(data.productType || 'prbc'),
      status: 'available',
      visualInspection: 'pass',
      receivedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await BloodProductDB.create(this.db, product);
    return product;
  }

  async getBloodProduct(id: string): Promise<BloodProduct | null> {
    return BloodProductDB.getById(this.db, id);
  }

  async getBloodProductByCode(code: string): Promise<BloodProduct | null> {
    return BloodProductDB.getByCode(this.db, this.organizationId, code);
  }

  async updateProductStatus(id: string, status: ProductStatus, data?: {
    reservedForPatient?: string;
    issuedTo?: string;
    discardReason?: string;
  }): Promise<BloodProduct> {
    const product = await this.getBloodProduct(id);
    if (!product) throw new Error('Product not found');

    const updates: Partial<BloodProduct> = { status };

    switch (status) {
      case 'reserved':
        updates.reservedForPatient = data?.reservedForPatient;
        updates.reservedUntil = new Date(Date.now() + 30 * 60000).toISOString(); // 30 min
        break;
      case 'issued':
        updates.issuedAt = new Date().toISOString();
        updates.issuedTo = data?.issuedTo;
        break;
      case 'transfused':
        break;
      case 'returned':
        updates.returnedAt = new Date().toISOString();
        break;
      case 'discarded':
        updates.discardedAt = new Date().toISOString();
        updates.discardReason = data?.discardReason;
        break;
    }

    return this.updateBloodProduct(id, updates);
  }

  async updateBloodProduct(id: string, updates: Partial<BloodProduct>): Promise<BloodProduct> {
    const product = await this.getBloodProduct(id);
    if (!product) throw new Error('Product not found');

    const updated: BloodProduct = {
      ...product,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await BloodProductDB.update(this.db, id, updated);
    return updated;
  }

  async irradiateProduct(id: string, data: {
    irradiatedBy: string;
    dose: number;
  }): Promise<BloodProduct> {
    const product = await this.getBloodProduct(id);
    if (!product) throw new Error('Product not found');

    // Adjust expiry after irradiation (28 days max from irradiation or original expiry, whichever is sooner)
    const maxExpiry = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString();
    const newExpiry = new Date(product.expiryDate) > new Date(maxExpiry)
      ? maxExpiry
      : product.expiryDate;

    return this.updateBloodProduct(id, {
      irradiated: true,
      irradiatedAt: new Date().toISOString(),
      expiryDate: newExpiry
    });
  }

  async listProducts(filters: {
    productType?: BloodProductType;
    bloodType?: ABOGroup;
    rhFactor?: RhFactor;
    status?: ProductStatus;
    expiringBefore?: string;
    page?: number;
    limit?: number;
  }): Promise<{ products: BloodProduct[]; total: number }> {
    return BloodProductDB.list(this.db, this.organizationId, filters);
  }

  async getCompatibleProducts(patientId: string, productType: BloodProductType): Promise<BloodProduct[]> {
    const record = await this.getPatientRecord(patientId);
    if (!record) throw new Error('Patient blood record not found');

    const compatibleTypes = this.getCompatibleBloodTypes(record.bloodType, productType);

    const { products } = await this.listProducts({
      productType,
      status: 'available',
      limit: 100
    });

    return products.filter(p => {
      // Check blood type compatibility
      const typeCompatible = compatibleTypes.some(
        ct => ct.aboGroup === p.bloodType.aboGroup && ct.rhFactor === p.bloodType.rhFactor
      );

      // Check special requirements
      if (record.irradiatedRequired && !p.irradiated) return false;
      if (record.cmvNegativeRequired && p.cmvStatus !== 'negative') return false;
      if (record.washedRequired && !p.washed) return false;

      // Check for antigen-negative if patient has antibodies
      // This would require phenotype matching in real implementation

      return typeCompatible;
    });
  }

  private getCompatibleBloodTypes(patientType: BloodType, productType: BloodProductType): { aboGroup: ABOGroup; rhFactor: RhFactor }[] {
    const { aboGroup, rhFactor } = patientType;

    // For RBCs: must match or be compatible donor
    if (productType === 'prbc' || productType === 'whole_blood') {
      const compatible: { aboGroup: ABOGroup; rhFactor: RhFactor }[] = [];

      // Same type always compatible
      compatible.push({ aboGroup, rhFactor });

      // O is universal donor
      if (aboGroup !== 'O') {
        compatible.push({ aboGroup: 'O', rhFactor });
        if (rhFactor === 'positive') {
          compatible.push({ aboGroup: 'O', rhFactor: 'negative' });
        }
      }

      // Rh negative can only receive Rh negative
      if (rhFactor === 'positive' && aboGroup !== 'O') {
        compatible.push({ aboGroup, rhFactor: 'negative' });
      }

      // Additional compatibility based on ABO
      if (aboGroup === 'A') {
        // Already has O, add same type
      } else if (aboGroup === 'B') {
        // Already has O, add same type
      } else if (aboGroup === 'AB') {
        // AB can receive A, B, AB, O
        compatible.push({ aboGroup: 'A', rhFactor });
        compatible.push({ aboGroup: 'B', rhFactor });
        if (rhFactor === 'positive') {
          compatible.push({ aboGroup: 'A', rhFactor: 'negative' });
          compatible.push({ aboGroup: 'B', rhFactor: 'negative' });
          compatible.push({ aboGroup: 'AB', rhFactor: 'negative' });
        }
      }

      return compatible;
    }

    // For plasma: reverse compatibility (AB is universal donor)
    if (productType === 'ffp' || productType === 'cryoprecipitate') {
      const compatible: { aboGroup: ABOGroup; rhFactor: RhFactor }[] = [];

      // Same type always compatible
      compatible.push({ aboGroup, rhFactor: 'positive' });
      compatible.push({ aboGroup, rhFactor: 'negative' });

      // AB plasma is universal donor
      if (aboGroup !== 'AB') {
        compatible.push({ aboGroup: 'AB', rhFactor: 'positive' });
        compatible.push({ aboGroup: 'AB', rhFactor: 'negative' });
      }

      // Additional compatibility
      if (aboGroup === 'O') {
        // O can receive O, A, B, AB plasma
        compatible.push({ aboGroup: 'A', rhFactor: 'positive' });
        compatible.push({ aboGroup: 'A', rhFactor: 'negative' });
        compatible.push({ aboGroup: 'B', rhFactor: 'positive' });
        compatible.push({ aboGroup: 'B', rhFactor: 'negative' });
      } else if (aboGroup === 'A') {
        // A can receive A, AB
      } else if (aboGroup === 'B') {
        // B can receive B, AB
      }

      return compatible;
    }

    // Platelets: ABO compatible preferred but not required
    if (productType === 'platelets') {
      // Return all types as technically compatible (with documentation)
      return [
        { aboGroup: 'A', rhFactor: 'positive' },
        { aboGroup: 'A', rhFactor: 'negative' },
        { aboGroup: 'B', rhFactor: 'positive' },
        { aboGroup: 'B', rhFactor: 'negative' },
        { aboGroup: 'AB', rhFactor: 'positive' },
        { aboGroup: 'AB', rhFactor: 'negative' },
        { aboGroup: 'O', rhFactor: 'positive' },
        { aboGroup: 'O', rhFactor: 'negative' }
      ];
    }

    return [{ aboGroup, rhFactor }];
  }

  private calculateExpiry(productType: BloodProductType): string {
    const now = new Date();
    let daysToExpiry: number;

    switch (productType) {
      case 'prbc':
        daysToExpiry = 42; // 42 days for CPDA-1
        break;
      case 'ffp':
        daysToExpiry = 365; // 1 year frozen
        break;
      case 'platelets':
        daysToExpiry = 5; // 5 days
        break;
      case 'cryoprecipitate':
        daysToExpiry = 365;
        break;
      case 'whole_blood':
        daysToExpiry = 35;
        break;
      default:
        daysToExpiry = 30;
    }

    return new Date(now.getTime() + daysToExpiry * 24 * 60 * 60 * 1000).toISOString();
  }

  // ==========================================================================
  // Crossmatch
  // ==========================================================================

  async performCrossmatch(data: {
    patientId: string;
    productId: string;
    patientSample: string;
    method: CrossmatchResult['method'];
    testedBy: string;
    segmentUsed: boolean;
  }): Promise<CrossmatchResult> {
    const patient = await this.getPatientRecord(data.patientId);
    const product = await this.getBloodProduct(data.productId);

    if (!patient) throw new Error('Patient record not found');
    if (!product) throw new Error('Product not found');

    // Simulate crossmatch result (in reality, this would be actual testing)
    const compatible = this.checkCompatibility(patient.bloodType, product.bloodType);

    const result: CrossmatchResult = {
      id: this.generateId(),
      organizationId: this.organizationId,
      patientId: data.patientId,
      productId: data.productId,
      productCode: product.productCode,
      testDate: new Date().toISOString(),
      method: data.method,
      patientSample: data.patientSample,
      segmentUsed: data.segmentUsed,
      result: compatible ? 'compatible' : 'incompatible',
      immediateSpinResult: 'negative',
      ahtResult: 'negative',
      validUntil: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(), // 72 hours
      expired: false,
      testedBy: data.testedBy,
      createdAt: new Date().toISOString()
    };

    if (!compatible) {
      result.incompatibilityReason = 'ABO incompatibility detected';
    }

    // Update product status
    if (compatible) {
      await this.updateProductStatus(data.productId, 'crossmatched');
    }

    // Update patient record
    patient.crossmatchHistory.push(result);
    await PatientBloodRecordDB.update(this.db, patient.id, patient);

    await CrossmatchDB.create(this.db, result);
    return result;
  }

  private checkCompatibility(patientType: BloodType, productType: BloodType): boolean {
    // Basic ABO compatibility check
    const patientABO = patientType.aboGroup;
    const productABO = productType.aboGroup;

    const pABO = patientABO as string;
    const prABO = productABO as string;

    if (pABO === 'AB') return true; // Universal recipient for plasma
    if (prABO === 'O') return true; // Universal donor for RBCs
    if (pABO === prABO) return true;
    if (pABO === 'A' && prABO === 'O') return true;
    if (pABO === 'B' && prABO === 'O') return true;
    if (pABO === 'AB' && (prABO === 'A' || prABO === 'B')) return true;

    return false;
  }

  async electronicCrossmatch(patientId: string, productId: string): Promise<CrossmatchResult> {
    // Electronic crossmatch - computer-based compatibility check
    const patient = await this.getPatientRecord(patientId);
    const product = await this.getBloodProduct(productId);

    if (!patient) throw new Error('Patient record not found');
    if (!product) throw new Error('Product not found');

    // Requirements for electronic crossmatch:
    // 1. Two blood type confirmations
    // 2. Negative antibody screen
    // 3. No history of clinically significant antibodies

    if (!patient.bloodTypeConfirmed) {
      throw new Error('Blood type not confirmed - serologic crossmatch required');
    }

    if (patient.identifiedAntibodies.length > 0) {
      throw new Error('Clinically significant antibodies present - serologic crossmatch required');
    }

    const lastScreen = patient.antibodyScreenHistory[patient.antibodyScreenHistory.length - 1];
    if (!lastScreen || lastScreen.result !== 'negative') {
      throw new Error('Negative antibody screen required for electronic crossmatch');
    }

    return this.performCrossmatch({
      patientId,
      productId,
      patientSample: 'electronic',
      method: 'electronic',
      testedBy: 'system',
      segmentUsed: false
    });
  }

  // ==========================================================================
  // Transfusion Orders
  // ==========================================================================

  async createTransfusionOrder(data: {
    patientId: string;
    patientName: string;
    mrn: string;
    location: string;
    bedNumber?: string;
    diagnosis: string;
    indication: TransfusionIndication;
    urgency: OrderUrgency;
    productType: BloodProductType;
    unitsOrdered: number;
    specialRequirements?: string[];
    orderedBy: string;
    neededBy?: string;
    clinicalNotes?: string;
  }): Promise<TransfusionOrder> {
    const order: TransfusionOrder = {
      id: this.generateId(),
      organizationId: this.organizationId,
      orderNumber: await this.generateOrderNumber(),
      patientId: data.patientId,
      patientName: data.patientName,
      mrn: data.mrn,
      location: data.location,
      bedNumber: data.bedNumber,
      diagnosis: data.diagnosis,
      indication: data.indication,
      urgency: data.urgency,
      specialRequirements: data.specialRequirements || [],
      productType: data.productType,
      unitsOrdered: data.unitsOrdered,
      unitsIssued: 0,
      unitsTransfused: 0,
      orderedAt: new Date().toISOString(),
      orderedBy: data.orderedBy,
      neededBy: data.neededBy,
      status: 'pending',
      bloodTypingComplete: false,
      antibodyScreenComplete: false,
      crossmatchComplete: false,
      products: [],
      clinicalNotes: data.clinicalNotes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Get or create patient blood record
    let patientRecord = await this.getPatientRecord(data.patientId);
    if (!patientRecord) {
      patientRecord = await this.createPatientRecord({
        patientId: data.patientId,
        patientName: data.patientName,
        mrn: data.mrn,
        dateOfBirth: '' // Would need to get from patient system
      });
    }

    // Add patient special requirements to order
    for (const req of patientRecord.specialRequirements) {
      if (!order.specialRequirements.includes(req.requirement)) {
        order.specialRequirements.push(req.requirement);
      }
    }

    // Check what tests are needed
    if (!patientRecord.bloodTypeConfirmed) {
      order.status = 'sample_needed';
    } else {
      order.bloodTypingComplete = true;
    }

    // Check antibody screen (valid for 72 hours)
    const recentScreen = patientRecord.antibodyScreenHistory.find(s =>
      new Date(s.testDate) > new Date(Date.now() - 72 * 60 * 60 * 1000)
    );
    if (recentScreen) {
      order.antibodyScreenComplete = true;
    }

    // For emergency orders, prepare emergency release
    if (data.urgency === 'emergency' || data.urgency === 'massive') {
      await this.prepareEmergencyRelease(order);
    }

    await TransfusionOrderDB.create(this.db, order);
    return order;
  }

  async getTransfusionOrder(id: string): Promise<TransfusionOrder | null> {
    return TransfusionOrderDB.getById(this.db, id);
  }

  async updateTransfusionOrder(id: string, updates: Partial<TransfusionOrder>): Promise<TransfusionOrder> {
    const order = await this.getTransfusionOrder(id);
    if (!order) throw new Error('Order not found');

    const updated: TransfusionOrder = {
      ...order,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await TransfusionOrderDB.update(this.db, id, updated);
    return updated;
  }

  async receiveSample(orderId: string, sampleId: string): Promise<TransfusionOrder> {
    const order = await this.getTransfusionOrder(orderId);
    if (!order) throw new Error('Order not found');

    return this.updateTransfusionOrder(orderId, {
      sampleReceivedAt: new Date().toISOString(),
      status: 'in_testing'
    });
  }

  async assignProductsToOrder(orderId: string, productIds: string[]): Promise<TransfusionOrder> {
    const order = await this.getTransfusionOrder(orderId);
    if (!order) throw new Error('Order not found');

    const products: OrderProduct[] = [];

    for (const productId of productIds) {
      const product = await this.getBloodProduct(productId);
      if (!product) continue;

      // Reserve the product
      await this.updateProductStatus(productId, 'reserved', {
        reservedForPatient: order.patientId
      });

      products.push({
        productId: product.id,
        productCode: product.productCode,
        productType: product.productType,
        bloodType: product.bloodType,
        status: 'pending'
      });
    }

    return this.updateTransfusionOrder(orderId, {
      products: [...order.products, ...products],
      status: 'ready'
    });
  }

  async issueProduct(orderId: string, productId: string, issuedBy: string): Promise<TransfusionOrder> {
    const order = await this.getTransfusionOrder(orderId);
    if (!order) throw new Error('Order not found');

    const productIndex = order.products.findIndex(p => p.productId === productId);
    if (productIndex === -1) throw new Error('Product not in order');

    // Verify crossmatch if required
    const product = await this.getBloodProduct(productId);
    if (!product) throw new Error('Product not found');

    // Issue product
    await this.updateProductStatus(productId, 'issued', { issuedTo: order.location });

    order.products[productIndex].status = 'issued';
    order.products[productIndex].issuedAt = new Date().toISOString();
    order.products[productIndex].issuedBy = issuedBy;
    order.unitsIssued++;

    const newStatus = order.unitsIssued >= order.unitsOrdered ? 'issued' : 'partially_issued';

    return this.updateTransfusionOrder(orderId, {
      products: order.products,
      unitsIssued: order.unitsIssued,
      status: newStatus
    });
  }

  private async prepareEmergencyRelease(order: TransfusionOrder): Promise<void> {
    // For emergency, prepare O negative RBCs or AB plasma without crossmatch
    if (order.productType === 'prbc') {
      const { products } = await this.listProducts({
        productType: 'prbc',
        bloodType: 'O',
        rhFactor: 'negative',
        status: 'available',
        limit: order.unitsOrdered
      });

      for (const product of products.slice(0, order.unitsOrdered)) {
        order.products.push({
          productId: product.id,
          productCode: product.productCode,
          productType: product.productType,
          bloodType: product.bloodType,
          status: 'pending'
        });
      }
    } else if (order.productType === 'ffp') {
      const { products } = await this.listProducts({
        productType: 'ffp',
        bloodType: 'AB',
        status: 'available',
        limit: order.unitsOrdered
      });

      for (const product of products.slice(0, order.unitsOrdered)) {
        order.products.push({
          productId: product.id,
          productCode: product.productCode,
          productType: product.productType,
          bloodType: product.bloodType,
          status: 'pending'
        });
      }
    }

    order.status = 'ready';
    order.bloodBankNotes = 'EMERGENCY RELEASE - Crossmatch pending';
  }

  async listOrders(filters: {
    status?: OrderStatus;
    urgency?: OrderUrgency;
    patientId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ orders: TransfusionOrder[]; total: number }> {
    return TransfusionOrderDB.list(this.db, this.organizationId, filters);
  }

  // ==========================================================================
  // Transfusion Records
  // ==========================================================================

  async startTransfusion(data: {
    orderId: string;
    productId: string;
    verifiedByNurse: string;
    verifiedBySecondNurse?: string;
    accessSite: string;
    accessType: TransfusionRecord['accessType'];
    preVitals: VitalSigns;
    rate?: number;
  }): Promise<TransfusionRecord> {
    const order = await this.getTransfusionOrder(data.orderId);
    if (!order) throw new Error('Order not found');

    const product = await this.getBloodProduct(data.productId);
    if (!product) throw new Error('Product not found');

    // Bedside verification
    const record: TransfusionRecord = {
      id: this.generateId(),
      organizationId: this.organizationId,
      orderId: data.orderId,
      patientId: order.patientId,
      productId: data.productId,
      productCode: product.productCode,
      productType: product.productType,
      bloodType: product.bloodType,
      verifiedPatientId: true,
      verifiedProductLabel: true,
      verifiedByNurse: data.verifiedByNurse,
      verifiedBySecondNurse: data.verifiedBySecondNurse,
      compatibilityTagChecked: true,
      bedsideCheck: true,
      startTime: new Date().toISOString(),
      volume: product.volume,
      rate: data.rate,
      accessSite: data.accessSite,
      accessType: data.accessType,
      preVitals: data.preVitals,
      duringVitals: [],
      monitoringFrequency: 15, // every 15 minutes
      status: 'in_progress',
      completedSuccessfully: false,
      reactionOccurred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update order status
    await this.updateTransfusionOrder(data.orderId, { status: 'in_progress' });

    await TransfusionRecordDB.create(this.db, record);
    return record;
  }

  async recordVitalsDuringTransfusion(transfusionId: string, vitals: VitalSigns): Promise<TransfusionRecord> {
    const record = await this.getTransfusionRecord(transfusionId);
    if (!record) throw new Error('Transfusion record not found');

    record.duringVitals.push(vitals);

    // Check for reaction signs
    const reactionSigns = this.checkForReactionSigns(record.preVitals, vitals);
    if (reactionSigns.length > 0) {
      record.reactionOccurred = true;
      // Alert should be triggered
    }

    return this.updateTransfusionRecord(transfusionId, { duringVitals: record.duringVitals });
  }

  async completeTransfusion(transfusionId: string, data: {
    volumeTransfused: number;
    postVitals: VitalSigns;
    nurseNotes?: string;
  }): Promise<TransfusionRecord> {
    const record = await this.getTransfusionRecord(transfusionId);
    if (!record) throw new Error('Transfusion record not found');

    record.endTime = new Date().toISOString();
    record.duration = Math.round(
      (new Date(record.endTime).getTime() - new Date(record.startTime).getTime()) / 60000
    );
    record.volumeTransfused = data.volumeTransfused;
    record.postVitals = data.postVitals;
    record.nurseNotes = data.nurseNotes;
    record.status = 'completed';
    record.completedSuccessfully = !record.reactionOccurred;

    // Update product status
    await this.updateProductStatus(record.productId, 'transfused');

    // Update order
    const order = await this.getTransfusionOrder(record.orderId);
    if (order) {
      const productIndex = order.products.findIndex(p => p.productId === record.productId);
      if (productIndex !== -1) {
        order.products[productIndex].status = 'transfused';
        order.products[productIndex].transfusedAt = record.endTime;
      }
      order.unitsTransfused++;

      const completed = order.unitsTransfused >= order.unitsOrdered;
      await this.updateTransfusionOrder(order.id, {
        products: order.products,
        unitsTransfused: order.unitsTransfused,
        status: completed ? 'completed' : order.status
      });
    }

    // Update patient record
    const patientRecord = await this.getPatientRecord(record.patientId);
    if (patientRecord) {
      patientRecord.transfusionHistory.push(record);
      patientRecord.totalUnitsReceived++;
      patientRecord.lastTransfusionDate = record.endTime;
      await PatientBloodRecordDB.update(this.db, patientRecord.id, patientRecord);
    }

    return this.updateTransfusionRecord(transfusionId, record);
  }

  async stopTransfusion(transfusionId: string, reason: string): Promise<TransfusionRecord> {
    const record = await this.getTransfusionRecord(transfusionId);
    if (!record) throw new Error('Transfusion record not found');

    record.endTime = new Date().toISOString();
    record.status = 'stopped';
    record.stoppedReason = reason;

    return this.updateTransfusionRecord(transfusionId, record);
  }

  private checkForReactionSigns(preVitals: VitalSigns, currentVitals: VitalSigns): string[] {
    const signs: string[] = [];

    // Temperature increase > 1°C
    if (currentVitals.temperature - preVitals.temperature > 1) {
      signs.push('Fever (temperature increase > 1°C)');
    }

    // Significant BP change
    const bpChange = Math.abs(currentVitals.bloodPressure.systolic - preVitals.bloodPressure.systolic);
    if (bpChange > 30) {
      signs.push('Significant blood pressure change');
    }

    // Tachycardia
    if (currentVitals.heartRate > preVitals.heartRate + 20) {
      signs.push('Tachycardia');
    }

    // Oxygen desaturation
    if (currentVitals.oxygenSaturation < preVitals.oxygenSaturation - 5) {
      signs.push('Oxygen desaturation');
    }

    return signs;
  }

  async getTransfusionRecord(id: string): Promise<TransfusionRecord | null> {
    return TransfusionRecordDB.getById(this.db, id);
  }

  async updateTransfusionRecord(id: string, updates: Partial<TransfusionRecord>): Promise<TransfusionRecord> {
    const record = await this.getTransfusionRecord(id);
    if (!record) throw new Error('Record not found');

    const updated: TransfusionRecord = {
      ...record,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await TransfusionRecordDB.update(this.db, id, updated);
    return updated;
  }

  // ==========================================================================
  // Transfusion Reactions
  // ==========================================================================

  async reportTransfusionReaction(transfusionId: string, data: {
    symptoms: ReactionSymptom[];
    severity: TransfusionReaction['severity'];
    reactionType: ReactionType;
    vitalsAtOnset: VitalSigns;
    reportedBy: string;
    transfusionStopped: boolean;
    actionsTaken: ReactionAction[];
    medicationsGiven?: ReactionMedication[];
  }): Promise<TransfusionReaction> {
    const transfusion = await this.getTransfusionRecord(transfusionId);
    if (!transfusion) throw new Error('Transfusion record not found');

    const reaction: TransfusionReaction = {
      id: this.generateId(),
      organizationId: this.organizationId,
      transfusionId,
      patientId: transfusion.patientId,
      productId: transfusion.productId,
      onsetTime: new Date().toISOString(),
      recognizedAt: new Date().toISOString(),
      reportedAt: new Date().toISOString(),
      reportedBy: data.reportedBy,
      symptoms: data.symptoms,
      severity: data.severity,
      reactionType: data.reactionType,
      vitalsAtOnset: data.vitalsAtOnset,
      transfusionStopped: data.transfusionStopped,
      stoppedAt: data.transfusionStopped ? new Date().toISOString() : undefined,
      actionsTaken: data.actionsTaken,
      medicationsGiven: data.medicationsGiven || [],
      workupOrdered: false,
      outcome: 'resolved',
      investigationStatus: 'pending',
      reportedToEFS: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update transfusion record
    await this.updateTransfusionRecord(transfusionId, {
      reactionOccurred: true,
      status: data.transfusionStopped ? 'reaction' : transfusion.status,
      reaction
    });

    // Update patient record
    const patientRecord = await this.getPatientRecord(transfusion.patientId);
    if (patientRecord) {
      patientRecord.transfusionReactions.push(reaction);
      patientRecord.hasHistoryOfReactions = true;

      // Add special requirements based on reaction type
      if (data.reactionType === 'febrile_non_hemolytic') {
        await this.addTransfusionRequirement(transfusion.patientId, {
          requirement: 'Premedicate with antipyretics',
          reason: 'History of FNHTR',
          addedBy: data.reportedBy,
          permanent: true
        });
      }

      if (data.reactionType === 'allergic_mild' || data.reactionType === 'allergic_severe') {
        await this.addTransfusionRequirement(transfusion.patientId, {
          requirement: 'Washed products or premedicate with antihistamines',
          reason: 'History of allergic reaction',
          addedBy: data.reportedBy,
          permanent: true
        });
      }

      await PatientBloodRecordDB.update(this.db, patientRecord.id, patientRecord);
    }

    await TransfusionReactionDB.create(this.db, reaction);
    return reaction;
  }

  async orderReactionWorkup(reactionId: string): Promise<TransfusionReaction> {
    const reaction = await this.getTransfusionReaction(reactionId);
    if (!reaction) throw new Error('Reaction not found');

    return this.updateTransfusionReaction(reactionId, {
      workupOrdered: true,
      investigationStatus: 'in_progress'
    });
  }

  async recordWorkupResults(reactionId: string, workup: ReactionWorkup): Promise<TransfusionReaction> {
    const reaction = await this.getTransfusionReaction(reactionId);
    if (!reaction) throw new Error('Reaction not found');

    // Analyze workup to confirm reaction type
    let confirmedType = reaction.reactionType;

    if (workup.dacResult === 'positive' && workup.hemolysisEvidence) {
      confirmedType = 'acute_hemolytic';
    } else if (workup.bnpOrProbnp && workup.bnpOrProbnp > 500) {
      confirmedType = 'taco';
    } else if (workup.bloodCultures === 'positive') {
      confirmedType = 'septic';
    }

    return this.updateTransfusionReaction(reactionId, {
      workupResults: workup,
      confirmedType,
      investigationStatus: 'completed'
    });
  }

  async reportToEFS(reactionId: string, reportedBy: string): Promise<TransfusionReaction> {
    const reaction = await this.getTransfusionReaction(reactionId);
    if (!reaction) throw new Error('Reaction not found');

    return this.updateTransfusionReaction(reactionId, {
      reportedToEFS: true,
      reportedToEFSAt: new Date().toISOString(),
      efsReferenceNumber: `EFS-${Date.now()}`
    });
  }

  async getTransfusionReaction(id: string): Promise<TransfusionReaction | null> {
    return TransfusionReactionDB.getById(this.db, id);
  }

  async updateTransfusionReaction(id: string, updates: Partial<TransfusionReaction>): Promise<TransfusionReaction> {
    const reaction = await this.getTransfusionReaction(id);
    if (!reaction) throw new Error('Reaction not found');

    const updated: TransfusionReaction = {
      ...reaction,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await TransfusionReactionDB.update(this.db, id, updated);
    return updated;
  }

  // ==========================================================================
  // Inventory & Dashboard
  // ==========================================================================

  async getInventory(): Promise<BloodInventory[]> {
    const productTypes: BloodProductType[] = ['prbc', 'ffp', 'platelets', 'cryoprecipitate'];
    const bloodTypes: { aboGroup: ABOGroup; rhFactor: RhFactor }[] = [
      { aboGroup: 'O', rhFactor: 'negative' },
      { aboGroup: 'O', rhFactor: 'positive' },
      { aboGroup: 'A', rhFactor: 'negative' },
      { aboGroup: 'A', rhFactor: 'positive' },
      { aboGroup: 'B', rhFactor: 'negative' },
      { aboGroup: 'B', rhFactor: 'positive' },
      { aboGroup: 'AB', rhFactor: 'negative' },
      { aboGroup: 'AB', rhFactor: 'positive' }
    ];

    const inventory: BloodInventory[] = [];

    for (const productType of productTypes) {
      for (const bloodType of bloodTypes) {
        const { products } = await this.listProducts({
          productType,
          bloodType: bloodType.aboGroup,
          rhFactor: bloodType.rhFactor,
          limit: 1000
        });

        const available = products.filter(p => p.status === 'available');
        const reserved = products.filter(p => p.status === 'reserved');
        const crossmatched = products.filter(p => p.status === 'crossmatched');

        const today = new Date().toISOString().split('T')[0];
        const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const expiringToday = available.filter(p => p.expiryDate.startsWith(today));
        const expiringSoon = available.filter(p =>
          p.expiryDate >= today && p.expiryDate <= threeDays
        );

        // Optimal levels vary by type and blood group
        const optimal = this.getOptimalLevel(productType, bloodType);
        const critical = available.length < optimal * 0.25;

        inventory.push({
          productType,
          bloodType: { ...bloodType, antibodies: [] },
          available: available.length,
          reserved: reserved.length,
          crossmatched: crossmatched.length,
          expiringToday: expiringToday.length,
          expiringSoon: expiringSoon.length,
          optimal,
          critical
        });
      }
    }

    return inventory;
  }

  private getOptimalLevel(productType: BloodProductType, bloodType: { aboGroup: ABOGroup; rhFactor: RhFactor }): number {
    // Base levels - would be configurable in practice
    const baseLevels: Record<BloodProductType, number> = {
      prbc: 10,
      ffp: 5,
      platelets: 3,
      cryoprecipitate: 5,
      whole_blood: 2,
      granulocytes: 1,
      albumin: 10,
      immunoglobulin: 5,
      clotting_factor: 5
    };

    // Adjust for blood type prevalence
    let multiplier = 1;
    if (bloodType.aboGroup === 'O' && bloodType.rhFactor === 'positive') multiplier = 2;
    if (bloodType.aboGroup === 'A' && bloodType.rhFactor === 'positive') multiplier = 1.5;
    if (bloodType.aboGroup === 'O' && bloodType.rhFactor === 'negative') multiplier = 1.5; // Universal donor

    return Math.round(baseLevels[productType] * multiplier);
  }

  async getDashboard(): Promise<BloodBankDashboard> {
    const [inventory, pendingOrders, expiringProducts, recentTransfusions, unresolvedReactions] = await Promise.all([
      this.getInventory(),
      TransfusionOrderDB.list(this.db, this.organizationId, { status: 'pending', limit: 20 }),
      this.listProducts({ expiringBefore: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'available', limit: 20 }),
      TransfusionRecordDB.list(this.db, this.organizationId, { fromDate: new Date().toISOString().split('T')[0], limit: 20 }),
      TransfusionReactionDB.list(this.db, this.organizationId, { investigationStatus: 'pending', limit: 10 })
    ]);

    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = await TransfusionOrderDB.list(this.db, this.organizationId, { fromDate: today, limit: 1000 });
    const todayTransfusions = await TransfusionRecordDB.list(this.db, this.organizationId, { fromDate: today, limit: 1000 });

    const totalProducts = inventory.reduce((sum, i) => sum + i.available + i.reserved + i.crossmatched, 0);
    const unitsIssued = todayTransfusions.records.filter(t => t.status === 'completed').length;

    // Get monthly discards
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const discardedProducts = await BloodProductDB.list(this.db, this.organizationId, {
      status: 'discarded',
      limit: 1000
    });
    const discardedThisMonth = discardedProducts.products.filter(p =>
      p.discardedAt && p.discardedAt >= monthStart
    ).length;

    // Calculate crossmatch to transfusion ratio
    const crossmatchCount = await CrossmatchDB.countByPeriod(this.db, this.organizationId, monthStart);
    const transfusionCount = todayTransfusions.total;
    const ctRatio = transfusionCount > 0 ? crossmatchCount / transfusionCount : 0;

    const stats: BloodBankStats = {
      totalProductsInStock: totalProducts,
      ordersToday: todayOrders.total,
      transfusionsToday: todayTransfusions.total,
      unitsIssuedToday: unitsIssued,
      unitsDiscardedThisMonth: discardedThisMonth,
      wastageRate: totalProducts > 0 ? (discardedThisMonth / totalProducts) * 100 : 0,
      reactionRate: transfusionCount > 0 ? (unresolvedReactions.reactions.length / transfusionCount) * 100 : 0,
      crossmatchToTransfusionRatio: ctRatio
    };

    // Critical alerts
    const alerts: BloodBankAlert[] = [];
    for (const inv of inventory) {
      if (inv.critical) {
        alerts.push({
          id: this.generateId(),
          type: 'critical',
          message: `Critical inventory: ${inv.productType} ${inv.bloodType.aboGroup}${inv.bloodType.rhFactor === 'positive' ? '+' : '-'} - Only ${inv.available} units available`,
          createdAt: new Date().toISOString()
        });
      }
      if (inv.expiringToday > 0) {
        alerts.push({
          id: this.generateId(),
          type: 'warning',
          message: `${inv.expiringToday} units of ${inv.productType} ${inv.bloodType.aboGroup}${inv.bloodType.rhFactor === 'positive' ? '+' : '-'} expiring today`,
          createdAt: new Date().toISOString()
        });
      }
    }

    return {
      inventory,
      pendingOrders: pendingOrders.orders,
      pendingCrossmatch: [],
      expiringProducts: expiringProducts.products,
      recentTransfusions: recentTransfusions.records,
      unresolvedReactions: unresolvedReactions.reactions,
      stats,
      alerts
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private generateId(): string {
    return `bb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateProductCode(): Promise<string> {
    const count = await BloodProductDB.count(this.db, this.organizationId);
    return `BP${String(count + 1).padStart(8, '0')}`;
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await TransfusionOrderDB.countByDate(this.db, this.organizationId, date);
    return `TO-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
}

// ============================================================================
// Database Layer (Stubs for D1 Implementation)
// ============================================================================

class PatientBloodRecordDB {
  static async create(db: D1Database, record: PatientBloodRecord): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<PatientBloodRecord | null> { return null; }
  static async getByPatientId(db: D1Database, orgId: string, patientId: string): Promise<PatientBloodRecord | null> { return null; }
  static async update(db: D1Database, id: string, record: PatientBloodRecord): Promise<void> {}
}

class BloodProductDB {
  static async create(db: D1Database, product: BloodProduct): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<BloodProduct | null> { return null; }
  static async getByCode(db: D1Database, orgId: string, code: string): Promise<BloodProduct | null> { return null; }
  static async update(db: D1Database, id: string, product: BloodProduct): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ products: BloodProduct[]; total: number }> {
    return { products: [], total: 0 };
  }
  static async count(db: D1Database, orgId: string): Promise<number> { return 0; }
}

class CrossmatchDB {
  static async create(db: D1Database, result: CrossmatchResult): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<CrossmatchResult | null> { return null; }
  static async countByPeriod(db: D1Database, orgId: string, fromDate: string): Promise<number> { return 0; }
}

class TransfusionOrderDB {
  static async create(db: D1Database, order: TransfusionOrder): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<TransfusionOrder | null> { return null; }
  static async update(db: D1Database, id: string, order: TransfusionOrder): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ orders: TransfusionOrder[]; total: number }> {
    return { orders: [], total: 0 };
  }
  static async countByDate(db: D1Database, orgId: string, date: Date): Promise<number> { return 0; }
}

class TransfusionRecordDB {
  static async create(db: D1Database, record: TransfusionRecord): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<TransfusionRecord | null> { return null; }
  static async update(db: D1Database, id: string, record: TransfusionRecord): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ records: TransfusionRecord[]; total: number }> {
    return { records: [], total: 0 };
  }
}

class TransfusionReactionDB {
  static async create(db: D1Database, reaction: TransfusionReaction): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<TransfusionReaction | null> { return null; }
  static async update(db: D1Database, id: string, reaction: TransfusionReaction): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ reactions: TransfusionReaction[]; total: number }> {
    return { reactions: [], total: 0 };
  }
}

export default BloodBankService;
