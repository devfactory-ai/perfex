/**
 * RPM Services Index
 * Export all RPM-related services
 */

export { deviceService, DeviceService } from './device.service';
export { readingService, ReadingService } from './reading.service';
export { programService, ProgramService } from './program.service';
export { complianceService, ComplianceService } from './compliance.service';

// Re-export types
export type {
  CreateDeviceInput,
  UpdateDeviceInput,
  AssignDeviceInput,
  DeviceListOptions,
  IotDevice,
} from './device.service';

export type {
  CreateReadingInput,
  ReadingListOptions,
  ReadingStats,
  IotReading,
} from './reading.service';

export type {
  CreateProgramInput,
  UpdateProgramInput,
  CreateEnrollmentInput,
  RpmProgram,
  RpmEnrollment,
} from './program.service';

export type {
  ComplianceRecord,
  TimeLogInput,
  BillingPeriodSummary,
} from './compliance.service';
