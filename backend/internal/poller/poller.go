package poller

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/pacco/tibiastatistics/backend/internal/database"
	"github.com/pacco/tibiastatistics/backend/internal/tibia"
)

var targetLocations = map[string]bool{
	"South America": true,
	"North America": true,
}

var targetPvpTypes = map[string]bool{
	"Optional PvP": true,
	"Open PvP":     true,
}

type Poller struct {
	client    *tibia.Client
	queries   *database.Queries
	retention time.Duration
}

func New(client *tibia.Client, queries *database.Queries, retention time.Duration) *Poller {
	return &Poller{client: client, queries: queries, retention: retention}
}

func (p *Poller) Run(ctx context.Context, interval time.Duration) {
	p.collectOnce(ctx)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			p.collectOnce(ctx)
		}
	}
}

func (p *Poller) collectOnce(ctx context.Context) {
	result, err := p.client.GetWorlds(ctx)
	if err != nil {
		log.Printf("poller: failed to fetch worlds: %v", err)
		return
	}

	now := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}
	inserted := 0

	for _, world := range result.Worlds {
		if !targetLocations[world.Location] || !targetPvpTypes[world.PvpType] {
			continue
		}

		err := p.queries.InsertWorldPlayerSnapshot(ctx, database.InsertWorldPlayerSnapshotParams{
			WorldName:     world.Name,
			Location:      world.Location,
			PvpType:       world.PvpType,
			PlayersOnline: int32(world.PlayersOnline),
			CollectedAt:   now,
		})
		if err != nil {
			log.Printf("poller: failed to insert snapshot for %s: %v", world.Name, err)
			continue
		}
		inserted++
	}

	log.Printf("poller: collected %d world snapshots", inserted)

	cutoff := pgtype.Timestamptz{Time: time.Now().UTC().Add(-p.retention), Valid: true}
	if err := p.queries.DeleteSnapshotsOlderThan(ctx, cutoff); err != nil {
		log.Printf("poller: failed to clean up old snapshots: %v", err)
	}
}
