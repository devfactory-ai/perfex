/**
 * Dialyse Machines Page
 * Manage dialysis machines and maintenance
 * Uses standardized ResourceListPage component
 */

import { useNavigate } from 'react-router-dom';
import { Cpu } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ResourceListPage,
  Badge,
  ActionButtons,
  type Column,
  type StatsCardConfig,
} from '@/components/healthcare';
import type { DialyseMachine } from '@/types/healthcare';

// ============================================================================
// STATUS CONFIGURATIONS
// ============================================================================

const statusConfig: Record<string, { label: string; variant: 'gray' | 'blue' | 'green' | 'red' }> = {
  available: { label: 'Disponible', variant: 'green' },
  in_use: { label: 'En cours', variant: 'blue' },
  maintenance: { label: 'Maintenance', variant: 'gray' },
  out_of_service: { label: 'Hors service', variant: 'red' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const formatDate = (date: string | null): string => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('fr-FR');
};

const formatHours = (hours: number): string => {
  return `${hours.toFixed(1)}h`;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function DialyseMachinesPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Stats cards configuration
  const statsCards: StatsCardConfig[] = [
    { key: 'totalMachines', label: t('dialyse.total') },
    { key: 'availableMachines', label: t('dialyse.statusAvailable') },
    { key: 'inUseMachines', label: t('dialyse.statusInUse') },
    { key: 'maintenanceMachines', label: t('dialyse.maintenance') },
    { key: 'outOfServiceMachines', label: t('dialyse.statusOutOfService') },
    { key: 'isolationMachines', label: t('dialyse.isolation') },
  ];

  // Table columns
  const columns: Column<DialyseMachine>[] = [
    {
      key: 'machineNumber',
      header: t('dialyse.machineNumber'),
      render: (machine) => (
        <span className="font-mono font-medium">{machine.machineNumber}</span>
      ),
    },
    {
      key: 'model',
      header: t('dialyse.model'),
      render: (machine) => (
        <div>
          <div className="font-medium">{machine.model}</div>
          {machine.manufacturer && (
            <div className="text-sm text-muted-foreground">{machine.manufacturer}</div>
          )}
        </div>
      ),
    },
    {
      key: 'location',
      header: t('dialyse.location'),
      render: (machine) => (
        <span className="text-sm">{machine.location || '-'}</span>
      ),
    },
    {
      key: 'status',
      header: t('dialyse.status'),
      render: (machine) => {
        const config = statusConfig[machine.status] || statusConfig.available;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'isolation',
      header: t('dialyse.isolation'),
      render: (machine) => (
        machine.isolationOnly ? (
          <Badge variant="gray">{t('dialyse.yes')}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">{t('dialyse.no')}</span>
        )
      ),
    },
    {
      key: 'usage',
      header: t('dialyse.usage'),
      render: (machine) => (
        <div className="text-sm">
          <div>{formatHours(machine.totalHours)}</div>
          <div className="text-muted-foreground">{machine.totalSessions} {t('dialyse.sessions')}</div>
        </div>
      ),
    },
    {
      key: 'nextMaintenance',
      header: t('dialyse.nextMaintenance'),
      render: (machine) => {
        if (!machine.nextMaintenanceDate) return <span className="text-sm">-</span>;
        const isOverdue = new Date(machine.nextMaintenanceDate) < new Date();
        return (
          <span className={`text-sm ${isOverdue ? 'text-slate-800 dark:text-slate-300 font-medium' : ''}`}>
            {formatDate(machine.nextMaintenanceDate)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: t('dialyse.actions'),
      headerClassName: 'text-right',
      className: 'text-right',
      render: (machine) => (
        <ActionButtons
          onEdit={() => navigate(`/dialyse/machines/${machine.id}/edit`)}
          onDelete={() => {
            if (confirm(t('dialyse.confirmDeleteMachine').replace('{name}', machine.machineNumber))) {
              // Delete will be handled by ResourceListPage
            }
          }}
        />
      ),
    },
  ];

  // Filters
  const filters = [
    {
      name: 'status',
      value: 'all',
      options: [
        { value: 'all', label: t('dialyse.allStatuses') },
        { value: 'available', label: t('dialyse.statusAvailable') },
        { value: 'in_use', label: t('dialyse.statusInUse') },
        { value: 'maintenance', label: t('dialyse.maintenance') },
        { value: 'out_of_service', label: t('dialyse.statusOutOfService') },
      ],
      onChange: () => {},
    },
    {
      name: 'isolationOnly',
      value: 'all',
      options: [
        { value: 'all', label: t('dialyse.all') },
        { value: 'true', label: t('dialyse.isolationOnly') },
        { value: 'false', label: t('dialyse.nonIsolation') },
      ],
      onChange: () => {},
    },
  ];

  return (
    <ResourceListPage<DialyseMachine>
      module="dialyse"
      basePath="/dialyse/machines"
      endpoint="/dialyse/machines"
      queryKey="dialyse-machines"
      statsEndpoint="/dialyse/machines/stats"
      title={t('dialyse.machines')}
      subtitle={t('dialyse.machinesSubtitle')}
      icon={Cpu}
      statsCards={statsCards}
      columns={columns}
      rowKey={(machine) => machine.id}
      filters={filters}
      showSearch={false}
      addButtonLabel={t('dialyse.newMachine')}
      emptyTitle={t('dialyse.noMachinesFound')}
      emptyDescription={t('dialyse.addFirstMachine')}
    />
  );
}
