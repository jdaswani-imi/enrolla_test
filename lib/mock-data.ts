export const currentUser = {
  name: "Jason Daswani",
  role: "Super Admin",
  avatar: null,
  org: "IMI",
};

export const notificationCount = 3;

// ─── Students ─────────────────────────────────────────────────────────────────

export type StudentStatus = "Active" | "Withdrawn" | "Graduated" | "Alumni";

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
}

export const students: Student[] = [
  { id: "IMI-0001", name: "Aisha Rahman", yearGroup: "Y8", department: "Lower Secondary", school: "GEMS Wellington", guardian: "Fatima Rahman", guardianPhone: "+971 50 123 4567", enrolments: 3, churnScore: 84, status: "Active", lastContact: "12 days ago", createdOn: "12 Sep 2022" },
  { id: "IMI-0002", name: "Omar Al-Farsi", yearGroup: "Y5", department: "Primary", school: "Dubai British School", guardian: "Khalid Al-Farsi", guardianPhone: "+971 55 234 5678", enrolments: 2, churnScore: 76, status: "Active", lastContact: "7 days ago", createdOn: "3 Mar 2023" },
  { id: "IMI-0003", name: "Layla Hassan", yearGroup: "Y10", department: "Senior", school: "Jumeirah College", guardian: "Nadia Hassan", guardianPhone: "+971 52 345 6789", enrolments: 4, churnScore: 71, status: "Active", lastContact: "3 days ago", createdOn: "1 Sep 2021" },
  { id: "IMI-0004", name: "Ziad Khalil", yearGroup: "Y3", department: "Primary", school: "GEMS Modern Academy", guardian: "Rami Khalil", guardianPhone: "+971 50 456 7890", enrolments: 2, churnScore: 65, status: "Active", lastContact: "18 days ago", createdOn: "15 Jan 2023" },
  { id: "IMI-0005", name: "Sara Nasser", yearGroup: "Y9", department: "Lower Secondary", school: "The English College", guardian: "Hessa Nasser", guardianPhone: "+971 55 567 8901", enrolments: 3, churnScore: 62, status: "Active", lastContact: "5 days ago", createdOn: "8 Apr 2023" },
  { id: "IMI-0006", name: "Reem Al-Dosari", yearGroup: "Y6", department: "Primary", school: "Horizon English School", guardian: "Maryam Al-Dosari", guardianPhone: "+971 52 678 9012", enrolments: 2, churnScore: 58, status: "Active", lastContact: "21 days ago", createdOn: "20 Aug 2022" },
  { id: "IMI-0007", name: "Faris Qasim", yearGroup: "Y11", department: "Senior", school: "Dubai College", guardian: "Tariq Qasim", guardianPhone: "+971 50 789 0123", enrolments: 3, churnScore: 55, status: "Active", lastContact: "9 days ago", createdOn: "5 Sep 2022" },
  { id: "IMI-0008", name: "Nour Ibrahim", yearGroup: "Y4", department: "Primary", school: "GEMS Royal Dubai", guardian: "Leila Ibrahim", guardianPhone: "+971 55 890 1234", enrolments: 1, churnScore: 52, status: "Active", lastContact: "14 days ago", createdOn: "10 Nov 2023" },
  { id: "IMI-0009", name: "Hamdan Al-Maktoum", yearGroup: "Y7", department: "Lower Secondary", school: "Kings School Dubai", guardian: "Shaikha Al-Maktoum", guardianPhone: "+971 52 901 2345", enrolments: 2, churnScore: 38, status: "Active", lastContact: "2 days ago", createdOn: "1 Sep 2023" },
  { id: "IMI-0010", name: "Fatima Al-Shehhi", yearGroup: "Y4", department: "Primary", school: "Raffles World Academy", guardian: "Noura Al-Shehhi", guardianPhone: "+971 50 012 3456", enrolments: 1, churnScore: 22, status: "Active", lastContact: "1 day ago", createdOn: "14 Feb 2024" },
  { id: "IMI-0011", name: "Khalid Mansoor", yearGroup: "Y12", department: "Senior", school: "GEMS Winchester", guardian: "Amal Mansoor", guardianPhone: "+971 55 111 2233", enrolments: 4, churnScore: 18, status: "Active", lastContact: "Today", createdOn: "1 Sep 2020" },
  { id: "IMI-0012", name: "Dana Al-Zaabi", yearGroup: "Y2", department: "Primary", school: "Jumeirah Primary", guardian: "Saeed Al-Zaabi", guardianPhone: "+971 52 222 3344", enrolments: 2, churnScore: 31, status: "Active", lastContact: "4 days ago", createdOn: "3 Sep 2024" },
  { id: "IMI-0013", name: "Yousef Salim", yearGroup: "Y9", department: "Lower Secondary", school: "The English College", guardian: "Mona Salim", guardianPhone: "+971 50 333 4455", enrolments: 3, churnScore: 44, status: "Active", lastContact: "6 days ago", createdOn: "12 Jan 2022" },
  { id: "IMI-0014", name: "Mariam Al-Suwaidi", yearGroup: "Y13", department: "Senior", school: "Dubai College", guardian: "Jassim Al-Suwaidi", guardianPhone: "+971 55 444 5566", enrolments: 2, churnScore: 29, status: "Active", lastContact: "Today", createdOn: "1 Sep 2019" },
  { id: "IMI-0015", name: "Adam Benali", yearGroup: "Y6", department: "Primary", school: "Horizon English School", guardian: "Sofia Benali", guardianPhone: "+971 52 555 6677", enrolments: 2, churnScore: 0, status: "Active", lastContact: "Yesterday", createdOn: "8 Sep 2021" },
  { id: "IMI-0016", name: "Hind Al-Rashidi", yearGroup: "Y8", department: "Lower Secondary", school: "GEMS Wellington", guardian: "Saif Al-Rashidi", guardianPhone: "+971 50 666 7788", enrolments: 1, churnScore: 0, status: "Withdrawn", lastContact: "32 days ago", createdOn: "15 Mar 2023" },
  { id: "IMI-0017", name: "Tariq Osman", yearGroup: "Y5", department: "Primary", school: "Dubai British School", guardian: "Hana Osman", guardianPhone: "+971 55 777 8899", enrolments: 0, churnScore: null, status: "Withdrawn", lastContact: "45 days ago", createdOn: "2 Sep 2022" },
  { id: "IMI-0018", name: "Lina Farouk", yearGroup: "Y11", department: "Senior", school: "Jumeirah College", guardian: "Walid Farouk", guardianPhone: "+971 52 888 9900", enrolments: 0, churnScore: null, status: "Graduated", lastContact: "60 days ago", createdOn: "1 Sep 2020" },
  { id: "IMI-0019", name: "Saif Al-Otaibi", yearGroup: "Y13", department: "Senior", school: "GEMS Winchester", guardian: "Wafa Al-Otaibi", guardianPhone: "+971 50 999 0011", enrolments: 0, churnScore: null, status: "Graduated", lastContact: "90 days ago", createdOn: "1 Sep 2018" },
  { id: "IMI-0020", name: "Raya Khouri", yearGroup: "Y3", department: "Primary", school: "GEMS Modern Academy", guardian: "Elias Khouri", guardianPhone: "+971 55 100 2020", enrolments: 2, churnScore: 41, status: "Active", lastContact: "8 days ago", createdOn: "5 Sep 2023" },
];

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

export const kpiCards: KpiCard[] = [
  {
    id: "active-students",
    label: "Active Students",
    value: "1,847",
    trend: "+12%",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "Users",
  },
  {
    id: "new-enrolments",
    label: "New Enrolments",
    value: "143",
    trend: "+8%",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "UserPlus",
  },
  {
    id: "re-enrolments",
    label: "Re-enrolments",
    value: "276",
    trend: "+3%",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "RefreshCw",
  },
  {
    id: "churn",
    label: "Churn This Term",
    value: "31",
    trend: "-5%",
    trendDirection: "down",
    trendSentiment: "positive",
    icon: "UserMinus",
  },
  {
    id: "revenue",
    label: "Revenue This Term",
    value: "AED 284,500",
    trend: "+11%",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "TrendingUp",
  },
  {
    id: "collected",
    label: "Collected This Term",
    value: "AED 241,200",
    trend: "+9%",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "Banknote",
  },
  {
    id: "overdue",
    label: "Overdue Invoices",
    value: "23",
    subValue: "AED 18,400",
    trend: "neutral",
    trendDirection: "neutral",
    trendSentiment: "warning",
    icon: "AlertCircle",
  },
  {
    id: "at-risk",
    label: "At-Risk Students",
    value: "47",
    trend: "+4 this week",
    trendDirection: "up",
    trendSentiment: "negative",
    icon: "ShieldAlert",
  },
  {
    id: "concerns",
    label: "Open Concerns",
    value: "8",
    trend: "2 critical",
    trendDirection: "neutral",
    trendSentiment: "negative",
    icon: "MessageSquareWarning",
  },
  {
    id: "occupancy",
    label: "Seat Occupancy",
    value: "74%",
    trend: "vs 80% target",
    trendDirection: "neutral",
    trendSentiment: "warning",
    icon: "LayoutGrid",
  },
];

// ─── Churn Risk Students ──────────────────────────────────────────────────────

export type ChurnLevel = "Critical" | "High" | "Medium" | "Low";

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
}

export const churnRiskStudents: ChurnRiskStudent[] = [
  {
    id: "1",
    studentId: "IMI-0001",
    name: "Aisha Rahman",
    yearGroup: "Y8",
    department: "Lower Sec",
    churnScore: 84,
    churnLevel: "Critical",
    topSignal: "Missed 3+ sessions",
    daysSinceContact: 12,
  },
  {
    id: "2",
    studentId: "IMI-0002",
    name: "Omar Al-Farsi",
    yearGroup: "Y5",
    department: "Primary",
    churnScore: 76,
    churnLevel: "High",
    topSignal: "Overdue invoice",
    daysSinceContact: 7,
  },
  {
    id: "3",
    studentId: "IMI-0003",
    name: "Layla Hassan",
    yearGroup: "Y10",
    department: "Senior",
    churnScore: 71,
    churnLevel: "High",
    topSignal: "Teaching concern",
    daysSinceContact: 3,
  },
  {
    id: "4",
    studentId: "IMI-0004",
    name: "Ziad Khalil",
    yearGroup: "Y3",
    department: "Primary",
    churnScore: 65,
    churnLevel: "Medium",
    topSignal: "Inconsistency",
    daysSinceContact: 18,
  },
  {
    id: "5",
    studentId: "IMI-0005",
    name: "Sara Nasser",
    yearGroup: "Y9",
    department: "Lower Sec",
    churnScore: 62,
    churnLevel: "Medium",
    topSignal: "Unresolved concern",
    daysSinceContact: 5,
  },
  {
    id: "6",
    studentId: "IMI-0006",
    name: "Reem Al-Dosari",
    yearGroup: "Y6",
    department: "Primary",
    churnScore: 58,
    churnLevel: "Medium",
    topSignal: "Missed 3+ sessions",
    daysSinceContact: 21,
  },
  {
    id: "7",
    studentId: "IMI-0007",
    name: "Faris Qasim",
    yearGroup: "Y11",
    department: "Senior",
    churnScore: 55,
    churnLevel: "Medium",
    topSignal: "NPS low",
    daysSinceContact: 9,
  },
  {
    id: "8",
    studentId: "IMI-0008",
    name: "Nour Ibrahim",
    yearGroup: "Y4",
    department: "Primary",
    churnScore: 52,
    churnLevel: "Medium",
    topSignal: "Overdue invoice",
    daysSinceContact: 14,
  },
];

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

