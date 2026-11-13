'use client';

import Link from 'next/link';

import { SparkleField, type Sparkle } from '@/components/graphics/Sparkles';
import { findingSentence } from '@/components/insights/triggers';
import Kanko from '@/components/kanko/Kanko';
import { Button } from '@/components/ui/button';
import InfoButton from '@/components/ui/info-button';
import type { Finding } from '@/utils/insights';
import { cn } from '@/utils/cn';

/**
 * The screen's payoff, first: the strongest trigger pattern as one sentence,
 * with Kanko pointing at it. When there is no pattern yet, Kanko is curious
 * and the card asks for the one thing that would find one.
 *
 * In dark mode the card takes whatever ground that Kanko's dark art was
 * drawn on (the page for pointing, the card for curious), or the art would
 * show its edge.
 */
export default function FindingCard({ finding }: { finding: Finding }) {
  const found = finding.kind === 'pattern';

  return (
    <section
      aria-labelledby="finding"
      className={cn(
        'relative overflow-hidden rounded-worksheet bg-accent p-4 dark:border dark:border-border sm:p-5',
        // Curious is drawn on the card colour, pointing on the page ground.
        found ? 'dark:bg-background' : 'dark:bg-card'
      )}
    >
      <SparkleField sparkles={found ? FOUND_SPARKLES : QUIET_SPARKLES} />
      <div className="relative flex items-center gap-3 sm:gap-4">
        <Kanko
          mood={found ? 'point' : 'curious'}
          size={76}
          priority
          className="size-[76px] shrink-0"
        />
        <div className="min-w-0 flex-1">
          {found ? (
            <>
              <h2 id="finding" className="text-subhead font-semibold">
                {findingSentence(finding.trigger, finding.count, finding.of)}
              </h2>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                Pattern, not proof
                <InfoButton title="Pattern, not proof" label="How this is found">
                  <p>
                    Counted from what you logged in the 3 days before each
                    sore, over {finding.of} sores with logs.
                  </p>
                  <p>A repeat is worth watching. It is not a cause.</p>
                </InfoButton>
              </p>
            </>
          ) : (
            <>
              <h2 id="finding" className="text-subhead font-semibold">
                {finding.reason === 'no-logs'
                  ? 'Log a few days to spot patterns'
                  : 'No repeat trigger yet'}
              </h2>
              <Button
                asChild
                size="touch"
                variant="outline"
                className="mt-2"
              >
                <Link href="/today?checkin=1">Check in</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/** Sparkles around Kanko when there is a finding; one quiet star when not. */
const FOUND_SPARKLES: Sparkle[] = [
  { top: '8%', left: '3%', size: 14 },
  { top: '10%', left: '92%', size: 12, shape: 'star', tone: 'comfort', delay: 0.8 },
  { top: '74%', left: '86%', size: 10, delay: 1.6 }
];
const QUIET_SPARKLES: Sparkle[] = [
  { top: '10%', left: '92%', size: 12, shape: 'star', tone: 'comfort' }
];
