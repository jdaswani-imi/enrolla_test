---
module: "M11"
title: "Academic Courses & Catalogue"
layer: "Academic Operations"
folder: "04_Academic"
status: "Draft"
phase: "v1"
dependencies: [M05]
tags: [enrolla, prd, academic, catalogue]
---

# ENROLLA
# [[04_Academic-M11_Academic_Courses|M11]] — Academic Courses & Catalogue
v1.1 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

[[04_Academic-M11_Academic_Courses|M11]] is the curriculum and catalogue layer for Enrolla. It owns the definition of every subject, pricing rule, billing cadence, session type, package, grade boundary, and exam event in the platform. All other modules that reference academic or pricing data draw from [[04_Academic-M11_Academic_Courses|M11]] as the authoritative source. The invoice builder ([[06_Finance-M08_Finance_Billing|M08]]) pulls rates automatically from the catalogue. The progress tracker ([[04_Academic-M19_Progress_Tracking|M19]]) is structured by [[04_Academic-M11_Academic_Courses|M11]] topic trees. The timetable ([[04_Academic-M05_Timetabling_Scheduling|M05]]) validates session durations against [[04_Academic-M11_Academic_Courses|M11]] subject definitions at the point of scheduling.

| **Property** | **Value** |
|---|---|
| Module code | [[04_Academic-M11_Academic_Courses|M11]] |
| Version | v1.0 |
| Status | Draft |
| Primary roles | Admin Head, Super Admin, HOD, Head of Subject |
| Secondary roles | Academic Head (topic tree, grade boundaries, target grades), Admin (view + limited edit), Teacher (view, target grade edit) |
| Data consumers | [[04_Academic-M05_Timetabling_Scheduling|M05]] (scheduling), [[06_Finance-M08_Finance_Billing|M08]] (billing), [[08_Management-M10_Management_Dashboard|M10]] (occupancy, revenue), [[03_Student-M17_Student_Profile|M17]] (student profile), [[04_Academic-M19_Progress_Tracking|M19]] (progress tracking) |
| Scope | Org-level catalogue — shared across all branches. Branch-level pricing overrides not supported in v1. |
| Dependencies | [[04_Academic-M05_Timetabling_Scheduling|M05]], [[04_Academic-M06_Attendance_Makeups|M06]], [[06_Finance-M08_Finance_Billing|M08]], [[04_Academic-M19_Progress_Tracking|M19]], [[09_Settings-M20_Tenant_Settings|M20]] |
| Phase | v1 |

---

# 01.1 Core Definitions — Subject vs Course

| **Term** | **Definition** |
|---|---|
| Subject | The atomic, bookable, billable unit in the catalogue. A subject is always tied to a specific year group, session duration, and session type. It is the item that appears on invoices, timetables, and student profiles. Examples: Maths Y7 (60 min Group), English Y10 (60 min Private), Biology Y11 (60 min Group). |
| Course | The academic qualification context for a student's enrolment in a subject. A course adds the qualification route, exam board, and specifier on top of a subject. A course is not a separate catalogue item — it is the combination of subject + enrolment-level qualification data. |

In practice: Admin creates subjects in the catalogue. When enrolling a student, Admin selects the subject and then specifies the qualification route, exam board, and specifier for that student's enrolment. Two students can be in the same subject but on different courses — for example, one student doing GCSE AQA Higher and another doing GCSE Edexcel Foundation in the same Biology Y10 class.

---

# 01.2 Department and Phase Structure

IMI operates across three academic departments plus an Enrichment category. Each department is subdivided into phases that correspond to UK Key Stage groupings.

| **Department** | **Phase** | **Year Groups** | **Age Range** |
|---|---|---|---|
| Primary | EYFS | FS1 / Nursery, FS2 / KG1 | Ages 3–5 |
| Primary | KS1 | Year 1, Year 2 | Ages 5–7 |
| Primary | KS2 | Year 3, Year 4, Year 5, Year 6 | Ages 7–11 |
| Lower Secondary | KS3 | Year 7, Year 8, Year 9 | Ages 11–14 |
| Upper Secondary | KS4 | Year 10, Year 11 | Ages 14–16 |
| Upper Secondary | KS5 | Year 12, Year 13 | Ages 16–18 |
| Enrichment | — | Ages vary by programme | Ages 7–18+ |

## 01.2.1 Qualification Routes by Department

