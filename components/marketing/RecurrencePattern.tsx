'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';

/**
 * Two questions anyone can answer from memory, and the one thing worth doing
 * next.
 *
 * It deliberately does not try to name a cause. The article's claim is that
 * where the sores land decides which investigation is worth your time, so the
 * output is an investigation, not a diagnosis — and the honest part of it is
 * that both branches end in "log the next few", because neither can be
 * settled by answering two questions on a web page.
 */
type Placement = 'same' | 'area' | 'anywhere';

const PLACEMENTS: Array<{ value: Placement; label: string }> = [
  { value: 'same', label: 'The same spot, near enough every time' },
  { value: 'area', label: 'The same general area, not the same point' },
  { value: 'anywhere', label: 'Anywhere — no pattern I can see' }
];

const READS: Record<Placement, { title: string; body: string }> = {
  same: {
    title: 'Local pattern — look at what touches that point',
    body: 'Tissue rarely breaks down in one fixed place unless something keeps happening in that place. A sharp tooth edge, a rough filling margin, a bracket or wire, the rim of a night guard, a cheek you catch in your sleep. This is the branch with a one-appointment fix at the end of it, because a dentist can feel an edge you cannot see.'
  },
  area: {
    title: 'Probably local, but the recall is too coarse to say',
    body: '"Left cheek" covers a lot of ground, and a mechanical cause and a whole-mouth one look identical at that resolution. Mark the exact point the next few times. If they land within a few millimetres of each other, this is the local pattern; if they are spread across the area, it is not.'
  },
  anywhere: {
    title: 'Whole-mouth pattern — look at the days before, not the places',
    body: 'Sores that turn up anywhere are not reporting a location, so there is nothing at any one site to find. What varies is the state you were in beforehand: sleep, stress, being ill, the week of your cycle, a toothpaste change, something you ate two days earlier.'
  }
};

export default function RecurrencePattern() {
  const [count, setCount] = useState(4);
  const [placement, setPlacement] = useState<Placement>('same');

  const read = READS[placement];
  const gap = Math.round(90 / count);
  // Several a month is the point at which "this is how mine go" stops being
  // a fair assumption — not because it is dangerous, but because it is the
  // threshold the advice everywhere uses for having someone look.
  const worthAsking = count >= 6;

  return (
    <figure className="my-10 rounded-xl border border-border bg-card p-5 sm:p-6">
      <figcaption className="text-subhead">Which pattern is yours?</figcaption>
      <p className="mt-1 text-sm text-muted-foreground">
        Two things you already know, without looking anything up.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="rec-count">Sores in the last three months</Label>
            <span className="tabular text-sm font-semibold">
              {count === 12 ? '12+' : count}
            </span>
          </div>
          <Slider
            id="rec-count"
            className="mt-3"
            value={[count]}
            onValueChange={([v]) => setCount(v)}
            min={1}
            max={12}
            step={1}
            aria-label="Number of sores in the last three months"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium">
            Where do they turn up?
          </legend>
          <RadioGroup
            className="mt-3 gap-3"
            value={placement}
            onValueChange={(v) => setPlacement(v as Placement)}
          >
            {PLACEMENTS.map((option) => (
              <div key={option.value} className="flex items-center gap-3">
                <RadioGroupItem
                  value={option.value}
                  id={`rec-${option.value}`}
                />
                <Label
                  htmlFor={`rec-${option.value}`}
                  className="font-normal leading-snug"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>
      </div>

      <div
        className="mt-6 border-t border-border pt-5"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className="font-semibold text-foreground">{read.title}</p>
        <p className="mt-1 text-muted-foreground">{read.body}</p>

        <p className="mt-3 text-muted-foreground">
          {count === 1
            ? 'One in three months is not yet a pattern — it is one sore. Two more will tell you more than any amount of thinking about this one.'
            : `That is about one every ${gap} days${count >= 12 ? ', which is close to never being without one' : ''}.`}
        </p>

        {worthAsking && (
          <p className="mt-4 rounded-md bg-muted/60 p-3 text-sm text-foreground">
            Several a month is the point where it is worth having a doctor or
            dentist look rather than waiting out another one — not because it is
            an emergency, but because frequent ulcers are the case where
            something outside the mouth is worth ruling out.
          </p>
        )}

        <Button asChild size="sm" variant="outline" className="mt-4">
          <Link href="/signin/signup">Start marking where they land</Link>
        </Button>
      </div>
    </figure>
  );
}
