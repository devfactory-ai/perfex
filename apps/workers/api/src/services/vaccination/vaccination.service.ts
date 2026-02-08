/**
 * Vaccination & Immunisation Service
 *
 * Fonctionnalités:
 * - Carnet vaccinal électronique
 * - Calendrier vaccinal
 * - Rappels automatiques
 * - Certificats de vaccination
 * - Gestion des stocks vaccins
 * - Traçabilité lot/fabricant
 */

// Types pour Vaccination
export interface VaccinationRecord {
  id: string;
  patientId: string;
  vaccineId: string;
  vaccineName: string;
  vaccineType: VaccineType;
  manufacturer: string;
  lotNumber: string;
  expirationDate: Date;
  doseNumber: number;
  totalDosesInSeries: number;
  administrationDate: Date;
  administrationTime: Date;
  administeredBy: string;
  administeredByName: string;
  administrationSite: AdministrationSite;
  administrationRoute: AdministrationRoute;
  doseAmount: number;
  doseUnit: string;
  organizationId: string;
  facilityName: string;
  reasonForVaccination: ReasonForVaccination;
  fundingSource: 'private' | 'public' | 'vfc' | 'other';
  eligibilityCategory?: string;
  visProvided: boolean; // Vaccine Information Statement
  visDate?: Date;
  consentObtained: boolean;
  consentedBy?: string;
  reactions?: VaccineReaction[];
  contraindications?: string[];
  exemptions?: VaccineExemption[];
  deferralReason?: string;
  nextDoseDate?: Date;
  seriesComplete: boolean;
  historicalRecord: boolean;
  sourceOfRecord?: string;
  ndc?: string; // National Drug Code
  cvx?: string; // CDC Vaccine Code
  mvx?: string; // Manufacturer Code
  iisSubmitted: boolean; // Immunization Information System
  iisSubmissionDate?: Date;
  iisAckNumber?: string;
  certificate?: VaccineCertificate;
  createdAt: Date;
  updatedAt: Date;
}

export type VaccineType =
  | 'inactivated' | 'live_attenuated' | 'mrna' | 'viral_vector'
  | 'subunit' | 'toxoid' | 'conjugate' | 'polysaccharide';

export type AdministrationSite =
  | 'left_deltoid' | 'right_deltoid' | 'left_thigh' | 'right_thigh'
  | 'left_gluteal' | 'right_gluteal' | 'oral' | 'intranasal' | 'other';

export type AdministrationRoute =
  | 'intramuscular' | 'subcutaneous' | 'intradermal'
  | 'oral' | 'intranasal' | 'intravenous';

export type ReasonForVaccination =
  | 'routine' | 'catch_up' | 'travel' | 'occupational'
  | 'outbreak_response' | 'post_exposure' | 'high_risk' | 'other';

export interface VaccineReaction {
  id: string;
  reactionType: ReactionType;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  onset: Date;
  duration?: string;
  description: string;
  treatment?: string;
  outcome: 'recovered' | 'recovering' | 'not_recovered' | 'fatal' | 'unknown';
  reportedToVAERS: boolean;
  vaersReportNumber?: string;
  reportedAt: Date;
  reportedBy: string;
}

export type ReactionType =
  | 'local_pain' | 'local_swelling' | 'local_redness'
  | 'fever' | 'fatigue' | 'headache' | 'myalgia'
  | 'nausea' | 'allergic_reaction' | 'anaphylaxis'
  | 'syncope' | 'seizure' | 'other';

