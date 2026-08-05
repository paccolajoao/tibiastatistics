"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, MoreVertical, RefreshCw, Shield, Trash2, Trophy } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteCharacterDialog } from "@/components/characters/delete-character-dialog";
import { useRefreshCharacter } from "@/lib/characters/use-refresh-character";
import { getVocationMeta } from "@/lib/characters/vocation";
import type { Character } from "@/lib/characters/types";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("pt-BR");

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export function CharacterCard({ character }: { character: Character }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { mutate: refresh, isPending: isRefreshing } = useRefreshCharacter();
  const { icon: VocationIcon, colorClass, textClass } = getVocationMeta(character.vocation);

  return (
    <>
      <Card>
        <CardContent className="flex flex-col gap-3 py-1">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/characters/${character.id}`} className="flex flex-1 items-center gap-3">
              <Avatar size="lg" className={cn("shrink-0", colorClass)}>
                <AvatarFallback className={colorClass}>
                  <VocationIcon className="size-4.5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="flex items-center gap-1.5 font-medium">
                  {character.name}
                  {character.is_main ? (
                    <Crown className="size-3.5 text-warning" />
                  ) : null}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Trophy className="size-3.5" />
                    {numberFormatter.format(character.level)}
                  </span>
                  <span className={cn("inline-flex items-center gap-1", textClass)}>
                    <VocationIcon className="size-3.5" />
                    {character.vocation}
                  </span>
                </span>
              </div>
            </Link>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="size-8 shrink-0">
                    <MoreVertical className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  disabled={isRefreshing}
                  onClick={() => refresh(character.id)}
                >
                  <RefreshCw className={cn("size-4", isRefreshing && "animate-spin")} />
                  Atualizar dados
                </DropdownMenuItem>
                <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="size-4" />
                  Remover
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">{character.world}</Badge>
            {character.guild_name ? (
              <Badge variant="secondary">
                <Shield className="size-3" />
                {character.guild_name}
              </Badge>
            ) : null}
            {character.account_status === "Premium Account" ? (
              <Badge variant="success">Premium</Badge>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            Sincronizado {relativeTime(character.last_synced_at)}
          </p>
        </CardContent>
      </Card>

      <DeleteCharacterDialog
        characterId={character.id}
        characterName={character.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