export const operationalThresholds: OperationalThreshold[] = [
  {
    id: "occupancy",
    metric: "Seat Occupancy",
    current: "74%",
    target: "target 80%",
    status: "warning",
    statusLabel: "Below Target",
  },
  {
    id: "overdue-rate",
    metric: "Overdue Invoice Rate",
    current: "8.1%",
    target: "threshold 10%",
    status: "ok",
    statusLabel: "Within Range",
  },
  {
    id: "concerns",
    metric: "Unresolved Concerns",
    current: "8 open",
    target: "threshold 5",
    status: "critical",
    statusLabel: "Above Threshold",
  },
  {
    id: "low-occ",
    metric: "Low Occupancy Sessions",
    current: "6 sessions",
    target: "threshold 4",
    status: "warning",
    statusLabel: "Monitor",
  },
  {
    id: "churn-cooldown",
    metric: "Churn Alert Cooldown",
    current: "12 students",
    target: "threshold 10",
    status: "warning",
    statusLabel: "Monitor",
  },
];

// ─── Revenue Data ─────────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  month: string;
  invoiced: number;
  collected: number;
}

export const revenueData: RevenueDataPoint[] = [
  { month: "Nov", invoiced: 198000, collected: 172000 },
  { month: "Dec", invoiced: 241000, collected: 209000 },
  { month: "Jan", invoiced: 267000, collected: 228000 },
  { month: "Feb", invoiced: 255000, collected: 218000 },
  { month: "Mar", invoiced: 271000, collected: 234000 },
  { month: "Apr", invoiced: 284000, collected: 241000 },
];

// ─── Occupancy Heatmap ────────────────────────────────────────────────────────

export interface OccupancyCell {
  day: string;
  time: string;
  occupancy: number;
}

export const occupancyHeatmap: OccupancyCell[] = [
  // 14:00
  { day: "Mon", time: "14:00", occupancy: 42 },
  { day: "Tue", time: "14:00", occupancy: 38 },
  { day: "Wed", time: "14:00", occupancy: 55 },
  { day: "Thu", time: "14:00", occupancy: 48 },
  { day: "Fri", time: "14:00", occupancy: 30 },
  // 15:00
  { day: "Mon", time: "15:00", occupancy: 78 },
  { day: "Tue", time: "15:00", occupancy: 82 },
  { day: "Wed", time: "15:00", occupancy: 74 },
  { day: "Thu", time: "15:00", occupancy: 88 },
  { day: "Fri", time: "15:00", occupancy: 65 },
  // 16:00
  { day: "Mon", time: "16:00", occupancy: 91 },
  { day: "Tue", time: "16:00", occupancy: 87 },
  { day: "Wed", time: "16:00", occupancy: 93 },
  { day: "Thu", time: "16:00", occupancy: 89 },
  { day: "Fri", time: "16:00", occupancy: 72 },
  // 17:00
  { day: "Mon", time: "17:00", occupancy: 95 },
  { day: "Tue", time: "17:00", occupancy: 92 },
  { day: "Wed", time: "17:00", occupancy: 88 },
  { day: "Thu", time: "17:00", occupancy: 96 },
  { day: "Fri", time: "17:00", occupancy: 80 },
  // 18:00
  { day: "Mon", time: "18:00", occupancy: 86 },
  { day: "Tue", time: "18:00", occupancy: 90 },
  { day: "Wed", time: "18:00", occupancy: 83 },
  { day: "Thu", time: "18:00", occupancy: 91 },
  { day: "Fri", time: "18:00", occupancy: 76 },
  // 19:00
  { day: "Mon", time: "19:00", occupancy: 70 },
  { day: "Tue", time: "19:00", occupancy: 75 },
  { day: "Wed", time: "19:00", occupancy: 68 },
  { day: "Thu", time: "19:00", occupancy: 79 },
  { day: "Fri", time: "19:00", occupancy: 58 },
  // 20:00
  { day: "Mon", time: "20:00", occupancy: 44 },
  { day: "Tue", time: "20:00", occupancy: 51 },
  { day: "Wed", time: "20:00", occupancy: 40 },
  { day: "Thu", time: "20:00", occupancy: 56 },
  { day: "Fri", time: "20:00", occupancy: 35 },
  // 20:30
  { day: "Mon", time: "20:30", occupancy: 22 },
  { day: "Tue", time: "20:30", occupancy: 28 },
  { day: "Wed", time: "20:30", occupancy: 18 },
  { day: "Thu", time: "20:30", occupancy: 32 },
  { day: "Fri", time: "20:30", occupancy: 15 },
];

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
  | "report"
  | "re-enrolment";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  description: string;
  timeAgo: string;
}

export const activityFeed: ActivityEvent[] = [
  {
    id: "1",
    type: "enrolment",
    description: "Hamdan Al-Maktoum enrolled in Y7 Maths",
    timeAgo: "2 min ago",
  },
  {
    id: "2",
    type: "payment",
    description: "AED 3,200 received — Sara Nasser (Y9)",
    timeAgo: "8 min ago",
  },
  {
    id: "3",
    type: "concern",
    description: "Teaching quality concern — Omar Al-Farsi (Y5 English)",
    timeAgo: "14 min ago",
  },
  {
    id: "4",
    type: "invoice",
    description: "Invoice #1042 overdue — Layla Hassan (Y10)",
    timeAgo: "22 min ago",
  },
  {
    id: "5",
    type: "trial",
    description: "Fatima Al-Shehhi completed trial — Y4 Maths",
    timeAgo: "35 min ago",
  },
  {
    id: "6",
    type: "payment",
    description: "AED 1,800 received — Ziad Khalil (Y3)",
    timeAgo: "51 min ago",
  },
  {
    id: "7",
    type: "assessment",
    description: "CAT4 assessment booked — Nour Ibrahim (Y4)",
    timeAgo: "1 hr ago",
  },
  {
    id: "8",
    type: "lead",
    description: "New enquiry via WhatsApp — Y6 Science",
    timeAgo: "1.5 hr ago",
  },
  {
    id: "9",
    type: "staff",
    description: "Immediate Access Revocation — Mariam Saleh (TA)",
    timeAgo: "2 hr ago",
  },
  {
    id: "10",
    type: "task",
    description: "Invoice reconciliation task closed — Admin",
    timeAgo: "2.5 hr ago",
  },
  {
    id: "11",
    type: "re-enrolment",
    description: "Reem Al-Dosari re-enrolled for Term 3",
    timeAgo: "3 hr ago",
  },
  {
    id: "12",
    type: "report",
    description: "Weekly digest dispatched to Admin Head",
    timeAgo: "4 hr ago",
  },
];

// ─── Student Detail (IMI-0001 — Aisha Rahman) ────────────────────────────────

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
  enrolments: [
    {
      id: "enr-001",
      subject: "Y8 Maths",
      teacher: "Mr Ahmed Khalil",
      schedule: "Mon & Wed, 15:00–16:00",
      room: "Room 3A",
      color: "amber" as const,
      packageStatus: "Expiring" as const,
      sessionsTotal: 20,
      sessionsAttended: 14,
      sessionsAbsent: 2,
      sessionsRemaining: 4,
      packageStart: "6 Jan 2025",
      sessionsPurchased: 20,
    },
    {
      id: "enr-002",
      subject: "Y8 English",
      teacher: "Ms Sarah Mitchell",
      schedule: "Tue & Thu, 16:00–17:00",
      room: "Room 2B",
      color: "teal" as const,
      packageStatus: "Active" as const,
      sessionsTotal: 18,
      sessionsAttended: 12,
      sessionsAbsent: 1,
      sessionsRemaining: 5,
      packageStart: "6 Jan 2025",
      sessionsPurchased: 18,
    },
    {
      id: "enr-003",
      subject: "Y8 Science",
      teacher: "Mr Tariq Al-Amin",
      schedule: "Fri, 14:00–15:00",
      room: "Room 1C",
      color: "blue" as const,
      packageStatus: "Active" as const,
      sessionsTotal: 10,
      sessionsAttended: 7,
      sessionsAbsent: 1,
      sessionsRemaining: 2,
      packageStart: "3 Feb 2025",
      sessionsPurchased: 10,
    },
  ] as StudentEnrolment[],

  upcomingSessions: [
    { date: "Mon 21 Apr", time: "15:00", subject: "Y8 Maths",   teacher: "Mr Ahmed Khalil",    room: "Room 3A" },
    { date: "Tue 22 Apr", time: "16:00", subject: "Y8 English", teacher: "Ms Sarah Mitchell",   room: "Room 2B" },
    { date: "Wed 23 Apr", time: "15:00", subject: "Y8 Maths",   teacher: "Mr Ahmed Khalil",    room: "Room 3A" },
    { date: "Thu 24 Apr", time: "16:00", subject: "Y8 English", teacher: "Ms Sarah Mitchell",   room: "Room 2B" },
    { date: "Fri 25 Apr", time: "14:00", subject: "Y8 Science", teacher: "Mr Tariq Al-Amin",   room: "Room 1C" },
  ] as UpcomingSession[],

  activityTimeline: [
    { type: "invoice",    description: "Invoice issued — Invoice #1042, AED 3,200",             timeAgo: "3 days ago"  },
    { type: "absence",    description: "Absence marked — Y8 Maths, Mon 14 Apr",                 timeAgo: "5 days ago"  },
    { type: "payment",    description: "Payment received — AED 1,800, Bank Transfer",           timeAgo: "8 days ago"  },
    { type: "concern",    description: "Concern raised — L1, Y8 Maths, Inconsistent attendance",timeAgo: "10 days ago" },
    { type: "assignment", description: "Assignment submitted — Algebra Practice Test",           timeAgo: "12 days ago" },
    { type: "session",    description: "Session attended — Y8 English, Tue 8 Apr",              timeAgo: "12 days ago" },
    { type: "enrolment",  description: "Enrolment added — Y8 Science",                          timeAgo: "14 days ago" },
    { type: "message",    description: "Message sent — WhatsApp, payment reminder",             timeAgo: "15 days ago" },
    { type: "invoice",    description: "Invoice issued — Invoice #0998, AED 1,800",             timeAgo: "20 days ago" },
    { type: "session",    description: "Session attended — Y8 Maths, Mon 31 Mar",               timeAgo: "22 days ago" },
  ] as ActivityEvent2[],

  invoices: [
    { id: "INV-1042", date: "13 Apr", description: "Y8 Maths — Term 3",   amount: "AED 3,200", status: "Overdue" as const },
    { id: "INV-0998", date: "22 Mar", description: "Y8 English — Term 3", amount: "AED 2,880", status: "Paid"    as const },
    { id: "INV-0967", date: "22 Mar", description: "Y8 Science — Term 3", amount: "AED 1,440", status: "Paid"    as const },
    { id: "INV-0821", date: "10 Jan", description: "Y8 Maths — Term 2",   amount: "AED 3,200", status: "Paid"    as const },
  ] as StudentInvoice[],

  attendanceSummary: {
    termRate: "87%",
    allTimeRate: "91%",
    consecutiveAbsences: 1,
    noShows: 0,
  },

  attendanceBySubject: [
    { subject: "Y8 Maths",   rate: "82%", attended: 14, absent: 2, makeupAllowance: 0, makeupUsed: 1 },
    { subject: "Y8 English", rate: "92%", attended: 12, absent: 1, makeupAllowance: 1, makeupUsed: 0 },
    { subject: "Y8 Science", rate: "88%", attended: 7,  absent: 1, makeupAllowance: 1, makeupUsed: 0 },
  ] as AttendanceSubjectSummary[],

  makeupLog: [
    { session: "Mon 7 Apr", subject: "Y8 Maths", makeupDate: "Sat 12 Apr", status: "Completed" as const,               },
    { session: "Wed 9 Apr", subject: "Y8 Maths", makeupDate: "Sat 26 Apr", status: "Pending"   as const, expiring: true },
  ] as MakeupLogEntry[],

  attendanceHistory: [
    { date: "Mon 14 Apr", subject: "Y8 Maths",   status: "Absent"  as const },
    { date: "Thu 10 Apr", subject: "Y8 English",  status: "Present" as const },
    { date: "Wed 9 Apr",  subject: "Y8 Maths",   status: "Absent"  as const },
    { date: "Tue 8 Apr",  subject: "Y8 English",  status: "Present" as const },
    { date: "Mon 7 Apr",  subject: "Y8 Maths",   status: "Present" as const },
    { date: "Fri 4 Apr",  subject: "Y8 Science",  status: "Present" as const },
    { date: "Thu 3 Apr",  subject: "Y8 English",  status: "Present" as const },
    { date: "Wed 2 Apr",  subject: "Y8 Maths",   status: "Present" as const },
    { date: "Tue 1 Apr",  subject: "Y8 English",  status: "Present" as const },
    { date: "Mon 31 Mar", subject: "Y8 Maths",   status: "Present" as const },
  ] as AttendanceHistoryRow[],

  grades: {
    maths: {
      target: "A*",
      predicted: "B+",
      assignments: [
        { title: "Algebra Practice Test",  due: "10 Apr", submitted: "12 Apr", score: "78%", status: "Graded" },
        { title: "Quadratics Quiz",         due: "1 Apr",  submitted: "1 Apr",  score: "84%", status: "Graded" },
        { title: "Geometry Homework",       due: "25 Mar", submitted: "24 Mar", score: "91%", status: "Graded" },
      ] as GradeAssignment[],
    } as SubjectGrades,
    english: {
      target: "A",
      predicted: "A-",
      assignments: [
        { title: "Essay — Persuasive Writing", due: "15 Apr", submitted: "15 Apr", score: "82%", status: "Graded" },
        { title: "Reading Comprehension",       due: "5 Apr",  submitted: "5 Apr",  score: "76%", status: "Graded" },
      ] as GradeAssignment[],
    } as SubjectGrades,
  },

  tasks: [
    { task: "Follow up on overdue invoice",       priority: "High"   as const, assignedTo: "Jason Daswani", due: "22 Apr", status: "Open" as const },
    { task: "Book parent meeting re: attendance", priority: "Medium" as const, assignedTo: "Jason Daswani", due: "25 Apr", status: "Open" as const },
  ] as StudentTask[],

  concerns: [
    {
      subject:     "Y8 Maths",
      trigger:     "Inconsistent attendance (3 absences in 45-day window)",
      raised:      "10 Apr",
      raisedBy:    "Mr Ahmed Khalil",
      level:       "L1",
      levelLabel:  "Teacher + HOD",
      assignedTo:  "HOD Lower Secondary",
      status:      "Active" as const,
    },
  ] as StudentConcern[],

  communicationLog: [
    { date: "15 Apr", channel: "WhatsApp" as const, message: "Payment reminder — INV-1042",     sentBy: "Automated", status: "Delivered" },
    { date: "8 Apr",  channel: "Email"    as const, message: "Term 3 schedule confirmation",    sentBy: "Admin",      status: "Read"      },
    { date: "1 Apr",  channel: "WhatsApp" as const, message: "Absence notification — 31 Mar",  sentBy: "Automated", status: "Delivered" },
    { date: "22 Mar", channel: "Email"    as const, message: "Invoice issued — INV-0998",       sentBy: "Automated", status: "Read"      },
    { date: "10 Mar", channel: "WhatsApp" as const, message: "Re-enrolment reminder",           sentBy: "Automated", status: "Delivered" },
  ] as CommLogEntry[],
};

