# ENROLLA
# M01 — Lead Management
v1.1 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

Lead Management captures every prospective student enquiry, tracks it through a structured pipeline, and ensures no lead is lost. Leads are never deleted — only archived. The module replaces ClickUp for pipeline tracking and Zoho Forms for lead capture.

| **Property** | **Value** |
|---|---|
| Module code | M01 |
| Version | v1.1 |
| Status | Current |
| Replaces | ClickUp (pipeline), Zoho Forms (capture) |
| Primary users | Admin, Admin Head |
| Secondary users | Academic Head (view, pipeline up to Schedule Confirmed), HOD (view, pipeline up to Schedule Confirmed), Teacher (view + team chat), TA (view + team chat), HR/Finance (view + full pipeline) |
| Key rule | Leads are never deleted. Terminal statuses: Won, Lost, Archived. |
| Toggleable | No — Lead Management is always active |
| Dependencies | PL-01, PL-02, M02, M20 |
| Phase | v1 |

---

# 01.1 Lead Capture

Leads enter Enrolla through multiple channels. Each lead record is created automatically or manually depending on the source. Every source is tagged on the lead record for reporting and attribution.

| **Source Channel** | **Creation Method** | **Notes** |
|---|---|---|
| Website enquiry form | Auto — system creates lead on submission | Embedded or hosted form. Source tag applied automatically. Honeypot field discards spam silently. |
| Phone call | Manual — Admin creates lead during or after call | Admin uses inline lead creation from any module. No form submission required. |
| Walk-in | Manual — Admin creates lead at front desk | Same inline creation flow. Source tagged as Walk-in. |
| WhatsApp inbound | **Phase 2** — BSP webhook auto-creates lead on inbound message. Not active in v1. | v1 fallback: Admin manually creates the lead when an inbound WhatsApp message is received. No automation in v1. |
| Instagram DM | **Phase 2** — Instagram Graph API auto-creates lead on inbound DM. Not active in v1. | v1 fallback: Admin manually creates the lead when an inbound Instagram DM is received. No automation in v1. |
| Referral | Manual — Admin creates lead and tags referral source | Referral source links to existing student, guardian, or external partner record. Referral programme rewards tracked against referring guardian (M18). |
| Event lead | Auto or Manual — depends on event registration method | Tagged with event origin. Follows standard pipeline after capture. |

## 01.1.1 Lead Reference Number

Every lead is assigned a system-generated unique reference number at creation. The format (prefix, separator, sequential length) is configurable per tenant in M20 during onboarding. On conversion to a student, the lead reference number is linked to the new Student ID but does not become it. The lead reference is retained permanently and visible from the student profile as lead history.

## 01.1.2 Inline Lead Creation

Admin can create a new lead from within any module without navigating to M01. An Add Lead action is available in the global navigation bar and from contextual menus throughout the platform.

Inline creation opens a compact slide-out panel with minimum required fields: child name, year group, subject interest, guardian name, phone number, source channel. On save, the lead is created in M01 and Admin can optionally navigate to the full lead record. Available to all roles with lead creation permission (Admin, Admin Head, Super Admin). Academic Head, HOD, Teacher, TA, and HR/Finance can view leads but cannot create them.

## 01.1.3 Enquiry Form Field Specification

The built-in Enrolla enquiry form uses progressive conditional logic so parents only see fields relevant to their child's year group and qualification.

| **Field** | **Specification** |
|---|---|
| Student first name | Text input. Required. |
| Student last name | Text input. Required. |
| Student preferred name | Text input. Optional. Used in day-to-day communications if different from legal name. |
| Year group | Dropdown. Required. Options: FS1/Nursery through Year 13/Grade 12. Dual British/American naming throughout. |
| School name | Structured searchable dropdown. Required. 130+ UAE schools pre-loaded. Special entries: Home Schooling, Online School. 'Add Other' option allows free-text entry; the typed name is stored as free text and submitted as a suggestion for the school directory. |
| Subject(s) interested in | Multi-select. Required (at least one). Dynamically filtered by the selected year group — subjects shown are conditional on year group selection. Four conditional lists: Primary (FS1–Y6), Lower Secondary (Y7–Y9), Upper Secondary (Y10–Y13 non-IB), IB DP (with HL/SL variants). Stored as structured catalogue references — not free text. |
| Nationality | Dropdown. Optional. Full country dropdown. |
| Home area / district | Dropdown. Optional. Pre-defined Dubai districts dropdown. |
| Parent/guardian first name | Text input. Required. |
| Parent/guardian last name | Text input. Required. |
| Phone number | Tel input. Required. UAE country code pre-selected. Format validated. WhatsApp availability checked via API on submission. |
| Email address | Email input. Required. Validated on submission. |
| How did you hear about us? | Dropdown. Required. Options: Search Engine, AI Search, Social Media, Email, Friend/Colleague, Referral (Parent), Referral (Business), Returning Parent/Student, Homeschool UAE Group. |
| Who referred you? | Conditional — appears only when source channel is "Referral Parent". Does not appear for other referral or non-referral source selections. Searches against existing guardian and student records for match-linking. |
| Honeypot field | Hidden from users. If populated, submission is silently discarded as spam. |

