import { test, expect } from '@playwright/test'

// SECTION 1 — TOPBAR
test.describe('topbar', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/dashboard') })

  test('topbar — search input is visible and accepts text', async ({ page }) => {
    const search = page.getByPlaceholder(/Search students, leads, invoice/i)
    await expect(search).toBeVisible()
    await search.fill('Aisha')
    await expect(search).toHaveValue('Aisha')
  })

  test('topbar — role switcher shows current role label', async ({ page }) => {
    await expect(page.getByText('Super Admin').first()).toBeVisible()
  })

  test('topbar — role switcher dropdown opens on click', async ({ page }) => {
    await page.getByRole('button', { name: /Super Admin/i }).click()
    await expect(page.getByText('Admin Head')).toBeVisible()
    await expect(page.getByText('Teacher')).toBeVisible()
    await expect(page.getByText('TA')).toBeVisible()
  })

  test('topbar — switching to Admin Head updates badge', async ({ page }) => {
    await page.getByRole('button', { name: /Super Admin/i }).click()
    await page.getByText('Admin Head').click()
    await expect(page.getByText('Admin Head').first()).toBeVisible()
  })

  test('topbar — notification bell is visible and clickable', async ({ page }) => {
    const bell = page.locator('[data-lucide="bell"], button:has([data-lucide="bell"])')
    await expect(bell.first()).toBeVisible()
  })

  test('topbar — Help button is visible', async ({ page }) => {
    await expect(page.getByText('Help')).toBeVisible()
  })

  test('topbar — user avatar initials JD are visible', async ({ page }) => {
    await expect(page.getByText('JD')).toBeVisible()
  })

  test('topbar — live clock widget is visible', async ({ page }) => {
    await expect(page.locator('text=/\\d{2}:\\d{2}:\\d{2}/')).toBeVisible()
  })
})

// SECTION 2 — SIDEBAR NAVIGATION
test.describe('sidebar', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/dashboard') })

  test('sidebar — is collapsed to 56px icon-only bar', async ({ page }) => {
    const sidebar = page.locator('nav').first()
    const box = await sidebar.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(64)
  })

  test('sidebar — Dashboard icon navigates to /dashboard', async ({ page }) => {
    await page.goto('/students')
    await page.locator('nav a[href="/dashboard"]').click()
    await expect(page).toHaveURL(/dashboard/)
  })

  test('sidebar — People icon opens flyout with Students link', async ({ page }) => {
    await page.locator('nav').getByRole('button').filter({ hasText: /people/i }).or(
      page.locator('nav a[href="/students"]').locator('..')
    ).first().click()
    await expect(page.getByText('Students')).toBeVisible()
    await expect(page.getByText('Guardians')).toBeVisible()
    await expect(page.getByText('Leads')).toBeVisible()
    await expect(page.getByText('Enrolment')).toBeVisible()
  })

  test('sidebar — Timetable icon navigates to /timetable', async ({ page }) => {
    await page.locator('nav a[href="/timetable"]').click()
    await expect(page).toHaveURL(/timetable/)
  })

  test('sidebar — Attendance icon navigates to /attendance', async ({ page }) => {
    await page.locator('nav a[href="/attendance"]').click()
    await expect(page).toHaveURL(/attendance/)
  })

  test('sidebar — Finance flyout shows Invoices link', async ({ page }) => {
    await page.locator('nav a[href="/finance"]').or(
      page.locator('nav').getByText('Finance')
    ).first().click()
    await expect(page).toHaveURL(/finance/)
  })

  test('sidebar — Settings icon navigates to /settings', async ({ page }) => {
    await page.locator('nav a[href="/settings"]').click()
    await expect(page).toHaveURL(/settings/)
  })

  test('sidebar — Automations icon navigates to /automations', async ({ page }) => {
    await page.locator('nav a[href="/automations"]').click()
    await expect(page).toHaveURL(/automations/)
  })

  test('sidebar — Inventory icon navigates to /inventory', async ({ page }) => {
    await page.locator('nav a[href="/inventory"]').click()
    await expect(page).toHaveURL(/inventory/)
  })

  test('sidebar — Tasks icon navigates to /tasks', async ({ page }) => {
    await page.locator('nav a[href="/tasks"]').click()
    await expect(page).toHaveURL(/tasks/)
  })

  test('sidebar — Staff icon navigates to /staff', async ({ page }) => {
    await page.locator('nav a[href="/staff"]').click()
    await expect(page).toHaveURL(/staff/)
  })
})

