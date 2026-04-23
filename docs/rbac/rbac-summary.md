# RBAC Summary

Source files: `lib/role-config.ts`, `lib/use-permission.ts`, `lib/role-context.tsx`

The app has **8 roles**: Super Admin, Admin Head, Admin, Academic Head, HOD, Teacher, TA, HR/Finance.

Role is initialised from `currentUser.role` in mock-data and is mutable at runtime (prototype role-switcher). No column-visibility, row-filtering, or tab-hiding rules are defined in these three files — those would live in individual page components.

`canAccess(role, navId)` returns `true` for any nav ID not listed in `NAV_ACCESS`, and for the `dashboard` entry (whose action string is empty). All roles therefore see the Dashboard.

---

## Super Admin

**Nav items visible:** dashboard, students, guardians, leads, enrolment, timetable, attendance, assessments, progress, finance, staff, tasks, analytics, reports, **settings**, feedback, communications, people, automations, inventory *(all nav items)*

**Actions:**
- Students: `view`, `create`, `edit`, `delete`, `merge`, `export`, `viewFinancial`, `editYearGroup`, `bulkProgress`
- Guardians: `view`, `create`, `edit`, `setDNC`
- Leads: `view`, `create`, `edit`, `delete`, `convert`, `assignStaff`, `advancePipeline`, `advanceBeyondScheduled`, `convertToStudent`
- Enrolment: `view`, `create`, `edit`, `withdraw`, `pause`, `transferSibling`
- Finance: `view`, `createInvoice`, `editInvoice`, `voidInvoice`, `logPayment`, `applyDiscount`, `requestDiscount`, `issueCredit`, `requestRefund`, `approveRefund`, `finalApproveRefund`, `waiveFee`, `markBadDebt`, `export`, `viewSalary`
- Timetable: `view`, `createSession`, `editSession`, `cancelSession`, `assignTeacher`
- Attendance: `view`, `mark`, `correct`, `unlockWindow`, `bookMakeup`, `overrideMakeup`
- Feedback: `view`, `submit`, `approve`, `raiseComplaint`, `resolveComplaint`, `sendSurvey`, `postDiscussion`
- Progress: `view`, `enterGrades`, `approveReport`, `generateReport`, `dismissAlert`, `setTargetGrade`
- Concerns: `raise`, `dismissL1`, `dismissL2plus`
- Tasks: `view`, `create`, `editOwn`, `editOthers`, `deleteOwn`, `deleteOthers`, `reassign`
- Staff: `view`, `create`, `edit`, `viewSalary`, `assignRole`, `revokeAccess`, `initiateOffboarding`, `verifyCPD`, `activateEmergencyLeave`, `viewCPDDetail`
- Automations: `view`, `createRule`, `editRule`, `deleteRule`, `toggleRule`
- Templates: `create`, `approveOrgWide`, `editOrgWide`
- People: `view`, `export`, `createSegment`, `createOrgSegment`, `manageForms`, `manageBroadcasts`
- Assessments: `view`, `book`, `enterOutcome`, `manageSlots`
- Analytics: `view`, `viewStaffPerformance`
- Reports: `view`, `generate`, `schedule`, `export`, `viewFinancial`
- Settings: `view`, `edit`, `manageRoles`, `manageBilling`
- Catalogue/Academic config: `catalogue.edit`, `topic.edit`, `grades.edit`, `feedback.selectors.edit`
- Bulk/cross-module: `export` (bulk export), `import` (only role with this), `delete.records`, `issue.credit`, `approve.discount`, `offboard.staff`, `manage.roles` (only role with this), `merge.duplicates`, `export.all`, `bulk.generate.invoices`, `stock.take`
- Inventory: `view`

**Notes:** Only role that can `students.delete`, `finance.finalApproveRefund`, `staff.assignRole`, `settings.*`, `import`, `manage.roles`.

---

## Admin Head

**Nav items visible:** dashboard, students, guardians, leads, enrolment, timetable, attendance, assessments, progress, finance, staff, tasks, analytics, reports, feedback, communications, people, automations, inventory *(everything except settings)*

