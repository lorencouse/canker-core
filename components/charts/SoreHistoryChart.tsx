'use client';

import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import type { Sore } from '@/types';
import { getSeverityColor } from '@/utils/getColor';
import { useIsDark } from '@/utils/hooks/useIsDark';
import { dayKey } from '@/utils/readings';

/**
 * One sore's course: width by day as a line, each point coloured by that
 * day's pain. Size and pain have different scales and would need two axes
 * to plot together, so pain rides on the marker colour — the same encoding
 * the map and the bar chart use, which means nothing new to learn.
 */
export default function SoreHistoryChart({ sore }: { sore: Sore }) {
  const isDark = useIsDark();
  const rows = useMemo(
    () =>
      sore.readings.map((r, i) => ({
        day: dayKey(new Date(r.recorded_at)),
        n: Math.floor((new Date(r.recorded_at).getTime() - new Date(sore.created_at).getTime()) / 86_400_000) + 1,
        size: r.size,
        pain: r.pain,
        note: r.note,
        first: i === 0
      })),
    [sore]
  );

  if (rows.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        One reading so far. The curve appears once there are two.
      </p>
    );
  }

  const config: ChartConfig = { size: { label: 'Width' } };

  return (
    <ChartContainer config={config} className="h-[180px] w-full">
      <LineChart data={rows} margin={{ left: 0, right: 12, top: 12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 3" />
        <XAxis
          dataKey="n"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          tickFormatter={(n: number) => `Day ${n}`}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={34}
          domain={[0, 'dataMax + 2']}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
          label={{
            value: 'mm',
            position: 'insideTopLeft',
            fill: 'hsl(var(--muted-foreground))',
            fontSize: 12
          }}
        />
        <ChartTooltip
          cursor={{ stroke: 'hsl(var(--border))' }}
          content={({ active, payload }) => {
            const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
            if (!active || !row) return null;
            return (
              <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                <p className="font-medium">
                  Day {row.n} <span className="text-muted-foreground">· {row.day}</span>
                </p>
                <p className="tabular mt-1">
                  {row.size} mm · pain {row.pain} of 10
                </p>
                {row.note && <p className="mt-1 max-w-56 text-muted-foreground">{row.note}</p>}
              </div>
            );
          }}
        />
        <Line
          type="monotone"
          dataKey="size"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          isAnimationActive={false}
          dot={(props: { cx?: number; cy?: number; payload?: { pain: number }; index?: number }) => (
            <circle
              key={props.index}
              cx={props.cx}
              cy={props.cy}
              r={5}
              fill={getSeverityColor(props.payload?.pain ?? 1, isDark)}
              stroke="hsl(var(--card))"
              strokeWidth={2}
            />
          )}
          activeDot={{ r: 7, stroke: 'hsl(var(--foreground))', strokeWidth: 1 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
