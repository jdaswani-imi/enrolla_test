---
module: "REF-02"
title: "Data Model"
layer: "Reference"
folder: "02_Reference"
status: "Draft"
phase: "v1"
dependencies: [PL-01]
tags: [enrolla, prd, reference, data-model]
---

# ENROLLA
# [[02_Reference-REF02_Data_Model|REF-02]] — Data Model
v1.1 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

This document defines every core data entity in Enrolla, its description, and its key relationships to other entities. It is the primary reference for the developer when building the data layer. All entities are scoped to a tenant — no entity exists outside a tenant boundary except Organisation and Branch records, which sit above tenant scope.

| **Property** | **Value** |
|---|---|
| Module code | [[02_Reference-REF02_Data_Model|REF-02]] |
| Version | v1.0 |
| Status | Draft |
| Dependencies | [[01_Foundation-PL01_Platform_Architecture|PL-01]], [[01_Foundation-PL04_Security_Access|PL-04]] |
| Phase | v1 |

---

## Reading Guide

| **Term** | **Meaning** |
|---|---|
| Belongs to | A foreign key relationship. The entity holds a reference to the parent entity. |
| Has many | A one-to-many relationship. The parent entity links to multiple instances of the child. |
| Has one | A one-to-one relationship. |
| Extends | The entity adds fields to a parent entity without replacing it. |
| Linked to (optional) | A nullable foreign key. The relationship may or may not exist for a given record. |

---

# 1. Entity Reference

## 1.1 Platform & Access

| **Entity** | **Description** | **Key Relationships** |
|---|---|---|
| Organisation | The billing and configuration unit above Branch. One Organisation contains one or more Branches. The Org Owner account belongs here. Sits above tenant scope. | Has many: Branches, Users (via branches). Has one: Org Owner account. |
| Branch | An operational location within an Organisation. Each Branch has its own rooms, staff assignments, student records, and branch-level settings. Inherits Org settings with optional overrides. | Belongs to: Organisation. Has many: Rooms, Staff assignments, Sessions. Inherits: Org settings. |
| Department | A named grouping within a Branch used for routing, permissions scoping, reporting, and billing tagging. Not a database entity — a classification field on Student, Course, and Session records. | Belongs to: Branch (as classification). Applied to: Student, Course, Session, Invoice. |
| Tenant | The root isolation boundary. Every entity below is scoped to a Tenant. In a single-branch setup, Tenant and Organisation are effectively the same. | Has many: all entities below. Isolation enforced at database query level. |
| User | A staff member with one or more RBAC roles. Created by Super Admin or Org Owner. Can be assigned to one or more Branches. | Belongs to: Tenant. Has many: Roles, Sessions (as teacher), Tasks (assigned/created), CPD Records, Staff Documents. Has one: Staff Profile. |
| Role | A named collection of permissions. Up to 12 default roles plus unlimited custom roles per tenant. Roles are additive. Secondary role labels extend a User's effective permissions. | Belongs to: Tenant. Has many: Users, Permissions. |
| Permission | A granular access right scoped to Module + Action + Scope (e.g. [[06_Finance-M08_Finance_Billing|M08]] / Full / Own branch). | Belongs to: Role. |
| Handover Document | A planned leave handover record created when a gateway-role staff member logs planned absence. Designates a named cover approver per gateway action type. | Belongs to: User (absent staff member). Has many: Cover Approver assignments (one per gateway action type). Has one: Leave period, Completion status. |

## 1.2 People & CRM

