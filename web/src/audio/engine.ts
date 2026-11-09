import { soundPatchSchema, type SoundPatch } from "./patch";

const SAMPLE_RATE = 44_100;
let liveContext: AudioContext | undefined;

function schedulePatch(
  context: BaseAudioContext,
  destination: AudioNode,
  input: SoundPatch,
  startAt: number,
) {
  const patch = soundPatchSchema.parse(input);
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const endAt = startAt + patch.duration;
  const releaseAt = endAt - patch.release;

  oscillator.type = patch.waveform;
  oscillator.frequency.setValueAtTime(patch.startFrequency, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(patch.endFrequency, endAt);

  envelope.gain.setValueAtTime(0, startAt);
  envelope.gain.linearRampToValueAtTime(patch.gain, startAt + patch.attack);
  envelope.gain.setValueAtTime(patch.gain, releaseAt);
  envelope.gain.linearRampToValueAtTime(0, endAt);

  oscillator.connect(envelope);
  envelope.connect(destination);
  oscillator.start(startAt);
  oscillator.stop(endAt);
}

export async function previewPatch(patch: SoundPatch) {
  liveContext ??= new AudioContext({ sampleRate: SAMPLE_RATE });
  if (liveContext.state === "suspended") await liveContext.resume();
  schedulePatch(
    liveContext,
    liveContext.destination,
    patch,
    liveContext.currentTime,
  );
}

export async function renderPatch(patch: SoundPatch): Promise<AudioBuffer> {
  const validPatch = soundPatchSchema.parse(patch);
  const frameCount = Math.ceil(validPatch.duration * SAMPLE_RATE);
  const context = new OfflineAudioContext(1, frameCount, SAMPLE_RATE);
  schedulePatch(context, context.destination, validPatch, 0);
  return context.startRendering();
}
