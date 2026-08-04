"use client";

import { AssetList } from "@/components/hunting/asset-list";
import type { HuntingSession } from "@/lib/hunting/types";

export function HuntingSessionDetails({ session }: { session: HuntingSession }) {
  const monsters = [...session.killed_monsters].sort((a, b) => b.Count - a.Count);
  const items = [...session.looted_items].sort((a, b) => b.Count - a.Count);

  return (
    <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2">
      <div>
        <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
          Monstros mortos
        </h4>
        {monsters.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro.</p>
        ) : (
          <AssetList kind="creature" entries={monsters} />
        )}
      </div>
      <div>
        <h4 className="mb-2 text-xs font-medium text-muted-foreground uppercase">
          Itens lootados
        </h4>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum registro.</p>
        ) : (
          <AssetList kind="item" entries={items} />
        )}
      </div>
    </div>
  );
}
