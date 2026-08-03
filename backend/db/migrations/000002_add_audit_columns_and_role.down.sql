DROP TRIGGER IF EXISTS users_set_updated_at ON users;

ALTER TABLE users
    DROP COLUMN role,
    DROP COLUMN updated_at,
    DROP COLUMN deleted_at;

DROP FUNCTION IF EXISTS set_updated_at();
