---
module: "M07"
title: "Feedback & Communications"
layer: "Academic Operations"
folder: "04_Academic"
status: "Draft"
phase: "v1"
dependencies: [M05, M06, M19]
tags: [enrolla, prd, academic, feedback]
---

# ENROLLA
# [[04_Academic-M07_Feedback_Communications|M07]] — Feedback & Communications
v1.1 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

Feedback & Communications is the hub for all structured communication between the centre and parents. It covers session-level teacher feedback, progress report cross-reference, pre- and post-session announcements, communication channel management, complaint ticket handling, parent satisfaction surveys, and class discussion threads.

| **Property** | **Value** |
|---|---|
| Module code | [[04_Academic-M07_Feedback_Communications|M07]] |
| Version | v1.1 |
| Status | Current |
| Sub-modules | [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].A]] Complaints & Ticket Management, [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].B]] Satisfaction Surveys, [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].C]] Class Discussion |
| Dependencies | [[03_Student-M02_Student_Guardian_CRM|M02]], [[04_Academic-M05_Timetabling_Scheduling|M05]], [[04_Academic-M06_Attendance_Makeups|M06]], [[08_Management-M10_Management_Dashboard|M10]], [[04_Academic-M14_Assignment_Library|M14]], [[07_Operations-M16_Task_Management|M16]], [[03_Student-M17_Student_Profile|M17]], [[04_Academic-M19_Progress_Tracking|M19]], [[09_Settings-M20_Tenant_Settings|M20]] |
| Phase | v1 |

| **Sub-module** | **Summary** |
|---|---|
| [[04_Academic-M07_Feedback_Communications|M07]] — Per-Class Feedback | Session-level teacher feedback per student. AI-generated summary. Teacher approval gate before parent delivery. |
| [[04_Academic-M07_Feedback_Communications|M07]] — Announcements | Pre- and post-session communications from teacher or Admin to class groups. Approval gateway applies. |
| [[04_Academic-M07_Feedback_Communications|M07]] — Communication Channels | Platform-wide channel configuration. WhatsApp primary, Email secondary, In-app for staff. |
| [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].A]] — Complaints & Tickets | Formal complaint tickets raised by Admin on behalf of parents. Dual sign-off required for resolution. |
| [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].B]] — Satisfaction Surveys | Lifecycle-triggered parent surveys. Feeds churn and retention scores. Google Review funnel. |
| [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].C]] — Class Discussion | Persistent class discussion thread per session group. Teacher-moderated. Not a full LMS. |

---

# 01.1 Per-Class Feedback

Per-Class Feedback is the session-level teacher feedback workflow. After each session, the teacher provides structured feedback for each individual student. This is distinct from the Progress Report ([[04_Academic-M19_Progress_Tracking|M19]]), which synthesises feedback across multiple sessions over a period.

## 01.1.1 How It Works

| **Step** | **Detail** |
|---|---|
| 1 | Teacher opens the session record from their calendar ([[04_Academic-M05_Timetabling_Scheduling|M05]]) after the session ends. |
| 2 | For each enrolled student, the teacher completes the feedback form — one form per student per session. |
| 3 | Feedback selectors: configurable dropdown options defined in [[09_Settings-M20_Tenant_Settings|M20]] (e.g. Engagement: Excellent / Good / Needs Improvement; Homework: Complete / Incomplete / Not Set; Participation: Active / Passive / Disengaged). Different selector sets can be configured per department or subject group. |
| 4 | Free-text notes: an optional open notes field for additional observations, specific topics covered, or concerns to flag. |
| 5 | AI Summary: once selectors and notes are complete, Claude generates a concise, parent-friendly summary in plain English. The teacher reads the AI summary, edits if needed, and approves it. |
| 6 | The approved summary is sent to the parent via their preferred channel (WhatsApp primary, Email secondary). It is never sent without explicit teacher approval. |
| 7 | Feedback is stored per student per session in the cumulative record ([[03_Student-M02_Student_Guardian_CRM|M02]]) and visible on the student's profile ([[03_Student-M17_Student_Profile|M17]]). |

