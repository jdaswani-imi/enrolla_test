"use client";

import { useState, Fragment } from "react";
import {
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Check,
  FileText,
  CalendarPlus,
  Eye,
  Bell,
  MoreHorizontal,
  BookOpen,
  Users,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  timetableSessions,
  students as allStudents,
  unmarkedSessions,
  absenceSummary,
  makeupLog,
} from "@/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceStatus = "Unmarked" | "Present" | "Late" | "Absent-Notified" | "Absent-NoNotice";
type SessionMark = "Unmarked" | "In Progress" | "Complete";
type MainTab = "register" | "overview";
type OverviewTab = "unmarked" | "absence" | "makeup";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_BTNS: {
  key: AttendanceStatus;
  label: string;
  activeClass: string;
  inactiveClass: string;
}[] = [
  {
    key: "Present",
    label: "Present",
    activeClass: "bg-emerald-500 text-white border-emerald-500 relative z-10",
    inactiveClass: "bg-white text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700",
  },
  {
    key: "Late",
    label: "Late",
    activeClass: "bg-amber-500 text-white border-amber-500 relative z-10",
    inactiveClass: "bg-white text-slate-600 border-slate-200 hover:bg-amber-50 hover:text-amber-700",
  },
  {
    key: "Absent-Notified",
    label: "Abs. Notified",
    activeClass: "bg-orange-500 text-white border-orange-500 relative z-10",
    inactiveClass: "bg-white text-slate-600 border-slate-200 hover:bg-orange-50 hover:text-orange-700",
  },
  {
    key: "Absent-NoNotice",
    label: "Abs. No Notice",
    activeClass: "bg-red-500 text-white border-red-500 relative z-10",
    inactiveClass: "bg-white text-slate-600 border-slate-200 hover:bg-red-50 hover:text-red-700",
  },
];

const SESSION_PILL: Record<SessionMark, { label: string; className: string }> = {
  Unmarked:      { label: "Unmarked",    className: "bg-slate-100 text-slate-600"    },
  "In Progress": { label: "In Progress", className: "bg-amber-100 text-amber-700"    },
  Complete:      { label: "Complete",    className: "bg-emerald-100 text-emerald-700" },
};

const ABSENCE_PILL: Record<string, string> = {
  "Allowance Exhausted": "bg-red-100 text-red-700",
  "Consecutive Alert":   "bg-amber-100 text-amber-700",
  Monitor:               "bg-yellow-100 text-yellow-700",
  Normal:                "bg-emerald-100 text-emerald-700",
};

const MAKEUP_PILL: Record<string, string> = {
  Completed: "bg-emerald-100 text-emerald-700",
  Confirmed: "bg-blue-100 text-blue-700",
  Pending:   "bg-amber-100 text-amber-700",
  Expired:   "bg-red-100 text-red-700",
};

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "bg-amber-100",   text: "text-amber-700"   },
  { bg: "bg-teal-100",    text: "text-teal-700"    },
  { bg: "bg-blue-100",    text: "text-blue-700"    },
  { bg: "bg-violet-100",  text: "text-violet-700"  },
  { bg: "bg-rose-100",    text: "text-rose-700"    },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
];

