import { appUrl } from '@/lib/site';
import { CtaButton } from '@/components/cta-button';

interface TrackItCalloutProps {
  lead?: string;
}

export function TrackItCallout({ lead }: TrackItCalloutProps) {
  return (
    <aside
      aria-labelledby="track-it-heading"
      className="border-accent/25 bg-accent-soft/60 mt-12 rounded-xl border p-6 sm:p-7"
    >
      <p className="text-accent mb-1.5 font-mono text-xs font-medium uppercase tracking-[0.12em]">
        Track it
      </p>
      <h2 id="track-it-heading" className="text-foreground text-xl font-semibold">
        Reading about it is a start. Your own records are the rest.
      </h2>
      <p className="text-secondary-foreground mt-2 max-w-prose text-[0.95rem] leading-relaxed">
        {lead ??
          'Canker Core takes one check-in a day, under a minute, and turns it into a timeline you can bring to a dentist or doctor.'}
      </p>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <CtaButton href={appUrl}>Open the app</CtaButton>
        <CtaButton href="/how-it-works" variant="secondary">
          How it works
        </CtaButton>
      </div>
    </aside>
  );
}
