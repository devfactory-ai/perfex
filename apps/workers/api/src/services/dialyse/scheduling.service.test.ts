/**
 * Dialyse Scheduling Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DialyseSchedulingService, CreateSessionInput } from './scheduling.service';

// Create a more sophisticated mock that handles parallel calls
const createMockStatement = (responses: { first?: any; all?: { results: any[] } }) => ({
  bind: vi.fn().mockReturnThis(),
  first: vi.fn().mockResolvedValue(responses.first ?? null),
  all: vi.fn().mockResolvedValue(responses.all ?? { results: [] }),
  run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
});

const createMockD1 = (queryResponses: Map<string, { first?: any; all?: { results: any[] } }>) => {
  const prepare = vi.fn().mockImplementation((sql: string) => {
    // Find matching response based on SQL pattern
    for (const [pattern, response] of queryResponses.entries()) {
      if (sql.includes(pattern)) {
        return createMockStatement(response);
      }
    }
    return createMockStatement({});
  });

  return { prepare } as unknown as D1Database;
};

describe('DialyseSchedulingService', () => {
  describe('validateSession', () => {
    const createValidSessionInput = (): CreateSessionInput => ({
      patientId: 'patient-001',
      machineId: 'machine-001',
      staffId: 'staff-001',
      startTime: new Date('2024-02-01T08:00:00Z'),
      duration: 240, // 4 hours
      sessionType: 'hemodialysis',
    });

    it('should validate a session with all requirements met', async () => {
      const queryResponses = new Map([
        ['dialyse_machines', {
          first: { id: 'machine-001', name: 'Machine 1', status: 'active' },
          all: { results: [] }, // No overlapping sessions
        }],
        ['dialyse_staff', {
          first: { id: 'staff-001', first_name: 'Jean', last_name: 'Dupont', status: 'active' },
          all: { results: [] }, // No overlapping sessions
        }],
        ['dialyse_sessions', {
          all: { results: [] }, // No existing sessions for patient
        }],
        ['dialyse_maintenance', {
          all: { results: [] }, // No maintenance scheduled
        }],
        ['vascular_accesses', {
          first: { id: 'access-001', type: 'fav', status: 'active' },
        }],
        ['dialyse_prescriptions', {
          first: { id: 'rx-001', sessions_per_week: 3, session_duration: 240 },
        }],
      ]);

      const mockDb = createMockD1(queryResponses);
      const service = new DialyseSchedulingService(mockDb);

      const result = await service.validateSession('org-001', createValidSessionInput());

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject session when machine is not found', async () => {
      const queryResponses = new Map([
        ['dialyse_machines', {
          first: null, // Machine not found
          all: { results: [] },
        }],
        ['dialyse_staff', {
          first: { id: 'staff-001', first_name: 'Jean', last_name: 'Dupont', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_sessions', { all: { results: [] } }],
        ['dialyse_maintenance', { all: { results: [] } }],
        ['vascular_accesses', { first: { id: 'access-001', type: 'fav', status: 'active' } }],
        ['dialyse_prescriptions', { first: { id: 'rx-001', sessions_per_week: 3, session_duration: 240 } }],
      ]);

      const mockDb = createMockD1(queryResponses);
      const service = new DialyseSchedulingService(mockDb);

      const result = await service.validateSession('org-001', createValidSessionInput());

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Machine non trouvee');
    });

    it('should reject session when machine status is not active', async () => {
      const queryResponses = new Map([
        ['dialyse_machines', {
          first: { id: 'machine-001', name: 'Machine 1', status: 'maintenance' },
          all: { results: [] },
        }],
        ['dialyse_staff', {
          first: { id: 'staff-001', first_name: 'Jean', last_name: 'Dupont', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_sessions', { all: { results: [] } }],
        ['dialyse_maintenance', { all: { results: [] } }],
        ['vascular_accesses', { first: { id: 'access-001', type: 'fav', status: 'active' } }],
        ['dialyse_prescriptions', { first: { id: 'rx-001', sessions_per_week: 3, session_duration: 240 } }],
      ]);

      const mockDb = createMockD1(queryResponses);
      const service = new DialyseSchedulingService(mockDb);

      const result = await service.validateSession('org-001', createValidSessionInput());

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('pas active'))).toBe(true);
    });

    it('should reject session when patient has no vascular access', async () => {
      const queryResponses = new Map([
        ['dialyse_machines', {
          first: { id: 'machine-001', name: 'Machine 1', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_staff', {
          first: { id: 'staff-001', first_name: 'Jean', last_name: 'Dupont', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_sessions', { all: { results: [] } }],
        ['dialyse_maintenance', { all: { results: [] } }],
        ['vascular_accesses', { first: null }], // No vascular access
        ['dialyse_prescriptions', { first: { id: 'rx-001', sessions_per_week: 3, session_duration: 240 } }],
      ]);

      const mockDb = createMockD1(queryResponses);
      const service = new DialyseSchedulingService(mockDb);

      const result = await service.validateSession('org-001', createValidSessionInput());

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('acces vasculaire'))).toBe(true);
    });

    it('should reject session when patient has no active prescription', async () => {
      const queryResponses = new Map([
        ['dialyse_machines', {
          first: { id: 'machine-001', name: 'Machine 1', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_staff', {
          first: { id: 'staff-001', first_name: 'Jean', last_name: 'Dupont', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_sessions', { all: { results: [] } }],
        ['dialyse_maintenance', { all: { results: [] } }],
        ['vascular_accesses', { first: { id: 'access-001', type: 'fav', status: 'active' } }],
        ['dialyse_prescriptions', { first: null }], // No prescription
      ]);

      const mockDb = createMockD1(queryResponses);
      const service = new DialyseSchedulingService(mockDb);

      const result = await service.validateSession('org-001', createValidSessionInput());

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('prescription active'))).toBe(true);
    });

    it('should warn when session duration differs from prescription', async () => {
      const queryResponses = new Map([
        ['dialyse_machines', {
          first: { id: 'machine-001', name: 'Machine 1', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_staff', {
          first: { id: 'staff-001', first_name: 'Jean', last_name: 'Dupont', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_sessions', { all: { results: [] } }],
        ['dialyse_maintenance', { all: { results: [] } }],
        ['vascular_accesses', { first: { id: 'access-001', type: 'fav', status: 'active' } }],
        ['dialyse_prescriptions', { first: { id: 'rx-001', sessions_per_week: 3, session_duration: 180 } }], // Different duration
      ]);

      const mockDb = createMockD1(queryResponses);
      const service = new DialyseSchedulingService(mockDb);

      const input = createValidSessionInput();
      input.duration = 240; // 4 hours vs prescribed 3 hours

      const result = await service.validateSession('org-001', input);

      expect(result.warnings.some(w => w.includes('Duree session') && w.includes('prescription'))).toBe(true);
    });

    it('should reject session starting before 6am', async () => {
      const queryResponses = new Map([
        ['dialyse_machines', {
          first: { id: 'machine-001', name: 'Machine 1', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_staff', {
          first: { id: 'staff-001', first_name: 'Jean', last_name: 'Dupont', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_sessions', { all: { results: [] } }],
        ['dialyse_maintenance', { all: { results: [] } }],
        ['vascular_accesses', { first: { id: 'access-001', type: 'fav', status: 'active' } }],
        ['dialyse_prescriptions', { first: { id: 'rx-001', sessions_per_week: 3, session_duration: 240 } }],
      ]);

      const mockDb = createMockD1(queryResponses);
      const service = new DialyseSchedulingService(mockDb);

      const input = createValidSessionInput();
      input.startTime = new Date('2024-02-01T04:00:00Z'); // 4 AM - too early

      const result = await service.validateSession('org-001', input);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('avant 6h00'))).toBe(true);
    });

    it('should warn for Sunday scheduling', async () => {
      const queryResponses = new Map([
        ['dialyse_machines', {
          first: { id: 'machine-001', name: 'Machine 1', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_staff', {
          first: { id: 'staff-001', first_name: 'Jean', last_name: 'Dupont', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_sessions', { all: { results: [] } }],
        ['dialyse_maintenance', { all: { results: [] } }],
        ['vascular_accesses', { first: { id: 'access-001', type: 'fav', status: 'active' } }],
        ['dialyse_prescriptions', { first: { id: 'rx-001', sessions_per_week: 3, session_duration: 240 } }],
      ]);

      const mockDb = createMockD1(queryResponses);
      const service = new DialyseSchedulingService(mockDb);

      const input = createValidSessionInput();
      // Feb 4, 2024 is a Sunday
      input.startTime = new Date('2024-02-04T10:00:00Z');

      const result = await service.validateSession('org-001', input);

      expect(result.warnings.some(w => w.includes('dimanche'))).toBe(true);
    });

    it('should reject when maintenance is scheduled', async () => {
      const queryResponses = new Map([
        ['dialyse_machines', {
          first: { id: 'machine-001', name: 'Machine 1', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_staff', {
          first: { id: 'staff-001', first_name: 'Jean', last_name: 'Dupont', status: 'active' },
          all: { results: [] },
        }],
        ['dialyse_sessions', { all: { results: [] } }],
        ['dialyse_maintenance', {
          all: {
            results: [{
              id: 'maint-001',
              maintenance_type: 'preventive',
              scheduled_date: '2024-02-01',
              notes: 'Maintenance prevue',
            }],
          },
        }],
        ['vascular_accesses', { first: { id: 'access-001', type: 'fav', status: 'active' } }],
        ['dialyse_prescriptions', { first: { id: 'rx-001', sessions_per_week: 3, session_duration: 240 } }],
      ]);

      const mockDb = createMockD1(queryResponses);
      const service = new DialyseSchedulingService(mockDb);

      const result = await service.validateSession('org-001', createValidSessionInput());

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('maintenance'))).toBe(true);
    });
  });

  describe('findAvailableSlots', () => {
    it('should find available slots for a given date', async () => {
      const queryResponses = new Map([
        ['FROM dialyse_machines', {
          all: {
            results: [
              { id: 'machine-001', name: 'Machine 1' },
              { id: 'machine-002', name: 'Machine 2' },
            ],
          },
        }],
      ]);

      // Create a more specific mock for sessions query per machine
      const mockDb = {
        prepare: vi.fn().mockImplementation((sql: string) => {
          if (sql.includes('FROM dialyse_machines')) {
            return createMockStatement({
              all: {
                results: [
                  { id: 'machine-001', name: 'Machine 1' },
                  { id: 'machine-002', name: 'Machine 2' },
                ],
              },
            });
          }
          if (sql.includes('FROM dialyse_sessions')) {
            return createMockStatement({ all: { results: [] } });
          }
          return createMockStatement({});
        }),
      } as unknown as D1Database;

      const service = new DialyseSchedulingService(mockDb);

      const slots = await service.findAvailableSlots(
        'org-001',
        new Date('2024-02-01'),
        240, // 4 hour sessions
      );

      expect(slots.length).toBeGreaterThan(0);
      // Both machines should have slots since they're empty
      const machineIds = new Set(slots.map(s => s.machineId));
      expect(machineIds.has('machine-001')).toBe(true);
      expect(machineIds.has('machine-002')).toBe(true);
    });
  });
});
