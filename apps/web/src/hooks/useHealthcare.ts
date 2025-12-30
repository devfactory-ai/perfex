/**
 * Healthcare Module Hooks
 * Reusable hooks for Dialyse, Cardiology, and Ophthalmology modules
 */

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getErrorMessage, type ApiResponse } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

// ============================================================================
// TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T;
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  total: number;
  totalPages: number;
}

export interface FilterState {
  searchTerm: string;
  filters: Record<string, string>;
}

// ============================================================================
// USE FORM STATE HOOK
// ============================================================================

export interface UseFormStateOptions<T> {
  initialData: T;
  validate?: (data: T) => Record<string, string>;
}

export function useFormState<T extends Record<string, any>>({
  initialData,
  validate,
}: UseFormStateOptions<T>) {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      const checked = (e.target as HTMLInputElement).checked;

      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));

      // Clear error when field is modified
      if (errors[name]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  }, []);

  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as string]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as string];
        return newErrors;
      });
    }
  }, [errors]);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const validateForm = useCallback((): boolean => {
    if (!validate) return true;

    const validationErrors = validate(formData);
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  }, [formData, validate]);

  const resetForm = useCallback((data?: T) => {
    setFormData(data || initialData);
    setErrors({});
    setTouched({});
  }, [initialData]);

  const isDirty = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(initialData);
  }, [formData, initialData]);

  return {
    formData,
    setFormData,
    errors,
    setErrors,
    touched,
    handleChange,
    handleBlur,
    setFieldValue,
    setFieldError,
    validateForm,
    resetForm,
    isDirty,
  };
}

// ============================================================================
// USE PAGINATED QUERY HOOK
// ============================================================================

export interface UsePaginatedQueryOptions {
  queryKey: string;
  endpoint: string;
  filters?: Record<string, string | undefined>;
  defaultLimit?: number;
  enabled?: boolean;
}

export function usePaginatedQuery<T>({
  queryKey,
  endpoint,
  filters = {},
  defaultLimit = 25,
  enabled = true,
}: UsePaginatedQueryOptions) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultLimit);
  const [searchTerm, setSearchTerm] = useState('');

  // Build query key with all dependencies
  const fullQueryKey = useMemo(
    () => [queryKey, searchTerm, filters, currentPage, itemsPerPage],
    [queryKey, searchTerm, filters, currentPage, itemsPerPage]
  );

  const query = useQuery({
    queryKey: fullQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams();

      // Add search term
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      // Add filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            params.append(key, value);
          }
        });
      }

      // Add pagination
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());

      const url = `${endpoint}${params.toString() ? `?${params.toString()}` : ''}`;
      const result = await api.get<PaginatedResponse<T[]>>(url);
      return result.data;
    },
    enabled,
  });

  const paginatedData = useMemo(() => {
    const data = query.data?.data || [];
    const total = query.data?.meta?.total || 0;
    const totalPages = Math.ceil(total / itemsPerPage);
    return { data, total, totalPages };
  }, [query.data, itemsPerPage]);

  // Reset to page 1 when filters change
  const updateFilters = useCallback((_newFilters: Record<string, string | undefined>) => {
    setCurrentPage(1);
  }, []);

  const updateSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  }, []);

  return {
    ...query,
    data: paginatedData.data,
    total: paginatedData.total,
    totalPages: paginatedData.totalPages,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    searchTerm,
    setSearchTerm: updateSearch,
    updateFilters,
  };
}

// ============================================================================
// USE DELETE MUTATION HOOK
// ============================================================================

export interface UseDeleteMutationOptions {
  endpoint: string;
  queryKey: string | string[];
  successMessage?: string;
  confirmMessage?: string;
}

export function useDeleteMutation({
  endpoint,
  queryKey,
  successMessage = 'Élément supprimé avec succès',
  confirmMessage = 'Êtes-vous sûr de vouloir supprimer cet élément ?',
}: UseDeleteMutationOptions) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${endpoint}/${id}`);
    },
    onSuccess: () => {
      const keys = Array.isArray(queryKey) ? queryKey : [queryKey];
      keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      toast.success(successMessage);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleDelete = useCallback(
    (id: string) => {
      if (confirm(confirmMessage)) {
        mutation.mutate(id);
      }
    },
    [confirmMessage, mutation]
  );

  return {
    ...mutation,
    handleDelete,
  };
}

// ============================================================================
// USE STATUS MUTATION HOOK
// ============================================================================

export interface UseStatusMutationOptions {
  endpoint: string;
  queryKey: string | string[];
  successMessage?: string;
}

export function useStatusMutation({
  endpoint,
  queryKey,
  successMessage = 'Statut mis à jour',
}: UseStatusMutationOptions) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`${endpoint}/${id}/status`, { status });
    },
    onSuccess: () => {
      const keys = Array.isArray(queryKey) ? queryKey : [queryKey];
      keys.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: [key] });
      });
      toast.success(successMessage);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return mutation;
}

// ============================================================================
// USE STATS QUERY HOOK
// ============================================================================

export function useStatsQuery<T>(queryKey: string, endpoint: string, enabled = true) {
  return useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const response = await api.get<ApiResponse<T>>(endpoint);
      return response.data.data;
    },
    enabled,
  });
}

// ============================================================================
// USE LIST FILTERS HOOK
// ============================================================================

export interface FilterConfig {
  name: string;
  defaultValue: string;
}

export function useListFilters(filterConfigs: FilterConfig[]) {
  const initialFilters = filterConfigs.reduce(
    (acc, config) => ({ ...acc, [config.name]: config.defaultValue }),
    {} as Record<string, string>
  );

  const [filters, setFilters] = useState(initialFilters);
  const [searchTerm, setSearchTerm] = useState('');

  const updateFilter = useCallback((name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
    setSearchTerm('');
  }, [initialFilters]);

  const hasActiveFilters = useMemo(() => {
    return (
      searchTerm !== '' ||
      Object.entries(filters).some(([key, value]) => {
        const config = filterConfigs.find((c) => c.name === key);
        return config && value !== config.defaultValue;
      })
    );
  }, [filters, searchTerm, filterConfigs]);

  return {
    filters,
    searchTerm,
    setSearchTerm,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  };
}
