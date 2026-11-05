package catalog

import (
	_ "embed"
	"encoding/json"
	"strings"
)

//go:embed songs.json
var data []byte

type Song struct {
	ID       int64    `json:"id"`
	Title    string   `json:"title"`
	Artist   string   `json:"artist"`
	Album    string   `json:"album"`
	AlbumID  int64    `json:"albumId"`
	Duration int      `json:"duration"`
	Artwork  string   `json:"artwork"`
	Audio    string   `json:"audio"`
	Tags     []string `json:"tags"`
}

func Load() []Song {
	var songs []Song
	if err := json.Unmarshal(data, &songs); err != nil {
		panic(err)
	}
	return songs
}

func Search(songs []Song, term string) []Song {
	term = strings.ToLower(strings.TrimSpace(term))
	result := []Song{}
	for _, song := range songs {
		if strings.Contains(strings.ToLower(song.Title+" "+song.Artist+" "+song.Album+" "+strings.Join(song.Tags, " ")), term) {
			result = append(result, song)
		}
	}
	return result
}
