export const currentUser: {
  name: string;
  role: string;
  avatar: null;
  avatarUrl: string | null;
  org: string;
} = {
  name: "Jason Daswani",
  role: "Super Admin",
  avatar: null,
  avatarUrl: null,
  org: "IMI",
};

export const notificationCount = 0;

export const orgSettings: { logoUrl: string | null } = {
  logoUrl: null,
};

// ─── Students ─────────────────────────────────────────────────────────────────

export type StudentStatus = "Active" | "Withdrawn" | "Graduated" | "Alumni" | "Archived";

export interface Student {
  id: string;
  name: string;
  yearGroup: string;
  department: string;
  school: string;
  guardian: string;
  guardianPhone: string;
  enrolments: number;
  churnScore: number | null;
  status: StudentStatus;
  lastContact: string;
  createdOn: string;
  sourceLeadId?: string;
}

export const students: Student[] = [];

// ─── Guardians ────────────────────────────────────────────────────────────────

export interface GuardianStudent {
  id: string;
  name: string;
  initials: string;
}

export type GuardianStatus = 'active' | 'inactive';
export type GuardianDepartment = 'primary' | 'lower-secondary' | 'senior' | 'mixed';
export type CommunicationPreference = 'whatsapp' | 'email' | 'both' | 'none';

export interface Guardian {
  id: string;
  name: string;
  email: string;
  phone: string;
  students: GuardianStudent[];
  status: GuardianStatus;
  linkedStudents: string[];
  communicationPreference: CommunicationPreference;
  createdOn: string;
  department: GuardianDepartment;
}

export const guardians: Guardian[] = [];

// ─── KPI Cards ────────────────────────────────────────────────────────────────

export type TrendDirection = "up" | "down" | "neutral";
export type TrendSentiment = "positive" | "negative" | "warning" | "neutral";

export interface KpiCard {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: TrendDirection;
  trendSentiment: TrendSentiment;
  subValue?: string;
  icon: string;
}

export const kpiCards: KpiCard[] = [];

// ─── Churn Risk Students ──────────────────────────────────────────────────────

export type ChurnLevel = "Critical" | "High" | "Medium" | "Low";

export interface ChurnReason {
  label: string;
  weight: number;
  detail: string;
}

export interface RetentionFactor {
  label: string;
  weight: number;
}

export interface ChurnRiskStudent {
  id: string;
  studentId: string;
  name: string;
  yearGroup: string;
  department: string;
  churnScore: number;
  churnLevel: ChurnLevel;
  topSignal: string;
  daysSinceContact: number;
  trend: "rising" | "stable" | "falling";
  reasons: ChurnReason[];
  retentionConfidence: number;
  retentionFactors: RetentionFactor[];
}

export const churnRiskStudents: ChurnRiskStudent[] = [];

// ─── Operational Thresholds ───────────────────────────────────────────────────

export type ThresholdStatus = "ok" | "warning" | "critical";

export interface OperationalThreshold {
  id: string;
  metric: string;
  current: string;
  target: string;
  status: ThresholdStatus;
  statusLabel: string;
}

export const operationalThresholds: OperationalThreshold[] = [];

// ─── Revenue Data ─────────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  month: string;
  invoiced: number;
  collected: number;
}

export const revenueData: RevenueDataPoint[] = [];

// ─── Occupancy Heatmap ────────────────────────────────────────────────────────

export interface OccupancyCell {
  day: string;
  time: string;
  occupancy: number;
}

export const occupancyHeatmap: OccupancyCell[] = [];

// ─── Room Occupancy Detail ────────────────────────────────────────────────────

export interface RoomDetail {
  name: string;
  type: 'classroom' | 'office' | 'open-space';
  totalSeats: number;
  occupiedSeats: number;
  sessions: { subject: string; teacher: string; students: number }[];
}

export interface RoomSlotDetail {
  day: string;
  timeSlot: string;
  rooms: RoomDetail[];
}

export const roomOccupancyDetail = new Map<string, RoomSlotDetail>();

// ─── Activity Feed ────────────────────────────────────────────────────────────

export type ActivityType =
  | "enrolment"
  | "payment"
  | "concern"
  | "invoice"
  | "trial"
  | "assessment"
  | "lead"
  | "staff"
  | "task"
  | "re-enrolment"
  | "report";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  description: string;
  timeAgo: string;
  link: string;
  actionedBy: { name: string; role: string } | "system";
}

export const activityFeed: ActivityEvent[] = [];

// ─── Student Detail ───────────────────────────────────────────────────────────

