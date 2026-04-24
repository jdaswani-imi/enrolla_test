---
module: "M12"
title: "People, Forms & Documents"
layer: "People & HR"
folder: "05_People"
status: "Draft"
phase: "v1"
dependencies: [M09, M13]
tags: [enrolla, prd, people, forms]
---

# ENROLLA
# [[05_People-M12_People_Forms|M12]] — People, Forms & Documents
v1.6 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

[[05_People-M12_People_Forms|M12]] provides the directory, segmentation, form building, and bulk contact management infrastructure that sits across all contact records in the platform. It is the operational layer for managing people at scale — building targeted segments, creating custom data capture forms, detecting duplicates, generating batch suggestions, and exporting contact data. [[05_People-M12_People_Forms|M12]] does not store the primary contact records; those live in [[03_Student-M01_Lead_Management|M01]] (Leads), [[03_Student-M02_Student_Guardian_CRM|M02]] (Students and Guardians), and [[05_People-M09_Staff_Performance|M09]] (Staff). [[05_People-M12_People_Forms|M12]] provides the tools to work across those records in bulk.

| **Property** | **Value** |
|---|---|
| Module code | [[05_People-M12_People_Forms|M12]] |
| Version | v1.5 |
| Status | Draft |
| Primary roles | Admin Head, Super Admin, Admin |
| Secondary roles | Academic Head (personal segments), HOD (segment view, batch suggestions for own department) |
| Data scope | All contact types — Students, Guardians, Leads, Staff — across all branches visible to the user |
| Dependencies | [[03_Student-M01_Lead_Management|M01]], [[03_Student-M02_Student_Guardian_CRM|M02]], [[05_People-M09_Staff_Performance|M09]], [[07_Operations-M13_Automation_Communications|M13]], [[07_Operations-M16_Task_Management|M16]], [[09_Settings-M20_Tenant_Settings|M20]] |
| Phase | v1 |

---

# 01.1 Platform-Wide Created On Timestamp Standard

Every record created through an action in Enrolla carries a Created On timestamp. This is a platform-wide standard governed in [[05_People-M12_People_Forms|M12]] as the canonical specification. The timestamp is system-generated at the moment of creation and is immutable — it cannot be edited, overridden, or deleted by any role including Super Admin.

| **Rule** | **Detail** |
|---|---|
| Format | DD/MM/YYYY HH:MM — 24-hour time, UAE time zone (UTC+4) |
| Applies to | All created records including: student profiles, guardian records, lead records, staff profiles, invoices, payments, form submissions, tasks, concerns, complaints, attendance records, and any other system record created through a user action or automation |
| Immutability | The Created On timestamp cannot be changed after creation under any circumstance |
| Export inclusion | Created On is a non-removable column in all CSV exports across the platform. It cannot be deselected from field selection during export configuration. |
| Display | Shown on every record detail view |
| Time zone | All timestamps stored and displayed in UAE time (UTC+4). No time zone conversion is offered in v1. |

---

# 01.2 Navigation and People Directory

The People section provides a unified directory of all contact records across the platform.

| **Tab** | **Contents** |
|---|---|
| Students | All student records — enrolled, paused, withdrawn, graduated, and alumni. Filterable by year group, department, subject, school, status, attendance rate, churn risk score, and outstanding balance. |
| Guardians | All guardian records. Filterable by DNC status, unsubscribe status, WhatsApp broadcast list membership, communication channel, and linked student status. |
| Leads | All lead records across all pipeline stages. Filterable by stage, source channel, assigned staff, and days in current stage. |
| Staff | All staff records. Filterable by department, subject, role, and employment status. |
| Segments | Personal and org-wide saved segments. See 01.5. |
| Forms | All custom forms — active, draft, and archived. See 01.8. |

Wherever possible across [[05_People-M12_People_Forms|M12]], structured dropdowns and multi-select fields are used rather than free-text inputs to ensure data quality and enable reliable filtering, reporting, and segmentation.

---

# 01.3 Duplicate Detection and Merge

The duplicate detection system runs automatically when a new student, guardian, or lead record is created.

## 01.3.1 Duplicate Detection Scoring

