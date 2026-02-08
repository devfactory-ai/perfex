/**
 * FHIR R4 Service
 * Complete HL7 FHIR R4 implementation for healthcare data interoperability
 */


// =============================================================================
// FHIR R4 Resource Types
// =============================================================================

export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
    source?: string;
    profile?: string[];
  };
}

export interface FHIRIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary' | 'old';
  type?: FHIRCodeableConcept;
  system?: string;
  value?: string;
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
  code?: string;
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

export interface FHIRAnnotation {
  authorReference?: FHIRReference;
  authorString?: string;
  time?: string;
  text: string;
}

// =============================================================================
// FHIR Patient Resource
// =============================================================================

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
  photo?: { contentType?: string; url?: string; data?: string }[];
  contact?: {
    relationship?: FHIRCodeableConcept[];
    name?: FHIRHumanName;
    telecom?: FHIRContactPoint[];
    address?: FHIRAddress;
    gender?: 'male' | 'female' | 'other' | 'unknown';
    organization?: FHIRReference;
    period?: FHIRPeriod;
  }[];
  communication?: {
    language: FHIRCodeableConcept;
    preferred?: boolean;
  }[];
  generalPractitioner?: FHIRReference[];
  managingOrganization?: FHIRReference;
  link?: {
    other: FHIRReference;
    type: 'replaced-by' | 'replaces' | 'refer' | 'seealso';
  }[];
}

// =============================================================================
// FHIR Observation Resource
// =============================================================================

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
  note?: FHIRAnnotation[];
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
  hasMember?: FHIRReference[];
  derivedFrom?: FHIRReference[];
  component?: {
    code: FHIRCodeableConcept;
    valueQuantity?: FHIRQuantity;
    valueCodeableConcept?: FHIRCodeableConcept;
    valueString?: string;
    valueBoolean?: boolean;
    valueInteger?: number;
    dataAbsentReason?: FHIRCodeableConcept;
    interpretation?: FHIRCodeableConcept[];
    referenceRange?: FHIRObservation['referenceRange'];
  }[];
}

// =============================================================================
// FHIR Condition Resource
// =============================================================================

export interface FHIRCondition extends FHIRResource {
  resourceType: 'Condition';
  identifier?: FHIRIdentifier[];
  clinicalStatus?: FHIRCodeableConcept;
  verificationStatus?: FHIRCodeableConcept;
  category?: FHIRCodeableConcept[];
  severity?: FHIRCodeableConcept;
  code?: FHIRCodeableConcept;
  bodySite?: FHIRCodeableConcept[];
  subject: FHIRReference;
  encounter?: FHIRReference;
  onsetDateTime?: string;
  onsetAge?: FHIRQuantity;
  onsetPeriod?: FHIRPeriod;
  onsetRange?: { low?: FHIRQuantity; high?: FHIRQuantity };
  onsetString?: string;
  abatementDateTime?: string;
  abatementAge?: FHIRQuantity;
  abatementPeriod?: FHIRPeriod;
  abatementRange?: { low?: FHIRQuantity; high?: FHIRQuantity };
  abatementString?: string;
  recordedDate?: string;
  recorder?: FHIRReference;
  asserter?: FHIRReference;
  stage?: {
    summary?: FHIRCodeableConcept;
    assessment?: FHIRReference[];
    type?: FHIRCodeableConcept;
  }[];
  evidence?: {
    code?: FHIRCodeableConcept[];
    detail?: FHIRReference[];
  }[];
  note?: FHIRAnnotation[];
}

// =============================================================================
// FHIR Procedure Resource
// =============================================================================

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
  performedAge?: FHIRQuantity;
  performedRange?: { low?: FHIRQuantity; high?: FHIRQuantity };
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
  note?: FHIRAnnotation[];
  focalDevice?: {
    action?: FHIRCodeableConcept;
    manipulated: FHIRReference;
  }[];
  usedReference?: FHIRReference[];
  usedCode?: FHIRCodeableConcept[];
}

// =============================================================================
// FHIR MedicationStatement Resource
// =============================================================================

