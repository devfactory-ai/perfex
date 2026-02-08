/**
 * Claims & Revenue Cycle Management Service
 * Gestion des Réclamations & Cycle de Revenus
 * Facturation, remboursements et gestion du cycle de revenus
 */

// Types
export interface Claim {
  id: string;
  claimNumber: string;
  type: 'professional' | 'institutional' | 'dental' | 'pharmacy';
  patientId: string;
  patientName: string;
  patientDob: string;
  memberId: string;
  groupNumber?: string;
  payerId: string;
  payerName: string;
  providerId: string;
  providerName: string;
  providerNpi: string;
  facilityId?: string;
  facilityName?: string;
  dateOfService: string;
  dateOfServiceEnd?: string;
  admissionDate?: string;
  dischargeDate?: string;
  placeOfService: string;
  diagnoses: ClaimDiagnosis[];
  procedures: ClaimProcedure[];
  charges: ClaimCharge[];
  totalCharges: number;
  allowedAmount?: number;
  paidAmount?: number;
  patientResponsibility?: number;
  adjustments?: ClaimAdjustment[];
  status: ClaimStatus;
  submissionHistory: SubmissionEvent[];
  authorization?: Authorization;
  attachments: ClaimAttachment[];
  notes: ClaimNote[];
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  paidAt?: string;
  dueDate?: string;
}

export type ClaimStatus =
  | 'draft'
  | 'ready'
  | 'submitted'
  | 'accepted'
  | 'pending'
  | 'processing'
  | 'paid'
  | 'partial_paid'
  | 'denied'
  | 'rejected'
  | 'appealed'
  | 'voided';

export interface ClaimDiagnosis {
  sequence: number;
  code: string;
  codeSystem: 'ICD-10-CM' | 'ICD-9-CM';
  description: string;
  isPrincipal: boolean;
  isAdmitting?: boolean;
  presentOnAdmission?: 'Y' | 'N' | 'U' | 'W';
}

export interface ClaimProcedure {
  sequence: number;
  code: string;
  codeSystem: 'CPT' | 'HCPCS' | 'ICD-10-PCS';
  description: string;
  modifiers?: string[];
  serviceDate: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  diagnosisPointers: number[];
  renderingProviderId?: string;
  renderingProviderNpi?: string;
  authorization?: string;
}

export interface ClaimCharge {
  id: string;
  procedureSequence: number;
  chargeCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalCharge: number;
  revenueCode?: string;
  department?: string;
}

export interface ClaimAdjustment {
  code: string;
  reason: string;
  group: 'CO' | 'OA' | 'PI' | 'PR' | 'CR';
  amount: number;
  description: string;
}

export interface SubmissionEvent {
  timestamp: string;
  event: string;
  status: ClaimStatus;
  details?: string;
  userId?: string;
  responseCode?: string;
  clearinghouse?: string;
}

export interface Authorization {
  number: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  approvedUnits?: number;
  usedUnits?: number;
  effectiveDate: string;
  expirationDate: string;
  diagnosisCodes?: string[];
  procedureCodes?: string[];
}

export interface ClaimAttachment {
  id: string;
  type: 'medical_record' | 'operative_report' | 'lab_result' | 'imaging' | 'referral' | 'authorization' | 'other';
  name: string;
  url: string;
  mimeType: string;
  requiredForSubmission: boolean;
  uploadedAt: string;
}

