/**
 * Microbiology Service - Microbiologie Avancée
 *
 * Comprehensive microbiology laboratory management including:
 * - Specimen processing and culture
 * - Organism identification
 * - Antimicrobial susceptibility testing (AST)
 * - Antibiograms and resistance patterns
 * - Molecular diagnostics
 * - Infection control integration
 * - MDRO surveillance
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface MicrobiologyOrder {
  id: string;
  organizationId: string;
  orderNumber: string;
  status: OrderStatus;
  priority: OrderPriority;

  // Patient Information
  patientId: string;
  patientName: string;
  mrn: string;
  dateOfBirth: string;
  location: string;
  bedNumber?: string;

  // Ordering
  orderingPhysician: string;
  orderingDepartment: string;
  orderedAt: string;
  clinicalIndication: string;
  relevantHistory?: string;
  currentAntibiotics?: string[];

  // Specimen
  specimen: MicrobiologySpecimen;

  // Tests
  testsOrdered: TestType[];
  cultures: Culture[];
  molecularTests: MolecularDiagnostic[];
  serology: SerologyTest[];

  // Results
  primaryResult?: MicrobiologyResult;
  criticalValue: boolean;
  criticalValueReported: boolean;
  criticalValueReportedAt?: string;
  criticalValueReportedTo?: string;

  // Reporting
  preliminaryReportAt?: string;
  finalReportAt?: string;
  reportedBy?: string;
  verifiedBy?: string;

  // TAT
  tatHours?: number;
  tatTarget: number;

  // Infection Control
  infectionControlNotified: boolean;
  mdroDetected: boolean;
  isolationRequired: boolean;
  isolationType?: string;

  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | 'ordered'
  | 'collected'
  | 'received'
  | 'in_process'
  | 'preliminary'
  | 'final'
  | 'amended'
  | 'cancelled';

export type OrderPriority =
  | 'routine'
  | 'urgent'
  | 'stat';

export interface MicrobiologySpecimen {
  id: string;
  specimenType: SpecimenType;
  specimenSource: string;
  collectionDate: string;
  collectionTime: string;
  collectedBy?: string;
  receivedAt?: string;
  receivedBy?: string;

  // Quality
  quality: 'acceptable' | 'suboptimal' | 'rejected';
  rejectionReason?: string;
  volume?: number;
  appearance?: string;

  // Processing
  gramStainPerformed: boolean;
  gramStainResult?: GramStainResult;

  // Special handling
  transportMedium?: string;
  transportTemperature?: string;
  anaerobeCollection: boolean;
}

export type SpecimenType =
  | 'blood'
  | 'urine'
  | 'sputum'
  | 'wound'
  | 'csf'               // Cerebrospinal fluid
  | 'stool'
  | 'respiratory'
  | 'tissue'
  | 'abscess'
  | 'catheter_tip'
  | 'body_fluid'
  | 'genital'
  | 'eye'
  | 'ear'
  | 'nasal'
  | 'throat'
  | 'other';

export type TestType =
  | 'culture_aerobic'
  | 'culture_anaerobic'
  | 'culture_fungal'
  | 'culture_afb'           // Acid-fast bacilli
  | 'culture_blood'
  | 'gram_stain'
  | 'direct_exam'
  | 'pcr'
  | 'antigen_detection'
  | 'serology'
  | 'parasitology';

export interface GramStainResult {
  id: string;
  performedAt: string;
  performedBy: string;

  // Cells
  wbcCount: 'none' | 'rare' | 'few' | 'moderate' | 'many';
  epithelialCells: 'none' | 'rare' | 'few' | 'moderate' | 'many';
  rbc: boolean;

  // Organisms
  organisms: GramStainOrganism[];

  // Quality
  specimenQuality: 'good' | 'acceptable' | 'poor';
  comments?: string;
}

export interface GramStainOrganism {
  morphology: OrganismMorphology;
  gramReaction: 'positive' | 'negative' | 'variable';
  arrangement: string;
  quantity: 'rare' | 'few' | 'moderate' | 'many';
}

export type OrganismMorphology =
  | 'cocci'
  | 'bacilli'
  | 'coccobacilli'
  | 'spirochete'
  | 'yeast'
  | 'hyphae'
  | 'mixed';

// Culture
export interface Culture {
  id: string;
  orderId: string;
  cultureType: CultureType;
  status: CultureStatus;

  // Setup
  setupDate: string;
  setupBy: string;
  mediaUsed: CultureMedia[];

  // Incubation
  incubationConditions: IncubationConditions;

  // Reading
  readings: CultureReading[];

  // Isolates
  isolates: Isolate[];

  // Timing
  noGrowthFinalAt?: string;
  positiveAt?: string;
  finalizedAt?: string;
  finalizedBy?: string;

  // Result
  result: CultureResult;
  interpretation?: string;
}

export type CultureType =
  | 'aerobic'
  | 'anaerobic'
  | 'blood'
  | 'fungal'
  | 'afb'
  | 'urine'
  | 'stool';

export type CultureStatus =
  | 'setup'
  | 'incubating'
  | 'reading'
  | 'identification'
  | 'susceptibility'
  | 'finalized'
  | 'no_growth';

export interface CultureMedia {
  mediaType: string;
  plate?: string;
  tube?: string;
  specialAdditive?: string;
}

export interface IncubationConditions {
  temperature: number;
  atmosphere: 'aerobic' | 'anaerobic' | 'co2' | 'microaerophilic';
  duration: number; // hours
  shaking?: boolean;
}

export interface CultureReading {
  id: string;
  readDate: string;
  readTime: string;
  readBy: string;
  hoursIncubated: number;
  growth: 'no_growth' | 'light' | 'moderate' | 'heavy';
  colonyMorphology?: string;
  colonyCount?: number;
  hemolysis?: 'alpha' | 'beta' | 'gamma' | 'none';
  pigment?: string;
  odor?: string;
  notes?: string;
  continueIncubation: boolean;
}

export type CultureResult =
  | 'no_growth'
  | 'normal_flora'
  | 'pathogen_isolated'
  | 'mixed_flora'
  | 'contaminated';

// Isolate (Organism)
export interface Isolate {
  id: string;
  cultureId: string;
  isolateNumber: number;
  status: IsolateStatus;

  // Identification
  genus?: string;
  species?: string;
  fullName?: string;
  identificationMethod: IdentificationMethod;
  identificationConfidence?: number; // 0-100%
  gramStain?: 'positive' | 'negative';
  morphology?: OrganismMorphology;

  // Quantification
  quantity: 'rare' | 'few' | 'moderate' | 'heavy';
  cfuCount?: string;
  significantGrowth: boolean;

  // Susceptibility Testing
  susceptibilityTests: SusceptibilityTest[];
  resistanceProfile?: ResistanceProfile;

  // Classification
  clinicalSignificance: 'pathogen' | 'probable_pathogen' | 'colonizer' | 'contaminant' | 'normal_flora';
  mdroClassification?: MDROType;

  // Typing
  molecularTyping?: MolecularTyping;

  // Notes
  comments?: string;

  createdAt: string;
  updatedAt: string;
}

export type IsolateStatus =
  | 'growing'
  | 'identifying'
  | 'susceptibility_testing'
  | 'complete'
  | 'referred';

export type IdentificationMethod =
  | 'conventional'
  | 'automated'           // VITEK, BD Phoenix
  | 'maldi_tof'
  | 'pcr'
  | 'sequencing'
  | 'biochemical';

// Susceptibility Testing
export interface SusceptibilityTest {
  id: string;
  isolateId: string;
  testMethod: SusceptibilityMethod;
  testDate: string;
  testedBy: string;

  // Panel
  panelName?: string;
  antibiotics: AntibioticResult[];

  // Quality Control
  qcPerformed: boolean;
  qcPassed?: boolean;
  qcOrganism?: string;

  // Status
  status: 'in_progress' | 'pending_review' | 'verified' | 'released';
  verifiedBy?: string;
  verifiedAt?: string;
}

export type SusceptibilityMethod =
  | 'disk_diffusion'      // Kirby-Bauer
  | 'mic_broth'           // Broth microdilution
  | 'mic_automated'       // VITEK, Phoenix
  | 'etest'
  | 'gradient_strip';

export interface AntibioticResult {
  id: string;
  antibiotic: string;
  antibioticCode: string;
  antibioticClass: AntibioticClass;

  // Result
  result: 'S' | 'I' | 'R' | 'SDD' | 'NS';  // Susceptible, Intermediate, Resistant, Dose-dependent, Non-susceptible
  mic?: number;
  micUnit?: string;
  zoneDiameter?: number;

  // Interpretation
  breakpoint: string;
  interpretiveCriteria: string;
  comments?: string;

  // Cascade
  reportable: boolean;
  suppressedReason?: string;
}

export type AntibioticClass =
  | 'penicillins'
  | 'cephalosporins'
  | 'carbapenems'
  | 'aminoglycosides'
  | 'fluoroquinolones'
  | 'macrolides'
  | 'tetracyclines'
  | 'glycopeptides'
  | 'oxazolidinones'
  | 'sulfonamides'
  | 'antifungals'
  | 'other';

export interface ResistanceProfile {
  esbl: boolean;           // Extended-spectrum beta-lactamase
  carbapenemase: boolean;
  cpe: boolean;            // Carbapenemase-producing Enterobacterales
  mrsa: boolean;           // Methicillin-resistant S. aureus
  vre: boolean;            // Vancomycin-resistant Enterococcus
  mdr: boolean;            // Multi-drug resistant
  xdr: boolean;            // Extensively drug-resistant
  pdr: boolean;            // Pan-drug resistant

  resistanceGenes?: string[];
  carbapenemaseType?: string;
  mlsb?: boolean;          // Macrolide-lincosamide-streptogramin B
  amp_c?: boolean;

  notes?: string;
}

export type MDROType =
  | 'mrsa'
  | 'vre'
  | 'esbl'
  | 'cre'                  // Carbapenem-resistant Enterobacterales
  | 'crpa'                 // Carbapenem-resistant P. aeruginosa
  | 'crab'                 // Carbapenem-resistant A. baumannii
  | 'c_diff'               // C. difficile
  | 'other';

export interface MolecularTyping {
  method: 'mlst' | 'pfge' | 'wgs' | 'spa_typing' | 'other';
  result: string;
  clonalComplex?: string;
  sequenceType?: string;
  performedAt: string;
}

// Molecular Diagnostics
export interface MolecularDiagnostic {
  id: string;
  orderId: string;
  testName: string;
  testType: MolecularTestType;
  targetPathogen?: string;
  targetGene?: string;

  // Method
  method: 'pcr' | 'rt_pcr' | 'multiplex_pcr' | 'sequencing' | 'hybridization';
  platform?: string;

  // Sample
  sampleProcessedAt?: string;
  extractionMethod?: string;

  // Results
  status: 'ordered' | 'in_process' | 'completed' | 'failed';
  result?: 'detected' | 'not_detected' | 'indeterminate' | 'invalid';
  quantitativeResult?: number;
  quantitativeUnit?: string;
  ctValue?: number;

  // Quality
  internalControlValid: boolean;
  inhibitionDetected: boolean;

  // Interpretation
  interpretation?: string;
  comments?: string;

  // Timing
  performedAt?: string;
  performedBy?: string;
  verifiedAt?: string;
  verifiedBy?: string;

  createdAt: string;
}

export type MolecularTestType =
  | 'respiratory_panel'
  | 'gi_panel'
  | 'meningitis_panel'
  | 'sti_panel'
  | 'flu_rsv'
  | 'covid'
  | 'tb'
  | 'mrsa_screening'
  | 'vre_screening'
  | 'cpe_screening'
  | 'c_diff'
  | 'single_pathogen';

// Serology
export interface SerologyTest {
  id: string;
  orderId: string;
  testName: string;
  pathogen: string;
  antibodyType?: 'IgG' | 'IgM' | 'IgA' | 'total';
  method: string;

  // Result
  status: 'ordered' | 'in_process' | 'completed';
  result?: 'positive' | 'negative' | 'equivocal' | 'reactive' | 'non_reactive';
  titer?: string;
  index?: number;
  cutoff?: number;

  // Interpretation
  interpretation?: string;
  clinicalSignificance?: string;

  // Timing
  performedAt?: string;
  performedBy?: string;

  createdAt: string;
}

// Microbiology Result
export interface MicrobiologyResult {
  id: string;
  orderId: string;
  resultType: 'preliminary' | 'final' | 'amended';

  // Summary
  resultSummary: string;
  organisms: OrganismSummary[];

  // Interpretation
  interpretation?: string;
  clinicalComment?: string;
  therapeuticRecommendation?: string;

  // Critical
  criticalValue: boolean;
  criticalFindings?: string[];

  // Reporting
  reportedAt: string;
  reportedBy: string;
  verifiedBy?: string;

  // Amendment
  amendedFrom?: string;
  amendmentReason?: string;
}

export interface OrganismSummary {
  organismName: string;
  quantity: string;
  significance: string;
  susceptibilityAvailable: boolean;
  susceptibilitySummary?: string;
  mdro: boolean;
  mdroType?: MDROType;
}

// Antibiogram (Hospital/Unit Level)
export interface Antibiogram {
  id: string;
  organizationId: string;
  name: string;
  reportingPeriod: {
    startDate: string;
    endDate: string;
  };
  location?: string;
  patientType?: 'inpatient' | 'outpatient' | 'icu' | 'all';
  specimenTypes: SpecimenType[];

  // Data
  organisms: AntibiogramOrganism[];

  // Metadata
  totalIsolates: number;
  generatedAt: string;
  generatedBy: string;
  methodology: string;
  exclusions?: string[];

  status: 'draft' | 'approved' | 'published';
  approvedBy?: string;
  approvedAt?: string;
}

export interface AntibiogramOrganism {
  organismName: string;
  isolateCount: number;
  susceptibilities: AntibiogramSusceptibility[];
}

export interface AntibiogramSusceptibility {
  antibiotic: string;
  testedCount: number;
  susceptibleCount: number;
  susceptiblePercent: number;
  intermediateCount: number;
  resistantCount: number;
  footnote?: string;
}

// Infection Control Alert
export interface InfectionControlAlert {
  id: string;
  organizationId: string;
  alertType: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Source
  orderId?: string;
  patientId: string;
  patientName: string;
  location: string;

  // Details
  organism?: string;
  mdroType?: MDROType;
  description: string;
  recommendations: string[];

  // Actions
  isolationRequired: boolean;
  isolationType?: string;
  contactTracingRequired: boolean;
  environmentalCleaningRequired: boolean;

  // Status
  status: 'new' | 'acknowledged' | 'in_progress' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedBy?: string;
  resolvedAt?: string;

  // Follow-up
  followUpActions: FollowUpAction[];

  createdAt: string;
  updatedAt: string;
}

export type AlertType =
  | 'mdro_detection'
  | 'outbreak_suspected'
  | 'blood_culture_positive'
  | 'csf_positive'
  | 'critical_result'
  | 'unusual_pathogen'
  | 'resistance_pattern';

export interface FollowUpAction {
  id: string;
  action: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'completed';
  completedAt?: string;
  notes?: string;
}

// Dashboard
export interface MicrobiologyDashboard {
  summary: MicrobiologySummary;
  pendingOrders: MicrobiologyOrder[];
  positiveBloodCultures: MicrobiologyOrder[];
  criticalResults: MicrobiologyOrder[];
  mdroAlerts: InfectionControlAlert[];
  tatMetrics: TATMetrics;
  volumeByTestType: TestVolumeMetric[];
  resistanceTrends: ResistanceTrend[];
}

export interface MicrobiologySummary {
  ordersToday: number;
  pendingCultures: number;
  positiveBloodCultures: number;
  criticalResults: number;
  mdroIsolates: number;
  averageTAT: number;
}

export interface TATMetrics {
  bloodCulture: { average: number; target: number; compliance: number };
  urineCulture: { average: number; target: number; compliance: number };
  respiratory: { average: number; target: number; compliance: number };
  molecular: { average: number; target: number; compliance: number };
}

export interface TestVolumeMetric {
  testType: TestType;
  thisMonth: number;
  lastMonth: number;
  positivityRate: number;
}

export interface ResistanceTrend {
  organism: string;
  antibiotic: string;
  currentResistance: number;
  previousResistance: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  alert: boolean;
}

// ============================================================================
// Microbiology Service Class
// ============================================================================

export class MicrobiologyService {
  private db: D1Database;
  private organizationId: string;

  constructor(db: D1Database, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
  }

  // ==========================================================================
  // Order Management
  // ==========================================================================

  async createOrder(data: Partial<MicrobiologyOrder>): Promise<MicrobiologyOrder> {
    const order: MicrobiologyOrder = {
      id: this.generateId(),
      organizationId: this.organizationId,
      orderNumber: await this.generateOrderNumber(),
      status: 'ordered',
      priority: data.priority || 'routine',
      patientId: data.patientId || '',
      patientName: data.patientName || '',
      mrn: data.mrn || '',
      dateOfBirth: data.dateOfBirth || '',
      location: data.location || '',
      bedNumber: data.bedNumber,
      orderingPhysician: data.orderingPhysician || '',
      orderingDepartment: data.orderingDepartment || '',
      orderedAt: new Date().toISOString(),
      clinicalIndication: data.clinicalIndication || '',
      relevantHistory: data.relevantHistory,
      currentAntibiotics: data.currentAntibiotics || [],
      specimen: data.specimen || {
        id: this.generateId(),
        specimenType: 'other',
        specimenSource: '',
        collectionDate: new Date().toISOString(),
        collectionTime: new Date().toTimeString().slice(0, 5),
        quality: 'acceptable',
        gramStainPerformed: false,
        anaerobeCollection: false
      },
      testsOrdered: data.testsOrdered || [],
      cultures: [],
      molecularTests: [],
      serology: [],
      criticalValue: false,
      criticalValueReported: false,
      tatTarget: this.getTATTarget(data.specimen?.specimenType || 'other', data.priority || 'routine'),
      infectionControlNotified: false,
      mdroDetected: false,
      isolationRequired: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await MicrobiologyOrderDB.create(this.db, order);
    return order;
  }

  async getOrder(id: string): Promise<MicrobiologyOrder | null> {
    return MicrobiologyOrderDB.getById(this.db, id);
  }

  async updateOrder(id: string, updates: Partial<MicrobiologyOrder>): Promise<MicrobiologyOrder> {
    const order = await this.getOrder(id);
    if (!order) throw new Error('Order not found');

    const updated: MicrobiologyOrder = {
      ...order,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await MicrobiologyOrderDB.update(this.db, id, updated);
    return updated;
  }

  async listOrders(filters: {
    status?: OrderStatus;
    priority?: OrderPriority;
    specimenType?: SpecimenType;
    patientId?: string;
    location?: string;
    fromDate?: string;
    toDate?: string;
    criticalOnly?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ orders: MicrobiologyOrder[]; total: number }> {
    return MicrobiologyOrderDB.list(this.db, this.organizationId, filters);
  }

  private getTATTarget(specimenType: SpecimenType, priority: OrderPriority): number {
    // TAT in hours
    const baseTarget = specimenType === 'blood' ? 72 :
                       specimenType === 'csf' ? 48 :
                       specimenType === 'urine' ? 48 :
                       72;

    return priority === 'stat' ? baseTarget / 2 :
           priority === 'urgent' ? baseTarget * 0.75 :
           baseTarget;
  }

  // ==========================================================================
  // Specimen Processing
  // ==========================================================================

  async receiveSpecimen(orderId: string, data: {
    receivedBy: string;
    quality: MicrobiologySpecimen['quality'];
    rejectionReason?: string;
    appearance?: string;
    volume?: number;
  }): Promise<MicrobiologyOrder> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    order.specimen.receivedAt = new Date().toISOString();
    order.specimen.receivedBy = data.receivedBy;
    order.specimen.quality = data.quality;
    order.specimen.rejectionReason = data.rejectionReason;
    order.specimen.appearance = data.appearance;
    order.specimen.volume = data.volume;

    if (data.quality === 'rejected') {
      return this.updateOrder(orderId, {
        specimen: order.specimen,
        status: 'cancelled'
      });
    }

    return this.updateOrder(orderId, {
      specimen: order.specimen,
      status: 'received'
    });
  }

  async performGramStain(orderId: string, result: Omit<GramStainResult, 'id'>): Promise<MicrobiologyOrder> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    order.specimen.gramStainPerformed = true;
    order.specimen.gramStainResult = {
      id: this.generateId(),
      ...result
    };

    // Check for critical findings in Gram stain
    if (order.specimen.specimenType === 'csf' && result.organisms.length > 0) {
      order.criticalValue = true;
    }

    return this.updateOrder(orderId, { specimen: order.specimen, criticalValue: order.criticalValue });
  }

  // ==========================================================================
  // Culture Management
  // ==========================================================================

  async setupCulture(orderId: string, data: {
    cultureType: CultureType;
    mediaUsed: CultureMedia[];
    incubationConditions: IncubationConditions;
    setupBy: string;
  }): Promise<Culture> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    const culture: Culture = {
      id: this.generateId(),
      orderId,
      cultureType: data.cultureType,
      status: 'setup',
      setupDate: new Date().toISOString(),
      setupBy: data.setupBy,
      mediaUsed: data.mediaUsed,
      incubationConditions: data.incubationConditions,
      readings: [],
      isolates: [],
      result: 'no_growth'
    };

    await this.updateOrder(orderId, {
      cultures: [...order.cultures, culture],
      status: 'in_process'
    });

    return culture;
  }

  async recordCultureReading(orderId: string, cultureId: string, reading: Omit<CultureReading, 'id'>): Promise<Culture> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    const cultureIndex = order.cultures.findIndex(c => c.id === cultureId);
    if (cultureIndex === -1) throw new Error('Culture not found');

    const newReading: CultureReading = {
      id: this.generateId(),
      ...reading
    };

    order.cultures[cultureIndex].readings.push(newReading);

    // Update culture status based on reading
    if (reading.growth !== 'no_growth') {
      order.cultures[cultureIndex].status = 'reading';
      if (!order.cultures[cultureIndex].positiveAt) {
        order.cultures[cultureIndex].positiveAt = new Date().toISOString();

        // Check for critical (positive blood culture)
        if (order.specimen.specimenType === 'blood') {
          order.criticalValue = true;
          await this.createCriticalAlert(order, 'Blood culture positive');
        }
      }
    }

    if (!reading.continueIncubation && reading.growth === 'no_growth') {
      order.cultures[cultureIndex].status = 'no_growth';
      order.cultures[cultureIndex].noGrowthFinalAt = new Date().toISOString();
      order.cultures[cultureIndex].result = 'no_growth';
    }

    await this.updateOrder(orderId, { cultures: order.cultures, criticalValue: order.criticalValue });
    return order.cultures[cultureIndex];
  }

  async addIsolate(orderId: string, cultureId: string, data: Partial<Isolate>): Promise<Isolate> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    const cultureIndex = order.cultures.findIndex(c => c.id === cultureId);
    if (cultureIndex === -1) throw new Error('Culture not found');

    const isolateNumber = order.cultures[cultureIndex].isolates.length + 1;

    const isolate: Isolate = {
      id: this.generateId(),
      cultureId,
      isolateNumber,
      status: 'growing',
      quantity: data.quantity || 'moderate',
      significantGrowth: data.significantGrowth ?? true,
      clinicalSignificance: data.clinicalSignificance || 'probable_pathogen',
      identificationMethod: data.identificationMethod || 'automated',
      susceptibilityTests: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    order.cultures[cultureIndex].isolates.push(isolate);
    order.cultures[cultureIndex].status = 'identification';
    order.cultures[cultureIndex].result = 'pathogen_isolated';

    await this.updateOrder(orderId, { cultures: order.cultures });
    return isolate;
  }

  async identifyOrganism(orderId: string, cultureId: string, isolateId: string, data: {
    genus: string;
    species: string;
    fullName: string;
    identificationMethod: IdentificationMethod;
    identificationConfidence?: number;
    gramStain?: 'positive' | 'negative';
    morphology?: OrganismMorphology;
    identifiedBy: string;
  }): Promise<Isolate> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    const cultureIndex = order.cultures.findIndex(c => c.id === cultureId);
    if (cultureIndex === -1) throw new Error('Culture not found');

    const isolateIndex = order.cultures[cultureIndex].isolates.findIndex(i => i.id === isolateId);
    if (isolateIndex === -1) throw new Error('Isolate not found');

    const isolate = order.cultures[cultureIndex].isolates[isolateIndex];
    isolate.genus = data.genus;
    isolate.species = data.species;
    isolate.fullName = data.fullName;
    isolate.identificationMethod = data.identificationMethod;
    isolate.identificationConfidence = data.identificationConfidence;
    isolate.gramStain = data.gramStain;
    isolate.morphology = data.morphology;
    isolate.status = 'susceptibility_testing';
    isolate.updatedAt = new Date().toISOString();

    // Check for unusual or critical pathogens
    const criticalPathogens = ['Neisseria meningitidis', 'Listeria monocytogenes', 'Salmonella typhi'];
    if (criticalPathogens.some(p => data.fullName.includes(p))) {
      order.criticalValue = true;
      await this.createCriticalAlert(order, `Critical pathogen identified: ${data.fullName}`);
    }

    await this.updateOrder(orderId, { cultures: order.cultures, criticalValue: order.criticalValue });
    return isolate;
  }

  // ==========================================================================
  // Susceptibility Testing
  // ==========================================================================

  async performSusceptibilityTest(orderId: string, cultureId: string, isolateId: string, data: {
    testMethod: SusceptibilityMethod;
    panelName?: string;
    testedBy: string;
    antibiotics: Omit<AntibioticResult, 'id'>[];
    qcPerformed: boolean;
    qcPassed?: boolean;
    qcOrganism?: string;
  }): Promise<SusceptibilityTest> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    const cultureIndex = order.cultures.findIndex(c => c.id === cultureId);
    if (cultureIndex === -1) throw new Error('Culture not found');

    const isolateIndex = order.cultures[cultureIndex].isolates.findIndex(i => i.id === isolateId);
    if (isolateIndex === -1) throw new Error('Isolate not found');

    const test: SusceptibilityTest = {
      id: this.generateId(),
      isolateId,
      testMethod: data.testMethod,
      testDate: new Date().toISOString(),
      testedBy: data.testedBy,
      panelName: data.panelName,
      antibiotics: data.antibiotics.map(a => ({ id: this.generateId(), ...a })),
      qcPerformed: data.qcPerformed,
      qcPassed: data.qcPassed,
      qcOrganism: data.qcOrganism,
      status: 'pending_review'
    };

    order.cultures[cultureIndex].isolates[isolateIndex].susceptibilityTests.push(test);

    // Analyze resistance profile
    const resistanceProfile = this.analyzeResistanceProfile(
      order.cultures[cultureIndex].isolates[isolateIndex].fullName || '',
      test.antibiotics
    );
    order.cultures[cultureIndex].isolates[isolateIndex].resistanceProfile = resistanceProfile;

    // Check for MDRO
    if (resistanceProfile.mrsa || resistanceProfile.vre || resistanceProfile.esbl ||
        resistanceProfile.carbapenemase || resistanceProfile.mdr) {
      order.mdroDetected = true;
      const mdroType = this.determineMDROType(resistanceProfile, order.cultures[cultureIndex].isolates[isolateIndex].fullName || '');
      order.cultures[cultureIndex].isolates[isolateIndex].mdroClassification = mdroType;

      // Create infection control alert
      await this.createMDROAlert(order, order.cultures[cultureIndex].isolates[isolateIndex], mdroType);
    }

    order.cultures[cultureIndex].isolates[isolateIndex].status = 'complete';
    order.cultures[cultureIndex].status = 'susceptibility';

    await this.updateOrder(orderId, { cultures: order.cultures, mdroDetected: order.mdroDetected });
    return test;
  }

  private analyzeResistanceProfile(organismName: string, antibiotics: AntibioticResult[]): ResistanceProfile {
    const profile: ResistanceProfile = {
      esbl: false,
      carbapenemase: false,
      cpe: false,
      mrsa: false,
      vre: false,
      mdr: false,
      xdr: false,
      pdr: false
    };

    // Count resistances by class
    const resistanceByClass = new Map<AntibioticClass, number>();
    const testedByClass = new Map<AntibioticClass, number>();

    for (const abx of antibiotics) {
      testedByClass.set(abx.antibioticClass, (testedByClass.get(abx.antibioticClass) || 0) + 1);
      if (abx.result === 'R') {
        resistanceByClass.set(abx.antibioticClass, (resistanceByClass.get(abx.antibioticClass) || 0) + 1);
      }
    }

    // MRSA detection
    if (organismName.toLowerCase().includes('staphylococcus aureus')) {
      const oxacillin = antibiotics.find(a =>
        a.antibiotic.toLowerCase().includes('oxacillin') ||
        a.antibiotic.toLowerCase().includes('cefoxitin')
      );
      if (oxacillin?.result === 'R') {
        profile.mrsa = true;
      }
    }

    // VRE detection
    if (organismName.toLowerCase().includes('enterococcus')) {
      const vancomycin = antibiotics.find(a => a.antibiotic.toLowerCase().includes('vancomycin'));
      if (vancomycin?.result === 'R') {
        profile.vre = true;
      }
    }

    // ESBL detection (simplified)
    const cephalosporins = antibiotics.filter(a => a.antibioticClass === 'cephalosporins');
    const ceph3Resistant = cephalosporins.filter(a =>
      (a.antibiotic.toLowerCase().includes('ceftriaxone') ||
       a.antibiotic.toLowerCase().includes('ceftazidime') ||
       a.antibiotic.toLowerCase().includes('cefotaxime')) && a.result === 'R'
    );
    if (ceph3Resistant.length > 0) {
      profile.esbl = true;
    }

    // Carbapenemase detection
    const carbapenems = antibiotics.filter(a => a.antibioticClass === 'carbapenems');
    const carbapenemResistant = carbapenems.filter(a => a.result === 'R');
    if (carbapenemResistant.length > 0) {
      profile.carbapenemase = true;
      if (organismName.toLowerCase().includes('enterobacter') ||
          organismName.toLowerCase().includes('klebsiella') ||
          organismName.toLowerCase().includes('escherichia')) {
        profile.cpe = true;
      }
    }

    // MDR (resistant to ≥3 classes)
    const resistantClasses = Array.from(resistanceByClass.entries())
      .filter(([, count]) => count > 0)
      .length;
    if (resistantClasses >= 3) {
      profile.mdr = true;
    }

    // XDR (resistant to all but 1-2 classes)
    const totalClasses = testedByClass.size;
    if (totalClasses - resistantClasses <= 2 && totalClasses >= 5) {
      profile.xdr = true;
    }

    // PDR (resistant to all classes)
    if (resistantClasses === totalClasses && totalClasses >= 5) {
      profile.pdr = true;
    }

    return profile;
  }

  private determineMDROType(profile: ResistanceProfile, organismName: string): MDROType {
    if (profile.mrsa) return 'mrsa';
    if (profile.vre) return 'vre';
    if (profile.cpe) return 'cre';
    if (organismName.toLowerCase().includes('pseudomonas') && profile.carbapenemase) return 'crpa';
    if (organismName.toLowerCase().includes('acinetobacter') && profile.carbapenemase) return 'crab';
    if (profile.esbl) return 'esbl';
    return 'other';
  }

  async verifySusceptibility(orderId: string, cultureId: string, isolateId: string, testId: string, verifiedBy: string): Promise<SusceptibilityTest> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    const cultureIndex = order.cultures.findIndex(c => c.id === cultureId);
    if (cultureIndex === -1) throw new Error('Culture not found');

    const isolateIndex = order.cultures[cultureIndex].isolates.findIndex(i => i.id === isolateId);
    if (isolateIndex === -1) throw new Error('Isolate not found');

    const testIndex = order.cultures[cultureIndex].isolates[isolateIndex].susceptibilityTests.findIndex(t => t.id === testId);
    if (testIndex === -1) throw new Error('Test not found');

    order.cultures[cultureIndex].isolates[isolateIndex].susceptibilityTests[testIndex].status = 'verified';
    order.cultures[cultureIndex].isolates[isolateIndex].susceptibilityTests[testIndex].verifiedBy = verifiedBy;
    order.cultures[cultureIndex].isolates[isolateIndex].susceptibilityTests[testIndex].verifiedAt = new Date().toISOString();

    await this.updateOrder(orderId, { cultures: order.cultures });
    return order.cultures[cultureIndex].isolates[isolateIndex].susceptibilityTests[testIndex];
  }

  // ==========================================================================
  // Molecular Diagnostics
  // ==========================================================================

  async orderMolecularTest(orderId: string, data: {
    testName: string;
    testType: MolecularTestType;
    targetPathogen?: string;
    method: MolecularDiagnostic['method'];
    platform?: string;
  }): Promise<MolecularDiagnostic> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    const test: MolecularDiagnostic = {
      id: this.generateId(),
      orderId,
      testName: data.testName,
      testType: data.testType,
      targetPathogen: data.targetPathogen,
      method: data.method,
      platform: data.platform,
      status: 'ordered',
      internalControlValid: true,
      inhibitionDetected: false,
      createdAt: new Date().toISOString()
    };

    await this.updateOrder(orderId, {
      molecularTests: [...order.molecularTests, test]
    });

    return test;
  }

  async recordMolecularResult(orderId: string, testId: string, data: {
    result: MolecularDiagnostic['result'];
    quantitativeResult?: number;
    quantitativeUnit?: string;
    ctValue?: number;
    internalControlValid: boolean;
    inhibitionDetected: boolean;
    interpretation?: string;
    performedBy: string;
  }): Promise<MolecularDiagnostic> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    const testIndex = order.molecularTests.findIndex(t => t.id === testId);
    if (testIndex === -1) throw new Error('Test not found');

    order.molecularTests[testIndex] = {
      ...order.molecularTests[testIndex],
      result: data.result,
      quantitativeResult: data.quantitativeResult,
      quantitativeUnit: data.quantitativeUnit,
      ctValue: data.ctValue,
      internalControlValid: data.internalControlValid,
      inhibitionDetected: data.inhibitionDetected,
      interpretation: data.interpretation,
      performedAt: new Date().toISOString(),
      performedBy: data.performedBy,
      status: 'completed'
    };

    // Check for critical molecular results
    const criticalMolecular = ['meningitis_panel', 'tb'];
    if (criticalMolecular.includes(order.molecularTests[testIndex].testType) && data.result === 'detected') {
      order.criticalValue = true;
    }

    await this.updateOrder(orderId, { molecularTests: order.molecularTests, criticalValue: order.criticalValue });
    return order.molecularTests[testIndex];
  }

  // ==========================================================================
  // Results & Reporting
  // ==========================================================================

  async createPreliminaryResult(orderId: string, data: {
    resultSummary: string;
    interpretation?: string;
    reportedBy: string;
  }): Promise<MicrobiologyResult> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    // Build organism summaries
    const organisms: OrganismSummary[] = [];
    for (const culture of order.cultures) {
      for (const isolate of culture.isolates) {
        organisms.push({
          organismName: isolate.fullName || 'Organism identification pending',
          quantity: isolate.quantity,
          significance: isolate.clinicalSignificance,
          susceptibilityAvailable: isolate.susceptibilityTests.length > 0,
          susceptibilitySummary: this.buildSusceptibilitySummary(isolate.susceptibilityTests),
          mdro: !!isolate.mdroClassification,
          mdroType: isolate.mdroClassification
        });
      }
    }

    const result: MicrobiologyResult = {
      id: this.generateId(),
      orderId,
      resultType: 'preliminary',
      resultSummary: data.resultSummary,
      organisms,
      interpretation: data.interpretation,
      criticalValue: order.criticalValue,
      reportedAt: new Date().toISOString(),
      reportedBy: data.reportedBy
    };

    await this.updateOrder(orderId, {
      primaryResult: result,
      status: 'preliminary',
      preliminaryReportAt: result.reportedAt
    });

    return result;
  }

  async finalizeCulture(orderId: string, cultureId: string, data: {
    interpretation?: string;
    finalizedBy: string;
  }): Promise<Culture> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    const cultureIndex = order.cultures.findIndex(c => c.id === cultureId);
    if (cultureIndex === -1) throw new Error('Culture not found');

    order.cultures[cultureIndex].status = 'finalized';
    order.cultures[cultureIndex].finalizedAt = new Date().toISOString();
    order.cultures[cultureIndex].finalizedBy = data.finalizedBy;
    order.cultures[cultureIndex].interpretation = data.interpretation;

    await this.updateOrder(orderId, { cultures: order.cultures });
    return order.cultures[cultureIndex];
  }

  async createFinalResult(orderId: string, data: {
    resultSummary: string;
    interpretation?: string;
    clinicalComment?: string;
    therapeuticRecommendation?: string;
    reportedBy: string;
    verifiedBy: string;
  }): Promise<MicrobiologyResult> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    // Build organism summaries
    const organisms: OrganismSummary[] = [];
    for (const culture of order.cultures) {
      for (const isolate of culture.isolates) {
        organisms.push({
          organismName: isolate.fullName || 'No growth',
          quantity: isolate.quantity,
          significance: isolate.clinicalSignificance,
          susceptibilityAvailable: isolate.susceptibilityTests.length > 0,
          susceptibilitySummary: this.buildSusceptibilitySummary(isolate.susceptibilityTests),
          mdro: !!isolate.mdroClassification,
          mdroType: isolate.mdroClassification
        });
      }
    }

    const result: MicrobiologyResult = {
      id: this.generateId(),
      orderId,
      resultType: 'final',
      resultSummary: data.resultSummary,
      organisms,
      interpretation: data.interpretation,
      clinicalComment: data.clinicalComment,
      therapeuticRecommendation: data.therapeuticRecommendation,
      criticalValue: order.criticalValue,
      reportedAt: new Date().toISOString(),
      reportedBy: data.reportedBy,
      verifiedBy: data.verifiedBy
    };

    // Calculate TAT
    const receivedAt = order.specimen.receivedAt || order.createdAt;
    const tatHours = Math.round((Date.now() - new Date(receivedAt).getTime()) / (1000 * 60 * 60));

    await this.updateOrder(orderId, {
      primaryResult: result,
      status: 'final',
      finalReportAt: result.reportedAt,
      reportedBy: data.reportedBy,
      verifiedBy: data.verifiedBy,
      tatHours
    });

    return result;
  }

  private buildSusceptibilitySummary(tests: SusceptibilityTest[]): string {
    if (tests.length === 0) return 'Pending';

    const lastTest = tests[tests.length - 1];
    const susceptible = lastTest.antibiotics.filter(a => a.result === 'S' && a.reportable);
    const resistant = lastTest.antibiotics.filter(a => a.result === 'R' && a.reportable);

    if (susceptible.length === 0 && resistant.length === 0) return 'See full report';

    const parts: string[] = [];
    if (susceptible.length > 0) {
      parts.push(`S: ${susceptible.slice(0, 3).map(a => a.antibiotic).join(', ')}${susceptible.length > 3 ? '...' : ''}`);
    }
    if (resistant.length > 0) {
      parts.push(`R: ${resistant.map(a => a.antibiotic).join(', ')}`);
    }

    return parts.join('; ');
  }

  async reportCriticalValue(orderId: string, data: {
    reportedTo: string;
    reportedBy: string;
    method: 'phone' | 'page' | 'secure_message';
  }): Promise<MicrobiologyOrder> {
    const order = await this.getOrder(orderId);
    if (!order) throw new Error('Order not found');

    return this.updateOrder(orderId, {
      criticalValueReported: true,
      criticalValueReportedAt: new Date().toISOString(),
      criticalValueReportedTo: data.reportedTo
    });
  }

  // ==========================================================================
  // Infection Control
  // ==========================================================================

  private async createCriticalAlert(order: MicrobiologyOrder, description: string): Promise<InfectionControlAlert> {
    const alert: InfectionControlAlert = {
      id: this.generateId(),
      organizationId: this.organizationId,
      alertType: 'critical_result',
      severity: 'high',
      orderId: order.id,
      patientId: order.patientId,
      patientName: order.patientName,
      location: order.location,
      description,
      recommendations: ['Notify physician immediately', 'Consider empiric therapy'],
      isolationRequired: false,
      contactTracingRequired: false,
      environmentalCleaningRequired: false,
      status: 'new',
      followUpActions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await InfectionControlAlertDB.create(this.db, alert);
    return alert;
  }

  private async createMDROAlert(order: MicrobiologyOrder, isolate: Isolate, mdroType: MDROType): Promise<InfectionControlAlert> {
    const isolationTypes: Record<MDROType, string> = {
      'mrsa': 'Contact',
      'vre': 'Contact',
      'esbl': 'Contact',
      'cre': 'Contact Plus',
      'crpa': 'Contact',
      'crab': 'Contact',
      'c_diff': 'Contact',
      'other': 'Contact'
    };

    const alert: InfectionControlAlert = {
      id: this.generateId(),
      organizationId: this.organizationId,
      alertType: 'mdro_detection',
      severity: mdroType === 'cre' || mdroType === 'crab' ? 'critical' : 'high',
      orderId: order.id,
      patientId: order.patientId,
      patientName: order.patientName,
      location: order.location,
      organism: isolate.fullName,
      mdroType,
      description: `${mdroType.toUpperCase()} detected: ${isolate.fullName}`,
      recommendations: [
        `Implement ${isolationTypes[mdroType]} precautions`,
        'Notify infection control',
        'Review antibiotic therapy',
        'Consider contact tracing'
      ],
      isolationRequired: true,
      isolationType: isolationTypes[mdroType],
      contactTracingRequired: mdroType === 'cre',
      environmentalCleaningRequired: true,
      status: 'new',
      followUpActions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update order
    await this.updateOrder(order.id, {
      infectionControlNotified: true,
      isolationRequired: true,
      isolationType: isolationTypes[mdroType]
    });

    await InfectionControlAlertDB.create(this.db, alert);
    return alert;
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<InfectionControlAlert> {
    const alert = await InfectionControlAlertDB.getById(this.db, alertId);
    if (!alert) throw new Error('Alert not found');

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();
    alert.updatedAt = new Date().toISOString();

    await InfectionControlAlertDB.update(this.db, alertId, alert);
    return alert;
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<InfectionControlAlert> {
    const alert = await InfectionControlAlertDB.getById(this.db, alertId);
    if (!alert) throw new Error('Alert not found');

    alert.status = 'resolved';
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = new Date().toISOString();
    alert.updatedAt = new Date().toISOString();

    await InfectionControlAlertDB.update(this.db, alertId, alert);
    return alert;
  }

  async listAlerts(filters: {
    status?: InfectionControlAlert['status'];
    alertType?: AlertType;
    location?: string;
    fromDate?: string;
    limit?: number;
  }): Promise<{ alerts: InfectionControlAlert[]; total: number }> {
    return InfectionControlAlertDB.list(this.db, this.organizationId, filters);
  }

  // ==========================================================================
  // Antibiogram
  // ==========================================================================

  async generateAntibiogram(data: {
    name: string;
    startDate: string;
    endDate: string;
    location?: string;
    patientType?: Antibiogram['patientType'];
    specimenTypes: SpecimenType[];
    generatedBy: string;
  }): Promise<Antibiogram> {
    // In a real implementation, this would aggregate data from all cultures
    const antibiogram: Antibiogram = {
      id: this.generateId(),
      organizationId: this.organizationId,
      name: data.name,
      reportingPeriod: {
        startDate: data.startDate,
        endDate: data.endDate
      },
      location: data.location,
      patientType: data.patientType,
      specimenTypes: data.specimenTypes,
      organisms: [], // Would be populated from aggregated data
      totalIsolates: 0,
      generatedAt: new Date().toISOString(),
      generatedBy: data.generatedBy,
      methodology: 'CLSI M39 Guidelines',
      status: 'draft'
    };

    await AntibiogramDB.create(this.db, antibiogram);
    return antibiogram;
  }

  async getAntibiogram(id: string): Promise<Antibiogram | null> {
    return AntibiogramDB.getById(this.db, id);
  }

  async approveAntibiogram(id: string, approvedBy: string): Promise<Antibiogram> {
    const antibiogram = await this.getAntibiogram(id);
    if (!antibiogram) throw new Error('Antibiogram not found');

    antibiogram.status = 'approved';
    antibiogram.approvedBy = approvedBy;
    antibiogram.approvedAt = new Date().toISOString();

    await AntibiogramDB.update(this.db, id, antibiogram);
    return antibiogram;
  }

  // ==========================================================================
  // Dashboard
  // ==========================================================================

  async getDashboard(): Promise<MicrobiologyDashboard> {
    const today = new Date().toISOString().split('T')[0];

    const [orders, alerts] = await Promise.all([
      this.listOrders({ fromDate: today, limit: 1000 }),
      this.listAlerts({ status: 'new', limit: 50 })
    ]);

    const allOrders = orders.orders;

    // Summary
    const summary: MicrobiologySummary = {
      ordersToday: allOrders.length,
      pendingCultures: allOrders.filter(o => o.status === 'in_process').length,
      positiveBloodCultures: allOrders.filter(o =>
        o.specimen.specimenType === 'blood' &&
        o.cultures.some(c => c.result === 'pathogen_isolated')
      ).length,
      criticalResults: allOrders.filter(o => o.criticalValue && !o.criticalValueReported).length,
      mdroIsolates: allOrders.filter(o => o.mdroDetected).length,
      averageTAT: 0 // Would calculate from completed orders
    };

    // Pending orders
    const pendingOrders = allOrders.filter(o =>
      ['ordered', 'collected', 'received', 'in_process'].includes(o.status)
    );

    // Positive blood cultures
    const positiveBloodCultures = allOrders.filter(o =>
      o.specimen.specimenType === 'blood' &&
      o.cultures.some(c => c.result === 'pathogen_isolated')
    );

    // Critical results not yet reported
    const criticalResults = allOrders.filter(o => o.criticalValue && !o.criticalValueReported);

    // TAT metrics
    const tatMetrics: TATMetrics = {
      bloodCulture: { average: 48, target: 72, compliance: 85 },
      urineCulture: { average: 24, target: 48, compliance: 90 },
      respiratory: { average: 36, target: 72, compliance: 88 },
      molecular: { average: 4, target: 8, compliance: 95 }
    };

    // Volume metrics
    const volumeByTestType: TestVolumeMetric[] = [
      { testType: 'culture_aerobic', thisMonth: 150, lastMonth: 140, positivityRate: 25 },
      { testType: 'culture_blood', thisMonth: 80, lastMonth: 75, positivityRate: 10 },
      { testType: 'culture_aerobic', thisMonth: 200, lastMonth: 190, positivityRate: 30 }, // Urine cultures
      { testType: 'pcr', thisMonth: 100, lastMonth: 85, positivityRate: 15 }
    ];

    // Resistance trends
    const resistanceTrends: ResistanceTrend[] = [
      { organism: 'E. coli', antibiotic: 'Ciprofloxacin', currentResistance: 35, previousResistance: 30, trend: 'increasing', alert: true },
      { organism: 'S. aureus', antibiotic: 'Oxacillin', currentResistance: 25, previousResistance: 28, trend: 'decreasing', alert: false },
      { organism: 'K. pneumoniae', antibiotic: 'Carbapenems', currentResistance: 8, previousResistance: 5, trend: 'increasing', alert: true }
    ];

    return {
      summary,
      pendingOrders: pendingOrders.slice(0, 20),
      positiveBloodCultures: positiveBloodCultures.slice(0, 10),
      criticalResults: criticalResults.slice(0, 10),
      mdroAlerts: alerts.alerts.filter(a => a.alertType === 'mdro_detection'),
      tatMetrics,
      volumeByTestType,
      resistanceTrends
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private generateId(): string {
    return `micro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await MicrobiologyOrderDB.countByDate(this.db, this.organizationId, date);
    return `MCR-${dateStr}-${String(count + 1).padStart(4, '0')}`;
  }
}

// ============================================================================
// Database Layer (Stubs for D1 Implementation)
// ============================================================================

class MicrobiologyOrderDB {
  static async create(db: D1Database, order: MicrobiologyOrder): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<MicrobiologyOrder | null> { return null; }
  static async update(db: D1Database, id: string, order: MicrobiologyOrder): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ orders: MicrobiologyOrder[]; total: number }> {
    return { orders: [], total: 0 };
  }
  static async countByDate(db: D1Database, orgId: string, date: Date): Promise<number> { return 0; }
}

class InfectionControlAlertDB {
  static async create(db: D1Database, alert: InfectionControlAlert): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<InfectionControlAlert | null> { return null; }
  static async update(db: D1Database, id: string, alert: InfectionControlAlert): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ alerts: InfectionControlAlert[]; total: number }> {
    return { alerts: [], total: 0 };
  }
}

class AntibiogramDB {
  static async create(db: D1Database, antibiogram: Antibiogram): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<Antibiogram | null> { return null; }
  static async update(db: D1Database, id: string, antibiogram: Antibiogram): Promise<void> {}
}

export default MicrobiologyService;