| **Department / Phase** | **Qualification Route Options** | **Exam Board** |
|---|---|---|
| Primary (EYFS, KS1, KS2) | UK (British), IB, Other | N/A — not applicable at primary level |
| Lower Secondary (KS3) | UK (British), MYP, Other | N/A — not applicable at KS3 |
| Upper Secondary KS4 | GCSE, IGCSE, IB MYP | GCSE/IGCSE: AQA, Pearson Edexcel, OCR, WJEC, CCEA, Cambridge (CIE). IB MYP: IB Organisation. |
| Upper Secondary KS5 | A-Level, International A-Level (IAL), IB Diploma | A-Level/IAL: AQA, Pearson Edexcel, OCR, WJEC, CCEA. IB Diploma: IB Organisation. |
| Enrichment | N/A | N/A |

## 01.2.2 Specifiers by Qualification Route

| **Qualification** | **Available Specifiers** | **Notes** |
|---|---|---|
| GCSE | Higher Tier, Foundation Tier | Higher = grades 4–9. Foundation = grades 1–5. |
| IGCSE (Cambridge CIE) | Extended, Core | Extended = equivalent to Higher. Core = equivalent to Foundation. |
| IGCSE (Edexcel) | Higher Tier, Foundation Tier | Same labels as GCSE. |
| A-Level / IAL | AS Level, A2 Level, Full A-Level | AS = Year 12 content only. A2 = Year 13 content. Full = complete 2-year course. |
| IB Diploma | HL (Higher Level), SL (Standard Level) | Students must take 3 HL and 3 SL subjects. See 01.2.3 for Maths exception. |
| IB MYP — Mathematics | Standard Mathematics, Extended Mathematics | Only Maths has a tier distinction in MYP. |
| IB MYP — all other subjects | Standard (no tier) | No specifier required for non-Maths MYP subjects. |
| Primary / KS3 | N/A | No specifier applicable. |

## 01.2.3 IB Diploma Mathematics Specifiers

IB Diploma Mathematics has an additional layer of specification beyond HL/SL.

| **IB Maths Specifier** | **Description** |
|---|---|
| Analysis and Approaches (AA) — HL | Algebraic and calculus-heavy route. Higher Level. |
| Analysis and Approaches (AA) — SL | Algebraic and calculus-heavy route. Standard Level. |
| Applications and Interpretation (AI) — HL | Statistics and modelling-heavy route. Higher Level. |
| Applications and Interpretation (AI) — SL | Statistics and modelling-heavy route. Standard Level. |

---

# 01.3 Subject Builder

The subject builder is the interface through which Admin Head and Super Admin create and manage the subjects available in the catalogue.

## 01.3.1 Subject Fields

| **Field** | **Specification** |
|---|---|
| Subject name | The name of the subject as it appears on invoices, timetables, and profiles. Names can be duplicated across the organisation — uniqueness is enforced by the combination of name + year group + session duration + session type. |
| Year group | Required. A subject is always tied to a single year group. If the same subject is offered across multiple year groups, a separate subject record is created per year group. |
| Department | Auto-assigned from the year group based on the department mapping in [[09_Settings-M20_Tenant_Settings|M20]]. Can be overridden by Admin Head or Super Admin. |
| Session duration | Select from: 45 minutes, 60 minutes, or 120 minutes only. No other durations are permitted. 45 minutes is available for Primary year groups only. 120 minutes is available for all year groups as a double session. |
| Session type | Group or Private. If a subject is offered in both session types, two separate subject records are created — one for Group and one for Private — with the same name and year group but different session types and rates. |
| Per-session rate | The rate charged per session unit in AED, excluding VAT. For Group sessions, the rate is set per year group pricing tier. For Private sessions, the rate is AED 300 flat. |
| Trial toggle | On or Off. When On, the subject can be booked as a trial session. A separate trial price is set when the toggle is enabled. |
| Trial price | Applicable only when the trial toggle is On. Set independently of the session rate. IMI defaults: Primary AED 250, Secondary AED 300. |
| Revenue tag | Mandatory. Maps the subject to a department revenue segment and corresponding bank account. Options: Primary (FS1–Y6), Lower Secondary (Y7–Y9), Upper Secondary (Y10–Y13). |
| Description | Optional. Displayed on the online booking page if external booking is enabled. |
| Status | Active or Archived. See 01.3.3 for archiving rules. |

## 01.3.2 Subject Naming Convention at IMI

IMI creates one subject record per subject per year group. The naming convention appends the year group to the subject name. Session type and duration are stored as fields and not repeated in the name unless a variant distinction is necessary.

