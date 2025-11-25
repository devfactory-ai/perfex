/**
 * Auth Store
 * Global authentication state management with Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import type {
  SafeUser,
  AuthResponse,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from '@perfex/shared';

interface AuthState {
  user: SafeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  updateProfile: (data: UpdateProfileInput) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginInput) => {
    console.log('[AUTH] Login started', { email: credentials.email });
    try {
      set({ isLoading: true, error: null });

      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      console.log('[AUTH] Login response received', { status: response.status, hasData: !!response.data });

      const { user, tokens } = response.data.data;
      console.log('[AUTH] Login data parsed', { userId: user.id, email: user.email });

      // Store tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Store organization ID if user has one
      if (user.organizationId) {
        localStorage.setItem('organizationId', user.organizationId);
        console.log('[AUTH] Organization ID stored:', user.organizationId);
      } else {
        console.log('[AUTH] WARNING: User has no organization');
      }

      console.log('[AUTH] Tokens stored in localStorage');

      set({ user, isAuthenticated: true, isLoading: false });
      console.log('[AUTH] Login successful - state updated', { isAuthenticated: true, userId: user.id });
    } catch (error) {
      console.error('[AUTH] Login failed', error);
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterInput) => {
    try {
      set({ isLoading: true, error: null });

      const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
      const { user, tokens } = response.data.data;

      // Store tokens
      localStorage.setItem('accessToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    console.log('[AUTH] logout called');
    try {
      // Call logout endpoint to invalidate session
      await api.post('/auth/logout');
      console.log('[AUTH] logout - API call successful');
    } catch (error) {
      // Ignore errors on logout
      console.error('[AUTH] logout - API error (ignoring):', error);
    } finally {
      // Clear local state regardless of API success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('organizationId');
      set({ user: null, isAuthenticated: false, error: null });
      console.log('[AUTH] logout - all state cleared, isAuthenticated set to false');
    }
  },

  loadUser: async () => {
    console.log('[AUTH] loadUser called');
    try {
      // Check if we have tokens
      const accessToken = localStorage.getItem('accessToken');
      console.log('[AUTH] loadUser - checking accessToken', { hasToken: !!accessToken, tokenLength: accessToken?.length });

      if (!accessToken) {
        console.log('[AUTH] loadUser - no token, setting not authenticated');
        set({ isAuthenticated: false, isLoading: false });
        return;
      }

      set({ isLoading: true });
      console.log('[AUTH] loadUser - calling /auth/me');

      // Load user from API
      const response = await api.get<ApiResponse<SafeUser>>('/auth/me');
      console.log('[AUTH] loadUser - response received', { status: response.status });

      const user = response.data.data;
      console.log('[AUTH] loadUser - user data parsed', { userId: user.id, email: user.email });

      // Update local storage
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, isAuthenticated: true, isLoading: false });
      console.log('[AUTH] loadUser successful - state updated', { isAuthenticated: true, userId: user.id });
    } catch (error) {
      console.error('[AUTH] loadUser FAILED - clearing auth state', error);
      // Token invalid or expired, clear auth state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      set({ user: null, isAuthenticated: false, isLoading: false });
      console.log('[AUTH] loadUser - auth state cleared, isAuthenticated set to false');
    }
  },

  updateProfile: async (data: UpdateProfileInput) => {
    try {
      set({ isLoading: true, error: null });

      const response = await api.put<ApiResponse<SafeUser>>('/auth/me', data);
      const user = response.data.data;

      localStorage.setItem('user', JSON.stringify(user));
      set({ user, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
