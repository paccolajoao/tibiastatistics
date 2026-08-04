"use client";

import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

function formatRange(range: DateRange | undefined) {
  if (!range?.from) return "Todo o período";
  const from = range.from.toLocaleDateString("pt-BR");
  if (!range.to || range.to.getTime() === range.from.getTime()) return from;
  return `${from} - ${range.to.toLocaleDateString("pt-BR")}`;
}

export function DateRangeFilter({
  range,
  onChange,
}: {
  range: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" className="justify-start font-normal">
              <CalendarIcon className="size-4 text-muted-foreground" />
              {formatRange(range)}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="range"
            selected={range}
            onSelect={onChange}
            numberOfMonths={2}
            defaultMonth={range?.from}
          />
        </PopoverContent>
      </Popover>
      {range?.from ? (
        <Button variant="ghost" size="icon-sm" onClick={() => onChange(undefined)}>
          <X className="size-3.5" />
          <span className="sr-only">Limpar período</span>
        </Button>
      ) : null}
    </div>
  );
}
