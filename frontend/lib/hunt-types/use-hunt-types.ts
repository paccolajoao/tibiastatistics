import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { HuntType } from "@/lib/hunt-types/types";

export function useHuntTypes() {
  return useQuery({
    queryKey: ["hunt-types"],
    queryFn: () => apiClient.get<HuntType[]>("/api/hunt-types"),
  });
}
