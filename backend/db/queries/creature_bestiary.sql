-- name: GetBestiaryByNames :many
SELECT *
FROM creature_bestiary
WHERE name = ANY(sqlc.arg(names)::text[])
  AND deleted_at IS NULL;

-- name: UpsertBestiary :exec
INSERT INTO creature_bestiary (name, difficulty, is_boss, resolved_at)
VALUES ($1, $2, $3, now())
ON CONFLICT (name) WHERE deleted_at IS NULL
DO UPDATE SET difficulty = $2, is_boss = $3, resolved_at = now();
