/**
 * Healthcare Module Filter Bar Component
 * Unified filter/search bar for all healthcare list pages
 */

import { Search, Filter, X } from 'lucide-react';
import { type HealthcareModule, getModuleTheme } from './theme';

interface FilterOption {
  value: string;
  label: string;
}

export interface FilterBarProps {
  searchTerm?: string;
  searchValue?: string; // alias for searchTerm
  onSearchChange: (value: string) => void | React.Dispatch<React.SetStateAction<string>>;
  searchPlaceholder?: string;
  module?: HealthcareModule;
  filters?: Array<{
    name: string;
    value: string;
    options: FilterOption[];
    onChange: (value: string) => void;
  }>;
  children?: React.ReactNode;
}

export function FilterBar({
  searchTerm,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Rechercher...',
  module,
  filters,
  children,
}: FilterBarProps) {
  const theme = module ? getModuleTheme(module) : null;
  const ringClass = theme ? theme.ring : 'focus:ring-gray-500';
  const currentSearchValue = searchTerm ?? searchValue ?? '';

  const handleChange = (value: string) => {
    // Handle both function types
    if (typeof onSearchChange === 'function') {
      onSearchChange(value);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={currentSearchValue}
            onChange={(e) => handleChange(e.target.value)}
            className={`
              w-full pl-10 pr-10 py-2
              border border-gray-300 dark:border-gray-600 rounded-lg
              bg-white dark:bg-gray-700
              text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
              focus:ring-2 ${ringClass}
            `}
          />
          {currentSearchValue && (
            <button
              onClick={() => handleChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters */}
        {filters && filters.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {filters.map((filter) => (
              <select
                key={filter.name}
                value={filter.value}
                onChange={(e) => filter.onChange(e.target.value)}
                className={`
                  px-4 py-2
                  border border-gray-300 dark:border-gray-600 rounded-lg
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-white
                  focus:ring-2 ${ringClass}
                  min-w-[150px]
                `}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}

        {/* Additional actions */}
        {children}
      </div>
    </div>
  );
}

// Active Filters Display
interface ActiveFiltersProps {
  filters: Array<{
    label: string;
    value: string;
    onRemove: () => void;
  }>;
  onClearAll?: () => void;
}

export function ActiveFilters({ filters, onClearAll }: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Filter className="h-4 w-4 text-gray-400" />
      {filters.map((filter, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm text-gray-700 dark:text-gray-300"
        >
          <span className="font-medium">{filter.label}:</span>
          <span>{filter.value}</span>
          <button
            onClick={filter.onRemove}
            className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {onClearAll && filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
        >
          Effacer tout
        </button>
      )}
    </div>
  );
}