// ─── Leads ────────────────────────────────────────────────────────────────────

export type LeadStage =
  | "New"
  | "Contacted"
  | "Assessment Booked"
  | "Assessment Done"
  | "Trial Booked"
  | "Schedule Offered"
  | "Invoice Sent"
  | "Won";

export type LeadSource = "Website" | "Phone" | "Walk-in" | "Referral" | "Event";

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
}

export const leads: Lead[] = [
  { id: "L-0041", ref: "IMI-L-0041", childName: "Bilal Mahmood", yearGroup: "Y7", department: "Lower Secondary", subjects: ["Maths"], guardian: "Tariq Mahmood", guardianPhone: "+971 50 111 2222", source: "Website", stage: "New", assignedTo: "Jason Daswani", lastActivity: "Today", daysInStage: 1, daysInPipeline: 1, dnc: false, sibling: false, stageMessagePending: true },
  { id: "L-0042", ref: "IMI-L-0042", childName: "Hessa Al-Blooshi", yearGroup: "Y4", department: "Primary", subjects: ["English", "Maths"], guardian: "Noura Al-Blooshi", guardianPhone: "+971 55 222 3333", source: "Referral", stage: "New", assignedTo: "Sarah Admin", lastActivity: "Today", daysInStage: 1, daysInPipeline: 1, dnc: false, sibling: true, stageMessagePending: false },
  { id: "L-0043", ref: "IMI-L-0043", childName: "Ahmed Saleh", yearGroup: "Y10", department: "Senior", subjects: ["Physics", "Maths"], guardian: "Omar Saleh", guardianPhone: "+971 52 333 4444", source: "Phone", stage: "New", assignedTo: "Jason Daswani", lastActivity: "Yesterday", daysInStage: 2, daysInPipeline: 2, dnc: false, sibling: false, stageMessagePending: false },
  { id: "L-0044", ref: "IMI-L-0044", childName: "Rana Farouk", yearGroup: "Y2", department: "Primary", subjects: ["English"], guardian: "Dina Farouk", guardianPhone: "+971 50 444 5555", source: "Walk-in", stage: "New", assignedTo: "Sarah Admin", lastActivity: "2 days ago", daysInStage: 2, daysInPipeline: 2, dnc: false, sibling: false, stageMessagePending: true },
  { id: "L-0045", ref: "IMI-L-0045", childName: "Saif Al-Nuaimi", yearGroup: "Y9", department: "Lower Secondary", subjects: ["Science"], guardian: "Moza Al-Nuaimi", guardianPhone: "+971 55 555 6666", source: "Website", stage: "Contacted", assignedTo: "Jason Daswani", lastActivity: "Today", daysInStage: 3, daysInPipeline: 5, dnc: false, sibling: false, stageMessagePending: false },
  { id: "L-0046", ref: "IMI-L-0046", childName: "Lama Qasim", yearGroup: "Y6", department: "Primary", subjects: ["Maths", "Science"], guardian: "Faisal Qasim", guardianPhone: "+971 52 666 7777", source: "Referral", stage: "Contacted", assignedTo: "Sarah Admin", lastActivity: "Yesterday", daysInStage: 4, daysInPipeline: 6, dnc: false, sibling: true, stageMessagePending: false },
  { id: "L-0047", ref: "IMI-L-0047", childName: "Yousuf Al-Hammadi", yearGroup: "Y11", department: "Senior", subjects: ["Chemistry", "Biology"], guardian: "Reem Al-Hammadi", guardianPhone: "+971 50 777 8888", source: "Event", stage: "Contacted", assignedTo: "Jason Daswani", lastActivity: "2 days ago", daysInStage: 5, daysInPipeline: 7, dnc: false, sibling: false, stageMessagePending: true },
  { id: "L-0048", ref: "IMI-L-0048", childName: "Fatma Al-Marri", yearGroup: "Y3", department: "Primary", subjects: ["English"], guardian: "Hamad Al-Marri", guardianPhone: "+971 55 888 9999", source: "Phone", stage: "Contacted", assignedTo: "Sarah Admin", lastActivity: "3 days ago", daysInStage: 3, daysInPipeline: 8, dnc: false, sibling: false, stageMessagePending: false },
  { id: "L-0049", ref: "IMI-L-0049", childName: "Khalifa Rashid", yearGroup: "Y8", department: "Lower Secondary", subjects: ["Maths"], guardian: "Hind Rashid", guardianPhone: "+971 52 999 0000", source: "Website", stage: "Contacted", assignedTo: "Jason Daswani", lastActivity: "4 days ago", daysInStage: 6, daysInPipeline: 9, dnc: true, sibling: false, stageMessagePending: false },
  { id: "L-0050", ref: "IMI-L-0050", childName: "Nadia Al-Ghaith", yearGroup: "Y5", department: "Primary", subjects: ["Maths", "English"], guardian: "Jassem Al-Ghaith", guardianPhone: "+971 50 100 2000", source: "Referral", stage: "Assessment Booked", assignedTo: "Sarah Admin", lastActivity: "Today", daysInStage: 2, daysInPipeline: 10, dnc: false, sibling: false, stageMessagePending: true },
  { id: "L-0051", ref: "IMI-L-0051", childName: "Rashid Al-Ketbi", yearGroup: "Y12", department: "Senior", subjects: ["Maths", "Physics"], guardian: "Mariam Al-Ketbi", guardianPhone: "+971 55 200 3000", source: "Website", stage: "Assessment Booked", assignedTo: "Jason Daswani", lastActivity: "Yesterday", daysInStage: 3, daysInPipeline: 11, dnc: false, sibling: false, stageMessagePending: false },
  { id: "L-0052", ref: "IMI-L-0052", childName: "Shaikha Bin Saeed", yearGroup: "Y1", department: "Primary", subjects: ["English"], guardian: "Latifa Bin Saeed", guardianPhone: "+971 52 300 4000", source: "Walk-in", stage: "Assessment Booked", assignedTo: "Sarah Admin", lastActivity: "2 days ago", daysInStage: 4, daysInPipeline: 12, dnc: false, sibling: true, stageMessagePending: false },
  { id: "L-0053", ref: "IMI-L-0053", childName: "Obaid Al-Falasi", yearGroup: "Y9", department: "Lower Secondary", subjects: ["Science", "Maths"], guardian: "Wafa Al-Falasi", guardianPhone: "+971 50 400 5000", source: "Event", stage: "Assessment Done", assignedTo: "Jason Daswani", lastActivity: "Today", daysInStage: 1, daysInPipeline: 13, dnc: false, sibling: false, stageMessagePending: true },
  { id: "L-0054", ref: "IMI-L-0054", childName: "Mira Al-Suwaidi", yearGroup: "Y7", department: "Lower Secondary", subjects: ["English"], guardian: "Sultan Al-Suwaidi", guardianPhone: "+971 55 500 6000", source: "Referral", stage: "Assessment Done", assignedTo: "Sarah Admin", lastActivity: "Yesterday", daysInStage: 2, daysInPipeline: 14, dnc: false, sibling: false, stageMessagePending: false },
  { id: "L-0055", ref: "IMI-L-0055", childName: "Talal Mansouri", yearGroup: "Y11", department: "Senior", subjects: ["Chemistry"], guardian: "Aisha Mansouri", guardianPhone: "+971 52 600 7000", source: "Phone", stage: "Assessment Done", assignedTo: "Jason Daswani", lastActivity: "3 days ago", daysInStage: 4, daysInPipeline: 15, dnc: false, sibling: false, stageMessagePending: false },
  { id: "L-0056", ref: "IMI-L-0056", childName: "Rawan Al-Zarooni", yearGroup: "Y4", department: "Primary", subjects: ["Maths"], guardian: "Khalid Al-Zarooni", guardianPhone: "+971 50 700 8000", source: "Website", stage: "Trial Booked", assignedTo: "Sarah Admin", lastActivity: "Today", daysInStage: 1, daysInPipeline: 16, dnc: false, sibling: true, stageMessagePending: true },
  { id: "L-0057", ref: "IMI-L-0057", childName: "Majid Al-Romaithi", yearGroup: "Y8", department: "Lower Secondary", subjects: ["Maths", "English"], guardian: "Fatima Al-Romaithi", guardianPhone: "+971 55 800 9000", source: "Referral", stage: "Trial Booked", assignedTo: "Jason Daswani", lastActivity: "Yesterday", daysInStage: 2, daysInPipeline: 17, dnc: false, sibling: false, stageMessagePending: false },
  { id: "L-0058", ref: "IMI-L-0058", childName: "Sara Al-Shamsi", yearGroup: "Y6", department: "Primary", subjects: ["Science", "Maths", "English"], guardian: "Eisa Al-Shamsi", guardianPhone: "+971 52 900 0100", source: "Website", stage: "Schedule Offered", assignedTo: "Sarah Admin", lastActivity: "2 days ago", daysInStage: 3, daysInPipeline: 18, dnc: false, sibling: false, stageMessagePending: false },
  { id: "L-0059", ref: "IMI-L-0059", childName: "Hamdan Al-Mazrouei", yearGroup: "Y10", department: "Senior", subjects: ["Physics"], guardian: "Hessa Al-Mazrouei", guardianPhone: "+971 50 010 0200", source: "Event", stage: "Invoice Sent", assignedTo: "Jason Daswani", lastActivity: "Today", daysInStage: 1, daysInPipeline: 20, dnc: false, sibling: false, stageMessagePending: false },
  { id: "L-0060", ref: "IMI-L-0060", childName: "Amna Al-Qubaisi", yearGroup: "Y3", department: "Primary", subjects: ["English", "Maths"], guardian: "Saeed Al-Qubaisi", guardianPhone: "+971 55 020 0300", source: "Referral", stage: "Won", assignedTo: "Sarah Admin", lastActivity: "Yesterday", daysInStage: 0, daysInPipeline: 22, dnc: false, sibling: false, stageMessagePending: false },
];

