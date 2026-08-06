"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { BOUNTY_TIERS, DEFAULT_BOUNTY_TIER, type BountyTier } from "@/lib/bounty/tiers";

const VALID_TIERS = new Set(BOUNTY_TIERS.map((t) => t.value));

export function useTierQueryParam(): [BountyTier, (tier: BountyTier) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const raw = searchParams.get("tier");
  const tier: BountyTier = raw && VALID_TIERS.has(raw as BountyTier) ? (raw as BountyTier) : DEFAULT_BOUNTY_TIER;

  const setTier = useCallback(
    (next: BountyTier) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tier", next);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return [tier, setTier];
}
