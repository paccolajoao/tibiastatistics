"use client";

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
import { useImportHuntingSession } from "@/lib/hunting/use-import-hunting-session";

export function ImportHuntingDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [loadout, setLoadout] = useState("");
  const { mutate, isPending, error, reset } = useImportHuntingSession();

  function resetForm() {
    setFile(null);
    setName("");
    setLoadout("");
    reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !name.trim()) return;

    mutate(
      { file, name: name.trim(), loadout: loadout.trim() },
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
              Envie o arquivo .json exportado pelo Hunt Analyzer do Tibia.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
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
              <Label htmlFor="hunt-file">Arquivo da sessão (.json)</Label>
              <Input
                id="hunt-file"
                type="file"
                accept=".json,application/json"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
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
            <Button type="submit" disabled={!file || !name.trim() || isPending}>
              {isPending ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
