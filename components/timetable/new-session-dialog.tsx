"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { type SessionType, type TimetableSession } from "@/lib/mock-data";

// ─── Time slots (30-min increments) ───────────────────────────────────────────

const TIME_SLOTS: string[] = (() => {
  const out: string[] = [];
  for (let h = 8; h <= 20; h++) {
    out.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 20) out.push(`${String(h).padStart(2, "0")}:30`);
  }
  return out;
})();

const START_OPTIONS = TIME_SLOTS.filter((t) => t !== "20:00");

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

// ─── API option types ─────────────────────────────────────────────────────────

interface SubjectOption { id: string; name: string; department: string }
interface StaffOption   { id: string; name: string; role: string; status: string }
interface RoomOption    { id: string; name: string; capacity: number | null }

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";
const FIELD_ERROR = "border-red-300 focus:ring-red-300 focus:border-red-400";

const REPEAT_OPTIONS = ["None", "Weekly", "Bi-weekly"] as const;
type RepeatMode = (typeof REPEAT_OPTIONS)[number];

const SESSION_TYPES: SessionType[] = ["Regular", "Trial", "Assessment", "Makeup"];
const TEACHABLE_ROLES = new Set(["Teacher", "HOD"]);

// ─── Component ────────────────────────────────────────────────────────────────

export type SessionToEdit = TimetableSession & { dateIso?: string };

export interface NewSessionDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (sessions: TimetableSession[]) => void;
  onUpdated?: (session: TimetableSession) => void;
  defaultDateIso?: string;
  sessionToEdit?: SessionToEdit | null;
}

