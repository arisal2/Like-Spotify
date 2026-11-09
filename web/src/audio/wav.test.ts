import { describe, expect, it } from "vitest";
import { encodeWav } from "./wav";

describe("encodeWav", () => {
  it("writes deterministic mono 16-bit PCM with a valid WAV header", async () => {
    const samples = new Float32Array([-1, -0.5, 0, 0.5, 1]);
    const wav = encodeWav({
      numberOfChannels: 1,
      length: samples.length,
      sampleRate: 44_100,
      getChannelData: () => samples,
    });
    const view = new DataView(await wav.arrayBuffer());

    expect(wav.type).toBe("audio/wav");
    expect(wav.size).toBe(44 + samples.length * 2);
    expect(readText(view, 0, 4)).toBe("RIFF");
    expect(readText(view, 8, 4)).toBe("WAVE");
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(44_100);
    expect(view.getUint16(34, true)).toBe(16);
    expect(readText(view, 36, 4)).toBe("data");
    expect(view.getInt16(44, true)).toBe(-32_768);
    expect(view.getInt16(52, true)).toBe(32_767);
  });
});

function readText(view: DataView, offset: number, length: number) {
  return String.fromCharCode(
    ...Array.from({ length }, (_, index) => view.getUint8(offset + index)),
  );
}
