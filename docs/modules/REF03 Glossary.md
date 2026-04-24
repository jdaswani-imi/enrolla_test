---
module: "REF-03"
title: "Glossary"
layer: "Reference"
folder: "02_Reference"
status: "Draft"
phase: "v1"
dependencies: []
tags: [enrolla, prd, reference, glossary]
---

# ENROLLA
# [[02_Reference-REF03_Glossary|REF-03]] — Glossary
v1.1 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

This document defines the standard terminology used throughout the Enrolla platform and all PRD documents. Where a term has a specific platform meaning that differs from its everyday meaning, the platform meaning takes precedence. All staff, developers, and operators should use these definitions consistently.

| **Property** | **Value** |
|---|---|
| Module code | [[02_Reference-REF03_Glossary|REF-03]] |
| Version | v1.0 |
| Status | Draft |
| Dependencies | [[01_Foundation-PL01_Platform_Architecture|PL-01]], [[01_Foundation-PL02_RBAC|PL-02]], [[02_Reference-REF02_Data_Model|REF-02]] |
| Phase | v1 |

---

# 1. Platform & Architecture Terms

| **Term** | **Definition** |
|---|---|
| Tenant | A single organisation using the Enrolla platform. All data is isolated at the tenant level. One Organisation equals one tenant. |
| Organisation | The top-level billing and administrative unit within Enrolla. Contains one or more Branches. Also referred to as Org. |
| Branch | A physical or operational location within an Organisation. The primary operational context for staff and students. |
| Org Owner | The individual provisioned at tenant creation who holds ultimate ownership of the tenant account. Distinct from Super Admin in the platform admin context. |
| Org Super Admin | A Super Admin who has cross-branch visibility across all Branches within an Organisation. |
| Org Slug | A unique URL identifier assigned to a tenant at provisioning (e.g. enrolla.app/imi). Cannot be changed after first use. |
| Multi-tenant | The architecture model in which a single Enrolla installation serves multiple independent tenants with full data isolation. |
| Platform Admin Panel | The internal Enrolla tooling layer operated by Enrolla staff only. Separate from the tenant-facing application. See [[01_Foundation-PL05_Platform_Admin|PL-05]]. |
| Feature Toggle | A per-tenant on/off switch for a platform module or feature. Configured by Super Admin in [[09_Settings-M20_Tenant_Settings|M20]]. |
| Phase 2 | Features that are out of scope for Enrolla v1. Includes parent portal, WhatsApp BSP integration, Zoho Books sync, payment gateway integrations, and Instagram Graph API. |
| Test Window | A 14-day period after tenant activation during which test records do not lock the Student ID format or invoice sequence. |
| DPA | Data Processing Agreement. A legally required agreement between Enrolla and a tenant confirming how personal data is processed. Must be confirmed before tenant activation. |

---

# 2. Role & Access Terms

| **Term** | **Definition** |
|---|---|
| RBAC | Role-Based Access Control. The permission model governing what each staff member can see and do in the platform. |
| Primary Role | The main role assigned to a staff member. Every staff member must have exactly one primary role. |
| Secondary Role Label | An additional role designation assigned to a staff member on top of their primary role. Adds permissions and routing responsibilities without restricting existing access. Any number of secondary labels can be held simultaneously. |
| Super Admin | The highest-permission tenant role. Full platform access. Cannot be restricted. One per Organisation. |
| Admin Head | Senior operational manager at branch level. Approves high-impact gateway actions. |
| Admin | Primary operational role for day-to-day data entry, scheduling, invoicing, and communications. |
| Academic Head | Academic oversight role across all departments. Authority over academic concerns and escalations. |
| HOD | Head of Department. Academic lead for one department. Oversees teachers and students within their department. |
| Head of Subject | Subject-level academic lead. Sits between HOD and Teacher in the academic hierarchy. |
| Teacher | Primary session delivery role. Scoped to own assigned classes and students. |
| TA | Teaching Assistant. Read access to assigned classes with limited operational actions. |
| HR / Finance | A pre-configured custom role at IMI granting access to salary data, staff profiles, documents, finance exports, and Immediate Access Revocation. |
| Developer | A platform role with full Super Admin-level data and operational access, excluded from all approval routing chains and notifications. Used for technical staff building and maintaining the application. |
| Custom Role | A tenant-configurable role with any combination of permissions, created by Super Admin in [[09_Settings-M20_Tenant_Settings|M20]]. |
| Approval Gateway | The mechanism by which high-impact actions are submitted, routed, approved or rejected, and permanently logged. |
| Approval Gateway Request | A specific action submitted through the approval gateway that requires sign-off from an eligible role. |
| Vacant Role Fallback Chain | The automatic escalation path for gateway requests when the designated approver role is vacant: HOD → Academic Head → Admin Head → Super Admin. |
| Immediate Access Revocation | An action that instantly invalidates all active sessions for a staff account. Performed by Super Admin or HR/Finance. |
| Handover Document | A mandatory document created when a gateway-role staff member logs planned leave. Designates cover approvers for all gateway action types. |
| Department-Scoped Role | A role restricted to data from one specific department (Primary, Lower Secondary, or Senior). |

