import * as React from 'react';
import { useMemo } from 'react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useUIContext } from '@/Context/UiContext';

const XAxisWithDefaults = ({ dataKey = 'date', ...restProps }) => {
  return <XAxis dataKey={dataKey} {...restProps} />;
};

const YAxisWithDefaults = ({ domain = [0, 10], ...restProps }) => {
  return <YAxis domain={domain} {...restProps} />;
};

export default function ChartHistory() {
  const { sores } = useUIContext();
  const [timeRange, setTimeRange] = React.useState('90d');

  const chartData = useMemo(() => {
    const now = new Date();
    let daysToSubtract = 90;
    if (timeRange === '30d') {
      daysToSubtract = 30;
    } else if (timeRange === '7d') {
      daysToSubtract = 7;
    }
    const startDate = new Date(
      now.getTime() - daysToSubtract * 24 * 60 * 60 * 1000
    );

    const data = {};
    sores.forEach((sore) => {
      sore.updated.forEach((date, index) => {
        const updatedDate = new Date(date);
        if (updatedDate >= startDate) {
          const dateString = updatedDate.toISOString().split('T')[0];
          if (!data[dateString]) {
            data[dateString] = { date: dateString };
          }
          data[dateString][sore.id] = sore.pain[index];
        }
      });
    });

    return Object.values(data).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [sores, timeRange]);

  const chartConfig = useMemo(() => {
    const config = {
      visitors: {
        label: 'Sores',
      },
    };
    sores.forEach((sore, index) => {
      config[sore.id] = {
        label: `Sore ${index + 1}`,
        color: `hsl(var(--chart-${index + 1}))`,
      };
    });
    return config;
  }, [sores]);

  return (
    <div className="sore-history">
      {sores && sores.length > 0 && (
        <Card>
          <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
            <div className="grid flex-1 gap-1 text-center sm:text-left">
              <CardTitle>History</CardTitle>
            </div>
            <CardDescription>Showing sores for</CardDescription>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="w-[160px] rounded-lg sm:ml-auto"
                aria-label="Select a value"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-[250px] w-full"
            >
              <LineChart data={chartData}>
                <defs className="flex flex-row flex-wrap">
                  {sores.map((sore) => (
                    <linearGradient
                      key={sore.id}
                      id={`fill${sore.id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={chartConfig[sore.id].color}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor={chartConfig[sore.id].color}
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} />
                <XAxisWithDefaults
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    });
                  }}
                />
                <YAxisWithDefaults />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => {
                        return new Date(value).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        });
                      }}
                      indicator="dot"
                      formatter={(value, name) => {
                        const sore = sores.find((s) => s.id === name);
                        return [
                          `Pain: ${value}, Size: ${sore.size[sore.size.length - 1]}mm`,
                          chartConfig[name].label,
                        ];
                      }}
                    />
                  }
                />
                {sores.map((sore, index) => (
                  <Line
                    key={sore.id}
                    dataKey={sore.id}
                    type="natural"
                    stroke={chartConfig[sore.id].color}
                    strokeWidth={1}
                    dot={{
                      fill: `var(--color-sore-${index + 1})`,
                      r: 2,
                    }}
                    activeDot={{
                      r: sore.size[sore.size.length - 1],
                    }}
                  />
                ))}
                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
