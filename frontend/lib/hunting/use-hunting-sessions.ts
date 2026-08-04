import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { HuntingSession } from "@/lib/hunting/types";

export function useHuntingSessions() {
  return useQuery({
    queryKey: ["hunting-sessions"],
    queryFn: () => apiClient.get<HuntingSession[]>("/api/hunting/sessions"),
  });
}
