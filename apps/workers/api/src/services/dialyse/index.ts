/**
 * Dialyse Services Index
 * Export all dialyse module services
 */

export * from './patient.service';
export * from './vascular-access.service';
export * from './prescription.service';
export * from './machine.service';
export * from './session.service';
export * from './lab.service';
export * from './alert.service';

// Re-export service instances for convenience
import { patientService } from './patient.service';
import { vascularAccessService } from './vascular-access.service';
import { prescriptionService } from './prescription.service';
import { machineService } from './machine.service';
import { sessionService } from './session.service';
import { labService } from './lab.service';
import { alertService } from './alert.service';

export const dialyseServices = {
  patient: patientService,
  vascularAccess: vascularAccessService,
  prescription: prescriptionService,
  machine: machineService,
  session: sessionService,
  lab: labService,
  alert: alertService,
};
