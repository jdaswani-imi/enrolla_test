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
  projects: [
    {
      name: 'smoke',
      testMatch: /smoke\.spec\.ts|rbac\.spec\.ts|deep\.spec\.ts/,
    },
    {
      name: 'responsive-visual',
      testMatch: /responsive-visual\.spec\.ts/,
      timeout: 120_000,
      use: { screenshot: 'off' }, // we call page.screenshot() manually
    },
  ],
})
