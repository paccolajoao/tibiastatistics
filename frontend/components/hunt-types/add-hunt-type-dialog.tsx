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
import { useCreateHuntType } from "@/lib/hunt-types/use-create-hunt-type";

export function AddHuntTypeDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const { mutate, isPending, error, reset } = useCreateHuntType();

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
            Adicionar tipo de hunt
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Adicionar tipo de hunt</DialogTitle>
            <DialogDescription>
              Dê um nome para o local ou rota de hunt, ex: &quot;Medusa Tower Solo&quot;.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="hunt-type-name">Nome do tipo de hunt</Label>
              <Input
                id="hunt-type-name"
                placeholder="Ex: Medusa Tower Solo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive">
                {error.message.includes("409") || error.message.toLowerCase().includes("already")
                  ? "Você já tem um tipo de hunt com esse nome."
                  : "Não foi possível criar o tipo de hunt. Tente novamente."}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? "Criando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