export interface StudentEnrolment {
  id: string;
  subject: string;
  teacher: string;
  schedule: string;
  room: string;
  color: "amber" | "teal" | "blue";
  packageStatus: "Active" | "Expiring" | "Expired";
  sessionsTotal: number;
  sessionsAttended: number;
  sessionsAbsent: number;
  sessionsRemaining: number;
  packageStart: string;
  sessionsPurchased: number;
}

export interface UpcomingSession {
  date: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
}

export interface ActivityEvent2 {
  type: "invoice" | "absence" | "payment" | "concern" | "assignment" | "session" | "enrolment" | "message";
  description: string;
  timeAgo: string;
}

export interface StudentInvoice {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: "Paid" | "Overdue" | "Partial";
}

export interface AttendanceSubjectSummary {
  subject: string;
  rate: string;
  attended: number;
  absent: number;
  makeupAllowance: number;
  makeupUsed: number;
}

export interface MakeupLogEntry {
  session: string;
  subject: string;
  makeupDate: string;
  status: "Completed" | "Pending";
  expiring?: boolean;
}

export interface AttendanceHistoryRow {
  date: string;
  subject: string;
  status: "Present" | "Absent";
}

export interface GradeAssignment {
  title: string;
  due: string;
  submitted: string;
  score: string;
  status: string;
}

export interface SubjectGrades {
  target: string;
  predicted: string;
  assignments: GradeAssignment[];
}

export interface StudentTask {
  task: string;
  priority: "High" | "Medium" | "Low";
  assignedTo: string;
  due: string;
  status: "Open" | "Closed";
}

export interface StudentConcern {
  subject: string;
  trigger: string;
  raised: string;
  raisedBy: string;
  level: string;
  levelLabel: string;
  assignedTo: string;
  status: "Active" | "Dismissed";
}

export interface CommLogEntry {
  date: string;
  channel: "WhatsApp" | "Email" | "SMS";
  message: string;
  sentBy: string;
  status: string;
}

export const studentDetail = {
  enrolments: [] as StudentEnrolment[],
  upcomingSessions: [] as UpcomingSession[],
  activityTimeline: [] as ActivityEvent2[],
  invoices: [] as StudentInvoice[],
  attendanceSummary: {
    termRate: "—",
    allTimeRate: "—",
    consecutiveAbsences: 0,
    noShows: 0,
  },
  attendanceBySubject: [] as AttendanceSubjectSummary[],
  makeupLog: [] as MakeupLogEntry[],
  attendanceHistory: [] as AttendanceHistoryRow[],
  grades: {} as Record<string, SubjectGrades>,
  tasks: [] as StudentTask[],
  concerns: [] as StudentConcern[],
  communicationLog: [] as CommLogEntry[],
};

// ─── Leads ────────────────────────────────────────────────────────────────────

export type LeadStage =
  | "New"
  | "Contacted"
  | "Assessment Booked"
  | "Assessment Done"
  | "Trial Booked"
  | "Trial Done"
  | "Schedule Offered"
  | "Schedule Confirmed"
  | "Invoice Sent"
  | "Won"
  | "Lost";

export type LeadSource = "Website" | "Phone" | "Walk-in" | "Referral" | "Event";
export type PreferredWindow = "Morning" | "Afternoon" | "Evening" | "Any";

export interface Lead {
  id: string;
  ref: string;
  childName: string;
  yearGroup: string;
  department: string;
  subjects: string[];
  guardian: string;
  guardianPhone: string;
  source: LeadSource;
  stage: LeadStage;
  assignedTo: string;
  lastActivity: string;
  daysInStage: number;
  daysInPipeline: number;
  dnc: boolean;
  sibling: boolean;
  stageMessagePending: boolean;
  preferredDays?: string[];
  preferredWindow?: PreferredWindow;
  createdOn?: string;
  lostReason?: string;
  lostNotes?: string;
  reEngage?: boolean;
  reEngageAfter?: string;
  status?: 'active' | 'converted' | 'lost' | 'archived';
  convertedStudentId?: string;
  convertedOn?: string;
}

export const leads: Lead[] = [];

// ─── Finance ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = "Draft" | "Issued" | "Part" | "Paid" | "Overdue" | "Cancelled";
export type PaymentMethod = "Cash" | "Card" | "Bank Transfer" | "Online" | "Cheque";
export type CreditStatus = "Applied" | "Unused";
export type CreditType = "manual" | "overpayment" | "refund" | "promotional";

export interface Invoice {
  id: string;
  studentId: string;
  student: string;
  yearGroup: string;
  department: string;
  guardian: string;
  description: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: InvoiceStatus;
  leadId?: string;
}

