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

// ─── Guardians ────────────────────────────────────────────────────────────────

export interface GuardianStudent {
  id: string;
  name: string;
  initials: string;
}

export interface Guardian {
  id: string;
  name: string;
  email: string;
  phone: string;
  students: GuardianStudent[];
}

export const guardians: Guardian[] = [
  { id: "G-001", name: "Fatima Rahman",      email: "fatima.rahman@gmail.com",      phone: "+971 50 123 4567", students: [{ id: "IMI-0001", name: "Aisha Rahman",     initials: "AR" }] },
  { id: "G-002", name: "Khalid Al-Farsi",    email: "khalid.alfarsi@gmail.com",     phone: "+971 55 234 5678", students: [{ id: "IMI-0002", name: "Omar Al-Farsi",    initials: "OA" }] },
  { id: "G-003", name: "Nadia Hassan",       email: "nadia.hassan@gmail.com",       phone: "+971 52 345 6789", students: [{ id: "IMI-0003", name: "Layla Hassan",     initials: "LH" }] },
  { id: "G-004", name: "Rami Khalil",        email: "rami.khalil@gmail.com",        phone: "+971 50 456 7890", students: [{ id: "IMI-0004", name: "Ziad Khalil",      initials: "ZK" }] },
  { id: "G-005", name: "Hessa Nasser",       email: "hessa.nasser@gmail.com",       phone: "+971 55 567 8901", students: [{ id: "IMI-0005", name: "Sara Nasser",      initials: "SN" }] },
  { id: "G-006", name: "Maryam Al-Dosari",   email: "maryam.aldosari@gmail.com",    phone: "+971 52 678 9012", students: [{ id: "IMI-0006", name: "Reem Al-Dosari",   initials: "RA" }] },
  { id: "G-007", name: "Tariq Qasim",        email: "tariq.qasim@gmail.com",        phone: "+971 50 789 0123", students: [{ id: "IMI-0007", name: "Faris Qasim",      initials: "FQ" }] },
  { id: "G-008", name: "Leila Ibrahim",      email: "leila.ibrahim@gmail.com",      phone: "+971 55 890 1234", students: [{ id: "IMI-0008", name: "Nour Ibrahim",     initials: "NI" }] },
  { id: "G-009", name: "Shaikha Al-Maktoum", email: "shaikha.almaktoum@gmail.com",  phone: "+971 52 901 2345", students: [{ id: "IMI-0009", name: "Hamdan Al-Maktoum", initials: "HA" }] },
  { id: "G-010", name: "Saeed Al-Zaabi",     email: "saeed.alzaabi@gmail.com",      phone: "+971 50 012 3456", students: [{ id: "IMI-0012", name: "Dana Al-Zaabi",    initials: "DZ" }, { id: "IMI-0004", name: "Ziad Khalil", initials: "ZK" }] },
  { id: "G-011", name: "Amal Mansoor",       email: "amal.mansoor@gmail.com",       phone: "+971 55 111 2233", students: [{ id: "IMI-0011", name: "Khalid Mansoor",   initials: "KM" }] },
  { id: "G-012", name: "Elias Khouri",       email: "elias.khouri@gmail.com",       phone: "+971 55 100 2020", students: [{ id: "IMI-0020", name: "Raya Khouri",      initials: "RK" }, { id: "IMI-0015", name: "Adam Benali", initials: "AB" }] },
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

// ─── Feedback ─────────────────────────────────────────────────────────────────

export type FeedbackStatus = "Draft" | "Pending Approval" | "Approved" | "Sent";

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
  aiSummary: string | null;
  selectors: FeedbackSelector[];
  teacherNotes: string;
}

export const feedbackItems: FeedbackItem[] = [
  { id: "FB-001", studentName: "Aisha Rahman", subject: "Y8 Maths", teacher: "Mr Ahmed Khalil", department: "Lower Secondary", sessionDate: "16 Apr 2025", status: "Pending Approval", aiSummary: "Aisha demonstrated strong understanding of algebraic expressions and showed excellent focus throughout the session.", selectors: [{ label: "Engagement", value: "Good" }, { label: "Homework", value: "Complete" }, { label: "Participation", value: "Active" }], teacherNotes: "Aisha completed all practice problems correctly. She needs to work on simplifying complex fractions but overall the session went very well." },
  { id: "FB-002", studentName: "Omar Al-Farsi", subject: "Y5 Maths", teacher: "Mr Ahmed Khalil", department: "Primary", sessionDate: "15 Apr 2025", status: "Pending Approval", aiSummary: "Omar worked through multiplication tables with growing confidence. His mental arithmetic is improving steadily each session.", selectors: [{ label: "Engagement", value: "Good" }, { label: "Homework", value: "Incomplete" }, { label: "Participation", value: "Moderate" }], teacherNotes: "Omar did not complete the homework set last session. We spent time reviewing missed work. Needs encouragement to complete independent tasks." },
  { id: "FB-003", studentName: "Layla Hassan", subject: "Y10 Physics", teacher: "Mr Faris Al-Amin", department: "Senior", sessionDate: "15 Apr 2025", status: "Approved", aiSummary: "Layla tackled Newton's laws with confidence and demonstrated strong analytical thinking. Ready to move on to energy concepts next session.", selectors: [{ label: "Engagement", value: "Excellent" }, { label: "Homework", value: "Complete" }, { label: "Participation", value: "Active" }], teacherNotes: "Outstanding session. Layla is working well above year group expectations in Physics. Recommend extending to additional problem sets." },
  { id: "FB-004", studentName: "Ziad Khalil", subject: "Y3 English", teacher: "Ms Sarah Mitchell", department: "Primary", sessionDate: "14 Apr 2025", status: "Sent", aiSummary: "Ziad practised reading comprehension and showed improvement in identifying key themes. His vocabulary is growing nicely.", selectors: [{ label: "Engagement", value: "Good" }, { label: "Homework", value: "Complete" }, { label: "Participation", value: "Active" }], teacherNotes: "Great session overall. Ziad is enjoying the new reading book and his fluency has noticeably improved since last term." },
  { id: "FB-005", studentName: "Sara Nasser", subject: "Y9 Maths", teacher: "Mr Tariq Al-Amin", department: "Lower Secondary", sessionDate: "14 Apr 2025", status: "Pending Approval", aiSummary: "Sara showed improvement in quadratic equations but requires further reinforcement of factoring techniques before the upcoming exam.", selectors: [{ label: "Engagement", value: "Moderate" }, { label: "Homework", value: "Partial" }, { label: "Participation", value: "Moderate" }], teacherNotes: "Sara seemed distracted. She partially completed homework — missing last 4 questions. Will focus more on exam technique next time." },
  { id: "FB-006", studentName: "Reem Al-Dosari", subject: "Y6 Maths", teacher: "Ms Hana Yusuf", department: "Primary", sessionDate: "13 Apr 2025", status: "Draft", aiSummary: null, selectors: [{ label: "Engagement", value: "Good" }, { label: "Homework", value: "Complete" }, { label: "Participation", value: "Active" }], teacherNotes: "Reem worked on fractions and decimals. Solid grasp of basics but struggles with mixed number operations. Will revisit next session." },
  { id: "FB-007", studentName: "Faris Qasim", subject: "Y11 Physics", teacher: "Mr Faris Al-Amin", department: "Senior", sessionDate: "12 Apr 2025", status: "Sent", aiSummary: "Faris is well-prepared for his upcoming mock exam. He demonstrated a thorough understanding of electricity and magnetism concepts.", selectors: [{ label: "Engagement", value: "Excellent" }, { label: "Homework", value: "Complete" }, { label: "Participation", value: "Active" }], teacherNotes: "Faris is one of the strongest students in his year. Ready for A-level extension material." },
  { id: "FB-008", studentName: "Nour Ibrahim", subject: "Y4 Maths", teacher: "Mr Ahmed Khalil", department: "Primary", sessionDate: "12 Apr 2025", status: "Approved", aiSummary: "Nour is building confidence in division and showed great persistence when tackling multi-step word problems today.", selectors: [{ label: "Engagement", value: "Good" }, { label: "Homework", value: "Complete" }, { label: "Participation", value: "Active" }], teacherNotes: "Very positive session. Nour needed some encouragement at the start but finished confidently. Homework was completed neatly." },
  { id: "FB-009", studentName: "Hamdan Al-Maktoum", subject: "Y7 Maths", teacher: "Mr Tariq Al-Amin", department: "Lower Secondary", sessionDate: "11 Apr 2025", status: "Sent", aiSummary: "Hamdan is progressing well through the Year 7 curriculum. His problem-solving approach has become more structured and methodical.", selectors: [{ label: "Engagement", value: "Good" }, { label: "Homework", value: "Partial" }, { label: "Participation", value: "Moderate" }], teacherNotes: "Making good progress. Needs to complete homework more consistently — only completed 3 of 5 exercises this week." },
  { id: "FB-010", studentName: "Khalid Mansoor", subject: "Y12 Maths", teacher: "Mr Faris Al-Amin", department: "Senior", sessionDate: "11 Apr 2025", status: "Draft", aiSummary: null, selectors: [{ label: "Engagement", value: "Excellent" }, { label: "Homework", value: "Complete" }, { label: "Participation", value: "Active" }], teacherNotes: "Khalid tackled integration by parts flawlessly. Ready to move into differential equations. Grade A prediction remains strong." },
  { id: "FB-011", studentName: "Dana Al-Zaabi", subject: "Y2 English", teacher: "Ms Sarah Mitchell", department: "Primary", sessionDate: "10 Apr 2025", status: "Approved", aiSummary: "Dana is thriving in her English sessions. Her reading speed has improved significantly and she loves the creative writing exercises.", selectors: [{ label: "Engagement", value: "Excellent" }, { label: "Homework", value: "Complete" }, { label: "Participation", value: "Active" }], teacherNotes: "Dana wrote a wonderful short story this week. Her imagination is brilliant. Very positive session all round." },
  { id: "FB-012", studentName: "Yousef Salim", subject: "Y9 Science", teacher: "Mr Tariq Al-Amin", department: "Lower Secondary", sessionDate: "10 Apr 2025", status: "Draft", aiSummary: null, selectors: [{ label: "Engagement", value: "Moderate" }, { label: "Homework", value: "Incomplete" }, { label: "Participation", value: "Low" }], teacherNotes: "Yousef seemed disengaged today. No homework completed. Will discuss with admin whether a guardian call is needed." },
];

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

export const announcements: Announcement[] = [
  { id: "ANN-001", title: "Mock Exam Preparation — Y11 Physics", type: "Pre-session", audience: "Y11 Physics — Group A", createdBy: "Mr Faris Al-Amin", sendDate: "17 Apr 2025", status: "Pending Approval", message: "Please remind Faris to bring his formula booklet and scientific calculator to tomorrow's session. We will be covering full mock paper practice." },
  { id: "ANN-002", title: "Term 3 Wrap-up — Y8 Maths", type: "Post-session", audience: "Y8 Maths — Group B", createdBy: "Mr Ahmed Khalil", sendDate: "16 Apr 2025", status: "Sent", message: "Aisha had an excellent session today. She has mastered algebraic manipulation ahead of the end-of-term assessment. Keep up the great work!" },
  { id: "ANN-003", title: "Holiday Schedule — Term 3 Remaining Sessions", type: "Pre-session", audience: "All Primary", createdBy: "Sarah Thompson", sendDate: "15 Apr 2025", status: "Sent", message: "A reminder that sessions will continue as normal through the Eid period. Please confirm attendance by replying to this message." },
  { id: "ANN-004", title: "IGCSE Countdown — Y10 Physics", type: "Pre-session", audience: "Y10 Physics — Group A", createdBy: "Mr Faris Al-Amin", sendDate: "14 Apr 2025", status: "Draft", message: "With 6 weeks until the IGCSE Physics paper, Layla's sessions will shift to full past-paper practice. Please ensure she reviews notes before each session." },
  { id: "ANN-005", title: "Reading Challenge Update — Y3 English", type: "Post-session", audience: "Y3 English — Group A", createdBy: "Ms Sarah Mitchell", sendDate: "13 Apr 2025", status: "Sent", message: "Ziad completed the second chapter of his reading challenge book this week. His fluency is excellent. Well done!" },
  { id: "ANN-006", title: "New Resource Pack — Y9 Maths", type: "Pre-session", audience: "Y9 Maths — Group A", createdBy: "Mr Tariq Al-Amin", sendDate: "18 Apr 2025", status: "Pending Approval", message: "We have prepared a new exam technique pack for Sara. Please print and bring this to the next session, or we can access it digitally." },
  { id: "ANN-007", title: "End of Term Achievement Summary", type: "Post-session", audience: "All Senior", createdBy: "Jason Daswani", sendDate: "20 Apr 2025", status: "Draft", message: "This term has been outstanding for our Senior students. Full achievement summaries will be sent in the next few days." },
  { id: "ANN-008", title: "Welcome Back — Y7 Maths", type: "Pre-session", audience: "Y7 Maths — Group B", createdBy: "Mr Tariq Al-Amin", sendDate: "8 Apr 2025", status: "Sent", message: "Hamdan, welcome back from the break! We will be starting the new algebra unit this week — no prep needed, just bring your notebook." },
];

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

export const complaintTickets: ComplaintTicket[] = [
  { id: "CMP-001", student: "Aisha Rahman", guardianName: "Fatima Rahman", category: "Teaching Quality", raisedBy: "Fatima Rahman (Guardian)", assignedTo: "Sarah Thompson", status: "Investigating", severity: "High", description: "Guardian reports that Aisha has been making little progress in Y8 Maths despite regular attendance. Concerns about teaching pace and the amount of homework being set.", createdDate: "10 Apr 2025", linkedTickets: [{ id: "TK-004", description: "Review Y8 Maths progress report draft", assignee: "Jason Daswani", dueDate: "16 Apr 2025", status: "Open" }, { id: "TK-002", description: "Book parent meeting re: attendance — Aisha Rahman", assignee: "Jason Daswani", dueDate: "15 Apr 2025", status: "In Progress" }], signOffs: [{ name: "Sarah Thompson", role: "Admin Head", timestamp: "11 Apr 2025, 14:30" }, { name: "Jason Daswani", role: "Super Admin", timestamp: null }], escalationLog: [{ event: "Complaint received via email", actor: "Jason Daswani", timestamp: "10 Apr 2025, 09:15" }, { event: "Assigned to investigation — Sarah Thompson", actor: "Jason Daswani", timestamp: "10 Apr 2025, 09:30" }, { event: "Sign-off 1 completed", actor: "Sarah Thompson", timestamp: "11 Apr 2025, 14:30" }] },
  { id: "CMP-002", student: "Sara Nasser", guardianName: "Hessa Nasser", category: "Administrative", raisedBy: "Hessa Nasser (Guardian)", assignedTo: "Jason Daswani", status: "New", severity: "Medium", description: "Guardian reports receiving an incorrect invoice for Term 3. Invoice shows 20 sessions but Sara only attends 18 sessions per term. Requesting urgent correction.", createdDate: "14 Apr 2025", linkedTickets: [{ id: "TK-006", description: "Invoice reconciliation — Term 3 batch", assignee: "Jason Daswani", dueDate: "18 Apr 2025", status: "Open" }], signOffs: [{ name: "Jason Daswani", role: "Super Admin", timestamp: null }, { name: "Rania Aziz", role: "HR-Finance", timestamp: null }], escalationLog: [{ event: "Complaint received via phone", actor: "Sarah Thompson", timestamp: "14 Apr 2025, 10:00" }] },
  { id: "CMP-003", student: "Yousef Salim", guardianName: "Mona Salim", category: "Safety & Wellbeing", raisedBy: "Mona Salim (Guardian)", assignedTo: "Jason Daswani", status: "Escalated", severity: "High", description: "Guardian reports that Yousef mentioned feeling uncomfortable during a session due to an exchange between students in the waiting area. Guardian is requesting a formal investigation.", createdDate: "7 Apr 2025", linkedTickets: [{ id: "TK-010", description: "Update concern record — Yousef Salim", assignee: "Jason Daswani", dueDate: "17 Apr 2025", status: "Open" }], signOffs: [{ name: "Sarah Thompson", role: "Admin Head", timestamp: "8 Apr 2025, 11:00" }, { name: "Jason Daswani", role: "Super Admin", timestamp: null }], escalationLog: [{ event: "Complaint received in person", actor: "Sarah Thompson", timestamp: "7 Apr 2025, 17:00" }, { event: "Assigned to investigation", actor: "Jason Daswani", timestamp: "7 Apr 2025, 17:30" }, { event: "Sign-off 1 completed", actor: "Sarah Thompson", timestamp: "8 Apr 2025, 11:00" }, { event: "Escalated — pending guardian response", actor: "Sarah Thompson", timestamp: "10 Apr 2025, 09:00" }] },
  { id: "CMP-004", student: "Omar Al-Farsi", guardianName: "Khalid Al-Farsi", category: "Facilities", raisedBy: "Khalid Al-Farsi (Guardian)", assignedTo: "Sarah Thompson", status: "Resolved", severity: "Low", description: "Guardian noted that the study room allocated to Omar's sessions is poorly ventilated and uncomfortably warm during afternoon sessions.", createdDate: "2 Apr 2025", linkedTickets: [], signOffs: [{ name: "Sarah Thompson", role: "Admin Head", timestamp: "3 Apr 2025, 10:00" }, { name: "Jason Daswani", role: "Super Admin", timestamp: "4 Apr 2025, 09:30" }], escalationLog: [{ event: "Complaint received via WhatsApp", actor: "Sarah Thompson", timestamp: "2 Apr 2025, 12:00" }, { event: "Room reassignment requested from facilities", actor: "Sarah Thompson", timestamp: "2 Apr 2025, 12:30" }, { event: "Sign-off 1 completed", actor: "Sarah Thompson", timestamp: "3 Apr 2025, 10:00" }, { event: "Room 2A assigned as replacement", actor: "Jason Daswani", timestamp: "4 Apr 2025, 09:00" }, { event: "Sign-off 2 completed — resolved", actor: "Jason Daswani", timestamp: "4 Apr 2025, 09:30" }] },
  { id: "CMP-005", student: "Layla Hassan", guardianName: "Nadia Hassan", category: "Other", raisedBy: "Nadia Hassan (Guardian)", assignedTo: "Sarah Thompson", status: "Closed", severity: "Low", description: "Guardian requested to change the regular session time from 4:00pm to 5:30pm due to school pick-up changes. This has since been resolved and the schedule updated.", createdDate: "25 Mar 2025", linkedTickets: [], signOffs: [{ name: "Sarah Thompson", role: "Admin Head", timestamp: "26 Mar 2025, 09:00" }, { name: "Jason Daswani", role: "Super Admin", timestamp: "26 Mar 2025, 10:00" }], escalationLog: [{ event: "Request received via email", actor: "Sarah Thompson", timestamp: "25 Mar 2025, 16:00" }, { event: "Schedule updated in timetable", actor: "Sarah Thompson", timestamp: "26 Mar 2025, 08:45" }, { event: "Sign-off 1 completed", actor: "Sarah Thompson", timestamp: "26 Mar 2025, 09:00" }, { event: "Sign-off 2 completed — closed", actor: "Jason Daswani", timestamp: "26 Mar 2025, 10:00" }] },
  { id: "CMP-006", student: "Hamdan Al-Maktoum", guardianName: "Shaikha Al-Maktoum", category: "Teaching Quality", raisedBy: "Shaikha Al-Maktoum (Guardian)", assignedTo: "Jason Daswani", status: "New", severity: "Medium", description: "Guardian has raised concerns that Y7 Maths sessions are moving too quickly through topics without adequate consolidation before moving on. Requests a meeting with the teacher.", createdDate: "15 Apr 2025", linkedTickets: [], signOffs: [{ name: "Sarah Thompson", role: "Admin Head", timestamp: null }, { name: "Jason Daswani", role: "Super Admin", timestamp: null }], escalationLog: [{ event: "Complaint received via app message", actor: "Jason Daswani", timestamp: "15 Apr 2025, 08:30" }] },
];

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

