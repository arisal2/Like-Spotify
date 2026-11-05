package httpapi

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"like-spotify/backend/internal/recommend"
	"like-spotify/backend/internal/store"
)

type stubRepository struct{ store.Repository }

func (stubRepository) Ping(context.Context) error { return nil }
func (stubRepository) Session(context.Context, string) (store.Session, error) {
	return store.Session{User: store.User{ID: 1}, CSRF: "correct-csrf", Expires: time.Now().Add(time.Hour)}, nil
}
func testHandler() http.Handler {
	return New(stubRepository{}, Config{Origin: "http://localhost:8080"}, recommend.Local{}, slog.New(slog.NewTextHandler(io.Discard, nil)))
}
func TestAuthenticationBoundaries(t *testing.T) {
	h := testHandler()
	for _, tc := range []struct {
		name, method, path, body, cookie, csrf, origin string
		status                                         int
	}{
		{name: "anonymous library", method: "GET", path: "/api/v1/playlists", status: 401},
		{name: "missing csrf", method: "POST", path: "/api/v1/playlists", cookie: strings.Repeat("a", 64), status: 403},
		{name: "wrong csrf", method: "DELETE", path: "/api/v1/playlists/1", cookie: strings.Repeat("a", 64), csrf: "wrong", status: 403},
		{name: "cross origin login", method: "POST", path: "/api/v1/auth/login", origin: "https://other.example", status: 403},
		{name: "unknown catalog ID", method: "POST", path: "/api/v1/playlists", cookie: strings.Repeat("a", 64), csrf: "correct-csrf", body: `{"name":"Mix","songIds":[999]}`, status: 422},
		{name: "unknown fields", method: "POST", path: "/api/v1/playlists", cookie: strings.Repeat("a", 64), csrf: "correct-csrf", body: `{"name":"Mix","songIds":[],"userId":99}`, status: 400},
		{name: "multiple bodies", method: "POST", path: "/api/v1/playlists", cookie: strings.Repeat("a", 64), csrf: "correct-csrf", body: `{"name":"Mix","songIds":[]} {}`, status: 400},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r := httptest.NewRequest(tc.method, tc.path, strings.NewReader(tc.body))
			r.Header.Set("Content-Type", "application/json")
			r.Header.Set("X-CSRF-Token", tc.csrf)
			r.Header.Set("Origin", tc.origin)
			if tc.cookie != "" {
				r.AddCookie(&http.Cookie{Name: "ls_session", Value: tc.cookie})
			}
			w := httptest.NewRecorder()
			h.ServeHTTP(w, r)
			if w.Code != tc.status {
				t.Fatalf("got %d: %s", w.Code, w.Body.String())
			}
		})
	}
}
func TestLimiter(t *testing.T) {
	var l limiter
	if !l.allow("one", 1, time.Minute) || l.allow("one", 1, time.Minute) {
		t.Fatal("limit not enforced")
	}
	if !l.allow("two", 1, time.Minute) {
		t.Fatal("unrelated identity blocked")
	}
}

func TestSecurityHeaders(t *testing.T) {
	w := httptest.NewRecorder()
	testHandler().ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/api/v1/catalog", nil))
	for _, header := range []string{"Content-Security-Policy", "Cross-Origin-Opener-Policy", "Cross-Origin-Resource-Policy", "Permissions-Policy", "Referrer-Policy", "X-Content-Type-Options", "X-Frame-Options"} {
		if w.Header().Get(header) == "" {
			t.Errorf("missing %s", header)
		}
	}
	if got := w.Header().Get("Strict-Transport-Security"); got != "" {
		t.Errorf("HSTS must not be sent over development HTTP: %q", got)
	}
}