## 01.1.2 Feedback Selector Configuration

| **Setting** | **Detail** |
|---|---|
| Selector sets | Configured in [[09_Settings-M20_Tenant_Settings|M20]] Tenant Settings. Different sets can be defined per department (Primary / Secondary) or per subject group. |
| Required vs optional | Tenant configures which selectors must be completed before submission and which are optional. |
| AI summary toggle | Per tenant. When off, the teacher's free-text notes are sent directly (still requiring teacher approval). When on (IMI default), Claude generates the summary first. |
| Delivery gate | The system will not deliver feedback to a parent until it has been explicitly approved. Approval can be given by the teacher who submitted the feedback OR by the HOD for their department. No auto-send under any circumstance. |
| Feedback window | Feedback can be submitted from the session end time until the earlier of: (a) the next session of the same subject for that student begins, or (b) 7 calendar days after the session end time. If no next session is scheduled within 7 days, the feedback window closes at 7 days. After that window, submission requires Admin Head approval. Makeup sessions count as 'next session of the same subject' for the purpose of the feedback window close trigger. The feedback window for the original missed session closes when the makeup session begins, regardless of whether feedback was submitted for the missed session. |

**Teacher Off-Boarding Hard Block — Pending Feedback Drafts:**
When a teacher's off-boarding is initiated, any pending (unsubmitted/draft) feedback records are flagged. Off-boarding cannot be marked complete until all pending feedback drafts are either submitted for approval or explicitly discarded (with a reason logged). This is a hard block.

---

# 01.2 Progress Reports

Progress reports are periodic, synthesised PDF reports covering a student's academic performance across multiple sessions. They are distinct from per-class feedback (01.1), which covers individual sessions.

Default cadence is every 3 weeks, configurable per tenant in [[09_Settings-M20_Tenant_Settings|M20]]. Reports auto-generate on schedule. Admin or HOD can also trigger a manual report for any student at any time. Each report pulls from: attendance data ([[04_Academic-M06_Attendance_Makeups|M06]]), per-class feedback history (01.1), assignment grades ([[04_Academic-M14_Assignment_Library|M14]]), and target vs current grade ([[04_Academic-M11_Academic_Courses|M11]]). Claude drafts a narrative summary per course. The canonical report approval chain is: Teacher drafts → Head of Subject reviews and approves (if the role exists and the toggle is enabled in [[09_Settings-M20_Tenant_Settings|M20]]) → HOD approves → report released to parent. If Head of Subject role is not in use or the toggle is off, that step is skipped automatically. Rejection at any stage sends the report back to the Teacher with the rejection reason. HOD is notified of any rejection at Head of Subject level. The approved report is sent to the parent via their preferred channel and stored on the student's profile ([[03_Student-M17_Student_Profile|M17]]).

See [[04_Academic-M19_Progress_Tracking|M19]] (Progress Tracking & Reports) for the full specification covering report structure, evaluation tier system, approval workflow options, past paper section, intervention tracking, PDF export format, role-based access, and qualification-specific structures.

---

# 01.3 Announcements

Announcements allow teachers and Admin to send targeted communications to class groups before or after sessions. They are one-way push communications — distinct from the Class Discussion thread ([[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].C]]), which is an ongoing persistent thread.

## 01.3.1 Announcement Types

| **Type** | **Description** |
|---|---|
| Pre-session | Sent before a scheduled class — typically 24 hours before or on the morning of the class. Examples: 'Bring your textbook tomorrow', 'Homework reminder: Chapter 4 due tonight', 'Session moved to Room 3 today'. |
| Post-session | Sent after a class has ended — typically within an hour of the session finishing. Examples: 'Great session today — here is what we covered', 'Homework assigned: complete Exercise 5'. |

## 01.3.2 Announcement Rules

Delivery channels follow the parent's preference: WhatsApp (via BSP, primary), Email, and in-app notification. A library of common announcement templates is available for teachers and Admin to select and customise — templates are managed in [[09_Settings-M20_Tenant_Settings|M20]] Tenant Settings.