## 01.1.4 Multi-Child Enquiry

A parent can add details for multiple children on a single form submission. On submission, the system creates one lead per child, all linked to the same guardian record. Each lead progresses independently through the pipeline. A sibling group banner is applied automatically to all linked leads.

---

# 01.2 Lead Pipeline

Each lead progresses through a defined set of stages. All stages are skippable — Admin can move a lead to any stage at any time. Assessment and Trial are both optional. Feedback at Assessment Done and Trial Done is optional and never blocks forward progression.

**Lead pipeline role tiers** — pipeline advancement is role-gated past Schedule Confirmed:

| **Tier** | **Roles** | **Pipeline authority** |
|---|---|---|
| Tier 1a | Super Admin, Admin Head | Full pipeline — all stages including Invoice Sent, Record Payment, Won, Lost, Convert to Student |
| Tier 1b | HR/Finance | Full pipeline past Schedule Confirmed — Send Invoice, Record Payment, Convert to Student |
| Tier 2a | Academic Head, HOD | View all stages, advance up to and including Schedule Confirmed. Cannot send invoice, record payment, or convert to student |
| Tier 2b | Admin | Full pipeline |
| Tier 3 | Teacher, TA | View all stages and team chat only. Cannot advance past Schedule Confirmed. A banner in the lead footer reads: "To proceed to invoicing, please speak to Admin or Admin Head." Cannot convert a lead to a student. |

Team chat is unrestricted at all stages for all tiers.

| **Stage** | **Description** |
|---|---|
| New | Lead created — enquiry received via any source channel |
| Contacted | Admin has made first contact with the parent |
| Assessment Booked | Assessment appointment scheduled. Optional — skippable if no assessment required. |
| Assessment Done | Assessment completed. Optional feedback captured — never blocks progression. |
| Trial Booked | Trial session scheduled. Optional — only if parent requests a trial. |
| Trial Done | Trial session completed. Optional feedback captured — never blocks progression. |
| Schedule Offered | Admin has proposed a session schedule to the parent |
| Schedule Confirmed | Parent has confirmed the proposed schedule |
| Invoice Sent | Invoice issued to parent |
| Paid | Invoice settled. Payment confirmed. |
| Won | Lead successfully converted to enrolled student. Terminal status. |

## 01.2.1 Terminal Statuses

In addition to Won, the following terminal statuses are available at any pipeline stage.

| **Status** | **Description** |
|---|---|
| Lost | Lead did not convert. Reason logged. Record retained permanently. |
| Archived — DNC | Parent has been marked Do Not Contact. All marketing outreach blocked. |
| Archived — Disgruntled | Parent had a negative experience. Admin notes required. Record retained. |
| Archived — Auto-Inactive | No activity for the tenant-configurable auto-archive period. System archives automatically after a warning notification to assigned Admin. |

**Inactive defined:** A lead is considered inactive when no pipeline stage change has occurred AND no activity log entry (note, task, call, visit, or message) has been recorded against it for the configured number of days. Either action resets the inactivity clock. A lead is not considered inactive solely because the guardian has not responded — the clock resets on any staff-initiated activity.

**Activity that resets the inactivity clock:** (1) Admin logs an outbound contact attempt on the lead record; (2) The guardian responds to any communication (email, WhatsApp, in-person — Admin logs it); (3) Assessment booked; (4) Trial booked. Passive events such as viewing the lead record in Enrolla do not count as activity and do not reset the clock.

