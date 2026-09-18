'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { LONG_SORE_DAYS } from '@/utils/insights';

/**
 * Where a sore of a given width usually ends up.
 *
 * These bands are the published description of recurrent aphthous
 * stomatitis, not our own measurements: minor ulcers — the ordinary kind,
 * under about 10mm — close in one to two weeks without scarring, while major
 * ulcers over 10mm can run for weeks. They are stated as ranges because that
 * is genuinely how well this is known, and a calculator that answers "6.4
 * days" would be inventing a precision nobody has.
 *
 * When there are enough readings in the database to publish our own
 * medians, this table is what they replace.
 */
const BANDS = [
  {
    upTo: 5,
    label: 'small (under 5mm)',
    low: 7,
    high: 10,
    note: 'The ordinary kind. Most close inside a week and leave nothing behind.'
  },
  {
    upTo: 10,
    label: 'medium (5–10mm)',
    low: 10,
    high: 14,
    note: 'Still a minor ulcer, but a wider one takes proportionally longer to fill in.'
  },
  {
    upTo: 20,
    label: 'large (over 10mm)',
    low: 14,
    high: 42,
    note: 'Ulcers this wide are uncommon, can take several weeks, and are the ones worth showing to a dentist rather than waiting out.'
  }
] as const;

const bandFor = (mm: number) => BANDS.find((b) => mm <= b.upTo) ?? BANDS[2];

export default function HealingTimeline() {
  const [day, setDay] = useState(3);
  const [mm, setMm] = useState(4);

  const band = bandFor(mm);
  const remainingLow = Math.max(0, band.low - day);
  const remainingHigh = Math.max(0, band.high - day);

  // Past the typical band, the honest output is not a bigger number — it is
  // that the estimate has stopped applying.
  const pastTypical = day > band.high;
  const worthAsking = day > LONG_SORE_DAYS || mm > 10;

  return (
    <figure className="my-10 rounded-xl border border-border bg-card p-5 sm:p-6">
      <figcaption className="text-subhead">
        Where yours probably lands
      </figcaption>
      <p className="mt-1 text-sm text-muted-foreground">
        Set the two things you can actually observe.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="timeline-day">Days since it appeared</Label>
            <span className="tabular text-sm font-semibold">{day}</span>
          </div>
          <Slider
            id="timeline-day"
            className="mt-3"
            value={[day]}
            onValueChange={([v]) => setDay(v)}
            min={0}
            max={28}
            step={1}
            aria-label="Days since the sore appeared"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="timeline-mm">Width across, in millimetres</Label>
            <span className="tabular text-sm font-semibold">{mm}mm</span>
          </div>
          <Slider
            id="timeline-mm"
            className="mt-3"
            value={[mm]}
            onValueChange={([v]) => setMm(v)}
            min={1}
            max={20}
            step={1}
            aria-label="Width of the sore in millimetres"
          />
        </div>
      </div>

      <div
        className="mt-6 border-t border-border pt-5"
        aria-live="polite"
        aria-atomic="true"
      >
        {pastTypical ? (
          <p className="text-foreground">
            A {band.label} sore is usually gone by day {band.high}. Yours is on
            day {day}, which is outside the typical course — not an emergency,
            but past the point where waiting is the obvious plan.
          </p>
        ) : (
          <p className="text-foreground">
            A {band.label} sore typically runs {band.low}–{band.high} days, so
            from day {day} that is{' '}
            <strong className="tabular">
              {remainingLow === remainingHigh
                ? `${remainingHigh} more days`
                : `roughly ${remainingLow}–${remainingHigh} more days`}
            </strong>
            .
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">{band.note}</p>

        {worthAsking && (
          <p className="mt-4 rounded-md bg-muted/60 p-3 text-sm text-foreground">
            Worth a dentist: anything still here after two weeks, or wider than
            10mm, is outside what an ordinary canker sore does.
          </p>
        )}

        <p className="mt-5 text-sm text-muted-foreground">
          This is a population range, not your sore. The only way to know what
          yours is doing is a second measurement.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link href="/signin/signup">Log this one and compare tomorrow</Link>
        </Button>
      </div>
    </figure>
  );
}
