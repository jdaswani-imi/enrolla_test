# Enrolla Prototype — Feature Coverage Audit

> Generated: 2026-04-24  
> Scope: PRD Band 1 + Band 2 + Band 3 vs prototype codebase  
> Status legend: ✅ Built · 🟡 Partial · ❌ Not built · 🔵 Phase 2 · ⬜ Backend only

---

| Module | Feature / Workflow | PRD Band | Built in Prototype | Status | Notes |
|---|---|---|---|---|---|
| **PL-01** Platform | Multi-tenant isolation (tenant_id RLS) | 1 | No (single-tenant mock data) | ⬜ Backend only | Backend architecture concern; no frontend surface required |
| **PL-01** Platform | Audit trail (append-only audit_log) | 1 | Audit Log settings section exists (static) | 🟡 Partial | `/settings` Audit Log section is a UI shell only |
| **PL-01** Platform | Approval gateway (pending_approvals queue) | 1 | Approvals referenced in dashboard HOD pending approvals | 🟡 Partial | No dedicated `/approvals` screen; pending approvals shown in HOD dashboard only |
| **PL-01** Platform | 30-day Graduated→Alumni transition | 1 | Not implemented | ⬜ Backend only | Background job, no UI surface |
| **PL-02** RBAC | 8 primary roles (Super Admin, Admin Head, Admin, Academic Head, HOD, Teacher, TA, HR/Finance) | 1 | Fully defined in `lib/role-config.ts` | ✅ Built | 8 roles + role switcher + permission matrix |
| **PL-02** RBAC | Nav access map (per-role sidebar visibility) | 1 | `canAccess` in role-config.ts | ✅ Built | All 23 nav items gated by permission keys |
| **PL-02** RBAC | `reports.viewFinancial` gate | 1/2 | Defined in PERMISSIONS, gates Finance tab on student profile | ✅ Built | Applied on student profile invoices tab and reports |
| **PL-02** RBAC | `staff.viewCPDDetail` tiered visibility | 2 | Permission key defined, enforced in staff page | ✅ Built | HR/Finance vs HOD CPD view differentiated |
| **PL-02** RBAC | Lead pipeline role tiers (Tier 1a/1b/2a/2b/3) | 2 | `leads.advanceBeyondScheduled`, `leads.convertToStudent` keys present | ✅ Built | Tier enforcement via permission keys |
| **PL-02** RBAC | Settings → Roles & Permissions editor | 1/2 | Roles section exists with editable matrix | ✅ Built | Interactive permissions table in `/settings` |
| **PL-02** RBAC | Developer role (platform-only) | 1 | Not exposed in role switcher | ❌ Not built | Explicitly excluded per PRD |
| **PL-04** Security | Login screen (email + password) | 1 | `/login` page with email/password/MFA visual | 🟡 Partial | UI only — no real auth; accepts any input |
| **PL-04** Security | MFA enrolment | 1 | Not in prototype | ❌ Not built | No MFA flow |
| **PL-04** Security | Password reset flow | 1 | Not in prototype | ❌ Not built | No forgot-password screen |
| **PL-04** Security | Profile update link (tokenised, time-bound) | 1/2 | Mentioned only in people page forms list | 🟡 Partial | Entry exists in forms catalogue; no token UI |
| **PL-04** Security | Session security / device binding | 3 | Not in prototype | 🔵 Phase 2 | Band 3 |
| **M01** Lead Management | 11-stage pipeline (New→Contacted→Assessment Booked→…→Won) | 2 | Full pipeline stages in `/leads` | ✅ Built | Kanban + List views, all 11 stages |
| **M01** Lead Management | Kanban view | 2 | Default view on `/leads` | ✅ Built | Drag-and-drop kanban columns |
| **M01** Lead Management | List view | 2 | Alternate view toggle | ✅ Built | List toggle available |
| **M01** Lead Management | Inline lead creation | 2 | "New lead" flow exists | ✅ Built | Create dialog |
| **M01** Lead Management | Public web form capture | 2 | Not exposed as public form | ❌ Not built | No tenant-website embed; only internal creation |
| **M01** Lead Management | CSV bulk import | 2 | Not in prototype | ❌ Not built | Band 2 item not surfaced |
| **M01** Lead Management | DNC flag + warning interstitial | 2 | DNC badge rendered on lead cards | 🟡 Partial | DNC visible; no warning interstitial on click |
| **M01** Lead Management | Duplicate detection modal | 2 | Not in prototype | ❌ Not built | Lead creation does not check duplicates |
| **M01** Lead Management | Sibling detection / banner | 2 | Sibling badge shown on lead cards and detail | ✅ Built | "Sibling" flag displayed |
| **M01** Lead Management | Activity log on lead | 2 | Lead detail includes activity strip | ✅ Built | Chronological notes/activity |
| **M01** Lead Management | Stage-gated copy-paste message templates | 2 | WhatsApp block / "Mark as sent" pattern in journey dialogs | ✅ Built | `whatsapp-block.tsx` reused across stage dialogs |
| **M01** Lead Management | Book Assessment dialog | 2 | `book-assessment-dialog.tsx` | ✅ Built | Functional dialog |
| **M01** Lead Management | Log Assessment Outcome dialog | 2 | `log-assessment-outcome-dialog.tsx` | ✅ Built | Functional dialog |
| **M01** Lead Management | Skip Assessment flow | 2 | `skip-assessment-dialog.tsx` + `skip-warning-dialog.tsx` | ✅ Built | With skip warning |
| **M01** Lead Management | Book Trial dialog | 2 | `book-trial-dialog.tsx` | ✅ Built | Functional dialog |
| **M01** Lead Management | Log Trial Outcome dialog | 2 | `log-trial-outcome-dialog.tsx` | ✅ Built | Functional dialog |
| **M01** Lead Management | Trial skip prompt | 2 | `trial-skip-prompt-dialog.tsx` | ✅ Built | Functional |
| **M01** Lead Management | Schedule Offer / Confirm dialogs | 2 | `schedule-offer-dialog.tsx` + `schedule-confirm-dialog.tsx` | ✅ Built | Functional |
| **M01** Lead Management | Convert-to-Student flow | 2 | `convert-to-student-dialog.tsx` | ✅ Built | Creates student record with consents |
| **M01** Lead Management | Create Enrolment dialog | 2 | `create-enrolment-dialog.tsx` | ✅ Built | In journey |
| **M01** Lead Management | Record Payment dialog | 2 | `record-payment-dialog.tsx` | ✅ Built | Atomic Paid→Won conversion |
| **M01** Lead Management | Invoice Builder dialog (from lead) | 2 | `invoice-builder-dialog.tsx` | ✅ Built | Journey dialog |
| **M01** Lead Management | Invoice-to-lead auto-update | 2 | Custom window event `enrolla:undo-paid-conversion` | ✅ Built | Event listeners present |
| **M01** Lead Management | Auto-inactive 60-day archive | 2 | Not surfaced | ❌ Not built | No auto-archive logic or dashboard |
| **M01** Lead Management | Referral programme tracking | 2 | Referrals tab on guardian profile | 🟡 Partial | UI exists; no milestone engine |
| **M01** Lead Management | Fallback escalation chain | 2 | Not in prototype | ❌ Not built | No escalation engine |
| **M01** Lead Management | Lead ownership / assignment / reassignment | 2 | Owner avatar on cards | ✅ Built | Assignee displayed; reassign via staff select |
| **M01** Lead Management | Walk-in quick-add | 2 | Not distinguished | ❌ Not built | Only generic "new lead" |
| **M02** Student & Guardian CRM | Student list page | 1 | `/students` | ✅ Built | Filter/search/table |
| **M02** Student & Guardian CRM | Student profile (11 tabs) | 1/2 | `/students/[id]` with 11 tabs | ✅ Built | All tabs implemented |
| **M02** Student & Guardian CRM | Guardian list page | 1 | `/guardians` | ✅ Built | Functional |
| **M02** Student & Guardian CRM | Guardian profile (7 tabs) | 1/2 | `/guardians/[id]` with Overview/Students/Invoices/Messages/Concerns/Tickets/Referrals | ✅ Built | Full tab set |
| **M02** Student & Guardian CRM | Family linking (student↔guardian) | 1 | Linked students shown on guardian | ✅ Built | Visible in profile |
| **M02** Student & Guardian CRM | Co-parent three states | 1 | Not in UI | ❌ Not built | Not modelled |
| **M02** Student & Guardian CRM | DNC flag + reason + interstitial | 1 | DNC flag editable on guardian profile | 🟡 Partial | Editable; no contact-attempt interstitial on click |
| **M02** Student & Guardian CRM | Unsubscribed flag (distinct from DNC) | 1 | Unsubscribed toggle on guardian | ✅ Built | Separate from DNC |
| **M02** Student & Guardian CRM | Merge (student or guardian) | 1 | People page Duplicates tab includes merge | ✅ Built | Merge action surfaced |
| **M02** Student & Guardian CRM | 24-hour merge rollback | 1 | Not explicit in UI | ❌ Not built | No rollback timer shown |
| **M02** Student & Guardian CRM | School directory | 2 | Not in prototype | ❌ Not built | `school` is free-text only; no directory |
| **M02** Student & Guardian CRM | Communication log | 1/2 | "Communication Log" tab on student profile | ✅ Built | Tab present |
| **M02** Student & Guardian CRM | Profile update link / token | 2 | Listed in People→Forms catalogue only | 🟡 Partial | Named in forms list; no token generation UI |
| **M02** Student & Guardian CRM | Right-to-be-forgotten / erasure | 1 | Not in prototype | ❌ Not built | Super Admin action not surfaced |
| **M03** Assessment & Placement | Assessments list page (upcoming/outcomes/slots) | 2 | `/assessments` with 3 tabs | ✅ Built | Upcoming, Outcomes, Slot Management |
| **M03** Assessment & Placement | Booking flow (Admin-scheduled) | 2 | `book-assessment-dialog.tsx` | ✅ Built | Functional |
| **M03** Assessment & Placement | Smart slot ranking | 2 | Slot Management tab | 🟡 Partial | Tab exists; ranking engine is static |
| **M03** Assessment & Placement | Outcome entry | 2 | `log-assessment-outcome-dialog.tsx` | ✅ Built | Functional |
| **M03** Assessment & Placement | Skip assessment | 2 | `skip-assessment-dialog.tsx` | ✅ Built | Functional |
| **M03** Assessment & Placement | Self-service booking link | 2 | Not in prototype | ❌ Not built | No tokenised-URL generator |
| **M03** Assessment & Placement | Public assessment booking page | 2 | Not in prototype | ❌ Not built | No embed |
| **M03** Assessment & Placement | Outcome PDF generation | 2 | Not in prototype | ❌ Not built | Copy-paste text only |
| **M03** Assessment & Placement | CAT4 flat rate configuration | 1 | Not surfaced in catalogue UI | ❌ Not built | Mentioned in PRD; no prototype surface |
| **M04** Enrolment Lifecycle | Enrolment list page | 1 | `/enrolment` with Enrolments/Trials/Withdrawals tabs | ✅ Built | Three tabs |
| **M04** Enrolment Lifecycle | New enrolment dialog | 1 | `components/enrolment/new-enrolment-dialog.tsx` | ✅ Built | Functional |
| **M04** Enrolment Lifecycle | Withdrawal flow | 1 | Withdrawals tab + withdraw dialog | ✅ Built | Multi-subject withdrawal |
| **M04** Enrolment Lifecycle | Reactivate withdrawal | 1 | Available in withdrawals tab | ✅ Built | "Move back to active" |
| **M04** Enrolment Lifecycle | Unbilled sessions tracker | 2 | Finance page Unbilled tab + KPI card | ✅ Built | Write-off + invoice-from-unbilled flow |
| **M04** Enrolment Lifecycle | Payment plans | 2 | Settings → Payment Plans section | 🟡 Partial | Settings section exists; no per-student application UI |
| **M04** Enrolment Lifecycle | Fee waiver | 2 | `finance.waiveFee` permission + write-off dialog "Waived" reason | 🟡 Partial | Write-off dialog offers "Waived"; no dedicated waiver workflow |
| **M04** Enrolment Lifecycle | Fee-exempt toggle | 2 | Not in prototype | ❌ Not built | Not surfaced |
| **M04** Enrolment Lifecycle | Sibling discount | 2 | Referenced in lead notes only | ❌ Not built | No system-level sibling discount rule |
| **M04** Enrolment Lifecycle | Enrolment fee (AED 300 lifetime) | 1 | In invoice builder logic | ✅ Built | Settings has "Lifetime (charged once)" copy |
| **M04** Enrolment Lifecycle | Frequency tier (Standard/Mid/Next/Top) | 1 | Surfaced in enrolment creation | ✅ Built | journey create-enrolment-dialog |
| **M05** Timetabling & Scheduling | Timetable page | 1 | `/timetable` with Day/Week/Month/List views | ✅ Built | Multiple view modes |
| **M05** Timetabling & Scheduling | Create session | 1 | `components/timetable/new-session-dialog.tsx` | ✅ Built | Functional |
| **M05** Timetabling & Scheduling | Recurrence | 1 | Recurrence fields on new session dialog | ✅ Built | Part of dialog |
| **M05** Timetabling & Scheduling | Room booking | 1 | Room field in new-session dialog | ✅ Built | Room dropdown |
| **M05** Timetabling & Scheduling | Cover sessions | 2 | Reason includes "Teacher unavailable" | 🟡 Partial | Field for cover-reason exists; no cover-assignment workflow |
| **M05** Timetabling & Scheduling | Waitlist | 2 | Not in prototype | ❌ Not built | Band 2 deferred |
| **M05** Timetabling & Scheduling | Operating-hours warnings | 1 | Not visible in UI | ❌ Not built | No soft-warning surfaced |
| **M05** Timetabling & Scheduling | Public holiday warnings | 1 | Not visible in UI | ❌ Not built | No holiday-overlap warning |
| **M05** Timetabling & Scheduling | Calendar heatmap on dashboard | 2 | `components/dashboard/occupancy-detail-modal.tsx` | ✅ Built | Occupancy modal |
| **M06** Attendance & Makeups | Attendance register | 1/2 | `/attendance` with Register/Overview tabs | ✅ Built | Mark per session |
| **M06** Attendance & Makeups | 5 attendance statuses (Present/Late/Absent Notified/Absent Not Notified/No Show) | 1/2 | All 5 present | ✅ Built | Full status set |
| **M06** Attendance & Makeups | Correct attendance | 2 | Same-row interactions in register | ✅ Built | Edit in register |
| **M06** Attendance & Makeups | Tiered reminder banners (24h/48h/72h) | 2 | `getBannerTier` implemented — yellow/amber/red | ✅ Built | Colour-coded banners in register |
| **M06** Attendance & Makeups | Makeup log tab | 2 | `/attendance?tab=makeup-log` | ✅ Built | Makeup log visible |
| **M06** Attendance & Makeups | Makeup booking | 2 | Not in prototype | ❌ Not built | Log visible; no booking flow |
| **M06** Attendance & Makeups | Makeup carry-over | 2 | Makeup allowance column shown | 🟡 Partial | Count visible; no term-end carry-over logic |
| **M06** Attendance & Makeups | No-show 48h reason logging | 2 | Not surfaced | ❌ Not built | No countdown UI |
| **M06** Attendance & Makeups | Concern Engine (M06.A) | 2 | Concern tabs exist on student/guardian; no engine | 🟡 Partial | Concerns surfaced as data; no trigger engine |
| **M06** Attendance & Makeups | Early-mark with reason | 2 | Not surfaced | ❌ Not built | Not available in register |
| **M07** Feedback & Communications | Feedback queue | 2 | `/feedback` Feedback Queue tab | ✅ Built | Approve/reject/send flow |
| **M07** Feedback & Communications | Per-class feedback submission (teacher) | 2 | Referenced in draft status | 🟡 Partial | Review slideover shows existing feedback; no per-class submit flow |
| **M07** Feedback & Communications | AI expansion / summary | 2 | AI summary displayed (static) | 🟡 Partial | Shown as generated text; no regenerate button |
| **M07** Feedback & Communications | Class discussion | 2 | Class Discussion tab with class groups | ✅ Built | Thread view + post |
| **M07** Feedback & Communications | Announcements | 2 | `/communications` Announcements tab | ✅ Built | Announcement list |
| **M07** Feedback & Communications | Complaints / tickets | 2 | `/communications` Concerns & Tickets tab + tabs on student/guardian profile | ✅ Built | Full listing |
| **M07** Feedback & Communications | Dual sign-off on complaints | 2 | Not in prototype | ❌ Not built | No sign-off workflow |
| **M07** Feedback & Communications | NPS surveys | 2 | `/communications` Surveys tab | ✅ Built | Survey responses + pending |
| **M07** Feedback & Communications | Detractor auto-concern | 2 | Not in prototype | ❌ Not built | No trigger engine |
| **M07** Feedback & Communications | Progress report generation | 2 | On `/progress` Reports tab | ✅ Built | Kanban status |
| **M07** Feedback & Communications | Post-approval admin task | 2 | Not explicitly wired | ❌ Not built | No auto-task on approval |
| **M07** Feedback & Communications | DNC handling in outbound | 2 | Not in prototype | ❌ Not built | No DNC interstitial on send |
| **M08** Finance & Billing | Finance page (Invoices/Payments/Credits/Unbilled/Reports tabs) | 1/2 | `/finance` 5 tabs | ✅ Built | Full tab set |
| **M08** Finance & Billing | Invoice builder (new invoice page) | 1 | `/finance/invoice/new` + `components/invoice-builder.tsx` | ✅ Built | Multi-line builder |
| **M08** Finance & Billing | Bulk invoicing | 2 | `bulk.generate.invoices` action in finance page | 🟡 Partial | Permission-gated button; flow static |
| **M08** Finance & Billing | Payment recording | 1 | Journey `record-payment-dialog.tsx` + finance payments tab | ✅ Built | Multi-source |
| **M08** Finance & Billing | Discount request / approval | 1 | `finance.applyDiscount` + `finance.requestDiscount` | ✅ Built | Permission matrix defined |
| **M08** Finance & Billing | Credit issuance | 1 | Credits tab on finance | ✅ Built | Credit ledger visible |
| **M08** Finance & Billing | Refund 3-stage approval | 1 | `finance.requestRefund` / `approveRefund` / `finalApproveRefund` | 🟡 Partial | Permissions defined; no pending-queue UI |
| **M08** Finance & Billing | Bad debt write-off | 2 | Write-off dialog with reason codes | 🟡 Partial | No explicit "Bad Debt" reason; closest is write-off with Waived/Data Error |
| **M08** Finance & Billing | Enrolment fee (AED 300 lifetime) | 1 | In invoice builder | ✅ Built | Settings confirms "Lifetime (charged once)" |
| **M08** Finance & Billing | Payment plans (scheduled billing) | 2 | Settings section | 🟡 Partial | Settings only; no per-student plan application |
| **M08** Finance & Billing | Unbilled sessions tracker | 2 | Finance unbilled tab | ✅ Built | Fully functional |
| **M08** Finance & Billing | Bank accounts & revenue routing | 1/2 | Settings → Billing → Revenue Tags | ✅ Built | Department→bank map |
| **M08** Finance & Billing | VAT 5% post-discount calculation | 1 | In invoice builder | ✅ Built | Live calculation |
| **M08** Finance & Billing | Invoice-to-lead auto-update | 2 | Custom window event `enrolla:undo-paid-conversion` | ✅ Built | Hooked from finance → leads |
| **M08** Finance & Billing | Payment gateway integration | 3 | Not in prototype | 🔵 Phase 2 | Band 3 |
| **M09** Staff Performance | Staff directory | 1/2 | `/staff` Directory tab | ✅ Built | Table/grid |
| **M09** Staff Performance | Staff profile | 1 | Profile flyout from row | ✅ Built | In staff page |
| **M09** Staff Performance | CPD tracking | 2 | HR Dashboard CPD section | ✅ Built | Progress display |
| **M09** Staff Performance | CPD visibility tiers (HR vs HOD summary) | 2 | `staff.viewCPDDetail` permission applied | ✅ Built | Permission-gated |
| **M09** Staff Performance | Performance reviews | 2 | Not surfaced | ❌ Not built | No review workflow |
| **M09** Staff Performance | HR dashboard | 2 | Staff page HR Dashboard outer tab | ✅ Built | Alternate tab for HR/Finance |
| **M09** Staff Performance | Off-boarding hard blocks | 2 | `staff.initiateOffboarding` permission | 🟡 Partial | Permission exists; workflow not surfaced |
| **M09** Staff Performance | Immediate access revocation | 2 | `staff.revokeAccess` permission | 🟡 Partial | Permission exists; no dedicated action button |
| **M09** Staff Performance | Emergency leave | 2 | `request-leave-dialog.tsx` + `leave-handover-dialog.tsx` | ✅ Built | Dialogs functional |
| **M09** Staff Performance | Concerns hard-block on off-boarding | 2 | Not explicit | ❌ Not built | No checklist |
| **M09** Staff Performance | Add staff dialog | 1 | `components/staff/add-staff-dialog.tsx` | ✅ Built | Functional |
| **M09** Staff Performance | Staff groups (for distribution) | 2 | Not surfaced | ❌ Not built | No group editor |
| **M10** Management Dashboard | KPI cards (role-scoped) | 2 | `/dashboard` with `lib/dashboard-config.ts` | ✅ Built | 11+ KPIs per role |
| **M10** Management Dashboard | Churn risk table | 2 | `churn-detail-modal.tsx` + `churnRiskStudents` mock | ✅ Built | Full churn signals |
| **M10** Management Dashboard | Revenue chart | 2 | Recharts BarChart stacked by dept | ✅ Built | Stacked by department |
| **M10** Management Dashboard | Occupancy heatmap | 2 | `occupancy-detail-modal.tsx` | ✅ Built | Seat occupancy grid |
| **M10** Management Dashboard | Activity feed | 2 | `activityFeed` mock rendered | ✅ Built | Chronological events |
| **M10** Management Dashboard | Reports inbox | 2 | Dashboard reports inbox panel + `/reports` | ✅ Built | Inbox on dashboard |
| **M10** Management Dashboard | Today's Digest panel | 2 | Partially present as dashboard sections | 🟡 Partial | No explicit Daily/Weekly toggle or refresh indicator |
| **M10** Management Dashboard | Role-scoped dashboard variants (8 roles) | 2 | All 8 variants in `dashboard-config.ts` | ✅ Built | Per-role KPIs + sections |
| **M10** Management Dashboard | Operational thresholds | 2 | `operationalThresholds` in mock | ✅ Built | Threshold data rendered |
| **M10** Management Dashboard | HOD workload indicator | 2 | `hodTeacherWorkload` mock | ✅ Built | HOD dashboard section |
| **M10** Management Dashboard | Academic Alerts consolidation view | 2 | `academicAlerts` + `hodAcademicAlerts` | ✅ Built | Alert tables |
| **M11** Academic Courses & Catalogue | Subject catalogue | 1 | Settings → Subjects & Catalogue | ✅ Built | Interactive |
| **M11** Academic Courses & Catalogue | Pricing tiers (Standard/Mid/Next/Top) | 1 | Used in enrolment flow | ✅ Built | Referenced in catalogue |
| **M11** Academic Courses & Catalogue | Session durations | 1 | Editable per course | ✅ Built | In catalogue |
| **M11** Academic Courses & Catalogue | Bundles / packages | 1 | Not surfaced in UI | ❌ Not built | No package editor |
| **M11** Academic Courses & Catalogue | Topic trees / subtopics | 2 | Not in prototype | ❌ Not built | Flat catalogue only |
| **M11** Academic Courses & Catalogue | Objectives | 2 | Not in prototype | ❌ Not built | |
| **M11** Academic Courses & Catalogue | Rubrics | 2 | Not in prototype | ❌ Not built | |
| **M11** Academic Courses & Catalogue | Trial configuration | 1 | Trial delivery mode referenced | 🟡 Partial | Trial pricing shown; no trial config editor |
| **M12** People, Forms & Documents | People directory (multi-tab) | 2 | `/people` with Overview/Duplicates/Segments/Broadcast/Forms/Exports | ✅ Built | 6 tabs |
| **M12** People, Forms & Documents | Duplicate detection | 2 | Duplicates tab | ✅ Built | List + actions |
| **M12** People, Forms & Documents | Segments (builder) | 2 | Segments tab | 🟡 Partial | List view; no interactive filter-criteria builder |
| **M12** People, Forms & Documents | Broadcast lists | 2 | Broadcast Lists tab | ✅ Built | Tri-state view |
| **M12** People, Forms & Documents | Forms builder | 2 | Forms tab | 🟡 Partial | Form list shown (Lead Enquiry, Profile Update); no drag-drop builder |
| **M12** People, Forms & Documents | Exports (CSV / Google Contacts) | 2 | Exports tab | ✅ Built | Export audit visible |
| **M12** People, Forms & Documents | Merge wizard with financial gate | 2 | Referenced via duplicates | 🟡 Partial | Merge surfaced; 4-step wizard not built |
| **M13** Automation & Communications | Automation page with 7 tabs | 2 | `/automations` Templates/Rules/Trigger Library/Dispatch Queue/Internal Messages/Marketing/Execution Log | ✅ Built | Full tab set |
| **M13** Automation & Communications | Template library | 2 | Templates tab | ✅ Built | Template list |
| **M13** Automation & Communications | Rule builder | 2 | Rules tab | 🟡 Partial | List view; no drawer wizard |
| **M13** Automation & Communications | Trigger library browser | 2 | Trigger Library tab | ✅ Built | Categorised |
| **M13** Automation & Communications | Dispatch queue | 2 | Dispatch Queue tab | ✅ Built | Copy/mark-as-sent flow |
| **M13** Automation & Communications | Internal messaging | 2 | Internal Messages tab | ✅ Built | Channels |
| **M13** Automation & Communications | Marketing moments | 2 | Marketing tab | ✅ Built | Campaigns |
| **M13** Automation & Communications | Execution log | 2 | Execution Log tab | ✅ Built | Log viewer |
| **M13** Automation & Communications | WhatsApp copy-paste block | 2 | `components/journey/whatsapp-block.tsx` | ✅ Built | Reused across journey dialogs |
| **M13** Automation & Communications | Live dispatch (F.16 adapters) | 3 | Not in prototype | 🔵 Phase 2 | Band 3 |
| **M14** Assignment Library | Assignments page / tab | 2 | Progress → Assignments tab | 🟡 Partial | Tab exists; no full library structure (folders/topics) |
| **M14** Assignment Library | Quick Score Entry from session | 2 | Not in prototype | ❌ Not built | Not surfaced from timetable |
| **M14** Assignment Library | Submission tracking | 2 | Partially in Assignments tab | 🟡 Partial | Status shown; no submission flow |
| **M14** Assignment Library | Grading / rubrics | 2 | Not in prototype | ❌ Not built | |
| **M14** Assignment Library | Topic linking | 2 | Not in prototype | ❌ Not built | |
| **M14** Assignment Library | Absent-zero handling | 2 | Not in prototype | ❌ Not built | No rule |
| **M15** Inventory | Inventory page with 4 tabs | 3 | `/inventory` Catalogue/Reorder Alerts/Stock Ledger/Suppliers | ✅ Built | 4 tabs |
| **M15** Inventory | Catalogue | 3 | Catalogue tab | ✅ Built | Full item list |
| **M15** Inventory | Stock take | 3 | `stock.take` permission | ✅ Built | Available |
| **M15** Inventory | Reorder alerts | 3 | Reorder Alerts tab | ✅ Built | Low-stock list |
| **M15** Inventory | Stock ledger | 3 | Stock Ledger tab | ✅ Built | Change history |
| **M15** Inventory | Suppliers | 3 | Suppliers tab | ✅ Built | Supplier list |
| **M15** Inventory | Auto-deduct on enrolment | 3 | `auto_deduct` change-type in ledger | ✅ Built | Ledger entry type |
| **M15** Inventory | Dashboard inventory cards (low stock, recently ordered) | 2/3 | `inventoryItems` + `reorderAlerts` in mock | ✅ Built | Dashboard mock has it |
| **M16** Task Management | Tasks page | 2 | `/tasks` | ✅ Built | Full tasks UI |
| **M16** Task Management | Task creation | 2 | `components/tasks/new-task-dialog.tsx` | ✅ Built | Functional dialog |
| **M16** Task Management | List view | 2 | `view === "list"` | ✅ Built | Dense table |
| **M16** Task Management | Kanban view | 2 | `view === "kanban"` | ✅ Built | Drag-and-drop |
| **M16** Task Management | Calendar view | 2 | `view === "calendar"` | ✅ Built | Due-date grid |
| **M16** Task Management | Sub-tasks | 2 | In task dialog | ✅ Built | Checklist |
| **M16** Task Management | Linked record context | 2 | `linked.record` strip on task detail | 🟡 Partial | Partial implementation |
| **M16** Task Management | Auto-created tasks (feedback, unbilled, payment reminders, lead follow-up) | 2 | Event listener for `enrolla:lead-followup-completed` | 🟡 Partial | Some hooks exist; not all sources wired |
| **M16** Task Management | Recurring tasks | 2 | Not surfaced in UI | ❌ Not built | No recurrence editor |
| **M16** Task Management | Task templates | 2 | Not in prototype | ❌ Not built | |
| **M16** Task Management | Snooze | 2 | Not in prototype | ❌ Not built | |
| **M17** Student Profile | 11 tabs (Overview/Calendar/Attendance/Invoices/Grades/Courses/Comm Log/Tasks/Concerns/Tickets/Files) | 1/2 | `/students/[id]` TABS array | ✅ Built | All tabs implemented |
| **M17** Student Profile | Sidebar flags strip | 1 | Overdue/flag strip on Overview | ✅ Built | Click-through to tabs |
| **M17** Student Profile | Quick actions | 1 | Action buttons on Overview | ✅ Built | Edit/Enrol/Invoice |
| **M17** Student Profile | Deep-link tab support | 2 | Uses `useSearchParams` tab query | ✅ Built | Tab state in URL |
| **M17** Student Profile | Attendance tab | 1 | Yes | ✅ Built | |
| **M17** Student Profile | Invoices tab (gated by `reports.viewFinancial`) | 1 | Tab hidden if no permission | ✅ Built | Permission-gated |
| **M17** Student Profile | Grades tab | 2 | Yes | ✅ Built | |
| **M17** Student Profile | Courses tab | 1 | Yes | ✅ Built | |
| **M17** Student Profile | Communication Log tab | 2 | Yes | ✅ Built | |
| **M17** Student Profile | Tasks tab | 2 | Yes | ✅ Built | |
| **M17** Student Profile | Concerns tab | 2 | Yes | ✅ Built | |
| **M17** Student Profile | Tickets tab | 2 | Yes | ✅ Built | |
| **M17** Student Profile | Files tab | 2 | Yes | ✅ Built | |
| **M17** Student Profile | Calendar tab | 1 | Yes | ✅ Built | |
| **M18** Guardian Profile | 7 tabs (Overview/Students/Invoices/Messages/Concerns/Tickets/Referrals) | 1/2 | `/guardians/[id]` | ✅ Built | Full tab set |
| **M18** Guardian Profile | Linked students | 1 | Students tab | ✅ Built | |
| **M18** Guardian Profile | DNC status (editable) | 1 | Overview edit dialog | ✅ Built | |
| **M18** Guardian Profile | Communication preferences | 2 | `preferredChannel` field | ✅ Built | WhatsApp/Email selection |
| **M18** Guardian Profile | Profile update link (send from profile) | 2 | Not on guardian profile | ❌ Not built | Only referenced in `/people` forms list |
| **M18** Guardian Profile | Referrals tab | 2 | Yes | ✅ Built | |
| **M18** Guardian Profile | Erasure (right-to-be-forgotten) | 1 | Not in UI | ❌ Not built | |
| **M19** Progress Tracking & Reports | Progress page with 4 tabs | 2 | `/progress` Trackers/Reports/Alerts/Assignments | ✅ Built | |
| **M19** Progress Tracking & Reports | Progress tracker | 2 | Trackers tab | ✅ Built | Grid view |
| **M19** Progress Tracking & Reports | Academic alerts | 2 | Alerts tab | ✅ Built | Alert list |
| **M19** Progress Tracking & Reports | Report approval workflow (kanban) | 2 | Reports tab kanban (Draft/Teacher Ready/HOD Approval/…) | ✅ Built | Kanban columns |
| **M19** Progress Tracking & Reports | AI narrative generation | 2 | Static narrative text only | 🟡 Partial | No regenerate button |
| **M19** Progress Tracking & Reports | Predicted grade engine | 2 | Predicted grade shown in tracker | 🟡 Partial | Static values; no compute |
| **M19** Progress Tracking & Reports | Assignment tracking | 2 | Assignments tab | 🟡 Partial | Simple list only |
| **M19** Progress Tracking & Reports | `reports.viewFinancial` gate on Reports Inbox | 2 | Permission defined | ✅ Built | Applied in role-config |
| **M19** Progress Tracking & Reports | Intervention tracking | 2 | Not in prototype | ❌ Not built | |
| **M19** Progress Tracking & Reports | Two-year tracker lock | 2 | Not in prototype | ❌ Not built | |
| **M19** Progress Tracking & Reports | Past-paper section | 2 | Not in prototype | ❌ Not built | |
| **M19** Progress Tracking & Reports | Generate Report dialog | 2 | `components/reports/generate-report-dialog.tsx` | ✅ Built | Functional |
| **M20** Tenant Settings | 17 sections (nav) | 1/2 | `/settings` with all 17 sections | ✅ Built | Organisation/Branches/Departments/Rooms/Billing/Payment Plans/Academic Calendar/Subjects/Staff HR/Roles/Notifications/Templates/Feature Toggles/Integrations/Churn/Audit Log/Data & Privacy |
| **M20** Tenant Settings | Organisation (interactive) | 1 | Yes | ✅ Built | Editable |
| **M20** Tenant Settings | Branches (interactive) | 1 | Yes | ✅ Built | Add/edit/archive |
| **M20** Tenant Settings | Departments (interactive) | 1 | Yes | ✅ Built | Add/edit/archive, colour picker |
| **M20** Tenant Settings | Rooms (interactive) | 1 | Yes | ✅ Built | Capacity, branch, soft/hard caps |
| **M20** Tenant Settings | Academic calendar (interactive) | 1 | Yes | ✅ Built | Terms, holidays, department pauses, ribbon view |
| **M20** Tenant Settings | Billing & invoicing (incl. revenue tags) | 1/2 | Billing section with Revenue Tags | ✅ Built | Includes bank/revenue routing |
| **M20** Tenant Settings | Payment plans | 2 | Section exists | 🟡 Partial | Static content; no interactive plan builder |
| **M20** Tenant Settings | Subjects & catalogue | 1 | Dedicated file | ✅ Built | Interactive |
| **M20** Tenant Settings | Staff & HR | 2 | Section | 🟡 Partial | Static content |
| **M20** Tenant Settings | Roles & permissions (interactive matrix) | 1 | Interactive permissions table | ✅ Built | Per-action per-role toggles |
| **M20** Tenant Settings | Notifications | 3 | Section | 🟡 Partial | Static content; no live routing editor |
| **M20** Tenant Settings | Templates | 2 | Section | 🟡 Partial | Overlap with `/automations` |
| **M20** Tenant Settings | Feature toggles | 3 | Section | 🟡 Partial | Static toggles |
| **M20** Tenant Settings | Integrations | 3 | Section with "Phase 2" copy | 🟡 Partial | Explicit placeholder |
| **M20** Tenant Settings | Churn & dashboard weights | 2 | Section | 🟡 Partial | Settings exists |
| **M20** Tenant Settings | Audit log | 1 | Section | 🟡 Partial | Static/list shell |
| **M20** Tenant Settings | Data & privacy | 1 | Section | 🟡 Partial | Static content |
| **REF-01** Notifications | Central notification catalogue (79+ entries) | 3 | Notifications section placeholder | 🟡 Partial | No catalogue table |
| **REF-01** Notifications | Per-tenant routing overrides | 3 | Not in prototype | 🔵 Phase 2 | Band 3 |
| **REF-01** Notifications | Test dispatch | 3 | Not in prototype | 🔵 Phase 2 | Band 3 |
| **Cross** | Global search | 1/2 | `components/layout/global-search.tsx` | ✅ Built | Top bar search |
| **Cross** | Top bar (branch picker, bell, avatar) | 1 | `components/layout/top-bar.tsx` | ✅ Built | All elements |
| **Cross** | Side nav (role-scoped) | 1 | `components/layout/app-sidebar.tsx` | ✅ Built | Role-gated items |
| **Cross** | User profile page | 1 | `/profile` | ✅ Built | Basic profile |
| **Cross** | Skeleton loaders | 1 | `components/ui/skeleton-loader.tsx` | ✅ Built | Used on dashboard |
| **Cross** | Access denied screens | 1 | `components/ui/access-denied.tsx` | ✅ Built | Used throughout |
| **Cross** | Role banner (Teacher/TA context) | 2 | `components/ui/role-banner.tsx` | ✅ Built | Used on progress, feedback, etc. |

