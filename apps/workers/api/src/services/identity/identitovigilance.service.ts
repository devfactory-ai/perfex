/**
 * Identitovigilance Service
 * Patient identity management and verification system
 * Compliant with French INS (Identifiant National de Santé) requirements
 */

import { D1Database } from '@cloudflare/workers-types';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PatientIdentity {
  id: string;
  localId: string; // Internal patient ID (IPP - Identifiant Permanent du Patient)
  ins: INSIdentity | null;
  traits: PatientTraits;
  identityStatus: IdentityStatus;
  qualityScore: number; // 0-100
  verificationHistory: IdentityVerification[];
  aliases: PatientAlias[];
  mergedFrom: string[]; // IDs of merged patient records
  mergedInto?: string; // If this patient was merged into another
  createdAt: Date;
  updatedAt: Date;
}

export interface INSIdentity {
  matriculeINS: string; // 22 characters: NIR/NIA + key
  oid: string; // Object Identifier
  typeINS: 'nir' | 'nia' | 'temporaire';
  dateRecuperation: Date;
  sourceRecuperation: 'teleservice' | 'carte_vitale' | 'import' | 'manuel';
  statut: 'qualifie' | 'provisoire' | 'invalide';
  dateValidation?: Date;
  validePar?: string;
}

export interface PatientTraits {
  // Strict traits (INS compliant)
  nomNaissance: string;
  prenomNaissance: string; // First given name at birth
  dateNaissance: Date;
  sexe: 'M' | 'F' | 'I'; // Male, Female, Indeterminate
  lieuNaissance?: LieuNaissance;

  // Extended traits (for local identification)
  nomUsage?: string;
  prenomsActe?: string[]; // All given names from birth certificate
  prenomUsuel?: string;
  paysNaissance?: string;
}

export interface LieuNaissance {
  code: string; // INSEE code (5 digits for France, 5 digits for foreign countries)
  libelle: string;
  pays: string;
}

export type IdentityStatus =
  | 'provisoire' // Temporary - not verified
  | 'validee' // Validated - verified against source document
  | 'qualifiee' // Qualified - verified via INS teleservice
  | 'douteuse' // Doubtful - potential issues identified
  | 'fictive' // Fictitious - for testing only
  | 'anonyme'; // Anonymous - emergency/unknown patient

export interface IdentityVerification {
  id: string;
  patientId: string;
  verificationType: VerificationType;
  verificationDate: Date;
  verifiedBy: string;
  documentType?: DocumentType;
  documentNumber?: string;
  documentExpiryDate?: Date;
  documentIssuer?: string;
  result: 'success' | 'partial' | 'failure';
  discrepancies?: TraitDiscrepancy[];
  notes?: string;
  previousStatus: IdentityStatus;
  newStatus: IdentityStatus;
}

export type VerificationType =
  | 'document' // Identity document verification
  | 'carte_vitale' // Carte Vitale reading
  | 'teleservice_ins' // INS teleservice call
  | 'patient_confirmation' // Patient verbal confirmation
  | 'family_confirmation' // Family/guardian confirmation
  | 'cross_reference' // Cross-reference with other system
  | 'biometric'; // Biometric verification (photo, etc.)

export type DocumentType =
  | 'cni' // Carte Nationale d'Identité
  | 'passeport'
  | 'titre_sejour'
  | 'permis_conduire'
  | 'carte_vitale'
  | 'livret_famille'
  | 'extrait_naissance'
  | 'autre';

export interface TraitDiscrepancy {
  trait: keyof PatientTraits;
  systemValue: string;
  verifiedValue: string;
  resolution: 'corrected' | 'kept_system' | 'kept_verified' | 'pending';
}

export interface PatientAlias {
  id: string;
  patientId: string;
  type: 'maiden_name' | 'married_name' | 'pseudonym' | 'previous_name' | 'spelling_variant';
  nom: string;
  prenom?: string;
  validFrom?: Date;
  validTo?: Date;
  createdAt: Date;
}

export interface DuplicateCandidate {
  patientId: string;
  matchScore: number; // 0-100
  matchedTraits: string[];
  potentialType: 'exact' | 'probable' | 'possible';
  differences: { trait: string; value1: string; value2: string }[];
}

export interface DuplicateCase {
  id: string;
  primaryPatientId: string;
  secondaryPatientId: string;
  detectionMethod: 'automatic' | 'manual' | 'merge_request';
  detectionDate: Date;
  matchScore: number;
  status: 'pending' | 'investigating' | 'confirmed_duplicate' | 'not_duplicate' | 'merged' | 'dismissed';
  assignedTo?: string;
  resolution?: DuplicateResolution;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DuplicateResolution {
  decision: 'merge' | 'link' | 'no_action';
  survivorId?: string; // Which record survives in a merge
  mergedAt?: Date;
  mergedBy?: string;
  rationale: string;
}

export interface CollisionAlert {
  id: string;
  patientId: string;
  type: CollisionType;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  context: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'false_positive';
  encounterId?: string;
  location?: string;
  createdAt: Date;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolution?: string;
  resolvedAt?: Date;
}

export type CollisionType =
  | 'same_room' // Same patient registered in multiple locations
  | 'same_appointment' // Double booking
  | 'identity_mismatch' // Traits don't match between systems
  | 'wristband_mismatch' // Wristband doesn't match record
  | 'photo_mismatch' // Photo doesn't match patient
  | 'ins_collision'; // INS doesn't match expected traits

export interface IdentityWristband {
  id: string;
  patientId: string;
  encounterId: string;
  barcode: string;
  qrCode?: string;
  printedAt: Date;
  printedBy: string;
  printLocation: string;
  status: 'active' | 'reprinted' | 'deactivated';
  includesPhoto: boolean;
  includesAllergies: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
}

export interface IdentityCheck {
  id: string;
  patientId: string;
  encounterId?: string;
  checkType: 'admission' | 'procedure' | 'medication' | 'lab' | 'imaging' | 'discharge' | 'other';
  checkedBy: string;
  checkDate: Date;
  location: string;
  method: 'wristband_scan' | 'verbal_confirmation' | 'photo_match' | 'document_check' | 'biometric';
  traitsVerified: (keyof PatientTraits)[];
  result: 'confirmed' | 'discrepancy' | 'unable_to_confirm';
  discrepancyDetails?: string;
  action?: string;
}

export interface INSTeleserviceRequest {
  id: string;
  patientId: string;
  requestType: 'verification' | 'recherche' | 'creation';
  requestDate: Date;
  requestedBy: string;
  traits: Partial<PatientTraits>;
  status: 'pending' | 'success' | 'partial_match' | 'no_match' | 'error';
  response?: INSTeleserviceResponse;
  errorCode?: string;
  errorMessage?: string;
}

export interface INSTeleserviceResponse {
  matriculeINS?: string;
  oid?: string;
  traitsRetournes?: PatientTraits;
  qualite?: 'identite_qualifiee' | 'identite_provisoire' | 'non_trouve';
  dateResponse: Date;
}

export interface IdentityAudit {
  id: string;
  facilityId: string;
  auditDate: Date;
  auditorId: string;
  scope: { units?: string[]; patientCount?: number };
  findings: IdentityAuditFinding[];
  summary: IdentityAuditSummary;
  recommendations: string[];
  status: 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface IdentityAuditFinding {
  patientId: string;
  category: 'missing_ins' | 'unvalidated' | 'outdated' | 'incomplete' | 'duplicate' | 'quality';
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendation?: string;
}

export interface IdentityAuditSummary {
  totalPatients: number;
  withINS: number;
  insQualified: number;
  validated: number;
  provisional: number;
  doubtful: number;
  duplicateCandidates: number;
  averageQualityScore: number;
}

export interface IdentityMetrics {
  facilityId: string;
  period: { start: Date; end: Date };
  insQualificationRate: number;
  identityValidationRate: number;
  duplicateRate: number;
  averageQualityScore: number;
  verificationsByType: { type: VerificationType; count: number }[];
  collisionsByType: { type: CollisionType; count: number }[];
  trendsComparedToPrevious: {
    insQualificationRate: number;
    identityValidationRate: number;
  };
}

export interface IdentitovigilancePolicy {
  id: string;
  facilityId: string;
  name: string;
  version: string;
  requiredTraits: (keyof PatientTraits)[];
  mandatoryVerification: VerificationType[];
  verificationFrequency: { [context: string]: number }; // hours
  photoRequired: boolean;
  wristbandRequired: boolean;
  duplicateThreshold: number; // Match score threshold
  qualityScoreMinimum: number;
  insQualificationRequired: boolean;
  effectiveDate: Date;
  approvedBy: string;
  approvedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Identitovigilance Service Class
// ============================================================================

export class IdentitovigilanceService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // ---------------------------------------------------------------------------
  // Patient Identity Management
  // ---------------------------------------------------------------------------

