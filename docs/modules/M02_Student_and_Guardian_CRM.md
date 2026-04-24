---
module: "M02"
title: "Student & Guardian CRM"
layer: "Student Lifecycle"
folder: "03_Student"
status: "Draft"
phase: "v1"
dependencies: [M01, M04]
tags: [enrolla, prd, student, crm]
---

# ENROLLA
# [[03_Student-M02_Student_Guardian_CRM|M02]] — Student & Guardian CRM
v1.0 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

Student & Guardian CRM is the master data store for all student and guardian records. Every other module references [[03_Student-M02_Student_Guardian_CRM|M02]] for student identity, academic placement, and family relationships. The cumulative record here persists for the lifetime of the student's relationship with the tenant — it is never deleted.

| **Property** | **Value** |
|---|---|
| Module code | [[03_Student-M02_Student_Guardian_CRM|M02]] |
| Version | v1.1 |
| Status | Current |
| Primary users | Admin, Admin Head, Academic Head |
| Secondary users | HOD (scoped to subject), Teacher (own students), Parent (own children — Phase 2) |
| Key rule | Cumulative records are never deleted. Withdrawn and graduated student records are retained permanently. |
| Toggleable | No — Student CRM is always active |
| Dependencies | [[01_Foundation-PL01_Platform_Architecture|PL-01]], [[01_Foundation-PL02_RBAC|PL-02]], [[03_Student-M01_Lead_Management|M01]], [[06_Finance-M08_Finance_Billing|M08]], [[03_Student-M17_Student_Profile|M17]], [[03_Student-M18_Guardian_Profile|M18]], [[09_Settings-M20_Tenant_Settings|M20]] |
| Phase | v1 |

---

# 01.1 Student Profile — Field Specification

The student profile is the central record created when a lead converts to an enrolled student. Fields pre-populate from the lead record. Admin completes missing mandatory fields before confirming.

## 01.1.1 Identity Fields

| **Field** | **Specification** |
|---|---|
| Full legal name | Mandatory. First name + last name. Used on all official documents and invoices. |
| Preferred name | Optional. Used in day-to-day communications if different from legal name. |
| Date of birth | Mandatory. Used to auto-calculate age displayed on registers and profile. Used to verify year group placement. |
| Gender | Mandatory. Options: Male, Female, Prefer not to say. |
| Nationality | Mandatory. Full country dropdown. |
| Photo | Optional. Used on student profile, timetable session cards, and printed attendance register. |
| Student ID | OrgPrefix-#### — A unique platform-wide sequential identifier. The Student ID never includes a branch code, regardless of how many branches the tenant operates. Example: IMI-0001. Assigned automatically at profile creation. Immutable. |

## 01.1.2 Academic Placement Fields

| **Field** | **Specification** |
|---|---|
| Year group | Mandatory. Options: FS1/Nursery through Year 13/Grade 12 + Graduated. Auto-progresses annually on the configured graduation date. Admin and above can override with a logged reason. |
| Department | Auto-assigned from year group on record creation and on annual progression. FS1–Y6 = Primary. Y7–Y9 = Lower Secondary. Y10–Y13 = Senior. Graduated/Alumni = null. Admin and above can override with a logged reason. Mapping is tenant-configurable in [[09_Settings-M20_Tenant_Settings|M20]]. |
| School name | Mandatory. Selected from the organisation-level school directory. Enables exam event cross-notifications ([[04_Academic-M11_Academic_Courses|M11]]). The School field has an 'Add Other' option that allows Admin to type a school name not in the directory. The typed name is stored as free text and is also submitted to the platform as a suggestion for adding to the school directory. |
| Curriculum | Auto-populates from the school directory where known. Manual entry required for schools not in the directory. |
| Exam board / qualification | Required for Year 10 and above. Dropdown per subject. Drives subject-level reporting and progress tracking. |
| Target grades | Per subject. Set by Academic Head or Super Admin. Visible on the Grades tab of the student profile ([[03_Student-M17_Student_Profile|M17]]). |
| Assessment history | System-managed. Linked automatically from [[03_Student-M03_Assessment_Placement|M03]]. Read-only on student profile. |
| KHDA flag (FS1/FS2) | Auto-set for students in FS1 or FS2 at IMI. Flags that a guardian must be present for all sessions. Visible on student profile and session register. Cannot be disabled for these year groups at IMI. |

