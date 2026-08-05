ALTER TABLE hunting_sessions
    ADD COLUMN character_id UUID REFERENCES characters(id);

CREATE INDEX idx_hunting_sessions_character_id
    ON hunting_sessions (character_id)
    WHERE character_id IS NOT NULL;
