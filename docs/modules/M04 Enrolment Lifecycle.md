---
module: "M04"
title: "Enrolment & Lifecycle"
layer: "Student Lifecycle"
folder: "03_Student"
status: "Draft"
phase: "v1"
dependencies: [M02, M05, M08, M11]
tags: [enrolla, prd, student, enrolment]
---

# ENROLLA
# [[03_Student-M04_Enrolment_Lifecycle|M04]] — Enrolment & Lifecycle
v2.2 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

[[03_Student-M04_Enrolment_Lifecycle|M04]] covers the full enrolment lifecycle for every student: trial class booking, conversion to active enrolment, payment confirmation, session allocation, mid-term changes, withdrawal, re-enrolment, and annual progression. It integrates directly with [[04_Academic-M05_Timetabling_Scheduling|M05]] (scheduling), [[06_Finance-M08_Finance_Billing|M08]] (finance), [[04_Academic-M06_Attendance_Makeups|M06]] (attendance), and [[04_Academic-M11_Academic_Courses|M11]] (academic catalogue).

| **Property** | **Value** |
|---|---|
| Module code | [[03_Student-M04_Enrolment_Lifecycle|M04]] |
| Version | v2.1 |
| Status | Draft |
| AMDs absorbed | AMD-03.05 (enrolment fee on student record), AMD-04.14 (unbilled sessions tracker), AMD-04.15 (minimum instalment rule) |
| Dependencies | [[04_Academic-M05_Timetabling_Scheduling|M05]], [[04_Academic-M06_Attendance_Makeups|M06]], [[06_Finance-M08_Finance_Billing|M08]], [[04_Academic-M11_Academic_Courses|M11]], [[09_Settings-M20_Tenant_Settings|M20]] |
| Phase | v1 |

---

# 01.1 Enrolment Creation

An enrolment is the formal record linking a student to a subject for a defined term. Enrolments are created by Admin after a trial class or direct parent request. Each enrolment record carries: student, subject, term, session frequency, assigned teacher(s), and payment status.

| **Element** | **Detail** |
|---|---|
| Who creates | Admin or Admin Head |
| Required fields | Student record, subject, term, session frequency (sessions per week), assigned teacher, invoice |
| Status on creation | Pending — until first payment is recorded and confirmed |
| Activation | Enrolment activates to Active when the first instalment meets or exceeds the minimum required amount. See 01.2 for instalment rules. |
| Enrolment fee | The AED 300 lifetime enrolment fee is attached to the student record at the point of first real enrolment. It appears as a line item on the first term invoice generated after a lead converts to an enrolled student. Trial invoices never trigger the enrolment fee. Zero-value invoices do not trigger it. The student profile shows Enrolment Fee status: Paid or Not Yet Applied. |
| Trial conversion | Trials are converted to full enrolments from the trial record. The trial outcome must be logged before conversion is available. See 01.3. |
| Duplicate enrolment block | The system blocks creating a second enrolment for the same student in the same subject record in the same term. Subject uniqueness is determined by the full subject record ID (name + year group + session duration + session type combined). A student can hold both a Group enrolment and a Private enrolment for the same subject name in the same term, provided they are distinct subject records in the [[04_Academic-M11_Academic_Courses|M11]] catalogue. Admin sees an alert with a link to the existing enrolment when a true duplicate is detected. |

## 01.1.1 Unbilled Sessions Tracker

A student can be added to the timetable before an invoice is generated. The platform does not hard block this but raises immediate alerts at attendance confirmation.

| **Element** | **Detail** |
|---|---|
| Unbilled Sessions tracker | A system-maintained list of every session attended by a student where no active invoice exists for that subject at the time of attendance confirmation. Accessible from Admin and Admin Head dashboards. Grouped by student and subject. |
| Attendance screen warning | When a teacher marks a student present and no active invoice exists for that subject, a warning banner appears before confirmation: "No active invoice for [Student] — [Subject]. This session will be logged as unbilled." Teacher can still confirm. Not a block. |
| Auto-task on attendance | On confirmation of attendance with no invoice, the system raises a High priority task assigned to Admin: "Invoice required — [Student name] attended [Subject] on [date] with no active invoice." Pre-filled link to invoice builder. Due: same working day. |
| Admin Head alert | Admin Head receives an immediate in-app alert when any unbilled session is confirmed: "[Student name] — [Subject] — [Date] — No invoice. Auto-task raised for Admin." |
| Retrospective deduction | Sessions in the tracker can be retrospectively deducted once a valid invoice is generated and the first payment recorded. Admin selects unbilled sessions to apply to the new invoice. |
| Clearing unbilled sessions | Once deducted or written off (bad debt or fee waiver with logged reason), sessions are removed from the tracker. |
| Daily digest | A daily digest showing students scheduled without invoices remains in addition to the tracker and auto-task. |

