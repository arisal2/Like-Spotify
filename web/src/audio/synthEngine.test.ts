import { describe, expect, it } from "vitest";
import { distortionCurve } from "./synthEngine";

describe("synth shaping", () => {
	it("keeps the no-drive curve linear and bounded", () => {
		const curve = distortionCurve(0);
		expect(curve[0]).toBe(-1);
		expect(curve[curve.length - 1]).toBe(1);
		expect(curve[1535]).toBeCloseTo(0.5, 2);
	});
	it("adds drive without exceeding the output range", () => {
		const curve = distortionCurve(0.8);
		expect(curve[1535]).toBeGreaterThan(0.9);
		expect(Math.max(...curve)).toBeLessThanOrEqual(1);
		expect(Math.min(...curve)).toBeGreaterThanOrEqual(-1);
	});
});
