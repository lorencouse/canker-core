'use client';

import Link from 'next/link';
import { useId, useRef, useState } from 'react';

import { MapDefs, ViewArtwork } from '@/components/mouth-map/artwork';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import {
  VIEW_LABELS,
  ZONE_ANCHORS,
  viewBoxAttr,
  zoneAt
} from '@/utils/mouth-map/geometry';

import { MOUTH_SITES, SITE_BY_ZONE } from './sites';

/**
 * The signed-out mouth map: the same artwork and the same zone hit-testing
 * the app uses, with the site's own writing attached to each site instead of
 * a sore.
 *
 * Two things are deliberate. Choosing a site *is* choosing a view, rather
 * than there being a separate view control — the reader is looking for a
 * place in their mouth, not for one of three drawings, and a control they
 * have to understand first is a control in the way. And every site's text is
 * in the HTML at once, with the unselected ones hidden, so the page reads
 * whole to a crawler and to anyone whose JavaScript never arrives; the
 * interaction only decides which panel is visible.
 *
 * The markers are the teal action colour, never the --sev-* ramp: nothing
 * here is a pain value, and red on this map means a measurement.
 */
/**
 * Where a marker sits relative to its zone's anchor, in drawing units.
 *
 * The anchors are computed from the hit-testing, so they are honest about
 * which zone a point is in — but the artwork draws teeth *over* the gum band
 * and a label over the palate, so an honest point can land on a tooth crown
 * and read as pointing at the wrong thing. These nudges move the marker onto
 * the part of its own zone that is actually visible. Anything not listed
 * needs none.
 */
const NUDGE: Record<string, { dx: number; dy: number }> = {
  'Upper gums': { dx: 0, dy: -22 },
  'Lower gums': { dx: 0, dy: 22 },
  'Roof of mouth': { dx: 0, dy: 16 },
  'Back of mouth': { dx: 0, dy: 8 }
};

export default function MouthMapExplorer() {
  const [siteKey, setSiteKey] = useState(MOUTH_SITES[0].key);
  const svgRef = useRef<SVGSVGElement>(null);
  const idPrefix = useId().replace(/:/g, '');

  const site = MOUTH_SITES.find((s) => s.key === siteKey) ?? MOUTH_SITES[0];
  const view = site.view;

  /** Every marker the current view can show, and which site it belongs to. */
  const markers = ZONE_ANCHORS[view].flatMap((anchor) => {
    const target = SITE_BY_ZONE[anchor.zone];
    if (!target) return [];
    const nudge = NUDGE[anchor.zone] ?? { dx: 0, dy: 0 };
    return [
      {
        zone: anchor.zone,
        site: target,
        x: anchor.point.x + nudge.dx,
        y: anchor.point.y + nudge.dy
      }
    ];
  });

  /** A tap on the tissue selects the site that owns the zone it landed in. */
  const selectFromPointer = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return;
    const point = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
    const zone = zoneAt(view, point);
    const target = zone ? SITE_BY_ZONE[zone] : undefined;
    if (target) setSiteKey(target.key);
  };

  return (
    <div className="not-prose my-10">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Site">
        {MOUTH_SITES.map((option) => {
          const selected = option.key === site.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setSiteKey(option.key)}
              aria-pressed={selected}
              aria-controls={`${idPrefix}-${option.key}`}
              className={cn(
                'rounded-full border px-3 py-2 text-sm transition-colors',
                'min-h-11 sm:min-h-0 sm:py-1.5',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-6 sm:grid-cols-[minmax(0,17rem)_minmax(0,1fr)] sm:items-start">
        <figure className="m-0">
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <svg
              ref={svgRef}
              viewBox={viewBoxAttr}
              className="block h-full w-full cursor-pointer"
              role="img"
              aria-label={`${VIEW_LABELS[view]} view of the mouth, with ${site.name} marked.`}
              onClick={(event) =>
                selectFromPointer(event.clientX, event.clientY)
              }
            >
              <MapDefs p={idPrefix} />
              <ViewArtwork view={view} p={idPrefix} />
              {markers.map((marker) => {
                const selected = marker.site.key === site.key;
                return (
                  <g key={marker.zone} style={{ pointerEvents: 'none' }}>
                    {selected && (
                      <circle
                        cx={marker.x}
                        cy={marker.y}
                        r="13"
                        fill="hsl(var(--primary))"
                        opacity="0.22"
                      />
                    )}
                    <circle
                      cx={marker.x}
                      cy={marker.y}
                      r={selected ? 5.5 : 3.5}
                      fill={
                        selected ? 'hsl(var(--primary))' : 'hsl(var(--card))'
                      }
                      stroke="hsl(var(--primary))"
                      strokeWidth="1.5"
                      opacity={selected ? 1 : 0.6}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
          <figcaption className="mt-2 text-sm text-muted-foreground">
            {VIEW_LABELS[view]} view. Tap anywhere on the tissue to move.
          </figcaption>
        </figure>

        <div>
          {MOUTH_SITES.map((option) => (
            <section
              key={option.key}
              id={`${idPrefix}-${option.key}`}
              hidden={option.key !== site.key}
            >
              <h3 className="text-subhead">{option.label}</h3>
              <dl className="mt-4 space-y-4">
                <div>
                  <dt className="text-sm font-semibold text-foreground">
                    What is there
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    {option.tissue}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-foreground">
                    What rubs it
                  </dt>
                  <dd className="mt-1 text-muted-foreground">{option.rubs}</dd>
                </div>
                <div>
                  <dt className="text-sm font-semibold text-foreground">
                    What a sore there usually does
                  </dt>
                  <dd className="mt-1 text-muted-foreground">
                    {option.course}
                  </dd>
                </div>
              </dl>

              {option.threshold && (
                <p className="mt-4 rounded-md bg-muted/60 p-3 text-sm text-foreground">
                  {option.threshold}
                </p>
              )}

              {option.article && (
                <Button asChild size="sm" variant="outline" className="mt-5">
                  <Link href={`/blog/${option.article.slug}`}>
                    {option.article.label}
                  </Link>
                </Button>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