export interface Payment {
  date: string;
  studentId: string;
  student: string;
  invoice: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  recordedBy: string;
  department: string;
}

export interface Credit {
  date: string;
  studentId: string;
  student: string;
  amount: number;
  reason: string;
  issuedBy: string;
  status: CreditStatus;
  department: string;
  type: CreditType;
}

export const invoices: Invoice[] = [];
export const payments: Payment[] = [];
export const creditLedger: Credit[] = [];

export const financeStats = {
  totalInvoiced: 0,
  collected: 0,
  outstanding: 0,
  overdue: 0,
  overdueCount: 0,
  receivedThisMonth: 0,
  cash: 0,
  bankTransfer: 0,
  creditsIssuedThisTerm: 0,
  creditsApplied: 0,
  creditsUnused: 0,
  unbilledCount: 0,
  unbilledSessionsTotal: 0,
};

// ─── Departments ─────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  yearGroupFrom: string;
  yearGroupTo: string;
  colour: string;
  active: boolean;
  studentCount: number;
  sortOrder: number;
}

export const departments: Department[] = [];

// ─── Rooms & Timetable ────────────────────────────────────────────────────────

export interface Room {
  id: string;
  name: string;
  capacity: number;
}

export type SessionType = "Regular" | "Trial" | "Makeup" | "Assessment" | "Meeting" | "Blocked" | "Cover Required";
export type SessionStatus = "Scheduled" | "Completed" | "Cancelled";

export interface TimetableSession {
  id: string;
  day: string;
  date: string;
  subject: string;
  department: string;
  teacher: string;
  teacherId: string;
  assignedTAs?: string[];
  room: string;
  startTime: string;
  endTime: string;
  duration: number;
  students: string[];
  studentCount: number;
  type: SessionType;
  status: SessionStatus;
  isTrial?: boolean;
  attendanceMarked?: boolean;
}

export const rooms: Room[] = [];
export const timetableSessions: TimetableSession[] = [];

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface UnmarkedSession {
  id: string;
  subject: string;
  date: string;
  dept: string;
  teacher: string;
  teacherId: string;
  hoursRemaining: number;
  overdue: boolean;
}

export interface AbsenceRecord {
  student: string;
  studentId: string;
  year: string;
  dept: string;
  subject: string;
  teacherId: string;
  totalAbsences: number;
  consecutive: number;
  makeupAllowance: number;
  status: "Allowance Exhausted" | "Consecutive Alert" | "Monitor" | "Normal";
}

export type AttendanceMakeupStatus = "Completed" | "Pending" | "Confirmed" | "Expired";

export interface AttendanceMakeupEntry {
  id: string;
  originalSession: string;
  subject: string;
  student: string;
  makeupDate: string;
  status: AttendanceMakeupStatus;
  teacherId: string;
  dept: string;
}

export const unmarkedSessions: UnmarkedSession[] = [];
export const absenceSummary: AbsenceRecord[] = [];
export const makeupLog: AttendanceMakeupEntry[] = [];

export const ATTENDANCE_ROLE_USER: Record<string, { staffId: string; department: string }> = {};

// ─── Staff ────────────────────────────────────────────────────────────────────

export type StaffStatus = "Active" | "On Leave" | "Inactive" | "Suspended" | "Off-boarded";
export type WorkloadLevel = "Low" | "Moderate" | "High";
export type ContractType = "Full-time" | "Part-time" | "Sessional";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  subjects: string[];
  sessionsThisWeek: number;
  cpdHours: number;
  cpdTarget: number;
  status: StaffStatus;
  hireDate: string;
  contractType: ContractType;
  lineManager: string;
  workloadLevel: WorkloadLevel;
}

export const staffMembers: StaffMember[] = [];

// ─── Enrolments ──────────────────────────────────────────────────────────────

export type EnrolmentStatus = "Active" | "Pending" | "Expiring" | "Expired" | "Withdrawn";
export type EnrolmentInvoiceStatus = "Paid" | "Part" | "Overdue" | "Pending";

export interface Enrolment {
  id: string;
  studentId: string;
  student: string;
  yearGroup: string;
  department: string;
  subject: string;
  teacher: string;
  sessionsTotal: number;
  sessionsRemaining: number;
  frequency: string;
  enrolledOn?: string;
  package: string;
  invoiceStatus: EnrolmentInvoiceStatus;
  enrolmentStatus: EnrolmentStatus;
}

export const enrolments: Enrolment[] = [];

// ─── Trials ───────────────────────────────────────────────────────────────────

