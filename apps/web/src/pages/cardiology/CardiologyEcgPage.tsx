/**
 * Cardiology ECG Page
 * List and manage ECG recordings
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  Plus,
  Search,
  Calendar,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';

export default function CardiologyEcgPage() {
  useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [interpretationFilter, setInterpretationFilter] = useState<string>('all');

  const { data: ecgRecords, isLoading } = useQuery({
    queryKey: ['cardiology-ecg', searchTerm, interpretationFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (interpretationFilter !== 'all') params.append('interpretation', interpretationFilter);
      const response = await api.get(`/cardiology/ecg?${params}`);
      return response.data?.data || [];
    },
  });

  const getInterpretationColor = (interpretation: string) => {
    switch (interpretation) {
      case 'normal':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'abnormal':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'borderline':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
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
            <Zap className="h-7 w-7 text-red-500" />
            ECG
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Électrocardiogrammes et tracés
          </p>
        </div>
        <button
          onClick={() => navigate('/cardiology/ecg/new')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouvel ECG
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
            />
          </div>
          <select
            value={interpretationFilter}
            onChange={(e) => setInterpretationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
          >
            <option value="all">Toutes les interprétations</option>
            <option value="normal">Normal</option>
            <option value="abnormal">Anormal</option>
            <option value="borderline">Borderline</option>
          </select>
        </div>
      </div>

      {/* ECG List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : ecgRecords?.length === 0 ? (
          <div className="p-8 text-center">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Aucun ECG trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {ecgRecords?.map((ecg: any) => (
              <div
                key={ecg.id}
                onClick={() => navigate(`/cardiology/ecg/${ecg.id}`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {ecg.patientName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getInterpretationColor(ecg.interpretation)}`}>
                          {ecg.interpretation === 'normal' ? 'Normal' :
                           ecg.interpretation === 'abnormal' ? 'Anormal' : 'Limite'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(ecg.recordedAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {/* ECG Parameters */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">FC</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ecg.heartRate} bpm</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">PR</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ecg.prInterval} ms</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">QRS</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ecg.qrsDuration} ms</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">QT</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ecg.qtInterval} ms</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {ecg.findings && (
                  <div className="mt-2 ml-16 text-sm text-gray-600 dark:text-gray-400">
                    <Activity className="h-4 w-4 inline mr-1" />
                    {ecg.findings}
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
