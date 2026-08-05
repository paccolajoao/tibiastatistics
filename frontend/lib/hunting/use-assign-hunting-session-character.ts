import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { HuntingSession } from "@/lib/hunting/types";

export function useAssignHuntingSessionCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, characterId }: { sessionId: string; characterId: string }) =>
      apiClient.patch<HuntingSession>(`/api/hunting/sessions/${sessionId}/character`, {
        character_id: characterId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hunting-sessions"] });
    },
  });
}
