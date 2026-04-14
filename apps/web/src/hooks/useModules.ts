/**
 * Hook to fetch and manage enabled modules
 * Uses app variant config and user role for module filtering
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getAppConfig, getCurrentVariant, isModuleEnabled } from '../config/app-variants';

interface EnabledModulesResponse {
  modules: string[];
}

/**
 * Modules that require admin or higher platform role
 */
const ADMIN_ONLY_MODULES = ['settings'];

/**
 * Get enabled modules for the current organization
 */
export function useEnabledModules() {
  // For now, use a default organization ID
  const organizationId = 'default-org';

  return useQuery({
    queryKey: ['enabledModules', organizationId],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          return { modules: [] as string[] };
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/modules/organization/${organizationId}/enabled`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          // If API fails, return all modules as enabled (fallback)
          return { modules: [] as string[] };
        }

        const data = await response.json() as EnabledModulesResponse;
        return data;
      } catch {
        // If API fails, return empty (will use defaults)
        return { modules: [] as string[] };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get default modules based on app variant and user role.
 * The variant config defines which modules are available.
 * The user's platformRole restricts admin-only modules for regular users.
 */
function getDefaultModules(platformRole?: string): string[] {
  const config = getAppConfig();
  const modules = [...config.enabledModules];

  // Regular users (non-admin) don't get admin-only modules
  if (platformRole === 'user') {
    return modules.filter(m => !ADMIN_ONLY_MODULES.includes(m));
  }

  return modules;
}

/**
 * Check if a specific module is enabled
 */
export function useModuleEnabled(moduleId: string): boolean {
  const { data, isLoading } = useEnabledModules();
  const { user } = useAuth();

  // First check if module is enabled for current variant
  if (!isModuleEnabled(moduleId)) {
    return false;
  }

  // If still loading or no data, check default modules
  if (isLoading || !data || data.modules.length === 0) {
    const defaultModules = getDefaultModules(user?.platformRole);
    return defaultModules.includes(moduleId);
  }

  return data.modules.includes(moduleId);
}

/**
 * Get all enabled module IDs
 */
export function useModuleIds(): string[] {
  const { data, isLoading } = useEnabledModules();
  const { user } = useAuth();
  const config = getAppConfig();

  // If still loading or no data, return default modules
  if (isLoading || !data || data.modules.length === 0) {
    return getDefaultModules(user?.platformRole);
  }

  // Filter API results by variant enabled modules and role
  let modules = data.modules.filter(m => config.enabledModules.includes(m));

  // Regular users don't get admin-only modules
  if (user?.platformRole === 'user') {
    modules = modules.filter(m => !ADMIN_ONLY_MODULES.includes(m));
  }

  return modules;
}

/**
 * Get user's role label for display
 */
export function useUserRole(): string {
  const { user } = useAuth();

  if (!user?.platformRole) return 'Utilisateur';

  const roleLabels: Record<string, string> = {
    'super_admin': 'Super Admin',
    'admin': 'Administrateur',
    'user': 'Utilisateur',
  };

  return roleLabels[user.platformRole] || 'Utilisateur';
}

/**
 * Get current app variant info
 */
export function useAppVariant() {
  return {
    variant: getCurrentVariant(),
    config: getAppConfig(),
  };
}
