/**
 * PACS Integration Service
 * Picture Archiving and Communication System
 * Intégration pour l'imagerie médicale DICOM
 */

// Types
export interface DicomStudy {
  id: string;
  studyInstanceUID: string;
  patientId: string;
  patientName: string;
  patientBirthDate: string;
  patientSex: 'M' | 'F' | 'O';
  accessionNumber: string;
  studyDate: string;
  studyTime: string;
  studyDescription: string;
  referringPhysician: string;
  institutionName: string;
  modality: DicomModality;
  numberOfSeries: number;
  numberOfInstances: number;
  bodyPart?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'verified' | 'archived';
  priority: 'routine' | 'urgent' | 'stat';
  series: DicomSeries[];
  reports: RadiologyReport[];
  storageLocation: 'online' | 'nearline' | 'offline';
  sizeBytes: number;
  createdAt: string;
  verifiedAt?: string;
  archivedAt?: string;
}

export type DicomModality =
  | 'CR'   // Computed Radiography
  | 'CT'   // Computed Tomography
  | 'MR'   // Magnetic Resonance
  | 'US'   // Ultrasound
  | 'XA'   // X-Ray Angiography
  | 'NM'   // Nuclear Medicine
  | 'PT'   // PET
  | 'DX'   // Digital Radiography
  | 'MG'   // Mammography
  | 'RF'   // Radiofluoroscopy
  | 'OT'   // Other
  | 'SC'   // Secondary Capture
  | 'OCT'  // Optical Coherence Tomography
  | 'OP';  // Ophthalmic Photography

export interface DicomSeries {
  id: string;
  seriesInstanceUID: string;
  seriesNumber: number;
  seriesDescription: string;
  modality: DicomModality;
  bodyPart?: string;
  numberOfInstances: number;
  instances: DicomInstance[];
  createdAt: string;
}

export interface DicomInstance {
  id: string;
  sopInstanceUID: string;
  sopClassUID: string;
  instanceNumber: number;
  contentDate?: string;
  contentTime?: string;
  rows?: number;
  columns?: number;
  bitsAllocated?: number;
  windowCenter?: number;
  windowWidth?: number;
  rescaleIntercept?: number;
  rescaleSlope?: number;
  sliceLocation?: number;
  sliceThickness?: number;
  pixelSpacing?: [number, number];
  imageOrientationPatient?: number[];
  imagePositionPatient?: number[];
  photometricInterpretation?: string;
  transferSyntaxUID?: string;
  wadoUrl?: string;
  thumbnailUrl?: string;
  sizeBytes: number;
}