---

# 01.2 Payment Plans and Instalment Rules

Payment plans allow parents to pay for a term in instalments rather than upfront. The platform enforces a minimum first instalment floor to protect against undercollateralised enrolment.

| **Element** | **Detail** |
|---|---|
| Payment plan eligibility | Invoices of AED 4,000 or above are eligible for a payment plan. Below AED 4,000, full payment is required at enrolment. |
| IMI default — 2 instalments | First instalment: 60% of total. Second instalment: 40% of total (balance). Maximum 2 instalments by default. |
| IMI default — 3 instalments | First instalment: 50% of total. Second: 25%. Third: 25%. Admin can add a third instalment to any payment plan without prior approval. On adding a third instalment, Admin Head is notified immediately (in-app notification). The third instalment is applied immediately to the invoice — there is no approval gate. |
| Minimum first instalment floor | The minimum first payment on any payment plan is 1/n of the invoice total, where n is the number of instalments. 2-plan: minimum 50%. 3-plan: minimum 33.3%. This is the platform floor. IMI defaults are above this floor. |
| Below minimum — Admin Head approval | If a payment recorded falls below the 1/n minimum, enrolment status remains Pending. System shows warning: "Payment is below the minimum first instalment. Admin Head approval required to activate." Admin Head receives an in-app approval request and must explicitly approve before enrolment activates. |
| Below configured split — notification only | If a payment meets the 1/n minimum but falls below the configured split (e.g. 55% on a 60/40 plan), Admin Head is notified immediately but no approval gate applies. Admin must log a reason. |
| Zero-value first payment | A zero-value first payment never activates enrolment. The student must be on the fee-exempt toggle or the invoice must be legitimately zero-value. |
| VAT on instalments | VAT is calculated on the full invoice total. Instalments are not individually VAT-rated. |

---

# 01.3 Trial Classes

A trial class is a paid introductory session that precedes full enrolment. Trials are booked and managed separately from regular enrolments. Trial outcome must be logged before conversion to full enrolment is available.

| **Element** | **Detail** |
|---|---|
| Trial pricing | Primary: AED 250 per trial session. Secondary: AED 300 per trial session. Trial invoices are subject to 5% VAT. |
| Trial booking | Admin creates a trial booking from the lead or student record. Subject, teacher, date, time, and year group are required. |
| Trial invoice | Trial invoice is generated at booking. Trial invoices NEVER trigger the AED 300 enrolment fee. The enrolment fee is attached to the first term invoice generated after a lead converts to an enrolled student. Trial must be paid before the session is confirmed on the timetable. One trial is permitted per subject per student. If the same student books a trial for a second subject, a second trial invoice may be issued — but neither triggers the enrolment fee. |
| Trial outcome | Teacher logs outcome after the session: Recommended for enrolment / Not recommended / Parent to decide. Outcome is visible on the lead and student record. |
| Trial conversion | Admin converts the trial to a full enrolment from the trial record. Subject, term, frequency, and teacher are confirmed. A new invoice is generated for the term. On conversion, the system automatically calculates and applies a credit to the guardian's account. Credit formula: trial fee paid minus the standard per-session rate for the student's year group. The credit is applied as a pre-collected credit on the guardian account — it reduces the amount due on the first term invoice. Example: Primary student (Y4), trial fee AED 250, standard rate AED 180 → credit of AED 70 applied automatically. If the trial fee equals the standard per-session rate, no credit is generated. The credit calculation is shown to Admin at the conversion confirmation step before they confirm. |
| Trial fee | The trial fee is a standalone charged session. It is not credited against the term invoice. |
| Multiple trials | A student can attend multiple trial classes across different subjects. Each is invoiced separately. The AED 300 enrolment fee applies once across all trials — not per trial. |

---

# 01.4 Mid-Term Changes

Students may add or remove subjects mid-term. All mid-term changes trigger invoice recalculation. The session count rounding rule and discount tier recalculation apply automatically.

