/**
 * Cardiology Stent Form Page
 * Create/Edit stent implants
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { PageHeader, Button, FormSection, FormGrid, FormActions } from '../../components/healthcare';

interface StentFormData {
  patientId: string;
  implantDate: string;
  stentType: 'des' | 'bms' | 'bvs';
  manufacturer: string;
  model: string;
  diameter: string;
  length: string;
  location: 'LAD' | 'LCX' | 'RCA' | 'LM' | 'other';
  preStenosis: string;
  postStenosis: string;
  notes: string;
}

export default function CardiologyStentFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<StentFormData>({
    patientId: '',
    implantDate: '',
    stentType: 'des',
    manufacturer: '',
    model: '',
    diameter: '',
    length: '',
    location: 'LAD',
    preStenosis: '',
    postStenosis: '',
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

  // Fetch existing stent if editing
  const { data: stent } = useQuery({
    queryKey: ['cardiology-stent', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/stents/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (stent) {
      setFormData({
        patientId: stent.patientId || '',
        implantDate: stent.implantDate ? new Date(stent.implantDate).toISOString().slice(0, 16) : '',
        stentType: stent.stentType || 'des',
        manufacturer: stent.manufacturer || '',
        model: stent.model || '',
        diameter: stent.diameter?.toString() || '',
        length: stent.length?.toString() || '',
        location: stent.location || 'LAD',
        preStenosis: stent.preStenosis?.toString() || '',
        postStenosis: stent.postStenosis?.toString() || '',
        notes: stent.notes || '',
      });
    }
  }, [stent]);

  const mutation = useMutation({
    mutationFn: async (data: StentFormData) => {
      const payload = {
        ...data,
        diameter: data.diameter ? Number(data.diameter) : undefined,
        length: data.length ? Number(data.length) : undefined,
        preStenosis: data.preStenosis ? Number(data.preStenosis) : undefined,
        postStenosis: data.postStenosis ? Number(data.postStenosis) : undefined,
      };
      if (isEdit) {
        return api.put(`/cardiology/stents/${id}`, payload);
      }
      return api.post('/cardiology/stents', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardiology-stents'] });
      toast.success(isEdit ? t('cardiology.stentUpdated') : t('cardiology.stentCreated'));
      navigate('/cardiology/stents');
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
        title={isEdit ? t('cardiology.editStent') : t('cardiology.newStent')}
        subtitle={isEdit ? t('cardiology.editStentSubtitle') : t('cardiology.newStentSubtitle')}
        icon={Heart}
        module="cardiology"
        onBack={() => navigate('/cardiology/stents')}
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

          {/* Implant Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('cardiology.implantDate')} *
            </label>
            <input
              type="datetime-local"
              value={formData.implantDate}
              onChange={(e) => setFormData({ ...formData, implantDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Stent Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('cardiology.stentType')} *
            </label>
            <select
              value={formData.stentType}
              onChange={(e) => setFormData({ ...formData, stentType: e.target.value as StentFormData['stentType'] })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="des">{t('cardiology.desDrugEluting')}</option>
              <option value="bms">{t('cardiology.bmsBare')}</option>
              <option value="bvs">{t('cardiology.bvsBioresorbable')}</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('cardiology.location')} *
            </label>
            <select
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value as StentFormData['location'] })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="LAD">{t('cardiology.ladArtery')}</option>
              <option value="LCX">{t('cardiology.lcxArtery')}</option>
              <option value="RCA">{t('cardiology.rcaArtery')}</option>
              <option value="LM">{t('cardiology.lmArtery')}</option>
              <option value="other">{t('common.other')}</option>
            </select>
          </div>

          {/* Manufacturer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('cardiology.manufacturer')}
            </label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="Abbott, Medtronic, Boston Scientific..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('cardiology.model')}
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Xience, Promus, Resolute..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Diameter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('cardiology.diameterMm')}
            </label>
            <input
              type="number"
              value={formData.diameter}
              onChange={(e) => setFormData({ ...formData, diameter: e.target.value })}
              placeholder="2.5 - 4.0"
              min="0"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Length */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('cardiology.lengthMm')}
            </label>
            <input
              type="number"
              value={formData.length}
              onChange={(e) => setFormData({ ...formData, length: e.target.value })}
              placeholder="8 - 38"
              min="0"
              step="1"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Pre-Stenosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('cardiology.preStenosis')}
            </label>
            <input
              type="number"
              value={formData.preStenosis}
              onChange={(e) => setFormData({ ...formData, preStenosis: e.target.value })}
              placeholder="0-100"
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Post-Stenosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('cardiology.postStenosis')}
            </label>
            <input
              type="number"
              value={formData.postStenosis}
              onChange={(e) => setFormData({ ...formData, postStenosis: e.target.value })}
              placeholder="0-100"
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
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
              placeholder={t('cardiology.procedureNotesPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
          </FormGrid>

        <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/cardiology/stents')}
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
