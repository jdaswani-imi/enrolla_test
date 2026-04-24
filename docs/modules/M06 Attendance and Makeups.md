---
module: "M06"
title: "Attendance & Makeups"
layer: "Academic Operations"
folder: "04_Academic"
status: "Draft"
phase: "v1"
dependencies: [M05, M04]
tags: [enrolla, prd, academic, attendance]
---

# ENROLLA
# [[04_Academic-M06_Attendance_Makeups|M06]] — Attendance, Makeups & Concern Engine
v2.1 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

[[04_Academic-M06_Attendance_Makeups|M06]] tracks student presence at every session, manages makeup eligibility, enforces absence policies, and feeds attendance data into the Concern Engine ([[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]]), the student profile ([[03_Student-M17_Student_Profile|M17]]), and the Management Dashboard ([[08_Management-M10_Management_Dashboard|M10]]). Attendance data is the foundation of the platform's welfare and financial accuracy — session deductions occur at attendance confirmation, not at scheduling.

| **Property** | **Value** |
|---|---|
| Module code | [[04_Academic-M06_Attendance_Makeups|M06]] |
| Version | v2.1 |
| Status | Draft |
| AMDs absorbed | AMD-03.06 (48hr window closure day pause), AMD-05.26 (unlimited package welfare fallback), AMD-05.27 (absence alert maths fix) |
| Primary users | Teacher (marking), Admin (oversight and makeup booking) |
| Secondary users | HOD (absence alerts, no-show approvals), Admin Head (overrides) |
| Key rule | Session deductions occur at attendance confirmation — not at scheduling. Only whole-number deductions are permitted. |
| Feeds into | [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] Concern Engine, [[08_Management-M10_Management_Dashboard|M10]] Dashboard, [[03_Student-M17_Student_Profile|M17]] Student Profile, [[06_Finance-M08_Finance_Billing|M08]] Finance |
| Dependencies | [[03_Student-M04_Enrolment_Lifecycle|M04]], [[04_Academic-M05_Timetabling_Scheduling|M05]], [[06_Finance-M08_Finance_Billing|M08]], [[03_Student-M17_Student_Profile|M17]], [[09_Settings-M20_Tenant_Settings|M20]] |
| Phase | v1 |

---

# 01.1 Attendance Marking

Attendance is marked per session by the teacher or Admin from the session register in [[04_Academic-M05_Timetabling_Scheduling|M05]].

## 01.1.1 Attendance Statuses

| **Status** | **Description** |
|---|---|
| Present | Student attended the session. Session deduction applied at confirmation. |
| Absent — Notified | Student absent. Parent gave advance notice of at least 24 hours before the session. Makeup eligibility applies subject to allowance. |
| Absent — Not Notified | Student absent. No advance notice received. Makeup requires HOD approval. |
| Late | Student arrived late. Notes field available for the teacher to record arrival time and context. |
| No Show | Student absent with no contact at all. Triggers the no-show workflow (see 01.5). Not eligible for makeup without HOD approval. |

## 01.1.2 Marking Rules

Bulk marking allows the teacher to mark all students Present in one click and then adjust individual exceptions — this is the recommended flow to minimise marking time.

| **Rule** | **Detail** |
|---|---|
| Marking window | Attendance can only be marked on or after the scheduled day of the session. Teachers cannot mark attendance in advance for future sessions. Admin and Admin Head can mark attendance for any session at any time with a logged reason. |
| 48-hour window | Attendance must be marked within 48 working hours of the session end time. The 48-hour window pauses on configured weekly closure days. At IMI, the window pauses on Sunday. |
| Auto-flag | After 48 working hours without marking, the session is auto-flagged on the Admin dashboard as unmarked. Admin can manually unlock and mark. The auto-flag is recorded on the session record. |
| Deduction timing | Deduction from the student's session count occurs at the moment attendance is confirmed — not when the session was scheduled. |
| Attendance corrections | Attendance records can be corrected at any time by Admin or above. A reason must be logged for every correction. The original record and the correction are both retained in the audit trail. No approval is required. |
| Unbilled sessions | If a student has no active invoice for the subject being marked, a warning banner appears before confirmation. The session is still marked and logged in the Unbilled Sessions tracker ([[03_Student-M04_Enrolment_Lifecycle|M04]]). |