export const surveyResponses: SurveyResponse[] = [
  { id: "SRV-001", student: "Aisha Rahman", guardian: "Fatima Rahman", surveyType: "Mid-term", sentDate: "1 Mar 2025", score: 5, category: "Promoter", comment: "Aisha has shown remarkable improvement this term. We are extremely happy with the quality of teaching and the personalised approach." },
  { id: "SRV-002", student: "Layla Hassan", guardian: "Nadia Hassan", surveyType: "Mid-term", sentDate: "1 Mar 2025", score: 4, category: "Passive", comment: "Good progress overall. We would like to see more feedback on specific areas for improvement after each session." },
  { id: "SRV-003", student: "Faris Qasim", guardian: "Tariq Qasim", surveyType: "End of term", sentDate: "20 Jan 2025", score: 5, category: "Promoter", comment: "Outstanding service. Faris has grown enormously in confidence. We have already recommended IMI to two other families." },
  { id: "SRV-004", student: "Yousef Salim", guardian: "Mona Salim", surveyType: "Mid-term", sentDate: "1 Mar 2025", score: 2, category: "Detractor", comment: "We have seen limited progress and Yousef seems disengaged. We are considering our options for next term." },
  { id: "SRV-005", student: "Hessa Al-Blooshi", guardian: "Noura Al-Blooshi", surveyType: "Post-trial", sentDate: "19 Apr 2025", score: 5, category: "Promoter", comment: "The trial session was excellent. The teacher was encouraging and Hessa came home very excited. We will be enrolling." },
  { id: "SRV-006", student: "Omar Al-Farsi", guardian: "Khalid Al-Farsi", surveyType: "End of term", sentDate: "20 Jan 2025", score: 4, category: "Passive", comment: "Omar is progressing well. We are happy with the communication and the flexibility of scheduling." },
  { id: "SRV-007", student: "Hind Al-Rashidi", guardian: "Saif Al-Rashidi", surveyType: "Post-withdrawal", sentDate: "20 Mar 2025", score: 2, category: "Detractor", comment: "We withdrew primarily due to scheduling conflicts, but we also felt the feedback quality could be improved." },
  { id: "SRV-008", student: "Khalid Mansoor", guardian: "Amal Mansoor", surveyType: "End of term", sentDate: "20 Jan 2025", score: 5, category: "Promoter", comment: "Khalid is on track for an A* in A-level Maths. The teaching quality here is second to none. Highly recommended." },
  { id: "SRV-009", student: "Hamdan Al-Maktoum", guardian: "Shaikha Al-Maktoum", surveyType: "Mid-term", sentDate: "1 Mar 2025", score: 3, category: "Passive", comment: "Sessions are going reasonably well but we would appreciate more clarity on the curriculum plan and upcoming topics." },
  { id: "SRV-010", student: "Adam Benali", guardian: "Sofia Benali", surveyType: "Manual", sentDate: "10 Apr 2025", score: 5, category: "Promoter", comment: "Brilliant sessions. Adam loves coming to IMI and his Year 6 results have been brilliant. Thank you so much!" },
];

export const surveyPending: SurveyPendingItem[] = [
  { id: "SP-001", student: "Ziad Khalil", guardian: "Rami Khalil", trigger: "Mid-term", scheduledDate: "18 Apr 2025", status: "Scheduled" },
  { id: "SP-002", student: "Nour Ibrahim", guardian: "Leila Ibrahim", trigger: "Mid-term", scheduledDate: "18 Apr 2025", status: "Scheduled" },
  { id: "SP-003", student: "Dana Al-Zaabi", guardian: "Saeed Al-Zaabi", trigger: "Mid-term", scheduledDate: "17 Apr 2025", status: "Sent" },
  { id: "SP-004", student: "Raya Khouri", guardian: "Elias Khouri", trigger: "Post-trial", scheduledDate: "14 Apr 2025", status: "Expired" },
  { id: "SP-005", student: "Sara Nasser", guardian: "Hessa Nasser", trigger: "Mid-term", scheduledDate: "20 Apr 2025", status: "Scheduled" },
];

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
}

export const peopleAll: PersonRecord[] = [
  { id: "P-001", name: "Aisha Rahman",       type: "Student",  contact: "+971 50 123 4567", status: "Enrolled",     departmentOrStage: "Lower Secondary", createdOn: "12/09/2022 08:00" },
  { id: "P-002", name: "Omar Al-Farsi",      type: "Student",  contact: "+971 55 234 5678", status: "Enrolled",     departmentOrStage: "Primary",         createdOn: "03/03/2023 09:15" },
  { id: "P-003", name: "Layla Hassan",       type: "Student",  contact: "+971 52 345 6789", status: "Enrolled",     departmentOrStage: "Senior",          createdOn: "01/09/2021 10:00" },
  { id: "P-004", name: "Faris Qasim",        type: "Student",  contact: "+971 50 789 0123", status: "Enrolled",     departmentOrStage: "Senior",          createdOn: "05/09/2022 08:30" },
  { id: "P-005", name: "Hind Al-Rashidi",    type: "Student",  contact: "+971 50 666 7788", status: "Withdrawn",    departmentOrStage: "Lower Secondary", createdOn: "15/03/2023 11:00" },
  { id: "P-006", name: "Khalid Mansoor",     type: "Student",  contact: "+971 55 111 2233", status: "Enrolled",     departmentOrStage: "Senior",          createdOn: "01/09/2020 09:00" },
  { id: "P-007", name: "Fatima Rahman",      type: "Guardian", contact: "+971 50 123 4567", status: "Active",       departmentOrStage: "—",               createdOn: "12/09/2022 08:00" },
  { id: "P-008", name: "Khalid Al-Farsi",    type: "Guardian", contact: "+971 55 234 5678", status: "Active",       departmentOrStage: "—",               createdOn: "03/03/2023 09:15" },
  { id: "P-009", name: "Nadia Hassan",       type: "Guardian", contact: "+971 52 345 6789", status: "Active",       departmentOrStage: "—",               createdOn: "01/09/2021 10:00" },
  { id: "P-010", name: "Shaikha Al-Maktoum", type: "Guardian", contact: "+971 52 901 2345", status: "Inactive",     departmentOrStage: "—",               createdOn: "01/09/2023 09:00" },
  { id: "P-011", name: "Bilal Mahmood",      type: "Lead",     contact: "+971 50 111 2222", status: "New",          departmentOrStage: "New",             createdOn: "17/04/2025 10:00" },
  { id: "P-012", name: "Hessa Al-Blooshi",   type: "Lead",     contact: "+971 55 222 3333", status: "Trial Booked", departmentOrStage: "Trial Booked",    createdOn: "16/04/2025 14:00" },
  { id: "P-013", name: "Majid Al-Romaithi",  type: "Lead",     contact: "+971 55 800 9000", status: "Trial Booked", departmentOrStage: "Trial Booked",    createdOn: "01/04/2025 14:00" },
  { id: "P-014", name: "Nadia Al-Ghaith",    type: "Lead",     contact: "+971 50 100 2000", status: "Contacted",    departmentOrStage: "Contacted",       createdOn: "08/04/2025 11:00" },
  { id: "P-015", name: "Jason Daswani",      type: "Staff",    contact: "+971 50 000 0001", status: "Active",       departmentOrStage: "Admin",           createdOn: "01/09/2021 08:00" },
  { id: "P-016", name: "Sarah Thompson",     type: "Staff",    contact: "+971 50 000 0002", status: "Active",       departmentOrStage: "Admin",           createdOn: "15/01/2022 09:00" },
  { id: "P-017", name: "Ahmed Khalil",       type: "Staff",    contact: "+971 50 000 0003", status: "Active",       departmentOrStage: "Lower Secondary", createdOn: "12/09/2022 08:00" },
  { id: "P-018", name: "Faris Al-Amin",      type: "Staff",    contact: "+971 50 000 0004", status: "Active",       departmentOrStage: "Senior",          createdOn: "01/09/2021 08:00" },
  { id: "P-019", name: "Tariq Al-Amin",      type: "Staff",    contact: "+971 50 000 0005", status: "Active",       departmentOrStage: "Lower Secondary", createdOn: "01/09/2020 08:00" },
  { id: "P-020", name: "Sarah Mitchell",     type: "Staff",    contact: "+971 50 000 0006", status: "Active",       departmentOrStage: "Primary",         createdOn: "05/09/2022 08:00" },
];

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

export const extendedGuardians: ExtendedGuardian[] = [
  { id: "G-001", name: "Fatima Rahman",       phone: "+971 50 123 4567", email: "fatima.rahman@gmail.com",      linkedStudents: ["Aisha Rahman"],                   dnc: false, unsubscribed: false, preferredChannel: "WhatsApp", createdOn: "12/09/2022 08:00" },
  { id: "G-002", name: "Khalid Al-Farsi",     phone: "+971 55 234 5678", email: "khalid.alfarsi@gmail.com",     linkedStudents: ["Omar Al-Farsi"],                  dnc: false, unsubscribed: false, preferredChannel: "WhatsApp", createdOn: "03/03/2023 09:15" },
  { id: "G-003", name: "Nadia Hassan",        phone: "+971 52 345 6789", email: "nadia.hassan@gmail.com",       linkedStudents: ["Layla Hassan"],                   dnc: false, unsubscribed: false, preferredChannel: "Email",    createdOn: "01/09/2021 10:00" },
  { id: "G-004", name: "Rami Khalil",         phone: "+971 50 456 7890", email: "rami.khalil@gmail.com",        linkedStudents: ["Ziad Khalil"],                    dnc: false, unsubscribed: true,  preferredChannel: "Email",    createdOn: "15/01/2023 09:00" },
  { id: "G-005", name: "Hessa Nasser",        phone: "+971 55 567 8901", email: "hessa.nasser@gmail.com",       linkedStudents: ["Sara Nasser"],                    dnc: false, unsubscribed: false, preferredChannel: "WhatsApp", createdOn: "08/04/2023 10:30" },
  { id: "G-006", name: "Maryam Al-Dosari",    phone: "+971 52 678 9012", email: "maryam.aldosari@gmail.com",    linkedStudents: ["Reem Al-Dosari"],                 dnc: true,  unsubscribed: true,  preferredChannel: "In-app",   createdOn: "20/08/2022 09:00" },
  { id: "G-007", name: "Tariq Qasim",         phone: "+971 50 789 0123", email: "tariq.qasim@gmail.com",        linkedStudents: ["Faris Qasim"],                    dnc: false, unsubscribed: false, preferredChannel: "WhatsApp", createdOn: "05/09/2022 08:30" },
  { id: "G-008", name: "Leila Ibrahim",       phone: "+971 55 890 1234", email: "leila.ibrahim@gmail.com",      linkedStudents: ["Nour Ibrahim"],                   dnc: false, unsubscribed: false, preferredChannel: "Email",    createdOn: "10/11/2023 09:00" },
  { id: "G-009", name: "Shaikha Al-Maktoum",  phone: "+971 52 901 2345", email: "shaikha.almaktoum@gmail.com",  linkedStudents: ["Hamdan Al-Maktoum"],              dnc: false, unsubscribed: false, preferredChannel: "In-app",   createdOn: "01/09/2023 09:00" },
  { id: "G-010", name: "Saeed Al-Zaabi",      phone: "+971 50 012 3456", email: "saeed.alzaabi@gmail.com",      linkedStudents: ["Dana Al-Zaabi", "Ziad Khalil"],   dnc: false, unsubscribed: false, preferredChannel: "WhatsApp", createdOn: "03/09/2024 09:00" },
  { id: "G-011", name: "Amal Mansoor",        phone: "+971 55 111 2233", email: "amal.mansoor@gmail.com",       linkedStudents: ["Khalid Mansoor"],                 dnc: false, unsubscribed: false, preferredChannel: "WhatsApp", createdOn: "01/09/2020 08:00" },
  { id: "G-012", name: "Elias Khouri",        phone: "+971 55 100 2020", email: "elias.khouri@gmail.com",       linkedStudents: ["Raya Khouri", "Adam Benali"],     dnc: true,  unsubscribed: true,  preferredChannel: "Email",    createdOn: "05/09/2023 08:00" },
];

// ─── Student Outstanding Balance ──────────────────────────────────────────────

export const studentOutstandingBalance: Record<string, number> = {
  "IMI-0001": 0, "IMI-0002": 0, "IMI-0003": 3780, "IMI-0004": 0, "IMI-0005": 4200,
  "IMI-0006": 0, "IMI-0007": 0, "IMI-0008": 0,    "IMI-0009": 3360, "IMI-0010": 3360,
  "IMI-0011": 0, "IMI-0012": 0, "IMI-0013": 0,    "IMI-0014": 0,    "IMI-0015": 0,
  "IMI-0016": 0, "IMI-0017": 0, "IMI-0018": 0,    "IMI-0019": 0,    "IMI-0020": 0,
};

// ─── Lead Created On Map ──────────────────────────────────────────────────────

export const leadCreatedOnMap: Record<string, string> = {
  "L-0041": "17/04/2025 10:00", "L-0042": "17/04/2025 14:30", "L-0043": "16/04/2025 11:00",
  "L-0044": "16/04/2025 15:00", "L-0045": "13/04/2025 09:30", "L-0046": "12/04/2025 14:00",
  "L-0047": "11/04/2025 10:00", "L-0048": "10/04/2025 09:00", "L-0049": "09/04/2025 16:00",
  "L-0050": "08/04/2025 11:00", "L-0051": "07/04/2025 10:00", "L-0052": "06/04/2025 14:00",
  "L-0053": "05/04/2025 10:00", "L-0054": "04/04/2025 15:00", "L-0055": "03/04/2025 12:00",
  "L-0056": "02/04/2025 09:00", "L-0057": "01/04/2025 14:00", "L-0058": "31/03/2025 10:00",
  "L-0059": "28/03/2025 11:00", "L-0060": "25/03/2025 09:00",
};

// ─── Duplicate Detections ─────────────────────────────────────────────────────

export type DuplicateThreshold = "High" | "Medium" | "Low";
export type DuplicateStatus = "Pending" | "Resolved" | "Dismissed";

export interface DuplicatePerson {
  name: string;
  phone: string;
  email: string;
  type: PersonType;
  createdOn: string;
}

