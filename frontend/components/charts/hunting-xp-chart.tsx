"use client";

import { CartesianGrid, Line, LineChart, LabelList, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { HuntingSession } from "@/lib/hunting/types";

const chartConfig = {
  xp_per_hour: {
    label: "XP/h",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

const numberFormatter = new Intl.NumberFormat("pt-BR");

export function HuntingXpChart({ sessions }: { sessions: HuntingSession[] }) {
  const data = [...sessions]
    .sort((a, b) => new Date(a.session_start).getTime() - new Date(b.session_start).getTime())
    .map((session) => ({
      date: new Date(session.session_start).toLocaleDateString("pt-BR"),
      xp_per_hour: session.xp_per_hour,
    }));

  const sparse = data.length <= 2;
  const values = data.map((d) => d.xp_per_hour);
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const margin = Math.max((maxValue - minValue) * 0.3, maxValue * 0.15, 1);

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={data} margin={{ top: 24 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          domain={sparse ? [Math.max(minValue - margin, 0), maxValue + margin] : undefined}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="xp_per_hour"
          type="monotone"
          stroke="var(--color-xp_per_hour)"
          strokeWidth={2}
          dot={{ r: sparse ? 5 : 4 }}
        >
          {sparse ? (
            <LabelList
              dataKey="xp_per_hour"
              position="top"
              offset={12}
              className="fill-foreground text-xs font-medium"
              formatter={(value: string | number | boolean | null | undefined) =>
                typeof value === "number" ? numberFormatter.format(value) : value
              }
            />
          ) : null}
        </Line>
      </LineChart>
    </ChartContainer>
  );
}
