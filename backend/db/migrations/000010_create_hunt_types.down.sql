DROP TRIGGER IF EXISTS hunt_types_set_updated_at ON hunt_types;

DROP INDEX IF EXISTS idx_hunt_types_user_id;

DROP INDEX IF EXISTS idx_hunt_types_user_name;

DROP TABLE hunt_types;
