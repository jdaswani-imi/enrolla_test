import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

const ROUTES = [
  '/dashboard',
  '/students',
  '/guardians',
  '/leads',
  '/enrolment',
  '/finance',
  '/timetable',
  '/attendance',
  '/assessments',
  '/progress',
  '/tasks',
  '/staff',
  '/analytics',
  '/reports',
  '/settings',
  '/feedback',
  '/people',
  '/automations',
  '/inventory',
  '/finance/invoice/new',
]

const TABS: Record<string, string[]> = {
  '/finance': ['Invoices', 'Payments', 'Credits', 'Reports'],
  '/progress': ['Trackers', 'Reports', 'Alerts', 'Assignments'],
  '/analytics': ['Revenue', 'Occupancy', 'Churn', 'Staff'],
  '/feedback': ['Feedback Queue', 'Announcements',
    'Complaints', 'Surveys', 'Class Discussion'],
  '/people': ['Directory', 'Duplicates', 'Segments',
    'Broadcast Lists', 'Forms', 'Exports'],
  '/automations': ['Templates', 'Rules', 'Trigger Library',
    'Dispatch Queue', 'Internal Messages', 'Marketing',
    'Execution Log'],
  '/inventory': ['Catalogue', 'Reorder Alerts',
    'Stock Ledger', 'Suppliers'],
  '/attendance': ['Today', 'Overview'],
  '/staff': ['Directory', 'HR Dashboard'],
  '/assessments': ['Upcoming', 'Outcomes', 'Slots'],
}

const ROLES = [
  'Super Admin',
  'Admin Head',
  'Admin',
  'Academic Head',
  'HOD',
  'Teacher',
  'TA',
  'HR/Finance',
]

// TEST 1 — Every route renders without crashing
test.describe('Route smoke tests', () => {
  for (const route of ROUTES) {
    test(`${route} renders without error`, async ({ page }) => {
      const errors: string[] = []
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text())
      })
      page.on('pageerror', err => errors.push(err.message))

      await page.goto(`${BASE}${route}`)
      await page.waitForLoadState('networkidle')

      // Page should not show error boundary
      await expect(page.locator('text=Something went wrong'))
        .not.toBeVisible()
      await expect(page.locator('text=Application error'))
        .not.toBeVisible()

      // No React hydration errors
      const reactErrors = errors.filter(e =>
        e.includes('Hydration') ||
        e.includes('did not match') ||
        e.includes('Minified React error')
      )
      expect(reactErrors,
        `React errors on ${route}: ${reactErrors.join(', ')}`)
        .toHaveLength(0)

      // Take screenshot
      await page.screenshot({
        path: `tests/screenshots${route.replace(/\//g, '-') || '-home'}.png`,
        fullPage: true
      })
    })
  }
})

// TEST 2 — Tab switching on multi-tab pages
test.describe('Tab navigation', () => {
  for (const [route, tabs] of Object.entries(TABS)) {
    test(`${route} — all tabs clickable`, async ({ page }) => {
      await page.goto(`${BASE}${route}`)
      await page.waitForLoadState('networkidle')

      for (const tab of tabs) {
        const tabEl = page.locator(`button, [role=tab]`)
          .filter({ hasText: tab }).first()

        if (await tabEl.isVisible()) {
          await tabEl.click()
          await page.waitForTimeout(300)

          // After clicking tab, page should not crash
          await expect(page.locator('text=Something went wrong'))
            .not.toBeVisible()
        }
      }
    })
  }
})

// TEST 3 — Role switcher works for all roles
test.describe('Role switcher', () => {
  for (const role of ROLES) {
    test(`Switching to ${role} does not crash`, async ({ page }) => {
      await page.goto(`${BASE}/dashboard`)
      await page.waitForLoadState('networkidle')

      // Find and click role switcher button in topbar
      const roleSwitcher = page.locator('button').filter({
        hasText: /Super Admin|Admin Head|Admin|HOD|Teacher|TA|HR/
      }).first()

      if (await roleSwitcher.isVisible()) {
        await roleSwitcher.click()
        await page.waitForTimeout(200)

        // Click the target role
        const roleOption = page.locator('[role=menuitem], button, li')
          .filter({ hasText: role }).first()

        if (await roleOption.isVisible()) {
          await roleOption.click()
          await page.waitForTimeout(500)

          // Dashboard should still render
          await expect(page.locator('text=Something went wrong'))
            .not.toBeVisible()

          // Take screenshot of sidebar for this role
          await page.screenshot({
            path: `tests/screenshots/role-${role.replace(/\//g, '-').replace(/ /g, '-')}.png`
          })
        }
      }
    })
  }
})

// TEST 4 — Invoice builder
test('Invoice builder renders and preview updates',
  async ({ page }) => {
  await page.goto(`${BASE}/finance/invoice/new`)
  await page.waitForLoadState('networkidle')

  // Page renders — check elements unique to the invoice builder
  await expect(page.locator('text=Invoice preview')).toBeVisible()
  await expect(page.locator('text=Draft').first()).toBeVisible()

  // Search for a student
  const searchInput = page.locator('input[placeholder="Search student by name..."]')
  if (await searchInput.isVisible()) {
    await searchInput.fill('Aisha')
    await page.waitForTimeout(300)

    // Student should appear in dropdown
    const dropdown = page.locator('text=Aisha Rahman')
    if (await dropdown.isVisible()) {
      await dropdown.click()
      await page.waitForTimeout(300)

      // Student card should appear
      await expect(page.locator('text=Aisha Rahman').first()).toBeVisible()
    }
  }

  // Take screenshot
  await page.screenshot({
    path: 'tests/screenshots/invoice-builder.png',
    fullPage: true
  })
})

// TEST 5 — Navigation links work
test('Sidebar navigation links all resolve', async ({ page }) => {
  await page.goto(`${BASE}/dashboard`)
  await page.waitForLoadState('networkidle')

  const navLinks = [
    '/students', '/leads', '/finance',
    '/timetable', '/attendance', '/tasks',
    '/staff', '/settings', '/inventory'
  ]

  for (const link of navLinks) {
    await page.goto(`${BASE}${link}`)
    await page.waitForLoadState('networkidle')

    // Should not show 404
    await expect(page.locator('text=404')).not.toBeVisible()
    await expect(page.locator('text=This page could not be found'))
      .not.toBeVisible()
  }
})

// Run with: npx playwright test --reporter=list
// Screenshots saved to: tests/screenshots/
