# ENROLLA
# PL-02 — RBAC & Approval Gateway
v3.3 | Confidential
Improve ME Institute (IMI) · Gold & Diamond Park, Dubai

---

## Module Overview

This document defines the role-based access control (RBAC) model for Enrolla, covering all 12 platform roles, secondary role labels, the Developer role, and the approval gateway system that governs high-impact actions. PL-02.A correction (manual credit) is folded into Section 8.

Parent and Student roles are enumerated in the system schema in v1 but no login access, portal, or session can be provisioned for these roles until Phase 2 is activated.

| **Property** | **Value** |
|---|---|
| Module code | PL-02 |
| Version | v4.0 |
| Status | Current |
| Dependencies | PL-01 |
| Phase | v1 |

> **v4.0 note:** All RBAC amendments from April 2026 sessions are folded into this document. The separate RBAC_AMD file is retired — this is the single authoritative RBAC reference.

---

# 1. Role Architecture

Enrolla operates a 12-role RBAC model. Roles are assigned per staff member and determine which data, actions, and modules are accessible. Inaccessible navigation items are hidden, not greyed out. Every staff member holds one primary role and can hold any number of secondary role labels — see Section 3.

| **Role** | **Scope** |
|---|---|
| Super Admin | Full platform access. Org-level. Cannot be restricted. |
| Admin Head | Senior operational authority. Branch-level. Approves high-impact actions. |
| Admin | Day-to-day operational access. Branch-level. |
| Academic Head | Academic strategy and oversight across all departments. |
| HOD (Head of Department) | Departmental academic authority. Scoped to assigned department. |
| Head of Subject | Subject-level academic lead. Scoped to assigned subject(s). |
| Teacher | Session delivery and student progress. Scoped to own classes. |
| TA (Teaching Assistant) | Read access to assigned classes. Limited operational actions. |
| HR / Finance | Salary, staff profiles, documents, finance exports. Custom role — see Section 2.9. |
| Developer | Full platform access. Excluded from all routing, approval chains, and notifications. See Section 2.10. |
| Student | Own profile and academic data only. |
| Parent | Linked student data only. Phase 2 — not active in v1. |
| Custom | Tenant-configurable. Any combination of permissions. See Section 7. |

---

# 2. Role Definitions

## 2.1 Super Admin

Super Admin is the platform owner role for a tenant. There is one Super Admin per Organisation, provisioned by the Enrolla platform admin team during onboarding.

| **Property** | **Value** |
|---|---|
| Data scope | All branches, all departments, all records |
| Module access | All modules, all settings |
| Approval authority | All gateway actions |
| Cannot be restricted | No permission can be removed from Super Admin |
| Unique actions | Delete tenant data, manage billing subscription, access platform audit log, configure all M20 settings, assign and change all staff roles |

## 2.2 Admin Head

Admin Head is the senior operational manager at branch level. They approve high-impact actions and have broad read and write access across all operational areas.

| **Property** | **Value** |
|---|---|
| Data scope | All departments within their branch |
| Approval authority | Discounts, fee waivers, refunds (all types — 2nd stage in 3-stage chain), enrolment fee waivers, session transfers between siblings, off-boarding sign-off (optional) |
| Excluded from | Salary and shift data (HR/Finance only), cross-tenant actions, subscription management |
| Unique actions | Activate Emergency Leave, approve org-wide message templates, add Marketing Moments to What's On, override individual makeup allowance per student |

## 2.3 Admin

Admin is the primary operational role for day-to-day platform use. Admin performs most data entry, scheduling, invoicing, and communication tasks.

| **Property** | **Value** |
|---|---|
| Data scope | All departments within their branch |
| Actions without approval | Create and edit student records, schedule sessions, create invoices, issue manual credit (with logged reason), mark attendance (on or after session day), create and edit leads, manage waitlists, create tasks |
| Actions requiring approval | Discounts (Admin Head), refunds — all types follow 3-stage chain (Admin initiates → Admin Head approves → Super Admin approves), fee waivers — see Section 6 |
| Cannot access | Salary and shift data, subscription settings, audit log configuration |

