import { CtaButton } from '@/components/cta-button';

export default function NotFound() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-5 py-24 sm:px-8">
      <p className="text-accent font-mono text-xs font-medium uppercase tracking-[0.12em]">
        404
      </p>
      <h1 className="text-foreground text-3xl font-semibold sm:text-4xl">
        That page isn&rsquo;t here.
      </h1>
      <p className="measure text-secondary-foreground text-[1.0625rem] leading-relaxed">
        The link may be old, or the address may have a typo. The guides and the home page
        are good places to start again.
      </p>
      <div className="flex flex-wrap gap-3">
        <CtaButton href="/">Back to home</CtaButton>
        <CtaButton href="/guides" variant="secondary">
          Browse guides
        </CtaButton>
      </div>
    </section>
  );
}
