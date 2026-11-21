import { test, expect } from '@playwright/test';

test('expired QR shows EXPIRED error', async ({ page }) => {
  await page.goto('/penerima');
  await page.fill('input[placeholder*="WA"]', '+6281111111111');
  await page.fill('input[placeholder*="OTP"]', '123456');
  await page.click('button:has-text("Login")');
  await page.waitForSelector('text=Sisa Hak Belanja', { timeout: 15000 });
  await page.click('button:has-text("Scan QR")');
  await page.click('button:has-text("Tempel")');
  const expiredPayload = JSON.stringify({
    campaign: '0x7BA7A2D69eA39253572DbE0094d8310FEB9ee0ef',
    toko: '0x0000000000000000000000000000000000000001',
    namaToko: 'Toko Demo',
    jumlah: '50000000000000000000000',
    nonce: 999999,
    expiry: Date.now() - 1000,
  });
  await page.fill('textarea', expiredPayload);
  await page.click('button:has-text("Bayar")');
  await expect(page.locator('[role=alert]')).toBeVisible({ timeout: 15000 });
});

test('dashboard loads with pool display', async ({ page }) => {
  const CAMPAIGN = process.env.NEXT_PUBLIC_CAMPAIGN_ADDRESS ?? '0x7BA7A2D69eA39253572DbE0094d8310FEB9ee0ef';
  await page.goto(`/campaign/${CAMPAIGN}`);
  await expect(page.locator('text=Kolam Kampanye')).toBeVisible({ timeout: 15000 });
});
