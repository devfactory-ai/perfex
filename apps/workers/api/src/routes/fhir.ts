/**
 * FHIR R4 Routes
 * RESTful API endpoints for FHIR R4 interoperability
 */

import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { requirePermissions } from '../middleware/permissions';
import { FHIRService, type FHIRPatient, type FHIRBundle } from '../services/fhir/fhir.service';

const fhirRoutes = new Hono<{ Bindings: Env }>();
const fhirService = new FHIRService();

// Apply authentication
fhirRoutes.use('*', authMiddleware);

// =============================================================================
// FHIR Metadata (CapabilityStatement)
// =============================================================================

/**
 * GET /metadata - FHIR CapabilityStatement
 */
fhirRoutes.get('/metadata', async (c) => {
  return c.json({
    resourceType: 'CapabilityStatement',
    id: 'perfex-fhir-server',
    url: 'https://api.perfex.io/fhir/metadata',
    version: '1.0.0',
    name: 'PerfexFHIRServer',
    title: 'Perfex Healthcare FHIR R4 Server',
    status: 'active',
    experimental: false,
    date: new Date().toISOString(),
    publisher: 'Perfex Healthcare',
    description: 'FHIR R4 API for Perfex Healthcare Platform',
    kind: 'instance',
    fhirVersion: '4.0.1',
    format: ['json'],
    rest: [{
      mode: 'server',
      documentation: 'RESTful FHIR server supporting Patient, Observation, Condition, Procedure, MedicationStatement, and DiagnosticReport resources',
      security: {
        cors: true,
        service: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/restful-security-service',
            code: 'OAuth',
            display: 'OAuth'
          }]
        }],
        description: 'OAuth2 authentication required'
      },
      resource: [
        {
          type: 'Patient',
          profile: 'http://hl7.org/fhir/StructureDefinition/Patient',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
            { code: 'create' },
            { code: 'update' }
          ],
          searchParam: [
            { name: 'identifier', type: 'token' },
            { name: 'name', type: 'string' },
            { name: 'birthdate', type: 'date' },
            { name: 'gender', type: 'token' }
          ]
        },
        {
          type: 'Observation',
          profile: 'http://hl7.org/fhir/StructureDefinition/Observation',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
            { code: 'create' }
          ],
          searchParam: [
            { name: 'patient', type: 'reference' },
            { name: 'category', type: 'token' },
            { name: 'code', type: 'token' },
            { name: 'date', type: 'date' }
          ]
        },
        {
          type: 'Condition',
          profile: 'http://hl7.org/fhir/StructureDefinition/Condition',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
            { code: 'create' }
          ],
          searchParam: [
            { name: 'patient', type: 'reference' },
            { name: 'clinical-status', type: 'token' },
            { name: 'code', type: 'token' }
          ]
        },
        {
          type: 'Procedure',
          profile: 'http://hl7.org/fhir/StructureDefinition/Procedure',
          interaction: [
            { code: 'read' },
            { code: 'search-type' },
            { code: 'create' }
          ],
          searchParam: [
            { name: 'patient', type: 'reference' },
            { name: 'date', type: 'date' },
            { name: 'status', type: 'token' }
          ]
        },
        {
          type: 'MedicationStatement',
          profile: 'http://hl7.org/fhir/StructureDefinition/MedicationStatement',
          interaction: [
            { code: 'read' },
            { code: 'search-type' }
          ],
          searchParam: [
            { name: 'patient', type: 'reference' },
            { name: 'status', type: 'token' }
          ]
        },
        {
          type: 'DiagnosticReport',
          profile: 'http://hl7.org/fhir/StructureDefinition/DiagnosticReport',
          interaction: [
            { code: 'read' },
            { code: 'search-type' }
          ],
          searchParam: [
            { name: 'patient', type: 'reference' },
            { name: 'category', type: 'token' },
            { name: 'date', type: 'date' }
          ]
        },
        {
          type: 'Bundle',
          profile: 'http://hl7.org/fhir/StructureDefinition/Bundle',
          interaction: [
            { code: 'read' }
          ]
        }
      ],
      operation: [
        {
          name: '$export',
          definition: 'http://hl7.org/fhir/uv/bulkdata/OperationDefinition/patient-export'
        },
        {
          name: '$everything',
          definition: 'http://hl7.org/fhir/OperationDefinition/Patient-everything'
        }
      ]
    }]
  });
});

// =============================================================================
// Patient Resource
// =============================================================================

/**
 * GET /Patient/:id - Read Patient
 */