## 01.1.3 Guardian and Family Fields

| **Field** | **Specification** |
|---|---|
| Primary guardian name | Mandatory. First and last name. |
| Primary guardian phone | Mandatory. UAE number format. Format validated. WhatsApp availability check via BSP API is Phase 2. In v1, Admin manually confirms whether the phone number is a WhatsApp number using the 'Is this a WhatsApp number?' toggle on the guardian profile. |
| Is this a WhatsApp number? | Mandatory. If No, a separate WhatsApp number field appears with an inline warning: 'Without a WhatsApp number, communications will be sent via email only which may result in delayed responses.' Not a blocker — preferred channel auto-sets to Email. |
| Primary guardian email | Mandatory. Email validation on entry. Required for invoice delivery and fallback communications. |
| Guardian nationality | Mandatory. Full country dropdown. |
| Home area / district | Recommended. Pre-defined Dubai district dropdown. Enables geographic reporting and Mailchimp segmentation. |
| Secondary phone | Optional. Format validated if filled. |
| Co-parent / second guardian | Optional section. 'Add second guardian?' toggle. If Yes: name (mandatory), relationship (recommended), phone and WhatsApp (mandatory), email (recommended). If the second guardian already exists in the system, the link is bidirectional and requires confirmation from both profiles. Cross-suggestion: when adding a co-parent, a tick box asks 'Also set as emergency contact?' If the emergency contact is filled first, a tick box asks 'Is this person also a co-parent?' **v1 Note:** In v1, co-parent link confirmation is performed by Admin on behalf of both parties. There is no parent-facing confirmation flow until Phase 2. Admin logs a mandatory note confirming that both parties verbally or physically confirmed the link — for example: 'Both guardians confirmed in person at front desk on [date].' The confirmation is logged permanently on the co-parent link record with Admin name, timestamp, and the note text. Status moves to Confirmed on Admin's action. |

## 01.1.4 Emergency Contact Fields

| **Field** | **Specification** |
|---|---|
| Emergency contact name | Mandatory. If co-parent is already filled, system displays 'Use co-parent details?' pre-fill option. If no co-parent yet, tick box 'Is this person also a co-parent?' appears after emergency contact details are entered. |
| Relationship to student | Mandatory. Free text. |
| Emergency contact phone | Mandatory. Format validated. |

## 01.1.5 Medical and Welfare Fields

| **Field** | **Specification** |
|---|---|
| General medical conditions | Optional. Yes/No toggle. If Yes, a structured 15-option dropdown appears (conditions, chronic illnesses, mobility, sensory, mental health categories). Visible to all staff with student profile access. |
| Food allergies | Separate Yes/No toggle. If Yes, a structured food allergy dropdown appears: Nuts (peanuts, tree nuts), Dairy, Eggs, Gluten/Wheat, Shellfish, Fish, Soy, Sesame, Other (free text). Multiple selections permitted. Stored and displayed independently from general medical conditions. |
| Learning difficulties / SEN | Separate Yes/No toggle. If Yes, free-text field for detail. |
| Media opt-out level | Dropdown with three levels. Level 1: No social media posts featuring the student. Level 2: Class/work photos permitted but student's face must not be identifiable. Level 3: Complete exclusion — no photography of the student in any context. Active level is flagged on the student profile and surfaces on the session register on any day where a media or photography activity is planned. |

## 01.1.6 Financial Fields (System-Managed)

