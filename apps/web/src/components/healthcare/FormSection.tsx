/**
 * Healthcare Module Form Section Component
 * Unified form section wrapper for all healthcare modules
 */

import { type LucideIcon } from 'lucide-react';
import { type HealthcareModule, getModuleTheme } from './theme';

export interface FormSectionProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  module?: HealthcareModule;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  subtitle,
  icon: Icon,
  module,
  children,
  className = '',
}: FormSectionProps) {
  const theme = module ? getModuleTheme(module) : null;
  const hasHeader = title || subtitle || Icon;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {hasHeader && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`p-2 rounded-lg ${theme ? theme.primaryLight : 'bg-gray-100 dark:bg-gray-700'}`}>
                <Icon className={`h-5 w-5 ${theme ? `${theme.icon} dark:${theme.iconDark}` : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
            )}
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>}
              {subtitle && (
                <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// Form Grid Layout
export interface FormGridProps {
  columns?: 1 | 2 | 3 | 4;
  cols?: 1 | 2 | 3 | 4; // alias for columns
  children: React.ReactNode;
  className?: string;
}

export function FormGrid({ columns, cols, children, className = '' }: FormGridProps) {
  const numColumns = columns ?? cols ?? 2;
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[numColumns]} gap-4 ${className}`}>
      {children}
    </div>
  );
}

// Form Actions (buttons at bottom of form)
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export function FormActions({ children, className = '' }: FormActionsProps) {
  return (
    <div className={`flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  );
}