export interface VaccineExemption {
  id: string;
  type: 'medical' | 'religious' | 'philosophical';
  vaccineId?: string;
  vaccineName?: string;
  allVaccines: boolean;
  reason: string;
  grantedBy: string;
  grantedDate: Date;
  expirationDate?: Date;
  documentId?: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface VaccineCertificate {
  id: string;
  type: CertificateType;
  issuedAt: Date;
  issuedBy: string;
  validFrom: Date;
  validUntil?: Date;
  qrCode?: string;
  digitalSignature?: string;
  verificationUrl?: string;
  documentId?: string;
}

export type CertificateType =
  | 'standard' | 'international' | 'covid19' | 'yellow_fever' | 'travel';

// Vaccine Schedule
export interface VaccineSchedule {
  id: string;
  vaccineName: string;
  cvxCode: string;
  recommendedAges: AgeRecommendation[];
  catchUpSchedule?: CatchUpSchedule;
  boosterSchedule?: BoosterSchedule;
  contraindications: string[];
  precautions: string[];
  specialPopulations: SpecialPopulationRecommendation[];
  minimumIntervals: DoseInterval[];
  preferredProducts?: string[];
  interchangeability: string[];
  coadministration: CoAdministrationRule[];
  storageRequirements: StorageRequirement;
}

export interface AgeRecommendation {
  doseNumber: number;
  minimumAge: number; // months
  recommendedAge: number; // months
  maximumAge?: number; // months
  notes?: string;
}

export interface CatchUpSchedule {
  minimumAge: number;
  maximumAge: number;
  minimumInterval: number; // days from previous dose
  notes?: string;
}

export interface BoosterSchedule {
  intervals: { years: number; notes?: string }[];
  lifelong: boolean;
}

export interface SpecialPopulationRecommendation {
  population: string;
  recommendation: 'recommended' | 'contraindicated' | 'precaution' | 'consult';
  notes?: string;
}

export interface DoseInterval {
  fromDose: number;
  toDose: number;
  minimumDays: number;
  recommendedDays: number;
}

export interface CoAdministrationRule {
  withVaccine: string;
  allowed: boolean;
  minimumInterval?: number; // days
  notes?: string;
}

export interface StorageRequirement {
  temperatureMin: number;
  temperatureMax: number;
  unit: 'C' | 'F';
  lightSensitive: boolean;
  freezeProtect: boolean;
  shelfLife: number; // months
  oncePuncturedExpiry: number; // hours
}

// Immunization Forecast
export interface ImmunizationForecast {
  patientId: string;
  evaluatedAt: Date;
  patientAge: { years: number; months: number; days: number };
  recommendations: VaccineRecommendation[];
  overdue: VaccineRecommendation[];
  upToDate: string[];
  complete: string[];
  contraindicated: string[];
  nextAppointmentSuggested?: Date;
}

export interface VaccineRecommendation {
  vaccineId: string;
  vaccineName: string;
  cvxCode: string;
  doseNumber: number;
  status: 'due' | 'overdue' | 'upcoming' | 'conditional';
  earliestDate: Date;
  recommendedDate: Date;
  latestDate?: Date;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

// Vaccine Inventory
export interface VaccineInventory {
  id: string;
  vaccineId: string;
  vaccineName: string;
  cvxCode: string;
  ndc: string;
  manufacturer: string;
  mvxCode: string;
  lotNumber: string;
  expirationDate: Date;
  quantityReceived: number;
  quantityOnHand: number;
  quantityUsed: number;
  quantityWasted: number;
  quantityExpired: number;
  quantityTransferred: number;
  unitCost: number;
  fundingSource: 'private' | 'public' | 'vfc';
  storageLocation: string;
  receivedDate: Date;
  receivedBy: string;
  supplierName?: string;
  purchaseOrderNumber?: string;
  status: 'active' | 'expired' | 'recalled' | 'depleted';
  temperatureLog: TemperatureReading[];
  recallInfo?: RecallInfo;
  organizationId: string;
}

export interface TemperatureReading {
  timestamp: Date;
  temperature: number;
  unit: 'C' | 'F';
  inRange: boolean;
  recordedBy?: string;
  excursionAction?: string;
}

export interface RecallInfo {
  recallNumber: string;
  recallDate: Date;
  reason: string;
  classification: 'Class I' | 'Class II' | 'Class III';
  instructions: string;
  affectedLots: string[];
  reportedToManufacturer: boolean;
}

export class VaccinationService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // ==================== VACCINATION RECORDS ====================

