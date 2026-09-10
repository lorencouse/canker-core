'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { Sore } from '@/types';
import { currentPain, currentSize, withReading } from '@/utils/readings';

/**
 * The second step of the first run: how wide, and how much it hurts.
 *
 * The same two sliders the app uses every day, but drawn once at full size
 * with the swatch as the subject rather than a thumbnail beside a list of
 * figures. It is the one chance to teach two things that the rest of the
 * product then relies on:
 *
 *   millimetres  nobody knows what 7 mm is. The oval is sized in CSS
 *                millimetres, so it really is about life size, and the
 *                number stops being abstract the first time it is dragged.
 *   the ramp     the swatch takes its colour from the pain slider, so the
 *                severity scale is learned by moving it rather than by
 *                reading a key.
 */
export default function FirstReading({
  sore,
  onChange
}: {
  sore: Sore;
  onChange: (next: Sore) => void;
}) {
  const size = currentSize(sore);
  const pain = currentPain(sore);

  return (
    <div className="space-y-7">
      {/*
        Sized in CSS millimetres against a plain ground. No card: the swatch
        is the content of this step, not an item on a surface.
      */}
      <div
        className="flex h-40 items-center justify-center"
        // The oval is decorative here — the figures below it are the
        // accessible version, and they are two lines away.
        aria-hidden="true"
      >
        <span
          className="rounded-full ring-1 ring-foreground/20 transition-[width,height,background-color] duration-150"
          style={{
            width: `${size}mm`,
            height: `${size}mm`,
            backgroundColor: `hsl(var(--sev-${pain}))`
          }}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="first-size">How wide is it?</Label>
          <span className="tabular text-lg font-semibold">{size} mm</span>
        </div>
        <Slider
          id="first-size"
          min={1}
          max={20}
          value={[size]}
          onValueChange={([v]) => onChange(withReading(sore, { size: v }))}
          aria-label="Sore size in millimetres"
        />
        <p className="text-xs text-muted-foreground">
          Guessing is fine. What matters is that tomorrow&rsquo;s guess uses
          the same eye.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor="first-pain">How much does it hurt?</Label>
          <span className="tabular text-lg font-semibold">{pain} of 10</span>
        </div>
        <Slider
          id="first-pain"
          tone="severity"
          min={1}
          max={10}
          value={[pain]}
          onValueChange={([v]) => onChange(withReading(sore, { pain: v }))}
          aria-label="Pain level from 1 to 10"
        />
        <p className="text-xs text-muted-foreground">
          1 is &ldquo;I can feel it&rdquo;. 10 is &ldquo;I cannot eat&rdquo;.
        </p>
      </div>
    </div>
  );
}
