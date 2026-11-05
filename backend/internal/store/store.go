package store

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"time"

	"github.com/go-sql-driver/mysql"
)

var ErrNotFound = errors.New("not found")
var ErrConflict = errors.New("already exists")

type User struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
}
type Session struct {
	User    User
	CSRF    string
	Expires time.Time
}
type Playlist struct {
	ID      int64   `json:"id"`
	Name    string  `json:"name"`
	SongIDs []int64 `json:"songIds"`
}
type History struct {
	Enabled bool          `json:"enabled"`
	Items   []HistoryItem `json:"items"`
}
type HistoryItem struct {
	SongID   int64     `json:"songId"`
	PlayedAt time.Time `json:"playedAt"`
}
type SavedMix struct {
	ID         int64 `json:"id"`
	PlaylistID int64 `json:"playlistId"`
}

type Repository interface {
	Ping(context.Context) error
	CreateUser(context.Context, string, string, string) (User, error)
	FindUser(context.Context, string) (User, string, error)
	CreateSession(context.Context, string, int64, string, time.Time) error
	Session(context.Context, string) (Session, error)
	DeleteSession(context.Context, string) error
	Playlists(context.Context, int64) ([]Playlist, error)
	SavePlaylist(context.Context, int64, int64, string, []int64) (Playlist, error)
	DeletePlaylist(context.Context, int64, int64) error
	Likes(context.Context, int64) ([]int64, error)
	SetLike(context.Context, int64, int64, bool) error
	History(context.Context, int64) (History, error)
	RecordHistory(context.Context, int64, int64) error
	SetHistoryEnabled(context.Context, int64, bool) error
	ClearHistory(context.Context, int64) error
	SaveMix(context.Context, int64, string, string, string, []int64) (SavedMix, error)
	SetMixFeedback(context.Context, int64, int64, string) error
}

type MySQL struct{ DB *sql.DB }