export interface DuplicateDetection {
  id: string;
  recordA: DuplicatePerson;
  recordB: DuplicatePerson;
  matchScore: number;
  matchedFields: string[];
  threshold: DuplicateThreshold;
  status: DuplicateStatus;
  detected: string;
}

export const duplicateDetections: DuplicateDetection[] = [
  { id: "DUP-001", recordA: { name: "Fatima Rahman",  phone: "+971 50 123 4567", email: "fatima.rahman@gmail.com",  type: "Guardian", createdOn: "12 Sep 2022" }, recordB: { name: "Fatima R.",     phone: "+971 50 123 4567", email: "f.rahman@hotmail.com",    type: "Guardian", createdOn: "03 Jan 2023" }, matchScore: 91, matchedFields: ["Phone", "Name"],  threshold: "High",   status: "Pending",   detected: "15 Apr 2025" },
  { id: "DUP-002", recordA: { name: "Omar Al-Farsi",  phone: "+971 55 234 5678", email: "khalid.alfarsi@gmail.com", type: "Student",  createdOn: "03 Mar 2023" }, recordB: { name: "O. Al-Farsi",  phone: "+971 55 234 5678", email: "o.alfarsi@gmail.com",     type: "Lead",     createdOn: "10 Mar 2023" }, matchScore: 87, matchedFields: ["Phone", "Name"],  threshold: "High",   status: "Pending",   detected: "14 Apr 2025" },
  { id: "DUP-003", recordA: { name: "Layla Hassan",   phone: "+971 52 345 6789", email: "nadia.hassan@gmail.com",   type: "Student",  createdOn: "01 Sep 2021" }, recordB: { name: "Layla Hassan", phone: "+971 52 999 1111", email: "layla.hassan@outlook.com", type: "Lead",     createdOn: "20 Mar 2025" }, matchScore: 74, matchedFields: ["Name", "Email"],  threshold: "Medium", status: "Resolved",  detected: "12 Apr 2025" },
  { id: "DUP-004", recordA: { name: "Bilal Mahmood",  phone: "+971 50 111 2222", email: "tariq.mahmood@gmail.com",  type: "Lead",     createdOn: "17 Apr 2025" }, recordB: { name: "Bilal M.",     phone: "+971 50 111 2222", email: "bilal.mahmood@gmail.com",  type: "Lead",     createdOn: "17 Apr 2025" }, matchScore: 71, matchedFields: ["Phone", "Name"],  threshold: "Medium", status: "Pending",   detected: "17 Apr 2025" },
  { id: "DUP-005", recordA: { name: "Sarah Mitchell", phone: "+971 50 000 0006", email: "s.mitchell@improvemeinstitute.com", type: "Staff", createdOn: "5 Sep 2022" }, recordB: { name: "Sarah M.",    phone: "+971 50 000 0006", email: "sarah.mitchell@gmail.com", type: "Staff",    createdOn: "6 Sep 2022" },  matchScore: 55, matchedFields: ["Email"],          threshold: "Low",    status: "Dismissed", detected: "10 Apr 2025" },
  { id: "DUP-006", recordA: { name: "Nadia Hassan",   phone: "+971 52 345 6789", email: "nadia.hassan@gmail.com",   type: "Guardian", createdOn: "01 Sep 2021" }, recordB: { name: "N. Hassan",    phone: "+971 52 345 6789", email: "n.hassan@yahoo.com",       type: "Guardian", createdOn: "15 Feb 2024" }, matchScore: 82, matchedFields: ["Phone", "Name"],  threshold: "High",   status: "Pending",   detected: "16 Apr 2025" },
];

// ─── Segments ─────────────────────────────────────────────────────────────────

export type SegmentScope = "Org-Wide" | "Personal";
export type SegmentRecordType = "Students" | "Guardians" | "Leads" | "Staff";

export interface Segment {
  id: string;
  name: string;
  scope: SegmentScope;
  recordType: SegmentRecordType;
  filterSummary: string;
  members: number;
  lastRefreshed: string;
  createdBy: string;
}

export const segments: Segment[] = [
  { id: "SEG-001", name: "Active Enrolled Students",          scope: "Org-Wide", recordType: "Students",  filterSummary: "Status: Enrolled",                              members: 284, lastRefreshed: "17 Apr 2025", createdBy: "Jason Daswani"  },
  { id: "SEG-002", name: "Guardians — DNC",                   scope: "Org-Wide", recordType: "Guardians", filterSummary: "DNC Status: True",                              members: 8,   lastRefreshed: "17 Apr 2025", createdBy: "Sarah Thompson" },
  { id: "SEG-003", name: "All Active Staff",                  scope: "Org-Wide", recordType: "Staff",     filterSummary: "Status: Active",                                members: 41,  lastRefreshed: "16 Apr 2025", createdBy: "Jason Daswani"  },
  { id: "SEG-004", name: "Leads in Trial Stage",              scope: "Org-Wide", recordType: "Leads",     filterSummary: "Stage: Trial Booked",                           members: 12,  lastRefreshed: "17 Apr 2025", createdBy: "Sarah Thompson" },
  { id: "SEG-005", name: "Students with Outstanding Balance", scope: "Org-Wide", recordType: "Students",  filterSummary: "Outstanding Balance: > 0",                      members: 23,  lastRefreshed: "17 Apr 2025", createdBy: "Jason Daswani"  },
  { id: "SEG-006", name: "High Churn Risk Students",          scope: "Org-Wide", recordType: "Students",  filterSummary: "Churn Risk: High",                              members: 18,  lastRefreshed: "15 Apr 2025", createdBy: "Sarah Thompson" },
  { id: "SEG-007", name: "My Primary Students",               scope: "Personal", recordType: "Students",  filterSummary: "Department: Primary | Status: Enrolled",        members: 87,  lastRefreshed: "17 Apr 2025", createdBy: "Jason Daswani"  },
  { id: "SEG-008", name: "My Senior Students",                scope: "Personal", recordType: "Students",  filterSummary: "Department: Senior | Status: Enrolled",         members: 64,  lastRefreshed: "17 Apr 2025", createdBy: "Jason Daswani"  },
  { id: "SEG-009", name: "Guardians — WhatsApp Preferred",    scope: "Personal", recordType: "Guardians", filterSummary: "Preferred Channel: WhatsApp",                   members: 142, lastRefreshed: "16 Apr 2025", createdBy: "Jason Daswani"  },
  { id: "SEG-010", name: "Lost Leads Q1 2025",                scope: "Personal", recordType: "Leads",     filterSummary: "Stage: Lost | Created: Jan–Mar 2025",          members: 9,   lastRefreshed: "14 Apr 2025", createdBy: "Jason Daswani"  },
  { id: "SEG-011", name: "Y8 Maths Group",                    scope: "Personal", recordType: "Students",  filterSummary: "Year Group: Y8 | Subject: Maths",              members: 14,  lastRefreshed: "17 Apr 2025", createdBy: "Jason Daswani"  },
  { id: "SEG-012", name: "Unsubscribed Guardians",            scope: "Personal", recordType: "Guardians", filterSummary: "Unsubscribed: True",                           members: 11,  lastRefreshed: "16 Apr 2025", createdBy: "Jason Daswani"  },
  { id: "SEG-013", name: "New Leads This Month",              scope: "Personal", recordType: "Leads",     filterSummary: "Created: Apr 2025",                            members: 7,   lastRefreshed: "17 Apr 2025", createdBy: "Jason Daswani"  },
  { id: "SEG-014", name: "Staff — Sessional Contract",        scope: "Personal", recordType: "Staff",     filterSummary: "Contract: Sessional",                          members: 3,   lastRefreshed: "17 Apr 2025", createdBy: "Jason Daswani"  },
];

// ─── Broadcast Lists ──────────────────────────────────────────────────────────

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

export const broadcastLists: BroadcastList[] = [
  { id: "BL-001", name: "All Active Guardians",        members: 198, autoRule: true,  autoRuleName: "Guardian Enrollment Auto-Rule",   lastUpdated: "17 Apr 2025", membersList: [{ name: "Fatima Rahman", type: "Guardian", addedBy: "Auto" }, { name: "Khalid Al-Farsi", type: "Guardian", addedBy: "Auto" }, { name: "Nadia Hassan", type: "Guardian", addedBy: "Auto" }, { name: "Rami Khalil", type: "Guardian", addedBy: "Auto" }, { name: "Hessa Nasser", type: "Guardian", addedBy: "Auto" }, { name: "Tariq Qasim", type: "Guardian", addedBy: "Auto" }, { name: "Leila Ibrahim", type: "Guardian", addedBy: "Auto" }, { name: "Amal Mansoor", type: "Guardian", addedBy: "Auto" }, { name: "Elias Khouri", type: "Guardian", addedBy: "Auto" }, { name: "Saeed Al-Zaabi", type: "Guardian", addedBy: "Auto" }] },
  { id: "BL-002", name: "Y9–Y11 Students",             members: 87,  autoRule: true,  autoRuleName: "Secondary Students Auto-Rule",    lastUpdated: "17 Apr 2025", membersList: [{ name: "Layla Hassan", type: "Student", addedBy: "Auto" }, { name: "Sara Nasser", type: "Student", addedBy: "Auto" }, { name: "Faris Qasim", type: "Student", addedBy: "Auto" }, { name: "Yousef Salim", type: "Student", addedBy: "Auto" }, { name: "Hamdan Al-Maktoum", type: "Student", addedBy: "Auto" }] },
  { id: "BL-003", name: "New Leads — Welcome Sequence",members: 24,  autoRule: true,  autoRuleName: "Lead Welcome Automation",         lastUpdated: "16 Apr 2025", membersList: [{ name: "Bilal Mahmood", type: "Lead", addedBy: "Auto" }, { name: "Hessa Al-Blooshi", type: "Lead", addedBy: "Auto" }, { name: "Ahmed Saleh", type: "Lead", addedBy: "Auto" }, { name: "Rana Farouk", type: "Lead", addedBy: "Auto" }, { name: "Saif Al-Nuaimi", type: "Lead", addedBy: "Auto" }] },
  { id: "BL-004", name: "Withdrawn — Re-engagement",   members: 34,  autoRule: true,  autoRuleName: "Withdrawal Re-engagement Rule",   lastUpdated: "15 Apr 2025", membersList: [{ name: "Hind Al-Rashidi", type: "Student", addedBy: "Auto" }, { name: "Tariq Osman", type: "Student", addedBy: "Auto" }] },
  { id: "BL-005", name: "IGCSE Prep Students",         members: 41,  autoRule: true,  autoRuleName: "IGCSE Cohort Rule",               lastUpdated: "14 Apr 2025", membersList: [{ name: "Layla Hassan", type: "Student", addedBy: "Auto" }, { name: "Faris Qasim", type: "Student", addedBy: "Auto" }, { name: "Khalid Mansoor", type: "Student", addedBy: "Auto" }] },
  { id: "BL-006", name: "Senior Parents Group",        members: 41,  autoRule: false, lastUpdated: "12 Apr 2025", membersList: [{ name: "Tariq Qasim", type: "Guardian", addedBy: "Manual" }, { name: "Amal Mansoor", type: "Guardian", addedBy: "Manual" }, { name: "Nadia Hassan", type: "Guardian", addedBy: "Manual" }, { name: "Jassim Al-Suwaidi", type: "Guardian", addedBy: "Manual" }, { name: "Wafa Al-Otaibi", type: "Guardian", addedBy: "Manual" }] },
  { id: "BL-007", name: "Ramadan Special Offer",       members: 63,  autoRule: false, lastUpdated: "10 Apr 2025", membersList: [{ name: "Fatima Rahman", type: "Guardian", addedBy: "Manual" }, { name: "Khalid Al-Farsi", type: "Guardian", addedBy: "Manual" }, { name: "Rami Khalil", type: "Guardian", addedBy: "Manual" }] },
  { id: "BL-008", name: "Q2 Event RSVP",               members: 19,  autoRule: false, lastUpdated: "09 Apr 2025", membersList: [{ name: "Jason Daswani", type: "Staff", addedBy: "Manual" }, { name: "Sarah Thompson", type: "Staff", addedBy: "Manual" }, { name: "Fatima Rahman", type: "Guardian", addedBy: "Manual" }] },
];

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

export const forms: Form[] = [
  { id: "FORM-001", name: "Lead Enquiry Form",          type: "Lead Enquiry",  status: "Active",   submissions: 147, lastSubmission: "17 Apr 2025", createdBy: "Jason Daswani",  pinned: true  },
  { id: "FORM-002", name: "Profile Update Form",        type: "Profile Update",status: "Active",   submissions: 89,  lastSubmission: "16 Apr 2025", createdBy: "Jason Daswani",  pinned: true  },
  { id: "FORM-003", name: "Trial Session Feedback",     type: "Custom",        status: "Active",   submissions: 41,  lastSubmission: "15 Apr 2025", createdBy: "Sarah Thompson", pinned: false },
  { id: "FORM-004", name: "New Student Registration",   type: "Custom",        status: "Active",   submissions: 38,  lastSubmission: "14 Apr 2025", createdBy: "Sarah Thompson", pinned: false },
  { id: "FORM-005", name: "End of Term Parent Survey",  type: "Custom",        status: "Draft",    submissions: 0,   lastSubmission: null,          createdBy: "Jason Daswani",  pinned: false },
  { id: "FORM-006", name: "Complaint Submission Form",  type: "Custom",        status: "Draft",    submissions: 0,   lastSubmission: null,          createdBy: "Sarah Thompson", pinned: false },
  { id: "FORM-007", name: "Session Preference Update",  type: "Custom",        status: "Archived", submissions: 26,  lastSubmission: "10 Jan 2025", createdBy: "Jason Daswani",  pinned: false },
];

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

export const formSubmissions: FormSubmission[] = [
  { id: "SUB-001", formId: "FORM-001", submittedAt: "17 Apr 2025, 09:12", submittedBy: "Tariq Mahmood",    status: "New",      linkedRecord: "Lead: Bilal Mahmood"        },
  { id: "SUB-002", formId: "FORM-001", submittedAt: "16 Apr 2025, 14:30", submittedBy: "Noura Al-Blooshi", status: "Reviewed", linkedRecord: "Lead: Hessa Al-Blooshi"     },
  { id: "SUB-003", formId: "FORM-001", submittedAt: "15 Apr 2025, 11:00", submittedBy: "Omar Saleh",       status: "Reviewed", linkedRecord: "Lead: Ahmed Saleh"          },
  { id: "SUB-004", formId: "FORM-002", submittedAt: "16 Apr 2025, 16:45", submittedBy: "Fatima Rahman",    status: "New",      linkedRecord: "Guardian: Fatima Rahman"    },
  { id: "SUB-005", formId: "FORM-002", submittedAt: "15 Apr 2025, 10:20", submittedBy: "Khalid Al-Farsi",  status: "Reviewed", linkedRecord: "Guardian: Khalid Al-Farsi"  },
  { id: "SUB-006", formId: "FORM-003", submittedAt: "15 Apr 2025, 18:00", submittedBy: "Hessa Nasser",     status: "New",      linkedRecord: "Student: Sara Nasser"       },
  { id: "SUB-007", formId: "FORM-003", submittedAt: "14 Apr 2025, 17:30", submittedBy: "Nadia Hassan",     status: "Reviewed", linkedRecord: "Student: Layla Hassan"      },
  { id: "SUB-008", formId: "FORM-003", submittedAt: "12 Apr 2025, 19:00", submittedBy: "Tariq Qasim",      status: "Reviewed", linkedRecord: "Student: Faris Qasim"       },
  { id: "SUB-009", formId: "FORM-004", submittedAt: "14 Apr 2025, 09:00", submittedBy: "Leila Ibrahim",    status: "New",      linkedRecord: "Student: Nour Ibrahim"      },
  { id: "SUB-010", formId: "FORM-004", submittedAt: "13 Apr 2025, 15:00", submittedBy: "Saeed Al-Zaabi",   status: "Reviewed", linkedRecord: "Student: Dana Al-Zaabi"     },
  { id: "SUB-011", formId: "FORM-001", submittedAt: "14 Apr 2025, 08:30", submittedBy: "Dina Farouk",      status: "New",      linkedRecord: "Lead: Rana Farouk"          },
  { id: "SUB-012", formId: "FORM-002", submittedAt: "13 Apr 2025, 11:15", submittedBy: "Amal Mansoor",     status: "New",      linkedRecord: "Guardian: Amal Mansoor"    },
];

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