| **Field** | **Weight and Method** |
|---|---|
| Phone number | 40% — exact match plus transposition tolerance (detects digit swaps) |
| Email address | 30% — exact match plus fuzzy matching (detects typos such as .con vs .com) |
| Student name | 20% — fuzzy matching using Levenshtein distance (catches spelling variations). Thresholds: Hard block (≥90% similarity): Record creation is blocked. Admin must resolve the potential duplicate before proceeding. Soft warning (70–89% similarity): Warning shown. Admin can proceed but must acknowledge the warning. Suggestion (50–69% similarity): Suggestion banner shown. Admin can dismiss and proceed without acknowledgement. |
| Date of birth | 10% — exact match only |

**Arabic Transliteration Dictionary:** The duplicate detection engine includes an Arabic transliteration dictionary to handle common Arabic name variations in Latin script (e.g. Mohamed / Muhammad / Mohammed, Fatima / Fateema, Al / El prefix variations). Names that are transliteration equivalents are treated as potential matches even when their Levenshtein distance exceeds the threshold. The dictionary is maintained by the platform team and can be supplemented by Super Admin in [[09_Settings-M20_Tenant_Settings|M20]].

## 01.3.2 Duplicate Alert Thresholds

| **Score** | **System Response** |
|---|---|
| 70% or above | Warning displayed during record creation. Admin must actively resolve — confirm as duplicate and proceed to merge, confirm as a separate record, or defer for later review. Record cannot be saved until one of these options is selected. |
| 50–69% | Suggestion displayed as a softer prompt noting a possible match. Admin can dismiss and continue without resolving. |
| Below 50% | No alert. Record creates without interruption. |

## 01.3.3 Merge Process

The merge process follows four sequential steps that cannot be skipped.

| **Step** | **Detail** |
|---|---|
| Step 1 — Side-by-side field review | The system displays both records in a two-column layout. Fields where both records hold the same value are displayed with a green match indicator. Fields where the records differ are highlighted in amber — these require a selection decision. |
| Step 2 — Field-level value selection | For every amber (conflicting) field, Admin clicks to select which value to keep in the merged record. Admin cannot proceed until every conflicting field has a selection. There is no bulk 'keep all from Record A' option — each conflict is resolved individually. |
| Step 3 — Pre-confirmation summary | The system displays a complete summary screen showing exactly what the merged record will contain: every field with its final value, and a list of all data being transferred from the secondary record. A back button is available to return to Step 2. |
| Step 4 — Typed confirmation | After reviewing the summary, Admin types MERGE in a confirmation field and clicks Confirm. The merge executes only at this point. The action is irreversible after Step 4 is completed. |

## 01.3.4 Post-Merge Behaviour

**Financial Record Conflict — Mandatory Review Step:**
If either record being merged has financial records (invoices, payments, or credits), the merge flow inserts a mandatory financial review step before the Step 4 typed confirmation. Admin reviews both records' financial histories side by side before proceeding. The primary record retains all financial records. The secondary record's financial records are re-linked to the primary record's ID. Credit balances are summed. Invoice numbers are not changed. Rollback of a merge is blocked if any payment was recorded against either record during the 24-hour rollback window.

| **Rule** | **Detail** |
|---|---|
| Primary record | Retains the selected field values. All data from the secondary record is consolidated onto it. The Created On timestamp of the primary record is preserved. |
| Secondary record | Archived immediately after merge. A full snapshot of the secondary record's data at the time of merge is stored permanently and accessible to Admin Head and above. |
| Secondary record pointer | The archived secondary record displays a banner: 'This record was merged into [Primary Record Name] on [DD/MM/YYYY HH:MM] by [Staff Member].' |
| Financial records | All invoices, payments, and credit records from both records are consolidated on the primary. Credit balances are summed. Invoice numbers retain their original references. No financial data is lost or deleted. |
| Communication log | All communication log entries from both records are merged chronologically on the primary record. |
| Audit log | Merge event logged permanently: primary record, secondary record, merged by, field-level selections made, timestamp. |
| Merge access | Admin and above — Teachers and TAs cannot initiate merges. |

---

# 01.4 Dubai District Dropdown

The home area / district field on student and guardian profiles uses a pre-defined searchable dropdown of 76 Dubai districts.

