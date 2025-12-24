/**
 * Cardiology Patients Page
 * List of cardiology patients with search and filters
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Plus,
  Search,
  AlertTriangle,
  Activity,
  Calendar,
  User,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';

interface CardiologyPatient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryDiagnosis: string;
  lastConsultation: string;
  nextAppointment: string;
  hasActiveAlerts: boolean;
  hasPacemaker: boolean;
  hasStent: boolean;
}

export default function CardiologyPatientsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');

  const { data: patients, isLoading } = useQuery({
    queryKey: ['cardiology-patients', searchTerm, riskFilter, deviceFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (riskFilter !== 'all') params.append('riskLevel', riskFilter);
      if (deviceFilter !== 'all') params.append('device', deviceFilter);
      const response = await api.get(`/cardiology/patients?${params}`);
      return response.data?.data || [];
    },
  });

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
  };

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
            <Heart className="h-7 w-7 text-red-500" />
            {t('cardiologyPatients') || 'Patients Cardiologie'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('cardiologyPatientsDescription') || 'Gestion des patients cardiaques'}
          </p>
        </div>
        <button
          onClick={() => navigate('/cardiology/patients/new')}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
          >
            <option value="all">{t('allRiskLevels') || 'Tous les niveaux'}</option>
            <option value="critical">{t('critical') || 'Critique'}</option>
            <option value="high">{t('high') || 'Élevé'}</option>
            <option value="medium">{t('medium') || 'Moyen'}</option>
            <option value="low">{t('low') || 'Faible'}</option>
          </select>

          {/* Device Filter */}
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
          >
            <option value="all">{t('allDevices') || 'Tous les dispositifs'}</option>
            <option value="pacemaker">{t('pacemaker') || 'Pacemaker'}</option>
            <option value="stent">{t('stent') || 'Stent'}</option>
            <option value="none">{t('noDevice') || 'Sans dispositif'}</option>
          </select>
        </div>
      </div>

      {/* Patients List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">{t('loading') || 'Chargement...'}</p>
          </div>
        ) : patients?.length === 0 ? (
          <div className="p-8 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('noPatients') || 'Aucun patient trouvé'}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {patients?.map((patient: CardiologyPatient) => (
              <div
                key={patient.id}
                onClick={() => navigate(`/cardiology/patients/${patient.id}`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <User className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {patient.lastName} {patient.firstName}
                        </h3>
                        {patient.hasActiveAlerts && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span>{calculateAge(patient.dateOfBirth)} ans</span>
                        <span>•</span>
                        <span>{patient.gender === 'male' ? 'H' : 'F'}</span>
                        {patient.bloodType && (
                          <>
                            <span>•</span>
                            <span>{patient.bloodType}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Risk Badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(patient.riskLevel)}`}>
                      {patient.riskLevel === 'critical' ? 'Critique' :
                       patient.riskLevel === 'high' ? 'Élevé' :
                       patient.riskLevel === 'medium' ? 'Moyen' : 'Faible'}
                    </span>

                    {/* Devices */}
                    <div className="flex items-center gap-2">
                      {patient.hasPacemaker && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded text-xs">
                          PM
                        </span>
                      )}
                      {patient.hasStent && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs">
                          Stent
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
                    <Activity className="h-4 w-4 inline mr-1" />
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