These fields are populated and updated automatically by [[06_Finance-M08_Finance_Billing|M08]]. They are read-only on the student profile. Admin accesses full financial detail from the Invoices tab ([[03_Student-M17_Student_Profile|M17]]) or directly in [[06_Finance-M08_Finance_Billing|M08]]. The fields are: total invoiced (current term), total paid (current term), outstanding balance, credit on account, and payment plan status (number of instalments, amounts, due dates).

## 01.1.7 Legal and Consent Fields

T&C acceptance is mandatory before enrolment is confirmed. Version number, acceptance date and time, and method (form submission or manual Admin confirmation) are stored permanently and cannot be deleted or modified. Data privacy consent is captured alongside T&C and stored permanently. DPN (Data Processing Notice) history is visible on the guardian profile ([[03_Student-M18_Guardian_Profile|M18]]) as a permanent record of every consent event.

---

# 01.2 Student Lifecycle Statuses

The following statuses apply to student records only. Lead statuses (Won, Lost, Archived) are defined in [[03_Student-M01_Lead_Management|M01]].

| **Status** | **Description** |
|---|---|
| Active | Currently enrolled in at least one course for the current term. Default status on conversion from lead. |
| Withdrawn | Student has left the institution. Reason recorded. Record retained permanently with full cumulative history. |
| Graduated | The student has completed their final year. Status automatically transitions to Alumni after 30 days (platform default, configurable in [[09_Settings-M20_Tenant_Settings|M20]] by Super Admin). |
| Alumni | Auto-transitions from Graduated after the configured period. Retained permanently for records, referral tracking, and re-engagement. Department field is null. |

**Student Categories:**

In addition to lifecycle statuses, students are assigned a category that determines their placement and pricing model.

| **Category** | **Description** |
|---|---|
| Standard | Default category for all students assigned to a year group (FS1–Y13). Subject to year group progression rules. |
| Senior | A permanent student category for adult learners and external professionals. Senior students are not assigned a school year group (FS1–Y13). They are assigned to the Senior department. Per-session rate uses the Senior rate card entry. Senior students can enrol in any subject offered by the Senior department. |

Status changes are logged on the cumulative record with timestamp and changed by. Withdrawn and Graduated records retain full cumulative history and are never deleted. A Withdrawn student can be re-enrolled — on re-enrolment, their original Student ID is reinstated and their cumulative record continues from where it left off.

## 01.2.1 Student Lifecycle Actions

The following actions are available on student records depending on the student's current status.

| **Action** | **Description** |
|---|---|
| Withdraw | Full termination of a student's enrolment. See [[03_Student-M04_Enrolment_Lifecycle|M04]] §01.5 for the full withdrawal flow. |
| Extend Validity | Available when a student's enrolment is approaching expiry at term end without a confirmed re-enrolment. Admin uses this action to extend the current term's sessions into the next term window. Extend Validity does not change the student's status — the student remains Active. A reason must be logged. Admin Head is notified when Extend Validity is applied. |

---

# 01.3 Department Auto-Assignment

Students are automatically assigned to a department based on their year group at two points: on student record creation, and on annual year group progression at the graduation date.

| **Year Group(s)** | **Auto-Assigned Department** | **Notes** |
|---|---|---|
| FS1/Nursery, FS2/KG1, Y1/KG2, Y2/G1, Y3/G2, Y4/G3, Y5/G4, Y6/G5 | Primary | |
| Y7/G6, Y8/G7, Y9/G8 | Lower Secondary | |
| Y10/G9, Y11/G10, Y12/G11, Y13/G12 | Senior | |
| Graduated, Alumni | No department — field is null | |
| Senior (student category) | Senior | Assigned to Senior department. No year group position. |

Admin and above can manually override a student's department at any time. Override is logged with a reason. The year group to department mapping is tenant-configurable in [[09_Settings-M20_Tenant_Settings|M20]].

---

# 01.4 Cumulative Record