---

# 01.2 Absence Tracking

Absences are tracked per student per subject. The absence count resets at the start of each term. Tracking is always subject-specific — absences in Mathematics are counted independently from absences in English.

## 01.2.1 Absence Record Contents

| **Field** | **Detail** |
|---|---|
| Date and session details | Subject, teacher, session time |
| Absence status | Absent (Notified), Absent (Not Notified), or No Show |
| Reason and notes | Free text from Admin or teacher. Parent-provided reason logged separately. |
| Return date | Expected return date if provided by the parent. Suppresses absence alerts when present. |
| Makeup link | Linked to the makeup session record if a makeup was subsequently booked. |
| Retention | All absence records are part of the student's cumulative record ([[03_Student-M02_Student_Guardian_CRM|M02]]) and are never deleted. |

## 01.2.2 Dual Absence Signals

Two independent signals are tracked and displayed together on the student's attendance view and the HOD dashboard.

| **Signal** | **Detail** |
|---|---|
| Total absences | Running count of all absences in the current term for this subject. Measured against the makeup allowance threshold. |
| Consecutive absences | Count of absences in an unbroken sequence for this subject. Resets to zero when the student attends a session. Tracked independently from total absences. |
| Display | Both signals are shown side by side. A student can have low total absences but high consecutive absences (e.g. just returned from illness). |

---

# 01.3 Absence Alert Logic

Absence alerts are tied to the student's makeup allowance for each subject — not a fixed absence count. All thresholds are per subject, per term.

## 01.3.1 Standard Alert Thresholds

| **Alert Level** | **Trigger** | **Recipients** | **Channel** |
|---|---|---|---|
| Smaller alert | Absences reach the makeup allowance minus 1. One more absence will exhaust the allowance. | HOD, Receptionist / Admin | In-app |
| Big alert | Absences exceed the makeup allowance. Student has missed more sessions than makeups available. | HOD, Receptionist, Parent | WhatsApp + In-app |
| Alert suppressed | Big alert would fire but parent has already provided a reason and an expected return date. | No notification sent — suppression logged | — |

## 01.3.2 Smaller Alert Guard Condition

The smaller alert only fires if (allowance minus 1) is greater than zero. This prevents the alert from firing for students with an allowance of 1.

| **Scenario** | **Detail** |
|---|---|
| Primary students (allowance: 1) | Allowance minus 1 = 0. Guard condition means the smaller alert never fires. Only the big alert fires — when the single makeup allowance is exhausted. |
| Secondary students (allowance: 2) | Allowance minus 1 = 1. Smaller alert fires after 1 absence. Big alert fires after 2 absences. No change to existing behaviour. |
| Alert suppression | Automatic when a reason and return date are provided before the big alert threshold is reached. If the return date passes without the student returning, suppression expires and the alert fires. |
| Subject independence | Alerts are per subject per term. A student can have a big alert in Maths and no alert in English simultaneously. |

## 01.3.3 Unlimited Package Welfare Fallback

Students on unlimited session packages have no makeup allowance. A separate consecutive absence fallback threshold provides welfare coverage.

| **Element** | **Specification** |
|---|---|
| Fallback trigger | When an unlimited package student reaches the configured consecutive absence threshold in the same subject, the system fires the same alert chain as the big alert: HOD alert and guardian notification. |
| Default threshold | 3 consecutive absences |
| Configurable range | 2 to 5 consecutive absences. Configured in [[09_Settings-M20_Tenant_Settings|M20]] under Attendance Settings. Cannot be set to 0 or 1. |
| Alert content | HOD: "[Student name] — [Subject] — [N] consecutive absences on unlimited package. Welfare review recommended." Guardian: standard absence notification. |
| No makeup entitlement | The fallback alert does not grant makeup eligibility. Unlimited packages do not include makeups. The alert is a welfare flag only. |

---

# 01.4 Makeup Policy

Makeups allow a student to attend a replacement session when they miss a class, subject to eligibility rules and within their term allowance.

## 01.4.1 IMI Makeup Allowances

| **Department** | **Allowance** |
|---|---|
| Primary (FS1–Y6) | 1 makeup per term per subject |
| Secondary (Y7–Y13) | 2 makeups per term per subject |
| Unlimited packages | No makeups. See 01.3.3 for welfare fallback. |

