# Enrolla Frontend Prototype — Developer Handover (v2)

**Document type:** Frontend ideation prototype handover
**Prepared by:** Jason Daswani / Claude
**Date:** April 2026
**Supersedes:** `Enrolla_Frontend_Prototype_Handover.md` (v1)
**Status:** Complete — ready for developer review. 40/40 Playwright smoke tests passing.

---

## 1. Overview

This document describes the Enrolla frontend prototype built as a design and UX ideation exercise. It is a Next.js application with mock data. No backend, no API calls, no authentication. Its purpose is to show the developer exactly what to build: screen layouts, interaction patterns, navigation flows, component behaviour, and design decisions.

The prototype covers the full Tenant Super Admin view for IMI (Improve ME Institute). It does not cover Teacher, Admin, HOD, HR/Finance, Parent, Student, or Platform Admin surfaces. The Platform Admin Panel at `admin.enrolla.app` is a separate application scoped for Phase 2.

Where the prototype makes a visual or interaction decision not explicitly in the PRD, treat the prototype as the UI specification and the PRD as the business logic specification. Both must be satisfied in the real implementation.

---

## 2. Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 16.2 (App Router) | TypeScript throughout |
| React | 19.2 | Server components default, client where interactive |
| Styling | Tailwind v4 with `@theme` tokens | Amber `#F59E0B`, navy `#0F172A`, slate `#F8FAFC` |
| Components | Base UI + CVA (shadcn-style primitives) | 20+ primitives in `components/ui/` |
| Icons | Lucide React | |
| Charts | Recharts | All analytics and dashboard charts |
| Font | Plus Jakarta Sans | Loaded via Next.js Google Fonts |
| State | React Context (role, sidebar) + `usePathname()` + `useSavedSegments` (localStorage) | No Redux, no Zustand |
| Data | All mock — `lib/mock-data.ts` (~3,423 lines) | No backend, no API calls, no auth |
| Testing | Playwright (e2e only) | `smoke.spec.ts` (40 tests) + `deep.spec.ts` (in progress) |

No dark mode yet. No test framework beyond Playwright.

---

## 3. Running the prototype

```bash
npm install
npm run dev
# → http://localhost:3000
# Redirects automatically to /dashboard
```

Playwright:

```bash
npx playwright test                    # Full suite
npx playwright test smoke              # Smoke only
npx playwright test --ui               # Interactive UI mode
```

---

## 4. File structure

```
app/
  (invoice)/                — Standalone invoice builder route group
    page.tsx                — Full invoice builder (student search, line items, VAT, preview)
  dashboard/page.tsx        — Command centre (M10)
  students/page.tsx         — Student list
  students/[id]/page.tsx    — Student profile (11 tabs, ?tab= deep-linking)
  guardians/page.tsx        — Guardian list with Family column
  leads/page.tsx            — Lead pipeline (Kanban / List / Table)
  enrolment/page.tsx        — Enrolments, Trials, Withdrawals
  finance/page.tsx          — Invoices, Payments, Credits, Reports
  timetable/page.tsx        — Week / Day / List / Month views
  attendance/page.tsx       — Register + Overview
  assessments/page.tsx      — Booking + outcomes
  progress/page.tsx         — Trackers / Reports / Alerts / Assignments
  tasks/page.tsx            — List / Kanban / Calendar views
  staff/page.tsx            — Directory + HR dashboard
  people/page.tsx           — Unified directory (6 tabs: Overview, Duplicates, Segments, Broadcast Lists, Forms, Exports)
  feedback/page.tsx         — Queue / Announcements / Complaints / Surveys / Class Discussion
  automations/page.tsx      — 7 tabs: Templates, Rules, Trigger Library, Dispatch Queue, Internal Messages, Marketing, Execution Log
  inventory/page.tsx        — Catalogue / Reorder Alerts / Stock Ledger / Suppliers
  analytics/page.tsx        — Revenue / Occupancy / Churn / Staff charts
  reports/page.tsx          — Generated + scheduled reports
  settings/page.tsx         — 17-section settings accordion
  profile/page.tsx          — User profile

components/
  layout/
    app-shell.tsx           — Root wrapper with sticky topbar and page transition
    app-sidebar.tsx         — Permanent 56px icon-rail with flyout panels
    top-bar.tsx             — Sticky header, global search, role switcher, clock, notifications, help
  ui/
    button.tsx, badge.tsx, avatar.tsx, input.tsx, dialog.tsx, sheet.tsx, tooltip.tsx, sidebar.tsx
    skeleton-loader.tsx     — SkeletonPulse, SkeletonKpi, SkeletonTable, SkeletonCard
    empty-state.tsx         — EmptyState (icon, title, description, action)
    role-banner.tsx         — Role switcher banner (dev mode)
    multi-select-filter.tsx — Multi-select dropdown filter chip
    date-range-picker.tsx   — Calendar date range picker with presets
    pagination-bar.tsx      — Rows per page + page navigation
    sortable-header.tsx     — Sortable table column header (↑↓↕)
    export-dialog.tsx       — CSV / PDF / Excel export modal

lib/
  mock-data.ts              — All mock data, interfaces, and type definitions
  role-config.ts            — RBAC role × action matrix (8 roles × ~50 actions)
  use-permission.ts         — Hook exposing can / sees / role

tests/
  e2e/
    smoke.spec.ts           — 40 tests, every route, role switcher, tabs, invoice builder
    deep.spec.ts            — Deep button-level testing (in progress)
```

