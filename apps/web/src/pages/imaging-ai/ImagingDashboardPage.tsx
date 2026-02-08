import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Activity,
  Heart,
  Eye,
  FileImage,
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  RefreshCw,
  Plus,
  Filter,
} from 'lucide-react';

interface DashboardStats {
  totalAnalyses: number;
  pendingReview: number;
  completedToday: number;
  criticalFindings: number;
  byModality: {
    ecg: number;
    oct: number;
    echo: number;
    fundus: number;
  };
  avgProcessingTime: number;
  aiAccuracy: number;
}

interface UrgentCase {
  id: string;
  patientName: string;
  modality: string;
  urgencyLevel: string;
  finding: string;
  timestamp: string;
}

export default function ImagingDashboardPage() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [urgentCases, setUrgentCases] = useState<UrgentCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Simulated data - replace with actual API call
      setStats({
        totalAnalyses: 1247,
        pendingReview: 23,
        completedToday: 45,
        criticalFindings: 3,
        byModality: {
          ecg: 523,
          oct: 387,
          echo: 234,
          fundus: 103,
        },
        avgProcessingTime: 12,
        aiAccuracy: 94.5,
      });

      setUrgentCases([
        {
          id: '1',
          patientName: 'Jean Dupont',
          modality: 'ECG',
          urgencyLevel: 'stat',
          finding: 'STEMI antérieur',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          patientName: 'Marie Martin',
          modality: 'Echo',
          urgencyLevel: 'urgent',
          finding: 'LVEF < 25%',
          timestamp: new Date().toISOString(),
        },
        {
          id: '3',
          patientName: 'Pierre Bernard',
          modality: 'OCT',
          urgencyLevel: 'priority',
          finding: 'Oedème maculaire sévère',
          timestamp: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModalityIcon = (modality: string) => {
    switch (modality.toLowerCase()) {
      case 'ecg':
        return <Activity className="h-5 w-5 text-red-500" />;
      case 'echo':
        return <Heart className="h-5 w-5 text-pink-500" />;
      case 'oct':
      case 'fundus':
        return <Eye className="h-5 w-5 text-blue-500" />;
      default:
        return <FileImage className="h-5 w-5 text-gray-500" />;
    }
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'stat':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'urgent':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'priority':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
            Imagerie IA
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Analyse diagnostique assistée par intelligence artificielle
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
            to="/imaging-ai/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Nouvelle Analyse
          </Link>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {stats && stats.criticalFindings > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-500" />
          <div>
            <p className="font-semibold text-red-800">
              {stats.criticalFindings} résultat(s) critique(s) nécessitent une attention immédiate
            </p>
            <Link to="/imaging-ai/urgent" className="text-sm text-red-600 hover:underline">
              Voir les cas urgents
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FileImage className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.totalAnalyses}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Analyses totales
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.pendingReview}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            En attente de révision
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.completedToday}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Complétées aujourd'hui
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats?.aiAccuracy}%
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Précision IA
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modalities */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Par Modalité
          </h2>
          <div className="space-y-4">
            <Link
              to="/imaging-ai/ecg"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Activity className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">ECG</p>
                  <p className="text-sm text-gray-500">Électrocardiogramme</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats?.byModality.ecg}
              </span>
            </Link>

            <Link
              to="/imaging-ai/oct"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">OCT</p>
                  <p className="text-sm text-gray-500">Tomographie par cohérence optique</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats?.byModality.oct}
              </span>
            </Link>

            <Link
              to="/imaging-ai/echo"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                  <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Échocardiographie</p>
                  <p className="text-sm text-gray-500">Échographie cardiaque</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats?.byModality.echo}
              </span>
            </Link>

            <Link
              to="/imaging-ai/fundus"
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Fond d'oeil</p>
                  <p className="text-sm text-gray-500">Rétinographie</p>
                </div>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {stats?.byModality.fundus}
              </span>
            </Link>
          </div>
        </div>

        {/* Urgent Cases */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Cas Urgents
            </h2>
            <Link
              to="/imaging-ai/urgent"
              className="text-sm text-blue-600 hover:underline"
            >
              Voir tout
            </Link>
          </div>

          {urgentCases.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>Aucun cas urgent en attente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {urgentCases.map((caseItem) => (
                <Link
                  key={caseItem.id}
                  to={`/imaging-ai/analysis/${caseItem.id}`}
                  className="block p-4 rounded-lg border hover:border-blue-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getModalityIcon(caseItem.modality)}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {caseItem.patientName}
                        </p>
                        <p className="text-sm text-gray-500">{caseItem.modality}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full border ${getUrgencyColor(
                        caseItem.urgencyLevel
                      )}`}
                    >
                      {caseItem.urgencyLevel.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 pl-8">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">
                      {caseItem.finding}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(caseItem.timestamp).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/imaging-ai/analysis"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border hover:border-blue-300 transition-colors"
        >
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <FileImage className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Toutes les analyses
            </p>
            <p className="text-sm text-gray-500">
              Historique complet des analyses
            </p>
          </div>
        </Link>

        <Link
          to="/imaging-ai/pending"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border hover:border-yellow-300 transition-colors"
        >
          <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
            <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              En attente de révision
            </p>
            <p className="text-sm text-gray-500">
              {stats?.pendingReview} analyse(s) à valider
            </p>
          </div>
        </Link>

        <Link
          to="/imaging-ai/reports"
          className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border hover:border-green-300 transition-colors"
        >
          <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
            <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Rapports & Statistiques
            </p>
            <p className="text-sm text-gray-500">
              Performance IA et métriques
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
