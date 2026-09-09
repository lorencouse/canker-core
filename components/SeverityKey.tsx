import { SEVERITY_MAX, SEVERITY_MIN } from '@/utils/getColor';

const LEVELS = Array.from(
  { length: SEVERITY_MAX - SEVERITY_MIN + 1 },
  (_, i) => SEVERITY_MIN + i
);

/**
 * A compact form of the pain ramp, shown next to the map so a dot's colour is
 * readable without leaving the page.
 */
export default function SeverityKey() {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">Pain</span>
      <div
        className="flex h-2.5 flex-1 overflow-hidden rounded-full"
        role="img"
        aria-label="Pain scale from 1 to 10, pale to deep red."
      >
        {LEVELS.map((level) => (
          <div
            key={level}
            className="flex-1"
            style={{ backgroundColor: `hsl(var(--sev-${level}))` }}
          />
        ))}
      </div>
      <span className="tabular text-xs text-muted-foreground">1–10</span>
    </div>
  );
}