export interface RadiologyReport {
  id: string;
  studyId: string;
  type: 'preliminary' | 'final' | 'addendum' | 'correction';
  status: 'draft' | 'pending_review' | 'verified' | 'amended';
  radiologistId: string;
  radiologistName: string;
  findings: string;
  impression: string;
  recommendations?: string;
  criticalFindings?: CriticalFinding[];
  measurements?: RadiologyMeasurement[];
  comparisons?: string;
  technique?: string;
  clinicalHistory?: string;
  signedAt?: string;
  verifiedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CriticalFinding {
  id: string;
  description: string;
  severity: 'critical' | 'urgent' | 'significant';
  notifiedTo: string;
  notifiedAt: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
}

export interface RadiologyMeasurement {
  id: string;
  type: 'length' | 'area' | 'volume' | 'angle' | 'hu' | 'suv';
  name: string;
  value: number;
  unit: string;
  location?: string;
  seriesNumber?: number;
  instanceNumber?: number;
  annotationData?: Record<string, unknown>;
}

export interface WorklistItem {
  id: string;
  scheduledProcedureStepID: string;
  patientId: string;
  patientName: string;
  patientBirthDate: string;
  patientSex: 'M' | 'F' | 'O';
  accessionNumber: string;
  requestingPhysician: string;
  referringPhysician: string;
  scheduledStationAETitle: string;
  scheduledStartDate: string;
  scheduledStartTime: string;
  modality: DicomModality;
  scheduledProcedureDescription: string;
  requestedProcedureID: string;
  requestedProcedureDescription: string;
  studyInstanceUID?: string;
  status: 'scheduled' | 'arrived' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  specialInstructions?: string;
  contrastRequired?: boolean;
  sedationRequired?: boolean;
  reasonForExam?: string;
  icd10Codes?: string[];
  insuranceInfo?: {
    payerId: string;
    authorizationNumber?: string;
  };
}

export interface PACSNode {
  id: string;
  name: string;
  aeTitle: string;
  host: string;
  port: number;
  type: 'archive' | 'modality' | 'workstation' | 'router';
  status: 'online' | 'offline' | 'maintenance';
  capabilities: ('C-STORE' | 'C-FIND' | 'C-MOVE' | 'C-GET' | 'WADO' | 'STOW' | 'QIDO')[];
  lastPing?: string;
  storageUsed?: number;
  storageTotal?: number;
}

export interface StoragePolicy {
  id: string;
  name: string;
  modalities: DicomModality[];
  retentionYears: number;
  onlineRetentionDays: number;
  compressionType: 'none' | 'lossless' | 'lossy';
  compressionRatio?: number;
  autoArchive: boolean;
  autoDelete: boolean;
  isActive: boolean;
}

export interface QueryOptions {
  patientId?: string;
  patientName?: string;
  studyDate?: string;
  studyDateRange?: { from: string; to: string };
  modality?: DicomModality;
  accessionNumber?: string;
  studyDescription?: string;
  referringPhysician?: string;
  bodyPart?: string;
  status?: DicomStudy['status'];
  limit?: number;
  offset?: number;
}

// Mock PACS data
const pacsStudies: DicomStudy[] = [
  {
    id: 'study-001',
    studyInstanceUID: '1.2.840.113619.2.55.3.2831164804.783.1629876543.987',
    patientId: 'PAT-001',
    patientName: 'Dupont^Marie',
    patientBirthDate: '19650315',
    patientSex: 'F',
    accessionNumber: 'ACC-2024-001234',
    studyDate: '20240115',
    studyTime: '093045',
    studyDescription: 'CT Thorax avec injection',
    referringPhysician: 'Dr. Martin Jean',
    institutionName: 'Centre Hospitalier Paris',
    modality: 'CT',
    numberOfSeries: 3,
    numberOfInstances: 245,
    bodyPart: 'CHEST',
    status: 'completed',
    priority: 'routine',
    series: [
      {
        id: 'series-001',
        seriesInstanceUID: '1.2.840.113619.2.55.3.2831164804.783.1629876543.987.1',
        seriesNumber: 1,
        seriesDescription: 'Topogramme',
        modality: 'CT',
        bodyPart: 'CHEST',
        numberOfInstances: 2,
        instances: [],
        createdAt: '2024-01-15T09:30:45Z'
      },
      {
        id: 'series-002',
        seriesInstanceUID: '1.2.840.113619.2.55.3.2831164804.783.1629876543.987.2',
        seriesNumber: 2,
        seriesDescription: 'CT Thorax axial 2mm',
        modality: 'CT',
        bodyPart: 'CHEST',
        numberOfInstances: 180,
        instances: [],
        createdAt: '2024-01-15T09:35:12Z'
      },
      {
        id: 'series-003',
        seriesInstanceUID: '1.2.840.113619.2.55.3.2831164804.783.1629876543.987.3',
        seriesNumber: 3,
        seriesDescription: 'Reconstructions coronales',
        modality: 'CT',
        bodyPart: 'CHEST',
        numberOfInstances: 63,
        instances: [],
        createdAt: '2024-01-15T09:40:23Z'
      }
    ],
    reports: [
      {
        id: 'report-001',
        studyId: 'study-001',
        type: 'final',
        status: 'verified',
        radiologistId: 'rad-001',
        radiologistName: 'Dr. Sophie Bernard',
        findings: 'Nodule pulmonaire de 8mm au niveau du lobe supérieur droit. Pas d\'adénopathie médiastinale. Structures vasculaires normales.',
        impression: 'Nodule pulmonaire à surveiller. Contrôle recommandé dans 3 mois.',
        recommendations: 'Scanner de contrôle dans 3 mois pour évaluer la stabilité du nodule.',
        technique: 'Acquisition hélicoïdale après injection de produit de contraste iodé.',
        clinicalHistory: 'Toux persistante depuis 2 mois.',
        measurements: [
          {
            id: 'meas-001',
            type: 'length',
            name: 'Nodule pulmonaire',
            value: 8,
            unit: 'mm',
            location: 'Lobe supérieur droit',
            seriesNumber: 2,
            instanceNumber: 87
          }
        ],
        signedAt: '2024-01-15T14:30:00Z',
        verifiedBy: 'Dr. Sophie Bernard',
        createdAt: '2024-01-15T13:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z'
      }
    ],
    storageLocation: 'online',
    sizeBytes: 524288000,
    createdAt: '2024-01-15T09:30:45Z',
    verifiedAt: '2024-01-15T14:30:00Z'
  },
  {
    id: 'study-002',
    studyInstanceUID: '1.2.840.113619.2.55.3.2831164804.783.1629876544.123',
    patientId: 'PAT-002',
    patientName: 'Martin^Pierre',
    patientBirthDate: '19780522',
    patientSex: 'M',
    accessionNumber: 'ACC-2024-001235',
    studyDate: '20240115',
    studyTime: '141530',
    studyDescription: 'IRM Cérébrale',
    referringPhysician: 'Dr. Lefebvre Pierre',
    institutionName: 'Centre Hospitalier Paris',
    modality: 'MR',
    numberOfSeries: 8,
    numberOfInstances: 456,
    bodyPart: 'HEAD',
    status: 'verified',
    priority: 'urgent',
    series: [],
    reports: [],
    storageLocation: 'online',
    sizeBytes: 1073741824,
    createdAt: '2024-01-15T14:15:30Z',
    verifiedAt: '2024-01-15T18:45:00Z'
  }
];

const worklistItems: WorklistItem[] = [
  {
    id: 'wl-001',
    scheduledProcedureStepID: 'SPS-2024-0001',
    patientId: 'PAT-003',
    patientName: 'Moreau^Claire',
    patientBirthDate: '19900812',
    patientSex: 'F',
    accessionNumber: 'ACC-2024-001240',
    requestingPhysician: 'Dr. Martin Jean',
    referringPhysician: 'Dr. Martin Jean',
    scheduledStationAETitle: 'CT_SCANNER_1',
    scheduledStartDate: '20240116',
    scheduledStartTime: '100000',
    modality: 'CT',
    scheduledProcedureDescription: 'CT Abdomino-Pelvien avec injection',
    requestedProcedureID: 'RP-2024-0001',
    requestedProcedureDescription: 'Bilan douleurs abdominales',
    status: 'scheduled',
    priority: 'routine',
    contrastRequired: true,
    sedationRequired: false,
    reasonForExam: 'Douleurs abdominales chroniques',
    icd10Codes: ['R10.9']
  }
];

const pacsNodes: PACSNode[] = [
  {
    id: 'node-001',
    name: 'Archive Principale',
    aeTitle: 'PACS_ARCHIVE',
    host: '192.168.1.100',
    port: 11112,
    type: 'archive',
    status: 'online',
    capabilities: ['C-STORE', 'C-FIND', 'C-MOVE', 'C-GET', 'WADO', 'STOW', 'QIDO'],
    lastPing: new Date().toISOString(),
    storageUsed: 15000000000000,
    storageTotal: 50000000000000
  },
  {
    id: 'node-002',
    name: 'Scanner CT 1',
    aeTitle: 'CT_SCANNER_1',
    host: '192.168.1.110',
    port: 104,
    type: 'modality',
    status: 'online',
    capabilities: ['C-STORE'],
    lastPing: new Date().toISOString()
  },
  {
    id: 'node-003',
    name: 'IRM 1',
    aeTitle: 'MRI_1',
    host: '192.168.1.120',
    port: 104,
    type: 'modality',
    status: 'online',
    capabilities: ['C-STORE'],
    lastPing: new Date().toISOString()
  }
];

const storagePolicies: StoragePolicy[] = [
  {
    id: 'policy-001',
    name: 'Standard CT/MR',
    modalities: ['CT', 'MR'],
    retentionYears: 20,
    onlineRetentionDays: 365,
    compressionType: 'lossless',
    autoArchive: true,
    autoDelete: false,
    isActive: true
  },
  {
    id: 'policy-002',
    name: 'Radiographie Standard',
    modalities: ['CR', 'DX'],
    retentionYears: 10,
    onlineRetentionDays: 180,
    compressionType: 'lossless',
    autoArchive: true,
    autoDelete: false,
    isActive: true
  }
];

export class PACSService {

