/**
 * Commonality Study Page (EF3)
 * ReAct agent for pattern analysis and improvement proposals
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  Play,
  RefreshCw,
  CheckCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  TrendingUp,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';

interface CommonalityStudy {
  id: string;
  studyNumber: string;
  title: string;
  description: string | null;
  studyType: string;
  status: string;
  approvalStatus: string;
  patternsFound: Array<{
    patternId: string;
    patternType: string;
    description: string;
    frequency: number;
    severity: string;
    confidence: number;
  }>;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    priority: string;
  }>;
  supplierInsights: Array<{
    supplierId: string;
    supplierName: string;
    performanceScore: number;
    issues: string[];
  }>;
  reactTrace: Array<{
    step: number;
    thought: string;
    action: string;
    observation: string;
  }>;
  createdAt: string;
}

const studyTypeLabels: Record<string, string> = {
  defect_pattern: 'Analyse des Défauts',
  supplier_comparison: 'Comparaison Fournisseurs',
  process_improvement: 'Amélioration Processus',
  root_cause: 'Analyse Cause Racine',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-500',
};

const approvalColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export function CommonalityStudyPage() {
  const queryClient = useQueryClient();
  const [studyType, setStudyType] = useState('defect_pattern');
  const [studyTitle, setStudyTitle] = useState('');
  const [selectedStudy, setSelectedStudy] = useState<CommonalityStudy | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const { data: studies, isLoading } = useQuery<CommonalityStudy[]>({
    queryKey: ['commonality-studies'],
    queryFn: async () => {
      const response = await api.get('/audit/commonality/studies');
      return response.data.data;
    },
  });

  const runAnalysisMutation = useMutation({
    mutationFn: async () => {
      setIsRunning(true);
      const response = await api.post('/audit/commonality/analyze', {
        title: studyTitle || `Étude ${studyTypeLabels[studyType]}`,
        studyType,
        maxIterations: 5,
        requiresApproval: true,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commonality-studies'] });
      setStudyTitle('');
      setIsRunning(false);
    },
    onError: () => {
      setIsRunning(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ studyId, approved }: { studyId: string; approved: boolean }) => {
      const response = await api.post(`/audit/commonality/studies/${studyId}/approve`, {
        approved,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commonality-studies'] });
      setSelectedStudy(null);
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Activity className="h-7 w-7 mr-3 text-purple-600" />
            EF3: Analyse des Points Communs
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Agent ReAct pour l'identification de patterns et recommandations d'amélioration
          </p>
        </div>
      </div>

      {/* New Study Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Nouvelle Étude
        </h2>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={studyTitle}
              onChange={(e) => setStudyTitle(e.target.value)}
              placeholder="Titre de l'étude (optionnel)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <select
            value={studyType}
            onChange={(e) => setStudyType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="defect_pattern">Analyse des Défauts</option>
            <option value="supplier_comparison">Comparaison Fournisseurs</option>
            <option value="process_improvement">Amélioration Processus</option>
            <option value="root_cause">Analyse Cause Racine</option>
          </select>
          <button
            onClick={() => runAnalysisMutation.mutate()}
            disabled={isRunning}
            className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyse ReAct en cours...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Lancer l'analyse
              </>
            )}
          </button>
        </div>
      </div>

      {/* Studies List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Études de Points Communs
          </h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
            </div>
          ) : (studies || []).length === 0 ? (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucune étude. Lancez votre première analyse ReAct.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Étude
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Patterns
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Approbation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(studies || []).map((study) => (
                  <tr key={study.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {study.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {study.studyNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {studyTypeLabels[study.studyType] || study.studyType}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {(study.patternsFound || []).length} identifiés
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[study.status]}`}>
                        {study.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${approvalColors[study.approvalStatus]}`}>
                        {study.approvalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedStudy(study)}
                          className="p-1 text-gray-400 hover:text-purple-600"
                          title="Voir détails"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {study.approvalStatus === 'pending' && (
                          <>
                            <button
                              onClick={() => approveMutation.mutate({ studyId: study.id, approved: true })}
                              className="p-1 text-gray-400 hover:text-green-600"
                              title="Approuver"
                            >
                              <ThumbsUp className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => approveMutation.mutate({ studyId: study.id, approved: false })}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Rejeter"
                            >
                              <ThumbsDown className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Study Details Modal */}
      {selectedStudy && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setSelectedStudy(null)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedStudy.title}
                  </h2>
                  <button
                    onClick={() => setSelectedStudy(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    &times;
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                {/* ReAct Trace */}
                {(selectedStudy.reactTrace || []).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-purple-500" />
                      Trace ReAct
                    </h3>
                    <div className="space-y-3">
                      {selectedStudy.reactTrace.map((step, idx) => (
                        <div key={idx} className="border-l-2 border-purple-300 pl-4">
                          <div className="text-xs text-purple-600 font-medium mb-1">
                            Étape {step.step}
                          </div>
                          <div className="text-sm">
                            <p className="text-gray-600 dark:text-gray-300">
                              <strong>Pensée:</strong> {step.thought}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300">
                              <strong>Action:</strong> {step.action}
                            </p>
                            <p className="text-gray-600 dark:text-gray-300">
                              <strong>Observation:</strong> {step.observation}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Patterns Found */}
                {(selectedStudy.patternsFound || []).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
                      Patterns Identifiés
                    </h3>
                    <div className="space-y-3">
                      {selectedStudy.patternsFound.map((pattern) => (
                        <div key={pattern.patternId} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {pattern.patternType}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              pattern.severity === 'critical' ? 'bg-red-100 text-red-800' :
                              pattern.severity === 'major' ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {pattern.severity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {pattern.description}
                          </p>
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <span>Fréquence: {pattern.frequency}</span>
                            <span className="mx-2">|</span>
                            <span>Confiance: {pattern.confidence}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {(selectedStudy.recommendations || []).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Lightbulb className="h-5 w-5 mr-2 text-yellow-500" />
                      Recommandations
                    </h3>
                    <ul className="space-y-2">
                      {selectedStudy.recommendations.map((rec) => (
                        <li key={rec.id} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{rec.title}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">{rec.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Supplier Insights */}
                {(selectedStudy.supplierInsights || []).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-indigo-500" />
                      Insights Fournisseurs
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {selectedStudy.supplierInsights.map((insight) => (
                        <div key={insight.supplierId} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {insight.supplierName}
                            </span>
                            <span className={`px-2 py-1 text-sm font-bold rounded ${
                              insight.performanceScore >= 70 ? 'bg-green-100 text-green-800' :
                              insight.performanceScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {insight.performanceScore}%
                            </span>
                          </div>
                          {insight.issues.length > 0 && (
                            <div className="text-sm text-red-600">
                              Problèmes: {insight.issues.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
