# Enrolla — Lead Workflow Handover Note v2

**Document type:** Backend specification  
**Version:** 2.0  
**Prepared by:** Jason Daswani / Claude  
**Date:** April 2026  
**Supersedes:** Enrolla_Lead_Workflow_Handover.docx (v1)  
**Status:** Current — reflects all prototype decisions as of 20 April 2026

---

## 1. Purpose

This document translates the Enrolla lead workflow prototype into precise backend specifications. For each stage of the 11-stage lead pipeline it defines: the API operations required, the data entities created or updated, the tasks auto-generated, the RBAC constraints, and the connections to other modules.

**v2 changes from v1:**
- Trial class is now optional soft-prompted, not a mandatory journey step
- Multi-subject assessment and trial booking (one row per subject)
- Paid = Won: payment and student creation are one atomic operation
- "Needs more time" follow-up task pattern at four stages
- "Skip Assessment" action at Contacted stage
- "Book Trial First" available at Contacted and Assessment Done stages
- Follow-up task completion → lead banner pattern
- Stage footer layout defined explicitly per stage
- Skip warning logic documented

---

## 2. The 11-Stage Pipeline

All stages are skippable. Admin can move a lead to any stage at any time via the Change Stage dropdown or "Move to next stage" button. Assessment and Trial are both optional. The pipeline is a recording mechanism, not a gating mechanism — the only hard gates are the forms described in Section 4.

| Stage | Description | Gated Form | Terminal |
|---|---|---|---|
| New | Lead created via any capture channel | No | No |
| Contacted | First contact made with parent | No | No |
| Assessment Booked | Assessment appointment(s) scheduled | Yes — BookAssessmentDialog | No |
| Assessment Done | Assessment completed, outcome logged | Yes — LogOutcomeDialog | No |
| Trial Booked | Trial session(s) scheduled (optional) | Yes — BookTrialDialog | No |
| Trial Done | Trial completed, outcome logged | Yes — LogTrialOutcomeDialog | No |
| Schedule Offered | Session schedule proposed to parent | Yes — ScheduleOfferDialog | No |
| Schedule Confirmed | Parent confirmed the schedule | Yes — ScheduleConfirmDialog | No |
| Invoice Sent | Invoice built and issued | Yes — InvoiceBuilderDialog | No |
| Paid | Payment recorded → auto-converts to Won | Yes — RecordPaymentDialog | Paid triggers Won |
| Won | Lead converted to student. Terminal. | — | Yes |

> **Paid = Won.** These are the same trigger. When payment is recorded, the system immediately converts the lead to Won and creates the student record atomically. There is no separate "Convert to Student" action.

### 2.1 Terminal Statuses

In addition to Won, the following terminal statuses are available at any stage:

| Status | Trigger | Notes |
|---|---|---|
| Won | Payment recorded | Auto-set. Creates student record atomically. |
| Lost | Admin manual | Reason required. Lead retained permanently. |
| Archived — DNC | Admin sets DNC flag | All outbound blocked. Lead auto-archived. |
| Archived — Disgruntled | Admin manual | Admin notes required. |
| Archived — Auto-Inactive | System: 90 days no activity (IMI default) | Warning task at day 83. Auto-archives at day 90. |

---

## 3. Lead Entity — Data Model

| Field | Type | Notes |
|---|---|---|
| lead_id | UUID | System-generated. Never changes. |
| lead_ref_number | String | Tenant-formatted (e.g. IMI-L-0041). Configurable prefix in M20. Retained permanently after conversion. |
| tenant_id | UUID FK | |
| guardian_id | UUID FK | Links to guardian record in M02 |
| child_name | String | |
| child_year_group | Enum | KG1, KG2, Y1–Y13 |
| child_dob | Date | Optional at capture. Used for age mismatch check in M03. |
| subject_interest[] | String[] | One or more subjects from catalogue |
| source_channel | Enum | Website, Phone, Walk-in, WhatsApp, Instagram, Referral, Event |
| preferred_days[] | String[] | e.g. ['Saturday']. Set at capture or updated by Admin. |
| preferred_window | Enum | Morning (08–12), Afternoon (12–17), Evening (17–20), Any |
| pipeline_stage | Enum | One of the 11 stages above |
| terminal_status | Enum \| null | Won, Lost, Archived variants. Null if active. |
| owner_user_id | UUID FK | Assigned Admin. Default: creator. |
| dnc_flag | Boolean + reason + set_by + set_at | See Section 8. |
| sibling_group_id | UUID FK \| null | Auto-assigned on duplicate/sibling detection |
| last_activity_at | Timestamp | Resets on any staff action. Used for auto-inactive calculation. |
| converted_student_id | UUID FK \| null | Set on Won. Links lead to new student record permanently. |
| created_at | Timestamp | |
| auto_inactive_warning_sent_at | Timestamp \| null | Set when 83-day warning fires. |

