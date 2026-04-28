/**
 * Admin Head — Full Visual Sweep
 * Covers every page, tab, search bar, nav button, settings section,
 * and profile section accessible to the Admin Head role.
 * Screenshots saved to playwright-screenshots/adminhead/{desktop|tablet|mobile}/
 */
import { test, expect, Page } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const BASE = 'http://localhost:3000'

// ─── Viewport profiles ────────────────────────────────────────────────────────
const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'mobile',  width: 390,  height: 844 },
]

// ─── All pages accessible to Admin Head (Settings excluded — Super Admin only) ─
const PAGES: Array<{
  route: string
  label: string
  tabs?: string[]
  hasSearch?: boolean
}> = [
  { route: '/dashboard',    label: 'dashboard' },
  { route: '/students',     label: 'students',    hasSearch: true },
  { route: '/guardians',    label: 'guardians',   hasSearch: true },
  { route: '/leads',        label: 'leads',       hasSearch: true },
  { route: '/enrolment',    label: 'enrolment',   hasSearch: true },
  { route: '/assessments',  label: 'assessments' },
  { route: '/timetable',    label: 'timetable' },
  {
    route: '/attendance',
    label: 'attendance',
    tabs: ["Today's Register", 'Overview'],
  },
  {
    route: '/feedback',
    label: 'feedback',
    tabs: ['Feedback Queue', 'Class Discussion'],
  },
  {
    route: '/progress',
    label: 'progress',
    tabs: ['Trackers', 'Reports', 'Alerts', 'Assignments'],
  },
  {
    route: '/finance',
    label: 'finance',
    hasSearch: true,
    tabs: ['Invoices', 'Payments', 'Credits', 'Unbilled', 'Reports'],
  },
  { route: '/finance/invoice/new', label: 'finance-invoice-new' },
  { route: '/tasks',        label: 'tasks',       hasSearch: true },
  {
    route: '/staff',
    label: 'staff',
    hasSearch: true,
    tabs: ['Directory', 'HR Dashboard'],
  },
  {
    route: '/analytics',
    label: 'analytics',
    tabs: ['Revenue', 'Occupancy', 'Churn', 'Staff'],
  },
  { route: '/reports',      label: 'reports' },
  {
    route: '/people',
    label: 'people',
    hasSearch: true,
    tabs: ['Overview', 'Duplicates', 'Segments', 'Broadcast Lists', 'Forms', 'Exports'],
  },
  {
    route: '/automations',
    label: 'automations',
    tabs: ['Templates', 'Rules', 'Trigger Library', 'Dispatch Queue', 'Internal Messages', 'Marketing', 'Execution Log'],
  },
  {
    route: '/inventory',
    label: 'inventory',
    hasSearch: true,
    tabs: ['Catalogue', 'Reorder Alerts', 'Stock Ledger', 'Suppliers'],
  },
  {
    route: '/communications',
    label: 'communications',
    tabs: ['Announcements', 'Concerns & Tickets', 'Surveys'],
  },
  {
    route: '/profile',
    label: 'profile',
    tabs: ['Account', 'Activity', 'Preferences', 'CPD Log', 'Staff Directory'],
  },
]

// ─── Sidebar nav labels to click ──────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  'Dashboard',
  'Timetable',
  'Attendance',
  'Tasks',
  'Automations',
  'Inventory',
  'Staff',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function shotDir(viewport: string): string {
  return path.join(process.cwd(), 'playwright-screenshots', 'adminhead', viewport)
}

function slug(s: string) {
  return s.replace(/[^a-z0-9]+/gi, '-').toLowerCase()
}

async function shot(page: Page, viewport: string, name: string) {
  const dir = shotDir(viewport)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  await page.screenshot({
    path: path.join(dir, `${name}.png`),
    fullPage: true,
  })
}

async function scrollFull(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(300)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(200)
}

async function scrollHorizontal(page: Page) {
  await page.evaluate(() => {
    document.querySelectorAll<HTMLElement>('*').forEach(el => {
      if (el.scrollWidth > el.clientWidth + 10) {
        el.scrollLeft = el.scrollWidth
        setTimeout(() => { el.scrollLeft = 0 }, 200)
      }
    })
  })
  await page.waitForTimeout(300)
}

