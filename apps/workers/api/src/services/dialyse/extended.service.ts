/**
 * Dialyse Extended Services
 * Protocols, Staff, Billing, Transport, Consumables, Reports
 */

import { sql } from 'drizzle-orm';
import { drizzleDb } from '../../db';

// Generate UUID using crypto API
const generateId = () => crypto.randomUUID();

// ============================================================================
// PROTOCOLS SERVICE
// ============================================================================

export const protocolService = {
  async list(organizationId: string, filters: { status?: string; type?: string; limit?: number; offset?: number } = {}) {
    const { status, type, limit = 25, offset = 0 } = filters;

    let whereClause = `organization_id = '${organizationId}'`;
    if (status && status !== 'all') whereClause += ` AND status = '${status}'`;
    if (type && type !== 'all') whereClause += ` AND type = '${type}'`;

    const dataQuery = sql.raw(`SELECT * FROM dialyse_protocols WHERE ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
    const countQuery = sql.raw(`SELECT COUNT(*) as count FROM dialyse_protocols WHERE ${whereClause}`);

    const [dataResult, countResult] = await Promise.all([
      drizzleDb.all(dataQuery),
      drizzleDb.get(countQuery),
    ]);

    return {
      data: dataResult || [],
      total: (countResult as any)?.count || 0,
    };
  },

  async getById(organizationId: string, id: string) {
    const result = await drizzleDb.get(sql.raw(`SELECT * FROM dialyse_protocols WHERE id = '${id}' AND organization_id = '${organizationId}'`));
    return result;
  },

  async create(organizationId: string, userId: string, data: any) {
    const id = generateId();
    const now = Date.now();

    await drizzleDb.run(sql.raw(`
      INSERT INTO dialyse_protocols (
        id, organization_id, name, code, description, type, is_template,
        dialyzer_type, dialyzer_surface, blood_flow_rate, dialysate_flow_rate,
        session_duration_minutes, uf_goal, anticoagulation_type, anticoagulation_dose,
        anticoagulation_protocol, dialysate_sodium, dialysate_potassium, dialysate_bicarbonate,
        dialysate_calcium, dialysate_glucose, dialysate_temperature, access_type_preference,
        special_instructions, contraindications, status, created_by, created_at, updated_at
      ) VALUES (
        '${id}', '${organizationId}', '${data.name || ''}', ${data.code ? `'${data.code}'` : 'NULL'},
        ${data.description ? `'${data.description}'` : 'NULL'}, '${data.type || 'hemodialysis'}', ${data.isTemplate ? 1 : 1},
        ${data.dialyzerType ? `'${data.dialyzerType}'` : 'NULL'}, ${data.dialyzerSurface || 'NULL'},
        ${data.bloodFlowRate || 'NULL'}, ${data.dialysateFlowRate || 'NULL'}, ${data.sessionDurationMinutes || 'NULL'},
        ${data.ufGoal || 'NULL'}, ${data.anticoagulationType ? `'${data.anticoagulationType}'` : 'NULL'},
        ${data.anticoagulationDose ? `'${data.anticoagulationDose}'` : 'NULL'},
        ${data.anticoagulationProtocol ? `'${data.anticoagulationProtocol}'` : 'NULL'},
        ${data.dialysateSodium || 'NULL'}, ${data.dialysatePotassium || 'NULL'},
        ${data.dialysateBicarbonate || 'NULL'}, ${data.dialysateCalcium || 'NULL'},
        ${data.dialysateGlucose || 'NULL'}, ${data.dialysateTemperature || 'NULL'},
        ${data.accessTypePreference ? `'${data.accessTypePreference}'` : 'NULL'},
        ${data.specialInstructions ? `'${data.specialInstructions}'` : 'NULL'},
        ${data.contraindications ? `'${data.contraindications}'` : 'NULL'},
        'active', '${userId}', ${now}, ${now}
      )
    `));

    return this.getById(organizationId, id);
  },

  async update(organizationId: string, id: string, data: any) {
    const existing = await this.getById(organizationId, id);
    if (!existing) throw new Error('Protocol not found');

    const updates: string[] = [];
    if (data.name !== undefined) updates.push(`name = '${data.name}'`);
    if (data.code !== undefined) updates.push(`code = ${data.code ? `'${data.code}'` : 'NULL'}`);
    if (data.description !== undefined) updates.push(`description = ${data.description ? `'${data.description}'` : 'NULL'}`);
    if (data.status !== undefined) updates.push(`status = '${data.status}'`);
    if (data.type !== undefined) updates.push(`type = '${data.type}'`);

    if (updates.length > 0) {
      updates.push(`updated_at = ${Date.now()}`);
      await drizzleDb.run(sql.raw(`UPDATE dialyse_protocols SET ${updates.join(', ')} WHERE id = '${id}' AND organization_id = '${organizationId}'`));
    }

    return this.getById(organizationId, id);
  },

  async delete(organizationId: string, id: string) {
    await drizzleDb.run(sql.raw(`DELETE FROM dialyse_protocols WHERE id = '${id}' AND organization_id = '${organizationId}'`));
  },

  async duplicate(organizationId: string, id: string, userId: string) {
    const original = await this.getById(organizationId, id) as any;
    if (!original) throw new Error('Protocol not found');

    const newData = { ...original };
    newData.name = `${original.name} (copie)`;
    newData.code = original.code ? `${original.code}-COPY` : null;

    return this.create(organizationId, userId, newData);
  },

  async getStats(organizationId: string) {
    const result = await drizzleDb.get(sql.raw(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN type = 'hemodialysis' THEN 1 ELSE 0 END) as hemodialysis,
        SUM(CASE WHEN type = 'hemodiafiltration' THEN 1 ELSE 0 END) as hemodiafiltration,
        SUM(CASE WHEN is_template = 1 THEN 1 ELSE 0 END) as templates
      FROM dialyse_protocols WHERE organization_id = '${organizationId}'
    `));
    return result;
  },
};