---

## 4. Stage Footer Actions (Per Stage)

The lead ticket footer shows contextual action buttons depending on the current pipeline stage. This is the UX layer — each button maps to a backend operation described in Section 5.

### New
- **Mark as Contacted →** (amber, primary) — commits stage change to Contacted immediately

### Contacted
- **Book Assessment →** (amber, primary) — opens BookAssessmentDialog (gated)
- **Book Trial First** (outline) — opens BookTrialDialog directly, bypassing assessment
- **Needs more time** (outline) — opens NeedsMoreTimeDialog, creates follow-up task
- **Skip Assessment →** (slate text link) — soft confirm dialog, moves to Schedule Offered

### Assessment Booked
- **Log Outcome →** (amber, primary) — opens LogOutcomeDialog (gated)

### Assessment Done
- **Propose Schedule →** (amber, primary) — fires trial soft prompt if no trial exists, then ScheduleOfferDialog
- **Book Trial First** (outline) — opens BookTrialDialog directly
- **Needs more time** (outline) — opens NeedsMoreTimeDialog, creates follow-up task

### Trial Booked
- **Log Trial Outcome →** (amber, primary) — opens LogTrialOutcomeDialog (gated)

### Trial Done
- **Propose Schedule →** (amber, primary) — opens ScheduleOfferDialog directly (no trial prompt)

### Schedule Offered
- **Confirm Schedule →** (amber, primary) — opens ScheduleConfirmDialog (gated)

### Schedule Confirmed
- **Send Invoice →** (amber, primary) — opens InvoiceBuilderDialog (gated)
- **Needs more time** (outline) — opens NeedsMoreTimeDialog, creates follow-up task

### Invoice Sent
- **Mark as Paid →** (amber, primary) — opens RecordPaymentDialog (gated)
- **Needs more time** (outline) — opens NeedsMoreTimeDialog, creates follow-up task

### Paid / Won
- No footer buttons. Terminal state.

---

## 5. Gated Stage Actions — Backend Operations

### 5.1 Assessment Booked

**Form collects (BookAssessmentDialog):**
- Date (required)
- One or more subject rows, each with: subject (from catalogue), teacher(s) (multi-select), time (HH:MM), room (optional, defaults TBC)
- Notes (optional)
- Smart scheduling suggestion reads from: preferred_days, preferred_window, teacher mock availability

**Backend operations on confirm:**
1. Create one `Assessment` record per subject row: `assessment_id, lead_id, subject, teacher_ids[], date, time, room, notes, status=Booked, duration=30min`
2. Update lead: `pipeline_stage = 'Assessment Booked'`, `last_activity_at = now()`
3. Create one M16 Task per teacher assigned:
   - Title: `"Log assessment outcome — [child_name] · [subject]"`
   - Type: Academic, Priority: High, assignee: teacher_id, due: assessment date, `source_lead_id: lead_id`
4. Block timetable slot: create 30-minute session block per teacher on assessment date/time (amber block in M05)
5. Emit automation trigger: `assessment_booked`
6. Activity log: `"Assessment booked — [subject(s)], [date] [time], [teacher(s)]. Tasks created for [N] teacher(s)."`
7. Toast: `"[N] assessment(s) booked · [N] task(s) created for [teachers]"`

> Assessments are always free. Never generate an invoice for an assessment. One assessment permitted per subject per student.

---

### 5.2 Assessment Done (Log Outcome)

**Form collects (LogOutcomeDialog):**
- Recommendation (Enrol same level / higher / lower / Do not enrol / Further assessment needed)
- Observed level (free text)
- Target grade (free text)
- Notes (optional)
- Shared with parent (boolean)

**Backend operations on confirm:**
1. Update `Assessment` record: `outcome = {recommendation, observed_level, target_grade, notes, shared_with_parent}, status = Done`
2. Update lead: `pipeline_stage = 'Assessment Done'`, `last_activity_at = now()`
3. Mark related teacher task(s) as Done automatically
4. Emit automation trigger: `assessment_completed`
5. Activity log: `"Assessment outcome logged — [recommendation] · Target: [grade]"`

