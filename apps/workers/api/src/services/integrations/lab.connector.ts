/**
 * Laboratory Connector Service
 * Integrates with external laboratory systems
 *
 * Supports:
 * - HL7 v2.x message parsing
 * - Lab order submission
 * - Result retrieval
 * - Automatic result import
 * - Critical value alerts
 */

import { logger } from '../../utils/logger';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface LabConnectorConfig {
  provider: 'cerba' | 'biomnis' | 'synlab' | 'generic' | 'mock';
  baseUrl?: string;
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  sftpHost?: string;
  sftpUser?: string;
  sftpPassword?: string;
  organizationId: string;
  environment?: 'development' | 'staging' | 'production';
}

export interface LabOrder {
  id: string;
  patientId: string;
  patientExternalId?: string;
  patientName: string;
  patientDateOfBirth: string;
  orderDate: Date;
  priority: 'routine' | 'urgent' | 'stat';
  tests: LabTest[];
  collectingPhysician?: string;
  clinicalInfo?: string;
  fasting?: boolean;
  specimenType?: string;
  status: 'pending' | 'submitted' | 'received' | 'processing' | 'completed' | 'cancelled';
}

export interface LabTest {
  code: string;
  name: string;
  category?: string;
  panel?: string;
}

export interface LabResult {
  id: string;
  orderId?: string;
  patientId: string;
  patientExternalId?: string;
  collectionDate: Date;
  resultDate: Date;
  status: 'preliminary' | 'final' | 'corrected' | 'cancelled';
  tests: LabTestResult[];
  comments?: string;
  performingLab?: string;
  pathologist?: string;
}

export interface LabTestResult {
  code: string;
  name: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  referenceRangeLow?: number;
  referenceRangeHigh?: number;
  flag?: 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high' | 'abnormal';
  method?: string;
  comment?: string;
}

export interface HL7Message {
  type: string;
  version: string;
  messageId: string;
  timestamp: Date;
  segments: HL7Segment[];
  raw?: string;
}

export interface HL7Segment {
  type: string;
  fields: string[];
}

// ============================================================================
// Common Lab Test Codes
// ============================================================================

