DROP INDEX IF EXISTS idx_hunting_sessions_character_id;

ALTER TABLE hunting_sessions
    DROP COLUMN character_id;
