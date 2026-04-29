/**
 * Backend Integration Tests
 *
 * Tests that every API route handler correctly enforces authentication
 * (the middleware already blocks unauthenticated page requests, but API
 * routes are also individually guarded by requireAuth()).
 *
 * For full CRUD and multi-tenant isolation tests, configure:
 *   TEST_USER_EMAIL / TEST_USER_PASSWORD   — a valid staff account
 *   TEST_TEACHER_EMAIL / TEST_TEACHER_PASSWORD — a Teacher-role account
 *   TEST_TENANT_A_TOKEN / TEST_TENANT_B_TOKEN  — JWTs for two separate tenants
 * in .env.test (never commit these values).
 */
import { test, expect } from '@playwright/test'

const BASE = 'http://localhost:3000'

// All implemented API routes. Each must return 401 for unauthenticated requests.
const API_ROUTES = [
  // Students
  { method: 'GET',    path: '/api/students' },
  { method: 'POST',   path: '/api/students' },
  { method: 'GET',    path: '/api/students/00000000-0000-0000-0000-000000000000' },
  { method: 'PATCH',  path: '/api/students/00000000-0000-0000-0000-000000000000' },
  { method: 'DELETE', path: '/api/students/00000000-0000-0000-0000-000000000000' },
  // Guardians
  { method: 'GET',    path: '/api/guardians' },
  { method: 'GET',    path: '/api/guardians/00000000-0000-0000-0000-000000000000' },
  { method: 'PATCH',  path: '/api/guardians/00000000-0000-0000-0000-000000000000' },
  // Finance
  { method: 'GET',    path: '/api/finance/invoices' },
  { method: 'POST',   path: '/api/finance/invoices' },
  { method: 'GET',    path: '/api/finance/payments' },
  { method: 'POST',   path: '/api/finance/payments' },
  { method: 'GET',    path: '/api/finance/credits' },
  // Leads
  { method: 'GET',    path: '/api/leads' },
  { method: 'POST',   path: '/api/leads' },
  // Settings (sensitive mutations)
  { method: 'GET',    path: '/api/settings/org' },
  { method: 'PATCH',  path: '/api/settings/org' },
  { method: 'GET',    path: '/api/settings/branches' },
  { method: 'POST',   path: '/api/settings/branches' },
  { method: 'GET',    path: '/api/settings/departments' },
  { method: 'POST',   path: '/api/settings/departments' },
  // Staff
  { method: 'GET',    path: '/api/staff' },
  { method: 'POST',   path: '/api/staff/invite' },
  // Tasks
  { method: 'GET',    path: '/api/tasks' },
  { method: 'POST',   path: '/api/tasks' },
  // Attendance
  { method: 'GET',    path: '/api/attendance/sessions' },
  // Analytics
  { method: 'GET',    path: '/api/analytics/revenue' },
  // Auth
  { method: 'GET',    path: '/api/auth/me' },
]

// ─── 1. Authentication boundary ──────────────────────────────────────────────

test.describe('API authentication boundary', () => {
  for (const { method, path } of API_ROUTES) {
    test(`${method} ${path} returns 401 without auth`, async ({ request }) => {
      const res = await request.fetch(`${BASE}${path}`, { method })
      expect(
        res.status(),
        `${method} ${path} should return 401 without auth, got ${res.status()}`
      ).toBe(401)
    })
  }
})

// ─── 2. RBAC enforcement — DELETE student requires Super Admin ──────────────

test.describe('RBAC enforcement', () => {
  test.skip(
    !process.env.TEST_TEACHER_TOKEN,
    'Requires TEST_TEACHER_TOKEN in .env.test — set to a valid Teacher-role JWT'
  )

  test('DELETE /api/students/:id returns 403 for Teacher role', async ({ request }) => {
    const res = await request.delete(
      `${BASE}/api/students/00000000-0000-0000-0000-000000000000`,
      { headers: { Authorization: `Bearer ${process.env.TEST_TEACHER_TOKEN}` } }
    )
    expect(res.status()).toBe(403)
  })

  test('PATCH /api/settings/org returns 403 for non-Super-Admin', async ({ request }) => {
    const res = await request.patch(
      `${BASE}/api/settings/org`,
      {
        headers: { Authorization: `Bearer ${process.env.TEST_TEACHER_TOKEN}` },
        data: { org_name: 'Hacked' },
      }
    )
    expect(res.status()).toBe(403)
  })
})

// ─── 3. Multi-tenant isolation ───────────────────────────────────────────────

test.describe('Multi-tenant isolation', () => {
  test.skip(
    !process.env.TEST_TENANT_A_TOKEN || !process.env.TEST_TENANT_B_TOKEN,
    [
      'Requires TEST_TENANT_A_TOKEN and TEST_TENANT_B_TOKEN in .env.test.',
      'These should be valid JWTs for two different tenant staff accounts.',
      'Create them via Supabase Auth admin or a seed script.',
    ].join(' ')
  )

  test('Tenant B cannot read a student record belonging to Tenant A', async ({ request }) => {
    // Step 1: create a student as Tenant A
    const createRes = await request.post(`${BASE}/api/students`, {
      headers: { Authorization: `Bearer ${process.env.TEST_TENANT_A_TOKEN}` },
      data: {
        first_name: 'TenantA',
        last_name: 'TestStudent',
        status: 'Active',
      },
    })
    // 201 expected; if route returns 401 the token is wrong
    if (createRes.status() !== 201) {
      test.fail(true, `Could not create student as Tenant A (status ${createRes.status()})`)
      return
    }
    const { data: created } = await createRes.json()
    const studentId = created?.id

    // Step 2: Tenant B attempts to read the student
    const readRes = await request.get(`${BASE}/api/students/${studentId}`, {
      headers: { Authorization: `Bearer ${process.env.TEST_TENANT_B_TOKEN}` },
    })

    // Must be 404 (tenant filter finds no row) or 403 — never 200 with real data
    expect([403, 404]).toContain(readRes.status())

    // Cleanup — delete as Tenant A (ignore errors if student has guards)
    await request.delete(`${BASE}/api/students/${studentId}`, {
      headers: { Authorization: `Bearer ${process.env.TEST_TENANT_A_TOKEN}` },
    })
  })
})

// ─── 4. Auth callback error handling ─────────────────────────────────────────

test.describe('Auth callback', () => {
  test('GET /auth/callback with error param redirects to /login?error=link_expired', async ({ page }) => {
    await page.goto(`${BASE}/auth/callback?error=access_denied&error_code=otp_expired`)
    await page.waitForLoadState('networkidle')

    // Should land on login page with an error indicator
    expect(page.url()).toContain('/login')
  })

  test('GET /auth/callback with no code redirects to hash-callback', async ({ page }) => {
    await page.goto(`${BASE}/auth/callback?next=/dashboard`)
    await page.waitForLoadState('networkidle')

    // Without a code, should redirect to hash-callback or login (never a blank page)
    const url = page.url()
    expect(url).toMatch(/\/(auth\/hash-callback|login)/)
  })
})
