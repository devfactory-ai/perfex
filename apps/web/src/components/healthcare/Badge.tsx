/**
 * Badge Component
 * Reusable status and category badges for healthcare modules
 */

import { type ReactNode } from 'react';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gray'
  | 'green'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'blue'
  | 'purple'
  | 'pink';

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'xs' | 'sm' | 'md';
  outline?: boolean;
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  danger: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  gray: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700',
  green: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
  orange: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
  red: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  blue: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
  purple: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  pink: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800',
};

const sizeStyles: Record<'xs' | 'sm' | 'md', string> = {
  xs: 'px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({
  children,
  variant = 'default',
  size = 'sm',
  outline = false,
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 font-medium rounded-full border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${outline ? 'bg-transparent' : ''}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' || variant === 'green' ? 'bg-green-500' :
          variant === 'warning' || variant === 'yellow' ? 'bg-yellow-500' :
          variant === 'danger' || variant === 'red' ? 'bg-red-500' :
          variant === 'info' || variant === 'blue' ? 'bg-blue-500' :
          variant === 'orange' ? 'bg-orange-500' :
          'bg-gray-500'
        }`} />
      )}
      {children}
    </span>
  );
}

// ============================================================================
// SPECIALIZED BADGES
// ============================================================================

export interface StatusBadgeProps {
  status: string;
  statusMap?: Record<string, { label: string; variant: BadgeVariant }>;
  size?: 'xs' | 'sm' | 'md';
  dot?: boolean;
}

// Default status mappings
const defaultStatusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Actif', variant: 'success' },
  inactive: { label: 'Inactif', variant: 'gray' },
  pending: { label: 'En attente', variant: 'warning' },
  completed: { label: 'Terminé', variant: 'success' },
  cancelled: { label: 'Annulé', variant: 'gray' },
  scheduled: { label: 'Planifié', variant: 'blue' },
  in_progress: { label: 'En cours', variant: 'yellow' },
  available: { label: 'Disponible', variant: 'success' },
  in_use: { label: 'En utilisation', variant: 'blue' },
  maintenance: { label: 'Maintenance', variant: 'orange' },
  out_of_service: { label: 'Hors service', variant: 'red' },
  deceased: { label: 'Décédé', variant: 'gray' },
  transferred: { label: 'Transféré', variant: 'blue' },
};

export function StatusBadge({
  status,
  statusMap = defaultStatusMap,
  size = 'sm',
  dot = false,
}: StatusBadgeProps) {
  const config = statusMap[status] || { label: status, variant: 'default' as BadgeVariant };
  return (
    <Badge variant={config.variant} size={size} dot={dot}>
      {config.label}
    </Badge>
  );
}

// Severity Badge
export interface SeverityBadgeProps {
  severity: 'critical' | 'warning' | 'info' | 'low' | 'medium' | 'high';
  size?: 'xs' | 'sm' | 'md';
}

const severityMap: Record<string, { label: string; variant: BadgeVariant }> = {
  critical: { label: 'Critique', variant: 'red' },
  high: { label: 'Haute', variant: 'orange' },
  warning: { label: 'Avertissement', variant: 'orange' },
  medium: { label: 'Moyenne', variant: 'yellow' },
  info: { label: 'Information', variant: 'blue' },
  low: { label: 'Basse', variant: 'gray' },
};

export function SeverityBadge({ severity, size = 'sm' }: SeverityBadgeProps) {
  const config = severityMap[severity] || { label: severity, variant: 'default' as BadgeVariant };
  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
}

// Priority Badge
export interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'critical';
  size?: 'xs' | 'sm' | 'md';
}

const priorityMap: Record<string, { label: string; variant: BadgeVariant }> = {
  low: { label: 'Basse', variant: 'gray' },
  medium: { label: 'Moyenne', variant: 'blue' },
  high: { label: 'Haute', variant: 'orange' },
  critical: { label: 'Critique', variant: 'red' },
};

export function PriorityBadge({ priority, size = 'sm' }: PriorityBadgeProps) {
  const config = priorityMap[priority] || { label: priority, variant: 'default' as BadgeVariant };
  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
}

// Gender Badge
export interface GenderBadgeProps {
  gender: 'M' | 'F' | string;
  size?: 'xs' | 'sm' | 'md';
}

export function GenderBadge({ gender, size = 'xs' }: GenderBadgeProps) {
  const isM = gender === 'M';
  return (
    <Badge variant={isM ? 'blue' : 'pink'} size={size}>
      {isM ? 'M' : 'F'}
    </Badge>
  );
}

// Blood Type Badge
export interface BloodTypeBadgeProps {
  bloodType: string;
  size?: 'xs' | 'sm' | 'md';
}

export function BloodTypeBadge({ bloodType, size = 'sm' }: BloodTypeBadgeProps) {
  return (
    <Badge variant="red" size={size}>
      {bloodType}
    </Badge>
  );
}

// Alert Status Badge
export interface AlertBadgeProps {
  status: 'active' | 'acknowledged' | 'resolved';
  size?: 'xs' | 'sm' | 'md';
}

const alertStatusMap: Record<string, { label: string; variant: BadgeVariant }> = {
  active: { label: 'Active', variant: 'red' },
  acknowledged: { label: 'Prise en compte', variant: 'yellow' },
  resolved: { label: 'Résolue', variant: 'green' },
};

export function AlertBadge({ status, size = 'sm' }: AlertBadgeProps) {
  const config = alertStatusMap[status] || { label: status, variant: 'default' as BadgeVariant };
  return (
    <Badge variant={config.variant} size={size} dot>
      {config.label}
    </Badge>
  );
}
