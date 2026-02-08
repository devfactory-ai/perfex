/**
 * HL7 FHIR R4 Adapter Service
 * Provides interoperability with healthcare systems using FHIR standard
 *
 * Supports:
 * - Patient resources
 * - Observation resources (lab results, vitals)
 * - Procedure resources
 * - DiagnosticReport resources
 * - Encounter resources
 * - Medication resources
 */

import { logger } from '../../utils/logger';

// ============================================================================
// FHIR R4 Types
// ============================================================================

export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    profile?: string[];
  };
}

export interface FHIRIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: FHIRCodeableConcept;
  system?: string;
  value: string;
  period?: FHIRPeriod;
  assigner?: FHIRReference;
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[];
  text?: string;
}

export interface FHIRCoding {
  system?: string;
  version?: string;
  code: string;
  display?: string;
  userSelected?: boolean;
}

export interface FHIRReference {
  reference?: string;
  type?: string;
  identifier?: FHIRIdentifier;
  display?: string;
}

export interface FHIRPeriod {
  start?: string;
  end?: string;
}

export interface FHIRHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'anonymous' | 'old' | 'maiden';
  text?: string;
  family?: string;
  given?: string[];
  prefix?: string[];
  suffix?: string[];
  period?: FHIRPeriod;
}

export interface FHIRAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing';
  type?: 'postal' | 'physical' | 'both';
  text?: string;
  line?: string[];
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  period?: FHIRPeriod;
}

export interface FHIRContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other';
  value?: string;
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile';
  rank?: number;
  period?: FHIRPeriod;
}

export interface FHIRQuantity {
  value?: number;
  comparator?: '<' | '<=' | '>=' | '>';
  unit?: string;
  system?: string;
  code?: string;
}

// ============================================================================
// FHIR Patient Resource
// ============================================================================

export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  identifier?: FHIRIdentifier[];
  active?: boolean;
  name?: FHIRHumanName[];
  telecom?: FHIRContactPoint[];
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  deceasedBoolean?: boolean;
  deceasedDateTime?: string;
  address?: FHIRAddress[];
  maritalStatus?: FHIRCodeableConcept;
  multipleBirthBoolean?: boolean;
  multipleBirthInteger?: number;
  contact?: {
    relationship?: FHIRCodeableConcept[];
    name?: FHIRHumanName;
    telecom?: FHIRContactPoint[];
    address?: FHIRAddress;
    gender?: string;
    organization?: FHIRReference;
    period?: FHIRPeriod;
  }[];
  communication?: {
    language: FHIRCodeableConcept;
    preferred?: boolean;
  }[];
  generalPractitioner?: FHIRReference[];
  managingOrganization?: FHIRReference;
}

// ============================================================================
// FHIR Observation Resource
// ============================================================================

export interface FHIRObservation extends FHIRResource {
  resourceType: 'Observation';
  identifier?: FHIRIdentifier[];
  basedOn?: FHIRReference[];
  partOf?: FHIRReference[];
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: FHIRCodeableConcept[];
  code: FHIRCodeableConcept;
  subject?: FHIRReference;
  focus?: FHIRReference[];
  encounter?: FHIRReference;
  effectiveDateTime?: string;
  effectivePeriod?: FHIRPeriod;
  issued?: string;
  performer?: FHIRReference[];
  valueQuantity?: FHIRQuantity;
  valueCodeableConcept?: FHIRCodeableConcept;
  valueString?: string;
  valueBoolean?: boolean;
  valueInteger?: number;
  valueRange?: { low?: FHIRQuantity; high?: FHIRQuantity };
  valueRatio?: { numerator?: FHIRQuantity; denominator?: FHIRQuantity };
  dataAbsentReason?: FHIRCodeableConcept;
  interpretation?: FHIRCodeableConcept[];
  note?: { text: string }[];
  bodySite?: FHIRCodeableConcept;
  method?: FHIRCodeableConcept;
  specimen?: FHIRReference;
  device?: FHIRReference;
  referenceRange?: {
    low?: FHIRQuantity;
    high?: FHIRQuantity;
    type?: FHIRCodeableConcept;
    appliesTo?: FHIRCodeableConcept[];
    age?: { low?: FHIRQuantity; high?: FHIRQuantity };
    text?: string;
  }[];
  component?: {
    code: FHIRCodeableConcept;
    valueQuantity?: FHIRQuantity;
    valueCodeableConcept?: FHIRCodeableConcept;
    valueString?: string;
    dataAbsentReason?: FHIRCodeableConcept;
    interpretation?: FHIRCodeableConcept[];
    referenceRange?: FHIRObservation['referenceRange'];
  }[];
}

