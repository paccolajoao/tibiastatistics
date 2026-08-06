import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export type BestiaryEntry = { difficulty: string; is_boss: boolean };
export type BestiaryMap = Record<string, BestiaryEntry>;

export function useBestiary(names: string[]) {
  const uniqueNames = Array.from(new Set(names.map((n) => n.toLowerCase()))).sort();

  return useQuery({
    queryKey: ["bestiary", uniqueNames.join(",")],
    queryFn: () =>
      apiClient.get<BestiaryMap>(
        `/api/bestiary?names=${encodeURIComponent(uniqueNames.join(","))}`,
      ),
    enabled: uniqueNames.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
