import { defineConfig } from '@playwright/test'
import { ADMINHEAD_AUTH_FILE } from './tests/global-setup-adminhead'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 8000 },
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'off',
    viewport: { width: 1440, height: 900 },
    storageState: ADMINHEAD_AUTH_FILE,
  },
  reporter: [['list'], ['html', { outputFolder: 'tests/report-adminhead' }]],
  projects: [
    {
      name: 'adminhead-full-sweep',
      testMatch: /adminhead-full-sweep\.spec\.ts/,
      timeout: 300_000,
      use: {
        screenshot: 'off',
        storageState: ADMINHEAD_AUTH_FILE,
      },
    },
  ],
  globalSetup: './tests/global-setup-adminhead.ts',
})
