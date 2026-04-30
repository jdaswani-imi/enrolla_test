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
Opening a lead opens a **two-column detail panel**. The left column shows all lead fields, the journey/conversion tracker, and stage action buttons. The right column is the **Team Chat** (internal staff-only messaging), which now includes stage change events interleaved chronologically with messages. The divider between the two columns is **resizable** — staff can drag it to adjust the split; the right column defaults to a wider starting size.

**Inline field editing:** Seven fields in the lead detail panel are editable in-place — Year Group, Subjects, Guardian name, Phone, Source, Assigned to, and Programme. Hovering any editable field reveals a small pencil icon to the right of the value. Clicking the field switches it to an inline input: a text box for free-text fields, a dropdown for single-value selects (Year Group, Source), a multi-select checkbox panel for Subjects, and a search-filterable staff picker for Assigned to. Pressing Enter or clicking outside commits the change; pressing Escape cancels without saving. While saving, a small spinner appears inline. On success, the field briefly flashes green; on error it flashes red and reverts to the previous value. Empty required fields (Guardian name, Phone) show a red border and a "Required" helper before blocking the save. Field edits update the lead's Last Activity timestamp.

**RBAC for field editing:** Only users with the Admin, Admin Head, or Super Admin role can edit lead fields. Admin (not Admin Head) can only edit leads assigned to them or leads with no assignment. All other roles see fields as read-only.

**Activity Timeline — field-edit entries:** Every successful field save is logged as a permanent entry in the Activity Timeline. Field-edit entries are visually distinct: they show a blue PencilLine icon instead of the coloured dot used by stage-change entries. Each entry shows the field label, who made the change, and a "Was → Now" block in monospace below the label line. Phone number changes are logged with the last 4 digits only (e.g. `***4344`) for privacy. No entry is created if the new value matches the old value.

**Stage history inline in chat:** Pipeline stage changes are interleaved chronologically in the Team Chat timeline as system event rows — a pill-shaped banner showing the staff member's avatar (initials, colour-coded), their name, "moved to", and the new stage rendered as a colour-coded badge. Timestamps show as relative time ("13h ago", "2d ago"). Stage events appear between messages at the correct chronological position so the full conversation history tells a continuous story. The stage history refreshes automatically whenever the lead advances to a new stage.

**Team Chat — fully persistent and real-time:** Messages are stored in Supabase (`lead_messages` table) and survive page refreshes. When a lead is opened the full message history loads from the database. New messages sent by any staff member appear instantly in every other open session via **Supabase Realtime** (no refresh needed). Emoji reactions are also persisted and synced in real time across sessions.