export function NewSessionDialog({
  open,
  onOpenChange,
  onCreated,
  onUpdated,
  defaultDateIso,
  sessionToEdit,
}: NewSessionDialogProps) {
  const isEditing = Boolean(sessionToEdit);

  // Reference data from API
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [allStaff, setAllStaff] = useState<StaffOption[]>([]);
  const [rooms, setRooms]       = useState<RoomOption[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Form state — names for display, IDs for the API
  const [subject,   setSubject]   = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [teacher,   setTeacher]   = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [room,      setRoom]      = useState("");
  const [roomId,    setRoomId]    = useState("");
  const [date,       setDate]      = useState<string>(() => defaultDateIso ?? todayIso());
  const [startTime,  setStartTime] = useState("");
  const [endTime,    setEndTime]   = useState("");
  const [repeat,     setRepeat]    = useState<RepeatMode>("None");
  const [repeatUntil, setRepeatUntil] = useState("");
  const [sessionType, setSessionType] = useState<SessionType>("Regular");
  const [errors,     setErrors]    = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Fetch reference data once (cache across opens)
  useEffect(() => {
    if (!open || dataLoaded) return;
    Promise.all([
      fetch('/api/courses').then(r => r.json()),
      fetch('/api/staff').then(r => r.json()),
      fetch('/api/settings/rooms').then(r => r.json()),
    ]).then(([courseRes, staffRes, roomsRes]) => {
      setSubjects(
        (courseRes.subjects ?? []).map((s: { id: string; name: string; department: string }) => ({
          id: s.id, name: s.name, department: s.department ?? '',
        }))
      );
      setAllStaff(
        (staffRes.data ?? []).map((s: { id: string; name: string; role: string; status: string }) => ({
          id: s.id, name: s.name, role: s.role, status: s.status,
        }))
      );
      setRooms(
        (Array.isArray(roomsRes) ? roomsRes : []).map((r: { id: string; name: string; capacity?: number }) => ({
          id: r.id, name: r.name, capacity: r.capacity ?? null,
        }))
      );
      setDataLoaded(true);
    }).catch(() => toast.error("Failed to load session options"));
  }, [open, dataLoaded]);

  const reset = useCallback(() => {
    setSubject(""); setSubjectId("");
    setTeacher(""); setTeacherId("");
    setRoom("");    setRoomId("");
    setDate(defaultDateIso ?? todayIso());
    setStartTime(""); setEndTime("");
    setRepeat("None"); setRepeatUntil("");
    setSessionType("Regular");
    setErrors({});
  }, [defaultDateIso]);

  useEffect(() => {
    if (!open) { reset(); return; }
    if (sessionToEdit) {
      setSubject(sessionToEdit.subject);
      setSubjectId("");
      setTeacher(sessionToEdit.teacher);
      setTeacherId(sessionToEdit.teacherId ?? "");
      setRoom(sessionToEdit.room);
      setRoomId("");
      setDate(sessionToEdit.dateIso ?? defaultDateIso ?? todayIso());
      setStartTime(sessionToEdit.startTime);
      setEndTime(sessionToEdit.endTime);
      setSessionType(sessionToEdit.type as SessionType);
      setRepeat("None"); setRepeatUntil("");
      setErrors({});
    }
  }, [open, sessionToEdit, reset, defaultDateIso]);

  const teacherOptions = useMemo(
    () => allStaff.filter(s => TEACHABLE_ROLES.has(s.role) && s.status === 'active'),
    [allStaff]
  );

  const endTimeOptions = useMemo(() => {
    if (!startTime) return [];
    return TIME_SLOTS.filter(t => toMins(t) > toMins(startTime));
  }, [startTime]);

  useEffect(() => {
    if (!endTime) return;
    if (!startTime || toMins(endTime) <= toMins(startTime)) setEndTime("");
  }, [startTime, endTime]);

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!subject)    e.subject    = "Subject is required";
    if (!teacher)    e.teacher    = "Teacher is required";
    if (!room)       e.room       = "Room is required";
    if (!date)       e.date       = "Date is required";
    if (!startTime)  e.startTime  = "Start time is required";
    if (!endTime)    e.endTime    = "End time is required";
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

  async function handleConfirm() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});

    const duration   = toMins(endTime) - toMins(startTime);
    const department = subjects.find(s => s.name === subject)?.department ?? '';

    if (sessionToEdit) {
      setSubmitting(true);
      try {
        const res = await fetch(`/api/attendance/sessions/${sessionToEdit.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, subjectId, teacher, teacherId, room, roomId, startTime, endTime }),
        });
        if (!res.ok) throw new Error();
        const updated: TimetableSession = {
          ...sessionToEdit,
          day: dayKeyFromIso(date),
          date: dateLabelFromIso(date),
          subject, department, teacher, teacherId, room, startTime, endTime, duration,
          type: sessionType,
          isTrial: sessionType === "Trial" ? true : undefined,
        };
        onUpdated?.(updated);
        toast.success("Session updated");
        onOpenChange(false);
      } catch {
        toast.error("Failed to update session");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/attendance/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject, subjectId, teacher, teacherId, room, roomId,
          date, startTime, endTime, sessionType, repeat, repeatUntil,
        }),
      });
      if (!res.ok) throw new Error();
      const { data: created } = await res.json();

      const optimistic: TimetableSession[] = (created as { id: string; session_date: string }[]).map((row) => ({
        id: row.id,
        day: dayKeyFromIso(row.session_date),
        date: dateLabelFromIso(row.session_date),
        subject, department, teacher, teacherId, room,
        startTime, endTime, duration,
        students: [], studentCount: 0,
        type: sessionType,
        status: "Scheduled",
        isTrial: sessionType === "Trial" ? true : undefined,
      }));

      onCreated?.(optimistic);
      toast.success(`Session${optimistic.length > 1 ? 's' : ''} added to timetable`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to create session");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Session" : "New Session"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update session details, teacher, room, or timing."
              : "Schedule a class, trial, assessment, or make-up session."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Subject */}
          <div>
            <Label htmlFor="ns-subject" required>Subject</Label>
            <select
              id="ns-subject"
              value={subject}
              onChange={(e) => {
                const opt = subjects.find(s => s.name === e.target.value);
                setSubject(e.target.value);
                setSubjectId(opt?.id ?? "");
              }}
              className={cn(FIELD, errors.subject && FIELD_ERROR)}
            >
              <option value="">Select a subject…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
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
              onChange={(e) => {
                const opt = teacherOptions.find(t => t.name === e.target.value);
                setTeacher(e.target.value);
                setTeacherId(opt?.id ?? "");
              }}
              className={cn(FIELD, errors.teacher && FIELD_ERROR)}
            >
              <option value="">Select a teacher…</option>
              {teacherOptions.map((t) => (
                <option key={t.id} value={t.name}>
                  {t.name}{t.role === "HOD" ? " · HOD" : ""}
                </option>
              ))}
            </select>
            {errors.teacher && <ErrorText>{errors.teacher}</ErrorText>}
          </div>

          {/* Room */}
          <div>
            <Label htmlFor="ns-room" required>Room</Label>
            <select
              id="ns-room"
              value={room}
              onChange={(e) => {
                const opt = rooms.find(r => r.name === e.target.value);
                setRoom(e.target.value);
                setRoomId(opt?.id ?? "");
              }}
              className={cn(FIELD, errors.room && FIELD_ERROR)}
            >
              <option value="">Select a room…</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name}{r.capacity ? ` (capacity ${r.capacity})` : ""}
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
          {!isEditing && (
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
          )}

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
            disabled={submitting}
            className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "#F59E0B" }}
          >
            {submitting ? "Saving…" : isEditing ? "Save changes" : "Add session"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Local primitives ─────────────────────────────────────────────────────────

function Label({
  children, required, htmlFor,
}: {
  children: React.ReactNode; required?: boolean; htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-slate-700 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Pill({
  children, selected, onClick,
}: {
  children: React.ReactNode; selected: boolean; onClick: () => void;
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
