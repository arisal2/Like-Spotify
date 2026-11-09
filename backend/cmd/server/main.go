package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"syscall"
	"time"

	"bedlam-like-music/backend/internal/httpapi"
	"bedlam-like-music/backend/internal/recommend"
	"bedlam-like-music/backend/internal/store"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := run(logger); err != nil {
		logger.Error("server stopped", "error", err)
		os.Exit(1)
	}
}
func run(logger *slog.Logger) error {
	dsn := os.Getenv("DATABASE_DSN")
	if dsn == "" {
		return errors.New("DATABASE_DSN is required")
	}
	repo, err := store.Open(dsn)
	if err != nil {
		return err
	}
	defer repo.DB.Close()
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		return repo.Migrate(ctx)
	}
	if err := repo.Ping(ctx); err != nil {
		return err
	}
	origin := env("APP_ORIGIN", "http://localhost:8080")
	parsed, err := url.Parse(origin)
	if err != nil || parsed.Host == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") || parsed.Path != "" {
		return errors.New("APP_ORIGIN must be an http(s) origin without a path")
	}
	secure := os.Getenv("COOKIE_SECURE") == "true"
	if os.Getenv("APP_ENV") == "production" && (!secure || parsed.Scheme != "https") {
		return errors.New("production requires HTTPS APP_ORIGIN and COOKIE_SECURE=true")
	}
	var generator recommend.Generator = recommend.Local{}
	if key := os.Getenv("OPENAI_API_KEY"); key != "" {
		model := os.Getenv("OPENAI_MODEL")
		if model == "" {
			return errors.New("OPENAI_MODEL is required when enabling OpenAI")
		}
		generator = recommend.OpenAI{Key: key, Model: model}
	}
	server := &http.Server{Addr: env("HTTP_ADDR", ":8081"), Handler: httpapi.New(repo, httpapi.Config{Origin: origin, SecureCookies: secure, MediaDir: env("MEDIA_DIR", "../assets")}, generator, logger), ReadHeaderTimeout: 5 * time.Second, ReadTimeout: 10 * time.Second, WriteTimeout: 30 * time.Second, IdleTimeout: 60 * time.Second, MaxHeaderBytes: 32 << 10}
	stop, stopCancel := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stopCancel()
	errorsCh := make(chan error, 1)
	go func() { logger.Info("listening", "address", server.Addr); errorsCh <- server.ListenAndServe() }()
	select {
	case err := <-errorsCh:
		if !errors.Is(err, http.ErrServerClosed) {
			return err
		}
	case <-stop.Done():
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		return server.Shutdown(ctx)
	}
	return nil
}
func env(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
