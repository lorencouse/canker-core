import { useMemo } from 'react';
import type { Insights, UserDataset } from '@canker/core';
import { computeInsights } from '@canker/core/insights';
import { useDataset, useToday } from './data';

/** Insights are pure functions over the dataset; recompute only when it changes. */
export function useInsights(): {
  insights: Insights | null;
  data: UserDataset | undefined;
  isLoading: boolean;
  error: unknown;
} {
  const q = useDataset();
  const today = useToday();
  const insights = useMemo(
    () => (q.data ? computeInsights(q.data, { today }) : null),
    [q.data, today]
  );
  return { insights, data: q.data, isLoading: q.isLoading, error: q.error };
}
