# ENROLLA
# REF-01 — Notification Catalogue
v1.1 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

This document catalogues every system-generated notification in Enrolla. Each notification has a defined trigger, recipient set, and default delivery channel. All notifications are configurable per tenant in M20 Notification Toggles — the template, channel, and on/off state can be adjusted by Super Admin and Org Owner.

| **Property** | **Value** |
|---|---|
| Module code | REF-01 |
| Version | v1.0 |
| Status | Draft |
| Dependencies | PL-01, PL-02, M20 |
| Phase | v1 |

---

> **v1 Delivery Behaviour — WhatsApp and Email Notifications to Parents**
> In v1, WhatsApp BSP and email integrations are not active. All notifications to parents that would normally send via WhatsApp or Email are instead delivered as copy-paste-ready messages generated in-platform. The system resolves all merge fields and presents the full message text to the designated Admin for manual dispatch. In-app notifications to staff are unaffected — these send automatically regardless of integration status. Finance notifications (payment received, instalment reminder, overdue) follow the same rule and are additionally specified in their individual entries below.

---

# 1. In-App Notification System

Enrolla includes a standard SaaS notification inbox accessible to all authenticated staff users. This section defines the infrastructure governing all in-app (App channel) notifications across the platform.

| **Element** | **Specification** |
|---|---|
| Notification bell | A notification bell icon in the global navigation bar. An unread count badge appears when unread notifications are present. The badge clears when the inbox is opened. |
| Notification inbox | Clicking the bell opens the notification inbox. Notifications are listed in reverse-chronological order and support pagination for large volumes. |
| Read/unread status | Each notification carries an individual read/unread status. A notification is marked as read when the user opens it or clicks it. |
| Mark all read | A "Mark all as read" action is available at the top of the inbox. Marks every notification in the inbox as read in one action. |
| Notification retention | Notifications are retained for 90 days from the date they were generated, then automatically archived. Archived notifications are not deleted — they are moved to an archive view accessible from the inbox. |
| Per-user preferences | Users can configure their notification preferences for non-critical notifications. Critical system notifications (security alerts, gateway approvals, mandatory compliance events) cannot be toggled off. Per-user preferences are set within the user's account settings and are independent of the tenant-level notification toggles in M20. |

---

# 2. Channel Key

The following channels are used across all notifications in this catalogue.

| **Channel** | **Description** |
|---|---|
| WA | WhatsApp via BSP (Business Service Provider). Primary outbound channel for parent-facing messages. Uses approved templates where required by Meta. |
| Email | Email. Used for formal documents (invoices, progress reports) and as a fallback when WhatsApp is unavailable. |
| App | In-app notification. Delivered within the platform to staff. Used for internal alerts, task flags, and operational nudges. |
| WA + Email | Both WhatsApp and Email sent simultaneously. Used for high-importance parent-facing events. |
| WA + App | WhatsApp to parent, in-app notification to relevant staff member. |
| All | WhatsApp + Email + In-app. Used for critical events requiring multi-channel delivery. |
| Per config | Channel is set by the staff member who built the automation rule. Applies to automation-engine notifications only. |

---

# 3. Platform-Wide Delivery Rules

These rules apply to every notification in this catalogue without exception.

| **Rule** | **Detail** |
|---|---|
| DNC suppression | A Do Not Contact flag on a guardian profile suppresses all WA and Email notifications to that guardian. In-app notifications to staff are unaffected. The following notification categories always send regardless of DNC or unsubscribe status: (1) Invoice issued and payment receipt (financial communications), (2) Safeguarding and welfare alerts, (3) M06.A concern escalation notifications. DNC is an operational preference flag, not a legal suppression directive. |
| Unsubscribe suppression | Unsubscribe flag suppresses marketing and non-transactional communications only. Transactional messages (invoices, session reminders, attendance alerts) still send. |
| WhatsApp delivery failure | WhatsApp delivery failures trigger one automatic retry via BSP. If still rejected, the notification is flagged to Admin as a delivery failure and the system attempts delivery via Email. |
| Default state | All notifications are off by default until configured during onboarding (Stage 7) or in M20 post-go-live, except where marked system-mandatory. |
| Mandatory notifications | **Mandatory notifications** cannot be toggled off by Super Admin in M20. These are: DPA signature confirmation, Go-Live confirmation, Super Admin security alerts (new device login, password reset), billing failure alerts. All other notifications are configurable. |
| Frequency | No daily cap applied. Every notification sends immediately on trigger. |
| Delivery logging | All notifications are logged as Notification Records. Delivery status (Sent / Delivered / Read / Failed) is tracked per notification where the channel supports read receipts (WhatsApp). |