export type TrialOutcome =
  | "Pending"
  | "Recommended ✅"
  | "Parent to decide"
  | "Not recommended"
  | "Converted"
  | "No Show"
  | "Needs More Time"
  | "Not Interested"
  | "Cancelled";

export interface Trial {
  id: string;
  student: string;
  yearGroup: string;
  subject: string;
  teacher: string;
  trialDate: string;
  invoiceStatus: "Paid" | "Pending";
  outcome: TrialOutcome;
  notes?: string;
  followUpDate?: string;
  cancellationReason?: string;
}

export const trials: Trial[] = [];

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export type WithdrawalRecordStatus = "Active" | "Resolved";

export interface Withdrawal {
  id: string;
  student: string;
  studentId?: string;
  enrolmentId?: string;
  yearGroup: string;
  department: string;
  subjects: string[];
  withdrawalDate: string;
  reason: string;
  invoiceStatus: "Paid" | "Overdue" | "Part" | "Pending";
  notes?: string;
  sessionsRemaining?: number;
  recordStatus?: WithdrawalRecordStatus;
}

export const withdrawals: Withdrawal[] = [];

// ─── Reports Inbox ────────────────────────────────────────────────────────────

export interface ReportItem {
  id: string;
  icon: string;
  title: string;
  date: string;
  read: boolean;
  periodLabel?: string;
}

export const reportsInbox: ReportItem[] = [];

// ─── Assessments ──────────────────────────────────────────────────────────────

export type AssessmentStatus = "Booked" | "Link Sent" | "Awaiting Booking" | "Completed";
export type AssessmentType = "Lead" | "Student";

export interface Assessment {
  id: string;
  name: string;
  type: AssessmentType;
  yearGroup: string;
  subjects: string[];
  assessor: string | null;
  date: string | null;
  time: string | null;
  room: string | null;
  status: AssessmentStatus;
  outcome: string | null;
}

export const assessments: Assessment[] = [];

// ─── Assignments ──────────────────────────────────────────────────────────────

export type AssignmentStatus = "Complete" | "Partial" | "Pending" | "Upcoming" | "Overdue";
export type AssignmentType = "Test" | "Homework" | "Classwork" | "Past Paper";

export interface Assignment {
  id: string;
  assignment: string;
  title?: string;
  subject: string;
  department?: string;
  teacher: string;
  teacherId?: string;
  type: AssignmentType;
  dueDate: string;
  status: AssignmentStatus;
  submissions: string;
  marked: string;
  submittedCount?: number;
  totalCount?: number;
  linkedSessionId?: string;
  instructions?: string;
  assignTo?: string;
}

export const assignments: Assignment[] = [];

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskType = "Admin" | "Academic" | "Finance" | "HR" | "Student Follow-up" | "Cover" | "Personal";
export type TaskPriority = "Urgent" | "High" | "Medium" | "Low";
export type TaskStatus = "Open" | "In Progress" | "Blocked" | "Done";

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignees: string[];
  dueDate: string;
  linkedRecord: { type: string; name: string; id: string } | null;
  description: string;
  subtasks: string[];
  overdue: boolean;
  sourceLeadId?: string;
  sourceLeadName?: string;
  createdOn?: string;
}

export const tasks: Task[] = [];

// ─── Task Groups ──────────────────────────────────────────────────────────────

export interface TaskGroup {
  id: string;
  name: string;
  description: string;
  colour: string;
  memberIds: string[];    // staff IDs
  memberNames: string[];  // denormalised for display
  active: boolean;
  sortOrder: number;
}

export const taskGroups: TaskGroup[] = [];

// ─── Feedback ─────────────────────────────────────────────────────────────────

export type FeedbackStatus = "Draft" | "Pending Approval" | "Approved" | "Sent" | "Rejected";

export interface FeedbackSelector {
  label: string;
  value: string;
}

export interface FeedbackItem {
  id: string;
  studentName: string;
  subject: string;
  teacher: string;
  department: string;
  sessionDate: string;
  status: FeedbackStatus;
  score: number;
  aiSummary: string | null;
  selectors: FeedbackSelector[];
  teacherNotes: string;
}

export const feedbackItems: FeedbackItem[] = [];

// ─── Announcements ────────────────────────────────────────────────────────────

export type AnnouncementType = "Pre-session" | "Post-session";
export type AnnouncementStatus = "Draft" | "Pending Approval" | "Sent";

export interface Announcement {
  id: string;
  title: string;
  type: AnnouncementType;
  audience: string;
  createdBy: string;
  sendDate: string;
  status: AnnouncementStatus;
  message: string;
}

export const announcements: Announcement[] = [];

