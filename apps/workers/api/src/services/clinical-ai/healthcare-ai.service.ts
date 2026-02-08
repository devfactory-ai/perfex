/**
 * Healthcare AI Service
 * Core AI service for clinical documentation, patient summaries, and diagnostic suggestions
 * Uses Cloudflare Workers AI (Llama 3.1)
 */

import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, sql } from 'drizzle-orm';
import {
  clinicalDocumentation,
  patientSummaries,
  diagnosticSuggestions,
  aiClinicalPrompts,
  clinicalAiUsage,
  healthcarePatients,
  healthcareConsultations,
} from '@perfex/database';

// ============================================================================
// TYPES
// ============================================================================

export type DocumentType =
  | 'consultation_note'
  | 'discharge_summary'
  | 'referral_letter'
  | 'progress_note'
  | 'surgical_report'
  | 'procedure_note'
  | 'admission_note'
  | 'transfer_note';

export type SummaryType =
  | 'comprehensive'
  | 'admission'
  | 'discharge'
  | 'specialty'
  | 'problem_focused'
  | 'pre_operative'
  | 'handoff';

export type Module = 'dialyse' | 'cardiology' | 'ophthalmology' | 'general';

export type UrgencyLevel = 'routine' | 'soon' | 'urgent' | 'emergent' | 'critical';

export interface ClinicalContext {
  patientId: string;
  module?: Module;
  symptoms?: string[];
  vitalSigns?: Record<string, any>;
  labResults?: Record<string, any>;
  medications?: string[];
  allergies?: string[];
  medicalHistory?: string[];
  chiefComplaint?: string;
  physicalExam?: string;
}

export interface GenerateDocumentRequest {
  patientId: string;
  documentType: DocumentType;
  module?: Module;
  consultationId?: string;
  encounterId?: string;
  context: ClinicalContext;
  language?: 'fr' | 'en';
  customPrompt?: string;
}

export interface GenerateDocumentResponse {
  id: string;
  documentType: DocumentType;
  draft: string;
  extractedEntities?: Record<string, any>;
  extractedCodes?: Record<string, any>;
  generationTimeMs: number;
  aiModel: string;
}

export interface GenerateSummaryRequest {
  patientId: string;
  summaryType: SummaryType;
  module?: Module;
  dateRange?: { from: Date; to: Date };
  includeLabResults?: boolean;
  includeMedications?: boolean;
  language?: 'fr' | 'en';
}

export interface GenerateSummaryResponse {
  id: string;
  summaryType: SummaryType;
  content: string;
  structuredData?: {
    keyProblems?: string[];
    activeMedications?: string[];
    recentProcedures?: string[];
    pendingActions?: string[];
    criticalAlerts?: string[];
  };
  generationTimeMs: number;
  aiModel: string;
  confidence: number;
}

export interface DiagnosticInput {
  symptoms: Array<{ name: string; severity?: number; duration?: string }>;
  vitalSigns?: {
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    respiratoryRate?: number;
  };
  labResults?: Record<string, { value: number; unit: string; normalRange?: string }>;
  imagingFindings?: string[];
  medicalHistory?: string[];
  currentMedications?: string[];
  allergies?: string[];
}

export interface DiagnosticSuggestionRequest {
  patientId: string;
  module?: Module;
  consultationId?: string;
  encounterId?: string;
  input: DiagnosticInput;
  language?: 'fr' | 'en';
}

export interface DiagnosticSuggestionResponse {
  id: string;
  differentialDiagnoses: Array<{
    diagnosis: string;
    icdCode?: string;
    confidence: number;
    reasoning: string;
  }>;
  primaryDiagnosis?: {
    diagnosis: string;
    icdCode?: string;
    confidence: number;
  };
  recommendedTests: Array<{
    test: string;
    rationale: string;
    urgency: UrgencyLevel;
  }>;
  recommendedImaging?: Array<{
    imaging: string;
    rationale: string;
  }>;
  redFlags: string[];
  drugInteractions?: Array<{
    drugs: string[];
    severity: string;
    effect: string;
  }>;
  urgencyAssessment: UrgencyLevel;
  urgencyRationale: string;
  clinicalReasoning: string;
  generationTimeMs: number;
  aiModel: string;
  confidence: number;
}

export interface TranscriptionRequest {
  audioUrl: string;
  language?: 'fr' | 'en';
  speakerDiarization?: boolean;
}