---

> **v1 Delivery Note — All WA Notifications:** WhatsApp Business API (BSP) integration is Phase 2. In v1, all notifications listed with channel WA are delivered via the copy-paste task mechanism in M13. When a WA notification fires, the system generates a fully resolved, copy-paste-ready message and creates a task for the responsible Admin to send it manually. Direct BSP delivery to the guardian's WhatsApp is Phase 2 only. This note applies to every WA entry in this catalogue unless explicitly marked Phase 2 only.

# 4. Notification Catalogue

## 3.1 M01 — Lead Management

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Lead created | New lead captured via any source channel (website form, WhatsApp, phone, walk-in, Instagram DM, referral, event) | Assigned Admin | App |
| Auto-response sent | Lead created via website form, WhatsApp inbound, or Instagram DM | Parent / Lead | WA or Email |
| Lead re-routed (fallback) | Primary assignee does not action the lead within the configured fallback window | Fallback assignee, original assignee | App |
| DNC flag set | Admin marks a lead or guardian as Do Not Contact | All assigned staff on the lead | App |
| Lead auto-archived | Lead has been inactive for the tenant-configured auto-archive period | Lead owner (Admin) | App |
| Sibling group detected | New lead shares guardian phone or email with an existing student or lead | Assigned Admin | App |
| Referral milestone reached | A referred student completes their qualifying period and the referring guardian's reward is confirmed | Referring guardian | In-app + Email (Configurable — default On) |
| Referral credit applied | Credit automatically applied to referrer's next invoice on referral conversion | Parent (referrer) | WA + App |
| Referral credit expiry warning | A guardian's referral credit is approaching its 1-year expiry with no redemption | Guardian | In-app + Email (Configurable — default On) |
| Referral credit expired | A guardian's referral credit has expired unredeemed | Guardian | In-app + Email (Configurable — default On) |
| Stage message prompt | Lead moves to a new pipeline stage that has a stage message template configured. Time-sensitive stages (Assessment Booked, Trial Booked) send a reminder if no message is sent within 2 hours. | Admin (prompt only — not sent to parent) | App |
| Assessment booking link sent | Admin sends self-service assessment booking link to parent | Parent | WA or Email |
| Assessment booking reminder | Booking link not used within configured period (default: 48 hours, then 5 days) | Parent | WA |
| Assessment not booked (admin alert) | All booking reminders exhausted with no booking made | Admin | App |

## 3.2 M03 — Assessment & Placement

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Assessment booked | Assessment appointment scheduled by Admin or via self-service link | Parent, Teacher (assessor) | WA + Email |
| Assessment reminder | 24 hours before the scheduled assessment | Parent | WA |
| Assessment complete | Teacher submits assessment outcome in the system | Admin | App |

