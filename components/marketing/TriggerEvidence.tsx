'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  MIN_SORES,
  asPercent,
  triggerEvidence
} from '@/components/marketing/trigger-evidence';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

/**
 * The counter-argument to your own tally, run on your own numbers.
 *
 * Everyone who has had a few ulcers already believes something about stress,
 * and the belief is built from exactly the evidence this widget takes in:
 * stress was around before most of them. The useful thing a page can do is
 * not to confirm or deny that, but to show what the same tally looks like
 * when stress had nothing to do with it — which for most people's lives is
 * very nearly the same tally.
 *
 * It deliberately defaults to the case that disappoints: four of five sores
 * preceded by stress, three stressful days a week, which is not evidence of
 * anything. Loading it with a flattering default would make the page an
 * agreement machine, and the article's whole claim is that agreeing with you
 * cheaply is what every other page on this subject already does.
 */
export default function TriggerEvidence() {
  const [sores, setSores] = useState(5);
  const [hits, setHits] = useState(4);
  const [triggerDaysPerWeek, setTriggerDaysPerWeek] = useState(3);

  const matched = Math.min(hits, sores);
  const { observed, expected, verdict } = triggerEvidence({
    sores,
    hits,
    triggerDaysPerWeek
  });

  const readout = {
    'too-few': {
      title: `${sores} sores is not enough to read anything from`,
      body: `Below about ${MIN_SORES}, a run of sores preceded by stress is the sort of thing that happens by chance often enough to be unremarkable. This is the least satisfying answer and the correct one: the question needs more sores, not better thinking about the ones you have.`
    },
    saturated: {
      title: 'Stress cannot be tested against a life this stressful',
      body: `With ${triggerDaysPerWeek} stressful days in a typical week, ${asPercent(expected)} of all three-day windows contain one — so almost any sore, for any reason, arrives after a stressful day. The tally cannot come out any other way, which means it is not evidence. Worth logging the other triggers instead, and worth knowing that this is a fact about the last year of your life rather than about your mouth.`
    },
    above: {
      title: 'That clears the base rate — worth watching',
      body: `Stress preceded ${asPercent(observed)} of your sores, against ${asPercent(expected)} expected from how often your days are stressful anyway. That gap is the only version of this question that means anything, and it is still a pattern to keep testing rather than a cause. The next five sores are what confirm or dissolve it.`
    },
    'at-or-below': {
      title: 'This is what no connection looks like',
      body: `Stress preceded ${asPercent(observed)} of your sores — and with ${triggerDaysPerWeek} stressful days a week, ${asPercent(expected)} is what you would get if stress had nothing to do with them at all. The tally feels like evidence and is not. It is the single most common way a trigger gets convicted on a coincidence.`
    }
  }[verdict];

  return (
    <figure className="my-10 rounded-xl border border-border bg-card p-5 sm:p-6">
      <figcaption className="text-subhead">
        Test your own stress tally
      </figcaption>
      <p className="mt-1 text-sm text-muted-foreground">
        Against how often an ordinary week of yours is stressful.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="ev-sores">Sores you can put dates to</Label>
            <span className="tabular text-sm font-semibold">{sores}</span>
          </div>
          <Slider
            id="ev-sores"
            className="mt-3"
            value={[sores]}
            onValueChange={([v]) => {
              setSores(v);
              if (hits > v) setHits(v);
            }}
            min={1}
            max={20}
            step={1}
            aria-label="Sores you can put dates to"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="ev-hits">
              With a stressful day in the three before
            </Label>
            <span className="tabular text-sm font-semibold">{matched}</span>
          </div>
          <Slider
            id="ev-hits"
            className="mt-3"
            value={[matched]}
            onValueChange={([v]) => setHits(v)}
            min={0}
            max={sores}
            step={1}
            aria-label="Sores with a stressful day in the three days before"
          />
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="ev-base">
              Stressful days in an ordinary week of yours
            </Label>
            <span className="tabular text-sm font-semibold">
              {triggerDaysPerWeek}
            </span>
          </div>
          <Slider
            id="ev-base"
            className="mt-3"
            value={[triggerDaysPerWeek]}
            onValueChange={([v]) => setTriggerDaysPerWeek(v)}
            min={0}
            max={7}
            step={1}
            aria-label="Stressful days in an ordinary week"
          />
        </div>
      </div>

      <div
        className="mt-6 border-t border-border pt-5"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="font-semibold text-foreground">{readout.title}</p>
        <p className="mt-1 text-muted-foreground">{readout.body}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          The comparison assumes stressful days fall independently, which they
          do not — stress arrives in weeks. Clustering pushes the real baseline
          lower, so the figure above is the conservative one, and a tally that
          fails against it was never going to pass.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-5">
          <Link href="/signin/signup">Log the days and stop estimating</Link>
        </Button>
      </div>
    </figure>
  );
}
