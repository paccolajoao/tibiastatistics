// Package wikititle converts lowercase in-game names into the title-case
// form TibiaWiki uses for page and file titles, shared by any client that
// talks to tibia.fandom.com (sprites, bestiary, ...).
package wikititle

import "strings"

// smallWords are kept lowercase in TibiaWiki titles, following standard
// title-case conventions (e.g. "Lump of Earth", not "Lump Of Earth").
var smallWords = map[string]bool{
	"a": true, "an": true, "the": true,
	"of": true, "in": true, "on": true, "at": true, "to": true,
	"and": true, "or": true, "for": true,
}

// leadingArticles are stripped from names as they are exported by the game
// client (e.g. "a gold coin") but are absent from TibiaWiki titles
// (e.g. "Gold Coin").
var leadingArticles = map[string]bool{"a": true, "an": true}

// Case converts a lowercase game name into the title-case form TibiaWiki
// uses for its page/file titles, dropping a leading article.
func Case(name string) string {
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
