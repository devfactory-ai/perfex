/**
 * E-Prescribing Service - Gestion Complète des Ordonnances
 *
 * Fonctionnalités:
 * - Création et gestion des ordonnances
 * - Vérification des interactions médicamenteuses
 * - Contrôle des posologies et contre-indications
 * - Support DCI (Dénomination Commune Internationale) et marques
 * - Ordonnances sécurisées et bizone
 * - Historique des prescriptions
 * - Alertes allergies et interactions
 */

// Types pour E-Prescribing
export interface Medication {
  id: string;
  name: string;
  dci: string; // Dénomination Commune Internationale
  brandNames: string[];
  atcCode: string; // Classification ATC
  form: MedicationForm;
  strength: string;
  unit: string;
  routeOfAdministration: RouteOfAdministration;
  activeIngredients: ActiveIngredient[];
  contraindications: string[];
  sideEffects: string[];
  interactions: DrugInteraction[];
  pregnancyCategory: PregnancyCategory;
  controlledSubstance: boolean;
  controlledSchedule?: string;
  requiresSpecialPrescription: boolean;
  maxDailyDose?: number;
  maxDailyDoseUnit?: string;
}

export type MedicationForm =
  | 'tablet' | 'capsule' | 'syrup' | 'solution' | 'suspension'
  | 'injection' | 'cream' | 'ointment' | 'gel' | 'patch'
  | 'inhaler' | 'spray' | 'drops' | 'suppository' | 'powder';

export type RouteOfAdministration =
  | 'oral' | 'sublingual' | 'intravenous' | 'intramuscular' | 'subcutaneous'
  | 'topical' | 'transdermal' | 'inhalation' | 'nasal' | 'ophthalmic'
  | 'otic' | 'rectal' | 'vaginal' | 'intrathecal';

export interface ActiveIngredient {
  name: string;
  dci: string;
  strength: number;
  unit: string;
}

export interface DrugInteraction {
  drugId: string;
  drugName: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  clinicalEffect: string;
  recommendation: string;
  evidenceLevel: 'established' | 'probable' | 'suspected' | 'possible';
}

export type PregnancyCategory = 'A' | 'B' | 'C' | 'D' | 'X';

export interface Prescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  prescriberId: string;
  prescriberName: string;
  prescriberSpecialty: string;
  prescriberRpps: string; // Numéro RPPS
  organizationId: string;
  type: PrescriptionType;
  status: PrescriptionStatus;
  items: PrescriptionItem[];
  validFrom: Date;
  validUntil: Date;
  renewals: number;
  renewalsRemaining: number;
  isSecure: boolean; // Ordonnance sécurisée
  isBizone: boolean; // Ordonnance bizone (ALD)
  aldNumber?: string;
  diagnosis?: string;
  icdCodes?: string[];
  notes?: string;
  pharmacyNotes?: string;
  dispensingInstructions?: string;
  substitutionAllowed: boolean;
  electronicSignature?: string;
  signedAt?: Date;
  printedAt?: Date;
  sentToPharmacy?: boolean;
  pharmacyId?: string;
  alerts: PrescriptionAlert[];
  createdAt: Date;
  updatedAt: Date;
}

export type PrescriptionType =
  | 'standard' | 'secure' | 'bizone' | 'hospital' | 'exceptional'
  | 'chronic' | 'acute' | 'renewal';

export type PrescriptionStatus =
  | 'draft' | 'pending_signature' | 'signed' | 'sent' | 'dispensed'
  | 'partially_dispensed' | 'cancelled' | 'expired' | 'on_hold';

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicationId: string;
  medicationName: string;
  dci: string;
  form: MedicationForm;
  strength: string;
  dosage: Dosage;
  quantity: number;
  quantityUnit: string;
  duration: number;
  durationUnit: 'days' | 'weeks' | 'months';
  refills: number;
  substitutionAllowed: boolean;
  isGenericAllowed: boolean;
  specialInstructions?: string;
  indication?: string;
  route: RouteOfAdministration;
  frequency: string;
  timing: MedicationTiming[];
  startDate?: Date;
  endDate?: Date;
  prn: boolean; // Pro re nata (as needed)
  prnReason?: string;
  maxDailyDose?: number;
  alerts: ItemAlert[];
  dispensingHistory: DispensingRecord[];
}

export interface Dosage {
  amount: number;
  unit: string;
  frequency: DosageFrequency;
  customFrequency?: string;
  maxDailyDose?: number;
  minInterval?: number; // minutes between doses
}

export type DosageFrequency =
  | 'once_daily' | 'twice_daily' | 'three_times_daily' | 'four_times_daily'
  | 'every_4_hours' | 'every_6_hours' | 'every_8_hours' | 'every_12_hours'
  | 'weekly' | 'biweekly' | 'monthly' | 'as_needed' | 'custom';

export interface MedicationTiming {
  time: 'morning' | 'noon' | 'evening' | 'bedtime' | 'specific';
  specificTime?: string;
  withFood: boolean;
  beforeMeal: boolean;
  afterMeal: boolean;
}

export interface ItemAlert {
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  details?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  overrideReason?: string;
}

