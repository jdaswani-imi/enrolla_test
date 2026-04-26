# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Skills

**Always invoke the `ui-ux-pro-max` skill** before implementing any UI or frontend work in this project.

## Project Overview

**Enrolla** is an Education Management Platform for IMI (Improve ME Institute). Next.js 16 + React 19 admin dashboard covering student/lead management, guardians, enrolment, timetable, attendance, assessments, progress, finance, staff, tasks, automations, inventory, people/segments, analytics, and reporting.

The project is transitioning from a frontend prototype (all data mocked in-memory) to a fullstack app backed by **Supabase** (PostgreSQL + Auth + Storage). Mock data in `lib/mock-data.ts` is the source of truth for the data model — new database tables and API routes should mirror it. Replace mock reads with real Supabase queries incrementally, module by module.

## Commands

```bash
npm run dev              # Start dev server at http://localhost:3000
npm run build            # Production build
npm run start            # Start production server
npm run lint             # ESLint (eslint-config-next, core-web-vitals + TS)
npx playwright test                         # Run all E2E tests (needs dev server running)
npx playwright test tests/e2e/smoke.spec.ts # Run a single test file
npx playwright test -g "smoke loads all routes"  # Run by test name
```

Playwright config: [playwright.config.ts](playwright.config.ts) — targets `http://localhost:3000`, 1440×900 viewport, screenshots on failure. Tests live in [tests/e2e/](tests/e2e/).

## Architecture

### Root layout & providers

[app/layout.tsx](app/layout.tsx) wraps the app in this order (outer → inner):

```
RootLayout (Plus Jakarta Sans font)
  └── TooltipProvider          (@/components/ui/tooltip — delay 300)
        └── RoleProvider       (@/lib/role-context — active Role in state)
              └── JourneyProvider (@/lib/journey-store — lead→student conversion state)
                    ├── AppShell  (@/components/layout/app-shell)
                    │     ├── AppSidebar
                    │     ├── TopBar (sticky)
                    │     └── <main> (bg #F8FAFC, page-enter animation keyed on pathname)
                    └── Toaster (sonner, bottom-right, richColors)
```

Note: there is no `SidebarProvider` in the root layout — sidebar collapse/expand is handled locally inside the sidebar component, not via global context.

### RBAC / permissions

Permissions are central to this app. Every list/detail page and most action buttons are gated.

- [lib/role-config.ts](lib/role-config.ts) — defines `Role` union (8 roles: Super Admin, Admin Head, Admin, Academic Head, HOD, Teacher, TA, HR/Finance) and the `PERMISSIONS` matrix mapping action IDs (e.g. `students.create`, `finance.approveRefund`) to the roles allowed. Also exports `canDo(role, action)` and `canAccess(role, navId)`.
- [lib/role-context.tsx](lib/role-context.tsx) — `RoleProvider` + `useRole()` hook. Role is mutable at runtime (for prototype role-switching) and initialised from `currentUser.role` in mock-data.
- [lib/use-permission.ts](lib/use-permission.ts) — `usePermission()` hook returning `{ can, sees, role }`. **Use this hook in client components** rather than calling `canDo` directly; it keeps gating reactive to role changes.
- Sidebar nav items are filtered via `sees(navId)`; the nav-ID → action mapping is in the `NAV_ACCESS` map in `role-config.ts`.

When adding a new gated action: add the action ID to `PERMISSIONS`, then `const { can } = usePermission()` and guard with `can('your.action')`.

### Role-scoped dashboard

[lib/dashboard-config.ts](lib/dashboard-config.ts) defines per-role dashboard configs — subtitle, KPI cards, ordered section IDs, and drag-reorder flag. `DashboardSectionId` is a closed union covering role-specific sections (e.g. `teacher-sessions`, `hr-revenue`, `hod-workload`). The dashboard page reads the config for the current role and renders only that role's sections.

### Lead → student journey store

[lib/journey-store.tsx](lib/journey-store.tsx) is a client-side state machine for the conversion funnel: Lead → Assessment → Trial → Enrolment → Student → Invoice. It exposes `JourneyProvider` (mounted in root layout) and typed actions for booking/logging each step. Dialog components that drive this flow live in [components/journey/](components/journey/) — `book-assessment-dialog`, `log-trial-outcome-dialog`, `convert-to-student-dialog`, `record-payment-dialog`, etc.

### Backend — Supabase

The backend is **Supabase** (hosted PostgreSQL + Auth + Edge Functions). Project URL: `https://fkpvfolgmhayenidsaxc.supabase.co` (project: `enrolla-band1-clean`, ID: `fkpvfolgmhayenidsaxc`).

