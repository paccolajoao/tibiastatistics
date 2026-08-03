package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/pacco/tibiastatistics/backend/internal/database"
)

type WorldsHandler struct {
	queries *database.Queries
}

func NewWorldsHandler(queries *database.Queries) *WorldsHandler {
	return &WorldsHandler{queries: queries}
}

type worldAverage struct {
	WorldName        string  `json:"world_name"`
	Location         string  `json:"location"`
	PvpType          string  `json:"pvp_type"`
	AvgPlayersOnline float64 `json:"avg_players_online"`
	MaxPlayersOnline int32   `json:"max_players_online"`
	MinPlayersOnline int32   `json:"min_players_online"`
	SampleCount      int64   `json:"sample_count"`
}

type worldTimeSeriesPoint struct {
	WorldName     string    `json:"world_name"`
	PlayersOnline int32     `json:"players_online"`
	CollectedAt   time.Time `json:"collected_at"`
}

type worldHourlyPoint struct {
	WorldName        string  `json:"world_name"`
	HourOfDay        int32   `json:"hour_of_day"`
	AvgPlayersOnline float64 `json:"avg_players_online"`
	SampleCount      int64   `json:"sample_count"`
}

func periodToSince(query string) time.Time {
	days := 7
	if parsed, err := strconv.Atoi(query); err == nil && (parsed == 7 || parsed == 14 || parsed == 30) {
		days = parsed
	}
	return time.Now().UTC().AddDate(0, 0, -days)
}

func (h *WorldsHandler) Averages(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	since := periodToSince(query.Get("period"))

	rows, err := h.queries.GetWorldAverages(r.Context(), database.GetWorldAveragesParams{
		CollectedAt: pgtype.Timestamptz{Time: since, Valid: true},
		Location:    query.Get("location"),
		PvpType:     query.Get("pvp_type"),
	})
	if err != nil {
		http.Error(w, "failed to fetch world averages", http.StatusInternalServerError)
		return
	}

	averages := make([]worldAverage, 0, len(rows))
	for _, row := range rows {
		averages = append(averages, worldAverage{
			WorldName:        row.WorldName,
			Location:         row.Location,
			PvpType:          row.PvpType,
			AvgPlayersOnline: row.AvgPlayersOnline,
			MaxPlayersOnline: row.MaxPlayersOnline,
			MinPlayersOnline: row.MinPlayersOnline,
			SampleCount:      row.SampleCount,
		})
	}

	writeJSON(w, http.StatusOK, averages)
}

func (h *WorldsHandler) TimeSeries(w http.ResponseWriter, r *http.Request) {
	since := periodToSince(r.URL.Query().Get("period"))
	world := r.URL.Query().Get("world")

	rows, err := h.queries.GetWorldTimeSeries(r.Context(), database.GetWorldTimeSeriesParams{
		CollectedAt: pgtype.Timestamptz{Time: since, Valid: true},
		WorldName:   world,
	})
	if err != nil {
		http.Error(w, "failed to fetch world time series", http.StatusInternalServerError)
		return
	}

	points := make([]worldTimeSeriesPoint, 0, len(rows))
	for _, row := range rows {
		points = append(points, worldTimeSeriesPoint{
			WorldName:     row.WorldName,
			PlayersOnline: row.PlayersOnline,
			CollectedAt:   row.CollectedAt.Time,
		})
	}

	writeJSON(w, http.StatusOK, points)
}

func (h *WorldsHandler) HourlyAverages(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	since := periodToSince(query.Get("period"))

	rows, err := h.queries.GetWorldHourlyAverages(r.Context(), database.GetWorldHourlyAveragesParams{
		CollectedAt: pgtype.Timestamptz{Time: since, Valid: true},
		WorldName:   query.Get("world"),
		Location:    query.Get("location"),
		PvpType:     query.Get("pvp_type"),
	})
	if err != nil {
		http.Error(w, "failed to fetch world hourly averages", http.StatusInternalServerError)
		return
	}

	points := make([]worldHourlyPoint, 0, len(rows))
	for _, row := range rows {
		points = append(points, worldHourlyPoint{
			WorldName:        row.WorldName,
			HourOfDay:        row.HourOfDay,
			AvgPlayersOnline: row.AvgPlayersOnline,
			SampleCount:      row.SampleCount,
		})
	}

	writeJSON(w, http.StatusOK, points)
}
