/**
 * Healthcare Module Loading Components
 * Unified loading states for all healthcare modules
 */

import { type HealthcareModule, getModuleTheme } from './theme';

// Spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  module?: HealthcareModule;
  className?: string;
}

export function LoadingSpinner({ size = 'md', module, className = '' }: LoadingSpinnerProps) {
  const theme = module ? getModuleTheme(module) : null;

  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  };

  const colorClass = theme
    ? theme.primary.replace('bg-', 'border-')
    : 'border-gray-600';

  return (
    <div
      className={`
        animate-spin rounded-full
        ${sizeClasses[size]}
        ${colorClass}
        border-t-transparent
        ${className}
      `}
    />
  );
}

// Full Page Loading
interface PageLoadingProps {
  message?: string;
  module?: HealthcareModule;
}

export function PageLoading({ message, module }: PageLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <LoadingSpinner size="lg" module={module} />
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  );
}

// Inline Loading (for lists, cards, etc.)
export interface InlineLoadingProps {
  rows?: number;
  module?: HealthcareModule; // optional, for consistency
  message?: string; // optional loading message
}

export function InlineLoading({ rows = 3, message }: InlineLoadingProps) {
  return (
    <div className="space-y-4 p-4 animate-pulse">
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">{message}</p>
      )}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-9 w-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
      </div>
    </div>
  );
}
