---
module: "REF-04"
title: "Automation Rules Reference"
layer: "Reference"
folder: "02_Reference"
status: "Draft"
phase: "v1"
dependencies: [M13, REF-01]
tags: [enrolla, prd, reference, automation]
---

# ENROLLA
# [[02_Reference-REF04_Automation_Rules|REF-04]] — Automation Rules Reference
v1.1 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

This document catalogues all internal automation rules built into the Enrolla platform. Each rule defines a trigger condition, the system action that fires, configurable variables where applicable, and the operational rationale. Automation rules are configured and managed in [[07_Operations-M13_Automation_Communications|M13]] (Automation & Communications) and [[09_Settings-M20_Tenant_Settings|M20]] (Tenant Settings). All rules listed here are tenant-configurable unless marked as fixed behaviour.

| **Property** | **Value** |
|---|---|
| Module code | [[02_Reference-REF04_Automation_Rules|REF-04]] |
| Version | v1.0 |
| Status | Draft |
| Dependencies | [[01_Foundation-PL01_Platform_Architecture|PL-01]], [[01_Foundation-PL02_RBAC|PL-02]], [[07_Operations-M13_Automation_Communications|M13]], [[09_Settings-M20_Tenant_Settings|M20]] |
| Phase | v1 |

---

## Reading Guide

| **Term** | **Meaning** |
|---|---|
| Fixed behaviour | The rule cannot be toggled off or reconfigured. It fires automatically and unconditionally. |
| Configurable | The rule has one or more variables adjustable in [[09_Settings-M20_Tenant_Settings|M20]] or [[07_Operations-M13_Automation_Communications|M13]]. |
| Hard block | The platform refuses to proceed. No override available without resolving the underlying condition. |
| Warning prompt | The platform displays a warning and asks for confirmation. The action can still proceed. |
| Flag | An in-platform indicator or notification with no blocking effect. |

---

# 1. Lead Management

| **ID** | **Trigger** | **Action** | **Configurable Variables** |
|---|---|---|---|
| 1 | Lead created in any department | Immediately assign to a pre-configured staff member per department assignment rule. Lead enters pipeline at first active stage. | Assignment method per department (round-robin / department match / manual); fallback assignee; lead entry stage (default: first active stage) |
| 1A | Lead assigned to staff member who is on leave | Re-route to handover designee first. Fall back to department HOD if no handover. Notify original assignee on return from leave. If the designated approver is on Emergency Leave when a request arrives, the request is automatically re-routed to the Vacant Role Fallback configured in [[09_Settings-M20_Tenant_Settings|M20]] §01.14. | Handover designee (set in leave document); fallback: HOD; fallback-fallback: Admin Head; emergency leave fallback: Vacant Role Fallback per [[09_Settings-M20_Tenant_Settings|M20]] §01.14 |
| 1B | Lead source is Referral but referring guardian is not linked | Allow blank or set source to Other. No block. No referral reward triggered until a guardian is explicitly linked. If a referring guardian is later identified and linked, the reward process begins from that point. If the lead reaches Won status and converts to a student without a referring guardian ever being linked, the referral reward opportunity closes permanently. Admin can issue a manual goodwill credit to any guardian with a logged reason if a referral is subsequently identified. | Referral source options: linked guardian / blank / Other |
| 1C | Lead has assessment booked but assigned assessor is no longer active | Reassign assessment task to Admin Head automatically with a note explaining the reason. | Reassignment recipient (default: Admin Head) |
| 2 | Lead inactive for X hours or days with no follow-up activity logged | Create a follow-up task for assigned Admin. Escalate task priority to High if still no action after a second threshold. | Inactivity threshold for initial task (default: 1 day); escalation to High priority (default: 3 days); task assignee (default: lead owner) |
| 3 | Lead stuck in same pipeline stage for X days with no activity logged | Escalation notification to Admin Head and the assigned staff member. Both notified that the lead is stalled. Activity that resets the inactivity clock: any of the following actions logged on the lead record — outbound contact logged by Admin, guardian responds to any communication, assessment booked, trial booked. Passive events (e.g. viewing the lead record) do not count as activity. | Days per stage threshold (default: 10); stages to monitor (all or specific); notification recipients (Admin Head + assignee) |
| 4 | Lead converted to student (status = Won) | Archive lead record and link lead history to new student profile. If any error occurs, notify Super Admin in-app and by email. | Error notification recipients (default: Super Admin in-app + email) |
| 5 | Trial class completed with no follow-up logged after X days | Create a follow-up task for Admin. Default threshold: 1 day (24 hours). | Days threshold (default: 1 day); task priority (default: High) |

