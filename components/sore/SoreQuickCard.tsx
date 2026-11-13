'use client';

import { useState } from 'react';
import { Check, NotebookPen, RotateCcw } from 'lucide-react';

import CourseBars from '@/components/sore/CourseBars';
import PainSlider from '@/components/sore/PainSlider';
import WidthRuler from '@/components/sore/WidthRuler';
import SoreThumb from '@/components/sore/SoreThumb';
import { StarMark } from '@/components/graphics/Sparkles';
import { useHealSore } from '@/components/sore/useHealSore';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
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
 * A sore at a glance, in a half-height sheet over the map or a chart: its
 * day, today's (or the last) reading and its fortnight, with the two things
 * a person most often wants to do next, log today or close it, one tap
 * away. Log sits beside the name; a swipe up shows the rest. The full course stays on the map's detail panel; this is the quick
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
  footer,
  startEditing = false
}: {
  sore: Sore | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The sore as written, after a save, healed or reopen. */
  onChange: (next: Sore) => void;
  /** An extra link under the actions, e.g. "Show on map". */
  footer?: React.ReactNode;
  /** Open straight on today's reading, as the map's long-press Log does. */
  startEditing?: boolean;
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
    setDraft(
      currentId && startEditing && sore && !sore.healed_at
        ? withReading(sore, {})
        : null
    );
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

  const startLog = () => {
    tap();
    setDraft(withReading(sore, {}));
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      detent="half"
      hideTitle
      title={sore.zone}
    >
      {/* Clear of the sheet's close button, which sits at this row's end. */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 pr-11">
        <SoreThumb sore={sore} size={48} />
        <div className="min-w-0">
          <p aria-hidden="true" className="truncate font-display text-subhead font-semibold">
            {sore.zone}
          </p>
          <p className="tabular truncate text-sm text-muted-foreground">
            {sore.healed_at
              ? 'Healed'
              : `Day ${dayNumberOf(sore, now)}`}
          </p>
        </div>
        {!draft && !sore.healed_at && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full bg-accent text-accent-foreground"
            onClick={startLog}
            disabled={busy}
          >
            <NotebookPen aria-hidden="true" />
            Log
          </Button>
        )}
      </div>

      <p className="mt-3 text-base">
        <b className="font-semibold">{verdict.word}</b> {verdict.detail}
      </p>

      <CourseBars sore={shown} height={56} now={now} className="mt-3" />

      {draft ? (
        <div className="mt-4 grid gap-5">
          <WidthRuler
            value={currentSize(draft)}
            onChange={(mm) => setDraft(withReading(draft, { size: mm }))}
          />
          <PainSlider
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
        <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          {/* The commonest update is "no change", so it gets one tap. */}
          {!today && last ? (
            <Button
              type="button"
              size="touch"
              onClick={() => {
                tap();
                save(withReading(sore, {}));
              }}
              disabled={busy}
            >
              <Check aria-hidden="true" />
              {lastWasYesterday(sore, now) ? 'Same as yesterday' : 'Same as last time'}
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            variant="outline"
            size="touch"
            onClick={() => setHealed(now.toISOString())}
            disabled={busy}
            aria-label={`Mark the ${sore.zone.toLowerCase()} sore healed`}
          >
            <StarMark className="text-win-edge" />
            Healed
          </Button>
        </div>
      )}

      {footer && <div className="mt-3 flex justify-center">{footer}</div>}
    </Sheet>
  );
}
