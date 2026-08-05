package config

import (
	"os"
	"strconv"
	"time"
)

type Config struct {
	Port                       string
	DatabaseURL                string
	JWTSecret                  string
	JWTRefreshSecret           string
	FrontendOrigin             string
	AdminEmail                 string
	AdminPassword              string
	PollerInterval             time.Duration
	SnapshotRetention          time.Duration
	CharacterPollerInterval    time.Duration
	CharacterSnapshotRetention time.Duration
}

func Load() Config {
	return Config{
		Port:              getEnv("PORT", "8080"),
		DatabaseURL:       getEnv("DATABASE_URL", ""),
		JWTSecret:         getEnv("JWT_SECRET", ""),
		JWTRefreshSecret:  getEnv("JWT_REFRESH_SECRET", ""),
		FrontendOrigin:    getEnv("FRONTEND_ORIGIN", "http://localhost:3000"),
		AdminEmail:        getEnv("ADMIN_EMAIL", ""),
		AdminPassword:     getEnv("ADMIN_PASSWORD", ""),
		PollerInterval:             time.Duration(getEnvInt("POLLER_INTERVAL_MINUTES", 15)) * time.Minute,
		SnapshotRetention:          time.Duration(getEnvInt("SNAPSHOT_RETENTION_DAYS", 60)) * 24 * time.Hour,
		CharacterPollerInterval:    time.Duration(getEnvInt("CHARACTER_POLLER_INTERVAL_MINUTES", 60)) * time.Minute,
		CharacterSnapshotRetention: time.Duration(getEnvInt("CHARACTER_SNAPSHOT_RETENTION_DAYS", 365)) * 24 * time.Hour,
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}
