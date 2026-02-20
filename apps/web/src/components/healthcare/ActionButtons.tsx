/**
 * Action Buttons Component
 * Reusable action buttons for list items (view, edit, delete, etc.)
 */

import { Eye, Pencil, Trash2, MoreHorizontal, type LucideIcon } from 'lucide-react';
import { type HealthcareModule } from './theme';
import { useLanguage } from '@/contexts/LanguageContext';

export interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'primary';
  disabled?: boolean;
}

export interface ActionButtonsProps {
  module?: HealthcareModule;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  customActions?: ActionButtonProps[];
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

export function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
}: ActionButtonProps) {
  const variantClasses = {
    default: 'text-muted-foreground hover:text-foreground hover:bg-muted',
    danger: 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
    primary: 'text-muted-foreground hover:text-primary hover:bg-primary/10',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-md transition-colors ${variantClasses[variant]} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function ActionButtons({
  onView,
  onEdit,
  onDelete,
  customActions = [],
  size = 'md',
  showLabels = false,
}: ActionButtonsProps) {
  const { t } = useLanguage();
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const padding = size === 'sm' ? 'p-1.5' : 'p-2';

  const baseButtonClass = `${padding} rounded-md transition-colors`;

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Custom actions first */}
      {customActions.map((action, index) => (
        <ActionButton key={index} {...action} />
      ))}

      {/* View button */}
      {onView && (
        <button
          onClick={onView}
          className={`${baseButtonClass} text-muted-foreground hover:text-primary hover:bg-muted`}
          title={t('common.view')}
        >
          <Eye className={iconSize} />
          {showLabels && <span className="ml-1 text-xs">{t('common.view')}</span>}
        </button>
      )}

      {/* Edit button */}
      {onEdit && (
        <button
          onClick={onEdit}
          className={`${baseButtonClass} text-muted-foreground hover:text-primary hover:bg-muted`}
          title={t('common.edit')}
        >
          <Pencil className={iconSize} />
          {showLabels && <span className="ml-1 text-xs">{t('common.edit')}</span>}
        </button>
      )}

      {/* Delete button */}
      {onDelete && (
        <button
          onClick={onDelete}
          className={`${baseButtonClass} text-muted-foreground hover:text-destructive hover:bg-destructive/10`}
          title={t('common.delete')}
        >
          <Trash2 className={iconSize} />
          {showLabels && <span className="ml-1 text-xs">{t('common.delete')}</span>}
        </button>
      )}
    </div>
  );
}

// Dropdown version for more actions
export interface ActionDropdownProps {
  actions: ActionButtonProps[];
  module?: HealthcareModule;
}

export function ActionDropdown({ actions }: ActionDropdownProps) {
  // Simple implementation - can be enhanced with proper dropdown later
  return (
    <div className="relative group">
      <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      <div className="absolute right-0 top-full mt-1 bg-popover border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[150px]">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            disabled={action.disabled}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md ${
              action.variant === 'danger' ? 'text-destructive' : ''
            }`}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
