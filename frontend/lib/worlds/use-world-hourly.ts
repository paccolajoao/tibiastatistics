import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { WorldAveragesFilters, WorldAveragesPeriod } from "@/lib/worlds/use-world-averages";

export type WorldHourlyPoint = {
  world_name: string;
  hour_of_day: number;
  avg_players_online: number;
  sample_count: number;
};

export function useWorldHourly(
  period: WorldAveragesPeriod,
  world?: string,
  filters: WorldAveragesFilters = {},
) {
  const location = filters.location ?? "";
  const pvpType = filters.pvp_type ?? "";

  return useQuery({
    queryKey: ["world-hourly", period, world ?? "", location, pvpType],
    queryFn: () =>
      apiClient.get<WorldHourlyPoint[]>(
        `/api/worlds/hourly?period=${period}&world=${encodeURIComponent(
          world ?? "",
        )}&location=${encodeURIComponent(location)}&pvp_type=${encodeURIComponent(pvpType)}`,
      ),
  });
}