const LAB_TEST_CODES: Record<string, { name: string; category: string; loincCode: string }> = {
  // Hematology
  'CBC': { name: 'Complete Blood Count', category: 'hematology', loincCode: '58410-2' },
  'HGB': { name: 'Hemoglobin', category: 'hematology', loincCode: '718-7' },
  'HCT': { name: 'Hematocrit', category: 'hematology', loincCode: '4544-3' },
  'WBC': { name: 'White Blood Cells', category: 'hematology', loincCode: '6690-2' },
  'PLT': { name: 'Platelets', category: 'hematology', loincCode: '777-3' },
  'RET': { name: 'Reticulocytes', category: 'hematology', loincCode: '17849-1' },

  // Chemistry
  'BMP': { name: 'Basic Metabolic Panel', category: 'chemistry', loincCode: '51990-0' },
  'CMP': { name: 'Comprehensive Metabolic Panel', category: 'chemistry', loincCode: '24323-8' },
  'NA': { name: 'Sodium', category: 'chemistry', loincCode: '2951-2' },
  'K': { name: 'Potassium', category: 'chemistry', loincCode: '2823-3' },
  'CL': { name: 'Chloride', category: 'chemistry', loincCode: '2075-0' },
  'CO2': { name: 'Bicarbonate', category: 'chemistry', loincCode: '2028-9' },
  'BUN': { name: 'Blood Urea Nitrogen', category: 'chemistry', loincCode: '3094-0' },
  'CREAT': { name: 'Creatinine', category: 'chemistry', loincCode: '2160-0' },
  'GLU': { name: 'Glucose', category: 'chemistry', loincCode: '2339-0' },
  'CA': { name: 'Calcium', category: 'chemistry', loincCode: '17861-6' },
  'PHOS': { name: 'Phosphorus', category: 'chemistry', loincCode: '2777-1' },
  'MG': { name: 'Magnesium', category: 'chemistry', loincCode: '19123-9' },
  'URIC': { name: 'Uric Acid', category: 'chemistry', loincCode: '3084-1' },
  'ALB': { name: 'Albumin', category: 'chemistry', loincCode: '1751-7' },
  'TP': { name: 'Total Protein', category: 'chemistry', loincCode: '2885-2' },

  // Liver Function
  'LFT': { name: 'Liver Function Tests', category: 'liver', loincCode: '24325-3' },
  'AST': { name: 'AST (SGOT)', category: 'liver', loincCode: '1920-8' },
  'ALT': { name: 'ALT (SGPT)', category: 'liver', loincCode: '1742-6' },
  'ALP': { name: 'Alkaline Phosphatase', category: 'liver', loincCode: '6768-6' },
  'GGT': { name: 'Gamma GT', category: 'liver', loincCode: '2324-2' },
  'TBIL': { name: 'Total Bilirubin', category: 'liver', loincCode: '1975-2' },

  // Cardiac Markers
  'TROP': { name: 'Troponin', category: 'cardiac', loincCode: '6598-7' },
  'BNP': { name: 'BNP', category: 'cardiac', loincCode: '30934-4' },
  'NTPROBNP': { name: 'NT-proBNP', category: 'cardiac', loincCode: '33762-6' },

  // Lipid Panel
  'LIPID': { name: 'Lipid Panel', category: 'lipid', loincCode: '57698-3' },
  'CHOL': { name: 'Total Cholesterol', category: 'lipid', loincCode: '2093-3' },
  'TRIG': { name: 'Triglycerides', category: 'lipid', loincCode: '2571-8' },
  'HDL': { name: 'HDL Cholesterol', category: 'lipid', loincCode: '2085-9' },
  'LDL': { name: 'LDL Cholesterol', category: 'lipid', loincCode: '13457-7' },

  // Thyroid
  'TSH': { name: 'TSH', category: 'thyroid', loincCode: '3016-3' },
  'T3': { name: 'Free T3', category: 'thyroid', loincCode: '3051-0' },
  'T4': { name: 'Free T4', category: 'thyroid', loincCode: '3024-7' },

  // Diabetes
  'HBA1C': { name: 'HbA1c', category: 'diabetes', loincCode: '4548-4' },

  // Renal Function
  'EGFR': { name: 'eGFR', category: 'renal', loincCode: '33914-3' },

  // Dialysis Specific
  'PTH': { name: 'Parathyroid Hormone', category: 'dialysis', loincCode: '2731-8' },
  'FER': { name: 'Ferritin', category: 'dialysis', loincCode: '2276-4' },
  'TSAT': { name: 'Transferrin Saturation', category: 'dialysis', loincCode: '2502-3' },
  'IRON': { name: 'Iron', category: 'dialysis', loincCode: '2498-4' },
  'VIT_D': { name: 'Vitamin D', category: 'dialysis', loincCode: '1989-3' },
  'B12': { name: 'Vitamin B12', category: 'dialysis', loincCode: '2132-9' },
  'FOLATE': { name: 'Folate', category: 'dialysis', loincCode: '2284-8' },

  // Coagulation
  'PT': { name: 'Prothrombin Time', category: 'coagulation', loincCode: '5902-2' },
  'INR': { name: 'INR', category: 'coagulation', loincCode: '6301-6' },
  'APTT': { name: 'aPTT', category: 'coagulation', loincCode: '3173-2' },

  // Inflammatory
  'CRP': { name: 'C-Reactive Protein', category: 'inflammatory', loincCode: '1988-5' },
  'ESR': { name: 'Erythrocyte Sedimentation Rate', category: 'inflammatory', loincCode: '30341-2' },
  'PCT': { name: 'Procalcitonin', category: 'inflammatory', loincCode: '33959-8' },

  // Serology
  'HBSAG': { name: 'HBsAg', category: 'serology', loincCode: '5195-3' },
  'HBSAB': { name: 'HBsAb', category: 'serology', loincCode: '5193-8' },
  'HCV': { name: 'HCV Antibody', category: 'serology', loincCode: '16128-1' },
  'HIV': { name: 'HIV', category: 'serology', loincCode: '29893-5' },
};