## 01.4.2 Makeup Eligibility

| **Absence Type** | **Eligibility** |
|---|---|
| Absent — Notified | Eligible for makeup within allowance without HOD approval. |
| Absent — Not Notified | Eligible for makeup within allowance without HOD approval, but Admin must log the reason for absence before booking. |
| No Show | Not eligible for makeup without HOD approval regardless of remaining allowance. |
| Allowance exhausted | Any absence beyond the allowance requires HOD approval for a makeup, regardless of absence type. |
| Unlimited packages | No makeup eligibility. Welfare monitoring via consecutive absence fallback (01.3.3). |

## 01.4.3 Makeup Carry-Over

| **Element** | **Detail** |
|---|---|
| Carry-over basis | Carry-over value: Fixed whole number only (0, 1, or 2). Percentage-based carry-over is not supported and not configurable. The carry-over value cannot exceed the number of unused makeups the student has at term end. Configurable in [[09_Settings-M20_Tenant_Settings|M20]]. |
| Standard carry-over cap — Primary | Maximum 1 makeup carried over per subject. Cannot exceed unused makeups at term end. |
| Standard carry-over cap — Secondary | Maximum 2 makeups carried over per subject. Cannot exceed unused makeups at term end. |
| Cap applies to formal allowance only | The cap applies to the standard makeup allowance carry-over only. Additional missed sessions beyond the allowance are not automatically carried over under any cap. |
| Admin override above cap | Admin can manually add additional carry-over slots above the standard cap for an individual student if a parent requests it. A logged reason is mandatory. The standard cap is a default — Admin override can exceed it. |
| Expiry | Configurable in [[09_Settings-M20_Tenant_Settings|M20]]. IMI default: end of the following term. |
| Per-student override | Admin Head can override the carry-over amount for an individual student with a logged reason. |

---

# 01.5 No-Show Workflow

A No Show is an absence with no contact whatsoever — no advance notice, no same-day message, no post-session contact.

| **Element** | **Detail** |
|---|---|
| Marking | Teacher marks the student as No Show in the session register on or after the session day. |
| Admin logging window | Admin must log the no-show reason within 48 working hours of the session. After 48 hours, the no-show is auto-confirmed without a reason and flagged on the Admin dashboard. |
| Makeup eligibility — within allowance | If the student is within their makeup allowance, a makeup can be granted by Admin without HOD approval. Admin logs the reason. |
| Makeup eligibility — allowance exceeded | If the student has exhausted their makeup allowance, HOD approval is required before a makeup can be booked. |
| No-show concern trigger | 2 no-shows in the same subject in the current term auto-prompts a concern to HOD (configurable in [[09_Settings-M20_Tenant_Settings|M20]]). See [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] Section 2. |

---

# 01.6 Makeup Booking

| **Element** | **Detail** |
|---|---|
| Who books | Admin books makeup sessions. Teachers cannot book makeups directly. |
| Session selection | Admin selects a suitable session from available slots in [[04_Academic-M05_Timetabling_Scheduling|M05]] for the same subject. The makeup session is linked to the original missed session on the student's record. |
| Makeup deduction | No additional session deduction applies for the makeup session itself — it fulfils the original missed session. |
| Allowance tracking | Each makeup booked against an allowance reduces the remaining allowance by one. The allowance is visible on the student's attendance view. |
| Carry-over | Unused makeups carry over to the next term in accordance with the carry-over policy (01.4.3). |

---

# 01.7 IMI Attendance Configuration

