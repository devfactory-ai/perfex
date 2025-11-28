/**
 * Audit Tasks Page
 * List and manage audit tasks with filters and search
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  MoreVertical,
} from 'lucide-react';
import { api } from '@/lib/api';

interface AuditTask {
  id: string;
  taskNumber: string;
  title: string;
  description: string | null;
  source: string;
  auditType: string;
  priority: string;
  riskScore: number | null;
  status: string;
  dueDate: string | null;
  aiGenerated: boolean;
  createdAt: string;
}

const priorityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

const statusIcons: Record<string, typeof ClipboardCheck> = {
  pending: Clock,
  in_progress: ClipboardCheck,
  completed: CheckCircle,
  cancelled: AlertTriangle,
};

export function AuditTasksPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-tasks', { searchTerm, statusFilter, typeFilter, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('auditType', typeFilter);
      params.append('page', page.toString());
      params.append('limit', '20');

      const response = await api.get(`/audit/tasks?${params}`);
      return response.data.data;
    },
  });

  const tasks: AuditTask[] = data?.items || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Tâches d'Audit
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez et suivez vos tâches d'audit qualité
          </p>
        </div>
        <Link
          to="/audit/tasks/new"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Tâche
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une tâche..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="in_progress">En cours</option>
            <option value="completed">Terminé</option>
            <option value="cancelled">Annulé</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="">Tous les types</option>
            <option value="quality">Qualité</option>
            <option value="process">Processus</option>
            <option value="supplier">Fournisseur</option>
            <option value="safety">Sécurité</option>
            <option value="compliance">Conformité</option>
          </select>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardCheck className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Aucune tâche d'audit
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Créez votre première tâche d'audit ou lancez une évaluation de risque.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/audit/tasks/new"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Tâche
              </Link>
              <Link
                to="/audit/risk"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Évaluation IA
              </Link>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tâche
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Priorité
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Risque
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date limite
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {tasks.map((task) => {
                const StatusIcon = statusIcons[task.status] || ClipboardCheck;
                return (
                  <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div>
                          <div className="flex items-center">
                            <Link
                              to={`/audit/tasks/${task.id}`}
                              className="text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600"
                            >
                              {task.title}
                            </Link>
                            {task.aiGenerated && (
                              <span title="Générée par IA">
                                <Sparkles className="h-4 w-4 ml-2 text-purple-500" />
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {task.taskNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-600 rounded capitalize">
                        {task.auditType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${priorityColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {task.riskScore !== null ? (
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${
                                task.riskScore >= 70 ? 'bg-red-500' :
                                task.riskScore >= 40 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${task.riskScore}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {task.riskScore}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <StatusIcon className={`h-4 w-4 mr-2 ${
                          task.status === 'completed' ? 'text-green-500' :
                          task.status === 'in_progress' ? 'text-blue-500' :
                          task.status === 'cancelled' ? 'text-red-500' :
                          'text-gray-400'
                        }`} />
                        <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-gray-500">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 disabled:opacity-50"
            >
              Précédent
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} sur {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300 disabled:opacity-50"
            >
              Suivant
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
