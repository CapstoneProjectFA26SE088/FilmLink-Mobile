import { QueryClient } from '@tanstack/react-query';
import { isNetworkError, normalizeProblemDetail } from '@/shared/lib';

export const MAX_QUERY_RETRIES = 2;
export const DEFAULT_STALE_TIME_MS = 30_000;
export const DEFAULT_GC_TIME_MS = 5 * 60 * 1000;
export const NON_RETRYABLE_STATUSES: ReadonlySet<number> = new Set([
  400, 401, 403, 404, 409, 413, 422, 429,
]);

export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= MAX_QUERY_RETRIES) {
    return false;
  }
  if (isNetworkError(error)) {
    return true;
  }
  return !NON_RETRYABLE_STATUSES.has(normalizeProblemDetail(error).status);
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetryQuery,
        staleTime: DEFAULT_STALE_TIME_MS,
        gcTime: DEFAULT_GC_TIME_MS,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: { retry: 0 },
    },
  });
}
