import { getURL } from '@/utils/helpers';

import CopyField from './CopyField';

/**
 * The offer that makes the diagrams worth more than the ranking.
 *
 * The snippet is an <img> wrapped in a plain anchor rather than an iframe on
 * purpose: an iframe is not a link, and a link is the entire point of giving
 * the drawings away.
 */
export default function EmbedDiagrams() {
  const article = getURL('blog/canker-sore-stages');
  const image = getURL('diagrams/canker-sore-stages.svg');

  const snippet = `<a href="${article}"><img src="${image}" alt="The five stages of a canker sore, drawn to scale" width="100%"></a>\n<p>Diagram by <a href="${getURL()}">Canker Core</a></p>`;

  return (
    <aside className="my-10 rounded-xl border border-border bg-muted/40 p-5 sm:p-6">
      <h2 className="text-subhead">Use these diagrams</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        They are free to reuse anywhere — a practice site, a patient handout, a
        forum answer — with a credit link back. Paste this, or just take the{' '}
        <a href={image} className="underline underline-offset-4">
          SVG
        </a>
        .
      </p>
      <CopyField value={snippet} />
    </aside>
  );
}
