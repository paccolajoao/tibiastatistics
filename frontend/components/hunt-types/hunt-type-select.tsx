"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { HuntType } from "@/lib/hunt-types/types";

export const ALL_HUNT_TYPES_VALUE = "all";

type HuntTypeSelectProps = {
  huntTypes: HuntType[];
  value: string | undefined;
  onChange: (value: string) => void;
  includeAllOption?: boolean;
  placeholder?: string;
  className?: string;
  size?: "sm" | "default";
};

export function HuntTypeSelect({
  huntTypes,
  value,
  onChange,
  includeAllOption = false,
  placeholder = "Selecione um tipo de hunt",
  className,
  size = "default",
}: HuntTypeSelectProps) {
  const labelByValue = useMemo(() => {
    const map = new Map<string, string>();
    if (includeAllOption) map.set(ALL_HUNT_TYPES_VALUE, "Todos os tipos de hunt");
    for (const huntType of huntTypes) {
      map.set(huntType.id, huntType.name);
    }
    return map;
  }, [huntTypes, includeAllOption]);

  return (
    <Select value={value ?? ""} onValueChange={(next) => next && onChange(next)}>
      <SelectTrigger size={size} className={className ?? "w-[220px]"}>
        <MapPin className="size-4 text-muted-foreground" />
        <SelectValue placeholder={placeholder}>
          {(selected: string) => (selected ? (labelByValue.get(selected) ?? selected) : placeholder)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {includeAllOption ? (
          <SelectItem value={ALL_HUNT_TYPES_VALUE}>Todos os tipos de hunt</SelectItem>
        ) : null}
        {huntTypes.map((huntType) => (
          <SelectItem key={huntType.id} value={huntType.id}>
            {huntType.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
