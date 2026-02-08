/**
 * Patient Summary Page
 * Generate and view AI-powered patient summaries
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  PageHeader,
  Button,
  SectionCard,
  InlineLoading,
  FormSelect
} from '@/components/healthcare';
import {
  ClipboardList,
  Sparkles,
  RefreshCw,
  FileText,
  Calendar,
  Activity,
  Pill,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Clock
} from 'lucide-react';

interface Patient {
  id: string;
  patientNumber: string;
  contact: {
    firstName: string;
    lastName: string;
  };
}

interface PatientSummary {
  id: string;
  patientId: string;
  summaryType: string;
  dateRangeStart: string | null;
  dateRangeEnd: string | null;
  generatedContent: string;
  structuredData: {
    demographics?: {
      age?: number;
      gender?: string;
      primaryDiagnosis?: string;
    };
    vitalSigns?: Array<{
      date: string;
      bloodPressure?: string;
      weight?: number;
      temperature?: number;
    }>;
    medications?: Array<{
      name: string;
      dosage: string;
      frequency: string;
    }>;
    recentEvents?: Array<{
      date: string;
      type: string;
      description: string;
    }>;
    alerts?: Array<{
      severity: string;
      message: string;
    }>;
    recommendations?: string[];
  };
  aiModel: string;
  generatedAt: string;
}

interface SummariesResponse {
  summaries: PatientSummary[];
}

interface GenerateSummaryResponse {
  summary: PatientSummary;
  generationTime: number;
}

const SUMMARY_TYPES = [
  { value: 'comprehensive', label: 'Résumé complet' },
  { value: 'periodic', label: 'Résumé périodique' },
  { value: 'pre_consultation', label: 'Pré-consultation' },
  { value: 'handoff', label: 'Transmission' },
];

export function PatientSummaryPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [summaryType, setSummaryType] = useState('comprehensive');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  // Fetch patients
  const { data: patients } = useQuery({
    queryKey: ['healthcare-patients-list'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ patients: Patient[] }>>('/dialyse/patients?limit=100');
      return response.data.data?.patients || [];
    },
  });

  // Fetch summaries for selected patient
  const { data: summariesData, isLoading: isLoadingSummaries } = useQuery({
    queryKey: ['patient-summaries', selectedPatientId],
    queryFn: async () => {
      const response = await api.get<ApiResponse<SummariesResponse>>(`/clinical-ai/summaries/${selectedPatientId}`);
      return response.data.data;
    },
    enabled: !!selectedPatientId,
  });

  // Generate summary mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const response = await api.post<ApiResponse<GenerateSummaryResponse>>('/clinical-ai/summaries/generate', {
        patientId: selectedPatientId,
        summaryType,
        dateRange: dateRange.start && dateRange.end ? {
          start: dateRange.start,
          end: dateRange.end,
        } : undefined,
        language: 'fr',
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setGenerationTime(data?.generationTime || null);
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ['patient-summaries', selectedPatientId] });
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  const latestSummary = summariesData?.summaries?.[0];

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('clinicalAi.patientSummary')}
        subtitle={t('clinicalAi.patientSummarySubtitle')}
        icon={ClipboardList}
        module="dialyse"
      />

      {/* Patient Selection */}
      <SectionCard>
        <div className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <FormSelect
                label={t('clinicalAi.selectPatient')}
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
              >
                <option value="">{t('clinicalAi.choosePatient')}</option>
                {patients?.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.patientNumber} - {patient.contact.firstName} {patient.contact.lastName}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <FormSelect
                label={t('clinicalAi.summaryType')}
                value={summaryType}
                onChange={(e) => setSummaryType(e.target.value)}
              >
                {SUMMARY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div className="flex items-end">
              <Button
                module="dialyse"
                icon={isGenerating ? Loader2 : Sparkles}
                onClick={() => generateMutation.mutate()}
                disabled={!selectedPatientId || isGenerating}
                className="w-full"
              >
                {isGenerating ? t('clinicalAi.generating') : t('clinicalAi.generateSummary')}
              </Button>
            </div>
          </div>

          {/* Optional Date Range */}
          {summaryType === 'periodic' && (
            <div className="grid gap-4 md:grid-cols-2 mt-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium mb-1">{t('clinicalAi.dateFrom')}</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('clinicalAi.dateTo')}</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full p-2 border rounded-lg bg-background"
                />
              </div>
            </div>
          )}

          {generationTime && (
            <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{t('clinicalAi.lastGeneratedIn')} {generationTime}s</span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Loading State */}
      {isLoadingSummaries && selectedPatientId && (
        <InlineLoading rows={6} />
      )}

      {/* Summary Display */}
      {selectedPatientId && latestSummary && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Structured Data */}
          <div className="space-y-4">
            {/* Patient Info */}
            <SectionCard>
              <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  {t('clinicalAi.patientInfo')}
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t('clinicalAi.name')}</span>
                  <span className="font-medium">
                    {selectedPatient?.contact.firstName} {selectedPatient?.contact.lastName}
                  </span>
                </div>
                {latestSummary.structuredData?.demographics?.age && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('clinicalAi.age')}</span>
                    <span>{latestSummary.structuredData.demographics.age} ans</span>
                  </div>
                )}
                {latestSummary.structuredData?.demographics?.primaryDiagnosis && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">{t('clinicalAi.diagnosis')}</span>
                    <span>{latestSummary.structuredData.demographics.primaryDiagnosis}</span>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Alerts */}
            {latestSummary.structuredData?.alerts && latestSummary.structuredData.alerts.length > 0 && (
              <SectionCard>
                <div className="p-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                    {t('clinicalAi.alerts')}
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  {latestSummary.structuredData.alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg text-sm ${
                        alert.severity === 'critical' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                        alert.severity === 'high' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                        'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}
                    >
                      {alert.message}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Medications */}
            {latestSummary.structuredData?.medications && latestSummary.structuredData.medications.length > 0 && (
              <SectionCard>
                <div className="p-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Pill className="h-4 w-4" />
                    {t('clinicalAi.medications')}
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  {latestSummary.structuredData.medications.map((med, idx) => (
                    <div key={idx} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-gray-600">
                        {med.dosage} - {med.frequency}
                      </p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Recent Events */}
            {latestSummary.structuredData?.recentEvents && latestSummary.structuredData.recentEvents.length > 0 && (
              <SectionCard>
                <div className="p-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {t('clinicalAi.recentEvents')}
                  </h3>
                </div>
                <div className="p-4 space-y-2">
                  {latestSummary.structuredData.recentEvents.slice(0, 5).map((event, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 border-b last:border-0">
                      <ChevronRight className="h-4 w-4 mt-0.5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{event.type}</p>
                        <p className="text-xs text-gray-500">{event.date}</p>
                        <p className="text-sm text-gray-600">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>

          {/* Right: Full Summary Content */}
          <div className="lg:col-span-2">
            <SectionCard>
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t('clinicalAi.fullSummary')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('clinicalAi.generatedAt')} {formatDate(latestSummary.generatedAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={RefreshCw}
                  onClick={() => generateMutation.mutate()}
                  disabled={isGenerating}
                >
                  {t('clinicalAi.regenerate')}
                </Button>
              </div>
              <div className="p-4">
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    {latestSummary.generatedContent}
                  </pre>
                </div>

                {/* Recommendations */}
                {latestSummary.structuredData?.recommendations && latestSummary.structuredData.recommendations.length > 0 && (
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-3">
                      {t('clinicalAi.recommendations')}
                    </h4>
                    <ul className="space-y-2">
                      {latestSummary.structuredData.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-300">
                          <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </SectionCard>

            {/* Summary History */}
            {summariesData?.summaries && summariesData.summaries.length > 1 && (
              <SectionCard className="mt-4">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">{t('clinicalAi.summaryHistory')}</h3>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {summariesData.summaries.slice(1, 5).map((summary) => (
                      <div
                        key={summary.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => navigate(`/clinical-ai/summaries/${summary.id}`)}
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {SUMMARY_TYPES.find(t => t.value === summary.summaryType)?.label || summary.summaryType}
                          </p>
                          <p className="text-xs text-gray-500">{formatDate(summary.generatedAt)}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {selectedPatientId && !isLoadingSummaries && !latestSummary && (
        <SectionCard>
          <div className="p-12 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">{t('clinicalAi.noSummaryYet')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {t('clinicalAi.generateFirstSummary')}
            </p>
            <Button
              module="dialyse"
              icon={Sparkles}
              onClick={() => generateMutation.mutate()}
              disabled={isGenerating}
            >
              {isGenerating ? t('clinicalAi.generating') : t('clinicalAi.generateNow')}
            </Button>
          </div>
        </SectionCard>
      )}

      {/* No Patient Selected */}
      {!selectedPatientId && (
        <SectionCard>
          <div className="p-12 text-center">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold mb-2">{t('clinicalAi.selectPatientFirst')}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('clinicalAi.selectPatientToViewSummary')}
            </p>
          </div>
        </SectionCard>
      )}
    </div>
  );
}
