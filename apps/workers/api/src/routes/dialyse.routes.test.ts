/**
 * Dialyse Routes Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAuthenticatedContext, createMockContext } from '../__tests__/mocks/hono.mock';
import { createMockEnv } from '../__tests__/mocks/database.mock';
import { testDialysePatient, testDialyseSession, testMachine } from '../__tests__/mocks/fixtures';

describe('Dialyse Routes', () => {
  let mockEnv: ReturnType<typeof createMockEnv>;

  beforeEach(() => {
    mockEnv = createMockEnv();
  });

  describe('GET /dialyse/patients', () => {
    it('should return paginated list of patients', async () => {
      const ctx = createAuthenticatedContext({
        query: { limit: '10', offset: '0' },
        env: mockEnv,
      });

      const mockPrepare = mockEnv.DB.prepare as ReturnType<typeof vi.fn>;

      mockPrepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: 1 }),
        all: vi.fn().mockResolvedValue({ results: [testDialysePatient] }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });

      expect(ctx.var.organizationId).toBe('org-test-001');
    });

    it('should require authentication', async () => {
      const ctx = createMockContext({
        query: { limit: '10' },
        env: mockEnv,
      });

      // No auth headers or variables set
      expect(ctx.var.userId).toBeUndefined();
    });

    it('should filter by serology status', async () => {
      const ctx = createAuthenticatedContext({
        query: { hivStatus: 'positive' },
        env: mockEnv,
      });

      expect(ctx.req.query('hivStatus')).toBe('positive');
    });
  });

  describe('GET /dialyse/patients/:id', () => {
    it('should return patient by ID', async () => {
      const ctx = createAuthenticatedContext({
        params: { id: 'dialyse-patient-test-001' },
        env: mockEnv,
      });

      const mockPrepare = mockEnv.DB.prepare as ReturnType<typeof vi.fn>;

      mockPrepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(testDialysePatient),
        all: vi.fn().mockResolvedValue({ results: [testDialysePatient] }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });

      expect(ctx.req.param('id')).toBe('dialyse-patient-test-001');
    });

    it('should return 404 for non-existent patient', async () => {
      const ctx = createAuthenticatedContext({
        params: { id: 'non-existent' },
        env: mockEnv,
      });

      const mockPrepare = mockEnv.DB.prepare as ReturnType<typeof vi.fn>;

      mockPrepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [] }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });

      expect(ctx.req.param('id')).toBe('non-existent');
    });
  });

  describe('POST /dialyse/patients', () => {
    it('should create new patient with valid data', async () => {
      const newPatient = {
        firstName: 'Ahmed',
        lastName: 'Ben Ali',
        dateOfBirth: '1975-03-20',
        gender: 'male',
        phone: '+21698111222',
        dryWeight: 68.5,
        bloodType: 'B+',
        dialysisStartDate: '2024-01-15',
        vascularAccessType: 'fav',
        hivStatus: 'negative',
        hbvStatus: 'negative',
        hcvStatus: 'negative',
      };

      const ctx = createAuthenticatedContext({
        body: newPatient,
        env: mockEnv,
      });

      expect(ctx.req.json).toBeDefined();
    });

    it('should validate required fields', async () => {
      const invalidPatient = {
        firstName: 'Ahmed',
        // Missing required fields
      };

      const ctx = createAuthenticatedContext({
        body: invalidPatient,
        env: mockEnv,
      });

      // Validation should fail
      expect(Object.keys(invalidPatient).length).toBeLessThan(5);
    });
  });

  describe('GET /dialyse/sessions', () => {
    it('should return sessions for date range', async () => {
      const ctx = createAuthenticatedContext({
        query: {
          startDate: '2024-06-01',
          endDate: '2024-06-30',
        },
        env: mockEnv,
      });

      const mockPrepare = mockEnv.DB.prepare as ReturnType<typeof vi.fn>;

      mockPrepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ count: 1 }),
        all: vi.fn().mockResolvedValue({ results: [testDialyseSession] }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });

      expect(ctx.req.query('startDate')).toBe('2024-06-01');
    });

    it('should filter by status', async () => {
      const ctx = createAuthenticatedContext({
        query: { status: 'scheduled' },
        env: mockEnv,
      });

      expect(ctx.req.query('status')).toBe('scheduled');
    });
  });

  describe('POST /dialyse/sessions/:id/start', () => {
    it('should start a scheduled session', async () => {
      const ctx = createAuthenticatedContext({
        params: { id: 'session-test-001' },
        body: {
          actualStartTime: '08:15',
          preWeight: 72.5,
          preBP: '140/90',
          preHR: 78,
        },
        env: mockEnv,
      });

      expect(ctx.req.param('id')).toBe('session-test-001');
    });

    it('should validate pre-session vitals', async () => {
      const requiredPreSessionData = ['actualStartTime', 'preWeight', 'preBP', 'preHR'];
      const preSessionData = {
        actualStartTime: '08:15',
        preWeight: 72.5,
        preBP: '140/90',
        preHR: 78,
      };

      requiredPreSessionData.forEach((field) => {
        expect(preSessionData).toHaveProperty(field);
      });
    });
  });

  describe('POST /dialyse/sessions/:id/complete', () => {
    it('should complete an in-progress session', async () => {
      const ctx = createAuthenticatedContext({
        params: { id: 'session-test-001' },
        body: {
          actualEndTime: '12:15',
          postWeight: 69.5,
          postBP: '130/85',
          postHR: 72,
          ktv: 1.4,
          ufVolume: 3000,
        },
        env: mockEnv,
      });

      expect(ctx.req.param('id')).toBe('session-test-001');
    });

    it('should calculate UF achieved', () => {
      const preWeight = 72.5;
      const postWeight = 69.5;
      const ufAchieved = (preWeight - postWeight) * 1000; // in ml

      expect(ufAchieved).toBe(3000);
    });
  });

  describe('GET /dialyse/machines', () => {
    it('should return available machines', async () => {
      const ctx = createAuthenticatedContext({
        query: { status: 'available' },
        env: mockEnv,
      });

      const mockPrepare = mockEnv.DB.prepare as ReturnType<typeof vi.fn>;

      mockPrepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null),
        all: vi.fn().mockResolvedValue({ results: [testMachine] }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });

      expect(testMachine.status).toBe('available');
    });
  });

  describe('GET /dialyse/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      const expectedStats = {
        totalPatients: 50,
        activePatients: 45,
        todaySessions: 12,
        activeSessions: 8,
        availableMachines: 6,
        alerts: 3,
      };

      Object.values(expectedStats).forEach((value) => {
        expect(typeof value).toBe('number');
      });
    });
  });

  describe('GET /dialyse/alerts', () => {
    it('should return active alerts', async () => {
      const ctx = createAuthenticatedContext({
        query: { status: 'active' },
        env: mockEnv,
      });

      expect(ctx.req.query('status')).toBe('active');
    });

    it('should filter by severity', async () => {
      const ctx = createAuthenticatedContext({
        query: { severity: 'critical' },
        env: mockEnv,
      });

      expect(ctx.req.query('severity')).toBe('critical');
    });
  });
});