// ============================================================================
// Critical Value Thresholds
// ============================================================================

interface CriticalThreshold {
  low?: number;
  high?: number;
  unit: string;
}

const CRITICAL_VALUES: Record<string, CriticalThreshold> = {
  'NA': { low: 120, high: 160, unit: 'mEq/L' },
  'K': { low: 2.5, high: 6.5, unit: 'mEq/L' },
  'GLU': { low: 40, high: 500, unit: 'mg/dL' },
  'HGB': { low: 7, high: 20, unit: 'g/dL' },
  'PLT': { low: 50, high: 1000, unit: 'x10^9/L' },
  'WBC': { low: 2, high: 30, unit: 'x10^9/L' },
  'CREAT': { high: 10, unit: 'mg/dL' },
  'CA': { low: 6.5, high: 13, unit: 'mg/dL' },
  'TROP': { high: 0.5, unit: 'ng/mL' },
  'INR': { high: 5, unit: '' },
  'PH': { low: 7.2, high: 7.6, unit: '' },
};

// ============================================================================
// HL7 Parser
// ============================================================================

export class HL7Parser {
  /**
   * Parse HL7 v2.x message
   */
  static parse(rawMessage: string): HL7Message {
    const lines = rawMessage.split(/\r?\n/).filter(l => l.trim());

    if (lines.length === 0 || !lines[0].startsWith('MSH')) {
      throw new Error('Invalid HL7 message: Must start with MSH segment');
    }

    const segments: HL7Segment[] = [];
    let messageType = '';
    let messageId = '';
    let version = '';
    let timestamp = new Date();

    for (const line of lines) {
      const segmentType = line.substring(0, 3);
      let fields: string[];

      if (segmentType === 'MSH') {
        // MSH segment has special handling for field separator
        const fieldSep = line[3];
        fields = line.split(fieldSep);

        // Extract message info from MSH
        messageType = fields[8]?.split('^')[0] || 'UNKNOWN';
        messageId = fields[9] || '';
        version = fields[11] || '2.5';

        // Parse timestamp (format: YYYYMMDDHHMMSS)
        const ts = fields[6] || '';
        if (ts.length >= 8) {
          timestamp = new Date(
            parseInt(ts.substring(0, 4)),
            parseInt(ts.substring(4, 6)) - 1,
            parseInt(ts.substring(6, 8)),
            ts.length >= 10 ? parseInt(ts.substring(8, 10)) : 0,
            ts.length >= 12 ? parseInt(ts.substring(10, 12)) : 0,
            ts.length >= 14 ? parseInt(ts.substring(12, 14)) : 0
          );
        }
      } else {
        fields = line.split('|');
      }

      segments.push({
        type: segmentType,
        fields,
      });
    }

    return {
      type: messageType,
      version,
      messageId,
      timestamp,
      segments,
      raw: rawMessage,
    };
  }