// ============================================================================
// FHIR Procedure Resource
// ============================================================================

export interface FHIRProcedure extends FHIRResource {
  resourceType: 'Procedure';
  identifier?: FHIRIdentifier[];
  instantiatesCanonical?: string[];
  instantiatesUri?: string[];
  basedOn?: FHIRReference[];
  partOf?: FHIRReference[];
  status: 'preparation' | 'in-progress' | 'not-done' | 'on-hold' | 'stopped' | 'completed' | 'entered-in-error' | 'unknown';
  statusReason?: FHIRCodeableConcept;
  category?: FHIRCodeableConcept;
  code?: FHIRCodeableConcept;
  subject: FHIRReference;
  encounter?: FHIRReference;
  performedDateTime?: string;
  performedPeriod?: FHIRPeriod;
  performedString?: string;
  recorder?: FHIRReference;
  asserter?: FHIRReference;
  performer?: {
    function?: FHIRCodeableConcept;
    actor: FHIRReference;
    onBehalfOf?: FHIRReference;
  }[];
  location?: FHIRReference;
  reasonCode?: FHIRCodeableConcept[];
  reasonReference?: FHIRReference[];
  bodySite?: FHIRCodeableConcept[];
  outcome?: FHIRCodeableConcept;
  report?: FHIRReference[];
  complication?: FHIRCodeableConcept[];
  complicationDetail?: FHIRReference[];
  followUp?: FHIRCodeableConcept[];
  note?: { text: string }[];
  focalDevice?: {
    action?: FHIRCodeableConcept;
    manipulated: FHIRReference;
  }[];
  usedReference?: FHIRReference[];
  usedCode?: FHIRCodeableConcept[];
}

// ============================================================================
// LOINC Code Mappings
// ============================================================================

const LOINC_CODES = {
  // Vital Signs
  heartRate: { code: '8867-4', display: 'Heart rate', system: 'http://loinc.org' },
  respiratoryRate: { code: '9279-1', display: 'Respiratory rate', system: 'http://loinc.org' },
  temperature: { code: '8310-5', display: 'Body temperature', system: 'http://loinc.org' },
  bloodPressureSystolic: { code: '8480-6', display: 'Systolic blood pressure', system: 'http://loinc.org' },
  bloodPressureDiastolic: { code: '8462-4', display: 'Diastolic blood pressure', system: 'http://loinc.org' },
  oxygenSaturation: { code: '2708-6', display: 'Oxygen saturation', system: 'http://loinc.org' },
  weight: { code: '29463-7', display: 'Body weight', system: 'http://loinc.org' },
  height: { code: '8302-2', display: 'Body height', system: 'http://loinc.org' },
  bmi: { code: '39156-5', display: 'BMI', system: 'http://loinc.org' },

  // Lab Results - Hematology
  hemoglobin: { code: '718-7', display: 'Hemoglobin', system: 'http://loinc.org' },
  hematocrit: { code: '4544-3', display: 'Hematocrit', system: 'http://loinc.org' },
  wbc: { code: '6690-2', display: 'White blood cells', system: 'http://loinc.org' },
  platelets: { code: '777-3', display: 'Platelets', system: 'http://loinc.org' },

  // Lab Results - Chemistry
  sodium: { code: '2951-2', display: 'Sodium', system: 'http://loinc.org' },
  potassium: { code: '2823-3', display: 'Potassium', system: 'http://loinc.org' },
  creatinine: { code: '2160-0', display: 'Creatinine', system: 'http://loinc.org' },
  bun: { code: '3094-0', display: 'Blood urea nitrogen', system: 'http://loinc.org' },
  glucose: { code: '2339-0', display: 'Glucose', system: 'http://loinc.org' },
  calcium: { code: '17861-6', display: 'Calcium', system: 'http://loinc.org' },
  phosphorus: { code: '2777-1', display: 'Phosphorus', system: 'http://loinc.org' },
  albumin: { code: '1751-7', display: 'Albumin', system: 'http://loinc.org' },

  // Dialysis Specific
  ktV: { code: '29463-7', display: 'Kt/V', system: 'http://loinc.org' },
  urr: { code: '75940-7', display: 'Urea reduction ratio', system: 'http://loinc.org' },

  // Cardiac
  troponin: { code: '6598-7', display: 'Troponin T', system: 'http://loinc.org' },
  bnp: { code: '30934-4', display: 'BNP', system: 'http://loinc.org' },
  lvef: { code: '10230-1', display: 'Left ventricular ejection fraction', system: 'http://loinc.org' },

  // Ophthalmology
  iop: { code: '41633-5', display: 'Intraocular pressure', system: 'http://loinc.org' },
  visualAcuity: { code: '79878-0', display: 'Visual acuity', system: 'http://loinc.org' },
};