## 3.3 M04 — Enrolment & Lifecycle

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Trial class booked | Trial session scheduled for a lead or student | Parent, Teacher | WA + Email |
| Trial class reminder | 24 hours before the scheduled trial session | Parent | WA |
| Trial class review ready | Teacher submits trial class outcome form for Admin review | Admin | App |
| Trial credit applied | Lead converts to enrolled student — premium trial difference credited to account | Admin, Parent | App + WA |
| Smart invoice prompt | Student's subjects and schedule are confirmed — system prompts Admin to generate invoice | Admin | App |
| Revenue opportunity prompt | System detects unconfirmed subjects from the parent's original enquiry at re-enrolment | Admin | App |
| Slot hold expiring | Slot hold nearing expiry with no invoice payment confirmed | Admin, Parent | App + WA |
| Slot released | Payment not received by the slot hold due date — slot released back to availability | Admin, Parent | App + WA |
| Enrolment confirmed | First payment received — student record activated | Parent | WA + Email |
| Subject trend nudge | Re-enrolment flow — subject-level churn signals detected for this student | Admin | App |
| Withdrawal requested | Parent or Admin initiates a partial or full withdrawal | Admin, Admin Head | App |
| Discount recalculated | Partial withdrawal reduces enrolled subject count and triggers a pricing tier change | Admin | App |
| Holiday programme invitation | Marketing window opens for an upcoming holiday programme event | Parent | WA + Email |
| Year group progression | Annual graduation date fires — all active students advance one year group. Department auto-reassignment triggered. | Admin | App |
| Re-enrolment reminder | Configurable period before next term opens — Admin prompted to begin re-enrolment outreach | Admin | App |
| Enrolment validity extended | Admin uses the Extend Validity action on a student's enrolment | Admin Head | In-app (Configurable — default On) |

## 3.4 M05 — Timetabling & Scheduling

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Session reminder | Configurable time before each session (default: 1 hour before and 1 day before) | Parent, Student | WA |
| Session cancelled | Admin cancels a session or session series | All enrolled parents, Teacher | WA + Email |
| Session rescheduled | Admin moves a session to a new date or time | All enrolled parents, Teacher | WA |
| Cover teacher assigned | Cover teacher confirmed for a session | Enrolled parents, Cover teacher | WA + App |
| Cover request sent | System dispatches a cover request to eligible teachers | Eligible teachers | App |
| Cover confirmed | Teacher accepts a cover request | HOD, Admin | App |
| Attendance unmarked | Session ended with no attendance marked by the teacher | Teacher, Admin | App |
| Oversubscription alert | A session exceeds the room's configured capacity | Admin | App |
| Room conflict detected | A new session is scheduled in a room that has an existing booking at the same time | Admin | App |
| Waitlist offer sent | Admin manually triggers a 24-hour spot offer to the next student on the waitlist | Parent (waitlisted student) | WA |
| Waitlist offer expired | 24-hour waitlist offer window expires without a parent response | Admin | App |

## 3.5 M06 — Attendance & Makeups

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Absence recorded | Student marked Absent in a session | Parent | WA |
| Smaller absence alert | Student's absences in a subject reach the makeup allowance minus 1 (one remaining) | HOD, Admin | App |
| Big absence alert — allowance exceeded | Student's absences exceed the configured makeup allowance for a subject in the current term | HOD, Admin, Parent | WA + App |
| Absence alert suppressed | Big absence alert would fire but the parent has already provided a reason and return date | No notification sent — system logs suppression | — |
| Makeup booked | Makeup session scheduled for a student | Parent | WA |
| Makeup carry-over applied | End of term — unused makeups calculated and carried forward per tenant configuration | Admin, Parent | App + WA |
| No-show logged | Admin logs a no-show against a student who missed a scheduled makeup session | Admin (confirmation only) | App |
| Attendance not marked — 24 hours | Session attendance has not been marked 24 hours after the session end time | Teacher (assigned), Admin | In-app — yellow banner (Cannot be toggled off) |
| Attendance not marked — 48 hours | Session attendance has not been marked 48 hours after the session end time | Teacher (assigned), HOD, Admin | In-app — amber banner (Cannot be toggled off) |
| Attendance not marked — 72 hours | Session attendance has not been marked 72 hours or more after the session end time | Teacher (assigned), HOD, Admin | In-app — red banner (Cannot be toggled off) |

## 3.6 M06.A — Concern Engine

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Concern raised (L1) | Teacher logs a concern about a student — Level 1 triggered | Teacher (originator), HOD | App |
| Concern auto-escalated to L2 | L1 auto-escalation timer fires — concern unresolved within tenant-configured days | HOD, Academic Head | App |
| Concern auto-escalated to L3 | L2 auto-escalation timer fires — concern unresolved within tenant-configured days | Academic Head, Admin Head, Parent (if configured) | App + WA |
| Concern parent notification (manual) | HOD or Admin Head manually triggers parent notification at any concern level | Parent | WA |
| Concern dismissed (L2+) | HOD or Academic Head dismisses a concern at Level 2 or above with a logged reason | Teacher (originator) | App |
| Concern resolved | Concern marked as resolved by HOD or Academic Head | Teacher (originator), Admin | App |

