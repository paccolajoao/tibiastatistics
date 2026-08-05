"use client";

import { useMemo } from "react";
import { UserCircle } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Character } from "@/lib/characters/types";

export const ALL_CHARACTERS_VALUE = "all";

type CharacterSelectProps = {
  characters: Character[];
  value: string | undefined;
  onChange: (value: string) => void;
  includeAllOption?: boolean;
  placeholder?: string;
  className?: string;
  size?: "sm" | "default";
};

export function CharacterSelect({
  characters,
  value,
  onChange,
  includeAllOption = false,
  placeholder = "Selecione um personagem",
  className,
  size = "default",
}: CharacterSelectProps) {
  const labelByValue = useMemo(() => {
    const map = new Map<string, string>();
    if (includeAllOption) map.set(ALL_CHARACTERS_VALUE, "Todos os personagens");
    for (const character of characters) {
      map.set(character.id, `${character.name} (${character.level})`);
    }
    return map;
  }, [characters, includeAllOption]);

  return (
    <Select value={value ?? ""} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger size={size} className={className ?? "w-[220px]"}>
        <UserCircle className="size-4 text-muted-foreground" />
        <SelectValue placeholder={placeholder}>
          {(selected: string) => (selected ? (labelByValue.get(selected) ?? selected) : placeholder)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {includeAllOption ? (
          <SelectItem value={ALL_CHARACTERS_VALUE}>Todos os personagens</SelectItem>
        ) : null}
        {characters.map((character) => (
          <SelectItem key={character.id} value={character.id}>
            {character.name} ({character.level})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
