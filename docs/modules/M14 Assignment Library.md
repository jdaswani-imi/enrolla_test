---
module: "M14"
title: "Assignment Library"
layer: "Academic Operations"
folder: "04_Academic"
status: "Draft"
phase: "v1"
dependencies: [M11, M05]
tags: [enrolla, prd, academic, assignments]
---

# ENROLLA
# [[04_Academic-M14_Assignment_Library|M14]] — Assignment Library
v1.0 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

[[04_Academic-M14_Assignment_Library|M14]] is the homework and assignment management module for Enrolla. It provides a structured library for creating, organising, and assigning work to students, with full tracking of submission status, marks, and teacher feedback. All assignments link directly to the [[04_Academic-M11_Academic_Courses|M11]] topic tree, which automatically populates the [[04_Academic-M19_Progress_Tracking|M19]] progress tracker when work is marked. [[04_Academic-M14_Assignment_Library|M14]] covers the full assignment lifecycle from creation through to marking and parent-visible outcomes.

| **Property** | **Value** |
|---|---|
| Module code | [[04_Academic-M14_Assignment_Library|M14]] |
| Version | v1.0 |
| Status | Draft |
| Primary roles | Teacher, TA, HOD, Head of Subject, Academic Head, Admin Head, Super Admin |
| Excluded roles | Admin and HR/Finance cannot create or assign work. View-only access to assignment records for reporting purposes. |
| Phase 2 (Exaim) | AI question generation, AI grading, digital student submission, exam mode, timed assessments, past paper bank — all deferred to Exaim integration |
| Dependencies | [[04_Academic-M05_Timetabling_Scheduling|M05]], [[04_Academic-M07_Feedback_Communications|M07]], [[04_Academic-M11_Academic_Courses|M11]], [[07_Operations-M16_Task_Management|M16]], [[03_Student-M17_Student_Profile|M17]], [[04_Academic-M19_Progress_Tracking|M19]] |
| Phase | v1 |

---

# 01.1 Library Model — Curriculum Index, Not File Repository

The [[04_Academic-M14_Assignment_Library|M14]] assignment library is a structured curriculum index — an organised, collectively exhaustive record of all the work that exists across every subject, year group, and topic at IMI. It is not a file storage system. The actual worksheets, printed materials, textbook exercises, and physical resources live outside Enrolla. Enrolla holds the named record of each piece of work — what it is, what topic it covers, what grading scale applies, and what the instructions are.

| **What lives in Enrolla (the index)** | **What lives outside Enrolla (the resources)** |
|---|---|
| Assignment name and description | The actual printed worksheet or PDF file |
| Topic tags linking to [[04_Academic-M11_Academic_Courses|M11]] topic tree | Textbook page references |
| Grading scale and maximum score | Teacher's mark scheme documents |
| Instructions for the student | Scanned or digital copies of completed student work |
| Difficulty level and estimated time | IMI's Google Drive folder structure |
| Work type (Classwork, Homework, Test) | Locally stored teacher resources |
| Submission status, mark, and feedback | Printed classroom sets of materials |

A teacher can optionally attach a file (PDF, image, Word document) to an assignment record — for example a scanned worksheet or a reference sheet. This is entirely optional. The attachment is stored on the assignment record for teacher reference and is not automatically distributed to students in v1.

---

# 01.2 Library Structure

## 01.2.1 Organisation Hierarchy

| **Level** | **Detail** |
|---|---|
| Subject | The top-level organiser. Each assignment belongs to exactly one subject (e.g. Maths, Chemistry, English). Subjects come from the [[04_Academic-M11_Academic_Courses|M11]] catalogue. |
| Year Group | Each assignment is tagged to one or more year groups. A single assignment can apply to multiple year groups if the content is the same. |
| Topic | Each assignment is tagged to one or more topics from the [[04_Academic-M11_Academic_Courses|M11]] topic tree for that subject and year group. Topic tags drive the [[04_Academic-M19_Progress_Tracking|M19]] progress tracker update on marking. |
| Difficulty | Optional tag: Foundation, Standard, Challenge, or a custom level per subject. |
| Estimated time | Optional field. Teacher estimates how long the assignment should take in minutes. |

## 01.2.2 Folder-Based Library Structure

