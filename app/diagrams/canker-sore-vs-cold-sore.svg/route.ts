import { comparisonSvg } from '@/components/marketing/diagrams/compare';

/**
 * The side-by-side drawing as a standalone image other sites can embed.
 *
 * SVG for the same reasons as the stage strip: line work at one scale, a few
 * kilobytes, sharp at whatever width someone drops it into, and built from the
 * same `lesionMarkup` as the article so an embedded copy updates when we
 * correct the drawing.
 */
export const dynamic = 'force-static';

export function GET() {
  return new Response(comparisonSvg(), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  });
}
