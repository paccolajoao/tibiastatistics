"use client";

import { Suspense, useMemo, useState } from "react";
import { Target } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CharacterSelect } from "@/components/characters/character-select";
import { BountyCreatureCards } from "@/components/bounty/bounty-creature-cards";
import { BountyRankingTable } from "@/components/bounty/bounty-ranking-table";
import { BountyRequiredKillsInput } from "@/components/bounty/bounty-required-kills-input";
import { BountyTierSelector } from "@/components/bounty/bounty-tier-selector";
import { useCharacters } from "@/lib/characters/use-characters";
import { useLastSelectedCharacterId } from "@/lib/characters/use-last-selected-character";
import { useHuntingSessions } from "@/lib/hunting/use-hunting-sessions";
import { useBestiary } from "@/lib/bounty/use-bestiary";
import { useBountyTierPool } from "@/lib/bounty/use-bounty-tier-pool";
import { useCreatureStats } from "@/lib/bounty/use-creature-stats";
import { useRequiredKills } from "@/lib/bounty/use-required-kills";
import { useTierQueryParam } from "@/lib/bounty/use-tier-query-param";

function BountyPageContent() {
  const { data: characters } = useCharacters();
  const { data: sessions } = useHuntingSessions();
  const { lastCharacterId, setLastCharacterId } = useLastSelectedCharacterId();

  const [characterId, setCharacterId] = useState<string | undefined>(undefined);
  const allCharacters = characters ?? [];
  const defaultCharacterId =
    lastCharacterId && allCharacters.some((c) => c.id === lastCharacterId)
      ? lastCharacterId
      : allCharacters[0]?.id;
  const effectiveCharacterId = characterId ?? defaultCharacterId;

  function handleCharacterChange(id: string) {
    setCharacterId(id);
    setLastCharacterId(id);
  }

  const [tier, setTier] = useTierQueryParam();
  const [requiredKills, setRequiredKills] = useRequiredKills(tier);

  const characterSessions = useMemo(
    () => (sessions ?? []).filter((s) => s.character_id === effectiveCharacterId),
    [sessions, effectiveCharacterId],
  );

  const creatureStats = useCreatureStats(characterSessions);
  const creatureNames = useMemo(() => creatureStats.map((c) => c.name), [creatureStats]);
  const { data: bestiaryMap, isLoading: bestiaryLoading } = useBestiary(creatureNames);

  const tierPool = useBountyTierPool(creatureStats, bestiaryMap, tier, requiredKills);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Target className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Bounty</h1>
            <p className="text-sm text-muted-foreground">
              Descubra as melhores criaturas para sua bounty, com base no seu histórico de hunts
            </p>
          </div>
        </div>
        <CharacterSelect
          characters={allCharacters}
          value={effectiveCharacterId}
          onChange={handleCharacterChange}
          className="w-[220px]"
        />
      </div>

      {allCharacters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Target className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum personagem cadastrado ainda. Cadastre um boneco para ver recomendações de
              bounty.
            </p>
          </CardContent>
        </Card>
      ) : characterSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Target className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma hunt importada para este personagem ainda. Importe hunts para desbloquear
              recomendações de bounty.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <BountyTierSelector value={tier} onChange={setTier} />
            <BountyRequiredKillsInput value={requiredKills} onChange={setRequiredKills} />
          </div>

          {bestiaryLoading ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Skeleton className="h-[180px]" />
                <Skeleton className="h-[180px]" />
                <Skeleton className="h-[180px]" />
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : (
            <>
              <BountyCreatureCards pool={tierPool} requiredKills={requiredKills} />
              <Card>
                <CardContent className="pt-6">
                  <BountyRankingTable ranked={tierPool} requiredKills={requiredKills} />
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function BountyPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <BountyPageContent />
    </Suspense>
  );
}
