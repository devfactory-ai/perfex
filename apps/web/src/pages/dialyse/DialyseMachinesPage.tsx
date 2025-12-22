/**
 * Dialyse Machines Page
 * Manage dialysis machines and maintenance
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';

interface DialysisMachine {
  id: string;
  machineNumber: string;
  model: string;
  manufacturer: string | null;
  serialNumber: string | null;
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  isolationOnly: boolean;
  location: string | null;
  totalHours: number;
  totalSessions: number;
  installationDate: Date | null;
  lastMaintenanceDate: Date | null;
  nextMaintenanceDate: Date | null;
  warrantyExpiry: Date | null;
  notes: string | null;
}

interface MachineStats {
  totalMachines: number;
  availableMachines: number;
  inUseMachines: number;
  maintenanceMachines: number;
  outOfServiceMachines: number;
  isolationMachines: number;
}

interface MachineFormData {
  machineNumber: string;
  model: string;
  manufacturer?: string;
  serialNumber?: string;
  status: string;
  isolationOnly: boolean;
  location?: string;
  notes?: string;
}

export function DialyseMachinesPage() {
  const { t: _t } = useLanguage();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isolationFilter, setIsolationFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<DialysisMachine | null>(null);

  // Fetch machines
  const { data: machinesData, isLoading, error } = useQuery({
    queryKey: ['dialyse-machines', statusFilter, isolationFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (isolationFilter !== 'all') params.append('isolationOnly', isolationFilter);

      const url = `/dialyse/machines${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<ApiResponse<{ data: DialysisMachine[]; total: number }>>(url);
      return response.data.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['dialyse-machines-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<MachineStats>>('/dialyse/machines/stats');
      return response.data.data;
    },
  });

  // Create machine mutation
  const createMachine = useMutation({
    mutationFn: async (data: MachineFormData) => {
      await api.post('/dialyse/machines', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-machines'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-machines-stats'] });
      setIsModalOpen(false);
      alert('Machine créée avec succès');
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  // Update machine mutation
  const updateMachine = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MachineFormData> }) => {
      await api.put(`/dialyse/machines/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-machines'] });
      setIsModalOpen(false);
      setEditingMachine(null);
      alert('Machine mise à jour avec succès');
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  // Delete machine mutation
  const deleteMachine = useMutation({
    mutationFn: async (machineId: string) => {
      await api.delete(`/dialyse/machines/${machineId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-machines'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-machines-stats'] });
      alert('Machine supprimée avec succès');
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  const handleAddMachine = () => {
    setEditingMachine(null);
    setIsModalOpen(true);
  };

  const handleEditMachine = (machine: DialysisMachine) => {
    setEditingMachine(machine);
    setIsModalOpen(true);
  };

  const handleDelete = (machineId: string, machineNumber: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la machine "${machineNumber}" ?`)) {
      deleteMachine.mutate(machineId);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: MachineFormData = {
      machineNumber: formData.get('machineNumber') as string,
      model: formData.get('model') as string,
      manufacturer: formData.get('manufacturer') as string || undefined,
      serialNumber: formData.get('serialNumber') as string || undefined,
      status: formData.get('status') as string,
      isolationOnly: formData.get('isolationOnly') === 'true',
      location: formData.get('location') as string || undefined,
      notes: formData.get('notes') as string || undefined,
    };

    if (editingMachine) {
      updateMachine.mutate({ id: editingMachine.id, data });
    } else {
      createMachine.mutate(data);
    }
  };

  // Calculate paginated data
  const paginatedMachines = useMemo(() => {
    const machines = machinesData?.data || [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const data = machines.slice(startIndex, endIndex);
    const total = machines.length;
    const totalPages = Math.ceil(total / itemsPerPage);

    return { data, total, totalPages };
  }, [machinesData, currentPage, itemsPerPage]);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      out_of_service: 'bg-red-100 text-red-800',
    };
    const labels: Record<string, string> = {
      available: 'Disponible',
      in_use: 'En utilisation',
      maintenance: 'Maintenance',
      out_of_service: 'Hors service',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatHours = (hours: number): string => {
    return `${hours.toFixed(1)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Machines de Dialyse</h1>
          <p className="text-muted-foreground">
            Gestion des équipements et maintenance
          </p>
        </div>
        <button
          onClick={handleAddMachine}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Nouvelle Machine
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Total</div>
            <div className="mt-2 text-2xl font-bold">{stats.totalMachines}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Disponibles</div>
            <div className="mt-2 text-2xl font-bold text-green-600">{stats.availableMachines}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">En utilisation</div>
            <div className="mt-2 text-2xl font-bold text-blue-600">{stats.inUseMachines}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Maintenance</div>
            <div className="mt-2 text-2xl font-bold text-yellow-600">{stats.maintenanceMachines}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Hors service</div>
            <div className="mt-2 text-2xl font-bold text-red-600">{stats.outOfServiceMachines}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Isolation</div>
            <div className="mt-2 text-2xl font-bold text-orange-600">{stats.isolationMachines}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Tous les statuts</option>
          <option value="available">Disponible</option>
          <option value="in_use">En utilisation</option>
          <option value="maintenance">Maintenance</option>
          <option value="out_of_service">Hors service</option>
        </select>
        <select
          value={isolationFilter}
          onChange={(e) => { setIsolationFilter(e.target.value); setCurrentPage(1); }}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">Toutes</option>
          <option value="true">Isolation uniquement</option>
          <option value="false">Non isolation</option>
        </select>
      </div>

      {/* Machines List */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Chargement des machines...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">Erreur: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedMachines.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Numéro</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Modèle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Emplacement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Isolation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Utilisation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Proch. Maintenance</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedMachines.data.map((machine) => (
                    <tr key={machine.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 font-mono font-medium">{machine.machineNumber}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{machine.model}</div>
                          {machine.manufacturer && (
                            <div className="text-sm text-muted-foreground">{machine.manufacturer}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{machine.location || '-'}</td>
                      <td className="px-6 py-4">{getStatusBadge(machine.status)}</td>
                      <td className="px-6 py-4">
                        {machine.isolationOnly ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Oui
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Non</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>{formatHours(machine.totalHours)}</div>
                          <div className="text-muted-foreground">{machine.totalSessions} séances</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {machine.nextMaintenanceDate ? (
                          <span className={new Date(machine.nextMaintenanceDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                            {formatDate(machine.nextMaintenanceDate)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => handleEditMachine(machine)}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(machine.id, machine.machineNumber)}
                          className="text-destructive hover:text-destructive/80 font-medium"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={paginatedMachines.totalPages}
              totalItems={paginatedMachines.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title="Aucune machine trouvée"
            description="Ajoutez votre première machine de dialyse"
            icon="box"
            action={{
              label: 'Nouvelle Machine',
              onClick: handleAddMachine,
            }}
          />
        )}
      </div>

      {/* Machine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-lg mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingMachine ? 'Modifier la Machine' : 'Nouvelle Machine'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Numéro *</label>
                    <input
                      type="text"
                      name="machineNumber"
                      defaultValue={editingMachine?.machineNumber}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Modèle *</label>
                    <input
                      type="text"
                      name="model"
                      defaultValue={editingMachine?.model}
                      required
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Fabricant</label>
                    <input
                      type="text"
                      name="manufacturer"
                      defaultValue={editingMachine?.manufacturer || ''}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">N° Série</label>
                    <input
                      type="text"
                      name="serialNumber"
                      defaultValue={editingMachine?.serialNumber || ''}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Statut</label>
                    <select
                      name="status"
                      defaultValue={editingMachine?.status || 'available'}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="available">Disponible</option>
                      <option value="in_use">En utilisation</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="out_of_service">Hors service</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Emplacement</label>
                    <input
                      type="text"
                      name="location"
                      defaultValue={editingMachine?.location || ''}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isolationOnly"
                      value="true"
                      defaultChecked={editingMachine?.isolationOnly}
                      className="rounded border-input"
                    />
                    <span className="text-sm">Machine réservée à l'isolation</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    name="notes"
                    defaultValue={editingMachine?.notes || ''}
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => { setIsModalOpen(false); setEditingMachine(null); }}
                    className="px-4 py-2 rounded-md border text-sm font-medium hover:bg-accent"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                  >
                    {editingMachine ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
