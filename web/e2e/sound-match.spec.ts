import { expect, test } from "@playwright/test";

test("record a sound, synthesize an approximation, and save the original", async ({
	page,
}) => {
	const wav = Buffer.alloc(44 + 8000 * 2);
	wav.write("RIFF", 0);
	wav.writeUInt32LE(wav.length - 8, 4);
	wav.write("WAVEfmt ", 8);
	wav.writeUInt32LE(16, 16);
	wav.writeUInt16LE(1, 20);
	wav.writeUInt16LE(1, 22);
	wav.writeUInt32LE(8000, 24);
	wav.writeUInt32LE(16000, 28);
	wav.writeUInt16LE(2, 32);
	wav.writeUInt16LE(16, 34);
	wav.write("data", 36);
	wav.writeUInt32LE(16000, 40);
	for (let i = 0; i < 8000; i++)
		wav.writeInt16LE(
			Math.round(
				12000 * Math.exp(-i / 2000) * Math.sin((2 * Math.PI * 440 * i) / 8000),
			),
			44 + i * 2,
		);
	await page.addInitScript((bytes) => {
		Object.defineProperty(navigator, "mediaDevices", {
			value: {
				getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }),
			},
		});
		Object.defineProperty(window, "MediaRecorder", {
			value: class {
				state = "inactive";
				mimeType = "audio/wav";
				ondataavailable?: (event: { data: Blob }) => void;
				onstop?: () => void;
				start() {
					this.state = "recording";
				}
				stop() {
					this.state = "inactive";
					this.ondataavailable?.({
						data: new Blob([new Uint8Array(bytes)], { type: "audio/wav" }),
					});
					this.onstop?.();
				}
			},
		});
	}, Array.from(wav));
	await page.goto("/");
	await page.getByRole("button", { name: "Record sound" }).click();
	await expect(
		page.getByRole("button", { name: "Stop recording" }),
	).toBeEnabled();
	await page.getByRole("button", { name: "Stop recording" }).click();
	await expect(page.getByLabel("Original recording")).toBeVisible();
	await expect(
		page.getByRole("heading", { name: "Cut and shape your sound." }),
	).toBeVisible();
	await page.getByRole("button", { name: "Analyze sound" }).click();
	await expect(page.getByText(/Approximation ready/)).toBeVisible();
	await page.getByRole("button", { name: "Play approximation" }).click();
	await expect(
		page.getByRole("button", { name: "Add original to album" }),
	).toBeEnabled({ timeout: 5000 });
	await page.getByRole("button", { name: "Add original to album" }).click();
	await expect(page.getByText("Recording added to this album.")).toBeVisible();
	await expect(
		page.getByRole("button", { name: /Play Recording/ }),
	).toBeVisible();
});