  // Query studies from PACS
  async queryStudies(options: QueryOptions): Promise<{ studies: DicomStudy[]; total: number }> {
    let results = [...pacsStudies];

    if (options.patientId) {
      results = results.filter(s => s.patientId === options.patientId);
    }

    if (options.patientName) {
      const name = options.patientName.toLowerCase();
      results = results.filter(s => s.patientName.toLowerCase().includes(name));
    }

    if (options.studyDate) {
      results = results.filter(s => s.studyDate === options.studyDate);
    }

    if (options.studyDateRange) {
      results = results.filter(s =>
        s.studyDate >= options.studyDateRange!.from &&
        s.studyDate <= options.studyDateRange!.to
      );
    }

    if (options.modality) {
      results = results.filter(s => s.modality === options.modality);
    }

    if (options.accessionNumber) {
      results = results.filter(s => s.accessionNumber === options.accessionNumber);
    }

    if (options.studyDescription) {
      const desc = options.studyDescription.toLowerCase();
      results = results.filter(s => s.studyDescription.toLowerCase().includes(desc));
    }

    if (options.bodyPart) {
      results = results.filter(s => s.bodyPart === options.bodyPart);
    }

    if (options.status) {
      results = results.filter(s => s.status === options.status);
    }

    // Sort by date descending
    results.sort((a, b) => b.studyDate.localeCompare(a.studyDate));

    const total = results.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;

    return {
      studies: results.slice(offset, offset + limit),
      total
    };
  }