export const exportHistory: ExportRecord[] = [
  { id: "EXP-001", exportedBy: "Jason Daswani",  format: "Standard CSV",        recordType: "Students",  filtersApplied: "Status: Enrolled | Dept: Senior",       rowCount: 64,  exportedAt: "17 Apr 2025, 09:14" },
  { id: "EXP-002", exportedBy: "Sarah Thompson", format: "Google Contacts CSV", recordType: "Guardians", filtersApplied: "None",                                   rowCount: 198, exportedAt: "16 Apr 2025, 14:00" },
  { id: "EXP-003", exportedBy: "Jason Daswani",  format: "Standard CSV",        recordType: "Leads",     filtersApplied: "Stage: New, Contacted",                  rowCount: 24,  exportedAt: "15 Apr 2025, 10:30" },
  { id: "EXP-004", exportedBy: "Jason Daswani",  format: "Standard CSV",        recordType: "Students",  filtersApplied: "Status: Enrolled | Year Group: Y8, Y9",  rowCount: 47,  exportedAt: "14 Apr 2025, 16:00" },
  { id: "EXP-005", exportedBy: "Sarah Thompson", format: "Google Contacts CSV", recordType: "Guardians", filtersApplied: "Preferred Channel: WhatsApp",            rowCount: 142, exportedAt: "12 Apr 2025, 11:00" },
  { id: "EXP-006", exportedBy: "Jason Daswani",  format: "Standard CSV",        recordType: "Staff",     filtersApplied: "Status: Active",                         rowCount: 41,  exportedAt: "10 Apr 2025, 09:00" },
  { id: "EXP-007", exportedBy: "Sarah Thompson", format: "Standard CSV",        recordType: "Students",  filtersApplied: "Dept: Primary | Year Group: Y3, Y4, Y5", rowCount: 82,  exportedAt: "08 Apr 2025, 14:30" },
  { id: "EXP-008", exportedBy: "Jason Daswani",  format: "Google Contacts CSV", recordType: "Leads",     filtersApplied: "Source: Referral",                       rowCount: 18,  exportedAt: "05 Apr 2025, 10:00" },
];

// ─── Class Discussion ─────────────────────────────────────────────────────────

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

// ─── Broadcast List Exclusions ───────────────────────────────────────────────

export const broadcastListExclusions: Record<string, { name: string }[]> = {
  "BL-001": [{ name: "Hessa Nasser" }],
  "BL-002": [],
  "BL-003": [{ name: "Khalifa Rashid" }, { name: "Lama Qasim" }],
  "BL-004": [],
  "BL-005": [],
  "BL-006": [{ name: "Wafa Al-Otaibi" }],
  "BL-007": [],
  "BL-008": [],
};

// ─── Form Submission Fields ───────────────────────────────────────────────────

export const formSubmissionFields: Record<string, { label: string; value: string }[]> = {
  "SUB-001": [{ label: "Guardian Name", value: "Tariq Mahmood" },    { label: "Student Name",     value: "Bilal Mahmood" },       { label: "Year Group", value: "Y7" },  { label: "Subject Interest", value: "Maths" }],
  "SUB-002": [{ label: "Guardian Name", value: "Noura Al-Blooshi" }, { label: "Student Name",     value: "Hessa Al-Blooshi" },    { label: "Year Group", value: "Y4" },  { label: "Subject Interest", value: "English, Maths" }],
  "SUB-003": [{ label: "Guardian Name", value: "Omar Saleh" },       { label: "Student Name",     value: "Ahmed Saleh" },         { label: "Year Group", value: "Y10" }, { label: "Subject Interest", value: "Physics, Maths" }],
  "SUB-004": [{ label: "Guardian Name", value: "Fatima Rahman" },    { label: "Student Name",     value: "Aisha Rahman" },        { label: "Year Group", value: "Y8" },  { label: "Subject Interest", value: "Maths" }],
  "SUB-005": [{ label: "Guardian Name", value: "Khalid Al-Farsi" },  { label: "Student Name",     value: "Omar Al-Farsi" },       { label: "Year Group", value: "Y5" },  { label: "Subject Interest", value: "Maths, English" }],
  "SUB-006": [{ label: "Guardian Name", value: "Hessa Nasser" },     { label: "Student Name",     value: "Sara Nasser" },         { label: "Year Group", value: "Y9" },  { label: "Subject Interest", value: "Maths" }],
  "SUB-007": [{ label: "Guardian Name", value: "Nadia Hassan" },     { label: "Student Name",     value: "Layla Hassan" },        { label: "Year Group", value: "Y10" }, { label: "Subject Interest", value: "Physics" }],
  "SUB-008": [{ label: "Guardian Name", value: "Tariq Qasim" },      { label: "Student Name",     value: "Faris Qasim" },         { label: "Year Group", value: "Y11" }, { label: "Subject Interest", value: "Physics, Chemistry" }],
  "SUB-009": [{ label: "Guardian Name", value: "Leila Ibrahim" },    { label: "Student Name",     value: "Nour Ibrahim" },        { label: "Year Group", value: "Y4" },  { label: "Subject Interest", value: "Maths" }],
  "SUB-010": [{ label: "Guardian Name", value: "Saeed Al-Zaabi" },   { label: "Student Name",     value: "Dana Al-Zaabi" },       { label: "Year Group", value: "Y2" },  { label: "Subject Interest", value: "English" }],
  "SUB-011": [{ label: "Guardian Name", value: "Dina Farouk" },      { label: "Student Name",     value: "Rana Farouk" },         { label: "Year Group", value: "Y2" },  { label: "Subject Interest", value: "English" }],
  "SUB-012": [{ label: "Guardian Name", value: "Amal Mansoor" },     { label: "Student Name",     value: "Khalid Mansoor" },      { label: "Year Group", value: "Y12" }, { label: "Subject Interest", value: "Maths, Physics, Chemistry" }],
};

export const classGroups: ClassGroup[] = [
  {
    id: "CG-001", name: "Y8 Maths — Group A", teacher: "Mr Ahmed Khalil", unreadCount: 2,
    posts: [
      { id: "P-001-1", sender: "Mr Ahmed Khalil", role: "Teacher", timestamp: "Mon 14 Apr, 09:00", type: "Announcement", content: "Welcome to Term 3! This term we will be covering algebra, geometry, and data handling. Please make sure calculators are charged for Saturday's session.", removed: false },
      { id: "P-001-2", sender: "Fatima Rahman", role: "Guardian", timestamp: "Mon 14 Apr, 10:15", type: "Question", content: "Will there be a focus on IGCSE preparation in the second half of this term? Aisha has her mocks coming up.", removed: false },
      { id: "P-001-3", sender: "Mr Ahmed Khalil", role: "Teacher", timestamp: "Mon 14 Apr, 11:00", type: "Discussion", content: "Great question, Fatima! Yes, from Week 6 we will shift towards exam technique and past papers. I will share a revision schedule this weekend.", removed: false },
      { id: "P-001-4", sender: "Jason Daswani", role: "Admin", timestamp: "Tue 15 Apr, 09:00", type: "Announcement", content: "Reminder: The Eid schedule has been shared via email. Sessions continue as normal next week.", removed: false },
      { id: "P-001-5", sender: "Unknown User", role: "Guardian", timestamp: "Tue 15 Apr, 12:00", type: "Discussion", content: "", removed: true },
      { id: "P-001-6", sender: "Mr Ahmed Khalil", role: "Teacher", timestamp: "Wed 16 Apr, 09:30", type: "Announcement", content: "Homework for this week: Complete exercises 4.1–4.3 from the revision pack. Due Saturday before the session.", removed: false },
    ],
  },
  {
    id: "CG-002", name: "Y10 Physics — Group A", teacher: "Mr Faris Al-Amin", unreadCount: 0,
    posts: [
      { id: "P-002-1", sender: "Mr Faris Al-Amin", role: "Teacher", timestamp: "Mon 7 Apr, 09:00", type: "Announcement", content: "IGCSE Physics sessions are now in full exam-preparation mode. We have 6 weeks until Paper 1. Every session will include timed past paper practice.", removed: false },
      { id: "P-002-2", sender: "Nadia Hassan", role: "Guardian", timestamp: "Mon 7 Apr, 14:00", type: "Question", content: "Should Layla be purchasing a specific formula booklet or will one be provided during sessions?", removed: false },
      { id: "P-002-3", sender: "Mr Faris Al-Amin", role: "Teacher", timestamp: "Mon 7 Apr, 15:30", type: "Discussion", content: "I will provide printed formula booklets for all students. No need to purchase separately. The Cambridge issued booklet will be used for all practice sessions.", removed: false },
      { id: "P-002-4", sender: "Mr Faris Al-Amin", role: "Teacher", timestamp: "Wed 9 Apr, 09:00", type: "Announcement", content: "This week's focus: Forces and Motion (Chapter 3). Please review your notes from last term before Saturday's session.", removed: false },
      { id: "P-002-5", sender: "Tariq Qasim", role: "Guardian", timestamp: "Wed 9 Apr, 17:00", type: "Discussion", content: "Faris mentioned the sessions are going very well — he feels much more confident now. Thank you for the extra support!", removed: false },
    ],
  },
  {
    id: "CG-003", name: "Y9 Maths — Group A", teacher: "Mr Tariq Al-Amin", unreadCount: 3,
    posts: [
      { id: "P-003-1", sender: "Mr Tariq Al-Amin", role: "Teacher", timestamp: "Mon 14 Apr, 09:15", type: "Announcement", content: "Term 3 focus for Y9 Maths: Quadratic equations, simultaneous equations, and geometry proofs. A challenging but very rewarding term ahead!", removed: false },
      { id: "P-003-2", sender: "Hessa Nasser", role: "Guardian", timestamp: "Mon 14 Apr, 18:00", type: "Question", content: "Sara has mentioned finding quadratic factoring particularly difficult. Is there anything we can do at home to help reinforce this?", removed: false },
      { id: "P-003-3", sender: "Mr Tariq Al-Amin", role: "Teacher", timestamp: "Tue 15 Apr, 09:00", type: "Discussion", content: "Great question. I have shared a link to some recommended practice videos via email. 15 minutes per day on these will make a big difference. Sara is making progress!", removed: false },
      { id: "P-003-4", sender: "Mona Salim", role: "Guardian", timestamp: "Tue 15 Apr, 20:00", type: "Question", content: "We haven't received the feedback summary for last Wednesday's session. Can you confirm it's been sent?", removed: false },
      { id: "P-003-5", sender: "Jason Daswani", role: "Admin", timestamp: "Wed 16 Apr, 08:00", type: "Announcement", content: "Apologies for the delay. The feedback for last week's sessions will be sent out by end of day today.", removed: false },
      { id: "P-003-6", sender: "Mr Tariq Al-Amin", role: "Teacher", timestamp: "Wed 16 Apr, 10:00", type: "Announcement", content: "This week's homework: Complete the quadratic practice sheet (10 questions). Bring it to Saturday's session.", removed: false },
    ],
  },
  {
    id: "CG-004", name: "Y3 English — Group A", teacher: "Ms Sarah Mitchell", unreadCount: 0,
    posts: [
      { id: "P-004-1", sender: "Ms Sarah Mitchell", role: "Teacher", timestamp: "Mon 7 Apr, 09:00", type: "Announcement", content: "Term 3 English focus: Creative writing, reading comprehension, and vocabulary building. We have some lovely new books for the reading programme this term!", removed: false },
      { id: "P-004-2", sender: "Rami Khalil", role: "Guardian", timestamp: "Mon 7 Apr, 19:30", type: "Discussion", content: "Ziad is really excited about the new reading books. He has been talking about it all day! Thank you for making sessions so engaging.", removed: false },
      { id: "P-004-3", sender: "Ms Sarah Mitchell", role: "Teacher", timestamp: "Tue 8 Apr, 08:30", type: "Discussion", content: "That is so lovely to hear, Rami! Ziad's enthusiasm for reading is wonderful. We will be starting Charlotte's Web this Saturday.", removed: false },
      { id: "P-004-4", sender: "Ms Sarah Mitchell", role: "Teacher", timestamp: "Wed 9 Apr, 09:00", type: "Announcement", content: "Reading challenge update: All students in Group A have completed Chapter 1. Ziad is in the lead with Chapter 2 already done at home!", removed: false },
      { id: "P-004-5", sender: "Ms Sarah Mitchell", role: "Teacher", timestamp: "Thu 10 Apr, 09:00", type: "Question", content: "Reminder: Can all guardians confirm whether their children prefer the printed vocabulary sheets or the digital version for homework?", removed: false },
    ],
  },
];

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

export const automationTemplates: AutomationTemplate[] = [
  {
    id: "TPL-001", name: "New Lead Welcome Message", type: "Message", status: "Active", owner: "Org-Wide",
    body: "Hi [parent_name], welcome to [tenant_name]! We're thrilled to have you. Expect a call within 24 hours to discuss [child_name]'s learning journey.",
    mergeFields: ["parent_name", "tenant_name", "child_name"], version: 2,
    usedInRules: ["New Lead — Welcome Message"], locked: false,
  },
  {
    id: "TPL-002", name: "Assessment Booking Confirmation", type: "Email", status: "Active", owner: "Org-Wide",
    body: "Dear [parent_name], your assessment for [child_name] in [subject] is confirmed for [session_date] at [session_time]. We look forward to seeing you!",
    mergeFields: ["parent_name", "child_name", "subject", "session_date", "session_time"], version: 1,
    usedInRules: ["Assessment Booked — Confirmation"], locked: false,
  },
  {
    id: "TPL-003", name: "Absence Alert — Parent Notification", type: "Message", status: "Active", owner: "Org-Wide",
    body: "Hi [parent_name], we noticed [child_name] was absent from today's [subject] session. Please contact us to arrange a makeup or provide a reason.",
    mergeFields: ["parent_name", "child_name", "subject"], version: 2,
    usedInRules: ["Absent Not Notified — Alert Admin", "48h Attendance Lock"], locked: true,
  },
  {
    id: "TPL-004", name: "Invoice Payment Reminder", type: "Email", status: "Active", owner: "Org-Wide",
    body: "Dear [parent_name], your invoice of [amount] is due on [due_date]. Please log in to [tenant_name] to complete your payment at your earliest convenience.",
    mergeFields: ["parent_name", "amount", "due_date", "tenant_name"], version: 1,
    usedInRules: ["Invoice Overdue — Create Task", "Payment Received — Confirm to Parent"], locked: false,
  },
  {
    id: "TPL-005", name: "Trial Class Confirmation", type: "Email", status: "Draft", owner: "Personal",
    body: "Hi [parent_name], [child_name]'s trial [subject] session with [teacher_name] is confirmed for [session_date] at [session_time]. We can't wait to meet you!",
    mergeFields: ["parent_name", "child_name", "subject", "teacher_name", "session_date"], version: 1,
    usedInRules: ["Trial Complete — Send Survey"], locked: false,
  },
  {
    id: "TPL-006", name: "End of Term Feedback Summary", type: "Announcement", status: "Active", owner: "Org-Wide",
    body: "Dear [parent_name], [child_name]'s end-of-term summary from [tenant_name] is now available. Log in to view detailed notes from [teacher_name] for this term.",
    mergeFields: ["parent_name", "child_name", "tenant_name", "teacher_name"], version: 2,
    usedInRules: ["Feedback Approved — Send to Parent", "Term End — Trigger Bulk Reports"], locked: false,
  },
  {
    id: "TPL-007", name: "Enrolment Confirmation", type: "Email", status: "Active", owner: "Org-Wide",
    body: "Hi [parent_name], [child_name] is now officially enrolled in [subject] at [tenant_name]. First session: [session_date] at [session_time]. Welcome aboard!",
    mergeFields: ["parent_name", "child_name", "subject", "session_date", "session_time"], version: 1,
    usedInRules: ["Enrolment Confirmed — Parent Message"], locked: false,
  },
  {
    id: "TPL-008", name: "Late Payment Follow-up", type: "Task", status: "Draft", owner: "Personal",
    body: "Dear [parent_name], your payment of [amount] due on [due_date] remains outstanding. Please contact [tenant_name] immediately to avoid any interruption to services.",
    mergeFields: ["parent_name", "amount", "due_date", "tenant_name"], version: 1,
    usedInRules: ["Late Payment — Escalate Task"], locked: false,
  },
  {
    id: "TPL-009", name: "CPD Milestone Congratulations", type: "Message", status: "Active", owner: "Org-Wide",
    body: "Congratulations [teacher_name]! You've reached a significant CPD milestone at [tenant_name]. Your commitment to professional development is greatly appreciated by the team.",
    mergeFields: ["teacher_name", "tenant_name"], version: 2,
    usedInRules: ["CPD 50% Milestone — Notify Staff"], locked: false,
  },
  {
    id: "TPL-010", name: "Progress Report Ready", type: "Announcement", status: "Archived", owner: "Org-Wide",
    body: "Hi [parent_name], [child_name]'s [subject] progress report for this term is now available. Log in to [tenant_name] to review their detailed academic progress and notes.",
    mergeFields: ["parent_name", "child_name", "subject", "tenant_name"], version: 1,
    usedInRules: ["Progress Report — Dispatch Approval"], locked: false,
  },
  {
    id: "TPL-011", name: "Makeup Session Booked", type: "Message", status: "Draft", owner: "Personal",
    body: "Hi [parent_name], a makeup session for [child_name] in [subject] is now scheduled for [session_date] at [session_time] with [teacher_name]. See you then!",
    mergeFields: ["parent_name", "child_name", "subject", "session_date", "session_time"], version: 1,
    usedInRules: ["Makeup Booked — Notify Parent"], locked: false,
  },
  {
    id: "TPL-012", name: "Withdrawal Confirmation", type: "Email", status: "Archived", owner: "Personal",
    body: "Dear [parent_name], we confirm [child_name]'s withdrawal from [tenant_name] effective [session_date]. We sincerely hope to welcome you back in the future.",
    mergeFields: ["parent_name", "child_name", "tenant_name", "session_date"], version: 2,
    usedInRules: ["Withdrawal Confirmed — Exit Survey"], locked: true,
  },
];

