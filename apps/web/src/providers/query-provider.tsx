/**
 * SGIP — TanStack Query Provider
 * Ticket: SGIP-1.2.2.3
 *
 * Wraps the app with QueryClientProvider. Must be a Client Component because
 * React Query requires browser APIs.
 *
 * Configuration (Document 2 §8.2):
 * - staleTime: 30s — avoid over-fetching on navigation
 * - gcTime: 5m — keep data in memory during brief navigation away
 * - retry: 3 — for transient network errors
 * - No optimistic updates on ReadinessSnapshot (ADR-019)
 *
 * QueryClient is created ONCE per session in module scope.
 * DevTools are included only in development.
 */
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode, useState } from 'react';

// Default query options aligned with SGIP's data access patterns (Document 2 §8.2)
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 30 seconds before data is considered stale
        staleTime: 30 * 1000,
        // 5 minutes garbage collection window
        gcTime: 5 * 60 * 1000,
        // 3 retries with exponential backoff (matches API BullMQ job defaults)
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch on window focus (keeps score fresh on tab return)
        refetchOnWindowFocus: true,
        // No background refetch when offline
        refetchOnReconnect: true,
      },
      mutations: {
        // Mutations use 1 retry — idempotent operations only
        retry: 1,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  // useState ensures each request gets its own QueryClient in SSR,
  // while the client reuses the same instance across renders.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools panel — only renders in development builds */}
      <ReactQueryDevtools initialIsOpen={false} position="bottom" />
    </QueryClientProvider>
  );
}
