"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  RefreshCw,
  UserMinus,
  TrendingUp,
  Banknote,
  AlertCircle,
  ShieldAlert,
  MessageSquareWarning,
  LayoutGrid,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  UserCheck,
  CreditCard,
  TriangleAlert,
  FileText,
  FlaskConical,
  ClipboardCheck,
  MessageCircle,
  UserX,
  CheckSquare,
  BarChart2,
  ClipboardList,
  GraduationCap,
  ExternalLink,
  Clock,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { ChurnDetailModal } from "@/components/dashboard/churn-detail-modal";
import { OccupancyDetailModal } from "@/components/dashboard/occupancy-detail-modal";
import { SkeletonKpi, SkeletonTable, SkeletonCard } from "@/components/ui/skeleton-loader";
import {
  churnRiskStudents,
  operationalThresholds,
  revenueData,
  occupancyHeatmap,
  activityFeed,
  reportsInbox,
  teacherTodaySessions,
  taTodaySessions,
  teacherPendingActions,
  teacherTopTasks,
  taTopTasks,
  hodTeacherWorkload,
  hodAcademicAlerts,
  academicAlerts,
  hodUpcomingSessions,
  hodPendingApprovals,
  invoiceStatusBreakdown,
  staffCpdProgress,
  type KpiCard,
  type ChurnRiskStudent,
  type OperationalThreshold,
  type ActivityEvent,
  type ReportItem,
  type DashboardSessionRow,
  type DashboardTaskRow,
  type AcademicAlertRow,
} from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { getDashboardConfig, type DashboardSectionId } from "@/lib/dashboard-config";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Users,
  UserPlus,
  RefreshCw,
  UserMinus,
  TrendingUp,
  Banknote,
  AlertCircle,
  ShieldAlert,
  MessageSquareWarning,
  LayoutGrid,
  BarChart2,
  ClipboardList,
  GraduationCap,
  UserCheck,
  TriangleAlert,
};

// ─── KPI Link map ─────────────────────────────────────────────────────────────

const KPI_LINKS: Record<string, string> = {
  "active-students": "/students",
  "new-enrolments":  "/enrolment",
  "re-enrolments":   "/enrolment",
  churn:     "/analytics?tab=churn",
  revenue:   "/analytics?tab=revenue",
  collected: "/analytics?tab=revenue",
  overdue:   "/finance",
  "at-risk": "/analytics?tab=churn",
  concerns:  "/progress?tab=alerts",
  occupancy: "/analytics?tab=occupancy",
  "attendance-rate": "/attendance",
  "tracker-breaches": "/progress?tab=alerts",
  "my-sessions-week": "/timetable",
  "my-students": "/students",
  "my-attendance-rate": "/attendance",
  "ta-assigned-sessions": "/timetable",
  "ta-attendance-rate": "/attendance",
  "dept-sessions-week": "/timetable",
  "dept-concerns": "/progress?tab=alerts",
  "active-staff": "/staff",
  "cpd-completion": "/staff",
};


const ACTIVITY_ICON_MAP: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  enrolment:      { icon: UserPlus,       color: "text-emerald-600", bg: "bg-emerald-50" },
  payment:        { icon: CreditCard,     color: "text-blue-600",    bg: "bg-blue-50" },
  concern:        { icon: TriangleAlert,  color: "text-red-600",     bg: "bg-red-50" },
  invoice:        { icon: FileText,       color: "text-amber-600",   bg: "bg-amber-50" },
  trial:          { icon: FlaskConical,   color: "text-emerald-600", bg: "bg-emerald-50" },
  assessment:     { icon: ClipboardCheck, color: "text-slate-500",   bg: "bg-slate-100" },
  lead:           { icon: MessageCircle,  color: "text-emerald-600", bg: "bg-emerald-50" },
  staff:          { icon: UserX,          color: "text-red-600",     bg: "bg-red-50" },
  task:           { icon: CheckSquare,    color: "text-amber-600",   bg: "bg-amber-50" },
  report:         { icon: BarChart2,      color: "text-slate-500",   bg: "bg-slate-100" },
  "re-enrolment": { icon: UserCheck,     color: "text-blue-600",    bg: "bg-blue-50" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAED(value: number): string {
  return `AED ${(value / 1000).toFixed(0)}k`;
}

function getChurnBadge(level: ChurnRiskStudent["churnLevel"]) {
  switch (level) {
    case "Critical": return "bg-red-600 text-white";
    case "High":     return "bg-red-500 text-white";
    case "Medium":   return "bg-amber-400 text-amber-950";
    case "Low":      return "bg-emerald-100 text-emerald-800";
  }
}

function getOccupancyColor(pct: number): string {
  if (pct === 0) return "bg-slate-100 text-slate-700";
  if (pct < 50)  return "bg-green-100 text-slate-700";
  if (pct < 70)  return "bg-green-300 text-slate-700";
  if (pct < 85)  return "bg-green-500 text-slate-700";
  return "bg-green-700 text-white";
}

function getThresholdPill(status: OperationalThreshold["status"]) {
  switch (status) {
    case "ok":       return "bg-emerald-100 text-emerald-700";
    case "warning":  return "bg-amber-100 text-amber-700";
    case "critical": return "bg-red-100 text-red-700";
  }
}

function getWorkloadDot(level: "Low" | "Moderate" | "High") {
  switch (level) {
    case "Low":      return "bg-emerald-500";
    case "Moderate": return "bg-amber-400";
    case "High":     return "bg-red-500";
  }
}

function getPriorityBadge(p: DashboardTaskRow["priority"]) {
  switch (p) {
    case "High":   return "bg-red-100 text-red-700";
    case "Medium": return "bg-amber-100 text-amber-700";
    case "Low":    return "bg-slate-100 text-slate-600";
  }
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400 mb-3">
      {children}
    </p>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-lg border border-slate-200 shadow-sm p-5", className)}>
      {children}
    </div>
  );
}

