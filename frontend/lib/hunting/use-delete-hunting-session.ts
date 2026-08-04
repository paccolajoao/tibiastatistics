import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useDeleteHuntingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/hunting/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hunting-sessions"] });
    },
  });
}
