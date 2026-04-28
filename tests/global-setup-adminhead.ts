import { chromium, FullConfig } from '@playwright/test'
import path from 'path'

export const ADMINHEAD_AUTH_FILE = path.join(__dirname, 'auth-adminhead.json')

export default async function globalSetupAdminHead(_config: FullConfig) {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.goto('http://localhost:3000/login')
  await page.waitForLoadState('load')
  await page.waitForTimeout(1000)

  await page.fill('#email', 'test.adminhead@enrolla.com')
  await page.fill('#password', 'AdminHead@123')
  await page.click('button[type="submit"]')

  // Wait until redirected away from /login
  await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 20_000 })
  await page.waitForLoadState('load')
  await page.waitForTimeout(1000)

  await page.context().storageState({ path: ADMINHEAD_AUTH_FILE })
  await browser.close()
  console.log('[global-setup-adminhead] Auth state saved to', ADMINHEAD_AUTH_FILE)
}
