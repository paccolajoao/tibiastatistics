import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export function useDeleteHuntType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/hunt-types/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hunt-types"] });
    },
  });
}
