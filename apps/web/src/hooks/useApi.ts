import { useState, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';

/**
 * Simple API hook for making API calls
 * Returns an object with get, post, patch, put, delete methods
 */
export function useApi() {
  return useMemo(() => ({
    get: async <T = any>(url: string): Promise<T> => {
      const response = await api.get(url);
      return response.data;
    },
    post: async <T = any>(url: string, data?: any): Promise<T> => {
      const response = await api.post(url, data);
      return response.data;
    },
    patch: async <T = any>(url: string, data?: any): Promise<T> => {
      const response = await api.patch(url, data);
      return response.data;
    },
    put: async <T = any>(url: string, data?: any): Promise<T> => {
      const response = await api.put(url, data);
      return response.data;
    },
    delete: async <T = any>(url: string): Promise<T> => {
      const response = await api.delete(url);
      return response.data;
    },
  }), []);
}

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseApiOptions {
  page?: number;
  limit?: number;
  filters?: Record<string, unknown>;
}

interface UseApiResult<T> {
  data: T[] | null;
  isLoading: boolean;
  error: Error | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
  refetch: () => void;
}

export function usePaginatedApi<T>(
  fetcher: (options: UseApiOptions) => Promise<PaginatedResponse<T>>,
  initialOptions: UseApiOptions = {}
): UseApiResult<T> {
  const [data, setData] = useState<T[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<UseApiResult<T>['pagination']>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await fetcher(initialOptions);
      setData(result.data);
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, initialOptions]);

  return {
    data,
    isLoading,
    error,
    pagination,
    refetch: fetch,
  };
}

export default usePaginatedApi;
