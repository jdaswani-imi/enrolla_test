# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Documentation rule

**Before running any `git commit` or `git push`**, always update `documentation.md` in the repo root to reflect any changes made in the session — features added or changed, UI/UX updates, business logic changes, new pages or flows, removed functionality. Focus on *what the app does*, not code internals. Do not mention file names, function names, or implementation details unless they directly describe a user-facing concept.

## Skills

**Always invoke the `ui-ux-pro-max` skill** before implementing any UI or frontend work in this project.

## Project Overview

**Enrolla** is an Education Management Platform for IMI (Improve ME Institute). Next.js 16 + React 19 admin dashboard covering student/lead management, guardians, enrolment, timetable, attendance, assessments, progress, finance, staff, tasks, automations, inventory, people/segments, analytics, and reporting.

The project is transitioning from a frontend prototype (all data mocked in-memory) to a fullstack app backed by **Supabase** (PostgreSQL + Auth + Storage). **76 tables are now live in Supabase** (47 migrations applied) — the database is the authoritative schema reference. `lib/mock-data.ts` is kept as a fallback during the transition. Replace mock reads with real Supabase queries incrementally, module by module.

## Commands

```bash
npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint (eslint-config-next, core-web-vitals + TS)
npx playwright test                                         # Run all E2E tests (needs dev server running)
npx playwright test tests/e2e/smoke.spec.ts                 # Run a single test file
npx playwright test -g "smoke loads all routes"             # Run by test name
npx playwright test --config=playwright-adminhead.config.ts # Run Admin Head role tests
```

Playwright config: [playwright.config.ts](playwright.config.ts) — targets `http://localhost:3000`, 1440×900 viewport, screenshots on failure. Two test projects: **smoke** (quick RBAC/flow tests) and **responsive-visual** (viewport regression, 180 s timeout). Tests live in [tests/e2e/](tests/e2e/).

## Architecture

### Root layout & providers

[app/layout.tsx](app/layout.tsx) wraps the app in this order (outer → inner):

```
RootLayout (Plus Jakarta Sans font)
  └── TooltipProvider          (@/components/ui/tooltip — delay 300)
        └── OrgLogoProvider    (@/lib/org-logo-context — organisation branding)
              └── UserAvatarProvider (@/lib/user-avatar-context — profile images)
                    └── RoleProvider (@/lib/role-context — active Role in state)
                          └── JourneyProvider (@/lib/journey-store — lead→student conversion)
                                └── AssessmentProvider (@/lib/assessment-store — booking state)
                                      ├── AppShell  (@/components/layout/app-shell)
                                      │     ├── AppSidebar
                                      │     ├── TopBar (sticky)
                                      │     └── <main> (bg #F8FAFC, page-enter animation)
                                      └── Toaster (sonner, bottom-right, richColors)
```

Pages under `/login/`, `/onboarding/`, `/welcome/`, `/auth/`, `/reset-password/` render without the sidebar/top-bar shell (handled by [app-shell.tsx](components/layout/app-shell.tsx) via `usePathname`).

The `/(invoice)` route group ([app/(invoice)/layout.tsx](app/(invoice)/layout.tsx)) renders invoices in an isolated layout outside the shell.

### RBAC / permissions

- [lib/role-config.ts](lib/role-config.ts) — defines `Role` union (8 roles: Super Admin, Admin Head, Admin, Academic Head, HOD, Teacher, TA, HR/Finance) and the `PERMISSIONS` matrix mapping 200+ action IDs (e.g. `students.create`, `finance.approveRefund`) to the roles allowed. Exports `canDo(role, action)` and `canAccess(role, navId)`.
- [lib/role-context.tsx](lib/role-context.tsx) — `RoleProvider` + `useRole()` hook. Role is persisted in `sessionStorage` and initialised from `currentUser.role` in mock-data.
- [lib/use-permission.ts](lib/use-permission.ts) — `usePermission()` hook returning `{ can, sees, role }`. **Use this hook in client components** — it keeps gating reactive to role changes.

