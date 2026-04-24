---
module: "M20"
title: "Tenant Settings"
layer: "Settings"
folder: "09_Settings"
status: "Draft"
phase: "v1"
dependencies: [PL-01, PL-02]
tags: [enrolla, prd, settings, configuration]
---

# ENROLLA
# [[09_Settings-M20_Tenant_Settings|M20]] — Tenant Settings
v1.1 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

[[09_Settings-M20_Tenant_Settings|M20]] is the central configuration hub for the entire Enrolla platform. It is the single location where a Super Admin configures every tenant-level default, branding element, billing rule, academic structure, role, integration, feature toggle, and notification preference. All other modules reference [[09_Settings-M20_Tenant_Settings|M20]] for their configurable defaults — [[09_Settings-M20_Tenant_Settings|M20]] does not own operational data, it owns the rules by which operational data is governed.

[[09_Settings-M20_Tenant_Settings|M20]] operates at two levels: Organisation (applies across all branches) and Branch (inherits org settings by default, with per-field override available at branch level). Changes take effect immediately across the platform. Every change is logged in the audit trail permanently.

| **Property** | **Value** |
|---|---|
| Module code | [[09_Settings-M20_Tenant_Settings|M20]] |
| Version | v1.1 |
| Status | Draft |
| Sub-modules | [[09_Settings-M20_Tenant_Settings|[[09_Settings-M20_Tenant_Settings|M20]].A]] — Onboarding Wizard (folded in Section 9) |
| Access | Super Admin only. All sections. All changes immediate. |
| Levels | Organisation (org-wide default) and Branch (inherits org, can override per field) |
| Audit | Every change logged: Super Admin name, timestamp, setting name, previous value, new value. Permanent. |
| Sections | 15 sections: Org & Branch, Branding, Billing & Payments, Academic Structure, Grading & Progress, Staff & HR, Roles & Permissions, Communications & Templates, Churn & Dashboard, Integrations, Feature Toggles, Terminology, Notifications, Vacant Role Fallback, Referral Programme Reward Builder |
| Dependencies | All modules — [[09_Settings-M20_Tenant_Settings|M20]] is the config source for all configurable defaults |
| Phase | v1 |

---

# 01.1 Organisation & Branch Settings

Core identity and operational parameters for the organisation and each branch.

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Org name | Trading name displayed on all documents | Improve ME Institute |
| Legal name | Full registered legal name. Used on DPA and formal correspondence. | Improve ME Institute LLC |
| Student ID format | OrgPrefix-#### (platform-wide sequential number. No branch code. Ever.) Locks 14 days after Go-Live. | IMI-#### |
| Currency | AED. Cannot be changed after go-live. | AED |
| Timezone | UTC+4 for UAE. Applied to all timestamps and scheduling. | UTC+4 |
| Default language | English only in v1. | English |
| Start day of week | First day of the working week for calendar display. | Monday |
| Weekly closure days | Days on which the centre is closed. Warning shown when scheduling on these days. Not a block. | Sunday |
| Office hours | Operating hours per day. Warning outside hours, not a block. | Mon–Sat 08:00–20:00 |
| VAT registration number | UAE Tax Registration Number (TRN). Displayed on all invoices. | Configured at setup |

---

# 01.2 Branding

Visual identity settings applied to all parent-facing and exported documents: invoices, progress report PDFs, email headers, and the platform login page.

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Organisation logo | PNG or SVG. Displayed on invoices, PDF reports, email headers, and the login page. | IMI logo |
| Primary colour | Hex colour code. Used for invoice and PDF report header bands and accent elements. | Configured at setup |
| Secondary colour | Hex colour code. Used for secondary elements in PDFs and email templates. | Configured at setup |
| Invoice header style | Logo left + org details right / Centred logo + org details below / Text only | Logo left |
| Email sender name | The name displayed in the From field of all outbound emails. | Improve ME Institute |
| Email reply-to address | The address to which parent email replies are directed. | Configured at setup |
| Invoice footer text | Rich text field. Appears at the bottom of every invoice PDF. | Configured at setup |
| Report PDF branding | Progress report PDFs use the same logo and colour scheme as invoices by default. Toggle to use a separate report-specific header style. | Same as invoice |
| Custom domain | Branded subdomain for the platform login page. Phase 2 only. | Phase 2 |

