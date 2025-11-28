/**
 * AI Insights Dashboard
 * Display and manage AI-generated business insights
 * Enhanced with better cards, animations, and visual charts
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';

interface Insight {
  id: string;
  type: string;
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  data?: Record<string, unknown>;
  dismissed: boolean;
  createdAt: string;
}

interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  byFeature: Record<string, {
    requests: number;
    tokens: number;
    cost: number;
  }>;
}

type InsightType = 'all' | 'analysis' | 'prediction' | 'anomaly';

const typeConfig: Record<string, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  analysis: {
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Analysis',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  prediction: {
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    label: 'Prediction',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  anomaly: {
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Anomaly',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
};

const featureConfig: Record<string, { color: string; icon: string }> = {
  chat: { color: 'from-blue-500 to-blue-600', icon: '💬' },
  search: { color: 'from-purple-500 to-purple-600', icon: '🔍' },
  extract: { color: 'from-green-500 to-green-600', icon: '📄' },
  insights: { color: 'from-yellow-500 to-yellow-600', icon: '💡' },
};

export function AIInsightsDashboard() {
  const [typeFilter, setTypeFilter] = useState<InsightType>('all');
  const [showDismissed, setShowDismissed] = useState(false);
  const queryClient = useQueryClient();

  // Fetch insights
  const { data: insights, isLoading: insightsLoading, error: insightsError } = useQuery({
    queryKey: ['ai-insights', typeFilter, showDismissed],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }
      params.append('dismissed', String(showDismissed));
      const response = await api.get<ApiResponse<Insight[]>>(`/ai/insights?${params.toString()}`);
      return response.data.data;
    },
  });

  // Fetch usage stats
  const { data: usage, isLoading: usageLoading } = useQuery({
    queryKey: ['ai-usage'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<UsageStats>>('/ai/usage');
      return response.data.data;
    },
  });

  // Dismiss insight mutation
  const dismissInsight = useMutation({
    mutationFn: async (insightId: string) => {
      await api.post(`/ai/insights/${insightId}/dismiss`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-insights'] });
    },
    onError: (error) => {
      alert(`Failed to dismiss: ${getErrorMessage(error)}`);
    },
  });

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBarColor = (confidence: number): string => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfig = (type: string) => typeConfig[type] || typeConfig.analysis;

  // Calculate total usage for percentage
  const totalUsage = usage?.byFeature
    ? Object.values(usage.byFeature).reduce((sum, f) => sum + f.requests, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Usage Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-3xl font-bold">
                {usageLoading ? (
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded" />
                ) : (
                  formatNumber(usage?.totalRequests || 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tokens</p>
              <p className="text-3xl font-bold">
                {usageLoading ? (
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded" />
                ) : (
                  formatNumber(usage?.totalTokens || 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-green-500/25">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Cost</p>
              <p className="text-3xl font-bold">
                {usageLoading ? (
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded" />
                ) : (
                  formatCurrency(usage?.totalCost || 0)
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-yellow-500/25">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Insights</p>
              <p className="text-3xl font-bold">
                {insightsLoading ? (
                  <span className="inline-block w-16 h-8 bg-muted animate-pulse rounded" />
                ) : (
                  insights?.filter(i => !i.dismissed).length || 0
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Usage Breakdown */}
      {usage?.byFeature && Object.keys(usage.byFeature).length > 0 && (
        <div className="rounded-2xl border bg-card overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Usage by Feature</h3>
            <p className="text-sm text-muted-foreground mt-1">Breakdown of AI usage across different features</p>
          </div>
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(usage.byFeature).map(([feature, stats]) => {
                const config = featureConfig[feature] || { color: 'from-gray-500 to-gray-600', icon: '📊' };
                const percentage = totalUsage > 0 ? (stats.requests / totalUsage) * 100 : 0;

                return (
                  <div
                    key={feature}
                    className="rounded-xl bg-muted/30 p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-white shadow-md`}>
                        <span className="text-lg">{config.icon}</span>
                      </div>
                      <span className="font-semibold capitalize">{feature}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full bg-gradient-to-r ${config.color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold">{formatNumber(stats.requests)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Requests</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{formatNumber(stats.tokens)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tokens</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{formatCurrency(stats.cost)}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cost</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Insights List */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-lg font-semibold">AI Insights</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Actionable insights generated by AI analysis
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Type Filter */}
              <div className="flex rounded-xl border overflow-hidden">
                {(['all', 'analysis', 'prediction', 'anomaly'] as InsightType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      typeFilter === type
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-accent'
                    }`}
                  >
                    {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>

              {/* Show Dismissed Toggle */}
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showDismissed}
                    onChange={(e) => setShowDismissed(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-10 h-6 rounded-full transition-colors ${showDismissed ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform mt-1 ${showDismissed ? 'translate-x-5 ml-0' : 'translate-x-1'}`} />
                  </div>
                </div>
                <span className="text-muted-foreground">Show dismissed</span>
              </label>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {insightsLoading ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">Loading insights...</p>
            </div>
          ) : insightsError ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm text-destructive font-medium">{getErrorMessage(insightsError)}</p>
            </div>
          ) : insights && insights.length > 0 ? (
            insights.map((insight, index) => {
              const config = getConfig(insight.type);
              return (
                <div
                  key={insight.id}
                  className={`p-6 hover:bg-accent/30 transition-colors ${insight.dismissed ? 'opacity-50' : ''} animate-in fade-in slide-in-from-left duration-300`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${config.bgColor} ${config.color} flex items-center justify-center`}>
                      {config.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                        {insight.actionable && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Actionable
                          </span>
                        )}
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getConfidenceBarColor(insight.confidence)} transition-all`}
                              style={{ width: `${insight.confidence}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                            {insight.confidence}%
                          </span>
                        </div>
                      </div>

                      <h4 className="font-semibold text-base mb-1">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{insight.description}</p>

                      {insight.data && Object.keys(insight.data).length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {Object.entries(insight.data).slice(0, 4).map(([key, value]) => (
                            <span
                              key={key}
                              className="inline-flex items-center text-xs bg-muted px-2.5 py-1 rounded-lg"
                            >
                              <span className="text-muted-foreground mr-1">{key}:</span>
                              <span className="font-medium">{String(value)}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(insight.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {!insight.dismissed && (
                          <button
                            onClick={() => dismissInsight.mutate(insight.id)}
                            disabled={dismissInsight.isPending}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h4 className="font-semibold mb-1">No insights yet</h4>
              <p className="text-sm text-muted-foreground">
                AI insights will appear here as your data is analyzed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
