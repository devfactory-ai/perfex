/**
 * Ophthalmology Consultations Page
 * List and manage ophthalmology consultations
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Plus,
  Search,
  Calendar,
  ChevronRight,
  Clock,
  FileText,
  Eye,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';

export default function OphthalmologyConsultationsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const { data: consultations, isLoading } = useQuery({
    queryKey: ['ophthalmology-consultations', searchTerm, dateFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (dateFilter !== 'all') params.append('period', dateFilter);
      const response = await api.get(`/ophthalmology/consultations?${params}`);
      return response.data?.data || [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="h-7 w-7 text-blue-500" />
            {t('consultations') || 'Consultations Ophtalmologie'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('consultationsDescription') || 'Gestion des consultations ophtalmologiques'}
          </p>
        </div>
        <button
          onClick={() => navigate('/ophthalmology/consultations/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {t('newConsultation') || 'Nouvelle Consultation'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchConsultations') || 'Rechercher une consultation...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('allDates') || 'Toutes les dates'}</option>
            <option value="today">{t('today') || 'Aujourd\'hui'}</option>
            <option value="week">{t('thisWeek') || 'Cette semaine'}</option>
            <option value="month">{t('thisMonth') || 'Ce mois'}</option>
          </select>
        </div>
      </div>

      {/* Consultations List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : consultations?.length === 0 ? (
          <div className="p-8 text-center">
            <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('noConsultations') || 'Aucune consultation trouvée'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {consultations?.map((consultation: any) => (
              <div
                key={consultation.id}
                onClick={() => navigate(`/ophthalmology/consultations/${consultation.id}`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {consultation.patientName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(consultation.status)}`}>
                          {consultation.status === 'completed' ? 'Terminée' :
                           consultation.status === 'scheduled' ? 'Planifiée' : 'Annulée'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(consultation.date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {consultation.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden md:block">
                      <p className="text-sm text-gray-600 dark:text-gray-400">{consultation.type}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">{consultation.doctor}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {consultation.diagnosis && (
                  <div className="mt-2 ml-16 text-sm text-gray-600 dark:text-gray-400">
                    <FileText className="h-4 w-4 inline mr-1" />
                    {consultation.diagnosis}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
