/**
 * DataTable Component
 * Reusable table for listing data in healthcare modules
 */

import { type ReactNode } from 'react';
import { Pagination } from '@/components/Pagination';
import { InlineLoading, EmptyState } from './index';
import { type HealthcareModule } from './theme';
import { type LucideIcon } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  headerClassName?: string;
  render: (item: T, index: number) => ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  error?: Error | null;
  errorMessage?: string;
  module?: HealthcareModule;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
  // Empty state
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  // Row customization
  rowKey: (item: T) => string;
  rowClassName?: (item: T) => string;
  onRowClick?: (item: T) => void;
  // Styling
  compact?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DataTable<T>({
  data,
  columns,
  isLoading = false,
  error = null,
  errorMessage = 'Une erreur est survenue',
  module = 'dialyse',
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  emptyIcon,
  emptyTitle = 'Aucun élément trouvé',
  emptyDescription,
  emptyAction,
  rowKey,
  rowClassName,
  onRowClick,
  compact = false,
  striped = false,
  hoverable = true,
}: DataTableProps<T>) {
  const showPagination = currentPage && totalPages && onPageChange;
  const cellPadding = compact ? 'px-4 py-2' : 'px-6 py-4';
  const headerPadding = compact ? 'px-4 py-2' : 'px-6 py-3';

  if (isLoading) {
    return <InlineLoading rows={5} />;
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <p className="text-destructive">{errorMessage}: {error.message}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
        module={module}
        action={emptyAction}
      />
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b bg-muted/50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${headerPadding} text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${column.headerClassName || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((item, index) => (
              <tr
                key={rowKey(item)}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={`
                  ${hoverable ? 'hover:bg-muted/50' : ''}
                  ${striped && index % 2 === 1 ? 'bg-muted/25' : ''}
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${rowClassName ? rowClassName(item) : ''}
                `}
              >
                {columns.map((column) => (
                  <td
                    key={`${rowKey(item)}-${column.key}`}
                    className={`${cellPadding} ${column.className || ''}`}
                  >
                    {column.render(item, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems || 0}
          itemsPerPage={itemsPerPage || 25}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      )}
    </>
  );
}

// ============================================================================
// CARD LIST VARIANT (for mobile-friendly layouts)
// ============================================================================

export interface CardListProps<T> {
  data: T[];
  isLoading?: boolean;
  error?: Error | null;
  errorMessage?: string;
  module?: HealthcareModule;
  renderCard: (item: T, index: number) => ReactNode;
  // Pagination
  currentPage?: number;
  totalPages?: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onItemsPerPageChange?: (perPage: number) => void;
  // Empty state
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: {
    label: string;
    onClick: () => void;
  };
  rowKey: (item: T) => string;
  gridCols?: 1 | 2 | 3 | 4;
}

export function CardList<T>({
  data,
  isLoading = false,
  error = null,
  errorMessage = 'Une erreur est survenue',
  module = 'dialyse',
  renderCard,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  emptyIcon,
  emptyTitle = 'Aucun élément trouvé',
  emptyDescription,
  emptyAction,
  rowKey,
  gridCols = 1,
}: CardListProps<T>) {
  const showPagination = currentPage && totalPages && onPageChange;

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  if (isLoading) {
    return <InlineLoading rows={5} />;
  }

  if (error) {
    return (
      <div className="p-12 text-center">
        <p className="text-destructive">{errorMessage}: {error.message}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
        module={module}
        action={emptyAction}
      />
    );
  }

  return (
    <>
      <div className={`grid gap-4 ${gridColsClass[gridCols]}`}>
        {data.map((item, index) => (
          <div key={rowKey(item)}>{renderCard(item, index)}</div>
        ))}
      </div>

      {showPagination && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems || 0}
            itemsPerPage={itemsPerPage || 25}
            onPageChange={onPageChange}
            onItemsPerPageChange={onItemsPerPageChange}
          />
        </div>
      )}
    </>
  );
}