| **Rule** | **Detail** |
|---|---|
| Pre-loaded entries | 76 Dubai districts pre-loaded at tenant setup |
| Tenant management | Super Admin can add or hide entries in [[09_Settings-M20_Tenant_Settings|M20]]. Core entries cannot be deleted. |
| Field behaviour | Searchable dropdown — not a free-text field |
| Reporting use | Filterable in segment builder and guardian list view. Included in contact exports. |
| Mailchimp | District data included in Mailchimp CSV export for area segmentation. |

---

# 01.5 Segment Builder

The segment builder allows staff to create named, reusable groups of contacts based on filter criteria. Segments are dynamic — they update automatically as underlying data changes.

## 01.5.1 Segment Types

| **Type** | **Detail** |
|---|---|
| Personal segment | Created and owned by an individual user. Visible only to the creator. Any user with People directory access can create personal segments — including Teachers (for their own students), HODs, Academic Head, Admin, Admin Head, and Super Admin. |
| Org-wide segment | Created by Admin Head or Super Admin. Visible to all Admin-level roles and above. Used for team-wide targeting, automation audiences, and shared reporting views. |

## 01.5.2 Segment Filter Criteria

Multiple filters combine using AND logic by default. OR logic is available within a single filter dimension using multi-select.

| **Filter Dimension** | **Options** |
|---|---|
| Contact type | Student / Guardian / Lead / Staff |
| Year group | Any year group — FS1 through Y13, Graduated, Alumni |
| Department | Primary, Lower Secondary, Upper Secondary |
| Subject | Any subject from the catalogue — multi-select |
| School | Any school from the directory — multi-select |
| Home district | Any Dubai district — multi-select |
| Enrolment status | Active, Paused, Withdrawn, Graduated, Alumni |
| Lead pipeline stage | Any [[03_Student-M01_Lead_Management|M01]] pipeline stage — multi-select |
| Lead source channel | Website, WhatsApp, Referral, Instagram, Walk-in, Other |
| Payment status | Overdue, Fully paid, Credit balance, Outstanding balance |
| Attendance rate | Above or below a configurable percentage threshold |
| Churn risk score | Above or below a configurable score threshold ([[08_Management-M10_Management_Dashboard|M10]]) |
| DNC status | DNC flagged / not flagged |
| Unsubscribe status | Unsubscribed / subscribed |
| WA broadcast list | Member of a specific list / not a member / enrolled but not on list |
| Guardian comms channel | WhatsApp, Email, Both |
| Last contact date | Within the last N days / more than N days ago |
| Staff role | Any platform role — multi-select |
| Staff department | Primary, Lower Secondary, Upper Secondary |

## 01.5.3 Segment Actions

From any segment, users with the appropriate permissions can execute the following actions. Batch actions are available to Admin and above.

| **Action** | **Access** |
|---|---|
| Send WhatsApp message | Admin and above — routes to [[07_Operations-M13_Automation_Communications|M13]] broadcast. DNC rules apply automatically. |
| Send email | Admin and above — routes to [[07_Operations-M13_Automation_Communications|M13]] email. Unsubscribe rules apply automatically. |
| Assign task | Admin and above — creates tasks in [[07_Operations-M16_Task_Management|M16]] for each contact in the segment |
| Log contact note | Admin and above — logs a system note on each contact's communication log |
| Export contacts | Admin Head, Super Admin — exports the segment as CSV |
| Create automation | Admin Head, Super Admin — uses the segment as an automation audience in [[07_Operations-M13_Automation_Communications|M13]] |
| View members | All roles with segment access — opens a live list of all matching contacts |
| Edit segment | Owner (personal) / Admin Head or Super Admin (org-wide) |
| Delete segment | Owner (personal) / Admin Head or Super Admin (org-wide) |

**Segment Resolution:** Lazy. Segment membership is not evaluated when a record is created or updated. Membership is evaluated when a segment is referenced — for example, when an automation rule runs or when a report is generated. Resolved segment membership is cached for 15 minutes. After the cache expires, the segment re-evaluates on the next reference. This prevents performance issues from real-time segment recalculation on every record change.

A segment cannot be deleted if it is referenced by one or more active automation rules. The deletion attempt shows an error: 'This segment is used by [N] active automation rule(s): [list of rule names]. Deactivate or update these rules before deleting the segment.' Super Admin cannot override this block.

---

# 01.6 Batch Suggestions

