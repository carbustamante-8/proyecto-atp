// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    actionTimeout: 10_000,
    trace: 'on-first-retry', // útil para debugging
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    // puedes añadir firefox/webkit si quieres
  ],
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
});