func Open(dsn string) (*MySQL, error) {
	cfg, err := mysql.ParseDSN(dsn)
	if err != nil {
		return nil, err
	}
	cfg.ParseTime = true
	cfg.MultiStatements = false
	cfg.Timeout = 5 * time.Second
	cfg.ReadTimeout = 10 * time.Second
	cfg.WriteTimeout = 10 * time.Second
	db, err := sql.Open("mysql", cfg.FormatDSN())
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(3 * time.Minute)
	return &MySQL{DB: db}, nil
}
func (s *MySQL) Ping(ctx context.Context) error { return s.DB.PingContext(ctx) }
func TokenHash(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}
func dbError(err error) error {
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	var me *mysql.MySQLError
	if errors.As(err, &me) && me.Number == 1062 {
		return ErrConflict
	}
	return err
}
func (s *MySQL) CreateUser(ctx context.Context, username, name, hash string) (User, error) {
	r, err := s.DB.ExecContext(ctx, "INSERT INTO users (username,display_name,password_hash) VALUES (?,?,?)", username, name, hash)
	if err != nil {
		return User{}, dbError(err)
	}
	id, err := r.LastInsertId()
	return User{ID: id, Username: username, Name: name}, err
}
func (s *MySQL) FindUser(ctx context.Context, username string) (User, string, error) {
	var u User
	var hash string
	err := s.DB.QueryRowContext(ctx, "SELECT id,username,display_name,password_hash FROM users WHERE username=?", username).Scan(&u.ID, &u.Username, &u.Name, &hash)
	return u, hash, dbError(err)
}
func (s *MySQL) CreateSession(ctx context.Context, token string, userID int64, csrf string, expires time.Time) error {
	_, err := s.DB.ExecContext(ctx, "DELETE FROM sessions WHERE expires_at <= UTC_TIMESTAMP()")
	if err != nil {
		return err
	}
	_, err = s.DB.ExecContext(ctx, "INSERT INTO sessions (token_hash,user_id,csrf_token,expires_at) VALUES (?,?,?,?)", TokenHash(token), userID, csrf, expires.UTC())
	return err
}
func (s *MySQL) Session(ctx context.Context, token string) (Session, error) {
	var v Session
	err := s.DB.QueryRowContext(ctx, `SELECT u.id,u.username,u.display_name,s.csrf_token,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>UTC_TIMESTAMP()`, TokenHash(token)).Scan(&v.User.ID, &v.User.Username, &v.User.Name, &v.CSRF, &v.Expires)
	return v, dbError(err)
}
func (s *MySQL) DeleteSession(ctx context.Context, token string) error {
	_, err := s.DB.ExecContext(ctx, "DELETE FROM sessions WHERE token_hash=?", TokenHash(token))
	return err
}
func (s *MySQL) Playlists(ctx context.Context, uid int64) ([]Playlist, error) {
	rows, err := s.DB.QueryContext(ctx, `SELECT p.id,p.name,ps.song_id FROM playlists p LEFT JOIN playlist_songs ps ON ps.playlist_id=p.id WHERE p.user_id=? ORDER BY p.id DESC,ps.position`, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []Playlist{}
	index := map[int64]int{}
	for rows.Next() {
		var id int64
		var name string
		var song sql.NullInt64
		if err := rows.Scan(&id, &name, &song); err != nil {
			return nil, err
		}
		i, ok := index[id]
		if !ok {
			i = len(result)
			index[id] = i
			result = append(result, Playlist{ID: id, Name: name, SongIDs: []int64{}})
		}
		if song.Valid {
			result[i].SongIDs = append(result[i].SongIDs, song.Int64)
		}
	}
	return result, rows.Err()
}

// SavePlaylist checks ownership under a row lock and replaces the ordered tracks atomically.
func (s *MySQL) SavePlaylist(ctx context.Context, uid, id int64, name string, ids []int64) (Playlist, error) {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return Playlist{}, err
	}
	defer tx.Rollback()
	if id == 0 {
		r, err := tx.ExecContext(ctx, "INSERT INTO playlists (user_id,name) VALUES (?,?)", uid, name)
		if err != nil {
			return Playlist{}, err
		}
		id, err = r.LastInsertId()
		if err != nil {
			return Playlist{}, err
		}
	} else {
		var existing int64
		if err := tx.QueryRowContext(ctx, "SELECT id FROM playlists WHERE id=? AND user_id=? FOR UPDATE", id, uid).Scan(&existing); err != nil {
			return Playlist{}, dbError(err)
		}
		if _, err := tx.ExecContext(ctx, "UPDATE playlists SET name=? WHERE id=?", name, id); err != nil {
			return Playlist{}, err
		}
		if _, err := tx.ExecContext(ctx, "DELETE FROM playlist_songs WHERE playlist_id=?", id); err != nil {
			return Playlist{}, err
		}
	}
	for i, song := range ids {
		if _, err := tx.ExecContext(ctx, "INSERT INTO playlist_songs (playlist_id,song_id,position) VALUES (?,?,?)", id, song, i); err != nil {
			return Playlist{}, err
		}
	}
	if err := tx.Commit(); err != nil {
		return Playlist{}, err
	}
	return Playlist{ID: id, Name: name, SongIDs: ids}, nil
}
func (s *MySQL) DeletePlaylist(ctx context.Context, uid, id int64) error {
	r, err := s.DB.ExecContext(ctx, "DELETE FROM playlists WHERE id=? AND user_id=?", id, uid)
	if err != nil {
		return err
	}
	n, err := r.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}
