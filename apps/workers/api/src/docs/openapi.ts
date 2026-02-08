/**
 * OpenAPI 3.0 Documentation for Perfex API
 * Auto-generated API documentation
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Perfex ERP API',
    version: '1.0.0',
    description: `
# Perfex ERP - Enterprise Resource Planning API

API RESTful pour le système ERP Perfex multi-tenant avec modules Healthcare.

## Fonctionnalités principales:
- **Authentication**: JWT avec access/refresh tokens
- **Multi-tenancy**: Organisation-based data isolation
- **RBAC**: Role-based access control
- **Healthcare**: Dialyse, Cardiologie, Ophtalmologie

## Authentication
Toutes les requêtes (sauf /auth/*) nécessitent un Bearer token.

\`\`\`
Authorization: Bearer <access_token>
\`\`\`
    `,
    contact: {
      name: 'Perfex Support',
      email: 'support@perfex.io',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    {
      url: 'https://perfex-api-staging.yassine-techini.workers.dev/api/v1',
      description: 'Staging Environment',
    },
    {
      url: 'https://perfex-api.yassine-techini.workers.dev/api/v1',
      description: 'Production Environment',
    },
    {
      url: 'http://localhost:8787/api/v1',
      description: 'Local Development',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User authentication and session management' },
    { name: 'Users', description: 'User management' },
    { name: 'Organizations', description: 'Multi-tenant organization management' },
    { name: 'Dialyse', description: 'Dialysis patient management module' },
    { name: 'Cardiology', description: 'Cardiology patient management module' },
    { name: 'Ophthalmology', description: 'Ophthalmology patient management module' },
    { name: 'Finance', description: 'Financial management (invoices, payments, accounts)' },
    { name: 'CRM', description: 'Customer relationship management' },
    { name: 'HR', description: 'Human resources management' },
    { name: 'Inventory', description: 'Inventory and stock management' },
    { name: 'Projects', description: 'Project management' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Access Token',
      },
    },
    schemas: {
      // Common schemas
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' },
        },
        required: ['error'],
      },
      Pagination: {
        type: 'object',
        properties: {
          limit: { type: 'integer', default: 20 },
          offset: { type: 'integer', default: 0 },
          total: { type: 'integer' },
          hasMore: { type: 'boolean' },
        },
      },
      // Auth schemas
      LoginRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
        required: ['email', 'password'],
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          expiresIn: { type: 'integer' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      RegisterRequest: {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          organizationName: { type: 'string' },
        },
        required: ['email', 'password', 'firstName', 'lastName', 'organizationName'],
      },
      // User schema
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'manager', 'user', 'viewer'] },
          active: { type: 'boolean' },
          organizationId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      // Organization schema
      Organization: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          plan: { type: 'string', enum: ['free', 'starter', 'professional', 'enterprise'] },
          active: { type: 'boolean' },
          settings: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      // Dialyse schemas
      DialysePatient: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organizationId: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['male', 'female'] },
          nationalId: { type: 'string' },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
          address: { type: 'string' },
          bloodType: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
          dryWeight: { type: 'number', description: 'Target dry weight in kg' },
          dialysisStartDate: { type: 'string', format: 'date' },
          vascularAccessType: { type: 'string', enum: ['fav', 'catheter', 'graft'] },
          hivStatus: { type: 'string', enum: ['positive', 'negative', 'unknown'] },
          hbvStatus: { type: 'string', enum: ['positive', 'negative', 'immune', 'unknown'] },
          hcvStatus: { type: 'string', enum: ['positive', 'negative', 'unknown'] },
          active: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['firstName', 'lastName', 'dateOfBirth', 'gender'],
      },
      DialyseSession: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          patientId: { type: 'string', format: 'uuid' },
          machineId: { type: 'string', format: 'uuid' },
          prescriptionId: { type: 'string', format: 'uuid' },
          sessionDate: { type: 'string', format: 'date' },
          scheduledStartTime: { type: 'string', format: 'time' },
          scheduledEndTime: { type: 'string', format: 'time' },
          actualStartTime: { type: 'string', format: 'time' },
          actualEndTime: { type: 'string', format: 'time' },
          status: { type: 'string', enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'missed'] },
          preWeight: { type: 'number', description: 'Weight before session (kg)' },
          postWeight: { type: 'number', description: 'Weight after session (kg)' },
          preBP: { type: 'string', description: 'Blood pressure before (e.g., 140/90)' },
          postBP: { type: 'string', description: 'Blood pressure after' },
          ktv: { type: 'number', description: 'Dialysis adequacy (Kt/V)' },
          ufVolume: { type: 'number', description: 'Ultrafiltration volume (ml)' },
          notes: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      DialyseMachine: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          serialNumber: { type: 'string' },
          model: { type: 'string' },
          manufacturer: { type: 'string' },
          location: { type: 'string' },
          status: { type: 'string', enum: ['available', 'in_use', 'maintenance', 'out_of_service'] },
          lastMaintenanceDate: { type: 'string', format: 'date' },
          nextMaintenanceDate: { type: 'string', format: 'date' },
        },
      },
      // Cardiology schemas
      CardiologyPatient: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organizationId: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['male', 'female'] },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
          primaryDiagnosis: { type: 'string' },
          riskLevel: { type: 'string', enum: ['low', 'moderate', 'high', 'critical'] },
          hasPacemaker: { type: 'boolean' },
          hasStent: { type: 'boolean' },
          lastEcgDate: { type: 'string', format: 'date' },
          lastEchoDate: { type: 'string', format: 'date' },
          lvef: { type: 'number', description: 'Left Ventricular Ejection Fraction (%)' },
        },
      },
      // Ophthalmology schemas
      OphthalmologyPatient: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          organizationId: { type: 'string', format: 'uuid' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          gender: { type: 'string', enum: ['male', 'female'] },
          phone: { type: 'string' },
          email: { type: 'string', format: 'email' },
          primaryCondition: { type: 'string' },
          rightEyeVision: { type: 'string' },
          leftEyeVision: { type: 'string' },
          rightEyeIOP: { type: 'number', description: 'Right eye intraocular pressure (mmHg)' },
          leftEyeIOP: { type: 'number', description: 'Left eye intraocular pressure (mmHg)' },
          hasGlaucoma: { type: 'boolean' },
          hasCataract: { type: 'boolean' },
          hasDME: { type: 'boolean' },
          lastOctDate: { type: 'string', format: 'date' },
        },
      },
      // Invoice schema
      Invoice: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          number: { type: 'string' },
          customerId: { type: 'string', format: 'uuid' },
          customerName: { type: 'string' },
          date: { type: 'string', format: 'date' },
          dueDate: { type: 'string', format: 'date' },
          status: { type: 'string', enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'] },
          subtotal: { type: 'number' },
          taxAmount: { type: 'number' },
          total: { type: 'number' },
          amountPaid: { type: 'number' },
          amountDue: { type: 'number' },
          currency: { type: 'string', default: 'TND' },
          notes: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
    parameters: {
      limitParam: {
        name: 'limit',
        in: 'query',
        schema: { type: 'integer', default: 20, maximum: 100 },
        description: 'Number of items to return',
      },
      offsetParam: {
        name: 'offset',
        in: 'query',
        schema: { type: 'integer', default: 0 },
        description: 'Number of items to skip',
      },
      idParam: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Resource ID',
      },
    },
    responses: {
      Unauthorized: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      Forbidden: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      NotFound: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // Authentication endpoints
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user and organization',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          409: {
            description: 'Email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Login with email and password',
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
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginResponse' },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' },
              },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Authentication'],
        summary: 'Refresh access token',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  refreshToken: { type: 'string' },
                },
                required: ['refreshToken'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Token refreshed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accessToken: { type: 'string' },
                    expiresIn: { type: 'integer' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout and invalidate session',
        responses: {
          200: { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current user profile',
        responses: {
          200: {
            description: 'User profile',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/User' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // Dialyse endpoints
    '/dialyse/patients': {
      get: {
        tags: ['Dialyse'],
        summary: 'List dialysis patients',
        parameters: [
          { $ref: '#/components/parameters/limitParam' },
          { $ref: '#/components/parameters/offsetParam' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name' },
          { name: 'hivStatus', in: 'query', schema: { type: 'string', enum: ['positive', 'negative', 'unknown'] } },
          { name: 'hcvStatus', in: 'query', schema: { type: 'string', enum: ['positive', 'negative', 'unknown'] } },
          { name: 'active', in: 'query', schema: { type: 'boolean' } },
        ],
        responses: {
          200: {
            description: 'List of patients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    patients: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DialysePatient' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Dialyse'],
        summary: 'Create a new dialysis patient',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DialysePatient' },
            },
          },
        },
        responses: {
          201: {
            description: 'Patient created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DialysePatient' },
              },
            },
          },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/dialyse/patients/{id}': {
      get: {
        tags: ['Dialyse'],
        summary: 'Get dialysis patient by ID',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: {
            description: 'Patient details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DialysePatient' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      put: {
        tags: ['Dialyse'],
        summary: 'Update dialysis patient',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DialysePatient' },
            },
          },
        },
        responses: {
          200: {
            description: 'Patient updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DialysePatient' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Dialyse'],
        summary: 'Delete dialysis patient',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          204: { description: 'Patient deleted' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/dialyse/patients/stats': {
      get: {
        tags: ['Dialyse'],
        summary: 'Get patient statistics',
        responses: {
          200: {
            description: 'Patient statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    total: { type: 'integer' },
                    active: { type: 'integer' },
                    hivPositive: { type: 'integer' },
                    hcvPositive: { type: 'integer' },
                    byBloodType: { type: 'object' },
                    byVascularAccess: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/dialyse/sessions': {
      get: {
        tags: ['Dialyse'],
        summary: 'List dialysis sessions',
        parameters: [
          { $ref: '#/components/parameters/limitParam' },
          { $ref: '#/components/parameters/offsetParam' },
          { name: 'patientId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'machineId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['scheduled', 'in_progress', 'completed', 'cancelled', 'missed'] } },
        ],
        responses: {
          200: {
            description: 'List of sessions',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    sessions: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DialyseSession' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Dialyse'],
        summary: 'Create a new dialysis session',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DialyseSession' },
            },
          },
        },
        responses: {
          201: {
            description: 'Session created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DialyseSession' },
              },
            },
          },
        },
      },
    },
    '/dialyse/sessions/{id}/start': {
      post: {
        tags: ['Dialyse'],
        summary: 'Start a dialysis session',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  actualStartTime: { type: 'string', format: 'time' },
                  preWeight: { type: 'number' },
                  preBP: { type: 'string' },
                  preHR: { type: 'integer' },
                },
                required: ['actualStartTime', 'preWeight'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Session started',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DialyseSession' },
              },
            },
          },
        },
      },
    },
    '/dialyse/sessions/{id}/complete': {
      post: {
        tags: ['Dialyse'],
        summary: 'Complete a dialysis session',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  actualEndTime: { type: 'string', format: 'time' },
                  postWeight: { type: 'number' },
                  postBP: { type: 'string' },
                  postHR: { type: 'integer' },
                  ktv: { type: 'number' },
                  ufVolume: { type: 'number' },
                  notes: { type: 'string' },
                },
                required: ['actualEndTime', 'postWeight'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Session completed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DialyseSession' },
              },
            },
          },
        },
      },
    },
    '/dialyse/machines': {
      get: {
        tags: ['Dialyse'],
        summary: 'List dialysis machines',
        parameters: [
          { $ref: '#/components/parameters/limitParam' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['available', 'in_use', 'maintenance', 'out_of_service'] } },
        ],
        responses: {
          200: {
            description: 'List of machines',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/DialyseMachine' },
                },
              },
            },
          },
        },
      },
    },
    '/dialyse/dashboard/stats': {
      get: {
        tags: ['Dialyse'],
        summary: 'Get dialysis dashboard statistics',
        responses: {
          200: {
            description: 'Dashboard stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalPatients: { type: 'integer' },
                    activePatients: { type: 'integer' },
                    todaySessions: { type: 'integer' },
                    activeSessions: { type: 'integer' },
                    availableMachines: { type: 'integer' },
                    pendingAlerts: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/dialyse/alerts': {
      get: {
        tags: ['Dialyse'],
        summary: 'List dialysis alerts',
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'acknowledged', 'resolved'] } },
          { name: 'severity', in: 'query', schema: { type: 'string', enum: ['info', 'warning', 'critical'] } },
        ],
        responses: {
          200: {
            description: 'List of alerts',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      type: { type: 'string' },
                      severity: { type: 'string' },
                      message: { type: 'string' },
                      patientId: { type: 'string', format: 'uuid' },
                      status: { type: 'string' },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // Cardiology endpoints
    '/cardiology/patients': {
      get: {
        tags: ['Cardiology'],
        summary: 'List cardiology patients',
        parameters: [
          { $ref: '#/components/parameters/limitParam' },
          { $ref: '#/components/parameters/offsetParam' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'riskLevel', in: 'query', schema: { type: 'string', enum: ['low', 'moderate', 'high', 'critical'] } },
        ],
        responses: {
          200: {
            description: 'List of patients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    patients: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/CardiologyPatient' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/cardiology/dashboard/stats': {
      get: {
        tags: ['Cardiology'],
        summary: 'Get cardiology dashboard statistics',
        responses: {
          200: {
            description: 'Dashboard stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalPatients: { type: 'integer' },
                    highRiskPatients: { type: 'integer' },
                    todayConsultations: { type: 'integer' },
                    pendingEcg: { type: 'integer' },
                    pendingEcho: { type: 'integer' },
                    activeAlerts: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // Ophthalmology endpoints
    '/ophthalmology/patients': {
      get: {
        tags: ['Ophthalmology'],
        summary: 'List ophthalmology patients',
        parameters: [
          { $ref: '#/components/parameters/limitParam' },
          { $ref: '#/components/parameters/offsetParam' },
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'condition', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: {
            description: 'List of patients',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    patients: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/OphthalmologyPatient' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/ophthalmology/dashboard/stats': {
      get: {
        tags: ['Ophthalmology'],
        summary: 'Get ophthalmology dashboard statistics',
        responses: {
          200: {
            description: 'Dashboard stats',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    totalPatients: { type: 'integer' },
                    glaucomaPatients: { type: 'integer' },
                    todayConsultations: { type: 'integer' },
                    pendingOct: { type: 'integer' },
                    scheduledIvt: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // Invoices
    '/invoices': {
      get: {
        tags: ['Finance'],
        summary: 'List invoices',
        parameters: [
          { $ref: '#/components/parameters/limitParam' },
          { $ref: '#/components/parameters/offsetParam' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'] } },
          { name: 'customerId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
        ],
        responses: {
          200: {
            description: 'List of invoices',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    invoices: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Invoice' },
                    },
                    pagination: { $ref: '#/components/schemas/Pagination' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Finance'],
        summary: 'Create a new invoice',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Invoice' },
            },
          },
        },
        responses: {
          201: {
            description: 'Invoice created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invoice' },
              },
            },
          },
        },
      },
    },
    '/invoices/{id}': {
      get: {
        tags: ['Finance'],
        summary: 'Get invoice by ID',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: {
            description: 'Invoice details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invoice' },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/invoices/{id}/send': {
      post: {
        tags: ['Finance'],
        summary: 'Send invoice to customer',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: {
            description: 'Invoice sent',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invoice' },
              },
            },
          },
        },
      },
    },
    '/invoices/{id}/payments': {
      post: {
        tags: ['Finance'],
        summary: 'Record payment for invoice',
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  amount: { type: 'number' },
                  method: { type: 'string', enum: ['cash', 'bank_transfer', 'check', 'card'] },
                  reference: { type: 'string' },
                  date: { type: 'string', format: 'date' },
                },
                required: ['amount', 'method'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Payment recorded',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Invoice' },
              },
            },
          },
        },
      },
    },
  },
};

export default openApiSpec;
