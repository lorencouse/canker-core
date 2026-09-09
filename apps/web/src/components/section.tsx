import type { ReactNode } from 'react';
import clsx from 'clsx';

interface SectionProps {
  id?: string;
  eyebrow?: string;
  heading?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  /** Visual treatment of the band behind the section. */
  tone?: 'plain' | 'muted';
  /** Align the intro block. */
  align?: 'left' | 'center';
  /** Heading level for the section title. */
  as?: 'h1' | 'h2';
}

export function Section({
  id,
  eyebrow,
  heading,
  description,
  children,
  className,
  tone = 'plain',
  align = 'left',
  as: Heading = 'h2'
}: SectionProps) {
  const hasIntro = Boolean(eyebrow || heading || description);

  return (
    <section
      id={id}
      className={clsx(
        'scroll-mt-20',
        tone === 'muted' && 'border-border bg-muted/50 dark:bg-muted/30 border-y',
        className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 md:py-20">
        {hasIntro && (
          <div
            className={clsx(
              'mb-10 flex flex-col gap-3 md:mb-12',
              align === 'center' && 'items-center text-center'
            )}
          >
            {eyebrow && (
              <p className="text-accent font-mono text-xs font-medium uppercase tracking-[0.12em]">
                {eyebrow}
              </p>
            )}
            {heading && (
              <Heading className="text-foreground text-3xl font-semibold sm:text-4xl">
                {heading}
              </Heading>
            )}
            {description && (
              <p className="measure text-secondary-foreground text-[1.0625rem] leading-relaxed">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
