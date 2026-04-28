/**
 * RBAC tests — verifies that each role sees the correct nav items and cannot
 * access pages / trigger actions that their permissions don't allow.
 *
 * Prerequisites before running:
 *  1. All 8 test accounts must have completed the onboarding wizard (password set).
 *  2. Copy .env.test.example → .env.test and fill in the passwords.
 *  3. Run the dev server: npm run dev
 *  4. npx playwright test tests/e2e/rbac.spec.ts
 */

import { test, expect, type Page, type BrowserContext } from '@playwright/test'

const BASE = 'http://localhost:3000'
const SUPABASE_URL = 'https://fkpvfolgmhayenidsaxc.supabase.co'
const ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrcHZmb2xnbWhheWVuaWRzYXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTE3MDYsImV4cCI6MjA5MjY4NzcwNn0.o3K3ew6qnNFHKF9Yoh-5FPz7X-FOD3g-JGQF_LxIkBY'

// ─── Test credentials ──────────────────────────────────────────────────────────
// Set passwords via env vars (or .env.test); accounts must have completed onboarding.

const ACCOUNTS: Record<string, { email: string; password: string }> = {
  'Super Admin':   { email: 'j.daswani@improvemeinstitute.com', password: process.env.TEST_PW_SUPER_ADMIN   ?? '' },
  'Admin Head':    { email: 'm.shayan@improvemeinstitute.com',  password: process.env.TEST_PW_ADMIN_HEAD    ?? '' },
  'Admin':         { email: 'jasondazza+admin@gmail.com',       password: process.env.TEST_PW_ADMIN         ?? '' },
  'Academic Head': { email: 'jasondazza+2@gmail.com',           password: process.env.TEST_PW_ACADEMIC_HEAD ?? '' },
  'HOD':           { email: 'jasondazza+hod@gmail.com',         password: process.env.TEST_PW_HOD           ?? '' },
  'Teacher':       { email: 'jasondazza+teacher@gmail.com',     password: process.env.TEST_PW_TEACHER       ?? '' },
  'TA':            { email: 'jasondazza+ta@gmail.com',          password: process.env.TEST_PW_TA            ?? '' },
  'HR/Finance':    { email: 'jasondazza+1@gmail.com',           password: process.env.TEST_PW_HR_FINANCE    ?? '' },
}

// ─── Nav visibility matrix ─────────────────────────────────────────────────────
// Which top-level sidebar sections each role should see / not see.
// Derived directly from PERMISSIONS in lib/role-config.ts.

type NavExpectation = { visible: string[]; hidden: string[] }

const NAV_EXPECTATIONS: Record<string, NavExpectation> = {
  'Super Admin': {
    visible: ['Finance', 'Settings', 'Automations', 'Staff', 'Analytics', 'Reports'],
    hidden:  [],
  },
  'Admin Head': {
    visible: ['Finance', 'Automations', 'Staff', 'Analytics', 'Reports'],
    hidden:  ['Settings'],
  },
  'Admin': {
    visible: ['Finance', 'Automations', 'Staff', 'Analytics', 'Reports'],
    hidden:  ['Settings'],
  },
  'Academic Head': {
    visible: ['Staff', 'Analytics', 'Reports'],
    hidden:  ['Finance', 'Settings', 'Automations'],
  },
  'HOD': {
    visible: ['Staff', 'Reports'],
    hidden:  ['Finance', 'Settings', 'Automations', 'Analytics'],
  },
  'Teacher': {
    visible: ['Tasks'],
    hidden:  ['Finance', 'Settings', 'Automations', 'Staff', 'Analytics', 'Reports'],
  },
  'TA': {
    visible: ['Tasks'],
    hidden:  ['Finance', 'Settings', 'Automations', 'Staff', 'Analytics', 'Reports'],
  },
  'HR/Finance': {
    visible: ['Finance', 'Staff', 'Analytics', 'Reports'],
    hidden:  ['Settings', 'Automations', 'Timetable', 'Attendance'],
  },
}

// ─── Page access matrix ────────────────────────────────────────────────────────
// Routes that should redirect away (403/login) for certain roles.

