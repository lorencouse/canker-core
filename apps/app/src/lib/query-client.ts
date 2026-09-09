import { QueryClient } from '@tanstack/react-query';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

/**
 * Check-ins happen in bathrooms with one bar of signal. Queries are cached to
 * localStorage so the app opens instantly with yesterday's data, and
 * mutations run offline-first: they apply optimistically and retry when the
 * connection returns.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 1000 * 60 * 60 * 24 * 7,
      networkMode: 'offlineFirst',
      retry: 2,
      refetchOnWindowFocus: true
    },
    mutations: {
      networkMode: 'offlineFirst',
      retry: 3
    }
  }
});

export const persister = createSyncStoragePersister({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'canker.query-cache',
  throttleTime: 1000
});

/** Bump when the shape of cached data changes so stale caches are dropped. */
export const CACHE_BUSTER = 'v2.0';