## 3.7 M07 — Feedback & Communications

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Per-class feedback approved | Teacher approves AI-generated feedback summary — ready for parent delivery | Parent | WA |
| Pre-session announcement | Admin or teacher sends a pre-session announcement to a class group | Parent, Student | WA + Email |
| Post-session announcement | Admin or teacher sends a post-session announcement to a class group | Parent, Student | WA |
| Discussion post by teacher | Teacher posts to a class discussion thread | Students in the class group | App |
| Discussion question by student | Student posts a question in a class discussion thread | Teacher | App |

## 3.8 M07.A — Complaints & Tickets

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Complaint ticket logged | Admin creates a new complaint ticket | HOD | App |
| Complaint escalated | Ticket escalated to Academic Head or Admin Head | Academic Head or Admin Head (per escalation path) | App |
| Complaint resolved | Dual sign-off confirmed — ticket marked Resolved | Admin, Parent (if configured) | App + WA |
| Recurring complaint auto-meeting | Same parent raises 3 or more complaint tickets in a single term | Admin Head | App |

## 3.9 M07.B — Satisfaction Surveys

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Survey invitation | Lifecycle trigger point reached (post-trial, mid-term, end of term, post-withdrawal, manual) | Parent | WA + Email |
| Low satisfaction alert | Survey rating falls at or below the tenant-configured threshold | Admin Head, HOD | App |
| Google Review prompt sent | Survey rating at or above configured threshold — parent prompted to leave a Google Review | Parent | WA |

## 3.10 M08 — Finance & Billing

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Invoice sent | Invoice delivered to parent | Parent | WA + Email |
| Payment received | Payment logged against an invoice | Parent, Admin | WA + App (Phase 2: WA to parent. v1: copy-paste message generated for Admin to send manually + in-app confirmation to Admin) |
| Payment overdue | Payment deadline passed without full settlement | Admin | App (Admin task — v1) |
| Instalment reminder | Before instalment due date (configurable lead time in M20) | Admin | App (Admin task — v1) |

> **v1 Payment Notification Notes:**
>
> **Payment overdue (v1):** In v1, an overdue invoice creates a High priority task assigned to the responsible Admin: "Payment follow-up — [Guardian Name] — Invoice #[ref] — [amount] overdue [N days]." The task includes a copy-paste ready message for manual guardian contact. Direct guardian notification via WhatsApp and Email is Phase 2 when BSP is connected.
>
> **Instalment reminder (v1):** In v1, instalment reminders are delivered as tasks assigned to Admin, not as direct guardian notifications. Task text: "Payment follow-up — [Guardian Name] — Invoice #[ref] — [amount] due on [date]." Reminders fire at 7 days, 3 days, and 1 day before due date (each independently togglable in M20). Direct guardian WhatsApp reminders are Phase 2.
>
> **Payment received (v1):** In v1, when a payment is recorded, the system generates a copy-paste ready payment confirmation message for Admin to send to the parent via their personal WhatsApp. An in-app confirmation is sent to Admin. Direct WA delivery to the parent via BSP is Phase 2.
| 3rd instalment added | Admin adds a 3rd instalment to a payment plan. No prior approval required. | Admin Head (notification only) | App |
| Discount applied | Discount added to an invoice by Admin | Admin Head (notification only) | App |
| Credit applied to invoice | Credit balance applied to reduce an invoice total | Parent, Admin | WA + App |
| Zoho Books sync failure | Invoice created in Enrolla fails to sync to Zoho Books after automatic retry | Super Admin, Admin Head | Email + App |
| Subscription auto-charge reminder | Configured days before a subscription renewal. Parent has option to cancel before charge. | Parent | WA + Email |
| Subscription payment failed | Card-on-file charge attempt fails at the payment gateway | Parent, Admin | WA + Email + App |
| Session transfer completed | Admin Head approves and completes a session credit transfer between siblings | Admin, Parent (both students) | App + WA |
| Outstanding balance at re-enrolment | Student with an outstanding invoice balance attempts to re-enrol | Admin Head | In-app (Cannot be toggled off) |

