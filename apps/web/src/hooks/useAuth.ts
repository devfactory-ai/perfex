/**
 * useAuth Hook
 * Convenient hook to access auth store
 */

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);
  const loadUser = useAuthStore((state) => state.loadUser);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const clearError = useAuthStore((state) => state.clearError);

  // Load user on mount if not already loaded
  useEffect(() => {
    console.log('[useAuth] Effect triggered', { hasUser: !!user, isLoading, isAuthenticated });
    if (!user && !isLoading) {
      console.log('[useAuth] No user in state, calling loadUser()');
      loadUser();
    } else {
      console.log('[useAuth] User already loaded or loading, skipping loadUser()');
    }
  }, [user, isLoading, loadUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    loadUser,
    updateProfile,
    clearError,
  };
}
