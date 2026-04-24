---
module: "M19"
title: "Progress Tracking"
layer: "Academic Operations"
folder: "04_Academic"
status: "Draft"
phase: "v1"
dependencies: [M06, M07, M11]
tags: [enrolla, prd, academic, progress]
---

# ENROLLA
# [[04_Academic-M19_Progress_Tracking|M19]] — Progress Tracking & Reports
v1.2 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

[[04_Academic-M19_Progress_Tracking|M19]] is the Progress Tracking and Reports module. It provides a native, continuous academic progress tracking system that replaces IMI's externally managed Google Sheets. The module sits between [[04_Academic-M11_Academic_Courses|M11]] (curriculum and topic tree), [[04_Academic-M14_Assignment_Library|M14]] (assignments and grading), and [[04_Academic-M06_Attendance_Makeups|M06]] (attendance), pulling from all three to produce a living per-student per-subject progress record. [[04_Academic-M19_Progress_Tracking|M19]] owns the tracker and the report generation workflow.

| **Property** | **Value** |
|---|---|
| Module code | [[04_Academic-M19_Progress_Tracking|M19]] |
| Version | v1.1 |
| Status | Draft |
| AMDs absorbed | AMD-02.13 (absent zeros included in grade calculations) |
| Primary roles | Teacher (tracker updates), HOD (dept oversight), Academic Head (cross-dept), Admin Head, Super Admin |
| Secondary roles | Admin (view only) |
| Data sources | [[04_Academic-M11_Academic_Courses|M11]] (topic tree, curriculum structure, grade boundaries), [[04_Academic-M14_Assignment_Library|M14]] (assignment scores, submission status), [[04_Academic-M06_Attendance_Makeups|M06]] (attendance, absence records) |
| Data consumers | [[03_Student-M17_Student_Profile|M17]] (Grades tab), [[08_Management-M10_Management_Dashboard|M10]] (performance dashboard), [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] (intervention concern flags), [[07_Operations-M13_Automation_Communications|M13]] (report delivery) |
| Tracker scope | One tracker per student per subject per term. Auto-created on enrolment. Historical trackers retained permanently. |
| Report format | PDF only. One PDF per subject. Sent separately as each subject's approval is completed. |
| Dependencies | [[04_Academic-M06_Attendance_Makeups|M06]], [[04_Academic-M11_Academic_Courses|M11]], [[07_Operations-M13_Automation_Communications|M13]], [[04_Academic-M14_Assignment_Library|M14]], [[03_Student-M17_Student_Profile|M17]], [[09_Settings-M20_Tenant_Settings|M20]] |
| Phase | v1 |

---

# 01.1 The Progress Tracker

One progress tracker exists per student per subject per term. Trackers are created automatically when a student is enrolled in a subject. They are never deleted — trackers from prior terms are retained as permanent academic history. Each tracker is structured by the [[04_Academic-M11_Academic_Courses|M11]] topic tree for that subject.

## 01.1.1 Tracker Fields

| **Field** | **Detail** |
|---|---|
| Topics and subtopics | Pulled from [[04_Academic-M11_Academic_Courses|M11]] topic tree. Curriculum-aligned. Board-specific for Y10+ (e.g. AQA Physics, Edexcel Mathematics). Each topic and subtopic is a row in the tracker. |
| Assignment scores | Auto-populated from [[04_Academic-M14_Assignment_Library|M14]] when a student submits or is graded on an assignment linked to a topic. Multiple attempts are recorded; the tracker displays the most recent score alongside an attempt history. |
| Manual scores | Teacher can enter scores for non-digital work (e.g. in-class test, verbal assessment) directly into the tracker without a formal [[04_Academic-M14_Assignment_Library|M14]] assignment record. |
| Evaluation tier | Calculated per topic from the score: Pass (≥80%), Requires Support (<80%), Not Submitted (no session yet held on this topic). Threshold configurable per qualification level in [[09_Settings-M20_Tenant_Settings|M20]]. |
| Teacher remarks | Free text per topic. Teacher notes on progress, areas of concern, or next steps. Subject to the 48-hour update rule (see 01.3). |
| Completion status | Topic marked as Covered (teacher has delivered the topic), Partially Covered, or Not Yet Covered. Set manually by teacher or auto-set when a linked session is marked as attended. |
| Past paper scores | Separate section within the tracker. See 01.4. |
| Term | Each tracker is scoped to one term. Prior term trackers are read-only and accessible via the term selector on the tracker view. |

