package main

import (
	"context"
	"log"

	"github.com/pacco/tibiastatistics/backend/internal/auth"
	"github.com/pacco/tibiastatistics/backend/internal/config"
	"github.com/pacco/tibiastatistics/backend/internal/database"
)

func main() {
	cfg := config.Load()

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	if cfg.AdminEmail == "" || cfg.AdminPassword == "" {
		log.Fatal("ADMIN_EMAIL and ADMIN_PASSWORD are required")
	}

	ctx := context.Background()

	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	queries := database.New(pool)

	hash, err := auth.HashPassword(cfg.AdminPassword)
	if err != nil {
		log.Fatalf("failed to hash admin password: %v", err)
	}

	admin, err := queries.UpsertAdminUser(ctx, database.UpsertAdminUserParams{
		Email:        cfg.AdminEmail,
		PasswordHash: hash,
	})
	if err != nil {
		log.Fatalf("failed to seed admin user: %v", err)
	}

	log.Printf("admin user ready: %s (role=%s)", admin.Email, admin.Role)
}
