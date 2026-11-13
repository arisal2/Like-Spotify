import { expect, test } from "@playwright/test";

// Vite does not serve deployment headers. Run explicitly against nginx.
test.skip(
	process.env.DEPLOYED_AUDIO_SMOKE !== "1",
	"Requires nginx deployment",
);
test.use({
	permissions: ["microphone"],
	launchOptions: {
		args: [
			"--use-fake-device-for-media-stream",
			"--use-fake-ui-for-media-stream",
		],
	},
});

test("nginx permits native recording and local audio playback", async ({
	page,
}) => {
	const blockedMedia: string[] = [];
	page.on("console", (message) => {
		if (/violates.*media-src|microphone is not allowed/.test(message.text()))
			blockedMedia.push(message.text());
	});
	const response = await page.goto("/");
	expect(response?.headers()["permissions-policy"]).toContain(
		"microphone=(self)",
	);
	expect(response?.headers()["content-security-policy"]).toContain(
		"media-src 'self' blob:",
	);
	// Native recording APIs, with only the input device simulated.
	await page.getByRole("button", { name: "Record sound" }).click();
	const stop = page.getByRole("button", { name: "Stop recording" });
	await expect(stop).toBeEnabled();
	await page.waitForTimeout(1000); // Capture enough packets to decode.
	await stop.click();
	const original = page.getByLabel("Original recording", { exact: true });
	await expect(original).toBeVisible();
	await original.evaluate((node: HTMLAudioElement) => node.play());
	await expect
		.poll(() => original.evaluate((node: HTMLAudioElement) => node.currentTime))
		.toBeGreaterThan(0);
	await original.evaluate((node: HTMLAudioElement) => node.pause());
	await expect(page.getByRole("slider", { name: "Trim start" })).toBeVisible();
	await page.getByRole("button", { name: "Preview edit" }).click();
	const preview = page.getByLabel("Edited sample preview");
	await expect(preview).toBeVisible();
	await preview.evaluate((node: HTMLAudioElement) => node.play());
	await expect
		.poll(() => preview.evaluate((node: HTMLAudioElement) => node.currentTime))
		.toBeGreaterThan(0);
	await preview.evaluate((node: HTMLAudioElement) => node.pause());
	await page.getByRole("button", { name: "Save edited copy" }).click();
	await expect(page.getByText("Recording.wav", { exact: true })).toBeVisible();
	await page.reload();
	await expect(page.getByText("Recording.wav", { exact: true })).toBeVisible();
	expect(blockedMedia).toEqual([]);
});