export interface ClaimNote {
  id: string;
  type: 'internal' | 'payer' | 'system';
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface RemittanceAdvice {
  id: string;
  remittanceNumber: string;
  payerId: string;
  payerName: string;
  checkNumber?: string;
  checkDate?: string;
  eftTraceNumber?: string;
  paymentAmount: number;
  claimPayments: ClaimPayment[];
  receivedAt: string;
  processedAt?: string;
  status: 'pending' | 'processed' | 'reconciled' | 'exception';
}

export interface ClaimPayment {
  claimId: string;
  claimNumber: string;
  patientName: string;
  serviceDate: string;
  chargedAmount: number;
  allowedAmount: number;
  paidAmount: number;
  adjustments: ClaimAdjustment[];
  patientResponsibility: number;
  status: 'paid' | 'partial' | 'denied';
  denialReason?: string;
  remarkCodes?: string[];
}

export interface Eligibility {
  id: string;
  patientId: string;
  payerId: string;
  payerName: string;
  memberId: string;
  groupNumber?: string;
  subscriberName: string;
  subscriberRelationship: 'self' | 'spouse' | 'child' | 'other';
  coverageStatus: 'active' | 'inactive' | 'terminated';
  effectiveDate: string;
  terminationDate?: string;
  planType: string;
  planName: string;
  benefits: BenefitDetail[];
  checkedAt: string;
  source: 'realtime' | 'batch' | 'manual';
}

export interface BenefitDetail {
  category: string;
  networkStatus: 'in_network' | 'out_of_network';
  coverageLevel: 'individual' | 'family';
  deductible?: { total: number; met: number; remaining: number };
  outOfPocketMax?: { total: number; met: number; remaining: number };
  copay?: number;
  coinsurance?: number;
  priorAuthRequired?: boolean;
  referralRequired?: boolean;
  limitations?: string;
}

export interface DenialManagement {
  id: string;
  claimId: string;
  claimNumber: string;
  denialDate: string;
  denialCodes: string[];
  denialReasons: string[];
  category: 'clinical' | 'administrative' | 'technical' | 'authorization';
  appealDeadline: string;
  status: 'new' | 'in_review' | 'appealing' | 'resolved' | 'written_off';
  assignedTo?: string;
  resolution?: {
    type: 'overturned' | 'upheld' | 'partial' | 'written_off';
    amount?: number;
    date: string;
    notes?: string;
  };
  appeals: Appeal[];
}

export interface Appeal {
  id: string;
  level: 'first' | 'second' | 'external' | 'judicial';
  filedDate: string;
  deadline: string;
  status: 'pending' | 'in_review' | 'approved' | 'denied';
  supportingDocs: string[];
  response?: {
    receivedDate: string;
    decision: 'approved' | 'denied' | 'partial';
    details: string;
  };
}

export interface RevenueMetrics {
  period: string;
  totalCharges: number;
  totalPayments: number;
  totalAdjustments: number;
  netRevenue: number;
  daysInAR: number;
  collectionRate: number;
  denialRate: number;
  cleanClaimRate: number;
  byPayer: { payer: string; charges: number; payments: number; ar: number }[];
  byService: { service: string; charges: number; payments: number }[];
  agingBuckets: { bucket: string; amount: number; count: number }[];
}

// Mock data
const claims: Claim[] = [];
const remittances: RemittanceAdvice[] = [];
const denials: DenialManagement[] = [];

// Payer directory
const payers = [
  { id: 'payer-001', name: 'CPAM - Assurance Maladie', type: 'government' },
  { id: 'payer-002', name: 'MGEN', type: 'mutuelle' },
  { id: 'payer-003', name: 'Harmonie Mutuelle', type: 'mutuelle' },
  { id: 'payer-004', name: 'AXA Santé', type: 'complémentaire' }
];

// Denial codes
const denialCodes: Record<string, string> = {
  'CO-4': 'Le code de procédure est incompatible avec le code de diagnostic',
  'CO-16': 'Réclamation manque d\'information nécessaire',
  'CO-45': 'Les frais dépassent le montant maximal admissible',
  'CO-50': 'Ces services ne sont pas couverts par le régime du patient',
  'PR-1': 'Franchise non satisfaite',
  'PR-2': 'Quote-part du patient',
  'PR-3': 'Co-assurance du patient'
};

export class ClaimsService {

