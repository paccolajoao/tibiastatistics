package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/pacco/tibiastatistics/backend/internal/database"
	"github.com/pacco/tibiastatistics/backend/internal/tibia"
)

type CharactersHandler struct {
	queries *database.Queries
	client  *tibia.Client
}

func NewCharactersHandler(queries *database.Queries, client *tibia.Client) *CharactersHandler {
	return &CharactersHandler{queries: queries, client: client}
}

type character struct {
	ID                string     `json:"id"`
	Name              string     `json:"name"`
	World             string     `json:"world"`
	Vocation          string     `json:"vocation"`
	Level             int32      `json:"level"`
	Sex               string     `json:"sex"`
	Residence         string     `json:"residence"`
	GuildName         string     `json:"guild_name"`
	GuildRank         string     `json:"guild_rank"`
	AchievementPoints int32      `json:"achievement_points"`
	AccountStatus     string     `json:"account_status"`
	LastLogin         *time.Time `json:"last_login"`
	IsMain            bool       `json:"is_main"`
	LastSyncedAt      time.Time  `json:"last_synced_at"`
	CreatedAt         time.Time  `json:"created_at"`
}

type characterSnapshot struct {
	Level             int32     `json:"level"`
	Vocation          string    `json:"vocation"`
	World             string    `json:"world"`
	AchievementPoints int32     `json:"achievement_points"`
	CapturedAt        time.Time `json:"captured_at"`
}

func toCharacter(row database.Character) character {
	var lastLogin *time.Time
	if row.LastLogin.Valid {
		lastLogin = &row.LastLogin.Time
	}

	return character{
		ID:                uuidString(row.ID),
		Name:              row.Name,
		World:             row.World,
		Vocation:          row.Vocation,
		Level:             row.Level,
		Sex:               row.Sex,
		Residence:         row.Residence,
		GuildName:         row.GuildName,
		GuildRank:         row.GuildRank,
		AchievementPoints: row.AchievementPoints,
		AccountStatus:     row.AccountStatus,
		LastLogin:         lastLogin,
		IsMain:            row.IsMain,
		LastSyncedAt:      row.LastSyncedAt.Time,
		CreatedAt:         row.CreatedAt.Time,
	}
}

func toCharacterSnapshot(row database.CharacterSnapshot) characterSnapshot {
	return characterSnapshot{
		Level:             row.Level,
		Vocation:          row.Vocation,
		World:             row.World,
		AchievementPoints: row.AchievementPoints,
		CapturedAt:        row.CapturedAt.Time,
	}
}

func guildFields(result *tibia.CharacterResult) (name string, rank string) {
	if result.Guild == nil {
		return "", ""
	}
	return result.Guild.Name, result.Guild.Rank
}

func lastLoginParam(result *tibia.CharacterResult) pgtype.Timestamptz {
	if result.LastLogin == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: *result.LastLogin, Valid: true}
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func (h *CharactersHandler) Create(w http.ResponseWriter, r *http.Request) {
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

	result, err := h.client.GetCharacter(r.Context(), name)
	if errors.Is(err, tibia.ErrCharacterNotFound) {
		http.Error(w, "character not found on Tibia", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "failed to fetch character data", http.StatusBadGateway)
		return
	}

	guildName, guildRank := guildFields(result)

	row, err := h.queries.InsertCharacter(r.Context(), database.InsertCharacterParams{
		UserID:            userID,
		Name:              result.Name,
		World:             result.World,
		Vocation:          result.Vocation,
		Level:             int32(result.Level),
		Sex:               result.Sex,
		Residence:         result.Residence,
		GuildName:         guildName,
		GuildRank:         guildRank,
		AchievementPoints: int32(result.AchievementPoints),
		AccountStatus:     result.AccountStatus,
		LastLogin:         lastLoginParam(result),
		IsMain:            result.IsMain,
		LastSyncedAt:      pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true},
	})
	if isUniqueViolation(err) {
		http.Error(w, "character already registered", http.StatusConflict)
		return
	}
	if err != nil {
		http.Error(w, "failed to save character", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, toCharacter(row))
}

