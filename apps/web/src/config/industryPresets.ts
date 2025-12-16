/**
 * Industry Presets Configuration
 * Defines module configurations for different business types
 */

export interface IndustryPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  modules: string[];
  recommended?: string[];
}

export const industryPresets: IndustryPreset[] = [
  // Boulangerie / Patisserie
  {
    id: 'bakery',
    name: 'Boulangerie / Patisserie',
    description: 'Gestion complète pour boulangeries, patisseries et industries alimentaires',
    icon: 'ChefHat',
    color: 'amber',
    modules: [
      'dashboard',
      'finance',
      'crm',
      'inventory',
      'hr',
      'procurement',
      'sales',
      'recipes',
      'traceability',
      'manufacturing',
      'pos',
      'payroll',
      'help',
    ],
    recommended: ['quality', 'analytics'],
  },

  // Clinique / Cabinet medical
  {
    id: 'clinic',
    name: 'Clinique / Cabinet Medical',
    description: 'Gestion pour cliniques, cabinets medicaux et etablissements de sante',
    icon: 'Stethoscope',
    color: 'blue',
    modules: [
      'dashboard',
      'finance',
      'crm',
      'inventory',
      'hr',
      'procurement',
      'projects',
      'assets',
      'workflows',
      'payroll',
      'analytics',
      'help',
    ],
    recommended: ['ai', 'audit'],
  },

  // Usine Textile
  {
    id: 'textile',
    name: 'Usine Textile',
    description: 'Gestion pour usines de textile, confection et industries manufacturieres',
    icon: 'Factory',
    color: 'purple',
    modules: [
      'dashboard',
      'finance',
      'crm',
      'inventory',
      'hr',
      'procurement',
      'sales',
      'manufacturing',
      'mrp',
      'quality',
      'maintenance',
      'assets',
      'workflows',
      'payroll',
      'help',
    ],
    recommended: ['analytics', 'ai'],
  },

  // Restaurant / Restauration
  {
    id: 'restaurant',
    name: 'Restaurant / Restauration',
    description: 'Gestion pour restaurants, cafes et services de restauration',
    icon: 'UtensilsCrossed',
    color: 'orange',
    modules: [
      'dashboard',
      'finance',
      'crm',
      'inventory',
      'hr',
      'procurement',
      'recipes',
      'traceability',
      'pos',
      'payroll',
      'help',
    ],
    recommended: ['analytics'],
  },

  // Commerce / Retail
  {
    id: 'retail',
    name: 'Commerce / Retail',
    description: 'Gestion pour commerces de detail, boutiques et points de vente',
    icon: 'Store',
    color: 'green',
    modules: [
      'dashboard',
      'finance',
      'crm',
      'inventory',
      'hr',
      'procurement',
      'sales',
      'pos',
      'assets',
      'payroll',
      'help',
    ],
    recommended: ['analytics', 'workflows'],
  },

  // Industrie Agroalimentaire
  {
    id: 'food-industry',
    name: 'Industrie Agroalimentaire',
    description: 'Gestion pour industries agroalimentaires avec tracabilite complete',
    icon: 'Wheat',
    color: 'lime',
    modules: [
      'dashboard',
      'finance',
      'crm',
      'inventory',
      'hr',
      'procurement',
      'sales',
      'manufacturing',
      'recipes',
      'traceability',
      'mrp',
      'quality',
      'maintenance',
      'assets',
      'workflows',
      'payroll',
      'help',
    ],
    recommended: ['ai', 'audit', 'analytics'],
  },

  // Construction / BTP
  {
    id: 'construction',
    name: 'Construction / BTP',
    description: 'Gestion pour entreprises de construction et batiment',
    icon: 'HardHat',
    color: 'yellow',
    modules: [
      'dashboard',
      'finance',
      'crm',
      'inventory',
      'hr',
      'procurement',
      'projects',
      'assets',
      'maintenance',
      'workflows',
      'payroll',
      'help',
    ],
    recommended: ['analytics', 'audit'],
  },

  // Services / Consulting
  {
    id: 'services',
    name: 'Services / Consulting',
    description: 'Gestion pour societes de services, consulting et SSII',
    icon: 'Briefcase',
    color: 'indigo',
    modules: [
      'dashboard',
      'finance',
      'crm',
      'hr',
      'projects',
      'workflows',
      'payroll',
      'help',
    ],
    recommended: ['ai', 'analytics'],
  },

  // Pharmacie
  {
    id: 'pharmacy',
    name: 'Pharmacie',
    description: 'Gestion pour pharmacies et parapharmacies',
    icon: 'Pill',
    color: 'cyan',
    modules: [
      'dashboard',
      'finance',
      'crm',
      'inventory',
      'hr',
      'procurement',
      'sales',
      'traceability',
      'pos',
      'payroll',
      'help',
    ],
    recommended: ['analytics'],
  },

  // Logistique / Transport
  {
    id: 'logistics',
    name: 'Logistique / Transport',
    description: 'Gestion pour entreprises de logistique et transport',
    icon: 'Truck',
    color: 'slate',
    modules: [
      'dashboard',
      'finance',
      'crm',
      'inventory',
      'hr',
      'procurement',
      'assets',
      'maintenance',
      'workflows',
      'payroll',
      'help',
    ],
    recommended: ['analytics', 'ai'],
  },

  // Super Admin - Tous les modules
  {
    id: 'superadmin',
    name: 'Super Admin (Tous modules)',
    description: 'Acces a tous les modules du systeme - pour administrateurs',
    icon: 'Shield',
    color: 'red',
    modules: [
      'dashboard',
      'finance',
      'crm',
      'inventory',
      'hr',
      'procurement',
      'sales',
      'projects',
      'assets',
      'workflows',
      'manufacturing',
      'recipes',
      'traceability',
      'pos',
      'quality',
      'maintenance',
      'mrp',
      'ai',
      'audit',
      'payroll',
      'analytics',
      'help',
    ],
  },

  // Configuration personnalisee
  {
    id: 'custom',
    name: 'Configuration Personnalisee',
    description: 'Selectionnez manuellement les modules dont vous avez besoin',
    icon: 'Settings',
    color: 'gray',
    modules: [
      'dashboard',
      'finance',
      'crm',
      'inventory',
      'hr',
      'help',
    ],
  },
];

