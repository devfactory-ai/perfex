/**
 * Ophthalmology Patient Form Page
 * Create or edit an ophthalmology patient
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, User, Phone, Activity, AlertTriangle, Save } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { PageHeader, Button, FormSection, FormGrid, FormActions } from '../../components/healthcare';

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  emergencyContact: string;
  emergencyPhone: string;
  primaryDiagnosis: string;
  allergies: string;
  medicalHistory: string;
  familyHistory: string;
  notes: string;
}

const initialFormData: PatientFormData = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  gender: 'male',
  nationalId: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  emergencyContact: '',
  emergencyPhone: '',
  primaryDiagnosis: '',
  allergies: '',
  medicalHistory: '',
  familyHistory: '',
  notes: '',
};

export default function OphthalmologyPatientFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<PatientFormData>>({});

  const { data: patient, isLoading } = useQuery({
    queryKey: ['ophthalmology-patient', id],
    queryFn: async () => {
      const response = await api.get(`/ophthalmology/patients/${id}`);
      return response.data?.data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        dateOfBirth: patient.dateOfBirth?.split('T')[0] || '',
        gender: patient.gender || 'male',
        nationalId: patient.nationalId || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        city: patient.city || '',
        emergencyContact: patient.emergencyContact || '',
        emergencyPhone: patient.emergencyPhone || '',
        primaryDiagnosis: patient.primaryDiagnosis || '',
        allergies: patient.allergies || '',
        medicalHistory: patient.medicalHistory || '',
        familyHistory: patient.familyHistory || '',
        notes: patient.notes || '',
      });
    }
  }, [patient]);

  const mutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      if (isEditing) {
        return api.put(`/ophthalmology/patients/${id}`, data);
      }
      return api.post('/ophthalmology/patients', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ophthalmology-patients'] });
      toast.success(isEditing ? t('ophthalmology.patientUpdated') : t('ophthalmology.patientCreated'));
      navigate('/ophthalmology/patients');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || t('common.saveError'));
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof PatientFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: Partial<PatientFormData> = {};
    if (!formData.firstName) newErrors.firstName = t('validation.firstNameRequired');
    if (!formData.lastName) newErrors.lastName = t('validation.lastNameRequired');
    if (!formData.dateOfBirth) newErrors.dateOfBirth = t('validation.dateOfBirthRequired');
    if (!formData.phone) newErrors.phone = t('validation.phoneRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      mutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? t('editPatient') || 'Modifier Patient' : t('newPatient') || 'Nouveau Patient'}
        subtitle={isEditing ? t('editPatientDescription') || 'Modifier les informations du patient' : t('newPatientDescription') || 'Créer un nouveau patient ophtalmologie'}
        icon={Eye}
        module="ophthalmology"
        onBack={() => navigate('/ophthalmology/patients')}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={t('personalInfo') || 'Informations Personnelles'} icon={User} module="ophthalmology">
          <FormGrid columns={3}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('lastName') || 'Nom'} *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('firstName') || 'Prénom'} *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dateOfBirth') || 'Date de naissance'} *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('gender') || 'Genre'}
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="male">{t('male') || 'Homme'}</option>
                <option value="female">{t('female') || 'Femme'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('nationalId') || 'CIN / ID National'}
              </label>
              <input
                type="text"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('contactInfo') || 'Coordonnées'} icon={Phone} module="ophthalmology">
          <FormGrid columns={3}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('phone') || 'Téléphone'} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white`}
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('email') || 'Email'}
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('city') || 'Ville'}
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('address') || 'Adresse'}
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('emergencyContact') || 'Contact urgence'}
              </label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('emergencyPhone') || 'Tél. urgence'}
              </label>
              <input
                type="tel"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('medicalInfo') || 'Informations Médicales'} icon={Activity} module="ophthalmology">
          <FormGrid columns={2}>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('primaryDiagnosis') || 'Diagnostic principal'}
              </label>
              <input
                type="text"
                name="primaryDiagnosis"
                value={formData.primaryDiagnosis}
                onChange={handleChange}
                placeholder="Ex: Glaucome, DMLA, Cataracte..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-slate-500" />
                {t('allergies') || 'Allergies'}
              </label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                rows={2}
                placeholder="Liste des allergies connues (collyres, médicaments...)..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('medicalHistory') || 'Antécédents médicaux'}
              </label>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleChange}
                rows={3}
                placeholder="Diabète, HTA, maladies auto-immunes..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('familyHistory') || 'Antécédents familiaux'}
              </label>
              <textarea
                name="familyHistory"
                value={formData.familyHistory}
                onChange={handleChange}
                rows={3}
                placeholder="Glaucome familial, DMLA, myopie forte..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('notes') || 'Notes'}
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/ophthalmology/patients')}
            module="ophthalmology"
          >
            {t('cancel') || 'Annuler'}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={mutation.isPending}
            icon={Save}
            module="ophthalmology"
          >
            {mutation.isPending ? (t('saving') || 'Enregistrement...') : (t('save') || 'Enregistrer')}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
