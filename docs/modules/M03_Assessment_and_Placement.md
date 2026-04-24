---
module: "M03"
title: "Assessment & Placement"
layer: "Student Lifecycle"
folder: "03_Student"
status: "Draft"
phase: "v1"
dependencies: [M01, M11]
tags: [enrolla, prd, student, assessment]
---

# ENROLLA
# [[03_Student-M03_Assessment_Placement|M03]] — Assessment & Placement
v1.0 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

Assessment & Placement manages the booking, delivery, and outcome recording of academic diagnostic assessments. Assessments are used to determine a student's current level and recommend the appropriate subject, year group, and session type placement. Assessments are free and conducted in-person at the tenant's premises.

| **Property** | **Value** |
|---|---|
| Module code | [[03_Student-M03_Assessment_Placement|M03]] |
| Version | v1.1 |
| Status | Current |
| Assessment cost | Free — no charge to parent or student at IMI |
| Assessment location | In-person at tenant premises (IMI: Gold & Diamond Park) |
| Primary users | Admin (booking), Teacher/Assessor (delivery and outcome) |
| Applies to | Leads and existing students requiring placement review |
| Toggleable | Yes — per tenant and per department |
| Dependencies | [[01_Foundation-PL02_RBAC|PL-02]], [[03_Student-M01_Lead_Management|M01]], [[03_Student-M02_Student_Guardian_CRM|M02]], [[04_Academic-M05_Timetabling_Scheduling|M05]], [[04_Academic-M11_Academic_Courses|M11]], [[07_Operations-M16_Task_Management|M16]], [[09_Settings-M20_Tenant_Settings|M20]] |
| Phase | v1 |

---

# 01.1 Assessment Toggle

The assessment toggle controls whether a diagnostic assessment is required, optional, or disabled for a given department. The toggle is configured per department in [[09_Settings-M20_Tenant_Settings|M20]] by Super Admin or Admin Head.

| **Mode** | **Behaviour** |
|---|---|
| Required | Lead cannot progress past the Contacted pipeline stage without an assessment being booked and completed. The system enforces this — Admin cannot skip without changing the toggle mode. Used for subjects or departments where placement testing is critical. |
| Preferred | Assessment is the default recommended path. Admin can skip for a specific lead with a logged reason. The Assessment Booked and Assessment Done pipeline stages are shown but skippable. IMI default for all departments. |
| Off | Assessment step is hidden entirely. Assessment Booked and Assessment Done pipeline stages are not shown. Leads flow directly from Contacted to Schedule Offered. The assessment booking system remains accessible for tenants that use assessments selectively outside the pipeline. |

The assessment toggle is configurable per department (Primary, Lower Secondary, Senior) and can also be set per year group if finer control is needed. The toggle can be time-bound — a date range can be set during which the mode applies, after which it reverts to the configured default. Changing the toggle mode does not affect leads already in progress.

---

# 01.2 Assessment Booking

> **Assessments are always free and are never invoiced.** Assessment sessions do not generate an invoice and do not trigger the AED 300 enrolment fee. One assessment is permitted per subject per student.

Assessments can be booked in two ways: Admin-scheduled on behalf of the parent, or via a self-service booking link sent to the parent. Both methods use the same smart slot ranking logic.

## 01.2.1 Smart Slot Ranking

When booking an assessment, available slots are ranked and presented in priority order. Assessment slots are the lead's first contact with the institution — there is no prior teacher relationship — so ranking is based on teacher qualification, capacity, timing preference, and availability.

| **Rank** | **Criterion** | **Detail** |
|---|---|---|
| 1 | Teacher qualified for the subject(s) | Only slots where the assigned teacher is qualified to assess the lead's subject interests are shown. Multi-subject assessments require a teacher qualified across all requested subjects, or the assessment is split across teachers within the same session window. |
| 2 | Slot not at capacity | Assessment slots with remaining capacity are ranked above full slots. |
| 3 | Matches parent preferred timings | If preferred session times are captured on the lead profile, slots matching those times are ranked higher. |
| 4 | Earliest available | Fallback criterion. If no other differentiator applies, earlier slots are ranked above later ones. |
| Holiday fallback | No slots before term start | If no slots are available before the next term begins, the system automatically suggests slots during the upcoming holiday period. Admin is notified of the fallback. |

