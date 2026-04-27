"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast as sonnerToast } from "sonner";
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
  Settings,
  Search,
  SlidersHorizontal,
  Users,
  Tag,
  BookOpen,
  CalendarDays,
  List,
  LayoutGrid,
  CalendarX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { RoleBanner } from "@/components/ui/role-banner";
import {
  type TimetableSession,
} from "@/lib/mock-data";
import {
  useAssessments,
  isoToDayKey,
  isoToDateLabel,
  type AssessmentRecord,
} from "@/lib/assessment-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { NewSessionDialog } from "@/components/timetable/new-session-dialog";

// ─── Grid constants ───────────────────────────────────────────────────────────

const START_HOUR       = 8;
const END_HOUR         = 23;
const BASE_SLOT_HEIGHT = 40;
const TOTAL_SLOTS      = (END_HOUR - START_HOUR) * 2;

// Kept for module-level helpers that don't need zoom (layout computation only)
const SLOT_HEIGHT = BASE_SLOT_HEIGHT;
const GRID_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT;

type ZoomLevel = "S" | "M" | "L" | "XL";
const ZOOM_HEIGHTS: Record<ZoomLevel, number> = { S: 28, M: 40, L: 56, XL: 80 };

// Institute working hours — outside these slots are greyed/hatched in Day view
const INSTITUTE_START_MINS = 15 * 60; // 3:00 pm
const INSTITUTE_END_MINS   = 20 * 60; // 8:00 pm

// ─── Days ─────────────────────────────────────────────────────────────────────

const ALL_DAY_KEYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const DAY_LONG: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_LONG  = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

type DayInfo = { key: string; label: string; long: string; date: number; fullDate: Date };

