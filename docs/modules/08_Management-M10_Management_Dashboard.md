# ENROLLA
# M10 — Management Dashboard
v1.2 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

M10 is the operational intelligence layer of Enrolla. It aggregates data from all other modules and presents it as a real-time management dashboard. M10 does not create or edit records — it reads, surfaces, and alerts. Access is role-scoped: each role sees a view appropriate to their authority. Individual KPI cards are further gated by permission key — see 01.1.

| **Property** | **Value** |
|---|---|
| Module code | M10 |
| Version | v1.2 |
| Status | Current |
| AMDs absorbed | AMD-02.29 (Outperformance Flag removed), AMD-02.09 (App inactive churn signal disabled in v1), AMD-04.21 (churn alert cooldown), April 2026 RBAC overhaul (access field corrected, KPI card gating added) |
| Sub-modules | M10.A — Reports Inbox & Delivery (folded in Section 6) |
| Access | All 8 roles reach `/dashboard`. KPI cards are individually gated — see 01.1. Teacher and TA see role-scoped operational cards only. HR/Finance sees financial and staff cards. |
| Data source | Aggregated read-only from all modules. No direct data entry in M10. |
| Refresh | Live. KPI cards and feed update in real time. Churn scores recalculate on signal change. |
| Dependencies | M01, M02, M05, M06, M07, M08, M09, M13, M14, M17, M19, M20 |
| Phase | v1 |

---

# 01.1 KPI Cards

The top row of the dashboard displays KPI cards. Each card shows the current value and the percentage change from the previous equivalent period (prior term or prior month, configurable).

The dashboard page itself is ungated — all 8 roles reach it. Individual KPI cards are gated by permission key. Cards a role cannot see are hidden entirely, not shown as locked or empty.

| **KPI Card** | **Description** | **Comparison** | **Permission gate** |
|---|---|---|---|
| Active students | Total students with at least one active enrolment this term | % change vs prior term | always visible |
| New enrolments | Students enrolled for the first time this term | % change vs prior term | `enrolment.view` |
| Re-enrolments | Returning students who enrolled again this term | % change vs prior term | `enrolment.view` |
| Churn this term | Students who have withdrawn this term | % change vs prior term | `analytics.view` |
| Revenue this term | Total invoiced amount for the current term (all statuses) | % change vs prior term | `finance.view` |
| Collected this term | Total payments received this term | % change vs prior term | `finance.view` |
| Overdue invoices | Count and total AED value of overdue invoices | Live | `finance.view` |
| At-risk students | Students with a churn score above the high-risk threshold | Live | `analytics.view` |
| Open concerns | Count of unresolved M06.A concern records across all departments | Live | `analytics.view` |
| Seat occupancy | Overall occupancy rate across all rooms and sessions this week | vs configured target | `analytics.view` |
| Active staff | Total active staff members | Live | `staff.view` |
| CPD completion | Percentage of staff on track for annual CPD target | Live | `staff.view` |

**Role visibility summary:**

| **Role** | **Cards visible** |
|---|---|
| Super Admin, Admin Head, Admin | All cards |
| Academic Head, HOD | Active students, New enrolments, Re-enrolments, Churn, At-risk, Open concerns, Seat occupancy, Active staff, CPD completion |
| HR/Finance | Active students, Revenue, Collected, Overdue invoices, At-risk, Open concerns, Seat occupancy, Active staff, CPD completion |
| Teacher, TA | Active students only (role-scoped operational cards where configured) |

Teacher and TA do not have `finance.view`, `enrolment.view`, or `analytics.view` — the Revenue, Collected, Overdue Invoices, New Enrolments, Re-enrolments, Churn, At-risk, Open concerns, and Seat occupancy cards are all hidden for these roles.

---

# 01.2 Churn Risk Score

The churn risk score is a weighted composite score (0–100) calculated per student across all active enrolments. Scores are recalculated in real time whenever a contributing signal changes.

## 01.2.1 Overall Churn Signal Weights — v1

The App inactive signal is disabled in v1 as there is no parent portal. The 10% weight is redistributed proportionally across the remaining 7 signals.