> Outcome carry-forward: on lead conversion to Won, all assessment outcomes attach to the new student record in M17 as historical placement data.

---

### 5.3 Trial Booked

**Context:** Trial is optional. It is reached either via:
- The soft prompt when moving from Assessment Done to Schedule Offered (if no trial exists)
- "Book Trial First" button at Contacted or Assessment Done stage
- Manual stage jump via Change Stage dropdown

**Form collects (BookTrialDialog):**
- One or more subject rows: subject, teacher, date, time (HH:MM), room (optional, defaults TBC)
- Per-row fee waiver toggle with reason (if waived, trial invoice = AED 0)

**Backend operations on confirm:**
1. Create one `TrialClass` record per subject row: `trial_id, lead_id, subject, teacher_id, date, time, room, fee_waived (bool), waiver_reason, status=Booked`
2. Generate trial invoice per subject row:
   - Primary: AED 250 + 5% VAT = AED 262.50
   - Secondary (Y7–Y13): AED 300 + 5% VAT = AED 315.00
   - If `fee_waived = true`: invoice total = AED 0, auto-resolve to Paid, notify Admin Head
   - Trial invoices **never** trigger the AED 300 enrolment fee
3. Create one M16 Task per teacher: `"Log trial outcome — [child_name] · [subject]"`, Priority: High, due: trial date, `source_lead_id: lead_id`
4. Update lead: `pipeline_stage = 'Trial Booked'`, `last_activity_at = now()`
5. Block timetable slot for each trial session (60 min, amber block in M05)
6. Activity log: `"Trial booked — [N] subject(s): [list]. Tasks created for [teachers]."`
7. Toast: `"Trial booked · [N] task(s) created for [N] teacher(s)"`

---

### 5.4 Trial Done (Log Trial Outcome)

**Form collects (LogTrialOutcomeDialog):**
- Outcome per subject: Recommended for enrolment / Not recommended / Parent to decide
- Notes (optional)
- Trial invoice paid confirmation (checkbox)

**Backend operations on confirm:**
1. Update `TrialClass` record: `outcome = {result, notes}, status = Done`
2. Update lead: `pipeline_stage = 'Trial Done'`, `last_activity_at = now()`
3. Mark related teacher task(s) as Done
4. If trial fee was paid: calculate trial credit:
   - Credit = trial fee paid − standard per-session rate (incl. VAT) for year group
   - Example Y4 Primary: AED 262.50 − AED 189.00 = AED 73.50 credit
   - Apply credit to guardian account as pre-collected credit against first term invoice
5. Activity log: `"Trial outcome logged — [result(s)]"`

---

### 5.5 Trial Soft Prompt

**Triggered when:** Admin moves from Assessment Done → Schedule Offered AND no trial record exists for this lead.

**Behaviour:**
- Show soft prompt Dialog before opening ScheduleOfferDialog
- Title: "Skip straight to scheduling?"
- Body: "No trial class has been booked for this lead. Would you like to book a trial session before proposing a schedule, or proceed directly to scheduling?"
- Button 1: "Book a Trial First" (outline) → opens BookTrialDialog; after trial confirmed, automatically chains to ScheduleOfferDialog
- Button 2: "Skip to Scheduling" (amber) → opens ScheduleOfferDialog directly
- Checkbox: "Don't show this again for this lead" → suppresses prompt for this lead going forward

**Does NOT fire when:**
- Lead is already at Trial Done stage (trial was completed)
- "Don't show again" checkbox was previously ticked for this lead

---

### 5.6 Schedule Offered

**Form collects (ScheduleOfferDialog):**
- One or more subject rows: subject (from catalogue), days (multi-select Mon–Sat), time (HH:MM), teacher, sessions/week
- WhatsApp copy-paste block "Mark as sent" checkbox

**Backend operations on confirm:**
1. Create `ScheduleProposal` record: `lead_id, rows[] = {subject, days[], time, teacher_id, sessions_per_week}, proposed_at, proposed_by`
2. Update lead: `pipeline_stage = 'Schedule Offered'`, `last_activity_at = now()`
3. If "Mark as sent" checked: log outbound contact note on lead
4. Activity log: `"Schedule proposed — [subjects] [days] [time]"`