---

# 3. Student Lifecycle Terms

| **Term** | **Definition** |
|---|---|
| Lead | A prospective student or parent who has submitted an enquiry via any capture channel. Leads are never deleted. Terminal statuses: Won, Lost, Archived. |
| Student | An enrolled individual with a confirmed payment. Created from a Lead record on first payment confirmation. |
| Guardian | A parent or legal guardian linked to one or more students. Holds the billing relationship and communication consent records. |
| Co-Parent | A second guardian linked to a student via a confirmed bidirectional Co-Parent Link. |
| Sibling Group | A logical grouping of students linked via shared guardian, co-parent confirmation, or manual admin linking. |
| Pipeline Stage | A named step in the lead progression pipeline (New, Contacted, Assessment Booked, Assessment Done, Trial Booked, Trial Done, Schedule Offered, Schedule Confirmed, Invoice Sent, Paid, Won). |
| Assessment | A free diagnostic evaluation of a lead or existing student. Produces a placement recommendation and target grade. |
| Assessment Booking Link | A unique URL sent to a parent for self-service scheduling of a diagnostic assessment. |
| Trial Class | A paid trial session at a premium rate. On conversion to full enrolment, the premium difference above a standard session rate is credited to the student account. |
| Trial Class Review | A structured teacher outcome form submitted after a trial session. Reviewed by Admin before being shared with the parent. |
| Slot Hold | A provisional reservation of a timetable slot during the enrolment process. Released automatically if payment is not confirmed within the hold period. |
| Enrolment | The confirmed link between a Student, a Course, and a Term. Created on first payment. The central operational record. |
| Withdrawal | The removal of a student from one or more subjects (partial) or all subjects (full). Captured as a Withdrawal Record. |
| Won | Lead terminal status indicating successful conversion to an enrolled student. |
| Lost | Lead terminal status indicating the lead did not convert and is no longer being pursued. |
| Archived | Lead terminal status for DNC, disgruntled, or auto-inactive leads. Retained permanently. |
| Graduated | A student who has completed their final year at the centre. Graduated is a transitional position. The platform automatically moves the student to Alumni status after 30 days (platform default, configurable in [[09_Settings-M20_Tenant_Settings|M20]] by Super Admin). |
| Alumni | A former student who has completed their studies. Alumni status is applied automatically 30 days after Graduated status (configurable). Alumni students remain in the system for historical records and can be contacted for re-enrolment outreach. |
| Year Group Progression | The automatic annual advancement of all active students to the next year group on the configured graduation date. |
| Senior student | A permanent student category for adult learners and external professionals who are not enrolled in a school year group. Senior students are assigned to the Senior department. They do not have a year group position (FS1–Y13). The per-session rate for Senior students uses the Senior rate card entry (IMI default: AED 350). |
| Enrichment | A fourth operational department for programmes that sit outside the standard Primary / Lower Secondary / Senior academic structure. Enrichment is age-range based rather than year-group based. Students enrolled in Enrichment subjects are also assigned to a primary department based on their year group — Enrichment is an additional subject category, not a mutually exclusive department designation. Revenue from Enrichment subjects uses a separate revenue tag and bank account where configured. |
| Holdback | An administrative flag preventing a specific student from advancing during annual year group progression. |
| Student ID | A unique platform-wide identifier assigned to each student at the point of profile creation. Format: OrgPrefix-#### (e.g. IMI-0001). The Student ID never includes a branch code, regardless of the number of branches operated by the tenant. Sequential numbers are assigned platform-wide, not per branch. Never reused. |
| KHDA Requirement | A regulatory requirement at IMI that a guardian must be physically present for all FS1 and FS2 sessions. Flagged on the student profile. |

---

# 4. Academic Terms