The assignment library is organised as a folder structure — navigable like a shared drive. The top-level folders map to IMI's three departments. Within each department, folders are organised by subject, then by year group.

| **Folder Level** | **Example at IMI** |
|---|---|
| Department (top level) | Primary / Lower Secondary / Upper Secondary |
| Subject | Maths / English / Science / Chemistry / Biology / Physics |
| Year group | Y4 / Y5 / Y6 (within Primary Maths, for example) |
| Assignments (file level) | Individual named assignment records within the year group folder |

| **Role** | **Default Folder Access** |
|---|---|
| Super Admin, Admin Head, Academic Head | All department folders — full control including create, rename, restructure, archive |
| HOD | Own department folders — full control. Can create sub-folders, restructure, and archive within their department. |
| Head of Subject | Own subject folder across all year groups — full control within that subject |
| Teacher | Own assigned subject and year group folders — read and write (create and publish assignments). Cannot restructure folders. |
| TA | Assigned students' subject folders — read only. Can assign published assignments to their assigned students. |
| Admin, HR/Finance | No access to library folders |

Any staff member with write access to a folder can share it explicitly with another staff member. Sharing is folder-level or individual assignment-level and is logged in the audit trail. Teachers cannot create new folders — only HOD and above can restructure the folder hierarchy.

## 01.2.3 Personal Drafts

Every staff member has a private My Drafts space — separate from the shared department folders. Draft assignments sit here until the creator publishes them. My Drafts is never visible to other staff. On publication, the assignment moves to the relevant subject and year group folder in the shared library.

## 01.2.4 Library Visibility and Ownership

| **Rule** | **Detail** |
|---|---|
| Draft assignments | Private to the creator. Not visible to other staff. Creator can edit freely without republishing. |
| Published assignments | Visible to all staff members with access to that subject. Can be assigned to any student in that subject by any eligible staff member. |
| Ownership | The creating staff member is the assignment owner. Only the owner can edit a published assignment. Editing a published assignment returns it to Draft status — it must be republished before it can be assigned again. |
| Version history | Each republish creates a new version. Prior versions are retained and visible from the assignment detail view. Previously assigned versions are not retroactively updated. |
| Archiving | Assignments can be archived by the owner or by HOD and above. Archived assignments cannot be assigned to new students but remain visible in the history of students who were previously assigned them. Warning shown when archiving an assignment: 'This assignment has [N] student submissions with recorded scores. Archiving will hide this assignment from the active library but all submission records and scores are retained in [[04_Academic-M19_Progress_Tracking|M19]] and the student audit trail. This action cannot be undone. Confirm archive?' |

---

# 01.3 Assignment Types

[[04_Academic-M14_Assignment_Library|M14]] supports one assignment type in v1: the physical assignment. This covers all work set outside the platform — printed worksheets, textbook exercises, verbal tasks, projects, and any other homework that a student completes and submits physically or verbally. The teacher logs and tracks the assignment entirely within Enrolla without requiring the student to interact with the platform.

## 01.3.1 Physical Assignment Fields

| **Field** | **Detail** |
|---|---|
| Title | Required. Short descriptive name shown on the student's assignment list and the teacher's marking view. |
| Subject | Required. Selected from the [[04_Academic-M11_Academic_Courses|M11]] catalogue. Determines which topic tree is available for tagging. |
| Year group(s) | Required. One or more year groups this assignment applies to. |
| Topic tags | Required. One or more topics from the [[04_Academic-M11_Academic_Courses|M11]] topic tree. These drive the [[04_Academic-M19_Progress_Tracking|M19]] progress tracker update when the assignment is marked. |
| Description | Required. Full assignment instructions visible to the teacher and, optionally, shared with the parent. Written in plain text. |
| Difficulty level | Optional. Foundation, Standard, Challenge, or subject-specific custom level. |
| Estimated time | Optional. Duration in minutes. Informational — shown to teacher and can be shared with parent. |
| Attachments | Optional. Teacher can attach reference files (PDF, image). Stored on the assignment record for teacher reference. |
| Work type | Required. Classwork / Homework / Test (dropdown). Determines how the score contributes to the student's predicted grade weighting in [[04_Academic-M19_Progress_Tracking|M19]]. |
| Maximum score | Required for graded assignments. Numeric value defining the total marks available for this assignment. |
| Grading scale | Required. Configurable per subject (e.g. percentage, letter grade, rubric score). Inherited from the subject's configured grading scale in [[04_Academic-M11_Academic_Courses|M11]]. Can be overridden per assignment. |
| Submission status | Tracks per-student status: Not Submitted / Submitted / Marked. |
| Notes to marker | Optional. Internal note from the assignment creator to the marking teacher. Not visible to students or parents. |

