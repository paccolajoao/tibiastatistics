export type Character = {
  id: string;
  name: string;
  world: string;
  vocation: string;
  level: number;
  sex: string;
  residence: string;
  guild_name: string;
  guild_rank: string;
  achievement_points: number;
  account_status: string;
  last_login: string | null;
  is_main: boolean;
  last_synced_at: string;
  created_at: string;
};

export type CharacterSnapshot = {
  level: number;
  vocation: string;
  world: string;
  achievement_points: number;
  captured_at: string;
};
