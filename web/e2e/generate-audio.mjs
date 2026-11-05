// Generate a deterministic PCM tone for browser tests without shipping music.
import { writeFileSync } from "node:fs";
import { Buffer } from "node:buffer";
import process from "node:process";

const destination = process.argv[2];
if (!destination) throw new Error("Provide the output WAV path");

const sampleRate = 16_000;
const samples = sampleRate * 30;
const bytesPerSample = 2;
const dataSize = samples * bytesPerSample;
const wave = Buffer.alloc(44 + dataSize);
wave.write("RIFF", 0);
wave.writeUInt32LE(36 + dataSize, 4);
wave.write("WAVEfmt ", 8);
wave.writeUInt32LE(16, 16);
wave.writeUInt16LE(1, 20);
wave.writeUInt16LE(1, 22);
wave.writeUInt32LE(sampleRate, 24);
wave.writeUInt32LE(sampleRate * bytesPerSample, 28);
wave.writeUInt16LE(bytesPerSample, 32);
wave.writeUInt16LE(16, 34);
wave.write("data", 36);
wave.writeUInt32LE(dataSize, 40);
for (let i = 0; i < samples; i++) {
  wave.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 3000), 44 + i * bytesPerSample);
}
writeFileSync(destination, wave);
