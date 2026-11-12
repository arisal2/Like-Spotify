import { z } from "zod";
import { waveformSchema } from "./patch";

export const synthPatchSchema = z.object({
	version: z.literal(1),
	waveform: waveformSchema,
	cutoff: z.number().finite().min(100).max(10000),
	attack: z.number().finite().min(0.01).max(1),
	release: z.number().finite().min(0.03).max(2),
	volume: z.number().finite().min(0).max(0.25),
});
export type SynthPatch = z.infer<typeof synthPatchSchema>;
export const defaultSynthPatch: SynthPatch = {
	version: 1,
	waveform: "triangle",
	cutoff: 3000,
	attack: 0.03,
	release: 0.2,
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
