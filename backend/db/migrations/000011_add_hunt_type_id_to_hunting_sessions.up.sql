ALTER TABLE hunting_sessions
    ADD COLUMN hunt_type_id UUID REFERENCES hunt_types(id);

CREATE INDEX idx_hunting_sessions_hunt_type_id
    ON hunting_sessions (hunt_type_id)
    WHERE hunt_type_id IS NOT NULL;
