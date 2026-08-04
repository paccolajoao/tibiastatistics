-- name: GetSpritesByNames :many
SELECT *
FROM game_asset_sprites
WHERE kind = $1
  AND name = ANY(sqlc.arg(names)::text[])
  AND deleted_at IS NULL;

-- name: UpsertSprite :exec
INSERT INTO game_asset_sprites (kind, name, image_url, resolved_at)
VALUES ($1, $2, $3, now())
ON CONFLICT (kind, name) WHERE deleted_at IS NULL
DO UPDATE SET image_url = $3, resolved_at = now();
