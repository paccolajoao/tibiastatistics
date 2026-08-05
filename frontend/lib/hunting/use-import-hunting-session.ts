import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { HuntingSession } from "@/lib/hunting/types";

export type ImportHuntingSessionInput = {
  name: string;
  loadout: string;
  characterId: string;
} & ({ file: File; text?: never } | { text: string; file?: never });

export function useImportHuntingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, loadout, characterId, ...source }: ImportHuntingSessionInput) => {
      const formData = new FormData();
      if (source.file) {
        formData.append("file", source.file);
      } else {
        formData.append("text", source.text);
      }
      formData.append("name", name);
      formData.append("loadout", loadout);
      formData.append("character_id", characterId);
      return apiClient.postForm<HuntingSession>("/api/hunting/sessions", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hunting-sessions"] });
    },
  });
}