// Monday of the week containing `date` (Mon-Sat are operating days; Sun rolls into prev week).
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 = Sun, 1 = Mon … 6 = Sat
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function buildWeekDays(weekStart: Date, count: number): DayInfo[] {
  return Array.from({ length: count }, (_, i) => {
    const d = addDays(weekStart, i);
    const key = ALL_DAY_KEYS[i];
    return {
      key,
      label: `${key} ${d.getDate()}`,
      long: DAY_LONG[key],
      date: d.getDate(),
      fullDate: d,
    };
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function todayDayKey(now: Date): string | null {
  const dow = now.getDay();
  return dow === 0 ? null : ALL_DAY_KEYS[dow - 1];
}

function formatWeekHeader(weekStart: Date): string {
  const end = addDays(weekStart, 5); // Saturday (Mon-Sat operating week)
  const sd = weekStart.getDate(), ed = end.getDate();
  const sm = MONTH_SHORT[weekStart.getMonth()], em = MONTH_SHORT[end.getMonth()];
  const sy = weekStart.getFullYear(), ey = end.getFullYear();
  if (sy !== ey) return `${sd} ${sm} ${sy} – ${ed} ${em} ${ey}`;
  if (sm !== em) return `${sd} ${sm} – ${ed} ${em} ${ey}`;
  return `${sd}–${ed} ${em} ${ey}`;
}

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

// ─── Assessment-store → session adapter ───────────────────────────────────────

type NewAssessmentFields = {
  isNewAssessment?: boolean;
  assessmentId?: string;
  assessmentStudentName?: string;
};

export type ExtendedSession = TimetableSession & NewAssessmentFields;

function assessmentToSessions(a: AssessmentRecord): ExtendedSession[] {
  const day = isoToDayKey(a.date);
  const dateLabel = isoToDateLabel(a.date);
  return a.teachers.map((teacher, i) => ({
    id: `${a.id}-${i}`,
    day,
    date: dateLabel,
    subject: `${a.yearGroup} ${a.subject}`,
    department: a.department,
    teacher,
    teacherId: '',
    room: a.room,
    startTime: a.time,
    endTime: a.endTime,
    duration: 15,
    students: [a.studentName],
    studentCount: 1,
    type: "Assessment",
    status: a.status === "Done" ? "Completed" : "Scheduled",
    isNewAssessment: true,
    assessmentId: a.id,
    assessmentStudentName: a.studentName,
  }));
}

// ─── Overlap layout ───────────────────────────────────────────────────────────

type LayoutSession = ExtendedSession & { colIndex: number; colCount: number };

function layoutSessions(sessions: ExtendedSession[]): LayoutSession[] {
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
  const isNewAssessment = Boolean(session.isNewAssessment);
  const chipHeight   = typeof style.height === "number" ? style.height : 0;
  const showBadge    = session.type !== "Regular" && chipHeight > 64 && !compact && !isNewAssessment;
  const showStudents = !compact && chipHeight > 56;
  const showCountSuffix = compact && session.studentCount > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "absolute rounded-lg border overflow-hidden cursor-pointer transition-all hover:shadow-md hover:brightness-95 z-[6]",
        isNewAssessment
          ? "bg-amber-500/20 border-amber-300 text-amber-900 border-l-4 border-l-amber-500"
          : cn(deptColor.bg, deptColor.border, deptColor.text),
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
            {isNewAssessment
              ? `Assessment — ${session.assessmentStudentName ?? session.students[0] ?? ""} · ${session.subject}`
              : `${session.subject}${showCountSuffix ? ` (${session.studentCount})` : ""}`}
          </p>
        </div>
        <p className={cn(
          "opacity-70 leading-tight truncate mt-0.5",
          compact ? "text-[9px]" : "text-[10px]"
        )}>
          {isNewAssessment
            ? `${cleanName(session.teacher)} · ${session.room}`
            : surname(session.teacher)}
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

function TimeColumn({ slotH, gridH }: { slotH: number; gridH: number }) {
  return (
    <div
      className="w-[60px] flex-shrink-0 relative bg-white border-r border-slate-200"
      style={{ height: gridH }}
    >
      {TIME_LABELS.map((t, i) => {
        const isHour = t.endsWith(":00");
        return (
          <div
            key={t}
            className="absolute right-2 flex items-center pointer-events-none"
            style={{ top: i * slotH - 7 }}
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

// ─── Session Detail Modal ─────────────────────────────────────────────────────

type DerivedStatus = "Upcoming" | "In Progress" | "Completed" | "Cancelled";

function deriveStatus(session: TimetableSession, dateIso: string | null, now: Date): DerivedStatus {
  if (session.status === "Cancelled") return "Cancelled";
  if (session.status === "Completed") return "Completed";
  if (!dateIso) return "Upcoming";
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (dateIso !== todayIso) {
    return dateIso < todayIso ? "Completed" : "Upcoming";
  }
  const mins = now.getHours() * 60 + now.getMinutes();
  const start = timeToMins(session.startTime);
  const end   = timeToMins(session.endTime);
  if (mins < start)  return "Upcoming";
  if (mins >= end)   return "Completed";
  return "In Progress";
}

function SessionDetailModal({
  session,
  dateIso,
  now,
  onClose,
  onEdit,
  onCancelled,
}: {
  session: TimetableSession;
  dateIso: string | null;
  now: Date;
  onClose: () => void;
  onEdit: () => void;
  onCancelled: () => void;
}) {
  const { can } = usePermission();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);

  const derived = deriveStatus(session, dateIso, now);
  const yearMatch = session.subject.match(/^(KG\d*|Y\d+)/);
  const yearGroup = yearMatch?.[1] ?? null;

  function navigateAttendance() {
    onClose();
    router.push("/attendance");
  }

  async function handleConfirmCancel() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setReasonError("Please provide a reason for cancelling this session.");
      return;
    }
    try {
      const res = await fetch(`/api/attendance/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Cancelled', notes: trimmed }),
      });
      if (!res.ok) throw new Error();
    } catch {
      sonnerToast.error("Failed to cancel session");
      return;
    }
    setConfirmOpen(false);
    setReason("");
    setReasonError(null);
    sonnerToast.success("Session cancelled");
    onCancelled();
  }

  return (
    <>
      <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85vh]">

          {/* Header */}
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800 leading-tight pr-2">
              {session.subject}
            </DialogTitle>
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {yearGroup && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                  {yearGroup}
                </span>
              )}
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium",
                DEPT_BADGE[session.department] ?? "bg-slate-100 text-slate-600"
              )}>
                {session.department}
              </span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-medium",
                TYPE_BADGE[session.type] ?? "bg-slate-100 text-slate-600"
              )}>
                {session.type}
              </span>
              {session.isTrial && session.type !== "Trial" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400 text-white">
                  Trial
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">

            {/* Meta rows */}
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Teacher</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{session.teacher}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Room</p>
                  <p className="text-sm font-medium text-slate-800 truncate">{session.room}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Date &amp; Time</p>
                  <p className="text-sm font-medium text-slate-800">
                    {DAY_LONG[session.day] ?? session.day} {session.date}
                  </p>
                  <p className="text-xs text-slate-500">
                    {fmt12(session.startTime)} – {fmt12(session.endTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Status pill */}
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">Status</p>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                derived === "Upcoming"    && "bg-blue-50 text-blue-700",
                derived === "In Progress" && "bg-amber-50 text-amber-700",
                derived === "Completed"   && "bg-emerald-50 text-emerald-700",
                derived === "Cancelled"   && "bg-red-50 text-red-600",
              )}>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  derived === "Upcoming"    && "bg-blue-500",
                  derived === "In Progress" && "bg-amber-500 animate-pulse",
                  derived === "Completed"   && "bg-emerald-500",
                  derived === "Cancelled"   && "bg-red-500",
                )} />
                {derived}
              </span>
            </div>

            {/* Students */}
            <div>
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">
                Students ({session.studentCount})
              </p>
              {session.students.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No students — staff session</p>
              ) : (
                <div className="space-y-1.5">
                  {session.students.map((name) => (
                    <div key={name} className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0",
                        avatarColor(name),
                      )}>
                        {initials(name)}
                      </div>
                      <span className="text-sm text-slate-700 truncate">{name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer — context-sensitive actions */}
          <DialogFooter className="flex items-center gap-2 flex-wrap">
            {derived === "Upcoming" && (
              <>
                {can('timetable.editSession') && (
                  <button
                    type="button"
                    onClick={onEdit}
                    className="flex-1 min-w-0 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Edit session
                  </button>
                )}
                {can('timetable.cancelSession') && (
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(true)}
                    className="px-3 py-2 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Cancel session
                  </button>
                )}
              </>
            )}
            {derived === "In Progress" && (
              <button
                type="button"
                onClick={navigateAttendance}
                className="flex-1 min-w-0 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Mark attendance
              </button>
            )}
            {derived === "Completed" && (
              <button
                type="button"
                onClick={navigateAttendance}
                className="flex-1 min-w-0 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
              >
                View attendance record
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 border border-slate-200 bg-white text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel-session confirmation */}
      <Dialog
        open={confirmOpen}
        onOpenChange={(o) => {
          setConfirmOpen(o);
          if (!o) { setReason(""); setReasonError(null); }
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-800">Cancel this session?</DialogTitle>
            <p className="text-xs text-slate-500 mt-1">
              {session.subject} · {DAY_LONG[session.day] ?? session.day} {session.date} · {fmt12(session.startTime)}
            </p>
          </DialogHeader>

          <div className="px-6 py-5 space-y-2">
            <label htmlFor="cancel-reason" className="block text-xs font-semibold text-slate-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError(null);
              }}
              rows={3}
              placeholder="e.g. Teacher unavailable, room flooded, public holiday…"
              className={cn(
                "w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2",
                reasonError
                  ? "border-red-300 focus:ring-red-300 focus:border-red-400"
                  : "border-slate-300 focus:ring-amber-400 focus:border-amber-400",
              )}
            />
            {reasonError && <p className="text-xs text-red-600">{reasonError}</p>}
          </div>

          <DialogFooter className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => { setConfirmOpen(false); setReason(""); setReasonError(null); }}
              className="px-3 py-1.5 border border-slate-300 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Keep session
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel session
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── Department / Team Dropdown ───────────────────────────────────────────────

const DEPARTMENTS = ["Junior Department", "Senior Department", "Central Department"];

function DeptTeamDropdown({
  allTeachers,
  selectedDepts,
  onChangeDepths,
  showHeader,
  onToggleHeader,
}: {
  allTeachers: string[];
  selectedDepts: string[];
  onChangeDepths: (v: string[]) => void;
  showHeader: boolean;
  onToggleHeader: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const allSelected = selectedDepts.length === 0;

  function toggleDept(d: string) {
    onChangeDepths(
      selectedDepts.includes(d) ? selectedDepts.filter((x) => x !== d) : [...selectedDepts, d]
    );
  }

  const label = selectedDepts.length === 0
    ? "All Departments"
    : selectedDepts.length === 1
      ? selectedDepts[0].replace(" Department", " Dep.")
      : `${selectedDepts.length} Departments`;

  const filteredTeachers = allTeachers.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer max-w-[160px]"
      >
        <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span className="truncate">{label}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-[220px] max-h-[320px] overflow-auto">
            {/* Header toggle */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 mb-1">
              <span className="text-xs font-semibold text-slate-700">Header</span>
              <button
                onClick={onToggleHeader}
                className={cn(
                  "relative inline-flex h-5 w-9 rounded-full transition-colors cursor-pointer",
                  showHeader ? "bg-blue-500" : "bg-slate-200"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                  showHeader ? "translate-x-4" : "translate-x-0.5"
                )} />
              </button>
            </div>

            {/* Select all */}
            <button
              onClick={() => onChangeDepths([])}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors cursor-pointer",
                allSelected ? "bg-amber-50 text-amber-800 font-semibold" : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <div className={cn("w-4 h-4 rounded border flex items-center justify-center",
                allSelected ? "bg-amber-500 border-amber-500" : "border-slate-300"
              )}>
                {allSelected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
              </div>
              <Users className="w-3.5 h-3.5 text-slate-400" />
              Select all
            </button>

            {/* Departments */}
            {DEPARTMENTS.map((d) => {
              const checked = selectedDepts.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => toggleDept(d)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className={cn("w-4 h-4 rounded border flex items-center justify-center",
                    checked ? "bg-blue-500 border-blue-500" : "border-slate-300"
                  )}>
                    {checked && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </div>
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {d}
                </button>
              );
            })}

            {/* Individual teachers */}
            {filteredTeachers.slice(0, 8).map((t) => {
              const ini = initials(t);
              const col = avatarColor(t);
              return (
                <button
                  key={t}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className={cn("w-4 h-4 rounded border border-slate-300")} />
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0",
                    col
                  )}>
                    {ini}
                  </div>
                  <span className="truncate">{t}</span>
                </button>
              );
            })}

            <div className="border-t border-slate-100 mt-1 pt-1">
              <button className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer">
                Create and manage teams
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Location Dropdown ────────────────────────────────────────────────────────

function LocationDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const options = ["Select location", "Gold & Diamond Park", "Online"];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <span>{value || "Select location"}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[180px]">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => { onChange(opt === "Select location" ? "" : opt); setOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer",
                  value === opt || (opt === "Select location" && !value)
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

// ─── View Mode Dropdown ───────────────────────────────────────────────────────

const VIEW_ICONS: Record<string, React.ReactNode> = {
  Day:   <CalendarDays className="w-3.5 h-3.5" />,
  Week:  <LayoutGrid className="w-3.5 h-3.5" />,
  Month: <CalendarDays className="w-3.5 h-3.5" />,
  List:  <List className="w-3.5 h-3.5" />,
};

function ViewModeDropdown({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const views = ["Day", "Week", "Month", "List"];
  const filtered = views.filter((v) => v.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer",
          open
            ? "bg-slate-100 border-slate-300 text-slate-800"
            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
        )}
      >
        {open ? (
          <>
            <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              placeholder="Search"
              className="bg-transparent outline-none w-16 text-xs"
            />
            <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0 rotate-180" />
          </>
        ) : (
          <>
            <span>{value}</span>
            <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => { setOpen(false); setSearch(""); }} />
          <div className="absolute top-full mt-1 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[140px]">
            {filtered.map((v) => (
              <button
                key={v}
                onClick={() => { onChange(v); setOpen(false); setSearch(""); }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 text-slate-500">
                  {VIEW_ICONS[v]}
                  <span className={v === value ? "font-semibold text-slate-800" : ""}>{v}</span>
                </div>
                {v === value && <Check className="w-3.5 h-3.5 text-slate-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Add New Dropdown ─────────────────────────────────────────────────────────

const ADD_NEW_ITEMS = [
  { label: "Class",        icon: <BookOpen className="w-4 h-4 text-slate-500" /> },
  { label: "Rental",       icon: <LayoutGrid className="w-4 h-4 text-slate-500" /> },
  { label: "Meeting",      icon: <Users className="w-4 h-4 text-slate-500" /> },
  { label: "Blocked time", icon: <CalendarX className="w-4 h-4 text-slate-500" /> },
  { label: "Holiday",      icon: <CalendarDays className="w-4 h-4 text-slate-500" /> },
];

function AddNewDropdown({ onSelect }: { onSelect: (type: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 btn-primary px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer"
      >
        Add new
        <ChevronDown className="w-3.5 h-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 min-w-[180px]">
            {ADD_NEW_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => { onSelect(item.label); setOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Zoom Popover ─────────────────────────────────────────────────────────────

const ZOOM_LEVELS: ZoomLevel[] = ["S", "M", "L", "XL"];
const ZOOM_SLIDER_VALUES: Record<ZoomLevel, number> = { S: 0, M: 33, L: 66, XL: 100 };

function ZoomPopover({
  zoom,
  onZoom,
}: {
  zoom: ZoomLevel;
  onZoom: (z: ZoomLevel) => void;
}) {
  const [open, setOpen] = useState(false);
  const sliderVal = ZOOM_SLIDER_VALUES[zoom];

  function handleSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    const closest = ZOOM_LEVELS.reduce((acc, z) =>
      Math.abs(ZOOM_SLIDER_VALUES[z] - v) < Math.abs(ZOOM_SLIDER_VALUES[acc] - v) ? z : acc
    );
    onZoom(closest);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-slate-500"
        aria-label="Calendar settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-1 right-0 z-30 bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-[220px]">
            <p className="text-xs font-semibold text-slate-800 mb-3">Calendar zoom</p>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={sliderVal}
              onChange={handleSlider}
              className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 mb-3"
            />
            <div className="flex justify-between">
              {ZOOM_LEVELS.map((z) => (
                <button
                  key={z}
                  onClick={() => onZoom(z)}
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer",
                    zoom === z ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {z}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Filter Panel (slide-in) ─────────────────────────────────────────────────

type FilterState = {
  eventTypes: string[];
  location: string;
  published: string;
  capacity: string;
  subjects: string[];
};

const ALL_EVENT_TYPES = ["Class", "Rental", "Meeting", "Blocked time"];

function FilterPanel({
  open,
  onClose,
  filters,
  allSubjects,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  allSubjects: string[];
  onApply: (f: FilterState) => void;
}) {
  const [local, setLocal] = useState<FilterState>(filters);
  const [subjSearch, setSubjSearch] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);
  const [publishedOpen, setPublishedOpen] = useState(false);
  const [capacityOpen, setCapacityOpen] = useState(false);

  useEffect(() => { setLocal(filters); }, [filters, open]);

  function toggleEventType(t: string) {
    setLocal((f) => ({
      ...f,
      eventTypes: f.eventTypes.includes(t)
        ? f.eventTypes.filter((x) => x !== t)
        : [...f.eventTypes, t],
    }));
  }

  function toggleSubject(s: string) {
    setLocal((f) => ({
      ...f,
      subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s],
    }));
  }

  const filtSubjects = allSubjects.filter((s) =>
    s.toLowerCase().includes(subjSearch.toLowerCase())
  );

  const EVENT_ICONS: Record<string, React.ReactNode> = {
    Class:         <BookOpen className="w-4 h-4" />,
    Rental:        <LayoutGrid className="w-4 h-4" />,
    Meeting:       <Users className="w-4 h-4" />,
    "Blocked time": <CalendarX className="w-4 h-4" />,
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-[380px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <p className="text-sm font-bold text-slate-800">Calendar filters</p>
            <p className="text-xs text-slate-500 mt-0.5">Refine the events you see on the calendar.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* Event type */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-700">Event type</p>
              <button
                onClick={() => setLocal((f) => ({ ...f, eventTypes: [] }))}
                className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                −
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_EVENT_TYPES.map((t) => {
                const active = local.eventTypes.includes(t);
                return (
                  <button
                    key={t}
                    onClick={() => toggleEventType(t)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-4 rounded-xl border transition-all cursor-pointer text-xs font-medium",
                      active
                        ? "bg-slate-800 text-white border-slate-800"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span className={active ? "text-white" : "text-slate-400"}>{EVENT_ICONS[t]}</span>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={() => setLocationOpen((o) => !o)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Location
              <Plus className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", locationOpen && "rotate-45")} />
            </button>
            {locationOpen && (
              <div className="mt-2 space-y-1">
                {["Gold & Diamond Park", "Online"].map((loc) => (
                  <label key={loc} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer py-1">
                    <input
                      type="radio"
                      name="filter-location"
                      checked={local.location === loc}
                      onChange={() => setLocal((f) => ({ ...f, location: loc }))}
                      className="accent-amber-500"
                    />
                    {loc}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Published */}
          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={() => setPublishedOpen((o) => !o)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Published
              <Plus className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", publishedOpen && "rotate-45")} />
            </button>
            {publishedOpen && (
              <div className="mt-2 space-y-1">
                {["Published", "Unpublished"].map((p) => (
                  <label key={p} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer py-1">
                    <input
                      type="radio"
                      name="filter-published"
                      checked={local.published === p}
                      onChange={() => setLocal((f) => ({ ...f, published: p }))}
                      className="accent-amber-500"
                    />
                    {p}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Capacity */}
          <div className="border-t border-slate-100 pt-4">
            <button
              onClick={() => setCapacityOpen((o) => !o)}
              className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Capacity
              <Plus className={cn("w-3.5 h-3.5 text-slate-400 transition-transform", capacityOpen && "rotate-45")} />
            </button>
            {capacityOpen && (
              <div className="mt-2 flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-1/2 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-400"
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="w-1/2 border border-slate-200 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Subjects */}
          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-700">Subjects</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLocal((f) => ({ ...f, subjects: [...allSubjects] }))}
                  className="text-[10px] text-blue-600 hover:underline cursor-pointer"
                >
                  Select All
                </button>
                <button
                  onClick={() => setLocal((f) => ({ ...f, subjects: [] }))}
                  className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Clear
                </button>
                <span className="text-slate-200">−</span>
              </div>
            </div>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
              <input
                value={subjSearch}
                onChange={(e) => setSubjSearch(e.target.value)}
                placeholder="Search subject name"
                className="w-full border border-slate-200 rounded-lg pl-7 pr-3 py-1.5 text-xs outline-none focus:border-amber-400"
              />
            </div>
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {filtSubjects.map((s) => (
                <label key={s} className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer py-1 hover:bg-slate-50 rounded px-1">
                  <div
                    onClick={() => toggleSubject(s)}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center cursor-pointer",
                      local.subjects.includes(s) ? "bg-blue-500 border-blue-500" : "border-slate-300"
                    )}
                  >
                    {local.subjects.includes(s) && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                  </div>
                  {s}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200">
          <button
            onClick={() => {
              const empty: FilterState = { eventTypes: [], location: "", published: "", capacity: "", subjects: [] };
              setLocal(empty);
              onApply(empty);
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            Reset filters
          </button>
          <button
            onClick={() => { onApply(local); onClose(); }}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg cursor-pointer"
          >
            Apply filters
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
  const [now, setNow] = useState<Date>(() => {
    const d = new Date();
    // Sunday is outside the Mon–Sat grid; start at next Monday instead
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return d;
  });
  const weekStart   = useMemo(() => getMondayOfWeek(now), [now]);
  const days        = useMemo(() => buildWeekDays(weekStart, 6), [weekStart]);
  const weekDays    = useMemo(() => buildWeekDays(weekStart, 7), [weekStart]);
  const todayKey    = useMemo(() => {
    const today = new Date();
    const found = days.find(d => isSameDay(d.fullDate, today));
    return found ? found.key : null;
  }, [days]);
  const weekHeader  = useMemo(() => formatWeekHeader(weekStart), [weekStart]);
  const monthHeader = useMemo(() => `${MONTH_LONG[now.getMonth()]} ${now.getFullYear()}`, [now]);
  const [activeDay,       setActiveDay]       = useState<string>(() => {
    const d = new Date();
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return todayDayKey(d) ?? "Mon";
  });
  const [activeView,      setActiveView]      = useState<ViewMode>("Day");
  const [weekSubMode,     setWeekSubMode]     = useState<WeekSubMode>("Room");
  const [selectedSession, setSelectedSession] = useState<ExtendedSession | null>(null);
  const [editSession,     setEditSession]     = useState<(ExtendedSession & { dateIso: string }) | null>(null);
  const { assessments, markDone, cancel } = useAssessments();
  const [showNewSession,  setShowNewSession]  = useState(false);
  const [sessionTick,     setSessionTick]     = useState(0);
  const [liveSessions,    setLiveSessions]    = useState<TimetableSession[]>([]);
  const [filterLocation,  setFilterLocation]  = useState("All");
  const [filterDept,      setFilterDept]      = useState("All");
  const [filterTeacher,   setFilterTeacher]   = useState("All");
  const [filterRoom,      setFilterRoom]      = useState("All");
  const [filterType,      setFilterType]      = useState("All");
  const [toast,           setToast]           = useState<string | null>(null);
  const [rooms,           setRooms]           = useState<{ id: string; name: string; capacity: number | null }[]>([]);
  // New: zoom, filter panel, show-header toggle, selected depts, location
  const [zoom,            setZoom]            = useState<ZoomLevel>("M");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showHeader,      setShowHeader]      = useState(true);
  const [selectedDepts,   setSelectedDepts]   = useState<string[]>([]);
  const [locationFilter,  setLocationFilter]  = useState("");
  const [panelFilters,    setPanelFilters]    = useState<FilterState>({
    eventTypes: [], location: "", published: "", capacity: "", subjects: [],
  });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    fetch('/api/settings/rooms')
      .then(r => r.ok ? r.json() : [])
      .then((data: { id: string; name: string; capacity: number | null }[]) => setRooms(data ?? []))
      .catch(() => {});
  }, []);

  const gridScrollRef = useRef<HTMLDivElement>(null);

  // Fetch live sessions from API whenever the week or tick changes
  useEffect(() => {
    // Use local date parts — toISOString() converts to UTC which shifts the date for non-UTC timezones
    const d = weekStart
    const weekIso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    fetch(`/api/attendance/sessions?week_start=${weekIso}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(({ data }) => setLiveSessions(
        (data ?? []).map((s: Record<string, unknown>) => ({
          id: s.id,
          day: s.day,
          date: s.date,
          subject: s.subject,
          department: s.department,
          teacher: s.teacher,
          teacherId: s.teacherId,
          room: s.room,
          startTime: s.startTime,
          endTime: s.endTime,
          duration: s.duration,
          type: s.type,
          status: s.status,
          students: (s.students as Array<{ id: string; name: string }> ?? []).map((st) => st.name),
          studentCount: s.studentCount,
          existingRecords: s.existingRecords,
          attendanceMarked: s.attendanceMarked,
          assignedTAs: s.assignedTAs,
        }))
      ))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart, sessionTick]);

  const allSessions = useMemo<ExtendedSession[]>(() => {
    const derived = assessments.flatMap(assessmentToSessions);
    return [...liveSessions, ...derived];
  }, [assessments, liveSessions]);

  const teachers = useMemo(() => {
    const names = Array.from(new Set(allSessions.map((s) => s.teacher))).sort();
    return ["All", ...names];
  }, [allSessions]);

  const roomOptions = useMemo(() => ["All", ...rooms.map((r) => r.name)], []);

  // Filters shared by all views (everything except the active-day filter).
  const weekSessions = useMemo(() =>
    allSessions.filter((s) => {
      if (filterDept    !== "All" && s.department !== filterDept)    return false;
      if (filterTeacher !== "All" && s.teacher    !== filterTeacher) return false;
      if (filterRoom    !== "All" && s.room       !== filterRoom)    return false;
      if (filterType    !== "All" && s.type       !== filterType)    return false;
      return true;
    }),
    [allSessions, filterDept, filterTeacher, filterRoom, filterType]
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

  // Day view: ALL teachers seen across the week (to show day-off columns for teachers with no sessions today)
  const allWeekTeachers = useMemo(
    () => teachers.slice(1), // already sorted, excludes "All"
    [teachers]
  );

  const dayTeachers = useMemo(() => {
    if (filterTeacher !== "All") return [filterTeacher];
    return allWeekTeachers;
  }, [allWeekTeachers, filterTeacher]);

  // Zoom-derived values (used throughout render)
  const slotH  = ZOOM_HEIGHTS[zoom];
  const gridH  = TOTAL_SLOTS * slotH;
  const toPx   = (t: string) => ((timeToMins(t) - START_HOUR * 60) / 30) * slotH;
  const durPx  = (dur: number) => (dur / 30) * slotH;

  // Pixel offsets for institute-hours hatching
  const instStartPx = ((INSTITUTE_START_MINS - START_HOUR * 60) / 30) * slotH;
  const instEndPx   = ((INSTITUTE_END_MINS   - START_HOUR * 60) / 30) * slotH;

  // Subjects from all sessions (for filter panel)
  const allSubjects = useMemo(
    () => Array.from(new Set(allSessions.map((s) => s.subject))).sort(),
    [allSessions]
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
    for (const d of weekDays) {
      map[d.key] = layoutSessions(weekSessions.filter((s) => s.day === d.key));
    }
    return map;
  }, [weekSessions, weekDays]);

  // Current-time indicator position — derived from `now` so the red line tracks live time.
  const currentTimeStr = useMemo(() => {
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }, [now]);
  const CURRENT_TIME_PX = toPx(currentTimeStr);

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

      const scrollY = ((targetMins - START_HOUR * 60) / 30) * slotH;
      container.scrollTop = Math.max(scrollY, 0);
    });

    return () => cancelAnimationFrame(raf);
  }, [activeView, weekSubMode, activeDay, daySessions, weekSessions]);

  if (!can('timetable.view')) return <AccessDenied />;

  return (
    <div className="flex flex-col h-full">

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b border-slate-200 flex-shrink-0">

        {/* Left: dept, location, filter */}
        <div className="flex items-center gap-1.5">
          <DeptTeamDropdown
            allTeachers={allWeekTeachers}
            selectedDepts={selectedDepts}
            onChangeDepths={setSelectedDepts}
            showHeader={showHeader}
            onToggleHeader={() => setShowHeader((v) => !v)}
          />
          <LocationDropdown value={locationFilter} onChange={setLocationFilter} />
          <button
            onClick={() => setShowFilterPanel(true)}
            className={cn(
              "p-2 rounded-lg border transition-colors cursor-pointer",
              (panelFilters.eventTypes.length > 0 || panelFilters.subjects.length > 0 || panelFilters.location)
                ? "border-amber-300 bg-amber-50 text-amber-600"
                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
            )}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Center: date navigation */}
        <div className="flex-1 flex items-center justify-center gap-1.5">
          <button
            onClick={() => {
              if (activeView === "Day") {
                const idx = ALL_DAY_KEYS.indexOf(activeDay as typeof ALL_DAY_KEYS[number]);
                if (idx > 0) {
                  setActiveDay(ALL_DAY_KEYS[idx - 1]);
                } else {
                  const prev = addDays(weekStart, -7);
                  setNow(prev);
                  setActiveDay("Sat");
                }
              } else if (activeView === "Month") {
                setNow(new Date(now.getFullYear(), now.getMonth() - 1, 1));
              } else {
                setNow(addDays(weekStart, -7));
              }
            }}
            className="p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer text-slate-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const fresh = new Date();
              // Sunday (dow=0) is outside the Mon–Sat grid; advance to next Monday
              if (fresh.getDay() === 0) fresh.setDate(fresh.getDate() + 1);
              setNow(fresh);
              setActiveDay(todayDayKey(fresh) ?? "Mon");
            }}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Today
          </button>
          <span className="text-sm font-semibold text-slate-800 px-1 select-none min-w-[200px] text-center">
            {activeView === "Day"
              ? (() => {
                  const d = days.find((x) => x.key === activeDay);
                  return d
                    ? `${d.long}, ${MONTH_LONG[d.fullDate.getMonth()]} ${d.date}, ${d.fullDate.getFullYear()}`
                    : weekHeader;
                })()
              : activeView === "Month" ? monthHeader : weekHeader}
          </span>
          <button
            onClick={() => {
              if (activeView === "Day") {
                const idx = ALL_DAY_KEYS.indexOf(activeDay as typeof ALL_DAY_KEYS[number]);
                if (idx < 5) {
                  setActiveDay(ALL_DAY_KEYS[idx + 1]);
                } else {
                  const next = addDays(weekStart, 7);
                  setNow(next);
                  setActiveDay("Mon");
                }
              } else if (activeView === "Month") {
                setNow(new Date(now.getFullYear(), now.getMonth() + 1, 1));
              } else {
                setNow(addDays(weekStart, 7));
              }
            }}
            className="p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer text-slate-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: zoom, view mode, add new */}
        <div className="flex items-center gap-1.5">
          <ZoomPopover zoom={zoom} onZoom={setZoom} />
          <ViewModeDropdown value={activeView} onChange={(v) => setActiveView(v as ViewMode)} />
          {can('timetable.createSession') && (
            <AddNewDropdown onSelect={() => setShowNewSession(true)} />
          )}
        </div>
      </div>

      {/* ── Role banner (Teacher / TA only) ───────────────────────────────── */}
      {(role === 'Teacher' || role === 'TA') && (
        <div className="px-6 pt-3">
          <RoleBanner message="You can edit and manage your own sessions only." />
        </div>
      )}

      {/* ── Day tabs (Week-Room only) ──────────────────────────────────────── */}
      {activeView === "Week" && weekSubMode === "Room" && (
        <div className="flex items-center bg-white border-b border-slate-200 flex-shrink-0 px-6">
          {days.map((d) => (
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
              {d.key === todayKey && (
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
            {days.find((d) => d.key === activeDay)?.label} — {daySessions.length} session{daySessions.length !== 1 ? "s" : ""}
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

            <div className="flex relative" style={{ height: gridH }}>
              <TimeColumn slotH={slotH} gridH={gridH} />
              {activeDay === todayKey && (
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
                    style={{ height: gridH }}
                  >
                    {TIME_LABELS.slice(1).map((t, i) => (
                      <div
                        key={t}
                        className={cn(
                          "absolute left-0 right-0 border-t pointer-events-none",
                          t.endsWith(":00") ? "border-slate-200" : "border-slate-100"
                        )}
                        style={{ top: (i + 1) * slotH }}
                      />
                    ))}

                    {TIME_LABELS.slice(0, -1).map((t, i) => (
                      <div
                        key={t}
                        onClick={() => setShowNewSession(true)}
                        className="absolute left-0 right-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group z-[5]"
                        style={{ top: i * slotH, height: slotH }}
                      >
                        <div className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                          <Plus className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                        </div>
                      </div>
                    ))}

                    {roomSessions.map((session) => {
                      const top    = toPx(session.startTime);
                      const height = durPx(session.duration);
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
              {weekDays.map((d) => {
                const count = sessionsByDay[d.key]?.length ?? 0;
                const isSunday = d.key === "Sun";
                return (
                  <div
                    key={d.key}
                    className={cn(
                      "flex-1 min-w-[140px] px-2 py-2.5 border-l border-slate-200 text-center",
                      d.key === todayKey && "bg-amber-50/50",
                      isSunday && "bg-slate-50"
                    )}
                  >
                    <p className={cn(
                      "text-[11px] font-semibold uppercase tracking-wide",
                      isSunday ? "text-slate-400"
                        : d.key === todayKey ? "text-amber-700" : "text-slate-400"
                    )}>
                      {d.long.slice(0, 3)}
                    </p>
                    <p className={cn(
                      "text-sm font-bold",
                      isSunday ? "text-slate-400"
                        : d.key === todayKey ? "text-amber-700" : "text-slate-700"
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

            <div className="flex" style={{ height: gridH }}>
              <TimeColumn slotH={slotH} gridH={gridH} />
              {weekDays.map((d) => {
                const dSessions = sessionsByDay[d.key] ?? [];
                const isSunday = d.key === "Sun";
                return (
                  <div
                    key={d.key}
                    className={cn(
                      "flex-1 min-w-[140px] relative border-l border-slate-200 bg-white",
                      d.key === todayKey && "bg-amber-50/20",
                      isSunday && "bg-slate-50"
                    )}
                    style={{
                      height: gridH,
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
                        style={{ top: (i + 1) * slotH }}
                      />
                    ))}

                    {!isSunday && TIME_LABELS.slice(0, -1).map((t, i) => (
                      <div
                        key={t}
                        onClick={() => setShowNewSession(true)}
                        className="absolute left-0 right-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group z-[5]"
                        style={{ top: i * slotH, height: slotH }}
                      >
                        <div className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                          <Plus className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                        </div>
                      </div>
                    ))}

                    {d.key === todayKey && (
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
                      const top    = toPx(session.startTime);
                      const height = durPx(session.duration);
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

        {/* ════ DAY VIEW (teacher columns + avatar headers + outside-hours hatching) ═ */}
        {activeView === "Day" && (
          <div className="min-w-max w-full flex flex-col">

            {/* Teacher / avatar header row */}
            {showHeader && (
              <div className="sticky top-0 z-20 flex bg-white border-b border-slate-200 shadow-sm">
                <div className="w-[60px] flex-shrink-0 border-r border-slate-200" />
                {dayTeachers.length === 0 ? (
                  <div className="flex-1 px-3 py-4 text-center text-xs text-slate-400">No teachers this week</div>
                ) : (
                  dayTeachers.map((teacher) => {
                    const count = daySessions.filter((s) => s.teacher === teacher).length;
                    const isOff = count === 0;
                    return (
                      <div
                        key={teacher}
                        className="flex-1 min-w-[160px] px-3 py-3 border-l border-slate-200 text-center"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full mx-auto flex items-center justify-center text-sm font-bold shadow-sm",
                          isOff ? "bg-slate-200 text-slate-400" : "text-white " + avatarColor(teacher)
                        )}>
                          {initials(teacher)}
                        </div>
                        <p className={cn(
                          "text-xs font-semibold mt-1.5 leading-tight",
                          isOff ? "text-slate-400" : "text-slate-700"
                        )}>
                          {teacher}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {isOff ? "Day off" : `${count} session${count !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            <div className="flex relative" style={{ height: gridH }}>
              <TimeColumn slotH={slotH} gridH={gridH} />
              {activeDay === todayKey && dayTeachers.length > 0 && (
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
                  const isOff = teacherSessions.length === 0;
                  const hatchStyle = {
                    backgroundImage: "repeating-linear-gradient(45deg, #cbd5e1 0, #cbd5e1 1px, transparent 0, transparent 50%)",
                    backgroundSize: "6px 6px",
                  };
                  return (
                    <div
                      key={teacher}
                      className="flex-1 min-w-[160px] relative border-l border-slate-200"
                      style={{ height: gridH, backgroundColor: "#f8fafc" }}
                    >
                      {/* Full-column hatch when teacher has no sessions (day off) */}
                      {isOff && (
                        <div className="absolute inset-0 pointer-events-none" style={hatchStyle} />
                      )}

                      {/* Outside-hours hatching (before 3pm and after 8pm) for active teachers */}
                      {!isOff && instStartPx > 0 && (
                        <div
                          className="absolute left-0 right-0 pointer-events-none z-[1]"
                          style={{ top: 0, height: instStartPx, ...hatchStyle }}
                        />
                      )}
                      {!isOff && (
                        <div
                          className="absolute left-0 right-0 pointer-events-none z-[1]"
                          style={{ top: instEndPx, bottom: 0, ...hatchStyle }}
                        />
                      )}

                      {/* Within-hours clean background */}
                      {!isOff && (
                        <div
                          className="absolute left-0 right-0 bg-white"
                          style={{ top: instStartPx, height: instEndPx - instStartPx }}
                        />
                      )}

                      {/* Grid lines */}
                      {TIME_LABELS.slice(1).map((t, i) => (
                        <div
                          key={t}
                          className={cn(
                            "absolute left-0 right-0 border-t pointer-events-none z-[2]",
                            t.endsWith(":00") ? "border-slate-200" : "border-slate-100"
                          )}
                          style={{ top: (i + 1) * slotH }}
                        />
                      ))}

                      {/* Click-to-add slots */}
                      {!isOff && TIME_LABELS.slice(0, -1).map((t, i) => (
                        <div
                          key={t}
                          onClick={() => setShowNewSession(true)}
                          className="absolute left-0 right-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer group z-[5]"
                          style={{ top: i * slotH, height: slotH }}
                        >
                          <div className="w-5 h-5 rounded-full bg-slate-100 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
                            <Plus className="w-3 h-3 text-slate-400 group-hover:text-amber-600" />
                          </div>
                        </div>
                      ))}

                      {teacherSessions.map((session) => {
                        const top    = toPx(session.startTime);
                        const height = durPx(session.duration);
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
                              zIndex: 6,
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
            days={days}
            todayKey={todayKey}
            onOpen={(s) => setSelectedSession(s)}
          />
        )}

        {/* ════ MONTH VIEW ══════════════════════════════════════════════════ */}
        {activeView === "Month" && (
          <MonthView
            sessions={weekSessions}
            now={now}
            weekStart={weekStart}
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
      {selectedSession && selectedSession.isNewAssessment && selectedSession.assessmentId ? (
        <AssessmentDetailModal
          session={selectedSession}
          assessment={assessments.find((a) => a.id === selectedSession.assessmentId) ?? null}
          onClose={() => setSelectedSession(null)}
          onMarkDone={() => {
            if (selectedSession.assessmentId) {
              markDone(selectedSession.assessmentId);
              setToast("Assessment marked as Done");
            }
          }}
          onCancel={() => {
            if (selectedSession.assessmentId) {
              cancel(selectedSession.assessmentId);
              setSelectedSession(null);
              setToast("Assessment removed from timetable");
            }
          }}
        />
      ) : selectedSession ? (
        <SessionDetailModal
          session={selectedSession}
          dateIso={dateIsoForSession(selectedSession, weekDays)}
          now={now}
          onClose={() => setSelectedSession(null)}
          onEdit={() => {
            const iso = dateIsoForSession(selectedSession, weekDays)
              ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            setEditSession({ ...selectedSession, dateIso: iso });
            setSelectedSession(null);
          }}
          onCancelled={() => {
            setSelectedSession(null);
            setSessionTick((n) => n + 1);
          }}
        />
      ) : null}
      <NewSessionDialog
        open={showNewSession}
        onOpenChange={setShowNewSession}
        onCreated={(sessions) => {
          setSessionTick((n) => n + 1);
          const firstDay = sessions[0]?.day;
          if (firstDay) setActiveDay(firstDay);
        }}
      />
      <NewSessionDialog
        open={!!editSession}
        onOpenChange={(o) => { if (!o) setEditSession(null); }}
        sessionToEdit={editSession}
        onUpdated={() => { setEditSession(null); setSessionTick((n) => n + 1); }}
      />

      {/* ── Filter panel (slide-in) ────────────────────────────────────── */}
      <FilterPanel
        open={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        filters={panelFilters}
        allSubjects={allSubjects}
        onApply={(f) => setPanelFilters(f)}
      />
    </div>
  );
}

function dateIsoForSession(session: TimetableSession, weekDays: DayInfo[]): string | null {
  const match = weekDays.find((d) => d.key === session.day);
  if (!match) return null;
  const d = match.fullDate;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── List View ────────────────────────────────────────────────────────────────

function ListView({
  sessions,
  days,
  todayKey,
  onOpen,
}: {
  sessions: ExtendedSession[];
  days: DayInfo[];
  todayKey: string | null;
  onOpen: (s: ExtendedSession) => void;
}) {
  const grouped = useMemo(() => {
    const map: Record<string, ExtendedSession[]> = {};
    for (const d of days) map[d.key] = [];
    for (const s of sessions) {
      if (map[s.day]) map[s.day].push(s);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => timeToMins(a.startTime) - timeToMins(b.startTime));
    }
    return map;
  }, [sessions, days]);

  return (
    <div className="flex-1 overflow-auto bg-white">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {days.map((d) => {
          const rows = grouped[d.key] ?? [];
          if (rows.length === 0) return null;
          const isToday = d.key === todayKey;
          return (
            <div key={d.key} className="mb-6">
              <div className="sticky top-0 bg-white z-10 py-2 flex items-center gap-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-800">{d.long}</h3>
                <span className="text-xs text-slate-400">· {d.date} {MONTH_SHORT[d.fullDate.getMonth()]}</span>
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
                          <p className="text-sm font-semibold text-slate-800">
                            {s.isNewAssessment
                              ? `Assessment — ${s.assessmentStudentName ?? s.students[0] ?? ""} · ${s.subject}`
                              : s.subject}
                          </p>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                            DEPT_BADGE[s.department] ?? "bg-slate-100 text-slate-600"
                          )}>
                            {s.department}
                          </span>
                          {s.isNewAssessment && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-800 border border-amber-300">
                              Assessment
                            </span>
                          )}
                          {s.isTrial && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-400 text-white">
                              Trial
                            </span>
                          )}
                          {s.type !== "Regular" && s.type !== "Trial" && !s.isNewAssessment && (
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
  now,
  weekStart,
  onDayClick,
}: {
  sessions: ExtendedSession[];
  now: Date;
  weekStart: Date;
  onDayClick: (dayKey: string | null) => void;
}) {
  // Build a Mon-start month grid for the current month, mapping the current week's
  // Mon-Sat dates to day keys so that day-keyed sessions render in the correct cells.
  const monthGrid = useMemo(() => {
    type Cell = {
      dateNum: number;
      inMonth: boolean;
      key: string | null;
      isToday: boolean;
      monthLabel?: "prev" | "next";
    };

    const year = now.getFullYear();
    const month = now.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth  = new Date(year, month + 1, 0);
    const gridStart    = getMondayOfWeek(firstOfMonth);
    const offset       = (firstOfMonth.getDay() + 6) % 7; // Mon=0 … Sun=6
    const totalCells   = Math.ceil((offset + lastOfMonth.getDate()) / 7) * 7;

    // Map each date in the current week (Mon-Sat) to its day key.
    const weekKeyByTime = new Map<number, string>();
    for (let i = 0; i < 6; i++) {
      const d = addDays(weekStart, i);
      weekKeyByTime.set(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(), ALL_DAY_KEYS[i]);
    }

    const cells: Cell[] = [];
    for (let i = 0; i < totalCells; i++) {
      const d = addDays(gridStart, i);
      const inMonth = d.getMonth() === month && d.getFullYear() === year;
      const monthLabel = !inMonth ? (d < firstOfMonth ? "prev" : "next") : undefined;
      const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      cells.push({
        dateNum: d.getDate(),
        inMonth,
        key: weekKeyByTime.get(t) ?? null,
        isToday: isSameDay(d, new Date()),
        monthLabel,
      });
    }
    return cells;
  }, [now, weekStart]);

  const sessionsByDayKey = useMemo(() => {
    const map: Record<string, ExtendedSession[]> = {};
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
            const isToday = cell.isToday;
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

// ─── Assessment Detail Modal ──────────────────────────────────────────────────

function AssessmentDetailModal({
  session,
  assessment,
  onClose,
  onMarkDone,
  onCancel,
}: {
  session: ExtendedSession;
  assessment: AssessmentRecord | null;
  onClose: () => void;
  onMarkDone: () => void;
  onCancel: () => void;
}) {
  const studentName = assessment?.studentName ?? session.assessmentStudentName ?? session.students[0] ?? "";
  const subject = assessment?.subject ?? session.subject;
  const yearGroup = assessment?.yearGroup ?? "";
  const date = assessment?.date ?? session.date;
  const room = assessment?.room ?? session.room;
  const teacherList = assessment?.teachers ?? [session.teacher];
  const notes = assessment?.notes;
  const status: "Booked" | "Done" = assessment?.status ?? (session.status === "Completed" ? "Done" : "Booked");
  const statusBadge =
    status === "Done"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : "bg-amber-100 text-amber-800 border-amber-200";

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[560px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Assessment — {studentName}</DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border", statusBadge)}>
              {status}
            </span>
            <span className="text-xs text-slate-400 font-medium">Read-only</span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <DetailRow label="Student" value={studentName} />
            <DetailRow label="Subject" value={subject} />
            <DetailRow label="Year group" value={yearGroup || "—"} />
            <DetailRow label="Date" value={date} />
            <DetailRow label="Time" value={`${session.startTime} – ${session.endTime}`} />
            <DetailRow label="Room" value={room} />
            <div className="col-span-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Assessors</p>
              <div className="flex flex-wrap gap-1.5">
                {teacherList.map((t) => (
                  <span key={t} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            {notes && (
              <div className="col-span-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{notes}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { onCancel(); }}
            className="px-3 py-1.5 text-sm font-medium border border-red-200 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
          >
            Cancel Assessment
          </button>
          <button
            type="button"
            onClick={() => { onMarkDone(); onClose(); }}
            disabled={status === "Done"}
            className={cn(
              "px-3 py-1.5 text-sm font-semibold rounded-lg shadow-sm transition-colors",
              status === "Done"
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer",
            )}
          >
            Mark as Done
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 font-medium">{value}</p>
    </div>
  );
}