  async recordVaccination(data: {
    patientId: string;
    vaccineId: string;
    lotNumber: string;
    administeredBy: string;
    administrationSite: AdministrationSite;
    administrationRoute: AdministrationRoute;
    doseAmount: number;
    doseUnit: string;
    doseNumber?: number;
    reasonForVaccination: ReasonForVaccination;
    fundingSource: 'private' | 'public' | 'vfc' | 'other';
    consentObtained: boolean;
    consentedBy?: string;
    visProvided: boolean;
    visDate?: Date;
    organizationId: string;
  }): Promise<VaccinationRecord> {
    // Get vaccine info
    const vaccine = await this.getVaccineInfo(data.vaccineId);
    const inventory = await this.getInventoryByLot(data.lotNumber);
    const administrator = await this.getAdministratorInfo(data.administeredBy);

    if (!inventory || inventory.quantityOnHand <= 0) {
      throw new Error('Vaccine not available in inventory');
    }

    if (inventory.expirationDate < new Date()) {
      throw new Error('Vaccine lot has expired');
    }

    // Get patient's vaccination history for this vaccine
    const history = await this.getPatientVaccineHistory(data.patientId, data.vaccineId);
    const doseNumber = data.doseNumber || (history.length + 1);

    // Check for contraindications
    const contraindications = await this.checkContraindications(data.patientId, data.vaccineId);
    if (contraindications.length > 0) {
      throw new Error(`Contraindication detected: ${contraindications.join(', ')}`);
    }

    const record: VaccinationRecord = {
      id: crypto.randomUUID(),
      patientId: data.patientId,
      vaccineId: data.vaccineId,
      vaccineName: vaccine.name,
      vaccineType: vaccine.type,
      manufacturer: inventory.manufacturer,
      lotNumber: data.lotNumber,
      expirationDate: inventory.expirationDate,
      doseNumber,
      totalDosesInSeries: vaccine.totalDoses,
      administrationDate: new Date(),
      administrationTime: new Date(),
      administeredBy: data.administeredBy,
      administeredByName: administrator.name,
      administrationSite: data.administrationSite,
      administrationRoute: data.administrationRoute,
      doseAmount: data.doseAmount,
      doseUnit: data.doseUnit,
      organizationId: data.organizationId,
      facilityName: '', // Would fetch
      reasonForVaccination: data.reasonForVaccination,
      fundingSource: data.fundingSource,
      visProvided: data.visProvided,
      visDate: data.visDate,
      consentObtained: data.consentObtained,
      consentedBy: data.consentedBy,
      ndc: inventory.ndc,
      cvx: vaccine.cvxCode,
      mvx: inventory.mvxCode,
      seriesComplete: doseNumber >= vaccine.totalDoses,
      historicalRecord: false,
      iisSubmitted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Calculate next dose date if series not complete
    if (!record.seriesComplete) {
      record.nextDoseDate = await this.calculateNextDoseDate(
        data.vaccineId,
        doseNumber,
        record.administrationDate,
        data.patientId
      );
    }

    // Update inventory
    await this.decrementInventory(data.lotNumber, 1);

    // Save record
    await this.saveVaccinationRecord(record);

    // Submit to IIS if configured
    await this.submitToIIS(record);

    // Schedule reminder for next dose
    if (record.nextDoseDate) {
      await this.scheduleReminder(data.patientId, data.vaccineId, record.nextDoseDate);
    }

    return record;
  }

  async recordHistoricalVaccination(data: {
    patientId: string;
    vaccineId: string;
    vaccineName: string;
    manufacturer?: string;
    lotNumber?: string;
    administrationDate: Date;
    doseNumber: number;
    sourceOfRecord: string;
    recordedBy: string;
    organizationId: string;
  }): Promise<VaccinationRecord> {
    const vaccine = await this.getVaccineInfo(data.vaccineId);

    const record: VaccinationRecord = {
      id: crypto.randomUUID(),
      patientId: data.patientId,
      vaccineId: data.vaccineId,
      vaccineName: data.vaccineName,
      vaccineType: vaccine?.type || 'inactivated',
      manufacturer: data.manufacturer || 'Unknown',
      lotNumber: data.lotNumber || 'Unknown',
      expirationDate: new Date(), // Unknown for historical
      doseNumber: data.doseNumber,
      totalDosesInSeries: vaccine?.totalDoses || data.doseNumber,
      administrationDate: data.administrationDate,
      administrationTime: data.administrationDate,
      administeredBy: data.recordedBy,
      administeredByName: 'Historical Record',
      administrationSite: 'other',
      administrationRoute: 'intramuscular',
      doseAmount: 0,
      doseUnit: 'mL',
      organizationId: data.organizationId,
      facilityName: 'External',
      reasonForVaccination: 'routine',
      fundingSource: 'other',
      visProvided: false,
      consentObtained: false,
      cvx: vaccine?.cvxCode,
      seriesComplete: vaccine ? data.doseNumber >= vaccine.totalDoses : true,
      historicalRecord: true,
      sourceOfRecord: data.sourceOfRecord,
      iisSubmitted: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveVaccinationRecord(record);
    return record;
  }

  async reportReaction(
    recordId: string,
    reaction: Omit<VaccineReaction, 'id' | 'reportedAt' | 'reportedBy'>,
    reportedBy: string
  ): Promise<VaccineReaction> {
    const record = await this.getVaccinationRecord(recordId);
    if (!record) {
      throw new Error('Vaccination record not found');
    }

    const reactionRecord: VaccineReaction = {
      ...reaction,
      id: crypto.randomUUID(),
      reportedAt: new Date(),
      reportedBy
    };

    if (!record.reactions) {
      record.reactions = [];
    }
    record.reactions.push(reactionRecord);
    record.updatedAt = new Date();

    await this.updateVaccinationRecord(record);

    // Auto-submit to VAERS for severe reactions
    if (['severe', 'life_threatening'].includes(reaction.severity)) {
      await this.submitToVAERS(record, reactionRecord);
    }

    return reactionRecord;
  }

  // ==================== IMMUNIZATION FORECAST ====================

  async generateForecast(patientId: string): Promise<ImmunizationForecast> {
    const patient = await this.getPatientInfo(patientId);
    const history = await this.getPatientVaccinationHistory(patientId);
    const exemptions = await this.getPatientExemptions(patientId);
    const contraindications = await this.getPatientContraindications(patientId);

    const age = this.calculateAge(patient.dateOfBirth);
    const schedules = await this.getVaccineSchedules();

    const recommendations: VaccineRecommendation[] = [];
    const overdue: VaccineRecommendation[] = [];
    const upToDate: string[] = [];
    const complete: string[] = [];
    const contraindicatedVaccines: string[] = [];

    const today = new Date();

    for (const schedule of schedules) {
      // Check if contraindicated
      if (this.isContraindicated(schedule.cvxCode, contraindications)) {
        contraindicatedVaccines.push(schedule.vaccineName);
        continue;
      }

      // Check if exempt
      if (this.isExempt(schedule.cvxCode, exemptions)) {
        continue;
      }

      // Get doses received
      const dosesReceived = history.filter(h => h.cvx === schedule.cvxCode).length;

      // Check if series complete
      const totalDoses = schedule.recommendedAges.length;
      if (dosesReceived >= totalDoses) {
        complete.push(schedule.vaccineName);

        // Check if booster needed
        if (schedule.boosterSchedule) {
          const lastDose = history
            .filter(h => h.cvx === schedule.cvxCode)
            .sort((a, b) => b.administrationDate.getTime() - a.administrationDate.getTime())[0];

          const boosterDue = this.checkBoosterDue(lastDose, schedule.boosterSchedule, today);
          if (boosterDue) {
            recommendations.push({
              vaccineId: schedule.id,
              vaccineName: schedule.vaccineName,
              cvxCode: schedule.cvxCode,
              doseNumber: dosesReceived + 1,
              status: boosterDue.overdue ? 'overdue' : 'due',
              earliestDate: boosterDue.earliestDate,
              recommendedDate: boosterDue.recommendedDate,
              reason: 'Booster dose due',
              priority: boosterDue.overdue ? 'high' : 'medium'
            });
          }
        }
        continue;
      }

      // Calculate next dose
      const nextDose = dosesReceived + 1;
      const ageRec = schedule.recommendedAges.find(a => a.doseNumber === nextDose);

      if (!ageRec) continue;

      const ageInMonths = age.years * 12 + age.months;

      // Check minimum age
      if (ageInMonths < ageRec.minimumAge) {
        // Too young, will be upcoming
        const earliestDate = this.addMonths(patient.dateOfBirth, ageRec.minimumAge);
        recommendations.push({
          vaccineId: schedule.id,
          vaccineName: schedule.vaccineName,
          cvxCode: schedule.cvxCode,
          doseNumber: nextDose,
          status: 'upcoming',
          earliestDate,
          recommendedDate: this.addMonths(patient.dateOfBirth, ageRec.recommendedAge),
          reason: `Dose ${nextDose} - patient not yet eligible`,
          priority: 'low'
        });
        continue;
      }

      // Calculate dates
      let earliestDate: Date;
      let recommendedDate: Date;

      if (dosesReceived === 0) {
        earliestDate = this.addMonths(patient.dateOfBirth, ageRec.minimumAge);
        recommendedDate = this.addMonths(patient.dateOfBirth, ageRec.recommendedAge);
      } else {
        const lastDose = history
          .filter(h => h.cvx === schedule.cvxCode)
          .sort((a, b) => b.administrationDate.getTime() - a.administrationDate.getTime())[0];

        const interval = schedule.minimumIntervals.find(i => i.toDose === nextDose);
        if (interval) {
          earliestDate = this.addDays(lastDose.administrationDate, interval.minimumDays);
          recommendedDate = this.addDays(lastDose.administrationDate, interval.recommendedDays);
        } else {
          earliestDate = today;
          recommendedDate = today;
        }
      }

      const isOverdue = recommendedDate < today;
      const status = isOverdue ? 'overdue' : (earliestDate <= today ? 'due' : 'upcoming');

      const rec: VaccineRecommendation = {
        vaccineId: schedule.id,
        vaccineName: schedule.vaccineName,
        cvxCode: schedule.cvxCode,
        doseNumber: nextDose,
        status,
        earliestDate,
        recommendedDate,
        latestDate: ageRec.maximumAge ? this.addMonths(patient.dateOfBirth, ageRec.maximumAge) : undefined,
        reason: `Dose ${nextDose} of ${totalDoses}`,
        priority: isOverdue ? 'high' : 'medium'
      };

      if (isOverdue) {
        overdue.push(rec);
      }
      recommendations.push(rec);

      if (status === 'due' || status === 'overdue') {
        // Not up to date
      } else {
        upToDate.push(schedule.vaccineName);
      }
    }

    // Sort recommendations by priority and date
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.recommendedDate.getTime() - b.recommendedDate.getTime();
    });

    // Suggest next appointment
    const dueDates = recommendations
      .filter(r => r.status === 'due' || r.status === 'overdue')
      .map(r => r.earliestDate);
    const nextAppointmentSuggested = dueDates.length > 0
      ? new Date(Math.max(...dueDates.map(d => d.getTime())))
      : undefined;

    return {
      patientId,
      evaluatedAt: new Date(),
      patientAge: age,
      recommendations,
      overdue,
      upToDate,
      complete,
      contraindicated: contraindicatedVaccines,
      nextAppointmentSuggested
    };
  }