**WhatsApp-style message bubbles:** Sent messages appear right-aligned with an amber background; received messages appear left-aligned on a white card. Avatar and author name are shown once per consecutive run from the same sender (within 2 minutes), then hidden for grouped follow-up messages to avoid visual repetition. Every bubble shows a timestamp bottom-right. The message feed uses a light blue-grey background (#F0F2F5) to match the WhatsApp chat aesthetic.

**Three ways to interact with a message:** (1) **Hover action buttons** — hovering any message row reveals two icon buttons beside the bubble (to the left of sent bubbles, to the right of received bubbles): a smile-plus icon that opens the emoji reaction picker, and a reply arrow that sets the reply target. (2) **Chevron dropdown** — a small ChevronDown appears in the top-right corner of the bubble on hover; clicking it opens a dropdown with Reply, React, Copy text, and Delete options. (3) **Right-click context menu** — right-clicking the bubble also opens the same menu. All three interaction surfaces are equivalent and work in parallel.

**WhatsApp-style replies:** Selecting "Reply" from the context menu attaches a quoted-reply bar above the message composer — showing a 2px amber left-accent bar, the original author's name in amber, and a one-line preview of the original text. The ✕ button or Escape key dismisses the reply intent. When sent, the reply bubble contains the quoted block embedded at the top (tinted differently for sent vs received bubbles), with the reply text below. Clicking the quoted block scrolls to the original message and briefly flashes it with a yellow background for 300 ms. The feed is flat and chronological — no nested thread panels or expand/collapse thread indicators exist.

**Emoji reactions:** Reaction pills render below each message bubble (not inside it) as small rounded chips showing the emoji and count. Clicking a reaction pill you own toggles it off; clicking one you haven't reacted to increments it. Reactions are persisted in Supabase and sync in real time. Hovering a chip shows a tooltip listing who reacted.

Deleting a message uses a **soft-delete / undo** pattern — the bubble is instantly replaced in-place with a "Message deleted. Undo" bar; clicking Undo within 10 seconds restores the message. When the user is scrolled up and a new message arrives via Realtime, an amber **"N new replies"** pill appears above the input bar; clicking it scrolls to the latest message and dismisses the counter.

**Reaction notifications:** When a staff member reacts to a message written by someone else, a **reaction notification** is pushed into the bell dropdown for the message author. The notification shows the reactor's avatar with the emoji as a badge overlay, a summary line ("{Name} reacted to your message"), an italic preview of the first 40 characters of the reacted-to message, and the relative time and lead name ("4m ago · in Jude's ticket"). Unread reaction notifications have an amber-tinted background. If the same person reacts with the same emoji to the same message again (after un-reacting and re-reacting) only one notification is created — duplicates are suppressed. Un-reacting removes the corresponding notification from the store. A staff member who reacts to their own message does not generate a notification. Clicking a reaction notification navigates directly to the reacted-to message using the same scroll-and-amber-glow highlight flow as mention notifications.

**Team Chat @mention system — end-to-end:** Typing `@` in the message input opens a dropdown that appears directly above the composer input, full-width and anchored to it. The dropdown shows all staff (active, invited, and on-leave statuses — not just active), plus group shortcuts (`@all`, `@admins`, `@teachers`). Results filter as the user types; the list is scrollable when there are many results. Keyboard navigation (arrows, Enter, Tab, Escape) and click both work. The dropdown always opens upward and is constrained within the chat container. Selecting a name inserts a styled blue chip into the input.

When a message is sent, each mentioned staff member receives a **persistent mention notification stored in Supabase** (`notifications` table, RLS-protected per user). Notifications are written server-side only (the sender never notifies themselves). Notifications are fetched from the server on bell open and polled every 30 seconds, so recipients see the notification the next time they are active — regardless of which browser or session they are on. Group pseudo-mentions (`@all`, `@admins`, `@teachers`) are excluded from individual notification delivery. The notification title is generic ("You were mentioned in a lead/task chat") and includes a deep-link back to the exact message. The mention notification system works identically for both lead chat and task chat.

**Click-to-navigate from mention and reaction notifications:** Clicking a mention or reaction notification in the bell dropdown closes the dropdown, marks the notification read, and navigates directly to the tagged/reacted-to message in the lead chat thread. If the user is already on the Leads page the lead dialog opens without a full page reload. The chat thread scrolls with an ease-out cubic animation (480 ms) so the target message lands in the centre of the visible area. Once the scroll completes, the entire message row glows with an amber highlight animation that peaks and fades over 2.6 seconds. If the message no longer exists a toast is shown and no scroll is attempted.

Sent messages render @mention names as **underlined bold text** inline within the message. On received messages, self-mentions appear in amber with an amber underline; others appear in blue. On sent (own) messages all mentions render in white with a white underline so they remain legible on the amber bubble background. Staff who no longer exist in the system render as struck-through grey. Group mentions render in amber.

### Lead Actions
- **Create / Edit** — Admin+
- **Delete** — Admin+
- **Advance stage** — Admin+ (some stages require Academic Head+ to skip)
- **Assign to staff** — Admin Head+
- **Set DNC (Do Not Contact)** — Admin Head only
- **Convert to Student** — after reaching "Won" stage (see [Enrolment Journey](#enrolment-journey))
- **Log activity** — any staff can log interactions (calls, messages, notes)

### Kanban Board Personalisation

Staff can personalise their Kanban view independently — settings are saved per user and persist across sessions. A **"Personalise"** button (sliders icon) in the top toolbar opens a compact settings panel with four controls:

- **Card Density** — Three presets: *Compact* (name + year/subjects only, minimal height), *Default* (current layout), *Comfortable* (larger cards, all fields visible including phone and pipeline duration).
- **Column Width** — A slider from 160 px (Compact) to 400 px (Wide), defaulting at 200 px. Three snap points labelled Compact / Default / Wide. On viewports narrower than 1280 px the width is capped at 200 px to prevent overflow.
- **Card Field Visibility** — A checklist to show or hide: Guardian name, Phone number, Source badge, Assigned to, Days in stage, Days in pipeline, Enquiry date. Student name, year group, and subjects are always visible.
- **Collapse Columns** — Any pipeline stage column can be collapsed to a 48 px icon-only strip showing the stage name vertically and the lead count. Click the collapse arrow on the column header (or double-click the header) to collapse; click the strip to expand. Collapsed columns persist across sessions.

All changes apply instantly (auto-saved with a 500 ms debounce). A "Reset to default" link at the bottom of the panel restores all settings. Each user's preferences are stored independently — changing your view does not affect other staff members.

### List View — Stage Group Headings

In List view, leads are grouped by pipeline stage. Each stage heading is rendered as a **coloured pill** — the colour matches the corresponding Kanban column label exactly (e.g., blue for Contacted, amber for Trial Booked, green for Won). A small coloured dot appears inside the pill, and the chevron icon matches the stage colour. Clicking a heading collapses or expands that stage group.

### List View — Collapse / Expand All

The list toolbar includes a **"Collapse all"** button (shown when most or all stages are expanded) and an **"Expand all"** button (shown when half or more stages are collapsed). Clicking either button collapses or expands all stage groups simultaneously. Individual stage chevrons continue to work independently. The "Show/Hide empty stages" toggle works alongside collapse state — hidden empty stages remain hidden regardless of expand/collapse.

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

### Team Chat (per-task)

Every non-Personal task has a **Team Chat** section inside the task detail panel, below the subtasks checklist.

**Real-time messaging:** Messages are stored in Supabase (`task_messages` table) and sync instantly across all open sessions via Supabase Realtime — no refresh needed.

**@mention notifications:** Typing `@` opens a staff picker with name, role, and avatar. Selecting a staff member inserts a styled chip and sends a push notification to that person. Clicking a mention notification deep-links directly to the task with the referenced message highlighted and scrolled into view (via `?taskId=...&messageId=...` URL params).

**WhatsApp-style interaction:** Messages use the same WhatsApp bubble model as Lead Chat. Hovering a message row reveals inline hover buttons (SmilePlus, Reply) beside the bubble, a ChevronDown dropdown in the bubble corner, and right-click also opens the context menu — all three are equivalent. Reply bar appears above the composer when replying; clicking a quoted block inside a reply bubble scrolls to the original.

**Emoji reactions:** Reaction pills render below each bubble and sync in real time via Supabase Realtime. Staff can toggle their own reactions on and off; hover tooltips show who reacted.

**Soft-delete with undo:** Deleting a message fades it out immediately and shows a 9.7-second undo bar. If not undone, the message is permanently deleted. If undone, it reappears with no visible interruption.

**Record chips:** Messages can include attached reference chips linking to Students, Leads, Invoices, or Tasks. Chips are rendered as compact pills inside the bubble.

**Personal tasks are excluded** — the Team Chat section does not appear for tasks of type Personal.

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

### Internal Messages Hub
A staff-only messaging workspace embedded in the Automations page. Channels include general, leads-pipeline, academic-team, finance-admin, and hr-notices. Direct Messages and Thread Type filters are also accessible. Messages use the **WhatsApp interaction model**: right-aligned amber bubbles for sent messages, left-aligned white bubbles for received. Avatar and author name are suppressed for consecutive messages from the same sender within 2 minutes. Right-clicking any bubble opens a context menu (Reply, React, Copy, Delete). Replies embed a quoted block at the top of the bubble; clicking it scrolls to the original message with a yellow flash. The feed is flat and chronological — there is no separate thread panel. Emoji reaction pills appear below bubbles and toggle on click.

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

### Class Groups & Class Discussion
Teachers can create class groups per subject for discussion and announcements. Post types: Announcement | Discussion | Question. Posts are visible to enrolled students. Moderators can remove posts.

**WhatsApp-style class discussion:** The Class Discussion tab uses the same WhatsApp interaction model as Team Chat and Internal Messages. Posts render as right-aligned amber bubbles (sent) or left-aligned white bubbles (received). Hovering a post row reveals hover action buttons (SmilePlus, Reply — Reply hidden for TA) beside the bubble, and a ChevronDown in the bubble corner. Right-clicking also opens the context menu. TA users see a read-only view — they can react and copy but cannot reply or delete. Replied posts display a quoted block at the top of the bubble with a clickable link that scrolls to the original post with a brief yellow flash. The feed is flat and chronological; there are no nested thread panels.

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
| Reset password | HR/Finance+ (sends a recovery email to the staff member's address) |
| Edit profile | HR/Finance |
| Assign role | Super Admin only |
| View salary | HR/Finance+ |
| Revoke access | Super Admin or HR/Finance |
| Activate emergency leave | Admin Head+ |
| Archive | Super Admin |
| Delete | Super Admin |
| Initiate offboarding | HR/Finance |
| Verify CPD hours | HR/Finance |

The **Reset password** action appears in the row actions menu for any staff member who has completed onboarding (not Invited or Off-boarded). Clicking it sends a secure one-time recovery link to the staff member's email, which takes them to the password reset screen. If the link has already been used or has expired, the user is redirected to the login page with a clear "link expired" message and a prompt to request a new one.

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

## 19. My Profile

The My Profile page lets any logged-in user manage their own account. It is split into three tabs:

- **Account** — Edit display name and phone number. Change password (requires new password + confirmation, min 8 characters). A **"Forgot your password?"** link below the password form sends a reset link to the user's registered email address — this is the same recovery flow as the login-page forgot password, pre-addressed to the signed-in user so they do not need to type their email. Session management: list of active sessions by device, with a "Revoke" action per session.
- **Preferences** — Email notifications, in-app notifications, weekly digest toggle, and layout density (Default / Compact / Detailed).
- **Activity log** — Chronological list of recent actions taken by the user across modules (People, Finance, Tasks, Academic, Staff, Comms).

The profile avatar can be uploaded or removed from the sidebar panel on the left.

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

### Display Formatting (Student & Guardian Portals)
All profile field values are normalised at the render layer using a shared formatter library. Raw database values are stored as-is; formatting is applied only for display:
- **Names** (student, guardian, linked students) are always shown in Title Case.
- **Date of Birth** is displayed as DD MMM YYYY with a computed age in parentheses — e.g. "30 May 2014 (Age 11)".
- **Gender** always has a capitalised first letter — "Female" not "female".
- **Phone / WhatsApp** numbers are formatted as +971 XX XXX XXXX for UAE numbers. Blank numbers show an em dash (—). If WhatsApp matches the primary phone, the label reads "✓ Same number".
- **Student Reference** numbers are zero-padded to four digits with a # prefix — e.g. "#0004".
- **Year Group** is always shown as "Year N" with a capital Y — "Year 8" not "Y8" or "year 8". KG codes are preserved as-is.
- **Department** is always Title Case — "Primary", "Senior".
- **AED amounts** use a thousands separator with no trailing decimals unless the value has cents — e.g. "AED 1,250".
- All null, empty, or "N/A" values are replaced with an em dash (—) in the UI.
- Count fields always show "0" rather than blank.

---

## 21. Motion & Animations

Enrolla uses **Framer Motion** for all UI animations, replacing the previous CSS-only approach. Animations are automatically disabled when the user has `prefers-reduced-motion` enabled in their OS settings.

### Page Transitions
Every route change triggers a smooth fade + subtle slide-up transition (220 ms ease-out entry, 150 ms ease-in exit). This is applied globally in the app shell and covers all pages within the main layout.

### Sidebar Flyout Panel
The secondary navigation panel (People, Academic, Finance, Reporting) slides in from the left edge (150 ms ease-out) and slides back out on close, replacing the previous CSS keyframe animation.

### Login Page
On first load, the left branding panel content (logo, headline, tagline) rises in with a staggered sequence — each element delayed 100 ms after the previous. The right panel form fades up simultaneously.

### Dashboard KPI Cards
When the dashboard finishes loading, the KPI card grid animates in with a staggered fade-up — each card appears 50 ms after the previous, creating a cascade effect.

### Students Stat Cards
The three summary stat cards (Total, Active, Withdrawn) at the top of the Students page stagger in identically to the dashboard KPI cards.

### Additional pages
- **Finance page** ([app/finance/page.tsx](app/finance/page.tsx)) — Summary stat cards stagger in on each tab (Invoices, Payments, Credits)
- **Staff page** ([app/staff/page.tsx](app/staff/page.tsx)) — Staff summary stat grid (Total, Active, On Leave, Pending) staggers in
- **Enrolment page** ([app/enrolment/page.tsx](app/enrolment/page.tsx)) — Stat cards stagger in across all three tabs (Enrolments, Trials, Withdrawals)
- **Tasks page** ([app/tasks/page.tsx](app/tasks/page.tsx)) — Kanban columns stagger in when switching to board view; list rows stagger in when a section is expanded
- **Guardians page** ([app/guardians/page.tsx](app/guardians/page.tsx)) — Table container fades in once the API fetch completes

### Principles applied
- Durations: 150–250 ms for micro-interactions; 350 ms for login entrance
- Easing: `easeOut` for all entering elements; `easeIn` for exits
- Max 1–2 animated elements per view to avoid distraction
- `prefers-reduced-motion` respected everywhere via Framer's `useReducedMotion` hook

---

---

## Multi-User Identity & Attribution

All actions and messages throughout the app are now attributed to the **actually logged-in user** rather than a hardcoded name. The logged-in user's name is fetched from the `staff` table via `/api/auth/me` (matched by Supabase auth user ID) and propagated everywhere:

- **Lead chat messages** — sent under the logged-in user's name; "is own" message highlighting works per user; users can delete their own messages via a soft-delete / undo pattern: the message is immediately replaced in-place with a "Comment deleted. Undo" card; if Undo is clicked within 10 seconds the message is fully restored; if the timer expires the delete is committed (API call + Realtime propagation). The same undo-delete pattern applies to messages in the Internal Messaging channels (Automations section).
- **Lead stage changes** — "Stage changed to X by …" and "Stage change undone …" show the real actor's name
- **Task creation defaults** — new tasks auto-assign to the logged-in user in all task dialogs (Leads, Students, Guardians, Tasks page, Automations)
- **Internal messaging (Automations)** — channel messages are sent and attributed under the logged-in user
- **Invoice "Invoiced By"** — auto-populated with the logged-in user's name
- **Trial fee waiver log** — "Approved by …" reflects the approving user
- **Journey stage transitions** — actor name passed from the calling component's session

The user-identity cache (`useCurrentUser`) is now scoped per Supabase user ID in sessionStorage, preventing any previous user's cached name from leaking across logins in the same browser tab.

*This document is automatically updated before every commit to reflect the current state of the app.*

---

## Security & API Hardening (QA Audit — 2026-04-30)

A comprehensive security and quality audit was completed. The following changes were applied:

### Authentication & Middleware
The middleware (`proxy.ts`) correctly enforces authentication on all non-public routes, redirecting unauthenticated users to `/login` and returning 401 for unauthenticated API requests. Public routes are: `/login`, `/auth/*`, `/welcome`, `/reset-password`.

### Tenant Isolation Fixes
`GET`, `PATCH`, and `DELETE` on individual student and guardian records now filter by `tenant_id` in addition to `id`. Without this filter, any authenticated user could access records from other tenants via direct UUID requests.

### API-Layer RBAC
A `requireRole()` helper was added to the auth utilities. It is now applied to the following mutations:

- **DELETE student** — requires `super_admin`
- **PATCH org settings** — requires `super_admin`
- **Create/update/delete branches, departments, academic years, rooms, task groups, calendar periods, public holidays, org logo** — requires `super_admin` or `admin_head`

The database layer already enforces some RBAC via migration 031. The API layer now provides a second, independent enforcement point.

### Security Headers
The following HTTP security headers are now added to all responses: Content-Security-Policy (restricts scripts, styles, images, and connections to trusted origins), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, and Permissions-Policy.

### Test Coverage
Two new E2E test files were added: `backend-integration.spec.ts` (verifies every API route returns 401 without auth, with skipped tests for RBAC 403 checks and multi-tenant isolation) and `auth-flow.spec.ts` (verifies middleware redirects, login page, public routes, auth callback error handling, and authenticated session management). Tests requiring credentials are skipped with documentation of the required environment variables.

### Post-Audit Follow-up (2026-04-30)

**JWT Custom Access Token Hook applied.** Migration `031_rbac_role_policies` was applied to the live Supabase database. The `custom_access_token_hook` PostgreSQL function now exists and is ready to embed `tenant_id` and `user_role` claims into every JWT on login. The function looks up the staff member's role and tenant from the `staff` table and appends both as custom claims. **One manual step remains:** the hook must be registered in the Supabase Dashboard under Authentication → Hooks → Custom Access Token Hook, pointing to `public.custom_access_token_hook`. Until this is done, the JWT claims will not be present and all database-layer RBAC policies that read `auth.jwt() ->> 'user_role'` will be unenforced.

**RLS policies added to three previously unprotected tables.** `complaint_linked_tickets`, `broadcast_list_members`, and `class_posts` had RLS enabled but no policies, making all rows invisible to tenant users. Tenant-scoped `FOR ALL` policies were added using EXISTS subqueries through their parent tables (`complaint_tickets`, `broadcast_lists`, `class_groups` respectively — all of which carry `tenant_id` and have RLS enabled). The tables `status_history` and `inventory_auto_deduct_rules` remain intentionally unprotected: both are written or read exclusively by service-role server handlers and exposing them to the authenticated role would serve no purpose.

**API-layer RBAC gaps closed.**
- **PATCH /api/students/:id** now requires `super_admin`, `admin_head`, or `admin` role. Previously any authenticated user could patch student records.
- **POST /api/leads** now requires `super_admin`, `admin_head`, or `admin` role. Previously any authenticated user could create leads. The GET (lead listing) handler intentionally remains auth-only — all roles may view leads.

### Known Remaining Gaps (require product decisions or credentials)
- **JWT hook registration** — must be done manually in Supabase Dashboard (see above). Provide `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env.test` and run `npx tsx scripts/verify-jwt-claims.ts` to confirm.
- No input validation (zod) on POST/PATCH request bodies — add schema validation to prevent field-level injection.
- Finance prototype stubs — download PDF, apply credit, and report queue buttons show toasts but do not call any API yet.
- No `error.tsx` on most routes — add incrementally to improve error UX.
- Inngest not configured — no background job system; automations have no async execution layer.

### Lead Ticket Full-Field Editing (2026-04-30)

Super Admins (and Admin Heads / Admins within their permission scope) can now edit every field on a lead ticket directly from the detail panel. All changes persist immediately to the database.

**Newly editable fields (wired to live API):**

| Section | Field |
|---|---|
| Header | Child name (inline edit) |
| Student | Year group, Programme (department), Subjects |
| Guardian & Contact | Guardian name, Guardian phone |
| Enquiry | Lead source, Assigned to |
| Programme | Preferred days, Preferred window |
| Flags | DNC (Do Not Contact), Sibling |

**Flag toggles** — DNC and Sibling are now interactive toggle buttons. Clicking them instantly sets or clears the flag and saves to the database. The DNC button turns red when active; the Sibling button turns amber. Roles without edit permission see read-only badges.

**Optimistic updates** — every field edit applies immediately to the UI. If the API call fails the field reverts and a toast error is shown.

**Responsive layout** — the field grid in the detail panel now collapses to a single column on narrow viewports (below 640 px), making the panel usable on tablets and smaller screens.

**API changes** — `PATCH /api/leads/:id` now accepts all of the above fields in addition to the previously supported `stage`, `status`, `lostReason`, `lostNotes`, `reEngage`, and `reEngageAfter`.