The cumulative record is a persistent, append-only profile that aggregates data from every module throughout the student's relationship with the tenant. It never resets — it accumulates across all terms, status changes, and subject changes.

| **Data Source** | **What Is Captured** |
|---|---|
| [[03_Student-M01_Lead_Management|M01]] Lead Management | Full lead activity log, source channel, pipeline stage history, referral source |
| [[03_Student-M03_Assessment_Placement|M03]] Assessment | Assessment date, assessor, subject, observed level, recommended placement, shared status |
| [[03_Student-M04_Enrolment_Lifecycle|M04]] Enrolment | Enrolment history by term and subject, slot hold history, trial class outcome, withdrawal records |
| [[04_Academic-M05_Timetabling_Scheduling|M05]] Timetabling | Session history — all sessions the student was enrolled in, with teacher and room |
| [[04_Academic-M06_Attendance_Makeups|M06]] Attendance | Full attendance record per session. Absence types, makeup usage, no-show log. |
| [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] Concern Engine | All concern flags raised, escalation levels reached, resolution outcomes, parent notification events |
| [[04_Academic-M07_Feedback_Communications|M07]] Feedback | Per-class feedback entries, AI summaries, progress reports sent to parent |
| [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].A]] Complaints | All complaint tickets linked to this student |
| [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].B]] Surveys | All satisfaction survey responses submitted by the parent |
| [[06_Finance-M08_Finance_Billing|M08]] Finance | Invoice history, payment records, credit balances, instalment plans, discounts applied |
| [[04_Academic-M11_Academic_Courses|M11]] Academic | Target grades per subject, exam events linked to this student's year group and school |
| [[04_Academic-M14_Assignment_Library|M14]] Assignments | Assignment submissions, grades, AI evaluation results |
| [[04_Academic-M19_Progress_Tracking|M19]] Progress | Progress tracker records per course per term. Progress reports generated and sent. |
| Communication Log | All outbound and inbound messages: WhatsApp, email, in-app, phone call notes (manual) |

The cumulative record is never deleted, even if the student withdraws, graduates, or transitions to Alumni. On re-enrolment after withdrawal, the existing cumulative record continues — no new record is created. Access to cumulative record data is governed by the RBAC permissions of the source module.

---

# 01.5 Guardian Records

Guardian records are independent from student records. A guardian is linked to one or more students. Guardian records persist even if all linked students are withdrawn, graduated, or alumni. The full guardian profile is managed in [[03_Student-M18_Guardian_Profile|M18]] (Guardian Profile).

## 01.5.1 WhatsApp Number Validation

When a guardian provides a phone number, the system validates it against the WhatsApp BSP API to confirm whether that number is WhatsApp-enabled.

| **Outcome** | **Behaviour** |
|---|---|
| Validation succeeds | Number is marked as WhatsApp-verified. Preferred channel auto-sets to WhatsApp. |
| Validation unavailable or fails | Number is stored and flagged as WhatsApp-unverified. A warning badge appears on the guardian profile until validation is confirmed. |
| Guardian marks No to WhatsApp | Preferred channel auto-sets to Email. A 'No WhatsApp' indicator appears on the profile. If a subsequent BSP delivery fails, the system auto-flags and switches to Email delivery. |

## 01.5.2 Billing Guardian

The billing guardian is the guardian to whom invoices are addressed. Defaults to the primary guardian on student creation. Admin can change the billing guardian at any time. The billing guardian does not need to be the same as the primary communication guardian.

## 01.5.3 WhatsApp Broadcast List Membership

A dedicated broadcast list section on the guardian profile shows which WhatsApp broadcast lists the guardian is currently a member of. Lists are managed externally via the BSP, but Enrolla displays membership status pulled from [[07_Operations-M13_Automation_Communications|M13]].

