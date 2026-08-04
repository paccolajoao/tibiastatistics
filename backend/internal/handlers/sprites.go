package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/pacco/tibiastatistics/backend/internal/database"
	"github.com/pacco/tibiastatistics/backend/internal/sprites"
)

const spriteCacheTTL = 30 * 24 * time.Hour

type SpritesHandler struct {
	queries *database.Queries
	client  *sprites.Client
}

func NewSpritesHandler(queries *database.Queries, client *sprites.Client) *SpritesHandler {
	return &SpritesHandler{queries: queries, client: client}
}

func (h *SpritesHandler) Resolve(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	kind := query.Get("kind")
	if kind != "creature" && kind != "item" {
		http.Error(w, "kind must be 'creature' or 'item'", http.StatusBadRequest)
		return
	}

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
		writeJSON(w, http.StatusOK, map[string]*string{})
		return
	}

	cached, err := h.queries.GetSpritesByNames(r.Context(), database.GetSpritesByNamesParams{
		Kind:  kind,
		Names: names,
	})
	if err != nil {
		http.Error(w, "failed to fetch sprite cache", http.StatusInternalServerError)
		return
	}

	result := make(map[string]*string, len(names))
	fresh := map[string]bool{}
	for _, row := range cached {
		if time.Since(row.ResolvedAt.Time) > spriteCacheTTL {
			continue
		}
		fresh[row.Name] = true
		if row.ImageUrl.Valid && row.ImageUrl.String != "" {
			url := row.ImageUrl.String
			result[row.Name] = &url
		} else {
			result[row.Name] = nil
		}
	}

	for _, name := range names {
		if fresh[name] {
			continue
		}

		imageURL, err := h.client.Resolve(r.Context(), name)
		if err != nil {
			result[name] = nil
			continue
		}

		imageUrlParam := pgtype.Text{}
		if imageURL != "" {
			imageUrlParam = pgtype.Text{String: imageURL, Valid: true}
			result[name] = &imageURL
		} else {
			result[name] = nil
		}

		_ = h.queries.UpsertSprite(r.Context(), database.UpsertSpriteParams{
			Kind:     kind,
			Name:     name,
			ImageUrl: imageUrlParam,
		})
	}

	writeJSON(w, http.StatusOK, result)
}
