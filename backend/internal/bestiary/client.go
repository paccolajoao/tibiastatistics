// Package bestiary resolves a creature's Bestiary difficulty (and Bosstiary
// boss status) from TibiaWiki's infobox wikitext, since neither TibiaData
// nor TibiaWiki expose this as structured JSON.
package bestiary

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"regexp"
	"strings"
	"time"

	"github.com/pacco/tibiastatistics/backend/internal/wikititle"
)

const wikiAPIURL = "https://tibia.fandom.com/api.php"

// Info is a creature's Bestiary classification. Difficulty is one of
// "trivial", "easy", "medium", "hard", "challenging", or "" when the
// creature has no Bestiary entry (e.g. a boss, or an unresolved name).
type Info struct {
	Difficulty string
	IsBoss     bool
}

type Client struct {
	httpClient *http.Client
	userAgent  string
}

func NewClient() *Client {
	return &Client{
		httpClient: &http.Client{Timeout: 8 * time.Second},
		userAgent:  "tibiastatistics/1.0 (+https://github.com/pacco/tibiastatistics)",
	}
}

type parseResponse struct {
	Parse *struct {
		Wikitext struct {
			Content string `json:"*"`
		} `json:"wikitext"`
	} `json:"parse"`
	Error *struct {
		Code string `json:"code"`
	} `json:"error"`
}

func (c *Client) fetchWikitext(ctx context.Context, title string) (string, error) {
	params := url.Values{
		"action":  {"parse"},
		"page":    {title},
		"prop":    {"wikitext"},
		"section": {"0"},
		"format":  {"json"},
	}
	endpoint := wikiAPIURL + "?" + params.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", c.userAgent)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("tibiawiki api returned status %d", resp.StatusCode)
	}

	var parsed parseResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return "", err
	}

	if parsed.Error != nil || parsed.Parse == nil {
		return "", nil
	}

	return parsed.Parse.Wikitext.Content, nil
}

var (
	bossPattern       = regexp.MustCompile(`(?mi)^\s*\|?\s*isboss\s*=\s*(\S+)`)
	difficultyPattern = regexp.MustCompile(`(?mi)^\s*\|?\s*bestiarylevel\s*=\s*(\S+)`)
)

func parseInfo(wikitext string) Info {
	if m := bossPattern.FindStringSubmatch(wikitext); m != nil && strings.EqualFold(m[1], "yes") {
		return Info{IsBoss: true}
	}
	if m := difficultyPattern.FindStringSubmatch(wikitext); m != nil {
		return Info{Difficulty: strings.ToLower(strings.TrimSpace(m[1]))}
	}
	return Info{}
}

// Resolve looks up Bestiary difficulty / boss status for a creature name as
// it appears in a Tibia hunting session export (e.g. "dragon lord"). It
// returns a zero-value Info, with no error, when the wiki page has no
// Bestiary data (e.g. non-creature page, or template fields absent).
func (c *Client) Resolve(ctx context.Context, name string) (Info, error) {
	title := wikititle.Case(name)

	wikitext, err := c.fetchWikitext(ctx, title)
	if err != nil {
		return Info{}, err
	}

	return parseInfo(wikitext), nil
}
