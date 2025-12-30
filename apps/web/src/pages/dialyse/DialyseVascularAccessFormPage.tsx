/**
 * Dialyse Vascular Access Form Page
 * Create/Edit vascular access for dialysis patients
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Activity, Save } from 'lucide-react';
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

interface VascularAccessFormData {
  patientId: string;
  type: 'fav' | 'catheter_permanent' | 'catheter_temporary' | 'graft';
  location: string;
  side: 'left' | 'right' | 'bilateral';
  status: 'active' | 'maturing' | 'failed' | 'removed';
  creationDate: string;
  firstUseDate: string;
  surgeon: string;
  hospital: string;
  lastControlDate: string;
  nextControlDate: string;
  flowRate: number | null;
  complications: string;
  notes: string;
}

const defaultFormData: VascularAccessFormData = {
  patientId: '',
  type: 'fav',
  location: '',
  side: 'left',
  status: 'maturing',
  creationDate: new Date().toISOString().split('T')[0],
  firstUseDate: '',
  surgeon: '',
  hospital: '',
  lastControlDate: '',
  nextControlDate: '',
  flowRate: null,
  complications: '',
  notes: '',
};

// Common locations by access type
const locationsByType: Record<string, string[]> = {
  fav: [
    'Avant-bras gauche (radio-céphalique)',
    'Avant-bras droit (radio-céphalique)',
    'Bras gauche (brachio-céphalique)',
    'Bras droit (brachio-céphalique)',
    'Bras gauche (brachio-basilique)',
    'Bras droit (brachio-basilique)',
    'Cuisse gauche',
    'Cuisse droite',
  ],
  catheter_permanent: [
    'Jugulaire interne droite',
    'Jugulaire interne gauche',
    'Sous-clavière droite',
    'Sous-clavière gauche',
    'Fémorale droite',
    'Fémorale gauche',
  ],
  catheter_temporary: [
    'Jugulaire interne droite',
    'Jugulaire interne gauche',
    'Fémorale droite',
    'Fémorale gauche',
  ],
  graft: [
    'Avant-bras gauche',
    'Avant-bras droit',
    'Bras gauche',
    'Bras droit',
    'Cuisse gauche',
    'Cuisse droite',
  ],
};

export function DialyseVascularAccessFormPage() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const patientIdParam = searchParams.get('patientId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();
  const isEditing = !!id;

  const [formData, setFormData] = useState<VascularAccessFormData>({
    ...defaultFormData,
    patientId: patientIdParam || '',
  });

  // Fetch patient if patientId is provided
  const { data: patient } = useQuery({
    queryKey: ['dialyse-patient', patientIdParam],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Patient>>(`/dialyse/patients/${patientIdParam}`);
      return response.data.data;
    },
    enabled: !!patientIdParam,
  });

  // Fetch patients for selection if no patientId
  const { data: patients } = useQuery({
    queryKey: ['dialyse-patients-list'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Patient[]>>('/dialyse/patients?status=active&limit=100');
      return response.data.data;
    },
    enabled: !patientIdParam,
  });

  // Fetch vascular access if editing
  const { data: vascularAccess } = useQuery({
    queryKey: ['dialyse-vascular-access', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<VascularAccessFormData & { id: string }>>(`/dialyse/vascular-accesses/${id}`);
      return response.data.data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (vascularAccess) {
      setFormData({
        patientId: vascularAccess.patientId,
        type: vascularAccess.type,
        location: vascularAccess.location || '',
        side: vascularAccess.side || 'left',
        status: vascularAccess.status,
        creationDate: vascularAccess.creationDate ? new Date(vascularAccess.creationDate).toISOString().split('T')[0] : '',
        firstUseDate: vascularAccess.firstUseDate ? new Date(vascularAccess.firstUseDate).toISOString().split('T')[0] : '',
        surgeon: vascularAccess.surgeon || '',
        hospital: vascularAccess.hospital || '',
        lastControlDate: vascularAccess.lastControlDate ? new Date(vascularAccess.lastControlDate).toISOString().split('T')[0] : '',
        nextControlDate: vascularAccess.nextControlDate ? new Date(vascularAccess.nextControlDate).toISOString().split('T')[0] : '',
        flowRate: vascularAccess.flowRate,
        complications: vascularAccess.complications || '',
        notes: vascularAccess.notes || '',
      });
    }
  }, [vascularAccess]);

  // Create/Update mutation
  const saveVascularAccess = useMutation({
    mutationFn: async (data: VascularAccessFormData) => {
      const payload = {
        patientId: data.patientId,
        type: data.type,
        location: data.location || undefined,
        side: data.side,
        status: data.status,
        creationDate: data.creationDate || undefined,
        firstUseDate: data.firstUseDate || undefined,
        surgeon: data.surgeon || undefined,
        hospital: data.hospital || undefined,
        lastControlDate: data.lastControlDate || undefined,
        nextControlDate: data.nextControlDate || undefined,
        flowRate: data.flowRate || undefined,
        complications: data.complications || undefined,
        notes: data.notes || undefined,
      };

      if (isEditing) {
        const response = await api.put<ApiResponse<unknown>>(`/dialyse/vascular-accesses/${id}`, payload);
        return response.data;
      } else {
        const response = await api.post<ApiResponse<unknown>>('/dialyse/vascular-accesses', payload);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-vascular-accesses'] });
      queryClient.invalidateQueries({ queryKey: ['dialyse-patient-accesses'] });
      toast.success(isEditing ? t('dialyse.vascularAccessUpdated') : t('dialyse.vascularAccessCreated'));
      if (patientIdParam) {
        navigate(`/dialyse/patients/${patientIdParam}`);
      } else {
        navigate('/dialyse/patients');
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patientId) {
      toast.warning(t('dialyse.pleaseSelectPatient'));
      return;
    }
    saveVascularAccess.mutate(formData);
  };

  const handleChange = (field: keyof VascularAccessFormData, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fav: t('dialyse.vascularAccessTypeFAV'),
      catheter_permanent: t('dialyse.vascularAccessTypeCatheterPermanent'),
      catheter_temporary: t('dialyse.vascularAccessTypeCatheterTemporary'),
      graft: t('dialyse.vascularAccessTypeGraft'),
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={isEditing ? t('dialyse.editVascularAccess') : t('dialyse.newVascularAccess')}
        subtitle={patient ? `${t('dialyse.patient')}: ${patient.contact.firstName} ${patient.contact.lastName} (${patient.medicalId})` : t('dialyse.recordVascularAccess')}
        icon={Activity}
        module="dialyse"
        onBack={() => navigate(-1)}
      />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        {!patientIdParam && (
          <FormSection title={t('dialyse.patient')} module="dialyse">
            <Select
              value={formData.patientId}
              onChange={(e) => handleChange('patientId', e.target.value)}
              options={[
                { value: '', label: t('dialyse.selectPatient') },
                ...(patients?.map((p) => ({
                  value: p.id,
                  label: `${p.contact.firstName} ${p.contact.lastName} (${p.medicalId})`
                })) || [])
              ]}
              required
              module="dialyse"
            />
          </FormSection>
        )}

        {/* Access Type */}
        <FormSection title={t('dialyse.accessType')} module="dialyse">
          <FormGrid columns={2}>
            <Select
              label={t('dialyse.type')}
              value={formData.type}
              onChange={(e) => {
                handleChange('type', e.target.value);
                handleChange('location', ''); // Reset location when type changes
              }}
              options={[
                { value: 'fav', label: getTypeLabel('fav') },
                { value: 'catheter_permanent', label: getTypeLabel('catheter_permanent') },
                { value: 'catheter_temporary', label: getTypeLabel('catheter_temporary') },
                { value: 'graft', label: getTypeLabel('graft') }
              ]}
              required
              module="dialyse"
            />

            <Select
              label={t('dialyse.status')}
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              options={[
                { value: 'maturing', label: t('dialyse.statusMaturing') },
                { value: 'active', label: t('dialyse.statusActive') },
                { value: 'failed', label: t('dialyse.statusFailed') },
                { value: 'removed', label: t('dialyse.statusRemoved') }
              ]}
              required
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        {/* Location */}
        <FormSection title={t('dialyse.location')} module="dialyse">
          <FormGrid columns={2}>
            <div className="space-y-2">
              <Select
                label={t('dialyse.anatomicalSite')}
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                options={[
                  { value: '', label: t('dialyse.selectOrEnterManually') },
                  ...(locationsByType[formData.type]?.map((loc) => ({
                    value: loc,
                    label: loc
                  })) || [])
                ]}
                module="dialyse"
              />
              <Input
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder={t('dialyse.orEnterManually')}
                module="dialyse"
              />
            </div>

            <Select
              label={t('dialyse.side')}
              value={formData.side}
              onChange={(e) => handleChange('side', e.target.value)}
              options={[
                { value: 'left', label: t('dialyse.left') },
                { value: 'right', label: t('dialyse.right') },
                { value: 'bilateral', label: t('dialyse.bilateral') }
              ]}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        {/* Dates */}
        <FormSection title={t('dialyse.dates')} module="dialyse">
          <FormGrid columns={4}>
            <Input
              type="date"
              label={t('dialyse.creationDate')}
              value={formData.creationDate}
              onChange={(e) => handleChange('creationDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.firstUse')}
              value={formData.firstUseDate}
              onChange={(e) => handleChange('firstUseDate', e.target.value)}
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.lastControl')}
              value={formData.lastControlDate}
              onChange={(e) => handleChange('lastControlDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              module="dialyse"
            />

            <Input
              type="date"
              label={t('dialyse.nextControl')}
              value={formData.nextControlDate}
              onChange={(e) => handleChange('nextControlDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              module="dialyse"
            />
          </FormGrid>
        </FormSection>

        {/* Medical Info */}
        <FormSection title={t('dialyse.medicalInformation')} module="dialyse">
          <FormGrid columns={3}>
            <Input
              label={t('dialyse.surgeon')}
              value={formData.surgeon}
              onChange={(e) => handleChange('surgeon', e.target.value)}
              placeholder={t('dialyse.surgeonPlaceholder')}
              module="dialyse"
            />

            <Input
              label={t('dialyse.facility')}
              value={formData.hospital}
              onChange={(e) => handleChange('hospital', e.target.value)}
              placeholder={t('dialyse.facilityPlaceholder')}
              module="dialyse"
            />

            <div>
              <Input
                type="number"
                label={t('dialyse.flowRate')}
                value={formData.flowRate ?? ''}
                onChange={(e) => handleChange('flowRate', e.target.value ? parseInt(e.target.value) : null)}
                min={0}
                max={3000}
                step={50}
                placeholder={t('dialyse.flowRatePlaceholder')}
                module="dialyse"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {formData.type === 'fav' || formData.type === 'graft' ? t('dialyse.fistulaFlow') : t('dialyse.catheterFlow')}
              </p>
            </div>
          </FormGrid>
        </FormSection>

        {/* Complications */}
        <FormSection title={t('dialyse.complicationsHistory')} module="dialyse">
          <Textarea
            value={formData.complications}
            onChange={(e) => handleChange('complications', e.target.value)}
            rows={3}
            placeholder={t('dialyse.complicationsPlaceholder')}
            module="dialyse"
          />
        </FormSection>

        {/* Notes */}
        <FormSection title={t('dialyse.notes')} module="dialyse">
          <Textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            placeholder={t('dialyse.notesPlaceholder')}
            module="dialyse"
          />
        </FormSection>

        <FormActions>
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            {t('dialyse.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            module="dialyse"
            disabled={saveVascularAccess.isPending}
            loading={saveVascularAccess.isPending}
            icon={Save}
          >
            {saveVascularAccess.isPending ? t('dialyse.saving') : isEditing ? t('dialyse.update') : t('dialyse.createVascularAccess')}
          </Button>
        </FormActions>
      </form>
    </div>
  );
}
