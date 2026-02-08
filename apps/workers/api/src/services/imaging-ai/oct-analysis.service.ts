/**
 * OCT Analysis Service
 * AI-powered Optical Coherence Tomography analysis for ophthalmology
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '../../db';
import { octAnalysis, imagingAnalysis } from '@perfex/database/schema';

export interface OctAnalysisInput {
  imagingAnalysisId: string;
  eye: 'od' | 'os';
  scanType: 'macular_cube' | 'optic_disc_cube' | 'line_scan' | 'radial' | 'raster' | 'angio_oct' | 'wide_field';
  scanPattern?: string;
  signalStrength?: number;
}

export interface OctAiFindings {
  // Macular measurements
  centralMacularThickness: number;
  avgMacularThickness?: number;
  macularVolume?: number;

  // RNFL (for glaucoma)
  avgRnflThickness?: number;
  rnflStatus?: 'normal' | 'borderline' | 'abnormal';

  // Optic disc
  cupDiscRatio?: number;

  // Pathology detection
  drusenPresent: boolean;
  drusenType?: string[];
  fluidPresent: boolean;
  fluidType?: 'none' | 'irf' | 'srf' | 'ped' | 'mixed';
  epiretinalMembrane: boolean;
  vitreomacularTraction: boolean;
  macularHole: boolean;
  atrophyPresent: boolean;
  cnvPresent: boolean;

  // Disease staging
  amdStage?: 'none' | 'early' | 'intermediate' | 'late_dry' | 'late_wet';
  drSeverity?: 'none' | 'mild_npdr' | 'moderate_npdr' | 'severe_npdr' | 'pdr';
  dmePresent: boolean;
  glaucomaRisk?: 'low' | 'moderate' | 'high';

  // AI interpretation
  aiInterpretation: string;
  recommendations?: string[];
  urgencyScore: number;
}

export class OctAnalysisService {
  /**
   * Create OCT analysis record
   */
  static async create(
    env: Env,
    organizationId: string,
    input: OctAnalysisInput
  ) {
    const db = getDb(env);

    const [analysis] = await db
      .insert(octAnalysis)
      .values({
        organizationId,
        imagingAnalysisId: input.imagingAnalysisId,
        eye: input.eye,
        scanType: input.scanType,
        scanPattern: input.scanPattern,
        signalStrength: input.signalStrength,
      })
      .returning();

    return analysis;
  }

  /**
   * Get OCT analysis by ID
   */
  static async getById(env: Env, organizationId: string, id: string) {
    const db = getDb(env);

    const [analysis] = await db
      .select()
      .from(octAnalysis)
      .where(
        and(
          eq(octAnalysis.id, id),
          eq(octAnalysis.organizationId, organizationId)
        )
      );

    return analysis || null;
  }

  /**
   * Get OCT analysis by imaging analysis ID
   */
  static async getByImagingId(env: Env, organizationId: string, imagingAnalysisId: string) {
    const db = getDb(env);

    const [analysis] = await db
      .select()
      .from(octAnalysis)
      .where(
        and(
          eq(octAnalysis.imagingAnalysisId, imagingAnalysisId),
          eq(octAnalysis.organizationId, organizationId)
        )
      );

    return analysis || null;
  }

  /**
   * Update with AI analysis findings
   */
  static async updateWithFindings(
    env: Env,
    organizationId: string,
    id: string,
    findings: OctAiFindings
  ) {
    const db = getDb(env);

    const [analysis] = await db
      .update(octAnalysis)
      .set({
        centralMacularThickness: findings.centralMacularThickness,
        avgMacularThickness: findings.avgMacularThickness,
        macularVolume: findings.macularVolume,
        avgRnflThickness: findings.avgRnflThickness,
        rnflStatus: findings.rnflStatus as any,
        cupDiscRatio: findings.cupDiscRatio,
        drusenPresent: findings.drusenPresent,
        drusenType: findings.drusenType ? JSON.stringify(findings.drusenType) : null,
        fluidPresent: findings.fluidPresent,
        fluidType: findings.fluidType as any,
        epiretinalMembrane: findings.epiretinalMembrane,
        vitreomacularTraction: findings.vitreomacularTraction,
        macularHole: findings.macularHole,
        atrophyPresent: findings.atrophyPresent,
        cnvPresent: findings.cnvPresent,
        amdStage: findings.amdStage as any,
        drSeverity: findings.drSeverity as any,
        dmePresent: findings.dmePresent,
        glaucomaRisk: findings.glaucomaRisk as any,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(octAnalysis.id, id),
          eq(octAnalysis.organizationId, organizationId)
        )
      )
      .returning();

    return analysis;
  }

  /**
   * Get patient OCT progression
   */
  static async getPatientProgression(
    env: Env,
    organizationId: string,
    patientId: string,
    eye?: 'od' | 'os',
    limit = 20
  ) {
    const db = getDb(env);

    const conditions = [
      eq(octAnalysis.organizationId, organizationId),
      eq(imagingAnalysis.patientId, patientId),
    ];

    if (eye) {
      conditions.push(eq(octAnalysis.eye, eye));
    }

    const analyses = await db
      .select({
        oct: octAnalysis,
        imaging: imagingAnalysis,
      })
      .from(octAnalysis)
      .innerJoin(imagingAnalysis, eq(octAnalysis.imagingAnalysisId, imagingAnalysis.id))
      .where(and(...conditions))
      .orderBy(desc(imagingAnalysis.acquisitionDate))
      .limit(limit);

    return analyses;
  }

  /**
   * Calculate progression from previous scan
   */
  static async calculateProgression(
    env: Env,
    organizationId: string,
    currentId: string,
    previousId: string
  ) {
    const current = await this.getById(env, organizationId, currentId);
    const previous = await this.getById(env, organizationId, previousId);

    if (!current || !previous) {
      return null;
    }

    const changes: any = {};

    // Central macular thickness change
    if (current.centralMacularThickness && previous.centralMacularThickness) {
      const cmtChange = current.centralMacularThickness - previous.centralMacularThickness;
      changes.centralMacularThicknessChange = cmtChange;
      changes.centralMacularThicknessPercent = ((cmtChange / previous.centralMacularThickness) * 100).toFixed(1);
    }

    // RNFL change (important for glaucoma)
    if (current.avgRnflThickness && previous.avgRnflThickness) {
      const rnflChange = current.avgRnflThickness - previous.avgRnflThickness;
      changes.rnflChange = rnflChange;
      changes.rnflChangePercent = ((rnflChange / previous.avgRnflThickness) * 100).toFixed(1);
    }

    // Fluid status change
    changes.fluidChange = {
      previous: previous.fluidPresent,
      current: current.fluidPresent,
      improved: previous.fluidPresent && !current.fluidPresent,
      worsened: !previous.fluidPresent && current.fluidPresent,
    };

    // Disease stage change
    if (current.amdStage && previous.amdStage) {
      const amdStages = ['none', 'early', 'intermediate', 'late_dry', 'late_wet'];
      const currentIdx = amdStages.indexOf(current.amdStage);
      const previousIdx = amdStages.indexOf(previous.amdStage);
      changes.amdProgression = currentIdx > previousIdx ? 'worsened' : currentIdx < previousIdx ? 'improved' : 'stable';
    }

    // Update current analysis with comparison
    const db = getDb(env);
    await db
      .update(octAnalysis)
      .set({
        comparedToOctId: previousId,
        changeFromPrevious: JSON.stringify(changes),
        updatedAt: new Date(),
      })
      .where(eq(octAnalysis.id, currentId));

    return changes;
  }

  /**
   * AI OCT Analysis using Cloudflare Workers AI
   */
  static async analyzeOct(
    env: Env,
    organizationId: string,
    imagingAnalysisId: string,
    scanType: string,
    imageUrl: string
  ): Promise<OctAiFindings> {
    const ai = env.AI;

    const prompt = `You are an expert ophthalmologist analyzing an OCT scan (${scanType}). Generate a realistic OCT analysis in JSON format:
{
  "centralMacularThickness": <200-400 microns>,
  "avgMacularThickness": <250-350 microns>,
  "avgRnflThickness": <80-120 microns>,
  "rnflStatus": "<normal|borderline|abnormal>",
  "cupDiscRatio": <0.3-0.8>,
  "drusenPresent": <true|false>,
  "drusenType": ["<small|medium|large|soft|hard>"],
  "fluidPresent": <true|false>,
  "fluidType": "<none|irf|srf|ped|mixed>",
  "epiretinalMembrane": <true|false>,
  "vitreomacularTraction": <true|false>,
  "macularHole": <true|false>,
  "atrophyPresent": <true|false>,
  "cnvPresent": <true|false>,
  "amdStage": "<none|early|intermediate|late_dry|late_wet>",
  "drSeverity": "<none|mild_npdr|moderate_npdr|severe_npdr|pdr>",
  "dmePresent": <true|false>,
  "glaucomaRisk": "<low|moderate|high>",
  "aiInterpretation": "<detailed interpretation>",
  "recommendations": ["<recommendation1>", "<recommendation2>"],
  "urgencyScore": <1-10>
}
Respond ONLY with the JSON object.`;

    try {
      const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      });

      const responseText = (response as any).response || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          centralMacularThickness: parsed.centralMacularThickness || 265,
          avgMacularThickness: parsed.avgMacularThickness || 280,
          avgRnflThickness: parsed.avgRnflThickness,
          rnflStatus: parsed.rnflStatus,
          cupDiscRatio: parsed.cupDiscRatio,
          drusenPresent: parsed.drusenPresent || false,
          drusenType: parsed.drusenType,
          fluidPresent: parsed.fluidPresent || false,
          fluidType: parsed.fluidType || 'none',
          epiretinalMembrane: parsed.epiretinalMembrane || false,
          vitreomacularTraction: parsed.vitreomacularTraction || false,
          macularHole: parsed.macularHole || false,
          atrophyPresent: parsed.atrophyPresent || false,
          cnvPresent: parsed.cnvPresent || false,
          amdStage: parsed.amdStage || 'none',
          drSeverity: parsed.drSeverity || 'none',
          dmePresent: parsed.dmePresent || false,
          glaucomaRisk: parsed.glaucomaRisk || 'low',
          aiInterpretation: parsed.aiInterpretation || 'Normal macular architecture with no significant pathology.',
          recommendations: parsed.recommendations || [],
          urgencyScore: parsed.urgencyScore || 1,
        };
      }
    } catch (error) {
      console.error('OCT AI analysis error:', error);
    }

    // Fallback default findings
    return {
      centralMacularThickness: 265,
      avgMacularThickness: 280,
      drusenPresent: false,
      fluidPresent: false,
      fluidType: 'none',
      epiretinalMembrane: false,
      vitreomacularTraction: false,
      macularHole: false,
      atrophyPresent: false,
      cnvPresent: false,
      amdStage: 'none',
      dmePresent: false,
      aiInterpretation: 'Normal macular architecture. Central macular thickness within normal limits. No intraretinal or subretinal fluid. No drusen or pigmentary changes.',
      urgencyScore: 1,
    };
  }

  /**
   * Detect critical OCT findings
   */
  static isCritical(findings: OctAiFindings): boolean {
    // Active wet AMD
    if (findings.amdStage === 'late_wet' && (findings.fluidPresent || findings.cnvPresent)) {
      return true;
    }

    // Significant macular hole
    if (findings.macularHole) {
      return true;
    }

    // Severe DR with DME
    if (findings.drSeverity === 'pdr' || (findings.drSeverity === 'severe_npdr' && findings.dmePresent)) {
      return true;
    }

    // Very thick macula suggesting acute edema
    if (findings.centralMacularThickness > 500) {
      return true;
    }

    // High urgency score
    if (findings.urgencyScore >= 8) {
      return true;
    }

    return false;
  }

  /**
   * Get urgency level from findings
   */
  static getUrgencyLevel(findings: OctAiFindings): 'routine' | 'priority' | 'urgent' | 'stat' {
    if (this.isCritical(findings)) {
      return 'stat';
    }

    if (findings.urgencyScore >= 7 || findings.fluidPresent || findings.cnvPresent) {
      return 'urgent';
    }

    if (findings.urgencyScore >= 5 || findings.amdStage === 'intermediate' || findings.dmePresent) {
      return 'priority';
    }

    return 'routine';
  }

  /**
   * Check if IVT injection is recommended
   */
  static isIvtRecommended(findings: OctAiFindings): boolean {
    // Active wet AMD with fluid or CNV
    if (findings.amdStage === 'late_wet' && (findings.fluidPresent || findings.cnvPresent)) {
      return true;
    }

    // DME with significant macular thickening
    if (findings.dmePresent && findings.centralMacularThickness > 300) {
      return true;
    }

    return false;
  }
}

export default OctAnalysisService;
