/**
 * Healthcare Module Design System
 * Unified components for all healthcare modules (Cardiology, Ophthalmology, Dialyse)
 */

// Theme
export {
  type HealthcareModule,
  type ModuleTheme,
  moduleThemes,
  statusColors,
  getModuleTheme,
  getStatusColor
} from './theme';

// Layout Components
export { PageHeader } from './PageHeader';
export { FormSection, FormGrid, FormActions } from './FormSection';
export { FilterBar, ActiveFilters } from './FilterBar';

// Card Components
export { StatsCard, ListItemCard, SectionCard, QuickActionCard } from './Card';

// Form Components
export { Input, Select, Textarea, Checkbox } from './FormInput';
export { Button } from './Button';

// State Components
export { EmptyState } from './EmptyState';
export { LoadingSpinner, PageLoading, InlineLoading, StatsCardSkeleton } from './LoadingSpinner';

// Table & List Components
export { DataTable, CardList, type Column, type DataTableProps, type CardListProps } from './DataTable';

// Action Components
export { ActionButtons, ActionButton, ActionDropdown, type ActionButtonProps, type ActionButtonsProps } from './ActionButtons';

// Badge Components
export {
  Badge,
  StatusBadge,
  SeverityBadge,
  PriorityBadge,
  GenderBadge,
  BloodTypeBadge,
  AlertBadge,
  type BadgeVariant,
  type BadgeProps,
} from './Badge';

// Page Templates
export { PatientsListPage, type PatientBase, type PatientStats, type PatientsListPageProps } from './PatientsListPage';
export { ResourceListPage, type ResourceListPageProps, type StatsCardConfig, type FilterConfig as ResourceFilterConfig } from './ResourceListPage';

// Simple Filter Components (used by RPM pages)
export { SearchInput } from './SearchInput';
export { FilterDropdown } from './FilterDropdown';

// Dialog Components
export { ConfirmDialog, type ConfirmDialogProps } from './ConfirmDialog';

// Form Component Stubs (for pages that use them)
// These are simple re-exports of the existing form components
export { Select as FormSelect } from './FormInput';
export { Input as FormField } from './FormInput';
export { Select as FormTextarea } from './FormInput';
