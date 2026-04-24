# Permissions Audit

Derived from live permission checks in each page file, resolved against the `PERMISSIONS` matrix in `lib/role-config.ts`.

**Key:** ✓ = role has the gating permission · — = role lacks it (feature hidden/disabled) · ? = could not be resolved (see note beneath section)

---

### /dashboard

Page access is ungated. All roles reach the page. Individual KPI cards are gated via `KPI_PERMISSIONS` map (added Session 10) — each card ID maps to a `can()` action or `null` (always visible).

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access (no gate) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Revenue / Collected / Overdue KPIs · `finance.view` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| New Enrolments / Re-enrolments KPIs · `enrolment.view` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Churn / At-Risk / Occupancy KPIs · `analytics.view` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Active Staff / CPD Completion KPIs · `staff.view` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Role-scoped KPIs (always visible when in role config) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

### /students

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `students.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Import button · `import` | ✓ | — | — | — | — | — | — | — |
| Export button · `export` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Add Student button · `students.create` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Export toolbar (in-list) · `students.export` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Row action — Add enrolment · `enrolment.create` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Row action — New task · `tasks.create` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Row action — Withdraw student · `enrolment.withdraw` | ✓ | ✓ | ✓ | — | — | — | — | — |

---

### /students/[id]

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `students.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit sections — personal / academic / family · `students.edit` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Invoices tab visibility · `students.viewFinancial` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Edit action buttons · `students.edit` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Export · `export` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Delete · `delete.records` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Escalate / approve discount · `approve.discount` | ✓ | ✓ | — | — | — | — | — | ✓ |

---

### /guardians

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `guardians.view` | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ |
| Export button · `export` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Add Guardian button · `guardians.create` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Row action — Add Student · `students.create` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Row action — Archive · `guardians.edit` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Row action — Delete · `delete.records` | ✓ | ✓ | ✓ | — | — | — | — | — |

---

### /guardians/[id]

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `guardians.view` | ✓ | ✓ | ✓ | — | — | — | — | — |
| *(No additional inline permission checks found)* | | | | | | | | |

---

### /leads

> `leads.view` now covers all eight roles. Academic Head, HOD, Teacher, TA, and HR/Finance can reach the page but most write actions remain locked. Convert to Student is gated by `leads.convertToStudent` (Super Admin, Admin Head, Admin, Academic Head, HOD, HR/Finance). Pipeline advance buttons (Send Invoice, Record Payment) remain gated by `leads.advancePipeline` (Super Admin, Admin Head, Admin, HR/Finance).

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `leads.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export button · `export` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Add Lead button · `leads.create` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Row action — Convert to Student · `leads.convertToStudent` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Row action — Mark as Lost · `delete.records` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Row action — Archive · `delete.records` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Pipeline advance actions (Send Invoice, Record Payment) · `leads.advancePipeline` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |

---

### /enrolment

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `enrolment.view` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | — |
| Export button · `export` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| New Enrolment button · `enrolment.create` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Withdraw button · `enrolment.withdraw` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Row menu — Edit Enrolment · `enrolment.edit` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Row menu — Add Subject · `enrolment.edit` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Row menu — Withdraw · `enrolment.withdraw` | ✓ | ✓ | ✓ | — | — | — | — | — |

---

### /timetable

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `timetable.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Create Session button · `timetable.createSession` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Edit session action · `timetable.editSession` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | — |
| Cancel session action · `timetable.cancelSession` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |

---

### /attendance

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `attendance.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Export button · `export` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Mark attendance · `attendance.mark` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Correct attendance · `attendance.correct` | ✓ | ✓ | ✓ | — | ✓ | — | — | — |
| Unlock attendance window · `attendance.unlockWindow` | ✓ | ✓ | — | — | — | — | — | — |
| Book makeup · `attendance.bookMakeup` | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | — |
| Override makeup eligibility · `attendance.overrideMakeup` | ✓ | ✓ | — | — | ✓ | — | — | — |

---

### /assessments

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `assessments.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Book assessment button · `assessments.book` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Enter outcome · `assessments.enterOutcome` | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | — |
| Slots tab · `assessments.manageSlots` | ✓ | ✓ | ✓ | — | — | — | — | — |

---

### /progress