| **Term** | **Definition** |
|---|---|
| Course | An academic offering defined by Qualification + Exam Board + Subject + Specifier. The catalogue entry that drives sessions, pricing, topic trees, and grade tracking. |
| Subject | A discipline (e.g. Mathematics). Unique across the organisation. A subject can have multiple Course variants. |
| Topic | A curriculum unit within a Course. Organised hierarchically: Topic > Subtopic. |
| Session | A single timetabled class occurrence. Has a defined type (Class, Trial, Assessment Slot, Event Session, Cover Session, Meeting, Blocked Time). |
| Session Unit | The standard deductible unit for a course, defined by the session duration in [[04_Academic-M11_Academic_Courses|M11]]. All session deductions are whole numbers — no decimal session counts anywhere in the platform. |
| Recurrence Series | A defined repetition pattern for sessions (weekly, fortnightly, monthly, custom interval). The first session in the series acts as the template. |
| Room | A physical or virtual teaching space with a configured capacity. |
| Term | A named academic period with a start and end date. Sessions are scheduled and billed within terms. |
| Half-Term Break | A mid-term pause period. Sessions continue or pause per student configuration. |
| Holiday Break | A full break between terms. No regular sessions are scheduled during holiday breaks unless they are Holiday Programme events. |
| Closure | A specific date or date range when the facility is closed. Sessions cannot be scheduled on closure dates. |
| Academic Calendar | The full sequence of terms, breaks, closures, and public holidays for an academic year, configured per Organisation in [[09_Settings-M20_Tenant_Settings|M20]]. |
| Exam Event | A logged upcoming exam for a subject, year group, and school combination. Drives exam countdown widgets and notifications. |
| Exam Countdown | A widget active on student profiles for Year 10–13 students showing time remaining until a logged exam event. |
| Cover Session | A session delivered by a substitute teacher in place of the assigned teacher. |
| Waitlist | A ranked queue of students waiting for a spot in a full session. Offers are triggered manually by Admin. |
| Department | A named grouping of year groups within a Branch. IMI default: Primary (FS1–Y6), Lower Secondary (Y7–Y9), Senior (Y10–Y13). Not a database entity — a classification field. |
| CPD | Continuing Professional Development. Logged activities tracked against a staff member's annual CPD target. |

---

# 5. Attendance Terms

| **Term** | **Definition** |
|---|---|
| Attendance Record | A per-student per-session presence record. Status options: Present, Absent, Late, No Show. |
| Deduction | The removal of session units from a student's balance. Occurs at attendance confirmation, not scheduling. |
| Makeup | A replacement session for an absence. Consumed from the student's term makeup allowance. Subject to a 24-hour notice rule. |
| Makeup Allowance | The number of makeups a student is entitled to per subject per term. IMI default: 1 per term (Primary), 2 per term (Secondary). |
| Makeup Carry-Over | Unused makeup sessions carried forward to the next term. Carry-over value is a fixed whole number only (0, 1, or 2). Percentage-based carry-over is not supported. |
| No-Show | A student who was booked for a session (including a confirmed makeup) and did not attend without prior notice. |
| Absent Zero | A score of zero recorded for an assignment or topic when a student was absent. Absent zeros are included in score averages, tier calculations, and predicted grade calculations. The Absent flag is retained on the attempt record to identify the reason. An absent zero that falls below the pass threshold counts as Requires Support — a student who misses enough graded sessions will trigger an intervention through absence alone. |
| Smaller Absence Alert | A notification triggered when a student's absences reach the makeup allowance minus 1 — one remaining before the allowance is exceeded. |
| Big Absence Alert | A notification triggered when a student's absences exceed the configured makeup allowance for a subject in the current term. |

---

# 6. Finance Terms

| **Term** | **Definition** |
|---|---|
| Invoice | A financial document per student per subject per term. Contains line items, discounts, VAT, and the payment schedule. |
| Line Item | A single billable entry on an invoice, linked to a subject and session count. Rate pulled automatically from the Course catalogue. |
| Instalment | A scheduled partial payment on an invoice. Maximum 2 by default. A 3rd instalment can be added by Admin with Admin Head notified. |
| Payment Plan | An invoice structured for payment in 2 or 3 instalments across defined due dates. |
| Credit | A monetary credit on a student account applied as a deduction to future invoices. Sources: trial conversion, session cancellation, manual credit (Admin, logged reason required). Credits are post-VAT deductions. |
| Discount | A reduction applied to an invoice line item. Only one discount can be applied per invoice line item. Discounts do not stack. A discount is expressed as either a fixed AED amount or a percentage. |
| VAT | Value Added Tax at 5% (UAE standard). Applied after discounts — discounts are calculated first, VAT is applied to the post-discount amount. |
| Revenue Tag | Attribution of an invoice or payment to a specific department and bank account for financial reporting. |
| Bad Debt | An invoice marked as uncollectable. Requires Admin Head or Super Admin authority. |
| Fee Waiver | The removal of a specific fee (trial, session, or enrolment) from an invoice. Admin can waive fees at point of invoice creation with a logged reason. No prior approval required. |
| Fee-Exempt Student | A student with a blanket full fee exemption toggle active. All line items are built at full value then zeroed on the invoice. Admin can activate this toggle without prior approval. A logged reason is mandatory. |
| Zero-Value Invoice | An invoice with a total of AED 0.00. Auto-resolved to Paid status. Admin Head receives a nudge notification. No parent notification sent. |
| Enrolment Fee | A one-time AED 300 fee charged per student at IMI. Lifetime — not charged again on re-enrolment. Attached to the student record, not the first invoice. |
| Trial Fee | IMI: AED 250 (Primary) or AED 300 (Secondary). Charged at a premium rate. On conversion, the premium difference above a standard session rate is credited to the student account. |
| CAT4 | Cognitive Abilities Test (Level 4). Charged at AED 200 per session at IMI. |
| Invoice Number | A sequential identifier with a configurable prefix and separator. The starting number is lockable after the first invoice is issued. |
| Revenue Segment | One of three income streams at IMI, each mapped to a separate bank account. |
| Zoho Books | The external accounting system integrated with Enrolla via API (Phase 2). Invoices sync to Zoho Books on issue. |

