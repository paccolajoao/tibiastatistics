CREATE TABLE hunting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    loadout TEXT NOT NULL DEFAULT '',
    session_start TIMESTAMPTZ NOT NULL,
    session_end TIMESTAMPTZ NOT NULL,
    session_length_seconds INTEGER NOT NULL,
    balance BIGINT NOT NULL,
    damage BIGINT NOT NULL,
    damage_per_hour BIGINT NOT NULL,
    healing BIGINT NOT NULL,
    healing_per_hour BIGINT NOT NULL,
    loot BIGINT NOT NULL,
    supplies BIGINT NOT NULL,
    xp_gain BIGINT NOT NULL,
    xp_per_hour BIGINT NOT NULL,
    raw_xp_gain BIGINT NOT NULL,
    raw_xp_per_hour BIGINT NOT NULL,
    killed_monsters JSONB NOT NULL,
    looted_items JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_hunting_sessions_user_start
    ON hunting_sessions (user_id, session_start DESC);

CREATE TRIGGER hunting_sessions_set_updated_at
    BEFORE UPDATE ON hunting_sessions
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