## 2.4 Academic Head

Academic Head has strategic oversight of academic operations across all departments. They have broad read access across student, guardian, enrolment, leads, and academic data, and authority over academic concerns and escalations.

| **Property** | **Value** |
|---|---|
| Data scope | All departments |
| Actions | View all student and guardian records (read only), view enrolments (read only), view leads (read only), manage and dismiss L2+ concerns, approve progress reports (if configured), generate and schedule academic reports (financial report types excluded — see `reports.viewFinancial`), set academic thresholds in M20 |
| Cannot access | Financial records, HR/salary data, invoice creation, lead pipeline advancement past Schedule Confirmed |
| Lead pipeline tier | Tier 2a — can view all stages and advance up to Schedule Confirmed. Cannot send invoice, record payment, or convert to student. A banner prompts Tier 3 roles to speak to Admin to proceed. |

## 2.5 HOD (Head of Department)

HOD is the academic lead for one department. They oversee teachers and students within their department.

| **Property** | **Value** |
|---|---|
| Data scope | Assigned department only |
| Actions | View leads (read only), view People directory and create segments, approve progress reports, dismiss L2+ concerns (with logged reason), approve makeups exceeding allowance, approve announcements, manage per-class feedback templates, generate and schedule academic reports (financial report types excluded — see `reports.viewFinancial`), view CPD completion summary for staff in their department (detail log restricted — see `staff.viewCPDDetail`) |
| Lead pipeline tier | Tier 2a — same as Academic Head. Can view all stages and advance up to Schedule Confirmed. Cannot send invoice, record payment, or convert to student. |

## 2.6 Head of Subject

Head of Subject is a subject-level academic lead, introduced in v1.3. They sit between HOD and Teacher in the academic hierarchy.

| **Property** | **Value** |
|---|---|
| Data scope | Assigned subject(s) only |
| Actions | Review and approve subject-level reports (if configured), view subject-level progress data, flag concerns to HOD |
| Cannot access | Department-wide data, financial records, operational admin functions |

## 2.7 Teacher

Teacher is the primary session delivery role. Teachers interact with their own classes and students only.

| **Property** | **Value** |
|---|---|
| Data scope | Own assigned classes and students |
| Actions | Mark attendance, submit assignments, enter assessment outcomes, draft feedback, generate and submit progress report drafts, participate in class discussion, view leads (read only), view enrolments (read only), view and create tasks (all tasks, not scoped to own only) |
| Cannot access | Financial data, invoice creation, lead pipeline advancement past Schedule Confirmed, student personal details beyond name and year group |
| Lead pipeline tier | Tier 3 — can view all lead stages and team chat. Cannot advance beyond Schedule Confirmed. A banner prompts them to speak to Admin to proceed. Cannot convert a lead to a student. |

## 2.8 TA (Teaching Assistant)

TA has read access to assigned classes and limited operational actions to assist the Teacher.

| **Property** | **Value** |
|---|---|
| Data scope | Assigned classes only, with platform-wide visibility on tasks and inventory |
| Actions | View session register (own assigned sessions), view assignment records and scores for students in assigned sessions, view per-class feedback (read-only), view progress tracker for assigned students (read-only), enter assessment outcomes (`assessments.enterOutcome`), view and create tasks (all tasks, not scoped to own only), view inventory and perform stock takes, view enrolments (read only), view leads (read only), use published org-wide message templates for manual copy-paste communications |
| Cannot access | Mark or edit attendance records, submit feedback, generate or approve reports, access financial data, view student personal details beyond name and year group, advance the lead pipeline past Schedule Confirmed, convert a lead to a student |
| Lead pipeline tier | Tier 3 — same as Teacher. View and chat only beyond Schedule Confirmed. |

## 2.9 HR / Finance (Custom Role)

