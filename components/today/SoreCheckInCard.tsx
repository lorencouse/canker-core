'use client';

import { CheckCircle2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import Gauge from '@/components/ui/Gauge';
import { Label } from '@/components/ui/label';
import { Panel, PanelBar, PanelBody, PanelMeta, PanelTitle } from '@/components/ui/Panel';
import SeverityLadder from '@/components/ui/SeverityLadder';
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
 * there, and today's two readings.
 *
 * The gauge carries the scanning job the severity left-edge used to do. A
 * stack of these is scanned before it is read, and a dial sorts them by how
 * bad each one is from further away than a 3px stripe ever did — while also
 * answering "out of what", which the stripe could not.
 *
 * Pain and width are deliberately entered by different controls. Width is a
 * continuous measurement in millimetres and a slider is honest about that.
 * Pain is ten named steps, and a slider hides the scale behind its own
 * thumb: on a phone the difference between a 6 and a 7 is about four pixels
 * of travel, so the value people record is the one that was easy to hit
 * rather than the one they meant. The ladder shows all ten and lands in one
 * tap.
 *
 * "Same as last time" exists because the commonest daily truth about a sore
 * is that nothing changed, and a reading that says so is still a reading —
 * it is what turns a two-point chart into a curve.
 */
export default function SoreCheckInCard({
  sore,
  onChange,
  onHeal,
  justSaved = false
}: {
  sore: Sore;
  onChange: (next: Sore) => void;
  onHeal: () => void;
  /** True for a moment after a successful save. */
  justSaved?: boolean;
}) {
  const logged = hasReadingOn(sore, new Date());
  const size = currentSize(sore);
  const pain = currentPain(sore);
  const day = dayNumberOf(sore);

  return (
    <Panel>
      <PanelBar>
        <PanelTitle className="min-w-0 truncate">{sore.zone}</PanelTitle>
        <PanelMeta className="shrink-0">
          Day {day} &middot; {logged ? 'logged' : 'not logged'}
        </PanelMeta>
      </PanelBar>

      <PanelBody>
        <div className="flex items-center gap-4">
          <Gauge pain={pain} size={88} label="Pain" />
          {/* The sigil says which view and where; naming the view in text
              as well would be the same fact twice. */}
          <SoreSigil sore={sore} size={30} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="ml-auto self-start"
            onClick={onHeal}
            aria-label={`Mark the ${sore.zone.toLowerCase()} sore healed`}
          >
            <CheckCircle2 aria-hidden="true" />
            Healed
          </Button>
        </div>

        {/*
         * The strip gets the card's full width rather than the column beside
         * the gauge. A course is one unbroken run of days, and in a 115px
         * column it wrapped onto a second line at day nine — which reads as
         * two sores, not one long one. Full width carries about three weeks
         * on a phone before it has to wrap at all.
         */}
        <CourseStrip sore={sore} animateLast={justSaved} />

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <Label htmlFor={`size-${sore.id}`}>Width</Label>
            <span className="tabular font-display text-sm font-semibold">
              {size} mm
            </span>
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

        <div className="space-y-2">
          {/* The label sits above the ladder rather than under it because
              the ladder is a control being offered, not a figure being
              reported — the label-under-figure rule is about readouts. */}
          <Label>Pain today</Label>
          <SeverityLadder
            value={pain}
            label="Pain today"
            onChange={(v) => onChange(withReading(sore, { pain: v }))}
          />
        </div>

        {!logged && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="justify-self-start"
            onClick={() => onChange(withReading(sore, {}))}
          >
            Same as last time
          </Button>
        )}

        {isLongRunning(sore) && <LongSoreNote />}
      </PanelBody>
    </Panel>
  );
}