// ─── Complaints & Tickets ─────────────────────────────────────────────────────

export type ComplaintCategory = "Teaching Quality" | "Administrative" | "Facilities" | "Safety & Wellbeing" | "Other";
export type ComplaintStatus = "New" | "Investigating" | "Resolved" | "Escalated" | "Closed";
export type ComplaintSeverity = "High" | "Medium" | "Low";

export interface LinkedComplaintTicket {
  id: string;
  description: string;
  assignee: string;
  dueDate: string;
  status: "Open" | "In Progress" | "Done";
}

export interface SignOff {
  name: string;
  role: string;
  timestamp: string | null;
}

export interface EscalationEvent {
  event: string;
  actor: string;
  timestamp: string;
}

export interface ComplaintTicket {
  id: string;
  student: string;
  guardianName: string;
  category: ComplaintCategory;
  raisedBy: string;
  assignedTo: string;
  status: ComplaintStatus;
  severity: ComplaintSeverity;
  description: string;
  createdDate: string;
  linkedTickets: LinkedComplaintTicket[];
  signOffs: [SignOff, SignOff];
  escalationLog: EscalationEvent[];
}

export const complaintTickets: ComplaintTicket[] = [];

// ─── Surveys ──────────────────────────────────────────────────────────────────

export type SurveyType = "Mid-term" | "End of term" | "Post-trial" | "Post-withdrawal" | "Manual";
export type SurveyCategory = "Promoter" | "Passive" | "Detractor";
export type SurveyPendingStatus = "Scheduled" | "Sent" | "Expired";

export interface SurveyResponse {
  id: string;
  student: string;
  guardian: string;
  surveyType: SurveyType;
  sentDate: string;
  score: number;
  category: SurveyCategory;
  comment: string;
}

export interface SurveyPendingItem {
  id: string;
  student: string;
  guardian: string;
  trigger: string;
  scheduledDate: string;
  status: SurveyPendingStatus;
}

export const surveyResponses: SurveyResponse[] = [];
export const surveyPending: SurveyPendingItem[] = [];

// ─── People Directory ─────────────────────────────────────────────────────────

export type PersonType = "Student" | "Guardian" | "Lead" | "Staff";

export interface PersonRecord {
  id: string;
  name: string;
  type: PersonType;
  contact: string;
  status: string;
  departmentOrStage: string;
  createdOn: string;
  link: string;
}

export const peopleAll: PersonRecord[] = [];

// ─── Extended Guardians ───────────────────────────────────────────────────────

export type GuardianChannel = "WhatsApp" | "Email" | "In-app";

export interface ExtendedGuardian {
  id: string;
  name: string;
  phone: string;
  email: string;
  linkedStudents: string[];
  dnc: boolean;
  unsubscribed: boolean;
  preferredChannel: GuardianChannel;
  createdOn: string;
}

export const extendedGuardians: ExtendedGuardian[] = [];

export const studentOutstandingBalance: Record<string, number> = {};
export const leadCreatedOnMap: Record<string, string> = {};

// ─── Duplicate Detections ─────────────────────────────────────────────────────

export type DuplicateThreshold = "High" | "Medium" | "Low";
export type DuplicateStatus = "Pending" | "Resolved" | "Dismissed";

export interface DuplicatePerson {
  id: string;
  name: string;
  type: PersonType;
  phone: string;
  email: string;
  contact: string;
  createdOn: string;
}

export interface DuplicateDetection {
  id: string;
  threshold: DuplicateThreshold;
  matchScore: number;
  status: DuplicateStatus;
  recordA: DuplicatePerson;
  recordB: DuplicatePerson;
  matchedFields: string[];
  detected: string;
}

export const duplicateDetections: DuplicateDetection[] = [];

// ─── Segments ─────────────────────────────────────────────────────────────────

export type SegmentScope = "Org-Wide" | "Personal";
export type SegmentRecordType = "Students" | "Guardians" | "Leads" | "Staff";

export interface Segment {
  id: string;
  name: string;
  scope: SegmentScope;
  recordType: SegmentRecordType;
  members: number;
  count: number;
  filterSummary: string;
  lastRefreshed: string;
  lastUpdated: string;
  createdBy: string;
  filters: string;
}

export const segments: Segment[] = [];

// ─── Broadcast Lists ─────────────────────────────────────────────────────────

export interface BroadcastMember {
  name: string;
  type: PersonType;
  addedBy: "Auto" | "Manual";
}

export interface BroadcastList {
  id: string;
  name: string;
  members: number;
  autoRule: boolean;
  autoRuleName?: string;
  lastUpdated: string;
  membersList: BroadcastMember[];
}

