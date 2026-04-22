// ─── Role type ────────────────────────────────────────────────────────────────

export type Role =
  | 'Super Admin'
  | 'Admin Head'
  | 'Admin'
  | 'Academic Head'
  | 'HOD'
  | 'Teacher'
  | 'TA'
  | 'HR/Finance'

// ─── Nav access map ───────────────────────────────────────────────────────────
// Maps sidebar nav IDs to the permission action required to see them.

const NAV_ACCESS: Record<string, string> = {
  dashboard:   '',
  students:    'students.view',
  guardians:   'guardians.view',
  leads:       'leads.view',
  enrolment:   'enrolment.view',
  timetable:   'timetable.view',
  attendance:  'attendance.view',
  assessments: 'assessments.view',
  progress:    'progress.view',
  finance:     'finance.view',
  staff:       'staff.view',
  tasks:       'tasks.view',
  analytics:   'analytics.view',
  reports:     'reports.view',
  settings:    'settings.view',
  feedback:        'feedback.view',
  communications:  'feedback.view',
  people:          'people.view',
  automations: 'automations.view',
  inventory:   'inventory.view',
}

export function canAccess(role: Role, navId: string): boolean {
  const action = NAV_ACCESS[navId]
  if (!action) return true
  return canDo(role, action)
}

// ─── Action permission matrix ─────────────────────────────────────────────────
// Each key is an action id. Value is the array of roles that can perform it.
// Used by canDo(role, action) throughout the app.

