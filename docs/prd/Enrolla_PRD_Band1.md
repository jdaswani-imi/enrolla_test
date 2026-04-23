# Enrolla — Band 1 PRD
## Core Build — Minimum Working Application

**Document purpose.** This is the developer build guide for Band 1 of Enrolla. Band 1 is the minimum working application: the smallest set of capabilities that allow a tuition centre to run day-to-day operations on the platform end-to-end. When Band 1 is complete, a centre can be provisioned, staff and students can be created, courses can be priced, students can be enrolled and invoiced, sessions can be scheduled, attendance can be marked, and session units can be deducted correctly. Nothing in Band 1 is optional. Everything in Band 2 and Band 3 depends on Band 1 being solid.

**How to read this document.** Each section is self-contained and written in plain language. You do not need to read the 31 reference module specifications to build Band 1 — everything required is in this file. The reference modules exist for edge cases and Band 2/3 features. If you want deeper background on a topic, the module code is listed at the top of each section (e.g. *References: M11*).

**UK English, UAE context.** All text, labels, dates, and currency formats use UK English and UAE conventions. Dates are `DD/MM/YYYY`. Currency is AED with 2 decimal places. VAT is 5% and calculated post-discount. The default timezone is `Asia/Dubai` (UTC+4, no daylight saving). The default working week runs Monday to Saturday; Sunday is a non-working day at IMI but is not hard-blocked at the platform level.

**Versioning.** This is Band 1 v1.0. When a rule changes, update this document — do not create addenda or separate amendment files.

---

# Foundations Preamble

*Read this before any numbered item. It defines the terms, entities, and rules that every Band 1 item assumes you understand.*

## F.1 What Enrolla is

Enrolla is a **multi-tenant education SaaS platform**. A single running instance of the application serves many independent tuition centres ("tenants"), each with their own data, settings, staff, and students. Tenants never see each other's data. The reference tenant is Improve ME Institute (IMI), a Dubai tuition centre with roughly 1,800 students and 40 staff across three academic departments (Primary, Lower Secondary, Senior).

Enrolla replaces three existing tools at IMI: Classcard (student management), ClickUp (task and document management), and Zoho Forms (forms and intake). It **keeps** Zoho Books (finance) and Zoho People (HR) as downstream integrations — but all integrations are Phase 2 (Band 3). In Band 1 the platform is fully standalone: data lives inside Enrolla, exports are manual, and all outbound messaging uses copy-paste fallback.

## F.2 Tenancy model

There are three hierarchical levels of data scope:

1. **Platform** — the entire running application. Managed by Enrolla internal staff (the Developer role and Super Admins on internal tenants). Shared code and infrastructure.
2. **Tenant** — one customer organisation. In Band 1 a tenant is identified by a unique subdomain (e.g. `imi.enrolla.app`). All data created by users of that tenant is tagged with the `tenant_id` and is never visible to any other tenant.
3. **Branch** — a physical location within a tenant. A tenant has at least one branch. Most operational data (students, sessions, invoices) is scoped to a branch. A tenant-wide user with the right role can see data across all their branches.

**Hard rule:** every database table that holds tenant-owned data must carry a `tenant_id` column, and every query issued by an authenticated user must filter by that `tenant_id` automatically at the application layer. There is no exception to this rule. Cross-tenant data leakage is the single most serious failure mode of the platform.

Within a tenant, data is further scoped by **department**. IMI has three: Primary (year groups FS1 to Y6), Lower Secondary (Y7 to Y9), and Senior (Y10 to Y13). Department is a denormalised field — it is stored directly on the Student, Course, and Invoice records rather than derived at read time — because it is used on almost every query and derivation on the fly would be too slow. When a student's year group changes such that their department should change, the `department` field on their record is updated by the same operation.

## F.3 The 12 roles (plain English)

Every user in the platform has exactly one **primary role** and any number of **secondary role labels**. Secondary labels add permissions; they never remove them. The 12 primary roles are:

1. **Super Admin** — the top role within a tenant. Can do anything in their tenant. Assigns all other roles. Cannot touch other tenants.
2. **Admin Head** — operational leadership for a branch. Approves discounts, refunds, fee waivers, and off-boarding. Broad read/write access.
3. **Admin** — the primary day-to-day role. Creates students, schedules sessions, issues invoices, marks attendance, manages leads. Most actions need no approval; discounts and refunds do.
4. **Academic Head** — strategic oversight of academics across all departments. Read access to everything academic; no financial or HR access.
5. **HOD (Head of Department)** — academic lead for one department. Approves reports and makeups; dismisses concerns.
6. **Head of Subject** — academic lead for one or more subjects, sitting between HOD and Teacher.
7. **Teacher** — delivers sessions, marks attendance for their own classes, logs feedback and progress. Views leads, enrolments, assessments, and tasks. Cannot advance the lead pipeline past Schedule Confirmed or convert a lead to a student.
8. **TA (Teaching Assistant)** — supports a teacher; similar scope but reduced permissions. Also views leads, enrolments, inventory (with stock take), and tasks. Cannot mark attendance. Cannot advance the lead pipeline past Schedule Confirmed.
9. **HR/Finance** — custom role with access to finance, guardians (full), staff HR, and salary data. Full leads pipeline access including invoicing and payment. View-only on timetable and attendance. Cannot see student academic progress or generate academic reports. Initiates staff off-boarding.
10. **Developer** — Enrolla internal technical staff. Full data access, excluded from every routing and notification chain. Used for building and debugging.
11. **Student** — own record only. In Band 1 there is no student-facing login; this role exists in the data model but is inactive in the UI. (Student portal is Phase 2.)
12. **Parent** — linked to one or more student records. Also inactive in Band 1. (Parent portal is Phase 2.)

In Band 1 the developer must build the role data model and the assignment UI for roles 1–9 (see Item 8). Roles 10–12 exist as data but are not exposed as logins in Band 1.

## F.4 Core entities — the data model in plain English

These are the entities Band 1 must create, in order of dependency. Every entity below has `id`, `tenant_id`, `created_at`, `updated_at`, and `created_by` as standard columns unless stated otherwise. All `id` values are UUIDs.

1. **Tenant** — one row per customer organisation. Holds subdomain, display name, default currency (AED), default timezone (`Asia/Dubai`), VAT rate (5%), status (Active/Suspended), and the `dpa_signed_at` timestamp (a Data Processing Agreement must exist before the tenant can be activated — this is a legal prerequisite and is enforced in code).
2. **Branch** — one or more per tenant. Holds display name, address, operating hours.
3. **Department** — one or more per tenant. Holds name (e.g. "Primary"), sort order, and the year group range it covers.
4. **Room** — one or more per branch. Holds name, capacity (integer), and an active flag.
5. **User** — one row per human with login access. Holds email (unique per tenant), password hash, primary role, active flag, MFA settings, and last-login timestamp. Users are scoped to a tenant — the same email can exist on two different tenants as two different users.
6. **Staff** — one row per staff member. Linked 1:1 to a User row when the staff member has login access. Holds employee fields (full name, phone, job title, start date, department, branch, end date if off-boarded).
7. **Student** — one row per student. Holds full name, date of birth, year group, department (denormalised), branch, student ID (tenant-unique human-readable identifier), DNC flag, enrolment status, and the date of their current status transition.
8. **Guardian** — one row per parent/guardian contact. Linked to one or more students via a `student_guardian` join table that records the relationship type (mother/father/other), whether the guardian is the primary contact, and whether the guardian is a financial payer. A student must have at least one guardian marked as primary.
9. **Subject** — one row per subject the centre teaches (e.g. "Primary Maths", "IGCSE Chemistry"). Holds name, department, active flag, and a link to the rate table.
10. **Course / Catalogue entry** — one row per subject × year-group × delivery-mode combination. This is where the per-session rate and session duration live. Item 3 covers this in full — it is the single most important reference table in the platform.
11. **Enrolment** — one row per student × course. Holds start date, end date, frequency per week, total sessions purchased, sessions remaining, status (Active/Paused/Withdrawn/Graduated), and a link to the invoice that funded it.
12. **Session** — one scheduled instance of a class. Holds subject, teacher, room, start datetime, end datetime, a recurrence reference if it repeats, and a status (Scheduled/Completed/Cancelled).
13. **Attendance record** — one row per student per session. Holds status (Present/Absent/Late/Excused), marked-by user, marked-at timestamp, and the session unit deducted (usually 1, sometimes fractional is blocked — see F.7).
14. **Invoice** — one row per billable event. Holds line items, subtotal, discount, VAT, total, status (Draft/Issued/Partially Paid/Paid/Cancelled), due date, and the student and payer guardian links.
15. **Payment** — one row per money-in event. Holds amount, method (Cash/Card/Bank Transfer/Cheque), reference, date, and the invoice it applies to.
16. **Activity log entry** — one row per significant event on a student, guardian, session, invoice, enrolment, or staff record. Holds `entity_type`, `entity_id`, `event_type`, `event_description`, `actor_user_id`, `timestamp`, and `payload` (JSON). Distinct from the audit log: the activity log is human-readable and surfaces in profile activity feeds; the audit log is forensic and never displayed to users. Every item that says "writes to the activity log" writes a row here.

## F.5 Currency, VAT, and financial rules

- **Currency.** AED, 2 decimal places. Display format: `AED 1,234.56`.
- **VAT.** 5%, calculated on the post-discount subtotal. Formula: `vat = round((subtotal - discount) × 0.05, 2)`; `total = subtotal - discount + vat`. Credit is also applied post-VAT, which means credit reduces the total after tax — this avoids double taxation when a credit is later re-used.
- **Retention.** Financial records must be retained for a minimum of 5 years. This is UAE VAT law and is non-negotiable. Invoices and payments cannot be hard-deleted; they can only be cancelled with a logged reason.
- **Time display format.** All times are displayed in 24-hour format throughout the platform (e.g. 16:00, 09:30). Dates are displayed as `DD/MM/YYYY`. These formats are tenant-locale-locked in Band 1 and not user-configurable.
- **Date-only fields.** Date-only fields (DOB, invoice issue date, holiday range start/end, academic year start/end, enrolment start/end) are stored as naive dates in the tenant's local calendar — no timezone offset. Timestamp fields (`created_at`, `marked_at`, `start_at`, `end_at`) are stored in UTC and rendered in the tenant's timezone.
- **Session unit rule.** A session is always deducted in whole units. Half-sessions, quarter-sessions, and any other non-integer deductions are blocked at the scheduling layer with an error message. An Admin can override the block with a logged reason, but the override still writes whole units to the deduction ledger. There are no decimal sessions anywhere in the platform, ever.

## F.6 Audit trail

Every write operation by any user must write a row to an `audit_log` table containing: `tenant_id`, `user_id`, `entity_type`, `entity_id`, `action` (create/update/delete/status_change), `old_value` (JSON), `new_value` (JSON), `timestamp`, and `ip_address`. The audit log is append-only. It is never edited or deleted, not even by Super Admins. Developer role actions are also logged — they are not exempt.

## F.7 The "approval gateway" in Band 1

Several Band 1 operations require approval before they take effect (e.g. a discount above a threshold, a refund). In Band 1 the approval gateway is a simple in-app queue: the initiating user submits the action, it enters a `pending_approvals` table with the designated approver role, and the approver sees it in their queue on next login. No email, no WhatsApp, no auto-escalation — those are Band 3. The Developer role is excluded from all routing: approval requests are never sent to Developer users, and Developer users never appear as an approver in any fallback chain.

**Where approvers see the queue.** Every authenticated screen shows a bell icon in the top-right with a count badge of pending approvals routed to the current user. Clicking the bell opens a dedicated `/approvals` screen listing all open requests for this user with filters by request type, age, and initiator. Each row expands to show the full payload and Approve / Reject / Re-route buttons. Approvals are also surfaced on the Super Admin and Admin Head landing pages as a dashboard card.

## F.8 What Band 1 deliberately excludes

To keep the scope honest, these are explicitly **not** in Band 1. Do not build them, even if you find a reference to them in the 31 module files:

- Lead pipeline, DNC warning interstitial, referral tracking *(Band 2, Item 9)*
- Assessment and placement bookings *(Band 2, Item 10)*
- Makeups, absence rules beyond the basic statuses, the Concern Engine, the 48-hour tracker window *(Band 2)*
- Per-class feedback, AI summaries, complaints, surveys, NPS *(Band 2)*
- Progress tracker, predicted grades, AI reports, Academic Alert System *(Band 2)*
- Assignment library, Quick Score Entry *(Band 2)*
- Task management, kanban views, recurring tasks *(Band 2)*
- Management dashboard, KPIs, churn score, occupancy heatmap, reports inbox *(Band 2)*
- People forms, form builder, document expiry tracking, segment builder *(Band 2)*
- CPD logging, appraisal cycles, observation records, off-boarding workflow *(Band 2)*
- CSV import tooling, field-mapping interface, migration wizard *(Band 2 — IMI data will be loaded via direct database seed during Band 1 testing)*
- Automation engine, template library, marketing tab *(Band 3)*
- Full notification catalogue — in Band 1 only a handful of in-app notifications exist, listed explicitly in each item *(Band 3)*
- Inventory module *(Band 3, blocked)*
- Payment gateways (Telr, Network International, Stripe) *(Band 3)*
- WhatsApp BSP, Zoho Books sync, Zoho People sync, Instagram, Mailchimp *(Band 3)*
- Parent portal, student portal *(Band 3)*
- Platform admin panel, feature flags, subscription management, DPA versioning *(Band 3)*

If a Band 1 item appears to need a Band 2/3 feature to function, the correct answer is almost always: **use a minimal manual placeholder in Band 1 and defer the full feature.** Each item below specifies exactly what that placeholder looks like.

## F.9 Environment and build assumptions

- **Stack.** The technology choice is the developer's, but the platform must be a web application accessible on modern desktop and mobile browsers (Chrome, Safari, Edge, Firefox — last two major versions). No native apps in Band 1.
- **Database.** A single relational database (PostgreSQL recommended). Row-level tenant isolation via `tenant_id` filtering at the application layer is acceptable; physical per-tenant database isolation is not required in Band 1. **JSONB columns** are used where the schema is intentionally semi-structured: `operating_hours.time_ranges`, `pending_approvals.request_payload`, `session_series.days_of_week`, `courses.conditional_predicate`, `merge_history.field_choices`, and audit log `old_value` / `new_value`.
- **Authentication.** Email + password with MFA (see Item 1). No SSO in Band 1.
- **Hosting region.** UAE or EU region preferred for data residency. The choice is documented in the DPA.
- **Backups.** Daily automated backups with 30-day retention are a Band 1 requirement. A backup restore must be tested at least once before IMI go-live.
- **Logging and monitoring.** Application error logging (e.g. Sentry) and basic uptime monitoring are Band 1 requirements. Structured request logs are retained for 30 days.
- **UI state baseline.** Every list screen has an empty state (icon + one-line explanation + primary action button). Every save action shows a loading indicator and disables the submit button until the response returns. Every failure surfaces either a toast (transient) or an inline field error (validation), never a silent fail. Every destructive action (delete, archive, cancel, refund initiation, role change) requires a confirm dialog naming the affected entity.
- **Seed data.** Once Band 1 is complete, IMI's existing data (students, guardians, staff, active enrolments) will be loaded via a one-off direct database seed script. The fully-featured CSV import tool is Band 2.