| **Example Subject Name** | **Fields** |
|---|---|
| Maths Y7 | Subject: Maths, Year Group: Y7, Duration: 60 min, Type: Group |
| Maths Y7 (Private) | Subject: Maths, Year Group: Y7, Duration: 60 min, Type: Private |
| English Y10 | Subject: English, Year Group: Y10, Duration: 60 min, Type: Group |
| Biology Y11 | Subject: Biology, Year Group: Y11, Duration: 60 min, Type: Group |
| Maths FS2 | Subject: Maths, Year Group: FS2, Duration: 45 min, Type: Group |

## 01.3.3 Subject Archiving

| **Condition** | **System Behaviour** |
|---|---|
| Subject has zero active enrolments | Archive proceeds immediately. Subject is removed from the subject selector for new enrolments. Existing records are unaffected. |
| Subject has one or more active enrolments | System displays a warning: 'This subject has [N] active enrolments with sessions remaining. Archiving will prevent new students from being assigned but will not affect existing enrolments.' Admin must confirm to proceed. |
| After archiving with active enrolments | Existing students continue their sessions normally until their enrolment expires. No new students can be assigned to the archived subject. The subject remains visible in historical records, invoices, and reports. |
| Unarchiving | Admin Head or Super Admin can restore an archived subject to Active status at any time. |

## 01.3.4 Subject Renaming

Subject names can be changed at any time by Admin Head or Super Admin. The rename applies going forward only — all historical invoices, session records, and reports retain the subject name as it was at the time of creation. Students and guardians who received invoices under the old name will see the old name on those historical invoices.

---

# 01.4 Session Durations and Billing Units

IMI offers three permitted session durations. All other durations are blocked at subject creation and at scheduling. The session duration defined in the subject record is the standard billing unit for that subject.

| **Duration** | **Billing Units** | **Availability** |
|---|---|---|
| 45 minutes | 1 unit | Primary year groups only (EYFS, KS1, KS2). Not available for KS3 and above. |
| 60 minutes | 1 unit | All year groups. Standard duration for KS3, KS4, KS5, and Enrichment. |
| 120 minutes | 2 units | All year groups. Double session — billed as 2 standard units on the invoice. |

90-minute sessions are not offered at IMI and are blocked platform-wide. If a 90-minute session is attempted in the subject builder or in the timetable ([[04_Academic-M05_Timetabling_Scheduling|M05]]), the system displays a blocking error. Admin cannot override this restriction.

Deduction occurs at attendance confirmation, not at scheduling. If a session is marked as absent, no deduction occurs. If a session is marked as a makeup, a makeup unit is consumed instead of a paid session unit.

---

# 01.5 Session Types and Pricing

## 01.5.1 Group Session Pricing — IMI Rate Card

Group sessions are priced according to IMI's year group rate card. Secondary year groups use frequency-based tier pricing. Primary year groups use fixed rates per year group.

| **Year Group / Frequency** | **Rate per Session (AED excl. VAT)** |
|---|---|
| Primary FS1–FS2 (EYFS) | 160 |
| Primary Y1–Y3 (KS1 + early KS2) | 170 |
| Primary Y4–Y6 (KS2) | 180 |
| Primary Science Y4–Y6 — combo rate | 150 (when enrolled in Maths + English, min 10 sessions each) |
| Secondary Y7–Y9 — 1 session/week | 200 |
| Secondary Y7–Y9 — 2 sessions/week | 180 |
| Secondary Y7–Y9 — 3+ sessions/week | 160 |
| Secondary Y10 — 1–2 sessions/week | 180 |
| Secondary Y10 — 3 sessions/week | 150 |
| Secondary Y10 — 4+ sessions/week | 125 |
| Secondary Y11 — 1–2 sessions/week | 200 |
| Secondary Y11 — 3 sessions/week | 180 |
| Secondary Y11 — 4+ sessions/week | 150 |
| Secondary Y12–Y13 — 1 session/week | 200 |
| Secondary Y12–Y13 — 2 sessions/week | 180 |
| Secondary Y12–Y13 — 3+ sessions/week | 160 |
| Senior | AED 350 per session | For adult learners and external professionals in the Senior student category |
| CAT4 assessment | 200 per session |

## 01.5.2 Primary Science Combo Rate

Science at Y4–Y6 is priced at AED 150 per session when the student is simultaneously enrolled in both Maths and English with a minimum of 10 sessions each for the current term. If either condition is not met, Science reverts to the standard AED 180 rate. The system evaluates combo eligibility automatically at invoice generation and recalculates if enrolments change mid-term.