| **Setting** | **IMI Value** |
|---|---|
| Attendance marking window | 48 working hours from session end. Pauses on configured closure days. |
| Closure days (IMI) | Sunday — clock pauses. Session ending Friday 18:00 resumes Monday 00:00. Teacher has until Monday 18:00. |
| Primary makeup allowance | 1 per term per subject |
| Secondary makeup allowance | 2 per term per subject |
| Unlimited package welfare fallback | 3 consecutive absences (configurable 2–5 in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Smaller alert guard condition | Only fires if (allowance − 1) > 0. Primary: smaller alert never fires. |
| No-show logging window | 48 working hours |
| Makeup carry-over basis | Fixed whole number only (0, 1, or 2). Percentage-based carry-over is not supported. Standard cap: Primary = 1, Secondary = 2. Cannot exceed unused makeups. Admin can override cap with logged reason. |
| Makeup carry-over expiry | End of following term |
| Attendance correction | No approval required. Admin or above can correct. Reason logged. Both original and corrected records retained in audit trail. |

---

# [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] — Concern Engine

The Concern Engine is the welfare escalation system linked to [[04_Academic-M06_Attendance_Makeups|M06]]. It manages formal concerns about student welfare, academic performance, attendance, and behaviour through a three-level escalation structure. Concerns feed into [[03_Student-M17_Student_Profile|M17]] (Student Profile Concerns tab), [[08_Management-M10_Management_Dashboard|M10]] (dashboard welfare metrics), and [[04_Academic-M19_Progress_Tracking|[[04_Academic-M19_Progress_Tracking|M19]].A]] (Academic Alert System).

## 06.A.1 Escalation Structure

| **Level** | **Detail** |
|---|---|
| L1 — Teacher + HOD | The concern is visible to the teacher who raised it and their HOD. Initial response is expected at this level. Auto-escalates to L2 after a configurable number of days without resolution. |
| L2 — HOD + Academic Head | Escalated concerns requiring department-level and academic leadership review. Auto-escalates to L3 after a configurable number of days without resolution. HOD can escalate directly to Admin Head for urgent cases. |
| L3 — Academic Head + Admin Head + Parent | The most serious level. Admin Head is involved. Parent notification is expected at L3. Academic Head or Admin Head can dismiss at this level with a logged reason. |
| Manual escalation | HOD can escalate from L1 to L2 at any time without waiting for the auto-escalation timer. Academic Head can escalate from L2 to L3 at any time. |
| Parent notification | HOD or Admin Head can notify the parent at any level — L1, L2, or L3. Parent notification is always a manual decision. It is never automatic at L1 or L2. |
| Auto-escalation timers | Configured independently for L1→L2 and L2→L3 in [[09_Settings-M20_Tenant_Settings|M20]] by Super Admin or Admin Head. IMI to set at go-live. |

## 06.A.2 Concern Triggers

### 06.A.2.1 Manually Triggered Concerns

Teacher logs a concern from the student's profile page or from the session register. Concern categories (teacher selects one): Academic Performance, Behavioural, Attendance, Emotional / Wellbeing, Other. A free text description is required. The concern is associated with a specific subject or marked as General (cross-subject).

### 06.A.2.2 Metric-Based Concern Triggers

The following metrics are monitored per student per subject and can be configured to auto-prompt a concern in [[09_Settings-M20_Tenant_Settings|M20]].

| **Metric** | **Description** | **IMI Default Threshold** |
|---|---|---|
| Total absences | Total absences exceed the makeup allowance for the subject in the current term | Absences > allowance (fires with big absence alert) |
| Consecutive absences | Student has missed a configurable number of sessions in a row in the same subject | 3 consecutive absences |
| No-shows | Student has a configurable number of no-shows in the same subject in the current term | 2 no-shows |
| Assignment non-submission | Student has not submitted a configurable number of assignments in the same subject | 3 consecutive non-submissions |
| Low feedback scores | Teacher feedback scores for this student in this subject consistently below a configurable threshold | Below 2/5 for 3 consecutive sessions |
| Progress tracker below threshold | Student's progress tracker ([[04_Academic-M19_Progress_Tracking|M19]]) shows sustained below-pass performance | Below pass threshold for 3 consecutive tracked sessions |

Each metric trigger is configurable per tenant in [[09_Settings-M20_Tenant_Settings|M20]] — the threshold, whether it auto-raises a concern or only prompts the teacher/HOD, and whether it fires per subject or across all subjects. When a metric threshold is reached, the system prompts the HOD with an in-app notification. HOD decides whether to log a formal concern or dismiss the prompt with a reason.

## 06.A.3 Concern Record

Every concern is a structured record stored on the student's profile. It is part of the cumulative record and is never deleted.

| **Field** | **Detail** |
|---|---|
| Student | Linked student record |
| Subject | Linked subject or General (cross-subject) |
| Category | Academic Performance, Behavioural, Attendance, Emotional / Wellbeing, Other |
| Description | Free text from the raising teacher. Required. |
| Raised by | Teacher name, timestamp |
| Current level | L1, L2, or L3 |
| Escalation log | Timestamped record of every escalation event: level, triggered by (staff or system), reason |
| Status | Open, Resolved, or Dismissed |
| Parent notified | Yes/No flag. Timestamp and notified-by recorded when set. |
| Intervention actions | Free text log of actions taken at each level |
| Resolution outcome | Free text. Required on status change to Resolved or Dismissed. |

## 06.A.4 Concern Dismissal Rules

| **Level** | **Rule** |
|---|---|
| L1 | Teacher (originator) or HOD can dismiss. No approval required. Reason must be logged. |
| L2 | HOD or Academic Head can dismiss. Reason must be logged. Dismissal recorded permanently alongside escalation history. |
| L3 | Academic Head or Admin Head can dismiss. Reason must be logged. Both Academic Head and Admin Head are notified of the dismissal. |
| Post-dismissal | A dismissed concern is not deleted. It is retained on the student's profile with the dismissal reason and dismissing staff member recorded. A dismissed concern can be re-opened at any time by HOD or above with a logged reason. |

## 06.A.5 Concern Resolution

A concern is marked Resolved by the HOD (L1/L2) or Academic Head (L2/L3) when the situation has been addressed. Resolution requires: a resolution outcome description (free text) and confirmation that any parent notification sent was appropriate.

On resolution, the concern status changes to Resolved. The raising teacher receives an in-app notification. The Admin receives an in-app notification. Resolved concerns remain on the student's profile permanently. A resolved concern can be re-opened if the situation recurs — a new escalation timeline begins from L1.

## 06.A.6 Role-Based Access

| **Role** | **Access** |
|---|---|
| Org Owner, Super Admin | Full access — all concerns across all branches. Configure all thresholds. |
| Admin Head | Receives L3 escalations. Can dismiss at any level. Configure thresholds. View all concerns. |
| Academic Head | Receives L2 and L3. Can dismiss L2+. Resolve L2/L3. Escalate to Admin Head directly. |
| HOD | Receives L1 and L2 for their department. Can dismiss L1 and (with logged reason) L2. Resolve L1/L2. Notify parent at any level. |
| Head of Subject | Receives L1 for their subject. View-only on L2+. |
| Teacher | Raises concerns. Receives notification when their raised concern is resolved or dismissed. No access to other students' concerns. |
| Admin | View-only on all concerns within their branch. Cannot raise or resolve concerns. |

## 06.A.7 IMI Reference Configuration

| **Setting** | **IMI Value** |
|---|---|
| L1→L2 auto-escalation timer | Tenant-configurable (IMI to set at go-live) |
| L2→L3 auto-escalation timer | Tenant-configurable (IMI to set at go-live) |
| Consecutive absence trigger | 3 consecutive absences in the same subject |
| No-show concern trigger | 2 no-shows in the same subject in the current term |
| Assignment non-submission trigger | 3 consecutive non-submissions |
| Low feedback score trigger | Below 2/5 for 3 consecutive sessions |
| Progress tracker trigger | Below pass threshold for 3 consecutive tracked sessions ([[04_Academic-M19_Progress_Tracking|M19]]) |
| Parent notification | Manual only — HOD or Admin Head triggers at any level |
| Unlimited package welfare fallback | 3 consecutive absences |
| Smaller alert guard condition | Only fires if (allowance − 1) > 0 |

## 06.A.8 Consolidated Concern Flag — Multiple Simultaneous Topic Interventions

If a student triggers the intervention threshold on 3 or more topics simultaneously (within the same review period), ONE consolidated concern flag is raised rather than individual per-topic flags. The consolidated flag lists all triggering topics. If the student triggers the threshold on 1 or 2 topics simultaneously, individual per-topic concern flags are raised as normal.

## 06.A.9 Teacher Off-Boarding Hard Block — Open Concerns

**Teacher Off-Boarding Hard Block — Open Concerns:**
When a teacher's off-boarding is initiated, all open [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concerns linked to that teacher are flagged. Off-boarding cannot be marked complete until all open concerns are either resolved or formally reassigned to another teacher/HOD. This is a hard block — the system prevents marking off-boarding complete while any open concern linked to this teacher remains unassigned.
