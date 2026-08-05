DROP INDEX IF EXISTS idx_character_snapshots_character_captured;

DROP TABLE character_snapshots;

DROP TRIGGER IF EXISTS characters_set_updated_at ON characters;

DROP INDEX IF EXISTS idx_characters_user_id;

DROP INDEX IF EXISTS idx_characters_user_name;

DROP TABLE characters;
