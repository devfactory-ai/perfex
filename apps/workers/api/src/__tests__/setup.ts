/**
 * Test Setup Configuration
 * Global setup for all tests
 */

import { beforeAll, afterAll, afterEach, vi } from 'vitest';
import { webcrypto } from 'crypto';

// Mock crypto for Node.js test environment BEFORE other imports
vi.stubGlobal('crypto', {
  ...webcrypto,
  randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(7),
  getRandomValues: (arr: Uint8Array) => webcrypto.getRandomValues(arr),
  subtle: webcrypto.subtle,
});

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';

// Global test setup
beforeAll(() => {
  // Setup any global test fixtures
});

afterAll(() => {
  // Cleanup global fixtures
});

afterEach(() => {
  // Reset all mocks after each test
  vi.clearAllMocks();
});

