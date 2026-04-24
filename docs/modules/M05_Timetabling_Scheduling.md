# ENROLLA
# M05 — Timetabling & Scheduling
v2.3 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

M05 is the scheduling and timetabling engine for Enrolla. It manages all session creation, recurrence, teacher assignment, room allocation, calendar templates, and waitlist management. M05 is the source of truth for what is happening, when, where, and with whom. It feeds attendance marking (M06), assignment delivery (M14), and progress tracking (M19).

| **Property** | **Value** |
|---|---|
| Module code | M05 |
| Version | v2.4 |
| Status | Current |
| AMDs absorbed | AMD-04.17 (waitlist double-lock resolution), AMD-02.22 (configurable waitlist window), AMD-M05-MKTG (Marketing Moments ownership moved to M13), April 2026 RBAC overhaul (permissions section added) |
| Dependencies | M06, M09, M11, M20 |
| Phase | v1 |

---

# 01.1 Session Types

| **Type** | **Description** |
|---|---|
| Regular session | A standard recurring or one-off tuition session. Linked to a subject, teacher, student group, and room. Generates attendance records and session deductions. |
| Trial session | A one-off introductory session booked via M04. Treated as a regular session for attendance and scheduling purposes. Not part of a recurrence series. |
| Makeup session | A compensatory session for an absent student. Linked to the original missed session. Does not generate a new session deduction — it fulfils the missed one. |
| Assessment session | A placement or diagnostic assessment. Booked via M03. No session deduction. Teacher logs assessment outcome separately. |
| Meeting session | An internal staff meeting. Attendees added from staff directory. No student attendance. Logged on M09 staff profiles. |
| Event | A whole-centre or departmental event (e.g. parents evening, graduation). Managed via M04.B. Visible on the What's On page. |
| Blocked Time | A room or teacher slot reserved without a session attached. Used to prevent double-booking during events, maintenance, or admin periods. No students enrolled, no attendance record generated, no session deduction. Only Admin and above can create Blocked Time entries. Visible on the calendar to all staff as a grey block. |

---

# 01.2 Creating Sessions

Sessions are created individually or via recurrence. Creation is gated by `timetable.createSession` — see 01.11 Permissions.

| **Element** | **Detail** |
|---|---|
| Required fields | Subject, year group, day, start time, duration (45, 60, or 120 minutes only — 90 minutes is platform-blocked), session type, room (optional) |
| Session duration rule | Only 45, 60, and 120-minute sessions are permitted. Duration drives the billing unit: 60 min = 1 unit, 120 min = 2 units. Non-integer deductions are blocked at scheduling. Admin can override with a logged reason. |
| Deduction timing | Session deduction occurs at attendance confirmation, not at scheduling. Scheduling a session does not immediately deduct from the invoice balance. |
| Start time | Any time. No forced offset on regular sessions. Assessment sessions must start at 15, 30, or 45 minutes past the hour (never on the hour) to stagger front-desk traffic. This is a hard block at scheduling. The system will not save an assessment session with an on-the-hour start time. This restriction applies to all Assessment session types and cannot be overridden by any role. |
| Room assignment | Optional. Rooms are configured in M20 with soft and hard capacity limits. Soft cap triggers a warning. Hard cap blocks scheduling when exceeded. |
| First booking wins | If two sessions are created simultaneously and both attempt to book the same room, the first save wins. The second session creator sees a conflict alert. |

---

# 01.3 Recurrence

Sessions can be set up as recurring series to avoid manual creation every week. Recurrence creates a linked series of sessions that can be edited individually or collectively.

| **Element** | **Detail** |
|---|---|
| Recurrence options | Weekly (same day and time every week), bi-weekly, custom (select specific dates). End condition: end date or number of occurrences. |
| Editing a recurring session | Three-way prompt identical to Google Calendar: Edit this session only / Edit this and all following sessions / Edit all sessions in the series. |
| Cancelling a recurring session | Same three-way prompt. Cancelled sessions are logged in the audit trail. The recurrence series continues unless all sessions or all future sessions are cancelled. |
| Conflict check on recurrence creation | The system checks all recurring instances against existing bookings for the teacher and room before confirming. Conflicts are shown before the series is saved. |

---

# 01.4 Teacher Assignment

Teachers are assigned to sessions separately from session creation. This allows Calendar Templates to be built without teachers, and staffing to be applied afterwards.

