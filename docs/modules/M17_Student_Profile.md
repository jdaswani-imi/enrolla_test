---
module: "M17"
title: "Student Profile"
layer: "Student Lifecycle"
folder: "03_Student"
status: "Draft"
phase: "v1"
dependencies: [M02, M04, M06, M08, M19]
tags: [enrolla, prd, student, profile]
---

# ENROLLA
# [[03_Student-M17_Student_Profile|M17]] — Student Profile View
v1.0 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

[[03_Student-M17_Student_Profile|M17]] is the Student Profile View — the central operational page for any individual student in Enrolla. It aggregates data from every module into a single, structured, role-aware interface. [[03_Student-M17_Student_Profile|M17]] is a presentation layer only; it does not own any data. Every field displayed in [[03_Student-M17_Student_Profile|M17]] has a source module and is subject to the RBAC permissions of that module. Users with edit rights on a field can edit it inline directly within [[03_Student-M17_Student_Profile|M17]]; users without edit rights see the field as read-only.

| **Property** | **Value** |
|---|---|
| Module code | [[03_Student-M17_Student_Profile|M17]] |
| Version | v1.1 |
| Status | Current |
| Primary roles | Super Admin, Admin Head, Admin |
| Secondary roles | Academic Head, HOD, Teacher, TA |
| Data ownership | None — presentation layer only. All data owned by source modules. |
| Data sources | [[03_Student-M01_Lead_Management|M01]], [[03_Student-M02_Student_Guardian_CRM|M02]], [[03_Student-M03_Assessment_Placement|M03]], [[03_Student-M04_Enrolment_Lifecycle|M04]], [[04_Academic-M05_Timetabling_Scheduling|M05]], [[04_Academic-M06_Attendance_Makeups|M06]], [[04_Academic-M07_Feedback_Communications|M07]], [[06_Finance-M08_Finance_Billing|M08]], [[05_People-M09_Staff_Performance|M09]], [[04_Academic-M11_Academic_Courses|M11]], [[07_Operations-M13_Automation_Communications|M13]], [[04_Academic-M14_Assignment_Library|M14]], [[07_Operations-M16_Task_Management|M16]], [[04_Academic-M19_Progress_Tracking|M19]] |
| Inline editing | Available on all fields where the viewing user holds edit rights in the source module |
| Dependencies | All modules |
| Phase | v1 |

---

# 01.1 Layout Structure

The Student Profile View is composed of three persistent zones that remain in position regardless of scroll state.

| **Zone** | **Description** |
|---|---|
| Profile Header | Full-width band pinned to the top of the page. Always visible. Contains student identity, lifecycle status, and the Quick Action row. |
| Left Sidebar | Fixed-width panel on the left. Contains at-a-glance statistics, active flags, personal details, academic context, family links, referral data, and batch memberships. Scrolls independently of the main panel. |
| Main Panel | Tabbed content area occupying the remaining page width. Eleven tabs cover all operational domains. Tab content scrolls within the panel. |
| Gateway Log tab | Admin Head and Super Admin only. Shows all approval gateway events involving this student — refund requests, third instalment additions, outstanding balance acknowledgements, etc. Each entry shows: event type, requestor, approver at each stage, decision, timestamp. |

---

# 01.2 Profile Header

The Profile Header is a full-width band that remains visible at all times. It establishes student identity at a glance and provides one-tap access to the most common cross-module actions.

## 01.2.1 Identity Elements

| **Element** | **Detail** |
|---|---|
| Student photo | Uploaded photo displayed as a circular thumbnail. Falls back to initials avatar if no photo is uploaded. |
| Full legal name | Displayed large and prominently. Pulls from [[03_Student-M02_Student_Guardian_CRM|M02]]. Editable inline by Admin and above. |
| Year group badge | Pill badge displaying the year group label (e.g. Year 11). Dual-named where applicable (e.g. Year 11 / G11). |
| Department badge | Pill badge displaying the department (Primary, Lower Secondary, Senior). Auto-assigned from year group; Admin+ can override. |
| School name | Displays the school from the structured [[03_Student-M02_Student_Guardian_CRM|M02]] dropdown. Editable inline by Admin and above. |
| Student ID | System-generated ID displayed beneath the name (e.g. IMI-0001). Read-only. Locked after first student record created. No branch code is ever included in the Student ID. |
| Lifecycle status badge | Colour-coded badge: Active (green), Withdrawn (red), Graduated (blue), Alumni (grey). |

## 01.2.2 Quick Action Row

One-click action buttons sit beneath the student name. Each action pre-populates the target module with this student's context, minimising data re-entry.

