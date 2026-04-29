# Enrolla — Product Documentation

**Enrolla** is an Education Management Platform built for IMI (Improve ME Institute). It is a full admin dashboard covering the entire student lifecycle — from lead capture to enrolment, attendance, academic progress, finance, and staff management.

---

## Table of Contents

1. [Roles & Permissions](#1-roles--permissions)
2. [Dashboard](#2-dashboard)
3. [Leads & Pipeline](#3-leads--pipeline)
4. [Assessments](#4-assessments)
5. [Students](#5-students)
6. [Guardians](#6-guardians)
7. [Enrolment](#7-enrolment)
8. [Timetable & Sessions](#8-timetable--sessions)
9. [Attendance](#9-attendance)
10. [Academic & Progress](#10-academic--progress)
11. [Finance](#11-finance)
12. [Tasks](#12-tasks)
13. [Automations](#13-automations)
14. [Communications](#14-communications)
15. [Inventory](#15-inventory)
16. [People, Segments & Broadcasts](#16-people-segments--broadcasts)
17. [Staff Management](#17-staff-management)
18. [Analytics & Reports](#18-analytics--reports)
19. [Settings](#19-settings)
20. [Key Business Logic Rules](#20-key-business-logic-rules)

---

## 1. Roles & Permissions

Enrolla has **8 roles**, each with a specific scope of access. Permissions are granular — over 80 individual actions are controlled independently.

| Role | Summary |
|---|---|
| **Super Admin** | Full system access. Only role that can delete/archive records, manage billing, and assign staff roles |
| **Admin Head** | Full operational access. Can approve refunds, set DNC on guardians, create org-wide segments |
| **Admin** | Day-to-day operations. Can create/edit invoices, advance lead pipeline, manage inventory |
| **Academic Head** | Academic oversight. Can approve reports, manage feedback selectors, create org-wide segments |
| **HOD** (Head of Department) | Scoped to one department. Can manage topics/grades, approve reports |
| **Teacher** | Can mark attendance, enter grades, submit feedback, create personal tasks |
| **TA** (Teaching Assistant) | Limited to booking makeup sessions, marking attendance, submitting feedback |
| **HR/Finance** | Financial and staff operations. Can view salary data, verify CPD, approve refunds |

**Sidebar navigation** is automatically filtered by role — staff only see modules they have access to. Permission checks also gate individual buttons, actions, and form fields throughout the app.

---

## 2. Dashboard

Every role lands on a **personalized dashboard** showing only the KPIs and sections relevant to their work.

### Super Admin / Admin Head
KPIs: Active Students, New Enrolments, Re-enrolments, Churn, Revenue, Collected, Overdue, Unbilled Sessions, At-Risk Students, Open Concerns, Occupancy Rate. Sections include activity reports, churn thresholds, and charts. Layout is **drag-reorderable**.

### Admin
Simplified view: activity overview and churn summary.

### Academic Head
Academic alerts, churn by department, attendance threshold breaches, occupancy summary.

### HOD
Department-scoped KPIs: Active Students (dept), Sessions This Week, Attendance Rate, Open Concerns. Shows upcoming sessions, workload alerts, and pending approvals.

### Teacher
Personal KPIs: My Students, My Sessions This Week, My Attendance Rate. Shows their own upcoming sessions and task list.

### TA
Assigned sessions this week and their attendance rate.

### HR/Finance
Revenue, Collected, Overdue, Unbilled Sessions, Active Staff, CPD Completion rate.

---

## 3. Leads & Pipeline

The leads module is a **15-stage sales pipeline** tracking prospective students from first contact to enrolment.

### Pipeline Stages (in order)
New → Contacted → Assessment Booked → Assessment Done → Trial Booked → Trial Done → Schedule Offered → Schedule Confirmed → Invoice Sent → **Won** or **Lost**

### Lead Record
Each lead holds: child name, year group, department, subjects of interest, guardian name/phone/email, source (Website, Phone, Walk-in, Referral, Event), assigned staff member, days in pipeline, preferred days/time, DNC flag, sibling flag, lost reason, notes, and re-engagement flag.

### Lead Detail View
Opening a lead opens a **two-column detail panel**. The left column shows all lead fields, the journey/conversion tracker, and stage action buttons. The right column combines the **Activity Timeline** (all pipeline stage changes and logged interactions) and the **Team Chat** (internal staff-only messaging) in a single unified scrollable panel. The divider between the two columns is **resizable** — staff can drag it to adjust the split.

### Lead Actions
- **Create / Edit** — Admin+
- **Delete** — Admin+
- **Advance stage** — Admin+ (some stages require Academic Head+ to skip)
- **Assign to staff** — Admin Head+
- **Set DNC (Do Not Contact)** — Admin Head only
- **Convert to Student** — after reaching "Won" stage (see [Enrolment Journey](#enrolment-journey))
- **Log activity** — any staff can log interactions (calls, messages, notes)

---

## 4. Assessments

Assessments are used to evaluate a student's academic level before or during enrolment.

**Types:** Lead Assessment (pre-enrolment) | Student Assessment (ongoing)

**Statuses:** Booked → Link Sent → Awaiting Booking → Completed

### Booking an Assessment
When booked for a lead: date, time, room, assessor, subject(s), and year group are recorded. A trial fee invoice is automatically generated at the point of booking:
- Primary: 250 AED + 5% VAT
- Lower Secondary: 300 AED + 5% VAT
- Senior: 350 AED + 5% VAT

### Assessment Outcome
Once completed, staff log: recommendation (Recommended / Not Recommended / Pending), observed level, target grade, and outcome notes. The lead stage advances to "Assessment Done."

Assessments can be cancelled by Admin+.

---

## 5. Students

### Student Statuses
Active | Withdrawn | Graduated | Alumni | Archived

### Student Record
- Auto-generated ID (e.g., IMI-0099)
- Name, DOB, Year Group, Department, School
- Linked guardian(s)
- Active enrolments with session counts
- Financial balance and invoice status
- Attendance summary
- Academic progress snapshot
- Any linked concerns or alerts

### Student Actions
| Action | Permission |
|---|---|
| Create (manually) | Admin+ |
| Edit basic info | Admin+ |
| Edit Year Group | Admin Head+ |
| View financial history | HR/Finance+ |
| Merge duplicates | Admin Head+ |
| Bulk update | Admin+ |
| Export | HOD+ |
| Archive | Super Admin |
| Delete | Super Admin |

Students can also be created automatically by converting a Won lead.

---

## 6. Guardians

Guardians are the parents or carers linked to students.

### Guardian Record
Name, email, phone, communication preference (WhatsApp, Email, Both, None), linked students, status (Active/Inactive), department scope, and created date.

### Guardian Actions
| Action | Permission |
|---|---|
| Create | Admin Head+ |
| Edit contact info | Admin Head+ |
| Set DNC (Do Not Contact) | Admin Head only |
| Link/unlink students | Admin Head+ |
| Export contact list | Admin Head+ |

---

## 7. Enrolment

Enrolments link a student to a subject, teacher, package, and set of sessions for a given term.

### Enrolment Statuses
Active | Pending | Expiring | Expired | Withdrawn

### Enrolment Record
Student, subject, teacher, department, sessions total/remaining, frequency (per week), package/pricing tier, invoice status, and enrolment date.

### Pricing Structure

**Trial Fees (+ 5% VAT)**
| Department | Fee |
|---|---|
| Primary | 250 AED |
| Lower Secondary | 300 AED |
| Senior | 350 AED |

**Session Rates by Frequency (+ 5% VAT)**
| Department | 1x/week | 2x/week | 3+x/week |
|---|---|---|---|
| Primary | 160 AED | 140 AED | 130 AED |
| Lower Secondary | 200 AED | 180 AED | 160 AED |
| Senior | 230 AED | 210 AED | 190 AED |

**Intake Fees (one-time, per student)**
| Year Group | Fee |
|---|---|
| KG | 150 AED |
| Y1–Y6 | 160 AED |
| Y7–Y9 | 170 AED |
| Y10+ | 190 AED |

**Other**
- Enrolment fee: 300 AED (flat, one-time per student)
- Minimum sessions per subject: 10 per term
- Standard term length: 12 weeks
- VAT: 5% on all billable items

### Enrolment Actions
- Pause — Admin+
- Withdraw with reason — Admin+
- Transfer sibling (links two students from same guardian) — Admin Head only

### Trials
Optional step between assessment and full enrolment. Trial statuses: Booked → Completed / Skipped.

Outcome options: Pending | Recommended | Parent to Decide | Not Recommended | Converted | No Show | Needs More Time | Not Interested | Cancelled

A trial fee invoice is generated at booking. Can be paid separately.

### Withdrawals
When a student withdraws, a record is created capturing: reason, date, sessions remaining, and invoice impact. Status: Active / Resolved.

---

## 8. Timetable & Sessions

### Session Types
Regular | Trial | Makeup | Assessment | Meeting | Blocked | Cover Required

### Session Statuses
Scheduled | Completed | Cancelled

### Session Record
Day, date, time (start/end), duration, subject, department, teacher, room, enrolled students (with IDs), assigned TAs (optional), type, and status.

### Timetable Views
- **Day View** — Hourly grid (8am–11pm). Working hours (3pm–8pm default) are shaded. Supports zoom levels (S/M/L/XL).
- **Week View** — 7-day column grid.
- **Month View** — Calendar overview.
- **List View** — Sortable/filterable table.

### Session Actions
| Action | Permission |
|---|---|
| Create session | Academic Head+ |
| Edit session | Academic Head+ or assigned Teacher |
| Cancel session | HOD+ |
| Assign teacher | Admin+ |
| Assign TA | Academic Head+ |
| Copy/duplicate | Academic Head+ |

### Calendar Integration
Public holidays and academic calendar periods (Term, Half-term, Holiday, Closure) are configured in Settings and block unavailable time slots on the timetable.

---

## 9. Attendance

### Attendance Statuses
Unmarked | Present | Late | Absent (Notified) | Absent (No Notice)

### Marking Attendance
Teachers have approximately 24 hours after a session ends to mark attendance. This window is configurable by Admin Head+. Corrections can be unlocked by Admin+.

### Absence Rules
- Each absence reduces the student's makeup allowance for the term.
- **3 or more consecutive absences** trigger an alert.
- Alert levels: Normal | Monitor | Consecutive Alert | Allowance Exhausted

### Makeup Sessions
When a student is absent, a makeup session can be requested and booked.

**Makeup Statuses:** Pending | Confirmed | Completed | Expired

| Action | Permission |
|---|---|
| Request makeup | Teacher+ |
| Authorize/confirm makeup | Admin+ |
| Override makeup status | HOD+ |
| Mark makeup complete | Teacher+ |

### Attendance Views
- **Register** — Mark attendance per session live.
- **Unmarked Sessions** — Sessions past the marking deadline.
- **Absence Summary** — Students sorted by absence count, consecutive absences, and remaining makeup allowance.
- **Makeup Sessions** — All pending/confirmed/expired makeup bookings.

---

## 10. Academic & Progress

### Assignments & Grades

Assignment types: Test | Homework | Classwork | Past Paper

Assignment statuses: Upcoming | Pending | Complete | Partial | Overdue

Teachers enter grades per student per assessment. Each student has a tracked **target grade** set by their Teacher or HOD.

| Action | Permission |
|---|---|
| Enter grades | Teacher+ |
| Set target grade | Teacher+ |
| Approve report card | HOD+ |
| Generate report | HOD+ |

### Feedback System

Feedback is structured progress commentary sent to guardians.

**Feedback Statuses:** Draft → Pending Approval → Approved / Rejected → Sent

Feedback items include: student, subject, teacher, session date, a numeric score, configurable selectors (based on subject settings), teacher notes, and an optional AI-generated summary.

| Action | Permission |
|---|---|
| Submit feedback | Teacher+ |
| Approve feedback | HOD+ |
| Send to guardian | HOD+ |
| Configure selectors | HOD+ |

### Concerns

Concerns are raised when a student's behaviour, academic performance, or wellbeing needs attention.

**Concern Types:** Behaviour | Academic | Wellbeing | Safeguarding | Other

**Severity:** Low | Medium | High | Critical

Concerns link to the student record. HOD can dismiss Level 1 and Level 2 concerns. Critical concerns escalate to Academic Head.

---

## 11. Finance

### Invoices

**Invoice Statuses:** Draft → Issued → Partially Paid | Paid | Overdue | Cancelled

An invoice contains:
- Invoice number (format configurable during onboarding)
- Line items (subject, term, session count, rate, subtotal) + enrolment fee
- Subtotal, discount, post-discount subtotal, VAT, total due
- Amount paid, remaining balance
- Due date
- Optional notes and revenue tag (GL code)
- Optional payment plan (2 installments with separate due dates)

| Action | Permission |
|---|---|
| Create invoice | Admin Head+ |
| Edit (draft only) | Admin Head+ |
| Void invoice | Admin Head+ |
| View payment history | HR/Finance+ |
| Download/send PDF | Admin Head+ |

### Payments

Payment record: date, student, invoice, amount, method (Cash / Card / Bank Transfer / Online / Cheque), reference, and recorded-by staff.

Partial payments are supported. Invoice status updates automatically.

| Action | Permission |
|---|---|
| Log payment | HR/Finance+ |
| Apply discount | Admin+ (approval flow at higher amounts) |
| Issue credit/refund | Admin+ |

### Credits

**Credit types:** Manual | Overpayment | Refund | Promotional

**Credit status:** Unused | Applied

Credits can be applied to future invoices. Refund approvals follow a three-level flow:
1. Request — Admin+
2. Approve — Admin Head+
3. Final approval — Super Admin only

### Unbilled Sessions

The system tracks sessions that have occurred but haven't yet been invoiced. Each entry shows student, subject, session date, department, year group, and session count. Admin+ can bulk-generate invoices from this view.

---

## 12. Tasks

Tasks are actionable to-do items that can be assigned to one or more staff members.

**Task Types:** Admin | Academic | Finance | HR | Student Follow-up | Cover | Personal

**Priorities:** Urgent | High | Medium | Low

**Statuses:** Open | In Progress | Blocked | Done

### Task Record
Title, description, type, priority, status, assignee(s), due date, subtasks (checklist), optional linked record (Student, Lead, Invoice, Session), overdue flag, created date.

### Task Views
- **List View** — Sortable, filterable table.
- **Board View** — Kanban-style by status.
- **Calendar View** — Due-date focused.
- **My Tasks** — Filtered to the current user's assignments.

### Task Actions
| Action | Permission |
|---|---|
| Create task | All staff |
| Edit own task | All staff |
| Edit others' tasks | Teacher+ |
| Delete own task | All staff |
| Delete others' tasks | Teacher+ |
| Reassign | All staff |
| Mark complete | Assignee |

---

## 13. Automations

Automations allow the system to automatically send messages, create tasks, or post announcements based on rules and triggers.

### Templates
Templates are reusable message/email/task bodies with merge fields.

**Template types:** Message | Email | Task | Announcement

**Ownership:** Personal (individual staff) or Org-Wide (Admin Head+, shared across the org)

**Statuses:** Active | Draft | Archived

**Available merge fields:** `[child_name]`, `[parent_name]`, `[subject]`, `[session_date]`, `[session_time]`, `[teacher_name]`, `[amount]`, `[due_date]`, `[tenant_name]`

### Automation Rules
Rules define when and what to automate.

**Trigger types:**
- **Status Change** — e.g., when a Lead stage changes to "Won"
- **Time-based (Absolute)** — e.g., on the 15th of each month
- **Time-based (Relative)** — e.g., 2 days before a session
- **Threshold** — e.g., when absence count reaches 3
- **Form Submission** — when a web form is submitted
- **Manual** — staff-triggered on demand

**Rule statuses:** Enabled | Disabled | Locked

Each rule tracks: last fired date, total fire count, runs this month.

### Dispatch Queue
Messages waiting to be sent appear in the dispatch queue.

**Statuses:** Unclaimed | Claimed | Sent

Staff can manually claim and send dispatched items. Each item shows the populated (merge-field resolved) message body and its source rule.

### Marketing
- **Marketing Moments** — Time-based campaigns (e.g., "Email parents about upcoming term dates").
- **Marketing Campaigns** — Batch sends a template to an audience segment. Tracks sent/delivered/failed counts.

### Execution Log
Every rule execution is logged with: trigger type, timestamps, recipient count, routing channel, and per-action success/failure/skipped status.

---

## 14. Communications

### Announcements
Announcements are broadcast messages sent to guardians or students.

**Types:** Pre-session | Post-session

**Statuses:** Draft → Pending Approval → Sent

Audience is segment-based. Requires approval before sending.

### Complaint & Feedback Tickets

**Categories:** Academic | Finance | Behaviour | Other

**Severity:** High | Medium | Low

**Statuses:** New → Investigating → Resolved | Escalated | Closed

Tickets are raised by students or guardians and assigned to staff. They include a description, creation date, linked tasks, and a two-level sign-off (e.g., Teacher + HOD). An escalation log tracks all status changes with timestamps.

### Surveys

**Survey types:** Mid-term | End of term | Post-trial | Post-withdrawal | Manual

Surveys are sent to guardians or students and capture a score and optional comment. Responses are categorized as Promoter / Passive / Detractor. Some survey types are auto-scheduled to send after trigger events (e.g., after a trial).

### Class Groups
Teachers can create class groups per subject for discussion and announcements. Post types: Announcement | Discussion | Question. Posts are visible to enrolled students. Moderators can remove posts.

---

## 15. Inventory

Inventory tracks physical stock used by the institute (stationery, electronics, etc.).

### Item Record
Name, category, unit of measure, current/min/max stock, reorder quantity, health status (Healthy / Approaching Min / Below Min), auto-deduct setting, department scope, supplier, optional Amazon link, notes, and responsible staff member.

### Auto-Deduct Rules
Items can be configured to automatically deduct stock when a new student enrols in a specific department or year group. Failed deductions are logged but do not block the enrolment.

### Stock Ledger
Every stock change is logged with: change type (Auto-Deduct, Manual Add, Reorder Received, Manual Deduct, Waste, Stock-Take Correction, Auto-Deduct Failed), quantity delta, actor, timestamp, reference, and stock before/after.

### Reorder Alerts
Automatically triggered when stock falls at or below the minimum level.

**Statuses:** Open | Ordered | Ignored

Alerts pre-populate supplier contact details. Staff can place an order directly or contact the supplier. Alerts auto-clear when stock rises above the minimum.

### Stock Take
A full inventory count cycle that records variances and logs corrections in the ledger.

### Inventory Actions
| Action | Permission |
|---|---|
| Add/edit items | Admin+ |
| Adjust stock manually | Admin+ |
| Mark reorder as received | Admin+ |
| Delete items | HR/Finance+ |
| Ignore/resolve alerts | Admin+ |

---

## 16. People, Segments & Broadcasts

The People module provides audience management tools for targeting communications.

### Segments

A segment is a saved group of people defined by filters.

**Types:** Personal (private to one staff member) | Org-Wide (Admin Head+, shared)

**Record types a segment can target:** Students | Guardians | Leads | Staff

Filters can be combined (e.g., "Year Group = Y9 AND Attendance Rate < 90%"). Segments are dynamic — member counts update automatically.

| Action | Permission |
|---|---|
| Create segment | Academic Head+ |
| Edit filters | Owner or Admin Head+ |
| Delete | Owner or Admin Head+ |
| Use in broadcasts/automations | Any role with access |
| Export member list | HOD+ |

### Broadcasts
Bulk messages sent to a segment. Uses templates with merge fields.

### Forms
Web forms for lead capture, feedback, or survey collection. Form submissions can trigger automation rules.

### Exports
Bulk data exports from any module. Export history is tracked with format (PDF/Excel/CSV) and generated-by staff.

### Duplicate Detection
The system scans for potential duplicate records across Students, Guardians, Leads, and Staff.

**Match levels:** High | Medium | Low

Each detection shows which fields matched (e.g., Name, Email, Phone) and the detection date.

**Statuses:** Pending | Resolved | Dismissed

Merging two records (to resolve a duplicate) is restricted to Super Admin+.

---

## 17. Staff Management

### Staff Statuses
Active | Invited | On Leave | Inactive | Suspended | Off-boarded

### Staff Record
Name, email, role, department(s), subjects taught, contract type (Full-time / Part-time / Sessional), hire date, line manager, CPD hours completed, CPD target, sessions this week, workload level (Low / Moderate / High — auto-calculated), and leave/emergency leave status.

### Staff Actions
| Action | Permission |
|---|---|
| Invite new staff | HR/Finance |
| Resend invite | HR/Finance |
| Edit profile | HR/Finance |
| Assign role | Super Admin only |
| View salary | HR/Finance+ |
| Revoke access | Super Admin or HR/Finance |
| Activate emergency leave | Admin Head+ |
| Archive | Super Admin |
| Delete | Super Admin |
| Initiate offboarding | HR/Finance |
| Verify CPD hours | HR/Finance |

### CPD (Continuing Professional Development)
CPD hours are tracked against each staff member's annual target. HR/Finance can mark completion as verified. Analytics show the organization-wide CPD completion rate.

---

## 18. Analytics & Reports

### Analytics Dashboard

**Revenue Analytics**
Monthly, weekly, and termly revenue breakdowns. Drill down by department, by subject (pie chart), or by teacher (with expected vs. actual variance). Includes a heatmap of revenue by time slot and room.

**Occupancy Analytics**
Room-by-room utilization: session count, average occupancy %, peak occupancy %, and health status (over/under-capacity flags). Day/time heatmap showing busiest slots.

**Churn Analytics**
At-risk student list with a churn score and level (Critical / High / Medium / Low). Shows top churn signals (absences, payment defaults, poor feedback), trend direction (Rising / Stable / Falling), days since last contact, and a retention confidence score.

**Staff Analytics**
Workload distribution by staff (sessions/week), CPD completion rates, feedback scores, contract type breakdown, and headcount by department.

### Reports

**Report types:** Revenue Summary | Payment Reconciliation | Attendance Summary | Churn Report | Academic Alerts | Staff Report

**Formats:** PDF | Excel | CSV

| Action | Permission |
|---|---|
| Generate on-demand | Admin Head+ |
| Schedule recurring | Academic Head+ |
| Download/share | Admin Head+ |
| Archive old reports | Admin Head+ |

Report generation status is tracked: Queued → Running → Complete | Failed.

---

## 19. Settings

Settings are accessible to **Super Admin only**.

| Section | What it controls |
|---|---|
| **Organisation** | Name, logo, contact info, account status |
| **Academic Years** | Create/edit academic years, set active year |
| **Departments** | Name, color, year group range, sort order, active status |
| **Calendar Periods** | Terms, half-terms, holidays, closure dates with labels and colors |
| **Public Holidays** | Dates that block session creation |
| **Rooms** | Name, capacity — used when scheduling sessions |
| **Task Groups** | Custom categories for task organization |
| **Subjects Catalogue** | Grade levels, departments, subjects, topics, grade scales (e.g., IGCSE A–E), and feedback selectors per subject |
| **Branches** | Multi-location branch names and linked staff/students |
| **Billing & Subscription** | Plan tier, seat usage, features enabled |
| **Roles & Permissions** | Full permission matrix — view only; role assignment done on Staff record |
| **Integrations** | Google Classroom, WhatsApp, Zoom, Stripe, Xero, Microsoft Teams — connection status and sync settings |
| **Numbering Formats** | Student ID and invoice number format (e.g., `{YEAR}-{SEQ}`) |

Subjects Catalogue editing is partially delegated:
- Catalogue structure — Admin Head+
- Topics and grade scales — HOD+
- Feedback selectors — HOD+

---

## 20. Key Business Logic Rules

### Lead Conversion
- A lead can only be converted to a student once it reaches the **Won** stage.
- Conversion automatically creates a Student record and prompts creating an Enrolment.
- The student inherits the year group and guardian info from the lead.
- Conversion can be undone — this reverts the lead to its previous stage and deletes the student record.

### Attendance & Makeups
- Teachers have approximately 24 hours post-session to mark attendance (window configurable by Admin Head+).
- 3+ consecutive absences trigger a concern alert.
- Each absence reduces the student's makeup allowance for the term.
- Makeup sessions must be confirmed before they can be marked as complete.

### Pricing
- Trial fees are locked by department (Primary 250 AED, Lower Secondary 300 AED, Senior 350 AED).
- Session rates decrease with higher weekly frequency (volume discount).
- VAT at 5% applies to all fees.
- The enrolment fee (300 AED) is a one-time charge per student.

### Invoices
- **Draft** invoices can be freely edited.
- **Issued** invoices are locked — they can only be voided (Admin Head+).
- Partial payments are supported; invoice status auto-updates to "Partially Paid."
- Credits can be applied to future invoices or refunded (subject to approval flow).

### Permission Cascading
- Permissions are role-specific, not strictly hierarchical. Some actions are restricted to lower roles (e.g., only HR/Finance can verify CPD, not Super Admin or Admin Head).
- View permissions are generally broader than create/edit/delete permissions.

### Automations
- Status Change triggers fire immediately when the triggering condition is met.
- Time-based Absolute triggers fire on a fixed calendar date/time.
- Time-based Relative triggers fire N days before or after an event date.
- Threshold triggers fire when a numeric value crosses a defined limit.
- All rule executions are logged (success/failure/skipped per action per recipient).

### Staff Workload
- Workload level (Low / Moderate / High) is auto-calculated from sessions per week.
- Staff on emergency leave are removed from scheduling.
- Salary data is visible only to HR/Finance — not to other roles, including Super Admin.

### Inventory
- Auto-deduct rules fire on enrolment creation if the item is configured for the relevant department/year group.
- A failed deduction is logged but does not block the enrolment from completing.
- Reorder alerts auto-clear when stock rises above the minimum threshold.

---

*This document is automatically updated before every commit to reflect the current state of the app.*