**Actions:**
- Students: `view`, `create`, `edit`, `merge`, `export`, `viewFinancial`, `editYearGroup`, `bulkProgress` — **not** `delete`
- Guardians: `view`, `create`, `edit`, `setDNC`
- Leads: `view`, `create`, `edit`, `delete`, `convert`, `assignStaff`, `advancePipeline`, `advanceBeyondScheduled`, `convertToStudent`
- Enrolment: `view`, `create`, `edit`, `withdraw`, `pause`, `transferSibling`
- Finance: `view`, `createInvoice`, `editInvoice`, `voidInvoice`, `logPayment`, `applyDiscount`, `requestDiscount`, `issueCredit`, `requestRefund`, `approveRefund`, `waiveFee`, `markBadDebt`, `export` — **not** `finalApproveRefund`, `viewSalary`
- Timetable: `view`, `createSession`, `editSession`, `cancelSession`, `assignTeacher`
- Attendance: `view`, `mark`, `correct`, `unlockWindow`, `bookMakeup`, `overrideMakeup`
- Feedback: `view`, `submit`, `approve`, `raiseComplaint`, `resolveComplaint`, `sendSurvey`, `postDiscussion`
- Progress: `view`, `enterGrades`, `approveReport`, `generateReport`, `dismissAlert`, `setTargetGrade`
- Concerns: `raise`, `dismissL1`, `dismissL2plus`
- Tasks: `view`, `create`, `editOwn`, `editOthers`, `deleteOwn`, `deleteOthers`, `reassign`
- Staff: `view`, `create`, `edit`, `initiateOffboarding`, `activateEmergencyLeave`, `viewCPDDetail` — **not** `viewSalary`, `assignRole`, `revokeAccess`, `verifyCPD`
- Automations: `view`, `createRule`, `editRule`, `deleteRule`, `toggleRule`
- Templates: `create`, `approveOrgWide`, `editOrgWide`
- People: `view`, `export`, `createSegment`, `createOrgSegment`, `manageForms`, `manageBroadcasts`
- Assessments: `view`, `book`, `enterOutcome`, `manageSlots`
- Analytics: `view`, `viewStaffPerformance`
- Reports: `view`, `generate`, `schedule`
- Catalogue/Academic config: `catalogue.edit` — **not** `topic.edit`, `grades.edit`, `feedback.selectors.edit`
- Bulk/cross-module: `export`, `delete.records`, `issue.credit`, `approve.discount`, `offboard.staff`, `merge.duplicates`, `bulk.generate.invoices`, `stock.take` — **not** `import`, `export.all`, `manage.roles`
- Inventory: `view`

---

## Admin

**Nav items visible:** dashboard, students, guardians, leads, enrolment, timetable, attendance, assessments, progress, finance, staff, tasks, analytics, reports, feedback, communications, people, automations, inventory — **not** settings

**Actions:**
- Students: `view`, `create`, `edit`, `merge`, `export`, `viewFinancial`, `editYearGroup`, `bulkProgress` — **not** `delete`
- Guardians: `view`, `create`, `edit`, `setDNC`
- Leads: `view`, `create`, `edit`, `convert`, `assignStaff`, `advancePipeline`, `advanceBeyondScheduled`, `convertToStudent` — **not** `delete`
- Enrolment: `view`, `create`, `edit`, `withdraw`, `pause` — **not** `transferSibling`
- Finance: `view`, `createInvoice`, `editInvoice`, `voidInvoice`, `logPayment`, `requestDiscount`, `issueCredit`, `requestRefund`, `waiveFee`, `export` — **not** `applyDiscount`, `approveRefund`, `finalApproveRefund`, `markBadDebt`, `viewSalary`
- Timetable: `view`, `createSession`, `editSession`, `cancelSession`, `assignTeacher`
- Attendance: `view`, `mark`, `correct`, `bookMakeup` — **not** `unlockWindow`, `overrideMakeup`
- Feedback: `view`, `raiseComplaint`, `sendSurvey` — **not** `submit`, `approve`, `resolveComplaint`, `postDiscussion`
- Progress: `view`, `generateReport` — **not** `enterGrades`, `approveReport`, `dismissAlert`, `setTargetGrade`
- Concerns: `raise` — **not** `dismissL1`, `dismissL2plus`
- Tasks: `view`, `create`, `editOwn`, `deleteOwn`, `reassign` — **not** `editOthers`, `deleteOthers`
- Staff: `view` only — **not** `create`, `edit`, `viewSalary`, `assignRole`, `revokeAccess`, `initiateOffboarding`, `verifyCPD`, `activateEmergencyLeave`, `viewCPDDetail`
- Automations: `view` only — **not** `createRule`, `editRule`, `deleteRule`, `toggleRule`
- Templates: `create` — **not** `approveOrgWide`, `editOrgWide`
- People: `view`, `export`, `createSegment`, `manageBroadcasts` — **not** `createOrgSegment`, `manageForms`
- Assessments: `view`, `book`, `enterOutcome`, `manageSlots`
- Analytics: `view` — **not** `viewStaffPerformance`
- Reports: `view`, `generate`, `export`, `viewFinancial` — **not** `schedule`
- Bulk/cross-module: `export`, `delete.records`, `issue.credit`, `merge.duplicates`, `bulk.generate.invoices`, `stock.take` — **not** `import`, `approve.discount`, `offboard.staff`, `export.all`, `manage.roles`
- Inventory: `view`