Quick Actions are context-sensitive. Available actions depend on the student's current status:

| **Action** | **Condition for availability** |
|---|---|
| Book trial | Student is in Lead or New Enquiry status; no prior trial for this subject |
| Book assessment | Student is in Lead status; no prior assessment for this subject |
| Create invoice | Student is Active with at least one active enrolment |
| Record payment | Student has at least one outstanding invoice |
| Add enrolment | Student is Active or re-enrolling |
| Raise concern | Student is Active with at least one active enrolment |
| Send message | Always available (sends via the configured communication channel) |
| Extend Validity | Student has an enrolment approaching term end with no confirmed re-enrolment |
| Withdraw student | Student is Active (requires confirmation dialog) |
| Log contact note | Always available |
| New task | Always available |

---

# 01.3 Left Sidebar

The Left Sidebar provides persistent at-a-glance context regardless of which main panel tab is active. Data in the sidebar is read-only by default; inline editing opens a slide-out panel from the source module.

| **Section** | **Content** |
|---|---|
| Quick stats | Attendance rate this term, sessions remaining across all active packages, credit balance on account, count of open tasks, count of open tickets |
| Flags | Active concern flags (with level indicator L1/L2/L3), overdue invoice count, upcoming exam banners (Y10–Y13 only, within 30 days), DNC indicator if linked guardian is on Do Not Contact list |
| Personal details | Date of birth, calculated age, gender, nationality, phone, WhatsApp number, email address. Read-only display; links to [[03_Student-M02_Student_Guardian_CRM|M02]] for edit. |
| Academic | Count of enrolled courses, summary of target grades per subject, exam countdown (Y10–Y13 only) |
| Family | Primary guardian name with click-through to [[03_Student-M18_Guardian_Profile|M18]] Guardian Profile, co-parent name (if linked) with click-through, sibling group count and links (if applicable) |
| Referral | Referred by (name and date, if applicable), count of referrals this student has made, current referral milestone tier |
| Batches | Active batch memberships displayed as chip-style tags. Click on any chip opens the batch record in [[04_Academic-M05_Timetabling_Scheduling|M05]]. |

---

# 01.4 Main Panel — Tab Bar

The main panel contains eleven tabs. Tabs display badge indicators when attention is required. Tabs the viewing user cannot access are hidden, not greyed out.

| **Tab** | **Badge Colour** | **Badge Condition** |
|---|---|---|
| Overview | Red | Overdue invoice or escalated concern/ticket present |
| Calendar | None | — |
| Attendance | Amber | Makeup expiring within 7 days |
| Attendance | Red | At or past concern threshold |
| Invoices | Red | Invoice overdue |
| Invoices | Amber | Invoice partially paid |
| Grades | Amber | Overdue assignment |
| Files | None | — |
| Courses | None | — |
| Communication Log | None | — |
| Tickets | Red | Escalated complaint ticket open |
| Tasks | Amber | Overdue task assigned or linked to this student |
| Concerns | Red | Active escalated concern (L2 or above) |

---

# 01.5 Overview Tab

The Overview tab is the default landing view. It surfaces the most operationally relevant information across all domains in a single scrollable view.

## 01.5.1 Flags Strip

A horizontal strip at the top surfaces any active flags that require attention. Each flag displays as a colour-coded pill. Clicking any flag navigates directly to the relevant tab.

| **Flag** | **Behaviour** |
|---|---|
| Overdue invoice | Red pill. Shows count of overdue invoices. Click navigates to Invoices tab. |
| Active concern | Red pill (L2/L3) or Amber pill (L1). Shows concern level. Click navigates to Concerns tab. |
| Open ticket | Red pill. Shows count of open complaint tickets. Click navigates to Tickets tab. |
| Makeup expiring | Amber pill. Shows count of makeups expiring within 7 days. Click navigates to Attendance tab. |
| Overdue assignment | Amber pill. Shows count of overdue assignments. Click navigates to Grades tab. |
| DNC — guardian | Grey pill. Shown if primary guardian is on the Do Not Contact list. No click-through. |

## 01.5.1a Exam Countdown Widget (Y10–Y13 only)

For students in Year 10 through Year 13 with a confirmed exam date entered in [[04_Academic-M11_Academic_Courses|M11]], an Exam Countdown widget appears in the Overview tab. The widget shows: subject name, exam board, exam date (DD/MM/YYYY), days remaining. If a student has multiple subjects with exam dates, each subject has its own countdown. The widget is not shown for students in Y9 or below, or for students with no confirmed exam dates.

