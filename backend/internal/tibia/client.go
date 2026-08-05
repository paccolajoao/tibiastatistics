package tibia

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
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

var ErrCharacterNotFound = errors.New("character not found")

type CharacterGuild struct {
	Name string `json:"name"`
	Rank string `json:"rank"`
}

type CharacterResult struct {
	Name              string
	Sex               string
	Vocation          string
	World             string
	Residence         string
	AccountStatus     string
	Level             int
	AchievementPoints int
	Guild             *CharacterGuild
	LastLogin         *time.Time
	IsMain            bool
}

type characterGuildMembership struct {
	Name string `json:"name"`
	Rank string `json:"rank"`
}

type otherCharacterEntry struct {
	Name    string `json:"name"`
	World   string `json:"world"`
	Status  string `json:"status"`
	Deleted bool   `json:"deleted"`
	Main    bool   `json:"main"`
	Traded  bool   `json:"traded"`
}

type characterResponse struct {
	Character struct {
		Character struct {
			Name              string          `json:"name"`
			Sex               string          `json:"sex"`
			Vocation          string          `json:"vocation"`
			Level             int             `json:"level"`
			AchievementPoints int             `json:"achievement_points"`
			World             string          `json:"world"`
			Residence         string          `json:"residence"`
			Guild             json.RawMessage `json:"guild"`
			LastLogin         string          `json:"last_login"`
			AccountStatus     string          `json:"account_status"`
		} `json:"character"`
		OtherCharacters []otherCharacterEntry `json:"other_characters"`
	} `json:"character"`
}

func (c *Client) GetCharacter(ctx context.Context, name string) (*CharacterResult, error) {
	endpoint := fmt.Sprintf("%s/character/%s", baseURL, url.PathEscape(name))

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, ErrCharacterNotFound
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tibiadata api returned status %d", resp.StatusCode)
	}

	var parsed characterResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, err
	}

	char := parsed.Character.Character
	if strings.TrimSpace(char.Name) == "" {
		return nil, ErrCharacterNotFound
	}

	var guild *CharacterGuild
	var membership characterGuildMembership
	if err := json.Unmarshal(char.Guild, &membership); err == nil && membership.Name != "" {
		guild = &CharacterGuild{Name: membership.Name, Rank: membership.Rank}
	}

	var lastLogin *time.Time
	if char.LastLogin != "" {
		if parsedTime, err := time.Parse(time.RFC3339, char.LastLogin); err == nil {
			lastLogin = &parsedTime
		}
	}

	isMain := false
	for _, other := range parsed.Character.OtherCharacters {
		if strings.EqualFold(other.Name, char.Name) && strings.EqualFold(other.World, char.World) {
			isMain = other.Main
			break
		}
	}

	return &CharacterResult{
		Name:              char.Name,
		Sex:               char.Sex,
		Vocation:          char.Vocation,
		World:             char.World,
		Residence:         char.Residence,
		AccountStatus:     char.AccountStatus,
		Level:             char.Level,
		AchievementPoints: char.AchievementPoints,
		Guild:             guild,
		LastLogin:         lastLogin,
		IsMain:            isMain,
	}, nil
}
