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
describe("audio player", () => {
  let audio: FakeAudio;
  beforeEach(() => {
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
});
