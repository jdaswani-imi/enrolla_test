# ENROLLA
# M09 — Staff & Performance
v1.1 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

M09 covers the full staff lifecycle within Enrolla: profile management, onboarding, scheduling, performance, CPD, HR actions, and off-boarding. It serves as the single source of truth for all staff-related operational data.

| **Property** | **Value** |
|---|---|
| Module code | M09 |
| Version | v1.1 |
| Status | Draft |
| AMDs absorbed | AMD-02.05 (Immediate Access Revocation), AMD-02.15 (Emergency Leave), AMD-02.29 (Outperformance Flag removed), AMD-05.24 (off-boarding session clearance gate) |
| Primary users | HR/Finance, Super Admin, Admin Head |
| Secondary users | HOD (dept view), Academic Head (academic staff view) |
| Salary/shift data access | HR/Finance and Super Admin only. Admin Head excluded. |
| Off-boarding authority | HR/Finance or Super Admin initiates. Admin Head sign-off optional. |
| Immediate Access Revocation | HR/Finance or Super Admin only |
| Emergency Leave | Admin Head or Super Admin only |
| Dependencies | M05, M06, M07, M08, M10, M16, M20 |
| Phase | v1 |

---

# 01.1 Staff Profile

Every staff member has a single profile record that persists for the lifetime of their employment.

## 01.1.1 Profile Fields

| **Field** | **Detail** |
|---|---|
| Full name | Legal name as on passport/Emirates ID |
| Work email | Mandatory. Used as login username. For tenants other than IMI, the work email field accepts any valid email address format — there is no platform-enforced domain restriction by default. An org-domain restriction toggle is available in M20 under Staff & HR Settings. When enabled, the platform validates that all new staff work emails use the organisation's registered domain. Existing staff emails are not retroactively validated when the toggle is enabled — only new staff created after the toggle is turned on are subject to the restriction. |
| Personal phone | Primary contact number |
| Secondary phone | Optional |
| Home address | Mandatory. Required before onboarding is considered complete. |
| Emergency contact | Mandatory. Name, relationship, phone. Required before onboarding complete. |
| Date of birth | Required for HR records |
| Nationality | Required for HR records |
| Emirates ID number | Required for HR records |
| Profile photo | Optional. Displayed on staff directory and session records. |
| Role | Mandatory on creation. One primary role. Additional secondary role labels can be granted by Super Admin. |
| Department(s) | One or more. Auto-suggested based on role. Admin can override. |
| Subject(s) | Teachers and TAs: subjects they are qualified and assigned to teach. Managed by HOD. |
| Start date | Date of first day. Used for milestone calculations. |
| Contract type | Full-time, part-time, or sessional |
| Line manager | Direct reporting line. Used for notification routing. |

## 01.1.2 Sensitive HR Fields

The following fields are visible only to HR/Finance and Super Admin. Admin Head, HOD, and all other roles cannot access them.

| **Field** | **Visibility** |
|---|---|
| Salary | Base salary in AED. HR/Finance and Super Admin only. |
| Compensation structure | Bonus, commission, or session-rate structure. HR/Finance and Super Admin only. |
| Shift schedule | Contracted hours and days. HR/Finance and Super Admin only. |
| Payroll notes | Free text HR field. HR/Finance and Super Admin only. |

---

# 01.2 Staff Onboarding

Onboarding begins when the staff member is added to the platform and ends when all mandatory profile fields are complete. During the onboarding period, the staff member receives a daily in-app prompt to complete outstanding fields.

| **Element** | **Detail** |
|---|---|
| Invite | Staff added at M20.A Stage 6 or manually by HR receive an invite email with a one-time link to set their password. |
| Mandatory fields | Work email, home address, emergency contact. These three fields must be complete before onboarding status is resolved. |
| Daily prompt | New staff see an in-app prompt on every login until mandatory fields are complete: "Complete your profile — X fields remaining." Prompt is configurable in M20. |
| HR dashboard | M09 HR dashboard shows completion status for all staff with incomplete onboarding. HR can push a document request task to any staff member from this view. |
| Completion | Onboarding is marked complete when all mandatory fields are populated. No manual action required. |