| **Signal** | **Condition** | **Weight** |
|---|---|---|
| Teaching Quality Concern | Active M06.A concern with Teaching Quality category | 28% |
| Missed 3+ sessions (45-day window) | 3 or more absences in any 45-day rolling window | 17% |
| Overdue invoice | Invoice overdue by more than the configured threshold | 17% |
| Inconsistency | Irregular attendance pattern — no consistent weekly cadence | 11% |
| Unresolved concern | Any open M06.A concern regardless of category | 11% |
| NPS score | Low satisfaction survey score from most recent M07.B survey | 11% |
| Unsubscribed | Guardian has unsubscribed from email communications | 5% |
| App inactive 14+ days | DISABLED IN V1 — no parent portal. Reactivates at Phase 2. | 0% (paused) |

The dashboard displays a note while the App inactive signal is paused: "App inactive signal is paused — parent portal not yet active." When the parent portal feature toggle is activated in M20, the signal re-enters the calculation at 10% and all weights revert to the original confirmed values: Teaching Quality 25%, Missed sessions 15%, Overdue invoice 15%, Inconsistency 10%, Unresolved concern 10%, NPS 10%, App inactive 10%, Unsubscribed 5%.

## 01.2.2 Churn Risk Bands

| **Band** | **Behaviour** |
|---|---|
| High risk (Red) | Score ≥ 70. Student appears in the Churn List with red indicator. Admin Head receives a daily digest of all high-risk students. |
| Medium risk (Amber) | Score 40–69. Student flagged on their profile and in HOD view. No automatic alert — HOD monitors. |
| Low risk (Green) | Score < 40. No flag. Normal monitoring. |
| Thresholds | Configurable in M20 Churn & Dashboard settings. |

## 01.2.3 Churn Alert Cooldown

Once a churn threshold alert fires for a student, no further threshold alerts fire for that student for the cooldown period regardless of score movement. This prevents alert fatigue from repeatedly crossing the threshold.

| **Setting** | **IMI Default** |
|---|---|
| Cooldown period | 7 days. Configurable in M20 (range 1–30 days). |

## 01.2.4 Retention Confidence Score

The retention confidence score runs alongside the churn score and measures positive signals indicating a student is likely to re-enrol.

| **Signal** | **Condition** | **Weight** |
|---|---|---|
| Re-enrolment confirmed | Student has already re-enrolled for next term | 30% |
| Positive review submitted | Guardian submitted an NPS score of 4+ this term | 25% |
| Credit on account | Guardian holds an unused credit balance | 20% |
| App active | Guardian has logged into the parent app in the last 14 days — Phase 2 | 10% |
| No missed sessions | Zero absences this term in this subject | 10% |
| Email opened | Guardian opened the last 3 email communications | 5% |

---

# 01.3 Churn List

The Churn List is a prioritised view of all students above the medium-risk threshold. It is the primary operational tool for retention management.

| **Element** | **Detail** |
|---|---|
| Columns | Student name, year group, department, churn score, top contributing signal, retention confidence score, days since last contact, assigned Admin |
| Sort | Default: churn score descending. Sortable by any column. |
| Filters | Department, year group, score band (High/Medium), subject, top signal type |
| Quick actions | From the list: open student profile, log a contact note, create a task, send a copy-paste message (v1 — manual send) |
| Export | Admin Head and Super Admin can export the Churn List as CSV |

---

# 01.4 Seat Occupancy

Seat occupancy measures how effectively the centre's scheduling capacity is being used. It is displayed as a heatmap and a summary table.

**Occupancy rate formula:** (Total enrolled student-session instances ÷ (Total room capacity × Total sessions scheduled)) × 100 = Occupancy rate %

Where:
- Total enrolled student-session instances = count of active student enrolments linked to each scheduled session
- Total room capacity = the capacity configured for the room in M05
- Total sessions scheduled = count of all scheduled sessions in the period
- Unlimited package students are excluded from the numerator (their attendance is tracked but not counted in capacity utilisation)

