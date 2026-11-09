import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Disc3,
  Headphones,
  Heart,
  Home,
  Library,
  LogOut,
  Music2,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  api,
  setCSRF,
  type Mix,
  type MixAdjustment,
  type Playlist,
  type SavedMix,
  type Song,
} from "./lib/api";
import { formatTime } from "./lib/queue";
import { usePlayer } from "./hooks/usePlayer";
import { Player } from "./components/Player";
import { Modal } from "./components/Modal";

export function App() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [dialog, setDialog] = useState<"auth" | "playlist" | "mix" | null>(
    null,
  );
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const catalog = useQuery({
    queryKey: ["catalog"],
    queryFn: ({ signal }) => api.catalog(signal),
  });
  const session = useQuery({ queryKey: ["session"], queryFn: api.session });
  const user = session.data?.user;
  const playlists = useQuery({
    queryKey: ["playlists", user?.id],
    queryFn: api.playlists,
    enabled: !!user,
  });
  const likes = useQuery({
    queryKey: ["likes", user?.id],
    queryFn: api.likes,
    enabled: !!user,
  });
  const history = useQuery({
    queryKey: ["history", user?.id],
    queryFn: api.history,
    enabled: !!user,
  });
  const songs = catalog.data?.songs ?? [];
  const playbackOwner = session.isPending
    ? null
    : user
      ? `user.${user.id}`
      : "guest";
  const player = usePlayer(songs, playbackOwner);
  const lastRecorded = useRef("");
  useEffect(() => {
    if (
      !user ||
      !player.playing ||
      !player.track ||
      player.progress < 5 ||
      history.data?.enabled === false
    )
      return;
    const key = `${user.id}:${player.track.id}`;
    if (lastRecorded.current === key) return;
    lastRecorded.current = key;
    void api
      .recordHistory(player.track.id)
      .then(() => client.invalidateQueries({ queryKey: ["history", user.id] }))
      .catch(() => {
        lastRecorded.current = "";
      });
  }, [
    client,
    history.data?.enabled,
    player.playing,
    player.progress,
    player.track,
    user,
  ]);
  const collections = playlists.data?.playlists ?? [];
  const liked = likes.data?.songIds ?? [];
  const albumID = location.pathname.startsWith("/albums/")
    ? Number(location.pathname.split("/")[2])
    : undefined;
  const playlistID = location.pathname.startsWith("/playlists/")
    ? Number(location.pathname.split("/")[2])
    : undefined;
  const playlist = collections.find((item) => item.id === playlistID);
  const album = songs.find((song) => song.albumId === albumID);
  const isLikes = location.pathname === "/likes";
  const isSearch = location.pathname === "/search";
  const albums = [
    ...new Map(songs.map((song) => [song.albumId, song])).values(),
  ];
  const byID = (ids: number[]) =>
    ids.flatMap((id) => {
      const song = songs.find((song) => song.id === id);
      return song ? [song] : [];
    });
  const recent = byID(history.data?.items.map((item) => item.songId) ?? []);
  let visible = songs;
  if (isLikes) visible = byID(liked);
  else if (playlist) visible = byID(playlist.songIds);
  else if (albumID) visible = songs.filter((song) => song.albumId === albumID);
  else if (isSearch)
    visible = songs.filter((song) =>
      `${song.title} ${song.artist} ${song.album} ${song.tags.join(" ")}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
    );
  const invalidateLibrary = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["playlists"] }),
      client.invalidateQueries({ queryKey: ["likes"] }),
      client.invalidateQueries({ queryKey: ["history"] }),
    ]);
  };
  const action = async (work: () => Promise<unknown>, message?: string) => {
    if (busy) return;
    setBusy(true);
    setNotice("");
    try {
      await work();
      await invalidateLibrary();
      if (message) setNotice(message);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Please try again");
    } finally {
      setBusy(false);
    }
  };
  const requireUser = (work: () => void) => {
    if (!user) setDialog("auth");
    else work();
  };
  const savePlaylist = async (
    value: { name: string; songIds: number[] },
    id?: number,
  ) => {
    const saved = await api.savePlaylist(value, id);
    await invalidateLibrary();
    return saved;
  };
  const logout = () =>
    void action(async () => {
      await api.logout();
      setCSRF("");
      client.removeQueries({ queryKey: ["playlists"] });
      client.removeQueries({ queryKey: ["likes"] });
      client.removeQueries({ queryKey: ["history"] });
      client.setQueryData(["session"], { user: null, csrfToken: "" });
      navigate("/");
    });
  const heading =
    playlist?.name ??
    album?.album ??
    (isLikes
      ? "Liked songs"
      : isSearch
        ? "Find your next favorite"
        : "Made for your everyday");
  const libraryError = playlists.error ?? likes.error ?? history.error;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to music
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-symbol">
            <Headphones size={24} />
          </span>
          Bedlam-Like-Music<span className="brand-dot">.</span>
        </Link>
        <span className="sidebar-label">YOUR SOUNDTRACK</span>
        <nav aria-label="Main navigation">
          <NavLink to="/" end>
            <Home size={20} />
            Discover
          </NavLink>
          <NavLink to="/search">
            <Search size={20} />
            Search
          </NavLink>
          <NavLink to="/likes">
            <Heart size={20} />
            Liked songs<span className="count">{liked.length || ""}</span>
          </NavLink>
        </nav>
        <div className="library-title">
          <span>
            <Library size={18} />
            Your library
          </span>
          <button
            className="icon"
            aria-label="Create playlist"
            onClick={() => requireUser(() => setDialog("playlist"))}
          >
            <Plus size={19} />
          </button>
        </div>
        <nav aria-label="Playlists">
          {collections.map((item) => (
            <NavLink key={item.id} to={`/playlists/${item.id}`}>
              <span className="playlist-icon">
                <Music2 size={16} />
              </span>
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>
        {collections.length === 0 && (
          <p className="library-hint">
            Good music deserves a home.
            <br />
            Make a playlist of your own.
          </p>
        )}
        <button
          className="sidebar-mix"
          onClick={() => requireUser(() => setDialog("mix"))}
        >
          <Sparkles size={22} />
          <strong>A mix that gets you</strong>
          <span>Describe a mood. Find your sound.</span>
          <span className="sidebar-mix-cta">
            Make a mood mix <ArrowRight size={16} />
          </span>
        </button>
        <div className="sidebar-footer">
          A familiar feeling. A new frequency.
          <span>Built for the love of music.</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            Your space <span>/</span>{" "}
            <strong>
              {isSearch
                ? "Search"
                : isLikes
                  ? "Liked songs"
                  : playlist
                    ? "Playlist"
                    : album
                      ? "Album"
                      : "Discover"}
            </strong>
          </div>
          <div className="account">
            {user ? (
              <>
                <span className="avatar">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span>{user.name}</span>
                <button
                  className="icon"
                  aria-label="Sign out"
                  disabled={busy}
                  onClick={logout}
                >
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <button
                className="button secondary compact"
                onClick={() => setDialog("auth")}
              >
                Sign in <ArrowRight size={15} />
              </button>
            )}
          </div>
        </header>
        <main id="main">
          {notice && (
            <div className="notice" role="status">
              <span>{notice}</span>
              <button
                onClick={() => setNotice("")}
                aria-label="Dismiss notification"
              >
                Dismiss
              </button>
            </div>
          )}
          {(session.error || libraryError) && (
            <div className="notice error" role="alert">
              {(session.error ?? libraryError)?.message}
              <button
                onClick={() => {
                  void session.refetch();
                  void invalidateLibrary();
                }}
              >
                Retry
              </button>
            </div>
          )}
          {catalog.isPending ? (
            <div className="loading" role="status">
              <Disc3 className="spin" /> Finding your frequency…
            </div>
          ) : catalog.error ? (
            <div className="empty">
              <h1>We couldn’t load the music</h1>
              <p>{catalog.error.message}</p>
              <button className="button" onClick={() => void catalog.refetch()}>
                Try again
              </button>
            </div>
          ) : (
            <>
              {!albumID && !playlistID && !isLikes && !isSearch ? (
                <>
                  <section className="hero">
                    <div className="hero-copy">
                      <span className="eyebrow">
                        <span className="live-dot" /> GOOD MUSIC. NO WRONG
                        TURNS.
                      </span>
                      <h1>
                        Find your
                        <br />
                        <em>frequency.</em>
                      </h1>
                      <p>
                        For the deep work, the slow mornings,
                        <br />
                        and everything in between.
                      </p>
                      <div className="hero-actions">
                        <button
                          className="button"
                          onClick={() => player.play(songs)}
                        >
                          <Play size={17} fill="currentColor" /> Press play
                        </button>
                        <button
                          className="text-button"
                          onClick={() => requireUser(() => setDialog("mix"))}
                        >
                          <Sparkles size={17} /> Make it personal
                        </button>
                      </div>
                    </div>
                    <div className="record-art" aria-hidden="true">
                      <div className="orbit orbit-one" />
                      <div className="orbit orbit-two" />
                      <div className="record">
                        <div className="record-label">
                          <Headphones size={32} />
                          <span>SIDE A · EVERYDAY ROTATION</span>
                          <i />
                        </div>
                      </div>
                      <div className="record-caption">
                        33⅓ RPM <span>ENDLESS POSSIBILITIES</span>
                      </div>
                    </div>
                  </section>
                  <section className="mood-section">
                    <div className="section-heading">
                      <h2>What’s the mood?</h2>
                      <span>A little direction for your day</span>
                    </div>
                    <div className="mood-grid">
                      {[
                        {
                          name: "Deep focus",
                          tag: "focus",
                          icon: "◎",
                          color: "lavender",
                        },
                        {
                          name: "Slow mornings",
                          tag: "morning",
                          icon: "☀",
                          color: "peach",
                        },
                        {
                          name: "Turn it up",
                          tag: "energy",
                          icon: "ϟ",
                          color: "lime",
                        },
                        {
                          name: "After hours",
                          tag: "jazz",
                          icon: "☾",
                          color: "blue",
                        },
                      ].map((mood) => (
                        <button
                          key={mood.tag}
                          className={`mood ${mood.color}`}
                          onClick={() => {
                            setSearch(mood.tag);
                            navigate("/search");
                          }}
                        >
                          <span className="mood-symbol">{mood.icon}</span>
                          <strong>{mood.name}</strong>
                          <ArrowRight size={17} />
                        </button>
                      ))}
                    </div>
                  </section>
                  {user && history.data && (
                    <section className="tracks-section history-section">
                      <div className="section-heading">
                        <div>
                          <span className="eyebrow">
                            YOUR LISTENING, YOUR CALL
                          </span>
                          <h2>Recently played</h2>
                        </div>
                        <div className="history-actions">
                          {history.data.enabled &&
                            history.data.items.length > 0 && (
                              <button
                                className="text-button"
                                disabled={busy}
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Clear your listening history?",
                                    )
                                  )
                                    void action(
                                      api.clearHistory,
                                      "Listening history cleared",
                                    );
                                }}
                              >
                                Clear
                              </button>
                            )}
                          <button
                            className="button secondary compact"
                            disabled={busy}
                            onClick={() =>
                              void action(
                                () =>
                                  api.setHistoryEnabled(!history.data.enabled),
                                history.data.enabled
                                  ? "Listening history is off and existing history was deleted"
                                  : "Listening history is on",
                              )
                            }
                          >
                            {history.data.enabled
                              ? "Turn off history"
                              : "Turn on history"}
                          </button>
                        </div>
                      </div>
                      {history.data.enabled && recent.length > 0 ? (
                        <TrackList
                          songs={recent.slice(0, 5)}
                          currentID={player.track?.id}
                          liked={liked}
                          playlists={collections}
                          busy={busy}
                          onPlay={(items, index) => player.play(items, index)}
                          onLike={(song) =>
                            void action(() =>
                              api.like(song.id, !liked.includes(song.id)),
                            )
                          }
                          onAdd={(song, target) =>
                            void action(
                              () =>
                                api.savePlaylist(
                                  {
                                    name: target.name,
                                    songIds: [...target.songIds, song.id],
                                  },
                                  target.id,
                                ),
                              "Added to your playlist",
                            )
                          }
                          onRemove={() => undefined}
                          onReorder={() => undefined}
                        />
                      ) : (
                        <p className="library-hint">
                          {history.data.enabled
                            ? "Play something and it will appear here. History is private to your account."
                            : "Listening history is off. Nothing you play will be recorded."}
                        </p>
                      )}
                    </section>
                  )}
                  <section>
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">WORTH A LISTEN</span>
                        <h2>Your next rotation</h2>
                      </div>
                      <Link to="/search" onClick={() => setSearch("")}>
                        Explore all <ArrowRight size={15} />
                      </Link>
                    </div>
                    <div className="album-grid">
                      {albums.map((item) => (
                        <Link
                          className="album-card"
                          key={item.albumId}
                          to={`/albums/${item.albumId}`}
                        >
                          <div className="cover">
                            <img
                              src={item.artwork}
                              alt={`${item.album} cover`}
                              loading="lazy"
                            />
                            <span className="cover-play">
                              <Play size={20} fill="currentColor" />
                            </span>
                          </div>
                          <h3>{item.album}</h3>
                          <p>
                            {item.artist} <span>· Album</span>
                          </p>
                        </Link>
                      ))}
                    </div>
                  </section>
                </>
              ) : (
                <section className="collection-heading">
                  {album && <img src={album.artwork} alt="" />}
                  <div>
                    <span className="eyebrow">
                      {playlist
                        ? "YOUR PLAYLIST"
                        : album
                          ? "ALBUM"
                          : isLikes
                            ? "THE ONES YOU KEEP COMING BACK TO"
                            : "A LITTLE DISCOVERY GOES A LONG WAY"}
                    </span>
                    <h1>{heading}</h1>
                    <p>
                      {isSearch
                        ? "Search songs, albums, or a feeling."
                        : `${visible.length} songs · ${formatTime(visible.reduce((sum, song) => sum + song.duration, 0))} of good company`}
                    </p>
                    {(!isLikes || user) && !isSearch && (
                      <button
                        className="button"
                        disabled={!visible.length}
                        onClick={() => player.play(visible)}
                      >
                        <Play size={16} fill="currentColor" /> Play collection
                      </button>
                    )}
                  </div>
                </section>
              )}
              {isSearch && (
                <label className="search-field">
                  <Search size={21} />
                  <input
                    autoFocus
                    aria-label="Search music"
                    placeholder="Songs, albums, or a mood…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                  <span>{visible.length} tracks</span>
                </label>
              )}
              {playlist && (
                <div className="playlist-tools">
                  <button
                    className="button secondary compact"
                    disabled={busy}
                    onClick={() => setDialog("playlist")}
                  >
                    Rename playlist
                  </button>
                  <button
                    className="text-button danger"
                    disabled={busy}
                    onClick={() => {
                      if (window.confirm(`Delete “${playlist.name}”?`))
                        void action(async () => {
                          await api.deletePlaylist(playlist.id);
                          navigate("/");
                        }, "Playlist deleted");
                    }}
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              )}
              {(isLikes || playlistID) && !user ? (
                <div className="empty">
                  <Heart size={32} />
                  <h2>Your favorites belong here</h2>
                  <p>Sign in to save songs and make playlists.</p>
                  <button className="button" onClick={() => setDialog("auth")}>
                    Get started
                  </button>
                </div>
              ) : playlistID && !playlist && !playlists.isPending ? (
                <div className="empty">
                  <h2>Playlist not found</h2>
                  <Link to="/">Back to discover</Link>
                </div>
              ) : (
                <section className="tracks-section">
                  <div className="section-heading">
                    <h2>
                      {albumID || playlistID || isLikes || isSearch
                        ? "Tracks"
                        : "A few good finds"}
                    </h2>
                    <span>
                      {playlist
                        ? "Use the arrows to reorder your mix"
                        : "Pick a track. Stay a while."}
                    </span>
                  </div>
                  <TrackList
                    songs={
                      albumID || playlistID || isLikes || isSearch
                        ? visible
                        : songs.slice(0, 6)
                    }
                    currentID={player.track?.id}
                    liked={liked}
                    playlists={collections}
                    selected={playlist}
                    busy={busy}
                    onPlay={(items, index) => player.play(items, index)}
                    onLike={(song) =>
                      requireUser(
                        () =>
                          void action(() =>
                            api.like(song.id, !liked.includes(song.id)),
                          ),
                      )
                    }
                    onAdd={(song, collection) =>
                      void action(
                        () =>
                          api.savePlaylist(
                            {
                              name: collection.name,
                              songIds: [...collection.songIds, song.id],
                            },
                            collection.id,
                          ),
                        "Added to your playlist",
                      )
                    }
                    onRemove={(song) => {
                      if (playlist)
                        void action(() =>
                          api.savePlaylist(
                            {
                              name: playlist.name,
                              songIds: playlist.songIds.filter(
                                (id) => id !== song.id,
                              ),
                            },
                            playlist.id,
                          ),
                        );
                    }}
                    onReorder={(index, direction) => {
                      if (!playlist) return;
                      const ids = [...playlist.songIds];
                      [ids[index], ids[index + direction]] = [
                        ids[index + direction],
                        ids[index],
                      ];
                      void action(() =>
                        api.savePlaylist(
                          { name: playlist.name, songIds: ids },
                          playlist.id,
                        ),
                      );
                    }}
                  />
                  {visible.length === 0 && (
                    <div className="empty">
                      <Music2 size={28} />
                      <h3>{isSearch ? "No matches yet" : "A fresh start"}</h3>
                      <p>
                        {isSearch
                          ? "Try a different song, album, or mood."
                          : "Discover some music and add your favorites here."}
                      </p>
                    </div>
                  )}
                </section>
              )}
              <footer className="content-footer">
                <span className="brand">Bedlam-Like-Music.</span>
                <p>Less scrolling. More listening.</p>
                <span>Demo catalog</span>
              </footer>
            </>
          )}
        </main>
      </div>
      <Player player={player} />
      {dialog === "auth" && (
        <AuthDialog
          onClose={() => setDialog(null)}
          onSuccess={() => {
            setDialog(null);
            setNotice("You’re in. Make yourself at home.");
          }}
        />
      )}
      {dialog === "playlist" && (
        <PlaylistDialog
          playlist={playlist}
          onClose={() => setDialog(null)}
          onSave={async (name) => {
            const saved = await savePlaylist(
              { name, songIds: playlist?.songIds ?? [] },
              playlist?.id,
            );
            setDialog(null);
            navigate(`/playlists/${saved.id}`);
          }}
        />
      )}
      {dialog === "mix" && (
        <MixDialog
          onClose={() => setDialog(null)}
          songs={songs}
          onPlay={(ids) => player.play(byID(ids))}
          onSave={async (mix) => {
            const saved = await api.saveMix(mix);
            await invalidateLibrary();
            return saved;
          }}
        />
      )}
    </div>
  );
}

function TrackList({
  songs,
  currentID,
  liked,
  playlists,
  selected,
  busy,
  onPlay,
  onLike,
  onAdd,
  onRemove,
  onReorder,
}: {
  songs: Song[];
  currentID?: number;
  liked: number[];
  playlists: Playlist[];
  selected?: Playlist;
  busy: boolean;
  onPlay: (songs: Song[], index: number) => void;
  onLike: (song: Song) => void;
  onAdd: (song: Song, playlist: Playlist) => void;
  onRemove: (song: Song) => void;
  onReorder: (index: number, direction: number) => void;
}) {
  return (
    <div className="track-list">
      <div className="track-labels">
        <span>#</span>
        <span>TITLE</span>
        <span>ALBUM</span>
        <span className="track-time">TIME</span>
        <span />
      </div>
      {songs.map((song, index) => (
        <div
          key={song.id}
          className={song.id === currentID ? "track-row current" : "track-row"}
        >
          <button
            className="track-number"
            aria-label={`Play ${song.title}`}
            onClick={() => onPlay(songs, index)}
          >
            <span>
              {song.id === currentID ? (
                <Headphones size={15} />
              ) : (
                String(index + 1).padStart(2, "0")
              )}
            </span>
            <Play size={15} fill="currentColor" />
          </button>
          <div className="song-title">
            <img src={song.artwork} alt="" loading="lazy" />
            <div>
              <button onClick={() => onPlay(songs, index)}>{song.title}</button>
              <span>{song.artist}</span>
            </div>
          </div>
          <Link className="track-album" to={`/albums/${song.albumId}`}>
            {song.album}
          </Link>
          <time className="track-time">{formatTime(song.duration)}</time>
          <div className="track-actions">
            <button
              className={liked.includes(song.id) ? "icon active" : "icon"}
              aria-label={`${liked.includes(song.id) ? "Unlike" : "Like"} ${song.title}`}
              aria-pressed={liked.includes(song.id)}
              disabled={busy}
              onClick={() => onLike(song)}
            >
              <Heart
                size={17}
                fill={liked.includes(song.id) ? "currentColor" : "none"}
              />
            </button>
            {selected ? (
              <>
                <button
                  className="icon reorder"
                  aria-label={`Move ${song.title} up`}
                  disabled={busy || index === 0}
                  onClick={() => onReorder(index, -1)}
                >
                  <ArrowUp size={15} />
                </button>
                <button
                  className="icon reorder"
                  aria-label={`Move ${song.title} down`}
                  disabled={busy || index === songs.length - 1}
                  onClick={() => onReorder(index, 1)}
                >
                  <ArrowDown size={15} />
                </button>
                <button
                  className="icon"
                  aria-label={`Remove ${song.title}`}
                  disabled={busy}
                  onClick={() => onRemove(song)}
                >
                  <Trash2 size={15} />
                </button>
              </>
            ) : (
              playlists.length > 0 && (
                <select
                  aria-label={`Add ${song.title} to playlist`}
                  value=""
                  disabled={busy}
                  onChange={(event) => {
                    const collection = playlists.find(
                      (item) => item.id === Number(event.target.value),
                    );
                    if (collection) onAdd(song, collection);
                  }}
                >
                  <option value="">＋</option>
                  {playlists.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={item.songIds.includes(song.id)}
                    >
                      {item.name}
                      {item.songIds.includes(song.id) ? " (added)" : ""}
                    </option>
                  ))}
                </select>
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AuthDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const client = useQueryClient();
  const [register, setRegister] = useState(false);
  const mutation = useMutation({
    mutationFn: async (form: HTMLFormElement) => {
      const fields = new FormData(form);
      const credentials = {
        username: String(fields.get("username")),
        password: String(fields.get("password")),
      };
      return register
        ? api.register({ ...credentials, name: String(fields.get("name")) })
        : api.login(credentials);
    },
    onSuccess: async (value) => {
      setCSRF(value.csrfToken);
      client.removeQueries({ queryKey: ["playlists"] });
      client.removeQueries({ queryKey: ["likes"] });
      client.setQueryData(["session"], value);
      onSuccess();
    },
  });
  return (
    <Modal
      title={register ? "Make yourself at home" : "Welcome back"}
      onClose={onClose}
    >
      <p className="modal-intro">Your music. Your corner of the internet.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(event.currentTarget);
        }}
      >
        {register && (
          <label>
            Your name
            <input name="name" autoComplete="name" required maxLength={80} />
          </label>
        )}
        <label>
          Username
          <input
            name="username"
            autoComplete="username"
            required
            minLength={3}
            maxLength={32}
            pattern={register ? "[A-Za-z0-9_]{3,32}" : undefined}
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            autoComplete={register ? "new-password" : "current-password"}
            required
            minLength={register ? 12 : undefined}
            maxLength={72}
          />
        </label>
        {register && (
          <small>Use at least 12 characters. Spaces and symbols welcome.</small>
        )}
        {mutation.error && (
          <p className="form-error" role="alert">
            {mutation.error.message}
          </p>
        )}
        <button className="button full" disabled={mutation.isPending}>
          {mutation.isPending
            ? "One moment…"
            : register
              ? "Create account"
              : "Sign in"}
          <ArrowRight size={17} />
        </button>
      </form>
      <button
        className="auth-switch"
        onClick={() => {
          setRegister(!register);
          mutation.reset();
        }}
      >
        {register
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </button>
    </Modal>
  );
}

function PlaylistDialog({
  playlist,
  onClose,
  onSave,
}: {
  playlist?: Playlist;
  onClose: () => void;
  onSave: (name: string) => Promise<void>;
}) {
  const mutation = useMutation({ mutationFn: onSave });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate(
      String(new FormData(event.currentTarget).get("name")).trim(),
    );
  };
  return (
    <Modal
      title={
        playlist ? "A new name, same good music" : "Give your music a home"
      }
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <label>
          Playlist name
          <input
            name="name"
            required
            maxLength={80}
            defaultValue={playlist?.name ?? ""}
            placeholder="The long way home"
          />
        </label>
        {mutation.error && (
          <p role="alert" className="form-error">
            {mutation.error.message}
          </p>
        )}
        <button className="button full" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving…" : "Save playlist"}
          <Plus size={17} />
        </button>
      </form>
    </Modal>
  );
}

function MixDialog({
  onClose,
  songs,
  onPlay,
  onSave,
}: {
  onClose: () => void;
  songs: Song[];
  onPlay: (ids: number[]) => void;
  onSave: (mix: Mix) => Promise<SavedMix>;
}) {
  const [prompt, setPrompt] = useState("");
  const [previewPrompt, setPreviewPrompt] = useState("");
  const generate = useMutation({
    mutationFn: api.mix,
    onSuccess: (_mix, input) => {
      setPreviewPrompt(input.prompt);
      save.reset();
      feedback.reset();
    },
  });
  const save = useMutation({ mutationFn: onSave });
  const feedback = useMutation({
    mutationFn: ({
      id,
      rating,
    }: {
      id: number;
      rating: "fits" | "not_quite";
    }) => api.rateMix(id, rating),
  });
  const mix = generate.data;
  return (
    <Modal title="A mood becomes a mix" onClose={onClose}>
      <p className="modal-intro">
        Tell us what your moment sounds like. We’ll find the music.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          generate.mutate({ prompt });
        }}
      >
        <label>
          Your moment
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            minLength={3}
            maxLength={500}
            required
            placeholder="A rainy afternoon, a warm coffee, and a few hours to focus…"
          />
        </label>
        <div className="prompt-chips">
          {[
            "Deep focus for coding",
            "A slow Sunday morning",
            "Energy for a workout",
          ].map((text) => (
            <button type="button" key={text} onClick={() => setPrompt(text)}>
              {text}
            </button>
          ))}
        </div>
        <p className="privacy-note">
          With AI enabled, your prompt and the demo catalog are sent to OpenAI.
          Account details and listening history stay here.
        </p>
        <button
          className="button full"
          disabled={generate.isPending || save.isPending}
        >
          <Sparkles size={17} />
          {generate.isPending ? "Finding your sound…" : "Make my mix"}
        </button>
      </form>
      {generate.error && (
        <p className="form-error" role="alert">
          {generate.error.message}
        </p>
      )}
      {mix && (
        <div className="mix-preview">
          <span className="eyebrow">
            {mix.source === "ai"
              ? "AI-CURATED · CATALOG VERIFIED"
              : mix.source === "local_fallback"
                ? "AI UNAVAILABLE · LOCAL MOOD MIX"
                : "LOCAL MOOD MIX · NO AI REQUIRED"}
          </span>
          <h3>{mix.name}</h3>
          <p>{mix.description}</p>
          <ol>
            {mix.songIds.map((id) => (
              <li key={id}>{songs.find((song) => song.id === id)?.title}</li>
            ))}
          </ol>
          <div className="prompt-chips" aria-label="Adjust mix">
            {(
              [
                ["calmer", "Calmer"],
                ["energetic", "More energetic"],
                ["familiar", "More familiar"],
                ["adventurous", "More adventurous"],
              ] as [MixAdjustment, string][]
            ).map(([adjustment, label]) => (
              <button
                type="button"
                key={adjustment}
                disabled={
                  generate.isPending || save.isPending || feedback.isPending
                }
                onClick={() =>
                  generate.mutate({
                    prompt: previewPrompt,
                    adjustment,
                    previousSongIds: mix.songIds,
                  })
                }
              >
                {label}
              </button>
            ))}
          </div>
          <p className="privacy-note">
            Familiar and adventurous compare tracks with this preview, not your
            listening history.
          </p>
          <div className="mix-actions">
            <button
              className="button secondary"
              onClick={() => onPlay(mix.songIds)}
            >
              <Play size={16} /> Preview
            </button>
            <button
              className="button"
              disabled={save.isPending || generate.isPending || !!save.data}
              onClick={() => save.mutate(mix)}
            >
              <Plus size={16} />
              {save.isPending
                ? "Saving…"
                : save.data
                  ? "Saved"
                  : "Save playlist"}
            </button>
          </div>
          {save.data && !feedback.isSuccess && (
            <div className="mix-feedback">
              <span>Does this mix fit the moment?</span>
              <button
                className="button secondary compact"
                disabled={feedback.isPending}
                onClick={() =>
                  feedback.mutate({ id: save.data.id, rating: "fits" })
                }
              >
                Fits
              </button>
              <button
                className="button secondary compact"
                disabled={feedback.isPending}
                onClick={() =>
                  feedback.mutate({ id: save.data.id, rating: "not_quite" })
                }
              >
                Not quite
              </button>
            </div>
          )}
          {feedback.isSuccess && (
            <p className="privacy-note" role="status">
              Thanks. Your rating was saved without storing the original prompt.
            </p>
          )}
          {save.error && (
            <p className="form-error" role="alert">
              {save.error.message}
            </p>
          )}
          {feedback.error && (
            <p className="form-error" role="alert">
              {feedback.error.message}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
