"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { WorldAverage } from "@/lib/worlds/use-world-averages";

const chartConfig = {
  avg_players_online: {
    label: "Média de jogadores online",
  },
  "Optional PvP": {
    label: "Optional PvP",
    color: "var(--chart-1)",
  },
  "Open PvP": {
    label: "Open PvP",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function WorldAverageChart({ averages }: { averages: WorldAverage[] }) {
  const data = averages.map((entry) => ({
    world_name: entry.world_name,
    avg_players_online: Math.round(entry.avg_players_online),
    pvp_type: entry.pvp_type,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[400px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="world_name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          angle={-45}
          textAnchor="end"
          height={70}
        />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="avg_players_online" radius={4}>
          {data.map((entry) => (
            <Cell
              key={entry.world_name}
              fill={
                entry.pvp_type === "Open PvP" ? "var(--chart-2)" : "var(--chart-1)"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
