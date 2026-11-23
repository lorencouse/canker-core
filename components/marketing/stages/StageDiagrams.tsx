import { cn } from '@/utils/cn';
import { sevFill } from '@/utils/severity';
import { CELL, STAGES, type Stage, stageMarkup } from './stages';

/**
 * The stage set as it appears in the article.
 *
 * A row on desktop, a stack on mobile — the same five drawings that the
 * standalone SVG carries, from the same `stageMarkup`, so the embedded copy
 * and the page copy can never disagree.
 */
function StageCard({ stage, wide }: { stage: Stage; wide: boolean }) {
  return (
    // `wide`: the odd one out at two columns spans the row rather than
    // sitting alone in it, but its drawing keeps a single card's width, or
    // it would be twice the scale of the others.
    <li
      className={cn(
        'rounded-lg border border-border bg-card p-4',
        wide && 'sm:max-lg:col-span-2'
      )}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-foreground">{stage.name}</h3>
        <span className="tabular text-xs text-muted-foreground">
          {stage.days}
        </span>
      </div>

      <svg
        viewBox={`${-CELL.width / 2} ${-CELL.height / 2} ${CELL.width} ${CELL.height}`}
        className={cn(
          'mt-3 w-full',
          wide && 'sm:max-lg:mx-auto sm:max-lg:w-[calc(50%-0.5rem)]'
        )}
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
              style={{ backgroundColor: sevFill(stage.pain) }}
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
    // No card around the cards: the stage cards are the containers, and a
    // card holding cards only added a border to look past. The caption is
    // the h2 the stage h3s hang from, so the outline skips no level.
    <figure className="my-10">
      <figcaption>
        <h2 className="text-subhead">The five stages, drawn to one scale</h2>
      </figcaption>
      <p className="mt-1 text-sm text-muted-foreground">
        Every diagram uses the same millimetre scale, so the sore really is
        widest at the peak and really is smaller by day eight.
      </p>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STAGES.map((stage, i) => (
          <StageCard
            key={stage.key}
            stage={stage}
            wide={i === STAGES.length - 1 && STAGES.length % 2 === 1}
          />
        ))}
      </ul>
    </figure>
  );
}