---

# 01.4 Creating an Assignment

## 01.4.1 Creation Flow

| **Step** | **Detail** |
|---|---|
| 1 — Open assignment builder | From: [[04_Academic-M14_Assignment_Library|M14]] library (New Assignment button), student profile (Assignments tab), or session detail view (Set Homework button). All routes open the same assignment builder. |
| 2 — Select subject | Dropdown from [[04_Academic-M11_Academic_Courses|M11]] catalogue filtered to the staff member's assigned subjects. HOD, Academic Head, Admin Head, and Super Admin see all subjects. |
| 3 — Select year group(s) | Multi-select. Defaults to the year group of the student or class if entering from a student profile or session. |
| 4 — Tag topics | Multi-select from the [[04_Academic-M11_Academic_Courses|M11]] topic tree for the chosen subject and year group. At least one topic is required. |
| 5 — Fill assignment fields | Title, description, difficulty, estimated time, attachments, notes to marker. |
| 6 — Set grading scale | Defaults to the subject's configured scale. Override here if this assignment uses a different scale. |
| 7 — Save as Draft or Publish | Draft: saved privately, not assignable. Publish: available to all eligible staff to assign to students. |

## 01.4.2 Library Search and Reuse

Before creating a new assignment, staff can search the existing library. Search filters by subject, year group, topic, difficulty, status, creator, and date range. If a matching assignment exists, the staff member can assign it directly without creating a duplicate. If the existing assignment needs modification, the owner can edit it or the staff member can clone it to create their own version.

---

# 01.5 Grading Scales

Each subject in the [[04_Academic-M11_Academic_Courses|M11]] Subject Builder is configured with a default grading scale. Grading scales are built from platform-level templates in [[09_Settings-M20_Tenant_Settings|M20]] and can be customised per subject or overridden per individual assignment.

| **Template Name** | **Scale** | **Example Use** |
|---|---|---|
| Percentage | 0–100% | General use; any subject where raw score out of 100 is appropriate |
| GCSE Numeric | 1–9 (9 highest) | Y10–Y11 subjects following GCSE specification |
| A-Level Grade | A*, A, B, C, D, E, U | Y12–Y13 subjects following A-Level specification |
| IB Grade | 1–7 (7 highest) | Y12–Y13 subjects following IB Diploma Programme |
| Primary Descriptor | Beginning, Developing, Secure, Mastery | KG1–Y6 subjects using attainment descriptors |
| Score out of N | Teacher sets the maximum (e.g. out of 20, out of 50) | Any subject where raw mark out of a custom total is preferred |
| Custom | Fully configurable by Super Admin in [[09_Settings-M20_Tenant_Settings|M20]] | Tenant-specific grading conventions |

---

# 01.6 Assigning Work to Students

## 01.6.1 Assignment Flow

| **Step** | **Detail** |
|---|---|
| 1 — Select assignment | From the library, student profile assignments tab, or session detail. |
| 2 — Select recipients | Individual student, named group, or all students in a class session. Individual due dates can be set per student after bulk assignment. |
| 3 — Set due date | Required. Warning shown if due date falls on an office closure day (Sunday at IMI) or outside configured office hours. No hard block. |
| 4 — Optional note | Short message from the teacher to the student(s) about this specific assignment instance. Visible on student profile. |
| 5 — Confirm | Assignment is logged against each recipient's record. Appears immediately in the teacher's marking view and in the student's Assignments tab on their [[03_Student-M17_Student_Profile|M17]] profile. |

## 01.6.2 Assignment Record per Student

When an assignment is set for a student, an individual assignment record is created on that student's profile tracking the full lifecycle independently of other students.

