import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { Character } from "@/lib/characters/types";

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => apiClient.post<Character>("/api/characters", { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}
