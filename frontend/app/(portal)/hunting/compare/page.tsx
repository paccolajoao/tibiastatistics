"use client";

import { useMemo, useState } from "react";
import { GitCompare } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CharacterSelect, ALL_CHARACTERS_VALUE } from "@/components/characters/character-select";
import { HuntTypeSelect, ALL_HUNT_TYPES_VALUE } from "@/components/hunt-types/hunt-type-select";
import { HuntComparisonCards } from "@/components/hunting/hunt-comparison-cards";
import { HuntSelector } from "@/components/hunting/hunt-selector";
import { useCharacters } from "@/lib/characters/use-characters";
import { useLastSelectedCharacterId } from "@/lib/characters/use-last-selected-character";
import { useHuntTypes } from "@/lib/hunt-types/use-hunt-types";
import { useHuntingSessions } from "@/lib/hunting/use-hunting-sessions";

export default function HuntingComparePage() {
  const { data, isLoading, isError } = useHuntingSessions();
  const { data: characters } = useCharacters();
  const { data: huntTypes } = useHuntTypes();
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
  const allSessions = useMemo(() => data ?? [], [data]);
  const sessions = useMemo(() => {
    let filtered = allSessions;
    if (effectiveCharacterFilter !== ALL_CHARACTERS_VALUE) {
      filtered = filtered.filter((s) => s.character_id === effectiveCharacterFilter);
    }
    if (huntTypeFilter !== ALL_HUNT_TYPES_VALUE) {
      filtered = filtered.filter((s) => s.hunt_type_id === huntTypeFilter);
    }
    return filtered;
  }, [allSessions, effectiveCharacterFilter, huntTypeFilter]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const selectedSessions = useMemo(
    () => selectedIds.map((id) => sessions.find((s) => s.id === id)).filter((s) => s !== undefined),
    [sessions, selectedIds],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <GitCompare className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Comparação de hunts</h1>
            <p className="text-sm text-muted-foreground">
              Selecione até 5 hunts para comparar lado a lado
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
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar as hunts.</p>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <GitCompare className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma hunt importada ainda. Importe hunts na aba &quot;Hunts&quot; para poder
              compará-las.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Selecionar hunts</CardTitle>
              <CardDescription>{selectedIds.length}/5 selecionadas</CardDescription>
            </CardHeader>
            <CardContent>
              <HuntSelector
                sessions={sessions}
                selectedIds={selectedIds}
                onChange={setSelectedIds}
              />
            </CardContent>
          </Card>

          {selectedSessions.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Comparação</CardTitle>
                <CardDescription>
                  A métrica destacada em verde indica a melhor hunt naquele critério. Valores
                  normalizados por hora (estimativas) para permitir comparação justa entre hunts
                  de durações diferentes.
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <HuntComparisonCards sessions={selectedSessions} />
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
