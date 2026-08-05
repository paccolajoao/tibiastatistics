CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    world TEXT NOT NULL,
    vocation TEXT NOT NULL,
    level INTEGER NOT NULL,
    sex TEXT NOT NULL,
    residence TEXT NOT NULL DEFAULT '',
    guild_name TEXT NOT NULL DEFAULT '',
    guild_rank TEXT NOT NULL DEFAULT '',
    achievement_points INTEGER NOT NULL DEFAULT 0,
    account_status TEXT NOT NULL DEFAULT '',
    last_login TIMESTAMPTZ,
    is_main BOOLEAN NOT NULL DEFAULT false,
    last_synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_characters_user_name
    ON characters (user_id, name)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_characters_user_id
    ON characters (user_id)
    WHERE deleted_at IS NULL;

CREATE TRIGGER characters_set_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

CREATE TABLE character_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    character_id UUID NOT NULL REFERENCES characters(id),
    level INTEGER NOT NULL,
    vocation TEXT NOT NULL,
    world TEXT NOT NULL,
    achievement_points INTEGER NOT NULL DEFAULT 0,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_character_snapshots_character_captured
    ON character_snapshots (character_id, captured_at DESC);
