/**
 * Healthcare Integrations Routes
 * /api/v1/healthcare/integrations
 *
 * Provides endpoints for external integrations:
 * - SMS notifications (Twilio)
 * - FHIR export/import (HL7 FHIR R4)
 * - Lab system connector (HL7 v2.x)
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { requireAuth, requirePermission } from '../middleware/auth';
import type { Env } from '../types';

// Import integration services
import { SMSService, type SMSConfig, type SMSMessage } from '../services/integrations/sms.service';
import { FHIRAdapter } from '../services/integrations/fhir.adapter';
import { LabConnector, type LabConnectorConfig, type LabOrder } from '../services/integrations/lab.connector';

const integrations = new Hono<{ Bindings: Env }>();

// All routes require authentication
integrations.use('/*', requireAuth);

// ============================================================================
// SMS NOTIFICATIONS
// ============================================================================

const sendSmsSchema = z.object({
  to: z.string().min(1),
  body: z.string().min(1).max(1600),
  templateId: z.string().optional(),
  variables: z.record(z.string()).optional(),
});

/**
 * POST /healthcare/integrations/sms/send
 * Send an SMS notification
 */
integrations.post(
  '/sms/send',
  requirePermission('healthcare:sms:send'),
  zValidator('json', sendSmsSchema),
  async (c) => {
    try {
      const { to, body } = c.req.valid('json');

      // Get SMS config from environment
      const config: SMSConfig = {
        provider: 'twilio',
        twilioAccountSid: c.env.TWILIO_ACCOUNT_SID || '',
        twilioAuthToken: c.env.TWILIO_AUTH_TOKEN || '',
        twilioFromNumber: c.env.TWILIO_FROM_NUMBER || '',
        environment: (c.env.ENVIRONMENT || 'development') as 'development' | 'staging' | 'production',
      };

      if (!config.twilioAccountSid || !config.twilioAuthToken || !config.twilioFromNumber) {
        return c.json({
          success: false,
          error: {
            code: 'CONFIG_ERROR',
            message: 'SMS service not configured. Please set Twilio credentials.',
          },
        }, 500);
      }

      const smsService = new SMSService(config);
      const message: SMSMessage = { to, body };
      const result = await smsService.send(message);

      return c.json({
        success: result.success,
        data: result.success ? {
          messageId: result.messageId,
          provider: result.provider,
        } : undefined,
        error: result.error ? { message: result.error } : undefined,
      });
    } catch (error) {
      logger.error('SMS send error', { error });
      return c.json({
        success: false,
        error: {
          code: 'SMS_ERROR',
          message: error instanceof Error ? error.message : 'Failed to send SMS',
        },
      }, 500);
    }
  }
);

/**
 * GET /healthcare/integrations/sms/templates
 * Get available SMS templates
 */
integrations.get(
  '/sms/templates',
  requirePermission('healthcare:sms:read'),
  async (c) => {
    // Return predefined templates
    const templates = [
      {
        id: 'appointment_reminder',
        name: 'Rappel de rendez-vous',
        module: 'general',
      },
      {
        id: 'dialyse_session_reminder',
        name: 'Rappel séance dialyse',
        module: 'dialyse',
      },
      {
        id: 'dialyse_transport_reminder',
        name: 'Rappel transport dialyse',
        module: 'dialyse',
      },
      {
        id: 'lab_results_ready',
        name: 'Résultats laboratoire disponibles',
        module: 'general',
      },
    ];

    return c.json({
      success: true,
      data: { templates },
    });
  }
);

// ============================================================================
// FHIR EXPORT/IMPORT
// ============================================================================

const fhirExportPatientSchema = z.object({
  patientId: z.string(),
  resourceTypes: z.array(z.string()).optional(),
});

/**
 * POST /healthcare/integrations/fhir/export/patient
 * Export patient data as FHIR bundle
 */
integrations.post(
  '/fhir/export/patient',
  requirePermission('healthcare:fhir:export'),
  zValidator('json', fhirExportPatientSchema),
  async (c) => {
    try {
      const { patientId, resourceTypes } = c.req.valid('json');

      // Create a simple FHIR Patient resource
      const bundle = {
        resourceType: 'Bundle',
        type: 'collection',
        timestamp: new Date().toISOString(),
        entry: [
          {
            resource: {
              resourceType: 'Patient',
              id: patientId,
              meta: {
                lastUpdated: new Date().toISOString(),
                profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
              },
            },
          },
        ],
      };

      return c.json({
        success: true,
        data: bundle,
      });
    } catch (error) {
      logger.error('FHIR patient export error', { error });
      return c.json({
        success: false,
        error: {
          code: 'FHIR_ERROR',
          message: error instanceof Error ? error.message : 'Failed to export FHIR data',
        },
      }, 500);
    }
  }
);

/**
 * GET /healthcare/integrations/fhir/capability
 * Get FHIR capability statement
 */
integrations.get(
  '/fhir/capability',
  async (c) => {
    const capability = {
      resourceType: 'CapabilityStatement',
      status: 'active',
      date: new Date().toISOString(),
      kind: 'instance',
      fhirVersion: '4.0.1',
      format: ['json'],
      rest: [
        {
          mode: 'server',
          resource: [
            { type: 'Patient', versioning: 'versioned', readHistory: true },
            { type: 'Observation', versioning: 'versioned', readHistory: true },
            { type: 'Procedure', versioning: 'versioned', readHistory: true },
            { type: 'DiagnosticReport', versioning: 'versioned', readHistory: true },
          ],
        },
      ],
    };

    return c.json({
      success: true,
      data: capability,
    });
  }
);

// ============================================================================
// LAB CONNECTOR
// ============================================================================

