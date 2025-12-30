/**
 * Ophthalmology Patient Detail Page
 * Complete patient file with all ophthalmology data
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Eye,
  Edit,
  Trash2,
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
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import {
  PageHeader,
  Button,
  SectionCard,
} from '../../components/healthcare';

type TabType = 'overview' | 'consultations' | 'oct' | 'visualField' | 'surgeries' | 'injections' | 'refraction';

export default function OphthalmologyPatientDetailPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/ophthalmology/patients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmology-patients'] });
      toast.success(t('patientDeleted') || 'Patient supprimé avec succès');
      navigate('/ophthalmology/patients');
    },
    onError: () => {
      toast.error(t('deleteError') || 'Erreur lors de la suppression');
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
    setShowDeleteConfirm(false);
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
    { id: 'oct', label: 'OCT', icon: Scan },
    { id: 'visualField', label: t('ophthalmology.visualField'), icon: Target },
    { id: 'surgeries', label: t('ophthalmology.surgeries'), icon: Eye },
    { id: 'injections', label: 'IVT', icon: Syringe },
    { id: 'refraction', label: t('ophthalmology.refraction'), icon: Glasses },
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
      <PageHeader
        title={`${patient.lastName} ${patient.firstName}`}
        subtitle={`${calculateAge(patient.dateOfBirth)} ${t('common.years')} • ${patient.gender === 'male' ? t('common.male') : t('common.female')}`}
        icon={User}
        module="ophthalmology"
        onBack={() => navigate('/ophthalmology/patients')}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              icon={Edit}
              onClick={() => navigate(`/ophthalmology/patients/${id}/edit`)}
              module="ophthalmology"
            >
              {t('edit') || 'Modifier'}
            </Button>
            <Button
              variant="outline"
              icon={Trash2}
              onClick={() => setShowDeleteConfirm(true)}
              module="ophthalmology"
            >
              {t('delete') || 'Supprimer'}
            </Button>
          </div>
        }
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t('confirmDelete') || 'Confirmer la suppression'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('deletePatientConfirmation') || 'Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                {t('cancel') || 'Annuler'}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? (t('deleting') || 'Suppression...') : (t('delete') || 'Supprimer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SectionCard>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('phone') || 'Téléphone'}</p>
              <p className="font-medium text-gray-900 dark:text-white">{patient.phone || '-'}</p>
            </div>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('diagnosis') || 'Diagnostic'}</p>
              <p className="font-medium text-gray-900 dark:text-white">{patient.primaryDiagnosis || '-'}</p>
            </div>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('lastConsultation') || 'Dernière consultation'}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {patient.lastConsultation ? new Date(patient.lastConsultation).toLocaleDateString('fr-FR') : '-'}
              </p>
            </div>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="flex items-center gap-3">
            <Syringe className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">IVT Injections</p>
              <p className="font-medium text-gray-900 dark:text-white">{ivtInjections?.length || 0}</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Alerts */}
      {patient.allergies && (
        <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-2 text-slate-800 dark:text-slate-400">
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
                  ? 'border-slate-500 text-slate-600 dark:text-slate-400'
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
      <SectionCard>
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Visual Acuity Summary */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Eye className="h-5 w-5 text-slate-500" />
                {t('ophthalmology.visualAcuity')}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('ophthalmology.rightEyeOD')}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-300">
                    {patient.lastAcuityOD || '-'}
                  </p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/20 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('ophthalmology.leftEyeOG')}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-300">
                    {patient.lastAcuityOG || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Consultations */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-slate-500" />
                  {t('recentConsultations') || 'Consultations récentes'}
                </h3>
                <button
                  onClick={() => navigate(`/ophthalmology/consultations/new?patientId=${id}`)}
                  className="text-sm text-slate-600 hover:text-slate-700 flex items-center gap-1"
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
                      onClick={() => navigate(`/ophthalmology/consultations/${consultation.id}/edit`)}
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
                  <Scan className="h-5 w-5 text-slate-500" />
                  {t('ophthalmology.recentOct')}
                </h3>
                <button
                  onClick={() => navigate(`/ophthalmology/oct/new?patientId=${id}`)}
                  className="text-sm text-slate-600 hover:text-slate-700 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  {t('ophthalmology.newOct')}
                </button>
              </div>
              {octScans?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {octScans.slice(0, 2).map((oct: any) => (
                    <div
                      key={oct.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => navigate(`/ophthalmology/oct/${oct.id}/edit`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {oct.eye === 'OD' ? t('ophthalmology.rightEye') : t('ophthalmology.leftEye')}
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
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('ophthalmology.noOctRegistered')}</p>
              )}
            </div>

            {/* IVT Injections */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-slate-500" />
                  {t('ophthalmology.ivtInjections')}
                </h3>
                <button
                  onClick={() => navigate(`/ophthalmology/ivt-injections/new?patientId=${id}`)}
                  className="text-sm text-slate-600 hover:text-slate-700 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  {t('ophthalmology.newIvt')}
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
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('ophthalmology.noIvtInjection')}</p>
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
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
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
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
                    onClick={() => navigate(`/ophthalmology/consultations/${consultation.id}/edit`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {consultation.consultationDate ? new Date(consultation.consultationDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{consultation.consultationType}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">{consultation.doctorName}</p>
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
                {t('ophthalmology.octExams')}
              </h3>
              <button
                onClick={() => navigate(`/ophthalmology/oct/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
              >
                <Plus className="h-4 w-4" />
                {t('ophthalmology.newOct')}
              </button>
            </div>
            {octScans?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {octScans.map((oct: any) => (
                  <div
                    key={oct.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-slate-300"
                    onClick={() => navigate(`/ophthalmology/oct/${oct.id}/edit`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {oct.eye === 'OD' ? t('ophthalmology.rightEyeOD') : t('ophthalmology.leftEyeOG')}
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
                <p className="text-gray-600 dark:text-gray-400">{t('ophthalmology.noOctRegistered')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'visualField' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('ophthalmology.visualFieldsTitle')}
              </h3>
              <button
                onClick={() => navigate(`/ophthalmology/visual-fields/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
              >
                <Plus className="h-4 w-4" />
                {t('ophthalmology.newVisualField')}
              </button>
            </div>
            {visualFields?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visualFields.map((vf: any) => (
                  <div
                    key={vf.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-slate-300"
                    onClick={() => navigate(`/ophthalmology/visual-fields/${vf.id}/edit`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {vf.eye === 'OD' ? t('ophthalmology.rightEyeOD') : t('ophthalmology.leftEyeOG')}
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
                <p className="text-gray-600 dark:text-gray-400">{t('ophthalmology.noVisualFieldRegistered')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'surgeries' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('ophthalmology.surgeries')}
              </h3>
              <button
                onClick={() => navigate(`/ophthalmology/surgeries/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
              >
                <Plus className="h-4 w-4" />
                {t('ophthalmology.newSurgery')}
              </button>
            </div>
            <div className="text-center py-8">
              <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('ophthalmology.noSurgeryRegistered')}</p>
            </div>
          </div>
        )}

        {activeTab === 'injections' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('ophthalmology.ivtInjectionsTitle')}
              </h3>
              <button
                onClick={() => navigate(`/ophthalmology/ivt-injections/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
              >
                <Plus className="h-4 w-4" />
                {t('ophthalmology.newIvt')}
              </button>
            </div>
            {ivtInjections?.length > 0 ? (
              <div className="space-y-3">
                {ivtInjections.map((injection: any) => (
                  <div
                    key={injection.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-slate-300"
                    onClick={() => navigate(`/ophthalmology/ivt-injections/${injection.id}/edit`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {injection.drug}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {injection.eye === 'OD' ? t('ophthalmology.rightEyeFull') : t('ophthalmology.leftEyeFull')} • {injection.indication}
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
                <p className="text-gray-600 dark:text-gray-400">{t('ophthalmology.noIvtRegistered')}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'refraction' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('ophthalmology.refractionMeasures')}
              </h3>
              <button
                onClick={() => navigate(`/ophthalmology/refraction/new?patientId=${id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900"
              >
                <Plus className="h-4 w-4" />
                {t('ophthalmology.newMeasure')}
              </button>
            </div>
            <div className="text-center py-8">
              <Glasses className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">{t('ophthalmology.noRefractionRegistered')}</p>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
