/**
 * Dialyse Billing Form Page
 * Create or edit a billing record
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Receipt, Save } from 'lucide-react';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import {
  PageHeader,
  FormSection,
  FormGrid,
  FormActions,
  Button,
  Input,
  Select,
  Textarea
} from '@/components/healthcare';

interface Patient {
  id: string;
  medicalId: string;
  contact: {
    firstName: string;
    lastName: string;
  };
}

interface BillingFormData {
  patientId: string;
  sessionId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  sessionFee: string;
  medicationFee: string;
  consumablesFee: string;
  transportFee: string;
  otherFees: string;
  discount: string;
  insuranceCoverage: string;
  patientPayment: string;
  paymentMethod: string;
  paymentDate: string;
  notes: string;
}

const initialFormData: BillingFormData = {
  patientId: '',
  sessionId: '',
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  status: 'pending',
  sessionFee: '',
  medicationFee: '',
  consumablesFee: '',
  transportFee: '',
  otherFees: '',
  discount: '',
  insuranceCoverage: '',
  patientPayment: '',
  paymentMethod: '',
  paymentDate: '',
  notes: '',
};

export function DialyseBillingFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const toast = useToast();
  const isEditing = !!id;

  const [formData, setFormData] = useState<BillingFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const statusOptions = [
    { value: 'pending', label: t('dialyse.statusPending') },
    { value: 'partial', label: t('dialyse.statusPartial') },
    { value: 'paid', label: t('dialyse.statusPaid') },
    { value: 'overdue', label: t('dialyse.statusOverdue') },
    { value: 'cancelled', label: t('dialyse.statusCancelled') },
  ];

  const paymentMethods = [
    { value: 'cash', label: t('dialyse.paymentCash') },
    { value: 'card', label: t('dialyse.paymentCard') },
    { value: 'transfer', label: t('dialyse.paymentTransfer') },
    { value: 'check', label: t('dialyse.paymentCheck') },
    { value: 'insurance', label: t('dialyse.paymentInsurance') },
  ];

  // Fetch patients for selection
  const { data: patients } = useQuery({
    queryKey: ['dialyse-patients-list'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Patient[]>>('/dialyse/patients?limit=100');
      return response.data.data;
    },
  });

  // Fetch existing billing if editing
  const { data: existingBilling, isLoading: isLoadingBilling } = useQuery({
    queryKey: ['dialyse-billing', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/dialyse/billing/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingBilling) {
      setFormData({
        patientId: existingBilling.patientId || '',
        sessionId: existingBilling.sessionId || '',
        invoiceNumber: existingBilling.invoiceNumber || '',
        invoiceDate: existingBilling.invoiceDate?.split('T')[0] || '',
        dueDate: existingBilling.dueDate?.split('T')[0] || '',
        status: existingBilling.status || 'pending',
        sessionFee: existingBilling.sessionFee?.toString() || '',
        medicationFee: existingBilling.medicationFee?.toString() || '',
        consumablesFee: existingBilling.consumablesFee?.toString() || '',
        transportFee: existingBilling.transportFee?.toString() || '',
        otherFees: existingBilling.otherFees?.toString() || '',
        discount: existingBilling.discount?.toString() || '',
        insuranceCoverage: existingBilling.insuranceCoverage?.toString() || '',
        patientPayment: existingBilling.patientPayment?.toString() || '',
        paymentMethod: existingBilling.paymentMethod || '',
        paymentDate: existingBilling.paymentDate?.split('T')[0] || '',
        notes: existingBilling.notes || '',
      });
    }
  }, [existingBilling]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<any>>('/dialyse/billing', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-billing'] });
      navigate('/dialyse/billing');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put<ApiResponse<any>>(`/dialyse/billing/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-billing'] });
      navigate('/dialyse/billing');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.patientId) {
      newErrors.patientId = t('dialyse.patientRequired');
    }
    if (!formData.invoiceDate) {
      newErrors.invoiceDate = t('dialyse.invoiceDateRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = (): number => {
    const session = parseFloat(formData.sessionFee) || 0;
    const medication = parseFloat(formData.medicationFee) || 0;
    const consumables = parseFloat(formData.consumablesFee) || 0;
    const transport = parseFloat(formData.transportFee) || 0;
    const other = parseFloat(formData.otherFees) || 0;
    const discount = parseFloat(formData.discount) || 0;
    return session + medication + consumables + transport + other - discount;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      patientId: formData.patientId,
      sessionId: formData.sessionId || null,
      invoiceNumber: formData.invoiceNumber || `INV-${Date.now()}`,
      invoiceDate: formData.invoiceDate,
      dueDate: formData.dueDate || null,
      status: formData.status,
      sessionFee: parseFloat(formData.sessionFee) || 0,
      medicationFee: parseFloat(formData.medicationFee) || 0,
      consumablesFee: parseFloat(formData.consumablesFee) || 0,
      transportFee: parseFloat(formData.transportFee) || 0,
      otherFees: parseFloat(formData.otherFees) || 0,
      discount: parseFloat(formData.discount) || 0,
      totalAmount: calculateTotal(),
      insuranceCoverage: parseFloat(formData.insuranceCoverage) || 0,
      patientPayment: parseFloat(formData.patientPayment) || 0,
      paymentMethod: formData.paymentMethod || null,
      paymentDate: formData.paymentDate || null,
      notes: formData.notes || null,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (field: keyof BillingFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (isEditing && isLoadingBilling) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t('dialyse.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? t('dialyse.editInvoice') : t('dialyse.newInvoice')}
        subtitle={isEditing ? t('dialyse.editInvoiceSubtitle') : t('dialyse.newInvoiceSubtitle')}
        icon={Receipt}
        module="dialyse"
        onBack={() => navigate('/dialyse/billing')}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={t('dialyse.generalInformation')} module="dialyse">
          <FormGrid columns={2}>
            <Select
              label={t('dialyse.patient')}
              value={formData.patientId}
              onChange={(e) => handleChange('patientId', e.target.value)}
              options={patients?.map((patient) => ({
                value: patient.id,
                label: `${patient.contact.firstName} ${patient.contact.lastName} - ${patient.medicalId}`
              })) || []}
              placeholder={t('dialyse.selectPatient')}
              error={errors.patientId}
              required
              module="dialyse"
            />

            <Input
              label={t('dialyse.invoiceNumber')}
              value={formData.invoiceNumber}
              onChange={(e) => handleChange('invoiceNumber', e.target.value)}
              placeholder={t('dialyse.autoGenerated')}
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.invoiceDate')}
              value={formData.invoiceDate}
              onChange={(e) => handleChange('invoiceDate', e.target.value)}
              error={errors.invoiceDate}
              required
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.dueDate')}
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
              module="dialyse"
            />

            <Select
              label={t('dialyse.status')}
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={statusOptions}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.amounts')} module="dialyse">
          <FormGrid columns={3}>
            <Input
              type="number"
              step="0.01"
              label={`${t('dialyse.sessionFee')} (MAD)`}
              value={formData.sessionFee}
              onChange={(e) => handleChange('sessionFee', e.target.value)}
              placeholder="0.00"
              module="dialyse"
            />

            <Input
              type="number"
              step="0.01"
              label={`${t('dialyse.medications')} (MAD)`}
              value={formData.medicationFee}
              onChange={(e) => handleChange('medicationFee', e.target.value)}
              placeholder="0.00"
              module="dialyse"
            />

            <Input
              type="number"
              step="0.01"
              label={`${t('dialyse.consumables')} (MAD)`}
              value={formData.consumablesFee}
              onChange={(e) => handleChange('consumablesFee', e.target.value)}
              placeholder="0.00"
              module="dialyse"
            />

            <Input
              type="number"
              step="0.01"
              label={`${t('dialyse.transport')} (MAD)`}
              value={formData.transportFee}
              onChange={(e) => handleChange('transportFee', e.target.value)}
              placeholder="0.00"
              module="dialyse"
            />

            <Input
              type="number"
              step="0.01"
              label={`${t('dialyse.otherFees')} (MAD)`}
              value={formData.otherFees}
              onChange={(e) => handleChange('otherFees', e.target.value)}
              placeholder="0.00"
              module="dialyse"
            />

            <Input
              type="number"
              step="0.01"
              label={`${t('dialyse.discount')} (MAD)`}
              value={formData.discount}
              onChange={(e) => handleChange('discount', e.target.value)}
              placeholder="0.00"
              module="dialyse"
            />
          </FormGrid>

          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>{t('dialyse.total')}</span>
              <span>{calculateTotal().toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}</span>
            </div>
          </div>
        </FormSection>

        <FormSection title={t('dialyse.payment')} module="dialyse">
          <FormGrid columns={2}>
            <Input
              type="number"
              step="0.01"
              label={`${t('dialyse.insuranceCoverage')} (MAD)`}
              value={formData.insuranceCoverage}
              onChange={(e) => handleChange('insuranceCoverage', e.target.value)}
              placeholder="0.00"
              module="dialyse"
            />

            <Input
              type="number"
              step="0.01"
              label={`${t('dialyse.patientPayment')} (MAD)`}
              value={formData.patientPayment}
              onChange={(e) => handleChange('patientPayment', e.target.value)}
              placeholder="0.00"
              module="dialyse"
            />

            <Select
              label={t('dialyse.paymentMethod')}
              value={formData.paymentMethod}
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
              options={paymentMethods}
              placeholder={t('dialyse.select')}
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.paymentDate')}
              value={formData.paymentDate}
              onChange={(e) => handleChange('paymentDate', e.target.value)}
              module="dialyse"
            />

            <div className="md:col-span-2">
              <Textarea
                label={t('dialyse.notes')}
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
                placeholder={t('dialyse.additionalNotes')}
                module="dialyse"
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormActions>
          <Button
            variant="outline"
            onClick={() => navigate('/dialyse/billing')}
          >
            {t('dialyse.cancel')}
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
              : isEditing
              ? t('dialyse.update')
              : t('dialyse.createInvoice')}
          </Button>
        </FormActions>

        {(createMutation.isError || updateMutation.isError) && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-600 dark:text-red-400">
            {getErrorMessage(createMutation.error || updateMutation.error)}
          </div>
        )}
      </form>
    </div>
  );
}