| **Entity** | **Description** | **Key Relationships** |
|---|---|---|
| Lead | A prospective student or parent who has submitted an enquiry via any capture channel. Never deleted. Terminal statuses: Won, Lost, Archived. | Belongs to: Tenant. Has one: Guardian (linked on creation or conversion). Has many: Pipeline stage changes, Activities, Assessments, Notes, File attachments. |
| Student | An enrolled individual. Created from a Lead record on first payment confirmation. Carries a permanent cumulative record. Student category: Primary, Secondary, Senior (adult learner — not assigned a year group position, assigned to Senior department). Lifecycle statuses: Active, Withdrawn, Graduated (transitional — automatically moves to Alumni after 30 days), Alumni (permanent terminal status). Lead is the pre-enrolment state. | Belongs to: Tenant, Guardian (billing). Has many: Enrolments, Attendance records, Feedback entries, Assignments (assigned), Concerns, Invoices (via Guardian), Progress Reports, Communication log entries. |
| Guardian | A parent or legal guardian. Linked to one or more Students. Guardian records persist even if all linked students are withdrawn or graduated. | Belongs to: Tenant. Has many: Students, Leads, Invoices (as billing contact), DPN records, Survey responses, Referral records. Has one: Guardian Profile, DNC flag, Unsubscribe flag. |
| Guardian Profile | Extended record for a guardian. Stores DNC status, consent records, co-parent links, referral programme history, and communication preferences. | Extends: Guardian. Has many: DPN records, Referral records, Communication log entries. Has one: DNC flag, Unsubscribe flag, Co-parent link (optional). |
| Sibling Group | A logical grouping of students linked via shared guardian, co-parent confirmation, or manual admin linking. Used for family-level reporting, discount eligibility, and consolidated communications. | Has many: Students. Belongs to: one or more Guardians. |
| Co-Parent Link | A bidirectional confirmed link between two Guardian records. When confirmed, all children under both guardians are flagged as siblings. Status values: Pending (request sent, awaiting confirmation from both parties), Confirmed (both parties have confirmed), Expired (request not confirmed within 14 days), Removed (link was removed by Admin or either guardian). Additional fields: Initiated by (Admin / Guardian A / Guardian B), Initiated at (timestamp), Confirmed at (timestamp), Expiry date (14 days after initiation). | Links: Guardian (primary) to Guardian (co-parent), bidirectional. Has one: Confirmation status, Confirmed by, Confirmed date, Initiated by, Initiated at, Confirmed at, Expiry date. |
| Staff Profile | Extended record for a staff member. Stores employment details, scheduling preferences, document list, CPD record, performance metrics, and departure record. | Extends: User. Has many: Staff Documents, CPD Records, Session assignments. Has one: Employment summary card, Departure record (on off-boarding), Handover Document (on planned leave). |
| Staff Document | An uploaded document on a staff profile (e.g. employment contract, visa). Has configurable expiry tracking. | Belongs to: Staff Profile. Has one: Document type, Expiry date, Verification status (Uploaded / Verified / Expired / Missing), Rename log. |
| CPD Record | A logged continuing professional development activity against a staff member's annual target. | Belongs to: Staff Profile. Has one: Hours, Activity description, Date, Logged by. |

## 1.3 Lead & Enrolment Pipeline

| **Entity** | **Description** | **Key Relationships** |
|---|---|---|
| Pipeline Stage | A named step in the lead pipeline (New, Contacted, Assessment Booked, Assessment Done, Trial Booked, Trial Done, Schedule Offered, Schedule Confirmed, Invoice Sent, Paid, Won). All stages skippable. | Belongs to: Lead. Has one: Stage name, Timestamp, Changed by (User), Stage message sent flag. |
| Assessment | A diagnostic evaluation of a lead or existing student. Free, in-person. Results include placement recommendation and target grade. Outcome form fields: Recommendation (dropdown: Enrol — same level, Enrol — higher level, Enrol — lower level, Do not enrol, Further assessment needed), Observed Level (free text or structured rubric score), Target Grade (free text), Notes (rich text). These fields are completed by the assessor after the assessment session. | Belongs to: Lead or Student. Belongs to: User (assessor). Has one: Outcome, Placement recommendation, Target grade, Observed level, Notes. Linked to: Assessment Booking Link (optional). |
| Assessment Booking Link | A unique URL sent to a parent for self-service scheduling of a diagnostic assessment. Has an expiry date and booking status. | Belongs to: Lead. Has one: Token, Expiry date, Booking status (Sent / Booked / Expired). |
| Trial Class | A paid trial session at a premium rate. Can be booked after assessment. Has a teacher outcome review. On enrolment, the premium difference is credited to the student's account. | Belongs to: Lead or Student, Session. Has one: Trial Class Review, Payment record, Credit issued flag. |
| Trial Class Review | Structured teacher outcome form submitted after a trial session. Reviewed by Admin before sharing with the parent. | Belongs to: Trial Class, User (teacher). Has one: Outcome, Notes, Admin approval status, Shared with parent flag. |
| Slot Hold | A provisional reservation of a timetable slot during the enrolment process. Released automatically if payment is not confirmed within the hold period. | Belongs to: Lead or Student, Session. Has one: Hold expiry date, Release reason. |
| Enrolment | The confirmed link between a Student, a Course, and a Term. Created on first payment. The central operational record driving sessions, invoicing, and attendance. | Belongs to: Student, Course, Term. Has one: Invoice (billing reference). Has many: Sessions (via Course + Term), Attendance records. |
| Withdrawal Record | A record of a partial or full student withdrawal. Captures the reason, retention workflow outcome, and any financial adjustments made. | Belongs to: Student. Has one: Scope (partial/full), Reason, Retention outcome, Financial adjustment flag, Logged by. |
| Referral Record | Links a referring party (guardian or student) to a referred lead. Triggers reward milestones on conversion. | Belongs to: Guardian or Student (referrer), Lead (referred). Has one: Conversion status, Reward tier, Reward issued flag. |

