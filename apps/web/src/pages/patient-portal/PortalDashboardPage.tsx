// @ts-nocheck
/**
 * Patient Portal Dashboard Page
 * Main dashboard for patients to view their health information
 */

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import {
  Heart,
  Calendar,
  FileText,
  Pill,
  MessageSquare,
  Activity,
  Bell,
  ChevronRight,
  Clock,
  AlertCircle,
  CheckCircle,
  Beaker,
  BookOpen
} from 'lucide-react';

interface PortalDashboardData {
  patient: {
    firstName: string;
    lastName: string;
    patientNumber: string;
    module: string;
  };
  upcomingAppointments: Array<{
    id: string;
    date: string;
    time: string;
    type: string;
    provider: string;
    location: string;
  }>;
  recentLabResults: Array<{
    id: string;
    testName: string;
    date: string;
    status: 'normal' | 'abnormal' | 'critical';
  }>;
  currentMedications: Array<{
    id: string;
    name: string;
    dosage: string;
    frequency: string;
  }>;
  unreadMessages: number;
  pendingDocuments: number;
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'urgent';
    date: string;
  }>;
}

export function PortalDashboardPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['portal-dashboard'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<PortalDashboardData>>('/patient-portal/dashboard', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('portalToken')}`,
        },
      });
      return response.data.data;
    },
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'abnormal': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'urgent': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-amber-500" />;
      default: return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Heart className="h-8 w-8" />
              </div>
              <div>
                <p className="text-blue-100 text-sm">{getGreeting()}</p>
                <h1 className="text-2xl font-bold">
                  {dashboard?.patient?.firstName} {dashboard?.patient?.lastName}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/portal/messages"
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <MessageSquare className="h-6 w-6" />
                {(dashboard?.unreadMessages || 0) > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {dashboard?.unreadMessages}
                  </span>
                )}
              </Link>
              <Link
                to="/portal/notifications"
                className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Bell className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Alerts */}
        {dashboard?.alerts && dashboard.alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {dashboard.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg flex items-start gap-3 ${
                  alert.severity === 'urgent'
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : alert.severity === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                }`}
              >
                {getSeverityIcon(alert.severity)}
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{alert.message}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(alert.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Link
            to="/portal/appointments"
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rendez-vous</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {dashboard?.upcomingAppointments?.length || 0}
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/portal/lab-results"
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Beaker className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Résultats labo</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {dashboard?.recentLabResults?.length || 0}
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/portal/medications"
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Pill className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Médicaments</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {dashboard?.currentMedications?.length || 0}
                </p>
              </div>
            </div>
          </Link>

          <Link
            to="/portal/documents"
            className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Documents</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {dashboard?.pendingDocuments || 0}
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upcoming Appointments */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Prochains rendez-vous
              </h2>
              <Link
                to="/portal/appointments"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Voir tout <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4">
              {dashboard?.upcomingAppointments && dashboard.upcomingAppointments.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.upcomingAppointments.slice(0, 3).map((apt) => (
                    <div key={apt.id} className="flex items-start gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{apt.type}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(apt.date)} à {apt.time}
                        </p>
                        <p className="text-sm text-gray-500">
                          {apt.provider} - {apt.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun rendez-vous à venir</p>
                  <Link
                    to="/portal/appointments/request"
                    className="text-blue-600 hover:underline text-sm mt-2 inline-block"
                  >
                    Demander un rendez-vous
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Recent Lab Results */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Beaker className="h-5 w-5 text-purple-500" />
                Résultats récents
              </h2>
              <Link
                to="/portal/lab-results"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Voir tout <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4">
              {dashboard?.recentLabResults && dashboard.recentLabResults.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recentLabResults.slice(0, 4).map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{result.testName}</p>
                        <p className="text-sm text-gray-500">{formatDate(result.date)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                        {result.status === 'normal' && 'Normal'}
                        {result.status === 'abnormal' && 'Anormal'}
                        {result.status === 'critical' && 'Critique'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Beaker className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun résultat récent</p>
                </div>
              )}
            </div>
          </div>

          {/* Current Medications */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Pill className="h-5 w-5 text-green-500" />
                Médicaments actuels
              </h2>
              <Link
                to="/portal/medications"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                Voir tout <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4">
              {dashboard?.currentMedications && dashboard.currentMedications.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.currentMedications.slice(0, 4).map((med) => (
                    <div
                      key={med.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                    >
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{med.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {med.dosage} - {med.frequency}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Pill className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun médicament enregistré</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                Actions rapides
              </h2>
            </div>
            <div className="p-4 grid gap-3">
              <Link
                to="/portal/appointments/request"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Demander un rendez-vous</p>
                  <p className="text-sm text-gray-500">Planifier une consultation</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>

              <Link
                to="/portal/messages/new"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Envoyer un message</p>
                  <p className="text-sm text-gray-500">Contacter votre équipe médicale</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>

              <Link
                to="/portal/symptom-tracker"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Suivre mes symptômes</p>
                  <p className="text-sm text-gray-500">Enregistrer votre état de santé</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>

              <Link
                to="/portal/education"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">Éducation santé</p>
                  <p className="text-sm text-gray-500">Ressources et informations</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