// SNOMED CT Procedure Codes
const SNOMED_PROCEDURES = {
  hemodialysis: { code: '302497006', display: 'Hemodialysis', system: 'http://snomed.info/sct' },
  peritonealDialysis: { code: '71192002', display: 'Peritoneal dialysis', system: 'http://snomed.info/sct' },
  ecg: { code: '29303009', display: 'Electrocardiographic procedure', system: 'http://snomed.info/sct' },
  echocardiography: { code: '40701008', display: 'Echocardiography', system: 'http://snomed.info/sct' },
  coronaryAngiography: { code: '33367005', display: 'Coronary angiography', system: 'http://snomed.info/sct' },
  pciStent: { code: '36969009', display: 'Placement of stent', system: 'http://snomed.info/sct' },
  ivtInjection: { code: '424082009', display: 'Intravitreal injection', system: 'http://snomed.info/sct' },
  cataractSurgery: { code: '54885007', display: 'Cataract surgery', system: 'http://snomed.info/sct' },
  octScan: { code: '252784003', display: 'OCT scan', system: 'http://snomed.info/sct' },
};

// ============================================================================
// FHIR Adapter Class
// ============================================================================

export class FHIRAdapter {
  private baseUrl: string;

  constructor(
    private organizationId: string,
    baseUrl: string = 'https://fhir.example.org/r4'
  ) {
    this.baseUrl = baseUrl;
  }

  // ==========================================================================
  // Patient Conversion
  // ==========================================================================

  /**
   * Convert internal patient to FHIR Patient resource
   */
  patientToFHIR(patient: any): FHIRPatient {
    const fhirPatient: FHIRPatient = {
      resourceType: 'Patient',
      id: patient.id,
      meta: {
        lastUpdated: patient.updated_at || patient.updatedAt,
        profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
      },
      identifier: [
        {
          use: 'official',
          system: `${this.baseUrl}/organization/${this.organizationId}/patient`,
          value: patient.id,
        },
      ],
      active: patient.status === 'active',
      name: [
        {
          use: 'official',
          family: patient.last_name || patient.lastName,
          given: [patient.first_name || patient.firstName],
        },
      ],
      gender: this.mapGender(patient.gender || patient.sex),
      birthDate: this.formatDate(patient.date_of_birth || patient.dateOfBirth),
    };

    // Add telecom
    if (patient.phone || patient.email) {
      fhirPatient.telecom = [];
      if (patient.phone) {
        fhirPatient.telecom.push({
          system: 'phone',
          value: patient.phone,
          use: 'mobile',
        });
      }
      if (patient.email) {
        fhirPatient.telecom.push({
          system: 'email',
          value: patient.email,
        });
      }
    }

    // Add address
    if (patient.address) {
      fhirPatient.address = [{
        use: 'home',
        text: patient.address,
        city: patient.city,
        postalCode: patient.postal_code || patient.postalCode,
        country: patient.country || 'FR',
      }];
    }

    // Add deceased status
    if (patient.status === 'deceased') {
      fhirPatient.deceasedBoolean = true;
      if (patient.deceased_date || patient.deceasedDate) {
        fhirPatient.deceasedDateTime = this.formatDateTime(patient.deceased_date || patient.deceasedDate);
      }
    }

    return fhirPatient;
  }