---

# 01.3 Billing & Payments

## 01.3.1 VAT & Tax

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| VAT rate | Applied post-discount on all invoices. Platform-wide. | 5% |
| VAT label | Display label for the tax line on invoices. | VAT |
| VAT registration number | Displayed on all invoices. | TRN configured at setup |
| Zero-rated categories | Not applicable in v1. VAT is applied at a single org-level rate across all line items. Per-subject VAT configuration is not supported in v1. | None at IMI |

## 01.3.2 Invoice Configuration

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Invoice number format | Prefix + optional separator + sequential number. Starting number configurable. Locked after first invoice is created. | IMI-#### |
| Invoice due date default | Days after issue date that an invoice is due. Admin can override per invoice. | 7 days |
| Late fee | AED amount applied to overdue invoices. Set to zero to disable. | AED 0 |
| Invoice delivery default | Default delivery timing: Immediately on issue / On issue date / Scheduled / Internal only. | Immediately on issue |
| Invoice reminder lead times | Days before due date at which automated reminders are sent. Multiple values configurable. | 7 days, 3 days, 1 day |

## 01.3.3 Payment Plan Configuration

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Minimum invoice value for payment plan | Invoices below this value are not eligible for a payment plan. | AED 4,000 |
| Default payment split | First instalment percentage. Second instalment = remainder. | 60% / 40% |
| Maximum instalments | Default maximum number of instalments. | 2 |
| Third instalment override | Admin can add a third instalment without prior approval. Admin Head is notified immediately. | Allowed with notification |

## 01.3.4 Bank Accounts & Revenue Tagging

Each account entry contains: account name, bank name, account number, IBAN, Swift/BIC code, revenue tag (department mapping). The invoice builder routes bank details automatically based on the student's year group.

| **Account** | **IMI Configuration** |
|---|---|
| Primary (FS1–Y6) | ADCB KBW Branch. Account 10464418124001. IBAN AE230030010464418124001. Swift ADCBAEAA060. |
| Lower Secondary (Y7–Y9) | ADCB KBW Branch. Account 10464418920002. IBAN AE920030010464418920002. Swift ADCBAEAA060. |
| Upper Secondary (Y10–Y13) | ADCB KBW Branch. Account 10464418920001. IBAN AE220030010464418920001. Swift ADCBAEAA060. |

---

# 01.4 Academic Structure

Department, year group, session, and catalogue configuration. Settings here govern how [[04_Academic-M11_Academic_Courses|M11]] and [[04_Academic-M05_Timetabling_Scheduling|M05]] structure the academic offering.

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Department list | Three departments pre-configured: Primary, Lower Secondary, Senior. Fourth Enrichment department available. | Primary, Lower Secondary, Senior, Enrichment |
| Year group mapping | Each year group mapped to a department. Editable. | FS1–Y6 = Primary; Y7–Y9 = Lower Secondary; Y10–Y13 = Senior |
| Year group dual naming | Each year group has a primary name and an alias (e.g. Y1 / Grade 1, FS1 / Nursery). Both display in the platform. | Configured at setup |
| KHDA guardian requirement | For FS1 and FS2 students, at least one guardian must be verified. | FS1 and FS2 only |
| Session durations | Permitted session durations. 90 minutes is platform-blocked and cannot be added. | 45 min (Primary), 60 min (all), 120 min (all) |
| Cross-branch visibility | Toggle staff and student visibility across branches. Both default to Off when second branch is created. | Off by default |
| Assessment form configuration | Each department can configure the assessment outcome form fields and which Recommendation dropdown options appear. Default fields: Recommendation (dropdown), Observed Level, Target Grade, Notes. | Configured per department |

---

# 01.5 Grading & Progress

Configuration for the progress tracker, Academic Alert System, and report delivery.

