package tibia

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

const baseURL = "https://api.tibiadata.com/v4"

type Client struct {
	httpClient *http.Client
}

func NewClient() *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

type HighscoreEntry struct {
	Rank     int    `json:"rank"`
	Name     string `json:"name"`
	Vocation string `json:"vocation"`
	World    string `json:"world"`
	Level    int    `json:"level"`
	Value    int64  `json:"value"`
}

type HighscorePage struct {
	CurrentPage  int `json:"current_page"`
	TotalPages   int `json:"total_pages"`
	TotalRecords int `json:"total_records"`
}

type highscoresResponse struct {
	Highscores struct {
		World         string           `json:"world"`
		Category      string           `json:"category"`
		Vocation      string           `json:"vocation"`
		HighscoreAge  int              `json:"highscore_age"`
		HighscoreList []HighscoreEntry `json:"highscore_list"`
		HighscorePage HighscorePage    `json:"highscore_page"`
	} `json:"highscores"`
}

type HighscoresResult struct {
	World    string           `json:"world"`
	Category string           `json:"category"`
	Vocation string           `json:"vocation"`
	Entries  []HighscoreEntry `json:"entries"`
	Page     HighscorePage    `json:"page"`
}

type WorldEntry struct {
	Name          string `json:"name"`
	Status        string `json:"status"`
	PlayersOnline int    `json:"players_online"`
	Location      string `json:"location"`
	PvpType       string `json:"pvp_type"`
}

type worldsResponse struct {
	Worlds struct {
		RegularWorlds []WorldEntry `json:"regular_worlds"`
	} `json:"worlds"`
}

type WorldsResult struct {
	Worlds []WorldEntry
}

func (c *Client) GetWorlds(ctx context.Context) (*WorldsResult, error) {
	endpoint := fmt.Sprintf("%s/worlds", baseURL)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tibiadata api returned status %d", resp.StatusCode)
	}

	var parsed worldsResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, err
	}

	return &WorldsResult{Worlds: parsed.Worlds.RegularWorlds}, nil
}

func (c *Client) GetHighscores(ctx context.Context, world, category, vocation string, page int) (*HighscoresResult, error) {
	if world == "" {
		world = "all"
	}
	if category == "" {
		category = "experience"
	}
	if vocation == "" {
		vocation = "all"
	}
	if page < 1 {
		page = 1
	}

	endpoint := fmt.Sprintf("%s/highscores/%s/%s/%s/%d",
		baseURL,
		url.PathEscape(world),
		url.PathEscape(category),
		url.PathEscape(vocation),
		page,
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tibiadata api returned status %d", resp.StatusCode)
	}

	var parsed highscoresResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, err
	}

	return &HighscoresResult{
		World:    parsed.Highscores.World,
		Category: parsed.Highscores.Category,
		Vocation: parsed.Highscores.Vocation,
		Entries:  parsed.Highscores.HighscoreList,
		Page:     parsed.Highscores.HighscorePage,
	}, nil
}
