"use client";

import { useMemo, useState } from "react";
import { Check, MapPin, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateHuntType } from "@/lib/hunt-types/use-create-hunt-type";
import type { HuntType } from "@/lib/hunt-types/types";
import { cn } from "@/lib/utils";

type HuntTypeComboboxProps = {
  huntTypes: HuntType[];
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder?: string;
  className?: string;
};

export function HuntTypeCombobox({
  huntTypes,
  value,
  onChange,
  placeholder = "Selecione ou crie um tipo de hunt",
  className,
}: HuntTypeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { mutate: createHuntType, isPending } = useCreateHuntType();

  const selected = huntTypes.find((huntType) => huntType.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return huntTypes;
    return huntTypes.filter((huntType) => huntType.name.toLowerCase().includes(q));
  }, [huntTypes, query]);

  const trimmedQuery = query.trim();
  const hasExactMatch = huntTypes.some(
    (huntType) => huntType.name.toLowerCase() === trimmedQuery.toLowerCase(),
  );

  function handleSelect(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function handleCreate() {
    if (!trimmedQuery || isPending) return;
    createHuntType(trimmedQuery, {
      onSuccess: (created) => handleSelect(created.id),
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn("w-full justify-start font-normal", className)}
          >
            <MapPin className="size-4 text-muted-foreground" />
            {selected ? selected.name : <span className="text-muted-foreground">{placeholder}</span>}
          </Button>
        }
      />
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2">
          <Input
            autoFocus
            placeholder="Buscar ou criar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-56 overflow-y-auto px-1 pb-1">
          {filtered.map((huntType) => (
            <button
              key={huntType.id}
              type="button"
              onClick={() => handleSelect(huntType.id)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
            >
              <Check className={cn("size-3.5", huntType.id === value ? "opacity-100" : "opacity-0")} />
              {huntType.name}
            </button>
          ))}
          {trimmedQuery && !hasExactMatch ? (
            <button
              type="button"
              onClick={handleCreate}
              disabled={isPending}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-primary hover:bg-accent disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              {isPending ? "Criando..." : `Criar "${trimmedQuery}"`}
            </button>
          ) : null}
          {filtered.length === 0 && !trimmedQuery ? (
            <p className="px-2 py-1.5 text-sm text-muted-foreground">
              Nenhum tipo de hunt cadastrado ainda.
            </p>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
