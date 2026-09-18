'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

/**
 * Two questions, and the answer is a short list of teeth rather than a cause.
 *
 * A sore on the gum is nearly always held there by something, and the thing
 * is almost always one of about four objects sitting next to one of about
 * three groups of teeth. Narrowing it to a group is something the reader can
 * genuinely do from a mirror, and it converts "I have a sore on my gum" into
 * a sentence a dentist can act on in one appointment — which is as far as a
 * web page should go.
 *
 * It names no cause and recommends nothing. The output is where to feel and
 * what to ask.
 */
type Arch = 'upper' | 'lower';
type Along = 'front' | 'middle' | 'back';

const ARCHES: Array<{ value: Arch; label: string }> = [
  { value: 'upper', label: 'Upper gum' },
  { value: 'lower', label: 'Lower gum' }
];

const ALONGS: Array<{ value: Along; label: string }> = [
  { value: 'front', label: 'Near the front teeth' },
  { value: 'middle', label: 'Round the side, level with the small teeth' },
  { value: 'back', label: 'Right at the back, by the big teeth' }
];

const TEETH: Record<Along, string> = {
  front:
    'the two central incisors, the narrower laterals either side of them, and the pointed canines behind those',
  middle: 'the canine and the two premolars behind it',
  back: 'the molars, and the wisdom tooth if you still have one'
};

const SUSPECTS: Record<Arch, Record<Along, string>> = {
  upper: {
    front:
      'An orthodontic bracket or the end of an archwire, a chipped or newly bonded incisor edge, or a hard toothbrush driven along the gum margin every morning.',
    middle:
      'The margin of a filling or a crown, the clasp of a partial denture, or the point of the lower canine biting past the gum rather than onto the tooth.',
    back: 'A broken cusp or an old crown margin you can catch a fingernail on, a rough edge left by a lost filling, or a wisdom tooth pushing through at an angle.'
  },
  lower: {
    front:
      'A retainer wire bonded behind the lower front teeth, which is the single most common object in this position. Otherwise a chipped incisor, or brushing hard at a gum margin that is thin to begin with.',
    middle:
      'The rim of a night guard, the margin of a filling, or a premolar cusp that has worn to an edge.',
    back: 'A broken cusp, an old crown margin, or the gum flap over a partly erupted wisdom tooth.'
  }
};

export default function GumToothCheck() {
  const [arch, setArch] = useState<Arch>('lower');
  const [along, setAlong] = useState<Along>('front');

  const side = arch === 'upper' ? 'upper' : 'lower';
  // The wisdom-tooth flap is the one branch where the honest output is
  // "this may not be the thing this page is about".
  const wisdom = along === 'back';

  return (
    <figure className="my-10 rounded-xl border border-border bg-card p-5 sm:p-6">
      <figcaption className="text-subhead">
        Which tooth is worth a fingernail?
      </figcaption>
      <p className="mt-1 text-sm text-muted-foreground">
        Two things you can see in a mirror.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <fieldset>
          <legend className="text-sm font-medium">Upper or lower?</legend>
          <RadioGroup
            className="mt-3 gap-3"
            value={arch}
            onValueChange={(v) => setArch(v as Arch)}
          >
            {ARCHES.map((option) => (
              <div key={option.value} className="flex items-center gap-3">
                <RadioGroupItem
                  value={option.value}
                  id={`arch-${option.value}`}
                />
                <Label
                  htmlFor={`arch-${option.value}`}
                  className="font-normal leading-snug"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium">Where along?</legend>
          <RadioGroup
            className="mt-3 gap-3"
            value={along}
            onValueChange={(v) => setAlong(v as Along)}
          >
            {ALONGS.map((option) => (
              <div key={option.value} className="flex items-start gap-3">
                <RadioGroupItem
                  value={option.value}
                  id={`along-${option.value}`}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`along-${option.value}`}
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
        <p className="font-semibold text-foreground">
          Feel along {TEETH[along]}, on the {side} arch.
        </p>
        <p className="mt-2 text-muted-foreground">
          Run a clean fingertip along their biting edges and then along their
          necks, where the tooth meets the gum, on the side the sore is on.
          Anything that catches a fingernail is catching your gum in exactly the
          same way several thousand times a day.
        </p>

        <p className="mt-3 text-muted-foreground">
          <span className="font-medium text-foreground">
            Usually it is one of these:
          </span>{' '}
          {SUSPECTS[arch][along]}
        </p>

        {wisdom && (
          <p className="mt-4 rounded-md bg-muted/60 p-3 text-sm text-foreground">
            Sore, swollen gum over a back tooth that is only half through —
            often with a bad taste, and often hard to open onto — is a different
            problem with a different answer, and waiting a fortnight is not the
            answer. That is a dentist this week.
          </p>
        )}

        <p className="mt-4 text-sm text-muted-foreground">
          The sentence worth arriving with:{' '}
          <em className="text-foreground not-italic">
            &ldquo;I keep getting a sore on the {side} gum by these teeth — can
            you feel whether anything there is sharp?&rdquo;
          </em>{' '}
          It takes a minute and it is the question that ends the cycle, if
          something sharp is what is causing it.
        </p>

        <Button asChild size="sm" variant="outline" className="mt-5">
          <Link href="/mouth-map">Mark exactly where it is on the map</Link>
        </Button>
      </div>
    </figure>
  );
}
