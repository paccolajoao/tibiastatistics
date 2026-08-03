DROP TRIGGER IF EXISTS world_player_snapshots_set_updated_at ON world_player_snapshots;

DROP INDEX IF EXISTS idx_world_player_snapshots_world_collected;

DROP TABLE world_player_snapshots;