## 1.4 Academic

| **Entity** | **Description** | **Key Relationships** |
|---|---|---|
| Course | An academic offering defined by Qualification + Exam Board + Subject + Specifier. The catalogue entry that drives sessions, pricing, topic trees, and grade tracking. | Belongs to: Tenant. Has many: Topics, Sessions, Enrolments, Assignments. Has one: Pricing configuration, Standard session unit (duration), Course duration (1yr/2yr). |
| Subject | A discipline (e.g. Mathematics). Subject uniqueness is enforced by the combination of name + year group + session duration + session type. The subject name alone is not unique — two subjects can share the same name if they differ in at least one of the other three fields. Example: 'Maths Y7' (Group, 60 min) and 'Maths Y7' (Private, 60 min) are two distinct valid subject records. A subject can have multiple Course variants with different durations or qualifications. | Belongs to: Tenant. Has many: Course variants. Has one: Default session duration. |
| Topic | A curriculum unit within a Course. Organised hierarchically: Topic > Subtopic. Used by the Progress Tracker and Assignment Library. | Belongs to: Course. Has many: Subtopics, Assignments. |
| Session | A single timetabled class occurrence. Has a type (Class, Trial, Assessment Slot, Event Session, Cover Session, Meeting, Blocked Time). Blocked Time: a room or teacher slot reserved without a session attached — no students enrolled, no attendance record, no session deduction. Behavioural spec for all session types: see [[04_Academic-M05_Timetabling_Scheduling|M05]] §01.1. | Belongs to: Course, User (teacher), Room, Branch. Has many: Attendance records, Feedback entries, Waitlist entries. Belongs to: Recurrence Series (if recurring). |
| Recurrence Series | A defined repetition pattern for sessions (weekly, fortnightly, monthly, custom interval). The first session in a series acts as the template. | Has many: Sessions. Has one: Pattern, End condition (date / occurrence count / end of term), Edit scope rules. |
| Room | A physical or virtual teaching space with a configured capacity. | Belongs to: Branch. Has many: Sessions. Has one: Capacity, Room type. |
| Term | An academic period with a defined start and end date, configured in the Academic Calendar in [[09_Settings-M20_Tenant_Settings|M20]]. | Belongs to: Tenant (Academic Calendar). Has many: Enrolments, Sessions. Has one: Term name, Billable flag. |
| Academic Calendar | The full sequence of terms, half-term breaks, holiday breaks, closures, and public holidays for an academic year. Configured per Organisation in [[09_Settings-M20_Tenant_Settings|M20]]. | Belongs to: Organisation. Has many: Terms, Holiday Breaks, Closures, Public Holidays. Drives: Session scheduling, Billing, Makeup allowances. |
| Waitlist Entry | A student queued for a spot in a full session. Maintains a ranked position. Offers are triggered manually by Admin. | Belongs to: Session, Student. Has one: Position, Status (Waiting / Offered / Accepted / Expired), Offer timestamp. |
| Exam Event | A logged upcoming exam for a subject, year group, and school combination. Drives exam countdown widgets and outbound notifications. | Belongs to: Tenant. Linked to: Subject, Year group, School. Has one: Exam date, Logged by. Triggers: Notification to enrolled and potential students at same school and year group. |

## 1.5 Attendance & Welfare

