package handlers

import (
	"encoding/json"
	"fmt"
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
	CharacterID          *string         `json:"character_id"`
	HuntTypeID           *string         `json:"hunt_type_id"`
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

var (
	sessionDataLinePattern = regexp.MustCompile(`^Session data: From (.+) to (.+)$`)
	killedOrLootedLine     = regexp.MustCompile(`^(\d+)x\s+(.+)$`)
)

// parseClipboardSession parses the plain-text format produced by the Tibia
// client's "copy to clipboard" session button into the same normalized
// shape as the JSON export (huntingSessionPayload).
func parseClipboardSession(raw string) (huntingSessionPayload, error) {
	var payload huntingSessionPayload
	fieldsByKey := map[string]*string{
		"Raw XP Gain": &payload.RawXPGain,
		"XP Gain":     &payload.XPGain,
		"Raw XP/h":    &payload.RawXPPerHour,
		"XP/h":        &payload.XPPerHour,
		"Loot":        &payload.Loot,
		"Supplies":    &payload.Supplies,
		"Balance":     &payload.Balance,
		"Damage":      &payload.Damage,
		"Damage/h":    &payload.DamagePerHour,
		"Healing":     &payload.Healing,
		"Healing/h":   &payload.HealingPerHour,
	}

	const (
		sectionNone = iota
		sectionKilledMonsters
		sectionLootedItems
	)
	section := sectionNone

	lines := strings.Split(raw, "\n")
	for i, line := range lines {
		line = strings.TrimRight(line, "\r")
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}

		switch trimmed {
		case "Killed Monsters:":
			section = sectionKilledMonsters
			continue
		case "Looted Items:":
			section = sectionLootedItems
			continue
		}

		if section != sectionNone {
			if match := killedOrLootedLine.FindStringSubmatch(trimmed); match != nil {
				count, err := strconv.Atoi(match[1])
				if err != nil {
					return payload, fmt.Errorf("invalid clipboard session: line %d: %w", i+1, err)
				}
				name := match[2]
				if section == sectionKilledMonsters {
					payload.KilledMonsters = append(payload.KilledMonsters, killedMonster{Count: count, Name: name})
				} else {
					payload.LootedItems = append(payload.LootedItems, lootedItem{Count: count, Name: name})
				}
				continue
			}
			// A non-matching line ends the section (defensive: shouldn't
			// normally happen since these sections are always last).
			section = sectionNone
		}

		if match := sessionDataLinePattern.FindStringSubmatch(trimmed); match != nil {
			payload.SessionStart = match[1]
			payload.SessionEnd = match[2]
			continue
		}

		if strings.HasPrefix(trimmed, "Session: ") {
			payload.SessionLength = strings.TrimPrefix(trimmed, "Session: ")
			continue
		}

		key, value, ok := strings.Cut(trimmed, ": ")
		if !ok {
			return payload, fmt.Errorf("invalid clipboard session: unrecognized line %d: %q", i+1, line)
		}
		if field, known := fieldsByKey[key]; known {
			*field = value
			continue
		}
		return payload, fmt.Errorf("invalid clipboard session: unknown field %q on line %d", key, i+1)
	}

	if payload.SessionStart == "" || payload.SessionEnd == "" {
		return payload, fmt.Errorf("invalid clipboard session: missing session data line")
	}
	if payload.SessionLength == "" {
		return payload, fmt.Errorf("invalid clipboard session: missing session length line")
	}

	return payload, nil
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

	var payload huntingSessionPayload
	if file, _, err := r.FormFile("file"); err == nil {
		defer file.Close()
		if err := json.NewDecoder(file).Decode(&payload); err != nil {
			http.Error(w, "invalid session json: "+err.Error(), http.StatusBadRequest)
			return
		}
	} else if text := strings.TrimSpace(r.FormValue("text")); text != "" {
		payload, err = parseClipboardSession(text)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	} else {
		http.Error(w, "missing file or text", http.StatusBadRequest)
		return
	}

	name := strings.TrimSpace(r.FormValue("name"))
	if name == "" {
		http.Error(w, "name is required", http.StatusBadRequest)
		return
	}
	loadout := strings.TrimSpace(r.FormValue("loadout"))

	characterIDRaw := strings.TrimSpace(r.FormValue("character_id"))
	if characterIDRaw == "" {
		http.Error(w, "character_id is required", http.StatusBadRequest)
		return
	}
	var characterID pgtype.UUID
	if err := characterID.Scan(characterIDRaw); err != nil {
		http.Error(w, "invalid character_id", http.StatusBadRequest)
		return
	}
	if _, err := h.queries.GetCharacterByID(r.Context(), database.GetCharacterByIDParams{
		ID:     characterID,
		UserID: userID,
	}); err != nil {
		http.Error(w, "character not found", http.StatusBadRequest)
		return
	}

	var huntTypeID pgtype.UUID
	huntTypeIDRaw := strings.TrimSpace(r.FormValue("hunt_type_id"))
	if huntTypeIDRaw != "" {
		if err := huntTypeID.Scan(huntTypeIDRaw); err != nil {
			http.Error(w, "invalid hunt_type_id", http.StatusBadRequest)
			return
		}
		if _, err := h.queries.GetHuntTypeByID(r.Context(), database.GetHuntTypeByIDParams{
			ID:     huntTypeID,
			UserID: userID,
		}); err != nil {
			http.Error(w, "hunt type not found", http.StatusBadRequest)
			return
		}
	}

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
		CharacterID:          characterID,
		HuntTypeID:           huntTypeID,
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

type assignCharacterPayload struct {
	CharacterID string `json:"character_id"`
}

func (h *HuntingHandler) AssignCharacter(w http.ResponseWriter, r *http.Request) {
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

	var payload assignCharacterPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	var characterID pgtype.UUID
	if err := characterID.Scan(strings.TrimSpace(payload.CharacterID)); err != nil {
		http.Error(w, "invalid character_id", http.StatusBadRequest)
		return
	}
	if _, err := h.queries.GetCharacterByID(r.Context(), database.GetCharacterByIDParams{
		ID:     characterID,
		UserID: userID,
	}); err != nil {
		http.Error(w, "character not found", http.StatusBadRequest)
		return
	}

	row, err := h.queries.UpdateHuntingSessionCharacter(r.Context(), database.UpdateHuntingSessionCharacterParams{
		ID:          id,
		UserID:      userID,
		CharacterID: characterID,
	})
	if err != nil {
		http.Error(w, "failed to update hunting session", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, toHuntingSession(row))
}

type assignHuntTypePayload struct {
	HuntTypeID string `json:"hunt_type_id"`
}

func (h *HuntingHandler) AssignHuntType(w http.ResponseWriter, r *http.Request) {
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

	var payload assignHuntTypePayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	var huntTypeID pgtype.UUID
	if err := huntTypeID.Scan(strings.TrimSpace(payload.HuntTypeID)); err != nil {
		http.Error(w, "invalid hunt_type_id", http.StatusBadRequest)
		return
	}
	if _, err := h.queries.GetHuntTypeByID(r.Context(), database.GetHuntTypeByIDParams{
		ID:     huntTypeID,
		UserID: userID,
	}); err != nil {
		http.Error(w, "hunt type not found", http.StatusBadRequest)
		return
	}

	row, err := h.queries.UpdateHuntingSessionHuntType(r.Context(), database.UpdateHuntingSessionHuntTypeParams{
		ID:         id,
		UserID:     userID,
		HuntTypeID: huntTypeID,
	})
	if err != nil {
		http.Error(w, "failed to update hunting session", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, toHuntingSession(row))
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

	var characterID *string
	if row.CharacterID.Valid {
		s := uuidString(row.CharacterID)
		characterID = &s
	}

	var huntTypeID *string
	if row.HuntTypeID.Valid {
		s := uuidString(row.HuntTypeID)
		huntTypeID = &s
	}

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
		CharacterID:          characterID,
		HuntTypeID:           huntTypeID,
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
