"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Coins, Crown, Shield, Swords, Trophy, Zap } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CharacterProgressionChart } from "@/components/charts/character-progression-chart";
import { HuntingBalanceChart } from "@/components/charts/hunting-balance-chart";
import { HuntingXpChart } from "@/components/charts/hunting-xp-chart";
import { HuntingSessionsTable } from "@/components/hunting/hunting-sessions-table";
import { useCharacter } from "@/lib/characters/use-character";
import { useCharacterSnapshots } from "@/lib/characters/use-character-snapshots";
import { getVocationMeta } from "@/lib/characters/vocation";
import { useHuntingSessions } from "@/lib/hunting/use-hunting-sessions";
import { cn } from "@/lib/utils";

const numberFormatter = new Intl.NumberFormat("pt-BR");

export default function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: character, isLoading, isError } = useCharacter(id);
  const { data: snapshots } = useCharacterSnapshots(id);
  const { data: allSessions } = useHuntingSessions();
  const vocationMeta = getVocationMeta(character?.vocation ?? "");
  const VocationIcon = vocationMeta.icon;

  const sessions = useMemo(
    () => (allSessions ?? []).filter((session) => session.character_id === id),
    [allSessions, id],
  );

  const summary = useMemo(() => {
    if (sessions.length === 0) {
      return { totalBalance: 0, totalXpGain: 0, count: 0 };
    }
    return {
      totalBalance: sessions.reduce((sum, s) => sum + s.balance, 0),
      totalXpGain: sessions.reduce((sum, s) => sum + s.xp_gain, 0),
      count: sessions.length,
    };
  }, [sessions]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[68px]" />
          ))}
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (isError || !character) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/characters" />}
        >
          <ArrowLeft className="size-4" />
          Voltar
        </Button>
        <p className="text-sm text-destructive">Personagem não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        nativeButton={false}
        render={<Link href="/characters" />}
      >
        <ArrowLeft className="size-4" />
        Voltar
      </Button>

      <div className="flex flex-wrap items-center gap-4">
        <Avatar size="lg" className={cn("size-14", vocationMeta.colorClass)}>
          <AvatarFallback className={cn("text-lg", vocationMeta.colorClass)}>
            <VocationIcon className="size-7" />
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            {character.name}
            {character.is_main ? <Crown className="size-5 text-warning" /> : null}
          </h1>
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Badge variant="outline">{character.world}</Badge>
            {character.guild_name ? (
              <Badge variant="secondary">
                <Shield className="size-3" />
                {character.guild_name}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Trophy className="size-3.5 text-warning" /> Level
            </CardDescription>
            <CardTitle className="flex items-baseline gap-2 text-2xl">
              {numberFormatter.format(character.level)}
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  vocationMeta.colorClass,
                )}
              >
                <VocationIcon className="size-3" />
                {character.vocation}
              </span>
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Trophy className="size-3.5" /> Achievement points
            </CardDescription>
            <CardTitle className="text-2xl">
              {numberFormatter.format(character.achievement_points)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Swords className="size-3.5" /> Hunts registradas
            </CardDescription>
            <CardTitle className="text-2xl">{summary.count}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Coins className="size-3.5" /> Balance total
            </CardDescription>
            <CardTitle
              className={
                summary.totalBalance >= 0 ? "text-2xl text-success" : "text-2xl text-danger"
              }
            >
              {summary.totalBalance >= 0 ? "+" : "-"}
              {numberFormatter.format(Math.abs(summary.totalBalance))}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evolução de level</CardTitle>
          <CardDescription>
            Histórico de sincronizações — não representa XP, apenas o level ao longo do tempo
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!snapshots || snapshots.length < 2 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Ainda não há histórico suficiente. Atualize o personagem ou aguarde a próxima
              sincronização automática.
            </p>
          ) : (
            <CharacterProgressionChart snapshots={snapshots} />
          )}
        </CardContent>
      </Card>

      {sessions.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5">
                  <Zap className="size-4" /> Evolução de XP/h
                </CardTitle>
                <CardDescription>Por sessão, em ordem cronológica</CardDescription>
              </CardHeader>
              <CardContent>
                <HuntingXpChart sessions={sessions} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Lucro / prejuízo por hunt</CardTitle>
                <CardDescription>Balance de cada sessão</CardDescription>
              </CardHeader>
              <CardContent>
                <HuntingBalanceChart sessions={sessions} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hunts</CardTitle>
              <CardDescription>{sessions.length} sessões deste personagem</CardDescription>
            </CardHeader>
            <CardContent>
              <HuntingSessionsTable sessions={sessions} />
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Swords className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma hunt vinculada a este personagem ainda.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
