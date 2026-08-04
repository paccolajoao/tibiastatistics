package handlers

import (
	"encoding/json"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"github.com/pacco/tibiastatistics/backend/internal/auth"
	"github.com/pacco/tibiastatistics/backend/internal/database"
)

type HuntingHandler struct {
	queries *database.Queries
}

func NewHuntingHandler(queries *database.Queries) *HuntingHandler {
	return &HuntingHandler{queries: queries}
}

type killedMonster struct {
	Count int    `json:"Count"`
	Name  string `json:"Name"`
}

type lootedItem struct {
	Count int    `json:"Count"`
	Name  string `json:"Name"`
}

type huntingSessionPayload struct {
	Balance        string          `json:"Balance"`
	Damage         string          `json:"Damage"`
	DamagePerHour  string          `json:"Damage/h"`
	Healing        string          `json:"Healing"`
	HealingPerHour string          `json:"Healing/h"`
	KilledMonsters []killedMonster `json:"Killed Monsters"`
	Loot           string          `json:"Loot"`
	LootedItems    []lootedItem    `json:"Looted Items"`
	RawXPGain      string          `json:"Raw XP Gain"`
	RawXPPerHour   string          `json:"Raw XP/h"`
	SessionEnd     string          `json:"Session end"`
	SessionLength  string          `json:"Session length"`
	SessionStart   string          `json:"Session start"`
	Supplies       string          `json:"Supplies"`
	XPGain         string          `json:"XP Gain"`
	XPPerHour      string          `json:"XP/h"`
}

type huntingSession struct {
	ID                   string          `json:"id"`
	Name                 string          `json:"name"`
	Loadout              string          `json:"loadout"`
	SessionStart         time.Time       `json:"session_start"`
	SessionEnd           time.Time       `json:"session_end"`
	SessionLengthSeconds int32           `json:"session_length_seconds"`
	Balance              int64           `json:"balance"`
	Damage               int64           `json:"damage"`
	DamagePerHour        int64           `json:"damage_per_hour"`
	Healing              int64           `json:"healing"`
	HealingPerHour       int64           `json:"healing_per_hour"`
	Loot                 int64           `json:"loot"`
	Supplies             int64           `json:"supplies"`
	XPGain               int64           `json:"xp_gain"`
	XPPerHour            int64           `json:"xp_per_hour"`
	RawXPGain            int64           `json:"raw_xp_gain"`
	RawXPPerHour         int64           `json:"raw_xp_per_hour"`
	KilledMonsters       []killedMonster `json:"killed_monsters"`
	LootedItems          []lootedItem    `json:"looted_items"`
	CreatedAt            time.Time       `json:"created_at"`
}

var nonDigitPattern = regexp.MustCompile(`[^0-9-]`)

func parseSignedNumber(raw string) (int64, error) {
	cleaned := nonDigitPattern.ReplaceAllString(raw, "")
	if cleaned == "" || cleaned == "-" {
		return 0, nil
	}
	return strconv.ParseInt(cleaned, 10, 64)
}

// parseSessionLength converts a duration like "01:08h" into seconds.
func parseSessionLength(raw string) (int32, error) {
	trimmed := strings.TrimSuffix(strings.TrimSpace(raw), "h")
	parts := strings.Split(trimmed, ":")
	if len(parts) != 2 {
		return 0, strconv.ErrSyntax
	}
	hours, err := strconv.Atoi(parts[0])
	if err != nil {
		return 0, err
	}
	minutes, err := strconv.Atoi(parts[1])
	if err != nil {
		return 0, err
	}
	return int32(hours*3600 + minutes*60), nil
}

// tibiaSessionTimeLayout matches "2026-08-03, 17:39:17".
const tibiaSessionTimeLayout = "2006-01-02, 15:04:05"

func parseSessionTime(raw string) (time.Time, error) {
	return time.Parse(tibiaSessionTimeLayout, strings.TrimSpace(raw))
}

func userUUID(r *http.Request) (pgtype.UUID, bool) {
	user, ok := auth.UserFromContext(r.Context())
	if !ok {
		return pgtype.UUID{}, false
	}
	var id pgtype.UUID
	if err := id.Scan(user.UserID); err != nil {
		return pgtype.UUID{}, false
	}
	return id, true
}

