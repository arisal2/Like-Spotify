import { expect, test } from "@playwright/test";

function silentWav() {
  const data = Buffer.alloc(44 + 1600);
  data.write("RIFF", 0); data.writeUInt32LE(data.length - 8, 4); data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(8000, 24); data.writeUInt32LE(16000, 28); data.writeUInt16LE(2, 32);
  data.writeUInt16LE(16, 34); data.write("data", 36); data.writeUInt32LE(1600, 40);
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
  await page.getByRole("slider", { name: "Volume for kick.wav" }).fill("0.5");
  await page.getByRole("button", { name: "▶ Play mix" }).click();
  await expect(page.getByRole("status")).toContainText("Playing");
  await page.getByRole("button", { name: "■ Stop" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Game sounds" }).click();
  await expect(page.getByText("kick.wav", { exact: true })).toBeVisible();
  await expect(page.getByRole("slider", { name: "Volume for kick.wav" })).toHaveValue("0.5");
});
