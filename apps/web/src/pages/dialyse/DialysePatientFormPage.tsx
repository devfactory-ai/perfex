/**
 * Dialyse Patient Form Page
 * Create or edit a dialysis patient
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Save } from 'lucide-react';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  PageHeader,
  FormSection,
  FormGrid,
  FormActions,
  Button,
  Input,
  Select,
  Textarea,
  Checkbox,
  PageLoading,
} from '@/components/healthcare';

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

interface PatientFormData {
  contactId: string;
  medicalId: string;
  bloodType: string;
  dryWeight: string;
  renalFailureEtiology: string;
  hivStatus: string;
  hbvStatus: string;
  hcvStatus: string;
  requiresIsolation: boolean;
  hepatitisBVaccinated: boolean;
  dialysisStartDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  notes: string;
}

const initialFormData: PatientFormData = {
  contactId: '',
  medicalId: '',
  bloodType: '',
  dryWeight: '',
  renalFailureEtiology: '',
  hivStatus: 'unknown',
  hbvStatus: 'unknown',
  hcvStatus: 'unknown',
  requiresIsolation: false,
  hepatitisBVaccinated: false,
  dialysisStartDate: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
  notes: '',
};

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function DialysePatientFormPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const isEditing = !!id;

  const serologyStatuses = [
    { value: 'unknown', label: t('dialyse.serologyUnknown') },
    { value: 'negative', label: t('dialyse.serologyNegative') },
    { value: 'positive', label: t('dialyse.serologyPositive') },
  ];

  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [contactSearch, setContactSearch] = useState('');

  // Fetch existing patient if editing
  const { data: existingPatient, isLoading: isLoadingPatient } = useQuery({
    queryKey: ['dialyse-patient', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/dialyse/patients/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  // Fetch contacts for selection
  const { data: contacts } = useQuery({
    queryKey: ['contacts-search', contactSearch],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Contact[]>>(`/contacts?search=${contactSearch}&limit=20`);
      return response.data.data;
    },
    enabled: !isEditing && contactSearch.length >= 2,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingPatient) {
      setFormData({
        contactId: existingPatient.contactId || '',
        medicalId: existingPatient.medicalId || '',
        bloodType: existingPatient.bloodType || '',
        dryWeight: existingPatient.dryWeight?.toString() || '',
        renalFailureEtiology: existingPatient.renalFailureEtiology || '',
        hivStatus: existingPatient.hivStatus || 'unknown',
        hbvStatus: existingPatient.hbvStatus || 'unknown',
        hcvStatus: existingPatient.hcvStatus || 'unknown',
        requiresIsolation: existingPatient.requiresIsolation || false,
        hepatitisBVaccinated: existingPatient.hepatitisBVaccinated || false,
        dialysisStartDate: existingPatient.dialysisStartDate
          ? new Date(existingPatient.dialysisStartDate).toISOString().split('T')[0]
          : '',
        emergencyContactName: existingPatient.emergencyContactName || '',
        emergencyContactPhone: existingPatient.emergencyContactPhone || '',
        emergencyContactRelation: existingPatient.emergencyContactRelation || '',
        notes: existingPatient.notes || '',
      });
    }
  }, [existingPatient]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<any>>('/dialyse/patients', data);
      return response.data.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-patients'] });
      navigate(`/dialyse/patients/${data.id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put<ApiResponse<any>>(`/dialyse/patients/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-patients'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-patient', id] });
      navigate(`/dialyse/patients/${id}`);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!isEditing && !formData.contactId) {
      newErrors.contactId = t('dialyse.selectContactRequired');
    }
    if (!formData.medicalId.trim()) {
      newErrors.medicalId = t('dialyse.medicalIdRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      contactId: formData.contactId,
      medicalId: formData.medicalId,
      bloodType: formData.bloodType || null,
      dryWeight: formData.dryWeight ? parseFloat(formData.dryWeight) : null,
      renalFailureEtiology: formData.renalFailureEtiology || null,
      hivStatus: formData.hivStatus,
      hbvStatus: formData.hbvStatus,
      hcvStatus: formData.hcvStatus,
      requiresIsolation: formData.requiresIsolation,
      hepatitisBVaccinated: formData.hepatitisBVaccinated,
      dialysisStartDate: formData.dialysisStartDate || null,
      emergencyContactName: formData.emergencyContactName || null,
      emergencyContactPhone: formData.emergencyContactPhone || null,
      emergencyContactRelation: formData.emergencyContactRelation || null,
      notes: formData.notes || null,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const selectContact = (contact: Contact) => {
    setFormData(prev => ({ ...prev, contactId: contact.id }));
    setContactSearch(`${contact.firstName} ${contact.lastName}`);
  };

  if (isEditing && isLoadingPatient) {
    return <PageLoading module="dialyse" message={t('common.loading')} />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title={isEditing ? t('dialyse.editPatient') : t('dialyse.newPatientDialyse')}
        subtitle={isEditing ? t('dialyse.editPatientInfo') : t('dialyse.registerNewPatient')}
        icon={UserPlus}
        module="dialyse"
        onBack={() => navigate(isEditing ? `/dialyse/patients/${id}` : '/dialyse/patients')}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Contact Selection (only for new patients) */}
        {!isEditing && (
          <FormSection title={t('dialyse.crmContact')} module="dialyse">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('dialyse.searchContact')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder={t('dialyse.searchContactPlaceholder')}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:ring-2 focus:ring-blue-500"
              />
              {errors.contactId && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contactId}</p>
              )}
              {contacts && contacts.length > 0 && !formData.contactId && (
                <div className="mt-2 border border-gray-300 dark:border-gray-600 rounded-lg max-h-48 overflow-y-auto">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => selectContact(contact)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-sm border-b border-gray-200 dark:border-gray-700 last:border-0"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">{contact.firstName} {contact.lastName}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{contact.email}</div>
                    </button>
                  ))}
                </div>
              )}
              {formData.contactId && (
                <p className="mt-2 text-sm text-green-600 dark:text-green-400">{t('dialyse.contactSelected')}</p>
              )}
            </div>
          </FormSection>
        )}

        {/* Medical Info */}
        <FormSection title={t('dialyse.medicalInfo')} module="dialyse">
          <FormGrid cols={2}>
            <Input
              label={t('dialyse.medicalId')}
              name="medicalId"
              value={formData.medicalId}
              onChange={handleChange}
              placeholder={t('dialyse.medicalIdPlaceholder')}
              error={errors.medicalId}
              required
              module="dialyse"
            />

            <Select
              label={t('dialyse.bloodType')}
              name="bloodType"
              value={formData.bloodType}
              onChange={handleChange}
              options={bloodTypes.map(type => ({ value: type, label: type }))}
              placeholder={t('dialyse.bloodTypeSelect')}
              module="dialyse"
            />

            <Input
              type="number"
              label={t('dialyse.dryWeight')}
              name="dryWeight"
              value={formData.dryWeight}
              onChange={handleChange}
              step="0.1"
              min="0"
              placeholder={t('dialyse.dryWeightPlaceholder')}
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.dialysisStartDate')}
              name="dialysisStartDate"
              value={formData.dialysisStartDate}
              onChange={handleChange}
              module="dialyse"
            />
          </FormGrid>

          <div className="mt-4">
            <Input
              label={t('dialyse.renalFailureEtiology')}
              name="renalFailureEtiology"
              value={formData.renalFailureEtiology}
              onChange={handleChange}
              placeholder={t('dialyse.renalFailureEtiologyPlaceholder')}
              module="dialyse"
            />
          </div>
        </FormSection>

        {/* Serology */}
        <FormSection title={t('dialyse.serology')} module="dialyse">
          <FormGrid cols={3}>
            <Select
              label={t('dialyse.hivStatus')}
              name="hivStatus"
              value={formData.hivStatus}
              onChange={handleChange}
              options={serologyStatuses}
              module="dialyse"
            />

            <Select
              label={t('dialyse.hbvStatus')}
              name="hbvStatus"
              value={formData.hbvStatus}
              onChange={handleChange}
              options={serologyStatuses}
              module="dialyse"
            />

            <Select
              label={t('dialyse.hcvStatus')}
              name="hcvStatus"
              value={formData.hcvStatus}
              onChange={handleChange}
              options={serologyStatuses}
              module="dialyse"
            />
          </FormGrid>

          <div className="mt-4 space-y-3">
            <Checkbox
              label={t('dialyse.requiresIsolationCheck')}
              name="requiresIsolation"
              checked={formData.requiresIsolation}
              onChange={handleChange}
              module="dialyse"
            />

            <Checkbox
              label={t('dialyse.hepatitisBVaccinated')}
              name="hepatitisBVaccinated"
              checked={formData.hepatitisBVaccinated}
              onChange={handleChange}
              module="dialyse"
            />
          </div>
        </FormSection>

        {/* Emergency Contact */}
        <FormSection title={t('dialyse.emergencyContact')} module="dialyse">
          <FormGrid cols={3}>
            <Input
              label={t('dialyse.emergencyContactName')}
              name="emergencyContactName"
              value={formData.emergencyContactName}
              onChange={handleChange}
              module="dialyse"
            />

            <Input
              type="tel"
              label={t('dialyse.emergencyContactPhone')}
              name="emergencyContactPhone"
              value={formData.emergencyContactPhone}
              onChange={handleChange}
              module="dialyse"
            />

            <Input
              label={t('dialyse.emergencyContactRelation')}
              name="emergencyContactRelation"
              value={formData.emergencyContactRelation}
              onChange={handleChange}
              placeholder={t('dialyse.emergencyContactRelationPlaceholder')}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        {/* Notes */}
        <FormSection title={t('dialyse.notes')} module="dialyse">
          <Textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            placeholder={t('dialyse.notesPlaceholder')}
            module="dialyse"
          />
        </FormSection>

        {/* Actions */}
        <FormActions>
          <Button
            variant="outline"
            onClick={() => navigate(isEditing ? `/dialyse/patients/${id}` : '/dialyse/patients')}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            module="dialyse"
            disabled={createMutation.isPending || updateMutation.isPending}
            loading={createMutation.isPending || updateMutation.isPending}
            icon={Save}
          >
            {createMutation.isPending || updateMutation.isPending
              ? t('dialyse.saving')
              : isEditing ? t('dialyse.updatePatient') : t('dialyse.createPatient')
            }
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
