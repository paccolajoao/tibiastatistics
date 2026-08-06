package handlers

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/pacco/tibiastatistics/backend/internal/database"
)

type HuntTypesHandler struct {
	queries *database.Queries
}

func NewHuntTypesHandler(queries *database.Queries) *HuntTypesHandler {
	return &HuntTypesHandler{queries: queries}
}

type huntType struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

func toHuntType(row database.HuntType) huntType {
	return huntType{
		ID:        uuidString(row.ID),
		Name:      row.Name,
		CreatedAt: row.CreatedAt.Time,
	}
}

func (h *HuntTypesHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := userUUID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	name := strings.TrimSpace(body.Name)
	if name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}

	row, err := h.queries.InsertHuntType(r.Context(), database.InsertHuntTypeParams{
		UserID: userID,
		Name:   name,
	})
	if isUniqueViolation(err) {
		http.Error(w, "hunt type already registered", http.StatusConflict)
		return
	}
	if err != nil {
		http.Error(w, "failed to save hunt type", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, toHuntType(row))
}

func (h *HuntTypesHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := userUUID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := h.queries.ListHuntTypesByUser(r.Context(), userID)
	if err != nil {
		http.Error(w, "failed to fetch hunt types", http.StatusInternalServerError)
		return
	}

	huntTypes := make([]huntType, 0, len(rows))
	for _, row := range rows {
		huntTypes = append(huntTypes, toHuntType(row))
	}

	writeJSON(w, http.StatusOK, huntTypes)
}

func (h *HuntTypesHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := userUUID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var id pgtype.UUID
	if err := id.Scan(chi.URLParam(r, "id")); err != nil {
		http.Error(w, "invalid id", http.StatusBadRequest)
		return
	}

	if err := h.queries.SoftDeleteHuntType(r.Context(), database.SoftDeleteHuntTypeParams{
		ID:     id,
		UserID: userID,
	}); err != nil {
		http.Error(w, "failed to delete hunt type", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
