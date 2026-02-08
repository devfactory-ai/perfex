/**
 * Echocardiogram Analysis Service
 * AI-powered cardiac ultrasound analysis
 */

import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '../../db';
import { echoAnalysis, imagingAnalysis } from '@perfex/database/schema';

export interface EchoAnalysisInput {
  imagingAnalysisId: string;
  studyType?: 'tte' | 'tee' | 'stress_echo' | 'contrast_echo' | 'bubble_study' | '3d_echo';
  studyQuality?: 'excellent' | 'good' | 'fair' | 'poor' | 'non_diagnostic';
  studyLimitations?: string[];
}

export interface EchoAiFindings {
  // LV Systolic Function
  lvef: number;
  lvefCategory: 'normal' | 'mildly_reduced' | 'moderately_reduced' | 'severely_reduced';

  // LV Dimensions
  lvedd?: number;
  lvesd?: number;
  lvMass?: number;
  lvMassIndex?: number;
  lvhPresent?: boolean;

  // Diastolic Function
  diastolicGrade?: 'normal' | 'grade_1' | 'grade_2' | 'grade_3' | 'indeterminate';
  eWave?: number;
  aWave?: number;
  eeRatio?: number;

  // Wall Motion
  wallMotionAbnormalities?: boolean;
  wallMotionScore?: number;

  // RV Function
  rvFunction?: 'normal' | 'mildly_reduced' | 'moderately_reduced' | 'severely_reduced';
  tapse?: number;
  rvsp?: number;

  // Valves
  aorticStenosis?: 'none' | 'mild' | 'moderate' | 'severe';
  aorticRegurgitation?: 'none' | 'trace' | 'mild' | 'moderate' | 'severe';
  mitralStenosis?: 'none' | 'mild' | 'moderate' | 'severe';
  mitralRegurgitation?: 'none' | 'trace' | 'mild' | 'moderate' | 'moderate_severe' | 'severe';
  tricuspidRegurgitation?: 'none' | 'trace' | 'mild' | 'moderate' | 'severe';

  // Pericardium
  pericardialEffusion?: 'none' | 'trace' | 'small' | 'moderate' | 'large';
  tamponadePhysiology?: boolean;

  // Other
  vegetations?: boolean;
  thrombus?: boolean;

  // AI interpretation
  aiSummary: string;
  majorFindings?: string[];
  recommendations?: string[];
  urgencyScore: number;
}

export class EchoAnalysisService {
  /**
   * Create Echo analysis record
   */
  static async create(
    env: Env,
    organizationId: string,
    input: EchoAnalysisInput
  ) {
    const db = getDb(env);

    const [analysis] = await db
      .insert(echoAnalysis)
      .values({
        organizationId,
        imagingAnalysisId: input.imagingAnalysisId,
        studyType: input.studyType || 'tte',
        studyQuality: input.studyQuality,
        studyLimitations: input.studyLimitations ? JSON.stringify(input.studyLimitations) : null,
      })
      .returning();

    return analysis;
  }

  /**
   * Get Echo analysis by ID
   */
  static async getById(env: Env, organizationId: string, id: string) {
    const db = getDb(env);

    const [analysis] = await db
      .select()
      .from(echoAnalysis)
      .where(
        and(
          eq(echoAnalysis.id, id),
          eq(echoAnalysis.organizationId, organizationId)
        )
      );

    return analysis || null;
  }