async function tryClickTab(page: Page, label: string): Promise<boolean> {
  const el = page.locator('[role="tab"], button, a').filter({ hasText: new RegExp(`^${label}$`, 'i') }).first()
  const visible = await el.isVisible({ timeout: 1500 }).catch(() => false)
  if (visible) {
    await el.click({ force: true, timeout: 5000 }).catch(() => null)
    await page.waitForTimeout(400)
    return true
  }
  // fuzzy fallback
  const fuzzy = page.locator('[role="tab"], button, a').filter({ hasText: label }).first()
  const fVisible = await fuzzy.isVisible({ timeout: 800 }).catch(() => false)
  if (fVisible) {
    await fuzzy.click({ force: true, timeout: 5000 }).catch(() => null)
    await page.waitForTimeout(400)
    return true
  }
  return false
}

async function trySearch(page: Page, query = 'a') {
  const inp = page
    .locator('input[type="search"], input[placeholder*="Search" i], input[placeholder*="Filter" i], input[placeholder*="search" i]')
    .first()
  if (await inp.isVisible({ timeout: 1000 }).catch(() => false)) {
    await inp.fill(query)
    await page.waitForTimeout(300)
    await inp.fill('')
    await page.waitForTimeout(150)
  }
}

async function ensureLoggedIn(page: Page) {
  if (page.url().includes('/login')) {
    await page.fill('#email', 'test.adminhead@enrolla.com')
    await page.fill('#password', 'AdminHead@123')
    await page.click('button[type="submit"]')
    await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 20_000 })
    await page.waitForLoadState('load')
  }
}

async function openMobileSidebar(page: Page, vpWidth: number) {
  if (vpWidth < 1024) {
    const btn = page.locator('button[aria-label*="menu" i], button[aria-label*="sidebar" i], button[aria-label*="Menu" i]').first()
    if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await btn.click()
      await page.waitForTimeout(500)
    }
  }
}

// ─── Test suite (one per viewport) ───────────────────────────────────────────