The batch suggestions engine generates daily lists of students or leads matching conditions that warrant a specific action. All suggested actions require human confirmation — no automated action executes from a batch suggestion without Admin approval.

| **Suggestion Type** | **Trigger Condition** |
|---|---|
| Re-enrolment nudge | Active students approaching term end with no confirmed schedule for next term |
| Overdue invoice — not contacted | Students with invoices overdue 7+ days and no logged contact in the past 3 days |
| Lead pipeline stall | Leads in any pipeline stage for 10+ days with no activity logged |
| Class group suggestion | Students sharing the same subject, year group, and overlapping availability — suggested as a potential group class |
| Makeup outstanding | Students with makeup sessions allocated but not yet scheduled before they expire |
| Onboarding incomplete | Newly enrolled students with mandatory profile fields still blank after 48 hours |
| Concern follow-up | Students with open L2 or L3 concerns where no contact has been logged in the past 7 days |
| Trial not converted | Leads who completed a trial class more than 5 days ago with no follow-up action recorded |

---

# 01.7 Broadcast List Management

The Broadcast List section provides a three-state view of all configured WhatsApp broadcast lists.

## 01.7.1 Three-State Enrolment View

| **Category** | **Definition** | **Expected Action** |
|---|---|---|
| Not enrolled | Guardians on the broadcast list whose linked students are not currently actively enrolled | Review — these guardians may be on the list incorrectly. Admin can remove manually. |
| Enrolled and on list | Guardians whose linked students are active and who are already members of the broadcast list | No action needed — this is the correct state. |
| Enrolled but not on list | Guardians whose linked students are active and paid but who are not members of the broadcast list | Flagged for auto-add automation. Admin can add manually from this view. |

## 01.7.2 Broadcast List Auto-Add Automation

| **Automation Rule** | **Detail** |
|---|---|
| Trigger | Student's first invoice for a given term is marked as Paid in [[06_Finance-M08_Finance_Billing|M08]] |
| Action | Guardian is added to the broadcast list configured for that student's department (Primary, Lower Secondary, or Upper Secondary). Executed via [[07_Operations-M13_Automation_Communications|M13]] BSP integration. |
| Scope | One guardian per student — the primary guardian (or billing guardian if different) is added. Co-guardians are not added automatically. |
| Discrepancy surfacing | If a student's invoice is paid but the automation has not yet executed (e.g. BSP sync delay), the guardian appears in the Enrolled but not on list category. Admin can trigger the add manually from that row. |
| Removal | The automation only adds — it does not automatically remove guardians when a student withdraws. Removal is a manual Admin action to prevent accidental removal of guardians who may re-enrol. |
| Audit | Every auto-add and manual add or remove is logged with the guardian, the list, the action, the trigger, and the timestamp. |

## 01.7.3 Profile Update Request

Admin can send a profile update request to any guardian or student directly from their contact record or from the People directory. This is also available as a bulk action for cases such as annual profile verification.

| **Step** | **Detail** |
|---|---|
| 1. Admin initiates | Admin selects Send profile update request from the contact record or bulk action menu. Selects delivery channel: WhatsApp or email. |
| 2. Message sent | A message is sent to the guardian or student containing a link to a pre-filled form with their current profile details populated. |
| 3. Guardian/student submits | The recipient reviews their details, makes any corrections, and submits the form. Submission is timestamped. |
| 4. Admin reviews | The submission appears in the form's submissions log flagged as a Profile Update Request. Admin reviews the proposed changes field by field before applying any updates. |
| 5. Admin applies | Admin approves or rejects each proposed change individually. Approved changes are applied to the profile immediately. Rejected changes are noted in the audit trail with a reason. |

---

# 01.8 Form Builder

The form builder allows Admin Head and Super Admin to create custom forms for data capture. Forms are used for consent collection, event registration, feedback surveys, and enquiry capture.

## 01.8.1 Form Field Types

| **Field Type** | **Description** |
|---|---|
| Text (short) | Single-line free-text input. Used for names, reference numbers, and short answers. |
| Text (long) | Multi-line free-text input. Used for notes, descriptions, and open-ended responses. |
| Dropdown | Single-select from a predefined list of options configured per field in the builder. |
| Multi-select | Select one or more options from a predefined list. |
| Date | Date picker. Used for DOB, appointment dates, and event dates. |
| File upload | Allows the submitter to attach a file. Accepted types and max file size are configurable per field. |
| Checkbox | Single yes/no toggle. Used for consent acknowledgements and boolean confirmations. |
| Radio button | Single-select from two or more horizontally displayed options. |

