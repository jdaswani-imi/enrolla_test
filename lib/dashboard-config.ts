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
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "Users",
  },
  newEnrolments: {
    id: "new-enrolments",
    label: "New Enrolments",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "UserPlus",
  },
  reEnrolments: {
    id: "re-enrolments",
    label: "Re-enrolments",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "RefreshCw",
  },
  churn: {
    id: "churn",
    label: "Churn This Term",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "UserMinus",
  },
  revenue: {
    id: "revenue",
    label: "Revenue This Term",
    value: "AED 0",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "TrendingUp",
  },
  collected: {
    id: "collected",
    label: "Collected This Term",
    value: "AED 0",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "Banknote",
  },
  overdue: {
    id: "overdue",
    label: "Overdue Invoices",
    value: "0",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "AlertCircle",
  },
  unbilledSessions: {
    id: "unbilled-sessions",
    label: "Unbilled Sessions",
    value: "0",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "TriangleAlert",
  },
  atRisk: {
    id: "at-risk",
    label: "At-Risk Students",
    value: "0",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "ShieldAlert",
  },
  concerns: {
    id: "concerns",
    label: "Open Concerns",
    value: "0",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "MessageSquareWarning",
  },
  occupancy: {
    id: "occupancy",
    label: "Seat Occupancy",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "LayoutGrid",
  },
  attendanceRate: {
    id: "attendance-rate",
    label: "Attendance Rate",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "UserCheck",
  },
  trackerBreaches: {
    id: "tracker-breaches",
    label: "Tracker Breaches",
    value: "0",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "TriangleAlert",
  },
  // HOD (department-scoped)
  deptActiveStudents: {
    id: "dept-active-students",
    label: "Dept Active Students",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "Users",
  },
  deptSessionsWeek: {
    id: "dept-sessions-week",
    label: "Dept Sessions This Week",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "ClipboardList",
  },
  deptAttendanceRate: {
    id: "dept-attendance-rate",
    label: "Dept Attendance Rate",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "UserCheck",
  },
  deptConcerns: {
    id: "dept-concerns",
    label: "Dept Open Concerns",
    value: "0",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "MessageSquareWarning",
  },
  // Teacher
  myStudents: {
    id: "my-students",
    label: "My Students",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "Users",
  },
  mySessionsWeek: {
    id: "my-sessions-week",
    label: "My Sessions This Week",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "ClipboardList",
  },
  myAttendanceRate: {
    id: "my-attendance-rate",
    label: "Attendance Rate",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "UserCheck",
  },
  // TA
  taAssignedSessions: {
    id: "ta-assigned-sessions",
    label: "Assigned Sessions This Week",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "ClipboardList",
  },
  taAttendanceRate: {
    id: "ta-attendance-rate",
    label: "Attendance Rate",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "UserCheck",
  },
  // HR/Finance
  activeStaff: {
    id: "active-staff",
    label: "Active Staff",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
    icon: "Users",
  },
  cpdCompletion: {
    id: "cpd-completion",
    label: "CPD Completion Rate",
    value: "—",
    trend: "—",
    trendDirection: "neutral",
    trendSentiment: "neutral",
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
    KPI.unbilledSessions,
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
      KPI.unbilledSessions,
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
      KPI.unbilledSessions,
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
