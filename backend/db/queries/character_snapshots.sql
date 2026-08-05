-- name: InsertCharacterSnapshot :exec
INSERT INTO character_snapshots (
    character_id, level, vocation, world, achievement_points, captured_at
)
VALUES (
    $1, $2, $3, $4, $5, $6
);

-- name: ListCharacterSnapshots :many
SELECT *
FROM character_snapshots
WHERE character_id = $1
  AND captured_at >= $2
ORDER BY captured_at ASC;

-- name: DeleteCharacterSnapshotsOlderThan :exec
DELETE FROM character_snapshots
WHERE captured_at < $1;
