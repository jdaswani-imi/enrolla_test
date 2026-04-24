---
module: "M18"
title: "Guardian Profile"
layer: "Student Lifecycle"
folder: "03_Student"
status: "Draft"
phase: "v1"
dependencies: [M02, M08]
tags: [enrolla, prd, student, guardian]
---

# ENROLLA
# [[03_Student-M18_Guardian_Profile|M18]] — Guardian Profile
v1.0 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

[[03_Student-M18_Guardian_Profile|M18]] is the Guardian Profile — a full-page record for every guardian in the platform. It provides staff with a consolidated view of a guardian's linked students, combined financial status, communication history, and referral programme activity. [[03_Student-M18_Guardian_Profile|M18]] is a presentation and management layer: it owns the guardian record itself and surfaces data from [[06_Finance-M08_Finance_Billing|M08]] (finance), [[07_Operations-M13_Automation_Communications|M13]] (communications), [[03_Student-M17_Student_Profile|M17]] (students), and the referral programme. A guardian can be linked to students across multiple branches where cross-branch visibility is enabled.

| **Property** | **Value** |
|---|---|
| Module code | [[03_Student-M18_Guardian_Profile|M18]] |
| Version | v1.1 |
| Status | Current |
| Primary roles | Super Admin, Admin Head, Admin |
| Secondary roles | Academic Head, HOD, Teacher (limited) |
| Data ownership | Guardian record (contact details, consent, DNC, broadcast list membership, referral). Financial and student data owned by source modules. |
| Data sources | [[03_Student-M02_Student_Guardian_CRM|M02]], [[06_Finance-M08_Finance_Billing|M08]], [[07_Operations-M13_Automation_Communications|M13]], [[07_Operations-M16_Task_Management|M16]], [[03_Student-M17_Student_Profile|M17]], [[03_Student-M01_Lead_Management|M01]] |
| Dependencies | [[03_Student-M01_Lead_Management|M01]], [[03_Student-M02_Student_Guardian_CRM|M02]], [[06_Finance-M08_Finance_Billing|M08]], [[07_Operations-M13_Automation_Communications|M13]], [[03_Student-M17_Student_Profile|M17]], [[09_Settings-M20_Tenant_Settings|M20]] |
| Phase | v1 |

---

# 01.1 Guardian List Page

The Guardian List page displays all guardian records in the system. Each row provides enough operational context to act without opening the full profile.

## 01.1.1 List Columns

| **Column** | **Detail** |
|---|---|
| Guardian name | Full name. Click opens the guardian profile. |
| Primary phone | Primary contact number. Click to call on mobile. |
| Linked students | Count of active linked students. Shows student names on hover/tap. |
| Outstanding balance | Total outstanding invoice balance across all linked students in AED. Zero shown as AED 0.00. |
| Last contact | Date of last outbound contact across any channel (DD/MM/YYYY). |
| DNC flag | Amber DNC badge displayed on the row if guardian has an active DNC flag. |
| Unsubscribe status | Grey Unsub badge if guardian has unsubscribed from marketing. |

## 01.1.2 List Filters

| **Filter** | **Options** |
|---|---|
| Search | Full-text search across guardian name, phone, email |
| DNC status | All / DNC flagged / No DNC flag |
| Outstanding balance | All / Has outstanding balance / No outstanding balance |
| Linked students | All / 1 student / 2+ students |
| Last contact | All / Last 7 days / Last 30 days / More than 30 days ago / Never contacted |
| Unsubscribe status | All / Subscribed / Unsubscribed |
| Department | Filter by the department(s) of linked students: Primary / Lower Secondary / Senior |

---

# 01.2 Layout Structure

The Guardian Profile is a full-page view using a three-zone layout with a fixed-width sidebar that is always visible.

| **Zone** | **Description** |
|---|---|
| Profile Header | Full-width band pinned to the top. Always visible. Contains guardian identity, stats strip, DNC and unsubscribe indicators, and the Quick Action row. |
| Left Sidebar | Fixed-width panel, always visible. Contains communication status, consent records, personal details, co-parent link, broadcast list membership, and KHDA flag where applicable. |
| Main Panel | Tabbed content area. 5 tabs: Overview, Students, Invoices, Messages, Referrals. |

---

# 01.3 Profile Header

The Profile Header is always visible as the user navigates between tabs. It contains three rows: the identity row, the stats strip, and the Quick Action row.

## 01.3.1 Identity Row