| **Field** | **Detail** |
|---|---|
| Assignment | Link to the library assignment record — title, subject, topic tags, description, grading scale |
| Set by | Staff member who assigned it — name and role |
| Set date | DD/MM/YYYY HH:MM |
| Due date | DD/MM/YYYY as configured at assignment |
| Status | Not Submitted / Submitted / Late / Excused |
| Submission date | Date teacher marks it as submitted. Blank until marked. |
| Mark | Grade or score in the subject's configured grading scale. Blank until marked. |
| Feedback | Teacher's written feedback for this student on this assignment |
| [[04_Academic-M19_Progress_Tracking|M19]] update triggered | Yes / No — whether this assignment's mark has been pushed to the [[04_Academic-M19_Progress_Tracking|M19]] progress tracker |

---

# 01.7 Submission Tracking and Marking

## 01.7.1 Submission Statuses

| **Status** | **Meaning and Trigger** |
|---|---|
| Not Submitted | Default status from the moment the assignment is set |
| Submitted | Teacher marks the assignment as received. Due date is not yet passed. |
| Late | Teacher marks as received after the due date. System flags Late automatically if the teacher marks it submitted after the due date. |
| Excused | Teacher marks the assignment as excused — the student is not expected to submit. Reason can be logged. Excused assignments do not count against the student's submission rate in [[04_Academic-M19_Progress_Tracking|M19]]. |
| Not Submitted — Overdue | System automatically adds the Overdue indicator when the due date has passed and status is still Not Submitted. Overdue is an additional indicator, not a separate status. |

## 01.7.2 Marking and Feedback

| **Marking Field** | **Detail** |
|---|---|
| Mark | Required to trigger [[04_Academic-M19_Progress_Tracking|M19]] update. Entered in the subject's grading scale. If the grading scale is Score out of N, the teacher enters both the score achieved and the maximum for that specific assignment. |
| Feedback | Free text. No minimum length. Teacher writes qualitative feedback on the student's work. Feeds into [[04_Academic-M07_Feedback_Communications|M07]] feedback records. |
| Mark date | Auto-set to today when the mark is saved. Editable if the teacher is logging a mark retroactively. |
| Share with parent | Toggle. When enabled, the mark and feedback are included in the next [[04_Academic-M19_Progress_Tracking|M19]] progress report sent to the parent. Default: on. |

When a teacher marks a physical assignment and records a score, the score is automatically written to the [[04_Academic-M19_Progress_Tracking|M19]] progress tracker for the linked student-subject-topic. This auto-population happens on save — the teacher does not need to navigate to [[04_Academic-M19_Progress_Tracking|M19]] separately. The progress tracker entry shows: assignment name, work type, score, date marked, and a link back to the assignment record in [[04_Academic-M14_Assignment_Library|M14]].

## 01.7.3 Marking View Filters

The marking view shows all assignments across all the teacher's students that require action. Filterable by: status, subject, student, due date range, year group.

## 01.7.4 Bulk Marking

Teachers can select multiple assignment records in the marking view and apply the same action in bulk — for example, marking a full class's assignment as Submitted after collecting physical books. Individual feedback must be written per student — feedback cannot be bulk-applied.

---

# 01.8 Work Types and Predicted Grade Weighting

Every scored piece of work belongs to one of four work types. The work type determines how that score contributes to the student's predicted grade in [[04_Academic-M19_Progress_Tracking|M19]]. HODs configure the weighting per subject in the [[04_Academic-M11_Academic_Courses|M11]] Subject Builder.

## 01.8.1 Work Types

| **Work Type** | **Description** |
|---|---|
| Classwork | Work completed during the session — worksheets, exercises, in-class tasks. Logged via Quick Score Entry from the session view. |
| Homework | Work set and completed outside sessions. Set via [[04_Academic-M14_Assignment_Library|M14]] assignment flow. Mark logged via [[04_Academic-M14_Assignment_Library|M14]] or from the session view on the due date. |
| Test | Formal in-class tests, topic tests, mock exams, assessments. Logged via Quick Score Entry with Test work type selected. |
| Other | Oral responses, presentations, practical work, verbal comprehension checks, any scored work that does not fit the above categories. |

## 01.8.2 Predicted Grade Weighting

