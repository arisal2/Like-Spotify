import { describe, expect, it } from "vitest";
import { analyzeSound } from "./soundMatch";

describe("sound matching", () => {
	it("identifies the strongest frequencies of a generated decaying tap", () => {
		const sampleRate = 44100;
		const samples = Float32Array.from(
			{ length: sampleRate },
			(_, i) =>
				Math.exp(-i / 4000) *
				(0.7 * Math.sin((2 * Math.PI * 440 * i) / sampleRate) +
					0.3 * Math.sin((2 * Math.PI * 880 * i) / sampleRate)),
		);
		const result = analyzeSound(samples, sampleRate);
		expect(Math.abs(result.partials[0].frequency - 440)).toBeLessThan(25);
		expect(
			result.partials.some((part) => Math.abs(part.frequency - 880) < 25),
		).toBe(true);
		expect(
			result.partials.reduce((sum, part) => sum + part.strength, 0),
		).toBeCloseTo(1);
		expect(result.duration).toBeGreaterThan(0.08);
		expect(result.duration).toBeLessThanOrEqual(2);
	});
	it("rejects silence and very short recordings", () => {
		expect(() => analyzeSound(new Float32Array(4096), 44100)).toThrow(/quiet/);
		expect(() => analyzeSound(new Float32Array(10), 44100)).toThrow(/short/);
	});
});