export type AlertType =
  | 'allergy' | 'interaction' | 'contraindication' | 'duplicate_therapy'
  | 'dose_too_high' | 'dose_too_low' | 'renal_adjustment' | 'hepatic_adjustment'
  | 'age_warning' | 'pregnancy' | 'lactation' | 'weight_based';

export interface PrescriptionAlert {
  id: string;
  type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  itemId?: string;
  message: string;
  details: string;
  recommendation?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  overrideReason?: string;
}

export interface DispensingRecord {
  id: string;
  prescriptionItemId: string;
  pharmacyId: string;
  pharmacyName: string;
  pharmacistId: string;
  pharmacistName: string;
  quantityDispensed: number;
  dispensedMedicationId?: string;
  dispensedMedicationName?: string;
  isSubstitution: boolean;
  substitutionReason?: string;
  dispensedAt: Date;
  lotNumber?: string;
  expirationDate?: Date;
  patientCounseling?: string;
  copayAmount?: number;
  insurancePaid?: number;
}

export interface PatientMedicationProfile {
  patientId: string;
  allergies: DrugAllergy[];
  currentMedications: CurrentMedication[];
  pastMedications: PastMedication[];
  conditions: MedicalCondition[];
  renalFunction?: RenalFunction;
  hepaticFunction?: HepaticFunction;
  weight?: number;
  height?: number;
  age: number;
  isPregnant: boolean;
  isLactating: boolean;
  geneticMarkers?: GeneticMarker[];
}

export interface DrugAllergy {
  id: string;
  allergen: string;
  allergenType: 'drug' | 'drug_class' | 'ingredient';
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  onsetDate?: Date;
  verified: boolean;
  verifiedBy?: string;
  notes?: string;
}

export interface CurrentMedication {
  medicationId: string;
  medicationName: string;
  dci: string;
  dosage: string;
  frequency: string;
  prescriberId?: string;
  startDate: Date;
  source: 'prescribed' | 'otc' | 'reported';
}

export interface PastMedication {
  medicationId: string;
  medicationName: string;
  startDate: Date;
  endDate: Date;
  discontinuationReason?: string;
  wasEffective?: boolean;
  sideEffectsExperienced?: string[];
}

export interface MedicalCondition {
  icdCode: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  diagnosisDate: Date;
  isActive: boolean;
}

export interface RenalFunction {
  creatinine: number;
  egfr: number;
  ckdStage?: 1 | 2 | 3 | 4 | 5;
  onDialysis: boolean;
  measurementDate: Date;
}

export interface HepaticFunction {
  childPughScore?: 'A' | 'B' | 'C';
  meldScore?: number;
  alt?: number;
  ast?: number;
  bilirubin?: number;
  measurementDate: Date;
}

export interface GeneticMarker {
  gene: string;
  variant: string;
  phenotype: string;
  implications: string[];
}

export interface InteractionCheckResult {
  hasInteractions: boolean;
  interactions: DetectedInteraction[];
  allergyAlerts: AllergyAlert[];
  contraindications: ContraindicationAlert[];
  dosageAlerts: DosageAlert[];
  duplicateTherapyAlerts: DuplicateTherapyAlert[];
  overallRisk: 'low' | 'moderate' | 'high' | 'critical';
  canProceed: boolean;
  requiresOverride: boolean;
}

export interface DetectedInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  clinicalEffect: string;
  mechanism?: string;
  recommendation: string;
  managementOptions: string[];
  monitoringRequired?: string[];
  evidenceLevel: string;
  references?: string[];
}

export interface AllergyAlert {
  allergen: string;
  medication: string;
  matchType: 'exact' | 'cross_reactivity' | 'class';
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  previousReaction?: string;
  recommendation: string;
}

export interface ContraindicationAlert {
  medication: string;
  condition: string;
  severity: 'relative' | 'absolute';
  description: string;
  recommendation: string;
}

export interface DosageAlert {
  medication: string;
  alertType: 'too_high' | 'too_low' | 'renal_adjustment' | 'hepatic_adjustment' | 'age_adjustment';
  currentDose: string;
  recommendedDose: string;
  reason: string;
  adjustmentFactor?: number;
}

export interface DuplicateTherapyAlert {
  medication1: string;
  medication2: string;
  therapeuticClass: string;
  recommendation: string;
}

export interface MedicationFormulary {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  medications: FormularyMedication[];
  tierStructure: FormularyTier[];
  effectiveDate: Date;
  expirationDate?: Date;
  isActive: boolean;
}

export interface FormularyMedication {
  medicationId: string;
  tier: number;
  restrictions?: FormularyRestriction[];
  priorAuthRequired: boolean;
  stepTherapyRequired: boolean;
  quantityLimits?: QuantityLimit;
  preferredAlternatives?: string[];
}

export interface FormularyTier {
  tier: number;
  name: string;
  description: string;
  copayAmount?: number;
  coinsurancePercent?: number;
}

export interface FormularyRestriction {
  type: 'age' | 'diagnosis' | 'prior_auth' | 'step_therapy' | 'quantity_limit';
  description: string;
  criteria?: string;
}

export interface QuantityLimit {
  quantity: number;
  period: 'day' | 'week' | 'month' | 'fill';
  maxFills?: number;
}

