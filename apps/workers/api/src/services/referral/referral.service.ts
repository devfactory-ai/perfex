/**
 * Referral Management Service
 * Système de référencement inter-praticiens
 * Gère les orientations de patients entre spécialistes
 */

// Types
export interface Referral {
  id: string;
  patientId: string;
  referringProviderId: string;
  referringProviderName: string;
  referringSpecialty: string;
  receivingProviderId: string;
  receivingProviderName: string;
  receivingSpecialty: string;
  referralType: 'consultation' | 'transfer' | 'second_opinion' | 'procedure' | 'co_management';
  priority: 'routine' | 'urgent' | 'emergent';
  status: 'pending' | 'accepted' | 'declined' | 'scheduled' | 'completed' | 'cancelled';
  reason: string;
  clinicalSummary: string;
  diagnoses: ReferralDiagnosis[];
  requestedServices: string[];
  attachments: ReferralAttachment[];
  insuranceInfo?: InsuranceInfo;
  preferredDate?: string;
  scheduledDate?: string;
  appointmentId?: string;
  notes: ReferralNote[];
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  completedAt?: string;
  responseDeadline?: string;
}

export interface ReferralDiagnosis {
  code: string;
  codeSystem: 'ICD-10' | 'SNOMED';
  description: string;
  isPrimary: boolean;
}

export interface ReferralAttachment {
  id: string;
  type: 'lab_result' | 'imaging' | 'clinical_note' | 'consent_form' | 'other';
  name: string;
  url: string;
  mimeType: string;
  uploadedAt: string;
}

export interface InsuranceInfo {
  payerId: string;
  payerName: string;
  memberId: string;
  groupNumber?: string;
  authorizationNumber?: string;
  authorizationStatus?: 'pending' | 'approved' | 'denied';
}

export interface ReferralNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

export interface Provider {
  id: string;
  name: string;
  specialty: string;
  subspecialties: string[];
  credentials: string[];
  npi?: string;
  organizationId: string;
  organizationName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  phone: string;
  fax?: string;
  email: string;
  acceptingNewPatients: boolean;
  acceptedInsurances: string[];
  languages: string[];
  rating?: number;
  reviewCount?: number;
  availableSlots?: number;
  nextAvailableDate?: string;
}

export interface ReferralTemplate {
  id: string;
  name: string;
  specialty: string;
  referralType: Referral['referralType'];
  priority: Referral['priority'];
  reason: string;
  requestedServices: string[];
  requiredAttachments: string[];
  instructions: string;
  createdBy: string;
  isActive: boolean;
}

