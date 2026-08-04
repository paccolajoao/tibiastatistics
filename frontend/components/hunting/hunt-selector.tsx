"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { HuntingSession } from "@/lib/hunting/types";

const MAX_SELECTED = 5;
const numberFormatter = new Intl.NumberFormat("pt-BR");

export function HuntSelector({
  sessions,
  selectedIds,
  onChange,
}: {
  sessions: HuntingSession[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string, checked: boolean) {
    if (checked) {
      if (selectedIds.length >= MAX_SELECTED) return;
      onChange([...selectedIds, id]);
    } else {
      onChange(selectedIds.filter((x) => x !== id));
    }
  }

  const limitReached = selectedIds.length >= MAX_SELECTED;

  return (
    <div className="flex flex-col gap-2">
      {limitReached ? (
        <p className="text-xs text-muted-foreground">
          Máximo de {MAX_SELECTED} hunts selecionadas. Desmarque uma para trocar.
        </p>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead>Nome</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => {
            const checked = selectedIds.includes(session.id);
            return (
              <TableRow key={session.id} data-state={checked ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={checked}
                    disabled={!checked && limitReached}
                    onCheckedChange={(value) => toggle(session.id, value === true)}
                  />
                </TableCell>
                <TableCell className="font-medium">{session.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(session.session_start).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell
                  className={`text-right ${
                    session.balance >= 0
                      ? "text-emerald-600 dark:text-emerald-500"
                      : "text-destructive"
                  }`}
                >
                  {session.balance >= 0 ? "+" : "-"}
                  {numberFormatter.format(Math.abs(session.balance))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