| **Entity** | **Description** | **Key Relationships** |
|---|---|---|
| Attendance Record | A per-student per-session presence record. Status: Present, Absent, Late, No Show. Deduction occurs at confirmation of attendance. | Belongs to: Student, Session, Enrolment. Has one: Status, Absence type, Reason (if absent), Makeup link (optional). |
| Makeup | A replacement session record linked to an original absence. Consumed from the student's term makeup allowance. Subject to 24-hour notice rule. | Belongs to: Student, original Attendance record. Has one: Replacement Session, Status (Booked / Attended / No-show / Carry-over), Logged by. |
| Makeup Carry-Over | A record of unused makeup sessions carried forward to the next term. Carry-over value: Fixed whole number only (0, 1, or 2). Percentage-based carry-over is not supported. Maximum is capped at the student's unused makeups at term end. | Belongs to: Student, Term. Has one: Source term, Carry-over amount, Expiry date (if configured), Admin override flag. |
| Concern | A teacher-raised record about a student's academic or behavioural situation. Escalates through L1, L2, L3 levels based on configured thresholds and timers. | Belongs to: Student, User (raised by), Subject. Has one: Escalation level, Resolution status, Parent notified flag. Has many: Updates, Escalation log entries. |
| Concern Escalation Log | A timestamped record of each escalation event on a Concern, including who triggered it, the level, and whether it was manual or automatic. | Belongs to: Concern. Has one: From level, To level, Triggered by (User or system), Timestamp, Reason. |

## 1.6 Feedback & Communications

| **Entity** | **Description** | **Key Relationships** |
|---|---|---|
| Per-Class Feedback | Per-student per-session teacher feedback. Structured selector responses plus free-text notes. AI-generated parent-friendly summary requires teacher approval before delivery. | Belongs to: Student, Session, User (teacher). Has one: Selector responses, Free-text notes, AI Summary, Approval status, Delivery timestamp. |
| Progress Report | A periodic synthesised PDF report covering a student's academic performance across multiple sessions. Generated on configurable cadence (default: every 3 weeks). Requires teacher or HOD approval before sending. | Belongs to: Student, Course. References: Attendance records, Feedback entries, Assignment grades, Target grade. Has one: AI Narrative draft, Approval status, PDF export, Delivery timestamp. |
| Announcement | A pre-session or post-session communication sent to a class group by a teacher or Admin. Passes through the approval gateway before delivery to parents. | Belongs to: Session or Class Group, User (sender). Has one: Type (pre/post), Approval status, Delivery log. Linked to: File attachments (optional). |
| Complaint Ticket | A formal complaint record raised by Admin on behalf of a parent. Categorised by taxonomy. Requires dual sign-off for resolution. | Belongs to: Student, Guardian (complainant). Has one: Category, Status, Dual Sign-Off record. Has many: Updates, Communication entries. Linked to: Session (optional). |
| Survey Response | A parent satisfaction survey submission triggered at lifecycle points (post-trial, mid-term, end of term, post-withdrawal). Rating 1–5 plus optional comment. | Belongs to: Guardian, Student (referenced). Has one: Rating, Comment, Trigger point, Timestamp. Linked to: Teacher (referenced, optional). |
| Class Discussion Thread | A persistent text thread for a class group. Used for teacher announcements, homework reminders, and student questions. | Belongs to: Session Group (Course + Recurrence Series). Has many: Posts. Has one: Auto-created flag. |
| Communication Log Entry | A single outbound or inbound communication event recorded on a student or guardian profile. Covers WhatsApp, email, in-app, and phone call notes. | Belongs to: Student or Guardian. Has one: Channel, Direction (sent/received), Content summary, Timestamp, Sent by (User or system). |
| Internal Message | A staff-to-staff message within the platform. Supports deep-link tagging of records (student profile, session, invoice, concern, complaint ticket). | Belongs to: Tenant. Has one: Sender (User), Recipient (User or Staff Group), Timestamp, Read status. Has many: Deep-link tags (linked records). Retained permanently. |
| Notification Record | A log of every system-generated notification sent. Provides a delivery audit trail per notification event. | Belongs to: Tenant, Recipient (User or Guardian). Has one: Trigger event, Module source, Channel (WA/Email/In-app), Delivery status, Timestamp. |

## 1.7 Finance