// ─── Finance ──────────────────────────────────────────────────────────────────

export type InvoiceStatus = "Draft" | "Issued" | "Part" | "Paid" | "Overdue" | "Cancelled";
export type PaymentMethod = "Cash" | "Bank Transfer" | "Cheque" | "Card";
export type CreditStatus = "Applied" | "Unused";

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
}

export interface Payment {
  date: string;
  student: string;
  invoice: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  recordedBy: string;
}

export interface Credit {
  date: string;
  student: string;
  amount: number;
  reason: string;
  issuedBy: string;
  status: CreditStatus;
}

export const invoices: Invoice[] = [
  { id: "INV-1042", studentId: "IMI-0001", student: "Aisha Rahman",       yearGroup: "Y8",  department: "Lower Secondary", guardian: "Fatima Rahman",       description: "Y8 Maths — Term 3",                      issueDate: "13 Apr 2025", dueDate: "20 Apr 2025", amount:  3360, amountPaid:     0, status: "Overdue" },
  { id: "INV-1041", studentId: "IMI-0002", student: "Omar Al-Farsi",       yearGroup: "Y5",  department: "Primary",         guardian: "Khalid Al-Farsi",     description: "Y5 Maths + English — Term 3",            issueDate: "12 Apr 2025", dueDate: "19 Apr 2025", amount:  6720, amountPaid:     0, status: "Overdue" },
  { id: "INV-1040", studentId: "IMI-0003", student: "Layla Hassan",        yearGroup: "Y10", department: "Senior",          guardian: "Nadia Hassan",        description: "Y10 Physics + Maths — Term 3",           issueDate: "11 Apr 2025", dueDate: "18 Apr 2025", amount:  7560, amountPaid:  3780, status: "Part"    },
  { id: "INV-1039", studentId: "IMI-0009", student: "Hamdan Al-Maktoum",   yearGroup: "Y7",  department: "Lower Secondary", guardian: "Shaikha Al-Maktoum",  description: "Y7 Maths — Term 3",                      issueDate: "10 Apr 2025", dueDate: "17 Apr 2025", amount:  3360, amountPaid:  3360, status: "Paid"    },
  { id: "INV-1038", studentId: "IMI-0010", student: "Fatima Al-Shehhi",    yearGroup: "Y4",  department: "Primary",         guardian: "Noura Al-Shehhi",     description: "Y4 English — Term 3",                    issueDate: "10 Apr 2025", dueDate: "17 Apr 2025", amount:  3360, amountPaid:  3360, status: "Paid"    },
  { id: "INV-1037", studentId: "IMI-0011", student: "Khalid Mansoor",      yearGroup: "Y12", department: "Senior",          guardian: "Amal Mansoor",        description: "Y12 Maths + Physics + Chemistry — Term 3",issueDate:  "9 Apr 2025", dueDate: "16 Apr 2025", amount: 11340, amountPaid: 11340, status: "Paid"    },
  { id: "INV-1036", studentId: "IMI-0012", student: "Dana Al-Zaabi",       yearGroup: "Y2",  department: "Primary",         guardian: "Saeed Al-Zaabi",      description: "Y2 English + Maths — Term 3",            issueDate:  "8 Apr 2025", dueDate: "15 Apr 2025", amount:  6720, amountPaid:  6720, status: "Paid"    },
  { id: "INV-1035", studentId: "IMI-0013", student: "Yousef Salim",        yearGroup: "Y9",  department: "Lower Secondary", guardian: "Mona Salim",          description: "Y9 Science + Maths + English — Term 3",  issueDate:  "7 Apr 2025", dueDate: "14 Apr 2025", amount: 10080, amountPaid:  5040, status: "Part"    },
  { id: "INV-1034", studentId: "IMI-0014", student: "Mariam Al-Suwaidi",   yearGroup: "Y13", department: "Senior",          guardian: "Jassim Al-Suwaidi",   description: "Y13 Maths + English — Term 3",           issueDate:  "6 Apr 2025", dueDate: "13 Apr 2025", amount:  7560, amountPaid:  7560, status: "Paid"    },
  { id: "INV-1033", studentId: "IMI-0015", student: "Adam Benali",         yearGroup: "Y6",  department: "Primary",         guardian: "Sofia Benali",        description: "Y6 Maths + English — Term 3",            issueDate:  "5 Apr 2025", dueDate: "12 Apr 2025", amount:  7056, amountPaid:  7056, status: "Paid"    },
  { id: "INV-1032", studentId: "IMI-0005", student: "Sara Nasser",         yearGroup: "Y9",  department: "Lower Secondary", guardian: "Hessa Nasser",        description: "Y9 Maths — Term 3",                      issueDate:  "4 Apr 2025", dueDate: "11 Apr 2025", amount:  3360, amountPaid:     0, status: "Overdue" },
  { id: "INV-1031", studentId: "IMI-0007", student: "Faris Qasim",         yearGroup: "Y11", department: "Senior",          guardian: "Tariq Qasim",         description: "Y11 Physics + Chemistry — Term 3",       issueDate:  "3 Apr 2025", dueDate: "10 Apr 2025", amount:  7560, amountPaid:  7560, status: "Paid"    },
  { id: "INV-1030", studentId: "IMI-0008", student: "Nour Ibrahim",        yearGroup: "Y4",  department: "Primary",         guardian: "Leila Ibrahim",       description: "Y4 Maths — Term 3",                      issueDate:  "2 Apr 2025", dueDate:  "9 Apr 2025", amount:  3360, amountPaid:  3360, status: "Paid"    },
  { id: "INV-1029", studentId: "IMI-0006", student: "Reem Al-Dosari",      yearGroup: "Y6",  department: "Primary",         guardian: "Maryam Al-Dosari",    description: "Y6 Science + Maths — Term 3",            issueDate:  "1 Apr 2025", dueDate:  "8 Apr 2025", amount:  7056, amountPaid:     0, status: "Overdue" },
  { id: "INV-1028", studentId: "IMI-0004", student: "Ziad Khalil",         yearGroup: "Y3",  department: "Primary",         guardian: "Rami Khalil",         description: "Y3 English + Maths — Term 3",            issueDate: "31 Mar 2025", dueDate:  "7 Apr 2025", amount:  6720, amountPaid:  6720, status: "Paid"    },
  { id: "INV-1027", studentId: "IMI-0020", student: "Raya Khouri",         yearGroup: "Y3",  department: "Primary",         guardian: "Elias Khouri",        description: "Y3 Maths + English — Term 3",            issueDate: "30 Mar 2025", dueDate:  "6 Apr 2025", amount:  6720, amountPaid:  6720, status: "Paid"    },
  { id: "INV-1026", studentId: "IMI-0003", student: "Layla Hassan",        yearGroup: "Y10", department: "Senior",          guardian: "Nadia Hassan",        description: "Y10 English — Term 3",                   issueDate: "28 Mar 2025", dueDate:  "4 Apr 2025", amount:  3780, amountPaid:  3780, status: "Paid"    },
  { id: "INV-1025", studentId: "IMI-0001", student: "Aisha Rahman",        yearGroup: "Y8",  department: "Lower Secondary", guardian: "Fatima Rahman",       description: "Y8 English — Term 3",                    issueDate: "22 Mar 2025", dueDate: "29 Mar 2025", amount:  3024, amountPaid:  3024, status: "Paid"    },
  { id: "INV-1024", studentId: "IMI-0009", student: "Hamdan Al-Maktoum",   yearGroup: "Y7",  department: "Lower Secondary", guardian: "Shaikha Al-Maktoum",  description: "Y7 English — Term 3",                    issueDate: "20 Mar 2025", dueDate: "27 Mar 2025", amount:  3024, amountPaid:  3024, status: "Paid"    },
  { id: "INV-1023", studentId: "IMI-0011", student: "Khalid Mansoor",      yearGroup: "Y12", department: "Senior",          guardian: "Amal Mansoor",        description: "Y12 Biology — Term 3 [Draft]",           issueDate: "16 Apr 2025", dueDate: "23 Apr 2025", amount:  3780, amountPaid:     0, status: "Draft"   },
];

