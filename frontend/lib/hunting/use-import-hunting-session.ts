import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { HuntingSession } from "@/lib/hunting/types";

export type ImportHuntingSessionInput = {
  file: File;
  name: string;
  loadout: string;
};

export function useImportHuntingSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, name, loadout }: ImportHuntingSessionInput) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", name);
      formData.append("loadout", loadout);
      return apiClient.postForm<HuntingSession>("/api/hunting/sessions", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hunting-sessions"] });
    },
  });
}