---

## 5. Screen index

27 routes total. Every route is fully fleshed out — no "coming soon" stubs remain.

| Route | Module | Description |
|---|---|---|
| `/dashboard` | M10 | KPI cards, churn risk, revenue trend, occupancy heatmap, activity feed, reports inbox, draggable sections, live clock |
| `/students` | M02/M17 | Student list with stat cards, multi-select filters, sortable columns, saved segments, pagination |
| `/students/[id]` | M17 | Student profile — sticky header, left sidebar, 11-tab main panel, deep-link via `?tab=` |
| `/guardians` | M18 | Guardian list with Family column showing overlapping student avatar chips |
| `/leads` | M01 | Pipeline in Kanban / List / Table views. Auto-collapses sidebar. DNC badges, sibling flags. Detail dialog shows last 2 internal messages |
| `/enrolment` | M04 | Active enrolments, trials, withdrawals. 640px slide-over with session dot visualisation |
| `/finance` | M08 | Invoices, payments, credits, reports. Overdue row tinting. Invoice detail slide-over |
| `/(invoice)` | M08 | Standalone full invoice builder (student search, line items, VAT, discount, preview pane) |
| `/timetable` | M05 | Week (rooms as columns), Day (teachers as columns), List (with CSV downloads), Month views. Department-coloured session chips. Inline attendance marking |
| `/attendance` | M06 | Today's register + Overview (unmarked, absence summary, makeup log) |
| `/assessments` | M03 | Booking pipeline, outcomes, slot management |
| `/progress` | M19 | Trackers, reports approval queue, academic alerts, assignments (4 tabs) |
| `/tasks` | M16 | List (grouped by OVERDUE / TODAY / UPCOMING), Kanban, Calendar views. Sub-task checkboxes. Linked record chips |
| `/staff` | M09 | Staff directory + HR dashboard. Slide-over with CPD log, performance tab, feedback chart |
| `/people` | M12 | Unified directory with 6 tabs: Overview, Duplicates (AI detection), Segments, Broadcast Lists, Forms, Exports. Quick Tools section |
| `/feedback` | M07 | Queue, Announcements, Complaints, Surveys, Class Discussion (5 tabs). Status badges and AI summary column |
| `/automations` | M13 | 7 tabs: Templates, Rules, Trigger Library, Dispatch Queue, Internal Messages, Marketing, Execution Log |
| `/inventory` | M15 | Catalogue, Reorder Alerts, Stock Ledger, Suppliers (4 tabs). Health badges (OK / Low / Reorder) |
| `/analytics` | M10 | Revenue, Occupancy, Churn, Staff performance — all Recharts |
| `/reports` | M10.A | Generated reports + scheduled reports table |
| `/settings` | M20 | 17-section accordion with IMI pre-filled values |
| `/profile` | — | User profile page |

---

## 6. Design system

### 6.1 Colour tokens (`app/globals.css`)

| Token | Value | Usage |
|---|---|---|
| Sidebar bg | `#0F172A` | Deep navy — left nav |
| Accent / Amber | `#F59E0B` | CTAs, active states, highlights |
| Content bg | `#F8FAFC` | Light slate — page background |
| Card bg | `#FFFFFF` | All cards and panels |
| Border | `border-slate-200` | All card and table borders |

