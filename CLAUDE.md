# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Skills

**Always invoke the `ui-ux-pro-max` skill** before implementing any UI or frontend work in this project.

## Project Overview

**Enrolla** is an Education Management Platform for IMI (Improve ME Institute). It is a Next.js 16 + React 19 admin dashboard with modules for student/lead management, enrollment, timetable, attendance, assessments, progress, finance, staff, tasks, analytics, and reporting.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (eslint-config-next, core-web-vitals + TypeScript rules)
```

No test framework is configured.

## Architecture

### Routing & Layout

All routes live in `app/` using Next.js App Router. `app/page.tsx` redirects to `/dashboard`. Every route has a `page.tsx` file; all non-dashboard pages currently render "Coming soon" placeholders.

The global layout hierarchy (`app/layout.tsx`):
```
RootLayout
  └── TooltipProvider
        └── SidebarProvider   ← manages sidebar collapsed state via React Context
              └── AppShell    ← components/layout/app-shell.tsx
                    ├── AppSidebar   ← components/layout/app-sidebar.tsx
                    ├── TopBar       ← components/layout/top-bar.tsx
                    └── <children>   ← page content (light blue #F8FAFC bg)
```

### State Management

- **Sidebar state:** React Context (`SidebarContext`) in `components/ui/sidebar.tsx`, consumed by layout components.
- **Active route detection:** `usePathname()` used in `app-sidebar.tsx` and `top-bar.tsx` to highlight active nav links and render the correct page title.
- **Mobile detection:** `hooks/use-mobile.ts` — `useIsMobile()` hook using `window.matchMedia` at 768px breakpoint.
- **Mock data:** `lib/mock-data.ts` — `currentUser` (name, role, org) and `notificationCount`. Used in sidebar user profile footer and top bar notification badge.

### Component Conventions

- **`cn()` utility** (`lib/utils.ts`): `clsx` + `tailwind-merge` — use this for all className composition.
- **UI primitives**: `components/ui/` wraps `@base-ui/react` headless components using `class-variance-authority` (CVA) for variant management.
- **Icons**: `lucide-react`.
- **Component aliases** (from `components.json`): `@/components`, `@/lib`, `@/hooks`, `@/utils`.

### Styling

- **Tailwind CSS v4** with `@tailwindcss/postcss`. Uses the new `@theme` syntax — not the `tailwind.config.js` approach.
- **Design tokens** (defined as CSS custom properties in `app/globals.css`):
  - Primary accent: Amber `#F59E0B`
  - Sidebar background: Deep navy `#0F172A`
  - Content background: Light blue `#F8FAFC`
  - Secondary: Light slate `#F1F5F9`
- **Font**: Plus Jakarta Sans via Google Fonts, loaded as `--font-sans` CSS variable, weights 400/500/600/700.
- **shadcn style**: `base-nova` (uses `@base-ui/react` primitives, not Radix).

### Navigation Structure

Defined in `components/layout/app-sidebar.tsx`. Six sections with 13 nav items total:
- **Main**: Dashboard
- **Academic**: Students, Leads, Enrolment, Timetable, Attendance, Assessments, Progress
- **Finance**: Finance
- **People**: Staff
- **Management**: Tasks, Analytics, Reports
- **Settings**: Settings
