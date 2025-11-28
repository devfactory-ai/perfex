/**
 * Audit Dashboard Page
 * Smart Audit System main dashboard with EF1, EF2, EF3 modules overview
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ClipboardCheck,
  AlertTriangle,
  Shield,
  TrendingUp,
  CheckCircle,
  Sparkles,
  Activity,
  Target,
} from 'lucide-react';
import { api } from '@/lib/api';

interface DashboardStats {
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasksCount: number;
  averageRiskScore: number;
  highRiskEntities: number;
  complianceRate: number;
  findingsCount: number;
  proposalsInProgress: number;
  tasksGeneratedByAI: number;
}

export function AuditDashboardPage() {
  const [dateRange, setDateRange] = useState('30');

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['audit-dashboard'],
    queryFn: async () => {
      const response = await api.get('/audit/dashboard');
      return response.data.data;
    },
  });

  const statCards = [
    {
      title: 'Tâches d\'Audit',
      value: stats?.totalTasks || 0,
      subtitle: `${stats?.pendingTasks || 0} en attente`,
      icon: ClipboardCheck,
      color: 'blue',
      link: '/audit/tasks',
    },
    {
      title: 'Score de Risque Moyen',
      value: `${Math.round(stats?.averageRiskScore || 0)}%`,
      subtitle: `${stats?.highRiskEntities || 0} entités à haut risque`,
      icon: AlertTriangle,
      color: stats?.averageRiskScore && stats.averageRiskScore > 70 ? 'red' : 'yellow',
      link: '/audit/risk',
    },
    {
      title: 'Taux de Conformité',
      value: `${Math.round(stats?.complianceRate || 0)}%`,
      subtitle: 'ISO 9001 & standards',
      icon: Shield,
      color: stats?.complianceRate && stats.complianceRate >= 90 ? 'green' : 'orange',
      link: '/audit/compliance',
    },
    {
      title: 'Propositions en Cours',
      value: stats?.proposalsInProgress || 0,
      subtitle: `${stats?.tasksGeneratedByAI || 0} générées par IA`,
      icon: TrendingUp,
      color: 'purple',
      link: '/audit/proposals',
    },
  ];

  const modules = [
    {
      id: 'ef1',
      title: 'EF1: Évaluation des Risques',
      description: 'Modèle dynamique d\'évaluation des risques qualité avec analyse IA',
      icon: Target,
      color: 'bg-blue-500',
      link: '/audit/risk',
      features: ['Analyse NLP des données', 'Score de risque 0-100', 'Génération auto de tâches'],
    },
    {
      id: 'ef2',
      title: 'EF2: Copilote Conformité',
      description: 'Assistant IA pour la conformité manufacturière (ISO 9001, OSHA)',
      icon: Shield,
      color: 'bg-green-500',
      link: '/audit/compliance',
      features: ['Chat avec base de connaissances', 'Vérification de conformité', 'Insights exploitables'],
    },
    {
      id: 'ef3',
      title: 'EF3: Analyse des Points Communs',
      description: 'Agent ReAct pour l\'analyse des patterns et recommandations',
      icon: Activity,
      color: 'bg-purple-500',
      link: '/audit/commonality',
      features: ['Framework ReAct', 'Analyse des variantes', 'Propositions d\'amélioration'],
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Smart Audit System
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Système d'audit intelligent propulsé par l'IA
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="7">7 derniers jours</option>
            <option value="30">30 derniers jours</option>
            <option value="90">90 derniers jours</option>
          </select>
          <Link
            to="/audit/tasks/new"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Nouvelle Tâche
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Link
            key={index}
            to={stat.link}
            className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.subtitle}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Modules Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.id}
            to={module.link}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className={`${module.color} p-4`}>
              <div className="flex items-center text-white">
                <module.icon className="h-8 w-8" />
                <span className="ml-3 text-lg font-bold">{module.title}</span>
              </div>
            </div>
            <div className="p-5">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {module.description}
              </p>
              <ul className="space-y-2">
                {module.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Audit Tasks */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Tâches Récentes
              </h2>
              <Link
                to="/audit/tasks"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Voir tout
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Placeholder for recent tasks */}
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucune tâche récente</p>
                <Link
                  to="/audit/tasks/new"
                  className="text-sm text-blue-600 hover:text-blue-700 mt-2 inline-block"
                >
                  Créer une première tâche
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                Insights IA
              </h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Placeholder for AI insights */}
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun insight disponible</p>
                <p className="text-sm mt-1">
                  Lancez une évaluation de risque pour générer des insights
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Heatmap Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Carte des Risques
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-4 gap-4">
            {['Qualité', 'Processus', 'Fournisseurs', 'Conformité'].map((category, idx) => (
              <div
                key={category}
                className={`p-4 rounded-lg text-center ${
                  idx === 0 ? 'bg-green-100 text-green-800' :
                  idx === 1 ? 'bg-yellow-100 text-yellow-800' :
                  idx === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}
              >
                <p className="font-medium">{category}</p>
                <p className="text-2xl font-bold mt-1">{20 + idx * 15}%</p>
                <p className="text-xs mt-1">Score de risque</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
