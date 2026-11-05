package catalog

import (
	"os"
	"strings"
	"testing"
)

func TestCatalogReferencesExistingMedia(t *testing.T) {
	seen := map[int64]bool{}
	for _, song := range Load() {
		if seen[song.ID] || song.ID < 1 || song.Duration < 1 {
			t.Fatalf("invalid song: %+v", song)
		}
		seen[song.ID] = true
		for _, path := range []string{song.Audio, song.Artwork} {
			file := strings.Replace(path, "/media/music/", "../../../assets/music/", 1)
			file = strings.Replace(file, "/media/artwork/", "../../../assets/images/artwork/", 1)
			if _, err := os.Stat(file); err != nil {
				t.Errorf("%s: %v", song.Title, err)
			}
		}
	}
}
func TestSearch(t *testing.T) {
	if len(Search(Load(), " FOCUS ")) == 0 {
		t.Fatal("mood search should work")
	}
	if got := Search(Load(), "' OR 1=1 --"); len(got) != 0 {
		t.Fatal("query should be treated as text")
	}
}
