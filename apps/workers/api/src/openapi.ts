/**
 * OpenAPI/Swagger Documentation
 * API documentation for Perfex Healthcare Platform
 */

import { Hono } from 'hono';
import type { Env } from './types';

const openapi = new Hono<{ Bindings: Env }>();

// OpenAPI 3.0 Specification
const spec = {
  openapi: '3.0.3',
  info: {
    title: 'Perfex Healthcare API',
    description: `
## Perfex Healthcare Platform API

Complete REST API for managing healthcare operations across multiple modules:

### Healthcare Modules
- **Dialysis (Dialyse)**: Complete dialysis center management including patients, sessions, machines, protocols
- **Cardiology**: Patient management, consultations, ECG, echo, risk scores, interventions
- **Ophthalmology**: Patient management, consultations, IOL calculations, visual fields, OCT

### Core Features
- **Authentication**: JWT-based authentication with role-based access control
- **Multi-tenancy**: Organization-based data isolation
- **Audit Logging**: Complete audit trail for all operations
- **Analytics**: Dashboard and reporting endpoints
- **Integrations**: SMS (Twilio), FHIR R4, Lab systems (HL7)

### Clinical Calculators
- Dialysis: Kt/V, URR, eGFR, spKt/V
- Cardiology: ASCVD, CAC, HEART, CHA2DS2-VASc, HAS-BLED, GRACE
- Ophthalmology: IOL power (SRK/T, Holladay, Haigis, Barrett)
    `,
    version: '1.0.0',
    contact: {
      name: 'Perfex Healthcare',
      email: 'support@perfex.io',
    },
  },
  servers: [
    {
      url: 'https://perfex-api-staging.yassine-techini.workers.dev/api/v1',
      description: 'Staging Server',
    },
    {
      url: 'http://localhost:8787/api/v1',
      description: 'Local Development',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication and authorization' },
    { name: 'Dialyse - Patients', description: 'Dialysis patient management' },
    { name: 'Dialyse - Sessions', description: 'Dialysis session management' },
    { name: 'Dialyse - Machines', description: 'Dialysis machine management' },
    { name: 'Dialyse - Protocols', description: 'Dialysis protocol management' },
    { name: 'Dialyse - Staff', description: 'Dialysis staff management' },
    { name: 'Dialyse - Alerts', description: 'Clinical alerts management' },
    { name: 'Cardiology - Patients', description: 'Cardiology patient management' },
    { name: 'Cardiology - Consultations', description: 'Cardiology consultations' },
    { name: 'Cardiology - Risk Scores', description: 'Cardiovascular risk calculations' },
    { name: 'Ophthalmology - Patients', description: 'Ophthalmology patient management' },
    { name: 'Ophthalmology - Consultations', description: 'Ophthalmology consultations' },
    { name: 'Ophthalmology - IOL', description: 'IOL power calculations' },
    { name: 'Calculators', description: 'Clinical calculation endpoints' },
    { name: 'Analytics', description: 'Analytics and reporting' },
    { name: 'Integrations', description: 'External system integrations' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /auth/login',
      },
    },
    schemas: {
      // Common schemas
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Invalid input data' },
            },
          },
        },
      },
      Pagination: {
        type: 'object',
        properties: {
          limit: { type: 'integer', example: 20 },
          offset: { type: 'integer', example: 0 },
          total: { type: 'integer', example: 100 },
          hasMore: { type: 'boolean', example: true },
        },
      },
      // Authentication
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'demo@perfex.io' },
          password: { type: 'string', format: 'password', example: 'demo123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
      },
      // Dialysis Patient
      DialysePatient: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string', example: 'Jean' },
          lastName: { type: 'string', example: 'Dupont' },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['male', 'female'] },
          bloodType: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
          primaryDiagnosis: { type: 'string', example: 'Chronic Kidney Disease Stage 5' },
          dialysisStartDate: { type: 'string', format: 'date' },
          accessType: { type: 'string', enum: ['fistula', 'graft', 'catheter'] },
          status: { type: 'string', enum: ['active', 'inactive', 'transferred', 'deceased'] },
          dryWeight: { type: 'number', example: 70.5 },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      DialysePatientCreate: {
        type: 'object',
        required: ['firstName', 'lastName', 'dateOfBirth', 'gender'],
        properties: {
          firstName: { type: 'string', example: 'Jean' },
          lastName: { type: 'string', example: 'Dupont' },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['male', 'female'] },
          bloodType: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
          primaryDiagnosis: { type: 'string' },
          accessType: { type: 'string', enum: ['fistula', 'graft', 'catheter'] },
          dryWeight: { type: 'number' },
        },
      },
      // Dialysis Session
      DialyseSession: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          patientId: { type: 'string', format: 'uuid' },
          machineId: { type: 'string', format: 'uuid' },
          sessionDate: { type: 'string', format: 'date' },
          startTime: { type: 'string', format: 'time' },
          endTime: { type: 'string', format: 'time' },
          preWeight: { type: 'number', example: 72.5 },
          postWeight: { type: 'number', example: 70.0 },
          ufGoal: { type: 'number', example: 2500 },
          ufAchieved: { type: 'number', example: 2400 },
          preBUN: { type: 'number', example: 80 },
          postBUN: { type: 'number', example: 25 },
          ktv: { type: 'number', example: 1.4 },
          status: { type: 'string', enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] },
        },
      },
      // Cardiology Patient
      CardiologyPatient: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['male', 'female'] },
          primaryDiagnosis: { type: 'string' },
          riskFactors: {
            type: 'object',
            properties: {
              hypertension: { type: 'boolean' },
              diabetes: { type: 'boolean' },
              smoking: { type: 'boolean' },
              dyslipidemia: { type: 'boolean' },
              familyHistory: { type: 'boolean' },
            },
          },
          medications: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['active', 'inactive'] },
        },
      },
      // Cardiology Risk Score
      ASCVDInput: {
        type: 'object',
        required: ['age', 'sex', 'totalCholesterol', 'hdlCholesterol', 'systolicBP'],
        properties: {
          age: { type: 'integer', minimum: 40, maximum: 79, example: 55 },
          sex: { type: 'string', enum: ['male', 'female'] },
          race: { type: 'string', enum: ['white', 'african_american', 'other'] },
          totalCholesterol: { type: 'number', example: 200 },
          hdlCholesterol: { type: 'number', example: 50 },
          systolicBP: { type: 'integer', example: 140 },
          onBPMedication: { type: 'boolean', default: false },
          diabetic: { type: 'boolean', default: false },
          smoker: { type: 'boolean', default: false },
        },
      },
      ASCVDResult: {
        type: 'object',
        properties: {
          tenYearRisk: { type: 'number', example: 12.5 },
          category: { type: 'string', enum: ['low', 'borderline', 'intermediate', 'high'] },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
      },
      // Ophthalmology Patient
      OphthalmologyPatient: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['male', 'female'] },
          primaryDiagnosis: { type: 'string' },
          ocularHistory: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
        },
      },
      // IOL Calculation
      IOLInput: {
        type: 'object',
        required: ['axialLength', 'k1', 'k2'],
        properties: {
          axialLength: { type: 'number', example: 23.5, description: 'Axial length in mm' },
          k1: { type: 'number', example: 43.5, description: 'K1 reading in diopters' },
          k2: { type: 'number', example: 44.0, description: 'K2 reading in diopters' },
          acd: { type: 'number', example: 3.2, description: 'Anterior chamber depth in mm' },
          lensThickness: { type: 'number', example: 4.5, description: 'Lens thickness in mm' },
          wtw: { type: 'number', example: 11.7, description: 'White-to-white in mm' },
          targetRefraction: { type: 'number', example: -0.25 },
          iolModel: { type: 'string', example: 'SA60AT' },
        },
      },
      IOLResult: {
        type: 'object',
        properties: {
          recommendedPower: { type: 'number', example: 21.0 },
          expectedRefraction: { type: 'number', example: -0.15 },
          formula: { type: 'string', example: 'Barrett Universal II' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          powerOptions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                power: { type: 'number' },
                expectedRefraction: { type: 'number' },
              },
            },
          },
          warnings: { type: 'array', items: { type: 'string' } },
        },
      },
      // Kt/V Calculation
      KtVInput: {
        type: 'object',
        required: ['preDialysisBUN', 'postDialysisBUN', 'sessionDuration', 'ufVolume', 'postWeight'],
        properties: {
          preDialysisBUN: { type: 'number', example: 80, description: 'Pre-dialysis BUN mg/dL' },
          postDialysisBUN: { type: 'number', example: 25, description: 'Post-dialysis BUN mg/dL' },
          sessionDuration: { type: 'number', example: 240, description: 'Session duration in minutes' },
          ufVolume: { type: 'number', example: 2.5, description: 'UF volume in liters' },
          postWeight: { type: 'number', example: 70, description: 'Post-dialysis weight in kg' },
        },
      },
      KtVResult: {
        type: 'object',
        properties: {
          ktv: { type: 'number', example: 1.42 },
          urr: { type: 'number', example: 68.75 },
          adequacy: { type: 'string', enum: ['adequate', 'borderline', 'inadequate'] },
          recommendations: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
            },
          },
        },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
            },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              success: false,
              error: { code: 'NOT_FOUND', message: 'Resource not found' },
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // Authentication
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        description: 'Authenticate user and receive JWT token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful login',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user',
        description: 'Get the authenticated user profile',
        responses: {
          '200': {
            description: 'User profile',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        role: { type: 'string' },
                        permissions: { type: 'array', items: { type: 'string' } },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    // Dialyse Patients
    '/dialyse/patients': {
      get: {
        tags: ['Dialyse - Patients'],
        summary: 'List dialysis patients',
        description: 'Get paginated list of dialysis patients',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'inactive'] } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of patients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DialysePatient' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Dialyse - Patients'],
        summary: 'Create dialysis patient',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DialysePatientCreate' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Patient created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/DialysePatient' },
                  },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/dialyse/patients/{id}': {
      get: {
        tags: ['Dialyse - Patients'],
        summary: 'Get dialysis patient',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Patient details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/DialysePatient' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Dialyse - Patients'],
        summary: 'Update dialysis patient',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DialysePatientCreate' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Patient updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/DialysePatient' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Dialyse - Patients'],
        summary: 'Delete dialysis patient',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': {
            description: 'Patient deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
          '404': { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    // Dialyse Sessions
    '/dialyse/sessions': {
      get: {
        tags: ['Dialyse - Sessions'],
        summary: 'List dialysis sessions',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'patientId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': {
            description: 'List of sessions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DialyseSession' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Calculators
    '/calculators/dialysis/ktv': {
      post: {
        tags: ['Calculators'],
        summary: 'Calculate Kt/V',
        description: 'Calculate dialysis adequacy using Kt/V formula',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/KtVInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Kt/V calculation result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/KtVResult' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/calculators/cardiology/ascvd': {
      post: {
        tags: ['Cardiology - Risk Scores'],
        summary: 'Calculate ASCVD risk',
        description: 'Calculate 10-year atherosclerotic cardiovascular disease risk',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ASCVDInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'ASCVD risk result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/ASCVDResult' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/calculators/ophthalmology/iol': {
      post: {
        tags: ['Ophthalmology - IOL'],
        summary: 'Calculate IOL power',
        description: 'Calculate intraocular lens power using multiple formulas',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/IOLInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'IOL calculation result',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/IOLResult' },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Cardiology Patients
    '/cardiology/patients': {
      get: {
        tags: ['Cardiology - Patients'],
        summary: 'List cardiology patients',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of patients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/CardiologyPatient' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Ophthalmology Patients
    '/ophthalmology/patients': {
      get: {
        tags: ['Ophthalmology - Patients'],
        summary: 'List ophthalmology patients',
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': {
            description: 'List of patients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/OphthalmologyPatient' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Analytics
    '/healthcare/analytics/dialysis/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Get dialysis dashboard analytics',
        parameters: [
          { name: 'period', in: 'query', schema: { type: 'string', enum: ['day', 'week', 'month', 'quarter', 'year'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          '200': {
            description: 'Dashboard analytics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        kpis: { type: 'object' },
                        trends: { type: 'object' },
                        alerts: { type: 'array' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/healthcare/analytics/executive/dashboard': {
      get: {
        tags: ['Analytics'],
        summary: 'Get executive dashboard',
        description: 'Summary across all healthcare modules',
        responses: {
          '200': {
            description: 'Executive dashboard',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        modules: { type: 'object' },
                        totalPatients: { type: 'integer' },
                        timestamp: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    // Integrations
    '/healthcare/integrations/sms/send': {
      post: {
        tags: ['Integrations'],
        summary: 'Send SMS',
        description: 'Send SMS notification via Twilio',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['to', 'body'],
                properties: {
                  to: { type: 'string', example: '+33612345678' },
                  body: { type: 'string', example: 'Your appointment is tomorrow at 10:00' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'SMS sent',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        messageId: { type: 'string' },
                        provider: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/healthcare/integrations/fhir/capability': {
      get: {
        tags: ['Integrations'],
        summary: 'Get FHIR capability statement',
        description: 'Returns the FHIR R4 capability statement',
        security: [],
        responses: {
          '200': {
            description: 'FHIR capability statement',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    resourceType: { type: 'string', example: 'CapabilityStatement' },
                    fhirVersion: { type: 'string', example: '4.0.1' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/healthcare/integrations/status': {
      get: {
        tags: ['Integrations'],
        summary: 'Get integration status',
        description: 'Check status of all external integrations',
        responses: {
          '200': {
            description: 'Integration status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        sms: {
                          type: 'object',
                          properties: {
                            configured: { type: 'boolean' },
                            provider: { type: 'string' },
                          },
                        },
                        fhir: {
                          type: 'object',
                          properties: {
                            configured: { type: 'boolean' },
                            version: { type: 'string' },
                          },
                        },
                        lab: {
                          type: 'object',
                          properties: {
                            configured: { type: 'boolean' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

// Serve OpenAPI spec
openapi.get('/openapi.json', (c) => {
  return c.json(spec);
});

// Serve Swagger UI HTML
openapi.get('/docs', (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Perfex Healthcare API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
  <style>
    body { margin: 0; padding: 0; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        url: '/api/v1/openapi.json',
        dom_id: '#swagger-ui',
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout",
        deepLinking: true,
        showExtensions: true,
        showCommonExtensions: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
        filter: true,
        validatorUrl: null
      });
    };
  </script>
</body>
</html>
  `;
  return c.html(html);
});

// ReDoc alternative
openapi.get('/redoc', (c) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Perfex Healthcare API - ReDoc</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <redoc spec-url='/api/v1/openapi.json'></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>
  `;
  return c.html(html);
});

export { openapi, spec };
export default openapi;
