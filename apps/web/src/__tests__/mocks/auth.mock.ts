import { vi } from 'vitest';
import type { User } from '@perfex/shared';

// Mock user data
export const mockUser: User = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
  organizationId: 'org-123',
  isActive: true,
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockAdminUser: User = {
  ...mockUser,
  id: 'admin-123',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin',
};

export const mockManagerUser: User = {
  ...mockUser,
  id: 'manager-123',
  email: 'manager@example.com',
  name: 'Manager User',
  role: 'manager',
};

// Mock auth state
export interface MockAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const mockAuthStateLoggedOut: MockAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

export const mockAuthStateLoading: MockAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const mockAuthStateLoggedIn: MockAuthState = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

export const mockAuthStateAdmin: MockAuthState = {
  user: mockAdminUser,
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

export const mockAuthStateError: MockAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: 'Authentication failed',
};

// Mock auth hook
export const createMockUseAuth = (state: MockAuthState) => ({
  ...state,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  refreshToken: vi.fn(),
  resetPassword: vi.fn(),
  updateProfile: vi.fn(),
});

// Mock auth context value
export const createMockAuthContext = (state: MockAuthState) => ({
  ...createMockUseAuth(state),
  checkAuth: vi.fn(),
  hasRole: vi.fn((role: string) => state.user?.role === role),
  hasPermission: vi.fn(() => true),
});

// Mock JWT tokens
export const mockTokens = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3MDQwNjcyMDAsImV4cCI6MTcwNDA3MDgwMH0.mock-signature',
  refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzA0MDY3MjAwLCJleHAiOjE3MDQ2NzIwMDB9.mock-signature',
  expiredToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMzYwMH0.mock-signature',
};