DNC flag and Unsubscribe status are shown inline alongside each list membership entry. Guardians with an active DNC flag are excluded from all broadcast lists automatically. The exclusion is visible on the profile. Broadcast list management (adding/removing members) is performed in [[07_Operations-M13_Automation_Communications|M13]] — the profile view is read-only.

## 01.5.4 Guardian Independence

One guardian can be linked to multiple students. Guardian records are not deleted when a student withdraws or graduates. If all students linked to a guardian are withdrawn or alumni, the guardian record transitions to an inactive state but remains fully accessible to Admin.

---

# 01.6 Periodic Profile Verification

Parents are prompted once per academic year to confirm or update their contact details. This ensures communication data remains accurate.

| **Property** | **Value** |
|---|---|
| Trigger | First session booked in a new academic year for any of the guardian's linked students. Also triggered on re-engagement after a period of inactivity spanning the previous academic year or longer. |
| Verification flow | Guardian receives a prompt via their preferred channel asking them to confirm or update: full name, phone number, WhatsApp number, email address, emergency contact details. |
| Logging | Verification is timestamped and logged on the guardian profile |
| Manual trigger | Admin can manually trigger a verification prompt at any time from the guardian profile |
| Blocking | Profile verification does not block any platform function. It is a data quality prompt, not a gate. |

---

# 01.7 Sibling Detection and Family Linking

Sibling detection runs automatically when a student record is created or when a lead is submitted. Confirmed sibling links are used for discount eligibility, consolidated family communications, and family-level reporting.

## 01.7.1 Detection Methods

| **Detection Method** | **How It Works** |
|---|---|
| Shared guardian phone | Same phone number on a new lead or student matches an existing guardian record. Sibling flag raised automatically. |
| Shared guardian email | Same email on a new lead or student matches an existing guardian record. Sibling flag raised automatically. |
| Enquiry form self-identification | Parent answers 'Do you have other children enrolled with us?' — Yes. System matches provided sibling name and DOB against enrolled students. |
| Confirmed co-parents | All children under two confirmed co-parents are automatically flagged as siblings. |
| Manual linking | Admin can manually link any two students as siblings at any time. |

## 01.7.2 Sibling Group Display

A sibling group banner is displayed on each linked student profile showing all sibling names, year groups, and current lifecycle statuses. Admin can navigate between sibling profiles directly from the banner. Admin can confirm or dismiss auto-detected sibling links — dismissed links are logged. Confirmed sibling links are visible on lead cards, student profiles, and the guardian profile.

## 01.7.3 Co-Parent Linking

Each guardian has an optional co-parent field linking to another guardian record. In v1 (no parent portal), Admin confirms the co-parent link manually on behalf of both parties. Automated dual-party confirmation is deferred to Phase 2 (parent portal).

**v1 Co-Parent Confirmation Flow:**
Admin initiates the co-parent link from either guardian's profile. Admin confirms on behalf of both parties — this requires that both parties have verbally or physically confirmed the link to the centre. The confirmation is logged with: Admin name, timestamp, and a note confirming that both parties confirmed. The link status changes from Pending to Confirmed on Admin's manual confirmation.

All children under confirmed co-parents are automatically flagged as siblings. Phase 2 will introduce automated dual-party confirmation via the parent portal.

**Co-Parent Link Revocation**

| **Element** | **Detail** |
|---|---|
| Who can revoke | Admin or above. Either linked guardian can request revocation verbally or in writing — Admin logs and executes it on their behalf. |
| Reason required | Yes — mandatory logged reason. |
| Notification | Both linked guardians receive an in-app and WhatsApp notification: "The co-parent link between [Guardian A] and [Guardian B] for [Student name] has been removed." |
| Pending items | Any in-flight approval requests or tasks that were routed to the co-parent revert to the primary guardian immediately on revocation. Revocation is logged on both guardian profiles and on the student's cumulative record. |
| Re-linking | A new co-parent link can be initiated at any time following the standard confirmation flow. |

---

# 01.8 Communication Log