  // Get study by ID or UID
  getStudy(studyId: string): DicomStudy | undefined {
    return pacsStudies.find(s => s.id === studyId || s.studyInstanceUID === studyId);
  }

  // Get patient imaging history
  async getPatientHistory(patientId: string): Promise<{
    studies: DicomStudy[];
    statistics: {
      totalStudies: number;
      byModality: { modality: string; count: number }[];
      byYear: { year: string; count: number }[];
      totalSizeBytes: number;
    };
  }> {
    const studies = pacsStudies.filter(s => s.patientId === patientId);

    const modalityCounts: Record<string, number> = {};
    const yearCounts: Record<string, number> = {};
    let totalSize = 0;

    studies.forEach(s => {
      modalityCounts[s.modality] = (modalityCounts[s.modality] || 0) + 1;
      const year = s.studyDate.substring(0, 4);
      yearCounts[year] = (yearCounts[year] || 0) + 1;
      totalSize += s.sizeBytes;
    });

    return {
      studies: studies.sort((a, b) => b.studyDate.localeCompare(a.studyDate)),
      statistics: {
        totalStudies: studies.length,
        byModality: Object.entries(modalityCounts).map(([modality, count]) => ({ modality, count })),
        byYear: Object.entries(yearCounts).map(([year, count]) => ({ year, count })),
        totalSizeBytes: totalSize
      }
    };
  }