| **Element** | **Detail** |
|---|---|
| Heatmap | Sessions per day vs time of day. Colour intensity shows occupancy density. Time slot unit: 30 minutes. Peak hours (15:00–19:00 IMI default) highlighted. |
| Occupancy rate | Enrolled students / room capacity for each active session. Displayed as a percentage. |
| Summary table | Room-by-room breakdown for the selected week. Columns: room name, sessions scheduled, average occupancy %, peak time slot. |
| Target line | Configurable occupancy target overlaid on heatmap. IMI default: 80%. |
| Export | Admin Head and Super Admin can export occupancy data as CSV. |

---

# 01.5 Revenue Dashboard

The Revenue Dashboard surfaces financial performance data for Admin Head, Super Admin, HR/Finance, and Admin. Roles without `finance.view` do not see this section.

| **Element** | **Detail** |
|---|---|
| Revenue by term | Invoiced amount vs collected amount for each term. Bar chart. |
| Revenue by department | Aggregated by department. Mapped to bank account via revenue tag (M08). |
| Outstanding balance | Total AED value of all unpaid invoices across all statuses. |
| Overdue ageing | Breakdown of overdue invoices by age band: 1–30 days, 31–60 days, 60+ days. |
| Export | Admin Head and Super Admin can export revenue data as CSV. |

---

# 01.6 Live Activity Feed

The Live Activity Feed is a real-time stream of platform events scoped to the user's role. It appears below the KPI cards on the dashboard.

| **Element** | **Detail** |
|---|---|
| Scope | Super Admin and Admin Head see all events. HOD sees department-scoped events. Admin sees branch-scoped operational events. Teacher and TA see events for their own sessions and students only. |
| Event types | Enrolment created, payment recorded, session marked, concern raised, task completed, lead stage changed, feedback approved, report generated |
| Depth | Last 50 events shown. Infinite scroll loads further history. |
| Filters | Event type, department, date range |

## 01.6.1 Gateway Log Feed

Super Admin can access a platform-wide, filterable Gateway Log feed from the Management Dashboard. The feed shows all approval gateway events across all record types. Filters: request type, department, date range, approver, status (approved/rejected/pending). Role-scoped staff see only gateway events relevant to their department. The Gateway Log is also accessible as a record-level view on individual student, invoice, and staff profile pages.

---

# 01.7 Academic Alerts View

The Academic Alerts view surfaces all active alerts from the M19.A Academic Alert System. It is role-scoped.

| **Role** | **View** |
|---|---|
| Super Admin, Admin Head | All alerts across all departments |
| Academic Head | All alerts across all departments |
| HOD | Alerts for their department only |
| Admin | All soft alerts — no formal escalation detail |
| Admin Head view | Active L3 escalations only (parent contact involved). Summary count by department. |
| Export | Admin Head and Super Admin can export the alert log as CSV. |

---

# 01.8 Operational Monitoring Thresholds

The following thresholds trigger automated alerts to relevant roles. All thresholds are configurable in M20 by Super Admin or Admin Head.

| **Alert** | **Trigger** | **Notified** | **Default threshold** |
|---|---|---|---|
| High churn risk | Student score ≥ 70 | Admin Head (daily digest) | 70 |
| Attendance unmarked | Session end + 24h, 48h, 72h | Teacher, HOD, Admin | 24/48/72h |
| Feedback overdue | Session end + 48h, no feedback submitted | Teacher, HOD | 48h |
| No-show not resolved | No-show not actioned within 48h | Admin | 48h |
| 48hr tracker breach | Teacher has not updated progress tracker remarks within window | 48 working hours (pauses on closure days) |

## 01.8.1 HOD Workload Indicator

Each teacher in a department has a workload indicator calculated from: active student count, session hours per week, and subject count.

| **Indicator** | **Meaning** |
|---|---|
| Green | Teacher is within comfortable capacity |
| Amber | Teacher is approaching capacity — HOD monitors |
| Red | Teacher is over capacity — immediate HOD action recommended |

HOD view of the workload indicator shows the traffic light colour only. Full breakdown data (hours, student count, subject count) is visible to HR/Finance and Super Admin only.