func (h *CharactersHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := userUUID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := h.queries.ListCharactersByUser(r.Context(), userID)
	if err != nil {
		http.Error(w, "failed to fetch characters", http.StatusInternalServerError)
		return
	}

	characters := make([]character, 0, len(rows))
	for _, row := range rows {
		characters = append(characters, toCharacter(row))
	}

	writeJSON(w, http.StatusOK, characters)
}

func (h *CharactersHandler) Get(w http.ResponseWriter, r *http.Request) {
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

	row, err := h.queries.GetCharacterByID(r.Context(), database.GetCharacterByIDParams{
		ID:     id,
		UserID: userID,
	})
	if err != nil {
		http.Error(w, "character not found", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, toCharacter(row))
}

func (h *CharactersHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

	if err := h.queries.SoftDeleteCharacter(r.Context(), database.SoftDeleteCharacterParams{
		ID:     id,
		UserID: userID,
	}); err != nil {
		http.Error(w, "failed to delete character", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *CharactersHandler) Refresh(w http.ResponseWriter, r *http.Request) {
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

	existing, err := h.queries.GetCharacterByID(r.Context(), database.GetCharacterByIDParams{
		ID:     id,
		UserID: userID,
	})
	if err != nil {
		http.Error(w, "character not found", http.StatusNotFound)
		return
	}

	result, err := h.client.GetCharacter(r.Context(), existing.Name)
	if errors.Is(err, tibia.ErrCharacterNotFound) {
		http.Error(w, "character not found on Tibia", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, "failed to fetch character data", http.StatusBadGateway)
		return
	}

	guildName, guildRank := guildFields(result)
	now := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}

	row, err := h.queries.UpdateCharacterSnapshot(r.Context(), database.UpdateCharacterSnapshotParams{
		ID:                id,
		World:             result.World,
		Vocation:          result.Vocation,
		Level:             int32(result.Level),
		Sex:               result.Sex,
		Residence:         result.Residence,
		GuildName:         guildName,
		GuildRank:         guildRank,
		AchievementPoints: int32(result.AchievementPoints),
		AccountStatus:     result.AccountStatus,
		LastLogin:         lastLoginParam(result),
		IsMain:            result.IsMain,
		LastSyncedAt:      now,
	})
	if err != nil {
		http.Error(w, "failed to update character", http.StatusInternalServerError)
		return
	}

	_ = h.queries.InsertCharacterSnapshot(r.Context(), database.InsertCharacterSnapshotParams{
		CharacterID:       id,
		Level:             int32(result.Level),
		Vocation:          result.Vocation,
		World:             result.World,
		AchievementPoints: int32(result.AchievementPoints),
		CapturedAt:        now,
	})

	writeJSON(w, http.StatusOK, toCharacter(row))
}

func (h *CharactersHandler) Snapshots(w http.ResponseWriter, r *http.Request) {
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

	if _, err := h.queries.GetCharacterByID(r.Context(), database.GetCharacterByIDParams{
		ID:     id,
		UserID: userID,
	}); err != nil {
		http.Error(w, "character not found", http.StatusNotFound)
		return
	}

	days := 90
	if raw := r.URL.Query().Get("days"); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			days = parsed
		}
	}
	since := pgtype.Timestamptz{Time: time.Now().UTC().AddDate(0, 0, -days), Valid: true}

	rows, err := h.queries.ListCharacterSnapshots(r.Context(), database.ListCharacterSnapshotsParams{
		CharacterID: id,
		CapturedAt:  since,
	})
	if err != nil {
		http.Error(w, "failed to fetch character snapshots", http.StatusInternalServerError)
		return
	}

	snapshots := make([]characterSnapshot, 0, len(rows))
	for _, row := range rows {
		snapshots = append(snapshots, toCharacterSnapshot(row))
	}

	writeJSON(w, http.StatusOK, snapshots)
}
