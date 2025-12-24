/**
 * Cardiology Patient Detail Page
 * Complete patient file with all cardiology data
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Heart,
  ArrowLeft,
  Edit,
  User,
  Phone,
  Activity,
  AlertTriangle,
  Calendar,
  Zap,
  Radio,
  Stethoscope,
  Pill,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';

type TabType = 'overview' | 'consultations' | 'ecg' | 'echo' | 'devices' | 'medications' | 'events';

export default function CardiologyPatientDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['cardiology-patient', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/patients/${id}`);
      return response.data?.data;
    },
  });

  const { data: consultations } = useQuery({
    queryKey: ['cardiology-patient-consultations', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/consultations?patientId=${id}`);
      return response.data?.data || [];
    },
    enabled: activeTab === 'consultations' || activeTab === 'overview',
  });

  const { data: ecgRecords } = useQuery({
    queryKey: ['cardiology-patient-ecg', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/ecg?patientId=${id}`);
      return response.data?.data || [];
    },
    enabled: activeTab === 'ecg' || activeTab === 'overview',
  });

  const { data: devices } = useQuery({
    queryKey: ['cardiology-patient-devices', id],
    queryFn: async () => {
      const [pacemakers, stents] = await Promise.all([
        api.get(`/cardiology/pacemakers?patientId=${id}`),
        api.get(`/cardiology/stents?patientId=${id}`),
      ]);
      return {
        pacemakers: pacemakers.data?.data || [],
        stents: stents.data?.data || [],
      };
    },
    enabled: activeTab === 'devices' || activeTab === 'overview',
  });

  const { data: medications } = useQuery({
    queryKey: ['cardiology-patient-medications', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/medications?patientId=${id}&status=active`);
      return response.data?.data || [];
    },
    enabled: activeTab === 'medications' || activeTab === 'overview',
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

  const tabs = [
    { id: 'overview', label: t('overview') || 'Vue d\'ensemble', icon: Activity },
    { id: 'consultations', label: t('consultations') || 'Consultations', icon: Stethoscope },
    { id: 'ecg', label: 'ECG', icon: Zap },
    { id: 'echo', label: 'Échographie', icon: Radio },
    { id: 'devices', label: t('devices') || 'Dispositifs', icon: Heart },
    { id: 'medications', label: t('medications') || 'Médicaments', icon: Pill },
    { id: 'events', label: t('events') || 'Événements', icon: AlertTriangle },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">{t('patientNotFound') || 'Patient non trouvé'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/cardiology/patients')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <User className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {patient.lastName} {patient.firstName}
                </h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskBadgeColor(patient.riskLevel)}`}>
                  {patient.riskLevel === 'critical' ? 'Critique' :
                   patient.riskLevel === 'high' ? 'Risque élevé' :
                   patient.riskLevel === 'medium' ? 'Risque moyen' : 'Risque faible'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mt-1">
                <span>{calculateAge(patient.dateOfBirth)} ans</span>
                <span>•</span>
                <span>{patient.gender === 'male' ? 'Homme' : 'Femme'}</span>
                {patient.bloodType && (
                  <>
                    <span>•</span>
                    <span>Groupe {patient.bloodType}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/cardiology/patients/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Edit className="h-5 w-5" />
          {t('edit') || 'Modifier'}
        </button>
      </div>

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('phone') || 'Téléphone'}</p>
              <p className="font-medium text-gray-900 dark:text-white">{patient.phone || '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('diagnosis') || 'Diagnostic'}</p>
              <p className="font-medium text-gray-900 dark:text-white">{patient.primaryDiagnosis || '-'}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('lastConsultation') || 'Dernière consultation'}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {patient.lastConsultation ? new Date(patient.lastConsultation).toLocaleDateString('fr-FR') : '-'}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('devices') || 'Dispositifs'}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {(devices?.pacemakers?.length || 0) + (devices?.stents?.length || 0)} implantés
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {patient.allergies && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-orange-800 dark:text-orange-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">{t('allergies') || 'Allergies'}:</span>
            <span>{patient.allergies}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Recent Consultations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-red-500" />
                  {t('recentConsultations') || 'Consultations récentes'}
                </h3>
                <button
                  onClick={() => navigate(`/cardiology/consultations/new?patientId=${id}`)}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  {t('newConsultation') || 'Nouvelle'}
                </button>
              </div>
              {consultations?.length > 0 ? (
                <div className="space-y-2">
                  {consultations.slice(0, 3).map((consultation: any) => (
                    <div
                      key={consultation.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => navigate(`/cardiology/consultations/${consultation.id}`)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {new Date(consultation.date).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{consultation.type}</span>
                      </div>
                      {consultation.diagnosis && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{consultation.diagnosis}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noConsultations') || 'Aucune consultation'}</p>
              )}
            </div>

            {/* Active Medications */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Pill className="h-5 w-5 text-red-500" />
                  {t('activeMedications') || 'Médicaments actifs'}
                </h3>
                <button
                  onClick={() => navigate(`/cardiology/medications/new?patientId=${id}`)}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  {t('addMedication') || 'Ajouter'}
                </button>
              </div>
              {medications?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {medications.slice(0, 4).map((med: any) => (
                    <div key={med.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="font-medium text-gray-900 dark:text-white">{med.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{med.dosage} - {med.frequency}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noMedications') || 'Aucun médicament'}</p>
              )}
            </div>

            {/* Implanted Devices */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Heart className="h-5 w-5 text-red-500" />
                {t('implantedDevices') || 'Dispositifs implantés'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {devices?.pacemakers?.length > 0 && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <p className="font-medium text-purple-800 dark:text-purple-400">Pacemakers</p>
                    <p className="text-2xl font-bold text-purple-900 dark:text-purple-300">{devices?.pacemakers?.length}</p>
                  </div>
                )}
                {devices?.stents?.length > 0 && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="font-medium text-blue-800 dark:text-blue-400">Stents</p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">{devices?.stents?.length}</p>
                  </div>
                )}
                {!devices?.pacemakers?.length && !devices?.stents?.length && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{t('noDevices') || 'Aucun dispositif'}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'consultations' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('allConsultations') || 'Toutes les consultations'}
              </h3>
              <button
                onClick={() => navigate(`/cardiology/consultations/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Plus className="h-4 w-4" />
                {t('newConsultation') || 'Nouvelle consultation'}
              </button>
            </div>
            {consultations?.length > 0 ? (
              <div className="space-y-3">
                {consultations.map((consultation: any) => (
                  <div
                    key={consultation.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-red-300 dark:hover:border-red-700"
                    onClick={() => navigate(`/cardiology/consultations/${consultation.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(consultation.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{consultation.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{consultation.doctor}</p>
                      </div>
                    </div>
                    {consultation.diagnosis && (
                      <p className="mt-2 text-gray-700 dark:text-gray-300">{consultation.diagnosis}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Stethoscope className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">{t('noConsultations') || 'Aucune consultation enregistrée'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ecg' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('ecgRecords') || 'Enregistrements ECG'}
              </h3>
              <button
                onClick={() => navigate(`/cardiology/ecg/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Plus className="h-4 w-4" />
                {t('newEcg') || 'Nouvel ECG'}
              </button>
            </div>
            {ecgRecords?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ecgRecords.map((ecg: any) => (
                  <div
                    key={ecg.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-red-300"
                    onClick={() => navigate(`/cardiology/ecg/${ecg.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(ecg.recordedAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        ecg.interpretation === 'normal'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                      }`}>
                        {ecg.interpretation}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">FC</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ecg.heartRate} bpm</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">PR</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ecg.prInterval} ms</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">QRS</p>
                        <p className="font-medium text-gray-900 dark:text-white">{ecg.qrsDuration} ms</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">{t('noEcg') || 'Aucun ECG enregistré'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'devices' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('implantedDevices') || 'Dispositifs implantés'}
            </h3>
            <div className="space-y-6">
              {/* Pacemakers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <Radio className="h-4 w-4 text-purple-500" />
                    Pacemakers
                  </h4>
                  <button
                    onClick={() => navigate(`/cardiology/pacemakers/new?patientId=${id}`)}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </button>
                </div>
                {devices?.pacemakers?.length > 0 ? (
                  <div className="space-y-2">
                    {devices?.pacemakers?.map((pm: any) => (
                      <div key={pm.id} className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{pm.manufacturer} {pm.model}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Implanté le {new Date(pm.implantDate).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            pm.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {pm.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun pacemaker</p>
                )}
              </div>

              {/* Stents */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Stents
                  </h4>
                  <button
                    onClick={() => navigate(`/cardiology/stents/new?patientId=${id}`)}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter
                  </button>
                </div>
                {devices?.stents?.length > 0 ? (
                  <div className="space-y-2">
                    {devices?.stents?.map((stent: any) => (
                      <div key={stent.id} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{stent.type} - {stent.location}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {stent.manufacturer} {stent.model} • {stent.diameter}mm x {stent.length}mm
                            </p>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(stent.implantDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun stent</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('medications') || 'Médicaments'}
              </h3>
              <button
                onClick={() => navigate(`/cardiology/medications/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Plus className="h-4 w-4" />
                {t('addMedication') || 'Ajouter médicament'}
              </button>
            </div>
            {medications?.length > 0 ? (
              <div className="space-y-3">
                {medications.map((med: any) => (
                  <div key={med.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{med.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {med.dosage} • {med.frequency} • {med.route}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        med.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {med.status === 'active' ? 'Actif' : 'Arrêté'}
                      </span>
                    </div>
                    {med.indication && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Indication: {med.indication}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">{t('noMedications') || 'Aucun médicament enregistré'}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'echo' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Échocardiographies
              </h3>
              <button
                onClick={() => navigate(`/cardiology/echocardiograms/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Plus className="h-4 w-4" />
                Nouvelle écho
              </button>
            </div>
            <div className="text-center py-8">
              <Radio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucune échocardiographie enregistrée</p>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Événements cardiaques
              </h3>
              <button
                onClick={() => navigate(`/cardiology/events/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Plus className="h-4 w-4" />
                Nouvel événement
              </button>
            </div>
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucun événement cardiaque enregistré</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
