/**
 * Hook to fetch and manage enabled modules
 * Includes role-based module filtering for bakery demo
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';

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
 * Default modules for standard ERP
 */
const CORE_MODULES = [
  'dashboard', 'finance', 'crm', 'inventory', 'hr',
  'procurement', 'sales', 'projects', 'assets', 'workflows', 'help'
];

/**
 * Bakery-specific modules for staging demo
 */
const BAKERY_MODULES = [
  'manufacturing', // Production
  'recipes',       // Recettes & Formulations
  'traceability',  // Traçabilité & HACCP
  'pos',           // Point de Vente
  'maintenance',   // Maintenance GMAO
];

/**
 * Role-based module access for bakery demo
 * Each role has access to specific modules
 */
const ROLE_MODULES: Record<string, string[]> = {
  // Gérant (Manager) - Full access to all modules
  'demo@perfex.io': [
    ...CORE_MODULES,
    ...BAKERY_MODULES,
    'ai', 'audit', 'analytics'
  ],

  // Boulanger (Baker) - Production focused
  'boulanger@perfex.io': [
    'dashboard',
    'manufacturing',   // Production (main module)
    'recipes',         // Recettes
    'traceability',    // Traçabilité HACCP
    'inventory',       // Stock matières premières
    'maintenance',     // Équipements
    'help'
  ],

  // Vendeur (Sales) - Customer & sales focused
  'vente@perfex.io': [
    'dashboard',
    'pos',             // Point de Vente (main module)
    'sales',           // Ventes
    'crm',             // Clients
    'inventory',       // Voir le stock produits
    'help'
  ],

  // Livreur (Delivery) - Logistics focused
  'livraison@perfex.io': [
    'dashboard',
    'sales',           // Bons de livraison
    'crm',             // Adresses clients
    'inventory',       // Vérifier disponibilité
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
 * Get default modules based on environment and user role
 */
function getDefaultModules(userEmail?: string): string[] {
  // On staging with bakery demo, use role-based modules
  if (isDevOrStaging() && userEmail && ROLE_MODULES[userEmail]) {
    return ROLE_MODULES[userEmail];
  }

  // On staging without specific role, show all bakery modules
  if (isDevOrStaging()) {
    return [...CORE_MODULES, ...BAKERY_MODULES];
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

  // If still loading or no data, return default modules
  if (isLoading || !data || data.modules.length === 0) {
    return getDefaultModules(user?.email);
  }

  return data.modules;
}

/**
 * Get user's role label based on email (for display)
 */
export function useUserRole(): string {
  const { user } = useAuth();

  const roleLabels: Record<string, string> = {
    'demo@perfex.io': 'Gérant',
    'boulanger@perfex.io': 'Boulanger',
    'vente@perfex.io': 'Vendeur',
    'livraison@perfex.io': 'Livreur',
  };

  return user?.email ? (roleLabels[user.email] || 'Utilisateur') : 'Utilisateur';
}