export const payments: Payment[] = [
  { date: "15 Apr 2025", student: "Hamdan Al-Maktoum", invoice: "INV-1039", amount:  3360, method: "Bank Transfer", reference: "TRF-88421", recordedBy: "Jason Daswani" },
  { date: "15 Apr 2025", student: "Fatima Al-Shehhi",  invoice: "INV-1038", amount:  3360, method: "Cash",          reference: "",          recordedBy: "Sarah Admin"   },
  { date: "14 Apr 2025", student: "Layla Hassan",       invoice: "INV-1040", amount:  3780, method: "Bank Transfer", reference: "TRF-88390", recordedBy: "Jason Daswani" },
  { date: "13 Apr 2025", student: "Khalid Mansoor",     invoice: "INV-1037", amount: 11340, method: "Bank Transfer", reference: "TRF-88301", recordedBy: "Jason Daswani" },
  { date: "12 Apr 2025", student: "Dana Al-Zaabi",      invoice: "INV-1036", amount:  6720, method: "Cash",          reference: "",          recordedBy: "Sarah Admin"   },
  { date: "11 Apr 2025", student: "Mariam Al-Suwaidi",  invoice: "INV-1034", amount:  7560, method: "Bank Transfer", reference: "TRF-88201", recordedBy: "Jason Daswani" },
  { date: "10 Apr 2025", student: "Adam Benali",        invoice: "INV-1033", amount:  7056, method: "Bank Transfer", reference: "TRF-88155", recordedBy: "Jason Daswani" },
  { date:  "9 Apr 2025", student: "Faris Qasim",        invoice: "INV-1031", amount:  7560, method: "Cheque",        reference: "CHQ-441",   recordedBy: "Sarah Admin"   },
  { date:  "8 Apr 2025", student: "Nour Ibrahim",       invoice: "INV-1030", amount:  3360, method: "Cash",          reference: "",          recordedBy: "Sarah Admin"   },
  { date:  "7 Apr 2025", student: "Yousef Salim",       invoice: "INV-1035", amount:  5040, method: "Bank Transfer", reference: "TRF-88010", recordedBy: "Jason Daswani" },
];

export const creditLedger: Credit[] = [
  { date: "10 Apr 2025", student: "Aisha Rahman",  amount:  800, reason: "Session cancelled by teacher — goodwill credit",     issuedBy: "Jason Daswani", status: "Unused"  },
  { date:  "8 Apr 2025", student: "Yousef Salim",  amount:  400, reason: "Billing adjustment — session deducted in error",      issuedBy: "Sarah Admin",   status: "Applied" },
  { date:  "5 Apr 2025", student: "Sara Nasser",   amount: 1200, reason: "Overpayment on INV-1032 — pre-collected credit",      issuedBy: "Jason Daswani", status: "Unused"  },
  { date:  "1 Apr 2025", student: "Omar Al-Farsi", amount:  800, reason: "Goodwill credit — rescheduling disruption",           issuedBy: "Jason Daswani", status: "Applied" },
  { date: "28 Mar 2025", student: "Layla Hassan",  amount: 1200, reason: "Credit note — withdrawal mid-package",                issuedBy: "Jason Daswani", status: "Applied" },
  { date: "25 Mar 2025", student: "Reem Al-Dosari",amount:  400, reason: "Session cancellation — teacher absent",               issuedBy: "Sarah Admin",   status: "Applied" },
];

export const financeStats = {
  totalInvoiced:  284500,
  collected:      241200,
  outstanding:     43300,
  overdue:         18400,
  overdueCount:       23,
  receivedThisMonth:  84200,
  cash:           12400,
  bankTransfer:   71800,
  creditsIssuedThisTerm: 4800,
  creditsApplied: 3200,
  creditsUnused:  1600,
};

// ─── Timetable ────────────────────────────────────────────────────────────────

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
  room: string;
  startTime: string;
  endTime: string;
  duration: number;
  students: string[];
  studentCount: number;
  type: SessionType;
  status: SessionStatus;
}

export const rooms: Room[] = [
  { id: "r1", name: "Room 1A", capacity: 6 },
  { id: "r2", name: "Room 2B", capacity: 4 },
  { id: "r3", name: "Room 3A", capacity: 8 },
  { id: "r4", name: "Room 1C", capacity: 4 },
  { id: "r5", name: "Room 2A", capacity: 6 },
];

export const timetableSessions: TimetableSession[] = [
  // Monday 21 Apr
  { id: "s001", day: "Mon", date: "21 Apr", subject: "Y8 Maths",     department: "Lower Secondary", teacher: "Mr Ahmed Khalil",    room: "Room 3A", startTime: "15:00", endTime: "16:00", duration: 60, students: ["Aisha Rahman", "Omar Al-Farsi", "Sara Nasser"], studentCount: 3, type: "Regular",        status: "Scheduled" },
  { id: "s002", day: "Mon", date: "21 Apr", subject: "Y4 English",   department: "Primary",         teacher: "Ms Sarah Mitchell",  room: "Room 1A", startTime: "15:00", endTime: "16:00", duration: 60, students: ["Nour Ibrahim", "Dana Al-Zaabi"],              studentCount: 2, type: "Regular",        status: "Scheduled" },
  { id: "s003", day: "Mon", date: "21 Apr", subject: "Y12 Maths",    department: "Senior",          teacher: "Mr Faris Al-Amin",   room: "Room 2A", startTime: "16:00", endTime: "17:00", duration: 60, students: ["Khalid Mansoor", "Mariam Al-Suwaidi"],       studentCount: 2, type: "Regular",        status: "Scheduled" },
  { id: "s004", day: "Mon", date: "21 Apr", subject: "Y6 Science",   department: "Primary",         teacher: "Ms Hana Yusuf",      room: "Room 1C", startTime: "14:00", endTime: "15:00", duration: 60, students: ["Reem Al-Dosari", "Adam Benali"],             studentCount: 2, type: "Regular",        status: "Scheduled" },
  { id: "s005", day: "Mon", date: "21 Apr", subject: "Y9 Science",   department: "Lower Secondary", teacher: "Mr Tariq Al-Amin",   room: "Room 2B", startTime: "16:00", endTime: "17:00", duration: 60, students: ["Hamdan Al-Maktoum"],                         studentCount: 1, type: "Trial",          status: "Scheduled" },
  { id: "s006", day: "Mon", date: "21 Apr", subject: "Y10 Physics",  department: "Senior",          teacher: "Mr Faris Al-Amin",   room: "Room 2A", startTime: "17:00", endTime: "18:00", duration: 60, students: ["Layla Hassan", "Faris Qasim"],               studentCount: 2, type: "Regular",        status: "Scheduled" },
  { id: "s007", day: "Mon", date: "21 Apr", subject: "Y3 Maths",     department: "Primary",         teacher: "Ms Sarah Mitchell",  room: "Room 1A", startTime: "16:30", endTime: "17:30", duration: 60, students: ["Ziad Khalil", "Raya Khouri"],                studentCount: 2, type: "Regular",        status: "Scheduled" },
  // Tuesday 22 Apr
  { id: "s008", day: "Tue", date: "22 Apr", subject: "Y8 English",   department: "Lower Secondary", teacher: "Ms Sarah Mitchell",  room: "Room 2B", startTime: "16:00", endTime: "17:00", duration: 60, students: ["Aisha Rahman", "Yousef Salim", "Sara Nasser"], studentCount: 3, type: "Regular",       status: "Scheduled" },
  { id: "s009", day: "Tue", date: "22 Apr", subject: "Y5 Maths",     department: "Primary",         teacher: "Mr Ahmed Khalil",    room: "Room 3A", startTime: "15:00", endTime: "16:00", duration: 60, students: ["Nadia Al-Ghaith", "Hessa Al-Blooshi"],       studentCount: 2, type: "Regular",        status: "Scheduled" },
  { id: "s010", day: "Tue", date: "22 Apr", subject: "Y11 Chemistry",department: "Senior",          teacher: "Ms Hana Yusuf",      room: "Room 1C", startTime: "15:00", endTime: "16:00", duration: 60, students: ["Faris Qasim", "Talal Mansouri"],             studentCount: 2, type: "Regular",        status: "Scheduled" },
  { id: "s011", day: "Tue", date: "22 Apr", subject: "Y7 Maths",     department: "Lower Secondary", teacher: "Mr Tariq Al-Amin",   room: "Room 2A", startTime: "17:00", endTime: "18:00", duration: 60, students: ["Hamdan Al-Maktoum", "Majid Al-Romaithi"],    studentCount: 2, type: "Regular",        status: "Scheduled" },
  { id: "s012", day: "Tue", date: "22 Apr", subject: "Y2 English",   department: "Primary",         teacher: "Ms Sarah Mitchell",  room: "Room 1A", startTime: "14:00", endTime: "15:00", duration: 60, students: ["Dana Al-Zaabi"],                             studentCount: 1, type: "Makeup",         status: "Scheduled" },
  { id: "s013", day: "Tue", date: "22 Apr", subject: "Y13 Maths",    department: "Senior",          teacher: "Mr Faris Al-Amin",   room: "Room 2A", startTime: "15:30", endTime: "16:30", duration: 60, students: ["Mariam Al-Suwaidi"],                         studentCount: 1, type: "Regular",        status: "Scheduled" },
  // Wednesday 23 Apr
  { id: "s014", day: "Wed", date: "23 Apr", subject: "Y8 Maths",     department: "Lower Secondary", teacher: "Mr Ahmed Khalil",    room: "Room 3A", startTime: "15:00", endTime: "16:00", duration: 60, students: ["Aisha Rahman", "Omar Al-Farsi", "Sara Nasser"], studentCount: 3, type: "Regular",       status: "Scheduled" },
  { id: "s015", day: "Wed", date: "23 Apr", subject: "Y4 Maths",     department: "Primary",         teacher: "Ms Sarah Mitchell",  room: "Room 1A", startTime: "16:00", endTime: "17:00", duration: 60, students: ["Nour Ibrahim", "Fatima Al-Shehhi"],          studentCount: 2, type: "Regular",        status: "Scheduled" },
  { id: "s016", day: "Wed", date: "23 Apr", subject: "Y10 Maths",    department: "Senior",          teacher: "Mr Faris Al-Amin",   room: "Room 2A", startTime: "17:00", endTime: "18:00", duration: 60, students: ["Layla Hassan"],                              studentCount: 1, type: "Regular",        status: "Scheduled" },
  { id: "s017", day: "Wed", date: "23 Apr", subject: "Y6 Maths",     department: "Primary",         teacher: "Ms Hana Yusuf",      room: "Room 1C", startTime: "15:00", endTime: "16:00", duration: 60, students: ["Reem Al-Dosari", "Adam Benali", "Raya Khouri"], studentCount: 3, type: "Regular",      status: "Scheduled" },
  { id: "s018", day: "Wed", date: "23 Apr", subject: "CAT4 Assessment", department: "Primary",      teacher: "Mr Ahmed Khalil",    room: "Room 2B", startTime: "10:15", endTime: "11:15", duration: 60, students: ["Nour Ibrahim"],                              studentCount: 1, type: "Assessment",     status: "Scheduled" },
  // Thursday 24 Apr
  { id: "s019", day: "Thu", date: "24 Apr", subject: "Y8 English",   department: "Lower Secondary", teacher: "Ms Sarah Mitchell",  room: "Room 2B", startTime: "16:00", endTime: "17:00", duration: 60, students: ["Aisha Rahman", "Yousef Salim"],              studentCount: 2, type: "Regular",        status: "Scheduled" },
  { id: "s020", day: "Thu", date: "24 Apr", subject: "Y9 Maths",     department: "Lower Secondary", teacher: "Mr Tariq Al-Amin",   room: "Room 3A", startTime: "15:00", endTime: "16:00", duration: 60, students: ["Sara Nasser", "Yousef Salim"],               studentCount: 2, type: "Regular",        status: "Scheduled" },
  { id: "s021", day: "Thu", date: "24 Apr", subject: "Y12 Physics",  department: "Senior",          teacher: "Mr Faris Al-Amin",   room: "Room 2A", startTime: "17:00", endTime: "18:00", duration: 60, students: ["Khalid Mansoor"],                            studentCount: 1, type: "Regular",        status: "Scheduled" },
  { id: "s022", day: "Thu", date: "24 Apr", subject: "Staff Meeting", department: "Primary",        teacher: "Jason Daswani",      room: "Room 1A", startTime: "09:00", endTime: "10:00", duration: 60, students: [],                                            studentCount: 0, type: "Meeting",        status: "Scheduled" },
  { id: "s023", day: "Thu", date: "24 Apr", subject: "Y5 English",   department: "Primary",         teacher: "Ms Hana Yusuf",      room: "Room 1C", startTime: "15:00", endTime: "16:00", duration: 60, students: ["Hessa Al-Blooshi"],                          studentCount: 1, type: "Regular",        status: "Scheduled" },
  // Friday 25 Apr
  { id: "s024", day: "Fri", date: "25 Apr", subject: "Y8 Science",   department: "Lower Secondary", teacher: "Mr Tariq Al-Amin",   room: "Room 2B", startTime: "14:00", endTime: "15:00", duration: 60, students: ["Aisha Rahman"],                              studentCount: 1, type: "Regular",        status: "Scheduled" },
  { id: "s025", day: "Fri", date: "25 Apr", subject: "Y11 Biology",  department: "Senior",          teacher: "Ms Hana Yusuf",      room: "Room 1C", startTime: "15:00", endTime: "16:00", duration: 60, students: ["Faris Qasim", "Yousuf Al-Hammadi"],         studentCount: 2, type: "Regular",        status: "Scheduled" },
  { id: "s026", day: "Fri", date: "25 Apr", subject: "Y3 English",   department: "Primary",         teacher: "Ms Sarah Mitchell",  room: "Room 1A", startTime: "14:00", endTime: "15:00", duration: 60, students: ["Ziad Khalil"],                               studentCount: 1, type: "Regular",        status: "Scheduled" },
  { id: "s027", day: "Fri", date: "25 Apr", subject: "Y9 English",   department: "Lower Secondary", teacher: "Mr Ahmed Khalil",    room: "Room 3A", startTime: "16:00", endTime: "17:00", duration: 60, students: ["Sara Nasser", "Hamdan Al-Maktoum"],          studentCount: 2, type: "Cover Required", status: "Scheduled" },
];

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface UnmarkedSession {
  id: string;
  subject: string;
  date: string;
  teacher: string;
  hoursRemaining: number;
  overdue: boolean;
}

