import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Character } from "@/lib/characters/types";

export function useRefreshCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.post<Character>(`/api/characters/${id}/refresh`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({ queryKey: ["characters", id] });
      queryClient.invalidateQueries({ queryKey: ["character-snapshots", id] });
    },
  });
}
