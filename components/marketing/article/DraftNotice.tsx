/**
 * The banner on an article that is routed but not published.
 *
 * It exists because "have a clinician read this first" needs a thing to read,
 * and a page is a better thing to read than a diff. It is loud on purpose: a
 * draft that looks like the rest of the site is a draft somebody will link to
 * by accident.
 *
 * The review asks arrive as data rather than as children. MDX parses the
 * children of a component as markdown, so block tags written inside one from
 * an article end up nested inside MDX's own `<p>` — which is a hydration
 * error, not a style problem.
 *
 * Pair it with `draft: true` in the registry, which is what actually keeps the
 * page out of the sitemap, the index and `llms.txt`, and with `robots:
 * noindex` in the page's own metadata. The banner is the reminder, not the
 * mechanism.
 */
export type ReviewAsk = {
  /** The question, in bold. */
  ask: string;
  /** What specifically to look at when answering it. */
  detail: string;
};

export default function DraftNotice({
  reviewer,
  intro,
  asks,
  note
}: {
  reviewer: string;
  intro: string;
  asks: ReviewAsk[];
  note?: string;
}) {
  return (
    <aside className="mb-10 rounded-xl border-2 border-dashed border-border bg-muted/40 p-5">
      <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
        Draft — not published
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        This page is not in the sitemap, the article index or{' '}
        <code>llms.txt</code>, and it is served <code>noindex</code>. It is
        waiting on a read by {reviewer} before it ships.
      </p>

      <p className="mt-4 text-sm text-muted-foreground">{intro}</p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        {asks.map((item) => (
          <li key={item.ask}>
            <strong className="text-foreground">{item.ask}</strong>{' '}
            {item.detail}
          </li>
        ))}
      </ol>

      {note && <p className="mt-4 text-sm text-muted-foreground">{note}</p>}
    </aside>
  );
}