---

# 01.3 Roles and Access

Each staff member is assigned one primary role. Role assignments are managed in M20. Secondary role labels can be added by Super Admin to expand permissions and routing without changing the primary role — see PL-02, Section 3.

| **Element** | **Detail** |
|---|---|
| Role assignment | HR/Finance or Super Admin assigns the primary role at creation. |
| Role expiry | Any role assignment can be given an expiry date. On expiry, the staff member reverts to a configurable fallback role. Super Admin is notified. |
| Custom roles | HR/Finance custom role at IMI: salary view, staff profile view, document management, bulk invoice export, finance dashboard view. |
| Salary/shift restriction | Admin Head has no access to salary, compensation, or shift data. This restriction cannot be overridden by Admin Head. |

---

# 01.4 Scheduling and Availability

Teacher availability drives session scheduling in M05.

| **Element** | **Detail** |
|---|---|
| Availability slots | Teacher sets available days and times per week. HOD and Admin Head can edit on behalf of the teacher. |
| Leave | Planned leave is entered in M09 with a start date, end date, and type (Annual, Medical, Emergency, Other). Planned leave blocks the teacher's availability in M05 for the leave period. |
| Handover for planned leave | Leave confirmation is blocked until the teacher designates a cover approver and submits a brief handover note. |
| Emergency Leave | Admin Head or Super Admin can mark a staff member as on Emergency Leave instantly. No handover document is required. The Vacant Role Fallback Chain activates immediately. See 01.8.2. |
| Substitute assignment | When a teacher is on leave, Admin can assign a substitute from the available teacher pool for affected sessions. Substitute assignment is logged on the session record. |

---

# 01.5 Performance and CPD

## 01.5.1 Session Delivery Metrics

| **Metric** | **Detail** |
|---|---|
| Sessions delivered | Total sessions confirmed as attended in M06. Count by term and academic year. |
| Attendance rate | Percentage of scheduled sessions that were delivered (not cancelled or missed). |
| Revenue by teacher (actual) | Confirmed sessions × rate minus proportional discounts. Calculated from M08 data. |
| Revenue by teacher (expected) | Scheduled sessions × rate × historical attendance rate minus proportional discounts. Used for forecasting. |
| Revenue summary | Summary on M09 HR dashboard. Full drill-down available in M10 Management Dashboard. |

## 01.5.2 Feedback Scores

| **Element** | **Detail** |
|---|---|
| Per-class feedback | Average feedback selector scores from M07 per-class feedback, aggregated per teacher per subject per term. |
| Student satisfaction | NPS scores from M07.B satisfaction surveys, filtered to sessions taught by this teacher. |
| Concern flags | Count of M06.A teaching quality concerns logged against this teacher. Visible to HOD and above. |
| Low score alert | If a teacher's average feedback score drops below a configurable threshold, an alert fires to HOD and Academic Head. |

## 01.5.3 CPD Tracking

| **Element** | **Detail** |
|---|---|
| Annual target | Configurable per role in M20. IMI default: 20 hours per year. |
| CPD log | Teacher logs CPD activities manually: activity name, date, hours, type (training/conference/reading/other), notes. |
| Progress indicator | Hours completed vs annual target displayed on the teacher profile and HR dashboard. |
| Milestone alerts | HR receives an in-app notification when a teacher completes 50% and 100% of their annual CPD target. |