for (const vp of VIEWPORTS) {
  test.describe(`[Admin Head] ${vp.name} ${vp.width}×${vp.height}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } })

    // ── 01 Login verification ─────────────────────────────────────────────────
    test('01 login and land on dashboard', async ({ page }) => {
      await page.goto(`${BASE}/dashboard`)
      await page.waitForLoadState('load')
      await ensureLoggedIn(page)
      await page.waitForTimeout(500)

      await scrollFull(page)
      await shot(page, vp.name, `01-dashboard-loaded`)

      // Verify no crash
      await expect(page.locator('text=Something went wrong')).not.toBeVisible()
      await expect(page.locator('text=Application error')).not.toBeVisible()
    })

    // ── 02 Sidebar nav items ──────────────────────────────────────────────────
    test('02 sidebar navigation buttons', async ({ page }) => {
      await page.goto(`${BASE}/dashboard`)
      await page.waitForLoadState('load')
      await ensureLoggedIn(page)

      await openMobileSidebar(page, vp.width)
      await shot(page, vp.name, `02-sidebar-open`)

      for (const label of SIDEBAR_ITEMS) {
        const btn = page.locator('nav a, nav button, aside a, aside button').filter({ hasText: label }).first()
        if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
          await btn.click()
          await page.waitForLoadState('load')
          await page.waitForTimeout(400)
          await shot(page, vp.name, `02-sidebar-click-${slug(label)}`)
        }
      }
    })

    // ── 03 Flyout panels (People, Academic, Finance, Reporting) ───────────────
    test('03 flyout panels open correctly', async ({ page }) => {
      const flyouts = [
        { label: 'students',   route: '/students' },
        { label: 'finance',    route: '/finance' },
        { label: 'progress',   route: '/progress' },
        { label: 'analytics',  route: '/analytics' },
        { label: 'people',     route: '/people' },
      ]
      for (const { label, route } of flyouts) {
        await page.goto(`${BASE}${route}`)
        await page.waitForLoadState('load')
        await page.waitForTimeout(400)
        await shot(page, vp.name, `03-flyout-${label}`)
      }
    })

    // ── 04 Topbar header buttons ──────────────────────────────────────────────
    test('04 topbar buttons — notifications and profile menu', async ({ page }) => {
      await page.goto(`${BASE}/dashboard`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(500)

      await shot(page, vp.name, `04-topbar-initial`)

      // Notification button
      const notifBtn = page.locator('header button, [data-testid="notifications"]').filter({ hasText: '' }).nth(0)
      const allHeaderBtns = page.locator('header button')
      const headerCount = await allHeaderBtns.count()
      if (headerCount > 0) {
        // Click the first header button (usually notifications)
        await allHeaderBtns.first().click().catch(() => null)
        await page.waitForTimeout(400)
        await shot(page, vp.name, `04-topbar-first-btn-click`)
        await page.keyboard.press('Escape')
        await page.waitForTimeout(200)

        // Click last header button (usually profile/avatar)
        if (headerCount > 1) {
          await allHeaderBtns.last().click().catch(() => null)
          await page.waitForTimeout(400)
          await shot(page, vp.name, `04-topbar-profile-menu`)
          await page.keyboard.press('Escape')
          await page.waitForTimeout(200)
        }
      }

      // Global search if present
      const globalSearch = page.locator('input[placeholder*="Search" i], header input').first()
      if (await globalSearch.isVisible({ timeout: 1000 }).catch(() => false)) {
        await globalSearch.click()
        await globalSearch.fill('test')
        await page.waitForTimeout(400)
        await shot(page, vp.name, `04-topbar-global-search`)
        await globalSearch.fill('')
      }
    })

    // ── 05-N Per-page full sweeps ─────────────────────────────────────────────
    for (let idx = 0; idx < PAGES.length; idx++) {
      const pg = PAGES[idx]
      const num = String(idx + 5).padStart(2, '0')

      test(`${num} page: ${pg.route}`, async ({ page }) => {
        await page.goto(`${BASE}${pg.route}`)
        await page.waitForLoadState('load')
        await page.waitForTimeout(600)

        // Full scroll + horizontal scroll
        await scrollFull(page)
        await scrollHorizontal(page)
        await page.evaluate(() => window.scrollTo(0, 0))
        await shot(page, vp.name, `${num}-${slug(pg.label)}-00-top`)

        // Bottom of page
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        await page.waitForTimeout(200)
        await shot(page, vp.name, `${num}-${slug(pg.label)}-01-bottom`)
        await page.evaluate(() => window.scrollTo(0, 0))

        // Search bar interaction
        if (pg.hasSearch) {
          await trySearch(page)
          await shot(page, vp.name, `${num}-${slug(pg.label)}-02-search`)
        }

        // Tab-by-tab sweep
        if (pg.tabs) {
          for (let ti = 0; ti < pg.tabs.length; ti++) {
            const tabLabel = pg.tabs[ti]
            const clicked = await tryClickTab(page, tabLabel)
            if (clicked) {
              await scrollFull(page)
              await page.evaluate(() => window.scrollTo(0, 0))
              await shot(page, vp.name, `${num}-${slug(pg.label)}-tab${String(ti).padStart(2,'0')}-${slug(tabLabel)}`)
            }
          }
        }

        // Confirm no error boundary
        await expect(page.locator('text=Something went wrong')).not.toBeVisible()
        await expect(page.locator('text=Application error')).not.toBeVisible()
      })
    }

    // ── Student detail — all tabs ─────────────────────────────────────────────
    test('sd student detail all tabs', async ({ page }) => {
      await page.goto(`${BASE}/students`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(800)

      const firstLink = page.locator('table tbody tr a[href*="/students/"], tbody a[href*="/students/"]').first()
      const href = await firstLink.getAttribute('href', { timeout: 5000 }).catch(() => null)

      if (href) {
        await page.goto(`${BASE}${href}`)
        await page.waitForLoadState('load')
        await page.waitForTimeout(600)
        await scrollFull(page)
        await shot(page, vp.name, `sd-student-detail-00-loaded`)

        for (const tab of ['Profile', 'Enrolments', 'Attendance', 'Finance', 'Progress', 'Notes', 'Communication']) {
          const clicked = await tryClickTab(page, tab)
          if (clicked) {
            await scrollFull(page)
            await page.evaluate(() => window.scrollTo(0, 0))
            await shot(page, vp.name, `sd-student-detail-tab-${slug(tab)}`)
          }
        }
      } else {
        await shot(page, vp.name, `sd-student-detail-no-data`)
      }
    })

    // ── Guardian detail ───────────────────────────────────────────────────────
    test('gd guardian detail', async ({ page }) => {
      await page.goto(`${BASE}/guardians`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(800)

      const firstLink = page.locator('table tbody tr a[href*="/guardians/"], tbody a[href*="/guardians/"]').first()
      const href = await firstLink.getAttribute('href', { timeout: 5000 }).catch(() => null)

      if (href) {
        await page.goto(`${BASE}${href}`)
        await page.waitForLoadState('load')
        await page.waitForTimeout(600)
        await scrollFull(page)
        await shot(page, vp.name, `gd-guardian-detail-loaded`)
      } else {
        await shot(page, vp.name, `gd-guardian-detail-no-data`)
      }
    })

    // ── Attendance sub-tabs (nested) ──────────────────────────────────────────
    test('at attendance nested sub-tabs', async ({ page }) => {
      await page.goto(`${BASE}/attendance`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(600)

      await shot(page, vp.name, `at-attendance-initial`)

      await tryClickTab(page, 'Overview')
      await page.waitForTimeout(300)
      await shot(page, vp.name, `at-attendance-overview`)

      for (const sub of ['Unmarked Sessions', 'Absence Summary', 'Makeup Log']) {
        const clicked = await tryClickTab(page, sub)
        if (clicked) {
          await scrollFull(page)
          await shot(page, vp.name, `at-attendance-overview-${slug(sub)}`)
        }
      }

      await tryClickTab(page, "Today's Register")
      await page.waitForTimeout(300)
      await shot(page, vp.name, `at-attendance-register`)
    })

    // ── Finance invoice builder ───────────────────────────────────────────────
    test('fi finance invoice builder', async ({ page }) => {
      await page.goto(`${BASE}/finance/invoice/new`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(600)

      await shot(page, vp.name, `fi-invoice-builder-top`)

      const studentSearch = page.locator('input[placeholder*="student" i], input[placeholder*="Search student" i]').first()
      if (await studentSearch.isVisible({ timeout: 2000 }).catch(() => false)) {
        await studentSearch.fill('Aisha')
        await page.waitForTimeout(500)
        await shot(page, vp.name, `fi-invoice-builder-student-search`)
        await studentSearch.fill('')
      }

      await scrollFull(page)
      await page.evaluate(() => window.scrollTo(0, 0))
      await shot(page, vp.name, `fi-invoice-builder-scrolled`)
    })

    // ── Profile page — all sections ───────────────────────────────────────────
    test('pr profile page all tabs', async ({ page }) => {
      await page.goto(`${BASE}/profile`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(600)

      await shot(page, vp.name, `pr-profile-loaded`)

      for (const tab of ['Account', 'Activity', 'Preferences', 'CPD Log', 'Staff Directory']) {
        const clicked = await tryClickTab(page, tab)
        if (clicked) {
          await scrollFull(page)
          await page.evaluate(() => window.scrollTo(0, 0))
          await shot(page, vp.name, `pr-profile-tab-${slug(tab)}`)
        }
      }
    })

    // ── Automations tabs deep dive ────────────────────────────────────────────
    test('au automations all tabs', async ({ page }) => {
      await page.goto(`${BASE}/automations`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(600)

      await shot(page, vp.name, `au-automations-loaded`)

      for (const tab of ['Templates', 'Rules', 'Trigger Library', 'Dispatch Queue', 'Internal Messages', 'Marketing', 'Execution Log']) {
        const clicked = await tryClickTab(page, tab)
        if (clicked) {
          await scrollFull(page)
          await page.evaluate(() => window.scrollTo(0, 0))
          await shot(page, vp.name, `au-automations-tab-${slug(tab)}`)
        }
      }
    })

    // ── People tabs deep dive ─────────────────────────────────────────────────
    test('pe people all tabs', async ({ page }) => {
      await page.goto(`${BASE}/people`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(600)

      await shot(page, vp.name, `pe-people-loaded`)

      for (const tab of ['Overview', 'Duplicates', 'Segments', 'Broadcast Lists', 'Forms', 'Exports']) {
        const clicked = await tryClickTab(page, tab)
        if (clicked) {
          await scrollFull(page)
          await page.evaluate(() => window.scrollTo(0, 0))
          await shot(page, vp.name, `pe-people-tab-${slug(tab)}`)
        }
      }
    })

    // ── Inventory tabs ────────────────────────────────────────────────────────
    test('in inventory all tabs', async ({ page }) => {
      await page.goto(`${BASE}/inventory`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(600)

      await shot(page, vp.name, `in-inventory-loaded`)

      for (const tab of ['Catalogue', 'Reorder Alerts', 'Stock Ledger', 'Suppliers']) {
        const clicked = await tryClickTab(page, tab)
        if (clicked) {
          await scrollFull(page)
          await page.evaluate(() => window.scrollTo(0, 0))
          await shot(page, vp.name, `in-inventory-tab-${slug(tab)}`)
        }
      }
    })

    // ── Settings — Admin Head cannot access (should show access-denied) ────────
    test('se settings access denied for admin head', async ({ page }) => {
      await page.goto(`${BASE}/settings`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(600)
      await shot(page, vp.name, `se-settings-access-check`)
    })

    // ── Responsive: verify no horizontal overflow on key pages ────────────────
    test('re responsive no horizontal overflow', async ({ page }) => {
      const checkPages = ['/dashboard', '/students', '/finance', '/staff', '/analytics']
      for (const route of checkPages) {
        await page.goto(`${BASE}${route}`)
        await page.waitForLoadState('load')
        await page.waitForTimeout(400)

        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth
        })

        if (hasOverflow) {
          await shot(page, vp.name, `re-overflow-${slug(route)}-ISSUE`)
          console.warn(`[OVERFLOW] ${route} has horizontal overflow at ${vp.width}px`)
        } else {
          await shot(page, vp.name, `re-overflow-${slug(route)}-ok`)
        }
      }
    })

    // ── All buttons on dashboard (click each, screenshot, escape) ─────────────
    test('bu dashboard button interactions', async ({ page }) => {
      await page.goto(`${BASE}/dashboard`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(600)

      await shot(page, vp.name, `bu-dashboard-buttons-initial`)

      // Click any visible action buttons in the page content area (not nav)
      const actionBtns = page.locator('main button, main [role="button"]').filter({ hasText: /\S/ })
      const count = await actionBtns.count()
      const maxBtns = Math.min(count, 10) // cap at 10 to avoid infinite loops

      for (let i = 0; i < maxBtns; i++) {
        const btn = actionBtns.nth(i)
        if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
          const text = await btn.textContent().catch(() => '')
          await btn.click({ force: true, timeout: 3000 }).catch(() => null)
          await page.waitForTimeout(300)
          await shot(page, vp.name, `bu-dashboard-btn${i}-${slug(text?.trim() ?? String(i))}`)
          await page.keyboard.press('Escape')
          await page.waitForTimeout(200)
        }
      }
    })

    // ── Communications page ───────────────────────────────────────────────────
    test('co communications all tabs', async ({ page }) => {
      await page.goto(`${BASE}/communications`)
      await page.waitForLoadState('load')
      await page.waitForTimeout(600)

      await shot(page, vp.name, `co-communications-loaded`)

      for (const tab of ['Announcements', 'Concerns & Tickets', 'Surveys']) {
        const clicked = await tryClickTab(page, tab)
        if (clicked) {
          await scrollFull(page)
          await page.evaluate(() => window.scrollTo(0, 0))
          await shot(page, vp.name, `co-communications-tab-${slug(tab)}`)
        }
      }
    })

  })
}