export interface FHIRMedicationStatement extends FHIRResource {
  resourceType: 'MedicationStatement';
  identifier?: FHIRIdentifier[];
  basedOn?: FHIRReference[];
  partOf?: FHIRReference[];
  status: 'active' | 'completed' | 'entered-in-error' | 'intended' | 'stopped' | 'on-hold' | 'unknown' | 'not-taken';
  statusReason?: FHIRCodeableConcept[];
  category?: FHIRCodeableConcept;
  medicationCodeableConcept?: FHIRCodeableConcept;
  medicationReference?: FHIRReference;
  subject: FHIRReference;
  context?: FHIRReference;
  effectiveDateTime?: string;
  effectivePeriod?: FHIRPeriod;
  dateAsserted?: string;
  informationSource?: FHIRReference;
  derivedFrom?: FHIRReference[];
  reasonCode?: FHIRCodeableConcept[];
  reasonReference?: FHIRReference[];
  note?: FHIRAnnotation[];
  dosage?: {
    sequence?: number;
    text?: string;
    additionalInstruction?: FHIRCodeableConcept[];
    patientInstruction?: string;
    timing?: {
      event?: string[];
      repeat?: {
        frequency?: number;
        period?: number;
        periodUnit?: 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a';
      };
      code?: FHIRCodeableConcept;
    };
    asNeededBoolean?: boolean;
    asNeededCodeableConcept?: FHIRCodeableConcept;
    site?: FHIRCodeableConcept;
    route?: FHIRCodeableConcept;
    method?: FHIRCodeableConcept;
    doseAndRate?: {
      type?: FHIRCodeableConcept;
      doseQuantity?: FHIRQuantity;
      doseRange?: { low?: FHIRQuantity; high?: FHIRQuantity };
      rateRatio?: { numerator?: FHIRQuantity; denominator?: FHIRQuantity };
      rateQuantity?: FHIRQuantity;
      rateRange?: { low?: FHIRQuantity; high?: FHIRQuantity };
    }[];
    maxDosePerPeriod?: { numerator?: FHIRQuantity; denominator?: FHIRQuantity };
    maxDosePerAdministration?: FHIRQuantity;
    maxDosePerLifetime?: FHIRQuantity;
  }[];
}

// =============================================================================
// FHIR DiagnosticReport Resource
// =============================================================================

export interface FHIRDiagnosticReport extends FHIRResource {
  resourceType: 'DiagnosticReport';
  identifier?: FHIRIdentifier[];
  basedOn?: FHIRReference[];
  status: 'registered' | 'partial' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'appended' | 'cancelled' | 'entered-in-error' | 'unknown';
  category?: FHIRCodeableConcept[];
  code: FHIRCodeableConcept;
  subject?: FHIRReference;
  encounter?: FHIRReference;
  effectiveDateTime?: string;
  effectivePeriod?: FHIRPeriod;
  issued?: string;
  performer?: FHIRReference[];
  resultsInterpreter?: FHIRReference[];
  specimen?: FHIRReference[];
  result?: FHIRReference[];
  imagingStudy?: FHIRReference[];
  media?: {
    comment?: string;
    link: FHIRReference;
  }[];
  conclusion?: string;
  conclusionCode?: FHIRCodeableConcept[];
  presentedForm?: {
    contentType?: string;
    language?: string;
    data?: string;
    url?: string;
    size?: number;
    hash?: string;
    title?: string;
    creation?: string;
  }[];
}

// =============================================================================
// FHIR Device Resource
// =============================================================================

export interface FHIRDevice extends FHIRResource {
  resourceType: 'Device';
  identifier?: FHIRIdentifier[];
  definition?: FHIRReference;
  udiCarrier?: {
    deviceIdentifier?: string;
    issuer?: string;
    jurisdiction?: string;
    carrierAIDC?: string;
    carrierHRF?: string;
    entryType?: 'barcode' | 'rfid' | 'manual' | 'card' | 'self-reported' | 'unknown';
  }[];
  status?: 'active' | 'inactive' | 'entered-in-error' | 'unknown';
  statusReason?: FHIRCodeableConcept[];
  distinctIdentifier?: string;
  manufacturer?: string;
  manufactureDate?: string;
  expirationDate?: string;
  lotNumber?: string;
  serialNumber?: string;
  deviceName?: {
    name: string;
    type: 'udi-label-name' | 'user-friendly-name' | 'patient-reported-name' | 'manufacturer-name' | 'model-name' | 'other';
  }[];
  modelNumber?: string;
  partNumber?: string;
  type?: FHIRCodeableConcept;
  specialization?: {
    systemType: FHIRCodeableConcept;
    version?: string;
  }[];
  version?: {
    type?: FHIRCodeableConcept;
    component?: FHIRIdentifier;
    value: string;
  }[];
  property?: {
    type: FHIRCodeableConcept;
    valueQuantity?: FHIRQuantity[];
    valueCode?: FHIRCodeableConcept[];
  }[];
  patient?: FHIRReference;
  owner?: FHIRReference;
  contact?: FHIRContactPoint[];
  location?: FHIRReference;
  url?: string;
  note?: FHIRAnnotation[];
  safety?: FHIRCodeableConcept[];
  parent?: FHIRReference;
}

