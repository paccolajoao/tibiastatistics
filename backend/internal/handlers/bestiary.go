package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/pacco/tibiastatistics/backend/internal/bestiary"
	"github.com/pacco/tibiastatistics/backend/internal/database"
)

const bestiaryCacheTTL = 30 * 24 * time.Hour

type BestiaryHandler struct {
	queries *database.Queries
	client  *bestiary.Client
}

func NewBestiaryHandler(queries *database.Queries, client *bestiary.Client) *BestiaryHandler {
	return &BestiaryHandler{queries: queries, client: client}
}

type bestiaryEntry struct {
	Difficulty string `json:"difficulty"`
	IsBoss     bool   `json:"is_boss"`
}

// Resolve serves GET /api/bestiary?names=dragon lord,demon,rat — resolves
// Bestiary difficulty / boss status for each name, cached for
// bestiaryCacheTTL, with live TibiaWiki lookups on cache miss/stale.
func (h *BestiaryHandler) Resolve(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	rawNames := strings.Split(query.Get("names"), ",")
	names := make([]string, 0, len(rawNames))
	seen := map[string]bool{}
	for _, raw := range rawNames {
		name := strings.ToLower(strings.TrimSpace(raw))
		if name == "" || seen[name] {
			continue
		}
		seen[name] = true
		names = append(names, name)
	}
	if len(names) == 0 {
		writeJSON(w, http.StatusOK, map[string]bestiaryEntry{})
		return
	}

	cached, err := h.queries.GetBestiaryByNames(r.Context(), names)
	if err != nil {
		http.Error(w, "failed to fetch bestiary cache", http.StatusInternalServerError)
		return
	}

	result := make(map[string]bestiaryEntry, len(names))
	fresh := map[string]bool{}
	for _, row := range cached {
		if time.Since(row.ResolvedAt.Time) > bestiaryCacheTTL {
			continue
		}
		fresh[row.Name] = true
		result[row.Name] = bestiaryEntry{
			Difficulty: row.Difficulty.String,
			IsBoss:     row.IsBoss,
		}
	}

	for _, name := range names {
		if fresh[name] {
			continue
		}

		info, err := h.client.Resolve(r.Context(), name)
		if err != nil {
			result[name] = bestiaryEntry{}
			continue
		}

		result[name] = bestiaryEntry{Difficulty: info.Difficulty, IsBoss: info.IsBoss}

		difficulty := pgtype.Text{}
		if info.Difficulty != "" {
			difficulty = pgtype.Text{String: info.Difficulty, Valid: true}
		}
		_ = h.queries.UpsertBestiary(r.Context(), database.UpsertBestiaryParams{
			Name:       name,
			Difficulty: difficulty,
			IsBoss:     info.IsBoss,
		})
	}

	writeJSON(w, http.StatusOK, result)
}
