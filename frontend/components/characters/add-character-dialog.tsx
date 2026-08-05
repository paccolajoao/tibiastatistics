"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

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
import { useCreateCharacter } from "@/lib/characters/use-create-character";

export function AddCharacterDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { mutate, isPending, error, reset } = useCreateCharacter();

  function resetForm() {
    setName("");
    reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    mutate(name.trim(), {
      onSuccess: () => {
        setOpen(false);
        resetForm();
      },
    });
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
            <Plus className="size-4" />
            Adicionar personagem
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar personagem</DialogTitle>
            <DialogDescription>
              Digite o nome exato do personagem no Tibia. Buscamos automaticamente level, mundo,
              vocação e demais dados via TibiaData.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="character-name">Nome do personagem</Label>
              <Input
                id="character-name"
                placeholder="Ex: Cliffhanger"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive">
                {error.message.includes("409") || error.message.toLowerCase().includes("already")
                  ? "Esse personagem já está cadastrado na sua conta."
                  : error.message.includes("404") ||
                      error.message.toLowerCase().includes("not found")
                    ? "Personagem não encontrado no Tibia. Verifique o nome digitado."
                    : "Não foi possível cadastrar o personagem. Tente novamente."}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? "Buscando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