| **Weighting Option** | **How It Works** |
|---|---|
| Equal weight | All work types contribute equally to the predicted grade. The system averages all scored attempts across all work types for each topic, then aggregates across topics. |
| Custom weight | HOD assigns a percentage to each work type. Percentages must total 100%. Example: Chemistry Y11 — Tests 50%, Classwork 30%, Homework 20%. |

---

# 01.9 [[04_Academic-M19_Progress_Tracking|M19]] Progress Tracker Linking

Every assignment in [[04_Academic-M14_Assignment_Library|M14]] is tagged to one or more topics from the [[04_Academic-M11_Academic_Courses|M11]] topic tree. When a teacher records a mark for a student's assignment, the platform automatically updates the [[04_Academic-M19_Progress_Tracking|M19]] progress tracker for each tagged topic.

| **Scenario** | **[[04_Academic-M19_Progress_Tracking|M19]] Outcome** |
|---|---|
| Assignment marked for the first time | [[04_Academic-M19_Progress_Tracking|M19]] creates or updates a topic entry for each tagged topic with the assignment mark, date, and assignment title as the source reference. |
| Assignment marked for the second time (revised mark) | [[04_Academic-M19_Progress_Tracking|M19]] updates the existing entry for each tagged topic with the new mark. Prior mark is retained in the assignment version history. |
| Assignment excused | No [[04_Academic-M19_Progress_Tracking|M19]] update. Excused assignments are excluded from topic coverage and submission rate calculations. |
| Assignment not yet marked | No [[04_Academic-M19_Progress_Tracking|M19]] update. Submitted but unmarked assignments appear as Pending in [[04_Academic-M19_Progress_Tracking|M19]] until a mark is recorded. |
| Multiple topics tagged | [[04_Academic-M19_Progress_Tracking|M19]] updates all tagged topics simultaneously with the same mark. |
| Mark deleted or reset | [[04_Academic-M19_Progress_Tracking|M19]] entry for the affected topics is flagged as Unconfirmed until a new mark is recorded. |

In the [[04_Academic-M19_Progress_Tracking|M19]] progress tracker, assignment-sourced entries are clearly distinguished from teacher-entered manual progress entries. Each topic row in [[04_Academic-M19_Progress_Tracking|M19]] shows the source of the most recent update.

---

# 01.10 Assignment History per Student

Every student has a complete assignment history accessible from their [[03_Student-M17_Student_Profile|M17]] student profile under the Assignments tab.

| **History View Element** | **Detail** |
|---|---|
| Assignment list | Sorted by due date descending. Filterable by subject, status, date range, and topic. |
| Summary stats | Submission rate (% of assignments submitted on time), average mark across all marked assignments, subject-by-subject breakdown. |
| Topic coverage map | Visual map of which [[04_Academic-M11_Academic_Courses|M11]] topics have been assessed through assignments and the most recent mark for each. Links to the [[04_Academic-M19_Progress_Tracking|M19]] topic tracker. |
| Trend indicator | Whether the student's marks are improving, declining, or stable across the last 5 marked assignments per subject. |
| Overdue count | Count of currently overdue assignments highlighted at the top of the view. Admin and HOD see this count on the student profile header. |

---

# 01.11 Notifications and Automations

| **Trigger** | **Recipient** | **Channel** |
|---|---|---|
| Assignment set for student | Teacher (confirmation) | In-app |
| Assignment due date approaching — 24 hours | Teacher (reminder to follow up if not yet marked as submitted) | In-app |
| Assignment overdue — not submitted by due date | Teacher, HOD | In-app |
| Assignment marked — feedback available | Parent (copy-paste message generated for Admin or teacher to send) | Copy-paste WhatsApp or email |
| Student has submitted fewer than 50% of assignments at session halfway point | Teacher, HOD | In-app |
| Teacher has not set assignments for active group after 2 consecutive sessions | HOD, Teacher | In-app |
| [[04_Academic-M19_Progress_Tracking|M19]] update triggered by assignment mark | No notification — silent background update | System |

---

# 01.12 PDF and Word Export

## 01.12.1 Export Content

