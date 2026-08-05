package poller

import (
	"context"
	"log"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"github.com/pacco/tibiastatistics/backend/internal/database"
	"github.com/pacco/tibiastatistics/backend/internal/tibia"
)

type CharacterPoller struct {
	client    *tibia.Client
	queries   *database.Queries
	retention time.Duration
}

func NewCharacterPoller(client *tibia.Client, queries *database.Queries, retention time.Duration) *CharacterPoller {
	return &CharacterPoller{client: client, queries: queries, retention: retention}
}

func (p *CharacterPoller) Run(ctx context.Context, interval time.Duration) {
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

// collectOnce re-fetches each registered character from TibiaData sequentially.
// TODO: bound concurrency if the number of registered characters grows large.
func (p *CharacterPoller) collectOnce(ctx context.Context) {
	characters, err := p.queries.ListAllActiveCharacters(ctx)
	if err != nil {
		log.Printf("character poller: failed to list characters: %v", err)
		return
	}

	now := pgtype.Timestamptz{Time: time.Now().UTC(), Valid: true}
	updated := 0

	for _, c := range characters {
		result, err := p.client.GetCharacter(ctx, c.Name)
		if err != nil {
			log.Printf("character poller: failed to fetch %s: %v", c.Name, err)
			continue
		}

		var guildName, guildRank string
		if result.Guild != nil {
			guildName, guildRank = result.Guild.Name, result.Guild.Rank
		}
		var lastLogin pgtype.Timestamptz
		if result.LastLogin != nil {
			lastLogin = pgtype.Timestamptz{Time: *result.LastLogin, Valid: true}
		}

		if _, err := p.queries.UpdateCharacterSnapshot(ctx, database.UpdateCharacterSnapshotParams{
			ID:                c.ID,
			World:             result.World,
			Vocation:          result.Vocation,
			Level:             int32(result.Level),
			Sex:               result.Sex,
			Residence:         result.Residence,
			GuildName:         guildName,
			GuildRank:         guildRank,
			AchievementPoints: int32(result.AchievementPoints),
			AccountStatus:     result.AccountStatus,
			LastLogin:         lastLogin,
			IsMain:            result.IsMain,
			LastSyncedAt:      now,
		}); err != nil {
			log.Printf("character poller: failed to update %s: %v", c.Name, err)
			continue
		}

		if err := p.queries.InsertCharacterSnapshot(ctx, database.InsertCharacterSnapshotParams{
			CharacterID:       c.ID,
			Level:             int32(result.Level),
			Vocation:          result.Vocation,
			World:             result.World,
			AchievementPoints: int32(result.AchievementPoints),
			CapturedAt:        now,
		}); err != nil {
			log.Printf("character poller: failed to insert snapshot for %s: %v", c.Name, err)
			continue
		}

		updated++
	}

	log.Printf("character poller: refreshed %d characters", updated)

	cutoff := pgtype.Timestamptz{Time: time.Now().UTC().Add(-p.retention), Valid: true}
	if err := p.queries.DeleteCharacterSnapshotsOlderThan(ctx, cutoff); err != nil {
		log.Printf("character poller: failed to clean up old snapshots: %v", err)
	}
}
