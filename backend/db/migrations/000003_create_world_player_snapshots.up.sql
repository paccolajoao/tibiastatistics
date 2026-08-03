CREATE TABLE world_player_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    world_name TEXT NOT NULL,
    location TEXT NOT NULL,
    pvp_type TEXT NOT NULL,
    players_online INTEGER NOT NULL,
    collected_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_world_player_snapshots_world_collected
    ON world_player_snapshots (world_name, collected_at DESC);

CREATE TRIGGER world_player_snapshots_set_updated_at
    BEFORE UPDATE ON world_player_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
