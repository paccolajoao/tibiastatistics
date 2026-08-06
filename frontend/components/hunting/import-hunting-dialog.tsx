"use client";

import Link from "next/link";
import { useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CharacterSelect } from "@/components/characters/character-select";
import { HuntTypeCombobox } from "@/components/hunt-types/hunt-type-combobox";
import { useCharacters } from "@/lib/characters/use-characters";
import { useLastSelectedCharacterId } from "@/lib/characters/use-last-selected-character";
import { useHuntTypes } from "@/lib/hunt-types/use-hunt-types";
import { useImportHuntingSession } from "@/lib/hunting/use-import-hunting-session";

type ImportMode = "file" | "text";

export function ImportHuntingDialog() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ImportMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [loadout, setLoadout] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [huntTypeId, setHuntTypeId] = useState("");
  const { mutate, isPending, error, reset } = useImportHuntingSession();
  const { data: characters } = useCharacters();
  const { data: huntTypes } = useHuntTypes();
  const { lastCharacterId, setLastCharacterId } = useLastSelectedCharacterId();
  const hasCharacters = (characters?.length ?? 0) > 0;

  const defaultCharacterId =
    lastCharacterId && characters?.some((character) => character.id === lastCharacterId)
      ? lastCharacterId
      : "";
  const effectiveCharacterId = characterId || defaultCharacterId;

  function handleCharacterChange(id: string) {
    setCharacterId(id);
    setLastCharacterId(id);
  }

  function resetForm() {
    setMode("file");
    setFile(null);
    setText("");
    setName("");
    setLoadout("");
    setCharacterId("");
    setHuntTypeId("");
    reset();
  }

  const isSourceValid = mode === "file" ? !!file : text.trim().length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSourceValid || !name.trim() || !effectiveCharacterId) return;

    mutate(
      mode === "file"
        ? {
            file: file as File,
            name: name.trim(),
            loadout: loadout.trim(),
            characterId: effectiveCharacterId,
            huntTypeId: huntTypeId || undefined,
          }
        : {
            text: text.trim(),
            name: name.trim(),
            loadout: loadout.trim(),
            characterId: effectiveCharacterId,
            huntTypeId: huntTypeId || undefined,
          },
      {
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      },
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Upload className="size-4" />
            Importar hunt
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Importar hunting session</DialogTitle>
            <DialogDescription>
              Envie o arquivo .json exportado pelo Hunt Analyzer do Tibia ou cole o texto copiado
              pelo botão &quot;copy to clipboard&quot; do jogo.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {!hasCharacters ? (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
                Você ainda não tem nenhum personagem cadastrado.{" "}
                <Link href="/characters" className="font-medium text-foreground underline">
                  Cadastre um personagem
                </Link>{" "}
                antes de importar uma hunt.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <Label>Personagem</Label>
                <CharacterSelect
                  characters={characters ?? []}
                  value={effectiveCharacterId}
                  onChange={handleCharacterChange}
                  placeholder="Selecione o personagem desta hunt"
                  className="w-full"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="hunt-name">Nome da hunt</Label>
              <Input
                id="hunt-name"
                placeholder="Ex: Behemoth Solo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="hunt-loadout">Set / equipamento</Label>
              <Input
                id="hunt-loadout"
                placeholder="Ex: Set de XP + Falcon Coif"
                value={loadout}
                onChange={(e) => setLoadout(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Tipo de hunt (opcional)</Label>
              <HuntTypeCombobox
                huntTypes={huntTypes ?? []}
                value={huntTypeId}
                onChange={setHuntTypeId}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Dados da sessão</Label>
              <Tabs value={mode} onValueChange={(value) => setMode(value as ImportMode)}>
                <TabsList>
                  <TabsTrigger value="file">Arquivo (.json)</TabsTrigger>
                  <TabsTrigger value="text">Colar texto</TabsTrigger>
                </TabsList>
              </Tabs>

              {mode === "file" ? (
                <Input
                  id="hunt-file"
                  type="file"
                  accept=".json,application/json"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  required
                />
              ) : (
                <Textarea
                  id="hunt-text"
                  placeholder={"Session data: From 2026-08-05, 13:07:40 to 2026-08-05, 14:01:03\nSession: 00:53h\n..."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  className="font-mono text-xs"
                  required
                />
              )}
            </div>

            {error ? (
              <p className="text-sm text-destructive">
                Não foi possível importar a sessão. Verifique o arquivo e tente novamente.
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              type="submit"
              disabled={!isSourceValid || !name.trim() || !effectiveCharacterId || isPending}
            >
              {isPending ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
