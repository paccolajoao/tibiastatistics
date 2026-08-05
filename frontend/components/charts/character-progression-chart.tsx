"use client";

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { CharacterSnapshot } from "@/lib/characters/types";

const chartConfig = {
  level: {
    label: "Level",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function CharacterProgressionChart({ snapshots }: { snapshots: CharacterSnapshot[] }) {
  const data = snapshots.map((snapshot) => ({
    date: new Date(snapshot.captured_at).toLocaleDateString("pt-BR"),
    level: snapshot.level,
  }));

  const levels = data.map((d) => d.level);
  const maxLevel = levels.length > 0 ? Math.max(...levels) : 0;
  const minLevel = levels.length > 0 ? Math.min(...levels) : 0;
  const margin = Math.max((maxLevel - minLevel) * 0.3, 2);

  return (
    <ChartContainer config={chartConfig} className="h-[260px] w-full">
      <LineChart data={data} margin={{ top: 24 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis
          tickLine={false}
          axisLine={false}
          domain={[Math.max(minLevel - margin, 0), maxLevel + margin]}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="level"
          type="monotone"
          stroke="var(--color-level)"
          strokeWidth={2}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