---

### 5.7 Schedule Confirmed

**Form collects (ScheduleConfirmDialog):**
- Confirmation method (WhatsApp / In person / Email)
- Date of confirmation
- Notes (optional)
- WhatsApp copy-paste "Mark as sent" checkbox

**Backend operations on confirm:**
1. Update `ScheduleProposal`: `status = Confirmed, confirmed_via, confirmed_at, confirmed_by`
2. Update lead: `pipeline_stage = 'Schedule Confirmed'`, `last_activity_at = now()`
3. Activity log: `"Schedule confirmed by parent via [channel]"`

---

### 5.8 Invoice Sent

**Form collects (InvoiceBuilderDialog):**
- Line items auto-populated from confirmed schedule (subject, sessions count, rate)
- Enrolment fee AED 300 (non-discountable, only on first-ever enrolment)
- Optional discount (% or fixed AED, requires reason — Admin Head notified)
- Invoice number (auto-suggested, editable)
- Payment due date
- Payment plan toggle (if total ≥ AED 4,000): instalment splits

**Pricing engine (critical — replicate exactly in backend):**

Secondary frequency tier rates (total weekly sessions across ALL subjects):

| Year Group | 1/wk | 2/wk | 3+/wk | 4+/wk |
|---|---|---|---|---|
| Y7–Y9 | AED 200 | AED 180 | AED 160 | — |
| Y10 | AED 180 | AED 180 | AED 150 | AED 125 |
| Y11 | AED 200 | AED 200 | AED 180 | AED 150 |
| Y12–Y13 | AED 200 | AED 180 | AED 160 | — |

Primary flat rates:

| Year Group | Rate |
|---|---|
| KG1–KG2 | AED 160/session |
| Y1–Y3 | AED 170/session |
| Y4–Y6 | AED 180/session |
| Science Y4–Y6 (combo) | AED 150 if also enrolled Maths + English (min 10 sessions each) |

Additional rules:
- Tier applies to **total** weekly sessions across all subjects (not per-subject)
- Minimum 10 sessions per subject for Secondary
- Enrolment fee is non-discountable
- VAT formula: `subtotal → discount → post-discount subtotal → × 1.05 → total`
- Upsell nudge: if 1 session/week, show amber banner with tier saving calculation
- Payment plan eligible if total ≥ AED 4,000 (default: 60%/40% split, min 50% first instalment)

**Backend operations on confirm:**
1. Create `Invoice` record: `invoice_id, lead_id, guardian_id, lines[], subtotal, discount, vat, total, status=Issued, due_date, revenue_tag (auto from department)`
2. Update lead: `pipeline_stage = 'Invoice Sent'`, `last_activity_at = now()`
3. Activity log: `"Invoice [number] issued — AED [total] due [date]"`

> If discount applied: invoice status = Draft until Admin Head approves. Admin Head receives in-app notification. Enrolment activates only after approval.

---

### 5.9 Paid → Won (Atomic Conversion)

**Form collects (RecordPaymentDialog):**
- Amount received
- Payment method (Cash / Bank Transfer / Card / Cheque)
- Reference number (optional)
- Date received
- Notes (optional)
- If payment plan: first instalment amount, second instalment due date

**Backend operations on confirm — single atomic database transaction:**
1. Record payment: `payments` row linked to `invoice_id`, amount, method, reference, date
2. Update invoice status: `Paid` (if amount ≥ total) or `Part` (if partial)
3. If partial and below 1/n minimum instalment floor: enrolment stays Pending, Admin Head approval required
4. **Create student record in M02** (atomic with above):
   - `student_id` = next available `IMI-XXXX`
   - Fields: name, year_group, department (auto from year group), guardian_id, school, `status=Active`
   - Carry forward: assessment outcomes, trial outcomes, sibling links, referral source
   - Set enrolment fee flag: `Paid` or `Not Yet Applied`
5. Update lead: `pipeline_stage = 'Paid'`, `terminal_status = 'Won'`, `converted_student_id = student_id`, `last_activity_at = now()`
6. Emit automation trigger: `lead_won_converted` (payload: lead_id, student_id, converted_at)
7. If trial credit was calculated: apply as pre-collected credit on guardian account
8. Activity log (two entries):
   - `"Payment recorded — AED [amount] via [method] · Ref: [reference]"`
   - `"Lead converted to student — [student_id] · Won"`
