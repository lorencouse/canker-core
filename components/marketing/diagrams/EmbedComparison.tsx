import { getURL } from '@/utils/helpers';

import CopyField from '../stages/CopyField';

/**
 * Same offer as the stage diagrams, and for the same reason: the link back is
 * worth more than the ranking, so the picture is free to take. An <img> inside
 * a plain anchor rather than an iframe, because an iframe is not a link.
 */
export default function EmbedComparison() {
  const article = getURL('blog/canker-sore-vs-cold-sore');
  const image = getURL('diagrams/canker-sore-vs-cold-sore.svg');

  const snippet = `<a href="${article}"><img src="${image}" alt="A canker sore and a cold sore side by side, drawn to scale" width="100%"></a>\n<p>Diagram by <a href="${getURL()}">Canker Core</a></p>`;

  return (
    <aside className="my-10 rounded-xl border border-border bg-muted/40 p-5 sm:p-6">
      <h2 className="text-subhead">Use this diagram</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Free to reuse anywhere — a practice site, a patient handout, a forum
        answer — with a credit link back. Paste this, or just take the{' '}
        <a href={image} className="underline underline-offset-4">
          SVG
        </a>
        .
      </p>
      <CopyField value={snippet} />
    </aside>
  );
}
