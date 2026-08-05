import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Character } from "@/lib/characters/types";

export function useCharacters() {
  return useQuery({
    queryKey: ["characters"],
    queryFn: () => apiClient.get<Character[]>("/api/characters"),
  });
}
