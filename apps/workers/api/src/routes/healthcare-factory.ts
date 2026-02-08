/**
 * Healthcare Routes Factory
 * Provides a standardized way to create CRUD routes for healthcare modules
 * Reduces duplication and ensures consistent patterns across modules
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Env } from '../types';
import {
  withHealthcareRead,
  withHealthcareCreate,
  withHealthcareUpdate,
  withHealthcareDelete,
  withPatientAccess,
  withHealthcareExport,
  type HealthcareModule,
} from '../middleware/healthcare-auth';
import { logger } from '../utils/logger';
import { jsonResponse, errorResponse, paginatedResponse } from '../utils/response';

/**
 * Configuration for a healthcare resource
 */
export interface HealthcareResourceConfig {
  /** Resource name (singular, e.g., 'patient', 'consultation') */
  name: string;
  /** Database table name */
  tableName: string;
  /** Healthcare module this resource belongs to */
  module: HealthcareModule;
  /** Fields to select in list queries (defaults to '*') */
  listFields?: string[];
  /** Fields to select in detail queries (defaults to '*') */
  detailFields?: string[];
  /** Default sort field */
  sortField?: string;
  /** Default sort direction */
  sortDirection?: 'ASC' | 'DESC';
  /** Searchable fields for text search */
  searchFields?: string[];
  /** Organization field name (defaults to 'organization_id') */
  orgField?: string;
  /** Patient reference field (if resource is patient-related) */
  patientField?: string;
  /** Enable soft delete (defaults to true) */
  softDelete?: boolean;
  /** Soft delete field name (defaults to 'deleted_at') */
  deletedAtField?: string;
  /** Status field for filtering */
  statusField?: string;
  /** Custom validation function for create/update */
  validate?: (data: Record<string, unknown>, isUpdate: boolean) => { valid: boolean; errors: string[] };
  /** Custom transform for response data */
  transformResponse?: (row: Record<string, unknown>) => Record<string, unknown>;
  /** Fields that should be parsed as JSON */
  jsonFields?: string[];
}

/**
 * Build WHERE clause for list queries
 */
function buildWhereClause(
  config: HealthcareResourceConfig,
  organizationId: string,
  params: URLSearchParams
): { clause: string; bindings: unknown[] } {
  const conditions: string[] = [];
  const bindings: unknown[] = [];
  const orgField = config.orgField || 'organization_id';

  // Organization filter (always required)
  conditions.push(`${orgField} = ?`);
  bindings.push(organizationId);

  // Soft delete filter
  if (config.softDelete !== false) {
    const deletedAtField = config.deletedAtField || 'deleted_at';
    conditions.push(`${deletedAtField} IS NULL`);
  }

  // Status filter
  const status = params.get('status');
  if (status && config.statusField) {
    conditions.push(`${config.statusField} = ?`);
    bindings.push(status);
  }

  // Patient filter
  const patientId = params.get('patient_id') || params.get('patientId');
  if (patientId && config.patientField) {
    conditions.push(`${config.patientField} = ?`);
    bindings.push(patientId);
  }

  // Date range filters - SECURITY: Validate date_field against whitelist
  const SAFE_DATE_FIELDS = [
    'created_at',
    'updated_at',
    'consultation_date',
    'session_date',
    'appointment_date',
    'recording_date',
    'exam_date',
    'surgery_date',
    'injection_date',
    'implant_date',
    'measurement_date',
    'scheduled_date',
    'completed_date',
  ];

  const startDate = params.get('start_date') || params.get('from');
  const endDate = params.get('end_date') || params.get('to');
  const requestedDateField = params.get('date_field');
  const dateField = requestedDateField && SAFE_DATE_FIELDS.includes(requestedDateField)
    ? requestedDateField
    : 'created_at';

  if (startDate) {
    conditions.push(`${dateField} >= ?`);
    bindings.push(startDate);
  }

  if (endDate) {
    conditions.push(`${dateField} <= ?`);
    bindings.push(endDate);
  }

  // Text search
  const search = params.get('search') || params.get('q');
  if (search && config.searchFields && config.searchFields.length > 0) {
    const searchConditions = config.searchFields.map(field => `${field} LIKE ?`);
    conditions.push(`(${searchConditions.join(' OR ')})`);
    config.searchFields.forEach(() => bindings.push(`%${search}%`));
  }

  return {
    clause: conditions.join(' AND '),
    bindings,
  };
}