Archived leads are never deleted. They can be unarchived by Admin with a logged reason. DNC always overrides Unsubscribe — if both are set, DNC takes full effect. Lost leads remain searchable and reportable for pipeline analysis.

## 01.2.2 Stage Message Prompts

When Admin moves a lead to a new pipeline stage that has a message template configured, a prompt badge appears on the lead card indicating a stage message is available to send. Nothing auto-sends — Admin triggers all messages manually.

For time-sensitive stages (Assessment Booked, Trial Booked), an in-app reminder notification fires if no message has been sent within 2 hours of the stage change. The prompt clears once the stage message has been sent. Stage messages are sent via the parent's preferred channel (WhatsApp primary, Email secondary). Templates for each stage are configured in M20 Tenant Settings.

---

# 01.3 Lead Views and Filtering

The Lead Management module provides three views for working with the pipeline.

| **View** | **Description** |
|---|---|
| Kanban | Leads displayed as cards organised in columns by pipeline stage. Default view. Cards show child name, year group, subject, source channel, last activity date, and assigned Admin. Drag-and-drop stage progression. |
| List | All leads in a flat sortable and filterable list. Useful for bulk actions and exports. |
| Table | Compact data-dense view. All lead fields visible as columns. Sortable by any column. |

## 01.3.1 Filtering and Search

Global search bar searches across all lead fields simultaneously. Filter by: pipeline stage, source channel, assigned Admin, year group, subject, school, date range (created, last activity), department. Saved filter sets allow Admin to save frequently used filter combinations and name them for reuse. My Leads toggle filters to show only leads assigned to the logged-in user.

---

# 01.4 Lead Ownership and Assignment

Each lead is assigned to a specific staff member. Assignment determines who receives notifications and appears as the primary contact for that lead. Default assignment is the Admin who created the lead. Admin Head can reassign any lead at any time. Unassigned leads are visible to all Admins and Admin Head.

## 01.4.1 Staff Groups

Admin Head can create named staff groups for lead distribution (e.g. Front Office Team). A lead can be assigned to a group rather than an individual. Any member of the group can claim and action the lead. Group membership is managed in M09.

## 01.4.2 Lead Sharing

Any lead can be shared with additional staff members for visibility. Shared staff receive notifications but the assigned owner retains primary responsibility. Sharing is logged on the lead activity log.

## 01.4.3 Fallback Chain

If an assigned Admin does not action a lead within a configurable time threshold, the system escalates the lead to the next person in the fallback chain. The fallback chain is configured per tenant in M20.

| **Property** | **Value** |
|---|---|
| Default fallback | Admin Head |
| Escalation logging | Logged on the lead activity log |
| Notifications | Both original assignee and fallback recipient receive an in-app notification on escalation |
| Maximum fallback | Admin Head is always the final fallback. The chain cannot escalate beyond Admin Head. |

---

# 01.5 Duplicate Detection and Sibling Handling

## 01.5.1 Duplicate Detection

On lead creation, the system checks for potential duplicates based on: guardian phone number, guardian email, and child name plus year group combination. Detected duplicates surface a warning with links to the existing record. Admin chooses whether to proceed with a new lead, merge with the existing record, or dismiss the warning.

## 01.5.2 Sibling Group Detection

Sibling detection runs automatically when a lead is created. The system detects siblings via: same guardian phone number as an existing lead or student record; same guardian email address as an existing lead or student record; or parent explicitly identifying a sibling on the enquiry form.

When siblings are detected, a sibling group banner is displayed on each linked lead and student record showing all sibling names, year groups, and pipeline stages. Admin can navigate between sibling records from any lead card. Admin can manually link or unlink any two leads or students as siblings at any time. Sibling links are used for discount eligibility, consolidated communications, and family-level reporting.

## 01.5.3 Co-Parent Detection

If a lead shares a guardian email or phone with an existing guardian record where a co-parent link exists, the system flags the potential co-parent relationship for Admin to confirm. See M02 for full co-parent linking rules.

---

# 01.6 Lead Activity Log

Every lead record maintains a chronological activity log that is permanently retained. The activity log records: stage changes (timestamp and staff member); outbound messages sent (channel, template, timestamp); inbound messages received (channel, content summary, timestamp); assessment bookings and outcomes; trial class bookings and outcomes; notes added by staff (free text, timestamped, attributed); file attachments (file name, uploaded by, timestamp); assignment changes (new assignee, reassigned by, timestamp); fallback escalations; automated system events (auto-archive warnings, booking link sends, auto-responses); and duplicate and sibling detection events.