### 6.2 Department colours (Timetable + charts)

| Department | Colour | Hex |
|---|---|---|
| Primary | Pink pastel | `#fce7f3` |
| Lower Secondary | Cyan pastel | `#cffafe` |
| Senior | Orange pastel | `#ffedd5` |
| Meeting | Light grey | `#f3f4f6` |
| Blocked time | Slate + diagonal stripe | `#e2e8f0` |

### 6.3 Typography

Font: Plus Jakarta Sans. Headings bold, slate-900. Body slate-700. Muted slate-400 to slate-500. Section labels uppercase, letter-spaced, slate-400.

### 6.4 Status colours (consistent across all pages)

| Status | Colour |
|---|---|
| Active / Paid / Pass | Green |
| Warning / Pending / Medium risk | Amber |
| Overdue / Error / High risk / Critical | Red |
| Withdrawn / Cancelled / Draft | Slate/Grey |
| Graduated | Blue |

### 6.5 Heatmap scale (occupancy)

| Band | Tailwind class |
|---|---|
| 0% (empty) | `bg-slate-100` |
| 1–49% (low) | `bg-green-100` |
| 50–69% (moderate) | `bg-green-300` |
| 70–84% (good) | `bg-green-500` |
| 85–100% (full) | `bg-green-700` (white text) |

---

## 7. Cross-cutting systems

### 7.1 RBAC

`role-config.ts` defines 8 roles × ~50 actions. Roles: Super Admin, Admin Head, Admin, Academic Head, HOD, Teacher, TA, HR/Finance. The `use-permission.ts` hook exposes `can`, `sees`, and `role`. `AccessDenied` component guards pages. Buttons and row actions are permission-gated. Sidebar nav filters by `NAV_ACCESS`. The role switcher in the topbar flips context live without reload.

Pattern: **hide, don't grey.** Never disable elements for insufficient permissions — remove them from the UI entirely.

### 7.2 Toasts

Sonner wired globally in `layout.tsx`. Used across finance, student, and automation flows for confirmations and error states.

### 7.3 Export

`ExportDialog` (CSV / PDF / Excel, current-filter vs all-records) reused across every data page.

### 7.4 Sidebar

Permanent 56px icon-only rail. No toggle, no expand state. Hover tooltips on every icon. Flyout panels for grouped sections:

- **People** flyout → Students, Leads, Enrolment, Assessments, Guardians/Siblings (under Family)
- **Academic** flyout → Progress, Assignments
- **Finance** flyout → Invoices, Credits
- **Reporting** flyout → Analytics, Reports
- **Direct links** → Dashboard, Timetable, Attendance, Tasks, Staff, Automations, Inventory, Feedback, People (directory hub), Settings

Auto-collapse behaviour on `/leads` was removed in the 16 April redesign (no longer needed since the sidebar is always 56px).

### 7.5 AppShell

Wraps `AppSidebar` and `TopBar`. Providers: `RoleProvider`, `TooltipProvider`, `Toaster`. Top bar has always-open global search, role switcher, notifications dropdown, help button, live clock, avatar.

---

## 8. Key interaction patterns

### 8.1 Slide-overs

Used throughout for record detail without full navigation:

- Fixed right panel. Widths: 480px standard, 560px tracker detail, 640px enrolment
- Dark overlay backdrop with fade-in animation
- Panel slides in from right (`slideInRight`, 0.2s ease-out)
- Close on backdrop click or close button
- Nested state possible (e.g. timetable session → attendance register within the same slide-over)

### 8.2 Modals (width conventions)

| Modal type | Max width | Example |
|---|---|---|
| Duplicates review | `max-w-2xl` (672px) | Side-by-side field comparison with amber diff highlighting |
| Segments detail | `max-w-2xl` | Filter summary + member table + view-all link |
| Broadcast Lists manager | `max-w-2xl` | Members table + search + add-member + auto-rule reference |
| Forms share | `max-w-lg` (512px) | Standalone URL + embed code + QR code |

All "Copy" buttons swap text to "Copied!" for 2 seconds then revert. Uses `navigator.clipboard.writeText()` with toast fallback on failure.

### 8.3 Sortable tables

All tables use `SortableHeader`. Clicking a column header toggles asc/desc. Active sort column shows amber indicator arrow (↑/↓). Inactive columns show `↕`.

### 8.4 Multi-select filters