## 01.5.2 Churn Risk and Retention Confidence

Two scores from [[08_Management-M10_Management_Dashboard|M10]] are surfaced as side-by-side indicator cards: Churn Risk Score and Retention Confidence Score. Each displays the numeric score, the colour-coded band, and the primary contributing signal. Clicking either card navigates to the full [[08_Management-M10_Management_Dashboard|M10]] churn detail view for this student.

| **Score** | **Display** |
|---|---|
| Churn Risk Score | Red = 70 and above. Amber = 40 to 69. Green = below 40. Shows top contributing signal. |
| Retention Confidence Score | High = 70 and above. Medium = 40 to 69. Low = below 40. Shows top contributing signal. |

## 01.5.3 Enrolment Cards

One card per active subject enrolment. Cards are ordered by department then subject name. Each card uses the dot visualisation from Section 01.8 to show session consumption at a glance.

| **Element** | **Detail** |
|---|---|
| Subject name | Displayed as card title with department and year group context |
| Teacher | Assigned teacher name and photo thumbnail |
| Schedule | Day and time of recurring session(s) |
| Session dot visualisation | Row of dots representing the current package: filled green tick = attended, filled red X = absent, empty circle = scheduled. Makeup row displayed inline below if applicable. |
| Balance | Sessions remaining shown as a count and progress indicator |
| Frequency tier | Current discount tier if applicable (Secondary students) |
| Package status | Active, Expiring (within 7 days), or Expired |

## 01.5.4 Academic Snapshot

One card per enrolled subject displaying a summary of recent academic performance. Pulls from both [[04_Academic-M14_Assignment_Library|M14]] (assignments) and [[04_Academic-M19_Progress_Tracking|M19]] (progress tracker).

| **Element** | **Detail** |
|---|---|
| Recent scores | Two most recent graded assignment scores for this subject |
| Submission status | Count of pending submissions and count of overdue submissions |
| Predicted grade | Predicted grade from [[04_Academic-M19_Progress_Tracking|M19]] progress tracker for this subject, if configured |
| Next submission due | Title and due date of the next upcoming assignment |
| Click-through | Opens the Grades tab filtered to this subject |

## 01.5.5 Upcoming Sessions

The next five sessions across all enrolled subjects listed in chronological order. Each row shows date, time, subject, teacher, and room. Clicking a session opens the Session Detail View in [[04_Academic-M05_Timetabling_Scheduling|M05]].

## 01.5.6 Recent Activity Timeline

A reverse-chronological activity feed showing the last 20 events linked to this student across all modules.

| **Event Type** | **Detail Shown** |
|---|---|
| Invoice issued | Invoice number and amount |
| Payment received | Amount and method |
| Attendance marked | Session date, subject, and status (Present / Absent) |
| Concern raised | Subject and level |
| Task created | Task title and assigned user |
| Assignment submitted | Assignment title and subject |
| Message sent | Channel and recipient |
| Enrolment change | Subject added or removed, effective date |
| Credit applied | Amount and reason |
| Ticket opened | Ticket type and status |

---

# 01.6 Calendar Tab

The Calendar tab displays a student-specific calendar view showing all events relevant to this individual. The default view is the current week. Users can switch between Week, Day, and Month views. All events are read-only from within [[03_Student-M17_Student_Profile|M17]]; changes are made in [[04_Academic-M05_Timetabling_Scheduling|M05]].

| **Event Type** | **Display Behaviour** |
|---|---|
| Sessions | All scheduled sessions for this student across all enrolled subjects. Colour-coded by subject. Displays subject name, teacher, and room on the session chip. |
| Exams | Exam events from [[04_Academic-M11_Academic_Courses|M11]] relevant to this student's enrolled subjects and year group. Displayed as a distinct chip style. |
| Makeup bookings | Confirmed makeup sessions. Displayed with a makeup indicator to distinguish from regular sessions. |
| School events | Events from the [[03_Student-M04_Enrolment_Lifecycle|M04]] academic calendar relevant to this student's school and year group (e.g. half-terms, GCSE mock weeks). |

---

# 01.7 Attendance Tab

The Attendance tab provides a full attendance history for this student across all enrolled subjects. Data is sourced from [[04_Academic-M06_Attendance_Makeups|M06]]. Attendance records cannot be edited from [[03_Student-M17_Student_Profile|M17]]; edits are made in [[04_Academic-M06_Attendance_Makeups|M06]] via the source session.

