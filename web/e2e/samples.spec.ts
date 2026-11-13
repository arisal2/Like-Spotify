import { expect, test } from "@playwright/test";

function silentWav() {
	const data = Buffer.alloc(44 + 1600);
	data.write("RIFF", 0);
	data.writeUInt32LE(data.length - 8, 4);
	data.write("WAVEfmt ", 8);
	data.writeUInt32LE(16, 16);
	data.writeUInt16LE(1, 20);
	data.writeUInt16LE(1, 22);
	data.writeUInt32LE(8000, 24);
	data.writeUInt32LE(16000, 28);
	data.writeUInt16LE(2, 32);
	data.writeUInt16LE(16, 34);
	data.write("data", 36);
	data.writeUInt32LE(1600, 40);
	return data;
}

function halfToneWav() {
	const data = silentWav();
	for (let index = 0; index < 400; index++)
		data.writeInt16LE(
			Math.round(24000 * Math.sin((2 * Math.PI * 440 * index) / 8000)),
			44 + index * 2,
		);
	return data;
}

test("import samples, mix, and restore an album", async ({ page }) => {
	await page.goto("/");
	await page.getByLabel("New album name").fill("Game sounds");
	await page.getByRole("button", { name: "Create", exact: true }).click();
	await page.locator('input[type="file"]').setInputFiles([
		{ name: "kick.wav", mimeType: "audio/wav", buffer: silentWav() },
		{ name: "snare.wav", mimeType: "audio/wav", buffer: silentWav() },
	]);
	await expect(page.getByText("kick.wav", { exact: true })).toBeVisible();
	await expect(page.getByText("snare.wav", { exact: true })).toBeVisible();
	await page.getByRole("button", { name: "Edit kick.wav" }).click();
	await expect(
		page.getByRole("heading", { name: "Cut and shape your sound." }),
	).toBeVisible();
	await page.getByText("Precise trim").click();
	await page.getByLabel("End (seconds)").fill("0.05");
	await page.getByLabel("Sample name").fill("Short kick");
	await page.getByRole("slider", { name: /Speed/ }).fill("0.5");
	await page.getByRole("button", { name: "Preview edit" }).click();
	await expect(page.getByLabel("Edited sample preview")).toBeVisible();
	await expect
		.poll(async () =>
			page
				.getByLabel("Edited sample preview")
				.evaluate((element) => (element as HTMLAudioElement).duration),
		)
		.toBeCloseTo(0.1, 2);
	await page.getByRole("button", { name: "Save edited copy" }).click();
	await expect(page.getByText("Short kick.wav", { exact: true })).toBeVisible();
	await page.getByLabel("Theme").selectOption("cyberpunk");
	await page.getByRole("slider", { name: "Volume for kick.wav" }).fill("0.5");
	await page.getByRole("button", { name: "▶ Play mix" }).click();
	await expect(page.getByText(/Playing samples together/)).toBeVisible();
	await page.getByRole("button", { name: "■ Stop", exact: true }).click();
	await page.reload();
	await expect(page.getByLabel("Theme")).toHaveValue("cyberpunk");
	await page.getByRole("button", { name: "Game sounds" }).click();
	await expect(page.getByText("kick.wav", { exact: true })).toBeVisible();
	await expect(page.getByText("Short kick.wav", { exact: true })).toBeVisible();
	await expect(
		page.getByRole("slider", { name: "Volume for kick.wav" }),
	).toHaveValue("0.5");
});

test("drag waveform handles, preview the cut, and drop another file", async ({
	page,
}) => {
	await page.goto("/");
	await page.locator('input[type="file"]').setInputFiles({
		name: "tap.wav",
		mimeType: "audio/wav",
		buffer: halfToneWav(),
	});
	await page.getByRole("button", { name: "Edit tap.wav" }).click();
	const timeline = page.getByLabel("Audio waveform timeline");
	const start = page.getByRole("slider", { name: "Trim start" });
	const end = page.getByRole("slider", { name: "Trim end" });
	await expect(start).toBeVisible();
	await expect
		.poll(async () =>
			timeline.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
				const context = canvas.getContext("2d");
				if (!context) return false;
				const { width, height } = canvas;
				const pixels = context.getImageData(0, 0, width, height).data;
				let left = 0;
				let right = 0;
				for (let y = 0; y < height; y++)
					for (let x = 0; x < width; x++) {
						if (pixels[(y * width + x) * 4 + 3] === 0) continue;
						if (x < width / 4) left++;
						if (x >= (width * 3) / 4) right++;
					}
				return left > right * 3;
			}),
		)
		.toBe(true);
	const bounds = await timeline.boundingBox();
	const startBounds = await start.boundingBox();
	const endBounds = await end.boundingBox();
	if (!bounds || !startBounds || !endBounds)
		throw new Error("Waveform did not render");
	await page.mouse.move(
		startBounds.x + startBounds.width / 2,
		startBounds.y + startBounds.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		bounds.x + bounds.width * 0.25,
		bounds.y + bounds.height / 2,
		{ steps: 5 },
	);
	await page.mouse.up();
	await page.mouse.move(
		endBounds.x + endBounds.width / 2,
		endBounds.y + endBounds.height / 2,
	);
	await page.mouse.down();
	await page.mouse.move(
		bounds.x + bounds.width * 0.75,
		bounds.y + bounds.height / 2,
		{ steps: 5 },
	);
	await page.mouse.up();
	await expect
		.poll(async () => Number(await start.getAttribute("aria-valuenow")))
		.toBeCloseTo(0.025, 2);
	await expect
		.poll(async () => Number(await end.getAttribute("aria-valuenow")))
		.toBeCloseTo(0.075, 2);
	await page.getByRole("button", { name: "Preview edit" }).click();
	await expect
		.poll(async () =>
			page
				.getByLabel("Edited sample preview")
				.evaluate((element) => (element as HTMLAudioElement).duration),
		)
		.toBeCloseTo(0.05, 2);
	await page.getByRole("button", { name: "Save edited copy" }).click();
	await expect(page.getByText("tap.wav", { exact: true })).toHaveCount(2);
	await start.focus();
	await page.keyboard.press("ArrowRight");
	await expect
		.poll(async () => Number(await start.getAttribute("aria-valuenow")))
		.toBeGreaterThan(0.025);
	const transfer = await page.evaluateHandle((bytes) => {
		const data = new DataTransfer();
		data.items.add(
			new File([new Uint8Array(bytes)], "replacement.wav", {
				type: "audio/wav",
			}),
		);
		return data;
	}, Array.from(silentWav()));
	await page
		.locator(".sample-editor")
		.dispatchEvent("drop", { dataTransfer: transfer });
	await expect(page.getByLabel("Sample name")).toHaveValue("replacement.wav");
});