## 01.5.1 Progress Tracker Configuration

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Default pass threshold | Minimum score considered a pass in the evaluation tier system. | 80% |
| Intervention trigger | Number of consecutive Requires Support tiers on the same topic before an [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] concern is auto-created. | 3 consecutive |
| Intervention consolidation threshold | Number of simultaneous topic intervention flags at which a single consolidated concern is raised instead of individual per-topic flags | 3 topics |
| 48-hour remark window | Hours from topic link save time within which a teacher must update tracker remarks for topics covered. Clock starts when topic links are saved in [[04_Academic-M05_Timetabling_Scheduling|M05]], not from session end time. | 48 hours |
| Overdue submission window | Days past assignment due date before an overdue submission signal fires in the Academic Alert System. | 7 days |
| Topic tree soft limit | Number of nesting levels at which a soft warning is shown to HOD during topic tree construction. This is a warning only — not a hard limit. | 6 levels |

## 01.5.2 Academic Alert System Configuration

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Pattern trigger — signal count | Number of signals within the rolling window required to trigger a formal [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]] escalation. | 2 signals |
| Pattern trigger — rolling window | Time window within which signals are counted for the pattern trigger. | 4 weeks |
| Soft alert acknowledgement window | Hours before an unacknowledged soft alert escalates to HOD. | 48 hours |
| L1 resolution window | School days before an L1 formal concern auto-escalates to L2. | 5 school days |
| L2 resolution window | School days before an L2 formal concern auto-escalates to L3. | 5 school days |
| Parent contact timing — Primary | Escalation level at which parents are first notified. | L2 |
| Parent contact timing — Secondary | Escalation level at which parents are first notified. | L3 |
| Resolution note minimum length | Minimum word count for a teacher or HOD resolution note. Prevents empty closure. | 20 words |

## 01.5.3 Progress Report Configuration

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Report cadence | Frequency of auto-generated progress reports. Configurable per department. | Every 3 weeks |
| Report approval workflow | Options: Teacher approves / Teacher drafts then HOD approves / HOD approves directly. Set per department. | Configurable per dept |
| Report approval deadline | Days after report generation before an overdue alert fires. Configurable per department. | Configurable per dept |
| Report skip rule | Whether to generate a report when a student has 100% absences in a cycle. Options: Always generate / Skip if all absent / Prompt HOD to decide. | Configurable per dept |
| AI narrative prompt template | Department-level prompt template instructing the AI on tone, structure, and required content sections. | Configured per dept |
| AI summary toggle | Whether the AI generates a narrative draft. When off, the approver writes the narrative manually. | On |
| Unread follow-up window | Days after report delivery before an unread follow-up message is sent to the guardian. One follow-up only. | 3 days |
| Predicted grade weighting | HOD configures the weighting of each work type (Classwork, Homework, Test, Other) towards the predicted grade per subject. | HOD-configured per subject |

---

# 01.6 Staff & HR

Staff onboarding, off-boarding, milestone, and HR document configuration.

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| CPD annual target | Target number of CPD hours per staff member per year. Configurable per role or globally. | 20 hours |
| Staff milestone notifications | Toggle on or off. Configure additional milestone years beyond 6-month and 1-year defaults. | On — 6 months and 1 year |
| Off-boarding checklist template | Default checklist applied when off-boarding is initiated. | Configured at setup |
| Onboarding daily prompt toggle | Whether new staff receive a daily in-app prompt to complete mandatory profile fields. | On |
| Mandatory field configuration | Defines which staff profile fields must be completed before onboarding is complete. | Work email, home address, emergency contact |
| Off-boarding notification lead times | Days before last working day at which HR receives reminders. | 7, 3, 1 days |
| Performance review cycle | Frequency of staff performance reviews. Configurable per role. | Annual |

---

# 01.7 Roles & Permissions

The 12 platform roles (Super Admin, Admin Head, Admin, Academic Head, HOD, Head of Subject, Teacher, TA, Student, Parent, Custom, Developer) are the baseline. Super Admin can create custom roles, clone existing roles, restrict permissions, and set role expiry.

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Custom role creation | Create a new role from scratch or by cloning an existing role. | Available |
| Clone role | Duplicate an existing role as a starting point. | Available |
| Restrict permissions | Remove specific permissions from any non-platform-locked role. | Available |
| Role expiry | Set an expiry date on any role assignment. After expiry, the staff member reverts to a configurable fallback role. | Available |
| Secondary role labels | Any staff member can hold one primary role + any number of secondary role labels. Labels add permissions up — never restrict. Assigned by Super Admin only. | Available |
| HR/Finance custom role | Pre-configured custom role at IMI: staff profile view, salary view, document management, bulk invoice export, finance dashboard. | Active at IMI |

