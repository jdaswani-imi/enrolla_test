import { chromium, FullConfig } from '@playwright/test'
import path from 'path'

export const AUTH_FILE = path.join(__dirname, 'auth.json')

export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto('http://localhost:3000/login')
  await page.waitForLoadState('load')

  await page.fill('#email', 'jasondazza@yahoo.com')
  await page.fill('#password', '1234567890')
  await page.click('button[type="submit"], button:has-text("Sign in")')

  // Wait until redirected away from /login (auth complete)
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 15_000 })
  await page.waitForLoadState('load')

  await page.context().storageState({ path: AUTH_FILE })
  await browser.close()
}
