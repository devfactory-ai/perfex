/**
 * Cardiology Echocardiogram Form Page
 * Create/Edit echocardiograms
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Waves, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { PageHeader, Button, FormSection, FormGrid, FormActions } from '../../components/healthcare';

interface EchoFormData {
  patientId: string;
  studyDate: string;
  lvef: string;
  lvedd: string;
  lvesd: string;
  laSize: string;
  rvFunction: 'normal' | 'mild' | 'moderate' | 'severe';
  valvularFindings: string;
  wallMotion: string;
  conclusions: string;
}

export default function CardiologyEchoFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<EchoFormData>({
    patientId: '',
    studyDate: '',
    lvef: '',
    lvedd: '',
    lvesd: '',
    laSize: '',
    rvFunction: 'normal',
    valvularFindings: '',
    wallMotion: '',
    conclusions: '',
  });

  // Fetch patients for selection
  const { data: patients } = useQuery({
    queryKey: ['cardiology-patients'],
    queryFn: async () => {
      const response = await api.get('/cardiology/patients?limit=100');
      return response.data?.data || [];
    },
  });

  // Fetch existing echo if editing
  const { data: echo } = useQuery({
    queryKey: ['cardiology-echo', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/echo/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (echo) {
      setFormData({
        patientId: echo.patientId || '',
        studyDate: echo.studyDate ? new Date(echo.studyDate).toISOString().slice(0, 16) : '',
        lvef: echo.lvEf?.toString() || echo.lvef?.toString() || '',
        lvedd: echo.lvedd?.toString() || '',
        lvesd: echo.lvesd?.toString() || '',
        laSize: echo.laVolume?.toString() || echo.laSize?.toString() || '',
        rvFunction: echo.rvFunction || 'normal',
        valvularFindings: echo.valvularFindings || '',
        wallMotion: echo.lvWallMotion || echo.wallMotion || '',
        conclusions: echo.interpretation || echo.conclusions || '',
      });
    }
  }, [echo]);

  const mutation = useMutation({
    mutationFn: async (data: EchoFormData) => {
      const payload = {
        patientId: data.patientId,
        studyDate: data.studyDate,
        lvEf: data.lvef ? Number(data.lvef) : undefined,
        lvedd: data.lvedd ? Number(data.lvedd) : undefined,
        lvesd: data.lvesd ? Number(data.lvesd) : undefined,
        laVolume: data.laSize ? Number(data.laSize) : undefined,
        rvFunction: data.rvFunction,
        lvWallMotion: data.wallMotion || undefined,
        interpretation: data.conclusions || undefined,
      };
      if (isEdit) {
        return api.put(`/cardiology/echo/${id}`, payload);
      }
      return api.post('/cardiology/echo', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardiology-echo'] });
      toast.success(isEdit ? t('cardiology.echoUpdated') : t('cardiology.echoCreated'));
      navigate('/cardiology/echo');
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
        title={isEdit ? t('cardiology.editEcho') : t('cardiology.newEcho')}
        subtitle={isEdit ? t('cardiology.editEchoDetails') : t('cardiology.createNewEcho')}
        icon={Waves}
        module="cardiology"
        onBack={() => navigate('/cardiology/echo')}
      />

      <FormSection module="cardiology">
        <form onSubmit={handleSubmit}>
          <FormGrid columns={2}>
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

          {/* Study Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de l'étude *
            </label>
            <input
              type="datetime-local"
              value={formData.studyDate}
              onChange={(e) => setFormData({ ...formData, studyDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* LVEF */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              FEVG (%)
            </label>
            <input
              type="number"
              value={formData.lvef}
              onChange={(e) => setFormData({ ...formData, lvef: e.target.value })}
              placeholder="55-70"
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* RV Function */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fonction VD
            </label>
            <select
              value={formData.rvFunction}
              onChange={(e) => setFormData({ ...formData, rvFunction: e.target.value as EchoFormData['rvFunction'] })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="normal">Normal</option>
              <option value="mild">Légère</option>
              <option value="moderate">Modérée</option>
              <option value="severe">Sévère</option>
            </select>
          </div>

          {/* LVEDD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              DTdVG (mm)
            </label>
            <input
              type="number"
              value={formData.lvedd}
              onChange={(e) => setFormData({ ...formData, lvedd: e.target.value })}
              placeholder="Diamèle télédiastolique"
              min="0"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* LVESD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              DTsVG (mm)
            </label>
            <input
              type="number"
              value={formData.lvesd}
              onChange={(e) => setFormData({ ...formData, lvesd: e.target.value })}
              placeholder="Diamètre télésystolique"
              min="0"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* LA Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taille OG (mm)
            </label>
            <input
              type="number"
              value={formData.laSize}
              onChange={(e) => setFormData({ ...formData, laSize: e.target.value })}
              placeholder="Oreillette gauche"
              min="0"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Valvular Findings */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Valves cardiaques
            </label>
            <textarea
              value={formData.valvularFindings}
              onChange={(e) => setFormData({ ...formData, valvularFindings: e.target.value })}
              rows={3}
              placeholder="État des valves (mitrale, aortique, tricuspide, pulmonaire)..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Wall Motion */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cinétique segmentaire
            </label>
            <textarea
              value={formData.wallMotion}
              onChange={(e) => setFormData({ ...formData, wallMotion: e.target.value })}
              rows={3}
              placeholder="Description de la cinétique des parois ventriculaires..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Conclusions */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Conclusions
            </label>
            <textarea
              value={formData.conclusions}
              onChange={(e) => setFormData({ ...formData, conclusions: e.target.value })}
              rows={4}
              placeholder="Conclusions de l'échocardiographie..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
          </FormGrid>

          <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/cardiology/echo')}
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