All outbound and inbound communications for a student are logged chronologically on their profile as part of the cumulative record.

| **Log Entry Type** | **What Is Captured** |
|---|---|
| WhatsApp messages | Auto-logged via BSP. Direction (sent/received), content summary, delivery status, timestamp. |
| Instagram DMs | Auto-logged via Graph API. Direction, content summary, timestamp. |
| Emails | Auto-logged on send. Subject, delivery status, timestamp. |
| Phone call notes | Manual entry by Admin. Call summary, timestamp, logged by. |
| Meeting — in-person | Manual entry. Fields: date, duration, attendees (from staff list), summary notes, outcome. |
| Meeting — online | Manual entry. Same fields as in-person plus optional meeting link. |
| System notifications | Auto-logged when a system notification is sent to the guardian. Notification type, channel, timestamp. |
| Survey invitations and responses | Auto-logged. Trigger point, channel, timestamp, rating (if response received). |
| Stage messages (lead period) | Auto-logged when Admin sends a stage template message during the lead pipeline. |

## 01.8.1 Editing and Archiving Rules

System-generated entries (WhatsApp, email, Instagram DMs, notifications, survey logs) cannot be edited or deleted by anyone. Manual entries (phone call notes, meeting notes) can be edited by the staff member who created them within 24 hours of creation. After 24 hours, editing a manual entry requires Admin Head approval. Archiving (soft-hiding) a log entry requires Admin Head approval at any time — archived entries remain on the record and are visible to Admin Head and above. All edit and archive actions are logged permanently.

---

# 01.9 Duplicate Detection and Merge

On student or guardian record creation, the system runs a weighted similarity score across four fields to detect potential duplicates.

## 01.9.1 Weighted Scoring Model

| **Field** | **Weight** | **Matching Method** |
|---|---|---|
| Phone number | 40% | Exact match plus transposition tolerance — detects digit swaps |
| Email address | 30% | Exact match plus fuzzy matching — detects common typos such as .con vs .com |
| Student name | 20% | Fuzzy matching using Levenshtein distance — catches spelling variations and name order differences |
| Date of birth | 10% | Exact match only |

## 01.9.2 Threshold Behaviour

| **Score** | **Action** |
|---|---|
| 70% or above | Duplicate warning surfaces. Admin must action the warning before proceeding — confirm as duplicate and merge, confirm as separate record with logged reason, or defer for later review. |
| 50–69% | Soft suggestion shown: 'Possible match found.' Admin can review or dismiss without being blocked. |
| Below 50% | No flag raised. Record is created normally. |

Threshold percentages are configurable per tenant by Super Admin in [[09_Settings-M20_Tenant_Settings|M20]].

## 01.9.3 Merge Rules

Merging combines all linked data — sessions, invoices, attendance records, concerns, communication logs, file attachments — into the primary record. The secondary record is archived and linked to the primary — it is never deleted. Merge actions are logged permanently and cannot be reversed without Admin Head approval.

**Financial Record Conflict — Mandatory Review Step:**
If either record being merged has financial records (invoices, payments, or credits), the merge flow inserts a mandatory financial review step before the CONFIRM MERGE prompt. Admin reviews both records' financial histories side by side. The primary record (selected by Admin in Step 2) retains all financial records. The secondary record's financial records are re-linked to the primary record's student ID. Credit balances from both records are summed. Invoice numbers are not changed — they retain their original reference numbers. Rollback of a merge is blocked if any payment was recorded against either record during the 24-hour rollback window.

---

# 01.10 Smart Views

Smart views are real-time filtered lists that surface students matching specific conditions. They update continuously and do not require manual filtering.

