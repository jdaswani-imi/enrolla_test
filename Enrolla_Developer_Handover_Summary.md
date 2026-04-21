# Enrolla Frontend Prototype — Developer Handover Summary

> **Generated:** 21 April 2026  
> **Source:** Derived entirely from the codebase at the time of writing. No assumptions — everything below is read directly from source files.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Running the Project](#3-running-the-project)
4. [Design System](#4-design-system)
5. [Annotated File Tree](#5-annotated-file-tree)
6. [All Routes](#6-all-routes)
7. [Complete Data Model](#7-complete-data-model)
8. [RBAC Matrix](#8-rbac-matrix)
9. [Shared Components](#9-shared-components)
10. [Lead → Student Workflow](#10-lead--student-workflow)
11. [Key Patterns & Conventions](#11-key-patterns--conventions)
12. [Test Coverage](#12-test-coverage)
13. [Known Gaps (Acceptable for Demo)](#13-known-gaps-acceptable-for-demo)
14. [Recommended Next Steps](#14-recommended-next-steps)

---

## 1. Project Overview

**Enrolla** is a white-label multi-tenant education management SaaS platform. **IMI (Improve ME Institute)**, a tutoring centre at Gold & Diamond Park, Dubai, is the reference customer. This repository contains the **Tenant Super Admin portal** — the frontend-only prototype used for stakeholder sign-off before backend build begins.

The prototype covers everything an IMI administrator would do day-to-day: lead intake and CRM pipeline, student and guardian records, session timetabling, attendance marking, academic progress and reporting, finance/invoicing, staff management, task management, automations, inventory, and analytics.

**No backend. All data is mocked.** The single source of truth for seed data is `lib/mock-data.ts` (~2,952 lines).

---

## 2. Tech Stack

| Layer | Library / Version |
|---|---|
| Framework | Next.js 16.2.4 (App Router) |
| UI runtime | React 19.2.4 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) — `@theme` syntax, no `tailwind.config.js` |
| Component system | Base UI (`@base-ui/react ^1.4.0`) + `class-variance-authority ^0.7.1` — shadcn style `base-nova` |
| Utility | `clsx ^2.1.1` + `tailwind-merge ^3.5.0` (combined in `cn()`) |
| Icons | `lucide-react ^1.8.0` (only library used) |
| Charts | `recharts ^3.8.1` |
| Toasts | `sonner ^2.0.7` |
| Animations | `tw-animate-css ^1.4.0` |
| Testing | `@playwright/test ^1.59.1` (e2e only, no unit tests) |
| Font | Plus Jakarta Sans via `next/font/google` (weights 400/500/600/700) |

**Key dev dependencies:** TypeScript 5, `@types/react`, `@types/node`, `eslint-config-next` with `core-web-vitals`.

---

## 3. Running the Project

```bash
npm run dev        # Dev server at http://localhost:3000
npm run build      # Production build
npm run start      # Serve production build
npm run lint       # ESLint (next + core-web-vitals + TypeScript)

# E2E tests (requires dev server running on :3000)
npx playwright test
npx playwright test tests/e2e/smoke.spec.ts
npx playwright test -g "smoke loads all routes"
```

Playwright config: `playwright.config.ts` — targets `http://localhost:3000`, viewport 1440×900, screenshots on failure saved to `tests/screenshots/`.

---

## 4. Design System

### 4.1 CSS Custom Properties (`app/globals.css`)

```css
:root {
  --background:            #F8FAFC;   /* content area bg */
  --foreground:            #0F172A;
  --card:                  #ffffff;
  --card-foreground:       #0F172A;
  --primary:               #F59E0B;   /* amber — all primary actions */
  --primary-foreground:    #0F172A;
  --secondary:             #F1F5F9;
  --secondary-foreground:  #0F172A;
  --muted:                 #F1F5F9;
  --muted-foreground:      #64748B;
  --accent:                #FEF3C7;
  --accent-foreground:     #92400E;
  --border:                #E2E8F0;
  --input:                 #E2E8F0;
  --ring:                  #F59E0B;
  --chart-1:               #F59E0B;
  --chart-2:               #3B82F6;
  --chart-3:               #10B981;
  --chart-4:               #8B5CF6;
  --chart-5:               #EF4444;
  --radius:                0.5rem;
  --sidebar:               #0F172A;   /* deep navy */
  --sidebar-foreground:    #94A3B8;
  --sidebar-primary:       #F59E0B;
  --sidebar-primary-foreground: #0F172A;
  --sidebar-accent:        rgba(255,255,255,0.08);
  --sidebar-border:        rgba(255,255,255,0.06);
  --sidebar-ring:          #F59E0B;
}
```

### 4.2 Keyframe Animations

| Name | Usage |
|---|---|
| `fadeSlideIn` | Page transition — applied via `.page-enter` class keyed on `pathname` |
| `pulse-dot` | Notification badge pulse |
| `slideInLeft` | Sidebar flyout panel entrance |
| `slideInRight` | Slide-over entrance (lead detail panel) |
| `fadeIn` | General fade |
| `undo-toast-shrink` | 5-second linear shrink for kanban undo bar |

### 4.3 Utility Class

```css
.btn-primary {
  @apply bg-amber-500 text-white hover:bg-amber-600 active:scale-95
         transition-all duration-150 rounded-md px-4 py-2 text-sm font-medium;
}
```

### 4.4 Font

`Plus Jakarta Sans` via `next/font/google`, variable name `--font-sans`, weights 400/500/600/700, applied to `<body>`.

### 4.5 Summary of Design Tokens

- **Primary accent:** `#F59E0B` (amber-500)
- **Sidebar background:** `#0F172A` (navy)
- **Sidebar panel (flyout):** `#1E293B` (slate-800)
- **Content background:** `#F8FAFC` (slate-50)
- **Secondary/muted bg:** `#F1F5F9` (slate-100)
- **Muted text:** `#64748B` (slate-500)
- **Border/input:** `#E2E8F0` (slate-200)

---

## 5. Annotated File Tree

```
enrolla_frontend_prototype/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout: providers + font + Toaster
│   ├── page.tsx                      # Root redirect → /dashboard
│   ├── globals.css                   # Tailwind v4 @theme tokens + animations
│   │
│   ├── login/page.tsx                # Login page (bypasses AppShell)
│   ├── dashboard/page.tsx            # Role-scoped dashboard (8 views)
│   ├── students/
│   │   ├── page.tsx                  # Students list (search, filter, sort, RBAC)
│   │   └── [id]/page.tsx             # Student profile (7 tabs, editable)
│   ├── guardians/
│   │   ├── page.tsx                  # Guardians list
│   │   └── [id]/page.tsx             # Guardian detail
│   ├── leads/page.tsx                # Leads CRM (table + kanban + detail slide-over)
│   ├── enrolment/page.tsx            # Enrolment management (active/trial/withdrawal)
│   ├── timetable/page.tsx            # Weekly timetable grid
│   ├── attendance/page.tsx           # Attendance (Today tab + Overview tab)
│   ├── assessments/page.tsx          # Assessments (3 tabs)
│   ├── progress/page.tsx             # Academic progress (4 tabs)
│   ├── feedback/page.tsx             # Feedback (5 tabs)
│   ├── finance/page.tsx              # Finance (4 tabs)
│   ├── staff/page.tsx                # Staff (2 tabs)
│   ├── tasks/page.tsx                # Tasks kanban + list
│   ├── automations/page.tsx          # Automations (7 tabs)
│   ├── inventory/page.tsx            # Inventory (4 tabs)
│   ├── people/page.tsx               # People directory (6 tabs)
│   ├── analytics/page.tsx            # Analytics (4 tabs)
│   ├── reports/page.tsx              # Reports
│   ├── settings/
│   │   ├── page.tsx                  # Settings (multi-section left-nav)
│   │   └── subjects-catalogue.tsx    # Subjects catalogue section (extracted component)
│   ├── profile/page.tsx              # User profile page
│   │
│   └── (invoice)/                    # Route group — bypasses root layout
│       ├── layout.tsx                # Minimal layout (no sidebar, no topbar)
│       └── finance/invoice/new/
│           ├── layout.tsx
│           └── page.tsx              # Full-screen invoice builder
│
├── components/
│   ├── layout/
│   │   ├── app-shell.tsx             # Shell: hides sidebar/topbar on /login
│   │   ├── app-sidebar.tsx           # 56px icon rail + hover flyout panels
│   │   ├── top-bar.tsx               # Sticky topbar: title, search, role switcher, notifications
│   │   └── global-search.tsx         # Cmd+K global search overlay
│   │
│   ├── ui/                           # Primitive components (Base UI + CVA)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   ├── avatar.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx                 # Slide-over (used for lead detail)
│   │   ├── sidebar.tsx               # Sidebar primitives
│   │   ├── skeleton.tsx
│   │   ├── skeleton-loader.tsx       # SkeletonKpi, SkeletonTable, SkeletonCard
│   │   ├── tooltip.tsx
│   │   ├── empty-state.tsx
│   │   ├── access-denied.tsx         # RBAC gate component
│   │   ├── role-banner.tsx           # Development role indicator banner
│   │   ├── multi-select-filter.tsx   # Reusable multi-select dropdown filter
│   │   ├── sortable-header.tsx       # Table column sort header
│   │   ├── pagination-bar.tsx        # Table pagination
│   │   ├── date-range-picker.tsx     # Date range picker with presets
│   │   └── export-dialog.tsx         # Export format dialog (CSV / Google Contacts CSV)
│   │
│   ├── journey/                      # Lead → Student conversion dialogs
│   │   ├── book-assessment-dialog.tsx
│   │   ├── log-assessment-outcome-dialog.tsx
│   │   ├── skip-assessment-dialog.tsx
│   │   ├── book-trial-dialog.tsx
│   │   ├── log-trial-outcome-dialog.tsx
│   │   ├── trial-skip-prompt-dialog.tsx
│   │   ├── needs-more-time-dialog.tsx
│   │   ├── schedule-offer-dialog.tsx
│   │   ├── schedule-confirm-dialog.tsx
│   │   ├── convert-to-student-dialog.tsx
│   │   ├── create-enrolment-dialog.tsx
│   │   ├── invoice-builder-dialog.tsx
│   │   ├── record-payment-dialog.tsx
│   │   ├── skip-warning-dialog.tsx
│   │   ├── whatsapp-block.tsx        # WhatsApp preview / send block
│   │   ├── dialog-parts.tsx          # Shared dialog primitives (FIELD, FieldLabel, etc.)
│   │   ├── subject-select.tsx        # Subject selector tied to year group
│   │   └── time-select.tsx           # Time slot selector
│   │
│   ├── enrolment/
│   │   ├── new-enrolment-dialog.tsx  # Full enrolment creation flow
│   │   └── trial-action-dialogs.tsx  # Trial pause/withdraw/convert actions
│   │
│   ├── staff/
│   │   ├── add-staff-dialog.tsx      # Add new staff member
│   │   ├── leave-handover-dialog.tsx # Emergency leave + handover
│   │   └── request-leave-dialog.tsx  # Staff leave request
│   │
│   ├── timetable/
│   │   └── new-session-dialog.tsx    # Create new session
│   │
│   ├── tasks/
│   │   └── new-task-dialog.tsx       # Create new task
│   │
│   ├── reports/
│   │   └── generate-report-dialog.tsx
│   │
│   ├── add-student-dialog.tsx        # 3-step add student dialog
│   └── invoice-builder.tsx           # Full-screen invoice builder component
│
├── lib/
│   ├── mock-data.ts                  # ~2952 lines — all seed data + interfaces
│   ├── role-config.ts                # Role type, PERMISSIONS matrix, canDo(), canAccess()
│   ├── role-context.tsx              # RoleProvider + useRole()
│   ├── use-permission.ts             # usePermission() hook → { can, sees, role }
│   ├── dashboard-config.ts           # Per-role dashboard configs (KPIs, sections)
│   ├── journey-store.tsx             # JourneyProvider — lead→student state machine
│   ├── assessment-store.tsx          # AssessmentProvider — assessment bookings
│   └── utils.ts                      # cn() = clsx + tailwind-merge
│
├── hooks/
│   ├── use-mobile.ts                 # useIsMobile() — matchMedia at 768px
│   └── use-saved-segments.ts         # useSavedSegments() — persisted filter segments
│
├── tests/
│   └── e2e/
│       ├── smoke.spec.ts             # 40 smoke tests across all routes + tabs + roles
│       └── deep.spec.ts              # Deeper interaction tests
│
├── CLAUDE.md                         # Claude Code instructions (references AGENTS.md)
├── AGENTS.md                         # Next.js version warning for agents
├── playwright.config.ts
├── package.json
├── tsconfig.json
├── postcss.config.mjs
└── components.json                   # shadcn-style aliases
```

---

## 6. All Routes

### 6.1 `/login`

Login page. Bypasses `AppShell` — no sidebar, no topbar. Simple credential form (non-functional, navigates to `/dashboard`).

---

### 6.2 `/dashboard`

**RBAC:** All roles (each sees a different view).

Role-scoped dashboard driven by `lib/dashboard-config.ts`. The `getDashboardConfig(role)` function returns a `DashboardConfig` with: `subtitle`, `kpiGridClass`, `kpis[]`, `sections[]`, and `draggable` flag.

**Dashboard sections by role:**

| Role | KPI Count | Sections | Draggable |
|---|---|---|---|
| Super Admin / Admin Head | 10 KPIs | activity-reports, churn-thresholds, charts | Yes |
| Admin | 6 KPIs | admin-activity, admin-churn-simple | No |
| Academic Head | 6 KPIs | academic-alerts, academic-churn, academic-activity | No |
| HOD | 4 KPIs (dept-scoped) | hod-workload, hod-alerts, hod-upcoming, hod-approvals | No |
| Teacher | 3 KPIs | teacher-sessions, teacher-pending, teacher-tasks | No |
| TA | 2 KPIs | ta-sessions, ta-tasks | No |
| HR/Finance | 5 KPIs | hr-revenue, hr-invoice-status, hr-cpd | No |

**Super Admin / Admin Head sections:**
- **Activity & Reports:** Recent activity feed (12 events), reports inbox (5 items), internal messages panel
- **Churn Thresholds:** Operational thresholds table + churn risk students list (8 records) with colour-coded risk levels
- **Charts:** Revenue bar chart (6 months Recharts) + occupancy heatmap (Mon–Fri × 8 time slots)

**Features:** Skeleton loaders on initial mount (200ms delay), drag-to-reorder for Super Admin/Admin Head, `?tab=` deep links from KPI cards and alert rows.

---

### 6.3 `/students`

**RBAC:** `students.view` — Super Admin, Admin Head, Admin, Academic Head, HOD, Teacher, TA.

**Features:**
- Search by name, ID, guardian, school
- Multi-select filters: Status, Year Group, Department, Churn Risk
- Sortable columns (name, year group, department, status, created)
- Pagination (25 per page)
- Row actions: View profile, Edit, Add Enrolment, Create Task, Flag concern
- Add Student button (→ `add-student-dialog.tsx`, 3-step modal) — gated `students.create`
- Export button — gated `students.export`
- Churn score badge per row with colour coding

**RBAC gates on actions:**
- `students.create` → Add Student button
- `students.delete` → Delete option in row menu (Super Admin only)
- `students.export` → Export button

---

### 6.4 `/students/[id]`

**RBAC:** `students.view`. Hardcoded to Aisha Rahman (IMI-0001) for prototype — `useParams()` reads the ID but data is always `studentDetail`.

**Tabs (7):**

| Tab | Content |
|---|---|
| **Overview** | Editable profile card, guardian section, enrolments summary, upcoming sessions, active concerns |
| **Enrolments** | Enrolment list with status badges, add enrolment dialog (`new-enrolment-dialog.tsx`), pause/withdraw actions |
| **Attendance** | Attendance rate per subject, history table, makeup log, book makeup button |
| **Finance** | Invoice list, outstanding balance, record payment dialog, credit ledger |
| **Progress** | Grade assignments table, subject grades, target grades, progress reports |
| **Feedback** | Feedback items for this student, AI summary, selector values |
| **Communication Log** | Static placeholder (not wired to data) |

**RBAC gates:** Edit profile (`students.edit`), financial tab (`students.viewFinancial`), delete (`students.delete`), year group edit (`students.editYearGroup`).

**Cross-module linking:** Tasks linked to this student show inline. `?tab=finance` / `?tab=attendance` deep-link from dashboard alerts.

---

### 6.5 `/guardians`

**RBAC:** `guardians.view` — Super Admin, Admin Head, Admin.

**Features:**
- Table with search + filter (DNC status, preferred channel, unsubscribed)
- 12 extended guardian records with: linked students, DNC flag, unsubscribed flag, preferred channel (WhatsApp/Email/In-app)
- Row actions: View, Edit, Set DNC (gated `guardians.setDNC`)
- Add Guardian button (gated `guardians.create`)

---

### 6.6 `/guardians/[id]`

Guardian detail page. Shows linked students, contact info, communication preferences, DNC status, and activity history.

---

### 6.7 `/leads`

**RBAC:** `leads.view` — Super Admin, Admin Head, Admin.

This is the most feature-rich page in the prototype.

**Three view modes (toggle):**
1. **Table view** — paginated list with sortable columns
2. **Kanban view** — columns per stage, cards with key info (DNC badge, sibling badge, stage message pending indicator)
3. **Lead Detail slide-over** — full-width right panel for selected lead

**Filters:** Stage (multi), Source (multi), Year Group (multi), Assigned Staff, DNC toggle, search

**Lead detail slide-over tabs:**
- **Overview:** Stage progress bar, key fields, WhatsApp message block, DNC interstitial
- **Activity:** Timeline of stage changes + notes
- **Tasks:** Tasks linked to this lead + create task inline
- **Chat:** Internal team chat with @mentions, record tags, reactions (`internalMessages` mock data)

**Journey action buttons (context-sensitive per stage):**

| Stage | Available Action |
|---|---|
| New | Book Assessment / Skip Assessment |
| Assessment Booked | Log Assessment Outcome |
| Assessment Done | Book Trial / Skip Trial |
| Trial Booked | Log Trial Outcome |
| Trial Done | Offer Schedule / Needs More Time |
| Schedule Offered | Confirm Schedule |
| Schedule Confirmed | Convert to Student |
| Invoice Sent | Record Payment (Paid = Won) |

All journey dialogs are in `components/journey/`. The `JourneyProvider` (context) drives state for Bilal Mahmood (L-0041) — the demo lead that shows a complete journey.

**RBAC gates:**
- Create lead: `leads.create`
- Delete lead: `leads.delete`
- Assign staff: `leads.assignStaff`
- Convert: `leads.convert`

---

### 6.8 `/enrolment`

**RBAC:** `enrolment.view` — Super Admin, Admin Head, Admin.

**Three tabs (via toggle buttons, not URL tabs):**

| Tab | Content |
|---|---|
| **Active** | 15 enrolment records — student, subject, teacher, package, sessions remaining, invoice status |
| **Trials** | 5 trial records — outcome badges (Recommended, Pending, Parent to decide) |
| **Withdrawals** | 5 withdrawal records — reason, date, invoice status |

**Actions:**
- New Enrolment button → `new-enrolment-dialog.tsx` (multi-step)
- Row actions: Pause, Withdraw, Transfer Sibling (gated `enrolment.transferSibling`)

---

### 6.9 `/timetable`

**RBAC:** `timetable.view` — Super Admin, Admin Head, Admin, Academic Head, HOD, Teacher, TA.

**Weekly grid:** Mon–Sat columns, 09:00–20:00 rows, 37 mock sessions. Colour-coded by subject department. Session card shows: subject, teacher, room, student count, status badge.

**Session detail modal:** Click any session to open details. Shows attendance status, enrolled students list.

**Actions:**
- New Session → `new-session-dialog.tsx` (gated `timetable.createSession`)
- Cancel session (gated `timetable.cancelSession`)
- Assign teacher (gated `timetable.assignTeacher`)

---

### 6.10 `/attendance`

**RBAC:** `attendance.view` — all roles except HR/Finance.

**Tabs:**

| Tab | Content |
|---|---|
| **Today** | Sessions happening today, attendance marking (Present/Absent/Late per student), 48-hour lock indicator |
| **Overview** | Historical attendance by subject, absence records, makeup log |

**Actions:**
- Mark attendance: `attendance.mark`
- Correct attendance: `attendance.correct`
- Unlock 48h window: `attendance.unlockWindow`
- Book makeup: `attendance.bookMakeup`
- Override makeup eligibility: `attendance.overrideMakeup`

---

### 6.11 `/assessments`

**RBAC:** `assessments.view` — Super Admin, Admin Head, Admin, Academic Head, HOD.

**Tabs:**

| Tab | Content |
|---|---|
| **Upcoming** | 10 assessment records — booked, link sent, awaiting booking |
| **Outcomes** | Assessments with entered outcomes |
| **Slots** | Assessment slot management (gated `assessments.manageSlots`) |

**Actions:**
- Book Assessment → triggers journey flow (gated `assessments.book`)
- Enter Outcome (gated `assessments.enterOutcome`)

---

### 6.12 `/progress`

**RBAC:** `progress.view` — Super Admin, Admin Head, Admin, Academic Head, HOD, Teacher, TA.

**Tabs:**

| Tab | Content |
|---|---|
| **Trackers** | Subject progress trackers per student — grade trends |
| **Reports** | AI-generated progress reports with approval workflow (Draft → Pending Approval → Approved → Sent) |
| **Alerts** | Academic concern alerts (L1/L2/L3) — attendance below 80%, assessment drops, tracker breaches |
| **Assignments** | Grade assignment entries per subject |

**Actions:**
- Enter grades: `progress.enterGrades`
- Approve report: `progress.approveReport`
- Generate report: `progress.generateReport`
- Dismiss alert: `progress.dismissAlert`
- Set target grade: `progress.setTargetGrade`

---

### 6.13 `/feedback`

**RBAC:** `feedback.view` — Super Admin, Admin Head, Admin, Academic Head, HOD, Teacher, TA.

**Tabs (5):**

| Tab | Content |
|---|---|
| **Feedback Queue** | 12 feedback items — score badge, status (Draft/Pending Approval/Approved/Sent/Rejected), AI summary, teacher notes, selectors |
| **Announcements** | 8 pre/post-session announcements — audience, status (Draft/Pending/Sent) |
| **Complaints** | 6 complaint tickets — severity, category, two-sign-off escalation workflow |
| **Surveys** | NPS survey responses (10 sent) + pending surveys (5) — Promoter/Passive/Detractor categories |
| **Class Discussion** | 4 class groups with threaded posts (Announcement/Discussion/Question types) |

**Actions:**
- Submit feedback: `feedback.submit`
- Approve feedback: `feedback.approve`
- Raise complaint: `feedback.raiseComplaint`
- Resolve complaint: `feedback.resolveComplaint`
- Send survey: `feedback.sendSurvey`
- Post to discussion: `feedback.postDiscussion`

---

### 6.14 `/finance`

**RBAC:** `finance.view` — Super Admin, Admin Head, Admin, Academic Head, HOD, HR/Finance.

**Tabs (4):**

| Tab | Content |
|---|---|
| **Invoices** | 23 invoice records — search, filter (status, student, date range), sortable, row actions |
| **Payments** | 10 payment records — method badges, date range filter |
| **Credits** | 6 credit records — amount, reason, issuer, status |
| **Reports** | Finance summary (revenue KPIs) |

**Invoice row actions:** View, Edit (gated `finance.editInvoice`), Void (gated `finance.voidInvoice`), Log Payment (gated `finance.logPayment`), Apply Discount (gated `finance.applyDiscount`)

**Invoice builder:** `/finance/invoice/new` — separate route group, full-screen layout, live preview panel. Creates invoice with line items, student lookup, due date, and generates a formatted preview.

**Monetary format throughout:** `Intl.NumberFormat('en-AE', { minimumFractionDigits: 2 })` — displayed as `AED 3,360.00`.

---

### 6.15 `/finance/invoice/new`

Full-screen invoice builder at route group `app/(invoice)/`. Bypasses root layout — no sidebar, no topbar, no scroll container. Has its own minimal layout.

**Features:** Student search autocomplete, line item builder, due date picker, live invoice preview panel (updates in real-time as fields change), status badge (Draft until saved).

---

### 6.16 `/staff`

**RBAC:** `staff.view` — Super Admin, Admin Head, Admin, Academic Head, HOD, HR/Finance.

**Tabs (2):**

| Tab | Content |
|---|---|
| **Directory** | 12 staff records — role badge, department, sessions this week, CPD progress bar, contract type, workload level |
| **HR Dashboard** | CPD completion rates, leave log, staff status overview |

**Actions:**
- Add Staff → `add-staff-dialog.tsx` (gated `staff.create`)
- Edit staff: `staff.edit`
- View salary: `staff.viewSalary`
- Assign role: `staff.assignRole` (Super Admin only)
- Revoke access: `staff.revokeAccess`
- Initiate offboarding: `staff.initiateOffboarding`
- Emergency leave → `leave-handover-dialog.tsx` (gated `staff.activateEmergencyLeave`)
- Request leave → `request-leave-dialog.tsx`
- Verify CPD: `staff.verifyCPD`

---

### 6.17 `/tasks`

**RBAC:** `tasks.view` — Super Admin, Admin Head, Admin, Academic Head, HOD, HR/Finance.

**Views:** Kanban (4 columns: Open, In Progress, Blocked, Done) + List view toggle.

22 task records. Kanban has undo-on-move with 5-second animated undo bar (`undo-toast-shrink` animation).

**Task card:** Title, type badge, priority badge, assignee avatar, due date, overdue indicator, linked record chip (student/lead).

**Task detail modal:** Full task detail with description, subtasks (checkbox list), linked record, source lead (for tasks created from lead chat).

**Actions:**
- Create task → `new-task-dialog.tsx` (all roles with `tasks.create`)
- Edit own task: `tasks.editOwn`
- Edit others' tasks: `tasks.editOthers`
- Delete own: `tasks.deleteOwn`
- Delete others: `tasks.deleteOthers`
- Reassign: `tasks.reassign`

---

### 6.18 `/automations`

**RBAC:** `automations.view` — Super Admin, Admin Head, Admin.

**Tabs (7):**

| Tab | Content |
|---|---|
| **Templates** | 12 automation templates — type (Message/Email/Task/Announcement), status, merge fields list, version, locked indicator |
| **Rules** | 18 automation rules — trigger type, module, status (Enabled/Disabled/Locked), fire count, last fired |
| **Trigger Library** | Reference library of trigger events (static) |
| **Dispatch Queue** | 12 queued messages — claimed/unclaimed/sent, rendered body preview, claim/release actions |
| **Internal Messages** | Team chat feed (6 messages with reactions, @mentions, record tags) |
| **Marketing** | Marketing moments calendar + campaign table (8 campaigns) |
| **Execution Log** | 15 execution log entries — payload rows, condition results, action results, recipient routing (expandable detail) |

**Actions (gated `automations.createRule` / `automations.editRule`):**
- Toggle rules on/off
- Create/edit templates (gated `templates.create` / `templates.editOrgWide`)
- Claim/release dispatch queue messages

---

### 6.19 `/inventory`

**RBAC:** `inventory.view` — Super Admin, Admin Head, Admin, Academic Head, HOD, HR/Finance.

**Tabs (4):**

| Tab | Content |
|---|---|
| **Catalogue** | 38 inventory items across 9 categories — stock health badges (healthy/approaching/below), auto-deduct rules, per-item ledger |
| **Reorder Alerts** | 7 reorder alerts — open/ordered/ignored status, supplier contact, one-click order action |
| **Stock Ledger** | 28 ledger entries — change type (auto_deduct/manual_add/reorder_received/waste/stock_take_correction/auto_deduct_failed), actor, timestamp |
| **Suppliers** | 14 supplier records — contact details, item count, notes |

**Inventory categories:** Folders & Files, Plastic Folders, Stickers & Labels, Lanyards, Bags, Writing Instruments, Erasers & Correction, Paper Products, Cleaning & Hygiene, Filing & Organisation, Printing & Lamination, Electronics & Tech, Arts & Crafts, Branded Materials, Health & Safety.

**Auto-deduct rules:** Inventory items can have rules that deduct stock automatically when an enrolment is confirmed — tied to department + year group + trigger event + quantity + condition.

---

### 6.20 `/people`

**RBAC:** `people.view` — Super Admin, Admin Head, Admin, Academic Head, HR/Finance.

**Tabs (6):**

| Tab | Content |
|---|---|
| **Directory** | 20 PersonRecord entries across Student/Guardian/Lead/Staff types — search, filter by type |
| **Duplicates** | 6 duplicate detection records — match score, matched fields, threshold (High/Medium/Low), Pending/Resolved/Dismissed status. Merge wizard (step 1 built; steps 2–4 static) |
| **Segments** | 14 segments — Org-Wide vs Personal scope, record type, member count, auto-refresh timestamp |
| **Broadcast Lists** | 8 broadcast lists — member count, auto-rule flag, member preview, exclusion management |
| **Forms** | 7 forms — Lead Enquiry/Profile Update/Custom types, status, submission count, pinned flag. 12 form submissions with field details |
| **Exports** | 8 export history records — format (Standard CSV/Google Contacts CSV), filters applied, row count |

**Actions:**
- Export: `people.export`
- Create segment: `people.createSegment`
- Create org-wide segment: `people.createOrgSegment`
- Manage forms: `people.manageForms`
- Manage broadcasts: `people.manageBroadcasts`

---

### 6.21 `/analytics`

**RBAC:** `analytics.view` — Super Admin, Admin Head, Academic Head, HOD, HR/Finance.

**Tabs (4):**

| Tab | Content |
|---|---|
| **Revenue** | Revenue bar chart (invoiced vs collected, 6 months), KPI cards |
| **Occupancy** | Heatmap grid (Mon–Fri × 8 time slots, percentage fill) |
| **Churn** | Churn risk breakdown, trend data |
| **Staff** | Staff CPD completion, workload distribution |

All charts use Recharts (`BarChart`, `ResponsiveContainer`, `CartesianGrid`, etc.).

---

### 6.22 `/reports`

**RBAC:** `reports.view` — Super Admin, Admin Head, Admin, Academic Head, HOD, HR/Finance.

Reports inbox (5 items: Weekly Digest, Churn Risk, Term Revenue, Academic Alerts, Staff Attendance). Generate report dialog (gated `reports.generate`). Schedule report (gated `reports.schedule`).

---

### 6.23 `/settings`

**RBAC:** `settings.view` — Super Admin only.

Left-nav panel with sections (not URL tabs — section state held in local useState):

| Section | Content |
|---|---|
| Organisation | Org name, contact details, address, logo upload |
| Branches | Branch management |
| Departments | Department configuration (Primary, Lower Secondary, Senior) |
| Rooms | 5 rooms (Room 1A, 1C, 2A, 2B, 3A) with capacity |
| Billing | Billing settings, payment terms |
| Payment Plans | Payment plan configuration |
| Academic Calendar | Term dates |
| Subjects | Subject catalogue — `subjects-catalogue.tsx` (gated `catalogue.edit`) |
| Staff / HR | HR settings |
| Roles | RBAC role editor — permissions matrix viewer (gated `settings.manageRoles`) |
| Notifications | Notification preferences |
| Integrations | Integration placeholders |
| Reports Settings | Report configuration |
| Feature Flags | Feature toggle switches |
| Danger Zone | Account deletion / data reset |

---

### 6.24 `/profile`

User profile page — displays current user's details (Jason Daswani, Super Admin). Edit fields inline.

---

### 6.25 `/page.tsx` (root)

Immediate redirect to `/dashboard`.

---

## 7. Complete Data Model

All types are exported from `lib/mock-data.ts` and `lib/journey-store.tsx`.

### 7.1 Core Entities

```typescript
// Current user (singleton)
currentUser: {
  name: string          // "Jason Daswani"
  role: Role            // "Super Admin"
  avatar: string
  avatarUrl: string
  org: string           // "IMI"
}

// Org settings
orgSettings: {
  name: string          // "Improve ME Institute"
  shortName: string     // "IMI"
  timezone: string      // "Asia/Dubai"
  currency: string      // "AED"
  // ... other fields
}
```

### 7.2 Student

```typescript
type StudentStatus = "Enrolled" | "Paused" | "Withdrawn" | "Pending";
type ChurnLevel = "High" | "Medium" | "Low" | "None";

interface Student {
  id: string;           // "IMI-0001"
  name: string;
  yearGroup: string;    // "Y8"
  department: string;   // "Lower Secondary"
  school: string;
  guardian: string;
  guardianPhone: string;
  enrolments: string[]; // subject names
  churnScore: number;   // 0–100
  status: StudentStatus;
  lastContact: string;
  createdOn: string;
}
// 20 records: IMI-0001 through IMI-0020
```

### 7.3 Student Detail (extended, IMI-0001)

```typescript
studentDetail: {
  // Profile fields (editable)
  firstName, lastName, preferredName, dob, gender, nationality
  medicalNotes, learningNeeds, schoolName, schoolYear
  
  // Guardian
  guardianName, guardianRelationship, guardianPhone, guardianEmail
  secondaryGuardianName, secondaryGuardianRelationship, ...
  
  // Collections
  enrolments: StudentEnrolment[]
  upcomingSessions: UpcomingSession[]
  invoices: StudentInvoice[]
  attendanceSummary: AttendanceSubjectSummary[]
  attendanceHistory: AttendanceHistoryRow[]
  makeupLog: MakeupLogEntry[]
  gradeAssignments: GradeAssignment[]
  subjectGrades: SubjectGrades[]
  tasks: StudentTask[]
  concerns: StudentConcern[]
  commLog: CommLogEntry[]
}
```

### 7.4 Guardian

```typescript
interface Guardian {
  id: string;           // "G-001"
  name: string;
  email: string;
  phone: string;
  students: GuardianStudent[]; // { name, yearGroup, status }
}
// 12 records. G-010 Saeed Al-Zaabi has 2 children; G-012 Elias Khouri has 2 children.

interface ExtendedGuardian {
  id, name, phone, email
  linkedStudents: string[]
  dnc: boolean
  unsubscribed: boolean
  preferredChannel: "WhatsApp" | "Email" | "In-app"
  createdOn: string
}
// 12 records (G-001 to G-012), 2 with dnc:true (G-006, G-012)
```

### 7.5 Lead

```typescript
type LeadStage =
  | "New" | "Contacted" | "Assessment Booked" | "Assessment Done"
  | "Trial Booked" | "Trial Done" | "Schedule Offered"
  | "Schedule Confirmed" | "Invoice Sent" | "Paid" | "Lost";

type LeadSource = "Website" | "Referral" | "WhatsApp" | "Walk-in" | "Instagram" | "Social";

interface Lead {
  id: string;           // "L-0041"
  ref: string;
  childName: string;
  yearGroup: string;
  department: string;
  subjects: string[];
  guardian: string;
  guardianPhone: string;
  source: LeadSource;
  stage: LeadStage;
  assignedTo: string | null;
  lastActivity: string;
  daysInStage: number;
  daysInPipeline: number;
  dnc: boolean;
  sibling: boolean;
  stageMessagePending: boolean;
  preferredDays?: string[];
  preferredWindow?: PreferredWindow;
}
// 22 records (L-0041 to L-0062), all 11 stages represented
```

### 7.6 Invoice / Payment / Credit

```typescript
type InvoiceStatus = "Paid" | "Overdue" | "Part" | "Issued" | "Draft" | "Void";

interface Invoice {
  id: string;           // "INV-1001"
  studentId: string;
  student: string;
  yearGroup, department, guardian: string;
  description: string;
  issueDate, dueDate: string;
  amount: number;       // AED
  amountPaid: number;
  status: InvoiceStatus;
}
// 23 records

type PaymentMethod = "Cash" | "Bank Transfer" | "Card" | "Cheque";
interface Payment {
  date, student, invoice: string;
  amount: number;
  method: PaymentMethod;
  reference, recordedBy: string;
}
// 10 records

type CreditStatus = "Active" | "Applied" | "Expired";
interface Credit {
  date, student: string;
  amount: number;
  reason, issuedBy: string;
  status: CreditStatus;
}
// 6 records
```

### 7.7 TimetableSession

```typescript
type SessionType = "Regular" | "Makeup" | "Trial" | "Assessment";
type SessionStatus = "Scheduled" | "Completed" | "Cancelled" | "Rescheduled";

interface TimetableSession {
  id, day, date, subject, department, teacher, room: string;
  startTime, endTime: string;       // "09:00", "10:00"
  duration: number;                  // minutes
  students: string[];
  studentCount: number;
  type: SessionType;
  status: SessionStatus;
  isTrial?: boolean;
  attendanceMarked?: boolean;
}
// 37 sessions, Mon–Sat

interface Room { id, name: string; capacity: number; }
// 5 rooms: Room 1A, 1C, 2A, 2B, 3A
```

### 7.8 Staff

```typescript
type StaffStatus = "Active" | "On Leave" | "Emergency Leave" | "Offboarding";
type ContractType = "Full-time" | "Part-time" | "Sessional";
type WorkloadLevel = "Low" | "Moderate" | "High";

interface StaffMember {
  id: string;           // "STAFF-001"
  name, email: string;
  role: Role;
  department: string;
  subjects: string[];
  sessionsThisWeek: number;
  cpdHours, cpdTarget: number;
  status: StaffStatus;
  hireDate: string;
  contractType: ContractType;
  lineManager: string;
  workloadLevel: WorkloadLevel;
}
// 12 records
```

### 7.9 Enrolment / Trial / Withdrawal

```typescript
interface Enrolment {
  id: string;           // "ENR-001"
  studentId, student, yearGroup, department, subject, teacher: string;
  sessionsTotal, sessionsRemaining: number;
  frequency, package: string;
  invoiceStatus: string;
  enrolmentStatus: string;
}
// 15 records

interface Trial {
  id, student, yearGroup, subject, teacher, trialDate: string;
  invoiceStatus: string;
  outcome: "Recommended ✅" | "Pending" | "Parent to decide";
  notes?, followUpDate?, cancellationReason?: string;
}
// 5 records

interface Withdrawal {
  id, student, yearGroup, department: string;
  subjects: string[];
  withdrawalDate, reason: string;
  invoiceStatus: "Paid" | "Overdue" | "Part" | "Pending";
  recordStatus: "Active" | "Resolved";
}
// 5 records
```

### 7.10 Task

```typescript
type TaskType = "Admin" | "Academic" | "Finance" | "HR" | "Student Follow-up" | "Cover" | "Personal";
type TaskPriority = "Urgent" | "High" | "Medium" | "Low";
type TaskStatus = "Open" | "In Progress" | "Blocked" | "Done";

interface Task {
  id: string;           // "TK-001"
  title, type: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee, dueDate: string;
  linkedRecord: { type: string; name: string; id: string } | null;
  description: string;
  subtasks: string[];
  overdue: boolean;
  sourceLeadId?: string;
  sourceLeadName?: string;
}
// 22 records (TK-001 to TK-022)
```

### 7.11 Assessment

```typescript
type AssessmentStatus = "Booked" | "Link Sent" | "Awaiting Booking" | "Completed";
type AssessmentType = "Lead" | "Student";

interface Assessment {
  id, name: string;
  type: AssessmentType;
  yearGroup: string;
  subjects: string[];
  assessor: string | null;
  date, time, room: string | null;
  status: AssessmentStatus;
  outcome: string | null;
}
// 10 records
```

### 7.12 Feedback / Announcements / Complaints / Surveys

```typescript
type FeedbackStatus = "Draft" | "Pending Approval" | "Approved" | "Sent" | "Rejected";
interface FeedbackItem { id, studentName, subject, teacher, department, sessionDate, status, score, aiSummary, selectors, teacherNotes }
// 12 records

interface Announcement { id, title, type ("Pre-session"|"Post-session"), audience, createdBy, sendDate, status, message }
// 8 records

type ComplaintSeverity = "High" | "Medium" | "Low";
type ComplaintStatus = "New" | "Investigating" | "Resolved" | "Escalated" | "Closed";
interface ComplaintTicket { id, student, guardianName, category, raisedBy, assignedTo, status, severity, description, createdDate, linkedTickets, signOffs: [SignOff, SignOff], escalationLog }
// 6 records (two-sign-off workflow)

interface SurveyResponse { id, student, guardian, surveyType, sentDate, score, category ("Promoter"|"Passive"|"Detractor"), comment }
// 10 sent responses, 5 pending
```

### 7.13 People / Segments / Broadcasts / Forms

```typescript
interface PersonRecord { id, name, type ("Student"|"Guardian"|"Lead"|"Staff"), contact, status, departmentOrStage, createdOn }
// 20 records

interface Segment { id, name, scope ("Org-Wide"|"Personal"), recordType, filterSummary, members, lastRefreshed, createdBy }
// 14 records

interface BroadcastList { id, name, members, autoRule, autoRuleName?, lastUpdated, membersList: BroadcastMember[] }
// 8 lists

interface Form { id, name, type ("Lead Enquiry"|"Profile Update"|"Custom"), status, submissions, lastSubmission, createdBy, pinned }
// 7 forms, 12 submissions
```

### 7.14 Automation Templates / Rules / Dispatch / Logs

```typescript
interface AutomationTemplate { id, name, type, status, owner ("Org-Wide"|"Personal"), body, mergeFields, version, usedInRules, locked }
// 12 templates

interface AutomationRule { id, name, triggerType, module, status ("Enabled"|"Disabled"|"Locked"), lastFired, fireCount, locked }
// 18 rules

interface DispatchQueueItem { id, templateName, contactName, generatedAt, sourceRule, claimedBy, claimedUntil, renderedBody, status ("Unclaimed"|"Claimed"|"Sent") }
// 12 items

interface ExecutionLog { id, rule, triggerType, firedAt, recipients, live, queued, status ("Success"|"Failed"|"Skipped"), duration, payload, conditionResults, actionResults, recipientRouting }
// 15 logs

interface InternalMessage { id, sender, initials, avatarColor, timestamp, body, mentions, recordTags, reactions }
// 6 messages
```

### 7.15 Inventory

```typescript
type InventoryItemHealth = "healthy" | "approaching" | "below";
type LedgerChangeType = "auto_deduct" | "manual_add" | "reorder_received" | "manual_deduct" | "waste" | "stock_take_correction" | "auto_deduct_failed";

interface InventoryItem { id, name, category, unit, currentStock, minStock, maxStock, reorderQty, autoDeduct, departmentScope, enrolTrigger, supplier, amazonLink, notes, health, autoDeductRules, recentLedger }
// 38 items across 9 categories

interface InventorySupplier { id, name, phone, email, itemCount, notes }
// 14 suppliers

interface ReorderAlert { id, itemName, category, currentStock, minStock, reorderQty, supplierName, supplierPhone, supplierEmail, amazonLink, status ("open"|"ordered"|"ignored"), openedAt }
// 7 alerts (inv-003, inv-013, inv-016, inv-018, inv-025, inv-038 are "below" health)

interface StockLedgerEntry { id, itemName, category, changeType, quantityChange, stockBefore?, stockAfter?, actor, reference?, timestamp }
// 28 entries
```

### 7.16 Dashboard Role-Scoped Types

```typescript
interface KpiCard { id, label, value, trend, trendDirection ("up"|"down"|"neutral"), trendSentiment ("positive"|"negative"|"warning"|"neutral"), subValue?, icon }

interface ChurnRiskStudent { id, studentId, name, yearGroup, department, churnScore, churnLevel ("High"|"Medium"|"Low"), topSignal, daysSinceContact }
// 8 records

interface RevenueDataPoint { month, invoiced, collected }
// 6 months Nov–Apr

interface OccupancyCell { day, time, occupancy }
// Mon–Fri × 8 time slots

interface ActivityEvent { id, type, description, timeAgo }
// 12 events

// Role-scoped supplementary data:
teacherTodaySessions: DashboardSessionRow[]        // 3 sessions
taTodaySessions: DashboardSessionRow[]             // 3 sessions
teacherPendingActions: TeacherPendingAction[]      // 3 items
teacherTopTasks / taTopTasks: DashboardTaskRow[]   // 5 / 3 items
hodTeacherWorkload: TeacherWorkloadRow[]           // 4 teachers
hodAcademicAlerts / academicAlerts: AcademicAlertRow[]  // 2 / 4 alerts
hodUpcomingSessions: UpcomingSessionRow[]          // 5 sessions
hodPendingApprovals: PendingApprovalRow[]          // 3 items
invoiceStatusBreakdown: InvoiceStatusSlice[]       // 4 slices
staffCpdProgress: StaffCpdRow[]                    // 6 staff
```

### 7.17 Journey Store Types (`lib/journey-store.tsx`)

```typescript
interface JourneyAssessment {
  status: "idle" | "booked" | "done" | "skipped"
  subject, yearGroup, teacher, date, time, room, notes?: string
  recommendation, observedLevel, targetGrade, outcomeNotes?: string
}

interface JourneyTrial {
  status: "idle" | "booked" | "done" | "skipped"
  subject, yearGroup, teacher, date, time, room: string
  fee, vat, total: number
  outcome?: string
  notes?: string
  paid: boolean
}

interface JourneyStudent { name, id, yearGroup, department?: string }
interface JourneyEnrolment { subject, teacher, frequency, startDate?: string, package?: string }
interface JourneyInvoice { id, amount, status }
```

### 7.18 Assessment Store Types (`lib/assessment-store.tsx`)

```typescript
interface AssessmentRecord {
  id: string;
  studentName, subject, yearGroup, department: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  endTime: string;
  room: string;
  teachers: string[];
  notes?: string;
  status: "Booked" | "Done";
  leadId?: string;
}
// Provider: AssessmentProvider — in-memory, not persisted to mock-data
// Utilities: isoToDayKey(), isoToDateLabel()
```

---

## 8. RBAC Matrix

**8 roles:** Super Admin, Admin Head, Admin, Academic Head, HOD, Teacher, TA, HR/Finance

**Hook:** `usePermission()` from `lib/use-permission.ts` → `{ can, sees, role }`

**Rule: Hide, don't grey.** Use `{can('action') && <Button>}`. Never `disabled={!can('action')}`.

### Navigation Access (`NAV_ACCESS` map)

| Nav ID | Required Action | Blocked Roles |
|---|---|---|
| dashboard | (none — always visible) | — |
| students | `students.view` | HR/Finance |
| guardians | `guardians.view` | Academic Head, HOD, Teacher, TA, HR/Finance |
| leads | `leads.view` | Academic Head, HOD, Teacher, TA, HR/Finance |
| enrolment | `enrolment.view` | Academic Head, HOD, Teacher, TA, HR/Finance |
| timetable | `timetable.view` | HR/Finance |
| attendance | `attendance.view` | HR/Finance |
| assessments | `assessments.view` | Teacher, TA, HR/Finance |
| progress | `progress.view` | HR/Finance |
| finance | `finance.view` | — (all see it) |
| staff | `staff.view` | — (all see it) |
| tasks | `tasks.view` | Teacher, TA |
| analytics | `analytics.view` | Admin, Teacher, TA |
| reports | `reports.view` | Teacher, TA |
| settings | `settings.view` | Super Admin only |
| feedback | `feedback.view` | HR/Finance |
| people | `people.view` | HOD, Teacher, TA |
| automations | `automations.view` | Academic Head, HOD, Teacher, TA, HR/Finance |
| inventory | `inventory.view` | Teacher, TA |

### Key Permission Highlights

| Action | Permitted Roles |
|---|---|
| `students.delete` | Super Admin only |
| `students.viewFinancial` | Super Admin, Admin Head, Admin, HR/Finance |
| `leads.delete` | Super Admin, Admin Head |
| `enrolment.transferSibling` | Super Admin, Admin Head |
| `finance.approveRefund` | Super Admin, Admin Head |
| `finance.finalApproveRefund` | Super Admin only |
| `finance.viewSalary` | Super Admin, HR/Finance |
| `attendance.unlockWindow` | Super Admin, Admin Head |
| `staff.assignRole` | Super Admin only |
| `settings.view` / `.edit` | Super Admin only |
| `catalogue.edit` | Super Admin, Admin Head |
| `topic.edit` / `grades.edit` | Super Admin, Academic Head, HOD |
| `import` | Super Admin only |
| `export.all` | Super Admin only |

Full permissions matrix is in `lib/role-config.ts` — `PERMISSIONS` object, 50+ action keys.

---

## 9. Shared Components

### 9.1 Layout Components

**`AppShell`** (`components/layout/app-shell.tsx`)
- Skips sidebar + topbar when `pathname === '/login'` or within `(invoice)` route group
- Structure: `<AppSidebar />` + flex column with sticky `<TopBar />` + scrollable `<main className="bg-[#F8FAFC] p-6">` with `page-enter` animation class keyed on `pathname`

**`AppSidebar`** (`components/layout/app-sidebar.tsx`)
- Permanent 56px icon-only rail, deep navy `#0F172A`
- Hover over nav item opens flyout panel (224px wide, `#1E293B`, slides in via `slideInLeft` animation)
- Nav items filtered via `usePermission().sees(navId)`
- Auto-collapses active flyout when navigating to `/leads` (leads page uses full-width slide-over)
- Bottom area: user avatar, settings link
- Item types: `LinkNavItemDef` (direct link) and `FlyoutNavItemDef` (grouped subitems)

**`TopBar`** (`components/layout/top-bar.tsx`)
- Sticky header: page title derived from `pathname`, global search trigger, role switcher dropdown, notification badge
- Role switcher: cycles through all 8 roles in real-time, triggering `setRole()` from `RoleProvider`
- Notification count from `notificationCount` mock (integer)

**`GlobalSearch`** (`components/layout/global-search.tsx`)
- Cmd+K overlay, searches across students, leads, tasks, staff by name

### 9.2 UI Primitives

| Component | Key Props | Notes |
|---|---|---|
| `Button` | `variant`, `size` | CVA variants: default, destructive, outline, secondary, ghost, link |
| `Dialog` | `open`, `onOpenChange` | Base UI headless. Used for all modals |
| `Input` | standard | Base UI |
| `Badge` | `variant` | CVA |
| `Avatar` | `src`, `alt`, `fallback` | |
| `Sheet` | `side` | Slide-over. Used for lead detail panel |
| `Tooltip` | `content`, `delayDuration` | Delay 300ms globally |
| `Separator` | | Horizontal/vertical divider |
| `Skeleton` | | Loading placeholder |
| `EmptyState` | `icon`, `title`, `description`, `action?` | Zero-state for filtered lists |
| `AccessDenied` | | Full-page RBAC gate for routes |
| `RoleBanner` | | Dev-mode role indicator |
| `MultiSelectFilter` | `options`, `value`, `onChange`, `label` | Reusable filter dropdown |
| `SortableHeader` | `column`, `sort`, `onSort` | Table column with sort toggle |
| `PaginationBar` | `page`, `pageSize`, `total`, `onPageChange` | Table pagination |
| `DateRangePicker` | `value`, `onChange` | With preset options (DATE_PRESETS) |
| `ExportDialog` | `open`, `onOpenChange`, `onExport` | Format selection: Standard CSV / Google Contacts CSV |
| `SkeletonKpi` / `SkeletonTable` / `SkeletonCard` | | Dashboard skeleton states |

### 9.3 Journey Dialog Components

All in `components/journey/`. Called from `leads/page.tsx` as the lead progresses through stages.

| Component | Stage Transition |
|---|---|
| `BookAssessmentDialog` | New → Assessment Booked |
| `LogAssessmentOutcomeDialog` | Assessment Booked → Assessment Done |
| `SkipAssessmentDialog` | New → Assessment Done (bypass) |
| `BookTrialDialog` | Assessment Done → Trial Booked |
| `LogTrialOutcomeDialog` | Trial Booked → Trial Done |
| `TrialSkipPromptDialog` | Assessment Done → Trial Done (bypass) |
| `NeedsMoreTimeDialog` | Trial Done → reschedule |
| `ScheduleOfferDialog` | Trial Done → Schedule Offered |
| `ScheduleConfirmDialog` | Schedule Offered → Schedule Confirmed |
| `ConvertToStudentDialog` | Schedule Confirmed → Student record created |
| `CreateEnrolmentDialog` | Post-conversion enrolment creation |
| `InvoiceBuilderDialog` | Creates invoice for new student |
| `RecordPaymentDialog` | Invoice Sent → Paid (= Won) |
| `SkipWarningDialog` | Warning when skipping required steps |
| `WhatsAppBlock` | Message preview + send button inside slide-over |

**Shared primitives:** `DialogParts` exports `FIELD` (labelled field container), `FieldLabel`, `FormActions` (footer buttons).

**Subjects:** `components/journey/subject-select.tsx` + `components/journey/subjects.ts` — `subjectsForYearGroup(yearGroup)` returns available subjects.

**Times:** `components/journey/time-select.tsx` — pre-defined time slot selector.

### 9.4 Other Dialogs

| Component | Route Used From |
|---|---|
| `AddStudentDialog` | `/students` |
| `NewEnrolmentDialog` | `/students/[id]`, `/enrolment` |
| `TrialActionDialogs` | `/enrolment` |
| `AddStaffDialog` | `/staff` |
| `LeaveHandoverDialog` | `/staff` |
| `RequestLeaveDialog` | `/staff` |
| `NewSessionDialog` | `/timetable` |
| `NewTaskDialog` | `/tasks` |
| `GenerateReportDialog` | `/reports` |
| `InvoiceBuilder` | `/finance/invoice/new` (standalone component) |

---

## 10. Lead → Student Workflow

The lead pipeline is an 11-stage state machine. State for the demo lead (Bilal Mahmood, L-0041 / `BILAL_LEAD_ID`) is held in `JourneyProvider` (client context, not persisted).

```
New
  → Book Assessment dialog   → Assessment Booked
  → Skip Assessment dialog   → Assessment Done (skip)
  
Assessment Booked
  → Log Assessment Outcome   → Assessment Done

Assessment Done
  → Book Trial dialog        → Trial Booked
  → Skip Trial prompt        → Trial Done (skip)
  
Trial Booked
  → Log Trial Outcome        → Trial Done

Trial Done
  → Schedule Offer dialog    → Schedule Offered
  → Needs More Time dialog   → (re-contact)
  
Schedule Offered
  → Schedule Confirm dialog  → Schedule Confirmed
  
Schedule Confirmed
  → Convert to Student       → Student record created (BILAL_STUDENT_ID)
  → Create Enrolment         → Enrolment record created
  
Enrolment Created
  → Invoice Builder dialog   → Invoice Sent
  
Invoice Sent
  → Record Payment           → Paid → Lead stage = "Paid" (= Won)
```

**DNC interstitial:** If `lead.dnc === true`, attempting to send a WhatsApp message shows a DNC warning block. The `DNC Interstitial Routing` automation rule (RULE-009, Locked) also intercepts.

**WhatsApp block:** `WhatsAppBlock` component shows a rendered message preview and a "Send via WhatsApp" button with a 1-click copy/open workflow.

**Journey store exports:**
- `useJourney()` — returns `{ assessment, trial, student, enrolment, invoice, actions }`
- `BILAL_LEAD_ID` = `"L-0041"`
- `BILAL_STUDENT_ID` = `"STU-BILAL-001"` (created at Convert step)
- `formatDate(iso)` — formats YYYY-MM-DD to human-readable

---

## 11. Key Patterns & Conventions

### 11.1 Language

UK English throughout:
- organisation, enrolment, colour, behaviour, centre, programme
- Never: organization, enrollment, color, behavior, center, program

### 11.2 RBAC

- Always: `{can('action.name') && <Element />}` — hide completely
- Never: `disabled={!can('action.name')}` — don't grey out
- Gate whole pages with `<AccessDenied />` when `!sees('navId')`
- Add new actions to `PERMISSIONS` in `lib/role-config.ts` first

### 11.3 Buttons

Primary CTA: `bg-amber-500 hover:bg-amber-600 text-white` (or `.btn-primary` utility class)

```tsx
<button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md text-sm font-medium active:scale-95 transition-all">
  Save
</button>
```

### 11.4 Toasts

```typescript
import { toast } from 'sonner';
toast.success('Student added successfully');
toast.error('Failed to save changes');
```
`Toaster` is mounted once in `app/layout.tsx` with `position="bottom-right" richColors`. Never add another toast library.

### 11.5 Monetary Values

```typescript
const fmt = (amount: number) =>
  new Intl.NumberFormat('en-AE', { minimumFractionDigits: 2 }).format(amount);
// → "3,360.00"
// Always prefix with "AED " manually: `AED ${fmt(amount)}`
```

### 11.6 Multi-Step Modals

Step indicator pattern from `add-student-dialog.tsx`:
- Completed steps: amber tick mark
- Current step: amber border
- Future steps: grey

```tsx
<div className={cn(
  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2",
  step < currentStep && "bg-amber-500 border-amber-500 text-white",   // done
  step === currentStep && "border-amber-500 text-amber-500",           // current
  step > currentStep && "border-slate-200 text-slate-400",             // future
)}>
```

### 11.7 `cn()` Utility

```typescript
import { cn } from '@/lib/utils';
// cn() = clsx + tailwind-merge
<div className={cn("base-classes", condition && "conditional", variable && otherClass)} />
```

### 11.8 `?tab=` Deep Linking

Pages with tabs use `useSearchParams()` to read the initial tab. Links from dashboard alerts, task chips, and KPI cards carry `?tab=alerts`, `?tab=finance` etc. to land the user on the right tab directly.

```tsx
const tab = searchParams.get('tab') ?? 'overview';
```

### 11.9 Page Transitions

Every page renders with the `page-enter` CSS class applied to `<main>`. The class triggers `fadeSlideIn` (translateY + opacity). The key is the `pathname`:

```tsx
<main key={pathname} className="page-enter ...">
  {children}
</main>
```

### 11.10 Sidebar Flyout Auto-Close

The sidebar auto-collapses its active flyout when the user navigates to `/leads` because the lead detail slide-over uses the full right portion of the screen.

### 11.11 Active Route Detection

Use `usePathname()` from `next/navigation`:
```typescript
const pathname = usePathname();
const isActive = pathname === '/students' || pathname.startsWith('/students/');
```

### 11.12 Mock Data Extension

When adding new mock data, extend `lib/mock-data.ts`. Do not create new mock source files. Export new types and arrays from this single file.

### 11.13 Component Aliases

From `components.json`:
```
@/components    → components/
@/components/ui → components/ui/
@/lib           → lib/
@/lib/utils     → lib/utils.ts
@/hooks         → hooks/
```

---

## 12. Test Coverage

**Framework:** Playwright (`@playwright/test ^1.59.1`), e2e only. No unit or integration tests.

**Test files:**
- `tests/e2e/smoke.spec.ts` — 40 tests
- `tests/e2e/deep.spec.ts` — deeper interaction tests

**Smoke test suite (`smoke.spec.ts`):**

| Test | Description |
|---|---|
| **Test 1: Route smoke** | Every route in `ROUTES` array renders without error boundary or React hydration errors. Takes full-page screenshots. |
| **Test 2: Tab navigation** | For each route in `TABS` map, clicks every tab and verifies no crash. |
| **Test 3: Role switcher** | For each of 8 roles, navigates to dashboard, switches role, verifies no crash. Takes role screenshot. |
| **Test 4: Invoice builder** | Navigates to `/finance/invoice/new`, verifies preview panel renders, types student name, verifies dropdown. |
| **Test 5: Navigation links** | Visits 9 key sidebar links directly, verifies no 404. |

**Routes covered by smoke tests:**
`/dashboard`, `/students`, `/guardians`, `/leads`, `/enrolment`, `/finance`, `/timetable`, `/attendance`, `/assessments`, `/progress`, `/tasks`, `/staff`, `/analytics`, `/reports`, `/settings`, `/feedback`, `/people`, `/automations`, `/inventory`, `/finance/invoice/new`

**Tabs covered by smoke tests:**

| Route | Tabs |
|---|---|
| `/finance` | Invoices, Payments, Credits, Reports |
| `/progress` | Trackers, Reports, Alerts, Assignments |
| `/analytics` | Revenue, Occupancy, Churn, Staff |
| `/feedback` | Feedback Queue, Announcements, Complaints, Surveys, Class Discussion |
| `/people` | Directory, Duplicates, Segments, Broadcast Lists, Forms, Exports |
| `/automations` | Templates, Rules, Trigger Library, Dispatch Queue, Internal Messages, Marketing, Execution Log |
| `/inventory` | Catalogue, Reorder Alerts, Stock Ledger, Suppliers |
| `/attendance` | Today, Overview |
| `/staff` | Directory, HR Dashboard |
| `/assessments` | Upcoming, Outcomes, Slots |

**As of 21 April 2026:** 40/40 Playwright smoke tests passing.

**Screenshots:** Saved to `tests/screenshots/`. Named by route path + role.

---

## 13. Known Gaps (Acceptable for Demo)

These are intentional scope decisions for the prototype, noted in `project_enrolla.md` memory:

| Area | Gap |
|---|---|
| Tasks Kanban | Drag-and-drop visible but not persisted (undo bar works, position resets on reload) |
| Assessments | Row actions (Outcomes tab) are static — clicking does nothing |
| People / Duplicates | Merge wizard step 1 is functional; steps 2–4 are static placeholders |
| Leads Kanban | Drag-and-drop card movement visible but not persisted to `leadsData` array |
| Student Profile | Courses tab, Files tab, Communication Log tab are static/empty |
| Settings sections | Most settings fields are display-only; form save handlers fire toast only |
| Automations / Trigger Library | Tab renders static content |
| Finance route group | Invoice builder saves to component state only, not to `invoices` array |
| Progress / Reports | Report generation fires toast but does not add to report list |
| No real auth | Role is set in context, `currentUser` is hardcoded in mock-data |
| No backend | Zero API calls. All mutations (create, edit, delete) update local state only and reset on page refresh |

---

## 14. Recommended Next Steps

### 14.1 Backend Build (Immediate Priority)

The prototype is signed off. Backend build is the next phase:

- **Database:** Supabase (PostgreSQL)
- **API layer:** Next.js Route Handlers (`app/api/`)
- **Auth:** Supabase Auth with role stored in user metadata
- **Reference:** `Enrolla_Handoff_01_Tech_Stack.md` contains the full tech stack decision

**Critical first decisions:**
1. Data model migrations — every TypeScript interface in `mock-data.ts` maps to a table
2. Multi-tenancy strategy — tenant isolation at row level (RLS) or schema level
3. File storage — Supabase Storage for student documents, profile photos
4. Real-time — Supabase Realtime for internal messages and dispatch queue
5. WhatsApp integration — decide on provider (360dialog / Twilio) for automation dispatch

### 14.2 High-Priority Frontend Completions (Before Backend)

These gaps should be wired before backend integration:

1. **Tasks kanban persistence** — move card arrays to a `useState` at page level so drag persists within session
2. **Assessments row actions** — wire "Enter Outcome" button to a dialog
3. **Duplicates merge wizard** — build steps 2–4 (field comparison → merge → confirm)
4. **Student profile tabs** — Courses and Files tabs need minimal static content

### 14.3 Auth & Role Context

Replace the mock role switcher with Supabase session:

```typescript
// lib/role-context.tsx — replace useState with Supabase session
const { data: { user } } = await supabase.auth.getUser();
const role = user?.user_metadata?.role as Role;
```

Remove `RoleBanner` component from production build.

### 14.4 Data Mutations

Every `toast.success('...')` in the prototype represents a mutation that needs a real API call:
- Student create → `POST /api/students`
- Lead stage advance → `PATCH /api/leads/:id`
- Invoice create → `POST /api/invoices`
- Attendance mark → `POST /api/attendance`
- etc.

Pattern to follow:
```typescript
async function handleSave() {
  const res = await fetch('/api/students', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) { toast.error('Failed to save'); return; }
  toast.success('Student added');
  router.refresh(); // App Router revalidation
}
```

### 14.5 Route Groups / Layouts to Preserve

The `(invoice)` route group must remain separate — the invoice builder requires a full-screen layout without sidebar interference. Do not merge it into the root layout.

### 14.6 Environment Variables Needed

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-side only
NEXT_PUBLIC_APP_URL=
```

### 14.7 Performance Considerations

- `lib/mock-data.ts` will be split into separate API responses. The 2,952-line file is a prototype convenience — do not ship it to production.
- Implement `loading.tsx` skeleton states (patterns already exist in `components/ui/skeleton-loader.tsx`)
- The dashboard's 200ms skeleton delay simulates an API call — replace with actual `Suspense` boundaries

### 14.8 Playwright Tests

Tests reference `http://localhost:3000`. Update `playwright.config.ts` for staging/CI:
```typescript
baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
```

Add the `/students/[id]`, `/guardians/[id]` dynamic routes to the smoke suite with fixed IDs.

---

*End of Enrolla Developer Handover Summary.*
