'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

/**
 * Two measurements in, a verdict out.
 *
 * The article's claim is that one look tells you nothing and a comparison
 * tells you everything, so the page should let someone actually do the
 * comparison rather than describe it. It is deliberately not a form that
 * stores anything — the point it is making is that the second number is the
 * useful one, and that landing is what earns the account.
 *
 * The 1mm dead band is not decoration: eyeballing a sore against a ruler is
 * good to about a millimetre, so calling a 1mm change "shrinking" would be
 * reading noise as progress.
 */
export default function HealingCheck() {
  const [before, setBefore] = useState(6);
  const [after, setAfter] = useState(4);

  const change = after - before;
  const verdict =
    change <= -1
      ? {
          title: 'Narrowing — that is healing',
          body: `Down ${Math.abs(change)}mm. A sore that is measurably smaller two days later is closing, whatever it still feels like.`
        }
      : change >= 1
        ? {
            title: 'Wider than it was',
            body: 'Growing is normal in the first three days and not after that. If this is past day four, it is worth a dentist rather than another week of waiting.'
          }
        : {
            title: 'No real change yet',
            body: 'Within the margin of eyeballing a ruler, so this is a standstill rather than progress. Normal mid-course; measure again in two days before reading anything into it.'
          };

  return (
    <figure className="my-10 rounded-xl border border-border bg-card p-5 sm:p-6">
      <figcaption className="text-subhead">Compare two measurements</figcaption>
      <p className="mt-1 text-sm text-muted-foreground">
        Widest point, in millimetres, two days apart.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="check-before">Two days ago</Label>
            <span className="tabular text-sm font-semibold">{before}mm</span>
          </div>
          <Slider
            id="check-before"
            className="mt-3"
            value={[before]}
            onValueChange={([v]) => setBefore(v)}
            min={1}
            max={20}
            step={1}
            aria-label="Width two days ago, in millimetres"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="check-after">Today</Label>
            <span className="tabular text-sm font-semibold">{after}mm</span>
          </div>
          <Slider
            id="check-after"
            className="mt-3"
            value={[after]}
            onValueChange={([v]) => setAfter(v)}
            min={1}
            max={20}
            step={1}
            aria-label="Width today, in millimetres"
          />
        </div>
      </div>

      <div
        className="mt-6 border-t border-border pt-5"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="font-semibold text-foreground">{verdict.title}</p>
        <p className="mt-1 text-muted-foreground">{verdict.body}</p>
        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link href="/signin/signup">Keep the numbers instead</Link>
        </Button>
      </div>
    </figure>
  );
}