All announcements intended for parents pass through the approval gateway before delivery. Teachers draft; Admin or Admin Head approves before send. Admin can send to the full class group or a specific subset (e.g. only students with outstanding homework, only students who were absent). Announcements can include PDF or image attachments. All announcements are logged in each recipient student's communication log ([[03_Student-M02_Student_Guardian_CRM|M02]]).

**No self-approval — announcements only:** A teacher or staff member cannot approve their own announcement submissions. Announcement approval must be performed by a different Admin, Admin Head, or HOD. Per-class feedback is not subject to this rule — the teacher who submitted the feedback or the HOD for their department can approve it.

---

# 01.4 Communication Channels

Enrolla supports three communication channels for outbound messages to students and parents.

| **Channel** | **Description** | **IMI Default** |
|---|---|---|
| WhatsApp Business API (via BSP) | Primary outbound channel. Messages sent via the tenant's WhatsApp Business number through an approved BSP. All outgoing messages use approved templates where required by Meta. Message delivery status (sent, delivered, read) is tracked per message. | Primary — On |
| Email | Used for formal documents (invoices, progress reports, enrolment confirmations) and as a fallback when WhatsApp is unavailable. PDF attachments supported. | Secondary — On |
| In-app notifications | Push notifications within the platform. Used for staff-facing and internal operational alerts. Not a parent-facing channel in v1 (parent portal is Phase 2). | On (staff only) |

The parent's preferred channel is set on the Guardian Profile ([[03_Student-M02_Student_Guardian_CRM|M02]]/[[03_Student-M18_Guardian_Profile|M18]]) and used as the default for all outbound messages. English only in v1. Messages containing sensitive information (invoices, concern notifications, complaint resolutions) require Admin approval before delivery regardless of channel. WhatsApp template messages must be pre-approved by Meta via the BSP. Free-form messages can only be sent within the 24-hour messaging window after the parent has initiated contact. In v1, all WhatsApp messages are sent manually by staff from their personal devices via the copy-paste mechanism in [[07_Operations-M13_Automation_Communications|M13]]. The 24-hour messaging window rule is a Meta BSP constraint that applies in Phase 2 only when BSP integration is active. No platform enforcement of the 24-hour window occurs in v1. DNC flag on a guardian suppresses all WhatsApp and Email communications — invoices always send regardless of DNC status.

---

# 01.5 Role-Based Access

| **Role** | **Access Level** |
|---|---|
| Org Owner, Super Admin | Full access across all modules. Configure Google Review threshold. |
| Admin Head | Approve announcements. Receive complaint sign-off. Receive low satisfaction alerts. Trigger surveys. View all feedback. |
| Admin | Submit per-class feedback for any student (`feedback.submit` — added April 2026). Create announcements (pending approval). Raise complaint tickets. Trigger manual surveys. View feedback for all students. |
| Academic Head | View all feedback, complaints, and surveys. Cannot raise complaints or submit feedback. |
| HOD | Submit per-class feedback for own sessions. Receive complaint tickets. Approve feedback for their department. View discussion threads. |
| Head of Subject | Submit per-class feedback for own sessions. View feedback for their subject. |
| Teacher | Submit per-class feedback for own sessions. Draft announcements. Post to class discussion threads. Cannot send to parent without approval. |
| TA | View per-class feedback for assigned sessions. Cannot submit feedback or post announcements. |

---

# 01.6 IMI Reference Configuration

| **Setting** | **IMI Value** |
|---|---|
| Primary communication channel | WhatsApp via BSP |
| Secondary channel | Email |
| Per-class feedback | On |
| AI feedback summary | On — Claude generates summary. Teacher approves before send. |
| Announcements | On — approval gate applies |
| Complaint taxonomy | Teaching Quality, Administrative, Facilities, Safety & Wellbeing, Other |
| Dual sign-off requirement | Mandatory for all complaint resolutions |
| Recurring complaint trigger | 3+ tickets in one term → auto meeting task to Admin Head |
| Survey trigger — mid-term | Midpoint of each term |
| Survey trigger — end of term | Final week of each term |
| Survey trigger — post-trial | 24 hours after trial class |
| Survey trigger — post-withdrawal | Within 48 hours of withdrawal confirmed |
| Google Review threshold | 4 stars and above (Super Admin configurable) |
| Class discussion | On — teacher-moderated, students cannot initiate threads |
| Language | English only in v1 |

