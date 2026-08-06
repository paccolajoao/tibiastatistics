"use client";

import { useMemo, useState } from "react";
import { Coins, Swords, TrendingUp, Zap } from "lucide-react";
import type { DateRange } from "react-day-picker";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { HuntingBalanceChart } from "@/components/charts/hunting-balance-chart";
import { HuntingXpChart } from "@/components/charts/hunting-xp-chart";
import { CharacterSelect, ALL_CHARACTERS_VALUE } from "@/components/characters/character-select";
import { HuntTypeSelect, ALL_HUNT_TYPES_VALUE } from "@/components/hunt-types/hunt-type-select";
import { DateRangeFilter } from "@/components/hunting/date-range-filter";
import { HuntingSessionsTable } from "@/components/hunting/hunting-sessions-table";
import { ImportHuntingDialog } from "@/components/hunting/import-hunting-dialog";
import { PeriodLootSummary } from "@/components/hunting/period-loot-summary";
import { useCharacters } from "@/lib/characters/use-characters";
import { useLastSelectedCharacterId } from "@/lib/characters/use-last-selected-character";
import { useHuntTypes } from "@/lib/hunt-types/use-hunt-types";
import { useHuntingSessions } from "@/lib/hunting/use-hunting-sessions";

const numberFormatter = new Intl.NumberFormat("pt-BR");

export default function HuntingPage() {
  const { data, isLoading, isError } = useHuntingSessions();
  const { data: characters } = useCharacters();
  const { data: huntTypes } = useHuntTypes();
  const allSessions = useMemo(() => data ?? [], [data]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [characterFilter, setCharacterFilter] = useState<string>(ALL_CHARACTERS_VALUE);
  const [huntTypeFilter, setHuntTypeFilter] = useState<string>(ALL_HUNT_TYPES_VALUE);
  const { lastCharacterId, setLastCharacterId } = useLastSelectedCharacterId();

  const defaultCharacterFilter =
    lastCharacterId && characters?.some((character) => character.id === lastCharacterId)
      ? lastCharacterId
      : ALL_CHARACTERS_VALUE;
  const effectiveCharacterFilter =
    characterFilter !== ALL_CHARACTERS_VALUE ? characterFilter : defaultCharacterFilter;

  function handleCharacterFilterChange(id: string) {
    setCharacterFilter(id);
    if (id !== ALL_CHARACTERS_VALUE) setLastCharacterId(id);
  }

  const sessions = useMemo(() => {
    let filtered = allSessions;

    if (effectiveCharacterFilter !== ALL_CHARACTERS_VALUE) {
      filtered = filtered.filter((session) => session.character_id === effectiveCharacterFilter);
    }

    if (huntTypeFilter !== ALL_HUNT_TYPES_VALUE) {
      filtered = filtered.filter((session) => session.hunt_type_id === huntTypeFilter);
    }

    if (dateRange?.from) {
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      const to = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
      to.setHours(23, 59, 59, 999);

      filtered = filtered.filter((session) => {
        const start = new Date(session.session_start);
        return start >= from && start <= to;
      });
    }

    return filtered;
  }, [allSessions, dateRange, effectiveCharacterFilter, huntTypeFilter]);

  const summary = useMemo(() => {
    if (sessions.length === 0) {
      return { totalBalance: 0, avgXpPerHour: 0, totalXpGain: 0, count: 0 };
    }
    const totalBalance = sessions.reduce((sum, s) => sum + s.balance, 0);
    const totalXpGain = sessions.reduce((sum, s) => sum + s.xp_gain, 0);
    const avgXpPerHour = Math.round(
      sessions.reduce((sum, s) => sum + s.xp_per_hour, 0) / sessions.length,
    );
    return { totalBalance, avgXpPerHour, totalXpGain, count: sessions.length };
  }, [sessions]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Swords className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Hunting</h1>
            <p className="text-sm text-muted-foreground">
              Controle de hunts — lucro, evolução de XP e set utilizado
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CharacterSelect
            characters={characters ?? []}
            value={effectiveCharacterFilter}
            onChange={handleCharacterFilterChange}
            includeAllOption
            className="w-[200px]"
          />
          <HuntTypeSelect
            huntTypes={huntTypes ?? []}
            value={huntTypeFilter}
            onChange={setHuntTypeFilter}
            includeAllOption
            className="w-[200px]"
          />
          <DateRangeFilter range={dateRange} onChange={setDateRange} />
          <ImportHuntingDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Swords className="size-3.5" /> Hunts no período
            </CardDescription>
            <CardTitle className="text-2xl">{summary.count}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Coins className="size-3.5" /> Balance no período
            </CardDescription>
            <CardTitle
              className={cn(
                "text-2xl",
                summary.totalBalance >= 0 ? "text-success" : "text-danger",
              )}
            >
              {summary.totalBalance >= 0 ? "+" : "-"}
              {numberFormatter.format(Math.abs(summary.totalBalance))}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <Zap className="size-3.5" /> XP total no período
            </CardDescription>
            <CardTitle className="text-2xl">{numberFormatter.format(summary.totalXpGain)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <TrendingUp className="size-3.5" /> XP/h média
            </CardDescription>
            <CardTitle className="text-2xl">{numberFormatter.format(summary.avgXpPerHour)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Skeleton className="h-[280px]" />
            <Skeleton className="h-[280px]" />
          </div>
          <Skeleton className="h-40" />
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar as hunts.</p>
      ) : allSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Swords className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma hunt importada ainda. Clique em &quot;Importar hunt&quot; para começar.
            </p>
          </CardContent>
        </Card>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Swords className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma hunt encontrada no período selecionado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Evolução de XP/h</CardTitle>
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
              <CardDescription>{sessions.length} sessões no período</CardDescription>
            </CardHeader>
            <CardContent>
              <HuntingSessionsTable sessions={sessions} />
            </CardContent>
          </Card>

          <PeriodLootSummary sessions={sessions} />
        </>
      )}
    </div>
  );
}
