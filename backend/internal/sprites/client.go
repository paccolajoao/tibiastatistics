package sprites

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const wikiAPIURL = "https://tibia.fandom.com/api.php"

// smallWords are kept lowercase in TibiaWiki file titles, following standard
// title-case conventions (e.g. "Lump of Earth.gif", not "Lump Of Earth.gif").
var smallWords = map[string]bool{
	"a": true, "an": true, "the": true,
	"of": true, "in": true, "on": true, "at": true, "to": true,
	"and": true, "or": true, "for": true,
}

// leadingArticles are stripped from item names as they exported by the game
// client (e.g. "a gold coin") but are absent from TibiaWiki file titles
// (e.g. "Gold Coin.gif").
var leadingArticles = map[string]bool{"a": true, "an": true}

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

// titleCase converts a lowercase game name into the title-case form TibiaWiki
// uses for its file names, dropping a leading article.
func titleCase(name string) string {
	words := strings.Fields(name)
	if len(words) > 1 && leadingArticles[strings.ToLower(words[0])] {
		words = words[1:]
	}

	for i, word := range words {
		lower := strings.ToLower(word)
		if i > 0 && i < len(words)-1 && smallWords[lower] {
			words[i] = lower
			continue
		}
		words[i] = strings.ToUpper(lower[:1]) + lower[1:]
	}

	return strings.Join(words, " ")
}

type imageInfoResponse struct {
	Query struct {
		Pages map[string]struct {
			Missing   *string `json:"missing"`
			ImageInfo []struct {
				URL string `json:"url"`
			} `json:"imageinfo"`
		} `json:"pages"`
	} `json:"query"`
}

func (c *Client) fetchFileURL(ctx context.Context, fileTitle string) (string, error) {
	params := url.Values{
		"action": {"query"},
		"titles": {"File:" + fileTitle + ".gif"},
		"prop":   {"imageinfo"},
		"iiprop": {"url"},
		"format": {"json"},
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

	var parsed imageInfoResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return "", err
	}

	for _, page := range parsed.Query.Pages {
		if page.Missing != nil || len(page.ImageInfo) == 0 {
			continue
		}
		return page.ImageInfo[0].URL, nil
	}

	return "", nil
}

// Resolve looks up the sprite image URL for a creature or item name as it
// appears in a Tibia hunting session export (e.g. "behemoth", "a gold coin").
// It returns an empty string, with no error, when no image could be found.
func (c *Client) Resolve(ctx context.Context, name string) (string, error) {
	fileTitle := titleCase(name)

	imageURL, err := c.fetchFileURL(ctx, fileTitle)
	if err != nil {
		return "", err
	}

	return imageURL, nil
}
