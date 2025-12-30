/**
 * Dialyse Consumable Form Page
 * Create or edit a consumable
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Save } from 'lucide-react';
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

interface ConsumableFormData {
  code: string;
  name: string;
  category: string;
  unit: string;
  currentStock: string;
  minimumStock: string;
  reorderLevel: string;
  unitCost: string;
  supplier: string;
  expiryDate: string;
  storageLocation: string;
  status: string;
  description: string;
}

const initialFormData: ConsumableFormData = {
  code: '',
  name: '',
  category: 'dialyzer',
  unit: 'unit',
  currentStock: '0',
  minimumStock: '10',
  reorderLevel: '20',
  unitCost: '',
  supplier: '',
  expiryDate: '',
  storageLocation: '',
  status: 'active',
  description: '',
};


export function DialyseConsumableFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const toast = useToast();
  const isEditing = !!id;

  const [formData, setFormData] = useState<ConsumableFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories = [
    { value: 'dialyzer', label: t('dialyse.consumables.category.dialyzer') },
    { value: 'bloodline', label: t('dialyse.consumables.category.bloodline') },
    { value: 'needle', label: t('dialyse.consumables.category.needle') },
    { value: 'concentrate', label: t('dialyse.consumables.category.concentrate') },
    { value: 'medication', label: t('dialyse.consumables.category.medication') },
    { value: 'disinfectant', label: t('dialyse.consumables.category.disinfectant') },
    { value: 'dressing', label: t('dialyse.consumables.category.dressing') },
    { value: 'other', label: t('dialyse.consumables.category.other') },
  ];

  const units = [
    { value: 'unit', label: t('dialyse.consumables.unit.unit') },
    { value: 'box', label: t('dialyse.consumables.unit.box') },
    { value: 'pack', label: t('dialyse.consumables.unit.pack') },
    { value: 'liter', label: t('dialyse.consumables.unit.liter') },
    { value: 'ml', label: t('dialyse.consumables.unit.ml') },
    { value: 'kg', label: t('dialyse.consumables.unit.kg') },
    { value: 'gram', label: t('dialyse.consumables.unit.gram') },
  ];

  const statusOptions = [
    { value: 'active', label: t('dialyse.consumables.status.active') },
    { value: 'discontinued', label: t('dialyse.consumables.status.discontinued') },
    { value: 'out_of_stock', label: t('dialyse.consumables.status.out_of_stock') },
  ];

  // Fetch existing consumable if editing
  const { data: existingConsumable, isLoading: isLoadingConsumable } = useQuery({
    queryKey: ['dialyse-consumable', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<any>>(`/dialyse/consumables/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingConsumable) {
      setFormData({
        code: existingConsumable.code || '',
        name: existingConsumable.name || '',
        category: existingConsumable.category || 'dialyzer',
        unit: existingConsumable.unit || 'unit',
        currentStock: existingConsumable.currentStock?.toString() || '0',
        minimumStock: existingConsumable.minimumStock?.toString() || '10',
        reorderLevel: existingConsumable.reorderLevel?.toString() || '20',
        unitCost: existingConsumable.unitCost?.toString() || '',
        supplier: existingConsumable.supplier || '',
        expiryDate: existingConsumable.expiryDate?.split('T')[0] || '',
        storageLocation: existingConsumable.storageLocation || '',
        status: existingConsumable.status || 'active',
        description: existingConsumable.description || '',
      });
    }
  }, [existingConsumable]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post<ApiResponse<any>>('/dialyse/consumables', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-consumables'] });
      navigate('/dialyse/consumables');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put<ApiResponse<any>>(`/dialyse/consumables/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-consumables'] });
      navigate('/dialyse/consumables');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = t('dialyse.consumables.form.validation.nameRequired');
    }
    if (!formData.code) {
      newErrors.code = t('dialyse.consumables.form.validation.codeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      code: formData.code,
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      currentStock: parseInt(formData.currentStock) || 0,
      minimumStock: parseInt(formData.minimumStock) || 10,
      reorderLevel: parseInt(formData.reorderLevel) || 20,
      unitCost: formData.unitCost ? parseFloat(formData.unitCost) : null,
      supplier: formData.supplier || null,
      expiryDate: formData.expiryDate || null,
      storageLocation: formData.storageLocation || null,
      status: formData.status,
      description: formData.description || null,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleChange = (field: keyof ConsumableFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  if (isEditing && isLoadingConsumable) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t('dialyse.consumables.form.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? t('dialyse.consumables.form.editTitle') : t('dialyse.consumables.form.newTitle')}
        subtitle={isEditing ? t('dialyse.consumables.form.editDescription') : t('dialyse.consumables.form.newDescription')}
        icon={Package}
        module="dialyse"
        onBack={() => navigate('/dialyse/consumables')}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title={t('dialyse.consumables.form.generalInfo')} module="dialyse">
          <FormGrid columns={2}>
            <Input
              label={t('dialyse.consumables.form.code')}
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
              placeholder={t('dialyse.consumables.form.codePlaceholder')}
              error={errors.code}
              required
              module="dialyse"
            />

            <Input
              label={t('dialyse.consumables.form.name')}
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('dialyse.consumables.form.namePlaceholder')}
              error={errors.name}
              required
              module="dialyse"
            />

            <Select
              label={t('dialyse.consumables.form.category')}
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              options={categories}
              module="dialyse"
            />

            <Select
              label={t('dialyse.consumables.form.unit')}
              value={formData.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              options={units}
              module="dialyse"
            />

            <Select
              label={t('dialyse.consumables.form.status')}
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={statusOptions}
              module="dialyse"
            />

            <Input
              label={t('dialyse.consumables.form.storageLocation')}
              value={formData.storageLocation}
              onChange={(e) => handleChange('storageLocation', e.target.value)}
              placeholder={t('dialyse.consumables.form.storageLocationPlaceholder')}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.consumables.form.stockLevels')} module="dialyse">
          <FormGrid columns={3}>
            <Input
              type="number"
              label={t('dialyse.consumables.form.currentStock')}
              value={formData.currentStock}
              onChange={(e) => handleChange('currentStock', e.target.value)}
              placeholder="0"
              module="dialyse"
            />

            <div>
              <Input
                type="number"
                label={t('dialyse.consumables.form.minimumStock')}
                value={formData.minimumStock}
                onChange={(e) => handleChange('minimumStock', e.target.value)}
                placeholder="10"
                module="dialyse"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('dialyse.consumables.form.minimumStockHint')}</p>
            </div>

            <div>
              <Input
                type="number"
                label={t('dialyse.consumables.form.reorderLevel')}
                value={formData.reorderLevel}
                onChange={(e) => handleChange('reorderLevel', e.target.value)}
                placeholder="20"
                module="dialyse"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('dialyse.consumables.form.reorderLevelHint')}</p>
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={t('dialyse.consumables.form.supplierCost')} module="dialyse">
          <FormGrid columns={2}>
            <Input
              label={t('dialyse.consumables.form.supplier')}
              value={formData.supplier}
              onChange={(e) => handleChange('supplier', e.target.value)}
              placeholder={t('dialyse.consumables.form.supplierPlaceholder')}
              module="dialyse"
            />

            <Input
              type="number"
              step="0.01"
              label={t('dialyse.consumables.form.unitCost')}
              value={formData.unitCost}
              onChange={(e) => handleChange('unitCost', e.target.value)}
              placeholder="0.00"
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.consumables.form.expiryDate')}
              value={formData.expiryDate}
              onChange={(e) => handleChange('expiryDate', e.target.value)}
              module="dialyse"
            />

            <div className="md:col-span-2">
              <Textarea
                label={t('dialyse.consumables.form.description')}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={2}
                placeholder={t('dialyse.consumables.form.descriptionPlaceholder')}
                module="dialyse"
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormActions>
          <Button
            variant="outline"
            onClick={() => navigate('/dialyse/consumables')}
          >
            {t('dialyse.consumables.form.cancel')}
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
              ? t('dialyse.consumables.form.saving')
              : isEditing
              ? t('dialyse.consumables.form.update')
              : t('dialyse.consumables.form.add')}
          </Button>
        </FormActions>

        {(createMutation.isError || updateMutation.isError) && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-800 p-4 text-slate-800 dark:text-slate-300">
            {getErrorMessage(createMutation.error || updateMutation.error)}
          </div>
        )}
      </form>
    </div>
  );
}
