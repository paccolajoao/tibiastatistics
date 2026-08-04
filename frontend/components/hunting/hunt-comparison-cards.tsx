"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { AssetList } from "@/components/hunting/asset-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HuntingSession } from "@/lib/hunting/types";

const numberFormatter = new Intl.NumberFormat("pt-BR");

type MetricDirection = "higher" | "lower";

type Metric = {
  label: string;
  direction: MetricDirection;
  value: (session: HuntingSession) => number;
  format?: (value: number) => string;
};

function formatSigned(value: number) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${numberFormatter.format(Math.abs(value))}`;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}h ${minutes}min`;
}

function perHour(value: number, seconds: number) {
  if (seconds <= 0) return 0;
  return Math.round(value / (seconds / 3600));
}

const metrics: Metric[] = [
  {
    label: "Balance/h",
    direction: "higher",
    value: (s) => perHour(s.balance, s.session_length_seconds),
    format: formatSigned,
  },
  { label: "XP/h", direction: "higher", value: (s) => s.xp_per_hour },
  { label: "Raw XP/h", direction: "higher", value: (s) => s.raw_xp_per_hour },
  { label: "Damage/h", direction: "higher", value: (s) => s.damage_per_hour },
  { label: "Healing/h", direction: "higher", value: (s) => s.healing_per_hour },
  {
    label: "Loot/h",
    direction: "higher",
    value: (s) => perHour(s.loot, s.session_length_seconds),
  },
  {
    label: "Supplies/h",
    direction: "lower",
    value: (s) => perHour(s.supplies, s.session_length_seconds),
  },
];

function bestValue(sessions: HuntingSession[], metric: Metric) {
  const values = sessions.map(metric.value);
  return metric.direction === "higher" ? Math.max(...values) : Math.min(...values);
}

export function HuntComparisonCards({ sessions }: { sessions: HuntingSession[] }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${sessions.length}, minmax(220px, 1fr))` }}
      >
        {sessions.map((session) => {
          const monsters = [...session.killed_monsters].sort((a, b) => b.Count - a.Count);
          const items = [...session.looted_items].sort((a, b) => b.Count - a.Count);

          return (
            <Card key={session.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{session.name}</CardTitle>
                {session.loadout ? (
                  <Badge variant="secondary" className="w-fit">
                    {session.loadout}
                  </Badge>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {new Date(session.session_start).toLocaleDateString("pt-BR")} ·{" "}
                  {formatDuration(session.session_length_seconds)}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 pt-0">
                {metrics.map((metric) => {
                  const value = metric.value(session);
                  const best = bestValue(sessions, metric);
                  const isBest = value === best && sessions.length > 1;
                  return (
                    <div
                      key={metric.label}
                      className={`flex items-center justify-between rounded-md px-2 py-1 text-sm ${
                        isBest ? "bg-emerald-600/10 text-emerald-700 dark:text-emerald-400" : ""
                      }`}
                    >
                      <span className="text-muted-foreground">{metric.label}</span>
                      <span className="font-medium">
                        {metric.format ? metric.format(value) : numberFormatter.format(value)}
                      </span>
                    </div>
                  );
                })}

                <div className="flex items-center justify-between rounded-md px-2 py-1 text-sm">
                  <span className="text-muted-foreground">Monstros mortos</span>
                  <span className="font-medium">
                    {numberFormatter.format(monsters.reduce((sum, m) => sum + m.Count, 0))}
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-md px-2 py-1 text-sm">
                  <span className="text-muted-foreground">Itens únicos</span>
                  <span className="font-medium">{items.length}</span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-1 justify-start px-2"
                  onClick={() => toggleExpanded(session.id)}
                >
                  {expandedIds.has(session.id) ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                  Ver loot completo
                </Button>

                {expandedIds.has(session.id) ? (
                  <div className="flex flex-col gap-4 border-t pt-3">
                    <div>
                      <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                        Monstros mortos
                      </h4>
                      <AssetList kind="creature" entries={monsters} />
                    </div>
                    <div>
                      <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                        Itens lootados
                      </h4>
                      <AssetList kind="item" entries={items} />
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