---

## Academic Head

**Nav items visible:** dashboard, students, guardians, leads, enrolment, timetable, attendance, assessments, progress, staff, tasks, analytics, reports, feedback, communications, people, inventory — **not** finance, settings, automations

**Actions:**
- Students: `view`, `create`, `edit`, `merge`, `export`, `editYearGroup` — **not** `delete`, `viewFinancial`, `bulkProgress`
- Guardians: `view` — **not** `create`, `edit`, `setDNC`
- Leads: `view`, `advanceBeyondScheduled`, `convertToStudent` — **not** `create`, `edit`, `delete`, `convert`, `assignStaff`, `advancePipeline`
- Enrolment: `view` — **not** `create`, `edit`, `withdraw`, `pause`, `transferSibling`
- Finance: **none** (not in `finance.view`)
- Timetable: `view`, `createSession`, `editSession`, `cancelSession` — **not** `assignTeacher`
- Attendance: `view`, `mark`, `bookMakeup` — **not** `correct`, `unlockWindow`, `overrideMakeup`
- Feedback: `view`, `submit`, `approve`, `raiseComplaint`, `resolveComplaint`, `sendSurvey`, `postDiscussion`
- Progress: `view`, `enterGrades`, `approveReport`, `generateReport`, `dismissAlert`, `setTargetGrade`
- Concerns: `raise`, `dismissL1`, `dismissL2plus`
- Tasks: `view`, `create`, `editOwn`, `editOthers`, `deleteOwn`, `reassign` — **not** `deleteOthers`
- Staff: `view` only
- Automations: **none** (not in `automations.view`)
- Templates: `create` — **not** `approveOrgWide`, `editOrgWide`
- People: `view`, `export`, `createSegment`, `createOrgSegment` — **not** `manageForms`, `manageBroadcasts`
- Assessments: `view` only — **not** `book`, `enterOutcome`, `manageSlots`
- Analytics: `view` — **not** `viewStaffPerformance`
- Reports: `view`, `generate`, `schedule`, `export` — **not** `viewFinancial`
- Academic config: `topic.edit`, `grades.edit`, `feedback.selectors.edit` — **not** `catalogue.edit`
- Bulk/cross-module: `stock.take` only — **not** `export`, `import`, `approve.discount`, `delete.records`, `merge.duplicates`, `bulk.generate.invoices`, `export.all`, `manage.roles`
- Inventory: `view`

---

## HOD

**Nav items visible:** dashboard, students, leads, timetable, attendance, assessments, progress, staff, tasks, analytics, reports, feedback, communications, people, inventory — **not** guardians, enrolment, finance, settings, automations

