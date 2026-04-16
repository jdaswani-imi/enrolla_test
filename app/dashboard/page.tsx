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
import { cn } from "@/lib/utils";
import { SkeletonKpi, SkeletonTable, SkeletonCard } from "@/components/ui/skeleton-loader";
import {
  kpiCards,
  churnRiskStudents,
  operationalThresholds,
  revenueData,
  occupancyHeatmap,
  activityFeed,
  reportsInbox,
  type KpiCard,
  type ChurnRiskStudent,
  type OperationalThreshold,
  type ActivityEvent,
  type ReportItem,
} from "@/lib/mock-data";

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
};

// ─── KPI Link map ─────────────────────────────────────────────────────────────

const KPI_LINKS: Record<string, string> = {
  overdue:   "/finance",
  "at-risk": "/analytics?tab=churn",
  concerns:  "/progress?tab=alerts",
  occupancy: "/analytics?tab=occupancy",
  revenue:   "/analytics?tab=revenue",
};

// ─── Activity destination map ─────────────────────────────────────────────────

const ACTIVITY_HREFS: Record<string, string> = {
  enrolment:      "/students/IMI-0009",
  payment:        "/finance",
  concern:        "/students/IMI-0002?tab=concerns",
  invoice:        "/finance",
  trial:          "/enrolment",
  assessment:     "/assessments",
  lead:           "/leads",
  staff:          "/staff",
  task:           "/tasks",
  report:         "/reports",
  "re-enrolment": "/enrolment",
};

