import { useCallback, useEffect, useRef, useState } from "react";
import type { Song } from "../lib/api";
import { shuffled } from "../lib/queue";

const storagePrefix = "like.playback.v1.";

type StoredPlayback = {
  queueIDs: number[];
  originalIDs: number[];
  trackID: number;
  progress: number;
  volume: number;
  shuffle: boolean;
  repeat: boolean;
};

function readStored(owner: string): StoredPlayback | null {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(storagePrefix + owner) ?? "null",
    );
    if (!value || typeof value !== "object") return null;
    const state = value as Partial<StoredPlayback>;
    if (
      !Array.isArray(state.queueIDs) ||
      !state.queueIDs.every(Number.isSafeInteger) ||
      !Array.isArray(state.originalIDs) ||
      !state.originalIDs.every(Number.isSafeInteger) ||
      !Number.isSafeInteger(state.trackID) ||
      typeof state.progress !== "number" ||
      !Number.isFinite(state.progress) ||
      typeof state.volume !== "number" ||
      !Number.isFinite(state.volume) ||
      typeof state.shuffle !== "boolean" ||
      typeof state.repeat !== "boolean"
    )
      return null;
    return state as StoredPlayback;
  } catch {
    return null;
  }
}

export function usePlayer(
  catalog: Song[] = [],
  owner: string | null = "guest",
) {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<Song[]>([]);
  const original = useRef<Song[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState("");
  const activeOwner = useRef<string | null>(null);
  const hydrated = useRef(false);
  const pendingSeek = useRef(0);
  const autoPlayNextTrack = useRef(false);
  const lastStoredSecond = useRef(-1);
  const lastStoredSettings = useRef("");
  const track = queue[index];
  const playAudio = useCallback(() => {
    const element = audio.current;
    if (!element) return;
    void element.play().catch((reason: unknown) => {
      if (reason instanceof DOMException && reason.name === "AbortError")
        return;
      setError("Playback could not start. Try pressing play again.");
      setPlaying(false);
    });
  }, []);
  useEffect(() => {
    const element = new Audio();
    element.preload = "metadata";
    element.volume = 0.7;
    audio.current = element;
    const time = () => setProgress(element.currentTime);
    const loaded = () => {
      const mediaDuration = Number.isFinite(element.duration)
        ? element.duration
        : 0;
      setDuration(mediaDuration);
      if (pendingSeek.current > 0 && mediaDuration > 0) {
        element.currentTime = Math.min(
          pendingSeek.current,
          Math.max(0, mediaDuration - 1),
        );
        setProgress(element.currentTime);
        pendingSeek.current = 0;
      }
    };
    const play = () => setPlaying(true);
    const pause = () => setPlaying(false);
    const failed = () => {
      setError("This track is unavailable. Try another song.");
      setPlaying(false);
    };
    element.addEventListener("timeupdate", time);
    element.addEventListener("loadedmetadata", loaded);
    element.addEventListener("play", play);
    element.addEventListener("pause", pause);
    element.addEventListener("error", failed);
    return () => {
      element.pause();
      element.removeAttribute("src");
      element.load();
      audio.current = null;
    };
  }, []);
  useEffect(() => {
    if (!track || !audio.current) return;
    audio.current.src = track.audio;
    audio.current.load();
    if (autoPlayNextTrack.current) playAudio();
    autoPlayNextTrack.current = false;
  }, [track, playAudio]);
  useEffect(() => {
    if (!owner || !catalog.length || activeOwner.current === owner) return;
    audio.current?.pause();
    const saved = readStored(owner);
    const byID = new Map(catalog.map((song) => [song.id, song]));
    const restoredQueue =
      saved?.queueIDs.flatMap((id) => byID.get(id) ?? []) ?? [];
    const restoredOriginal =
      saved?.originalIDs.flatMap((id) => byID.get(id) ?? []) ?? [];
    const restoredIndex = saved
      ? restoredQueue.findIndex((song) => song.id === saved.trackID)
      : -1;
    activeOwner.current = owner;
    hydrated.current = true;
    autoPlayNextTrack.current = false;
    lastStoredSecond.current = -1;
    lastStoredSettings.current = "";
    setQueue(restoredQueue);
    original.current = restoredOriginal.length
      ? restoredOriginal
      : restoredQueue;
    setIndex(restoredIndex >= 0 ? restoredIndex : 0);
    setPlaying(false);
    setShuffle(saved?.shuffle ?? false);
    setRepeat(saved?.repeat ?? false);
    setProgress(Math.max(0, saved?.progress ?? 0));
    pendingSeek.current = Math.max(0, saved?.progress ?? 0);
    const restoredVolume = Math.min(1, Math.max(0, saved?.volume ?? 0.7));
    setVolume(restoredVolume);
    if (audio.current) audio.current.volume = restoredVolume;
    setError("");
  }, [catalog, owner]);
  useEffect(() => {
    if (!owner || activeOwner.current !== owner || !hydrated.current) return;
    const second = Math.floor(progress);
    const settings = JSON.stringify({
      queueIDs: queue.map((song) => song.id),
      originalIDs: original.current.map((song) => song.id),
      trackID: track?.id,
      volume,
      shuffle,
      repeat,
    });
    if (
      second === lastStoredSecond.current &&
      settings === lastStoredSettings.current &&
      queue.length
    )
      return;
    lastStoredSecond.current = second;
    lastStoredSettings.current = settings;
    if (!queue.length) {
      localStorage.removeItem(storagePrefix + owner);
      return;
    }
    const value: StoredPlayback = {
      queueIDs: queue.map((song) => song.id),
      originalIDs: original.current.map((song) => song.id),
      trackID: track?.id ?? queue[0].id,
      progress: Math.max(0, progress),
      volume,
      shuffle,
      repeat,
    };
    try {
      localStorage.setItem(storagePrefix + owner, JSON.stringify(value));
    } catch {
      // Playback remains functional when storage is disabled or full.
    }
  }, [owner, progress, queue, repeat, shuffle, track, volume]);
  const next = useCallback(() => {
    if (!queue.length) return;
    if (index === queue.length - 1) {
      audio.current?.pause();
      if (audio.current) audio.current.currentTime = 0;
      setPlaying(false);
    } else {
      autoPlayNextTrack.current = true;
      setProgress(0);
      setDuration(0);
      setIndex((value) => value + 1);
    }
  }, [index, queue.length]);
  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    const ended = () => {
      if (repeat) {
        element.currentTime = 0;
        playAudio();
      } else next();
    };
    element.addEventListener("ended", ended);
    return () => element.removeEventListener("ended", ended);
  }, [repeat, next, playAudio]);
  const play = (songs: Song[], selected = 0) => {
    if (!songs.length || !songs[selected]) return;
    setError("");
    setProgress(0);
    setDuration(0);
    original.current = [...songs];
    autoPlayNextTrack.current = true;
    const ordered = shuffle
      ? [songs[selected], ...shuffled(songs.filter((_, i) => i !== selected))]
      : [...songs];
    setQueue(ordered);
    setIndex(shuffle ? 0 : selected);
    if (track?.id === songs[selected].id) {
      if (audio.current) audio.current.currentTime = 0;
      playAudio();
    }
  };
  const toggleShuffle = () => {
    const enabled = !shuffle;
    setShuffle(enabled);
    if (!track) return;
    const ordered = enabled
      ? [
          track,
          ...shuffled(original.current.filter((song) => song.id !== track.id)),
        ]
      : [...original.current];
    setQueue(ordered);
    setIndex(ordered.findIndex((song) => song.id === track.id));
  };
  const toggle = () => {
    setError("");
    if (audio.current?.paused) playAudio();
    else audio.current?.pause();
  };
  const previous = () => {
    if (!audio.current) return;
    if (audio.current.currentTime > 3 || index === 0) {
      audio.current.currentTime = 0;
      playAudio();
    } else {
      autoPlayNextTrack.current = true;
      setProgress(0);
      setDuration(0);
      setIndex((value) => value - 1);
    }
  };
  const seek = (value: number) => {
    if (audio.current && duration > 0) {
      audio.current.currentTime = value;
      setProgress(value);
    }
  };
  const changeVolume = (value: number) => {
    setVolume(value);
    if (audio.current) audio.current.volume = value;
  };
  return {
    queue,
    index,
    track,
    playing,
    shuffle,
    repeat,
    progress,
    duration,
    volume,
    error,
    play,
    next,
    previous,
    toggle,
    toggleShuffle,
    toggleRepeat: () => setRepeat((value) => !value),
    seek,
    changeVolume,
  };
}
export type PlayerState = ReturnType<typeof usePlayer>;