| **Element** | **Detail** |
|---|---|
| Guardian photo | Uploaded photo as a circular thumbnail. Falls back to initials avatar. |
| Full name | Displayed large and prominently. Editable inline by Admin and above. |
| Relationship label | e.g. Mother, Father, Guardian. Editable inline. |
| Nationality | Displayed as a flag icon and country name. |
| DNC badge | Amber DNC pill displayed persistently when a DNC flag is active. Informational only — does not disable any action. |
| Unsubscribe badge | Grey Unsub pill displayed when guardian has unsubscribed from marketing. |
| Media opt-out badge | Grey Media Opt-Out pill displayed if guardian has opted out of media usage for their children. |
| Preferred channel | Displayed as a small icon (WhatsApp / Email). Updated automatically based on contact history and manual selection. |

## 01.3.2 Stats Strip

A horizontal row of four key stats sits below the identity row. Each stat is a labelled number. Clicking any stat navigates to the relevant tab.

| **Stat** | **Detail** |
|---|---|
| Outstanding balance | Total outstanding invoice balance across all linked students in AED. Click navigates to Invoices tab. |
| Total paid all-time | Sum of all payments received from this guardian across all linked students in AED. Click navigates to Invoices tab. |
| Linked students | Count of active linked students. Click navigates to Students tab. |
| Last contact | Days since last outbound contact across any channel. Click navigates to Messages tab. |

## 01.3.3 Quick Action Row

Four action buttons sit below the stats strip. All buttons are always active regardless of DNC status. If the guardian has a DNC flag active, initiating any contact action triggers the warning interstitial specified in AMD-01.

> **No communication channel configured:** If a guardian has no WhatsApp number and no email address on file, the Send Message quick action is available but does not proceed to message composition. Instead, the system displays an inline warning beneath the action button: 'No communication channel configured for this guardian. Add a phone number or email address to the guardian profile before sending.' The warning does not disable the button — clicking it surfaces the warning. Admin must update the guardian profile before a message can be sent.

| **Action** | **Behaviour** |
|---|---|
| Call | Pre-fills the primary phone number for a device call. Falls back to secondary phone if no primary on record. |
| WhatsApp | Opens the [[07_Operations-M13_Automation_Communications|M13]] compose screen addressed to the guardian's WhatsApp number. Always active. DNC warning interstitial displays before compose screen opens if DNC flag is active. |
| Message | Opens the [[07_Operations-M13_Automation_Communications|M13]] email composer pre-addressed to the guardian. Always active. DNC warning interstitial applies if DNC flag is active. Unsubscribe status shown as an informational indicator only. |
| New Task | Opens the [[07_Operations-M16_Task_Management|M16]] task creation form pre-linked to this guardian record. |
| Profile Update Link | Generates a personalised, time-limited (72-hour default) tokenised URL sent to the guardian via email. The guardian clicks the link and can update their own contact details (phone, email, WhatsApp, preferred channel, home district) without logging into the platform. Each link is single-use. Admin can see the status of any outstanding links (Active / Used / Expired / Invalidated) from the guardian profile. Admin can invalidate a link at any time. Full security spec: [[01_Foundation-PL04_Security_Access|PL-04]] Section 11. |

---

# 01.4 Left Sidebar

The left sidebar is fixed-width and always visible. It contains all communication status, consent, and personal metadata fields.

| **Section** | **Content** |
|---|---|
| DNC status | DNC flag active/inactive. If active: reason, set by, date set. Remove DNC button with mandatory reason field (Admin and above). Full DNC history link (permanent record). |
| Unsubscribe status | Subscribed or Unsubscribed. If unsubscribed: date, source (self-unsubscribed via link, or toggled by Admin). Re-subscribe button (Admin and above). |
| Preferred channel | WhatsApp or Email. Editable by Admin and above. Auto-updates based on contact history if not manually set. |
| Consent records | T&C acceptance: version, acceptance date and time, method (form or manual). Permanent — cannot be deleted. Data privacy consent: version, date and time. Permanent. |
| Media opt-out | Three-level opt-out status: No opt-out / Opt-out from social media only / Full opt-out (no media usage). Editable by Admin and above with logged reason. |
| Broadcast list membership | Lists the guardian is currently enrolled in (e.g. Primary Parents, Lower Secondary Parents). Shows how they were added (auto via [[07_Operations-M13_Automation_Communications|M13]] / manual). Admin can remove from any list. |
| Personal details | Full name, relationship, nationality, primary phone, secondary phone, email, home district (Dubai dropdown). Editable inline by Admin and above. |
| Co-parent link | Co-parent name with click-through to their guardian profile. Bidirectional — updating here updates the co-parent record. Add co-parent button if not yet linked. |
| KHDA flag | Displayed if any linked student is in FS1 or FS2. Indicates that this guardian must be present for all sessions for those students. Read-only — auto-set from student year group. |
| Password reset | Admin and above can trigger a password reset for this guardian's account. Action is logged with staff name and timestamp. |

