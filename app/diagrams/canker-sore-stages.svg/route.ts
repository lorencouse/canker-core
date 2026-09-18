import { stripSvg } from '@/components/marketing/stages/stages';

/**
 * The stage set as a standalone image other sites can embed.
 *
 * Served as SVG rather than PNG because it is line work at one scale: it stays
 * sharp at whatever width someone drops it into, and it is a few kilobytes.
 * Built from the same `stageMarkup` as the article, so an embedded copy on
 * someone else's blog updates when we correct the drawing.
 */
export const dynamic = 'force-static';

export function GET() {
  return new Response(stripSvg(), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Long cache with revalidation: embedders hotlink this, and the content
      // changes about never.
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  });
}