All filter dropdowns use `MultiSelectFilter`. Multiple options selectable simultaneously. Active filters show count: `Department: Primary +1`. Clear selection link within the dropdown.

### 8.5 Saved segments

Available on Students, Leads, Finance, Tasks. When any filter is active, a "Save segment" button appears. Segments stored in `localStorage` per page key. Appear as amber chips above the filter bar for one-click reapplication.

### 8.6 Date range picker

`DateRangePicker` with preset buttons (Today, This week, This month, Last month, This term) plus custom two-month calendar range selection. Amber highlight for selected range.

### 8.7 Pagination

`PaginationBar` on all tables. Rows per page: 10 / 20 / 50 / 100. Page number buttons (max 5 visible). First/last page jump buttons. Resets to page 1 on any filter change.

### 8.8 Page transitions

`page-enter` CSS animation (`fadeSlideIn`, 0.2s) applied via `key={pathname}` on the content wrapper in `app-shell.tsx`. Re-triggers on every route change.

### 8.9 Tab switching

Tabs use `useState` for active tab. Tab content wrapped in `key={activeTab}` so `page-enter` animation re-fires on switch. Deep-link support via `?tab=` query param read on mount using `useSearchParams()`.

### 8.10 Dashboard drag-to-reorder

Three dashboard sections (Activity Feed, Churn Risk, Revenue/Occupancy) wrapped in draggable divs using native HTML5 drag events. Drag handles (6-dot grid icon) on each section header. Drop target highlighted with amber ring. Default order: Activity Feed first, then Churn, then Charts.

### 8.11 Loading state (dashboard only)

800ms simulated loading on dashboard mount. Shows skeleton grid (`SkeletonKpi`, `SkeletonTable`, `SkeletonCard`) before real content renders.

### 8.12 Empty states

`EmptyState` component (icon, title, description, optional CTA) shown when filtered results return zero rows. Applied to Students, Leads, Finance, Tasks, Reports.

### 8.13 Internal messaging (`/automations` tab)

Slack-style 3-column layout: channels list / message thread / reply panel. Pre-populated `#general` conversation. Reactions (emoji + count) with emoji picker. Record linker (Students / Leads / Invoices / Tasks / Concerns). Create Task from chat. `@mention` support. File and image attachment stubs. Enter to send, Shift+Enter for new line.

---

## 9. Cross-screen navigation wiring

Key wired links (reference for real implementation):

| From | Element | Destination |
|---|---|---|
| Dashboard KPI — Overdue Invoices | Click card | `/finance` |
| Dashboard KPI — At-Risk Students | Click card | `/analytics?tab=churn` |
| Dashboard KPI — Open Concerns | Click card | `/progress?tab=alerts` |
| Dashboard KPI — Seat Occupancy | Click card | `/analytics?tab=occupancy` |
| Dashboard — Churn table "View Profile" | Button | `/students/[studentId]` |
| Dashboard — Activity feed items | Click row | Relevant page (mapped by event type) |
| Dashboard — Reports Inbox "View All" | Link | `/reports` |
| Student profile — Flag pills (sidebar) | Click | Same page, `?tab=invoices` / `?tab=concerns` / `?tab=attendance` |
| Student profile — "Mark Attendance" quick action | Button | `/attendance` |
| Student profile — "View Invoice" | Link | `/finance` |
| Finance — Student name in invoice table | Click | `/students/[studentId]` |
| Timetable — "Mark Attendance" | Button | Opens attendance register inside slide-over (no redirect) |
| Tasks — Linked record chip | Click | `/students/[studentId]` |
| Progress — Alerts tab "View Student" | Link | `/students/[studentId]` |
| Attendance — "View Profile" in absence summary | Link | `/students/[studentId]` |
| Leads — detail dialog "View full conversation" | Link | `/automations?tab=internal-messages` |
| People — Broadcast List "Edit rule" | Link | `/automations?tab=rules` |

### Deep-link tab support

These pages read `?tab=` on mount:

