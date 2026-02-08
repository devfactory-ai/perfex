/**
 * Dialyse Scheduling Validation Service
 * Ensures sessions don't conflict with machine/staff availability
 */

import { logger } from '../../utils/logger';

export interface SchedulingSlot {
  startTime: Date;
  endTime: Date;
  machineId: string;
  staffId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  conflicts?: SessionConflict[];
}

export interface SessionConflict {
  type: 'machine' | 'staff' | 'patient' | 'maintenance';
  conflictingSessionId?: string;
  message: string;
  suggestedAlternatives?: SchedulingSlot[];
}

export interface CreateSessionInput {
  patientId: string;
  machineId: string;
  staffId?: string;
  startTime: Date;
  duration: number; // minutes
  sessionType: string;
}

export class DialyseSchedulingService {
  constructor(private db: D1Database) {}

  /**
   * Validate session scheduling before creation
   */
  async validateSession(
    organizationId: string,
    sessionData: CreateSessionInput
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const conflicts: SessionConflict[] = [];

    const startTime = new Date(sessionData.startTime);
    const endTime = new Date(startTime.getTime() + sessionData.duration * 60000);

    // Run all validations in parallel
    const [
      machineValidation,
      staffValidation,
      patientValidation,
      maintenanceValidation,
      vascularAccessValidation,
    ] = await Promise.all([
      this.validateMachineAvailability(organizationId, sessionData.machineId, startTime, endTime),
      sessionData.staffId
        ? this.validateStaffAvailability(organizationId, sessionData.staffId, startTime, endTime)
        : Promise.resolve({ valid: true, conflicts: [] }),
      this.validatePatientAvailability(organizationId, sessionData.patientId, startTime, endTime),
      this.validateNoMaintenance(organizationId, sessionData.machineId, startTime, endTime),
      this.validatePatientVascularAccess(organizationId, sessionData.patientId),
    ]);

    // Collect machine conflicts
    if (!machineValidation.valid && 'message' in machineValidation) {
      errors.push(machineValidation.message);
      conflicts.push(...machineValidation.conflicts);
    }

    // Collect staff conflicts
    if (!staffValidation.valid && 'message' in staffValidation) {
      errors.push(staffValidation.message);
      conflicts.push(...staffValidation.conflicts);
    }

    // Collect patient conflicts
    if (!patientValidation.valid && 'message' in patientValidation) {
      errors.push(patientValidation.message);
      conflicts.push(...patientValidation.conflicts);
    }

    // Check maintenance windows
    if (!maintenanceValidation.valid && 'message' in maintenanceValidation) {
      errors.push(maintenanceValidation.message);
      conflicts.push(...maintenanceValidation.conflicts);
    }

    // Check vascular access
    if (!vascularAccessValidation.valid && 'message' in vascularAccessValidation) {
      errors.push(vascularAccessValidation.message);
    }
    if ('warning' in vascularAccessValidation && vascularAccessValidation.warning) {
      warnings.push(vascularAccessValidation.warning);
    }

    // Additional business rule validations
    const businessRules = await this.validateBusinessRules(organizationId, sessionData, startTime);
    errors.push(...businessRules.errors);
    warnings.push(...businessRules.warnings);

    logger.info('Session validation completed', {
      valid: errors.length === 0,
      errorCount: errors.length,
      warningCount: warnings.length,
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };
  }

  /**
   * Check machine availability
   */
  private async validateMachineAvailability(
    organizationId: string,
    machineId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ valid: boolean; message: string; conflicts: SessionConflict[] }> {
    // Check if machine exists and is active
    const machine = await this.db.prepare(`
      SELECT id, name, status FROM dialyse_machines
      WHERE id = ? AND organization_id = ?
    `).bind(machineId, organizationId).first<any>();

    if (!machine) {
      return {
        valid: false,
        message: 'Machine non trouvee',
        conflicts: [],
      };
    }

    if (machine.status !== 'active') {
      return {
        valid: false,
        message: `Machine "${machine.name}" n'est pas active (statut: ${machine.status})`,
        conflicts: [],
      };
    }

    // Check for overlapping sessions
    const overlappingSessions = await this.db.prepare(`
      SELECT s.id, s.start_time, s.end_time, p.first_name, p.last_name
      FROM dialyse_sessions s
      JOIN dialyse_patients dp ON s.patient_id = dp.id
      JOIN contacts p ON dp.contact_id = p.id
      WHERE s.machine_id = ?
        AND s.organization_id = ?
        AND s.status NOT IN ('cancelled', 'completed')
        AND (
          (s.start_time < ? AND s.end_time > ?) OR
          (s.start_time < ? AND s.end_time > ?) OR
          (s.start_time >= ? AND s.end_time <= ?)
        )
    `).bind(
      machineId, organizationId,
      endTime.toISOString(), startTime.toISOString(),
      endTime.toISOString(), startTime.toISOString(),
      startTime.toISOString(), endTime.toISOString()
    ).all();

    if (overlappingSessions.results && overlappingSessions.results.length > 0) {
      const session = overlappingSessions.results[0] as any;
      return {
        valid: false,
        message: `Machine "${machine.name}" deja reservee de ${new Date(session.start_time).toLocaleTimeString()} a ${new Date(session.end_time).toLocaleTimeString()} pour ${session.first_name} ${session.last_name}`,
        conflicts: [{
          type: 'machine',
          conflictingSessionId: session.id,
          message: `Conflit avec session existante`,
        }],
      };
    }

    return { valid: true, message: '', conflicts: [] };
  }

  /**
   * Check staff availability
   */
  private async validateStaffAvailability(
    organizationId: string,
    staffId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ valid: boolean; message: string; conflicts: SessionConflict[] }> {
    // Check if staff exists
    const staff = await this.db.prepare(`
      SELECT id, first_name, last_name, status FROM dialyse_staff
      WHERE id = ? AND organization_id = ?
    `).bind(staffId, organizationId).first<any>();

    if (!staff) {
      return {
        valid: false,
        message: 'Personnel non trouve',
        conflicts: [],
      };
    }

    if (staff.status !== 'active') {
      return {
        valid: false,
        message: `${staff.first_name} ${staff.last_name} n'est pas disponible (statut: ${staff.status})`,
        conflicts: [],
      };
    }

    // Check for overlapping sessions assigned to this staff
    const overlappingSessions = await this.db.prepare(`
      SELECT s.id, s.start_time, s.end_time
      FROM dialyse_sessions s
      WHERE s.nurse_id = ?
        AND s.organization_id = ?
        AND s.status NOT IN ('cancelled', 'completed')
        AND (
          (s.start_time < ? AND s.end_time > ?) OR
          (s.start_time < ? AND s.end_time > ?) OR
          (s.start_time >= ? AND s.end_time <= ?)
        )
    `).bind(
      staffId, organizationId,
      endTime.toISOString(), startTime.toISOString(),
      endTime.toISOString(), startTime.toISOString(),
      startTime.toISOString(), endTime.toISOString()
    ).all();

    if (overlappingSessions.results && overlappingSessions.results.length > 0) {
      const session = overlappingSessions.results[0] as any;
      return {
        valid: false,
        message: `${staff.first_name} ${staff.last_name} a deja une session assignee a ce creneau`,
        conflicts: [{
          type: 'staff',
          conflictingSessionId: session.id,
          message: 'Personnel deja occupe',
        }],
      };
    }

    return { valid: true, message: '', conflicts: [] };
  }

  /**
   * Check patient doesn't have another session
   */
  private async validatePatientAvailability(
    organizationId: string,
    patientId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ valid: boolean; message: string; conflicts: SessionConflict[] }> {
    const overlappingSessions = await this.db.prepare(`
      SELECT id, start_time, end_time
      FROM dialyse_sessions
      WHERE patient_id = ?
        AND organization_id = ?
        AND status NOT IN ('cancelled', 'completed')
        AND DATE(start_time) = DATE(?)
    `).bind(patientId, organizationId, startTime.toISOString()).all();

    if (overlappingSessions.results && overlappingSessions.results.length > 0) {
      return {
        valid: false,
        message: 'Le patient a deja une session planifiee ce jour',
        conflicts: [{
          type: 'patient',
          conflictingSessionId: (overlappingSessions.results[0] as any).id,
          message: 'Session deja planifiee pour ce patient',
        }],
      };
    }

    return { valid: true, message: '', conflicts: [] };
  }

  /**
   * Check for maintenance windows
   */
  private async validateNoMaintenance(
    organizationId: string,
    machineId: string,
    startTime: Date,
    endTime: Date
  ): Promise<{ valid: boolean; message: string; conflicts: SessionConflict[] }> {
    const maintenanceRecords = await this.db.prepare(`
      SELECT id, maintenance_type, scheduled_date, notes
      FROM dialyse_maintenance
      WHERE machine_id = ?
        AND organization_id = ?
        AND status = 'scheduled'
        AND DATE(scheduled_date) = DATE(?)
    `).bind(machineId, organizationId, startTime.toISOString()).all();

    if (maintenanceRecords.results && maintenanceRecords.results.length > 0) {
      const maintenance = maintenanceRecords.results[0] as any;
      return {
        valid: false,
        message: `Machine en maintenance prevue (${maintenance.maintenance_type})`,
        conflicts: [{
          type: 'maintenance',
          message: `Maintenance planifiee: ${maintenance.notes || maintenance.maintenance_type}`,
        }],
      };
    }

    return { valid: true, message: '', conflicts: [] };
  }

  /**
   * Validate patient has active vascular access
   */
  private async validatePatientVascularAccess(
    organizationId: string,
    patientId: string
  ): Promise<{ valid: boolean; message: string; warning?: string }> {
    const activeAccess = await this.db.prepare(`
      SELECT id, type, status, last_used_date
      FROM vascular_accesses
      WHERE patient_id = ?
        AND organization_id = ?
        AND status = 'active'
      LIMIT 1
    `).bind(patientId, organizationId).first<any>();

    if (!activeAccess) {
      return {
        valid: false,
        message: 'Le patient n\'a pas d\'acces vasculaire actif',
      };
    }

    // Warning if access hasn't been used recently
    if (activeAccess.last_used_date) {
      const lastUsed = new Date(activeAccess.last_used_date);
      const daysSinceUse = Math.floor((Date.now() - lastUsed.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceUse > 14) {
        return {
          valid: true,
          message: '',
          warning: `Acces vasculaire non utilise depuis ${daysSinceUse} jours - verifier l'etat`,
        };
      }
    }

    return { valid: true, message: '' };
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(
    organizationId: string,
    sessionData: CreateSessionInput,
    startTime: Date
  ): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check session duration
    if (sessionData.duration < 180) {
      warnings.push('Duree de session inferieure a 3 heures - verifier la prescription');
    }
    if (sessionData.duration > 300) {
      warnings.push('Duree de session superieure a 5 heures - confirmer necessaire');
    }

    // Check time of day
    const hour = startTime.getHours();
    if (hour < 6) {
      errors.push('Les sessions ne peuvent pas commencer avant 6h00');
    }
    if (hour >= 22) {
      errors.push('Les sessions ne peuvent pas commencer apres 22h00');
    }

    // Check weekend scheduling (warning only)
    const dayOfWeek = startTime.getDay();
    if (dayOfWeek === 0) {
      warnings.push('Session planifiee un dimanche - confirmer disponibilite personnel');
    }

    // Check patient has active prescription
    const prescription = await this.db.prepare(`
      SELECT id, sessions_per_week, session_duration
      FROM dialyse_prescriptions
      WHERE patient_id = ?
        AND organization_id = ?
        AND status = 'active'
      LIMIT 1
    `).bind(sessionData.patientId, organizationId).first<any>();

    if (!prescription) {
      errors.push('Le patient n\'a pas de prescription active');
    } else {
      // Warn if session duration doesn't match prescription
      if (prescription.session_duration &&
          Math.abs(prescription.session_duration - sessionData.duration) > 30) {
        warnings.push(
          `Duree session (${sessionData.duration} min) differente de la prescription (${prescription.session_duration} min)`
        );
      }
    }

    return { errors, warnings };
  }

  /**
   * Find available slots for a patient
   */
  async findAvailableSlots(
    organizationId: string,
    date: Date,
    duration: number,
    patientId?: string
  ): Promise<SchedulingSlot[]> {
    const slots: SchedulingSlot[] = [];

    // Get all active machines
    const machines = await this.db.prepare(`
      SELECT id, name FROM dialyse_machines
      WHERE organization_id = ? AND status = 'active'
    `).bind(organizationId).all();

    // For each machine, find available time slots
    for (const machine of (machines.results || []) as any[]) {
      // Get existing sessions for the day
      const sessions = await this.db.prepare(`
        SELECT start_time, end_time
        FROM dialyse_sessions
        WHERE machine_id = ?
          AND organization_id = ?
          AND DATE(start_time) = DATE(?)
          AND status NOT IN ('cancelled')
        ORDER BY start_time
      `).bind(machine.id, organizationId, date.toISOString()).all();

      // Find gaps in schedule
      const dayStart = new Date(date);
      dayStart.setHours(6, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(22, 0, 0, 0);

      let currentTime = dayStart;

      for (const session of (sessions.results || []) as any[]) {
        const sessionStart = new Date(session.start_time);
        const sessionEnd = new Date(session.end_time);

        // Check if there's a gap before this session
        const gapDuration = (sessionStart.getTime() - currentTime.getTime()) / 60000;
        if (gapDuration >= duration) {
          slots.push({
            startTime: new Date(currentTime),
            endTime: new Date(currentTime.getTime() + duration * 60000),
            machineId: machine.id,
          });
        }

        currentTime = sessionEnd;
      }

      // Check if there's time at the end of the day
      const remainingTime = (dayEnd.getTime() - currentTime.getTime()) / 60000;
      if (remainingTime >= duration) {
        slots.push({
          startTime: new Date(currentTime),
          endTime: new Date(currentTime.getTime() + duration * 60000),
          machineId: machine.id,
        });
      }
    }

    return slots;
  }
}