**Auto-population from [[04_Academic-M14_Assignment_Library|M14]] Assignment Library:** When a teacher marks an assignment in [[04_Academic-M14_Assignment_Library|M14]] and records a score, the score is automatically written to the progress tracker entry for the corresponding student-subject-topic. The teacher does not need to manually update [[04_Academic-M19_Progress_Tracking|M19]] — the assignment marking action in [[04_Academic-M14_Assignment_Library|M14]] triggers the [[04_Academic-M19_Progress_Tracking|M19]] update.

## 01.1.2 Tracker Creation and Lifecycle

| **Event** | **Behaviour** |
|---|---|
| Auto-creation | Tracker created automatically when a student is enrolled in a subject. No manual step required. |
| Term rollover | At the start of each new term, a new tracker is created for each active enrolment. The prior term tracker is locked and becomes read-only. |
| Subject withdrawal | When a student withdraws from a subject, the tracker for that subject is locked as of the withdrawal date. No further entries are possible. Progress reports for this subject stop generating. |
| Historical access | All prior term trackers are accessible via a term selector on the tracker view. Permanent retention. |
| Two-year qualifications | For GCSE, A-Level, IB Diploma, and MYP, the tracker spans both years. Year 1 topics are locked at the end of Year 1. Year 2 topics become active at the start of Year 2. |

**Two-year tracker continuity on withdrawal and re-enrolment:**

| **Scenario** | **Behaviour** |
|---|---|
| Student withdraws during Y10 and re-enrols in Y10 or Y11 (same KS4 course) | Existing two-year tracker reactivated. Year 1 topics remain locked if already completed. Year 2 topics resume from the last entry before withdrawal. No new tracker created. |
| Student withdraws during Y12 and re-enrols in Y12 or Y13 (same KS5 course) | Existing two-year tracker reactivated. Year 1 topics remain locked if already completed. Year 2 topics resume from the last entry before withdrawal. No new tracker created. |
| Student withdraws in Y11 and re-enrols at Y12 (KS4 → KS5 — different qualification level) | New tracker created for the KS5 course. The Y10–Y11 tracker is retained as read-only historical record. The two trackers are linked on the student profile for reference but are independent records. |
| Any re-enrolment after tracker reactivation | Admin is prompted to review the reactivated tracker at re-enrolment: 'This student has an existing progress tracker for [Subject]. Review before confirming re-enrolment.' |

---

# 01.2 Evaluation Tier System

Every topic in every tracker carries an evaluation tier. Tiers are calculated automatically from the score and updated whenever a new score is recorded.

| **Tier** | **Condition** | **System Behaviour** |
|---|---|---|
| Pass | Score at or above the pass threshold | Green indicator. No alert generated. |
| Requires Support | Score below the pass threshold — including absent zeros | Amber indicator. Tracked for intervention trigger (see 01.5). |
| Not Submitted | No session has yet been held covering this topic this term | Grey indicator. Reserved for untaught topics only. Cannot be triggered by absence or missing submissions. |

| **Rule** | **Detail** |
|---|---|
| Default pass threshold | 80% — platform default. Configurable per qualification level in [[09_Settings-M20_Tenant_Settings|M20]]. |
| Score basis | Most recent graded attempt for the topic. All attempts are visible in the attempt history. |
| Absent zeros included | Scores recorded as auto-zero due to student absence ([[04_Academic-M14_Assignment_Library|M14]] Absent flag) are included in the student's score average, predicted grade calculation, and evaluation tier. An absent zero counts as a zero score. The Absent flag is retained on the attempt record to identify the reason. This removes the incentive for students to skip graded sessions to protect their predicted grade. |
| Absent zero — tier impact | An absent zero that produces a score below the pass threshold shows as Requires Support (amber). A student who skips enough graded sessions will trigger an intervention through absence alone. |
| Not Submitted tier | Reserved exclusively for topics where no session has yet been held this term. It indicates the topic has not yet been delivered, not that work was missed. |
| Manual override | HOD and above can manually override the tier on any topic with a logged reason. The system tier is displayed alongside the override so both are visible. |

