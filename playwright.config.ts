import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 * eBay Related Best-Seller Products Feature QA
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Sequential to avoid rate limiting from eBay
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : 1,
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['list'],
    ['json', { outputFile: 'reports/test-results.json' }],
  ],
  use: {
    baseURL: 'https://www.ebay.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    headless: true,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