---

# 2. Enrolment & Lifecycle

| **ID** | **Trigger** | **Action** | **Configurable Variables** |
|---|---|---|---|
| 2A | Student re-enrols after prior withdrawal | Reset DNC and unsubscribe to default settings (do not restore prior preferences). Cross-check all profile and academic details. Notify Admin Head. An in-platform notice is generated for Admin confirming that communication preferences have been reset: "DNC flag was active on this guardian and has been automatically cleared." This is logged in the audit trail. | Verification task due date (default: 48 hours); notification recipient (default: Admin Head) |
| 2B | Student transitions to Graduated or Alumni status | Archive active sessions. Retain all financial and academic records. Notify Admin Head and assigned teachers. | Fixed behaviour |
| 2C | Attempt to enrol a student in an archived subject | Hard block. Archived subject is removed from all billable item selectors platform-wide. No enrolment possible. | Fixed behaviour |
| 7 | Student enrolled in a subject but no invoice exists covering that subject (Part A) — or student attends a session with zero or negative credit balance for a subject (Part B) | Part A: Real-time warning prompt to enrolling user — 'No invoice covers this subject. Create an invoice before enrolling?' with Yes/No. Part B: Immediate High priority alert to Admin team — unbilled session risk. | Prompt wording (configurable in [[09_Settings-M20_Tenant_Settings|M20]]); alert recipients (default: Admin for that department + Admin Head) |
| 8 | Student enrolled but mandatory profile fields are still blank after X hours | In-app blocking prompt at enrolment moment. High priority task created if still incomplete after 24 hours. | Mandatory field list (configured in [[09_Settings-M20_Tenant_Settings|M20]]); task due date (default: 24 hours); task priority (default: High) |
| 9 | Student's first invoice for a term marked as Paid | Add guardian to the department WhatsApp broadcast list. | Department-to-list mapping (configured in [[09_Settings-M20_Tenant_Settings|M20]]); trigger: first paid invoice per student lifetime |
| 10 | Student withdrawn | Create win-back re-engagement tasks at 2 weeks and 1 week before the start of the next main term. | Re-engagement timing: 2 weeks and 1 week before next term start; task assignee (default: Admin Head) |
| 12 | Term completed for an enrolled student | Generate a termly summary report from accumulated session feedback. Admin reviews and sends to parent. | Report template (configurable in [[09_Settings-M20_Tenant_Settings|M20]]); trigger: term end date per academic calendar; delivery method (Admin-sent via WhatsApp or email) |
| 13 | Student approaching graduation date | Flag to Admin Head 30 days before configured graduation date for review and transition planning. | Days before graduation (default: 30); notification recipient (default: Admin Head) |

---

# 3. Attendance