const ACTIVITY_ICON_MAP: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  enrolment:    { icon: UserPlus,       color: "text-emerald-600",  bg: "bg-emerald-50" },
  payment:      { icon: CreditCard,     color: "text-blue-600",     bg: "bg-blue-50" },
  concern:      { icon: TriangleAlert,  color: "text-red-600",      bg: "bg-red-50" },
  invoice:      { icon: FileText,       color: "text-amber-600",    bg: "bg-amber-50" },
  trial:        { icon: FlaskConical,   color: "text-emerald-600",  bg: "bg-emerald-50" },
  assessment:   { icon: ClipboardCheck, color: "text-slate-500",    bg: "bg-slate-100" },
  lead:         { icon: MessageCircle,  color: "text-emerald-600",  bg: "bg-emerald-50" },
  staff:        { icon: UserX,          color: "text-red-600",      bg: "bg-red-50" },
  task:         { icon: CheckSquare,    color: "text-amber-600",    bg: "bg-amber-50" },
  report:       { icon: BarChart2,      color: "text-slate-500",    bg: "bg-slate-100" },
  "re-enrolment": { icon: UserCheck,   color: "text-blue-600",     bg: "bg-blue-50" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAED(value: number): string {
  return `AED ${(value / 1000).toFixed(0)}k`;
}

function getChurnBadge(level: ChurnRiskStudent["churnLevel"]) {
  switch (level) {
    case "Critical":
      return "bg-red-600 text-white";
    case "High":
      return "bg-red-500 text-white";
    case "Medium":
      return "bg-amber-400 text-amber-950";
    case "Low":
      return "bg-emerald-100 text-emerald-800";
  }
}

function getOccupancyColor(pct: number): string {
  if (pct >= 85) return "bg-[#0F172A] text-white";
  if (pct >= 70) return "bg-teal-500/20 text-teal-800";
  if (pct >= 50) return "bg-amber-300/40 text-amber-900";
  return "bg-slate-100 text-slate-400";
}

function getThresholdPill(status: OperationalThreshold["status"]) {
  switch (status) {
    case "ok":
      return "bg-emerald-100 text-emerald-700";
    case "warning":
      return "bg-amber-100 text-amber-700";
    case "critical":
      return "bg-red-100 text-red-700";
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

// ─── Row 1: KPI Cards ─────────────────────────────────────────────────────────

function KpiCardItem({ card }: { card: KpiCard }) {
  const IconComponent = ICON_MAP[card.icon] ?? AlertCircle;
  const href = KPI_LINKS[card.id];

  const trendColor =
    card.trendSentiment === "positive"
      ? "text-emerald-600"
      : card.trendSentiment === "negative"
      ? "text-red-500"
      : card.trendSentiment === "warning"
      ? "text-amber-500"
      : "text-slate-400";

  const TrendIcon =
    card.trendDirection === "up"
      ? ArrowUpRight
      : card.trendDirection === "down"
      ? ArrowDownRight
      : Minus;

  const inner = (
    <Card className={cn("flex flex-col gap-2.5 transition-all duration-200", href && "cursor-pointer hover:shadow-md hover:border-amber-200 hover:-translate-y-px")}>
      <div className="flex items-start justify-between">
        <div className="rounded-md bg-amber-50 p-1.5">
          <IconComponent className="w-4 h-4 text-amber-500" />
        </div>
        {card.trendDirection !== "neutral" ? (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium", trendColor)}>
            <TrendIcon className="w-3.5 h-3.5" />
            {card.trend}
          </span>
        ) : (
          <span className={cn("text-xs font-medium", trendColor)}>{card.trend}</span>
        )}
      </div>
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{card.label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-none">{card.value}</p>
        {card.subValue && (
          <p className={cn("text-xs mt-1 font-medium", trendColor)}>{card.subValue}</p>
        )}
      </div>
    </Card>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

// ─── Row 2 Left: Churn Risk Table ─────────────────────────────────────────────

function ChurnRiskTable() {
  return (
    <Card className="flex flex-col">
      <SectionLabel>Churn Risk</SectionLabel>
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Student</th>
              <th className="text-left py-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Yr / Dept</th>
              <th className="text-left py-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wide">Score</th>
              <th className="text-left py-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Signal</th>
              <th className="text-left py-2 px-1 text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Last Contact</th>
              <th className="py-2 px-1" />
            </tr>
          </thead>
          <tbody>
            {churnRiskStudents.map((s) => (
              <tr
                key={s.id}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <td className="py-2.5 px-1 font-medium text-slate-800">{s.name}</td>
                <td className="py-2.5 px-1 text-slate-500">
                  <span className="font-medium">{s.yearGroup}</span>{" "}
                  <span className="text-slate-400 text-xs">{s.department}</span>
                </td>
                <td className="py-2.5 px-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                      getChurnBadge(s.churnLevel)
                    )}
                  >
                    {s.churnScore} {s.churnLevel}
                  </span>
                </td>
                <td className="py-2.5 px-1 text-slate-500 text-xs hidden md:table-cell">{s.topSignal}</td>
                <td className="py-2.5 px-1 text-slate-400 text-xs hidden lg:table-cell">
                  {s.daysSinceContact}d ago
                </td>
                <td className="py-2.5 px-1">
                  <Link
                    href={`/students/${s.studentId}`}
                    className="text-xs text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap transition-colors"
                  >
                    View Profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Row 2 Right: Operational Thresholds ──────────────────────────────────────

function OperationalThresholdStrip() {
  return (
    <Card className="flex flex-col gap-3">
      <SectionLabel>Operational Thresholds</SectionLabel>
      <div className="flex flex-col gap-2">
        {operationalThresholds.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50/60 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{t.metric}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                <span className="font-semibold text-slate-600">{t.current}</span>
                {" · "}
                {t.target}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
                getThresholdPill(t.status)
              )}
            >
              {t.statusLabel}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─── Row 3 Left: Revenue Bar Chart ────────────────────────────────────────────

function RevenueChart() {
  return (
    <Card>
      <SectionLabel>Revenue Trend</SectionLabel>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={revenueData} barGap={4} barCategoryGap="28%">
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatAED(v)}
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            formatter={(value) => [`AED ${Number(value).toLocaleString()}`, ""]}
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              fontSize: 12,
            }}
          />
          <Legend
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          />
          <Bar dataKey="invoiced" name="Invoiced" fill="#F59E0B" radius={[3, 3, 0, 0]} />
          <Bar dataKey="collected" name="Collected" fill="#0F172A" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ─── Row 3 Right: Occupancy Heatmap ──────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TIMES = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "20:30"];

function OccupancyHeatmap() {
  const lookup = new Map(
    occupancyHeatmap.map((c) => [`${c.day}|${c.time}`, c.occupancy])
  );

  return (
    <Card>
      <SectionLabel>Seat Occupancy Heatmap</SectionLabel>
      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          {/* Header row */}
          <div className="grid grid-cols-[52px_repeat(5,1fr)] gap-1 mb-1">
            <div />
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>
          {/* Data rows */}
          {TIMES.map((time) => (
            <div key={time} className="grid grid-cols-[52px_repeat(5,1fr)] gap-1 mb-1">
              <div className="flex items-center text-[11px] text-slate-400 font-medium pr-1">
                {time}
              </div>
              {DAYS.map((day) => {
                const pct = lookup.get(`${day}|${time}`) ?? 0;
                return (
                  <div
                    key={day}
                    title={`${day} ${time}: ${pct}%`}
                    className={cn(
                      "rounded h-8 flex items-center justify-center text-[10px] font-semibold transition-opacity cursor-default",
                      getOccupancyColor(pct)
                    )}
                  >
                    {pct}%
                  </div>
                );
              })}
            </div>
          ))}
          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            {[
              { label: "< 50%", className: "bg-slate-100" },
              { label: "50–69%", className: "bg-amber-300/40" },
              { label: "70–84%", className: "bg-teal-500/20" },
              { label: "85–100%", className: "bg-[#0F172A]" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={cn("w-3 h-3 rounded", l.className)} />
                <span className="text-[10px] text-slate-400">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ─── Row 4 Left: Activity Feed ────────────────────────────────────────────────

function ActivityFeedPanel() {
  return (
    <Card className="flex flex-col">
      <SectionLabel>Live Activity</SectionLabel>
      <div className="flex flex-col divide-y divide-slate-50">
        {activityFeed.map((event: ActivityEvent) => {
          const meta = ACTIVITY_ICON_MAP[event.type] ?? ACTIVITY_ICON_MAP["report"];
          const IconEl = meta.icon;
          const href = ACTIVITY_HREFS[event.type] ?? "/dashboard";
          return (
            <Link
              key={event.id}
              href={href}
              className="flex items-start gap-3 py-2.5 hover:bg-slate-50 -mx-1 px-1 rounded transition-colors cursor-pointer"
            >
              <div className={cn("mt-0.5 rounded-md p-1.5 shrink-0", meta.bg)}>
                <IconEl className={cn("w-3.5 h-3.5", meta.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 leading-snug">{event.description}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400 whitespace-nowrap mt-0.5">
                {event.timeAgo}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Row 4 Right: Reports Inbox ───────────────────────────────────────────────

const REPORT_ICON_MAP: Record<string, React.ElementType> = {
  BarChart2,
  ClipboardList,
  Banknote,
  GraduationCap,
  Users,
};

function ReportsInboxPanel() {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <SectionLabel>Reports Inbox</SectionLabel>
        <Link
          href="/reports"
          className="text-xs text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1 transition-colors -mt-3"
        >
          View All
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
      <div className="flex flex-col divide-y divide-slate-50">
        {reportsInbox.map((report: ReportItem) => {
          const IconEl = REPORT_ICON_MAP[report.icon] ?? BarChart2;
          return (
            <Link
              key={report.id}
              href="/reports"
              className="flex items-center gap-3 py-3 hover:bg-slate-50 -mx-1 px-1 rounded transition-colors cursor-pointer"
            >
              <div className="rounded-md bg-slate-100 p-2 shrink-0">
                <IconEl className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {!report.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                  )}
                  <p className={cn("text-sm truncate", report.read ? "text-slate-500" : "text-slate-800 font-medium")}>
                    {report.title}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{report.date}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-amber-600 hover:text-amber-700 border border-amber-200 hover:border-amber-300 rounded px-2.5 py-1 transition-colors cursor-pointer">
                Open
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
        {/* Row 1 — KPI skeletons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => <SkeletonKpi key={i} />)}
        </div>
        {/* Row 2 — Churn + Thresholds skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <SkeletonTable rows={6} columns={5} />
          </div>
          <div className="lg:col-span-2 flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
        {/* Rows 3 & 4 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonTable rows={4} />
          <SkeletonTable rows={4} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <SkeletonTable rows={4} />
          </div>
          <div className="lg:col-span-2">
            <SkeletonTable rows={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1400px] mx-auto">
      {/* Row 1 — KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => (
          <KpiCardItem key={card.id} card={card} />
        ))}
      </div>

      {/* Row 2 — Churn Risk + Operational Thresholds */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <ChurnRiskTable />
        </div>
        <div className="lg:col-span-2">
          <OperationalThresholdStrip />
        </div>
      </div>

      {/* Row 3 — Revenue Chart + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart />
        <OccupancyHeatmap />
      </div>

      {/* Row 4 — Activity Feed + Reports Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <ActivityFeedPanel />
        </div>
        <div className="lg:col-span-2">
          <ReportsInboxPanel />
        </div>
      </div>
    </div>
  );
}
