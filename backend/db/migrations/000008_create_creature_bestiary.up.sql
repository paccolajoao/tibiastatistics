CREATE TABLE creature_bestiary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    difficulty TEXT,
    is_boss BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_creature_bestiary_name
    ON creature_bestiary (name)
    WHERE deleted_at IS NULL;

CREATE TRIGGER creature_bestiary_set_updated_at
    BEFORE UPDATE ON creature_bestiary
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