---

## Summary

| Status | Count | % |
|---|---|---|
| ✅ Built | 113 | 57% |
| 🟡 Partial | 48 | 24% |
| ❌ Not built | 30 | 15% |
| 🔵 Phase 2 | 5 | 3% |
| ⬜ Backend only | 2 | 1% |
| **Total** | **198** | **100%** |

---

## Top 10 priorities not yet built (prototype gaps only — exclude Phase 2)

Ranked by visibility and user-facing importance for a stakeholder demo:

1. **M01 — Lead duplicate detection modal** (`❌ Not built`)  
   On "new lead" create, there is no check against existing guardian phone/email/child+year combinations. Every onboarding demo hits the creation flow and reviewers will expect a "we found a match" intercept.

2. **M02/M18 — Guardian DNC contact-attempt interstitial** (`🟡 Partial → ❌ core interaction missing`)  
   DNC is rendered as a badge, but clicking a Contact/Message action does not surface the required warning-and-acknowledge modal. This is a locked compliance rule (AMD-01) that reviewers explicitly look for.

3. **M06 — Makeup booking flow** (`❌ Not built`)  
   The makeup log displays existing entries but there is no "Book makeup" dialog from a student's absence row. Teachers and admins reviewing attendance remediation will notice immediately.

4. **M14 — Quick Score Entry from session** (`❌ Not built`)  
   The primary teacher path for classwork scoring. Teachers clicking into a session on `/timetable` have no scoring UI, and nothing in Progress → Assignments fills the gap.