**Actions:**
- Students: `view`, `create`, `edit`, `merge`, `export`, `editYearGroup` — **not** `delete`, `viewFinancial`, `bulkProgress`
- Guardians: **none**
- Leads: `view`, `advanceBeyondScheduled`, `convertToStudent` — **not** `create`, `edit`, `delete`, `convert`, `assignStaff`, `advancePipeline`
- Enrolment: **none**
- Finance: **none** (not in `finance.view`)
- Timetable: `view`, `createSession`, `cancelSession` — **not** `editSession`, `assignTeacher`
- Attendance: `view`, `mark`, `correct`, `bookMakeup`, `overrideMakeup` — **not** `unlockWindow`
- Feedback: `view`, `submit`, `approve`, `postDiscussion` — **not** `raiseComplaint`, `resolveComplaint`, `sendSurvey`
- Progress: `view`, `enterGrades`, `approveReport`, `generateReport`, `dismissAlert`, `setTargetGrade`
- Concerns: `raise`, `dismissL1`, `dismissL2plus`
- Tasks: `view`, `create`, `editOwn`, `editOthers`, `deleteOwn`, `reassign` — **not** `deleteOthers`
- Staff: `view` only
- Automations: **none**
- Templates: `create` — **not** `approveOrgWide`, `editOrgWide`
- People: `view`, `createSegment` — **not** `export`, `createOrgSegment`, `manageForms`, `manageBroadcasts`
- Assessments: `view`, `enterOutcome` — **not** `book`, `manageSlots`
- Analytics: `view` — **not** `viewStaffPerformance`
- Reports: `view`, `generate`, `schedule`, `export` — **not** `viewFinancial`
- Academic config: `topic.edit`, `grades.edit`, `feedback.selectors.edit` — **not** `catalogue.edit`
- Bulk/cross-module: `stock.take` only
- Inventory: `view`

---

## Teacher

**Nav items visible:** dashboard, students, leads, enrolment, timetable, attendance, assessments, progress, tasks, feedback, communications — **not** guardians, finance, staff, analytics, reports, settings, people, automations, inventory

**Actions:**
- Students: `view` only — **not** `create`, `edit`, `delete`, `merge`, `export`, `viewFinancial`, `editYearGroup`, `bulkProgress`
- Leads: `view` only — **not** `create`, `edit`, `delete`, `convert`, `assignStaff`, `advancePipeline`, `convertToStudent`
- Enrolment: `view` only — **not** `create`, `edit`, `withdraw`, `pause`, `transferSibling`
- Timetable: `view`, `editSession` — **not** `createSession`, `cancelSession`, `assignTeacher`
- Attendance: `view`, `mark`, `bookMakeup` — **not** `correct`, `unlockWindow`, `overrideMakeup`
- Feedback: `view`, `submit`, `postDiscussion` — **not** `approve`, `raiseComplaint`, `resolveComplaint`, `sendSurvey`
- Progress: `view`, `enterGrades`, `setTargetGrade` — **not** `approveReport`, `generateReport`, `dismissAlert`
- Concerns: `raise` — **not** `dismissL1`, `dismissL2plus`
- Tasks: `view`, `create`, `editOwn`, `editOthers`, `deleteOwn`, `deleteOthers`, `reassign`
- Assessments: `view`, `enterOutcome` — **not** `book`, `manageSlots`
- Templates: `create` — **not** `approveOrgWide`, `editOrgWide`
- People: `createSegment` only — nav not visible (not in `people.view`) — **not** `export`, `createOrgSegment`, `manageForms`, `manageBroadcasts`
- Bulk/cross-module: `stock.take` only
- Finance, Staff, Automations, Analytics, Reports, Settings, Inventory: **none**

---

## TA (Teaching Assistant)

**Nav items visible:** dashboard, students, leads, enrolment, timetable, attendance, assessments, progress, tasks, feedback, communications, inventory — **not** guardians, finance, staff, analytics, reports, settings, people, automations