---

# 01.9 IMI Reference Configuration

| **Setting** | **IMI Value** |
|---|---|
| Churn high-risk threshold | 70 |
| Churn medium-risk threshold | 40 |
| Churn alert cooldown | 7 days |
| Occupancy target | 80% |
| Peak hours heatmap highlight | 15:00–19:00 |
| Revenue dashboard access | Admin Head, Super Admin, Admin, HR/Finance |
| Activity feed depth | 50 events (infinite scroll) |
| Report digest send time | 07:00 UAE time |
| Report data snapshot time | 00:00 UAE time on delivery day |

---

# 01.10 HOD Dashboard

The HOD Dashboard is a department-scoped view available to HODs. It contains the following 10 sections:

1. **Department KPI strip** — Active students in department, sessions this week, attendance rate this week, open concerns count.

2. **Workload indicator summary** — Traffic light status for each teacher in the department. Red indicators are listed first.

3. **Academic alerts** — All active soft alerts and formal escalations for students in the HOD's subject(s). Columns: student name, subject, alert level, signals triggered, days open, last action.

4. **At-risk students** — Students in the department with a churn score ≥40 (medium risk or above). Columns: student name, churn score band, top contributing signal, days since last contact.

5. **Open concerns** — All unresolved M06.A concern records for the HOD's subjects. Columns: student name, subject, concern category, days open, assigned teacher.

6. **Feedback pending approval** — All feedback drafts awaiting HOD approval. Columns: teacher name, student name, subject, session date, days pending.

7. **Upcoming sessions this week** — Timetable view of all sessions in the HOD's department for the current week. Flags unmarked attendance.

8. **48-hour tracker breaches** — Sessions where the teacher has not updated progress tracker remarks within the 48-hour window. Listed by teacher.

9. **Seat occupancy — department view** — Occupancy rate for all sessions in the department this week. Traffic light: Green ≥80%, Amber 50–79%, Red <50%.

10. **Recent activity** — Department-scoped activity feed showing the last 50 events for this department.

---

# M10.A — Reports Inbox & Delivery

M10.A specifies the Reports Inbox and scheduled report delivery system for Enrolla. Every user who has at least one report assigned to them by Super Admin gains access to a dedicated Reports section in the platform navigation. This section serves as a permanent, searchable in-app record of all reports generated for that user, independent of email delivery.

## 10.A.1 Navigation and Visibility

The Reports section appears as a dedicated item in the left sidebar on desktop and the bottom tab bar on mobile. It is hidden entirely for users who have no reports assigned to them — it is never greyed out or shown as locked.

| **Condition** | **Navigation Behaviour** |
|---|---|
| User has zero reports assigned | Reports item hidden from sidebar and tab bar |
| User has one or more reports assigned | Reports item visible in sidebar and tab bar |
| User has opted out of email delivery | Reports item remains visible — opt-out affects email only |
| Super Admin removes all reports | Reports item hidden immediately on next page load |
| New report assigned by Super Admin | Reports item appears on next page load or session refresh |

## 10.A.2 Reports Inbox

The Reports Inbox lists all reports assigned to the user, grouped by report type. Each entry shows the report name, the configured cadence, the date and time of the most recent generation, and a download button for the most recent file.

| **Field** | **Detail** |
|---|---|
| Report name | As configured by Super Admin in M20 |
| Cadence | Displays the configured schedule: Weekly / Monthly / Termly / Custom date |
| Last generated | Date and time the most recent report file was produced — shown in UAE time (UTC+4) |
| Data scope | Brief label showing the filter applied: e.g. 'Own department', 'All branches', 'Primary only' |
| Format | PDF / CSV — as configured by Super Admin |
| Download (latest) | One-tap download of the most recent report file |
| History | Expandable panel showing all prior generated files for this report type — reverse chronological, retained for 12 months |
| Email status | Indicator showing whether email delivery is active or opted out for this user |

## 10.A.3 Scheduled Email Digest