---

# 7. Communication & Consent Terms

| **Term** | **Definition** |
|---|---|
| DNC | Do Not Contact — An internal operational flag on a guardian's profile indicating that non-essential outbound communications should be suppressed. DNC is set manually by Admin or by the guardian's own communication preference. DNC is not a legal directive. The following communication types always send regardless of DNC status: invoice and payment communications, safeguarding and welfare notifications, [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern escalation messages. DNC is reset to default when a student re-enrols (with an in-platform notice to Admin). DNC is a warning interstitial in the platform — not a hard block on action. |
| Unsubscribe | A soft opt-out from non-essential communications. Transactional messages (invoices, session reminders, attendance alerts) still send. |
| Notification | A system-generated message delivered to a recipient via a configured channel (WhatsApp, Email, or In-app). |
| Announcement | A pre-session or post-session communication sent to a class group by a teacher or Admin. Requires approval gateway sign-off before delivery to parents. |
| Internal Message | A staff-to-staff message within the platform. Supports deep-link tagging of records. Retained permanently. |
| Communication Log | A record of every outbound and inbound communication event on a student or guardian profile. |
| WhatsApp BSP | WhatsApp Business Service Provider. The third-party intermediary for approved WhatsApp messaging. Phase 2 — not active in v1. |
| WA | WhatsApp. Used as a channel abbreviation throughout the notification catalogue. |
| Template | A pre-configured message body with merge fields used for system-generated notifications. WhatsApp templates require Meta approval via the BSP. |
| Merge Field | A dynamic placeholder in a notification template that is replaced with real data on send (e.g. [student name], [session date]). |
| Deep-Link Tag | A reference to a specific platform record (student profile, invoice, concern) embedded in an internal message. Clicking the tag navigates directly to the linked record. |
| Class Discussion Thread | A persistent text thread for a class group used for teacher announcements and student questions. Teacher-moderated. Students cannot initiate threads. |
| Segment | A dynamic or saved contact group built from filter criteria in [[05_People-M12_People_Forms|M12]]. Resolution is lazy — segment membership is not evaluated at record creation time. Membership is resolved when the segment is referenced by an automation rule, report, or manual query. Cache duration: 15 minutes. After 15 minutes, the segment re-evaluates on next reference. Cache is time-based only — no event triggers early invalidation. |

---

# 8. Concern & Escalation Terms

| **Term** | **Definition** |
|---|---|
| Concern | A teacher-raised record about a student's academic or behavioural situation. Escalates through three levels based on configured timers. |
| L1 Concern | Level 1 concern. Visible to Teacher (originator) and HOD. No parent notification by default. |
| L2 Concern | Level 2 concern. Auto-escalates from L1 after tenant-configured days. Visible to HOD and Academic Head. |
| L3 Concern | Level 3 concern. Auto-escalates from L2. Visible to Academic Head, Admin Head, and Parent (if configured). |
| Concern Dismissal | The closing of a concern before resolution. Requires HOD or Academic Head authority at L2+. Logged reason mandatory. |
| Academic Alert | A soft flag triggered by a single signal (poor score, absence on topic, overdue submission, Requires Support tier). Two or more signals within a 4-week rolling window triggers a formal [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern. |
| Intervention Flag | A flag raised when a student has been below the pass threshold for a configurable number of consecutive sessions. |


---

# 9. Task & Workflow Terms

| **Term** | **Definition** |
|---|---|
| Task | A unit of work in [[07_Operations-M16_Task_Management|M16]] Task Management. Can be student-linked (High priority) or standalone. |
| Task Thread | A typed discussion thread attached to a task or record. Types: Complaint, Scheduling, Academic Concern, Feedback, Financial, General, Meeting. |
| Snooze | Deferring a task to a later date. Low Priority tasks can be snoozed any number of times without escalation. Medium, High, and Urgent tasks escalate to Admin Head after 3 snoozes. |
| Recurring Task | A task that auto-recreates on a configured schedule (daily, weekly, monthly, or custom). |
| Off-boarding Checklist | A mandatory checklist of actions to complete when a staff member departs. Template configurable in [[09_Settings-M20_Tenant_Settings|M20]]. |

---

# 10. Progress & Assessment Terms

| **Term** | **Definition** |
|---|---|
| Progress Tracker | A per-student per-subject record of topic coverage, scores, attendance, and teacher remarks. Updated by the teacher within 48 hours of each session. |
| Progress Report | A periodic synthesised PDF report covering a student's academic performance. Generated on configurable cadence (default: every 3 weeks). Requires teacher or HOD approval before sending to parents. |
| Target Grade | The grade a student is working towards in a subject, set during assessment or enrolment. Used in progress reports and tracker views. |
| Predicted Grade | A system-calculated grade projection based on current progress tracker data. Absent zeros are included in the calculation — they count as zero scores. |
| Performance Tier | A classification of student performance (e.g. Exceeding, Meeting, Approaching, Requires Support). Calculated from tracker scores. Absent zeros are included — they count as zero scores toward the tier calculation. |
| Not Submitted | The evaluation tier shown for topics where no session has yet been held in the current term. Reserved exclusively for untaught topics — it indicates the topic has not yet been delivered, not that a student was absent or missed work. Absent zeros show as Requires Support, not Not Submitted. |
| Assignment | An academic task in the Assignment Library. Two types: Physical (PDF, manually marked) and Digital (interactive, AI-evaluated). |
| AI Narrative | A Claude-generated parent-friendly summary of a student's progress report. Requires teacher or HOD approval before delivery. No report sends without explicit approval. |
| Feedback Window | The period during which a teacher can submit per-class feedback: from session end until the next session of the same subject for that student. |

---

# 11. Inventory Terms

| **Term** | **Definition** |
|---|---|
| Inventory Item | A physical supply tracked in [[M15 — Inventory|M15]]. Linked optionally to a Course or Event for auto-deduction on enrolment. |
| Supplier | A vendor in the Supplier Directory with contact details and purchase links. |
| Reorder Threshold | The stock level at which a low-stock alert is triggered for an inventory item. |
| Stock Adjustment | A record of any change to an inventory item's stock level (receipt, deduction, manual adjustment, auto-deduction). |
| Auto-Deduct | Automatic reduction of inventory stock when a student enrols in a linked course or event. Rules configured per year group. |

---

# 12. IMI-Specific Terms

| **Term** | **Definition** |
|---|---|
| IMI | Improve ME Institute. The reference tenant for Enrolla v1. Located at Gold & Diamond Park, Dubai. |

| Primary | IMI department covering year groups FS1 through Year 6. |
| Lower Secondary | IMI department covering year groups Year 7 through Year 9. |
| Senior | IMI department covering year groups Year 10 through Year 13. Also the student category for adult learners and external professionals not in the school year group system (see Senior student in §3). |
| FS1 | Foundation Stage 1. Also known as Nursery. EYFS year group. Guardian must be present for all sessions at IMI (KHDA requirement). |
| FS2 | Foundation Stage 2. Also known as Kindergarten 1. EYFS year group. Guardian must be present for all sessions at IMI (KHDA requirement). |
| AED | UAE Dirham. The currency used throughout the IMI tenant. |
| Classcard | The platform replaced by Enrolla for student and session management at IMI. |
| ClickUp | The platform replaced by Enrolla for pipeline tracking and task management at IMI. |
| Zoho Forms | The platform replaced by Enrolla for lead capture forms at IMI. |
| Zoho Books | Retained by IMI for accounting. Integrated with Enrolla via API in Phase 2. |
| Zoho People | Retained by IMI for HR. Integrated with Enrolla via API in Phase 2. |
| Mailchimp | Retained by IMI for email marketing. Data exported from Enrolla via CSV for import into Mailchimp. |
| Telr | One of the payment gateways available for integration at IMI (Phase 2). |
| Network International | One of the payment gateways available for integration at IMI (Phase 2). |
| Stripe | One of the payment gateways available for integration at IMI (Phase 2). |
