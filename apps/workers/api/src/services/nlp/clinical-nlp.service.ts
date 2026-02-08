/**
 * Clinical NLP Service
 * Natural Language Processing pour Notes Cliniques
 * Extraction d'entités, codage automatique, analyse sémantique
 */

// Types
export interface ClinicalDocument {
  id: string;
  patientId: string;
  encounterId?: string;
  documentType: DocumentType;
  title: string;
  content: string;
  author: string;
  authorRole: string;
  createdAt: string;
  status: 'draft' | 'final' | 'amended';
  language: 'fr' | 'en';
  processingStatus?: 'pending' | 'processing' | 'completed' | 'failed';
  nlpResults?: NLPAnalysisResult;
}

export type DocumentType =
  | 'consultation_note'
  | 'discharge_summary'
  | 'progress_note'
  | 'operative_report'
  | 'radiology_report'
  | 'pathology_report'
  | 'emergency_note'
  | 'nursing_note'
  | 'referral_letter'
  | 'clinical_letter';

export interface NLPAnalysisResult {
  documentId: string;
  processedAt: string;
  processingTime: number;
  entities: ExtractedEntity[];
  sections: DocumentSection[];
  suggestedCodes: SuggestedCode[];
  sentiment?: SentimentAnalysis;
  summary?: DocumentSummary;
  qualityMetrics: QualityMetrics;
  relationships: EntityRelationship[];
  temporalEvents: TemporalEvent[];
  negations: NegationContext[];
  familyHistory?: FamilyHistoryExtraction[];
  socialHistory?: SocialHistoryExtraction;
  medicationReconciliation?: MedicationExtraction[];
  allergyExtraction?: AllergyExtraction[];
}

export interface ExtractedEntity {
  id: string;
  text: string;
  type: EntityType;
  category: string;
  normalizedText?: string;
  code?: string;
  codeSystem?: string;
  confidence: number;
  startOffset: number;
  endOffset: number;
  attributes: Record<string, unknown>;
  negated: boolean;
  hypothetical: boolean;
  familyRelated: boolean;
  historical: boolean;
}

export type EntityType =
  | 'condition'
  | 'medication'
  | 'procedure'
  | 'lab_test'
  | 'lab_value'
  | 'vital_sign'
  | 'anatomy'
  | 'symptom'
  | 'finding'
  | 'device'
  | 'allergy'
  | 'family_member'
  | 'time_expression'
  | 'dosage'
  | 'frequency'
  | 'route'
  | 'severity'
  | 'laterality';

export interface DocumentSection {
  name: string;
  type: SectionType;
  startOffset: number;
  endOffset: number;
  content: string;
  entities: string[];
}

export type SectionType =
  | 'chief_complaint'
  | 'history_present_illness'
  | 'past_medical_history'
  | 'medications'
  | 'allergies'
  | 'family_history'
  | 'social_history'
  | 'review_of_systems'
  | 'physical_exam'
  | 'assessment'
  | 'plan'
  | 'operative_findings'
  | 'complications'
  | 'discharge_instructions';

export interface SuggestedCode {
  code: string;
  codeSystem: 'ICD-10' | 'CPT' | 'SNOMED' | 'LOINC' | 'RxNorm';
  description: string;
  confidence: number;
  entityIds: string[];
  type: 'diagnosis' | 'procedure' | 'medication' | 'lab';
  isPrimary?: boolean;
  specificity: 'specific' | 'general' | 'unspecified';
  alternatives?: { code: string; description: string; reason: string }[];
}

export interface SentimentAnalysis {
  overall: 'positive' | 'neutral' | 'negative' | 'mixed';
  clinicalTone: 'urgent' | 'routine' | 'concerning' | 'stable' | 'improving' | 'deteriorating';
  patientStatus: 'critical' | 'serious' | 'fair' | 'good' | 'stable';
  urgencyLevel: number;
  sections: { section: string; sentiment: string }[];
}