export interface TranscriptionResponse {
  transcription: string;
  confidence: number;
  language: string;
  segments?: Array<{
    speaker?: string;
    text: string;
    startTime: number;
    endTime: number;
  }>;
}

// ============================================================================
// CLINICAL PROMPTS
// ============================================================================

const CLINICAL_SYSTEM_PROMPTS = {
  documentation_fr: `Tu es un assistant médical expert en documentation clinique française.
Tu génères des documents médicaux professionnels, précis et conformes aux standards français.
Utilise un langage médical approprié tout en restant compréhensible.
Respecte la confidentialité et les normes RGPD.
Structure tes réponses de manière claire avec des sections appropriées.`,

  documentation_en: `You are an expert medical documentation assistant.
You generate professional, accurate medical documents following clinical standards.
Use appropriate medical terminology while remaining clear.
Respect patient confidentiality and HIPAA/GDPR regulations.
Structure your responses clearly with appropriate sections.`,

  summary_fr: `Tu es un assistant médical expert en synthèse de dossiers patients.
Tu génères des résumés complets et structurés du parcours de soins du patient.
Identifie les problèmes clés, traitements actifs, et actions en attente.
Mets en évidence les alertes critiques et informations urgentes.`,

  summary_en: `You are an expert medical assistant for patient record synthesis.
You generate comprehensive and structured summaries of patient care journeys.
Identify key problems, active treatments, and pending actions.
Highlight critical alerts and urgent information.`,

  diagnostic_fr: `Tu es un assistant d'aide au diagnostic médical.
Tu analyses les symptômes, signes vitaux, et résultats d'examens pour suggérer des diagnostics différentiels.
Tu identifies les red flags et situations d'urgence.
Tu recommandes des examens complémentaires avec justification clinique.
IMPORTANT: Tes suggestions sont une aide à la décision et doivent être validées par un médecin.`,

  diagnostic_en: `You are a medical diagnostic assistance assistant.
You analyze symptoms, vital signs, and exam results to suggest differential diagnoses.
You identify red flags and emergency situations.
You recommend additional tests with clinical justification.
IMPORTANT: Your suggestions are decision support tools and must be validated by a physician.`,
};

const DOCUMENT_TEMPLATES = {
  consultation_note_fr: `Génère une note de consultation médicale structurée avec:
- Motif de consultation
- Anamnèse
- Examen clinique
- Hypothèses diagnostiques
- Plan de prise en charge
- Traitement prescrit
- Consignes au patient`,

  discharge_summary_fr: `Génère un compte-rendu d'hospitalisation structuré avec:
- Dates d'admission et sortie
- Motif d'hospitalisation
- Antécédents pertinents
- Histoire de la maladie
- Examens réalisés et résultats
- Évolution hospitalière
- Diagnostic de sortie
- Traitement de sortie
- Consignes de suivi`,

  referral_letter_fr: `Génère une lettre d'adressage à un confrère avec:
- Identification du médecin destinataire
- Présentation du patient
- Motif de l'adressage
- Résumé de l'histoire médicale
- Examens déjà réalisés
- Question posée ou prise en charge souhaitée`,
};

// ============================================================================
// SERVICE
// ============================================================================

export class HealthcareAIService {
  private drizzleDb: ReturnType<typeof drizzle>;

  constructor(
    private db: D1Database,
    private ai: Ai,
    private cache: KVNamespace,
    private defaultModel: string = '@cf/meta/llama-3.1-8b-instruct'
  ) {
    this.drizzleDb = drizzle(db);
  }

  // ==========================================================================
  // CLINICAL DOCUMENTATION
  // ==========================================================================

