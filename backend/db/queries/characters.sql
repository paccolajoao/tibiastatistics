-- name: InsertCharacter :one
INSERT INTO characters (
    user_id, name, world, vocation, level, sex,
    residence, guild_name, guild_rank, achievement_points,
    account_status, last_login, is_main, last_synced_at
)
VALUES (
    $1, $2, $3, $4, $5, $6,
    $7, $8, $9, $10,
    $11, $12, $13, $14
)
RETURNING *;

-- name: GetCharacterByID :one
SELECT *
FROM characters
WHERE id = $1
  AND user_id = $2
  AND deleted_at IS NULL;

-- name: ListCharactersByUser :many
SELECT *
FROM characters
WHERE user_id = $1
  AND deleted_at IS NULL
ORDER BY name ASC;

-- name: ListAllActiveCharacters :many
SELECT *
FROM characters
WHERE deleted_at IS NULL;

-- name: UpdateCharacterSnapshot :one
UPDATE characters
SET world = $2,
    vocation = $3,
    level = $4,
    sex = $5,
    residence = $6,
    guild_name = $7,
    guild_rank = $8,
    achievement_points = $9,
    account_status = $10,
    last_login = $11,
    is_main = $12,
    last_synced_at = $13
WHERE id = $1
  AND deleted_at IS NULL
RETURNING *;

-- name: SoftDeleteCharacter :exec
UPDATE characters
SET deleted_at = now()
WHERE id = $1
  AND user_id = $2
  AND deleted_at IS NULL;