// ─── Automation Rules ─────────────────────────────────────────────────────────

export type AutomationRuleTrigger = 'Status Change' | 'Time-based' | 'Threshold' | 'Form Submission' | 'Manual';
export type AutomationRuleStatus = 'Enabled' | 'Disabled' | 'Locked';

export interface AutomationRule {
  id: string;
  name: string;
  triggerType: AutomationRuleTrigger;
  module: string;
  status: AutomationRuleStatus;
  lastFired: string;
  fireCount: number;
  locked: boolean;
}

export const automationRules: AutomationRule[] = [
  { id: "RULE-001", name: "New Lead — Welcome Message",          triggerType: "Status Change",   module: "M02", status: "Enabled",  lastFired: "2 hours ago",  fireCount: 143, locked: false },
  { id: "RULE-002", name: "Assessment Booked — Confirmation",    triggerType: "Status Change",   module: "M03", status: "Enabled",  lastFired: "1 hour ago",   fireCount: 89,  locked: false },
  { id: "RULE-003", name: "Absent Not Notified — Alert Admin",   triggerType: "Threshold",       module: "M05", status: "Enabled",  lastFired: "3 hours ago",  fireCount: 201, locked: false },
  { id: "RULE-004", name: "Invoice Overdue — Create Task",       triggerType: "Time-based",      module: "M08", status: "Enabled",  lastFired: "Yesterday",    fireCount: 67,  locked: false },
  { id: "RULE-005", name: "Trial Complete — Send Survey",        triggerType: "Form Submission", module: "M03", status: "Enabled",  lastFired: "4 hours ago",  fireCount: 52,  locked: false },
  { id: "RULE-006", name: "Enrolment Confirmed — Parent Message",triggerType: "Status Change",   module: "M03", status: "Enabled",  lastFired: "30 mins ago",  fireCount: 118, locked: false },
  { id: "RULE-007", name: "CPD 50% Milestone — Notify Staff",    triggerType: "Threshold",       module: "M09", status: "Enabled",  lastFired: "2 days ago",   fireCount: 34,  locked: false },
  { id: "RULE-008", name: "Concern Auto-Task Creation",          triggerType: "Threshold",       module: "M07", status: "Locked",   lastFired: "5 hours ago",  fireCount: 312, locked: true  },
  { id: "RULE-009", name: "DNC Interstitial Routing",            triggerType: "Status Change",   module: "M02", status: "Locked",   lastFired: "1 day ago",    fireCount: 88,  locked: true  },
  { id: "RULE-010", name: "48h Attendance Lock",                 triggerType: "Time-based",      module: "M05", status: "Locked",   lastFired: "6 hours ago",  fireCount: 445, locked: true  },
  { id: "RULE-011", name: "Progress Report — Dispatch Approval", triggerType: "Manual",          module: "M07", status: "Enabled",  lastFired: "3 days ago",   fireCount: 28,  locked: false },
  { id: "RULE-012", name: "Lead Inactive 14 Days — Flag",        triggerType: "Time-based",      module: "M02", status: "Enabled",  lastFired: "6 hours ago",  fireCount: 77,  locked: false },
  { id: "RULE-013", name: "Payment Received — Confirm to Parent",triggerType: "Status Change",   module: "M08", status: "Enabled",  lastFired: "45 mins ago",  fireCount: 156, locked: false },
  { id: "RULE-014", name: "Makeup Booked — Notify Parent",       triggerType: "Status Change",   module: "M04", status: "Disabled", lastFired: "Never",        fireCount: 0,   locked: false },
  { id: "RULE-015", name: "Withdrawal Confirmed — Exit Survey",  triggerType: "Status Change",   module: "M03", status: "Disabled", lastFired: "2 weeks ago",  fireCount: 23,  locked: false },
  { id: "RULE-016", name: "Late Payment — Escalate Task",        triggerType: "Threshold",       module: "M08", status: "Disabled", lastFired: "1 week ago",   fireCount: 41,  locked: false },
  { id: "RULE-017", name: "Feedback Approved — Send to Parent",  triggerType: "Manual",          module: "M07", status: "Disabled", lastFired: "5 days ago",   fireCount: 19,  locked: false },
  { id: "RULE-018", name: "Term End — Trigger Bulk Reports",     triggerType: "Manual",          module: "M12", status: "Disabled", lastFired: "4 days ago",   fireCount: 8,   locked: false },
];

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

export const dispatchQueueItems: DispatchQueueItem[] = [
  { id: "DQ-001", templateName: "Absence Alert — Parent Notification", contactName: "Fatima Rahman", generatedAt: "14 min ago", sourceRule: "Absent Not Notified — Alert Admin", claimedBy: null, claimedUntil: null, renderedBody: "Hi Fatima, we noticed Aisha was absent from today's Maths session. Please contact us to arrange a makeup or provide a reason.", status: "Unclaimed" },
  { id: "DQ-002", templateName: "Invoice Payment Reminder", contactName: "Hessa Nasser", generatedAt: "32 min ago", sourceRule: "Invoice Overdue — Create Task", claimedBy: null, claimedUntil: null, renderedBody: "Dear Hessa, your invoice of AED 3,360 is due on 20 Apr 2025. Please log in to IMI to complete your payment at your earliest convenience.", status: "Unclaimed" },
  { id: "DQ-003", templateName: "New Lead Welcome Message", contactName: "Tariq Mahmood", generatedAt: "1 hr ago", sourceRule: "New Lead — Welcome Message", claimedBy: "Noor Al-Mansoori", claimedUntil: "18:42", renderedBody: "Hi Tariq, welcome to IMI! We're thrilled to have you. Expect a call within 24 hours to discuss Bilal's learning journey.", status: "Claimed" },
  { id: "DQ-004", templateName: "Absence Alert — Parent Notification", contactName: "Mona Salim", generatedAt: "1 hr ago", sourceRule: "Absent Not Notified — Alert Admin", claimedBy: null, claimedUntil: null, renderedBody: "Hi Mona, we noticed Yousef was absent from today's Physics session. Please contact us to arrange a makeup or provide a reason.", status: "Unclaimed" },
  { id: "DQ-005", templateName: "Invoice Payment Reminder", contactName: "Khalid Al-Farsi", generatedAt: "2 hr ago", sourceRule: "Invoice Overdue — Create Task", claimedBy: null, claimedUntil: null, renderedBody: "Dear Khalid, your invoice of AED 4,200 is due on 22 Apr 2025. Please log in to IMI to complete your payment at your earliest convenience.", status: "Unclaimed" },
  { id: "DQ-006", templateName: "Trial Class Confirmation", contactName: "Noura Al-Blooshi", generatedAt: "2 hr ago", sourceRule: "Trial Complete — Send Survey", claimedBy: "Noor Al-Mansoori", claimedUntil: "19:15", renderedBody: "Hi Noura, Hessa's trial Maths session with Mr Ahmed Khalil is confirmed for 19 Apr 2025 at 10:00. We can't wait to meet you!", status: "Claimed" },
  { id: "DQ-007", templateName: "Absence Alert — Parent Notification", contactName: "Rami Khalil", generatedAt: "3 hr ago", sourceRule: "Absent Not Notified — Alert Admin", claimedBy: null, claimedUntil: null, renderedBody: "Hi Rami, we noticed Ziad was absent from today's English session. Please contact us to arrange a makeup or provide a reason.", status: "Unclaimed" },
  { id: "DQ-008", templateName: "Invoice Payment Reminder", contactName: "Nadia Hassan", generatedAt: "3 hr ago", sourceRule: "Invoice Overdue — Create Task", claimedBy: null, claimedUntil: null, renderedBody: "Dear Nadia, your invoice of AED 3,780 is due on 25 Apr 2025. Please log in to IMI to complete your payment at your earliest convenience.", status: "Unclaimed" },
  { id: "DQ-009", templateName: "New Lead Welcome Message", contactName: "Dina Farouk", generatedAt: "4 hr ago", sourceRule: "New Lead — Welcome Message", claimedBy: null, claimedUntil: null, renderedBody: "Hi Dina, welcome to IMI! We're thrilled to have you. Expect a call within 24 hours to discuss Rana's learning journey.", status: "Unclaimed" },
  { id: "DQ-010", templateName: "Enrolment Confirmation", contactName: "Leila Ibrahim", generatedAt: "5 hr ago", sourceRule: "Enrolment Confirmed — Parent Message", claimedBy: null, claimedUntil: null, renderedBody: "Hi Leila, Nour is now officially enrolled in Maths at IMI. First session: 21 Apr 2025 at 09:00. Welcome aboard!", status: "Unclaimed" },
  { id: "DQ-011", templateName: "Enrolment Confirmation", contactName: "Amal Mansoor", generatedAt: "9:14 AM", sourceRule: "Enrolment Confirmed — Parent Message", claimedBy: null, claimedUntil: null, renderedBody: "Hi Amal, Khalid is now officially enrolled in Physics at IMI. First session: 22 Apr 2025 at 14:00. Welcome aboard!", status: "Sent" },
  { id: "DQ-012", templateName: "Absence Alert — Parent Notification", contactName: "Tariq Qasim", generatedAt: "8:52 AM", sourceRule: "Absent Not Notified — Alert Admin", claimedBy: null, claimedUntil: null, renderedBody: "Hi Tariq, we noticed Faris was absent from today's Physics session. Please contact us to arrange a makeup or provide a reason.", status: "Sent" },
];

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

export const internalMessages: InternalMessage[] = [
  { id: "IM-001", sender: "Jason Daswani", initials: "JD", avatarColor: "bg-amber-500", timestamp: "09:02", body: "Morning team — just a heads up, Fatima Rahman called about an invoice discrepancy. I've raised a task.", mentions: [], recordTags: [], reactions: [{ emoji: "👍", count: 2 }] },
  { id: "IM-002", sender: "Sarah Thompson", initials: "ST", avatarColor: "bg-blue-500", timestamp: "09:18", body: "Thanks Jason. @Noor Al-Mansoori can you pick up the dispatch queue this morning? There are 8 unclaimed messages.", mentions: ["Noor Al-Mansoori"], recordTags: [], reactions: [] },
  { id: "IM-003", sender: "Noor Al-Mansoori", initials: "NM", avatarColor: "bg-purple-500", timestamp: "09:24", body: "On it! Just started claiming them now.", mentions: [], recordTags: [], reactions: [{ emoji: "✅", count: 1 }] },
  { id: "IM-004", sender: "Ahmed Khalil", initials: "AK", avatarColor: "bg-green-500", timestamp: "10:05", body: "Flagging this student for the team — she's been absent 3 sessions in a row without notice.", mentions: [], recordTags: [{ name: "Aisha Rahman — Student", type: "Student" }], reactions: [] },
  { id: "IM-005", sender: "Sarah Thompson", initials: "ST", avatarColor: "bg-blue-500", timestamp: "10:22", body: "Seen — I'll call the guardian today. @Jason Daswani can you ensure the concern is logged properly?", mentions: ["Jason Daswani"], recordTags: [], reactions: [] },
  { id: "IM-006", sender: "Jason Daswani", initials: "JD", avatarColor: "bg-amber-500", timestamp: "10:31", body: "Will do. Concern is already open from the automation. I'll update the escalation log after the call.", mentions: [], recordTags: [], reactions: [{ emoji: "👍", count: 3 }] },
];

// ─── Marketing Moments ────────────────────────────────────────────────────────

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

export const marketingMoments: MarketingMoment[] = [
  { id: "MM-001", name: "Eid Mubarak Greeting", audience: "All Active Guardians", template: "New Lead Welcome Message", status: "Sent", scheduledFor: "1 Apr 2025, 09:00", dispatched: 198, total: 198, calendarDate: 1 },
  { id: "MM-002", name: "Q2 Term Launch Announcement", audience: "Active Enrolled Students", template: "End of Term Feedback Summary", status: "Sent", scheduledFor: "7 Apr 2025, 08:00", dispatched: 47, total: 52, calendarDate: 7 },
  { id: "MM-003", name: "IGCSE Prep Drive", audience: "Leads in Trial Stage", template: "Trial Class Confirmation", status: "Sent", scheduledFor: "10 Apr 2025, 10:00", dispatched: 12, total: 12, calendarDate: 10 },
  { id: "MM-004", name: "Outstanding Balance Nudge", audience: "Students with Outstanding Balance", template: "Invoice Payment Reminder", status: "Scheduled", scheduledFor: "20 Apr 2025, 09:00", dispatched: 0, total: 23, calendarDate: 20 },
  { id: "MM-005", name: "End of Term Survey Blast", audience: "Active Enrolled Students", template: "End of Term Feedback Summary", status: "Scheduled", scheduledFor: "25 Apr 2025, 08:30", dispatched: 0, total: 284, calendarDate: 25 },
  { id: "MM-006", name: "Summer Enrolment Teaser", audience: "High Churn Risk Students", template: "New Lead Welcome Message", status: "Draft", scheduledFor: "28 Apr 2025, 10:00", dispatched: 0, total: 18, calendarDate: 28 },
];

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

export const marketingCampaigns: MarketingCampaign[] = [
  { id: "MC-001", campaign: "Eid Mubarak Greeting",         audience: "All Active Guardians",           template: "New Lead Welcome Message",       sent: 198, delivered: 194, failed: 4,  scheduledAt: "1 Apr 2025, 09:00",  status: "Sent"      },
  { id: "MC-002", campaign: "Q2 Term Launch Announcement",  audience: "Active Enrolled Students",        template: "End of Term Feedback Summary",    sent: 52,  delivered: 47,  failed: 5,  scheduledAt: "7 Apr 2025, 08:00",  status: "Sent"      },
  { id: "MC-003", campaign: "IGCSE Prep Drive",             audience: "Leads in Trial Stage",            template: "Trial Class Confirmation",        sent: 12,  delivered: 12,  failed: 0,  scheduledAt: "10 Apr 2025, 10:00", status: "Sent"      },
  { id: "MC-004", campaign: "March Re-engagement",          audience: "Withdrawn — Re-engagement",       template: "New Lead Welcome Message",        sent: 34,  delivered: 29,  failed: 5,  scheduledAt: "15 Mar 2025, 09:00", status: "Sent"      },
  { id: "MC-005", campaign: "Ramadan Special Offer",        audience: "Guardians — WhatsApp Preferred",  template: "Invoice Payment Reminder",        sent: 63,  delivered: 61,  failed: 2,  scheduledAt: "10 Mar 2025, 10:00", status: "Sent"      },
  { id: "MC-006", campaign: "Outstanding Balance Nudge",    audience: "Students with Outstanding Balance", template: "Invoice Payment Reminder",      sent: 0,   delivered: 0,   failed: 0,  scheduledAt: "20 Apr 2025, 09:00", status: "Scheduled" },
  { id: "MC-007", campaign: "Summer Enrolment Teaser",      audience: "High Churn Risk Students",        template: "New Lead Welcome Message",        sent: 0,   delivered: 0,   failed: 0,  scheduledAt: "28 Apr 2025, 10:00", status: "Draft"     },
  { id: "MC-008", campaign: "Q1 NPS Survey",                audience: "Active Enrolled Students",        template: "End of Term Feedback Summary",    sent: 0,   delivered: 0,   failed: 0,  scheduledAt: "31 Jan 2025, 08:00", status: "Cancelled" },
];

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

