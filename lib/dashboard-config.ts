import { type Role } from "./role-config";
import { type KpiCard } from "./mock-data";

// ─── Dashboard section IDs ────────────────────────────────────────────────────

export type DashboardSectionId =
  // Super Admin / Admin Head (full)
  | "activity-reports"
  | "churn-thresholds"
  | "charts"
  // Admin (operational)
  | "admin-activity"
  | "admin-churn-simple"
  // Academic Head
  | "academic-alerts"
  | "academic-churn"
  | "academic-activity"
  // HOD (department)
  | "hod-workload"
  | "hod-alerts"
  | "hod-upcoming"
  | "hod-approvals"
  // Teacher
  | "teacher-sessions"
  | "teacher-pending"
  | "teacher-tasks"
  // TA
  | "ta-sessions"
  | "ta-tasks"
  // HR / Finance
  | "hr-revenue"
  | "hr-invoice-status"
  | "hr-cpd";

// ─── Dashboard config ─────────────────────────────────────────────────────────

export interface DashboardConfig {
  /** Short line under greeting. Empty string = no subtitle. */
  subtitle: string;
  /** Tailwind grid-cols class for KPI row. */
  kpiGridClass: string;
  /** Role-scoped KPI cards. */
  kpis: KpiCard[];
  /** Ordered section IDs. */
  sections: DashboardSectionId[];
  /** Whether sections can be dragged to reorder. */
  draggable: boolean;
  /** Optional department label shown in header (HOD). */
  departmentLabel?: string;
}

// ─── KPI building blocks ──────────────────────────────────────────────────────
// Reference values by id so they stay consistent with kpiCards where shared.

const KPI: Record<string, KpiCard> = {
  activeStudents: {
    id: "active-students",
    label: "Active Students",
    value: "1,847",
    trend: "+12%",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "Users",
  },
  newEnrolments: {
    id: "new-enrolments",
    label: "New Enrolments",
    value: "143",
    trend: "+8%",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "UserPlus",
  },
  reEnrolments: {
    id: "re-enrolments",
    label: "Re-enrolments",
    value: "276",
    trend: "+3%",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "RefreshCw",
  },
  churn: {
    id: "churn",
    label: "Churn This Term",
    value: "31",
    trend: "-5%",
    trendDirection: "down",
    trendSentiment: "positive",
    icon: "UserMinus",
  },
  revenue: {
    id: "revenue",
    label: "Revenue This Term",
    value: "AED 284,500",
    trend: "+11%",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "TrendingUp",
  },
  collected: {
    id: "collected",
    label: "Collected This Term",
    value: "AED 241,200",
    trend: "+9%",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "Banknote",
  },
  overdue: {
    id: "overdue",
    label: "Overdue Invoices",
    value: "23",
    subValue: "AED 18,400",
    trend: "neutral",
    trendDirection: "neutral",
    trendSentiment: "warning",
    icon: "AlertCircle",
  },
  atRisk: {
    id: "at-risk",
    label: "At-Risk Students",
    value: "47",
    trend: "+4 this week",
    trendDirection: "up",
    trendSentiment: "negative",
    icon: "ShieldAlert",
  },
  concerns: {
    id: "concerns",
    label: "Open Concerns",
    value: "8",
    trend: "2 critical",
    trendDirection: "neutral",
    trendSentiment: "negative",
    icon: "MessageSquareWarning",
  },
  occupancy: {
    id: "occupancy",
    label: "Seat Occupancy",
    value: "74%",
    trend: "vs 80% target",
    trendDirection: "neutral",
    trendSentiment: "warning",
    icon: "LayoutGrid",
  },
  attendanceRate: {
    id: "attendance-rate",
    label: "Attendance Rate",
    value: "89%",
    trend: "+1.2% vs last term",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "UserCheck",
  },
  trackerBreaches: {
    id: "tracker-breaches",
    label: "Tracker Breaches",
    value: "3",
    trend: "2 new this week",
    trendDirection: "up",
    trendSentiment: "negative",
    icon: "TriangleAlert",
  },
  // HOD (department-scoped)
  deptActiveStudents: {
    id: "dept-active-students",
    label: "Dept Active Students",
    value: "312",
    trend: "+6 this month",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "Users",
  },
  deptSessionsWeek: {
    id: "dept-sessions-week",
    label: "Dept Sessions This Week",
    value: "47",
    trend: "4 awaiting cover",
    trendDirection: "neutral",
    trendSentiment: "warning",
    icon: "ClipboardList",
  },
  deptAttendanceRate: {
    id: "dept-attendance-rate",
    label: "Dept Attendance Rate",
    value: "91%",
    trend: "+0.8% vs last week",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "UserCheck",
  },
  deptConcerns: {
    id: "dept-concerns",
    label: "Dept Open Concerns",
    value: "2",
    trend: "1 new",
    trendDirection: "neutral",
    trendSentiment: "warning",
    icon: "MessageSquareWarning",
  },
  // Teacher
  myStudents: {
    id: "my-students",
    label: "My Students",
    value: "24",
    trend: "across 6 groups",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "Users",
  },
  mySessionsWeek: {
    id: "my-sessions-week",
    label: "My Sessions This Week",
    value: "12",
    trend: "2 remaining today",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "ClipboardList",
  },
  myAttendanceRate: {
    id: "my-attendance-rate",
    label: "Attendance Rate",
    value: "94%",
    trend: "+2% vs last term",
    trendDirection: "up",
    trendSentiment: "positive",
    icon: "UserCheck",
  },
  // TA
  taAssignedSessions: {
    id: "ta-assigned-sessions",
    label: "Assigned Sessions This Week",
    value: "8",
    trend: "3 remaining today",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "ClipboardList",
  },
  taAttendanceRate: {
    id: "ta-attendance-rate",
    label: "Attendance Rate",
    value: "92%",
    trend: "stable",
    trendDirection: "neutral",
    trendSentiment: "positive",
    icon: "UserCheck",
  },
  // HR/Finance
  activeStaff: {
    id: "active-staff",
    label: "Active Staff",
    value: "41",
    trend: "2 on leave",
    trendDirection: "neutral",
    trendSentiment: "warning",
    icon: "Users",
  },
  cpdCompletion: {
    id: "cpd-completion",
    label: "CPD Completion Rate",
    value: "67%",
    trend: "vs 80% target",
    trendDirection: "neutral",
    trendSentiment: "warning",
    icon: "GraduationCap",
  },
};

