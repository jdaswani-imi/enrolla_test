# Enrolla — Lead Workflow Handover

> **Audience:** Developers, product managers, or QA engineers picking up the lead pipeline for the first time.  
> **Prototype note:** All data is mocked in-memory. No backend exists.  
> **Last updated:** 2026-04-23

---

## Table of Contents

1. [Overview](#1-overview)
2. [Data Model](#2-data-model)
3. [Pipeline Stages](#3-pipeline-stages)
4. [Lead List Page](#4-lead-list-page)
5. [Journey State Machine](#5-journey-state-machine)
6. [Journey Dialog Catalog](#6-journey-dialog-catalog)
7. [Role-Based Access Control](#7-role-based-access-control)
8. [Won → Student Conversion Flow](#8-won--student-conversion-flow)
9. [Automations & Side-Effects](#9-automations--side-effects)
10. [Key File Map](#10-key-file-map)
11. [Design Patterns & Conventions](#11-design-patterns--conventions)

---

## 1. Overview

The **Lead pipeline** is the primary sales and admissions funnel for IMI. It tracks prospective students from initial enquiry through diagnostic assessment, trial session, schedule confirmation, invoicing, and final conversion to an enrolled student.

The pipeline is implemented as a **Kanban board** (`app/leads/page.tsx`) backed by a **React context-based state machine** (`lib/journey-store.tsx`). Each pipeline action is driven by a dedicated **dialog component** in `components/journey/`.

**End-to-end flow in brief:**

```
New → Contacted → Assessment Booked → Assessment Done
   → Trial Booked → Trial Done → Schedule Offered
   → Schedule Confirmed → Invoice Sent → Won → [Student Created]
```

Lost is a terminal side-branch reachable from any stage.

---

## 2. Data Model

**Source:** [lib/mock-data.ts](lib/mock-data.ts) — lines 1060–1132

### `Lead` interface

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | e.g. `"L-0041"` |
| `ref` | `string` | Display ref e.g. `"IMI-L-0041"` |
| `childName` | `string` | Prospective student name |
| `yearGroup` | `string` | `Y1`–`Y13`, `KG1`, `KG2` |
| `department` | `string` | Auto-derived: Primary / Lower Secondary / Senior |
| `subjects` | `string[]` | e.g. `["Maths", "English"]` |
| `guardian` | `string` | Primary guardian name |
| `guardianPhone` | `string` | Phone number |
| `source` | `LeadSource` | `"Website"` \| `"Phone"` \| `"Walk-in"` \| `"Referral"` \| `"Event"` |
| `stage` | `LeadStage` | Current pipeline stage (see §3) |
| `assignedTo` | `string` | Staff member name |
| `lastActivity` | `string` | Human-readable e.g. `"Today"`, `"2 days ago"` |
| `daysInStage` | `number` | Days in current stage |
| `daysInPipeline` | `number` | Total pipeline age |
| `dnc` | `boolean` | Do Not Contact flag |
| `sibling` | `boolean` | Has sibling currently enrolled |
| `stageMessagePending` | `boolean` | Follow-up reminder flag |
| `preferredDays` | `string[]` | Optional preferred weekdays |
| `preferredWindow` | `PreferredWindow` | `"Morning"` \| `"Afternoon"` \| `"Evening"` \| `"Any"` |
| `createdOn` | `string` | ISO date string |
| `lostReason` | `string?` | Populated when stage = Lost |
| `lostNotes` | `string?` | Additional lost context |
| `reEngage` | `boolean?` | Eligible for re-engagement |
| `reEngageAfter` | `string?` | Date to re-engage |
| `status` | `string?` | `"active"` \| `"converted"` \| `"lost"` \| `"archived"` |
| `convertedStudentId` | `string?` | Student ID after conversion e.g. `"IMI-0099"` |
| `convertedOn` | `string?` | Conversion date |

### Seed data

22 leads are seeded across all stages. The **Bilal Mahmood** lead (`id: "L-0041"`) is the primary demo lead used to showcase the full journey in the prototype.

---

## 3. Pipeline Stages

```typescript
// lib/mock-data.ts
export type LeadStage =
  | "New"
  | "Contacted"
  | "Assessment Booked"
  | "Assessment Done"
  | "Trial Booked"
  | "Trial Done"
  | "Schedule Offered"
  | "Schedule Confirmed"
  | "Invoice Sent"
  | "Won"
  | "Lost"
```

### Stage lifecycle

| Stage | Entry Action | Typical Duration | Unlocks |
|---|---|---|---|
| **New** | Lead created (form / manual) | 1–2 days | Contact parent |
| **Contacted** | First outreach logged | 3–5 days | Book Assessment or Book Trial |
| **Assessment Booked** | `bookAssessment()` | 1–2 days | Log Assessment Outcome |
| **Assessment Done** | `logAssessmentOutcome()` | 1–3 days | Book Trial or offer Schedule |
| **Trial Booked** | `bookTrial()` | 1 day | Log Trial Outcome |
| **Trial Done** | `logTrialOutcome()` | 1–2 days | Schedule Offer |
| **Schedule Offered** | `markScheduleOffered()` | 3–7 days | Schedule Confirm |
| **Schedule Confirmed** | `markScheduleConfirmed()` | 1–2 days | Send Invoice |
| **Invoice Sent** | `sendInvoice()` | 7–14 days | Record Payment |
| **Won** | Full payment received | Terminal | Convert to Student |
| **Lost** | `setStage("Lost")` | Terminal | Re-engagement (optional) |

> **Skips allowed:** Trial can be skipped (Assessment Done → Schedule Offered). Assessment can also be skipped (Contacted → Trial Booked) with a confirmation warning.

---

## 4. Lead List Page

**Source:** [app/leads/page.tsx](app/leads/page.tsx)

### Layout

The page renders a **horizontal Kanban board** with one column per `LeadStage`. Each column shows a card count and a scrollable list of lead cards.

### Filter bar

| Control | Purpose |
|---|---|
| Text search | Filter by child name |
| Date range picker | Filter by `createdOn` |
| Stage multi-select | Show subset of stages |
| Source multi-select | Filter by `LeadSource` |
| Department multi-select | Primary / Lower Sec / Senior |
| Assigned Staff | Filter by `assignedTo` |
| Save Segment | Save current filter as a named segment |
| Export | Download filtered results (gated: `can('export')`) |

### Kanban card

Each card displays:

- Child name + DNC badge + Sibling badge
- Source badge (colour-coded by source type)
- Year group · Subjects
- Guardian name
- **Lost cards only:** Lost reason + re-engagement eligibility
- Assignee avatar, last activity timestamp, days in stage
- **Won cards:** "Convert to Student" CTA button (gated — see §7)

### Card action menu (⋯)

| Action | Permission gate |
|---|---|
| View Detail | `leads.view` |
| Edit Lead | `leads.edit` |
| Move Stage | `leads.advancePipeline` |
| Book Assessment | `leads.advancePipeline` |
| Book Trial Session | `leads.advancePipeline` |
| Convert to Student | `leads.convertToStudent` + `stage="Won"` |
| Mark as Lost | `delete.records` |
| Archive | `delete.records` |

### Lead detail dialog

Opens on card click. Contains:

- **Journey status pills** — Assessment, Trial, Student, Enrolment, Invoice (colour reflects completion state)
- **Timeline / Activity log** — append-only list of all mutations for this lead
- **Team Chat** — staff-only internal chat with @mentions, emoji reactions, record linking, and task creation
- **Footer action bar** — context-aware primary action button for the current stage

---

## 5. Journey State Machine

**Source:** [lib/journey-store.tsx](lib/journey-store.tsx)

The journey store is a React context (`JourneyProvider`) mounted in the root layout. It wraps all page-level lead state and exposes typed mutations via `useJourney()`.

### Core state shape

```typescript
interface JourneyState {
  bilalStage: BilalStage;          // Granular sub-stage for demo lead
  leadStage: LeadStage;            // Current LeadStage
  assessment: JourneyAssessment | null;
  trial: JourneyTrial | null;
  student: JourneyStudent | null;
  enrolment: JourneyEnrolment | null;
  invoice: JourneyInvoice | null;
  activity: ActivityEntry[];        // Immutable audit log (LIFO)
  scheduleByLead: Record<string, ScheduleData>;
  invoiceByLead: Record<string, InvoiceBuilderData>;
  paymentByLead: Record<string, PaymentData>;
}
```

`scheduleByLead`, `invoiceByLead`, and `paymentByLead` are keyed by `lead.id`, allowing multiple leads to be in-flight simultaneously.

### Mutations

| Method | Resulting stage | Description |
|---|---|---|
| `bookAssessment(input)` | Assessment Booked | Schedules diagnostic; auto-creates teacher task |
| `logAssessmentOutcome(input)` | Assessment Done | Records observed level, target grade, recommendation |
| `revertAssessmentOutcome()` | Assessment Booked | Undoes outcome, preserves booking |
| `bookTrial(input)` | Trial Booked | Schedules trial; auto-computes trial fee |
| `logTrialOutcome(input)` | Trial Done | Records result + fee payment status |
| `skipTrial()` | — | Flags trial as skipped, no stage change |
| `markScheduleOffered()` | Schedule Offered | Marks schedule as proposed to parent |
| `markScheduleConfirmed()` | Schedule Confirmed | Records parent confirmation |
| `sendInvoice()` | Invoice Sent | Issues invoice |
| `markPaid()` | Won | Marks payment received |
| `convertToStudent(input)` | Student Created | Creates `JourneyStudent` record |
| `createEnrolment(input)` | Enrolment Pending | Links enrolment to new student |
| `recordPayment(input)` | Student Active | Records full payment; closes journey |
| `setStage(stage, actor?)` | (any) | Generic transition with activity log entry |
| `undoConvertToStudent(prev)` | (restored) | Rolls back conversion + deletes student record |
| `setSchedule(leadId, data)` | — | Stores schedule keyed by leadId |
| `confirmSchedule(leadId, patch)` | — | Updates schedule with confirmation detail |
| `setInvoice(leadId, data)` | — | Stores invoice keyed by leadId |
| `setPayment(leadId, data)` | — | Stores payment keyed by leadId |

### Activity log entries

Every mutation prepends an `ActivityEntry` to `state.activity`:

```typescript
interface ActivityEntry {
  label: string;  // "Just now" | "Today" | "17 Apr"
  text: string;   // e.g. "Assessment booked — Y7 Maths, 19 Apr 10:00, Ahmed Khalil"
  dot: string;    // Tailwind bg colour class
}
```

### Business constants

| Constant | Value |
|---|---|
| `TERM_WEEKS` | 12 |
| `ENROLMENT_FEE` | 300 AED |
| `VAT_RATE` | 0.05 (5%) |
| `MIN_SESSIONS_PER_SUBJECT` | 10 |

### Helper functions

| Function | Purpose |
|---|---|
| `departmentFor(yearGroup)` | Maps year group to department string |
| `trialRateFor(department)` | Primary 250 / Lower Sec 300 / Senior 350 AED |
| `sessionRateFor(dept, sessionsPerWeek)` | Tiered per-session rate (Entry / Mid / Frequent) |
| `formatDate(iso)` | `"2026-04-19"` → `"19 Apr 2026"` |
| `nextSaturdayIso()` | Returns next Saturday as ISO date |

---

## 6. Journey Dialog Catalog

**Source:** [components/journey/](components/journey/) — 18 files

### Dialog reference

| Dialog | File | Purpose |
|---|---|---|
| **Book Assessment** | `book-assessment-dialog.tsx` | Schedule diagnostic test with smart slot finder, teacher pool, room assignment |
| **Log Assessment Outcome** | `log-assessment-outcome-dialog.tsx` | Record recommendation, observed level, target grade, notes |
| **Book Trial** | `book-trial-dialog.tsx` | Schedule trial session; auto-computes trial fee + VAT |
| **Log Trial Outcome** | `log-trial-outcome-dialog.tsx` | Record Accept/Decline outcome + fee payment status |
| **Skip Assessment** | `skip-assessment-dialog.tsx` | Confirm bypass of diagnostic step |
| **Trial Skip Prompt** | `trial-skip-prompt-dialog.tsx` | Confirm skip of trial → proceed to schedule |
| **Needs More Time** | `needs-more-time-dialog.tsx` | Pause lead in current stage with reason + follow-up date |
| **Schedule Offer** | `schedule-offer-dialog.tsx` | Build proposed timetable (subject, days, time, teacher, sessions/week); WhatsApp send toggle |
| **Schedule Confirm** | `schedule-confirm-dialog.tsx` | Log confirmation method (Email / Phone / WhatsApp), date, notes |
| **Invoice Builder** | `invoice-builder-dialog.tsx` | Build invoice with line items, discount (% or AED), payment plan option, VAT, due date, revenue tag |
| **Record Payment** | `record-payment-dialog.tsx` | Log payment (amount, method, reference, date); full payment triggers auto-conversion |
| **Convert to Student** | `convert-to-student-dialog.tsx` | 3-step wizard: confirm details → enrolment info → review & create |
| **Create Enrolment** | `create-enrolment-dialog.tsx` | Link subject, term, teacher, sessions, rate, fees to new student |
| **Skip Warning** | `skip-warning-dialog.tsx` | Generic configurable skip-confirmation prompt |
| **Dialog Parts** | `dialog-parts.tsx` | Shared UI primitives: `FIELD`, `FieldLabel`, `FormActions` |

### Smart Scheduler (Book Assessment dialog)

The scheduler in `book-assessment-dialog.tsx` runs a constraint-solving algorithm:

1. Reads `lead.preferredDays` and `lead.preferredWindow`
2. Checks each candidate teacher's mock availability blocks
3. Cascades start times in 15-minute increments per additional subject
4. Suggests the first valid slot, or falls back to the next available window
5. Auto-assigns available teachers filtered by department

### WhatsApp integration

Schedule Offer and Invoice Builder both generate an SMS-style message template that staff can copy-paste into WhatsApp. A "Send via WhatsApp" toggle logs a `sentVia: "WhatsApp"` entry to the activity stream.

---

## 7. Role-Based Access Control

**Source:** [lib/role-config.ts](lib/role-config.ts)

### Lead permissions matrix

| Permission | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `leads.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `leads.create` | ✓ | ✓ | ✓ | | | | | |
| `leads.edit` | ✓ | ✓ | ✓ | | | | | |
| `leads.delete` | ✓ | ✓ | | | | | | |
| `leads.convert` | ✓ | ✓ | ✓ | | | | | |
| `leads.assignStaff` | ✓ | ✓ | ✓ | | | | | |
| `leads.advancePipeline` | ✓ | ✓ | ✓ | | | | | ✓ |
| `leads.advanceBeyondScheduled` | ✓ | ✓ | ✓ | ✓ | ✓ | | | ✓ |
| `leads.convertToStudent` | ✓ | ✓ | ✓ | ✓ | ✓ | | | ✓ |

### Navigation gate

The Leads nav item in the sidebar is visible when `canAccess(role, "leads")` returns true, which requires `leads.view`.

### Key page-level gates

| Gate | Condition |
|---|---|
| Export button | `can('export')` |
| Mark as Lost / Archive | `can('delete.records')` |
| Convert to Student button (Won card) | `stage="Won"` AND `status !== "converted"` AND `can('leads.convertToStudent')` |
| Proceed to Invoice after Schedule Confirmed | `can('leads.advanceBeyondScheduled')` — otherwise shows "speak to Admin or Admin Head" warning |

---

## 8. Won → Student Conversion Flow

Conversion happens via two entry points.

### Path A — Auto-convert on full payment

**Source:** [components/journey/record-payment-dialog.tsx](components/journey/record-payment-dialog.tsx) — lines 100–173

1. Staff records a payment where `amount >= totalDue` on an "Invoice Sent" lead
2. Dialog calls `onAutoConvert(lead, { amount, method })` back to the page
3. Page checks `can('leads.convertToStudent')`, then calls `journey.convertToStudent(input)` with details pre-filled from the lead record
4. Student record created with ID `"IMI-0099"` (Bilal demo) or generated ID
5. Lead `stage` stays `"Won"`, `bilalStage` advances to `"Student Created"`
6. Toast shown: **"Payment recorded · Lead converted to Won"** with an **Undo** button
   - Undo reverts payment, deletes student record, restores lead to `"Invoice Sent"`

### Path B — Manual conversion button

**Source:** [app/leads/page.tsx](app/leads/page.tsx) — Kanban card CTA and footer action bar

1. Visible when `stage="Won"` AND `status !== "converted"` AND `can('leads.convertToStudent')`
2. Opens `ConvertToStudentDialog` (3-step wizard):
   - **Step 1:** Confirm student details (firstName, lastName, yearGroup, guardianName, guardianPhone)
   - **Step 2:** Enrolment info (DOB, school name, emergency contact, parental consent checkboxes, medical notes)
   - **Step 3:** Review all details and confirm
3. On submit: calls `journey.convertToStudent(input)`, creates student, logs activity entry

### Post-conversion state

```typescript
// Journey store state after conversion
{
  bilalStage: "Student Created",
  student: {
    id: "IMI-0099",
    name: "Bilal Mahmood",
    yearGroup: "Y7",
    department: "Lower Secondary",
    status: "Pending",   // → "Active" once enrolment payment is recorded
    createdOn: "2026-04-23",
    ...
  }
}

// Lead record in mock-data (for already-converted seed leads)
{
  status: "converted",
  convertedStudentId: "IMI-0021",
  convertedOn: "10 Mar 2026"
}
```

### After conversion — remaining steps

1. **Create Enrolment** (`create-enrolment-dialog.tsx`) — links subject, term, teacher, session frequency, and rates
2. **Record Payment** (`record-payment-dialog.tsx`) — final enrolment payment transitions `student.status` to `"Active"` and `bilalStage` to `"Student Active"`

---

## 9. Automations & Side-Effects

These are implicit side-effects triggered by mutations in the journey store or dialog submit handlers — not configured automations.

| Trigger | Side-effect |
|---|---|
| `bookAssessment()` | Auto-creates a task per teacher: "Log assessment outcome — [Student] · [Subject]", Priority: High, Due: assessment date |
| `logAssessmentOutcome()` | Recommendation text drives the suggested next step in the footer action bar |
| `bookTrial()` | Auto-computes trial fee via `trialRateFor(department)` |
| Full payment recorded | Auto-triggers `convertToStudent()` if `can('leads.convertToStudent')` |
| `convertToStudent()` | Creates student record; lead `status` → `"converted"` |
| Any stage transition | Prepends entry to `activity[]` with timestamp label + description |
| Schedule offer with WhatsApp toggle | Logs `sentVia: "WhatsApp"` in activity stream |

---

## 10. Key File Map

| File | Purpose |
|---|---|
| [lib/mock-data.ts](lib/mock-data.ts) | Lead data model (`Lead`, `LeadStage`), 22 seed leads |
| [lib/journey-store.tsx](lib/journey-store.tsx) | Journey state machine, all mutations, activity log, helpers |
| [lib/role-config.ts](lib/role-config.ts) | `PERMISSIONS` matrix, `canDo()`, `canAccess()` |
| [lib/use-permission.ts](lib/use-permission.ts) | `usePermission()` hook — use this in components |
| [app/leads/page.tsx](app/leads/page.tsx) | Kanban board, lead detail dialog, all action wiring |
| [components/journey/book-assessment-dialog.tsx](components/journey/book-assessment-dialog.tsx) | Book Assessment + smart scheduler |
| [components/journey/log-assessment-outcome-dialog.tsx](components/journey/log-assessment-outcome-dialog.tsx) | Assessment outcome form |
| [components/journey/book-trial-dialog.tsx](components/journey/book-trial-dialog.tsx) | Book Trial + fee calculation |
| [components/journey/log-trial-outcome-dialog.tsx](components/journey/log-trial-outcome-dialog.tsx) | Trial outcome form |
| [components/journey/schedule-offer-dialog.tsx](components/journey/schedule-offer-dialog.tsx) | Schedule builder + WhatsApp send |
| [components/journey/schedule-confirm-dialog.tsx](components/journey/schedule-confirm-dialog.tsx) | Schedule confirmation |
| [components/journey/invoice-builder-dialog.tsx](components/journey/invoice-builder-dialog.tsx) | Invoice builder with VAT + payment plan |
| [components/journey/record-payment-dialog.tsx](components/journey/record-payment-dialog.tsx) | Payment recording + auto-conversion trigger |
| [components/journey/convert-to-student-dialog.tsx](components/journey/convert-to-student-dialog.tsx) | 3-step conversion wizard |
| [components/journey/create-enrolment-dialog.tsx](components/journey/create-enrolment-dialog.tsx) | Enrolment record creation |
| [components/journey/needs-more-time-dialog.tsx](components/journey/needs-more-time-dialog.tsx) | Pause lead in stage |
| [components/journey/dialog-parts.tsx](components/journey/dialog-parts.tsx) | Shared form primitives |

---

## 11. Design Patterns & Conventions

### Demo lead (Bilal)

`BILAL_LEAD_ID = "L-0041"` and `BILAL_STUDENT_ID = "IMI-0099"` are hardcoded constants in the journey store. All journey mutations default to this lead when no explicit lead context is passed, so the full pipeline can be demoed without wiring up a generic lead selector.

### Keyed storage

`scheduleByLead`, `invoiceByLead`, and `paymentByLead` store data keyed by `lead.id`. This means multiple leads can progress through the pipeline independently in a single prototype session.

### Toast + undo pattern

Critical irreversible actions (payment recording, conversion) emit a `toast.success()` with an **Undo** action callback. The undo handler calls the appropriate rollback mutation (e.g. `undoConvertToStudent(previousStage)`).

### Permission hook usage

Always use `usePermission()` from [lib/use-permission.ts](lib/use-permission.ts) inside client components rather than calling `canDo()` directly. This keeps gating reactive when the role is switched at runtime in the prototype.

```typescript
const { can, sees } = usePermission();
if (can('leads.convertToStudent')) { ... }
```

### Activity log convention

All mutations must append a human-readable `ActivityEntry` to `state.activity`. Use past tense, include key values (date, subject, teacher, amount), and pick a semantic Tailwind dot colour:

| Event type | Dot colour |
|---|---|
| Booking | `bg-purple-400` |
| Outcome / result | `bg-blue-400` |
| Conversion / creation | `bg-emerald-500` |
| Payment | `bg-green-500` |
| Loss / cancellation | `bg-red-400` |
| Internal note / chat | `bg-slate-400` |

### Adding a new pipeline action

1. Add permission ID to `PERMISSIONS` in [lib/role-config.ts](lib/role-config.ts)
2. Add mutation to `JourneyContext` in [lib/journey-store.tsx](lib/journey-store.tsx) — append an `ActivityEntry`
3. Create a dialog in [components/journey/](components/journey/) using `dialog-parts.tsx` primitives
4. Wire the dialog to the footer action bar in [app/leads/page.tsx](app/leads/page.tsx) behind `can('your.action')`
