import { useCallback, useEffect, useRef, useState } from "react";
import type { Song } from "../lib/api";
import { shuffled } from "../lib/queue";

export function usePlayer() {
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
    const loaded = () =>
      setDuration(Number.isFinite(element.duration) ? element.duration : 0);
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
    playAudio();
  }, [track, playAudio]);
  const next = useCallback(() => {
    if (!queue.length) return;
    if (index === queue.length - 1) {
      audio.current?.pause();
      if (audio.current) audio.current.currentTime = 0;
      setPlaying(false);
    } else setIndex((value) => value + 1);
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
    } else setIndex((value) => value - 1);
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