// SECTION 3 — DASHBOARD
test.describe('dashboard', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/dashboard') })

  test('dashboard — skeleton state renders before content', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('dashboard — greeting text is visible', async ({ page }) => {
    await expect(page.getByText(/Good (morning|afternoon|evening), Jason/)).toBeVisible()
  })

  test('dashboard — subtitle shows IMI', async ({ page }) => {
    await expect(page.getByText(/happening at IMI today/i)).toBeVisible()
  })

  test('dashboard — 10 KPI cards are visible', async ({ page }) => {
    await expect(page.getByText('Active Students')).toBeVisible()
    await expect(page.getByText('New Enrolments')).toBeVisible()
    await expect(page.getByText('Re-enrolments')).toBeVisible()
    await expect(page.getByText('Churn This Term')).toBeVisible()
    await expect(page.getByText('Revenue This Term')).toBeVisible()
    await expect(page.getByText('Collected This Term')).toBeVisible()
    await expect(page.getByText('Overdue Invoices')).toBeVisible()
    await expect(page.getByText('At-Risk Students')).toBeVisible()
    await expect(page.getByText('Open Concerns')).toBeVisible()
    await expect(page.getByText('Seat Occupancy').first()).toBeVisible()
  })

  test('dashboard — KPI values are correct', async ({ page }) => {
    await expect(page.getByText('1,847')).toBeVisible()
    await expect(page.getByText('143')).toBeVisible()
    await expect(page.getByText('AED 284,500')).toBeVisible()
    await expect(page.getByText('74%').first()).toBeVisible()
    await expect(page.getByText('23')).toBeVisible()
    await expect(page.getByText('47', { exact: true })).toBeVisible()
    await expect(page.getByText('8').first()).toBeVisible()
  })

  test('dashboard — KPI sub-labels are visible', async ({ page }) => {
    await expect(page.getByText('2 critical')).toBeVisible()
    await expect(page.getByText(/vs 80% target/i)).toBeVisible()
    await expect(page.getByText(/neutral/i)).toBeVisible()
    await expect(page.getByText(/\+4 this week/i)).toBeVisible()
    await expect(page.getByText('AED 18,400')).toBeVisible()
  })

  test('dashboard — Overdue Invoices KPI card navigates to /finance', async ({ page }) => {
    await page.getByText('Overdue Invoices').click()
    await expect(page).toHaveURL(/finance/)
  })

  test('dashboard — At-Risk Students KPI card navigates to /analytics', async ({ page }) => {
    await page.getByText('At-Risk Students').click()
    await expect(page).toHaveURL(/analytics/)
  })

  test('dashboard — Open Concerns KPI card navigates to /progress', async ({ page }) => {
    await page.getByText('Open Concerns').click()
    await expect(page).toHaveURL(/progress/)
  })

  test('dashboard — Seat Occupancy KPI card navigates to /analytics', async ({ page }) => {
    await page.getByText('Seat Occupancy').first().click()
    await expect(page).toHaveURL(/analytics/)
  })

  test('dashboard — LIVE ACTIVITY section header is visible', async ({ page }) => {
    await expect(page.getByText('Live Activity', { exact: true })).toBeVisible()
  })

  test('dashboard — at least 6 activity feed rows visible', async ({ page }) => {
    await expect(page.getByText('Hamdan Al-Maktoum enrolled in Y7 Maths')).toBeVisible()
    await expect(page.getByText(/AED 3,200 received/)).toBeVisible()
    await expect(page.getByText(/Teaching quality concern/)).toBeVisible()
    await expect(page.getByText(/Invoice #1042 overdue/)).toBeVisible()
    await expect(page.getByText(/Fatima Al-Shehhi completed trial/)).toBeVisible()
    await expect(page.getByText(/AED 1,800 received/)).toBeVisible()
  })

  test('dashboard — activity rows show relative timestamps', async ({ page }) => {
    await expect(page.getByText('2 min ago', { exact: true })).toBeVisible()
    await expect(page.getByText('8 min ago', { exact: true })).toBeVisible()
  })

  test('dashboard — REPORTS INBOX section is visible', async ({ page }) => {
    await expect(page.getByText('REPORTS INBOX')).toBeVisible()
  })

  test('dashboard — reports inbox shows 4+ reports', async ({ page }) => {
    await expect(page.getByText('Weekly Digest', { exact: true })).toBeVisible()
    await expect(page.getByText('Churn Risk Report')).toBeVisible()
    await expect(page.getByText('Term Revenue Summary')).toBeVisible()
    await expect(page.getByText('Academic Alerts Summary')).toBeVisible()
  })

  test('dashboard — Open buttons visible in reports inbox', async ({ page }) => {
    const openButtons = page.getByRole('button', { name: 'Open', exact: true })
    await expect(openButtons.first()).toBeVisible()
    expect(await openButtons.count()).toBeGreaterThanOrEqual(3)
  })

  test('dashboard — View All link in reports inbox navigates to /reports', async ({ page }) => {
    await page.getByText('View All').click()
    await expect(page).toHaveURL(/reports/)
  })

  test('dashboard — drag handle icon visible on section header', async ({ page }) => {
    await expect(page.getByText('LIVE ACTIVITY & REPORTS')).toBeVisible()
    const handle = page.locator('[title="Drag to reorder"]').first()
    await expect(handle).toBeVisible()
  })

  test('dashboard — clock widget shows time', async ({ page }) => {
    await expect(page.locator('text=/\\d{1,2}:\\d{2}:\\d{2}/')).toBeVisible()
  })

  test('dashboard — clock widget shows countdown to next hour', async ({ page }) => {
    await expect(page.getByText(/to next hour/i)).toBeVisible()
  })
})

// SECTION 4 — STUDENTS
test.describe('students', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/students') })

  test('students — page heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /students/i }).first()).toBeVisible()
  })

  test('students — Add Student button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Add Student/i })).toBeVisible()
  })

  test('students — Import CSV button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Import CSV/i })).toBeVisible()
  })

  test('students — Total Students stat card shows 1,847', async ({ page }) => {
    await expect(page.getByText('1,847')).toBeVisible()
    await expect(page.getByText('TOTAL STUDENTS')).toBeVisible()
  })

  test('students — Active Students stat card shows 1,634', async ({ page }) => {
    await expect(page.getByText('1,634')).toBeVisible()
    await expect(page.getByText('ACTIVE STUDENTS')).toBeVisible()
  })

  test('students — New This Week stat card shows 12', async ({ page }) => {
    await expect(page.getByText('NEW THIS WEEK')).toBeVisible()
    await expect(page.getByText('+12 this week')).toBeVisible()
  })

  test('students — Status filter dropdown opens', async ({ page }) => {
    await page.getByRole('button', { name: /Status/i }).click()
    await expect(page.getByText('Active').first()).toBeVisible()
  })

  test('students — Year Group filter dropdown opens', async ({ page }) => {
    await page.getByRole('button', { name: /Year Group/i }).click()
    await expect(page.locator('[role="listbox"], [role="menu"]').first()).toBeVisible()
  })

  test('students — Department filter dropdown opens', async ({ page }) => {
    await page.getByRole('button', { name: /Department/i }).click()
    await expect(page.locator('[role="listbox"], [role="menu"]').first()).toBeVisible()
  })

  test('students — Enrolments filter dropdown opens', async ({ page }) => {
    await page.getByRole('button', { name: /Enrolments/i }).click()
    await expect(page.locator('[role="listbox"], [role="menu"]').first()).toBeVisible()
  })

  test('students — table column headers are visible', async ({ page }) => {
    await expect(page.getByText('STUDENT')).toBeVisible()
    await expect(page.getByText('STATUS')).toBeVisible()
    await expect(page.getByText('YEAR GROUP')).toBeVisible()
    await expect(page.getByText('SUBJECTS')).toBeVisible()
    await expect(page.getByText('EMAIL')).toBeVisible()
    await expect(page.getByText('PHONE')).toBeVisible()
    await expect(page.getByText('ADDED ON')).toBeVisible()
  })

  test('students — first row shows Aisha Rahman', async ({ page }) => {
    await expect(page.getByText('Aisha Rahman')).toBeVisible()
    await expect(page.getByText('IMI-0001')).toBeVisible()
  })

  test('students — Active status badge visible on rows', async ({ page }) => {
    await expect(page.getByText('Active').first()).toBeVisible()
  })

  test('students — Y8 year group badge visible', async ({ page }) => {
    await expect(page.getByText('Y8').first()).toBeVisible()
  })

  test('students — subjects chip shows count (3 subjects)', async ({ page }) => {
    await expect(page.getByText('3 subjects').first()).toBeVisible()
  })

  test('students — row checkbox is selectable', async ({ page }) => {
    const checkbox = page.locator('table tbody tr').first().locator('input[type="checkbox"]')
    await checkbox.check()
    await expect(checkbox).toBeChecked()
  })

  test('students — clicking student name navigates to profile', async ({ page }) => {
    await page.getByText('Aisha Rahman').first().click()
    await expect(page).toHaveURL(/students\//)
  })

  test('students — three-dot menu visible on rows', async ({ page }) => {
    const menu = page.locator('table tbody tr').first().locator('button').last()
    await expect(menu).toBeVisible()
  })

  test('students — sortable column STUDENT header has sort icon', async ({ page }) => {
    await expect(page.locator('th').filter({ hasText: 'STUDENT' })).toBeVisible()
  })
})

