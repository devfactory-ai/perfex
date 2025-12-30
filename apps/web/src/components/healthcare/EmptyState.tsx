/**
 * Healthcare Module Empty State Component
 * Unified empty state for all healthcare modules
 */

import { type LucideIcon, FileQuestion } from 'lucide-react';
import { type HealthcareModule, getModuleTheme } from './theme';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message?: string; // alias for title
  description?: string;
  module?: HealthcareModule;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  message,
  description,
  module,
  action,
}: EmptyStateProps) {
  const theme = module ? getModuleTheme(module) : null;
  const displayTitle = title ?? message ?? 'Aucun élément';

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className={`p-4 rounded-full ${theme ? theme.primaryLight : 'bg-gray-100 dark:bg-gray-700'} mb-4`}>
        <Icon className={`h-12 w-12 ${theme ? `${theme.icon} dark:${theme.iconDark}` : 'text-gray-400'}`} />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
        {displayTitle}
      </h3>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-4">
          {description}
        </p>
      )}
      {action && (
        <Button
          module={module}
          variant="primary"
          icon={action.icon}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