HR/Finance is a pre-configured custom role at IMI. It is not a default platform role — it is set up as a custom role in M20 during onboarding.

| **Property** | **Value** |
|---|---|
| Permissions | Salary view, staff profile view, document management, bulk invoice export, finance dashboard, Immediate Access Revocation |
| Invoice authority | Full authority to issue, edit, and void invoices for any student |
| Discount and credit authority | Full authority to apply discounts and credits |
| Refund authority | Access to all refund types — all refunds follow the standard 3-stage approval chain (Admin initiates → Admin Head approves → Super Admin approves) |
| CPD log verification | Can view all staff CPD logs (read-only). Can mark individual CPD log entries as Verified or Queried. Queried status auto-creates a task assigned to the staff member. |
| Approval authority | Initiate staff off-boarding, Immediate Access Revocation |
| Module access | Students (read only), Guardians (full create/edit), Leads (view all stages + pipeline advance past Schedule Confirmed), Enrolment (export only), Timetable (view only — no session creation, editing, or cancellation), Attendance (view only — no marking or correction), Finance (full), Staff (full HR authority), Analytics (full including Staff Performance tab), Reports (full including financial report types), Tasks (full), Inventory (view + stock take), People directory (view + export) |
| Cannot access | Student academic edit functions, session scheduling actions, attendance marking, generating or approving academic progress reports |
| IMI note | Pre-configured at setup. Role name and permissions are tenant-configurable. |

## 2.10 Developer

Developer is a platform-wide access role designed for technical staff building and maintaining the application. It grants full data and operational access but is completely excluded from all approval routing, notification delivery, and escalation chains.

| **Property** | **Value** |
|---|---|
| Data scope | Full — all modules, all branches, all records |
| Read access | Full — identical to Super Admin |
| Write access | Full — can create, edit, and action anything in the platform |
| Approval gateway | Can manually action any gateway item when navigating to it directly. Never receives routed requests. Never appears as an approver in any chain or fallback. |
| Notifications | None — zero system notifications of any kind |
| Routing | Excluded from all routing chains, fallback chains, and escalation paths |
| Audit log | All actions permanently logged |
| Role assignment | Super Admin only |
| Cap | No cap — any number of staff members can hold the Developer role |

The Developer role exists because technical staff require unrestricted platform access to build and test workflows end-to-end. Excluding them from the notification and routing system ensures they never receive or block operational approvals, and that nothing in the live approval chain depends on a Developer user being present or responsive.

## 2.11 Student

Student has access to their own profile, academic records, and assigned work only.

| **Property** | **Value** |
|---|---|
| Data scope | Own record only |
| Actions | View own assignments, submit work, view own progress data, participate in class discussion |
| Phase 2 | Student portal is Phase 2. In v1, student-facing features are accessible via staff-mediated views. |

## 2.12 Parent

Parent is linked to one or more student records and has read access to their child's data. The Parent role is Phase 2 — not active in v1.

---

# 3. Secondary Role Labels

Any staff member can hold one primary role and any number of secondary role labels. Secondary role labels allow a staff member to absorb the responsibilities, permissions, and routing of additional roles — enabling small teams to operate without gaps in the approval chain or notification coverage.

## 3.1 How Secondary Labels Work

| **Property** | **Value** |
|---|---|
| Assignment | Super Admin only can assign or remove secondary role labels |
| Effect on permissions | Secondary labels add permissions. They never restrict. The staff member always operates at the highest scope their combined roles grant. |
| Effect on routing | The staff member appears as a valid approver and notification recipient for all roles they hold, primary and secondary. |
| Effect on scope | If the primary role has a narrower scope than the secondary label, the secondary label expands the scope for those duties only. It does not grant full elevated scope across the board. |
| Cap | No cap — a staff member can hold any number of secondary labels. |
| Notification on assignment | The staff member receives an in-platform notification when a secondary label is added or removed, stating the label and the Super Admin who made the change. |

## 3.2 Scope Expansion Rule

Labels add permissions up — they never restrict down.

