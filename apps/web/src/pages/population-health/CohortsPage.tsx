// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';

interface Cohort {
  id: string;
  cohortCode: string;
  cohortName: string;
  description?: string;
  cohortType: string;
  associatedModule?: string;
  patientCount: number;
  autoRefresh: boolean;
  refreshFrequency?: string;
  lastRefresh?: string;
  avgRiskScore?: number;
  createdAt: string;
  createdBy?: string;
  isActive: boolean;
}

export default function CohortsPage() {
  const { t } = useTranslation();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  useEffect(() => {
    fetchCohorts();
  }, [selectedType, selectedModule]);

  const fetchCohorts = async () => {
    setLoading(true);
    try {
      // Simulated data - replace with actual API call
      const mockCohorts: Cohort[] = [
        {
          id: '1',
          cohortCode: 'DIA-HR-01',
          cohortName: 'Dialysés à haut risque CV',
          description: 'Patients en dialyse avec risque cardiovasculaire élevé',
          cohortType: 'risk_based',
          associatedModule: 'dialyse',
          patientCount: 156,
          autoRefresh: true,
          refreshFrequency: 'daily',
          lastRefresh: new Date(Date.now() - 3600000).toISOString(),
          avgRiskScore: 72,
          createdAt: '2024-01-15T10:00:00Z',
          isActive: true,
        },
        {
          id: '2',
          cohortCode: 'CAR-IC-01',
          cohortName: 'Insuffisance cardiaque NYHA III-IV',
          description: 'Patients avec IC avancée nécessitant suivi rapproché',
          cohortType: 'disease_based',
          associatedModule: 'cardiology',
          patientCount: 89,
          autoRefresh: true,
          refreshFrequency: 'daily',
          lastRefresh: new Date(Date.now() - 7200000).toISOString(),
          avgRiskScore: 68,
          createdAt: '2024-02-01T10:00:00Z',
          isActive: true,
        },
        {
          id: '3',
          cohortCode: 'OPH-DMLA-01',
          cohortName: 'DMLA exsudative active',
          description: 'Patients avec DMLA néovasculaire en traitement',
          cohortType: 'treatment_based',
          associatedModule: 'ophthalmology',
          patientCount: 234,
          autoRefresh: true,
          refreshFrequency: 'weekly',
          lastRefresh: new Date(Date.now() - 86400000).toISOString(),
          avgRiskScore: 45,
          createdAt: '2024-01-20T10:00:00Z',
          isActive: true,
        },
        {
          id: '4',
          cohortCode: 'DIA-GAP-01',
          cohortName: 'Retard vaccin hépatite B',
          description: 'Patients dialysés avec vaccination hépatite B incomplète',
          cohortType: 'care_gap',
          associatedModule: 'dialyse',
          patientCount: 42,
          autoRefresh: true,
          refreshFrequency: 'weekly',
          lastRefresh: new Date(Date.now() - 172800000).toISOString(),
          createdAt: '2024-03-01T10:00:00Z',
          isActive: true,
        },
        {
          id: '5',
          cohortCode: 'CAR-AGE-01',
          cohortName: 'Patients > 80 ans multi-médicamentés',
          description: 'Patients âgés avec polypharmacie à risque iatrogène',
          cohortType: 'demographic',
          associatedModule: 'cardiology',
          patientCount: 67,
          autoRefresh: true,
          refreshFrequency: 'daily',
          lastRefresh: new Date(Date.now() - 3600000 * 5).toISOString(),
          avgRiskScore: 58,
          createdAt: '2024-02-15T10:00:00Z',
          isActive: true,
        },
      ];

      setCohorts(mockCohorts);
    } catch (error) {
      console.error('Failed to fetch cohorts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshCohort = async (cohortId: string) => {
    // Refresh cohort membership
    console.log('Refreshing cohort:', cohortId);
  };

  const getCohortTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      disease_based: 'Par maladie',
      risk_based: 'Par risque',
      demographic: 'Démographique',
      treatment_based: 'Par traitement',
      outcome_based: 'Par résultat',
      geographic: 'Géographique',
      care_gap: 'Écart de soins',
      custom: 'Personnalisé',
    };
    return labels[type] || type;
  };

  const getCohortTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      disease_based: 'bg-red-100 text-red-800',
      risk_based: 'bg-orange-100 text-orange-800',
      demographic: 'bg-blue-100 text-blue-800',
      treatment_based: 'bg-green-100 text-green-800',
      outcome_based: 'bg-purple-100 text-purple-800',
      care_gap: 'bg-yellow-100 text-yellow-800',
      custom: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getModuleLabel = (module?: string) => {
    const labels: { [key: string]: string } = {
      dialyse: 'Dialyse',
      cardiology: 'Cardiologie',
      ophthalmology: 'Ophtalmologie',
      all: 'Tous',
    };
    return module ? labels[module] || module : 'Non spécifié';
  };

  const filteredCohorts = cohorts.filter((cohort) => {
    const matchesSearch =
      searchTerm === '' ||
      cohort.cohortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cohort.cohortCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedType === 'all' || cohort.cohortType === selectedType;
    const matchesModule =
      selectedModule === 'all' || cohort.associatedModule === selectedModule;
    return matchesSearch && matchesType && matchesModule;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Cohortes de Population
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Gestion des groupes de patients pour le suivi et l'analyse
          </p>
        </div>
        <Link
          to="/population-health/cohorts/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nouvelle cohorte
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {cohorts.length}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Cohortes actives
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {cohorts.reduce((sum, c) => sum + c.patientCount, 0)}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Patients inclus
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <RefreshCw className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {cohorts.filter((c) => c.autoRefresh).length}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Actualisation auto
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Activity className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(
                cohorts.reduce((sum, c) => sum + (c.avgRiskScore || 0), 0) /
                  cohorts.filter((c) => c.avgRiskScore).length || 0
              )}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Score risque moyen
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une cohorte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="all">Tous les types</option>
          <option value="disease_based">Par maladie</option>
          <option value="risk_based">Par risque</option>
          <option value="demographic">Démographique</option>
          <option value="treatment_based">Par traitement</option>
          <option value="care_gap">Écart de soins</option>
        </select>

        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="all">Tous les modules</option>
          <option value="dialyse">Dialyse</option>
          <option value="cardiology">Cardiologie</option>
          <option value="ophthalmology">Ophtalmologie</option>
        </select>
      </div>

      {/* Cohorts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCohorts.map((cohort) => (
          <Link
            key={cohort.id}
            to={`/population-health/cohorts/${cohort.id}`}
            className="bg-white dark:bg-gray-800 rounded-lg border p-6 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-mono text-gray-500">
                  {cohort.cohortCode}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {cohort.cohortName}
                </h3>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getCohortTypeColor(
                  cohort.cohortType
                )}`}
              >
                {getCohortTypeLabel(cohort.cohortType)}
              </span>
            </div>

            {cohort.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                {cohort.description}
              </p>
            )}

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {cohort.patientCount}
                </span>
                <span className="text-sm text-gray-500">patients</span>
              </div>
              {cohort.avgRiskScore !== undefined && (
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Risque: {cohort.avgRiskScore}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {cohort.lastRefresh
                  ? `Maj il y a ${Math.round(
                      (Date.now() - new Date(cohort.lastRefresh).getTime()) /
                        3600000
                    )}h`
                  : 'Jamais actualisé'}
              </span>
              <span className="flex items-center gap-1">
                {cohort.autoRefresh ? (
                  <>
                    <RefreshCw className="h-3 w-3 text-green-500" />
                    Auto ({cohort.refreshFrequency})
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3 text-gray-400" />
                    Manuel
                  </>
                )}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {filteredCohorts.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Aucune cohorte trouvée</p>
          <Link
            to="/population-health/cohorts/new"
            className="text-blue-600 hover:underline mt-2 inline-block"
          >
            Créer une nouvelle cohorte
          </Link>
        </div>
      )}
    </div>
  );
}