---

# [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].A]] — Complaints & Ticket Management

The complaints module manages formal complaint tickets raised by Admin on behalf of parents. Parents are always the complainant — they are never the subject of a complaint. All resolutions require dual sign-off. Complaints are distinct from concerns ([[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]]): a concern is raised by a teacher about a student's welfare or academic situation; a complaint is raised by a parent about the centre's service.

## 07.A.1 Two-Record System

| **Record** | **Detail** |
|---|---|
| Internal ticket | The full complaint record including notes, evidence, escalation history, and resolution details. Visible to relevant staff only based on their role. |
| Parent-facing summary | A simplified view showing ticket status and resolution outcome only. Internal staff notes, escalation details, and investigation content are never shown to the parent. |

## 07.A.2 Complaint Categories

| **Category** | **Scope** |
|---|---|
| Teaching Quality | Lesson pace, explanation clarity, teacher attitude, or pedagogical approach |
| Administrative | Billing errors, communication failures, scheduling mistakes, or process breakdowns |
| Facilities | Room conditions, equipment availability, cleanliness, or physical environment |
| Safety & Wellbeing | Student safety concerns, bullying, inappropriate conduct, or welfare issues |
| Other | Anything not captured above. Free text description required. |

## 07.A.3 Who Raises Complaint Tickets

Any Admin or Admin Head can raise a ticket on behalf of a parent. Teachers, TAs, and students cannot raise complaint tickets. Parents cannot raise tickets directly in v1 — Phase 2 (Parent Portal) will enable direct parent submission. Parents are always the complainant — never the subject of a complaint.

## 07.A.4 Ticket Status Flow

| **Status** | **Detail** |
|---|---|
| Open | Ticket logged. Assigned to HOD for initial review. |
| In Progress | Under active investigation by HOD or Academic Head. |
| Awaiting Response | Waiting for parent, teacher, or third-party response before investigation can continue. |
| Escalated | Raised to Admin Head or Academic Head. |
| Awaiting Sign-Off | Resolution proposed. Dual sign-off required before the resolution is communicated to the parent. |
| Resolved | Both sign-offs confirmed. Resolution communicated to parent. |
| Closed | Resolved and acknowledged by all parties. Read-only. Cannot be reopened. |

## 07.A.5 Dual Sign-Off Requirement

Dual sign-off for complaint resolution requires two distinct approvers: (1) First sign-off: HOD, Academic Head, or Admin Head of the relevant department; (2) Second sign-off: Super Admin. The same person cannot sign off at both stages. If the complaint was logged by the HOD, the first sign-off must come from Academic Head or Admin Head — the HOD cannot sign off on their own complaint log. Resolution is only possible after both sign-offs are recorded. Sign-offs are logged with name, role, and timestamp.

## 07.A.6 Escalation Rules

On ticket creation, HOD receives an in-app notification and is assigned as the primary resolver. If the complaint involves the HOD, it bypasses HOD and goes directly to Academic Head. HOD or Admin can escalate a ticket to Admin Head or Academic Head at any point during investigation. All escalation events are timestamped and logged on the ticket record. All complaints activity is logged in the linked student's cumulative record ([[03_Student-M02_Student_Guardian_CRM|M02]]).

## 07.A.7 Recurring Complaint Auto-Meeting Trigger

If the same parent raises 3 or more complaint tickets within a single term, the system automatically creates a meeting request task assigned to Admin Head in [[07_Operations-M16_Task_Management|M16]]. The task includes: parent name, number of tickets this term, linked ticket records, and a suggested action: 'Schedule a parent meeting to address recurring concerns.'