// ============================================================================
// STAFF SERVICE
// ============================================================================

export const staffService = {
  async list(organizationId: string, filters: { role?: string; status?: string; limit?: number; offset?: number } = {}) {
    const { role, status, limit = 25, offset = 0 } = filters;

    let whereClause = `organization_id = '${organizationId}'`;
    if (role && role !== 'all') whereClause += ` AND role = '${role}'`;
    if (status && status !== 'all') whereClause += ` AND status = '${status}'`;

    const dataResult = await drizzleDb.all(sql.raw(`SELECT * FROM dialyse_staff WHERE ${whereClause} ORDER BY last_name, first_name LIMIT ${limit} OFFSET ${offset}`));
    const countResult = await drizzleDb.get(sql.raw(`SELECT COUNT(*) as count FROM dialyse_staff WHERE ${whereClause}`));

    return {
      data: dataResult || [],
      total: (countResult as any)?.count || 0,
    };
  },

  async getById(organizationId: string, id: string) {
    return drizzleDb.get(sql.raw(`SELECT * FROM dialyse_staff WHERE id = '${id}' AND organization_id = '${organizationId}'`));
  },

  async create(organizationId: string, userId: string, data: any) {
    const id = generateId();
    const now = Date.now();
    const licenseExpiry = data.licenseExpiry ? new Date(data.licenseExpiry).getTime() : null;

    await drizzleDb.run(sql.raw(`
      INSERT INTO dialyse_staff (
        id, organization_id, employee_id, first_name, last_name, role, specialty,
        license_number, license_expiry, phone, email, status, schedule, notes,
        created_by, created_at, updated_at
      ) VALUES (
        '${id}', '${organizationId}', ${data.employeeId ? `'${data.employeeId}'` : 'NULL'},
        '${data.firstName}', '${data.lastName}', '${data.role}',
        ${data.specialty ? `'${data.specialty}'` : 'NULL'},
        ${data.licenseNumber ? `'${data.licenseNumber}'` : 'NULL'},
        ${licenseExpiry || 'NULL'},
        ${data.phone ? `'${data.phone}'` : 'NULL'},
        ${data.email ? `'${data.email}'` : 'NULL'},
        '${data.status || 'active'}',
        ${data.schedule ? `'${JSON.stringify(data.schedule)}'` : 'NULL'},
        ${data.notes ? `'${data.notes}'` : 'NULL'},
        '${userId}', ${now}, ${now}
      )
    `));

    return this.getById(organizationId, id);
  },

  async update(organizationId: string, id: string, data: any) {
    const existing = await this.getById(organizationId, id);
    if (!existing) throw new Error('Staff member not found');

    const updates: string[] = [];
    if (data.firstName !== undefined) updates.push(`first_name = '${data.firstName}'`);
    if (data.lastName !== undefined) updates.push(`last_name = '${data.lastName}'`);
    if (data.role !== undefined) updates.push(`role = '${data.role}'`);
    if (data.specialty !== undefined) updates.push(`specialty = ${data.specialty ? `'${data.specialty}'` : 'NULL'}`);
    if (data.licenseNumber !== undefined) updates.push(`license_number = ${data.licenseNumber ? `'${data.licenseNumber}'` : 'NULL'}`);
    if (data.status !== undefined) updates.push(`status = '${data.status}'`);

    if (updates.length > 0) {
      updates.push(`updated_at = ${Date.now()}`);
      await drizzleDb.run(sql.raw(`UPDATE dialyse_staff SET ${updates.join(', ')} WHERE id = '${id}' AND organization_id = '${organizationId}'`));
    }

    return this.getById(organizationId, id);
  },

  async updateSchedule(organizationId: string, id: string, schedule: any) {
    await drizzleDb.run(sql.raw(`UPDATE dialyse_staff SET schedule = '${JSON.stringify(schedule)}', updated_at = ${Date.now()} WHERE id = '${id}' AND organization_id = '${organizationId}'`));
    return this.getById(organizationId, id);
  },

  async delete(organizationId: string, id: string) {
    await drizzleDb.run(sql.raw(`DELETE FROM dialyse_staff WHERE id = '${id}' AND organization_id = '${organizationId}'`));
  },

  async getStats(organizationId: string) {
    const now = Date.now();
    return drizzleDb.get(sql.raw(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN role = 'nephrologist' THEN 1 ELSE 0 END) as nephrologists,
        SUM(CASE WHEN role = 'nurse' THEN 1 ELSE 0 END) as nurses,
        SUM(CASE WHEN role = 'technician' THEN 1 ELSE 0 END) as technicians,
        SUM(CASE WHEN license_expiry < ${now} THEN 1 ELSE 0 END) as expired_licenses
      FROM dialyse_staff WHERE organization_id = '${organizationId}'
    `));
  },
};

// ============================================================================
// BILLING SERVICE
// ============================================================================

export const billingService = {
  async list(organizationId: string, filters: { status?: string; patientId?: string; startDate?: string; endDate?: string; limit?: number; offset?: number } = {}) {
    const { status, patientId, limit = 25, offset = 0 } = filters;

    let whereClause = `b.organization_id = '${organizationId}'`;
    if (status && status !== 'all') whereClause += ` AND b.status = '${status}'`;
    if (patientId) whereClause += ` AND b.patient_id = '${patientId}'`;

    const dataResult = await drizzleDb.all(sql.raw(`
      SELECT b.*,
        p.medical_id as patient_medical_id,
        c.first_name as patient_first_name,
        c.last_name as patient_last_name
      FROM dialyse_billing b
      LEFT JOIN dialyse_patients p ON b.patient_id = p.id
      LEFT JOIN contacts c ON p.contact_id = c.id
      WHERE ${whereClause}
      ORDER BY b.billing_date DESC LIMIT ${limit} OFFSET ${offset}
    `));
    const countResult = await drizzleDb.get(sql.raw(`SELECT COUNT(*) as count FROM dialyse_billing b WHERE ${whereClause}`));

    return {
      data: dataResult || [],
      total: (countResult as any)?.count || 0,
    };
  },

  async getById(organizationId: string, id: string) {
    return drizzleDb.get(sql.raw(`SELECT * FROM dialyse_billing WHERE id = '${id}' AND organization_id = '${organizationId}'`));
  },

  async create(organizationId: string, userId: string, data: any) {
    const id = generateId();
    const now = Date.now();
    const countResult = await drizzleDb.get(sql.raw(`SELECT COUNT(*) as count FROM dialyse_billing WHERE organization_id = '${organizationId}'`));
    const invoiceNumber = `DIAL-${new Date().getFullYear()}-${String(((countResult as any)?.count || 0) + 1).padStart(5, '0')}`;

    await drizzleDb.run(sql.raw(`
      INSERT INTO dialyse_billing (
        id, organization_id, patient_id, session_id, invoice_number, billing_date,
        session_date, billing_type, amount, insurance_amount, patient_amount,
        insurance_provider, insurance_policy_number, status, line_items, notes,
        created_by, created_at, updated_at
      ) VALUES (
        '${id}', '${organizationId}', '${data.patientId}', ${data.sessionId ? `'${data.sessionId}'` : 'NULL'},
        '${invoiceNumber}', ${now}, ${now}, '${data.billingType || 'session'}',
        ${data.amount || 0}, ${data.insuranceAmount || 0}, ${data.patientAmount || 0},
        ${data.insuranceProvider ? `'${data.insuranceProvider}'` : 'NULL'},
        ${data.insurancePolicyNumber ? `'${data.insurancePolicyNumber}'` : 'NULL'},
        'pending', ${data.lineItems ? `'${JSON.stringify(data.lineItems)}'` : 'NULL'},
        ${data.notes ? `'${data.notes}'` : 'NULL'}, '${userId}', ${now}, ${now}
      )
    `));

    return this.getById(organizationId, id);
  },

  async update(organizationId: string, id: string, data: any) {
    const existing = await this.getById(organizationId, id);
    if (!existing) throw new Error('Billing record not found');

    const updates: string[] = [];
    if (data.amount !== undefined) updates.push(`amount = ${data.amount}`);
    if (data.insuranceAmount !== undefined) updates.push(`insurance_amount = ${data.insuranceAmount}`);
    if (data.patientAmount !== undefined) updates.push(`patient_amount = ${data.patientAmount}`);
    if (data.status !== undefined) updates.push(`status = '${data.status}'`);

    if (updates.length > 0) {
      updates.push(`updated_at = ${Date.now()}`);
      await drizzleDb.run(sql.raw(`UPDATE dialyse_billing SET ${updates.join(', ')} WHERE id = '${id}' AND organization_id = '${organizationId}'`));
    }

    return this.getById(organizationId, id);
  },

  async markPaid(organizationId: string, id: string, paidAmount: number, paidDate: string) {
    await drizzleDb.run(sql.raw(`
      UPDATE dialyse_billing SET status = 'paid', paid_amount = ${paidAmount}, paid_date = ${new Date(paidDate).getTime()}, updated_at = ${Date.now()}
      WHERE id = '${id}' AND organization_id = '${organizationId}'
    `));
    return this.getById(organizationId, id);
  },

  async delete(organizationId: string, id: string) {
    await drizzleDb.run(sql.raw(`DELETE FROM dialyse_billing WHERE id = '${id}' AND organization_id = '${organizationId}'`));
  },

  async getStats(organizationId: string) {
    return drizzleDb.get(sql.raw(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
        SUM(amount) as total_amount,
        SUM(paid_amount) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
      FROM dialyse_billing WHERE organization_id = '${organizationId}'
    `));
  },
};