| **Scenario** | **Result** |
|---|---|
| Super Admin carries HOD — Primary as a secondary label | Keeps full Super Admin scope. Also receives HOD routing and notifications for Primary. HOD duties are fulfilled by this person for system routing purposes. |
| Admin carries Admin Head as a secondary label | Gains Admin Head approval authority and receives Admin Head notifications. Scope expands to cover Admin Head duties. Does not gain Super Admin permissions. |
| Admin carries HOD — Primary and Admin Head as secondary labels | Gains both sets of permissions and routing. Operates as Admin + Admin Head + HOD for all system purposes. |
| Teacher carries HOD — Senior as a secondary label | Gains HOD permissions for Senior department. Scope expands for HOD duties only — does not gain Admin access. |

## 3.3 Practical Use Cases

Secondary labels exist to handle real-world team structures where dedicated role holders are not present.

| **Team Structure** | **Solution** |
|---|---|
| Small tenant with only Super Admin, Admin, and Teachers | Super Admin carries Admin Head + Academic Head + HOD labels. Admin carries Admin Head label. All approval chains remain functional. |
| Department without a named HOD | Academic Head carries HOD — [Department] label. HOD routing resolves to Academic Head automatically. |
| Admin Head on extended leave without a cover | Another Admin carries Admin Head label temporarily. Gateway requests route correctly during absence. |

---

# 4. Permission Boundaries Summary

The following table summarises the most critical permission boundaries across the 12 roles. This is not an exhaustive permission matrix — full module-level access is defined within each module document.

| **Action** | **Minimum Role Required** |
|---|---|
| View salary and shift data | HR/Finance or Super Admin |
| Approve discounts | Admin Head (or HR/Finance — HR/Finance applies discounts under full authority; no Admin Head approval required. Admin Head is notified immediately in all cases.) |
| Approve refund (all types) | 3-stage chain: Admin initiates → Admin Head approves → Super Admin approves |
| Approve fee waiver (trial, session, enrolment) | Admin (no prior approval required — logged reason mandatory) |
| Approve fee-exempt student toggle | Admin (no prior approval required — logged reason mandatory) |
| Issue manual credit | Admin (no prior approval required — logged reason mandatory) |
| Dismiss L2+ concern | HOD or Academic Head |
| Approve org-wide message template | Admin Head or Super Admin |
| Initiate staff off-boarding | HR/Finance or Super Admin |
| Assign or change staff role | Super Admin only |
| Immediate Access Revocation | HR/Finance or Super Admin |
| Mark bad debt | Admin Head or Super Admin |
| Merge records | Admin or above |
| Bulk progression holdback | Admin or above |
| Reverse year group progression | Admin or above (7-day window) |
| Session transfer between siblings | Admin requests; Admin Head approves |
| Configure tenant settings | Super Admin only |
| Access platform audit log | Admin Head or Super Admin |
| Correct attendance records | Admin or above — Attendance records can be corrected at any time by Admin or above. A reason must be logged. The original record and the correction are both retained in the audit trail. |
| Advance lead pipeline past Schedule Confirmed | Tier 1a (Super Admin, Admin Head), Tier 1b (HR/Finance), Tier 2a (Academic Head, HOD), Tier 2b (Admin). All four tiers. Teacher and TA (Tier 3) cannot advance past Schedule Confirmed. |
| Convert a lead to student (Won) | Tier 1a, 1b, 2a, 2b only. Teacher and TA cannot trigger conversion. |
| View financial report types in Reports | Super Admin, Admin Head, Admin, HR/Finance only (`reports.viewFinancial`). Academic Head and HOD see Reports but financial report types are hidden. |
| View staff CPD detail log | Super Admin, Admin Head, HR/Finance only (`staff.viewCPDDetail`). HOD and Academic Head see CPD completion summary (percentage + outstanding hours) but not the detailed log entries or uploaded documents. |
| View guardian records | Super Admin, Admin Head, Admin, Academic Head (read only), HR/Finance (full create/edit). HOD, Teacher, TA cannot access guardian records. |

