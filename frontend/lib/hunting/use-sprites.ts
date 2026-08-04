import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export type SpriteKind = "creature" | "item";
export type SpriteMap = Record<string, string | null>;

export function useSprites(kind: SpriteKind, names: string[]) {
  const uniqueNames = Array.from(new Set(names.map((n) => n.toLowerCase()))).sort();

  return useQuery({
    queryKey: ["sprites", kind, uniqueNames.join(",")],
    queryFn: () =>
      apiClient.get<SpriteMap>(
        `/api/sprites?kind=${kind}&names=${encodeURIComponent(uniqueNames.join(","))}`,
      ),
    enabled: uniqueNames.length > 0,
    staleTime: 24 * 60 * 60 * 1000,
  });
}
