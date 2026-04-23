# Enrolla PRD — Band 2

**Scope:** Items 9–20. Builds on sealed Band 1 PRD (Items 1–8) and its Foundations (F.1–F.10). This document is additive — it does not restate Band 1 Foundations, only extends them.

**Reading order:** Read `Enrolla_PRD_Band1.md` first. Every Band 2 item references Band 1 Foundations (F.4 entities, F.7 approval gateway, F.10 UI foundation) and Band 1 items by number.

**Conventions:** UK English. Minimal format mode. Per-item 7-subsection pattern: Purpose / What to build / Data captured / Rules / Connects / Out of scope / UI specifics.

---

# Band 2 Foundations (additive to Band 1 F.1–F.10)

## F.11 — Concern Engine

**Purpose:** Centralised rule evaluation layer that watches student, attendance, feedback, and academic data and raises *concerns* — structured alerts routed to owners as tasks (M16) and dashboard tiles (M10).

**Evaluation cadence:** Nightly batch at 02:00 tenant-local time + event-driven triggers on attendance confirmation, feedback submission, assessment entry, and invoice status change.

**Threshold source:** All thresholds inherit from M20 tenant defaults. IMI defaults (from session state): Teaching Quality < 28%, Missed Sessions > 17%, Attendance < 80%, Predicted Grade drop ≥ 2 bands, NPS detractor response. Tenant-overridable in M20 → Concern Engine tab.

**Concern record schema:**
- `concern_id` (UUID)
- `concern_type` (enum: attendance, academic, feedback, financial, safeguarding, custom)
- `severity` (low / medium / high / critical)
- `subject_entity` (student | staff | guardian | course)
- `subject_id`
- `triggered_by_rule_id`
- `trigger_value` (the measured value that breached)
- `threshold_value` (the rule value it breached against)
- `evaluation_window` (e.g. "last 30 days", "current term")
- `status` (open / acknowledged / in_progress / resolved / dismissed)
- `owner_role` (routed role per M20 escalation matrix)
- `owner_user_id` (assigned individual, nullable until picked up)
- `created_at`, `acknowledged_at`, `resolved_at`
- `resolution_note` (mandatory on resolve/dismiss)
- `linked_task_id` (M16 task auto-created)
- `audit_log[]` (all state transitions)

**Routing:** Each rule declares a default owner role. Fallback chain skips null roles (per Band 1 F.7). Critical severity auto-escalates to Admin Head after 24h unacknowledged.

**De-duplication:** Same rule + same subject + open status → update existing concern, do not create duplicate. Increment `reoccurrence_count`.

**Auto-task creation:** Every new concern creates a linked M16 task with the same owner. Closing the task prompts to resolve the concern (not automatic — resolution requires explicit note).

## F.12 — AI Integration Rules

**Provider:** Anthropic Claude. Default model: `claude-sonnet-4`. Upgradeable per tenant in M20 → AI tab.

**Use cases in Band 2:**
- **M07: Daily per-session teacher feedback writeup** (highest volume) — teacher supplies raw notes, AI expands into structured template. ~1,500 calls/month at IMI scale.
- M07: AI feedback summary (per student, per term) — ~450 calls/month at IMI scale
- M19: AI progress report narrative (per student, per term) — ~450 calls/month
- M19: Predicted grade commentary — event-driven, ~300 calls/month
- F.11: Concern enrichment commentary — event-driven, low volume

**Cost governance:**
- Per-tenant monthly USD ceiling set in M20. IMI default: **$250/month** (baseline expected usage ~$45/month; ceiling provides ~5× headroom for spikiness, retries, growth, prompt iteration, and teacher exploration).
- Usage meter updates per API call: tokens in, tokens out, USD cost, use case, requesting user.
- **Fallback ladder when ceiling hit:**
  1. Queue non-urgent jobs (batch progress reports, bulk summaries) to next month's window
  2. Disable new AI generation attempts; UI shows "AI capacity reached — contact admin"
  3. Alert Super Admin + Developer role via M13 notification
- Manual top-up: Super Admin can raise the ceiling mid-month, logged reason mandatory.

**Prompt governance:**
- All prompts stored as versioned templates in platform code (not tenant-editable in v1)
- Every AI call logs: template_id, template_version, input hash, output, token counts, cost, user, timestamp
- Retention: 12 months, then purge input/output, keep metadata

**PII redaction before send:**
- Student full name → "Student A"
- Guardian names, phone, email → redacted
- Staff names → role only ("Teacher")
- Financial figures → retained (needed for context)
- Post-generation: names re-substituted in display layer, never sent to provider

**Guardrails:**
- Max 4000 output tokens per call
- Temperature fixed at 0.3 for reports, 0.5 for summaries
- No tool use, no web search from within AI calls in v1
- Failed calls retry once with exponential backoff, then log and fall back to template text

## F.13 — Automation Engine Model

**Purpose:** Declarative rule engine for no-code automation. Powers M13 (Automation & Communications) and is referenced by M01, M07, M12, M16, M19.

**Seven v1 trigger types:**
1. **Status change** — entity field transitions (e.g. Lead status → Won)
2. **Time-based absolute** — specific datetime (e.g. "2026-06-15 09:00")
3. **Time-based relative** — offset from anchor field (e.g. "3 days after enrolment_date")
4. **Threshold breach** — numeric field crosses value (integrates with F.11 Concern Engine)
5. **Manual** — user clicks "Run automation" on a record
6. **Form submission** — M12 form submitted (any or specific form)
7. **Attendance event** — session confirmed, no-show marked, makeup booked

**Rule schema:**
- `automation_id`, `name`, `description`, `enabled` (bool)
- `trigger_type`, `trigger_config` (JSON, type-specific)
- `conditions[]` (AND/OR tree of field comparisons)
- `actions[]` (ordered list: send_message, create_task, update_field, assign_owner, create_concern, call_webhook *phase2*)
- `owner_role` (who can edit)
- `execution_log[]` (timestamp, trigger match, conditions result, actions result, errors)
- `rate_limit` (max executions per hour per subject, prevents runaway)

**Execution guarantees:**
- At-least-once delivery for actions
- Idempotency key per (rule_id + subject_id + trigger_timestamp)
- Failed actions retry 3x with exponential backoff, then log and alert rule owner

## F.14 — Segment Cache Rules

**Purpose:** M12 form audience targeting and M13 message targeting require dynamic segments (e.g. "all Y10 students with attendance < 85%"). Naive evaluation is expensive; cache rules prevent slowness.

**Materialisation:** Segments are materialised views refreshed on a cadence declared per segment — default 1 hour, minimum 15 minutes, maximum 24 hours.

**Invalidation triggers:** Any write to a field referenced in the segment definition marks the segment stale. Next read re-materialises.

**Staleness SLA:** UI shows segment freshness timestamp. If > SLA, display "Refreshing…" and trigger on-demand rebuild.

**Size ceiling:** 50,000 members per segment. Exceeding throws a soft warning and asks the user to narrow the definition.

## F.15 — M12 Form Schema Additions

Band 1 did not include forms. Band 2 introduces them. Additive entity definitions:

**Form entity:**
- `form_id`, `tenant_id`, `name`, `slug`, `status` (draft/published/archived)
- `version` (increments on publish)
- `fields[]` (ordered: field_id, type, label, required, validation, conditional_logic)
- `audience` (public link | authenticated roles | segment_id)
- `submission_policy` (once per user | unlimited | once per email)
- `success_action` (message | redirect | auto-create record)
- `retention_days` (default 730, tenant-configurable)

**Field types v1:** short_text, long_text, number, email, phone, date, datetime, single_select, multi_select, file_upload, signature, rating_1_5, consent_checkbox.

**Validation:** regex, min/max, required, cross-field (e.g. "end date after start date").

**Submission entity:**
- `submission_id`, `form_id`, `form_version`, `submitted_at`, `submitter_id` (nullable for public)
- `values[]` (field_id → value)
- `ip_address`, `user_agent` (for audit, purged at retention_days)
- `status` (new / processed / archived)
- `linked_records[]` (if success_action created an entity)

**As automation trigger:** Form submission is automation trigger type 6 (F.13). Conditions can filter on field values.

---

*End of Band 2 Foundations preamble.*

---

# Item 9 — M01 Lead Management

## Purpose

Capture every prospective student enquiry, track it through a structured pipeline from first contact to enrolment, and ensure no lead is lost. Replaces ClickUp (pipeline tracking) and Zoho Forms (capture). Leads are never deleted — only archived. M01 is the primary emitter of automation triggers (F.13) in the Student domain and the main source of new Student records via conversion to M02.

## What to build

1. **Lead capture** — four channels: public web form (M12), inline manual creation, CSV bulk import, walk-in quick-add. Every lead gets a system-generated unique reference number on creation (format configurable per tenant in M20; retained permanently and linked to Student ID on conversion but does not replace it).
2. **11-stage skippable pipeline** — New → Contacted → Assessment Booked → Assessment Done → Trial Booked → Trial Done → Schedule Offered → Schedule Confirmed → Invoice Sent → Paid → Won. All stages skippable; Admin can move a lead to any stage at any time. Assessment and Trial are optional. Feedback at Assessment Done and Trial Done is optional and never blocks progression.
3. **Terminal statuses** — Won (converted), Lost (manual with reason), Archived (manual with reason), Archived Auto-Inactive (system, after 60 days no activity for IMI default).
4. **Ownership model** — default owner = Admin who created the lead; Admin Head can reassign; unassigned leads visible to all Admins; named staff groups for distribution (M09); lead sharing with additional staff for visibility without transferring primary ownership.

5a. **Lead pipeline role tiers** — the pipeline uses a four-tier access model controlling how far each role can advance a lead:

| **Tier** | **Roles** | **Authority** |
|---|---|---|
| Tier 1a | Super Admin, Admin Head | Full pipeline including Invoice Sent, Record Payment, Won, Lost, Convert to Student |
| Tier 1b | HR/Finance | Full pipeline past Schedule Confirmed |
| Tier 2a | Academic Head, HOD | Up to and including Schedule Confirmed. Cannot send invoice, record payment, or convert to student. |
| Tier 2b | Admin | Full pipeline |
| Tier 3 | Teacher, TA | View all stages and team chat only. A banner in the lead footer reads: "To proceed to invoicing, please speak to Admin or Admin Head." Cannot convert to student. |

Team chat is unrestricted at all stages for all roles. All 8 roles have `leads.view`.
5. **Fallback escalation chain** — configured per tenant in M20. If assigned Admin does not action a lead within a threshold window, auto-escalate to the next person in the chain. Both original assignee and fallback recipient notified in-app.
6. **Duplicate and sibling detection** — on create, system checks guardian phone number, guardian email, and child name + year group combination. Surfaces warnings with links to existing records. Sibling group banner auto-applied to linked leads and student records.
7. **Activity log** — chronological, permanent, attributed. Records stage changes, outbound sends (logged as copy-paste "mark as sent" in v1), inbound logs, assessment/trial bookings and outcomes, notes, attachments, assignment changes, fallback escalations, auto-archive warnings, duplicate and sibling detection events.
8. **Referral programme** — referring guardian tracked; milestone rewards (credit to M18 guardian profile automatic; other reward types require manual Admin fulfilment); milestone notifications surfaced as copy-paste templates for Admin to send manually.
9. **Lead-to-Student conversion** — triggered at Paid stage (or Won if Paid is skipped). Creates Student record in M02 with department auto-assigned from year group mapping in M20.
10. **Template surfacing engine** — on lead creation and on stage transitions with configured templates, system surfaces a ready-to-send copy-paste block on the lead record. Admin clicks "Copy message", sends externally, then clicks "Mark as sent" to log the action.

## Data captured

Lead entity: `lead_id` (UUID), `lead_ref_number` (tenant-formatted), `tenant_id`, `guardian_id` (F.4), `child_name`, `child_year_group`, `child_dob`, `subject_interest[]`, `source_channel`, `source_detail`, `referred_by_guardian_id`, `pipeline_stage`, `terminal_status` (nullable), `owner_user_id`, `owner_group_id` (nullable), `shared_with_user_ids[]`, `dnc_flag` (bool + reason + set_by + set_at), `unsubscribe_flag` (bool + set_at), `sibling_group_id` (nullable), `duplicate_checked_at`, `last_activity_at`, `created_at`, `auto_inactive_warning_sent_at`, `auto_archived_at`, `converted_student_id` (nullable). Activity log is a separate append-only table keyed on `lead_id`.

**Guardian phone capture:** UAE country code pre-selected, format validated. WhatsApp-capability is a **manual tickbox on the phone field** (`guardian_phone_is_whatsapp` bool, set by Admin at capture time or editable later). Automated WhatsApp availability check via BSP API is Phase 2.

## Rules

**Pipeline:** All 11 stages are skippable. Admin can jump forward or backward freely. Feedback capture at Assessment Done / Trial Done is optional.

**Invoice-to-lead pipeline auto-update:** When an invoice is issued or payment recorded from the finance dashboard (`/finance/invoice/new` or the invoice detail view), and the invoice has a `leadId` linking it to an active lead, the lead pipeline stage updates automatically: issuing the invoice sets the lead to Invoice Sent; recording payment triggers the full Paid → Won atomic conversion (student record created, `converted_student_id` set, activity log entries written). This mirrors the behaviour when payment is recorded from inside the lead record directly.

**DNC warning interstitial (not a hard block):** When DNC is set on a lead or linked guardian, all contact action buttons on the lead record remain active. On click, a modal displays the DNC reason, date set, and setting Admin; Admin must acknowledge before proceeding. DNC always overrides Unsubscribe on the interstitial — if both are present, DNC reason is shown. Both flags can coexist and are logged independently.

**Auto-inactive (IMI default = 60 days):** A lead is inactive when no pipeline stage change AND no activity log entry has occurred for the configured number of days. Inactivity clock resets on: staff-logged outbound contact, logged guardian response, assessment booking, trial booking. Passive record views do not reset the clock. At day 53 (7 days before auto-archive), a warning notification fires to the assigned Admin and a task is created in M16. At day 60, the lead is auto-archived with terminal status "Archived Auto-Inactive". Archived leads can be unarchived by Admin with a logged reason.

**Time-sensitive stage reminders:** For Assessment Booked and Trial Booked stages, if Admin has not marked a stage message as sent within 2 hours of the stage change, an in-app reminder fires. Clears on "Mark as sent".

**Duplicate detection:** On create, match on (guardian phone) OR (guardian email) OR (child name + year group + guardian surname). Admin can proceed with new record, merge into existing, or dismiss warning — all logged.

**Never delete:** Terminal statuses only. Hard delete is not available in v1 for lead records. Financial and audit activity on a converted lead falls under the 5-year retention rule from session state.

**Reassignment:** Admin Head can reassign any lead at any time. Reassignment routes through F.7 approval gateway only if the new owner is outside the original owner's fallback chain (to prevent silent cross-team handoffs). Otherwise immediate.

## Connects

- **F.4 entities** — Guardian, Student, Tenant
- **F.7 approval gateway** — cross-chain reassignments
- **F.10 UI foundation** — all components use Band 1 tokens
- **F.13 automation engine** — M01 is a primary trigger emitter. Seven lead pipeline events emit automation triggers:

| **Event** | **F.13 trigger type** | **Payload** |
|---|---|---|
| `lead_created` | Status change | lead_id, source_channel, guardian_id, child details |
| `stage_changed` | Status change | lead_id, from_stage, to_stage, changed_by |
| `lead_assigned` | Status change | lead_id, assignee_id, assignee_role, previous_owner_id |
| `dnc_set` | Status change | lead_id, reason, set_by |
| `auto_inactive_warning_due` | Time-based relative | lead_id, days_inactive (53) |
| `lead_auto_archived` | Status change | lead_id, auto_inactive_at |
| `lead_won_converted` | Status change | lead_id, student_id, converted_at |

Tenant automations can use any of these triggers to create tasks (M16), update fields, assign owners, create concerns (F.11), or surface further copy-paste templates. All automation actions respect the v1 copy-paste rule — no automated outbound message dispatch.
- **M02** Student & Guardian CRM — conversion target at Paid/Won
- **M03** Assessment & Placement — consumes Assessment Booked and Assessment Done stage events
- **M09** Staff Performance — staff group definitions, lead-handling metrics (drop-off rate per Admin)
- **M10** Management Dashboard — pipeline funnel, source attribution, stage conversion rates
- **M12** People, Forms & Documents — public web enquiry form feeds M01 capture
- **M16** Task Management — auto-inactive warning tasks, fallback escalation tasks
- **M18** Guardian Profile — referral credit rewards post to guardian credit balance automatically
- **M20** Tenant Settings — lead ref format, auto-inactive window, fallback chain, templates, year group → department mapping

## Out of scope (Phase 2)

- WhatsApp BSP integration — no automated outbound or inbound; all v1 messaging is copy-paste fallback with "Mark as sent" logging
- Email SMTP integration — same pattern as WhatsApp
- Instagram DM auto-reply via Graph API
- Automated delivery and delivery-failure retry logic
- AI lead scoring and intent classification
- Parent portal self-service lead creation or status tracking
- Automated referral milestone fulfilment (beyond credit rewards, which are automatic to M18)

## UI specifics

**Three views:**
- **Kanban (default)** — columns by pipeline stage; cards show child name, year group, subject, source, last activity, assigned owner avatar; drag-and-drop stage progression; sibling banner on linked cards.
- **List** — dense table with all core fields sortable and filterable; bulk actions.
- **Lead detail** — full record with tabs for Overview, Activity Log, Templates (surfaced copy-paste blocks), Siblings, Referral, Notes.

**Key interactions:**
- **Template surfacing block** on lead record — pre-resolved merge fields, "Copy message" button, "Mark as sent" action, linked template version
- **DNC warning modal** — triggered on any contact button click against a DNC record; displays reason/date/setter; requires explicit acknowledgement
- **Duplicate detection modal** — on create; three actions (proceed, merge, dismiss)
- **Global search bar** searching across all lead fields simultaneously
- **Filter panel** — stage, source, assigned owner, year group, subject, school, date range, department; saved filter sets; "My Leads" toggle
- **Sibling banner** — displayed on all linked leads and student records; click-through navigation between siblings

---


# Item 10 — M03 Assessment & Placement

## Purpose

Capture structured pre-enrolment assessments that evaluate prospective students across subject ability, year-group appropriateness, and placement fit. Assessments bridge the M01 lead pipeline (Assessment Booked → Assessment Done stages) and the M04 enrolment flow. Assessments are always free, never invoiced, and limited to one per subject per student. M03 produces a structured outcome record and placement recommendation that carries forward onto the Student record at conversion.

## What to build