  /**
   * Parse ORU (Observation Result) message to lab result
   */
  static parseORU(message: HL7Message): LabResult {
    const pidSegment = message.segments.find(s => s.type === 'PID');
    const obrSegment = message.segments.find(s => s.type === 'OBR');
    const obxSegments = message.segments.filter(s => s.type === 'OBX');

    if (!pidSegment) {
      throw new Error('Missing PID segment');
    }

    // Parse patient info from PID
    const patientId = pidSegment.fields[3]?.split('^')[0] || '';
    const patientName = pidSegment.fields[5] || '';

    // Parse order info from OBR
    const orderId = obrSegment?.fields[2] || '';
    const collectionDate = this.parseHL7DateTime(obrSegment?.fields[7] || '');
    const resultDate = this.parseHL7DateTime(obrSegment?.fields[22] || obrSegment?.fields[7] || '');

    // Parse test results from OBX
    const tests: LabTestResult[] = obxSegments.map(obx => {
      const code = obx.fields[3]?.split('^')[0] || '';
      const name = obx.fields[3]?.split('^')[1] || code;
      const value = obx.fields[5] || '';
      const unit = obx.fields[6] || '';
      const refRange = obx.fields[7] || '';
      const flag = this.mapAbnormalFlag(obx.fields[8] || '');

      // Parse reference range
      let refLow: number | undefined;
      let refHigh: number | undefined;
      if (refRange.includes('-')) {
        const [low, high] = refRange.split('-');
        refLow = parseFloat(low);
        refHigh = parseFloat(high);
      }

      return {
        code,
        name,
        value: isNaN(parseFloat(value)) ? value : parseFloat(value),
        unit,
        referenceRange: refRange,
        referenceRangeLow: refLow,
        referenceRangeHigh: refHigh,
        flag,
      };
    });

    return {
      id: `ORU-${message.messageId}`,
      orderId,
      patientId,
      patientExternalId: patientId,
      collectionDate,
      resultDate,
      status: 'final',
      tests,
    };
  }

  /**
   * Generate HL7 ORM (Order) message
   */
  static generateORM(order: LabOrder): string {
    const now = new Date();
    const timestamp = this.formatHL7DateTime(now);
    const messageId = `MSG${Date.now()}`;

    const segments: string[] = [];

    // MSH - Message Header
    segments.push([
      'MSH',
      '^~\\&',
      'PERFEX',
      order.patientId,
      'LAB',
      '',
      timestamp,
      '',
      'ORM^O01',
      messageId,
      'P',
      '2.5',
    ].join('|'));

    // PID - Patient Identification
    segments.push([
      'PID',
      '1',
      '',
      order.patientId,
      '',
      order.patientName.replace(' ', '^'),
      '',
      order.patientDateOfBirth.replace(/-/g, ''),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ].join('|'));

    // ORC - Common Order
    const priority = order.priority === 'stat' ? 'S' : order.priority === 'urgent' ? 'A' : 'R';
    segments.push([
      'ORC',
      'NW',
      order.id,
      '',
      '',
      priority,
      '',
      '',
      '',
      this.formatHL7DateTime(order.orderDate),
      '',
      order.collectingPhysician || '',
    ].join('|'));

    // OBR - Observation Request (one per test)
    order.tests.forEach((test, index) => {
      segments.push([
        'OBR',
        (index + 1).toString(),
        order.id,
        '',
        `${test.code}^${test.name}`,
        priority,
        this.formatHL7DateTime(order.orderDate),
        '',
        '',
        '',
        order.fasting ? 'Y' : 'N',
        '',
        order.clinicalInfo || '',
        '',
        '',
        order.collectingPhysician || '',
      ].join('|'));
    });

    return segments.join('\r');
  }

  private static parseHL7DateTime(hl7Date: string): Date {
    if (!hl7Date || hl7Date.length < 8) {
      return new Date();
    }

    return new Date(
      parseInt(hl7Date.substring(0, 4)),
      parseInt(hl7Date.substring(4, 6)) - 1,
      parseInt(hl7Date.substring(6, 8)),
      hl7Date.length >= 10 ? parseInt(hl7Date.substring(8, 10)) : 0,
      hl7Date.length >= 12 ? parseInt(hl7Date.substring(10, 12)) : 0,
      hl7Date.length >= 14 ? parseInt(hl7Date.substring(12, 14)) : 0
    );
  }

  private static formatHL7DateTime(date: Date): string {
    return date.toISOString()
      .replace(/[-:T]/g, '')
      .substring(0, 14);
  }