| **Section** | **Content** |
|---|---|
| Attendance summary strip | Overall attendance rate this term, overall attendance rate all-time, consecutive absences count, no-show count |
| Per-subject attendance cards | One card per subject showing: attendance rate, sessions attended, sessions absent, makeup allowance remaining, makeups used, makeups pending |
| Attendance history table | Full session-by-session history filterable by subject and date range. Columns: date, subject, status, marked by, notes. |
| Makeup log | All makeups for this student: original session date, makeup date, subject, status (Pending / Confirmed / Completed / Expired) |

---

# 01.8 Session Deduction Visualisation

Session consumption is visualised using a dot row on enrolment cards (Overview tab) and on per-subject cards within the Attendance tab.

| **State** | **Meaning** |
|---|---|
| Filled circle — green tick | Session attended. Deduction applied. |
| Filled circle — red X | Session absent. Deduction applied (subject to makeup eligibility). |
| Empty circle | Session scheduled — not yet attended. |
| Makeup row | Displayed inline below the main session row where makeups have been booked or used. |
| Balance squares | Remaining sessions in the package shown as unfilled squares. |

---

# 01.9 Courses Tab

The Courses tab shows all enrolments for this student — active, withdrawn, and historical. The Overview tab enrolment cards show active enrolments only; the Courses tab includes all historical entries.

| **Section** | **Content** |
|---|---|
| Active enrolments | Displayed at the top with a green Active badge. Fields: subject, year group, teacher, schedule, frequency tier, package start date, sessions purchased, sessions remaining. |
| Withdrawn enrolments | Listed below with a grey Withdrawn badge. Fields: subject, year group, teacher, enrolment dates, reason for withdrawal (if recorded), sessions attended out of sessions purchased. |
| Historical teacher changes | Where a teacher change occurred mid-enrolment, the history is preserved as a log entry within the enrolment card. |
| Mid-term recalculations | Any pricing recalculations (subject added or removed) are logged within the relevant enrolment card with date, old rate, and new rate. |

---

# 01.10 Communication Log Tab

The Communication Log tab shows all messages sent to or received from this student's linked guardians across all channels.

| **Element** | **Detail** |
|---|---|
| Manual messages | Manually composed and sent by a staff member via [[07_Operations-M13_Automation_Communications|M13]]. Labelled Manual with the sender's name. |
| Automation-triggered messages | Messages sent automatically by [[07_Operations-M13_Automation_Communications|M13]] automations. Labelled Automated with the automation name. |
| Channel | WhatsApp, Email, or In-app. Displayed as a channel badge on each entry. |
| Delivery status | Sent, Delivered, Read, or Failed — where channel supports delivery tracking. |
| DNC / unsubscribe indicator | If a message was suppressed due to DNC or unsubscribe status, the suppressed event is logged with the reason. DNC suppression is shown as a hard block indicator. |
| Date range filter | Filter the log by date range, channel, and message source (manual vs automated). |

---

# 01.11 Tickets Tab

The Tickets tab displays all complaint tickets from [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].A]] linked to this student. Tickets are read-only from [[03_Student-M17_Student_Profile|M17]]; all updates and actions occur within [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].A]].

| **Element** | **Detail** |
|---|---|
| Ticket list | Columns: ticket reference, category (Teaching Quality / Administrative / Facilities / Safety & Wellbeing / Other), date raised, status, assigned to. Escalated tickets shown with a red indicator. |
| Status values | Open, Under Review, Resolved, Closed |
| Click-through | Clicking any ticket row opens the full ticket record in [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].A]] |
| Recurring trigger indicator | If this student has 3 or more open tickets in one term, an amber banner displays noting that the auto meeting task threshold has been met. |

---

# 01.12 Tasks Tab

The Tasks tab displays all [[07_Operations-M16_Task_Management|M16]] tasks linked to this student record. Personal tasks are not shown here. Task creation from this tab pre-links to this student.

| **Element** | **Detail** |
|---|---|
| Task list | Columns: task title, type, priority, assignee, due date, status. Overdue tasks highlighted in red. Due within 24 hours highlighted in amber. |
| New Task button | Opens the [[07_Operations-M16_Task_Management|M16]] task creation form pre-linked to this student. Available to all roles with task creation rights. |
| Click-through | Clicking any task row opens the full task record in [[07_Operations-M16_Task_Management|M16]]. |

---

# 01.13 Concerns Tab

The Concerns tab displays all [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern records linked to this student. The concern engine and all escalation actions are managed in [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]]; this tab provides a read-only view and click-through.

