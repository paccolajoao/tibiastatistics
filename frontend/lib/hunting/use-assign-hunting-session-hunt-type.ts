import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { HuntingSession } from "@/lib/hunting/types";

export function useAssignHuntingSessionHuntType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, huntTypeId }: { sessionId: string; huntTypeId: string }) =>
      apiClient.patch<HuntingSession>(`/api/hunting/sessions/${sessionId}/hunt-type`, {
        hunt_type_id: huntTypeId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hunting-sessions"] });
    },
  });
}
