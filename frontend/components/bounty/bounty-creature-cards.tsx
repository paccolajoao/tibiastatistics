"use client";

import { useMemo, useState } from "react";
import { Clock, Coins, RefreshCcw, Swords, Trophy } from "lucide-react";

import { GameSprite } from "@/components/hunting/game-sprite";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DIFFICULTY_LABELS } from "@/lib/bounty/tiers";
import type { BountyPoolEntry } from "@/lib/bounty/use-bounty-tier-pool";
import { useSprites } from "@/lib/hunting/use-sprites";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("pt-BR");

function formatSigned(value: number) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${numberFormatter.format(Math.round(Math.abs(value)))}`;
}

function formatHours(hours: number) {
  if (!Number.isFinite(hours)) return "—";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}min`;
}

function capitalize(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function BountyCreatureCards({
  pool,
  requiredKills,
}: {
  pool: BountyPoolEntry[];
  requiredKills: number;
}) {
  const [offset, setOffset] = useState(0);
  const names = useMemo(() => pool.map((p) => p.name), [pool]);
  const { data: sprites } = useSprites("creature", names);

  if (pool.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <Swords className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Nenhuma criatura com histórico suficiente para este tier. Cace mais para
            desbloquear recomendações.
          </p>
        </CardContent>
      </Card>
    );
  }

  const visible = Array.from({ length: Math.min(3, pool.length) }, (_, i) => {
    return pool[(offset + i) % pool.length];
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">
          Melhores escolhas para sua bounty
        </h2>
        {pool.length > 3 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setOffset((o) => (o + 3) % pool.length)}
          >
            <RefreshCcw className="size-3.5" />
            Rerolar
          </Button>
        ) : null}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {visible.map((entry, i) => (
          <Card key={entry.name} className={cn(i === 0 && "border-primary/50")}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <GameSprite kind="creature" url={sprites?.[entry.name]} alt={entry.name} />
                <div className="flex flex-col">
                  <CardTitle className="text-base">{capitalize(entry.name)}</CardTitle>
                  <Badge variant="secondary" className="w-fit text-[10px]">
                    {DIFFICULTY_LABELS[entry.difficulty] ?? entry.difficulty}
                  </Badge>
                </div>
                {i === 0 ? (
                  <Trophy className="ml-auto size-4 text-amber-500" />
                ) : null}
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Swords className="size-3.5" /> Kills/h
                </span>
                <span className="font-medium">{numberFormatter.format(Math.round(entry.killsPerHour))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5" /> Tempo estimado
                </span>
                <span className="font-medium">
                  {formatHours(requiredKills / entry.killsPerHour)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Coins className="size-3.5" /> Balance/h
                </span>
                <span
                  className={cn(
                    "font-medium",
                    entry.balancePerHour >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {formatSigned(entry.balancePerHour)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