---

## F.10 UI & UX Foundation

*Read this once. Every item below references this section for visual specifics. Do not re-invent any pattern defined here on a per-item basis — use the tokens, components, and screen archetypes specified below for everything.*

### F.10.1 Design philosophy

Enrolla looks and feels like a modern school management system, not like a generic SaaS dashboard. The visual language sits between **Linear's clarity**, **Notion's breathing room**, and **Bromcom's operational density**, with the polish of a consumer-grade product. Every screen prioritises three things in this order: **clarity** (the user knows what they are looking at and what they can do), **speed** (one click never becomes three), and **trust** (financial and student data is handled with the visible care that money and children require). The aesthetic is calm, confident, and uncluttered. White space is a feature, not a waste. Royal blue is used with restraint — the platform is mostly white and grey with blue as the accent, never the main canvas.

### F.10.2 Colour palette

The platform uses a tightly constrained palette built around royal blue. CSS variables (or equivalent design tokens) are defined once and used everywhere — no per-screen colour overrides.

| Token | Hex | Usage |
|---|---|---|
| `--color-primary` | `#1E3A8A` | Royal blue. Headers, primary buttons, active nav, brand. The single most important colour. |
| `--color-primary-hover` | `#1E40AF` | Hover state of primary buttons and links. |
| `--color-primary-soft` | `#EFF4FF` | Soft blue tint for selected rows, active filter chips, hover backgrounds. |
| `--color-interactive` | `#2563EB` | Links, secondary actionable text, focus rings. |
| `--color-canvas` | `#FFFFFF` | Main background. The platform is mostly white. |
| `--color-surface` | `#F8FAFC` | Subtle off-white for cards, panels, sidebars. |
| `--color-border` | `#E2E8F0` | Default borders, table dividers, input outlines. |
| `--color-border-strong` | `#CBD5E1` | Hover borders, focused input outlines. |
| `--color-text-primary` | `#0F172A` | Headings, body text. Near-black, never pure black. |
| `--color-text-secondary` | `#475569` | Subdued labels, helper text, table sub-rows. |
| `--color-text-tertiary` | `#94A3B8` | Placeholder text, disabled states. |
| `--color-success` | `#15803D` | Paid invoices, present attendance, active status badges. |
| `--color-warning` | `#B45309` | Late attendance, partially paid, soft warnings. |
| `--color-danger` | `#B91C1C` | Absent attendance, overdue invoices, destructive actions, hard blocks. |
| `--color-info` | `#0E7490` | Informational toasts, neutral system messages. |

**CSS naming convention.** The token names below use American spelling (`color`, not `colour`) because CSS itself uses American spelling — `color:` is the property name. This is the only place in the entire document where American spelling is used; it is a deliberate exception to honour the language of the platform layer.

**Hard rules:**
- Royal blue (`--color-primary`) is reserved for brand and primary affordances. Never use it for body text, never as a section background.
- Pure black (`#000000`) is forbidden. Use `--color-text-primary` instead.
- Status colours are for status only — never decoration.
- Every text-on-background pairing must hit WCAG AA contrast (4.5:1 for body, 3:1 for large text). The tokens above are pre-checked.

### F.10.3 Typography

A single typeface family for the entire platform: **Inter** (open-source, web-safe, ships with the app — do not load from a CDN). Fallback stack: `Inter, system-ui, -apple-system, "Segoe UI", sans-serif`.

