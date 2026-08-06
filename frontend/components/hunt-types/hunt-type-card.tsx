"use client";

import { useState } from "react";
import { MapPin, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteHuntTypeDialog } from "@/components/hunt-types/delete-hunt-type-dialog";
import type { HuntType } from "@/lib/hunt-types/types";

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

export function HuntTypeCard({ huntType }: { huntType: HuntType }) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <Card>
        <CardContent className="flex items-center justify-between gap-3 py-1">
          <div className="flex flex-1 items-center gap-3">
            <Avatar size="lg" className="shrink-0">
              <AvatarFallback>
                <MapPin className="size-4.5" />
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">{huntType.name}</span>
              <span className="text-xs text-muted-foreground">
                Criado {relativeTime(huntType.created_at)}
              </span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" />
            <span className="sr-only">Remover</span>
          </Button>
        </CardContent>
      </Card>

      <DeleteHuntTypeDialog
        huntTypeId={huntType.id}
        huntTypeName={huntType.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
