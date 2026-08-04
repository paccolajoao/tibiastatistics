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

const metrics: Metric[] = [
  { label: "Balance", direction: "higher", value: (s) => s.balance, format: formatSigned },
  { label: "XP Gain", direction: "higher", value: (s) => s.xp_gain },
  { label: "XP/h", direction: "higher", value: (s) => s.xp_per_hour },
  { label: "Raw XP Gain", direction: "higher", value: (s) => s.raw_xp_gain },
  { label: "Raw XP/h", direction: "higher", value: (s) => s.raw_xp_per_hour },
  { label: "Damage", direction: "higher", value: (s) => s.damage },
  { label: "Damage/h", direction: "higher", value: (s) => s.damage_per_hour },
  { label: "Healing", direction: "higher", value: (s) => s.healing },
  { label: "Healing/h", direction: "higher", value: (s) => s.healing_per_hour },
  { label: "Loot", direction: "higher", value: (s) => s.loot },
  { label: "Supplies", direction: "lower", value: (s) => s.supplies },
];

function bestValue(sessions: HuntingSession[], metric: Metric) {
  const values = sessions.map(metric.value);
  return metric.direction === "higher" ? Math.max(...values) : Math.min(...values);
}

export function HuntComparisonCards({ sessions }: { sessions: HuntingSession[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${sessions.length}, minmax(220px, 1fr))` }}
      >
        {sessions.map((session) => (
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
                      {metric.format
                        ? metric.format(value)
                        : numberFormatter.format(value)}
                    </span>
                  </div>
                );
              })}

              <div className="flex items-center justify-between rounded-md px-2 py-1 text-sm">
                <span className="text-muted-foreground">Monstros mortos</span>
                <span className="font-medium">
                  {numberFormatter.format(
                    session.killed_monsters.reduce((sum, m) => sum + m.Count, 0),
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-md px-2 py-1 text-sm">
                <span className="text-muted-foreground">Itens únicos</span>
                <span className="font-medium">{session.looted_items.length}</span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-1 justify-start px-2"
                onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
              >
                {expandedId === session.id ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
                Ver loot completo
              </Button>

              {expandedId === session.id ? (
                <div className="flex flex-col gap-4 border-t pt-3">
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                      Monstros mortos
                    </h4>
                    <AssetList kind="creature" entries={session.killed_monsters} />
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
                      Itens lootados
                    </h4>
                    <AssetList kind="item" entries={session.looted_items} />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
