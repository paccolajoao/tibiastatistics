"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { HuntingSession } from "@/lib/hunting/types";

const chartConfig = {
  balance: {
    label: "Balance",
  },
} satisfies ChartConfig;

const POSITIVE_COLOR = "var(--color-success)";
const NEGATIVE_COLOR = "var(--color-danger)";

export function HuntingBalanceChart({ sessions }: { sessions: HuntingSession[] }) {
  const data = [...sessions]
    .sort((a, b) => new Date(a.session_start).getTime() - new Date(b.session_start).getTime())
    .map((session) => ({
      name: session.name,
      date: new Date(session.session_start).toLocaleDateString("pt-BR"),
      balance: session.balance,
    }));

  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="balance" radius={4}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.balance >= 0 ? POSITIVE_COLOR : NEGATIVE_COLOR}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