  // Create new claim
  async createClaim(data: {
    type: Claim['type'];
    patientId: string;
    patientName: string;
    patientDob: string;
    memberId: string;
    groupNumber?: string;
    payerId: string;
    providerId: string;
    providerName: string;
    providerNpi: string;
    facilityId?: string;
    facilityName?: string;
    dateOfService: string;
    dateOfServiceEnd?: string;
    placeOfService: string;
    diagnoses: Omit<ClaimDiagnosis, 'sequence'>[];
    procedures: Omit<ClaimProcedure, 'sequence' | 'totalPrice'>[];
    authorization?: Authorization;
  }): Promise<Claim> {
    const payer = payers.find(p => p.id === data.payerId);
    if (!payer) throw new Error('Payer not found');

    const now = new Date();
    const claimNumber = `CLM-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

    // Calculate totals
    const procedures = data.procedures.map((p, i) => ({
      ...p,
      sequence: i + 1,
      totalPrice: p.quantity * p.unitPrice
    }));

    const totalCharges = procedures.reduce((sum, p) => sum + p.totalPrice, 0);

    const claim: Claim = {
      id: `claim-${Date.now()}`,
      claimNumber,
      type: data.type,
      patientId: data.patientId,
      patientName: data.patientName,
      patientDob: data.patientDob,
      memberId: data.memberId,
      groupNumber: data.groupNumber,
      payerId: data.payerId,
      payerName: payer.name,
      providerId: data.providerId,
      providerName: data.providerName,
      providerNpi: data.providerNpi,
      facilityId: data.facilityId,
      facilityName: data.facilityName,
      dateOfService: data.dateOfService,
      dateOfServiceEnd: data.dateOfServiceEnd,
      placeOfService: data.placeOfService,
      diagnoses: data.diagnoses.map((d, i) => ({ ...d, sequence: i + 1 })),
      procedures,
      charges: procedures.map(p => ({
        id: `chg-${Date.now()}-${p.sequence}`,
        procedureSequence: p.sequence,
        chargeCode: p.code,
        description: p.description,
        quantity: p.quantity,
        unitPrice: p.unitPrice,
        totalCharge: p.totalPrice
      })),
      totalCharges,
      status: 'draft',
      submissionHistory: [
        {
          timestamp: now.toISOString(),
          event: 'Claim created',
          status: 'draft'
        }
      ],
      authorization: data.authorization,
      attachments: [],
      notes: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    claims.push(claim);
    return claim;
  }

  // Get claim by ID
  getClaim(claimId: string): Claim | undefined {
    return claims.find(c => c.id === claimId);
  }

  // List claims with filters
  listClaims(options: {
    patientId?: string;
    payerId?: string;
    providerId?: string;
    status?: ClaimStatus;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): { claims: Claim[]; total: number } {
    let results = [...claims];

    if (options.patientId) {
      results = results.filter(c => c.patientId === options.patientId);
    }

    if (options.payerId) {
      results = results.filter(c => c.payerId === options.payerId);
    }

    if (options.providerId) {
      results = results.filter(c => c.providerId === options.providerId);
    }

    if (options.status) {
      results = results.filter(c => c.status === options.status);
    }

    if (options.fromDate) {
      results = results.filter(c => c.dateOfService >= options.fromDate!);
    }

    if (options.toDate) {
      results = results.filter(c => c.dateOfService <= options.toDate!);
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = results.length;
    const offset = options.offset || 0;
    const limit = options.limit || 50;

    return {
      claims: results.slice(offset, offset + limit),
      total
    };
  }

  // Validate claim before submission
  async validateClaim(claimId: string): Promise<{
    isValid: boolean;
    errors: { field: string; message: string }[];
    warnings: { field: string; message: string }[];
  }> {
    const claim = this.getClaim(claimId);
    if (!claim) throw new Error('Claim not found');

    const errors: { field: string; message: string }[] = [];
    const warnings: { field: string; message: string }[] = [];

    // Validate required fields
    if (!claim.diagnoses.length) {
      errors.push({ field: 'diagnoses', message: 'Au moins un diagnostic est requis' });
    }

    if (!claim.procedures.length) {
      errors.push({ field: 'procedures', message: 'Au moins une procédure est requise' });
    }

    if (!claim.diagnoses.some(d => d.isPrincipal)) {
      errors.push({ field: 'diagnoses', message: 'Un diagnostic principal doit être identifié' });
    }

    // Check for authorization if required
    if (claim.procedures.some(p => p.authorization) && !claim.authorization) {
      errors.push({ field: 'authorization', message: 'Autorisation préalable requise pour certaines procédures' });
    }

    // Check for expired authorization
    if (claim.authorization) {
      if (new Date(claim.authorization.expirationDate) < new Date()) {
        errors.push({ field: 'authorization', message: 'L\'autorisation a expiré' });
      }
    }

    // Warnings
    if (claim.totalCharges > 50000) {
      warnings.push({ field: 'totalCharges', message: 'Montant élevé - vérifier avant soumission' });
    }

    // Update status if valid
    if (errors.length === 0 && claim.status === 'draft') {
      claim.status = 'ready';
      claim.submissionHistory.push({
        timestamp: new Date().toISOString(),
        event: 'Claim validated',
        status: 'ready'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Submit claim
  async submitClaim(claimId: string): Promise<Claim> {
    const claim = this.getClaim(claimId);
    if (!claim) throw new Error('Claim not found');

    if (claim.status !== 'ready') {
      throw new Error('Claim must be validated before submission');
    }

    const now = new Date();
    claim.status = 'submitted';
    claim.submittedAt = now.toISOString();
    claim.dueDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString();
    claim.updatedAt = now.toISOString();

    claim.submissionHistory.push({
      timestamp: now.toISOString(),
      event: 'Claim submitted',
      status: 'submitted',
      clearinghouse: 'Clearinghouse Principal'
    });

    // Simulate acceptance after short delay
    setTimeout(() => {
      claim.status = 'accepted';
      claim.submissionHistory.push({
        timestamp: new Date().toISOString(),
        event: 'Claim accepted by clearinghouse',
        status: 'accepted',
        responseCode: 'A1'
      });
    }, 2000);

    return claim;
  }

  // Check eligibility
  async checkEligibility(data: {
    patientId: string;
    payerId: string;
    memberId: string;
    dateOfService: string;
  }): Promise<Eligibility> {
    const payer = payers.find(p => p.id === data.payerId);
    if (!payer) throw new Error('Payer not found');

    // Mock eligibility response
    return {
      id: `elig-${Date.now()}`,
      patientId: data.patientId,
      payerId: data.payerId,
      payerName: payer.name,
      memberId: data.memberId,
      subscriberName: 'Assuré Principal',
      subscriberRelationship: 'self',
      coverageStatus: 'active',
      effectiveDate: '2024-01-01',
      planType: 'Régime Général',
      planName: 'Couverture Standard',
      benefits: [
        {
          category: 'Consultations',
          networkStatus: 'in_network',
          coverageLevel: 'individual',
          deductible: { total: 150, met: 150, remaining: 0 },
          copay: 25,
          coinsurance: 0.20
        },
        {
          category: 'Hospitalisation',
          networkStatus: 'in_network',
          coverageLevel: 'individual',
          deductible: { total: 500, met: 300, remaining: 200 },
          outOfPocketMax: { total: 3000, met: 800, remaining: 2200 },
          coinsurance: 0.20,
          priorAuthRequired: true
        },
        {
          category: 'Pharmacie',
          networkStatus: 'in_network',
          coverageLevel: 'individual',
          copay: 10
        }
      ],
      checkedAt: new Date().toISOString(),
      source: 'realtime'
    };
  }

  // Process remittance advice
  async processRemittance(data: {
    remittanceNumber: string;
    payerId: string;
    checkNumber?: string;
    checkDate?: string;
    eftTraceNumber?: string;
    paymentAmount: number;
    claimPayments: Omit<ClaimPayment, 'patientName' | 'serviceDate'>[];
  }): Promise<RemittanceAdvice> {
    const payer = payers.find(p => p.id === data.payerId);
    if (!payer) throw new Error('Payer not found');

    const claimPayments: ClaimPayment[] = [];

    for (const payment of data.claimPayments) {
      const claim = claims.find(c => c.claimNumber === payment.claimNumber);
      if (claim) {
        // Update claim with payment info
        claim.allowedAmount = payment.allowedAmount;
        claim.paidAmount = payment.paidAmount;
        claim.patientResponsibility = payment.patientResponsibility;
        claim.adjustments = payment.adjustments;

        if (payment.status === 'paid') {
          claim.status = 'paid';
          claim.paidAt = new Date().toISOString();
        } else if (payment.status === 'partial') {
          claim.status = 'partial_paid';
        } else if (payment.status === 'denied') {
          claim.status = 'denied';
          // Create denial record
          await this.createDenial(claim.id, payment.adjustments || []);
        }

        claim.submissionHistory.push({
          timestamp: new Date().toISOString(),
          event: `Payment processed: ${payment.status}`,
          status: claim.status,
          details: `Paid: ${payment.paidAmount}, Patient resp: ${payment.patientResponsibility}`
        });

        claimPayments.push({
          ...payment,
          patientName: claim.patientName,
          serviceDate: claim.dateOfService
        });
      }
    }

    const remittance: RemittanceAdvice = {
      id: `rem-${Date.now()}`,
      remittanceNumber: data.remittanceNumber,
      payerId: data.payerId,
      payerName: payer.name,
      checkNumber: data.checkNumber,
      checkDate: data.checkDate,
      eftTraceNumber: data.eftTraceNumber,
      paymentAmount: data.paymentAmount,
      claimPayments,
      receivedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      status: 'processed'
    };

    remittances.push(remittance);
    return remittance;
  }

  // Create denial record
  private async createDenial(claimId: string, adjustments: ClaimAdjustment[]): Promise<DenialManagement> {
    const claim = this.getClaim(claimId);
    if (!claim) throw new Error('Claim not found');

    const now = new Date();
    const appealDeadline = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const denial: DenialManagement = {
      id: `denial-${Date.now()}`,
      claimId,
      claimNumber: claim.claimNumber,
      denialDate: now.toISOString(),
      denialCodes: adjustments.filter(a => a.group === 'CO').map(a => a.code),
      denialReasons: adjustments.map(a => denialCodes[a.code] || a.description),
      category: this.categorizeDenial(adjustments),
      appealDeadline: appealDeadline.toISOString(),
      status: 'new',
      appeals: []
    };

    denials.push(denial);
    return denial;
  }

  // Get denials
  getDenials(options?: {
    status?: DenialManagement['status'];
    category?: DenialManagement['category'];
  }): DenialManagement[] {
    let results = [...denials];

    if (options?.status) {
      results = results.filter(d => d.status === options.status);
    }

    if (options?.category) {
      results = results.filter(d => d.category === options.category);
    }

    return results;
  }

  // File appeal
  async fileAppeal(denialId: string, data: {
    level: Appeal['level'];
    supportingDocs: string[];
    appealReason: string;
  }): Promise<DenialManagement> {
    const denial = denials.find(d => d.id === denialId);
    if (!denial) throw new Error('Denial not found');

    const now = new Date();
    const deadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    denial.appeals.push({
      id: `appeal-${Date.now()}`,
      level: data.level,
      filedDate: now.toISOString(),
      deadline: deadline.toISOString(),
      status: 'pending',
      supportingDocs: data.supportingDocs
    });

    denial.status = 'appealing';

    // Update claim
    const claim = this.getClaim(denial.claimId);
    if (claim) {
      claim.status = 'appealed';
      claim.submissionHistory.push({
        timestamp: now.toISOString(),
        event: `Appeal filed: ${data.level} level`,
        status: 'appealed'
      });
    }

    return denial;
  }

  // Get revenue metrics
  async getRevenueMetrics(options: {
    fromDate: string;
    toDate: string;
    providerId?: string;
  }): Promise<RevenueMetrics> {
    let filtered = claims.filter(
      c => c.dateOfService >= options.fromDate && c.dateOfService <= options.toDate
    );

    if (options.providerId) {
      filtered = filtered.filter(c => c.providerId === options.providerId);
    }

    const totalCharges = filtered.reduce((sum, c) => sum + c.totalCharges, 0);
    const totalPayments = filtered.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const totalAdjustments = filtered.reduce(
      (sum, c) => sum + (c.adjustments?.reduce((a, adj) => a + adj.amount, 0) || 0),
      0
    );

    const paidClaims = filtered.filter(c => c.status === 'paid');
    const deniedClaims = filtered.filter(c => c.status === 'denied');
    const cleanClaims = filtered.filter(c =>
      !c.submissionHistory.some(e => e.event.includes('rejected') || e.event.includes('error'))
    );

    // Calculate days in AR
    const unpaidClaims = filtered.filter(c =>
      ['submitted', 'accepted', 'pending', 'processing'].includes(c.status)
    );
    const avgDaysInAR = unpaidClaims.length > 0
      ? unpaidClaims.reduce((sum, c) => {
          const days = Math.floor(
            (Date.now() - new Date(c.submittedAt || c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }, 0) / unpaidClaims.length
      : 0;

    // Group by payer
    const byPayer: Record<string, { charges: number; payments: number; ar: number }> = {};
    filtered.forEach(c => {
      if (!byPayer[c.payerName]) {
        byPayer[c.payerName] = { charges: 0, payments: 0, ar: 0 };
      }
      byPayer[c.payerName].charges += c.totalCharges;
      byPayer[c.payerName].payments += c.paidAmount || 0;
      if (!['paid', 'denied', 'voided'].includes(c.status)) {
        byPayer[c.payerName].ar += c.totalCharges - (c.paidAmount || 0);
      }
    });

    // Aging buckets
    const agingBuckets = [
      { bucket: '0-30 jours', amount: 0, count: 0 },
      { bucket: '31-60 jours', amount: 0, count: 0 },
      { bucket: '61-90 jours', amount: 0, count: 0 },
      { bucket: '91-120 jours', amount: 0, count: 0 },
      { bucket: '>120 jours', amount: 0, count: 0 }
    ];

    unpaidClaims.forEach(c => {
      const days = Math.floor(
        (Date.now() - new Date(c.submittedAt || c.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      const amount = c.totalCharges - (c.paidAmount || 0);
      if (days <= 30) {
        agingBuckets[0].amount += amount;
        agingBuckets[0].count++;
      } else if (days <= 60) {
        agingBuckets[1].amount += amount;
        agingBuckets[1].count++;
      } else if (days <= 90) {
        agingBuckets[2].amount += amount;
        agingBuckets[2].count++;
      } else if (days <= 120) {
        agingBuckets[3].amount += amount;
        agingBuckets[3].count++;
      } else {
        agingBuckets[4].amount += amount;
        agingBuckets[4].count++;
      }
    });

    return {
      period: `${options.fromDate} - ${options.toDate}`,
      totalCharges,
      totalPayments,
      totalAdjustments,
      netRevenue: totalPayments - totalAdjustments,
      daysInAR: Math.round(avgDaysInAR),
      collectionRate: totalCharges > 0 ? totalPayments / totalCharges : 0,
      denialRate: filtered.length > 0 ? deniedClaims.length / filtered.length : 0,
      cleanClaimRate: filtered.length > 0 ? cleanClaims.length / filtered.length : 0,
      byPayer: Object.entries(byPayer).map(([payer, data]) => ({ payer, ...data })),
      byService: [],
      agingBuckets
    };
  }

  // Helper method
  private categorizeDenial(adjustments: ClaimAdjustment[]): DenialManagement['category'] {
    const codes = adjustments.map(a => a.code);

    if (codes.some(c => ['CO-4', 'CO-11', 'CO-146'].includes(c))) {
      return 'clinical';
    }
    if (codes.some(c => ['CO-16', 'CO-18', 'CO-29'].includes(c))) {
      return 'administrative';
    }
    if (codes.some(c => ['CO-197', 'CO-198'].includes(c))) {
      return 'authorization';
    }
    return 'technical';
  }
}
