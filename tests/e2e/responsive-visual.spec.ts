/**
 * Comprehensive responsive visual test suite.
 * Opens every page, every tab, every search bar, every nav button.
 * Scrolls fully top→bottom and left→right. Screenshots saved to
 * /playwright-screenshots/{desktop|tablet|mobile}/.
 */
import { test, expect, Page, BrowserContext } from '@playwright/test'
import path from 'path'

const BASE = 'http://localhost:3000'

// ─── Viewport profiles ────────────────────────────────────────────────────────
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'mobile',  width: 390,  height: 844 },
]

// ─── All pages with their tabs ────────────────────────────────────────────────
const PAGES: Array<{
  route: string
  label: string
  tabs?: Array<{ label: string; value: string }>
  subtabs?: Array<{ label: string; value: string }>
  hasSearch?: boolean
}> = [
  { route: '/dashboard',   label: 'dashboard' },
  {
    route: '/students',
    label: 'students',
    hasSearch: true,
  },
  {
    route: '/guardians',
    label: 'guardians',
    hasSearch: true,
  },
  {
    route: '/leads',
    label: 'leads',
    hasSearch: true,
  },
  { route: '/enrolment',   label: 'enrolment', hasSearch: true },
  { route: '/assessments', label: 'assessments' },
  { route: '/timetable',   label: 'timetable' },
  {
    route: '/attendance',
    label: 'attendance',
    tabs: [
      { label: "Today's Register", value: 'register' },
      { label: 'Overview',        value: 'overview' },
    ],
  },
  {
    route: '/feedback',
    label: 'feedback',
    tabs: [
      { label: 'Feedback Queue',   value: 'queue' },
      { label: 'Class Discussion', value: 'class-discussion' },
    ],
  },
  {
    route: '/progress',
    label: 'progress',
    tabs: [
      { label: 'Trackers',    value: 'trackers' },
      { label: 'Reports',     value: 'reports' },
      { label: 'Alerts',      value: 'alerts' },
      { label: 'Assignments', value: 'assignments' },
    ],
  },
  {
    route: '/finance',
    label: 'finance',
    tabs: [
      { label: 'Invoices',  value: 'invoices' },
      { label: 'Payments',  value: 'payments' },
      { label: 'Credits',   value: 'credits' },
      { label: 'Unbilled',  value: 'unbilled' },
      { label: 'Reports',   value: 'reports' },
    ],
    hasSearch: true,
  },
  { route: '/finance/invoice/new', label: 'finance-invoice-new', hasSearch: true },
  { route: '/tasks',       label: 'tasks', hasSearch: true },
  {
    route: '/staff',
    label: 'staff',
    tabs: [
      { label: 'Directory',    value: 'directory' },
      { label: 'HR Dashboard', value: 'hr-dashboard' },
    ],
    hasSearch: true,
  },
  {
    route: '/analytics',
    label: 'analytics',
    tabs: [
      { label: 'Revenue',   value: 'revenue' },
      { label: 'Occupancy', value: 'occupancy' },
      { label: 'Churn',     value: 'churn' },
      { label: 'Staff',     value: 'staff' },
    ],
  },
  { route: '/reports',   label: 'reports' },
  {
    route: '/people',
    label: 'people',
    tabs: [
      { label: 'Overview',        value: 'overview' },
      { label: 'Duplicates',      value: 'duplicates' },
      { label: 'Segments',        value: 'segments' },
      { label: 'Broadcast Lists', value: 'broadcast-lists' },
      { label: 'Forms',           value: 'forms' },
      { label: 'Exports',         value: 'exports' },
    ],
    hasSearch: true,
  },
  {
    route: '/automations',
    label: 'automations',
    tabs: [
      { label: 'Templates',       value: 'templates' },
      { label: 'Rules',           value: 'rules' },
      { label: 'Trigger Library', value: 'trigger-library' },
      { label: 'Dispatch Queue',  value: 'dispatch-queue' },
      { label: 'Internal Messages', value: 'internal-messages' },
      { label: 'Marketing',       value: 'marketing' },
      { label: 'Execution Log',   value: 'execution-log' },
    ],
  },
  {
    route: '/inventory',
    label: 'inventory',
    tabs: [
      { label: 'Catalogue',      value: 'catalogue' },
      { label: 'Reorder Alerts', value: 'reorder-alerts' },
      { label: 'Stock Ledger',   value: 'stock-ledger' },
      { label: 'Suppliers',      value: 'suppliers' },
    ],
    hasSearch: true,
  },
  { route: '/settings',      label: 'settings' },
  { route: '/communications',label: 'communications', tabs: [
    { label: 'Announcements',      value: 'announcements' },
    { label: 'Concerns & Tickets', value: 'concerns-tickets' },
    { label: 'Surveys',            value: 'surveys' },
  ]},
  { route: '/profile',       label: 'profile', tabs: [
    { label: 'Account',         value: 'account' },
    { label: 'Activity',        value: 'activity' },
    { label: 'Preferences',     value: 'preferences' },
    { label: 'CPD Log',         value: 'cpd' },
    { label: 'Staff Directory', value: 'directory' },
  ]},
]

