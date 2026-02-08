/**
 * Clinical Document Form Page
 * Generate and edit AI-powered clinical documents
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  PageHeader,
  Button,
  SectionCard,
  InlineLoading,
  FormField,
  FormSelect
} from '@/components/healthcare';
import {
  FileText,
  Sparkles,
  Save,
  Send,
  CheckCircle,
  FileSignature,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Wand2
} from 'lucide-react';

interface Patient {
  id: string;
  patientNumber: string;
  contact: {
    firstName: string;
    lastName: string;
  };
}

interface ClinicalDocument {
  id: string;
  patientId: string;
  documentType: string;
  title: string;
  aiGeneratedDraft: string;
  finalContent: string;
  status: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

interface GenerateResponse {
  document: ClinicalDocument;
  generationTime: number;
}

const DOCUMENT_TYPES = [
  { value: 'consultation_note', label: 'Note de consultation' },
  { value: 'discharge_summary', label: 'Résumé de sortie' },
  { value: 'referral_letter', label: 'Lettre de référence' },
  { value: 'progress_note', label: 'Note de progression' },
  { value: 'surgical_report', label: 'Compte-rendu opératoire' },
  { value: 'procedure_note', label: 'Note de procédure' },
  { value: 'admission_note', label: "Note d'admission" },
  { value: 'transfer_note', label: 'Note de transfert' },
];

export function ClinicalDocumentFormPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id || id === 'new';

  // Form state
  const [patientId, setPatientId] = useState(searchParams.get('patientId') || '');
  const [documentType, setDocumentType] = useState('consultation_note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [clinicalContext, setClinicalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  // Fetch existing document if editing
  const { data: document, isLoading: isLoadingDocument } = useQuery({
    queryKey: ['clinical-document', id],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ClinicalDocument>>(`/clinical-ai/documentation/${id}`);
      return response.data.data;
    },
    enabled: !isNew,
  });

  // Fetch patients for selection
  const { data: patients } = useQuery({
    queryKey: ['healthcare-patients-list'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ patients: Patient[] }>>('/dialyse/patients?limit=100');
      return response.data.data?.patients || [];
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (document) {
      setPatientId(document.patientId);
      setDocumentType(document.documentType);
      setTitle(document.title || '');
      setContent(document.finalContent || document.aiGeneratedDraft || '');
    }
  }, [document]);

  // Generate document mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const response = await api.post<ApiResponse<GenerateResponse>>('/clinical-ai/documentation/generate', {
        patientId,
        documentType,
        clinicalContext: clinicalContext || undefined,
        language: 'fr',
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setContent(data?.document.aiGeneratedDraft || '');
      setTitle(data?.document.title || '');
      setGenerationTime(data?.generationTime || null);
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ['clinical-documents'] });
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  // Save document mutation
  const saveMutation = useMutation({
    mutationFn: async (action: 'save' | 'submit' | 'approve' | 'sign') => {
      if (isNew) {
        // First generate, then update
        const genResponse = await api.post<ApiResponse<GenerateResponse>>('/clinical-ai/documentation/generate', {
          patientId,
          documentType,
          clinicalContext,
          language: 'fr',
        });
        const docId = genResponse.data.data?.document.id;
        if (action === 'save') {
          return genResponse.data.data;
        }
        // Finalize with the content
        const finalizeResponse = await api.put<ApiResponse<ClinicalDocument>>(`/clinical-ai/documentation/${docId}/finalize`, {
          finalContent: content,
          approve: action === 'approve' || action === 'sign',
        });
        if (action === 'sign') {
          await api.post(`/clinical-ai/documentation/${docId}/sign`);
        }
        return finalizeResponse.data.data;
      } else {
        // Update existing
        if (action === 'save' || action === 'submit') {
          const response = await api.put<ApiResponse<ClinicalDocument>>(`/clinical-ai/documentation/${id}/finalize`, {
            finalContent: content,
            approve: action === 'submit',
          });
          return response.data.data;
        }
        if (action === 'approve') {
          const response = await api.put<ApiResponse<ClinicalDocument>>(`/clinical-ai/documentation/${id}/finalize`, {
            finalContent: content,
            approve: true,
          });
          return response.data.data;
        }
        if (action === 'sign') {
          await api.put(`/clinical-ai/documentation/${id}/finalize`, {
            finalContent: content,
            approve: true,
          });
          const response = await api.post<ApiResponse<ClinicalDocument>>(`/clinical-ai/documentation/${id}/sign`);
          return response.data.data;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-documents'] });
      queryClient.invalidateQueries({ queryKey: ['clinical-document', id] });
      navigate('/clinical-ai/documentation');
    },
  });

  if (!isNew && isLoadingDocument) {
    return <InlineLoading rows={8} />;
  }

  const canEdit = isNew || document?.status === 'draft' || document?.status === 'pending_review';
  const canSign = !isNew && (document?.status === 'approved' || document?.status === 'pending_review');

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={isNew ? t('clinicalAi.newDocument') : t('clinicalAi.editDocument')}
        subtitle={isNew ? t('clinicalAi.generateWithAI') : t('clinicalAi.reviewAndEdit')}
        icon={FileText}
        module="dialyse"
        actions={
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate('/clinical-ai/documentation')}
          >
            {t('clinicalAi.back')}
          </Button>
        }
      />

      {/* AI Generation Banner */}
      {isNew && (
        <SectionCard>
          <div className="p-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {t('clinicalAi.aiDocumentGeneration')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('clinicalAi.selectPatientAndType')}
                </p>
              </div>
            </div>
            {generationTime && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('clinicalAi.generatedIn')} {generationTime}s
              </div>
            )}
          </div>
        </SectionCard>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Form */}
        <div className="lg:col-span-1 space-y-6">
          <SectionCard>
            <div className="p-4 border-b">
              <h3 className="font-semibold">{t('clinicalAi.documentSettings')}</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Patient Selection */}
              <FormSelect
                label={t('clinicalAi.patient')}
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={!isNew}
                required
              >
                <option value="">{t('clinicalAi.selectPatient')}</option>
                {patients?.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.patientNumber} - {patient.contact.firstName} {patient.contact.lastName}
                  </option>
                ))}
              </FormSelect>

              {/* Document Type */}
              <FormSelect
                label={t('clinicalAi.documentType')}
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                disabled={!isNew}
                required
              >
                {DOCUMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </FormSelect>

              {/* Title */}
              <FormField
                label={t('clinicalAi.title')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('clinicalAi.documentTitle')}
              />

              {/* Clinical Context (for generation) */}
              {isNew && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {t('clinicalAi.clinicalContext')}
                  </label>
                  <textarea
                    value={clinicalContext}
                    onChange={(e) => setClinicalContext(e.target.value)}
                    placeholder={t('clinicalAi.clinicalContextPlaceholder')}
                    className="w-full p-3 border rounded-lg bg-background focus:ring-2 focus:ring-primary resize-none"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('clinicalAi.clinicalContextHelp')}
                  </p>
                </div>
              )}

              {/* Generate Button */}
              {isNew && (
                <Button
                  module="dialyse"
                  icon={isGenerating ? Loader2 : Wand2}
                  onClick={() => generateMutation.mutate()}
                  disabled={!patientId || isGenerating}
                  className="w-full"
                >
                  {isGenerating ? t('clinicalAi.generating') : t('clinicalAi.generateDocument')}
                </Button>
              )}
            </div>
          </SectionCard>

          {/* Status Card */}
          {!isNew && document && (
            <SectionCard>
              <div className="p-4 border-b">
                <h3 className="font-semibold">{t('clinicalAi.documentStatus')}</h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('clinicalAi.status')}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    document.status === 'signed' ? 'bg-blue-100 text-blue-700' :
                    document.status === 'approved' ? 'bg-green-100 text-green-700' :
                    document.status === 'pending_review' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {t(`clinicalAi.status.${document.status}`)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('clinicalAi.createdAt')}</span>
                  <span className="text-sm">{new Date(document.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Right: Document Editor */}
        <div className="lg:col-span-2">
          <SectionCard>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{t('clinicalAi.documentContent')}</h3>
              {!canEdit && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{t('clinicalAi.readOnly')}</span>
                </div>
              )}
            </div>
            <div className="p-4">
              {content ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={!canEdit}
                  className="w-full min-h-[500px] p-4 border rounded-lg bg-background focus:ring-2 focus:ring-primary font-mono text-sm resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              ) : (
                <div className="min-h-[500px] flex items-center justify-center border rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('clinicalAi.noContentYet')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {t('clinicalAi.selectPatientToGenerate')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {content && (
              <div className="p-4 border-t flex flex-wrap gap-3 justify-end">
                {canEdit && (
                  <>
                    <Button
                      variant="outline"
                      icon={Save}
                      onClick={() => saveMutation.mutate('save')}
                      disabled={saveMutation.isPending}
                    >
                      {t('clinicalAi.saveDraft')}
                    </Button>
                    <Button
                      variant="outline"
                      icon={Send}
                      onClick={() => saveMutation.mutate('submit')}
                      disabled={saveMutation.isPending}
                    >
                      {t('clinicalAi.submitForReview')}
                    </Button>
                    <Button
                      module="dialyse"
                      icon={CheckCircle}
                      onClick={() => saveMutation.mutate('approve')}
                      disabled={saveMutation.isPending}
                    >
                      {t('clinicalAi.approve')}
                    </Button>
                  </>
                )}
                {canSign && (
                  <Button
                    module="dialyse"
                    icon={FileSignature}
                    onClick={() => saveMutation.mutate('sign')}
                    disabled={saveMutation.isPending}
                  >
                    {t('clinicalAi.signDocument')}
                  </Button>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