fhirRoutes.get(
  '/Patient/:id',
  requirePermissions('healthcare.read'),
  async (c) => {
    const patientId = c.req.param('id');

    // In a real implementation, fetch from database
    // For now, return example structure
    const patient = fhirService.toFHIRPatient({
      id: patientId,
      firstName: 'Jean',
      lastName: 'Dupont',
      dateOfBirth: new Date('1970-05-15'),
      gender: 'male',
      email: 'jean.dupont@email.com',
      phone: '+33612345678',
      address: '123 Rue de la Santé',
      city: 'Paris',
      postalCode: '75014',
      country: 'FR',
      mrn: `MRN-${patientId}`
    });

    return c.json(patient);
  }
);

/**
 * GET /Patient - Search Patients
 */
fhirRoutes.get(
  '/Patient',
  requirePermissions('healthcare.read'),
  async (c) => {
    const name = c.req.query('name');
    const identifier = c.req.query('identifier');
    const birthdate = c.req.query('birthdate');
    const gender = c.req.query('gender');

    // Search logic would go here
    const bundle: FHIRBundle = {
      resourceType: 'Bundle',
      id: `search-${Date.now()}`,
      type: 'searchset',
      total: 0,
      link: [{
        relation: 'self',
        url: c.req.url
      }],
      entry: []
    };

    return c.json(bundle);
  }
);

/**
 * POST /Patient - Create Patient
 */
fhirRoutes.post(
  '/Patient',
  requirePermissions('healthcare.write'),
  async (c) => {
    const fhirPatient = await c.req.json() as FHIRPatient;

    // Validate FHIR resource
    if (fhirPatient.resourceType !== 'Patient') {
      return c.json({
        resourceType: 'OperationOutcome',
        issue: [{
          severity: 'error',
          code: 'invalid',
          details: { text: 'Resource must be of type Patient' }
        }]
      }, 400);
    }

    // Convert and save
    const internalPatient = fhirService.fromFHIRPatient(fhirPatient);

    // Would save to database here
    const savedId = `patient-${Date.now()}`;

    // Return created resource
    return c.json({
      ...fhirPatient,
      id: savedId
    }, 201);
  }
);

// =============================================================================
// Patient $everything Operation
// =============================================================================

/**
 * GET /Patient/:id/$everything - Get all patient data
 */
fhirRoutes.get(
  '/Patient/:id/\\$everything',
  requirePermissions('healthcare.read'),
  async (c) => {
    const patientId = c.req.param('id');
    const _since = c.req.query('_since');
    const _type = c.req.query('_type');

    // Create patient bundle with all related resources
    const patient = fhirService.toFHIRPatient({
      id: patientId,
      firstName: 'Patient',
      lastName: 'Example',
      dateOfBirth: new Date('1970-01-01'),
      gender: 'male'
    });

    // Example observations
    const observations = [
      fhirService.toFHIRObservation({
        id: 'obs-1',
        patientId,
        testCode: '2160-0',
        testName: 'Creatinine',
        value: 1.2,
        unit: 'mg/dL',
        referenceRangeLow: 0.7,
        referenceRangeHigh: 1.3,
        status: 'final',
        collectedAt: new Date(),
        resultedAt: new Date()
      })
    ];

    const conditions = [
      fhirService.toFHIRCondition({
        id: 'cond-1',
        patientId,
        code: 'N18.5',
        codeSystem: 'ICD10',
        name: 'Chronic kidney disease, stage 5',
        clinicalStatus: 'active',
        recordedDate: new Date()
      })
    ];

    const procedures = [
      fhirService.toFHIRProcedure({
        id: 'proc-1',
        patientId,
        code: '90935',
        name: 'Hemodialysis',
        status: 'completed',
        performedDate: new Date()
      })
    ];

    const medications = [
      fhirService.toFHIRMedicationStatement({
        id: 'med-1',
        patientId,
        name: 'Erythropoietin',
        dosage: '4000 UI',
        frequency: '3x/week',
        route: 'SC',
        startDate: new Date(),
        status: 'active'
      })
    ];

    const bundle = fhirService.createPatientBundle(
      patient,
      observations,
      conditions,
      procedures,
      medications
    );

    return c.json(bundle);
  }
);

// =============================================================================
// Observation Resource
// =============================================================================

/**
 * GET /Observation/:id - Read Observation
 */
fhirRoutes.get(
  '/Observation/:id',
  requirePermissions('healthcare.read'),
  async (c) => {
    const observationId = c.req.param('id');

    // Would fetch from database
    const observation = fhirService.toFHIRObservation({
      id: observationId,
      patientId: 'patient-1',
      testCode: '2160-0',
      testName: 'Creatinine',
      value: 1.2,
      unit: 'mg/dL',
      status: 'final',
      collectedAt: new Date(),
      resultedAt: new Date()
    });

    return c.json(observation);
  }
);

/**
 * GET /Observation - Search Observations
 */
