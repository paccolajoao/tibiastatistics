import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";
import type { WorldAveragesPeriod } from "@/lib/worlds/use-world-averages";

export type WorldTimeSeriesPoint = {
  world_name: string;
  players_online: number;
  collected_at: string;
};

export function useWorldTimeSeries(period: WorldAveragesPeriod, world?: string) {
  return useQuery({
    queryKey: ["world-timeseries", period, world ?? ""],
    queryFn: () =>
      apiClient.get<WorldTimeSeriesPoint[]>(
        `/api/worlds/timeseries?period=${period}&world=${encodeURIComponent(world ?? "")}`,
      ),
  });
}
