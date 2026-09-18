import { CELL, STAGES, type Stage, stageMarkup } from './stages';

/**
 * The stage set as it appears in the article.
 *
 * A row on desktop, a stack on mobile — the same five drawings that the
 * standalone SVG carries, from the same `stageMarkup`, so the embedded copy
 * and the page copy can never disagree.
 */
function StageCard({ stage }: { stage: Stage }) {
  return (
    <li className="rounded-lg border border-border bg-background p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
        <span className="tabular text-xs text-muted-foreground">
          {stage.days}
        </span>
      </div>

      <svg
        viewBox={`${-CELL.width / 2} ${-CELL.height / 2} ${CELL.width} ${CELL.height}`}
        className="mt-3 w-full"
        role="img"
        aria-label={`${stage.name}: ${stage.look}`}
        dangerouslySetInnerHTML={{ __html: stageMarkup(stage) }}
      />

      <p className="tabular mt-3 text-xs text-muted-foreground">
        {stage.widthMm === 0
          ? 'No open ulcer'
          : `About ${stage.widthMm}mm across`}
        {stage.pain > 0 && (
          <>
            {' · '}
            <span
              className="mr-1 inline-block h-2 w-2 translate-y-px rounded-full align-baseline"
              style={{ backgroundColor: `hsl(var(--sev-${stage.pain}))` }}
              aria-hidden
            />
            {`pain ${stage.pain}/10`}
          </>
        )}
      </p>

      <p className="mt-3 text-sm text-foreground">{stage.look}</p>
      <p className="mt-2 text-sm text-muted-foreground">{stage.feel}</p>
    </li>
  );
}

export default function StageDiagrams() {
  return (
    <figure className="my-10 rounded-xl border border-border bg-card p-5 sm:p-6">
      <figcaption className="text-subhead">
        The five stages, drawn to one scale
      </figcaption>
      <p className="mt-1 text-sm text-muted-foreground">
        Every diagram uses the same millimetre scale, so the sore really is
        widest at the peak and really is smaller by day eight.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((stage) => (
          <StageCard key={stage.key} stage={stage} />
        ))}
      </ul>
    </figure>
  );
}
