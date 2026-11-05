package httpapi

import (
	"context"
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"
	"unicode/utf8"

	"golang.org/x/crypto/bcrypt"
	"like-spotify/backend/internal/catalog"
	"like-spotify/backend/internal/recommend"
	"like-spotify/backend/internal/store"
)

type Config struct {
	Origin        string
	SecureCookies bool
	MediaDir      string
}
type Server struct {
	repo      store.Repository
	config    Config
	songs     []catalog.Song
	generator recommend.Generator
	logger    *slog.Logger
	limits    limiter
	dummyHash []byte
}
type contextKey struct{}

func New(repo store.Repository, cfg Config, generator recommend.Generator, logger *slog.Logger) http.Handler {
	hash, _ := bcrypt.GenerateFromPassword([]byte("dummy-password-for-timing"), bcrypt.DefaultCost)
	s := &Server{repo: repo, config: cfg, songs: catalog.Load(), generator: generator, logger: logger, dummyHash: hash}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", func(w http.ResponseWriter, r *http.Request) { write(w, 200, map[string]string{"status": "ok"}) })
	mux.HandleFunc("GET /health/ready", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := repo.Ping(ctx); err != nil {
			fail(w, 503, "not_ready", "Database unavailable")
			return
		}
		write(w, 200, map[string]string{"status": "ready"})
	})
	mux.HandleFunc("GET /api/v1/catalog", func(w http.ResponseWriter, r *http.Request) {
		write(w, 200, map[string]any{"songs": catalog.Search(s.songs, r.URL.Query().Get("q"))})
	})
	mux.HandleFunc("GET /api/v1/auth/session", s.session)
	mux.HandleFunc("POST /api/v1/auth/register", s.register)
	mux.HandleFunc("POST /api/v1/auth/login", s.login)
	mux.Handle("POST /api/v1/auth/logout", s.require(http.HandlerFunc(s.logout)))
	mux.Handle("GET /api/v1/playlists", s.require(http.HandlerFunc(s.playlists)))
	mux.Handle("POST /api/v1/playlists", s.require(http.HandlerFunc(s.savePlaylist)))
	mux.Handle("PUT /api/v1/playlists/{id}", s.require(http.HandlerFunc(s.savePlaylist)))
	mux.Handle("DELETE /api/v1/playlists/{id}", s.require(http.HandlerFunc(s.deletePlaylist)))
	mux.Handle("GET /api/v1/likes", s.require(http.HandlerFunc(s.likes)))
	mux.Handle("PUT /api/v1/likes/{id}", s.require(http.HandlerFunc(s.like)))
	mux.Handle("DELETE /api/v1/likes/{id}", s.require(http.HandlerFunc(s.like)))
	mux.Handle("POST /api/v1/mixes/preview", s.require(http.HandlerFunc(s.preview)))
	// Expose only music and artwork; the legacy PHP tree is never served.
	if cfg.MediaDir != "" {
		for _, entry := range []struct{ prefix, dir string }{{"music/", "music"}, {"artwork/", "images/artwork"}} {
			files := http.StripPrefix("/media/"+entry.prefix, http.FileServer(http.Dir(cfg.MediaDir+"/"+entry.dir)))
			mux.Handle("GET /media/"+entry.prefix, http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				if strings.HasSuffix(r.URL.Path, "/") {
					http.NotFound(w, r)
					return
				}
				w.Header().Set("Cache-Control", "public, max-age=86400")
				files.ServeHTTP(w, r)
			}))
		}
	}
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) { fail(w, 404, "not_found", "Route not found") })
	return s.middleware(mux)
}
func write(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}
func fail(w http.ResponseWriter, status int, code, message string) {
	write(w, status, map[string]any{"error": map[string]string{"code": code, "message": message}})
}
func decode(w http.ResponseWriter, r *http.Request, target any) bool {
	if strings.Split(r.Header.Get("Content-Type"), ";")[0] != "application/json" {
		fail(w, 415, "content_type", "Use application/json")
		return false
	}
	r.Body = http.MaxBytesReader(w, r.Body, 16<<10)
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	if err := d.Decode(target); err != nil {
		fail(w, 400, "invalid_json", "Invalid request body")
		return false
	}
	if d.Decode(&struct{}{}) != io.EOF {
		fail(w, 400, "invalid_json", "Expected one JSON object")
		return false
	}
	return true
}
func (s *Server) internal(w http.ResponseWriter, err error) {
	s.logger.Error("request failed", "error", err)
	fail(w, 500, "internal", "Something went wrong. Please try again.")
}
func (s *Server) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		id := randomToken()
		w.Header().Set("X-Request-ID", id)
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "no-referrer")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
		w.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()")
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Resource-Policy", "same-origin")
		if s.config.SecureCookies {
			w.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}
		w.Header().Set("Cache-Control", "no-store")
		defer func() {
			if recovered := recover(); recovered != nil {
				s.logger.Error("panic", "request_id", id, "error", recovered)
				fail(w, 500, "internal", "Something went wrong")
			}
			s.logger.Info("request", "request_id", id, "method", r.Method, "path", r.URL.Path, "duration_ms", time.Since(start).Milliseconds())
		}()
		if r.Method != "GET" && r.Method != "HEAD" && r.Method != "OPTIONS" {
			if origin := r.Header.Get("Origin"); origin != "" && origin != s.config.Origin {
				fail(w, 403, "origin", "Origin not allowed")
				return
			}
		}
		ctx, cancel := context.WithTimeout(r.Context(), 25*time.Second)
		defer cancel()
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
func randomToken() string {
	var b [32]byte
	if _, err := rand.Read(b[:]); err != nil {
		panic(err)
	}
	return hex.EncodeToString(b[:])
}
func (s *Server) getSession(r *http.Request) (store.Session, error) {
	c, err := r.Cookie("ls_session")
	if err != nil {
		return store.Session{}, store.ErrNotFound
	}
	if len(c.Value) != 64 {
		return store.Session{}, store.ErrNotFound
	}
	return s.repo.Session(r.Context(), c.Value)
}
func (s *Server) require(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		v, err := s.getSession(r)
		if errors.Is(err, store.ErrNotFound) {
			fail(w, 401, "unauthorized", "Please sign in")
			return
		}
		if err != nil {
			s.internal(w, err)
			return
		}
		if r.Method != "GET" && r.Method != "HEAD" {
			if subtle.ConstantTimeCompare([]byte(r.Header.Get("X-CSRF-Token")), []byte(v.CSRF)) != 1 {
				fail(w, 403, "csrf", "Session verification failed. Refresh and try again.")
				return
			}
		}
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), contextKey{}, v)))
	})
}
func current(r *http.Request) store.Session { return r.Context().Value(contextKey{}).(store.Session) }
func (s *Server) session(w http.ResponseWriter, r *http.Request) {
	v, err := s.getSession(r)
	if errors.Is(err, store.ErrNotFound) {
		write(w, 200, map[string]any{"user": nil, "csrfToken": ""})
		return
	}
	if err != nil {
		s.internal(w, err)
		return
	}
	write(w, 200, map[string]any{"user": v.User, "csrfToken": v.CSRF})
}

