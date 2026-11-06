import { PropsWithChildren, ReactNode } from 'react';

/**
 * Shell for the plain text pages: title, updated date, readable measure.
 * `mascot` sits beside the title, never inside the body, so the legal pages
 * can leave it out and stay plain.
 */
export default function Prose({
  title,
  intro,
  updated,
  mascot,
  children
}: PropsWithChildren<{
  title: string;
  intro?: string;
  updated?: string;
  mascot?: ReactNode;
}>) {
  return (
    <article className="container max-w-2xl py-16">
      {mascot ? (
        <div className="flex items-end justify-between gap-4">
          <h1 className="min-w-0 text-title">{title}</h1>
          {mascot}
        </div>
      ) : (
        <h1 className="text-title">{title}</h1>
      )}
      {intro && (
        <p className="prose-measure mt-4 text-lg text-muted-foreground">
          {intro}
        </p>
      )}
      {updated && (
        <p className="tabular mt-4 text-sm text-muted-foreground">
          Last updated {updated}
        </p>
      )}
      <div className="prose-measure mt-10 space-y-8 [&_h2]:text-subhead [&_p]:mt-2 [&_p]:text-muted-foreground">
        {children}
      </div>
    </article>
  );
}
