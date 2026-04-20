# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Skills

**Always invoke the `ui-ux-pro-max` skill** before implementing any UI or frontend work in this project.

## Project Overview

**Enrolla** is an Education Management Platform for IMI (Improve ME Institute). Next.js 16 + React 19 admin dashboard covering student/lead management, guardians, enrolment, timetable, attendance, assessments, progress, finance, staff, tasks, automations, inventory, people/segments, analytics, and reporting. This is a frontend prototype — all data is mocked in-memory; there is no backend.

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

### Mock data

[lib/mock-data.ts](lib/mock-data.ts) (~2900 lines) is the single source of seed data: `currentUser`, `orgSettings`, `notificationCount`, plus typed collections for students, guardians, leads, enrolments, sessions, invoices, payments, staff, tasks, KPIs, etc. Prefer extending this file over creating new mock sources.

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
