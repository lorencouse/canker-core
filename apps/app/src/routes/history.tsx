import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import {
  addDays,
  daysBetween,
  formatShort,
  isDateKey,
  joinSoreLogs,
  LONG_SORE_DAYS,
  minDateKey,
  SURFACE_LABELS,
  type DateKey
} from '@canker/core';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  PainDot
} from '@canker/ui';
import { authedRoute } from '@/router-base';
import { useDataset, useToday } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { ErrorState, PageLoading } from '@/components/loading';
import { FlareTimeline } from '@/components/flare-timeline';

type Range = '3m' | '6m' | '1y' | 'all';
const RANGES: { id: Range; label: string; days: number | null }[] = [
  { id: '3m', label: '3 months', days: 91 },
  { id: '6m', label: '6 months', days: 182 },
  { id: '1y', label: '1 year', days: 365 },
  { id: 'all', label: 'All', days: null }
];

export const historyRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/history',
  validateSearch: (s: Record<string, unknown>): { range?: Range } => ({
    range: s.range === '3m' || s.range === '1y' || s.range === 'all' ? s.range : undefined
  }),
  component: HistoryPage
});

function HistoryPage() {
  const today = useToday();
  const { range: param } = historyRoute.useSearch();
  const range = param ?? '6m';
  const navigate = useNavigate();
  const q = useDataset();
  const [backfill, setBackfill] = useState<DateKey>(addDays(today, -1));

  if (q.isLoading && !q.data) return <PageLoading />;
  if (q.error && !q.data)
    return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const data = q.data!;

  const sores = joinSoreLogs(data.sores, data.soreLogs).sort((a, b) =>
    a.onset_date > b.onset_date ? -1 : 1
  );
  const firstEver =
    minDateKey(data.sores.map((s) => s.onset_date)) ?? addDays(today, -30);
  const days = RANGES.find((r) => r.id === range)?.days;
  const start = days ? addDays(today, -days) : firstEver;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="History"
        subtitle={`${sores.length} ${sores.length === 1 ? 'sore' : 'sores'} logged`}
      />

      {sores.length === 0 ? (
        <EmptyState
          title="No history yet"
          body="Every sore you log builds the timeline here."
          action={
            <Button asChild>
              <Link to="/sores/new" search={{}}>
                Log a sore
              </Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Timeline</CardTitle>
              <div className="bg-muted flex rounded-lg p-0.5 text-xs">
                {RANGES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={range === r.id}
                    onClick={() =>
                      void navigate({
                        to: '/history',
                        search: r.id === '6m' ? {} : { range: r.id }
                      })
                    }
                    className={`rounded-md px-2 py-1 font-medium ${range === r.id ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <FlareTimeline sores={sores} start={start} end={today} />
            </CardContent>
          </Card>

          <ul className="flex flex-col gap-2">
            {sores.map((s) => {
              const end = s.healed_date ?? today;
              const dur = daysBetween(s.onset_date, end) + 1;
              const peak = s.logs.reduce((m, l) => Math.max(m, l.pain), 0);
              const active = s.healed_date === null;
              return (
                <li key={s.id}>
                  <Link
                    to="/sores/$soreId"
                    params={{ soreId: s.id }}
                    className="border-border bg-card hover:bg-muted flex items-center gap-3 rounded-lg border px-4 py-3"
                  >
                    <PainDot pain={peak} healed={!active} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{SURFACE_LABELS[s.surface]}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatShort(s.onset_date)} – {active ? 'now' : formatShort(end)}{' '}
                        · {dur} {dur === 1 ? 'day' : 'days'}
                        {s.logs.length ? ` · peak pain ${peak}` : ''}
                      </p>
                    </div>
                    {active ? <Badge>Active</Badge> : null}
                    {dur > LONG_SORE_DAYS ? <Badge variant="warn">Long</Badge> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Log a past day</CardTitle>
          <p className="text-muted-foreground text-xs">
            Forgot a check-in? Pick the day and fill it in. Late entries are marked as
            such.
          </p>
        </CardHeader>
        <CardContent className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="backfill">Day</Label>
            <Input
              id="backfill"
              type="date"
              max={addDays(today, -1)}
              value={backfill}
              onChange={(e) => isDateKey(e.target.value) && setBackfill(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => void navigate({ to: '/today', search: { date: backfill } })}
          >
            Open day
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
