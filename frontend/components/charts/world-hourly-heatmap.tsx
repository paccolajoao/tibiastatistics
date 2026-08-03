"use client";

import { useMemo } from "react";

import type { WorldHourlyPoint } from "@/lib/worlds/use-world-hourly";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function intensityColor(ratio: number) {
  // ratio 0..1 -> interpolate from muted (empty) to chart-1 (full)
  const clamped = Math.max(0, Math.min(1, ratio));
  return `color-mix(in oklch, var(--chart-1) ${Math.round(clamped * 100)}%, var(--muted) ${Math.round(
    (1 - clamped) * 100,
  )}%)`;
}

export function WorldHourlyHeatmap({
  points,
  onSelectWorld,
}: {
  points: WorldHourlyPoint[];
  onSelectWorld?: (world: string) => void;
}) {
  const { worlds, maxValue, grid } = useMemo(() => {
    const worldSet = Array.from(new Set(points.map((p) => p.world_name))).sort();
    const map = new Map<string, Map<number, number>>();
    let max = 0;

    for (const point of points) {
      if (!map.has(point.world_name)) {
        map.set(point.world_name, new Map());
      }
      map.get(point.world_name)!.set(point.hour_of_day, point.avg_players_online);
      if (point.avg_players_online > max) max = point.avg_players_online;
    }

    return { worlds: worldSet, maxValue: max || 1, grid: map };
  }, [points]);

  if (worlds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ainda não há dados suficientes para este período.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <div
          className="grid gap-px text-[10px] text-muted-foreground"
          style={{ gridTemplateColumns: `120px repeat(24, minmax(20px, 1fr))` }}
        >
          <div />
          {HOURS.map((hour) => (
            <div key={hour} className="text-center pb-1">
              {hour}h
            </div>
          ))}

          {worlds.map((world) => (
            <div key={world} className="contents">
              <button
                type="button"
                onClick={() => onSelectWorld?.(world)}
                className="truncate pr-2 text-left text-xs font-medium text-foreground hover:underline"
                title={world}
              >
                {world}
              </button>
              {HOURS.map((hour) => {
                const value = grid.get(world)?.get(hour);
                return (
                  <div
                    key={hour}
                    className="aspect-square rounded-sm"
                    style={{
                      backgroundColor:
                        value === undefined ? "var(--muted)" : intensityColor(value / maxValue),
                    }}
                    title={
                      value === undefined
                        ? `${world} — ${hour}h: sem dados`
                        : `${world} — ${hour}h: ${Math.round(value)} jogadores em média`
                    }
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