| **Export Element** | **Detail** |
|---|---|
| Header | Tenant name and logo (from [[09_Settings-M20_Tenant_Settings|M20]] branding). Subject, year group, assignment title, difficulty level, estimated time. |
| Student section | If exported for a specific student: student name, teacher name, due date, optional note to student. If exported as a blank template: these fields are left blank. |
| Instructions | Full assignment description and instructions as written in the library. |
| Attachments | Any attached reference files are included as appendices in the PDF export or as separate files in the Word export. |
| Answer space | Optional blank answer lines or answer boxes below each instruction section. Teacher configures whether to include answer space at export time. |
| Footer | Tenant name, page number, assignment title. |

## 01.12.2 Export Options

| **Option** | **Detail** |
|---|---|
| Format | PDF (for printing or sharing) or Word .docx (for editing before distribution) |
| Student-specific | Export pre-filled with a specific student's name and due date, or export as a blank template for the whole class |
| Batch export | Export the same assignment for multiple students simultaneously — generates one file per student, all named with the student's name |

---

# 01.13 Role-Based Access

| **Role** | **Library Access** | **Create / Assign** | **Mark / Feedback** |
|---|---|---|---|
| Super Admin | Full — all subjects | Yes — all subjects and students | Yes — all students |
| Admin Head | Full — all subjects | Yes — all subjects and students | Yes — all students |
| Academic Head | Full — all subjects | Yes — all subjects and students | Yes — all students |
| HOD | Full — own department subjects | Yes — own department | Yes — own department students |
| Head of Subject | Full — own subject(s) | Yes — own subject(s) | Yes — own subject students |
| Teacher | Own subjects — published only | Yes — own students and class groups | Yes — own students |
| TA | Own subjects — published only | Yes — assigned students only | Yes — assigned students |
| Admin | View only — all subjects | No | No |
| HR/Finance | No access | No | No |

---

# [[04_Academic-M14_Assignment_Library|[[04_Academic-M14_Assignment_Library|M14]].A]] — Assignment Library Addendum

This section supplements [[04_Academic-M14_Assignment_Library|M14]] v1.0 with three clarifications: (1) the correct mental model for the assignment library; (2) the folder-based library structure with shared access control; and (3) the Quick Score Entry system for classwork.

## 14.A.1 Quick Score Entry — Classwork Scoring from the Session View

Quick Score Entry is the fast, lightweight interface for logging classwork scores during or immediately after a session. It lives inside the [[04_Academic-M05_Timetabling_Scheduling|M05]] session attendance view — the same screen where the teacher marks attendance — so scores can be logged in the same workflow without navigating away. All scores entered via Quick Score Entry feed directly into the [[04_Academic-M19_Progress_Tracking|M19]] progress tracker for each student against the tagged topic.

Quick Score Entry satisfies the [[07_Operations-M13_Automation_Communications|M13]] automation requirement — a classwork score counts as a progress update for that session. The 24-hour tracker update alert does not fire if at least one classwork score has been logged for the session.

## 14.A.2 Entry Points

| **Entry Point** | **Detail** |
|---|---|
| From session attendance view ([[04_Academic-M05_Timetabling_Scheduling|M05]]) | Primary entry point. After marking attendance, the teacher sees an Add Classwork Scores panel directly below the attendance register on the same screen. No navigation required. |
| From student profile ([[03_Student-M17_Student_Profile|M17]]) | Secondary entry point. Teacher opens a student profile, goes to the Progress tab, and taps Add Score next to any topic. A modal appears for single-student score entry. Used for one-off additions or retroactive corrections. |

## 14.A.3 Same for All vs Different per Student

When adding a classwork item, the teacher first selects whether the work is the same for every student in the session or different per student.

| **Mode** | **Detail** |
|---|---|
| Same for all (default) | One topic, one work type, one maximum score applies to all students in the session. Teacher fills in a score per student down a single column. Fastest option for standard sessions. |
| Different per student | Each student row has its own topic dropdown, work type selector, and maximum score field. Used when students are on differentiated work. |

## 14.A.4 Classwork Item Fields

