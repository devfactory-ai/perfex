/**
 * Healthcare Module Page Header Component
 * Unified header for all healthcare list/detail pages
 */

import { type LucideIcon, ArrowLeft } from 'lucide-react';
import { type HealthcareModule, getModuleTheme } from './theme';

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  description?: React.ReactNode; // alias for subtitle
  icon?: LucideIcon;
  module: HealthcareModule;
  actions?: React.ReactNode;
  children?: React.ReactNode; // for additional action buttons
  badge?: React.ReactNode; // optional badge next to title
  onBack?: () => void;
  showBackButton?: boolean;
  backButton?: { label?: string; onClick: () => void };
}

export function PageHeader({
  title,
  subtitle,
  description,
  icon: Icon,
  module,
  actions,
  children,
  badge,
  onBack,
  showBackButton,
  backButton
}: PageHeaderProps) {
  const theme = getModuleTheme(module);
  const handleBack = onBack || backButton?.onClick;
  const shouldShowBack = showBackButton || !!onBack || !!backButton;
  const displaySubtitle = subtitle ?? description;

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          {shouldShowBack && handleBack && (
            <button
              onClick={handleBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            {Icon && (
              <div className={`p-2 rounded-lg ${theme.primaryLight}`}>
                <Icon className={`h-6 w-6 ${theme.icon} dark:${theme.iconDark}`} />
              </div>
            )}
            {title}
            {badge}
          </h1>
        </div>
        {displaySubtitle && (
          <div className="text-gray-600 dark:text-gray-400 mt-1 ml-12">
            {displaySubtitle}
          </div>
        )}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-3">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
