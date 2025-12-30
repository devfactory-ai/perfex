/**
 * Healthcare Module Button Component
 * Unified button styling for all healthcare modules
 */

import { type LucideIcon } from 'lucide-react';
import { type HealthcareModule, getModuleTheme } from './theme';

interface ButtonProps {
  children: React.ReactNode;
  module?: HealthcareModule;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  type?: 'button' | 'submit' | 'reset';
  onClick?: () => void;
  className?: string;
}

export function Button({
  children,
  module,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  type = 'button',
  onClick,
  className = '',
}: ButtonProps) {
  const theme = module ? getModuleTheme(module) : null;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-5 w-5',
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        if (theme) {
          return `${theme.primary} ${theme.primaryHover} text-white`;
        }
        return 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900';
      case 'secondary':
        return 'bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-white';
      case 'outline':
        return 'border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300';
      case 'ghost':
        return 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white';
      default:
        return '';
    }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-lg
        transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${getVariantClasses()}
        ${className}
      `}
    >
      {loading ? (
        <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${iconSizeClasses[size]}`} />
      ) : (
        Icon && iconPosition === 'left' && <Icon className={iconSizeClasses[size]} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className={iconSizeClasses[size]} />}
    </button>
  );
}
