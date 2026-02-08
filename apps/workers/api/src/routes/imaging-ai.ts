/**
 * Imaging AI Routes
 * AI-powered diagnostic imaging analysis endpoints
 */

import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  ImagingService,
  EcgAnalysisService,
  OctAnalysisService,
  EchoAnalysisService,
} from '../services/imaging-ai';

const imagingAi = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
imagingAi.use('/*', authMiddleware);

// ============================================================================
// IMAGING ANALYSIS - Core
// ============================================================================

/**
 * Create new imaging analysis
 */
imagingAi.post('/analysis', requirePermission('imaging', 'write'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    const analysis = await ImagingService.createAnalysis(
      c.env,
      user.organizationId,
      user.id,
      body
    );

    return c.json({ success: true, data: analysis }, 201);
  } catch (error: any) {
    console.error('Create imaging analysis error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

/**
 * List imaging analyses
 */
imagingAi.get('/analysis', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');
    const { modality, status, patientId, page, limit } = c.req.query();

    const result = await ImagingService.list(
      c.env,
      user.organizationId,
      {
        modality,
        status,
        patientId,
      },
      parseInt(page || '1'),
      parseInt(limit || '20')
    );

    return c.json({ success: true, ...result });
  } catch (error: any) {
    console.error('List imaging analyses error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get imaging analysis by ID
 */
imagingAi.get('/analysis/:id', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();

    const analysis = await ImagingService.getById(c.env, user.organizationId, id);
    if (!analysis) {
      return c.json({ success: false, error: 'Imaging analysis not found' }, 404);
    }

    return c.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error('Get imaging analysis error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Start AI analysis
 */
imagingAi.post('/analysis/:id/analyze', requirePermission('imaging', 'write'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();

    // Get analysis record
    const analysis = await ImagingService.getById(c.env, user.organizationId, id);
    if (!analysis) {
      return c.json({ success: false, error: 'Imaging analysis not found' }, 404);
    }

    // Mark as processing
    await ImagingService.startAnalysis(c.env, user.organizationId, id);

    // Run appropriate AI analysis based on modality
    let aiFindings: any = null;
    let modalityAnalysis: any = null;

    try {
      switch (analysis.modality) {
        case 'ecg':
          modalityAnalysis = await EcgAnalysisService.getByImagingId(c.env, user.organizationId, id);
          if (!modalityAnalysis) {
            modalityAnalysis = await EcgAnalysisService.create(c.env, user.organizationId, {
              imagingAnalysisId: id,
            });
          }
          aiFindings = await EcgAnalysisService.analyzeEcg(
            c.env,
            user.organizationId,
            id,
            analysis.studyType || 'standard_12_lead',
            analysis.imageUrl || ''
          );
          await EcgAnalysisService.updateWithFindings(c.env, user.organizationId, modalityAnalysis.id, aiFindings);
          break;

        case 'oct':
          modalityAnalysis = await OctAnalysisService.getByImagingId(c.env, user.organizationId, id);
          if (!modalityAnalysis) {
            modalityAnalysis = await OctAnalysisService.create(c.env, user.organizationId, {
              imagingAnalysisId: id,
            });
          }
          aiFindings = await OctAnalysisService.analyzeOct(
            c.env,
            user.organizationId,
            id,
            analysis.studyType || 'macular_cube',
            analysis.imageUrl || ''
          );
          await OctAnalysisService.updateWithFindings(c.env, user.organizationId, modalityAnalysis.id, aiFindings);
          break;

        case 'echo':
          modalityAnalysis = await EchoAnalysisService.getByImagingId(c.env, user.organizationId, id);
          if (!modalityAnalysis) {
            modalityAnalysis = await EchoAnalysisService.create(c.env, user.organizationId, {
              imagingAnalysisId: id,
            });
          }
          aiFindings = await EchoAnalysisService.analyzeEcho(
            c.env,
            user.organizationId,
            id,
            analysis.studyType || 'tte',
            analysis.imageUrl || ''
          );
          await EchoAnalysisService.updateWithFindings(c.env, user.organizationId, modalityAnalysis.id, aiFindings);
          break;

        default:
          throw new Error(`Unsupported modality: ${analysis.modality}`);
      }

      // Complete analysis
      const completed = await ImagingService.completeAnalysis(
        c.env,
        user.organizationId,
        id,
        aiFindings.aiSummary || 'Analysis complete',
        aiFindings.majorFindings || [],
        aiFindings.recommendations || [],
        aiFindings.urgencyScore || 1
      );

      return c.json({
        success: true,
        data: {
          analysis: completed,
          aiFindings,
          modalityAnalysis,
        },
      });
    } catch (aiError: any) {
      await ImagingService.failAnalysis(c.env, user.organizationId, id, aiError.message);
      throw aiError;
    }
  } catch (error: any) {
    console.error('AI analysis error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Submit physician review
 */
imagingAi.post('/analysis/:id/review', requirePermission('imaging', 'write'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const body = await c.req.json();

    const analysis = await ImagingService.submitReview(
      c.env,
      user.organizationId,
      id,
      user.id,
      body.findings,
      body.impression,
      body.recommendations,
      body.agreesWithAi
    );

    return c.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error('Submit review error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Sign/finalize analysis
 */
imagingAi.post('/analysis/:id/sign', requirePermission('imaging', 'write'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();

    const analysis = await ImagingService.signAnalysis(c.env, user.organizationId, id, user.id);
    return c.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error('Sign analysis error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get urgent reviews
 */
imagingAi.get('/urgent', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');
    const { limit } = c.req.query();

    const analyses = await ImagingService.getUrgentReviews(
      c.env,
      user.organizationId,
      parseInt(limit || '20')
    );

    return c.json({ success: true, data: analyses });
  } catch (error: any) {
    console.error('Get urgent reviews error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get patient imaging history
 */
imagingAi.get('/patient/:patientId/history', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');
    const { patientId } = c.req.param();
    const { modality, limit } = c.req.query();

    const analyses = await ImagingService.getPatientHistory(
      c.env,
      user.organizationId,
      patientId,
      modality,
      parseInt(limit || '20')
    );

    return c.json({ success: true, data: analyses });
  } catch (error: any) {
    console.error('Get patient history error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Compare with previous
 */
imagingAi.get('/analysis/:id/compare/:previousId', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');
    const { id, previousId } = c.req.param();

    const comparison = await ImagingService.compareWithPrevious(
      c.env,
      user.organizationId,
      id,
      previousId
    );

    return c.json({ success: true, data: comparison });
  } catch (error: any) {
    console.error('Compare analyses error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get dashboard statistics
 */
imagingAi.get('/dashboard/stats', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');

    const stats = await ImagingService.getDashboardStats(c.env, user.organizationId);
    return c.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Get dashboard stats error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// ECG Analysis
// ============================================================================

/**
 * Get ECG analysis by imaging ID
 */
imagingAi.get('/ecg/:imagingId', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');
    const { imagingId } = c.req.param();

    const analysis = await EcgAnalysisService.getByImagingId(c.env, user.organizationId, imagingId);
    if (!analysis) {
      return c.json({ success: false, error: 'ECG analysis not found' }, 404);
    }

    return c.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error('Get ECG analysis error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get patient ECG history
 */
imagingAi.get('/ecg/patient/:patientId/history', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');
    const { patientId } = c.req.param();
    const { limit } = c.req.query();

    const analyses = await EcgAnalysisService.getPatientHistory(
      c.env,
      user.organizationId,
      patientId,
      parseInt(limit || '20')
    );

    return c.json({ success: true, data: analyses });
  } catch (error: any) {
    console.error('Get patient ECG history error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Compare ECG with previous
 */
imagingAi.get('/ecg/:id/compare/:previousId', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');
    const { id, previousId } = c.req.param();

    const comparison = await EcgAnalysisService.compareWithPrevious(
      c.env,
      user.organizationId,
      id,
      previousId
    );

    return c.json({ success: true, data: comparison });
  } catch (error: any) {
    console.error('Compare ECG error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// OCT Analysis
// ============================================================================

/**
 * Get OCT analysis by imaging ID
 */
imagingAi.get('/oct/:imagingId', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');
    const { imagingId } = c.req.param();

    const analysis = await OctAnalysisService.getByImagingId(c.env, user.organizationId, imagingId);
    if (!analysis) {
      return c.json({ success: false, error: 'OCT analysis not found' }, 404);
    }

    return c.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error('Get OCT analysis error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get patient OCT progression
 */
imagingAi.get('/oct/patient/:patientId/progression', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');
    const { patientId } = c.req.param();
    const { eye, limit } = c.req.query();

    const progression = await OctAnalysisService.getPatientProgression(
      c.env,
      user.organizationId,
      patientId,
      eye as 'od' | 'os' | undefined,
      parseInt(limit || '10')
    );

    return c.json({ success: true, data: progression });
  } catch (error: any) {
    console.error('Get OCT progression error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Calculate OCT progression
 */
imagingAi.post('/oct/:id/progression/:previousId', requirePermission('imaging', 'write'), async (c) => {
  try {
    const user = c.get('user');
    const { id, previousId } = c.req.param();

    const progression = await OctAnalysisService.calculateProgression(
      c.env,
      user.organizationId,
      id,
      previousId
    );

    return c.json({ success: true, data: progression });
  } catch (error: any) {
    console.error('Calculate OCT progression error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// Echo Analysis
// ============================================================================

/**
 * Get Echo analysis by imaging ID
 */
imagingAi.get('/echo/:imagingId', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');
    const { imagingId } = c.req.param();

    const analysis = await EchoAnalysisService.getByImagingId(c.env, user.organizationId, imagingId);
    if (!analysis) {
      return c.json({ success: false, error: 'Echo analysis not found' }, 404);
    }

    return c.json({ success: true, data: analysis });
  } catch (error: any) {
    console.error('Get Echo analysis error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get patient Echo history
 */
imagingAi.get('/echo/patient/:patientId/history', requirePermission('imaging', 'read'), async (c) => {
  try {
    const user = c.get('user');
    const { patientId } = c.req.param();
    const { limit } = c.req.query();

    const analyses = await EchoAnalysisService.getPatientHistory(
      c.env,
      user.organizationId,
      patientId,
      parseInt(limit || '20')
    );

    return c.json({ success: true, data: analyses });
  } catch (error: any) {
    console.error('Get patient Echo history error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Calculate Echo change
 */
imagingAi.post('/echo/:id/change/:previousId', requirePermission('imaging', 'write'), async (c) => {
  try {
    const user = c.get('user');
    const { id, previousId } = c.req.param();

    const change = await EchoAnalysisService.calculateChange(
      c.env,
      user.organizationId,
      id,
      previousId
    );

    return c.json({ success: true, data: change });
  } catch (error: any) {
    console.error('Calculate Echo change error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// Reports
// ============================================================================

/**
 * Create imaging report
 */
imagingAi.post('/analysis/:id/report', requirePermission('imaging', 'write'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const body = await c.req.json();

    const report = await ImagingService.createReport(
      c.env,
      user.organizationId,
      id,
      user.id,
      body.reportType,
      body.reportContent,
      body.findings,
      body.impression,
      body.recommendations
    );

    return c.json({ success: true, data: report }, 201);
  } catch (error: any) {
    console.error('Create report error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

/**
 * Sign imaging report
 */
imagingAi.post('/reports/:reportId/sign', requirePermission('imaging', 'write'), async (c) => {
  try {
    const user = c.get('user');
    const { reportId } = c.req.param();

    const report = await ImagingService.signReport(c.env, user.organizationId, reportId, user.id);
    return c.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Sign report error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default imagingAi;
