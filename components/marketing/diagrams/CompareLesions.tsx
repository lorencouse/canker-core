import { CELL, type Lesion, LESIONS, lesionMarkup } from './compare';

/**
 * The side-by-side drawing as it appears in an article.
 *
 * Two cards rather than a table of text, because the answer to "which one is
 * this" is spatial: the reader is holding a mirror, and what they need is a
 * picture of where each one lives. The prose under each drawing is the same
 * copy the standalone SVG carries in its labels.
 */
function LesionCard({ lesion }: { lesion: Lesion }) {
  return (
    <li className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{lesion.name}</h3>
        <span className="text-xs text-muted-foreground">
          {lesion.key === 'canker' ? 'inside the mouth' : 'on the lip border'}
        </span>
      </div>

      <svg
        viewBox={`${-CELL.width / 2} ${-CELL.height / 2} ${CELL.width} ${CELL.height}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`${lesion.name}: ${lesion.look}`}
        dangerouslySetInnerHTML={{ __html: lesionMarkup(lesion) }}
      />

      <dl className="mt-3 space-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Where
          </dt>
          <dd className="text-foreground">{lesion.where}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            What it looks like
          </dt>
          <dd className="text-foreground">{lesion.look}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Contagious
          </dt>
          <dd className="text-foreground">{lesion.contagious}</dd>
        </div>
      </dl>
    </li>
  );
}

export default function CompareLesions() {
  return (
    <figure className="my-10 rounded-xl border border-border bg-card p-5 sm:p-6">
      <figcaption className="text-subhead">
        The two, drawn to the same millimetre scale
      </figcaption>
      <p className="mt-1 text-sm text-muted-foreground">
        Drawn rather than photographed, and drawn against the lip border on the
        right, because where the sore sits relative to that line is most of the
        answer.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {LESIONS.map((lesion) => (
          <LesionCard key={lesion.key} lesion={lesion} />
        ))}
      </ul>
    </figure>
  );
}