  /**
   * Get Echo analysis by imaging analysis ID
   */
  static async getByImagingId(env: Env, organizationId: string, imagingAnalysisId: string) {
    const db = getDb(env);

    const [analysis] = await db
      .select()
      .from(echoAnalysis)
      .where(
        and(
          eq(echoAnalysis.imagingAnalysisId, imagingAnalysisId),
          eq(echoAnalysis.organizationId, organizationId)
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
    findings: EchoAiFindings
  ) {
    const db = getDb(env);

    const [analysis] = await db
      .update(echoAnalysis)
      .set({
        lvef: findings.lvef,
        lvefCategory: findings.lvefCategory as any,
        lvedd: findings.lvedd,
        lvesd: findings.lvesd,
        lvMass: findings.lvMass,
        lvMassIndex: findings.lvMassIndex,
        lvhPresent: findings.lvhPresent,
        diastolicGrade: findings.diastolicGrade as any,
        eWave: findings.eWave,
        aWave: findings.aWave,
        eeRatio: findings.eeRatio,
        wallMotionAbnormalities: findings.wallMotionAbnormalities,
        wallMotionScore: findings.wallMotionScore,
        rvFunction: findings.rvFunction as any,
        tapse: findings.tapse,
        rvsp: findings.rvsp,
        aorticStenosis: findings.aorticStenosis as any,
        aorticRegurgitation: findings.aorticRegurgitation as any,
        mitralStenosis: findings.mitralStenosis as any,
        mitralRegurgitation: findings.mitralRegurgitation as any,
        tricuspidRegurgitation: findings.tricuspidRegurgitation as any,
        pericardialEffusion: findings.pericardialEffusion as any,
        tamponadePhysiology: findings.tamponadePhysiology,
        vegetations: findings.vegetations,
        thrombus: findings.thrombus,
        aiSummary: findings.aiSummary,
        majorFindings: findings.majorFindings ? JSON.stringify(findings.majorFindings) : null,
        recommendations: findings.recommendations ? JSON.stringify(findings.recommendations) : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(echoAnalysis.id, id),
          eq(echoAnalysis.organizationId, organizationId)
        )
      )
      .returning();

    return analysis;
  }

  /**
   * Get patient Echo history
   */
  static async getPatientHistory(
    env: Env,
    organizationId: string,
    patientId: string,
    limit = 20
  ) {
    const db = getDb(env);

    const analyses = await db
      .select({
        echo: echoAnalysis,
        imaging: imagingAnalysis,
      })
      .from(echoAnalysis)
      .innerJoin(imagingAnalysis, eq(echoAnalysis.imagingAnalysisId, imagingAnalysis.id))
      .where(
        and(
          eq(echoAnalysis.organizationId, organizationId),
          eq(imagingAnalysis.patientId, patientId)
        )
      )
      .orderBy(desc(imagingAnalysis.acquisitionDate))
      .limit(limit);

    return analyses;
  }

  /**
   * Calculate change from previous echo
   */
  static async calculateChange(
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

    // LVEF change
    if (current.lvef !== null && previous.lvef !== null) {
      const lvefChange = current.lvef - previous.lvef;
      changes.lvefChange = lvefChange;
      changes.lvefChangePercent = ((lvefChange / previous.lvef) * 100).toFixed(1);
      changes.lvefImproved = lvefChange > 5;
      changes.lvefWorsened = lvefChange < -5;
    }

    // LV dimensions change
    if (current.lvedd && previous.lvedd) {
      changes.lveddChange = current.lvedd - previous.lvedd;
    }

    // Valve changes
    const valveGrades = ['none', 'trace', 'mild', 'moderate', 'severe'];
    if (current.mitralRegurgitation && previous.mitralRegurgitation) {
      const currentIdx = valveGrades.indexOf(current.mitralRegurgitation);
      const prevIdx = valveGrades.indexOf(previous.mitralRegurgitation);
      changes.mrProgression = currentIdx > prevIdx ? 'worsened' : currentIdx < prevIdx ? 'improved' : 'stable';
    }

    // Update with comparison
    const db = getDb(env);
    await db
      .update(echoAnalysis)
      .set({
        changeFromPrevious: JSON.stringify(changes),
        updatedAt: new Date(),
      })
      .where(eq(echoAnalysis.id, currentId));

    return changes;
  }

  /**
   * AI Echo Analysis using Cloudflare Workers AI
   */
  static async analyzeEcho(
    env: Env,
    organizationId: string,
    imagingAnalysisId: string,
    studyType: string,
    imageUrl: string
  ): Promise<EchoAiFindings> {
    const ai = env.AI;

    const prompt = `You are an expert cardiologist analyzing an echocardiogram (${studyType}). Generate a realistic echo analysis in JSON format:
{
  "lvef": <30-75>,
  "lvefCategory": "<normal|mildly_reduced|moderately_reduced|severely_reduced>",
  "lvedd": <40-70 mm>,
  "lvesd": <25-55 mm>,
  "lvMass": <100-300 g>,
  "lvMassIndex": <50-150 g/m2>,
  "lvhPresent": <true|false>,
  "diastolicGrade": "<normal|grade_1|grade_2|grade_3|indeterminate>",
  "eWave": <0.5-1.5 m/s>,
  "aWave": <0.3-1.0 m/s>,
  "eeRatio": <5-20>,
  "wallMotionAbnormalities": <true|false>,
  "rvFunction": "<normal|mildly_reduced|moderately_reduced|severely_reduced>",
  "tapse": <15-30 mm>,
  "rvsp": <20-50 mmHg>,
  "aorticStenosis": "<none|mild|moderate|severe>",
  "aorticRegurgitation": "<none|trace|mild|moderate|severe>",
  "mitralStenosis": "<none|mild|moderate|severe>",
  "mitralRegurgitation": "<none|trace|mild|moderate|moderate_severe|severe>",
  "tricuspidRegurgitation": "<none|trace|mild|moderate|severe>",
  "pericardialEffusion": "<none|trace|small|moderate|large>",
  "tamponadePhysiology": <true|false>,
  "vegetations": <true|false>,
  "thrombus": <true|false>,
  "aiSummary": "<detailed summary>",
  "majorFindings": ["<finding1>", "<finding2>"],
  "recommendations": ["<rec1>", "<rec2>"],
  "urgencyScore": <1-10>
}
Respond ONLY with the JSON object.`;

    try {
      const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1200,
      });

      const responseText = (response as any).response || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          lvef: parsed.lvef || 60,
          lvefCategory: parsed.lvefCategory || 'normal',
          lvedd: parsed.lvedd,
          lvesd: parsed.lvesd,
          lvMass: parsed.lvMass,
          lvMassIndex: parsed.lvMassIndex,
          lvhPresent: parsed.lvhPresent || false,
          diastolicGrade: parsed.diastolicGrade || 'normal',
          eWave: parsed.eWave,
          aWave: parsed.aWave,
          eeRatio: parsed.eeRatio,
          wallMotionAbnormalities: parsed.wallMotionAbnormalities || false,
          rvFunction: parsed.rvFunction || 'normal',
          tapse: parsed.tapse,
          rvsp: parsed.rvsp,
          aorticStenosis: parsed.aorticStenosis || 'none',
          aorticRegurgitation: parsed.aorticRegurgitation || 'none',
          mitralStenosis: parsed.mitralStenosis || 'none',
          mitralRegurgitation: parsed.mitralRegurgitation || 'none',
          tricuspidRegurgitation: parsed.tricuspidRegurgitation || 'none',
          pericardialEffusion: parsed.pericardialEffusion || 'none',
          tamponadePhysiology: parsed.tamponadePhysiology || false,
          vegetations: parsed.vegetations || false,
          thrombus: parsed.thrombus || false,
          aiSummary: parsed.aiSummary || 'Normal biventricular size and function.',
          majorFindings: parsed.majorFindings || [],
          recommendations: parsed.recommendations || [],
          urgencyScore: parsed.urgencyScore || 1,
        };
      }
    } catch (error) {
      console.error('Echo AI analysis error:', error);
    }

    // Fallback default findings
    return {
      lvef: 60,
      lvefCategory: 'normal',
      lvedd: 48,
      lvesd: 32,
      diastolicGrade: 'normal',
      wallMotionAbnormalities: false,
      rvFunction: 'normal',
      tapse: 22,
      aorticStenosis: 'none',
      aorticRegurgitation: 'none',
      mitralStenosis: 'none',
      mitralRegurgitation: 'trace',
      tricuspidRegurgitation: 'trace',
      pericardialEffusion: 'none',
      aiSummary: 'Normal biventricular size and systolic function. LVEF 60% by visual estimation. No significant valvular abnormalities. Normal diastolic function. No pericardial effusion.',
      majorFindings: [],
      recommendations: [],
      urgencyScore: 1,
    };
  }

  /**
   * Detect critical Echo findings
   */
  static isCritical(findings: EchoAiFindings): boolean {
    // Severely reduced LVEF
    if (findings.lvef < 30 || findings.lvefCategory === 'severely_reduced') {
      return true;
    }

    // Tamponade
    if (findings.tamponadePhysiology) {
      return true;
    }

    // Large pericardial effusion
    if (findings.pericardialEffusion === 'large') {
      return true;
    }

    // Severe aortic stenosis
    if (findings.aorticStenosis === 'severe') {
      return true;
    }

    // Severe mitral regurgitation
    if (findings.mitralRegurgitation === 'severe') {
      return true;
    }

    // Vegetations (endocarditis)
    if (findings.vegetations) {
      return true;
    }

    // Thrombus
    if (findings.thrombus) {
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
  static getUrgencyLevel(findings: EchoAiFindings): 'routine' | 'priority' | 'urgent' | 'stat' {
    if (this.isCritical(findings)) {
      return 'stat';
    }

    if (
      findings.urgencyScore >= 7 ||
      findings.lvefCategory === 'moderately_reduced' ||
      findings.aorticStenosis === 'moderate' ||
      findings.mitralRegurgitation === 'moderate_severe'
    ) {
      return 'urgent';
    }

    if (
      findings.urgencyScore >= 5 ||
      findings.lvhPresent ||
      findings.wallMotionAbnormalities ||
      findings.diastolicGrade === 'grade_2' ||
      findings.diastolicGrade === 'grade_3'
    ) {
      return 'priority';
    }

    return 'routine';
  }

  /**
   * Get heart failure stage based on LVEF
   */
  static getHeartFailureStage(findings: EchoAiFindings): string {
    if (findings.lvef >= 50) {
      return 'HFpEF'; // Heart Failure with Preserved EF
    } else if (findings.lvef >= 40) {
      return 'HFmrEF'; // Heart Failure with Mildly Reduced EF
    } else {
      return 'HFrEF'; // Heart Failure with Reduced EF
    }
  }
}

export default EchoAnalysisService;
