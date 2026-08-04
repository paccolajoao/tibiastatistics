"use client";

import { useMemo } from "react";

import { GameSprite } from "@/components/hunting/game-sprite";
import { useSprites } from "@/lib/hunting/use-sprites";

const numberFormatter = new Intl.NumberFormat("pt-BR");

export function AssetList({
  kind,
  entries,
}: {
  kind: "creature" | "item";
  entries: { Name: string; Count: number }[];
}) {
  const names = useMemo(() => entries.map((e) => e.Name), [entries]);
  const { data: sprites } = useSprites(kind, names);

  return (
    <ul className="flex flex-col gap-1.5">
      {entries.map((entry) => (
        <li key={entry.Name} className="flex items-center gap-2 text-sm">
          <GameSprite kind={kind} url={sprites?.[entry.Name.toLowerCase()]} alt={entry.Name} />
          <span className="capitalize">{entry.Name}</span>
          <span className="ml-auto text-muted-foreground">
            {numberFormatter.format(entry.Count)}x
          </span>
        </li>
      ))}
    </ul>
  );
}
