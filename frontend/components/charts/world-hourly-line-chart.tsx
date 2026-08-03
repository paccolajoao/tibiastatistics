"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { WorldHourlyPoint } from "@/lib/worlds/use-world-hourly";

const chartConfig = {
  avg_players_online: {
    label: "Média de jogadores online",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function WorldHourlyLineChart({ points }: { points: WorldHourlyPoint[] }) {
  const byHour = new Map(points.map((p) => [p.hour_of_day, p.avg_players_online]));
  const data = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${hour}h`,
    avg_players_online: Math.round(byHour.get(hour) ?? 0),
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="hour" tickLine={false} axisLine={false} tickMargin={8} interval={1} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="avg_players_online"
          type="monotone"
          stroke="var(--color-avg_players_online)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
