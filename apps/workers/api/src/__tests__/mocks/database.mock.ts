/**
 * Database Mocks
 * Mock D1 database for testing
 */

import { vi } from 'vitest';

export interface MockD1Result {
  results: any[];
  success: boolean;
  meta: {
    changes: number;
    last_row_id: number;
    duration: number;
  };
}

export const createMockD1Database = () => {
  const createStatement = () => {
    const stmt: any = {
      bind: vi.fn().mockReturnThis(),
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ success: true, meta: { changes: 1 } }),
      // Additional methods required by Drizzle ORM
      raw: vi.fn().mockResolvedValue([]),
    };
    stmt.bind = vi.fn().mockReturnValue(stmt);
    return stmt;
  };

  const mockPrepare = vi.fn().mockImplementation(() => createStatement());
  const mockExec = vi.fn().mockResolvedValue({ results: [] });
  const mockBatch = vi.fn().mockResolvedValue([]);
  const mockDump = vi.fn().mockResolvedValue(new ArrayBuffer(0));

  return {
    prepare: mockPrepare,
    exec: mockExec,
    batch: mockBatch,
    dump: mockDump,
  } as unknown as D1Database;
};

export const createMockKVNamespace = () => {
  const store = new Map<string, string>();

  return {
    get: vi.fn().mockImplementation((key: string) => {
      return Promise.resolve(store.get(key) || null);
    }),
    put: vi.fn().mockImplementation((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    delete: vi.fn().mockImplementation((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    list: vi.fn().mockResolvedValue({ keys: [], list_complete: true, cursor: '' }),
    getWithMetadata: vi.fn().mockResolvedValue({ value: null, metadata: null }),
  } as unknown as KVNamespace;
};

export const createMockEnv = () => ({
  DB: createMockD1Database(),
  KV: createMockKVNamespace(),
  SESSIONS: createMockKVNamespace(),
  JWT_SECRET: 'test-jwt-secret',
  JWT_REFRESH_SECRET: 'test-refresh-secret',
  ENVIRONMENT: 'test',
});
