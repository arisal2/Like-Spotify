import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayer } from "./usePlayer";
import type { Song } from "../lib/api";

class FakeAudio extends EventTarget {
  src = "";
  preload = "";
  volume = 1;
  currentTime = 0;
  duration = 200;
  paused = true;
  load = vi.fn();
  play = vi.fn(async () => {
    this.paused = false;
    this.dispatchEvent(new Event("play"));
  });
  pause = vi.fn(() => {
    this.paused = true;
    this.dispatchEvent(new Event("pause"));
  });
  removeAttribute = vi.fn();
}
const songs: Song[] = [1, 2, 3].map((id) => ({
  id,
  title: `Song ${id}`,
  artist: "Bensound",
  album: "Demo",
  albumId: 1,
  duration: 200,
  audio: `/song${id}.mp3`,
  artwork: "",
  tags: [],
}));
class FakeStorage {
  private values = new Map<string, string>();
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  clear() {
    this.values.clear();
  }
}
describe("audio player", () => {
  let audio: FakeAudio;
  beforeEach(() => {
    vi.stubGlobal("localStorage", new FakeStorage());
    audio = new FakeAudio();
    vi.stubGlobal(
      "Audio",
      vi.fn(function () {
        return audio;
      }),
    );
  });
  afterEach(() => vi.unstubAllGlobals());
  it("keeps the current track when shuffle changes and uses the shuffled queue for previous", async () => {
    const { result } = renderHook(usePlayer);
    act(() => result.current.play(songs, 1));
    await waitFor(() => expect(result.current.playing).toBe(true));
    act(() => result.current.toggleShuffle());
    expect(result.current.track?.id).toBe(2);
    const first = result.current.track?.id;
    act(() => result.current.next());
    expect(result.current.index).toBe(1);
    act(() => {
      audio.currentTime = 1;
      result.current.previous();
    });
    expect(result.current.track?.id).toBe(first);
    act(() => result.current.toggleShuffle());
    expect(result.current.track?.id).toBe(2);
    expect(result.current.queue.map((song) => song.id)).toEqual([1, 2, 3]);
  });
  it("advances on ended, repeats explicitly, and stops at the end of the queue", () => {
    const { result } = renderHook(usePlayer);
    act(() => result.current.play(songs));
    act(() => audio.dispatchEvent(new Event("ended")));
    expect(result.current.track?.id).toBe(2);
    act(() => result.current.toggleRepeat());
    act(() => {
      audio.currentTime = 200;
      audio.dispatchEvent(new Event("ended"));
    });
    expect(result.current.track?.id).toBe(2);
    expect(audio.currentTime).toBe(0);
    act(() => result.current.toggleRepeat());
    act(() => result.current.next());
    act(() => audio.dispatchEvent(new Event("ended")));
    expect(result.current.playing).toBe(false);
    expect(result.current.track?.id).toBe(3);
  });
  it("handles unavailable media without reporting playback as active", () => {
    const { result } = renderHook(usePlayer);
    act(() => result.current.play(songs));
    act(() => audio.dispatchEvent(new Event("error")));
    expect(result.current.error).toContain("unavailable");
    expect(result.current.playing).toBe(false);
  });
  it("restores a validated queue without autoplaying", async () => {
    localStorage.setItem(
      "like.playback.v1.user.7",
      JSON.stringify({
        queueIDs: [2, 999, 1],
        originalIDs: [1, 2, 999],
        trackID: 2,
        progress: 42,
        volume: 0.4,
        shuffle: true,
        repeat: true,
      }),
    );
    const { result } = renderHook(() => usePlayer(songs, "user.7"));
    await waitFor(() => expect(result.current.track?.id).toBe(2));
    expect(result.current.queue.map((song) => song.id)).toEqual([2, 1]);
    expect(result.current.progress).toBe(42);
    expect(result.current.volume).toBe(0.4);
    expect(result.current.shuffle).toBe(true);
    expect(result.current.repeat).toBe(true);
    expect(result.current.playing).toBe(false);
    expect(audio.play).not.toHaveBeenCalled();
  });
  it("separates playback state by signed-in user", async () => {
    localStorage.setItem(
      "like.playback.v1.user.1",
      JSON.stringify({
        queueIDs: [1],
        originalIDs: [1],
        trackID: 1,
        progress: 12,
        volume: 0.7,
        shuffle: false,
        repeat: false,
      }),
    );
    const { result, rerender } = renderHook(
      ({ owner }) => usePlayer(songs, owner),
      { initialProps: { owner: "user.1" } },
    );
    await waitFor(() => expect(result.current.track?.id).toBe(1));
    rerender({ owner: "user.2" });
    await waitFor(() => expect(result.current.track).toBeUndefined());
    expect(result.current.queue).toEqual([]);
    expect(result.current.playing).toBe(false);
  });
  it("persists queue and settings when playback time has not changed", async () => {
    const { result } = renderHook(() => usePlayer(songs, "user.3"));
    await waitFor(() => expect(result.current.queue).toEqual([]));
    act(() => result.current.play(songs, 1));
    act(() => {
      result.current.toggleRepeat();
      result.current.changeVolume(0.25);
    });
    await waitFor(() => {
      const saved = JSON.parse(
        localStorage.getItem("like.playback.v1.user.3") ?? "null",
      );
      expect(saved).toMatchObject({
        queueIDs: [1, 2, 3],
        trackID: 2,
        volume: 0.25,
        repeat: true,
      });
    });
  });
});