## 3.11 M09 — Staff & Performance

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Staff document expiring soon | Staff document approaching the tenant-configured expiry lead time | Admin Head, Staff member | App |
| Staff document expired | Staff document past its expiry date | Admin Head | App |
| Critical document restriction | Expired critical document blocks new class assignments for that staff member (if toggle enabled) | Admin Head, HOD, Staff member | App |
| Onboarding checklist item overdue | Onboarding task not completed within the expected timeframe | Admin Head | App |
| Workload amber alert | Teacher at 90%+ of contracted hours for 3 consecutive weeks | HOD | App |
| Workload red alert | Teacher at or above contracted hours for 2+ consecutive weeks, or more than 110% in any single week | Admin Head | App |
| Handover document required | Staff member with a gateway approval role logs planned leave without completing a handover document | Staff member, Admin Head, Super Admin (escalating reminders at 3 days, 1 day, and day of leave start) | App |
| Approval gateway request received | A new gateway approval request is routed to an approver | Designated approver | App |
| Approval gateway request re-routed | Requester manually re-routes a pending gateway request to a new approver | New approver, original approver | App |
| Approval gateway request unactioned (24hr) | Gateway request has been pending for more than 24 hours without action | Designated approver, Admin Head | App |
| Access revoked | Staff member's last working day has passed — system access revoked automatically | Admin Head (confirmation) | App |
| Teacher off-boarding notification chain | Triggered when a teacher's off-boarding is initiated: (1) Immediate — HOD notified; (2) T-7 days — Admin Head reminder; (3) T-3 days — all affected student families notified (copy-paste message); (4) Last day — system access revoked automatically | HOD, Admin Head, Affected guardians | In-app (staff), Email (guardians) — Cannot be toggled off |

## 3.11b M10 — Churn & Retention

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Daily churn risk digest | Daily summary of all students whose churn score entered the High Risk band in the last 24 hours | Admin Head | In-app + Email (Configurable — default On) |

## 3.12 M11 — Academic Courses & Catalogue

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Exam event logged | Admin or teacher logs an upcoming exam for a subject, year group, and school | Enrolled students + potential leads at same school and year group | WA + Email + App |
| Exam countdown active | Exam event is within the countdown window for a student in an applicable year group (Y10–Y13 default, toggleable) | Student profile widget updated — no outbound notification | App |

## 3.13 M13 — Automation & Communications

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| WhatsApp delivery failure | BSP reports a message as undeliverable after automatic retry | Admin | App |
| WhatsApp message flagged (rejected) | BSP rejects a WhatsApp template message — message cannot be delivered | Admin | App |
| Instagram DM received | Inbound Instagram DM captured via Graph API — requires Admin reply within 24-hour Meta window | Admin | App |
| Instagram 24-hour window expiring | Instagram DM received but no reply sent within 20 hours — 4-hour warning before window closes | Admin | App |
| Automation rule triggered | A workflow automation rule fires on its configured trigger event | Per automation action configuration | Per config |

## 3.14 M14 — Assignment Library

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Assignment assigned | Teacher assigns an assignment to a student or class group | Student, Parent | App + WA |
| Assignment due reminder | Approaching assignment deadline (configurable lead time) | Student, Parent | App + WA |
| Assignment overdue | Deadline passed without submission | Teacher | App |
| Assignment graded | AI evaluation complete (digital) or teacher manually logs grade (physical) | Student, Parent | App |

## 3.15 M15 — Inventory & Supplies

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Low-stock alert | Stock level falls to or below the reorder threshold for an inventory item | Admin, Academic Head | App |
| Low-stock alert (subject-linked item) | Stock level falls to or below threshold for an item linked to a specific subject | HOD (for that subject) | App |

