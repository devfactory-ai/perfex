// @ts-nocheck
/**
 * Patient Portal Symptom Tracker Page
 * Allow patients to track and log their symptoms over time
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';
import {
  Activity,
  ChevronLeft,
  Plus,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  AlertTriangle,
  CheckCircle,
  ThermometerSun,
  Heart,
  Scale,
  Droplets,
  Wind,
  Frown,
  Smile,
  Meh
} from 'lucide-react';

interface SymptomEntry {
  id: string;
  date: string;
  time: string;
  symptoms: Array<{
    name: string;
    severity: number;
    notes: string | null;
  }>;
  vitalSigns: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    oxygenSaturation?: number;
  };
  mood: 'poor' | 'fair' | 'good' | 'excellent' | null;
  notes: string | null;
  flaggedForReview: boolean;
}

interface SymptomStats {
  averageSeverity: number;
  trend: 'improving' | 'stable' | 'worsening';
  mostCommon: string[];
  daysTracked: number;
}

interface SymptomResponse {
  entries: SymptomEntry[];
  stats: SymptomStats;
}

const COMMON_SYMPTOMS = [
  { id: 'fatigue', label: 'Fatigue', icon: Frown },
  { id: 'pain', label: 'Douleur', icon: AlertTriangle },
  { id: 'nausea', label: 'Nausées', icon: Droplets },
  { id: 'headache', label: 'Maux de tête', icon: Frown },
  { id: 'dizziness', label: 'Vertiges', icon: Wind },
  { id: 'shortness_of_breath', label: 'Essoufflement', icon: Wind },
  { id: 'swelling', label: 'Gonflement', icon: Droplets },
  { id: 'other', label: 'Autre', icon: Plus },
];

const MOOD_OPTIONS = [
  { value: 'poor', label: 'Mauvais', icon: Frown, color: 'text-red-500' },
  { value: 'fair', label: 'Moyen', icon: Meh, color: 'text-amber-500' },
  { value: 'good', label: 'Bien', icon: Smile, color: 'text-green-500' },
  { value: 'excellent', label: 'Excellent', icon: Smile, color: 'text-blue-500' },
];

export function PortalSymptomTrackerPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Array<{ name: string; severity: number; notes: string }>>([]);
  const [vitalSigns, setVitalSigns] = useState({
    bloodPressure: '',
    heartRate: '',
    temperature: '',
    weight: '',
    oxygenSaturation: '',
  });
  const [mood, setMood] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['portal-symptoms'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<SymptomResponse>>(
        '/patient-portal/symptoms',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('portalToken')}`,
          },
        }
      );
      return response.data.data;
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(
        '/patient-portal/symptoms',
        {
          symptoms: selectedSymptoms,
          vitalSigns: Object.entries(vitalSigns)
            .filter(([, v]) => v)
            .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
          mood,
          notes: notes || null,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('portalToken')}`,
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-symptoms'] });
      setShowForm(false);
      setSelectedSymptoms([]);
      setVitalSigns({
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        weight: '',
        oxygenSaturation: '',
      });
      setMood(null);
      setNotes('');
    },
  });

  const handleSymptomToggle = (symptomId: string, symptomLabel: string) => {
    const exists = selectedSymptoms.find((s) => s.name === symptomId);
    if (exists) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s.name !== symptomId));
    } else {
      setSelectedSymptoms([...selectedSymptoms, { name: symptomLabel, severity: 5, notes: '' }]);
    }
  };

  const handleSeverityChange = (symptomName: string, severity: number) => {
    setSelectedSymptoms(
      selectedSymptoms.map((s) =>
        s.name === symptomName ? { ...s, severity } : s
      )
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingDown className="h-5 w-5 text-green-500" />;
      case 'worsening':
        return <TrendingUp className="h-5 w-5 text-red-500" />;
      default:
        return <Minus className="h-5 w-5 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return 'bg-green-500';
    if (severity <= 6) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/portal" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ChevronLeft className="h-5 w-5" />
              </a>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Suivi des symptômes</h1>
                <p className="text-sm text-gray-500">Enregistrez votre état de santé quotidien</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Ajouter</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {data?.stats && (
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Tendance</span>
                {getTrendIcon(data.stats.trend)}
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                {data.stats.trend === 'improving' && 'En amélioration'}
                {data.stats.trend === 'stable' && 'Stable'}
                {data.stats.trend === 'worsening' && 'En dégradation'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Sévérité moyenne</span>
                <Activity className="h-5 w-5 text-blue-500" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {data.stats.averageSeverity.toFixed(1)} / 10
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Jours suivis</span>
                <Calendar className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {data.stats.daysTracked}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Plus fréquent</span>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {data.stats.mostCommon[0] || '-'}
              </p>
            </div>
          </div>
        )}

        {/* Entries List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : data?.entries && data.entries.length > 0 ? (
          <div className="space-y-4">
            {data.entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span className="font-medium">{formatDate(entry.date)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>{entry.time}</span>
                      </div>
                    </div>
                    {entry.flaggedForReview && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        À revoir
                      </span>
                    )}
                  </div>

                  {/* Symptoms */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Symptômes</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.symptoms.map((symptom, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg"
                        >
                          <span className="text-sm">{symptom.name}</span>
                          <div className="flex items-center gap-1">
                            <div
                              className={`w-2 h-2 rounded-full ${getSeverityColor(symptom.severity)}`}
                            />
                            <span className="text-xs text-gray-500">{symptom.severity}/10</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Vital Signs */}
                  {Object.keys(entry.vitalSigns).length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Signes vitaux</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        {entry.vitalSigns.bloodPressure && (
                          <div className="flex items-center gap-2 text-sm">
                            <Heart className="h-4 w-4 text-red-500" />
                            <span>{entry.vitalSigns.bloodPressure}</span>
                          </div>
                        )}
                        {entry.vitalSigns.heartRate && (
                          <div className="flex items-center gap-2 text-sm">
                            <Activity className="h-4 w-4 text-pink-500" />
                            <span>{entry.vitalSigns.heartRate} bpm</span>
                          </div>
                        )}
                        {entry.vitalSigns.temperature && (
                          <div className="flex items-center gap-2 text-sm">
                            <ThermometerSun className="h-4 w-4 text-amber-500" />
                            <span>{entry.vitalSigns.temperature}°C</span>
                          </div>
                        )}
                        {entry.vitalSigns.weight && (
                          <div className="flex items-center gap-2 text-sm">
                            <Scale className="h-4 w-4 text-blue-500" />
                            <span>{entry.vitalSigns.weight} kg</span>
                          </div>
                        )}
                        {entry.vitalSigns.oxygenSaturation && (
                          <div className="flex items-center gap-2 text-sm">
                            <Wind className="h-4 w-4 text-cyan-500" />
                            <span>{entry.vitalSigns.oxygenSaturation}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Mood */}
                  {entry.mood && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">Humeur:</span>
                      {MOOD_OPTIONS.find((m) => m.value === entry.mood)?.label}
                    </div>
                  )}

                  {/* Notes */}
                  {entry.notes && (
                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      {entry.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun enregistrement
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Commencez à suivre vos symptômes pour aider votre équipe médicale
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Premier enregistrement
            </button>
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Nouvel enregistrement
              </h2>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitMutation.mutate();
              }}
              className="p-6 space-y-6"
            >
              {/* Symptoms Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Symptômes ressentis
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {COMMON_SYMPTOMS.map((symptom) => {
                    const Icon = symptom.icon;
                    const isSelected = selectedSymptoms.find((s) => s.name === symptom.label);
                    return (
                      <button
                        key={symptom.id}
                        type="button"
                        onClick={() => handleSymptomToggle(symptom.id, symptom.label)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isSelected ? 'text-blue-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                          {symptom.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Severity Sliders */}
              {selectedSymptoms.length > 0 && (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sévérité des symptômes
                  </label>
                  {selectedSymptoms.map((symptom) => (
                    <div key={symptom.name} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{symptom.name}</span>
                        <span className={`text-sm font-medium ${
                          symptom.severity <= 3 ? 'text-green-600' :
                          symptom.severity <= 6 ? 'text-amber-600' : 'text-red-600'
                        }`}>
                          {symptom.severity}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={symptom.severity}
                        onChange={(e) => handleSeverityChange(symptom.name, parseInt(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Léger</span>
                        <span>Modéré</span>
                        <span>Sévère</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Vital Signs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Signes vitaux (optionnel)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <Heart className="h-3 w-3" /> Tension
                    </label>
                    <input
                      type="text"
                      value={vitalSigns.bloodPressure}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, bloodPressure: e.target.value })}
                      placeholder="120/80"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <Activity className="h-3 w-3" /> Pouls
                    </label>
                    <input
                      type="number"
                      value={vitalSigns.heartRate}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, heartRate: e.target.value })}
                      placeholder="72"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <ThermometerSun className="h-3 w-3" /> Température
                    </label>
                    <input
                      type="text"
                      value={vitalSigns.temperature}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, temperature: e.target.value })}
                      placeholder="37.0"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <Scale className="h-3 w-3" /> Poids (kg)
                    </label>
                    <input
                      type="text"
                      value={vitalSigns.weight}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, weight: e.target.value })}
                      placeholder="70"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
                      <Wind className="h-3 w-3" /> SpO2 (%)
                    </label>
                    <input
                      type="text"
                      value={vitalSigns.oxygenSaturation}
                      onChange={(e) => setVitalSigns({ ...vitalSigns, oxygenSaturation: e.target.value })}
                      placeholder="98"
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Mood */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Comment vous sentez-vous aujourd'hui ?
                </label>
                <div className="flex gap-3">
                  {MOOD_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setMood(option.value)}
                        className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                          mood === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${option.color}`} />
                        <span className="text-xs">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes additionnelles
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ajoutez des détails sur votre état de santé..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={selectedSymptoms.length === 0 || submitMutation.isPending}
                  className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitMutation.isPending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