export const PERMISSIONS: Record<string, Role[]> = {

  // ── Students ──
  'students.view':            ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher','TA'],
  'students.create':          ['Super Admin','Admin Head','Admin','Academic Head','HOD'],
  'students.edit':            ['Super Admin','Admin Head','Admin','Academic Head','HOD'],
  'students.delete':          ['Super Admin'],
  'students.merge':           ['Super Admin','Admin Head','Admin','Academic Head','HOD'],
  'students.export':          ['Super Admin','Admin Head','Admin','Academic Head','HOD','HR/Finance'],
  'students.viewFinancial':   ['Super Admin','Admin Head','Admin','HR/Finance'],
  'students.editYearGroup':   ['Super Admin','Admin Head','Admin','Academic Head','HOD'],
  'students.bulkProgress':    ['Super Admin','Admin Head','Admin'],

  // ── Guardians ──
  'guardians.view':           ['Super Admin','Admin Head','Admin'],
  'guardians.create':         ['Super Admin','Admin Head','Admin'],
  'guardians.edit':           ['Super Admin','Admin Head','Admin'],
  'guardians.setDNC':         ['Super Admin','Admin Head','Admin'],

  // ── Leads ──
  'leads.view':               ['Super Admin','Admin Head','Admin'],
  'leads.create':             ['Super Admin','Admin Head','Admin'],
  'leads.edit':               ['Super Admin','Admin Head','Admin'],
  'leads.delete':             ['Super Admin','Admin Head'],
  'leads.convert':            ['Super Admin','Admin Head','Admin'],
  'leads.assignStaff':        ['Super Admin','Admin Head','Admin'],

  // ── Enrolment ──
  'enrolment.view':           ['Super Admin','Admin Head','Admin'],
  'enrolment.create':         ['Super Admin','Admin Head','Admin'],
  'enrolment.edit':           ['Super Admin','Admin Head','Admin'],
  'enrolment.withdraw':       ['Super Admin','Admin Head','Admin'],
  'enrolment.pause':          ['Super Admin','Admin Head','Admin'],
  'enrolment.transferSibling':['Super Admin','Admin Head'],

  // ── Finance ──
  'finance.view':             ['Super Admin','Admin Head','Admin','Academic Head','HOD','HR/Finance'],
  'finance.createInvoice':    ['Super Admin','Admin Head','Admin','Academic Head','HOD','HR/Finance'],
  'finance.editInvoice':      ['Super Admin','Admin Head','Admin','HR/Finance'],
  'finance.voidInvoice':      ['Super Admin','Admin Head','Admin','Academic Head','HR/Finance'],
  'finance.logPayment':       ['Super Admin','Admin Head','Admin','HR/Finance'],
  'finance.applyDiscount':    ['Super Admin','Admin Head','Academic Head','HR/Finance'],
  'finance.requestDiscount':  ['Super Admin','Admin Head','Admin','HR/Finance'],
  'finance.issueCredit':      ['Super Admin','Admin Head','Admin','HR/Finance'],
  'finance.requestRefund':    ['Super Admin','Admin Head','Admin','Academic Head','HR/Finance'],
  'finance.approveRefund':    ['Super Admin','Admin Head'],
  'finance.finalApproveRefund':['Super Admin'],
  'finance.waiveFee':         ['Super Admin','Admin Head','Admin','HR/Finance'],
  'finance.markBadDebt':      ['Super Admin','Admin Head'],
  'finance.export':           ['Super Admin','Admin Head','Admin','HR/Finance'],
  'finance.viewSalary':       ['Super Admin','HR/Finance'],

  // ── Timetable / Sessions ──
  'timetable.view':           ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher','TA'],
  'timetable.createSession':  ['Super Admin','Admin Head','Admin','Academic Head','HOD'],
  'timetable.editSession':    ['Super Admin','Admin Head','Admin','Teacher','TA'],
  'timetable.cancelSession':  ['Super Admin','Admin Head','Admin','Academic Head','HOD'],
  'timetable.assignTeacher':  ['Super Admin','Admin Head','Admin'],

  // ── Attendance ──
  'attendance.view':          ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher','TA'],
  'attendance.mark':          ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher'],
  'attendance.correct':       ['Super Admin','Admin Head','Admin','HOD'],
  'attendance.unlockWindow':  ['Super Admin','Admin Head'],
  'attendance.bookMakeup':    ['Super Admin','Admin Head','Admin','Academic Head','Teacher','TA'],
  'attendance.overrideMakeup':['Super Admin','Admin Head','HOD'],

  // ── Feedback ──
  'feedback.view':            ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher','TA'],
  'feedback.submit':          ['Super Admin','Admin Head','Academic Head','HOD','Teacher'],
  'feedback.approve':         ['Super Admin','Admin Head','Academic Head','HOD'],
  'feedback.raiseComplaint':  ['Super Admin','Admin Head','Admin','Academic Head'],
  'feedback.resolveComplaint':['Super Admin','Admin Head','Academic Head'],
  'feedback.sendSurvey':      ['Super Admin','Admin Head','Admin','Academic Head'],
  'feedback.postDiscussion':  ['Super Admin','Admin Head','Academic Head','HOD','Teacher'],

  // ── Progress / Academic ──
  'progress.view':            ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher','TA'],
  'progress.enterGrades':     ['Super Admin','Admin Head','Academic Head','HOD','Teacher'],
  'progress.approveReport':   ['Super Admin','Admin Head','Academic Head','HOD'],
  'progress.generateReport':  ['Super Admin','Admin Head','Admin','Academic Head','HOD'],
  'progress.dismissAlert':    ['Super Admin','Admin Head','Academic Head','HOD'],
  'progress.setTargetGrade':  ['Super Admin','Admin Head','Academic Head','HOD'],

  // ── Concerns ──
  'concerns.raise':           ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher'],
  'concerns.dismissL1':       ['Super Admin','Admin Head','Academic Head','HOD'],
  'concerns.dismissL2plus':   ['Super Admin','Admin Head','Academic Head','HOD'],

  // ── Tasks ──
  'tasks.view':               ['Super Admin','Admin Head','Admin','Academic Head','HOD','HR/Finance'],
  'tasks.create':             ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher','TA','HR/Finance'],
  'tasks.editOwn':            ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher','TA','HR/Finance'],
  'tasks.editOthers':         ['Super Admin','Admin Head','Academic Head','HOD'],
  'tasks.deleteOwn':          ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher','TA'],
  'tasks.deleteOthers':       ['Super Admin','Admin Head'],
  'tasks.reassign':           ['Super Admin','Admin Head','Admin','Academic Head','HOD'],

  // ── Staff ──
  'staff.view':               ['Super Admin','Admin Head','Admin','Academic Head','HOD','HR/Finance'],
  'staff.create':             ['Super Admin','Admin Head','HR/Finance'],
  'staff.edit':               ['Super Admin','Admin Head','HR/Finance'],
  'staff.viewSalary':         ['Super Admin','HR/Finance'],
  'staff.assignRole':         ['Super Admin'],
  'staff.revokeAccess':       ['Super Admin','HR/Finance'],
  'staff.initiateOffboarding':['Super Admin','Admin Head','HR/Finance'],
  'staff.verifyCPD':          ['Super Admin','HR/Finance'],
  'staff.activateEmergencyLeave':['Super Admin','Admin Head'],

  // ── Automations / Templates ──
  'automations.view':         ['Super Admin','Admin Head','Admin'],
  'automations.createRule':   ['Super Admin','Admin Head'],
  'automations.editRule':     ['Super Admin','Admin Head'],
  'automations.deleteRule':   ['Super Admin','Admin Head'],
  'automations.toggleRule':   ['Super Admin','Admin Head'],
  'templates.create':         ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher','TA','HR/Finance'],
  'templates.approveOrgWide': ['Super Admin','Admin Head'],
  'templates.editOrgWide':    ['Super Admin','Admin Head'],

  // ── People / Segments ──
  'people.view':              ['Super Admin','Admin Head','Admin','Academic Head','HR/Finance'],
  'people.export':            ['Super Admin','Admin Head','Admin','Academic Head','HR/Finance'],
  'people.createSegment':     ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher'],
  'people.createOrgSegment':  ['Super Admin','Admin Head','Academic Head'],
  'people.manageForms':       ['Super Admin','Admin Head'],
  'people.manageBroadcasts':  ['Super Admin','Admin Head','Admin'],

  // ── Assessments ──
  'assessments.view':         ['Super Admin','Admin Head','Admin','Academic Head','HOD'],
  'assessments.book':         ['Super Admin','Admin Head','Admin'],
  'assessments.enterOutcome': ['Super Admin','Admin Head','Admin','HOD'],
  'assessments.manageSlots':  ['Super Admin','Admin Head','Admin'],

  // ── Analytics / Reports ──
  'analytics.view':           ['Super Admin','Admin Head','Academic Head','HOD','HR/Finance'],
  'reports.view':             ['Super Admin','Admin Head','Admin','Academic Head','HOD','HR/Finance'],
  'reports.generate':         ['Super Admin','Admin Head','Admin'],
  'reports.schedule':         ['Super Admin','Admin Head'],

  // ── Export (bulk data export button shown on list pages) ──
  'export':                   ['Super Admin','Admin Head','Admin','HR/Finance'],

  // ── Import (bulk data import / CSV upload — restricted to Super Admin) ──
  'import':                   ['Super Admin'],

  // ── Settings ──
  'settings.view':            ['Super Admin'],
  'settings.edit':            ['Super Admin'],
  'settings.manageRoles':     ['Super Admin'],
  'settings.manageBilling':   ['Super Admin'],

  // ── Subjects & Catalogue (Settings → Subjects) ──
  'catalogue.edit':           ['Super Admin','Admin Head'],
  'topic.edit':               ['Super Admin','Academic Head','HOD'],
  'grades.edit':              ['Super Admin','Academic Head','HOD'],
  'feedback.selectors.edit':  ['Super Admin','Academic Head','HOD'],

  // ── Named actions (cross-module) ──
  'delete.records':           ['Super Admin','Admin Head','Admin'],
  'issue.credit':             ['Super Admin','Admin Head','Admin','HR/Finance'],
  'approve.discount':         ['Super Admin','Admin Head','HR/Finance'],
  'offboard.staff':           ['Super Admin','HR/Finance'],
  'manage.roles':             ['Super Admin'],
  'merge.duplicates':         ['Super Admin','Admin Head','Admin'],
  'export.all':               ['Super Admin'],
  'bulk.generate.invoices':   ['Super Admin','Admin Head','Admin'],
  'stock.take':               ['Super Admin','Admin Head','Admin','Academic Head','HOD','Teacher','TA','HR/Finance'],

  // ── Inventory ──
  'inventory.view':           ['Super Admin','Admin Head','Admin','Academic Head','HOD','HR/Finance'],
}

export function canDo(role: Role, action: string): boolean {
  return PERMISSIONS[action]?.includes(role) ?? false
}
