'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';

/**
 * A day count and one honest question, and the output is a threshold rather
 * than an opinion about the sore.
 *
 * The page exists because "it won't go away" is two different situations that
 * feel identical from the inside: a sore that is closing slowly, and one that
 * has not moved. Only the second is worth an appointment, and the reader
 * cannot separate them without a comparison. So the widget refuses to pretend
 * — "I don't know" is the most common honest answer and gets its own branch,
 * which is the one that says measure today and again on Thursday.
 *
 * It never says what a stuck sore might be. The output is a timeframe for
 * seeing someone and the sentence to arrive with; anything more would be this
 * site diagnosing from a slider.
 */
type Trend = 'narrower' | 'same' | 'wider' | 'unknown';

const TRENDS: Array<{ value: Trend; label: string }> = [
  { value: 'narrower', label: 'Measurably narrower than a week ago' },
  { value: 'same', label: 'The same width as a week ago' },
  { value: 'wider', label: 'Wider than a week ago' },
  { value: 'unknown', label: 'I have not measured it, so I could not say' }
];

type Verdict = { title: string; body: string; urgent?: boolean };

const verdictFor = (days: number, trend: Trend): Verdict => {
  if (trend === 'unknown') {
    return {
      title: 'This is the question you cannot answer from memory',
      body: `A sore you looked at on Tuesday and again on Thursday looks the same to you both times, because two millimetres is invisible to recollection and obvious against a ruler. Measure the widest point today, write the number down with the date, and measure again in two days. At day ${days}, that comparison is the whole difference between waiting sensibly and waiting pointlessly.`
    };
  }

  if (trend === 'wider' && days > 4) {
    return {
      title: 'Widening this late is the one size change worth acting on',
      body: 'Ordinary canker sores stop growing by about day four. One that is still getting wider after that has stopped following the usual course, and the useful next step is someone looking at it rather than another week of measuring.',
      urgent: true
    };
  }

  if (days >= 21) {
    return {
      title: 'Past three weeks is a dentist, whatever it is doing',
      body: 'Three weeks is the line the ordinary course does not cross, and it does not soften because the sore is slowly improving or because it does not hurt much any more. Any sore in the mouth still present at three weeks should be examined. That is not a prediction about what it is — it is the point at which looking beats guessing.',
      urgent: true
    };
  }

  if (days >= 14) {
    return trend === 'narrower'
      ? {
          title: 'Late, but moving in the right direction',
          body: 'A wide sore can genuinely take the full fortnight and a little more, and narrowing is the evidence that it is closing rather than stuck. Keep measuring every couple of days, and treat three weeks as the line: still there then, narrowing or not, and it is worth an examination.'
        }
      : {
          title: 'Two weeks at the same width is worth an appointment',
          body: 'Not because it is likely to be something serious, but because "still there" and "not healing" are different things, and you now have the measurements that show which one this is. That is the appointment worth booking this week.',
          urgent: true
        };
  }

  if (trend === 'same') {
    return {
      title: 'A standstill in the middle of the course is normal',
      body: `Days four to seven are the stretch where a sore looks identical from one day to the next and nothing appears to be happening. Keep the numbers going. If day ${Math.max(days, 14)} arrives with the width unchanged from now, that is the point where it stops being an ordinary course.`
    };
  }

  return {
    title: 'Still inside the ordinary course',
    body: `Seven to fourteen days is the usual range, and at day ${days} a sore that is narrowing is simply doing it slowly. The thing worth carrying forward is the measurements — if this one does end up needing an appointment, the numbers are what make that appointment short.`
  };
};

export default function StillThereCheck() {
  const [days, setDays] = useState(14);
  const [trend, setTrend] = useState<Trend>('unknown');

  const verdict = verdictFor(days, trend);

  return (
    <figure className="my-10 rounded-xl border border-border bg-card p-5 sm:p-6">
      <figcaption className="text-subhead">
        Is it lasting, or is it stuck?
      </figcaption>
      <p className="mt-1 text-sm text-muted-foreground">
        The two feel the same and they are not the same.
      </p>

      <div className="mt-6 space-y-6">
        <div>
          <div className="flex items-baseline justify-between">
            <Label htmlFor="still-days">Days since you first felt it</Label>
            <span className="tabular text-sm font-semibold">
              {days === 42 ? '42+' : days}
            </span>
          </div>
          <Slider
            id="still-days"
            className="mt-3"
            value={[days]}
            onValueChange={([v]) => setDays(v)}
            min={1}
            max={42}
            step={1}
            aria-label="Days since you first felt the sore"
          />
        </div>

        <fieldset>
          <legend className="text-sm font-medium">
            Compared with a week ago, the width is
          </legend>
          <RadioGroup
            className="mt-3 gap-3"
            value={trend}
            onValueChange={(v) => setTrend(v as Trend)}
          >
            {TRENDS.map((option) => (
              <div key={option.value} className="flex items-start gap-3">
                <RadioGroupItem
                  value={option.value}
                  id={`trend-${option.value}`}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`trend-${option.value}`}
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
        <p className="font-semibold text-foreground">{verdict.title}</p>
        <p className="mt-1 text-muted-foreground">{verdict.body}</p>

        {verdict.urgent && (
          <p className="mt-4 rounded-md bg-muted/60 p-3 text-sm text-foreground">
            The sentence worth arriving with:{' '}
            <em className="not-italic">
              &ldquo;It has been here {days} days and it measured the same width
              on these two dates.&rdquo;
            </em>{' '}
            A date and two numbers turn a vague complaint into something
            examinable in one appointment.
          </p>
        )}

        <Button asChild size="sm" variant="outline" className="mt-5">
          <Link href="/signin/signup">Keep the dates and the numbers</Link>
        </Button>
      </div>
    </figure>
  );
}
