-- name: InsertHuntType :one
INSERT INTO hunt_types (user_id, name)
VALUES ($1, $2)
RETURNING *;

-- name: GetHuntTypeByID :one
SELECT * FROM hunt_types
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;

-- name: ListHuntTypesByUser :many
SELECT * FROM hunt_types
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY name ASC;

-- name: SoftDeleteHuntType :exec
UPDATE hunt_types
SET deleted_at = now()
WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL;