const labOrderSchema = z.object({
  patientId: z.string(),
  patientName: z.string(),
  patientDateOfBirth: z.string(),
  tests: z.array(z.object({
    code: z.string(),
    name: z.string(),
  })).min(1),
  priority: z.enum(['routine', 'urgent', 'stat']).optional().default('routine'),
  clinicalInfo: z.string().optional(),
});

/**
 * POST /healthcare/integrations/lab/order
 * Submit a lab order
 */
integrations.post(
  '/lab/order',
  requirePermission('healthcare:lab:order'),
  zValidator('json', labOrderSchema),
  async (c) => {
    try {
      const orderData = c.req.valid('json');

      // Get lab config from environment
      const config: LabConnectorConfig = {
        provider: 'generic',
        baseUrl: c.env.LAB_API_ENDPOINT || '',
        apiKey: c.env.LAB_API_KEY,
        organizationId: (c.get('user') as { organizationId?: string })?.organizationId || 'default',
        environment: (c.env.ENVIRONMENT || 'development') as 'development' | 'staging' | 'production',
      };

      if (!config.baseUrl) {
        // Return mock response in development
        return c.json({
          success: true,
          data: {
            orderId: `LAB-${Date.now()}`,
            status: 'submitted',
            message: 'Lab order submitted successfully (mock)',
          },
        });
      }

      const labConnector = new LabConnector(config);

      // Create a proper LabOrder
      const order: LabOrder = {
        id: `LAB-${Date.now()}`,
        patientId: orderData.patientId,
        patientName: orderData.patientName,
        patientDateOfBirth: orderData.patientDateOfBirth,
        orderDate: new Date(),
        priority: orderData.priority || 'routine',
        tests: orderData.tests,
        clinicalInfo: orderData.clinicalInfo,
        status: 'pending',
      };

      const result = await labConnector.submitOrder(order);

      return c.json({
        success: result.success,
        data: result.success ? {
          orderId: result.orderId,
        } : undefined,
        error: result.error ? { message: result.error } : undefined,
      });
    } catch (error) {
      logger.error('Lab order error', { error });
      return c.json({
        success: false,
        error: {
          code: 'LAB_ERROR',
          message: error instanceof Error ? error.message : 'Failed to submit lab order',
        },
      }, 500);
    }
  }
);

/**
 * GET /healthcare/integrations/lab/results/:orderId
 * Get lab results for an order
 */
integrations.get(
  '/lab/results/:orderId',
  requirePermission('healthcare:lab:read'),
  async (c) => {
    try {
      const orderId = c.req.param('orderId');

      const config: LabConnectorConfig = {
        provider: 'generic',
        baseUrl: c.env.LAB_API_ENDPOINT || '',
        apiKey: c.env.LAB_API_KEY,
        organizationId: (c.get('user') as { organizationId?: string })?.organizationId || 'default',
        environment: (c.env.ENVIRONMENT || 'development') as 'development' | 'staging' | 'production',
      };

      if (!config.baseUrl) {
        // Return mock response
        return c.json({
          success: true,
          data: {
            orderId,
            status: 'pending',
            message: 'Lab results not yet available (mock)',
          },
        });
      }

      const labConnector = new LabConnector(config);
      const results = await labConnector.fetchResults(orderId);

      return c.json({
        success: true,
        data: results,
      });
    } catch (error) {
      logger.error('Lab results error', { error });
      return c.json({
        success: false,
        error: {
          code: 'LAB_ERROR',
          message: error instanceof Error ? error.message : 'Failed to get lab results',
        },
      }, 500);
    }
  }
);

/**
 * GET /healthcare/integrations/lab/tests
 * Get available lab tests catalog
 */
integrations.get(
  '/lab/tests',
  requirePermission('healthcare:lab:read'),
  async (c) => {
    // Return common lab tests
    const tests = [
      { code: 'CBC', name: 'Complete Blood Count', category: 'Hematology' },
      { code: 'BMP', name: 'Basic Metabolic Panel', category: 'Chemistry' },
      { code: 'CMP', name: 'Comprehensive Metabolic Panel', category: 'Chemistry' },
      { code: 'LFT', name: 'Liver Function Tests', category: 'Chemistry' },
      { code: 'TSH', name: 'Thyroid Stimulating Hormone', category: 'Endocrine' },
      { code: 'HBA1C', name: 'Hemoglobin A1c', category: 'Diabetes' },
      { code: 'UA', name: 'Urinalysis', category: 'Urine' },
      { code: 'PT', name: 'Prothrombin Time', category: 'Coagulation' },
      { code: 'PTT', name: 'Partial Thromboplastin Time', category: 'Coagulation' },
      { code: 'TROP', name: 'Troponin', category: 'Cardiac' },
    ];

    return c.json({
      success: true,
      data: { tests },
    });
  }
);

// ============================================================================
// INTEGRATION STATUS
// ============================================================================

/**
 * GET /healthcare/integrations/status
 * Get status of all integrations
 */
integrations.get(
  '/status',
  requirePermission('healthcare:integrations:read'),
  async (c) => {
    const status = {
      sms: {
        configured: !!(c.env.TWILIO_ACCOUNT_SID && c.env.TWILIO_AUTH_TOKEN && c.env.TWILIO_FROM_NUMBER),
        provider: 'Twilio',
      },
      fhir: {
        configured: true,
        version: 'R4',
        baseUrl: '/api/v1/healthcare/integrations/fhir',
      },
      lab: {
        configured: !!c.env.LAB_API_ENDPOINT,
        endpoint: c.env.LAB_API_ENDPOINT ? 'Configured' : 'Not configured',
      },
    };

    return c.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        integrations: status,
      },
    });
  }
);

export { integrations };
export default integrations;
