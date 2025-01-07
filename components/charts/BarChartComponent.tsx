'use client';
import { Bar, BarChart, XAxis, YAxis, Tooltip, LabelList } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Sore } from '@/types';
import { useSoreContext } from '@/context/SoreContext';
import { getColor } from '@/utils/getColor';

const transformData = (sores: Sore[]) => {
  const dataMap: { [key: string]: any } = {};

  sores.forEach((sore) => {
    if (sore.dates && sore.dates.length > 0) {
      sore.dates.forEach((date, index) => {
        const dateString = new Date(date).toISOString().split('T')[0];
        if (!dataMap[dateString]) {
          dataMap[dateString] = { date: dateString, sores: [] };
        }
        dataMap[dateString].sores.push({
          id: sore.id,
          size: sore.size?.[index] ?? 0
        });
      });
    }
  });

  return Object.values(dataMap);
};

const BarChartComponent = () => {
  const { sores } = useSoreContext();
  const chartData = transformData(sores);

  return (
    <Card className="bg-background text-foreground">
      <CardHeader>
        <CardTitle>Sore History</CardTitle>
        <CardDescription>
          Tooltip with custom formatter and total.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={{}}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}-${date.getDate()}`;
              }}
              label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{
                value: 'Sore Sizes',
                angle: -90,
                position: 'left',
                offset: -15
              }}
            />
            <Tooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[180px] bg-background text-foreground"
                  formatter={(value, name, item, index) => (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px] "
                        style={
                          {
                            '--color-bg': `${getColor(sores[index]?.pain?.[sores[index]?.pain?.length - 1] ?? 0)}`,
                            border: '1px solid foreground'
                          } as React.CSSProperties
                        }
                      />
                      {`Sore ${index + 1}`}
                      <div className="ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums text-foreground">
                        Size:{value}
                        <span className="font-normal text-muted-foreground">
                          mm
                        </span>
                      </div>
                    </>
                  )}
                />
              }
              cursor={false}
            />
            {chartData[0]?.sores.map((_: any, index: number) => (
              <Bar
                key={index}
                dataKey={`sores[${index}].size`}
                stackId="a"
                fill={getColor(
                  sores[index]?.pain?.[sores[index]?.pain?.length - 1] ?? 0
                )}
                stroke="white"
                strokeWidth={1}
                label={`Sore ${index + 1}`}
                radius={5}
                maxBarSize={50}
              >
                <LabelList
                  dataKey={() => `Sore ${index + 1}`}
                  position="center"
                  offset={8}
                  className="fill-[white]"
                  fontSize={14}
                />
              </Bar>
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default BarChartComponent;