| **Field** | **Detail** |
|---|---|
| Topic | Required. Dropdown from the [[04_Academic-M11_Academic_Courses|M11]] topic tree for the session's subject and year group. |
| Work type | Required. Options: Classwork, Test, Other. Homework is set and tracked via [[04_Academic-M14_Assignment_Library|M14]] — it appears in this view for marking but is not created here. |
| Out of (maximum) | Required. The maximum score for this item. |
| Score | Required per student. Numeric entry. If the student is marked Absent, their score cell shows ABS and is automatically set to zero tagged with reason: Absent. |
| Late flag | Checkbox per student. Ticked if the student was supposed to have submitted prior work and did not. For homework appearing in this view, Late is applied automatically if the mark is logged after the due date. |
| Notes | Optional. Short free-text note per student for that item — used for quick observations (e.g. 'completed with support'). |

## 14.A.5 Date of Completion

The date of completion is set automatically by the system to the current date at the moment the teacher saves the score entry. The teacher can adjust the date manually if they need to backdate it to the actual session date. Time is not recorded for classwork scores — date only (DD/MM/YYYY).

## 14.A.6 Multiple Classwork Items per Session

A teacher can add as many classwork items as needed for a single session. After saving the first item, they tap Add another classwork item and a new entry panel appears. All items are associated with the same session date. All items for the session are saved in one Save all action.

## 14.A.7 Absent Students and Automatic Zeros

| **Scenario** | **System Behaviour** |
|---|---|
| Student marked Absent in attendance | Score cell shows ABS for all classwork items in that session. System automatically records zero for each item tagged with reason: Absent. Visible in attempt history as a zero with the absent indicator — not treated the same as a genuine zero score. |
| Student absent on day homework was due | Homework record is automatically flagged as Late with reason: Absent. Zero is applied if no prior submission was recorded. Teacher can override if the student submitted the homework before the absent day. |
| Student submits homework before absent day | If the teacher already logged the homework as Submitted before the absent day, the Absent flag does not apply a zero — the prior submission stands. |

## 14.A.8 Attempt Tracking

Every score logged for the same topic for the same student is recorded as a separate attempt in [[04_Academic-M19_Progress_Tracking|M19]]. The system tracks: attempt number, date, score, work type, late flag, and session reference. [[04_Academic-M19_Progress_Tracking|M19]] displays attempt history per topic — how many times the student has worked on that topic, when each attempt was, and whether scores are improving, stable, or declining across attempts.

## 14.A.9 Homework in the Session View

Homework assignments previously set via [[04_Academic-M14_Assignment_Library|M14]] for the students in this session also appear in the session view when the homework due date matches the session date. The teacher can mark submission status and log the mark directly from the session — they do not need to navigate to [[04_Academic-M14_Assignment_Library|M14]]. The homework entry in the session view is pre-populated with the assignment name, topic tags, and grading scale from the [[04_Academic-M14_Assignment_Library|M14]] record.

## 14.A.10 How Quick Score Entry Feeds [[04_Academic-M19_Progress_Tracking|M19]]

| **Score Entry Action** | **[[04_Academic-M19_Progress_Tracking|M19]] Outcome** |
|---|---|
| Classwork score saved for a student | [[04_Academic-M19_Progress_Tracking|M19]] creates a new attempt entry for each tagged topic — score, date, work type (Classwork), session reference. |
| Test score saved for a student | [[04_Academic-M19_Progress_Tracking|M19]] creates a new attempt entry — score, date, work type (Test), session reference. Test scores can carry a higher weight in the predicted grade if HOD has configured Test weighting in [[04_Academic-M11_Academic_Courses|M11]]. |
| Homework mark logged from session view | [[04_Academic-M19_Progress_Tracking|M19]] updates the homework attempt entry for each [[04_Academic-M14_Assignment_Library|M14]]-tagged topic — identical behaviour to marking from [[04_Academic-M14_Assignment_Library|M14]] directly. |
| Auto-zero from absent student | [[04_Academic-M19_Progress_Tracking|M19]] records the zero attempt with reason: Absent. Included in attempt history and included in predicted grade calculation — absent zeros count as zero scores toward averages and predicted grades. The Absent flag is retained on the attempt record for context. |
| Late flag applied | [[04_Academic-M19_Progress_Tracking|M19]] records the late indicator on the attempt. Submission rate calculation counts late submissions as submitted-but-late, not as missing. |
| Score revised by teacher | [[04_Academic-M19_Progress_Tracking|M19]] updates the attempt with the revised score. Prior score retained in attempt history. Predicted grade recalculates immediately. |
