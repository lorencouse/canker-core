import { headers } from 'next/headers';

import { auth } from '@/lib/auth';
import { getSores } from '@/lib/queries';

/**
 * The signed-in user's readings as CSV, one row per reading.
 *
 * Flattened rather than one row per sore, because the parallel arrays a
 * sore stores are not something a spreadsheet can chart. Dates are kept as
 * the ISO strings that were recorded, so the time zone is explicit.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return new Response('Sign in to export.', { status: 401 });

  const sores = await getSores(session.user.id);

  const rows: string[][] = [
    ['sore_id', 'view', 'location', 'x_percent', 'y_percent', 'recorded_at', 'size_mm', 'pain_1_to_10', 'healed_at']
  ];
  for (const sore of sores) {
    const dates = sore.dates ?? [];
    dates.forEach((date, i) => {
      rows.push([
        sore.id,
        sore.view,
        sore.zone,
        sore.x?.toFixed(2) ?? '',
        sore.y?.toFixed(2) ?? '',
        date,
        String(sore.size?.[i] ?? ''),
        String(sore.pain?.[i] ?? ''),
        sore.healed ?? ''
      ]);
    });
  }

  const csv = rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="canker-core-${stamp}.csv"`,
      'cache-control': 'no-store'
    }
  });
}

/** RFC 4180 quoting: wrap anything with a comma, quote or newline. */
function cell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
