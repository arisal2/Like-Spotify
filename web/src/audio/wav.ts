type PCMBuffer = Pick<
  AudioBuffer,
  "numberOfChannels" | "length" | "sampleRate" | "getChannelData"
>;

export function encodeWav(buffer: PCMBuffer): Blob {
  const bytesPerSample = 2;
  const dataSize = buffer.length * buffer.numberOfChannels * bytesPerSample;
  const output = new ArrayBuffer(44 + dataSize);
  const view = new DataView(output);

  writeText(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeText(view, 8, "WAVE");
  writeText(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, buffer.numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(
    28,
    buffer.sampleRate * buffer.numberOfChannels * bytesPerSample,
    true,
  );
  view.setUint16(32, buffer.numberOfChannels * bytesPerSample, true);
  view.setUint16(34, 16, true);
  writeText(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let frame = 0; frame < buffer.length; frame += 1) {
    for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
      const sample = Math.max(
        -1,
        Math.min(1, buffer.getChannelData(channel)[frame]),
      );
      view.setInt16(
        offset,
        sample < 0 ? sample * 0x8000 : sample * 0x7fff,
        true,
      );
      offset += bytesPerSample;
    }
  }

  return new Blob([output], { type: "audio/wav" });
}

function writeText(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
