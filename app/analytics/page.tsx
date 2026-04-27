"use client";

import { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
} from "recharts";
import { ExternalLink, ChevronDown, X, FilterX } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import {
  DateRangePicker,
  DATE_PRESETS,
  type DateRange,
  type PresetItem,
} from "@/components/ui/date-range-picker";
import { EmptyState } from "@/components/ui/empty-state";
// ─── Inline type: ChurnRiskStudent ───────────────────────────────────────────

type ChurnLevel = "Critical" | "High" | "Medium" | "Low";

interface ChurnRiskStudent {
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
  reasons: { label: string; weight: number; detail: string }[];
  retentionConfidence: number;
  retentionFactors: { label: string; weight: number }[];
}

// ─── Inline StaffMember type (analytics uses a subset) ───────────────────────

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  subjects: string[];
  sessionsThisWeek: number;
  cpdHours: number;
  cpdTarget: number;
  status: string;
  hireDate: string;
  contractType: string;
  lineManager: string;
  workloadLevel: string;
}

// ─── Empty-array stubs (no API endpoints yet) ─────────────────────────────────

const occupancyHeatmap:    { day: string; time: string; occupancy: number }[] = [];
const revenueDeptData:     { date: Date; month: string; Primary: number; LowerSec: number; Senior: number }[] = [];
const revenueWeeklyData:   { week: string; Primary: number; LowerSec: number; Senior: number }[] = [];
const revenueTermlyData:   { term: string; Primary: number; LowerSec: number; Senior: number }[] = [];
const revenueBySubject:    { subject: string; revenue: number }[] = [];

// ─── YEAR_GROUPS inlined ──────────────────────────────────────────────────────

const BASE_YEAR_GROUPS = [
  "KG1", "KG2",
  "Y1", "Y2", "Y3", "Y4", "Y5", "Y6",
  "Y7", "Y8", "Y9", "Y10", "Y11", "Y12", "Y13",
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "revenue" | "occupancy" | "churn" | "staff";

// ─── Analytics date presets (extends base presets with term/academic year) ────

const ANALYTICS_PRESETS = DATE_PRESETS;

// ─── Local constants ──────────────────────────────────────────────────────────

const revenueByTeacher: { teacher: string; dept: string; sessions: number; actual: number; expected: number; variance: number }[] = [];
const occupancyRooms: { room: string; capacity: number; sessions: number; avgUtil: number; peakUtil: number; status: string }[] = [];
const staffFeedbackBase: { teacher: string; score: number }[] = [];
const roomUtilisationBase: { room: string; util: number }[] = [];
const peakHoursData: { hour: string; Primary: number; "Lower Sec": number; Senior: number }[] = [];
const churnRateData: { month: string; rate: number }[] = [];
const retentionActions: { name: string; value: number }[] = [];

const RETENTION_COLORS = ["#f59e0b", "#10b981", "#6366f1", "#f43f5e"];

const WORKLOAD_FILL: Record<string, string> = {
  High:     "#ef4444",
  Moderate: "#f59e0b",
  Low:      "#10b981",
};

const staffMetaByName: Record<string, { feedback: number; attendance: number; compliance: number }> = {};

const YEAR_GROUPS = ["All", ...BASE_YEAR_GROUPS];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEPT_COLORS = { Primary: "#f472b6", LowerSec: "#22d3ee", Senior: "#fb923c" };
const DONUT_COLORS = ["#f472b6", "#22d3ee", "#fb923c"];

function formatAED(val: number): string {
  return `AED ${val.toLocaleString()}`;
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

function getRoomStatusPill(status: string) {
  switch (status) {
    case "On Target":   return "bg-emerald-100 text-emerald-700";
    case "Near Target": return "bg-amber-100 text-amber-700";
    default:            return "bg-orange-100 text-orange-700";
  }
}

function getWorkloadBadge(level: string) {
  switch (level) {
    case "High":     return "bg-red-100 text-red-700";
    case "Moderate": return "bg-amber-100 text-amber-700";
    default:         return "bg-emerald-100 text-emerald-700";
  }
}

function matchRoom(room: string, filter: string): boolean {
  if (filter === "All") return true;
  if (filter === "Room A") return /A$/.test(room);
  if (filter === "Room B") return /B$/.test(room);
  if (filter === "Open Space") return room === "Open Space";
  if (filter === "Office") return room === "Office";
  return false;
}

// ─── Shared layout primitives ─────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-lg border border-slate-200 p-5", className)}>
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-slate-800 mb-4">{children}</p>;
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={cn("bg-white rounded-lg border border-slate-200 p-5 flex flex-col gap-1", accent && "border-l-4 border-l-teal-500")}>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ─── Filter primitives ────────────────────────────────────────────────────────

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = value !== "All";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer whitespace-nowrap",
          isActive
            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
            : "bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700"
        )}
      >
        {isActive ? value : label}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-1.5 min-w-[160px] max-h-64 overflow-y-auto">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "flex w-full items-center px-3 py-1.5 text-sm rounded-lg text-left cursor-pointer transition-colors",
                opt === value
                  ? "bg-amber-50 text-amber-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type FilterChip = { label: string; onRemove: () => void };