- `/students/[id]` — `?tab=invoices`, `?tab=concerns`, `?tab=attendance`, `?tab=grades`, etc.
- `/analytics` — `?tab=revenue`, `?tab=occupancy`, `?tab=churn`, `?tab=staff`
- `/progress` — `?tab=trackers`, `?tab=reports`, `?tab=alerts`, `?tab=assignments`
- `/automations` — `?tab=templates`, `?tab=rules`, `?tab=triggers`, `?tab=dispatch`, `?tab=internal-messages`, `?tab=marketing`, `?tab=execution`
- `/people` — `?tab=overview`, `?tab=duplicates`, `?tab=segments`, `?tab=broadcasts`, `?tab=forms`, `?tab=exports`
- `/feedback` — `?tab=queue`, `?tab=announcements`, `?tab=complaints`, `?tab=surveys`, `?tab=class-discussion`
- `/inventory` — `?tab=catalogue`, `?tab=reorder`, `?tab=ledger`, `?tab=suppliers`

---

## 10. Mock data (`lib/mock-data.ts`)

All data is static mock data. Key exports:

| Export | Type | Used by |
|---|---|---|
| `currentUser` | Object | Shell, topbar, staff |
| `notificationCount` | Number | Topbar bell |
| `kpiCards` | Array | Dashboard |
| `churnRiskStudents` | Array | Dashboard, Analytics |
| `operationalThresholds` | Array | Dashboard |
| `revenueData` | Array | Dashboard, Analytics |
| `occupancyHeatmap` | Array | Dashboard, Analytics |
| `activityFeed` | Array | Dashboard |
| `reportsInbox` | Array | Dashboard, Reports |
| `students` | Array | Students list, profile |
| `studentDetail` | Object | Student profile (rich data) |
| `guardians` | Array | Guardians list, Student profile family section |
| `leads` | Array | Leads pipeline |
| `invoices` | Array | Finance |
| `payments` | Array | Finance |
| `creditLedger` | Array | Finance |
| `enrolments` | Array | Enrolment |
| `trials` | Array | Enrolment |
| `staffMembers` | Array | Staff, Analytics |
| `rooms` | Array | Timetable, Settings |
| `timetableSessions` | Array | Timetable, Attendance |
| `unmarkedSessions` | Array | Attendance |
| `absenceSummary` | Array | Attendance |
| `makeupLog` | Array | Attendance |
| `assessments` | Array | Assessments |
| `tasks` | Array | Tasks |
| `financeStats` | Object | Finance |
| `feedbackItems` | Array | Feedback |
| `announcements` | Array | Feedback |
| `complaints` | Array | Feedback |
| `surveys` | Array | Feedback |
| `inventoryItems` | Array | Inventory (from `Inventory_Stock__Sheet1.csv`) |
| `suppliers` | Array | Inventory |
| `stockLedger` | Array | Inventory |
| `reorderAlerts` | Array | Inventory |
| `automationTemplates` | Array | Automations |
| `automationRules` | Array | Automations |
| `triggerLibrary` | Array | Automations |
| `dispatchQueue` | Array | Automations |
| `internalMessages` | Array | Automations internal messages tab, Leads detail dialog |
| `executionLog` | Array | Automations |
| `duplicateRecords` | Array | People |
| `segments` | Array | People |
| `broadcastLists` | Array | People |
| `forms` | Array | People |
| `exports` | Array | People |

The interfaces in `lib/mock-data.ts` reflect the PRD data model. Use them as a starting point for your ERD — they won't be identical but they're directionally correct.

---

## 11. Settings page — 17 sections

All 17 sections pre-filled with IMI configuration. All values editable in the prototype (local state only).

1. Organisation — org name, legal name, student ID format, VAT, timezone, office hours
2. Branches — branch list, add/archive
3. Departments — list with year group ranges
4. Rooms — list with capacity, soft/hard caps
5. Billing & Invoicing — invoice prefix, VAT rate, payment terms, enrolment fee, revenue tags
6. Payment Plans — instalment splits, reminder schedule
7. Academic Calendar — term timeline, public holidays
8. Subjects & Catalogue — embedded subjects catalogue with pricing, bundles, topics → subtopics → objectives, rubrics, audit trail
9. Staff & HR — CPD target, review cadence, mandatory fields
10. Roles & Permissions — all 12 RBAC roles with staff counts
11. Notifications — locked system notifications + configurable toggles
12. Templates — template library
13. Feature Toggles — 3-state (On / Off / Later) per feature
14. Integrations — all Phase 2 integrations shown as disconnected
15. Churn & Dashboard — churn weights, thresholds, signal weight bars
16. Audit Log — last 10 entries, read-only
17. Data & Privacy — retention policy, DPA status, erasure requests

A detailed design review pass has not been done on Settings. Treat as a layout reference, not a finalised design.

---

