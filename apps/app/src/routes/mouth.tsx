import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { useMemo, useState } from 'react';
import {
  addDays,
  daysBetween,
  formatLong,
  isDateKey,
  minDateKey,
  SURFACE_LABELS,
  type DateKey
} from '@canker/core';
import {
  Badge,
  Button,
  Card,
  CardContent,
  MouthHeatmap,
  MouthMap,
  PainDot
} from '@canker/ui';
import { authedRoute } from '@/router-base';
import { useDataset, useToday } from '@/lib/data';
import { healedBy, painOn, soreDay, soresOn } from '@/lib/derive';
import { PageHeader } from '@/components/page-header';
import { ErrorState, PageLoading } from '@/components/loading';

export const mouthRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/mouth',
  validateSearch: (
    s: Record<string, unknown>
  ): { date?: DateKey; view?: 'map' | 'heat' } => ({
    date: isDateKey(s.date) ? s.date : undefined,
    view: s.view === 'heat' ? 'heat' : undefined
  }),
  component: MouthPage
});

/** The map as a timeline: scrub to any day and see the mouth as it was. */
function MouthPage() {
  const today = useToday();
  const { date: param, view } = mouthRoute.useSearch();
  const date = param && param <= today ? param : today;
  const navigate = useNavigate();
  const q = useDataset();
  const [selected, setSelected] = useState<string | null>(null);

  const data = q.data;
  const first = useMemo(
    () => (data ? (minDateKey(data.sores.map((s) => s.onset_date)) ?? today) : today),
    [data, today]
  );
  const span = Math.max(1, daysBetween(first, today));

  if (q.error && !data)
    return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  if (!data) return <PageLoading />;

  const onDate = soresOn(data, date);
  const pins = onDate.map((s) => ({
    id: s.id,
    surface: s.surface,
    x: s.x,
    y: s.y,
    pain: painOn(s.logs, date),
    healed: healedBy(s, date)
  }));
  const allPins = data.sores.map((s) => {
    const logs = data.soreLogs.filter((l) => l.sore_id === s.id);
    return {
      id: s.id,
      surface: s.surface,
      x: s.x,
      y: s.y,
      pain: logs.reduce((m, l) => Math.max(m, l.pain), 0),
      healed: s.healed_date !== null
    };
  });
  const sel = onDate.find((s) => s.id === selected);
  const setSearch = (next: { date?: DateKey; view?: 'map' | 'heat' }) =>
    void navigate({
      to: '/mouth',
      search: { date: next.date === today ? undefined : next.date, view: next.view }
    });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Mouth"
        subtitle={
          view === 'heat'
            ? `Every sore you've logged · ${data.sores.length} total`
            : date === today
              ? 'As of today'
              : `As of ${formatLong(date)}`
        }
        right={
          <div className="bg-muted flex rounded-lg p-1 text-sm">
            <button
              type="button"
              aria-pressed={view !== 'heat'}
              onClick={() => setSearch({ date })}
              className={`rounded-md px-3 py-1 font-medium ${view !== 'heat' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
            >
              Map
            </button>
            <button
              type="button"
              aria-pressed={view === 'heat'}
              onClick={() => setSearch({ date, view: 'heat' })}
              className={`rounded-md px-3 py-1 font-medium ${view === 'heat' ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}
            >
              Heat map
            </button>
          </div>
        }
      />

      {view === 'heat' ? (
        <MouthHeatmap
          sores={allPins}
          className="border-border bg-card mx-auto w-full max-w-md rounded-xl border"
        />
      ) : (
        <MouthMap
          className="border-border bg-card mx-auto w-full max-w-md rounded-xl border"
          mode="view"
          sores={pins}
          selectedSoreId={selected}
          onSelectSore={(id) => setSelected(id === selected ? null : id)}
        />
      )}

      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <PainDot pain={1} size="sm" /> low pain
        </span>
        <span className="flex items-center gap-1.5">
          <PainDot pain={9} size="sm" /> high pain
        </span>
        <span className="flex items-center gap-1.5">
          <PainDot pain={0} healed size="sm" /> healed
        </span>
      </div>

      {view !== 'heat' ? (
        <Card>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>{formatLong(first)}</span>
              <span className="text-foreground font-medium">{formatLong(date)}</span>
              <span>Today</span>
            </div>
            <input
              type="range"
              aria-label="Date"
              min={0}
              max={span}
              value={daysBetween(first, date)}
              onChange={(e) =>
                setSearch({ date: addDays(first, Number(e.target.value)) })
              }
              className="w-full accent-[var(--accent)]"
            />
            <div className="flex justify-between">
              <Button
                variant="ghost"
                size="sm"
                disabled={date <= first}
                onClick={() => setSearch({ date: addDays(date, -1) })}
              >
                Previous day
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={date >= today}
                onClick={() => setSearch({ date: addDays(date, 1) })}
              >
                Next day
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {sel ? (
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <PainDot pain={painOn(sel.logs, date) ?? 0} healed={healedBy(sel, date)} />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{SURFACE_LABELS[sel.surface]}</p>
              <p className="text-muted-foreground text-xs">
                Day {soreDay(sel, date)} on this date · started{' '}
                {formatLong(sel.onset_date)}
              </p>
            </div>
            {healedBy(sel, date) ? (
              <Badge variant="heal">Healed</Badge>
            ) : (
              <Badge>Active</Badge>
            )}
            <Button asChild size="sm" variant="outline">
              <Link to="/sores/$soreId" params={{ soreId: sel.id }}>
                Open
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : onDate.length === 0 && view !== 'heat' ? (
        <p className="text-muted-foreground text-center text-sm">No sores on this day.</p>
      ) : null}
    </div>
  );
}