---

# 01.5 DNC vs Unsubscribe

DNC (Do Not Contact) and Unsubscribe are two distinct statuses that can exist independently. Their behaviour differs significantly.

| **Attribute** | **DNC** | **Unsubscribe** |
|---|---|---|
| Who sets it | Admin and above. Mandatory reason required. | Guardian self-serves via unsubscribe link. Admin can toggle manually. |
| Effect on manual contact | Does not block contact actions. All buttons remain active. Warning interstitial displays before any contact action. Staff can proceed or cancel. All proceed actions are logged with DNC-active indicator. | No effect on manual contact actions. |
| Effect on automated messages | Suppresses all automated outbound WhatsApp and email. Invoices always send. Concern and safeguarding notifications always send. | Removes guardian from marketing broadcast lists ([[07_Operations-M13_Automation_Communications|M13]]). Does not affect transactional messages (invoices, session reminders, concern notifications). |
| Priority | DNC always overrides Unsubscribe. If both are active, DNC takes full effect. | Irrelevant when DNC is active. |
| History | Permanent. Set date, reason, set by, removal date, removal reason — all retained indefinitely. Cannot be deleted. | No permanent history requirement. |
| Removal | Admin and above. Mandatory reason required. Logged permanently. | Guardian can re-subscribe via re-subscribe link or Admin toggles manually. No reason required. |

---

# 01.6 Duplicate Detection

The system checks for potential duplicate guardian records at the point of creation using a three-tier detection model.

| **Tier** | **Behaviour** |
|---|---|
| Hard block (90%+ match) | Creation blocked. System presents the existing record side-by-side with the new entry. Admin must either use the existing record or override with a logged reason. |
| Soft warning (70–89% match) | Warning displayed. Creation can proceed. Admin reviews and selects: use existing record, merge, or create new with logged reason. |
| Suggestion (50–69% match) | Suggestion banner shown beneath the creation form. Can be dismissed. |
| Match fields | Phone number (primary and secondary), email address, full name similarity score. Phone number is the strongest signal — exact match on phone triggers hard block regardless of name. |
| Cross-branch detection | Duplicate detection checks across all branches in the organisation, not just the current branch. |

---

# 01.7 Co-Parent Link

The co-parent link connects two guardian profiles to the same student. Both linked guardians have equivalent visibility of the student's profile and communications.

**v1 — Admin-Manual Linking:**
Co-parent linking in v1 is an Admin-managed action. There is no automated dual-party portal confirmation. Admin confirms the link on behalf of both parties and logs that both parties have verbally or physically confirmed. Phase 2 will introduce automated dual-party confirmation via the parent portal.

**Initiation:**
- Admin initiates the co-parent link from either guardian's profile or from the student record.
- Guardian A (the primary guardian already linked to the student) is the main account holder. The request is made on Guardian A's behalf or at Guardian A's instruction.
- Admin provides Guardian B's name and phone number or email. The system checks for an existing guardian profile. If Guardian B does not yet have a profile, Admin creates one before linking.

**Confirmation (v1 — Admin-Manual):**
- Admin confirms the link. The confirmation is logged with Admin name, timestamp, and a note that both parties verbally or physically confirmed.
- On confirmation, Guardian B receives an email notification that they have been linked as co-parent for the student.
- No portal-based accept/decline step in v1. Admin confirmation is the sole gate.

**Status states:**
- Pending: Admin has initiated the link but not yet confirmed.
- Confirmed: Admin has confirmed. Link is active.
- Removed: Link was removed by Admin.

**Removal:**
- Admin can remove the co-parent link directly from either guardian profile. No guardian approval required.
- On removal, the removed guardian loses access to the student's profile. Both parties are notified via email.
- Removal is logged with Admin name, timestamp, and reason.

