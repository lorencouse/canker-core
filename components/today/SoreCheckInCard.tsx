'use client';

import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { LongSoreNote } from '@/components/SoreDetails';
import CourseStrip from '@/components/sore/CourseStrip';
import SoreSigil from '@/components/sore/SoreSigil';
import type { Sore } from '@/types';
import { isLongRunning } from '@/utils/insights';
import {
  currentPain,
  currentSize,
  dayNumberOf,
  hasReadingOn,
  withReading
} from '@/utils/readings';

/**
 * One open sore on the check-in screen: where it is, how long it has been
 * there, and today's two sliders.
 *
 * "Same as yesterday" exists because the commonest daily truth about a sore
 * is that nothing changed, and a reading that says so is still a reading —
 * it is what turns a two-point chart into a curve.
 */
export default function SoreCheckInCard({
  sore,
  onChange,
  onHeal
}: {
  sore: Sore;
  onChange: (next: Sore) => void;
  onHeal: () => void;
}) {
  const logged = hasReadingOn(sore, new Date());
  const size = currentSize(sore);
  const pain = currentPain(sore);
  const day = dayNumberOf(sore);

  return (
    <div className="app-card space-y-4 p-4">
      <div className="flex items-start gap-3">
        {/* The sigil says which view and where; naming the view in text as
            well would be the same fact twice. */}
        <SoreSigil sore={sore} size={30} className="mt-px" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{sore.zone}</p>
          <p className="tabular text-xs text-muted-foreground">
            Day {day},{' '}
            {logged ? (
              <span className="text-primary">logged today</span>
            ) : (
              'not logged yet'
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onHeal}
          aria-label={`Mark the ${sore.zone.toLowerCase()} sore healed`}
        >
          <CheckCircle2 aria-hidden="true" />
          Healed
        </Button>
      </div>

      {/* Sits right under "Day 6", where the row of six cells explains
          itself without a label. */}
      <CourseStrip sore={sore} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor={`size-${sore.id}`}>Width</Label>
            <span className="tabular text-sm font-semibold">{size} mm</span>
          </div>
          <Slider
            id={`size-${sore.id}`}
            min={1}
            max={20}
            value={[size]}
            onValueChange={([v]) => onChange(withReading(sore, { size: v }))}
            aria-label="Sore size in millimetres"
          />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor={`pain-${sore.id}`}>Pain</Label>
            <span className="tabular inline-flex items-center gap-2 text-sm font-semibold">
              <span
                className="size-3 rounded-full ring-1 ring-foreground/20"
                style={{ backgroundColor: `hsl(var(--sev-${pain}))` }}
              />
              {pain} of 10
            </span>
          </div>
          <Slider
            id={`pain-${sore.id}`}
            tone="severity"
            min={1}
            max={10}
            value={[pain]}
            onValueChange={([v]) => onChange(withReading(sore, { pain: v }))}
            aria-label="Pain level from 1 to 10"
          />
        </div>
      </div>

      {!logged && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(withReading(sore, {}))}
        >
          Same as last time
        </Button>
      )}

      {isLongRunning(sore) && <LongSoreNote />}
    </div>
  );
}
