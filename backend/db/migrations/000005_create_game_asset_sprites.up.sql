CREATE TABLE game_asset_sprites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    resolved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_game_asset_sprites_kind_name
    ON game_asset_sprites (kind, name)
    WHERE deleted_at IS NULL;

CREATE TRIGGER game_asset_sprites_set_updated_at
    BEFORE UPDATE ON game_asset_sprites
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