---

# 01.8 Communications & Templates

## 01.8.1 Duplicate Detection

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Hard block threshold | Similarity score at or above which record creation is blocked. | 90% |
| Soft warning threshold | Similarity score range that triggers a warning but allows creation to proceed. | 70–89% |
| Suggestion threshold | Similarity score range that shows a suggestion banner. | 50–69% |
| Arabic transliteration dictionary | Platform-maintained dictionary of common Arabic name transliteration equivalents. Super Admin can add tenant-specific entries. Used by the duplicate detection engine to identify names that are transliteration variants of each other. | Platform-maintained + tenant additions |

## 01.8.2 Per-Class Feedback Templates

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Dept base template | Each department has a base feedback selector set. All subjects inherit unless overridden. | Configured per dept |
| Subject override | Individual subjects can override the dept base with their own selector set. Override is full replacement, not additive. | Available |
| AI summary toggle | When on, Claude generates a parent-friendly summary. Teacher approves before send. | On |
| Feedback window | How long after session end a teacher can submit feedback. Closes at the earlier of: next session of same subject for that student, or 7 calendar days after session end. Configurable. | Until next session OR 7 days (whichever comes first) |

## 01.8.3 Template & Automation Configuration

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Template approval approvers | Who can approve org-wide template submissions. | Admin Head + Super Admin |
| Automation error notification | Recipient of in-app + email notification when an automation rule fails. | Super Admin |
| Bulk action high-volume threshold | Number of records above which a bulk action requires additional confirmation. | 500 records |
| Broadcast list dept mapping | Which BSP broadcast list each department maps to for bulk parent messaging. | Primary→List 1; Lower Sec→List 2; Upper Sec→List 3 |
| Google Review threshold | NPS score at or above which the Google Review prompt is shown to guardians. Super Admin only. | Configurable |

---

# 01.9 Churn & Dashboard

## 01.9.1 Churn Risk Score Weights

The table below shows the Phase 2 weights (when parent portal is active). These are the configured values for when all 8 signals are live.

Note: In v1 (no parent portal), weights are redistributed. v1 weights: Teaching Quality 28%, Missed sessions 17%, Overdue invoice 17%, Inconsistency 11%, Unresolved concern 11%, NPS 11%, Unsubscribed 5%, App inactive 0% (disabled). Phase 2 weights (when parent portal active): as shown in table above.

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Teaching Quality Concern | Weight in the overall churn risk score | 25% |
| Missed 3+ sessions (rolling window) | Weight in the overall churn risk score. Rolling window configurable. | 15% |
| Overdue invoice | Weight in the overall churn risk score | 15% |
| Inconsistency | Weight in the overall churn risk score | 10% |
| Unresolved concern | Weight in the overall churn risk score | 10% |
| NPS score | Weight in the overall churn risk score | 10% |
| App inactive 14 days | Weight in the overall churn risk score | 10% |
| Unsubscribed | Weight in the overall churn risk score | 5% |
| Missed sessions rolling window | Duration of the rolling window for missed sessions signal | 45 days |
| Churn high-risk threshold | Score at or above which a student is flagged as high churn risk (Red band) | 70 |
| Churn medium-risk threshold | Score at or above which a student is in the medium churn risk band (Amber) | 40 |

## 01.9.2 Seat Occupancy & Dashboard

| **Setting** | **Description** | **IMI Default** |
|---|---|---|
| Seat occupancy target | Target occupancy rate displayed as a reference line on occupancy charts | 80% |
| Low occupancy alert threshold | Occupancy rate below which a low occupancy alert fires | 50% |
| Occupancy rate formula | (Total enrolled student-session instances ÷ (Total room capacity × Total sessions scheduled)) × 100 | Per period |
| Peak hours definition | Time range considered peak hours for occupancy heatmap and reporting | 15:00–19:00 |
| Time slot unit | Duration of each slot in the occupancy heatmap and scheduling grid | 30 minutes |
| Activity feed max depth | Maximum number of entries retained in the live activity feed | 500 entries |
| Non-submission rate threshold | Per-subject assignment non-submission rate above which a signal is added to the per-subject churn score | 30% |

---

# 01.10 Integrations