| **Element** | **Detail** |
|---|---|
| Assignment | Admin or HOD assigns a teacher to a session from the session detail view. Teachers can only be assigned to subjects within their qualification scope (configured in M09 staff profile). |
| Cover assignment | If the assigned teacher is unavailable, Admin or HOD assigns a cover teacher. The cover assignment is logged. The original teacher remains on the session record. |
| Teacher view | Teacher sees all sessions assigned to them in their M05 calendar view. Sessions assigned to others are not visible unless cross-subject visibility is enabled. |
| Unassigned sessions | Sessions with no teacher assigned are shown with a Cover Required indicator. Admin Head and HOD can see all unassigned sessions in their department. |
| Topic link action | Teacher can link one or more topics from the M11 topic tree to the session from within the session detail view. Saving topic links starts the 48-hour progress tracker update clock for each linked topic. The topic link action is available from session end time until 48 hours after session end. |

**Teacher Off-Boarding and Future Sessions:**
When a teacher's off-boarding is initiated in M09, their scheduled sessions are not automatically cancelled or reassigned. The teacher continues to deliver all sessions up to and including their last working day. As part of the off-boarding handover (M09), the teacher and Admin must jointly review all sessions scheduled beyond the last working day and resolve each one: reassign to an available teacher, reschedule with a different teacher, or cancel with parent notification where required. Resolution of future sessions is a mandatory item on the M09 off-boarding checklist and must be completed before off-boarding can be marked as done.

---

# 01.5 Calendar Templates

Calendar Templates are skeleton timetables that define the schedule structure for a term without teacher assignments. They allow rapid term rollover by separating structure from staffing.

| **Element** | **Detail** |
|---|---|
| Template contents | Subject, year group, day, time, recurrence, session type, optional room. No teachers assigned in template. |
| Applying a template | Admin selects a template and a target term. Preview shows all sessions the template will create. Admin maps teachers to each session type before confirming. System runs a conflict check. Admin resolves conflicts. Admin confirms. When applying a calendar template, the system also detects internal conflicts — sessions within the template that conflict with each other (e.g. the same teacher scheduled in two sessions simultaneously within the template itself). Internal conflicts are flagged before the template is applied, not after. |
| Template management | Templates are created, edited, and archived in M20 by Super Admin. Templates are reusable across terms. |
| Partial application | Admin can apply selected parts of a template rather than the full template. Individual session types can be excluded. |

---

# 01.6 What's On Page

The What's On page is a forward-looking digest visible to all staff. It shows upcoming sessions, events, and marketing moments for the selected time window.

| **Element** | **Detail** |
|---|---|
| Time windows | This week / Next week / This month / Custom date range |
| Content sources | M04.B events, M05 calendar sessions, M11 exam events, Marketing Moments |
| Marketing Moments | Marketing Moments are created and managed in M13 (Marketing tab). The What's On page displays active Marketing Moments as a visually distinct lane — separate from session, event, and exam rows. All staff can see Marketing Moments here. No Marketing Moment can be created or edited from the What's On page. Marketing Moments auto-hide 48 hours after the event date has passed. Once hidden, they do not reappear. |
| Read-only | All staff can view the What's On page. No staff can edit it directly. All content is generated from source modules. |

---

# 01.7 Waitlist Management

When a session is at capacity, additional students join the waitlist. Waitlist offers are generated automatically when space becomes available.

| **Element** | **Detail** |
|---|---|
| Joining the waitlist | Admin adds a student to the waitlist for a specific session. Position is confirmed by timestamp — first in, first offered. Student and guardian notified. |
| Offer generation | When a space opens, the system offers the slot to the next eligible student on the waitlist. Offer includes: session details, expiry time, confirmation link (Phase 2 — copy-paste in v1). |
| Offer window | Configurable in M20. Default: 24 hours. Minimum: 30 minutes. If the offer expires without acceptance, it moves to the next student automatically. |
| Waitlist override | Admin can book a student into a session that conflicts with a pending waitlist offer. On confirming, the system prompts: "This student has a pending waitlist offer for [Subject] on [Day/Time]. Booking this session will automatically decline that offer. Confirm?" On confirmation, the pending offer is declined. The slot returns to the waitlist queue. A High priority M16 task is immediately raised for Admin: "Waitlist offer auto-declined for [Student name] — [Subject] [Day/Time]. Trigger next offer from the waitlist." Admin Head receives an in-app notification. Admin manually triggers the next offer. Teacher cannot perform this override — Admin and above only. |
| Parent notification on auto-decline | Parent receives notification: "Your waitlist offer for [Subject] — [Day/Time] has been declined because an alternative session was booked for [Student name]." |
| Manual decline | Admin can manually decline any pending waitlist offer from the waitlist management view without booking an alternative. |
| Waitlist view | Admin sees the full waitlist for any session: position, student name, time waiting, offer status (Pending / Expired / Accepted / Declined). |

