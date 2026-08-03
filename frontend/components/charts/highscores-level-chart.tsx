"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { HighscoreEntry } from "@/lib/tibia/use-highscores";

const chartConfig = {
  level: {
    label: "Level",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function HighscoresLevelChart({ entries }: { entries: HighscoreEntry[] }) {
  const data = entries.slice(0, 10).map((entry) => ({
    name: entry.name,
    level: entry.level,
  }));

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval={0}
          angle={-30}
          textAnchor="end"
          height={60}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="level" fill="var(--color-level)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
