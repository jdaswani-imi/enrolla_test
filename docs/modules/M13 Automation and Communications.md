---
module: "M13"
title: "Automation & Communications"
layer: "Operations"
folder: "07_Operations"
status: "Draft"
phase: "v1"
dependencies: [M12, REF-01]
tags: [enrolla, prd, operations, automation]
---

# ENROLLA
# [[07_Operations-M13_Automation_Communications|M13]] — Automation & Communications
v1.6 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

[[07_Operations-M13_Automation_Communications|M13]] is the automation and communications engine for Enrolla. It governs how the platform responds to events, manages internal workflows without human intervention, delivers communications to staff and guardians, and maintains a template library for all outbound messages. [[07_Operations-M13_Automation_Communications|M13]] is designed to operate entirely without any external integration. External integrations — WhatsApp BSP, Zoho Books, Zoho People, Google Calendar, payment gateways, Instagram, and Mailchimp — are Phase 2 additions that enhance the platform but are never prerequisites for core operation.

| **Property** | **Value** |
|---|---|
| Module code | [[07_Operations-M13_Automation_Communications|M13]] |
| Version | v1.6 |
| Status | Draft |
| Sub-modules | [[07_Operations-M13_Automation_Communications|[[07_Operations-M13_Automation_Communications|M13]].B]] Automation Addendum (folded into Section 5) |
| Primary roles | Super Admin, Admin Head |
| Secondary roles | Admin (template use, message send), all staff (personal template library, internal messaging) |
| Scope | Internal automations, template library, internal messaging, copy-paste communication fallbacks |
| External integrations | Phase 2 — not built in v1 |
| Dependencies | [[03_Student-M01_Lead_Management|M01]], [[03_Student-M02_Student_Guardian_CRM|M02]], [[03_Student-M04_Enrolment_Lifecycle|M04]], [[04_Academic-M05_Timetabling_Scheduling|M05]], [[04_Academic-M06_Attendance_Makeups|M06]], [[04_Academic-M07_Feedback_Communications|M07]], [[06_Finance-M08_Finance_Billing|M08]], [[05_People-M09_Staff_Performance|M09]], [[08_Management-M10_Management_Dashboard|M10]], [[05_People-M12_People_Forms|M12]], [[07_Operations-M16_Task_Management|M16]], [[03_Student-M17_Student_Profile|M17]], [[09_Settings-M20_Tenant_Settings|M20]] |
| Phase | v1 |

---

# 01.1 Standalone App Principle

Enrolla is a complete operational platform that functions without any external service connection. This is a non-negotiable architectural principle. Every workflow, notification, and communication in v1 has a fully functional path that requires no third-party integration.

| **Scenario** | **How the App Handles It Without External Integration** |
|---|---|
| WhatsApp message to parent | The system generates a fully resolved, copy-paste-ready message. All variable fields (student name, session date, amount, etc.) are resolved from the relevant record. Staff copy and send manually via their personal WhatsApp. |
| Invoice sent to parent | Invoice PDF is generated and available for download. Admin sends via their own email or WhatsApp manually. |
| Automation fires | Internal notifications are delivered in-app. Any outbound message is generated as a copy-paste-ready text for the designated staff member. |
| Report delivered | Report PDF is generated in-platform. Admin downloads and sends to the parent manually or via copy-paste. |

---

# 01.2 Template Library

The template library holds all configurable message templates used by the automation engine and by staff for manual communications. Templates are divided into personal templates (visible only to the creator) and org-wide templates (visible to all eligible staff after Admin Head or Super Admin approval).