When adding a new gated action: add the action ID to `PERMISSIONS`, then `const { can } = usePermission()` and guard with `can('your.action')`. Sidebar nav items are filtered via `sees(navId)`; the nav-ID → action mapping is in the `NAV_ACCESS` map in `role-config.ts`.

### State stores (client-side)

| Store | File | Purpose |
|---|---|---|
| Role | [lib/role-context.tsx](lib/role-context.tsx) | Current user role, persisted in sessionStorage |
| Journey | [lib/journey-store.tsx](lib/journey-store.tsx) | Lead → Assessment → Trial → Enrolment → Student → Invoice state machine |
| Assessment | [lib/assessment-store.tsx](lib/assessment-store.tsx) | In-memory assessment bookings with ID generation |
| OrgLogo | [lib/org-logo-context.tsx](lib/org-logo-context.tsx) | Organisation branding URL |
| UserAvatar | [lib/user-avatar-context.tsx](lib/user-avatar-context.tsx) | Profile image URL |

Dialog components driving the journey flow live in [components/journey/](components/journey/) — `book-assessment-dialog`, `log-trial-outcome-dialog`, `convert-to-student-dialog`, `record-payment-dialog`, etc.

### Role-scoped dashboard

[lib/dashboard-config.ts](lib/dashboard-config.ts) defines per-role dashboard configs — subtitle, KPI cards, ordered section IDs, and drag-reorder flag. `DashboardSectionId` is a closed union covering role-specific sections. The dashboard page reads the config for the current role and renders only that role's sections.

### Backend — Supabase

Project: `enrolla-band1-clean`, ID: `fkpvfolgmhayenidsaxc`, URL: `https://fkpvfolgmhayenidsaxc.supabase.co`.

**Supabase client helpers** (always use these, never instantiate the client directly):

| File | Use when |
|---|---|
| [lib/supabase/client.ts](lib/supabase/client.ts) | Client components (`'use client'`) — anon key, respects RLS |
| [lib/supabase/server.ts](lib/supabase/server.ts) | Server components, Route Handlers, Server Actions — cookie session |
| [lib/supabase/route-auth.ts](lib/supabase/route-auth.ts) | API routes — call `requireAuth()` which returns `{ ok: true; user } \| { ok: false; response }` |

For privileged/admin operations (bypassing RLS), use `createClient(url, SUPABASE_SERVICE_ROLE_KEY)` directly in Route Handlers only.

**Multi-tenancy:** All data queries filter by `TENANT_ID = 'cf9a5e6a-59df-45a3-85f3-fcde703ef6d7'` (single tenant for now, branch-scoped for multi-location).

**Auth**: Supabase Auth (email + password), cookie-based sessions for SSR. `useCurrentUser()` ([lib/use-current-user.ts](lib/use-current-user.ts)) fetches from `/api/auth/me`, caches in `sessionStorage`, syncs on auth state change.

**Environment variables** (`.env.local`, never commit):
- `NEXT_PUBLIC_SUPABASE_URL` — public, safe in browser
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public, safe in browser (RLS enforced)
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**, bypasses RLS

### API routes

All routes live in `app/api/` as Next.js Route Handlers (`route.ts`). Every handler calls `requireAuth()` first. Current modules:

`students`, `guardians`, `leads`, `assessments`, `courses`, `staff`, `enrolments`, `attendance/` (sessions, records, absence-summary, unmarked, makeups), `timetable`, `finance`, `pricing-tiers`, `people`, `communications`, `feedback`, `schools`, `departments`, `automations`, `tasks`, `reports`, `analytics`, `settings/` (org, academic-years, calendar-periods, departments, lock-state, public-holidays), `profile`, `concerns`, `status-history`, `auth/me`.

