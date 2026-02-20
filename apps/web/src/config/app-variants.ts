/**
 * App Variants Configuration
 *
 * Perfex ERP supports multiple deployment variants from a single codebase:
 * - perfex-full: Complete ERP with all modules
 * - perfex-bakery: Bakery-focused deployment
 * - perfex-health: Healthcare-focused deployment
 */

export type AppVariant = 'perfex-full' | 'perfex-bakery' | 'perfex-health';

export interface AppVariantConfig {
  id: AppVariant;
  name: string;
  description: string;
  logo?: string;
  primaryColor: string;
  enabledModules: string[];
  defaultRoute: string;
  features: {
    pos: boolean;
    inventory: boolean;
    hr: boolean;
    finance: boolean;
    crm: boolean;
    healthcare: boolean;
    bakery: boolean;
    manufacturing: boolean;
  };
}

export const APP_VARIANTS: Record<AppVariant, AppVariantConfig> = {
  'perfex-full': {
    id: 'perfex-full',
    name: 'Perfex ERP',
    description: 'Complete Enterprise Resource Planning solution',
    primaryColor: '#3B82F6', // Blue
    defaultRoute: '/dashboard',
    enabledModules: [
      'dashboard',
      'bakery',
      'recipes',
      'traceability',
      'pos',
      'inventory',
      'crm',
      'hr',
      'finance',
      'manufacturing',
      'healthcare',
      'help',
      'settings',
    ],
    features: {
      pos: true,
      inventory: true,
      hr: true,
      finance: true,
      crm: true,
      healthcare: true,
      bakery: true,
      manufacturing: true,
    },
  },

  'perfex-bakery': {
    id: 'perfex-bakery',
    name: 'Perfex Bakery',
    description: 'Solution complète de gestion pour boulangeries-pâtisseries',
    primaryColor: '#F59E0B', // Amber/Orange
    defaultRoute: '/bakery',
    enabledModules: [
      'dashboard',
      'bakery',
      'recipes',
      'traceability',
      'pos',
      'inventory',
      'hr',
      'finance',
      'help',
      'settings',
    ],
    features: {
      pos: true,
      inventory: true,
      hr: true,
      finance: true,
      crm: false,
      healthcare: false,
      bakery: true,
      manufacturing: false,
    },
  },

  'perfex-health': {
    id: 'perfex-health',
    name: 'Perfex Health',
    description: 'Healthcare Management System - Dialysis, Cardiology, Ophthalmology',
    primaryColor: '#10B981', // Emerald/Green
    defaultRoute: '/healthcare',
    enabledModules: [
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
      'settings',
    ],
    features: {
      pos: false,
      inventory: true,
      hr: true,
      finance: true,
      crm: false,
      healthcare: true,
      bakery: false,
      manufacturing: false,
    },
  },
};

/**
 * Get current app variant from environment variable
 * Defaults to 'perfex-full' if not specified
 */
export function getCurrentVariant(): AppVariant {
  const variant = import.meta.env.VITE_APP_VARIANT as AppVariant;
  if (variant && APP_VARIANTS[variant]) {
    return variant;
  }
  return 'perfex-full';
}

/**
 * Get configuration for current app variant
 */
export function getAppConfig(): AppVariantConfig {
  return APP_VARIANTS[getCurrentVariant()];
}

/**
 * Check if a module is enabled for current variant
 */
export function isModuleEnabled(moduleId: string): boolean {
  const config = getAppConfig();
  return config.enabledModules.includes(moduleId);
}

/**
 * Check if a feature is enabled for current variant
 */
export function isFeatureEnabled(feature: keyof AppVariantConfig['features']): boolean {
  const config = getAppConfig();
  return config.features[feature];
}

/**
 * Get app name for current variant
 */
export function getAppName(): string {
  return getAppConfig().name;
}

/**
 * Get primary color for current variant
 */
export function getPrimaryColor(): string {
  return getAppConfig().primaryColor;
}