var usernamePattern = regexp.MustCompile(`^[a-z0-9_]{3,32}$`)

func (s *Server) authLimit(w http.ResponseWriter, r *http.Request) bool {
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)
	if !s.limits.allow("auth:"+ip, 10, time.Minute) {
		w.Header().Set("Retry-After", "60")
		fail(w, 429, "rate_limit", "Too many attempts. Try again in a minute.")
		return false
	}
	return true
}
func (s *Server) register(w http.ResponseWriter, r *http.Request) {
	if !s.authLimit(w, r) {
		return
	}
	var body struct {
		Username string `json:"username"`
		Name     string `json:"name"`
		Password string `json:"password"`
	}
	if !decode(w, r, &body) {
		return
	}
	body.Username = strings.ToLower(strings.TrimSpace(body.Username))
	body.Name = strings.TrimSpace(body.Name)
	if !usernamePattern.MatchString(body.Username) || utf8.RuneCountInString(body.Name) < 1 || utf8.RuneCountInString(body.Name) > 80 || len(body.Password) < 12 || len(body.Password) > 72 {
		fail(w, 422, "validation", "Use a 3–32 character username (letters, numbers, underscores), a name, and a 12–72 byte password.")
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		s.internal(w, err)
		return
	}
	u, err := s.repo.CreateUser(r.Context(), body.Username, body.Name, string(hash))
	if errors.Is(err, store.ErrConflict) {
		fail(w, 409, "conflict", "That username is already taken")
		return
	}
	if err != nil {
		s.internal(w, err)
		return
	}
	s.startSession(w, r, u, 201)
}
func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	if !s.authLimit(w, r) {
		return
	}
	var body struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if !decode(w, r, &body) {
		return
	}
	if len(body.Username) > 32 || len(body.Password) > 72 {
		fail(w, 401, "credentials", "Username or password is incorrect")
		return
	}
	u, hash, err := s.repo.FindUser(r.Context(), strings.ToLower(strings.TrimSpace(body.Username)))
	if err != nil && !errors.Is(err, store.ErrNotFound) {
		s.internal(w, err)
		return
	}
	if errors.Is(err, store.ErrNotFound) {
		hash = string(s.dummyHash)
	}
	passwordErr := bcrypt.CompareHashAndPassword([]byte(hash), []byte(body.Password))
	if err != nil || passwordErr != nil {
		fail(w, 401, "credentials", "Username or password is incorrect")
		return
	}
	s.startSession(w, r, u, 200)
}
func (s *Server) startSession(w http.ResponseWriter, r *http.Request, u store.User, status int) {
	if c, err := r.Cookie("ls_session"); err == nil {
		if err := s.repo.DeleteSession(r.Context(), c.Value); err != nil {
			s.internal(w, err)
			return
		}
	}
	token, csrf := randomToken(), randomToken()
	expires := time.Now().UTC().Add(7 * 24 * time.Hour)
	if err := s.repo.CreateSession(r.Context(), token, u.ID, csrf, expires); err != nil {
		s.internal(w, err)
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "ls_session", Value: token, Path: "/", HttpOnly: true, Secure: s.config.SecureCookies, SameSite: http.SameSiteStrictMode, MaxAge: 604800, Expires: expires})
	write(w, status, map[string]any{"user": u, "csrfToken": csrf})
}
func (s *Server) logout(w http.ResponseWriter, r *http.Request) {
	c, _ := r.Cookie("ls_session")
	if err := s.repo.DeleteSession(r.Context(), c.Value); err != nil {
		s.internal(w, err)
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "ls_session", Path: "/", HttpOnly: true, Secure: s.config.SecureCookies, SameSite: http.SameSiteStrictMode, MaxAge: -1})
	w.WriteHeader(204)
}
func (s *Server) playlists(w http.ResponseWriter, r *http.Request) {
	items, err := s.repo.Playlists(r.Context(), current(r).User.ID)
	if err != nil {
		s.internal(w, err)
		return
	}
	write(w, 200, map[string]any{"playlists": items})
}
func (s *Server) validIDs(ids []int64) bool {
	if len(ids) > 100 {
		return false
	}
	valid := map[int64]bool{}
	for _, song := range s.songs {
		valid[song.ID] = true
	}
	seen := map[int64]bool{}
	for _, id := range ids {
		if !valid[id] || seen[id] {
			return false
		}
		seen[id] = true
	}
	return true
}
func pathID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id < 1 {
		fail(w, 400, "invalid_id", "Invalid ID")
		return 0, false
	}
	return id, true
}
func (s *Server) savePlaylist(w http.ResponseWriter, r *http.Request) {
	var body struct {
		Name    string  `json:"name"`
		SongIDs []int64 `json:"songIds"`
	}
	if !decode(w, r, &body) {
		return
	}
	body.Name = strings.TrimSpace(body.Name)
	if body.SongIDs == nil {
		body.SongIDs = []int64{}
	}
	if len(body.Name) == 0 || utf8.RuneCountInString(body.Name) > 80 || !s.validIDs(body.SongIDs) {
		fail(w, 422, "validation", "Provide a name (up to 80 characters) and up to 100 unique catalog songs")
		return
	}
	id := int64(0)
	status := 201
	if r.Method == "PUT" {
		var ok bool
		id, ok = pathID(w, r)
		if !ok {
			return
		}
		status = 200
	}
	v, err := s.repo.SavePlaylist(r.Context(), current(r).User.ID, id, body.Name, body.SongIDs)
	if errors.Is(err, store.ErrNotFound) {
		fail(w, 404, "not_found", "Playlist not found")
		return
	}
	if err != nil {
		s.internal(w, err)
		return
	}
	write(w, status, v)
}
func (s *Server) deletePlaylist(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	err := s.repo.DeletePlaylist(r.Context(), current(r).User.ID, id)
	if errors.Is(err, store.ErrNotFound) {
		fail(w, 404, "not_found", "Playlist not found")
		return
	}
	if err != nil {
		s.internal(w, err)
		return
	}
	w.WriteHeader(204)
}
func (s *Server) likes(w http.ResponseWriter, r *http.Request) {
	ids, err := s.repo.Likes(r.Context(), current(r).User.ID)
	if err != nil {
		s.internal(w, err)
		return
	}
	write(w, 200, map[string]any{"songIds": ids})
}
func (s *Server) like(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if !s.validIDs([]int64{id}) {
		fail(w, 404, "not_found", "Song not found")
		return
	}
	if err := s.repo.SetLike(r.Context(), current(r).User.ID, id, r.Method == "PUT"); err != nil {
		s.internal(w, err)
		return
	}
	w.WriteHeader(204)
}
func (s *Server) preview(w http.ResponseWriter, r *http.Request) {
	key := fmt.Sprintf("mix:%d", current(r).User.ID)
	if !s.limits.allow(key, 5, time.Minute) {
		w.Header().Set("Retry-After", "60")
		fail(w, 429, "rate_limit", "Try another mix in a minute")
		return
	}
	var body struct {
		Prompt string `json:"prompt"`
	}
	if !decode(w, r, &body) {
		return
	}
	body.Prompt = strings.TrimSpace(body.Prompt)
	if utf8.RuneCountInString(body.Prompt) < 3 || utf8.RuneCountInString(body.Prompt) > 500 {
		fail(w, 422, "validation", "Describe your mood in 3–500 characters")
		return
	}
	mix, err := s.generator.Generate(r.Context(), body.Prompt, s.songs)
	if err != nil {
		s.logger.Warn("AI provider unavailable; using local mix", "error", err)
		mix, _ = (recommend.Local{}).Generate(r.Context(), body.Prompt, s.songs)
		mix.Source = "local_fallback"
	}
	if err := recommend.Validate(mix, s.songs); err != nil {
		s.internal(w, err)
		return
	}
	write(w, 200, mix)
}

type window struct {
	count int
	until time.Time
}
type limiter struct {
	mu      sync.Mutex
	entries map[string]window
}

func (l *limiter) allow(key string, max int, duration time.Duration) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	if l.entries == nil {
		l.entries = map[string]window{}
	}
	if len(l.entries) > 1000 {
		for k, v := range l.entries {
			if now.After(v.until) {
				delete(l.entries, k)
			}
		}
		if len(l.entries) > 10000 {
			return false
		}
	}
	v := l.entries[key]
	if now.After(v.until) {
		v = window{until: now.Add(duration)}
	}
	if v.count >= max {
		return false
	}
	v.count++
	l.entries[key] = v
	return true
}
