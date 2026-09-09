import { createRoute, Link, useNavigate } from '@tanstack/react-router';
import { CheckCircle2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { addDays, formatWeekday, isDateKey, type DateKey } from '@canker/core';
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState } from '@canker/ui';
import { authedRoute } from '@/router-base';
import { useDataset, useToday } from '@/lib/data';
import { useInsights } from '@/lib/insights';
import { activeSoresOn, checkInComplete, currentFlareDay } from '@/lib/derive';
import { PageHeader } from '@/components/page-header';
import { ErrorState, PageLoading } from '@/components/loading';
import { SoreCard } from '@/components/sore-card';
import { FactorChips } from '@/components/factor-chips';
import { DayContext } from '@/components/day-context';
import { AlertList } from '@/components/alert-list';

export const todayRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/today',
  validateSearch: (s: Record<string, unknown>): { date?: DateKey } => ({
    date: isDateKey(s.date) ? s.date : undefined
  }),
  component: TodayPage
});

function TodayPage() {
  const today = useToday();
  const { date: param } = todayRoute.useSearch();
  const date = param && param <= today ? param : today;
  const isToday = date === today;
  const navigate = useNavigate();
  const q = useDataset();
  const { insights } = useInsights();

  // A paused offline query is neither loading nor errored, so key the skeleton
  // off the absence of data instead; `q.data!` would be a crash there.
  if (q.error && !q.data)
    return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  if (!q.data) return <PageLoading />;
  const data = q.data;

  const active = activeSoresOn(data, date);
  const done = checkInComplete(data, date);
  const flareDay = isToday ? currentFlareDay(data, today) : null;
  const alerts = (insights?.alerts ?? []).filter((a) => a.kind !== 'no_log_today');

  const go = (d: DateKey) =>
    void navigate({ to: '/today', search: d === today ? {} : { date: d } });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={isToday ? 'Today' : formatWeekday(date)}
        subtitle={
          active.length === 0
            ? 'No active sores'
            : `${active.length} active ${active.length === 1 ? 'sore' : 'sores'}${flareDay ? ` · flare-up day ${flareDay}` : ''}`
        }
        right={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Previous day"
              onClick={() => go(addDays(date, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Next day"
              disabled={isToday}
              onClick={() => go(addDays(date, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {!isToday ? (
        <p className="text-muted-foreground -mt-3 text-xs">
          You're back-filling a past day.{' '}
          <Link
            to="/today"
            search={{}}
            className="text-accent underline-offset-2 hover:underline"
          >
            Back to today
          </Link>
        </p>
      ) : null}

      {isToday ? <AlertList alerts={alerts} /> : null}

      {done ? (
        <div className="bg-heal-soft text-heal flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium">
          <CheckCircle2 className="h-4 w-4" aria-hidden /> Check-in done for{' '}
          {isToday ? 'today' : 'this day'}
        </div>
      ) : null}

      <section aria-label="Sores" className="flex flex-col gap-3">
        {active.length === 0 ? (
          <EmptyState
            title={isToday ? 'Mouth clear' : 'No sores on this day'}
            body="Log your day anyway. Clear days are what your triggers get compared against."
            action={
              <Button asChild>
                <Link to="/sores/new" search={{ date: isToday ? undefined : date }}>
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden /> I have a new sore
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            {active.map((s) => (
              <SoreCard key={s.id} sore={s} date={date} />
            ))}
            <Button asChild variant="outline" className="md:hidden">
              <Link to="/sores/new" search={{ date: isToday ? undefined : date }}>
                <Plus className="mr-1.5 h-4 w-4" aria-hidden /> Add another sore
              </Link>
            </Button>
          </>
        )}
      </section>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How was the day</CardTitle>
        </CardHeader>
        <CardContent>
          <DayContext data={data} date={date} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Factors</CardTitle>
          <p className="text-muted-foreground text-xs">
            Tap everything that applied. Foods, medications, treatments, anything.
          </p>
        </CardHeader>
        <CardContent>
          <FactorChips data={data} date={date} />
        </CardContent>
      </Card>
    </div>
  );
}
