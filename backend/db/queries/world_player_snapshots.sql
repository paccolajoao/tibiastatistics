-- name: InsertWorldPlayerSnapshot :exec
INSERT INTO world_player_snapshots (world_name, location, pvp_type, players_online, collected_at)
VALUES ($1, $2, $3, $4, $5);

-- name: DeleteSnapshotsOlderThan :exec
DELETE FROM world_player_snapshots WHERE collected_at < $1;

-- name: GetWorldAverages :many
SELECT world_name,
       location,
       pvp_type,
       AVG(players_online)::float8 AS avg_players_online,
       MAX(players_online)::int AS max_players_online,
       MIN(players_online)::int AS min_players_online,
       COUNT(*) AS sample_count
FROM world_player_snapshots
WHERE collected_at >= $1
  AND (sqlc.arg(location)::text = '' OR location = sqlc.arg(location))
  AND (sqlc.arg(pvp_type)::text = '' OR pvp_type = sqlc.arg(pvp_type))
GROUP BY world_name, location, pvp_type
ORDER BY avg_players_online DESC;

-- name: GetWorldTimeSeries :many
SELECT world_name, players_online, collected_at
FROM world_player_snapshots
WHERE collected_at >= $1
  AND (sqlc.arg(world_name)::text = '' OR world_name = sqlc.arg(world_name))
ORDER BY collected_at ASC;

-- name: GetWorldHourlyAverages :many
SELECT world_name,
       EXTRACT(HOUR FROM collected_at AT TIME ZONE 'UTC')::int AS hour_of_day,
       AVG(players_online)::float8 AS avg_players_online,
       COUNT(*) AS sample_count
FROM world_player_snapshots
WHERE collected_at >= $1
  AND (sqlc.arg(world_name)::text = '' OR world_name = sqlc.arg(world_name))
  AND (sqlc.arg(location)::text = '' OR location = sqlc.arg(location))
  AND (sqlc.arg(pvp_type)::text = '' OR pvp_type = sqlc.arg(pvp_type))
GROUP BY world_name, hour_of_day
ORDER BY world_name, hour_of_day;