export interface AbsenceRecord {
  student: string;
  studentId: string;
  year: string;
  dept: string;
  subject: string;
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
}

export const unmarkedSessions: UnmarkedSession[] = [
  { id: "u001", subject: "Y5 Maths",     date: "Fri 18 Apr", teacher: "Mr Ahmed Khalil",   hoursRemaining: 3,  overdue: false },
  { id: "u002", subject: "Y11 Chemistry", date: "Thu 17 Apr", teacher: "Ms Hana Yusuf",     hoursRemaining: 0,  overdue: true  },
  { id: "u003", subject: "Y3 English",    date: "Thu 17 Apr", teacher: "Ms Sarah Mitchell", hoursRemaining: 0,  overdue: true  },
  { id: "u004", subject: "Y9 Science",    date: "Mon 21 Apr", teacher: "Mr Tariq Al-Amin",  hoursRemaining: 47, overdue: false },
];

export const absenceSummary: AbsenceRecord[] = [
  { student: "Aisha Rahman",      studentId: "IMI-0001", year: "Y8",  dept: "Lower Sec", subject: "Y8 Maths",    totalAbsences: 2, consecutive: 1, makeupAllowance: 0, status: "Allowance Exhausted" },
  { student: "Omar Al-Farsi",     studentId: "IMI-0002", year: "Y5",  dept: "Primary",   subject: "Y5 English",  totalAbsences: 2, consecutive: 0, makeupAllowance: 0, status: "Allowance Exhausted" },
  { student: "Ziad Khalil",       studentId: "IMI-0004", year: "Y3",  dept: "Primary",   subject: "Y3 Maths",    totalAbsences: 1, consecutive: 1, makeupAllowance: 0, status: "Allowance Exhausted" },
  { student: "Sara Nasser",       studentId: "IMI-0005", year: "Y9",  dept: "Lower Sec", subject: "Y9 Science",  totalAbsences: 2, consecutive: 2, makeupAllowance: 1, status: "Consecutive Alert"   },
  { student: "Reem Al-Dosari",    studentId: "IMI-0006", year: "Y6",  dept: "Primary",   subject: "Y6 Science",  totalAbsences: 1, consecutive: 0, makeupAllowance: 0, status: "Allowance Exhausted" },
  { student: "Faris Qasim",       studentId: "IMI-0007", year: "Y11", dept: "Senior",    subject: "Y11 Physics", totalAbsences: 1, consecutive: 1, makeupAllowance: 1, status: "Monitor"             },
  { student: "Hamdan Al-Maktoum", studentId: "IMI-0009", year: "Y7",  dept: "Lower Sec", subject: "Y7 Maths",    totalAbsences: 1, consecutive: 0, makeupAllowance: 1, status: "Normal"              },
  { student: "Nour Ibrahim",      studentId: "IMI-0008", year: "Y4",  dept: "Primary",   subject: "Y4 Maths",    totalAbsences: 1, consecutive: 0, makeupAllowance: 0, status: "Allowance Exhausted" },
];

export const makeupLog: AttendanceMakeupEntry[] = [
  { id: "m001", originalSession: "Mon 7 Apr",  subject: "Y8 Maths",   student: "Aisha Rahman",   makeupDate: "Sat 12 Apr", status: "Completed" },
  { id: "m002", originalSession: "Wed 9 Apr",  subject: "Y8 Maths",   student: "Aisha Rahman",   makeupDate: "Sat 26 Apr", status: "Pending"   },
  { id: "m003", originalSession: "Thu 10 Apr", subject: "Y5 English", student: "Omar Al-Farsi",  makeupDate: "Sat 19 Apr", status: "Confirmed" },
  { id: "m004", originalSession: "Tue 8 Apr",  subject: "Y3 Maths",   student: "Ziad Khalil",    makeupDate: "Sat 26 Apr", status: "Pending"   },
  { id: "m005", originalSession: "Mon 14 Apr", subject: "Y6 Science", student: "Reem Al-Dosari", makeupDate: "—",          status: "Expired"   },
  { id: "m006", originalSession: "Wed 2 Apr",  subject: "Y4 Maths",   student: "Nour Ibrahim",   makeupDate: "Sat 12 Apr", status: "Completed" },
];

// ─── Staff ────────────────────────────────────────────────────────────────────

export type StaffStatus = "Active" | "On Leave" | "Suspended" | "Off-boarded";
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

export const staffMembers: StaffMember[] = [
  { id: "ST-001", name: "Jason Daswani",   email: "j.daswani@improvemeinstitute.com",   role: "Super Admin", department: "Admin",           subjects: [],                                            sessionsThisWeek: 0,  cpdHours: 12, cpdTarget: 20, status: "Active",    hireDate: "1 Sep 2021",  contractType: "Full-time", lineManager: "—",               workloadLevel: "Low"      },
  { id: "ST-002", name: "Sarah Thompson",  email: "s.thompson@improvemeinstitute.com",  role: "Admin Head",  department: "Admin",           subjects: [],                                            sessionsThisWeek: 2,  cpdHours: 15, cpdTarget: 20, status: "Active",    hireDate: "15 Jan 2022", contractType: "Full-time", lineManager: "Jason Daswani",   workloadLevel: "Moderate" },
  { id: "ST-003", name: "Ahmed Khalil",    email: "a.khalil@improvemeinstitute.com",    role: "Teacher",     department: "Lower Secondary", subjects: ["Y7 Maths", "Y8 Maths", "Y9 Maths"],         sessionsThisWeek: 14, cpdHours: 8,  cpdTarget: 20, status: "Active",    hireDate: "12 Sep 2022", contractType: "Full-time", lineManager: "Sarah Thompson",  workloadLevel: "High"     },
  { id: "ST-004", name: "Sarah Mitchell",  email: "s.mitchell@improvemeinstitute.com",  role: "Teacher",     department: "Primary",         subjects: ["Y3 English", "Y4 English", "Y5 Maths"],      sessionsThisWeek: 12, cpdHours: 18, cpdTarget: 20, status: "Active",    hireDate: "3 Mar 2023",  contractType: "Full-time", lineManager: "Sarah Thompson",  workloadLevel: "Moderate" },
  { id: "ST-005", name: "Tariq Al-Amin",   email: "t.alamin@improvemeinstitute.com",    role: "Teacher",     department: "Lower Secondary", subjects: ["Y7 Science", "Y8 Science", "Y9 Science"],    sessionsThisWeek: 11, cpdHours: 6,  cpdTarget: 20, status: "Active",    hireDate: "5 Sep 2023",  contractType: "Full-time", lineManager: "Sarah Thompson",  workloadLevel: "Moderate" },
  { id: "ST-006", name: "Hana Yusuf",      email: "h.yusuf@improvemeinstitute.com",     role: "Teacher",     department: "Senior",          subjects: ["Y10 Biology", "Y11 Biology", "Y11 Chemistry"],sessionsThisWeek: 10, cpdHours: 20, cpdTarget: 20, status: "Active",    hireDate: "1 Sep 2022",  contractType: "Full-time", lineManager: "Sarah Thompson",  workloadLevel: "Moderate" },
  { id: "ST-007", name: "Faris Al-Amin",   email: "f.alamin@improvemeinstitute.com",    role: "Teacher",     department: "Senior",          subjects: ["Y10 Maths", "Y11 Physics", "Y12 Maths", "Y12 Physics", "Y13 Maths"], sessionsThisWeek: 16, cpdHours: 11, cpdTarget: 20, status: "Active", hireDate: "20 Aug 2021", contractType: "Full-time", lineManager: "Sarah Thompson", workloadLevel: "High" },
  { id: "ST-008", name: "Mariam Saleh",    email: "m.saleh@improvemeinstitute.com",     role: "TA",          department: "Primary",         subjects: ["Y4 Maths", "Y5 English"],                    sessionsThisWeek: 8,  cpdHours: 4,  cpdTarget: 20, status: "Suspended", hireDate: "10 Nov 2023", contractType: "Part-time", lineManager: "Sarah Thompson",  workloadLevel: "Low"      },
  { id: "ST-009", name: "Nadia Al-Hassan", email: "n.alhassan@improvemeinstitute.com",  role: "HOD",         department: "Primary",         subjects: ["Y6 English", "Y6 Maths"],                    sessionsThisWeek: 6,  cpdHours: 16, cpdTarget: 20, status: "Active",    hireDate: "1 Sep 2020",  contractType: "Full-time", lineManager: "Jason Daswani",   workloadLevel: "Moderate" },
  { id: "ST-010", name: "Omar Farhat",     email: "o.farhat@improvemeinstitute.com",    role: "Admin",       department: "Admin",           subjects: [],                                            sessionsThisWeek: 0,  cpdHours: 5,  cpdTarget: 20, status: "Active",    hireDate: "14 Feb 2024", contractType: "Full-time", lineManager: "Sarah Thompson",  workloadLevel: "Low"      },
  { id: "ST-011", name: "Rania Aziz",      email: "r.aziz@improvemeinstitute.com",      role: "HR-Finance",  department: "Admin",           subjects: [],                                            sessionsThisWeek: 0,  cpdHours: 9,  cpdTarget: 20, status: "On Leave",  hireDate: "1 Mar 2023",  contractType: "Full-time", lineManager: "Jason Daswani",   workloadLevel: "Low"      },
  { id: "ST-012", name: "Khalil Mansouri", email: "k.mansouri@improvemeinstitute.com",  role: "Teacher",     department: "Primary",         subjects: ["Y1 English", "Y2 English", "Y2 Maths"],      sessionsThisWeek: 9,  cpdHours: 2,  cpdTarget: 20, status: "Active",    hireDate: "3 Sep 2024",  contractType: "Sessional", lineManager: "Nadia Al-Hassan", workloadLevel: "Moderate" },
];

