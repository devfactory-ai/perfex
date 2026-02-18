/**
 * Population Health Routes
 * Predictive analytics and population health management endpoints
 */

import { Hono } from 'hono';
import { requireAuth, requirePermission } from '../middleware/auth';
import {
  RiskScoreService,
  CohortService,
  QualityIndicatorsService,
} from '../services/population-health';
import type { Env } from '../types';

const populationHealth = new Hono<{ Bindings: Env }>();

// Apply auth middleware to all routes
populationHealth.use('/*', requireAuth);

// ============================================================================
// RISK MODELS & SCORES
// ============================================================================

/**
 * Create risk model
 */
populationHealth.post('/risk-models', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    const model = await RiskScoreService.createModel(
      c.env,
      c.get('realOrganizationId')!,
      user.id,
      body
    );

    return c.json({ success: true, data: model }, 201);
  } catch (error: any) {
    console.error('Create risk model error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

/**
 * List risk models
 */
populationHealth.get('/risk-models', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { status, module } = c.req.query();

    const models = await RiskScoreService.listModels(
      c.env,
      c.get('realOrganizationId')!,
      status,
      module
    );

    return c.json({ success: true, data: models });
  } catch (error: any) {
    console.error('List risk models error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get risk model by ID
 */
populationHealth.get('/risk-models/:id', requirePermission('analytics:read'), async (c) => {
  try {
    const { id } = c.req.param();

    const model = await RiskScoreService.getModelById(c.env, id);
    if (!model) {
      return c.json({ success: false, error: 'Risk model not found' }, 404);
    }

    return c.json({ success: true, data: model });
  } catch (error: any) {
    console.error('Get risk model error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Activate risk model
 */
populationHealth.post('/risk-models/:id/activate', requirePermission('analytics:write'), async (c) => {
  try {
    const { id } = c.req.param();

    const model = await RiskScoreService.activateModel(c.env, id);
    return c.json({ success: true, data: model });
  } catch (error: any) {
    console.error('Activate model error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get model performance metrics
 */
populationHealth.get('/risk-models/:id/performance', requirePermission('analytics:read'), async (c) => {
  try {
    const { id } = c.req.param();

    const performance = await RiskScoreService.getModelPerformance(c.env, id);
    return c.json({ success: true, data: performance });
  } catch (error: any) {
    console.error('Get model performance error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Calculate risk score for patient
 */
populationHealth.post('/risk-scores/calculate', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    const score = await RiskScoreService.calculateRiskScore(
      c.env,
      c.get('realOrganizationId')!,
      body.patientId,
      body.modelId
    );

    return c.json({ success: true, data: score }, 201);
  } catch (error: any) {
    console.error('Calculate risk score error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

/**
 * Get patient risk scores
 */
populationHealth.get('/risk-scores/patient/:patientId', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { patientId } = c.req.param();
    const { limit } = c.req.query();

    const scores = await RiskScoreService.getPatientScores(
      c.env,
      c.get('realOrganizationId')!,
      patientId,
      parseInt(limit || '20')
    );

    return c.json({ success: true, data: scores });
  } catch (error: any) {
    console.error('Get patient scores error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get high risk patients
 */
populationHealth.get('/risk-scores/high-risk', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { modelId, limit } = c.req.query();

    const patients = await RiskScoreService.getHighRiskPatients(
      c.env,
      c.get('realOrganizationId')!,
      modelId,
      parseInt(limit || '50')
    );

    return c.json({ success: true, data: patients });
  } catch (error: any) {
    console.error('Get high risk patients error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get risk distribution
 */
populationHealth.get('/risk-scores/distribution/:modelId', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { modelId } = c.req.param();

    const distribution = await RiskScoreService.getRiskDistribution(
      c.env,
      c.get('realOrganizationId')!,
      modelId
    );

    return c.json({ success: true, data: distribution });
  } catch (error: any) {
    console.error('Get risk distribution error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Record outcome for validation
 */
populationHealth.post('/risk-scores/:scoreId/outcome', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const { scoreId } = c.req.param();
    const body = await c.req.json();

    const updated = await RiskScoreService.recordOutcome(
      c.env,
      c.get('realOrganizationId')!,
      scoreId,
      body
    );

    return c.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Record outcome error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// COHORTS
// ============================================================================

/**
 * Create cohort
 */
populationHealth.post('/cohorts', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    const cohort = await CohortService.create(
      c.env,
      c.get('realOrganizationId')!,
      user.id,
      body
    );

    return c.json({ success: true, data: cohort }, 201);
  } catch (error: any) {
    console.error('Create cohort error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

/**
 * List cohorts
 */
populationHealth.get('/cohorts', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { cohortType, module, page, limit } = c.req.query();

    const result = await CohortService.list(
      c.env,
      c.get('realOrganizationId')!,
      cohortType,
      module,
      parseInt(page || '1'),
      parseInt(limit || '20')
    );

    return c.json({ success: true, ...result });
  } catch (error: any) {
    console.error('List cohorts error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get cohort by ID
 */
populationHealth.get('/cohorts/:id', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();

    const cohort = await CohortService.getById(c.env, c.get('realOrganizationId')!, id);
    if (!cohort) {
      return c.json({ success: false, error: 'Cohort not found' }, 404);
    }

    return c.json({ success: true, data: cohort });
  } catch (error: any) {
    console.error('Get cohort error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Update cohort
 */
populationHealth.put('/cohorts/:id', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const body = await c.req.json();

    const cohort = await CohortService.update(c.env, c.get('realOrganizationId')!, id, body);
    return c.json({ success: true, data: cohort });
  } catch (error: any) {
    console.error('Update cohort error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Refresh cohort membership
 */
populationHealth.post('/cohorts/:id/refresh', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();

    const result = await CohortService.refreshCohort(c.env, c.get('realOrganizationId')!, id);
    return c.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Refresh cohort error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get cohort members
 */
populationHealth.get('/cohorts/:id/members', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const { page, limit } = c.req.query();

    const result = await CohortService.getMembers(
      c.env,
      c.get('realOrganizationId')!,
      id,
      parseInt(page || '1'),
      parseInt(limit || '50')
    );

    return c.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Get cohort members error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Add member to cohort
 */
populationHealth.post('/cohorts/:id/members', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const body = await c.req.json();

    const membership = await CohortService.addMember(
      c.env,
      c.get('realOrganizationId')!,
      id,
      body.patientId,
      user.id
    );

    return c.json({ success: true, data: membership }, 201);
  } catch (error: any) {
    console.error('Add cohort member error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

/**
 * Remove member from cohort
 */
populationHealth.delete('/cohorts/:id/members/:patientId', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const { id, patientId } = c.req.param();
    const { reason } = c.req.query();

    await CohortService.removeMember(c.env, c.get('realOrganizationId')!, id, patientId, reason);
    return c.json({ success: true });
  } catch (error: any) {
    console.error('Remove cohort member error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Create cohort snapshot
 */
populationHealth.post('/cohorts/:id/snapshot', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();

    const snapshot = await CohortService.createSnapshot(c.env, c.get('realOrganizationId')!, id, 'manual');
    return c.json({ success: true, data: snapshot }, 201);
  } catch (error: any) {
    console.error('Create snapshot error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get cohort snapshots
 */
populationHealth.get('/cohorts/:id/snapshots', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const { limit } = c.req.query();

    const snapshots = await CohortService.getSnapshots(
      c.env,
      c.get('realOrganizationId')!,
      id,
      parseInt(limit || '20')
    );

    return c.json({ success: true, data: snapshots });
  } catch (error: any) {
    console.error('Get snapshots error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get patient cohorts
 */
populationHealth.get('/patient/:patientId/cohorts', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { patientId } = c.req.param();

    const cohorts = await CohortService.getPatientCohorts(
      c.env,
      c.get('realOrganizationId')!,
      patientId
    );

    return c.json({ success: true, data: cohorts });
  } catch (error: any) {
    console.error('Get patient cohorts error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// QUALITY INDICATORS (IQSS)
// ============================================================================

/**
 * Create quality indicator
 */
populationHealth.post('/quality-indicators', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    const indicator = await QualityIndicatorsService.createIndicator(
      c.env,
      c.get('realOrganizationId')!,
      user.id,
      body
    );

    return c.json({ success: true, data: indicator }, 201);
  } catch (error: any) {
    console.error('Create indicator error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

/**
 * List quality indicators
 */
populationHealth.get('/quality-indicators', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { source, module, category } = c.req.query();

    const indicators = await QualityIndicatorsService.listIndicators(
      c.env,
      c.get('realOrganizationId')!,
      source,
      module,
      category
    );

    return c.json({ success: true, data: indicators });
  } catch (error: any) {
    console.error('List indicators error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get quality indicator by ID
 */
populationHealth.get('/quality-indicators/:id', requirePermission('analytics:read'), async (c) => {
  try {
    const { id } = c.req.param();

    const indicator = await QualityIndicatorsService.getIndicatorById(c.env, id);
    if (!indicator) {
      return c.json({ success: false, error: 'Indicator not found' }, 404);
    }

    return c.json({ success: true, data: indicator });
  } catch (error: any) {
    console.error('Get indicator error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Record measurement for indicator
 */
populationHealth.post('/quality-indicators/:id/measurements', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const body = await c.req.json();

    const measurement = await QualityIndicatorsService.recordMeasurement(
      c.env,
      c.get('realOrganizationId')!,
      id,
      {
        measurementPeriod: body.measurementPeriod,
        periodStart: new Date(body.periodStart),
        periodEnd: new Date(body.periodEnd),
        numerator: body.numerator,
        denominator: body.denominator,
        excludedCount: body.excludedCount,
      }
    );

    return c.json({ success: true, data: measurement }, 201);
  } catch (error: any) {
    console.error('Record measurement error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

/**
 * Get indicator measurements
 */
populationHealth.get('/quality-indicators/:id/measurements', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const { limit } = c.req.query();

    const measurements = await QualityIndicatorsService.getIndicatorMeasurements(
      c.env,
      c.get('realOrganizationId')!,
      id,
      parseInt(limit || '12')
    );

    return c.json({ success: true, data: measurements });
  } catch (error: any) {
    console.error('Get measurements error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get indicator trends
 */
populationHealth.get('/quality-indicators/:id/trends', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();
    const { periods } = c.req.query();

    const trends = await QualityIndicatorsService.getIndicatorTrends(
      c.env,
      c.get('realOrganizationId')!,
      id,
      parseInt(periods || '12')
    );

    return c.json({ success: true, data: trends });
  } catch (error: any) {
    console.error('Get trends error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Validate measurement
 */
populationHealth.post('/measurements/:measurementId/validate', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const { measurementId } = c.req.param();
    const body = await c.req.json();

    const measurement = await QualityIndicatorsService.validateMeasurement(
      c.env,
      c.get('realOrganizationId')!,
      measurementId,
      user.id,
      body.notes
    );

    return c.json({ success: true, data: measurement });
  } catch (error: any) {
    console.error('Validate measurement error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Get quality dashboard summary
 */
populationHealth.get('/quality-dashboard', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { module } = c.req.query();

    const summary = await QualityIndicatorsService.getDashboardSummary(
      c.env,
      c.get('realOrganizationId')!,
      module
    );

    return c.json({ success: true, data: summary });
  } catch (error: any) {
    console.error('Get dashboard summary error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// ============================================================================
// IQSS REPORTS
// ============================================================================

/**
 * Create IQSS report
 */
populationHealth.post('/iqss-reports', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const body = await c.req.json();

    const report = await QualityIndicatorsService.createIqssReport(
      c.env,
      c.get('realOrganizationId')!,
      user.id,
      body.reportYear,
      body.reportType
    );

    return c.json({ success: true, data: report }, 201);
  } catch (error: any) {
    console.error('Create IQSS report error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

/**
 * Get IQSS report
 */
populationHealth.get('/iqss-reports/:year/:type', requirePermission('analytics:read'), async (c) => {
  try {
    const user = c.get('user');
    const { year, type } = c.req.param();

    const report = await QualityIndicatorsService.getIqssReport(
      c.env,
      c.get('realOrganizationId')!,
      parseInt(year),
      type
    );

    if (!report) {
      return c.json({ success: false, error: 'IQSS report not found' }, 404);
    }

    return c.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Get IQSS report error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

/**
 * Submit IQSS report
 */
populationHealth.post('/iqss-reports/:id/submit', requirePermission('analytics:write'), async (c) => {
  try {
    const user = c.get('user');
    const { id } = c.req.param();

    const report = await QualityIndicatorsService.submitIqssReport(
      c.env,
      c.get('realOrganizationId')!,
      id,
      user.id
    );

    return c.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Submit IQSS report error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default populationHealth;