export class EPrescribingService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  // ==================== PRESCRIPTION MANAGEMENT ====================

  async createPrescription(data: {
    patientId: string;
    prescriberId: string;
    type: PrescriptionType;
    items: Omit<PrescriptionItem, 'id' | 'prescriptionId' | 'alerts' | 'dispensingHistory'>[];
    validUntil?: Date;
    renewals?: number;
    isSecure?: boolean;
    isBizone?: boolean;
    aldNumber?: string;
    diagnosis?: string;
    icdCodes?: string[];
    notes?: string;
    substitutionAllowed?: boolean;
  }): Promise<{ prescription: Prescription; safetyCheck: InteractionCheckResult }> {
    // Get patient profile for safety checks
    const patientProfile = await this.getPatientMedicationProfile(data.patientId);

    // Perform comprehensive safety check
    const medications = data.items.map(item => item.medicationId);
    const safetyCheck = await this.performSafetyCheck(patientProfile, medications, data.items);

    const prescriptionId = crypto.randomUUID();
    const prescriptionNumber = await this.generatePrescriptionNumber();

    // Get prescriber info
    const prescriber = await this.getPrescriberInfo(data.prescriberId);

    const prescription: Prescription = {
      id: prescriptionId,
      prescriptionNumber,
      patientId: data.patientId,
      prescriberId: data.prescriberId,
      prescriberName: prescriber.name,
      prescriberSpecialty: prescriber.specialty,
      prescriberRpps: prescriber.rpps,
      organizationId: prescriber.organizationId,
      type: data.type,
      status: 'draft',
      items: data.items.map((item, index) => ({
        ...item,
        id: crypto.randomUUID(),
        prescriptionId,
        alerts: this.extractItemAlerts(safetyCheck, item.medicationId),
        dispensingHistory: []
      })),
      validFrom: new Date(),
      validUntil: data.validUntil || this.calculateDefaultValidity(data.type),
      renewals: data.renewals || 0,
      renewalsRemaining: data.renewals || 0,
      isSecure: data.isSecure || this.requiresSecurePrescription(data.items),
      isBizone: data.isBizone || false,
      aldNumber: data.aldNumber,
      diagnosis: data.diagnosis,
      icdCodes: data.icdCodes,
      notes: data.notes,
      substitutionAllowed: data.substitutionAllowed ?? true,
      alerts: this.extractPrescriptionAlerts(safetyCheck),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to database
    await this.savePrescription(prescription);

    return { prescription, safetyCheck };
  }

  async signPrescription(
    prescriptionId: string,
    prescriberId: string,
    signature: string,
    overrides?: { alertId: string; reason: string }[]
  ): Promise<Prescription> {
    const prescription = await this.getPrescription(prescriptionId);

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (prescription.prescriberId !== prescriberId) {
      throw new Error('Only the prescriber can sign this prescription');
    }

    // Check for unacknowledged critical alerts
    const criticalAlerts = prescription.alerts.filter(
      a => a.severity === 'critical' && !a.acknowledged
    );

    if (criticalAlerts.length > 0 && (!overrides || overrides.length < criticalAlerts.length)) {
      throw new Error('All critical alerts must be acknowledged before signing');
    }

    // Process overrides
    if (overrides) {
      for (const override of overrides) {
        const alert = prescription.alerts.find(a => a.id === override.alertId);
        if (alert) {
          alert.acknowledged = true;
          alert.acknowledgedBy = prescriberId;
          alert.acknowledgedAt = new Date();
          alert.overrideReason = override.reason;
        }
      }
    }

    prescription.status = 'signed';
    prescription.electronicSignature = signature;
    prescription.signedAt = new Date();
    prescription.updatedAt = new Date();

    await this.updatePrescription(prescription);

    // Log audit trail
    await this.logPrescriptionEvent(prescriptionId, 'signed', prescriberId, { overrides });

    return prescription;
  }

  async sendToPharmacy(
    prescriptionId: string,
    pharmacyId: string,
    sendMethod: 'electronic' | 'fax' | 'print'
  ): Promise<{ success: boolean; confirmationNumber?: string }> {
    const prescription = await this.getPrescription(prescriptionId);

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (prescription.status !== 'signed') {
      throw new Error('Prescription must be signed before sending');
    }

    // Validate pharmacy
    const pharmacy = await this.getPharmacyInfo(pharmacyId);
    if (!pharmacy) {
      throw new Error('Pharmacy not found');
    }

    let confirmationNumber: string | undefined;

    switch (sendMethod) {
      case 'electronic':
        confirmationNumber = await this.sendElectronically(prescription, pharmacy);
        break;
      case 'fax':
        confirmationNumber = await this.sendViaFax(prescription, pharmacy);
        break;
      case 'print':
        // Mark as ready for print/pickup
        break;
    }

    prescription.status = 'sent';
    prescription.sentToPharmacy = true;
    prescription.pharmacyId = pharmacyId;
    prescription.updatedAt = new Date();

    await this.updatePrescription(prescription);
    await this.logPrescriptionEvent(prescriptionId, 'sent_to_pharmacy', prescription.prescriberId, {
      pharmacyId,
      sendMethod,
      confirmationNumber
    });

    return { success: true, confirmationNumber };
  }

  async renewPrescription(
    originalPrescriptionId: string,
    prescriberId: string,
    modifications?: Partial<PrescriptionItem>[]
  ): Promise<Prescription> {
    const original = await this.getPrescription(originalPrescriptionId);

    if (!original) {
      throw new Error('Original prescription not found');
    }

    if (original.renewalsRemaining <= 0) {
      throw new Error('No renewals remaining for this prescription');
    }

    // Create new prescription based on original
    const { prescription } = await this.createPrescription({
      patientId: original.patientId,
      prescriberId,
      type: 'renewal',
      items: original.items.map((item, index) => {
        const modification = modifications?.find((m, i) => i === index);
        return {
          medicationId: item.medicationId,
          medicationName: item.medicationName,
          dci: item.dci,
          form: item.form,
          strength: item.strength,
          dosage: modification?.dosage || item.dosage,
          quantity: modification?.quantity || item.quantity,
          quantityUnit: item.quantityUnit,
          duration: modification?.duration || item.duration,
          durationUnit: item.durationUnit,
          refills: 0,
          substitutionAllowed: item.substitutionAllowed,
          isGenericAllowed: item.isGenericAllowed,
          specialInstructions: item.specialInstructions,
          indication: item.indication,
          route: item.route,
          frequency: item.frequency,
          timing: item.timing,
          prn: item.prn,
          prnReason: item.prnReason
        };
      }),
      isSecure: original.isSecure,
      isBizone: original.isBizone,
      aldNumber: original.aldNumber,
      diagnosis: original.diagnosis,
      icdCodes: original.icdCodes,
      substitutionAllowed: original.substitutionAllowed
    });

    // Update original prescription renewals
    original.renewalsRemaining -= 1;
    original.updatedAt = new Date();
    await this.updatePrescription(original);

    return prescription;
  }

  async cancelPrescription(
    prescriptionId: string,
    cancelledBy: string,
    reason: string
  ): Promise<void> {
    const prescription = await this.getPrescription(prescriptionId);

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    if (['dispensed', 'cancelled'].includes(prescription.status)) {
      throw new Error('Cannot cancel a prescription that has been dispensed or is already cancelled');
    }

    prescription.status = 'cancelled';
    prescription.updatedAt = new Date();

    await this.updatePrescription(prescription);

    // If sent to pharmacy, notify pharmacy of cancellation
    if (prescription.sentToPharmacy && prescription.pharmacyId) {
      await this.notifyPharmacyCancellation(prescription.pharmacyId, prescriptionId);
    }

    await this.logPrescriptionEvent(prescriptionId, 'cancelled', cancelledBy, { reason });
  }

  // ==================== SAFETY CHECKS ====================

  async performSafetyCheck(
    patientProfile: PatientMedicationProfile,
    newMedications: string[],
    prescriptionItems: any[]
  ): Promise<InteractionCheckResult> {
    const result: InteractionCheckResult = {
      hasInteractions: false,
      interactions: [],
      allergyAlerts: [],
      contraindications: [],
      dosageAlerts: [],
      duplicateTherapyAlerts: [],
      overallRisk: 'low',
      canProceed: true,
      requiresOverride: false
    };

    // 1. Check drug-drug interactions
    const allMedications = [
      ...patientProfile.currentMedications.map(m => m.medicationId),
      ...newMedications
    ];
    result.interactions = await this.checkDrugInteractions(allMedications);

    // 2. Check allergies
    for (const medId of newMedications) {
      const allergyAlerts = await this.checkAllergies(patientProfile.allergies, medId);
      result.allergyAlerts.push(...allergyAlerts);
    }

    // 3. Check contraindications
    for (const medId of newMedications) {
      const contraindications = await this.checkContraindications(
        patientProfile.conditions,
        medId,
        patientProfile
      );
      result.contraindications.push(...contraindications);
    }

    // 4. Check dosages
    for (const item of prescriptionItems) {
      const dosageAlerts = await this.checkDosage(item, patientProfile);
      result.dosageAlerts.push(...dosageAlerts);
    }

    // 5. Check duplicate therapy
    result.duplicateTherapyAlerts = await this.checkDuplicateTherapy(
      patientProfile.currentMedications,
      newMedications
    );

    // Calculate overall risk
    result.hasInteractions = result.interactions.length > 0 ||
      result.allergyAlerts.length > 0 ||
      result.contraindications.length > 0;

    result.overallRisk = this.calculateOverallRisk(result);
    result.canProceed = result.overallRisk !== 'critical';
    result.requiresOverride = result.overallRisk === 'high' || result.overallRisk === 'critical';

    return result;
  }

  private async checkDrugInteractions(medicationIds: string[]): Promise<DetectedInteraction[]> {
    const interactions: DetectedInteraction[] = [];

    // Check each pair of medications
    for (let i = 0; i < medicationIds.length; i++) {
      for (let j = i + 1; j < medicationIds.length; j++) {
        const interaction = await this.getInteractionBetween(medicationIds[i], medicationIds[j]);
        if (interaction) {
          interactions.push(interaction);
        }
      }
    }

    return interactions;
  }

  private async checkAllergies(
    allergies: DrugAllergy[],
    medicationId: string
  ): Promise<AllergyAlert[]> {
    const alerts: AllergyAlert[] = [];
    const medication = await this.getMedication(medicationId);

    if (!medication) return alerts;

    for (const allergy of allergies) {
      // Check exact match
      if (allergy.allergenType === 'drug' &&
          (medication.name.toLowerCase().includes(allergy.allergen.toLowerCase()) ||
           medication.dci.toLowerCase().includes(allergy.allergen.toLowerCase()))) {
        alerts.push({
          allergen: allergy.allergen,
          medication: medication.name,
          matchType: 'exact',
          severity: allergy.severity,
          previousReaction: allergy.reaction,
          recommendation: `AVOID: Patient has documented allergy to ${allergy.allergen}`
        });
      }

      // Check drug class
      if (allergy.allergenType === 'drug_class') {
        // Check ATC code for class match
        const isClassMatch = await this.checkDrugClassMatch(medication.atcCode, allergy.allergen);
        if (isClassMatch) {
          alerts.push({
            allergen: allergy.allergen,
            medication: medication.name,
            matchType: 'class',
            severity: allergy.severity,
            previousReaction: allergy.reaction,
            recommendation: `CAUTION: Patient allergic to ${allergy.allergen} drug class`
          });
        }
      }

      // Check ingredients
      if (allergy.allergenType === 'ingredient') {
        const hasIngredient = medication.activeIngredients.some(
          ing => ing.name.toLowerCase().includes(allergy.allergen.toLowerCase()) ||
                 ing.dci.toLowerCase().includes(allergy.allergen.toLowerCase())
        );
        if (hasIngredient) {
          alerts.push({
            allergen: allergy.allergen,
            medication: medication.name,
            matchType: 'exact',
            severity: allergy.severity,
            previousReaction: allergy.reaction,
            recommendation: `AVOID: Contains ${allergy.allergen}`
          });
        }
      }
    }

    return alerts;
  }

  private async checkContraindications(
    conditions: MedicalCondition[],
    medicationId: string,
    profile: PatientMedicationProfile
  ): Promise<ContraindicationAlert[]> {
    const alerts: ContraindicationAlert[] = [];
    const medication = await this.getMedication(medicationId);

    if (!medication) return alerts;

    // Check pregnancy
    if (profile.isPregnant && ['D', 'X'].includes(medication.pregnancyCategory)) {
      alerts.push({
        medication: medication.name,
        condition: 'Pregnancy',
        severity: medication.pregnancyCategory === 'X' ? 'absolute' : 'relative',
        description: `Pregnancy category ${medication.pregnancyCategory}`,
        recommendation: medication.pregnancyCategory === 'X'
          ? 'CONTRAINDICATED in pregnancy'
          : 'Use only if benefits outweigh risks'
      });
    }

    // Check lactation
    if (profile.isLactating) {
      // Check lactation safety database
      const lactationSafety = await this.checkLactationSafety(medicationId);
      if (lactationSafety && !lactationSafety.isSafe) {
        alerts.push({
          medication: medication.name,
          condition: 'Lactation',
          severity: lactationSafety.severity as 'relative' | 'absolute',
          description: lactationSafety.description,
          recommendation: lactationSafety.recommendation
        });
      }
    }

    // Check renal function
    if (profile.renalFunction && profile.renalFunction.egfr < 60) {
      const renalAlert = await this.checkRenalContraindication(medication, profile.renalFunction);
      if (renalAlert) {
        alerts.push(renalAlert);
      }
    }

    // Check hepatic function
    if (profile.hepaticFunction && profile.hepaticFunction.childPughScore) {
      const hepaticAlert = await this.checkHepaticContraindication(medication, profile.hepaticFunction);
      if (hepaticAlert) {
        alerts.push(hepaticAlert);
      }
    }

    // Check disease contraindications
    for (const condition of conditions) {
      if (medication.contraindications.some(c =>
        c.toLowerCase().includes(condition.name.toLowerCase()) ||
        c.includes(condition.icdCode)
      )) {
        alerts.push({
          medication: medication.name,
          condition: condition.name,
          severity: 'relative',
          description: `May be contraindicated with ${condition.name}`,
          recommendation: 'Review contraindications before prescribing'
        });
      }
    }

    return alerts;
  }

  private async checkDosage(
    item: any,
    profile: PatientMedicationProfile
  ): Promise<DosageAlert[]> {
    const alerts: DosageAlert[] = [];
    const medication = await this.getMedication(item.medicationId);

    if (!medication) return alerts;

    // Check max daily dose
    const dailyDose = this.calculateDailyDose(item.dosage);
    if (medication.maxDailyDose && dailyDose > medication.maxDailyDose) {
      alerts.push({
        medication: medication.name,
        alertType: 'too_high',
        currentDose: `${dailyDose} ${medication.maxDailyDoseUnit}/day`,
        recommendedDose: `Max ${medication.maxDailyDose} ${medication.maxDailyDoseUnit}/day`,
        reason: 'Exceeds maximum daily dose'
      });
    }

    // Check renal adjustment
    if (profile.renalFunction && profile.renalFunction.egfr < 60) {
      const renalAdjustment = await this.getRenalDoseAdjustment(
        medication.id,
        profile.renalFunction.egfr
      );
      if (renalAdjustment && renalAdjustment.adjustmentNeeded) {
        alerts.push({
          medication: medication.name,
          alertType: 'renal_adjustment',
          currentDose: `${item.dosage.amount} ${item.dosage.unit}`,
          recommendedDose: renalAdjustment.recommendedDose,
          reason: `eGFR ${profile.renalFunction.egfr} mL/min requires dose adjustment`,
          adjustmentFactor: renalAdjustment.factor
        });
      }
    }

    // Check hepatic adjustment
    if (profile.hepaticFunction?.childPughScore) {
      const hepaticAdjustment = await this.getHepaticDoseAdjustment(
        medication.id,
        profile.hepaticFunction.childPughScore
      );
      if (hepaticAdjustment && hepaticAdjustment.adjustmentNeeded) {
        alerts.push({
          medication: medication.name,
          alertType: 'hepatic_adjustment',
          currentDose: `${item.dosage.amount} ${item.dosage.unit}`,
          recommendedDose: hepaticAdjustment.recommendedDose,
          reason: `Child-Pugh ${profile.hepaticFunction.childPughScore} requires dose adjustment`,
          adjustmentFactor: hepaticAdjustment.factor
        });
      }
    }

    // Check age-based dosing
    if (profile.age < 18 || profile.age > 65) {
      const ageAdjustment = await this.getAgeDoseAdjustment(medication.id, profile.age);
      if (ageAdjustment && ageAdjustment.adjustmentNeeded) {
        alerts.push({
          medication: medication.name,
          alertType: 'age_adjustment',
          currentDose: `${item.dosage.amount} ${item.dosage.unit}`,
          recommendedDose: ageAdjustment.recommendedDose,
          reason: `Age ${profile.age} may require dose adjustment`
        });
      }
    }

    // Check weight-based dosing if applicable
    if (profile.weight && medication.requiresSpecialPrescription) {
      // Weight-based calculation for certain medications
      const weightBasedDose = await this.calculateWeightBasedDose(medication.id, profile.weight);
      if (weightBasedDose) {
        const currentDaily = this.calculateDailyDose(item.dosage);
        if (Math.abs(currentDaily - weightBasedDose.recommendedDose) > weightBasedDose.tolerance) {
          alerts.push({
            medication: medication.name,
            alertType: 'too_high',
            currentDose: `${currentDaily} ${item.dosage.unit}/day`,
            recommendedDose: `${weightBasedDose.recommendedDose} ${item.dosage.unit}/day (based on ${profile.weight}kg)`,
            reason: 'Weight-based dosing recommendation'
          });
        }
      }
    }

    return alerts;
  }

  private async checkDuplicateTherapy(
    currentMedications: CurrentMedication[],
    newMedications: string[]
  ): Promise<DuplicateTherapyAlert[]> {
    const alerts: DuplicateTherapyAlert[] = [];

    for (const newMedId of newMedications) {
      const newMed = await this.getMedication(newMedId);
      if (!newMed) continue;

      for (const current of currentMedications) {
        const currentMed = await this.getMedication(current.medicationId);
        if (!currentMed) continue;

        // Check same therapeutic class (first 5 chars of ATC code)
        if (newMed.atcCode.substring(0, 5) === currentMed.atcCode.substring(0, 5) &&
            newMed.id !== currentMed.id) {
          alerts.push({
            medication1: newMed.name,
            medication2: currentMed.name,
            therapeuticClass: await this.getAtcClassName(newMed.atcCode.substring(0, 5)),
            recommendation: 'Review for duplicate therapy - same therapeutic class'
          });
        }

        // Check same medication different form
        if (newMed.dci === currentMed.dci && newMed.id !== currentMed.id) {
          alerts.push({
            medication1: newMed.name,
            medication2: currentMed.name,
            therapeuticClass: newMed.dci,
            recommendation: 'Duplicate: Same active ingredient already prescribed'
          });
        }
      }
    }

    return alerts;
  }

  private calculateOverallRisk(result: InteractionCheckResult): 'low' | 'moderate' | 'high' | 'critical' {
    // Critical if any contraindicated interactions or severe allergies
    if (result.interactions.some(i => i.severity === 'contraindicated') ||
        result.allergyAlerts.some(a => a.severity === 'life_threatening') ||
        result.contraindications.some(c => c.severity === 'absolute')) {
      return 'critical';
    }

    // High if major interactions or severe conditions
    if (result.interactions.some(i => i.severity === 'major') ||
        result.allergyAlerts.some(a => a.severity === 'severe') ||
        result.dosageAlerts.some(d => d.alertType === 'too_high')) {
      return 'high';
    }

    // Moderate if moderate interactions or warnings
    if (result.interactions.some(i => i.severity === 'moderate') ||
        result.allergyAlerts.some(a => a.severity === 'moderate') ||
        result.duplicateTherapyAlerts.length > 0) {
      return 'moderate';
    }

    return 'low';
  }

  // ==================== MEDICATION DATABASE ====================

  async searchMedications(query: string, options?: {
    limit?: number;
    formularyOnly?: boolean;
    formularyId?: string;
    includeGenerics?: boolean;
  }): Promise<Medication[]> {
    // Search by name, DCI, or ATC code
    const searchTerms = query.toLowerCase().split(' ');

    // This would query the medication database
    // For now, return empty array - implementation depends on database
    return [];
  }

  async getMedication(medicationId: string): Promise<Medication | null> {
    // Fetch from database
    return null;
  }

  async getMedicationAlternatives(medicationId: string): Promise<{
    generics: Medication[];
    therapeuticAlternatives: Medication[];
    formularyAlternatives: Medication[];
  }> {
    const medication = await this.getMedication(medicationId);
    if (!medication) {
      return { generics: [], therapeuticAlternatives: [], formularyAlternatives: [] };
    }

    return {
      generics: await this.getGenericEquivalents(medication.dci),
      therapeuticAlternatives: await this.getTherapeuticAlternatives(medication.atcCode),
      formularyAlternatives: await this.getFormularyAlternatives(medicationId)
    };
  }

  // ==================== FORMULARY MANAGEMENT ====================

  async checkFormularyStatus(
    medicationId: string,
    formularyId: string
  ): Promise<{
    isOnFormulary: boolean;
    tier?: number;
    restrictions?: FormularyRestriction[];
    priorAuthRequired: boolean;
    alternatives?: FormularyMedication[];
  }> {
    // Check medication formulary status
    return {
      isOnFormulary: true,
      tier: 1,
      restrictions: [],
      priorAuthRequired: false
    };
  }

  async submitPriorAuthorization(
    prescriptionId: string,
    diagnosis: string,
    clinicalJustification: string,
    supportingDocuments?: string[]
  ): Promise<{
    authorizationId: string;
    status: 'pending' | 'approved' | 'denied';
    estimatedResponseTime: string;
  }> {
    const authId = crypto.randomUUID();

    // Submit to payer
    return {
      authorizationId: authId,
      status: 'pending',
      estimatedResponseTime: '24-48 hours'
    };
  }

  // ==================== PATIENT PROFILE ====================

  async getPatientMedicationProfile(patientId: string): Promise<PatientMedicationProfile> {
    // Fetch patient medication profile from database
    // This includes allergies, current meds, conditions, etc.
    return {
      patientId,
      allergies: [],
      currentMedications: [],
      pastMedications: [],
      conditions: [],
      age: 45,
      isPregnant: false,
      isLactating: false
    };
  }

  async updatePatientAllergies(
    patientId: string,
    allergies: DrugAllergy[]
  ): Promise<void> {
    // Update patient allergies
  }

  async addCurrentMedication(
    patientId: string,
    medication: CurrentMedication
  ): Promise<void> {
    // Add medication to current list
  }

  async reconcileMedications(
    patientId: string,
    reportedMedications: CurrentMedication[],
    reconciledBy: string
  ): Promise<{
    confirmed: CurrentMedication[];
    discontinued: CurrentMedication[];
    added: CurrentMedication[];
    discrepancies: string[];
  }> {
    // Medication reconciliation process
    return {
      confirmed: [],
      discontinued: [],
      added: [],
      discrepancies: []
    };
  }

  // ==================== DISPENSING ====================

  async recordDispensing(data: {
    prescriptionItemId: string;
    pharmacyId: string;
    pharmacistId: string;
    quantityDispensed: number;
    dispensedMedicationId?: string;
    isSubstitution: boolean;
    substitutionReason?: string;
    lotNumber?: string;
    expirationDate?: Date;
  }): Promise<DispensingRecord> {
    const record: DispensingRecord = {
      id: crypto.randomUUID(),
      ...data,
      pharmacyName: '', // Fetch from pharmacy
      pharmacistName: '', // Fetch from pharmacist
      dispensedMedicationName: data.dispensedMedicationId
        ? (await this.getMedication(data.dispensedMedicationId))?.name
        : undefined,
      dispensedAt: new Date()
    };

    // Update prescription status
    await this.updateDispensingStatus(data.prescriptionItemId, record);

    return record;
  }

  // ==================== REPORTING ====================

  async getPrescriptionHistory(
    patientId: string,
    options?: {
      startDate?: Date;
      endDate?: Date;
      status?: PrescriptionStatus[];
      prescriberId?: string;
    }
  ): Promise<Prescription[]> {
    // Fetch prescription history
    return [];
  }

  async generatePrescriptionReport(
    prescriptionId: string,
    format: 'pdf' | 'html'
  ): Promise<{ content: string; mimeType: string }> {
    const prescription = await this.getPrescription(prescriptionId);
    if (!prescription) {
      throw new Error('Prescription not found');
    }

    // Generate formatted prescription document
    const content = this.formatPrescriptionDocument(prescription);

    return {
      content,
      mimeType: format === 'pdf' ? 'application/pdf' : 'text/html'
    };
  }

  async getControlledSubstanceReport(
    organizationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    prescriptions: Prescription[];
    summary: {
      byMedication: { medication: string; count: number; quantity: number }[];
      byPrescriber: { prescriber: string; count: number }[];
      bySchedule: { schedule: string; count: number }[];
    };
  }> {
    // Generate controlled substance prescribing report
    return {
      prescriptions: [],
      summary: {
        byMedication: [],
        byPrescriber: [],
        bySchedule: []
      }
    };
  }

  // ==================== HELPER METHODS ====================

  private async generatePrescriptionNumber(): Promise<string> {
    const date = new Date();
    const prefix = 'RX';
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${dateStr}${random}`;
  }

  private calculateDefaultValidity(type: PrescriptionType): Date {
    const now = new Date();
    switch (type) {
      case 'acute':
        return new Date(now.setMonth(now.getMonth() + 1));
      case 'chronic':
        return new Date(now.setMonth(now.getMonth() + 12));
      case 'secure':
        return new Date(now.setDate(now.getDate() + 28)); // 28 days for secure prescriptions
      default:
        return new Date(now.setMonth(now.getMonth() + 3));
    }
  }

  private requiresSecurePrescription(items: any[]): boolean {
    // Check if any medication requires secure prescription
    // Narcotics, certain psychotropics, etc.
    return false;
  }

  private extractItemAlerts(safetyCheck: InteractionCheckResult, medicationId: string): ItemAlert[] {
    const alerts: ItemAlert[] = [];

    // Extract relevant alerts for this specific medication
    for (const interaction of safetyCheck.interactions) {
      if (interaction.drug1 === medicationId || interaction.drug2 === medicationId) {
        alerts.push({
          type: 'interaction',
          severity: interaction.severity === 'contraindicated' ? 'critical' :
                   interaction.severity === 'major' ? 'critical' :
                   interaction.severity === 'moderate' ? 'warning' : 'info',
          message: `Interaction with ${interaction.drug1 === medicationId ? interaction.drug2 : interaction.drug1}`,
          details: interaction.description,
          acknowledged: false
        });
      }
    }

    return alerts;
  }

  private extractPrescriptionAlerts(safetyCheck: InteractionCheckResult): PrescriptionAlert[] {
    const alerts: PrescriptionAlert[] = [];

    for (const allergy of safetyCheck.allergyAlerts) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'allergy',
        severity: allergy.severity === 'life_threatening' ? 'critical' :
                 allergy.severity === 'severe' ? 'critical' : 'warning',
        message: `Allergy alert: ${allergy.allergen}`,
        details: allergy.recommendation,
        acknowledged: false
      });
    }

    for (const contra of safetyCheck.contraindications) {
      alerts.push({
        id: crypto.randomUUID(),
        type: 'contraindication',
        severity: contra.severity === 'absolute' ? 'critical' : 'warning',
        message: `Contraindication: ${contra.condition}`,
        details: contra.description,
        recommendation: contra.recommendation,
        acknowledged: false
      });
    }

    return alerts;
  }

  private calculateDailyDose(dosage: Dosage): number {
    const frequencyMultiplier: Record<DosageFrequency, number> = {
      'once_daily': 1,
      'twice_daily': 2,
      'three_times_daily': 3,
      'four_times_daily': 4,
      'every_4_hours': 6,
      'every_6_hours': 4,
      'every_8_hours': 3,
      'every_12_hours': 2,
      'weekly': 1/7,
      'biweekly': 1/14,
      'monthly': 1/30,
      'as_needed': 1,
      'custom': 1
    };

    return dosage.amount * (frequencyMultiplier[dosage.frequency] || 1);
  }

  // Stub methods for database operations
  private async savePrescription(prescription: Prescription): Promise<void> {}
  private async updatePrescription(prescription: Prescription): Promise<void> {}
  private async getPrescription(id: string): Promise<Prescription | null> { return null; }
  private async getPrescriberInfo(id: string): Promise<any> { return {}; }
  private async getPharmacyInfo(id: string): Promise<any> { return {}; }
  private async sendElectronically(prescription: Prescription, pharmacy: any): Promise<string> { return ''; }
  private async sendViaFax(prescription: Prescription, pharmacy: any): Promise<string> { return ''; }
  private async notifyPharmacyCancellation(pharmacyId: string, prescriptionId: string): Promise<void> {}
  private async logPrescriptionEvent(prescriptionId: string, event: string, userId: string, data: any): Promise<void> {}
  private async getInteractionBetween(med1: string, med2: string): Promise<DetectedInteraction | null> { return null; }
  private async checkDrugClassMatch(atcCode: string, allergen: string): Promise<boolean> { return false; }
  private async checkLactationSafety(medId: string): Promise<any> { return null; }
  private async checkRenalContraindication(med: Medication, renal: RenalFunction): Promise<ContraindicationAlert | null> { return null; }
  private async checkHepaticContraindication(med: Medication, hepatic: HepaticFunction): Promise<ContraindicationAlert | null> { return null; }
  private async getRenalDoseAdjustment(medId: string, egfr: number): Promise<any> { return null; }
  private async getHepaticDoseAdjustment(medId: string, childPugh: string): Promise<any> { return null; }
  private async getAgeDoseAdjustment(medId: string, age: number): Promise<any> { return null; }
  private async calculateWeightBasedDose(medId: string, weight: number): Promise<any> { return null; }
  private async getAtcClassName(atcCode: string): Promise<string> { return ''; }
  private async getGenericEquivalents(dci: string): Promise<Medication[]> { return []; }
  private async getTherapeuticAlternatives(atcCode: string): Promise<Medication[]> { return []; }
  private async getFormularyAlternatives(medId: string): Promise<Medication[]> { return []; }
  private async updateDispensingStatus(itemId: string, record: DispensingRecord): Promise<void> {}
  private formatPrescriptionDocument(prescription: Prescription): string { return ''; }
}

export default EPrescribingService;
