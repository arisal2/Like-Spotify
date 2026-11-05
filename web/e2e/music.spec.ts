import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  if (process.env.E2E_AUDIO_FIXTURE !== '1') return;
  await page.route('**/api/v1/catalog', async (route) => {
    const response = await route.fetch();
    const catalog = await response.json();
    catalog.songs[0].audio = '/media/music/ci-tone.wav';
    await route.fulfill({ response, json: catalog });
  });
});

test('listener can save music, curate a mix, and return after signing out', async ({ page }) => {
  const username = `listener_${Date.now()}`;
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find your frequency.' })).toBeVisible();
  await page.getByRole('button', { name: 'Sign in', exact: false }).click();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  await page.getByLabel('Your name', { exact: true }).fill('Music lover');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill('a good test password');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.getByRole('button', { name: 'Like Acoustic Breeze', exact: true }).click();
  await page.getByRole('link', { name: /Liked songs/ }).click();
  await expect(page.getByRole('button', { name: 'Unlike Acoustic Breeze', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Create playlist', exact: true }).click();
  await page.getByLabel('Playlist name').fill('Evening rotation');
  await page.getByRole('button', { name: 'Save playlist', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Evening rotation' })).toBeVisible();
  await page.getByRole('link', { name: 'Search', exact: true }).click();
  await page.getByRole('textbox', { name: 'Search music' }).fill('Acoustic Breeze');
  await page.getByLabel('Add Acoustic Breeze to playlist').selectOption({ label: 'Evening rotation' });
  await expect(page.getByRole('status')).toContainText('Added to your playlist');
  await page.getByRole('link', { name: 'Evening rotation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Play Acoustic Breeze', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Play Acoustic Breeze', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(page.getByLabel('Seek')).toBeEnabled();
  await page.getByRole('link', { name: 'Discover', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /A mix that gets you/ }).click();
  await page.getByLabel('Your moment', { exact: true }).fill('Deep focus for coding');
  await page.getByRole('button', { name: 'Make my mix', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your mood, on repeat' })).toBeVisible();
  await page.getByRole('button', { name: 'Save playlist', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your mood, on repeat' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.getByRole('button', { name: 'Sign in', exact: false }).click();
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill('a good test password');
  await page.getByRole('dialog').getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Evening rotation', exact: true })).toBeVisible();
});

test('catalog and player fit a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Find your frequency.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Press play', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await expect(page.getByLabel('Seek')).toBeEnabled();
});