// ─── Role → config map ────────────────────────────────────────────────────────

const FULL: DashboardConfig = {
  subtitle: "Here's what's happening at IMI today.",
  kpiGridClass: "grid-cols-2 lg:grid-cols-5",
  kpis: [
    KPI.activeStudents,
    KPI.newEnrolments,
    KPI.reEnrolments,
    KPI.churn,
    KPI.revenue,
    KPI.collected,
    KPI.overdue,
    KPI.atRisk,
    KPI.concerns,
    KPI.occupancy,
  ],
  sections: ["activity-reports", "churn-thresholds", "charts"],
  draggable: true,
};

export const DASHBOARD_CONFIGS: Record<Role, DashboardConfig> = {
  "Super Admin": FULL,
  "Admin Head": FULL,

  Admin: {
    subtitle: "Operational overview",
    kpiGridClass: "grid-cols-2 lg:grid-cols-6",
    kpis: [
      KPI.activeStudents,
      KPI.newEnrolments,
      KPI.overdue,
      KPI.atRisk,
      KPI.concerns,
      KPI.occupancy,
    ],
    sections: ["admin-activity", "admin-churn-simple"],
    draggable: false,
  },

  "Academic Head": {
    subtitle: "Academic overview",
    kpiGridClass: "grid-cols-2 lg:grid-cols-6",
    kpis: [
      KPI.activeStudents,
      KPI.atRisk,
      KPI.concerns,
      KPI.attendanceRate,
      KPI.trackerBreaches,
      KPI.occupancy,
    ],
    sections: ["academic-alerts", "academic-churn", "academic-activity"],
    draggable: false,
  },

  HOD: {
    subtitle: "Primary Department • HOD View",
    kpiGridClass: "grid-cols-2 lg:grid-cols-4",
    kpis: [
      KPI.deptActiveStudents,
      KPI.deptSessionsWeek,
      KPI.deptAttendanceRate,
      KPI.deptConcerns,
    ],
    sections: ["hod-workload", "hod-alerts", "hod-upcoming", "hod-approvals"],
    draggable: false,
    departmentLabel: "Primary",
  },

  Teacher: {
    subtitle: "Your teaching dashboard",
    kpiGridClass: "grid-cols-1 lg:grid-cols-3",
    kpis: [KPI.myStudents, KPI.mySessionsWeek, KPI.myAttendanceRate],
    sections: ["teacher-sessions", "teacher-pending", "teacher-tasks"],
    draggable: false,
  },

  TA: {
    subtitle: "Your assigned sessions",
    kpiGridClass: "grid-cols-1 lg:grid-cols-2",
    kpis: [KPI.taAssignedSessions, KPI.taAttendanceRate],
    sections: ["ta-sessions", "ta-tasks"],
    draggable: false,
  },

  "HR/Finance": {
    subtitle: "Finance & people overview",
    kpiGridClass: "grid-cols-2 lg:grid-cols-5",
    kpis: [
      KPI.revenue,
      KPI.collected,
      KPI.overdue,
      KPI.activeStaff,
      KPI.cpdCompletion,
    ],
    sections: ["hr-revenue", "hr-invoice-status", "hr-cpd"],
    draggable: false,
  },
};

export function getDashboardConfig(role: Role): DashboardConfig {
  return DASHBOARD_CONFIGS[role] ?? FULL;
}