All reports assigned to a user are bundled into a single digest email per delivery cycle. Attachments are included in the email only if the total attachment size is below 10 MB; above that threshold, the email contains download links only.

| **Role Group** | **Default Cadence** | **Default Content** |
|---|---|---|
| Super Admin | Monthly | Full digest — all reports assigned to this Super Admin |
| Admin Head | Monthly | Full digest — all reports assigned to this Admin Head |
| HR/Finance (Custom) | Weekly | Staff Headcount, Document Expiry, Departure Pipeline, CPD Tracker, Revenue by Teacher |
| HOD | Monthly | Department-scoped reports assigned to this HOD |
| Admin | Monthly | Reports assigned to this Admin by Super Admin |
| All other roles | Monthly | Any reports explicitly assigned by Super Admin |

All digests send at 07:00 UAE time on the configured delivery day. Report data is snapshotted at 00:00 UAE time on the delivery day. If the delivery day falls on a UAE public holiday, the digest sends on the next working day.

## 10.A.4 User Email Opt-Out

Any user can opt out of email digest delivery independently of their in-app reports access. Opting out stops all future digest emails for that user but does not remove reports from their in-app inbox.

| **Method** | **Behaviour** |
|---|---|
| Email footer link | Single click opts the user out immediately. Confirmation screen shown. No login required. |
| Profile settings toggle | User navigates to Profile > Notifications > Report Digest and toggles off. Takes effect from the next scheduled digest. |
| Super Admin override in M20 | Super Admin can disable email delivery for any user from M20. Does not affect the user's own toggle. |

| **Status** | **Meaning** |
|---|---|
| Active | Email digest is enabled and will send on the next scheduled cycle |
| Opted Out (by user) | User has opted out via email link or profile settings |
| Disabled (by Admin) | Super Admin has disabled delivery for this user |

## 10.A.5 Super Admin Configuration in M20

All report assignment and delivery configuration is managed by Super Admin from M20 Tenant Settings under the Reports section. Configuration is at the individual user level — there is no bulk assignment tool in v1.

| **Setting** | **Detail** |
|---|---|
| Assigned reports | Super Admin selects which report types this user receives. Data scope is automatically capped at the user's role permissions. |
| Cadence | Weekly / Monthly / Termly / Custom date — set per user |
| Delivery format | PDF / CSV / Both — set per user |
| Delivery day | Day of week (weekly) or day of month (monthly) — default: Monday / 1st |
| Email delivery status | Active / Disabled — Super Admin toggle independent of user's own opt-out |

If a user's role changes after a report is assigned, the system re-evaluates eligibility. Reports no longer permitted for the new role are automatically removed from the user's inbox and email digest. Super Admin is notified of any automatic removals.

## 10.A.6 Report Generation and File Management

Reports are generated automatically at 00:00 UAE time on the delivery day, before the email digest sends at 07:00.

| **State** | **Meaning** |
|---|---|
| Scheduled | Report is configured and will generate on the next scheduled cycle |
| Generating | Report is currently being produced |
| Generated | Report file is available for download |
| Failed | Generation encountered an error — Super Admin notified; prior version remains available |
| Queued | Report has more than 5,000 rows — generation is queued and the user is notified in-app when complete |

Generated report files are retained in the in-app inbox for a rolling 12 months from generation date. Files are removed automatically after 12 months. The system audit log retains a record of all report generation events permanently.

## 10.A.7 Relationship to M10

| **Capability** | **Module** |
|---|---|
| Report generation (on-demand) | M10 — user triggers generation from the dashboard |
| Report generation (scheduled) | M10.A — platform generates on the configured cadence |
| Report viewing and download | M10.A — in-app inbox is the primary access point for scheduled reports |
| Report configuration (assignments) | M20 Tenant Settings — Super Admin only |
| Email digest delivery | M10.A — digest engine, delivery log, opt-out |
| Data scope and access rules | M10 — role-based access rules defined in M10 apply to M10.A without modification |

M10.A does not introduce new report types. All report types available for assignment in M10.A are defined in M10. If a new report type is added to M10 in a future version, it becomes automatically available for assignment in M10.A without changes to this module.
