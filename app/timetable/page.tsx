"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
  Check,
  Download,
  Briefcase,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { RoleBanner } from "@/components/ui/role-banner";
import {
  timetableSessions,
  rooms,
  type TimetableSession,
} from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Grid constants ───────────────────────────────────────────────────────────

const START_HOUR  = 8;
const END_HOUR    = 20;
const SLOT_HEIGHT = 40;
const TOTAL_SLOTS = (END_HOUR - START_HOUR) * 2;
const GRID_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT;

// ─── Days ─────────────────────────────────────────────────────────────────────

const DAYS = [
  { key: "Mon", label: "Mon 21", long: "Monday",    date: 21 },
  { key: "Tue", label: "Tue 22", long: "Tuesday",   date: 22 },
  { key: "Wed", label: "Wed 23", long: "Wednesday", date: 23 },
  { key: "Thu", label: "Thu 24", long: "Thursday",  date: 24 },
  { key: "Fri", label: "Fri 25", long: "Friday",    date: 25 },
  { key: "Sat", label: "Sat 26", long: "Saturday",  date: 26 },
];

// Full 7-day list used by the Week Overview layout.
const WEEK_DAYS = [
  ...DAYS,
  { key: "Sun", label: "Sun 27", long: "Sunday", date: 27 },
];

const TODAY_KEY    = "Mon";
const CURRENT_TIME = "15:30";

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

