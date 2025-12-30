/**
 * Healthcare Module Theme Configuration
 * Unified MONOCHROME design system for all healthcare modules
 * Uses a professional slate/gray color scheme
 */

export type HealthcareModule = 'cardiology' | 'ophthalmology' | 'dialyse';

export interface ModuleTheme {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryDark: string;
  icon: string;
  iconDark: string;
  ring: string;
  badge: string;
  gradient: string;
}

// Monochrome theme - same for all modules
const monochromeTheme: ModuleTheme = {
  primary: 'bg-slate-800',
  primaryHover: 'hover:bg-slate-900',
  primaryLight: 'bg-slate-100 dark:bg-slate-800/50',
  primaryDark: 'bg-slate-900',
  icon: 'text-slate-700',
  iconDark: 'text-slate-300',
  ring: 'focus:ring-slate-500',
  badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800/50 dark:text-slate-300',
  gradient: 'from-slate-600 to-slate-800',
};

export const moduleThemes: Record<HealthcareModule, ModuleTheme> = {
  cardiology: monochromeTheme,
  ophthalmology: monochromeTheme,
  dialyse: monochromeTheme,
};

// Status colors - monochrome shades for states
export const statusColors = {
  // Severity levels - using grayscale with subtle tints
  critical: 'bg-slate-900 text-white dark:bg-slate-700 dark:text-white',
  high: 'bg-slate-700 text-white dark:bg-slate-600 dark:text-white',
  medium: 'bg-slate-500 text-white dark:bg-slate-500 dark:text-white',
  low: 'bg-slate-300 text-slate-800 dark:bg-slate-600 dark:text-slate-200',

  // Status states
  active: 'bg-slate-800 text-white dark:bg-slate-600 dark:text-white',
  inactive: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
  pending: 'bg-slate-400 text-white dark:bg-slate-500 dark:text-white',
  completed: 'bg-slate-600 text-white dark:bg-slate-500 dark:text-white',
  cancelled: 'bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  scheduled: 'bg-slate-500 text-white dark:bg-slate-500 dark:text-white',
  confirmed: 'bg-slate-700 text-white dark:bg-slate-500 dark:text-white',
  in_progress: 'bg-slate-600 text-white dark:bg-slate-500 dark:text-white',
  no_show: 'bg-slate-400 text-slate-900 dark:bg-slate-600 dark:text-slate-200',

  // Priority levels
  urgent: 'bg-slate-900 text-white dark:bg-slate-600 dark:text-white',
  routine: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

export function getModuleTheme(module: HealthcareModule): ModuleTheme {
  return moduleThemes[module];
}

export function getStatusColor(status: string): string {
  const normalizedStatus = status.toLowerCase().replace(/[- ]/g, '_');
  return statusColors[normalizedStatus as keyof typeof statusColors] || statusColors.inactive;
}
