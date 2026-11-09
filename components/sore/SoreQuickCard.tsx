'use client';

import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';

import CourseBars from '@/components/sore/CourseBars';
import Measure from '@/components/sore/Measure';
import { PainField, WidthField } from '@/components/sore/ReadingFields';
import SoreSigil from '@/components/sore/SoreSigil';
import { useHealSore } from '@/components/sore/useHealSore';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/Toasts/use-toast';
import type { Sore } from '@/types';
import { verdictOf } from '@/utils/course';
import { upsertSores } from '@/utils/actions/soreActions';
import { notify, tap } from '@/utils/native';
import {
  currentPain,
  currentSize,
  dayNumberOf,
  hasReadingOn,
  lastWasYesterday,
  latestReading,
  withReading
} from '@/utils/readings';
import { localTimeZone } from '@/utils/days';
import { runWrite, showFailure } from '@/utils/write-feedback';
import { BusyIcon } from '@/components/ui/busy-icon';

/**
 * A sore at a glance, opened by tapping it on the map or in a chart: its
 * day, today's (or the last) reading and its fortnight, with the two things
 * a person most often wants to do next — log today, or close it — one tap
 * away. The full course stays on the map's detail panel; this is the quick
 * look and the quick edit.
 *
 * Writes are its own: Save upserts this one sore and Healed sets it closed,
 * each reporting the result back through `onChange` so whichever screen
 * opened it can update without a reload.
 */
export default function SoreQuickCard({
  sore,
  open,
  onOpenChange,
  onChange,
  footer
}: {
  sore: Sore | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The sore as written, after a save, healed or reopen. */
  onChange: (next: Sore) => void;
  /** An extra link under the actions, e.g. "Show on map". */
  footer?: React.ReactNode;
}) {
  // The reading being edited, or null when the card is just showing.
  const [draft, setDraft] = useState<Sore | null>(null);
  const [saving, setBusy] = useState(false);
  const heal = useHealSore(onChange);
  const busy = saving || heal.busy;

  // A different sore, or the card closing, drops any half-made edit.
  const [shownId, setShownId] = useState<string | null>(null);
  const currentId = open ? (sore?.id ?? null) : null;
  if (currentId !== shownId) {
    setShownId(currentId);
    setDraft(null);
  }

  if (!sore) return null;

  const now = new Date();
  const shown = draft ?? sore;
  const today = hasReadingOn(sore, now);
  const last = latestReading(sore);
  const verdict = verdictOf(sore, now);

  const save = async (next: Sore) => {
    setBusy(true);
    try {
      const result = await runWrite(() =>
        upsertSores([next], localTimeZone())
      );
      if (!result.ok) return showFailure(result.error);
      notify('success');
      onChange(next);
      setDraft(null);
      toast({ title: 'Saved today’s reading.' });
    } finally {
      setBusy(false);
    }
  };

  const setHealed = async (healedAt: string | null) => {
    if ((await heal.setHealed(sore, healedAt)) && healedAt) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm gap-0 overflow-y-auto rounded-xl p-4 sm:p-5">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 pr-8">
          <SoreSigil sore={sore} size={36} />
          <div className="min-w-0">
            <DialogTitle className="truncate text-subhead">
              {sore.zone}
            </DialogTitle>
            <p className="tabular text-sm text-muted-foreground">
              {sore.healed_at
                ? 'Healed'
                : `Day ${dayNumberOf(sore, now)} · ${today ? 'logged today' : 'not logged today'}`}
            </p>
          </div>
        </div>

        <DialogDescription className="mt-3 text-base text-foreground">
          <b className="font-semibold">{verdict.word}</b> {verdict.detail}
        </DialogDescription>

        {!draft && (
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-sm text-muted-foreground">
                {today ? 'Width today' : 'Last width'}
              </dt>
              <dd className="tabular font-display text-xl font-semibold">
                <Measure value={currentSize(sore)} unit="mm" />
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                {today ? 'Pain today' : 'Last pain'}
              </dt>
              <dd className="tabular font-display text-xl font-semibold">
                <Measure value={currentPain(sore)} unit="of 10" />
              </dd>
            </div>
          </dl>
        )}

        <CourseBars sore={shown} height={48} now={now} className="mt-3" />

        {draft ? (
          <div className="mt-4 grid gap-4">
            <WidthField
              id={`quick-size-${sore.id}`}
              value={currentSize(draft)}
              onChange={(mm) => setDraft(withReading(draft, { size: mm }))}
            />
            <PainField
              id={`quick-pain-${sore.id}`}
              value={currentPain(draft)}
              onChange={(pain) => setDraft(withReading(draft, { pain }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="touch"
                onClick={() => setDraft(null)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="touch"
                onClick={() => {
                  tap();
                  save(draft);
                }}
                disabled={busy}
              >
                <BusyIcon busy={busy}><Check aria-hidden="true" /></BusyIcon>
                Save
              </Button>
            </div>
          </div>
        ) : sore.healed_at ? (
          <Button
            type="button"
            variant="outline"
            size="touch"
            className="mt-4 w-full"
            onClick={() => setHealed(null)}
            disabled={busy}
          >
            <RotateCcw aria-hidden="true" />
            Reopen
          </Button>
        ) : (
          <div className="mt-4 grid gap-2">
            {/* The commonest update is "no change", so it gets one tap. */}
            {!today && last && (
              <Button
                type="button"
                size="touch"
                className="w-full"
                onClick={() => {
                  tap();
                  save(withReading(sore, {}));
                }}
                disabled={busy}
              >
                <Check aria-hidden="true" />
                {lastWasYesterday(sore, now) ? 'Same as yesterday' : 'Same as last time'}
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="touch"
                onClick={() => {
                  tap();
                  setDraft(withReading(sore, {}));
                }}
                disabled={busy}
              >
                {today ? 'Change' : 'Update'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="touch"
                onClick={() => setHealed(now.toISOString())}
                disabled={busy}
                aria-label={`Mark the ${sore.zone.toLowerCase()} sore healed`}
              >
                Healed
              </Button>
            </div>
          </div>
        )}

        {footer && <div className="mt-3 flex justify-center">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
