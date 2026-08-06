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
import { useDeleteHuntType } from "@/lib/hunt-types/use-delete-hunt-type";

type DeleteHuntTypeDialogProps = {
  huntTypeId: string;
  huntTypeName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteHuntTypeDialog({
  huntTypeId,
  huntTypeName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteHuntTypeDialogProps) {
  const { mutate, isPending } = useDeleteHuntType();

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover {huntTypeName}?</AlertDialogTitle>
          <AlertDialogDescription>
            O tipo de hunt será removido da sua conta. Sessões já importadas com ele continuam
            registradas no histórico.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={() =>
              mutate(huntTypeId, {
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
