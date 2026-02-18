/**
 * Healthcare Module Page Header Component
 * Unified header for all healthcare list/detail pages
 */

import { type ReactNode, isValidElement } from 'react';
import { type LucideIcon, ArrowLeft } from 'lucide-react';
import { type HealthcareModule, getModuleTheme } from './theme';

export interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  description?: ReactNode; // alias for subtitle
  icon?: LucideIcon | ReactNode;
  module?: HealthcareModule;
  actions?: ReactNode;
  children?: ReactNode; // for additional action buttons
  badge?: ReactNode; // optional badge next to title
  onBack?: () => void;
  showBackButton?: boolean;
  backButton?: { label?: string; onClick: () => void };
}

export function PageHeader({
  title,
  subtitle,
  description,
  icon,
  module,
  actions,
  children,
  badge,
  onBack,
  showBackButton,
  backButton
}: PageHeaderProps) {
  const theme = module ? getModuleTheme(module) : null;
  const handleBack = onBack || backButton?.onClick;
  const shouldShowBack = showBackButton || !!onBack || !!backButton;
  const displaySubtitle = subtitle ?? description;

  // Determine if icon is a component or already rendered element
  const renderIcon = () => {
    if (!icon) return null;

    // If it's already a React element, render it as-is
    if (isValidElement(icon)) {
      return icon;
    }

    // Otherwise, treat it as a LucideIcon component
    const IconComponent = icon as LucideIcon;
    const iconClasses = theme
      ? `h-6 w-6 ${theme.icon} dark:${theme.iconDark}`
      : 'h-6 w-6 text-gray-600';
    const wrapperClasses = theme
      ? `p-2 rounded-lg ${theme.primaryLight}`
      : 'p-2 rounded-lg bg-gray-100';

    return (
      <div className={wrapperClasses}>
        <IconComponent className={iconClasses} />
      </div>
    );
  };

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
            {renderIcon()}
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
