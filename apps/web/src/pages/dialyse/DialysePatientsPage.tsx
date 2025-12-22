/**
 * Dialyse Patients Page
 * Manage dialysis patients
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { EmptyState } from '@/components/EmptyState';
import { Pagination } from '@/components/Pagination';

interface DialysePatient {
  id: string;
  medicalId: string;
  patientStatus: 'active' | 'transferred' | 'deceased' | 'transplanted' | 'recovered';
  bloodType: string | null;
  hivStatus: 'negative' | 'positive' | 'unknown';
  hbvStatus: 'negative' | 'positive' | 'unknown';
  hcvStatus: 'negative' | 'positive' | 'unknown';
  requiresIsolation: boolean;
  dialysisStartDate: Date | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface PatientStats {
  totalPatients: number;
  activePatients: number;
  isolationPatients: number;
  recentlyAdded: number;
}

export function DialysePatientsPage() {
  const { t: _t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isolationFilter, setIsolationFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Fetch patients
  const { data: patientsData, isLoading, error } = useQuery({
    queryKey: ['dialyse-patients', searchTerm, statusFilter, isolationFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (isolationFilter !== 'all') params.append('requiresIsolation', isolationFilter);
      params.append('limit', '100');

      const url = `/dialyse/patients${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get<ApiResponse<DialysePatient[]>>(url);
      return response.data;
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['dialyse-patients-stats'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PatientStats>>('/dialyse/patients/stats');
      return response.data.data;
    },
  });

  // Delete patient mutation
  const deletePatient = useMutation({
    mutationFn: async (patientId: string) => {
      await api.delete(`/dialyse/patients/${patientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-patients'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-patients-stats'] });
      alert('Patient supprimé avec succès');
    },
    onError: (error) => {
      alert(`Erreur: ${getErrorMessage(error)}`);
    },
  });

  const handleAddPatient = () => {
    navigate('/dialyse/patients/new');
  };

  const handleViewPatient = (patientId: string) => {
    navigate(`/dialyse/patients/${patientId}`);
  };

  const handleEditPatient = (patientId: string) => {
    navigate(`/dialyse/patients/${patientId}/edit`);
  };

  const handleDelete = (patientId: string, patientName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${patientName}" ? Cette action est irréversible.`)) {
      deletePatient.mutate(patientId);
    }
  };

  // Calculate paginated data
  const paginatedPatients = useMemo(() => {
    const patients = patientsData?.data || [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const data = patients.slice(startIndex, endIndex);
    const total = patients.length;
    const totalPages = Math.ceil(total / itemsPerPage);

    return { data, total, totalPages };
  }, [patientsData, currentPage, itemsPerPage]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      transferred: 'bg-blue-100 text-blue-800',
      deceased: 'bg-gray-100 text-gray-800',
      transplanted: 'bg-purple-100 text-purple-800',
      recovered: 'bg-teal-100 text-teal-800',
    };
    const labels: Record<string, string> = {
      active: 'Actif',
      transferred: 'Transféré',
      deceased: 'Décédé',
      transplanted: 'Transplanté',
      recovered: 'Guéri',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getSerologyBadge = (status: string) => {
    if (status === 'positive') return <span className="text-red-600 font-medium">+</span>;
    if (status === 'negative') return <span className="text-green-600">-</span>;
    return <span className="text-gray-400">?</span>;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Patients Dialysés</h1>
          <p className="text-muted-foreground">
            Gestion des patients du centre de dialyse
          </p>
        </div>
        <button
          onClick={handleAddPatient}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Nouveau Patient
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Patients</div>
            <div className="mt-2 text-2xl font-bold">{stats.totalPatients}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Patients Actifs</div>
            <div className="mt-2 text-2xl font-bold text-green-600">{stats.activePatients}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">En Isolation</div>
            <div className="mt-2 text-2xl font-bold text-orange-600">{stats.isolationPatients}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm font-medium text-muted-foreground">Ajoutés Récemment</div>
            <div className="mt-2 text-2xl font-bold text-blue-600">{stats.recentlyAdded}</div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Rechercher un patient (nom, prénom, ID médical)..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="transferred">Transféré</option>
            <option value="transplanted">Transplanté</option>
            <option value="recovered">Guéri</option>
            <option value="deceased">Décédé</option>
          </select>
          <select
            value={isolationFilter}
            onChange={(e) => { setIsolationFilter(e.target.value); setCurrentPage(1); }}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">Tous</option>
            <option value="true">Isolation</option>
            <option value="false">Non isolation</option>
          </select>
        </div>
      </div>

      {/* Patients List */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Chargement des patients...</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-destructive">Erreur: {getErrorMessage(error)}</p>
          </div>
        ) : paginatedPatients.data.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID Médical</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Groupe Sanguin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Sérologie</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Isolation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Début Dialyse</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedPatients.data.map((patient) => (
                    <tr key={patient.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 text-sm font-mono">{patient.medicalId}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">
                            {patient.contact.firstName} {patient.contact.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">{patient.contact.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {patient.bloodType || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">HIV:</span>
                          {getSerologyBadge(patient.hivStatus)}
                          <span className="text-muted-foreground ml-2">HBV:</span>
                          {getSerologyBadge(patient.hbvStatus)}
                          <span className="text-muted-foreground ml-2">HCV:</span>
                          {getSerologyBadge(patient.hcvStatus)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {patient.requiresIsolation ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Oui
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Non</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(patient.dialysisStartDate)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(patient.patientStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => handleViewPatient(patient.id)}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          Voir
                        </button>
                        <button
                          onClick={() => handleEditPatient(patient.id)}
                          className="text-primary hover:text-primary/80 font-medium"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id, `${patient.contact.firstName} ${patient.contact.lastName}`)}
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
              totalPages={paginatedPatients.totalPages}
              totalItems={paginatedPatients.total}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        ) : (
          <EmptyState
            title="Aucun patient trouvé"
            description="Ajoutez votre premier patient dialysé"
            icon="users"
            action={{
              label: 'Nouveau Patient',
              onClick: handleAddPatient,
            }}
          />
        )}
      </div>
    </div>
  );
}
