"use client";

import { Fragment, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronRight, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CharacterSelect } from "@/components/characters/character-select";
import { HuntingSessionDetails } from "@/components/hunting/hunting-session-details";
import { useCharacters } from "@/lib/characters/use-characters";
import { useAssignHuntingSessionCharacter } from "@/lib/hunting/use-assign-hunting-session-character";
import { useDeleteHuntingSession } from "@/lib/hunting/use-delete-hunting-session";
import type { HuntingSession } from "@/lib/hunting/types";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("pt-BR");

function formatSignedNumber(value: number) {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${numberFormatter.format(Math.abs(value))}`;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return `${hours}h ${minutes}min`;
}

export function HuntingSessionsTable({ sessions }: { sessions: HuntingSession[] }) {
  const { mutate: deleteSession, isPending } = useDeleteHuntingSession();
  const { mutate: assignCharacter } = useAssignHuntingSessionCharacter();
  const { data: characters } = useCharacters();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const characterById = new Map((characters ?? []).map((c) => [c.id, c]));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8" />
          <TableHead>Nome</TableHead>
          <TableHead>Personagem</TableHead>
          <TableHead>Set</TableHead>
          <TableHead>Data</TableHead>
          <TableHead>Duração</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead className="text-right">XP Gain</TableHead>
          <TableHead className="text-right">XP/h</TableHead>
          <TableHead className="text-right">Loot</TableHead>
          <TableHead className="text-right">Supplies</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => {
          const isExpanded = expandedId === session.id;
          const character = session.character_id ? characterById.get(session.character_id) : undefined;
          return (
            <Fragment key={session.id}>
              <TableRow
                onClick={() => setExpandedId(isExpanded ? null : session.id)}
                className="cursor-pointer"
                data-state={isExpanded ? "selected" : undefined}
              >
                <TableCell>
                  {isExpanded ? (
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  )}
                </TableCell>
                <TableCell className="font-medium">{session.name}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {character ? (
                    <Badge variant="secondary">{character.name}</Badge>
                  ) : (
                    <CharacterSelect
                      characters={characters ?? []}
                      value=""
                      onChange={(characterId) =>
                        assignCharacter({ sessionId: session.id, characterId })
                      }
                      placeholder="Vincular personagem"
                      size="sm"
                      className="w-[180px]"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {session.loadout ? (
                    <Badge variant="secondary">{session.loadout}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(session.session_start).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDuration(session.session_length_seconds)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 font-medium",
                      session.balance >= 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {session.balance >= 0 ? (
                      <ArrowUpRight className="size-3.5" />
                    ) : (
                      <ArrowDownRight className="size-3.5" />
                    )}
                    {formatSignedNumber(session.balance)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {numberFormatter.format(session.xp_gain)}
                </TableCell>
                <TableCell className="text-right">
                  {numberFormatter.format(session.xp_per_hour)}
                </TableCell>
                <TableCell className="text-right">{numberFormatter.format(session.loot)}</TableCell>
                <TableCell className="text-right">
                  {numberFormatter.format(session.supplies)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </TableCell>
              </TableRow>
              {isExpanded ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={11} className="bg-muted/30 p-0">
                    <HuntingSessionDetails session={session} />
                  </TableCell>
                </TableRow>
              ) : null}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
