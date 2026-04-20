"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  rooms,
  staffMembers,
  students as allStudents,
  timetableSessions,
  type SessionType,
  type TimetableSession,
} from "@/lib/mock-data";
import { departmentFor } from "@/lib/journey-store";

// ─── Time slots (30-min increments) ───────────────────────────────────────────

const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 8; h <= 20; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 20) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

const START_OPTIONS = TIME_SLOTS.filter((t) => t !== "20:00"); // 08:00 → 19:30

function toMins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function dayKeyFromIso(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return DAY_KEYS[d.getDay()] ?? "";
}

function dateLabelFromIso(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Subject catalogue derived from staff teaching assignments ────────────────

const SUBJECT_CATALOGUE: string[] = Array.from(
  new Set(staffMembers.flatMap((s) => s.subjects)),
).sort((a, b) => a.localeCompare(b));

function deptFromSubject(subject: string): string {
  const m = subject.match(/^(KG\d*|Y\d+)/);
  return m ? departmentFor(m[1]) : "Lower Secondary";
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";
const FIELD_ERROR = "border-red-300 focus:ring-red-300 focus:border-red-400";

const REPEAT_OPTIONS = ["None", "Weekly", "Bi-weekly"] as const;
type RepeatMode = (typeof REPEAT_OPTIONS)[number];

const SESSION_TYPES: SessionType[] = ["Regular", "Trial", "Assessment", "Makeup"];

// ─── Component ────────────────────────────────────────────────────────────────

export interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (sessions: TimetableSession[]) => void;
  defaultDateIso?: string;
}

export function NewSessionDialog({
  open,
  onOpenChange,
  onCreated,
  defaultDateIso,
}: NewSessionDialogProps) {
  const [subject, setSubject] = useState("");
  const [teacher, setTeacher] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [room, setRoom] = useState("");
  const [date, setDate] = useState<string>(() => defaultDateIso ?? todayIso());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [repeat, setRepeat] = useState<RepeatMode>("None");
  const [repeatUntil, setRepeatUntil] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("Regular");
  const [studentSearch, setStudentSearch] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const reset = useCallback(() => {
    setSubject("");
    setTeacher("");
    setStudentIds([]);
    setRoom("");
    setDate(defaultDateIso ?? todayIso());
    setStartTime("");
    setEndTime("");
    setRepeat("None");
    setRepeatUntil("");
    setSessionType("Regular");
    setStudentSearch("");
    setErrors({});
  }, [defaultDateIso]);

  useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  // Teachers filtered to active Teachers/HODs, then by subject if selected.
  const teacherOptions = useMemo(() => {
    const teachable = new Set(["Teacher", "HOD"]);
    return staffMembers.filter((s) => {
      if (!teachable.has(s.role)) return false;
      if (s.status !== "Active") return false;
      if (subject && !s.subjects.includes(subject)) return false;
      return true;
    });
  }, [subject]);

  // Clear teacher if it's no longer in the filtered set.
  useEffect(() => {
    if (!teacher) return;
    if (!teacherOptions.some((t) => t.name === teacher)) setTeacher("");
  }, [teacherOptions, teacher]);

  const endTimeOptions = useMemo(() => {
    if (!startTime) return [];
    return TIME_SLOTS.filter((t) => toMins(t) > toMins(startTime));
  }, [startTime]);

  // Clear endTime if start moves past it.
  useEffect(() => {
    if (!endTime) return;
    if (!startTime || toMins(endTime) <= toMins(startTime)) setEndTime("");
  }, [startTime, endTime]);

  const filteredStudents = useMemo(() => {
    const needle = studentSearch.trim().toLowerCase();
    return allStudents
      .filter((s) => s.status === "Active")
      .filter((s) => {
        if (!needle) return true;
        return (
          s.name.toLowerCase().includes(needle) ||
          s.yearGroup.toLowerCase().includes(needle)
        );
      });
  }, [studentSearch]);

  const selectedStudents = useMemo(
    () =>
      studentIds
        .map((id) => allStudents.find((s) => s.id === id))
        .filter((s): s is (typeof allStudents)[number] => Boolean(s)),
    [studentIds],
  );

  function toggleStudent(id: string) {
    setStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!subject) e.subject = "Subject is required";
    if (!teacher) e.teacher = "Teacher is required";
    if (studentIds.length === 0) e.students = "Select at least one student";
    if (!room) e.room = "Room is required";
    if (!date) e.date = "Date is required";
    if (!startTime) e.startTime = "Start time is required";
    if (!endTime) e.endTime = "End time is required";
    if (startTime && endTime && toMins(endTime) <= toMins(startTime)) {
      e.endTime = "End time must be after start time";
    }
    if (repeat !== "None" && !repeatUntil) {
      e.repeatUntil = "Repeat until date is required";
    }
    if (repeat !== "None" && repeatUntil && date && repeatUntil < date) {
      e.repeatUntil = "Repeat until must be on or after the start date";
    }
    return e;
  }

  function handleConfirm() {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});

    const duration = toMins(endTime) - toMins(startTime);
    const department = deptFromSubject(subject);
    const studentNames = selectedStudents.map((s) => s.name);

    const dates: string[] = [date];
    if (repeat !== "None") {
      const step = repeat === "Weekly" ? 7 : 14;
      let cur = addDaysIso(date, step);
      while (cur <= repeatUntil) {
        dates.push(cur);
        cur = addDaysIso(cur, step);
      }
    }

    const stamp = Date.now().toString(36);
    const created: TimetableSession[] = dates.map((iso, i) => ({
      id: `s-${stamp}-${i}`,
      day: dayKeyFromIso(iso),
      date: dateLabelFromIso(iso),
      subject,
      department,
      teacher,
      room,
      startTime,
      endTime,
      duration,
      students: [...studentNames],
      studentCount: studentNames.length,
      type: sessionType,
      status: "Scheduled",
      isTrial: sessionType === "Trial" ? true : undefined,
    }));

    for (const s of created) timetableSessions.push(s);
    onCreated?.(created);
    toast.success("Session added to timetable");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>New Session</DialogTitle>
          <DialogDescription>
            Schedule a class, trial, assessment, or make-up session.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Subject */}
          <div>
            <Label htmlFor="ns-subject" required>Subject</Label>
            <select
              id="ns-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={cn(FIELD, errors.subject && FIELD_ERROR)}
            >
              <option value="">Select a subject…</option>
              {SUBJECT_CATALOGUE.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.subject && <ErrorText>{errors.subject}</ErrorText>}
          </div>

          {/* Teacher */}
          <div>
            <Label htmlFor="ns-teacher" required>Teacher</Label>
            <select
              id="ns-teacher"
              value={teacher}
              onChange={(e) => setTeacher(e.target.value)}
              disabled={subject !== "" && teacherOptions.length === 0}
              className={cn(FIELD, errors.teacher && FIELD_ERROR)}
            >
              <option value="">
                {subject && teacherOptions.length === 0
                  ? "No teachers match this subject"
                  : "e.g. Lucius Fox"}
              </option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                  {t.role === "HOD" ? " · HOD" : ""}
                </option>
              ))}
            </select>
            {subject && (
              <p className="mt-1 text-[11px] text-slate-500">
                Showing teachers who teach {subject}.
              </p>
            )}
            {errors.teacher && <ErrorText>{errors.teacher}</ErrorText>}
          </div>

          {/* Students */}
          <div>
            <Label required>Student(s)</Label>
            {selectedStudents.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedStudents.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 pl-2 pr-1 py-0.5 text-xs font-medium text-amber-800"
                  >
                    {s.name}
                    <span className="text-[10px] font-semibold text-amber-700/80">
                      {s.yearGroup}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleStudent(s.id)}
                      aria-label={`Remove ${s.name}`}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-amber-200/60 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div
              className={cn(
                "rounded-lg border bg-white",
                errors.students ? "border-red-300" : "border-slate-300",
              )}
            >
              <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search students…"
                  className="flex-1 text-sm outline-none placeholder:text-slate-400"
                />
              </div>
              <div className="max-h-40 overflow-y-auto">
                {filteredStudents.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-slate-400">
                    No active students match your search.
                  </p>
                ) : (
                  filteredStudents.slice(0, 50).map((s) => {
                    const on = studentIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleStudent(s.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors cursor-pointer",
                          on ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-slate-50",
                        )}
                      >
                        <span
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                            on ? "bg-amber-500 border-amber-500" : "border-slate-300 bg-white",
                          )}
                        >
                          {on && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                        </span>
                        <span className="flex-1 text-slate-800">{s.name}</span>
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                          {s.yearGroup}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
            {errors.students && <ErrorText>{errors.students}</ErrorText>}
          </div>

          {/* Room */}
          <div>
            <Label htmlFor="ns-room" required>Room</Label>
            <select
              id="ns-room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className={cn(FIELD, errors.room && FIELD_ERROR)}
            >
              <option value="">Select a room…</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} (capacity {r.capacity})
                </option>
              ))}
            </select>
            {errors.room && <ErrorText>{errors.room}</ErrorText>}
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="ns-date" required>Date</Label>
            <input
              id="ns-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={cn(FIELD, errors.date && FIELD_ERROR)}
            />
            {errors.date && <ErrorText>{errors.date}</ErrorText>}
          </div>

          {/* Start + End time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ns-start" required>Start time</Label>
              <select
                id="ns-start"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={cn(FIELD, errors.startTime && FIELD_ERROR)}
              >
                <option value="">—</option>
                {START_OPTIONS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.startTime && <ErrorText>{errors.startTime}</ErrorText>}
            </div>
            <div>
              <Label htmlFor="ns-end" required>End time</Label>
              <select
                id="ns-end"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!startTime}
                className={cn(
                  FIELD,
                  errors.endTime && FIELD_ERROR,
                  !startTime && "bg-slate-50 text-slate-400 cursor-not-allowed",
                )}
              >
                <option value="">{startTime ? "—" : "Set start time first"}</option>
                {endTimeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.endTime && <ErrorText>{errors.endTime}</ErrorText>}
            </div>
          </div>

          {/* Repeat */}
          <div>
            <Label>Repeat</Label>
            <div className="flex flex-wrap gap-1.5">
              {REPEAT_OPTIONS.map((opt) => (
                <Pill key={opt} selected={repeat === opt} onClick={() => setRepeat(opt)}>
                  {opt}
                </Pill>
              ))}
            </div>
            {repeat !== "None" && (
              <div className="mt-3">
                <Label htmlFor="ns-repeat-until" required>Repeat until</Label>
                <input
                  id="ns-repeat-until"
                  type="date"
                  value={repeatUntil}
                  min={date || undefined}
                  onChange={(e) => setRepeatUntil(e.target.value)}
                  className={cn(FIELD, errors.repeatUntil && FIELD_ERROR)}
                />
                {errors.repeatUntil && <ErrorText>{errors.repeatUntil}</ErrorText>}
              </div>
            )}
          </div>

          {/* Session type */}
          <div>
            <Label required>Session type</Label>
            <div className="flex flex-wrap gap-1.5">
              {SESSION_TYPES.map((t) => (
                <Pill
                  key={t}
                  selected={sessionType === t}
                  onClick={() => setSessionType(t)}
                >
                  {t}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50/50 rounded-b-xl">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
            style={{ backgroundColor: "#F59E0B" }}
          >
            Add session
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Local primitives ─────────────────────────────────────────────────────────

function Label({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold text-slate-700 mb-1.5"
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Pill({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
        selected
          ? "border-amber-500 bg-amber-50 text-amber-800"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-[11px] text-red-600">{children}</p>;
}
