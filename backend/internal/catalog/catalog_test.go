package catalog

import (
	"os"
	"path"
	"path/filepath"
	"strings"
	"testing"
)

func TestCatalogMediaReferences(t *testing.T) {
	seen := map[int64]bool{}
	mediaDir := os.Getenv("TEST_MEDIA_DIR")
	for _, song := range Load() {
		if seen[song.ID] || song.ID < 1 || song.Duration < 1 {
			t.Fatalf("invalid song: %+v", song)
		}
		seen[song.ID] = true
		for _, media := range []struct{ url, prefix, dir string }{
			{song.Audio, "/media/music/", "music"},
			{song.Artwork, "/media/artwork/", "images/artwork"},
		} {
			name := strings.TrimPrefix(media.url, media.prefix)
			if name == media.url || name == "" || name == "." || path.Base(name) != name {
				t.Errorf("%s: invalid media path %q", song.Title, media.url)
				continue
			}
			if mediaDir != "" {
				if _, err := os.Stat(filepath.Join(mediaDir, media.dir, name)); err != nil {
					t.Errorf("%s: %v", song.Title, err)
				}
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