  private static mapAbnormalFlag(flag: string): LabTestResult['flag'] {
    switch (flag.toUpperCase()) {
      case 'H': return 'high';
      case 'L': return 'low';
      case 'HH': case 'CH': return 'critical_high';
      case 'LL': case 'CL': return 'critical_low';
      case 'A': return 'abnormal';
      case 'N': return 'normal';
      default: return 'normal';
    }
  }
}

// ============================================================================
// Laboratory Connector Class
// ============================================================================

export class LabConnector {
  private config: LabConnectorConfig;

  constructor(config: LabConnectorConfig) {
    this.config = config;
  }

  /**
   * Submit a lab order
   */
  async submitOrder(order: LabOrder): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
  }> {
    logger.info('Submitting lab order', {
      orderId: order.id,
      patientId: order.patientId,
      tests: order.tests.map(t => t.code),
    });

    if (this.config.environment !== 'production') {
      return {
        success: true,
        orderId: `MOCK-${order.id}`,
      };
    }

    switch (this.config.provider) {
      case 'generic':
        return this.submitGenericOrder(order);
      case 'mock':
        return this.submitMockOrder(order);
      default:
        return {
          success: false,
          error: `Provider ${this.config.provider} not implemented`,
        };
    }
  }

  /**
   * Fetch results for an order
   */
  async fetchResults(orderId: string): Promise<LabResult | null> {
    logger.info('Fetching lab results', { orderId });

    if (this.config.environment !== 'production') {
      return this.generateMockResults(orderId);
    }

    switch (this.config.provider) {
      case 'generic':
        return this.fetchGenericResults(orderId);
      case 'mock':
        return this.generateMockResults(orderId);
      default:
        return null;
    }
  }

  /**
   * Fetch all pending results for the organization
   */
  async fetchPendingResults(): Promise<LabResult[]> {
    logger.info('Fetching pending lab results', {
      organizationId: this.config.organizationId,
    });

    // In mock mode, return sample results
    if (this.config.provider === 'mock' || this.config.environment !== 'production') {
      return [this.generateMockResults('PENDING-001')!];
    }

    return [];
  }

  /**
   * Check if any results contain critical values
   */
  checkCriticalValues(result: LabResult): {
    hasCritical: boolean;
    criticalTests: LabTestResult[];
  } {
    const criticalTests: LabTestResult[] = [];

    for (const test of result.tests) {
      const threshold = CRITICAL_VALUES[test.code];
      if (!threshold) continue;

      const value = typeof test.value === 'number' ? test.value : parseFloat(test.value);
      if (isNaN(value)) continue;

      if ((threshold.low !== undefined && value < threshold.low) ||
          (threshold.high !== undefined && value > threshold.high)) {
        criticalTests.push(test);
      }
    }

    return {
      hasCritical: criticalTests.length > 0,
      criticalTests,
    };
  }

  /**
   * Convert lab result to internal format for storage
   */
  toInternalFormat(result: LabResult): Record<string, any> {
    const internal: Record<string, any> = {
      external_id: result.id,
      patient_id: result.patientId,
      collection_date: result.collectionDate.toISOString(),
      result_date: result.resultDate.toISOString(),
      status: result.status,
      performing_lab: result.performingLab,
    };

    // Map test results to internal fields
    for (const test of result.tests) {
      const mapping = this.getInternalFieldMapping(test.code);
      if (mapping) {
        internal[mapping] = test.value;
      }
    }

    return internal;
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private async submitGenericOrder(order: LabOrder): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
  }> {
    if (!this.config.baseUrl || !this.config.apiKey) {
      return { success: false, error: 'Missing API configuration' };
    }

    try {
      const hl7Message = HL7Parser.generateORM(order);

      const response = await fetch(`${this.config.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/hl7-v2+text',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: hl7Message,
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const result = await response.json() as { orderId: string };
      return {
        success: true,
        orderId: result.orderId,
      };
    } catch (error) {
      logger.error('Failed to submit lab order', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async submitMockOrder(order: LabOrder): Promise<{
    success: boolean;
    orderId?: string;
    error?: string;
  }> {
    return {
      success: true,
      orderId: `MOCK-${order.id}`,
    };
  }

  private async fetchGenericResults(orderId: string): Promise<LabResult | null> {
    if (!this.config.baseUrl || !this.config.apiKey) {
      return null;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/results/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const hl7Message = await response.text();
      const parsed = HL7Parser.parse(hl7Message);
      return HL7Parser.parseORU(parsed);
    } catch (error) {
      logger.error('Failed to fetch lab results', { error, orderId });
      return null;
    }
  }

  private generateMockResults(orderId: string): LabResult {
    return {
      id: `RESULT-${orderId}`,
      orderId,
      patientId: 'MOCK-PATIENT-001',
      collectionDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      resultDate: new Date(),
      status: 'final',
      tests: [
        {
          code: 'HGB',
          name: 'Hemoglobin',
          value: 12.5,
          unit: 'g/dL',
          referenceRange: '12-16',
          referenceRangeLow: 12,
          referenceRangeHigh: 16,
          flag: 'normal',
        },
        {
          code: 'CREAT',
          name: 'Creatinine',
          value: 4.5,
          unit: 'mg/dL',
          referenceRange: '0.7-1.3',
          referenceRangeLow: 0.7,
          referenceRangeHigh: 1.3,
          flag: 'high',
        },
        {
          code: 'K',
          name: 'Potassium',
          value: 5.2,
          unit: 'mEq/L',
          referenceRange: '3.5-5.0',
          referenceRangeLow: 3.5,
          referenceRangeHigh: 5.0,
          flag: 'high',
        },
        {
          code: 'NA',
          name: 'Sodium',
          value: 140,
          unit: 'mEq/L',
          referenceRange: '136-145',
          referenceRangeLow: 136,
          referenceRangeHigh: 145,
          flag: 'normal',
        },
      ],
      performingLab: 'Mock Laboratory',
    };
  }

  private getInternalFieldMapping(code: string): string | null {
    const mappings: Record<string, string> = {
      'HGB': 'hemoglobin',
      'HCT': 'hematocrit',
      'WBC': 'wbc',
      'PLT': 'platelets',
      'NA': 'sodium',
      'K': 'potassium',
      'CL': 'chloride',
      'CO2': 'bicarbonate',
      'BUN': 'bun',
      'CREAT': 'creatinine',
      'GLU': 'glucose',
      'CA': 'calcium',
      'PHOS': 'phosphorus',
      'MG': 'magnesium',
      'ALB': 'albumin',
      'TP': 'total_protein',
      'AST': 'ast',
      'ALT': 'alt',
      'ALP': 'alkaline_phosphatase',
      'TBIL': 'total_bilirubin',
      'PTH': 'pth',
      'FER': 'ferritin',
      'IRON': 'iron',
      'TSAT': 'transferrin_saturation',
      'TSH': 'tsh',
      'HBA1C': 'hba1c',
      'CHOL': 'total_cholesterol',
      'TRIG': 'triglycerides',
      'HDL': 'hdl',
      'LDL': 'ldl',
      'CRP': 'crp',
      'INR': 'inr',
    };

    return mappings[code] || null;
  }

  /**
   * Get available test codes
   */
  static getAvailableTests(): Record<string, { name: string; category: string }> {
    return LAB_TEST_CODES;
  }

  /**
   * Get tests by category
   */
  static getTestsByCategory(category: string): { code: string; name: string }[] {
    return Object.entries(LAB_TEST_CODES)
      .filter(([_, info]) => info.category === category)
      .map(([code, info]) => ({ code, name: info.name }));
  }
}

export default LabConnector;