---

## 4.1 Lead Pipeline Role Tiers

The lead pipeline uses a four-tier model to determine how far each role can advance a lead.

| **Tier** | **Roles** | **Pipeline Authority** |
|---|---|---|
| Tier 1a | Super Admin, Admin Head | Full pipeline. All stages including Invoice Sent, Record Payment, Won/Lost, Convert to Student. |
| Tier 1b | HR/Finance | Full pipeline past Schedule Confirmed. Send Invoice, Record Payment, Convert to Student. |
| Tier 2a | Academic Head, HOD | Can view all stages and advance up to and including Schedule Confirmed. Cannot send invoice, record payment, or convert to student. |
| Tier 2b | Admin | Full pipeline. All stages including Invoice Sent, Record Payment, Won/Lost, Convert to Student. |
| Tier 3 | Teacher, TA | View all stages and team chat only. Cannot advance past Schedule Confirmed. A banner in the lead footer reads: "To proceed to invoicing, please speak to Admin or Admin Head." Cannot convert a lead to a student. |

Team chat is unrestricted — all roles at all tiers can use the lead team chat at every pipeline stage.

---

# 5. Navigation Visibility

Role-based navigation follows a hide-not-grey rule. Staff members never see menu items they cannot access.

| **Property** | **Value** |
|---|---|
| Rule | Inaccessible navigation items are hidden from the sidebar and tab bar entirely |
| Rationale | Prevents confusion and reduces accidental access attempts |
| Override | Super Admin can view all navigation items regardless of context |
| Module toggles | If a module is disabled for the tenant in M20, its navigation item is hidden for all roles |

## 5.1 Navigation Access by Role

| **Nav Item** | **Super Admin** | **Admin Head** | **Admin** | **Academic Head** | **HOD** | **Teacher** | **TA** | **HR/Finance** |
|---|---|---|---|---|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Students | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Guardians | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ |
| Leads | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Enrolment | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | — |
| Timetable | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (view only) |
| Attendance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (view only) |
| Assessments | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Progress | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Feedback | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Communications | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Finance | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Staff | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Tasks | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Analytics | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Reports | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Automations | ✓ | ✓ | ✓ | — | — | — | — | — |
| Inventory | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| People | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Settings | ✓ | — | — | — | — | — | — | — |

---

# 6. Approval Gateway

The Approval Gateway is the mechanism by which high-impact actions are submitted, routed, approved or rejected, and logged. Every gateway action has a defined performer, approver (if required), and notification chain.

## 6.1 Finance Actions

| **Action** | **Who Can Perform** | **Approval Required** | **Notification** |
|---|---|---|---|
| Apply discount to invoice | Admin | Admin Head approval required | Admin Head notified of request |
| Issue manual credit | Admin | No prior approval. Logged reason mandatory. Credit visible in finance dashboard. | None — Admin Head has dashboard visibility |
| Refund (all types) | Admin (requests) | 3-stage approval chain: Admin initiates → Admin Head approves → Super Admin approves | Admin Head notified of request; Super Admin notified on Admin Head approval |
| Waive trial fee | Admin | No prior approval at point of invoice creation. Logged reason mandatory. | None |
| Waive session fee | Admin | No prior approval. Logged reason mandatory. | None |
| Waive enrolment fee | Admin | No prior approval. Logged reason mandatory. | None |
| Fee-exempt student toggle | Admin | No prior approval required. Logged reason mandatory. | None |
| Mark invoice as bad debt | Admin Head or Super Admin only | Admin Head decides after system flags recalculation pending | None |
| 100% discount resulting in zero-value invoice | Admin | Admin Head notified automatically. Zero-value invoice auto-resolves to Paid. | Admin Head nudge notification |

## 6.2 Academic & Operational Actions