---

# [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].B]] — Satisfaction Surveys

Satisfaction surveys collect structured feedback from parents on teaching quality and service. Results feed the churn risk score and retention confidence score in [[08_Management-M10_Management_Dashboard|M10]], and surface on student profiles in [[03_Student-M17_Student_Profile|M17]].

## 07.B.1 Survey Format

Overall satisfaction is a star rating 1–5. Category-specific ratings cover: Teaching Quality, Communication, Value for Money, Facilities — each rated 1–5. An optional free text comment field captures additional context. Responses are linked to the student record internally for reporting but are presented to the parent as anonymous — their name is not shown on any parent-facing view alongside their rating.

## 07.B.2 Trigger Points

| **Trigger** | **Timing** |
|---|---|
| Mid-term check-in | Automatically at the midpoint of each term |
| End of term | Automatically in the final week of each term |
| Post-trial class | 24 hours after a trial class is completed |
| Post-withdrawal | Within 48 hours of a withdrawal being confirmed |
| Manual trigger | Admin can send a survey at any time from the student profile. No minimum interval enforced. |

Surveys are sent via the parent's preferred channel (WhatsApp primary, Email secondary). If a parent does not respond within 7 days, the survey link expires. No follow-up is sent automatically.

## 07.B.3 Internal Alerts and Reporting

Ratings below the tenant-configured threshold trigger an in-app low score alert to HOD and Admin Head. The alert shows student name, subject, and score — not the free text comment unless explicitly shared by Admin Head. A weekly AI digest summarises satisfaction trends across all active students and subjects, sent to Admin Head on a configurable day of the week.

Satisfaction scores feed the churn risk weighting model ([[08_Management-M10_Management_Dashboard|M10]]): NPS/satisfaction score contributes 10% of the churn risk score. Satisfaction scores also feed the retention confidence score ([[08_Management-M10_Management_Dashboard|M10]]): review/satisfaction result contributes 25% of the retention confidence score.

## 07.B.4 Google Review Funnel

For parents who give 4 stars or above on the overall satisfaction question, the system prompts them to leave a Google Review with a direct link to the tenant's Google Business profile. The rating threshold is configurable by Super Admin only (default: 4 stars) — Admin Head and below cannot change this setting. The Google Review prompt is sent via WhatsApp immediately after survey completion. Parents who give below the threshold do not receive the Google Review prompt — instead the low score alert fires internally.

---

# [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].C]] — Class Discussion

Class Discussion provides a persistent threaded discussion thread for each session group. It is a lightweight communication channel — not a full Learning Management System. The thread is teacher-moderated and is not accessible by parents in v1.

## 07.C.1 Thread Creation

A discussion thread is auto-created when a recurring session series is set up in [[04_Academic-M05_Timetabling_Scheduling|M05]]. One thread per recurring series (not per individual session occurrence). The thread persists for the lifetime of the series and is retained permanently in the cumulative record.

## 07.C.2 Thread Participants

Teachers can post announcements, start discussions, reply to student questions, and moderate the thread. Students can post questions and reply to teacher posts — students cannot initiate new threads, only respond within existing threads. Admin and HOD can view all threads and moderate and remove posts. Parents cannot access the class discussion in v1 — parent-facing discussion is a Phase 2 feature.

## 07.C.3 Post Types

| **Post Type** | **Description** |
|---|---|
| Announcement | Teacher posts a one-way update to the class group. Students can react but not reply directly. |
| Discussion | Teacher opens a topic for student responses. Students can reply. |
| Question | Student posts a question visible to the teacher and all classmates. |

## 07.C.4 Moderation Rules

Teachers can remove any post from their class thread at any time. Removed posts are soft-deleted — visible to Admin and HOD with a Removed indicator. HOD and Admin can remove any post in their department's threads. Removed posts are logged permanently on the thread record with the removing staff member's name and timestamp. Students cannot delete their own posts after 5 minutes of posting — after 5 minutes, a delete request goes to the teacher for approval.