export const broadcastLists: BroadcastList[] = [];
export const broadcastListExclusions: Record<string, { name: string }[]> = {};

// ─── Forms ────────────────────────────────────────────────────────────────────

export type FormType = "Lead Enquiry" | "Profile Update" | "Custom";
export type FormStatus = "Active" | "Draft" | "Archived";

export interface Form {
  id: string;
  name: string;
  type: FormType;
  status: FormStatus;
  submissions: number;
  lastSubmission: string | null;
  createdBy: string;
  pinned: boolean;
}

export const forms: Form[] = [];

// ─── Form Submissions ─────────────────────────────────────────────────────────

export type SubmissionStatus = "New" | "Reviewed";

export interface FormSubmission {
  id: string;
  formId: string;
  submittedAt: string;
  submittedBy: string;
  status: SubmissionStatus;
  linkedRecord: string;
}

export const formSubmissions: FormSubmission[] = [];
export const formSubmissionFields: Record<string, { label: string; value: string }[]> = {};

// ─── Export History ───────────────────────────────────────────────────────────

export type ExportFormat = "Standard CSV" | "Google Contacts CSV";

export interface ExportRecord {
  id: string;
  exportedBy: string;
  format: ExportFormat;
  recordType: string;
  filtersApplied: string;
  rowCount: number;
  exportedAt: string;
}

export const exportHistory: ExportRecord[] = [];

// ─── Class Groups ─────────────────────────────────────────────────────────────

export type PostType = "Announcement" | "Discussion" | "Question";

export interface ClassPost {
  id: string;
  sender: string;
  role: string;
  timestamp: string;
  type: PostType;
  content: string;
  removed: boolean;
}

export interface ClassGroup {
  id: string;
  name: string;
  teacher: string;
  unreadCount: number;
  posts: ClassPost[];
}

export const classGroups: ClassGroup[] = [];

// ─── Automation Templates ─────────────────────────────────────────────────────

export type AutomationTemplateType = 'Message' | 'Email' | 'Task' | 'Announcement';
export type AutomationTemplateStatus = 'Active' | 'Draft' | 'Archived';
export type AutomationTemplateOwner = 'Org-Wide' | 'Personal';

export interface AutomationTemplate {
  id: string;
  name: string;
  type: AutomationTemplateType;
  status: AutomationTemplateStatus;
  owner: AutomationTemplateOwner;
  body: string;
  mergeFields: string[];
  version: number;
  usedInRules: string[];
  locked: boolean;
}

export const automationTemplates: AutomationTemplate[] = [];

// ─── Automation Rules ─────────────────────────────────────────────────────────

export type AutomationRuleTrigger = 'Status Change' | 'Time-based' | 'Threshold' | 'Form Submission' | 'Manual';
export type AutomationRuleStatus = 'Enabled' | 'Disabled' | 'Locked';

export interface AutomationRule {
  id: string;
  name: string;
  trigger?: AutomationRuleTrigger;
  triggerType: AutomationRuleTrigger;
  module: string;
  status: AutomationRuleStatus;
  lastFired: string;
  fireCount: number;
  lastRun?: string;
  runsThisMonth?: number;
  templateId?: string;
  locked: boolean;
}

export const automationRules: AutomationRule[] = [];

// ─── Dispatch Queue ───────────────────────────────────────────────────────────

export interface DispatchQueueItem {
  id: string;
  templateName: string;
  contactName: string;
  generatedAt: string;
  sourceRule: string;
  claimedBy: string | null;
  claimedUntil: string | null;
  renderedBody: string;
  status: 'Unclaimed' | 'Claimed' | 'Sent';
}

export const dispatchQueueItems: DispatchQueueItem[] = [];

// ─── Internal Messages ────────────────────────────────────────────────────────

export interface InternalMessageReaction { emoji: string; count: number; }
export interface InternalMessageRecordTag { name: string; type: string; }

export interface InternalMessage {
  id: string;
  sender: string;
  initials: string;
  avatarColor: string;
  timestamp: string;
  body: string;
  mentions: string[];
  recordTags: InternalMessageRecordTag[];
  reactions: InternalMessageReaction[];
}

export const internalMessages: InternalMessage[] = [];

// ─── Marketing ────────────────────────────────────────────────────────────────

export interface MarketingMoment {
  id: string;
  name: string;
  audience: string;
  template: string;
  status: 'Sent' | 'Scheduled' | 'Draft' | 'Cancelled';
  scheduledFor: string;
  dispatched: number;
  total: number;
  calendarDate: number;
}

export const marketingMoments: MarketingMoment[] = [];

