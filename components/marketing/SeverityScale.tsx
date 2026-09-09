import { SEVERITY_MAX, SEVERITY_MIN } from '@/utils/getColor';

const LEVELS = Array.from(
  { length: SEVERITY_MAX - SEVERITY_MIN + 1 },
  (_, i) => SEVERITY_MIN + i
);

/**
 * The severity ramp, shown once and in full. It is the only saturated colour
 * in the product, so it is worth teaching explicitly rather than leaving the
 * reader to infer it from the dots on the map.
 */
export default function SeverityScale() {
  return (
    <div>
      <div
        className="flex h-24 w-full overflow-hidden rounded-lg border border-border sm:h-28"
        role="img"
        aria-label="Pain scale from 1, barely noticeable, to 10, constant pain."
      >
        {LEVELS.map((level) => (
          <div
            key={level}
            className="flex flex-1 items-end justify-center pb-2"
            style={{ backgroundColor: `hsl(var(--sev-${level}))` }}
          >
            <span
              className="tabular text-xs font-semibold"
              style={{
                // Flip the numeral once the fill is dark enough to swallow it.
                // In dark mode both roles resolve to white.
                color:
                  level >= 7
                    ? 'hsl(var(--sev-ink-hi))'
                    : 'hsl(var(--sev-ink-lo))'
              }}
            >
              {level}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-sm text-muted-foreground">
        <span>Barely noticeable</span>
        <span>Constant pain</span>
      </div>
    </div>
  );
}