All external integrations are Phase 2 in v1. This section of [[09_Settings-M20_Tenant_Settings|M20]] exists in the platform but all integrations show as Disconnected in v1.

| **Integration** | **Description** | **IMI Status** |
|---|---|---|
| Zoho Books | Bidirectional financial sync. Invoices pushed on issue; payments synced back; credit notes; VAT reporting. | Phase 2 |
| Zoho People | Staff profile bidirectional sync. Approved leave blocks timetable slots in [[04_Academic-M05_Timetabling_Scheduling|M05]]. | Phase 2 |
| WhatsApp BSP | BSP connection for automated outbound template messages. Inbound message capture. Broadcast list management. | Phase 2 |
| Instagram Graph API | Lead capture from Instagram DM. Auto-reply within Meta's 24-hour window. | Phase 2 |
| Mailchimp | CSV export of guardian contact list for Mailchimp email campaigns. | Phase 2 |
| Telr | Payment gateway for online invoice payments. | Phase 2 |
| Network International | Payment gateway for online invoice payments. | Phase 2 |
| Stripe | Payment gateway for online invoice payments. | Phase 2 |
| Custom webhooks | URL + event trigger configuration for advanced integrations. | Phase 2 |

---

# 01.11 Feature Toggles

All platform features are togglable per tenant. Feature toggles use a three-state model: On (active now), Off (disabled), and Later (deferred). The Later state keeps the feature in the platform UI but inactive.

| **Feature** | **Description** | **IMI Default** |
|---|---|---|
| Progress Tracking & Reports ([[04_Academic-M19_Progress_Tracking|M19]]) | Per-student per-subject progress tracker and periodic PDF reports | On |
| Academic Alert System ([[04_Academic-M19_Progress_Tracking|[[04_Academic-M19_Progress_Tracking|M19]].A]]) | Live monitoring of academic signals with structured escalation | On |
| Assignment Library ([[04_Academic-M14_Assignment_Library|M14]]) | Centralised assignment repository and digital assignment workflow | On |
| Task Management ([[07_Operations-M16_Task_Management|M16]]) | Full task management and workflow module | On |
| Inventory & Supplies ([[M15 — Inventory|M15]]) | Physical stock tracking and supplier directory | On |
| Churn Risk Score ([[08_Management-M10_Management_Dashboard|M10]]) | Weighted churn score on dashboard and student profiles | On |
| CPD Tracking ([[05_People-M09_Staff_Performance|M09]]) | Annual CPD hours tracking per staff member | On |
| Workload Indicators ([[05_People-M09_Staff_Performance|M09]]) | Staff workload traffic light on profiles and HOD dashboard | On |
| Referral Programme ([[03_Student-M01_Lead_Management|M01]]) | Milestone-based referral rewards for existing families | On |
| Auto-Archive Leads ([[03_Student-M01_Lead_Management|M01]]) | Auto-archive inactive leads after configurable period (default 90 days) | On |
| Cross-Branch Visibility | Staff and student visibility across branches | On when 2nd branch created |
| Google Review Funnel ([[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].B]]) | Post-survey prompt for 4-star+ parents | On |
| Multi-Subject Discount ([[06_Finance-M08_Finance_Billing|M08]]) | Frequency-based discount tiers for Secondary students | On (Secondary only) |
| Session Transfer ([[06_Finance-M08_Finance_Billing|M08]]) | Transfer session credits between siblings on the same guardian account | Off at IMI |
| Revenue Tagging ([[06_Finance-M08_Finance_Billing|M08]]) | Department bank account revenue attribution by year group | On |
| WhatsApp BSP ([[07_Operations-M13_Automation_Communications|M13]]) | WhatsApp Business API integration for automated messaging | Phase 2 |
| Zoho Books Sync ([[07_Operations-M13_Automation_Communications|M13]]) | Financial data sync with Zoho Books | Phase 2 |
| Zoho People Sync ([[07_Operations-M13_Automation_Communications|M13]]) | Staff absence sync with Zoho People | Phase 2 |
| Instagram DM Integration ([[07_Operations-M13_Automation_Communications|M13]]) | Instagram Graph API lead capture | Phase 2 |
| Parent Portal | Parent-facing login and progress view | Phase 2 |

---

# 01.12 Terminology Customisation

