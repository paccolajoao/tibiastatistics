-- name: CreateUser :one
INSERT INTO users (email, password_hash)
VALUES ($1, $2)
RETURNING id, email, password_hash, role, created_at, updated_at, deleted_at;

-- name: GetUserByEmail :one
SELECT id, email, password_hash, role, created_at, updated_at, deleted_at
FROM users
WHERE email = $1 AND deleted_at IS NULL;

-- name: GetUserByID :one
SELECT id, email, password_hash, role, created_at, updated_at, deleted_at
FROM users
WHERE id = $1 AND deleted_at IS NULL;

-- name: UpsertAdminUser :one
INSERT INTO users (email, password_hash, role)
VALUES ($1, $2, 'admin')
ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        role = 'admin'
RETURNING id, email, password_hash, role, created_at, updated_at, deleted_at;