The same-assessor criterion does not apply at assessment stage — the lead has not yet met any teacher. Continuity with a known teacher is applied at the regular session scheduling stage in [[03_Student-M04_Enrolment_Lifecycle|M04]].

## 01.2.2 Assessment Structure

An assessment is a single time-blocked session in which the lead sits multiple subject assessments back-to-back. The session is not broken into separate per-subject bookings — one slot is booked and the time within it is divided across subjects by the assessor.

The standard assessment window is up to 2 hours in a single sitting, covering all subjects the lead expressed interest in on the enquiry form. The assessor manages the time allocation within the session. If additional subjects need to be covered, Admin can add them to the same session or book a follow-up slot. The assigned teacher is automatically enrolled in the assessment session. Online assessments are technically supported but not preferred at IMI — in-person is the default.

## 01.2.3 Admin-Scheduled Booking

Admin books the assessment slot on behalf of the parent directly from the lead record in [[03_Student-M01_Lead_Management|M01]] or from the assessment module. Admin sees the ranked slot list filtered by the lead's year group and subject interests. On confirmation, the parent receives a WhatsApp confirmation immediately. The assessment appears on the assigned teacher's calendar ([[04_Academic-M05_Timetabling_Scheduling|M05]]). The lead pipeline stage auto-advances to Assessment Booked on confirmation.

## 01.2.4 Self-Service Booking Link

Admin can generate a self-service booking link for a specific lead and send it via WhatsApp or email. The parent selects their own slot directly without Admin involvement.