## 01.8.2 Conditional Logic

Fields can be shown, hidden, or made required based on the answers to prior fields. Multiple conditions combine using AND logic.

| **Condition Type** | **Example** |
|---|---|
| Show field if | Show 'Exam board' if Year group is Y10, Y11, Y12, or Y13 |
| Hide field if | Hide 'Sibling details' if 'Do you have another child at IMI?' is No |
| Required if | Make 'GCSE subject' required if Qualification route is GCSE or IGCSE |
| Multiple conditions | Show 'IB Maths specifier' if Year group is Y12 or Y13 AND Qualification is IB Diploma AND Subject is Mathematics |

## 01.8.3 Source Tags and Auto-Create Records

Each form is assigned a source tag. When a submission creates a new record, the source tag is automatically applied as the lead source channel.

> **Form auto-create:** A form submission can auto-create a Lead record only. Student records are never created directly from a form submission — students are always created from Lead conversion following the [[03_Student-M04_Enrolment_Lifecycle|M04]] lifecycle. When a form is configured to auto-create a record, the system creates a Lead record and routes it into the configured pipeline stage.

| **Auto-Create Option** | **Behaviour** |
|---|---|
| Create new Lead | New lead created in [[03_Student-M01_Lead_Management|M01]] on submission. Duplicate detection runs first. If a duplicate is detected, the submission is flagged for Admin review. If the submitting guardian is already in the system, the new lead is linked to their existing guardian profile and the potential duplicate detection engine runs before the lead is created. The auto-create rule is optional — it can be toggled off per form if Admin prefers to review submissions and create records manually. |
| Update existing record | If submitter's phone or email matches an existing record, the submission proposes an update to specified fields. Admin reviews before any update is applied. |
| No auto-create | Submission stored in submissions log only. Admin acts manually. Used for feedback forms and surveys. |

## 01.8.4 Form Sharing and Embedding

| **Sharing Method** | **Detail** |
|---|---|
| Standalone link | Unique URL per form. Can be shared via WhatsApp, email, social media, or printed as a QR code. |
| WhatsApp embed | Form link included in a WhatsApp message template. Opens in the recipient's mobile browser. |
| Website embed | Embed code snippet generated per form. Paste into the tenant's website HTML. Submissions route back to Enrolla automatically. |
| Expiry | Optional expiry date per form. After expiry, the form link returns a closed message. |
| Password protection | Optional per form. Used for internal or restricted-access forms. |

## 01.8.5 Form Submission Timestamp

Every form submission carries a system-generated timestamp in DD/MM/YYYY HH:MM format (UAE time, UTC+4). This timestamp is immutable — it cannot be edited, overridden, or deleted by any role including Super Admin. It is displayed on every submission record in the submissions log and is included in all form submission exports as a non-removable column.

## 01.8.6 Form Access and Management

| **Action** | **Access** |
|---|---|
| Create form | Admin Head, Super Admin only |
| Edit form | Admin Head, Super Admin only. Edits to a published form apply immediately. |
| Archive form | Admin Head, Super Admin only. Archived forms are no longer accessible via their share link. |
| View form and submissions | Admin and above |
| Export submissions | Admin Head, Super Admin — CSV export including submission timestamp as a non-removable column |

## 01.8.7 Two-Form Model and Profile Update Link

**Two-Form Model:**
Enrolla uses a two-form model for guardian and student data collection:

1. **Lead Enquiry Form** — Public-facing. Captures initial enquiry data. Fields: guardian name, phone, email, student name, student preferred name (optional), year group, nationality (optional), home area/district (optional), subject(s) of interest, school, source channel, 'Who referred you?' (conditional — appears only when source is Referral Parent). This form creates a Lead record in [[03_Student-M01_Lead_Management|M01]].

2. **Enrolment Form** — Internal. Completed by Admin or guardian during the conversion from Lead to Student. Captures full student and guardian profile data required for enrolment. Fields include all required [[03_Student-M02_Student_Guardian_CRM|M02]] fields not captured in the Lead Enquiry Form.