export interface DocumentSummary {
  briefSummary: string;
  keyFindings: string[];
  diagnoses: string[];
  treatmentPlan: string[];
  followUp: string[];
  criticalInformation: string[];
  wordCount: number;
  comprehensiveness: number;
}

export interface QualityMetrics {
  completeness: number;
  clarity: number;
  specificity: number;
  consistency: number;
  overallScore: number;
  missingElements: string[];
  suggestions: string[];
  complianceFlags: { standard: string; compliant: boolean; issue?: string }[];
}

export interface EntityRelationship {
  id: string;
  type: 'treats' | 'causes' | 'indicates' | 'contraindicates' | 'modifies' | 'location' | 'temporal';
  sourceEntityId: string;
  targetEntityId: string;
  confidence: number;
  context: string;
}

export interface TemporalEvent {
  entityId: string;
  eventType: 'onset' | 'duration' | 'frequency' | 'end' | 'scheduled';
  timeExpression: string;
  normalizedDate?: string;
  relative: boolean;
  anchor?: string;
}

export interface NegationContext {
  entityId: string;
  negationType: 'negated' | 'possible' | 'conditional' | 'hypothetical' | 'family' | 'historical';
  cueWords: string[];
  scope: { start: number; end: number };
}

export interface FamilyHistoryExtraction {
  condition: string;
  code?: string;
  relative: string;
  relationship: string;
  sideOfFamily?: 'maternal' | 'paternal';
  ageAtOnset?: number;
  alive?: boolean;
}

export interface SocialHistoryExtraction {
  smoking?: { status: string; packYears?: number; quitDate?: string };
  alcohol?: { status: string; frequency?: string; quantity?: string };
  drugs?: { status: string; substances?: string[] };
  occupation?: string;
  livingSituation?: string;
  exercise?: { frequency?: string; type?: string };
  diet?: string;
  sexualHistory?: { active: boolean };
}

export interface MedicationExtraction {
  medication: string;
  rxNorm?: string;
  dosage?: string;
  frequency?: string;
  route?: string;
  status: 'active' | 'discontinued' | 'on_hold' | 'prn';
  startDate?: string;
  endDate?: string;
  indication?: string;
  prescriber?: string;
}

export interface AllergyExtraction {
  allergen: string;
  type: 'drug' | 'food' | 'environmental' | 'other';
  reaction?: string;
  severity?: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  verified: boolean;
  onsetDate?: string;
}

export interface NLPTemplate {
  id: string;
  name: string;
  documentType: DocumentType;
  sections: { name: string; type: SectionType; required: boolean; prompt?: string }[];
  requiredEntities: EntityType[];
  codingRequirements: { codeSystem: string; minCodes: number }[];
}

// Sample medical terms dictionary
const medicalTerms = {
  conditions: [
    { term: 'hypertension', code: 'I10', system: 'ICD-10', synonyms: ['HTA', 'hypertension artérielle', 'tension élevée'] },
    { term: 'diabète de type 2', code: 'E11', system: 'ICD-10', synonyms: ['diabète type 2', 'DNID', 'diabète non insulino-dépendant'] },
    { term: 'insuffisance cardiaque', code: 'I50', system: 'ICD-10', synonyms: ['IC', 'défaillance cardiaque'] },
    { term: 'insuffisance rénale chronique', code: 'N18', system: 'ICD-10', synonyms: ['IRC', 'néphropathie chronique'] },
    { term: 'fibrillation auriculaire', code: 'I48', system: 'ICD-10', synonyms: ['FA', 'ACFA', 'arythmie complète'] }
  ],
  medications: [
    { term: 'metformine', code: '6809', system: 'RxNorm', class: 'antidiabétique' },
    { term: 'lisinopril', code: '29046', system: 'RxNorm', class: 'IEC' },
    { term: 'atorvastatine', code: '83367', system: 'RxNorm', class: 'statine' },
    { term: 'amlodipine', code: '17767', system: 'RxNorm', class: 'inhibiteur calcique' }
  ],
  symptoms: [
    { term: 'dyspnée', synonyms: ['essoufflement', 'difficulté respiratoire', 'gêne respiratoire'] },
    { term: 'douleur thoracique', synonyms: ['douleur poitrine', 'douleur précordiale'] },
    { term: 'céphalées', synonyms: ['maux de tête', 'migraine', 'douleur crânienne'] },
    { term: 'asthénie', synonyms: ['fatigue', 'épuisement', 'faiblesse'] }
  ]
};

