/**
 * SGIP — useHealth Hook
 * Ticket: SGIP-1.2.2.3
 *
 * Demonstrates the typed API client + TanStack Query integration.
 * This is the reference implementation for all future data-fetching hooks.
 *
 * Four mandatory states (Document 4 §12, ADR-018):
 * 1. Loading → useQuery.isLoading
 * 2. Error → useQuery.isError
 * 3. Empty → not applicable for health (always has data if no error)
 * 4. Populated → useQuery.data
 *
 * Usage:
 * const { health, isLoading, isError } = useHealth();
 */
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { HealthCheckResponse } from '@/lib/api/api.types';

export const healthQueryKey = ['health'] as const;

export function useHealth() {
  const query = useQuery<HealthCheckResponse, Error>({
    queryKey: healthQueryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/health');
      if (error) {
        throw new Error('Health check failed');
      }
      if (!data) {
        throw new Error('Empty response from health endpoint');
      }
      return data;
    },
    // Health check refreshes every 60 seconds
    staleTime: 60 * 1000,
    // Refetch every 60s while the window is focused
    refetchInterval: 60 * 1000,
  });

  return {
    health: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    // Convenience helpers
    isHealthy: query.data?.status === 'ok',
    isDegraded: query.data?.status === 'degraded',
    isDown: query.data?.status === 'down',
  };
}