// =============================================================================
// FHIR Bundle Resource
// =============================================================================

export interface FHIRBundle extends FHIRResource {
  resourceType: 'Bundle';
  identifier?: FHIRIdentifier;
  type: 'document' | 'message' | 'transaction' | 'transaction-response' | 'batch' | 'batch-response' | 'history' | 'searchset' | 'collection';
  timestamp?: string;
  total?: number;
  link?: {
    relation: string;
    url: string;
  }[];
  entry?: {
    link?: { relation: string; url: string }[];
    fullUrl?: string;
    resource?: FHIRResource;
    search?: {
      mode?: 'match' | 'include' | 'outcome';
      score?: number;
    };
    request?: {
      method: 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
      url: string;
      ifNoneMatch?: string;
      ifModifiedSince?: string;
      ifMatch?: string;
      ifNoneExist?: string;
    };
    response?: {
      status: string;
      location?: string;
      etag?: string;
      lastModified?: string;
      outcome?: FHIRResource;
    };
  }[];
}

// =============================================================================
// FHIR Service Class
// =============================================================================

export class FHIRService {
  
  private baseUrl: string;

  constructor(baseUrl: string = 'https://api.perfex.io/fhir') {
    this.baseUrl = baseUrl;
  }

  // =========================================================================
  // Patient Conversion
  // =========================================================================