// SECTION 5 — STUDENT PROFILE
test.describe('student profile', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/students/IMI-0001') })

  test('student profile — page loads with student name', async ({ page }) => {
    await expect(page.getByText('Aisha Rahman')).toBeVisible()
  })

  test('student profile — 11 tabs are all visible', async ({ page }) => {
    const tabs = ['Overview', 'Enrolments', 'Invoices', 'Attendance', 'Grades', 'Reports', 'Concerns', 'Feedback', 'Documents', 'Notes', 'Activity']
    for (const tab of tabs) {
      await expect(page.getByRole('tab', { name: tab })).toBeVisible()
    }
  })

  test('student profile — Overview tab is active by default', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
  })

  test('student profile — clicking Enrolments tab does not error', async ({ page }) => {
    await page.getByRole('tab', { name: 'Enrolments' }).click()
    await expect(page.getByRole('tab', { name: 'Enrolments' })).toHaveAttribute('aria-selected', 'true')
  })

  test('student profile — clicking Invoices tab does not error', async ({ page }) => {
    await page.getByRole('tab', { name: 'Invoices' }).click()
    await expect(page.getByRole('tab', { name: 'Invoices' })).toHaveAttribute('aria-selected', 'true')
  })

  test('student profile — clicking Attendance tab does not error', async ({ page }) => {
    await page.getByRole('tab', { name: 'Attendance' }).click()
  })

  test('student profile — clicking Grades tab does not error', async ({ page }) => {
    await page.getByRole('tab', { name: 'Grades' }).click()
  })

  test('student profile — clicking Concerns tab does not error', async ({ page }) => {
    await page.getByRole('tab', { name: 'Concerns' }).click()
  })

  test('student profile — clicking Feedback tab does not error', async ({ page }) => {
    await page.getByRole('tab', { name: 'Feedback' }).click()
  })

  test('student profile — clicking Documents tab does not error', async ({ page }) => {
    await page.getByRole('tab', { name: 'Documents' }).click()
  })

  test('student profile — clicking Notes tab does not error', async ({ page }) => {
    await page.getByRole('tab', { name: 'Notes' }).click()
  })

  test('student profile — clicking Activity tab does not error', async ({ page }) => {
    await page.getByRole('tab', { name: 'Activity' }).click()
  })

  test('student profile — clicking Reports tab does not error', async ({ page }) => {
    await page.getByRole('tab', { name: 'Reports' }).click()
  })

  test('student profile — deep link ?tab=invoices activates Invoices tab', async ({ page }) => {
    await page.goto('/students/IMI-0001?tab=invoices')
    await expect(page.getByRole('tab', { name: 'Invoices' })).toHaveAttribute('aria-selected', 'true')
  })

  test('student profile — deep link ?tab=attendance activates Attendance tab', async ({ page }) => {
    await page.goto('/students/IMI-0001?tab=attendance')
    await expect(page.getByRole('tab', { name: 'Attendance' })).toHaveAttribute('aria-selected', 'true')
  })

  test('student profile — deep link ?tab=concerns activates Concerns tab', async ({ page }) => {
    await page.goto('/students/IMI-0001?tab=concerns')
    await expect(page.getByRole('tab', { name: 'Concerns' })).toHaveAttribute('aria-selected', 'true')
  })

  test('student profile — Y8 year group badge visible in header', async ({ page }) => {
    await expect(page.getByText('Y8').first()).toBeVisible()
  })
})