  // Get WADO URL for image viewing
  getWadoUrl(studyUID: string, seriesUID: string, instanceUID: string): string {
    return `/wado?studyUID=${studyUID}&seriesUID=${seriesUID}&objectUID=${instanceUID}&requestType=WADO&contentType=application/dicom`;
  }

  // Get viewer URL
  getViewerUrl(studyId: string): string {
    const study = this.getStudy(studyId);
    if (!study) throw new Error('Study not found');
    return `/viewer/studies/${study.studyInstanceUID}`;
  }

  // Create or update radiology report
  async createReport(studyId: string, data: {
    type: RadiologyReport['type'];
    radiologistId: string;
    radiologistName: string;
    findings: string;
    impression: string;
    recommendations?: string;
    technique?: string;
    clinicalHistory?: string;
    comparisons?: string;
    measurements?: Omit<RadiologyMeasurement, 'id'>[];
    criticalFindings?: Omit<CriticalFinding, 'id'>[];
  }): Promise<RadiologyReport> {
    const study = this.getStudy(studyId);
    if (!study) throw new Error('Study not found');

    const now = new Date().toISOString();
    const report: RadiologyReport = {
      id: `report-${Date.now()}`,
      studyId,
      type: data.type,
      status: 'draft',
      radiologistId: data.radiologistId,
      radiologistName: data.radiologistName,
      findings: data.findings,
      impression: data.impression,
      recommendations: data.recommendations,
      technique: data.technique,
      clinicalHistory: data.clinicalHistory,
      comparisons: data.comparisons,
      measurements: data.measurements?.map((m, i) => ({ ...m, id: `meas-${Date.now()}-${i}` })),
      criticalFindings: data.criticalFindings?.map((cf, i) => ({ ...cf, id: `cf-${Date.now()}-${i}` })),
      createdAt: now,
      updatedAt: now
    };

    study.reports.push(report);

    return report;
  }

  // Sign/verify radiology report
  async signReport(reportId: string, signedBy: string): Promise<RadiologyReport> {
    for (const study of pacsStudies) {
      const report = study.reports.find(r => r.id === reportId);
      if (report) {
        report.status = 'verified';
        report.signedAt = new Date().toISOString();
        report.verifiedBy = signedBy;
        report.updatedAt = new Date().toISOString();

        // Update study status
        study.status = 'verified';
        study.verifiedAt = report.signedAt;

        // Handle critical findings notification
        if (report.criticalFindings && report.criticalFindings.length > 0) {
          await this.notifyCriticalFindings(study, report);
        }

        return report;
      }
    }
    throw new Error('Report not found');
  }

  // Add critical finding
  async addCriticalFinding(reportId: string, data: {
    description: string;
    severity: CriticalFinding['severity'];
    notifiedTo: string;
  }): Promise<CriticalFinding> {
    for (const study of pacsStudies) {
      const report = study.reports.find(r => r.id === reportId);
      if (report) {
        const finding: CriticalFinding = {
          id: `cf-${Date.now()}`,
          description: data.description,
          severity: data.severity,
          notifiedTo: data.notifiedTo,
          notifiedAt: new Date().toISOString()
        };

        if (!report.criticalFindings) {
          report.criticalFindings = [];
        }
        report.criticalFindings.push(finding);

        // Trigger notification
        await this.notifyCriticalFinding(study, finding);

        return finding;
      }
    }
    throw new Error('Report not found');
  }

  // Acknowledge critical finding
  async acknowledgeCriticalFinding(findingId: string, acknowledgedBy: string): Promise<CriticalFinding> {
    for (const study of pacsStudies) {
      for (const report of study.reports) {
        const finding = report.criticalFindings?.find(cf => cf.id === findingId);
        if (finding) {
          finding.acknowledgedBy = acknowledgedBy;
          finding.acknowledgedAt = new Date().toISOString();
          return finding;
        }
      }
    }
    throw new Error('Critical finding not found');
  }