// Section patterns for French clinical notes
const sectionPatterns: { pattern: RegExp; type: SectionType }[] = [
  { pattern: /motif\s*(de\s*)?(consultation|hospitalisation|venue)/i, type: 'chief_complaint' },
  { pattern: /histoire\s*de\s*la\s*maladie|anamnèse/i, type: 'history_present_illness' },
  { pattern: /antécédents?\s*(médicaux|personnels)?/i, type: 'past_medical_history' },
  { pattern: /traitement\s*(actuel|en\s*cours|habituel)|médicaments?/i, type: 'medications' },
  { pattern: /allergies?/i, type: 'allergies' },
  { pattern: /antécédents?\s*familiaux/i, type: 'family_history' },
  { pattern: /mode\s*de\s*vie|habitudes?/i, type: 'social_history' },
  { pattern: /examen\s*(clinique|physique)/i, type: 'physical_exam' },
  { pattern: /conclusion|diagnostic|synthèse/i, type: 'assessment' },
  { pattern: /conduite\s*à\s*tenir|prise\s*en\s*charge|plan/i, type: 'plan' }
];

// Negation cues in French
const negationCues = [
  'pas de', 'sans', 'absence de', 'aucun', 'aucune', 'nie', 'négatif',
  'non', 'n\'a pas', 'ne présente pas', 'exclut', 'écarte'
];

const documents: ClinicalDocument[] = [];

export class ClinicalNLPService {

  // Analyze clinical document
  async analyzeDocument(documentId: string): Promise<NLPAnalysisResult> {
    const document = documents.find(d => d.id === documentId);
    if (!document) throw new Error('Document not found');

    const startTime = Date.now();

    document.processingStatus = 'processing';

    try {
      // Extract sections
      const sections = this.extractSections(document.content);

      // Extract entities
      const entities = this.extractEntities(document.content, document.language);

      // Detect negations
      const negations = this.detectNegations(document.content, entities);

      // Apply negation context
      for (const neg of negations) {
        const entity = entities.find(e => e.id === neg.entityId);
        if (entity) {
          entity.negated = neg.negationType === 'negated';
          entity.hypothetical = neg.negationType === 'hypothetical' || neg.negationType === 'possible';
          entity.familyRelated = neg.negationType === 'family';
          entity.historical = neg.negationType === 'historical';
        }
      }

      // Find relationships between entities
      const relationships = this.findRelationships(entities, document.content);

      // Extract temporal information
      const temporalEvents = this.extractTemporalEvents(entities, document.content);

      // Suggest codes
      const suggestedCodes = this.suggestCodes(entities);

      // Extract specific information
      const familyHistory = this.extractFamilyHistory(document.content, entities);
      const socialHistory = this.extractSocialHistory(document.content);
      const medicationReconciliation = this.extractMedications(entities);
      const allergyExtraction = this.extractAllergies(entities);

      // Analyze sentiment
      const sentiment = this.analyzeSentiment(document.content, sections);

      // Generate summary
      const summary = this.generateSummary(document, entities, sections);

      // Calculate quality metrics
      const qualityMetrics = this.calculateQuality(document, sections, entities);

      const result: NLPAnalysisResult = {
        documentId,
        processedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        entities,
        sections,
        suggestedCodes,
        sentiment,
        summary,
        qualityMetrics,
        relationships,
        temporalEvents,
        negations,
        familyHistory,
        socialHistory,
        medicationReconciliation,
        allergyExtraction
      };

      document.nlpResults = result;
      document.processingStatus = 'completed';

      return result;
    } catch (error) {
      document.processingStatus = 'failed';
      throw error;
    }
  }

