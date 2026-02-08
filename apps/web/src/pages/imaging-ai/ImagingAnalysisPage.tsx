import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Activity,
  Heart,
  Eye,
  FileImage,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  ArrowLeft,
  Play,
  Edit,
  FileText,
  TrendingUp,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
} from 'lucide-react';

interface AnalysisData {
  id: string;
  patientId: string;
  patientName: string;
  modality: string;
  studyType: string;
  acquisitionDate: string;
  status: string;
  urgencyLevel: string;
  aiInterpretation?: string;
  aiFindings?: string[];
  aiRecommendations?: string[];
  aiConfidence?: number;
  physicianFindings?: string;
  physicianImpression?: string;
  agreesWithAi?: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  signedBy?: string;
  signedAt?: string;
}

interface EcgFindings {
  rhythm: string;
  heartRate: number;
  prInterval: number;
  qrsDuration: number;
  qtcInterval: number;
  qrsAxis: number;
  stChanges: boolean;
  stSegment?: string;
  arrhythmias?: string[];
  ischemiaDetected?: boolean;
}

interface OctFindings {
  eye: string;
  centralThickness: number;
  avgRnfl: number;
  drusenPresent: boolean;
  fluidPresent: boolean;
  amdStage?: string;
  drSeverity?: string;
}

interface EchoFindings {
  lvef: number;
  lvefCategory: string;
  lvedd?: number;
  lvesd?: number;
  diastolicGrade: string;
  aorticStenosis: string;
  mitralRegurgitation: string;
  pericardialEffusion: string;
}

