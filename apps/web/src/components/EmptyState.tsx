/**
 * Empty State Component
 * Shows when there's no data to display with illustrations
 */

import { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: 'inbox' | 'search' | 'users' | 'document' | 'chart' | 'box' | 'folder';
  action?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

const EmptyStateIllustrations = {
  inbox: (
    <svg className="mx-auto h-24 w-24 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  search: (
    <svg className="mx-auto h-24 w-24 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  users: (
    <svg className="mx-auto h-24 w-24 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  document: (
    <svg className="mx-auto h-24 w-24 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  chart: (
    <svg className="mx-auto h-24 w-24 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  box: (
    <svg className="mx-auto h-24 w-24 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  folder: (
    <svg className="mx-auto h-24 w-24 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
};

export function EmptyState({
  title,
  description,
  icon = 'inbox',
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="p-12 text-center">
      <div className="mb-4">
        {EmptyStateIllustrations[icon]}
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {action.label}
        </button>
      )}

      {children}
    </div>
  );
}