**Supabase client helpers** (always use these, never instantiate the client directly):

| File | Use when |
|------|----------|
| [lib/supabase/client.ts](lib/supabase/client.ts) | Client components (`'use client'`) — uses anon key, respects RLS |
| [lib/supabase/server.ts](lib/supabase/server.ts) | Server components, Route Handlers, Server Actions — uses anon key + cookie session |

For privileged/admin operations (bypassing RLS), use `createClient(url, SUPABASE_SERVICE_ROLE_KEY)` directly in Route Handlers only — never expose the service role key to the browser.

**API routes** live in `app/api/` as Next.js Route Handlers (`route.ts`). The only one so far is `app/api/test/route.ts` which queries the `departments` table as a connectivity test.

**Pattern for a new data module:**
1. Create/migrate the table in Supabase (match the shape in `lib/mock-data.ts`)
2. Add a Route Handler at `app/api/<resource>/route.ts` for GET/POST/PATCH/DELETE
3. Update the page/component to fetch from the API route instead of importing from `lib/mock-data.ts`
4. Keep mock-data as fallback during transition — don't delete it until the module is fully wired

**Auth**: Supabase Auth (email + password) will replace the current mock `currentUser`. The server client in `lib/supabase/server.ts` already handles cookie-based sessions for SSR.

**Environment variables** (set in `.env.local`, never commit):
- `NEXT_PUBLIC_SUPABASE_URL` — public, safe in browser
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public, safe in browser (RLS enforced)
- `SUPABASE_SERVICE_ROLE_KEY` — **server-only**, bypasses RLS — never expose to client

### Mock data

[lib/mock-data.ts](lib/mock-data.ts) (~2900 lines) is the authoritative data model reference: `currentUser`, `orgSettings`, `notificationCount`, plus typed collections for students, guardians, leads, enrolments, sessions, invoices, payments, staff, tasks, KPIs, etc. Use it as the schema blueprint when creating Supabase tables. As modules migrate to Supabase, their mock exports become deprecated but should remain until the real data layer is verified.

### Component conventions

- **`cn()` utility** ([lib/utils.ts](lib/utils.ts)): `clsx` + `tailwind-merge` — use for all className composition.
- **UI primitives** in [components/ui/](components/ui/) wrap `@base-ui/react` headless components using `class-variance-authority`. shadcn style is `base-nova` (Base UI, **not Radix**).
- **Icons**: `lucide-react`.
- **Toasts**: `import { toast } from 'sonner'` — `toast.success()`, `toast.error()`, etc. Toaster is already mounted globally.
- **Charts**: `recharts`.
- **Aliases** (from [components.json](components.json)): `@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`, `@/hooks`.
- **Active route** detection uses `usePathname()` from `next/navigation` (e.g. sidebar highlight, top bar title, page-enter key).
- **Mobile detection**: `useIsMobile()` in [hooks/use-mobile.ts](hooks/use-mobile.ts) (`matchMedia` at 768px).

### Styling

- **Tailwind CSS v4** with `@tailwindcss/postcss`. Uses the `@theme` syntax in [app/globals.css](app/globals.css) — there is no `tailwind.config.js`.
- **Design tokens** (CSS custom properties in `globals.css`):
  - Primary accent: Amber `#F59E0B`
  - Sidebar background: Deep navy `#0F172A` (panel variant `#1E293B`)
  - Content background: Light blue `#F8FAFC`
  - Secondary: Light slate `#F1F5F9`
- **Font**: Plus Jakarta Sans via `next/font/google`, wired as `--font-sans`, weights 400/500/600/700.

### Navigation structure

Defined in [components/layout/app-sidebar.tsx](components/layout/app-sidebar.tsx). The sidebar uses a mix of **direct link items** (`type: "link"`) and **flyout panels** (`type: "flyout"`, opens a 224px-wide secondary panel with grouped subitems). Top-level items:

- Dashboard (link)
- People (flyout) — groups Students, Guardians, Leads, Enrolment, Assessments, Segments/Forms/Exports
- Timetable, Attendance (links)
- Academic (flyout) — Feedback, Progress, Assignments
- Finance (flyout) — Invoices & Payments, Credits
- Reporting (flyout) — Analytics, Reports
- Tasks, Automations, Inventory, Staff, Settings (links)

Visibility of each item/subitem is filtered through `usePermission().sees(navId)` against [lib/role-config.ts](lib/role-config.ts).
