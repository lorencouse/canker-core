import { createRoute, Link } from '@tanstack/react-router';
import {
  daysBetween,
  formatShort,
  SURFACE_SHORT_LABELS,
  type Insights
} from '@canker/core';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  StatTile
} from '@canker/ui';
import { authedRoute } from '@/router-base';
import { useInsights } from '@/lib/insights';
import { useToday } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { ErrorState, PageLoading } from '@/components/loading';
import { AlertList } from '@/components/alert-list';

export const insightsRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/insights',
  component: InsightsPage
});

function fmt(n: number | null, suffix = ''): string {
  return n === null ? '—' : `${n}${suffix}`;
}

function InsightsPage() {
  const { insights, isLoading, error } = useInsights();
  const today = useToday();

  if (isLoading && !insights) return <PageLoading />;
  if (error && !insights) return <ErrorState error={error} />;
  const ins = insights!;
  const s = ins.summary;

  if (s.total_sores === 0) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Insights" />
        <EmptyState
          title="Nothing to analyse yet"
          body="Once you've logged a sore or two, this is where durations, gaps between flare-ups and possible triggers show up."
          action={
            <Button asChild>
              <Link to="/sores/new" search={{}}>
                Log a sore
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Insights"
        subtitle={`Based on ${s.days_tracked} ${s.days_tracked === 1 ? 'day' : 'days'} and ${s.total_sores} ${s.total_sores === 1 ? 'sore' : 'sores'}`}
      />

      <AlertList alerts={ins.alerts.filter((a) => a.kind !== 'no_log_today')} />

      <div className="grid grid-cols-2 gap-3">
        <StatTile
          value={fmt(s.mean_duration_days, ' d')}
          label="avg sore duration"
          hint={s.healed_sores ? `${s.healed_sores} healed` : 'needs a healed sore'}
        />
        <StatTile
          value={fmt(s.mean_gap_days, ' d')}
          label="between flare-ups"
          hint={
            ins.flare_ups.length >= 2
              ? `${ins.flare_ups.length} flare-ups`
              : 'needs 2 flare-ups'
          }
        />
        <StatTile value={fmt(s.mean_peak_pain)} label="avg peak pain" />
        <StatTile
          value={
            s.most_common_surface ? SURFACE_SHORT_LABELS[s.most_common_surface] : '—'
          }
          label="most common site"
          hint={
            s.most_common_surface
              ? `${s.most_common_surface_count} of ${s.total_sores}`
              : undefined
          }
        />
      </div>

      <TriggersCard ins={ins} />
      <TreatmentsCard ins={ins} />

      {ins.rhythm.flare_starts.length >= 2 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rhythm</CardTitle>
            <p className="text-muted-foreground text-xs">
              Each mark is the start of a flare-up. Typical gap{' '}
              {fmt(ins.rhythm.median_gap_days, ' days')}.
            </p>
          </CardHeader>
          <CardContent>
            <RhythmStrip starts={ins.rhythm.flare_starts} today={today} />
          </CardContent>
        </Card>
      ) : null}

      <p className="text-muted-foreground text-xs leading-relaxed">
        These are patterns in your own records, not medical findings. A factor that shows
        up before your sores may be a cause, a coincidence, or something that travels with
        the real cause. Bring the list to a dentist or doctor if you want a professional
        read.
      </p>
    </div>
  );
}

function TriggersCard({ ins }: { ins: Insights }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Possible triggers</CardTitle>
        <p className="text-muted-foreground text-xs">
          Logged in the 1–3 days before a new sore, compared with your other days.
        </p>
      </CardHeader>
      <CardContent>
        {!ins.triggers_ready ? (
          <p className="text-secondary-foreground text-sm">
            Log {ins.onsets_until_triggers} more{' '}
            {ins.onsets_until_triggers === 1 ? 'sore' : 'sores'} and this section will
            start ranking your factors. Keep tapping factors on clear days too; that is
            the baseline.
          </p>
        ) : ins.triggers.length === 0 ? (
          <p className="text-secondary-foreground text-sm">
            No factor has appeared before at least 3 of your sores yet. Keep logging.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {ins.triggers.map((t) => (
              <li
                key={t.factor_id}
                className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm"
              >
                <span className="font-medium">{t.name}</span>
                <span className="tabular font-display text-right font-semibold">
                  {t.lift === Infinity ? 'only before sores' : `×${t.lift}`}
                </span>
                <div className="bg-muted col-span-2 h-1.5 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full ${t.lift >= 1.5 ? 'bg-accent' : 'bg-muted-foreground/50'}`}
                    style={{ width: `${Math.round(t.window_rate * 100)}%` }}
                  />
                </div>
                <span className="text-muted-foreground col-span-2 text-xs">
                  Before {t.window_hits} of {t.onsets} sores · on{' '}
                  {Math.round(t.baseline_rate * 100)}% of other days
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TreatmentsCard({ ins }: { ins: Insights }) {
  const groups = ins.treatments;
  if (groups.length === 0) return null;
  const max = Math.max(...groups.map((g) => g.median_days_to_heal), 1);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Treatments</CardTitle>
        <p className="text-muted-foreground text-xs">
          Typical days to heal for sores where you logged each treatment.
        </p>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-2.5">
          {groups.map((g) => (
            <li
              key={g.factor_id}
              className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 text-sm"
            >
              <span className="font-medium">{g.name}</span>
              <span className="tabular font-display text-right font-semibold">
                {g.median_days_to_heal} d
              </span>
              <div className="bg-muted col-span-2 h-1.5 overflow-hidden rounded-full">
                <div
                  className={`h-full rounded-full ${g.factor_id === 'none' ? 'bg-muted-foreground/50' : 'bg-heal'}`}
                  style={{ width: `${Math.round((g.median_days_to_heal / max) * 100)}%` }}
                />
              </div>
              <span className="text-muted-foreground col-span-2 text-xs">
                {g.sores} {g.sores === 1 ? 'sore' : 'sores'}
                {g.median_peak_pain !== null
                  ? ` · median peak pain ${g.median_peak_pain}`
                  : ''}
              </span>
            </li>
          ))}
        </ul>
        {groups.length === 1 ? (
          <p className="text-muted-foreground mt-3 text-xs">
            A treatment appears here once you've used it on 3 healed sores.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RhythmStrip({ starts, today }: { starts: string[]; today: string }) {
  const first = starts[0]!;
  const span = Math.max(1, daysBetween(first, today));
  return (
    <div>
      <div className="relative h-8">
        <div className="bg-border absolute inset-x-0 top-1/2 h-px" />
        {starts.map((d) => (
          <span
            key={d}
            title={formatShort(d)}
            className="bg-accent ring-card absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2"
            style={{ left: `${(daysBetween(first, d) / span) * 100}%` }}
          />
        ))}
      </div>
      <div className="text-muted-foreground flex justify-between text-[10px]">
        <span>{formatShort(first)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
