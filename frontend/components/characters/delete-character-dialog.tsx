"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteCharacter } from "@/lib/characters/use-delete-character";

type DeleteCharacterDialogProps = {
  characterId: string;
  characterName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteCharacterDialog({
  characterId,
  characterName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCharacterDialogProps) {
  const { mutate, isPending } = useDeleteCharacter();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover {characterName}?</AlertDialogTitle>
          <AlertDialogDescription>
            O personagem será removido da sua conta. Hunts já importadas para ele continuam
            registradas no histórico.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() =>
              mutate(characterId, {
                onSuccess: () => {
                  onOpenChange(false);
                  onDeleted?.();
                },
              })
            }
          >
            {isPending ? "Removendo..." : "Remover"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