---

# 01.3 48-Hour Update Rule

Teachers are required to update tracker remarks within 48 hours of a session in which a topic was covered.

| **Element** | **Detail** |
|---|---|
| Trigger | A teacher saves topic links for a session. The 48-hour clock starts at the moment the topic link is saved, not from session end time. If a session occurs but no topic links are saved, no 48-hour clock is triggered for that session. If topic links are added retrospectively after the session, the clock starts from the moment the retrospective topic link is saved. |
| Window | 48 hours from the topic link save time (not from session end time). |
| Reminder | In-app notification to the teacher at the 24-hour mark if remarks have not been added. |
| Breach | If 48 hours pass without a remark update, the system flags the outstanding update on the teacher's [[08_Management-M10_Management_Dashboard|M10]] dashboard and sends an in-app notification to the HOD. |
| Resolution | Flag is automatically resolved when the teacher saves a remark for the flagged topic. HOD is notified of resolution. |
| Override | HOD and above can dismiss the flag with a logged reason. Dismissal does not prevent the teacher from still updating the remark. |
| Configurable | The 48-hour window is the IMI default. The window duration is tenant-configurable in [[09_Settings-M20_Tenant_Settings|M20]]. |

---

# 01.4 Past Paper Section

Each tracker contains a dedicated past paper section alongside the topic coverage table. Past papers are structured by exam paper, not by topic, though topic-mapped scores can be entered where the question-to-topic mapping is known.

| **Element** | **Detail** |
|---|---|
| Paper entry | Teacher enters: exam board, paper year, paper number/name (e.g. Paper 1, Paper 2), date sat, total marks available. |
| Score entry | Two modes: (1) Total score entry — one overall score for the paper. (2) Per-question entry — score per question, with optional topic tag per question where the topic is known. Both modes calculate a percentage and grade equivalent automatically based on [[04_Academic-M11_Academic_Courses|M11]] grade boundaries. |
| Topic mapping | Where per-question entry is used and a question is tagged to a topic, that score is also written back to the topic row in the tracker. |
| Grade equivalent | Calculated automatically from the [[04_Academic-M11_Academic_Courses|M11]] grade boundary table for that subject and qualification. |
| Trend chart | Past paper scores trend chart is visible on the [[03_Student-M17_Student_Profile|M17]] student profile Grades tab, showing improvement or decline across papers over time. |
| Multiple papers | Any number of papers can be entered per student per subject. Papers are listed in reverse-chronological order. |
| HOD view | HOD can see aggregated past paper performance across all students in their subject. Average score, grade distribution, and question-level weakness mapping where per-question data exists. |

---

# 01.5 Intervention Tracking