const PAGE_ACCESS: Record<string, { allowed: string[]; forbidden: string[] }> = {
  'Super Admin':   { allowed: ['/settings', '/finance', '/automations'], forbidden: [] },
  'Admin Head':    { allowed: ['/finance', '/automations'],              forbidden: ['/settings'] },
  'Admin':         { allowed: ['/finance', '/automations'],              forbidden: ['/settings'] },
  'Academic Head': { allowed: ['/staff'],                                forbidden: ['/settings', '/finance', '/automations'] },
  'HOD':           { allowed: ['/staff'],                                forbidden: ['/settings', '/finance', '/automations'] },
  'Teacher':       { allowed: ['/tasks'],                                forbidden: ['/settings', '/finance', '/automations', '/staff'] },
  'TA':            { allowed: ['/tasks'],                                forbidden: ['/settings', '/finance', '/automations', '/staff'] },
  'HR/Finance':    { allowed: ['/finance', '/staff'],                    forbidden: ['/settings', '/automations', '/timetable', '/attendance'] },
}

// ─── Helper: sign in via Supabase REST API ─────────────────────────────────────

async function signIn(context: BrowserContext, role: string): Promise<boolean> {
  const { email, password } = ACCOUNTS[role]
  if (!password) {
    console.warn(`Skipping ${role} — TEST_PW_${role.replace(/[ /]/g, '_').toUpperCase()} not set`)
    return false
  }

  const res = await context.request.post(
    `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
    {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { email, password },
    }
  )

  if (!res.ok()) {
    const err = await res.json().catch(() => ({}))
    console.error(`Login failed for ${role}:`, err)
    return false
  }

  const { access_token, refresh_token } = await res.json()

  // Inject session into localStorage so the Supabase client picks it up
  const page = await context.newPage()
  await page.goto(BASE)
  await page.evaluate(
    ({ url, token, refresh }) => {
      const key = `sb-${new URL(url).hostname.split('.')[0]}-auth-token`
      localStorage.setItem(key, JSON.stringify({ access_token: token, refresh_token: refresh }))
    },
    { url: SUPABASE_URL, token: access_token, refresh: refresh_token }
  )
  await page.close()
  return true
}

// ─── Test suite ────────────────────────────────────────────────────────────────

test.describe('RBAC — nav visibility', () => {
  for (const [role, expectations] of Object.entries(NAV_EXPECTATIONS)) {
    test(`${role}: correct sidebar items visible`, async ({ browser }) => {
      const context = await browser.newContext()
      const ok = await signIn(context, role)
      test.skip(!ok, `No password set for ${role}`)

      const page = await context.newPage()
      await page.goto(`${BASE}/dashboard`)
      await page.waitForLoadState('networkidle')

      // Open flyout panels if needed so all nav labels are in the DOM
      const flyoutTriggers = page.locator('[data-sidebar-flyout-trigger]')
      const count = await flyoutTriggers.count()
      for (let i = 0; i < count; i++) {
        await flyoutTriggers.nth(i).click().catch(() => {})
        await page.waitForTimeout(150)
      }

      const sidebar = page.locator('[data-sidebar], nav, aside').first()

      for (const label of expectations.visible) {
        await expect(
          sidebar.getByText(label, { exact: false }).first(),
          `${role} should see "${label}" in sidebar`
        ).toBeVisible()
      }

      for (const label of expectations.hidden) {
        await expect(
          sidebar.getByText(label, { exact: true }).first(),
          `${role} should NOT see "${label}" in sidebar`
        ).not.toBeVisible()
      }

      await context.close()
    })
  }
})

test.describe('RBAC — page access', () => {
  for (const [role, { forbidden }] of Object.entries(PAGE_ACCESS)) {
    if (!forbidden.length) continue

    test(`${role}: forbidden pages redirect away`, async ({ browser }) => {
      const context = await browser.newContext()
      const ok = await signIn(context, role)
      test.skip(!ok, `No password set for ${role}`)

      const page = await context.newPage()

      for (const route of forbidden) {
        await page.goto(`${BASE}${route}`)
        await page.waitForLoadState('networkidle')

        // Should either be redirected to /dashboard or show an access-denied indicator
        const url = page.url()
        const isDenied =
          url.includes('/dashboard') ||
          url.includes('/login') ||
          (await page.locator('text=Access denied, text=Not authorised, text=403').first().isVisible().catch(() => false))

        expect(isDenied, `${role} visiting ${route} should be denied or redirected`).toBe(true)
      }

      await context.close()
    })
  }
})

test.describe('RBAC — action gates', () => {
  test('Settings page only reachable by Super Admin', async ({ browser }) => {
    const context = await browser.newContext()
    const ok = await signIn(context, 'Super Admin')
    test.skip(!ok, 'No password set for Super Admin')

    const page = await context.newPage()
    await page.goto(`${BASE}/settings`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1, [data-page-title]').first()).not.toContainText('404')
    await context.close()
  })

  test('Finance page hidden from Teacher role', async ({ browser }) => {
    const context = await browser.newContext()
    const ok = await signIn(context, 'Teacher')
    test.skip(!ok, 'No password set for Teacher')

    const page = await context.newPage()
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('nav a[href="/finance"], nav button:has-text("Finance")')).not.toBeVisible()
    await context.close()
  })

  test('Staff "Add member" button hidden from Teacher', async ({ browser }) => {
    const context = await browser.newContext()
    const ok = await signIn(context, 'Teacher')
    test.skip(!ok, 'No password set for Teacher')

    const page = await context.newPage()
    // Teacher shouldn't even be able to reach /staff
    await page.goto(`${BASE}/staff`)
    await page.waitForLoadState('networkidle')
    const notOnStaff = !page.url().includes('/staff') ||
      (await page.locator('button:has-text("Add"), button:has-text("Invite")').count() === 0)
    expect(notOnStaff).toBe(true)
    await context.close()
  })

  test('Super Admin can see "Settings" nav item', async ({ browser }) => {
    const context = await browser.newContext()
    const ok = await signIn(context, 'Super Admin')
    test.skip(!ok, 'No password set for Super Admin')

    const page = await context.newPage()
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('a[href="/settings"]').first()).toBeVisible()
    await context.close()
  })

  test('HR/Finance can reach /finance but not /settings', async ({ browser }) => {
    const context = await browser.newContext()
    const ok = await signIn(context, 'HR/Finance')
    test.skip(!ok, 'No password set for HR/Finance')

    const page = await context.newPage()

    await page.goto(`${BASE}/finance`)
    await page.waitForLoadState('networkidle')
    await expect(page.locator('text=404')).not.toBeVisible()

    await page.goto(`${BASE}/settings`)
    await page.waitForLoadState('networkidle')
    const blockedFromSettings =
      page.url().includes('/dashboard') ||
      page.url().includes('/login') ||
      (await page.locator('text=404').isVisible().catch(() => false))
    expect(blockedFromSettings).toBe(true)

    await context.close()
  })
})

// ─── Auth flows ────────────────────────────────────────────────────────────────

test.describe('Auth flows', () => {
  test('Login page renders correctly', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button:has-text("Sign in")')).toBeVisible()
    await expect(page.locator('button:has-text("Forgot password")')).toBeVisible()
  })

  test('Login with wrong password shows error toast', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.locator('[data-sonner-toast], [role="status"]').first()).toBeVisible({ timeout: 5000 })
  })

  test('Forgot password with no email shows error', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    // Click forgot password without entering email first
    await page.click('button:has-text("Forgot password")')
    await expect(page.locator('[data-sonner-toast], [role="status"]').first()).toBeVisible({ timeout: 3000 })
  })

  test('Forgot password with valid email shows success toast', async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.fill('input[type="email"]', 'j.daswani@improvemeinstitute.com')
    await page.click('button:has-text("Forgot password")')
    // Should show "Check your inbox" toast
    await expect(
      page.locator('[data-sonner-toast]').filter({ hasText: /inbox|sent|way/i }).first()
    ).toBeVisible({ timeout: 8000 })
  })

  test('Reset password page renders without sidebar', async ({ page }) => {
    // The /reset-password page should NOT show the app sidebar
    await page.goto(`${BASE}/reset-password`)
    await expect(page.locator('[data-sidebar], nav.app-sidebar').first()).not.toBeVisible()
    await expect(page.locator('text=Reset password')).toBeVisible()
  })

  test('Welcome onboarding page renders without sidebar', async ({ page }) => {
    await page.goto(`${BASE}/welcome`)
    await expect(page.locator('[data-sidebar], nav.app-sidebar').first()).not.toBeVisible()
  })
})