| **ID** | **Trigger** | **Action** | **Configurable Variables** |
|---|---|---|---|
| 3A | Teacher marks attendance more than 48 hours after the session date | Flag late marking to HOD. Teacher prompted to log a reason. | Late marking threshold (default: 48 hours); escalation recipient (default: HOD) |
| 3B | Cover session delivered — attendance must be marked by the teacher physically present | Cover teacher is the designated marker for that session. System assigns attendance responsibility to the cover teacher, not the original. Revenue for the session is attributed to the cover teacher (whoever delivers the session gets the revenue credit). The original teacher receives no revenue credit for sessions they did not deliver. | Fixed behaviour |
| 3C | Student absent for 3 consecutive scheduled sessions of the same subject | Trigger immediate combined notification to HOD alongside the standard absence alert. Uses scheduled active days only — not calendar days. | Consecutive absence threshold (default: 3 scheduled days for that subject); subject-specific trigger |
| 14 | Absence recorded within the student's remaining makeup allowance | Generate a list of suggested makeup slots for Admin review. Admin approves a slot and optionally shares it with the parent. | Suggestion logic (next available with same teacher preferred; then any available slot); Admin approval required before makeup is booked |
| 15 | Absences exceed the student's departmental makeup allowance | Notify HOD and Admin. Block automatic makeup generation. Require HOD approval before any further makeup is created. | Allowance thresholds (defined per subject in the subject configurator) |
| 16 | Student absence count reaches allowance minus 1 for a subject | In-app alert to HOD and Admin. Admin can optionally forward this alert to the parent. | Alert recipients (default: HOD + Admin); parent forwarding (optional — Admin decision) |
| 17 | No-show logged — student absent with no prior parent notification | Create a follow-up task for assigned teacher or Admin. Confirm reason and makeup eligibility only if makeups are still available. | Task assignee (default: assigned teacher; escalate to Admin if no action in 24 hours) |
| 18 | 3 or more absences in rolling 45-day window for a student | Trigger churn risk signal update in [[08_Management-M10_Management_Dashboard|M10]] (+15 points for Missed Sessions signal). | Absence threshold (default: 3); rolling window in days (default: 45) — both configurable in [[09_Settings-M20_Tenant_Settings|M20]] |
| 19 | Student has unused makeup sessions within 14 days of makeup expiry | Notify Admin for all students in their department with pending unused makeups. Reminder fires at 14 days and again at 7 days. | Alert windows (default: 14 days and 7 days before expiry); notification recipient: Admin for their department |

---

# 4. Finance

