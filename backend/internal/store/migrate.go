package store

import (
	"context"
	"embed"
	"fmt"
	"strings"

	"bedlam-like-music/backend/internal/catalog"
)

//go:embed migrations/*.sql
var migrations embed.FS

// Migrate uses a connection-scoped lock; MySQL DDL is not transactionally rolled back.
// Each statement must be restart-safe. Run this command once before an API rollout.
func (s *MySQL) Migrate(ctx context.Context) error {
	conn, err := s.DB.Conn(ctx)
	if err != nil {
		return err
	}
	defer conn.Close()
	var locked int
	if err := conn.QueryRowContext(ctx, "SELECT GET_LOCK('bedlam_like_music_migrate',30)").Scan(&locked); err != nil {
		return err
	}
	if locked != 1 {
		return fmt.Errorf("migration lock unavailable")
	}
	defer conn.ExecContext(context.Background(), "SELECT RELEASE_LOCK('bedlam_like_music_migrate')")
	if _, err := conn.ExecContext(ctx, "CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(100) PRIMARY KEY)"); err != nil {
		return err
	}
	files, err := migrations.ReadDir("migrations")
	if err != nil {
		return err
	}
	for _, file := range files {
		var n int
		if err := conn.QueryRowContext(ctx, "SELECT COUNT(*) FROM schema_migrations WHERE version=?", file.Name()).Scan(&n); err != nil {
			return err
		}
		if n > 0 {
			continue
		}
		data, err := migrations.ReadFile("migrations/" + file.Name())
		if err != nil {
			return err
		}
		for _, statement := range strings.Split(string(data), ";") {
			if strings.TrimSpace(statement) == "" {
				continue
			}
			if _, err := conn.ExecContext(ctx, statement); err != nil {
				return fmt.Errorf("%s: %w", file.Name(), err)
			}
		}
		if _, err := conn.ExecContext(ctx, "INSERT INTO schema_migrations (version) VALUES (?)", file.Name()); err != nil {
			return err
		}
	}
	for _, song := range catalog.Load() {
		if _, err := conn.ExecContext(ctx, "INSERT INTO songs (id,title) VALUES (?,?) ON DUPLICATE KEY UPDATE title=VALUES(title)", song.ID, song.Title); err != nil {
			return err
		}
	}
	return nil
}
