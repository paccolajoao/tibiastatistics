"use client";

import { UserCircle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddCharacterDialog } from "@/components/characters/add-character-dialog";
import { CharacterCard } from "@/components/characters/character-card";
import { useCharacters } from "@/lib/characters/use-characters";

export default function CharactersPage() {
  const { data, isLoading, isError } = useCharacters();
  const characters = data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <UserCircle className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Personagens</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os personagens vinculados à sua conta
            </p>
          </div>
        </div>
        <AddCharacterDialog />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px]" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar os personagens.</p>
      ) : characters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <UserCircle className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum personagem cadastrado ainda. Clique em &quot;Adicionar personagem&quot; para
              começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>
      )}
    </div>
  );
}