// ============================================================================
// TRANSPORT SERVICE
// ============================================================================

export const transportService = {
  async list(organizationId: string, filters: { status?: string; date?: string; patientId?: string; direction?: string; limit?: number; offset?: number } = {}) {
    const { status, patientId, direction, limit = 25, offset = 0 } = filters;

    let whereClause = `t.organization_id = '${organizationId}'`;
    if (status && status !== 'all') whereClause += ` AND t.status = '${status}'`;
    if (patientId) whereClause += ` AND t.patient_id = '${patientId}'`;
    if (direction && direction !== 'all') whereClause += ` AND t.direction = '${direction}'`;

    const dataResult = await drizzleDb.all(sql.raw(`
      SELECT t.*,
        p.medical_id as patient_medical_id,
        c.first_name as patient_first_name,
        c.last_name as patient_last_name
      FROM dialyse_transport t
      LEFT JOIN dialyse_patients p ON t.patient_id = p.id
      LEFT JOIN contacts c ON p.contact_id = c.id
      WHERE ${whereClause}
      ORDER BY t.transport_date DESC, t.scheduled_time LIMIT ${limit} OFFSET ${offset}
    `));
    const countResult = await drizzleDb.get(sql.raw(`SELECT COUNT(*) as count FROM dialyse_transport t WHERE ${whereClause}`));

    return {
      data: dataResult || [],
      total: (countResult as any)?.count || 0,
    };
  },

  async getById(organizationId: string, id: string) {
    return drizzleDb.get(sql.raw(`SELECT * FROM dialyse_transport WHERE id = '${id}' AND organization_id = '${organizationId}'`));
  },

  async create(organizationId: string, userId: string, data: any) {
    const id = generateId();
    const now = Date.now();

    await drizzleDb.run(sql.raw(`
      INSERT INTO dialyse_transport (
        id, organization_id, patient_id, session_id, transport_date, direction,
        transport_type, provider_name, provider_phone, vehicle_number, driver_name,
        pickup_address, dropoff_address, scheduled_time, special_needs,
        wheelchair_required, stretcher_required, oxygen_required, escort_required,
        escort_name, status, cost, notes, created_by, created_at, updated_at
      ) VALUES (
        '${id}', '${organizationId}', '${data.patientId}', ${data.sessionId ? `'${data.sessionId}'` : 'NULL'},
        ${new Date(data.transportDate).getTime()}, '${data.direction}', '${data.transportType}',
        ${data.providerName ? `'${data.providerName}'` : 'NULL'},
        ${data.providerPhone ? `'${data.providerPhone}'` : 'NULL'},
        ${data.vehicleNumber ? `'${data.vehicleNumber}'` : 'NULL'},
        ${data.driverName ? `'${data.driverName}'` : 'NULL'},
        ${data.pickupAddress ? `'${data.pickupAddress}'` : 'NULL'},
        ${data.dropoffAddress ? `'${data.dropoffAddress}'` : 'NULL'},
        '${data.scheduledTime}', ${data.specialNeeds ? `'${data.specialNeeds}'` : 'NULL'},
        ${data.wheelchairRequired ? 1 : 0}, ${data.stretcherRequired ? 1 : 0},
        ${data.oxygenRequired ? 1 : 0}, ${data.escortRequired ? 1 : 0},
        ${data.escortName ? `'${data.escortName}'` : 'NULL'},
        'scheduled', ${data.cost || 0}, ${data.notes ? `'${data.notes}'` : 'NULL'},
        '${userId}', ${now}, ${now}
      )
    `));

    return this.getById(organizationId, id);
  },

  async update(organizationId: string, id: string, data: any) {
    const existing = await this.getById(organizationId, id);
    if (!existing) throw new Error('Transport record not found');

    const updates: string[] = [];
    if (data.transportType !== undefined) updates.push(`transport_type = '${data.transportType}'`);
    if (data.scheduledTime !== undefined) updates.push(`scheduled_time = '${data.scheduledTime}'`);
    if (data.cost !== undefined) updates.push(`cost = ${data.cost}`);

    if (updates.length > 0) {
      updates.push(`updated_at = ${Date.now()}`);
      await drizzleDb.run(sql.raw(`UPDATE dialyse_transport SET ${updates.join(', ')} WHERE id = '${id}' AND organization_id = '${organizationId}'`));
    }

    return this.getById(organizationId, id);
  },

  async updateStatus(organizationId: string, id: string, status: string, actualTime?: string) {
    let updateSql = `status = '${status}', updated_at = ${Date.now()}`;
    if (actualTime) updateSql += `, actual_time = '${actualTime}'`;
    await drizzleDb.run(sql.raw(`UPDATE dialyse_transport SET ${updateSql} WHERE id = '${id}' AND organization_id = '${organizationId}'`));
    return this.getById(organizationId, id);
  },

  async delete(organizationId: string, id: string) {
    await drizzleDb.run(sql.raw(`DELETE FROM dialyse_transport WHERE id = '${id}' AND organization_id = '${organizationId}'`));
  },

  async getStats(organizationId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return drizzleDb.get(sql.raw(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN transport_date >= ${today.getTime()} AND transport_date < ${tomorrow.getTime()} THEN 1 ELSE 0 END) as today
      FROM dialyse_transport WHERE organization_id = '${organizationId}'
    `));
  },
};

// ============================================================================
// CONSUMABLES SERVICE
// ============================================================================

export const consumablesService = {
  async list(organizationId: string, filters: { category?: string; status?: string; lowStock?: boolean; limit?: number; offset?: number } = {}) {
    const { category, status, lowStock, limit = 50, offset = 0 } = filters;

    let whereClause = `organization_id = '${organizationId}'`;
    if (category && category !== 'all') whereClause += ` AND category = '${category}'`;
    if (status && status !== 'all') whereClause += ` AND status = '${status}'`;
    if (lowStock) whereClause += ` AND current_stock <= min_stock`;

    const dataResult = await drizzleDb.all(sql.raw(`SELECT * FROM dialyse_consumables WHERE ${whereClause} ORDER BY name LIMIT ${limit} OFFSET ${offset}`));
    const countResult = await drizzleDb.get(sql.raw(`SELECT COUNT(*) as count FROM dialyse_consumables WHERE ${whereClause}`));

    return {
      data: dataResult || [],
      total: (countResult as any)?.count || 0,
    };
  },

  async getById(organizationId: string, id: string) {
    return drizzleDb.get(sql.raw(`SELECT * FROM dialyse_consumables WHERE id = '${id}' AND organization_id = '${organizationId}'`));
  },

  async create(organizationId: string, userId: string, data: any) {
    const id = generateId();
    const now = Date.now();

    await drizzleDb.run(sql.raw(`
      INSERT INTO dialyse_consumables (
        id, organization_id, inventory_item_id, name, code, category, description,
        unit, current_stock, min_stock, max_stock, reorder_point, unit_cost,
        supplier, manufacturer, expiry_tracking, lot_tracking, status, notes,
        created_by, created_at, updated_at
      ) VALUES (
        '${id}', '${organizationId}', ${data.inventoryItemId ? `'${data.inventoryItemId}'` : 'NULL'},
        '${data.name}', ${data.code ? `'${data.code}'` : 'NULL'}, '${data.category}',
        ${data.description ? `'${data.description}'` : 'NULL'}, '${data.unit}',
        ${data.currentStock || 0}, ${data.minStock || 0}, ${data.maxStock || 'NULL'},
        ${data.reorderPoint || 'NULL'}, ${data.unitCost || 0},
        ${data.supplier ? `'${data.supplier}'` : 'NULL'},
        ${data.manufacturer ? `'${data.manufacturer}'` : 'NULL'},
        ${data.expiryTracking !== false ? 1 : 0}, ${data.lotTracking !== false ? 1 : 0},
        'active', ${data.notes ? `'${data.notes}'` : 'NULL'}, '${userId}', ${now}, ${now}
      )
    `));

    return this.getById(organizationId, id);
  },

  async update(organizationId: string, id: string, data: any) {
    const existing = await this.getById(organizationId, id);
    if (!existing) throw new Error('Consumable not found');

    const updates: string[] = [];
    if (data.name !== undefined) updates.push(`name = '${data.name}'`);
    if (data.category !== undefined) updates.push(`category = '${data.category}'`);
    if (data.unit !== undefined) updates.push(`unit = '${data.unit}'`);
    if (data.minStock !== undefined) updates.push(`min_stock = ${data.minStock}`);
    if (data.unitCost !== undefined) updates.push(`unit_cost = ${data.unitCost}`);
    if (data.status !== undefined) updates.push(`status = '${data.status}'`);

    if (updates.length > 0) {
      updates.push(`updated_at = ${Date.now()}`);
      await drizzleDb.run(sql.raw(`UPDATE dialyse_consumables SET ${updates.join(', ')} WHERE id = '${id}' AND organization_id = '${organizationId}'`));
    }

    return this.getById(organizationId, id);
  },

  async adjustStock(organizationId: string, id: string, userId: string, movement: any) {
    const consumable = await this.getById(organizationId, id) as any;
    if (!consumable) throw new Error('Consumable not found');

    const movementId = generateId();
    const now = Date.now();
    const quantity = movement.type === 'out' ? -Math.abs(movement.quantity) : Math.abs(movement.quantity);

    await drizzleDb.run(sql.raw(`
      INSERT INTO dialyse_consumable_movements (
        id, consumable_id, movement_type, quantity, lot_number, expiry_date,
        reference, session_id, notes, created_by, created_at
      ) VALUES (
        '${movementId}', '${id}', '${movement.type}', ${quantity},
        ${movement.lotNumber ? `'${movement.lotNumber}'` : 'NULL'},
        ${movement.expiryDate ? new Date(movement.expiryDate).getTime() : 'NULL'},
        ${movement.reference ? `'${movement.reference}'` : 'NULL'},
        ${movement.sessionId ? `'${movement.sessionId}'` : 'NULL'},
        ${movement.notes ? `'${movement.notes}'` : 'NULL'},
        '${userId}', ${now}
      )
    `));

    const newStock = consumable.current_stock + quantity;
    await drizzleDb.run(sql.raw(`UPDATE dialyse_consumables SET current_stock = ${newStock}, updated_at = ${now} WHERE id = '${id}'`));

    return this.getById(organizationId, id);
  },

  async delete(organizationId: string, id: string) {
    await drizzleDb.run(sql.raw(`DELETE FROM dialyse_consumables WHERE id = '${id}' AND organization_id = '${organizationId}'`));
  },

  async getStats(organizationId: string) {
    return drizzleDb.get(sql.raw(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN current_stock <= min_stock THEN 1 ELSE 0 END) as low_stock,
        SUM(CASE WHEN current_stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
        SUM(current_stock * unit_cost) as total_value
      FROM dialyse_consumables WHERE organization_id = '${organizationId}'
    `));
  },
};