**Pattern for a new data module:**
1. Create/migrate the table in Supabase (match the shape in `lib/mock-data.ts`)
2. Add a Route Handler at `app/api/<resource>/route.ts` for GET/POST/PATCH/DELETE — start with `requireAuth()`
3. Update the page/component to fetch from the API route instead of importing from `lib/mock-data.ts`
4. Keep mock-data as fallback during transition — don't delete it until the module is fully wired

### Database schema

**76 tables** in the `public` schema, across 47 applied migrations. All tables have RLS enabled (exceptions noted below). Cross-cutting conventions:

- **`tenant_id: uuid → tenants.id`** on every table — always include it in queries.
- **All PKs** are `uuid` with `gen_random_uuid()` default.
- **Timestamps**: `created_at` / `updated_at` as `timestamptz default=now()`.
- **Enums** are enforced as `text` columns with `CHECK` constraints, not Postgres enum types.
- **Arrays**: native `text[]` / `uuid[]` PostgreSQL arrays (e.g. `tasks.assignees`, `leads.subjects`).
- **JSONB** for flexible/nested data: `org_settings.day_schedules`, `feedback_items.selectors`, `segments.filters`, `execution_logs.payload`, `report_jobs.params`, etc.

Tables **without RLS**: `complaint_linked_tickets`, `broadcast_list_members`, `class_posts`, `inventory_auto_deduct_rules`, `status_history`.

#### Domain groups

**Multi-tenancy & org**
`tenants`, `tenant_sequences` (student/invoice number sequences), `branches`, `org_settings`

**Academic structure**
`departments`, `year_groups`, `subjects` (FK → department, year_group; has `price`, `session_duration_minutes`), `rooms`, `academic_years`, `terms`, `calendar_periods`, `calendar_period_dept_pauses`, `public_holidays`, `packages`, `package_subjects`

**People**
`staff` (FK → auth.users via `user_id`; roles mirror app RBAC: super_admin|admin_head|admin|academic_head|hod|teacher|ta|hr_finance; status: active|invited|on_leave|inactive|suspended|off_boarded), `staff_branches`, `schools`, `students` (has auto-incremented `student_number` via tenant_sequences), `guardians`, `student_guardians` (junction; stores relationship, is_primary, is_emergency_contact, can_pickup), `guardian_co_parent_links`, `sibling_links`

**Leads & assessments**
`leads` (15-stage pipeline: New → Contacted → Assessment Booked → ... → Won|Lost; FK → students.id on convert), `assessments` (type: Lead|Student)

**Enrolments & sessions**
`enrolments` (FK → student, subject, branch, package; tracks `sessions_remaining`, `price_at_enrolment`), `trials` (outcome: pending|won|lost|no_show), `withdrawals`, `makeup_allowances`, `sessions` (FK → subject, room, staff, term; has `is_makeup` flag), `session_students` (junction; `enrolment_id` nullable), `makeup_sessions`, `attendance_records` (status: present|absent|late|makeup), `unbilled_sessions`

**Finance**
`invoices` (status: draft|issued|paid|partially_paid|overdue|cancelled; tracks `total_paid`, `amount_due`), `invoice_lines` (line_type: subject|package|credit|fee|discount; has `sessions_purchased`), `payments` (method: cash|card|bank_transfer|online), `credits` (type: goodwill|refund|adjustment)

**Academic / progress**
`assignments`, `assessment_attempts` (score, grade per student per session), `feedback_items`, `session_feedback` (score 1–5; status: Draft → Pending Approval → Approved → Sent), `concerns` (type: behaviour|academic|wellbeing|safeguarding|other; severity: low|medium|high|critical), `student_notes`

**Tasks**
`tasks` (type: Admin|Academic|Finance|HR|Student Follow-up|Cover|Personal; has `assignees: text[]`), `task_groups`

**Communications & engagement**
`announcements`, `complaint_tickets`, `complaint_linked_tickets`, `survey_responses`, `survey_pending`, `broadcast_lists`, `broadcast_list_members`, `class_groups`, `class_posts`, `internal_messages`