| **Element** | **Detail** |
|---|---|
| Template types | WhatsApp, Email, In-app notification |
| Personal templates | Created by any staff member. Visible only to the creator. No approval required. |
| Org-wide templates | Created by Admin Head or Super Admin. Visible to all eligible staff. Require Admin Head or Super Admin approval before publishing. |
| Template approval | Submitted for approval by the creator. Reviewed and approved or rejected by Admin Head or Super Admin. Rejection includes a reason. |
| Merge fields | Variables resolved from the triggering record at send time: [student name], [parent name], [subject], [session date], [session time], [teacher name], [school name], [year group], [tenant name], [amount], [due date], and others. |
| Versioning | Editing a published org-wide template archives the previous version and creates a new draft pending re-approval. Prior version remains active until the new version is approved. |
| Template use | Staff select a template when composing a manual message or when configuring an automation action. The template resolves all merge fields against the target record before presenting the copy-paste text. |

---

# 01.3 Internal Messaging

[[07_Operations-M13_Automation_Communications|M13]] supports staff-to-staff internal messaging within the platform. Internal messages support deep-link tagging of records — any staff member, student profile, invoice, concern, or complaint ticket can be referenced by deep-link within a message.

| **Element** | **Detail** |
|---|---|
| Recipients | Any staff member, role group, department group, or custom group |
| Deep-link tags | Any platform record can be tagged in a message. Clicking the tag navigates directly to the linked record. |
| Thread types | General, Complaint, Scheduling, Academic Concern, Feedback, Financial, Meeting |
| Reactions | Staff can react to messages with emoji reactions |
| Retention | Internal messages are retained permanently |
| Read status | Read receipts per message per recipient |

---

# 01.4 Automation Engine

The automation engine executes configured trigger-action rules without human intervention. Each automation rule has a defined trigger event, optional conditions, and one or more actions. All automations are internal to Enrolla in v1.

A segment referenced by one or more active automation rules cannot be deleted. Attempting to delete such a segment displays an error listing the dependent automation rules. The rules must be deactivated or updated to remove the segment reference before the segment can be deleted.

**DNC suppression in automation actions:** When an automation rule fires an outbound message action and the target guardian has an active DNC flag, the message action is suppressed silently. No message is generated and no copy-paste text is presented to Admin. The suppression is logged on the automation execution history with the reason DNC flag active. The suppression does not cause the automation rule to fail or stop — all other actions in the same rule continue to execute. Admin receives an in-app notification that the message action was suppressed: "Automation [rule name] — outbound message suppressed for [Guardian name] — DNC flag active."

## 01.4.1 Automation Rule Structure

| **Component** | **Detail** |
|---|---|
| Trigger | The event that fires the rule. Selected from the trigger library (see 01.5). |
| Conditions | Optional filters applied after the trigger to narrow which records the rule acts on (e.g. department = Primary, year group = Y10). |
| Actions | One or more actions executed when the trigger fires and conditions are met. Actions execute in sequence. |
| Wait / delay | A Wait action can be inserted between any two actions to pause execution for a configured duration (hours or days). |
| Status | Active or Paused. Paused rules do not fire but are retained in the audit log. |

> **Partial Automation Rule Failure Behaviour:** When an action in a multi-step automation rule fails, execution continues to all remaining actions in the sequence. The failed action is skipped — it does not block subsequent actions. Example: a 4-action rule where Action 2 fails will still execute Actions 3 and 4. The failed action is logged with status Failed and a reason. Super Admin receives an in-app and email notification: '[Automation rule name] — Action [N] failed — [reason] — [record affected]. Actions before and after this step completed successfully.' No completed actions are rolled back. The automation rule's overall status is logged as Partial — not Failed — to distinguish it from a rule that did not execute at all.

## 01.4.2 Action Types

