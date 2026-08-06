import { useMemo } from "react";

import type { HuntingSession } from "@/lib/hunting/types";

export type CreatureStats = {
  name: string;
  totalKills: number;
  totalHours: number;
  killsPerHour: number;
  balancePerHour: number;
  sessionCount: number;
};

export function useCreatureStats(sessions: HuntingSession[]): CreatureStats[] {
  return useMemo(() => {
    const byName = new Map<
      string,
      { kills: number; hours: number; weightedBalanceSum: number; sessionCount: number }
    >();

    for (const session of sessions) {
      const hours = session.session_length_seconds / 3600;
      if (hours <= 0) continue;
      const sessionBalancePerHour = session.balance / hours;

      for (const km of session.killed_monsters) {
        const key = km.Name.toLowerCase();
        const entry = byName.get(key) ?? {
          kills: 0,
          hours: 0,
          weightedBalanceSum: 0,
          sessionCount: 0,
        };
        entry.kills += km.Count;
        entry.hours += hours;
        entry.weightedBalanceSum += sessionBalancePerHour * hours;
        entry.sessionCount += 1;
        byName.set(key, entry);
      }
    }

    return Array.from(byName.entries())
      .map(([name, e]) => ({
        name,
        totalKills: e.kills,
        totalHours: e.hours,
        killsPerHour: e.hours > 0 ? e.kills / e.hours : 0,
        balancePerHour: e.hours > 0 ? e.weightedBalanceSum / e.hours : 0,
        sessionCount: e.sessionCount,
      }))
      .sort((a, b) => b.totalKills - a.totalKills);
  }, [sessions]);
}
