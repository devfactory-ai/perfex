/**
 * Pathology Service - Anatomie et Cytologie Pathologiques
 *
 * Comprehensive pathology/histopathology management including:
 * - Specimen accessioning and tracking
 * - Grossing and tissue processing
 * - Histology and immunohistochemistry
 * - Cytology (Pap smears, FNA, body fluids)
 * - Molecular pathology
 * - Synoptic reporting (CAP protocols)
 * - Tumor boards integration
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface PathologyCase {
  id: string;
  organizationId: string;
  accessionNumber: string;
  caseType: CaseType;
  priority: CasePriority;
  status: CaseStatus;

  // Patient Information
  patientId: string;
  patientName: string;
  mrn: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';

  // Clinical Information
  clinicalHistory: string;
  clinicalDiagnosis?: string;
  relevantTests?: string;
  radiologyFindings?: string;
  previousPathology?: string[];

  // Ordering
  orderingPhysician: string;
  orderingPhysicianNpi?: string;
  orderingDepartment: string;
  orderDate: string;

  // Specimen Collection
  collectionDate: string;
  collectionTime?: string;
  collectionSite: string;
  collectionMethod: CollectionMethod;
  collectedBy?: string;

  // Specimens
  specimens: Specimen[];
  specimenCount: number;

  // Processing
  receivedAt?: string;
  receivedBy?: string;
  grossingCompletedAt?: string;
  grossingBy?: string;
  processingCompletedAt?: string;
  embeddingCompletedAt?: string;
  sectioningCompletedAt?: string;
  stainingCompletedAt?: string;

  // Slides
  slides: Slide[];
  totalSlides: number;

  // Additional Testing
  additionalTests: AdditionalTest[];
  immunohistochemistry: IHCPanel[];
  molecularTests: MolecularTest[];
  specialStains: SpecialStain[];

  // Diagnosis
  diagnosis?: PathologyDiagnosis;
  signedOutAt?: string;
  signedOutBy?: string;

  // Quality
  qualityIndicators: QualityIndicator[];
  amendments: Amendment[];
  addenda: Addendum[];

  // Billing
  cptCodes: string[];
  icdCodes: string[];

  // Turnaround
  tatDays?: number;
  tatTarget: number;
  tatExceeded: boolean;

  // Consultation
  consultations: PathologyConsultation[];

  // Tumor Board
  tumorBoardCase: boolean;
  tumorBoardDate?: string;

  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export type CaseType =
  | 'surgical_pathology'     // Chirurgical
  | 'cytology'               // Cytologie
  | 'autopsy'                // Autopsie
  | 'frozen_section'         // Extemporané
  | 'consultation'           // Consultation
  | 'molecular';             // Moléculaire

export type CasePriority =
  | 'routine'        // Routine (5 jours)
  | 'urgent'         // Urgent (48h)
  | 'stat'           // Stat (24h)
  | 'frozen';        // Extemporané (<30min)

export type CaseStatus =
  | 'ordered'
  | 'collected'
  | 'received'
  | 'accessioned'
  | 'grossing'
  | 'processing'
  | 'embedding'
  | 'sectioning'
  | 'staining'
  | 'pending_review'
  | 'in_review'
  | 'additional_testing'
  | 'pending_signout'
  | 'signed_out'
  | 'amended'
  | 'archived';

export type CollectionMethod =
  | 'excision'
  | 'biopsy'
  | 'fna'                   // Fine Needle Aspiration
  | 'core_biopsy'
  | 'curettage'
  | 'brushing'
  | 'washing'
  | 'aspiration'
  | 'resection'
  | 'amputation';

// Specimen
export interface Specimen {
  id: string;
  specimenNumber: string;
  site: string;
  laterality?: 'left' | 'right' | 'bilateral' | 'midline';
  procedure: string;
  clinicalInfo?: string;

  // Physical
  specimenType: SpecimenType;
  containerType: string;
  fixative: string;
  fixationTime?: number; // hours
  receivedState: 'fresh' | 'fixed' | 'frozen';

  // Grossing
  grossDescription?: string;
  measurements?: SpecimenMeasurement;
  weight?: number; // grams
  grossPhotos?: string[];
  grossedBy?: string;
  grossedAt?: string;

  // Blocks
  blocks: TissueBlock[];
  blockCount: number;

  // Margin Status (for resections)
  margins?: MarginStatus[];
  marginStatus?: 'negative' | 'positive' | 'close';

  // Lymph Nodes
  lymphNodesExamined?: number;
  lymphNodesPositive?: number;

  // Status
  status: 'received' | 'grossing' | 'processed' | 'complete' | 'insufficient';
  insufficiencyReason?: string;
}

export type SpecimenType =
  | 'tissue'
  | 'fluid'
  | 'smear'
  | 'cell_block'
  | 'bone_marrow'
  | 'frozen_tissue';

export interface SpecimenMeasurement {
  length?: number;
  width?: number;
  depth?: number;
  unit: 'mm' | 'cm';
}

export interface MarginStatus {
  marginSite: string;
  status: 'negative' | 'positive' | 'close';
  distance?: number; // mm to tumor
  inked: boolean;
  inkColor?: string;
}

export interface TissueBlock {
  id: string;
  blockId: string;
  description: string;
  tissueSite: string;
  embeddingMedium: 'paraffin' | 'oct' | 'resin';
  processedAt?: string;
  slides: string[]; // slide IDs
  exhausted: boolean;
  archived: boolean;
  archiveLocation?: string;
}

// Slides
export interface Slide {
  id: string;
  slideId: string;
  blockId: string;
  specimenId: string;
  stainType: StainType;
  stainProtocol?: string;
  level?: number;

  // Status
  status: 'pending' | 'cut' | 'stained' | 'coverslipped' | 'scanned' | 'reviewed';
  quality: 'good' | 'acceptable' | 'poor' | 'recut_needed';
  qualityIssues?: string[];

  // Digitization
  scanned: boolean;
  scannedAt?: string;
  digitalSlideUrl?: string;
  magnification?: string;

  // Tracking
  location: 'lab' | 'pathologist' | 'archive' | 'external';
  checkedOutTo?: string;
  checkedOutAt?: string;

  createdAt: string;
}

export type StainType =
  | 'he'              // H&E
  | 'pap'             // Papanicolaou
  | 'giemsa'
  | 'gram'
  | 'ziehl_neelsen'   // AFB
  | 'pas'             // Periodic Acid-Schiff
  | 'trichrome'
  | 'reticulin'
  | 'iron'
  | 'congo_red'       // Amyloid
  | 'ihc'             // Immunohistochemistry
  | 'fish'            // Fluorescence In Situ Hybridization
  | 'special';

// Additional Tests
export interface AdditionalTest {
  id: string;
  testName: string;
  testCode: string;
  category: 'ihc' | 'special_stain' | 'molecular' | 'fish' | 'flow_cytometry' | 'em';
  orderedAt: string;
  orderedBy: string;
  status: 'ordered' | 'in_progress' | 'completed' | 'cancelled';
  result?: string;
  interpretation?: string;
  completedAt?: string;
  performedBy?: string;
}

export interface IHCPanel {
  id: string;
  panelName?: string;
  markers: IHCMarker[];
  orderedAt: string;
  orderedBy: string;
  completedAt?: string;
  interpretation?: string;
  conclusion?: string;
}

export interface IHCMarker {
  id: string;
  marker: string;
  antibodyClone?: string;
  result: IHCResult;
  intensity?: 'negative' | 'weak' | 'moderate' | 'strong';
  percentage?: number;
  pattern?: string;
  distribution?: string;
  notes?: string;
  photo?: string;
}

export type IHCResult =
  | 'positive'
  | 'negative'
  | 'equivocal'
  | 'focal_positive'
  | 'not_interpretable'
  | 'pending';

export interface MolecularTest {
  id: string;
  testName: string;
  testType: MolecularTestType;
  gene?: string;
  mutation?: string;
  method: string;

  // Results
  status: 'ordered' | 'in_progress' | 'completed' | 'failed';
  result?: 'positive' | 'negative' | 'variant_detected' | 'no_variant' | 'indeterminate';
  variantDetails?: GeneticVariant[];

  // Quality
  sampleQuality?: string;
  tumorContent?: number;
  coverage?: number;

  interpretation?: string;
  clinicalSignificance?: string;
  reportUrl?: string;

  orderedAt: string;
  completedAt?: string;
  performedBy?: string;
  verifiedBy?: string;
}

export type MolecularTestType =
  | 'pcr'
  | 'sequencing'
  | 'ngs'             // Next-Gen Sequencing
  | 'fish'
  | 'cish'
  | 'methylation'
  | 'msi'             // Microsatellite Instability
  | 'tmb';            // Tumor Mutational Burden

export interface GeneticVariant {
  gene: string;
  variant: string;
  variantType: 'mutation' | 'amplification' | 'deletion' | 'fusion' | 'rearrangement';
  classification: 'pathogenic' | 'likely_pathogenic' | 'vus' | 'likely_benign' | 'benign';
  alleleFrequency?: number;
  therapeuticImplications?: string[];
  clinicalTrials?: string[];
}

export interface SpecialStain {
  id: string;
  stainName: string;
  targetEntity: string;
  slideId: string;
  result: 'positive' | 'negative' | 'equivocal';
  pattern?: string;
  interpretation?: string;
  photo?: string;
  completedAt?: string;
  performedBy?: string;
}

// Diagnosis
export interface PathologyDiagnosis {
  id: string;
  caseId: string;

  // Main Diagnosis
  diagnosisText: string;
  snomedCodes: SNOMEDCode[];
  icdCodes: string[];

  // Tumor Details (if applicable)
  tumorType?: string;
  histologicType?: string;
  grade?: TumorGrade;
  differentiationGrade?: string;

  // Staging (if applicable)
  tnmStaging?: TNMStaging;
  ajccStage?: string;
  figoStage?: string;

  // Margins and Resection Status
  resectionStatus?: 'r0' | 'r1' | 'r2';
  marginStatus?: string;

  // Lymphovascular Invasion
  lymphovascularInvasion?: boolean;
  perineuralInvasion?: boolean;

  // Biomarkers
  biomarkers: Biomarker[];

  // Synoptic Report
  synopticReport?: SynopticReport;

  // Comment
  comment?: string;

  // Recommendations
  recommendations?: string[];

  createdAt: string;
  createdBy: string;
}

export interface SNOMEDCode {
  code: string;
  term: string;
  category: 'topography' | 'morphology' | 'procedure' | 'finding';
}

export interface TumorGrade {
  gradeSystem: string;
  grade: string;
  score?: number;
  components?: Record<string, number>;
}

export interface TNMStaging {
  t: string;
  tSubstage?: string;
  n: string;
  nSubstage?: string;
  m: string;
  mSubstage?: string;
  prefix?: 'p' | 'c' | 'y' | 'r' | 'a';
  suffix?: string;
  edition: string;
}

export interface Biomarker {
  name: string;
  result: string;
  interpretation?: string;
  method?: string;
  clinicalSignificance?: string;
}

export interface SynopticReport {
  id: string;
  protocol: string; // e.g., "CAP Breast Invasive Carcinoma"
  protocolVersion: string;
  elements: SynopticElement[];
  completedAt: string;
  completedBy: string;
}

export interface SynopticElement {
  elementId: string;
  elementName: string;
  category: string;
  value: string;
  valueCode?: string;
  notes?: string;
}

// Quality
export interface QualityIndicator {
  id: string;
  indicatorType: QualityIndicatorType;
  description: string;
  flaggedAt: string;
  flaggedBy: string;
  resolved: boolean;
  resolvedAt?: string;
  resolution?: string;
}

export type QualityIndicatorType =
  | 'specimen_quality'
  | 'fixation_issue'
  | 'processing_error'
  | 'slide_quality'
  | 'ihc_failure'
  | 'discrepancy'
  | 'amended_diagnosis';

export interface Amendment {
  id: string;
  amendmentNumber: number;
  amendmentDate: string;
  amendedBy: string;
  reason: string;
  originalDiagnosis: string;
  amendedDiagnosis: string;
  significantChange: boolean;
  notificationSent: boolean;
  notifiedTo?: string[];
}

export interface Addendum {
  id: string;
  addendumNumber: number;
  addendumDate: string;
  addedBy: string;
  content: string;
  relatedTest?: string;
}

export interface PathologyConsultation {
  id: string;
  consultationType: 'internal' | 'external';
  consultantName: string;
  consultantInstitution?: string;
  requestDate: string;
  requestedBy: string;
  reason: string;
  materialsent: string[];
  opinion?: string;
  receivedDate?: string;
  status: 'pending' | 'received' | 'incorporated';
}

// Cytology Specific
export interface CytologyCase extends PathologyCase {
  cytologyType: CytologyType;
  specimenAdequacy: 'satisfactory' | 'unsatisfactory' | 'limited';
  adequacyReason?: string;

  // Pap Specific
  bethesdaCategory?: BethesdaCategory;
  hpvResult?: HPVResult;

  // FNA Specific
  diagnosisCategory?: FNADiagnosisCategory;
  rapidOnSiteEvaluation?: boolean;
  passes?: number;

  // Fluid Specific
  cellCount?: number;
  differentialCount?: CellDifferential;
}

export type CytologyType =
  | 'pap_smear'
  | 'fna'
  | 'body_fluid'
  | 'urine'
  | 'sputum'
  | 'brushing'
  | 'washing';

export type BethesdaCategory =
  | 'nilm'            // Negative for intraepithelial lesion
  | 'asc_us'          // Atypical squamous cells of undetermined significance
  | 'asc_h'           // Atypical squamous cells, cannot exclude HSIL
  | 'lsil'            // Low-grade squamous intraepithelial lesion
  | 'hsil'            // High-grade squamous intraepithelial lesion
  | 'agc'             // Atypical glandular cells
  | 'ais'             // Adenocarcinoma in situ
  | 'carcinoma';      // Carcinoma

export interface HPVResult {
  tested: boolean;
  result?: 'positive' | 'negative';
  genotyping?: string[];
  highRiskPositive?: boolean;
  type16Positive?: boolean;
  type18Positive?: boolean;
}

export type FNADiagnosisCategory =
  | 'non_diagnostic'
  | 'benign'
  | 'atypia_fus'      // Atypia of undetermined significance
  | 'follicular_neoplasm'
  | 'suspicious'
  | 'malignant';

export interface CellDifferential {
  mesothelialCells?: number;
  lymphocytes?: number;
  neutrophils?: number;
  macrophages?: number;
  eosinophils?: number;
  redBloodCells?: number;
  atypicalCells?: number;
  malignantCells?: number;
}

// Frozen Section
export interface FrozenSectionCase extends PathologyCase {
  frozenSectionType: 'margin' | 'diagnosis' | 'lymph_node';
  surgeryRoom: string;
  surgeonName: string;
  callReceived: string;
  specimenReceived: string;
  resultCalled: string;
  turnaroundMinutes: number;
  frozenDiagnosis: string;
  finalDiagnosis?: string;
  concordance?: 'concordant' | 'discordant' | 'deferred';
  discordanceReason?: string;
}

// Dashboard
export interface PathologyDashboard {
  summary: PathologySummary;
  worklistByStatus: WorklistItem[];
  urgentCases: PathologyCase[];
  pendingSignout: PathologyCase[];
  overdueCases: PathologyCase[];
  recentSignouts: PathologyCase[];
  tatMetrics: TATMetrics;
  volumeByType: VolumeMetric[];
  qualityMetrics: PathologyQualityMetrics;
}

export interface PathologySummary {
  totalCases: number;
  casesInProgress: number;
  pendingSignout: number;
  signedOutToday: number;
  overdue: number;
  frozenSections: number;
  consultations: number;
}

export interface WorklistItem {
  status: CaseStatus;
  count: number;
  oldestDays: number;
}

export interface TATMetrics {
  averageTAT: number;
  targetMet: number;
  byPriority: {
    priority: CasePriority;
    averageTAT: number;
    target: number;
    compliance: number;
  }[];
}

export interface VolumeMetric {
  type: CaseType;
  thisMonth: number;
  lastMonth: number;
  trend: 'up' | 'down' | 'stable';
}

export interface PathologyQualityMetrics {
  amendmentRate: number;
  frozenSectionConcordance: number;
  specimenRejectionRate: number;
  ihcFailureRate: number;
  consultationRate: number;
}

// ============================================================================
// Pathology Service Class
// ============================================================================

export class PathologyService {
  private db: D1Database;
  private organizationId: string;

  constructor(db: D1Database, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
  }

  // ==========================================================================
  // Case Management
  // ==========================================================================

  async createCase(data: Partial<PathologyCase>): Promise<PathologyCase> {
    const caseData: PathologyCase = {
      id: this.generateId(),
      organizationId: this.organizationId,
      accessionNumber: await this.generateAccessionNumber(data.caseType || 'surgical_pathology'),
      caseType: data.caseType || 'surgical_pathology',
      priority: data.priority || 'routine',
      status: 'ordered',
      patientId: data.patientId || '',
      patientName: data.patientName || '',
      mrn: data.mrn || '',
      dateOfBirth: data.dateOfBirth || '',
      gender: data.gender || 'other',
      clinicalHistory: data.clinicalHistory || '',
      clinicalDiagnosis: data.clinicalDiagnosis,
      relevantTests: data.relevantTests,
      radiologyFindings: data.radiologyFindings,
      previousPathology: data.previousPathology || [],
      orderingPhysician: data.orderingPhysician || '',
      orderingPhysicianNpi: data.orderingPhysicianNpi,
      orderingDepartment: data.orderingDepartment || '',
      orderDate: data.orderDate || new Date().toISOString(),
      collectionDate: data.collectionDate || new Date().toISOString(),
      collectionTime: data.collectionTime,
      collectionSite: data.collectionSite || '',
      collectionMethod: data.collectionMethod || 'biopsy',
      collectedBy: data.collectedBy,
      specimens: data.specimens || [],
      specimenCount: data.specimens?.length || 0,
      slides: [],
      totalSlides: 0,
      additionalTests: [],
      immunohistochemistry: [],
      molecularTests: [],
      specialStains: [],
      qualityIndicators: [],
      amendments: [],
      addenda: [],
      cptCodes: [],
      icdCodes: [],
      tatTarget: this.getTATTarget(data.priority || 'routine'),
      tatExceeded: false,
      consultations: [],
      tumorBoardCase: data.tumorBoardCase || false,
      tumorBoardDate: data.tumorBoardDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await PathologyCaseDB.create(this.db, caseData);
    return caseData;
  }

  async getCase(id: string): Promise<PathologyCase | null> {
    return PathologyCaseDB.getById(this.db, id);
  }

  async getCaseByAccession(accessionNumber: string): Promise<PathologyCase | null> {
    return PathologyCaseDB.getByAccession(this.db, this.organizationId, accessionNumber);
  }

  async updateCase(id: string, updates: Partial<PathologyCase>): Promise<PathologyCase> {
    const caseData = await this.getCase(id);
    if (!caseData) throw new Error('Case not found');

    const updated: PathologyCase = {
      ...caseData,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await PathologyCaseDB.update(this.db, id, updated);
    return updated;
  }

  async listCases(filters: {
    status?: CaseStatus;
    caseType?: CaseType;
    priority?: CasePriority;
    pathologist?: string;
    fromDate?: string;
    toDate?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ cases: PathologyCase[]; total: number }> {
    return PathologyCaseDB.list(this.db, this.organizationId, filters);
  }

  private getTATTarget(priority: CasePriority): number {
    switch (priority) {
      case 'frozen': return 0; // Same day
      case 'stat': return 1;
      case 'urgent': return 2;
      case 'routine': return 5;
      default: return 5;
    }
  }

  // ==========================================================================
  // Specimen Processing
  // ==========================================================================

  async receiveSpecimen(caseId: string, data: {
    receivedBy: string;
    specimens: Partial<Specimen>[];
  }): Promise<PathologyCase> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const specimens: Specimen[] = data.specimens.map((s, index) => ({
      id: this.generateId(),
      specimenNumber: `${caseData.accessionNumber}-${String.fromCharCode(65 + index)}`, // A, B, C...
      site: s.site || '',
      laterality: s.laterality,
      procedure: s.procedure || '',
      clinicalInfo: s.clinicalInfo,
      specimenType: s.specimenType || 'tissue',
      containerType: s.containerType || 'standard',
      fixative: s.fixative || '10% formalin',
      fixationTime: s.fixationTime,
      receivedState: s.receivedState || 'fixed',
      blocks: [],
      blockCount: 0,
      status: 'received'
    }));

    return this.updateCase(caseId, {
      specimens,
      specimenCount: specimens.length,
      status: 'received',
      receivedAt: new Date().toISOString(),
      receivedBy: data.receivedBy
    });
  }

  async performGrossing(caseId: string, specimenId: string, data: {
    grossedBy: string;
    grossDescription: string;
    measurements?: SpecimenMeasurement;
    weight?: number;
    blocks: Partial<TissueBlock>[];
    margins?: MarginStatus[];
    lymphNodesExamined?: number;
    grossPhotos?: string[];
  }): Promise<PathologyCase> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const specimenIndex = caseData.specimens.findIndex(s => s.id === specimenId);
    if (specimenIndex === -1) throw new Error('Specimen not found');

    const specimen = caseData.specimens[specimenIndex];

    // Create blocks
    const blocks: TissueBlock[] = data.blocks.map((b, index) => ({
      id: this.generateId(),
      blockId: `${specimen.specimenNumber}-${index + 1}`,
      description: b.description || '',
      tissueSite: b.tissueSite || specimen.site,
      embeddingMedium: b.embeddingMedium || 'paraffin',
      slides: [],
      exhausted: false,
      archived: false
    }));

    specimen.grossDescription = data.grossDescription;
    specimen.measurements = data.measurements;
    specimen.weight = data.weight;
    specimen.grossPhotos = data.grossPhotos;
    specimen.grossedBy = data.grossedBy;
    specimen.grossedAt = new Date().toISOString();
    specimen.blocks = blocks;
    specimen.blockCount = blocks.length;
    specimen.margins = data.margins;
    specimen.lymphNodesExamined = data.lymphNodesExamined;
    specimen.status = 'grossing';

    caseData.specimens[specimenIndex] = specimen;

    return this.updateCase(caseId, {
      specimens: caseData.specimens,
      status: 'grossing',
      grossingCompletedAt: new Date().toISOString(),
      grossingBy: data.grossedBy
    });
  }

  async completeProcessing(caseId: string): Promise<PathologyCase> {
    return this.updateCase(caseId, {
      status: 'processing',
      processingCompletedAt: new Date().toISOString()
    });
  }

  async completeEmbedding(caseId: string): Promise<PathologyCase> {
    return this.updateCase(caseId, {
      status: 'embedding',
      embeddingCompletedAt: new Date().toISOString()
    });
  }

  async completeSectioning(caseId: string): Promise<PathologyCase> {
    return this.updateCase(caseId, {
      status: 'sectioning',
      sectioningCompletedAt: new Date().toISOString()
    });
  }

  // ==========================================================================
  // Slides Management
  // ==========================================================================

  async createSlides(caseId: string, blockId: string, slides: Partial<Slide>[]): Promise<PathologyCase> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    // Find the block
    let foundBlock = false;
    let specimenId = '';
    for (const specimen of caseData.specimens) {
      const block = specimen.blocks.find(b => b.id === blockId);
      if (block) {
        foundBlock = true;
        specimenId = specimen.id;
        break;
      }
    }
    if (!foundBlock) throw new Error('Block not found');

    const newSlides: Slide[] = slides.map((s, index) => ({
      id: this.generateId(),
      slideId: `${blockId}-${index + 1}`,
      blockId,
      specimenId,
      stainType: s.stainType || 'he',
      stainProtocol: s.stainProtocol,
      level: s.level || 1,
      status: 'pending',
      quality: 'good',
      scanned: false,
      location: 'lab',
      createdAt: new Date().toISOString()
    }));

    // Update block's slide references
    for (const specimen of caseData.specimens) {
      const blockIndex = specimen.blocks.findIndex(b => b.id === blockId);
      if (blockIndex !== -1) {
        specimen.blocks[blockIndex].slides.push(...newSlides.map(s => s.id));
      }
    }

    return this.updateCase(caseId, {
      specimens: caseData.specimens,
      slides: [...caseData.slides, ...newSlides],
      totalSlides: caseData.totalSlides + newSlides.length
    });
  }

  async updateSlideStatus(caseId: string, slideId: string, status: Slide['status'], quality?: Slide['quality']): Promise<PathologyCase> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const slideIndex = caseData.slides.findIndex(s => s.id === slideId);
    if (slideIndex === -1) throw new Error('Slide not found');

    caseData.slides[slideIndex].status = status;
    if (quality) caseData.slides[slideIndex].quality = quality;

    // Check if staining is complete
    const allStained = caseData.slides.every(s => s.status === 'stained' || s.status === 'coverslipped' || s.status === 'scanned');
    const newStatus = allStained ? 'pending_review' : caseData.status;

    return this.updateCase(caseId, {
      slides: caseData.slides,
      status: newStatus,
      stainingCompletedAt: allStained ? new Date().toISOString() : undefined
    });
  }

  async scanSlide(caseId: string, slideId: string, digitalSlideUrl: string): Promise<PathologyCase> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const slideIndex = caseData.slides.findIndex(s => s.id === slideId);
    if (slideIndex === -1) throw new Error('Slide not found');

    caseData.slides[slideIndex].scanned = true;
    caseData.slides[slideIndex].scannedAt = new Date().toISOString();
    caseData.slides[slideIndex].digitalSlideUrl = digitalSlideUrl;
    caseData.slides[slideIndex].status = 'scanned';

    return this.updateCase(caseId, { slides: caseData.slides });
  }

  // ==========================================================================
  // Additional Testing
  // ==========================================================================

  async orderIHC(caseId: string, data: {
    panelName?: string;
    markers: string[];
    orderedBy: string;
    blockId?: string;
  }): Promise<IHCPanel> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const panel: IHCPanel = {
      id: this.generateId(),
      panelName: data.panelName,
      markers: data.markers.map(m => ({
        id: this.generateId(),
        marker: m,
        result: 'pending'
      })),
      orderedAt: new Date().toISOString(),
      orderedBy: data.orderedBy
    };

    await this.updateCase(caseId, {
      immunohistochemistry: [...caseData.immunohistochemistry, panel],
      status: 'additional_testing'
    });

    return panel;
  }

  async recordIHCResults(caseId: string, panelId: string, results: Partial<IHCMarker>[]): Promise<PathologyCase> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const panelIndex = caseData.immunohistochemistry.findIndex(p => p.id === panelId);
    if (panelIndex === -1) throw new Error('Panel not found');

    for (const result of results) {
      const markerIndex = caseData.immunohistochemistry[panelIndex].markers.findIndex(
        m => m.marker === result.marker
      );
      if (markerIndex !== -1) {
        caseData.immunohistochemistry[panelIndex].markers[markerIndex] = {
          ...caseData.immunohistochemistry[panelIndex].markers[markerIndex],
          ...result
        };
      }
    }

    caseData.immunohistochemistry[panelIndex].completedAt = new Date().toISOString();

    return this.updateCase(caseId, {
      immunohistochemistry: caseData.immunohistochemistry
    });
  }

  async orderMolecularTest(caseId: string, data: {
    testName: string;
    testType: MolecularTestType;
    gene?: string;
    method: string;
    orderedBy: string;
  }): Promise<MolecularTest> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const test: MolecularTest = {
      id: this.generateId(),
      testName: data.testName,
      testType: data.testType,
      gene: data.gene,
      method: data.method,
      status: 'ordered',
      orderedAt: new Date().toISOString()
    };

    await this.updateCase(caseId, {
      molecularTests: [...caseData.molecularTests, test],
      status: 'additional_testing'
    });

    return test;
  }

  async recordMolecularResults(caseId: string, testId: string, data: {
    result: MolecularTest['result'];
    variantDetails?: GeneticVariant[];
    sampleQuality?: string;
    tumorContent?: number;
    coverage?: number;
    interpretation?: string;
    clinicalSignificance?: string;
    performedBy: string;
    verifiedBy?: string;
  }): Promise<PathologyCase> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const testIndex = caseData.molecularTests.findIndex(t => t.id === testId);
    if (testIndex === -1) throw new Error('Test not found');

    caseData.molecularTests[testIndex] = {
      ...caseData.molecularTests[testIndex],
      status: 'completed',
      result: data.result,
      variantDetails: data.variantDetails,
      sampleQuality: data.sampleQuality,
      tumorContent: data.tumorContent,
      coverage: data.coverage,
      interpretation: data.interpretation,
      clinicalSignificance: data.clinicalSignificance,
      completedAt: new Date().toISOString(),
      performedBy: data.performedBy,
      verifiedBy: data.verifiedBy
    };

    return this.updateCase(caseId, { molecularTests: caseData.molecularTests });
  }

  async orderSpecialStain(caseId: string, data: {
    stainName: string;
    targetEntity: string;
    slideId: string;
    orderedBy: string;
  }): Promise<SpecialStain> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const stain: SpecialStain = {
      id: this.generateId(),
      stainName: data.stainName,
      targetEntity: data.targetEntity,
      slideId: data.slideId,
      result: 'equivocal'
    };

    await this.updateCase(caseId, {
      specialStains: [...caseData.specialStains, stain],
      status: 'additional_testing'
    });

    return stain;
  }

  // ==========================================================================
  // Diagnosis & Sign-out
  // ==========================================================================

  async createDiagnosis(caseId: string, data: {
    diagnosisText: string;
    snomedCodes?: SNOMEDCode[];
    icdCodes?: string[];
    tumorType?: string;
    histologicType?: string;
    grade?: TumorGrade;
    tnmStaging?: TNMStaging;
    lymphovascularInvasion?: boolean;
    perineuralInvasion?: boolean;
    biomarkers?: Biomarker[];
    comment?: string;
    recommendations?: string[];
    createdBy: string;
  }): Promise<PathologyDiagnosis> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const diagnosis: PathologyDiagnosis = {
      id: this.generateId(),
      caseId,
      diagnosisText: data.diagnosisText,
      snomedCodes: data.snomedCodes || [],
      icdCodes: data.icdCodes || [],
      tumorType: data.tumorType,
      histologicType: data.histologicType,
      grade: data.grade,
      tnmStaging: data.tnmStaging,
      lymphovascularInvasion: data.lymphovascularInvasion,
      perineuralInvasion: data.perineuralInvasion,
      biomarkers: data.biomarkers || [],
      comment: data.comment,
      recommendations: data.recommendations,
      createdAt: new Date().toISOString(),
      createdBy: data.createdBy
    };

    await this.updateCase(caseId, {
      diagnosis,
      icdCodes: data.icdCodes || [],
      status: 'pending_signout'
    });

    return diagnosis;
  }

  async createSynopticReport(caseId: string, data: {
    protocol: string;
    protocolVersion: string;
    elements: SynopticElement[];
    completedBy: string;
  }): Promise<SynopticReport> {
    const caseData = await this.getCase(caseId);
    if (!caseData || !caseData.diagnosis) throw new Error('Case or diagnosis not found');

    const report: SynopticReport = {
      id: this.generateId(),
      protocol: data.protocol,
      protocolVersion: data.protocolVersion,
      elements: data.elements,
      completedAt: new Date().toISOString(),
      completedBy: data.completedBy
    };

    caseData.diagnosis.synopticReport = report;

    await this.updateCase(caseId, { diagnosis: caseData.diagnosis });
    return report;
  }

  async signOutCase(caseId: string, signedOutBy: string): Promise<PathologyCase> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');
    if (!caseData.diagnosis) throw new Error('Diagnosis required before sign-out');

    const now = new Date();
    const receivedAt = new Date(caseData.receivedAt || caseData.createdAt);
    const tatDays = Math.ceil((now.getTime() - receivedAt.getTime()) / (1000 * 60 * 60 * 24));

    return this.updateCase(caseId, {
      status: 'signed_out',
      signedOutAt: now.toISOString(),
      signedOutBy,
      tatDays,
      tatExceeded: tatDays > caseData.tatTarget
    });
  }

  async amendCase(caseId: string, data: {
    reason: string;
    amendedDiagnosis: string;
    amendedBy: string;
    notifyPhysician: boolean;
  }): Promise<Amendment> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');
    if (!caseData.diagnosis) throw new Error('No diagnosis to amend');

    const amendment: Amendment = {
      id: this.generateId(),
      amendmentNumber: caseData.amendments.length + 1,
      amendmentDate: new Date().toISOString(),
      amendedBy: data.amendedBy,
      reason: data.reason,
      originalDiagnosis: caseData.diagnosis.diagnosisText,
      amendedDiagnosis: data.amendedDiagnosis,
      significantChange: true,
      notificationSent: data.notifyPhysician,
      notifiedTo: data.notifyPhysician ? [caseData.orderingPhysician] : undefined
    };

    // Update diagnosis
    caseData.diagnosis.diagnosisText = data.amendedDiagnosis;

    await this.updateCase(caseId, {
      diagnosis: caseData.diagnosis,
      amendments: [...caseData.amendments, amendment],
      status: 'amended'
    });

    // Add quality indicator
    await this.addQualityIndicator(caseId, {
      indicatorType: 'amended_diagnosis',
      description: `Amendment: ${data.reason}`,
      flaggedBy: data.amendedBy
    });

    return amendment;
  }

  async addAddendum(caseId: string, data: {
    content: string;
    relatedTest?: string;
    addedBy: string;
  }): Promise<Addendum> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const addendum: Addendum = {
      id: this.generateId(),
      addendumNumber: caseData.addenda.length + 1,
      addendumDate: new Date().toISOString(),
      addedBy: data.addedBy,
      content: data.content,
      relatedTest: data.relatedTest
    };

    await this.updateCase(caseId, {
      addenda: [...caseData.addenda, addendum]
    });

    return addendum;
  }

  // ==========================================================================
  // Quality Management
  // ==========================================================================

  async addQualityIndicator(caseId: string, data: {
    indicatorType: QualityIndicatorType;
    description: string;
    flaggedBy: string;
  }): Promise<QualityIndicator> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const indicator: QualityIndicator = {
      id: this.generateId(),
      indicatorType: data.indicatorType,
      description: data.description,
      flaggedAt: new Date().toISOString(),
      flaggedBy: data.flaggedBy,
      resolved: false
    };

    await this.updateCase(caseId, {
      qualityIndicators: [...caseData.qualityIndicators, indicator]
    });

    return indicator;
  }

  async resolveQualityIndicator(caseId: string, indicatorId: string, resolution: string): Promise<PathologyCase> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const indicatorIndex = caseData.qualityIndicators.findIndex(q => q.id === indicatorId);
    if (indicatorIndex === -1) throw new Error('Indicator not found');

    caseData.qualityIndicators[indicatorIndex].resolved = true;
    caseData.qualityIndicators[indicatorIndex].resolvedAt = new Date().toISOString();
    caseData.qualityIndicators[indicatorIndex].resolution = resolution;

    return this.updateCase(caseId, { qualityIndicators: caseData.qualityIndicators });
  }

  // ==========================================================================
  // Consultations
  // ==========================================================================

  async requestConsultation(caseId: string, data: {
    consultationType: 'internal' | 'external';
    consultantName: string;
    consultantInstitution?: string;
    reason: string;
    materialSent: string[];
    requestedBy: string;
  }): Promise<PathologyConsultation> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const consultation: PathologyConsultation = {
      id: this.generateId(),
      consultationType: data.consultationType,
      consultantName: data.consultantName,
      consultantInstitution: data.consultantInstitution,
      requestDate: new Date().toISOString(),
      requestedBy: data.requestedBy,
      reason: data.reason,
      materialsent: data.materialSent,
      status: 'pending'
    };

    await this.updateCase(caseId, {
      consultations: [...caseData.consultations, consultation]
    });

    return consultation;
  }

  async receiveConsultationOpinion(caseId: string, consultationId: string, opinion: string): Promise<PathologyCase> {
    const caseData = await this.getCase(caseId);
    if (!caseData) throw new Error('Case not found');

    const consultIndex = caseData.consultations.findIndex(c => c.id === consultationId);
    if (consultIndex === -1) throw new Error('Consultation not found');

    caseData.consultations[consultIndex].opinion = opinion;
    caseData.consultations[consultIndex].receivedDate = new Date().toISOString();
    caseData.consultations[consultIndex].status = 'received';

    return this.updateCase(caseId, { consultations: caseData.consultations });
  }

  // ==========================================================================
  // Frozen Section
  // ==========================================================================

  async createFrozenSection(data: Partial<FrozenSectionCase>): Promise<FrozenSectionCase> {
    const baseCase = await this.createCase({
      ...data,
      caseType: 'frozen_section',
      priority: 'frozen'
    });

    const frozenCase: FrozenSectionCase = {
      ...baseCase,
      frozenSectionType: data.frozenSectionType || 'diagnosis',
      surgeryRoom: data.surgeryRoom || '',
      surgeonName: data.surgeonName || '',
      callReceived: data.callReceived || new Date().toISOString(),
      specimenReceived: '',
      resultCalled: '',
      turnaroundMinutes: 0,
      frozenDiagnosis: ''
    };

    await PathologyCaseDB.update(this.db, frozenCase.id, frozenCase);
    return frozenCase;
  }

  async receiveFrozenSpecimen(caseId: string): Promise<FrozenSectionCase> {
    const caseData = await this.getCase(caseId) as FrozenSectionCase;
    if (!caseData) throw new Error('Case not found');

    return this.updateCase(caseId, {
      specimenReceived: new Date().toISOString(),
      status: 'in_review'
    } as any) as Promise<FrozenSectionCase>;
  }

  async reportFrozenResult(caseId: string, data: {
    diagnosis: string;
    reportedBy: string;
  }): Promise<FrozenSectionCase> {
    const caseData = await this.getCase(caseId) as FrozenSectionCase;
    if (!caseData) throw new Error('Case not found');

    const resultTime = new Date();
    const specimenTime = new Date(caseData.specimenReceived);
    const turnaroundMinutes = Math.round((resultTime.getTime() - specimenTime.getTime()) / 60000);

    return this.updateCase(caseId, {
      resultCalled: resultTime.toISOString(),
      frozenDiagnosis: data.diagnosis,
      turnaroundMinutes,
      signedOutBy: data.reportedBy,
      signedOutAt: resultTime.toISOString(),
      status: 'signed_out'
    } as any) as Promise<FrozenSectionCase>;
  }

  async recordFrozenConcordance(caseId: string, data: {
    finalDiagnosis: string;
    concordance: FrozenSectionCase['concordance'];
    discordanceReason?: string;
  }): Promise<FrozenSectionCase> {
    const caseData = await this.getCase(caseId) as FrozenSectionCase;
    if (!caseData) throw new Error('Case not found');

    const updates: Partial<FrozenSectionCase> = {
      finalDiagnosis: data.finalDiagnosis,
      concordance: data.concordance,
      discordanceReason: data.discordanceReason
    };

    if (data.concordance === 'discordant') {
      await this.addQualityIndicator(caseId, {
        indicatorType: 'discrepancy',
        description: `Frozen section discordance: ${data.discordanceReason}`,
        flaggedBy: 'system'
      });
    }

    return this.updateCase(caseId, updates) as Promise<FrozenSectionCase>;
  }

  // ==========================================================================
  // Dashboard & Analytics
  // ==========================================================================

  async getDashboard(pathologist?: string): Promise<PathologyDashboard> {
    const filters = pathologist ? { pathologist } : {};
    const { cases } = await this.listCases({ ...filters, limit: 1000 });

    // Summary
    const summary: PathologySummary = {
      totalCases: cases.length,
      casesInProgress: cases.filter(c => !['signed_out', 'archived'].includes(c.status)).length,
      pendingSignout: cases.filter(c => c.status === 'pending_signout').length,
      signedOutToday: cases.filter(c =>
        c.signedOutAt && c.signedOutAt.startsWith(new Date().toISOString().split('T')[0])
      ).length,
      overdue: cases.filter(c => c.tatExceeded && c.status !== 'signed_out').length,
      frozenSections: cases.filter(c => c.caseType === 'frozen_section').length,
      consultations: cases.filter(c => c.consultations.length > 0).length
    };

    // Worklist by status
    const statusCounts = new Map<CaseStatus, { count: number; oldestDays: number }>();
    for (const c of cases) {
      if (!statusCounts.has(c.status)) {
        statusCounts.set(c.status, { count: 0, oldestDays: 0 });
      }
      const entry = statusCounts.get(c.status)!;
      entry.count++;
      const days = Math.ceil((Date.now() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (days > entry.oldestDays) entry.oldestDays = days;
    }

    const worklistByStatus: WorklistItem[] = Array.from(statusCounts.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      oldestDays: data.oldestDays
    }));

    // Urgent cases
    const urgentCases = cases.filter(c =>
      (c.priority === 'stat' || c.priority === 'urgent') && c.status !== 'signed_out'
    );

    // Pending signout
    const pendingSignout = cases.filter(c => c.status === 'pending_signout');

    // Overdue
    const overdueCases = cases.filter(c => c.tatExceeded && c.status !== 'signed_out');

    // Recent signouts
    const recentSignouts = cases
      .filter(c => c.status === 'signed_out')
      .sort((a, b) => new Date(b.signedOutAt!).getTime() - new Date(a.signedOutAt!).getTime())
      .slice(0, 10);

    // TAT Metrics
    const signedOut = cases.filter(c => c.signedOutAt && c.tatDays !== undefined);
    const avgTAT = signedOut.length > 0
      ? signedOut.reduce((sum, c) => sum + (c.tatDays || 0), 0) / signedOut.length
      : 0;
    const targetMet = signedOut.filter(c => !c.tatExceeded).length;

    const tatByPriority: TATMetrics['byPriority'] = [
      { priority: 'routine', averageTAT: 0, target: 5, compliance: 0 },
      { priority: 'urgent', averageTAT: 0, target: 2, compliance: 0 },
      { priority: 'stat', averageTAT: 0, target: 1, compliance: 0 }
    ];

    for (const priority of tatByPriority) {
      const priorityCases = signedOut.filter(c => c.priority === priority.priority);
      if (priorityCases.length > 0) {
        priority.averageTAT = priorityCases.reduce((sum, c) => sum + (c.tatDays || 0), 0) / priorityCases.length;
        priority.compliance = (priorityCases.filter(c => !c.tatExceeded).length / priorityCases.length) * 100;
      }
    }

    // Volume by type
    const volumeByType: VolumeMetric[] = [
      { type: 'surgical_pathology', thisMonth: 0, lastMonth: 0, trend: 'stable' },
      { type: 'cytology', thisMonth: 0, lastMonth: 0, trend: 'stable' },
      { type: 'frozen_section', thisMonth: 0, lastMonth: 0, trend: 'stable' }
    ];

    // Quality metrics
    const amendments = cases.filter(c => c.amendments.length > 0);
    const frozenCases = cases.filter(c => c.caseType === 'frozen_section') as FrozenSectionCase[];
    const concordantFrozen = frozenCases.filter(c => c.concordance === 'concordant');

    const qualityMetrics: PathologyQualityMetrics = {
      amendmentRate: signedOut.length > 0 ? (amendments.length / signedOut.length) * 100 : 0,
      frozenSectionConcordance: frozenCases.length > 0 ? (concordantFrozen.length / frozenCases.length) * 100 : 100,
      specimenRejectionRate: 0, // Would need specimen rejection tracking
      ihcFailureRate: 0, // Would need IHC failure tracking
      consultationRate: (cases.filter(c => c.consultations.length > 0).length / cases.length) * 100
    };

    return {
      summary,
      worklistByStatus,
      urgentCases,
      pendingSignout,
      overdueCases,
      recentSignouts,
      tatMetrics: {
        averageTAT: Math.round(avgTAT * 10) / 10,
        targetMet,
        byPriority: tatByPriority
      },
      volumeByType,
      qualityMetrics
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private generateId(): string {
    return `path_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateAccessionNumber(caseType: CaseType): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const prefix = caseType === 'surgical_pathology' ? 'S' :
                   caseType === 'cytology' ? 'C' :
                   caseType === 'frozen_section' ? 'FS' :
                   caseType === 'autopsy' ? 'A' : 'P';

    const count = await PathologyCaseDB.countByTypeAndYear(this.db, this.organizationId, caseType, date.getFullYear());
    return `${prefix}${year}-${String(count + 1).padStart(5, '0')}`;
  }
}

// ============================================================================
// Database Layer (Stubs for D1 Implementation)
// ============================================================================

class PathologyCaseDB {
  static async create(db: D1Database, caseData: PathologyCase): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<PathologyCase | null> { return null; }
  static async getByAccession(db: D1Database, orgId: string, accessionNumber: string): Promise<PathologyCase | null> { return null; }
  static async update(db: D1Database, id: string, caseData: PathologyCase): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ cases: PathologyCase[]; total: number }> {
    return { cases: [], total: 0 };
  }
  static async countByTypeAndYear(db: D1Database, orgId: string, caseType: CaseType, year: number): Promise<number> { return 0; }
}

export default PathologyService;
