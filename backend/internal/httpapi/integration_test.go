package httpapi

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/cookiejar"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/go-sql-driver/mysql"
	"like-spotify/backend/internal/recommend"
	"like-spotify/backend/internal/store"
)

// This suite creates and drops its own database; it never clears an app database.
func TestMySQLIntegration(t *testing.T) {
	dsn := os.Getenv("TEST_MYSQL_DSN")
	if dsn == "" {
		t.Skip("set TEST_MYSQL_DSN to an admin DSN to run isolated MySQL integration tests")
	}
	cfg, err := mysql.ParseDSN(dsn)
	if err != nil {
		t.Fatal(err)
	}
	cfg.DBName = ""
	admin, err := store.Open(cfg.FormatDSN())
	if err != nil {
		t.Fatal(err)
	}
	defer admin.DB.Close()
	name := fmt.Sprintf("like_test_%d", time.Now().UnixNano())
	if _, err := admin.DB.Exec("CREATE DATABASE " + name); err != nil {
		t.Fatal(err)
	}
	defer admin.DB.Exec("DROP DATABASE " + name)
	cfg.DBName = name
	repo, err := store.Open(cfg.FormatDSN())
	if err != nil {
		t.Fatal(err)
	}
	defer repo.DB.Close()
	for range 2 {
		if err := repo.Migrate(context.Background()); err != nil {
			t.Fatal(err)
		}
	}
	server := httptest.NewServer(New(repo, Config{Origin: "http://localhost:8080"}, recommend.Local{}, slog.New(slog.NewTextHandler(io.Discard, nil))))
	defer server.Close()
	type listener struct {
		client *http.Client
		csrf   string
	}
	call := func(l listener, method, path string, body any, status int) []byte {
		t.Helper()
		var data []byte
		if body != nil {
			data, _ = json.Marshal(body)
		}
		r, _ := http.NewRequest(method, server.URL+path, bytes.NewReader(data))
		r.Header.Set("Content-Type", "application/json")
		r.Header.Set("X-CSRF-Token", l.csrf)
		response, err := l.client.Do(r)
		if err != nil {
			t.Fatal(err)
		}
		defer response.Body.Close()
		data, _ = io.ReadAll(response.Body)
		if response.StatusCode != status {
			t.Fatalf("%s %s: %d %s", method, path, response.StatusCode, data)
		}
		return data
	}
	register := func(username string) listener {
		jar, _ := cookiejar.New(nil)
		l := listener{client: &http.Client{Jar: jar}}
		data := call(l, "POST", "/api/v1/auth/register", map[string]string{"username": username, "name": "Listener", "password": "a secure test password"}, 201)
		var session struct {
			CSRF string `json:"csrfToken"`
		}
		if err := json.Unmarshal(data, &session); err != nil {
			t.Fatal(err)
		}
		l.csrf = session.CSRF
		return l
	}
	alice := register("alice")
	bob := register("bob")
	data := call(alice, "POST", "/api/v1/playlists", map[string]any{"name": "Focus", "songIds": []int{1, 3, 5}}, 201)
	var playlist store.Playlist
	if err := json.Unmarshal(data, &playlist); err != nil {
		t.Fatal(err)
	}
	path := fmt.Sprintf("/api/v1/playlists/%d", playlist.ID)
	call(bob, "PUT", path, map[string]any{"name": "Stolen", "songIds": []int{2}}, 404)
	call(bob, "DELETE", path, nil, 404)
	call(alice, "PUT", path, map[string]any{"name": "Reordered", "songIds": []int{5, 1}}, 200)
	data = call(alice, "GET", "/api/v1/playlists", nil, 200)
	var list struct {
		Playlists []store.Playlist `json:"playlists"`
	}
	_ = json.Unmarshal(data, &list)
	if len(list.Playlists) != 1 || len(list.Playlists[0].SongIDs) != 2 || list.Playlists[0].SongIDs[0] != 5 {
		t.Fatalf("order not preserved: %s", data)
	}
	call(alice, "PUT", "/api/v1/likes/1", nil, 204)
	call(alice, "PUT", "/api/v1/likes/1", nil, 204)
	data = call(bob, "GET", "/api/v1/likes", nil, 200)
	if string(bytes.TrimSpace(data)) != `{"songIds":[]}` {
		t.Fatalf("likes leaked: %s", data)
	}
	call(alice, "POST", "/api/v1/mixes/preview", map[string]string{"prompt": "focus for coding"}, 200)
	// Recreate the handler against the same DB: sessions must survive a process rollout.
	restarted := httptest.NewServer(New(repo, Config{Origin: "http://localhost:8080"}, recommend.Local{}, slog.New(slog.NewTextHandler(io.Discard, nil))))
	defer restarted.Close()
	request, _ := http.NewRequest("GET", restarted.URL+"/api/v1/auth/session", nil)
	response, err := alice.client.Do(request)
	if err != nil {
		t.Fatal(err)
	}
	restored, _ := io.ReadAll(response.Body)
	response.Body.Close()
	if !bytes.Contains(restored, []byte(`"username":"alice"`)) {
		t.Fatalf("session lost after restart: %s", restored)
	}
	call(alice, "DELETE", path, nil, 204)
	var remaining int
	if err := repo.DB.QueryRow("SELECT COUNT(*) FROM playlist_songs WHERE playlist_id=?", playlist.ID).Scan(&remaining); err != nil || remaining != 0 {
		t.Fatalf("orphan tracks: %d %v", remaining, err)
	}
	call(alice, "POST", "/api/v1/auth/logout", nil, 204)
	call(alice, "GET", "/api/v1/playlists", nil, 401)
	call(bob, "POST", "/api/v1/auth/login", map[string]string{"username": "' OR 1=1 --", "password": "wrong"}, 401)
}