  // Query modality worklist
  async queryWorklist(options: {
    scheduledDate?: string;
    modality?: DicomModality;
    stationAETitle?: string;
    status?: WorklistItem['status'];
    patientId?: string;
  }): Promise<WorklistItem[]> {
    let results = [...worklistItems];

    if (options.scheduledDate) {
      results = results.filter(w => w.scheduledStartDate === options.scheduledDate);
    }

    if (options.modality) {
      results = results.filter(w => w.modality === options.modality);
    }

    if (options.stationAETitle) {
      results = results.filter(w => w.scheduledStationAETitle === options.stationAETitle);
    }

    if (options.status) {
      results = results.filter(w => w.status === options.status);
    }

    if (options.patientId) {
      results = results.filter(w => w.patientId === options.patientId);
    }

    return results.sort((a, b) =>
      (a.scheduledStartDate + a.scheduledStartTime).localeCompare(
        b.scheduledStartDate + b.scheduledStartTime
      )
    );
  }

  // Schedule imaging procedure
  async scheduleExam(data: {
    patientId: string;
    patientName: string;
    patientBirthDate: string;
    patientSex: 'M' | 'F' | 'O';
    requestingPhysician: string;
    referringPhysician: string;
    modality: DicomModality;
    procedureDescription: string;
    scheduledDate: string;
    scheduledTime: string;
    priority: WorklistItem['priority'];
    reasonForExam?: string;
    icd10Codes?: string[];
    contrastRequired?: boolean;
    sedationRequired?: boolean;
    specialInstructions?: string;
  }): Promise<WorklistItem> {
    const now = Date.now();
    const item: WorklistItem = {
      id: `wl-${now}`,
      scheduledProcedureStepID: `SPS-${now}`,
      patientId: data.patientId,
      patientName: data.patientName,
      patientBirthDate: data.patientBirthDate,
      patientSex: data.patientSex,
      accessionNumber: `ACC-${new Date().getFullYear()}-${String(now).slice(-6)}`,
      requestingPhysician: data.requestingPhysician,
      referringPhysician: data.referringPhysician,
      scheduledStationAETitle: this.getStationForModality(data.modality),
      scheduledStartDate: data.scheduledDate,
      scheduledStartTime: data.scheduledTime,
      modality: data.modality,
      scheduledProcedureDescription: data.procedureDescription,
      requestedProcedureID: `RP-${now}`,
      requestedProcedureDescription: data.procedureDescription,
      status: 'scheduled',
      priority: data.priority,
      reasonForExam: data.reasonForExam,
      icd10Codes: data.icd10Codes,
      contrastRequired: data.contrastRequired,
      sedationRequired: data.sedationRequired,
      specialInstructions: data.specialInstructions
    };

    worklistItems.push(item);
    return item;
  }

  // Update worklist item status
  async updateWorklistStatus(
    itemId: string,
    status: WorklistItem['status'],
    studyInstanceUID?: string
  ): Promise<WorklistItem> {
    const item = worklistItems.find(w => w.id === itemId);
    if (!item) throw new Error('Worklist item not found');

    item.status = status;
    if (studyInstanceUID) {
      item.studyInstanceUID = studyInstanceUID;
    }

    return item;
  }

  // Get PACS nodes
  getNodes(): PACSNode[] {
    return pacsNodes;
  }

  // Get node status
  async getNodeStatus(nodeId: string): Promise<PACSNode & { isReachable: boolean }> {
    const node = pacsNodes.find(n => n.id === nodeId);
    if (!node) throw new Error('Node not found');

    // Simulate ping
    const isReachable = node.status === 'online';
    node.lastPing = new Date().toISOString();

    return { ...node, isReachable };
  }

  // Get storage policies
  getStoragePolicies(): StoragePolicy[] {
    return storagePolicies;
  }

