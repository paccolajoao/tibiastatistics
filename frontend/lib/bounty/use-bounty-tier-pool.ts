import { useMemo } from "react";

import type { BestiaryMap } from "@/lib/bounty/use-bestiary";
import type { CreatureStats } from "@/lib/bounty/use-creature-stats";
import { TIER_DIFFICULTIES, type BountyTier } from "@/lib/bounty/tiers";

export type BountyPoolEntry = CreatureStats & {
  difficulty: string;
  estimatedHoursToComplete: number;
  score: number;
};

function normalize(value: number, max: number) {
  return max > 0 ? value / max : 0;
}

export function useBountyTierPool(
  stats: CreatureStats[],
  bestiary: BestiaryMap | undefined,
  tier: BountyTier,
  requiredKills: number,
): BountyPoolEntry[] {
  return useMemo(() => {
    const allowedDifficulties = new Set(TIER_DIFFICULTIES[tier]);
    const eligible = stats.filter((stat) => {
      const info = bestiary?.[stat.name];
      return !!info && !info.is_boss && allowedDifficulties.has(info.difficulty);
    });

    const maxKillsPerHour = Math.max(0, ...eligible.map((s) => s.killsPerHour));
    const maxBalancePerHour = Math.max(0, ...eligible.map((s) => Math.max(s.balancePerHour, 0)));

    const ranked: BountyPoolEntry[] = eligible.map((stat) => {
      const info = bestiary![stat.name];
      const killsScore = normalize(stat.killsPerHour, maxKillsPerHour);
      const balanceScore = normalize(Math.max(stat.balancePerHour, 0), maxBalancePerHour);
      return {
        ...stat,
        difficulty: info.difficulty,
        estimatedHoursToComplete:
          stat.killsPerHour > 0 ? requiredKills / stat.killsPerHour : Infinity,
        score: killsScore * 0.5 + balanceScore * 0.5,
      };
    });

    ranked.sort((a, b) => b.score - a.score);
    return ranked;
  }, [stats, bestiary, tier, requiredKills]);
}