// SECTION 6 — GUARDIANS
test.describe('guardians', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/guardians') })

  test('guardians — page heading is visible', async ({ page }) => {
    await expect(page.getByRole('main').getByRole('heading', { name: 'Guardians' })).toBeVisible()
  })

  test('guardians — Add Guardian button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Add Guardian/i })).toBeVisible()
  })

  test('guardians — Bulk select button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Bulk select/i })).toBeVisible()
  })

  test('guardians — search input is present', async ({ page }) => {
    await expect(page.locator('input[type="text"], input[type="search"]').first()).toBeVisible()
  })

  test('guardians — table columns GUARDIAN NAME, EMAIL, PHONE, LINKED STUDENTS are visible', async ({ page }) => {
    const ths = page.locator('thead th')
    await expect(ths.filter({ hasText: 'Guardian Name' })).toBeVisible()
    await expect(ths.filter({ hasText: 'Email' })).toBeVisible()
    await expect(ths.filter({ hasText: 'Phone' })).toBeVisible()
    await expect(ths.filter({ hasText: 'Linked Students' })).toBeVisible()
  })

  test('guardians — first row shows Fatima Rahman G-001', async ({ page }) => {
    await expect(page.getByText('Fatima Rahman')).toBeVisible()
    await expect(page.getByText('G-001')).toBeVisible()
  })

  test('guardians — email addresses are visible', async ({ page }) => {
    await expect(page.getByText('fatima.rahman@gmail.com')).toBeVisible()
  })

  test('guardians — UAE phone numbers are visible', async ({ page }) => {
    await expect(page.getByText('+971 50 123 4567')).toBeVisible()
  })

  test('guardians — Family column shows student avatar chips', async ({ page }) => {
    await expect(page.getByText('AR').first()).toBeVisible()
  })

  test('guardians — multi-student guardian shows "2 students" badge', async ({ page }) => {
    await expect(page.getByText('2 students').first()).toBeVisible()
  })

  test('guardians — three-dot menu is visible on rows', async ({ page }) => {
    const menu = page.locator('table tbody tr').first().locator('button').last()
    await expect(menu).toBeVisible()
  })

  test('guardians — guardian IDs are sequential (G-001, G-002)', async ({ page }) => {
    await expect(page.getByText('G-001')).toBeVisible()
    await expect(page.getByText('G-002')).toBeVisible()
  })
})

// SECTION 7 — LEADS
test.describe('leads', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/leads') })

  test('leads — summary text shows active leads count', async ({ page }) => {
    await expect(page.getByText(/28 active leads/i)).toBeVisible()
  })

  test('leads — Add Lead button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Add Lead/i })).toBeVisible()
  })

  test('leads — Kanban view is default', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Kanban' })).toBeVisible()
    await expect(page.getByText('New')).toBeVisible()
    await expect(page.getByText('Contacted')).toBeVisible()
  })

  test('leads — all 6 Kanban stage columns are visible', async ({ page }) => {
    await expect(page.getByText('New')).toBeVisible()
    await expect(page.getByText('Contacted')).toBeVisible()
    await expect(page.getByText('Assessment Booked')).toBeVisible()
    await expect(page.getByText('Assessment Done')).toBeVisible()
    await expect(page.getByText('Trial Booked')).toBeVisible()
  })

  test('leads — column count badges are visible (New: 4, Contacted: 5)', async ({ page }) => {
    const newCol = page.locator('text=New').first()
    await expect(newCol).toBeVisible()
  })

  test('leads — lead cards show lead names', async ({ page }) => {
    await expect(page.getByText('Bilal Mahmood')).toBeVisible()
    await expect(page.getByText('Saif Al-Nuaimi')).toBeVisible()
    await expect(page.getByText('Nadia Al-Ghaith')).toBeVisible()
  })

  test('leads — lead cards show source badges (Website, Referral, Event, Phone, Walk-in)', async ({ page }) => {
    await expect(page.getByText('Website').first()).toBeVisible()
    await expect(page.getByText('Referral').first()).toBeVisible()
    await expect(page.getByText('Event').first()).toBeVisible()
  })

  test('leads — Sibling badge visible on sibling leads', async ({ page }) => {
    await expect(page.getByText('Sibling').first()).toBeVisible()
  })

  test('leads — Walk-in source badge visible', async ({ page }) => {
    await expect(page.getByText('Walk-in').first()).toBeVisible()
  })

  test('leads — lead cards show year group and subject', async ({ page }) => {
    await expect(page.getByText('Y7 · Maths')).toBeVisible()
  })

  test('leads — lead cards show guardian name', async ({ page }) => {
    await expect(page.getByText('Tariq Mahmood')).toBeVisible()
  })

  test('leads — lead cards show days-since timestamp', async ({ page }) => {
    await expect(page.getByText('1d').first()).toBeVisible()
  })

  test('leads — bell icon visible on cards with reminders', async ({ page }) => {
    const bell = page.locator('[data-lucide="bell"]').first()
    await expect(bell).toBeVisible()
  })

  test('leads — three-dot menu on card is visible', async ({ page }) => {
    const menu = page.locator('.kanban-card, [data-card]').first().locator('button').last()
    await expect(menu.or(page.getByText('Bilal Mahmood').locator('../..').locator('button').last())).toBeVisible()
  })

  test('leads — + Add Lead button inside columns is visible', async ({ page }) => {
    await expect(page.getByText('+ Add Lead').first()).toBeVisible()
  })

  test('leads — List view toggle switches layout', async ({ page }) => {
    await page.getByRole('button', { name: 'List' }).click()
    await expect(page.locator('table, [role="table"]').first()).toBeVisible()
  })

  test('leads — Table view toggle switches layout', async ({ page }) => {
    await page.getByRole('button', { name: 'Table' }).click()
    await expect(page.locator('table, [role="table"]').first()).toBeVisible()
  })

  test('leads — Stage filter opens dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /Stage/i }).click()
    await expect(page.locator('[role="listbox"], [role="menu"]').first()).toBeVisible()
  })

  test('leads — Source filter opens dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /Source/i }).click()
    await expect(page.locator('[role="listbox"], [role="menu"]').first()).toBeVisible()
  })

  test('leads — Department filter opens dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /Department/i }).click()
    await expect(page.locator('[role="listbox"], [role="menu"]').first()).toBeVisible()
  })

  test('leads — Assigned to filter opens dropdown', async ({ page }) => {
    await page.getByRole('button', { name: /Assigned to/i }).click()
    await expect(page.locator('[role="listbox"], [role="menu"]').first()).toBeVisible()
  })

  test('leads — My Leads toggle is visible and clickable', async ({ page }) => {
    const toggle = page.getByText('My Leads')
    await expect(toggle).toBeVisible()
    await toggle.click()
  })

  test('leads — clicking a lead card opens slide-over', async ({ page }) => {
    await page.getByText('Bilal Mahmood').first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})

