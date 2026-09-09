import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  painAnchor,
  SURFACE_LABELS,
  type DateKey,
  type SoreWithLogs
} from '@canker/core';
import { Badge, Button, Card, CardContent, PainDot } from '@canker/ui';
import { useSetHealed, useToday, useUpsertSoreLog } from '@/lib/data';
import { logOn, previousLog, soreDay } from '@/lib/derive';
import { CheckInSheet } from './check-in-sheet';
import { ConfirmButton } from './confirm-button';

export function SoreCard({ sore, date }: { sore: SoreWithLogs; date: DateKey }) {
  const today = useToday();
  const upsert = useUpsertSoreLog();
  const setHealed = useSetHealed();
  const [open, setOpen] = useState(false);

  const todays = logOn(sore.logs, date);
  const prev = previousLog(sore.logs, date);
  const shown = todays ?? prev;
  const day = soreDay(sore, date);
  const isLong = day > 14;

  function sameAsBefore() {
    if (!prev) return;
    upsert.mutate({
      sore_id: sore.id,
      log_date: date,
      size_mm: prev.size_mm,
      pain: prev.pain,
      logged_late: date !== today
    });
  }

  return (
    <Card className={todays ? '' : 'border-accent/40'}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link
            to="/sores/$soreId"
            params={{ soreId: sore.id }}
            className="group flex min-w-0 items-center gap-2.5"
          >
            <PainDot pain={shown?.pain ?? 0} />
            <div className="min-w-0">
              <p className="truncate font-semibold group-hover:underline">
                {SURFACE_LABELS[sore.surface]}
              </p>
              <p className="text-muted-foreground text-xs">
                Day {day}
                {isLong ? ' · over two weeks' : ''}
              </p>
            </div>
            <ChevronRight className="text-muted-foreground h-4 w-4" aria-hidden />
          </Link>
          {todays ? (
            <Badge variant="heal">Logged</Badge>
          ) : (
            <Badge variant="outline">Not logged</Badge>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="press bg-muted hover:bg-muted/70 grid grid-cols-2 gap-3 rounded-lg px-3 py-2.5 text-left"
          aria-label="Edit today's size and pain"
        >
          <div>
            <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
              Size
            </p>
            <p className="tabular font-display text-lg font-semibold">
              {shown ? `${shown.size_mm} mm` : '—'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[11px] uppercase tracking-wide">
              Pain
            </p>
            <p className="tabular font-display text-lg font-semibold">
              {shown ? shown.pain : '—'}
              {shown ? (
                <span className="text-muted-foreground ml-1.5 text-xs font-normal">
                  {painAnchor(shown.pain)}
                </span>
              ) : null}
            </p>
          </div>
        </button>

        <div className="flex gap-2">
          {!todays && prev ? (
            <Button variant="outline" className="flex-1" onClick={sameAsBefore}>
              Same as {date === today ? 'yesterday' : 'before'}
            </Button>
          ) : (
            <Button variant="outline" className="flex-1" onClick={() => setOpen(true)}>
              {todays ? 'Edit' : 'Log check-in'}
            </Button>
          )}
          <ConfirmButton
            variant="heal"
            className="flex-1"
            confirmLabel="Tap again to confirm"
            onConfirm={() => setHealed.mutate({ soreId: sore.id, healedDate: date })}
          >
            Healed
          </ConfirmButton>
        </div>
      </CardContent>
      <CheckInSheet sore={sore} date={date} open={open} onClose={() => setOpen(false)} />
    </Card>
  );
}
