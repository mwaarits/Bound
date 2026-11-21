import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,
  timeout: 60000,
  retries: 0,
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    channel: 'chrome',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
