package handlers

import (
	"net/http"
	"strconv"

	"github.com/pacco/tibiastatistics/backend/internal/tibia"
)

type TibiaHandler struct {
	client *tibia.Client
}

func NewTibiaHandler(client *tibia.Client) *TibiaHandler {
	return &TibiaHandler{client: client}
}

func (h *TibiaHandler) Highscores(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	world := query.Get("world")
	category := query.Get("category")
	vocation := query.Get("vocation")

	page := 1
	if p := query.Get("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil {
			page = parsed
		}
	}

	result, err := h.client.GetHighscores(r.Context(), world, category, vocation, page)
	if err != nil {
		http.Error(w, "failed to fetch highscores from tibiadata", http.StatusBadGateway)
		return
	}

	writeJSON(w, http.StatusOK, result)
}
