/**
 * The arithmetic behind the stress widget, kept out of the component so it
 * can be tested and so the claim the page makes is checkable.
 *
 * The whole point of the page is that "stress came before four of my five
 * sores" means nothing on its own. If most of your days are stressful, then
 * most three-day windows contain a stressful day whether or not stress has
 * anything to do with ulcers, and the tally is measuring your life rather
 * than your mouth.
 *
 * So the comparison is against a base rate: with a fraction `p` of days
 * stressful and independent days, the chance that at least one of the three
 * days before a sore was stressful is `1 - (1 - p)^3`. That is what a tally
 * should be beaten by before anyone calls it a pattern. Days are of course
 * not independent — stress comes in weeks, not days — which pushes the real
 * baseline *lower*, so using this one is the conservative choice and the
 * honest direction to be wrong in.
 */

/** The trigger log counts the three days before a sore was first marked. */
export const WINDOW_DAYS = 3;

/**
 * Fewer sores than this and any pattern is noise. Four sores can go 4-of-4 on
 * a coin flip about one time in sixteen, which is not a finding.
 */
export const MIN_SORES = 5;

/** How far above the base rate a tally has to sit before it is worth a look. */
const MARGIN = 0.15;

export type Evidence = {
  /** Share of sores with the trigger in the three days before. */
  observed: number;
  /** Share expected from the trigger's own frequency, with no link at all. */
  expected: number;
  verdict: 'too-few' | 'saturated' | 'above' | 'at-or-below';
};

export const triggerEvidence = ({
  sores,
  hits,
  triggerDaysPerWeek
}: {
  sores: number;
  hits: number;
  triggerDaysPerWeek: number;
}): Evidence => {
  const matched = Math.min(hits, sores);
  const observed = sores > 0 ? matched / sores : 0;
  const p = triggerDaysPerWeek / 7;
  const expected = 1 - (1 - p) ** WINDOW_DAYS;

  // Above about five stressful days a week the baseline is over 95%: there is
  // no tally that could distinguish a real link from none, so the honest
  // answer is that this trigger is unanswerable for you rather than absent.
  const verdict =
    sores < MIN_SORES
      ? 'too-few'
      : expected > 0.95
        ? 'saturated'
        : observed > expected + MARGIN
          ? 'above'
          : 'at-or-below';

  return { observed, expected, verdict };
};

export const asPercent = (value: number) => `${Math.round(value * 100)}%`;
