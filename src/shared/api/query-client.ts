import { QueryClient } from '@tanstack/react-query';
import { isNetworkError, normalizeProblemDetail } from '@/shared/lib';
import { filmLinkQueryKeys } from './query-keys';

export const PRIVATE_QUERY_ROOTS = [
  filmLinkQueryKeys.accounts.all,
  filmLinkQueryKeys.orders.all,
  filmLinkQueryKeys.archive.all,
  filmLinkQueryKeys.chatbot.all,
  filmLinkQueryKeys.negativePreview.all,
] as const;

export function purgePrivateQueryCache(queryClient: QueryClient | undefined): void {
  if (!queryClient) {
    return;
  }
  for (const queryKey of PRIVATE_QUERY_ROOTS) {
    queryClient.removeQueries({ queryKey });
  }
}

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