| **Action** | **Detail** |
|---|---|
| Send in-app notification | Send a notification to a named staff member, role group, or department. Notification appears in the platform notification centre with the configured message. |
| Create task | Create a task in [[07_Operations-M16_Task_Management|M16]] assigned to a named staff member, role, or department. Task priority, due date, and linked record are configurable. |
| Generate copy-paste message | Resolve a selected template against the triggering record and present it to a designated staff member as a copy-paste-ready message. Staff send manually via WhatsApp or other channel. |
| Update record field | Update a field on a student, lead, or staff record — e.g. set a flag, update a status, add a note. |
| Add to segment | Add the contact to a named org-wide segment in [[05_People-M12_People_Forms|M12]]. |
| Add to broadcast list | Add the guardian to a configured broadcast list in the platform. When BSP is connected (Phase 2), this also updates the external BSP list. |
| Move pipeline stage | Move a lead to a specified [[03_Student-M01_Lead_Management|M01]] pipeline stage. |
| Apply High Churn Flag | Raise the High Churn Flag on a student's profile and surface them in the [[08_Management-M10_Management_Dashboard|M10]] churn watchlist. |
| Create makeup suggestion | Generate a list of suggested makeup slots for Admin to review and confirm. Does not book the makeup automatically. |
| Archive record | Archive a lead or staff record (subject to blocking conditions below). |
| Log contact note | Create a logged contact note on a student or lead's communication log. |
| Send report to user | Generate and deliver a report to a named user's [[08_Management-M10_Management_Dashboard|[[08_Management-M10_Management_Dashboard|M10]].A]] reports inbox. |
| Trigger termly summary report | Generate the termly summary report for a student from accumulated session feedback. |
| Wait / delay | Pause automation execution for a configured duration before the next action. Configurable in hours or days. |
| Send Profile Update Link | Generate a Profile Update Link for the linked guardian and send it via the configured channel (email in v1). This action can be used in re-enrolment outreach flows or annual data verification campaigns. **No-email fallback:** If the guardian has no email address on file at the time the automation action fires, the action fails gracefully — no link is generated and no error is thrown to the automation engine. The failure is logged on the automation execution record. A High priority task is automatically created and assigned to Admin: 'Profile Update Link cannot be sent — no email address on file for [Guardian name] linked to [Student name]. Add an email address to the guardian profile and resend manually.' The automation rule continues to execute any remaining actions. |

