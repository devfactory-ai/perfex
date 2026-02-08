/**
 * Sterilization & CSSD Service - Central Sterile Supply Department
 *
 * Comprehensive instrument traceability, sterilization management,
 * surgical set tracking, and quality assurance for sterile processing
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface Instrument {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  category: InstrumentCategory;
  type: string;
  manufacturer: string;
  model?: string;
  serialNumber?: string;
  lotNumber?: string;

  // Physical Properties
  material: InstrumentMaterial;
  dimensions?: {
    length?: number;
    width?: number;
    weight?: number;
  };

  // Processing Requirements
  sterilizationMethod: SterilizationMethod;
  washingProgram: WashingProgram;
  specialInstructions?: string;
  packagingType: PackagingType;

  // Lifecycle
  status: InstrumentStatus;
  condition: InstrumentCondition;
  location: InstrumentLocation;

  // Tracking
  purchaseDate?: string;
  warrantyExpiry?: string;
  expectedLifespan?: number; // cycles
  cycleCount: number;
  lastSterilizedAt?: string;
  lastUsedAt?: string;
  lastInspectedAt?: string;

  // Maintenance
  maintenanceSchedule: MaintenanceSchedule;
  maintenanceHistory: MaintenanceRecord[];

  // Cost Tracking
  purchasePrice?: number;
  replacementCost?: number;

  createdAt: string;
  updatedAt: string;
}

export type InstrumentCategory =
  | 'cutting'           // Instruments de coupe
  | 'clamping'          // Pinces hémostatiques
  | 'grasping'          // Pinces de préhension
  | 'retractor'         // Écarteurs
  | 'suction'           // Aspiration
  | 'dilation'          // Dilatation
  | 'probing'           // Sondes/Stylets
  | 'suturing'          // Suture
  | 'specialty'         // Spécialisé
  | 'power_tool'        // Équipement motorisé
  | 'scope'             // Endoscopes
  | 'container'         // Conteneurs
  | 'accessory';        // Accessoires

export type InstrumentMaterial =
  | 'stainless_steel'
  | 'titanium'
  | 'tungsten_carbide'
  | 'plastic'
  | 'silicone'
  | 'mixed';

export type SterilizationMethod =
  | 'steam_121'         // Vapeur 121°C
  | 'steam_134'         // Vapeur 134°C
  | 'flash_steam'       // Vapeur flash
  | 'eto'               // Oxyde d'éthylène
  | 'h2o2_plasma'       // Plasma H2O2
  | 'peracetic_acid'    // Acide peracétique
  | 'dry_heat'          // Chaleur sèche
  | 'radiation';        // Irradiation

export type WashingProgram =
  | 'standard'
  | 'heavy_duty'
  | 'delicate'
  | 'enzyme'
  | 'scope'
  | 'manual_only';

export type PackagingType =
  | 'container'         // Conteneur rigide
  | 'paper_plastic'     // Papier/Plastique
  | 'tyvek'             // Tyvek
  | 'textile'           // Textile
  | 'peel_pack';        // Pelable

export type InstrumentStatus =
  | 'available'         // Disponible
  | 'in_use'            // En utilisation
  | 'dirty'             // Sale
  | 'decontaminating'   // En décontamination
  | 'washing'           // En lavage
  | 'inspecting'        // En inspection
  | 'packaging'         // En conditionnement
  | 'sterilizing'       // En stérilisation
  | 'sterile'           // Stérile
  | 'quarantine'        // En quarantaine
  | 'maintenance'       // En maintenance
  | 'retired';          // Retiré

export type InstrumentCondition =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'unusable';

export interface InstrumentLocation {
  area: 'dirty_zone' | 'clean_zone' | 'sterile_storage' | 'or_suite' | 'maintenance' | 'other';
  building?: string;
  floor?: string;
  room?: string;
  shelf?: string;
  position?: string;
}

export interface MaintenanceSchedule {
  type: 'cycle_based' | 'time_based';
  interval: number; // cycles or days
  nextDue: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'inspection' | 'sharpening' | 'repair' | 'calibration' | 'replacement';
  performedBy: string;
  findings: string;
  actionsTaken: string;
  partsReplaced?: string[];
  cost?: number;
  nextMaintenanceDue?: string;
}

// Surgical Set (Tray)
export interface SurgicalSet {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  specialty: string;
  procedureType: string;

  // Contents
  instruments: SetInstrument[];
  totalInstrumentCount: number;

  // Processing
  sterilizationMethod: SterilizationMethod;
  containerType: string;
  containerId?: string;
  packagingMaterial: PackagingType;

  // Status
  status: SetStatus;
  location: InstrumentLocation;

  // Tracking
  lastAssembledAt?: string;
  lastAssembledBy?: string;
  lastSterilizedAt?: string;
  expiryDate?: string;
  cycleCount: number;

  // Quality
  weight?: number;
  photo?: string;
  assemblyInstructions?: string;
  countSheet?: CountSheet;

  createdAt: string;
  updatedAt: string;
}

export interface SetInstrument {
  instrumentId: string;
  instrumentCode: string;
  instrumentName: string;
  quantity: number;
  position?: string;
  critical: boolean;
  notes?: string;
}

export type SetStatus =
  | 'available'
  | 'in_assembly'
  | 'assembled'
  | 'in_sterilization'
  | 'sterile'
  | 'issued'
  | 'in_use'
  | 'returned_dirty'
  | 'incomplete'
  | 'quarantine';

export interface CountSheet {
  id: string;
  setId: string;
  version: number;
  instruments: CountSheetItem[];
  lastUpdated: string;
  updatedBy: string;
}

export interface CountSheetItem {
  instrumentId: string;
  instrumentName: string;
  expectedCount: number;
  position: string;
  photo?: string;
}

// Sterilization Cycle
export interface SterilizationCycle {
  id: string;
  organizationId: string;
  cycleNumber: string;
  sterilizerId: string;
  sterilizerName: string;
  method: SterilizationMethod;
  program: string;

  // Timing
  startTime: string;
  endTime?: string;
  duration?: number; // minutes

  // Load
  loadType: 'instruments' | 'textile' | 'mixed' | 'test';
  items: CycleItem[];
  totalItems: number;

  // Parameters
  parameters: CycleParameters;
  actualReadings: CycleReading[];

  // Biological Indicator
  biologicalIndicator?: BiologicalIndicator;

  // Chemical Indicators
  chemicalIndicators: ChemicalIndicator[];

  // Status
  status: CycleStatus;
  result: CycleResult;
  failureReason?: string;

  // Operator
  startedBy: string;
  completedBy?: string;
  releasedBy?: string;
  releasedAt?: string;

  // Documentation
  printoutPath?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface CycleItem {
  itemType: 'instrument' | 'set' | 'textile' | 'other';
  itemId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  containerNumber?: string;
  loadPosition?: string;
}

export interface CycleParameters {
  temperature: number;
  pressure?: number;
  holdTime: number;
  dryingTime?: number;
  exposure?: string;
}

export interface CycleReading {
  timestamp: string;
  phase: 'conditioning' | 'exposure' | 'exhaust' | 'drying';
  temperature: number;
  pressure?: number;
  humidity?: number;
}

export interface BiologicalIndicator {
  id: string;
  type: 'spore' | 'enzyme';
  manufacturer: string;
  lotNumber: string;
  expiryDate: string;
  placement: string;
  readTime: string;
  readBy?: string;
  result?: 'pass' | 'fail' | 'pending';
  incubationHours?: number;
}

export interface ChemicalIndicator {
  id: string;
  type: 'class_1' | 'class_4' | 'class_5' | 'class_6';
  location: string;
  result: 'pass' | 'fail';
  notes?: string;
}

export type CycleStatus =
  | 'loading'
  | 'running'
  | 'completed'
  | 'aborted'
  | 'pending_bi'     // En attente résultat BI
  | 'released'
  | 'recalled';

export type CycleResult =
  | 'pending'
  | 'passed'
  | 'failed_parameters'
  | 'failed_bi'
  | 'failed_ci'
  | 'failed_mechanical';

// Equipment (Sterilizers, Washers)
export interface CSSDEquipment {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  type: EquipmentType;
  manufacturer: string;
  model: string;
  serialNumber: string;

  // Location
  location: string;
  zone: 'dirty' | 'clean' | 'sterile';

  // Specifications
  capacity: string;
  chamberSize?: string;
  programs: EquipmentProgram[];

  // Status
  status: EquipmentStatus;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  calibrationDueDate?: string;

  // Validation
  lastValidationDate?: string;
  validationDueDate?: string;
  iqOqPqStatus?: 'current' | 'due' | 'overdue';

  // Metrics
  totalCycles: number;
  cyclesSinceLastMaintenance: number;
  failureRate?: number;

  // Documentation
  manualPath?: string;
  validationReportPath?: string;

  createdAt: string;
  updatedAt: string;
}

export type EquipmentType =
  | 'steam_sterilizer'      // Autoclave vapeur
  | 'eto_sterilizer'        // Stérilisateur ETO
  | 'plasma_sterilizer'     // Stérilisateur plasma
  | 'washer_disinfector'    // Laveur-désinfecteur
  | 'ultrasonic_cleaner'    // Nettoyeur ultrasonique
  | 'drying_cabinet'        // Armoire de séchage
  | 'scope_processor'       // Laveur endoscopes
  | 'heat_sealer'           // Thermosoudeuse
  | 'incubator'             // Incubateur BI
  | 'water_system';         // Système eau purifiée

export interface EquipmentProgram {
  code: string;
  name: string;
  description: string;
  parameters: CycleParameters;
  duration: number;
  forMaterials: string[];
}

export type EquipmentStatus =
  | 'operational'
  | 'running'
  | 'idle'
  | 'maintenance'
  | 'calibration'
  | 'breakdown'
  | 'out_of_service';

// Traceability Record
export interface TraceabilityRecord {
  id: string;
  organizationId: string;
  recordType: 'instrument' | 'set';
  itemId: string;
  itemCode: string;
  itemName: string;

  // Usage
  patientId?: string;
  patientName?: string;
  procedureId?: string;
  procedureType?: string;
  surgeonId?: string;
  surgeonName?: string;
  orRoom?: string;
  usedAt: string;

  // Processing After Use
  returnedAt?: string;
  returnedBy?: string;
  washingCycleId?: string;
  sterilizationCycleId?: string;

  // Issues
  issuesReported?: TraceabilityIssue[];

  createdAt: string;
}

export interface TraceabilityIssue {
  id: string;
  type: 'damage' | 'missing' | 'malfunction' | 'contamination' | 'count_discrepancy';
  description: string;
  reportedBy: string;
  reportedAt: string;
  resolution?: string;
  resolvedAt?: string;
}

// Recall
export interface Recall {
  id: string;
  organizationId: string;
  recallNumber: string;
  type: 'sterilization_failure' | 'bi_failure' | 'equipment_failure' | 'contamination' | 'other';
  severity: 'critical' | 'major' | 'minor';

  // Affected Items
  affectedCycles: string[];
  affectedItems: RecallItem[];

  // Timeline
  discoveredAt: string;
  discoveredBy: string;
  initiatedAt: string;
  initiatedBy: string;
  completedAt?: string;

  // Actions
  immediateActions: string[];
  rootCause?: string;
  correctiveActions: string[];

  // Notifications
  notifiedParties: RecallNotification[];

  // Status
  status: 'initiated' | 'in_progress' | 'completed' | 'closed';

  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecallItem {
  itemType: 'instrument' | 'set';
  itemId: string;
  itemCode: string;
  itemName: string;
  cycleId: string;
  wasUsed: boolean;
  patientId?: string;
  patientName?: string;
  usedAt?: string;
  status: 'identified' | 'retrieved' | 'in_quarantine' | 'reprocessed' | 'destroyed';
}

export interface RecallNotification {
  recipientType: 'internal' | 'patient' | 'regulatory';
  recipientName: string;
  notifiedAt: string;
  notifiedBy: string;
  method: 'phone' | 'email' | 'in_person' | 'letter';
  acknowledged: boolean;
}

// Dashboard
export interface CSSDDashboard {
  summary: CSSDSummary;
  equipmentStatus: EquipmentStatusSummary[];
  todayCycles: SterilizationCycle[];
  pendingBiResults: BiologicalIndicator[];
  lowStockItems: LowStockItem[];
  maintenanceDue: CSSDEquipment[];
  recentRecalls: Recall[];
  productivityMetrics: ProductivityMetrics;
}

export interface CSSDSummary {
  totalInstruments: number;
  availableInstruments: number;
  inProcessing: number;
  sterileInventory: number;
  setsAvailable: number;
  cyclesCompletedToday: number;
  cyclesFailedToday: number;
  pendingBiResults: number;
}

export interface EquipmentStatusSummary {
  equipmentId: string;
  name: string;
  type: EquipmentType;
  status: EquipmentStatus;
  currentCycle?: string;
  cyclesRemaining?: number;
}

export interface LowStockItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  currentStock: number;
  minStock: number;
  reorderPoint: number;
}

export interface ProductivityMetrics {
  cyclesPerDay: number;
  turnaroundTime: number; // hours
  instrumentsProcessed: number;
  setsProcessed: number;
  biPassRate: number;
  ciPassRate: number;
}

// ============================================================================
// CSSD/Sterilization Service Class
// ============================================================================

export class SterilizationService {
  private db: D1Database;
  private organizationId: string;

  constructor(db: D1Database, organizationId: string) {
    this.db = db;
    this.organizationId = organizationId;
  }

  // ==========================================================================
  // Instrument Management
  // ==========================================================================

  async createInstrument(data: Partial<Instrument>): Promise<Instrument> {
    const instrument: Instrument = {
      id: this.generateId(),
      organizationId: this.organizationId,
      code: data.code || await this.generateInstrumentCode(),
      name: data.name || '',
      description: data.description,
      category: data.category || 'accessory',
      type: data.type || '',
      manufacturer: data.manufacturer || '',
      model: data.model,
      serialNumber: data.serialNumber,
      lotNumber: data.lotNumber,
      material: data.material || 'stainless_steel',
      dimensions: data.dimensions,
      sterilizationMethod: data.sterilizationMethod || 'steam_134',
      washingProgram: data.washingProgram || 'standard',
      specialInstructions: data.specialInstructions,
      packagingType: data.packagingType || 'paper_plastic',
      status: 'available',
      condition: 'excellent',
      location: data.location || { area: 'sterile_storage' },
      purchaseDate: data.purchaseDate,
      warrantyExpiry: data.warrantyExpiry,
      expectedLifespan: data.expectedLifespan,
      cycleCount: 0,
      maintenanceSchedule: data.maintenanceSchedule || {
        type: 'cycle_based',
        interval: 100,
        nextDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      maintenanceHistory: [],
      purchasePrice: data.purchasePrice,
      replacementCost: data.replacementCost,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await InstrumentDB.create(this.db, instrument);
    return instrument;
  }

  async getInstrument(id: string): Promise<Instrument | null> {
    return InstrumentDB.getById(this.db, id);
  }

  async getInstrumentByCode(code: string): Promise<Instrument | null> {
    return InstrumentDB.getByCode(this.db, this.organizationId, code);
  }

  async updateInstrumentStatus(id: string, status: InstrumentStatus, location?: InstrumentLocation): Promise<Instrument> {
    const instrument = await this.getInstrument(id);
    if (!instrument) throw new Error('Instrument not found');

    const updates: Partial<Instrument> = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (location) updates.location = location;

    if (status === 'sterile') {
      updates.lastSterilizedAt = new Date().toISOString();
      updates.cycleCount = instrument.cycleCount + 1;
    }

    if (status === 'in_use') {
      updates.lastUsedAt = new Date().toISOString();
    }

    return this.updateInstrument(id, updates);
  }

  async updateInstrument(id: string, updates: Partial<Instrument>): Promise<Instrument> {
    const instrument = await this.getInstrument(id);
    if (!instrument) throw new Error('Instrument not found');

    const updated: Instrument = {
      ...instrument,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await InstrumentDB.update(this.db, id, updated);
    return updated;
  }

  async listInstruments(filters: {
    status?: InstrumentStatus;
    category?: InstrumentCategory;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ instruments: Instrument[]; total: number }> {
    return InstrumentDB.list(this.db, this.organizationId, filters);
  }

  async performInspection(instrumentId: string, data: {
    performedBy: string;
    findings: string;
    condition: InstrumentCondition;
    actionsTaken: string;
    passedInspection: boolean;
  }): Promise<Instrument> {
    const instrument = await this.getInstrument(instrumentId);
    if (!instrument) throw new Error('Instrument not found');

    const record: MaintenanceRecord = {
      id: this.generateId(),
      date: new Date().toISOString(),
      type: 'inspection',
      performedBy: data.performedBy,
      findings: data.findings,
      actionsTaken: data.actionsTaken
    };

    instrument.maintenanceHistory.push(record);
    instrument.lastInspectedAt = new Date().toISOString();
    instrument.condition = data.condition;

    if (!data.passedInspection) {
      instrument.status = 'quarantine';
    }

    return this.updateInstrument(instrumentId, {
      maintenanceHistory: instrument.maintenanceHistory,
      lastInspectedAt: instrument.lastInspectedAt,
      condition: instrument.condition,
      status: instrument.status
    });
  }

  async retireInstrument(id: string, reason: string, retiredBy: string): Promise<Instrument> {
    return this.updateInstrument(id, {
      status: 'retired',
      maintenanceHistory: [
        ...(await this.getInstrument(id))!.maintenanceHistory,
        {
          id: this.generateId(),
          date: new Date().toISOString(),
          type: 'replacement',
          performedBy: retiredBy,
          findings: reason,
          actionsTaken: 'Instrument retired from service'
        }
      ]
    });
  }

  // ==========================================================================
  // Surgical Set Management
  // ==========================================================================

  async createSurgicalSet(data: Partial<SurgicalSet>): Promise<SurgicalSet> {
    const set: SurgicalSet = {
      id: this.generateId(),
      organizationId: this.organizationId,
      code: data.code || await this.generateSetCode(),
      name: data.name || '',
      description: data.description,
      specialty: data.specialty || 'general',
      procedureType: data.procedureType || '',
      instruments: data.instruments || [],
      totalInstrumentCount: data.instruments?.reduce((sum, i) => sum + i.quantity, 0) || 0,
      sterilizationMethod: data.sterilizationMethod || 'steam_134',
      containerType: data.containerType || 'rigid_container',
      containerId: data.containerId,
      packagingMaterial: data.packagingType || 'container',
      status: 'available',
      location: data.location || { area: 'sterile_storage' },
      cycleCount: 0,
      weight: data.weight,
      photo: data.photo,
      assemblyInstructions: data.assemblyInstructions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await SurgicalSetDB.create(this.db, set);
    return set;
  }

  async getSurgicalSet(id: string): Promise<SurgicalSet | null> {
    return SurgicalSetDB.getById(this.db, id);
  }

  async updateSetStatus(id: string, status: SetStatus, location?: InstrumentLocation): Promise<SurgicalSet> {
    const set = await this.getSurgicalSet(id);
    if (!set) throw new Error('Set not found');

    const updates: Partial<SurgicalSet> = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (location) updates.location = location;

    if (status === 'sterile') {
      updates.lastSterilizedAt = new Date().toISOString();
      updates.cycleCount = set.cycleCount + 1;
      // Calculate expiry based on packaging (typically 30 days for wrapped, longer for containers)
      updates.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    return this.updateSurgicalSet(id, updates);
  }

  async updateSurgicalSet(id: string, updates: Partial<SurgicalSet>): Promise<SurgicalSet> {
    const set = await this.getSurgicalSet(id);
    if (!set) throw new Error('Set not found');

    const updated: SurgicalSet = {
      ...set,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await SurgicalSetDB.update(this.db, id, updated);
    return updated;
  }

  async assembleSet(setId: string, data: {
    assembledBy: string;
    instruments: { instrumentId: string; quantity: number }[];
  }): Promise<SurgicalSet> {
    const set = await this.getSurgicalSet(setId);
    if (!set) throw new Error('Set not found');

    // Verify all instruments are available
    for (const item of data.instruments) {
      const instrument = await this.getInstrument(item.instrumentId);
      if (!instrument || instrument.status !== 'available') {
        throw new Error(`Instrument ${item.instrumentId} not available`);
      }
    }

    // Update instrument statuses
    for (const item of data.instruments) {
      await this.updateInstrumentStatus(item.instrumentId, 'in_use');
    }

    return this.updateSurgicalSet(setId, {
      status: 'assembled',
      lastAssembledAt: new Date().toISOString(),
      lastAssembledBy: data.assembledBy
    });
  }

  async verifySetCount(setId: string, data: {
    verifiedBy: string;
    instrumentCounts: { instrumentId: string; actualCount: number }[];
  }): Promise<{ complete: boolean; discrepancies: { instrumentId: string; expected: number; actual: number }[] }> {
    const set = await this.getSurgicalSet(setId);
    if (!set) throw new Error('Set not found');

    const discrepancies: { instrumentId: string; expected: number; actual: number }[] = [];

    for (const count of data.instrumentCounts) {
      const expected = set.instruments.find(i => i.instrumentId === count.instrumentId);
      if (expected && expected.quantity !== count.actualCount) {
        discrepancies.push({
          instrumentId: count.instrumentId,
          expected: expected.quantity,
          actual: count.actualCount
        });
      }
    }

    if (discrepancies.length > 0) {
      await this.updateSurgicalSet(setId, { status: 'incomplete' });
    }

    return {
      complete: discrepancies.length === 0,
      discrepancies
    };
  }

  async listSurgicalSets(filters: {
    status?: SetStatus;
    specialty?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ sets: SurgicalSet[]; total: number }> {
    return SurgicalSetDB.list(this.db, this.organizationId, filters);
  }

  // ==========================================================================
  // Sterilization Cycle Management
  // ==========================================================================

  async startSterilizationCycle(data: {
    sterilizerId: string;
    sterilizerName: string;
    method: SterilizationMethod;
    program: string;
    loadType: SterilizationCycle['loadType'];
    items: CycleItem[];
    parameters: CycleParameters;
    biologicalIndicator?: Omit<BiologicalIndicator, 'id' | 'result'>;
    startedBy: string;
  }): Promise<SterilizationCycle> {
    const cycle: SterilizationCycle = {
      id: this.generateId(),
      organizationId: this.organizationId,
      cycleNumber: await this.generateCycleNumber(),
      sterilizerId: data.sterilizerId,
      sterilizerName: data.sterilizerName,
      method: data.method,
      program: data.program,
      startTime: new Date().toISOString(),
      loadType: data.loadType,
      items: data.items,
      totalItems: data.items.length,
      parameters: data.parameters,
      actualReadings: [],
      biologicalIndicator: data.biologicalIndicator ? {
        id: this.generateId(),
        ...data.biologicalIndicator,
        result: 'pending'
      } : undefined,
      chemicalIndicators: [],
      status: 'running',
      result: 'pending',
      startedBy: data.startedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Update item statuses
    for (const item of data.items) {
      if (item.itemType === 'instrument') {
        await this.updateInstrumentStatus(item.itemId, 'sterilizing');
      } else if (item.itemType === 'set') {
        await this.updateSetStatus(item.itemId, 'in_sterilization');
      }
    }

    await SterilizationCycleDB.create(this.db, cycle);
    return cycle;
  }

  async recordCycleReading(cycleId: string, reading: CycleReading): Promise<SterilizationCycle> {
    const cycle = await this.getSterilizationCycle(cycleId);
    if (!cycle) throw new Error('Cycle not found');

    cycle.actualReadings.push(reading);

    return this.updateCycle(cycleId, { actualReadings: cycle.actualReadings });
  }

  async completeSterilizationCycle(cycleId: string, data: {
    completedBy: string;
    chemicalIndicators: ChemicalIndicator[];
    parametersAchieved: boolean;
    mechanicalSuccess: boolean;
    notes?: string;
  }): Promise<SterilizationCycle> {
    const cycle = await this.getSterilizationCycle(cycleId);
    if (!cycle) throw new Error('Cycle not found');

    cycle.endTime = new Date().toISOString();
    cycle.duration = Math.round(
      (new Date(cycle.endTime).getTime() - new Date(cycle.startTime).getTime()) / 60000
    );
    cycle.completedBy = data.completedBy;
    cycle.chemicalIndicators = data.chemicalIndicators;
    cycle.notes = data.notes;

    // Determine cycle result
    const ciPassed = data.chemicalIndicators.every(ci => ci.result === 'pass');

    if (!data.mechanicalSuccess) {
      cycle.status = 'completed';
      cycle.result = 'failed_mechanical';
    } else if (!data.parametersAchieved) {
      cycle.status = 'completed';
      cycle.result = 'failed_parameters';
    } else if (!ciPassed) {
      cycle.status = 'completed';
      cycle.result = 'failed_ci';
    } else if (cycle.biologicalIndicator) {
      // Wait for BI result
      cycle.status = 'pending_bi';
      cycle.result = 'pending';
    } else {
      cycle.status = 'completed';
      cycle.result = 'passed';
    }

    // Update item statuses based on result
    await this.updateItemsAfterCycle(cycle);

    return this.updateCycle(cycleId, cycle);
  }

  async recordBiResult(cycleId: string, data: {
    result: 'pass' | 'fail';
    readBy: string;
    incubationHours: number;
  }): Promise<SterilizationCycle> {
    const cycle = await this.getSterilizationCycle(cycleId);
    if (!cycle || !cycle.biologicalIndicator) throw new Error('BI not found');

    cycle.biologicalIndicator.result = data.result;
    cycle.biologicalIndicator.readTime = new Date().toISOString();
    cycle.biologicalIndicator.readBy = data.readBy;
    cycle.biologicalIndicator.incubationHours = data.incubationHours;

    if (data.result === 'fail') {
      cycle.status = 'completed';
      cycle.result = 'failed_bi';
      // Initiate recall
      await this.initiateRecall({
        type: 'bi_failure',
        severity: 'critical',
        affectedCycles: [cycleId],
        discoveredBy: data.readBy
      });
    } else if (cycle.result === 'pending') {
      cycle.status = 'completed';
      cycle.result = 'passed';
    }

    // Update item statuses
    await this.updateItemsAfterCycle(cycle);

    return this.updateCycle(cycleId, cycle);
  }

  async releaseCycle(cycleId: string, releasedBy: string): Promise<SterilizationCycle> {
    const cycle = await this.getSterilizationCycle(cycleId);
    if (!cycle) throw new Error('Cycle not found');

    if (cycle.result !== 'passed') {
      throw new Error('Cannot release failed cycle');
    }

    return this.updateCycle(cycleId, {
      status: 'released',
      releasedBy,
      releasedAt: new Date().toISOString()
    });
  }

  private async updateItemsAfterCycle(cycle: SterilizationCycle): Promise<void> {
    const sterileStatus = cycle.result === 'passed' || cycle.result === 'pending';

    for (const item of cycle.items) {
      if (item.itemType === 'instrument') {
        await this.updateInstrumentStatus(
          item.itemId,
          sterileStatus ? 'sterile' : 'quarantine'
        );
      } else if (item.itemType === 'set') {
        await this.updateSetStatus(
          item.itemId,
          sterileStatus ? 'sterile' : 'quarantine'
        );
      }
    }
  }

  async getSterilizationCycle(id: string): Promise<SterilizationCycle | null> {
    return SterilizationCycleDB.getById(this.db, id);
  }

  async updateCycle(id: string, updates: Partial<SterilizationCycle>): Promise<SterilizationCycle> {
    const cycle = await this.getSterilizationCycle(id);
    if (!cycle) throw new Error('Cycle not found');

    const updated: SterilizationCycle = {
      ...cycle,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await SterilizationCycleDB.update(this.db, id, updated);
    return updated;
  }

  async listCycles(filters: {
    status?: CycleStatus;
    sterilizerId?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ cycles: SterilizationCycle[]; total: number }> {
    return SterilizationCycleDB.list(this.db, this.organizationId, filters);
  }

  // ==========================================================================
  // Equipment Management
  // ==========================================================================

  async createEquipment(data: Partial<CSSDEquipment>): Promise<CSSDEquipment> {
    const equipment: CSSDEquipment = {
      id: this.generateId(),
      organizationId: this.organizationId,
      code: data.code || '',
      name: data.name || '',
      type: data.type || 'steam_sterilizer',
      manufacturer: data.manufacturer || '',
      model: data.model || '',
      serialNumber: data.serialNumber || '',
      location: data.location || '',
      zone: data.zone || 'clean',
      capacity: data.capacity || '',
      chamberSize: data.chamberSize,
      programs: data.programs || [],
      status: 'operational',
      lastMaintenanceDate: data.lastMaintenanceDate,
      nextMaintenanceDate: data.nextMaintenanceDate,
      calibrationDueDate: data.calibrationDueDate,
      lastValidationDate: data.lastValidationDate,
      validationDueDate: data.validationDueDate,
      iqOqPqStatus: 'current',
      totalCycles: 0,
      cyclesSinceLastMaintenance: 0,
      manualPath: data.manualPath,
      validationReportPath: data.validationReportPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await EquipmentDB.create(this.db, equipment);
    return equipment;
  }

  async getEquipment(id: string): Promise<CSSDEquipment | null> {
    return EquipmentDB.getById(this.db, id);
  }

  async updateEquipmentStatus(id: string, status: EquipmentStatus): Promise<CSSDEquipment> {
    return this.updateEquipment(id, { status });
  }

  async updateEquipment(id: string, updates: Partial<CSSDEquipment>): Promise<CSSDEquipment> {
    const equipment = await this.getEquipment(id);
    if (!equipment) throw new Error('Equipment not found');

    const updated: CSSDEquipment = {
      ...equipment,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await EquipmentDB.update(this.db, id, updated);
    return updated;
  }

  async recordEquipmentMaintenance(id: string, data: {
    maintenanceType: string;
    performedBy: string;
    findings: string;
    actionsTaken: string;
    nextMaintenanceDate: string;
  }): Promise<CSSDEquipment> {
    const equipment = await this.getEquipment(id);
    if (!equipment) throw new Error('Equipment not found');

    return this.updateEquipment(id, {
      status: 'operational',
      lastMaintenanceDate: new Date().toISOString(),
      nextMaintenanceDate: data.nextMaintenanceDate,
      cyclesSinceLastMaintenance: 0
    });
  }

  async listEquipment(filters: {
    type?: EquipmentType;
    status?: EquipmentStatus;
    page?: number;
    limit?: number;
  }): Promise<{ equipment: CSSDEquipment[]; total: number }> {
    return EquipmentDB.list(this.db, this.organizationId, filters);
  }

  // ==========================================================================
  // Traceability
  // ==========================================================================

  async createTraceabilityRecord(data: {
    itemType: 'instrument' | 'set';
    itemId: string;
    patientId?: string;
    patientName?: string;
    procedureId?: string;
    procedureType?: string;
    surgeonId?: string;
    surgeonName?: string;
    orRoom?: string;
  }): Promise<TraceabilityRecord> {
    const item = data.itemType === 'instrument'
      ? await this.getInstrument(data.itemId)
      : await this.getSurgicalSet(data.itemId);

    if (!item) throw new Error('Item not found');

    const record: TraceabilityRecord = {
      id: this.generateId(),
      organizationId: this.organizationId,
      recordType: data.itemType,
      itemId: data.itemId,
      itemCode: item.code,
      itemName: item.name,
      patientId: data.patientId,
      patientName: data.patientName,
      procedureId: data.procedureId,
      procedureType: data.procedureType,
      surgeonId: data.surgeonId,
      surgeonName: data.surgeonName,
      orRoom: data.orRoom,
      usedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    // Update item status
    if (data.itemType === 'instrument') {
      await this.updateInstrumentStatus(data.itemId, 'in_use');
    } else {
      await this.updateSetStatus(data.itemId, 'in_use');
    }

    await TraceabilityDB.create(this.db, record);
    return record;
  }

  async completeTraceabilityRecord(recordId: string, data: {
    returnedBy: string;
    issues?: TraceabilityIssue[];
  }): Promise<TraceabilityRecord> {
    const record = await TraceabilityDB.getById(this.db, recordId);
    if (!record) throw new Error('Record not found');

    record.returnedAt = new Date().toISOString();
    record.returnedBy = data.returnedBy;

    if (data.issues) {
      record.issuesReported = data.issues;
    }

    // Update item status
    if (record.recordType === 'instrument') {
      await this.updateInstrumentStatus(record.itemId, 'dirty');
    } else {
      await this.updateSetStatus(record.itemId, 'returned_dirty');
    }

    await TraceabilityDB.update(this.db, recordId, record);
    return record;
  }

  async getItemHistory(itemId: string): Promise<TraceabilityRecord[]> {
    return TraceabilityDB.getByItem(this.db, itemId);
  }

  async getPatientInstrumentExposure(patientId: string): Promise<TraceabilityRecord[]> {
    return TraceabilityDB.getByPatient(this.db, patientId);
  }

  // ==========================================================================
  // Recall Management
  // ==========================================================================

  async initiateRecall(data: {
    type: Recall['type'];
    severity: Recall['severity'];
    affectedCycles: string[];
    discoveredBy: string;
    notes?: string;
  }): Promise<Recall> {
    // Identify affected items
    const affectedItems: RecallItem[] = [];

    for (const cycleId of data.affectedCycles) {
      const cycle = await this.getSterilizationCycle(cycleId);
      if (cycle) {
        for (const item of cycle.items) {
          // Check if item was used on a patient
          const history = await this.getItemHistory(item.itemId);
          const usedAfterSterilization = history.filter(h =>
            new Date(h.usedAt) > new Date(cycle.endTime || cycle.startTime)
          );

          affectedItems.push({
            itemType: item.itemType as 'instrument' | 'set',
            itemId: item.itemId,
            itemCode: item.itemCode,
            itemName: item.itemName,
            cycleId,
            wasUsed: usedAfterSterilization.length > 0,
            patientId: usedAfterSterilization[0]?.patientId,
            patientName: usedAfterSterilization[0]?.patientName,
            usedAt: usedAfterSterilization[0]?.usedAt,
            status: 'identified'
          });
        }

        // Mark cycle as recalled
        await this.updateCycle(cycleId, { status: 'recalled' });
      }
    }

    const recall: Recall = {
      id: this.generateId(),
      organizationId: this.organizationId,
      recallNumber: await this.generateRecallNumber(),
      type: data.type,
      severity: data.severity,
      affectedCycles: data.affectedCycles,
      affectedItems,
      discoveredAt: new Date().toISOString(),
      discoveredBy: data.discoveredBy,
      initiatedAt: new Date().toISOString(),
      initiatedBy: data.discoveredBy,
      immediateActions: [],
      correctiveActions: [],
      notifiedParties: [],
      status: 'initiated',
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Quarantine all affected items
    for (const item of affectedItems) {
      if (item.itemType === 'instrument') {
        await this.updateInstrumentStatus(item.itemId, 'quarantine');
      } else {
        await this.updateSetStatus(item.itemId, 'quarantine');
      }
    }

    await RecallDB.create(this.db, recall);
    return recall;
  }

  async updateRecallItemStatus(recallId: string, itemId: string, status: RecallItem['status']): Promise<Recall> {
    const recall = await this.getRecall(recallId);
    if (!recall) throw new Error('Recall not found');

    const itemIndex = recall.affectedItems.findIndex(i => i.itemId === itemId);
    if (itemIndex === -1) throw new Error('Item not in recall');

    recall.affectedItems[itemIndex].status = status;

    return this.updateRecall(recallId, { affectedItems: recall.affectedItems });
  }

  async completeRecall(recallId: string, data: {
    rootCause: string;
    correctiveActions: string[];
  }): Promise<Recall> {
    const recall = await this.getRecall(recallId);
    if (!recall) throw new Error('Recall not found');

    // Verify all items processed
    const allProcessed = recall.affectedItems.every(i =>
      i.status === 'reprocessed' || i.status === 'destroyed'
    );

    if (!allProcessed) {
      throw new Error('Not all items have been processed');
    }

    return this.updateRecall(recallId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      rootCause: data.rootCause,
      correctiveActions: data.correctiveActions
    });
  }

  async getRecall(id: string): Promise<Recall | null> {
    return RecallDB.getById(this.db, id);
  }

  async updateRecall(id: string, updates: Partial<Recall>): Promise<Recall> {
    const recall = await this.getRecall(id);
    if (!recall) throw new Error('Recall not found');

    const updated: Recall = {
      ...recall,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await RecallDB.update(this.db, id, updated);
    return updated;
  }

  // ==========================================================================
  // Dashboard
  // ==========================================================================

  async getDashboard(): Promise<CSSDDashboard> {
    const [instruments, sets, equipment, cycles, recalls] = await Promise.all([
      this.listInstruments({ limit: 1000 }),
      this.listSurgicalSets({ limit: 1000 }),
      this.listEquipment({ limit: 100 }),
      this.listCycles({ fromDate: new Date().toISOString().split('T')[0], limit: 100 }),
      RecallDB.list(this.db, this.organizationId, { status: 'initiated', limit: 10 })
    ]);

    const summary: CSSDSummary = {
      totalInstruments: instruments.total,
      availableInstruments: instruments.instruments.filter(i => i.status === 'available').length,
      inProcessing: instruments.instruments.filter(i =>
        ['dirty', 'decontaminating', 'washing', 'inspecting', 'packaging', 'sterilizing'].includes(i.status)
      ).length,
      sterileInventory: instruments.instruments.filter(i => i.status === 'sterile').length,
      setsAvailable: sets.sets.filter(s => s.status === 'sterile').length,
      cyclesCompletedToday: cycles.cycles.filter(c => c.status === 'completed' || c.status === 'released').length,
      cyclesFailedToday: cycles.cycles.filter(c => c.result?.startsWith('failed')).length,
      pendingBiResults: cycles.cycles.filter(c => c.status === 'pending_bi').length
    };

    const equipmentStatus: EquipmentStatusSummary[] = equipment.equipment.map(e => ({
      equipmentId: e.id,
      name: e.name,
      type: e.type,
      status: e.status
    }));

    const pendingBi = cycles.cycles
      .filter(c => c.biologicalIndicator?.result === 'pending')
      .map(c => c.biologicalIndicator!);

    const maintenanceDue = equipment.equipment.filter(e =>
      e.nextMaintenanceDate && new Date(e.nextMaintenanceDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    // Calculate productivity
    const completedCycles = cycles.cycles.filter(c => c.status === 'completed' || c.status === 'released');
    const totalItems = completedCycles.reduce((sum, c) => sum + c.totalItems, 0);

    const productivityMetrics: ProductivityMetrics = {
      cyclesPerDay: completedCycles.length,
      turnaroundTime: 4, // Average hours - would calculate from actual data
      instrumentsProcessed: totalItems,
      setsProcessed: completedCycles.reduce((sum, c) =>
        sum + c.items.filter(i => i.itemType === 'set').length, 0
      ),
      biPassRate: completedCycles.length > 0
        ? (completedCycles.filter(c => c.biologicalIndicator?.result === 'pass').length / completedCycles.length) * 100
        : 100,
      ciPassRate: completedCycles.length > 0
        ? (completedCycles.filter(c => c.result === 'passed').length / completedCycles.length) * 100
        : 100
    };

    return {
      summary,
      equipmentStatus,
      todayCycles: cycles.cycles,
      pendingBiResults: pendingBi,
      lowStockItems: [], // Would need inventory integration
      maintenanceDue,
      recentRecalls: recalls.recalls,
      productivityMetrics
    };
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private generateId(): string {
    return `cssd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateInstrumentCode(): Promise<string> {
    const count = await InstrumentDB.count(this.db, this.organizationId);
    return `INS-${String(count + 1).padStart(6, '0')}`;
  }

  private async generateSetCode(): Promise<string> {
    const count = await SurgicalSetDB.count(this.db, this.organizationId);
    return `SET-${String(count + 1).padStart(5, '0')}`;
  }

  private async generateCycleNumber(): Promise<string> {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const count = await SterilizationCycleDB.countByDate(this.db, this.organizationId, date);
    return `CYC-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }

  private async generateRecallNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await RecallDB.countByYear(this.db, this.organizationId, year);
    return `RCL-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}

// ============================================================================
// Database Layer (Stubs for D1 Implementation)
// ============================================================================

class InstrumentDB {
  static async create(db: D1Database, instrument: Instrument): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<Instrument | null> { return null; }
  static async getByCode(db: D1Database, orgId: string, code: string): Promise<Instrument | null> { return null; }
  static async update(db: D1Database, id: string, instrument: Instrument): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ instruments: Instrument[]; total: number }> {
    return { instruments: [], total: 0 };
  }
  static async count(db: D1Database, orgId: string): Promise<number> { return 0; }
}

class SurgicalSetDB {
  static async create(db: D1Database, set: SurgicalSet): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<SurgicalSet | null> { return null; }
  static async update(db: D1Database, id: string, set: SurgicalSet): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ sets: SurgicalSet[]; total: number }> {
    return { sets: [], total: 0 };
  }
  static async count(db: D1Database, orgId: string): Promise<number> { return 0; }
}

class SterilizationCycleDB {
  static async create(db: D1Database, cycle: SterilizationCycle): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<SterilizationCycle | null> { return null; }
  static async update(db: D1Database, id: string, cycle: SterilizationCycle): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ cycles: SterilizationCycle[]; total: number }> {
    return { cycles: [], total: 0 };
  }
  static async countByDate(db: D1Database, orgId: string, date: Date): Promise<number> { return 0; }
}

class EquipmentDB {
  static async create(db: D1Database, equipment: CSSDEquipment): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<CSSDEquipment | null> { return null; }
  static async update(db: D1Database, id: string, equipment: CSSDEquipment): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ equipment: CSSDEquipment[]; total: number }> {
    return { equipment: [], total: 0 };
  }
}

class TraceabilityDB {
  static async create(db: D1Database, record: TraceabilityRecord): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<TraceabilityRecord | null> { return null; }
  static async update(db: D1Database, id: string, record: TraceabilityRecord): Promise<void> {}
  static async getByItem(db: D1Database, itemId: string): Promise<TraceabilityRecord[]> { return []; }
  static async getByPatient(db: D1Database, patientId: string): Promise<TraceabilityRecord[]> { return []; }
}

class RecallDB {
  static async create(db: D1Database, recall: Recall): Promise<void> {}
  static async getById(db: D1Database, id: string): Promise<Recall | null> { return null; }
  static async update(db: D1Database, id: string, recall: Recall): Promise<void> {}
  static async list(db: D1Database, orgId: string, filters: any): Promise<{ recalls: Recall[]; total: number }> {
    return { recalls: [], total: 0 };
  }
  static async countByYear(db: D1Database, orgId: string, year: number): Promise<number> { return 0; }
}

export default SterilizationService;