**Bundle Eligibility Monitoring:**
Bundle eligibility is checked at invoice creation and on every mid-term enrolment change. When a student loses bundle eligibility mid-term (withdraws from Maths or English, or falls below 10 sessions in either), the system flags the change to Admin and calculates the Science rate adjustment from the change date. Admin reviews and confirms before any financial document is generated. Admin Head is notified of the rate change. No financial document is auto-fired — Admin confirmation is always required.

## 01.5.3 Secondary Frequency Tier Calculation

| **Rule** | **Detail** |
|---|---|
| Counting method | Total weekly sessions across all enrolled subjects for that student in the same department |
| Same-subject count | Two sessions of Maths per week count as 2 toward the weekly total |
| Tier applies to | All sessions for that student at that tier rate — not just the sessions above the threshold |
| Minimum sessions | Minimum 10 sessions per subject to qualify for frequency tier pricing. This minimum can be manually overridden by Admin or above with a logged reason. |
| Mid-term add | Adding a subject mid-term may increase the tier — recalculate up, issue credit/adjustment for the difference. |
| Mid-term remove | Removing a subject mid-term may reduce the tier — recalculate down, credit reduced by the difference. |

## 01.5.4 Private Session Pricing

Private (one-to-one) sessions are priced at a flat rate of AED 300 per session, regardless of subject, year group, or frequency. No frequency tier discounts apply. No minimum session count is required. All subjects must appear as separate line items on the invoice even though the rate is the same — this ensures session units accumulate correctly on the student's profile per subject.

## 01.5.5 Trial Sessions

Each subject has a trial toggle in the subject builder. When the toggle is On, the subject can be booked as a trial session at the configured trial price. Trial sessions are one-off bookings that sit outside the standard session cap and do not consume from any invoice balance.

| **Trial Field** | **Detail** |
|---|---|
| Trial toggle | On or Off per subject. Default: On for all IMI subjects. |
| Trial price | Set independently per subject. IMI defaults: Primary AED 250, Secondary AED 300. |
| Trial invoice | A separate trial invoice is generated for trial sessions. Trial invoices are not part of term package billing. |
| Trial outcome | Recorded as a Trial Class Outcome card on the student profile ([[03_Student-M17_Student_Profile|M17]]). Read-only after completion. |

---

# 01.6 Billing Cadence

Each subject has a default billing cadence set in the catalogue. Admin can override the cadence for a specific student at the point of invoicing.

| **Cadence Type** | **Description** |
|---|---|
| Termly | One invoice per academic term per subject. Standard cadence for all IMI regular sessions. |
| Monthly | One invoice per calendar month. For students on rolling monthly arrangements. |
| Weekly | One invoice per week. For ad-hoc or workshop-style bookings. |
| Annual | One invoice per academic year. For annual programme pricing. |
| One-off | A single invoice for a fixed set of sessions. Does not recur. |
| Per-session | One invoice per session attended. Generated automatically after attendance is confirmed. |

---

# 01.7 Package Builder

The package builder allows Admin Head and Super Admin to create, edit, and manage multi-subject billing packages. A package is a named bundle of subjects sold to a parent at a fixed total price.

## 01.7.1 Package Fields

| **Field** | **Specification** |
|---|---|
| Package name | The name displayed to parents on invoices and booking confirmations |
| Subjects included | One or more subjects selected from the active subject catalogue. Each subject must have its own session count or unlimited toggle. |
| Fixed price | The total price for the entire package in AED, excluding VAT |
| Sessions per subject | The fixed number of sessions allocated per subject within the package. Required unless the unlimited toggle is on. |
| Unlimited sessions | Toggle on or off. When on, the student can attend an unlimited number of sessions for the included subjects within the validity date range. |
| Makeup toggle | On or Off per package. When on, the standard departmental makeup allowance applies. Makeup sessions sit outside the session cap — they replace missed sessions without consuming from the paid balance. |
| Pro rata toggle | On or Off per enrolment. Must be actively toggled on by Admin when enrolling a student mid-term. Default is off — full package price applies unless Admin enables the toggle. |
| Enrolment limit/week | Optional cap on the maximum number of sessions a student can attend per week across all subjects in the package. |
| Registration fee | Optional toggle. When on, an additional registration fee line item is added to the package invoice. |
| Revenue tag | Mandatory. Maps the entire package to a department revenue segment and bank account. All subjects within the package follow the package-level revenue tag. |
| Status | Active or Archived. Archiving a package with active student enrolments follows the same warn-and-confirm flow as subject archiving. |

