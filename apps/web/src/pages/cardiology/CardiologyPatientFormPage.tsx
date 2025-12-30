/**
 * Cardiology Patient Form Page
 * Create or edit a cardiology patient
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Save, User, Phone, Activity, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { api } from '../../lib/api';
import { PageHeader, Button, FormSection, FormGrid, FormActions } from '../../components/healthcare';

interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  emergencyContact: string;
  emergencyPhone: string;
  primaryDiagnosis: string;
  riskLevel: string;
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
  bloodType: '',
  nationalId: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  emergencyContact: '',
  emergencyPhone: '',
  primaryDiagnosis: '',
  riskLevel: 'low',
  allergies: '',
  medicalHistory: '',
  familyHistory: '',
  notes: '',
};

export default function CardiologyPatientFormPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<PatientFormData>>({});

  // Fetch patient data if editing
  const { data: patient, isLoading } = useQuery({
    queryKey: ['cardiology-patient', id],
    queryFn: async () => {
      const response = await api.get(`/cardiology/patients/${id}`);
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
        bloodType: patient.bloodType || '',
        nationalId: patient.nationalId || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        city: patient.city || '',
        emergencyContact: patient.emergencyContact || '',
        emergencyPhone: patient.emergencyPhone || '',
        primaryDiagnosis: patient.primaryDiagnosis || '',
        riskLevel: patient.riskLevel || 'low',
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
        return api.put(`/cardiology/patients/${id}`, data);
      }
      return api.post('/cardiology/patients', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardiology-patients'] });
      toast.success(isEditing ? t('cardiology.patientUpdated') : t('cardiology.patientCreated'));
      navigate('/cardiology/patients');
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
        <div className="animate-spin h-8 w-8 border-4 border-gray-900 dark:border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? t('editPatient') || 'Modifier Patient' : t('newPatient') || 'Nouveau Patient'}
        subtitle={isEditing ? t('editPatientDescription') || 'Modifier les informations du patient' : t('newPatientDescription') || 'Créer un nouveau patient cardiologie'}
        icon={Heart}
        module="cardiology"
        onBack={() => navigate('/cardiology/patients')}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <FormSection
          title={t('personalInfo') || 'Informations Personnelles'}
          icon={User}
          module="cardiology"
        >
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
                className={`w-full px-3 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white`}
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
                className={`w-full px-3 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white`}
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
                className={`w-full px-3 py-2 border ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white`}
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              >
                <option value="male">{t('male') || 'Homme'}</option>
                <option value="female">{t('female') || 'Femme'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('bloodType') || 'Groupe sanguin'}
              </label>
              <select
                name="bloodType"
                value={formData.bloodType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              >
                <option value="">--</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>
          </FormGrid>
        </FormSection>

        {/* Contact Information */}
        <FormSection
          title={t('contactInfo') || 'Coordonnées'}
          icon={Phone}
          module="cardiology"
        >
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
                className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white`}
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>
          </FormGrid>
        </FormSection>

        {/* Medical Information */}
        <FormSection
          title={t('medicalInfo') || 'Informations Médicales'}
          icon={Activity}
          module="cardiology"
        >
          <FormGrid columns={2}>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('primaryDiagnosis') || 'Diagnostic principal'}
              </label>
              <input
                type="text"
                name="primaryDiagnosis"
                value={formData.primaryDiagnosis}
                onChange={handleChange}
                placeholder="Ex: Insuffisance cardiaque, HTA..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('riskLevel') || 'Niveau de risque'}
              </label>
              <select
                name="riskLevel"
                value={formData.riskLevel}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              >
                <option value="low">{t('low') || 'Faible'}</option>
                <option value="medium">{t('medium') || 'Moyen'}</option>
                <option value="high">{t('high') || 'Élevé'}</option>
                <option value="critical">{t('critical') || 'Critique'}</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                {t('allergies') || 'Allergies'}
              </label>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleChange}
                rows={2}
                placeholder="Liste des allergies connues..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
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
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white"
              />
            </div>
          </FormGrid>
        </FormSection>

        {/* Actions */}
        <FormActions>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/cardiology/patients')}
            module="cardiology"
          >
            {t('cancel') || 'Annuler'}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={mutation.isPending}
            icon={Save}
            module="cardiology"
          >
            {mutation.isPending ? (t('saving') || 'Enregistrement...') : (t('save') || 'Enregistrer')}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
