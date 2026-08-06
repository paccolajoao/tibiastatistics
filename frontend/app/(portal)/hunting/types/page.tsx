"use client";

import { MapPin } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AddHuntTypeDialog } from "@/components/hunt-types/add-hunt-type-dialog";
import { HuntTypeCard } from "@/components/hunt-types/hunt-type-card";
import { useHuntTypes } from "@/lib/hunt-types/use-hunt-types";

export default function HuntTypesPage() {
  const { data, isLoading, isError } = useHuntTypes();
  const huntTypes = data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MapPin className="size-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold">Tipos de hunt</h1>
            <p className="text-sm text-muted-foreground">
              Cadastre os locais e rotas de hunt para filtrar suas sessões por onde foram feitas
            </p>
          </div>
        </div>
        <AddHuntTypeDialog />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px]" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">Não foi possível carregar os tipos de hunt.</p>
      ) : huntTypes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <MapPin className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum tipo de hunt cadastrado ainda. Clique em &quot;Adicionar tipo de hunt&quot;
              para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {huntTypes.map((huntType) => (
            <HuntTypeCard key={huntType.id} huntType={huntType} />
          ))}
        </div>
      )}
    </div>
  );
}