function fmt12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, "0")}${period}`;
}

function cleanName(name: string): string {
  return name.replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/, "").trim();
}

function initials(name: string): string {
  const parts = cleanName(name).split(" ").filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function surname(name: string): string {
  const parts = cleanName(name).split(" ").filter(Boolean);
  return parts[parts.length - 1] ?? name;
}

const AVATAR_COLORS = [
  "bg-amber-400",
  "bg-pink-400",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-emerald-500",
];

function avatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// ─── Department colour scheme ─────────────────────────────────────────────────

function getDeptColor(dept: string, type: string) {
  if (type === "Blocked") return {
    bg: "bg-slate-200", border: "border-slate-300", text: "text-slate-500", dot: "bg-slate-400",
  };
  if (type === "Meeting") return {
    bg: "bg-[#f3f4f6]", border: "border-slate-300", text: "text-slate-600", dot: "bg-slate-500",
  };
  switch (dept) {
    case "Primary":
      return { bg: "bg-[#fce7f3]", border: "border-pink-200",   text: "text-pink-800",   dot: "bg-pink-400"   };
    case "Lower Secondary":
      return { bg: "bg-[#cffafe]", border: "border-cyan-200",   text: "text-cyan-800",   dot: "bg-cyan-500"   };
    case "Senior":
      return { bg: "bg-[#ffedd5]", border: "border-orange-200", text: "text-orange-800", dot: "bg-orange-400" };
    default:
      return { bg: "bg-slate-100", border: "border-slate-200",  text: "text-slate-600",  dot: "bg-slate-400"  };
  }
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
  Primary:           "bg-[#fce7f3] text-pink-800",
  "Lower Secondary": "bg-[#cffafe] text-cyan-800",
  Senior:            "bg-[#ffedd5] text-orange-800",
};

// ─── Overlap layout ───────────────────────────────────────────────────────────

type LayoutSession = TimetableSession & { colIndex: number; colCount: number };

function layoutSessions(sessions: TimetableSession[]): LayoutSession[] {
  const sorted = [...sessions].sort(
    (a, b) => timeToMins(a.startTime) - timeToMins(b.startTime)
  );
  const result: LayoutSession[] = [];

  for (const s of sorted) {
    const sStart = timeToMins(s.startTime);
    const sEnd   = sStart + s.duration;

    const overlapping = result.filter((r) => {
      const rStart = timeToMins(r.startTime);
      const rEnd   = rStart + r.duration;
      return sStart < rEnd && sEnd > rStart;
    });

    if (overlapping.length === 0) {
      result.push({ ...s, colIndex: 0, colCount: 1 });
    } else {
      overlapping.forEach((r) => { r.colCount = 2; });
      const usedCols = new Set(overlapping.map((r) => r.colIndex));
      const colIndex = usedCols.has(0) ? 1 : 0;
      result.push({ ...s, colIndex, colCount: 2 });
    }
  }

  return result;
}

// ─── Session chip (Week Room / Day / Week Overview) ───────────────────────────

function SessionChip({
  session,
  style,
  onClick,
  compact = false,
  dimmed = false,
}: {
  session: LayoutSession;
  style: React.CSSProperties;
  onClick: () => void;
  compact?: boolean;
  dimmed?: boolean;
}) {
  const deptColor    = getDeptColor(session.department, session.type);
  const isDashed     = session.type === "Trial";
  const isCover      = session.type === "Cover Required";
  const isBlocked    = session.type === "Blocked";
  const isMeeting    = session.type === "Meeting";
  const isAssessment = session.type === "Assessment";
  const chipHeight   = typeof style.height === "number" ? style.height : 0;
  const showBadge    = session.type !== "Regular" && chipHeight > 64 && !compact;
  const showStudents = !compact && chipHeight > 56;
  const showCountSuffix = compact && session.studentCount > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-md hover:brightness-95 z-[6]",
        deptColor.bg,
        deptColor.border,
        deptColor.text,
        isDashed && "border-dashed",
        dimmed && "opacity-60"
      )}
      style={style}
    >
      {/* Blocked Time stripe overlay */}
      {isBlocked && (
        <div
          className="absolute inset-0 rounded opacity-30 pointer-events-none"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, #94a3b8 0, #94a3b8 1px, transparent 0, transparent 50%)",
            backgroundSize: "6px 6px",
          }}
        />
      )}

      {/* Assessment dot */}
      {isAssessment && (
        <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-teal-400 z-[7]" />
      )}

      {/* Cover Required strip */}
      {isCover && (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-red-400">
          <AlertTriangle className="w-2.5 h-2.5 text-white flex-shrink-0" />
          <span className="text-[9px] text-white font-semibold leading-none">Cover Required</span>
        </div>
      )}

      <div className={cn("px-2 py-1.5", isCover && "pt-1", compact && "px-1.5 py-1")}>
        <div className="flex items-center gap-1 min-w-0">
          {session.attendanceMarked && (
            <div className="w-3 h-3 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-2 h-2 text-white" strokeWidth={3} />
            </div>
          )}
          <p className={cn(
            "font-bold leading-tight truncate",
            compact ? "text-[10px]" : "text-[11px]",
            isMeeting && "italic"
          )}>
            {session.subject}{showCountSuffix && ` (${session.studentCount})`}
          </p>
        </div>
        <p className={cn(
          "opacity-70 leading-tight truncate mt-0.5",
          compact ? "text-[9px]" : "text-[10px]"
        )}>
          {surname(session.teacher)}
        </p>
        {showStudents && (
          <p className="opacity-60 mt-0.5 text-[10px]">
            {session.studentCount} student{session.studentCount !== 1 ? "s" : ""}
          </p>
        )}
        {session.isTrial && chipHeight > 40 && (
          <span className="inline-block mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold leading-tight bg-amber-400 text-white">
            Trial
          </span>
        )}
        {showBadge && !session.isTrial && (
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
}

// ─── Grid time column (shared) ────────────────────────────────────────────────

function TimeColumn() {
  return (
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
  );
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
        <ChevronDown className="w-3 h-3 ml-0.5 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[180px] max-h-[260px] overflow-auto">
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

// ─── Download Menu ────────────────────────────────────────────────────────────

function DownloadMenu({ onExport }: { onExport: (label: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
        aria-label="Download"
      >
        <Download className="w-4 h-4 text-slate-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-2 w-[280px]">
            {[
              {
                label: "Download class schedule",
                desc:  "Download each class as a separate row, with their students comma separated.",
              },
              {
                label: "Download attendee list",
                desc:  "Download each attendee as a separate row (classes with no attendees will be skipped).",
              },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => { onExport(opt.label); setOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <p className="text-xs font-semibold text-slate-800">{opt.label}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{opt.desc}</p>
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
  const { can } = usePermission();
  const [attendanceMode,     setAttendanceMode]     = useState(false);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<number, string>>({});

  useEffect(() => {
    setAttendanceMode(false);
    setAttendanceStatuses({});
  }, [session]);

  function markAllPresent() {
    const all: Record<number, string> = {};
    session.students.forEach((_, i) => { all[i] = "Present"; });
    setAttendanceStatuses(all);
  }

  function handleSetAttendanceStatus(index: number, status: string) {
    setAttendanceStatuses((prev) => ({ ...prev, [index]: status }));
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[640px] max-h-[80vh]">

        {/* Header */}
        <DialogHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <DialogTitle className="text-base font-bold text-slate-800">{session.subject}</DialogTitle>
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
            {session.isTrial && session.type !== "Trial" && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-400 text-white">
                Trial
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {session.day} {session.date} · {session.startTime}–{session.endTime}
          </p>
        </DialogHeader>

        {/* ── Attendance register mode ─────────────────────────────────────── */}
        {attendanceMode ? (
          <div className="flex-1 px-6 py-5 overflow-y-auto min-h-0">
            <button
              onClick={() => setAttendanceMode(false)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to session details
            </button>

            <h3 className="font-semibold text-slate-800 mb-1">{session.subject}</h3>
            <p className="text-sm text-slate-500 mb-4">
              {session.date} · {session.startTime}–{session.endTime} · {session.room}
            </p>

            <button
              onClick={markAllPresent}
              className="w-full mb-4 py-2 bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-600 transition-colors cursor-pointer"
            >
              ✓ Mark All Present
            </button>

            <div className="space-y-2">
              {session.students.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center py-6">No students — staff session</p>
              ) : (
                session.students.map((student, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">
                        {student.split(" ").map((n: string) => n[0]).join("")}
                      </div>
                      <span className="text-sm font-medium text-slate-800">{student}</span>
                    </div>
                    <div className="flex gap-1">
                      {(["Present", "Late", "Absent"] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleSetAttendanceStatus(i, status)}
                          className={cn(
                            "px-2 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer",
                            attendanceStatuses[i] === status
                              ? status === "Present" ? "bg-green-500 text-white"
                                : status === "Late"    ? "bg-amber-500 text-white"
                                : "bg-red-500 text-white"
                              : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setAttendanceMode(false)}
              className="w-full mt-4 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              Save &amp; Confirm Attendance
            </button>
          </div>

        ) : (
          /* ── Session detail mode ─────────────────────────────────────────── */
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">

              {session.type === "Cover Required" && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">Cover teacher required for this session</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Session Details</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Date &amp; Time</p>
                      <p className="text-sm font-medium text-slate-700">{session.day} {session.date}</p>
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

              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Status</p>
                <div className="flex items-center gap-2 flex-wrap">
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
                  {session.attendanceMarked && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <Check className="w-3 h-3" strokeWidth={3} />
                      Attendance marked
                    </span>
                  )}
                </div>
              </div>

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
                        <span className="text-xs text-slate-400 italic">
                          {session.attendanceMarked ? "Present" : "Not yet marked"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Actions footer */}
            <DialogFooter className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setAttendanceMode(true)}
                className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Mark Attendance
              </button>
              {can('timetable.editSession') && (
                <button className="px-3 py-2 border border-slate-300 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  Edit Session
                </button>
              )}
              {can('timetable.cancelSession') && (
                <button className="px-3 py-2 border border-slate-200 text-red-500 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors cursor-pointer">
                  Cancel Session
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Close
              </button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
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

type ViewMode    = "Week" | "Day" | "List" | "Month";
type WeekSubMode = "Room" | "Overview";

export default function TimetablePage() {
  const { can, role } = usePermission();
  const [activeDay,       setActiveDay]       = useState("Mon");
  const [activeView,      setActiveView]      = useState<ViewMode>("Week");
  const [weekSubMode,     setWeekSubMode]     = useState<WeekSubMode>("Room");
  const [selectedSession, setSelectedSession] = useState<TimetableSession | null>(null);
  const [showNewSession,  setShowNewSession]  = useState(false);
  const [filterLocation,  setFilterLocation]  = useState("All");
  const [filterDept,      setFilterDept]      = useState("All");
  const [filterTeacher,   setFilterTeacher]   = useState("All");
  const [filterRoom,      setFilterRoom]      = useState("All");
  const [filterType,      setFilterType]      = useState("All");
  const [toast,           setToast]           = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const gridScrollRef = useRef<HTMLDivElement>(null);

  const teachers = useMemo(() => {
    const names = Array.from(new Set(timetableSessions.map((s) => s.teacher))).sort();
    return ["All", ...names];
  }, []);

  const roomOptions = useMemo(() => ["All", ...rooms.map((r) => r.name)], []);

  // Filters shared by all views (everything except the active-day filter).
  const weekSessions = useMemo(() =>
    timetableSessions.filter((s) => {
      if (filterDept    !== "All" && s.department !== filterDept)    return false;
      if (filterTeacher !== "All" && s.teacher    !== filterTeacher) return false;
      if (filterRoom    !== "All" && s.room       !== filterRoom)    return false;
      if (filterType    !== "All" && s.type       !== filterType)    return false;
      return true;
    }),
    [filterDept, filterTeacher, filterRoom, filterType]
  );

  const daySessions = useMemo(
    () => weekSessions.filter((s) => s.day === activeDay),
    [weekSessions, activeDay]
  );

  // Week-Room view: per-room layout for active day
  const sessionsByRoom = useMemo(() => {
    const map: Record<string, LayoutSession[]> = {};
    for (const room of rooms) {
      map[room.id] = layoutSessions(daySessions.filter((s) => s.room === room.name));
    }
    return map;
  }, [daySessions]);

  // Day view: unique teachers for active day
  const dayTeachers = useMemo(
    () => [...new Set(daySessions.map((s) => s.teacher))],
    [daySessions]
  );

  // Day view: per-teacher layout
  const sessionsByTeacher = useMemo(() => {
    const map: Record<string, LayoutSession[]> = {};
    for (const teacher of dayTeachers) {
      map[teacher] = layoutSessions(daySessions.filter((s) => s.teacher === teacher));
    }
    return map;
  }, [daySessions, dayTeachers]);

  // Week-Overview: per-day layout for the whole week
  const sessionsByDay = useMemo(() => {
    const map: Record<string, LayoutSession[]> = {};
    for (const d of WEEK_DAYS) {
      map[d.key] = layoutSessions(weekSessions.filter((s) => s.day === d.key));
    }
    return map;
  }, [weekSessions]);

  const CURRENT_TIME_PX = timeToPx(CURRENT_TIME);

  // Auto-scroll the grid to the first session on initial load / tab change.
  useEffect(() => {
    if (activeView !== "Week" && activeView !== "Day") return;

    const raf = requestAnimationFrame(() => {
      const container = gridScrollRef.current;
      if (!container) return;

      let targetMins: number;
      const isOverview = activeView === "Week" && weekSubMode === "Overview";

      if (isOverview) {
        const allStarts = weekSessions.map((s) => timeToMins(s.startTime));
        targetMins = allStarts.length === 0
          ? 9 * 60
          : Math.max(Math.min(...allStarts) - 30, START_HOUR * 60);
      } else if (daySessions.length === 0) {
        targetMins = 9 * 60;
      } else {
        const earliest = Math.min(...daySessions.map((s) => timeToMins(s.startTime)));
        targetMins = Math.max(earliest - 30, START_HOUR * 60);
      }

      const scrollY = ((targetMins - START_HOUR * 60) / 30) * SLOT_HEIGHT;
      container.scrollTop = Math.max(scrollY, 0);
    });

    return () => cancelAnimationFrame(raf);
  }, [activeView, weekSubMode, activeDay, daySessions, weekSessions]);
  const filtersActive =
    filterLocation !== "All" || filterDept !== "All" || filterTeacher !== "All" ||
    filterRoom     !== "All" || filterType !== "All";

  // Show day tabs only in Week-Room and Day modes
  const showDayTabs = (activeView === "Week" && weekSubMode === "Room") || activeView === "Day";

  // Session count relevant to the currently-visible range
  const visibleCount =
    activeView === "Week" && weekSubMode === "Room" ? daySessions.length
    : activeView === "Day"                          ? daySessions.length
    : weekSessions.length;

  if (!can('timetable.view')) return <AccessDenied />;

  return (
    <div className="flex flex-col h-full">

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 flex-shrink-0 gap-3 flex-wrap">

        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4 text-slate-500" />
          </button>
          <span className="text-sm font-semibold text-slate-700 px-1 select-none">
            {activeView === "Month" ? "April 2025" : "21 Apr – 26 Apr 2025"}
          </span>
          <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Today
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">
            {visibleCount} session{visibleCount !== 1 ? "s" : ""}
          </span>

          {activeView === "Week" && (
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
              {(["Room", "Overview"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setWeekSubMode(m)}
                  className={cn(
                    "px-2.5 py-1.5 text-[11px] font-medium transition-colors cursor-pointer",
                    weekSubMode === m
                      ? "bg-amber-50 text-amber-700"
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            {(["Week", "Day", "List", "Month"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setActiveView(v)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  activeView === v
                    ? "bg-slate-100 text-slate-800"
                    : "text-slate-500 hover:bg-slate-50"
                )}
              >
                {v}
              </button>
            ))}
          </div>

          <DownloadMenu onExport={() => setToast("Export coming soon")} />

          {can('timetable.createSession') && (
            <button
              onClick={() => setShowNewSession(true)}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              New Session
            </button>
          )}
        </div>
      </div>

      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6 py-2.5 bg-white border-b border-slate-100 flex-wrap flex-shrink-0">
        <span className="text-xs text-slate-400 font-medium mr-0.5">Filter:</span>
        <FilterChip
          label="Location"     value={filterLocation}
          options={["All", "Gold & Diamond Park"]}
          onChange={setFilterLocation}
        />
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
              setFilterLocation("All");
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

      {/* ── Role banner (Teacher / TA only) ───────────────────────────────── */}
      {(role === 'Teacher' || role === 'TA') && (
        <div className="px-6 pt-3">
          <RoleBanner message="You can edit and manage your own sessions only." />
        </div>
      )}

      {/* ── Day tabs (Week-Room + Day only) ───────────────────────────────── */}
      {showDayTabs && (
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
      )}

      {/* ── Mobile day list ────────────────────────────────────────────────── */}
      <div className="md:hidden flex-1 overflow-auto">
        <div className="px-4 py-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
            <span className="text-amber-600 text-sm">📐</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Best viewed on desktop</p>
              <p className="text-xs text-amber-700 mt-0.5">Switch to Day view or use a larger screen for the full timetable grid.</p>
            </div>
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
            {DAYS.find((d) => d.key === activeDay)?.label} — {daySessions.length} session{daySessions.length !== 1 ? "s" : ""}
          </p>
          <div className="flex flex-col gap-2">
            {daySessions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No sessions for this day.</p>
            ) : (
              [...daySessions]
                .sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime))
                .map((session) => {
                  const deptColor = getDeptColor(session.department, session.type);
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedSession(session)}
                      className={cn(
                        "w-full text-left rounded-lg border px-4 py-3 flex items-start gap-3 cursor-pointer hover:shadow-sm transition-shadow",
                        deptColor.bg, deptColor.border, deptColor.text
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold leading-tight">{session.subject}</p>
                        <p className="text-xs opacity-70 mt-0.5">{session.teacher}</p>
                        <p className="text-xs opacity-60 mt-0.5">{session.room} · {session.studentCount} student{session.studentCount !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-semibold">{session.startTime}</p>
                        <p className="text-xs opacity-60">{session.endTime}</p>
                      </div>
                    </button>
                  );
                })
            )}
          </div>
        </div>
      </div>

      {/* ── Desktop views ─────────────────────────────────────────────────── */}
      <div ref={gridScrollRef} className="hidden md:flex flex-1 overflow-auto">

        {/* ════ WEEK – Room sub-mode (rooms as columns) ═════════════════════ */}
        {activeView === "Week" && weekSubMode === "Room" && (
          <div className="min-w-max">
            <div className="sticky top-0 z-20 flex bg-white border-b border-slate-200 shadow-sm">
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

            <div className="flex relative" style={{ height: GRID_HEIGHT }}>
              <TimeColumn />
              {activeDay === TODAY_KEY && (
                <div
                  className="absolute pointer-events-none z-[15]"
                  style={{ top: CURRENT_TIME_PX, left: 60, right: 0, height: 0 }}
                >
                  <div className="relative h-px bg-red-500">
                    <div className="absolute left-0 top-1/2 w-1.5 h-1.5 rounded-full bg-red-500 -translate-x-[3px] -translate-y-1/2" />
                  </div>
                </div>
              )}
              {rooms.map((room) => {
                const roomSessions = sessionsByRoom[room.id] ?? [];
                return (
                  <div
                    key={room.id}
                    className="flex-1 min-w-[180px] relative border-l border-slate-200 bg-white"
                    style={{ height: GRID_HEIGHT }}
                  >
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

                    {roomSessions.map((session) => {
                      const top    = timeToPx(session.startTime);
                      const height = durationToPx(session.duration);
                      const colW   = 100 / session.colCount;
                      return (
                        <SessionChip
                          key={session.id}
                          session={session}
                          onClick={() => setSelectedSession(session)}
                          style={{
                            top:    top + 2,
                            height: Math.max(height - 4, 24),
                            left:   `calc(${session.colIndex * colW}% + 3px)`,
                            right:  `calc(${100 - (session.colIndex + 1) * colW}% + 3px)`,
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ WEEK – Overview sub-mode (7-day columns, Classcard style) ══ */}
        {activeView === "Week" && weekSubMode === "Overview" && (
          <div className="min-w-max w-full">
            <div className="sticky top-0 z-20 flex bg-white border-b border-slate-200 shadow-sm">
              <div className="w-[60px] flex-shrink-0 border-r border-slate-200" />
              {WEEK_DAYS.map((d) => {
                const count = sessionsByDay[d.key]?.length ?? 0;
                const isSunday = d.key === "Sun";
                return (
                  <div
                    key={d.key}
                    className={cn(
                      "flex-1 min-w-[140px] px-2 py-2.5 border-l border-slate-200 text-center",
                      d.key === TODAY_KEY && "bg-amber-50/50",
                      isSunday && "bg-slate-50"
                    )}
                  >
                    <p className={cn(
                      "text-[11px] font-semibold uppercase tracking-wide",
                      isSunday ? "text-slate-400"
                        : d.key === TODAY_KEY ? "text-amber-700" : "text-slate-400"
                    )}>
                      {d.long.slice(0, 3)}
                    </p>
                    <p className={cn(
                      "text-sm font-bold",
                      isSunday ? "text-slate-400"
                        : d.key === TODAY_KEY ? "text-amber-700" : "text-slate-700"
                    )}>
                      {d.date}
                    </p>
                    {count > 0 && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{count}</p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex" style={{ height: GRID_HEIGHT }}>
              <TimeColumn />
              {WEEK_DAYS.map((d) => {
                const dSessions = sessionsByDay[d.key] ?? [];
                const isSunday = d.key === "Sun";
                return (
                  <div
                    key={d.key}
                    className={cn(
                      "flex-1 min-w-[140px] relative border-l border-slate-200 bg-white",
                      d.key === TODAY_KEY && "bg-amber-50/20",
                      isSunday && "bg-slate-50"
                    )}
                    style={{
                      height: GRID_HEIGHT,
                      ...(isSunday && {
                        backgroundImage: "repeating-linear-gradient(45deg, #e2e8f0 0, #e2e8f0 1px, transparent 0, transparent 8px)",
                      }),
                    }}
                  >
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

                    {d.key === TODAY_KEY && (
                      <div
                        className="absolute left-0 right-0 z-[15] pointer-events-none"
                        style={{ top: CURRENT_TIME_PX, height: 0 }}
                      >
                        <div className="relative h-px bg-red-500">
                          <div className="absolute left-0 top-1/2 w-1.5 h-1.5 rounded-full bg-red-500 -translate-x-[3px] -translate-y-1/2" />
                        </div>
                      </div>
                    )}

                    {dSessions.map((session) => {
                      const top    = timeToPx(session.startTime);
                      const height = durationToPx(session.duration);
                      const colW   = 100 / session.colCount;
                      return (
                        <SessionChip
                          key={session.id}
                          session={session}
                          compact
                          dimmed={isSunday}
                          onClick={() => setSelectedSession(session)}
                          style={{
                            top:    top + 2,
                            height: Math.max(height - 4, 24),
                            left:   `calc(${session.colIndex * colW}% + 2px)`,
                            right:  `calc(${100 - (session.colIndex + 1) * colW}% + 2px)`,
                          }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════ DAY VIEW (teacher columns + avatar headers) ═════════════════ */}
        {activeView === "Day" && (
          <div className="min-w-max w-full flex flex-col">

            {/* Staff filter bar (Day view only) */}
            <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-slate-100 flex-shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">Staff:</span>
              <FilterChip
                label="All Staff"
                value={filterTeacher === "All" ? "All Staff" : filterTeacher}
                options={["All Staff", ...teachers.slice(1)]}
                onChange={(v) => setFilterTeacher(v === "All Staff" ? "All" : v)}
              />
            </div>

            <div className="sticky top-0 z-20 flex bg-white border-b border-slate-200 shadow-sm">
              <div className="w-[60px] flex-shrink-0 border-r border-slate-200" />
              {dayTeachers.length === 0 ? (
                <div className="flex-1 px-3 py-4 text-center text-xs text-slate-400">No sessions</div>
              ) : (
                dayTeachers.map((teacher) => {
                  const count = daySessions.filter((s) => s.teacher === teacher).length;
                  return (
                    <div
                      key={teacher}
                      className="flex-1 min-w-[200px] px-3 py-3 border-l border-slate-200 text-center"
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-full mx-auto flex items-center justify-center text-sm font-bold text-white shadow-sm",
                        avatarColor(teacher)
                      )}>
                        {initials(teacher)}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-1.5 leading-tight">{teacher}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {count} session{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex relative" style={{ height: GRID_HEIGHT }}>
              <TimeColumn />
              {activeDay === TODAY_KEY && dayTeachers.length > 0 && (
                <div
                  className="absolute pointer-events-none z-[15]"
                  style={{ top: CURRENT_TIME_PX, left: 60, right: 0, height: 0 }}
                >
                  <div className="relative h-px bg-red-500">
                    <div className="absolute left-0 top-1/2 w-1.5 h-1.5 rounded-full bg-red-500 -translate-x-[3px] -translate-y-1/2" />
                  </div>
                </div>
              )}
              {dayTeachers.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
                  No sessions for this day.
                </div>
              ) : (
                dayTeachers.map((teacher) => {
                  const teacherSessions = sessionsByTeacher[teacher] ?? [];
                  return (
                    <div
                      key={teacher}
                      className="flex-1 min-w-[200px] relative border-l border-slate-200 bg-white"
                      style={{ height: GRID_HEIGHT }}
                    >
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

                      {teacherSessions.map((session) => {
                        const top    = timeToPx(session.startTime);
                        const height = durationToPx(session.duration);
                        const colW   = 100 / session.colCount;
                        return (
                          <SessionChip
                            key={session.id}
                            session={session}
                            onClick={() => setSelectedSession(session)}
                            style={{
                              top:    top + 2,
                              height: Math.max(height - 4, 24),
                              left:   `calc(${session.colIndex * colW}% + 3px)`,
                              right:  `calc(${100 - (session.colIndex + 1) * colW}% + 3px)`,
                            }}
                          />
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ════ LIST VIEW ═══════════════════════════════════════════════════ */}
        {activeView === "List" && (
          <ListView
            sessions={weekSessions}
            onOpen={(s) => setSelectedSession(s)}
          />
        )}

        {/* ════ MONTH VIEW ══════════════════════════════════════════════════ */}
        {activeView === "Month" && (
          <MonthView
            sessions={weekSessions}
            onDayClick={(dayKey) => {
              if (dayKey) {
                setActiveDay(dayKey);
                setActiveView("Day");
              }
            }}
          />
        )}
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg z-[60] fade-in">
          {toast}
        </div>
      )}

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

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  sessions,
  onOpen,
}: {
  sessions: TimetableSession[];
  onOpen: (s: TimetableSession) => void;
}) {
  const grouped = useMemo(() => {
    const map: Record<string, TimetableSession[]> = {};
    for (const d of DAYS) map[d.key] = [];
    for (const s of sessions) {
      if (map[s.day]) map[s.day].push(s);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
    }
    return map;
  }, [sessions]);

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {DAYS.map((d) => {
          const rows = grouped[d.key] ?? [];
          if (rows.length === 0) return null;
          const isToday = d.key === TODAY_KEY;
          return (
            <div key={d.key} className="mb-6">
              <div className="sticky top-0 bg-white z-10 py-2 flex items-center gap-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">{d.long}</h3>
                <span className="text-xs text-slate-400">· {d.label.split(" ")[1]} Apr</span>
                {isToday && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">Today</span>
                )}
                <span className="ml-auto text-xs text-slate-400">
                  {rows.length} session{rows.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {rows.map((s) => {
                  const dept = getDeptColor(s.department, s.type);
                  return (
                    <button
                      key={s.id}
                      onClick={() => onOpen(s)}
                      className="w-full text-left py-3 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer px-2 rounded-lg"
                    >
                      <div className="w-28 flex-shrink-0">
                        <p className="text-xs font-semibold text-slate-800">{fmt12(s.startTime)}</p>
                        <p className="text-[11px] text-slate-400">{fmt12(s.endTime)}</p>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {s.attendanceMarked && (
                            <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </div>
                          )}
                          <p className="text-sm font-semibold text-slate-800">{s.subject}</p>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            DEPT_BADGE[s.department] ?? "bg-slate-100 text-slate-600"
                          )}>
                            {s.department}
                          </span>
                          {s.isTrial && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400 text-white">
                              Trial
                            </span>
                          )}
                          {s.type !== "Regular" && s.type !== "Trial" && (
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-medium",
                              TYPE_BADGE[s.type] ?? "bg-slate-100 text-slate-600"
                            )}>
                              {s.type}
                            </span>
                          )}
                        </div>
                        {s.students.length > 0 && (
                          <p className="text-xs text-slate-400 mt-1 truncate">
                            {s.students.join(", ")}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 flex-shrink-0">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{s.teacher}</span>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-slate-400 flex-shrink-0">
                        <span className={cn("w-1.5 h-1.5 rounded-full", dept.dot)} />
                        {s.room}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {Object.values(grouped).every((v) => v.length === 0) && (
          <p className="text-sm text-slate-400 text-center py-12">No sessions match the current filters.</p>
        )}
      </div>
    </div>
  );
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({
  sessions,
  onDayClick,
}: {
  sessions: TimetableSession[];
  onDayClick: (dayKey: string | null) => void;
}) {
  // Fixed to April 2025 — 1 Apr is a Tuesday, so the Mon-start grid begins on 31 Mar.
  const monthGrid = useMemo(() => {
    type Cell = {
      dateNum: number;
      inMonth: boolean;
      key: string | null;    // Day key if a session-day (Mon-Sat 21-26)
      monthLabel?: "prev" | "next";
    };

    const cells: Cell[] = [];
    // Week 1: 31 Mar, 1-6 Apr
    cells.push({ dateNum: 31, inMonth: false, key: null, monthLabel: "prev" });
    for (let d = 1; d <= 6; d++) cells.push({ dateNum: d, inMonth: true, key: null });
    // Week 2-4: 7-27
    for (let d = 7; d <= 27; d++) {
      let key: string | null = null;
      if (d === 21) key = "Mon";
      else if (d === 22) key = "Tue";
      else if (d === 23) key = "Wed";
      else if (d === 24) key = "Thu";
      else if (d === 25) key = "Fri";
      else if (d === 26) key = "Sat";
      cells.push({ dateNum: d, inMonth: true, key });
    }
    // Week 5: 28-30 Apr + 1-4 May
    for (let d = 28; d <= 30; d++) cells.push({ dateNum: d, inMonth: true, key: null });
    for (let d = 1; d <= 4; d++) cells.push({ dateNum: d, inMonth: false, key: null, monthLabel: "next" });
    return cells;
  }, []);

  const sessionsByDayKey = useMemo(() => {
    const map: Record<string, TimetableSession[]> = {};
    for (const s of sessions) {
      if (!map[s.day]) map[s.day] = [];
      map[s.day].push(s);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
    }
    return map;
  }, [sessions]);

  const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const TODAY_DATE = 21;

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="p-6">
        <div className="grid grid-cols-7 mb-2">
          {DAY_HEADERS.map((d) => (
            <div key={d} className="px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200">
          {monthGrid.map((cell, idx) => {
            const rowSessions = cell.key ? sessionsByDayKey[cell.key] ?? [] : [];
            const isToday = cell.inMonth && cell.dateNum === TODAY_DATE;
            const clickable = !!cell.key && rowSessions.length > 0;
            return (
              <div
                key={idx}
                onClick={() => clickable && onDayClick(cell.key)}
                className={cn(
                  "bg-white min-h-[110px] px-2 py-2 flex flex-col gap-1 transition-colors",
                  !cell.inMonth && "bg-slate-50",
                  clickable && !isToday && "cursor-pointer hover:bg-amber-50/50",
                  isToday && "bg-amber-50",
                  isToday && clickable && "cursor-pointer hover:bg-amber-100/70"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "text-sm font-semibold",
                    !cell.inMonth ? "text-slate-300"
                      : isToday ? "w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center"
                      : "text-slate-700"
                  )}>
                    {cell.dateNum}
                  </span>
                  {rowSessions.length > 0 && (
                    <span className="text-[10px] text-slate-400">
                      {rowSessions.length} session{rowSessions.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {rowSessions.slice(0, 3).map((s) => {
                    const dept = getDeptColor(s.department, s.type);
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] truncate",
                          dept.bg, dept.border, dept.text
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dept.dot)} />
                        <span className="truncate">{fmt12(s.startTime).replace(":00", "")} {s.subject}</span>
                      </div>
                    );
                  })}
                  {rowSessions.length > 3 && (
                    <span className="text-[10px] text-slate-400 font-medium px-1.5">
                      +{rowSessions.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
