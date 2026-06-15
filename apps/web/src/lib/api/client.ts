/**
 * SGIP — API Client
 * Ticket: SGIP-1.2.2.3
 *
 * Typed HTTP client built on openapi-fetch.
 * Types are generated from the NestJS OpenAPI spec via:
 *   pnpm --filter @sgip/web run api:generate-types
 *
 * This file is the SINGLE import point for all API calls in the frontend.
 * Never import fetch/axios directly in components — always go through this client.
 *
 * Response shape convention (Document 2 §8.3, AllExceptionsFilter):
 * - Success: the response body directly (typed per endpoint)
 * - Error: { error: { code: string, message: string, fieldErrors?: {...} } }
 */
import createClient from 'openapi-fetch';
import type { paths } from './api.types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

/**
 * Typed API client.
 * Use this in TanStack Query hooks:
 *
 * @example
 * const { data } = useQuery({
 *   queryKey: ['health'],
 *   queryFn: () => apiClient.GET('/health').then(r => r.data),
 * });
 */
export const apiClient = createClient<paths>({
  baseUrl: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Re-export paths type for use in hooks without importing api.types directly.
 */
export type { paths };