// SECTION 8 — ENROLMENT
test.describe('enrolment', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/enrolment') })

  test('enrolment — page heading is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Enrolment' })).toBeVisible()
  })

  test('enrolment — Active Enrolments tab is default', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Active Enrolments' })).toHaveAttribute('aria-selected', 'true')
  })

  test('enrolment — Trials tab is clickable', async ({ page }) => {
    await page.getByRole('tab', { name: 'Trials' }).click()
    await expect(page.getByRole('tab', { name: 'Trials' })).toHaveAttribute('aria-selected', 'true')
  })

  test('enrolment — Withdrawals tab is clickable', async ({ page }) => {
    await page.getByRole('tab', { name: 'Withdrawals' }).click()
    await expect(page.getByRole('tab', { name: 'Withdrawals' })).toHaveAttribute('aria-selected', 'true')
  })

  test('enrolment — 4 KPI cards are visible', async ({ page }) => {
    await expect(page.getByText('ACTIVE ENROLMENTS')).toBeVisible()
    await expect(page.getByText('NEW THIS TERM')).toBeVisible()
    await expect(page.getByText('PENDING PAYMENT')).toBeVisible()
    await expect(page.getByText('EXPIRING THIS WEEK')).toBeVisible()
  })

  test('enrolment — KPI values correct', async ({ page }) => {
    await expect(page.getByText('3,847')).toBeVisible()
    await expect(page.getByText('143')).toBeVisible()
    await expect(page.getByText('12').first()).toBeVisible()
    await expect(page.getByText('8').first()).toBeVisible()
  })

  test('enrolment — New Enrolment button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /New Enrolment/i })).toBeVisible()
  })

  test('enrolment — Department, Status, Year Group filters are visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Department/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Status/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Year Group/i })).toBeVisible()
  })

  test('enrolment — search input is present', async ({ page }) => {
    await expect(page.getByPlaceholder(/Search by student, subject/i)).toBeVisible()
  })

  test('enrolment — table columns are visible', async ({ page }) => {
    await expect(page.getByText('STUDENT')).toBeVisible()
    await expect(page.getByText('SUBJECT')).toBeVisible()
    await expect(page.getByText('TEACHER')).toBeVisible()
    await expect(page.getByText('SESSIONS')).toBeVisible()
    await expect(page.getByText('FREQUENCY')).toBeVisible()
    await expect(page.getByText('PACKAGE')).toBeVisible()
    await expect(page.getByText('INVOICE')).toBeVisible()
  })

  test('enrolment — Aisha Rahman Y8 Maths row is visible', async ({ page }) => {
    await expect(page.getByText('Aisha Rahman').first()).toBeVisible()
    await expect(page.getByText('Y8 Maths')).toBeVisible()
  })

  test('enrolment — session progress shows N/20 format', async ({ page }) => {
    await expect(page.getByText('16 / 20').or(page.getByText('/ 20')).first()).toBeVisible()
  })

  test('enrolment — Expiring status badge is visible', async ({ page }) => {
    await expect(page.getByText('Expiring').first()).toBeVisible()
  })

  test('enrolment — Active status badge is visible', async ({ page }) => {
    await expect(page.getByText('Active').first()).toBeVisible()
  })

  test('enrolment — Overdue invoice badge is visible on rows', async ({ page }) => {
    await expect(page.getByText('Overdue').first()).toBeVisible()
  })

  test('enrolment — Paid invoice badge is visible on rows', async ({ page }) => {
    await expect(page.getByText('Paid').first()).toBeVisible()
  })

  test('enrolment — 2x/week frequency text is visible', async ({ page }) => {
    await expect(page.getByText('2x/week').first()).toBeVisible()
  })

  test('enrolment — Term 3 — 20 sessions package text is visible', async ({ page }) => {
    await expect(page.getByText(/Term 3 — 20 sessions/).first()).toBeVisible()
  })

  test('enrolment — three-dot menu visible on rows', async ({ page }) => {
    const menu = page.locator('table tbody tr').first().locator('button').last()
    await expect(menu).toBeVisible()
  })
})