  /**
   * Generate a clinical document using AI
   * CLINICAL-AI-001
   */
  async generateDocument(
    userId: string,
    companyId: string,
    request: GenerateDocumentRequest
  ): Promise<GenerateDocumentResponse> {
    const startTime = Date.now();
    const language = request.language || 'fr';

    // Build the prompt
    const systemPrompt = language === 'fr'
      ? CLINICAL_SYSTEM_PROMPTS.documentation_fr
      : CLINICAL_SYSTEM_PROMPTS.documentation_en;

    const documentTemplate = DOCUMENT_TEMPLATES[`${request.documentType}_${language}`] || '';

    // Get patient info
    const patient = await this.drizzleDb
      .select()
      .from(healthcarePatients)
      .where(eq(healthcarePatients.id, request.patientId))
      .get() as any;

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Build context string
    const contextParts: string[] = [
      `Patient: ${patient.firstName} ${patient.lastName}`,
      `Date de naissance: ${patient.dateOfBirth}`,
      `Sexe: ${patient.gender}`,
    ];

    if (request.context.chiefComplaint) {
      contextParts.push(`Motif: ${request.context.chiefComplaint}`);
    }

    if (request.context.symptoms?.length) {
      contextParts.push(`Symptômes: ${request.context.symptoms.join(', ')}`);
    }

    if (request.context.vitalSigns) {
      const vitals = request.context.vitalSigns;
      const vitalsParts: string[] = [];
      if (vitals.bloodPressure) vitalsParts.push(`TA: ${vitals.bloodPressure}`);
      if (vitals.heartRate) vitalsParts.push(`FC: ${vitals.heartRate}/min`);
      if (vitals.temperature) vitalsParts.push(`T°: ${vitals.temperature}°C`);
      if (vitals.oxygenSaturation) vitalsParts.push(`SpO2: ${vitals.oxygenSaturation}%`);
      if (vitalsParts.length) contextParts.push(`Signes vitaux: ${vitalsParts.join(', ')}`);
    }

    if (request.context.medicalHistory?.length) {
      contextParts.push(`Antécédents: ${request.context.medicalHistory.join(', ')}`);
    }

    if (request.context.medications?.length) {
      contextParts.push(`Traitements en cours: ${request.context.medications.join(', ')}`);
    }

    if (request.context.allergies?.length) {
      contextParts.push(`Allergies: ${request.context.allergies.join(', ')}`);
    }

    if (request.context.labResults) {
      const labParts = Object.entries(request.context.labResults)
        .map(([key, val]) => `${key}: ${JSON.stringify(val)}`)
        .join(', ');
      contextParts.push(`Résultats biologiques: ${labParts}`);
    }

    if (request.context.physicalExam) {
      contextParts.push(`Examen clinique: ${request.context.physicalExam}`);
    }

    const userPrompt = `${documentTemplate}

Contexte clinique:
${contextParts.join('\n')}

${request.customPrompt || ''}

Génère le document ${request.documentType} de manière professionnelle et complète.`;

    // Call AI
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const aiResponse = await this.ai.run(this.defaultModel, {
      messages,
      max_tokens: 2000,
      temperature: 0.3,
    }) as any;

    const generationTimeMs = Date.now() - startTime;
    const draft = aiResponse.response || aiResponse.content || '';

    // Extract entities and codes (basic extraction)
    const extractedEntities = await this.extractClinicalEntities(draft);
    const extractedCodes = await this.extractMedicalCodes(draft);

    // Save to database
    const docId = crypto.randomUUID();
    const now = new Date();

    await this.drizzleDb.insert(clinicalDocumentation).values({
      id: docId,
      patientId: request.patientId,
      encounterId: request.encounterId,
      consultationId: request.consultationId,
      companyId,
      documentType: request.documentType,
      module: request.module || 'general',
      aiGeneratedDraft: draft,
      aiModel: this.defaultModel,
      promptUsed: userPrompt,
      generationTimeMs,
      inputContext: JSON.stringify(request.context),
      extractedEntities: JSON.stringify(extractedEntities),
      extractedCodes: JSON.stringify(extractedCodes),
      status: 'draft',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Track usage
    await this.trackUsage(userId, companyId, 'documentation', {
      model: this.defaultModel,
      latencyMs: generationTimeMs,
      entityType: 'clinical_documentation',
      entityId: docId,
    });

    return {
      id: docId,
      documentType: request.documentType,
      draft,
      extractedEntities,
      extractedCodes,
      generationTimeMs,
      aiModel: this.defaultModel,
    };
  }

  /**
   * Update and finalize a clinical document
   * CLINICAL-AI-002
   */
  async finalizeDocument(
    userId: string,
    companyId: string,
    documentId: string,
    finalContent: string
  ): Promise<void> {
    await this.drizzleDb
      .update(clinicalDocumentation)
      .set({
        finalContent,
        status: 'pending_review',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clinicalDocumentation.id, documentId),
          eq(clinicalDocumentation.companyId, companyId)
        )
      );
  }

  /**
   * Sign a clinical document
   * CLINICAL-AI-003
   */
  async signDocument(
    userId: string,
    companyId: string,
    documentId: string,
    digitalSignature?: string
  ): Promise<void> {
    await this.drizzleDb
      .update(clinicalDocumentation)
      .set({
        status: 'signed',
        signedBy: userId,
        signedAt: new Date(),
        digitalSignature,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(clinicalDocumentation.id, documentId),
          eq(clinicalDocumentation.companyId, companyId)
        )
      );
  }

  // ==========================================================================
  // PATIENT SUMMARIES
  // ==========================================================================

  /**
   * Generate a patient summary
   * CLINICAL-AI-004
   */
  async generateSummary(
    userId: string,
    companyId: string,
    request: GenerateSummaryRequest
  ): Promise<GenerateSummaryResponse> {
    const startTime = Date.now();
    const language = request.language || 'fr';

    // Get patient info
    const patient = await this.drizzleDb
      .select()
      .from(healthcarePatients)
      .where(
        and(
          eq(healthcarePatients.id, request.patientId),
          eq(healthcarePatients.companyId, companyId)
        )
      )
      .get() as any;

    if (!patient) {
      throw new Error('Patient not found');
    }

    // Get recent consultations
    const consultations = await this.drizzleDb
      .select()
      .from(healthcareConsultations)
      .where(eq(healthcareConsultations.patientId, request.patientId))
      .orderBy(desc(healthcareConsultations.consultationDate))
      .limit(10)
      .all() as any[];

    // Build context
    const patientContext = {
      demographics: {
        name: `${patient.firstName} ${patient.lastName}`,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodType: patient.bloodType,
      },
      medicalHistory: patient.medicalHistory,
      allergies: patient.allergies,
      currentMedications: patient.currentMedications,
      chronicConditions: patient.chronicConditions,
      recentConsultations: consultations.map((c: any) => ({
        date: c.consultationDate,
        reason: c.reasonForVisit,
        diagnosis: c.diagnosis,
        notes: c.notes,
      })),
    };

    const systemPrompt = language === 'fr'
      ? CLINICAL_SYSTEM_PROMPTS.summary_fr
      : CLINICAL_SYSTEM_PROMPTS.summary_en;

    const summaryTypePrompts: Record<SummaryType, string> = {
      comprehensive: 'Génère un résumé complet du dossier patient',
      admission: 'Génère un résumé d\'admission',
      discharge: 'Génère un résumé de sortie d\'hospitalisation',
      specialty: `Génère un résumé spécialisé pour le module ${request.module}`,
      problem_focused: 'Génère un résumé centré sur les problèmes actifs',
      pre_operative: 'Génère un résumé pré-opératoire',
      handoff: 'Génère un résumé de transmission inter-équipes',
    };

    const userPrompt = `${summaryTypePrompts[request.summaryType]}

Données du patient:
${JSON.stringify(patientContext, null, 2)}

Génère un résumé structuré en JSON avec les sections suivantes:
{
  "summary": "Texte du résumé complet",
  "keyProblems": ["liste des problèmes clés"],
  "activeMedications": ["liste des médicaments actifs"],
  "recentProcedures": ["liste des procédures récentes"],
  "pendingActions": ["liste des actions en attente"],
  "criticalAlerts": ["alertes critiques le cas échéant"]
}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const aiResponse = await this.ai.run(this.defaultModel, {
      messages,
      max_tokens: 2000,
      temperature: 0.3,
    }) as any;

    const generationTimeMs = Date.now() - startTime;
    const responseText = aiResponse.response || aiResponse.content || '';

    // Try to parse JSON response
    let content = responseText;
    let structuredData: any = {};

    try {
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        content = parsed.summary || responseText;
        structuredData = {
          keyProblems: parsed.keyProblems || [],
          activeMedications: parsed.activeMedications || [],
          recentProcedures: parsed.recentProcedures || [],
          pendingActions: parsed.pendingActions || [],
          criticalAlerts: parsed.criticalAlerts || [],
        };
      }
    } catch {
      // If parsing fails, use raw response
      content = responseText;
    }

    // Save to database
    const summaryId = crypto.randomUUID();
    const now = new Date();

    await this.drizzleDb.insert(patientSummaries).values({
      id: summaryId,
      patientId: request.patientId,
      companyId,
      summaryType: request.summaryType,
      module: request.module || 'general',
      title: `${request.summaryType} - ${patient.firstName} ${patient.lastName}`,
      content,
      contentFormat: 'markdown',
      structuredData: JSON.stringify(structuredData),
      keyProblems: JSON.stringify(structuredData.keyProblems || []),
      activeMedications: JSON.stringify(structuredData.activeMedications || []),
      recentProcedures: JSON.stringify(structuredData.recentProcedures || []),
      pendingActions: JSON.stringify(structuredData.pendingActions || []),
      criticalAlerts: JSON.stringify(structuredData.criticalAlerts || []),
      aiModel: this.defaultModel,
      aiConfidence: 0.85,
      generationTimeMs,
      dataRange: request.dateRange ? JSON.stringify(request.dateRange) : null,
      lastRefreshed: now,
      autoRefresh: true,
      refreshFrequency: 'on_change',
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    });

    // Track usage
    await this.trackUsage(userId, companyId, 'summary', {
      model: this.defaultModel,
      latencyMs: generationTimeMs,
      entityType: 'patient_summary',
      entityId: summaryId,
    });

    return {
      id: summaryId,
      summaryType: request.summaryType,
      content,
      structuredData,
      generationTimeMs,
      aiModel: this.defaultModel,
      confidence: 0.85,
    };
  }

  /**
   * Get patient summaries
   * CLINICAL-AI-005
   */
  async getPatientSummaries(
    companyId: string,
    patientId: string,
    summaryType?: SummaryType
  ): Promise<any[]> {
    let query = this.drizzleDb
      .select()
      .from(patientSummaries)
      .where(
        and(
          eq(patientSummaries.patientId, patientId),
          eq(patientSummaries.companyId, companyId)
        )
      )
      .$dynamic();

    if (summaryType) {
      query = query.where(eq(patientSummaries.summaryType, summaryType));
    }

    return query.orderBy(desc(patientSummaries.createdAt)).limit(20).all();
  }

  // ==========================================================================
  // DIAGNOSTIC SUGGESTIONS
  // ==========================================================================

  /**
   * Generate diagnostic suggestions
   * CLINICAL-AI-006
   */
  async generateDiagnosticSuggestions(
    userId: string,
    companyId: string,
    request: DiagnosticSuggestionRequest
  ): Promise<DiagnosticSuggestionResponse> {
    const startTime = Date.now();
    const language = request.language || 'fr';

    const systemPrompt = language === 'fr'
      ? CLINICAL_SYSTEM_PROMPTS.diagnostic_fr
      : CLINICAL_SYSTEM_PROMPTS.diagnostic_en;

    // Build input summary
    const inputSummary: string[] = [];

    // Symptoms
    if (request.input.symptoms?.length) {
      const symptomsText = request.input.symptoms
        .map(s => `${s.name}${s.severity ? ` (sévérité: ${s.severity}/10)` : ''}${s.duration ? ` - durée: ${s.duration}` : ''}`)
        .join('\n- ');
      inputSummary.push(`**Symptômes:**\n- ${symptomsText}`);
    }

    // Vital signs
    if (request.input.vitalSigns) {
      const vs = request.input.vitalSigns;
      const vitalsParts: string[] = [];
      if (vs.bloodPressure) vitalsParts.push(`TA: ${vs.bloodPressure.systolic}/${vs.bloodPressure.diastolic} mmHg`);
      if (vs.heartRate) vitalsParts.push(`FC: ${vs.heartRate}/min`);
      if (vs.temperature) vitalsParts.push(`T°: ${vs.temperature}°C`);
      if (vs.oxygenSaturation) vitalsParts.push(`SpO2: ${vs.oxygenSaturation}%`);
      if (vs.respiratoryRate) vitalsParts.push(`FR: ${vs.respiratoryRate}/min`);
      if (vitalsParts.length) inputSummary.push(`**Signes vitaux:** ${vitalsParts.join(', ')}`);
    }

    // Lab results
    if (request.input.labResults && Object.keys(request.input.labResults).length) {
      const labParts = Object.entries(request.input.labResults)
        .map(([key, val]) => `${key}: ${val.value} ${val.unit}${val.normalRange ? ` (N: ${val.normalRange})` : ''}`)
        .join('\n- ');
      inputSummary.push(`**Résultats biologiques:**\n- ${labParts}`);
    }

    // Imaging
    if (request.input.imagingFindings?.length) {
      inputSummary.push(`**Résultats d'imagerie:**\n- ${request.input.imagingFindings.join('\n- ')}`);
    }

    // Medical history
    if (request.input.medicalHistory?.length) {
      inputSummary.push(`**Antécédents:** ${request.input.medicalHistory.join(', ')}`);
    }

    // Current medications
    if (request.input.currentMedications?.length) {
      inputSummary.push(`**Traitements en cours:** ${request.input.currentMedications.join(', ')}`);
    }

    // Allergies
    if (request.input.allergies?.length) {
      inputSummary.push(`**Allergies:** ${request.input.allergies.join(', ')}`);
    }

    const userPrompt = `Analyse les données cliniques suivantes et génère des suggestions diagnostiques:

${inputSummary.join('\n\n')}

Réponds en JSON avec la structure suivante:
{
  "differentialDiagnoses": [
    {"diagnosis": "nom", "icdCode": "code CIM-10", "confidence": 0.0-1.0, "reasoning": "raisonnement"}
  ],
  "primaryDiagnosis": {"diagnosis": "nom", "icdCode": "code", "confidence": 0.0-1.0},
  "recommendedTests": [
    {"test": "nom", "rationale": "justification", "urgency": "routine|soon|urgent"}
  ],
  "recommendedImaging": [{"imaging": "nom", "rationale": "justification"}],
  "redFlags": ["liste des signes d'alerte"],
  "drugInteractions": [{"drugs": ["méd1", "méd2"], "severity": "majeur|modéré|mineur", "effect": "description"}],
  "urgencyAssessment": "routine|soon|urgent|emergent|critical",
  "urgencyRationale": "justification du niveau d'urgence",
  "clinicalReasoning": "raisonnement clinique global"
}`;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ];

