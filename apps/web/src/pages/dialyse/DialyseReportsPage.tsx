/**
 * Dialyse Reports Page
 * Statistics and reports for dialysis center
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type ApiResponse } from '@/lib/api';

interface SessionStats {
  period: string;
  totalSessions: number;
  completedSessions: number;
  cancelledSessions: number;
  noShowCount: number;
  averageDuration: number;
  incidentCount: number;
  completionRate: number;
}

interface PatientStats {
  totalPatients: number;
  activePatients: number;
  newPatientsThisMonth: number;
  transferredPatients: number;
  deceasedPatients: number;
  transplantedPatients: number;
  byBloodType: Record<string, number>;
  byEtiology: Record<string, number>;
  requiresIsolation: number;
}

interface MachineStats {
  totalMachines: number;
  utilizationRate: number;
  averageSessionsPerMachine: number;
  maintenanceCount: number;
  byStatus: Record<string, number>;
}

interface LabStats {
  averageKtV: number;
  ktVAboveTarget: number;
  averageHemoglobin: number;
  hemoglobinInRange: number;
  patientsWithLabs: number;
  outOfRangeAlerts: number;
}

interface ReportData {
  sessions: SessionStats[];
  patients: PatientStats;
  machines: MachineStats;
  labs: LabStats;
  dateRange: {
    from: string;
    to: string;
  };
}

export function DialyseReportsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [reportType, setReportType] = useState<'overview' | 'sessions' | 'patients' | 'quality'>('overview');

  // Fetch report data
  const { data: report, isLoading } = useQuery({
    queryKey: ['dialyse-reports', period],
    queryFn: async () => {
      const response = await api.get<ApiResponse<ReportData>>(`/dialyse/reports?period=${period}`);
      return response.data.data;
    },
  });

  // Calculate totals from session stats
  const sessionTotals = useMemo(() => {
    if (!report?.sessions) return null;
    return report.sessions.reduce((acc, s) => ({
      totalSessions: acc.totalSessions + s.totalSessions,
      completedSessions: acc.completedSessions + s.completedSessions,
      cancelledSessions: acc.cancelledSessions + s.cancelledSessions,
      noShowCount: acc.noShowCount + s.noShowCount,
      incidentCount: acc.incidentCount + s.incidentCount,
    }), { totalSessions: 0, completedSessions: 0, cancelledSessions: 0, noShowCount: 0, incidentCount: 0 });
  }, [report?.sessions]);

  const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      case 'quarter': return 'Ce trimestre';
      case 'year': return 'Cette année';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Chargement des rapports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rapports et Statistiques</h1>
          <p className="text-muted-foreground">
            Analyse de l'activité du centre de dialyse
          </p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as typeof period)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
          </select>
          <button
            onClick={() => window.print()}
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Imprimer
          </button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="border-b">
        <nav className="flex gap-4">
          {[
            { key: 'overview', label: 'Vue d\'ensemble' },
            { key: 'sessions', label: 'Séances' },
            { key: 'patients', label: 'Patients' },
            { key: 'quality', label: 'Qualité' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setReportType(tab.key as typeof reportType)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                reportType === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Report */}
      {reportType === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Séances Réalisées</div>
              <div className="mt-2 text-3xl font-bold">{sessionTotals?.completedSessions || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">
                sur {sessionTotals?.totalSessions || 0} programmées
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Taux de Complétion</div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {sessionTotals && sessionTotals.totalSessions > 0
                  ? formatPercent(sessionTotals.completedSessions / sessionTotals.totalSessions)
                  : '0%'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Patients Actifs</div>
              <div className="mt-2 text-3xl font-bold">{report?.patients.activePatients || 0}</div>
              <div className="text-xs text-green-600 mt-1">
                +{report?.patients.newPatientsThisMonth || 0} ce mois
              </div>
            </div>

            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Incidents</div>
              <div className="mt-2 text-3xl font-bold text-orange-600">{sessionTotals?.incidentCount || 0}</div>
              <div className="text-xs text-muted-foreground mt-1">{getPeriodLabel()}</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Sessions by Period */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4">Évolution des Séances</h3>
              <div className="space-y-3">
                {report?.sessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-20 text-sm text-muted-foreground">{s.period}</div>
                    <div className="flex-1">
                      <div className="flex h-4 rounded-full overflow-hidden bg-muted">
                        <div
                          className="bg-green-500"
                          style={{ width: `${(s.completedSessions / Math.max(s.totalSessions, 1)) * 100}%` }}
                        />
                        <div
                          className="bg-red-500"
                          style={{ width: `${(s.cancelledSessions / Math.max(s.totalSessions, 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right text-sm font-medium">{s.totalSessions}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>Complétées</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span>Annulées</span>
                </div>
              </div>
            </div>

            {/* Machine Utilization */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4">Utilisation des Machines</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      className="text-muted"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={`${(report?.machines.utilizationRate || 0) * 440} 440`}
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold">
                        {formatPercent(report?.machines.utilizationRate || 0)}
                      </div>
                      <div className="text-xs text-muted-foreground">Utilisation</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-lg font-bold">{report?.machines.totalMachines || 0}</div>
                  <div className="text-xs text-muted-foreground">Machines totales</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{report?.machines.averageSessionsPerMachine?.toFixed(1) || 0}</div>
                  <div className="text-xs text-muted-foreground">Séances/machine</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Indicators */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Indicateurs de Qualité</h3>
            <div className="grid gap-6 md:grid-cols-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Kt/V moyen</span>
                  <span className="font-bold">{report?.labs.averageKtV?.toFixed(2) || '-'}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${(report?.labs.averageKtV || 0) >= 1.2 ? 'bg-green-500' : 'bg-orange-500'}`}
                    style={{ width: `${Math.min((report?.labs.averageKtV || 0) / 2 * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">Cible: ≥ 1.2</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Kt/V ≥ 1.2</span>
                  <span className="font-bold">{formatPercent(report?.labs.ktVAboveTarget || 0)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(report?.labs.ktVAboveTarget || 0) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">des patients</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Hémoglobine moyenne</span>
                  <span className="font-bold">{report?.labs.averageHemoglobin?.toFixed(0) || '-'} g/L</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${(report?.labs.averageHemoglobin || 0) >= 100 ? 'bg-green-500' : 'bg-orange-500'}`}
                    style={{ width: `${Math.min((report?.labs.averageHemoglobin || 0) / 150 * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">Cible: 100-120 g/L</div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Hb dans la cible</span>
                  <span className="font-bold">{formatPercent(report?.labs.hemoglobinInRange || 0)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${(report?.labs.hemoglobinInRange || 0) * 100}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground mt-1">des patients</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Report */}
      {reportType === 'sessions' && (
        <div className="space-y-6">
          {/* Session Metrics */}
          <div className="grid gap-4 md:grid-cols-5">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Total Séances</div>
              <div className="mt-2 text-2xl font-bold">{sessionTotals?.totalSessions || 0}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Complétées</div>
              <div className="mt-2 text-2xl font-bold text-green-600">{sessionTotals?.completedSessions || 0}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Annulées</div>
              <div className="mt-2 text-2xl font-bold text-red-600">{sessionTotals?.cancelledSessions || 0}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Absences</div>
              <div className="mt-2 text-2xl font-bold text-orange-600">{sessionTotals?.noShowCount || 0}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Incidents</div>
              <div className="mt-2 text-2xl font-bold text-yellow-600">{sessionTotals?.incidentCount || 0}</div>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="rounded-lg border bg-card">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Détail par période</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Période</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Complétées</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Annulées</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Absences</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Taux</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Durée moy.</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {report?.sessions.map((s, i) => (
                    <tr key={i} className="hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium">{s.period}</td>
                      <td className="px-6 py-4 text-right">{s.totalSessions}</td>
                      <td className="px-6 py-4 text-right text-green-600">{s.completedSessions}</td>
                      <td className="px-6 py-4 text-right text-red-600">{s.cancelledSessions}</td>
                      <td className="px-6 py-4 text-right text-orange-600">{s.noShowCount}</td>
                      <td className="px-6 py-4 text-right">{formatPercent(s.completionRate)}</td>
                      <td className="px-6 py-4 text-right">{s.averageDuration} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Patients Report */}
      {reportType === 'patients' && (
        <div className="space-y-6">
          {/* Patient Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Patients Totaux</div>
              <div className="mt-2 text-2xl font-bold">{report?.patients.totalPatients || 0}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Patients Actifs</div>
              <div className="mt-2 text-2xl font-bold text-green-600">{report?.patients.activePatients || 0}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Nouveaux ce mois</div>
              <div className="mt-2 text-2xl font-bold text-blue-600">{report?.patients.newPatientsThisMonth || 0}</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Nécessitent Isolation</div>
              <div className="mt-2 text-2xl font-bold text-orange-600">{report?.patients.requiresIsolation || 0}</div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* By Blood Type */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4">Répartition par Groupe Sanguin</h3>
              <div className="space-y-3">
                {report?.patients.byBloodType && Object.entries(report.patients.byBloodType).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-4">
                    <div className="w-12 font-bold">{type}</div>
                    <div className="flex-1">
                      <div className="h-4 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-red-500"
                          style={{ width: `${(count / (report?.patients.totalPatients || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-12 text-right font-medium">{count}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Patient Status */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4">Statut des Patients</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                  <span className="text-green-700">Actifs</span>
                  <span className="font-bold text-green-600">{report?.patients.activePatients || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <span className="text-blue-700">Transférés</span>
                  <span className="font-bold text-blue-600">{report?.patients.transferredPatients || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 border border-purple-200">
                  <span className="text-purple-700">Transplantés</span>
                  <span className="font-bold text-purple-600">{report?.patients.transplantedPatients || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <span className="text-gray-700">Décédés</span>
                  <span className="font-bold text-gray-600">{report?.patients.deceasedPatients || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* By Etiology */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Répartition par Étiologie</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {report?.patients.byEtiology && Object.entries(report.patients.byEtiology).map(([etiology, count]) => (
                <div key={etiology} className="flex items-center justify-between p-3 rounded-lg border">
                  <span className="text-sm">{etiology || 'Non spécifié'}</span>
                  <span className="font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quality Report */}
      {reportType === 'quality' && (
        <div className="space-y-6">
          {/* Quality KPIs */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Kt/V Moyen</div>
              <div className="mt-2 text-2xl font-bold">{report?.labs.averageKtV?.toFixed(2) || '-'}</div>
              <div className={`text-xs mt-1 ${(report?.labs.averageKtV || 0) >= 1.2 ? 'text-green-600' : 'text-orange-600'}`}>
                Cible: ≥ 1.2
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Patients Kt/V ≥ 1.2</div>
              <div className="mt-2 text-2xl font-bold text-green-600">
                {formatPercent(report?.labs.ktVAboveTarget || 0)}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Hémoglobine Moyenne</div>
              <div className="mt-2 text-2xl font-bold">{report?.labs.averageHemoglobin?.toFixed(0) || '-'} g/L</div>
              <div className="text-xs text-muted-foreground mt-1">Cible: 100-120 g/L</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-sm font-medium text-muted-foreground">Hb dans la Cible</div>
              <div className="mt-2 text-2xl font-bold text-green-600">
                {formatPercent(report?.labs.hemoglobinInRange || 0)}
              </div>
            </div>
          </div>

          {/* Quality Targets */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Objectifs de Qualité KDOQI</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Indicateur</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Cible</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Résultat</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr className="hover:bg-muted/50">
                    <td className="px-6 py-4">Kt/V (spKt/V)</td>
                    <td className="px-6 py-4 text-center">≥ 1.2</td>
                    <td className="px-6 py-4 text-center font-bold">{report?.labs.averageKtV?.toFixed(2) || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      {(report?.labs.averageKtV || 0) >= 1.2 ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Atteint</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Non atteint</span>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-6 py-4">URR</td>
                    <td className="px-6 py-4 text-center">≥ 65%</td>
                    <td className="px-6 py-4 text-center font-bold">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-6 py-4">Hémoglobine</td>
                    <td className="px-6 py-4 text-center">100-120 g/L</td>
                    <td className="px-6 py-4 text-center font-bold">{report?.labs.averageHemoglobin?.toFixed(0) || '-'} g/L</td>
                    <td className="px-6 py-4 text-center">
                      {(report?.labs.averageHemoglobin || 0) >= 100 && (report?.labs.averageHemoglobin || 0) <= 120 ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Atteint</span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Hors cible</span>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-6 py-4">Ferritine</td>
                    <td className="px-6 py-4 text-center">200-500 µg/L</td>
                    <td className="px-6 py-4 text-center font-bold">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-6 py-4">TSAT</td>
                    <td className="px-6 py-4 text-center">20-50%</td>
                    <td className="px-6 py-4 text-center font-bold">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-6 py-4">Phosphore</td>
                    <td className="px-6 py-4 text-center">0.8-1.5 mmol/L</td>
                    <td className="px-6 py-4 text-center font-bold">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-6 py-4">PTH</td>
                    <td className="px-6 py-4 text-center">150-300 pg/mL</td>
                    <td className="px-6 py-4 text-center font-bold">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">N/A</span>
                    </td>
                  </tr>
                  <tr className="hover:bg-muted/50">
                    <td className="px-6 py-4">Albumine</td>
                    <td className="px-6 py-4 text-center">≥ 35 g/L</td>
                    <td className="px-6 py-4 text-center font-bold">-</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">N/A</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Incident Summary */}
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold mb-4">Résumé des Incidents</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="text-2xl font-bold text-yellow-600">{sessionTotals?.incidentCount || 0}</div>
                <div className="text-sm text-yellow-700">Incidents totaux</div>
              </div>
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {sessionTotals && sessionTotals.completedSessions > 0
                    ? ((sessionTotals.incidentCount / sessionTotals.completedSessions) * 100).toFixed(1)
                    : 0}%
                </div>
                <div className="text-sm text-blue-700">Taux d'incidents</div>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="text-2xl font-bold text-green-600">{report?.labs.patientsWithLabs || 0}</div>
                <div className="text-sm text-green-700">Patients avec bilans</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