**CPD Log Visibility and Verification:**
- Teacher logs CPD hours manually. Progress indicator shown on their own profile.
- HOD can view a CPD completion summary for teachers in their department: annual progress bar, percentage complete, and outstanding hours count. HOD cannot see individual CPD log entries, uploaded documents, CPD scores, or verify/query entries (`staff.viewCPDDetail` required for detail access).
- Academic Head has the same summary-only view as HOD across all departments.
- HR/Finance can view all staff CPD logs and can mark individual entries as **Verified** or **Queried**.
  - Verified: HR/Finance has confirmed the CPD activity is legitimate.
  - Queried: HR/Finance has a question about the entry. Setting Queried status auto-creates a task assigned to the staff member: 'CPD entry queried — [date] — [activity name] — please clarify.'
- Super Admin has full visibility and full edit/verify access.

## 01.5.4 Performance Review Cycle

| **Element** | **Detail** |
|---|---|
| Cadence | Annual by default. Configurable per role in M20. |
| Reviewer | The staff member's direct line manager. If no line manager is configured, defaults to HR/Finance. Super Admin can reassign the reviewer before the review is opened. |
| Review inputs | Reviewer completes the review form in M16 (auto-created task). Inputs: attendance record for the period, CPD hours logged, workload summary (from M09 workload data), and free-text notes. |
| Rating scale | 1–5 scale: 1 = Below expectations, 2 = Developing, 3 = Meets expectations, 4 = Exceeds expectations, 5 = Outstanding. Overall rating is set by the reviewer. |
| Agreed targets | Reviewer records agreed development targets for the next review period. Targets are stored on the review record and visible to the staff member, their line manager, HR/Finance, and Super Admin. |
| Sign-off | Review record requires sign-off by the staff member (acknowledgement only — not approval) and the reviewer. Both sign-offs are logged with name, role, and timestamp. The review cannot be marked Complete until both sign-offs are recorded. |
| Review record | Each review is logged on the staff profile: date, reviewer, overall rating, notes, agreed targets. Visible to HR/Finance and Super Admin only. |
| Overdue alert | If the review date passes without the review being opened in M16, an in-app alert is sent to HR/Finance and the reviewer: 'Performance review overdue for [Staff name].' Alert repeats every 7 days until the review task is opened. |

## 01.5.5 Workload Indicator

| **Element** | **Detail** |
|---|---|
| Workload indicator | Traffic light indicator on staff profiles: Green (healthy), Amber (approaching capacity), Red (over capacity). Based on scheduled session hours vs contracted hours. The workload indicator is role-scoped: **HOD view:** Traffic light only (Green / Amber / Red). No numeric breakdown visible. **HR/Finance and Super Admin view:** Full breakdown — traffic light colour + the underlying data (total scheduled hours per week, number of students, number of subjects, comparison to capacity threshold). The traffic light colour thresholds are configured in M20. |

---

# 01.6 Staff Groups and Communications

Staff groups enable targeted internal communications and task assignment. Groups are managed in M20.

| **Element** | **Detail** |
|---|---|
| Auto-generated groups | System creates groups by department and by subject automatically. These cannot be deleted. |
| Custom groups | Admin Head and Super Admin can create named custom groups (e.g. "Front Office Team", "Exam Invigilators"). Managed in M20. |
| Group tagging | Groups can be tagged in M16 tasks, M13 internal messages, and payment notifications. |
| Directory | Staff directory is accessible to all staff. Shows name, role, department, and subject. Contact details visible to Admin and above only. |

---

# 01.7 Staff Milestones

Milestone events are triggered automatically based on the staff member's start date. Milestone notifications are configurable in M20.

| **Milestone** | **Behaviour** |
|---|---|
| 6-month milestone | In-app notification to the staff member's department or team (configurable). No public announcement. |
| 1-year milestone | Same as 6-month. Additional milestone years can be configured in M20. |
| Departures | Departure events are never announced publicly. The staff member's profile transitions to Departed status visible only to Admin Head and above. |
| Calendar toggle | Departed staff appear in the calendar with a Departed indicator by default. Admin can remove them manually. |
| Suspended staff | Remain visible in the calendar with a Suspended indicator until Admin removes them. |

---

# 01.8 HR Actions

