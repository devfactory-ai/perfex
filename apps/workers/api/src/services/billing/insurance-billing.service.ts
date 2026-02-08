/**
 * Insurance & Billing Service
 * Healthcare billing, claims, and insurance integration
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

export type ClaimStatus =
  | 'draft'
  | 'submitted'
  | 'acknowledged'
  | 'pending'
  | 'approved'
  | 'partially_approved'
  | 'denied'
  | 'appealed'
  | 'paid'
  | 'voided';

export type InsuranceType = 'primary' | 'secondary' | 'tertiary';
export type CoverageStatus = 'active' | 'inactive' | 'pending' | 'terminated';

export interface InsurancePlan {
  id: string;
  patientId: string;
  type: InsuranceType;
  payerId: string;
  payerName: string;
  planName: string;
  planType: 'hmo' | 'ppo' | 'epo' | 'pos' | 'medicare' | 'medicaid' | 'private' | 'mutuelle';
  memberId: string;
  groupNumber?: string;
  subscriberId?: string;
  subscriberName?: string;
  relationshipToSubscriber: 'self' | 'spouse' | 'child' | 'other';
  effectiveDate: Date;
  terminationDate?: Date;
  status: CoverageStatus;
  copay?: number;
  deductible?: number;
  deductibleMet?: number;
  outOfPocketMax?: number;
  outOfPocketMet?: number;
  coinsurance?: number;
  priorAuthRequired: boolean;
  contactPhone?: string;
  claimsAddress?: string;
  notes?: string;
}

export interface EligibilityVerification {
  id: string;
  patientId: string;
  insuranceId: string;
  verifiedAt: Date;
  status: 'verified' | 'not_found' | 'inactive' | 'error';
  response: {
    isEligible: boolean;
    effectiveDate?: Date;
    terminationDate?: Date;
    copay?: number;
    deductible?: number;
    deductibleMet?: number;
    coinsurance?: number;
    priorAuthRequired?: boolean;
    coveredServices?: string[];
    exclusions?: string[];
    errorMessage?: string;
  };
  requestedBy: string;
}

export interface PriorAuthorization {
  id: string;
  patientId: string;
  insuranceId: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  procedureCode: string;
  procedureDescription: string;
  diagnosisCodes: string[];
  requestedUnits: number;
  approvedUnits?: number;
  requestedAt: Date;
  responseAt?: Date;
  expirationDate?: Date;
  authorizationNumber?: string;
  denialReason?: string;
  notes?: string;
}

export interface Claim {
  id: string;
  claimNumber: string;
  patientId: string;
  patientName: string;
  insuranceId: string;
  payerId: string;
  payerName: string;
  status: ClaimStatus;
  type: 'professional' | 'institutional' | 'dental' | 'pharmacy';

  // Dates
  serviceDate: Date;
  submittedAt?: Date;
  processedAt?: Date;
  paidAt?: Date;

  // Provider
  renderingProviderId: string;
  renderingProviderName: string;
  renderingProviderNpi?: string;
  facilityId?: string;
  facilityName?: string;

  // Diagnosis
  diagnosisCodes: {
    code: string;
    type: 'ICD10' | 'ICD9';
    description?: string;
    isPrimary: boolean;
  }[];

  // Procedures/Services
  lineItems: ClaimLineItem[];

  // Amounts
  totalCharged: number;
  totalAllowed?: number;
  totalPaid?: number;
  patientResponsibility?: number;
  adjustments?: ClaimAdjustment[];

  // Prior Auth
  priorAuthNumber?: string;

  // Responses
  payerClaimId?: string;
  remittanceAdvice?: RemittanceAdvice;
  denialReasons?: DenialReason[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ClaimLineItem {
  lineNumber: number;
  procedureCode: string;
  procedureDescription: string;
  modifiers?: string[];
  quantity: number;
  unitPrice: number;
  totalCharge: number;
  allowedAmount?: number;
  paidAmount?: number;
  adjustmentAmount?: number;
  adjustmentReasons?: string[];
  diagnosisPointers: number[]; // References to diagnosis codes
  placeOfService: string;
  status: 'pending' | 'approved' | 'denied' | 'adjusted';
}

export interface ClaimAdjustment {
  code: string;
  reason: string;
  amount: number;
  groupCode: 'CO' | 'OA' | 'PI' | 'PR'; // Contractual, Other, Payer Initiated, Patient Responsibility
}

export interface RemittanceAdvice {
  id: string;
  checkNumber?: string;
  checkDate?: Date;
  paymentAmount: number;
  paymentMethod: 'eft' | 'check' | 'virtual_card';
  receivedAt: Date;
  lineItems: {
    lineNumber: number;
    chargedAmount: number;
    allowedAmount: number;
    paidAmount: number;
    adjustments: ClaimAdjustment[];
  }[];
}

export interface DenialReason {
  code: string;
  description: string;
  category: 'eligibility' | 'authorization' | 'medical_necessity' | 'coding' | 'timely_filing' | 'duplicate' | 'other';
  appealable: boolean;
}

export interface BillingStatement {
  id: string;
  patientId: string;
  patientName: string;
  statementDate: Date;
  dueDate: Date;
  previousBalance: number;
  newCharges: number;
  payments: number;
  adjustments: number;
  currentBalance: number;
  minimumPayment?: number;
  lineItems: {
    date: Date;
    description: string;
    amount: number;
    type: 'charge' | 'payment' | 'adjustment' | 'insurance_payment';
  }[];
  paymentPlanActive: boolean;
  paymentPlanDetails?: {
    totalAmount: number;
    monthlyPayment: number;
    remainingPayments: number;
    nextPaymentDate: Date;
  };
}

export interface PaymentPlan {
  id: string;
  patientId: string;
  totalAmount: number;
  monthlyPayment: number;
  startDate: Date;
  endDate: Date;
  paymentsMade: number;
  paymentsRemaining: number;
  nextPaymentDate: Date;
  autopayEnabled: boolean;
  status: 'active' | 'completed' | 'defaulted' | 'cancelled';
}

// =============================================================================
// Insurance & Billing Service
// =============================================================================

export class InsuranceBillingService {

  // =========================================================================
  // Insurance Management
  // =========================================================================

  /**
   * Add insurance to patient
   */
  async addInsurance(patientId: string, data: Omit<InsurancePlan, 'id' | 'patientId'>): Promise<InsurancePlan> {
    const insurance: InsurancePlan = {
      id: `ins-${Date.now()}`,
      patientId,
      ...data
    };

    // Would save to database
    return insurance;
  }

  /**
   * Get patient insurances
   */
  async getPatientInsurances(patientId: string): Promise<InsurancePlan[]> {
    // Would query database
    return [];
  }

  /**
   * Verify insurance eligibility
   */
  async verifyEligibility(
    patientId: string,
    insuranceId: string,
    requestedBy: string,
    serviceDate?: Date
  ): Promise<EligibilityVerification> {
    // Would call payer eligibility API (X12 270/271)
    const verification: EligibilityVerification = {
      id: `elig-${Date.now()}`,
      patientId,
      insuranceId,
      verifiedAt: new Date(),
      status: 'verified',
      response: {
        isEligible: true,
        effectiveDate: new Date('2024-01-01'),
        copay: 25,
        deductible: 500,
        deductibleMet: 350,
        coinsurance: 20,
        priorAuthRequired: false,
        coveredServices: ['dialysis', 'consultations', 'lab_tests']
      },
      requestedBy
    };

    return verification;
  }

  /**
   * Submit prior authorization request
   */
  async submitPriorAuth(data: {
    patientId: string;
    insuranceId: string;
    procedureCode: string;
    procedureDescription: string;
    diagnosisCodes: string[];
    requestedUnits: number;
    clinicalNotes?: string;
    requestedBy: string;
  }): Promise<PriorAuthorization> {
    const priorAuth: PriorAuthorization = {
      id: `auth-${Date.now()}`,
      patientId: data.patientId,
      insuranceId: data.insuranceId,
      status: 'pending',
      procedureCode: data.procedureCode,
      procedureDescription: data.procedureDescription,
      diagnosisCodes: data.diagnosisCodes,
      requestedUnits: data.requestedUnits,
      requestedAt: new Date()
    };

    // Would submit to payer via API or portal
    return priorAuth;
  }

  /**
   * Check prior authorization status
   */
  async checkPriorAuthStatus(authId: string): Promise<PriorAuthorization> {
    // Would query payer API
    return {
      id: authId,
      patientId: 'patient-1',
      insuranceId: 'ins-1',
      status: 'approved',
      procedureCode: '90935',
      procedureDescription: 'Hemodialysis',
      diagnosisCodes: ['N18.6'],
      requestedUnits: 13,
      approvedUnits: 13,
      requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      responseAt: new Date(),
      expirationDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      authorizationNumber: 'AUTH123456789'
    };
  }

  // =========================================================================
  // Claims Management
  // =========================================================================

  /**
   * Create a new claim
   */
  async createClaim(data: {
    patientId: string;
    patientName: string;
    insuranceId: string;
    renderingProviderId: string;
    renderingProviderName: string;
    serviceDate: Date;
    diagnosisCodes: Claim['diagnosisCodes'];
    lineItems: Omit<ClaimLineItem, 'status'>[];
    priorAuthNumber?: string;
    createdBy: string;
  }): Promise<Claim> {
    // Get insurance details
    const insurances = await this.getPatientInsurances(data.patientId);
    const insurance = insurances.find(i => i.id === data.insuranceId);

    const totalCharged = data.lineItems.reduce((sum, item) => sum + item.totalCharge, 0);

    const claim: Claim = {
      id: `claim-${Date.now()}`,
      claimNumber: this.generateClaimNumber(),
      patientId: data.patientId,
      patientName: data.patientName,
      insuranceId: data.insuranceId,
      payerId: insurance?.payerId || '',
      payerName: insurance?.payerName || '',
      status: 'draft',
      type: 'professional',
      serviceDate: data.serviceDate,
      renderingProviderId: data.renderingProviderId,
      renderingProviderName: data.renderingProviderName,
      diagnosisCodes: data.diagnosisCodes,
      lineItems: data.lineItems.map(item => ({ ...item, status: 'pending' as const })),
      totalCharged,
      priorAuthNumber: data.priorAuthNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: data.createdBy
    };

    // Would save to database
    return claim;
  }

  /**
   * Submit claim to payer
   */
  async submitClaim(claimId: string): Promise<Claim> {
    // Would fetch claim and validate
    const claim: Claim = {
      id: claimId,
      claimNumber: 'CLM-2025-00001',
      patientId: 'patient-1',
      patientName: 'Jean Dupont',
      insuranceId: 'ins-1',
      payerId: 'payer-1',
      payerName: 'CPAM',
      status: 'submitted',
      type: 'professional',
      serviceDate: new Date(),
      submittedAt: new Date(),
      renderingProviderId: 'prov-1',
      renderingProviderName: 'Dr. Martin',
      diagnosisCodes: [{ code: 'N18.6', type: 'ICD10', isPrimary: true }],
      lineItems: [],
      totalCharged: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1'
    };

    // Would generate X12 837 and submit
    return claim;
  }

  /**
   * Get claim by ID
   */
  async getClaim(claimId: string): Promise<Claim | null> {
    // Would query database
    return null;
  }

  /**
   * Get patient claims
   */
  async getPatientClaims(patientId: string, status?: ClaimStatus): Promise<Claim[]> {
    // Would query database
    return [];
  }

  /**
   * Process remittance advice (ERA 835)
   */
  async processRemittance(data: {
    payerId: string;
    checkNumber?: string;
    checkDate?: Date;
    paymentAmount: number;
    paymentMethod: 'eft' | 'check' | 'virtual_card';
    claimPayments: {
      claimId: string;
      paidAmount: number;
      adjustments: ClaimAdjustment[];
      lineItems: RemittanceAdvice['lineItems'];
    }[];
  }): Promise<void> {
    // Process each claim payment
    for (const payment of data.claimPayments) {
      const claim = await this.getClaim(payment.claimId);
      if (claim) {
        // Update claim with payment info
        claim.status = payment.paidAmount > 0 ? 'paid' : 'denied';
        claim.totalPaid = payment.paidAmount;
        claim.adjustments = payment.adjustments;
        claim.paidAt = new Date();
        // Would update in database
      }
    }
  }

  /**
   * File claim appeal
   */
  async fileAppeal(claimId: string, data: {
    reason: string;
    supportingDocuments?: string[];
    filedBy: string;
  }): Promise<Claim> {
    const claim = await this.getClaim(claimId);
    if (!claim) throw new Error('Claim not found');

    claim.status = 'appealed';
    // Would create appeal record and submit to payer
    return claim;
  }

  // =========================================================================
  // Patient Billing
  // =========================================================================

  /**
   * Generate patient statement
   */
  async generateStatement(patientId: string): Promise<BillingStatement> {
    // Would aggregate all charges, payments, adjustments
    return {
      id: `stmt-${Date.now()}`,
      patientId,
      patientName: 'Jean Dupont',
      statementDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      previousBalance: 150,
      newCharges: 75,
      payments: 0,
      adjustments: 0,
      currentBalance: 225,
      minimumPayment: 50,
      lineItems: [
        {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          description: 'Solde précédent',
          amount: 150,
          type: 'charge'
        },
        {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          description: 'Consultation néphrologie - Quote-part patient',
          amount: 25,
          type: 'charge'
        },
        {
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          description: 'Analyses laboratoire - Quote-part patient',
          amount: 50,
          type: 'charge'
        }
      ],
      paymentPlanActive: false
    };
  }

  /**
   * Record patient payment
   */
  async recordPayment(patientId: string, data: {
    amount: number;
    method: 'cash' | 'check' | 'credit_card' | 'bank_transfer';
    reference?: string;
    appliedTo?: string[]; // claim IDs
    receivedBy: string;
  }): Promise<{ paymentId: string; newBalance: number }> {
    // Would record payment and update balances
    return {
      paymentId: `pmt-${Date.now()}`,
      newBalance: 175 // Previous 225 - 50 payment
    };
  }

  /**
   * Create payment plan
   */
  async createPaymentPlan(patientId: string, data: {
    totalAmount: number;
    monthlyPayment: number;
    startDate: Date;
    autopayEnabled: boolean;
    createdBy: string;
  }): Promise<PaymentPlan> {
    const numberOfPayments = Math.ceil(data.totalAmount / data.monthlyPayment);
    const endDate = new Date(data.startDate);
    endDate.setMonth(endDate.getMonth() + numberOfPayments);

    const plan: PaymentPlan = {
      id: `plan-${Date.now()}`,
      patientId,
      totalAmount: data.totalAmount,
      monthlyPayment: data.monthlyPayment,
      startDate: data.startDate,
      endDate,
      paymentsMade: 0,
      paymentsRemaining: numberOfPayments,
      nextPaymentDate: data.startDate,
      autopayEnabled: data.autopayEnabled,
      status: 'active'
    };

    // Would save to database
    return plan;
  }

  // =========================================================================
  // Reporting
  // =========================================================================

  /**
   * Get billing summary
   */
  async getBillingSummary(startDate: Date, endDate: Date): Promise<{
    totalCharged: number;
    totalCollected: number;
    totalAdjustments: number;
    totalOutstanding: number;
    claimsByStatus: Record<ClaimStatus, number>;
    averageDaysToPayment: number;
    denialRate: number;
    collectionRate: number;
  }> {
    // Would aggregate from database
    return {
      totalCharged: 150000,
      totalCollected: 125000,
      totalAdjustments: 15000,
      totalOutstanding: 10000,
      claimsByStatus: {
        draft: 5,
        submitted: 20,
        acknowledged: 15,
        pending: 30,
        approved: 100,
        partially_approved: 10,
        denied: 5,
        appealed: 3,
        paid: 200,
        voided: 2
      },
      averageDaysToPayment: 28,
      denialRate: 3.5,
      collectionRate: 83.3
    };
  }

  /**
   * Get aging report
   */
  async getAgingReport(): Promise<{
    current: number;
    days30: number;
    days60: number;
    days90: number;
    days120Plus: number;
    total: number;
    byPayer: { payerName: string; amount: number; count: number }[];
  }> {
    return {
      current: 15000,
      days30: 8000,
      days60: 4000,
      days90: 2000,
      days120Plus: 1000,
      total: 30000,
      byPayer: [
        { payerName: 'CPAM', amount: 20000, count: 150 },
        { payerName: 'Mutuelle XYZ', amount: 8000, count: 50 },
        { payerName: 'Patient Self-Pay', amount: 2000, count: 25 }
      ]
    };
  }

  // =========================================================================
  // Helper Methods
  // =========================================================================

  private generateClaimNumber(): string {
    const year = new Date().getFullYear();
    const sequence = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `CLM-${year}-${sequence}`;
  }
}

export const insuranceBillingService = new InsuranceBillingService();