// ============================================================================
// REPORTS SERVICE
// ============================================================================

export const reportsService = {
  async getReport(organizationId: string, period: string) {
    const now = new Date();
    let startDate: Date;
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [sessionsData, patientsData, billingData, alertsData] = await Promise.all([
      drizzleDb.get(sql.raw(`
        SELECT
          COUNT(*) as total_sessions,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
          SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_sessions,
          AVG(actual_duration_minutes) as avg_duration
        FROM dialyse_sessions WHERE organization_id = '${organizationId}' AND session_date >= ${startDate.getTime()}
      `)),
      drizzleDb.get(sql.raw(`
        SELECT COUNT(*) as total_patients,
          SUM(CASE WHEN patient_status = 'active' THEN 1 ELSE 0 END) as active_patients
        FROM dialyse_patients WHERE organization_id = '${organizationId}'
      `)),
      drizzleDb.get(sql.raw(`
        SELECT COUNT(*) as total_invoices,
          SUM(amount) as total_billed,
          SUM(paid_amount) as total_collected,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_amount
        FROM dialyse_billing WHERE organization_id = '${organizationId}' AND billing_date >= ${startDate.getTime()}
      `)),
      drizzleDb.get(sql.raw(`
        SELECT COUNT(*) as total_alerts,
          SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical_alerts,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_alerts
        FROM dialyse_clinical_alerts WHERE organization_id = '${organizationId}' AND created_at >= ${startDate.getTime()}
      `)),
    ]);

    return {
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      sessions: sessionsData,
      patients: patientsData,
      billing: billingData,
      alerts: alertsData,
    };
  },
};
