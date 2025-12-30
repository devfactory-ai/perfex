/**
 * Dialyse Slots Configuration Page
 * Manage dialysis session time slots
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { Pencil, Trash2, Plus, Clock } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  PageHeader,
  Button,
  SectionCard,
  EmptyState,
  InlineLoading,
} from '@/components/healthcare';

// API returns snake_case - we transform it
interface SessionSlotApi {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  days_of_week: string | number[];
  max_patients: number;
  active: boolean;
  created_at: number;
}

interface SessionSlot {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  maxPatients: number;
  active: boolean;
  createdAt: string;
}

interface SlotFormData {
  name: string;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  maxPatients: number;
  active: boolean;
}

const defaultSlotForm: SlotFormData = {
  name: '',
  startTime: '06:00',
  endTime: '10:00',
  daysOfWeek: [0, 1, 2, 3, 4, 5], // Mon-Sat
  maxPatients: 6,
  active: true,
};

// Day names are now handled by t() function in component

// Transform API response to frontend format
const transformSlot = (record: SessionSlotApi): SessionSlot => {
  let daysOfWeek: number[] = [];
  if (typeof record.days_of_week === 'string') {
    try {
      daysOfWeek = JSON.parse(record.days_of_week);
    } catch (e) {
      daysOfWeek = [];
    }
  } else if (Array.isArray(record.days_of_week)) {
    daysOfWeek = record.days_of_week;
  }

  return {
    id: record.id,
    name: record.name,
    startTime: record.start_time || '',
    endTime: record.end_time || '',
    daysOfWeek,
    maxPatients: record.max_patients || 6,
    active: record.active ?? true,
    createdAt: record.created_at ? new Date(record.created_at).toISOString() : '',
  };
};

export function DialyseSlotsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useLanguage();

  const [showModal, setShowModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<SessionSlot | null>(null);
  const [formData, setFormData] = useState<SlotFormData>(defaultSlotForm);

  // Day names with translation
  const getDayName = (index: number): string => {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    return t(`dialyse.days.${days[index]}`);
  };

  // Fetch slots
  const { data: slots, isLoading } = useQuery({
    queryKey: ['dialyse-slots'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: SessionSlotApi[] }>('/dialyse/slots');
      return (response.data.data || []).map(transformSlot);
    },
  });

  // Create slot mutation
  const createSlot = useMutation({
    mutationFn: async (data: SlotFormData) => {
      const response = await api.post<ApiResponse<SessionSlot>>('/dialyse/slots', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-slots'] });
      setShowModal(false);
      resetForm();
      toast.success(t('dialyse.slotCreated'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Update slot mutation
  const updateSlot = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: SlotFormData }) => {
      const response = await api.put<ApiResponse<SessionSlot>>(`/dialyse/slots/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-slots'] });
      setShowModal(false);
      resetForm();
      toast.success(t('dialyse.slotUpdated'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Delete slot mutation
  const deleteSlot = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dialyse/slots/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-slots'] });
      toast.success(t('dialyse.slotDeleted'));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Toggle slot active status
  const toggleSlotActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const response = await api.patch<ApiResponse<SessionSlot>>(`/dialyse/slots/${id}`, { active });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dialyse-slots'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const resetForm = () => {
    setFormData(defaultSlotForm);
    setEditingSlot(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (slot: SessionSlot) => {
    setEditingSlot(slot);
    setFormData({
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      daysOfWeek: slot.daysOfWeek,
      maxPatients: slot.maxPatients,
      active: slot.active,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.warning(t('dialyse.enterSlotName'));
      return;
    }
    if (formData.daysOfWeek.length === 0) {
      toast.warning(t('dialyse.selectAtLeastOneDay'));
      return;
    }

    if (editingSlot) {
      updateSlot.mutate({ id: editingSlot.id, data: formData });
    } else {
      createSlot.mutate(formData);
    }
  };

  const handleDelete = (slot: SessionSlot) => {
    if (window.confirm(`${t('dialyse.confirmDeleteSlot')} "${slot.name}"?`)) {
      deleteSlot.mutate(slot.id);
    }
  };

  const toggleDay = (day: number) => {
    setFormData(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const formatTime = (time: string) => {
    return time.slice(0, 5);
  };

  const getDaysDisplay = (days: number[]) => {
    if (days.length === 7) return t('dialyse.allDays');
    if (days.length === 6 && !days.includes(6)) return t('dialyse.monToSat');
    if (days.length === 5 && !days.includes(5) && !days.includes(6)) return t('dialyse.monToFri');
    return days.map(d => getDayName(d)).join(', ');
  };

  // Sort slots by start time
  const sortedSlots = slots?.slice().sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={t('dialyse.slotsConfiguration')}
        subtitle={t('dialyse.slotsSubtitle')}
        icon={Clock}
        module="dialyse"
        actions={
          <>
            <Button
              variant="outline"
              onClick={() => navigate('/dialyse/planning')}
            >
              {t('dialyse.backToPlanning')}
            </Button>
            <Button
              module="dialyse"
              variant="primary"
              icon={Plus}
              onClick={openCreateModal}
            >
              {t('dialyse.newSlot')}
            </Button>
          </>
        }
      />

      {/* Slots List */}
      <SectionCard>
        {isLoading ? (
          <InlineLoading rows={5} message={t('dialyse.loadingSlots')} />
        ) : sortedSlots && sortedSlots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.name')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.schedule')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.days')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.capacity')}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.status')}</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">{t('dialyse.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedSlots.map((slot) => (
                  <tr key={slot.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!slot.active ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white">{slot.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                          <span
                            key={day}
                            className={`px-1.5 py-0.5 text-xs rounded ${
                              slot.daysOfWeek.includes(day)
                                ? 'bg-slate-800 text-white dark:bg-slate-600'
                                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                            }`}
                          >
                            {getDayName(day)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{slot.maxPatients} {t('dialyse.patients')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleSlotActive.mutate({ id: slot.id, active: !slot.active })}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          slot.active
                            ? 'bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-500'
                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                        }`}
                      >
                        {slot.active ? t('dialyse.active') : t('dialyse.inactive')}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(slot)}
                          className="p-2 text-gray-500 hover:text-slate-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 rounded-md transition-colors"
                          title={t('dialyse.edit')}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(slot)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 rounded-md transition-colors"
                          title={t('dialyse.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Clock}
            title={t('dialyse.noSlotsConfigured')}
            description={t('dialyse.createSlotsToOrganize')}
            module="dialyse"
            action={{
              label: t('dialyse.createSlot'),
              onClick: openCreateModal,
              icon: Plus,
            }}
          />
        )}
      </SectionCard>

      {/* Suggested Slots */}
      {slots && slots.length === 0 && (
        <SectionCard className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('dialyse.suggestedSlots')}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('dialyse.typicalConfiguration')}
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <h4 className="font-medium text-gray-900 dark:text-white">{t('dialyse.morning')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">06:00 - 10:00</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{t('dialyse.firstSlotOfDay')}</p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <h4 className="font-medium text-gray-900 dark:text-white">{t('dialyse.afternoon')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">11:00 - 15:00</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{t('dialyse.centralSlot')}</p>
            </div>
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <h4 className="font-medium text-gray-900 dark:text-white">{t('dialyse.evening')}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">16:00 - 20:00</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{t('dialyse.lastSlot')}</p>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {editingSlot ? t('dialyse.editSlot') : t('dialyse.newSlot')}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('dialyse.slotName')} *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t('dialyse.slotNamePlaceholder')}
                  required
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400"
                />
              </div>

              {/* Times */}
              <div className="grid gap-4 grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('dialyse.startTime')} *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('dialyse.endTime')} *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    required
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400"
                  />
                </div>
              </div>

              {/* Days of week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('dialyse.daysOfWeek')} *</label>
                <div className="flex flex-wrap gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        formData.daysOfWeek.includes(index)
                          ? 'bg-slate-800 text-white hover:bg-slate-900 dark:bg-slate-600 dark:hover:bg-slate-500'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {getDayName(index)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dialyse.selected')}: {getDaysDisplay(formData.daysOfWeek)}
                </p>
              </div>

              {/* Max patients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('dialyse.maxCapacity')}</label>
                <input
                  type="number"
                  value={formData.maxPatients}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxPatients: parseInt(e.target.value) || 1 }))}
                  min={1}
                  max={50}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dialyse.maxPatientsPerSlot')}
                </p>
              </div>

              {/* Active */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="slotActive"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-slate-800 focus:ring-slate-500"
                />
                <label htmlFor="slotActive" className="text-sm text-gray-700 dark:text-gray-300">
                  {t('dialyse.slotActive')}
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
                  {t('dialyse.cancel')}
                </Button>
                <Button
                  module="dialyse"
                  variant="primary"
                  type="submit"
                  disabled={createSlot.isPending || updateSlot.isPending}
                  loading={createSlot.isPending || updateSlot.isPending}
                >
                  {editingSlot ? t('dialyse.update') : t('dialyse.create')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