| **Action** | **Who Can Perform** | **Approval Required** | **Notification** |
|---|---|---|---|
| Override year group placement post-assessment | Admin, Admin Head, Super Admin | No approval. Logged reason required. | None |
| Merge records | Admin or above | No approval. Typed CONFIRM MERGE required. 24-hour Super Admin rollback window. | None |
| Dismiss L2+ concern | HOD, Academic Head, Admin Head, Super Admin | Logged reason required | None |
| Approve announcement before send | Admin, Admin Head, Super Admin | Admin or Admin Head approves. Teacher cannot approve own announcement. | None |
| Approve org-wide message template | Admin Head or Super Admin only | Admin Head or Super Admin approves | None |
| Bulk progression holdback flag | Admin or above | Logged reason required. Preview list available 2 weeks before graduation date. | None |
| Reverse individual year group progression | Admin or above | No approval. Logged reason required. 7-day window only. | None |
| Session transfer between siblings | Admin (requests) | Admin Head approval required. Feature toggle must be enabled. | Admin Head notified of request |
| Waitlist offer override | Admin only | No approval. System prompts confirmation on booking. Waitlist offer auto-declined. | Parent notified that waitlist offer was declined |

## 6.3 HR & Access Actions

| **Action** | **Who Can Perform** | **Approval Required** | **Notification** |
|---|---|---|---|
| Immediate Access Revocation | Super Admin or HR/Finance | Super Admin or HR/Finance only. Typed CONFIRM required. Irreversible without manual reinstatement. | None |
| Emergency Leave activation | Admin Head or Super Admin | Admin Head or Super Admin only. Activates vacant role fallback chain instantly. | None |
| Initiate staff off-boarding | Super Admin or HR/Finance | Super Admin or HR/Finance only. Admin Head sign-off optional. | Admin Head notified if sign-off configured |
| Assign or change staff role | Super Admin only | Super Admin only | None |

> **Emergency Leave re-routing:** When the approver is on Emergency Leave, all pending requests in their approval queue are automatically re-routed to the Vacant Role Fallback designated in M20 Section 01.15.

## 6.4 Gateway Log

Every gateway action — whether autonomously executed, approved, rejected, or pending — is permanently retained in the platform audit log.

The Gateway Log is a permanent, filterable audit record of every approval event. Accessible by Admin Head and Super Admin. Each entry records: request type, requestor, approver at each stage, approval/rejection decision, reason (if rejected), timestamp, and the record affected. The Gateway Log is accessible as a filterable feed in M10 and as a record-level view on individual student/invoice/staff pages.

| **Property** | **Value** |
|---|---|
| Log entry fields | Request type, requestor name and role, approver name and role at each stage, approval/rejection decision, reason (if rejected), timestamp (DD/MM/YYYY HH:MM:SS), record affected |
| Access | Admin Head and Super Admin. Accessible as a filterable feed in M10 and as a record-level view on individual student/invoice/staff pages. |
| Immutability | Audit log entries cannot be edited or deleted by any role |
| Pending reminders | Gateway requests unactioned for more than 24 hours generate a reminder notification to the required approver |
| Rejected requests | Logged with rejection reason. Requester notified in-platform immediately. |

## 6.5 Approver Unavailability

When an approver is unavailable, two mechanisms prevent gateway requests from becoming permanently blocked.

| **Mechanism** | **Detail** |
|---|---|
| Out-of-office warning | When a requester submits a gateway action and the designated approver has active leave or out-of-office status in M09, the system displays a warning showing the approver's name and return date. The warning does not block submission. |
| Manual re-routing | Any pending gateway request can be manually re-routed by the original requester to any named person holding an eligible role (HOD or above). Re-routing is logged: original approver, re-routed to, re-routed by, timestamp, and reason. The original approver is notified. |
| Vacant role fallback | If the approver role is vacant (off-boarded or Emergency Leave), the request automatically routes to the next role in the fallback chain: HOD → Academic Head → Admin Head → Super Admin. |
| Super Admin unavailable — single SA setup | If Super Admin is the terminal fallback and is on Emergency Leave or otherwise unavailable, all pending approval requests remain in a Held state. No auto-approval occurs under any circumstance. Admin Head receives an immediate in-app alert: "Approval request held — Super Admin unavailable. Action required on Super Admin's return." The held request is visible in the Gateway Log with status Held. On Super Admin's return, all held requests are surfaced as a priority queue. Super Admin can delegate approval authority temporarily by granting a named Admin Head or Admin a time-limited secondary Super Admin label via M20 before going on leave — this is the recommended approach for planned absences. |