func (h *HuntingHandler) Import(w http.ResponseWriter, r *http.Request) {
	userID, ok := userUUID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "invalid multipart form", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "missing file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	var payload huntingSessionPayload
	if err := json.NewDecoder(file).Decode(&payload); err != nil {
		http.Error(w, "invalid session json: "+err.Error(), http.StatusBadRequest)
		return
	}

	name := strings.TrimSpace(r.FormValue("name"))
	if name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	loadout := strings.TrimSpace(r.FormValue("loadout"))

	sessionStart, err := parseSessionTime(payload.SessionStart)
	if err != nil {
		http.Error(w, "invalid session start: "+err.Error(), http.StatusBadRequest)
		return
	}
	sessionEnd, err := parseSessionTime(payload.SessionEnd)
	if err != nil {
		http.Error(w, "invalid session end: "+err.Error(), http.StatusBadRequest)
		return
	}
	sessionLengthSeconds, err := parseSessionLength(payload.SessionLength)
	if err != nil {
		http.Error(w, "invalid session length: "+err.Error(), http.StatusBadRequest)
		return
	}

	numbers := map[string]string{
		"balance":          payload.Balance,
		"damage":           payload.Damage,
		"damage_per_hour":  payload.DamagePerHour,
		"healing":          payload.Healing,
		"healing_per_hour": payload.HealingPerHour,
		"loot":             payload.Loot,
		"supplies":         payload.Supplies,
		"xp_gain":          payload.XPGain,
		"xp_per_hour":      payload.XPPerHour,
		"raw_xp_gain":      payload.RawXPGain,
		"raw_xp_per_hour":  payload.RawXPPerHour,
	}
	parsed := map[string]int64{}
	for field, raw := range numbers {
		value, err := parseSignedNumber(raw)
		if err != nil {
			http.Error(w, "invalid "+field+": "+err.Error(), http.StatusBadRequest)
			return
		}
		parsed[field] = value
	}

	killedMonsters, err := json.Marshal(payload.KilledMonsters)
	if err != nil {
		http.Error(w, "invalid killed monsters", http.StatusBadRequest)
		return
	}
	lootedItems, err := json.Marshal(payload.LootedItems)
	if err != nil {
		http.Error(w, "invalid looted items", http.StatusBadRequest)
		return
	}

	row, err := h.queries.InsertHuntingSession(r.Context(), database.InsertHuntingSessionParams{
		UserID:               userID,
		Name:                 name,
		Loadout:              loadout,
		SessionStart:         pgtype.Timestamptz{Time: sessionStart, Valid: true},
		SessionEnd:           pgtype.Timestamptz{Time: sessionEnd, Valid: true},
		SessionLengthSeconds: sessionLengthSeconds,
		Balance:              parsed["balance"],
		Damage:               parsed["damage"],
		DamagePerHour:        parsed["damage_per_hour"],
		Healing:              parsed["healing"],
		HealingPerHour:       parsed["healing_per_hour"],
		Loot:                 parsed["loot"],
		Supplies:             parsed["supplies"],
		XpGain:               parsed["xp_gain"],
		XpPerHour:            parsed["xp_per_hour"],
		RawXpGain:            parsed["raw_xp_gain"],
		RawXpPerHour:         parsed["raw_xp_per_hour"],
		KilledMonsters:       killedMonsters,
		LootedItems:          lootedItems,
	})
	if err != nil {
		http.Error(w, "failed to save hunting session", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, toHuntingSession(row))
}

func (h *HuntingHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := userUUID(r)
	if !ok {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	rows, err := h.queries.ListHuntingSessions(r.Context(), userID)
	if err != nil {
		http.Error(w, "failed to fetch hunting sessions", http.StatusInternalServerError)
		return
	}

	sessions := make([]huntingSession, 0, len(rows))
	for _, row := range rows {
		sessions = append(sessions, toHuntingSession(row))
	}

	writeJSON(w, http.StatusOK, sessions)
}

func (h *HuntingHandler) Delete(w http.ResponseWriter, r *http.Request) {
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

	if err := h.queries.DeleteHuntingSession(r.Context(), database.DeleteHuntingSessionParams{
		ID:     id,
		UserID: userID,
	}); err != nil {
		http.Error(w, "failed to delete hunting session", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func toHuntingSession(row database.HuntingSession) huntingSession {
	var killed []killedMonster
	_ = json.Unmarshal(row.KilledMonsters, &killed)
	var looted []lootedItem
	_ = json.Unmarshal(row.LootedItems, &looted)

	return huntingSession{
		ID:                   uuidString(row.ID),
		Name:                 row.Name,
		Loadout:              row.Loadout,
		SessionStart:         row.SessionStart.Time,
		SessionEnd:           row.SessionEnd.Time,
		SessionLengthSeconds: row.SessionLengthSeconds,
		Balance:              row.Balance,
		Damage:               row.Damage,
		DamagePerHour:        row.DamagePerHour,
		Healing:              row.Healing,
		HealingPerHour:       row.HealingPerHour,
		Loot:                 row.Loot,
		Supplies:             row.Supplies,
		XPGain:               row.XpGain,
		XPPerHour:            row.XpPerHour,
		RawXPGain:            row.RawXpGain,
		RawXPPerHour:         row.RawXpPerHour,
		KilledMonsters:       killed,
		LootedItems:          looted,
		CreatedAt:            row.CreatedAt.Time,
	}
}

func uuidString(id pgtype.UUID) string {
	value, err := id.Value()
	if err != nil {
		return ""
	}
	if s, ok := value.(string); ok {
		return s
	}
	return ""
}