// Color mappings for Tailwind classes
export const presetColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300', icon: 'text-amber-600' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300', icon: 'text-blue-600' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300', icon: 'text-purple-600' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-500', text: 'text-orange-700 dark:text-orange-300', icon: 'text-orange-600' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', text: 'text-green-700 dark:text-green-300', icon: 'text-green-600' },
  lime: { bg: 'bg-lime-50 dark:bg-lime-900/20', border: 'border-lime-500', text: 'text-lime-700 dark:text-lime-300', icon: 'text-lime-600' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-500', text: 'text-yellow-700 dark:text-yellow-300', icon: 'text-yellow-600' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', icon: 'text-indigo-600' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-500', text: 'text-cyan-700 dark:text-cyan-300', icon: 'text-cyan-600' },
  slate: { bg: 'bg-slate-50 dark:bg-slate-900/20', border: 'border-slate-500', text: 'text-slate-700 dark:text-slate-300', icon: 'text-slate-600' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', text: 'text-red-700 dark:text-red-300', icon: 'text-red-600' },
  gray: { bg: 'bg-gray-50 dark:bg-gray-900/20', border: 'border-gray-500', text: 'text-gray-700 dark:text-gray-300', icon: 'text-gray-600' },
};

export function getPresetById(id: string): IndustryPreset | undefined {
  return industryPresets.find(p => p.id === id);
}

export function getPresetModules(presetId: string): string[] {
  const preset = getPresetById(presetId);
  return preset?.modules || [];
}