5. **M18 — Profile update link generation on guardian profile** (`❌ Not built`)  
   The feature is referenced only in the `/people` forms list. There is no "Send profile update link" button on the guardian profile, no token preview, and no expiry display — a key self-service story.

6. **M05 — Operating-hours and public-holiday soft warnings** (`❌ Not built`)  
   Creating a session on a public holiday or outside operating hours produces no warning. This is Band 1 locked behaviour — an obvious omission when anyone demos the scheduling flow.

7. **M01 — Auto-inactive 60-day lead archive workflow** (`❌ Not built`)  
   No warning banner, no auto-archiving task, no archived-lead surface. A core retention/hygiene story that demos well as an "always-on" housekeeping feature.

8. **M08 — Bulk invoicing flow** (`🟡 Partial → flow missing`)  
   The permission and button exist but the actual flow (pick enrolments → preview → generate in batch) is not implemented. Finance users treat this as a primary power feature.

9. **M09 — Off-boarding hard-block checklist** (`❌ Not built`)  
   The permission exists but the three hard-block checklist (open sessions / open concerns / outstanding marking) is not surfaced. Key HR-compliance narrative in Band 2.

10. **M16 — Recurring tasks** (`❌ Not built`)  
    The PRD makes recurring tasks a first-class feature shared with timetable recurrence. There is no recurrence UI or management tab in `/tasks`, despite list/kanban/calendar all being built.