**Note on package validity:** Package validity is defined by the enrolled term. A separate validity date range is not configured on the package — validity equals the term for which the student is enrolled.

## 01.7.2 Package Makeup Session Logic

| **Scenario** | **Outcome** |
|---|---|
| Student paid for 10 sessions, attends 9, misses 1, makeup toggle on | Makeup session allocated outside the cap. Student receives 10 attended sessions total as paid for. |
| Student paid for 10 sessions, attends 9, misses 1, makeup toggle off | Missed session is forfeited. Student receives 9 attended sessions. No makeup available. |
| Student exceeds departmental makeup allowance | Additional absences beyond the allowance are forfeited. No further makeups generated. |
| Unlimited sessions package — student misses a session | Makeup is not applicable. The student can simply attend another session within the validity period. |

## 01.7.3 Package Pro Rata Calculation

Pro rata calculation for mid-term package enrolments is not applied automatically. Admin must actively toggle on the pro rata option when enrolling a student onto a package mid-term. When the toggle is on, the system calculates the pro rata amount. When off, the full package price applies. The pro rata calculation divides the fixed package price by the total sessions in the package and multiplies by the remaining sessions. Admin reviews the calculated pro rata price before issuing the invoice and can override it with a logged reason.

## 01.7.4 Package Management

| **Action** | **Access** |
|---|---|
| Create package | Admin Head, Super Admin only |
| Edit package | Admin Head, Super Admin only. Edits apply to new enrolments only — existing package enrolments are not retroactively updated. |
| Archive package | Admin Head, Super Admin only. Warn-and-confirm if active enrolments exist. Warning shown when archiving a package with active enrolments: 'This package has [N] active student enrolments. Archiving will not affect current enrolments — all enrolled students will complete their current term on this package. However, new enrolments onto this package will no longer be possible. Confirm archive?' |
| View packages | All roles — view only for Teacher, TA, Admin |
| Assign to student | Admin and above — from the invoice builder or student profile |

---

# 01.8 Rate Card Dashboard

The rate card dashboard provides an aggregated, editable view of all per-session rates across the catalogue, arranged by subject, year group, session type, and frequency tier.

| **Feature** | **Detail** |
|---|---|
| View dimensions | Subject × year group × session type × frequency tier (Secondary) |
| Edit access | Admin Head, Super Admin, Org Owner only — all other roles view only |
| Change scope | New invoices only — existing issued invoices are not affected |
| Cascade | Rate card edits update the underlying subject record immediately |
| Audit trail | Every rate change logged: previous rate, new rate, changed by, timestamp, effective from |

---

# 01.9 Topic Tree Management

Each subject in the catalogue can have a topic tree organised hierarchically as Topic, Subtopic, and Learning Objective. The topic tree is the structural backbone of the progress tracker ([[04_Academic-M19_Progress_Tracking|M19]]) and the assignment library ([[04_Academic-M14_Assignment_Library|M14]]).

| **Level** | **Description** |
|---|---|
| Topic | A major curriculum unit — e.g. Algebra, Organic Chemistry, World War Two |
| Subtopic | A subdivision of a topic — e.g. Quadratic Equations within Algebra |
| Learning Objective | A specific, assessable outcome — e.g. Solve quadratic equations by factorisation |

| **Role** | **Topic Tree Access** |
|---|---|
| HOD | Full edit rights — add, edit, reorder, delete for courses in their department |
| Head of Subject | Full edit rights for their assigned subject only |
| Academic Head | Full edit rights across all departments |
| Super Admin | Full access |
| Admin Head | View-only |
| Admin | View-only |
| Teacher | View-only in [[04_Academic-M11_Academic_Courses|M11]]. Can mark topics as taught within [[04_Academic-M19_Progress_Tracking|M19]] only. |
| TA | View-only |

**Topic tree soft limits:** The platform recommends no more than 6 levels of topic nesting per subject. At 7 or more levels, a soft warning is shown to the HOD during topic tree construction: 'Deep topic nesting can make progress tracking harder to navigate. Consider consolidating sub-topics.' This is a warning only — the HOD can proceed. There is no hard limit on topic tree depth.

---

# 01.10 Grade Boundaries and Target Grades

## 01.10.1 Grade Boundary Configuration