export interface MarketingCampaign {
  id: string;
  campaign: string;
  audience: string;
  template: string;
  sent: number;
  delivered: number;
  failed: number;
  scheduledAt: string;
  status: 'Sent' | 'Scheduled' | 'Cancelled' | 'Draft';
}

export const marketingCampaigns: MarketingCampaign[] = [];

// ─── Execution Logs ───────────────────────────────────────────────────────────

export interface ExecutionLogPayloadRow { key: string; value: string; }
export interface ExecutionLogCondition { condition: string; result: 'pass' | 'fail'; }
export interface ExecutionLogAction { type: string; outcome: string; target: string; }
export interface ExecutionLogRecipient { recipient: string; channel: string; route: 'Live' | 'Queue'; outcome: string; }

export interface ExecutionLog {
  id: string;
  rule: string;
  triggerType: string;
  firedAt: string;
  executedAt?: string;
  recipients: number;
  live: number;
  queued: number;
  status: 'Success' | 'Failed' | 'Skipped';
  duration: string;
  payload: ExecutionLogPayloadRow[];
  conditionResults: ExecutionLogCondition[];
  actionResults: ExecutionLogAction[];
  recipientRouting: ExecutionLogRecipient[];
}

export const executionLogs: ExecutionLog[] = [];

// ─── Inventory ─────────────────────────────────────────────────────────────────

export interface AutoDeductRule {
  id: string
  trigger: string
  departments: string[]
  yearGroups: string[]
  quantity: number
  condition: string
  active: boolean
}

export interface LedgerEntry {
  id: string
  changeType: 'auto_deduct' | 'manual_add' | 'reorder_received' | 'manual_deduct' | 'waste' | 'stock_take_correction'
  quantityChange: number
  actor: string
  timestamp: string
}

export interface InventoryItem {
  id: string
  name: string
  category: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  reorderQty: number
  autoDeduct: boolean
  departmentScope: string
  enrolTrigger: string | null
  supplier: string
  amazonLink: string | null
  notes: string
  health: 'healthy' | 'approaching' | 'below'
  autoDeductRules: AutoDeductRule[]
  recentLedger: LedgerEntry[]
  responsibleStaffId?: string
}

export interface InventorySupplier {
  id: string
  name: string
  contactName?: string | null
  phone: string | null
  email: string | null
  itemCount: number
  notes: string | null
}

export interface ReorderAlert {
  id: string
  inventoryItemId?: string
  itemName: string
  category: string
  currentStock: number
  minStock: number
  reorderQty: number
  supplierName: string
  supplierPhone: string | null
  supplierEmail: string | null
  amazonLink: string | null
  status: 'open' | 'ordered' | 'ignored'
  openedAt: string
  responsibleStaffId?: string
}

export interface StockLedgerEntry {
  id: string
  itemName: string
  category: string
  changeType: 'auto_deduct' | 'manual_add' | 'reorder_received' | 'manual_deduct' | 'waste' | 'stock_take_correction' | 'auto_deduct_failed'
  quantityChange: number
  stockBefore?: number
  stockAfter?: number
  actor: string
  reference?: string
  timestamp: string
}

export const inventoryItems: InventoryItem[] = [];
export const inventorySuppliers: InventorySupplier[] = [];
export const reorderAlerts: ReorderAlert[] = [];
export const stockLedgerEntries: StockLedgerEntry[] = [];

// ─── Dashboard Role-Specific Data ─────────────────────────────────────────────

export interface DashboardSessionRow {
  id: string;
  time: string;
  subject: string;
  room: string;
  studentCount: number;
  students: string;
}

export const teacherTodaySessions: DashboardSessionRow[] = [];
export const taTodaySessions: DashboardSessionRow[] = [];

export interface TeacherPendingAction {
  id: string;
  label: string;
  count: number;
  href: string;
  severity: "critical" | "warning" | "ok";
}

export const teacherPendingActions: TeacherPendingAction[] = [];

export interface DashboardTaskRow {
  id: string;
  title: string;
  priority: "High" | "Medium" | "Low";
  dueLabel: string;
  href: string;
}

export const teacherTopTasks: DashboardTaskRow[] = [];
export const taTopTasks: DashboardTaskRow[] = [];

export interface TeacherWorkloadRow {
  id: string;
  name: string;
  sessionsThisWeek: number;
  subjects: string;
  level: "Low" | "Moderate" | "High";
}

export const hodTeacherWorkload: TeacherWorkloadRow[] = [];

export interface AcademicAlertRow {
  id: string;
  title: string;
  student: string;
  subject: string;
  level: "L1" | "L2" | "L3";
  opened: string;
  href: string;
}

