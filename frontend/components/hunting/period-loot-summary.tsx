"use client";

import { useMemo } from "react";

import { AssetList } from "@/components/hunting/asset-list";
import type { HuntingSession } from "@/lib/hunting/types";

function aggregate(entries: { Name: string; Count: number }[][]) {
  const totals = new Map<string, number>();
  for (const list of entries) {
    for (const entry of list) {
      const key = entry.Name.toLowerCase();
      totals.set(key, (totals.get(key) ?? 0) + entry.Count);
    }
  }
  return Array.from(totals.entries())
    .map(([Name, Count]) => ({ Name, Count }))
    .sort((a, b) => b.Count - a.Count);
}

export function PeriodLootSummary({ sessions }: { sessions: HuntingSession[] }) {
  const monsters = useMemo(
    () => aggregate(sessions.map((s) => s.killed_monsters)),
    [sessions],
  );
  const items = useMemo(() => aggregate(sessions.map((s) => s.looted_items)), [sessions]);

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
          Monstros mortos
        </h4>
        {monsters.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro no período.</p>
        ) : (
          <AssetList kind="creature" entries={monsters} />
        )}
      </div>
      <div>
        <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
          Itens lootados
        </h4>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro no período.</p>
        ) : (
          <AssetList kind="item" entries={items} />
        )}
      </div>
    </div>
  );
}