The tracker monitors student performance patterns and triggers intervention workflows automatically when configurable thresholds are breached. Interventions are logged on the tracker and linked to [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern records.

| **Element** | **Detail** |
|---|---|
| Trigger condition | 3 consecutive Requires Support tiers on the same topic (configurable threshold in [[09_Settings-M20_Tenant_Settings|M20]]). Consecutive means 3 graded attempts without reaching the pass threshold, regardless of the time between attempts. |
| System action | Auto-creates a concern flag in [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] at Level 1 with trigger type "Progress tracker below pass threshold." HOD is notified immediately. |
| Tracker log entry | Intervention is logged as a timestamped entry on the tracker for that topic: date triggered, score history, concern record reference. |
| Concern link | The [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern record shows a back-link to the tracker entry. Resolving the concern does not automatically close the tracker intervention log — the two are independent. |
| Resolution on tracker | When the student subsequently achieves a Pass tier on the topic, the tracker intervention is marked as Resolved with the date and score. The linked concern record is not automatically closed — HOD must close it manually in [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]]. |
| Multiple topics | If a student triggers the intervention threshold on 1 or 2 topics simultaneously, one concern flag is raised per topic. If a student triggers the threshold on 3 or more topics simultaneously (within the same review period), ONE consolidated concern flag is raised listing all triggering topics. The threshold for consolidation (3+ topics) is configurable in [[09_Settings-M20_Tenant_Settings|M20]] §01.5. |
| Configurable threshold | 3 consecutive Requires Support attempts is the platform default. Configurable per tenant and per qualification level in [[09_Settings-M20_Tenant_Settings|M20]]. |

---

# 01.6 Report Generation

Progress reports are periodic PDF documents sent to parents summarising a student's academic performance for a subject over the reporting cycle. Reports are generated per student per subject. One PDF is produced per subject and sent independently as soon as the approval workflow for that subject is complete.

## 01.6.1 Report Cadence

| **Setting** | **Detail** |
|---|---|
| Default cadence | Every 3 weeks from the start of term |
| Configurable | Tenant-configurable in [[09_Settings-M20_Tenant_Settings|M20]]. Different cadences can be set per department. |
| Auto-generation | Reports are generated automatically on the configured cadence. No manual trigger required for scheduled reports. |
| Manual trigger | Admin or HOD can trigger an out-of-cycle report for any student at any time from the student profile in [[03_Student-M17_Student_Profile|M17]] or from the tracker view. |
| Report period | Each report covers the period since the last report (or term start for the first report of a term). |

## 01.6.2 Report Skipping Rules

| **Scenario** | **Behaviour** |
|---|---|
| Student absent but subject active | Report generates. The narrative notes the absences, lists the topics that were covered in sessions, and states what the student needs to catch up on. |
| Student withdrew from subject | Report generation stops for that subject from the withdrawal date. The last report before withdrawal is the final record. |
| Subject has zero planned sessions in the cycle | Report skipped automatically. No report is generated if no sessions were scheduled in the reporting period. |
| Dept-configurable skip rule | Each department can configure in [[09_Settings-M20_Tenant_Settings|M20]] whether to generate reports for students with 100% absence in a cycle (options: always generate / skip if all absent / prompt HOD to decide per case). |

## 01.6.3 AI Narrative Generation

Each report includes an AI-generated narrative summary drafted by Claude. The narrative is the human-readable synthesis of the tracker data. The narrative is never sent without explicit approval from the designated approver.

| **Element** | **Detail** |
|---|---|
| Prompt template | Each department configures its own AI prompt template in [[09_Settings-M20_Tenant_Settings|M20]]. The template defines the tone, structure, and required content sections of the narrative. This ensures consistent output structure across all reports within a department. |
| Input data | The AI receives: student name and year group, subject, reporting period, attendance summary, topic coverage table (topic, score, tier, teacher remark), past paper scores (if any), target grade, and any HOD or teacher notes flagged for inclusion. |
| Absent-period handling | Where a student was absent for all or most of the cycle, the prompt instructs the AI to note absences, describe what topics were covered in the missed sessions, and frame the narrative around what needs to be caught up. |
| Output | The AI-generated progress narrative consists of exactly 5 structured sections: (1) **Overall Progress Summary** — A 2–3 sentence overview of the student's academic progress in this subject this term. (2) **Strengths** — Specific topics or skills where the student has demonstrated strong performance. (3) **Areas for Development** — Specific topics or skills where the student needs additional support or practice. (4) **Attendance and Engagement** — Comment on the student's attendance pattern and engagement level (based on [[04_Academic-M06_Attendance_Makeups|M06]] data). (5) **Next Steps** — 2–3 specific, actionable recommendations for the student and guardian. |
| Approval | The HOD or teacher approves the narrative before it is included in the progress report PDF. Edits can be made inline before approval. No report sends without explicit approval action. |
| Edit log | All edits made by the approver to the AI draft are tracked. The final approved text is stored alongside the original AI draft for audit purposes. |

## 01.6.4 Approval Workflow

The canonical report approval chain is: **Teacher drafts → Head of Subject reviews and approves (if the role exists and the toggle is enabled in [[09_Settings-M20_Tenant_Settings|M20]]) → HOD approves → report released to parent.** If the Head of Subject role is not in use or the toggle is off for the department, that step is skipped automatically. Rejection at any stage sends the report back to the Teacher with the rejection reason. HOD is notified of any rejection at Head of Subject level.

The approval chain is configurable per department in [[09_Settings-M20_Tenant_Settings|M20]] with the following options:

| **Option** | **Detail** |
|---|---|
| Option A: Teacher approves | The teacher who owns the subject approves the report directly. Head of Subject and HOD steps skipped. Suitable for departments where layered oversight is not required. |
| Option B: Teacher drafts, HOD approves | The teacher reviews and edits the AI draft, then submits to the HOD for final approval. Head of Subject step skipped. HOD approves or sends back with comments. |
| Option C: Teacher drafts → Head of Subject approves → HOD approves | Teacher reviews and edits, submits to Head of Subject for subject-level review, then to HOD for final approval. Default chain when Head of Subject role is active. |
| Option D: HOD approves directly | The AI draft is routed to the HOD without a teacher review step. Head of Subject step skipped. |
| Head of Subject toggle | A per-department toggle in [[09_Settings-M20_Tenant_Settings|M20]] controls whether the Head of Subject step is included. When off, the step is skipped regardless of which option is selected. |
| Rejection behaviour | Rejection at any stage returns the report to the Teacher with the rejection reason. The rejecting approver can add inline comments. HOD is notified when a rejection occurs at Head of Subject level. |
| Approval deadline | Configurable per department in [[09_Settings-M20_Tenant_Settings|M20]]. If the report is not approved within the deadline, the HOD receives an escalation alert. Admin Head is notified if still unapproved after a second configurable window. |
| Approval actions | Approve and send, Edit and approve and send, Send back with comments (returns to teacher or previous approver with inline notes). |
| Bulk approval | HOD can select multiple reports from the approval queue using checkboxes and click "Approve Selected." Opening each report individually is not required. The system records whether each report was opened before approval for audit purposes. |

---

# 01.7 Report PDF Structure

Each progress report is a professionally formatted PDF using the tenant's branding configured in [[09_Settings-M20_Tenant_Settings|M20]].

| **Section** | **Content** |
|---|---|
| Header | Tenant logo, report title ("Progress Report"), student full name, year group, subject, term, reporting period (DD/MM/YYYY – DD/MM/YYYY), report date. |
| Attendance summary | Sessions attended vs sessions scheduled this period. Attendance rate as a percentage. Any absences noted with dates. |
| Topic coverage table | Columns: topic / subtopic, score, evaluation tier (Pass / Requires Support / Not Submitted), teacher remark. Topics ordered as per [[04_Academic-M11_Academic_Courses|M11]] curriculum sequence. |
| Past paper summary | Included only if past paper scores exist for this period. Columns: paper name, date sat, score, grade equivalent. Trend direction noted if prior papers exist. |
| AI narrative | The approved plain-English narrative. Structured according to the department prompt template. Addresses the parent directly. |
| Target grade vs current performance | Target grade (from [[04_Academic-M11_Academic_Courses|M11]]/[[03_Student-M17_Student_Profile|M17]]) shown alongside the current predicted grade derived from tracker scores and HOD-configured weighting. Default weighting (before HOD configures a custom formula): equal-weight average across all graded attempts for the subject. HOD can set a custom weighting formula in [[09_Settings-M20_Tenant_Settings|M20]] §01.5.1. |
| Next steps | Drawn from the AI narrative — specific recommendations for what the student should focus on before the next report. |
| Teacher sign-off | Teacher name, subject, digital sign-off indicator (approved by [name] on [DD/MM/YYYY]). HOD name included if HOD was part of approval chain. |
| Footer | Tenant contact details, branch name, report reference number (auto-generated, unique per report). |

---

# 01.8 Report Delivery and Read Tracking

Reports are delivered to the parent via their preferred communication channel as soon as the approval is completed.

| **Element** | **Detail** |
|---|---|
| Primary channel | WhatsApp — PDF attached to a template message. |
| Fallback channel | Email — PDF attached. Used if WhatsApp is unavailable or if the guardian has no WhatsApp number on record. |
| Delivery status | Sent, Delivered, Read, or Failed — tracked per report per guardian. Stored on the report record. |
| Read tracking | Where the delivery channel supports read receipts (WhatsApp), the platform logs whether the report message has been read. |
| Unread follow-up | If the report message is unread after 3 days, the system automatically sends one follow-up message on the same channel. After the one follow-up, no further automated messages are sent. |
| Follow-up log | The follow-up is logged on the [[03_Student-M18_Guardian_Profile|M18]] Messages tab with source label "Report Follow-Up" and the report reference number. |
| Manual resend | Admin or HOD can manually resend a report from [[03_Student-M17_Student_Profile|M17]] or the report management view at any time. |
| Storage | The approved PDF is stored permanently on the student's [[03_Student-M17_Student_Profile|M17]] Files tab, labelled with subject, term, and report date. Also logged in the [[03_Student-M18_Guardian_Profile|M18]] Messages tab as an outbound message. |
| Parent portal | No parent-facing live view in v1. Parents receive the PDF via message only. Parent portal progress view is deferred to Phase 2. |

---

# 01.9 Tracker View

The tracker view is accessible from the student's [[03_Student-M17_Student_Profile|M17]] profile (Grades tab) and from the HOD and Academic Head dashboards in [[08_Management-M10_Management_Dashboard|M10]].

| **Element** | **Detail** |
|---|---|
| Access from [[03_Student-M17_Student_Profile|M17]] | Grades tab — clicking a subject card opens the tracker for that subject. Term selector allows switching between current and prior terms. |
| Access from [[08_Management-M10_Management_Dashboard|M10]] | HOD dashboard shows a tracker completeness indicator per subject group. Clicking through opens the full tracker list for all students in that subject. |
| Topic row display | Each topic row shows: topic name, subtopic (if applicable), most recent score, evaluation tier, attempt count, teacher remark, completion status. Expandable to show full attempt history. |
| Inline editing | Teacher can update remarks and manual scores directly in the tracker view. Score entry triggers immediate tier recalculation. Edits are logged with author and timestamp. |
| Quick Score Entry | From the [[04_Academic-M05_Timetabling_Scheduling|M05]] session detail view, teachers can enter scores for multiple students simultaneously using the Quick Score Entry workflow ([[04_Academic-M14_Assignment_Library|[[04_Academic-M14_Assignment_Library|M14]].A]]). These scores flow automatically into the tracker. |
| Filters | Filter tracker by topic status (Covered / Not Yet), evaluation tier (Pass / Requires Support / Not Submitted), or intervention flag (flagged / resolved / none). |
| Progress bar | A topic coverage progress bar at the top of the tracker shows percentage of topics Covered vs total topics in the [[04_Academic-M11_Academic_Courses|M11]] curriculum for this subject. |
| Completeness indicator | A remark completeness indicator shows the percentage of covered topics that have a teacher remark. Used by HOD to track tracker hygiene. |

---

# 01.10 Report Management View

The Report Management View is accessible to HOD, Academic Head, Admin Head, and Super Admin. It provides a department-level view of all pending, in-progress, and sent reports.

| **Section** | **Detail** |
|---|---|
| Pending approval queue | All reports generated but not yet approved. Grouped by subject then by teacher. Shows days pending and deadline indicator (amber at 2 days, red at deadline). |
| Sent reports | All approved and delivered reports. Filterable by subject, student, term, and date range. Shows delivery status and read status per report. |
| Overdue alerts | Reports past their approval deadline are highlighted in red. HOD receives an in-app notification. Admin Head is notified if still unapproved after the second window. |
| Manual trigger | HOD or Admin can trigger a report for a specific student and subject outside the normal cadence from this view. |
| Export | Admin Head and Super Admin can export the report history as a CSV log: student, subject, report date, approval date, approver, delivery status, read status. |

---

# 01.11 Qualification-Specific Structures

## 01.11.1 Standard (One-Year) Courses

Primary, Lower Secondary, and non-examined Upper Secondary subjects. Tracker is scoped to one term. Topic tree is the full year group curriculum from [[04_Academic-M11_Academic_Courses|M11]].

## 01.11.2 Two-Year Qualifications (GCSE, A-Level, IB, MYP)

| **Element** | **Detail** |
|---|---|
| Tracker span | The tracker spans both Year 1 and Year 2 of the qualification. Topics from both years are loaded from [[04_Academic-M11_Academic_Courses|M11]]. |
| Year 1 lock | At the end of Year 1, all Year 1 topic rows are locked and become read-only. The locked data forms a permanent record of Year 1 performance. |
| Year 2 activation | Year 2 topics become editable at the start of Year 2. Year 1 rows remain visible but clearly marked as locked prior-year data. |
| Report continuity | Progress reports in Year 2 reference Year 1 performance where relevant. |

## 01.11.3 Module-Based Qualifications

| **Element** | **Detail** |
|---|---|
| Module sections | The tracker is divided into named module sections (e.g. for A-Level Mathematics: Pure Mathematics, Statistics, Mechanics). Each module has its own topic list from [[04_Academic-M11_Academic_Courses|M11]]. |
| Per-module scoring | Scores, tiers, and remarks operate independently per module section. |
| Past paper section | Organised by module — past papers are entered per module rather than per overall paper where module-specific papers exist. |
| Report structure | The AI narrative and PDF report address each module as a named section. |

---

# 01.12 Role-Based Access

| **Role** | **Scope** | **Rights** |
|---|---|---|
| Super Admin | All trackers, all subjects, all reports | Full read/write. Can approve any report. Can override any tier. |
| Admin Head | All trackers, all subjects, all reports | Full read/write. Can approve any report. Receives overdue escalations. |
| Academic Head | All trackers, all subjects, all reports | Full read/write. Can approve reports in any dept. Can see cross-dept performance. |
| HOD | All trackers within their subject(s) | Full read/write for own subjects. Can approve reports in own subject. Receives 48hr breach alerts. Can override tier with logged reason. |
| Teacher | Trackers for their own enrolled students only | Can update scores, remarks, completion status. Cannot approve reports in depts set to HOD approval. Can approve where dept is set to Teacher approval. |
| Admin | All trackers — view only | Read-only access to all tracker data. Cannot edit scores, remarks, or tier. Cannot approve reports. |
| TA | No tracker access | TA does not have access to progress trackers or reports. |

---

# 01.13 IMI Configuration

| **Configuration Item** | **IMI Default** |
|---|---|
| Replaces | IMI Google Sheets progress tracking system |
| Default pass threshold | 80% |
| Pass threshold — Primary | 80% (descriptor-based grading configured in [[04_Academic-M11_Academic_Courses|M11]] per subject) |
| Pass threshold — Secondary | 80% (numeric, configurable per qualification in [[09_Settings-M20_Tenant_Settings|M20]]) |
| 48-hour remark window | 48 hours from topic link save time (not from session end time). Configurable in [[09_Settings-M20_Tenant_Settings|M20]]. |
| Intervention trigger threshold | 3 consecutive Requires Support on same topic (configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Report cadence | Every 3 weeks from start of term (configurable per department in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Report format | One PDF per subject, sent separately on approval |
| Approval workflow — Primary | Configurable in [[09_Settings-M20_Tenant_Settings|M20]] (default: Teacher approves) |
| Approval workflow — Secondary | Configurable in [[09_Settings-M20_Tenant_Settings|M20]] (default: Teacher drafts, HOD approves) |
| AI narrative | Enabled. Prompt template configured per department in [[09_Settings-M20_Tenant_Settings|M20]]. |
| Report delivery channel | WhatsApp primary, Email fallback |
| Unread follow-up | 3 days unread — one follow-up, then stop |
| Past paper tracking | Enabled for all year groups. Per-question entry available. |
| Two-year qualification tracking | Enabled. Year 1 locked at year end. |
| Report storage | Permanent on [[03_Student-M17_Student_Profile|M17]] Files tab |
| Parent portal view | Phase 2 — not in v1 |
| Absent zeros in grade calculation | Included — absent zeros count towards averages and predicted grades. Absent flag retained on attempt record for context. |

---

# [[04_Academic-M19_Progress_Tracking|[[04_Academic-M19_Progress_Tracking|M19]].A]] — Academic Alert System

The Academic Alert System is an automated early warning mechanism that monitors student academic signals across all enrolled subjects and escalates to the [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] Concern Engine when patterns of concern are detected. [[04_Academic-M19_Progress_Tracking|[[04_Academic-M19_Progress_Tracking|M19]].A]] sits between [[04_Academic-M19_Progress_Tracking|M19]] (which owns the tracker data) and [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] (which owns the formal concern workflow).

## 19.A.1 Alert Logic

The Academic Alert System operates on two tiers: soft alerts (single signal) and formal escalation (multi-signal pattern).

| **Tier** | **Trigger** | **Action** |
|---|---|---|
| Soft alert | Any single signal detected (see 19.A.2) | In-app flag raised on the student's tracker and on the HOD dashboard. No [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern created. HOD is notified in-app. No parent notification. |
| Formal escalation | 2 or more signals detected within a 4-week rolling window for the same student | A formal Level 1 concern is automatically created in [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] with trigger type "Academic Alert — multiple signals." HOD is notified immediately. |

## 19.A.2 Signal Types

The following signals are monitored per student per subject. Each signal type has a configurable threshold in [[09_Settings-M20_Tenant_Settings|M20]].

| **Signal** | **IMI Default Threshold** |
|---|---|
| Poor score | Score below 50% on any graded assignment or classwork item |
| Absence on topic | Student marked Absent in a session where the teacher linked one or more topics from the [[04_Academic-M11_Academic_Courses|M11]] topic tree |
| Overdue submission | Assignment past due date without submission |
| Requires Support tier | Student at Requires Support tier on any topic in the tracker |

All four signal types are monitored independently and simultaneously. A student can trigger multiple signals at once across the same or different subjects.

## 19.A.3 Rolling Window

The 4-week rolling window moves continuously — it is not term-locked. Signals that occurred more than 4 weeks ago do not count toward the formal escalation threshold. The window resets per student per subject independently.

## 19.A.4 Parent Contact

| **Level** | **Default** |
|---|---|
| Soft alert | No parent notification |
| Formal escalation (L1 in [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]]) | Parent contact at L2 for Primary students (configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Formal escalation (L1 in [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]]) | Parent contact at L3 for Secondary students (configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |

Parent contact thresholds are tenant-configurable. HOD or Admin Head can always notify the parent manually at any level regardless of the default.

## 19.A.5 Configurable Thresholds in [[09_Settings-M20_Tenant_Settings|M20]]

There are 11 configurable thresholds governing the Academic Alert System, all accessible to Super Admin in [[09_Settings-M20_Tenant_Settings|M20]] under Academic Settings.

| **Threshold** | **What It Controls** |
|---|---|
| Poor score threshold | The percentage below which a score triggers a poor score signal (default: 50%) |
| Multi-signal escalation count | Number of signals within the rolling window before formal escalation (default: 2) |
| Rolling window duration | The window in weeks during which signals are counted (default: 4 weeks) |
| Overdue submission grace period | Days past due date before an overdue submission counts as a signal |
| Requires Support trigger | Whether Requires Support tier alone triggers a soft alert or is excluded until combined with another signal |
| Absence on topic threshold | Whether one absence on a topic session triggers the signal or requires multiple |
| Primary parent contact escalation level | L2 or L3 default for Primary students |
| Secondary parent contact escalation level | L2 or L3 default for Secondary students |
| HOD notification method | In-app only, or in-app plus email |
| Signal cooldown | Minimum days before the same signal type re-triggers for the same student and subject |
| Auto-dismiss on pass | Whether a soft alert is automatically dismissed when the student achieves a Pass tier on the flagged topic |

## 19.A.6 IMI Reference Configuration

| **Setting** | **IMI Value** |
|---|---|
| Poor score threshold | 50% |
| Multi-signal escalation count | 2 signals in 4-week window |
| Rolling window duration | 4 weeks |
| Parent contact — Primary | Default: L2 (configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Parent contact — Secondary | Default: L3 (configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Pending late submissions display | Oldest-first on teacher dashboard |
| Late resubmission window | No time limit — late resubmissions accepted at any time |