| **Field** | **Specification** |
|---|---|
| Subject and qualification | Boundaries are set per subject per qualification route |
| Grade labels | Configurable per qualification — e.g. 9,8,7,6,5,4,3,2,1 for GCSE; A*,A,B,C,D,E,U for A-Level; 7,6,5,4,3,2,1 for IB |
| Score range | Lower and upper percentage bound per grade label |
| Academic year versioning | Boundaries can be updated per academic year. Historical boundaries are retained for prior-year reporting. |
| Edit access | HOD, Head of Subject, Academic Head, Super Admin |

## 01.10.2 Target Grades

Each student has a target grade per subject enrolment. Target grades inform the progress report ([[04_Academic-M19_Progress_Tracking|M19]]) and the student profile Grades tab ([[03_Student-M17_Student_Profile|M17]]). They are set on a per-student, per-subject basis.

| **Rule** | **Detail** |
|---|---|
| Set and edit by | Teacher, Academic Head, Super Admin. Teachers can set and edit target grades for their own assigned students only. |
| Visibility | Student profile Grades tab ([[03_Student-M17_Student_Profile|M17]]), progress report ([[04_Academic-M19_Progress_Tracking|M19]]), HOD and above in [[08_Management-M10_Management_Dashboard|M10]] |
| Change log | All changes logged: previous value, new value, changed by, timestamp |
| Blank target | Not flagged as an error — recommended but not mandatory |

---

# 01.11 Exam Countdown and Exam Events

## 01.11.1 Countdown Visibility by Year Group

| **Year Group** | **Default Behaviour** |
|---|---|
| Y10–Y13 (KS4 and KS5) | Always on — shown for all students in these year groups |
| Y7–Y9 (KS3) | Off by default — HOD toggles on per class group where applicable |
| Primary (EYFS, KS1, KS2) | Not applicable — no exam countdown |

## 01.11.2 Exam Event Fields

| **Field** | **Specification** |
|---|---|
| Subject | Selected from the catalogue. Required. |
| Year group | The year group this exam applies to. Required. |
| School | From the organisation-level school directory. Required. |
| Approximate exam date | Expected date or date range. Used for countdown and notification purposes. |
| Exam board | Auto-populated from the student's enrolment record where known. Editable. |
| Notes | Optional free text — e.g. Paper 1 only, Mock exam. |

## 01.11.3 Exam Event Notifications

| **Notification** | **Detail** |
|---|---|
| Guardian notification | WhatsApp + email + in-app to all guardians whose students match the subject, year group, and school. Sent immediately on event creation. |
| Staff notification | In-app message in the student's communication log for all matching students. |
| Profile banner | Exam banner displayed on student profile header ([[03_Student-M17_Student_Profile|M17]]) from logging date until exam date passes. |
| Teacher lists | Enrolled list (confirmed in subject) and Potential list (same year group and school, not yet enrolled). |

Exam events configured in [[04_Academic-M11_Academic_Courses|M11]] feed directly into the student profile exam countdown widget on [[03_Student-M17_Student_Profile|M17]]. For Y10–Y13 students with a confirmed exam date in [[04_Academic-M11_Academic_Courses|M11]], a countdown widget appears on the student profile overview tab showing days remaining to the exam.

---

# Assessment Catalogue Entries

Each department can configure assessment definitions that appear in the assessment booking flow. Assessment catalogue entries are not linked to invoices — assessments are always free.

| **Field** | **Specification** |
|---|---|
| Assessment name | Name of the assessment type (e.g. 'Maths Placement Assessment') |
| Department | Which department this assessment belongs to |
| Subject | Optional — link to a specific subject in the catalogue |
| Duration | Length of the assessment session in minutes |
| Assessor | Default assessor (can be overridden at booking time) |
| Description | Brief description shown on the public booking page |
| Active | Toggle — whether this assessment type is available for booking |

Assessment catalogue entries are configured per department by HOD or Admin Head. Super Admin can configure assessments for all departments from [[09_Settings-M20_Tenant_Settings|M20]] §01.4.

---

# 01.12 Science Subject Routes at IMI

| **Route** | **Catalogue Setup** | **Enrolment Pattern** |
|---|---|---|
| Triple Science (Separate Sciences) | Three separate subject records: Biology Y10, Chemistry Y10, Physics Y10 (and Y11 equivalents). Each has its own grade and exam board. | Student enrolled in all three subjects independently. Three separate invoice line items. Three independent GCSE grades. |
| Combined Science (Double Award) | One subject record: Science (Combined) Y10 / Y11. Noted as Double Award (2 GCSEs). Grade reported as a paired score (e.g. 7-6). | Student enrolled in one subject. One invoice line item. |
| Single Science | Uses the same individual subject records as Triple Science — Biology, Chemistry, or Physics. | Student enrolled in only one or two of the three sciences, not all three. No separate Single Science subject record required. |