Tenants can rename platform labels to match their own terminology. This affects display labels only — underlying data structures, module logic, and API responses use the canonical Enrolla terms.

| **Element** | **Detail** |
|---|---|
| Rename examples | Session → Class, Lead → Enquiry, Assessment → Consultation, HOD → Department Head, Makeup → Catch-up, Concern → Flag, Ticket → Complaint, Credit → Balance |
| Scope | All display labels, PDF documents, email templates, in-app notifications, and export column headers |
| Exclusions | Navigation sidebar module names are fixed. API field names are not affected. |
| Revert | Super Admin can revert any renamed term to the platform default at any time. |

---

# 01.13 Notification Toggles

All platform-generated notifications are managed here, grouped by source module. Each notification can be toggled on or off independently. Some notifications are system-mandatory and cannot be toggled off.

| **Element** | **Detail** |
|---|---|
| Grouping | Notifications grouped by source module: [[03_Student-M01_Lead_Management|M01]], [[03_Student-M03_Assessment_Placement|M03]], [[03_Student-M04_Enrolment_Lifecycle|M04]], [[04_Academic-M05_Timetabling_Scheduling|M05]], [[04_Academic-M06_Attendance_Makeups|M06]], [[04_Academic-M06_Attendance_Makeups|[[04_Academic-M06_Attendance_Makeups|M06]].A]], [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].A]], [[04_Academic-M07_Feedback_Communications|[[04_Academic-M07_Feedback_Communications|M07]].B]], [[06_Finance-M08_Finance_Billing|M08]], [[05_People-M09_Staff_Performance|M09]], [[08_Management-M10_Management_Dashboard|M10]], [[04_Academic-M11_Academic_Courses|M11]], [[07_Operations-M13_Automation_Communications|M13]], [[04_Academic-M14_Assignment_Library|M14]], [[07_Operations-M16_Task_Management|M16]], [[04_Academic-M19_Progress_Tracking|M19]], [[04_Academic-M19_Progress_Tracking|[[04_Academic-M19_Progress_Tracking|M19]].A]] |
| Toggle granularity | Each individual notification trigger is a separate toggle. Grouping is for navigation only. |
| System-mandatory notifications | Cannot be toggled off: DPA signature confirmation, go-live confirmation, Super Admin security alerts (login from new device, password reset), billing failure alerts |
| Channel override | For each notification, the delivery channel (In-app / Email / WhatsApp) can be configured independently of the on/off toggle. |
| Role scope | Super Admin configures which roles receive each notification. Changes apply immediately. |

---

# 01.14 Consolidated IMI Defaults

| **Configuration Item** | **IMI Value** |
|---|---|
| Org name | Improve ME Institute |
| Legal name | Improve ME Institute LLC |
| Student ID format | IMI-#### (no branch code ever included) |
| Currency | AED |
| Timezone | UTC+4 (UAE) |
| Start day of week | Monday |
| Closure days | Sunday (warning only, not a block) |
| 48hr remark window | 48 hours from topic link save time |
| Overdue submission window | 7 days |
| Academic alert pattern trigger | 2 signals in 4-week window |
| Soft alert acknowledgement window | 48 hours |
| L1 resolution window | 5 school days |
| L2 resolution window | 5 school days |
| Parent contact — Primary | L2 |
| Parent contact — Secondary | L3 |
| Report cadence | Every 3 weeks (configurable per dept) |
| Report unread follow-up | 3 days, one follow-up only |
| AI narrative | On |
| CPD annual target | 20 hours |
| Staff milestones | 6 months and 1 year |
| Duplicate detection — hard block | 90% |
| Duplicate detection — soft warning | 70–89% |
| Duplicate detection — suggestion | 50–69% |
| Churn high-risk | 70 points |
| Churn medium-risk | 40 points |
| Missed sessions window | 45 days |
| Seat occupancy target | 80% |
| Low occupancy alert | 50% |
| Peak hours | 15:00–19:00 |
| Session transfer | Off |
| Parent portal | Phase 2 |

---

---

# 01.15 Vacant Role Fallback

When a staff member on leave or off-boarding holds pending approval requests, those requests are automatically re-routed to the Vacant Role Fallback. Super Admin configures the fallback chain per gateway action type. The fallback configuration is global — it is not branch-specific in v1. This section is visible to Super Admin only.

