import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Shield,
  Award,
  RefreshCw,
  Plus,
  FileText,
  Calendar,
} from 'lucide-react';

interface DashboardStats {
  totalPatients: number;
  highRiskPatients: number;
  activeCohorts: number;
  indicatorsMetTarget: number;
  indicatorsTotal: number;
  avgRiskScore: number;
  riskDistribution: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
  qualityTrend: 'improving' | 'stable' | 'declining';
}

interface HighRiskPatient {
  id: string;
  patientName: string;
  riskScore: number;
  riskCategory: string;
  topFactor: string;
  trend: string;
}

interface QualityIndicator {
  id: string;
  code: string;
  name: string;
  value: number;
  target: number;
  meetsTarget: boolean;
  trend: string;
}

export default function PopulationHealthDashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [highRiskPatients, setHighRiskPatients] = useState<HighRiskPatient[]>([]);
  const [qualityIndicators, setQualityIndicators] = useState<QualityIndicator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simulated data - replace with actual API call
      setStats({
        totalPatients: 2847,
        highRiskPatients: 156,
        activeCohorts: 12,
        indicatorsMetTarget: 18,
        indicatorsTotal: 24,
        avgRiskScore: 32,
        riskDistribution: {
          low: 1856,
          moderate: 623,
          high: 312,
          critical: 56,
        },
        qualityTrend: 'improving',
      });

      setHighRiskPatients([
        {
          id: '1',
          patientName: 'Jean Dupont',
          riskScore: 89,
          riskCategory: 'critical',
          topFactor: 'Insuffisance rénale sévère',
          trend: 'worsening',
        },
        {
          id: '2',
          patientName: 'Marie Martin',
          riskScore: 82,
          riskCategory: 'very_high',
          topFactor: 'Diabète non contrôlé',
          trend: 'stable',
        },
        {
          id: '3',
          patientName: 'Pierre Bernard',
          riskScore: 78,
          riskCategory: 'high',
          topFactor: 'HTA sévère',
          trend: 'improving',
        },
        {
          id: '4',
          patientName: 'Sophie Petit',
          riskScore: 75,
          riskCategory: 'high',
          topFactor: 'Multi-comorbidités',
          trend: 'worsening',
        },
      ]);

      setQualityIndicators([
        {
          id: '1',
          code: 'DIA-01',
          name: 'Taux d\'hémoglobine > 10 g/dL',
          value: 87.5,
          target: 85,
          meetsTarget: true,
          trend: 'improving',
        },
        {
          id: '2',
          code: 'DIA-02',
          name: 'Kt/V > 1.2',
          value: 92.3,
          target: 90,
          meetsTarget: true,
          trend: 'stable',
        },
        {
          id: '3',
          code: 'CAR-01',
          name: 'Contrôle tensionnel',
          value: 68.2,
          target: 80,
          meetsTarget: false,
          trend: 'improving',
        },
        {
          id: '4',
          code: 'OPH-01',
          name: 'Dépistage rétinopathie',
          value: 78.5,
          target: 85,
          meetsTarget: false,
          trend: 'declining',
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'critical':
        return 'bg-red-500';
      case 'very_high':
        return 'bg-orange-500';
      case 'high':
        return 'bg-yellow-500';
      case 'moderate':
        return 'bg-blue-500';
      default:
        return 'bg-green-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'worsening':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Santé Populationnelle
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analyse prédictive et indicateurs qualité
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchDashboardData}
            className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <Link
            to="/population-health/iqss"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" />
            Rapport IQSS
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.totalPatients}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Patients suivis
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.highRiskPatients}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Patients à haut risque
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.indicatorsMetTarget}/{stats?.indicatorsTotal}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Indicateurs atteints
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              {stats?.qualityTrend === 'improving' ? (
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : stats?.qualityTrend === 'declining' ? (
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <Activity className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white capitalize">
              {stats?.qualityTrend === 'improving'
                ? 'En hausse'
                : stats?.qualityTrend === 'declining'
                ? 'En baisse'
                : 'Stable'}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Tendance qualité
          </p>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Distribution des Risques
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex h-8 rounded-lg overflow-hidden">
              <div
                className="bg-green-500"
                style={{
                  width: `${((stats?.riskDistribution.low || 0) / (stats?.totalPatients || 1)) * 100}%`,
                }}
              />
              <div
                className="bg-blue-500"
                style={{
                  width: `${((stats?.riskDistribution.moderate || 0) / (stats?.totalPatients || 1)) * 100}%`,
                }}
              />
              <div
                className="bg-yellow-500"
                style={{
                  width: `${((stats?.riskDistribution.high || 0) / (stats?.totalPatients || 1)) * 100}%`,
                }}
              />
              <div
                className="bg-red-500"
                style={{
                  width: `${((stats?.riskDistribution.critical || 0) / (stats?.totalPatients || 1)) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-sm text-gray-500">Faible</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats?.riskDistribution.low}
            </span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm text-gray-500">Modéré</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats?.riskDistribution.moderate}
            </span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span className="text-sm text-gray-500">Élevé</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats?.riskDistribution.high}
            </span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span className="text-sm text-gray-500">Critique</span>
            </div>
            <span className="text-lg font-semibold text-gray-900 dark:text-white">
              {stats?.riskDistribution.critical}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Risk Patients */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Patients à Haut Risque
            </h2>
            <Link
              to="/population-health/risk-scores"
              className="text-sm text-blue-600 hover:underline"
            >
              Voir tout
            </Link>
          </div>

          <div className="space-y-3">
            {highRiskPatients.map((patient) => (
              <Link
                key={patient.id}
                to={`/population-health/patient/${patient.id}`}
                className="block p-4 rounded-lg border hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${getRiskColor(
                        patient.riskCategory
                      )}`}
                    >
                      {patient.riskScore}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {patient.patientName}
                      </p>
                      <p className="text-sm text-gray-500">{patient.topFactor}</p>
                    </div>
                  </div>
                  {getTrendIcon(patient.trend)}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Quality Indicators */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Indicateurs Qualité
            </h2>
            <Link
              to="/population-health/quality-indicators"
              className="text-sm text-blue-600 hover:underline"
            >
              Voir tout
            </Link>
          </div>

          <div className="space-y-4">
            {qualityIndicators.map((indicator) => (
              <div key={indicator.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-500">
                      {indicator.code}
                    </span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {indicator.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(indicator.trend)}
                    <span
                      className={`text-sm font-semibold ${
                        indicator.meetsTarget ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {indicator.value}%
                    </span>
                  </div>
                </div>
                <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div
                    className={`absolute h-full rounded-full ${
                      indicator.meetsTarget ? 'bg-green-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(indicator.value, 100)}%` }}
                  />
                  <div
                    className="absolute h-full w-0.5 bg-gray-800 dark:bg-white"
                    style={{ left: `${indicator.target}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>Cible: {indicator.target}%</span>
                  <span>100%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          to="/population-health/cohorts"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border hover:border-blue-300 transition-colors"
        >
          <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Cohortes</p>
            <p className="text-sm text-gray-500">{stats?.activeCohorts} actives</p>
          </div>
        </Link>

        <Link
          to="/population-health/risk-models"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border hover:border-yellow-300 transition-colors"
        >
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <BarChart3 className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Modèles de Risque
            </p>
            <p className="text-sm text-gray-500">Stratification prédictive</p>
          </div>
        </Link>

        <Link
          to="/population-health/quality-indicators"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border hover:border-green-300 transition-colors"
        >
          <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
            <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Indicateurs IQSS
            </p>
            <p className="text-sm text-gray-500">Qualité et sécurité</p>
          </div>
        </Link>

        <Link
          to="/population-health/reports"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border hover:border-red-300 transition-colors"
        >
          <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
            <FileText className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Rapports</p>
            <p className="text-sm text-gray-500">Exports et analyses</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