// ─── Enrolments ──────────────────────────────────────────────────────────────

export type EnrolmentStatus = "Active" | "Pending" | "Expiring" | "Expired";
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
  package: string;
  invoiceStatus: EnrolmentInvoiceStatus;
  enrolmentStatus: EnrolmentStatus;
}

export const enrolments: Enrolment[] = [
  { id: "E-001", studentId: "IMI-0001", student: "Aisha Rahman",       yearGroup: "Y8",  department: "Lower Secondary", subject: "Y8 Maths",     teacher: "Mr Ahmed Khalil",   sessionsTotal: 20, sessionsRemaining: 4,  frequency: "2×/week", package: "Term 3 — 20 sessions", invoiceStatus: "Overdue",  enrolmentStatus: "Expiring" },
  { id: "E-002", studentId: "IMI-0001", student: "Aisha Rahman",       yearGroup: "Y8",  department: "Lower Secondary", subject: "Y8 English",   teacher: "Ms Sarah Mitchell", sessionsTotal: 18, sessionsRemaining: 5,  frequency: "2×/week", package: "Term 3 — 18 sessions", invoiceStatus: "Paid",     enrolmentStatus: "Active"   },
  { id: "E-003", studentId: "IMI-0002", student: "Omar Al-Farsi",      yearGroup: "Y5",  department: "Primary",         subject: "Y5 Maths",     teacher: "Mr Ahmed Khalil",   sessionsTotal: 20, sessionsRemaining: 8,  frequency: "2×/week", package: "Term 3 — 20 sessions", invoiceStatus: "Overdue",  enrolmentStatus: "Active"   },
  { id: "E-004", studentId: "IMI-0003", student: "Layla Hassan",       yearGroup: "Y10", department: "Senior",          subject: "Y10 Physics",  teacher: "Mr Faris Al-Amin",  sessionsTotal: 20, sessionsRemaining: 12, frequency: "2×/week", package: "Term 3 — 20 sessions", invoiceStatus: "Part",     enrolmentStatus: "Active"   },
  { id: "E-005", studentId: "IMI-0003", student: "Layla Hassan",       yearGroup: "Y10", department: "Senior",          subject: "Y10 Maths",    teacher: "Mr Faris Al-Amin",  sessionsTotal: 20, sessionsRemaining: 12, frequency: "2×/week", package: "Term 3 — 20 sessions", invoiceStatus: "Part",     enrolmentStatus: "Active"   },
  { id: "E-006", studentId: "IMI-0004", student: "Ziad Khalil",        yearGroup: "Y3",  department: "Primary",         subject: "Y3 English",   teacher: "Ms Sarah Mitchell", sessionsTotal: 20, sessionsRemaining: 14, frequency: "2×/week", package: "Term 3 — 20 sessions", invoiceStatus: "Paid",     enrolmentStatus: "Active"   },
  { id: "E-007", studentId: "IMI-0005", student: "Sara Nasser",        yearGroup: "Y9",  department: "Lower Secondary", subject: "Y9 Maths",     teacher: "Mr Tariq Al-Amin",  sessionsTotal: 20, sessionsRemaining: 10, frequency: "2×/week", package: "Term 3 — 20 sessions", invoiceStatus: "Overdue",  enrolmentStatus: "Active"   },
  { id: "E-008", studentId: "IMI-0007", student: "Faris Qasim",        yearGroup: "Y11", department: "Senior",          subject: "Y11 Physics",  teacher: "Mr Faris Al-Amin",  sessionsTotal: 20, sessionsRemaining: 11, frequency: "2×/week", package: "Term 3 — 20 sessions", invoiceStatus: "Paid",     enrolmentStatus: "Active"   },
  { id: "E-009", studentId: "IMI-0009", student: "Hamdan Al-Maktoum",  yearGroup: "Y7",  department: "Lower Secondary", subject: "Y7 Maths",     teacher: "Mr Tariq Al-Amin",  sessionsTotal: 18, sessionsRemaining: 2,  frequency: "2×/week", package: "Term 3 — 18 sessions", invoiceStatus: "Paid",     enrolmentStatus: "Expiring" },
  { id: "E-010", studentId: "IMI-0010", student: "Fatima Al-Shehhi",   yearGroup: "Y4",  department: "Primary",         subject: "Y4 English",   teacher: "Ms Sarah Mitchell", sessionsTotal: 20, sessionsRemaining: 15, frequency: "1×/week", package: "Term 3 — 20 sessions", invoiceStatus: "Paid",     enrolmentStatus: "Active"   },
  { id: "E-011", studentId: "IMI-0011", student: "Khalid Mansoor",     yearGroup: "Y12", department: "Senior",          subject: "Y12 Maths",    teacher: "Mr Faris Al-Amin",  sessionsTotal: 24, sessionsRemaining: 14, frequency: "3×/week", package: "Term 3 — 24 sessions", invoiceStatus: "Paid",     enrolmentStatus: "Active"   },
  { id: "E-012", studentId: "IMI-0012", student: "Dana Al-Zaabi",      yearGroup: "Y2",  department: "Primary",         subject: "Y2 English",   teacher: "Ms Sarah Mitchell", sessionsTotal: 20, sessionsRemaining: 16, frequency: "2×/week", package: "Term 3 — 20 sessions", invoiceStatus: "Paid",     enrolmentStatus: "Active"   },
  { id: "E-013", studentId: "IMI-0013", student: "Yousef Salim",       yearGroup: "Y9",  department: "Lower Secondary", subject: "Y9 Science",   teacher: "Mr Tariq Al-Amin",  sessionsTotal: 20, sessionsRemaining: 9,  frequency: "2×/week", package: "Term 3 — 20 sessions", invoiceStatus: "Part",     enrolmentStatus: "Active"   },
  { id: "E-014", studentId: "IMI-0015", student: "Adam Benali",        yearGroup: "Y6",  department: "Primary",         subject: "Y6 Maths",     teacher: "Ms Hana Yusuf",     sessionsTotal: 20, sessionsRemaining: 0,  frequency: "2×/week", package: "Term 3 — 20 sessions", invoiceStatus: "Paid",     enrolmentStatus: "Expired"  },
  { id: "E-015", studentId: "IMI-0020", student: "Raya Khouri",        yearGroup: "Y3",  department: "Primary",         subject: "Y3 Maths",     teacher: "Ms Sarah Mitchell", sessionsTotal: 20, sessionsRemaining: 12, frequency: "1×/week", package: "Term 3 — 20 sessions", invoiceStatus: "Pending",  enrolmentStatus: "Pending"  },
];

// ─── Trials ───────────────────────────────────────────────────────────────────

export type TrialOutcome = "Pending" | "Recommended ✅" | "Parent to decide" | "Not recommended";

export interface Trial {
  id: string;
  student: string;
  yearGroup: string;
  subject: string;
  teacher: string;
  trialDate: string;
  invoiceStatus: "Paid" | "Pending";
  outcome: TrialOutcome;
}

export const trials: Trial[] = [
  { id: "T-001", student: "Bilal Mahmood",    yearGroup: "Y7", subject: "Y7 Maths",    teacher: "Mr Ahmed Khalil",   trialDate: "Sat 19 Apr", invoiceStatus: "Paid",    outcome: "Pending"           },
  { id: "T-002", student: "Hessa Al-Blooshi", yearGroup: "Y4", subject: "Y4 English",  teacher: "Ms Sarah Mitchell", trialDate: "Fri 18 Apr", invoiceStatus: "Paid",    outcome: "Recommended ✅"    },
  { id: "T-003", student: "Ahmed Saleh",      yearGroup: "Y10",subject: "Y10 Physics", teacher: "Mr Faris Al-Amin",  trialDate: "Thu 17 Apr", invoiceStatus: "Paid",    outcome: "Recommended ✅"    },
  { id: "T-004", student: "Rana Farouk",      yearGroup: "Y2", subject: "Y2 English",  teacher: "Ms Sarah Mitchell", trialDate: "Wed 16 Apr", invoiceStatus: "Paid",    outcome: "Parent to decide"  },
  { id: "T-005", student: "Nadia Al-Ghaith",  yearGroup: "Y5", subject: "Y5 Maths",    teacher: "Mr Ahmed Khalil",   trialDate: "Sat 26 Apr", invoiceStatus: "Pending", outcome: "Pending"           },
];

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export interface Withdrawal {
  student: string;
  yearGroup: string;
  department: string;
  subjects: string[];
  withdrawalDate: string;
  reason: string;
  invoiceStatus: "Paid" | "Overdue" | "Part" | "Pending";
}

export const withdrawals: Withdrawal[] = [
  { student: "Hind Al-Rashidi", yearGroup: "Y8",  department: "Lower Secondary", subjects: ["Y8 Maths"],             withdrawalDate: "10 Apr 2025", reason: "Cost",               invoiceStatus: "Paid"    },
  { student: "Tariq Osman",     yearGroup: "Y5",  department: "Primary",         subjects: ["Y5 English", "Y5 Maths"],withdrawalDate: "5 Apr 2025",  reason: "Relocation",         invoiceStatus: "Paid"    },
  { student: "Ali Hassan",      yearGroup: "Y9",  department: "Lower Secondary", subjects: ["Y9 Science"],            withdrawalDate: "1 Apr 2025",  reason: "Academic concerns",  invoiceStatus: "Overdue" },
  { student: "Maya Al-Rashid",  yearGroup: "Y6",  department: "Primary",         subjects: ["Y6 Maths"],             withdrawalDate: "Pending",     reason: "—",                  invoiceStatus: "Part"    },
  { student: "Jad Khoury",      yearGroup: "Y11", department: "Senior",          subjects: ["Y11 Chemistry"],         withdrawalDate: "Pending",     reason: "—",                  invoiceStatus: "Pending" },
];

// ─── Reports Inbox ────────────────────────────────────────────────────────────

export interface ReportItem {
  id: string;
  icon: string;
  title: string;
  date: string;
  read: boolean;
}

export const reportsInbox: ReportItem[] = [
  {
    id: "1",
    icon: "BarChart2",
    title: "Weekly Digest",
    date: "Today, 08:00",
    read: false,
  },
  {
    id: "2",
    icon: "ClipboardList",
    title: "Churn Risk Report",
    date: "Yesterday",
    read: false,
  },
  {
    id: "3",
    icon: "Banknote",
    title: "Term Revenue Summary",
    date: "2 days ago",
    read: true,
  },
  {
    id: "4",
    icon: "GraduationCap",
    title: "Academic Alerts Summary",
    date: "3 days ago",
    read: true,
  },
  {
    id: "5",
    icon: "Users",
    title: "Staff Attendance Report",
    date: "5 days ago",
    read: true,
  },
];

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