**Blocking conditions for Archive Record action:** The Archive Record action is blocked (the automation fails gracefully with a notification to Super Admin) if the target record has any of the following:
- Active enrolments (for student records)
- Outstanding unpaid invoice balance
- Open [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern records assigned to this record
- Pending tasks linked to this record

When blocked, the automation logs a Failed status and Super Admin receives a notification: '[Automation rule name] — Archive Record action blocked for [record name] — [reason]'.

---

# 01.5 Automation Trigger Library

## 01.5.1 Lead Management Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| Lead created in any department | Assignment method per department; fallback assignee; lead entry stage |
| Lead assigned to staff member who is on leave | Handover designee; fallback: HOD; fallback-fallback: Admin Head |
| Lead source is Referral but referring guardian is not linked (1B) | Referral source options: linked guardian / blank / Other. No block applied. No referral reward triggered until guardian is explicitly linked. |
| Lead inactive for X hours/days with no follow-up | Inactivity threshold (default: 1 day); escalation to High priority (default: 3 days) |
| Lead stuck in same pipeline stage for X days | Days per stage threshold (default: 10) |
| Lead converted to student (status = Won) | Error notification recipients (default: Super Admin) |
| Trial class completed with no follow-up after X days | Days threshold (default: 1 day); task priority (default: High) |

## 01.5.2 Enrolment & Lifecycle Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| Student enrolled with no invoice for that subject | Alert recipients (Admin for that department + Admin Head) |
| Student enrolled but mandatory profile fields blank after X hours | Mandatory field list ([[09_Settings-M20_Tenant_Settings|M20]]); task due date (default: 24 hours) |
| Student's first invoice marked as Paid | Department-to-list mapping ([[09_Settings-M20_Tenant_Settings|M20]]) |
| Student withdrawn | Re-engagement timing (2 weeks and 1 week before next term start) |
| Term completed for enrolled student | Report template ([[09_Settings-M20_Tenant_Settings|M20]]); delivery method (Admin-sent) |
| Student approaching graduation date | Days before graduation (default: 30) |
| Student re-enrols after prior withdrawal (2A) | Verification task due date (default: 48 hours) |
| Student transitions to Graduated or Alumni status (2B) | Fixed behaviour |
| Attempt to enrol a student in an archived subject (2C) | Fixed behaviour — hard block |

## 01.5.3 Attendance Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| Absence recorded — within allowance | Department (filter by) |
| Absences exceed departmental makeup allowance | Allowance threshold (defined in subject configurator) |
| Absence count reaches allowance minus 1 | None |
| No-show logged | None |
| 3 or more absences in rolling X-day window | Absence count (default: 3); window in days (default: 45) |
| Makeup expiry approaching — X days | Days threshold (default: 14 and 7) |
| Attendance marked more than 48 hours after session | Hours threshold (default: 48) |
| Student absent for 3 consecutive scheduled days | Subject (filter by); consecutive threshold (default: 3) |
| Cover session delivered — cover teacher is the attendance marker (3B) | Fixed behaviour |
| Session has no enrolled students — attendance disabled (90m) | Fixed behaviour |

## 01.5.4 Finance Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| Invoice issued but not paid after X days | Days threshold (default: 7) |
| Invoice overdue — escalation threshold | Days overdue (default: 7 for Admin Head notification) |
| Invoice part-paid | None |
| Invoice marked as Cancelled | None |
| Payment plan instalment due in X days | Days threshold (multiple: default 7, 3, 1) |
| Payment plan instalment missed | None |
| Zero-value invoice created | None |
| Student credit balance expiry approaching | Days threshold (multiple: default 30, 14, 7, 1) |
| Discount applied causes invoice total to go below zero (4B) | Fixed behaviour — hard block |
| Payment recorded amount exceeds invoice subtotal (4D) | Fixed behaviour — hard block |
| Enrolment fee missing from first invoice | None — fires at first invoice creation |
| Revenue tag mismatch on invoice (79) | Fixed behaviour — flag only |
| Invoice edited after being marked as Paid (185) | Fixed behaviour — hard lock financial fields |

## 01.5.5 Concerns & Complaints Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| Concern raised at L1 | Subject (filter by); department (filter by) |
| Concern at L2 — no action after SLA days | SLA days (default: 5) |
| Concern open beyond SLA — no parent contact | Days (default: 7) |
| Concern raised for student whose guardian has DNC flag (5A) | Fixed behaviour — DNC suppresses marketing only, not concern notifications |
| Student is High Risk in [[08_Management-M10_Management_Dashboard|M10]] AND has open L2/L3 concern (120) | Fixed behaviour — immediate combined flag escalation to Admin Head |
| 3+ concerns against same teacher in one term | Threshold (default: 3) |
| Complaint ticket raised | None |
| 3+ complaint tickets for same student in one term | Threshold (default: 3) |
| Complaint ticket unresolved after X days | Days (default: 14) |

## 01.5.6 Scheduling & Timetable Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| Session scheduled with no invoice for enrolled student | None |
| Cover required — teacher absent or unavailable | None |
| Session cancelled | None |
| Room double-booked | None — fires at scheduling |
| Waitlist slot opens | None |
| Student balance not fully scheduled — X weeks before term end | Weeks threshold (multi: 2 weeks, 1 week, 3 days) |
| Session recurrence ends — active student has no future sessions | None |

## 01.5.7 Staff & HR Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| Mandatory profile fields incomplete after first login | None — fires on each login until complete |
| Staff document expiring in X days | Days per document type (configurable individually in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Staff last working day approaching | Days (default: 7, 3, 1) |
| Staff 6-month milestone | None |
| Staff 1-year milestone | None |
| Workload amber alert — 90%+ for 3 consecutive weeks | Threshold (default: 90%); weeks (default: 3) |
| Workload red alert — at or above 100% or 110%+ any week | Red threshold (default: 100% or 110%+ any week) |
| Off-boarding initiated | None |
| Off-boarding checklist incomplete on last working day | None |

## 01.5.8 Churn & Retention Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| Student overall churn score crosses high-risk threshold | Threshold (default: 70 — configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Churn score increases by X+ points in one day | Points threshold (default: 20) |
| Student in High Risk for X days with no retention action | Days (default: 14) |
| Student re-enrolled after withdrawal | None |
| Guardian app inactive for X days | Days (default: 14) |

## 01.5.9 Feedback & Quality Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| Per-class feedback marked ready to send by teacher | None |
| NPS score of 6 or below received | Score threshold (default: 6 or below) |
| NPS score of 9 or 10 received | Score threshold (default: 9 or above) |
| Recurring low feedback scores for same teacher — X sessions | Sessions threshold (default: 3 consecutive) |
| Teacher has not submitted feedback for X consecutive sessions | Threshold (default: 3) |
| AI feedback summary not actioned after X days | Days (default: 3) |

## 01.5.10 Tasks & Admin Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| Task assigned | None |
| Task assignee is on approved leave | None — fires on assignment |
| Task overdue — past due date | None — fires day after due date |
| Task snoozed X times (Medium/High/Urgent only — Low exempt) | Snooze count (default: 3) |
| High priority task not actioned after X hours | Hours (default: 24) |
| Approval gateway request unactioned after 24 hours | Hours (default: 24) |

## 01.5.11 Platform & Onboarding Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| Onboarding stage completed | Stage number (filter by) |
| DPA not signed at Stage 1 | None |
| First student record created — Student ID format locked (11D) | System lock + Super Admin notification |
| First invoice issued — invoice number prefix locked (11E) | System lock + Super Admin notification |
| Tenant go-live confirmed at Stage 10 | None |

## 01.5.12 Progress & Academic Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| 24 hours pass after session — no progress tracker entry | Hours (default: 24) |
| Student grade drops by any amount in a subject | None |
| Student below 50% assignment submission at halfway point | Submission rate (default: 50%) |
| Teacher has no assignments set for X consecutive sessions | Sessions (default: 2) |
| Assessment completed — no sessions scheduled after X days | Days (default: 3) |

## 01.5.13 Events & Inventory Triggers

| **Trigger** | **Configurable Variables** |
|---|---|
| Event at minimum enrolment threshold X days before start | Days (default: 7); minimum enrolment count (per event) |
| Event cancelled | None |
| Inventory item reaches reorder threshold | Threshold per item (configurable in [[M15 — Inventory|M15]]) |
| Inventory item reaches zero stock | None |
| Inventory item expiry approaching — X days | Days (default: 30) |

---

# 01.6 Pre-Built Automation Templates

The following automations are pre-built and available to activate with one click. All can be viewed, edited, or cloned before activation.

| **Template Name** | **Trigger** | **Default Actions** | **IMI Default** |
|---|---|---|---|
| No-contact lead follow-up | Lead inactive 24 hours | Create task for lead owner (High priority) | ON |
| Lead pipeline stall alert | Lead stuck in stage 10 days | Notify assignee + Admin Head | ON |
| Assessment booking reminder | Booking link not used after 48 hours | Create follow-up task for Admin | ON |
| Trial no follow-up | Trial completed — no follow-up 24 hours | Create High priority task for Admin | ON |
| Invoice overdue — 7 days | Invoice unpaid 7 days | Create task for Admin | ON |
| Invoice overdue — Admin Head alert | Invoice unpaid 14 days | Notify Admin Head | ON |
| Instalment reminder | Instalment due in 7 days | In-app reminder to Admin | ON |
| Missed instalment alert | Instalment missed | High priority task for Admin + Admin Head notification | ON |
| Absence — makeup suggestion | Absence within allowance | Generate makeup slot suggestion for Admin | ON |
| Allowance exhausted | Absences exceed allowance | Notify HOD + Admin; block auto-makeup | ON |
| No-show follow-up | No-show logged | Create follow-up task for teacher; escalate to Admin if no action in 24hrs | ON |
| Enrolment fee missing | First invoice — no enrolment fee | Flag to Admin before send | ON |
| Unbilled session alert | Session scheduled beyond invoice balance | High priority alert to teacher + HOD + Admin Head | ON |
| High Churn Flag | Churn score crosses 70 | Apply High Churn Flag; notify Admin Head + HOD | ON |
| Churn rapid increase | Churn score +20 points in one day | Immediate notify Admin Head + HOD | ON |
| Broadcast list auto-add | First invoice paid (new student) | Add guardian to department broadcast list | ON |
| Progress report triggered | Invoice issued | Create blank progress report for enrolled subjects | ON |
| Termly summary report | Term end date reached | Generate termly summary report per enrolled student | ON |
| Post-withdrawal survey | Student withdrawn | Create task to send satisfaction survey 48 hours after withdrawal | ON |
| Staff document expiry | Staff document expiring in configured days | Notify HR/Finance + Super Admin | ON |
| Off-boarding checklist | Off-boarding initiated | Generate checklist task for HR/Finance | ON |
| Go-live notification | Tenant go-live at Stage 10 | Notify all active staff in-app | ON |
| Re-enrolment reminder | No next-term schedule 3 weeks before term end | Create re-enrolment tasks (3 weeks, 1 week, 4 days before term start) | ON |
| Win-back outreach | Withdrawn student — 30 days before next term | Create win-back tasks (30 days and 1 week before term start) | ON |
| NPS low score follow-up | NPS score 6 or below | Create 48-hour follow-up task for Admin Head | ON |
| Makeup expiry alert | Makeup expiry approaching 14 days | Notify Admin for all department students with pending makeups | ON |
| Session balance shortfall | Student has unscheduled sessions 2 weeks before term end | Alert Admin (2 weeks, 1 week, 3 days before term end) | ON |
| Birthday message | Student birthday | Generate copy-paste message for Admin to send to guardian | OFF |
| NPS Google Review funnel | NPS score 9 or above | Trigger Google Review prompt in-app (if Super Admin toggle is ON) | OFF |

---

# 01.7 Role-Based Access Control

| **Role** | **Template Library** | **Automation Engine** |
|---|---|---|
| Super Admin | Create personal + approve org-wide + full management | Full — create, edit, activate, pause, delete, view history |
| Admin Head | Create personal + approve org-wide | Full — create, edit, activate, pause, delete, view history |
| Admin | Create personal + use published org-wide templates | View active automations only — cannot create or edit |
| Academic Head | Create personal + use published org-wide | No access |
| HOD | Create personal + use published org-wide | No access |
| Teacher | Create personal + use published org-wide | No access |
| TA | Create personal + use published org-wide | No access |
| HR/Finance (Custom) | Create personal + use published org-wide | No access |

---

# [[07_Operations-M13_Automation_Communications|[[07_Operations-M13_Automation_Communications|M13]].B]] — Automation & Template Engine Addendum

This section supplements [[07_Operations-M13_Automation_Communications|M13]] v1.5 with 12 automations confirmed in the internal automation review but omitted from the [[07_Operations-M13_Automation_Communications|M13]] trigger library tables, plus two variable corrections to existing trigger entries. The additions are integrated into the trigger library in Section 01.5 above. The key behavioural clarifications are documented below for developer reference.

## 13.B.1 Fixed Behaviour Automations

The following automations are fixed platform behaviours — they cannot be toggled off or reconfigured by any tenant.

| **ID** | **Behaviour** |
|---|---|
| 2C — Archived subject enrolment block | Archived subject is removed from all billable item selectors platform-wide immediately and permanently on archiving. No enrolment or billing against archived subjects is possible under any circumstance. |
| 3B — Cover session attendance marking | The teacher physically present and delivering the session is the designated attendance marker. The original teacher has no marking responsibility for sessions they did not deliver. |
| 4B — Negative invoice block | Maximum discount is 100% of the subtotal. An AED discount cannot exceed the invoice subtotal. System hard blocks the save. |
| 4D — Overpayment block | Payment logging hard blocks any amount greater than the invoice subtotal. Once any payment (part or full) is logged against an invoice, the subtotal is locked. |
| 5A — DNC scope for concern notifications | DNC suppresses marketing and subscription communications only. DNC does not suppress concern, safeguarding, or academic notifications. Concern-related messages to DNC-flagged guardians are still permitted and must still be sent. |
| 120 — High Risk + open L2/L3 combined flag | When a student is flagged as High Risk in [[08_Management-M10_Management_Dashboard|M10]] and simultaneously has an open L2 or L3 concern, the system escalates immediately to Admin Head regardless of whether prior alerts have been sent. This combination represents the highest-risk state a student can be in. |
| 160 — Cross-branch session attendance | Students can attend sessions at any branch freely. No transfer process is required. Attendance is logged against the session's branch. The student's primary branch assignment remains unchanged. |

## 13.B.2 Format Lock Automations

| **ID** | **Behaviour** |
|---|---|
| 11D — Student ID format lock | Student ID format is locked permanently at the moment the first student record is saved. Super Admin is notified. The format cannot be changed without a full data migration. |
| 11E — Invoice number prefix lock | Invoice number prefix is locked permanently at the moment the first invoice is issued. Super Admin is notified. The prefix cannot be changed without a full data migration. |

---

# 01.8 Marketing Tab

The Marketing tab is a planning and drafting workspace for all outbound marketing and communications activity. It gives Admin Head and Super Admin visibility over upcoming campaigns and a space to draft copy and notes — without requiring any live integration in v1. When Mailchimp and Instagram integrations are added in Phase 2, Marketing Moments become the trigger and briefing source for those outbound channels.

Marketing Moments created here are surfaced on the What's On page (M05) as a read-only display lane visible to all staff.

## 01.8.1 Marketing Moment Fields

| **Field** | **Detail** |
|---|---|
| Name | Short label for the moment (e.g. "Y10–Y13 Mock Results Newsletter"). Required. |
| Date | The planned send or event date. Required. Displayed on the What's On page. |
| Type | One of: Email Campaign / Social Post / Enrolment Window / Event Promo / Other. Required. |
| Draft notes | Plain text field for copy drafts, key messages, or briefing notes. Optional. Not displayed on What's On page — internal only. |
| Target audience | One of: All / Primary / Lower Secondary / Senior. Required. Displayed as a label on the What's On page. |
| Status | One of: Draft / Scheduled / Sent. Required. Default: Draft. |

## 01.8.2 Access and Permissions

| **Role** | **Permission** |
|---|---|
| Super Admin | Create, edit, archive Marketing Moments |
| Admin Head | Create, edit, archive Marketing Moments |
| All other staff | No access to the Marketing tab. View Marketing Moments on What's On page only. |

## 01.8.3 Lifecycle and Visibility

| **Rule** | **Detail** |
|---|---|
| Auto-hide | A Marketing Moment auto-hides from the What's On page 48 hours after its date has passed. The record remains in the Marketing tab with its status intact. |
| Manual hide | Admin Head or Super Admin can archive a Marketing Moment at any time. Archived moments no longer appear on the What's On page. |
| Reappearance | Once hidden (auto or manual), a Marketing Moment does not reappear on the What's On page. The record remains accessible in the Marketing tab archive. |
| Phase 2 | When Mailchimp and Instagram integrations are active, Marketing Moments will serve as the briefing and trigger source for outbound sends. Draft notes and target audience fields feed directly into the integration workflow. |