/**
 * Parse pagination parameters
 */
function parsePagination(params: URLSearchParams): { limit: number; offset: number; page: number } {
  const limit = Math.min(Math.max(parseInt(params.get('limit') || '20', 10), 1), 100);
  const page = Math.max(parseInt(params.get('page') || '1', 10), 1);
  const offset = (page - 1) * limit;
  return { limit, offset, page };
}

/**
 * Transform row data based on config
 */
function transformRow(
  row: Record<string, unknown>,
  config: HealthcareResourceConfig
): Record<string, unknown> {
  // Parse JSON fields
  if (config.jsonFields) {
    for (const field of config.jsonFields) {
      if (row[field] && typeof row[field] === 'string') {
        try {
          row[field] = JSON.parse(row[field] as string);
        } catch {
          // Keep as string if parse fails
        }
      }
    }
  }

  // Apply custom transform
  if (config.transformResponse) {
    return config.transformResponse(row);
  }

  return row;
}

/**
 * Create healthcare CRUD routes for a resource
 */
export function createHealthcareRoutes(config: HealthcareResourceConfig): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();
  const { name, tableName, module } = config;
  const orgField = config.orgField || 'organization_id';
  const sortField = config.sortField || 'created_at';
  const sortDirection = config.sortDirection || 'DESC';

  /**
   * GET /
   * List resources with pagination, filtering, and search
   */
  router.get('/', ...withHealthcareRead(module), async (c: Context) => {
    try {
      const organizationId = c.get('organizationId') as string;
      if (!organizationId) {
        return errorResponse(c, 'UNAUTHORIZED', 'Organization not found', 401);
      }
      const params = new URL(c.req.url).searchParams;
      const { limit, offset, page } = parsePagination(params);

      const { clause, bindings } = buildWhereClause(config, organizationId, params);
      const fields = config.listFields?.join(', ') || '*';

      // Get total count
      const countResult = await c.env.DB.prepare(
        `SELECT COUNT(*) as total FROM ${tableName} WHERE ${clause}`
      ).bind(...bindings).first() as { total: number } | null;

      const total = countResult?.total || 0;

      // Get paginated results
      const orderBy = params.get('sort') || sortField;
      const order = (params.get('order') || sortDirection).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      const results = await c.env.DB.prepare(
        `SELECT ${fields} FROM ${tableName} WHERE ${clause} ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`
      ).bind(...bindings, limit, offset).all();

      const data = (results.results || []).map((row: unknown) =>
        transformRow(row as Record<string, unknown>, config)
      );

      return paginatedResponse(c, data, { total, page, limit });
    } catch (error) {
      logger.error(`Error listing ${name}s`, { error });
      return errorResponse(c, 'INTERNAL_SERVER_ERROR', `Failed to list ${name}s`, 500);
    }
  });

  /**
   * GET /:id
   * Get single resource by ID
   */
  router.get('/:id', ...withHealthcareRead(module), async (c: Context) => {
    try {
      const organizationId = c.get('organizationId') as string;
      const id = c.req.param('id');
      const fields = config.detailFields?.join(', ') || '*';

      let query = `SELECT ${fields} FROM ${tableName} WHERE id = ? AND ${orgField} = ?`;

      if (config.softDelete !== false) {
        const deletedAtField = config.deletedAtField || 'deleted_at';
        query += ` AND ${deletedAtField} IS NULL`;
      }

      const result = await c.env.DB.prepare(query).bind(id, organizationId).first();

      if (!result) {
        return errorResponse(c, 'NOT_FOUND', `${name} not found`, 404);
      }

      const data = transformRow(result as Record<string, unknown>, config);
      return jsonResponse(c, data);
    } catch (error) {
      logger.error(`Error fetching ${name}`, { error });
      return errorResponse(c, 'INTERNAL_SERVER_ERROR', `Failed to fetch ${name}`, 500);
    }
  });

  /**
   * POST /
   * Create new resource
   */
  router.post('/', ...withHealthcareCreate(module), async (c: Context) => {
    try {
      const organizationId = c.get('organizationId') as string;
      const userId = c.get('userId') as string;
      const body = await c.req.json();

      // Validate
      if (config.validate) {
        const validation = config.validate(body, false);
        if (!validation.valid) {
          return errorResponse(c, 'VALIDATION_ERROR', validation.errors.join(', '), 400);
        }
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      // Build insert fields and values
      const insertFields: string[] = ['id', orgField, 'created_at', 'updated_at', 'created_by'];
      const placeholders: string[] = ['?', '?', '?', '?', '?'];
      const insertValues: unknown[] = [id, organizationId, now, now, userId];

      // Add body fields
      for (const [key, value] of Object.entries(body)) {
        if (key !== 'id' && key !== orgField && key !== 'created_at' && key !== 'updated_at') {
          insertFields.push(key);
          placeholders.push('?');
          insertValues.push(
            config.jsonFields?.includes(key) && typeof value === 'object'
              ? JSON.stringify(value)
              : value
          );
        }
      }

      await c.env.DB.prepare(
        `INSERT INTO ${tableName} (${insertFields.join(', ')}) VALUES (${placeholders.join(', ')})`
      ).bind(...insertValues).run();

      // Fetch created record
      const created = await c.env.DB.prepare(
        `SELECT * FROM ${tableName} WHERE id = ?`
      ).bind(id).first();

      const data = transformRow(created as Record<string, unknown>, config);
      return jsonResponse(c, data, 201);
    } catch (error) {
      logger.error(`Error creating ${name}`, { error });
      return errorResponse(c, 'INTERNAL_SERVER_ERROR', `Failed to create ${name}`, 500);
    }
  });

  /**
   * PUT /:id
   * Update resource
   */
  router.put('/:id', ...withHealthcareUpdate(module), async (c: Context) => {
    try {
      const organizationId = c.get('organizationId') as string;
      const userId = c.get('userId') as string;
      const id = c.req.param('id');
      const body = await c.req.json();

      // Check exists
      const existing = await c.env.DB.prepare(
        `SELECT id FROM ${tableName} WHERE id = ? AND ${orgField} = ?`
      ).bind(id, organizationId).first();

      if (!existing) {
        return errorResponse(c, 'NOT_FOUND', `${name} not found`, 404);
      }

      // Validate
      if (config.validate) {
        const validation = config.validate(body, true);
        if (!validation.valid) {
          return errorResponse(c, 'VALIDATION_ERROR', validation.errors.join(', '), 400);
        }
      }

      const now = new Date().toISOString();

      // Build update fields
      const updateFields: string[] = ['updated_at = ?', 'updated_by = ?'];
      const updateValues: unknown[] = [now, userId];

      for (const [key, value] of Object.entries(body)) {
        if (!['id', orgField, 'created_at', 'created_by'].includes(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(
            config.jsonFields?.includes(key) && typeof value === 'object'
              ? JSON.stringify(value)
              : value
          );
        }
      }

      updateValues.push(id, organizationId);

      await c.env.DB.prepare(
        `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE id = ? AND ${orgField} = ?`
      ).bind(...updateValues).run();

      // Fetch updated record
      const updated = await c.env.DB.prepare(
        `SELECT * FROM ${tableName} WHERE id = ?`
      ).bind(id).first();

      const data = transformRow(updated as Record<string, unknown>, config);
      return jsonResponse(c, data);
    } catch (error) {
      logger.error(`Error updating ${name}`, { error });
      return errorResponse(c, 'INTERNAL_SERVER_ERROR', `Failed to update ${name}`, 500);
    }
  });

  /**
   * DELETE /:id
   * Delete resource (soft delete by default)
   */
  router.delete('/:id', ...withHealthcareDelete(module), async (c: Context) => {
    try {
      const organizationId = c.get('organizationId') as string;
      const userId = c.get('userId') as string;
      const id = c.req.param('id');

      // Check exists
      const existing = await c.env.DB.prepare(
        `SELECT id FROM ${tableName} WHERE id = ? AND ${orgField} = ?`
      ).bind(id, organizationId).first();

      if (!existing) {
        return errorResponse(c, 'NOT_FOUND', `${name} not found`, 404);
      }

      if (config.softDelete !== false) {
        const deletedAtField = config.deletedAtField || 'deleted_at';
        const now = new Date().toISOString();

        await c.env.DB.prepare(
          `UPDATE ${tableName} SET ${deletedAtField} = ?, deleted_by = ? WHERE id = ? AND ${orgField} = ?`
        ).bind(now, userId, id, organizationId).run();
      } else {
        await c.env.DB.prepare(
          `DELETE FROM ${tableName} WHERE id = ? AND ${orgField} = ?`
        ).bind(id, organizationId).run();
      }

      return jsonResponse(c, { success: true, message: `${name} deleted successfully` });
    } catch (error) {
      logger.error(`Error deleting ${name}`, { error });
      return errorResponse(c, 'INTERNAL_SERVER_ERROR', `Failed to delete ${name}`, 500);
    }
  });

  return router;
}

/**
 * Create patient-specific healthcare routes
 * These routes are nested under a patient (e.g., /patients/:patientId/consultations)
 */
export function createPatientResourceRoutes(
  config: HealthcareResourceConfig
): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();
  const { name, tableName, module } = config;
  const orgField = config.orgField || 'organization_id';
  const patientField = config.patientField || 'patient_id';

  /**
   * GET /patients/:patientId/{resources}
   * List patient's resources
   */
  router.get('/', ...withPatientAccess(module, 'read'), async (c: Context) => {
    try {
      const organizationId = c.get('organizationId') as string;
      const patientId = c.get('patientId') as string;
      const params = new URL(c.req.url).searchParams;
      const { limit, offset, page } = parsePagination(params);

      const sortField = config.sortField || 'created_at';
      const sortDirection = config.sortDirection || 'DESC';
      const fields = config.listFields?.join(', ') || '*';

      // Get total count
      let countQuery = `SELECT COUNT(*) as total FROM ${tableName} WHERE ${orgField} = ? AND ${patientField} = ?`;
      if (config.softDelete !== false) {
        const deletedAtField = config.deletedAtField || 'deleted_at';
        countQuery += ` AND ${deletedAtField} IS NULL`;
      }

      const countResult = await c.env.DB.prepare(countQuery)
        .bind(organizationId, patientId).first() as { total: number } | null;
      const total = countResult?.total || 0;

      // Get results
      let query = `SELECT ${fields} FROM ${tableName} WHERE ${orgField} = ? AND ${patientField} = ?`;
      if (config.softDelete !== false) {
        const deletedAtField = config.deletedAtField || 'deleted_at';
        query += ` AND ${deletedAtField} IS NULL`;
      }
      query += ` ORDER BY ${sortField} ${sortDirection} LIMIT ? OFFSET ?`;

      const results = await c.env.DB.prepare(query)
        .bind(organizationId, patientId, limit, offset).all();

      const data = (results.results || []).map((row: unknown) =>
        transformRow(row as Record<string, unknown>, config)
      );

      return paginatedResponse(c, data, { total, page, limit });
    } catch (error) {
      logger.error(`Error listing patient ${name}s`, { error });
      return errorResponse(c, 'INTERNAL_SERVER_ERROR', `Failed to list ${name}s`, 500);
    }
  });

  /**
   * POST /patients/:patientId/{resources}
   * Create resource for patient
   */
  router.post('/', ...withPatientAccess(module, 'create'), async (c: Context) => {
    try {
      const organizationId = c.get('organizationId') as string;
      const patientId = c.get('patientId') as string;
      const userId = c.get('userId') as string;
      const body = await c.req.json();

      // Validate
      if (config.validate) {
        const validation = config.validate(body, false);
        if (!validation.valid) {
          return errorResponse(c, 'VALIDATION_ERROR', validation.errors.join(', '), 400);
        }
      }

      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      // Build insert
      const insertFields: string[] = ['id', orgField, patientField, 'created_at', 'updated_at', 'created_by'];
      const placeholders: string[] = ['?', '?', '?', '?', '?', '?'];
      const insertValues: unknown[] = [id, organizationId, patientId, now, now, userId];

      for (const [key, value] of Object.entries(body)) {
        if (!['id', orgField, patientField, 'created_at', 'updated_at'].includes(key)) {
          insertFields.push(key);
          placeholders.push('?');
          insertValues.push(
            config.jsonFields?.includes(key) && typeof value === 'object'
              ? JSON.stringify(value)
              : value
          );
        }
      }

      await c.env.DB.prepare(
        `INSERT INTO ${tableName} (${insertFields.join(', ')}) VALUES (${placeholders.join(', ')})`
      ).bind(...insertValues).run();

      const created = await c.env.DB.prepare(
        `SELECT * FROM ${tableName} WHERE id = ?`
      ).bind(id).first();

      const data = transformRow(created as Record<string, unknown>, config);
      return jsonResponse(c, data, 201);
    } catch (error) {
      logger.error(`Error creating patient ${name}`, { error });
      return errorResponse(c, 'INTERNAL_SERVER_ERROR', `Failed to create ${name}`, 500);
    }
  });

  return router;
}