> HR/Finance has the `export` key but lacks `progress.view`, so they are blocked at the page guard and will never see the export button.

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `progress.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Export button · `export` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Approve report button (Pending HOD status) · `progress.approveReport` | ✓ | ✓ | — | ✓ | ✓ | — | — | — |

---

### /feedback

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `feedback.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Approve action (also gated by `status === "Pending Approval"`) · `feedback.approve` | ✓ | ✓ | — | ✓ | ✓ | — | — | — |
| Post discussion · `feedback.postDiscussion` | ✓ | ✓ | — | ✓ | ✓ | ✓ | — | — |

---

### /communications

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `feedback.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Resolve complaint · `feedback.resolveComplaint` | ✓ | ✓ | — | ✓ | — | — | — | — |
| Send survey · `feedback.sendSurvey` | ✓ | ✓ | ✓ | ✓ | — | — | — | — |

---

### /finance

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `finance.view` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Bulk generate invoices · `bulk.generate.invoices` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Export button · `export` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| New Invoice button · `finance.createInvoice` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Log payment (per-row, also status-gated) · `finance.logPayment` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Issue credit · `issue.credit` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Finance export · `finance.export` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |

---

### /staff

> Performance tab and HR Dashboard tab use direct `role` comparisons (not `can()`); resolved manually from the role strings in the code.

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `staff.view` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Export button · `export` | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| Add Staff button · `staff.create` | ✓ | ✓ | — | — | — | — | — | ✓ |
| Edit staff · `staff.edit` | ✓ | ✓ | — | — | — | — | — | ✓ |
| Set leave (active staff only) · `staff.edit` | ✓ | ✓ | — | — | — | — | — | ✓ |
| Deactivate (non-inactive staff only) · `staff.revokeAccess` | ✓ | — | — | — | — | — | — | ✓ |
| View CPD detail · `staff.viewCPDDetail` | ✓ | ✓ | — | — | — | — | — | ✓ |
| Performance tab (role check: `role !== 'Teacher' && role !== 'TA'`) | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| HR Dashboard tab (role check: Super Admin, Admin Head, or HR/Finance) | ✓ | ✓ | — | — | — | — | — | ✓ |

---

### /tasks

> Line 150 filters task action items via a dynamic `can(item.permission)` call where the key is data-driven. The full set of permission keys used depends on the action item definitions elsewhere in the file, which were not captured by the grep.

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `tasks.view` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| New Task button · `tasks.create` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Task action items (dynamic `can(item.permission)`) | ? | ? | ? | ? | ? | ? | ? | ? |

---

### /automations

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `automations.view` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Create rule · `automations.createRule` | ✓ | ✓ | — | — | — | — | — | — |
| Edit rule · `automations.editRule` | ✓ | ✓ | — | — | — | — | — | — |
| Toggle rule · `automations.toggleRule` | ✓ | ✓ | — | — | — | — | — | — |
| Org-Wide template owner · `templates.approveOrgWide` | ✓ | ✓ | — | — | — | — | — | — |

---

### /inventory

> Teacher has `stock.take` but lacks `inventory.view`, so they are blocked at the page guard and will never see the stock take button. TA now has both `inventory.view` and `stock.take`.

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `inventory.view` | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Stock take button · `stock.take` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

### /people

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `people.view` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Merge duplicates · `merge.duplicates` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Student merge action · `students.merge` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — |
| Create segment · `people.createSegment` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Org-Wide segment scope · `people.createOrgSegment` | ✓ | ✓ | — | ✓ | — | — | — | — |
| Export · `people.export` | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ |
| Exports tab visibility · `people.export` | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ |
| Manage broadcasts · `people.manageBroadcasts` | ✓ | ✓ | ✓ | — | — | — | — | — |
| Manage forms · `people.manageForms` | ✓ | ✓ | — | — | — | — | — | — |

---

### /analytics

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `analytics.view` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Staff performance tab · `analytics.viewStaffPerformance` | ✓ | ✓ | — | — | — | — | — | ✓ |

---

### /reports

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `reports.view` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Generate report button · `reports.generate` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| Export all button · `export.all` | ✓ | — | — | — | — | — | — | ✓ |
| Schedule report button · `reports.schedule` | ✓ | ✓ | — | ✓ | ✓ | — | — | ✓ |

---

### /settings

| Feature | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| Page access · `settings.view` | ✓ | — | — | — | — | — | — | — |
| Manage roles · `manage.roles` | ✓ | — | — | — | — | — | — | — |
