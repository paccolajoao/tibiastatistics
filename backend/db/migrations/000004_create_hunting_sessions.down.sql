DROP TRIGGER IF EXISTS hunting_sessions_set_updated_at ON hunting_sessions;

DROP INDEX IF EXISTS idx_hunting_sessions_user_start;

DROP TABLE hunting_sessions;