| **Attribute** | **Detail** |
|---|---|
| Bidirectional | When Guardian A is linked to Guardian B as co-parent, Guardian B's profile automatically shows Guardian A as co-parent. Both records update simultaneously. |
| Shared students | Both co-parents see the same linked students. A student linked to one co-parent is visible on both profiles. |
| Independent DNC | DNC status is per-guardian, not per-household. Guardian A being on DNC does not affect Guardian B's contact status. |
| Independent comms preferences | Each co-parent has their own preferred channel, unsubscribe status, and broadcast list memberships. |
| Multiple co-parents | Not supported. One co-parent link per guardian record. The existing link must be removed before a different co-parent can be linked. |

---

# 01.8 Overview Tab

The Overview tab is the default landing view. It surfaces the most operationally relevant cross-student summary.

## 01.8.1 Student Summary Cards

One card per linked student. Ordered by department then student name. Clicking any card opens the full student profile in [[03_Student-M17_Student_Profile|M17]].

## 01.8.2 Financial Summary

A condensed financial overview showing combined figures across all linked students.

| **Element** | **Detail** |
|---|---|
| Total outstanding | Sum of all overdue and unpaid invoice balances across all linked students in AED |
| Total credit on account | Sum of all credit balances across all linked students in AED |
| Next payment due | Earliest upcoming invoice due date across all linked students |
| Most recent payment | Date and amount of the most recent payment received from this guardian |

## 01.8.3 Recent Activity Timeline

A reverse-chronological feed of the last 15 events linked to this guardian or any of their linked students. Event types include: invoice issued, payment received, message sent, task created, student concern raised, student enrolment change, DNC flag set or removed, password reset.

---

# 01.9 Students Tab

The Students tab lists all students linked to this guardian. Cross-branch students are included where cross-branch visibility is enabled. Each student is presented as a card. Clicking a card opens the student's full profile in [[03_Student-M17_Student_Profile|M17]].

| **Element** | **Detail** |
|---|---|
| Student name | Full name displayed as card title. Click opens [[03_Student-M17_Student_Profile|M17]] student profile. |
| Year group and department | Year group label and department badge on the card. |
| Lifecycle status | Active (green), Withdrawn (red), Graduated (blue), Alumni (grey). |
| Attendance rate | Attendance rate this term as a percentage. |
| Outstanding balance | Outstanding invoice balance for this student in AED. |
| Active subjects | List of currently enrolled subjects displayed as chips. Up to 4 shown inline; remainder shown as +N more. |
| Branch indicator | If the student is at a different branch to the one currently being viewed, the branch name is shown on the card. |
| KHDA indicator | If the student is in FS1 or FS2, a KHDA badge is shown indicating guardian presence is required. |
| Churn risk | Churn risk band (Red / Amber / Green) shown as a small colour indicator. Visible to Admin and above only. |

The Students tab also shows a Link new student button for Admin and above. A student can have a maximum of two guardian records linked (primary guardian and co-parent).

---

# 01.10 Invoices Tab

The Invoices tab shows all financial records linked to this guardian, consolidated across all linked students. Invoices from all branches are included where cross-branch visibility is enabled. This tab is visible to Admin and above only.

---

# 01.11 Messages Tab

The Messages tab shows all communications sent to or received from this guardian across all channels (WhatsApp, Email, In-app). Identical to the Communication Log on [[03_Student-M17_Student_Profile|M17]] but scoped to the guardian rather than the student.

---

# 01.12 Referrals Tab

The Referrals tab on the guardian profile shows the guardian's referral history — both referrals they have made and whether they were referred by another guardian.

**Referral history table:**
| Column | Description |
|---|---|
| Referred student name | Name of the student the guardian referred |
| Referral date | Date the referred student was first enrolled |
| Status | Active (qualifying period in progress) / Milestone Reached (reward confirmed) / Credit Applied (credit used against invoice) / Credit Expired (unused credit past 1-year expiry) |
| Reward value | AED value of the referral reward |
| Credit balance remaining | How much of the referral credit is still unused |
| Claim window expiry | Date by which the credit must be claimed (3 months from milestone) |

**Referral credit balance:**
The guardian's current total referral credit balance is shown as a header card at the top of the tab. The balance is also visible on the guardian profile header.

**Applying referral credit:**
Admin can apply referral credit at invoice generation time by selecting 'Apply referral credit' in the invoice builder. The guardian chooses how much credit to apply (up to the invoice total, up to available balance). The credit balance is reduced on confirmation.

**Credit expiry:**
Referral credits expire 1 year from the date they were confirmed. A warning notification is sent at 11 months. Expired credits are shown in the history table with status Credit Expired. Expired credits cannot be reinstated.

---

# 01.13 Cross-Branch Guardian Records