  /**
   * Convert internal patient to FHIR Patient
   */
  toFHIRPatient(patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    mrn?: string;
    ssn?: string;
    emergencyContact?: { name: string; phone: string; relationship: string };
  }): FHIRPatient {
    const fhirPatient: FHIRPatient = {
      resourceType: 'Patient',
      id: patient.id,
      meta: {
        lastUpdated: new Date().toISOString(),
        profile: ['http://hl7.org/fhir/StructureDefinition/Patient']
      },
      identifier: [],
      active: true,
      name: [{
        use: 'official',
        family: patient.lastName,
        given: [patient.firstName]
      }],
      gender: this.mapGender(patient.gender),
      birthDate: patient.dateOfBirth.toISOString().split('T')[0],
      telecom: [],
      address: []
    };

    // Add identifiers
    if (patient.mrn) {
      fhirPatient.identifier!.push({
        use: 'usual',
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'MR',
            display: 'Medical Record Number'
          }]
        },
        system: `${this.baseUrl}/patient-id`,
        value: patient.mrn
      });
    }

    if (patient.ssn) {
      fhirPatient.identifier!.push({
        use: 'official',
        type: {
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
            code: 'SS',
            display: 'Social Security Number'
          }]
        },
        system: 'http://hl7.org/fhir/sid/fr-nir',
        value: patient.ssn
      });
    }

    // Add telecom
    if (patient.email) {
      fhirPatient.telecom!.push({
        system: 'email',
        value: patient.email,
        use: 'home'
      });
    }

    if (patient.phone) {
      fhirPatient.telecom!.push({
        system: 'phone',
        value: patient.phone,
        use: 'mobile'
      });
    }

    // Add address
    if (patient.address || patient.city) {
      fhirPatient.address!.push({
        use: 'home',
        type: 'physical',
        line: patient.address ? [patient.address] : undefined,
        city: patient.city,
        postalCode: patient.postalCode,
        country: patient.country || 'FR'
      });
    }

    // Add emergency contact
    if (patient.emergencyContact) {
      fhirPatient.contact = [{
        relationship: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v2-0131',
            code: 'C',
            display: 'Emergency Contact'
          }],
          text: patient.emergencyContact.relationship
        }],
        name: {
          text: patient.emergencyContact.name
        },
        telecom: [{
          system: 'phone',
          value: patient.emergencyContact.phone
        }]
      }];
    }

    return fhirPatient;
  }

  /**
   * Convert FHIR Patient to internal patient
   */
  fromFHIRPatient(fhirPatient: FHIRPatient): {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    mrn?: string;
    ssn?: string;
  } {
    const name = fhirPatient.name?.[0];
    const address = fhirPatient.address?.[0];

    return {
      firstName: name?.given?.[0] || '',
      lastName: name?.family || '',
      dateOfBirth: fhirPatient.birthDate ? new Date(fhirPatient.birthDate) : new Date(),
      gender: fhirPatient.gender || 'unknown',
      email: fhirPatient.telecom?.find(t => t.system === 'email')?.value,
      phone: fhirPatient.telecom?.find(t => t.system === 'phone')?.value,
      address: address?.line?.[0],
      city: address?.city,
      postalCode: address?.postalCode,
      country: address?.country,
      mrn: fhirPatient.identifier?.find(i => i.type?.coding?.[0]?.code === 'MR')?.value,
      ssn: fhirPatient.identifier?.find(i => i.type?.coding?.[0]?.code === 'SS')?.value
    };
  }

  // =========================================================================
  // Observation Conversion
  // =========================================================================

  /**
   * Convert lab result to FHIR Observation
   */
  toFHIRObservation(labResult: {
    id: string;
    patientId: string;
    testCode: string;
    testName: string;
    value: number | string;
    unit?: string;
    referenceRangeLow?: number;
    referenceRangeHigh?: number;
    status: string;
    collectedAt: Date;
    resultedAt: Date;
    interpretation?: string;
    category?: string;
  }): FHIRObservation {
    const observation: FHIRObservation = {
      resourceType: 'Observation',
      id: labResult.id,
      meta: {
        lastUpdated: new Date().toISOString(),
        profile: ['http://hl7.org/fhir/StructureDefinition/Observation']
      },
      status: this.mapObservationStatus(labResult.status),
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'laboratory',
          display: 'Laboratory'
        }]
      }],
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: labResult.testCode,
          display: labResult.testName
        }],
        text: labResult.testName
      },
      subject: {
        reference: `Patient/${labResult.patientId}`
      },
      effectiveDateTime: labResult.collectedAt.toISOString(),
      issued: labResult.resultedAt.toISOString()
    };

    // Add value
    if (typeof labResult.value === 'number') {
      observation.valueQuantity = {
        value: labResult.value,
        unit: labResult.unit,
        system: 'http://unitsofmeasure.org',
        code: labResult.unit
      };
    } else {
      observation.valueString = labResult.value;
    }

    // Add reference range
    if (labResult.referenceRangeLow !== undefined || labResult.referenceRangeHigh !== undefined) {
      observation.referenceRange = [{
        low: labResult.referenceRangeLow !== undefined ? {
          value: labResult.referenceRangeLow,
          unit: labResult.unit,
          system: 'http://unitsofmeasure.org'
        } : undefined,
        high: labResult.referenceRangeHigh !== undefined ? {
          value: labResult.referenceRangeHigh,
          unit: labResult.unit,
          system: 'http://unitsofmeasure.org'
        } : undefined
      }];
    }

    // Add interpretation
    if (labResult.interpretation) {
      observation.interpretation = [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
          code: this.mapInterpretation(labResult.interpretation),
          display: labResult.interpretation
        }]
      }];
    }

    return observation;
  }

  // =========================================================================
  // Condition Conversion
  // =========================================================================

  /**
   * Convert diagnosis to FHIR Condition
   */
  toFHIRCondition(condition: {
    id: string;
    patientId: string;
    code: string;
    codeSystem: string;
    name: string;
    clinicalStatus: string;
    severity?: string;
    onsetDate?: Date;
    abatementDate?: Date;
    recordedDate: Date;
    recordedBy?: string;
    notes?: string;
  }): FHIRCondition {
    return {
      resourceType: 'Condition',
      id: condition.id,
      meta: {
        lastUpdated: new Date().toISOString()
      },
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: condition.clinicalStatus,
          display: this.getConditionStatusDisplay(condition.clinicalStatus)
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: 'confirmed',
          display: 'Confirmed'
        }]
      },
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: 'problem-list-item',
          display: 'Problem List Item'
        }]
      }],
      severity: condition.severity ? {
        coding: [{
          system: 'http://snomed.info/sct',
          code: this.mapSeverityCode(condition.severity),
          display: condition.severity
        }]
      } : undefined,
      code: {
        coding: [{
          system: condition.codeSystem === 'ICD10' ? 'http://hl7.org/fhir/sid/icd-10' : 'http://snomed.info/sct',
          code: condition.code,
          display: condition.name
        }],
        text: condition.name
      },
      subject: {
        reference: `Patient/${condition.patientId}`
      },
      onsetDateTime: condition.onsetDate?.toISOString(),
      abatementDateTime: condition.abatementDate?.toISOString(),
      recordedDate: condition.recordedDate.toISOString(),
      recorder: condition.recordedBy ? {
        display: condition.recordedBy
      } : undefined,
      note: condition.notes ? [{
        text: condition.notes
      }] : undefined
    };
  }

  // =========================================================================
  // Procedure Conversion
  // =========================================================================

  /**
   * Convert procedure to FHIR Procedure
   */
  toFHIRProcedure(procedure: {
    id: string;
    patientId: string;
    code: string;
    name: string;
    status: string;
    performedDate: Date;
    performer?: string;
    location?: string;
    outcome?: string;
    complications?: string[];
    notes?: string;
    devices?: { id: string; name: string }[];
  }): FHIRProcedure {
    const fhirProcedure: FHIRProcedure = {
      resourceType: 'Procedure',
      id: procedure.id,
      meta: {
        lastUpdated: new Date().toISOString()
      },
      status: this.mapProcedureStatus(procedure.status),
      code: {
        coding: [{
          system: 'http://snomed.info/sct',
          code: procedure.code,
          display: procedure.name
        }],
        text: procedure.name
      },
      subject: {
        reference: `Patient/${procedure.patientId}`
      },
      performedDateTime: procedure.performedDate.toISOString()
    };

    if (procedure.performer) {
      fhirProcedure.performer = [{
        actor: {
          display: procedure.performer
        }
      }];
    }

    if (procedure.location) {
      fhirProcedure.location = {
        display: procedure.location
      };
    }

    if (procedure.outcome) {
      fhirProcedure.outcome = {
        text: procedure.outcome
      };
    }

    if (procedure.complications && procedure.complications.length > 0) {
      fhirProcedure.complication = procedure.complications.map(c => ({
        text: c
      }));
    }

    if (procedure.notes) {
      fhirProcedure.note = [{
        text: procedure.notes
      }];
    }

    if (procedure.devices && procedure.devices.length > 0) {
      fhirProcedure.focalDevice = procedure.devices.map(d => ({
        manipulated: {
          reference: `Device/${d.id}`,
          display: d.name
        }
      }));
    }

    return fhirProcedure;
  }

  // =========================================================================
  // MedicationStatement Conversion
  // =========================================================================

  /**
   * Convert medication to FHIR MedicationStatement
   */
  toFHIRMedicationStatement(medication: {
    id: string;
    patientId: string;
    name: string;
    code?: string;
    dosage: string;
    frequency: string;
    route: string;
    startDate: Date;
    endDate?: Date;
    status: string;
    prescribedBy?: string;
    instructions?: string;
  }): FHIRMedicationStatement {
    return {
      resourceType: 'MedicationStatement',
      id: medication.id,
      meta: {
        lastUpdated: new Date().toISOString()
      },
      status: this.mapMedicationStatus(medication.status),
      medicationCodeableConcept: {
        coding: medication.code ? [{
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          code: medication.code,
          display: medication.name
        }] : undefined,
        text: medication.name
      },
      subject: {
        reference: `Patient/${medication.patientId}`
      },
      effectivePeriod: {
        start: medication.startDate.toISOString(),
        end: medication.endDate?.toISOString()
      },
      informationSource: medication.prescribedBy ? {
        display: medication.prescribedBy
      } : undefined,
      dosage: [{
        text: `${medication.dosage} ${medication.frequency}`,
        route: {
          coding: [{
            system: 'http://snomed.info/sct',
            code: this.mapRouteCode(medication.route),
            display: medication.route
          }]
        },
        doseAndRate: [{
          doseQuantity: {
            value: parseFloat(medication.dosage) || undefined,
            unit: medication.dosage.replace(/[\d.]/g, '').trim() || undefined
          }
        }]
      }],
      note: medication.instructions ? [{
        text: medication.instructions
      }] : undefined
    };
  }

  // =========================================================================
  // Bundle Creation
  // =========================================================================

  /**
   * Create a FHIR Bundle for patient export
   */
  createPatientBundle(
    patient: FHIRPatient,
    observations: FHIRObservation[],
    conditions: FHIRCondition[],
    procedures: FHIRProcedure[],
    medications: FHIRMedicationStatement[]
  ): FHIRBundle {
    const entries: FHIRBundle['entry'] = [];

    // Add patient
    entries.push({
      fullUrl: `${this.baseUrl}/Patient/${patient.id}`,
      resource: patient
    });

    // Add observations
    for (const obs of observations) {
      entries.push({
        fullUrl: `${this.baseUrl}/Observation/${obs.id}`,
        resource: obs
      });
    }

    // Add conditions
    for (const cond of conditions) {
      entries.push({
        fullUrl: `${this.baseUrl}/Condition/${cond.id}`,
        resource: cond
      });
    }

    // Add procedures
    for (const proc of procedures) {
      entries.push({
        fullUrl: `${this.baseUrl}/Procedure/${proc.id}`,
        resource: proc
      });
    }

    // Add medications
    for (const med of medications) {
      entries.push({
        fullUrl: `${this.baseUrl}/MedicationStatement/${med.id}`,
        resource: med
      });
    }

    return {
      resourceType: 'Bundle',
      id: `bundle-${Date.now()}`,
      meta: {
        lastUpdated: new Date().toISOString()
      },
      type: 'collection',
      timestamp: new Date().toISOString(),
      total: entries.length,
      entry: entries
    };
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  private mapGender(gender: string): 'male' | 'female' | 'other' | 'unknown' {
    const genderMap: Record<string, 'male' | 'female' | 'other' | 'unknown'> = {
      'male': 'male',
      'm': 'male',
      'homme': 'male',
      'female': 'female',
      'f': 'female',
      'femme': 'female',
      'other': 'other',
      'autre': 'other'
    };
    return genderMap[gender.toLowerCase()] || 'unknown';
  }

  private mapObservationStatus(status: string): FHIRObservation['status'] {
    const statusMap: Record<string, FHIRObservation['status']> = {
      'final': 'final',
      'preliminary': 'preliminary',
      'registered': 'registered',
      'amended': 'amended',
      'corrected': 'corrected',
      'cancelled': 'cancelled',
      'pending': 'registered'
    };
    return statusMap[status.toLowerCase()] || 'final';
  }

  private mapInterpretation(interpretation: string): string {
    const interpMap: Record<string, string> = {
      'normal': 'N',
      'low': 'L',
      'high': 'H',
      'critical': 'A',
      'critical_low': 'LL',
      'critical_high': 'HH'
    };
    return interpMap[interpretation.toLowerCase()] || 'N';
  }

  private getConditionStatusDisplay(status: string): string {
    const displayMap: Record<string, string> = {
      'active': 'Active',
      'recurrence': 'Recurrence',
      'relapse': 'Relapse',
      'inactive': 'Inactive',
      'remission': 'Remission',
      'resolved': 'Resolved'
    };
    return displayMap[status] || status;
  }

  private mapSeverityCode(severity: string): string {
    const severityMap: Record<string, string> = {
      'mild': '255604002',
      'moderate': '6736007',
      'severe': '24484000'
    };
    return severityMap[severity.toLowerCase()] || '6736007';
  }

  private mapProcedureStatus(status: string): FHIRProcedure['status'] {
    const statusMap: Record<string, FHIRProcedure['status']> = {
      'completed': 'completed',
      'in_progress': 'in-progress',
      'scheduled': 'preparation',
      'cancelled': 'stopped',
      'not_done': 'not-done'
    };
    return statusMap[status.toLowerCase()] || 'completed';
  }

  private mapMedicationStatus(status: string): FHIRMedicationStatement['status'] {
    const statusMap: Record<string, FHIRMedicationStatement['status']> = {
      'active': 'active',
      'completed': 'completed',
      'stopped': 'stopped',
      'on_hold': 'on-hold',
      'intended': 'intended'
    };
    return statusMap[status.toLowerCase()] || 'active';
  }

  private mapRouteCode(route: string): string {
    const routeMap: Record<string, string> = {
      'oral': '26643006',
      'po': '26643006',
      'iv': '47625008',
      'intravenous': '47625008',
      'sc': '34206005',
      'subcutaneous': '34206005',
      'im': '78421000',
      'intramuscular': '78421000',
      'topical': '6064005',
      'inhalation': '447694001',
      'ophthalmic': '54485002',
      'rectal': '37161004'
    };
    return routeMap[route.toLowerCase()] || '26643006';
  }
}
