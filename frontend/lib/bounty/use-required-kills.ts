"use client";

import { useState } from "react";

import { TIER_DEFAULT_REQUIRED_KILLS, type BountyTier } from "@/lib/bounty/tiers";

export function useRequiredKills(tier: BountyTier): [number, (value: number) => void] {
  const [{ tier: trackedTier, value }, setState] = useState(() => ({
    tier,
    value: TIER_DEFAULT_REQUIRED_KILLS[tier],
  }));

  if (tier !== trackedTier) {
    setState({ tier, value: TIER_DEFAULT_REQUIRED_KILLS[tier] });
  }

  function setValue(next: number) {
    setState({ tier, value: next });
  }

  return [tier !== trackedTier ? TIER_DEFAULT_REQUIRED_KILLS[tier] : value, setValue];
}
