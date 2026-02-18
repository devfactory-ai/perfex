// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Award,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  Plus,
  FileText,
  Download,
  Calendar,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface QualityIndicator {
  id: string;
  indicatorCode: string;
  indicatorName: string;
  shortName?: string;
  description?: string;
  indicatorType: string;
  source: string;
  category?: string;
  associatedModule?: string;
  measureType: string;
  targetValue?: number;
  targetOperator?: string;
  benchmarkValue?: number;
  measurementPeriod?: string;
  isMandatory: boolean;
  latestValue?: number;
  meetsTarget?: boolean;
  trend?: string;
}

interface CategoryGroup {
  category: string;
  indicators: QualityIndicator[];
  meetingTarget: number;
  total: number;
}

export default function QualityIndicatorsPage() {
  const { t } = useTranslation();
  const [indicators, setIndicators] = useState<QualityIndicator[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');

  useEffect(() => {
    fetchIndicators();
  }, [selectedSource, selectedModule]);

  const fetchIndicators = async () => {
    setLoading(true);
    try {
      // Simulated data - replace with actual API call
      const mockIndicators: QualityIndicator[] = [
        // Dialyse indicators
        {
          id: '1',
          indicatorCode: 'DIA-01',
          indicatorName: 'Taux d\'hémoglobine > 10 g/dL',
          shortName: 'Hb > 10',
          description: 'Pourcentage de patients avec hémoglobine supérieure à 10 g/dL',
          indicatorType: 'outcome',
          source: 'iqss',
          category: 'Anémie',
          associatedModule: 'dialyse',
          measureType: 'proportion',
          targetValue: 85,
          targetOperator: '>=',
          benchmarkValue: 80,
          measurementPeriod: 'quarterly',
          isMandatory: true,
          latestValue: 87.5,
          meetsTarget: true,
          trend: 'improving',
        },
        {
          id: '2',
          indicatorCode: 'DIA-02',
          indicatorName: 'Kt/V > 1.2',
          shortName: 'Kt/V adéquat',
          description: 'Pourcentage de patients avec Kt/V supérieur à 1.2',
          indicatorType: 'outcome',
          source: 'iqss',
          category: 'Adéquation dialyse',
          associatedModule: 'dialyse',
          measureType: 'proportion',
          targetValue: 90,
          targetOperator: '>=',
          benchmarkValue: 85,
          measurementPeriod: 'quarterly',
          isMandatory: true,
          latestValue: 92.3,
          meetsTarget: true,
          trend: 'stable',
        },
        {
          id: '3',
          indicatorCode: 'DIA-03',
          indicatorName: 'Accès vasculaire par FAV',
          shortName: 'FAV',
          description: 'Pourcentage de patients dialysés par fistule artério-veineuse',
          indicatorType: 'structure',
          source: 'iqss',
          category: 'Accès vasculaire',
          associatedModule: 'dialyse',
          measureType: 'proportion',
          targetValue: 70,
          targetOperator: '>=',
          benchmarkValue: 65,
          measurementPeriod: 'quarterly',
          isMandatory: true,
          latestValue: 72.1,
          meetsTarget: true,
          trend: 'improving',
        },
        // Cardiology indicators
        {
          id: '4',
          indicatorCode: 'CAR-01',
          indicatorName: 'Contrôle tensionnel (< 140/90)',
          shortName: 'TA contrôlée',
          description: 'Pourcentage de patients avec tension artérielle contrôlée',
          indicatorType: 'outcome',
          source: 'iqss',
          category: 'Hypertension',
          associatedModule: 'cardiology',
          measureType: 'proportion',
          targetValue: 80,
          targetOperator: '>=',
          benchmarkValue: 75,
          measurementPeriod: 'quarterly',
          isMandatory: true,
          latestValue: 68.2,
          meetsTarget: false,
          trend: 'improving',
        },
        {
          id: '5',
          indicatorCode: 'CAR-02',
          indicatorName: 'Prescription bêtabloquants post-IDM',
          shortName: 'BB post-IDM',
          description: 'Prescription de bêtabloquants après infarctus du myocarde',
          indicatorType: 'process',
          source: 'iqss',
          category: 'Post-infarctus',
          associatedModule: 'cardiology',
          measureType: 'proportion',
          targetValue: 95,
          targetOperator: '>=',
          benchmarkValue: 90,
          measurementPeriod: 'quarterly',
          isMandatory: true,
          latestValue: 96.5,
          meetsTarget: true,
          trend: 'stable',
        },
        // Ophthalmology indicators
        {
          id: '6',
          indicatorCode: 'OPH-01',
          indicatorName: 'Dépistage rétinopathie diabétique',
          shortName: 'Dépistage RD',
          description: 'Taux de dépistage annuel de la rétinopathie chez les diabétiques',
          indicatorType: 'process',
          source: 'iqss',
          category: 'Dépistage',
          associatedModule: 'ophthalmology',
          measureType: 'proportion',
          targetValue: 85,
          targetOperator: '>=',
          benchmarkValue: 80,
          measurementPeriod: 'annual',
          isMandatory: true,
          latestValue: 78.5,
          meetsTarget: false,
          trend: 'declining',
        },
        {
          id: '7',
          indicatorCode: 'OPH-02',
          indicatorName: 'Délai moyen IVT < 14 jours',
          shortName: 'Délai IVT',
          description: 'Délai moyen entre indication et injection intravitréenne',
          indicatorType: 'process',
          source: 'internal',
          category: 'DMLA/Œdème',
          associatedModule: 'ophthalmology',
          measureType: 'mean',
          targetValue: 14,
          targetOperator: '<=',
          benchmarkValue: 21,
          measurementPeriod: 'monthly',
          isMandatory: false,
          latestValue: 11.2,
          meetsTarget: true,
          trend: 'improving',
        },
      ];

      setIndicators(mockIndicators);

      // Group by category
      const groups: { [key: string]: QualityIndicator[] } = {};
      mockIndicators.forEach((indicator) => {
        const category = indicator.category || 'Autre';
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(indicator);
      });

      const categoryGroupsList: CategoryGroup[] = Object.entries(groups).map(
        ([category, indicators]) => ({
          category,
          indicators,
          meetingTarget: indicators.filter((i) => i.meetsTarget).length,
          total: indicators.length,
        })
      );

      setCategoryGroups(categoryGroupsList);

      // Expand all categories by default
      setExpandedCategories(new Set(categoryGroupsList.map((g) => g.category)));
    } catch (error) {
      console.error('Failed to fetch indicators:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'worsening':
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSourceBadge = (source: string) => {
    const colors: { [key: string]: string } = {
      iqss: 'bg-blue-100 text-blue-800',
      has: 'bg-purple-100 text-purple-800',
      internal: 'bg-gray-100 text-gray-800',
      custom: 'bg-green-100 text-green-800',
    };
    return (
      <span
        className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          colors[source] || colors.custom
        }`}
      >
        {source.toUpperCase()}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const totalIndicators = indicators.length;
  const meetingTarget = indicators.filter((i) => i.meetsTarget).length;
  const mandatoryCount = indicators.filter((i) => i.isMandatory).length;
  const mandatoryMet = indicators.filter((i) => i.isMandatory && i.meetsTarget).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Indicateurs Qualité
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            IQSS et indicateurs de performance
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/population-health/iqss/new"
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
            Nouvel indicateur
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalIndicators}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Indicateurs suivis
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {meetingTarget}/{totalIndicators}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Cibles atteintes
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {mandatoryMet}/{mandatoryCount}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Obligatoires atteints
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              T4 2024
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Période en cours
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <select
          value={selectedSource}
          onChange={(e) => setSelectedSource(e.target.value)}
          className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
        >
          <option value="all">Toutes les sources</option>
          <option value="iqss">IQSS</option>
          <option value="has">HAS</option>
          <option value="internal">Interne</option>
          <option value="custom">Personnalisé</option>
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

      {/* Indicators by Category */}
      <div className="space-y-4">
        {categoryGroups.map((group) => (
          <div
            key={group.category}
            className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden"
          >
            <button
              onClick={() => toggleCategory(group.category)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center gap-3">
                {expandedCategories.has(group.category) ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {group.category}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${(group.meetingTarget / group.total) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-500">
                    {group.meetingTarget}/{group.total}
                  </span>
                </div>
              </div>
            </button>

            {expandedCategories.has(group.category) && (
              <div className="border-t">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Indicateur
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Source
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Valeur
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Cible
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Tendance
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Statut
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {group.indicators.map((indicator) => (
                      <tr
                        key={indicator.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4">
                          <Link
                            to={`/population-health/quality-indicators/${indicator.id}`}
                            className="font-mono text-sm text-blue-600 hover:underline"
                          >
                            {indicator.indicatorCode}
                          </Link>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {indicator.indicatorName}
                            </p>
                            {indicator.description && (
                              <p className="text-xs text-gray-500 mt-1">
                                {indicator.description}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getSourceBadge(indicator.source)}
                            {indicator.isMandatory && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                Obligatoire
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`text-lg font-semibold ${
                              indicator.meetsTarget
                                ? 'text-green-600'
                                : 'text-red-600'
                            }`}
                          >
                            {indicator.latestValue?.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm text-gray-500">
                            {indicator.targetOperator} {indicator.targetValue}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {getTrendIcon(indicator.trend)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {indicator.meetsTarget ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
