import { test, expect } from '@playwright/test';

const CAMPAIGN = process.env.NEXT_PUBLIC_CAMPAIGN_ADDRESS ?? '0x7BA7A2D69eA39253572DbE0094d8310FEB9ee0ef';
const DONATE_URL = `/campaign/${CAMPAIGN}/donate`;

test('demo §9 step 1: donate page loads', async ({ page }) => {
  await page.goto(DONATE_URL);
  await expect(page.locator('h1')).toContainText('Donasi');
});

test('demo §9 step 2: penerima login with mock OTP', async ({ page }) => {
  await page.goto('/penerima');
  await page.fill('input[placeholder*="WA"]', '+6281111111111');
  await page.fill('input[placeholder*="OTP"]', '123456');
  await page.click('button:has-text("Login")');
  await expect(page.locator('text=Sisa Hak Belanja')).toBeVisible({ timeout: 15000 });
});

test('demo §9 step 3: no send-to-friend path exists in UI', async ({ page }) => {
  await page.goto('/penerima');
  const body = await page.textContent('body');
  expect(body).not.toContain('Kirim ke teman');
  expect(body).not.toContain('Transfer');
  expect(body).not.toContain('Cash out');
});

test('demo §9 step 4: toko creates QR', async ({ page }) => {
  await page.goto('/toko');
  await page.fill('input[placeholder*="IDR"]', '50000');
  await page.click('button:has-text("Buat QR")');
  await expect(page.locator('text=Berlalu 5 menit')).toBeVisible({ timeout: 15000 });
});
