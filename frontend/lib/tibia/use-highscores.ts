import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/api-client";

export type HighscoreEntry = {
  rank: number;
  name: string;
  vocation: string;
  world: string;
  level: number;
  value: number;
};

export type HighscoresResult = {
  world: string;
  category: string;
  vocation: string;
  entries: HighscoreEntry[];
  page: {
    current_page: number;
    total_pages: number;
    total_records: number;
  };
};

type HighscoresParams = {
  world?: string;
  category?: string;
  vocation?: string;
  page?: number;
};

export function useHighscores(params: HighscoresParams = {}) {
  const { world = "Antica", category = "experience", vocation = "all", page = 1 } = params;

  return useQuery({
    queryKey: ["highscores", world, category, vocation, page],
    queryFn: () =>
      apiClient.get<HighscoresResult>(
        `/api/tibia/highscores?world=${encodeURIComponent(world)}&category=${encodeURIComponent(
          category,
        )}&vocation=${encodeURIComponent(vocation)}&page=${page}`,
      ),
  });
}