| **Smart View** | **Default Condition** | **Default Threshold** |
|---|---|---|
| Re-enrolment due | Active students approaching end of current term with no confirmed enrolment for next term | 21 days before term end |
| High re-enrolment likelihood | Students with a retention confidence score above threshold ([[08_Management-M10_Management_Dashboard|M10]]). Exportable as CSV. | Score 70+ (configurable) |
| Overdue balance | Students with at least one overdue invoice | 14+ days overdue |
| High churn risk | Students with a churn risk score above threshold ([[08_Management-M10_Management_Dashboard|M10]]) | Score 70+ (configurable) |
| Age / year group mismatch | Students whose date of birth falls outside the expected age range for their year group | Any mismatch outside ±1 year of expected range |
| School update required | Students who have progressed to a year group their current school does not support | Triggered at annual year group progression |
| Profile unverified | Students whose guardian has not completed periodic profile verification this academic year | Start of new academic year |
| No activity | Active students with no sessions attended in current term | 3+ weeks of term elapsed |

Smart views are accessible from the Student CRM module navigation and from the [[08_Management-M10_Management_Dashboard|M10]] Dashboard. Any smart view can be exported as a CSV filtered list by Admin Head and above.

---

# 01.11 School Change and Year Group Progression Flags

When annual year group progression fires, the system runs additional checks to flag students who may need their school information updated.

When a student progresses from Y6 to Y7, the system checks whether their current school is marked as Primary-only in the school directory. If the school does not support Y7, a School Update Required flag is raised on the student profile and the student appears in the smart view. Admin receives an in-app notification listing all flagged students after the annual progression event fires.

Admin can store a student's confirmed school for the next academic year in advance. When year group progression fires, the stored school automatically replaces the current school with no flag raised. If no next-year school is stored and the current school does not support the new year group, the flag is raised as above.

The system maintains an expected age range per year group. On record creation and on each annual progression, the student's date of birth is checked against the expected range. If the DOB falls outside the expected range, a data quality flag is raised. Admin can dismiss the flag with a logged reason.

---

# 01.12 Role-Based Access

| **Role** | **Access Level** |
|---|---|
| Org Owner, Super Admin | Full access — all student and guardian records across all branches |
| Admin Head, Admin | Full access — all student and guardian records within their branch |
| Academic Head | Full access — all student records. View-only on financial fields. |
| HOD | Scoped to their department — students enrolled in their subjects. View-only on financial fields. |
| Head of Subject | Scoped to their subject — students enrolled in their subject only |
| HR/Finance | All student records — view only. Can see financial fields (`students.viewFinancial`). Cannot edit profile data, medical data, or academic fields. Guardian records: view, create, edit. Cannot set DNC. |
| Teacher | Own students only — students currently enrolled in their sessions. View-only. Cannot edit profile data. |
| TA | Own session students only — limited view. No financial or medical data visible. |
| Parent | Own children only — filtered view via parent portal (Phase 2). In v1 parents receive data via communications only. |

---

# 01.13 IMI Reference Configuration

| **Setting** | **IMI Value** |
|---|---|
| Graduated → Alumni transition | 30 days (platform default, configurable in [[09_Settings-M20_Tenant_Settings|M20]] by Super Admin) |
| Profile verification trigger | First session booked in each new academic year |
| KHDA guardian requirement | FS1 and FS2 — guardian must be present for all sessions. Cannot be disabled. |
| Department mapping | FS1–Y6 = Primary, Y7–Y9 = Lower Secondary, Y10–Y13 = Senior, Graduated/Alumni = null |
| Medical conditions | 15 structured general medical options + separate food allergy section with structured dropdown |
| Media opt-out levels | Level 1 (no social media), Level 2 (face not identifiable), Level 3 (complete exclusion) |
| Primary communication channel | WhatsApp via BSP |
| Dubai district dropdown | 76 pre-loaded districts. Maintained by Org Super Admin. |
| Billing guardian default | Primary guardian. Admin can reassign at any time. |
| Duplicate detection threshold | 70% weighted score triggers warning. 50–69% triggers soft suggestion. |
| Age/year group mismatch tolerance | Flag raised if DOB falls outside ±1 year of expected range for the year group |