**Profile Update Link:**
A separate mechanism (not a form in the Form Builder) that allows Admin to generate a personalised, time-limited tokenised link. The guardian clicks the link and can update their own contact and communication preference fields directly without logging in. The Profile Update Link is not a full form — it only exposes the guardian's own updatable fields. Configuration and security spec: see [[01_Foundation-PL04_Security_Access|PL-04]] Section 11.

---

# 01.9 Contact Export

Admin Head and Super Admin can export filtered contact lists from [[05_People-M12_People_Forms|M12]]. Export access is permission-based — any user with export permission receives the full file including all contacts in scope. There are no confirmation dialogs, DNC exclusions, or compliance warnings. The DNC Status column is always present in every export. All exports are logged in the system audit trail.

## 01.9.1 Standard CSV Export

| **Exportable Field Category** | **Fields Available** |
|---|---|
| Student fields | Full name, year group, department, school, enrolment status, subjects enrolled, attendance rate, outstanding balance, churn risk score, Created On |
| Guardian fields | Full name, phone number, email, home district, DNC status, unsubscribe status, preferred channel, broadcast list memberships, linked students, Created On |
| Lead fields | Full name, phone, email, year group, subject interest, source channel, pipeline stage, assigned staff, days in pipeline, Created On |
| Staff fields | Full name, work email, role, department, subjects assigned, employment status, Created On |

Created On and DNC Status are non-removable columns in every export. All other fields are selectable before export.

## 01.9.2 Google Contacts CSV Export

The Google Contacts CSV export formats guardian records for direct import into Google Contacts. The format is fixed and non-configurable. Used by IMI to maintain a Google Contacts group for quick WhatsApp access outside the platform.

| **Field** | **Format** |
|---|---|
| Contact name | Guardian full name — Student YrGroup \| Sibling YrGroup. Example: Sarah Al Mansoori — Khalid Y9 \| Layla Y6 |
| Phone | Primary guardian phone number |
| Email | Primary guardian email address |
| Export scope | Filterable by segment, department, year group, or enrolment status before export |

## 01.9.3 Export Audit Trail

Every export is logged permanently: exported by, timestamp (DD/MM/YYYY HH:MM), export scope (filter or segment applied), format, and field selection. Exported files are not stored in Enrolla — the download is generated at the time of export.

---

# 01.10 Role-Based Access Control

| **Role** | **People Directory** | **Segments** | **Forms / Export** |
|---|---|---|---|
| Super Admin | Full — all contacts, all branches | Create org-wide + personal, view all | Create, edit, archive, export all |
| Admin Head | Full — own branch | Create org-wide + personal, view all | Create, edit, archive, export all |
| Admin | Full — own branch | Personal only — create, view own | View submissions only |
| Academic Head | Students across all departments | Personal only — create, view own | No access |
| HOD | Students + staff in own department | Personal only — view own dept segments | No access |
| Teacher | Own assigned students — read only | Personal (own students) — create, view own | No access |
| TA | Own assigned sessions — read only | No access | No access |
| HR/Finance (Custom) | Staff records only | No access | No access |

---

# 01.11 IMI Reference Configuration

| **Setting** | **IMI Default** |
|---|---|
| Dubai district dropdown list | 76 districts pre-loaded. Super Admin manages additions and visibility. |
| Duplicate detection — warning threshold | 70% similarity score |
| Duplicate detection — suggestion threshold | 50–69% similarity score |
| Batch suggestion cadence | Daily at 07:00 UAE time |
| Lead pipeline stall threshold | 10 days with no activity |
| Trial not converted threshold | 5 days after trial class with no follow-up |
| Overdue invoice contact window | 7 days overdue with no contact in past 3 days |
| Broadcast list — department-to-list mapping | Primary list, Lower Secondary list, Upper Secondary list — each mapped to a separate BSP broadcast list |
| Broadcast list auto-add trigger | First paid invoice per student per term |
| Form source tag options | Matches [[03_Student-M01_Lead_Management|M01]] source channel list — configurable per tenant |
| Google Contacts CSV name format | Guardian name — Student YrGroup \| Sibling YrGroup |
| Profile update request — delivery channel | WhatsApp (default) or Email — configurable per tenant |
