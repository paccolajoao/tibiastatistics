package main

import (
	"context"
	"log"
	"net/http"

	"github.com/pacco/tibiastatistics/backend/internal/auth"
	"github.com/pacco/tibiastatistics/backend/internal/config"
	"github.com/pacco/tibiastatistics/backend/internal/database"
	"github.com/pacco/tibiastatistics/backend/internal/handlers"
	"github.com/pacco/tibiastatistics/backend/internal/poller"
	"github.com/pacco/tibiastatistics/backend/internal/router"
	"github.com/pacco/tibiastatistics/backend/internal/sprites"
	"github.com/pacco/tibiastatistics/backend/internal/tibia"
)

func main() {
	cfg := config.Load()

	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is required")
	}
	if cfg.JWTSecret == "" || cfg.JWTRefreshSecret == "" {
		log.Fatal("JWT_SECRET and JWT_REFRESH_SECRET are required")
	}

	ctx := context.Background()

	pool, err := database.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	queries := database.New(pool)
	tokens := auth.NewTokenManager(cfg.JWTSecret, cfg.JWTRefreshSecret)
	tibiaClient := tibia.NewClient()

	authHandler := handlers.NewAuthHandler(queries, tokens)
	tibiaHandler := handlers.NewTibiaHandler(tibiaClient)
	worldsHandler := handlers.NewWorldsHandler(queries)
	huntingHandler := handlers.NewHuntingHandler(queries)
	spritesHandler := handlers.NewSpritesHandler(queries, sprites.NewClient())
	charactersHandler := handlers.NewCharactersHandler(queries, tibiaClient)

	worldPoller := poller.New(tibiaClient, queries, cfg.SnapshotRetention)
	go worldPoller.Run(ctx, cfg.PollerInterval)

	characterPoller := poller.NewCharacterPoller(tibiaClient, queries, cfg.CharacterSnapshotRetention)
	go characterPoller.Run(ctx, cfg.CharacterPollerInterval)

	r := router.New(router.Dependencies{
		AuthHandler:       authHandler,
		TibiaHandler:      tibiaHandler,
		WorldsHandler:     worldsHandler,
		HuntingHandler:    huntingHandler,
		SpritesHandler:    spritesHandler,
		CharactersHandler: charactersHandler,
		Tokens:            tokens,
		FrontendOrigin:    cfg.FrontendOrigin,
	})

	log.Printf("listening on :%s", cfg.Port)
	if err := http.ListenAndServe(":"+cfg.Port, r); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