**Actions:**
- Students: `view` only — **not** `create`, `edit`, `delete`, `merge`, `export`, `viewFinancial`, `editYearGroup`, `bulkProgress`
- Leads: `view` only — **not** `create`, `edit`, `delete`, `convert`, `assignStaff`, `advancePipeline`, `convertToStudent`
- Enrolment: `view` only — **not** `create`, `edit`, `withdraw`, `pause`, `transferSibling`
- Timetable: `view`, `editSession` — **not** `createSession`, `cancelSession`, `assignTeacher`
- Attendance: `view`, `bookMakeup` — **not** `mark`, `correct`, `unlockWindow`, `overrideMakeup`
- Feedback: `view` only — **not** `submit`, `approve`, `raiseComplaint`, `resolveComplaint`, `sendSurvey`, `postDiscussion`
- Progress: `view` only — **not** `enterGrades`, `approveReport`, `generateReport`, `dismissAlert`, `setTargetGrade`
- Concerns: `raise` — **not** `dismissL1`, `dismissL2plus`
- Tasks: `view`, `create`, `editOwn`, `editOthers`, `deleteOwn`, `deleteOthers`, `reassign`
- Assessments: `view`, `enterOutcome` — **not** `book`, `manageSlots`
- Templates: `create` — **not** `approveOrgWide`, `editOrgWide`
- People: **none** (not in `people.view` or `people.createSegment`)
- Inventory: `view`, `stock.take`
- Bulk/cross-module: `stock.take` only
- Finance, Staff, Automations, Analytics, Reports, Settings: **none**

---

## HR/Finance

**Nav items visible:** dashboard, students, guardians, leads, finance, staff, tasks, analytics, reports, people, inventory — **not** enrolment, timetable, attendance, assessments, progress, feedback, communications, settings, automations

**Actions:**
- Students: `view`, `export`, `viewFinancial` — **not** `create`, `edit`, `delete`, `merge`, `editYearGroup`, `bulkProgress`
- Guardians: `view`, `create`, `edit` — **not** `setDNC`
- Leads: `view`, `advancePipeline`, `advanceBeyondScheduled`, `convertToStudent` — **not** `create`, `edit`, `delete`, `convert`, `assignStaff`
- Enrolment: **none**
- Finance: `view`, `createInvoice`, `editInvoice`, `voidInvoice`, `logPayment`, `applyDiscount`, `requestDiscount`, `issueCredit`, `requestRefund`, `waiveFee`, `markBadDebt`, `export`, `viewSalary` — **not** `approveRefund`, `finalApproveRefund`
- Timetable: **none**
- Attendance: **none**
- Feedback: **none** (not in `feedback.view`)
- Progress: **none**
- Concerns: **none**
- Tasks: `view`, `create`, `editOwn` — **not** `deleteOwn`, `editOthers`, `deleteOthers`, `reassign`
- Staff: `view`, `create`, `edit`, `viewSalary`, `revokeAccess`, `initiateOffboarding`, `verifyCPD`, `viewCPDDetail` — **not** `assignRole`, `activateEmergencyLeave`
- Automations: **none**
- Templates: `create` — **not** `approveOrgWide`, `editOrgWide`
- People: `view`, `export` — **not** `createSegment`, `createOrgSegment`, `manageForms`, `manageBroadcasts`
- Assessments: **none**
- Analytics: `view`, `viewStaffPerformance`
- Reports: `view`, `generate`, `schedule`, `viewFinancial` — **not** `export`
- Bulk/cross-module: `export`, `issue.credit`, `approve.discount`, `offboard.staff`, `stock.take`, `export.all` — **not** `import`, `delete.records`, `merge.duplicates`, `bulk.generate.invoices`, `manage.roles`
- Inventory: `view`

---

## Unassigned permissions

All permission keys in `PERMISSIONS` have at least one role assigned. No unassigned entries exist.

---

## Quick reference matrix

| Nav item | Super Admin | Admin Head | Admin | Academic Head | HOD | Teacher | TA | HR/Finance |
|---|---|---|---|---|---|---|---|---|
| dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| students | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| guardians | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ |
| leads | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| enrolment | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | — |
| timetable | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| attendance | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| assessments | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| progress | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| finance | ✓ | ✓ | ✓ | — | — | — | — | ✓ |
| staff | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| tasks | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| analytics | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| reports | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| settings | ✓ | — | — | — | — | — | — | — |
| feedback | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| communications | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| people | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ |
| automations | ✓ | ✓ | ✓ | — | — | — | — | — |
| inventory | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
