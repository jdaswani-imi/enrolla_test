"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, GripVertical, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useJourney, nextSaturdayIso, departmentFor, BILAL_LEAD_ID, formatDate, type ActivityEntry } from "@/lib/journey-store";
import { useAssessments } from "@/lib/assessment-store";
import { tasks as taskStore, type Lead, type PreferredWindow, type Task } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { FIELD, FieldLabel, FormActions } from "./dialog-parts";
import { TimeSelect } from "./time-select";
import { SubjectSelect } from "./subject-select";
import { normaliseSubject } from "./subjects";

// ─── Teacher & schedule mocks ─────────────────────────────────────────────────

type TeacherOption = { name: string; department: string };

const TEACHER_POOL: Record<string, TeacherOption> = {
  "Sarah Mitchell": { name: "Sarah Mitchell", department: "Primary" },
  "Ahmed Khalil": { name: "Ahmed Khalil", department: "Lower Secondary" },
  "Nadia Al-Hassan": { name: "Nadia Al-Hassan", department: "Primary" },
  "Khalil Mansouri": { name: "Khalil Mansouri", department: "Senior" },
  "Tariq Al-Amin": { name: "Tariq Al-Amin", department: "Lower Secondary" },
  "Hana Yusuf": { name: "Hana Yusuf", department: "Senior" },
  "Faris Al-Amin": { name: "Faris Al-Amin", department: "Senior" },
};
const ALL_TEACHERS = Object.keys(TEACHER_POOL);

const MORNING_POOL = ["Sarah Mitchell", "Ahmed Khalil", "Nadia Al-Hassan", "Khalil Mansouri"];
const AFTERNOON_POOL = ["Ahmed Khalil", "Tariq Al-Amin", "Hana Yusuf", "Faris Al-Amin"];
const EVENING_POOL = ["Tariq Al-Amin", "Hana Yusuf", "Faris Al-Amin", "Khalil Mansouri"];

type Block = { teacher: string; start: string; end: string; label: string };
const MOCK_BLOCKS: Block[] = [
  { teacher: "Ahmed Khalil", start: "09:00", end: "10:00", label: "Y8 Maths session" },
  { teacher: "Ahmed Khalil", start: "14:00", end: "15:00", label: "Y9 Science session" },
  { teacher: "Tariq Al-Amin", start: "16:00", end: "17:00", label: "Y7 English session" },
  { teacher: "Sarah Mitchell", start: "09:30", end: "10:30", label: "Y6 English session" },
  { teacher: "Sarah Mitchell", start: "11:00", end: "11:15", label: "Assessment — already booked" },
  { teacher: "Hana Yusuf", start: "18:00", end: "19:00", label: "Y10 Physics session" },
];

const ROOMS = ["Room 1A", "Room 1B", "Room 2A", "Room 2B", "Room 3A"];
const ROOM_OPTIONS = [...ROOMS, "TBC"];

const WINDOW_RANGES: Record<Exclude<PreferredWindow, "Any">, { start: number; end: number; label: string }> = {
  Morning: { start: 8 * 60, end: 12 * 60, label: "Morning (08:00–12:00)" },
  Afternoon: { start: 12 * 60, end: 17 * 60, label: "Afternoon (12:00–17:00)" },
  Evening: { start: 17 * 60, end: 20 * 60, label: "Evening (17:00–20:00)" },
};

const DAYS_OF_WEEK = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];
const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

// ─── Time helpers ─────────────────────────────────────────────────────────────