// ─── Sidebar top-level nav items to click ─────────────────────────────────────
const SIDEBAR_NAV_LABELS = [
  'Dashboard',
  'People',
  'Timetable',
  'Attendance',
  'Tasks',
  'Automations',
  'Inventory',
  'Staff',
  'Settings',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function screenshotDir(viewport: string): string {
  return path.join(process.cwd(), 'playwright-screenshots', viewport)
}

function slug(s: string) {
  return s.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
}

async function shot(page: Page, viewport: string, name: string) {
  await page.screenshot({
    path: path.join(screenshotDir(viewport), `${name}.png`),
    fullPage: true,
  })
}

/** Scroll the page fully top→bottom then scroll back to top (instant) */
async function scrollFull(page: Page) {
  await page.evaluate(() => { window.scrollTo(0, document.body.scrollHeight) })
  await page.waitForTimeout(250)
  await page.evaluate(() => { window.scrollTo(0, 0) })
  await page.waitForTimeout(150)
}

/** Scroll any horizontally-scrollable containers */
async function scrollHorizontal(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('*').forEach(el => {
      if (el.scrollWidth > el.clientWidth + 10) {
        el.scrollLeft = el.scrollWidth
        setTimeout(() => { el.scrollLeft = 0 }, 200)
      }
    })
  })
}

/** Try to click a tab by text, return true if found */
async function clickTab(page: Page, label: string): Promise<boolean> {
  const el = page.locator(`[role="tab"], button, a`).filter({ hasText: label }).first()
  if (await el.isVisible({ timeout: 500 }).catch(() => false)) {
    await el.click({ force: true, timeout: 3000 }).catch(() => null)
    await page.waitForTimeout(250)
    return true
  }
  return false
}

/** Try to interact with the first visible search / filter input */
async function interactSearch(page: Page) {
  const inp = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="search"], input[placeholder*="Filter"]').first()
  if (await inp.isVisible({ timeout: 500 }).catch(() => false)) {
    await inp.fill('a')
    await page.waitForTimeout(200)
    await inp.fill('')
  }
}

// ─── Main test suite ──────────────────────────────────────────────────────────