  // Get storage statistics
  async getStorageStatistics(): Promise<{
    totalStudies: number;
    totalSeries: number;
    totalInstances: number;
    totalSizeBytes: number;
    byModality: { modality: string; count: number; sizeBytes: number }[];
    byStorageLocation: { location: string; count: number }[];
    storageUsage: { used: number; total: number; percentage: number };
  }> {
    const modalityStats: Record<string, { count: number; sizeBytes: number }> = {};
    const locationStats: Record<string, number> = {};
    let totalInstances = 0;
    let totalSeries = 0;
    let totalSize = 0;

    pacsStudies.forEach(study => {
      modalityStats[study.modality] = modalityStats[study.modality] || { count: 0, sizeBytes: 0 };
      modalityStats[study.modality].count++;
      modalityStats[study.modality].sizeBytes += study.sizeBytes;

      locationStats[study.storageLocation] = (locationStats[study.storageLocation] || 0) + 1;

      totalInstances += study.numberOfInstances;
      totalSeries += study.numberOfSeries;
      totalSize += study.sizeBytes;
    });

    const archive = pacsNodes.find(n => n.type === 'archive');
    const used = archive?.storageUsed || 0;
    const total = archive?.storageTotal || 1;

    return {
      totalStudies: pacsStudies.length,
      totalSeries,
      totalInstances,
      totalSizeBytes: totalSize,
      byModality: Object.entries(modalityStats).map(([modality, stats]) => ({
        modality,
        count: stats.count,
        sizeBytes: stats.sizeBytes
      })),
      byStorageLocation: Object.entries(locationStats).map(([location, count]) => ({
        location,
        count
      })),
      storageUsage: {
        used,
        total,
        percentage: Math.round((used / total) * 100)
      }
    };
  }

  // Archive study to nearline/offline storage
  async archiveStudy(studyId: string, targetLocation: 'nearline' | 'offline'): Promise<DicomStudy> {
    const study = this.getStudy(studyId);
    if (!study) throw new Error('Study not found');

    study.storageLocation = targetLocation;
    study.archivedAt = new Date().toISOString();
    study.status = 'archived';

    return study;
  }

  // Retrieve archived study to online storage
  async retrieveStudy(studyId: string): Promise<{ study: DicomStudy; estimatedTime: number }> {
    const study = this.getStudy(studyId);
    if (!study) throw new Error('Study not found');

    const estimatedTime = study.storageLocation === 'nearline' ? 60 : 300; // seconds

    // Simulate retrieval
    study.storageLocation = 'online';

    return { study, estimatedTime };
  }

  // Send study to external destination
  async sendStudy(studyId: string, destinationAETitle: string): Promise<{
    jobId: string;
    status: 'queued';
    estimatedInstances: number;
  }> {
    const study = this.getStudy(studyId);
    if (!study) throw new Error('Study not found');

    const destination = pacsNodes.find(n => n.aeTitle === destinationAETitle);
    if (!destination) throw new Error('Destination not found');

    return {
      jobId: `job-${Date.now()}`,
      status: 'queued',
      estimatedInstances: study.numberOfInstances
    };
  }

  // Helper methods
  private getStationForModality(modality: DicomModality): string {
    const modalityMap: Record<string, string> = {
      CT: 'CT_SCANNER_1',
      MR: 'MRI_1',
      US: 'US_1',
      CR: 'CR_1',
      DX: 'DX_1'
    };
    return modalityMap[modality] || 'DEFAULT';
  }

  private async notifyCriticalFindings(study: DicomStudy, report: RadiologyReport): Promise<void> {
    if (!report.criticalFindings) return;
    for (const finding of report.criticalFindings) {
      await this.notifyCriticalFinding(study, finding);
    }
  }

  private async notifyCriticalFinding(_study: DicomStudy, finding: CriticalFinding): Promise<void> {
    console.log(`[PACS] Critical finding notification sent to ${finding.notifiedTo}: ${finding.description}`);
  }
}
