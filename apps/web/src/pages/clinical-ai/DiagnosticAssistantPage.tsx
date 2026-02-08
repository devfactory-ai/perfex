/**
 * Diagnostic Assistant Page
 * AI-powered diagnostic suggestions and differential diagnosis support
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { api, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  PageHeader,
  Button,
  SectionCard,
  InlineLoading,
  FormSelect,
  FormField
} from '@/components/healthcare';
import {
  Stethoscope,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Loader2,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Brain,
  Activity
} from 'lucide-react';

interface Patient {
  id: string;
  patientNumber: string;
  contact: {
    firstName: string;
    lastName: string;
  };
}

interface DiagnosticSuggestion {
  id: string;
  patientId: string;
  chiefComplaint: string;
  symptoms: string[];
  suggestedDiagnoses: Array<{
    diagnosis: string;
    icdCode?: string;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string;
  }>;
  differentialDiagnoses: string[];
  recommendedTests: string[];
  redFlags: string[];
  clinicianResponse: 'accepted' | 'modified' | 'rejected' | null;
  clinicianNotes: string | null;
  aiModel: string;
  createdAt: string;
}

interface GenerateDiagnosticResponse {
  suggestion: DiagnosticSuggestion;
  generationTime: number;
}

const COMMON_SYMPTOMS = [
  { value: 'fatigue', label: 'Fatigue' },
  { value: 'fever', label: 'Fièvre' },
  { value: 'headache', label: 'Céphalées' },
  { value: 'nausea', label: 'Nausées' },
  { value: 'chest_pain', label: 'Douleur thoracique' },
  { value: 'shortness_of_breath', label: 'Dyspnée' },
  { value: 'abdominal_pain', label: 'Douleur abdominale' },
  { value: 'dizziness', label: 'Vertiges' },
  { value: 'edema', label: 'Œdème' },
  { value: 'weight_loss', label: 'Perte de poids' },
  { value: 'weight_gain', label: 'Prise de poids' },
  { value: 'muscle_weakness', label: 'Faiblesse musculaire' },
  { value: 'joint_pain', label: 'Douleur articulaire' },
  { value: 'skin_rash', label: 'Éruption cutanée' },
  { value: 'vision_changes', label: 'Troubles visuels' },
];

export function DiagnosticAssistantPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState(searchParams.get('patientId') || '');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [vitalSigns, setVitalSigns] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    oxygenSaturation: '',
  });
  const [medicalHistory, setMedicalHistory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<DiagnosticSuggestion | null>(null);
  const [generationTime, setGenerationTime] = useState<number | null>(null);

  // Fetch patients
  const { data: patients } = useQuery({
    queryKey: ['healthcare-patients-list'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ patients: Patient[] }>>('/dialyse/patients?limit=100');
      return response.data.data?.patients || [];
    },
  });

  // Generate diagnostic mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const allSymptoms = [...selectedSymptoms];
      if (customSymptom.trim()) {
        allSymptoms.push(customSymptom.trim());
      }

      const response = await api.post<ApiResponse<GenerateDiagnosticResponse>>('/clinical-ai/diagnostics/suggest', {
        patientId: selectedPatientId,
        chiefComplaint,
        symptoms: allSymptoms,
        vitalSigns: Object.values(vitalSigns).some(v => v) ? vitalSigns : undefined,
        medicalHistory: medicalHistory || undefined,
        language: 'fr',
      });
      return response.data.data;
    },
    onSuccess: (data) => {
      setCurrentSuggestion(data?.suggestion || null);
      setGenerationTime(data?.generationTime || null);
      setIsGenerating(false);
    },
    onError: () => {
      setIsGenerating(false);
    },
  });

  // Respond to suggestion mutation
  const respondMutation = useMutation({
    mutationFn: async ({ response, notes }: { response: 'accepted' | 'modified' | 'rejected'; notes?: string }) => {
      if (!currentSuggestion) return;
      await api.post(`/clinical-ai/diagnostics/${currentSuggestion.id}/respond`, {
        response,
        notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostic-suggestions'] });
    },
  });

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const addCustomSymptom = () => {
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/30';
      case 'low': return 'text-gray-600 bg-gray-100 dark:bg-gray-800';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const selectedPatient = patients?.find(p => p.id === selectedPatientId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('clinicalAi.diagnosticAssistant')}
        subtitle={t('clinicalAi.diagnosticAssistantSubtitle')}
        icon={Stethoscope}
        module="dialyse"
      />

      {/* AI Disclaimer */}
      <SectionCard>
        <div className="p-4 flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-300">
              {t('clinicalAi.aiDisclaimer')}
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
              {t('clinicalAi.aiDisclaimerText')}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Input Form */}
        <div className="space-y-4">
          {/* Patient Selection */}
          <SectionCard>
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t('clinicalAi.patientInfo')}
              </h3>
            </div>
            <div className="p-4 space-y-4">
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

              {selectedPatient && (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="font-medium">
                    {selectedPatient.contact.firstName} {selectedPatient.contact.lastName}
                  </p>
                  <p className="text-sm text-gray-500">#{selectedPatient.patientNumber}</p>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Chief Complaint */}
          <SectionCard>
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                {t('clinicalAi.chiefComplaint')}
              </h3>
            </div>
            <div className="p-4">
              <textarea
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder={t('clinicalAi.chiefComplaintPlaceholder')}
                className="w-full p-3 border rounded-lg bg-background resize-none"
                rows={3}
              />
            </div>
          </SectionCard>

          {/* Symptoms Selection */}
          <SectionCard>
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Stethoscope className="h-4 w-4" />
                {t('clinicalAi.symptoms')}
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                {COMMON_SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom.value}
                    onClick={() => handleSymptomToggle(symptom.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedSymptoms.includes(symptom.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {symptom.label}
                  </button>
                ))}
              </div>

              {/* Custom symptom */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  placeholder={t('clinicalAi.addCustomSymptom')}
                  className="flex-1 p-2 border rounded-lg bg-background"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomSymptom()}
                />
                <Button variant="outline" onClick={addCustomSymptom}>
                  {t('clinicalAi.add')}
                </Button>
              </div>

              {/* Selected custom symptoms */}
              {selectedSymptoms.filter(s => !COMMON_SYMPTOMS.find(cs => cs.value === s)).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSymptoms
                    .filter(s => !COMMON_SYMPTOMS.find(cs => cs.value === s))
                    .map((symptom) => (
                      <span
                        key={symptom}
                        className="px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1"
                      >
                        {symptom}
                        <button
                          onClick={() => handleSymptomToggle(symptom)}
                          className="ml-1 hover:text-blue-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>
          </SectionCard>

          {/* Vital Signs (Optional) */}
          <SectionCard>
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4" />
                {t('clinicalAi.vitalSigns')} <span className="text-gray-400 text-xs">({t('clinicalAi.optional')})</span>
              </h3>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <FormField
                label={t('clinicalAi.bloodPressure')}
                value={vitalSigns.bloodPressure}
                onChange={(e) => setVitalSigns({ ...vitalSigns, bloodPressure: e.target.value })}
                placeholder="120/80"
              />
              <FormField
                label={t('clinicalAi.heartRate')}
                value={vitalSigns.heartRate}
                onChange={(e) => setVitalSigns({ ...vitalSigns, heartRate: e.target.value })}
                placeholder="72"
              />
              <FormField
                label={t('clinicalAi.temperature')}
                value={vitalSigns.temperature}
                onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })}
                placeholder="37.0"
              />
              <FormField
                label={t('clinicalAi.oxygenSaturation')}
                value={vitalSigns.oxygenSaturation}
                onChange={(e) => setVitalSigns({ ...vitalSigns, oxygenSaturation: e.target.value })}
                placeholder="98%"
              />
            </div>
          </SectionCard>

          {/* Medical History (Optional) */}
          <SectionCard>
            <div className="p-4 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {t('clinicalAi.medicalHistory')} <span className="text-gray-400 text-xs">({t('clinicalAi.optional')})</span>
              </h3>
            </div>
            <div className="p-4">
              <textarea
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder={t('clinicalAi.medicalHistoryPlaceholder')}
                className="w-full p-3 border rounded-lg bg-background resize-none"
                rows={3}
              />
            </div>
          </SectionCard>

          {/* Generate Button */}
          <Button
            module="dialyse"
            icon={isGenerating ? Loader2 : Brain}
            onClick={() => generateMutation.mutate()}
            disabled={!selectedPatientId || !chiefComplaint || selectedSymptoms.length === 0 || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? t('clinicalAi.analyzing') : t('clinicalAi.generateDiagnosis')}
          </Button>
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {currentSuggestion ? (
            <>
              {/* Generation Time */}
              {generationTime && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{t('clinicalAi.analysisCompleted')} {generationTime}s</span>
                </div>
              )}

              {/* Red Flags */}
              {currentSuggestion.redFlags && currentSuggestion.redFlags.length > 0 && (
                <SectionCard>
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500">
                    <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5" />
                      {t('clinicalAi.redFlags')}
                    </h3>
                    <ul className="space-y-2">
                      {currentSuggestion.redFlags.map((flag, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </SectionCard>
              )}

              {/* Suggested Diagnoses */}
              <SectionCard>
                <div className="p-4 border-b">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {t('clinicalAi.suggestedDiagnoses')}
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {currentSuggestion.suggestedDiagnoses.map((diag, idx) => (
                    <div key={idx} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{diag.diagnosis}</p>
                          {diag.icdCode && (
                            <p className="text-xs text-gray-500">ICD: {diag.icdCode}</p>
                          )}
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(diag.confidence)}`}>
                          {t(`clinicalAi.confidence.${diag.confidence}`)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{diag.reasoning}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Differential Diagnoses */}
              {currentSuggestion.differentialDiagnoses && currentSuggestion.differentialDiagnoses.length > 0 && (
                <SectionCard>
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">{t('clinicalAi.differentialDiagnoses')}</h3>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2">
                      {currentSuggestion.differentialDiagnoses.map((diag, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                          <span>{diag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </SectionCard>
              )}

              {/* Recommended Tests */}
              {currentSuggestion.recommendedTests && currentSuggestion.recommendedTests.length > 0 && (
                <SectionCard>
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">{t('clinicalAi.recommendedTests')}</h3>
                  </div>
                  <div className="p-4">
                    <ul className="space-y-2">
                      {currentSuggestion.recommendedTests.map((test, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{test}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </SectionCard>
              )}

              {/* Clinician Response */}
              {!currentSuggestion.clinicianResponse && (
                <SectionCard>
                  <div className="p-4 border-b">
                    <h3 className="font-semibold">{t('clinicalAi.yourResponse')}</h3>
                  </div>
                  <div className="p-4">
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        icon={ThumbsUp}
                        onClick={() => respondMutation.mutate({ response: 'accepted' })}
                        className="flex-1"
                      >
                        {t('clinicalAi.accept')}
                      </Button>
                      <Button
                        variant="outline"
                        icon={FileText}
                        onClick={() => respondMutation.mutate({ response: 'modified' })}
                        className="flex-1"
                      >
                        {t('clinicalAi.modify')}
                      </Button>
                      <Button
                        variant="outline"
                        icon={ThumbsDown}
                        onClick={() => respondMutation.mutate({ response: 'rejected' })}
                        className="flex-1"
                      >
                        {t('clinicalAi.reject')}
                      </Button>
                    </div>
                  </div>
                </SectionCard>
              )}
            </>
          ) : (
            <SectionCard>
              <div className="p-12 text-center">
                <Brain className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <h3 className="text-lg font-semibold mb-2">{t('clinicalAi.readyToAnalyze')}</h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                  {t('clinicalAi.fillFormToAnalyze')}
                </p>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