/**
 * Create stats endpoint for healthcare dashboard
 */
export function createStatsRoute(
  module: HealthcareModule,
  statsQuery: (organizationId: string, db: D1Database) => Promise<Record<string, unknown>>
): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();

  router.get('/', ...withHealthcareRead(module), async (c: Context) => {
    try {
      const organizationId = c.get('organizationId') as string;
      const stats = await statsQuery(organizationId, c.env.DB);
      return jsonResponse(c, stats);
    } catch (error) {
      logger.error(`Error fetching ${module} stats`, { error });
      return errorResponse(c, 'INTERNAL_SERVER_ERROR', 'Failed to fetch statistics', 500);
    }
  });

  return router;
}

/**
 * Create export endpoint for healthcare data
 */
export function createExportRoute(
  config: HealthcareResourceConfig
): Hono<{ Bindings: Env }> {
  const router = new Hono<{ Bindings: Env }>();
  const { name, tableName, module } = config;
  const orgField = config.orgField || 'organization_id';

  router.get('/', ...withHealthcareExport(module), async (c: Context) => {
    try {
      const organizationId = c.get('organizationId') as string;
      if (!organizationId) {
        return errorResponse(c, 'UNAUTHORIZED', 'Organization not found', 401);
      }
      const params = new URL(c.req.url).searchParams;
      const format = params.get('format') || 'json';

      const { clause, bindings } = buildWhereClause(config, organizationId, params);
      const fields = config.listFields?.join(', ') || '*';

      const results = await c.env.DB.prepare(
        `SELECT ${fields} FROM ${tableName} WHERE ${clause} ORDER BY created_at DESC`
      ).bind(...bindings).all();

      const data = (results.results || []).map((row: unknown) =>
        transformRow(row as Record<string, unknown>, config)
      );

      if (format === 'csv') {
        // Generate CSV
        if (data.length === 0) {
          return new Response('', {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="${name}s-export.csv"`,
            },
          });
        }

        const headers = Object.keys(data[0]);
        const csv = [
          headers.join(','),
          ...data.map((row: Record<string, unknown>) =>
            headers.map(h => {
              const value = row[h];
              if (value === null || value === undefined) return '';
              if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
              if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return String(value);
            }).join(',')
          ),
        ].join('\n');

        return new Response(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${name}s-export.csv"`,
          },
        });
      }

      // Default to JSON
      return jsonResponse(c, { data, total: data.length, exportedAt: new Date().toISOString() });
    } catch (error) {
      logger.error(`Error exporting ${name}s`, { error });
      return errorResponse(c, 'INTERNAL_SERVER_ERROR', `Failed to export ${name}s`, 500);
    }
  });

  return router;
}
