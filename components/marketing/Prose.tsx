import { PropsWithChildren } from 'react';

/** Shell for the plain text pages: title, updated date, readable measure. */
export default function Prose({
  title,
  intro,
  updated,
  children
}: PropsWithChildren<{ title: string; intro?: string; updated?: string }>) {
  return (
    <article className="container max-w-2xl py-16">
      <h1 className="text-title">{title}</h1>
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
