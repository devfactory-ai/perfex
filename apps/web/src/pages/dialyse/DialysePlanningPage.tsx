/**
 * Dialyse Planning Page
 * Interactive calendar for dialysis session scheduling
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, Plus, Settings } from 'lucide-react';
import { api, type ApiResponse } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHeader, SectionCard, Button } from '@/components/healthcare';

interface DialysisSession {
  id: string;
  sessionNumber: string;
  patientId: string;
  prescriptionId: string;
  machineId: string | null;
  slotId: string | null;
  sessionDate: Date;
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  scheduledStartTime: string | null;
  actualStartTime: Date | null;
  actualEndTime: Date | null;
  notes: string | null;
}

interface SessionSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  maxPatients: number;
  active: boolean;
}

export function DialysePlanningPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Get week start and end dates
  const weekDates = useMemo(() => {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }
    return dates;
  }, [selectedDate]);

  // Fetch session slots
  const { data: slots } = useQuery({
    queryKey: ['dialyse-slots'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<SessionSlot[]>>('/dialyse/slots');
      return response.data.data;
    },
  });

  // Fetch sessions for the selected period
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['dialyse-sessions', selectedDate.toISOString(), viewMode],
    queryFn: async () => {
      const dateFrom = viewMode === 'week'
        ? weekDates[0].toISOString()
        : selectedDate.toISOString();
      const dateTo = viewMode === 'week'
        ? weekDates[6].toISOString()
        : new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000).toISOString();

      const response = await api.get<ApiResponse<DialysisSession[]>>(
        `/dialyse/sessions?dateFrom=${dateFrom}&dateTo=${dateTo}`
      );
      return response.data.data;
    },
  });

  // Session workflow mutations
  const checkInMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.post(`/dialyse/sessions/${sessionId}/check-in`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-sessions'] });
    },
  });

  const startMutation = useMutation({
    mutationFn: async ({ sessionId, machineId }: { sessionId: string; machineId?: string }) => {
      await api.post(`/dialyse/sessions/${sessionId}/start${machineId ? `?machineId=${machineId}` : ''}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-sessions'] });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      await api.post(`/dialyse/sessions/${sessionId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-sessions'] });
    },
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    }
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-slate-200 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-300';
      case 'checked_in': return 'bg-slate-400 text-white border-slate-300 dark:bg-slate-500';
      case 'in_progress': return 'bg-slate-600 text-white border-slate-500 dark:bg-slate-500';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-slate-500 text-white border-slate-400 dark:bg-slate-500';
      case 'no_show': return 'bg-slate-400 text-white border-slate-300 dark:bg-slate-500';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: t('dialyse.statusScheduled'),
      checked_in: t('dialyse.statusCheckedIn'),
      in_progress: t('dialyse.statusInProgress'),
      completed: t('dialyse.statusCompleted'),
      cancelled: t('dialyse.statusCancelled'),
      no_show: t('dialyse.statusNoShow'),
    };
    return labels[status] || status;
  };

  const getSessionsForSlot = (slotId: string, date: Date) => {
    if (!sessions) return [];
    return sessions.filter(s => {
      const sessionDate = new Date(s.sessionDate);
      return s.slotId === slotId &&
        sessionDate.toDateString() === date.toDateString();
    });
  };

  const getSessionsForDate = (date: Date) => {
    if (!sessions) return [];
    return sessions.filter(s => {
      const sessionDate = new Date(s.sessionDate);
      return sessionDate.toDateString() === date.toDateString();
    });
  };
  void getSessionsForDate; // Used for week view rendering

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('dialyse.planning')}
        subtitle={t('dialyse.planningSubtitle')}
        icon={Calendar}
        module="dialyse"
        actions={
          <>
            <Button
              onClick={() => navigate('/dialyse/sessions/new')}
              module="dialyse"
              variant="primary"
              icon={Plus}
            >
              {t('dialyse.newSession')}
            </Button>
            <Button
              onClick={() => navigate('/dialyse/slots')}
              variant="outline"
              icon={Settings}
            >
              {t('dialyse.configureSlots')}
            </Button>
          </>
        }
      />

      {/* Navigation and View Controls */}
      <SectionCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <Button
                onClick={goToToday}
                variant="outline"
                size="sm"
              >
                {t('dialyse.today')}
              </Button>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {viewMode === 'day' ? formatDate(selectedDate) : `${t('dialyse.weekOf')} ${formatShortDate(weekDates[0])}`}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setViewMode('day')}
              variant={viewMode === 'day' ? 'primary' : 'outline'}
              module={viewMode === 'day' ? 'dialyse' : undefined}
              size="sm"
            >
              {t('dialyse.day')}
            </Button>
            <Button
              onClick={() => setViewMode('week')}
              variant={viewMode === 'week' ? 'primary' : 'outline'}
              module={viewMode === 'week' ? 'dialyse' : undefined}
              size="sm"
            >
              {t('dialyse.week')}
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Calendar Grid */}
      <SectionCard className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-900 dark:border-gray-100 border-t-transparent mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">{t('dialyse.loadingPlanning')}</p>
            </div>
          </div>
        ) : viewMode === 'day' ? (
          /* Day View */
          <div>
            {/* Slots */}
            {slots && slots.length > 0 ? (
              <div className="divide-y">
                {slots.map((slot) => {
                  const slotSessions = getSessionsForSlot(slot.id, selectedDate);
                  const dayOfWeek = selectedDate.getDay();
                  const isActiveDay = slot.daysOfWeek.includes(dayOfWeek === 0 ? 6 : dayOfWeek - 1);

                  if (!isActiveDay) return null;

                  return (
                    <div key={slot.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{slot.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {slot.startTime} - {slot.endTime} | {t('dialyse.capacity')}: {slot.maxPatients} {t('dialyse.patients')}
                          </p>
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {slotSessions.length}/{slot.maxPatients} {t('dialyse.occupied')}
                        </span>
                      </div>

                      {slotSessions.length > 0 ? (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          {slotSessions.map((session) => (
                            <div
                              key={session.id}
                              className={`p-3 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${getStatusColor(session.status)}`}
                              onClick={() => navigate(`/dialyse/sessions/${session.id}`)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-sm font-medium">{session.sessionNumber}</span>
                                <span className="text-xs font-medium">{getStatusLabel(session.status)}</span>
                              </div>
                              <div className="mt-2 flex gap-2">
                                {session.status === 'scheduled' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); checkInMutation.mutate(session.id); }}
                                    className="text-xs px-2 py-1 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                                  >
                                    Check-in
                                  </button>
                                )}
                                {session.status === 'checked_in' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); startMutation.mutate({ sessionId: session.id }); }}
                                    className="text-xs px-2 py-1 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                                  >
                                    {t('dialyse.start')}
                                  </button>
                                )}
                                {session.status === 'in_progress' && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); completeMutation.mutate(session.id); }}
                                    className="text-xs px-2 py-1 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
                                  >
                                    {t('dialyse.complete')}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-600 dark:text-gray-400 text-sm">
                          {t('dialyse.noSessionsForSlot')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">{t('dialyse.noSlotsConfigured')}</p>
                <button
                  onClick={() => navigate('/dialyse/slots')}
                  className="mt-2 text-gray-900 dark:text-gray-100 hover:underline text-sm font-medium"
                >
                  {t('dialyse.configureSlots')}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Week View */
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="p-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase w-24">
                    {t('dialyse.slot')}
                  </th>
                  {weekDates.map((date, i) => {
                    const isToday = date.toDateString() === new Date().toDateString();
                    return (
                      <th
                        key={i}
                        className={`p-3 text-center text-xs font-medium uppercase ${isToday ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
                      >
                        <div className={isToday ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}>
                          {formatShortDate(date)}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {slots?.map((slot) => (
                  <tr key={slot.id} className="divide-x divide-gray-200 dark:divide-gray-700">
                    <td className="p-3 bg-gray-50 dark:bg-gray-800/30">
                      <div className="font-medium text-sm text-gray-900 dark:text-white">{slot.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{slot.startTime}</div>
                    </td>
                    {weekDates.map((date, i) => {
                      const dayOfWeek = date.getDay();
                      const isActiveDay = slot.daysOfWeek.includes(dayOfWeek === 0 ? 6 : dayOfWeek - 1);
                      const daySessions = getSessionsForSlot(slot.id, date);
                      const isToday = date.toDateString() === new Date().toDateString();

                      return (
                        <td
                          key={i}
                          className={`p-2 align-top min-h-[100px] ${isToday ? 'bg-gray-50 dark:bg-gray-800/30' : ''} ${!isActiveDay ? 'bg-gray-100 dark:bg-gray-800/20' : ''}`}
                        >
                          {isActiveDay && (
                            <div className="space-y-1">
                              {daySessions.map((session) => (
                                <div
                                  key={session.id}
                                  className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(session.status)}`}
                                  onClick={() => navigate(`/dialyse/sessions/${session.id}`)}
                                >
                                  {session.scheduledStartTime || '--:--'}
                                </div>
                              ))}
                              {daySessions.length === 0 && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 text-center py-2">-</div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Legend */}
      <SectionCard className="p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400 font-medium">{t('dialyse.legend')}:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></div>
            <span className="text-gray-900 dark:text-white">{t('dialyse.statusScheduled')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-400 border border-slate-500"></div>
            <span className="text-gray-900 dark:text-white">{t('dialyse.statusCheckedIn')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-600 border border-slate-700"></div>
            <span className="text-gray-900 dark:text-white">{t('dialyse.statusInProgress')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-200 border border-gray-300"></div>
            <span className="text-gray-900 dark:text-white">{t('dialyse.statusCompleted')}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-500 border border-slate-600"></div>
            <span className="text-gray-900 dark:text-white">{t('dialyse.statusCancelled')}</span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
