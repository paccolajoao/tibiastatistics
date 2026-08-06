export type KilledMonster = {
  Count: number;
  Name: string;
};

export type LootedItem = {
  Count: number;
  Name: string;
};

export type HuntingSession = {
  id: string;
  name: string;
  loadout: string;
  session_start: string;
  session_end: string;
  session_length_seconds: number;
  balance: number;
  damage: number;
  damage_per_hour: number;
  healing: number;
  healing_per_hour: number;
  loot: number;
  supplies: number;
  xp_gain: number;
  xp_per_hour: number;
  raw_xp_gain: number;
  raw_xp_per_hour: number;
  killed_monsters: KilledMonster[];
  looted_items: LootedItem[];
  created_at: string;
  character_id: string | null;
  hunt_type_id: string | null;
};