export const hodAcademicAlerts: AcademicAlertRow[] = [];
export const academicAlerts: AcademicAlertRow[] = [];

export interface UpcomingSessionRow {
  id: string;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  room: string;
  students: number;
}

export const hodUpcomingSessions: UpcomingSessionRow[] = [];

export interface PendingApprovalRow {
  id: string;
  label: string;
  count: number;
  href: string;
}

export const hodPendingApprovals: PendingApprovalRow[] = [];

export interface InvoiceStatusSlice {
  label: string;
  count: number;
  amount: string;
  color: string;
}

export const invoiceStatusBreakdown: InvoiceStatusSlice[] = [];

export interface StaffCpdRow {
  id: string;
  name: string;
  role: string;
  cpdHours: number;
  cpdTarget: number;
}

export const staffCpdProgress: StaffCpdRow[] = [];

// ─── Academic Calendar ────────────────────────────────────────────────────────

export type PeriodType =
  | 'term' | 'half_term' | 'holiday_break' | 'summer_term'
  | 'closure' | 'public_holiday';

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  financialYearStartMonth: number;
}

export interface DepartmentPause {
  departmentId: string;
  departmentName: string;
  paused: boolean;
}

export interface CalendarPeriod {
  id: string;
  academicYearId: string;
  type: PeriodType;
  name: string;
  startDate: string;
  endDate: string;
  sortOrder: number;
  departmentPauses?: DepartmentPause[];
}

export interface PublicHoliday {
  id: string;
  academicYearId: string;
  name: string;
  date: string;
  source: 'uae_template' | 'custom';
}

export const academicYears: AcademicYear[] = [];
export const calendarPeriods: CalendarPeriod[] = [];
export const publicHolidays: PublicHoliday[] = [];

// ─── Unbilled Sessions ────────────────────────────────────────────────────────

export interface UnbilledSession {
  id: string;
  studentId: string;
  studentName: string;
  department: string;
  yearGroup: string;
  subject: string;
  sessionDate: string;
  sessionId: string;
  sessionsCount: number;
  status: 'open' | 'written_off';
  writeOffReason?: string;
  writeOffBy?: string;
  writeOffAt?: string;
  createdAt: string;
}

export const unbilledSessions: UnbilledSession[] = [];

// ─── Avatar Utilities (shared across pages) ───────────────────────────────────

export const AVATAR_PALETTES = [
  { bg: "bg-amber-100",   text: "text-amber-700"   },
  { bg: "bg-teal-100",    text: "text-teal-700"    },
  { bg: "bg-blue-100",    text: "text-blue-700"    },
  { bg: "bg-violet-100",  text: "text-violet-700"  },
  { bg: "bg-rose-100",    text: "text-rose-700"    },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-sky-100",     text: "text-sky-700"     },
  { bg: "bg-orange-100",  text: "text-orange-700"  },
];

export function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

export function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─── Year Groups (canonical list) ────────────────────────────────────────────

export const YEAR_GROUPS = [
  "KG1", "KG2",
  "Y1", "Y2", "Y3", "Y4", "Y5", "Y6",
  "Y7", "Y8", "Y9", "Y10", "Y11", "Y12", "Y13",
] as const;
export type YearGroup = (typeof YEAR_GROUPS)[number];

// ─── Lead Stages (ordered pipeline) ──────────────────────────────────────────

export const LEAD_STAGES: LeadStage[] = [
  "New",
  "Contacted",
  "Assessment Booked",
  "Assessment Done",
  "Trial Booked",
  "Trial Done",
  "Schedule Offered",
  "Schedule Confirmed",
  "Invoice Sent",
  "Won",
  "Lost",
];

// ─── Analytics Revenue Data ───────────────────────────────────────────────────

export interface RevenueDeptDataPoint {
  month: string;
  date: Date;
  Primary: number;
  LowerSec: number;
  Senior: number;
}

export interface RevenueWeeklyDataPoint {
  week: string;
  Primary: number;
  LowerSec: number;
  Senior: number;
}

export interface RevenueTermlyDataPoint {
  term: string;
  Primary: number;
  LowerSec: number;
  Senior: number;
}

export interface RevenueBySubjectDataPoint {
  subject: string;
  revenue: number;
}

export const revenueDeptData: RevenueDeptDataPoint[] = [];

export const revenueWeeklyData: RevenueWeeklyDataPoint[] = [];

export const revenueTermlyData: RevenueTermlyDataPoint[] = [];

export const revenueBySubject: RevenueBySubjectDataPoint[] = [];
