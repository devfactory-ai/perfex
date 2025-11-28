/**
 * Risk Assessment Page (EF1)
 * Dynamic risk assessment with AI-powered analysis
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Target,
  Play,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ChevronRight,
  BarChart3,
} from 'lucide-react';
import { api } from '@/lib/api';

interface RiskAssessment {
  id: string;
  assessmentNumber: string;
  assessmentType: string;
  assessmentDate: string;
  overallRiskScore: number;
  qualityRiskScore: number | null;
  processRiskScore: number | null;
  supplierRiskScore: number | null;
  complianceRiskScore: number | null;
  riskFactors: Array<{ factor: string; score: number; weight: number; description: string }>;
  recommendations: string[];
  tasksGenerated: number;
  status: string;
}

const getRiskColor = (score: number) => {
  if (score >= 70) return 'text-red-600 bg-red-100';
  if (score >= 40) return 'text-yellow-600 bg-yellow-100';
  return 'text-green-600 bg-green-100';
};

const getRiskBarColor = (score: number) => {
  if (score >= 70) return 'bg-red-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-green-500';
};

export function RiskAssessmentPage() {
  const queryClient = useQueryClient();
  const [assessmentType, setAssessmentType] = useState('work_order');
  const [isRunning, setIsRunning] = useState(false);

  const { data: assessments, isLoading } = useQuery<RiskAssessment[]>({
    queryKey: ['risk-assessments'],
    queryFn: async () => {
      const response = await api.get('/audit/risk/assessments');
      return response.data.data;
    },
  });

  const { data: _dashboard } = useQuery({
    queryKey: ['risk-dashboard'],
    queryFn: async () => {
      const response = await api.get('/audit/risk/dashboard');
      return response.data.data;
    },
  });

  const runAssessmentMutation = useMutation({
    mutationFn: async (type: string) => {
      setIsRunning(true);
      const response = await api.post('/audit/risk/assess', {
        assessmentType: type,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['risk-dashboard'] });
      setIsRunning(false);
    },
    onError: () => {
      setIsRunning(false);
    },
  });

  const generateTasksMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await api.post('/audit/risk/generate-tasks', {
        assessmentId,
        minRiskScore: 60,
        maxTasks: 5,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-assessments'] });
      queryClient.invalidateQueries({ queryKey: ['audit-tasks'] });
    },
  });

  const latestAssessment = assessments?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Target className="h-7 w-7 mr-3 text-blue-600" />
            EF1: Évaluation Dynamique des Risques
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Analyse IA des risques qualité avec génération automatique de tâches
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="work_order">Ordre de Fabrication</option>
            <option value="supplier">Fournisseur</option>
            <option value="process">Processus</option>
            <option value="product">Produit</option>
            <option value="facility">Installation</option>
          </select>
          <button
            onClick={() => runAssessmentMutation.mutate(assessmentType)}
            disabled={isRunning}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Lancer l'évaluation
              </>
            )}
          </button>
        </div>
      </div>

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Qualité', score: latestAssessment?.qualityRiskScore || 0, icon: BarChart3 },
          { label: 'Processus', score: latestAssessment?.processRiskScore || 0, icon: TrendingUp },
          { label: 'Fournisseurs', score: latestAssessment?.supplierRiskScore || 0, icon: AlertTriangle },
          { label: 'Conformité', score: latestAssessment?.complianceRiskScore || 0, icon: Target },
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <item.icon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {item.label}
                </span>
              </div>
              <span className={`px-2 py-1 text-sm font-bold rounded ${getRiskColor(item.score)}`}>
                {item.score}%
              </span>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getRiskBarColor(item.score)}`}
                  style={{ width: `${item.score}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Latest Assessment Details */}
      {latestAssessment && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Dernière Évaluation: {latestAssessment.assessmentNumber}
                </h2>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 text-sm font-bold rounded ${getRiskColor(latestAssessment.overallRiskScore)}`}>
                  Score Global: {latestAssessment.overallRiskScore}%
                </span>
                <button
                  onClick={() => generateTasksMutation.mutate(latestAssessment.id)}
                  disabled={generateTasksMutation.isPending}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-purple-600 bg-purple-100 rounded-lg hover:bg-purple-200"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Générer Tâches ({latestAssessment.tasksGenerated})
                </button>
              </div>
            </div>
          </div>
          <div className="p-6">
            {/* Risk Factors */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Facteurs de Risque Identifiés
              </h3>
              <div className="space-y-3">
                {(latestAssessment.riskFactors || []).map((factor, idx) => (
                  <div key={idx} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                          {factor.factor}
                        </span>
                        <span className={`text-sm font-bold ${
                          factor.score >= 70 ? 'text-red-600' :
                          factor.score >= 40 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {factor.score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${getRiskBarColor(factor.score)}`}
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {factor.description}
                      </p>
                    </div>
                  </div>
                ))}
                {(!latestAssessment.riskFactors || latestAssessment.riskFactors.length === 0) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucun facteur de risque spécifique identifié
                  </p>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Recommandations IA
              </h3>
              <ul className="space-y-2">
                {(latestAssessment.recommendations || []).map((rec, idx) => (
                  <li key={idx} className="flex items-start">
                    <ChevronRight className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">{rec}</span>
                  </li>
                ))}
                {(!latestAssessment.recommendations || latestAssessment.recommendations.length === 0) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Aucune recommandation disponible
                  </p>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Historical Assessments */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historique des Évaluations
          </h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
          ) : (assessments || []).length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucune évaluation de risque. Lancez votre première analyse.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Numéro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Tâches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {(assessments || []).map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {assessment.assessmentNumber}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {assessment.assessmentType.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-sm font-bold rounded ${getRiskColor(assessment.overallRiskScore)}`}>
                        {assessment.overallRiskScore}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {assessment.tasksGenerated} générées
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(assessment.assessmentDate).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