  // Create and analyze document
  async processDocument(data: {
    patientId: string;
    encounterId?: string;
    documentType: DocumentType;
    title: string;
    content: string;
    author: string;
    authorRole: string;
    language?: 'fr' | 'en';
  }): Promise<{ document: ClinicalDocument; analysis: NLPAnalysisResult }> {
    const document: ClinicalDocument = {
      id: `doc-${Date.now()}`,
      patientId: data.patientId,
      encounterId: data.encounterId,
      documentType: data.documentType,
      title: data.title,
      content: data.content,
      author: data.author,
      authorRole: data.authorRole,
      createdAt: new Date().toISOString(),
      status: 'final',
      language: data.language || 'fr',
      processingStatus: 'pending'
    };

    documents.push(document);

    const analysis = await this.analyzeDocument(document.id);

    return { document, analysis };
  }

  // Extract sections from document
  private extractSections(content: string): DocumentSection[] {
    const sections: DocumentSection[] = [];
    const lines = content.split('\n');
    let currentSection: DocumentSection | null = null;
    let currentOffset = 0;

    for (const line of lines) {
      let matched = false;

      for (const { pattern, type } of sectionPatterns) {
        if (pattern.test(line)) {
          // Close previous section
          if (currentSection) {
            currentSection.endOffset = currentOffset - 1;
            sections.push(currentSection);
          }

          // Start new section
          currentSection = {
            name: line.trim().replace(/:$/, ''),
            type,
            startOffset: currentOffset,
            endOffset: 0,
            content: '',
            entities: []
          };
          matched = true;
          break;
        }
      }

      if (!matched && currentSection) {
        currentSection.content += line + '\n';
      }

      currentOffset += line.length + 1;
    }

    // Close last section
    if (currentSection) {
      currentSection.endOffset = content.length;
      sections.push(currentSection);
    }

    return sections;
  }