export const executionLogs: ExecutionLog[] = [
  { id: "EL-001", rule: "Absent Not Notified — Alert Admin", triggerType: "Threshold", firedAt: "14 min ago", recipients: 3, live: 0, queued: 3, status: "Success", duration: "142ms", payload: [{ key: "student_id", value: "IMI-0042" }, { key: "event", value: "absent_not_notified" }, { key: "session_date", value: "17 Apr 2025" }], conditionResults: [{ condition: "absence_notified = false", result: "pass" }, { condition: "session_status = Marked", result: "pass" }], actionResults: [{ type: "Send Message", outcome: "Success", target: "DQ-001 queued" }, { type: "Create Task", outcome: "Success", target: "Task created: T-0291" }], recipientRouting: [{ recipient: "Fatima Rahman", channel: "WhatsApp", route: "Queue", outcome: "Queued" }, { recipient: "Mona Salim", channel: "WhatsApp", route: "Queue", outcome: "Queued" }, { recipient: "Rami Khalil", channel: "Email", route: "Queue", outcome: "Queued" }] },
  { id: "EL-002", rule: "New Lead — Welcome Message", triggerType: "Status Change", firedAt: "1 hr ago", recipients: 1, live: 1, queued: 0, status: "Success", duration: "98ms", payload: [{ key: "lead_id", value: "L-0041" }, { key: "event", value: "lead_created" }, { key: "source", value: "Website Form" }], conditionResults: [{ condition: "lead_status = New", result: "pass" }], actionResults: [{ type: "Send Message", outcome: "Success", target: "TPL-001 dispatched" }], recipientRouting: [{ recipient: "Tariq Mahmood", channel: "WhatsApp", route: "Queue", outcome: "Queued" }, { recipient: "System Log", channel: "Internal", route: "Live", outcome: "Logged" }, { recipient: "Admin Inbox", channel: "In-app", route: "Live", outcome: "Delivered" }] },
  { id: "EL-003", rule: "Invoice Overdue — Create Task", triggerType: "Time-based", firedAt: "2 hr ago", recipients: 2, live: 0, queued: 2, status: "Success", duration: "203ms", payload: [{ key: "invoice_id", value: "INV-0098" }, { key: "event", value: "invoice_overdue" }, { key: "days_overdue", value: "7" }], conditionResults: [{ condition: "outstanding_balance > 0", result: "pass" }, { condition: "invoice_status = Overdue", result: "pass" }], actionResults: [{ type: "Create Task", outcome: "Success", target: "Task created: T-0288" }, { type: "Send Message", outcome: "Success", target: "DQ-002 queued" }], recipientRouting: [{ recipient: "Hessa Nasser", channel: "WhatsApp", route: "Queue", outcome: "Queued" }, { recipient: "Jason Daswani", channel: "In-app", route: "Live", outcome: "Delivered" }, { recipient: "Finance Dashboard", channel: "System", route: "Live", outcome: "Updated" }] },
  { id: "EL-004", rule: "Enrolment Confirmed — Parent Message", triggerType: "Status Change", firedAt: "3 hr ago", recipients: 1, live: 1, queued: 0, status: "Success", duration: "77ms", payload: [{ key: "student_id", value: "IMI-0019" }, { key: "event", value: "enrolment_confirmed" }], conditionResults: [{ condition: "enrolment_status = Confirmed", result: "pass" }], actionResults: [{ type: "Send Message", outcome: "Success", target: "TPL-007 dispatched" }], recipientRouting: [{ recipient: "Leila Ibrahim", channel: "Email", route: "Queue", outcome: "Queued" }, { recipient: "Admin Inbox", channel: "In-app", route: "Live", outcome: "Delivered" }, { recipient: "Enrolment Log", channel: "System", route: "Live", outcome: "Logged" }] },
  { id: "EL-005", rule: "Trial Complete — Send Survey", triggerType: "Form Submission", firedAt: "4 hr ago", recipients: 1, live: 0, queued: 1, status: "Skipped", duration: "54ms", payload: [{ key: "lead_id", value: "L-0043" }, { key: "event", value: "trial_completed" }], conditionResults: [{ condition: "trial_status = Completed", result: "pass" }, { condition: "guardian_unsubscribed = false", result: "fail" }], actionResults: [{ type: "Send Message", outcome: "Skipped", target: "Rule skipped — condition failed" }], recipientRouting: [{ recipient: "Hessa Al-Blooshi", channel: "WhatsApp", route: "Queue", outcome: "Skipped" }, { recipient: "Admin Inbox", channel: "In-app", route: "Live", outcome: "Notified" }, { recipient: "Survey System", channel: "System", route: "Live", outcome: "Not triggered" }] },
  { id: "EL-006", rule: "CPD 50% Milestone — Notify Staff", triggerType: "Threshold", firedAt: "5 hr ago", recipients: 1, live: 1, queued: 0, status: "Success", duration: "61ms", payload: [{ key: "staff_id", value: "STAFF-004" }, { key: "event", value: "cpd_target_50_reached" }, { key: "cpd_hours", value: "25" }], conditionResults: [{ condition: "cpd_percentage >= 50", result: "pass" }], actionResults: [{ type: "Send Message", outcome: "Success", target: "TPL-009 dispatched" }], recipientRouting: [{ recipient: "Faris Al-Amin", channel: "In-app", route: "Live", outcome: "Delivered" }, { recipient: "HR Dashboard", channel: "System", route: "Live", outcome: "Updated" }, { recipient: "Jason Daswani", channel: "In-app", route: "Live", outcome: "Notified" }] },
  { id: "EL-007", rule: "Concern Auto-Task Creation", triggerType: "Threshold", firedAt: "5 hr ago", recipients: 2, live: 2, queued: 0, status: "Success", duration: "119ms", payload: [{ key: "concern_id", value: "CMP-006" }, { key: "event", value: "concern_raised_l1" }, { key: "severity", value: "Medium" }], conditionResults: [{ condition: "concern_level = L1", result: "pass" }, { condition: "assignee_available = true", result: "pass" }], actionResults: [{ type: "Create Task", outcome: "Success", target: "Task created: T-0289" }, { type: "Assign Owner", outcome: "Success", target: "Assigned: Jason Daswani" }], recipientRouting: [{ recipient: "Jason Daswani", channel: "In-app", route: "Live", outcome: "Delivered" }, { recipient: "Sarah Thompson", channel: "In-app", route: "Live", outcome: "Delivered" }, { recipient: "Concern Log", channel: "System", route: "Live", outcome: "Logged" }] },
  { id: "EL-008", rule: "48h Attendance Lock", triggerType: "Time-based", firedAt: "6 hr ago", recipients: 5, live: 0, queued: 5, status: "Success", duration: "318ms", payload: [{ key: "session_ids", value: "SES-112,SES-113" }, { key: "event", value: "attendance_not_marked_48h" }], conditionResults: [{ condition: "attendance_marked = false", result: "pass" }, { condition: "session_age_hours >= 48", result: "pass" }], actionResults: [{ type: "Update Field", outcome: "Success", target: "attendance_status = Locked" }, { type: "Create Task", outcome: "Success", target: "Task created: T-0290" }], recipientRouting: [{ recipient: "Ahmed Khalil", channel: "In-app", route: "Queue", outcome: "Queued" }, { recipient: "Jason Daswani", channel: "In-app", route: "Queue", outcome: "Queued" }, { recipient: "Timetable System", channel: "System", route: "Live", outcome: "Updated" }] },
  { id: "EL-009", rule: "Payment Received — Confirm to Parent", triggerType: "Status Change", firedAt: "45 min ago", recipients: 1, live: 1, queued: 0, status: "Success", duration: "88ms", payload: [{ key: "invoice_id", value: "INV-0094" }, { key: "event", value: "payment_received" }, { key: "amount", value: "AED 3360" }], conditionResults: [{ condition: "payment_status = Received", result: "pass" }], actionResults: [{ type: "Send Message", outcome: "Success", target: "TPL-004 dispatched" }], recipientRouting: [{ recipient: "Tariq Qasim", channel: "WhatsApp", route: "Live", outcome: "Delivered" }, { recipient: "Finance Log", channel: "System", route: "Live", outcome: "Logged" }, { recipient: "Admin Inbox", channel: "In-app", route: "Live", outcome: "Notified" }] },
  { id: "EL-010", rule: "DNC Interstitial Routing", triggerType: "Status Change", firedAt: "1 day ago", recipients: 1, live: 0, queued: 0, status: "Skipped", duration: "32ms", payload: [{ key: "guardian_id", value: "G-006" }, { key: "event", value: "message_attempted" }], conditionResults: [{ condition: "guardian_dnc = false", result: "fail" }], actionResults: [{ type: "Send Message", outcome: "Skipped", target: "DNC block applied" }], recipientRouting: [{ recipient: "Maryam Al-Dosari", channel: "WhatsApp", route: "Queue", outcome: "Blocked — DNC" }, { recipient: "Admin Inbox", channel: "In-app", route: "Live", outcome: "Warned" }, { recipient: "DNC Log", channel: "System", route: "Live", outcome: "Logged" }] },
  { id: "EL-011", rule: "Lead Inactive 14 Days — Flag", triggerType: "Time-based", firedAt: "6 hr ago", recipients: 3, live: 0, queued: 3, status: "Success", duration: "174ms", payload: [{ key: "lead_ids", value: "L-0048,L-0050,L-0052" }, { key: "event", value: "lead_inactive_14_days" }], conditionResults: [{ condition: "last_contact_days >= 14", result: "pass" }, { condition: "lead_status != Lost", result: "pass" }], actionResults: [{ type: "Update Field", outcome: "Success", target: "lead_flag = Inactive" }, { type: "Create Task", outcome: "Success", target: "Task created: T-0286" }], recipientRouting: [{ recipient: "Jason Daswani", channel: "In-app", route: "Queue", outcome: "Queued" }, { recipient: "Sarah Thompson", channel: "In-app", route: "Queue", outcome: "Queued" }, { recipient: "CRM Dashboard", channel: "System", route: "Live", outcome: "Updated" }] },
  { id: "EL-012", rule: "Progress Report — Dispatch Approval", triggerType: "Manual", firedAt: "3 days ago", recipients: 4, live: 4, queued: 0, status: "Failed", duration: "502ms", payload: [{ key: "batch_id", value: "RPT-BATCH-007" }, { key: "event", value: "progress_report_generated" }], conditionResults: [{ condition: "report_status = Approved", result: "pass" }, { condition: "template_id exists", result: "fail" }], actionResults: [{ type: "Send Message", outcome: "Failed", target: "Template not found: TPL-010" }], recipientRouting: [{ recipient: "Fatima Rahman", channel: "Email", route: "Queue", outcome: "Failed" }, { recipient: "Nadia Hassan", channel: "Email", route: "Queue", outcome: "Failed" }, { recipient: "Admin Inbox", channel: "In-app", route: "Live", outcome: "Error notified" }] },
  { id: "EL-013", rule: "Feedback Approved — Send to Parent", triggerType: "Manual", firedAt: "5 days ago", recipients: 6, live: 0, queued: 6, status: "Success", duration: "241ms", payload: [{ key: "feedback_batch", value: "FB-BATCH-003" }, { key: "event", value: "feedback_approved" }], conditionResults: [{ condition: "feedback_status = Approved", result: "pass" }, { condition: "guardian_unsubscribed = false", result: "pass" }], actionResults: [{ type: "Send Message", outcome: "Success", target: "TPL-006 dispatched x6" }], recipientRouting: [{ recipient: "Fatima Rahman", channel: "WhatsApp", route: "Queue", outcome: "Queued" }, { recipient: "Nadia Hassan", channel: "Email", route: "Queue", outcome: "Queued" }, { recipient: "Amal Mansoor", channel: "WhatsApp", route: "Queue", outcome: "Queued" }] },
  { id: "EL-014", rule: "Term End — Trigger Bulk Reports", triggerType: "Manual", firedAt: "4 days ago", recipients: 8, live: 8, queued: 0, status: "Success", duration: "891ms", payload: [{ key: "term", value: "Term 2 2025" }, { key: "event", value: "progress_report_generated" }], conditionResults: [{ condition: "term_end_flag = true", result: "pass" }], actionResults: [{ type: "Create Task", outcome: "Success", target: "Bulk tasks created: T-0270 to T-0277" }], recipientRouting: [{ recipient: "Ahmed Khalil", channel: "In-app", route: "Live", outcome: "Delivered" }, { recipient: "Faris Al-Amin", channel: "In-app", route: "Live", outcome: "Delivered" }, { recipient: "Jason Daswani", channel: "In-app", route: "Live", outcome: "Delivered" }] },
  { id: "EL-015", rule: "Assessment Booked — Confirmation", triggerType: "Status Change", firedAt: "1 hr ago", recipients: 1, live: 0, queued: 1, status: "Success", duration: "103ms", payload: [{ key: "lead_id", value: "L-0042" }, { key: "event", value: "trial_booked" }], conditionResults: [{ condition: "trial_status = Booked", result: "pass" }], actionResults: [{ type: "Send Message", outcome: "Success", target: "TPL-002 dispatched" }], recipientRouting: [{ recipient: "Noura Al-Blooshi", channel: "Email", route: "Queue", outcome: "Queued" }, { recipient: "Admin Calendar", channel: "System", route: "Live", outcome: "Updated" }, { recipient: "Jason Daswani", channel: "In-app", route: "Live", outcome: "Notified" }] },
];

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
}

export interface InventorySupplier {
  id: string
  name: string
  phone: string | null
  email: string | null
  itemCount: number
  notes: string | null
}