| Token | Size / weight / line-height | Usage |
|---|---|---|
| `--text-display` | 32px / 700 / 1.2 | Page titles only (one per screen) |
| `--text-h1` | 24px / 600 / 1.3 | Section headers |
| `--text-h2` | 20px / 600 / 1.3 | Subsection headers |
| `--text-h3` | 16px / 600 / 1.4 | Card titles, modal titles |
| `--text-body` | 14px / 400 / 1.5 | Default body text |
| `--text-body-strong` | 14px / 600 / 1.5 | Emphasised body text |
| `--text-small` | 12px / 400 / 1.4 | Helper text, table footers, badges |
| `--text-mono` | 13px / 400 / 1.4 | IDs, codes, timestamps (Inter's tabular nums or JetBrains Mono) |

**Numbers in tables** (currency, counts, dates) use Inter's tabular-nums feature so columns align without monospacing the whole row.

### F.10.4 Spacing and layout

A strict **8-pixel grid** governs all spacing. Tokens: `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--space-8: 32px`, `--space-12: 48px`, `--space-16: 64px`. Padding inside cards is `--space-6`. Gaps between sections are `--space-8`. Page margins on desktop are `--space-12`.

**Page width:** the main content area is constrained to a maximum of `1440px`, centred. Screens wider than that show generous white margins. Below `1024px`, the layout collapses to a single-column mobile arrangement.

**Page structure** (desktop):

```
┌─────────────────────────────────────────────────────────┐
│  Top bar (64px tall, white, bottom border)              │
│  [Logo] [Branch picker] [Search]    [Bell] [Avatar]     │
├──────┬──────────────────────────────────────────────────┤
│      │                                                  │
│ Side │  Page content                                    │
│ nav  │  (max-width 1440px, centred, 48px page margins)  │
│ 240px│                                                  │
│      │                                                  │
└──────┴──────────────────────────────────────────────────┘
```

The side nav is a fixed 240px column, white background, royal-blue active item, with a thin right border. Nav items have icons (24px, line-style — Lucide or Phosphor icon set) on the left and labels on the right. Sections in the nav are grouped by domain: People, Academic, Schedule, Finance, Operations, Settings.

### F.10.5 Component library

These are the only components used across Band 1. Build them once, use them everywhere.

**Buttons.** Three variants. **Primary** = royal blue background, white text, used for the single most important action on a screen (Save, Confirm, Submit). **Secondary** = white background, primary-coloured border and text, used for non-destructive secondary actions. **Tertiary** (text-only) = no border, primary-coloured text, used for inline links and low-emphasis actions. **Destructive** = white background, red border and text, used for delete/archive/cancel/refund initiation. All buttons are 40px tall on desktop, 44px on mobile (touch target). Disabled buttons fade to 50% opacity, never grey out completely.

**Inputs.** All text inputs are 40px tall, white, with a 1px `--color-border` outline that becomes `--color-border-strong` on hover and `--color-interactive` (with a 2px focus ring) on focus. Labels sit above the input in `--text-body-strong`. Helper text sits below in `--text-small --color-text-secondary`. Errors sit below in `--text-small --color-danger` with a small icon. Required fields show a small red dot to the right of the label, never an asterisk.

**Tables.** White background, `--color-border` row dividers (1px, never thicker), `--color-text-primary` for cell content, `--color-text-secondary` for column headers. Headers are `--text-small`, uppercase, 600 weight. Rows are 56px tall on desktop. Hovering a row tints it to `--color-primary-soft`. Selected rows persist that tint. Sort indicators are small chevrons in the column header. Pagination footer is right-aligned with a "Showing X–Y of Z" label and prev/next buttons. Empty states (see F.10.7) replace the table body when no rows match.

**Forms.** Single-column layout by default. Two-column only when fields are tightly related (e.g. first name / last name on the same row). Section dividers between logical groups. Fixed bottom action bar with Cancel (left, secondary) and Save (right, primary) — never floating, always anchored to the bottom of the form panel.

**Modals.** Centred, white, 480px wide for confirmations, 720px wide for forms. Backdrop is `rgba(15, 23, 42, 0.5)`. Header has a title and a close X. Footer has the action buttons right-aligned. Esc closes; clicking the backdrop closes only non-destructive modals (destructive modals require explicit Cancel).

**Cards.** White, `--color-border` 1px outline, 12px corner radius, `--space-6` internal padding, optional header with title and right-aligned actions. Used for dashboard tiles, summary panels, and grouped information.

**Badges and chips.** 24px tall, 6px corner radius, `--text-small` 600 weight. Status badges use the status colour as background tint (10% opacity) with the full colour as text and border. Filter chips (used in list filters) are toggleable, with a checkmark when active.

**Toasts.** Top-right of the viewport, 360px wide, 4px corner radius, white background with a left border in the toast colour (success/warning/danger/info). Auto-dismiss after 5 seconds for success/info, manual dismiss only for warning/danger. Stack vertically when multiple appear.

**Calendar grid (Item 6).** Day/Week views use a 30-minute time-slot grid with rooms or teachers as columns. Each session is a coloured block with the subject, teacher surname, and student count. Colour comes from the department, not the subject — keeps the visual rhythm consistent. Drag-to-resize and drag-to-move are Band 2; in Band 1 the calendar is read-and-click-to-edit only.

### F.10.6 Screen archetypes

Every screen in Band 1 fits one of six archetypes. The dev builds the archetype once and parameterises it.

1. **List screen.** Top bar with title and "New X" primary button. Filter bar below the title (search input + filter chips). Table fills the remaining space. Pagination footer. Used for: students, guardians, staff, leads (Band 2), invoices, sessions, courses, subjects, rooms, branches.

2. **Detail screen.** Top bar with breadcrumb (Module → List → Record name) and quick actions (Edit, Archive, etc.). Tab strip below for record sub-views. Tab content fills the rest. Used for: student profile (5 tabs), guardian profile (5 tabs), staff profile (3 tabs), invoice detail.

3. **Form screen / drawer.** Either full-page (for the wizard and complex creation flows) or a right-side drawer (480px wide for simple records). Single-column form by default. Fixed bottom action bar.

4. **Wizard.** A progress strip across the top (Step X of Y), the current step content centred and constrained to 720px wide, Back/Next buttons in a fixed bottom bar. The Item 2 onboarding wizard is the canonical example.

5. **Calendar/grid.** Item 6 only. See F.10.5 calendar grid component.

6. **Approvals queue (`/approvals`).** A specialised list screen with a left-side filter rail and a right-side detail pane that opens when a row is selected — split-pane layout, no modal. Approve / Reject / Re-route buttons in the detail pane.

### F.10.7 Empty / loading / error states

**Empty states.** Every list screen has an empty state with: a small line icon (Lucide style, 64px, `--color-text-tertiary`), a one-line headline in `--text-h2`, a one-sentence explanation in `--text-body --color-text-secondary`, and a primary "New X" button. Example for an empty student list: *"No students yet — create your first student to begin enrolment."*

**Loading states.** Three patterns. **Skeleton loaders** for list and detail screens (grey placeholder rectangles matching the final content shape, animated subtle pulse). **Inline spinners** for buttons that have triggered an async action — the button text is replaced by a small spinner, the button stays disabled. **Full-page spinner** is forbidden — it tells the user nothing.

**Error states.** Three patterns. **Inline field errors** for form validation (red helper text below the field, field outline turns red, focus auto-jumps to first error). **Toast errors** for transient API failures (top-right, red left border, manual dismiss). **Full-page error screens** for catastrophic failures (404, 403, 500), with a calm headline ("Something went wrong"), a one-sentence explanation, and a button to return to the previous safe screen.

**Confirm dialogs** for destructive actions: title naming the action, body text naming the affected entity (e.g. "Archive student John Smith?"), Cancel (secondary, left) and Confirm (destructive, right) buttons. The destructive button text repeats the action verb ("Archive student") rather than saying "Confirm" — the user reads exactly what they are about to do.

### F.10.8 Mobile rules

The full platform is responsive, but two flows are explicitly **mobile-first** because they are used on phones in classrooms:

1. **Teacher attendance marking (Item 7).** A teacher opens a session on their phone at the end of class and marks every student in under 30 seconds. The screen shows one student per row with a large status picker (4 buttons, 56px tall, full row width, colour-coded). Bulk "Mark all present" button at the top. Save button is fixed to the bottom of the viewport with a halo so it never scrolls off. Notes are collapsed under a "+" tap per student.

2. **Teacher calendar (Item 6).** A teacher checks their week on their phone. The calendar collapses to a vertical day-by-day list, each day showing its sessions as cards in chronological order, tappable to open the session detail.

All other screens are **desktop-first** with mobile responsive fallback — the side nav becomes a hamburger menu, tables become card lists, multi-column forms become single-column. No feature is hidden on mobile, but speed and density are not the priority on phones for non-teacher roles.

### F.10.9 Accessibility baseline

WCAG 2.1 AA is the minimum target across the platform. Concrete requirements:

- **Keyboard navigation.** Every interactive element is reachable via Tab. Focus order matches visual order. Focus rings are visible (`--color-interactive`, 2px). Esc closes modals and dropdowns.
- **Screen readers.** Every input has a label (visible or `aria-label`). Every icon button has an `aria-label`. Every status badge has accessible text. Every table has `<th>` elements with `scope`.
- **Colour is never the only signal.** Status badges always include text or an icon, never just the colour. Errors always have a text description, never just a red border.
- **Contrast.** All text-on-background pairings hit 4.5:1 minimum; large text and UI elements hit 3:1. The palette in F.10.2 is pre-checked.
- **Motion.** Respect `prefers-reduced-motion`. No animations longer than 200ms. No flashing or strobing under any circumstances.
- **Forms.** Error messages reference fields by name, not position. Required fields are marked both visually (red dot) and via `aria-required`.

### F.10.10 What this section binds the developer to

Every item from Item 1 onwards is logically specified in the body of this document, but the visual realisation must use the tokens, components, archetypes, and rules in F.10. If a Band 1 item description appears to demand a custom UI element not covered here, that is a flag — stop and ask, do not invent. The point of F.10 is that the platform feels like one product, not eight.

---

*End of Foundations Preamble. Item 1 begins in the next section.*

---

# Item 1 — Multi-Tenant Foundation & Authentication

*References: PL-01, PL-02, PL-04. This item is the absolute first thing to build. Without it, nothing else runs.*

## 1.1 Purpose

Item 1 establishes the technical bedrock of the entire platform: the ability for multiple independent tenants to share a single running application without ever seeing each other's data, and the ability for a human user to log in, prove they are who they say they are, and have every subsequent request scoped to their tenant and their role. Every later item depends on this being airtight. A bug here is not a feature defect — it is a data breach.

## 1.2 What the developer must build

### 1.2.1 Tenant provisioning

A tenant is created by an internal Enrolla operator (Developer role). In Band 1 this is done via an admin script or a minimal internal screen — a full platform admin panel with subscription management is Band 3. Creating a tenant requires:

1. A unique **subdomain** (e.g. `imi`). Validation: lowercase letters, numbers, and hyphens only; 3–30 characters; must not already exist; reserved words blocked (`www`, `api`, `admin`, `app`, `mail`, `support`, `help`, `staging`, `dev`, `test`).
2. A **display name** (the centre's legal or trading name, e.g. "Improve ME Institute").
3. A **default currency** (AED) and **default timezone** (`Asia/Dubai`). These are pre-filled but editable.
4. A **VAT rate** (5%). Pre-filled, editable.
5. A **DPA signed flag** — an ISO datetime recording when the Data Processing Agreement was countersigned. The tenant cannot be activated (`status = Active`) until this field is populated. Attempting to activate without it returns an error.
6. A **first Super Admin** — full name, email, and a temporary password. The creation process emails this user a welcome message with a "set your password" link valid for 48 hours.

On successful creation:
- A row is written to the `tenants` table with `status = Provisioning`.
- The first Super Admin user row is written to `users` linked to `tenant_id`.
- A tenant-scoped audit log entry records the provisioning event.
- Status flips to `Active` only after the DPA flag is set AND the Super Admin has completed first login.

### 1.2.2 Subdomain routing

Every HTTP request arriving at the platform is inspected for its subdomain. The subdomain determines the active `tenant_id` for that request. If the subdomain does not match an active tenant, the request returns a generic "centre not found" landing page — never a detailed error that would leak tenant existence.

Hard rules:
- A user authenticated on `imi.enrolla.app` cannot make any request that reads or writes data belonging to another tenant. Attempting to pass a foreign `tenant_id` in a URL parameter, request body, or cookie must return `403 Forbidden` and write an audit log entry tagged `tenant_isolation_violation`.
- The `tenant_id` is never trusted from the client. It is always resolved server-side from the session.
- Shared assets (CSS, JS, images) may be served from a shared domain; tenant data endpoints never may.

### 1.2.3 Login screen

A single login screen served at `{subdomain}.enrolla.app/login` with:

- **Email** field (required, validated as an email format).
- **Password** field (required, masked, 12 characters minimum on new accounts — existing temporary passwords are exempt until first change).
- **Remember this device** checkbox (30 days; sets a long-lived refresh token tied to the device fingerprint).
- **Forgot password** link.
- **Sign in** button.

On submit:
1. Look up the user by `(tenant_id from subdomain, email)`. If no match, return a generic "invalid credentials" error — never reveal whether the email exists.
2. Verify the password hash (bcrypt or argon2, cost factor ≥ 12).
3. If valid, check `active` flag. If inactive, return "this account is no longer active — contact your administrator".
4. If valid and active, check whether MFA is required for this role (see 1.2.5). If yes, issue a short-lived MFA challenge token and redirect to the MFA screen. If no, issue a session token and redirect to the role-appropriate landing page.

### 1.2.4 Failed login, lockout, and password reset

- **Failed login counter.** 5 failed attempts on a single account within 15 minutes locks the account for 30 minutes. The 6th attempt returns "account temporarily locked — try again in 30 minutes". A Super Admin can manually unlock via the user management screen (Item 8).
- **Password reset.** The forgot-password link sends a single-use token valid for 1 hour to the user's email. The reset screen requires the new password twice and enforces the minimum length and complexity rules (at least one letter, one number, one symbol; no re-use of the previous 3 passwords).
- **Forced password change.** On first login after provisioning, and after any admin-triggered password reset, the user is forced through a password change screen before they can access anything else.

### 1.2.5 Multi-factor authentication (MFA)

In Band 1, MFA is **mandatory** for the Super Admin, Admin Head, HR/Finance, and Developer roles. It is **optional but available** for all other roles — a user can enable it from their profile. MFA uses TOTP (time-based one-time passwords) compatible with Google Authenticator, Authy, and 1Password. SMS-based MFA is not supported in Band 1.

Enrolment flow: on first login a user in a mandatory-MFA role is presented with a QR code and a 6-digit verification challenge. They scan the code with their authenticator app, enter the current 6-digit code, and the platform stores the shared secret encrypted at rest. Backup codes (10 single-use codes) are generated and shown once. If a user loses their device, a Super Admin can reset their MFA from the user management screen, forcing re-enrolment on next login.

### 1.2.6 Session management

- **Session token.** JWT or opaque server-side session token — developer's choice. If JWT, the signing key is per-tenant-aware and rotated every 30 days.
- **Session lifetime.** 12 hours of inactivity on a standard session; 30 days on a "remember this device" session. Any action resets the inactivity timer.
- **Concurrent sessions.** A user may hold up to 5 concurrent active sessions across devices. The 6th session logs out the oldest.
- **Logout.** A logout button is visible in the top-right of every authenticated screen. Logout revokes the current session server-side — not just client-side cookie deletion.
- **Forced logout.** When a Super Admin deactivates a user or changes their role, every active session for that user is revoked within 60 seconds.

### 1.2.7 Role assignment at login

After successful authentication, the session token carries the user's `user_id`, `tenant_id`, `primary_role`, and `secondary_role_labels` (array). Every API endpoint checks these on every request. The role check is centralised in middleware — never inlined per endpoint — so that a single bug fix propagates across the platform.

## 1.3 Data captured

| Entity | Key fields (Band 1) |
|---|---|
| `tenants` | id, subdomain (unique), display_name, default_currency, default_timezone, vat_rate, status, dpa_signed_at, created_at |
| `users` | id, tenant_id, email, password_hash, primary_role, secondary_role_labels (array), active, mfa_enabled, mfa_secret_encrypted, last_login_at, failed_login_count, locked_until |
| `sessions` | id, user_id, tenant_id, issued_at, expires_at, last_active_at, device_fingerprint, remember_device (bool) |
| `password_reset_tokens` | id, user_id, token_hash, expires_at, used_at |
| `audit_log` | (as defined in F.6) — every login, logout, failed attempt, password change, role change |

## 1.4 Rules & behaviours

- Every authenticated request resolves `tenant_id` server-side from the session, not from the client.
- Every database query on a tenant-owned table applies a `WHERE tenant_id = :current_tenant` filter automatically — enforce this in a base query layer so no developer can forget.
- Passwords are never logged, never emailed in plain text, never displayed after entry.
- A user's `last_login_at` is updated on every successful login (not on every request).
- A generic error page is shown for any 500-level server error — never a stack trace in production.
- Rate limiting applies to `/login` and `/forgot-password`: 10 requests per IP per minute.

## 1.5 What it connects to

- **Feeds:** Everything. No other Band 1 item can be built until Item 1 is functional, because every screen requires an authenticated, tenant-scoped user.
- **Depends on:** Nothing — this is the root.

## 1.6 Out of scope for Band 1

- SSO (Google Workspace, Microsoft, SAML) — Band 3.
- SMS-based MFA — Band 3.
- Platform admin panel with subscription management — Band 3.
- Self-service tenant signup — Band 3 (Band 1 tenants are provisioned internally).
- IP allow-listing, device trust scoring — Band 3.
- Audit log UI (the log exists in Band 1; the screen to browse it is Band 2).

## 1.7 UI specifics

The login screen is the only fully unauthenticated screen in the platform. It uses the **Form screen archetype** (F.10.6) but centred on a clean white canvas — no side nav, no top bar. The tenant logo (set in Item 2) sits above the form. The form is 360px wide, vertically centred, with email + password fields stacked, "Remember this device" checkbox, "Forgot password?" tertiary link, and a single primary "Sign in" button at full width. Failed login errors appear as an inline toast below the button, never inline per-field, to preserve the generic-error rule from 1.2.3. The MFA challenge screen reuses the same centred-form layout with a 6-digit code input split into individual character boxes (auto-advancing focus) and a "Use a backup code" tertiary link. Forced password change uses the same archetype with two new-password fields and a strength indicator below the second.


---

# Item 2 — Tenant Settings & Onboarding Wizard

*References: M20. Second build. Must exist before any operational data (students, staff, sessions) can be created.*

## 2.1 Purpose

Item 2 gives a newly-provisioned tenant the ability to configure itself. A fresh tenant with no departments, no rooms, no operating hours, and no branding cannot create a student, schedule a session, or issue an invoice — every downstream item references settings defined here. The onboarding wizard exists to walk the first Super Admin through the minimum required setup in a fixed order so they cannot skip a step that would break later operations. After the wizard completes, the same settings remain editable via a standard Settings screen.

## 2.2 What the developer must build

### 2.2.1 The onboarding wizard

On first login of the first Super Admin of a newly-activated tenant, the user is redirected to the wizard and cannot navigate away until it is complete. The wizard is linear — no skipping steps, no jumping ahead. Each step saves on "Next"; "Back" is allowed but re-saves on the next forward move. Progress is persisted, so if the user closes the browser mid-wizard they resume at the last completed step.

The wizard has **seven steps**:

1. **Welcome & organisation basics.** Display name (pre-filled from provisioning), legal name, primary contact email, primary contact phone, website URL (optional), organisation logo upload (PNG/JPG, max 2MB, displayed in the top-left of every screen after wizard completion).
2. **Branches.** At least one branch is required. Fields per branch: name, address (single free-text field in Band 1, not structured), phone, default operating hours (see 2.2.3). A tenant with one branch auto-selects it on every screen; multi-branch tenants get a branch picker in the top bar.
3. **Departments.** At least one department is required. Fields: name, sort order, year-group range (from-to, using the year group list supplied by the platform — see 2.2.4). IMI pre-seeds with Primary (FS1–Y6), Lower Secondary (Y7–Y9), Senior (Y10–Y13).
4. **Rooms.** At least one room per branch is required. Fields: name, branch, capacity (integer, 1–100), active flag. Rooms are referenced by sessions in Item 6.
5. **Financial settings.** Currency (pre-filled AED, editable), VAT rate (pre-filled 5%, editable), VAT registration number (optional free text), invoice number prefix (e.g. `IMI-`, used when invoices are generated in Item 5), **student ID prefix** (e.g. `IMI`, used when student records are created in Item 4 — separate from the invoice prefix because student IDs typically have no trailing dash), default payment terms in days (e.g. 7), and enrolment fee amount (IMI: AED 300, lifetime).
6. **Calendar & operating rules.** Week start day (default Monday), non-working days (checkbox list — IMI ticks Sunday), office hours per weekday (start/end time, or "closed"), holiday calendar (one or more date ranges with names — e.g. "Winter Break 2025-12-15 to 2026-01-04"). Academic year start date and end date (defines Term 1–3 roll-up used in Item 3).
7. **Review & finish.** Read-only summary (note: the wizard intentionally does not seed any subjects, courses, students, or staff — those are created in Items 3, 4, and 8 after the wizard completes) of all entries above with an Edit link per section. A "Complete Setup" button writes a `tenant_onboarded_at` timestamp and redirects to the Super Admin landing page. Audit log records the onboarding completion.

A progress bar along the top shows the seven steps with the current one highlighted. The user cannot click ahead past the current step.

### 2.2.2 The Settings screen (post-wizard)

After the wizard, the full Settings area is available from the top bar (gear icon, visible only to Super Admin and Admin Head). It has a left-hand nav with the following sections — these are the Band 1 settings sections; other M20 sections (churn thresholds, dashboard preferences, integrations, churn weights, broadcast lists, segment rules) exist in the navigation shell but display a "Coming in Band 2" placeholder and are not editable.

Band 1 editable sections:

- **Organisation** — everything from wizard step 1, plus a "Change logo" button.
- **Branches** — list, add, edit, archive (never hard-delete; an archived branch hides from all pickers but preserves historical data).
- **Departments** — same list/add/edit/archive pattern. Department cannot be archived if any active student references it.
- **Rooms** — list, add, edit, archive. Cannot be archived if a future session is scheduled in it.
- **Financial** — everything from wizard step 5.
- **Calendar** — everything from wizard step 6, plus a calendar visualisation showing non-working days and holiday ranges in the current academic year.
- **Branding** — logo, primary colour (hex picker, used for buttons and highlights), display name on printed invoices.

Every Settings save writes an audit log entry capturing old and new values per field.

### 2.2.3 Operating hours model

Operating hours are stored per branch per weekday. Each day is either **closed** or has one or more time ranges (e.g. IMI Saturday: 09:00–13:00 and 15:00–20:00 — two ranges). Time ranges are half-open intervals: the start time is inclusive, the end time is exclusive. This matters for Item 6 (scheduling), which must warn — not block — when a session is placed outside operating hours. A session placed outside operating hours is allowed but logs a warning to the creator; a session placed on a non-working day also warns. Both are soft warnings: tuition centres legitimately run sessions outside normal hours.

### 2.2.4 Year group list

The platform ships a fixed canonical year group list used across all tenants. Tenants cannot add custom year groups in Band 1. The list, with IMI dual-naming, is:

FS1 (Nursery), FS2 (Reception), Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, Y10, Y11, Y12, Y13 (plus a "Graduated" and "Alumni" status — these are not year groups but terminal states; see Item 4).

When a tenant creates a department in step 3, they pick a contiguous range from this list. A year group cannot belong to more than one department within a tenant.

### 2.2.5 Mandatory-setup guard

Until the wizard is complete (`tenant_onboarded_at IS NULL`), every non-wizard URL redirects to the wizard. Once it is complete, the wizard is still accessible as a read-only view from Settings → Organisation → "View onboarding summary", but its steps cannot be re-run.

## 2.3 Data captured

| Entity | Key fields (Band 1) |
|---|---|
| `tenants` | (extended from Item 1) legal_name, primary_contact_email, primary_contact_phone, website_url, logo_url, primary_colour, tenant_onboarded_at, invoice_number_prefix, default_payment_terms_days, enrolment_fee |
| `branches` | id, tenant_id, name, address, phone, active, created_at |
| `departments` | id, tenant_id, name, sort_order, year_group_from, year_group_to, active |
| `rooms` | id, tenant_id, branch_id, name, capacity, active |
| `operating_hours` | id, tenant_id, branch_id, day_of_week (0-6), time_ranges (JSON array of {start, end}), is_closed |
| `holiday_ranges` | id, tenant_id, name, start_date, end_date |
| `academic_years` | id, tenant_id, name (e.g. "2025-26"), start_date, end_date, is_current |

## 2.4 Rules & behaviours

- The wizard is single-track and cannot be abandoned mid-flow without leaving the tenant in a blocked state (the Super Admin can log out, but on next login they land back in the wizard).
- Year groups are a closed list in Band 1; no tenant-level additions.
- A department cannot overlap another department's year-group range within the same tenant — the wizard and Settings both validate this and reject the save with a clear error.
- A branch, department, or room that is referenced by any active record cannot be archived until those references are resolved.
- All time fields are stored in UTC and rendered in the tenant's timezone.
- The current academic year is determined by `is_current = true` — exactly one row per tenant. A manual "roll over to next academic year" action in Settings → Calendar flips the flag and is a Band 2 feature; in Band 1, the academic year is set once during onboarding and edited manually if needed.

## 2.5 What it connects to

- **Feeds:** Item 3 (catalogue references departments), Item 4 (student records carry department and branch), Item 6 (scheduling references rooms, operating hours, holidays), Item 5 (invoicing uses currency, VAT rate, invoice prefix, payment terms, enrolment fee), Item 8 (staff records carry department and branch).
- **Depends on:** Item 1 (the Super Admin must exist and be authenticated to run the wizard).

## 2.6 Out of scope for Band 1

- Churn weights, thresholds, and risk bands (Band 2 — the shell exists in the nav but is not editable).
- Seat occupancy targets, peak hours, dashboard preferences (Band 2).
- Integration settings (Zoho, WhatsApp, payment gateways, Mailchimp, Google Calendar) — all Band 3.
- Automation rule settings, segment definitions, broadcast lists — Band 2/3.
- Tenant-level custom year groups — not on any roadmap; the canonical list is fixed.
- Academic year rollover workflow — Band 2.
- Structured address fields with country/city pickers — Band 1 uses a single free-text address field.
- Tenant-specific notification preferences — Band 3 (in Band 1 the tiny set of notifications is hardcoded).

## 2.7 UI specifics

The onboarding wizard uses the **Wizard archetype** (F.10.6) — full screen, no side nav until completion, progress strip across the top showing all 7 steps with the current step highlighted in royal blue. Each step's content is constrained to 720px wide and centred. Back/Next sit in a fixed bottom bar with Next as primary right-aligned. Step 6 (Calendar) includes an inline visual calendar preview that updates as the user toggles non-working days and adds holiday ranges — this is the only place in Band 1 where a mini-calendar component is needed outside Item 6. Post-wizard, the Settings screen uses the **List/Detail hybrid archetype**: left-side nav rail (200px) listing the Band 1 sections plus the Band 2 placeholder shells (greyed out with a small "Band 2" badge), and the right pane showing the active section's editable form. Branding subsection includes a live preview card showing how the logo and primary colour will appear in the top bar.


---

# Item 3 — Academic Catalogue & Pricing

*References: M11. Third build. Everything downstream — scheduling, enrolment, billing, progress — reads from this table. This is the single most-referenced data structure in the platform, and pricing lives here, not in the invoice builder.*

## 3.1 Purpose

Item 3 gives a tenant the ability to define what they teach and what it costs. The catalogue owns the per-session rate and the standard session duration for every subject × year group × delivery mode combination. When an invoice is built in Item 5, it does not ask the Admin "what is the rate?" — it reads the rate from the catalogue. When a session is scheduled in Item 6, it does not ask the user "how long is this?" — it reads the duration from the catalogue. When attendance is marked in Item 7 and a session unit is deducted, the unit size is determined by the catalogue. If the catalogue is wrong, everything downstream is wrong. Therefore the catalogue screen must be careful, explicit, and visible — Admin Head and Super Admin can edit, Admins can read.

## 3.2 What the developer must build

### 3.2.1 The three-level structure

The catalogue has three nested levels:

1. **Subject** — a named area of teaching (e.g. "Maths", "English", "Physics", "CAT4 Preparation", "Primary Science"). A subject belongs to exactly one department. Subjects are created once per tenant and reused across year groups.
2. **Course (catalogue entry)** — the pairing of a subject with a year group and a delivery mode. Example: "Maths × Y5 × Group Class" or "IGCSE Physics × Y10 × 1-to-1". This is the row that carries the rate and the duration. A subject typically has many course rows — one per year group it is taught at, sometimes split further by delivery mode.
3. **Package** — an optional predefined bundle of sessions sold at a single headline price. Example: "10 sessions of Primary Maths Y4–6 for AED 1,700". Packages are a shortcut used by the invoice builder in Item 5; they are not required — a course row alone is enough to generate an invoice. Packages in Band 1 cover the standard bundles and the special rate packages that replace the abolished holiday pricing system.

### 3.2.2 Subject screen

A list view showing all subjects with columns: name, department, active, course count (how many course rows reference this subject), created date. Filters for department and active status. "New subject" button opens a dialog with: name, department dropdown, description (optional, free text), active flag (default on). Save writes the row and returns to the list.

A subject cannot be archived if any active course row references it. Subject names must be unique within a department within a tenant — attempting to create a duplicate is blocked at save with the error *"A subject named [X] already exists in the [Department] department."* The error message names the blocking course rows so the user knows what to resolve.

### 3.2.3 Course screen (the pricing matrix)

This is the key operational screen. It presents a table of course rows with columns: subject, year group, delivery mode (Group / 1-to-1 / Trial), session duration (minutes), per-session rate (AED), package count, active, last updated. Filters at the top: department, subject, year group, delivery mode, active.

"New course" opens a form with these fields:

- **Subject** (dropdown from active subjects).
- **Year group** (dropdown from the canonical list). A subject can have multiple rows across year groups — this is the whole point.
- **Delivery mode** (Group, 1-to-1, Trial). Trial is a special mode used for the first introductory session; it carries its own rate (IMI: AED 250 Primary, AED 300 Secondary) and is capped at one per student per subject.
- **Session duration** (minutes, integer, default 60). The duration is the standard unit; an actual scheduled session that runs longer than this duration still deducts one unit. A session scheduled shorter than this duration cannot be created — blocked at the Item 6 scheduling layer with an error (*"Session shorter than catalogue standard. Decimal sessions are not allowed."*). An Admin can override with a logged reason, but the deduction is still one whole unit.
- **Per-session rate** (AED, 2 decimal places). This is the rate used by the invoice builder unless a package or discount is applied.
- **Conditional rate** (optional) — a second rate applied when a named condition is true. IMI uses this exactly once: Primary Science Y4–6 is AED 150 when the student is also enrolled in Maths and English (minimum 10 sessions each); otherwise AED 180. The condition is a structured predicate stored with the course row: `type = also_enrolled_in`, `required_subjects = [Maths, English]`, `min_sessions_each = 10`. The invoice builder evaluates this when building an invoice line. Only one conditional rate per course row in Band 1 — more complex rule chains are Band 2.
- **Active** flag.

### 3.2.4 IMI pricing — seed data

The following course rows are seeded into IMI's tenant during the Band 1 data load. The developer must confirm these match the tenant's current published rates before go-live.

**Primary — per-session rates (Group):**

| Year groups | Subject | Rate | Duration |
|---|---|---|---|
| KG1, KG2 | All Primary subjects | AED 160 | 60 min |
| Y1, Y2, Y3 | All Primary subjects | AED 170 | 60 min |
| Y4, Y5, Y6 | All Primary subjects except Science | AED 180 | 60 min |
| Y4, Y5, Y6 | Primary Science (conditional) | AED 150 when also enrolled in Maths AND English (min 10 each); otherwise AED 180 | 60 min |

**Secondary — frequency tiers.** Secondary pricing in IMI is not a flat per-session rate; it is a tiered structure based on how many sessions per week per subject a student attends. The tier is selected at enrolment time (Item 5) and is stored on the enrolment row. The platform ships four tier labels — the actual prices are configured as four course rows per subject, one per tier:

- **Standard tier** — 1 session/week.
- **Mid tier** — 2 sessions/week.
- **Next tier** — 3 sessions/week.
- **Top tier** — 4 or more sessions/week. **Minimum 10 sessions per subject applies to this tier.**

The invoice builder picks the tier based on the frequency-per-week value chosen at enrolment. Mid-term frequency tier downgrades are point-forward only: a student who drops from 3/wk to 2/wk retroactively keeps the old rate for already-attended sessions; the new rate applies from the downgrade date forward. This is a locked product decision.

**Trial pricing:**

| Department | Rate | Duration |
|---|---|---|
| Primary | AED 250 | 60 min |
| Lower Secondary, Senior | AED 300 | 60 min |

**CAT4 Preparation:** flat AED 200 per session, 60 min, no conditional rate, no frequency tiers.

**Enrolment fee:** AED 300, charged once per student for the lifetime of their enrolment (set in Item 2 settings, not a catalogue row).

### 3.2.5 Packages

A package bundles N sessions at a headline price. In Band 1, packages are used for the predefined special rate bundles that replaced the abolished holiday pricing system. A package row has:

- Package name (e.g. "Summer Intensive — Primary Maths Y4–6 — 15 sessions").
- Linked course row (one).
- Session count (integer).
- Headline price (AED).
- Valid-from and valid-until dates (optional; if set, the package is only selectable during that window).
- Active flag.

When the invoice builder in Item 5 is asked to enrol a student into a package, it creates an enrolment row with `sessions_total` and `sessions_remaining` both set to `package.session_count` and an invoice line at the headline price. No proration, no refund on unused sessions beyond the normal withdrawal rules (which are Band 2). A package is never created implicitly — every package is an explicit catalogue entry managed by Super Admin or Admin Head.

### 3.2.6 Rate edit history

Every edit to a per-session rate, a conditional rate, or a package headline price writes a row to `rate_history` with `course_id` (or `package_id`), `old_value`, `new_value`, `effective_from` (the date the new rate takes effect — defaults to now but editable forward), `changed_by`, `changed_at`, and `reason` (required free text). Historic rates are never deleted. The invoice builder uses the rate that was effective on the invoice issue date, so back-dated invoices (Item 5) resolve correctly against the rate that was valid at the time.

### 3.2.7 Permissions

- **Super Admin, Admin Head** — full create/edit/archive on subjects, courses, packages, and rates.
- **Admin** — read-only access to the catalogue. An Admin building an invoice in Item 5 sees the rate but cannot change it.
- **Academic Head, HOD, Head of Subject** — read-only.
- **Teacher, TA** — no access to the catalogue screen (teachers see subjects they teach via their session list, not via the catalogue).

Any rate edit requires a logged reason and writes an audit log entry in addition to the `rate_history` row.

## 3.3 Data captured

| Entity | Key fields (Band 1) |
|---|---|
| `subjects` | id, tenant_id, name, department_id, description, active |
| `courses` | id, tenant_id, subject_id, year_group, delivery_mode, session_duration_minutes, per_session_rate, conditional_rate, conditional_predicate (JSON), frequency_tier (null / standard / mid / next / top), min_sessions_required, active |
| `packages` | id, tenant_id, course_id, name, session_count, headline_price, valid_from, valid_until, active |
| `rate_history` | id, tenant_id, entity_type (course/package), entity_id, field, old_value, new_value, effective_from, changed_by, changed_at, reason |

## 3.4 Rules & behaviours

- Every invoice line generated in Item 5 must carry a `source_course_id` (and optional `source_package_id`) so the audit trail can trace price back to catalogue.
- The rate used on an invoice is the rate that was effective on the invoice issue date, read from `rate_history`. Do not read the current `courses.per_session_rate` for back-dated invoices.
- A course row cannot be archived if any active enrolment references it. The block lists the enrolments.
- Decimal sessions are blocked globally — enforced here at the catalogue layer (duration must be a positive integer) and again at the scheduling layer.
- Conditional rate evaluation runs at invoice build time, not at enrolment time. If the condition becomes false mid-term (the student withdraws from Maths), already-issued invoices are not retroactively adjusted; future invoices use the fallback rate.
- The Top tier (4+/wk) minimum of 10 sessions per subject is enforced at the enrolment layer in Item 5 — the catalogue stores the minimum, the enrolment flow refuses to create fewer.
- Package validity windows are warning-only for Super Admin and Admin Head, hard-block for Admin. (Admin cannot pick an expired package; leadership roles can, with a logged reason.)

## 3.5 What it connects to

- **Feeds:** Item 5 (enrolment and invoicing read rates and packages), Item 6 (scheduling reads session duration), Item 7 (attendance deduction reads session unit size).
- **Depends on:** Item 2 (departments and year groups must exist before course rows can reference them).

## 3.6 Out of scope for Band 1

- Multi-currency pricing per course — Band 3 (white-label commercial launch).
- Tenant-level custom delivery modes beyond Group / 1-to-1 / Trial — Band 2.
- Discount codes, promotional pricing rules, time-limited flash pricing — Band 2.
- Multi-subject conditional rate chains (more than one condition per course) — Band 2.
- Automatic frequency tier recalculation when a student changes cadence — Band 2; in Band 1, tier is chosen at enrolment and only changed manually with a logged reason.
- Package auto-renewal, rollover of unused sessions between packages — Band 2.
- Holiday pricing as a feature — permanently abolished; replaced by explicit special rate packages only.

## 3.7 UI specifics

The catalogue uses the **List screen archetype** (F.10.6) at three levels — subjects, courses, packages — with a top tab strip switching between them. The course pricing matrix is the most data-dense screen in Band 1 and benefits from a slightly tighter row height (48px instead of 56px) and tabular-num alignment on the rate column. Conditional rates are shown as a small info icon next to the rate, hovering reveals the predicate in a tooltip. The "New course" form is a right-side **drawer** (480px wide) rather than a full-page form, because Admin Heads typically create many course rows in sequence and the drawer keeps the list visible behind. Rate edits open a confirmation modal showing the old rate, new rate, effective date, and a required reason field — this is the only modal in Band 1 that has a required text input as part of the confirmation, because the rate history needs the reason captured at the same instant as the change.


---

# Item 4 — Student & Guardian Records

*References: M02, M17, M18, REF-02. Fourth build. This is the spine of every other operational item in Band 1. If Item 4 is wrong, every invoice, session, and attendance record hangs off broken data.*

## 4.1 Purpose

Item 4 is the central data entity of the platform. Every invoice is owed by a student. Every session is attended by students. Every enrolment links a student to a course. Every guardian is the point of contact and often the payer. Students and guardians are managed together because one cannot exist without the other — a student always has at least one guardian, and a guardian is defined by the students they are linked to.

## 4.2 What the developer must build

### 4.2.1 Student creation

Admin or higher creates a student via a "New student" button on the student list screen. Required fields at creation:

- **Full name** — first, middle (optional), last. Displayed concatenated in all lists.
- **Date of birth** — `DD/MM/YYYY`. Used to suggest a year group but not to enforce it.
- **Year group** — dropdown from the canonical list. The department is auto-set from the year group using the rules defined in Item 2 (FS1–Y6 → Primary, Y7–Y9 → Lower Secondary, Y10–Y13 → Senior). The department field on the student row is denormalised per the F.2 rule.
- **Branch** — dropdown from active branches.
- **Student ID** — tenant-unique human-readable identifier. Auto-generated using the pattern `{prefix}{5-digit-sequence}` (e.g. `IMI00123`). The prefix is set in Item 2. Editable once by Super Admin only.
- **Gender** — Male / Female / Other / Prefer not to say.
- **School** — free text, the name of the school the student attends during the day (used later for exam event matching in Band 2, captured in Band 1).
- **At least one guardian link** — the creation form requires creating or linking a guardian inline before save. No orphan students.

On save, the student row is written with `enrolment_status = Prospect` (they are not yet enrolled in any course — that happens in Item 5). The activity log records the creation.

### 4.2.2 Guardian creation

A guardian is created either inline from the student creation form or directly from the guardian list screen. Fields:

- **Full name** — first, last.
- **Relationship to student** — Mother / Father / Guardian / Other. When linking a guardian to a second student, the relationship is per-link (a guardian can be "Mother" to one student and "Guardian" to another).
- **Phone** — one primary phone, format-validated against UAE and international patterns. Optional secondary phone.
- **Email** — one primary email, format-validated, unique per tenant (a tenant cannot have two guardian rows with the same email — attempting to create a second prompts "A guardian with this email already exists — link to existing?" which opens a search-and-link flow).
- **Primary contact** (boolean, per link) — exactly one guardian per student must be marked primary contact. The primary contact is the default recipient for all communications about that student.
- **Financial payer** (boolean, per link) — one or more guardians per student may be marked as financial payers. Invoices in Item 5 are addressed to one financial payer at a time.
- **DNC flag** — Do Not Contact. See 4.2.4.

### 4.2.3 The `student_guardian` join table and co-parent three states

A student can have many guardians and a guardian can have many students (common for siblings). The join table carries the relationship, primary-contact flag, and financial-payer flag. A co-parent relationship between two guardians of the same student has **three states**, locked from REF-02:

1. **Linked and cooperating** — both guardians see the same financial and academic context; invoices can be split or addressed to either; communications go to both by default.
2. **Linked but separated** — both guardians are recorded against the student, but only one is designated the active communication target. The other is visible in the profile but does not receive automatic communications.
3. **Not linked** — only one co-parent is recorded. The other is unknown or deliberately excluded.

The co-parent state is a field on the student row (not on the guardian row), because it describes the co-parenting arrangement for that specific child. Default is "Not linked" until Admin explicitly sets otherwise.

### 4.2.4 Do Not Contact (DNC) — warning interstitial, not hard block

DNC is set on a guardian row. When DNC is active, every contact button on the guardian profile and on any student linked to that guardian remains visible and clickable — DNC does not remove them. Instead, on click, a warning interstitial appears: *"This contact is marked Do Not Contact. Reason logged: [reason]. Proceeding will be recorded in the activity log. Continue?"* with Cancel and Continue buttons. This matches the locked AMD-01 decision.

**DNC vs unsubscribed.** DNC and unsubscribed are separate flags that can coexist. **DNC always wins** over unsubscribe: a guardian who has unsubscribed from marketing is still contactable for operational matters; a guardian who has DNC set is not contactable for anything without the warning. Both flags are shown on the guardian profile with separate reason fields and timestamps.

DNC can be set or cleared only by Admin Head or above, with a logged reason. The setting writes to the activity log and to the audit log.

### 4.2.5 The 5-tab student profile

The student profile is a full-page read view with five tabs. Band 1 builds all five tabs but populates them with only the Band 1 data sources — tabs that depend on Band 2 features show placeholders.

1. **Overview** — photo (optional upload, replaces the default avatar), full name, student ID, year group, department, branch, date of birth, school, gender, enrolment status badge, a summary strip showing active enrolments count, sessions-remaining total, last attended date, and outstanding invoice balance. A quick-actions bar: Edit, New enrolment, New invoice, Contact primary guardian, Mark DNC (on a linked guardian).
2. **Academic** — list of current enrolments (subject, year group, frequency, sessions remaining, start date). A "History" sub-view shows past enrolments. The Academic tab in Band 1 does not show progress tracker data, predicted grades, or alerts (those are Band 2) — it shows only the enrolment list.
3. **Attendance** — a chronological list of attendance records (date, session, status, marked by). Filters by date range and status. Counts by status at the top (present/absent/late/excused).
4. **Finance** — list of invoices (number, date, amount, VAT, total, status, amount paid, amount due). Total outstanding at the top. A "New invoice" button (if the current user has permission). Payments are shown inline under their invoice.
5. **Activity** — chronological feed of all events on the student record (created, edited, enrolment added, invoice issued, payment received, attendance marked, DNC warning shown, status changed, etc.). Capped at the last 500 entries per F.2.

### 4.2.6 Guardian profile

Simpler than the student profile. Tabs: Overview (name, phone, email, DNC, unsubscribed, linked students), Students (list with link type and flags), Invoices (invoices where this guardian is the financial payer), Messages (Band 2 placeholder), Activity (chronological feed).

Guardian erasure path: a guardian can be erased (right-to-be-forgotten) by Super Admin only. Erasure replaces identifying fields with tombstoned values (`[erased]`), preserves financial history (because of the 5-year retention rule), and writes an immutable audit log entry. A guardian linked only to financial history with no active student can be erased; one linked to an active student must be unlinked first.

### 4.2.7 Merge

Two duplicate student records or two duplicate guardian records can be merged. Admin Head or above initiates. The merge screen shows both records side-by-side with a field-by-field picker (for each field, choose which value wins). On confirm, the losing record is marked merged, all foreign keys are repointed to the winning record, and the operation is recorded in a `merge_history` row with full old-and-new state.

**Rollback window.** 24 hours. During this window, Admin Head can revert the merge and both records are restored exactly as they were. After 24 hours, the rollback option disappears — the merge is permanent.

**Financial activity gate.** If any invoice has been issued, any payment has been received, or any credit has been applied on the losing record after the merge began, the rollback is blocked even within the 24-hour window. The error explains why: *"Rollback blocked — financial activity has occurred since the merge. Contact Super Admin to resolve manually."* This gate exists because rolling back a merge after money has moved would create accounting discrepancies that violate the 5-year retention rule.

### 4.2.8 Student list screen

A paginated list with search, filters (department, branch, year group, enrolment status, active guardian DNC), and columns: student ID, full name, year group, department, branch, primary guardian, enrolment status, last attended, outstanding balance. Click-through opens the profile. Export to CSV available to Admin Head and above (full list respecting filters).

### 4.2.9 Permissions

- **Super Admin, Admin Head, Admin** — full create, edit, archive, merge.
- **Academic Head, HOD, Head of Subject, Teacher, TA** — read-only on students they have a legitimate scope for (Teacher sees only students in their own sessions; HOD sees their department; Academic Head sees all).
- **HR/Finance** — read-only on students, full access on the Finance tab.
- **Merge, archive, erasure** — Admin Head minimum; erasure is Super Admin only.

## 4.3 Data captured

| Entity | Key fields (Band 1) |
|---|---|
| `students` | id, tenant_id, branch_id, student_id_display, first_name, middle_name, last_name, dob, year_group, department_id, gender, school, photo_url, enrolment_status (enum: Prospect / Active / Graduated / Alumni), enrolment_status_since, co_parent_state (enum: not_linked / linked_cooperating / linked_separated), active, created_at |
| `guardians` | id, tenant_id, first_name, last_name, phone_primary, phone_secondary, email, dnc, dnc_reason, dnc_set_by, dnc_set_at, unsubscribed, unsubscribed_at, erased_at |
| `student_guardian` | student_id, guardian_id, relationship_type, is_primary_contact, is_financial_payer, created_at |
| `merge_history` | id, tenant_id, entity_type (student/guardian), winning_id, losing_id, field_choices (JSON), initiated_by, initiated_at, rollback_deadline, rolled_back_at, rollback_blocked_reason |
| `activity_log` | (scoped per entity) id, tenant_id, entity_type, entity_id, event_type, event_description, actor_user_id, timestamp, payload (JSON) |

## 4.4 Rules & behaviours

- A student must always have at least one guardian marked primary contact. Removing the primary flag from the only primary guardian is blocked until another guardian is promoted.
- A student must always have at least one guardian marked financial payer before an invoice can be issued in Item 5 (not at student creation — at invoice time).
- Department is recalculated whenever year group changes. The recalculation runs in the same transaction as the year group update.
- Student ID is auto-generated on create and is never reused (even for deleted records).
- The student row's `enrolment_status` follows this lifecycle: **Prospect** (created, no active enrolment yet) → **Active** (first enrolment created) → if all enrolments transition to Withdrawn or the centre-wide graduation date is reached → **Graduated** → after the configurable 30-day window from PL-01 → **Alumni**. A student returns to **Active** if a new enrolment is created on an Alumni or Graduated record (the existing record is reused, not duplicated). The transition from Active back to Prospect is **not** automatic — once a student has been Active, they never return to Prospect; the appropriate state for a student with no current enrolments is Graduated or Alumni depending on context.
- The activity log is append-only. Edits and deletions of activity rows are blocked at the application layer.
- Merge rollback is blocked by financial activity on the losing record within the 24-hour window.
- DNC warnings are logged every time the interstitial is shown AND every time it is clicked through — both events, separately.
- Erasure preserves the `id` of the row so foreign keys remain valid; only identifying fields are tombstoned.

## 4.5 What it connects to

- **Feeds:** Item 5 (enrolment and invoicing require student + financial-payer guardian), Item 6 (scheduling references students indirectly via enrolments), Item 7 (attendance marking writes against student-session pairs).
- **Depends on:** Item 2 (departments, branches, year groups must exist), Item 1 (authenticated tenant-scoped user).

## 4.6 Out of scope for Band 1

- Lead records, lead-to-student conversion — Item 9, Band 2.
- Student portal login — Band 3.
- Parent portal login — Band 3.
- Guardian messaging history, in-app conversation thread — Band 2.
- Automated DNC trigger rules (e.g. auto-DNC after 3 undelivered WhatsApps) — Band 2.
- Guardian referral tracking — Band 2.
- Bulk student import via CSV — Band 2 (Band 1 uses direct database seed).
- Student progress tracker, predicted grade, AI report history — Band 2.
- Churn score, retention score, academic alerts on the profile — Band 2.

## 4.7 UI specifics

The student list uses the **List screen archetype** with photo thumbnails in the leftmost column (32px circles, default avatar if no photo). The 5-tab student profile is the canonical **Detail screen** (F.10.6) — the most-visited screen in the platform. The Overview tab uses a two-column layout: left column 60% with the photo, name, key fields, and quick actions; right column 40% with the summary cards (active enrolments, sessions remaining, last attended, outstanding balance). Each summary card is a clickable shortcut to the relevant tab. The DNC warning interstitial is a **destructive-confirm modal** (F.10.7) styled with a yellow warning border (using `--color-warning`) rather than red, because DNC is a caution not a deletion — Continue button text reads "Contact anyway" rather than just "Continue". The merge flow opens a full-page split-screen comparison view (not a modal) with both records side-by-side and per-field radio pickers, plus a sticky bottom bar showing the merge summary and the 24-hour rollback notice.


---

# Item 5 — Enrolment Core Flow & Minimum Viable Invoicing

*References: M04, M08, PL-01. Fifth build. This is where Items 3 and 4 come together: the act of enrolling a student in a course, issuing an invoice that references the catalogue rate, and recording payment.*

## 5.1 Purpose

Item 5 turns a prospective student into an active paying student. The enrolment flow captures the commercial commitment (what subject, how many sessions, at what frequency, for what price) and emits two linked records: an **enrolment row** that governs future scheduling and attendance, and an **invoice row** that governs payment. Without Item 5 the platform cannot answer "who is studying what and has paid for it" — the single question the founder uses as the definition of a working centre.

## 5.2 What the developer must build

### 5.2.1 The enrolment flow

Triggered from the student profile ("New enrolment" button) or from the student list ("Enrol student" action). Admin or higher can enrol. The flow is a single multi-step form:

1. **Choose course.** Dropdown filtered to courses whose department matches the student's department and whose year group matches the student's year group. If no match exists, an explicit error explains why — the student's year group has no courses for the chosen subject. The user can also switch delivery mode (Group / 1-to-1 / Trial).
2. **Choose frequency tier** (Secondary only). Dropdown: Standard / Mid / Next / Top, which maps to 1 / 2 / 3 / 4+ sessions per week. Primary does not show this step. **Top tier enforces a minimum of 10 sessions per subject** — if fewer is entered below, save is blocked with the error *"Top tier requires at least 10 sessions per subject."*
3. **Choose session count.** Integer field. For a package selection (see 5.2.2), this is pre-filled and locked. For direct enrolment, the Admin enters the number the parent is purchasing (e.g. 20 sessions).
4. **Choose start date.** Defaults to today, editable forward or backward (back-dating is allowed with a logged reason).
5. **Confirm financial payer.** The payer dropdown is filtered to guardians where `student_guardian.is_financial_payer = true` for this student. If the student has only one financial-payer guardian, it is pre-selected and read-only.
6. **Optional discount.** A discount line with a percentage or a fixed amount and a required reason. **Discounts require Admin Head approval** — the enrolment is created immediately in a pending state, an entry is added to the `pending_approvals` table per F.7, and the invoice is not issued until the discount is approved. If the user clicks Save with no discount, the enrolment and invoice are both created immediately.
7. **Review & confirm.** Read-only summary showing: course, rate (read from catalogue), session count, subtotal, discount, VAT (5% of post-discount subtotal), total, enrolment fee (if this is the student's first-ever enrolment — AED 300 lifetime from Item 2), and payment terms. Confirm creates both records atomically.

On confirm the system writes an `enrolments` row with `sessions_total` and `sessions_remaining` both set to the form's session count value (`sessions_total` is the immutable original purchase count, `sessions_remaining` is the live decrementing balance), `status = Active`, linked to the course and the invoice and an `invoices` row (`status = Issued` unless discount-pending, in which case `Draft`).

### 5.2.2 Package enrolment

Shortcut path: the user chooses "Enrol via package" instead of building from a course. They pick a package from the catalogue (Item 3); the course, session count, and headline price are pre-filled and locked. Discount and payment flow are identical.

### 5.2.3 Invoice structure & VAT calculation

An invoice has a header (number, date, due date, student, financial payer guardian, branch, status, notes) and one or more line items. Line items in Band 1 are of three types: **Enrolment line** (sessions × rate), **Package line** (package headline price), and **Enrolment fee line** (AED 300, one-time lifetime charge). Each line carries `source_course_id`, `source_package_id`, `unit_price`, `quantity`, `line_subtotal`, `discount_amount`, `discount_reason`. The invoice rolls up:

```
subtotal     = sum(line_subtotal)
discount     = sum(discount_amount)
vat          = round((subtotal - discount) × 0.05, 2)
total        = subtotal - discount + vat
amount_paid  = sum(payments.amount where payment.invoice_id = this.id)
amount_due   = total - amount_paid
```

**Worked example.** Y5 student, 20 Primary Maths sessions at AED 180, 10% discount, first-ever enrolment so enrolment fee applies:

- Enrolment line: 20 × AED 180 = AED 3,600
- Enrolment fee line: AED 300
- Subtotal: AED 3,900
- Discount (10% of enrolment line only — enrolment fee is non-discountable): AED 360
- Post-discount: AED 3,540
- VAT (5%): AED 177.00
- Total: AED 3,717.00

**The enrolment fee is non-discountable.** Discounts apply only to tuition lines.

### 5.2.4 Back-dated invoices and rate history

If the invoice issue date is back-dated (Admin with logged reason), the rate used is the one that was effective on that date, read from `rate_history` per Item 3. Current catalogue rate is not used for back-dated invoices.

### 5.2.5 Recording a payment

From the invoice detail screen, "Record payment" button (Admin or higher) opens a form: amount, payment date, method (Cash / Card / Bank Transfer / Cheque), reference (free text — cheque number, transaction ID), notes. On save, a `payments` row is written linked to the invoice. The invoice status auto-recalculates: `Paid` when `amount_paid >= total`, `Partially Paid` when `0 < amount_paid < total`, `Issued` when `amount_paid = 0`. A payment cannot exceed the invoice total — overpayment is blocked with an error; excess amounts are handled via credit (see 5.2.7).

Payments are never deleted. To correct a mistaken payment, record a reversing adjustment with a logged reason (Admin Head minimum). The original row remains, an offsetting row is added, and both are shown in the audit trail.

### 5.2.6 Refunds — three-stage approval chain

A refund is initiated from an invoice (Admin). It goes through a fixed three-stage chain: **Admin initiates → Admin Head approves → Super Admin approves**. Each stage writes to `pending_approvals`. A refund never executes until all three stages are complete. The refund creates a negative `payments` row linked to the original invoice, reducing `amount_paid` and re-opening the invoice balance accordingly. The reason is required at initiation and visible at every approval stage. **A refund cannot exceed the invoice's `amount_paid`** — the initiation form blocks an amount higher than what has actually been received. To return value beyond `amount_paid`, an Admin issues a separate credit via the credit ledger (5.2.7). No stage of the refund chain can be collapsed or skipped, even by Super Admin — this is locked from the session state.

### 5.2.7 Credit — post-VAT deduction

Manual credit is issued by Admin with a logged reason (no approval required in Band 1 for small credits; larger credits follow tenant policy — the threshold is a Band 2 setting, in Band 1 all credits are Admin-issuable). Credit is stored as a `credit_balance` on the student row (not on the guardian) and is applied **post-VAT** at the point of using it against a future invoice — the credit directly reduces `amount_due`, not `subtotal`. This avoids double taxation when a credit that was originally created from a VAT-inclusive amount is reapplied. Every credit issue and every credit application writes to a `credit_ledger` table with the full history.

### 5.2.8 Enrolment status lifecycle

An enrolment row moves through these statuses:

- **Active** — default; sessions can be attended and deducted.
- **Paused** — temporary hold; no deductions occur; scheduled sessions skip this student. Admin sets with a reason.
- **Withdrawn** — permanent; no further sessions; `sessions_remaining` frozen. Withdrawal is initiated by Admin with a reason. Any unused sessions follow the tenant's refund policy (refunds run through the three-stage chain).
- **Graduated** — set when all sessions have been attended or when the student reaches the graduation date (centre-wide, configured in Item 2's academic year settings — the session state records this as a centre-wide graduation date locked in M19/PL-01).

### 5.2.9 Graduated → Alumni transition

A student with status `Graduated` auto-transitions to `Alumni` after **30 days** (configurable in Item 2 settings at the tenant level, 1–365 days). This is a background job that runs daily and flips statuses. The Alumni state is terminal for Band 1 — an Alumni student can be re-enrolled (which creates a fresh enrolment row, preserves history, and flips the student back to Active). PL-01 is authoritative on this 30-day rule.

### 5.2.10 Split billing — known limitation

Band 1 does not support splitting a single invoice across multiple financial-payer guardians. If a student has two payers, Admin issues one invoice to one payer at a time. This is a locked v1 limitation and is documented in the UI: on the enrolment flow, if the student has more than one financial payer, a notice reads *"Split billing is not supported in v1. Choose one financial payer for this invoice."*

### 5.2.11 Permissions summary

- **Admin** — create enrolments, issue invoices (non-discounted), record payments, initiate refunds, issue credits.
- **Admin Head** — approve discounts, approve stage 2 of refunds, issue adjustments/reversals.
- **Super Admin** — approve stage 3 of refunds, override any block with a logged reason.
- **HR/Finance** — read-only access to invoices and payments, plus CSV export.
- **Academic/Teacher roles** — no access to invoicing; read-only on enrolment count/sessions-remaining as part of student profile.

## 5.3 Data captured

| Entity | Key fields (Band 1) |
|---|---|
| `enrolments` | id, tenant_id, student_id, course_id, frequency_tier, sessions_total, sessions_remaining, start_date, end_date, status, status_since, invoice_id, notes |
| `invoices` | id, tenant_id, invoice_number, student_id, payer_guardian_id, branch_id, issue_date, due_date, subtotal, discount, vat, total, amount_paid, amount_due, status, notes |
| `invoice_lines` | id, invoice_id, line_type, source_course_id, source_package_id, description, unit_price, quantity, line_subtotal, discount_amount, discount_reason |
| `payments` | id, tenant_id, invoice_id, amount, payment_date, method, reference, notes, reversed_by_payment_id |
| `credit_ledger` | id, tenant_id, student_id, direction (issued/applied), amount, reason, related_invoice_id, created_by, created_at |
| `pending_approvals` | id, tenant_id, request_type, request_payload (JSON), initiated_by, initiated_at, current_stage, approver_role, resolved_at, resolved_by, outcome, reason |

## 5.4 Rules & behaviours

- VAT is always 5% of `(subtotal - discount)`. Never calculated on the raw subtotal.
- Enrolment fee is non-discountable.
- Top tier (4+/wk) enforces min 10 sessions per subject.
- Discounts require Admin Head approval before the invoice moves from Draft to Issued.
- Refunds always run through the three-stage chain with no exceptions, even Super Admin cannot single-step a refund.
- Credits are applied post-VAT to `amount_due`, never to `subtotal`.
- Back-dated invoices resolve rates against `rate_history` as of the issue date.
- Financial records (invoices, payments, credit ledger) are never hard-deleted — 5-year retention per F.5.
- The `Graduated → Alumni` transition runs as a daily background job at 02:00 tenant-local time.
- Split billing is blocked in v1; single payer per invoice only.
- Every invoice status change, payment recording, refund stage transition, and credit application writes to the activity log (student-scoped) and the audit log (tenant-scoped).

## 5.5 What it connects to

- **Feeds:** Item 6 (scheduling uses enrolment for class eligibility), Item 7 (attendance deducts from `sessions_remaining`).
- **Depends on:** Item 1 (auth), Item 2 (VAT rate, invoice prefix, enrolment fee), Item 3 (rates, packages, rate history), Item 4 (student, guardian, financial payer).

## 5.6 Out of scope for Band 1

- Split billing across multiple payers on a single invoice — v1 limitation, never planned for Band 1.
- Payment gateway integrations (Telr, Network International, Stripe) — Band 3. Band 1 payments are recorded manually.
- Automated overdue reminders, dunning workflows — Band 2/3.
- Zoho Books API sync — Band 3. Band 1 uses manual CSV export.
- Installment plans with automatic scheduled charges — Band 2.
- Automatic credit issuance from withdrawal workflows — Band 2.
- Complex proration on mid-package withdrawal — Band 2.
- Tax invoices in Arabic — not in roadmap; English-only in v1.
- Aged debt reports, revenue dashboards, collection queues — Band 2.
- Discount approval thresholds (e.g. Admin can self-approve <5%) — Band 2; all discounts need Admin Head approval in Band 1.

## 5.7 UI specifics

The enrolment flow uses the **Form screen / drawer archetype** as a multi-step right-side drawer (640px wide for this one — wider than the standard 480px because the review step needs room for the price breakdown). The review step shows the full invoice calculation as a structured table with subtotal / discount / VAT / total rows, the VAT line clearly showing "5% post-discount" as helper text. When discount approval is pending, the enrolment row appears in the student profile Finance tab with a yellow "Awaiting approval" badge. The invoice detail page is a **Detail screen** with the line items as a table, the totals block right-aligned in the header card, and a Payments section below showing recorded payments inline. The refund initiation modal explicitly states "This refund will go through 3 stages: Admin → Admin Head → Super Admin. It cannot be reversed once started." with the three stages shown as a small horizontal stepper.


---

# Item 6 — Timetabling & Scheduling Core

*References: M05. Sixth build. This is where the operational rhythm of the centre is defined.*

## 6.1 Purpose

Item 6 gives the centre the ability to plan what is happening when, where, and with whom. A session is a scheduled instance of a class — a pairing of a subject, a teacher, a room, and a time window, with one or more enrolled students attached. Item 6 produces the session records that Item 7 then marks attendance against. Without Item 6 the centre has no calendar, no teacher schedule, no room utilisation, and no way to run class days.

## 6.2 What the developer must build

### 6.2.1 Session creation — single session

"New session" button on the calendar screen or the student profile. Admin or higher can create. The form fields:

- **Subject** — dropdown from active subjects. Filters by department if the user opened the form from a department-scoped context.
- **Course** — dropdown from active courses linked to the chosen subject. The course determines session duration, delivery mode, and (for attendance deduction) the unit size.
- **Teacher** — dropdown from active staff with the Teacher primary role or the Teacher secondary label, filtered by department.
- **Room** — dropdown from active rooms at the current branch, showing capacity.
- **Date** — date picker defaulting to today.
- **Start time** — time picker. The end time is auto-calculated from the course session duration (from Item 3). The end time field is read-only and updates live when start time changes.
- **Students** — multi-select search of students with an active enrolment in the chosen course. Students without a matching active enrolment are hidden from the picker. The list shows sessions-remaining per student so the Admin knows whether the deduction in Item 7 will work.
- **Notes** — free text, optional.

On save, a `sessions` row is written with `status = Scheduled` and one `session_students` row per student attached. The activity log records the creation. If the session is part of a recurring series (see 6.2.2), a `session_series` row is also written.

### 6.2.2 Recurring sessions

A session can be made recurring at creation time via a "Repeats" checkbox. On enable, additional fields appear:

- **Frequency** — Daily / Weekly / Monthly.
- **Interval** — every N (1–12).
- **Days of week** (weekly only) — checkbox list.
- **End condition** — End after N occurrences OR End on date OR No end (open-ended, must be manually stopped).
- **Skip holidays** — boolean, default on. When on, individual instances that fall on a non-working day or inside a holiday range from Item 2 are not generated. (They can still be manually added later.)

On save, the platform materialises individual session instances up to the end condition or up to 12 months forward for open-ended series, whichever is sooner. A background job extends open-ended series monthly. Every instance carries a `series_id` pointing to the parent. Edits to one instance affect only that instance by default; a "Apply to entire series" option is available on edit.

### 6.2.3 Calendar / grid view

The primary scheduling screen is a calendar grid. Three views: **Day** (single day, hour-by-hour, rooms as columns), **Week** (7 days, rooms grouped or teachers grouped toggle), **Month** (standard month grid, compact session blocks). Each block shows: subject, teacher surname, room name, time range, student count. Clicking a block opens the session detail panel. Colour coding is by department.

Filters: branch, department, teacher, room, subject, status. A top bar shows the current date range with Today / Previous / Next navigation. A "New session" button is always visible.

### 6.2.4 Conflict detection — hard blocks vs soft warnings

Conflicts are checked on save. Two categories:

**Hard blocks (session cannot be saved):**
- **Room is archived or inactive.** Per Item 2, a room cannot be archived if a future session exists in it; conversely, if a room is somehow inactive at session creation time, the save is blocked with the error *"Room [name] is not active."*
- **Room double-booking.** A room can hold only one session at a time. Overlapping room bookings are blocked with the error *"Room [name] is already booked from [start] to [end]."* The conflicting session is named.
- **Session shorter than catalogue duration.** The course's standard duration is the minimum. Sessions shorter than this are blocked. Admin can override with a logged reason; the deduction in Item 7 is still one whole unit.
- **Student has no matching active enrolment.** Already enforced by the student picker filter, but re-validated server-side on save.

**Soft warnings (session can be saved, warning shown, reason optional):**
- **Outside operating hours.** From Item 2. The warning names the branch and the hours and asks for confirmation.
- **Non-working day.** IMI Sundays, holiday ranges. Warning names the day/holiday.
- **Teacher double-booking.** A teacher scheduled to two simultaneous sessions. Warning only — teachers legitimately cover multiple year groups in the same hour at IMI. This is locked from the session state.
- **Student double-booking.** A student already has a session at the same time. Warning only.
- **Room over capacity.** More students attached than the room's capacity. Warning only.

All soft warnings write to the session notes field as *"Created with warning: [description]"* and log an activity entry.

### 6.2.5 Session edit, cancel, reschedule

From the session detail panel, Admin or higher can edit any field. Editing a recurring instance asks *"Apply to this instance only, or to the entire future series?"*. Status transitions:

- **Scheduled → Cancelled.** Requires a logged reason. Cancellation does not deduct a session unit. Attached students receive no deduction. The record is kept forever.
- **Scheduled → Completed.** Happens automatically when attendance is marked (Item 7).
- **Rescheduled.** Edit the date/time. Both the old and new time are kept in the activity log. No deduction occurs on reschedule.

A cancelled session can never be un-cancelled — a new session must be created.

### 6.2.6 Teacher view

Teachers see a simplified read-only version of the calendar showing only their own sessions. They can open any session to see the student list and (in Item 7) mark attendance. They cannot create, edit, cancel, or reschedule sessions in Band 1.

### 6.2.7 Attendance cannot be marked before the session day

Locked from the session state. Item 7 enforces this, but Item 6 respects it by never auto-completing a session until the session day has arrived. A scheduled session in the future has `status = Scheduled` regardless of time; on the session day the status becomes eligible for attendance marking; marking attendance transitions it to `Completed`.

### 6.2.8 Permissions

- **Super Admin, Admin Head, Admin** — full create, edit, cancel, reschedule.
- **HOD** — same as Admin, scoped to their department.
- **Academic Head** — read everything, can create sessions in any department.
- **Teacher, TA** — read-only on their own sessions in Band 1. No creation or editing.
- **HR/Finance** — no scheduling access.

## 6.3 Data captured

| Entity | Key fields (Band 1) |
|---|---|
| `sessions` | id, tenant_id, branch_id, course_id, subject_id, teacher_user_id, room_id, start_at, end_at, status, series_id, notes, created_by, created_at |
| `session_students` | session_id, student_id, added_at, added_by |
| `session_series` | id, tenant_id, frequency, interval, days_of_week (JSON), end_type, end_after_count, end_on_date, skip_holidays, created_at, last_materialised_through |
| `scheduling_warnings` | id, session_id, warning_type, description, confirmed_by, confirmed_at |

## 6.4 Rules & behaviours

- Session duration always equals the course's standard duration at creation time, unless an Admin override with reason is logged.
- Room double-booking is a hard block with no override path.
- Teacher double-booking is a soft warning — no block.
- Non-working days and outside-operating-hours are soft warnings — no block.
- Recurring series materialise to concrete session rows up to 12 months forward or to the end condition, whichever is sooner.
- Holidays from Item 2 are respected by `skip_holidays` at series creation; changes to the holiday list afterwards do not retroactively remove already-materialised instances. For open-ended series, the next monthly materialisation cycle picks up the updated holiday list — newly-added holidays will skip from that point forward, but already-materialised future instances are untouched and must be manually cancelled if needed.
- Students can only be added to sessions where they hold an active enrolment in the matching course.
- Session status never regresses. Cancelled is terminal.
- Every create, edit, cancel, reschedule, and student attach/detach writes an activity log entry on the session and an audit log entry tenant-wide.
- Attendance cannot be marked before the session day (cross-referenced with Item 7 for enforcement).

## 6.5 What it connects to

- **Feeds:** Item 7 (attendance is marked against session × student pairs from here).
- **Depends on:** Item 1 (auth), Item 2 (rooms, branches, operating hours, holidays), Item 3 (courses and session duration), Item 4 (students), Item 8 (teacher staff records with primary role or secondary label).

## 6.6 Out of scope for Band 1

- Smart slot suggestions, availability-aware auto-placement — Band 2.
- Waitlists for over-capacity sessions — Band 2.
- Makeup session scheduling logic (makeup allowance, expiry) — Band 2.
- Student-initiated reschedule requests — Band 2/3 (no student portal).
- Recurring session exceptions management UI beyond single-instance vs whole-series — Band 2.
- Teacher availability / time-off integration from Zoho People — Band 3.
- Auto-email confirmations to parents on schedule changes — Band 2/3.
- Calendar ICS export / Google Calendar sync — Band 3.
- Seat occupancy heatmap and peak-hours analytics — Band 2.

## 6.7 UI specifics

The calendar uses the dedicated **Calendar/grid archetype** (F.10.5, F.10.6). Day view is the default for Admins on a desktop. Week view is the default for HODs and Academic Heads. Sessions render as coloured blocks (colour by department per F.10.5), with subject in `--text-body-strong`, teacher surname and room in `--text-small`, and student count as a small badge. Soft warnings (teacher double-booking, outside hours, non-working day) show as a small amber dot in the top-right corner of the session block; hovering reveals the warning text. The room-archived hard block surfaces as a red border on the room field in the New Session form with the inline error message specified in 6.2.4. Recurring session edits use a small modal with two large radio cards: "Just this session" and "This and all future sessions in the series" — never a tiny radio button.


---

# Item 7 — Attendance Marking

*References: M06 (core only — makeups, Concern Engine, and the 48-hour window are Band 2). Seventh build. This is the operational heartbeat of the platform.*

## 7.1 Purpose

Item 7 turns scheduled sessions into a record of what actually happened. A teacher marks each attached student as present, absent, late, or excused. Marking attendance does three things: it records a fact (for parent communication and academic history), it moves money (via the session-unit deduction from the student's enrolment), and it completes the session. Without Item 7 the platform cannot track who actually attended what, and cannot correctly decrement remaining-session balances — meaning invoices in Item 5 would eventually detach from reality.

## 7.2 What the developer must build

### 7.2.1 Attendance marking screen

From the calendar in Item 6, clicking a session opens the session detail panel. On the day of the session (and after, not before — see 7.2.4), the panel shows an "Attendance" section: a table of the attached students with a status picker per row, a notes field per row (optional), and a bulk-action bar at the top (Mark all present / Mark all absent).

The status picker offers four values:

- **Present** — the student attended normally.
- **Absent** — the student did not attend.
- **Late** — the student attended but arrived late. Treated identically to Present for deduction; the distinction is retained for reporting.
- **Excused** — the student did not attend but the absence is authorised (illness, family emergency, school event).

A teacher selects a status per student and clicks **Save attendance**. The session status transitions from `Scheduled` to `Completed` on first save. Subsequent edits within the edit window (see 7.2.5) are allowed.

### 7.2.2 Deduction logic

For each row written to `attendance_records`, a corresponding entry is written to `session_deduction_ledger`. The deduction rule in Band 1 is simple and absolute:

- **Present** — 1 whole unit deducted from the student's enrolment `sessions_remaining`.
- **Late** — 1 whole unit deducted (identical to Present).
- **Absent** — 1 whole unit deducted. The student consumed the slot regardless of showing up. The Band 2 Concern Engine and makeup policy will later change this behaviour; in Band 1 it does not.
- **Excused** — 1 whole unit deducted. Same reasoning. The "excused" distinction is captured for context and for future Band 2 logic to consume; it does not alter the deduction in Band 1.

**No fractional deductions.** Ever. Locked from F.5.

The deduction is applied atomically with the attendance write — either both succeed or both fail. If the student's `sessions_remaining` is already zero at the moment of marking, the mark is still written and the deduction ledger records a negative balance (`-1`). The student's enrolment is flagged as over-consumed and appears in the Admin's exception view (Band 1 shows this as a simple list screen; full remediation workflow is Band 2).

### 7.2.3 Absent zeros retained as flag

The "absent zero" — a zero-score treatment of missed work in averages — is a Band 2 progress-tracker concept. Band 1 does not compute it. However, Band 1 **does** retain the `status = Absent` flag on the attendance record for every absence, because Band 2 will need this data to exist retroactively when the progress tracker is built. The session state records this as a confirmed reversal from an earlier spec: absent flags stay on the record, they do not get collapsed into the deduction alone.

### 7.2.4 Cannot mark before the session day

Locked from F.8 and the session state. If the session's `start_at` date is in the future (tenant-local date comparison, not UTC), the attendance section of the session detail panel shows a disabled message: *"Attendance cannot be marked until the session day."* No Save button, no picker. This rule applies to everyone, with a single exception: an Admin or higher (Admin, HOD, Admin Head, Super Admin) can use a separate "Early mark" action that requires a logged reason. The mark still writes a deduction and transitions the session to Completed; the logged reason is visible on the session and the student profile activity feed.

### 7.2.5 Edit window

After a session is first marked, attendance can be edited. In Band 1 there is no fixed time window — edits are allowed indefinitely by Admin or higher, with every edit writing a new row to the activity log showing the old and new status. The 48-hour automatic lock is a Band 2 feature; in Band 1 the only lock is manual: Admin Head or above can "Lock session attendance" from the session detail panel, after which no further edits are allowed without an unlock.

Each edit writes an `attendance_edit_history` row with old status, new status, edited by, edited at, and reason (required for edits; not required for the first save).

### 7.2.6 Teacher workflow

A teacher logs in, lands on their simplified calendar (Item 6), sees their sessions for today, clicks into each, and marks attendance. The teacher's attendance action is the single most-used interaction in the platform. The screen must be fast, forgiving of small errors (easy to change a status before save), and usable on mobile screens since many teachers will mark attendance on a phone at the end of class.

### 7.2.7 Sessions-remaining exception view

When a deduction drives `sessions_remaining` to zero, the enrolment is considered depleted. When a deduction drives it below zero, the enrolment is over-consumed. Both states appear in an Admin screen at **Operations → Enrolments needing attention**, a filterable list showing: student, course, current balance, depleted/over-consumed, date reached. Admin can resolve by creating a new enrolment (Item 5) or by issuing a top-up invoice.

### 7.2.8 Permissions

- **Teacher, TA** — mark, edit their own session attendance (within the unlocked window).
- **Admin, HOD, Admin Head, Super Admin** — mark, edit, early-mark (with reason), lock/unlock sessions.
- **Academic Head** — read-only on attendance.
- **HR/Finance** — no access.

## 7.3 Data captured

| Entity | Key fields (Band 1) |
|---|---|
| `attendance_records` | id, tenant_id, session_id, student_id, status, notes, marked_by, marked_at, is_locked |
| `session_deduction_ledger` | id, tenant_id, enrolment_id, session_id, student_id, direction (debit/credit), units, resulting_balance, created_at |
| `attendance_edit_history` | id, attendance_record_id, old_status, new_status, edited_by, edited_at, reason |

## 7.4 Rules & behaviours

- All four statuses deduct 1 whole unit in Band 1. This is deliberate and temporary; Band 2 will introduce makeup logic.
- Deduction is atomic with the attendance write.
- Over-consumption (negative balance) is allowed to prevent blocking a teacher mid-class; resolution is an Admin workflow.
- Attendance cannot be marked before the session day unless an Admin uses the early-mark action with a logged reason.
- Marking the first attendance record on a session transitions the session status from `Scheduled` to `Completed`.
- Edits are unlimited in Band 1 except when the session is manually locked by Admin Head+.
- Every mark and every edit writes to the activity log (student-scoped and session-scoped) and to the audit log (tenant-scoped).

## 7.5 What it connects to

- **Feeds:** the student profile Attendance and Finance tabs in Item 4; the enrolment sessions-remaining field from Item 5.
- **Depends on:** Item 6 (sessions must exist), Item 5 (enrolment must exist), Item 4 (student must exist), Item 8 (teacher identity).

## 7.6 Out of scope for Band 1

- 48-hour auto-lock on attendance edits — Band 2.
- Makeup session allowance, expiry tracking, makeup creation from absence — Band 2.
- Concern Engine (auto-raising a concern after N consecutive absences) — Band 2.
- Automated parent notifications on absence — Band 2/3.
- Attendance rate analytics, patterns, trend reports — Band 2.
- Student self-check-in — Band 3.
- Biometric or QR-code attendance — not in roadmap.
- Bulk attendance import from external sources — Band 2.

## 7.7 UI specifics

Attendance marking is one of the two **mobile-first** screens in Band 1 (per F.10.8). On mobile: one student per full-width row, a 56px-tall status picker showing all 4 statuses as colour-coded buttons side by side (Present green, Late amber, Absent red, Excused grey), the active selection filled and the others outlined. Tap to select; tap again to clear. Bulk "Mark all present" sits at the top as a primary button, full width. Save is fixed to the bottom of the viewport with a halo so it never scrolls off. The notes "+" expands inline. On desktop, the same data renders as a denser table — student name and photo in the left columns, the four status buttons in a single row, notes inline. The "early mark" path opens the same screen but with a yellow banner across the top: "Marking before session day. Reason required to save." with a required reason input above the student list.


---

# Item 8 — Staff Profiles & Role Management

*References: M09 (core only — CPD, appraisals, observations, and off-boarding workflow are Band 2), PL-02. Eighth and final Band 1 item. Required before teachers can be assigned to sessions in Item 6 and before any operational user can log in.*

## 8.1 Purpose

Item 8 creates the people who run the centre. Every non-student user of the platform is a staff record linked to a user login linked to a role. Without Item 8 there are no teachers for Item 6 to schedule, no Admins for Item 4 to enrol students, and no approvers for the discount and refund gates in Item 5. Item 8 also closes the RBAC loop that Item 1 started: Item 1 authenticated users and checked their roles, but those roles had to come from somewhere. Here is where.

## 8.2 What the developer must build

### 8.2.1 Staff creation

Accessible from **People → Staff → New staff**. Super Admin or Admin Head can create. The form:

- **Full name** — first, middle (optional), last.
- **Personal email** — used for initial login credentials. Must be unique within the tenant.
- **Phone** — validated against international patterns.
- **Job title** — free text (e.g. "Primary Maths Teacher", "Head of Senior Science").
- **Department** — dropdown from Item 2. A staff member belongs to one primary department; cross-department work is handled via secondary role labels.
- **Branch** — dropdown from Item 2.
- **Start date** — date picker. Cannot be more than 90 days in the future.
- **End date** — optional, defaults to null. Setting an end date flags the staff record for off-boarding; the automated off-boarding chain (M09 notification chain) is Band 2, but the field exists in Band 1 so data is captured correctly.
- **Primary role** — dropdown from the 9 active Band 1 roles (Super Admin, Admin Head, Admin, Academic Head, HOD, Head of Subject, Teacher, TA, HR/Finance). Developer, Student, and Parent roles are not selectable here: Developer is assigned by Enrolla internal staff via a separate script; Student and Parent are Phase 2.
- **Secondary role labels** — multi-select of any other roles from the same list. Labels are additive permissions (see 8.2.3).
- **Create login account** — checkbox, default on. When on, a User row is created linked 1:1 to the Staff row and a welcome email is sent with a set-password link (same 48-hour token used in Item 1). When off, the Staff record exists without login access (useful for non-platform staff whose information still needs to be held).

On save, the Staff row is written; if `create_login = true`, the User row is also written atomically.

### 8.2.2 Primary role assignment

A staff member has exactly one primary role at any moment. The primary role determines:

- The landing page on login.
- The default data scope (branch for Admin, department for HOD, subject for Head of Subject, own-sessions for Teacher).
- Routing of approval gateway requests (discounts → Admin Head; refund stage 2 → Admin Head; refund stage 3 → Super Admin).
- Which notifications the user receives.

Changing a staff member's primary role (Super Admin only) writes to the audit log with old and new values, revokes all active sessions for that user within 60 seconds per Item 1, and re-routes any pending approval gateway requests that were addressed to the user's previous role.

### 8.2.3 Secondary role labels — additive permissions

Secondary labels add permissions; they never restrict. The staff member always operates at the highest scope their combined roles grant. Concrete example: a staff member whose primary role is HOD (scope: own department) with a secondary label of Teacher will see their department's full data AND their own session list in the teacher view. Removing the HOD primary and keeping only the Teacher primary would reduce them to own-sessions only.

**Label removal re-routes pending requests.** When a secondary label is removed from a staff member, any pending approval gateway request currently addressed to that label's scope is re-routed to the tenant's Admin Head. If the tenant has no active Admin Head, it falls back to the Super Admin. If there is no active Super Admin, the request is held in a "Needs manual re-routing" queue visible to Developer role users. This is the fallback chain locked from the session state.

### 8.2.4 Deactivation vs archival

A staff member leaves the centre in two possible ways:

- **Deactivate.** Sets `active = false` on the User row. Login is blocked immediately; all active sessions are revoked within 60 seconds. The Staff row remains in place. Historical data (sessions taught, approvals granted, audit entries) is preserved unchanged. **Future scheduled sessions still referencing this teacher are flagged on the calendar with a red "Teacher inactive — reassign" badge, and attendance marking on those sessions is hard-blocked until an Admin reassigns the teacher to an active staff member.** A deactivated staff member can be reactivated by Super Admin.
- **Archive.** Stronger action. Hides the Staff record from all pickers and lists (except when explicitly filtered "include archived"). Used when a staff member has fully off-boarded and will not return. Archival requires deactivation first. Archived records are never hard-deleted.

Neither action removes historical references — a session taught by a now-archived teacher still shows that teacher's name on the historical record.

### 8.2.5 Staff list screen

**People → Staff**. A paginated list with columns: full name, job title, primary role, secondary labels (chips), department, branch, start date, active flag. Filters: department, branch, primary role, active status. Search by name. Click-through opens the staff profile.

### 8.2.6 Staff profile

A simpler read view than the student profile. Tabs:

- **Overview** — name, contact details, job title, department, branch, start date, end date, primary role, secondary labels, active status, login enabled flag.
- **Assignments** — list of sessions this teacher is scheduled to deliver in the current and next month (read-only view into Item 6).
- **Activity** — chronological feed of significant events on this staff record (role changes, deactivation, password resets triggered by Super Admin, etc.).

The profile does not include CPD, appraisals, observations, performance flags, or off-boarding workflow UI — all Band 2.

### 8.2.7 Developer role — excluded from assignment

The Developer role cannot be assigned through the Staff screen. It exists only at the platform level and is assigned by Enrolla internal operators via a separate provisioning script. Developer users are visible in the staff list when present but their row shows "Platform access — not managed by this tenant". They are excluded from every routing, notification, and approval chain per F.3 and the session state.

### 8.2.8 Fields explicitly excluded from Band 1

Per the session state: **DBS check fields, police clearance fields, and any similar background-check document storage are fully removed from staff records.** This is a locked decision. Do not add these fields, do not add placeholder screens for them, do not reference them in the data model. If a tenant later needs background-check tracking, it will be added via the general document upload feature in Band 2.

### 8.2.9 Permissions

- **Super Admin** — full create, edit, deactivate, archive, role change, secondary label management, password reset trigger, MFA reset.
- **Admin Head** — create and edit Admins, Teachers, TAs, Academic staff. Cannot create or edit Super Admins, HR/Finance, or other Admin Heads. Can deactivate but not archive.
- **HR/Finance** — read staff list and profile; no create or edit.
- **Admin, Teacher, TA, Academic staff** — read-only list; no access to role or secondary label management.

## 8.3 Data captured

| Entity | Key fields (Band 1) |
|---|---|
| `staff` | id, tenant_id, first_name, middle_name, last_name, personal_email, phone, job_title, department_id, branch_id, start_date, end_date, primary_role, secondary_role_labels (array), active, archived_at, user_id, created_at |
| `role_change_history` | id, tenant_id, staff_id, change_type (primary / secondary_add / secondary_remove), old_value, new_value, changed_by, changed_at, reason |
| `approval_routing_fallback` | id, tenant_id, original_approval_id, original_role, fallback_role, fallback_user_id, reason, rerouted_at |

## 8.4 Rules & behaviours

- A staff record is 1:1 with a User row when login access is enabled. The two rows share no keys beyond the FK.
- Changing primary role revokes active sessions within 60 seconds.
- Removing a secondary label re-routes any pending approval requests that depended on it, following the locked fallback chain.
- Deactivation blocks login immediately but preserves all historical references.
- Archival is a stronger form of deactivation and requires deactivation first.
- DBS / police clearance fields are permanently out of scope.
- The Developer role is never assignable from the Staff screen.
- Every role change, deactivation, archival, reactivation, and MFA reset writes to both the activity log (staff-scoped) and the audit log (tenant-scoped).
- Attempting to delete a Staff record is blocked; only deactivation and archival are available paths.

## 8.5 What it connects to

- **Feeds:** Item 1 (the User row created here is what Item 1 authenticates), Item 6 (Teacher role or secondary label is the pool the scheduling teacher picker reads from), Item 5 and Item 7 (approval gateway routing depends on primary role and secondary labels), Item 4 (audit trail on student and guardian records resolves `created_by` to staff).
- **Depends on:** Item 1 (auth is the prerequisite for login creation), Item 2 (departments and branches must exist to assign staff to them).

## 8.6 Out of scope for Band 1

- CPD logging, logged entries, verification states — Band 2.
- Appraisal cycles, performance reviews, rating scales — Band 2.
- Classroom observation records — Band 2.
- Performance flags, improvement plans — Band 2.
- The full off-boarding notification chain (HOD immediate → Admin Head T-7 → guardians T-3 → access revoke last day) — Band 2. Band 1 captures `end_date` only.
- Emergency Leave and similar tenant-level operational states — Band 2.
- Secondary role label cap enforcement beyond what is described here — Band 2.
- Zoho People sync — Band 3.
- DBS / police clearance — permanently removed, never planned.
- Self-service staff profile editing (staff changing their own phone, email) — Band 2.

## 8.7 UI specifics

The staff list uses the **List screen archetype** with primary role as a coloured chip in its own column (each role has its own chip colour drawn from the palette — Super Admin in royal blue, Admin Head in interactive blue, Admin in tertiary blue, Teacher in success green, etc., never status colours). Secondary labels appear as smaller outline chips next to the primary chip. The staff profile is a 3-tab **Detail screen** — narrower than the student profile because it has fewer tabs. The role assignment dropdown on the create/edit form shows each role's name, a one-line description, and a count of how many staff currently hold it (helps Super Admin avoid over-assigning Admin Head). Secondary label management is a multi-select tag input, not a checkbox list. Deactivation is a destructive-confirm modal explicitly listing the consequences ("Login blocked. Active sessions revoked within 60 seconds. Future sessions flagged for reassignment.").


---

# Band 1 — Closing Section

## C.1 Cross-item dependency map

Band 1 is built in strict numerical order because every item depends only on items that come before it. There are no forward references and no circular dependencies.

```
Item 1 (Auth & Multi-Tenant)
    │
    └── Item 2 (Tenant Settings & Onboarding Wizard)
            │
            ├── Item 3 (Catalogue & Pricing)
            │       │
            │       └── ─────────────────┐
            │                            │
            ├── Item 4 (Students & Guardians)
            │       │                    │
            │       └── ────────────┐    │
            │                       │    │
            ├── Item 8 (Staff & Roles)   │
            │       │               │    │
            │       └─────┐         │    │
            │             ▼         ▼    ▼
            │       Item 6 (Scheduling) ← reads courses, students, teachers
            │             │
            │             ▼
            │       Item 7 (Attendance) ← reads sessions, students, enrolments
            │             ▲
            │             │
            └───→ Item 5 (Enrolment & Invoicing) ← reads courses, students, guardians
                        │
                        └── provides enrolment rows Item 7 deducts from
```

In plain English:

- **Item 1** is the root. Nothing else runs without it.
- **Item 2** configures the tenant so that everything built later has somewhere to live.
- **Item 3** defines what the centre teaches and for how much — must exist before enrolment or scheduling can reference real courses.
- **Item 4** creates the people being taught — must exist before enrolment or scheduling can attach real humans.
- **Item 8** creates the people doing the teaching and running the centre — must exist before sessions have real teachers and before approval gateways in Item 5 have real approvers.
- **Item 5** binds a student to a course and generates the commercial record — must exist before Item 7 has an enrolment to deduct from.
- **Item 6** plans the sessions — must exist before Item 7 has sessions to mark.
- **Item 7** closes the loop — turns scheduled sessions into attended facts and decrements the balances Item 5 set up.

## C.2 Build sequence checklist

Use this as a linear go/no-go gate. Do not start item N+1 until item N passes its definition of done.

| # | Item | Definition of done (one testable sentence) |
|---|---|---|
| 1 | Multi-tenant foundation & authentication | A second tenant provisioned on the same instance cannot see any data from the first, verified by automated test and manual attempt; a user with mandatory MFA can log in end-to-end; a failed-login lockout fires at 5 attempts. |
| 2 | Tenant settings & onboarding wizard | A freshly-provisioned tenant with no existing data can be walked through all 7 wizard steps, and on completion can navigate to any post-wizard Settings section without error. |
| 3 | Academic catalogue & pricing | A Super Admin can create the full IMI pricing matrix (Primary per-year-group, Primary Science conditional, Secondary frequency tiers, CAT4, trial pricing) and every rate edit writes to `rate_history` with an effective date. |
| 4 | Students & guardians | A new student can be created with a linked primary-contact guardian, the 5-tab profile renders without error, DNC can be set and a contact attempt shows the warning interstitial, and a two-record merge can be rolled back within 24 hours unless financial activity intervened. |
| 5 | Enrolment & invoicing | A student can be enrolled in 20 sessions of Primary Maths Y5 with a 10% discount, the invoice calculates to AED 3,717.00, discount approval is captured and processed, a cash payment of AED 3,717.00 flips the invoice to Paid, and a refund cannot bypass the three-stage chain. |
| 6 | Scheduling | A weekly recurring session can be created for 12 weeks forward, skipping holidays; a room double-booking is hard-blocked; a teacher double-booking shows a warning and saves anyway; an outside-operating-hours session warns but saves. |
| 7 | Attendance | A teacher can mark a session present/absent/late/excused for all attached students; each mark deducts 1 whole unit atomically; attempting to mark before the session day is blocked; the Admin early-mark path captures a reason; editing a mark writes an edit history row. |
| 8 | Staff & roles | A Staff record can be created with a primary role and secondary labels, a linked User row is provisioned with a welcome email, changing the primary role revokes active sessions within 60 seconds, and removing a secondary label re-routes pending approvals following the fallback chain. |

## C.3 Definition of done — Band 1 as a whole

Band 1 is complete when the following end-to-end scenario runs cleanly on a freshly-provisioned tenant with no manual database intervention at any step, executed by a single Super Admin working only through the web UI:

1. The tenant is provisioned with DPA timestamp set.
2. The Super Admin receives the welcome email, clicks the set-password link, sets a password, enrols MFA, and logs in.
3. The onboarding wizard is walked end-to-end: organisation basics, one branch, three departments (Primary / Lower Sec / Senior), three rooms, financial settings with AED and 5% VAT and enrolment fee AED 300, calendar rules with Monday start and Sunday flagged non-working, one holiday range, and an academic year spanning the current calendar year.
4. A staff member is created with primary role Teacher, department Primary, and a login account; the welcome email is sent.
5. A second staff member is created with primary role Admin Head for approval routing.
6. The Primary Maths Y5 course is created in the catalogue at AED 180 per session, 60 minutes, Group delivery.
7. A student is created (Y5, Primary, linked to a primary-contact guardian who is also the financial payer).
8. The student is enrolled in 20 sessions of Primary Maths Y5 with a 10% discount; the discount triggers the Admin Head approval gate; Admin Head approves; the invoice issues at AED 3,717.00.
9. A cash payment of AED 3,717.00 is recorded; the invoice flips to Paid.
10. A weekly recurring session is scheduled for Primary Maths Y5 with the Teacher created in step 4, in one of the rooms created in step 3, starting next Monday at 16:00 for 8 weeks; the student from step 7 is attached.
11. On the first session date (or via Admin early-mark with a reason), the Teacher logs in, marks the student Present, and the student's `sessions_remaining` decrements from 20 to 19.
12. The Admin Head runs a CSV export of invoices and of students; both files open cleanly and contain the expected rows.

If all twelve steps pass without touching the database directly, and without any item in section 8 of any Band 1 item being accidentally exposed in the UI, Band 1 is done.

## C.4 Consolidated out-of-scope — pointer to Band 2

Every item has its own section 6 listing what is out of scope. Consolidated for easy cross-reference, the big Band 2 themes that are explicitly deferred are:

- **Lead pipeline, DNC auto-triggering, referral tracking** — Item 9 in Band 2.
- **Assessment & placement bookings** — Item 10.
- **Makeups, the Concern Engine, the 48-hour attendance edit lock, automated absence notifications** — Item 11 (and deferred from Items 6, 7).
- **Per-class feedback, NPS surveys, complaints, AI feedback summaries** — Item 12.
- **Progress tracking, predicted grades, AI reports, Academic Alert System, absent-zero computation** — Item 14 (flag retained in Band 1 from Item 7).
- **Assignment library, Quick Score Entry** — Item 15.
- **Task management, kanban, recurring tasks** — Item 16.
- **Management dashboard, KPIs, churn score, retention score, occupancy heatmap, reports inbox** — Item 17 (shell visible from Item 2 nav, non-editable).
- **People forms, form builder, document expiry, segment builder, bulk exports beyond Band 1's CSV** — Item 18.
- **CPD logging, appraisals, classroom observations, performance flags, full off-boarding notification chain** — Item 19 (deferred from Item 8).
- **CSV import, field mapping interface, migration wizard** — Item 20 (Band 1 uses direct database seed).

And the Band 3 themes explicitly deferred:

- **Automation engine, template library, marketing tab, full notification catalogue** — Items 21–22.
- **Inventory module** — Item 23 (currently blocked on supplier contacts).
- **Payment gateways (Telr, Network International, Stripe)** — Item 24.
- **WhatsApp BSP integration** — Item 25. Band 1 uses copy-paste fallback for all outbound messaging.
- **Zoho Books & Zoho People API sync** — Item 26. Band 1 uses manual CSV export.
- **Parent portal, student portal** — Item 27.
- **Platform admin panel with subscription management, feature flags, DPA version management** — Item 28.

## C.5 Handoff notes to the developer

**Test tenant isolation before anything else.** The single most serious failure mode of this platform is cross-tenant data leakage. Before building any UI screen, provision two test tenants and write automated tests that attempt cross-tenant reads and writes through every available path (URL parameter injection, request body injection, JWT manipulation, direct database query without the tenant filter). Every test must return 403 with a `tenant_isolation_violation` audit entry. Do this first and run it on every commit.

**Audit log coverage must be total.** It is easier to audit-log everything from the start than to retrofit coverage later. Every write operation on every tenant-scoped entity must write an audit row. A weekly review of audit coverage gaps during Band 1 development will save a lot of pain during IMI go-live preparation.

**Backup restore rehearsal is a go-live gate.** Before IMI is loaded onto the platform, a full backup must be taken, the production database must be wiped, and the backup must be restored cleanly. After restore, run an integrity check: audit log `id` sequences must have no gaps, every `tenant_id` filter must still apply correctly, every foreign key in `enrolments`, `invoices`, `payments`, and `attendance_records` must resolve. If this rehearsal fails or is skipped, go-live is blocked. Non-negotiable.

**IMI data loads via direct database seed in Band 1.** The full CSV import tool is Band 2. For Band 1 testing and for IMI go-live, existing IMI data (students, guardians, active enrolments, staff, open invoices) will be loaded via a one-off seed script that you or I will write against the finalised Band 1 schema. The session state records that 358 active students have no Batch data in the Classcard export; those students will need a manual enrolment entry step during the seed, which the seed script must support.

**Raise product questions early.** If any section of this document is ambiguous or appears to conflict with another section, stop and ask rather than guessing. The 31 reference module specifications exist for deeper context but are not authoritative over this Band 1 document — if a reference module says something Band 1 does not, Band 1 wins and the reference module is Band 2 territory. If a reference module and Band 1 disagree on a Band 1 topic, flag it and I will resolve.

**What success looks like.** When Band 1 is done, IMI's receptionist can book an enrolment, IMI's accountant can record payment, IMI's operations coordinator can schedule the week's sessions, and IMI's teachers can mark attendance — all without opening Classcard, ClickUp, or Zoho Forms. If any of those four human workflows still need a legacy tool to complete, Band 1 has a gap. Find and close it before declaring done.

---

*End of Enrolla Band 1 PRD. Next document: Enrolla Band 2 PRD — operational layer, 12 items, covers full usable centre management. Begin only after Band 1 passes every gate in section C.2 and the end-to-end scenario in section C.3 runs cleanly.*