The fallback chain is an ordered list of roles (not named individuals). The system routes to the first role in the chain that has an available staff member. If no role in the chain has an available member, the request escalates to Super Admin automatically.

| Setting | Description | IMI Default |
|---|---|---|
| Fallback chain — Announcement approval | Ordered list of roles to receive re-routed announcement approval requests when the assigned approver is unavailable | Admin Head → Super Admin |
| Fallback chain — Feedback approval | Ordered list of roles to receive re-routed feedback approval requests when the assigned approver is unavailable | HOD → Admin Head → Super Admin |
| Fallback chain — Complaint sign-off | Ordered list of roles to receive re-routed complaint dual sign-off requests when the assigned approver is unavailable | Admin Head → Super Admin |
| Fallback chain — Report approval (HOD step) | Ordered list of roles to receive re-routed progress report HOD approval when the HOD is unavailable | Academic Head → Super Admin |
| Fallback chain — Report approval (Head of Subject step) | Ordered list of roles to receive re-routed progress report Head of Subject approval when the role holder is unavailable | HOD → Academic Head → Super Admin |
| Fallback chain — Off-boarding hard block sign-off | Ordered list of roles to receive re-routed off-boarding approval sign-off when the assigned approver is unavailable | Admin Head → Super Admin |
| Emergency Leave trigger | Approval re-routing activates immediately on Emergency Leave. Standard leave: re-routing activates after leave start date. | Immediate for Emergency Leave |
| Notification | When re-routing occurs, both the fallback recipient and the original approver receive an in-app notification. | Always on |

---

# 01.16 Referral Programme Reward Builder

Configures the referral reward structure for the tenant.

| Setting | Description | IMI Default |
|---|---|---|
| Referral qualifying period | Months of active enrolment the referred student must complete before the reward is confirmed | 3 months |
| Reward type | Credit to guardian account (internal ledger) | Credit |
| Reward value | AED credit amount added to the referring guardian's account | Configurable at setup |
| Claim window | Months from milestone confirmation within which the credit must be applied to an invoice | 3 months |
| Credit expiry | Months from confirmation date after which unclaimed/unapplied credit expires | 12 months |
| Expiry warning | Days before credit expiry at which a warning notification is sent to the guardian | 30 days before |

---

# [[09_Settings-M20_Tenant_Settings|[[09_Settings-M20_Tenant_Settings|M20]].A]] — Onboarding Wizard

The Enrolla Onboarding Wizard is the structured setup flow that takes a new tenant from a blank platform to a fully configured, go-live-ready state. The wizard runs once at tenant activation. It is structured as a 10-stage sequential flow. The wizard auto-detects whether the tenant is starting from scratch (Track A) or migrating from an existing system (Track B).

| **Property** | **Value** |
|---|---|
| Access | Super Admin only. Wizard is triggered at tenant activation. |
| Stage count | 10 stages. Track B adds a data import stage after Stage 10. |
| Required stages | Stages 1, 2, 3, 4, 5, 6, 10. Remaining stages are prompted but not blocking. |
| Progress counter | X/Y format. Y (denominator) decreases when features are marked Not Using. Counter reflects only relevant stages. |
| Re-entry | The wizard can be exited and re-entered at any time before go-live. Progress is saved automatically after each stage. |
| Post go-live edits | All settings configured in the wizard remain editable in [[09_Settings-M20_Tenant_Settings|M20]] at any time after go-live. The wizard is a one-time setup flow, not a locked configuration. |

## 20.A.1 Dual-Track Detection

| **Track** | **Description** |
|---|---|
| Track A — Greenfield | Standard 10-stage wizard. The tenant starts from scratch with no existing data to import. All records are created fresh within Enrolla. |
| Track B — Migration | Standard 10 stages plus an additional data import stage that appears after Stage 10. The tenant uploads existing student, staff, and invoice data before going live. Field mapping is guided by the import interface. |
| Detection trigger | At the start of the wizard session, the Super Admin is offered the option to upload import files. If files are uploaded and validated, Track B is activated. If no files are uploaded or the upload is skipped, Track A runs. |
| Track B import formats | CSV files for students, guardians, staff, and invoices. The import interface provides a field mapping screen. |
| Track B import scope | Students and guardian records, staff profiles, active and historical invoices, and historical enrolment records. |
| Validation | Import files are validated for required fields and format before proceeding. Validation errors are shown per row. The import does not proceed until all errors are resolved or flagged rows are excluded. |