export interface ReorderAlert {
  id: string
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

export const inventoryItems: InventoryItem[] = [
  // ── Folders & Files ───────────────────────────────────────────────────────
  {
    id: "inv-001", name: "Box File Folder — Orange (KG1)", category: "Folders & Files",
    unit: "Each", currentStock: 42, minStock: 15, maxStock: 60, reorderQty: 30,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Farook", amazonLink: null, notes: "Orange folders for KG1. Order from Farook Deira branch.",
    health: "healthy",
    autoDeductRules: [{ id: "r-001-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["KG1"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-001-1", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "17 Apr 2026, 10:14" },
      { id: "l-001-2", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "15 Apr 2026, 09:31" },
      { id: "l-001-3", changeType: "reorder_received", quantityChange: 30, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
      { id: "l-001-4", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "8 Apr 2026, 11:22" },
    ],
  },
  {
    id: "inv-002", name: "Box File Folder — Yellow (KG2)", category: "Folders & Files",
    unit: "Each", currentStock: 38, minStock: 15, maxStock: 60, reorderQty: 30,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Farook", amazonLink: null, notes: "Yellow folders for KG2.",
    health: "healthy",
    autoDeductRules: [{ id: "r-002-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["KG2"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-002-1", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "16 Apr 2026, 14:05" },
      { id: "l-002-2", changeType: "reorder_received", quantityChange: 30, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
      { id: "l-002-3", changeType: "auto_deduct", quantityChange: -2, actor: "System (Enrolment)", timestamp: "7 Apr 2026, 10:00" },
    ],
  },
  {
    id: "inv-003", name: "Box File Folder — Red (Y1)", category: "Folders & Files",
    unit: "Each", currentStock: 12, minStock: 15, maxStock: 60, reorderQty: 30,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Farook", amazonLink: null, notes: "Red folders for Y1. REORDER NOW.",
    health: "below",
    autoDeductRules: [{ id: "r-003-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["Y1"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-003-1", changeType: "auto_deduct", quantityChange: -3, actor: "System (Enrolment)", timestamp: "17 Apr 2026, 09:00" },
      { id: "l-003-2", changeType: "auto_deduct", quantityChange: -2, actor: "System (Enrolment)", timestamp: "14 Apr 2026, 11:30" },
      { id: "l-003-3", changeType: "manual_deduct", quantityChange: -1, actor: "Sarah Thompson", timestamp: "12 Apr 2026, 15:00" },
    ],
  },
  {
    id: "inv-004", name: "Box File Folder — Blue (Y2)", category: "Folders & Files",
    unit: "Each", currentStock: 29, minStock: 15, maxStock: 60, reorderQty: 30,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Farook", amazonLink: null, notes: "Blue folders for Y2.",
    health: "healthy",
    autoDeductRules: [{ id: "r-004-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["Y2"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-004-1", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "15 Apr 2026, 12:00" },
      { id: "l-004-2", changeType: "reorder_received", quantityChange: 30, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
      { id: "l-004-3", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "5 Apr 2026, 10:00" },
    ],
  },
  {
    id: "inv-005", name: "Box File Folder — Green (Y3)", category: "Folders & Files",
    unit: "Each", currentStock: 18, minStock: 15, maxStock: 60, reorderQty: 30,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Farook", amazonLink: null, notes: "Green folders for Y3. Running low.",
    health: "approaching",
    autoDeductRules: [{ id: "r-005-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["Y3"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-005-1", changeType: "auto_deduct", quantityChange: -2, actor: "System (Enrolment)", timestamp: "16 Apr 2026, 08:45" },
      { id: "l-005-2", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "10 Apr 2026, 09:00" },
      { id: "l-005-3", changeType: "reorder_received", quantityChange: 30, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-006", name: "Box File Folder — Purple (Y4)", category: "Folders & Files",
    unit: "Each", currentStock: 33, minStock: 15, maxStock: 60, reorderQty: 30,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Farook", amazonLink: null, notes: "Purple folders for Y4.",
    health: "healthy",
    autoDeductRules: [{ id: "r-006-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["Y4"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-006-1", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "14 Apr 2026, 11:00" },
      { id: "l-006-2", changeType: "reorder_received", quantityChange: 30, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-007", name: "Box File Folder — Grey (Y5/Y6)", category: "Folders & Files",
    unit: "Each", currentStock: 16, minStock: 15, maxStock: 60, reorderQty: 30,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Farook", amazonLink: null, notes: "Grey folders for Y5 and Y6.",
    health: "approaching",
    autoDeductRules: [{ id: "r-007-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["Y5", "Y6"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-007-1", changeType: "auto_deduct", quantityChange: -2, actor: "System (Enrolment)", timestamp: "17 Apr 2026, 10:00" },
      { id: "l-007-2", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "13 Apr 2026, 09:30" },
      { id: "l-007-3", changeType: "reorder_received", quantityChange: 30, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-008", name: "Black Folder (Y7–Y9)", category: "Folders & Files",
    unit: "Each", currentStock: 55, minStock: 20, maxStock: 80, reorderQty: 40,
    autoDeduct: true, departmentScope: "Lower Secondary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Farook", amazonLink: null, notes: "Black folders for Lower Secondary Y7-Y9.",
    health: "healthy",
    autoDeductRules: [{ id: "r-008-1", trigger: "Enrolment Confirmed", departments: ["Lower Secondary"], yearGroups: ["Y7", "Y8", "Y9"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-008-1", changeType: "auto_deduct", quantityChange: -2, actor: "System (Enrolment)", timestamp: "15 Apr 2026, 13:00" },
      { id: "l-008-2", changeType: "reorder_received", quantityChange: 40, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
      { id: "l-008-3", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "5 Apr 2026, 10:00" },
    ],
  },
  // ── Plastic Folders ────────────────────────────────────────────────────────
  {
    id: "inv-009", name: "Plastic Folder Insert — Yellow (KG1)", category: "Plastic Folders",
    unit: "Each", currentStock: 67, minStock: 20, maxStock: 100, reorderQty: 50,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Saleem", amazonLink: null, notes: "Yellow plastic inserts for KG1 box files.",
    health: "healthy",
    autoDeductRules: [{ id: "r-009-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["KG1"], quantity: 2, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-009-1", changeType: "auto_deduct", quantityChange: -2, actor: "System (Enrolment)", timestamp: "17 Apr 2026, 10:14" },
      { id: "l-009-2", changeType: "reorder_received", quantityChange: 50, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-010", name: "Plastic Folder Insert — Red (Y1)", category: "Plastic Folders",
    unit: "Each", currentStock: 21, minStock: 20, maxStock: 100, reorderQty: 50,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Saleem", amazonLink: null, notes: "Red plastic inserts for Y1.",
    health: "approaching",
    autoDeductRules: [{ id: "r-010-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["Y1"], quantity: 2, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-010-1", changeType: "auto_deduct", quantityChange: -4, actor: "System (Enrolment)", timestamp: "16 Apr 2026, 09:00" },
      { id: "l-010-2", changeType: "auto_deduct", quantityChange: -2, actor: "System (Enrolment)", timestamp: "10 Apr 2026, 10:00" },
      { id: "l-010-3", changeType: "reorder_received", quantityChange: 50, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-011", name: "Plastic Folder Insert — Blue (Y2)", category: "Plastic Folders",
    unit: "Each", currentStock: 45, minStock: 20, maxStock: 100, reorderQty: 50,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Saleem", amazonLink: null, notes: "Blue plastic inserts for Y2.",
    health: "healthy",
    autoDeductRules: [{ id: "r-011-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["Y2"], quantity: 2, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-011-1", changeType: "auto_deduct", quantityChange: -2, actor: "System (Enrolment)", timestamp: "15 Apr 2026, 12:00" },
      { id: "l-011-2", changeType: "reorder_received", quantityChange: 50, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-012", name: "Plastic Folder Insert — Green (Y3)", category: "Plastic Folders",
    unit: "Each", currentStock: 38, minStock: 20, maxStock: 100, reorderQty: 50,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Saleem", amazonLink: null, notes: "Green plastic inserts for Y3.",
    health: "healthy",
    autoDeductRules: [{ id: "r-012-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["Y3"], quantity: 2, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-012-1", changeType: "auto_deduct", quantityChange: -4, actor: "System (Enrolment)", timestamp: "14 Apr 2026, 11:00" },
      { id: "l-012-2", changeType: "reorder_received", quantityChange: 50, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
    ],
  },
  // ── Stickers & Labels ──────────────────────────────────────────────────────
  {
    id: "inv-013", name: "Subject Sticker — Maths (Primary KG1–Y6)", category: "Stickers & Labels",
    unit: "Sheet", currentStock: 8, minStock: 10, maxStock: 50, reorderQty: 20,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Selva", amazonLink: null, notes: "Maths subject stickers for Primary. REORDER NOW.",
    health: "below",
    autoDeductRules: [{ id: "r-013-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["KG1","KG2","Y1","Y2","Y3","Y4","Y5","Y6"], quantity: 1, condition: "Every enrolment", active: true }],
    recentLedger: [
      { id: "l-013-1", changeType: "auto_deduct", quantityChange: -3, actor: "System (Enrolment)", timestamp: "17 Apr 2026, 10:14" },
      { id: "l-013-2", changeType: "auto_deduct", quantityChange: -2, actor: "System (Enrolment)", timestamp: "14 Apr 2026, 09:00" },
      { id: "l-013-3", changeType: "manual_deduct", quantityChange: -1, actor: "Sarah Thompson", timestamp: "10 Apr 2026, 11:00" },
      { id: "l-013-4", changeType: "reorder_received", quantityChange: 20, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-014", name: "Subject Sticker — English (Primary KG1–Y6)", category: "Stickers & Labels",
    unit: "Sheet", currentStock: 14, minStock: 10, maxStock: 50, reorderQty: 20,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Selva", amazonLink: null, notes: "English subject stickers for Primary.",
    health: "approaching",
    autoDeductRules: [{ id: "r-014-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["KG1","KG2","Y1","Y2","Y3","Y4","Y5","Y6"], quantity: 1, condition: "Every enrolment", active: true }],
    recentLedger: [
      { id: "l-014-1", changeType: "auto_deduct", quantityChange: -2, actor: "System (Enrolment)", timestamp: "16 Apr 2026, 10:00" },
      { id: "l-014-2", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "13 Apr 2026, 09:00" },
      { id: "l-014-3", changeType: "reorder_received", quantityChange: 20, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-015", name: "Subject Sticker — Maths (Lower Sec Y7–Y9)", category: "Stickers & Labels",
    unit: "Sheet", currentStock: 32, minStock: 10, maxStock: 50, reorderQty: 20,
    autoDeduct: true, departmentScope: "Lower Secondary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Selva", amazonLink: null, notes: "Maths stickers for Lower Secondary.",
    health: "healthy",
    autoDeductRules: [{ id: "r-015-1", trigger: "Enrolment Confirmed", departments: ["Lower Secondary"], yearGroups: ["Y7","Y8","Y9"], quantity: 1, condition: "Every enrolment", active: true }],
    recentLedger: [
      { id: "l-015-1", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "15 Apr 2026, 13:00" },
      { id: "l-015-2", changeType: "reorder_received", quantityChange: 20, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-016", name: "Behaviour Rules Sticker", category: "Stickers & Labels",
    unit: "Sheet", currentStock: 9, minStock: 20, maxStock: 100, reorderQty: 40,
    autoDeduct: true, departmentScope: "Primary + Lower Secondary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Selva", amazonLink: null, notes: "Behaviour rules stickers for all year groups. REORDER NOW.",
    health: "below",
    autoDeductRules: [
      { id: "r-016-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["KG1","KG2","Y1","Y2","Y3","Y4","Y5","Y6"], quantity: 1, condition: "First enrolment only", active: true },
      { id: "r-016-2", trigger: "Enrolment Confirmed", departments: ["Lower Secondary"], yearGroups: ["Y7","Y8","Y9"], quantity: 1, condition: "First enrolment only", active: true },
    ],
    recentLedger: [
      { id: "l-016-1", changeType: "auto_deduct", quantityChange: -4, actor: "System (Enrolment)", timestamp: "17 Apr 2026, 09:30" },
      { id: "l-016-2", changeType: "auto_deduct", quantityChange: -3, actor: "System (Enrolment)", timestamp: "14 Apr 2026, 10:00" },
      { id: "l-016-3", changeType: "manual_deduct", quantityChange: -2, actor: "Sarah Thompson", timestamp: "10 Apr 2026, 11:00" },
      { id: "l-016-4", changeType: "reorder_received", quantityChange: 40, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  // ── Lanyards ───────────────────────────────────────────────────────────────
  {
    id: "inv-017", name: "Lanyard — Orange (KG1)", category: "Lanyards",
    unit: "Each", currentStock: 22, minStock: 10, maxStock: 50, reorderQty: 20,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Deira Stationery", amazonLink: null, notes: "Orange lanyards for KG1. Contact Co Srinivas.",
    health: "healthy",
    autoDeductRules: [{ id: "r-017-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["KG1"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-017-1", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "17 Apr 2026, 10:14" },
      { id: "l-017-2", changeType: "reorder_received", quantityChange: 20, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-018", name: "Lanyard — Yellow (KG2)", category: "Lanyards",
    unit: "Each", currentStock: 8, minStock: 10, maxStock: 50, reorderQty: 20,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Deira Stationery", amazonLink: null, notes: "Yellow lanyards for KG2. REORDER NOW.",
    health: "below",
    autoDeductRules: [{ id: "r-018-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["KG2"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-018-1", changeType: "auto_deduct", quantityChange: -2, actor: "System (Enrolment)", timestamp: "16 Apr 2026, 09:00" },
      { id: "l-018-2", changeType: "auto_deduct", quantityChange: -3, actor: "System (Enrolment)", timestamp: "13 Apr 2026, 10:00" },
      { id: "l-018-3", changeType: "reorder_received", quantityChange: 20, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-019", name: "Lanyard — Red (Y1)", category: "Lanyards",
    unit: "Each", currentStock: 17, minStock: 10, maxStock: 50, reorderQty: 20,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Deira Stationery", amazonLink: null, notes: "Red lanyards for Y1.",
    health: "healthy",
    autoDeductRules: [{ id: "r-019-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["Y1"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-019-1", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "15 Apr 2026, 12:00" },
      { id: "l-019-2", changeType: "reorder_received", quantityChange: 20, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-020", name: "Lanyard — Grey (Y5/Y6)", category: "Lanyards",
    unit: "Each", currentStock: 11, minStock: 10, maxStock: 50, reorderQty: 20,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Deira Stationery", amazonLink: null, notes: "Grey lanyards for Y5/Y6.",
    health: "approaching",
    autoDeductRules: [{ id: "r-020-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["Y5","Y6"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-020-1", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "14 Apr 2026, 11:00" },
      { id: "l-020-2", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "10 Apr 2026, 09:00" },
      { id: "l-020-3", changeType: "reorder_received", quantityChange: 20, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  // ── Bags ───────────────────────────────────────────────────────────────────
  {
    id: "inv-021", name: "Tote Bag", category: "Bags",
    unit: "Each", currentStock: 18, minStock: 5, maxStock: 30, reorderQty: 15,
    autoDeduct: true, departmentScope: "Primary", enrolTrigger: "Enrolment Confirmed",
    supplier: "Shafqat", amazonLink: null, notes: "IMI branded tote bags. Contact Shafqat.",
    health: "healthy",
    autoDeductRules: [{ id: "r-021-1", trigger: "Enrolment Confirmed", departments: ["Primary"], yearGroups: ["KG1","KG2","Y1","Y2","Y3","Y4","Y5","Y6"], quantity: 1, condition: "First enrolment only", active: true }],
    recentLedger: [
      { id: "l-021-1", changeType: "auto_deduct", quantityChange: -1, actor: "System (Enrolment)", timestamp: "17 Apr 2026, 10:14" },
      { id: "l-021-2", changeType: "reorder_received", quantityChange: 15, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
    ],
  },
  // ── Writing Instruments ────────────────────────────────────────────────────
  {
    id: "inv-022", name: "Pencils — HB Standard", category: "Writing Instruments",
    unit: "Box of 12", currentStock: 12, minStock: 5, maxStock: 20, reorderQty: 10,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Findel", amazonLink: null, notes: "HB pencils. Order via findel-dryad.ae.",
    health: "healthy", autoDeductRules: [],
    recentLedger: [
      { id: "l-022-1", changeType: "manual_deduct", quantityChange: -1, actor: "Sarah Thompson", timestamp: "10 Apr 2026, 11:00" },
      { id: "l-022-2", changeType: "reorder_received", quantityChange: 10, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-023", name: "Pens — Blue Ballpoint", category: "Writing Instruments",
    unit: "Box of 20", currentStock: 6, minStock: 5, maxStock: 25, reorderQty: 10,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Amazon", amazonLink: "https://amazon.ae", notes: "Blue ballpoint pens. Order on amazon.ae.",
    health: "approaching", autoDeductRules: [],
    recentLedger: [
      { id: "l-023-1", changeType: "manual_deduct", quantityChange: -2, actor: "Sarah Thompson", timestamp: "15 Apr 2026, 11:00" },
      { id: "l-023-2", changeType: "reorder_received", quantityChange: 10, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-024", name: "Pens — Black Ballpoint", category: "Writing Instruments",
    unit: "Box of 20", currentStock: 14, minStock: 5, maxStock: 25, reorderQty: 10,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Amazon", amazonLink: "https://amazon.ae", notes: "Black ballpoint pens.",
    health: "healthy", autoDeductRules: [],
    recentLedger: [
      { id: "l-024-1", changeType: "manual_deduct", quantityChange: -1, actor: "Sarah Thompson", timestamp: "12 Apr 2026, 10:00" },
      { id: "l-024-2", changeType: "reorder_received", quantityChange: 10, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-025", name: "Whiteboard Markers — Black", category: "Writing Instruments",
    unit: "Box of 10", currentStock: 4, minStock: 5, maxStock: 30, reorderQty: 15,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Dubai Library", amazonLink: null, notes: "Black whiteboard markers. REORDER NOW.",
    health: "below", autoDeductRules: [],
    recentLedger: [
      { id: "l-025-1", changeType: "manual_deduct", quantityChange: -2, actor: "Ahmed Khalil", timestamp: "16 Apr 2026, 09:00" },
      { id: "l-025-2", changeType: "waste", quantityChange: -1, actor: "Sarah Thompson", timestamp: "10 Apr 2026, 11:00" },
      { id: "l-025-3", changeType: "reorder_received", quantityChange: 15, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-026", name: "Highlighters — Assorted Pack", category: "Writing Instruments",
    unit: "Pack of 6", currentStock: 9, minStock: 5, maxStock: 20, reorderQty: 10,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Amazon", amazonLink: "https://amazon.ae", notes: "Assorted highlighters.",
    health: "healthy", autoDeductRules: [],
    recentLedger: [
      { id: "l-026-1", changeType: "manual_deduct", quantityChange: -1, actor: "Sarah Thompson", timestamp: "10 Apr 2026, 11:00" },
      { id: "l-026-2", changeType: "reorder_received", quantityChange: 10, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  // ── Erasers & Correction ───────────────────────────────────────────────────
  {
    id: "inv-027", name: "Rubber Erasers — Standard White", category: "Erasers & Correction",
    unit: "Box of 20", currentStock: 7, minStock: 3, maxStock: 15, reorderQty: 6,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Findel", amazonLink: null, notes: "Standard white erasers.",
    health: "healthy", autoDeductRules: [],
    recentLedger: [
      { id: "l-027-1", changeType: "manual_deduct", quantityChange: -1, actor: "Sarah Thompson", timestamp: "8 Apr 2026, 11:00" },
      { id: "l-027-2", changeType: "reorder_received", quantityChange: 6, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-028", name: "Whiteboard Erasers — Felt Block", category: "Erasers & Correction",
    unit: "Each", currentStock: 8, minStock: 5, maxStock: 20, reorderQty: 10,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Amazon", amazonLink: "https://amazon.ae", notes: "Felt whiteboard erasers.",
    health: "approaching", autoDeductRules: [],
    recentLedger: [
      { id: "l-028-1", changeType: "manual_deduct", quantityChange: -1, actor: "Ahmed Khalil", timestamp: "14 Apr 2026, 09:00" },
      { id: "l-028-2", changeType: "reorder_received", quantityChange: 10, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  // ── Paper Products ─────────────────────────────────────────────────────────
  {
    id: "inv-029", name: "A4 Paper — White 80gsm", category: "Paper Products",
    unit: "Ream", currentStock: 22, minStock: 10, maxStock: 40, reorderQty: 20,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Fortune Stationery", amazonLink: null, notes: "Standard A4 white paper. High usage — check weekly.",
    health: "healthy", autoDeductRules: [],
    recentLedger: [
      { id: "l-029-1", changeType: "manual_deduct", quantityChange: -3, actor: "Sarah Thompson", timestamp: "17 Apr 2026, 09:00" },
      { id: "l-029-2", changeType: "reorder_received", quantityChange: 20, actor: "Jason Daswani", timestamp: "10 Apr 2026, 14:00" },
      { id: "l-029-3", changeType: "manual_deduct", quantityChange: -2, actor: "Ahmed Khalil", timestamp: "5 Apr 2026, 10:00" },
    ],
  },
  {
    id: "inv-030", name: "A4 Paper — Coloured Orange", category: "Paper Products",
    unit: "Ream", currentStock: 4, minStock: 3, maxStock: 15, reorderQty: 6,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Amazon", amazonLink: "https://amazon.ae", notes: "Orange coloured A4 paper.",
    health: "approaching", autoDeductRules: [],
    recentLedger: [
      { id: "l-030-1", changeType: "manual_deduct", quantityChange: -1, actor: "Sarah Thompson", timestamp: "15 Apr 2026, 11:00" },
      { id: "l-030-2", changeType: "reorder_received", quantityChange: 6, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  // ── Cleaning & Hygiene ─────────────────────────────────────────────────────
  {
    id: "inv-031", name: "Hand Sanitiser — 500ml", category: "Cleaning & Hygiene",
    unit: "Bottle", currentStock: 6, minStock: 5, maxStock: 20, reorderQty: 10,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Amazon", amazonLink: "https://amazon.ae", notes: "500ml hand sanitiser bottles.",
    health: "approaching", autoDeductRules: [],
    recentLedger: [
      { id: "l-031-1", changeType: "manual_deduct", quantityChange: -2, actor: "Sarah Thompson", timestamp: "10 Apr 2026, 11:00" },
      { id: "l-031-2", changeType: "reorder_received", quantityChange: 10, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  {
    id: "inv-032", name: "Paper Towels — Roll", category: "Cleaning & Hygiene",
    unit: "Pack of 6", currentStock: 12, minStock: 5, maxStock: 20, reorderQty: 10,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Amazon", amazonLink: "https://amazon.ae", notes: "Paper towel rolls.",
    health: "healthy", autoDeductRules: [],
    recentLedger: [
      { id: "l-032-1", changeType: "manual_deduct", quantityChange: -1, actor: "Sarah Thompson", timestamp: "10 Apr 2026, 11:00" },
      { id: "l-032-2", changeType: "reorder_received", quantityChange: 10, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  // ── Filing & Organisation ──────────────────────────────────────────────────
  {
    id: "inv-033", name: "Index Dividers — A4 5-part", category: "Filing & Organisation",
    unit: "Box of 50", currentStock: 4, minStock: 3, maxStock: 10, reorderQty: 5,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Farook", amazonLink: null, notes: "A4 5-part index dividers.",
    health: "approaching", autoDeductRules: [],
    recentLedger: [
      { id: "l-033-1", changeType: "manual_deduct", quantityChange: -1, actor: "Sarah Thompson", timestamp: "8 Apr 2026, 11:00" },
      { id: "l-033-2", changeType: "reorder_received", quantityChange: 5, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  // ── Printing & Lamination ──────────────────────────────────────────────────
  {
    id: "inv-034", name: "Lamination Pouches — A4", category: "Printing & Lamination",
    unit: "Pack of 100", currentStock: 3, minStock: 2, maxStock: 8, reorderQty: 4,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Amazon", amazonLink: "https://amazon.ae", notes: "A4 lamination pouches.",
    health: "approaching", autoDeductRules: [],
    recentLedger: [
      { id: "l-034-1", changeType: "manual_deduct", quantityChange: -1, actor: "Sarah Thompson", timestamp: "5 Apr 2026, 11:00" },
      { id: "l-034-2", changeType: "reorder_received", quantityChange: 4, actor: "Jason Daswani", timestamp: "1 Mar 2026, 14:00" },
    ],
  },
  // ── Electronics & Tech ─────────────────────────────────────────────────────
  {
    id: "inv-035", name: "AA Batteries — Pack", category: "Electronics & Tech",
    unit: "Pack of 20", currentStock: 8, minStock: 3, maxStock: 15, reorderQty: 6,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Amazon", amazonLink: "https://amazon.ae", notes: "AA batteries for remotes and devices.",
    health: "healthy", autoDeductRules: [],
    recentLedger: [
      { id: "l-035-1", changeType: "manual_deduct", quantityChange: -1, actor: "Ahmed Khalil", timestamp: "10 Apr 2026, 11:00" },
      { id: "l-035-2", changeType: "reorder_received", quantityChange: 6, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  // ── Arts & Crafts ──────────────────────────────────────────────────────────
  {
    id: "inv-036", name: "Glue Sticks — Pack", category: "Arts & Crafts",
    unit: "Pack of 10", currentStock: 6, minStock: 3, maxStock: 15, reorderQty: 6,
    autoDeduct: false, departmentScope: "Primary", enrolTrigger: null,
    supplier: "Amazon", amazonLink: "https://amazon.ae", notes: "Glue sticks for Primary arts and crafts.",
    health: "healthy", autoDeductRules: [],
    recentLedger: [
      { id: "l-036-1", changeType: "manual_deduct", quantityChange: -1, actor: "Sarah Thompson", timestamp: "10 Apr 2026, 11:00" },
      { id: "l-036-2", changeType: "reorder_received", quantityChange: 6, actor: "Jason Daswani", timestamp: "1 Apr 2026, 14:00" },
    ],
  },
  // ── Branded Materials ──────────────────────────────────────────────────────
  {
    id: "inv-037", name: "IMI Branded Pens", category: "Branded Materials",
    unit: "Box of 50", currentStock: 120, minStock: 30, maxStock: 200, reorderQty: 50,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Farook", amazonLink: null, notes: "IMI branded pens for events and welcome kits.",
    health: "healthy", autoDeductRules: [],
    recentLedger: [
      { id: "l-037-1", changeType: "manual_deduct", quantityChange: -50, actor: "Jason Daswani", timestamp: "1 Apr 2026, 10:00" },
      { id: "l-037-2", changeType: "reorder_received", quantityChange: 100, actor: "Jason Daswani", timestamp: "1 Mar 2026, 14:00" },
    ],
  },
  // ── Health & Safety ────────────────────────────────────────────────────────
  {
    id: "inv-038", name: "First Aid Kit Refill", category: "Health & Safety",
    unit: "Kit", currentStock: 2, minStock: 2, maxStock: 5, reorderQty: 2,
    autoDeduct: false, departmentScope: "All", enrolTrigger: null,
    supplier: "Amazon", amazonLink: "https://amazon.ae", notes: "First aid kit refill packs. REORDER NOW.",
    health: "below", autoDeductRules: [],
    recentLedger: [
      { id: "l-038-1", changeType: "manual_deduct", quantityChange: -1, actor: "Sarah Thompson", timestamp: "1 Apr 2026, 11:00" },
      { id: "l-038-2", changeType: "reorder_received", quantityChange: 2, actor: "Jason Daswani", timestamp: "1 Mar 2026, 14:00" },
    ],
  },
];

export const inventorySuppliers: InventorySupplier[] = [
  { id: "sup-1",  name: "Farook",             phone: "+971561749841", email: "deira1@farook.ae",  itemCount: 12, notes: "IMI branded folders and filing — Deira branch" },
  { id: "sup-2",  name: "Saleem",             phone: "+971564242011", email: null,                itemCount: 4,  notes: "Plastic folder inserts" },
  { id: "sup-3",  name: "Selva",              phone: "+971551641104", email: null,                itemCount: 4,  notes: "Stickers and labels" },
  { id: "sup-4",  name: "Deira Stationery",   phone: null,            email: null,                itemCount: 4,  notes: "Co Srinivas — lanyards" },
  { id: "sup-5",  name: "Shafqat",            phone: "+971555526742", email: null,                itemCount: 1,  notes: "Tote bags" },
  { id: "sup-6",  name: "Fortune Stationery", phone: "+971505442093", email: null,                itemCount: 2,  notes: "A4 paper — high usage item" },
  { id: "sup-7",  name: "Findel",             phone: null,            email: null,                itemCount: 3,  notes: "findel-dryad.ae — UK stationery supplier" },
  { id: "sup-8",  name: "Amazon",             phone: null,            email: null,                itemCount: 15, notes: "amazon.ae — various consumables" },
  { id: "sup-9",  name: "Dubai Library",      phone: null,            email: null,                itemCount: 1,  notes: "Whiteboard markers" },
  { id: "sup-10", name: "Carrefour UAE",       phone: null,            email: null,                itemCount: 3,  notes: "Bulk cleaning supplies" },
  { id: "sup-11", name: "ACCO Brands",         phone: null,            email: null,                itemCount: 4,  notes: "Filing and binding products" },
  { id: "sup-12", name: "Al Ghurair Print",    phone: "+971042231234", email: null,                itemCount: 2,  notes: "Custom print orders" },
  { id: "sup-13", name: "GEMS Supplies",       phone: null,            email: null,                itemCount: 5,  notes: "School-grade stationery" },
  { id: "sup-14", name: "Lulu Hypermarket",    phone: null,            email: null,                itemCount: 4,  notes: "General consumables backup" },
];

export const reorderAlerts: ReorderAlert[] = [
  { id: "ra-001", itemName: "Box File Folder — Red (Y1)",              category: "Folders & Files",      currentStock: 12, minStock: 15, reorderQty: 30, supplierName: "Farook",         supplierPhone: "+971561749841", supplierEmail: "deira1@farook.ae", amazonLink: null,                  status: "open",    openedAt: "17 Apr 2026" },
  { id: "ra-002", itemName: "Subject Sticker — Maths (Primary KG1–Y6)",category: "Stickers & Labels",    currentStock: 8,  minStock: 10, reorderQty: 20, supplierName: "Selva",          supplierPhone: "+971551641104", supplierEmail: null,               amazonLink: null,                  status: "open",    openedAt: "17 Apr 2026" },
  { id: "ra-003", itemName: "Behaviour Rules Sticker",                 category: "Stickers & Labels",    currentStock: 9,  minStock: 20, reorderQty: 40, supplierName: "Selva",          supplierPhone: "+971551641104", supplierEmail: null,               amazonLink: null,                  status: "ordered", openedAt: "15 Apr 2026" },
  { id: "ra-004", itemName: "Lanyard — Yellow (KG2)",                  category: "Lanyards",             currentStock: 8,  minStock: 10, reorderQty: 20, supplierName: "Deira Stationery",supplierPhone: null,           supplierEmail: null,               amazonLink: null,                  status: "open",    openedAt: "16 Apr 2026" },
  { id: "ra-005", itemName: "Whiteboard Markers — Black",              category: "Writing Instruments",  currentStock: 4,  minStock: 5,  reorderQty: 15, supplierName: "Dubai Library",  supplierPhone: null,            supplierEmail: null,               amazonLink: null,                  status: "open",    openedAt: "16 Apr 2026" },
  { id: "ra-006", itemName: "First Aid Kit Refill",                    category: "Health & Safety",      currentStock: 2,  minStock: 2,  reorderQty: 2,  supplierName: "Amazon",         supplierPhone: null,            supplierEmail: null,               amazonLink: "https://amazon.ae",  status: "open",    openedAt: "14 Apr 2026" },
  { id: "ra-007", itemName: "Plastic Folder Insert — Red (Y1)",        category: "Plastic Folders",      currentStock: 21, minStock: 20, reorderQty: 50, supplierName: "Saleem",         supplierPhone: "+971564242011", supplierEmail: null,               amazonLink: null,                  status: "ignored", openedAt: "13 Apr 2026" },
];

export const stockLedgerEntries: StockLedgerEntry[] = [
  { id: "sl-001", itemName: "Box File Folder — Orange (KG1)",   category: "Folders & Files",     changeType: "auto_deduct",          quantityChange: -1,  actor: "System (Enrolment)",  timestamp: "17 Apr 2026, 10:14" },
  { id: "sl-002", itemName: "Subject Sticker — Maths (Primary)",category: "Stickers & Labels",   changeType: "auto_deduct",          quantityChange: -3,  actor: "System (Enrolment)",  timestamp: "17 Apr 2026, 10:14" },
  { id: "sl-003", itemName: "Tote Bag",                         category: "Bags",                changeType: "auto_deduct",          quantityChange: -1,  actor: "System (Enrolment)",  timestamp: "17 Apr 2026, 10:14" },
  { id: "sl-004", itemName: "Lanyard — Yellow (KG2)",           category: "Lanyards",            changeType: "auto_deduct",          quantityChange: -2,  actor: "System (Enrolment)",  timestamp: "16 Apr 2026, 09:00" },
  { id: "sl-005", itemName: "Whiteboard Markers — Black",       category: "Writing Instruments", changeType: "manual_deduct",        quantityChange: -2,  actor: "Ahmed Khalil",        timestamp: "16 Apr 2026, 09:00" },
  { id: "sl-006", itemName: "Pens — Blue Ballpoint",            category: "Writing Instruments", changeType: "manual_deduct",        quantityChange: -2,  actor: "Sarah Thompson",      timestamp: "15 Apr 2026, 11:00" },
  { id: "sl-007", itemName: "A4 Paper — White 80gsm",           category: "Paper Products",      changeType: "manual_deduct",        quantityChange: -3,  actor: "Sarah Thompson",      timestamp: "17 Apr 2026, 09:00" },
  { id: "sl-008", itemName: "Box File Folder — Red (Y1)",       category: "Folders & Files",     changeType: "auto_deduct",          quantityChange: -3,  actor: "System (Enrolment)",  timestamp: "17 Apr 2026, 09:00" },
  { id: "sl-009", itemName: "Behaviour Rules Sticker",          category: "Stickers & Labels",   changeType: "auto_deduct",          quantityChange: -4,  actor: "System (Enrolment)",  timestamp: "17 Apr 2026, 09:30" },
  { id: "sl-010", itemName: "Box File Folder — Grey (Y5/Y6)",   category: "Folders & Files",     changeType: "auto_deduct",          quantityChange: -2,  actor: "System (Enrolment)",  timestamp: "17 Apr 2026, 10:00" },
  { id: "sl-011", itemName: "A4 Paper — White 80gsm",           category: "Paper Products",      changeType: "reorder_received",     quantityChange: 20,  actor: "Jason Daswani",       timestamp: "10 Apr 2026, 14:00" },
  { id: "sl-012", itemName: "Box File Folder — Orange (KG1)",   category: "Folders & Files",     changeType: "reorder_received",     quantityChange: 30,  actor: "Jason Daswani",       timestamp: "10 Apr 2026, 14:00" },
  { id: "sl-013", itemName: "Plastic Folder Insert — Yellow",   category: "Plastic Folders",     changeType: "reorder_received",     quantityChange: 50,  actor: "Jason Daswani",       timestamp: "10 Apr 2026, 14:00" },
  { id: "sl-014", itemName: "Whiteboard Markers — Black",       category: "Writing Instruments", changeType: "waste",                quantityChange: -1,  actor: "Sarah Thompson",      timestamp: "10 Apr 2026, 11:00" },
  { id: "sl-015", itemName: "Subject Sticker — English Primary",category: "Stickers & Labels",   changeType: "auto_deduct",          quantityChange: -2,  actor: "System (Enrolment)",  timestamp: "16 Apr 2026, 10:00" },
  { id: "sl-016", itemName: "Lanyard — Red (Y1)",               category: "Lanyards",            changeType: "reorder_received",     quantityChange: 20,  actor: "Jason Daswani",       timestamp: "10 Apr 2026, 14:00" },
  { id: "sl-017", itemName: "IMI Branded Pens",                 category: "Branded Materials",   changeType: "manual_deduct",        quantityChange: -50, actor: "Jason Daswani",       timestamp: "1 Apr 2026, 10:00" },
  { id: "sl-018", itemName: "Behaviour Rules Sticker",          category: "Stickers & Labels",   changeType: "manual_deduct",        quantityChange: -2,  actor: "Sarah Thompson",      timestamp: "10 Apr 2026, 11:00" },
  { id: "sl-019", itemName: "First Aid Kit Refill",             category: "Health & Safety",     changeType: "manual_deduct",        quantityChange: -1,  actor: "Sarah Thompson",      timestamp: "1 Apr 2026, 11:00" },
  { id: "sl-020", itemName: "A4 Paper — White 80gsm",           category: "Paper Products",      changeType: "stock_take_correction", quantityChange: 2,   actor: "Jason Daswani",      timestamp: "15 Mar 2026, 10:00" },
  { id: "sl-021", itemName: "Lanyard — Red (Y1)",               category: "Lanyards",            changeType: "auto_deduct_failed",    quantityChange: 0,   stockBefore: 0,  stockAfter: 0,  actor: "System (Enrolment)", reference: "ENR-0524",    timestamp: "15 Apr 2026, 14:22" },
  { id: "sl-022", itemName: "Tote Bag",                         category: "Bags",                changeType: "manual_add",            quantityChange: 25,  stockBefore: 3,  stockAfter: 28, actor: "Jason Daswani",      reference: "PO-2026-041", timestamp: "14 Apr 2026, 09:30" },
  { id: "sl-023", itemName: "Pens — Blue Ballpoint",            category: "Writing Instruments", changeType: "waste",                 quantityChange: -3,  stockBefore: 45, stockAfter: 42, actor: "Sarah Mitchell",     timestamp: "13 Apr 2026, 16:00" },
  { id: "sl-024", itemName: "Box File Folder — Green (Y3)",     category: "Folders & Files",     changeType: "stock_take_correction", quantityChange: 2,   stockBefore: 16, stockAfter: 18, actor: "Nadia Al-Hassan",    reference: "STKT-APR26",  timestamp: "12 Apr 2026, 10:00" },
  { id: "sl-025", itemName: "A4 Paper — White 80gsm",           category: "Paper Products",      changeType: "auto_deduct",           quantityChange: -5,  stockBefore: 200,stockAfter: 195,actor: "System (Enrolment)", reference: "ENR-0521",    timestamp: "11 Apr 2026, 08:45" },
  { id: "sl-026", itemName: "Behaviour Rules Sticker",          category: "Stickers & Labels",   changeType: "reorder_received",      quantityChange: 40,  stockBefore: 9,  stockAfter: 49, actor: "Omar Farhat",        reference: "PO-2026-039", timestamp: "9 Apr 2026, 13:00"  },
  { id: "sl-027", itemName: "First Aid Kit Refill",             category: "Health & Safety",     changeType: "manual_deduct",         quantityChange: -1,  stockBefore: 3,  stockAfter: 2,  actor: "Sarah Thompson",     timestamp: "8 Apr 2026, 11:15"  },
  { id: "sl-028", itemName: "IMI Branded Pens",                 category: "Branded Materials",   changeType: "stock_take_correction", quantityChange: -5,  stockBefore: 145,stockAfter: 140,actor: "Jason Daswani",      reference: "STKT-APR26",  timestamp: "7 Apr 2026, 15:30"  },
];
