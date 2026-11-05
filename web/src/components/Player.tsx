import {
  ListMusic,
  Pause,
  Play,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState } from "react";
import type { PlayerState } from "../hooks/usePlayer";
import { formatTime } from "../lib/queue";

export function Player({ player }: { player: PlayerState }) {
  const [showQueue, setShowQueue] = useState(false);
  return (
    <>
      {showQueue && (
        <aside className="queue-panel" aria-label="Playback queue">
          <div className="section-heading">
            <h2>Up next</h2>
            <button onClick={() => setShowQueue(false)}>Close</button>
          </div>
          {player.queue.length === 0 && <p>Play a song to start your queue.</p>}
          {player.queue.map((song, index) => (
            <button
              className={
                index === player.index ? "queue-item active" : "queue-item"
              }
              key={song.id}
              onClick={() => player.play(player.queue, index)}
            >
              <img src={song.artwork} alt="" />
              <span>
                {song.title}
                <small>{song.artist}</small>
              </span>
              {index === player.index && <span>Playing</span>}
            </button>
          ))}
        </aside>
      )}
      <footer className="player" aria-label="Music player">
        <div className="player-track">
          {player.track ? (
            <>
              <img src={player.track.artwork} alt="" />
              <div>
                <strong>{player.track.title}</strong>
                <span>{player.track.artist}</span>
              </div>
            </>
          ) : (
            <>
              <div className="empty-art">
                <ListMusic size={24} />
              </div>
              <div>
                <strong>A little quiet in here</strong>
                <span>Choose a song to get started</span>
              </div>
            </>
          )}
        </div>
        <div className="player-center">
          <div className="player-buttons">
            <button
              className={player.shuffle ? "icon active" : "icon"}
              aria-label="Shuffle"
              aria-pressed={player.shuffle}
              onClick={player.toggleShuffle}
            >
              <Shuffle size={17} />
            </button>
            <button
              className="icon"
              aria-label="Previous track"
              disabled={!player.track}
              onClick={player.previous}
            >
              <SkipBack size={19} />
            </button>
            <button
              className="play-button"
              aria-label={player.playing ? "Pause" : "Play"}
              disabled={!player.track}
              onClick={player.toggle}
            >
              {player.playing ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" />
              )}
            </button>
            <button
              className="icon"
              aria-label="Next track"
              disabled={!player.track}
              onClick={player.next}
            >
              <SkipForward size={19} />
            </button>
            <button
              className={player.repeat ? "icon active" : "icon"}
              aria-label="Repeat track"
              aria-pressed={player.repeat}
              onClick={player.toggleRepeat}
            >
              <Repeat1 size={18} />
            </button>
          </div>
          <div className="seek">
            <time>{formatTime(player.progress)}</time>
            <input
              aria-label="Seek"
              type="range"
              min="0"
              max={player.duration || 1}
              step="0.1"
              value={Math.min(player.progress, player.duration || 1)}
              disabled={!player.duration}
              onChange={(event) => player.seek(Number(event.target.value))}
            />
            <time>
              {formatTime(player.duration || player.track?.duration || 0)}
            </time>
          </div>
          {player.error && (
            <span className="player-error" role="alert">
              {player.error}
            </span>
          )}
        </div>
        <div className="player-right">
          <button
            className={showQueue ? "icon active" : "icon"}
            aria-label="Show queue"
            aria-expanded={showQueue}
            onClick={() => setShowQueue(!showQueue)}
          >
            <ListMusic size={20} />
          </button>
          <button
            className="icon volume-toggle"
            aria-label={player.volume ? "Mute" : "Unmute"}
            onClick={() => player.changeVolume(player.volume ? 0 : 0.7)}
          >
            {player.volume ? <Volume2 size={19} /> : <VolumeX size={19} />}
          </button>
          <input
            aria-label="Volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={player.volume}
            onChange={(event) =>
              player.changeVolume(Number(event.target.value))
            }
          />
        </div>
      </footer>
    </>
  );
}