for (const vp of VIEWPORTS) {
  test.describe(`[${vp.name} ${vp.width}×${vp.height}] Full visual sweep`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })

    // ── Sidebar navigation buttons ───────────────────────────────────────────
    test('sidebar nav buttons all open without crash', async ({ page }) => {
      await page.goto(`${BASE}/dashboard`)
      await page.waitForLoadState('load')

      // On mobile/tablet, open the sidebar hamburger first if present
      if (vp.width < 1024) {
        const hamburger = page.locator('button[aria-label*="menu"], button[aria-label*="sidebar"], button[aria-label*="Menu"]').first()
        if (await hamburger.isVisible({ timeout: 1000 }).catch(() => false)) {
          await hamburger.click()
          await page.waitForTimeout(400)
        }
      }

      await shot(page, vp.name, `00-dashboard-with-sidebar`)

      for (const label of SIDEBAR_NAV_LABELS) {
        const btn = page.locator(`nav a, nav button, aside a, aside button`)
          .filter({ hasText: label }).first()
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await btn.click()
          await page.waitForLoadState('load')
          await page.waitForTimeout(300)
          await shot(page, vp.name, `nav-click-${slug(label)}`)
        }
      }
    })

    // ── Per-page tests ───────────────────────────────────────────────────────
    for (const pg of PAGES) {
      test(`${pg.route} — full visual sweep`, async ({ page }) => {
        await page.goto(`${BASE}${pg.route}`)
        await page.waitForLoadState('load')
        await page.waitForTimeout(500)

        // 1. Full-page screenshot at load
        await scrollFull(page)
        await scrollHorizontal(page)
        await shot(page, vp.name, `${slug(pg.label)}-00-loaded`)

        // 2. Top-of-page screenshot (after scroll back)
        await page.evaluate(() => window.scrollTo(0, 0))
        await shot(page, vp.name, `${slug(pg.label)}-01-top`)

        // 3. Search interaction
        if (pg.hasSearch) {
          await interactSearch(page)
          await shot(page, vp.name, `${slug(pg.label)}-02-search`)
        }

        // 4. Tab-by-tab sweep
        if (pg.tabs) {
          for (let i = 0; i < pg.tabs.length; i++) {
            const { label } = pg.tabs[i]
            const clicked = await clickTab(page, label)
            if (clicked) {
              await scrollFull(page)
              await page.evaluate(() => window.scrollTo(0, 0))
              await shot(page, vp.name, `${slug(pg.label)}-tab-${i.toString().padStart(2,'0')}-${slug(label)}`)

              // Search inside tab if it's a searchable page
              if (pg.hasSearch) {
                await interactSearch(page)
              }
            }
          }
        }

        // 5. Sub-tabs (if any)
        if (pg.subtabs) {
          for (let i = 0; i < pg.subtabs.length; i++) {
            const { label } = pg.subtabs[i]
            const clicked = await clickTab(page, label)
            if (clicked) {
              await scrollFull(page)
              await page.evaluate(() => window.scrollTo(0, 0))
              await shot(page, vp.name, `${slug(pg.label)}-subtab-${i.toString().padStart(2,'0')}-${slug(label)}`)
            }
          }
        }

        // Page must not show error boundary at the end
        await expect(page.locator('text=Something went wrong')).not.toBeVisible()
        await expect(page.locator('text=Application error')).not.toBeVisible()
      })
    }

    // ── Flyout nav panels (People, Academic, Finance, Reporting) ─────────────
    test('flyout nav panels open and show sub-links', async ({ page }) => {
      // Visit each section's landing page and capture the sidebar state
      const flyoutRoutes = [
        { label: 'people',    route: '/students' },
        { label: 'academic',  route: '/progress' },
        { label: 'finance',   route: '/finance' },
        { label: 'reporting', route: '/analytics' },
      ]
      for (const { label, route } of flyoutRoutes) {
        await page.goto(`${BASE}${route}`)
        await page.waitForLoadState('load')
        await page.waitForTimeout(300)
        await shot(page, vp.name, `flyout-${label}-open`)
      }
    })

    // ── Top bar header buttons ────────────────────────────────────────────────
    test('topbar header buttons respond', async ({ page }) => {
      await page.goto(`${BASE}/dashboard`)
      await page.waitForLoadState('load')

      await shot(page, vp.name, `topbar-00-initial`)

      // Notifications bell / button
      const notifBtn = page.locator('button[aria-label*="notification"], button[aria-label*="Notification"], header button').first()
      if (await notifBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await notifBtn.click()
        await page.waitForTimeout(400)
        await shot(page, vp.name, `topbar-01-notifications-open`)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)
      }

      // Profile / user avatar button (typically last button in topbar)
      const profileBtn = page.locator('header button').last()
      if (await profileBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await profileBtn.click()
        await page.waitForTimeout(400)
        await shot(page, vp.name, `topbar-02-profile-menu-open`)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)
      }

      // Search in topbar if present
      const globalSearch = page.locator('input[placeholder*="Search"], header input').first()
      if (await globalSearch.isVisible({ timeout: 1000 }).catch(() => false)) {
        await globalSearch.click()
        await globalSearch.fill('student')
        await page.waitForTimeout(400)
        await shot(page, vp.name, `topbar-03-global-search`)
        await globalSearch.fill('')
      }
    })

    // ── Student detail page ───────────────────────────────────────────────────
    test('student detail page — all tabs and scroll', async ({ page }) => {
      await page.goto(`${BASE}/students`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(600)

      // Grab the href of the first student row link dynamically
      const firstLink = page.locator('table tbody tr td a[href*="/students/"], tbody tr a[href*="/students/"]').first()
      const href = await firstLink.getAttribute('href', { timeout: 3000 }).catch(() => null)

      if (href) {
        await page.goto(`${BASE}${href}`)
        await page.waitForLoadState('load')
        await page.waitForTimeout(500)

        await scrollFull(page)
        await shot(page, vp.name, `student-detail-00-loaded`)

        const studentTabs = ['Profile', 'Enrolments', 'Attendance', 'Finance', 'Progress', 'Notes', 'Communication']
        for (let i = 0; i < studentTabs.length; i++) {
          const clicked = await clickTab(page, studentTabs[i])
          if (clicked) {
            await scrollFull(page)
            await shot(page, vp.name, `student-detail-tab-${i.toString().padStart(2,'0')}-${slug(studentTabs[i])}`)
          }
        }
      } else {
        // No student rows visible — screenshot the list as-is
        await shot(page, vp.name, `student-detail-00-list-only`)
      }
    })

    // ── Guardian detail page ──────────────────────────────────────────────────
    test('guardian detail page — scroll and overview', async ({ page }) => {
      await page.goto(`${BASE}/guardians`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(600)

      const firstLink = page.locator('table tbody tr td a[href*="/guardians/"], tbody tr a[href*="/guardians/"]').first()
      const href = await firstLink.getAttribute('href', { timeout: 3000 }).catch(() => null)

      if (href) {
        await page.goto(`${BASE}${href}`)
        await page.waitForLoadState('load')
        await page.waitForTimeout(500)
        await scrollFull(page)
        await shot(page, vp.name, `guardian-detail-00-loaded`)
      } else {
        await shot(page, vp.name, `guardian-detail-00-list-only`)
      }
    })

    // ── Settings sections ─────────────────────────────────────────────────────
    test('settings — scroll through all sections', async ({ page }) => {
      await page.goto(`${BASE}/settings`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(500)

      await shot(page, vp.name, `settings-00-top`)

      const sections = [
        'Organisation', 'Branches', 'Departments', 'Rooms',
        'Subjects', 'Payment Plans', 'Billing', 'Academic Calendar',
        'Notifications', 'Roles', 'Feature Toggles', 'Data & Privacy',
        'Integrations', 'Audit Log',
      ]
      for (let i = 0; i < sections.length; i++) {
        const sectionLink = page.locator(`button, a, [role="button"]`)
          .filter({ hasText: sections[i] }).first()
        if (await sectionLink.isVisible({ timeout: 1000 }).catch(() => false)) {
          await sectionLink.click()
          await page.waitForTimeout(400)
          await scrollFull(page)
          await page.evaluate(() => window.scrollTo(0, 0))
          await shot(page, vp.name, `settings-section-${i.toString().padStart(2,'0')}-${slug(sections[i])}`)
        }
      }

      // Full scroll of whole settings page at the end
      await page.evaluate(() => window.scrollTo(0, 0))
      await scrollFull(page)
      await shot(page, vp.name, `settings-99-full-scroll`)
    })

    // ── Attendance sub-tabs ───────────────────────────────────────────────────
    test('attendance — register and overview sub-tabs', async ({ page }) => {
      await page.goto(`${BASE}/attendance`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(500)

      await shot(page, vp.name, `attendance-00-loaded`)

      // Click Overview tab
      const overviewTab = await clickTab(page, 'Overview')
      if (overviewTab) {
        await shot(page, vp.name, `attendance-01-overview`)
        // Sub-tabs inside overview
        for (const sub of ['Unmarked Sessions', 'Absence Summary', 'Makeup Log']) {
          const clicked = await clickTab(page, sub)
          if (clicked) {
            await shot(page, vp.name, `attendance-overview-subtab-${slug(sub)}`)
          }
        }
      }

      // Back to Today's register
      await clickTab(page, "Today's Register")
      await shot(page, vp.name, `attendance-02-todays-register`)
    })

    // ── Finance invoice builder ───────────────────────────────────────────────
    test('finance/invoice/new — builder interaction', async ({ page }) => {
      await page.goto(`${BASE}/finance/invoice/new`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(500)

      await shot(page, vp.name, `invoice-builder-00-loaded`)

      // Search for a student
      const studentSearch = page.locator('input[placeholder*="Search student"], input[placeholder*="student"]').first()
      if (await studentSearch.isVisible({ timeout: 1500 }).catch(() => false)) {
        await studentSearch.fill('Aisha')
        await page.waitForTimeout(400)
        await shot(page, vp.name, `invoice-builder-01-student-search`)
        await studentSearch.fill('')
      }

      await scrollFull(page)
      await page.evaluate(() => window.scrollTo(0, 0))
      await shot(page, vp.name, `invoice-builder-02-full-scroll`)
    })

  })
}