9. Dialog shows success state: "Payment recorded · ✅ Lead converted to student — [ID]" with "View Student Profile →" link

> **This is a single atomic database transaction.** If student creation fails, payment must also roll back. Use a database transaction wrapper.

---

## 6. "Needs More Time" — Follow-Up Task Pattern

**Triggered at:** Contacted, Assessment Done, Schedule Confirmed, Invoice Sent stages (the four parent engagement points where the ball is in the parent's court).

**Form collects (NeedsMoreTimeDialog):**
- Follow-up note (optional textarea)
- Follow-up in (select: 1 day / 2 days / 3 days / 1 week / 2 weeks — default: 2 days)
- Assignee (search-to-select, defaults to lead owner)

**Backend operations on confirm:**
1. Create M16 Task:
   - Title: `"Follow up — [guardian_name] · [child_name] · [current_stage]"`
   - Type: Admin, Priority: Medium
   - Assignee: selected assignee
   - Due: today + selected days
   - `source_lead_id: lead_id`, `source_lead_name: child_name`
   - Description: follow-up note (if entered)
2. Activity log: `"Follow-up task created — [assignee] · due [date]"`
3. Stage does **not** change — lead stays at current stage
4. Toast: `"Follow-up task created · due [date]"`

**When follow-up task is marked Done:**
1. Dispatch `enrolla:lead-followup-completed` event with `{leadId, taskTitle}`
2. Append activity entry to linked lead: `"Follow-up task completed — [title] · marked done by [user]"`
3. If task title starts with `"Follow up —"`: queue an amber banner on the lead ticket
   - Banner text: "Follow-up task completed. Ready to continue?"
   - Button "Continue journey →": scrolls to stage footer actions
   - Button "Dismiss": removes banner permanently

---

## 7. "Skip Assessment" Action

**Triggered at:** Contacted stage footer (slate text link).

**Behaviour:**
1. Show soft confirm Dialog:
   - Title: "Skip assessment?"
   - Body: "The assessment step will be skipped for this lead. You'll move straight to scheduling. This is logged on the lead record."
   - Buttons: "Yes, skip assessment" (amber) / "Cancel" (outline)
2. On confirm:
   - Stage → Schedule Offered (fires trial soft prompt as normal since no trial exists)
   - Activity log: `"Assessment skipped — moved to Schedule Offered"`
   - Toast with 5-second undo

---

## 8. Task Auto-Generation Rules

All auto-generated tasks carry `source_lead_id` and appear with a LEAD badge in /tasks, filterable via the "From leads" toggle.

| Trigger | Task Title | Assignee | Priority | Due |
|---|---|---|---|---|
| Assessment booked | Log assessment outcome — [name] · [subject] | Teacher(s) | High | Assessment date |
| Trial booked | Log trial outcome — [name] · [subject] | Teacher(s) | High | Trial date |
| "Needs more time" clicked | Follow up — [guardian] · [child] · [stage] | Lead owner (configurable) | Medium | Today + selected days |
| Lead inactive 83 days | Follow up — [name] at risk of auto-archive | Assigned Admin | High | Day 90 |
| Assessment outcome logged | Auto-marks teacher task as Done | — | — | — |
| Trial outcome logged | Auto-marks teacher task as Done | — | — | — |

> Teachers who receive assessment/trial tasks cannot see the full lead record. The task contains the assessment details they need. The "View Lead" link in the task detail routes to the lead only for Admin+ roles.

---

## 9. RBAC — Lead Workflow Permissions

All 8 roles have `leads.view`. Pipeline advancement is tier-gated past Schedule Confirmed.

| Role | Tier | View Leads | Create/Edit Lead | Advance Pipeline | Past Schedule Confirmed | Convert (Won) |
|---|---|---|---|---|---|---|
| Super Admin | 1a | All | Yes | All stages | Yes | Auto on payment |
| Admin Head | 1a | All | Yes | All stages | Yes | Auto on payment |
| HR/Finance | 1b | All | No | All stages | Yes — Invoice, Payment | Auto on payment |
| Admin | 2b | Assigned + unassigned | Yes | All stages | Yes | Auto on payment |
| Academic Head | 2a | All | No | Up to Schedule Confirmed | No — amber banner shown | No |
| HOD | 2a | All | No | Up to Schedule Confirmed | No — amber banner shown | No |
| Teacher | 3 | All | No | Up to Schedule Confirmed | No — amber banner shown | No |
| TA | 3 | All | No | Up to Schedule Confirmed | No — amber banner shown | No |

**Amber banner (Tier 2a and Tier 3):** When a user without `leads.advanceBeyondScheduled` is on a lead at Schedule Confirmed or later, the stage footer shows: *"To proceed to invoicing, please speak to Admin or Admin Head."* The Send Invoice, Record Payment, Mark as Won, and Mark as Lost buttons are hidden.

**Team chat:** Unrestricted at all stages for all tiers. All 8 roles can post and read team chat messages on any lead at any pipeline stage.

**Invoice auto-link:** When an invoice issued from `/finance/invoice/new` is linked to a lead via `leadId`, issuing the invoice sets the lead to Invoice Sent; recording payment triggers the full atomic Won conversion (student record created).

**Teacher outcome logging:** Teacher access to log assessment/trial outcomes is via the auto-generated task only. The "View Lead" link in the task detail routes to the lead record for Tier 2a and above only. Tier 3 users are not routed to the lead record from the task.

---

## 10. Stage Change API Design

| Endpoint | Method | Body | Notes |
|---|---|---|---|
| PATCH /api/leads/:id/stage | PATCH | `{ stage, form_data? }` | Gated stages require form_data. Returns 400 if gate data missing. |
| POST /api/assessments | POST | `{ lead_id, rows[], notes }` | Creates assessment records + tasks + timetable blocks |
| PATCH /api/assessments/:id/outcome | PATCH | `{ recommendation, observed_level, target_grade, notes, shared }` | Completes assessment, marks teacher task done |
| POST /api/trials | POST | `{ lead_id, rows[], fee_waived_rows[] }` | Creates trial records + invoices + tasks |
| PATCH /api/trials/:id/outcome | PATCH | `{ result, notes, invoice_paid }` | Completes trial, calculates credit |
| POST /api/schedules | POST | `{ lead_id, rows[] }` | Creates schedule proposal |
| PATCH /api/schedules/:id/confirm | PATCH | `{ method, date, notes }` | Confirms schedule |
| POST /api/invoices | POST | `{ lead_id, lines[], discount?, payment_plan? }` | Creates invoice |
| POST /api/invoices/:id/payment | POST | `{ amount, method, reference, date }` | Records payment, triggers atomic Won conversion |
| DELETE /api/leads/:id/stage-change/:change_id | DELETE | — | Undo stage change (5-second window only) |

---

## 11. DNC Rules

- DNC is a warning interstitial, never a hard block. All action buttons remain active.
- On any contact button click against a DNC lead: show modal with DNC reason, date, setter. Admin must acknowledge before proceeding.
- On DNC set: all assigned staff notified in-app. Lead auto-archived with terminal status "Archived — DNC".
- All automated outbound messages suppressed for DNC leads.
- DNC history is permanent: flag, set date, reason, set by, removal date, removal reason — all retained indefinitely.

---

## 12. Stage Skip Warning Logic

A soft dismissable warning Dialog fires when Admin jumps more than one stage forward AND skipped stages include non-trial stages.

| Scenario | Warning Fires? | Reason |
|---|---|---|
| New → Schedule Offered | Yes | Skipped Contacted, Assessment stages |
| Assessment Done → Schedule Offered | No | Only skipped Trial Booked + Trial Done (always optional) |
| Assessment Done → Invoice Sent | Yes | Skipped Schedule Offered, Schedule Confirmed |
| Moving backward to any stage | No | Admin correcting a mistake |
| Moving to Lost / Archived | No | Terminal statuses always accessible |

Warning Dialog:
- Title: "Skipping pipeline stages"
- Body: "You're moving from [Current Stage] to [Target Stage], skipping [list of skipped stages]. This is allowed but may mean steps were completed outside the system."
- Buttons: "Continue anyway" (amber) / "Cancel" (outline)

---

## 13. Undo Behaviour

The frontend implements a 5-second undo toast on every stage change.

- Undo window: 5 seconds from stage change commit
- Undo endpoint: `DELETE /api/leads/:id/stage-change/:change_id`
- On undo: revert `pipeline_stage` to previous value. Remove any records created in that stage change (assessment records, task records, timetable blocks) if within undo window.
- After 5 seconds: stage change is permanent. Undo endpoint returns 409 Conflict.
- For Paid → Won: undo removes the student record and reverses the invoice payment. Implement as a full rollback transaction. Log the undo action permanently.

---

## 14. Activity Log

Every action on a lead is logged in an append-only `activity_log` table. No entry can be edited or deleted.

| Entry Type | Fields |
|---|---|
| Stage change | from_stage, to_stage, changed_by, timestamp |
| Assessment booked | subject(s), date, time, teacher(s), room, booked_by, timestamp |
| Assessment outcome logged | recommendation, observed_level, target_grade, logged_by, timestamp |
| Trial booked | subject(s), date, time, teacher(s), fee_waived, booked_by, timestamp |
| Trial outcome logged | result(s), credit_calculated, logged_by, timestamp |
| Schedule proposed | rows[], proposed_by, timestamp |
| Schedule confirmed | method, confirmed_at, confirmed_by, timestamp |
| Invoice issued | invoice_number, total, due_date, issued_by, timestamp |
| Payment recorded | amount, method, reference, recorded_by, timestamp |
| Lead converted | student_id, converted_by, timestamp |
| Stage change undone | reverted_to, undone_by, timestamp |
| Outbound contact logged | channel, mark_as_sent_by, message_template, timestamp |
| DNC set / removed | reason, set_by / removed_by, timestamp |
| Assessment skipped | logged_by, moved_to, timestamp |
| Follow-up task created | task_id, assignee, due_date, created_by, timestamp |
| Follow-up task completed | task_id, completed_by, timestamp |

---

## 15. Automation Triggers Emitted (F.13)

| Event | Trigger type | Payload |
|---|---|---|
| `lead_created` | Status change | lead_id, source_channel, guardian_id, child details |
| `stage_changed` | Status change | lead_id, from_stage, to_stage, changed_by |
| `lead_assigned` | Status change | lead_id, assignee_id, assignee_role, previous_owner_id |
| `assessment_booked` | Status change | assessment_id, lead_id, scheduled_at, teacher_ids[], booking_method |
| `assessment_completed` | Status change | assessment_id, outcome_id, ability_rating, recommended_subject_id |
| `dnc_set` | Status change | lead_id, reason, set_by |
| `auto_inactive_warning_due` | Time-based | lead_id, days_inactive (83) |
| `lead_auto_archived` | Status change | lead_id, auto_inactive_at |
| `lead_won_converted` | Status change | lead_id, student_id, converted_at |

---

## 16. Module Connections

| Module | Connection | When |
|---|---|---|
| M02 CRM | Student record created on Won | Atomic with payment recording |
| M03 Assessment | Assessment records created, outcomes stored | Assessment Booked + Assessment Done stages |
| M04 Enrolment | Trial records, trial credit calculation | Trial Booked + Trial Done stages |
| M05 Timetable | Assessment + trial blocks added to teacher calendars | Assessment/Trial booked |
| M08 Finance | Trial invoices, term invoices, payment recording | Trial Booked + Invoice Sent + Paid stages |
| M11 Catalogue | Subject list, pricing rates, tier rules | All pricing calculations |
| M16 Tasks | Auto-created tasks on assessment/trial booking; auto-completed on outcome log | Assessment/Trial booked + outcomes logged |
| M18 Guardian | Trial credit applied to guardian credit balance | Trial Done with credit calculated |
| F.13 Automation | Trigger events emitted by lead pipeline | On every stage change and key action |

---

## 17. What the Prototype Approximates (Not to Copy)

The following are frontend approximations of server-side logic. Implement these as proper backend operations.

| Prototype pattern | Backend equivalent |
|---|---|
| `lib/journey-store.tsx` (React context) | Real API calls to stage change endpoints |
| `lib/assessment-store.tsx` (React context) | M03 database table + API |
| `taskStore` array (in-memory) | M16 tasks API |
| `studentsStore` array (in-memory) | M02 student creation API |
| `leadStageOverrides` map (React state) | PATCH /api/leads/:id/stage |
| Per-lead activity arrays (in-memory) | Append-only activity_log table |
| Pricing calculations in `invoice-builder-dialog.tsx` | Backend pricing engine reading from M11 catalogue rates |
| `chainAfterTrialRef` (React ref for dialog chaining) | Sequential API calls + frontend state |
| `followUpBanners` state (React state) | Read from activity_log: last completed follow-up task per lead |

---

*End of document · Enrolla Lead Workflow Handover v2 · April 2026*
