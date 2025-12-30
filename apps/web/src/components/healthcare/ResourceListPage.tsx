/**
 * Resource List Page Component
 * Generic list page template for all healthcare module resources
 * Provides consistent layout, pagination, filtering, and data display
 */

import { useState, useMemo, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { Plus, type LucideIcon } from 'lucide-react';
import {
  PageHeader,
  Button,
  StatsCard,
  SectionCard,
  FilterBar,
  DataTable,
  type Column,
  type HealthcareModule,
} from '@/components/healthcare';
import type { PaginatedResponse } from '@/types/healthcare';

// ============================================================================
// TYPES
// ============================================================================

export interface ResourceStats {
  [key: string]: number | string | undefined;
}

export interface StatsCardConfig {
  key: string;
  label: string;
  icon?: LucideIcon;
}

export interface FilterConfig {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

export interface ResourceListPageProps<T> {
  // Module config
  module: HealthcareModule;
  basePath: string;

  // API config
  endpoint: string;
  queryKey: string;
  statsEndpoint?: string;

  // Page content
  title: string;
  subtitle?: string;
  icon: LucideIcon;

  // Stats cards
  statsCards?: StatsCardConfig[];

  // Table columns
  columns: Column<T>[];
  rowKey: (item: T) => string;

  // Optional row customization
  rowClassName?: (item: T) => string;
  onRowClick?: (item: T) => void;

  // Filters
  filters?: FilterConfig[];
  searchPlaceholder?: string;
  showSearch?: boolean;

  // Actions
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAdd?: () => void;
  headerActions?: ReactNode;

  // Empty state
  emptyTitle?: string;
  emptyDescription?: string;

  // Display options
  compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ResourceListPage<T>({
  module,
  basePath,
  endpoint,
  queryKey,
  statsEndpoint,
  title,
  subtitle,
  icon: Icon,
  statsCards = [],
  columns,
  rowKey,
  rowClassName,
  onRowClick,
  filters: externalFilters = [],
  searchPlaceholder,
  showSearch = true,
  showAddButton = true,
  addButtonLabel,
  onAdd,
  headerActions,
  emptyTitle,
  emptyDescription,
  compact = false,
}: ResourceListPageProps<T>) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    externalFilters.forEach(f => { initial[f.name] = f.value; });
    return initial;
  });

  // Fetch data
  const { data: response, isLoading, error } = useQuery({
    queryKey: [queryKey, searchTerm, filterValues, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      Object.entries(filterValues).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.append(key, value);
        }
      });

      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());

      const url = `${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await api.get<PaginatedResponse<T[]>>(url);
      return result.data;
    },
  });

  // Fetch stats (optional)
  const { data: stats } = useQuery({
    queryKey: [`${queryKey}-stats`],
    queryFn: async () => {
      if (!statsEndpoint) return null;
      const response = await api.get<{ data: ResourceStats }>(statsEndpoint);
      return response.data.data;
    },
    enabled: !!statsEndpoint,
  });

  // Handlers
  const handleAdd = () => {
    if (onAdd) {
      onAdd();
    } else {
      navigate(`${basePath}/new`);
    }
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Pagination data
  const paginatedData = useMemo(() => {
    const data = response?.data || [];
    const total = response?.meta?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    return { data, total, totalPages };
  }, [response, itemsPerPage]);

  // Build filters
  const allFilters = externalFilters.map(filter => ({
    ...filter,
    value: filterValues[filter.name] || filter.value,
    onChange: (value: string) => handleFilterChange(filter.name, value),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={Icon}
        module={module}
        actions={
          <>
            {headerActions}
            {showAddButton && (
              <Button module={module} icon={Plus} onClick={handleAdd}>
                {addButtonLabel || t(`${module}.add`)}
              </Button>
            )}
          </>
        }
      />

      {/* Stats Cards */}
      {stats && statsCards.length > 0 && (
        <div className={`grid gap-4 ${
          statsCards.length <= 3 ? 'md:grid-cols-3' :
          statsCards.length === 4 ? 'md:grid-cols-4' :
          'md:grid-cols-3 lg:grid-cols-6'
        }`}>
          {statsCards.map((card) => {
            const value = stats[card.key];
            return (
              <StatsCard
                key={card.key}
                label={card.label}
                value={typeof value === 'number' ? value : 0}
                icon={card.icon || Icon}
                module={module}
              />
            );
          })}
        </div>
      )}

      {/* Filters */}
      {(showSearch || allFilters.length > 0) && (
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={(term) => { setSearchTerm(term); setCurrentPage(1); }}
          searchPlaceholder={searchPlaceholder || t(`${module}.search`)}
          module={module}
          filters={allFilters}
        />
      )}

      {/* Data Table */}
      <SectionCard>
        <DataTable
          data={paginatedData.data}
          columns={columns}
          isLoading={isLoading}
          error={error as Error | null}
          module={module}
          rowKey={rowKey}
          rowClassName={rowClassName}
          onRowClick={onRowClick}
          compact={compact}
          currentPage={currentPage}
          totalPages={paginatedData.totalPages}
          totalItems={paginatedData.total}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          emptyIcon={Icon}
          emptyTitle={emptyTitle || t(`${module}.noResults`)}
          emptyDescription={emptyDescription}
          emptyAction={showAddButton ? {
            label: addButtonLabel || t(`${module}.add`),
            onClick: handleAdd,
          } : undefined}
        />
      </SectionCard>
    </div>
  );
}

export default ResourceListPage;