The activity log is visible to all staff with access to the lead record. It cannot be edited or deleted.

---

# 01.7 Referral Tracking and Programme

## 01.7.1 Referral Recording

When a lead is created with a referral source, the system links the referring party (existing student, guardian, or external partner) to the new lead. The link is confirmed when the lead converts to a student. Referral data feeds into the Referral Programme tracked on the guardian profile (M18).

## 01.7.2 Referral Programme

Tenants can configure a tiered referral reward programme in M20. Rewards are triggered when a referred lead converts to an enrolled student.

| **Property** | **Value** |
|---|---|
| Reward types | Fixed credit applied to the referring guardian's next invoice; percentage discount (one-time or recurring); gift or voucher (logged manually by Admin); custom reward (free text) |
| Milestone tiers | Configurable by tenant (e.g. Tier 1 at 1 referral, Tier 2 at 3 referrals, Tier 3 at 5 referrals) |
| On milestone reached | Admin and the referring guardian are notified simultaneously (Admin: in-app; Guardian: WhatsApp/email). Credit rewards are added to the referring guardian's credit balance in M18. Other reward types require Admin to fulfil manually. |
| History | Full referral history tracked on the referring guardian's profile in M18 |
| Phase 2 | Referring guardian will see their own referral count, tier, and available credit directly via the parent portal |

**Referral Reward Redemption Flow:**
1. The referred student must maintain active enrolment for 3 months (the qualifying period) from their first term invoice.
2. On reaching the qualifying period, the system confirms the milestone and adds the configured credit amount to the referring guardian's credit balance in M18.
3. The referring guardian is notified (in-app + email).
4. The credit balance must be claimed within 3 months of being confirmed (claim window). If not applied within 3 months, the credit is marked Unclaimed and Admin is notified.
5. Applied credit expires 1 year from confirmation date if not used against an invoice. Guardian is warned at 11 months.
6. At invoice generation time, the guardian (or Admin on their behalf) can choose to apply available referral credit. The guardian selects how much credit to apply (up to the invoice total, and up to the available credit balance).
7. Expired credit cannot be reinstated.

---

# 01.8 Lead-to-Student Conversion

Conversion is triggered when a lead reaches the Paid stage. The Paid = Won rule is atomic — recording payment creates the student record in a single transaction. Conversion can be initiated by Tier 1a, 1b, and 2b roles only (Super Admin, Admin Head, HR/Finance, Admin). Academic Head and HOD (Tier 2a) can advance the pipeline to Schedule Confirmed but cannot trigger conversion. Teacher and TA (Tier 3) cannot convert a lead to a student under any circumstance.

| **Step** | **Action** |
|---|---|
| 1 | Admin clicks Convert to Student from the lead record |
| 2 | System pre-populates the student enrolment form (M02) with all data captured during the lead journey: child details, guardian details, year group, school, subjects, assessment outcome, trial outcome, referral source, sibling links |
| 3 | Admin reviews the pre-populated form, completes any missing mandatory fields, and confirms |
| 4 | Student record is created in M02. Department is auto-assigned based on year group mapping configured in M20. |
| 5 | Lead status is set to Won (terminal). The lead record is retained permanently and linked to the new Student ID. |
| 6 | Full activity log from the lead is carried forward into the student's cumulative record in M02 |
| 7 | Assessment results, trial class outcome, referral source, and sibling links are all transferred to the student record |

The lead reference number is linked to the Student ID but does not become it. Both identifiers remain on record. If a student is converted from a lead that has a pending referral link, the referral is confirmed and the reward milestone logic runs immediately.

---

# 01.9 Auto-Response and Lead Automation

Auto-responses on lead creation are the only messages that send without Admin action. All other stage messages require Admin to manually trigger them using system-provided templates.

## 01.9.1 Auto-Response on Lead Creation

| **Source** | **Auto-Response Behaviour** |
|---|---|
| Website form | Auto-send WhatsApp or email: confirmation of enquiry receipt with a configurable response time promise. Channel determined by parent's provided contact details. |
| WhatsApp inbound | **Phase 2** — Auto-reply via BSP not available in v1. Admin manually contacts the guardian after creating the lead. |
| Instagram DM | **Phase 2** — Auto-reply via Instagram Graph API not available in v1. Admin manually contacts the guardian after creating the lead. |
| Phone / Walk-in | No auto-response. Admin is already in direct contact. |
| Event lead | Auto-send event-specific welcome template via WhatsApp or email. |
| Referral | Auto-send referral acknowledgement template if configured. Optional — off by default. |