1. **Tenant-level Assessment toggle** (M20) — enables/disables the assessment module for the tenant. When disabled, lead pipeline skips Assessment Booked/Done stages entirely.
2. **Smart slot ranking engine** — filters teacher availability by year group match, subject specialisation, room availability, and teacher preferred assessment hours. Ranks slots by fit score. Surfaces top N slots to Admin or parent.
3. **Admin-scheduled booking** — Admin picks a slot from the ranked list on behalf of the parent directly from the lead record or from the assessment module.
4. **Self-service booking link** — tokenised per-lead URL that Admin generates and shares manually (copy-paste to WhatsApp/email in v1). Parent selects their own slot without Admin involvement.
5. **Public assessment booking page** — general shareable URL (tenant website embed, general marketing) not tied to a specific lead. First-time bookings auto-create a Lead in M01 with stage = Assessment Booked. Page reuses the Lead Enquiry Form from M12 and pre-populates if the guardian email is recognised.
6. **Assessment structure** — default duration 30 minutes, tenant-configurable in M20. Start time offset (buffer before the slot for setup) tenant-configurable.
7. **Reassessment for enrolled students** — Admin-initiated only (HOD or Admin Head). No automation triggers a reassessment. Used when a student requests placement review.
8. **Assessment form with template inheritance** — department-level template is the default for all subjects in that department. Subjects can override with their own template (starts as a copy of the department template, edited freely). Department template changes do not overwrite subjects that have customised their own version. Configured by HOD or Head of Subject.
9. **Assessment outcome record** — structured capture of score, ability rating, year-group appropriateness, feedback notes, recommended subject/tier, recommended teacher, recommended session frequency. Free-text commentary supported.
10. **Outcome PDF generation** — platform generates a formatted PDF summary of the outcome. Admin downloads the PDF and sends it to the parent manually via their own WhatsApp or email (copy-paste/attach fallback in v1).
11. **Outcome carry-forward** — on lead conversion to Student (M02 at Paid/Won stage), assessment outcomes attach to the new Student record as historical placement data visible in M17 Student Profile.
12. **Expected age range reference table** — per year group, tenant-configurable in M20 (IMI default: FS1 3–4, FS2 4–5, Y1 5–6 … Y13 17–18). Assessment form flags age mismatches.

## Data captured

**Assessment entity:** `assessment_id` (UUID), `tenant_id`, `lead_id` (nullable — may link to Student directly for reassessments), `student_id` (nullable — populated on reassessment), `subject_id`, `year_group`, `scheduled_at`, `duration_minutes`, `start_offset_minutes`, `teacher_id`, `room_id` (nullable), `booking_method` (admin_scheduled / self_service_link / public_page), `self_service_token` (nullable), `status` (booked / in_progress / done / cancelled / no_show), `booked_by_user_id`, `booked_at`, `cancelled_at`, `cancelled_reason`, `created_from_public_page` (bool).

**Assessment Outcome entity:** `outcome_id` (UUID), `assessment_id` (1:1), `completed_at`, `completed_by_user_id` (assessing teacher), `score` (numeric or tier, template-defined), `ability_rating` (enum: below/at/above year group), `age_appropriate` (bool), `feedback_structured[]` (template field values), `feedback_commentary` (free text), `recommended_subject_id`, `recommended_tier`, `recommended_teacher_id` (nullable), `recommended_frequency` (sessions/week), `placement_notes`, `pdf_generated_at`, `shared_with_parent_at` (manually logged by Admin on "Mark as sent"), `carried_forward_to_student_id` (nullable).

**Assessment Form Template entity:** `template_id`, `department_id` (nullable for subject-level), `subject_id` (nullable for department-level), `parent_template_id` (nullable — points to department template if this is a subject override), `fields[]` (ordered field definitions with types from F.15 schema), `version`, `status`, `owned_by_role`.

## Rules

**Assessments are always free.** Assessment sessions never generate an invoice and never trigger the AED 300 enrolment fee. One assessment is permitted per subject per student (enforced at booking — duplicate attempts blocked with option to reassess via HOD-approved reassessment).

**Reassessment is Admin-initiated only.** HOD or Admin Head triggers a reassessment from the Student record in M17. No system automation triggers a reassessment. Reassessment creates a new Assessment record with `student_id` populated and `lead_id` null.

**Smart slot ranking** considers: (a) teacher specialises in the year group and subject, (b) teacher has assessment hours marked as available in M05, (c) room available (if the tenant requires room booking), (d) time-of-day matches the tenant's assessment hours policy in M20. Top 5 slots surfaced by default.

**Template inheritance:** Subject templates start as copies of the department template and are edited freely. Changes to a department template propagate only to subjects that have NOT customised their own version. Subjects that have customised are locked from propagation. HOD can force-reset a subject template back to the department baseline with a logged reason.

**Outcome sharing is never automatic.** Admin reviews the outcome and decides what to share with the parent. Platform generates a PDF summary on demand; Admin downloads it and sends externally via copy-paste/attach (v1). "Shared with parent at" timestamp is logged only when Admin clicks "Mark as sent" on the outcome record.

**Outcome carry-forward on conversion:** When a lead converts to a Student at M01 Paid stage, all linked assessment outcomes attach to the new Student record in M17 as historical placement data. Carried-forward outcomes are read-only on the Student record (source of truth remains the Assessment entity).

**Public page lead auto-creation:** Bookings via the public page create a Lead in M01 with `source_channel = public_assessment_page` and pipeline stage = Assessment Booked. Lead pre-population uses guardian email recognition. No DNC check at lead creation (DNC warning applies at outbound contact attempts only).

**No automated parent-side calendar invites in v1.** Assessment details visible on the lead record, in the assessment PDF summary, and on the tenant-native calendar in M05. Google Calendar integration is Phase 2 (planned priority).

**Assessment appears on teacher's M05 calendar automatically on booking confirmation.** This is native Enrolla calendar behaviour, not an external integration.

## Connects

- **F.4 entities** — Lead, Student, Guardian, Subject, Teacher, Room
- **F.7 approval gateway** — reassessment approval by HOD/Admin Head
- **F.10 UI foundation** — all components use Band 1 tokens
- **F.13 automation engine** — M03 emits four trigger events:

| **Event** | **F.13 trigger type** | **Payload** |
|---|---|---|
| `assessment_booked` | Status change | assessment_id, lead_id, scheduled_at, teacher_id, booking_method |
| `assessment_completed` | Status change | assessment_id, outcome_id, ability_rating, recommended_subject_id |
| `assessment_cancelled` | Status change | assessment_id, cancelled_reason |
| `assessment_no_show` | Status change | assessment_id, teacher_id |

- **M01** Lead Management — consumes `assessment_booked` to advance pipeline stage; consumes `assessment_completed` to advance to Assessment Done
- **M02** Student & Guardian CRM — outcome carry-forward target on conversion
- **M05** Timetabling & Scheduling — assessment slot availability, teacher calendar, room availability
- **M09** Staff Performance — teacher assessment completion metrics
- **M10** Management Dashboard — assessment-to-enrolment conversion rate, outcome distribution
- **M11** Academic Courses — subject list and year-group → department mapping
- **M12** People, Forms & Documents — Lead Enquiry Form reused on public assessment booking page
- **M17** Student Profile — carried-forward outcome history display
- **M20** Tenant Settings — assessment toggle, duration default, start offset, age range table, expected age mismatches, assessment hours policy, smart slot ranking weights

## Out of scope (Phase 2)

- **Google Calendar integration** for tenant-level shared calendar or teacher individual calendars (confirmed priority for Phase 2)
- WhatsApp BSP auto-send for booking confirmations, reminders, and outcome delivery
- Email SMTP auto-send for booking confirmations and outcome PDFs
- Automated parent calendar invites (.ics generation or Google Calendar API)
- Self-service reassessment by parents (reassessment remains Admin-initiated only)
- AI-generated outcome commentary (progress report AI narrative is an M19 feature only; M03 outcomes remain teacher-authored in v1)
- Parent portal outcome viewing (Phase 2 per parent portal deferral)
- Automated smart-slot rebalancing when a teacher's availability changes mid-day

## UI specifics

**Booking flow (Admin-scheduled):**
- Ranked slot picker modal — top 5 slots surfaced with fit score, teacher name, time, room
- One-click confirm books and returns to lead record
- Confirmation template surfaced on lead record with "Copy message" / "Mark as sent" pattern

**Self-service booking link generator:**
- "Generate link" button on lead record creates a tokenised URL
- URL displayed in a copy-paste block with expiry date
- Admin sends link manually via their own WhatsApp/email
- Link usage tracked: generated / opened / booked / expired

**Public assessment booking page:**
- Embeddable tenant URL
- Reuses M12 Lead Enquiry Form fields
- Pre-fills on recognised guardian email
- On submission: creates Lead + Assessment in one transaction, pipeline stage = Assessment Booked

**Assessment form (teacher-facing during/after session):**
- Template-driven field layout per department/subject
- Structured fields + free-text commentary
- Age range mismatch flag (visual warning if child DOB is outside expected range for year group)
- Save as draft (in_progress) or Complete (triggers outcome creation)

**Outcome record page:**
- Structured outcome summary
- Placement recommendation panel (subject, tier, teacher, frequency)
- "Generate PDF" button → downloads formatted summary
- "Mark as sent to parent" action with timestamp logging
- Outcome editable until conversion to Student; read-only thereafter (audit trail preserved)

**Calendar view (inherits M05):**
- Assessments appear as a distinct event type on teacher calendars
- Colour-coded by status (booked / in_progress / done / cancelled / no_show)
- Click-through to lead record or assessment detail

---

# Item 11 — M06 Attendance, Makeups & Concern Triggers

## Purpose

Track student presence at every session, manage makeup eligibility against per-department allowances, enforce the 48-hour attendance edit window, and emit attendance-based concern triggers into the platform Concern Engine (F.11). M06 is financially consequential: session deductions occur at attendance confirmation, not at scheduling. M06 extends Band 1 Item 7 (native attendance marking) with makeup policy, absence alert logic, the no-show workflow, and the M06-specific concern trigger set that feeds F.11.

## What to build

1. **Attendance statuses** — Present, Late, Absent — Notified (parent gave ≥24h advance notice), Absent — Not Notified, No Show (absent with no contact).
2. **Marking rules** — attendance can only be marked on or after the scheduled session day. Teachers cannot mark in advance. Admin and Admin Head can mark any session at any time with a logged reason.
3. **No hard attendance lock — tiered reminders instead** — attendance can be marked or corrected at any time by any role with `attendance.mark` or `attendance.correct`. There is no time-based hard lock. Instead, the platform surfaces tiered in-app reminder banners on unmarked sessions: yellow banner at 24 hours past session end, amber banner at 48 hours, red banner at 72 hours+. Banners are visible to the assigned teacher, the department HOD, and Admin. The `attendance.unlockWindow` permission key is retained in the data model but does not gate any UI element — it may be repurposed in a future configuration.
4. **Dual absence signals** — two independent counters displayed together: (a) running count of Absent — Not Notified events in the current term per subject, (b) total absences per subject per term measured against the makeup allowance.
5. **Absence alert logic** — smaller alert (allowance minus 1) and big alert (allowance exceeded) per subject per term. Smaller alert guard condition: never fires when allowance = 1 (Primary) because allowance − 1 = 0.
6. **Unlimited package welfare fallback** — students on unlimited packages have no makeup allowance. A separate consecutive absence threshold (tenant-configurable in M20) fires the big alert chain as a welfare flag only. No makeup entitlement is granted.
7. **Makeup allowance** — Primary (FS1–Y6) = 1 per term per subject. Secondary (Y7–Y13) = 2 per term per subject. Unlimited packages = 0.
8. **Makeup override ladder** — tiered approval when a student needs makeups beyond the standard allowance:

| **Beyond standard allowance** | **Approver** | **Mandatory** |
|---|---|---|
| +1 to +3 makeups | HOD **or** Admin Head | Logged reason |
| More than +3 makeups | Super Admin | Logged reason |

Every override is visible on the student profile (M17) and counted separately in M10 management reporting.

9. **Makeup carry-over** — whole numbers only (no decimal, no percentage). Primary cap = 1 carried over per subject. Secondary cap = 2 carried over per subject. Cap cannot exceed unused makeups at term end. Admin Head can override the per-student cap with a logged reason.
10. **No-show workflow** — Admin must log the no-show reason within 48 working hours of the session. After 48h, no-show is auto-confirmed without a reason and flagged on the Admin dashboard. 2 no-shows in the same subject per term auto-emits a concern trigger (threshold tenant-configurable in M20).
11. **Makeup booking** — Admin (not Teachers) books makeups by selecting an available slot in M05 for the same subject. Makeup is linked to the original missed session. No additional session deduction applies — it fulfils the original.
12. **M06-specific Concern Triggers** — M06 is a major emitter into the platform Concern Engine (F.11). See Connects section for the trigger table.

## Data captured

**Attendance entity:** `attendance_id`, `session_id` (F.4), `student_id`, `subject_id`, `status` (enum), `marked_at`, `marked_by_user_id`, `notice_timestamp` (nullable — for Absent-Notified), `late_minutes` (nullable), `notes`, `unmarked_reminder_sent_at` (nullable — timestamp of first 24h reminder), `unlock_reason` (nullable — retained for historical records).

**Makeup entity:** `makeup_id`, `original_session_id`, `makeup_session_id`, `student_id`, `subject_id`, `term_id`, `reason_code`, `reason_notes`, `booked_by_user_id`, `booked_at`, `is_override` (bool), `override_tier` (nullable: standard / hod_or_head / super_admin), `override_approver_id`, `override_reason`, `carry_over_source_term_id` (nullable).

**Makeup Allowance Ledger (per student, per subject, per term):** `allowance_standard`, `allowance_used`, `allowance_remaining`, `carry_over_in` (from previous term), `override_plus_1_to_3_count`, `override_plus_3_plus_count`, `unlimited_package_flag`.

## Rules

**Session deduction occurs at attendance confirmation, not at scheduling.** This is the financial accuracy foundation — a scheduled session that is later cancelled never deducts. Only a marked Present / Late / Absent (of any type) triggers deduction.

**No hard lock on attendance.** Records can be corrected at any time. The 72-hour reminder cycle (24h yellow / 48h amber / 72h+ red) is the enforcement mechanism. Corrections by any eligible role are permanently logged in the audit trail with the correcting user, timestamp, old value, and new value.

**Teacher marking is restricted to session day forward.** No retroactive marking before session day. No advance marking for future sessions.

**Makeup eligibility by status (within standard allowance):**

| **Status** | **Makeup eligibility within allowance** |
|---|---|
| Absent — Notified | Eligible without additional approval |
| Absent — Not Notified | Eligible; Admin must log reason for absence before booking |
| No Show | **Not eligible** without HOD+ approval regardless of remaining allowance |
| Unlimited package | No entitlement; welfare fallback only |

**Carry-over is whole numbers only.** No decimal, no percentage. Cannot exceed actual unused makeups at term end.

**Smaller alert guard:** when allowance = 1 (Primary), smaller alert never fires because allowance − 1 = 0. Only the big alert fires at allowance exhaustion.

**Big alert v1 channel:** in-app notification to HOD, Receptionist, and a copy-paste template surfaced on the student record for Admin to send to the Guardian manually (WhatsApp/email externally). Phase 2 will add automated outbound dispatch.

**Override ladder is auditable:** every override records tier, approver, reason. M10 reports override rates per department and per approver. High override rates emit a management concern.

**No Show auto-confirmation:** if Admin has not logged a reason within 48 working hours, status is auto-confirmed as No Show and flagged on the Admin dashboard.

## Connects

- **F.4 entities** — Session, Student, Subject, Term, Teacher
- **F.7 approval gateway** — override ladder tier transitions route through F.7
- **F.10 UI foundation** — all components use Band 1 tokens
- **F.11 Concern Engine** — M06 is a primary concern emitter. M06 does not redefine the Concern Engine (F.11 is authoritative for record schema, routing, de-duplication, auto-task creation). M06 declares the M06-specific triggers that raise concerns:

| **M06 trigger** | **Type** | **Default IMI threshold (M20)** |
|---|---|---|
| Attendance % below threshold | Academic | < 80% over last 30 days |
| Consecutive absences (standard package) | Welfare | 3 in same subject |
| Consecutive absences (unlimited package) | Welfare | tenant-configurable, typically 4 |
| No-show cluster | Welfare | 2 in same subject per term |
| Makeup allowance exhaustion | Academic | allowance_remaining = 0 and term_days_remaining > 30 |
| Repeated override (+1 to +3 tier) | Management | 3 overrides for the same student in one term |
| Repeated override (>+3 tier) | Management | any occurrence — auto-escalates to Super Admin |
| 48-hour window breach rate | Management | > 5% of sessions per teacher per month |

- **F.13 automation engine** — M06 emits five trigger events:

| **Event** | **F.13 trigger type** | **Payload** |
|---|---|---|
| `attendance_marked` | Status change | attendance_id, session_id, status, marked_by |
| `attendance_edited` | Status change | attendance_id, old_status, new_status, edited_by, within_48h |
| `no_show_auto_confirmed` | Time-based relative | attendance_id, session_id, 48h elapsed |
| `makeup_booked` | Status change | makeup_id, original_session_id, makeup_session_id, is_override, override_tier |
| `allowance_exhausted` | Threshold breach | student_id, subject_id, term_id |

- **Band 1 Item 7** — native attendance marking (extended by this item)
- **M02** Student & Guardian CRM — dual absence signals displayed on student record
- **M05** Timetabling & Scheduling — makeup slot availability
- **M08** Finance & Billing — attendance confirmation triggers session deduction and invoice reconciliation
- **M10** Management Dashboard — override rate, 48h breach rate, attendance % per cohort
- **M16** Task Management — concern auto-tasks created from M06 triggers (via F.11)
- **M17** Student Profile — attendance view, absence history, override history visible
- **M20** Tenant Settings — allowance defaults, carry-over caps, thresholds, closure day configuration

## Out of scope (Phase 2)

- WhatsApp BSP auto-send for absence alerts, big alert guardian notifications, and makeup booking confirmations (v1 = copy-paste template surfaced + "Mark as sent")
- Email SMTP auto-send for any attendance-related communication
- Automated parent-side early absence notification (parent telling the platform directly) — v1 requires Admin to log notice on behalf of parent
- AI-suggested makeup slot optimisation across the full student cohort
- Bulk makeup booking (one student at a time in v1)
- Attendance marking via teacher mobile app (native M05 calendar view on web only in v1)
- Parent portal attendance viewing
- Predictive attendance risk scoring (M19 handles academic risk; M06 v1 does not predict)

## UI specifics

**Teacher attendance marking view:**
- Session-by-session list filtered to teacher's assigned sessions for today and recent days
- Quick-mark bulk actions (Mark all Present)
- Per-student dropdown: Present / Late / Absent — Notified / Absent — Not Notified / No Show
- Inline notice timestamp field for Absent — Notified
- Reminder banner colour-coded by elapsed time (yellow 24–48h / amber 48–72h / red 72h+), scoped to the current user's role and department

**Admin attendance oversight:**
- 48h window breach alerts on dashboard
- Bulk correction for same-session errors with single reason

**Makeup booking flow (Admin):**
- From student record → "Book makeup" action
- Missed session selector (shows recent absences eligible for makeup)
- Available slot picker from M05 (filtered by subject + student availability)
- Override indicator if allowance is exhausted — surfaces approval requirement tier (HOD/Head or Super Admin)
- Reason field mandatory on override

**Dual absence signal panel** (student record and HOD dashboard):
- "Not Notified count" and "Total absences this term" displayed side-by-side per subject
- Progress bar against allowance
- Smaller alert and big alert visual states

**No-show log modal:**
- Triggered after no-show marking
- Reason required within 48h
- Countdown indicator showing hours remaining before auto-confirmation

**Override history view** (on student record and in M10):
- Chronological list of all makeup overrides
- Tier, approver, reason, date
- Read-only audit trail

---

# Item 12 — M07 Feedback & Communications

## Purpose

