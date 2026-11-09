import { z } from "zod";

export const waveformSchema = z.enum([
  "sine",
  "square",
  "sawtooth",
  "triangle",
]);

export const soundPatchSchema = z
  .object({
    version: z.literal(1),
    seed: z.number().int().min(0).max(0xffffffff),
    waveform: waveformSchema,
    startFrequency: z.number().min(40).max(4000),
    endFrequency: z.number().min(40).max(4000),
    duration: z.number().min(0.05).max(5),
    attack: z.number().min(0.001).max(1),
    release: z.number().min(0.001).max(2),
    gain: z.number().min(0).max(0.8),
  })
  .refine((patch) => patch.attack + patch.release <= patch.duration, {
    message: "Attack and release must fit inside the sound duration",
    path: ["release"],
  });

export type SoundPatch = z.infer<typeof soundPatchSchema>;

export const retroCoinPatch: SoundPatch = {
  version: 1,
  seed: 1986,
  waveform: "square",
  startFrequency: 660,
  endFrequency: 1320,
  duration: 0.28,
  attack: 0.008,
  release: 0.12,
  gain: 0.24,
};