| **Element** | **Detail** |
|---|---|
| Adding a subject mid-term | Admin adds a new subject enrolment. The system calculates the pro-rata session count for the remainder of the term using the rounding rule: more than half the term remaining = full remaining sessions; at or past the halfway point = half the term session count (rounded up to the nearest whole number). A new invoice line item is added. |
| Session count rounding rule | More than half term remaining: full remaining session count. At or past halfway: half the original term session count, rounded up to the nearest whole number. |
| Removing a subject mid-term | Admin removes a subject enrolment. Invoice is recalculated. Any prepaid credit for unused sessions is applied as a credit note or refund (subject to the refund approval flow in [[06_Finance-M08_Finance_Billing|M08]]). |
| Frequency tier recalculation | Adding or removing a subject may change the student's total weekly session count, moving them into a different discount tier. The new tier rate applies to all subjects from the change date. The invoice is recalculated accordingly. |
| Discount hold on partial withdrawal | If removing one subject would reduce the student below a discount tier, Admin must explicitly confirm a two-step prompt: "Removing this subject will change the discount tier from [X] to [Y]. The invoice will be recalculated. Confirm?" This prevents accidental tier drops. |
| Bundle rate — mid-term subject withdrawal | When a student on a multi-subject bundle rate withdraws from one subject mid-term, the bundle rate stays in effect for the full term — it is not retroactively recalculated. Any refund for the withdrawn subject is reduced by the bundle discount difference (the difference between the bundle rate and the single-subject rate for the sessions remaining). Example: if a student was on a 3-subject bundle at AED X per session (discounted from AED Y single rate), the refund for the withdrawn subject = sessions remaining × (single rate Y - bundle discount difference). |

---

# 01.5 Withdrawal

Withdrawal is the full termination of a student's enrolment. Student records are retained permanently on withdrawal. Withdrawal triggers a retention workflow before the enrolment is closed.

| **Element** | **Detail** |
|---|---|
| Initiation | Admin or Admin Head initiates withdrawal from the student profile. Reason required (dropdown + optional free text): academic concerns, cost, relocation, competitor, other. |
| Retention workflow | Before withdrawal is confirmed, Admin is prompted with a retention checklist: Have you offered an alternative subject? Have you offered a payment plan? Have you escalated to Admin Head? Each step is optional but logged. Admin Head receives a notification on withdrawal initiation. |
| Invoice recalculation | Outstanding invoice balance is recalculated based on sessions attended vs sessions invoiced. Any overpayment results in a credit or refund. Any underpayment remains as an outstanding balance. |
| Enrolment status | On withdrawal confirmation, all active enrolments for the student change to Withdrawn. Future scheduled sessions are flagged as cancelled in [[04_Academic-M05_Timetabling_Scheduling|M05]]. |
| Student record | The student record is retained permanently with status Withdrawn. The record is never deleted. All history (invoices, attendance, concerns, progress) is preserved. |
| Re-enrolment | A withdrawn student can be re-enrolled at any time. Admin reopens the enrolment flow from the student record. The existing student record is used — no new record is created. |
| Outstanding balance on withdrawal | If the student has an outstanding balance at withdrawal, the record is flagged. Admin Head is notified. The balance remains on the ledger and is not written off automatically. |
| Pending per-class feedback drafts | Per-class feedback drafts for the withdrawn subject that are within the open 7-day submission window remain submittable by the teacher until the window closes naturally. The teacher is not blocked from submitting feedback for sessions that occurred before withdrawal. After the 7-day window closes, no further feedback can be submitted for the withdrawn subject. |

---

# 01.6 Term Re-Enrolment

At the end of each term, Admin runs the re-enrolment flow to carry forward active students into the next term. Re-enrolment is a bulk operation with individual review capability.

| **Element** | **Detail** |
|---|---|
| Re-enrolment list | Shows all currently active students grouped by department. Each row shows: student name, current subjects, current session frequency, last term's attendance rate, outstanding balance (if any). |
| Default action | Each student defaults to Re-enrol with same subjects and frequency. Admin can change to: Re-enrol with changes, Do not re-enrol, or Defer (parent to confirm). |
| Subject trend nudges | Students whose attendance or churn score suggests risk are flagged. Admin sees a nudge: "Consider discussing subject changes with parent before re-enrolment." |
| Bulk confirmation | Admin confirms the re-enrolment list in bulk. The system generates new term enrolment records and invoices for all confirmed students simultaneously. |
| Outstanding balance handling | If a student has an outstanding overdue invoice balance at re-enrolment time, the system does not block re-enrolment via an approval gateway. Instead: (1) An auto-task is created and assigned to Admin: 'Outstanding balance — [Student Name] — resolve before re-enrolment proceeds'; (2) Admin Head receives an in-app notification; (3) Admin Head must click-acknowledge the outstanding balance — this is a single-click confirmation, not a multi-stage approval gateway; (4) Re-enrolment proceeds once the click-acknowledge is recorded. |
| Holiday programme | Holiday programme enrolments are separate from term re-enrolments. They are processed after the main term re-enrolment run. **Note:** Holiday Programme Management ([[03_Student-M04_Enrolment_Lifecycle|M04]].B) is deferred to a post-v1 addition and is not specified in this PRD. In v1, holiday programmes are managed as Event session types in [[04_Academic-M05_Timetabling_Scheduling|M05]] — Admin creates sessions tagged as Event during holiday periods and enrols students manually. No separate holiday programme enrolment flow exists in v1. |
| Package validity | Package validity is defined by the enrolled term. A package does not carry over to the next term automatically. At the end of the enrolled term, any unused package sessions are reviewed. Pro rata calculation for mid-term package enrolments is not automatic — Admin must actively toggle on the pro rata option when enrolling a student onto a package mid-term. |