    const aiResponse = await this.ai.run(this.defaultModel, {
      messages,
      max_tokens: 2500,
      temperature: 0.2,
    }) as any;

    const generationTimeMs = Date.now() - startTime;
    const responseText = aiResponse.response || aiResponse.content || '';

    // Parse JSON response
    let result: any = {
      differentialDiagnoses: [],
      recommendedTests: [],
      redFlags: [],
      urgencyAssessment: 'routine',
      urgencyRationale: '',
      clinicalReasoning: responseText,
    };

    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = { ...result, ...JSON.parse(jsonMatch[0]) };
      }
    } catch {
      // Use defaults if parsing fails
    }

    // Save to database
    const suggestionId = crypto.randomUUID();
    const now = new Date();

    await this.drizzleDb.insert(diagnosticSuggestions).values({
      id: suggestionId,
      patientId: request.patientId,
      encounterId: request.encounterId,
      consultationId: request.consultationId,
      companyId,
      module: request.module || 'general',
      symptoms: JSON.stringify(request.input.symptoms),
      labResults: JSON.stringify(request.input.labResults),
      imagingFindings: JSON.stringify(request.input.imagingFindings),
      vitalSigns: JSON.stringify(request.input.vitalSigns),
      medicalHistory: JSON.stringify(request.input.medicalHistory),
      currentMedications: JSON.stringify(request.input.currentMedications),
      differentialDiagnoses: JSON.stringify(result.differentialDiagnoses),
      primaryDiagnosis: JSON.stringify(result.primaryDiagnosis),
      recommendedTests: JSON.stringify(result.recommendedTests),
      recommendedImaging: JSON.stringify(result.recommendedImaging),
      recommendedConsults: JSON.stringify(result.recommendedConsults || []),
      redFlags: JSON.stringify(result.redFlags),
      drugInteractions: JSON.stringify(result.drugInteractions),
      urgencyAssessment: result.urgencyAssessment,
      urgencyRationale: result.urgencyRationale,
      clinicalReasoning: result.clinicalReasoning,
      aiModel: this.defaultModel,
      aiConfidence: 0.75,
      generationTimeMs,
      status: 'pending',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: now,
      updatedAt: now,
    });

    // Track usage
    await this.trackUsage(userId, companyId, 'diagnostic', {
      model: this.defaultModel,
      latencyMs: generationTimeMs,
      entityType: 'diagnostic_suggestion',
      entityId: suggestionId,
    });

    return {
      id: suggestionId,
      differentialDiagnoses: result.differentialDiagnoses,
      primaryDiagnosis: result.primaryDiagnosis,
      recommendedTests: result.recommendedTests,
      recommendedImaging: result.recommendedImaging,
      redFlags: result.redFlags,
      drugInteractions: result.drugInteractions,
      urgencyAssessment: result.urgencyAssessment,
      urgencyRationale: result.urgencyRationale,
      clinicalReasoning: result.clinicalReasoning,
      generationTimeMs,
      aiModel: this.defaultModel,
      confidence: 0.75,
    };
  }

  /**
   * Mark diagnostic suggestion as viewed
   * CLINICAL-AI-007
   */
  async viewDiagnosticSuggestion(
    userId: string,
    companyId: string,
    suggestionId: string
  ): Promise<void> {
    await this.drizzleDb
      .update(diagnosticSuggestions)
      .set({
        status: 'viewed',
        viewedBy: userId,
        viewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(diagnosticSuggestions.id, suggestionId),
          eq(diagnosticSuggestions.companyId, companyId)
        )
      );
  }

  /**
   * Accept or reject diagnostic suggestion with notes
   * CLINICAL-AI-008
   */
  async respondToDiagnosticSuggestion(
    userId: string,
    companyId: string,
    suggestionId: string,
    decision: 'accepted' | 'modified' | 'rejected',
    providerNotes?: string,
    actualDiagnosis?: string
  ): Promise<void> {
    await this.drizzleDb
      .update(diagnosticSuggestions)
      .set({
        status: decision,
        providerNotes,
        providerDecision: decision,
        actualDiagnosis,
        outcomeRecordedAt: actualDiagnosis ? new Date() : null,
        outcomeRecordedBy: actualDiagnosis ? userId : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(diagnosticSuggestions.id, suggestionId),
          eq(diagnosticSuggestions.companyId, companyId)
        )
      );
  }

  // ==========================================================================
  // PROMPT MANAGEMENT
  // ==========================================================================

  /**
   * Get clinical prompts
   * CLINICAL-AI-009
   */
  async getClinicalPrompts(
    companyId: string,
    category?: string,
    module?: Module
  ): Promise<any[]> {
    let query = this.drizzleDb
      .select()
      .from(aiClinicalPrompts)
      .where(
        and(
          eq(aiClinicalPrompts.companyId, companyId),
          eq(aiClinicalPrompts.isActive, true)
        )
      )
      .$dynamic();

    if (category) {
      query = query.where(eq(aiClinicalPrompts.category, category));
    }

    if (module) {
      query = query.where(eq(aiClinicalPrompts.module, module));
    }

    return query.orderBy(desc(aiClinicalPrompts.usageCount)).all();
  }

  /**
   * Create or update clinical prompt
   * CLINICAL-AI-010
   */
  async upsertClinicalPrompt(
    userId: string,
    companyId: string,
    promptData: {
      id?: string;
      name: string;
      code: string;
      description?: string;
      category: string;
      module?: Module;
      systemPrompt: string;
      userPromptTemplate: string;
      outputFormat?: string;
      requiredVariables?: string[];
      optionalVariables?: string[];
      recommendedModel?: string;
      temperature?: number;
      maxTokens?: number;
      language?: string;
    }
  ): Promise<string> {
    const now = new Date();
    const promptId = promptData.id || crypto.randomUUID();

    if (promptData.id) {
      // Update existing
      await this.drizzleDb
        .update(aiClinicalPrompts)
        .set({
          name: promptData.name,
          description: promptData.description,
          category: promptData.category,
          module: promptData.module || 'general',
          systemPrompt: promptData.systemPrompt,
          userPromptTemplate: promptData.userPromptTemplate,
          outputFormat: promptData.outputFormat,
          requiredVariables: JSON.stringify(promptData.requiredVariables || []),
          optionalVariables: JSON.stringify(promptData.optionalVariables || []),
          recommendedModel: promptData.recommendedModel || this.defaultModel,
          temperature: promptData.temperature || 0.3,
          maxTokens: promptData.maxTokens || 2000,
          language: promptData.language || 'fr',
          version: sql`${aiClinicalPrompts.version} + 1`,
          updatedAt: now,
        })
        .where(
          and(
            eq(aiClinicalPrompts.id, promptData.id),
            eq(aiClinicalPrompts.companyId, companyId)
          )
        );
    } else {
      // Create new
      await this.drizzleDb.insert(aiClinicalPrompts).values({
        id: promptId,
        companyId,
        name: promptData.name,
        code: promptData.code,
        description: promptData.description,
        category: promptData.category,
        module: promptData.module || 'general',
        systemPrompt: promptData.systemPrompt,
        userPromptTemplate: promptData.userPromptTemplate,
        outputFormat: promptData.outputFormat,
        requiredVariables: JSON.stringify(promptData.requiredVariables || []),
        optionalVariables: JSON.stringify(promptData.optionalVariables || []),
        recommendedModel: promptData.recommendedModel || this.defaultModel,
        temperature: promptData.temperature || 0.3,
        maxTokens: promptData.maxTokens || 2000,
        language: promptData.language || 'fr',
        version: 1,
        isActive: true,
        usageCount: 0,
        createdBy: userId,
        createdAt: now,
        updatedAt: now,
      });
    }

    return promptId;
  }

  // ==========================================================================
  // USAGE TRACKING
  // ==========================================================================

  /**
   * Get AI usage statistics
   * CLINICAL-AI-011
   */
  async getUsageStats(
    companyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const results = await this.drizzleDb
      .select()
      .from(clinicalAiUsage)
      .where(eq(clinicalAiUsage.companyId, companyId))
      .orderBy(desc(clinicalAiUsage.createdAt))
      .limit(1000)
      .all() as any[];

    // Aggregate by feature
    const byFeature: Record<string, any> = {};
    let totalRequests = 0;
    let totalTokens = 0;
    let totalCost = 0;

    for (const usage of results) {
      totalRequests++;
      totalTokens += usage.totalTokens || 0;
      totalCost += usage.estimatedCost || 0;

      if (!byFeature[usage.feature]) {
        byFeature[usage.feature] = {
          requests: 0,
          tokens: 0,
          cost: 0,
          avgLatencyMs: 0,
          latencies: [],
        };
      }

      byFeature[usage.feature].requests++;
      byFeature[usage.feature].tokens += usage.totalTokens || 0;
      byFeature[usage.feature].cost += usage.estimatedCost || 0;
      if (usage.latencyMs) {
        byFeature[usage.feature].latencies.push(usage.latencyMs);
      }
    }

    // Calculate avg latency
    for (const feature of Object.keys(byFeature)) {
      const latencies = byFeature[feature].latencies;
      byFeature[feature].avgLatencyMs = latencies.length
        ? Math.round(latencies.reduce((a: number, b: number) => a + b, 0) / latencies.length)
        : 0;
      delete byFeature[feature].latencies;
    }

    return {
      totalRequests,
      totalTokens,
      totalCost,
      byFeature,
    };
  }

  // ==========================================================================
  // PRIVATE HELPERS
  // ==========================================================================

  /**
   * Track AI usage
   */
  private async trackUsage(
    userId: string,
    companyId: string,
    feature: string,
    details: {
      model: string;
      inputTokens?: number;
      outputTokens?: number;
      latencyMs?: number;
      entityType?: string;
      entityId?: string;
    }
  ): Promise<void> {
    const totalTokens = (details.inputTokens || 0) + (details.outputTokens || 0);
    // Estimate cost: ~$0.0002 per 1K tokens for Llama 3.1
    const estimatedCost = totalTokens ? (totalTokens / 1000) * 0.0002 : 0;

    await this.drizzleDb.insert(clinicalAiUsage).values({
      id: crypto.randomUUID(),
      companyId,
      userId,
      feature,
      requestId: details.entityId,
      entityType: details.entityType,
      entityId: details.entityId,
      aiModel: details.model,
      aiProvider: 'cloudflare',
      inputTokens: details.inputTokens,
      outputTokens: details.outputTokens,
      totalTokens,
      latencyMs: details.latencyMs,
      estimatedCost,
      status: 'success',
      usageDate: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
    });
  }

  /**
   * Extract clinical entities from text
   */
  private async extractClinicalEntities(text: string): Promise<Record<string, any>> {
    // Simple regex-based extraction for now
    // Could be enhanced with NER model
    const entities: Record<string, any> = {
      medications: [],
      conditions: [],
      procedures: [],
      anatomical: [],
    };

    // Common medication patterns (French)
    const medPatterns = /(?:prendre|prescription de|traitement par|administrer)\s+(\w+(?:\s+\d+\s*(?:mg|ml|g))?)/gi;
    let match;
    while ((match = medPatterns.exec(text)) !== null) {
      entities.medications.push(match[1]);
    }

    return entities;
  }

  /**
   * Extract medical codes from text
   */
  private async extractMedicalCodes(text: string): Promise<Record<string, any>> {
    const codes: Record<string, any> = {
      icd10: [],
      cpt: [],
      snomed: [],
    };

    // ICD-10 pattern
    const icd10Pattern = /[A-Z]\d{2}(?:\.\d{1,2})?/g;
    let match;
    while ((match = icd10Pattern.exec(text)) !== null) {
      codes.icd10.push(match[0]);
    }

    return codes;
  }
}
