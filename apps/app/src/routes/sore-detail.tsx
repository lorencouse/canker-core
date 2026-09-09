import { createRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {
  daysBetween,
  formatLong,
  formatShort,
  joinSoreLogs,
  LONG_SORE_DAYS,
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
  MouthMapThumb,
  PainDot,
  Textarea
} from '@canker/ui';
import { authedRoute } from '@/router-base';
import {
  useDataset,
  useDeleteSore,
  useSetHealed,
  useToday,
  useUpdateSore
} from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { ErrorState, PageLoading } from '@/components/loading';
import { NotFound } from '@/components/not-found';
import { SoreSparkline } from '@/components/sparkline';
import { CheckInSheet } from '@/components/check-in-sheet';
import { ConfirmButton } from '@/components/confirm-button';

export const soreDetailRoute = createRoute({
  getParentRoute: () => authedRoute,
  path: '/sores/$soreId',
  component: SoreDetailPage
});

function SoreDetailPage() {
  const { soreId } = soreDetailRoute.useParams();
  const today = useToday();
  const navigate = useNavigate();
  const q = useDataset();
  const setHealed = useSetHealed();
  const del = useDeleteSore();
  const update = useUpdateSore();
  const [editDate, setEditDate] = useState<DateKey | null>(null);

  if (q.isLoading && !q.data) return <PageLoading />;
  if (q.error && !q.data)
    return <ErrorState error={q.error} retry={() => void q.refetch()} />;
  const data = q.data!;
  const sore = joinSoreLogs(data.sores, data.soreLogs).find((s) => s.id === soreId);
  if (!sore) return <NotFound />;

  const active = sore.healed_date === null;
  const end = sore.healed_date ?? today;
  const duration = daysBetween(sore.onset_date, end) + 1;
  const peak = sore.logs.reduce((m, l) => Math.max(m, l.pain), 0);
  const maxSize = sore.logs.reduce((m, l) => Math.max(m, l.size_mm), 0);
  const logs = sore.logs.slice().reverse();

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={SURFACE_LABELS[sore.surface]}
        subtitle={`${formatLong(sore.onset_date)} – ${sore.healed_date ? formatLong(sore.healed_date) : 'now'} · ${duration} ${duration === 1 ? 'day' : 'days'}`}
        right={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Back"
            onClick={() =>
              window.history.length > 1
                ? window.history.back()
                : void navigate({ to: '/today', search: {} })
            }
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
      />

      <div className="flex items-center gap-2">
        {active ? <Badge>Active</Badge> : <Badge variant="heal">Healed</Badge>}
        {active && duration > LONG_SORE_DAYS ? (
          <Badge variant="warn">Over two weeks</Badge>
        ) : null}
        {sore.logs.some((l) => l.logged_late) ? (
          <Badge variant="outline">Some entries back-filled</Badge>
        ) : null}
      </div>

      <Card>
        <CardContent className="grid grid-cols-[96px_1fr] items-center gap-4 p-4">
          <MouthMapThumb
            size={96}
            sore={{
              surface: sore.surface,
              x: sore.x,
              y: sore.y,
              pain: peak,
              healed: !active
            }}
          />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground text-xs">Peak pain</dt>
              <dd className="tabular font-display text-lg font-semibold">
                {sore.logs.length ? peak : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Largest</dt>
              <dd className="tabular font-display text-lg font-semibold">
                {sore.logs.length ? `${maxSize} mm` : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Check-ins</dt>
              <dd className="tabular font-display text-lg font-semibold">
                {sore.logs.length}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Status</dt>
              <dd className="font-medium">
                {active ? `Day ${duration}` : `Healed in ${duration}d`}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Over time</CardTitle>
        </CardHeader>
        <CardContent>
          <SoreSparkline logs={sore.logs} />
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {active ? (
          <>
            <Button onClick={() => setEditDate(today)}>Log today</Button>
            <ConfirmButton
              variant="heal"
              confirmLabel="Tap again to confirm"
              onConfirm={() => setHealed.mutate({ soreId: sore.id, healedDate: today })}
            >
              Mark healed
            </ConfirmButton>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={() => setHealed.mutate({ soreId: sore.id, healedDate: null })}
          >
            Reopen
          </Button>
        )}
        <ConfirmButton
          variant="ghost"
          className="text-destructive ml-auto"
          confirmLabel="Delete for good?"
          onConfirm={() => {
            del.mutate(sore.id);
            void navigate({ to: '/history', search: {} });
          }}
        >
          Delete
        </ConfirmButton>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={2}
            defaultValue={sore.notes ?? ''}
            placeholder="What might have started it, what helped"
            onBlur={(e) => {
              const v = e.target.value.trim() || null;
              if (v !== sore.notes)
                update.mutate({ soreId: sore.id, input: { notes: v } });
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Check-ins</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="text-muted-foreground px-4 pb-4 text-sm">No check-ins yet.</p>
          ) : (
            <ul className="divide-border divide-y">
              {logs.map((l) => (
                <li key={l.id}>
                  <button
                    type="button"
                    onClick={() => setEditDate(l.log_date)}
                    className="hover:bg-muted flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm"
                  >
                    <PainDot pain={l.pain} size="sm" />
                    <span className="text-secondary-foreground w-16 shrink-0">
                      {formatShort(l.log_date)}
                    </span>
                    <span className="tabular w-16">{l.size_mm} mm</span>
                    <span className="tabular">pain {l.pain}</span>
                    {l.notes ? (
                      <span className="text-muted-foreground ml-auto truncate text-xs">
                        {l.notes}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {editDate ? (
        <CheckInSheet
          sore={sore}
          date={editDate}
          open
          onClose={() => setEditDate(null)}
        />
      ) : null}
    </div>
  );
}