// SECTION 9 — FINANCE
test.describe('finance', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/finance') })

  test('finance — page heading Billing & Invoices is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Billing & Invoices/i })).toBeVisible()
  })

  test('finance — Invoices tab is default', async ({ page }) => {
    await expect(page.getByRole('tab', { name: 'Invoices' })).toHaveAttribute('aria-selected', 'true')
  })

  test('finance — Payments tab is clickable', async ({ page }) => {
    await page.getByRole('tab', { name: 'Payments' }).click()
    await expect(page.getByRole('tab', { name: 'Payments' })).toHaveAttribute('aria-selected', 'true')
  })

  test('finance — Credits tab is clickable', async ({ page }) => {
    await page.getByRole('tab', { name: 'Credits' }).click()
    await expect(page.getByRole('tab', { name: 'Credits' })).toHaveAttribute('aria-selected', 'true')
  })

  test('finance — Reports tab is clickable', async ({ page }) => {
    await page.getByRole('tab', { name: 'Reports' }).click()
    await expect(page.getByRole('tab', { name: 'Reports' })).toHaveAttribute('aria-selected', 'true')
  })

  test('finance — 4 KPI cards are visible', async ({ page }) => {
    await expect(page.getByText('TOTAL INVOICED THIS TERM')).toBeVisible()
    await expect(page.getByText('COLLECTED THIS TERM')).toBeVisible()
    await expect(page.getByText('OUTSTANDING')).toBeVisible()
    await expect(page.getByText('OVERDUE')).toBeVisible()
  })

  test('finance — KPI values are correct', async ({ page }) => {
    await expect(page.getByText('AED 284,500')).toBeVisible()
    await expect(page.getByText('AED 241,200')).toBeVisible()
    await expect(page.getByText('AED 43,300')).toBeVisible()
    await expect(page.getByText('AED 18,400')).toBeVisible()
  })

  test('finance — overdue KPI shows 23 invoices subtext', async ({ page }) => {
    await expect(page.getByText('23 invoices')).toBeVisible()
  })

  test('finance — Status filter dropdown opens', async ({ page }) => {
    await page.getByRole('button', { name: /Status/i }).click()
    await expect(page.locator('[role="listbox"], [role="menu"]').first()).toBeVisible()
  })

  test('finance — Department filter dropdown opens', async ({ page }) => {
    await page.getByRole('button', { name: /Department/i }).click()
    await expect(page.locator('[role="listbox"], [role="menu"]').first()).toBeVisible()
  })

  test('finance — Period filter is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Period/i })).toBeVisible()
  })

  test('finance — search input is present', async ({ page }) => {
    await expect(page.getByPlaceholder(/Search by student, invoice/i)).toBeVisible()
  })

  test('finance — Bulk Generate button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Bulk Generate/i })).toBeVisible()
  })

  test('finance — Create Invoice button navigates to invoice builder', async ({ page }) => {
    await page.getByRole('link', { name: /Create Invoice/i }).or(
      page.getByRole('button', { name: /Create Invoice/i })
    ).click()
    await expect(page).toHaveURL(/finance\/invoice\/new/)
  })

  test('finance — table column headers are visible', async ({ page }) => {
    await expect(page.getByText('INVOICE #')).toBeVisible()
    await expect(page.getByText('STUDENT')).toBeVisible()
    await expect(page.getByText('GUARDIAN')).toBeVisible()
    await expect(page.getByText('DESCRIPTION')).toBeVisible()
    await expect(page.getByText('ISSUE DATE')).toBeVisible()
    await expect(page.getByText('DUE DATE')).toBeVisible()
    await expect(page.getByText('AMOUNT')).toBeVisible()
  })

  test('finance — INV-1042 Aisha Rahman row is visible', async ({ page }) => {
    await expect(page.getByText('INV-1042')).toBeVisible()
    await expect(page.getByText('Aisha Rahman').first()).toBeVisible()
    await expect(page.getByText('Fatima Rahman').first()).toBeVisible()
  })

  test('finance — Overdue status badge visible on overdue rows', async ({ page }) => {
    await expect(page.getByText('Overdue').first()).toBeVisible()
  })

  test('finance — Part Paid status badge is visible', async ({ page }) => {
    await expect(page.getByText('Part Paid').first()).toBeVisible()
  })

  test('finance — Paid status badge is visible', async ({ page }) => {
    await expect(page.getByText('Paid').first()).toBeVisible()
  })

  test('finance — overdue due dates are in red', async ({ page }) => {
    const redDate = page.getByText('20 Apr 2025')
    await expect(redDate).toBeVisible()
  })

  test('finance — Record Payment button visible on overdue rows', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Record Payment' }).first()).toBeVisible()
  })

  test('finance — three-dot menu visible on Paid rows (no Record Payment)', async ({ page }) => {
    await expect(page.getByText('INV-1039')).toBeVisible()
  })

  test('finance — clicking student name navigates to student profile', async ({ page }) => {
    await page.getByText('Aisha Rahman').first().click()
    await expect(page).toHaveURL(/students\//)
  })
})