---

# 01.7 Annual Year Group Progression

At the end of each academic year, students progress to the next year group automatically. Progression runs as a bulk operation with a preview and individual override capability.

| **Element** | **Detail** |
|---|---|
| Progression trigger | Graduation date configured in [[09_Settings-M20_Tenant_Settings|M20]]. Two weeks before graduation, the system generates a preview list of all students eligible for progression. |
| Preview list | Admin and Admin Head review the preview list. Each student shows: current year group, target year group, subject enrolments, attendance rate. Admin can mark individual students as Hold Back (no progression) with a logged reason. |
| Bulk progression | Admin confirms the progression. All students not marked Hold Back advance to the next year group. Department assignment updates automatically based on new year group. |
| Reversal window | Individual progressions can be reversed within 7 days of the progression run. Admin selects the student, logs a reason, and the year group reverts. No bulk reversal after 7 days. |
| Graduated students | Students completing Y13 are moved to Graduated status. After 30 days in Graduated status (platform default, configurable in [[09_Settings-M20_Tenant_Settings|M20]]), the student's status automatically changes to Alumni. |
| FS1 and FS2 progression | KHDA guardian requirements apply. Admin must confirm guardian documentation is current before FS1 and FS2 students progress. |

---

# 01.8 Waitlist Management

When a session reaches capacity, additional students can join the waitlist for that session.

| **Element** | **Detail** |
|---|---|
| Joining the waitlist | Admin adds a student to the waitlist for a specific session from [[04_Academic-M05_Timetabling_Scheduling|M05]]. Student and guardian are notified that the waitlist position is confirmed. |
| Offer generation | When a space opens (cancellation or capacity increase), the system offers the slot to the first eligible student on the waitlist. |
| Offer window | Configurable in [[09_Settings-M20_Tenant_Settings|M20]]. Default: 24 hours. Minimum: 30 minutes. If the offer is not accepted within the window, it automatically moves to the next student on the waitlist. |
| Waitlist override | Admin can book a student into a session that conflicts with a pending waitlist offer. On booking, the system prompts: "This will auto-decline the pending waitlist offer for [Subject/Day/Time]. Confirm?" On confirmation, the waitlist offer is declined and the parent is notified. Teacher cannot perform this override. |
| Parent notification on decline | Parent receives notification: "Your waitlist offer for [Subject] — [Day/Time] has been declined because an alternative session was booked for [Student name]." |
| Waitlist position visibility | Admin can see the full waitlist for any session in [[04_Academic-M05_Timetabling_Scheduling|M05]], including each student's position and how long they have been waiting. |

---

# 01.9 IMI Reference Configuration

| **Setting** | **IMI Value** |
|---|---|
| Payment plan minimum invoice | AED 4,000 |
| Default 2-instalment split | 60% first, 40% balance |
| Default 3-instalment split | 50% first, 25% second, 25% third |
| Minimum first instalment floor | 1/n of total (platform rule) |
| Below 1/n minimum | Admin Head active approval required before enrolment activates |
| Enrolment fee | AED 300 lifetime. Attaches to student record on first real enrolment. |
| Trial fee — Primary | AED 250 |
| Trial fee — Secondary | AED 300 |
| Session count rounding | More than half term = full remaining. At or past halfway = half term count, rounded up. |
| Year group progression | Annual. Two-week preview before graduation date. |
| Progression reversal window | 7 days |
| Waitlist offer window | 24 hours (configurable in [[09_Settings-M20_Tenant_Settings|M20]], minimum 30 minutes) |
| Unbilled sessions tracker | Active. Admin auto-task raised on unbilled attendance confirmation. |
| Graduated to Alumni | 30 days (platform default, configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
