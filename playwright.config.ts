import { defineConfig } from '@playwright/test'
import { AUTH_FILE } from './tests/global-setup'

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
      testMatch: /smoke\.spec\.ts|rbac\.spec\.ts|deep\.spec\.ts|backend-integration\.spec\.ts|auth-flow\.spec\.ts/,
    },
    {
      name: 'responsive-visual',
      testMatch: /responsive-visual\.spec\.ts/,
      timeout: 180_000,
      use: {
        screenshot: 'off',       // we call page.screenshot() manually
        storageState: AUTH_FILE, // reuse logged-in session for every test
      },
    },
  ],
  globalSetup: './tests/global-setup.ts',
})