All auto-response templates are managed in M20 Tenant Settings. Merge fields available: [child name], [subject], [parent name], [source], [tenant name], [response time promise]. WhatsApp delivery failure on auto-response triggers one automatic retry. If still rejected, Admin is notified in-app with a delivery failure flag.

## 01.9.2 Assessment Booking Reminders

If the assessment booking link is not used within a configurable period, automated reminders are sent. The default reminder sequence is Reminder 1 at 48 hours and Reminder 2 at 5 days. Number of reminders and intervals are configurable per tenant in M20. Reminders stop automatically on booking or stage change. After all reminders are exhausted with no booking, Admin receives an in-app notification to follow up personally.

---

# 01.9b Invoice-to-Lead Pipeline Auto-Update

When an invoice is issued or payment recorded from the finance dashboard (`/finance/invoice/new` or the invoice detail view), and the invoice is linked to a lead via a `leadId` field, the lead pipeline stage updates automatically:

| **Finance action** | **Lead pipeline result** |
|---|---|
| Invoice issued (status = Issued) | Lead stage → Invoice Sent. Activity log entry created. |
| Payment recorded (status = Paid, amount ≥ total) | Lead stage → Paid. Atomic Won conversion fires — student record created, `converted_student_id` set, activity log entries written. |

This mirrors the behaviour when payment is recorded from inside the lead record directly. The `leadId` field on the invoice record enables this link. In the standalone invoice builder, Admin can optionally search and link an active lead at the time of invoice creation.

---

# 01.10 DNC and Communication Rules

DNC (Do Not Contact) flag on a lead or guardian blocks all outbound WhatsApp and email marketing immediately. DNC is set by Admin on the lead or guardian profile with a mandatory reason. DNC always overrides Unsubscribe — if both are set, DNC takes full effect.

| **Property** | **Value** |
|---|---|
| On DNC set | All assigned staff on the lead receive an in-app notification |
| Auto-archive | DNC-flagged leads are automatically archived with archive reason set to DNC |
| Visibility | DNC flag is visible as a prominent warning on the lead card and lead profile at all times |
| DNC history | Permanent — flag, set date, reason, set by, removal date, and removal reason are all retained on the record indefinitely |
| Interstitial | DNC is a warning interstitial when staff attempt to contact — not a hard block on action. All contact buttons remain active. |

---

# 01.11 Lead Reporting and Dashboard Integration

Lead pipeline data feeds into M10 (Management Dashboard) and M09 (Staff Performance). The following lead-level metrics are available.

| **Metric** | **Description** |
|---|---|
| Total leads by stage | Count of leads at each pipeline stage. Filterable by date range, source, year group, department, subject. |
| Lead conversion rate | Percentage of leads that reach Won status. Tracked overall and per source channel. |
| Average time to conversion | Mean number of days from lead creation to Won status |
| Drop-off funnel | Per-stage drop-off rate showing where leads exit the pipeline. Visible overall and per Admin staff member (M09 performance metrics). |
| Source attribution | Lead volume and conversion rate by source channel. Used for marketing ROI analysis. |
| Referral performance | Count of referral leads, conversion rate, and reward milestones triggered |
| Booking link performance | Assessment booking link: sent vs booked vs expired. Tracks self-service uptake. |
| Active leads by department | Lead volume filtered by the year group's mapped department. Useful for capacity planning. |

---

# 01.12 IMI Reference Configuration

| **Setting** | **IMI Value** |
|---|---|
| Auto-archive period | 90 days of inactivity |
| Assessment booking reminder sequence | Reminder 1 at 48 hours, Reminder 2 at 5 days |
| Stage message prompt window | 2 hours for time-sensitive stages (Assessment Booked, Trial Booked) |
| Fallback chain | Assigned Admin → Admin Head |
| Referral programme | Active. Reward type: invoice credit. Milestone tiers configured per IMI referral programme. |
| Instagram DM capture | Off by default — toggle in M20 to enable |
| Primary comms channel | WhatsApp via BSP |
| Secondary comms channel | Email |