| **Feature** | **Detail** |
|---|---|
| Slot display | Parent sees available slots filtered by their child's year group and subject interest. Slots are ranked using the same smart ranking logic as admin-scheduled bookings. |
| Real-time slot removal | When a parent selects a slot, it is immediately removed from availability for all other parents. No double-bookings are possible. |
| Link expiry | Booking links expire after a configurable period. Default: 14 days. Tenant-configurable in [[09_Settings-M20_Tenant_Settings|M20]]. |
| Link re-issue | Admin can re-issue a booking link at any time — whether the existing link is expired or still active. Re-issuing generates a new token and immediately invalidates any previously issued link for the same lead, whether expired or not. The old link cannot be used after re-issue. On expiry of an unused link with no re-issue, an in-app alert is sent to the Admin who sent the link. No automatic parent notification on expiry — Admin decides whether to follow up. |
| Link security — unique token | One link per lead. Secure, single-use link accessible only by the intended parent. |
| Link security — public page | A general booking page shareable broadly (e.g. on the tenant's website). Not tied to a specific lead. Creates a new lead record on first-time bookings. The public assessment booking page uses the same Lead Enquiry Form as the main website enquiry form. A guardian completing an assessment booking via the public page creates a Lead record in [[03_Student-M01_Lead_Management|M01]] with pipeline stage set to Assessment Booked. The form is pre-populated with any details already on file if the guardian's email is recognised. |
| On booking | Parent receives immediate WhatsApp or email confirmation. Admin receives an in-app notification. Lead pipeline advances to Assessment Booked automatically. |
| No availability | If no slots are available, the parent is shown a message and can submit a preferred time request. Admin is notified to schedule a slot manually. |
| Link expired — no booking | When the booking link expires with no booking made and all reminder sequences are exhausted, the link status changes to Expired. Admin receives an in-app alert: "Assessment booking link expired — [Lead name] — no booking made." A new booking link can be generated manually from the lead record by Admin. No new link is auto-generated. The lead stage remains Assessment Booked — Admin must manually move it if appropriate. |

The self-service booking link is included in the auto-response sent on lead creation where configured. Automated reminders are sent if the booking link is not used within the configured period (default: Reminder 1 at 48 hours, Reminder 2 at 5 days). Admin can revoke a booking link at any time from the lead record.

## 01.2.5 Reassessment for Enrolled Students

When Admin requests a placement reassessment for an existing enrolled student, the assessment is booked directly from the student profile in [[03_Student-M17_Student_Profile|M17]] using the same booking interface as lead assessments.

| **Element** | **Detail** |
|---|---|
| Access point | Student profile ([[03_Student-M17_Student_Profile|M17]]) → Quick Actions → Book Assessment |
| Slot ranking | Same smart slot ranking logic as lead assessments (01.2.1) |
| New lead record | Not created. The reassessment is logged directly on the student's assessment history in [[03_Student-M02_Student_Guardian_CRM|M02]]. |
| Outcome | Recorded on the student's assessment history tab in [[03_Student-M17_Student_Profile|M17]]. Visible to Admin and above. |
| Pipeline stage | No pipeline stage change. The student record is not moved — only the assessment history is updated. |
| Trigger | Admin-initiated only. No automation triggers a reassessment automatically. |

## 01.2.6 Assessment Start Time Offset

To avoid assessment arrivals clashing with the start of regular classes, assessment slots are offset from the top of the hour. The offset is configured per tenant in [[09_Settings-M20_Tenant_Settings|M20]].

| **Property** | **Value** |
|---|---|
| IMI default | Assessments start at 15, 30, or 45 minutes past the hour — never on the hour |
| Purpose | Separates parents arriving for assessments from students arriving for regular classes, reducing front-desk congestion |
| Booking display | Both admin-scheduled and self-service views only show slots at the configured offsets |
| Override | Admin can override the offset for a specific booking with a logged reason |

## 01.2.7 Adding a Lead to the Calendar

As part of the assessment booking process, the lead is added to the timetable calendar ([[04_Academic-M05_Timetabling_Scheduling|M05]]) as a participant in the assessment session. This applies to trial class bookings as well.

The lead appears in the session's Trials tab on the session detail view — not in the Enrolments tab, which is reserved for enrolled students. The lead's pipeline stage and conversion status are visible to Admin from the session register. Attendance for the lead's assessment session is marked by the assessor in the same way as a regular session. On conversion to a student, all prior assessment session attendance is carried forward to the cumulative record.

---

# 01.3 Assessment Form

The assessor completes a structured assessment form during or immediately after the assessment session. All fields are captured against the lead or student record. The form cannot be edited after it is marked as complete.

| **Field** | **Detail** |
|---|---|
| Recommendation | Required. Dropdown. Options: Enrol — same level / Enrol — higher level / Enrol — lower level / Do not enrol / Further assessment needed. |
| Observed Level | Text field. The assessor's judgement of the student's current level. |
| Target Grade | Text field. Recommended target for this subject. |
| Notes | Rich text. Additional context for Admin and HOD. |

Multiple assessment forms can exist for the same lead if multiple subjects are assessed. The form is submitted by the assessor from their session view in [[04_Academic-M05_Timetabling_Scheduling|M05]] or from the lead record in [[03_Student-M01_Lead_Management|M01]].

## 01.3.1 Assessment Feedback Templates

Assessment feedback templates define the structure of the assessment form for each subject. Templates are inherited from the department level and can be overridden at the subject level.

| **Level** | **Description** |
|---|---|
| Department template | Each department (Primary, Lower Secondary, Senior) has one base feedback template applying to all subjects within that department by default. Configured by Academic Head or Super Admin. |
| Subject template | Each subject can override the department template with its own version. The subject template starts as a copy of the department template and can be modified freely. Changes to the department template do not overwrite a subject that has already customised its own template. Configured by HOD or Head of Subject. |

A subject that has not customised its template inherits the current department template automatically. If the department template is updated, subjects using the inherited version are updated automatically. Subjects with custom templates are not affected.

Templates define the configurable selector fields on the assessment form. The free-text fields (Strengths, Areas requiring support, Recommended next steps, Assessor notes) are always present and cannot be removed. When the AI summary option is enabled, Claude drafts a parent-facing assessment summary from the completed form — assessor reviews and approves before sharing.

## 01.3.2 Expected Age Ranges by Year Group

The following ranges are used to flag age/year group mismatches on student and lead profiles ([[03_Student-M02_Student_Guardian_CRM|M02]]). Students outside the expected range by more than 1 year receive a data quality flag. Admin can dismiss the flag with a mandatory reason that is logged permanently.

| **Enrolla Name** | **Also Known As** | **Age Range** | **US Grade** |
|---|---|---|---|
| FS1 | Nursery | 3–4 | Preschool |
| FS2 | Reception / KG1 | 4–5 | Preschool |
| Year 1 | Kindergarten 2 | 5–6 | Kindergarten |
| Year 2 | Grade 1 | 6–7 | Grade 1 |
| Year 3 | Grade 2 | 7–8 | Grade 2 |
| Year 4 | Grade 3 | 8–9 | Grade 3 |
| Year 5 | Grade 4 | 9–10 | Grade 4 |
| Year 6 | Grade 5 | 10–11 | Grade 5 |
| Year 7 | Grade 6 | 11–12 | Grade 6 |
| Year 8 | Grade 7 | 12–13 | Grade 7 |
| Year 9 | Grade 8 | 13–14 | Grade 8 |
| Year 10 | Grade 9 | 14–15 | Grade 9 |
| Year 11 | Grade 10 | 15–16 | Grade 10 |
| Year 12 | Grade 11 | 16–17 | Grade 11 |
| Year 13 | Grade 12 | 17–18 | Grade 12 |

Skipped or repeated years are the most common legitimate reason for a mismatch. The dismissal reason field is designed to capture this context clearly for future staff.

---

# 01.4 Assessment Outcome

On completion of the assessment form, the outcome record is stored against the lead and, on conversion, carried forward to the student's cumulative academic record.

## 01.4.1 Outcome Record Contents

| **Field** | **Value** |
|---|---|
| Date and time of assessment | Auto-captured from the session record |
| Assessor name | The staff member who submitted the form |
| Subject assessed | From the assessment form |
| Observed Level | From the assessment form |
| Recommendation | From the assessment form (Enrol — same level / Enrol — higher level / Enrol — lower level / Do not enrol / Further assessment needed) |
| Target Grade | Target set by assessor. Carries to [[04_Academic-M11_Academic_Courses|M11]] on enrolment. |
| Shared with parent | Yes / No flag. Set by Admin when the outcome is shared. Timestamped. |
| Pipeline stage | Lead pipeline auto-advances to Assessment Done on form completion. |

## 01.4.2 Sharing the Outcome with the Parent

The assessment outcome is not automatically sent to the parent. Admin reviews the outcome and decides whether and how to share it. Admin can generate a formatted PDF summary report from the outcome record and send it to the parent via WhatsApp or email directly from the platform.

The PDF report includes: assessment date, subject, current level summary, recommended placement, target grade, and recommended next steps. Assessor notes (internal) are excluded from the PDF. Sent reports are logged in the student or lead communication log. The Shared with Parent flag is set and timestamped on send.

## 01.4.3 Outcome Carries Forward on Conversion

On lead-to-student conversion ([[03_Student-M01_Lead_Management|M01]]), the assessment outcome is automatically transferred to the student's cumulative academic record. The recommended placement pre-populates the enrolment form in [[03_Student-M04_Enrolment_Lifecycle|M04]]. The target grade carries forward to the student's grade record in [[04_Academic-M11_Academic_Courses|M11]]. Recommended next steps are flagged to the assigned teacher via their task inbox ([[07_Operations-M16_Task_Management|M16]]).

---

# 01.5 Placement Recommendations

The placement recommendation from the assessment informs but does not lock the enrolment decision. Admin and Academic Head can override the recommended placement with a logged reason.

If the recommended year group differs from the lead's registered year group, Admin is prompted at enrolment to confirm which year group to use and a flag is raised on the student profile noting the discrepancy. If the recommended session type is Individual but the parent requests a group session (or vice versa), Admin can proceed with the parent's preference — the recommendation remains on record. Placement overrides are logged permanently with the overriding Admin's name, new placement, and reason.

When a recommended year group is dismissed and the student's age does not match the expected range for their actual year group, the system displays an additional confirmation requiring the Admin to state the reason. The confirmed reason is stored alongside the age/year group mismatch flag on the student profile.

---

# 01.6 Assessment Reporting

Assessment data feeds into [[08_Management-M10_Management_Dashboard|M10]] (Management Dashboard) and is available as a filtered report.

| **Metric** | **Description** |
|---|---|
| Assessments per period | Count of assessments completed in a date range. Filterable by department, subject, year group, and assessor. |
| Assessment conversion rate | Percentage of completed assessments that resulted in enrolment. Tracked overall and per subject. |
| Time to enrolment from assessment | Average number of days from Assessment Done to first payment confirmed. |
| Booking link usage | Self-service booking link: sent vs booked vs expired. Tracks self-service uptake per period. |
| Outcomes by subject and year group | Breakdown of recommended placements, level distributions, and target grades by subject and year group. |
| Placement overrides | Count and detail of assessment recommendations overridden by Admin or Academic Head. |
| Assessor performance | Conversion rate per assessor — percentage of their assessed leads that converted to enrolled students. |

---

# 01.7 Role-Based Access

| **Role** | **Access Level** |
|---|---|
| Org Owner, Super Admin | Full access — all assessments, all settings, toggle configuration |
| Admin Head | Full access — book, view, and manage all assessments. Generate and send outcome reports. |
| Admin | Full access — book assessments, view outcomes, send outcome reports |
| Academic Head | Full access — view all outcomes, override placements, review all assessment reporting |
| HOD | Scoped to their department — view assessment outcomes for their subjects. Cannot override placements without Academic Head approval. |
| Head of Subject | Scoped to their subject — view assessment outcomes for their subject |
| Teacher / Assessor | Can submit assessment forms for sessions they are assigned to. View their own assessment records only. |
| TA | No assessment access |
| HR/Finance | No assessment access — `assessments.view` is not granted to this role. |

---

# 01.8 IMI Reference Configuration

| **Setting** | **IMI Value** |
|---|---|
| Assessment cost | Free — no charge to parent |
| Assessment location | In-person at Gold & Diamond Park, Dubai |
| Assessment toggle — Primary | Preferred — assessment is recommended but Admin can skip with logged reason |
| Assessment toggle — Lower Secondary | Preferred |
| Assessment toggle — Senior | Preferred |
| Self-service booking link | On — available for all departments |
| Booking link expiry | 14 days (tenant-configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Booking link type | Unique token per lead (default). Public page available when configured. |
| Assessment start time offset | 15 min, 30 min, and 45 min past the hour. On-the-hour slots not offered. |
| Assessment structure | One session covers all subjects. Standard window: up to 2 hours. |
| Feedback template | Department-level base template per department. Subject-level override available. |
| Google Calendar invite | Available — parent can receive a Google Calendar invite on assessment booking via email or BSP link |
| Online assessments | Supported but not preferred. In-person at GDP is default. |
| Holiday fallback | On — system suggests holiday slots if no pre-term slots available |
| Assessment reminder sequence | Reminder 1 at 48 hours, Reminder 2 at 5 days (from [[03_Student-M01_Lead_Management|M01]] settings) |