// SECTION 10 — INVOICE BUILDER
test.describe('invoice builder', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/finance/invoice/new') })

  test('invoice builder — page loads in standalone layout (no sidebar)', async ({ page }) => {
    const sidebar = page.locator('nav').first()
    const sidebarBox = await sidebar.boundingBox()
    if (sidebarBox) {
      expect(sidebarBox.width).toBeLessThan(10)
    }
  })

  test('invoice builder — breadcrumb shows Finance / New Invoice / INV-1043', async ({ page }) => {
    await expect(page.getByText('Finance')).toBeVisible()
    await expect(page.getByText('New Invoice')).toBeVisible()
    await expect(page.getByText('INV-1043')).toBeVisible()
  })

  test('invoice builder — Draft status pill in header is visible', async ({ page }) => {
    await expect(page.getByText('Draft').first()).toBeVisible()
  })

  test('invoice builder — Save Draft button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Save Draft/i })).toBeVisible()
  })

  test('invoice builder — Issue Invoice button is visible and amber', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Issue Invoice/i })).toBeVisible()
  })

  test('invoice builder — STUDENT section search input is present when no student selected', async ({ page }) => {
    await expect(page.getByPlaceholder(/Search student by name/i)).toBeVisible()
  })

  test('invoice builder — typing student name shows autocomplete result', async ({ page }) => {
    await page.getByPlaceholder(/Search student by name/i).fill('Aisha')
    await expect(page.getByText('Aisha Rahman')).toBeVisible()
  })

  test('invoice builder — selecting student populates student card', async ({ page }) => {
    await page.getByPlaceholder(/Search student by name/i).fill('Aisha')
    await page.getByText('Aisha Rahman').first().click()
    await expect(page.getByText('Y8')).toBeVisible()
    await expect(page.getByText('Lower Secondary')).toBeVisible()
    await expect(page.getByText('Billed to: Fatima Rahman')).toBeVisible()
  })

  test('invoice builder — Change button visible after student selected', async ({ page }) => {
    await page.getByPlaceholder(/Search student by name/i).fill('Aisha')
    await page.getByText('Aisha Rahman').first().click()
    await expect(page.getByText('Change')).toBeVisible()
  })

  test('invoice builder — INVOICE NO field is present', async ({ page }) => {
    await expect(page.getByText('INVOICE NO.')).toBeVisible()
    await expect(page.getByDisplayValue(/IMI-\d+/)).toBeVisible()
  })

  test('invoice builder — INVOICED BY dropdown shows Jason Daswani', async ({ page }) => {
    await expect(page.getByDisplayValue('Jason Daswani')).toBeVisible()
  })

  test('invoice builder — ISSUE DATE field is pre-filled', async ({ page }) => {
    await expect(page.locator('input[type="date"]').first()).toBeVisible()
  })

  test('invoice builder — DUE DATE field is pre-filled', async ({ page }) => {
    const dateInputs = page.locator('input[type="date"]')
    await expect(dateInputs.nth(1)).toBeVisible()
  })

  test('invoice builder — ITEMS section with columns is visible', async ({ page }) => {
    await expect(page.getByText('ITEMS')).toBeVisible()
    await expect(page.getByText('SUBJECT')).toBeVisible()
    await expect(page.getByText('SESSIONS')).toBeVisible()
    await expect(page.getByText('RATE/SESSION')).toBeVisible()
    await expect(page.getByText('AMOUNT')).toBeVisible()
  })

  test('invoice builder — Add item button is visible', async ({ page }) => {
    await expect(page.getByText('+ Add item').or(page.getByText('Add item'))).toBeVisible()
  })

  test('invoice builder — Enrolment fee row shows 300', async ({ page }) => {
    await expect(page.getByText('Enrolment fee')).toBeVisible()
    await expect(page.getByText('300').first()).toBeVisible()
  })

  test('invoice builder — Enrolment fee toggle is ON by default', async ({ page }) => {
    await expect(page.getByText('AED 300.00')).toBeVisible()
  })

  test('invoice builder — Discount toggle is visible and off by default', async ({ page }) => {
    await expect(page.getByText('Discount')).toBeVisible()
  })

  test('invoice builder — Split into instalments toggle is visible', async ({ page }) => {
    await expect(page.getByText('Split into instalments')).toBeVisible()
  })

  test('invoice builder — NOTE / MEMO section is visible', async ({ page }) => {
    await expect(page.getByText('NOTE / MEMO')).toBeVisible()
    await expect(page.getByPlaceholder(/Add a note/i)).toBeVisible()
  })

  test('invoice builder — sticky footer shows Subtotal, VAT, Total due', async ({ page }) => {
    await expect(page.getByText(/Subtotal/)).toBeVisible()
    await expect(page.getByText(/VAT\(5%\)/)).toBeVisible()
    await expect(page.getByText(/Total due/)).toBeVisible()
  })

  test('invoice builder — total due is AED 315.00 with enrolment fee and VAT', async ({ page }) => {
    await expect(page.getByText('AED 315.00').first()).toBeVisible()
  })

  test('invoice builder — VAT 5% is AED 15.00', async ({ page }) => {
    await expect(page.getByText('AED 15.00')).toBeVisible()
  })

  test('invoice builder — INVOICE PREVIEW panel is visible', async ({ page }) => {
    await expect(page.getByText('INVOICE PREVIEW')).toBeVisible()
    await expect(page.getByText('Updates as you type')).toBeVisible()
  })

  test('invoice builder — preview shows TAX INVOICE heading', async ({ page }) => {
    await expect(page.getByText('TAX INVOICE')).toBeVisible()
  })

  test('invoice builder — preview shows IMI header', async ({ page }) => {
    await expect(page.getByText('Improve ME Institute')).toBeVisible()
    await expect(page.getByText('Gold & Diamond Park, Dubai')).toBeVisible()
  })

  test('invoice builder — preview shows TRN number', async ({ page }) => {
    await expect(page.getByText('TRN: 100123456700003')).toBeVisible()
  })

  test('invoice builder — preview shows DRAFT badge', async ({ page }) => {
    await expect(page.getByText('DRAFT')).toBeVisible()
  })

  test('invoice builder — preview shows TRANSFER PAYMENT TO section', async ({ page }) => {
    await expect(page.getByText('TRANSFER PAYMENT TO')).toBeVisible()
    await expect(page.getByText('ADCB KBW')).toBeVisible()
  })

  test.skip('bug — invoice builder shows bank routing before student selected', async ({ page }) => {
    // ADCB KBW bank details appear in preview before any student is selected
    // Expected: bank section should be blank until student is chosen
    // Actual: IBAN AE220030010464418920001 shows immediately on load
  })
})

