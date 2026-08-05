import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Character } from "@/lib/characters/types";

export function useCharacter(id: string) {
  return useQuery({
    queryKey: ["characters", id],
    queryFn: () => apiClient.get<Character>(`/api/characters/${id}`),
    enabled: !!id,
  });
}