  // ==================== REMINDERS ====================

  async getUpcomingReminders(
    organizationId: string,
    days: number = 30
  ): Promise<{
    patientId: string;
    patientName: string;
    vaccineName: string;
    dueDate: Date;
    doseNumber: number;
    contactInfo: { phone?: string; email?: string };
  }[]> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    // Query for upcoming vaccinations
    return [];
  }

  async sendReminders(organizationId: string): Promise<{
    sent: number;
    failed: number;
    errors: string[];
  }> {
    const reminders = await this.getUpcomingReminders(organizationId, 14);
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const reminder of reminders) {
      try {
        if (reminder.contactInfo.email) {
          await this.sendEmailReminder(reminder);
        }
        if (reminder.contactInfo.phone) {
          await this.sendSMSReminder(reminder);
        }
        sent++;
      } catch (error) {
        failed++;
        errors.push(`Failed to send reminder for patient ${reminder.patientId}: ${error}`);
      }
    }

    return { sent, failed, errors };
  }

  // ==================== CERTIFICATES ====================

  async generateCertificate(
    recordIds: string[],
    type: CertificateType,
    issuedBy: string
  ): Promise<VaccineCertificate> {
    const records = await Promise.all(
      recordIds.map(id => this.getVaccinationRecord(id))
    );

    const validRecords = records.filter(Boolean) as VaccinationRecord[];
    if (validRecords.length === 0) {
      throw new Error('No valid vaccination records found');
    }

    const certificate: VaccineCertificate = {
      id: crypto.randomUUID(),
      type,
      issuedAt: new Date(),
      issuedBy,
      validFrom: new Date(),
      validUntil: type === 'yellow_fever' ? this.addYears(new Date(), 10) : undefined,
      qrCode: await this.generateQRCode(validRecords),
      digitalSignature: await this.signCertificate(validRecords),
      verificationUrl: `https://verify.example.com/${crypto.randomUUID()}`
    };

    // Update records with certificate info
    for (const record of validRecords) {
      record.certificate = certificate;
      record.updatedAt = new Date();
      await this.updateVaccinationRecord(record);
    }

    // Generate PDF document
    const documentId = await this.generateCertificatePDF(certificate, validRecords);
    certificate.documentId = documentId;

    return certificate;
  }

  async verifyCertificate(certificateId: string): Promise<{
    valid: boolean;
    patient?: { name: string; dob: Date };
    vaccinations?: { vaccine: string; date: Date; manufacturer: string }[];
    message?: string;
  }> {
    // Verify digital signature and return certificate details
    return { valid: true };
  }

  // ==================== INVENTORY ====================

  async receiveInventory(data: {
    vaccineId: string;
    ndc: string;
    manufacturer: string;
    mvxCode: string;
    lotNumber: string;
    expirationDate: Date;
    quantity: number;
    unitCost: number;
    fundingSource: 'private' | 'public' | 'vfc';
    storageLocation: string;
    supplierName?: string;
    purchaseOrderNumber?: string;
    receivedBy: string;
    organizationId: string;
  }): Promise<VaccineInventory> {
    const vaccine = await this.getVaccineInfo(data.vaccineId);

    const inventory: VaccineInventory = {
      id: crypto.randomUUID(),
      vaccineId: data.vaccineId,
      vaccineName: vaccine.name,
      cvxCode: vaccine.cvxCode,
      ndc: data.ndc,
      manufacturer: data.manufacturer,
      mvxCode: data.mvxCode,
      lotNumber: data.lotNumber,
      expirationDate: data.expirationDate,
      quantityReceived: data.quantity,
      quantityOnHand: data.quantity,
      quantityUsed: 0,
      quantityWasted: 0,
      quantityExpired: 0,
      quantityTransferred: 0,
      unitCost: data.unitCost,
      fundingSource: data.fundingSource,
      storageLocation: data.storageLocation,
      receivedDate: new Date(),
      receivedBy: data.receivedBy,
      supplierName: data.supplierName,
      purchaseOrderNumber: data.purchaseOrderNumber,
      status: 'active',
      temperatureLog: [],
      organizationId: data.organizationId
    };

    await this.saveInventory(inventory);
    return inventory;
  }

  async recordTemperature(
    inventoryId: string,
    temperature: number,
    unit: 'C' | 'F',
    recordedBy: string
  ): Promise<void> {
    const inventory = await this.getInventory(inventoryId);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    const vaccine = await this.getVaccineSchedule(inventory.cvxCode);
    const storage = vaccine?.storageRequirements;

    let tempC = unit === 'C' ? temperature : (temperature - 32) * 5/9;
    const inRange = storage
      ? tempC >= storage.temperatureMin && tempC <= storage.temperatureMax
      : true;

    const reading: TemperatureReading = {
      timestamp: new Date(),
      temperature,
      unit,
      inRange,
      recordedBy
    };

    if (!inRange) {
      reading.excursionAction = 'Temperature excursion detected - investigate immediately';
      await this.alertTemperatureExcursion(inventory, reading);
    }

    inventory.temperatureLog.push(reading);
    await this.updateInventory(inventory);
  }

  async reportWastage(
    lotNumber: string,
    quantity: number,
    reason: string,
    reportedBy: string
  ): Promise<void> {
    const inventory = await this.getInventoryByLot(lotNumber);
    if (!inventory) {
      throw new Error('Inventory not found');
    }

    inventory.quantityWasted += quantity;
    inventory.quantityOnHand -= quantity;

    if (inventory.quantityOnHand <= 0) {
      inventory.status = 'depleted';
    }

    await this.updateInventory(inventory);
    await this.logInventoryEvent(inventory.id, 'wastage', reportedBy, { quantity, reason });
  }

  async checkExpiringSoon(
    organizationId: string,
    days: number = 30
  ): Promise<VaccineInventory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() + days);

    return this.getExpiringInventory(organizationId, cutoffDate);
  }

  async handleRecall(
    recallInfo: RecallInfo,
    organizationId: string
  ): Promise<{
    affectedInventory: VaccineInventory[];
    affectedPatients: { patientId: string; recordId: string; vaccineName: string }[];
  }> {
    // Find affected inventory
    const affectedInventory = await this.getInventoryByLots(
      recallInfo.affectedLots,
      organizationId
    );

    // Update inventory status
    for (const inv of affectedInventory) {
      inv.status = 'recalled';
      inv.recallInfo = recallInfo;
      await this.updateInventory(inv);
    }

    // Find patients who received affected vaccines
    const affectedPatients = await this.getPatientsByLots(recallInfo.affectedLots);

    // Notify patients and providers
    await this.notifyRecall(recallInfo, affectedInventory, affectedPatients);

    return { affectedInventory, affectedPatients };
  }

  // ==================== REPORTING ====================

  async getCoverageReport(
    organizationId: string,
    ageGroup: { minMonths: number; maxMonths: number },
    vaccineIds?: string[]
  ): Promise<{
    totalPatients: number;
    vaccinesCoverage: {
      vaccineName: string;
      cvxCode: string;
      fullyVaccinated: number;
      partiallyVaccinated: number;
      notVaccinated: number;
      coverageRate: number;
    }[];
    overallCoverageRate: number;
  }> {
    // Generate coverage report for population health
    return {
      totalPatients: 0,
      vaccinesCoverage: [],
      overallCoverageRate: 0
    };
  }

  async getAdministrationReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalAdministered: number;
    byVaccine: { vaccine: string; count: number }[];
    byFundingSource: { source: string; count: number }[];
    byProvider: { provider: string; count: number }[];
    wastedDoses: number;
    reactions: number;
  }> {
    // Generate administration statistics
    return {
      totalAdministered: 0,
      byVaccine: [],
      byFundingSource: [],
      byProvider: [],
      wastedDoses: 0,
      reactions: 0
    };
  }

  // ==================== HELPER METHODS ====================

  private calculateAge(dob: Date): { years: number; months: number; days: number } {
    const today = new Date();
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }

    return { years, months, days };
  }

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private addYears(date: Date, years: number): Date {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + years);
    return result;
  }

  private isContraindicated(cvxCode: string, contraindications: string[]): boolean {
    return contraindications.includes(cvxCode);
  }

  private isExempt(cvxCode: string, exemptions: VaccineExemption[]): boolean {
    return exemptions.some(e =>
      (e.allVaccines || e.vaccineId === cvxCode) && e.status === 'active'
    );
  }

  private checkBoosterDue(
    lastDose: VaccinationRecord,
    boosterSchedule: BoosterSchedule,
    today: Date
  ): { overdue: boolean; earliestDate: Date; recommendedDate: Date } | null {
    for (const interval of boosterSchedule.intervals) {
      const dueDate = this.addYears(lastDose.administrationDate, interval.years);
      if (dueDate <= today) {
        return {
          overdue: dueDate < today,
          earliestDate: dueDate,
          recommendedDate: dueDate
        };
      }
    }
    return null;
  }

  // Database stubs
  private async saveVaccinationRecord(record: VaccinationRecord): Promise<void> {}
  private async updateVaccinationRecord(record: VaccinationRecord): Promise<void> {}
  private async getVaccinationRecord(id: string): Promise<VaccinationRecord | null> { return null; }
  private async getPatientVaccinationHistory(patientId: string): Promise<VaccinationRecord[]> { return []; }
  private async getPatientVaccineHistory(patientId: string, vaccineId: string): Promise<VaccinationRecord[]> { return []; }
  private async getVaccineInfo(id: string): Promise<any> { return {}; }
  private async getVaccineSchedule(cvxCode: string): Promise<VaccineSchedule | null> { return null; }
  private async getVaccineSchedules(): Promise<VaccineSchedule[]> { return []; }
  private async getPatientInfo(id: string): Promise<any> { return {}; }
  private async getPatientExemptions(patientId: string): Promise<VaccineExemption[]> { return []; }
  private async getPatientContraindications(patientId: string): Promise<string[]> { return []; }
  private async checkContraindications(patientId: string, vaccineId: string): Promise<string[]> { return []; }
  private async getInventoryByLot(lotNumber: string): Promise<VaccineInventory | null> { return null; }
  private async getAdministratorInfo(id: string): Promise<any> { return {}; }
  private async decrementInventory(lotNumber: string, quantity: number): Promise<void> {}
  private async calculateNextDoseDate(vaccineId: string, doseNumber: number, adminDate: Date, patientId: string): Promise<Date> { return new Date(); }
  private async scheduleReminder(patientId: string, vaccineId: string, date: Date): Promise<void> {}
  private async submitToIIS(record: VaccinationRecord): Promise<void> {}
  private async submitToVAERS(record: VaccinationRecord, reaction: VaccineReaction): Promise<void> {}
  private async sendEmailReminder(reminder: any): Promise<void> {}
  private async sendSMSReminder(reminder: any): Promise<void> {}
  private async generateQRCode(records: VaccinationRecord[]): Promise<string> { return ''; }
  private async signCertificate(records: VaccinationRecord[]): Promise<string> { return ''; }
  private async generateCertificatePDF(cert: VaccineCertificate, records: VaccinationRecord[]): Promise<string> { return ''; }
  private async saveInventory(inventory: VaccineInventory): Promise<void> {}
  private async updateInventory(inventory: VaccineInventory): Promise<void> {}
  private async getInventory(id: string): Promise<VaccineInventory | null> { return null; }
  private async getExpiringInventory(orgId: string, cutoff: Date): Promise<VaccineInventory[]> { return []; }
  private async getInventoryByLots(lots: string[], orgId: string): Promise<VaccineInventory[]> { return []; }
  private async getPatientsByLots(lots: string[]): Promise<any[]> { return []; }
  private async alertTemperatureExcursion(inventory: VaccineInventory, reading: TemperatureReading): Promise<void> {}
  private async logInventoryEvent(id: string, event: string, userId: string, data: any): Promise<void> {}
  private async notifyRecall(info: RecallInfo, inventory: VaccineInventory[], patients: any[]): Promise<void> {}
}

export default VaccinationService;
