/**
 * Cardiology Risk Scores Form Page
 * Create/Edit cardiac risk scores
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { PageHeader, Button, FormSection, FormGrid, FormActions } from '../../components/healthcare';

interface RiskScoreFormData {
  patientId: string;
  assessmentDate: string;
  scoreType: 'framingham' | 'score2' | 'heart' | 'grace' | 'timi' | 'chadsvasc';
  totalScore: string;
  riskCategory: 'low' | 'moderate' | 'high' | 'very_high';
  age: string;
  smoker: boolean;
  diabetic: boolean;
  hypertensive: boolean;
  notes: string;
}

export default function CardiologyRiskScoresFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<RiskScoreFormData>({
    patientId: '',
    assessmentDate: '',
    scoreType: 'framingham',
    totalScore: '',
    riskCategory: 'low',
    age: '',
    smoker: false,
    diabetic: false,
    hypertensive: false,
    notes: '',
  });

  // Fetch patients for selection
  const { data: patients } = useQuery({
    queryKey: ['cardiology-patients'],
    queryFn: async () => {
      const response = await api.get('/cardiology/patients?limit=100');
      return response.data?.data || [];
    },
  });

  // Fetch existing risk score if editing
  const { data: riskScore } = useQuery({
    queryKey: ['cardiology-risk-score', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/risk-scores/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (riskScore) {
      setFormData({
        patientId: riskScore.patientId || '',
        assessmentDate: riskScore.assessmentDate ? new Date(riskScore.assessmentDate).toISOString().slice(0, 16) : '',
        scoreType: riskScore.scoreType || 'framingham',
        totalScore: riskScore.totalScore?.toString() || '',
        riskCategory: riskScore.riskCategory || 'low',
        age: riskScore.age?.toString() || '',
        smoker: riskScore.smoker || false,
        diabetic: riskScore.diabetic || false,
        hypertensive: riskScore.hypertensive || false,
        notes: riskScore.notes || '',
      });
    }
  }, [riskScore]);

  const mutation = useMutation({
    mutationFn: async (data: RiskScoreFormData) => {
      const payload = {
        ...data,
        age: data.age ? Number(data.age) : undefined,
      };
      if (isEdit) {
        return api.put(`/cardiology/risk-scores/${id}`, payload);
      }
      return api.post('/cardiology/risk-scores', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardiology-risk-scores'] });
      toast.success(isEdit ? t('cardiology.riskScoreUpdated') : t('cardiology.riskScoreCreated'));
      navigate('/cardiology/risk-scores');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || t('common.saveError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEdit ? t('cardiology.editRiskScore') : t('cardiology.newRiskScore')}
        subtitle={isEdit ? t('cardiology.editRiskScoreDetails') : t('cardiology.createNewRiskScore')}
        icon={Heart}
        module="cardiology"
        onBack={() => navigate('/cardiology/risk-scores')}
      />

      <FormSection module="cardiology">
        <form onSubmit={handleSubmit}>
          <FormGrid columns={2}>
      {/* Form */}
      
          {/* Patient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.patient')} *
            </label>
            <select
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="">{t('common.selectPatient')}</option>
              {patients?.map((patient: any) => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} - {patient.medicalRecordNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date d'évaluation *
            </label>
            <input
              type="datetime-local"
              value={formData.assessmentDate}
              onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Score Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de score *
            </label>
            <select
              value={formData.scoreType}
              onChange={(e) => setFormData({ ...formData, scoreType: e.target.value as RiskScoreFormData['scoreType'] })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="framingham">Framingham</option>
              <option value="score2">SCORE2</option>
              <option value="heart">HEART</option>
              <option value="grace">GRACE</option>
              <option value="timi">TIMI</option>
              <option value="chadsvasc">CHA2DS2-VASc</option>
            </select>
          </div>

          {/* Total Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Score total *
            </label>
            <input
              type="text"
              value={formData.totalScore}
              onChange={(e) => setFormData({ ...formData, totalScore: e.target.value })}
              required
              placeholder="Score calculé"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Risk Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Catégorie de risque *
            </label>
            <select
              value={formData.riskCategory}
              onChange={(e) => setFormData({ ...formData, riskCategory: e.target.value as RiskScoreFormData['riskCategory'] })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="low">Faible</option>
              <option value="moderate">Modéré</option>
              <option value="high">Élevé</option>
              <option value="very_high">Très élevé</option>
            </select>
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Âge *
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
              placeholder="Âge du patient"
              min="0"
              max="150"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Risk Factors - Checkboxes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Facteurs de risque
            </label>
            <div className="grid gap-4 md:grid-cols-3">
              {/* Smoker */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="smoker"
                  checked={formData.smoker}
                  onChange={(e) => setFormData({ ...formData, smoker: e.target.checked })}
                  className="h-4 w-4 text-gray-900 dark:text-white focus:ring-gray-900 dark:focus:ring-white border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="smoker" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Fumeur
                </label>
              </div>

              {/* Diabetic */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="diabetic"
                  checked={formData.diabetic}
                  onChange={(e) => setFormData({ ...formData, diabetic: e.target.checked })}
                  className="h-4 w-4 text-gray-900 dark:text-white focus:ring-gray-900 dark:focus:ring-white border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="diabetic" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Diabétique
                </label>
              </div>

              {/* Hypertensive */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hypertensive"
                  checked={formData.hypertensive}
                  onChange={(e) => setFormData({ ...formData, hypertensive: e.target.checked })}
                  className="h-4 w-4 text-gray-900 dark:text-white focus:ring-gray-900 dark:focus:ring-white border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="hypertensive" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Hypertendu
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('common.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              placeholder="Notes additionnelles sur l'évaluation du risque..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
          </FormGrid>

        <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/cardiology/risk-scores')}
              module="cardiology"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={mutation.isPending}
              icon={Save}
              module="cardiology"
            >
              {mutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </FormActions>
        </form>
      </FormSection>
    </div>
  );
}
