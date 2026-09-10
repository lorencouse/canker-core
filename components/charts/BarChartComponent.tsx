'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { ChartContainer, type ChartConfig } from '@/components/ui/chart';
import { Sore } from '@/types';
import { getSeverityColor } from '@/utils/getColor';
import { useIsDark } from '@/utils/hooks/useIsDark';

/**
 * Local YYYY-MM-DD. Grouping on the UTC day instead would push an evening
 * reading into the next bar, and disagree with the dates shown in the table.
 */
const dayKey = (iso: string) => {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

type Row = { day: string } & Record<string, number | string>;

/**
 * One series per sore, keyed by its id, with a row per day.
 *
 * Keying by id matters: readings are appended per sore, so the nth reading of
 * one sore has nothing to do with the nth reading of another, and lining them
 * up by position produces series that jump between sores.
 */
function buildChart(sores: Sore[]) {
  const byDay = new Map<string, Row>();
  // Per sore, per day: the size and pain recorded that day.
  const painByDay = new Map<string, Map<string, number>>();

  sores.forEach((sore) => {
    const pains = new Map<string, number>();

    sore.readings.forEach((reading) => {
      const day = dayKey(reading.recorded_at);
      if (!byDay.has(day)) byDay.set(day, { day });
      byDay.get(day)![sore.id] = reading.size;
      pains.set(day, reading.pain);
    });

    painByDay.set(sore.id, pains);
  });

  const rows = Array.from(byDay.values()).sort((a, b) =>
    a.day.localeCompare(b.day)
  );

  // Only sores that actually contributed a reading get a series.
  const soreIds = sores
    .map((sore) => sore.id)
    .filter((id) => rows.some((row) => row[id] !== undefined));

  return { rows, soreIds, painByDay };
}

const BarChartComponent = ({ sores }: { sores: Sore[] }) => {
  const isDark = useIsDark();
  const { rows, soreIds, painByDay } = useMemo(
    () => buildChart(sores),
    [sores]
  );

  const config = useMemo<ChartConfig>(
    () =>
      Object.fromEntries(
        soreIds.map((id, index) => [id, { label: `Sore ${index + 1}` }])
      ),
    [soreIds]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-subhead">Size over time</CardTitle>
        <CardDescription>
          One bar per sore per day, in millimetres. Colour is that day&rsquo;s
          pain level.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-12 text-center text-muted-foreground">
            No readings yet.
          </p>
        ) : (
          // Shorter on a phone: the chart shares the screen with a header
          // and the tab bar, and a 280px plot leaves nothing else visible.
          <ChartContainer
            config={config}
            className="h-[220px] w-full sm:h-[280px]"
          >
            <BarChart data={rows} margin={{ left: 0, right: 4, top: 8 }}>
              <CartesianGrid
                vertical={false}
                stroke="hsl(var(--border))"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                // Formatted straight off the YYYY-MM-DD key. Re-parsing it
                // would read as UTC midnight and then print in local time,
                // shifting every label a day earlier west of Greenwich.
                tickFormatter={(value: string) => {
                  const [, month, day] = value.split('-');
                  return `${Number(month)}/${Number(day)}`;
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={34}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value: number) => `${value}`}
                label={{
                  value: 'mm',
                  position: 'insideTopLeft',
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 12
                }}
              />
              {soreIds.map((id) => (
                <Bar
                  key={id}
                  dataKey={id}
                  radius={3}
                  maxBarSize={28}
                  // recharts' animation layer does not render under React 19;
                  // without this the bar groups come out empty.
                  isAnimationActive={false}
                >
                  {rows.map((row) => (
                    <Cell
                      key={`${id}-${row.day}`}
                      fill={getSeverityColor(
                        painByDay.get(id)?.get(row.day) ?? 1,
                        isDark
                      )}
                    />
                  ))}
                </Bar>
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default BarChartComponent;
