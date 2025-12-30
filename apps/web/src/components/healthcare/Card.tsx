/**
 * Healthcare Module Card Components
 * Unified card styling for all healthcare modules
 */

import { type LucideIcon, ChevronRight } from 'lucide-react';
import { type HealthcareModule, getModuleTheme, getStatusColor } from './theme';

// Stats Card for dashboards
export interface StatsCardProps {
  label?: string;
  title?: string; // alias for label
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  module: HealthcareModule;
  trend?: {
    value: number;
    label: string;
  };
}

export function StatsCard({ label, title, value, subtitle, icon: Icon, module, trend }: StatsCardProps) {
  const theme = getModuleTheme(module);
  const displayLabel = label ?? title ?? '';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{displayLabel}</span>
        {Icon && (
          <div className={`p-2 rounded-lg ${theme.primaryLight}`}>
            <Icon className={`h-5 w-5 ${theme.icon} dark:${theme.iconDark}`} />
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}

// List Item Card
interface ListItemCardProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  module: HealthcareModule;
  status?: string;
  metadata?: Array<{ icon?: LucideIcon; label: string }>;
  rightContent?: React.ReactNode;
  onClick?: () => void;
}

export function ListItemCard({
  title,
  subtitle,
  icon: Icon,
  module,
  status,
  metadata,
  rightContent,
  onClick,
}: ListItemCardProps) {
  const theme = getModuleTheme(module);

  return (
    <div
      onClick={onClick}
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-full ${theme.primaryLight} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-6 w-6 ${theme.icon} dark:${theme.iconDark}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">
                {title}
              </h3>
              {status && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(status)}`}>
                  {status}
                </span>
              )}
            </div>
            {(subtitle || metadata) && (
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
                {subtitle && <span>{subtitle}</span>}
                {metadata?.map((item, index) => (
                  <span key={index} className="flex items-center gap-1">
                    {item.icon && <item.icon className="h-4 w-4" />}
                    {item.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 ml-4">
          {rightContent}
          {onClick && <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />}
        </div>
      </div>
    </div>
  );
}

// Section Card
export interface SectionCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  module?: HealthcareModule; // optional, for consistency
}

export function SectionCard({ title, children, className = '' }: SectionCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
      )}
      {title ? <div className="p-4">{children}</div> : children}
    </div>
  );
}

// Quick Action Card
export interface QuickActionCardProps {
  label?: string;
  title?: string; // alias for label
  description?: string;
  icon: LucideIcon;
  module: HealthcareModule;
  onClick?: () => void;
  to?: string; // for router links
}

export function QuickActionCard({ label, title, description, icon: Icon, module, onClick, to }: QuickActionCardProps) {
  const theme = getModuleTheme(module);
  const displayLabel = label ?? title ?? '';

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      // Navigate using window.location for simplicity (or could use a router context)
      window.location.href = to;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all group"
    >
      <div className={`p-3 rounded-lg ${theme.primaryLight} group-hover:scale-105 transition-transform`}>
        <Icon className={`h-6 w-6 ${theme.icon} dark:${theme.iconDark}`} />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">{displayLabel}</span>
      {description && (
        <span className="text-xs text-gray-500 dark:text-gray-400 text-center">{description}</span>
      )}
    </button>
  );
}
