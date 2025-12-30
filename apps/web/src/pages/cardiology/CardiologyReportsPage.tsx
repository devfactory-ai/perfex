/**
 * Cardiology Reports Page
 * Statistics and reporting
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Heart,
  Calendar,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import {
  PageHeader,
  SectionCard,
  InlineLoading,
} from '../../components/healthcare';

export default function CardiologyReportsPage() {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState('month');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['cardiology-reports', dateRange],
    queryFn: async () => {
      const response = await api.get(`/cardiology/reports/stats?range=${dateRange}`);
      return response.data?.data || {
        totalPatients: 0,
        newPatients: 0,
        ecgCount: 0,
        echoCount: 0,
        pacemakerCount: 0,
        stentCount: 0,
        avgAppointmentsPerDay: 0,
        criticalEvents: 0,
      };
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('cardiology.reports') || 'Rapports'}
        subtitle={t('cardiology.statistics') || 'Statistiques et rapports'}
        icon={BarChart3}
        module="cardiology"
        actions={
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-slate-500"
          >
            <option value="week">7 derniers jours</option>
            <option value="month">30 derniers jours</option>
            <option value="quarter">3 derniers mois</option>
            <option value="year">12 derniers mois</option>
          </select>
        }
      />

      {isLoading ? (
        <SectionCard>
          <InlineLoading rows={5} />
        </SectionCard>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <SectionCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Patients</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPatients}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                  <Users className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
              <div className="mt-2 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-slate-500 dark:text-slate-400 mr-1" />
                <span className="text-slate-600 dark:text-slate-400">+{stats.newPatients}</span>
                <span className="text-gray-500 dark:text-gray-400 ml-1">nouveaux</span>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">ECG</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.ecgCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Échocardiographies</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.echoCount}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">RDV / Jour</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.avgAppointmentsPerDay}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Additional Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <SectionCard>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Dispositifs</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Pacemakers</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.pacemakerCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Stents</span>
                  <span className="font-medium text-gray-900 dark:text-white">{stats.stentCount}</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Événements critiques</h3>
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-600 dark:text-slate-400">{stats.criticalEvents}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">cette période</p>
              </div>
            </SectionCard>

            <SectionCard>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activité</h3>
              <div className="text-center text-gray-500 dark:text-gray-400">
                <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Graphiques disponibles prochainement</p>
              </div>
            </SectionCard>
          </div>
        </>
      )}
    </div>
  );
}