---

# 01.8 Conflict Management

| **Element** | **Detail** |
|---|---|
| Teacher conflict | System warns when a teacher is assigned to two overlapping sessions. Warning does not block — Admin confirms or reassigns. |
| Room conflict | Room double-booking: first booking wins. Second creator sees a conflict alert at time of save. |
| Student conflict | Booking a student into two overlapping sessions generates a warning. Admin confirms or changes the booking. |
| Closure day warning | Scheduling a session on a configured closure day (IMI: Sunday) generates a warning. Not a block. |
| Outside office hours | Scheduling a session outside configured office hours (IMI: 08:00–20:00 Mon–Sat) generates a warning. Not a block. |

---

# 01.9 Meeting Sessions

Meeting sessions are internal staff gatherings logged in M05 for calendar visibility and attendance tracking.

| **Element** | **Detail** |
|---|---|
| Creation | Admin or Admin Head creates a meeting session. Attendees selected from the staff directory. |
| Attendance | Each attendee is marked Present, Absent, or Excused after the meeting. |
| Profile logging | Meeting attendance is logged on each staff member's M09 profile under the Meetings tab. |
| No student attendance | Meeting sessions do not generate student attendance records or session deductions. |

---

# 01.10 IMI Reference Configuration

| **Setting** | **IMI Value** |
|---|---|
| Permitted session durations | 45, 60, 120 minutes. 90 minutes is platform-blocked. |
| Assessment start time offset | 15, 30, or 45 minutes past the hour only (never on the hour) |
| Room capacity default | Soft cap. Hard cap configurable per room in M20. |
| First booking wins | Yes — platform-wide for room conflicts |
| Waitlist offer window | 24 hours (configurable in M20, minimum 30 minutes) |
| Waitlist override | Admin can override pending waitlist offers when booking an alternative session. Teacher cannot. |
| Closure days | Sunday (warning on scheduling, not a block) |
| Office hours | Monday–Saturday 08:00–20:00 (warning outside hours, not a block) |
| Calendar Templates | Managed by Super Admin in M20 |
| Marketing Moments | Admin Head and Super Admin only |
| Cross-branch visibility on 2nd branch | Off by default. Super Admin enables. |

---

# 01.11 Permissions

All timetable access is hidden for unauthorised roles — never greyed out. Permission keys are enforced platform-wide via PL-02.

## Page Access

`timetable.view` — Super Admin, Admin Head, Admin, Academic Head, HOD, Teacher, TA. **HR/Finance has no timetable access** — the timetable nav item is hidden entirely for this role.

## Action Permissions

| **Action** | **Permission key** | **Permitted roles** |
|---|---|---|
| View timetable | `timetable.view` | Super Admin, Admin Head, Admin, Academic Head, HOD, Teacher, TA |
| Create session | `timetable.createSession` | Super Admin, Admin Head, Admin, Academic Head, HOD |
| Edit session | `timetable.editSession` | Super Admin, Admin Head, Admin, Academic Head, Teacher, TA |
| Cancel session | `timetable.cancelSession` | Super Admin, Admin Head, Admin, Academic Head, HOD |
| Assign teacher | `timetable.assignTeacher` | Super Admin, Admin Head, Admin, HOD |

**Notes:**
- Teacher and TA have `timetable.editSession` — this covers marking session notes and linking topics from within their own sessions. It does not grant session creation or cancellation.
- Academic Head has `timetable.editSession` (added April 2026) and `timetable.cancelSession` but not `timetable.createSession` — consistent with their strategic oversight role.
- HOD has `timetable.createSession` and `timetable.cancelSession` scoped to their department, but not `timetable.editSession`.
- HR/Finance has no timetable permissions of any kind. The nav item is fully hidden.