function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Build name → year group map from all students
const STUDENT_YEAR: Record<string, string> = {};
allStudents.forEach(s => { STUDENT_YEAR[s.name] = s.yearGroup; });

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AttendancePage() {
  const [mainTab, setMainTab]       = useState<MainTab>("register");
  const [selectedId, setSelectedId] = useState("s001");
  const [completed, setCompleted]   = useState<Set<string>>(new Set());
  const [attendance, setAttState]   = useState<Record<string, Record<string, AttendanceStatus>>>({});
  const [notes, setNotes]           = useState<Record<string, string>>({});
  const [openNote, setOpenNote]     = useState<string | null>(null);
  const [openMenu, setOpenMenu]     = useState<string | null>(null);
  const [overviewTab, setOverviewTab] = useState<OverviewTab>("unmarked");

  const todaySessions   = timetableSessions.filter(s => s.day === "Mon");
  const selectedSession = todaySessions.find(s => s.id === selectedId) ?? todaySessions[0];

  // ── State helpers ─────────────────────────────────────────────────────────

  function getSessionMark(sessionId: string): SessionMark {
    if (completed.has(sessionId)) return "Complete";
    const att = attendance[sessionId];
    if (!att) return "Unmarked";
    return Object.values(att).some(v => v !== "Unmarked") ? "In Progress" : "Unmarked";
  }

  function getStudentStatus(sessionId: string, student: string): AttendanceStatus {
    return attendance[sessionId]?.[student] ?? "Unmarked";
  }

  function setStudentStatus(sessionId: string, student: string, status: AttendanceStatus) {
    setAttState(prev => ({
      ...prev,
      [sessionId]: { ...(prev[sessionId] ?? {}), [student]: status },
    }));
    setOpenMenu(null);
  }

  function markAllPresent(sessionId: string, students: string[]) {
    const patch: Record<string, AttendanceStatus> = {};
    students.forEach(s => { patch[s] = "Present"; });
    setAttState(prev => ({ ...prev, [sessionId]: patch }));
  }

  function confirmSession(sessionId: string) {
    setCompleted(prev => new Set([...prev, sessionId]));
  }

  function statusLabel(s: AttendanceStatus): string {
    if (s === "Absent-Notified") return "Absent — Notified";
    if (s === "Absent-NoNotice") return "Absent — No Notice";
    if (s === "Unmarked")        return "Not Marked";
    return s;
  }

  function statusBadgeClass(s: AttendanceStatus): string {
    if (s === "Present")         return "bg-emerald-100 text-emerald-700";
    if (s === "Late")            return "bg-amber-100 text-amber-700";
    if (s === "Absent-Notified") return "bg-orange-100 text-orange-700";
    if (s === "Absent-NoNotice") return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-500";
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col bg-[#F8FAFC]"
      style={{ minHeight: "calc(100vh - 56px)" }}
      onClick={() => { if (openMenu) setOpenMenu(null); }}
    >
      {/* Page header */}
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-2xl font-bold text-slate-900">Attendance</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Mon 21 Apr 2025 · {todaySessions.length} sessions today
        </p>
      </div>

      {/* Main tab bar */}
      <div className="px-6 mt-4">
        <div className="flex gap-6 border-b border-slate-200">
          {(
            [
              { key: "register" as MainTab, label: "Today's Register" },
              { key: "overview" as MainTab, label: "Attendance Overview" },
            ] as const
          ).map(tab => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key)}
              className={cn(
                "pb-3 text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer",
                mainTab === tab.key
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-700",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 1 — Today's Register
      ═══════════════════════════════════════════════════════════════════ */}
      {mainTab === "register" && (
        <div className="flex flex-1 overflow-hidden">

          {/* Left panel — session list */}
          <div className="w-80 shrink-0 border-r border-slate-200 overflow-y-auto bg-white">
            <div className="p-3 space-y-1.5">
              {todaySessions.map(session => {
                const mark       = getSessionMark(session.id);
                const pill       = SESSION_PILL[mark];
                const isSelected = session.id === selectedId;

                return (
                  <button
                    key={session.id}
                    onClick={() => { setSelectedId(session.id); setOpenNote(null); setOpenMenu(null); }}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-colors cursor-pointer",
                      isSelected
                        ? "border-amber-200 border-l-4 border-l-amber-500 bg-amber-50"
                        : "border-slate-200 hover:bg-slate-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-sm text-slate-900 leading-tight">
                        {session.subject}
                      </span>
                      <span className={cn("shrink-0 text-xs font-medium px-2 py-0.5 rounded-full", pill.className)}>
                        {pill.label}
                      </span>
                    </div>
                    <div className="mt-1.5 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{session.startTime}–{session.endTime}</span>
                        <span className="text-slate-300">·</span>
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{session.room}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate">{session.teacher}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Users className="w-3 h-3 shrink-0" />
                        <span>
                          {session.studentCount} student{session.studentCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right panel — register */}
          <div className="flex-1 overflow-y-auto">
            {selectedSession && (
              <div className="p-6 max-w-5xl">

                {/* Register header */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      {selectedSession.subject} — Mon 21 Apr,{" "}
                      {selectedSession.startTime}–{selectedSession.endTime}
                    </h2>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {selectedSession.room} · {selectedSession.teacher}
                    </p>
                  </div>
                  {!completed.has(selectedSession.id) && selectedSession.students.length > 0 && (
                    <button
                      onClick={() => markAllPresent(selectedSession.id, selectedSession.students)}
                      className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Mark All Present
                    </button>
                  )}
                </div>

                {/* Empty state (meetings / no students) */}
                {selectedSession.students.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 py-14 flex flex-col items-center gap-2 text-center">
                    <Users className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">No students enrolled in this session.</p>
                    <p className="text-xs text-slate-400">Attendance marking is not required.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-52">
                            Student
                          </th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                            Status
                          </th>
                          <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-16">
                            Notes
                          </th>
                          <th className="w-8 px-2 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedSession.students.map(student => {
                          const status   = getStudentStatus(selectedSession.id, student);
                          const noteKey  = `${selectedSession.id}:${student}`;
                          const palette  = getAvatarPalette(student);
                          const isDone   = completed.has(selectedSession.id);
                          const menuOpen = openMenu === noteKey;
                          const noteOpen = openNote === noteKey;
                          const year     = STUDENT_YEAR[student] ?? "";

                          return (
                            <Fragment key={student}>
                              <tr className="hover:bg-slate-50/60 transition-colors">

                                {/* Student name + year */}
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className={cn(
                                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                      palette.bg, palette.text,
                                    )}>
                                      {getInitials(student)}
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-slate-900">{student}</div>
                                      {year && <div className="text-xs text-slate-400">{year}</div>}
                                    </div>
                                  </div>
                                </td>

                                {/* Status buttons / confirmed badge */}
                                <td className="px-4 py-3">
                                  {isDone ? (
                                    <span className={cn(
                                      "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                                      statusBadgeClass(status),
                                    )}>
                                      {statusLabel(status)}
                                    </span>
                                  ) : (
                                    <div className="flex">
                                      {STATUS_BTNS.map((btn, i) => (
                                        <button
                                          key={btn.key}
                                          onClick={() => setStudentStatus(selectedSession.id, student, btn.key)}
                                          className={cn(
                                            "px-3 py-1.5 text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap",
                                            i === 0 ? "rounded-l-md" : "-ml-px",
                                            i === STATUS_BTNS.length - 1 ? "rounded-r-md" : "",
                                            status === btn.key ? btn.activeClass : btn.inactiveClass,
                                          )}
                                        >
                                          {btn.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </td>

                                {/* Notes toggle */}
                                <td className="px-4 py-3">
                                  <button
                                    onClick={() => setOpenNote(noteOpen ? null : noteKey)}
                                    title="Add note"
                                    className={cn(
                                      "p-1.5 rounded-md transition-colors cursor-pointer",
                                      noteOpen || notes[noteKey]
                                        ? "text-amber-600 bg-amber-50"
                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
                                    )}
                                  >
                                    <FileText className="w-4 h-4" />
                                  </button>
                                </td>

                                {/* More menu */}
                                <td className="px-2 py-3">
                                  {!isDone && (
                                    <div className="relative" onClick={e => e.stopPropagation()}>
                                      <button
                                        onClick={() => setOpenMenu(menuOpen ? null : noteKey)}
                                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                      >
                                        <MoreHorizontal className="w-4 h-4" />
                                      </button>
                                      {menuOpen && (
                                        <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 w-36">
                                          <button
                                            onClick={() => setStudentStatus(selectedSession.id, student, "Absent-NoNotice")}
                                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                          >
                                            No Show
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </td>
                              </tr>

                              {/* Inline notes row */}
                              {noteOpen && (
                                <tr>
                                  <td colSpan={4} className="px-4 pb-3 pt-0 bg-slate-50/40">
                                    <div className="pl-10">
                                      <textarea
                                        autoFocus
                                        value={notes[noteKey] ?? ""}
                                        onChange={e =>
                                          setNotes(prev => ({ ...prev, [noteKey]: e.target.value }))
                                        }
                                        placeholder="Add a note for this student…"
                                        rows={2}
                                        className="w-full text-sm text-slate-700 border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 bg-white"
                                      />
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 48-hour warning banner */}
                {!completed.has(selectedSession.id) && selectedSession.students.length > 0 && (
                  <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700">
                      Attendance must be marked within 48 working hours. Session closes{" "}
                      <span className="font-semibold">
                        Wed 23 Apr at {selectedSession.startTime}
                      </span>.
                    </p>
                  </div>
                )}

                {/* Save & Confirm */}
                {!completed.has(selectedSession.id) && selectedSession.students.length > 0 && (
                  <button
                    onClick={() => confirmSession(selectedSession.id)}
                    className="mt-4 w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors cursor-pointer text-sm"
                  >
                    Save &amp; Confirm Attendance
                  </button>
                )}

                {/* Confirmed banner */}
                {completed.has(selectedSession.id) && (
                  <div className="mt-4 flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <p className="text-sm text-emerald-700 font-medium">
                      Attendance confirmed for this session.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 2 — Attendance Overview
      ═══════════════════════════════════════════════════════════════════ */}
      {mainTab === "overview" && (
        <div className="flex-1 p-6">

          {/* Secondary tab bar — slate underline (distinct from amber primary tabs) */}
          <div className="flex gap-6 border-b border-slate-200 mb-6">
            {(
              [
                { key: "unmarked" as OverviewTab, label: "Unmarked Sessions" },
                { key: "absence"  as OverviewTab, label: "Absence Summary"   },
                { key: "makeup"   as OverviewTab, label: "Makeup Log"         },
              ] as const
            ).map(tab => (
              <button
                key={tab.key}
                onClick={() => setOverviewTab(tab.key)}
                className={cn(
                  "pb-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                  overviewTab === tab.key
                    ? "border-slate-700 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Sub-tab A: Unmarked Sessions ───────────────────────────── */}
          {overviewTab === "unmarked" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Session
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Date
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Teacher
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Hours Remaining
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unmarkedSessions.map(session => (
                    <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{session.subject}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{session.date}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{session.teacher}</td>
                      <td className="px-4 py-3">
                        {session.overdue ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Overdue
                          </span>
                        ) : session.hoursRemaining <= 6 ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {session.hoursRemaining} hrs left
                          </span>
                        ) : (
                          <span className="text-sm text-slate-500">{session.hoursRemaining} hrs left</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                            <Bell className="w-3.5 h-3.5" />
                            Send Reminder
                          </button>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                            <BookOpen className="w-3.5 h-3.5" />
                            Unlock &amp; Mark
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Sub-tab B: Absence Summary ─────────────────────────────── */}
          {overviewTab === "absence" && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Student
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Year / Dept
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Subject
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Total Abs.
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Consec.
                    </th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Makeup Allow.
                    </th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Status
                    </th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {absenceSummary.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                            getAvatarPalette(row.student).bg,
                            getAvatarPalette(row.student).text,
                          )}>
                            {getInitials(row.student)}
                          </div>
                          <span className="text-sm font-medium text-slate-900">{row.student}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.year} · {row.dept}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{row.subject}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-semibold text-slate-900">{row.totalAbsences}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-sm font-semibold",
                          row.consecutive >= 2 ? "text-red-600"
                            : row.consecutive >= 1 ? "text-amber-600"
                            : "text-slate-400",
                        )}>
                          {row.consecutive}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn(
                          "text-sm font-semibold",
                          row.makeupAllowance === 0 ? "text-red-500" : "text-slate-700",
                        )}>
                          {row.makeupAllowance}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs font-medium px-2.5 py-1 rounded-full",
                          ABSENCE_PILL[row.status],
                        )}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/students/${row.studentId}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Profile
                          </Link>
                          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                            <CalendarPlus className="w-3.5 h-3.5" />
                            Book Makeup
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Sub-tab C: Makeup Log ──────────────────────────────────── */}
          {overviewTab === "makeup" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-slate-500">{makeupLog.length} makeup sessions this term</p>
                <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
                  <CalendarPlus className="w-4 h-4" />
                  Book Makeup
                </button>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                        Original Session
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                        Subject
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                        Student
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                        Makeup Date
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                        Status
                      </th>
                      <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {makeupLog.map(entry => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-slate-600">{entry.originalSession}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{entry.subject}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{entry.student}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{entry.makeupDate}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
                            MAKEUP_PILL[entry.status],
                          )}>
                            {entry.status === "Pending" && (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                              View
                            </button>
                            {(entry.status === "Pending" || entry.status === "Confirmed") && (
                              <button className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
