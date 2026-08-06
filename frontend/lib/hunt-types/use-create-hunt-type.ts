import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { HuntType } from "@/lib/hunt-types/types";

export function useCreateHuntType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => apiClient.post<HuntType>("/api/hunt-types", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hunt-types"] });
    },
  });
}
