"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Plus,
  AlertTriangle,
  PenLine,
  Send,
  ListPlus,
  Clock,
  AlertCircle,
  BookOpen,
  CreditCard,
  UserPlus,
  MessageSquare,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { studentDetail } from "@/lib/mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SUBJECT_COLOR: Record<string, { chip: string; dot: string }> = {
  "Y8 Maths":   { chip: "bg-amber-100 text-amber-800 border border-amber-200",  dot: "bg-amber-500"  },
  "Y8 English": { chip: "bg-teal-100 text-teal-800 border border-teal-200",     dot: "bg-teal-500"   },
  "Y8 Science": { chip: "bg-blue-100 text-blue-800 border border-blue-200",     dot: "bg-blue-500"   },
};

const ENROLMENT_COLOR_CLASSES: Record<"amber" | "teal" | "blue", { header: string; badge: string }> = {
  amber: { header: "bg-amber-50 border-b border-amber-100", badge: "bg-amber-100 text-amber-700" },
  teal:  { header: "bg-teal-50 border-b border-teal-100",   badge: "bg-teal-100 text-teal-700"   },
  blue:  { header: "bg-blue-50 border-b border-blue-100",   badge: "bg-blue-100 text-blue-700"   },
};

// ─── Session Dots ─────────────────────────────────────────────────────────────

function SessionDots({
  attended,
  absent,
  remaining,
}: {
  attended: number;
  absent: number;
  remaining: number;
}) {
  const dots = [
    ...Array(attended).fill("attended"),
    ...Array(absent).fill("absent"),
    ...Array(remaining).fill("remaining"),
  ];
  return (
    <div className="flex flex-wrap gap-1">
      {dots.map((type, i) => (
        <span
          key={i}
          title={type}
          className={cn(
            "w-3 h-3 rounded-full inline-block shrink-0",
            type === "attended"  && "bg-emerald-500",
            type === "absent"    && "bg-red-400",
            type === "remaining" && "border-2 border-slate-300 bg-white",
          )}
        />
      ))}
    </div>
  );
}

// ─── Zone 1 — Profile Header ──────────────────────────────────────────────────