---

# 01.13 Enrichment Programmes

Enrichment programmes sit outside the standard academic department structure. No qualification route, exam board, or specifier is required for enrichment subjects.

| **Enrichment Subject** | **Notes** |
|---|---|
| CAT4 Test Preparation | Cognitive Abilities Test prep. Ages 7–15. AED 200 per session. Separate revenue tag. |
| 7+ / 11+ Entrance Preparation | School admissions test prep. Ages 7–11. Per-session pricing. |
| Chess Mastery | Strategic thinking programme. Ages vary. Per-session pricing. |
| Financial Literacy | Money management programme. Ages vary. Per-session pricing. |
| AI Literacy | Future skills programme. Ages vary. Per-session pricing. |
| Educational Counselling | Academic guidance. Ages vary. Per-session pricing. |
| Home Education Support | All ages and curricula. Per-session pricing. |

---

# 01.14 School Directory

The school directory is an organisation-level resource shared across all branches. It provides the structured school name field used on student profiles ([[03_Student-M02_Student_Guardian_CRM|M02]]) and drives the exam event cross-notification system. The directory is pre-loaded with approximately 130 UAE schools.

When a student's school is updated on their profile, the previous school is retained as a history log entry. Each entry shows the school name, the date the student was recorded as attending that school, and the date the change was made.

| **Feature** | **Detail** |
|---|---|
| Pre-loaded entries | ~130 UAE schools. Curriculum auto-populates from known schools. |
| Special entries | Home Schooling, Online School — no exam event notifications unless explicitly added. |
| Primary-only flag | Marks schools that only go up to Year 6. Limits year group options on student profile. |
| New school additions | Flagged as pending, routed to Org Super Admin for approval. Available to all branches once approved. |
| Archived schools | Remain on existing student records but cannot be selected for new students. |

---

# 01.15 Role-Based Access

| **Role** | **Subjects / Pricing** | **Topic Tree** | **Grade Boundaries / Target Grades** |
|---|---|---|---|
| Super Admin | Full edit | Full edit | Full edit including target grades |
| Admin Head | Edit (rates + names) | View only | View — no target grade edit |
| Academic Head | View only | Full edit | Full edit including target grades |
| HOD | View only | Edit (own dept) | Edit boundaries (own dept), edit target grades (own dept) |
| Head of Subject | View only | Edit (own subject) | Edit boundaries (own subject), edit target grades (own subject) |
| Admin | View only | View only | View only |
| Teacher | View only | View only | Edit target grades for own assigned students only |
| TA | View only | View only | View only |

---

# 01.16 Audit Trail

All changes to the [[04_Academic-M11_Academic_Courses|M11]] catalogue are logged permanently. Audit log entries cannot be edited or deleted by any role.

| **Audit Event** | **Logged Detail** |
|---|---|
| Subject created | All fields, created by, timestamp |
| Subject name changed | Previous name, new name, changed by, timestamp |
| Subject rate changed | Subject, previous rate, new rate, changed by, timestamp, effective from |
| Subject archived | Subject, active enrolment count at time of archiving, confirmed by, timestamp |
| Bundle pricing minimum override | Subject, standard minimum, override value, override by, logged reason, timestamp |
| Package created / edited / archived | All relevant fields, changed by, timestamp |
| Topic tree edited | Topic/subtopic/objective, previous value, new value, edited by, timestamp |
| Grade boundary updated | Subject, qualification, grade label, previous range, new range, updated by, timestamp |
| Target grade set or changed | Student, subject, previous target, new target, changed by, timestamp |
| Exam event created | Subject, year group, school, date, created by, timestamp |
| School history entry added | Student, previous school, new school, changed by, timestamp |

---

# 01.17 IMI Subject Catalogue Reference

## Primary Department (EYFS, KS1, KS2)

| **Subject** | **Year Groups** | **Notes** |
|---|---|---|
| Mathematics | FS2, Y1–Y6 | Core subject across all Primary year groups |
| English | FS2, Y1–Y6 | Core subject across all Primary year groups |
| Science | Y4, Y5, Y6 (KS2 only) | Combo rate applies with Maths + English (min 10 sessions each). AED 150 combo / AED 180 standard. |