  /**
   * Convert FHIR Patient to internal format
   */
  fhirToPatient(fhirPatient: FHIRPatient): any {
    const name = fhirPatient.name?.[0];
    const address = fhirPatient.address?.[0];
    const phone = fhirPatient.telecom?.find(t => t.system === 'phone');
    const email = fhirPatient.telecom?.find(t => t.system === 'email');

    return {
      id: fhirPatient.id,
      first_name: name?.given?.[0],
      last_name: name?.family,
      date_of_birth: fhirPatient.birthDate,
      gender: fhirPatient.gender,
      phone: phone?.value,
      email: email?.value,
      address: address?.text || address?.line?.join(', '),
      city: address?.city,
      postal_code: address?.postalCode,
      country: address?.country,
      status: fhirPatient.deceasedBoolean ? 'deceased' : (fhirPatient.active ? 'active' : 'inactive'),
    };
  }

  // ==========================================================================
  // Observation Conversion
  // ==========================================================================

  /**
   * Convert lab result to FHIR Observation
   */
  labResultToFHIR(
    labResult: any,
    patientId: string,
    testType: keyof typeof LOINC_CODES
  ): FHIRObservation {
    const loincCode = LOINC_CODES[testType];

    const observation: FHIRObservation = {
      resourceType: 'Observation',
      id: `${labResult.id}-${testType}`,
      meta: {
        lastUpdated: labResult.updated_at || new Date().toISOString(),
      },
      status: 'final',
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'laboratory',
          display: 'Laboratory',
        }],
      }],
      code: {
        coding: [loincCode],
        text: loincCode.display,
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      effectiveDateTime: labResult.collection_date || labResult.collectionDate,
      issued: labResult.result_date || labResult.resultDate || new Date().toISOString(),
    };

    // Set value based on test type
    const value = labResult[testType] || labResult[this.camelToSnake(testType)];
    if (value !== undefined && value !== null) {
      observation.valueQuantity = {
        value: parseFloat(value),
        unit: this.getUnit(testType),
        system: 'http://unitsofmeasure.org',
        code: this.getUCUMCode(testType),
      };

      // Add reference range if applicable
      observation.referenceRange = [this.getReferenceRange(testType)];

      // Add interpretation
      observation.interpretation = [this.getInterpretation(testType, value)];
    }

    return observation;
  }

  /**
   * Convert vital signs to FHIR Observation
   */
  vitalSignToFHIR(
    vitals: any,
    patientId: string,
    encounterId?: string
  ): FHIRObservation[] {
    const observations: FHIRObservation[] = [];
    const timestamp = vitals.measured_at || vitals.measuredAt || new Date().toISOString();

    // Map each vital sign
    const vitalMappings: { field: string; type: keyof typeof LOINC_CODES }[] = [
      { field: 'heart_rate', type: 'heartRate' },
      { field: 'respiratory_rate', type: 'respiratoryRate' },
      { field: 'temperature', type: 'temperature' },
      { field: 'systolic_bp', type: 'bloodPressureSystolic' },
      { field: 'diastolic_bp', type: 'bloodPressureDiastolic' },
      { field: 'oxygen_saturation', type: 'oxygenSaturation' },
      { field: 'weight', type: 'weight' },
      { field: 'height', type: 'height' },
    ];

    for (const mapping of vitalMappings) {
      const value = vitals[mapping.field] || vitals[this.snakeToCamel(mapping.field)];
      if (value !== undefined && value !== null) {
        const loincCode = LOINC_CODES[mapping.type];
        observations.push({
          resourceType: 'Observation',
          id: `vitals-${vitals.id || Date.now()}-${mapping.type}`,
          status: 'final',
          category: [{
            coding: [{
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'vital-signs',
              display: 'Vital Signs',
            }],
          }],
          code: {
            coding: [loincCode],
            text: loincCode.display,
          },
          subject: {
            reference: `Patient/${patientId}`,
          },
          encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
          effectiveDateTime: timestamp,
          valueQuantity: {
            value: parseFloat(value),
            unit: this.getUnit(mapping.type),
            system: 'http://unitsofmeasure.org',
            code: this.getUCUMCode(mapping.type),
          },
        });
      }
    }

    return observations;
  }

  /**
   * Convert dialysis session to FHIR Observations
   */
  dialysisSessionToFHIR(session: any, patientId: string): {
    procedure: FHIRProcedure;
    observations: FHIRObservation[];
  } {
    // Create procedure
    const procedure: FHIRProcedure = {
      resourceType: 'Procedure',
      id: session.id,
      status: session.status === 'completed' ? 'completed' : 'in-progress',
      category: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: '277132007',
          display: 'Therapeutic procedure',
        }],
      },
      code: {
        coding: [SNOMED_PROCEDURES.hemodialysis],
        text: 'Hemodialysis session',
      },
      subject: {
        reference: `Patient/${patientId}`,
      },
      performedPeriod: {
        start: session.session_date || session.sessionDate,
        end: session.end_time || session.endTime,
      },
      outcome: {
        text: session.status === 'completed' ? 'Completed successfully' : session.status,
      },
    };

    // Add complications if any
    if (session.complications && session.complications.length > 0) {
      procedure.complication = session.complications.map((c: any) => ({
        text: typeof c === 'string' ? c : c.type || c.description,
      }));
    }

    // Create observations
    const observations: FHIRObservation[] = [];

    // Kt/V
    if (session.kt_v || session.ktV) {
      observations.push({
        resourceType: 'Observation',
        id: `${session.id}-ktv`,
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'procedure',
            display: 'Procedure',
          }],
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '29463-7',
            display: 'Kt/V',
          }],
        },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: session.session_date || session.sessionDate,
        valueQuantity: {
          value: session.kt_v || session.ktV,
          unit: '1',
          system: 'http://unitsofmeasure.org',
          code: '1',
        },
        interpretation: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: (session.kt_v || session.ktV) >= 1.2 ? 'N' : 'L',
            display: (session.kt_v || session.ktV) >= 1.2 ? 'Normal' : 'Low',
          }],
        }],
      });
    }

    // Pre/Post weights
    if (session.pre_weight || session.preWeight) {
      observations.push({
        resourceType: 'Observation',
        id: `${session.id}-pre-weight`,
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '29463-7',
            display: 'Pre-dialysis weight',
          }],
        },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: session.session_date || session.sessionDate,
        valueQuantity: {
          value: session.pre_weight || session.preWeight,
          unit: 'kg',
          system: 'http://unitsofmeasure.org',
          code: 'kg',
        },
      });
    }

    if (session.post_weight || session.postWeight) {
      observations.push({
        resourceType: 'Observation',
        id: `${session.id}-post-weight`,
        status: 'final',
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '29463-7',
            display: 'Post-dialysis weight',
          }],
        },
        subject: { reference: `Patient/${patientId}` },
        effectiveDateTime: session.session_date || session.sessionDate,
        valueQuantity: {
          value: session.post_weight || session.postWeight,
          unit: 'kg',
          system: 'http://unitsofmeasure.org',
          code: 'kg',
        },
      });
    }

    return { procedure, observations };
  }

  // ==========================================================================
  // Bundle Operations
  // ==========================================================================

  /**
   * Create a FHIR Bundle for batch operations
   */
  createBundle(
    resources: FHIRResource[],
    type: 'transaction' | 'batch' | 'collection' = 'collection'
  ): {
    resourceType: 'Bundle';
    type: string;
    entry: { resource: FHIRResource; request?: any }[];
  } {
    return {
      resourceType: 'Bundle',
      type,
      entry: resources.map(resource => ({
        resource,
        ...(type === 'transaction' || type === 'batch' ? {
          request: {
            method: resource.id ? 'PUT' : 'POST',
            url: `${resource.resourceType}${resource.id ? '/' + resource.id : ''}`,
          },
        } : {}),
      })),
    };
  }

  /**
   * Export patient data as FHIR Bundle
   */
  exportPatientBundle(
    patient: any,
    labResults: any[],
    sessions?: any[],
    vitals?: any[]
  ): {
    resourceType: 'Bundle';
    type: string;
    entry: { resource: FHIRResource }[];
  } {
    const resources: FHIRResource[] = [];

    // Add patient
    resources.push(this.patientToFHIR(patient));

    // Add lab results as observations
    for (const lab of labResults) {
      for (const testType of Object.keys(LOINC_CODES) as (keyof typeof LOINC_CODES)[]) {
        const value = lab[testType] || lab[this.camelToSnake(testType)];
        if (value !== undefined && value !== null) {
          resources.push(this.labResultToFHIR(lab, patient.id, testType));
        }
      }
    }

    // Add dialysis sessions
    if (sessions) {
      for (const session of sessions) {
        const { procedure, observations } = this.dialysisSessionToFHIR(session, patient.id);
        resources.push(procedure);
        resources.push(...observations);
      }
    }

    // Add vitals
    if (vitals) {
      for (const vital of vitals) {
        resources.push(...this.vitalSignToFHIR(vital, patient.id));
      }
    }

    return this.createBundle(resources, 'collection');
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  private mapGender(gender?: string): 'male' | 'female' | 'other' | 'unknown' {
    if (!gender) return 'unknown';
    const g = gender.toLowerCase();
    if (g === 'male' || g === 'm' || g === 'homme') return 'male';
    if (g === 'female' || g === 'f' || g === 'femme') return 'female';
    return 'other';
  }

  private formatDate(date: string | Date | undefined): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    return d.toISOString().split('T')[0];
  }

  private formatDateTime(date: string | Date | undefined): string | undefined {
    if (!date) return undefined;
    return new Date(date).toISOString();
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private snakeToCamel(str: string): string {
    return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
  }

  private getUnit(testType: string): string {
    const units: Record<string, string> = {
      heartRate: 'beats/min',
      respiratoryRate: 'breaths/min',
      temperature: 'Cel',
      bloodPressureSystolic: 'mm[Hg]',
      bloodPressureDiastolic: 'mm[Hg]',
      oxygenSaturation: '%',
      weight: 'kg',
      height: 'cm',
      hemoglobin: 'g/dL',
      hematocrit: '%',
      sodium: 'mmol/L',
      potassium: 'mmol/L',
      creatinine: 'mg/dL',
      glucose: 'mg/dL',
      calcium: 'mg/dL',
      phosphorus: 'mg/dL',
    };
    return units[testType] || '';
  }

  private getUCUMCode(testType: string): string {
    const codes: Record<string, string> = {
      heartRate: '/min',
      respiratoryRate: '/min',
      temperature: 'Cel',
      bloodPressureSystolic: 'mm[Hg]',
      bloodPressureDiastolic: 'mm[Hg]',
      oxygenSaturation: '%',
      weight: 'kg',
      height: 'cm',
      hemoglobin: 'g/dL',
      creatinine: 'mg/dL',
    };
    return codes[testType] || '';
  }

  private getReferenceRange(testType: string): { low?: FHIRQuantity; high?: FHIRQuantity; text?: string } {
    const ranges: Record<string, { low?: number; high?: number; unit: string }> = {
      hemoglobin: { low: 12, high: 16, unit: 'g/dL' },
      sodium: { low: 136, high: 145, unit: 'mmol/L' },
      potassium: { low: 3.5, high: 5.0, unit: 'mmol/L' },
      creatinine: { low: 0.7, high: 1.3, unit: 'mg/dL' },
      glucose: { low: 70, high: 100, unit: 'mg/dL' },
    };

    const range = ranges[testType];
    if (!range) return { text: 'Reference range not available' };

    return {
      low: range.low ? { value: range.low, unit: range.unit } : undefined,
      high: range.high ? { value: range.high, unit: range.unit } : undefined,
    };
  }

  private getInterpretation(testType: string, value: number): FHIRCodeableConcept {
    const ranges: Record<string, { low: number; high: number }> = {
      hemoglobin: { low: 12, high: 16 },
      sodium: { low: 136, high: 145 },
      potassium: { low: 3.5, high: 5.0 },
      creatinine: { low: 0.7, high: 1.3 },
    };

    const range = ranges[testType];
    if (!range) {
      return { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'N', display: 'Normal' }] };
    }

    if (value < range.low) {
      return { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'L', display: 'Low' }] };
    }
    if (value > range.high) {
      return { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'H', display: 'High' }] };
    }
    return { coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation', code: 'N', display: 'Normal' }] };
  }
}

export default FHIRAdapter;