| **ID** | **Trigger** | **Action** | **Configurable Variables** |
|---|---|---|---|
| 4A | Invoice issued to a student with Withdrawn status | Warning prompt to Admin before send. Alert to Admin Head. Not a block. | Fixed behaviour — warning only |
| 4B | Discount applied causes invoice total to go below zero | Hard block. Maximum discount is 100%. AED discount cannot exceed the subtotal. | Fixed behaviour |
| 4C | Student invoiced twice for same subject in same term | Warning prompt to Admin framed as possible duplicate or potential additional sessions. Not a block. Admin can proceed. | Fixed behaviour — warning only |
| 4D | Payment recorded amount exceeds the invoice subtotal | Hard block. Subtotal is locked once any payment is logged — no retroactive invoice manipulation. | Fixed behaviour |
| 4E | Admin attempts to create a new invoice while overdue invoices already exist | Two-tier: one overdue invoice = warning prompt (can proceed). Two or more overdue invoices = hard block with links to both overdue invoices. | Overdue invoice count thresholds (default: 1 = warning, 2 = block) |
| 20 | Invoice issued but not paid after X days | In v1, payment reminders are not sent directly to guardians via WhatsApp or email (BSP not connected). Instead, the automation creates a task assigned to the responsible Admin: 'Payment follow-up — [Guardian Name] — Invoice #[ref] — [amount] overdue'. Task includes copy-paste ready message. Task priority: Medium. | Days after issue (default: 7); task priority (default: Medium); task assignee (default: Admin). Guardian-facing automated payment reminders are a Phase 2 feature. |
| 21 | Invoice overdue beyond secondary threshold | Escalation notification to Admin Head. Task priority escalates to High. | Secondary overdue threshold in days (default: 7 after initial follow-up); notification recipient (default: Admin Head). Guardian-facing automated reminders are Phase 2 only. |
| 22 | Invoice part-paid | Update invoice status to Part. Notify Admin of remaining balance with due date and prompt to confirm or add future instalment dates. | Notification content (remaining balance, due date); instalment date prompt (optional for Admin to update) |
| 23 | Credit issued on student account | Log credit on student account. Notify Admin Head. | Fixed behaviour |
| 24 | Payment plan instalment due date approaching | In v1, reminder is delivered as a task assigned to Admin: 'Payment follow-up — [Guardian Name] — Invoice #[ref] — [amount] due on [date]'. Guardian-facing automated instalment reminders are Phase 2. | Reminder days (default: 7 days; additional: 3 days, 1 day — each togglable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| 25 | Payment plan instalment missed | Create High priority task for Admin. Notify Admin Head. Prompt Admin to preauthorise future instalments. | Task priority (default: High); notification recipient (default: Admin Head) |
| 26 | Zero-value invoice created | Auto-mark as Paid immediately. No approval required. Log with system note. Admin Head nudge notification sent. | Fixed behaviour |
| 74 | Invoice generated while student has scheduled sessions not yet invoiced | Invoice builder auto-suggests scheduled sessions for that student as a line item with session dates in short format. | Session date display format in notes (default: short e.g. 3 Sep, 10 Sep); max dates shown inline before +N more |
| 75 | Student credit balance approaching expiry | Multiple configurable reminders to Admin at 30, 14, 7, and 1 day before expiry. If credit balance is zero, no notifications fire. | Reminder schedule (default: 30d, 14d, 7d, 1d — each on/off independently in [[09_Settings-M20_Tenant_Settings|M20]]); notification recipient: Admin |
| 76 | First term invoice generated after a lead converts to a student | Auto-include enrolment fee as a line item. The AED 300 enrolment fee is triggered by the first term invoice generated after a lead converts to a student. Trial invoices never trigger the enrolment fee. One trial is permitted per subject per student. Admin can set the amount to AED 0 or apply a discount but cannot delete the line item from the student's record. Admin Head notified if waived. | Enrolment fee amount (default: AED 300 at IMI). Before adding the fee, system checks the student record flag — if already Paid or Waived, fee line item is not added. |
| 77 | Invoice marked as Cancelled | Notify Admin Head with logged cancellation reason. | Fixed behaviour |
| 79 | Revenue tag on invoice does not match student year group department | Flag to Admin before invoice is issued. Warning only — not a block. | Fixed behaviour — flag only |
| 185 | Invoice edited after being marked as Paid | Hard lock all financial fields (amount, rates, session counts, VAT, discount, student name, invoice date, revenue tag). Only non-financial fields remain editable (notes, payment references, attachments). Credit note or supplementary invoice required for amount changes. | Fixed behaviour |

---

# 4A-Ext. Outstanding Balance

| **ID** | **Trigger** | **Action** | **Notes/Conditions** |
|---|---|---|---|
| R-BAL-01 | Student has an outstanding overdue invoice balance at re-enrolment time | Auto-task created and assigned to Admin: 'Outstanding balance — [Student Name] — resolve before re-enrolment proceeds'. Admin Head receives in-app notification. Admin Head must click-acknowledge the outstanding balance to unblock the re-enrolment. | This is not an approval gateway — it is a click-acknowledge action. Acknowledgement logged in audit trail. If still outstanding 7 days into the new term, task escalates to Admin Head automatically. |

---

# 4B. Referral Programme

| **ID** | **Trigger** | **Action** | **Notes/Conditions** |
|---|---|---|---|
| R-[[02_Reference-REF01_Notification_Catalogue|REF-01]] | Referred student completes qualifying period (3 months of active enrolment) | Referral milestone confirmed; credit balance added to referring guardian's account; notification sent to Admin (in-app) and referring guardian (WhatsApp/email simultaneously). | Credit value configured in [[09_Settings-M20_Tenant_Settings|M20]] Referral Programme Reward Builder |
| R-[[02_Reference-REF02_Data_Model|REF-02]] | Referral credit has been on a guardian account for 11 months without redemption | Warning notification sent to guardian: 'Your referral credit expires in 30 days' | Configurable: expiry warning timing in [[09_Settings-M20_Tenant_Settings|M20]] |
| R-[[02_Reference-REF03_Glossary|REF-03]] | Referral credit reaches 12-month expiry without redemption | Credit balance marked as Expired; guardian notified. | Expired credits cannot be reinstated. Expiry period configurable in [[09_Settings-M20_Tenant_Settings|M20]]. |
| R-[[02_Reference-REF04_Automation_Rules|REF-04]] | Guardian selects 'Apply referral credit' at invoice generation time | Credit balance reduced by applied amount; invoice adjusted. | Guardian chooses how much credit to apply. In v1, guardian communicates choice to Admin who applies manually. |

---

# 5. Concerns & Complaints

| **ID** | **Trigger** | **Action** | **Configurable Variables** |
|---|---|---|---|
| 5A | Concern raised for a student whose guardian has a DNC flag | Flag to Admin Head that standard marketing comms are suppressed but concern notifications are still permitted. DNC applies to marketing and subscription comms only — not concern, safety, or academic notifications. | Fixed behaviour — flag only |
| 5B | Complaint logger and assigned resolver are the same person | Flag dual role conflict. Require a different approver to be assigned. | Fixed behaviour |
| 27 | Concern raised at L1 | Notify assigned teacher and HOD in-app. | Notification recipients (default: assigned teacher + HOD) |
| 28 | Concern at L2 with no action logged after SLA days | Auto-escalate to L3. System states the escalation reason automatically in the notification to Admin Head. | L2 SLA in days (default: 5 — configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| 29 | Concern open beyond SLA with no parent contact logged | Create follow-up task for HOD. | Contact SLA in days (default: 7) |
| 30 | Concern dismissal attempted without required dual sign-off | Hard block dismissal. Show validation error listing which approvals are missing. | Fixed behaviour |
| 31 | Complaint ticket raised | Notify HOD and Admin Head. Create resolution task assigned to Admin with default SLA. | Task SLA (default: 7 days); task assignee (default: Admin) |
| 32 | 3 or more complaint tickets for the same student in one term | Auto-create a meeting task for Admin Head in [[07_Operations-M16_Task_Management|M16]]. | Ticket threshold (default: 3 in one term) |
| 33 | Complaint ticket unresolved after X days | Escalation notification to Super Admin. | Escalation threshold in days (default: 14) |

---

# 6. Scheduling & Timetable

| **ID** | **Trigger** | **Action** | **Notes/Conditions** |
|---|---|---|---|
| 6A | New session scheduled in a room that already has a booking at the same date and time | Hard block. First-booking-wins. Session cannot be saved until the conflict is resolved. Admin prompted to change room or time. | Fixed behaviour |
| 6B | Teacher absence or emergency leave logged when that teacher has sessions scheduled | Cover request auto-dispatched to eligible teachers in that department. HOD and Admin notified. | Fixed behaviour |
| 6C | Emergency leave activated for a gateway-role holder | All pending approval requests in their queue are immediately re-routed to the fallback chain. Fallback follows the Vacant Role Fallback configured in [[09_Settings-M20_Tenant_Settings|M20]] §01.14. Super Admin is the terminal fallback. | Fixed behaviour |
| 6D | Recurrence series approaching its configured end date | Warning notification to Admin 7 days before series ends: "Recurrence series for [course/teacher] ends on [date]. Renew or extend?" | Configurable: lead-time warning in days (default: 7) |
| 6E | Calendar template applied with internal conflicts (two template sessions competing for same room or teacher simultaneously) | All conflicts shown in preview step. Admin resolves each conflict before template is applied. No sessions created until all conflicts resolved or explicitly overridden. | Fixed behaviour |
| 6F | Teacher assigned a session while a critical document is expired (if block toggle is enabled in [[09_Settings-M20_Tenant_Settings|M20]]) | Hard block on new class assignment. HOD and Admin Head notified. | Toggle: [[09_Settings-M20_Tenant_Settings|M20]] > Staff Documents > Block assignments on critical document expiry |

---

# 7. Progress & Academic

| **ID** | **Trigger** | **Action** | **Configurable Variables** |
|---|---|---|---|
| 7A | Teacher saves topic links for a session but does not update tracker remarks within the configured window | In-app reminder to teacher at the 24-hour mark. Flag raised on teacher's [[08_Management-M10_Management_Dashboard|M10]] dashboard and in-app notification to HOD if window closes without update. Flag auto-resolves when teacher saves a remark. HOD notified of resolution. | Remark window (default: 48 hours from topic link save time — configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| 7B | Student accumulates the configured number of consecutive Requires Support tiers on the same topic | Auto-creates a Level 1 concern in [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] with trigger type "Progress tracker below pass threshold." HOD notified immediately. Intervention logged on the tracker with timestamp, score history, and concern record reference. | Consecutive threshold (default: 3 — configurable per tenant and per qualification level in [[09_Settings-M20_Tenant_Settings|M20]]) |
| 7C | Student triggers the intervention threshold on 3 or more topics simultaneously within the same review period | ONE consolidated concern flag raised listing all triggering topics, instead of individual per-topic flags. | Consolidation threshold (default: 3 topics — configurable in [[09_Settings-M20_Tenant_Settings|M20]] §01.5) |
| 7D | Report cadence timer fires for an active student-subject enrolment | Report auto-generated and queued for teacher or HOD review. No sessions scheduled in the reporting period: report skipped automatically. Student has 100% absence in the cycle: behaviour determined by dept-level config in [[09_Settings-M20_Tenant_Settings|M20]] (always generate / skip if all absent / prompt HOD per case). | Report cadence (default: every 3 weeks — configurable per department in [[09_Settings-M20_Tenant_Settings|M20]]) |

---

# 8. Staff & HR

| **ID** | **Trigger** | **Action** | **Configurable Variables** |
|---|---|---|---|
| 8A | Teacher reaches 90% or more of contracted hours for 3 consecutive weeks | In-app amber workload alert to HOD. | Threshold (default: 90% for 3 consecutive weeks — configurable in [[09_Settings-M20_Tenant_Settings|M20]] Staff & HR settings) |
| 8B | Teacher at or above 100% of contracted hours for 2 or more consecutive weeks, OR exceeds 110% in any single week | In-app red workload alert to Admin Head. | Thresholds (default: 100% for 2 consecutive weeks or 110% in any single week — configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| 8C | Staff document approaching its configured expiry date | In-app alert to Admin Head and the staff member. | Expiry lead time (default: 30 days — configurable per document type in [[09_Settings-M20_Tenant_Settings|M20]]) |
| 8D | Staff document passes its expiry date with no renewal uploaded | In-app alert to Admin Head. Document status changes to Expired. | Fixed behaviour |
| 8E | Staff member assigned to a new session while a critical document is expired AND the block toggle is enabled in [[09_Settings-M20_Tenant_Settings|M20]] | Hard block on the assignment. In-app alert to HOD and Admin Head. Assignment cannot proceed until document is renewed or toggle is disabled. | Toggle: [[09_Settings-M20_Tenant_Settings|M20]] > Staff Documents > Block assignments on critical document expiry |
| 8F | Staff member's CPD hours reach 50% of their annual target | In-app milestone notification to HR/Finance. | Fixed behaviour. Annual target configurable per role in [[09_Settings-M20_Tenant_Settings|M20]] (default: 20 hours). |
| 8G | Staff member's CPD hours reach 100% of their annual target | In-app milestone notification to HR/Finance. | Fixed behaviour |
| 8H | Annual performance review date reached for a staff member | In-app notification to the staff member's line manager and HR/Finance: "Performance review due for [Staff name]." Auto-creates a review task in [[07_Operations-M16_Task_Management|M16]] assigned to the line manager. | Review cadence (default: annual — configurable per role in [[09_Settings-M20_Tenant_Settings|M20]]) |

---

# 9. Churn & Retention

## 9A — Churn Score Signal Updates

The churn score (0–100) recalculates in real time whenever a contributing signal changes. Each signal update below triggers an immediate score recalculation for the affected student.

| **ID** | **Signal** | **Trigger Condition** | **Score Impact** | **Notes** |
|---|---|---|---|---|
| 9A-1 | Teaching Quality Concern | Active [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern with Teaching Quality category opened or closed | Recalculate — 28% weight signal active/inactive | Fixed behaviour |
| 9A-2 | Missed 3+ sessions (45-day window) | Student accumulates 3 or more absences in any rolling 45-day window | Recalculate — 17% weight signal active | See also Rule 18 in Section 3 (Attendance) |
| 9A-3 | Overdue invoice | Invoice status changes to Overdue beyond the configured threshold | Recalculate — 17% weight signal active/inactive | Threshold configurable in [[09_Settings-M20_Tenant_Settings|M20]] Churn & Dashboard settings |
| 9A-4 | Inconsistency | Irregular attendance pattern detected — no consistent weekly cadence | Recalculate — 11% weight signal active/inactive | Pattern evaluated on attendance history for the current term |
| 9A-5 | Unresolved concern | Any [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern opened or closed regardless of category | Recalculate — 11% weight signal active/inactive | Fixed behaviour |
| 9A-6 | NPS score | Guardian submits a satisfaction survey response in [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].B]] | Recalculate — 11% weight signal active/inactive | Uses most recent survey score only |
| 9A-7 | Unsubscribed | Guardian unsubscribe status changes | Recalculate — 5% weight signal active/inactive | Fixed behaviour |
| 9A-8 | App inactive 14+ days | **DISABLED IN V1** — no parent portal. Signal weight (10%) redistributed proportionally across the 7 active signals. Reactivates automatically when the parent portal feature toggle is enabled in [[09_Settings-M20_Tenant_Settings|M20]]. | 0% in v1 | Phase 2 |

**v1 redistributed weights (App inactive disabled):** Teaching Quality Concern 28%, Missed sessions 17%, Overdue invoice 17%, Inconsistency 11%, Unresolved concern 11%, NPS score 11%, Unsubscribed 5%. Total: 100%.

**Phase 2 weights (App inactive reactivated):** Teaching Quality Concern 25%, Missed sessions 15%, Overdue invoice 15%, Inconsistency 10%, Unresolved concern 10%, NPS 10%, App inactive 10%, Unsubscribed 5%. Total: 100%.

| **ID** | **Trigger** | **Action** | **Configurable Variables** |
|---|---|---|---|
| 9B | Student's churn score crosses the High Risk threshold (default: 70) | Churn threshold alert fires. Student appears in Churn List with red indicator. Admin Head receives daily digest inclusion. No further threshold alert fires for this student during the cooldown period. | High risk threshold (default: 70 — configurable in [[09_Settings-M20_Tenant_Settings|M20]]). Cooldown period (default: 7 days, range 1–30 days — configurable in [[09_Settings-M20_Tenant_Settings|M20]]). |
| 9C | 24 hours have elapsed since the last daily churn risk digest | Daily digest sent to Admin Head: all students whose churn score entered the High Risk band in the last 24 hours. No digest sent if no students entered High Risk in that period. | Fixed behaviour. Digest timing configurable in [[09_Settings-M20_Tenant_Settings|M20]] (default: daily). |
| 9D | Any churn score signal changes for any student | Retention confidence score recalculates immediately alongside the churn score. Retention signals evaluated: re-enrolment confirmed (30%), positive review (25%), credit on account (20%), no missed sessions (10%), email opened (5%). App active signal (10%) disabled in v1 — weight redistributed proportionally across remaining signals. | Fixed behaviour — recalculates on every signal change. |

> **Cross-reference:** Rule 18 (Section 3 — Attendance) covers the specific absence threshold that triggers the Missed Sessions churn signal update. Rule 18 is not duplicated here.

---

# 9B. Automation Failure Handling

| **ID** | **Trigger** | **Action** | **Notes/Conditions** |
|---|---|---|---|
| R-FAIL-01 | Any automation rule fails to execute | Super Admin receives in-app + email notification: rule name, trigger record, failure reason, timestamp. The failed rule is logged in the automation audit trail with status Failed. The system does not retry automatically — Super Admin must re-trigger manually if needed. | Fixed behaviour |

---

# 10. Automation Configuration Summary

All configurable automation rules are managed in [[07_Operations-M13_Automation_Communications|M13]] (Automation & Communications) under the Internal Automations section. Super Admin and Admin Head can toggle rules on or off, adjust thresholds, and configure recipients.

| **Property** | **Value** |
|---|---|
| Configuration location | [[07_Operations-M13_Automation_Communications|M13]] Internal Automations + [[09_Settings-M20_Tenant_Settings|M20]] Tenant Settings (threshold values) |
| Who can configure | Super Admin, Admin Head |
| Fixed behaviour rules | Cannot be toggled or reconfigured. Fire unconditionally. |
| Configurable rules | Thresholds, recipients, and timing adjustable in [[09_Settings-M20_Tenant_Settings|M20]] |
| Automation failure notification | Super Admin receives an in-app and email notification with the rule name, failure reason, and affected record when any automation rule fails to execute |
| Audit | Every automation rule execution is logged in the audit trail with: rule ID, trigger event, affected record, action taken, timestamp, outcome (executed / failed) |