| **Element** | **Detail** |
|---|---|
| Active concerns | Displayed at the top with level indicator (L1 / L2 / L3). Fields: subject, trigger type, raised date, current level, assigned to. |
| Dismissed concerns | Listed below with a grey Dismissed label. Shows dismissal reason and the user who dismissed. |
| Trigger type | Total absences, consecutive absences, no-shows, assignment non-submission, low feedback scores, or progress tracker below pass threshold. |
| Click-through | Clicking any concern row opens the full concern record in [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]]. |

---

# 01.14 Inline Editing

[[03_Student-M17_Student_Profile|M17]] supports inline editing across all fields where the viewing user holds edit rights in the source module. Edits made in [[03_Student-M17_Student_Profile|M17]] update the field in the source module directly.

| **Behaviour** | **Detail** |
|---|---|
| Editable indicator | Fields with edit rights show a pencil icon on hover (desktop) or a tap target (mobile). Fields without edit rights display as plain text. |
| Edit interaction | Clicking or tapping an editable field opens an inline edit input for simple fields (text, dropdown, date). Complex fields open a slide-out panel from the source module. |
| Save behaviour | Inline edits save on confirmation (tick button or Enter). The field reverts to display mode after save. The source module audit trail records the edit with the user's name and timestamp. |
| Unsaved changes | If the user navigates to a different tab with an unsaved inline edit open, a discard confirmation prompt displays. |
| Conflict prevention | If another user is currently editing the same record in the source module, the inline edit is blocked and a tooltip explains why. |

---

# 01.15 Role-Based Access

Tab visibility and edit rights in [[03_Student-M17_Student_Profile|M17]] are governed by the RBAC permissions each role holds in the source module. Tabs the viewing user cannot access are hidden from the tab bar.

| **Role** | **Visible Tabs** | **Edit Rights** |
|---|---|---|
| Super Admin | All tabs | All fields — inline edit available everywhere |
| Admin Head | All tabs | Personal details, billing, concerns, tickets, tasks — inline edit. Grades and Progress = view only. |
| Admin | Overview, Calendar, Attendance, Invoices, Tickets, Tasks, Communication Log | Invoices and personal details — inline edit. Grades and Concerns = view only. |
| Academic Head | Overview, Calendar, Attendance, Grades, Concerns, Courses | Grades and target grades — inline edit. Invoices = view only. |
| HOD | Overview (limited), Attendance (own subject), Grades (own subject), Concerns | Grades for own subject — inline edit. All other sections = view only. |
| HR/Finance | Overview, Invoices (via `students.viewFinancial`), Tasks | View only throughout. Can see financial tab — invoices, payment history, credit balance. Cannot edit any profile fields. |
| Teacher | Overview (limited), Calendar, Attendance (own classes), Grades (own subject) | Assignment grades for own students — inline edit. All other sections = view only. |
| TA | Overview (limited), Attendance (own classes) | View only throughout |

---

# 01.16 Navigation and Deep-Linking

[[03_Student-M17_Student_Profile|M17]] student profile pages support deep-linking so that any record across the platform can link directly to a specific student profile and pre-select a specific tab.

| **Element** | **Detail** |
|---|---|
| URL pattern | /students/{studentId} opens the student profile at the Overview tab. /students/{studentId}/{tab} opens the profile at the specified tab. |
| Deep-link sources | [[08_Management-M10_Management_Dashboard|M10]] churn alerts, [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern notifications, [[07_Operations-M16_Task_Management|M16]] task student links, [[06_Finance-M08_Finance_Billing|M08]] invoice records, [[07_Operations-M13_Automation_Communications|M13]] automation actions, [[02_Reference-REF01_Notification_Catalogue|REF-01]] notification catalogue. |
| Browser navigation | Back and forward navigation works within [[03_Student-M17_Student_Profile|M17]] tab history. |
| Mobile behaviour | On mobile, [[03_Student-M17_Student_Profile|M17]] opens as a full-screen view. The tab bar condenses to a horizontally scrollable row. The left sidebar collapses to a slide-out accessible via a profile icon. |

---

# 01.17 IMI Configuration

| **Configuration Item** | **IMI Default** |
|---|---|
| Default tab on open | Overview |
| Session dot visualisation | Enabled — all roles |
| Churn and retention scores on Overview | Enabled — Admin and above |
| Academic snapshot on Overview | Enabled — all roles with Grades tab access |
| Activity timeline event count | 20 most recent events |
| Makeup expiry warning threshold | 7 days |
| Exam countdown display | Y10 through Y13 only |
| Student documents — retention | Consent and T&C records: permanent. Personal ID: anonymised when financial records active, deleted after 5-year financial record window closes. |
| Left sidebar default state | Expanded |
