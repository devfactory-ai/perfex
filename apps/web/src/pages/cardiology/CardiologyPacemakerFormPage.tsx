/**
 * Cardiology Pacemaker Form Page
 * Create/Edit pacemaker implants
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cpu, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { PageHeader, Button, FormSection, FormGrid, FormActions } from '../../components/healthcare';

interface PacemakerFormData {
  patientId: string;
  implantDate: string;
  deviceType: 'single_chamber' | 'dual_chamber' | 'crt' | 'icd';
  manufacturer: string;
  model: string;
  serialNumber: string;
  leadPositions: string;
  indication: string;
  notes: string;
}

export default function CardiologyPacemakerFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<PacemakerFormData>({
    patientId: '',
    implantDate: '',
    deviceType: 'single_chamber',
    manufacturer: '',
    model: '',
    serialNumber: '',
    leadPositions: '',
    indication: '',
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

  // Fetch existing pacemaker if editing
  const { data: pacemaker } = useQuery({
    queryKey: ['cardiology-pacemaker', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/pacemakers/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (pacemaker) {
      setFormData({
        patientId: pacemaker.patientId || '',
        implantDate: pacemaker.implantDate ? new Date(pacemaker.implantDate).toISOString().slice(0, 16) : '',
        deviceType: pacemaker.deviceType || 'single_chamber',
        manufacturer: pacemaker.manufacturer || '',
        model: pacemaker.model || '',
        serialNumber: pacemaker.serialNumber || '',
        leadPositions: pacemaker.leadPositions || '',
        indication: pacemaker.indication || '',
        notes: pacemaker.notes || '',
      });
    }
  }, [pacemaker]);

  const mutation = useMutation({
    mutationFn: async (data: PacemakerFormData) => {
      if (isEdit) {
        return api.put(`/cardiology/pacemakers/${id}`, data);
      }
      return api.post('/cardiology/pacemakers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardiology-pacemakers'] });
      toast.success(isEdit ? t('cardiology.pacemakerUpdated') : t('cardiology.pacemakerCreated'));
      navigate('/cardiology/pacemakers');
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
        title={isEdit ? t('cardiology.editPacemaker') : t('cardiology.newPacemaker')}
        subtitle={isEdit ? t('cardiology.editPacemakerDetails') : t('cardiology.createNewPacemaker')}
        icon={Cpu}
        module="cardiology"
        onBack={() => navigate('/cardiology/pacemakers')}
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
              Date d'implantation *
            </label>
            <input
              type="datetime-local"
              value={formData.implantDate}
              onChange={(e) => setFormData({ ...formData, implantDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Device Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type de dispositif *
            </label>
            <select
              value={formData.deviceType}
              onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as PacemakerFormData['deviceType'] })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="single_chamber">Simple chambre</option>
              <option value="dual_chamber">Double chambre</option>
              <option value="crt">CRT (Resynchronisation)</option>
              <option value="icd">DAI (Défibrillateur)</option>
            </select>
          </div>

          {/* Manufacturer */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fabricant
            </label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="Medtronic, Boston Scientific, Abbott..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modèle
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Numéro de modèle..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Serial Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Numéro de série
            </label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              placeholder="Numéro de série du dispositif..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Indication */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Indication
            </label>
            <input
              type="text"
              value={formData.indication}
              onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
              placeholder="Raison de l'implantation..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Lead Positions */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Position des sondes
            </label>
            <textarea
              value={formData.leadPositions}
              onChange={(e) => setFormData({ ...formData, leadPositions: e.target.value })}
              rows={3}
              placeholder="OD, VD, sinus coronaire..."
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
              placeholder="Notes additionnelles..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
          </FormGrid>

        <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/cardiology/pacemakers')}
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
