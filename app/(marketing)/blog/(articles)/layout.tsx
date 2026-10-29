import { PropsWithChildren } from 'react';

/**
 * Every article gets the same measure. The width is set here rather than per
 * article so an embedded component — the timeline estimator, a diagram — can
 * break out of the text column by its own margin without each article
 * re-deciding what the column is.
 */
export default function BlogLayout({ children }: PropsWithChildren) {
  return <div className="container max-w-2xl py-12 sm:py-16">{children}</div>;
}
