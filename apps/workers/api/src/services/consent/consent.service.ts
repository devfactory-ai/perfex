/**
 * Consent Management Service
 * HIPAA/GDPR compliant consent capture and management
 */


// =============================================================================
// Types & Interfaces
// =============================================================================

export type ConsentType =
  | 'treatment'          // Consent to treatment
  | 'data_processing'    // GDPR data processing
  | 'data_sharing'       // Share with third parties
  | 'research'           // Clinical research participation
  | 'marketing'          // Marketing communications
  | 'telemedicine'       // Telemedicine consent
  | 'emergency_contact'  // Emergency contact permission
  | 'photo_video'        // Photo/video for medical records
  | 'genetic_testing'    // Genetic/genomic testing
  | 'advance_directive'  // Living will/advance directive
  | 'procedure'          // Specific procedure consent
  | 'anesthesia'         // Anesthesia consent
  | 'blood_transfusion'  // Blood transfusion consent
  | 'organ_donation'     // Organ donation preference
  | 'hipaa_disclosure';  // HIPAA authorization for disclosure

export type ConsentStatus =
  | 'pending'
  | 'granted'
  | 'denied'
  | 'withdrawn'
  | 'expired';

export interface Consent {
  id: string;
  patientId: string;
  type: ConsentType;
  status: ConsentStatus;
  version: string;
  title: string;
  description: string;
  legalText: string;
  effectiveDate: Date;
  expirationDate?: Date;
  grantedAt?: Date;
  grantedBy?: string;
  grantedMethod: 'electronic' | 'paper' | 'verbal';
  withdrawnAt?: Date;
  withdrawnBy?: string;
  withdrawReason?: string;
  scope?: {
    dataCategories?: string[];
    recipients?: string[];
    purposes?: string[];
    duration?: string;
  };
  witness?: {
    name: string;
    role: string;
    signature?: string;
    date: Date;
  };
  ipAddress?: string;
  userAgent?: string;
  documentUrl?: string;
  signatureUrl?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentTemplate {
  id: string;
  type: ConsentType;
  version: string;
  title: string;
  description: string;
  legalText: string;
  isActive: boolean;
  requiresWitness: boolean;
  expirationDays?: number;
  module?: 'dialyse' | 'cardiology' | 'ophthalmology' | 'general';
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentAuditLog {
  id: string;
  consentId: string;
  action: 'created' | 'viewed' | 'granted' | 'denied' | 'withdrawn' | 'expired' | 'updated';
  performedBy: string;
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

// =============================================================================
// Consent Templates Database
// =============================================================================

const CONSENT_TEMPLATES: ConsentTemplate[] = [
  // GDPR Data Processing
  {
    id: 'tpl-gdpr-001',
    type: 'data_processing',
    version: '1.0',
    title: 'Consentement au traitement des données personnelles',
    description: 'Autorisation de traitement des données de santé conformément au RGPD',
    legalText: `
CONSENTEMENT AU TRAITEMENT DES DONNÉES PERSONNELLES DE SANTÉ

Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, je soussigné(e) autorise [NOM DE L'ÉTABLISSEMENT] à collecter et traiter mes données personnelles de santé aux fins suivantes :

1. FINALITÉS DU TRAITEMENT
- Gestion de mon dossier médical
- Coordination des soins entre professionnels de santé
- Facturation et remboursement des actes médicaux
- Suivi de la qualité des soins

2. CATÉGORIES DE DONNÉES COLLECTÉES
- Données d'identification (nom, prénom, date de naissance, adresse)
- Données de santé (antécédents, traitements, résultats d'examens)
- Données administratives (numéro de sécurité sociale, mutuelle)

3. DURÉE DE CONSERVATION
Les données sont conservées pendant 20 ans à compter du dernier passage dans l'établissement, conformément à la réglementation en vigueur.

4. VOS DROITS
Vous disposez des droits suivants : accès, rectification, effacement, limitation, opposition, portabilité.
Pour exercer ces droits, contactez notre Délégué à la Protection des Données à : dpo@etablissement.fr

5. RETRAIT DU CONSENTEMENT
Vous pouvez retirer votre consentement à tout moment en nous contactant.
    `.trim(),
    isActive: true,
    requiresWitness: false,
    expirationDays: 365 * 5, // 5 years
    module: 'general',
    language: 'fr',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Treatment Consent
  {
    id: 'tpl-treatment-001',
    type: 'treatment',
    version: '1.0',
    title: 'Consentement aux soins',
    description: 'Consentement général aux soins médicaux',
    legalText: `
CONSENTEMENT ÉCLAIRÉ AUX SOINS

Je soussigné(e) déclare avoir été informé(e) par le Dr. _____________ :

1. De la nature et du déroulement de l'acte ou du traitement proposé
2. Des bénéfices attendus
3. Des risques et complications possibles
4. Des alternatives thérapeutiques existantes
5. Des conséquences prévisibles en cas de refus

J'ai pu poser toutes les questions que je souhaitais et j'ai reçu des réponses claires.

Je consens librement aux soins proposés.

Je suis informé(e) que je peux retirer ce consentement à tout moment.
    `.trim(),
    isActive: true,
    requiresWitness: false,
    module: 'general',
    language: 'fr',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Dialysis Specific Consent
  {
    id: 'tpl-dialyse-001',
    type: 'treatment',
    version: '1.0',
    title: 'Consentement au traitement par hémodialyse',
    description: 'Consentement spécifique pour le traitement par hémodialyse',
    legalText: `
CONSENTEMENT AU TRAITEMENT PAR HÉMODIALYSE

Je soussigné(e) reconnais avoir été informé(e) par mon médecin de :

1. LA NÉCESSITÉ DU TRAITEMENT
L'hémodialyse est nécessaire car mes reins ne peuvent plus assurer leur fonction d'épuration du sang.

2. LE DÉROULEMENT DU TRAITEMENT
- Séances de 3 à 5 heures, 3 fois par semaine
- Nécessité d'un accès vasculaire (fistule, cathéter)
- Surveillance régulière des paramètres cliniques et biologiques

3. LES RISQUES POTENTIELS
- Hypotension pendant les séances
- Crampes musculaires
- Infections liées à l'accès vasculaire
- Complications cardio-vasculaires à long terme

4. LES ALTERNATIVES
- Dialyse péritonéale
- Transplantation rénale (si éligible)
- Traitement conservateur

J'accepte librement de débuter/poursuivre le traitement par hémodialyse.
    `.trim(),
    isActive: true,
    requiresWitness: true,
    module: 'dialyse',
    language: 'fr',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Cardiology Procedure Consent
  {
    id: 'tpl-cardio-procedure-001',
    type: 'procedure',
    version: '1.0',
    title: 'Consentement coronarographie / angioplastie',
    description: 'Consentement pour procédures cardiaques interventionnelles',
    legalText: `
CONSENTEMENT POUR CORONAROGRAPHIE ET/OU ANGIOPLASTIE CORONAIRE

Je soussigné(e) reconnais avoir été informé(e) de la procédure suivante :

1. NATURE DE L'EXAMEN/INTERVENTION
La coronarographie est un examen radiologique des artères du cœur. Si nécessaire, une angioplastie (dilatation avec pose de stent) peut être réalisée dans le même temps.

2. DÉROULEMENT
- Accès par l'artère radiale (poignet) ou fémorale (aine)
- Anesthésie locale
- Injection de produit de contraste iodé
- Durée : 30 minutes à 2 heures

3. RISQUES
- Hématome au point de ponction (fréquent)
- Allergie au produit de contraste (rare)
- Complications rénales liées au contraste (surveillance)
- Complications graves (infarctus, AVC, décès) : < 1%

4. BÉNÉFICES ATTENDUS
- Diagnostic précis des lésions coronaires
- Traitement des sténoses significatives
- Amélioration des symptômes

J'autorise la réalisation de cet examen/intervention.
    `.trim(),
    isActive: true,
    requiresWitness: true,
    module: 'cardiology',
    language: 'fr',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Ophthalmology IVT Consent
  {
    id: 'tpl-ophtalmo-ivt-001',
    type: 'procedure',
    version: '1.0',
    title: 'Consentement injection intravitréenne (IVT)',
    description: 'Consentement pour injection anti-VEGF intravitréenne',
    legalText: `
CONSENTEMENT POUR INJECTION INTRAVITRÉENNE (IVT)

Je soussigné(e) reconnais avoir été informé(e) :

1. INDICATION
L'injection intravitréenne d'anti-VEGF est proposée pour traiter :
□ Dégénérescence maculaire liée à l'âge (DMLA) humide
□ Œdème maculaire diabétique
□ Occlusion veineuse rétinienne
□ Autre : _______________

2. DÉROULEMENT
- Réalisée en conditions stériles
- Anesthésie locale par collyre
- Injection dans le vitré (gelée de l'œil)
- Durée : quelques minutes

3. RISQUES
- Inconfort, sensation de corps étranger (fréquent)
- Hémorragie sous-conjonctivale (fréquent, bénin)
- Hypertonie oculaire transitoire (surveillance)
- Endophtalmie (infection grave) : < 0.1%
- Décollement de rétine (rare)

4. SUITES
- Contrôle mensuel recommandé
- Plusieurs injections généralement nécessaires
- Signes d'alerte : douleur, baisse vision, rougeur importante

J'accepte de recevoir cette injection.
    `.trim(),
    isActive: true,
    requiresWitness: false,
    module: 'ophthalmology',
    language: 'fr',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Research Consent
  {
    id: 'tpl-research-001',
    type: 'research',
    version: '1.0',
    title: 'Consentement à la recherche clinique',
    description: 'Participation à une étude de recherche clinique',
    legalText: `
CONSENTEMENT À LA PARTICIPATION À UNE RECHERCHE CLINIQUE

Titre de l'étude : _______________
Promoteur : _______________
Investigateur principal : _______________

Je soussigné(e) :

1. CONFIRME avoir reçu et lu la note d'information
2. AVOIR EU le temps de réfléchir et poser mes questions
3. COMPRENDRE que ma participation est volontaire
4. COMPRENDRE que je peux me retirer à tout moment sans conséquence sur mes soins
5. ACCEPTER le traitement de mes données à des fins de recherche
6. ACCEPTER d'être contacté(e) pour le suivi de l'étude

CONDITIONS PARTICULIÈRES :
□ J'accepte que mes échantillons soient conservés pour recherches futures
□ J'accepte d'être recontacté(e) pour d'autres études
□ Je souhaite être informé(e) des résultats de l'étude

Je consens librement à participer à cette recherche.
    `.trim(),
    isActive: true,
    requiresWitness: true,
    expirationDays: 365 * 2, // 2 years
    module: 'general',
    language: 'fr',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Telemedicine Consent
  {
    id: 'tpl-telemedicine-001',
    type: 'telemedicine',
    version: '1.0',
    title: 'Consentement à la télémédecine',
    description: 'Autorisation pour consultations à distance',
    legalText: `
CONSENTEMENT À LA TÉLÉMÉDECINE

Je soussigné(e) accepte de bénéficier d'actes de télémédecine :

1. TYPES D'ACTES AUTORISÉS
□ Téléconsultation (consultation à distance)
□ Téléexpertise (avis spécialisé à distance)
□ Télésurveillance (suivi à distance des paramètres)
□ Téléassistance (assistance à distance d'un professionnel)

2. INFORMATIONS TECHNIQUES
- Les échanges sont sécurisés et confidentiels
- Les données sont hébergées chez un hébergeur agréé
- L'enregistrement de la consultation n'est pas systématique

3. LIMITES
Je comprends que certaines situations nécessitent une consultation en présentiel.
Le médecin peut à tout moment décider de me recevoir physiquement.

4. CONDITIONS
□ Je dispose d'une connexion internet suffisante
□ Je m'engage à être dans un lieu calme et confidentiel
□ Je consens à l'utilisation de la caméra et du microphone

Je peux retirer ce consentement à tout moment.
    `.trim(),
    isActive: true,
    requiresWitness: false,
    module: 'general',
    language: 'fr',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// =============================================================================
// Consent Management Service
// =============================================================================

export class ConsentService {
  

  /**
   * Get all consent templates
   */
  async getTemplates(module?: string): Promise<ConsentTemplate[]> {
    let templates = CONSENT_TEMPLATES.filter(t => t.isActive);
    if (module) {
      templates = templates.filter(t => t.module === module || t.module === 'general');
    }
    return templates;
  }

  /**
   * Get a specific template
   */
  async getTemplate(templateId: string): Promise<ConsentTemplate | null> {
    return CONSENT_TEMPLATES.find(t => t.id === templateId) || null;
  }

  /**
   * Get patient consents
   */
  async getPatientConsents(
    patientId: string,
    options?: { type?: ConsentType; status?: ConsentStatus }
  ): Promise<Consent[]> {
    // In real implementation, query database
    // Return mock data for now
    return [];
  }

  /**
   * Create a new consent request
   */
  async createConsent(data: {
    patientId: string;
    templateId: string;
    effectiveDate?: Date;
    expirationDate?: Date;
    scope?: Consent['scope'];
    notes?: string;
  }): Promise<Consent> {
    const template = await this.getTemplate(data.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const consent: Consent = {
      id: `consent-${Date.now()}`,
      patientId: data.patientId,
      type: template.type,
      status: 'pending',
      version: template.version,
      title: template.title,
      description: template.description,
      legalText: template.legalText,
      effectiveDate: data.effectiveDate || new Date(),
      expirationDate: data.expirationDate || (template.expirationDays
        ? new Date(Date.now() + template.expirationDays * 24 * 60 * 60 * 1000)
        : undefined),
      grantedMethod: 'electronic',
      scope: data.scope,
      notes: data.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Would save to database here

    return consent;
  }

  /**
   * Grant consent
   */
  async grantConsent(
    consentId: string,
    data: {
      grantedBy: string;
      grantedMethod: 'electronic' | 'paper' | 'verbal';
      signatureUrl?: string;
      witness?: Consent['witness'];
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<Consent> {
    // Would fetch and update consent in database
    const consent: Consent = {
      id: consentId,
      patientId: 'patient-1',
      type: 'treatment',
      status: 'granted',
      version: '1.0',
      title: 'Consent',
      description: 'Description',
      legalText: 'Legal text',
      effectiveDate: new Date(),
      grantedAt: new Date(),
      grantedBy: data.grantedBy,
      grantedMethod: data.grantedMethod,
      signatureUrl: data.signatureUrl,
      witness: data.witness,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Log audit event
    await this.logAuditEvent({
      consentId,
      action: 'granted',
      performedBy: data.grantedBy,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    });

    return consent;
  }

  /**
   * Withdraw consent
   */
  async withdrawConsent(
    consentId: string,
    data: {
      withdrawnBy: string;
      reason?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<Consent> {
    // Would fetch and update consent in database
    const consent: Consent = {
      id: consentId,
      patientId: 'patient-1',
      type: 'treatment',
      status: 'withdrawn',
      version: '1.0',
      title: 'Consent',
      description: 'Description',
      legalText: 'Legal text',
      effectiveDate: new Date(),
      withdrawnAt: new Date(),
      withdrawnBy: data.withdrawnBy,
      withdrawReason: data.reason,
      grantedMethod: 'electronic',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Log audit event
    await this.logAuditEvent({
      consentId,
      action: 'withdrawn',
      performedBy: data.withdrawnBy,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: { reason: data.reason }
    });

    return consent;
  }

  /**
   * Check if patient has valid consent for a specific type
   */
  async hasValidConsent(patientId: string, type: ConsentType): Promise<boolean> {
    const consents = await this.getPatientConsents(patientId, { type, status: 'granted' });
    const now = new Date();

    return consents.some(c =>
      c.status === 'granted' &&
      c.effectiveDate <= now &&
      (!c.expirationDate || c.expirationDate > now)
    );
  }

  /**
   * Get consents expiring soon
   */
  async getExpiringConsents(daysAhead: number = 30): Promise<Consent[]> {
    const futureDate = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000);
    // Would query database for consents expiring before futureDate
    return [];
  }

  /**
   * Log consent audit event
   */
  private async logAuditEvent(data: {
    consentId: string;
    action: ConsentAuditLog['action'];
    performedBy: string;
    ipAddress?: string;
    userAgent?: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    const auditLog: ConsentAuditLog = {
      id: `audit-${Date.now()}`,
      consentId: data.consentId,
      action: data.action,
      performedBy: data.performedBy,
      performedAt: new Date(),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      details: data.details
    };

    // Would save to audit log table
    console.log('Consent audit:', auditLog);
  }

  /**
   * Get consent audit trail
   */
  async getConsentAuditTrail(consentId: string): Promise<ConsentAuditLog[]> {
    // Would query audit log table
    return [];
  }

  /**
   * Generate consent PDF
   */
  async generateConsentPDF(consentId: string): Promise<{ url: string; filename: string }> {
    // Would generate PDF and upload to storage
    return {
      url: `/documents/consent-${consentId}.pdf`,
      filename: `consent-${consentId}.pdf`
    };
  }

  /**
   * Verify consent signature
   */
  async verifySignature(consentId: string, signatureData: string): Promise<boolean> {
    // Would verify electronic signature
    return true;
  }
}

export const consentService = new ConsentService();