HR actions are high-authority operations that affect staff access, status, or employment record. All HR actions are logged permanently on the staff profile.

## 01.8.1 Immediate Access Revocation

Immediate Access Revocation is the kill switch for gross misconduct or hostile termination scenarios. It is separate from the standard off-boarding flow.

| **Element** | **Specification** |
|---|---|
| Access | HR/Finance or Super Admin only |
| Trigger | Available on any active staff profile as a distinct action button |
| Effect | All active login sessions for the staff member are immediately invalidated. Login is blocked by any means. Takes effect within seconds of confirmation. |
| Confirmation | A mandatory reason field must be completed before the action executes. Admin must type CONFIRM to proceed. The dialog states: "This will immediately revoke all platform access for [Name]. This cannot be undone without a manual reinstatement." |
| Logging | Logged as "Immediate Access Revocation" with: triggering staff name, timestamp, stated reason. Visible on the staff profile audit trail and the M09 HR activity log. |
| Off-boarding | Immediate revocation does not complete off-boarding. The standard off-boarding checklist continues separately and must be completed by HR. |
| Reinstatement | Super Admin can reinstate access if the revocation was made in error. Reinstatement requires a logged reason and is visible in the audit trail. |
| Sessions | At the moment IAR fires, all upcoming sessions assigned to that staff member are flagged as Cover Required in M05. Admin Head and the HOD of affected departments receive an immediate in-app alert. Sessions are not auto-cancelled. Admin reassigns manually. |

## 01.8.2 Emergency Leave

Emergency Leave handles the scenario where a staff member becomes suddenly unavailable and cannot complete a planned leave handover.

| **Element** | **Specification** |
|---|---|
| Access | Admin Head or Super Admin only |
| Effect on access | Staff member's access is suspended (not revoked). They cannot log in but their data and history remain intact. |
| Effect on escalations | The Vacant Role Fallback Chain activates immediately for all role assignments held by this staff member. Escalations, approvals, and notifications route to the next role in the chain. |
| Duration | No defined end date. Emergency Leave remains active until Admin Head or Super Admin reinstates the staff member. |
| Reinstatement | One-click reinstatement on the staff profile. Access restored, fallback chain deactivated, normal routing resumes. Reinstatement is logged. |
| No handover required | Emergency Leave bypasses the handover document requirement that applies to planned leave. This is by design for genuine emergency scenarios. |
| Logging | Emergency Leave activation and reinstatement are both logged with the triggering Admin name and timestamp. |

## 01.8.3 Standard Off-Boarding — Planned Departure

Standard off-boarding applies to all planned permanent departures. HR/Finance or Super Admin initiates. Admin Head sign-off is optional.

| **Element** | **Detail** |
|---|---|
| Initiation | HR/Finance or Super Admin opens the off-boarding flow from the staff profile. |
| Mandatory session clearance step | Before the handover sign-off can be completed, the off-boarding flow presents a mandatory step: the system retrieves all future sessions assigned to the departing staff member from M05 and displays them in a list. The off-boarding flow cannot proceed until every session is either reassigned to another teacher, cancelled, or marked as Cover Required. This step is enforced by a direct M05 database check — independent of the M16 checklist sub-task. |
| Session list content | Session date and time, subject, year group, student count, current assigned teacher. Direct link to M05 session detail for each entry. |
| Checklist | See structured handover checklist below. Each hard block must be cleared before off-boarding can be marked complete. |
| HR notifications | System notifies HR at 7 days, 3 days, and 1 day before the last working day. |
| Last working day alert | On the staff member's last working day, Admin Head and HOD receive an in-app alert. If any sessions remain unresolved, they are listed. The alert fires again on the next working day if sessions are still unresolved. |
| Staff active until last day | The staff member retains full platform access until the end of their last working day. Access is revoked automatically at 23:59 on the last working day. |
| Post-departure | After the last working day, Super Admin chooses: archive the profile or set a grace period for data access. |
| Admin Head sign-off | Optional. Configurable in M20. |