| **Entity** | **Description** | **Key Relationships** |
|---|---|---|
| Invoice | A financial document per student per subject per term. Contains line items, discounts, VAT, and payment schedule. Syncs to Zoho Books on issue (Phase 2). | Belongs to: Student, Guardian (billing contact), Term. Has many: Line Items, Payments, Instalments. Has one: Status, Billing cadence type, Revenue tag (department/bank account). Has one: Revenue Tag (determines which bank account receives the payment — derived from the student's year group department). |
| Invoice Line Item | A single billable entry on an invoice. Linked to a subject and session count. Rate pulled automatically from the Course catalogue. | Belongs to: Invoice. Has one: Course, Session count, Rate per session, Discount applied, VAT amount, Line total. |
| Payment | A receipt of funds against an invoice. Recorded manually or synced from a payment gateway. | Belongs to: Invoice. Has one: Amount, Method (cash/card/transfer/gateway), Date, Logged by (User). |
| Instalment | A scheduled partial payment on an invoice. Maximum 2 by default. A 3rd can be added by Admin (Admin Head notified post-action). | Belongs to: Invoice. Has one: Amount, Due date, Status (Pending / Paid / Overdue), Added by (User). |
| Credit Balance | Credits are stored as an internal ledger balance on the guardian account. Credits are not a separate invoice type. A printable credit note PDF is available on demand from the guardian profile — generated when requested, not automatically. Credit notes do not carry a separate credit note number series. Sources: trial class conversion credit, session cancellation, manual credit (Admin, logged reason required). | Belongs to: Guardian. Applied to: Invoice. Has one: Balance amount, Source record, Applied to (Invoice, optional), Logged by. |
| Discount | One discount field per invoice line. No stacking. The discount field accepts either a fixed AED amount or a percentage — only one discount applies per line item. Admin Head notified on application. | Belongs to: Invoice. Has one: Type (percentage/fixed), Amount, Applied by (User), Admin Head notification sent flag. |
| Revenue Tag | Attributes an invoice or payment to a specific department and bank account for financial reporting. Derived from the student's year group and department mapping in [[09_Settings-M20_Tenant_Settings|M20]]. | Belongs to: Invoice. Has one: Department, Bank account reference. Read-only after invoice creation. |

## 1.8 Assignments

| **Entity** | **Description** | **Key Relationships** |
|---|---|---|
| Assignment | An academic task in the Assignment Library. Two types: Physical (PDF attachment, manually marked) and Digital (interactive, AI-evaluated). Belongs to a Course and optionally a Topic. | Belongs to: Course. Linked to: Topic (optional). Has many: Questions (digital), Submissions. Has one: Type, Mode (exam/practice), AI generation record (optional). |
| Assignment Submission | A student response to a digital assignment. Evaluated by AI on submission. Grade and feedback stored against the submission. | Belongs to: Assignment, Student. Has one: Grade, AI Feedback, Submission timestamp, Attempt count (practice mode). |

## 1.9 Tasks & Workflow

| **Entity** | **Description** | **Key Relationships** |
|---|---|---|
| Task | A unit of work in [[07_Operations-M16_Task_Management|M16]] Task Management. Can be student-linked or standalone. Supports recurring patterns, file attachments, and threaded discussion. Status values include: Completed (valid status — auto-generated tasks and manual tasks both move to Completed when resolved). Auto-generated tasks (created by [[07_Operations-M13_Automation_Communications|M13]] automation engine or [[01_Foundation-PL02_RBAC|PL-02]] approval gateway) cannot be deleted. When resolved, they move to Completed status permanently. Additional recurrence fields: Recurrence (Boolean — is this a recurring task?), Recurrence pattern (Daily / Weekly (day of week) / Fortnightly / Monthly (date or day-of-month) / Custom (every N days/weeks/months)), Recurrence end condition (No end / After N instances / By date), Instance number (Integer — which recurrence instance this is), Parent task ID (Links to the original task that created this recurrence series). | Belongs to: Tenant. Has one: Creator (User), Assignee (User or Staff Group), Status (Open / In Progress / Completed / Cancelled), Priority. Has many: Comments, Attachments, Recurrence instances. Linked to: Student, Lead, Complaint Ticket (optional). |
| Task Thread | A named typed discussion thread attached to a task or record. Types: Complaint, Scheduling, Academic Concern, Feedback, Financial, General, Meeting. | Belongs to: Task or linked record. Has many: Thread replies. Has one: Thread type, Created by, Linked record (optional). |
| Approval Gateway Request | A pending approval action submitted by a staff member requiring sign-off from an eligible role. Logged permanently regardless of outcome. | Belongs to: Tenant. Has one: Action type, Requester (User), Designated approver (User), Status (Pending / Approved / Rejected / Re-routed), Timestamp, Reason. Has one: Re-route record (optional). |
| Gateway Log | Records every approval gateway event. Immutable history of all gateway actions. Fields: ID, Request type, Requestor (staff), Stage 1 approver, Stage 1 decision, Stage 1 timestamp, Stage 2 approver, Stage 2 decision, Stage 2 timestamp, Stage 3 approver (if applicable), Stage 3 decision, Stage 3 timestamp, Reason (if rejected), Linked record (student/invoice/staff), Created on. | Belongs to: Approval Gateway. Links to one record (student, invoice, or staff profile). |

## 1.10 Inventory

| **Entity** | **Description** | **Key Relationships** |
|---|---|---|
| Inventory Item | A physical supply tracked in [[M15 — Inventory|M15]]. Linked optionally to a Course or Event for auto-deduction on enrolment. | Belongs to: Tenant, Branch. Has many: Stock adjustment records. Has one: Reorder threshold, Current stock level. Linked to: Supplier, Course or Event (optional). |
| Supplier | A vendor in the Supplier Directory with contact details and purchase links. | Belongs to: Tenant. Has many: Inventory Items. |
| Stock Adjustment | A record of any change to an inventory item's stock level (receipt, deduction, manual adjustment, auto-deduction on enrolment). | Belongs to: Inventory Item. Has one: Adjustment type, Amount, Timestamp, Logged by (User or system). |

## 1.11 People & Forms

| **Entity** | **Description** | **Key Relationships** |
|---|---|---|
| Segment | A dynamic or saved contact group built from filter criteria in [[05_People-M12_People_Forms|M12]]. Resolution: Lazy. Segment membership is not evaluated at record creation time. Membership is resolved when a segment is referenced by an automation rule or report. Cache duration: 15 minutes. After 15 minutes, the segment re-evaluates on next reference. | Belongs to: Tenant. Has many: Filter rules, Contacts (dynamic resolution). Used by: [[07_Operations-M13_Automation_Communications|M13]] communications, Automation engine. |
| Form | A configurable data collection form built in [[05_People-M12_People_Forms|M12]]. Can be shared as a link, embedded in a WhatsApp message, or linked to a student record. Auto-create rule creates a Lead record (not a Student record directly) on submission. | Belongs to: Tenant. Has many: Fields, Submissions. Has one: Source tag, Auto-create record rule. |
| Form Submission | A completed form response. Can auto-create a Lead record only on submission — Student records are never created directly from a form submission (students are created via Lead conversion in [[03_Student-M04_Enrolment_Lifecycle|M04]]). | Belongs to: Form. Has one: Submitter (Guardian or anonymous), Timestamp, Auto-created record link (optional). |
| School | An entry in the Organisation-level school directory. Approximately 130 UAE schools pre-loaded. Used on student profiles to enable exam event cross-notifications. | Belongs to: Organisation. Has one: Name, Curriculum type, Location. Used by: Student profile, Exam Event targeting. |
| Profile Update Link | A time-limited tokenised URL allowing a guardian to update their own contact details without logging in. Fields: ID, Guardian (linked), Token (UUID v4, single-use — invalidated immediately on first submission), Generated by (Admin), Generated at (timestamp), Expires at (timestamp, default 72 hours from generation), Status (Active / Used / Expired / Invalidated), Submission timestamp (when guardian submitted updates), IP address of submission. Fields exposed to guardian: phone number, email, WhatsApp number, preferred communication channel, home area/district only — no financial, academic, or identity fields. Admin can manually invalidate an active link before use. Full security specification: see [[01_Foundation-PL04_Security_Access|PL-04]] Section 12. | Belongs to: Guardian profile. |

## 1.12 Tenant Settings

| **Entity** | **Description** | **Key Relationships** |
|---|---|---|
| Tenant Settings | The aggregate configuration record for a tenant. Managed in [[09_Settings-M20_Tenant_Settings|M20]] by Super Admin and Org Owner. Covers 9 sections: Org/Branch, Branding, Billing, Academic, Roles, Integrations, Toggles, Terminology, Notifications. | Belongs to: Organisation. Has one per Branch (branch-level overrides). References all module configurations. |
| Feature Toggle | A per-tenant on/off switch for a platform feature. Stored as a named boolean on the Tenant Settings record. | Belongs to: Tenant Settings. Has one: Toggle name, State (On/Off/Later), Last changed by, Last changed timestamp. |
| Notification Template | A configurable message template for system-generated notifications. Has a channel (WhatsApp/Email/In-app), trigger event, and merge field mapping. | Belongs to: Tenant. Has one: Channel, Trigger event, Template body, Merge fields, Approval status (for org-wide templates). |
| Automation Rule | A trigger-action automation built in [[07_Operations-M13_Automation_Communications|M13]]. Fires when a trigger event occurs and executes one or more actions across modules. | Belongs to: Tenant. Has one: Trigger event, Conditions, Action list, Status (Active/Paused), Created by. |

---

# 2. Key Relationship Summary

The following relationships are the most architecturally significant. Every module query will traverse these paths.

| **Relationship** | **Description** |
|---|---|
| Tenant → all entities | Every entity query is scoped by tenant_id. No cross-tenant data access is possible at the query layer. |
| Lead → Student (1:1 on conversion) | When a lead reaches Won status, a Student record is created. The Lead record is retained permanently and linked to the Student via lead_id. |
| Guardian → Students (1:many) | One guardian can be linked to multiple students (siblings). Guardian records persist independently of student lifecycle. |
| Student → Enrolments (1:many) | Each Enrolment links a Student to a Course and Term. This is the central join record for sessions, invoicing, and attendance. |
| Course → Sessions (1:many via Term) | Sessions are generated from a Course + Term + Recurrence Series combination. Each Session belongs to one Course. |
| Session → Attendance (1:many) | One Attendance record per enrolled Student per Session. Deduction triggered at attendance confirmation. |
| Session → Feedback (1:many) | One Per-Class Feedback record per enrolled Student per Session. AI summary generated on completion. |
| Guardian → Invoices (1:many) | Invoices are raised against the guardian (billing contact), not the student directly. One invoice per student per subject per term. |
| Course → Pricing (1:1) | Each Course holds its own per-session rate and standard session unit. The Invoice builder pulls rates directly from the Course record. |
| Student → Concerns (1:many) | Concern records belong to the Student. Multiple concerns can be open simultaneously across different subjects. |
| User → Staff Profile (1:1) | Every User has exactly one Staff Profile. The Staff Profile extends the User with employment, document, CPD, and performance data. |
| Guardian → Co-Parent (1:1 optional, bidirectional) | Co-parent linking is bidirectional. Both guardians must confirm for status to be Confirmed. One-sided link = Pending. |
| Course → Topics → Assignments (hierarchical) | The Course > Topic > Subtopic tree drives both the Progress Tracker ([[04_Academic-M19_Progress_Tracking|M19]]) and the Assignment Library ([[04_Academic-M14_Assignment_Library|M14]]). |
| Task → linked record (optional) | A Task can be linked to a Student, Lead, Complaint Ticket, or any other record. The link is nullable — standalone tasks have no linked record. |
| Approval Gateway Request → Handover Document | During planned leave, a Handover Document pre-routes incoming gateway requests to a designated cover approver. The gateway request records both the original and the effective approver. |

---

# 3. Multi-Tenancy Isolation

All entity tables include a tenant_id foreign key as a mandatory non-nullable field. This is enforced at the ORM/query layer, not just the application layer.

| **Rule** | **Detail** |
|---|---|
| Mandatory filter | Every SELECT, INSERT, UPDATE, and DELETE operation must include a tenant_id filter. |
| Cross-tenant queries blocked | No join across tenant boundaries is permitted. Cross-tenant queries are blocked at the query layer. |
| Above-tenant entities | Organisation and Branch records exist above tenant scope and are the only entities accessible without a tenant_id filter. |
| Platform admin bypass | The Enrolla Platform Admin Panel bypasses tenant scope for support purposes only. All such access is controlled via the separate platform admin authentication layer (see [[01_Foundation-PL05_Platform_Admin|PL-05]]). |
| Soft-deleted records | Archived records (leads with terminal statuses, withdrawn students, archived staff) retain their tenant_id and remain queryable within tenant scope. |