## 3.16 M16 — Task Management

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Task assigned to you | Admin or staff member assigns a task to another staff member | Assignee | App |
| Task due tomorrow | Task due date is within 24 hours and task is not yet completed | Assignee | App |
| Task overdue | Task deadline passed without completion | Assignee, Task creator | App |
| @mention in task comment | Staff member @mentioned in a task comment or thread reply | Mentioned staff member | App |
| Task completed | Assignee marks task as complete | Task creator | App |

## 3.16b M18 — Guardian Profile

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Profile Update Link generated | Admin generates a Profile Update Link for a guardian | Guardian | Email — Cannot be toggled off |
| Profile Update Link expired | A Profile Update Link expires without the guardian submitting updates | Admin (who generated it) | In-app (Configurable — default On) |
| Guardian profile updated via link | Guardian submits profile updates via the Profile Update Link | Admin | In-app — Cannot be toggled off |
| Co-parent link request sent | Admin initiates a co-parent link on behalf of both parties | Admin (confirmation only) | In-app — Cannot be toggled off |
| Co-parent link confirmed | Admin confirms the co-parent link manually on behalf of both parties. Logged with Admin name, timestamp, and note that both parties verbally or physically confirmed. | Admin (confirmation log) | In-app — Cannot be toggled off |
| Co-parent link confirmed (Phase 2) | Automated dual-party confirmation via parent portal. Deferred to Phase 2. | Phase 2 | Phase 2 |

## 3.17 M19 — Progress Tracking & Reports

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Progress report auto-generated | Report cadence timer fires (default: every 3 weeks). Report ready for teacher or HOD review. | Teacher, HOD (for review) | App |
| Progress report approved | Teacher or HOD approves progress report — ready for parent delivery | Parent | WA + Email |
| 48-hour tracker update overdue | Teacher has not updated a student's progress tracker within 48 hours of a completed session | Teacher, HOD | App |
| Intervention flag raised | Progress tracker shows a student has been below the pass threshold for a configurable number of consecutive sessions | HOD, Academic Head | App |

## 3.18 M20 — Tenant Settings & Platform

| **Notification** | **Trigger** | **Recipient(s)** | **Channel** |
|---|---|---|---|
| Integration sync error | A scheduled sync with Zoho Books, Zoho People, or a payment gateway fails | Super Admin, Org Owner | Email + App |
| DPA acknowledgement required | New tenant activated — Data Processing Agreement confirmation pending | Super Admin (new tenant) | Email |
| Trial subscription ending (Enrolla) | Enrolla 14-day trial approaching day 13 — subscription will auto-start in 24 hours | Org Owner | Email + App |
| Enrolla subscription payment failed | Tenant's Enrolla subscription payment fails | Org Owner | Email + App |
| Tenant data deletion scheduled | Tenant has churned — data deletion scheduled in 90 days | Org Owner | Email |
| Feature toggle changed | Super Admin or Org Owner changes a feature toggle state | Admin Head (information only) | App |

---

# 5. Configuration Rules

The following rules govern how notifications are configured and delivered across the platform.

Every notification listed in Section 3 has a corresponding toggle in M20 Notification Toggles. Super Admin and Org Owner can enable or disable any notification independently.

Notification templates are configurable per tenant. Merge fields available in all templates: [student name], [parent name], [subject], [session date], [session time], [teacher name], [school name], [year group], [tenant name], [amount], [due date].

WhatsApp templates must be submitted to and approved by Meta via the BSP before they can be used. Template management is accessed in M20 under the WhatsApp integration card.

A template library with personal templates (any staff) and org-wide templates (Admin Head or Super Admin approval required before publishing) is available in M13.

DNC flag on a guardian suppresses all WA and Email notifications. In-app staff notifications are unaffected. The following notification categories always send regardless of DNC status: (1) invoices and payment communications, (2) safeguarding and welfare notifications, and (3) M06.A concern escalation messages to the guardian.

Unsubscribe flag suppresses marketing and non-transactional communications only. Transactional messages (invoices, session reminders, attendance alerts) still send.

Notifications marked with channel Per config are automation-engine notifications where the channel is set by the staff member who built the automation rule.