## 12. Known bugs flagged from Playwright screenshot review (19 April)

These are logged but not yet fixed. Developer should address during production build:

1. **Teacher and TA sidebar icon count matches Super Admin.** These roles should see a heavily stripped nav. RBAC matrix exists — filter wiring on sidebar is the gap.
2. **Teacher and TA see all 10 dashboard KPI cards including Revenue and Overdue Invoices.** These roles must not see financial KPIs.
3. **Timetable header shows week of 21–25 April 2025** when current date is April 2026. Date drift in timetable week calculation — header should derive from `today`, not hard-coded.

---

## 13. Screens not built (correct omissions)

| Screen | Reason |
|---|---|
| Login / Auth | Not needed for ideation demo — prototype starts at `/dashboard` |
| Onboarding Wizard | Out of scope for prototype — spec is in M20 PRD |
| Guardian Profile page (`/guardians/[id]`) | List page built; detail page Phase 2 |
| Student Profile creation form | Profile view built; Add Student form is placeholder |
| New Enrolment drawer | Placeholder button |
| New Session modal (Timetable) | Placeholder |
| Teacher / Admin / HOD / HR-Finance / Parent / Student portals | Separate surfaces — Phase 2 |
| Platform Admin Panel (`admin.enrolla.app`) | Separate application — Phase 2 |
| WhatsApp / Email send flows | Phase 2 (BSP integration) |
| Real file uploads | No backend |
| Payment gateway flows | Phase 2 (Telr, Network International, Stripe) |

---

## 14. PRD reference

The prototype is built directly from the Enrolla PRD. Authoritative documents:

- `Enrolla_PRD_Band1.md` — Core platform (Items 1–8)
- `Enrolla_PRD_Band2.md` — Operational modules (Items 9–20)
- `Enrolla_PRD_Band3.md` — Commercial / Integrations (Items 21–28)
- Individual module MDs (`03_Student-M17_Student_Profile.md`, etc.)
- `Decisions_Log.md` — All locked product decisions and rationale
- `Enrolla_Handoff_01_Tech_Stack.md` — Backend tech stack (separate from prototype stack)

---

## 15. Notes for developer

1. **This is not a wireframe.** The prototype shows production-level interaction patterns. The real implementation should match or exceed this fidelity.

2. **Mock data = your data model reference.** The interfaces in `lib/mock-data.ts` reflect the PRD data model directionally.

3. **No DnD library was used.** Dashboard drag-to-reorder uses native HTML5 drag events. For the real app, consider `@dnd-kit/core` for accessibility and touch support.

4. **Recharts for all charts.** Reasonable production choice — keep or replace with your preferred charting library.

5. **Tailwind v4 with `@theme` tokens.** Design system is Tailwind-native. If you introduce a different CSS strategy, extract the colour tokens and spacing from `globals.css` first.

6. **Sidebar is permanent 56px.** Do not add a toggle or expanded state. The decision to collapse the sidebar on `/leads` from v1 is obsolete — the sidebar is always 56px now, and the Kanban board is sized accordingly.

7. **Pagination, multi-select filters, and saved segments are client-side patterns in the prototype.** In the real app these need server-side equivalents (query params, API filter params, user-scoped saved filters in the DB).

8. **The `?tab=` deep-link pattern is intentional.** Notifications, alerts, and cross-screen links use it to open pages at a specific tab. The real implementation must honour this pattern.

9. **Phase 2 items are visible but disabled.** Integrations, parent portal, WhatsApp BSP — all shown as "Phase 2" in the UI. Do not remove from the settings and nav — they must be present but inactive at launch.

10. **Three files were dirty (uncommitted) at handover time:** `app/automations/page.tsx`, `app/leads/page.tsx`. These contain the Internal Messages build and the lead detail dialog update. Confirm they are committed before branching.

11. **Playwright suite must stay green.** Run `npx playwright test` after any significant change.

---

## 16. Commit arc

Ten commits from scaffold to handover:

```
095f4dc  scaffold
1513d60  polish (skeletons, mobile)
94d6aec  filtering/sorting
d360289  sidebar redesign + guardians
7322fc4  automations/feedback/people
281d179  RBAC gates
a2235a7  invoice builder + inventory
c334370  route groups + Playwright
019fcf7  ExportDialog
a1b4f8d  subjects catalogue + expanded RBAC + toasts
```

---

*End of document. Questions → Jason Daswani.*