Capture per-session teacher feedback, generate AI-assisted write-ups and term summaries, run satisfaction surveys on a defined cadence, manage complaints and tickets with dual sign-off, and host moderated class discussion threads. M07 is the highest-volume AI consumer in the platform (per-session feedback writeup use case, F.12). Feedback flows into M10 management reporting, M17 student profile, M19 progress tracking, and the F.11 concern engine.

## What to build

1. **Per-class feedback capture** — teacher opens a session on M05 calendar, clicks "Add feedback", selects from configurable selectors (rating scales, tick-lists, ability flags) and adds free-text notes. Feedback is attached to the attendance record and visible on student profile.
2. **AI write-up expansion (F.12 use case)** — teacher's raw notes + selector values + redacted student context passed to Claude Sonnet 4 via F.12 pipeline. Returns a structured feedback write-up in the tenant template. Teacher reviews, edits, and confirms before save. Never auto-published.
3. **Feedback selector configuration** — HOD or Head of Subject defines selector sets per department/subject. Selector types: star rating, numeric scale, checkbox list, single-select enum, free-text prompt.
4. **AI term feedback summary** — per student per term, aggregates all per-session feedback into a summary narrative via F.12. Generated on-demand by Admin; editable before share.
5. **Progress reports** — formatted PDF per student per term, composed of M19 predicted grades + M07 feedback summary + attendance % + placement notes. PDF download + copy-paste/attach external send (v1).
6. **Announcements** — tenant-wide, department-wide, class-wide, or student-specific announcements. Posted in-app; copy-paste template surfaced for external distribution.
7. **M07.A Complaints & Ticket Management** — structured complaint capture, two-record system (complaint + linked tickets), category taxonomy, status flow, dual sign-off, escalation, recurring complaint auto-meeting trigger.
8. **M07.B Satisfaction Surveys (NPS)** — NPS-format short survey with fixed cadence: **every term, dispatched 2 weeks before term end, 7-day response window, day-4 reminder**. Detractor responses emit F.11 concern triggers. Promoter responses feed the Google Review funnel.
9. **M07.C Class Discussion** — moderated threads per class; teacher-created, participants = teacher + students + optionally parents; post types (note, question, announcement, resource); moderation by teacher and HOD.

## Data captured

**Feedback entity:** `feedback_id`, `session_id`, `student_id`, `teacher_id`, `subject_id`, `selector_values` (JSON, selector_id → value), `raw_notes` (free text from teacher), `ai_writeup_text` (nullable), `ai_writeup_edited` (bool), `ai_call_id` (nullable, links to F.12 usage log), `confirmed_at`, `confirmed_by_user_id`, `visible_to_roles[]`.

**Feedback Summary entity:** `summary_id`, `student_id`, `subject_id`, `term_id`, `narrative_text`, `source_feedback_ids[]`, `ai_call_id`, `generated_at`, `edited_at`, `shared_with_parent_at` (nullable), `included_in_progress_report_id` (nullable).

**Complaint entity:** `complaint_id`, `raised_by_user_id`, `raised_on_behalf_of` (student/guardian/staff), `category` (enum from taxonomy), `description`, `status` (new / investigating / resolved / escalated / closed), `severity`, `dual_sign_off_primary_id` (nullable), `dual_sign_off_secondary_id` (nullable), `escalation_path[]`, `created_at`, `closed_at`, `linked_ticket_ids[]`.

**Complaint Ticket entity:** `ticket_id`, `complaint_id`, `assigned_to_user_id`, `action_required`, `due_at`, `status`, `resolution_notes`.

**Survey Response entity:** `response_id`, `survey_id`, `respondent_guardian_id`, `respondent_student_id` (nullable), `nps_score` (0–10), `category` (promoter/passive/detractor), `comment`, `submitted_at`, `concern_triggered_id` (nullable).

**Class Discussion Thread entity:** `thread_id`, `class_id`, `created_by_user_id`, `title`, `participants[]`, `posts[]`, `moderation_log[]`, `is_locked`, `created_at`.

## Rules

**AI write-up governance (F.12 compliance):**
- Every AI call goes through F.12 PII redaction: student name → "Student A", guardian/staff names → redacted, role labels only.
- Temperature 0.5 for feedback summaries (template-flexible), 0.3 for progress report narratives (consistency-critical).
- Max 4000 output tokens. One automatic retry on failure; then template fallback (unexpanded teacher notes shown as-is with "AI unavailable" flag).
- Teacher always reviews and can edit before save. **No AI output is published without human confirmation.**
- Cost ceiling ($250/month IMI default) enforced per F.12 fallback ladder: queue non-urgent → disable new generations → alert Super Admin + Developer role.

**Per-class feedback is mandatory-optional:** system surfaces the "Add feedback" prompt on every confirmed-attended session, but feedback is not a blocker for attendance confirmation. Teacher can skip. Skipped feedback is visible in M09 staff performance metrics.

**NPS survey cadence:** 3 times per year (one per term), dispatched 2 weeks before term end, 7-day response window, automated reminder at day 4. Tenant-overridable in M20.

**Detractor handling:** Any NPS response with score 0–6 auto-emits a concern trigger to F.11 routed to Admin Head (IMI default). Detractor comments are highlighted in M10 reporting.

**Google Review funnel:** Promoter responses (score 9–10) surface a copy-paste thank-you message with a Google Review link for Admin to send manually. No automated outbound. Phase 2 will automate.

**Post-approval feedback sharing task:** When a feedback record is approved and signed off by HOD or Academic Head, the platform automatically creates a task in M16:
- Title: "Share feedback with parent — [Student Name]"
- Type: Admin
- Priority: Medium
- Assignee: the branch Admin (or the assigned Admin on the student record if populated)
- Due date: next calendar day
- Description: "Feedback for [Student Name] has been approved by [Approver Name]. Please share it with the parent via WhatsApp or their preferred channel."
- Linked record: the student record

This task appears in the tasks list and on the student's task log. In v1 there is no automated parent delivery — Admin manually shares the approved feedback and marks the task complete.

**Complaint dual sign-off:** Complaints of severity Medium+ require two signatories to close (primary investigator + reviewer from a different role/department). Single sign-off complaints (Low severity) can be closed by the assigned Admin alone.

**Recurring complaint auto-meeting trigger:** 3 complaints against the same teacher in a rolling 90-day window auto-creates a task in M16 assigned to HOD + Admin Head: "Schedule review meeting." Not auto-scheduled in v1 (calendar integration Phase 2); task surfaces the requirement.

**Announcements are in-app only in v1.** External distribution = copy-paste template with merge fields resolved.

**Class discussion moderation:** Teachers moderate own class threads. HOD can override. Flagged posts hide pending review. No parent-initiated posts in v1 (parents read-only where the parent is a participant).

## Connects

- **F.4 entities** — Session, Student, Teacher, Subject, Class, Guardian
- **F.7 approval gateway** — complaint escalation tier transitions
- **F.10 UI foundation** — all components use Band 1 tokens
- **F.11 Concern Engine** — M07 emits detractor NPS responses, recurring complaints, and repeated "skipped feedback" events as concerns; does not redefine F.11
- **F.12 AI Integration Rules** — M07 is the highest-volume consumer; all three AI use cases routed through F.12 pipeline with redaction, logging, cost ceiling, fallback
- **F.13 automation engine** — M07 emits the following trigger events:

| **Event** | **F.13 trigger type** | **Payload** |
|---|---|---|
| `feedback_confirmed` | Status change | feedback_id, session_id, student_id, ai_used (bool) |
| `feedback_summary_generated` | Status change | summary_id, student_id, term_id |
| `complaint_raised` | Status change | complaint_id, category, severity |
| `complaint_escalated` | Status change | complaint_id, escalation_tier |
| `complaint_resolved` | Status change | complaint_id, resolved_by, dual_sign_off |
| `survey_response_received` | Status change | response_id, nps_score, category |
| `detractor_flagged` | Threshold breach | response_id, score, comment |
| `announcement_posted` | Status change | announcement_id, scope, audience |

- **Band 1 Item 7** — attendance records attach feedback
- **M06** Attendance & Makeups — per-session feedback keyed to attendance
- **M09** Staff Performance — feedback completion rate per teacher
- **M10** Management Dashboard — NPS trends, complaint volume by category, AI usage stats
- **M13** Automation & Communications — announcement templates, survey dispatch templates
- **M16** Task Management — auto-tasks from complaints, recurring complaint meetings
- **M17** Student Profile — feedback history, term summaries, progress reports
- **M19** Progress Tracking — feedback summaries feed progress report composition
- **M20** Tenant Settings — selector configurations, NPS cadence override, complaint taxonomy, dual sign-off thresholds

## Out of scope (Phase 2)

- WhatsApp BSP / Email SMTP auto-dispatch for NPS surveys, announcements, progress reports, and complaint updates (v1 = copy-paste template + "Mark as sent")
- Automated Google Review submission (v1 = copy-paste link for Admin to send)
- Automated calendar scheduling for recurring complaint meetings (v1 = task in M16 only)
- Parent posting rights in class discussion threads (read-only in v1 where participant)
- AI-generated announcement drafting (human-authored only in v1)
- Voice-to-text teacher feedback input (text only in v1)
- Multi-language feedback write-ups (English only per locked rule)
- Real-time survey response dashboards (overnight batch refresh only)

## UI specifics

**Feedback capture modal** (teacher on M05 session):
- Selector panel on left (configured per subject)
- Free-text notes box
- "Expand with AI" button → loading state → editable AI write-up appears
- Teacher can accept, edit, or discard AI output
- Save & close

**AI usage indicator:**
- Per-tenant AI cost meter visible in M20 to Admin Head and Super Admin
- Progress bar against monthly ceiling
- Alert banner at 80%, 95%, 100% of ceiling

**Complaint intake form:**
- Category tree (searchable)
- Severity selector (Low / Medium / High / Critical)
- Subject-of-complaint selector (student, staff, process)
- Description
- Attachment upload (documents only; image redaction Phase 2)

**NPS survey surface:**
- In-app notification 2 weeks before term end
- Copy-paste template with tokenised survey link for Admin to send externally
- Response dashboard refreshes overnight

**Class discussion thread view:**
- Chronological post list
- Moderation flag action
- Locked thread indicator
- Post type badges

---

# Item 13 — M14 Assignment Library

## Purpose

Curate a structured curriculum index of reusable assignment templates (classwork, homework, tests, projects) organised by department, year group, subject, and topic. M14 is a **curriculum index, not a file repository** — it stores assignment definitions, not uploaded worksheet files. M14 feeds M19 Progress Tracking with the weighted attempt data that drives predicted grades. Also supports **Quick Score Entry** from the session view for fast classroom scoring. M14 must be built before M19.

## What to build

1. **Folder-based library structure** — hierarchical: Department → Year Group → Subject → Topic → Assignment. Each folder level is configurable; tenants can adjust depth in M20 (IMI default: 4 levels).
2. **Assignment types** — Classwork, Homework, Test, Project, Oral assessment. Each type has distinct field requirements and different predicted grade weightings.
3. **Assignment template definition** — title, description, topic tag, work type, grading scale reference, max score, weight (for predicted grade), estimated duration, version.
4. **Version history** — each republish creates a new version; prior versions retained; previously assigned versions are not retroactively updated (locked to the version at time of assignment).
5. **Personal drafts** — teachers can maintain private drafts before publishing to the shared library. Drafts are not visible to other staff.
6. **Library visibility and ownership** — published assignments owned by the publishing teacher by default; HOD or Head of Subject can reassign ownership or publish on behalf of the department.
7. **Grading scales** — tenant-configurable (percentage, letter grade A*–U, IGCSE 9–1, custom band). Each assignment references a scale. M20 defines the active scales.
8. **Assign work to students** — teacher selects assignment(s), target student(s), due date, optional weighting override. Creates one **Assignment Record** per student with its own status flow.
9. **Submission tracking** — per-student statuses: Not Started / In Progress / Submitted / Late / Marked / Resubmitted / Exempted.
10. **Marking and feedback** — teacher enters score, feedback notes, bulk-mark view, filter by status/class/due date. Mark date auto-sets to today; editable if retroactive.
11. **Quick Score Entry from session view (M14.A)** — teacher on an M05 session view can log classwork scores for all attending students in one table without leaving the session. Fastest path to logging in-class performance.
12. **Absent-zero handling** — students marked Absent in attendance get automatic zeros on that session's classwork, tagged with reason: Absent. Included in averages and predicted grade. Absent flag retained on attempt record for context (differentiates from genuine zeros).
13. **Attempt tracking** — every score creates an Attempt record (student + assignment + score + date + reason flag if applicable). Feeds M19 progress timeline.
14. **PDF and Word export** — export assignment definitions, student worksheets, and marked results.

## Data captured

**Assignment Template entity:** `template_id`, `tenant_id`, `folder_path` (dept/year/subject/topic), `title`, `description`, `assignment_type` (enum), `work_type` (classwork/homework/test/project/oral), `grading_scale_id`, `max_score`, `predicted_grade_weight`, `estimated_duration_minutes`, `version`, `parent_version_id` (nullable), `owner_user_id`, `status` (draft/published/archived), `created_at`, `published_at`.

**Assignment Record entity (per student):** `assignment_record_id`, `template_id`, `template_version`, `student_id`, `assigned_by_user_id`, `assigned_at`, `due_at`, `status` (enum), `weight_override` (nullable), `exempted_reason` (nullable).

**Attempt entity:** `attempt_id`, `assignment_record_id`, `student_id`, `template_id`, `score`, `max_score`, `grading_scale_id`, `marked_at`, `marked_by_user_id`, `feedback_text`, `reason_flag` (nullable: absent / late / exempted / override), `absent_flag_retained` (bool), `session_id` (nullable — populated when scored via Quick Score Entry from M05 session), `attempt_number` (for resubmissions).

**Classwork Item entity (M14.A):** `classwork_item_id`, `session_id`, `template_id`, `same_for_all_students` (bool), `date_of_completion`, `created_by_user_id`.

## Rules

**M14 is an index, not a file store.** Assignment templates describe what students should do; they do not host uploaded worksheet PDFs in v1. File hosting and submission upload is Phase 2. In v1, teachers reference external materials via description text and links.

**Version locking on assignment:** when a teacher assigns a template to students, the Assignment Records snapshot the template version in use. Subsequent edits to the template produce a new version; already-assigned records do not change.

**Absent-zero rule (authoritative for M14 and M19):**
- Student marked Absent in attendance → classwork items for that session auto-score zero with `reason_flag = absent`
- Homework with due date on an absent day → auto-Late with `reason_flag = absent`; zero applied if no prior submission
- If teacher pre-logged homework as Submitted before the absent day → prior submission stands, no auto-zero
- **Absent zeros are included in averages and predicted grade calculations** (M19)
- `absent_flag_retained = true` distinguishes from genuine zeros for context in reports and attempt history views
- Teacher can override auto-zero with a logged reason (e.g. student completed work from home)

**Predicted grade weighting by work type:**
- Tenant-configurable in M20 per subject or department
- IMI defaults (proposed; confirm in M20 setup): Tests 40%, Projects 25%, Homework 20%, Classwork 10%, Oral 5%
- Weights must sum to 100% per subject

**Quick Score Entry is the primary path for classwork.** From the M05 session view, teacher sees a table of attending students × classwork items for the session. Scores entered here create Attempt records and feed M19 immediately. Satisfies the 24-hour tracker update requirement — if at least one classwork score is logged for a session, the 24-hour "no progress update" alert does not fire.

**Same for all vs different per student:** Quick Score Entry supports both modes — one classwork item given to the whole class with individual scores, or different items assigned per student.

**Marking can be retroactive.** Teachers can enter scores after the original mark date; the entry reflects the actual completion date, and the system logs both the completion date and the entry timestamp.

**Notifications:**
- Assignment marked → copy-paste message template surfaced for Admin or teacher to send to parent externally
- M19 update triggered by assignment mark → silent background update; no user-facing notification

**Exempted status:** HOD or Admin Head can mark an assignment record as Exempted with a logged reason. Exempted assignments are excluded from averages and predicted grade. Student profile shows the exemption in history.

## Connects

- **F.4 entities** — Student, Subject, Session, Teacher, Term
- **F.7 approval gateway** — HOD exemption approvals
- **F.10 UI foundation** — Band 1 tokens throughout
- **F.11 Concern Engine** — M14 does not directly emit concerns; M19 (which consumes M14 data) is the emitter for academic-performance concerns
- **F.13 automation engine** — M14 emits four trigger events:

| **Event** | **F.13 trigger type** | **Payload** |
|---|---|---|
| `assignment_published` | Status change | template_id, version, folder_path |
| `assignment_assigned` | Status change | assignment_record_id, student_id, template_id, due_at |
| `attempt_marked` | Status change | attempt_id, student_id, score, reason_flag |
| `quick_score_entered` | Status change | session_id, student_ids[], classwork_item_id |

- **Band 1 Item 7** — attendance status feeds absent-zero logic
- **M05** Timetabling — session view hosts Quick Score Entry
- **M06** Attendance — Absent status drives auto-zero flags
- **M09** Staff Performance — marking timeliness metrics per teacher
- **M17** Student Profile — assignment history tab
- **M19** Progress Tracking — **primary downstream consumer**; attempts feed predicted grade, averages, progress timeline
- **M20** Tenant Settings — grading scales, weight defaults, folder hierarchy depth, absent-zero override policy

## Out of scope (Phase 2)

- File upload / worksheet hosting in the library (v1 stores definitions and links only)
- Student submission uploads (written submissions, photos of work)
- Parent portal assignment viewing
- AI-generated assignment draft suggestions (teacher-authored only in v1)
- Automated plagiarism detection on submissions
- Bulk assignment import from external curriculum providers
- Automated notification dispatch to parents on marked feedback (v1 = copy-paste)
- Real-time collaborative assignment editing between teachers

## UI specifics

**Library browser:**
- Tree view of folder hierarchy on left
- Assignment list on right with filters (type, work type, scale, owner, last updated)
- Search across title, description, topic tags
- "Create from existing" clones a template as a draft

**Assignment creation form:**
- Folder path selector (breadcrumb)
- Type, work type, scale, max score, weight
- Description editor (rich text)
- Save as draft / Publish

**Quick Score Entry table (M14.A) — primary classwork path:**
- Opens from M05 session view
- Rows = attending students (from attendance marking)
- Columns = classwork items defined for the session
- Same-for-all mode: single column across all students
- Different-per-student mode: separate columns per student
- Absent students show "ABS" in score cells with zero auto-applied and absent flag visible
- One-click save writes Attempt records for every filled cell

**Bulk marking view:**
- Filter by class, due date, status
- Inline score entry
- Bulk "Mark all as Submitted" / "Apply score X to selected"

**Assignment history on Student Profile (M17):**
- Chronological attempt list
- Filter by subject, work type, date range
- Visual flags for absent zeros (distinct from genuine zeros)
- Exemption indicators

**Export:**
- PDF export of assignment definition (printable worksheet reference)
- Word export of assignment (teacher-editable)
- PDF export of marked results per class

---

# Item 14 — M19 Progress Tracking & Academic Alerts (Part 1)

## Purpose

Track every student's academic progress per subject per topic across the term and year, derive predicted grades from weighted attempts, generate AI-authored progress report narratives on a defined cadence, and emit academic concern triggers into F.11. M19 is the heaviest item in Band 2 and the terminal consumer of data from M14 (assignment attempts), M06 (attendance), M11 (target grades), and M17 (student context). Progress reports are the tenant's most visible parent-facing deliverable. M19 absorbs AMD-02.13 (absent zeros included in grade calculations) and ships with the forward-only absent-zero rule confirmed in Band 2 foundations.

