/**
 * Cardiology Risk Scores Page
 * Calculate cardiovascular risk scores
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  Plus,
  Calendar,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';
import {
  PageHeader,
  FilterBar,
  SectionCard,
  Button,
  EmptyState,
  InlineLoading,
  getStatusColor,
} from '../../components/healthcare';

export default function CardiologyRiskScoresPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: riskScores, isLoading } = useQuery({
    queryKey: ['cardiology-risk-scores', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      const response = await api.get(`/cardiology/risk-scores?${params}`);
      return response.data?.data || [];
    },
  });

  const getRiskStatus = (level: string) => {
    switch (level) {
      case 'low':
        return 'completed';
      case 'moderate':
        return 'in-progress';
      case 'high':
        return 'pending';
      case 'very_high':
        return 'critical';
      default:
        return 'pending';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('cardiology.riskScores') || 'Scores de Risque'}
        subtitle={t('cardiology.riskCalculation') || 'Calcul des scores de risque cardiovasculaire'}
        icon={Calculator}
        module="cardiology"
        actions={
          <Button
            module="cardiology"
            icon={Plus}
            onClick={() => navigate('/cardiology/risk-scores/new')}
          >
            {t('common.new') || 'Nouveau'}
          </Button>
        }
      />

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder={t('common.search') || 'Rechercher...'}
        module="cardiology"
      />

      {/* Risk Scores List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} />
        ) : riskScores?.length === 0 ? (
          <EmptyState
            icon={Calculator}
            title={t('common.noData') || 'Aucun score de risque trouvé'}
            module="cardiology"
            action={{
              label: t('common.new') || 'Nouveau',
              icon: Plus,
              onClick: () => navigate('/cardiology/risk-scores/new'),
            }}
          />
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {riskScores?.map((score: any) => (
              <div
                key={score.id}
                onClick={() => navigate(`/cardiology/risk-scores/${score.id}/edit`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                      <Calculator className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {score.patientName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(getRiskStatus(score.riskLevel))}`}>
                          {score.riskLevel}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(score.calculatedAt).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{score.scoreType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 ml-4">
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">Score</p>
                        <p className="font-medium text-gray-900 dark:text-white">{score.scoreValue}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