fhirRoutes.get(
  '/Observation',
  requirePermissions('healthcare.read'),
  async (c) => {
    const patient = c.req.query('patient');
    const category = c.req.query('category');
    const code = c.req.query('code');
    const date = c.req.query('date');

    const bundle: FHIRBundle = {
      resourceType: 'Bundle',
      id: `search-${Date.now()}`,
      type: 'searchset',
      total: 0,
      entry: []
    };

    return c.json(bundle);
  }
);

// =============================================================================
// Condition Resource
// =============================================================================

/**
 * GET /Condition/:id - Read Condition
 */
fhirRoutes.get(
  '/Condition/:id',
  requirePermissions('healthcare.read'),
  async (c) => {
    const conditionId = c.req.param('id');

    const condition = fhirService.toFHIRCondition({
      id: conditionId,
      patientId: 'patient-1',
      code: 'N18.5',
      codeSystem: 'ICD10',
      name: 'Chronic kidney disease, stage 5',
      clinicalStatus: 'active',
      recordedDate: new Date()
    });

    return c.json(condition);
  }
);

/**
 * GET /Condition - Search Conditions
 */
fhirRoutes.get(
  '/Condition',
  requirePermissions('healthcare.read'),
  async (c) => {
    const patient = c.req.query('patient');
    const clinicalStatus = c.req.query('clinical-status');
    const code = c.req.query('code');

    const bundle: FHIRBundle = {
      resourceType: 'Bundle',
      id: `search-${Date.now()}`,
      type: 'searchset',
      total: 0,
      entry: []
    };

    return c.json(bundle);
  }
);

// =============================================================================
// Procedure Resource
// =============================================================================

/**
 * GET /Procedure/:id - Read Procedure
 */
fhirRoutes.get(
  '/Procedure/:id',
  requirePermissions('healthcare.read'),
  async (c) => {
    const procedureId = c.req.param('id');

    const procedure = fhirService.toFHIRProcedure({
      id: procedureId,
      patientId: 'patient-1',
      code: '90935',
      name: 'Hemodialysis procedure',
      status: 'completed',
      performedDate: new Date()
    });

    return c.json(procedure);
  }
);

/**
 * GET /Procedure - Search Procedures
 */
fhirRoutes.get(
  '/Procedure',
  requirePermissions('healthcare.read'),
  async (c) => {
    const patient = c.req.query('patient');
    const date = c.req.query('date');
    const status = c.req.query('status');

    const bundle: FHIRBundle = {
      resourceType: 'Bundle',
      id: `search-${Date.now()}`,
      type: 'searchset',
      total: 0,
      entry: []
    };

    return c.json(bundle);
  }
);

// =============================================================================
// MedicationStatement Resource
// =============================================================================

/**
 * GET /MedicationStatement/:id - Read MedicationStatement
 */
fhirRoutes.get(
  '/MedicationStatement/:id',
  requirePermissions('healthcare.read'),
  async (c) => {
    const medId = c.req.param('id');

    const medication = fhirService.toFHIRMedicationStatement({
      id: medId,
      patientId: 'patient-1',
      name: 'Erythropoietin',
      dosage: '4000',
      frequency: '3x/week',
      route: 'SC',
      startDate: new Date(),
      status: 'active'
    });

    return c.json(medication);
  }
);

/**
 * GET /MedicationStatement - Search MedicationStatements
 */
fhirRoutes.get(
  '/MedicationStatement',
  requirePermissions('healthcare.read'),
  async (c) => {
    const patient = c.req.query('patient');
    const status = c.req.query('status');

    const bundle: FHIRBundle = {
      resourceType: 'Bundle',
      id: `search-${Date.now()}`,
      type: 'searchset',
      total: 0,
      entry: []
    };

    return c.json(bundle);
  }
);

// =============================================================================
// Bulk Data Export
// =============================================================================

/**
 * GET /$export - Bulk data export (kickoff)
 */
fhirRoutes.get(
  '/\\$export',
  requirePermissions('healthcare.export'),
  async (c) => {
    const _type = c.req.query('_type');
    const _since = c.req.query('_since');

    // Return export status URL
    const exportId = `export-${Date.now()}`;

    c.header('Content-Location', `/fhir/$export-status/${exportId}`);

    return c.json({
      transactionTime: new Date().toISOString(),
      request: c.req.url,
      requiresAccessToken: true,
      output: [],
      error: []
    }, 202);
  }
);

// =============================================================================
// Error Handling
// =============================================================================

fhirRoutes.onError((err, c) => {
  return c.json({
    resourceType: 'OperationOutcome',
    issue: [{
      severity: 'error',
      code: 'exception',
      details: {
        text: err.message
      }
    }]
  }, 500);
});

export default fhirRoutes;