## 6.6 Planned Leave Handover

When a staff member logs planned leave in M09, the system checks whether they hold any approval gateway role.

If the staff member holds a gateway role, a handover document is mandatory before the leave can be confirmed. The system blocks leave confirmation until the handover is completed. The handover document must designate a named cover approver for each gateway action type the departing staff member is authorised to action. The cover approver must hold an eligible role (HOD or above).

During the leave period, all new gateway requests that would normally route to the absent staff member are automatically directed to the designated cover approver.

| **Property** | **Value** |
|---|---|
| Reminder schedule | 3 days before leave, 1 day before leave, and on the leave start date. Admin Head and Super Admin copied on the final reminder. |
| Storage | Handover documents stored permanently on the staff member's profile in M09. Visible to Super Admin and Admin Head. |
| Emergency Leave exception | Emergency Leave bypasses the handover requirement. Vacant Role Fallback Chain activates immediately. |

---

# 7. Role Configuration in M20

All role configuration is managed by Super Admin in M20 Tenant Settings under User Roles & Permissions. Changes apply immediately to all staff currently assigned that role.

| **Capability** | **Detail** |
|---|---|
| View and edit default permissions | All 11 platform roles can be edited freely. Changes apply immediately. |
| Create custom roles | New roles with any combination of permissions. Name, description, and full permission set configurable. |
| Clone existing role | Duplicate an existing role as a starting point. All permissions are copied and editable. |
| Default role on staff creation | Set which role is pre-selected when adding a new staff member. Role assignment is mandatory — a staff member cannot be saved without a role. |
| Department-scoped roles | A role can be restricted to Primary, Lower Secondary, or Senior. Staff assigned a department-scoped role only see data from that department. |
| Role expiry | Role assignment auto-expires on a configured date. Used for temporary staff, interns, or cover. Expired roles are retained in the audit log. |

---

---

# 8. Absorbed Amendments

The following corrections from prior amendment documents are fully absorbed into this version. No separate AMD files are required.

## 8.1 Manual Credit (formerly PL-02.A)

Manual credit issuance does not require Admin Head approval. Admin issues credit directly with a mandatory logged reason. This is captured in the Approval Gateway table in Section 6.1.

## 8.2 April 2026 RBAC Amendments (formerly RBAC_AMD_April2026.md)

All 14 confirmed amendments from the April 2026 RBAC session are reflected in Sections 2, 4, and 5 of this document. Key changes absorbed:

- HR/Finance granted Guardians full access, Leads pipeline access, Timetable and Attendance view access, full Analytics and Reports access
- Academic Head granted Guardians view, Enrolment view, Leads view, Reports generate/schedule (academic only)
- HOD granted Leads view, People/Segments access, Reports generate/schedule (academic only), CPD summary view
- Teacher and TA granted Leads view, Enrolment view, Tasks full access, Assessments view + enterOutcome
- TA additionally granted Inventory view and stock take
- Lead pipeline role tiers defined (Tier 1a, 1b, 2a, 2b, 3)
- `reports.viewFinancial` gate established — financial report types hidden from Academic Head and HOD
- `staff.viewCPDDetail` gate established — CPD detail log restricted to Super Admin, Admin Head, HR/Finance
- Attendance hard lock removed — replaced with tiered reminder notifications (24h yellow, 48h amber, 72h+ red)
- Feedback post-approval Admin task auto-created on HOD/Academic Head sign-off
