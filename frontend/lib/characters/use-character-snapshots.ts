import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { CharacterSnapshot } from "@/lib/characters/types";

export function useCharacterSnapshots(characterId: string, days = 90) {
  return useQuery({
    queryKey: ["character-snapshots", characterId, days],
    queryFn: () =>
      apiClient.get<CharacterSnapshot[]>(`/api/characters/${characterId}/snapshots?days=${days}`),
    enabled: !!characterId,
  });
}