// ─── Greeting & Live Clock ────────────────────────────────────────────────────

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes  = time.getMinutes().toString().padStart(2, "0");
  const seconds  = time.getSeconds().toString().padStart(2, "0");
  const ampm     = time.getHours() >= 12 ? "PM" : "AM";
  const hours12  = (time.getHours() % 12 || 12).toString().padStart(2, "0");

  const minutesLeft    = 59 - time.getMinutes();
  const secondsLeft    = 59 - time.getSeconds();
  const countdownLabel = `${minutesLeft}m ${secondsLeft}s to next hour`;

  const hourProgress      = (time.getMinutes() * 60 + time.getSeconds()) / 3600;
  const circumference     = 2 * Math.PI * 20;
  const strokeDashoffset  = circumference * (1 - hourProgress);

  return (
    <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
      <div className="relative w-12 h-12">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#F1F5F9" strokeWidth="3" />
          <circle
            cx="24" cy="24" r="20"
            fill="none"
            stroke="#F59E0B"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-bold text-slate-600">{hours12}:{minutes}</span>
        </div>
      </div>
      <div>
        <div className="text-xl font-bold text-slate-900 tabular-nums leading-none">
          {hours12}:{minutes}:{seconds}
          <span className="text-sm font-normal text-slate-400 ml-1">{ampm}</span>
        </div>
        <div className="text-xs text-slate-400 mt-0.5">{countdownLabel}</div>
      </div>
    </div>
  );
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function KpiCardItem({ card }: { card: KpiCard }) {
  const IconComponent = ICON_MAP[card.icon] ?? AlertCircle;
  const href = KPI_LINKS[card.id];

  const trendColor =
    card.trendSentiment === "positive" ? "text-emerald-600"
    : card.trendSentiment === "negative" ? "text-red-500"
    : card.trendSentiment === "warning"  ? "text-amber-500"
    : "text-slate-400";

  const TrendIcon =
    card.trendDirection === "up"   ? ArrowUpRight
    : card.trendDirection === "down" ? ArrowDownRight
    : Minus;

  const inner = (
    <Card className={cn(
      "flex flex-col justify-between h-[140px] w-full transition-all duration-200",
      href && "cursor-pointer hover:shadow-md hover:border-amber-200 hover:-translate-y-px"
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500 leading-tight">{card.label}</p>
        <IconComponent className="w-4 h-4 text-amber-500 shrink-0" />
      </div>

      <p className={cn("font-bold text-slate-900 leading-none truncate", String(card.value).length > 10 ? "text-[1.35rem]" : "text-2xl")}>
        {card.value}
      </p>

      <div className="text-xs">
        {card.subValue && (
          <p className={cn("font-medium mb-0.5", trendColor)}>{card.subValue}</p>
        )}
        {card.trendDirection !== "neutral" ? (
          <span className={cn("flex items-center gap-0.5 font-medium", trendColor)}>
            <TrendIcon className="w-3.5 h-3.5" />
            {card.trend}
          </span>
        ) : (
          <span className={cn("font-medium", trendColor)}>{card.trend}</span>
        )}
      </div>
    </Card>
  );

  if (href) return <Link href={href} className="flex flex-col h-[140px] w-full">{inner}</Link>;
  return inner;
}

// ─── Churn Risk Table ─────────────────────────────────────────────────────────

function ChurnRiskTable({ simple = false }: { simple?: boolean }) {
  const [selectedChurnStudent, setSelectedChurnStudent] = useState<ChurnRiskStudent | null>(null);

  return (
    <>
      <Card className="flex flex-col">
        <SectionLabel>Churn Risk</SectionLabel>
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Student</th>
                <th className="text-left py-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Yr / Dept</th>
                <th className="text-left py-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Score</th>
                {!simple && (
                  <>
                    <th className="text-left py-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Signal</th>
                    <th className="text-left py-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Last Contact</th>
                  </>
                )}
                <th className="py-2 px-1" />
              </tr>
            </thead>
            <tbody>
              {churnRiskStudents.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-slate-50 hover:bg-amber-50/40 transition-colors cursor-pointer"
                  onClick={() => setSelectedChurnStudent(s)}
                >
                  <td className="py-2.5 px-1 font-medium text-slate-800">{s.name}</td>
                  <td className="py-2.5 px-1 text-slate-500">
                    <span className="font-medium">{s.yearGroup}</span>{" "}
                    <span className="text-slate-400 text-xs">{s.department}</span>
                  </td>
                  <td className="py-2.5 px-1">
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold", getChurnBadge(s.churnLevel))}>
                      {s.churnScore} {s.churnLevel}
                    </span>
                  </td>
                  {!simple && (
                    <>
                      <td className="py-2.5 px-1 text-slate-500 text-xs hidden md:table-cell">{s.topSignal}</td>
                      <td className="py-2.5 px-1 text-slate-400 text-xs hidden lg:table-cell">{s.daysSinceContact}d ago</td>
                    </>
                  )}
                  <td className="py-2.5 px-1" onClick={(e) => e.stopPropagation()}>
                    <Link href={`/students/${s.studentId}`} className="text-xs text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap transition-colors">
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ChurnDetailModal
        student={selectedChurnStudent}
        open={selectedChurnStudent !== null}
        onClose={() => setSelectedChurnStudent(null)}
      />
    </>
  );
}

// ─── Operational Thresholds ───────────────────────────────────────────────────

function OperationalThresholdStrip() {
  return (
    <Card className="flex flex-col gap-3">
      <SectionLabel>Operational Thresholds</SectionLabel>
      <div className="flex flex-col gap-2">
        {operationalThresholds.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{t.metric}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-600">{t.current}</span>
                {" · "}
                {t.target}
              </p>
            </div>
            <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap", getThresholdPill(t.status))}>
              {t.statusLabel}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────

function RevenueChart() {
  return (
    <Card>
      <SectionLabel>Revenue Trend</SectionLabel>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={revenueData} barGap={4} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => formatAED(v)} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} width={52} />
          <Tooltip
            formatter={(value) => [`AED ${Number(value).toLocaleString()}`, ""]}
            contentStyle={{ borderRadius: 8, border: "1px solid #E2E8F0", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }}
          />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
          <Bar dataKey="invoiced"  name="Invoiced"  fill="#F59E0B" radius={[3, 3, 0, 0]} />
          <Bar dataKey="collected" name="Collected" fill="#14B8A6" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ─── Occupancy Heatmap ────────────────────────────────────────────────────────

const DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TIMES = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "20:30"];

function OccupancyHeatmap() {
  const [selected, setSelected] = useState<{ day: string; time: string } | null>(null);
  const lookup = new Map(occupancyHeatmap.map((c) => [`${c.day}|${c.time}`, c.occupancy]));

  return (
    <Card>
      <SectionLabel>Seat Occupancy Heatmap</SectionLabel>
      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          <div className="grid grid-cols-[52px_repeat(5,1fr)] gap-1 mb-1">
            <div />
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{d}</div>
            ))}
          </div>
          {TIMES.map((time) => (
            <div key={time} className="grid grid-cols-[52px_repeat(5,1fr)] gap-1 mb-1">
              <div className="flex items-center text-[11px] text-slate-400 font-medium pr-1">{time}</div>
              {DAYS.map((day) => {
                const pct = lookup.get(`${day}|${time}`) ?? 0;
                return (
                  <div
                    key={day}
                    role="button"
                    tabIndex={0}
                    title={`${day} ${time}: ${pct}% — click for room detail`}
                    onClick={() => setSelected({ day, time })}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelected({ day, time }); }}
                    className={cn(
                      "rounded h-8 flex items-center justify-center text-[10px] font-semibold",
                      "cursor-pointer transition-all duration-150",
                      "hover:ring-2 hover:ring-amber-400 hover:ring-offset-1 hover:brightness-95",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
                      getOccupancyColor(pct),
                    )}
                  >
                    {pct}%
                  </div>
                );
              })}
            </div>
          ))}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {[
              { label: "Empty",    className: "bg-slate-100" },
              { label: "Low",      className: "bg-green-100" },
              { label: "Moderate", className: "bg-green-300" },
              { label: "Good",     className: "bg-green-500" },
              { label: "Full",     className: "bg-green-700" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={cn("w-3 h-3 rounded", l.className)} />
                <span className="text-[10px] text-slate-400">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <OccupancyDetailModal
        day={selected?.day ?? null}
        time={selected?.time ?? null}
        open={selected !== null}
        onClose={() => setSelected(null)}
      />
    </Card>
  );
}

// ─── Activity Feed ────────────────────────────────────────────────────────────

const ACADEMIC_ACTIVITY_TYPES = new Set(["concern", "assessment", "re-enrolment", "enrolment"]);

function ActivityFeedPanel({ filter }: { filter?: "academic" }) {
  const events = filter === "academic"
    ? activityFeed.filter((e) => ACADEMIC_ACTIVITY_TYPES.has(e.type))
    : activityFeed;

  return (
    <Card className="flex flex-col">
      <SectionLabel>{filter === "academic" ? "Academic Activity" : "Live Activity"}</SectionLabel>
      <div className="flex flex-col divide-y divide-slate-50">
        {events.map((event: ActivityEvent) => {
          const meta   = ACTIVITY_ICON_MAP[event.type] ?? ACTIVITY_ICON_MAP["report"];
          const IconEl = meta.icon;
          const byLine = event.actionedBy === "system"
            ? "by System · Automated"
            : `by ${event.actionedBy.name} · ${event.actionedBy.role}`;
          return (
            <Link key={event.id} href={event.link} className="flex items-start gap-3 py-2.5 hover:bg-slate-50 -mx-1 px-1 rounded transition-colors cursor-pointer">
              <div className={cn("mt-0.5 rounded-md p-1.5 shrink-0", meta.bg)}>
                <IconEl className={cn("w-3.5 h-3.5", meta.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 leading-snug">{event.description}</p>
                <p className="text-xs text-slate-400 mt-0.5">{byLine}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap mt-0.5">{event.timeAgo}</span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Reports Inbox ────────────────────────────────────────────────────────────

const REPORT_ICON_MAP: Record<string, React.ElementType> = {
  BarChart2,
  ClipboardList,
  Banknote,
  GraduationCap,
  Users,
};

const REPORT_FORMAT_MAP: Record<string, "PDF" | "CSV"> = {
  "Weekly Digest":             "PDF",
  "Churn Risk Report":         "PDF",
  "Term Revenue Summary":      "CSV",
  "Academic Alerts Summary":   "PDF",
  "Staff Attendance Report":   "CSV",
};

function ReportDialog({ report, onClose }: { report: ReportItem; onClose: () => void }) {
  const format = REPORT_FORMAT_MAP[report.title] ?? "PDF";

  function handleDownload() {
    toast.success(`Downloading ${report.title}...`);
    onClose();
  }

  function renderBody() {
    switch (report.title) {
      case "Weekly Digest":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total invoiced this week", value: "AED 18,400" },
                { label: "Sessions this week",       value: "47" },
                { label: "New enrolments",           value: "3" },
              ].map((k) => (
                <div key={k.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{k.label}</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">{k.value}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Activity highlights</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                <li>Aisha Rahman flagged as high churn risk after missing 3 sessions</li>
                <li>2 invoices overdue by more than 14 days (AED 3,200 total)</li>
                <li>Year 10 Physics averaged 82% on weekly quiz — above threshold</li>
                <li>Trial booked for 4 new leads via Dubai Marina campaign</li>
                <li>1 concern raised by parent regarding Y9 Math pace</li>
              </ul>
            </div>
          </div>
        );

      case "Churn Risk Report":
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">18 students</span> at high churn risk this term.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Year</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Signal</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Session</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Aisha Rahman",   year: "Y8",  score: 84, signal: "Missed 3+ sessions",  days: 12 },
                    { name: "Omar Khalid",    year: "Y10", score: 79, signal: "Declining grades",     days: 8  },
                    { name: "Fatima Hassan",  year: "Y9",  score: 76, signal: "Attendance dropping",  days: 6  },
                    { name: "Yusuf Ahmad",    year: "Y7",  score: 72, signal: "Parent complaint",     days: 4  },
                    { name: "Layla Mansour",  year: "Y11", score: 68, signal: "Invoice overdue",      days: 10 },
                  ].map((s) => (
                    <tr key={s.name} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-slate-800">{s.name}</td>
                      <td className="py-2 text-slate-500">{s.year}</td>
                      <td className="py-2"><span className="inline-flex rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">{s.score}</span></td>
                      <td className="py-2 text-slate-500 text-xs">{s.signal}</td>
                      <td className="py-2 text-slate-400 text-xs">{s.days}d ago</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "Term Revenue Summary": {
        const collected   = 241200;
        const outstanding = 43300;
        const total       = collected + outstanding;
        const collectedPct = (collected / total) * 100;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total",       value: "AED 284,500" },
                { label: "Collected",   value: "AED 241,200" },
                { label: "Outstanding", value: "AED 43,300" },
              ].map((k) => (
                <div key={k.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{k.label}</p>
                  <p className="text-lg font-bold text-slate-900 mt-1">{k.value}</p>
                </div>
              ))}
            </div>
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Collected vs Outstanding</span>
                <span className="tabular-nums">{Math.round(collectedPct)}% collected</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-slate-100">
                <div className="bg-emerald-500" style={{ width: `${collectedPct}%` }} />
                <div className="bg-amber-400"   style={{ width: `${100 - collectedPct}%` }} />
              </div>
            </div>
          </div>
        );
      }

      case "Academic Alerts Summary":
        return (
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              <span className="font-semibold">8 students</span> below pass threshold this week.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Score</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tier</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Omar Khalid",   subj: "Mathematics", avg: "42%", tier: "Amber" },
                    { name: "Fatima Hassan", subj: "Physics",     avg: "38%", tier: "Red"   },
                    { name: "Yusuf Ahmad",   subj: "English",     avg: "44%", tier: "Amber" },
                    { name: "Noor Saleh",    subj: "Chemistry",   avg: "36%", tier: "Red"   },
                  ].map((r) => (
                    <tr key={r.name} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-slate-800">{r.name}</td>
                      <td className="py-2 text-slate-500">{r.subj}</td>
                      <td className="py-2 text-slate-700 tabular-nums">{r.avg}</td>
                      <td className="py-2">
                        <span className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-semibold",
                          r.tier === "Red" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {r.tier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "Staff Attendance Report":
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-700">
              <span><span className="font-semibold">Present</span> 38/41</span>
              <span className="text-slate-300">·</span>
              <span><span className="font-semibold">On Leave</span> 1</span>
              <span className="text-slate-300">·</span>
              <span><span className="font-semibold">Absent</span> 2</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Staff Name</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sessions</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Attended</th>
                    <th className="text-left py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Sarah Al Maktoum",  sessions: 22, attended: 22, rate: "100%" },
                    { name: "David Chen",        sessions: 18, attended: 17, rate: "94%"  },
                    { name: "Priya Sharma",      sessions: 20, attended: 19, rate: "95%"  },
                    { name: "Ahmed Al Farsi",    sessions: 16, attended: 14, rate: "88%"  },
                  ].map((r) => (
                    <tr key={r.name} className="border-b border-slate-50">
                      <td className="py-2 font-medium text-slate-800">{r.name}</td>
                      <td className="py-2 text-slate-700 tabular-nums">{r.sessions}</td>
                      <td className="py-2 text-slate-700 tabular-nums">{r.attended}</td>
                      <td className="py-2 text-slate-700 tabular-nums">{r.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-slate-500">Report preview unavailable.</p>;
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>{report.title}</DialogTitle>
            <span className={cn(
              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              format === "PDF" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
            )}>
              {format}
            </span>
          </div>
          <DialogDescription>{report.date}</DialogDescription>
        </DialogHeader>
        <div className="p-6">{renderBody()}</div>
        <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 p-4 rounded-b-xl flex items-center justify-end gap-2">
          <DialogClose className="px-4 py-2 bg-white border border-slate-200 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            Close
          </DialogClose>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Download {format}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportsInboxPanel() {
  const [openReport, setOpenReport] = useState<ReportItem | null>(null);

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Reports Inbox</SectionLabel>
        <Link href="/reports" className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors -mt-3">
          View All
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-slate-50">
        {reportsInbox.map((report: ReportItem) => {
          const IconEl = REPORT_ICON_MAP[report.icon] ?? BarChart2;
          return (
            <div key={report.id} className="flex items-center gap-3 py-3 -mx-1 px-1">
              <div className="rounded-md bg-slate-100 p-2 shrink-0">
                <IconEl className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {!report.read && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />}
                  <p className={cn("text-sm truncate", report.read ? "text-slate-500" : "text-slate-800 font-medium")}>
                    {report.title}
                  </p>
                </div>
                {report.periodLabel && (
                  <p className="text-xs text-slate-400 mt-0.5">{report.periodLabel}</p>
                )}
                <p className="text-xs text-slate-400 mt-0.5">{report.date}</p>
              </div>
              <button
                onClick={() => setOpenReport(report)}
                className="shrink-0 text-xs font-medium text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-300 rounded px-2.5 py-1 transition-colors cursor-pointer"
              >
                Open
              </button>
            </div>
          );
        })}
      </div>
      {openReport && <ReportDialog report={openReport} onClose={() => setOpenReport(null)} />}
    </Card>
  );
}

// ─── Today's Sessions ─────────────────────────────────────────────────────────

function TodaySessionsPanel({ sessions, readOnly = false }: { sessions: DashboardSessionRow[]; readOnly?: boolean }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>{readOnly ? "Today's Sessions (read-only)" : "Today's Sessions"}</SectionLabel>
        <Link href="/timetable" className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors -mt-3">
          View full timetable
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-slate-50">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center gap-3 py-3">
            <div className="rounded-md bg-amber-50 p-2 shrink-0">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-semibold text-slate-800">{s.time}</span>
                <span className="text-sm text-slate-700 truncate">{s.subject}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{s.room} · {s.studentCount} students — {s.students}</p>
            </div>
            {!readOnly && (
              <Link href="/attendance" className="shrink-0 text-xs font-medium text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-300 rounded px-2.5 py-1 transition-colors cursor-pointer">
                Mark
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Pending Actions (Teacher) ────────────────────────────────────────────────

function PendingActionsPanel() {
  return (
    <Card className="flex flex-col">
      <SectionLabel>Pending Actions</SectionLabel>
      <div className="flex flex-col divide-y divide-slate-50">
        {teacherPendingActions.map((a) => {
          const color =
            a.severity === "critical" ? "text-red-600 bg-red-50"
            : a.severity === "warning"  ? "text-amber-600 bg-amber-50"
            : "text-emerald-600 bg-emerald-50";
          const Icon = a.count === 0 ? CheckCircle2 : AlertCircle;
          return (
            <Link key={a.id} href={a.href} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-1 px-1 rounded transition-colors cursor-pointer">
              <div className={cn("rounded-md p-2 shrink-0", color.split(" ")[1])}>
                <Icon className={cn("w-4 h-4", color.split(" ")[0])} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 truncate">{a.label}</p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums", color)}>
                {a.count}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

// ─── My Tasks panel ───────────────────────────────────────────────────────────

function MyTasksPanel({ tasks, label = "My Tasks" }: { tasks: DashboardTaskRow[]; label?: string }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>{label}</SectionLabel>
        <Link href="/tasks" className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors -mt-3">
          View all
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-slate-50">
        {tasks.map((t) => (
          <Link key={t.id} href={t.href} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-1 px-1 rounded transition-colors cursor-pointer">
            <CheckSquare className="w-4 h-4 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-800 truncate">{t.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">Due {t.dueLabel}</p>
            </div>
            <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold", getPriorityBadge(t.priority))}>
              {t.priority}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

// ─── HOD — Teacher Workload ───────────────────────────────────────────────────

function TeacherWorkloadPanel() {
  return (
    <Card className="flex flex-col">
      <SectionLabel>Teacher Workload (Primary)</SectionLabel>
      <div className="flex flex-col divide-y divide-slate-50">
        {hodTeacherWorkload.map((t) => (
          <div key={t.id} className="flex items-center gap-3 py-3">
            <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", getWorkloadDot(t.level))} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{t.name}</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{t.subjects}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-slate-800 tabular-nums">{t.sessionsThisWeek}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">sessions</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Academic Alerts ──────────────────────────────────────────────────────────

function AcademicAlertsPanel({ alerts, label = "Academic Alerts" }: { alerts: AcademicAlertRow[]; label?: string }) {
  return (
    <Card className="flex flex-col">
      <SectionLabel>{label}</SectionLabel>
      {alerts.length === 0 ? (
        <p className="text-sm text-slate-400 py-4">No active alerts.</p>
      ) : (
        <div className="flex flex-col divide-y divide-slate-50">
          {alerts.map((a) => (
            <Link key={a.id} href={a.href} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-1 px-1 rounded transition-colors cursor-pointer">
              <div className="rounded-md bg-red-50 p-2 shrink-0">
                <TriangleAlert className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{a.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{a.student} · {a.subject}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">
                  {a.level}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">{a.opened}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

// ─── HOD — Upcoming Sessions ──────────────────────────────────────────────────

function UpcomingSessionsPanel() {
  const byDay = hodUpcomingSessions.reduce<Record<string, typeof hodUpcomingSessions>>((acc, s) => {
    (acc[s.day] ??= []).push(s);
    return acc;
  }, {});

  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Upcoming Sessions · This Week</SectionLabel>
        <Link href="/timetable" className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors -mt-3">
          View timetable
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {Object.entries(byDay).map(([day, rows]) => (
          <div key={day}>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{day}</p>
            <div className="flex flex-col gap-1.5">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center gap-3 text-sm rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700 tabular-nums shrink-0">{r.time}</span>
                  <span className="text-slate-700 truncate flex-1">{r.subject}</span>
                  <span className="text-xs text-slate-400 truncate hidden md:inline">{r.teacher} · {r.room}</span>
                  <span className="text-xs text-slate-400 tabular-nums shrink-0">{r.students}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── HOD — Pending Approvals ──────────────────────────────────────────────────

function PendingApprovalsPanel() {
  return (
    <Card className="flex flex-col">
      <SectionLabel>Pending Approvals</SectionLabel>
      <div className="flex flex-col divide-y divide-slate-50">
        {hodPendingApprovals.map((a) => (
          <Link key={a.id} href={a.href} className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-1 px-1 rounded transition-colors cursor-pointer">
            <ClipboardCheck className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="flex-1 text-sm text-slate-800 truncate">{a.label}</p>
            <span className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums",
              a.count > 0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
            )}>
              {a.count}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

// ─── HR/Finance — Invoice Status breakdown ───────────────────────────────────

function InvoiceStatusPanel() {
  const total = invoiceStatusBreakdown.reduce((sum, s) => sum + s.count, 0);
  return (
    <Card className="flex flex-col">
      <SectionLabel>Invoice Status Breakdown</SectionLabel>
      <div className="flex gap-0.5 rounded-full overflow-hidden h-2.5 bg-slate-100 mb-4">
        {invoiceStatusBreakdown.map((s) => (
          <div
            key={s.label}
            className={s.color}
            style={{ width: `${(s.count / total) * 100}%` }}
            title={`${s.label}: ${s.count}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {invoiceStatusBreakdown.map((s) => (
          <div key={s.label} className="flex items-start gap-2.5">
            <span className={cn("w-2.5 h-2.5 rounded-full shrink-0 mt-1.5", s.color)} />
            <div className="min-w-0">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-semibold text-slate-800 tabular-nums">{s.count}</span>
                <span className="text-xs text-slate-500">{s.label}</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 tabular-nums">{s.amount}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── HR/Finance — Staff CPD Progress ──────────────────────────────────────────

function StaffCpdPanel() {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Staff CPD Progress</SectionLabel>
        <Link href="/staff" className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors -mt-3">
          View staff
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex flex-col gap-2.5">
        {staffCpdProgress.map((s) => {
          const pct = Math.min(100, Math.round((s.cpdHours / s.cpdTarget) * 100));
          const barColor = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500";
          return (
            <div key={s.id}>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-slate-800 truncate">{s.name}</span>
                  <span className="text-slate-400 ml-1.5">· {s.role}</span>
                </div>
                <span className="text-slate-500 tabular-nums shrink-0 ml-2">{s.cpdHours}/{s.cpdTarget}h</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={cn("h-full rounded-full", barColor)} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Section renderer ─────────────────────────────────────────────────────────

function renderSection(id: DashboardSectionId): { label: string; node: React.ReactNode } {
  switch (id) {
    case "activity-reports":
      return {
        label: "Live Activity & Reports",
        node: (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3"><ActivityFeedPanel /></div>
            <div className="lg:col-span-2"><ReportsInboxPanel /></div>
          </div>
        ),
      };
    case "churn-thresholds":
      return {
        label: "Churn Risk & Thresholds",
        node: (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3"><ChurnRiskTable /></div>
            <div className="lg:col-span-2"><OperationalThresholdStrip /></div>
          </div>
        ),
      };
    case "charts":
      return {
        label: "Revenue & Occupancy",
        node: (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RevenueChart />
            <OccupancyHeatmap />
          </div>
        ),
      };
    case "admin-activity":
      return {
        label: "Live Activity & Reports",
        node: (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3"><ActivityFeedPanel /></div>
            <div className="lg:col-span-2"><ReportsInboxPanel /></div>
          </div>
        ),
      };
    case "admin-churn-simple":
      return {
        label: "Churn Risk",
        node: <ChurnRiskTable simple />,
      };
    case "academic-alerts":
      return {
        label: "Academic Alerts",
        node: <AcademicAlertsPanel alerts={academicAlerts} />,
      };
    case "academic-churn":
      return {
        label: "Churn Risk · Academic Signals",
        node: <ChurnRiskTable />,
      };
    case "academic-activity":
      return {
        label: "Academic Activity",
        node: <ActivityFeedPanel filter="academic" />,
      };
    case "hod-workload":
      return {
        label: "Teacher Workload",
        node: (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TeacherWorkloadPanel />
            <AcademicAlertsPanel alerts={hodAcademicAlerts} label="Academic Alerts · Primary" />
          </div>
        ),
      };
    case "hod-alerts":
      return { label: "", node: null };
    case "hod-upcoming":
      return {
        label: "Upcoming Sessions",
        node: (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><UpcomingSessionsPanel /></div>
            <PendingApprovalsPanel />
          </div>
        ),
      };
    case "hod-approvals":
      return { label: "", node: null };
    case "teacher-sessions":
      return {
        label: "Today",
        node: (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TodaySessionsPanel sessions={teacherTodaySessions} />
            <PendingActionsPanel />
          </div>
        ),
      };
    case "teacher-pending":
      return { label: "", node: null };
    case "teacher-tasks":
      return { label: "My Tasks", node: <MyTasksPanel tasks={teacherTopTasks} /> };
    case "ta-sessions":
      return {
        label: "Today's Sessions",
        node: <TodaySessionsPanel sessions={taTodaySessions} readOnly />,
      };
    case "ta-tasks":
      return { label: "My Tasks", node: <MyTasksPanel tasks={taTopTasks} /> };
    case "hr-revenue":
      return { label: "Revenue", node: <RevenueChart /> };
    case "hr-invoice-status":
      return {
        label: "Invoices",
        node: (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <InvoiceStatusPanel />
            <OperationalThresholdStrip />
          </div>
        ),
      };
    case "hr-cpd":
      return { label: "Staff CPD", node: <StaffCpdPanel /> };
  }
}

// ─── Drag handle ──────────────────────────────────────────────────────────────

function DragHandle({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex flex-col gap-0.5 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-slate-100" title="Drag to reorder">
        {[0, 1, 2].map((row) => (
          <div key={row} className="flex gap-0.5">
            <div className="w-1 h-1 rounded-full bg-slate-300" />
            <div className="w-1 h-1 rounded-full bg-slate-300" />
          </div>
        ))}
      </div>
      <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}

// ─── Draggable sections (Super Admin / Admin Head only) ───────────────────────

interface DraggableSection {
  id: string;
  label: string;
  node: React.ReactNode;
}

function DraggableSections({ initial }: { initial: DraggableSection[] }) {
  const [sections, setSections] = useState<DraggableSection[]>(initial);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  useEffect(() => {
    setSections(initial);
  }, [initial]);

  function handleDrop(targetId: string) {
    if (!dragging || dragging === targetId) {
      setDragging(null);
      setDragOver(null);
      return;
    }
    const from = sections.findIndex((s) => s.id === dragging);
    const to   = sections.findIndex((s) => s.id === targetId);
    const reordered = [...sections];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    setSections(reordered);
    setDragging(null);
    setDragOver(null);
  }

  return (
    <>
      {sections.map((section) => (
        <div
          key={section.id}
          draggable
          onDragStart={() => setDragging(section.id)}
          onDragOver={(e) => { e.preventDefault(); setDragOver(section.id); }}
          onDrop={() => handleDrop(section.id)}
          onDragEnd={() => { setDragging(null); setDragOver(null); }}
          className={cn(
            "transition-all duration-200",
            dragOver === section.id && dragging !== section.id
              ? "ring-2 ring-amber-400 ring-offset-2 rounded-xl"
              : "",
            dragging === section.id ? "opacity-50" : "opacity-100"
          )}
        >
          <DragHandle label={section.label} />
          {section.node}
        </div>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { role } = useRole();
  const config = getDashboardConfig(role);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        <div className={cn("grid gap-4", config.kpiGridClass)}>
          {Array.from({ length: config.kpis.length }).map((_, i) => <SkeletonKpi key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3"><SkeletonTable rows={6} columns={5} /></div>
          <div className="lg:col-span-2 flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  const rendered = config.sections
    .map((id) => ({ id, ...renderSection(id) }))
    .filter((s) => s.node !== null);

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      {/* Welcome banner */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, Jason 👋
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {config.subtitle}
          </p>
        </div>
        <LiveClock />
      </div>

      {/* KPI Cards */}
      <div className={cn("grid gap-4", config.kpiGridClass)}>
        {config.kpis
          .filter((card) => {
            if (role !== "Teacher" && role !== "TA") return true;
            // Teacher/TA: hide all financial and management KPIs.
            // Only Today's Sessions, Attendance Rate, Open Concerns, Active Students.
            return (
              card.id === "my-sessions-week" ||
              card.id === "ta-assigned-sessions" ||
              card.id === "my-attendance-rate" ||
              card.id === "ta-attendance-rate" ||
              card.id === "attendance-rate" ||
              card.id === "concerns" ||
              card.id === "active-students" ||
              card.id === "my-students"
            );
          })
          .map((card) => (
            <KpiCardItem key={card.id} card={card} />
          ))}
      </div>

      {/* Sections */}
      {config.draggable ? (
        <DraggableSections
          initial={rendered.map((s) => ({ id: s.id, label: s.label, node: s.node }))}
        />
      ) : (
        rendered.map((s) => (
          <div key={s.id}>
            {s.label && (
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">{s.label}</p>
            )}
            {s.node}
          </div>
        ))
      )}
    </div>
  );
}