**Note on split delivery:** Item 14 is split across two turns for depth. Part 1 (this turn) covers Purpose, What to build, Data captured, and Rules. Part 2 covers Connects, Out of scope, and UI specifics including the AI narrative generation flow and F.11 concern trigger set.

## What to build

1. **Progress Tracker (one per student per subject per term)** — structured record of all topics covered, teacher remarks per topic, linked attempts, evaluation tier, absences within cycle, and computed predicted grade.
2. **Tracker fields** — topic name, topic link (connects session to topic), teacher remarks, linked attempts (from M14), completion status, date last updated, evaluation tier.
3. **Tracker lifecycle** — created on student enrolment in a subject; rolled over at term boundaries; two-year qualifications (GCSE, A-Level, IB, MYP) use a **single two-year tracker** that locks Year 1 topics once complete and resumes Year 2 on re-enrolment if the student temporarily withdraws.
4. **Evaluation tier system** — per topic, scores assigned to tiers: On Track (green), Requires Support (amber — below pass threshold, **including absent zeros**), Exceeding (blue). Tier determines intervention routing.
5. **48-hour remark update rule** — teachers must update tracker remarks within 48 hours of saving topic links for a session. **Clock starts at topic link save time, not session end time** (this is a distinct window from M06's 48h attendance edit window, which is session-end-based). Breach flags on teacher's M10 dashboard and notifies HOD in-app.
6. **Past Paper section** — per subject, stores past paper attempts separately from standard assignments. Each entry records paper source, date attempted, score, max, analysis notes. Feeds a past-paper-specific section in the report PDF.
7. **Intervention tracking** — when a topic enters Requires Support tier, an intervention record is created. Tracks intervention type (re-teach, tutoring, parent meeting, HOD review), owner, status, outcome, linked sessions.
8. **Report generation (term cadence)** — one progress report per student per subject per term. Department-configurable skip rules for 100%-absent students (options: always generate / skip / prompt HOD).
9. **AI narrative generation (F.12 use case)** — assembles tracker data, attempts, attendance, target grade, and feedback summaries. Sends redacted context to Claude Sonnet 4 via F.12. Temperature 0.3 for consistency. Returns a structured narrative in four sections: current performance, topics covered, areas for focus, predicted trajectory.
10. **Approval workflow** — AI narrative is **draft-only**. Teacher reviews, edits freely, marks ready. HOD approves before parent-facing release. Admin Head can override HOD with logged reason.
11. **Report PDF structure** — tenant-branded cover, student summary, tracker snapshot, past paper section, AI narrative, intervention history (if any), target vs predicted, teacher signature, HOD approval mark.
12. **Report delivery** — v1 = PDF download; copy-paste template surfaced with placeholder for Admin or teacher to send externally via their own WhatsApp or email. "Mark as delivered" logs the dispatch. Read tracking is Phase 2.
13. **Qualification-specific structures** — Standard one-year courses, two-year qualifications (locked Year 1 topics), module-based qualifications (per-module tracker slices).
14. **Forward-only absent-zero rule** — applies from Band 2 go-live date. Historical attendance data is NOT retroactively processed. A one-time admin backfill tool in M20 allows Super Admin to process historical data if desired, with a logged reason and a preview of affected records before commit.
15. **Two-year tracker lock (centre-wide graduation date)** — once a cohort's centre-wide graduation date has passed, all two-year trackers for that cohort lock permanently. No edits, no report regeneration. Read-only for audit and archival. Governed by M20 graduation date setting.
16. **Predicted grade engine** — computed from weighted attempts per M14 work type weights + target grade reference from M11. Default weighting (before HOD customises): equal-weight average across all graded attempts. HOD can set a custom weighting formula in M20.
17. **Academic alert system (M19.A)** — rolling-window performance signals emit F.11 concerns when thresholds breach. Detailed in Part 2 Connects section.

## Data captured

**Progress Tracker entity:** `tracker_id`, `student_id`, `subject_id`, `term_id` (or `two_year_window_id` for KS4/KS5), `qualification_type` (standard/two_year/module_based), `target_grade_id` (from M11), `predicted_grade` (current), `predicted_grade_updated_at`, `evaluation_tier_summary`, `topics[]` (embedded or linked), `created_at`, `locked` (bool — true when cohort graduation date passed), `locked_at`.

**Tracker Topic entity:** `tracker_topic_id`, `tracker_id`, `topic_name`, `topic_link_saved_at` (starts the 48h remark clock), `teacher_remarks`, `remarks_updated_at`, `linked_attempt_ids[]` (from M14), `completion_status`, `evaluation_tier` (on_track/requires_support/exceeding), `session_ids[]` (sessions where topic was covered), `locked` (bool — true when year 1 completed in two-year tracker).

**Past Paper Attempt entity:** `past_paper_id`, `tracker_id`, `subject_id`, `paper_source`, `paper_year`, `attempted_at`, `score`, `max_score`, `analysis_notes`, `logged_by_user_id`.

**Intervention entity:** `intervention_id`, `tracker_topic_id`, `student_id`, `intervention_type` (enum: re_teach, tutoring, parent_meeting, hod_review), `owner_user_id`, `status` (open/in_progress/closed), `opened_at`, `closed_at`, `outcome_notes`, `linked_session_ids[]`.

**Progress Report entity:** `report_id`, `tracker_id`, `student_id`, `subject_id`, `term_id`, `cycle_number`, `status` (draft/teacher_ready/hod_approved/dispatched/skipped), `ai_narrative_text`, `ai_call_id` (nullable — links to F.12 usage log), `narrative_edited_at`, `teacher_user_id`, `teacher_confirmed_at`, `hod_user_id`, `hod_approved_at`, `admin_head_override_user_id` (nullable), `pdf_generated_at`, `dispatched_at` (manual "mark as delivered"), `skip_reason` (nullable).

## Rules

**Absent zeros are included in all calculations.** Scores recorded with `reason_flag = absent` from M14 count as zero in score averages, predicted grade calculations, and evaluation tier determination. The `absent_flag_retained` field distinguishes them from genuine zeros for display and analysis. This removes the incentive for students to skip graded sessions to protect their predicted grade. A student who skips enough graded sessions will trigger an intervention through absence alone.

**Forward-only from Band 2 go-live.** The absent-zero rule applies to all attempts created on or after the Band 2 deployment date. Historical attempts are not retroactively reprocessed. A one-time backfill tool in M20 is available to Super Admin: it takes a date range, previews affected records and score changes, and requires an explicit confirm + logged reason before commit. Backfill is irreversible once committed; M20 warns the Super Admin accordingly.

**48-hour remark window starts at topic link save time.** This is distinct from M06's 48-hour attendance edit window (which starts at session end time). Rationale: a session may end before topics are linked; topics may be linked retrospectively. The remark clock tracks when the topic was formally logged, not when the session physically ended. Configurable in M20.

**Two-year tracker lock on cohort graduation:** each tenant defines a centre-wide graduation date in M20 per cohort (IMI: one date per academic year, typically end of July). Once that date passes, every two-year tracker for that cohort locks. Locked trackers are read-only: no edits, no new attempts, no report regeneration. Historical reports remain accessible; new reports cannot be generated. Lock is irreversible.

**AI narrative governance (F.12 compliance):**
- PII redaction per F.12 — student name → "Student A"; guardian/staff names redacted; role labels only
- Temperature 0.3 (consistency-critical for reports)
- Max 4000 output tokens
- One retry on failure; then template fallback (structured data shown without AI commentary, flagged "AI unavailable — teacher to author manually")
- Cost ceiling enforced per F.12 fallback ladder: queue non-urgent → disable new generations → alert Super Admin + Developer
- **AI narrative is never auto-published.** Teacher review → HOD approval → dispatch (manual copy-paste)

**Report approval workflow:**
- Draft → Teacher Ready (teacher confirms) → HOD Approved → Dispatched
- HOD can reject back to Teacher with comments
- Admin Head can override HOD approval only with logged reason (F.7 gateway)
- Dispatch is manual — "Mark as delivered" on PDF download

**Report skip rules** per department (M20):
- Always generate (default)
- Skip if student 100% absent for the cycle
- Prompt HOD to decide per case

**Predicted grade computation:**
- Default formula: equal-weight average across all graded attempts for the subject
- HOD may configure a custom weighted formula in M20 (weights by M14 work type, e.g. Tests 40% / Projects 25% / Homework 20% / Classwork 10% / Oral 5%)
- Weights must sum to 100% per subject
- Absent zeros counted at zero, not excluded

**Intervention auto-open:** topic entering Requires Support tier for N consecutive updates (N tenant-configurable in M20, IMI default: 2) auto-creates an Intervention record routed to HOD.

**24-hour no-progress-update alert:** if a session was scheduled and attended but no topic links saved and no Quick Score Entry logged within 24 hours of session end, an alert fires to the teacher and HOD. Logging either a topic link OR a classwork score in M14 Quick Score Entry satisfies this rule (M14.A hook — already defined in Item 13).

---

## Connects (M19 Part 2)

- **F.4 entities** — Student, Subject, Term, Session, Topic, Teacher, Cohort
- **F.7 approval gateway** — HOD report approval, Admin Head override of HOD, Super Admin backfill tool authorisation
- **F.10 UI foundation** — all components use Band 1 tokens
- **F.11 Concern Engine** — M19 is a primary emitter of academic concerns via the **Academic Alert System (M19.A)**. M19 does not redefine F.11; it declares its own trigger set. Rolling windows and thresholds are tenant-configurable in M20.

**M19.A Academic Alert trigger set** (emitted to F.11):

| **M19.A trigger** | **Signal type** | **Default IMI threshold** | **Rolling window** |
|---|---|---|---|
| Predicted grade drop ≥ 2 bands | Academic | 2 or more bands below previous tracker snapshot | 30 days |
| Evaluation tier degradation | Academic | On Track or Exceeding → Requires Support | 2 consecutive updates |
| Requires Support persistence | Academic | Topic remains in Requires Support tier | 14 days |
| Predicted vs target gap | Academic | Predicted grade more than 2 bands below target grade | Current snapshot |
| Tracker update stall | Operational | No remark update or topic link save | 14 days |
| Past paper score decline | Academic | 3 consecutive past paper attempts showing downward trend | Rolling 3 attempts |
| Intervention without progress | Welfare/Academic | Intervention open | > 21 days with no outcome notes |
| Absent-zero pattern | Welfare | 3 or more absent zeros in the same subject | Current term |

Every M19.A trigger routes to HOD by default (M20-overridable). Critical severity auto-escalates to Admin Head per F.11 routing rules. Every concern creates a linked task in M16.

- **F.12 AI Integration Rules** — M19 is a heavy consumer (progress report narratives + predicted grade commentary). All calls routed through the F.12 pipeline. Cost governance, PII redaction, fallback ladder all inherited.
- **F.13 automation engine** — M19 emits the following trigger events:

| **Event** | **F.13 trigger type** | **Payload** |
|---|---|---|
| `tracker_created` | Status change | tracker_id, student_id, subject_id, term_id |
| `topic_link_saved` | Status change | tracker_topic_id, session_id, saved_at |
| `remark_updated` | Status change | tracker_topic_id, updated_by, remark_text_length |
| `48h_remark_breach` | Time-based relative | tracker_topic_id, teacher_id, hod_id |
| `24h_no_progress_update` | Time-based relative | session_id, teacher_id, hod_id |
| `evaluation_tier_changed` | Status change | tracker_topic_id, from_tier, to_tier |
| `predicted_grade_changed` | Status change | tracker_id, from_grade, to_grade, delta_bands |
| `intervention_opened` | Status change | intervention_id, topic_id, type, owner |
| `intervention_closed` | Status change | intervention_id, outcome |
| `report_ai_generated` | Status change | report_id, ai_call_id, tokens, cost_usd |
| `report_teacher_ready` | Status change | report_id, teacher_id |
| `report_hod_approved` | Status change | report_id, hod_id |
| `report_dispatched` | Status change | report_id, dispatched_by, dispatched_at |
| `tracker_locked` | Time-based absolute | tracker_id, cohort_id, graduation_date |

- **Band 1 Item 7** — attendance records feed absent-zero flags on attempts
- **M02** Student & Guardian CRM — student metadata, target grade reference
- **M05** Timetabling & Scheduling — session context for topic linking
- **M06** Attendance & Makeups — absent status drives absent-zero entries in attempts
- **M07** Feedback & Communications — term feedback summaries embedded in progress reports
- **M09** Staff Performance — 48h remark compliance rate, report approval turnaround per teacher
- **M10** Management Dashboard — predicted grade distribution, intervention rate, report dispatch rate, academic concern heatmap
- **M11** Academic Courses — target grade reference, subject/topic catalogue, qualification type (standard/two-year/module-based)
- **M14** Assignment Library — **primary upstream source**: every Attempt from M14 feeds tracker calculations
- **M16** Task Management — concern-driven tasks auto-created from M19.A triggers; report approval tasks for HOD
- **M17** Student Profile — tracker snapshot, progress timeline, intervention history, report archive
- **M18** Guardian Profile — progress report dispatch log visible per guardian
- **M20** Tenant Settings — evaluation tier thresholds, 48h window, 24h no-update window, alert thresholds (M19.A), predicted grade weighting formulas, report skip rules, cohort graduation dates, AI cost ceiling, absent-zero backfill tool

## Out of scope (Phase 2)

- **Report delivery automation** — WhatsApp BSP auto-dispatch of PDFs, email SMTP auto-send, read-receipt tracking (v1 = manual copy-paste + "Mark as delivered")
- **Parent portal viewing** of progress reports and tracker snapshots (Phase 2 per parent portal deferral)
- **Historical attendance retroactive processing** beyond the one-time Super Admin backfill tool — no ongoing retroactive reprocessing
- **AI narrative in languages other than English** (locked rule: English only in v1)
- **AI-authored intervention recommendations** — interventions are human-authored in v1; AI only produces narrative descriptions
- **Automated grade boundary updates** when exam boards publish new boundaries (manual update via M20 in v1)
- **Predicted grade history graphing** beyond current and previous snapshot (richer timeline visualisation Phase 2)
- **Cross-cohort benchmarking** (comparing individual student against cohort averages in the report) — Phase 2
- **Student self-service tracker viewing** (student portal Phase 2)
- **Bulk regeneration of reports** across a cohort — v1 generates per-student on demand
- **Automated two-year tracker unlock** — once locked by cohort graduation date, no automated unlock path exists
- **Parent feedback loop on reports** (rating, acknowledgement, reply) — Phase 2
- **AI progress commentary on past paper trends** specifically — v1 AI narrative covers overall progress only
- **Voice-dictated teacher remarks** (text entry only in v1)

## UI specifics

**Tracker View (primary teacher workspace):**
- Grid layout: rows = topics, columns = session updates over time
- Cell contents: teacher remarks summary, linked attempts count, evaluation tier colour (green/amber/blue)
- Left panel: student selector + subject filter + term/year selector
- Right panel: tracker summary card (predicted grade, target grade, tier distribution, absent-zero count)
- Inline "Save topic link" action on any session cell — starts the 48h remark clock
- Breach indicator: red outline on topic cells past the 48h window without remark update
- Two-year tracker mode: Year 1 topics displayed with lock icon once completed
- Locked trackers (post-graduation): full read-only with "Locked — graduation date passed" banner

**Report Management View (HOD workspace):**
- Kanban columns: Draft / Teacher Ready / HOD Approval Queue / Approved / Dispatched / Skipped
- Card shows: student name, subject, cycle, teacher, AI generation status, days in current status
- Click-through to full report preview
- Approval actions: Approve / Reject with comments
- Admin Head override button (with mandatory reason field, logged to F.7)
- Bulk approve action disabled in v1 (per-report review required)

**Report Preview:**
- Full PDF preview inline
- Tabs: Summary / Tracker Snapshot / Past Papers / AI Narrative / Interventions / Target vs Predicted
- AI Narrative tab shows: generated text, teacher edits, edit history, F.12 call metadata (token count, cost, timestamp)
- "Regenerate narrative" button (respects F.12 cost ceiling — disabled with warning when ceiling near breach)
- "Mark as delivered" action after PDF download

**Intervention Tracker:**
- List of open and recent interventions filtered by subject, student, status, owner
- Each intervention card: topic link, student, owner, days open, linked sessions, outcome notes
- Close intervention action with mandatory outcome text
- Auto-created interventions flagged with system origin

**Progress Timeline (student profile tab):**
- Chronological view of all tracker events for the student
- Filters: subject, event type (remark / attempt / tier change / intervention / report)
- Predicted grade line chart over time (current and previous snapshots only in v1)
- Absent zero indicators on attempts

**Academic Alert Dashboard (HOD view):**
- Live view of M19.A concern triggers firing against the HOD's department
- Grouped by trigger type with count + affected student list
- Click-through to the concern record (F.11) and linked task (M16)
- Acknowledge / Assign / Resolve actions inline (state flows through F.11)

**AI Cost Meter Widget (reused from M07 Item 12):**
- Displayed on Report Management view when near ceiling
- Progress bar with current spend / ceiling
- Warning banner at 80%, 95%, 100%
- Fallback state UI when ceiling breached: "AI unavailable this period — contact Super Admin"

**Backfill Tool (M20, Super Admin only):**
- Date range selector
- "Preview affected records" — shows count of attempts that would be updated, broken down by subject, and net score changes per student
- Mandatory logged reason text
- Two-step confirmation: preview → confirm → irreversible commit
- Post-commit audit log entry with all changed records

---

# Item 15 — M16 Task Management

## Purpose

Replace ClickUp as the operational task system. M16 is the consolidation point for every actionable item across the platform: concern-driven tasks auto-created from F.11, automation-driven tasks emitted by F.13, manual tasks created by staff, recurring operational tasks, and template-based bulk task creation. M16 underpins M19's academic alerts, M06's concern workflows, and most staff daily operations. It is the default "inbox" for every Enrolla user.

## What to build

1. **Task entity with rich fields** — title, description, type, priority, due date, assignee(s), watchers, linked record, subtasks, attachments, status, tags, audit log.
2. **Four task types with visibility rules** — Personal (private to creator), Department (visible to department members), Office-wide (visible to all staff), Role-scoped (visible to holders of a specific role). Personal tasks cannot link to external records (student, guardian, invoice).
3. **Priority and due date traffic light** — overdue (red), due today (amber), due soon (yellow), on track (green), no due date (grey). Computed live on every view.
4. **Three views** — List (dense sortable table), Kanban (status columns, drag-and-drop), Calendar (due date grid). Plus Snooze action to hide a task until a chosen return date.
5. **Task detail panel** — full record view with inline editing, subtask checklist, activity log, linked record preview, comment thread.
6. **Linked record context strip** — when a task is linked to a student/guardian/invoice/concern/complaint/staff/session, the detail panel shows a strip with live context: for students → year group, subject, open concerns count, attendance %, predicted grade snapshot; for invoices → amount, status, due date, outstanding; for concerns → trigger rule, severity, owner.
7. **Recurring tasks (reuse of Band 1 Item 6 recurrence engine)** — personal recurring reminders available to any staff member; department or office-wide recurring tasks restricted to Admin Head and Super Admin. Uses the same recurrence engine as Band 1 Item 6 sessions (per Q8 decision) — RRULE-compatible recurrence schema shared across both engines.
8. **Completion-date-based recurrence** — next instance is generated when current instance is marked complete, with new due date = completion date + interval (not original due date + interval). Prevents drift accumulation. This is a task-specific rule on top of the shared recurrence engine.
9. **Task templates** — pre-configured structures (title, type, subtask checklist, default assignee role) that can be applied in one click. IMI ships with default org-wide templates for common operational workflows.
10. **Bulk actions** — select multiple tasks → bulk reassign, bulk priority change, bulk status change, bulk due date shift, bulk tag, bulk delete (Admin Head+).
11. **Concern-driven task auto-creation (F.11 integration)** — every concern raised by F.11 automatically creates a linked task with: title derived from concern, owner matching concern owner, linked record = concern subject, priority derived from concern severity. Closing the task prompts to resolve the concern (not auto-resolve).
12. **Automation-driven task creation (F.13 integration)** — `create_task` is a first-class action in the F.13 automation engine. Automations populate task fields from the trigger payload.
13. **Notifications** — in-app task assigned, task due soon, task overdue, task commented, task reassigned, task mentioned. No outbound messaging in v1 (Phase 2 = WhatsApp/email push for mobile users).

## Data captured

**Task entity:** `task_id`, `tenant_id`, `title`, `description`, `type` (personal/department/office/role_scoped), `visibility_scope_id` (department_id or role_id depending on type), `priority` (low/med/high/critical), `due_at` (nullable), `created_at`, `created_by_user_id`, `assignee_user_ids[]`, `watcher_user_ids[]`, `linked_record_type` (nullable enum), `linked_record_id` (nullable), `status` (open/in_progress/blocked/done/cancelled), `completed_at`, `completed_by_user_id`, `parent_task_id` (nullable), `subtasks[]`, `tags[]`, `attachments[]`, `source` (manual/concern/automation/template/recurring), `source_reference_id` (concern_id / automation_id / template_id / recurrence_id), `snooze_until` (nullable), `audit_log[]`.

**Recurring Task Definition entity:** `recurrence_id`, `template_task_fields` (JSON), `recurrence_rule` (RRULE, inherited from Band 1 Item 6 schema), `next_instance_at`, `paused` (bool), `paused_at`, `created_by_user_id`, `scope_type` (personal/department/office), `scope_id` (nullable), `completion_based_next_calc` (bool — always true for tasks, differs from sessions).

**Task Template entity:** `template_id`, `name`, `task_type`, `title_pattern`, `default_description`, `default_subtasks[]`, `default_assignee_role`, `default_priority`, `default_due_offset_days`, `owner_scope` (personal/department/office/org).

**Task Comment entity:** `comment_id`, `task_id`, `author_user_id`, `body`, `mentioned_user_ids[]`, `created_at`, `edited_at`.

## Rules

**Personal tasks never link external records.** If a user attempts to set a linked record on a Personal task, the UI blocks and suggests switching task type. Guards privacy of personal reminders from organisational record scopes.

**Recurring tasks use completion-date anchoring.** Unlike sessions (which are calendar-anchored), the next task instance is created when the current one is marked complete, with due date = completion_date + interval. This prevents a stalled recurring task from generating a backlog of overdue instances. `completion_based_next_calc` is always true for tasks.

**Recurrence creation is role-gated:**
- Personal recurring: any staff member
- Department recurring: Admin Head or Super Admin
- Office-wide recurring: Admin Head or Super Admin
- Editing recurrence affects future instances only; current instance unchanged
- Pausing stops generation without deleting the rule
- Deleting cancels all future instances; completed and current instances remain in audit trail

**Concern-driven task coupling (F.11):**
- Every F.11 concern auto-creates exactly one linked M16 task with `source = concern` and `source_reference_id = concern_id`
- Closing the task does NOT auto-resolve the concern — F.11 requires an explicit resolution note
- Re-occurrence of the same concern (same rule + same subject within dedup window) updates the existing concern AND re-opens the linked task if closed, rather than creating a new task

**Automation-driven task creation (F.13):**
- Automation actions can create tasks with any populated fields
- Tasks created by automation have `source = automation` and `source_reference_id = automation_id`
- Automation execution log records task_id of every created task for idempotency

**Snooze** hides the task from default views until `snooze_until`. Task still counts in assignee total. Clears automatically on the return date. Users can snooze their own tasks; cannot snooze tasks on behalf of others.

**Linked record context strip is live.** Context values (attendance %, predicted grade, invoice status, etc.) are fetched on panel open and refreshed on revisit. Not cached in the task record.

**Overdue cascade on high-severity concern tasks.** Tasks linked to F.11 concerns of severity Critical that go 24h overdue auto-escalate: (a) notify Admin Head, (b) re-route task to Admin Head as assignee with original assignee retained as watcher, (c) concern severity remains unchanged.

**Bulk delete is Admin Head+ only.** Prevents accidental mass data loss. Individual delete is available to the task creator and any assignee.

**No outbound messaging in v1.** All notifications are in-app. WhatsApp/email push notification for mobile users is Phase 2. Email digest of overdue tasks is Phase 2.

## Connects

- **F.4 entities** — User, Department, Role, Student, Guardian, Invoice, Concern, Complaint, Staff, Session (all possible linked record types)
- **F.7 approval gateway** — bulk delete by Admin Head, automation rule edits by owner role
- **F.10 UI foundation** — list/kanban/calendar views use Band 1 tokens
- **F.11 Concern Engine** — **primary upstream source of auto-created tasks.** Every concern creates one linked task. Concern state transitions drive task state.
- **F.13 automation engine** — `create_task` is a first-class action. M16 is the largest target of automation actions across the platform.
- **Band 1 Item 6** — **shared recurrence engine.** M16 and session scheduling both use the same RRULE-based recurrence schema. Task recurrence adds `completion_based_next_calc` on top of the base engine.
- **M01** Lead Management — auto-inactive warning tasks, fallback escalation tasks
- **M06** Attendance & Makeups — concern-driven tasks from attendance triggers
- **M07** Feedback & Communications — complaint-driven tasks (via F.11), recurring complaint meeting tasks
- **M09** Staff Performance — task completion rate, overdue rate per staff member
- **M10** Management Dashboard — org-wide task backlog, overdue heatmap
- **M11** Academic Courses — curriculum review tasks (recurring department-wide)
- **M12** People, Forms & Documents — form submissions can trigger tasks via F.13
- **M13** Automation & Communications — templates and automation definitions include task actions
- **M17** Student Profile — tasks linked to this student visible in a tab
- **M18** Guardian Profile — tasks linked to this guardian visible in a tab
- **M19** Progress Tracking — report approval tasks, intervention follow-up tasks, concern-driven academic tasks
- **M20** Tenant Settings — default templates, role-scope visibility rules, concern severity → task priority mapping

**F.13 trigger events emitted by M16:**

| **Event** | **F.13 trigger type** | **Payload** |
|---|---|---|
| `task_created` | Status change | task_id, source, assignee_ids, linked_record |
| `task_assigned` | Status change | task_id, assignee_ids, reassigned_from |
| `task_status_changed` | Status change | task_id, from_status, to_status |
| `task_overdue` | Time-based relative | task_id, assignee_ids, hours_overdue |
| `task_completed` | Status change | task_id, completed_by, duration_from_created |

## Out of scope (Phase 2)

- WhatsApp / Email push notifications for task events (v1 = in-app only)
- Overdue task email digest
- Mobile native app (web-responsive only in v1)
- Task time tracking (hours logged per task)
- Gantt chart view
- Task dependencies (task A must complete before task B) — subtasks are the only dependency primitive in v1
- External calendar sync (Google Calendar / iCal export of tasks) — Phase 2 alongside general calendar integration
- AI task summarisation or auto-prioritisation
- Natural language task creation ("remind me to call Sarah tomorrow")
- Task templates marketplace / sharing between tenants
- SLA tracking on concern-driven tasks beyond the Critical 24h cascade
- Guest task assignment (assigning tasks to non-Enrolla users)

## UI specifics

**List View (default):**
- Columns: priority traffic light, title, assignee avatars, due date, status, linked record chip, tags
- Sort: priority, due date, created date, last updated
- Filter: assignee, type, status, priority, tag, linked record type, due date range
- Inline quick-edit: click priority/status/due date to change without opening detail panel
- "My Tasks" saved filter (default landing view for every user)

**Kanban View:**
- Columns: Open / In Progress / Blocked / Done
- Drag-and-drop between columns updates status
- Swim lanes by assignee or priority (toggle)
- Card shows title, priority, due date, linked record

**Calendar View:**
- Month/week/day grid of due dates
- Drag to reschedule
- Colour-coded by priority

**Task Detail Panel (slide-in from right):**
- Header: title, priority, status, due date (all inline editable)
- Assignees + watchers (avatars, add/remove)
- Description (rich text)
- Subtask checklist (add, reorder, tick off)
- Attachments
- Linked record context strip (live data from the linked record)
- Comment thread with @mentions
- Activity log (all state changes)
- Footer: created by, source (manual/concern/automation/template/recurring), source reference chip
- "Mark complete" action; for recurring tasks, this action triggers next instance generation

**Snooze UI:**
- "Snooze" action on any task → date picker (1 day / 3 days / 1 week / custom)
- Snoozed tasks hidden from default views with a "Snoozed: N" indicator at the top
- Click indicator to reveal snoozed tasks

**Recurring task management:**
- Dedicated "Recurring" tab on M16 home
- Shows all active, paused, and ended recurrence definitions
- Actions: pause, resume, edit future, delete
- Visible history of generated instances

**Task templates:**
- Template library tab
- "Apply template" action on task creation
- HOD/Admin Head template editor (visibility-scoped)

**Bulk action toolbar:**
- Appears when 2+ tasks selected
- Actions: reassign, change priority, change status, shift due date, add tag, delete (Admin Head+)

---

# Item 16 — M12 People, Forms & Documents

## Purpose

Unified directory for every person record in the platform (guardians, students, staff, leads), with duplicate detection and merge, segment building, broadcast list management, a no-code form builder for data capture, and contact export. M12 is the entity layer of the platform — most other modules read person records through M12. Form submissions are automation trigger type 6 (F.13) and are the primary inbound channel for leads, profile updates, and structured data capture. M12 activates the form schema defined in F.15.

## What to build

1. **People Directory** — consolidated view of all person records across the platform. Tabs: Guardians, Students, Staff, Leads. Filterable by DNC, unsubscribe, communication channel, linked student status, department, year group.
2. **Platform-wide Created On timestamp standard** — every person record (and many other records) displays a standardised creation timestamp: `DD/MM/YYYY HH:MM`, 24-hour time, UAE time zone (UTC+4) by default, tenant-overridable in M20.
3. **Duplicate detection engine** — Levenshtein-distance scoring across name, phone, email with tenant-configurable thresholds. Includes a **name-variation dictionary** for common transliteration equivalents rendered in Latin script (e.g. Mohamed / Muhammad / Mohammed, Fatima / Fateema, Al / El prefix variations). The dictionary is platform-maintained and Super Admin can supplement in M20. This is a matching aid only — all UI, inputs, and storage remain English-only per locked rule.
4. **Duplicate alert thresholds** — High (auto-block create, force merge review), Medium (warn on create, optional merge), Low (flag on list view only).
5. **Merge process** — four-step flow: select primary + secondary → review field-by-field → financial review (mandatory if either record has financial history) → typed confirmation. 24-hour rollback window with hard financial activity gate.
6. **Dubai district dropdown** — standardised list of Dubai districts for the home_area field on guardian records (IMI-specific reference data, tenant-configurable in M20).
7. **Segment Builder** — dynamic audience definitions with filter criteria across person records. Uses the F.14 Segment Cache for materialisation. Segment actions: send communication (copy-paste template), export, feed form audience, feed M13 automation trigger.
8. **Batch Suggestions** — system surfaces suggested segments based on observed patterns (e.g. "15 guardians with DNC flag and no unsubscribe — review status"). Suggestions are passive recommendations, never auto-applied.
9. **Broadcast List Management** — three-state view (auto-added / manually added / excluded) of configured broadcast lists. Broadcast lists are segment-driven and surface in M13 for campaign-style copy-paste dispatch.
10. **Broadcast List Auto-Add Automation** — rule-based addition to broadcast lists (e.g. "all active Primary guardians auto-added to Primary Newsletter list"). Uses F.13 automation engine.
11. **Profile Update Request** — Admin surfaces a profile update form to a contact. Request generation produces a tokenised link + copy-paste template for Admin to send externally. Submitted updates require Admin review before applying.
12. **Form Builder (F.15 activation)** — no-code form designer with 13 field types from F.15 (short_text, long_text, number, email, phone, date, datetime, single_select, multi_select, file_upload, signature, rating_1_5, consent_checkbox).
13. **Conditional logic** — show/hide fields based on earlier answers. Multi-step forms supported.
14. **Source tags and auto-create records** — forms can be configured to create a Lead (M01) or update an existing person record on submission, with source tag automatically applied.
15. **Two-Form Model** — every tenant ships with two anchor forms: (a) **Lead Enquiry Form** (public, creates Lead in M01), (b) **Profile Update Form** (tokenised, updates existing person record). Additional custom forms may be created.
16. **Form sharing** — standalone URL, embeddable iframe, QR code download. Share via any external channel manually in v1.
17. **Contact Export** — two formats: Standard CSV (full field set) and Google Contacts CSV (mapped to Google Contacts import schema). Export actions are logged in an audit trail with user, timestamp, filter criteria, and row count.

## Data captured

**Person Directory entity (view, not storage):** a unified query interface across underlying Guardian, Student, Staff, Lead entities defined in F.4. M12 does not re-store person data — it indexes and joins.

**Duplicate Detection entity:** `detection_id`, `primary_record_type`, `primary_record_id`, `candidate_record_type`, `candidate_record_id`, `score`, `matched_fields[]`, `threshold_tier` (high/medium/low), `resolved_as` (merge/keep_separate/dismissed/pending), `resolved_by_user_id`, `resolved_at`.

**Merge Transaction entity:** `merge_id`, `primary_record_id`, `secondary_record_id`, `merged_by_user_id`, `merged_at`, `financial_review_completed` (bool), `financial_review_notes`, `field_choices` (JSON — which value wins per field), `rollback_deadline_at` (24h), `rollback_blocked_reason` (nullable — set when financial activity occurs during window), `rolled_back_at` (nullable), `rolled_back_by_user_id` (nullable).

**Segment entity:** `segment_id`, `name`, `description`, `filter_criteria` (JSON), `refresh_interval_minutes` (from F.14), `last_materialised_at`, `member_count`, `owner_user_id`, `shared_with_roles[]`.

**Form entity (from F.15):** activated here. `form_id`, `name`, `slug`, `status`, `version`, `fields[]`, `conditional_logic`, `audience`, `submission_policy`, `success_action`, `retention_days`, `source_tag`, `auto_create_record_type` (nullable), `embed_options`.

**Form Submission entity (from F.15):** `submission_id`, `form_id`, `form_version`, `submitted_at`, `submitter_id`, `values[]`, `ip_address`, `user_agent`, `status`, `linked_records[]`.

**Broadcast List entity:** `list_id`, `name`, `auto_add_rule_id` (nullable — links to F.13 automation), `manually_added_member_ids[]`, `excluded_member_ids[]`, `last_auto_refresh_at`.

**Export Audit entity:** `export_id`, `exported_by_user_id`, `exported_at`, `format` (csv_standard/csv_google), `filter_criteria_snapshot`, `row_count`, `file_hash`.

## Rules

**Merge financial gate:** if either record being merged has any invoice, payment, or credit history, the merge flow inserts a mandatory financial review step. Primary record retains all financial records; secondary's financial records re-link to primary's ID. Credit balances sum. Invoice numbers never change.

**Merge rollback 24-hour window:** rollback is available within 24 hours of merge commit, unless any payment, invoice, or credit transaction has been recorded against either record during the window — then rollback is **hard-blocked** and the merge is permanent. This is the financial activity gate required by session state.

**Duplicate detection auto-block at High tier:** High-score duplicates block record creation entirely until Admin reviews and chooses merge-or-separate. Medium warns on create. Low flags on list view.

**Name-variation dictionary is matching only.** Platform UI, data storage, form inputs, and exports remain English/Latin-script only. The dictionary equates variant spellings (Mohamed/Muhammad/Mohammed) for duplicate matching. It does not add Arabic UTF-8 support.

**Segments use F.14 cache rules.** Default refresh interval 1 hour; minimum 15 minutes; maximum 24 hours. Segments exceeding 50,000 members throw a soft warning asking the user to narrow the definition.

**Form submissions create or update records atomically.** If a form is configured with `auto_create_record_type = lead`, submission creates a Lead in M01 in one transaction. If configured to update an existing record by phone/email match, Admin review is required before the update applies.

**Profile Update Requests are tokenised.** Each request generates a unique per-contact URL. Tokens expire after a configurable period (tenant default 30 days). Expired tokens return an error page with a contact Admin prompt.

**Broadcast list membership is tri-state.** Auto-added by automation, manually added by Admin, or explicitly excluded. Manual additions override auto-add rules. Exclusions override both.

**Export audit is immutable.** Every export is recorded with exporting user, timestamp, filter criteria snapshot, row count, and a file hash. Audit records cannot be deleted; retention falls under the 5-year minimum for person-related platform records.

**All outbound dispatch from M12 is copy-paste fallback in v1.** Profile update request links, form share links, and segment communication all surface as copy-paste templates with tokenised URLs. No automated outbound messaging.

**Google Contacts CSV export is a format, not an integration.** The CSV structure matches Google Contacts import schema; Admin downloads and imports manually into Google Contacts externally. No Google API integration in v1.

**Created On timestamp standard applies platform-wide.** Every entity surfaces its `created_at` in the standardised `DD/MM/YYYY HH:MM UAE time` format unless the viewing user overrides in their personal settings.

## Connects

- **F.4 entities** — Guardian, Student, Staff, Lead (all read through M12 directory)
- **F.7 approval gateway** — merge financial review step, profile update review
- **F.10 UI foundation** — all components use Band 1 tokens
- **F.11 Concern Engine** — M12 emits concerns for repeated merge rollback attempts, repeated failed profile update requests, repeated DNC violations detected at the directory level
- **F.13 automation engine** — M12 emits trigger events AND hosts broadcast list auto-add automations. Form submission is automation trigger type 6.
- **F.14 Segment Cache Rules** — M12 segments use F.14 cache rules exclusively
- **F.15 Form Schema Additions** — M12 activates the form entity and submission entity defined in F.15

**F.13 trigger events emitted by M12:**

| **Event** | **F.13 trigger type** | **Payload** |
|---|---|---|
| `person_created` | Status change | record_type, record_id, source |
| `person_merged` | Status change | merge_id, primary_id, secondary_id |
| `person_merge_rolled_back` | Status change | merge_id, rolled_back_by |
| `duplicate_detected_high` | Threshold breach | detection_id, records |
| `form_submitted` | Form submission | submission_id, form_id, values, linked_records |
| `profile_update_received` | Status change | request_id, submitter_id, proposed_changes |
| `segment_materialised` | Time-based relative | segment_id, member_count, refresh_duration_ms |
| `broadcast_list_auto_updated` | Status change | list_id, added[], removed[] |

- **M01** Lead Management — Lead Enquiry Form feeds M01; duplicate detection on new leads
- **M02** Student & Guardian CRM — primary entity store for guardians and students
- **M08** Finance & Billing — merge financial review source
- **M09** Staff Performance — staff directory slice
- **M13** Automation & Communications — broadcast lists surface in M13 for dispatch; M13 consumes segments as audiences
- **M17** Student Profile — student directory slice
- **M18** Guardian Profile — guardian directory slice with profile update history
- **M20** Tenant Settings — duplicate detection thresholds, name-variation dictionary supplements, Dubai district list, timestamp format default, segment size ceiling, form retention defaults

## Out of scope (Phase 2)

- WhatsApp BSP / Email SMTP auto-dispatch for profile update requests, form share links, segment communications, broadcast list campaigns
- Google Contacts API direct sync (v1 = CSV export only)
- Native Arabic input or display in forms (English only per locked rule)
- AI-suggested segment definitions
- Form analytics dashboards (submission rates, drop-off per step) — basic submission counts only in v1
- Form versioning diff UI (history captured in data but no visual diff viewer)
- A/B testing of form variants
- Parent portal form self-service beyond tokenised links
- Bulk merge tool (one merge at a time in v1)
- Segment sharing marketplace between tenants
- Advanced dedup across historical archive records (only live records scanned in v1)
- Multi-tenant directory federation

## UI specifics

**People Directory (primary landing):**
- Tab strip: Guardians / Students / Staff / Leads
- Filter panel: DNC, unsubscribe, communication channel, linked status, department, year group, tags
- List density toggle (compact / comfortable)
- "My Recent" quick filter
- Bulk actions: export, send segment message (copy-paste), add to broadcast list

**Duplicate Detection Panel:**
- Triggered on create or accessible via "Duplicates" link on any record
- Side-by-side field comparison
- Matched fields highlighted
- Actions: Merge, Keep Separate, Dismiss (with reason)

**Merge Wizard (4 steps):**
1. Select primary and secondary
2. Field-by-field choice (default: primary wins; per-field override)
3. **Financial Review** (mandatory gate if either has financial records — shows full invoice/payment/credit history side by side)
4. Typed confirmation — Admin must type "MERGE" to proceed
- Post-merge: 24h rollback countdown visible on the merged record
- Rollback button disabled with tooltip if financial activity gate tripped

**Segment Builder:**
- Filter criteria panel with add/remove rule rows (field, operator, value)
- Live member count preview (from F.14 cache)
- Save, share, schedule refresh interval
- "Actions" menu: Export, Send communication, Feed form audience, Use in automation

**Form Builder:**
- Drag-and-drop field palette (13 F.15 field types)
- Field properties side panel (label, required, validation, help text, conditional logic)
- Multi-step / page break support
- Audience setting (public link / authenticated role / segment)
- Success action setting (message / redirect / auto-create record)
- Preview button (renders live form in side panel)
- Publish creates a new version; prior versions retained read-only

**Form Share Dialog:**
- Standalone URL (copy button)
- Embed code (copy button for iframe)
- QR code download (PNG)
- Copy-paste template with tokenised URL for external sharing

**Broadcast List Manager:**
- Three-column view: Auto-added / Manual / Excluded
- Member counts per state
- Bulk move between states
- Linked automation rule display

**Export Dialog:**
- Format selector: Standard CSV / Google Contacts CSV
- Filter summary
- Row count preview
- Download button
- Post-export audit entry confirmation

---

# Item 17 — M09 Staff & Performance

## Purpose

Full staff lifecycle module extending Band 1 Item 8 (staff foundation). Covers profile management, onboarding, scheduling and availability, performance metrics, CPD tracking and verification, performance review cycles, HR actions (access revocation, emergency leave, off-boarding), staff milestones, and the HR dashboard. M09 is the single source of truth for all staff-related operational data and feeds M10 management reporting with teacher-level metrics across attendance compliance, feedback completion, 48h remark compliance, and marking timeliness.

## What to build

1. **Staff Profile** — extended fields beyond Band 1 Item 8 baseline: work email (login username), personal email, phone, home address, emergency contact, hire date, department assignment, role(s), subject specialisations, year group expertise, qualifications, CPD annual target, profile photo, notes.
2. **Sensitive HR Fields** — salary, contract terms, bank details, visa details. Visible only to HR/Finance custom role and Super Admin. **DBS/police clearance fields are not included in M09** (session state lock: removed from staff documents entirely).
3. **Work email domain restriction (optional per tenant)** — M20 toggle under Staff & HR Settings. When enabled, new staff work emails must use the organisation's registered domain. Existing staff not retroactively validated. Default off.
4. **Staff Onboarding flow** — three mandatory fields (work email, home address, emergency contact) must be complete before onboarding status resolves to Active. Invite email with one-time password link. Onboarded via M20.A Stage 6 or manually by HR.
5. **Roles and Access** — 12-role RBAC per session state lock: Super Admin, Admin Head, Admin, Academic Head, HOD, Head of Subject, Teacher, TA, HR/Finance (custom), Developer, Student, Parent. Secondary role labels are additive permissions; label removal re-routes pending requests to Admin Head. Developer role excluded from all routing and notifications.
6. **Scheduling and Availability** — per-staff availability calendar (working days, working hours, assessment hours, break times), leave requests, cover assignments. Feeds M05 smart slot ranking and makeup booking.
7. **Performance metrics (Session Delivery)** — sessions scheduled, sessions delivered, sessions cancelled, no-show rate, on-time rate, average session duration. Computed per teacher per term.
8. **Performance metrics (Feedback Scores)** — NPS responses tied to the teacher's sessions (from M07), average feedback completion rate, 48h remark compliance rate (from M19), marking timeliness (from M14).
9. **CPD Tracking with tiered visibility** — teacher logs CPD activities manually (name, date, hours, type, notes). **HR/Finance can mark each entry as Verified or Queried** (`staff.viewCPDDetail`); queried status auto-creates a task (M16) to the staff member asking for clarification. **HOD and Academic Head see a CPD completion summary only** (annual progress bar, percentage complete, outstanding hours count) — detailed log entries, uploaded documents, and CPD scores are hidden for these roles. Super Admin and Admin Head have full CPD detail access.
10. **CPD milestone alerts** — HR/Finance notified in-app when a teacher reaches 50% and 100% of their annual CPD target.
11. **Performance Review Cycle** — configurable cadence (IMI default: annual), captures review notes, goals, approver signatures. Reviews are documents not metrics — metrics feed reviews but do not auto-generate ratings.
12. **Workload Indicator** — visual indicator per teacher showing relative load (sessions per week vs tenant-configured capacity). Not a hard cap, a visibility tool.
13. **Staff Groups** — named groups for distribution (e.g. Front Office Team, Primary Maths Team). Reused by M01 lead distribution, M13 broadcast targeting, M16 task visibility scoping.
14. **Staff Milestones** — birthdays, work anniversaries, CPD target completions, long-service awards. Surfaces copy-paste congratulation templates for HR to send externally.
15. **HR Actions — Immediate Access Revocation (AMD-02.05)** — one-click revocation of platform access for a staff member. Invalidates active sessions, blocks login, preserves historical data and audit trail. Used for dismissals or security incidents. Super Admin or HR/Finance only.
16. **HR Actions — Emergency Leave (AMD-02.15)** — mark a staff member as on emergency leave. All their scheduled sessions surface on a dedicated HR dashboard panel requiring cover assignment. Affected students' guardians get a copy-paste notification template surfaced for Admin to send externally.
17. **HR Actions — Standard Off-Boarding** — planned departure flow with a Structured Off-Boarding Handover Checklist. **Three hard blocks before departure completes:** (a) all outstanding sessions reassigned or cancelled, (b) all open concerns against the teacher resolved or reassigned, (c) all pending marking and reports completed or reassigned.
18. **HR Actions — Unplanned Permanent Departure** — emergency variant of off-boarding with expedited cover assignment and retroactive data preservation. Hard blocks still apply but can be overridden by Super Admin with logged reason.
19. **HR Dashboard** — single view showing: staff count by status, CPD progress distribution, performance review schedule, pending HR actions, sessions needing cover, milestone calendar.

## Data captured

**Staff Profile entity:** `staff_id`, `tenant_id`, `work_email` (unique, login), `personal_email`, `phone`, `home_address`, `emergency_contact`, `first_name`, `last_name`, `hire_date`, `department_id`, `primary_role_id`, `secondary_role_ids[]`, `subject_specialisations[]`, `year_group_expertise[]`, `qualifications[]`, `cpd_annual_target_hours`, `profile_photo_url`, `notes`, `onboarding_status` (pending/active/suspended/offboarded), `created_at`.

**Sensitive HR entity** (separate table, restricted access): `staff_id`, `salary`, `contract_type`, `contract_start`, `contract_end`, `bank_account_details_encrypted`, `visa_number`, `visa_expiry`, `tax_id`. Accessible only to HR/Finance and Super Admin. All reads logged.

**CPD Log entry:** `cpd_entry_id`, `staff_id`, `activity_name`, `activity_date`, `hours`, `type` (training/conference/reading/other), `notes`, `logged_at`, `verification_status` (unverified/verified/queried), `verified_by_user_id` (nullable), `verification_notes`, `linked_task_id` (nullable — task created on Queried).

**Performance Review entity:** `review_id`, `staff_id`, `cycle_start`, `cycle_end`, `reviewer_user_id`, `metrics_snapshot` (JSON — computed metrics at time of review), `notes`, `goals[]`, `staff_acknowledged_at`, `reviewer_signed_at`, `admin_head_approved_at` (nullable).

**Staff Availability entity:** `availability_id`, `staff_id`, `day_of_week`, `start_time`, `end_time`, `type` (working/assessment_hours/break/unavailable), `effective_from`, `effective_to`, `recurrence_rule` (RRULE, shared with Band 1 Item 6 engine).

**Leave Request entity:** `leave_id`, `staff_id`, `leave_type` (annual/sick/emergency/unpaid), `start_date`, `end_date`, `reason`, `status` (pending/approved/rejected/cancelled), `approved_by_user_id`, `approved_at`.

**HR Action Log entity:** `action_id`, `staff_id`, `action_type` (access_revoked/emergency_leave/offboarding/reinstated), `triggered_by_user_id`, `triggered_at`, `reason`, `hard_block_check_results` (JSON).

## Rules

**DBS/police clearance is NOT a platform concept in M09.** Per session state lock, all such fields are removed. Tenants that require DBS/equivalent background checks handle these externally and retain records outside Enrolla. This rule is non-negotiable in v1.

**Outperformance Flag is fully removed** (AMD-02.29) from all staff performance metrics, reviews, and dashboards. Any reference to it in earlier drafts or UI labels must be purged.

**Sensitive HR fields require dual-layer access:** stored in a separate table with HR/Finance + Super Admin read permissions only. Every read is logged. Writes require re-authentication prompts for Super Admin.

**CPD verification is HR/Finance only** (`staff.viewCPDDetail`). HOD and Academic Head see summary only — percentage complete and outstanding items. Detailed log entries visible only to Super Admin, Admin Head, HR/Finance. Queried entries auto-create a clarification task (M16) assigned to the staff member.

**Three hard blocks on standard off-boarding:**
1. All outstanding sessions reassigned or cancelled
2. All open concerns against the teacher resolved or reassigned (per session state: teacher off-boarding hard block on open concerns from M06.A.9)
3. All pending marking and reports completed or reassigned

The off-boarding flow displays a checklist; each block shows count and direct link to resolve. Completion of all three unlocks the final "Confirm Off-boarding" action.

**Unplanned departure override:** Super Admin can override hard blocks in unplanned departure scenarios (death, serious illness, sudden resignation refusing handover) with a mandatory logged reason. The override does not delete the outstanding items — they become Admin Head's responsibility with a flagged task.

**Immediate Access Revocation is irreversible without reinstatement.** Revocation invalidates all active sessions, blocks login, and adds an audit entry. Reinstatement requires Super Admin action with logged reason. Historical data is never deleted by revocation.

**Emergency Leave surfaces cover requirements.** Marking a teacher as on emergency leave flags every affected future session on the HR dashboard. Admin assigns cover (teacher double-booking is a soft warning per session state, not a hard block). Guardian notification templates surface for copy-paste external send.

**Secondary role removal re-routes in-flight work.** When an Admin Head removes a secondary role label from a staff member, any pending requests or tasks routed via that secondary role are re-routed to Admin Head for reassignment. The fallback chain skips null roles.

**Developer role exclusions:** Developer has full access for support but is excluded from all automation routing, approval chains, and fallback escalation. Developer actions are logged but do not count in staff performance metrics.

**Work email changes require HR/Finance approval.** Staff cannot self-edit their work email (it is the login identifier). Changes flow through an HR/Finance task.

## Connects

- **F.4 entities** — Staff, Department, Role, User (login layer)
- **F.7 approval gateway** — off-boarding hard block checks, secondary role removal re-routing, work email change approval
- **F.10 UI foundation** — all components use Band 1 tokens
- **F.11 Concern Engine** — M09 both consumes and emits concerns. Consumes: open concerns against a teacher block off-boarding. Emits: low 48h remark compliance, missed performance review cycle, repeated queried CPD entries, workload exceeding capacity.
- **F.13 automation engine** — M09 emits the following trigger events:

| **Event** | **F.13 trigger type** | **Payload** |
|---|---|---|
| `staff_onboarded` | Status change | staff_id, role_ids, department_id |
| `staff_role_added` | Status change | staff_id, role_id, added_by |
| `staff_role_removed` | Status change | staff_id, role_id, removed_by, rerouted_count |
| `cpd_logged` | Status change | cpd_entry_id, staff_id, hours |
| `cpd_queried` | Status change | cpd_entry_id, staff_id, queried_by |
| `cpd_target_50_reached` | Threshold breach | staff_id, hours_logged, target |
| `cpd_target_100_reached` | Threshold breach | staff_id, hours_logged, target |
| `access_revoked` | Status change | staff_id, revoked_by, reason |
| `emergency_leave_marked` | Status change | staff_id, marked_by, sessions_affected |
| `offboarding_initiated` | Status change | staff_id, type (planned/unplanned) |
| `offboarding_completed` | Status change | staff_id, hard_blocks_status |
| `performance_review_due` | Time-based absolute | staff_id, cycle_end_date |

- **Band 1 Item 8** — staff foundation (extended by this item)
- **M01** Lead Management — staff groups used for lead distribution
- **M05** Timetabling — availability feeds slot generation
- **M06** Attendance — attendance compliance metrics per teacher; 48h window breach rate
- **M07** Feedback & Communications — feedback completion rate; NPS tied to teacher
- **M10** Management Dashboard — aggregated staff metrics
- **M13** Automation & Communications — staff groups as broadcast audiences
- **M14** Assignment Library — marking timeliness per teacher
- **M16** Task Management — CPD queried tasks; off-boarding handover tasks
- **M19** Progress Tracking — 48h remark compliance per teacher; report approval turnaround
- **M20** Tenant Settings — CPD annual targets, review cycle cadence, role permissions matrix, work email domain restriction toggle, workload capacity defaults

## Out of scope (Phase 2)

- DBS / police clearance / background check fields (explicitly removed from v1 per session state lock)
- WhatsApp/Email auto-send for staff onboarding invites beyond the initial one-time password link (v1 supports the login invite only)
- Payroll integration (Zoho Books handles payroll externally; Enrolla does not duplicate)
- Automated performance review generation from metrics (reviews are human-authored in v1)
- AI-suggested CPD recommendations
- Staff self-service leave request workflow with manager approval routing (v1 = HR/Finance manual entry)
- Mobile app for staff availability updates
- Automated cover assignment algorithms (Admin manually assigns cover in v1)
- Staff directory public profile pages
- Cross-tenant staff sharing (multi-tenant staff records) — Phase 2
- Google Workspace / Microsoft 365 SSO integration
- Automated CPD hour verification via external provider integration

## UI specifics

**Staff Profile Page:**
- Header: photo, name, primary role badge, department, status chip
- Tabs: Overview / Schedule / Performance / CPD / Reviews / HR Actions (last tab visible only to HR/Finance)
- Edit mode gated by role
- Sensitive HR fields panel (HR/Finance only) with re-authentication prompt on edit

**Staff Directory:**
- List/grid toggle
- Filter: department, role, status, onboarding state
- Bulk actions: message (copy-paste template), export, add to staff group

**CPD Log View:**
- Chronological log with filters (type, date range, verification status)
- "Add CPD entry" action (staff's own log)
- HR/Finance verification actions (Verify / Query) with notes field
- Progress ring showing annual target completion
- Milestone badges at 50% and 100%

**Performance Dashboard (per teacher):**
- Metric cards: session delivery, feedback scores, 48h compliance, marking timeliness
- Trend charts over last 4 terms
- Workload indicator with capacity reference line
- Drill-down to underlying data (M06, M07, M14, M19)

**Off-Boarding Wizard:**
- Three hard block checklist
- Each block shows count + link to resolve
- Progress bar 0/3 → 3/3
- Final confirm button disabled until all three green
- Unplanned variant: Super Admin override button with mandatory reason field

**Immediate Access Revocation:**
- Prominent "Revoke access" button on profile (HR/Finance + Super Admin only)
- Confirmation modal with reason field
- Post-revocation: banner on profile showing revoked status and timestamp
- Reinstate button visible to Super Admin only

**HR Dashboard:**
- Summary cards: total staff, active/pending/offboarded counts, CPD distribution
- Sessions Needing Cover panel (emergency leave / off-boarding affected sessions)
- Pending HR Actions queue
- Milestone calendar (birthdays, anniversaries)
- Performance review schedule

**Staff Group Manager:**
- Group list with member counts
- Create/rename/delete groups
- Add/remove members
- Visible usage: which M01 distribution rules, M13 broadcasts, M16 task scopes reference each group

---

# Item 18 — M13 Automation & Communications

## Purpose

Operational surface for the F.13 Automation Engine defined in Band 2 Foundations. M13 provides the rule builder UI, template library, internal messaging, pre-built automation library, trigger library browser, and marketing moment management. M13 does not define the automation engine — F.13 is authoritative. M13 is where staff **use** the engine: building rules, authoring templates, dispatching campaigns, and monitoring execution. M13 is explicit about the v1 **Standalone App Principle**: the platform functions as a complete standalone system with no external integrations, all outbound communication handled via copy-paste fallback.

## What to build

1. **Standalone App Principle (v1 constraint)** — M13 operates entirely within the platform. No WhatsApp BSP, email SMTP, Instagram, or Google Calendar integrations in v1. Every outbound action produces a copy-paste-ready template for Admin to dispatch externally. Every automation `send_message` action surfaces a template in a queue for manual dispatch rather than transmitting directly.
2. **Template Library** — all message templates (stage messages from M01, assessment confirmations from M03, absence alerts from M06, feedback share from M07, report dispatch from M19, profile update requests from M12, etc.) are centrally managed here. Template types: message templates, email templates, announcement templates, task templates. Each template is versioned.
3. **Template fields** — title, type, body (rich text with merge fields), merge field dictionary, tenant-scoped or system-wide, owner role, version, status.
4. **Merge field dictionary** — platform-defined tokens: `[child_name]`, `[parent_name]`, `[subject]`, `[tenant_name]`, `[session_date]`, `[invoice_number]`, `[amount]`, `[teacher_name]`, `[stage]`, etc. Every template renders with merge fields resolved when surfaced for dispatch.
5. **Internal Messaging** — staff-to-staff in-app messaging with @mentions, channels per department, direct messages, file attachments. Not for parent-facing communication. Read receipts and message history per channel.
6. **Automation Rule Builder** — no-code rule creation UI wrapping F.13. User selects trigger type (from 7 F.13 types), configures trigger parameters, adds conditions (field comparisons with AND/OR tree), defines actions (send_message/create_task/update_field/assign_owner/create_concern).
7. **Action types (v1)** — `send_message` (surfaces template for manual dispatch), `create_task` (M16 task with populated fields), `update_field` (writes to any record's editable field), `assign_owner` (changes ownership of a record), `create_concern` (F.11 concern with specified rule ID).
8. **Automation Trigger Library** — browsable index of all F.13 triggers emitted across the platform, organised into 13 categories: Lead Management, Enrolment & Lifecycle, Attendance, Finance, Concerns & Complaints, Scheduling & Timetable, Staff & HR, Churn & Retention, Feedback & Quality, Tasks & Admin, Platform & Onboarding, Progress & Academic, Events & Inventory. Each entry shows payload schema and example conditions.
9. **Pre-Built Automation Templates** — tenant-ready automation definitions covering common workflows (new lead welcome, assessment reminder, absence alert, late payment nudge, term-end feedback summary, CPD milestone congratulations). Admin imports a template, reviews, enables.
10. **M13.B Fixed Behaviour Automations** — a set of platform-mandated automations that cannot be disabled or edited by tenants. These are core operational behaviours (e.g. concern auto-task creation, DNC interstitial routing, 48h attendance lock). Visible in M13 for transparency but marked as System-locked.
11. **M13.B Format Lock Automations** — a second class of locked automations that enforce formatting consistency across outputs (e.g. invoice numbering format, student reference format). Tenant-configurable at onboarding in M20 but locked thereafter.
12. **Marketing Tab — Moments Management** — campaign-oriented communication surface for term openings, open days, promotional offers, Ramadan greetings, etc. Marketing moments are scheduled in advance, linked to templates, and dispatched via the copy-paste template queue.
13. **Execution Log Viewer** — searchable log of every automation execution: rule ID, triggered at, matched conditions, actions taken, results, errors. Links to created tasks, created concerns, updated records.
14. **Rate Limit Dashboard** — visualisation of F.13 rate limits per automation rule (max executions per hour per subject). Surfaces automations approaching or hitting limits for tuning.

## Data captured

**Automation Rule entity (from F.13, materialised in M13):** `automation_id`, `name`, `description`, `tenant_id`, `enabled`, `trigger_type`, `trigger_config`, `conditions`, `actions`, `owner_role`, `owner_user_id`, `created_at`, `modified_at`, `last_executed_at`, `execution_count`, `rate_limit_per_hour_per_subject`, `is_system_locked` (bool — M13.B), `is_format_locked` (bool — M13.B), `created_from_template_id` (nullable).

**Message Template entity:** `template_id`, `tenant_id`, `name`, `type` (message/email/announcement/task), `body` (rich text), `merge_fields_used[]`, `version`, `status` (draft/published/archived), `owner_role`, `category`, `scope` (tenant/system), `created_at`, `modified_at`.

**Template Render entity (ephemeral — surfaced in dispatch queue):** `render_id`, `template_id`, `template_version`, `automation_id` (nullable), `rendered_body`, `target_contact_id`, `surfaced_to_user_id`, `surfaced_at`, `marked_sent_at`, `marked_sent_by_user_id`, `source_trigger_event`.

**Internal Message entity:** `message_id`, `channel_id` (nullable for DMs), `author_user_id`, `recipient_user_ids[]` (for DMs), `body`, `mentioned_user_ids[]`, `attachments[]`, `sent_at`, `read_by[]`.

**Channel entity:** `channel_id`, `name`, `scope` (department/office/role/custom), `member_user_ids[]`, `created_by_user_id`, `created_at`.

**Automation Execution Log entity:** `execution_id`, `automation_id`, `executed_at`, `trigger_event`, `trigger_payload`, `conditions_matched` (bool), `actions_taken[]` (list of action results), `errors[]`, `duration_ms`, `idempotency_key`.

**Marketing Moment entity:** `moment_id`, `name`, `description`, `scheduled_start`, `scheduled_end`, `template_id`, `audience_segment_id`, `status` (planned/active/completed/cancelled), `created_by_user_id`, `visibility_scope`.

## Rules

**Standalone App Principle is non-negotiable in v1.** No automation action transmits an outbound message directly. All `send_message` actions produce a Template Render surfaced in the dispatch queue for manual copy-paste. This is the operational reality of the copy-paste fallback rule across the platform.

**Template versioning:** editing a published template creates a new draft version. The published version remains the one surfaced by automations until the draft is promoted to published. Admin Head can promote. System templates (scope=system) cannot be edited by tenants — only forked to a tenant-scoped copy.

**Merge field resolution happens at render time**, not at template save time. Values reflect current data when the template is surfaced for dispatch, not when the template was authored or when the automation was configured.

**Fixed Behaviour Automations cannot be disabled.** They appear in the rule list with a lock icon and a tooltip explaining the platform guarantee they enforce. Tenants may view the logic but cannot edit or disable. Examples: concern → task creation, 48h attendance lock, DNC interstitial trigger.

**Format Lock Automations are configurable once.** Tenant selects format during M20 onboarding (e.g. invoice number pattern, lead reference pattern). After the tenant goes live, the format is locked to preserve historical record integrity. Changing format requires Super Admin with a logged reason and a confirmation that existing records will not be retroactively re-formatted.

**Rate limiting per rule per subject:** each automation rule has a max-executions-per-hour-per-subject ceiling (default 10, configurable per rule). Prevents runaway automations (e.g. a rule triggered by every attendance mark creating spam tasks). Hitting the limit logs a warning and pauses the rule for the affected subject for one hour.

**At-least-once delivery for actions** (inherited from F.13). Idempotency key = (rule_id + subject_id + trigger_timestamp). Failed actions retry 3× with exponential backoff, then log and alert rule owner.

**Execution log retention:** 90 days of full payload, then summary-only (event counts per rule) retained per 5-year record retention rule. Execution log writes are append-only.

**Internal messaging is staff-only.** No parent-facing channels in v1. No external integration (Slack, Teams) in v1.

**Marketing Moments do not auto-dispatch.** They surface templates in the dispatch queue on the scheduled start, grouped as a campaign. Admin manually dispatches. Completed moments are archived with dispatch metrics (how many Admin marked as sent).

**Template dispatch queue is tenant-scoped, not user-scoped.** Any Admin with appropriate role can see and action renders surfaced to the tenant. Claiming a render (clicking "Copy message") locks it to the claiming user for 30 minutes to prevent double-send. Releases automatically after 30 minutes if not marked sent.

**Pre-built templates are read-only until imported.** Importing creates a tenant-scoped copy which can then be edited freely. Subsequent updates to the platform pre-built template do not overwrite imported tenant copies.

## Connects

- **F.13 Automation Engine Model** — **authoritative source**. M13 is the surface, F.13 is the engine. M13 materialises F.13 rules and logs F.13 executions.
- **F.11 Concern Engine** — M13 automations can create concerns via `create_concern` action (F.11 authoritative for concern record and routing)
- **F.14 Segment Cache Rules** — marketing moment audiences and campaign targeting use segments defined in M12 and cached per F.14
- **F.15 Form Schema** — form submission triggers (F.13 trigger type 6) configured in M13 rule builder
- **F.4, F.7, F.10** — entities, approval gateway, UI foundation
- **M01** Lead Management — 7 F.13 triggers emitted; welcome message automations live here
- **M03** Assessment & Placement — 4 F.13 triggers; booking confirmation automations
- **M06** Attendance & Makeups — 5 F.13 triggers; absence alert automations
- **M07** Feedback & Communications — 8 F.13 triggers; feedback dispatch, NPS dispatch automations
- **M08** Finance & Billing — payment reminder, late payment nudge, credit issued notification automations
- **M09** Staff & Performance — 12 F.13 triggers; CPD milestone, access revocation, offboarding automations
- **M12** People, Forms & Documents — 8 F.13 triggers; segment materialisation, form submission automations; broadcast list auto-add rules live here
- **M14** Assignment Library — 4 F.13 triggers; assignment published notifications
- **M16** Task Management — **primary target of automation actions**; most automations create tasks
- **M17** Student Profile — automations frequently update student fields
- **M18** Guardian Profile — credit balance updates, profile update notifications
- **M19** Progress Tracking — 14 F.13 triggers (largest single emitter); report dispatch, academic alert automations
- **M20** Tenant Settings — template defaults, format lock selections, system-locked rule visibility, rate limit defaults, marketing moment calendar

## Out of scope (Phase 2)

- WhatsApp BSP integration for direct automated dispatch
- Email SMTP integration for direct automated dispatch
- Instagram Graph API for DM dispatch
- Google Calendar integration for event-based automations
- SMS gateway integration
- Webhook out-calls to external systems (e.g. POST to Zapier) — not available in v1 automation action list
- Incoming webhook automation triggers from external systems
- A/B testing framework for templates
- AI-generated template drafts
- AI-suggested automation rules based on usage patterns
- Voice message templates
- Multi-language template variants (English only per locked rule)
- Scheduled recurring marketing moments (each moment is one-off in v1; recurrence requires manual re-creation)
- Template analytics dashboards (dispatch rate, response rate) — basic counts only in v1
- Automation version control with branching and merging
- Real-time collaborative rule editing

## UI specifics

**M13 Home (tab bar):**
- Templates / Automations / Triggers Library / Dispatch Queue / Internal Messages / Marketing / Execution Log

**Template Library:**
- Grid view by category and type
- Filter: type, owner, status, last modified
- Search across title and body
- Per-template: preview, edit (opens rich text editor), version history, duplicate, archive
- Merge field insertion picker in editor

**Automation Rule Builder (drawer):**
- Step 1: Name & description
- Step 2: Trigger type selector (7 F.13 types) + trigger config form
- Step 3: Conditions tree builder (AND/OR nesting, field comparators)
- Step 4: Actions list (add action rows with type-specific fields)
- Step 5: Rate limit, idempotency, enabled toggle
- Save and Enable button
- System-locked rules show read-only version of this drawer

**Trigger Library Browser:**
- 13 categories as collapsible sections
- Each trigger shows name, type, payload schema, example condition, modules emitting it
- Click-through to create a new automation pre-filled with that trigger

**Dispatch Queue:**
- Chronological list of Template Renders awaiting manual send
- Columns: template name, target contact, generated at, automation source, claimed by
- Filters: template, contact, date range, automation source, unclaimed only
- Actions: Copy Message (claims for 30 min), Mark as Sent, Dismiss (with reason)
- Inline preview of rendered body with merge fields resolved

**Internal Messaging:**
- Channel sidebar (department, office-wide, custom)
- DM section
- Chat pane with @mentions and file attachments
- Read receipts per member

**Marketing Moments Calendar:**
- Month view with scheduled moments as cards
- Drag to reschedule (if not yet active)
- Click to edit / preview audience / preview template
- Campaign dispatch dashboard: % dispatched, outstanding, dismissed

**Execution Log:**
- Searchable table of recent executions
- Filters: rule, date range, success/failed, trigger event
- Per-row expand shows full payload, condition result, action results
- Linked task/concern/record chips

**Rate Limit Dashboard:**
- Per-rule execution count vs limit
- Near-limit and at-limit warnings
- Paused rules shown with reason and paused-until timestamp

---

# Item 19 — M10 Management Dashboard

## Purpose

Platform-wide aggregation and visualisation layer for tenant leadership. M10 reads from every upstream module (it is strictly a consumer, never a source of new domain data) and presents KPI cards, churn risk scoring, seat occupancy, revenue views, a live activity feed, academic alert aggregation, operational monitoring thresholds, the HOD dashboard, and a Reports Inbox with an in-platform daily digest panel. M10 is the view that Admin Head, Super Admin, and HODs open first thing every morning. M10 fully respects the copy-paste v1 model — there are **no outbound email or messaging integrations**. All operational awareness happens inside the platform.

## What to build

1. **KPI Cards (top row, at-a-glance metrics)** — active students, active staff, this month's revenue, outstanding invoices, open concerns (critical count), NPS score (last survey), attendance % (30-day rolling), pipeline value (leads not yet Won). Cards are tenant-configurable in M20 from a library of available metrics.
2. **Churn Risk Score** — composite score per active student derived from weighted signals (attendance drop, missed payments, negative feedback, academic tier decline, reduced engagement). Weights configured in M20; IMI defaults shipped.
3. **Churn risk bands** — Low (green), Medium (amber), High (red), Critical (dark red with alert). Band thresholds tenant-configurable.
4. **Churn Alert Cooldown** — once a student has triggered a churn alert, a 14-day cooldown prevents re-alerting on the same student (still visible in churn list, just not re-notified). Tenant-configurable.
5. **Retention Confidence Score** — inverse companion metric to churn risk; aggregated across cohort for leadership view.
6. **Churn List** — sortable list of all active students with churn score, band, primary contributing signal, assigned Admin, last contact date, quick-action menu (log contact attempt, surface retention template, assign task).
7. **Seat Occupancy** — utilisation per subject, per teacher, per time slot across the week. Heatmap showing gaps and over-filled sessions. Source: M05 scheduling.
8. **Revenue Dashboard** — monthly/quarterly/annual revenue trends, breakdown by department, subject, frequency tier, discount type, payment gateway. Source: M08. Includes predicted month-end based on current bookings and expected deductions.
9. **Live Activity Feed** — chronological stream of significant platform events (new lead, large payment received, critical concern raised, staff access revoked, report dispatched). Filterable by event type.
10. **Gateway Log Feed** — subset of the activity feed showing payment gateway interactions (Telr, Network International, Stripe). Highlights failures and disputes.
11. **Academic Alerts View** — consolidated HOD/Admin Head view of all M19.A academic alerts across the centre with filtering by department, subject, severity.
12. **Operational Monitoring Thresholds** — platform health indicators: 48h attendance breach rate, 48h remark breach rate, 24h no-progress-update rate, unclaimed lead rate, task backlog, overdue tasks, AI cost ceiling utilisation. Each threshold has green/amber/red ranges.
13. **HOD Workload Indicator** — per-HOD aggregate of open concerns, pending report approvals, pending decisions routed to them. Helps distribute load.
14. **HOD Dashboard** — role-scoped slice of M10 showing only the HOD's department. Reuses components but filters by `department_id = current_user.department_id`.
15. **M10.A Reports Inbox** — in-platform location where all scheduled and on-demand reports (attendance, revenue, pipeline, staff performance, academic alert summaries) are delivered as PDF/XLSX files. Readable and downloadable without leaving the platform.
16. **Today's Digest panel (in-platform, v1)** — landing panel on M10 home that summarises the user's personalised daily view: new reports in Reports Inbox, KPI deltas vs yesterday, open critical concerns, overdue tasks, churn alerts triggered in last 24h, operational thresholds that changed band. Refreshes on page load and every 15 minutes while the user has the dashboard open. No email, no push — purely in-platform.
17. **Digest cadence preference** — each user chooses whether the digest panel covers last 24 hours (daily mode) or last 7 days (weekly mode). Stored in user settings.
18. **Super Admin Configuration (in M20)** — report schedule definitions, churn score weights, operational threshold values, KPI card library selection, digest content selection per role.

## Data captured

M10 does not introduce new canonical domain entities. It defines computation and display entities for its aggregations:

**Churn Score entity:** `score_id`, `student_id`, `computed_at`, `score_value` (0–100), `band` (low/medium/high/critical), `contributing_signals[]` (signal_type + weight + raw_value), `last_alerted_at`, `cooldown_until`.

**Dashboard Metric Snapshot entity:** `snapshot_id`, `tenant_id`, `metric_name`, `value`, `breakdown_dimensions[]`, `computed_at`, `source_modules[]`. Snapshots are refreshed on cadence or event; live values shown in UI.

**Report Inbox entry:** `inbox_entry_id`, `user_id`, `report_id`, `report_type`, `generated_at`, `delivery_status` (queued/delivered/failed), `read_at` (nullable), `file_path`, `file_format` (pdf/xlsx).

**Digest Preference entity:** `preference_id`, `user_id`, `mode` (daily/weekly), `content_selection[]` (which digest sections to include), `last_viewed_at`, `updated_at`.

**Operational Threshold State entity:** `threshold_id`, `metric_name`, `current_value`, `band` (green/amber/red), `changed_at`, `previous_band`.

## Rules

**M10 is read-only with respect to canonical data.** M10 never writes to source module records. Any action initiated from M10 (assign task, log contact, surface template) flows through the relevant source module's APIs, not direct writes.

**Churn score computation cadence:** nightly batch + event-driven recompute on attendance mark, payment received, feedback score submission, academic tier change, concern raised. Cooldown enforced at computation time — score can update silently without re-alerting.

**No outbound email or messaging in M10 v1.** All operational awareness happens inside the platform. Daily and weekly digests are panels on M10 home, not emails. Parent-facing communication remains copy-paste fallback across the whole platform. Email digest delivery is deferred to Phase 2 alongside general SMTP integration.

**Today's Digest panel refresh cadence:** on every dashboard page load + every 15 minutes while the dashboard is open. Stale digests (> 15 minutes since last refresh) display a "Refresh" action and an age indicator.

**Reports Inbox is user-scoped.** Each user sees only the reports delivered to them based on their role and scheduled subscriptions. Super Admin can see all reports across all users.

**Report file retention:** PDFs and XLSX files retained in the Reports Inbox for 90 days; then archived to a cold-storage location per 5-year financial record retention rule. Archived reports remain accessible via an archive browser.

**Churn risk weights are tenant-configurable but shipped with IMI defaults.** Tenants must not be able to set weights summing to anything other than 100% — UI enforces normalisation.

**HOD Dashboard filter enforcement is server-side.** The client-side UI filters by `department_id`, but the API also enforces that HODs cannot query data outside their department even via direct API calls. Prevents data leakage across departments.

**Operational threshold state transitions fire concerns.** Any threshold moving from green → amber or amber → red creates a concern via F.11 routed to Admin Head. Transitions back to green close the concern with reason "auto-resolved — metric back within threshold."

**AI cost meter displayed as a threshold.** M10 shows the tenant's current F.12 AI spend as one of the operational thresholds. Displays percentage-of-ceiling with the same green/amber/red bands (green <80%, amber 80–95%, red >95%).

**Live Activity Feed is append-only and immutable.** Feed entries cannot be edited or deleted, only archived after 30 days from live view (retained in audit log per 5-year rule).

## Connects

- **F.4 entities** — reads all core entities for aggregation; introduces none
- **F.7 approval gateway** — not directly used (M10 is read-only on domain data)
- **F.10 UI foundation** — chart components, KPI cards, heatmap components built on Band 1 tokens
- **F.11 Concern Engine** — M10 emits operational-threshold concerns; consumes academic concerns for the Academic Alerts View
- **F.12 AI Integration Rules** — M10 displays cost meter as an operational threshold; does not consume AI itself
- **F.13 automation engine** — M10 emits a small number of trigger events and consumes churn-related triggers
- **F.14 Segment Cache Rules** — operational metrics cached per F.14; refresh intervals per metric configured in M20

**F.13 trigger events emitted by M10:**

| **Event** | **F.13 trigger type** | **Payload** |
|---|---|---|
| `churn_score_crossed_high` | Threshold breach | student_id, score_value, contributing_signals |
| `churn_score_crossed_critical` | Threshold breach | student_id, score_value, contributing_signals |
| `operational_threshold_amber` | Threshold breach | threshold_id, metric, value |
| `operational_threshold_red` | Threshold breach | threshold_id, metric, value |
| `report_generated` | Status change | report_id, recipient_user_id, format |

- **Band 1 Item 8** — reads staff data
- **M01** Lead Management — pipeline value, source attribution, unclaimed lead rate
- **M05** Timetabling — seat occupancy source
- **M06** Attendance — attendance % rolling, 48h breach rate, no-show rate
- **M07** Feedback & Communications — NPS, complaint volume
- **M08** Finance & Billing — revenue source, outstanding invoices, predicted month-end, gateway log
- **M09** Staff & Performance — staff KPIs, CPD progress aggregate, pending HR actions
- **M11** Academic Courses — subject/course reference for breakdowns
- **M13** Automation & Communications — automation execution statistics
- **M14** Assignment Library — marking timeliness aggregate
- **M16** Task Management — task backlog, overdue rate
- **M17** Student Profile — click-through drill-down target
- **M18** Guardian Profile — click-through drill-down target
- **M19** Progress Tracking — Academic Alerts consolidation, report dispatch stats
- **M20** Tenant Settings — all M10 configuration (weights, thresholds, card library, digest panel content selection, report schedules)

## Out of scope (Phase 2)

- **Email / WhatsApp / SMS delivery of digests or reports** — all digest content is in-platform only in v1. Email digest delivery is Phase 2 alongside general SMTP integration.
- Custom dashboard builder — user cannot create arbitrary dashboards in v1; only tenant-configurable KPI card library selection and ordering
- Embedded BI tool integration (Power BI, Tableau)
- Real-time streaming updates — refresh intervals only in v1
- Drill-down beyond direct source module navigation
- Predictive analytics beyond churn score and predicted month-end revenue
- Multi-tenant comparative benchmarking
- Parent-facing dashboards
- Public share links for dashboards
- Scheduled report delivery to external email addresses (internal staff only in v1)
- Automated narrative commentary on dashboard movements (AI commentary not in M10 v1)
- Voice briefings / audio summaries
- Mobile-native dashboard app
- Cohort comparison across academic years (single-year view in v1)

## UI specifics

**M10 Home (role-adapted landing):**
- Top row: KPI cards (8 default, configurable)
- Second row: Churn Risk summary card + Operational Thresholds strip
- Third row: Revenue Dashboard chart + Seat Occupancy heatmap
- Fourth row: Academic Alerts View + Live Activity Feed
- Right rail: Reports Inbox preview (latest 5 unread)

**Churn List:**
- Sortable table
- Band filter chips
- Row actions: Log Contact, Surface Retention Template, Assign Task, Dismiss (with cooldown)
- Side panel on row click: contributing signals breakdown

**Seat Occupancy Heatmap:**
- Days × time slots grid
- Cell colour by utilisation % (empty → full → over-scheduled)
- Click cell to see session details and teachers

**Revenue Dashboard:**
- Time range selector (month/quarter/year/custom)
- Stacked bar by department
- Breakdown toggles: subject, frequency tier, discount type, gateway
- Predicted month-end line with confidence range

**Live Activity Feed:**
- Chronological stream with event type icons
- Filter chips
- Pause/resume auto-refresh toggle
- Click event to open relevant record

**Academic Alerts View:**
- Concern cards grouped by severity
- Filters: department, subject, trigger type, owner
- Inline acknowledge/assign/resolve actions

**Operational Thresholds Strip:**
- Horizontal row of threshold indicators
- Colour by band
- Tooltip shows current value vs configured band ranges
- Click to see threshold history chart

**HOD Dashboard:**
- Same layout as main M10 but pre-filtered to current user's department
- Additional: HOD Workload indicator panel, department-specific concerns

**Reports Inbox:**
- Inbox-style list: unread/read states, generated timestamp, report type, quick preview
- In-platform PDF/XLSX viewer
- Download button
- Archive action
- **Financial report types** (Revenue, Invoices, Payments, Churn-Financial) are gated by `reports.viewFinancial` — visible only to Super Admin, Admin Head, Admin, and HR/Finance. Academic Head and HOD see the Reports module but financial report types are hidden from their report type picker. They can generate, schedule, and export academic report types only (Attendance, Progress, Academic Alerts, Staff Academic, Assessment).

**Today's Digest Panel (top of M10 home):**
- Horizontal strip below KPI cards
- Content sections: new reports (count + click-through), KPI deltas vs yesterday, critical concerns (count), overdue tasks, churn alerts (24h), threshold band changes
- Daily/Weekly mode toggle
- Age indicator + Refresh action when stale (>15 min)
- Dismiss action per section (re-appears next refresh)

**M20 Configuration Panel (linked from M10):**
- Churn weight sliders (must sum to 100%)
- Threshold band editors
- KPI card library picker
- Digest panel content selection per role
- Today's Digest preview action

---

# Item 20 — FM01 Field Mapping + FM02 Data Import Specification

## Purpose

Migration tooling is the highest-risk go-live activity for any tenant. Item 20 combines FM01 (the field map guide: legacy system → Enrolla entity mapping) and FM02 (the data import specification: CSV schemas, import UI, validation, dry-run, commit, rollback, re-import). Both **Track A (CSV import)** and **Track B (guided wizard)** ship in v1 per the Turn 1 decision — Track A for technical operators with clean data, Track B for non-technical admins who need step-by-step guidance. FM01/FM02 is the go-live de-risking module and must be built last because it targets the final schema of every other module.

## What to build

**FM01 — Field Mapping Guide (platform documentation + runtime reference):**

1. **Migration Principles document** — canonical rulebook for every migration: idempotency (re-runnable imports), referential integrity (parents before children), field conservatism (never invent data that's not in the source), audit trail (every imported record tagged with source system + source ID + import batch ID).
2. **Entity Import Order** (phased approach) — fixed sequence: (1) Staff, (2) Guardians, (3) Students, (4) Courses/Subjects, (5) Enrolments, (6) Invoices & Payments, (7) Attendance history, (8) Leads, (9) Tasks. Each phase must complete before next starts.
3. **Classcard → Enrolla field maps** for Students, Guardians, Staff — per-field mapping tables with source column, Enrolla target field, transformation rule, nullability behaviour.
4. **Google Contacts → Enrolla field map** for Guardian Directory — handles vCard-style imports, merges with Classcard guardian data via email/phone match.
5. **Zoho Forms → Enrolla field map** for Enquiry/Lead records — maps Zoho's form submissions to M01 Lead schema with source_channel = "legacy_zoho_forms".
6. **ClickUp → Enrolla field map** for Task Migration — maps ClickUp tasks to M16, preserving assignees (matched by email), due dates, and status where possible.
7. **Financial data migration ruleset** — separate rules for (a) active invoice balances, (b) historical invoices, (c) the AED 300 lifetime enrolment fee (preserved per-student from legacy records, never re-charged).
8. **Data Quality Pre-Migration Checklist** — 20-point checklist that tenant must complete before initiating migration (e.g. duplicates resolved in source, DNC flags consolidated, enrolment statuses reconciled).
9. **Post-Migration Validation** — prescribed verification steps: row counts match, financial sums match, sample record spot-checks, referential integrity audit, broken link report.

**FM02 — Data Import Specification (the import tool itself):**

10. **Track A — CSV Import** — direct upload of pre-formatted CSV files against the defined import file schemas. For technical operators with clean, transformed data.
11. **Track B — Guided Wizard** — step-by-step wizard that accepts raw legacy exports (Classcard export, Zoho Forms export, ClickUp export, Google Contacts vCard), interactively maps columns to Enrolla fields with suggested auto-mappings, validates inline, and produces a Track A-compatible CSV plus the final import. For non-technical admins.
12. **Eight import file schemas** (both tracks produce the same final files):
    - Student Import File
    - Guardian Import File
    - Staff Import File
    - Enrolment Import File
    - Invoice Import File
    - Attendance Import File
    - Lead Import File
    - Task Import File
13. **Global file format rules** — UTF-8 encoding (for CSV file format only — does not imply Arabic script support, per locked English-only rule), comma delimiter, quote-enclosed strings, ISO-8601 dates, explicit boolean literals (TRUE/FALSE), blank cells for nulls, header row mandatory.
14. **Required vs Optional columns per file** — required columns enforced at parse time (missing → parse fails); optional columns permissive.
15. **System-Generated Fields** — explicit list of columns that must NOT be included in imports (IDs, audit timestamps, computed values). Import fails if these are present.
16. **Import Interface Behaviour** — upload → parse → validate (dry-run) → preview report → commit or cancel → post-import report.
17. **Dry-run mode** — mandatory before commit. Produces row-by-row validation report: pass/warn/fail per row, aggregated counts, downloadable error CSV for correction.
18. **Test Window Import Behaviour** — during the tenant's onboarding test window (M20), imports can be committed then fully rolled back within 48 hours. After test window ends, rollback is no longer available; only re-import with corrections.
19. **Post-Import Report** — for every committed import: total rows, successful rows, skipped rows, warnings, errors, generated Enrolla IDs mapping, time taken, initiating user.
20. **Import Audit Trail** — every import batch retained permanently with source file hash, column mapping, validation output, commit record, post-import report. 5-year retention minimum per financial record rule.
21. **Re-Import and Correction** — after initial import, subsequent imports match on `source_system_id` + `source_record_id` to update existing records rather than create duplicates. Idempotency guaranteed.
22. **Manual enrolment entry for 358 IMI students with no Batch data** — Classcard export has 358 active students with no Batch field populated. These must be entered manually by Admin post-import (captured as a known IMI migration task, documented in FM01).

## Data captured

**Import Batch entity:** `batch_id`, `tenant_id`, `initiated_by_user_id`, `initiated_at`, `track` (csv_a / wizard_b), `source_system` (classcard/zoho/clickup/google_contacts/custom), `target_entity_type`, `source_file_hash`, `column_mapping` (JSON), `row_count`, `status` (uploaded/validating/dry_run_complete/committed/rolled_back/failed), `dry_run_report_path`, `commit_report_path`, `committed_at`, `rolled_back_at`, `rollback_deadline_at` (null outside test window).

**Import Row entity (one per source row):** `row_id`, `batch_id`, `source_row_number`, `source_system_id` (raw value from source), `source_record_id` (e.g. Classcard student ID), `validation_status` (pass/warn/fail), `validation_errors[]`, `validation_warnings[]`, `target_entity_id` (populated on commit), `target_entity_type`, `action` (create/update/skip), `raw_values` (JSON), `transformed_values` (JSON).

**Field Mapping Template entity (FM01 ruleset, platform-managed):** `mapping_template_id`, `source_system`, `target_entity_type`, `field_maps[]` (source_column, target_field, transformation_rule, required, default_value), `version`, `notes`.

**Column Mapping Draft entity (Track B wizard state):** `draft_id`, `batch_id`, `user_id`, `uploaded_file_path`, `detected_columns[]`, `suggested_mappings[]`, `user_overrides[]`, `last_saved_at`.

## Rules

**Fixed entity import order is mandatory.** Attempting to import a child entity before its parent fails at the parse stage (e.g. importing an Enrolment before its Student is imported produces a validation error). This protects referential integrity.

**Idempotency via source IDs.** Every imported record carries `source_system` + `source_record_id`. Re-importing the same source record updates the Enrolla record rather than creating a duplicate. This is what makes re-imports for corrections safe.

**Field conservatism rule.** The import tool never invents data that isn't in the source. Missing optional fields stay null. Missing required fields produce a validation error; they are never defaulted silently.

**Dry-run is mandatory before commit.** No commit action is available until a successful dry-run has run for the batch. Dry-run output is retained in the batch audit regardless of whether commit happens.

**Track A and Track B produce identical final outputs.** The wizard (Track B) is a UI layer over the same underlying import pipeline. Track B writes a "Track A-compatible CSV" as a side artefact so that users can export their wizard session for external review or re-use.

**Rollback is test-window-only.** During the M20 onboarding test window, committed imports can be rolled back fully within 48 hours (reverses all created records, leaves audit trail). Outside the test window, rollback is not available — corrections must go through re-import with source_record_id match.

**Financial activity blocks rollback.** Even inside the test window, if any financial transaction has been recorded against imported records (invoice marked paid, credit issued, payment received), rollback is blocked with the same financial activity gate used by M12 merge rollback.

**System-generated field presence fails the import.** Any CSV containing columns for IDs, `created_at`, `updated_at`, computed fields, or audit fields is rejected at parse time with a clear error indicating which columns must be removed.

**Column mapping suggestions in Track B use fuzzy matching.** The wizard suggests target field mappings based on column name similarity, historical mapping decisions across tenants, and value pattern detection (e.g. detecting phone formats, email formats, date formats). User can accept, override, or mark a column as "ignore".

**Post-import report is mandatory.** Cannot close a batch without acknowledging the report. Report is delivered to the initiating user's Reports Inbox in M10 and available for download as PDF and CSV.

**Manual entry fallback for IMI-specific gaps.** The 358 students without Batch data in the Classcard export are imported successfully (Batch is optional), but each gets flagged in M10 as "Enrolment details pending manual entry." Admin works through the list post-migration using a dedicated worklist view.

**Audit trail is immutable.** Import batch records, row-level results, and post-import reports are never deleted. Retention falls under the 5-year minimum rule.

**Test Window reset is allowed.** During the tenant test window, Super Admin can reset the entire tenant to factory state (wipes all test data) and re-import from scratch. One-click action with typed confirmation. Unavailable outside the test window.

## Connects

- **F.4 entities** — every core entity is a migration target
- **F.7 approval gateway** — commit and rollback actions route through F.7 with logged reasons
- **F.10 UI foundation** — wizard uses Band 1 tokens
- **F.11 Concern Engine** — does not emit concerns during migration (migration is a bulk operational action, not ongoing monitoring)
- **F.13 automation engine** — migration-imported records do NOT fire creation-event automation triggers (prevents triggering thousands of automations on bulk import). Automations resume firing on records modified or created after migration completes. This is a platform safety rule.

**F.13 trigger events emitted by FM01/FM02:**

| **Event** | **F.13 trigger type** | **Payload** |
|---|---|---|
| `migration_batch_started` | Status change | batch_id, user_id, target_entity_type, track |
| `migration_dry_run_complete` | Status change | batch_id, pass/warn/fail counts |
| `migration_committed` | Status change | batch_id, row_count, duration_ms |
| `migration_rolled_back` | Status change | batch_id, user_id, reason |
| `test_window_reset` | Status change | tenant_id, user_id |

- **M01** Lead Management — Lead import file target
- **M02** Student & Guardian CRM — Student and Guardian import files target
- **M04** Enrolment Lifecycle — Enrolment import file target
- **M06** Attendance — Attendance import file target
- **M08** Finance & Billing — Invoice import file target; financial activity gate on rollback; enrolment fee preservation rule
- **M09** Staff & Performance — Staff import file target
- **M10** Management Dashboard — post-import reports delivered to Reports Inbox; manual entry worklist for the 358 unbatched students
- **M11** Academic Courses — Course/Subject reference data (typically pre-loaded in M20 before any entity import)
- **M16** Task Management — Task import file target (ClickUp migration)
- **M17** Student Profile — migrated source_system_id visible for traceability
- **M18** Guardian Profile — migrated source_system_id visible for traceability
- **M20** Tenant Settings — test window flag, rollback availability gate, factory reset action, field mapping template overrides for tenant-specific edge cases

## Out of scope (Phase 2)

- **Real-time sync** with legacy systems (one-shot migration only in v1; no live mirroring during a transition period)
- **API-based import** from Classcard or any other external system (CSV-only in v1)
- **Automated transform scripts** beyond the column-mapping layer (complex transformations require pre-processing in a spreadsheet or script before upload)
- **Migration from systems other than the supported four** (Classcard, Zoho Forms, ClickUp, Google Contacts) — custom mappings in v1 must be built as raw CSV against Enrolla's import schemas
- **Delta sync / incremental migration** — every import is a full batch; no diff-based updates beyond source_record_id idempotency
- **Visual mapping UI for complex transformations** (concatenation, splitting, conditional logic) — Track B wizard supports column-to-column 1:1 mapping only in v1
- **Parallel imports** across tenants (one tenant migration at a time)
- **Rollback outside test window**
- **Media file migration** (student photos, uploaded documents) — Phase 2
- **Class discussion thread migration** from any source — Phase 2
- **Complaint history migration** from any source — Phase 2
- **AI-assisted column mapping** beyond the fuzzy-match heuristic
- **Migration from Enrolla to Enrolla** (cross-tenant move) — Phase 2
- **Scheduled / dry-run-only weekly imports** for ongoing integrations — Phase 2 alongside general integrations

## UI specifics

**Migration Home (M20 → Migration tab):**
- Entity import order checklist (visual indicator of which phase has completed)
- "Start new batch" button → choose Track A or Track B
- Batch history list with status chips
- Test window countdown indicator if inside window

**Track A — CSV Import Flow:**
- Step 1: Select target entity type (Student/Guardian/Staff/Enrolment/Invoice/Attendance/Lead/Task)
- Step 2: Upload CSV (drag-and-drop)
- Step 3: Parse result summary (column detection, row count)
- Step 4: Run dry-run (validation results inline, downloadable error CSV)
- Step 5: Review preview (first 20 rows with transformations applied)
- Step 6: Commit (typed confirmation) or Cancel
- Step 7: Post-import report (full summary + link to Reports Inbox)

**Track B — Guided Wizard Flow:**
- Step 1: Select source system (Classcard / Zoho / ClickUp / Google Contacts / Custom)
- Step 2: Select target entity type
- Step 3: Upload raw export file
- Step 4: **Column mapping interface** — left: detected source columns with sample values; right: Enrolla target fields; centre: suggested mappings with accept/override/ignore actions
- Step 5: Transformation rules (date format, boolean literals, phone format — pre-configured based on source system template)
- Step 6: Dry-run with inline validation
- Step 7: Preview
- Step 8: Commit + save column mapping as template for future batches
- Step 9: Post-import report

**Dry-Run Report View:**
- Summary strip: pass count, warn count, fail count
- Row-by-row table with validation status colour-coding
- Filter by status
- Click row to see full validation messages
- Download error CSV action

**Commit Confirmation Modal:**
- Summary counts
- Warning about rollback availability (test window vs production)
- Typed confirmation field ("COMMIT" typed to enable)

**Post-Import Report:**
- Full batch summary
- Generated Enrolla IDs mapping (source → target)
- Download PDF / Download CSV actions
- Link to Reports Inbox
- Batch retained in history

**Test Window Factory Reset:**
- Prominent "Reset tenant to factory state" action (only visible inside test window, Super Admin only)
- Typed confirmation ("RESET") + mandatory reason
- Warning listing what will be wiped

**Manual Entry Worklist (for 358 IMI students without Batch data):**
- Dedicated M10 worklist view surfaced post-migration
- Filters: students with missing Batch, students with missing enrolment details
- Inline Batch assignment action
- Progress indicator showing resolved vs pending

---

*End of Band 2 Items 9–20. This completes Band 2 of the Enrolla PRD.*
