-- name: InsertHuntingSession :one
INSERT INTO hunting_sessions (
    user_id, name, loadout,
    session_start, session_end, session_length_seconds,
    balance, damage, damage_per_hour, healing, healing_per_hour,
    loot, supplies, xp_gain, xp_per_hour, raw_xp_gain, raw_xp_per_hour,
    killed_monsters, looted_items, character_id
)
VALUES (
    $1, $2, $3,
    $4, $5, $6,
    $7, $8, $9, $10, $11,
    $12, $13, $14, $15, $16, $17,
    $18, $19, $20
)
RETURNING *;

-- name: ListHuntingSessions :many
SELECT *
FROM hunting_sessions
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY session_start DESC;

-- name: DeleteHuntingSession :exec
UPDATE hunting_sessions
SET deleted_at = now()
WHERE id = $1
  AND user_id = $2
  AND deleted_at IS NULL;

-- name: UpdateHuntingSessionCharacter :one
UPDATE hunting_sessions
SET character_id = $3
WHERE id = $1
  AND user_id = $2
  AND deleted_at IS NULL
RETURNING *;