  // Extract entities
  private extractEntities(content: string, language: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const lowerContent = content.toLowerCase();

    // Extract conditions
    for (const condition of medicalTerms.conditions) {
      const allTerms = [condition.term, ...condition.synonyms];
      for (const term of allTerms) {
        let index = lowerContent.indexOf(term.toLowerCase());
        while (index !== -1) {
          entities.push({
            id: `ent-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            text: content.substring(index, index + term.length),
            type: 'condition',
            category: 'diagnosis',
            normalizedText: condition.term,
            code: condition.code,
            codeSystem: condition.system,
            confidence: 0.9,
            startOffset: index,
            endOffset: index + term.length,
            attributes: {},
            negated: false,
            hypothetical: false,
            familyRelated: false,
            historical: false
          });
          index = lowerContent.indexOf(term.toLowerCase(), index + 1);
        }
      }
    }

    // Extract medications
    for (const med of medicalTerms.medications) {
      let index = lowerContent.indexOf(med.term.toLowerCase());
      while (index !== -1) {
        entities.push({
          id: `ent-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          text: content.substring(index, index + med.term.length),
          type: 'medication',
          category: med.class,
          normalizedText: med.term,
          code: med.code,
          codeSystem: med.system,
          confidence: 0.95,
          startOffset: index,
          endOffset: index + med.term.length,
          attributes: {},
          negated: false,
          hypothetical: false,
          familyRelated: false,
          historical: false
        });
        index = lowerContent.indexOf(med.term.toLowerCase(), index + 1);
      }
    }

    // Extract symptoms
    for (const symptom of medicalTerms.symptoms) {
      const allTerms = [symptom.term, ...symptom.synonyms];
      for (const term of allTerms) {
        let index = lowerContent.indexOf(term.toLowerCase());
        while (index !== -1) {
          entities.push({
            id: `ent-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            text: content.substring(index, index + term.length),
            type: 'symptom',
            category: 'symptom',
            normalizedText: symptom.term,
            confidence: 0.85,
            startOffset: index,
            endOffset: index + term.length,
            attributes: {},
            negated: false,
            hypothetical: false,
            familyRelated: false,
            historical: false
          });
          index = lowerContent.indexOf(term.toLowerCase(), index + 1);
        }
      }
    }

    // Extract vital signs patterns
    const vitalPatterns = [
      { pattern: /PA\s*[:=]?\s*(\d+)\/(\d+)/g, type: 'vital_sign', name: 'blood_pressure' },
      { pattern: /FC\s*[:=]?\s*(\d+)/g, type: 'vital_sign', name: 'heart_rate' },
      { pattern: /T°?\s*[:=]?\s*(\d+[.,]\d+)/g, type: 'vital_sign', name: 'temperature' },
      { pattern: /SpO2\s*[:=]?\s*(\d+)/g, type: 'vital_sign', name: 'oxygen_saturation' }
    ];

    for (const { pattern, name } of vitalPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        entities.push({
          id: `ent-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          text: match[0],
          type: 'vital_sign',
          category: name,
          normalizedText: name,
          confidence: 0.95,
          startOffset: match.index,
          endOffset: match.index + match[0].length,
          attributes: { value: match[1] },
          negated: false,
          hypothetical: false,
          familyRelated: false,
          historical: false
        });
      }
    }

    return entities;
  }

  // Detect negations
  private detectNegations(content: string, entities: ExtractedEntity[]): NegationContext[] {
    const negations: NegationContext[] = [];
    const lowerContent = content.toLowerCase();

    for (const entity of entities) {
      // Check for negation cues before the entity
      const contextStart = Math.max(0, entity.startOffset - 50);
      const contextBefore = lowerContent.substring(contextStart, entity.startOffset);

      for (const cue of negationCues) {
        if (contextBefore.includes(cue)) {
          negations.push({
            entityId: entity.id,
            negationType: 'negated',
            cueWords: [cue],
            scope: { start: contextStart, end: entity.endOffset }
          });
          break;
        }
      }

      // Check for family context
      if (contextBefore.includes('famille') || contextBefore.includes('mère') ||
          contextBefore.includes('père') || contextBefore.includes('frère') ||
          contextBefore.includes('soeur')) {
        negations.push({
          entityId: entity.id,
          negationType: 'family',
          cueWords: ['famille'],
          scope: { start: contextStart, end: entity.endOffset }
        });
      }
    }

    return negations;
  }

  // Find relationships
  private findRelationships(entities: ExtractedEntity[], content: string): EntityRelationship[] {
    const relationships: EntityRelationship[] = [];

    const medications = entities.filter(e => e.type === 'medication');
    const conditions = entities.filter(e => e.type === 'condition');

    // Find medication-condition relationships
    for (const med of medications) {
      for (const cond of conditions) {
        if (Math.abs(med.startOffset - cond.startOffset) < 100) {
          const contextBetween = content.substring(
            Math.min(med.startOffset, cond.startOffset),
            Math.max(med.endOffset, cond.endOffset)
          );

          if (contextBetween.includes('pour') || contextBetween.includes('traitement')) {
            relationships.push({
              id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              type: 'treats',
              sourceEntityId: med.id,
              targetEntityId: cond.id,
              confidence: 0.8,
              context: contextBetween
            });
          }
        }
      }
    }

    return relationships;
  }

  // Extract temporal events
  private extractTemporalEvents(entities: ExtractedEntity[], content: string): TemporalEvent[] {
    const events: TemporalEvent[] = [];
    const lowerContent = content.toLowerCase();

    const timePatterns = [
      { pattern: /depuis\s+(\d+)\s+(jours?|semaines?|mois|ans?)/gi, type: 'duration' },
      { pattern: /il\s+y\s+a\s+(\d+)\s+(jours?|semaines?|mois|ans?)/gi, type: 'onset' },
      { pattern: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, type: 'onset' }
    ];

    for (const entity of entities) {
      const contextStart = Math.max(0, entity.startOffset - 30);
      const contextEnd = Math.min(content.length, entity.endOffset + 30);
      const context = content.substring(contextStart, contextEnd);

      for (const { pattern, type } of timePatterns) {
        const match = pattern.exec(context);
        if (match) {
          events.push({
            entityId: entity.id,
            eventType: type as TemporalEvent['eventType'],
            timeExpression: match[0],
            relative: type === 'duration'
          });
        }
      }
    }

    return events;
  }

  // Suggest codes
  private suggestCodes(entities: ExtractedEntity[]): SuggestedCode[] {
    const codes: SuggestedCode[] = [];

    for (const entity of entities) {
      if (entity.code && !entity.negated && !entity.hypothetical && !entity.familyRelated) {
        codes.push({
          code: entity.code,
          codeSystem: entity.codeSystem as SuggestedCode['codeSystem'],
          description: entity.normalizedText || entity.text,
          confidence: entity.confidence,
          entityIds: [entity.id],
          type: entity.type === 'medication' ? 'medication' :
                entity.type === 'condition' ? 'diagnosis' : 'procedure',
          specificity: 'specific'
        });
      }
    }

    // Sort by confidence and deduplicate
    return codes
      .sort((a, b) => b.confidence - a.confidence)
      .filter((code, index, self) =>
        index === self.findIndex(c => c.code === code.code)
      );
  }

  // Extract family history
  private extractFamilyHistory(content: string, entities: ExtractedEntity[]): FamilyHistoryExtraction[] {
    return entities
      .filter(e => e.familyRelated && e.type === 'condition')
      .map(e => ({
        condition: e.normalizedText || e.text,
        code: e.code,
        relative: 'Non spécifié',
        relationship: 'family'
      }));
  }

  // Extract social history
  private extractSocialHistory(content: string): SocialHistoryExtraction {
    const lowerContent = content.toLowerCase();
    const result: SocialHistoryExtraction = {};

    // Smoking
    if (lowerContent.includes('tabac') || lowerContent.includes('fumeur') || lowerContent.includes('cigarette')) {
      if (lowerContent.includes('ancien') || lowerContent.includes('sevré') || lowerContent.includes('arrêt')) {
        result.smoking = { status: 'former' };
      } else if (lowerContent.includes('non') || lowerContent.includes('jamais')) {
        result.smoking = { status: 'never' };
      } else {
        result.smoking = { status: 'current' };
      }
    }

    // Alcohol
    if (lowerContent.includes('alcool') || lowerContent.includes('éthyl')) {
      if (lowerContent.includes('occasionnel')) {
        result.alcohol = { status: 'occasional' };
      } else if (lowerContent.includes('sevré') || lowerContent.includes('abstinent')) {
        result.alcohol = { status: 'former' };
      } else {
        result.alcohol = { status: 'unknown' };
      }
    }

    return result;
  }

  // Extract medications
  private extractMedications(entities: ExtractedEntity[]): MedicationExtraction[] {
    return entities
      .filter(e => e.type === 'medication' && !e.negated)
      .map(e => ({
        medication: e.normalizedText || e.text,
        rxNorm: e.code,
        status: 'active' as const
      }));
  }

  // Extract allergies
  private extractAllergies(entities: ExtractedEntity[]): AllergyExtraction[] {
    return entities
      .filter(e => e.type === 'allergy' && !e.negated)
      .map(e => ({
        allergen: e.text,
        type: 'drug' as const,
        verified: false
      }));
  }

  // Analyze sentiment
  private analyzeSentiment(content: string, sections: DocumentSection[]): SentimentAnalysis {
    const lowerContent = content.toLowerCase();

    let urgencyLevel = 3;
    let clinicalTone: SentimentAnalysis['clinicalTone'] = 'routine';
    let patientStatus: SentimentAnalysis['patientStatus'] = 'stable';

    // Check for urgent indicators
    const urgentWords = ['urgent', 'critique', 'grave', 'sévère', 'immédiat', 'aigü'];
    const positiveWords = ['amélioration', 'stable', 'favorable', 'bon', 'satisfaisant'];
    const negativeWords = ['détérioration', 'aggravation', 'inquiétant', 'préoccupant'];

    if (urgentWords.some(w => lowerContent.includes(w))) {
      urgencyLevel = 8;
      clinicalTone = 'urgent';
      patientStatus = 'serious';
    } else if (negativeWords.some(w => lowerContent.includes(w))) {
      urgencyLevel = 6;
      clinicalTone = 'concerning';
      patientStatus = 'fair';
    } else if (positiveWords.some(w => lowerContent.includes(w))) {
      urgencyLevel = 2;
      clinicalTone = 'stable';
      patientStatus = 'good';
    }

    return {
      overall: urgencyLevel > 5 ? 'negative' : urgencyLevel < 4 ? 'positive' : 'neutral',
      clinicalTone,
      patientStatus,
      urgencyLevel,
      sections: sections.map(s => ({
        section: s.name,
        sentiment: 'neutral'
      }))
    };
  }

  // Generate summary
  private generateSummary(
    document: ClinicalDocument,
    entities: ExtractedEntity[],
    sections: DocumentSection[]
  ): DocumentSummary {
    const diagnoses = entities
      .filter(e => e.type === 'condition' && !e.negated)
      .map(e => e.normalizedText || e.text);

    const medications = entities
      .filter(e => e.type === 'medication' && !e.negated)
      .map(e => e.text);

    const planSection = sections.find(s => s.type === 'plan');
    const chiefComplaintSection = sections.find(s => s.type === 'chief_complaint');

    return {
      briefSummary: chiefComplaintSection?.content.substring(0, 200) || 'Voir document complet',
      keyFindings: entities.slice(0, 5).map(e => e.text),
      diagnoses: [...new Set(diagnoses)],
      treatmentPlan: medications.map(m => `Poursuivre ${m}`),
      followUp: planSection ? ['Voir plan de suivi'] : [],
      criticalInformation: entities
        .filter(e => e.confidence > 0.9)
        .slice(0, 3)
        .map(e => e.text),
      wordCount: document.content.split(/\s+/).length,
      comprehensiveness: Math.min(100, sections.length * 15)
    };
  }

  // Calculate quality metrics
  private calculateQuality(
    document: ClinicalDocument,
    sections: DocumentSection[],
    entities: ExtractedEntity[]
  ): QualityMetrics {
    const missingElements: string[] = [];
    const suggestions: string[] = [];

    // Check for required sections
    const requiredSections: SectionType[] = ['chief_complaint', 'assessment', 'plan'];
    for (const required of requiredSections) {
      if (!sections.some(s => s.type === required)) {
        missingElements.push(`Section manquante: ${required}`);
      }
    }

    // Calculate scores
    const completeness = Math.min(100, (sections.length / 8) * 100);
    const specificity = entities.filter(e => e.code).length / Math.max(1, entities.length) * 100;
    const clarity = 100 - (missingElements.length * 10);

    if (completeness < 80) {
      suggestions.push('Ajouter plus de sections pour améliorer la complétude');
    }

    if (specificity < 70) {
      suggestions.push('Utiliser des termes médicaux plus spécifiques');
    }

    return {
      completeness,
      clarity: Math.max(0, clarity),
      specificity,
      consistency: 85,
      overallScore: (completeness + clarity + specificity + 85) / 4,
      missingElements,
      suggestions,
      complianceFlags: [
        { standard: 'HIPAA', compliant: true },
        { standard: 'Structure note', compliant: sections.length >= 3 }
      ]
    };
  }

  // Get document by ID
  getDocument(documentId: string): ClinicalDocument | undefined {
    return documents.find(d => d.id === documentId);
  }

  // Get patient documents
  getPatientDocuments(patientId: string): ClinicalDocument[] {
    return documents
      .filter(d => d.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