function FilterBar({
  children,
  chips,
  onClearAll,
}: {
  children: React.ReactNode;
  chips: FilterChip[];
  onClearAll: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 divide-y divide-slate-100">
      <div className="px-4 py-3 flex flex-wrap gap-2 items-center">
        {children}
      </div>
      {chips.length > 0 && (
        <div className="px-4 py-2.5 flex flex-wrap gap-1.5 items-center">
          {chips.map((f) => (
            <span
              key={f.label}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-medium rounded-full"
            >
              {f.label}
              <button
                type="button"
                onClick={f.onRemove}
                className="ml-0.5 hover:text-amber-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer underline underline-offset-2 ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Revenue ─────────────────────────────────────────────────────────────

function RevenueTab() {
  const [dateRange, setDateRange] = useState<DateRange>({ from: null, to: null });
  const [department, setDepartment] = useState("All");
  const [viewBy, setViewBy]         = useState("Monthly");

  const revChartData = useMemo(() => {
    if (viewBy === "Weekly") return revenueWeeklyData as unknown as Record<string, unknown>[];
    if (viewBy === "Termly") return revenueTermlyData as unknown as Record<string, unknown>[];
    const { from, to } = dateRange;
    let data = revenueDeptData;
    if (from) data = data.filter((d) => d.date >= from);
    if (to)   data = data.filter((d) => d.date <= to);
    return data as unknown as Record<string, unknown>[];
  }, [viewBy, dateRange]);

  const revXKey = viewBy === "Weekly" ? "week" : viewBy === "Termly" ? "term" : "month";

  const showPrimary  = department === "All" || department === "Primary";
  const showLowerSec = department === "All" || department === "Lower Secondary";
  const showSenior   = department === "All" || department === "Senior";

  const filteredTeachers = useMemo(
    () => (department === "All" ? revenueByTeacher : revenueByTeacher.filter((t) => t.dept === department)),
    [department]
  );

  const chips: FilterChip[] = [
    ...(dateRange.from || dateRange.to
      ? [{ label: "Date range", onRemove: () => setDateRange({ from: null, to: null }) }]
      : []),
    ...(department !== "All"
      ? [{ label: department, onRemove: () => setDepartment("All") }]
      : []),
    ...(viewBy !== "Monthly"
      ? [{ label: `View: ${viewBy}`, onRemove: () => setViewBy("Monthly") }]
      : []),
  ];

  function clearAll() {
    setDateRange({ from: null, to: null });
    setDepartment("All");
    setViewBy("Monthly");
  }

  const mainEmpty = revChartData.length === 0;

  return (
    <div className="space-y-5">
      <FilterBar chips={chips} onClearAll={clearAll}>
        <DateRangePicker value={dateRange} onChange={setDateRange} presets={ANALYTICS_PRESETS} />
        <SelectFilter
          label="Department"
          value={department}
          options={["All", "Primary", "Lower Secondary", "Senior"]}
          onChange={setDepartment}
        />
        <SelectFilter
          label="View By"
          value={viewBy}
          options={["Monthly", "Weekly", "Termly"]}
          onChange={setViewBy}
        />
      </FilterBar>

      {mainEmpty ? (
        <EmptyState
          icon={FilterX}
          title="No data matches the selected filters"
          description="Try adjusting or clearing your filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardTitle>Revenue by Department — {viewBy}</CardTitle>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revChartData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey={revXKey} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: unknown, name: unknown) => [`AED ${((value as number) / 1000).toFixed(0)}k`, name as string]}
                    contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  />
                  <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#64748B" }} />
                  {showPrimary  && <Bar dataKey="Primary"  stackId="a" fill={DEPT_COLORS.Primary} />}
                  {showLowerSec && <Bar dataKey="LowerSec" stackId="a" fill={DEPT_COLORS.LowerSec} />}
                  {showSenior   && <Bar dataKey="Senior"   stackId="a" fill={DEPT_COLORS.Senior} radius={[4, 4, 0, 0]} />}
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card>
              <CardTitle>Revenue by Subject (This Term)</CardTitle>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueBySubject} layout="vertical" barCategoryGap="28%" margin={{ left: 8, right: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="subject" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={(v: unknown) => [formatAED(v as number), "Revenue"]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card>
            <CardTitle>Revenue by Teacher</CardTitle>
            {filteredTeachers.length === 0 ? (
              <EmptyState
                icon={FilterX}
                title="No data matches the selected filters"
                description="Try adjusting or clearing your filters."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs text-slate-500 font-medium pb-2 pr-4">Teacher</th>
                      <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">Sessions Delivered</th>
                      <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">Revenue (Actual)</th>
                      <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">Revenue (Expected)</th>
                      <th className="text-right text-xs text-slate-500 font-medium pb-2 pl-4">Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTeachers.map((row) => (
                      <tr key={row.teacher} className="hover:bg-slate-50/50">
                        <td className="py-3 pr-4 font-medium text-slate-800">{row.teacher}</td>
                        <td className="py-3 px-4 text-right text-slate-600">{row.sessions}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{formatAED(row.actual)}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{formatAED(row.expected)}</td>
                        <td className={cn("py-3 pl-4 text-right font-medium", row.variance < 0 ? "text-red-600" : "text-emerald-600")}>
                          {row.variance < 0 ? `-${formatAED(Math.abs(row.variance))}` : `+${formatAED(row.variance)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Tab: Occupancy ───────────────────────────────────────────────────────────

const HEATMAP_ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
const HEATMAP_TIMES    = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "20:30"];

function OccupancyTab() {
  const [dateRange,  setDateRange]  = useState<DateRange>({ from: null, to: null });
  const [room,       setRoom]       = useState("All");
  const [department, setDepartment] = useState("All");
  const [dayOfWeek,  setDayOfWeek]  = useState("All");

  const filteredDays = dayOfWeek === "All" ? [...HEATMAP_ALL_DAYS] : [dayOfWeek];

  const cellMap = useMemo(
    () => new Map(occupancyHeatmap.map((c) => [`${c.day}-${c.time}`, c.occupancy])),
    []
  );

  const filteredRoomUtil = useMemo(
    () => roomUtilisationBase.filter((r) => matchRoom(r.room, room)),
    [room]
  );

  const filteredOccupancyRooms = useMemo(
    () => occupancyRooms.filter((r) => matchRoom(r.room, room)),
    [room]
  );

  const showPrimary  = department === "All" || department === "Primary";
  const showLowerSec = department === "All" || department === "Lower Secondary";
  const showSenior   = department === "All" || department === "Senior";

  const chips: FilterChip[] = [
    ...(dateRange.from || dateRange.to
      ? [{ label: "Date range", onRemove: () => setDateRange({ from: null, to: null }) }]
      : []),
    ...(room !== "All"
      ? [{ label: room, onRemove: () => setRoom("All") }]
      : []),
    ...(department !== "All"
      ? [{ label: department, onRemove: () => setDepartment("All") }]
      : []),
    ...(dayOfWeek !== "All"
      ? [{ label: dayOfWeek, onRemove: () => setDayOfWeek("All") }]
      : []),
  ];

  function clearAll() {
    setDateRange({ from: null, to: null });
    setRoom("All");
    setDepartment("All");
    setDayOfWeek("All");
  }

  const roomsEmpty = filteredRoomUtil.length === 0;

  return (
    <div className="space-y-5">
      <FilterBar chips={chips} onClearAll={clearAll}>
        <DateRangePicker value={dateRange} onChange={setDateRange} presets={ANALYTICS_PRESETS} />
        <SelectFilter
          label="Room"
          value={room}
          options={["All", "Room A", "Room B", "Open Space", "Office"]}
          onChange={setRoom}
        />
        <SelectFilter
          label="Department"
          value={department}
          options={["All", "Primary", "Lower Secondary", "Senior"]}
          onChange={setDepartment}
        />
        <SelectFilter
          label="Day of Week"
          value={dayOfWeek}
          options={["All", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]}
          onChange={setDayOfWeek}
        />
      </FilterBar>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Overall Occupancy"            value="—" />
        <StatCard label="Peak Hours Avg (15:00–19:00)" value="—" />
        <StatCard label="Low Occupancy Sessions"       value="0"   />
      </div>
      <p className="text-xs text-slate-400 -mt-2">
        Target: <span className="font-medium text-slate-600">80%</span> · Threshold:{" "}
        <span className="font-medium text-slate-600">50%</span>
      </p>

      {/* Heatmap filtered by day */}
      <Card>
        <CardTitle>Occupancy Heatmap{dayOfWeek !== "All" ? ` — ${dayOfWeek}` : " — All Days"}</CardTitle>
        <div className="overflow-x-auto">
          <div className="min-w-[320px]">
            <div
              className="grid gap-1.5 mb-1.5"
              style={{ gridTemplateColumns: `56px repeat(${filteredDays.length}, 1fr)` }}
            >
              <div />
              {filteredDays.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-500">{d}</div>
              ))}
            </div>
            {HEATMAP_TIMES.map((time) => (
              <div
                key={time}
                className="grid gap-1.5 mb-1.5"
                style={{ gridTemplateColumns: `56px repeat(${filteredDays.length}, 1fr)` }}
              >
                <div className="text-right pr-2 text-[11px] text-slate-400 flex items-center justify-end">{time}</div>
                {filteredDays.map((day) => {
                  const pct = cellMap.get(`${day}-${time}`) ?? 0;
                  return (
                    <div key={day} className={cn("rounded text-center py-2 text-xs font-medium", getOccupancyColor(pct))}>
                      {pct}%
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200 inline-block" /> Empty</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-100 inline-block" /> Low</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-300 inline-block" /> Moderate</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Good</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-700 inline-block" /> Full</span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Room utilisation — filtered by room */}
        <Card>
          <CardTitle>Room Utilisation{room !== "All" ? ` — ${room}` : ""}</CardTitle>
          {roomsEmpty ? (
            <EmptyState
              icon={FilterX}
              title="No data matches the selected filters"
              description="Try adjusting or clearing your filters."
            />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={filteredRoomUtil} barCategoryGap="28%" margin={{ top: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="room" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: unknown) => [`${v as number}%`, "Utilisation"]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <ReferenceLine y={80} stroke="#64748B" strokeDasharray="4 4" label={{ value: "Target 80%", position: "insideTopRight", fill: "#64748B", fontSize: 11 }} />
                <Bar dataKey="util" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Peak hours — filtered by department */}
        <Card>
          <CardTitle>Peak Hours by Department{department !== "All" ? ` — ${department}` : ""}</CardTitle>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={peakHoursData} margin={{ top: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: unknown, name: unknown) => [`${v as number}%`, name as string]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#64748B" }} />
              {showPrimary  && <Line type="monotone" dataKey="Primary"   stroke={DEPT_COLORS.Primary}  strokeWidth={2} dot={{ r: 3 }} />}
              {showLowerSec && <Line type="monotone" dataKey="Lower Sec" stroke={DEPT_COLORS.LowerSec} strokeWidth={2} dot={{ r: 3 }} />}
              {showSenior   && <Line type="monotone" dataKey="Senior"    stroke={DEPT_COLORS.Senior}   strokeWidth={2} dot={{ r: 3 }} />}
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Occupancy by room table — filtered by room */}
      <Card>
        <CardTitle>Occupancy by Room{room !== "All" ? ` — ${room}` : ""}</CardTitle>
        {filteredOccupancyRooms.length === 0 ? (
          <EmptyState
            icon={FilterX}
            title="No data matches the selected filters"
            description="Try adjusting or clearing your filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs text-slate-500 font-medium pb-2 pr-4">Room</th>
                  <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">Capacity</th>
                  <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">Sessions This Week</th>
                  <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">Avg Utilisation</th>
                  <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">Peak Utilisation</th>
                  <th className="text-right text-xs text-slate-500 font-medium pb-2 pl-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOccupancyRooms.map((row) => (
                  <tr key={row.room} className="hover:bg-slate-50/50">
                    <td className="py-3 pr-4 font-medium text-slate-800">{row.room}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{row.capacity}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{row.sessions}</td>
                    <td className="py-3 px-4 text-right text-slate-700">{row.avgUtil}%</td>
                    <td className="py-3 px-4 text-right text-slate-700">{row.peakUtil}%</td>
                    <td className="py-3 pl-4 text-right">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", getRoomStatusPill(row.status))}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab: Churn ───────────────────────────────────────────────────────────────

const CHURN_SIGNAL_KEYWORDS: Record<string, string> = {
  "Teaching Quality Concern": "Teaching Quality",
  "Missed Sessions":          "Missed",
  "Overdue Invoice":          "Overdue Invoice",
  "Unresolved Concern":       "Unresolved",
  "NPS Low":                  "NPS",
  "App Inactive":             "App Inactive",
};

function ChurnTab() {
  // churnRisk data: no API endpoint yet, stays empty until wired
  const [churnRiskStudents] = useState<ChurnRiskStudent[]>([]);
  const [riskLevel,   setRiskLevel]   = useState("All");
  const [department,  setDepartment]  = useState("All");
  const [yearGroup,   setYearGroup]   = useState("All");
  const [signalType,  setSignalType]  = useState("All");

  const filteredStudents = useMemo(() => {
    let data = churnRiskStudents;

    if (riskLevel !== "All") {
      data = data.filter((s) => s.churnLevel === riskLevel);
    }

    if (department !== "All") {
      const deptMap: Record<string, string> = {
        "Primary":         "Primary",
        "Lower Secondary": "Lower Sec",
        "Senior":          "Senior",
      };
      const target = deptMap[department] ?? department;
      data = data.filter((s) => s.department === target);
    }

    if (yearGroup !== "All") {
      data = data.filter((s) => s.yearGroup === yearGroup);
    }

    if (signalType !== "All") {
      const keyword = CHURN_SIGNAL_KEYWORDS[signalType] ?? signalType;
      data = data.filter((s) => s.topSignal.includes(keyword));
    }

    return data;
  }, [churnRiskStudents, riskLevel, department, yearGroup, signalType]);

  const filteredChurnByDept = useMemo(() => {
    const counts: Record<string, number> = { Primary: 0, "Lower Sec": 0, Senior: 0 };
    for (const s of filteredStudents) {
      if (s.department in counts) counts[s.department]++;
    }
    return [
      { name: "Primary",   value: counts["Primary"]    },
      { name: "Lower Sec", value: counts["Lower Sec"]  },
      { name: "Senior",    value: counts["Senior"]     },
    ].filter((d) => d.value > 0);
  }, [filteredStudents]);

  const filteredChurnSignals = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of filteredStudents) {
      counts.set(s.topSignal, (counts.get(s.topSignal) ?? 0) + 1);
    }
    return Array.from(counts, ([signal, count]) => ({ signal, count })).sort((a, b) => b.count - a.count);
  }, [filteredStudents]);

  const chips: FilterChip[] = [
    ...(riskLevel !== "All"
      ? [{ label: riskLevel, onRemove: () => setRiskLevel("All") }]
      : []),
    ...(department !== "All"
      ? [{ label: department, onRemove: () => setDepartment("All") }]
      : []),
    ...(yearGroup !== "All"
      ? [{ label: yearGroup, onRemove: () => setYearGroup("All") }]
      : []),
    ...(signalType !== "All"
      ? [{ label: signalType, onRemove: () => setSignalType("All") }]
      : []),
  ];

  function clearAll() {
    setRiskLevel("All");
    setDepartment("All");
    setYearGroup("All");
    setSignalType("All");
  }

  const isEmpty = filteredStudents.length === 0;

  return (
    <div className="space-y-5">
      <FilterBar chips={chips} onClearAll={clearAll}>
        <SelectFilter
          label="Risk Level"
          value={riskLevel}
          options={["All", "Critical", "High", "Medium", "Low"]}
          onChange={setRiskLevel}
        />
        <SelectFilter
          label="Department"
          value={department}
          options={["All", "Primary", "Lower Secondary", "Senior"]}
          onChange={setDepartment}
        />
        <SelectFilter
          label="Year Group"
          value={yearGroup}
          options={YEAR_GROUPS}
          onChange={setYearGroup}
        />
        <SelectFilter
          label="Signal Type"
          value={signalType}
          options={[
            "All",
            "Teaching Quality Concern",
            "Missed Sessions",
            "Overdue Invoice",
            "Unresolved Concern",
            "NPS Low",
            "App Inactive",
          ]}
          onChange={setSignalType}
        />
      </FilterBar>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="At-Risk Students" value={String(filteredStudents.length)} />
        <StatCard label="Critical (≥70)"   value={String(filteredStudents.filter((s) => s.churnLevel === "Critical").length)} />
        <StatCard label="Medium (40–69)"   value={String(filteredStudents.filter((s) => s.churnLevel === "Medium").length)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardTitle>Churn by Department</CardTitle>
          {filteredChurnByDept.length === 0 ? (
            <EmptyState
              icon={FilterX}
              title="No data matches the selected filters"
              description="Try adjusting or clearing your filters."
            />
          ) : (
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={filteredChurnByDept} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                      {filteredChurnByDept.map((_, i) => (
                        <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => [`${v as number} students`, ""]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3 text-sm flex-shrink-0">
                {filteredChurnByDept.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <span className="text-slate-600">{d.name}</span>
                    <span className="font-semibold text-slate-800 ml-3">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Churn by Signal</CardTitle>
          {filteredChurnSignals.length === 0 ? (
            <EmptyState
              icon={FilterX}
              title="No data matches the selected filters"
              description="Try adjusting or clearing your filters."
            />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={filteredChurnSignals} layout="vertical" barCategoryGap="30%" margin={{ left: 8, right: 32 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="signal" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={148} />
                <Tooltip formatter={(v: unknown) => [`${v as number} students`, "Count"]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardTitle>Churn Rate Over Time</CardTitle>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={churnRateData} margin={{ top: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: unknown) => [`${v as number}%`, "Churn rate"]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: "#ef4444" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle>Retention Actions Taken</CardTitle>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={retentionActions} cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={3} dataKey="value">
                    {retentionActions.map((_, i) => (
                      <Cell key={i} fill={RETENTION_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => [`${v as number} actions`, ""]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2.5 text-sm flex-shrink-0">
              {retentionActions.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ background: RETENTION_COLORS[i] }} />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="font-semibold text-slate-800 ml-3">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Churn Risk Students</CardTitle>
        {isEmpty ? (
          <EmptyState
            icon={FilterX}
            title="No data matches the selected filters"
            description="Try adjusting or clearing your filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-xs text-slate-500 font-medium pb-2 pr-4">Student</th>
                  <th className="text-left text-xs text-slate-500 font-medium pb-2 px-4">Year</th>
                  <th className="text-left text-xs text-slate-500 font-medium pb-2 px-4">Dept</th>
                  <th className="text-left text-xs text-slate-500 font-medium pb-2 px-4">Churn Score</th>
                  <th className="text-left text-xs text-slate-500 font-medium pb-2 px-4">Top Signal</th>
                  <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">Days Since Contact</th>
                  <th className="pb-2 pl-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3 pr-4 font-medium text-slate-800">{s.name}</td>
                    <td className="py-3 px-4 text-slate-600">{s.yearGroup}</td>
                    <td className="py-3 px-4 text-slate-600">{s.department}</td>
                    <td className="py-3 px-4">
                      <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-semibold", getChurnBadge(s.churnLevel))}>
                        {s.churnScore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{s.topSignal}</td>
                    <td className="py-3 px-4 text-right text-slate-600">{s.daysSinceContact}d</td>
                    <td className="py-3 pl-4">
                      <Link href={`/students/${s.studentId}`} className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer">
                        View Profile <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Tab: Staff Performance ───────────────────────────────────────────────────

function StaffTab() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [department, setDepartment] = useState("All");
  const [role,       setRole]       = useState("All");
  const [dateRange,  setDateRange]  = useState<DateRange>({ from: null, to: null });

  useEffect(() => {
    fetch('/api/staff')
      .then((r) => r.ok ? r.json() : { data: [] })
      .then((json) => setStaffMembers(json.data ?? []))
      .catch(() => {});
  }, []);

  const teachingStaff = useMemo(() => {
    let data = staffMembers.filter(
      (s) => s.role === "Teacher" || s.role === "HOD" || s.role === "TA"
    );
    if (department !== "All") data = data.filter((s) => s.department === department);
    if (role !== "All")       data = data.filter((s) => s.role === role);
    return data;
  }, [staffMembers, department, role]);

  const cpdData = useMemo(
    () =>
      teachingStaff.map((s) => ({
        name:      s.name.split(" ")[0] + " " + (s.name.split(" ")[1]?.[0] ?? "") + ".",
        completed: s.cpdHours,
        target:    s.cpdTarget,
      })),
    [teachingStaff]
  );

  const teachingLoad = useMemo(
    () =>
      teachingStaff
        .map((s) => ({ name: s.name, sessions: s.sessionsThisWeek, level: s.workloadLevel }))
        .sort((a, b) => b.sessions - a.sessions),
    [teachingStaff]
  );

  const filteredFeedback = useMemo(() => {
    if (department === "All" && role === "All") return staffFeedbackBase;
    const staffNameSet = new Set(teachingStaff.map((s) => s.name));
    return staffFeedbackBase.filter((f) => {
      const cleanName = f.teacher.replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/, "");
      return staffNameSet.has(cleanName);
    });
  }, [teachingStaff, department, role]);

  const chips: FilterChip[] = [
    ...(dateRange.from || dateRange.to
      ? [{ label: "Date range", onRemove: () => setDateRange({ from: null, to: null }) }]
      : []),
    ...(department !== "All"
      ? [{ label: department, onRemove: () => setDepartment("All") }]
      : []),
    ...(role !== "All"
      ? [{ label: role, onRemove: () => setRole("All") }]
      : []),
  ];

  function clearAll() {
    setDateRange({ from: null, to: null });
    setDepartment("All");
    setRole("All");
  }

  const isEmpty = teachingStaff.length === 0;

  return (
    <div className="space-y-5">
      <FilterBar chips={chips} onClearAll={clearAll}>
        <SelectFilter
          label="Department"
          value={department}
          options={["All", "Primary", "Lower Secondary", "Senior"]}
          onChange={setDepartment}
        />
        <SelectFilter
          label="Role"
          value={role}
          options={["All", "Teacher", "TA", "HOD"]}
          onChange={setRole}
        />
        <DateRangePicker value={dateRange} onChange={setDateRange} presets={ANALYTICS_PRESETS} />
      </FilterBar>

      {isEmpty ? (
        <EmptyState
          icon={FilterX}
          title="No data matches the selected filters"
          description="Try adjusting or clearing your filters."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Avg Feedback Score"       value="—" />
            <StatCard label="48h Marking Compliance"   value="—" />
            <StatCard label="CPD Completion Rate"      value="—" />
          </div>

          <Card>
            <CardTitle>Avg Feedback Score by Teacher</CardTitle>
            {filteredFeedback.length === 0 ? (
              <EmptyState
                icon={FilterX}
                title="No data matches the selected filters"
                description="Try adjusting or clearing your filters."
              />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={filteredFeedback} layout="vertical" barCategoryGap="28%" margin={{ left: 8, right: 56 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="teacher" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip formatter={(v: unknown) => [`${v as number} / 5`, "Score"]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                  <Bar dataKey="score" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardTitle>CPD Completion (hours)</CardTitle>
              {cpdData.length === 0 ? (
                <EmptyState
                  icon={FilterX}
                  title="No data matches the selected filters"
                  description="Try adjusting or clearing your filters."
                />
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={cpdData} barCategoryGap="22%" margin={{ top: 8, right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={54} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: unknown, name: unknown) => [`${v as number} hrs`, name as string]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                    <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#64748B" }} />
                    <Bar dataKey="completed" name="Completed" fill="#F59E0B" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="target"    name="Target"    fill="#CBD5E1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card>
              <CardTitle>Teaching Load (sessions / week)</CardTitle>
              {teachingLoad.length === 0 ? (
                <EmptyState
                  icon={FilterX}
                  title="No data matches the selected filters"
                  description="Try adjusting or clearing your filters."
                />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={teachingLoad} layout="vertical" barCategoryGap="26%" margin={{ left: 8, right: 32 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={128} />
                      <Tooltip formatter={(v: unknown, _n: unknown, item: { payload?: { level?: string } }) => [`${v as number} sessions · ${item?.payload?.level ?? ""}`, "Load"]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                      <Bar dataKey="sessions" radius={[0, 4, 4, 0]}>
                        {teachingLoad.map((row, i) => (
                          <Cell key={i} fill={WORKLOAD_FILL[row.level] ?? "#94A3B8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: WORKLOAD_FILL.Low }} /> Low</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: WORKLOAD_FILL.Moderate }} /> Moderate</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: WORKLOAD_FILL.High }} /> High</span>
                  </div>
                </>
              )}
            </Card>
          </div>

          <Card>
            <CardTitle>Staff Performance Table</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs text-slate-500 font-medium pb-2 pr-4">Teacher</th>
                    <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">Sessions</th>
                    <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">Attendance Rate</th>
                    <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">Avg Feedback</th>
                    <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">CPD Progress</th>
                    <th className="text-right text-xs text-slate-500 font-medium pb-2 px-4">48h Compliance</th>
                    <th className="text-right text-xs text-slate-500 font-medium pb-2 pl-4">Workload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {teachingStaff.map((s) => {
                    const meta = staffMetaByName[s.name];
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-3 pr-4 font-medium text-slate-800">{s.name}</td>
                        <td className="py-3 px-4 text-right text-slate-600">{s.sessionsThisWeek}</td>
                        <td className="py-3 px-4 text-right text-slate-600">{meta ? `${meta.attendance}%` : "—"}</td>
                        <td className="py-3 px-4 text-right text-slate-700">{meta ? `${meta.feedback} / 5` : "—"}</td>
                        <td className="py-3 px-4 text-right text-slate-600">{s.cpdHours} / {s.cpdTarget} hrs</td>
                        <td className="py-3 px-4 text-right text-slate-600">{meta ? `${meta.compliance}%` : "—"}</td>
                        <td className="py-3 pl-4 text-right">
                          <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", getWorkloadBadge(s.workloadLevel))}>
                            {s.workloadLevel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "revenue",   label: "Revenue"          },
  { id: "occupancy", label: "Occupancy"         },
  { id: "churn",     label: "Churn"             },
  { id: "staff",     label: "Staff Performance" },
];

function AnalyticsPageContent() {
  const { can } = usePermission();
  const searchParams = useSearchParams();
  const router = useRouter();

  const canViewStaff = can("analytics.viewStaffPerformance");
  const visibleTabs = TABS.filter((t) => t.id !== "staff" || canViewStaff);

  const raw = searchParams.get("tab");
  const activeTab: Tab = raw && visibleTabs.some((t) => t.id === raw) ? (raw as Tab) : (visibleTabs[0]?.id ?? "revenue");

  useEffect(() => {
    if (raw === "staff" && !canViewStaff) {
      router.replace(`?tab=${visibleTabs[0]?.id ?? "revenue"}`, { scroll: false });
    }
  }, [raw, canViewStaff, router, visibleTabs]);

  function handleTabChange(id: Tab) {
    router.replace(`?tab=${id}`, { scroll: false });
  }

  if (!can("analytics.view")) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Term 3 · Deep-dive management view</p>
      </div>

      <div className="flex gap-1 border-b border-slate-200 -mb-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
              activeTab === tab.id
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "revenue"   && <RevenueTab />}
        {activeTab === "occupancy" && <OccupancyTab />}
        {activeTab === "churn"     && <ChurnTab />}
        {activeTab === "staff"     && <StaffTab />}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense>
      <AnalyticsPageContent />
    </Suspense>
  );
}
