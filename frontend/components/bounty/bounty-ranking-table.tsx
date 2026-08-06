"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_LABELS } from "@/lib/bounty/tiers";
import type { BountyPoolEntry } from "@/lib/bounty/use-bounty-tier-pool";
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

export function BountyRankingTable({
  ranked,
  requiredKills,
}: {
  ranked: BountyPoolEntry[];
  requiredKills: number;
}) {
  if (ranked.length === 0) return null;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Criatura</TableHead>
          <TableHead>Dificuldade</TableHead>
          <TableHead className="text-right">Kills/h</TableHead>
          <TableHead className="text-right">Balance/h</TableHead>
          <TableHead className="text-right">Tempo estimado</TableHead>
          <TableHead className="text-right">Sessões</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {ranked.map((entry) => (
          <TableRow key={entry.name}>
            <TableCell className="font-medium">{capitalize(entry.name)}</TableCell>
            <TableCell>
              <Badge variant="secondary" className="text-[10px]">
                {DIFFICULTY_LABELS[entry.difficulty] ?? entry.difficulty}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              {numberFormatter.format(Math.round(entry.killsPerHour))}
            </TableCell>
            <TableCell
              className={cn(
                "text-right",
                entry.balancePerHour >= 0 ? "text-success" : "text-danger",
              )}
            >
              {formatSigned(entry.balancePerHour)}
            </TableCell>
            <TableCell className="text-right">
              {formatHours(requiredKills / entry.killsPerHour)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {entry.sessionCount}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