### Structured Off-Boarding Handover Checklist (3 Hard Blocks)

Off-boarding cannot be marked complete until all three hard blocks are cleared:

**Hard Block 1 — Future Sessions:**
All sessions scheduled after the teacher's last working day must have a confirmed cover teacher assigned. The system shows a count of uncovered future sessions. This block cannot be bypassed.

**Hard Block 2 — Pending Feedback Drafts:**
All feedback drafts created by this teacher that are pending submission or approval must either be submitted for approval or explicitly discarded (with a reason logged). The system shows a count of pending drafts. This block cannot be bypassed.

**Hard Block 3 — Open Concerns:**
All open M06.A concern records linked to this teacher must be either resolved or formally reassigned to another teacher or HOD. The system shows a count of open concerns. This block cannot be bypassed.

The off-boarding checklist is auto-created as a task in M16 when off-boarding is initiated. Progress against each hard block is tracked in real time on the task.

## 01.8.4 Unplanned Permanent Departure

Unplanned permanent departure covers dismissal, absconding, or conduct-related immediate termination. These bypass the standard off-boarding flow entirely. The session clearance gate does not apply. The alert chain fires immediately.

| **Element** | **Detail** |
|---|---|
| Departure statuses | HR or Super Admin applies one of three immediate departure statuses: Immediately Terminated, Absconded, or Conduct Departure. These statuses are permanent and cannot be reversed without a logged Super Admin override. |
| Immediate session alert | On applying an unplanned departure status, the system immediately fires an alert to Admin Head and the HOD(s) of all departments the staff member is assigned to: "[Staff name] has been marked as [Status]. [N] upcoming sessions require urgent cover." Alert links to the Cover Required view in M05. |
| Sessions flagged in M05 | All upcoming sessions assigned to the departed staff member are automatically flagged as Cover Required. Not cancelled. Admin reassigns manually. |
| Access revocation | Immediate Access Revocation is triggered alongside the departure status. IAR fires independently and instantly. |
| Audit trail | Departure status application, IAR, and all subsequent session reassignments are logged permanently with actor name and timestamp. |

---

# 01.9 HR Dashboard

The HR dashboard gives HR/Finance and Super Admin a real-time operational view of the staff base.

| **Section** | **Content** |
|---|---|
| Onboarding completion | List of all staff with incomplete mandatory profile fields. Completion percentage per staff member. HR can push a document request task from this view. |
| Upcoming milestones | Staff members whose 6-month or 1-year milestone falls within the next 30 days. |
| Upcoming departures | Staff with a last working day in the next 30 days. Off-boarding checklist completion status per departing staff member. |
| Emergency Leave active | List of any staff currently on Emergency Leave with duration and fallback chain status. |
| CPD summary | Department-level CPD completion rate vs annual target. Drill down to individual staff. |
| Workload overview | Traffic light summary by department. Count of Green, Amber, Red workload indicators. |
| Revenue by teacher | Summary table: teacher name, sessions delivered, actual revenue, expected revenue. Full drill-down available in M10. |

---

# 01.10 IMI Reference Configuration

| **Setting** | **IMI Value** |
|---|---|
| Work email format | firstinitial.lastname@improvemeinstitute.com |
| Mandatory profile fields | Work email, home address, emergency contact |
| Salary/shift access | HR/Finance and Super Admin only |
| Off-boarding initiation | HR/Finance or Super Admin |
| Admin Head off-boarding sign-off | Optional |
| HR notification lead times | 7 days, 3 days, 1 day before last working day |
| CPD annual target | 20 hours |
| Staff milestones | 6 months and 1 year. Team/department notification. |
| Departures | Never announced publicly |
| Performance review cadence | Annual |
| Custom role (HR/Finance) | Salary view, staff profile view, document management, bulk invoice export, finance dashboard |
| Outperformance Flag | Removed — not a platform feature |
