/**
 * Cardiology Medications Form Page
 * Create/Edit cardiac medications
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pill, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { PageHeader, Button, FormSection, FormGrid, FormActions } from '../../components/healthcare';

interface MedicationFormData {
  patientId: string;
  medicationName: string;
  genericName: string;
  category: 'antiplatelet' | 'anticoagulant' | 'beta_blocker' | 'ace_inhibitor' | 'arb' | 'statin' | 'diuretic' | 'calcium_blocker' | 'nitrate' | 'other';
  dosage: string;
  frequency: 'once_daily' | 'twice_daily' | 'three_times_daily' | 'as_needed';
  startDate: string;
  endDate: string;
  prescribedBy: string;
  notes: string;
}

export default function CardiologyMedicationsFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [formData, setFormData] = useState<MedicationFormData>({
    patientId: '',
    medicationName: '',
    genericName: '',
    category: 'antiplatelet',
    dosage: '',
    frequency: 'once_daily',
    startDate: '',
    endDate: '',
    prescribedBy: '',
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

  // Fetch existing medication if editing
  const { data: medication } = useQuery({
    queryKey: ['cardiology-medication', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/medications/${id}`);
      return response.data?.data;
    },
    enabled: isEdit,
  });

  useEffect(() => {
    if (medication) {
      setFormData({
        patientId: medication.patientId || '',
        medicationName: medication.medicationName || '',
        genericName: medication.genericName || '',
        category: medication.category || 'antiplatelet',
        dosage: medication.dosage || '',
        frequency: medication.frequency || 'once_daily',
        startDate: medication.startDate ? new Date(medication.startDate).toISOString().slice(0, 10) : '',
        endDate: medication.endDate ? new Date(medication.endDate).toISOString().slice(0, 10) : '',
        prescribedBy: medication.prescribedBy || '',
        notes: medication.notes || '',
      });
    }
  }, [medication]);

  const mutation = useMutation({
    mutationFn: async (data: MedicationFormData) => {
      const payload = {
        ...data,
        endDate: data.endDate || undefined,
      };
      if (isEdit) {
        return api.put(`/cardiology/medications/${id}`, payload);
      }
      return api.post('/cardiology/medications', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardiology-medications'] });
      toast.success(isEdit ? t('cardiology.medicationUpdated') : t('cardiology.medicationCreated'));
      navigate('/cardiology/medications');
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
        title={isEdit ? t('cardiology.editMedication') : t('cardiology.newMedication')}
        subtitle={isEdit ? t('cardiology.editMedicationDetails') : t('cardiology.createNewMedication')}
        icon={Pill}
        module="cardiology"
        onBack={() => navigate('/cardiology/medications')}
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

          {/* Medication Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom du médicament *
            </label>
            <input
              type="text"
              value={formData.medicationName}
              onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
              required
              placeholder="Aspirin, Plavix, Bisoprolol..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Generic Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nom générique
            </label>
            <input
              type="text"
              value={formData.genericName}
              onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              placeholder="Acide acétylsalicylique, Clopidogrel..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Catégorie *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as MedicationFormData['category'] })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="antiplatelet">Antiplaquettaire</option>
              <option value="anticoagulant">Anticoagulant</option>
              <option value="beta_blocker">Bêta-bloquant</option>
              <option value="ace_inhibitor">IEC (Inhibiteur de l'enzyme de conversion)</option>
              <option value="arb">ARA II (Antagoniste des récepteurs de l'angiotensine II)</option>
              <option value="statin">Statine</option>
              <option value="diuretic">Diurétique</option>
              <option value="calcium_blocker">Inhibiteur calcique</option>
              <option value="nitrate">Dérivé nitré</option>
              <option value="other">Autre</option>
            </select>
          </div>

          {/* Dosage */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dosage
            </label>
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="100mg, 5mg, 10mg..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fréquence *
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as MedicationFormData['frequency'] })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            >
              <option value="once_daily">Une fois par jour</option>
              <option value="twice_daily">Deux fois par jour</option>
              <option value="three_times_daily">Trois fois par jour</option>
              <option value="as_needed">Si nécessaire</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de début *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date de fin
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>

          {/* Prescribed By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prescrit par
            </label>
            <input
              type="text"
              value={formData.prescribedBy}
              onChange={(e) => setFormData({ ...formData, prescribedBy: e.target.value })}
              placeholder="Dr. Nom du médecin"
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
              placeholder="Notes additionnelles sur le traitement..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
            />
          </div>
          </FormGrid>

        <FormActions>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/cardiology/medications')}
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