**People / segments / export**
`segments` (scope: Org-Wide|Personal; `filters: jsonb`), `forms`, `form_submissions`, `export_history`, `duplicate_detections`

**Automations**
`automation_templates`, `automation_rules` (trigger_type: Status Change|Time-based|Threshold|Form Submission|Manual), `dispatch_queue`, `execution_logs`, `marketing_moments`, `marketing_campaigns`

**Inventory**
`inventory_items`, `inventory_auto_deduct_rules`, `inventory_suppliers`, `reorder_alerts`, `stock_ledger`

**Reporting & activity**
`activity_feed`, `report_items`, `report_jobs` (type: attendance|revenue|academic|staff-performance; status: queued|running|complete|failed)

**Auditing**
`status_history` (entity_type: lead|task; FK → auth.users for changed_by; RLS off)

#### Views & triggers

- `v_enrolment_sessions` — view joining enrolments to sessions (migration `create_v_enrolment_sessions_view`)
- `trigger_invoice_paid_activate_enrolments` — Postgres trigger that activates enrolments when an invoice is marked paid

---

### Mock data

[lib/mock-data.ts](lib/mock-data.ts) (~2900 lines) remains as a fallback during the mock → Supabase transition. For any module not yet wired to the real API, it provides typed data shapes for `currentUser`, `orgSettings`, students, guardians, leads, enrolments, sessions, invoices, payments, staff, tasks, KPIs, etc.

Typed DB shapes also live in [types/leads.ts](types/leads.ts) and any `lib/types/*.ts` files — prefer these over inline interfaces for shared data shapes.

### Component conventions

- **`cn()` utility** ([lib/utils.ts](lib/utils.ts)): `clsx` + `tailwind-merge` — use for all className composition.
- **UI primitives** in [components/ui/](components/ui/) wrap `@base-ui/react` headless components using `class-variance-authority`. shadcn style is `base-nova` (Base UI, **not Radix**).
- **Icons**: `lucide-react`.
- **Toasts**: `import { toast } from 'sonner'` — `toast.success()`, `toast.error()`, etc.
- **Charts**: `recharts`.
- **Alias**: `@/*` maps to the repo root (e.g. `@/lib/utils`, `@/components/ui/button`).
- **Active route** detection uses `usePathname()` from `next/navigation`.
- **Mobile detection**: `useIsMobile()` in [hooks/use-mobile.ts](hooks/use-mobile.ts) (`matchMedia` at 768px).

### Styling

- **Tailwind CSS v4** with `@tailwindcss/postcss`. Uses the `@theme` syntax in [app/globals.css](app/globals.css) — there is **no** `tailwind.config.js`.
- **Design tokens** (CSS custom properties):
  - Primary accent: Amber `#F59E0B`
  - Sidebar background: Deep navy `#0F172A` (panel variant `#1E293B`)
  - Content background: Light blue-gray `#F8FAFC`
  - Secondary: Light slate `#F1F5F9`
- **Data-attribute variants** are defined for Base UI components (`data-open`, `data-closed`, `data-checked`, `data-selected`, `data-active`, etc.) — use these rather than JS class toggling.
- **Font**: Plus Jakarta Sans via `next/font/google`, wired as `--font-sans`.

### Navigation structure

Defined in [components/layout/app-sidebar.tsx](components/layout/app-sidebar.tsx). Mix of **direct link items** (`type: "link"`) and **flyout panels** (`type: "flyout"`, 224px-wide secondary panel). Top-level items:

- Dashboard (link)
- People (flyout) — Students, Guardians, Leads, Enrolment, Assessments, Segments/Forms/Exports
- Timetable, Attendance (links)
- Academic (flyout) — Feedback, Progress, Assignments
- Finance (flyout) — Invoices & Payments, Credits
- Reporting (flyout) — Analytics, Reports
- Tasks, Automations, Inventory, Staff, Settings (links)

Visibility filtered through `usePermission().sees(navId)`. Sidebar collapse/expand is handled locally inside the sidebar, not via global context.
