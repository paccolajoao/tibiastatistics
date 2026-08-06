CREATE TABLE hunt_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_hunt_types_user_name
    ON hunt_types (user_id, name)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_hunt_types_user_id
    ON hunt_types (user_id)
    WHERE deleted_at IS NULL;

CREATE TRIGGER hunt_types_set_updated_at
    BEFORE UPDATE ON hunt_types
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
