"use client";

import { useState, useEffect } from "react";
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
} from "recharts";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  churnRiskStudents,
  staffMembers,
  occupancyHeatmap,
  type ChurnRiskStudent,
} from "@/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "Revenue" | "Occupancy" | "Churn" | "Staff";

// ─── Mock data ────────────────────────────────────────────────────────────────

const revenueDeptData = [
  { month: "Nov", Primary: 82000, LowerSec: 58000, Senior: 58000 },
  { month: "Dec", Primary: 98000, LowerSec: 72000, Senior: 71000 },
  { month: "Jan", Primary: 109000, LowerSec: 81000, Senior: 77000 },
  { month: "Feb", Primary: 104000, LowerSec: 78000, Senior: 73000 },
  { month: "Mar", Primary: 112000, LowerSec: 84000, Senior: 75000 },
  { month: "Apr", Primary: 118000, LowerSec: 91000, Senior: 75000 },
];

const revenueBySubject = [
  { subject: "Y12 Maths", revenue: 48200 },
  { subject: "Y10 Physics", revenue: 41600 },
  { subject: "Y11 Chemistry", revenue: 38900 },
  { subject: "Y8 Maths", revenue: 36400 },
  { subject: "Y9 Science", revenue: 31200 },
  { subject: "Y6 Maths", revenue: 28800 },
];

const revenueByTeacher = [
  { teacher: "Mr Faris Al-Amin", sessions: 64, actual: 91200, expected: 96000, variance: -4800 },
  { teacher: "Mr Ahmed Khalil", sessions: 56, actual: 79400, expected: 81600, variance: -2200 },
  { teacher: "Ms Sarah Mitchell", sessions: 48, actual: 68200, expected: 70400, variance: -2200 },
  { teacher: "Mr Tariq Al-Amin", sessions: 44, actual: 62400, expected: 64000, variance: -1600 },
  { teacher: "Ms Hana Yusuf", sessions: 40, actual: 56800, expected: 58000, variance: -1200 },
];

const occupancyRooms = [
  { room: "Room 3A", capacity: 8, sessions: 8, avgUtil: 81, peakUtil: 100, status: "On Target" },
  { room: "Room 1A", capacity: 6, sessions: 7, avgUtil: 77, peakUtil: 100, status: "Near Target" },
  { room: "Room 2A", capacity: 6, sessions: 6, avgUtil: 72, peakUtil: 83, status: "Near Target" },
  { room: "Room 2B", capacity: 4, sessions: 5, avgUtil: 65, peakUtil: 75, status: "Near Target" },
  { room: "Room 1C", capacity: 4, sessions: 4, avgUtil: 58, peakUtil: 75, status: "Monitor" },
];

const churnByDept = [
  { name: "Primary", value: 18 },
  { name: "Lower Sec", value: 17 },
  { name: "Senior", value: 12 },
];

const churnSignals = [
  { signal: "Missed 3+ Sessions", count: 24 },
  { signal: "Overdue Invoice", count: 18 },
  { signal: "Teaching Quality Concern", count: 11 },
  { signal: "Inconsistency", count: 9 },
  { signal: "NPS Low", count: 6 },
];

const staffFeedback = [
  { teacher: "Ms Hana Yusuf", score: 4.7 },
  { teacher: "Mr Ahmed Khalil", score: 4.5 },
  { teacher: "Ms Sarah Mitchell", score: 4.4 },
  { teacher: "Mr Faris Al-Amin", score: 4.2 },
  { teacher: "Mr Tariq Al-Amin", score: 4.0 },
  { teacher: "Nadia Al-Hassan", score: 3.8 },
];

const staffMetaByName: Record<string, { feedback: number; attendance: number; compliance: number }> = {
  "Hana Yusuf":      { feedback: 4.7, attendance: 98, compliance: 100 },
  "Ahmed Khalil":    { feedback: 4.5, attendance: 96, compliance: 93  },
  "Sarah Mitchell":  { feedback: 4.4, attendance: 97, compliance: 95  },
  "Faris Al-Amin":   { feedback: 4.2, attendance: 94, compliance: 88  },
  "Tariq Al-Amin":   { feedback: 4.0, attendance: 95, compliance: 91  },
  "Nadia Al-Hassan": { feedback: 3.8, attendance: 99, compliance: 97  },
  "Khalil Mansouri": { feedback: 3.6, attendance: 93, compliance: 85  },
};

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

// ─── Tab: Revenue ─────────────────────────────────────────────────────────────

function RevenueTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Term 3 Revenue" value="AED 284,500" />
        <StatCard label="Collected" value="AED 241,200" />
        <StatCard label="Outstanding" value="AED 43,300" />
        <StatCard label="Predicted Month-End" value="AED 312,000" accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Stacked bar by dept */}
        <Card>
          <CardTitle>Revenue by Department</CardTitle>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueDeptData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${v / 1000}k`} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: unknown, name: unknown) => [`AED ${((value as number) / 1000).toFixed(0)}k`, name as string]}
                contentStyle={{ fontSize: 12, borderRadius: 6 }}
              />
              <Legend iconType="square" iconSize={8} wrapperStyle={{ fontSize: 11, color: "#64748B" }} />
              <Bar dataKey="Primary" stackId="a" fill={DEPT_COLORS.Primary} />
              <Bar dataKey="LowerSec" stackId="a" fill={DEPT_COLORS.LowerSec} />
              <Bar dataKey="Senior" stackId="a" fill={DEPT_COLORS.Senior} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Horizontal bar by subject */}
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

      {/* Revenue by teacher table */}
      <Card>
        <CardTitle>Revenue by Teacher</CardTitle>
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
              {revenueByTeacher.map((row) => (
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
      </Card>
    </div>
  );
}

// ─── Tab: Occupancy ───────────────────────────────────────────────────────────

const HEATMAP_TIMES = ["14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "20:30"];
const HEATMAP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

function OccupancyTab() {
  const cellMap = new Map(occupancyHeatmap.map((c) => [`${c.day}-${c.time}`, c.occupancy]));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Overall Occupancy" value="74%" />
        <StatCard label="Peak Hours Avg (15:00–19:00)" value="88%" />
        <StatCard label="Low Occupancy Sessions" value="6" />
      </div>
      <p className="text-xs text-slate-400 -mt-2">
        Target: <span className="font-medium text-slate-600">80%</span> · Threshold:{" "}
        <span className="font-medium text-slate-600">50%</span>
      </p>

      <Card>
        <CardTitle>Occupancy Heatmap — All Days</CardTitle>
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            {/* Day column headers */}
            <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
              <div />
              {HEATMAP_DAYS.map((d) => (
                <div key={d} className="text-center text-xs font-semibold text-slate-500">{d}</div>
              ))}
            </div>
            {/* Time rows */}
            {HEATMAP_TIMES.map((time) => (
              <div key={time} className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: "56px repeat(5, 1fr)" }}>
                <div className="text-right pr-2 text-[11px] text-slate-400 flex items-center justify-end">{time}</div>
                {HEATMAP_DAYS.map((day) => {
                  const pct = cellMap.get(`${day}-${time}`) ?? 0;
                  return (
                    <div key={day} className={cn("rounded text-center py-2 text-xs font-medium", getOccupancyColor(pct))}>
                      {pct}%
                    </div>
                  );
                })}
              </div>
            ))}
            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-100 border border-slate-200 inline-block" /> Empty
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-100 inline-block" /> Low
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-300 inline-block" /> Moderate
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Good
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-700 inline-block" /> Full
              </span>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Occupancy by Room</CardTitle>
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
              {occupancyRooms.map((row) => (
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
      </Card>
    </div>
  );
}

// ─── Tab: Churn ───────────────────────────────────────────────────────────────

function ChurnTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="At-Risk Students" value="47" />
        <StatCard label="Critical (≥70)" value="12" />
        <StatCard label="Medium (40–69)" value="35" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut chart */}
        <Card>
          <CardTitle>Churn by Department</CardTitle>
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={churnByDept} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {churnByDept.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: unknown) => [`${v as number} students`, ""]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 text-sm flex-shrink-0">
              {churnByDept.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full inline-block flex-shrink-0" style={{ background: DONUT_COLORS[i] }} />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="font-semibold text-slate-800 ml-3">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Signals bar */}
        <Card>
          <CardTitle>Top Churn Signals</CardTitle>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={churnSignals} layout="vertical" barCategoryGap="30%" margin={{ left: 8, right: 32 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="signal" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={148} />
              <Tooltip formatter={(v: unknown) => [`${v as number} students`, "Count"]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Churn risk table */}
      <Card>
        <CardTitle>Churn Risk Students</CardTitle>
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
              {churnRiskStudents.map((s) => (
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
      </Card>
    </div>
  );
}

// ─── Tab: Staff Performance ───────────────────────────────────────────────────

function StaffTab() {
  const teachingStaff = staffMembers.filter((s) => s.role === "Teacher" || s.role === "HOD");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Avg Feedback Score" value="4.3 / 5" />
        <StatCard label="48h Marking Compliance" value="91%" />
        <StatCard label="CPD Completion Rate" value="68%" />
      </div>

      {/* Feedback bar chart */}
      <Card>
        <CardTitle>Avg Feedback Score by Teacher</CardTitle>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={staffFeedback} layout="vertical" barCategoryGap="28%" margin={{ left: 8, right: 56 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
            <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="teacher" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={120} />
            <Tooltip formatter={(v: unknown) => [`${v as number} / 5`, "Score"]} contentStyle={{ fontSize: 12, borderRadius: 6 }} />
            <Bar dataKey="score" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Staff table */}
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
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string }[] = [
  { id: "Revenue", label: "Revenue" },
  { id: "Occupancy", label: "Occupancy" },
  { id: "Churn", label: "Churn" },
  { id: "Staff", label: "Staff Performance" },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Revenue");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const tabMap: Record<string, Tab> = {
      revenue:   "Revenue",
      occupancy: "Occupancy",
      churn:     "Churn",
      staff:     "Staff",
    };
    if (tab && tabMap[tab]) setActiveTab(tabMap[tab]);
  }, []);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Term 3 · Deep-dive management view</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 -mb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

      {/* Tab content */}
      <div>
        {activeTab === "Revenue"   && <RevenueTab />}
        {activeTab === "Occupancy" && <OccupancyTab />}
        {activeTab === "Churn"     && <ChurnTab />}
        {activeTab === "Staff"     && <StaffTab />}
      </div>
    </div>
  );
}