export default function ImagingAnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [modalityFindings, setModalityFindings] = useState<EcgFindings | OctFindings | EchoFindings | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    findings: '',
    impression: '',
    recommendations: '',
    agreesWithAi: true,
  });

  useEffect(() => {
    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      // Simulated data - replace with actual API call
      const mockAnalysis: AnalysisData = {
        id: id || '1',
        patientId: 'patient-001',
        patientName: 'Jean Dupont',
        modality: 'ecg',
        studyType: 'standard_12_lead',
        acquisitionDate: new Date().toISOString(),
        status: 'analyzed',
        urgencyLevel: 'routine',
        aiInterpretation: 'Rythme sinusal normal. Pas de signes d\'ischémie aiguë. Intervalles dans les limites normales.',
        aiFindings: [
          'Rythme sinusal régulier à 72 bpm',
          'Axe QRS normal (-30° à +90°)',
          'Intervalles PR, QRS et QTc normaux',
          'Pas de modifications du segment ST',
        ],
        aiRecommendations: [
          'ECG de contrôle si symptômes',
          'Pas d\'intervention urgente nécessaire',
        ],
        aiConfidence: 94,
      };

      const mockEcgFindings: EcgFindings = {
        rhythm: 'sinus',
        heartRate: 72,
        prInterval: 160,
        qrsDuration: 88,
        qtcInterval: 420,
        qrsAxis: 45,
        stChanges: false,
        ischemiaDetected: false,
      };

      setAnalysis(mockAnalysis);
      setModalityFindings(mockEcgFindings);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Call AI analysis API
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await fetchAnalysis();
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmitReview = async () => {
    try {
      // Submit physician review
      console.log('Submitting review:', reviewForm);
      setShowReviewForm(false);
      await fetchAnalysis();
    } catch (error) {
      console.error('Review submission failed:', error);
    }
  };

  const handleSign = async () => {
    try {
      // Sign the analysis
      console.log('Signing analysis');
      await fetchAnalysis();
    } catch (error) {
      console.error('Signing failed:', error);
    }
  };

  const getModalityIcon = (modality: string) => {
    switch (modality) {
      case 'ecg':
        return <Activity className="h-6 w-6 text-red-500" />;
      case 'echo':
        return <Heart className="h-6 w-6 text-pink-500" />;
      case 'oct':
      case 'fundus':
        return <Eye className="h-6 w-6 text-blue-500" />;
      default:
        return <FileImage className="h-6 w-6 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            En attente
          </span>
        );
      case 'processing':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Analyse en cours
          </span>
        );
      case 'analyzed':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
            Analysé - À réviser
          </span>
        );
      case 'reviewed':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
            Révisé
          </span>
        );
      case 'signed':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Signé
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Échec
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
            {status}
          </span>
        );
    }
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'stat':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 border border-red-200 rounded-full">
            STAT
          </span>
        );
      case 'urgent':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200 rounded-full">
            URGENT
          </span>
        );
      case 'priority':
        return (
          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full">
            PRIORITÉ
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 border border-green-200 rounded-full">
            ROUTINE
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Analyse non trouvée</p>
          <Link to="/imaging-ai" className="text-blue-600 hover:underline mt-2 inline-block">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            {getModalityIcon(analysis.modality)}
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Analyse {analysis.modality.toUpperCase()}
              </h1>
              <p className="text-sm text-gray-500">
                {analysis.studyType} - {new Date(analysis.acquisitionDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(analysis.status)}
          {getUrgencyBadge(analysis.urgencyLevel)}
        </div>
      </div>

      {/* Patient Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
            <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {analysis.patientName}
            </p>
            <p className="text-sm text-gray-500">ID: {analysis.patientId}</p>
          </div>
          <Link
            to={`/patients/${analysis.patientId}`}
            className="ml-auto text-sm text-blue-600 hover:underline"
          >
            Voir le dossier patient
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Interpretation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Interprétation IA
            </h2>
            {analysis.aiConfidence && (
              <span className="text-sm text-gray-500">
                Confiance: {analysis.aiConfidence}%
              </span>
            )}
          </div>

          {analysis.status === 'pending' ? (
            <div className="text-center py-8">
              <FileImage className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">L'analyse IA n'a pas encore été lancée</p>
              <button
                onClick={handleStartAnalysis}
                disabled={analyzing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mx-auto"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Lancer l'analyse IA
                  </>
                )}
              </button>
            </div>
          ) : (
            <>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {analysis.aiInterpretation}
              </p>

              {analysis.aiFindings && analysis.aiFindings.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Conclusions
                  </h3>
                  <ul className="space-y-1">
                    {analysis.aiFindings.map((finding, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.aiRecommendations && analysis.aiRecommendations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Recommandations
                  </h3>
                  <ul className="space-y-1">
                    {analysis.aiRecommendations.map((rec, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400"
                      >
                        <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modality-specific findings */}
        {modalityFindings && analysis.modality === 'ecg' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500" />
              Mesures ECG
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Rythme</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {(modalityFindings as EcgFindings).rhythm}
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">FC</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(modalityFindings as EcgFindings).heartRate} bpm
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">PR</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(modalityFindings as EcgFindings).prInterval} ms
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">QRS</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(modalityFindings as EcgFindings).qrsDuration} ms
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">QTc</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(modalityFindings as EcgFindings).qtcInterval} ms
                </p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Axe QRS</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {(modalityFindings as EcgFindings).qrsAxis}°
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  (modalityFindings as EcgFindings).stChanges
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {(modalityFindings as EcgFindings).stChanges ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {(modalityFindings as EcgFindings).stChanges
                    ? 'Modifications ST'
                    : 'Pas de modifications ST'}
                </span>
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  (modalityFindings as EcgFindings).ischemiaDetected
                    ? 'bg-red-100 text-red-800'
                    : 'bg-green-100 text-green-800'
                }`}
              >
                {(modalityFindings as EcgFindings).ischemiaDetected ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {(modalityFindings as EcgFindings).ischemiaDetected
                    ? 'Ischémie détectée'
                    : 'Pas d\'ischémie'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Physician Review Section */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Edit className="h-5 w-5 text-green-500" />
              Révision Médicale
            </h2>
            {analysis.status === 'analyzed' && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Edit className="h-4 w-4" />
                Réviser
              </button>
            )}
          </div>

          {showReviewForm ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Conclusions
                </label>
                <textarea
                  value={reviewForm.findings}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, findings: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  placeholder="Vos conclusions cliniques..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Impression
                </label>
                <textarea
                  value={reviewForm.impression}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, impression: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  rows={2}
                  placeholder="Impression diagnostique..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recommandations
                </label>
                <textarea
                  value={reviewForm.recommendations}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, recommendations: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  rows={2}
                  placeholder="Vos recommandations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Accord avec l'interprétation IA
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setReviewForm({ ...reviewForm, agreesWithAi: true })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      reviewForm.agreesWithAi
                        ? 'bg-green-100 border-green-300 text-green-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    D'accord
                  </button>
                  <button
                    onClick={() => setReviewForm({ ...reviewForm, agreesWithAi: false })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                      !reviewForm.agreesWithAi
                        ? 'bg-red-100 border-red-300 text-red-800'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Pas d'accord
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitReview}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4" />
                  Soumettre la révision
                </button>
                <button
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : analysis.physicianFindings ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Conclusions</h3>
                <p className="text-gray-700 dark:text-gray-300">{analysis.physicianFindings}</p>
              </div>
              {analysis.physicianImpression && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Impression</h3>
                  <p className="text-gray-700 dark:text-gray-300">{analysis.physicianImpression}</p>
                </div>
              )}
              {analysis.agreesWithAi !== undefined && (
                <div className="flex items-center gap-2">
                  {analysis.agreesWithAi ? (
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <ThumbsUp className="h-4 w-4" />
                      En accord avec l'IA
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sm text-red-600">
                      <ThumbsDown className="h-4 w-4" />
                      En désaccord avec l'IA
                    </span>
                  )}
                </div>
              )}
              {analysis.reviewedBy && (
                <p className="text-sm text-gray-500">
                  Révisé par {analysis.reviewedBy} le{' '}
                  {new Date(analysis.reviewedAt!).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Aucune révision médicale soumise
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {analysis.status === 'reviewed' && !analysis.signedAt && (
          <button
            onClick={handleSign}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FileText className="h-4 w-4" />
            Signer le rapport
          </button>
        )}
        <Link
          to={`/imaging-ai/analysis/${id}/report`}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <FileText className="h-4 w-4" />
          Voir le rapport
        </Link>
      </div>
    </div>
  );
}
