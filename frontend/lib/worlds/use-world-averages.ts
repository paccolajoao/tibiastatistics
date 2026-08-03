import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export type WorldAverage = {
  world_name: string;
  location: string;
  pvp_type: string;
  avg_players_online: number;
  max_players_online: number;
  min_players_online: number;
  sample_count: number;
};

export type WorldAveragesPeriod = 7 | 14 | 30;

export type WorldAveragesFilters = {
  location?: string;
  pvp_type?: string;
};

export function useWorldAverages(
  period: WorldAveragesPeriod = 7,
  filters: WorldAveragesFilters = {},
) {
  const location = filters.location ?? "";
  const pvpType = filters.pvp_type ?? "";

  return useQuery({
    queryKey: ["world-averages", period, location, pvpType],
    queryFn: () =>
      apiClient.get<WorldAverage[]>(
        `/api/worlds/averages?period=${period}&location=${encodeURIComponent(
          location,
        )}&pvp_type=${encodeURIComponent(pvpType)}`,
      ),
  });
}
