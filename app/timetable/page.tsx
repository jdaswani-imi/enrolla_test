"use client";

import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  MoreHorizontal,
  AlertTriangle,
  Clock,
  User,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  timetableSessions,
  rooms,
  type TimetableSession,
} from "@/lib/mock-data";

// ─── Grid constants ───────────────────────────────────────────────────────────

const START_HOUR = 8;   // 08:00
const END_HOUR   = 20;  // 20:00
const SLOT_HEIGHT = 40; // px per 30-min slot
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2; // 24 half-hour slots
const GRID_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT;   // 960 px

// ─── Days ─────────────────────────────────────────────────────────────────────

const DAYS = [
  { key: "Mon", label: "Mon 21" },
  { key: "Tue", label: "Tue 22" },
  { key: "Wed", label: "Wed 23" },
  { key: "Thu", label: "Thu 24" },
  { key: "Fri", label: "Fri 25" },
];

// Simulate "today" as Monday so the current-time line is visible
const TODAY_KEY     = "Mon";
const CURRENT_TIME  = "15:30"; // simulated current time

// ─── Time labels (08:00 … 20:00, every 30 min) ────────────────────────────────

const TIME_LABELS: string[] = [];
for (let i = 0; i <= TOTAL_SLOTS; i++) {
  const totalMins = START_HOUR * 60 + i * 30;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  TIME_LABELS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeToMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function timeToPx(t: string): number {
  return ((timeToMins(t) - START_HOUR * 60) / 30) * SLOT_HEIGHT;
}

function durationToPx(dur: number): number {
  return (dur / 30) * SLOT_HEIGHT;
}

function getChipColors(session: TimetableSession): string {
  if (session.type === "Meeting") return "bg-slate-100 border-slate-300 text-slate-700";
  const map: Record<string, string> = {
    Primary:           "bg-amber-100 border-amber-300 text-amber-900",
    "Lower Secondary": "bg-teal-100 border-teal-300 text-teal-900",
    Senior:            "bg-blue-100 border-blue-300 text-blue-900",
  };
  return map[session.department] ?? "bg-slate-100 border-slate-300 text-slate-700";
}

const TYPE_BADGE: Record<string, string> = {
  Trial:            "bg-amber-200 text-amber-800",
  Makeup:           "bg-violet-100 text-violet-700",
  Assessment:       "bg-indigo-100 text-indigo-700",
  Meeting:          "bg-slate-200 text-slate-700",
  "Cover Required": "bg-red-100 text-red-700",
  Blocked:          "bg-slate-300 text-slate-700",
};

const DEPT_BADGE: Record<string, string> = {
  Primary:           "bg-amber-100 text-amber-800",
  "Lower Secondary": "bg-teal-100 text-teal-800",
  Senior:            "bg-blue-100 text-blue-800",
};

// ─── Overlap layout ───────────────────────────────────────────────────────────
// Assigns colIndex / colCount to each session so overlapping chips sit side-by-side.

type LayoutSession = TimetableSession & { colIndex: number; colCount: number };

function layoutSessions(sessions: TimetableSession[]): LayoutSession[] {
  const sorted = [...sessions].sort(
    (a, b) => timeToMins(a.startTime) - timeToMins(b.startTime)
  );
  const result: LayoutSession[] = [];

  for (const s of sorted) {
    const sStart = timeToMins(s.startTime);
    const sEnd   = sStart + s.duration;

    // Find already-placed sessions that overlap with s
    const overlapping = result.filter((r) => {
      const rStart = timeToMins(r.startTime);
      const rEnd   = rStart + r.duration;
      return sStart < rEnd && sEnd > rStart;
    });

    if (overlapping.length === 0) {
      result.push({ ...s, colIndex: 0, colCount: 1 });
    } else {
      // Widen all overlapping sessions to 2 columns
      overlapping.forEach((r) => { r.colCount = 2; });
      const usedCols = new Set(overlapping.map((r) => r.colIndex));
      const colIndex = usedCols.has(0) ? 1 : 0;
      result.push({ ...s, colIndex, colCount: 2 });
    }
  }

  return result;
}

// ─── FilterChip ───────────────────────────────────────────────────────────────

function FilterChip({
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
  const active = value !== options[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
          active
            ? "bg-amber-50 border-amber-300 text-amber-800"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        {active ? `${label}: ${value}` : label}
        <svg className="w-3 h-3 ml-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[180px]">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer",
                  value === opt
                    ? "bg-amber-50 text-amber-800 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Session Detail Slide-Over ────────────────────────────────────────────────

function SessionSlideover({
  session,
  onClose,
}: {
  session: TimetableSession;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fade-in fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="slide-in-right fixed right-0 top-0 h-full w-[480px] bg-white z-50 shadow-2xl flex flex-col overflow-y-auto">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-800">{session.subject}</h2>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                DEPT_BADGE[session.department] ?? "bg-slate-100 text-slate-600"
              )}>
                {session.department}
              </span>
              {session.type !== "Regular" && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-medium",
                  TYPE_BADGE[session.type] ?? "bg-slate-100 text-slate-600"
                )}>
                  {session.type}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {session.day} {session.date} · {session.startTime}–{session.endTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer mt-0.5 flex-shrink-0"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 px-6 py-5 space-y-6">

          {/* Cover Required warning */}
          {session.type === "Cover Required" && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">Cover teacher required for this session</p>
            </div>
          )}

          {/* Session details */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Session Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Date &amp; Time</p>
                  <p className="text-sm font-medium text-slate-700">
                    {session.day} {session.date}
                  </p>
                  <p className="text-sm text-slate-600">{session.startTime}–{session.endTime}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Duration</p>
                  <p className="text-sm font-medium text-slate-700">{session.duration} minutes</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Room</p>
                  <p className="text-sm font-medium text-slate-700">{session.room}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Teacher</p>
                  <p className="text-sm font-medium text-slate-700">{session.teacher}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Status</p>
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
              session.status === "Scheduled" && "bg-blue-50 text-blue-700",
              session.status === "Completed" && "bg-emerald-50 text-emerald-700",
              session.status === "Cancelled" && "bg-red-50 text-red-600",
            )}>
              <span className={cn(
                "w-1.5 h-1.5 rounded-full",
                session.status === "Scheduled" && "bg-blue-500",
                session.status === "Completed" && "bg-emerald-500",
                session.status === "Cancelled" && "bg-red-500",
              )} />
              {session.status}
            </span>
          </div>

          {/* Students */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Students Enrolled ({session.studentCount})
            </p>
            {session.students.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No students — staff session</p>
            ) : (
              <div className="space-y-1">
                {session.students.map((name) => (
                  <div
                    key={name}
                    className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-500 flex-shrink-0">
                        {name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-sm text-slate-700">{name}</span>
                    </div>
                    <span className="text-xs text-slate-400 italic">Not yet marked</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex items-center gap-2 flex-wrap">
          <Link
            href="/attendance"
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer min-w-[120px]"
          >
            Mark Attendance
          </Link>
          <button className="px-3 py-2 border border-slate-300 text-slate-600 text-xs font-medium rounded-lg hover:bg-white transition-colors cursor-pointer">
            Edit Session
          </button>
          <button className="px-3 py-2 border border-slate-200 text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
            Cancel Session
          </button>
          <button className="p-2 border border-slate-200 text-slate-500 rounded-lg hover:bg-white transition-colors cursor-pointer">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

// ─── New Session Modal ────────────────────────────────────────────────────────

function NewSessionModal({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 pointer-events-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">New Session</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-6">New Session form — coming soon</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Timetable Page ───────────────────────────────────────────────────────────

export default function TimetablePage() {
  const [activeDay,       setActiveDay]       = useState("Mon");
  const [selectedSession, setSelectedSession] = useState<TimetableSession | null>(null);
  const [showNewSession,  setShowNewSession]  = useState(false);
  const [filterDept,      setFilterDept]      = useState("All");
  const [filterTeacher,   setFilterTeacher]   = useState("All");
  const [filterRoom,      setFilterRoom]      = useState("All");
  const [filterType,      setFilterType]      = useState("All");

  // Unique teachers for filter
  const teachers = useMemo(() => {
    const names = Array.from(new Set(timetableSessions.map((s) => s.teacher))).sort();
    return ["All", ...names];
  }, []);

  const roomOptions = useMemo(() => ["All", ...rooms.map((r) => r.name)], []);

  // Sessions for the active day, then filtered
  const daySessions = useMemo(() =>
    timetableSessions.filter((s) => {
      if (s.day !== activeDay)                                  return false;
      if (filterDept    !== "All" && s.department !== filterDept)   return false;
      if (filterTeacher !== "All" && s.teacher    !== filterTeacher) return false;
      if (filterRoom    !== "All" && s.room       !== filterRoom)    return false;
      if (filterType    !== "All" && s.type       !== filterType)    return false;
      return true;
    }),
    [activeDay, filterDept, filterTeacher, filterRoom, filterType]
  );

  // Per-room layout (overlap detection)
  const sessionsByRoom = useMemo(() => {
    const map: Record<string, LayoutSession[]> = {};
    for (const room of rooms) {
      map[room.id] = layoutSessions(daySessions.filter((s) => s.room === room.name));
    }
    return map;
  }, [daySessions]);

  const CURRENT_TIME_PX = timeToPx(CURRENT_TIME);
  const filtersActive =
    filterDept !== "All" || filterTeacher !== "All" ||
    filterRoom !== "All" || filterType    !== "All";

  return (
    <div className="flex flex-col h-full">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0">

        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-semibold text-slate-700 px-1 select-none">
            21 Apr – 25 Apr 2025
          </span>
          <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Today
          </button>
        </div>

        {/* View toggle + New Session */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            {(["Week", "Day", "Month"] as const).map((v) => (
              <button
                key={v}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  v === "Week"
                    ? "bg-slate-100 text-slate-800"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowNewSession(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Session
          </button>
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6 py-2.5 bg-white border-b border-slate-100 flex-wrap flex-shrink-0">
        <span className="text-xs text-slate-400 font-medium mr-0.5">Filter:</span>
        <FilterChip
          label="Department"   value={filterDept}
          options={["All", "Primary", "Lower Secondary", "Senior"]}
          onChange={setFilterDept}
        />
        <FilterChip
          label="Teacher"      value={filterTeacher}
          options={teachers}
          onChange={setFilterTeacher}
        />
        <FilterChip
          label="Room"         value={filterRoom}
          options={roomOptions}
          onChange={setFilterRoom}
        />
        <FilterChip
          label="Session Type" value={filterType}
          options={["All", "Regular", "Trial", "Makeup", "Assessment", "Meeting", "Blocked"]}
          onChange={setFilterType}
        />
        {filtersActive && (
          <button
            onClick={() => {
              setFilterDept("All");
              setFilterTeacher("All");
              setFilterRoom("All");
              setFilterType("All");
            }}
            className="flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* ── Day tabs ──────────────────────────────────────────────────────── */}
      <div className="flex items-center bg-white border-b border-slate-200 flex-shrink-0 px-6">
        {DAYS.map((d) => (
          <button
            key={d.key}
            onClick={() => setActiveDay(d.key)}
            className={cn(
              "relative px-5 py-3 text-sm font-medium transition-colors cursor-pointer",
              activeDay === d.key
                ? "text-amber-600"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {d.label}
            {d.key === TODAY_KEY && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-amber-500 align-middle mb-0.5" />
            )}
            {activeDay === d.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t" />
            )}
          </button>
        ))}
        <div className="ml-auto pr-1">
          <span className="text-xs text-slate-400">
            {daySessions.length} session{daySessions.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* ── Calendar grid ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-max">

          {/* Sticky room column headers */}
          <div className="sticky top-0 z-20 flex bg-white border-b border-slate-200 shadow-sm">
            {/* Time label spacer */}
            <div className="w-[60px] flex-shrink-0 border-r border-slate-200" />
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex-1 min-w-[180px] px-3 py-2.5 border-l border-slate-200 text-center"
              >
                <p className="text-xs font-semibold text-slate-700">{room.name}</p>
                <p className="text-[10px] text-slate-400">cap {room.capacity}</p>
              </div>
            ))}
          </div>

          {/* Grid body */}
          <div className="flex" style={{ height: GRID_HEIGHT }}>

            {/* ── Time labels column ──────────────────────────────── */}
            <div
              className="w-[60px] flex-shrink-0 relative bg-white border-r border-slate-200"
              style={{ height: GRID_HEIGHT }}
            >
              {TIME_LABELS.map((t, i) => {
                const isHour = t.endsWith(":00");
                return (
                  <div
                    key={t}
                    className="absolute right-2 flex items-center pointer-events-none"
                    style={{ top: i * SLOT_HEIGHT - 7 }}
                  >
                    <span className={cn(
                      "text-[10px] leading-none select-none",
                      isHour ? "font-semibold text-slate-500" : "text-slate-300"
                    )}>
                      {t}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* ── Room columns ────────────────────────────────────── */}
            {rooms.map((room) => {
              const roomSessions = sessionsByRoom[room.id] ?? [];

              return (
                <div
                  key={room.id}
                  className="flex-1 min-w-[180px] relative border-l border-slate-200 bg-white"
                  style={{ height: GRID_HEIGHT }}
                >
                  {/* Horizontal gridlines */}
                  {TIME_LABELS.slice(1).map((t, i) => (
                    <div
                      key={t}
                      className={cn(
                        "absolute left-0 right-0 border-t pointer-events-none",
                        t.endsWith(":00") ? "border-slate-200" : "border-slate-100"
                      )}
                      style={{ top: (i + 1) * SLOT_HEIGHT }}
                    />
                  ))}

                  {/* Current time indicator — Monday only */}
                  {activeDay === TODAY_KEY && (
                    <div
                      className="absolute left-0 right-0 z-10 pointer-events-none"
                      style={{ top: CURRENT_TIME_PX }}
                    >
                      <div className="relative flex items-center">
                        <div className="absolute left-0 w-2 h-2 rounded-full bg-red-500 -translate-x-1 -translate-y-[3px] flex-shrink-0" />
                        <div className="w-full h-[2px] bg-red-400" />
                      </div>
                    </div>
                  )}

                  {/* Empty-slot hover zones */}
                  {TIME_LABELS.slice(0, -1).map((t, i) => (
                    <div
                      key={t}
                      onClick={() => setShowNewSession(true)}
                      className="absolute left-0 right-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group z-[5]"
                      style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
                    >
                      <div className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                        <Plus className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                      </div>
                    </div>
                  ))}

                  {/* Session chips */}
                  {roomSessions.map((session) => {
                    const top          = timeToPx(session.startTime);
                    const height       = durationToPx(session.duration);
                    const colW         = 100 / session.colCount;
                    const chipColors   = getChipColors(session);
                    const isDashed     = session.type === "Trial";
                    const isCover      = session.type === "Cover Required";
                    const showBadge    = session.type !== "Regular" && height > 64;
                    const showStudents = height > 56;

                    return (
                      <div
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className={cn(
                          "absolute rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-md hover:brightness-95 z-[6]",
                          chipColors,
                          isDashed && "border-dashed"
                        )}
                        style={{
                          top:   top + 2,
                          height: Math.max(height - 4, 24),
                          left:  `calc(${session.colIndex * colW}% + 3px)`,
                          right: `calc(${100 - (session.colIndex + 1) * colW}% + 3px)`,
                        }}
                      >
                        {/* Cover Required strip */}
                        {isCover && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-red-400">
                            <AlertTriangle className="w-2.5 h-2.5 text-white flex-shrink-0" />
                            <span className="text-[9px] text-white font-semibold leading-none">Cover Required</span>
                          </div>
                        )}

                        <div className={cn("px-2 py-1.5", isCover && "pt-1")}>
                          <p className="text-[11px] font-bold leading-tight truncate">
                            {session.subject}
                          </p>
                          <p className="text-[10px] opacity-70 leading-tight truncate mt-0.5">
                            {session.teacher.replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/, "").split(" ").pop()}
                          </p>
                          {showStudents && (
                            <p className="text-[10px] opacity-60 mt-0.5">
                              {session.studentCount} student{session.studentCount !== 1 ? "s" : ""}
                            </p>
                          )}
                          {showBadge && (
                            <span className={cn(
                              "inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium leading-tight",
                              TYPE_BADGE[session.type] ?? "bg-white/50 text-inherit"
                            )}>
                              {session.type}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Overlays ──────────────────────────────────────────────────────── */}
      {selectedSession && (
        <SessionSlideover
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
      {showNewSession && (
        <NewSessionModal onClose={() => setShowNewSession(false)} />
      )}
    </div>
  );
}