## Lower Secondary Department (KS3)

| **Subject** | **Year Groups** | **Notes** |
|---|---|---|
| Mathematics | Y7, Y8, Y9 | Core subject |
| English | Y7, Y8, Y9 | Core subject |
| Science | Y7, Y8, Y9 | Combined Science at KS3. No separate Biology/Chemistry/Physics at this stage unless specifically requested. |

## Upper Secondary Department (KS4 — Y10 and Y11)

| **Subject** | **Qualification Routes** | **Notes** |
|---|---|---|
| Mathematics | GCSE, IGCSE, IB MYP | Higher/Foundation tiers. IB MYP: Standard/Extended Maths. |
| Further Mathematics | GCSE, IGCSE | Not typically offered at MYP. |
| English Language | GCSE, IGCSE, IB MYP | — |
| English Literature | GCSE, IGCSE, IB MYP | — |
| Biology | GCSE, IGCSE, IB MYP | Triple Science route. Higher/Foundation tiers. |
| Chemistry | GCSE, IGCSE, IB MYP | Triple Science route. Higher/Foundation tiers. |
| Physics | GCSE, IGCSE, IB MYP | Triple Science route. Higher/Foundation tiers. |
| Science (Combined) | GCSE, IGCSE | Double Award (2 GCSEs). Higher/Foundation tiers. Not MYP. |
| Business Studies | GCSE, IGCSE, IB MYP | — |
| Economics | GCSE, IGCSE, IB MYP | — |
| Psychology | GCSE, IGCSE | Less common at KS4 — offered on request. |

## Upper Secondary Department (KS5 — Y12 and Y13)

| **Subject** | **Qualification Routes** | **Notes** |
|---|---|---|
| Mathematics | A-Level, IAL, IB Diploma | IB Diploma: AA-HL, AA-SL, AI-HL, AI-SL specifiers. A-Level: AS/A2/Full. |
| Further Mathematics | A-Level, IAL | A-Level only. Not IB Diploma. |
| English Language | A-Level, IAL, IB Diploma | — |
| English Literature | A-Level, IAL, IB Diploma | — |
| Biology | A-Level, IAL, IB Diploma | IB Diploma: HL or SL. |
| Chemistry | A-Level, IAL, IB Diploma | IB Diploma: HL or SL. |
| Physics | A-Level, IAL, IB Diploma | IB Diploma: HL or SL. |
| Business Studies | A-Level, IAL, IB Diploma | — |
| Economics | A-Level, IAL, IB Diploma | — |
| Psychology | A-Level, IAL, IB Diploma | — |

## Enrichment

| **Subject** | **Age Range** | **Notes** |
|---|---|---|
| CAT4 Test Preparation | Ages 7–15 | AED 200 per session. Separate revenue tag. |
| 7+ / 11+ Entrance Preparation | Ages 7–11 | School admissions preparation. |
| Chess Mastery | Ages vary | Strategic thinking programme. |
| Financial Literacy | Ages vary | Money management. |
| AI Literacy | Ages vary | Future skills. |
| Educational Counselling | Ages vary | Academic guidance. |
| Home Education Support | All ages | All curricula. |

---

## Senior (Adult Learner) Rate

| **Category** | **Session Type** | **Rate** | **Notes** |
|---|---|---|---|
| Senior (adult learner) | Private (default) | AED 350 per session | For adult learners and external professionals not enrolled in a school year group. Assigned to Senior department. Rate applies regardless of subject. Group rate for Senior adults uses the standard Secondary frequency tier pricing. |

---

# 01.18 Tenant Configuration in [[09_Settings-M20_Tenant_Settings|M20]]

| **Setting** | **IMI Default** |
|---|---|
| Bundle pricing minimum (sessions per subject) | 10 sessions — overridable by Admin+ with logged reason |
| Permitted session durations | 45 min (Primary), 60 min (all), 120 min (all). 90 min blocked platform-wide. |
| Private session flat rate | AED 300 per session |
| Exam countdown — KS4 and KS5 | Always on |
| Exam countdown — KS3 | Off by default, HOD toggles per class group |
| Rate card edit access | Admin Head, Super Admin, Org Owner |
| Package — created by | Admin Head or Super Admin only |
| Revenue tag options | Primary, Lower Secondary, Upper Secondary |
| School directory management | Super Admin approves new additions |
| Senior (adult learner) per-session rate | AED 350 (Private). Group: standard Secondary tier pricing applies. |