function ProfileHeader() {
  const quickActions: { label: string; Icon: React.ElementType; href?: string }[] = [
    { label: "Create Invoice",    Icon: FileText },
    { label: "Add Enrolment",     Icon: Plus },
    { label: "Raise Concern",     Icon: AlertTriangle },
    { label: "Log Note",          Icon: PenLine },
    { label: "Send Message",      Icon: Send },
    { label: "New Task",          Icon: ListPlus },
    { label: "Mark Attendance",   Icon: BookOpen, href: "/attendance" },
  ];

  return (
    <div className="shrink-0 bg-white border-b border-slate-200 px-6 py-4 z-10">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        {/* Left — Avatar + Name + Badges */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-lg leading-none">AR</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Aisha Rahman</h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5 leading-none">IMI-0001</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border border-slate-300 text-slate-600">
                Year 8
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-600 text-white">
                Lower Secondary
              </span>
              <span className="text-xs text-slate-500">GEMS Wellington Academy</span>
            </div>
          </div>
        </div>

        {/* Right — Status Badges + Quick Actions */}
        <div className="flex flex-col items-end gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500 text-white">
              Active
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
              84 — Critical
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {quickActions.map(({ label, Icon, href }) =>
              href ? (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  {label}
                </Link>
              ) : (
                <button
                  key={label}
                  type="button"
                  aria-label={label}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Zone 2 — Left Sidebar ────────────────────────────────────────────────────

function LeftSidebar({ onTabChange }: { onTabChange: (tab: string) => void }) {
  return (
    <div className="px-4 py-4 space-y-5">

      {/* Quick Stats 2×2 */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Quick Stats</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Attendance This Term", value: "87%"  },
            { label: "Sessions Remaining",   value: "34"   },
            { label: "Credit Balance",        value: "AED 0" },
            { label: "Open Tasks",            value: "2"    },
          ].map(({ label, value }) => (
            <div key={label} className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
              <p className="text-[10px] text-slate-500 leading-tight">{label}</p>
              <p className="text-base font-bold text-slate-800 mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Active Flags */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Active Flags</p>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onTabChange("invoices")}
            className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
          >
            <AlertCircle className="w-3 h-3 shrink-0" />
            1 Overdue Invoice
          </button>
          <button
            type="button"
            onClick={() => onTabChange("concerns")}
            className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            L1 Concern Active
          </button>
          <button
            type="button"
            onClick={() => onTabChange("attendance")}
            className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <Clock className="w-3 h-3 shrink-0" />
            Makeup Expiring
          </button>
        </div>
      </section>

      <div className="border-t border-slate-100" />

      {/* Personal Details */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Personal Details</p>
        <dl className="space-y-1.5">
          {[
            { label: "Date of Birth", value: "12 Mar 2011 (Age 14)" },
            { label: "Gender",        value: "Female"               },
            { label: "Nationality",   value: "Emirati"              },
            { label: "Phone",         value: "+971 50 123 4567"     },
            { label: "WhatsApp",      value: "✓ Same number"        },
            { label: "Email",         value: "fatima.rahman@gmail.com" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <dt className="text-[10px] text-slate-400 leading-none">{label}</dt>
              <dd className="text-xs text-slate-700 font-medium leading-tight mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="border-t border-slate-100" />

      {/* Academic Context */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Academic</p>
        <dl className="space-y-1.5">
          <div>
            <dt className="text-[10px] text-slate-400">Enrolled Courses</dt>
            <dd className="text-xs text-slate-700 font-medium mt-0.5">3</dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-400">Target Grades</dt>
            <dd className="text-xs text-slate-700 font-medium mt-0.5">Maths A*, English A, Science B+</dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-400">Department</dt>
            <dd className="text-xs text-slate-700 font-medium mt-0.5">Lower Secondary</dd>
          </div>
        </dl>
      </section>

      <div className="border-t border-slate-100" />

      {/* Family */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Family</p>
        <div className="space-y-1">
          <p className="text-[10px] text-slate-400">Primary Guardian</p>
          <Link
            href="/students"
            className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
          >
            Fatima Rahman →
          </Link>
          <p className="text-[10px] text-slate-400 mt-1.5">No co-parent linked</p>
        </div>
      </section>

      <div className="border-t border-slate-100" />

      {/* Referral */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Referral</p>
        <dl className="space-y-1.5">
          <div>
            <dt className="text-[10px] text-slate-400">Referred by</dt>
            <dd className="text-xs text-slate-700 font-medium mt-0.5">Omar Al-Farsi (Jan 2024)</dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-400">Referrals made</dt>
            <dd className="text-xs text-slate-700 font-medium mt-0.5">1</dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-400">Tier</dt>
            <dd className="mt-0.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-600">
                Silver
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <div className="border-t border-slate-100" />

      {/* Batches */}
      <section>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Batches</p>
        <div className="flex flex-wrap gap-1.5">
          {["Y8 Maths Mon/Wed", "Y8 English Tue/Thu", "Y8 Science Fri"].map((batch) => (
            <span
              key={batch}
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200"
            >
              {batch}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

// ─── Zone 3 — Tab Bar ─────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",    label: "Overview",          badge: "red",   badgeCount: 1 },
  { id: "calendar",   label: "Calendar",           badge: null,    badgeCount: 0 },
  { id: "attendance", label: "Attendance",         badge: "amber", badgeCount: 1 },
  { id: "invoices",   label: "Invoices",           badge: "red",   badgeCount: 1 },
  { id: "grades",     label: "Grades",             badge: null,    badgeCount: 0 },
  { id: "courses",    label: "Courses",            badge: null,    badgeCount: 0 },
  { id: "comms",      label: "Communication Log",  badge: null,    badgeCount: 0 },
  { id: "tasks",      label: "Tasks",              badge: "amber", badgeCount: 2 },
  { id: "concerns",   label: "Concerns",           badge: "amber", badgeCount: 1 },
  { id: "tickets",    label: "Tickets",            badge: null,    badgeCount: 0 },
  { id: "files",      label: "Files",              badge: null,    badgeCount: 0 },
] as const;

type TabId = typeof TABS[number]["id"];

function TabBar({ activeTab, setActiveTab }: { activeTab: TabId; setActiveTab: (t: TabId) => void }) {
  return (
    <div className="shrink-0 bg-white border-b border-slate-200 px-6 overflow-x-auto">
      <div className="flex items-end gap-0 whitespace-nowrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer shrink-0",
              activeTab === tab.id
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300",
            )}
          >
            {tab.label}
            {tab.badge && (
              <span
                className={cn(
                  "w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center",
                  tab.badge === "red"   ? "bg-red-500 text-white"   : "bg-amber-500 text-white",
                )}
              >
                {tab.badgeCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Tab 1 — Overview ─────────────────────────────────────────────────────────

const ACTIVITY_ICON: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
  invoice:    { Icon: FileText,    color: "text-amber-600",   bg: "bg-amber-50"   },
  absence:    { Icon: XCircle,     color: "text-red-500",     bg: "bg-red-50"     },
  payment:    { Icon: CreditCard,  color: "text-blue-600",    bg: "bg-blue-50"    },
  concern:    { Icon: AlertTriangle, color: "text-red-500",   bg: "bg-red-50"     },
  assignment: { Icon: BookOpen,    color: "text-violet-600",  bg: "bg-violet-50"  },
  session:    { Icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
  enrolment:  { Icon: UserPlus,    color: "text-emerald-600", bg: "bg-emerald-50" },
  message:    { Icon: MessageSquare, color: "text-blue-600",  bg: "bg-blue-50"    },
};

function OverviewTab({ onTabChange }: { onTabChange: (tab: string) => void }) {
  return (
    <div className="space-y-5">
      {/* Flags Strip */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => onTabChange("invoices")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          1 Overdue Invoice — AED 3,200
        </button>
        <button
          type="button"
          onClick={() => onTabChange("concerns")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          L1 Concern — Y8 Maths
        </button>
        <button
          type="button"
          onClick={() => onTabChange("attendance")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 shrink-0" />
          1 Makeup Expiring in 5 days
        </button>
      </div>

      {/* Churn + Retention Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Churn Risk</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-red-500">84</span>
            <div className="mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Critical</span>
              <p className="text-xs text-slate-500 mt-1">Missed 3+ sessions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Retention Confidence</p>
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-red-500">32</span>
            <div className="mb-1">
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Low</span>
              <p className="text-xs text-slate-500 mt-1">No re-enrolment confirmed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolment Cards */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Active Enrolments</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {studentDetail.enrolments.map((enr) => {
            const cls = ENROLMENT_COLOR_CLASSES[enr.color];
            return (
              <div key={enr.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className={cn("px-4 py-3 flex items-center justify-between", cls.header)}>
                  <p className="text-sm font-bold text-slate-800">{enr.subject}</p>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold",
                      enr.packageStatus === "Expiring"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700",
                    )}
                  >
                    {enr.packageStatus}
                  </span>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs text-slate-600">{enr.teacher}</p>
                  <p className="text-xs text-slate-500">{enr.schedule}</p>
                  <SessionDots
                    attended={enr.sessionsAttended}
                    absent={enr.sessionsAbsent}
                    remaining={enr.sessionsRemaining}
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-400">{enr.sessionsTotal} sessions total</span>
                    <span className="text-xs font-semibold text-slate-700">{enr.sessionsRemaining} remaining</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Upcoming Sessions</p>
        <div className="space-y-2">
          {studentDetail.upcomingSessions.map((s, i) => {
            const subjectColor = SUBJECT_COLOR[s.subject];
            return (
              <div key={i} className="flex items-center gap-3 py-1.5">
                <div className={cn("w-2 h-2 rounded-full shrink-0", subjectColor?.dot ?? "bg-slate-300")} />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-semibold text-slate-700 shrink-0">{s.date}</span>
                  <span className="text-sm text-slate-500 shrink-0">{s.time}</span>
                  <span className="text-sm text-slate-800 font-medium shrink-0">{s.subject}</span>
                  <span className="text-xs text-slate-400 truncate">{s.teacher}</span>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{s.room}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Recent Activity</p>
        <div className="space-y-3">
          {studentDetail.activityTimeline.map((event, i) => {
            const meta = ACTIVITY_ICON[event.type] ?? { Icon: AlertCircle, color: "text-slate-500", bg: "bg-slate-50" };
            const { Icon, color, bg } = meta;
            return (
              <div key={i} className="flex items-start gap-3">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5", bg)}>
                  <Icon className={cn("w-3.5 h-3.5", color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">{event.description}</p>
                </div>
                <span className="text-[11px] text-slate-400 shrink-0 mt-0.5 whitespace-nowrap">{event.timeAgo}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2 — Calendar ─────────────────────────────────────────────────────────

const CAL_DAYS = [
  { label: "Mon", date: "21" },
  { label: "Tue", date: "22" },
  { label: "Wed", date: "23" },
  { label: "Thu", date: "24" },
  { label: "Fri", date: "25" },
];
const CAL_HOURS = [13, 14, 15, 16, 17, 18, 19, 20];

const CAL_SESSIONS: Record<string, Record<number, { subject: string; teacher: string; color: string }>> = {
  Mon: { 15: { subject: "Y8 Maths",   teacher: "Mr Ahmed Khalil",  color: "bg-amber-100 border-amber-300 text-amber-900" } },
  Tue: { 16: { subject: "Y8 English", teacher: "Ms Sarah Mitchell", color: "bg-teal-100 border-teal-300 text-teal-900"   } },
  Wed: { 15: { subject: "Y8 Maths",   teacher: "Mr Ahmed Khalil",  color: "bg-amber-100 border-amber-300 text-amber-900" } },
  Thu: { 16: { subject: "Y8 English", teacher: "Ms Sarah Mitchell", color: "bg-teal-100 border-teal-300 text-teal-900"   } },
  Fri: { 14: { subject: "Y8 Science", teacher: "Mr Tariq Al-Amin", color: "bg-blue-100 border-blue-300 text-blue-900"    } },
};

function CalendarTab() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100">
        <p className="text-xs text-slate-400">
          Week of Mon 21 Apr – Fri 25 Apr · Changes are made in Timetable
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="w-14 border-r border-slate-100" />
              {CAL_DAYS.map((d) => (
                <th
                  key={d.label}
                  className="text-center py-3 border-r border-slate-100 last:border-r-0 font-semibold text-slate-700"
                >
                  <span className="block text-xs text-slate-400 font-normal">{d.label}</span>
                  <span className="text-sm">{d.date}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CAL_HOURS.map((hour) => (
              <tr key={hour} className="border-t border-slate-100">
                <td className="border-r border-slate-100 px-2 py-0 w-14 text-right">
                  <span className="text-[10px] text-slate-400">{hour}:00</span>
                </td>
                {CAL_DAYS.map((d) => {
                  const session = CAL_SESSIONS[d.label]?.[hour];
                  return (
                    <td key={d.label} className="border-r border-slate-100 last:border-r-0 p-1 h-12 align-top">
                      {session && (
                        <div
                          className={cn(
                            "h-full rounded border px-2 py-1 text-left overflow-hidden",
                            session.color,
                          )}
                        >
                          <p className="text-[11px] font-bold leading-tight truncate">{session.subject}</p>
                          <p className="text-[10px] leading-tight truncate opacity-70">{session.teacher}</p>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 3 — Attendance ───────────────────────────────────────────────────────

function AttendanceTab() {
  const { termRate, allTimeRate, consecutiveAbsences, noShows } = studentDetail.attendanceSummary;
  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Attendance This Term",  value: termRate              },
          { label: "All-Time Attendance",    value: allTimeRate           },
          { label: "Consecutive Absences",  value: consecutiveAbsences   },
          { label: "No-Shows",              value: noShows               },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          </div>
        ))}
      </div>

      {/* Per-subject cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {studentDetail.attendanceBySubject.map((s) => (
          <div key={s.subject} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-slate-800">{s.subject}</p>
              <span className="text-lg font-black text-slate-700">{s.rate}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              <div><span className="text-slate-400">Attended</span><span className="ml-1 font-semibold text-slate-700">{s.attended}</span></div>
              <div><span className="text-slate-400">Absent</span><span className="ml-1 font-semibold text-red-600">{s.absent}</span></div>
              <div><span className="text-slate-400">Makeup left</span><span className="ml-1 font-semibold text-slate-700">{s.makeupAllowance}</span></div>
              <div><span className="text-slate-400">Makeups used</span><span className="ml-1 font-semibold text-slate-700">{s.makeupUsed}</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Makeup Log */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Makeup Log</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Session", "Subject", "Makeup Date", "Status"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {studentDetail.makeupLog.map((m, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5 text-slate-700">{m.session}</td>
                <td className="px-4 py-2.5 text-slate-700">{m.subject}</td>
                <td className="px-4 py-2.5 text-slate-700">{m.makeupDate}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      m.status === "Completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {m.status}
                    {m.expiring && " ⚠️ Expiring"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Attendance History */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Attendance History</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Date", "Subject", "Status"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {studentDetail.attendanceHistory.map((row, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5 text-slate-700">{row.date}</td>
                <td className="px-4 py-2.5">
                  <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", SUBJECT_COLOR[row.subject]?.chip ?? "bg-slate-100 text-slate-600")}>
                    {row.subject}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      row.status === "Present" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
                    )}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 4 — Invoices ─────────────────────────────────────────────────────────

function InvoicesTab() {
  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Invoiced This Term", value: "AED 9,600" },
          { label: "Collected",                value: "AED 6,400" },
          { label: "Outstanding",              value: "AED 3,200", highlight: true },
        ].map(({ label, value, highlight }) => (
          <div key={label} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className={cn("text-xl font-bold mt-1", highlight ? "text-red-600" : "text-slate-800")}>{value}</p>
          </div>
        ))}
      </div>

      {/* Invoice table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["#", "Date", "Description", "Amount", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {studentDetail.invoices.map((inv) => (
              <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{inv.id}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{inv.date}</td>
                <td className="px-4 py-3 text-slate-700">{inv.description}</td>
                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{inv.amount}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      inv.status === "Overdue"
                        ? "bg-red-100 text-red-700"
                        : inv.status === "Paid"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {inv.status === "Paid" ? "✓ Paid" : inv.status === "Overdue" ? "Overdue" : inv.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {inv.status === "Overdue" && (
                      <button type="button" className="text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors cursor-pointer whitespace-nowrap">
                        Record Payment
                      </button>
                    )}
                    <Link href="/finance" className="text-xs text-slate-500 hover:text-amber-600 font-medium transition-colors cursor-pointer">
                      View Invoice
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 5 — Grades ───────────────────────────────────────────────────────────

function GradeAccordion({ subject, data }: { subject: string; data: typeof studentDetail.grades.maths }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          <span className="font-semibold text-slate-800">{subject}</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
            Target: {data.target}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
            Predicted: {data.predicted}
          </span>
        </div>
      </button>
      {open && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              {["Assignment", "Due", "Submitted", "Score", "Status"].map((h) => (
                <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.assignments.map((a, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2.5 text-slate-700 font-medium">{a.title}</td>
                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{a.due}</td>
                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{a.submitted}</td>
                <td className="px-4 py-2.5 font-semibold text-slate-800">{a.score}</td>
                <td className="px-4 py-2.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function GradesTab() {
  return (
    <div className="space-y-4">
      <GradeAccordion subject="Y8 Maths"   data={studentDetail.grades.maths}   />
      <GradeAccordion subject="Y8 English" data={studentDetail.grades.english} />
    </div>
  );
}

// ─── Tab 6 — Courses ──────────────────────────────────────────────────────────

function CoursesTab() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Enrolments</p>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">3 Active</span>
      </div>
      {studentDetail.enrolments.map((enr) => {
        const cls = ENROLMENT_COLOR_CLASSES[enr.color];
        return (
          <div key={enr.id} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            <div className={cn("px-4 py-3 flex items-center justify-between", cls.header)}>
              <div className="flex items-center gap-3">
                <p className="font-bold text-slate-800">{enr.subject}</p>
                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", cls.badge)}>
                  {enr.color === "amber" ? "Amber" : enr.color === "teal" ? "Teal" : "Blue"} subject
                </span>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold",
                    enr.packageStatus === "Expiring" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
                  )}
                >
                  {enr.packageStatus}
                </span>
              </div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-xs">
              <div><p className="text-slate-400">Teacher</p><p className="text-slate-700 font-medium mt-0.5">{enr.teacher}</p></div>
              <div><p className="text-slate-400">Schedule</p><p className="text-slate-700 font-medium mt-0.5">{enr.schedule}</p></div>
              <div><p className="text-slate-400">Package Start</p><p className="text-slate-700 font-medium mt-0.5">{enr.packageStart}</p></div>
              <div><p className="text-slate-400">Sessions</p><p className="text-slate-700 font-medium mt-0.5">{enr.sessionsRemaining} of {enr.sessionsPurchased} remaining</p></div>
            </div>
          </div>
        );
      })}
      <div className="mt-4 px-4 py-3 rounded-lg border border-slate-100 bg-slate-50 text-xs text-slate-400 text-center">
        No withdrawn enrolments
      </div>
    </div>
  );
}

// ─── Tab 7 — Communication Log ────────────────────────────────────────────────

function CommLogTab() {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            {["Date", "Channel", "Message", "Sent by", "Status"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {studentDetail.communicationLog.map((row, i) => (
            <tr key={i} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.date}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-semibold",
                    row.channel === "WhatsApp" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700",
                  )}
                >
                  {row.channel}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-700">{row.message}</td>
              <td className="px-4 py-3 text-slate-500">{row.sentBy}</td>
              <td className="px-4 py-3 text-slate-500 text-xs">{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tab 8 — Tasks ────────────────────────────────────────────────────────────

function TasksTab() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Open Tasks</p>
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          New Task
        </button>
      </div>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {["Task", "Priority", "Assigned to", "Due", "Status"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {studentDetail.tasks.map((t, i) => (
              <tr key={i} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3 text-slate-700 font-medium">{t.task}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-semibold",
                      t.priority === "High"   ? "bg-red-100 text-red-700"    :
                      t.priority === "Medium" ? "bg-amber-100 text-amber-700" :
                                                "bg-slate-100 text-slate-600",
                    )}
                  >
                    {t.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{t.assignedTo}</td>
                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{t.due}</td>
                <td className="px-4 py-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                    Open
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab 9 — Concerns ─────────────────────────────────────────────────────────

function ConcernsTab() {
  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Active Concerns</p>
      {studentDetail.concerns.map((c, i) => (
        <div key={i} className="bg-white rounded-lg border-2 border-amber-300 shadow-sm p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                {c.level}
              </span>
              <span className="text-sm font-bold text-slate-800">{c.subject}</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
              {c.status}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-400">Trigger</dt>
              <dd className="text-slate-700 font-medium mt-0.5">{c.trigger}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Level</dt>
              <dd className="text-slate-700 font-medium mt-0.5">{c.levelLabel}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Raised</dt>
              <dd className="text-slate-700 font-medium mt-0.5">{c.raised} by {c.raisedBy}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Assigned to</dt>
              <dd className="text-slate-700 font-medium mt-0.5">{c.assignedTo}</dd>
            </div>
          </dl>
        </div>
      ))}
      <div className="mt-2 px-4 py-3 rounded-lg border border-slate-100 bg-slate-50 text-xs text-slate-400 text-center">
        No dismissed concerns
      </div>
    </div>
  );
}

// ─── Tab 10 — Tickets ────────────────────────────────────────────────────────

function TicketsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
        <FileText className="w-7 h-7 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-500">No complaint tickets raised for this student.</p>
      <p className="text-xs text-slate-400">Tickets will appear here once raised.</p>
    </div>
  );
}

// ─── Tab 11 — Files ──────────────────────────────────────────────────────────

function FilesTab() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
        <Upload className="w-7 h-7 text-slate-300" />
      </div>
      <p className="text-sm font-medium text-slate-500">No files uploaded for this student.</p>
      <button
        type="button"
        className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-slate-200 text-sm font-medium text-slate-600 hover:border-amber-300 hover:text-amber-700 transition-colors cursor-pointer"
      >
        <Upload className="w-3.5 h-3.5" />
        Upload File
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  useParams(); // ensures the [id] route is matched

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Deep-link: read ?tab= query param on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get("tab") as TabId | null;
    if (tab && TABS.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, []);

  function handleTabChange(tab: string) {
    setActiveTab(tab as TabId);
  }

  return (
    <div
      className="-m-6 flex flex-col overflow-hidden"
      style={{ height: "calc(100dvh - 56px)" }}
    >
      {/* ── Zone 1: Profile Header ──────────────────────────────────────────── */}
      <ProfileHeader />

      {/* ── Zones 2 + 3: Sidebar + Main Panel ──────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Zone 2: Left Sidebar ──────────────────────────────────────────── */}
        <aside className="w-[260px] shrink-0 border-r border-slate-200 overflow-y-auto bg-white">
          <LeftSidebar onTabChange={handleTabChange} />
        </aside>

        {/* ── Zone 3: Main Panel ────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Tab Bar */}
          <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
            {activeTab === "overview"    && <OverviewTab    onTabChange={handleTabChange} />}
            {activeTab === "calendar"    && <CalendarTab    />}
            {activeTab === "attendance"  && <AttendanceTab  />}
            {activeTab === "invoices"    && <InvoicesTab    />}
            {activeTab === "grades"      && <GradesTab      />}
            {activeTab === "courses"     && <CoursesTab     />}
            {activeTab === "comms"       && <CommLogTab     />}
            {activeTab === "tasks"       && <TasksTab       />}
            {activeTab === "concerns"    && <ConcernsTab    />}
            {activeTab === "tickets"     && <TicketsTab     />}
            {activeTab === "files"       && <FilesTab       />}
          </div>
        </div>
      </div>
    </div>
  );
}