export interface ReferralStats {
  totalReferrals: number;
  pending: number;
  accepted: number;
  completed: number;
  declined: number;
  averageResponseTime: number; // hours
  averageCompletionTime: number; // days
  bySpecialty: { specialty: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

// Provider directory with specialties
const providerDirectory: Provider[] = [
  {
    id: 'prov-001',
    name: 'Dr. Marie Dupont',
    specialty: 'Cardiologie',
    subspecialties: ['Électrophysiologie', 'Insuffisance cardiaque'],
    credentials: ['MD', 'PhD', 'FESC'],
    npi: '1234567890',
    organizationId: 'org-001',
    organizationName: 'Centre Cardiologique de Paris',
    address: { street: '15 Rue de la Santé', city: 'Paris', state: '75', zip: '75014' },
    phone: '+33 1 45 67 89 00',
    fax: '+33 1 45 67 89 01',
    email: 'marie.dupont@cardio-paris.fr',
    acceptingNewPatients: true,
    acceptedInsurances: ['CPAM', 'MGEN', 'Harmonie Mutuelle'],
    languages: ['Français', 'Anglais'],
    rating: 4.8,
    reviewCount: 127,
    availableSlots: 5,
    nextAvailableDate: '2024-01-20'
  },
  {
    id: 'prov-002',
    name: 'Dr. Jean Martin',
    specialty: 'Néphrologie',
    subspecialties: ['Dialyse', 'Transplantation rénale'],
    credentials: ['MD', 'MSc'],
    npi: '2345678901',
    organizationId: 'org-002',
    organizationName: 'Hôpital Necker',
    address: { street: '149 Rue de Sèvres', city: 'Paris', state: '75', zip: '75015' },
    phone: '+33 1 44 49 40 00',
    email: 'jean.martin@necker.aphp.fr',
    acceptingNewPatients: true,
    acceptedInsurances: ['CPAM', 'MGEN', 'AXA Santé'],
    languages: ['Français'],
    rating: 4.6,
    reviewCount: 89,
    availableSlots: 3,
    nextAvailableDate: '2024-01-22'
  },
  {
    id: 'prov-003',
    name: 'Dr. Sophie Bernard',
    specialty: 'Ophtalmologie',
    subspecialties: ['Rétine', 'Glaucome'],
    credentials: ['MD', 'FEBO'],
    organizationId: 'org-003',
    organizationName: 'Centre Ophtalmo Lumière',
    address: { street: '28 Avenue des Champs-Élysées', city: 'Paris', state: '75', zip: '75008' },
    phone: '+33 1 42 56 78 90',
    email: 'sophie.bernard@ophtalmo-lumiere.fr',
    acceptingNewPatients: false,
    acceptedInsurances: ['CPAM', 'Malakoff Humanis'],
    languages: ['Français', 'Anglais', 'Espagnol'],
    rating: 4.9,
    reviewCount: 203,
    availableSlots: 0,
    nextAvailableDate: '2024-02-15'
  },
  {
    id: 'prov-004',
    name: 'Dr. Pierre Lefebvre',
    specialty: 'Neurologie',
    subspecialties: ['Épilepsie', 'Maladies neurodégénératives'],
    credentials: ['MD', 'PhD'],
    organizationId: 'org-004',
    organizationName: 'Institut du Cerveau',
    address: { street: '47 Boulevard de l\'Hôpital', city: 'Paris', state: '75', zip: '75013' },
    phone: '+33 1 57 27 40 00',
    email: 'pierre.lefebvre@icm-institute.org',
    acceptingNewPatients: true,
    acceptedInsurances: ['CPAM', 'MGEN', 'Swiss Life'],
    languages: ['Français', 'Anglais'],
    rating: 4.7,
    reviewCount: 156,
    availableSlots: 2,
    nextAvailableDate: '2024-01-25'
  },
  {
    id: 'prov-005',
    name: 'Dr. Claire Moreau',
    specialty: 'Endocrinologie',
    subspecialties: ['Diabétologie', 'Thyroïde'],
    credentials: ['MD'],
    organizationId: 'org-005',
    organizationName: 'Clinique du Diabète',
    address: { street: '85 Rue de Rennes', city: 'Paris', state: '75', zip: '75006' },
    phone: '+33 1 45 44 67 89',
    email: 'claire.moreau@clinique-diabete.fr',
    acceptingNewPatients: true,
    acceptedInsurances: ['CPAM', 'Generali', 'April'],
    languages: ['Français'],
    rating: 4.5,
    reviewCount: 78,
    availableSlots: 8,
    nextAvailableDate: '2024-01-18'
  }
];

// Referral templates by specialty
const referralTemplates: ReferralTemplate[] = [
  {
    id: 'tmpl-001',
    name: 'Consultation Cardiologie - Bilan HTA',
    specialty: 'Cardiologie',
    referralType: 'consultation',
    priority: 'routine',
    reason: 'Bilan d\'hypertension artérielle résistante',
    requestedServices: ['Consultation spécialisée', 'ECG', 'Échocardiographie', 'Holter tensionnel'],
    requiredAttachments: ['Derniers bilans biologiques', 'Historique tensionnel'],
    instructions: 'Patient à jeun pour le bilan sanguin complémentaire',
    createdBy: 'system',
    isActive: true
  },
  {
    id: 'tmpl-002',
    name: 'Avis Néphrologique - IRC',
    specialty: 'Néphrologie',
    referralType: 'co_management',
    priority: 'routine',
    reason: 'Insuffisance rénale chronique stade 3-4',
    requestedServices: ['Consultation', 'Bilan rénal complet', 'Échographie rénale'],
    requiredAttachments: ['Créatininémie des 12 derniers mois', 'ECBU récent'],
    instructions: 'Prévoir discussion sur options de suppléance si progression',
    createdBy: 'system',
    isActive: true
  },
  {
    id: 'tmpl-003',
    name: 'Urgence Ophtalmologique - DMLA',
    specialty: 'Ophtalmologie',
    referralType: 'procedure',
    priority: 'urgent',
    reason: 'Suspicion de DMLA exsudative',
    requestedServices: ['Fond d\'œil', 'OCT', 'Angiographie si indiquée', 'IVT si confirmée'],
    requiredAttachments: ['Acuité visuelle actuelle'],
    instructions: 'Patient à voir dans les 48-72h',
    createdBy: 'system',
    isActive: true
  }
];

// In-memory storage
let referrals: Referral[] = [];

export class ReferralService {

  // Search providers by specialty, location, insurance
  searchProviders(options: {
    specialty?: string;
    subspecialty?: string;
    insurance?: string;
    acceptingNew?: boolean;
    language?: string;
    city?: string;
    query?: string;
  }): Provider[] {
    let results = [...providerDirectory];

    if (options.specialty) {
      results = results.filter(p =>
        p.specialty.toLowerCase().includes(options.specialty!.toLowerCase())
      );
    }

    if (options.subspecialty) {
      results = results.filter(p =>
        p.subspecialties.some(s => s.toLowerCase().includes(options.subspecialty!.toLowerCase()))
      );
    }

    if (options.insurance) {
      results = results.filter(p =>
        p.acceptedInsurances.some(i => i.toLowerCase().includes(options.insurance!.toLowerCase()))
      );
    }

    if (options.acceptingNew !== undefined) {
      results = results.filter(p => p.acceptingNewPatients === options.acceptingNew);
    }

    if (options.language) {
      results = results.filter(p =>
        p.languages.some(l => l.toLowerCase().includes(options.language!.toLowerCase()))
      );
    }

    if (options.city) {
      results = results.filter(p =>
        p.address.city.toLowerCase().includes(options.city!.toLowerCase())
      );
    }

    if (options.query) {
      const q = options.query.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.organizationName.toLowerCase().includes(q) ||
        p.specialty.toLowerCase().includes(q)
      );
    }

    // Sort by availability and rating
    return results.sort((a, b) => {
      if (a.acceptingNewPatients !== b.acceptingNewPatients) {
        return a.acceptingNewPatients ? -1 : 1;
      }
      return (b.rating || 0) - (a.rating || 0);
    });
  }

  // Get provider details
  getProvider(providerId: string): Provider | undefined {
    return providerDirectory.find(p => p.id === providerId);
  }

  // Get available specialties
  getSpecialties(): string[] {
    const specialties = new Set(providerDirectory.map(p => p.specialty));
    return Array.from(specialties).sort();
  }

  // Get referral templates
  getTemplates(specialty?: string): ReferralTemplate[] {
    if (specialty) {
      return referralTemplates.filter(t =>
        t.specialty.toLowerCase() === specialty.toLowerCase() && t.isActive
      );
    }
    return referralTemplates.filter(t => t.isActive);
  }

  // Create a new referral
  async createReferral(data: {
    patientId: string;
    referringProviderId: string;
    referringProviderName: string;
    referringSpecialty: string;
    receivingProviderId: string;
    referralType: Referral['referralType'];
    priority: Referral['priority'];
    reason: string;
    clinicalSummary: string;
    diagnoses: ReferralDiagnosis[];
    requestedServices: string[];
    insuranceInfo?: InsuranceInfo;
    preferredDate?: string;
    attachments?: Omit<ReferralAttachment, 'id' | 'uploadedAt'>[];
  }): Promise<Referral> {
    const receivingProvider = this.getProvider(data.receivingProviderId);
    if (!receivingProvider) {
      throw new Error('Receiving provider not found');
    }

    const now = new Date().toISOString();
    const referral: Referral = {
      id: `ref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...data,
      receivingProviderName: receivingProvider.name,
      receivingSpecialty: receivingProvider.specialty,
      status: 'pending',
      attachments: (data.attachments || []).map((a, i) => ({
        ...a,
        id: `att-${Date.now()}-${i}`,
        uploadedAt: now
      })),
      notes: [],
      createdAt: now,
      updatedAt: now,
      responseDeadline: this.calculateResponseDeadline(data.priority),
      expiresAt: this.calculateExpiryDate(data.priority)
    };

    referrals.push(referral);

    // Simulate notification to receiving provider
    await this.notifyReceivingProvider(referral);

    return referral;
  }

  // Get referral by ID
  getReferral(referralId: string): Referral | undefined {
    return referrals.find(r => r.id === referralId);
  }

  // List referrals with filters
  listReferrals(options: {
    patientId?: string;
    referringProviderId?: string;
    receivingProviderId?: string;
    status?: Referral['status'];
    priority?: Referral['priority'];
    specialty?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
    offset?: number;
  }): { referrals: Referral[]; total: number } {
    let results = [...referrals];

    if (options.patientId) {
      results = results.filter(r => r.patientId === options.patientId);
    }

    if (options.referringProviderId) {
      results = results.filter(r => r.referringProviderId === options.referringProviderId);
    }

    if (options.receivingProviderId) {
      results = results.filter(r => r.receivingProviderId === options.receivingProviderId);
    }

    if (options.status) {
      results = results.filter(r => r.status === options.status);
    }

    if (options.priority) {
      results = results.filter(r => r.priority === options.priority);
    }

    if (options.specialty) {
      results = results.filter(r =>
        r.receivingSpecialty.toLowerCase().includes(options.specialty!.toLowerCase())
      );
    }

    if (options.fromDate) {
      results = results.filter(r => r.createdAt >= options.fromDate!);
    }

    if (options.toDate) {
      results = results.filter(r => r.createdAt <= options.toDate!);
    }

    // Sort by priority and date
    results.sort((a, b) => {
      const priorityOrder = { emergent: 0, urgent: 1, routine: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = results.length;
    const offset = options.offset || 0;
    const limit = options.limit || 20;

    return {
      referrals: results.slice(offset, offset + limit),
      total
    };
  }

  // Accept a referral
  async acceptReferral(referralId: string, acceptedBy: string, notes?: string): Promise<Referral> {
    const referral = this.getReferral(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.status !== 'pending') {
      throw new Error(`Cannot accept referral with status: ${referral.status}`);
    }

    referral.status = 'accepted';
    referral.updatedAt = new Date().toISOString();

    if (notes) {
      referral.notes.push({
        id: `note-${Date.now()}`,
        authorId: acceptedBy,
        authorName: 'Receiving Provider',
        authorRole: 'specialist',
        content: notes,
        isPrivate: false,
        createdAt: new Date().toISOString()
      });
    }

    // Notify referring provider
    await this.notifyReferringProvider(referral, 'accepted');

    return referral;
  }

  // Decline a referral
  async declineReferral(referralId: string, declinedBy: string, reason: string): Promise<Referral> {
    const referral = this.getReferral(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.status !== 'pending') {
      throw new Error(`Cannot decline referral with status: ${referral.status}`);
    }

    referral.status = 'declined';
    referral.updatedAt = new Date().toISOString();

    referral.notes.push({
      id: `note-${Date.now()}`,
      authorId: declinedBy,
      authorName: 'Receiving Provider',
      authorRole: 'specialist',
      content: `Declined: ${reason}`,
      isPrivate: false,
      createdAt: new Date().toISOString()
    });

    // Notify referring provider
    await this.notifyReferringProvider(referral, 'declined');

    return referral;
  }

  // Schedule appointment for referral
  async scheduleReferral(referralId: string, data: {
    scheduledDate: string;
    appointmentId: string;
    notes?: string;
  }): Promise<Referral> {
    const referral = this.getReferral(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.status !== 'accepted') {
      throw new Error(`Cannot schedule referral with status: ${referral.status}`);
    }

    referral.status = 'scheduled';
    referral.scheduledDate = data.scheduledDate;
    referral.appointmentId = data.appointmentId;
    referral.updatedAt = new Date().toISOString();

    if (data.notes) {
      referral.notes.push({
        id: `note-${Date.now()}`,
        authorId: 'system',
        authorName: 'System',
        authorRole: 'system',
        content: data.notes,
        isPrivate: false,
        createdAt: new Date().toISOString()
      });
    }

    // Notify patient and referring provider
    await this.notifyReferringProvider(referral, 'scheduled');

    return referral;
  }

  // Complete a referral with consultation report
  async completeReferral(referralId: string, data: {
    completedBy: string;
    consultationNote: string;
    findings: string;
    recommendations: string;
    followUpRequired: boolean;
    followUpTimeframe?: string;
    attachments?: Omit<ReferralAttachment, 'id' | 'uploadedAt'>[];
  }): Promise<Referral> {
    const referral = this.getReferral(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    if (referral.status !== 'scheduled') {
      throw new Error(`Cannot complete referral with status: ${referral.status}`);
    }

    const now = new Date().toISOString();

    referral.status = 'completed';
    referral.completedAt = now;
    referral.updatedAt = now;

    // Add consultation report as note
    referral.notes.push({
      id: `note-${Date.now()}`,
      authorId: data.completedBy,
      authorName: 'Consulting Specialist',
      authorRole: 'specialist',
      content: `
## Rapport de Consultation

### Note Clinique
${data.consultationNote}

### Constatations
${data.findings}

### Recommandations
${data.recommendations}

### Suivi
${data.followUpRequired ? `Suivi requis: ${data.followUpTimeframe || 'À planifier'}` : 'Pas de suivi spécifique requis'}
      `.trim(),
      isPrivate: false,
      createdAt: now
    });

    // Add attachments
    if (data.attachments) {
      referral.attachments.push(...data.attachments.map((a, i) => ({
        ...a,
        id: `att-${Date.now()}-${i}`,
        uploadedAt: now
      })));
    }

    // Notify referring provider
    await this.notifyReferringProvider(referral, 'completed');

    return referral;
  }

  // Add note to referral
  addNote(referralId: string, note: {
    authorId: string;
    authorName: string;
    authorRole: string;
    content: string;
    isPrivate?: boolean;
  }): Referral {
    const referral = this.getReferral(referralId);
    if (!referral) {
      throw new Error('Referral not found');
    }

    referral.notes.push({
      ...note,
      id: `note-${Date.now()}`,
      isPrivate: note.isPrivate || false,
      createdAt: new Date().toISOString()
    });

    referral.updatedAt = new Date().toISOString();

    return referral;
  }

  // Get referral statistics
  getStatistics(options: {
    providerId?: string;
    isReferring?: boolean;
    fromDate?: string;
    toDate?: string;
  }): ReferralStats {
    let filtered = [...referrals];

    if (options.providerId) {
      if (options.isReferring) {
        filtered = filtered.filter(r => r.referringProviderId === options.providerId);
      } else {
        filtered = filtered.filter(r => r.receivingProviderId === options.providerId);
      }
    }

    if (options.fromDate) {
      filtered = filtered.filter(r => r.createdAt >= options.fromDate!);
    }

    if (options.toDate) {
      filtered = filtered.filter(r => r.createdAt <= options.toDate!);
    }

    // Calculate stats
    const byStatus = {
      pending: filtered.filter(r => r.status === 'pending').length,
      accepted: filtered.filter(r => r.status === 'accepted' || r.status === 'scheduled').length,
      completed: filtered.filter(r => r.status === 'completed').length,
      declined: filtered.filter(r => r.status === 'declined').length
    };

    // Calculate average response time (mock)
    const averageResponseTime = 4.5; // hours

    // Calculate average completion time (mock)
    const averageCompletionTime = 12; // days

    // Group by specialty
    const specialtyCounts: Record<string, number> = {};
    filtered.forEach(r => {
      specialtyCounts[r.receivingSpecialty] = (specialtyCounts[r.receivingSpecialty] || 0) + 1;
    });

    // Group by priority
    const priorityCounts: Record<string, number> = {};
    filtered.forEach(r => {
      priorityCounts[r.priority] = (priorityCounts[r.priority] || 0) + 1;
    });

    return {
      totalReferrals: filtered.length,
      ...byStatus,
      averageResponseTime,
      averageCompletionTime,
      bySpecialty: Object.entries(specialtyCounts).map(([specialty, count]) => ({ specialty, count })),
      byPriority: Object.entries(priorityCounts).map(([priority, count]) => ({ priority, count }))
    };
  }

  // Get pending referrals requiring action
  getPendingActions(providerId: string, isReferring: boolean): {
    awaitingResponse: Referral[];
    awaitingScheduling: Referral[];
    overdue: Referral[];
    expiringToday: Referral[];
  } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const providerReferrals = referrals.filter(r =>
      isReferring
        ? r.referringProviderId === providerId
        : r.receivingProviderId === providerId
    );

    return {
      awaitingResponse: providerReferrals.filter(r => r.status === 'pending'),
      awaitingScheduling: providerReferrals.filter(r => r.status === 'accepted'),
      overdue: providerReferrals.filter(r =>
        r.status === 'pending' &&
        r.responseDeadline &&
        r.responseDeadline < now.toISOString()
      ),
      expiringToday: providerReferrals.filter(r =>
        r.expiresAt &&
        r.expiresAt.startsWith(today) &&
        !['completed', 'cancelled', 'declined'].includes(r.status)
      )
    };
  }

  // Helper methods
  private calculateResponseDeadline(priority: Referral['priority']): string {
    const now = new Date();
    switch (priority) {
      case 'emergent':
        now.setHours(now.getHours() + 2);
        break;
      case 'urgent':
        now.setHours(now.getHours() + 24);
        break;
      case 'routine':
        now.setDate(now.getDate() + 3);
        break;
    }
    return now.toISOString();
  }

  private calculateExpiryDate(priority: Referral['priority']): string {
    const now = new Date();
    switch (priority) {
      case 'emergent':
        now.setDate(now.getDate() + 7);
        break;
      case 'urgent':
        now.setDate(now.getDate() + 30);
        break;
      case 'routine':
        now.setDate(now.getDate() + 90);
        break;
    }
    return now.toISOString();
  }

  private async notifyReceivingProvider(referral: Referral): Promise<void> {
    // In production, send notification via email/SMS/push
    console.log(`[Referral] New referral ${referral.id} sent to ${referral.receivingProviderName}`);
  }

  private async notifyReferringProvider(referral: Referral, event: string): Promise<void> {
    // In production, send notification via email/SMS/push
    console.log(`[Referral] Referral ${referral.id} ${event} - notifying ${referral.referringProviderName}`);
  }
}
