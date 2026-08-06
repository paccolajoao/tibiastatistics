DROP INDEX IF EXISTS idx_hunting_sessions_hunt_type_id;

ALTER TABLE hunting_sessions
    DROP COLUMN hunt_type_id;
