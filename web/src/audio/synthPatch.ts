import { z } from "zod";
export const synthWaveformSchema = z.enum([
	"sine",
	"triangle",
	"square",
	"sawtooth",
	"harmonics",
]);

export const synthPatchSchema = z.object({
	version: z.literal(1),
	waveform: synthWaveformSchema,
	waveform2: synthWaveformSchema.default("sine"),
	oscMix: z.number().finite().min(0).max(1).default(0),
	detune: z.number().finite().min(-1200).max(1200).default(0),
	harmonic2: z.number().finite().min(0).max(1).default(0.5),
	harmonic3: z.number().finite().min(0).max(1).default(0.25),
	cutoff: z.number().finite().min(100).max(10000),
	resonance: z.number().finite().min(0).max(12).default(0),
	attack: z.number().finite().min(0.01).max(1),
	decay: z.number().finite().min(0.01).max(2).default(0.1),
	sustain: z.number().finite().min(0).max(1).default(1),
	release: z.number().finite().min(0.03).max(2),
	lfoRate: z.number().finite().min(0.1).max(20).default(4),
	lfoDepth: z.number().finite().min(0).max(1).default(0),
	drive: z.number().finite().min(0).max(1).default(0),
	volume: z.number().finite().min(0).max(0.25),
});
export type SynthPatch = z.infer<typeof synthPatchSchema>;
export const defaultSynthPatch: SynthPatch = {
	version: 1,
	waveform: "triangle",
	waveform2: "sine",
	oscMix: 0,
	detune: 0,
	harmonic2: 0.5,
	harmonic3: 0.25,
	cutoff: 3000,
	resonance: 0,
	attack: 0.03,
	decay: 0.1,
	sustain: 1,
	release: 0.2,
	lfoRate: 4,
	lfoDepth: 0,
	drive: 0,
	volume: 0.12,
};
export const synthStorageKey = "bedlam.synth.patch.v1";
export function readSynthPatch(storage: Pick<Storage, "getItem">): SynthPatch {
	try {
		const raw = storage.getItem(synthStorageKey);
		return raw
			? synthPatchSchema.parse(JSON.parse(raw))
			: { ...defaultSynthPatch };
	} catch {
		return { ...defaultSynthPatch };
	}
}
