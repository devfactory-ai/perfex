/**
 * Ophthalmology Patient Detail Page
 * Complete patient file with all ophthalmology data
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Eye,
  ArrowLeft,
  Edit,
  User,
  Phone,
  Activity,
  AlertTriangle,
  Calendar,
  Stethoscope,
  Plus,
  Scan,
  Target,
  Syringe,
  Glasses,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';

type TabType = 'overview' | 'consultations' | 'oct' | 'visualField' | 'surgeries' | 'injections' | 'refraction';

export default function OphthalmologyPatientDetailPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data: patient, isLoading } = useQuery({
    queryKey: ['ophthalmology-patient', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/patients/${id}`);
      return response.data?.data;
    },
  });

  const { data: consultations } = useQuery({
    queryKey: ['ophthalmology-patient-consultations', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/consultations?patientId=${id}`);
      return response.data?.data || [];
    },
    enabled: activeTab === 'consultations' || activeTab === 'overview',
  });

  const { data: octScans } = useQuery({
    queryKey: ['ophthalmology-patient-oct', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/oct?patientId=${id}`);
      return response.data?.data || [];
    },
    enabled: activeTab === 'oct' || activeTab === 'overview',
  });

  const { data: visualFields } = useQuery({
    queryKey: ['ophthalmology-patient-visual-fields', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/visual-fields?patientId=${id}`);
      return response.data?.data || [];
    },
    enabled: activeTab === 'visualField' || activeTab === 'overview',
  });

  const { data: ivtInjections } = useQuery({
    queryKey: ['ophthalmology-patient-ivt', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/ivt-injections?patientId=${id}`);
      return response.data?.data || [];
    },
    enabled: activeTab === 'injections' || activeTab === 'overview',
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

  const tabs = [
    { id: 'overview', label: t('overview') || 'Vue d\'ensemble', icon: Activity },
    { id: 'consultations', label: t('consultations') || 'Consultations', icon: Stethoscope },
    { id: 'oct', label: 'OCT', icon: Scan },
    { id: 'visualField', label: 'Champ visuel', icon: Target },
    { id: 'surgeries', label: 'Chirurgies', icon: Eye },
    { id: 'injections', label: 'IVT', icon: Syringe },
    { id: 'refraction', label: 'Réfraction', icon: Glasses },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
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
            onClick={() => navigate('/ophthalmology/patients')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {patient.lastName} {patient.firstName}
              </h1>
              <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400 mt-1">
                <span>{calculateAge(patient.dateOfBirth)} ans</span>
                <span>•</span>
                <span>{patient.gender === 'male' ? 'Homme' : 'Femme'}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate(`/ophthalmology/patients/${id}/edit`)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
            <Eye className="h-5 w-5 text-gray-400" />
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
            <Syringe className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">IVT Injections</p>
              <p className="font-medium text-gray-900 dark:text-white">{ivtInjections?.length || 0}</p>
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
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
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
            {/* Visual Acuity Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-blue-500" />
                Acuité visuelle
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Œil Droit (OD)</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {patient.lastAcuityOD || '-'}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Œil Gauche (OG)</p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                    {patient.lastAcuityOG || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Consultations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-blue-500" />
                  {t('recentConsultations') || 'Consultations récentes'}
                </h3>
                <button
                  onClick={() => navigate(`/ophthalmology/consultations/new?patientId=${id}`)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
                      onClick={() => navigate(`/ophthalmology/consultations/${consultation.id}`)}
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

            {/* Recent OCT */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Scan className="h-5 w-5 text-blue-500" />
                  OCT récents
                </h3>
                <button
                  onClick={() => navigate(`/ophthalmology/oct/new?patientId=${id}`)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Nouveau
                </button>
              </div>
              {octScans?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {octScans.slice(0, 2).map((oct: any) => (
                    <div
                      key={oct.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => navigate(`/ophthalmology/oct/${oct.id}`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {oct.eye === 'OD' ? 'Œil Droit' : 'Œil Gauche'}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(oct.scanDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        CMT: {oct.centralMacularThickness} µm
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun OCT enregistré</p>
              )}
            </div>

            {/* IVT Injections */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-blue-500" />
                  Injections IVT
                </h3>
                <button
                  onClick={() => navigate(`/ophthalmology/ivt-injections/new?patientId=${id}`)}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Nouvelle
                </button>
              </div>
              {ivtInjections?.length > 0 ? (
                <div className="space-y-2">
                  {ivtInjections.slice(0, 3).map((injection: any) => (
                    <div key={injection.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{injection.drug}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                            ({injection.eye === 'OD' ? 'OD' : 'OG'})
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(injection.injectionDate).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune injection IVT</p>
              )}
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
                onClick={() => navigate(`/ophthalmology/consultations/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-300 dark:hover:border-blue-700"
                    onClick={() => navigate(`/ophthalmology/consultations/${consultation.id}`)}
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

        {activeTab === 'oct' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Examens OCT
              </h3>
              <button
                onClick={() => navigate(`/ophthalmology/oct/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Nouvel OCT
              </button>
            </div>
            {octScans?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {octScans.map((oct: any) => (
                  <div
                    key={oct.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-300"
                    onClick={() => navigate(`/ophthalmology/oct/${oct.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {oct.eye === 'OD' ? 'Œil Droit (OD)' : 'Œil Gauche (OG)'}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(oct.scanDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">CMT</p>
                        <p className="font-medium text-gray-900 dark:text-white">{oct.centralMacularThickness} µm</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Type</p>
                        <p className="font-medium text-gray-900 dark:text-white">{oct.scanType}</p>
                      </div>
                    </div>
                    {oct.findings && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{oct.findings}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Scan className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Aucun OCT enregistré</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'visualField' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Champs visuels
              </h3>
              <button
                onClick={() => navigate(`/ophthalmology/visual-fields/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Nouveau CV
              </button>
            </div>
            {visualFields?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visualFields.map((vf: any) => (
                  <div
                    key={vf.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-300"
                    onClick={() => navigate(`/ophthalmology/visual-fields/${vf.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {vf.eye === 'OD' ? 'Œil Droit (OD)' : 'Œil Gauche (OG)'}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(vf.testDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">MD</p>
                        <p className="font-medium text-gray-900 dark:text-white">{vf.meanDeviation} dB</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">PSD</p>
                        <p className="font-medium text-gray-900 dark:text-white">{vf.patternStandardDeviation} dB</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Aucun champ visuel enregistré</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'surgeries' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Chirurgies
              </h3>
              <button
                onClick={() => navigate(`/ophthalmology/surgeries/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Nouvelle chirurgie
              </button>
            </div>
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucune chirurgie enregistrée</p>
            </div>
          </div>
        )}

        {activeTab === 'injections' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Injections Intravitréennes (IVT)
              </h3>
              <button
                onClick={() => navigate(`/ophthalmology/ivt-injections/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Nouvelle IVT
              </button>
            </div>
            {ivtInjections?.length > 0 ? (
              <div className="space-y-3">
                {ivtInjections.map((injection: any) => (
                  <div
                    key={injection.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-300"
                    onClick={() => navigate(`/ophthalmology/ivt-injections/${injection.id}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {injection.drug}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {injection.eye === 'OD' ? 'Œil Droit' : 'Œil Gauche'} • {injection.indication}
                        </p>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(injection.injectionDate).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Syringe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">Aucune injection IVT enregistrée</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'refraction' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mesures de réfraction
              </h3>
              <button
                onClick={() => navigate(`/ophthalmology/refraction/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Nouvelle mesure
              </button>
            </div>
            <div className="text-center py-8">
              <Glasses className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Aucune mesure de réfraction enregistrée</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
