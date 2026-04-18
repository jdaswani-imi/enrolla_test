import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 10000,
  expect: { timeout: 5000 },
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    viewport: { width: 1440, height: 900 },
  },
  reporter: [['list'], ['html', { outputFolder: 'tests/report' }]],
})
