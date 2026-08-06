"use client";

import { Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BOUNTY_TIERS, type BountyTier } from "@/lib/bounty/tiers";
import { cn } from "@/lib/utils";

export function BountyTierSelector({
  value,
  onChange,
}: {
  value: BountyTier;
  onChange: (tier: BountyTier) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {BOUNTY_TIERS.map((tier) => (
        <Button
          key={tier.value}
          type="button"
          variant={value === tier.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(tier.value)}
          className={cn("gap-1.5")}
        >
          <Target className="size-3.5" />
          {tier.label}
        </Button>
      ))}
    </div>
  );
}