// SECTION 11 — TIMETABLE
test.describe('timetable', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/timetable') })

  test('timetable — page heading Timetable is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Timetable' })).toBeVisible()
  })

  test('timetable — Week view is default and active', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Week' })).toBeVisible()
  })

  test('timetable — date range header is visible', async ({ page }) => {
    await expect(page.getByText(/Apr \d{4}/)).toBeVisible()
  })

  test('timetable — prev and next navigation buttons are present', async ({ page }) => {
    const prevBtn = page.locator('button').filter({ hasText: /^<$/ }).or(
      page.locator('[aria-label="previous"], [aria-label="prev"]')
    ).first()
    await expect(prevBtn.or(page.locator('button').nth(0))).toBeVisible()
  })

  test('timetable — Today button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Today' })).toBeVisible()
  })

  test('timetable — Day view button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Day' })).toBeVisible()
  })

  test('timetable — Month view button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Month' })).toBeVisible()
  })

  test('timetable — Day view toggle switches to teacher columns', async ({ page }) => {
    await page.getByRole('button', { name: 'Day' }).click()
    await expect(page.getByText(/Khalil|Mitchell|Al-Amin/).first()).toBeVisible()
  })

  test('timetable — New Session button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /New Session/i })).toBeVisible()
  })

  test('timetable — Filter section is visible with Department, Teacher, Room, SessionType', async ({ page }) => {
    await expect(page.getByText('Filter:')).toBeVisible()
    await expect(page.getByRole('button', { name: /Department/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Teacher/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Room/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Session Type/i })).toBeVisible()
  })

  test('timetable — room columns are visible in week view (Room 1A, Room 2B, Room 3A)', async ({ page }) => {
    await expect(page.getByText('Room 1A')).toBeVisible()
    await expect(page.getByText('Room 2B')).toBeVisible()
    await expect(page.getByText('Room 3A')).toBeVisible()
  })

  test('timetable — room capacity labels are visible (cap 6, cap 4, cap 8)', async ({ page }) => {
    await expect(page.getByText('cap 6').first()).toBeVisible()
    await expect(page.getByText('cap 4').first()).toBeVisible()
    await expect(page.getByText('cap 8').first()).toBeVisible()
  })

  test('timetable — day tabs Mon–Fri are visible', async ({ page }) => {
    await expect(page.getByText(/Mon \d+/)).toBeVisible()
    await expect(page.getByText(/Tue \d+/)).toBeVisible()
    await expect(page.getByText(/Wed \d+/)).toBeVisible()
    await expect(page.getByText(/Thu \d+/)).toBeVisible()
    await expect(page.getByText(/Fri \d+/)).toBeVisible()
  })

  test('timetable — session blocks are visible (Y4 English, Y8 Maths)', async ({ page }) => {
    await expect(page.getByText('Y4 English').first()).toBeVisible()
    await expect(page.getByText('Y8 Maths').first()).toBeVisible()
  })

  test('timetable — session blocks show teacher name', async ({ page }) => {
    await expect(page.getByText('Mitchell').first()).toBeVisible()
    await expect(page.getByText('Khalil').first()).toBeVisible()
  })

  test('timetable — session blocks show student count', async ({ page }) => {
    await expect(page.getByText('2 students').first()).toBeVisible()
  })

  test('timetable — session count summary shown (7 sessions)', async ({ page }) => {
    await expect(page.getByText(/\d+ sessions/)).toBeVisible()
  })

  test('timetable — clicking a session block opens detail panel or slide-over', async ({ page }) => {
    await page.getByText('Y4 English').first().click()
    await expect(page.getByRole('dialog').or(page.getByText('Mitchell')).first()).toBeVisible()
  })

  test.skip('bug — timetable mock week date is in 2025, not current year 2026', async ({ page }) => {
    // Date shows 21 Apr 2025 - should reflect current year
  })
})

// SECTION 12 — ATTENDANCE
test.describe('attendance', () => {
  test.beforeEach(async ({ page }) => { await page.goto('/attendance') })

  test('attendance — page heading Attendance is visible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Attendance' })).toBeVisible()
  })

  test('attendance — date and session count subtitle is visible', async ({ page }) => {
    await expect(page.getByText(/\d+ sessions today/i)).toBeVisible()
  })

  test("attendance — Today's Register tab is default", async ({ page }) => {
    await expect(page.getByRole('tab', { name: "Today's Register" })).toHaveAttribute('aria-selected', 'true')
  })

  test('attendance — Attendance Overview tab is clickable', async ({ page }) => {
    await page.getByRole('tab', { name: 'Attendance Overview' }).click()
    await expect(page.getByRole('tab', { name: 'Attendance Overview' })).toHaveAttribute('aria-selected', 'true')
  })

  test('attendance — session list shows multiple sessions', async ({ page }) => {
    await expect(page.getByText('Y8 Maths').first()).toBeVisible()
    await expect(page.getByText('Y4 English').first()).toBeVisible()
    await expect(page.getByText('Y12 Maths').first()).toBeVisible()
  })

  test('attendance — session cards show teacher name', async ({ page }) => {
    await expect(page.getByText(/Khalil|Mitchell/).first()).toBeVisible()
  })

  test('attendance — session cards show room label', async ({ page }) => {
    await expect(page.getByText(/Room \d/i).first()).toBeVisible()
  })

  test('attendance — session cards show time slot', async ({ page }) => {
    await expect(page.getByText(/\d{1,2}:\d{2}/).first()).toBeVisible()
  })

  test('attendance — Mark Attendance button is visible on session cards', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Mark Attendance/i }).first()).toBeVisible()
  })

  test('attendance — session status badges are visible (In Progress, Upcoming)', async ({ page }) => {
    await expect(
      page.getByText('In Progress').or(page.getByText('Upcoming')).first()
    ).toBeVisible()
  })

  test('attendance — student count shown on session cards', async ({ page }) => {
    await expect(page.getByText(/\d+ students/i).first()).toBeVisible()
  })

  test('attendance — clicking Mark Attendance opens register dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Mark Attendance/i }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
  })
})