export const assessments: Assessment[] = [
  { id: "A-001", name: "Bilal Mahmood",      type: "Lead",    yearGroup: "Y7",  subjects: ["Maths"],                  assessor: "Mr Ahmed Khalil",   date: "Sat 19 Apr", time: "10:15", room: "Room 2B", status: "Booked",          outcome: null },
  { id: "A-002", name: "Hessa Al-Blooshi",   type: "Lead",    yearGroup: "Y4",  subjects: ["English", "Maths"],       assessor: "Ms Sarah Mitchell", date: "Sat 19 Apr", time: "10:30", room: "Room 1A", status: "Booked",          outcome: null },
  { id: "A-003", name: "Ahmed Saleh",         type: "Lead",    yearGroup: "Y10", subjects: ["Physics", "Maths"],       assessor: "Mr Faris Al-Amin",  date: "Sat 19 Apr", time: "11:15", room: "Room 2A", status: "Booked",          outcome: null },
  { id: "A-004", name: "Rana Farouk",         type: "Lead",    yearGroup: "Y2",  subjects: ["English"],                assessor: "Ms Sarah Mitchell", date: "Sat 26 Apr", time: "10:30", room: "Room 1A", status: "Booked",          outcome: null },
  { id: "A-005", name: "Nour Ibrahim",        type: "Student", yearGroup: "Y4",  subjects: ["Maths"],                  assessor: "Mr Ahmed Khalil",   date: "Wed 23 Apr", time: "10:15", room: "Room 2B", status: "Booked",          outcome: null },
  { id: "A-006", name: "Saif Al-Nuaimi",      type: "Lead",    yearGroup: "Y9",  subjects: ["Science"],                assessor: null,                date: null,         time: null,    room: null,      status: "Link Sent",       outcome: null },
  { id: "A-007", name: "Lama Qasim",          type: "Lead",    yearGroup: "Y6",  subjects: ["Maths", "Science"],       assessor: null,                date: null,         time: null,    room: null,      status: "Link Sent",       outcome: null },
  { id: "A-008", name: "Yousuf Al-Hammadi",  type: "Lead",    yearGroup: "Y11", subjects: ["Chemistry", "Biology"],   assessor: null,                date: null,         time: null,    room: null,      status: "Awaiting Booking", outcome: null },
  { id: "A-009", name: "Fatma Al-Marri",      type: "Lead",    yearGroup: "Y3",  subjects: ["English"],                assessor: null,                date: null,         time: null,    room: null,      status: "Awaiting Booking", outcome: null },
  { id: "A-010", name: "Khalifa Rashid",      type: "Lead",    yearGroup: "Y8",  subjects: ["Maths"],                  assessor: null,                date: null,         time: null,    room: null,      status: "Awaiting Booking", outcome: null },
];

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskType = "Admin" | "Academic" | "Finance" | "HR" | "Student Follow-up" | "Cover" | "Personal";
export type TaskPriority = "High" | "Medium" | "Low";
export type TaskStatus = "Open" | "In Progress" | "Blocked" | "Done";

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  linkedRecord: { type: string; name: string; id: string } | null;
  description: string;
  subtasks: string[];
  overdue: boolean;
}

export const tasks: Task[] = [
  { id: "TK-001", title: "Follow up on overdue invoice INV-1042", type: "Finance", priority: "High", status: "Open", assignee: "Jason Daswani", dueDate: "14 Apr 2025", linkedRecord: { type: "student", name: "Aisha Rahman", id: "IMI-0001" }, description: "Contact Fatima Rahman regarding overdue invoice INV-1042 (AED 3,360). Invoice is 6 days past due.", subtasks: ["Call guardian", "Log contact attempt", "Update invoice notes"], overdue: true },
  { id: "TK-002", title: "Book parent meeting re: attendance — Aisha Rahman", type: "Student Follow-up", priority: "High", status: "Open", assignee: "Jason Daswani", dueDate: "15 Apr 2025", linkedRecord: { type: "student", name: "Aisha Rahman", id: "IMI-0001" }, description: "Attendance rate dropped to 82% in Y8 Maths. L1 concern active. Book a meeting with guardian.", subtasks: ["Check guardian availability", "Confirm room", "Send calendar invite"], overdue: true },
  { id: "TK-003", title: "Assign cover teacher — Rania Aziz sessions", type: "Cover", priority: "High", status: "In Progress", assignee: "Sarah Thompson", dueDate: "15 Apr 2025", linkedRecord: null, description: "Rania Aziz is on emergency leave. 12 sessions require cover assignment before Monday.", subtasks: ["List all affected sessions", "Contact available teachers", "Update timetable"], overdue: true },
  { id: "TK-004", title: "Review Y8 Maths progress report draft", type: "Academic", priority: "Medium", status: "Open", assignee: "Jason Daswani", dueDate: "16 Apr 2025", linkedRecord: { type: "student", name: "Aisha Rahman", id: "IMI-0001" }, description: "AI-generated draft ready for Y8 Maths. Review and approve or edit before HOD sign-off.", subtasks: ["Read AI narrative", "Check scores accuracy", "Submit for HOD approval"], overdue: false },
  { id: "TK-005", title: "Complete Khalil Mansouri onboarding profile", type: "HR", priority: "Medium", status: "In Progress", assignee: "Jason Daswani", dueDate: "16 Apr 2025", linkedRecord: null, description: "Home address and emergency contact still missing. Day 25 of onboarding.", subtasks: ["Send reminder to Khalil", "Verify submitted details"], overdue: false },
  { id: "TK-006", title: "Invoice reconciliation — Term 3 batch", type: "Finance", priority: "Medium", status: "Open", assignee: "Jason Daswani", dueDate: "18 Apr 2025", linkedRecord: null, description: "Reconcile all Term 3 invoices against payment records. Export CSV for Zoho.", subtasks: ["Export invoice CSV", "Cross-check against payments", "Flag discrepancies"], overdue: false },
  { id: "TK-007", title: "Book makeup slot — Aisha Rahman Y8 Maths", type: "Student Follow-up", priority: "Medium", status: "Open", assignee: "Jason Daswani", dueDate: "20 Apr 2025", linkedRecord: { type: "student", name: "Aisha Rahman", id: "IMI-0001" }, description: "Makeup pending for session missed on Wed 9 Apr. Expiring Sat 26 Apr.", subtasks: ["Check Sat 26 Apr availability", "Confirm with guardian"], overdue: false },
  { id: "TK-008", title: "Send Term 3 re-enrolment reminders — Primary", type: "Admin", priority: "Low", status: "Open", assignee: "Sarah Thompson", dueDate: "21 Apr 2025", linkedRecord: null, description: "Generate copy-paste re-enrolment messages for all Primary students whose Term 3 packages are expiring.", subtasks: ["Generate student list", "Prepare message batch", "Mark as sent"], overdue: false },
  { id: "TK-009", title: "CPD entry queried — Ahmed Khalil", type: "HR", priority: "Low", status: "Open", assignee: "Ahmed Khalil", dueDate: "22 Apr 2025", linkedRecord: null, description: "Classroom Management Webinar CPD entry queried. Please clarify hours and provider.", subtasks: ["Review query", "Provide clarification"], overdue: false },
  { id: "TK-010", title: "Update Sara Nasser concern record", type: "Academic", priority: "High", status: "Open", assignee: "Jason Daswani", dueDate: "17 Apr 2025", linkedRecord: { type: "student", name: "Sara Nasser", id: "IMI-0005" }, description: "L1 concern active for Y9 Maths. Log contact attempt with guardian.", subtasks: ["Review concern record", "Log contact note"], overdue: false },
  { id: "TK-011", title: "Mark attendance — Y11 Chemistry Thu 17 Apr", type: "Admin", priority: "High", status: "Blocked", assignee: "Sarah Mitchell", dueDate: "17 Apr 2025", linkedRecord: null, description: "Overdue attendance marking — 48hr window expires today. Unlock and mark immediately.", subtasks: ["Unlock session", "Mark attendance", "Log reason for delay"], overdue: false },
  { id: "TK-012", title: "Generate bulk invoices — Lower Secondary Term 3 late", type: "Finance", priority: "Medium", status: "Open", assignee: "Jason Daswani", dueDate: "19 Apr 2025", linkedRecord: null, description: "6 Lower Secondary students have not yet received Term 3 invoices.", subtasks: ["Identify outstanding students", "Generate batch", "Issue invoices"], overdue: false },
  { id: "TK-013", title: "Prepare staff performance review — Ahmed Khalil", type: "HR", priority: "Low", status: "Open", assignee: "Jason Daswani", dueDate: "25 Apr 2025", linkedRecord: null, description: "Annual review due. Gather session delivery stats, CPD log, and feedback scores.", subtasks: ["Pull session stats", "Print CPD log", "Complete review form"], overdue: false },
  { id: "TK-014", title: "Follow up on lead L-0049 — Khalifa Rashid (DNC)", type: "Admin", priority: "Low", status: "Open", assignee: "Sarah Thompson", dueDate: "28 Apr 2025", linkedRecord: null, description: "DNC lead — verify DNC reason is logged. Confirm no further outreach is planned.", subtasks: ["Check DNC reason", "Archive lead if confirmed"], overdue: false },
  { id: "TK-015", title: "Convert trial — Hessa Al-Blooshi", type: "Student Follow-up", priority: "High", status: "Open", assignee: "Jason Daswani", dueDate: "22 Apr 2025", linkedRecord: null, description: "Trial outcome: Recommended. Convert to full enrolment. Book Y4 English schedule.", subtasks: ["Confirm schedule with guardian", "Create enrolment", "Issue invoice"], overdue: false },
  { id: "TK-016", title: "Weekly digest review", type: "Admin", priority: "Low", status: "Done", assignee: "Jason Daswani", dueDate: "14 Apr 2025", linkedRecord: null, description: "Review weekly activity digest and flag items for follow-up.", subtasks: ["Read digest", "Flag outstanding items"], overdue: false },
  { id: "TK-017", title: "Invoice reconciliation — Mar 2025", type: "Finance", priority: "Medium", status: "Done", assignee: "Jason Daswani", dueDate: "10 Apr 2025", linkedRecord: null, description: "Completed — all March invoices reconciled.", subtasks: ["Export CSV", "Cross-check", "File report"], overdue: false },
  { id: "TK-018", title: "Assign Y9 Science group to Tariq Al-Amin", type: "Academic", priority: "Medium", status: "Done", assignee: "Sarah Thompson", dueDate: "8 Apr 2025", linkedRecord: null, description: "New group assignment complete.", subtasks: ["Update timetable", "Notify teacher"], overdue: false },
  { id: "TK-019", title: "Send Term 2 parent satisfaction survey", type: "Admin", priority: "Low", status: "Done", assignee: "Sarah Thompson", dueDate: "5 Apr 2025", linkedRecord: null, description: "NPS survey dispatched to all active guardians.", subtasks: ["Prepare survey link", "Send batch", "Mark as sent"], overdue: false },
  { id: "TK-020", title: "Archive inactive leads — Q1 batch", type: "Admin", priority: "Low", status: "Done", assignee: "Jason Daswani", dueDate: "1 Apr 2025", linkedRecord: null, description: "Archived 14 leads inactive for 90+ days.", subtasks: ["Generate list", "Archive with reason"], overdue: false },
];