function mins(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function fromMins(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function addMinutes(time: string, m: number): string {
  return fromMins(mins(time) + m);
}
function isoToDayName(iso: string): string {
  if (!iso) return "";
  const [y, mo, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  return DAYS_OF_WEEK[date.getUTCDay()];
}
function shiftIsoToNextDayName(iso: string, dayName: string): string {
  if (!iso || !dayName) return iso;
  const target = DAYS_OF_WEEK.indexOf(dayName);
  if (target < 0) return iso;
  const [y, mo, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, mo - 1, d));
  const current = date.getUTCDay();
  const diff = (target - current + 7) % 7;
  if (diff === 0) return iso;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}
function poolFor(slot: string): string[] {
  const m = mins(slot);
  if (m < 12 * 60) return MORNING_POOL;
  if (m < 17 * 60) return AFTERNOON_POOL;
  return EVENING_POOL;
}
function teacherHasBlock(teacher: string, slot: string): boolean {
  const m = mins(slot);
  return MOCK_BLOCKS.some(
    (b) => b.teacher === teacher && m >= mins(b.start) && m < mins(b.end),
  );
}
function teacherAvailableAt(teacher: string, slot: string): boolean {
  return poolFor(slot).includes(teacher) && !teacherHasBlock(teacher, slot);
}
function availableTeachersFor(time: string): TeacherOption[] {
  if (!time) return [];
  return ALL_TEACHERS.filter((n) => teacherAvailableAt(n, time)).map((n) => TEACHER_POOL[n]);
}

// ─── Row model ────────────────────────────────────────────────────────────────

interface Row {
  id: string;
  subject: string;
  teacher: string;
  time: string;
  room: string;
}

let _rowSeq = 0;
function newRow(partial: Partial<Row> = {}): Row {
  _rowSeq += 1;
  return {
    id: `r-${Date.now().toString(36)}-${_rowSeq}`,
    subject: "",
    teacher: "",
    time: "",
    room: "TBC",
    ...partial,
  };
}

function cascadeTimes(rows: Row[], startTime: string): Row[] {
  if (!startTime) return rows.map((r) => ({ ...r, time: "" }));
  return rows.map((r, i) => ({ ...r, time: addMinutes(startTime, i * 15) }));
}

// ─── Smart scheduler ──────────────────────────────────────────────────────────

interface Suggestion {
  date: string;
  startTime: string;
  endTime: string;
  windowUsed: PreferredWindow;
  teachers: string[];
  totalValidSlots: number;
  fallback: boolean;
  originalWindow: PreferredWindow;
}

function pickTeachersFor(
  startTime: string,
  rowCount: number,
  yearGroup: string,
): string[] | null {
  const preferredDept = departmentFor(yearGroup);
  const assigned: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    const slot = addMinutes(startTime, i * 15);
    const available = ALL_TEACHERS.filter(
      (t) => teacherAvailableAt(t, slot) && !assigned.includes(t),
    );
    if (available.length === 0) return null;
    const preferred = available.find((t) => TEACHER_POOL[t].department === preferredDept);
    assigned.push(preferred ?? available[0]);
  }
  return assigned;
}

function findSlotsInWindow(
  w: Exclude<PreferredWindow, "Any">,
  rowCount: number,
  yearGroup: string,
): { starts: string[]; best: { start: string; teachers: string[] } | null } {
  const { start, end } = WINDOW_RANGES[w];
  const starts: string[] = [];
  let best: { start: string; teachers: string[] } | null = null;
  for (let t = start; t + rowCount * 15 <= end; t += 15) {
    const startStr = fromMins(t);
    const teachers = pickTeachersFor(startStr, rowCount, yearGroup);
    if (teachers) {
      starts.push(startStr);
      if (!best) best = { start: startStr, teachers };
    }
  }
  return { starts, best };
}

function computeSuggestion(
  selectedDate: string,
  preferredDay: string | undefined,
  preferredWindow: PreferredWindow,
  rowCount: number,
  yearGroup: string,
): Suggestion | null {
  if (rowCount === 0) return null;
  const targetDate = preferredDay
    ? shiftIsoToNextDayName(selectedDate, preferredDay)
    : selectedDate;

  const windowOrder: Exclude<PreferredWindow, "Any">[] = (() => {
    if (preferredWindow === "Morning") return ["Morning", "Afternoon", "Evening"];
    if (preferredWindow === "Afternoon") return ["Afternoon", "Evening", "Morning"];
    if (preferredWindow === "Evening") return ["Evening", "Morning", "Afternoon"];
    return ["Morning", "Afternoon", "Evening"];
  })();

  const originalWindow: PreferredWindow = preferredWindow;
  const primary = preferredWindow === "Any" ? "Morning" : preferredWindow;
  const primaryResult = findSlotsInWindow(primary as Exclude<PreferredWindow, "Any">, rowCount, yearGroup);
  if (primaryResult.best) {
    return {
      date: targetDate,
      startTime: primaryResult.best.start,
      endTime: addMinutes(primaryResult.best.start, rowCount * 15),
      windowUsed: primary,
      teachers: primaryResult.best.teachers,
      totalValidSlots: primaryResult.starts.length,
      fallback: false,
      originalWindow,
    };
  }

  for (const w of windowOrder.slice(1)) {
    const r = findSlotsInWindow(w, rowCount, yearGroup);
    if (r.best) {
      return {
        date: targetDate,
        startTime: r.best.start,
        endTime: addMinutes(r.best.start, rowCount * 15),
        windowUsed: w,
        teachers: r.best.teachers,
        totalValidSlots: r.starts.length,
        fallback: true,
        originalWindow,
      };
    }
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

// Seq for auto-created teacher tasks (avoid clashing with lead page's TK-1xx ids).
let _autoTaskSeq = 500;
function nextAutoTaskId(): string {
  _autoTaskSeq += 1;
  return `TK-${_autoTaskSeq}`;
}

function formatTaskDueDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d} ${months[m - 1]} ${y}`;
}

export function BookAssessmentDialog({
  open,
  onOpenChange,
  lead,
  onCommit,
  onUpdatePrefs,
  onRecordActivity,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead?: Lead | null;
  onCommit?: () => void;
  onUpdatePrefs?: (
    leadId: string,
    prefs: { preferredDays: string[]; preferredWindow: PreferredWindow },
  ) => void;
  onRecordActivity?: (leadId: string, entry: ActivityEntry) => void;
}) {
  const { bookAssessment, pushActivity } = useJourney();
  const { addAssessment } = useAssessments();

  const isBilal = !lead || lead.id === BILAL_LEAD_ID;
  const studentName = isBilal ? "Bilal Mahmood" : lead?.childName ?? "Bilal Mahmood";
  const yearGroup = isBilal ? "Y7" : lead?.yearGroup ?? "Y7";

  const [date, setDate] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const [editingPrefs, setEditingPrefs] = useState(false);
  const [prefDays, setPrefDays] = useState<string[]>([]);
  const [prefWindow, setPrefWindow] = useState<PreferredWindow>("Any");

  // Reset on open
  useEffect(() => {
    if (!open) return;
    const subjects = lead?.subjects?.length ? lead.subjects : ["Mathematics"];
    setDate(nextSaturdayIso());
    setRows(
      subjects.map((s, i) =>
        newRow({
          subject: normaliseSubject(s, yearGroup),
          time: addMinutes("10:00", i * 15),
        }),
      ),
    );
    setNotes("");
    setSuggestion(null);
    setEditingPrefs(false);
    setPrefDays(lead?.preferredDays ?? (isBilal ? ["Saturday"] : []));
    setPrefWindow(lead?.preferredWindow ?? (isBilal ? "Morning" : "Any"));
    setDragIndex(null);
    setOverIndex(null);
  }, [open, lead, isBilal]);

  // Effective preferences (may be edited in-dialog for Bilal/fallback path)
  const effectiveDays = prefDays;
  const effectiveWindow = prefWindow;
  const preferredDay = effectiveDays[0];
  const windowPillLabel = useMemo(() => {
    if (!preferredDay && effectiveWindow === "Any") return "Any day · Any time";
    const dayPart = preferredDay ?? "Any day";
    const winPart = effectiveWindow === "Any" ? "Any time" : effectiveWindow;
    return `${dayPart} · ${winPart}`;
  }, [preferredDay, effectiveWindow]);

  // Row mutators
  const updateRow = useCallback((id: string, patch: Partial<Row>) => {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  function handleTimeChange(index: number, value: string) {
    setRows((cur) => {
      const copy = [...cur];
      copy[index] = { ...copy[index], time: value };
      for (let i = index + 1; i < copy.length; i++) {
        copy[i] = { ...copy[i], time: addMinutes(value, (i - index) * 15), teacher: "" };
      }
      if (index === 0) {
        for (let i = 0; i < copy.length; i++) {
          copy[i] = { ...copy[i], teacher: i === 0 ? copy[i].teacher : "" };
        }
      } else {
        copy[index] = { ...copy[index], teacher: "" };
      }
      return copy;
    });
    setSuggestion(null);
  }

  function addRow() {
    setRows((cur) => {
      const last = cur[cur.length - 1];
      const nextTime = last?.time ? addMinutes(last.time, 15) : "";
      return [...cur, newRow({ time: nextTime })];
    });
    setSuggestion(null);
  }

  function removeRow(id: string) {
    setRows((cur) => {
      const next = cur.filter((r) => r.id !== id);
      if (next.length === 0) return next;
      const start = next[0].time;
      if (!start) return next;
      return cascadeTimes(next, start);
    });
    setSuggestion(null);
  }

  function reorder(fromIdx: number, toIdx: number) {
    setRows((cur) => {
      if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0) return cur;
      const copy = [...cur];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      const start = copy[0]?.time;
      if (!start) return copy;
      return cascadeTimes(copy, start).map((r) => ({ ...r, teacher: "" }));
    });
    setSuggestion(null);
  }

  function onDragStart(e: React.DragEvent, index: number) {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }
  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  }
  function onDrop(e: React.DragEvent, index: number) {
    e.preventDefault();
    const from = dragIndex ?? Number(e.dataTransfer.getData("text/plain"));
    setDragIndex(null);
    setOverIndex(null);
    if (Number.isFinite(from)) reorder(Number(from), index);
  }
  function onDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  // Smart scheduler
  function findBestSlots() {
    const sug = computeSuggestion(
      date || nextSaturdayIso(),
      preferredDay,
      effectiveWindow,
      rows.length,
      yearGroup,
    );
    if (!sug) {
      toast.error("No slots available for this configuration");
      setSuggestion(null);
      return;
    }
    setSuggestion(sug);
  }

  function acceptSuggestion() {
    if (!suggestion) return;
    setDate(suggestion.date);
    setRows((cur) => {
      const cascaded = cascadeTimes(cur, suggestion.startTime);
      return cascaded.map((r, i) => ({ ...r, teacher: suggestion.teachers[i] ?? "" }));
    });
    setSuggestion(null);
    toast.success("Suggested slots applied");
  }

  function savePrefs() {
    if (lead) {
      onUpdatePrefs?.(lead.id, { preferredDays: prefDays, preferredWindow: prefWindow });
    }
    setEditingPrefs(false);
    toast.success("Preferences updated");
  }

  function togglePrefDay(d: string) {
    setPrefDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  }

  // Derived
  const totalMinutes = rows.length * 15;
  const teachersList = rows.map((r) => r.teacher).filter(Boolean);
  const canSubmit =
    Boolean(date) &&
    rows.length > 0 &&
    rows.every((r) => r.subject.trim() && r.teacher && r.time);

  function submit() {
    if (!canSubmit) return;
    const dept = departmentFor(yearGroup);
    rows.forEach((r) => {
      addAssessment({
        studentName,
        subject: r.subject.trim(),
        yearGroup,
        department: dept,
        date,
        time: r.time,
        endTime: addMinutes(r.time, 15),
        room: r.room || "TBC",
        teachers: [r.teacher],
        notes: notes.trim() || undefined,
        leadId: lead?.id,
      });
    });

    // FIX 4: auto-create a task for each assigned teacher.
    const leadId = lead?.id ?? BILAL_LEAD_ID;
    const dueLabel = formatTaskDueDate(date);
    rows.forEach((r) => {
      const task: Task = {
        id: nextAutoTaskId(),
        title: `Log assessment outcome — ${studentName} · ${r.subject.trim()}`,
        type: "Academic",
        priority: "High",
        status: "Open",
        assignee: r.teacher,
        dueDate: dueLabel,
        linkedRecord: null,
        description: `Assessment booked for ${formatDate(date)} at ${r.time} · Room ${r.room || "TBC"}. Please log the outcome in Enrolla after the session.`,
        subtasks: [],
        overdue: false,
        sourceLeadId: leadId,
        sourceLeadName: studentName,
      };
      taskStore.push(task);
      const activityEntry: ActivityEntry = {
        label: "Just now",
        text: `Assessment task created for ${r.teacher} — due ${formatDate(date)}`,
        dot: "bg-purple-400",
      };
      if (lead?.id && lead.id !== BILAL_LEAD_ID) {
        onRecordActivity?.(lead.id, activityEntry);
      } else if (isBilal) {
        pushActivity(activityEntry);
      }
    });

    if (isBilal) {
      const first = rows[0];
      const label =
        rows.length === 1
          ? first.teacher
          : `${first.teacher} +${rows.length - 1}`;
      bookAssessment({
        subject: rows.map((r) => r.subject).join(", "),
        yearGroup,
        teacher: label,
        date,
        time: first.time,
        room: first.room || "TBC",
        notes,
      });
    } else {
      onCommit?.();
    }

    const uniqueTeachers = Array.from(new Set(rows.map((r) => r.teacher))).filter(Boolean);
    const teachersLabel = uniqueTeachers.join(", ");
    toast.success(
      `${rows.length} assessment${rows.length === 1 ? "" : "s"} booked · ${rows.length} task${rows.length === 1 ? "" : "s"} created for ${teachersLabel}`,
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[720px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Book assessments</DialogTitle>
          <DialogDescription>
            Build the assessment plan one subject at a time. Drag rows to reorder.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[76vh] overflow-y-auto">
          {/* HEADER: date + preferred window pill + find slots */}
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-4">
              <FieldLabel htmlFor="ba-date" required>Date</FieldLabel>
              <input
                id="ba-date"
                type="date"
                className={FIELD}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSuggestion(null);
                }}
              />
            </div>

            <div className="col-span-5">
              <FieldLabel>Preferred window</FieldLabel>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold">
                  {windowPillLabel}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingPrefs((v) => !v)}
                  className="text-xs text-amber-700 hover:text-amber-800 underline underline-offset-2 cursor-pointer"
                >
                  {editingPrefs ? "Close" : "Change"}
                </button>
              </div>
            </div>

            <div className="col-span-3 flex justify-end">
              <button
                type="button"
                onClick={findBestSlots}
                disabled={rows.length === 0}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-400 text-sm font-semibold text-amber-700 bg-white hover:bg-amber-50 cursor-pointer transition-colors shadow-sm",
                  rows.length === 0 && "opacity-50 cursor-not-allowed hover:bg-white",
                )}
              >
                <Sparkles className="w-4 h-4" />
                Find best slots
              </button>
            </div>
          </div>

          {/* Inline preference editor */}
          {editingPrefs && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-3 space-y-3">
              <div>
                <p className="text-xs text-slate-600 font-semibold mb-1.5">Preferred days</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => {
                    const on = prefDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => togglePrefDay(d)}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium cursor-pointer transition-colors",
                          on
                            ? "bg-amber-100 border-amber-400 text-amber-800"
                            : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50",
                        )}
                      >
                        <span
                          className={cn(
                            "w-3 h-3 rounded-sm border flex items-center justify-center",
                            on ? "bg-amber-500 border-amber-500" : "bg-white border-slate-300",
                          )}
                        >
                          {on && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                        </span>
                        {DAY_SHORT[d]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label htmlFor="ba-pref-window" className="block text-xs text-slate-600 font-semibold mb-1.5">
                  Preferred window
                </label>
                <select
                  id="ba-pref-window"
                  value={prefWindow}
                  onChange={(e) => setPrefWindow(e.target.value as PreferredWindow)}
                  className={FIELD}
                >
                  <option value="Morning">Morning (08:00–12:00)</option>
                  <option value="Afternoon">Afternoon (12:00–17:00)</option>
                  <option value="Evening">Evening (17:00–20:00)</option>
                  <option value="Any">Any</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPrefDays(lead?.preferredDays ?? (isBilal ? ["Saturday"] : []));
                    setPrefWindow(lead?.preferredWindow ?? (isBilal ? "Morning" : "Any"));
                    setEditingPrefs(false);
                  }}
                  className="px-2.5 py-1 text-xs font-medium border border-slate-300 bg-white rounded-md hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={savePrefs}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm"
                >
                  Save preferences
                </button>
              </div>
            </div>
          )}

          {/* Suggestion banner */}
          {suggestion && (
            <div
              className={cn(
                "rounded-lg border p-3 flex items-start gap-3",
                suggestion.fallback
                  ? "bg-orange-50 border-orange-300"
                  : "bg-emerald-50 border-emerald-300",
              )}
            >
              <Sparkles
                className={cn(
                  "w-4 h-4 mt-0.5 shrink-0",
                  suggestion.fallback ? "text-orange-600" : "text-emerald-600",
                )}
              />
              <div className="flex-1 min-w-0">
                {suggestion.fallback && (
                  <p className="text-xs font-semibold text-orange-800 mb-0.5">
                    No slots available in your preferred window ({suggestion.originalWindow}). Showing next available in {suggestion.windowUsed}.
                  </p>
                )}
                <p
                  className={cn(
                    "text-sm font-semibold",
                    suggestion.fallback ? "text-orange-900" : "text-emerald-900",
                  )}
                >
                  Suggested: {isoToDayName(suggestion.date)} {formatDate(suggestion.date)} · {suggestion.startTime}–{suggestion.endTime}
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Based on teacher availability and your preferred window.
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {suggestion.totalValidSlots} slot{suggestion.totalValidSlots === 1 ? "" : "s"} available in this window.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  className="px-2.5 py-1 text-xs font-medium border border-slate-300 bg-white rounded-md hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={acceptSuggestion}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm"
                >
                  Accept
                </button>
              </div>
            </div>
          )}

          {/* LINE ITEM TABLE */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div
              className="grid text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200"
              style={{ gridTemplateColumns: "32px 36px 1.4fr 1.4fr 160px 110px 32px" }}
            >
              <div className="px-2 py-2" />
              <div className="px-2 py-2">#</div>
              <div className="px-2 py-2">Subject</div>
              <div className="px-2 py-2">Teacher</div>
              <div className="px-2 py-2">Time</div>
              <div className="px-2 py-2">Room</div>
              <div className="px-2 py-2" />
            </div>

            {rows.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                No subjects yet — add one below.
              </div>
            )}

            {rows.map((row, index) => {
              const options = row.time ? availableTeachersFor(row.time) : [];
              const timeReady = Boolean(row.time);
              const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
              return (
                <div
                  key={row.id}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDrop={(e) => onDrop(e, index)}
                  onDragEnd={onDragEnd}
                  className={cn(
                    "grid items-center border-b border-slate-100 last:border-b-0 transition-colors",
                    isOver && "bg-amber-50",
                    dragIndex === index && "opacity-50",
                  )}
                  style={{ gridTemplateColumns: "32px 36px 1.4fr 1.4fr 160px 110px 32px" }}
                >
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, index)}
                    aria-label={`Drag row ${index + 1}`}
                    className="px-2 py-2 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="px-2 py-2 text-sm font-semibold text-slate-600">{index + 1}</div>
                  <div className="px-2 py-2">
                    <SubjectSelect
                      value={row.subject}
                      onChange={(next) => updateRow(row.id, { subject: next })}
                      yearGroup={yearGroup}
                    />
                  </div>
                  <div className="px-2 py-2">
                    <select
                      value={row.teacher}
                      onChange={(e) => updateRow(row.id, { teacher: e.target.value })}
                      disabled={!timeReady}
                      className={cn(
                        "w-full rounded-md border px-2 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400",
                        timeReady ? "border-slate-300" : "border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed",
                      )}
                    >
                      <option value="">{timeReady ? "Select teacher" : "Select time first"}</option>
                      {options.map((t) => (
                        <option key={t.name} value={t.name}>
                          {t.name} — {t.department}
                        </option>
                      ))}
                      {timeReady && row.teacher && !options.find((o) => o.name === row.teacher) && (
                        <option value={row.teacher}>{row.teacher} (unavailable)</option>
                      )}
                    </select>
                  </div>
                  <div className="px-2 py-2">
                    <TimeSelect
                      value={row.time}
                      onChange={(next) => handleTimeChange(index, next)}
                    />
                  </div>
                  <div className="px-2 py-2">
                    <select
                      value={row.room}
                      onChange={(e) => updateRow(row.id, { room: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                    >
                      {ROOM_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div className="px-2 py-2 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label={`Remove row ${index + 1}`}
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-md cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add subject
          </button>

          {/* SUMMARY STRIP */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 grid grid-cols-2 gap-x-6 gap-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total duration</span>
              <span className="text-slate-800 font-semibold">
                {rows.length} {rows.length === 1 ? "subject" : "subjects"} × 15 min = {totalMinutes} min
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Date</span>
              <span className="text-slate-800 font-semibold">
                {date ? formatDate(date) : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Window</span>
              <span className="text-slate-800 font-semibold">{windowPillLabel}</span>
            </div>
            <div className="flex justify-between text-sm min-w-0">
              <span className="text-slate-500 shrink-0">Teachers</span>
              <span className="text-slate-800 font-semibold text-right truncate ml-2">
                {teachersList.length > 0 ? teachersList.join(", ") : "—"}
              </span>
            </div>
          </div>

          {/* NOTES */}
          <div>
            <FieldLabel htmlFor="ba-notes">Notes</FieldLabel>
            <textarea
              id="ba-notes"
              rows={3}
              className={FIELD}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional context for the assessor"
            />
          </div>
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Book assessments"
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
