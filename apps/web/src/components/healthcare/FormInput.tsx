/**
 * Healthcare Module Form Input Components
 * Unified form inputs for all healthcare modules
 */

import { forwardRef } from 'react';
import { type LucideIcon } from 'lucide-react';
import { type HealthcareModule, getModuleTheme } from './theme';

// Text Input
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: LucideIcon;
  module?: HealthcareModule;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon: Icon, module, className = '', ...props }, ref) => {
    const theme = module ? getModuleTheme(module) : null;
    const ringClass = theme ? theme.ring : 'focus:ring-gray-500';

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <input
            ref={ref}
            className={`
              block w-full rounded-lg border
              ${error
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:ring-2 ' + ringClass
              }
              bg-white dark:bg-gray-700
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              ${Icon ? 'pl-10' : 'px-3'} py-2
              disabled:opacity-50 disabled:cursor-not-allowed
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Select Input
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  module?: HealthcareModule;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, module, className = '', ...props }, ref) => {
    const theme = module ? getModuleTheme(module) : null;
    const ringClass = theme ? theme.ring : 'focus:ring-gray-500';

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          ref={ref}
          className={`
            block w-full rounded-lg border
            ${error
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-2 ' + ringClass
            }
            bg-white dark:bg-gray-700
            text-gray-900 dark:text-white
            px-3 py-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="">{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  module?: HealthcareModule;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, module, className = '', ...props }, ref) => {
    const theme = module ? getModuleTheme(module) : null;
    const ringClass = theme ? theme.ring : 'focus:ring-gray-500';

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            block w-full rounded-lg border
            ${error
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 dark:border-gray-600 focus:ring-2 ' + ringClass
            }
            bg-white dark:bg-gray-700
            text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            px-3 py-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
          rows={props.rows || 4}
          {...props}
        />
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Checkbox
interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
  module?: HealthcareModule;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, module, className = '', ...props }, ref) => {
    const theme = module ? getModuleTheme(module) : null;
    const ringClass = theme ? theme.ring.replace('focus:', '') : 'ring-gray-500';
    const checkedClass = theme ? theme.primary : 'bg-gray-600';

    return (
      <label className={`flex items-start gap-3 cursor-pointer ${className}`}>
        <input
          ref={ref}
          type="checkbox"
          className={`
            mt-1 h-4 w-4 rounded
            border-gray-300 dark:border-gray-600
            ${checkedClass} text-white
            focus:ring-2 focus:${ringClass}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          {...props}
        />
        <div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          )}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
