/**
 * Hook to fetch and manage enabled modules
 * Includes role-based module filtering and app variant support
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { getAppConfig, getCurrentVariant, isModuleEnabled } from '../config/app-variants';

interface EnabledModulesResponse {
  modules: string[];
}

/**
 * Check if we're on staging or dev environment
 */
const isDevOrStaging = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' ||
         hostname === '127.0.0.1' ||
         hostname.includes('staging') ||
         import.meta.env.DEV;
};

/**
 * Default modules for standard ERP (perfex-full variant)
 */
const CORE_MODULES = [
  'dashboard', 'finance', 'crm', 'inventory', 'hr',
  'procurement', 'sales', 'projects', 'assets', 'workflows', 'help'
];

/**
 * Bakery-specific modules
 */
const BAKERY_MODULES = [
  'bakery',        // Module Boulangerie principal (Dashboard, Stock, Production, etc.)
  'recipes',       // Recettes & Formulations
  'traceability',  // Traçabilité & HACCP
  'pos',           // Point de Vente
];

/**
 * Healthcare-specific modules
 */
const HEALTH_MODULES = [
  'healthcare',
  'dialyse',
  'cardiology',
  'ophthalmology',
  'patient-portal',
  'rpm',
  'clinical-ai',
  'imaging-ai',
  'population-health',
];

/**
 * Role-based module access for bakery demo
 * Each role has access to specific modules
 */
const BAKERY_ROLE_MODULES: Record<string, string[]> = {
  // Gérant (Manager) - Full access to all bakery modules
  'demo@perfex.io': [
    'dashboard',
    'bakery',          // Module Boulangerie complet
    'recipes',         // Recettes
    'traceability',    // Traçabilité HACCP
    'pos',             // Point de Vente
    'inventory',       // Inventaire général
    'hr',              // RH (employés)
    'finance',         // Finance (factures, paiements)
    'help',
    'settings'
  ],

  // Boulanger (Baker) - Production focused
  'boulanger@perfex.io': [
    'dashboard',
    'bakery',          // Production, Fours, Chambres, Qualité, Maintenance
    'recipes',         // Recettes
    'traceability',    // Traçabilité HACCP
    'inventory',       // Stock matières premières
    'help'
  ],

  // Vendeur (Sales) - Customer & sales focused
  'vente@perfex.io': [
    'dashboard',
    'bakery',          // Ventes B2B, Rapports
    'pos',             // Point de Vente (main module)
    'inventory',       // Voir le stock produits
    'help'
  ],

  // Livreur (Delivery) - Logistics focused
  'livraison@perfex.io': [
    'dashboard',
    'bakery',          // Commandes livraison
    'help'
  ],
};

/**
 * Role-based module access for health demo
 */
const HEALTH_ROLE_MODULES: Record<string, string[]> = {
  // Admin Healthcare
  'admin@perfex-health.io': [
    'dashboard',
    'healthcare',
    'dialyse',
    'cardiology',
    'ophthalmology',
    'patient-portal',
    'rpm',
    'clinical-ai',
    'imaging-ai',
    'population-health',
    'inventory',
    'hr',
    'finance',
    'help',
    'settings'
  ],

  // Médecin (Doctor)
  'medecin@perfex-health.io': [
    'dashboard',
    'healthcare',
    'dialyse',
    'cardiology',
    'ophthalmology',
    'clinical-ai',
    'patient-portal',
    'help'
  ],

  // Infirmier (Nurse)
  'infirmier@perfex-health.io': [
    'dashboard',
    'healthcare',
    'dialyse',
    'rpm',
    'patient-portal',
    'help'
  ],
};

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
 * Get default modules based on app variant, environment and user role
 */
function getDefaultModules(userEmail?: string): string[] {
  const variant = getCurrentVariant();
  const config = getAppConfig();

  // If a specific variant is set, use variant-based module filtering
  if (variant !== 'perfex-full') {
    // Check role-based access for specific variant
    if (variant === 'perfex-bakery' && userEmail && BAKERY_ROLE_MODULES[userEmail]) {
      return BAKERY_ROLE_MODULES[userEmail];
    }
    if (variant === 'perfex-health' && userEmail && HEALTH_ROLE_MODULES[userEmail]) {
      return HEALTH_ROLE_MODULES[userEmail];
    }

    // Return all enabled modules for the variant
    return config.enabledModules;
  }

  // Full variant: Use environment-based logic
  // On staging with bakery demo, use role-based modules (legacy behavior)
  if (isDevOrStaging() && userEmail && BAKERY_ROLE_MODULES[userEmail]) {
    return BAKERY_ROLE_MODULES[userEmail];
  }

  // On staging without specific role, show all modules
  if (isDevOrStaging()) {
    return [...CORE_MODULES, ...BAKERY_MODULES, ...HEALTH_MODULES];
  }

  // Production: standard modules only
  return CORE_MODULES;
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
    const defaultModules = getDefaultModules(user?.email);
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
    const defaultModules = getDefaultModules(user?.email);
    // Filter by variant enabled modules
    return defaultModules.filter(m => config.enabledModules.includes(m) || m === 'settings');
  }

  // Filter by variant enabled modules
  return data.modules.filter(m => config.enabledModules.includes(m));
}

/**
 * Get user's role label based on email (for display)
 */
export function useUserRole(): string {
  const { user } = useAuth();
  const variant = getCurrentVariant();

  const bakeryRoleLabels: Record<string, string> = {
    'demo@perfex.io': 'Gérant',
    'boulanger@perfex.io': 'Boulanger',
    'vente@perfex.io': 'Vendeur',
    'livraison@perfex.io': 'Livreur',
  };

  const healthRoleLabels: Record<string, string> = {
    'admin@perfex-health.io': 'Administrateur',
    'medecin@perfex-health.io': 'Médecin',
    'infirmier@perfex-health.io': 'Infirmier',
  };

  if (!user?.email) return 'Utilisateur';

  if (variant === 'perfex-bakery' || bakeryRoleLabels[user.email]) {
    return bakeryRoleLabels[user.email] || 'Utilisateur';
  }

  if (variant === 'perfex-health' || healthRoleLabels[user.email]) {
    return healthRoleLabels[user.email] || 'Utilisateur';
  }

  return 'Utilisateur';
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