func (s *MySQL) Likes(ctx context.Context, uid int64) ([]int64, error) {
	rows, err := s.DB.QueryContext(ctx, "SELECT song_id FROM liked_songs WHERE user_id=? ORDER BY created_at DESC,song_id", uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	ids := []int64{}
	for rows.Next() {
		var id int64
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}
func (s *MySQL) SetLike(ctx context.Context, uid, id int64, liked bool) error {
	var err error
	if liked {
		_, err = s.DB.ExecContext(ctx, "INSERT INTO liked_songs (user_id,song_id) VALUES (?,?) ON DUPLICATE KEY UPDATE song_id=VALUES(song_id)", uid, id)
	} else {
		_, err = s.DB.ExecContext(ctx, "DELETE FROM liked_songs WHERE user_id=? AND song_id=?", uid, id)
	}
	return err
}

func (s *MySQL) History(ctx context.Context, uid int64) (History, error) {
	result := History{Enabled: true, Items: []HistoryItem{}}
	if err := s.DB.QueryRowContext(ctx, "SELECT COALESCE((SELECT history_enabled FROM user_preferences WHERE user_id=?),TRUE)", uid).Scan(&result.Enabled); err != nil {
		return History{}, err
	}
	if !result.Enabled {
		return result, nil
	}
	rows, err := s.DB.QueryContext(ctx, "SELECT song_id,played_at FROM listening_history WHERE user_id=? AND played_at>=UTC_TIMESTAMP()-INTERVAL 90 DAY ORDER BY played_at DESC LIMIT 20", uid)
	if err != nil {
		return History{}, err
	}
	defer rows.Close()
	for rows.Next() {
		var item HistoryItem
		if err := rows.Scan(&item.SongID, &item.PlayedAt); err != nil {
			return History{}, err
		}
		result.Items = append(result.Items, item)
	}
	return result, rows.Err()
}

func (s *MySQL) RecordHistory(ctx context.Context, uid, songID int64) error {
	_, err := s.DB.ExecContext(ctx, `INSERT INTO listening_history (user_id,song_id,played_at)
		SELECT ?,?,UTC_TIMESTAMP() WHERE COALESCE((SELECT history_enabled FROM user_preferences WHERE user_id=?),TRUE)
		ON DUPLICATE KEY UPDATE played_at=VALUES(played_at)`, uid, songID, uid)
	return err
}

func (s *MySQL) SetHistoryEnabled(ctx context.Context, uid int64, enabled bool) error {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, "INSERT INTO user_preferences (user_id,history_enabled) VALUES (?,?) ON DUPLICATE KEY UPDATE history_enabled=VALUES(history_enabled)", uid, enabled); err != nil {
		return err
	}
	if !enabled {
		if _, err := tx.ExecContext(ctx, "DELETE FROM listening_history WHERE user_id=?", uid); err != nil {
			return err
		}
	}
	return tx.Commit()
}

func (s *MySQL) ClearHistory(ctx context.Context, uid int64) error {
	_, err := s.DB.ExecContext(ctx, "DELETE FROM listening_history WHERE user_id=?", uid)
	return err
}

func (s *MySQL) SaveMix(ctx context.Context, uid int64, name, description, source string, ids []int64) (SavedMix, error) {
	tx, err := s.DB.BeginTx(ctx, nil)
	if err != nil {
		return SavedMix{}, err
	}
	defer tx.Rollback()
	playlistResult, err := tx.ExecContext(ctx, "INSERT INTO playlists (user_id,name) VALUES (?,?)", uid, name)
	if err != nil {
		return SavedMix{}, err
	}
	playlistID, err := playlistResult.LastInsertId()
	if err != nil {
		return SavedMix{}, err
	}
	for position, songID := range ids {
		if _, err := tx.ExecContext(ctx, "INSERT INTO playlist_songs (playlist_id,song_id,position) VALUES (?,?,?)", playlistID, songID, position); err != nil {
			return SavedMix{}, err
		}
	}
	snapshot, err := json.Marshal(ids)
	if err != nil {
		return SavedMix{}, err
	}
	mixResult, err := tx.ExecContext(ctx, "INSERT INTO saved_mixes (user_id,playlist_id,name,description,source,song_ids) VALUES (?,?,?,?,?,?)", uid, playlistID, name, description, source, snapshot)
	if err != nil {
		return SavedMix{}, err
	}
	mixID, err := mixResult.LastInsertId()
	if err != nil {
		return SavedMix{}, err
	}
	if err := tx.Commit(); err != nil {
		return SavedMix{}, err
	}
	return SavedMix{ID: mixID, PlaylistID: playlistID}, nil
}

func (s *MySQL) SetMixFeedback(ctx context.Context, uid, id int64, rating string) error {
	result, err := s.DB.ExecContext(ctx, "UPDATE saved_mixes SET rating=?,rated_at=UTC_TIMESTAMP() WHERE id=? AND user_id=?", rating, id, uid)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return ErrNotFound
	}
	return nil
}
