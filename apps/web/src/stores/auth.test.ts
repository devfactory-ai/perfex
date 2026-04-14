import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAuthStore } from './auth';

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
  getErrorMessage: vi.fn((error) => {
    if (error?.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    return 'An error occurred';
  }),
}));

import { api } from '@/lib/api';

describe('useAuthStore', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset the store
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      organizationId: 'org-123',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    it('should login successfully and store tokens', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          data: {
            user: mockUser,
            tokens: mockTokens,
          },
        },
      });

      const { login } = useAuthStore.getState();

      await act(async () => {
        await login({ email: 'test@example.com', password: 'password123' });
      });

      const state = useAuthStore.getState();

      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();

      expect(localStorage.getItem('accessToken')).toBe(mockTokens.accessToken);
      expect(localStorage.getItem('refreshToken')).toBe(mockTokens.refreshToken);
      expect(localStorage.getItem('organizationId')).toBe(mockUser.organizationId);
    });

    it('should set loading state during login', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.mocked(api.post).mockReturnValueOnce(promise as any);

      const { login } = useAuthStore.getState();

      // Start login without awaiting
      const loginPromise = login({ email: 'test@example.com', password: 'password123' });

      // Check loading state
      await waitFor(() => {
        expect(useAuthStore.getState().isLoading).toBe(true);
      });

      // Resolve the promise
      resolvePromise!({
        data: {
          data: {
            user: mockUser,
            tokens: mockTokens,
          },
        },
      });

      await loginPromise;

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should handle login error', async () => {
      const mockError = {
        response: {
          data: {
            error: {
              message: 'Invalid credentials',
            },
          },
        },
      };

      vi.mocked(api.post).mockRejectedValueOnce(mockError);

      const { login } = useAuthStore.getState();

      await expect(
        login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toEqual(mockError);

      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });
  });

  describe('register', () => {
    const mockUser = {
      id: 'user-123',
      email: 'new@example.com',
      name: 'New User',
      role: 'user',
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockTokens = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };

    it('should register successfully', async () => {
      vi.mocked(api.post).mockResolvedValueOnce({
        data: {
          data: {
            user: mockUser,
            tokens: mockTokens,
          },
        },
      });

      const { register } = useAuthStore.getState();

      await act(async () => {
        await register({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        });
      });

      const state = useAuthStore.getState();

      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(localStorage.getItem('accessToken')).toBe(mockTokens.accessToken);
    });
  });

  describe('logout', () => {
    it('should clear auth state and tokens on logout', async () => {
      // Setup initial logged-in state
      localStorage.setItem('accessToken', 'token');
      localStorage.setItem('refreshToken', 'refresh');
      localStorage.setItem('organizationId', 'org-123');

      useAuthStore.setState({
        user: { id: 'user-123', email: 'test@example.com' } as any,
        isAuthenticated: true,
      });

      vi.mocked(api.post).mockResolvedValueOnce({ data: {} });

      const { logout } = useAuthStore.getState();

      await act(async () => {
        await logout();
      });

      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
      expect(localStorage.getItem('organizationId')).toBeNull();
    });

    it('should clear state even if API call fails', async () => {
      localStorage.setItem('accessToken', 'token');

      useAuthStore.setState({
        user: { id: 'user-123' } as any,
        isAuthenticated: true,
      });

      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'));

      const { logout } = useAuthStore.getState();

      await act(async () => {
        await logout();
      });

      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('loadUser', () => {
    it('should load user when access token exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      localStorage.setItem('accessToken', 'valid-token');

      vi.mocked(api.get).mockResolvedValueOnce({
        data: { data: mockUser },
      });

      const { loadUser } = useAuthStore.getState();

      await act(async () => {
        await loadUser();
      });

      const state = useAuthStore.getState();

      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should not load user when no access token', async () => {
      const { loadUser } = useAuthStore.getState();

      await act(async () => {
        await loadUser();
      });

      const state = useAuthStore.getState();

      expect(state.isAuthenticated).toBe(false);
      expect(api.get).not.toHaveBeenCalled();
    });

    it('should clear state when token is invalid', async () => {
      localStorage.setItem('accessToken', 'invalid-token');

      vi.mocked(api.get).mockRejectedValueOnce({
        response: { status: 401 },
      });

      const { loadUser } = useAuthStore.getState();

      await act(async () => {
        await loadUser();
      });

      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const initialUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      const updatedUser = {
        ...initialUser,
        name: 'Updated Name',
      };

      useAuthStore.setState({
        user: initialUser as any,
        isAuthenticated: true,
      });

      vi.mocked(api.put).mockResolvedValueOnce({
        data: { data: updatedUser },
      });

      const { updateProfile } = useAuthStore.getState();

      await act(async () => {
        await updateProfile({ name: 'Updated Name' });
      });

      const state = useAuthStore.getState();

      expect(state.user?.name).toBe('Updated Name');
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      useAuthStore.setState({ error: 'Some error' });

      const { clearError } = useAuthStore.getState();

      act(() => {
        clearError();
      });

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});
