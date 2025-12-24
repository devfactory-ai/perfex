/**
 * Ophthalmology Patients Page
 * List of ophthalmology patients with search and filters
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  Plus,
  Search,
  AlertTriangle,
  Calendar,
  User,
  ChevronRight,
  Glasses,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';

interface OphthalmologyPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  primaryDiagnosis: string;
  lastConsultation: string;
  nextAppointment: string;
  hasActiveAlerts: boolean;
  hasIolImplant: boolean;
  hasGlaucoma: boolean;
  hasDmla: boolean;
}

export default function OphthalmologyPatientsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState<string>('all');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['ophthalmology-patients', searchTerm, conditionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (conditionFilter !== 'all') params.append('condition', conditionFilter);
      const response = await api.get(`/ophthalmology/patients?${params}`);
      return response.data?.data || [];
    },
  });

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="h-7 w-7 text-blue-500" />
            {t('ophthalmologyPatients') || 'Patients Ophtalmologie'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('ophthalmologyPatientsDescription') || 'Gestion des patients ophtalmologiques'}
          </p>
        </div>
        <button
          onClick={() => navigate('/ophthalmology/patients/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          {t('newPatient') || 'Nouveau Patient'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchPatients') || 'Rechercher un patient...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Condition Filter */}
          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">{t('allConditions') || 'Toutes les pathologies'}</option>
            <option value="glaucoma">{t('glaucoma') || 'Glaucome'}</option>
            <option value="dmla">{t('dmla') || 'DMLA'}</option>
            <option value="cataract">{t('cataract') || 'Cataracte'}</option>
            <option value="diabeticRetinopathy">{t('diabeticRetinopathy') || 'Rétinopathie diabétique'}</option>
            <option value="iol">{t('iolImplant') || 'Implant IOL'}</option>
          </select>
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t('loading') || 'Chargement...'}</p>
          </div>
        ) : patients?.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('noPatients') || 'Aucun patient trouvé'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {patients?.map((patient: OphthalmologyPatient) => (
              <div
                key={patient.id}
                onClick={() => navigate(`/ophthalmology/patients/${patient.id}`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {patient.lastName} {patient.firstName}
                        </h3>
                        {patient.hasActiveAlerts && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span>{calculateAge(patient.dateOfBirth)} ans</span>
                        <span>•</span>
                        <span>{patient.gender === 'male' ? 'H' : 'F'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Condition Badges */}
                    <div className="flex items-center gap-2">
                      {patient.hasGlaucoma && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded text-xs">
                          Glaucome
                        </span>
                      )}
                      {patient.hasDmla && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded text-xs">
                          DMLA
                        </span>
                      )}
                      {patient.hasIolImplant && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs flex items-center gap-1">
                          <Glasses className="h-3 w-3" />
                          IOL
                        </span>
                      )}
                    </div>

                    {/* Last Consultation */}
                    {patient.lastConsultation && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 hidden md:block">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(patient.lastConsultation).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    )}

                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>

                {/* Primary Diagnosis */}
                {patient.primaryDiagnosis && (
                  <div className="mt-2 ml-16 text-sm text-gray-600 dark:text-gray-400">
                    <Eye className="h-4 w-4 inline mr-1" />
                    {patient.primaryDiagnosis}
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