## 20.A.2 Stage Overview

| **Stage** | **Title** | **Status** |
|---|---|---|
| 1 | Org & Global Rules | Required |
| 2 | Departments, Rooms & Bank Accounts | Required |
| 3 | Academic Years & Calendar | Required |
| 4 | Catalogue & Pricing | Required |
| 5 | Billing Configuration | Required |
| 6 | Staff & Roles | Required |
| 7 | Communications & Notifications | Prompted |
| 8 | Integrations | Prompted |
| 9 | Feature Toggles | Prompted |
| 10 | Review & Go Live | Required |
| Track B only | Data Import | After Stage 10 |

## 20.A.3 Stage Specifications

**Stage 1 — Org & Global Rules (Required):** Establishes core identity and operational rules. DPA is signed here and must be re-confirmed at Stage 10 before go-live. Fields: organisation name, legal name, VAT registration number, student ID format (OrgPrefix-#### — no branch code ever), default currency, timezone, default language, start day of week, weekly closure days, office hours. Student ID format locks 14 days after Go-Live — during the 14-day test window, test records do not permanently lock the format.

**Stage 2 — Departments, Rooms & Bank Accounts (Required):** Configures the operational infrastructure. Three departments are pre-configured (Primary, Lower Secondary, Senior). Each room entry contains name, capacity, branch assignment, soft cap, and hard cap. Each bank account entry contains account name, bank name, account number, IBAN, Swift/BIC code, and revenue tag (department mapping).

**Stage 3 — Academic Years & Calendar (Required):** Term dates, public holidays, and the academic year structure. This drives reporting periods and billing cadence across the platform.

**Stage 4 — Catalogue & Pricing (Required):** Subject creation, session durations, pricing rates, and trial toggle configuration. Populates the [[04_Academic-M11_Academic_Courses|M11]] catalogue. Each subject entry includes year group, department, session duration, per-session rate, and revenue tag.

**Stage 5 — Billing Configuration (Required):** Invoice formatting, payment plan rules, and discount tier configuration. All settings in section 01.3 are configured here.

**Stage 6 — Staff & Roles (Required):** Staff profiles are created or imported. Roles are assigned. The HR/Finance custom role is configured if used. Secondary role labels are assigned here. Primary role assignments are set per staff member.

**Stage 7 — Communications & Notifications (Prompted):** Template library seeding, notification toggles, and duplicate detection thresholds. Pre-built automation templates are reviewed and activated or deactivated.

**Stage 8 — Integrations (Prompted):** All Phase 2 integrations are displayed as disconnected. Super Admin can review and mark each as Later, On (when Phase 2 begins), or Off.

**Stage 9 — Feature Toggles (Prompted):** All platform features are presented in the three-state model (On / Off / Later). The toggle list mirrors section 01.11.

**Stage 10 — Review & Go Live (Required):** Summary of all configuration choices across all stages. DPA re-confirmation. Go Live button becomes active only when all required stages are complete. On Go-Live confirmation, all active staff receive an in-app notification.

## 20.A.4 Wizard UI Behaviour

| **Element** | **Detail** |
|---|---|
| Stage progress strip | Horizontal strip at the top of the wizard showing all stages. Status: Complete (tick), Current (highlighted), Pending (grey), Skipped/Not Using (strikethrough). |
| Stage navigation | Super Admin can navigate back to any completed stage at any time. Forward navigation requires the current stage to be saved. |
| Auto-save | All inputs are auto-saved when the Super Admin moves to the next stage. No manual save action required. |
| Help tooltips | Each field has a help icon that opens a tooltip explaining the field, its impact, and the IMI recommended value where applicable. |
| Required field indicators | Required fields are marked with a red asterisk. The stage cannot be saved with empty required fields. |
| Validation inline | Field validation runs inline as the Super Admin types. Errors are shown below the field immediately, not only on save. |
| Mobile support | The wizard is accessible on mobile but optimised for desktop. Stages 4 and 2 are best completed on a larger screen. |