  async createPatientIdentity(data: Omit<PatientIdentity, 'id' | 'verificationHistory' | 'aliases' | 'mergedFrom' | 'createdAt' | 'updatedAt'>): Promise<PatientIdentity> {
    const id = crypto.randomUUID();
    const now = new Date();

    // Calculate initial quality score
    const qualityScore = this.calculateQualityScore(data.traits, data.ins, data.identityStatus);

    return {
      ...data,
      id,
      qualityScore,
      verificationHistory: [],
      aliases: [],
      mergedFrom: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  async getPatientIdentity(patientId: string): Promise<PatientIdentity | null> {
    const result = await this.db.prepare(`
      SELECT pi.*, pt.*, ii.matricule_ins, ii.oid, ii.type_ins, ii.date_recuperation, ii.source_recuperation, ii.statut as ins_statut, ii.date_validation, ii.valide_par
      FROM patient_identities pi
      LEFT JOIN patient_traits pt ON pi.id = pt.patient_identity_id
      LEFT JOIN ins_identities ii ON pi.id = ii.patient_identity_id
      WHERE pi.patient_id = ?
    `).bind(patientId).first<any>();

    if (!result) return null;
    return this.mapPatientIdentityFromDb(result);
  }

  async getPatientByINS(matriculeINS: string): Promise<PatientIdentity | null> {
    const result = await this.db.prepare(`
      SELECT pi.patient_id FROM ins_identities ii
      JOIN patient_identities pi ON ii.patient_identity_id = pi.id
      WHERE ii.matricule_ins = ?
    `).bind(matriculeINS).first<any>();

    if (!result) return null;
    return this.getPatientIdentity(result.patient_id);
  }

  async getPatientByLocalId(localId: string): Promise<PatientIdentity | null> {
    const result = await this.db.prepare(`
      SELECT patient_id FROM patient_identities WHERE local_id = ?
    `).bind(localId).first<any>();

    if (!result) return null;
    return this.getPatientIdentity(result.patient_id);
  }

  async updatePatientIdentity(patientId: string, updates: Partial<PatientIdentity>): Promise<PatientIdentity> {
    const setClauses: string[] = ['updated_at = ?'];
    const values: any[] = [new Date().toISOString()];

    if (updates.identityStatus !== undefined) { setClauses.push('identity_status = ?'); values.push(updates.identityStatus); }
    if (updates.qualityScore !== undefined) { setClauses.push('quality_score = ?'); values.push(updates.qualityScore); }

    values.push(patientId);
    await this.db.prepare(`
      UPDATE patient_identities SET ${setClauses.join(', ')} WHERE patient_id = ?
    `).bind(...values).run();

    const patient = await this.getPatientIdentity(patientId);
    if (!patient) throw new Error('Patient identity not found');
    return patient;
  }

  private mapPatientIdentityFromDb(r: any): PatientIdentity {
    const ins: INSIdentity | null = r.matricule_ins ? {
      matriculeINS: r.matricule_ins,
      oid: r.oid,
      typeINS: r.type_ins,
      dateRecuperation: new Date(r.date_recuperation),
      sourceRecuperation: r.source_recuperation,
      statut: r.ins_statut,
      dateValidation: r.date_validation ? new Date(r.date_validation) : undefined,
      validePar: r.valide_par,
    } : null;

    const traits: PatientTraits = {
      nomNaissance: r.nom_naissance || '',
      prenomNaissance: r.prenom_naissance || '',
      dateNaissance: new Date(r.date_naissance),
      sexe: r.sexe,
      lieuNaissance: r.lieu_naissance_code ? {
        code: r.lieu_naissance_code,
        libelle: r.lieu_naissance_libelle,
        pays: r.lieu_naissance_pays,
      } : undefined,
      nomUsage: r.nom_usage,
      prenomsActe: r.prenoms_acte ? JSON.parse(r.prenoms_acte) : undefined,
      prenomUsuel: r.prenom_usuel,
      paysNaissance: r.pays_naissance,
    };

    return {
      id: r.id,
      localId: r.local_id,
      ins,
      traits,
      identityStatus: r.identity_status,
      qualityScore: r.quality_score,
      verificationHistory: [],
      aliases: [],
      mergedFrom: r.merged_from ? JSON.parse(r.merged_from) : [],
      mergedInto: r.merged_into,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    };
  }

  async updatePatientTraits(patientId: string, traits: Partial<PatientTraits>, verifiedBy: string, documentType?: DocumentType): Promise<PatientIdentity> {
    const patient = await this.getPatientIdentity(patientId);
    if (!patient) throw new Error('Patient not found');

    // Record discrepancies
    const discrepancies: TraitDiscrepancy[] = [];
    for (const [key, value] of Object.entries(traits)) {
      const existingValue = (patient.traits as any)[key];
      if (existingValue && existingValue !== value) {
        discrepancies.push({
          trait: key as keyof PatientTraits,
          systemValue: String(existingValue),
          verifiedValue: String(value),
          resolution: 'corrected',
        });
      }
    }

    // Create verification record
    const verification: IdentityVerification = {
      id: crypto.randomUUID(),
      patientId,
      verificationType: documentType ? 'document' : 'patient_confirmation',
      verificationDate: new Date(),
      verifiedBy,
      documentType,
      result: discrepancies.length > 0 ? 'partial' : 'success',
      discrepancies: discrepancies.length > 0 ? discrepancies : undefined,
      previousStatus: patient.identityStatus,
      newStatus: this.determineNewStatus(patient.identityStatus, 'document'),
    };

    const now = new Date().toISOString();
    await this.db.prepare(`
      UPDATE patient_identities SET identity_status = ?, quality_score = ?, updated_at = ? WHERE patient_id = ?
    `).bind(verification.newStatus, this.calculateQualityScore(patient.traits, patient.ins, verification.newStatus), now, patientId).run();

    // Insert verification record
    const identityRow = await this.db.prepare('SELECT id FROM patient_identities WHERE patient_id = ?').bind(patientId).first<any>();
    if (identityRow) {
      await this.db.prepare(`
        INSERT INTO identity_verifications (id, patient_identity_id, verification_type, verification_date, verified_by, document_type, result, discrepancies, previous_status, new_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(verification.id, identityRow.id, verification.verificationType, verification.verificationDate.toISOString(), verifiedBy, documentType || null, verification.result, verification.discrepancies ? JSON.stringify(verification.discrepancies) : null, verification.previousStatus, verification.newStatus).run();
    }

    const updatedPatient = await this.getPatientIdentity(patientId);
    if (!updatedPatient) throw new Error('Patient not found after update');
    return updatedPatient;
  }

  private determineNewStatus(currentStatus: IdentityStatus, verificationType: VerificationType): IdentityStatus {
    if (verificationType === 'teleservice_ins') {
      return 'qualifiee';
    }
    if (verificationType === 'document' || verificationType === 'carte_vitale') {
      if (currentStatus === 'provisoire' || currentStatus === 'douteuse') {
        return 'validee';
      }
    }
    return currentStatus;
  }

  private calculateQualityScore(traits: PatientTraits, ins: INSIdentity | null, status: IdentityStatus): number {
    let score = 0;

    // Trait completeness (40 points)
    if (traits.nomNaissance) score += 10;
    if (traits.prenomNaissance) score += 10;
    if (traits.dateNaissance) score += 10;
    if (traits.sexe) score += 5;
    if (traits.lieuNaissance) score += 5;

    // INS status (40 points)
    if (ins) {
      score += 20;
      if (ins.statut === 'qualifie') score += 20;
      else if (ins.statut === 'provisoire') score += 10;
    }

    // Identity status (20 points)
    switch (status) {
      case 'qualifiee': score += 20; break;
      case 'validee': score += 15; break;
      case 'provisoire': score += 5; break;
      case 'douteuse': score += 0; break;
    }

    return Math.min(score, 100);
  }

  // ---------------------------------------------------------------------------
  // Identity Verification
  // ---------------------------------------------------------------------------

  async recordVerification(data: Omit<IdentityVerification, 'id'>): Promise<IdentityVerification> {
    const id = crypto.randomUUID();
    const verification = { ...data, id };

    // Update patient status if verification successful
    if (data.result === 'success') {
      await this.updatePatientIdentity(data.patientId, {
        identityStatus: data.newStatus,
      });
    }

    return verification;
  }

  async getVerificationHistory(patientId: string): Promise<IdentityVerification[]> {
    const identity = await this.db.prepare(`SELECT id FROM patient_identities WHERE patient_id = ?`).bind(patientId).first<any>();
    if (!identity) return [];

    const results = await this.db.prepare(`
      SELECT * FROM identity_verifications WHERE patient_identity_id = ? ORDER BY verification_date DESC
    `).bind(identity.id).all<any>();

    return results.results.map((r: any) => ({
      id: r.id,
      patientId,
      verificationType: r.verification_type,
      verificationDate: new Date(r.verification_date),
      verifiedBy: r.verified_by,
      documentType: r.document_type,
      documentNumber: r.document_number,
      documentExpiryDate: r.document_expiry_date ? new Date(r.document_expiry_date) : undefined,
      documentIssuer: r.document_issuer,
      result: r.result,
      discrepancies: r.discrepancies ? JSON.parse(r.discrepancies) : undefined,
      notes: r.notes,
      previousStatus: r.previous_status,
      newStatus: r.new_status,
    }));
  }

  async verifyWithDocument(patientId: string, documentType: DocumentType, documentNumber: string, documentExpiryDate: Date, verifiedBy: string): Promise<IdentityVerification> {
    const patient = await this.getPatientIdentity(patientId);
    if (!patient) throw new Error('Patient not found');

    const verification: IdentityVerification = {
      id: crypto.randomUUID(),
      patientId,
      verificationType: 'document',
      verificationDate: new Date(),
      verifiedBy,
      documentType,
      documentNumber,
      documentExpiryDate,
      result: 'success',
      previousStatus: patient.identityStatus,
      newStatus: patient.identityStatus === 'provisoire' ? 'validee' : patient.identityStatus,
    };

    return this.recordVerification(verification);
  }

  // ---------------------------------------------------------------------------
  // INS Management
  // ---------------------------------------------------------------------------

  async callINSTeleservice(patientId: string, requestType: INSTeleserviceRequest['requestType'], requestedBy: string): Promise<INSTeleserviceRequest> {
    const patient = await this.getPatientIdentity(patientId);
    if (!patient) throw new Error('Patient not found');

    const request: INSTeleserviceRequest = {
      id: crypto.randomUUID(),
      patientId,
      requestType,
      requestDate: new Date(),
      requestedBy,
      traits: patient.traits,
      status: 'pending',
    };

    // Store the request in database
    await this.db.prepare(`
      INSERT INTO ins_teleservice_requests (id, patient_id, request_type, request_date, requested_by, traits, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(request.id, patientId, requestType, request.requestDate.toISOString(), requestedBy, JSON.stringify(request.traits), request.status).run();
    return request;
  }

  async processINSResponse(requestId: string, response: INSTeleserviceResponse): Promise<PatientIdentity> {
    const requestResult = await this.db.prepare('SELECT * FROM ins_teleservice_requests WHERE id = ?').bind(requestId).first<any>();
    if (!requestResult) throw new Error('INS request not found');
    const now = new Date().toISOString();
    const responseStatus = response.qualite === 'identite_qualifiee' ? 'success' : response.qualite === 'non_trouve' ? 'not_found' : 'pending';
    await this.db.prepare('UPDATE ins_teleservice_requests SET status = ?, response_date = ?, response_data = ? WHERE id = ?')
      .bind(responseStatus, now, JSON.stringify(response), requestId).run();
    if (response.qualite === 'identite_qualifiee' && response.matriculeINS) {
      const insIdentity: INSIdentity = {
        matriculeINS: response.matriculeINS,
        oid: response.oid || '',
        typeINS: 'nir',
        dateRecuperation: response.dateResponse,
        sourceRecuperation: 'teleservice',
        statut: 'qualifie',
      };
      return this.qualifyIdentity(requestResult.patient_id, insIdentity);
    }
    const patient = await this.getPatientIdentity(requestResult.patient_id);
    if (!patient) throw new Error('Patient not found');
    return patient;
  }

  async qualifyIdentity(patientId: string, ins: INSIdentity): Promise<PatientIdentity> {
    const patient = await this.getPatientIdentity(patientId);
    if (!patient) throw new Error('Patient not found');

    const updatedPatient = {
      ...patient,
      ins,
      identityStatus: 'qualifiee' as IdentityStatus,
      qualityScore: this.calculateQualityScore(patient.traits, ins, 'qualifiee'),
      updatedAt: new Date(),
    };

    // Record verification
    await this.recordVerification({
      patientId,
      verificationType: 'teleservice_ins',
      verificationDate: new Date(),
      verifiedBy: 'system',
      result: 'success',
      previousStatus: patient.identityStatus,
      newStatus: 'qualifiee',
    });

    return updatedPatient;
  }

  async invalidateINS(patientId: string, reason: string, invalidatedBy: string): Promise<PatientIdentity> {
    const patient = await this.getPatientIdentity(patientId);
    if (!patient) throw new Error('Patient not found');

    const now = new Date().toISOString();
    const newStatus: IdentityStatus = 'provisoire';
    await this.db.prepare(`
      UPDATE patient_identities SET ins = NULL, identity_status = ?, updated_at = ? WHERE patient_id = ?
    `).bind(newStatus, now, patientId).run();

    await this.recordVerification({
      patientId,
      verificationType: 'teleservice_ins',
      verificationDate: new Date(),
      verifiedBy: invalidatedBy,
      result: 'failure',
      discrepancies: [{ trait: 'ins' as keyof PatientTraits, systemValue: 'valid', verifiedValue: 'invalid', resolution: 'corrected' as const }],
      previousStatus: patient.identityStatus,
      newStatus,
    });

    const updatedPatient = await this.getPatientIdentity(patientId);
    if (!updatedPatient) throw new Error('Patient not found after update');
    return updatedPatient;
  }

  // ---------------------------------------------------------------------------
  // Aliases
  // ---------------------------------------------------------------------------

  async addAlias(patientId: string, alias: Omit<PatientAlias, 'id' | 'patientId' | 'createdAt'>): Promise<PatientAlias> {
    const id = crypto.randomUUID();
    return {
      ...alias,
      id,
      patientId,
      createdAt: new Date(),
    };
  }

  async getPatientAliases(patientId: string): Promise<PatientAlias[]> {
    const identity = await this.db.prepare('SELECT id FROM patient_identities WHERE patient_id = ?').bind(patientId).first<any>();
    if (!identity) return [];
    const results = await this.db.prepare('SELECT * FROM patient_aliases WHERE patient_identity_id = ?').bind(identity.id).all<any>();
    return (results.results || []).map((r: any) => ({
      id: r.id,
      patientId,
      type: r.type,
      nom: r.nom_usage || r.nom,
      prenom: r.prenom_usage || r.prenom,
      validFrom: r.date_debut ? new Date(r.date_debut) : undefined,
      validTo: r.date_fin ? new Date(r.date_fin) : undefined,
      createdAt: new Date(r.created_at),
    }));
  }

  async removeAlias(aliasId: string): Promise<void> {
    await this.db.prepare('DELETE FROM patient_aliases WHERE id = ?').bind(aliasId).run();
  }

  // ---------------------------------------------------------------------------
  // Duplicate Detection
  // ---------------------------------------------------------------------------

  async findDuplicateCandidates(patientId: string): Promise<DuplicateCandidate[]> {
    const patient = await this.getPatientIdentity(patientId);
    if (!patient) return [];

    const candidates: DuplicateCandidate[] = [];
    // Search by date of birth and similar names
    const dob = patient.traits.dateNaissance?.toISOString().split('T')[0];
    if (dob) {
      const results = await this.db.prepare(`
        SELECT pi.*, pt.nom_naissance, pt.prenom_naissance, pt.date_naissance, pt.sexe
        FROM patient_identities pi
        LEFT JOIN patient_traits pt ON pi.id = pt.patient_identity_id
        WHERE pt.date_naissance = ? AND pi.patient_id != ?
      `).bind(dob, patientId).all<any>();
      for (const r of results.results || []) {
        const matchScore = this.calculateMatchScore(patient.traits, {
          nomNaissance: r.nom_naissance, prenomNaissance: r.prenom_naissance,
          dateNaissance: new Date(r.date_naissance), sexe: r.sexe,
        } as PatientTraits);
        if (matchScore >= 60) {
          candidates.push({
            patientId: r.patient_id,
            matchScore,
            matchedTraits: ['dateNaissance', 'nom'],
            potentialType: matchScore >= 90 ? 'exact' : matchScore >= 75 ? 'probable' : 'possible',
            differences: [],
          });
        }
      }
    }
    return candidates;
  }

  async searchPotentialDuplicates(traits: Partial<PatientTraits>): Promise<DuplicateCandidate[]> {
    const candidates: DuplicateCandidate[] = [];
    let query = 'SELECT pi.*, pt.nom_naissance, pt.prenom_naissance, pt.date_naissance, pt.sexe FROM patient_identities pi LEFT JOIN patient_traits pt ON pi.id = pt.patient_identity_id WHERE 1=1';
    const params: any[] = [];
    if (traits.dateNaissance) { query += ' AND pt.date_naissance = ?'; params.push(traits.dateNaissance.toISOString().split('T')[0]); }
    if (traits.nomNaissance) { query += ' AND UPPER(pt.nom_naissance) = ?'; params.push(traits.nomNaissance.toUpperCase()); }
    query += ' LIMIT 50';
    const stmt = params.length > 0 ? this.db.prepare(query).bind(...params) : this.db.prepare(query);
    const results = await stmt.all<any>();
    for (const r of results.results || []) {
      const matchScore = this.calculateMatchScore(traits as PatientTraits, {
        nomNaissance: r.nom_naissance, prenomNaissance: r.prenom_naissance,
        dateNaissance: new Date(r.date_naissance), sexe: r.sexe,
      } as PatientTraits);
      candidates.push({
        patientId: r.patient_id,
        matchScore,
        matchedTraits: Object.keys(traits),
        potentialType: matchScore >= 90 ? 'exact' : matchScore >= 75 ? 'probable' : 'possible',
        differences: [],
      });
    }
    return candidates.sort((a, b) => b.matchScore - a.matchScore);
  }

  async createDuplicateCase(primaryPatientId: string, secondaryPatientId: string, detectionMethod: DuplicateCase['detectionMethod']): Promise<DuplicateCase> {
    const id = crypto.randomUUID();
    const now = new Date();

    // Calculate match score
    const primary = await this.getPatientIdentity(primaryPatientId);
    const secondary = await this.getPatientIdentity(secondaryPatientId);
    const matchScore = primary && secondary ? this.calculateMatchScore(primary.traits, secondary.traits) : 0;

    return {
      id,
      primaryPatientId,
      secondaryPatientId,
      detectionMethod,
      detectionDate: now,
      matchScore,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
  }

  private calculateMatchScore(traits1: PatientTraits, traits2: PatientTraits): number {
    let score = 0;
    let maxScore = 0;

    // Name matching (30 points)
    maxScore += 30;
    if (this.normalizeString(traits1.nomNaissance) === this.normalizeString(traits2.nomNaissance)) {
      score += 15;
    } else if (this.calculateLevenshteinSimilarity(traits1.nomNaissance, traits2.nomNaissance) > 0.8) {
      score += 10;
    }
    if (this.normalizeString(traits1.prenomNaissance) === this.normalizeString(traits2.prenomNaissance)) {
      score += 15;
    } else if (this.calculateLevenshteinSimilarity(traits1.prenomNaissance, traits2.prenomNaissance) > 0.8) {
      score += 10;
    }

    // Date of birth (40 points - exact match required)
    maxScore += 40;
    if (traits1.dateNaissance && traits2.dateNaissance &&
        traits1.dateNaissance.getTime() === traits2.dateNaissance.getTime()) {
      score += 40;
    }

    // Sex (10 points)
    maxScore += 10;
    if (traits1.sexe === traits2.sexe) {
      score += 10;
    }

    // Place of birth (20 points)
    maxScore += 20;
    if (traits1.lieuNaissance && traits2.lieuNaissance) {
      if (traits1.lieuNaissance.code === traits2.lieuNaissance.code) {
        score += 20;
      }
    }

    return Math.round((score / maxScore) * 100);
  }

  private normalizeString(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();
  }

  private calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const s1 = this.normalizeString(str1);
    const s2 = this.normalizeString(str2);

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Simplified Levenshtein distance
    const maxLen = Math.max(s1.length, s2.length);
    let distance = 0;
    for (let i = 0; i < maxLen; i++) {
      if (s1[i] !== s2[i]) distance++;
    }

    return 1 - (distance / maxLen);
  }

  async getDuplicateCase(caseId: string): Promise<DuplicateCase | null> {
    const result = await this.db.prepare(`SELECT * FROM duplicate_cases WHERE id = ?`).bind(caseId).first<any>();
    if (!result) return null;
    return this.mapDuplicateCaseFromDb(result);
  }

  async listDuplicateCases(status?: DuplicateCase['status']): Promise<DuplicateCase[]> {
    let query = `SELECT * FROM duplicate_cases`;
    const params: any[] = [];

    if (status) {
      query += ` WHERE status = ?`;
      params.push(status);
    }

    query += ` ORDER BY detection_date DESC`;

    const results = await this.db.prepare(query).bind(...params).all<any>();
    return results.results.map((r: any) => this.mapDuplicateCaseFromDb(r));
  }

  async resolveDuplicateCase(caseId: string, resolution: DuplicateResolution): Promise<DuplicateCase> {
    const now = new Date().toISOString();
    const newStatus = resolution.decision === 'merge' ? 'merged' : 'not_duplicate';

    await this.db.prepare(`
      UPDATE duplicate_cases
      SET status = ?, resolution_decision = ?, survivor_id = ?, merged_at = ?, merged_by = ?, resolution_rationale = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      newStatus,
      resolution.decision,
      resolution.survivorId || null,
      resolution.mergedAt?.toISOString() || null,
      resolution.mergedBy || null,
      resolution.rationale,
      now,
      caseId
    ).run();

    const duplicateCase = await this.getDuplicateCase(caseId);
    if (!duplicateCase) throw new Error('Duplicate case not found');
    return duplicateCase;
  }

  async mergePatients(survivorId: string, mergedId: string, mergedBy: string): Promise<PatientIdentity> {
    const now = new Date().toISOString();

    // Mark merged patient as merged into survivor
    await this.db.prepare(`
      UPDATE patient_identities SET merged_into = ?, updated_at = ? WHERE patient_id = ?
    `).bind(survivorId, now, mergedId).run();

    // Update survivor's merged_from list
    const survivor = await this.getPatientIdentity(survivorId);
    if (!survivor) throw new Error('Survivor patient not found');

    const mergedFrom = [...survivor.mergedFrom, mergedId];
    await this.db.prepare(`
      UPDATE patient_identities SET merged_from = ?, updated_at = ? WHERE patient_id = ?
    `).bind(JSON.stringify(mergedFrom), now, survivorId).run();

    // Transfer aliases from merged patient
    const mergedIdentity = await this.db.prepare(`SELECT id FROM patient_identities WHERE patient_id = ?`).bind(mergedId).first<any>();
    const survivorIdentity = await this.db.prepare(`SELECT id FROM patient_identities WHERE patient_id = ?`).bind(survivorId).first<any>();

    if (mergedIdentity && survivorIdentity) {
      await this.db.prepare(`
        UPDATE patient_aliases SET patient_identity_id = ? WHERE patient_identity_id = ?
      `).bind(survivorIdentity.id, mergedIdentity.id).run();
    }

    const updatedSurvivor = await this.getPatientIdentity(survivorId);
    if (!updatedSurvivor) throw new Error('Updated survivor not found');
    return updatedSurvivor;
  }

  private mapDuplicateCaseFromDb(r: any): DuplicateCase {
    return {
      id: r.id,
      primaryPatientId: r.primary_patient_id,
      secondaryPatientId: r.secondary_patient_id,
      detectionMethod: r.detection_method,
      detectionDate: new Date(r.detection_date),
      matchScore: r.match_score,
      status: r.status,
      assignedTo: r.assigned_to,
      resolution: r.resolution_decision ? {
        decision: r.resolution_decision,
        survivorId: r.survivor_id,
        mergedAt: r.merged_at ? new Date(r.merged_at) : undefined,
        mergedBy: r.merged_by,
        rationale: r.resolution_rationale,
      } : undefined,
      notes: r.notes,
      createdAt: new Date(r.created_at),
      updatedAt: new Date(r.updated_at),
    };
  }

  // ---------------------------------------------------------------------------
  // Collision Alerts
  // ---------------------------------------------------------------------------

  async createCollisionAlert(alert: Omit<CollisionAlert, 'id' | 'createdAt'>): Promise<CollisionAlert> {
    const id = crypto.randomUUID();
    return {
      ...alert,
      id,
      createdAt: new Date(),
    };
  }

  async getActiveAlerts(patientId?: string): Promise<CollisionAlert[]> {
    let query = `SELECT ca.*, pi.patient_id FROM collision_alerts ca JOIN patient_identities pi ON ca.patient_identity_id = pi.id WHERE ca.status = 'active'`;
    const params: any[] = [];

    if (patientId) {
      query += ` AND pi.patient_id = ?`;
      params.push(patientId);
    }

    query += ` ORDER BY ca.created_at DESC`;

    const results = await this.db.prepare(query).bind(...params).all<any>();
    return results.results.map((r: any) => this.mapCollisionAlertFromDb(r));
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<CollisionAlert> {
    const now = new Date().toISOString();
    await this.db.prepare(`
      UPDATE collision_alerts SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = ? WHERE id = ?
    `).bind(acknowledgedBy, now, alertId).run();

    const result = await this.db.prepare(`
      SELECT ca.*, pi.patient_id FROM collision_alerts ca JOIN patient_identities pi ON ca.patient_identity_id = pi.id WHERE ca.id = ?
    `).bind(alertId).first<any>();
    if (!result) throw new Error('Alert not found');
    return this.mapCollisionAlertFromDb(result);
  }

  async resolveAlert(alertId: string, resolution: string): Promise<CollisionAlert> {
    const now = new Date().toISOString();
    await this.db.prepare(`
      UPDATE collision_alerts SET status = 'resolved', resolution = ?, resolved_at = ? WHERE id = ?
    `).bind(resolution, now, alertId).run();

    const result = await this.db.prepare(`
      SELECT ca.*, pi.patient_id FROM collision_alerts ca JOIN patient_identities pi ON ca.patient_identity_id = pi.id WHERE ca.id = ?
    `).bind(alertId).first<any>();
    if (!result) throw new Error('Alert not found');
    return this.mapCollisionAlertFromDb(result);
  }

  async markAlertFalsePositive(alertId: string, reason: string): Promise<CollisionAlert> {
    const now = new Date().toISOString();
    await this.db.prepare(`
      UPDATE collision_alerts SET status = 'false_positive', resolution = ?, resolved_at = ? WHERE id = ?
    `).bind(reason, now, alertId).run();

    const result = await this.db.prepare(`
      SELECT ca.*, pi.patient_id FROM collision_alerts ca JOIN patient_identities pi ON ca.patient_identity_id = pi.id WHERE ca.id = ?
    `).bind(alertId).first<any>();
    if (!result) throw new Error('Alert not found');
    return this.mapCollisionAlertFromDb(result);
  }

  private mapCollisionAlertFromDb(r: any): CollisionAlert {
    return {
      id: r.id,
      patientId: r.patient_id,
      type: r.type,
      severity: r.severity,
      message: r.message,
      context: r.context,
      status: r.status,
      encounterId: r.encounter_id,
      location: r.location,
      createdAt: new Date(r.created_at),
      acknowledgedBy: r.acknowledged_by,
      acknowledgedAt: r.acknowledged_at ? new Date(r.acknowledged_at) : undefined,
      resolution: r.resolution,
      resolvedAt: r.resolved_at ? new Date(r.resolved_at) : undefined,
    };
  }

  async checkForCollisions(patientId: string, location: string, encounterId: string): Promise<CollisionAlert[]> {
    const alerts: CollisionAlert[] = [];
    const patient = await this.getPatientIdentity(patientId);
    if (!patient) return alerts;

    // Check for same patient in multiple active encounters
    const activeEncounters = await this.db.prepare(`
      SELECT location, encounter_id FROM patient_encounters WHERE patient_id = ? AND status = 'active' AND encounter_id != ?
    `).bind(patientId, encounterId).all<any>();
    for (const e of activeEncounters.results || []) {
      if (e.location !== location) {
        alerts.push(await this.createCollisionAlert({
          type: 'same_room', patientId, severity: 'critical',
          message: `Patient appears in multiple locations: ${location} and ${e.location}`,
          context: 'collision_check', status: 'active', encounterId, location,
        }));
      }
    }

    // Check for identity issues
    if (patient.identityStatus === 'douteuse') {
      alerts.push(await this.createCollisionAlert({
        type: 'identity_mismatch', patientId, severity: 'warning',
        message: 'Patient has doubtful identity status', context: 'collision_check',
        status: 'active', encounterId, location,
      }));
    }

    return alerts;
  }

  // ---------------------------------------------------------------------------
  // Wristbands
  // ---------------------------------------------------------------------------

  async generateWristband(patientId: string, encounterId: string, printedBy: string, printLocation: string, options?: { includePhoto?: boolean; includeAllergies?: boolean }): Promise<IdentityWristband> {
    const id = crypto.randomUUID();
    const barcode = this.generateBarcode(patientId, encounterId);
    const qrCode = this.generateQRCode(patientId, encounterId);

    return {
      id,
      patientId,
      encounterId,
      barcode,
      qrCode,
      printedAt: new Date(),
      printedBy,
      printLocation,
      status: 'active',
      includesPhoto: options?.includePhoto || false,
      includesAllergies: options?.includeAllergies || false,
    };
  }

  private generateBarcode(patientId: string, encounterId: string): string {
    // Generate unique barcode
    return `WB${Date.now()}${patientId.substring(0, 8)}`.toUpperCase();
  }

  private generateQRCode(patientId: string, encounterId: string): string {
    // Generate QR code content
    return JSON.stringify({ patientId, encounterId, timestamp: Date.now() });
  }

  async getActiveWristband(patientId: string, encounterId: string): Promise<IdentityWristband | null> {
    const result = await this.db.prepare(`
      SELECT * FROM identity_wristbands WHERE patient_id = ? AND encounter_id = ? AND status = 'active' ORDER BY printed_at DESC LIMIT 1
    `).bind(patientId, encounterId).first<any>();
    if (!result) return null;
    return {
      id: result.id, patientId: result.patient_id, encounterId: result.encounter_id,
      barcode: result.barcode, qrCode: result.qr_code, printedAt: new Date(result.printed_at),
      printedBy: result.printed_by, printLocation: result.print_location, status: result.status,
      includesPhoto: result.includes_photo === 1, includesAllergies: result.includes_allergies === 1,
    };
  }

  async verifyWristband(wristbandId: string, verifiedBy: string): Promise<IdentityWristband> {
    const now = new Date().toISOString();
    await this.db.prepare('UPDATE identity_wristbands SET last_verified_at = ?, last_verified_by = ? WHERE id = ?')
      .bind(now, verifiedBy, wristbandId).run();
    const result = await this.db.prepare('SELECT * FROM identity_wristbands WHERE id = ?').bind(wristbandId).first<any>();
    if (!result) throw new Error('Wristband not found');
    return { id: result.id, patientId: result.patient_id, encounterId: result.encounter_id, barcode: result.barcode, qrCode: result.qr_code, printedAt: new Date(result.printed_at), printedBy: result.printed_by, printLocation: result.print_location, status: result.status, includesPhoto: result.includes_photo === 1, includesAllergies: result.includes_allergies === 1 };
  }

  async reprintWristband(wristbandId: string, reprintedBy: string, reason: string): Promise<IdentityWristband> {
    const oldWristband = await this.db.prepare('SELECT * FROM identity_wristbands WHERE id = ?').bind(wristbandId).first<any>();
    if (!oldWristband) throw new Error('Wristband not found');
    await this.deactivateWristband(wristbandId, reason);
    return this.generateWristband(oldWristband.patient_id, oldWristband.encounter_id, reprintedBy, oldWristband.print_location, { includePhoto: oldWristband.includes_photo === 1, includeAllergies: oldWristband.includes_allergies === 1 });
  }

  async deactivateWristband(wristbandId: string, reason: string): Promise<IdentityWristband> {
    const now = new Date().toISOString();
    await this.db.prepare('UPDATE identity_wristbands SET status = \'deactivated\', deactivation_reason = ?, deactivated_at = ? WHERE id = ?')
      .bind(reason, now, wristbandId).run();
    const result = await this.db.prepare('SELECT * FROM identity_wristbands WHERE id = ?').bind(wristbandId).first<any>();
    if (!result) throw new Error('Wristband not found');
    return { id: result.id, patientId: result.patient_id, encounterId: result.encounter_id, barcode: result.barcode, qrCode: result.qr_code, printedAt: new Date(result.printed_at), printedBy: result.printed_by, printLocation: result.print_location, status: result.status, includesPhoto: result.includes_photo === 1, includesAllergies: result.includes_allergies === 1 };
  }

  // ---------------------------------------------------------------------------
  // Identity Checks
  // ---------------------------------------------------------------------------

  async recordIdentityCheck(check: Omit<IdentityCheck, 'id'>): Promise<IdentityCheck> {
    const id = crypto.randomUUID();
    const identityCheck = { ...check, id };

    // Create alert if discrepancy found
    if (check.result === 'discrepancy') {
      await this.createCollisionAlert({
        type: 'identity_mismatch',
        patientId: check.patientId,
        severity: 'warning',
        message: `Identity discrepancy during ${check.checkType}: ${check.discrepancyDetails}`,
        context: check.location,
        status: 'active',
        encounterId: check.encounterId,
        location: check.location,
      });
    }

    return identityCheck;
  }

  async getPatientCheckHistory(patientId: string): Promise<IdentityCheck[]> {
    const results = await this.db.prepare('SELECT * FROM identity_checks WHERE patient_id = ? ORDER BY check_time DESC').bind(patientId).all<any>();
    return (results.results || []).map((r: any) => ({
      id: r.id,
      patientId: r.patient_id,
      encounterId: r.encounter_id,
      checkType: r.check_type,
      checkDate: new Date(r.check_time),
      checkedBy: r.checked_by,
      location: r.location,
      method: r.method_used || 'verbal_confirmation',
      traitsVerified: ['nomNaissance', 'dateNaissance'] as (keyof PatientTraits)[],
      result: r.result,
      discrepancyDetails: r.discrepancy_details,
    }));
  }

  async getChecksByEncounter(encounterId: string): Promise<IdentityCheck[]> {
    const results = await this.db.prepare('SELECT * FROM identity_checks WHERE encounter_id = ? ORDER BY check_time DESC').bind(encounterId).all<any>();
    return (results.results || []).map((r: any) => ({
      id: r.id,
      patientId: r.patient_id,
      encounterId: r.encounter_id,
      checkType: r.check_type,
      checkDate: new Date(r.check_time),
      checkedBy: r.checked_by,
      location: r.location,
      method: r.method_used || 'verbal_confirmation',
      traitsVerified: ['nomNaissance', 'dateNaissance'] as (keyof PatientTraits)[],
      result: r.result,
      discrepancyDetails: r.discrepancy_details,
    }));
  }

  // ---------------------------------------------------------------------------
  // Audits
  // ---------------------------------------------------------------------------

  async createAudit(data: Omit<IdentityAudit, 'id' | 'findings' | 'summary' | 'createdAt' | 'updatedAt'>): Promise<IdentityAudit> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      findings: [],
      summary: {
        totalPatients: 0,
        withINS: 0,
        insQualified: 0,
        validated: 0,
        provisional: 0,
        doubtful: 0,
        duplicateCandidates: 0,
        averageQualityScore: 0,
      },
      createdAt: now,
      updatedAt: now,
    };
  }

  async getAudit(auditId: string): Promise<IdentityAudit | null> {
    const result = await this.db.prepare('SELECT * FROM identity_audits WHERE id = ?').bind(auditId).first<any>();
    if (!result) return null;
    return {
      id: result.id,
      facilityId: result.facility_id,
      auditDate: new Date(result.audit_date),
      auditorId: result.auditor_id,
      scope: result.scope ? JSON.parse(result.scope) : {},
      findings: result.findings ? JSON.parse(result.findings) : [],
      summary: result.summary ? JSON.parse(result.summary) : { totalPatients: 0, withINS: 0, insQualified: 0, validated: 0, provisional: 0, doubtful: 0, duplicateCandidates: 0, averageQualityScore: 0 },
      recommendations: result.recommendations ? JSON.parse(result.recommendations) : [],
      status: result.status,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    };
  }

  async addAuditFinding(auditId: string, finding: IdentityAuditFinding): Promise<IdentityAudit> {
    const audit = await this.getAudit(auditId);
    if (!audit) throw new Error('Audit not found');
    const findings = [...audit.findings, finding];
    const now = new Date().toISOString();
    await this.db.prepare('UPDATE identity_audits SET findings = ?, updated_at = ? WHERE id = ?').bind(JSON.stringify(findings), now, auditId).run();
    return { ...audit, findings };
  }

  async completeAudit(auditId: string, recommendations: string[]): Promise<IdentityAudit> {
    const audit = await this.getAudit(auditId);
    if (!audit) throw new Error('Audit not found');
    const summary: IdentityAuditSummary = {
      totalPatients: audit.findings.length,
      withINS: 0,
      insQualified: 0,
      validated: 0,
      provisional: 0,
      doubtful: 0,
      duplicateCandidates: 0,
      averageQualityScore: 0,
    };
    // Calculate summary from findings by category
    for (const f of audit.findings) {
      if (f.category === 'missing_ins') summary.provisional++;
      else if (f.category === 'unvalidated') summary.provisional++;
      else if (f.category === 'quality') summary.doubtful++;
      else if (f.category === 'duplicate') summary.duplicateCandidates++;
      else summary.validated++;
    }
    summary.withINS = summary.totalPatients - audit.findings.filter(f => f.category === 'missing_ins').length;
    summary.insQualified = summary.withINS;

    const now = new Date().toISOString();
    await this.db.prepare('UPDATE identity_audits SET status = \'completed\', summary = ?, recommendations = ?, updated_at = ? WHERE id = ?')
      .bind(JSON.stringify(summary), JSON.stringify(recommendations), now, auditId).run();
    return { ...audit, status: 'completed', summary, recommendations };
  }

  async runAutomaticAudit(facilityId: string): Promise<IdentityAudit> {
    const audit = await this.createAudit({
      facilityId,
      auditDate: new Date(),
      auditorId: 'system',
      scope: { patientCount: 0 },
      status: 'in_progress',
      recommendations: [],
    });
    // Find patients without INS
    const noINS = await this.db.prepare('SELECT patient_id FROM patient_identities WHERE ins IS NULL LIMIT 100').all<any>();
    for (const p of noINS.results || []) {
      await this.addAuditFinding(audit.id, {
        patientId: p.patient_id,
        category: 'missing_ins',
        description: 'Patient without INS qualification',
        severity: 'medium',
      });
    }
    // Find low quality scores
    const lowQuality = await this.db.prepare('SELECT patient_id FROM patient_identities WHERE quality_score < 50 LIMIT 100').all<any>();
    for (const p of lowQuality.results || []) {
      await this.addAuditFinding(audit.id, {
        patientId: p.patient_id,
        category: 'quality',
        description: 'Low quality score (below 50)',
        severity: 'low',
      });
    }
    return this.completeAudit(audit.id, ['Increase INS qualification rate', 'Address low quality identities']);
  }

  // ---------------------------------------------------------------------------
  // Metrics and Reporting
  // ---------------------------------------------------------------------------

  async getIdentityMetrics(facilityId: string, period: { start: Date; end: Date }): Promise<IdentityMetrics> {
    const totalResult = await this.db.prepare('SELECT COUNT(*) as cnt FROM patient_identities').first<any>();
    const insResult = await this.db.prepare('SELECT COUNT(*) as cnt FROM patient_identities WHERE ins IS NOT NULL').first<any>();
    const validatedResult = await this.db.prepare('SELECT COUNT(*) as cnt FROM patient_identities WHERE identity_status IN (\'validee\', \'qualifiee\')').first<any>();
    const duplicatesResult = await this.db.prepare('SELECT COUNT(*) as cnt FROM duplicate_cases WHERE status = \'pending\'').first<any>();
    const avgScoreResult = await this.db.prepare('SELECT AVG(quality_score) as avg FROM patient_identities').first<any>();
    const total = totalResult?.cnt || 1;
    return {
      facilityId, period,
      insQualificationRate: total > 0 ? ((insResult?.cnt || 0) / total) * 100 : 0,
      identityValidationRate: total > 0 ? ((validatedResult?.cnt || 0) / total) * 100 : 0,
      duplicateRate: total > 0 ? ((duplicatesResult?.cnt || 0) / total) * 100 : 0,
      averageQualityScore: avgScoreResult?.avg || 0,
      verificationsByType: [], collisionsByType: [],
      trendsComparedToPrevious: { insQualificationRate: 0, identityValidationRate: 0 },
    };
  }

  async getPatientsByStatus(status: IdentityStatus): Promise<PatientIdentity[]> {
    const results = await this.db.prepare('SELECT patient_id FROM patient_identities WHERE identity_status = ?').bind(status).all<any>();
    const patients: PatientIdentity[] = [];
    for (const r of results.results || []) {
      const p = await this.getPatientIdentity(r.patient_id);
      if (p) patients.push(p);
    }
    return patients;
  }

  async getPatientsWithoutINS(): Promise<PatientIdentity[]> {
    const results = await this.db.prepare('SELECT patient_id FROM patient_identities WHERE ins IS NULL LIMIT 100').all<any>();
    const patients: PatientIdentity[] = [];
    for (const r of results.results || []) {
      const p = await this.getPatientIdentity(r.patient_id);
      if (p) patients.push(p);
    }
    return patients;
  }

  async getLowQualityPatients(threshold: number): Promise<PatientIdentity[]> {
    const results = await this.db.prepare('SELECT patient_id FROM patient_identities WHERE quality_score < ? LIMIT 100').bind(threshold).all<any>();
    const patients: PatientIdentity[] = [];
    for (const r of results.results || []) {
      const p = await this.getPatientIdentity(r.patient_id);
      if (p) patients.push(p);
    }
    return patients;
  }

  // ---------------------------------------------------------------------------
  // Policy Management
  // ---------------------------------------------------------------------------

  async createPolicy(data: Omit<IdentitovigilancePolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<IdentitovigilancePolicy> {
    const id = crypto.randomUUID();
    const now = new Date();

    return {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
  }

  async getCurrentPolicy(facilityId: string): Promise<IdentitovigilancePolicy | null> {
    const result = await this.db.prepare(`
      SELECT * FROM identitovigilance_policies WHERE facility_id = ? AND effective_date <= date('now') ORDER BY effective_date DESC LIMIT 1
    `).bind(facilityId).first<any>();
    if (!result) return null;
    return {
      id: result.id,
      facilityId: result.facility_id,
      name: result.name || 'Default Policy',
      version: result.version,
      requiredTraits: result.required_traits ? JSON.parse(result.required_traits) : ['nomNaissance', 'prenomNaissance', 'dateNaissance'],
      mandatoryVerification: result.mandatory_verification ? JSON.parse(result.mandatory_verification) : [],
      verificationFrequency: result.verification_frequency ? JSON.parse(result.verification_frequency) : {},
      photoRequired: Boolean(result.photo_required),
      wristbandRequired: Boolean(result.wristband_required),
      duplicateThreshold: result.duplicate_threshold || 80,
      qualityScoreMinimum: result.quality_score_minimum || 50,
      insQualificationRequired: Boolean(result.ins_qualification_required),
      effectiveDate: new Date(result.effective_date),
      approvedBy: result.approved_by,
      approvedAt: new Date(result.approved_at || result.effective_date),
      createdAt: new Date(result.created_at || result.effective_date),
      updatedAt: new Date(result.updated_at || result.effective_date),
    };
  }

  async validateAgainstPolicy(patientId: string): Promise<{ compliant: boolean; violations: string[] }> {
    const patient = await this.getPatientIdentity(patientId);
    if (!patient) return { compliant: false, violations: ['Patient not found'] };

    const violations: string[] = [];
    if (!patient.ins) violations.push('Missing INS identification');
    if (patient.identityStatus === 'provisoire') violations.push('Identity not validated');
    if (patient.identityStatus === 'douteuse') violations.push('Identity marked as doubtful');
    if (patient.qualityScore < 50) violations.push('Quality score below minimum threshold');

    return { compliant: violations.length === 0, violations };
  }

  async exportForINSMonitoring(facilityId: string, period: { start: Date; end: Date }): Promise<{ format: string; data: string }> {
    const results = await this.db.prepare(`
      SELECT pi.patient_id, pi.identity_status, pi.quality_score, pi.ins, pt.nom_naissance, pt.prenom_naissance, pt.date_naissance
      FROM patient_identities pi
      LEFT JOIN patient_traits pt ON pi.id = pt.patient_identity_id
      WHERE pi.created_at >= ? AND pi.created_at <= ?
    `).bind(period.start.toISOString(), period.end.toISOString()).all<any>();
    const lines = ['PatientID,Nom,Prenom,DateNaissance,StatutIdentite,ScoreQualite,INS'];
    for (const r of results.results || []) {
      lines.push(`${r.patient_id},${r.nom_naissance || ''},${r.prenom_naissance || ''},${r.date_naissance || ''},${r.identity_status},${r.quality_score},${r.ins ? 'Oui' : 'Non'}`);
    }
    return { format: 'csv', data: lines.join('\n') };
  }
}

// ============================================================================
// Export Service Factory
// ============================================================================

export function createIdentitovigilanceService(db: D1Database): IdentitovigilanceService {
  return new IdentitovigilanceService(db);
}
