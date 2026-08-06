"use client";

import { Hash } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BountyRequiredKillsInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="bounty-required-kills" className="flex items-center gap-1.5 text-sm">
        <Hash className="size-3.5" /> Kills exigidos pela bounty
      </Label>
      <Input
        id="bounty-required-kills"
        type="number"
        min={1}
        value={value}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value) || 1))}
        className="w-[160px]"
      />
      <p className="text-xs text-muted-foreground">
        Valor sugerido — ajuste conforme a bounty do seu personagem.
      </p>
    </div>
  );
}
