'use client';

import { useState, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import SeverityLadder from '@/components/ui/SeverityLadder';
import { Slider } from '@/components/ui/slider';
import { LongSoreNote } from '@/components/SoreDetails';
import CourseBars from '@/components/sore/CourseBars';
import SoreSigil from '@/components/sore/SoreSigil';
import type { Sore } from '@/types';
import { courseOf, trendOf } from '@/utils/course';
import { isLongRunning } from '@/utils/insights';
import { tap } from '@/utils/native';
import {
  currentPain,
  currentSize,
  dayNumberOf,
  hasReadingOn,
  isSameLocalDay,
  latestReading,
  withReading
} from '@/utils/readings';

/** Width moves in half millimetres, which is as fine as anyone can judge one. */
const STEP = 0.5;
const MIN_SIZE = 0.5;
const MAX_SIZE = 20;

/**
 * One open sore on the check-in screen: where it is, its fortnight so far,
 * and today's two readings.
 *
 * The fortnight is the card's picture. Fourteen slots, bar height for
 * width, colour for that day's pain, so "is it getting smaller" is answered
 * before a single figure is read, and the empty slots say how far into the
 * ordinary course it is.
 *
 * Pain and width are deliberately entered by different controls. Width is a
 * continuous measurement in millimetres, so it is a slider, with half-step
 * buttons either side because a thumb cannot land a slider on 3.5. Pain is
 * ten named steps, and a slider hides the scale behind its own thumb: the
 * ladder shows all ten and lands in one tap.
 *
 * A sore already logged today collapses to that reading, so the card that
 * still needs something is the one that looks unfinished. "Change" opens the
 * controls again.
 *
 * "Same as yesterday" exists because the commonest daily truth about a sore
 * is that nothing changed, and a reading that says so is still a reading:
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
  const now = new Date();
  const logged = hasReadingOn(sore, now);
  // Open while editing, so the controls do not vanish the moment a reading
  // exists; a logged sore starts closed.
  const [editing, setEditing] = useState(!logged);
  const size = currentSize(sore);
  const pain = currentPain(sore);
  const day = dayNumberOf(sore);
  const last = latestReading(sore);
  const titleId = `sore-${sore.id}`;

  const setSize = (next: number) =>
    onChange(
      withReading(sore, {
        size: Math.min(
          MAX_SIZE,
          Math.max(MIN_SIZE, Math.round(next / STEP) * STEP)
        )
      })
    );

  return (
    <article aria-labelledby={titleId} className="surface-worksheet p-4 sm:p-5">
      <header className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        {/* The sigil says which view and where; naming the view in text as
            well would be the same fact twice. */}
        <SoreSigil sore={sore} size={36} />
        <div className="min-w-0">
          <h2 id={titleId} className="truncate text-subhead">
            {sore.zone}
          </h2>
          <p className="tabular text-sm text-muted-foreground">
            Day {day} &middot;{' '}
            {logged && last && !editing ? (
              `logged ${new Date(last.recorded_at).toLocaleTimeString(
                undefined,
                {
                  hour: '2-digit',
                  minute: '2-digit'
                }
              )}`
            ) : logged ? (
              'logged today'
            ) : (
              <span className="font-semibold text-foreground">
                not logged today
              </span>
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="font-display text-base normal-case tracking-normal text-primary"
          onClick={onHeal}
          aria-label={`Mark the ${sore.zone.toLowerCase()} sore healed`}
        >
          Healed
        </Button>
      </header>

      <div className="mt-4">
        <div
          aria-hidden="true"
          className="tabular flex justify-between gap-3 text-sm text-muted-foreground"
        >
          <span>Day 1</span>
          <span className="min-w-0 truncate">{courseCaption(sore)}</span>
          <span>Day 14</span>
        </div>
        <CourseBars sore={sore} animateLast={justSaved} className="mt-1.5" />
      </div>

      {editing ? (
        <div className="mt-5 grid gap-5">
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <label
                htmlFor={`size-${sore.id}`}
                className="text-base font-semibold"
              >
                Width today
              </label>
              <output
                htmlFor={`size-${sore.id}`}
                className="font-display text-xl font-semibold leading-none"
              >
                {size}{' '}
                <small className="font-sans text-sm font-normal text-muted-foreground">
                  mm
                </small>
              </output>
            </div>
            <div className="mt-2 grid grid-cols-[3.25rem_minmax(0,1fr)_3.25rem] items-center gap-2.5">
              <Stepper
                label="Half a millimetre narrower"
                onClick={() => setSize(size - STEP)}
                disabled={size <= MIN_SIZE}
              >
                <Minus aria-hidden="true" />
              </Stepper>
              <Slider
                id={`size-${sore.id}`}
                min={MIN_SIZE}
                max={MAX_SIZE}
                step={STEP}
                value={[size]}
                onValueChange={([v]) => setSize(v)}
                aria-label="Width in millimetres"
              />
              <Stepper
                label="Half a millimetre wider"
                onClick={() => setSize(size + STEP)}
                disabled={size >= MAX_SIZE}
              >
                <Plus aria-hidden="true" />
              </Stepper>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <span id={`pain-${sore.id}`} className="text-base font-semibold">
                Pain today
              </span>
              <output className="font-display text-xl font-semibold leading-none">
                {pain}{' '}
                <small className="font-sans text-sm font-normal text-muted-foreground">
                  of 10
                </small>
              </output>
            </div>
            <SeverityLadder
              className="mt-2"
              value={pain}
              label="Pain today"
              onChange={(v) => onChange(withReading(sore, { pain: v }))}
            />
          </div>

          {!logged && last && (
            <Button
              type="button"
              variant="link"
              className="h-11 justify-self-start px-0.5 text-base font-semibold underline"
              onClick={() => onChange(withReading(sore, {}))}
            >
              {sameLabel(sore)}
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-muted-foreground">Today</span>
          <b className="tabular font-display text-xl font-semibold">
            {size} mm
          </b>
          <b className="tabular font-display text-xl font-semibold">
            Pain {pain}
          </b>
          <span className="min-w-0 text-muted-foreground">
            {changeLine(sore)}
          </span>
          <Button
            type="button"
            variant="link"
            className="ml-auto h-11 px-0.5 text-base font-semibold"
            onClick={() => {
              tap();
              setEditing(true);
            }}
          >
            Change
          </Button>
        </div>
      )}

      {isLongRunning(sore) && <LongSoreNote className="mt-4" />}
    </article>
  );
}

function Stepper({
  label,
  onClick,
  disabled,
  children
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        tap();
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
      className="h-12 w-full px-0 [&_svg]:size-5"
    >
      {children}
    </Button>
  );
}

/** The middle caption over the bars: what the course has done so far. */
function courseCaption(sore: Sore): string {
  const days = courseOf(sore).filter((d) => d.size !== null);
  if (days.length < 3) return 'Width by day, coloured by pain';
  const peak = days.reduce((a, b) => (b.size! > a.size! ? b : a));
  const last = days[days.length - 1];
  // Only once it has come down from the peak; a tie with today is no peak.
  if (peak.size! > last.size! && peak.n > 1) return `Peaked on day ${peak.n}`;
  return 'Width by day, coloured by pain';
}

/** "Same as yesterday", or "Same as last time" after a gap. */
function sameLabel(sore: Sore): string {
  const last = latestReading(sore);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return last && isSameLocalDay(last.recorded_at, yesterday)
    ? 'Same as yesterday'
    : 'Same as last time';
}

/**
 * Today against the reading before it: "down 0.5 mm and 1 point" when both
 * moved the same way, otherwise each said separately.
 */
function changeLine(sore: Sore): string {
  const trend = trendOf(sore);
  if (!trend) return 'first reading';
  const { readings } = sore;
  const prev = readings[readings.length - 2];
  const last = readings[readings.length - 1];
  const dSize = Math.abs(last.size - prev.size);
  const dPain = Math.abs(last.pain - prev.pain);
  const points = `${dPain} point${dPain === 1 ? '' : 's'}`;
  if (!dSize && !dPain) return `no change since ${trend.against}`;
  if (dSize && dPain && trend.size === trend.pain)
    return `${trend.size} ${dSize} mm and ${points}`;
  return [
    dSize && `${dSize} mm ${trend.size === 'down' ? 'narrower' : 'wider'}`,
    dPain && `pain ${trend.pain} ${points}`
  ]
    .filter(Boolean)
    .join(', ');
}