A guardian record is organisation-scoped, not branch-scoped. One guardian record can be linked to students across multiple branches.

| **Attribute** | **Detail** |
|---|---|
| Record scope | Organisation-level. One guardian record per organisation, regardless of how many branches their linked students attend. |
| Branch visibility | Cross-branch guardian linking is available when cross-branch visibility is enabled for the tenant. Both settings are off by default when a second branch is created. |
| Financial consolidation | The Invoices tab shows invoices from all branches. The financial summary strip consolidates across all branches. |
| Messages consolidation | The Messages tab shows messages sent from any branch to this guardian. |
| Student cards | Student cards show a branch indicator when the student is at a different branch to the staff member currently viewing the profile. |
| Branch filter | Admin and above can filter the Students and Invoices tabs by branch where cross-branch records exist. |

---

# 01.14 Role-Based Access

Tab visibility and field edit rights on the guardian profile are governed by RBAC. Tabs the viewing user cannot access are hidden, not greyed out.

| **Role** | **Visible Sections** | **Edit Rights** |
|---|---|---|
| Super Admin | All tabs + sidebar | All fields — inline edit everywhere. Can set/remove DNC, reset password, unlink co-parent. |
| Admin Head | All tabs + sidebar | All fields — inline edit. Can set/remove DNC, reset password. Cannot edit consent records. |
| Admin | Overview, Students, Invoices, Messages, Referrals + sidebar | Personal details, preferred channel, broadcast list — inline edit. DNC and consent = view only. |
| Academic Head | Overview, Students, Messages | View only throughout. |
| HR/Finance | Overview, Students, Invoices, Referrals + sidebar | Personal details, preferred channel — inline edit. Can create and edit guardian records. Cannot set DNC or edit consent records. No access to Messages or Concerns tabs. |
| HOD | Overview (limited), Students (limited) | View only. Sees student names and attendance rate only. No financial data. |
| Teacher | Overview (limited), Students (limited) | View only. Sees student names only. No financial or contact data. |
| TA | No guardian profile access — `guardians.view` not granted to this role. Guardian nav item hidden. |

---

# 01.15 Audit and Logging

All significant actions on a guardian profile are logged permanently. The audit trail is visible to Admin Head and Super Admin from a dedicated Audit Log section accessible via the guardian profile actions menu.

| **Event** | **Log Fields** |
|---|---|
| DNC flag set | Staff name, reason, timestamp |
| DNC flag removed | Staff name, reason, timestamp |
| Contact action against DNC-flagged record | Staff name, channel, timestamp, DNC-active = true |
| Password reset triggered | Staff name, timestamp |
| Co-parent linked | Staff name, co-parent record ID, timestamp |
| Co-parent unlinked | Staff name, co-parent record ID, timestamp |
| Broadcast list membership changed | Staff name or automation name, list name, action (added/removed), timestamp |
| Media opt-out level changed | Staff name, old level, new level, reason, timestamp |
| Unsubscribe toggled by Admin | Staff name, new state, timestamp |
| Duplicate override on creation | Staff name, matched record ID, reason, timestamp |
| Personal details edited | Field name, old value, new value, staff name, timestamp |
| Referral code regenerated | Staff name, old code, new code, timestamp |

---

# 01.16 IMI Reference Configuration

| **Configuration Item** | **IMI Default** |
|---|---|
| Guardian list page | Shows: name, phone, linked students count, outstanding balance, last contact, DNC badge, unsubscribe badge |
| Stats strip | Outstanding balance + total paid all-time + linked students count + last contact |
| Quick actions | Call, WhatsApp, Message, New Task |
| Sidebar | Fixed width, always visible |
| DNC behaviour | Warning interstitial on manual contact. Automated messages suppressed. |
| Duplicate detection — hard block | 90% similarity score (configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Duplicate detection — soft warning | 70–89% similarity score (configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Duplicate detection — suggestion | 50–69% similarity score (configurable in [[09_Settings-M20_Tenant_Settings|M20]]) |
| Cross-branch linking | Both toggles off by default when second branch is created |
| Co-parent links | Maximum 1 per guardian record |
| KHDA flag | Auto-set for FS1 and FS2 year groups. Read-only. |
| Referral programme | Active at IMI. Code auto-assigned on guardian creation. Reward structure configured in [[09_Settings-M20_Tenant_Settings|M20]]. |
| Consent records | T&C and data privacy consent: permanent, cannot be deleted |
| Audit trail retention | Permanent |
