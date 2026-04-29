"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, GripVertical, Plus, Sparkles, X } from "lucide-react";
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
import type { Lead, PreferredWindow } from "@/lib/types/lead";
import { cn } from "@/lib/utils";
import { FIELD, FieldLabel, FormActions } from "./dialog-parts";
import { TimeSelect } from "./time-select";
import { SubjectSelect } from "./subject-select";
import { normaliseSubject } from "./subjects";

// ─── Teacher & schedule mocks ─────────────────────────────────────────────────

type TeacherOption = { name: string; department: string };

const TEACHER_POOL: Record<string, TeacherOption> = {};
const ALL_TEACHERS = Object.keys(TEACHER_POOL);

const MORNING_POOL: string[] = [];
const AFTERNOON_POOL: string[] = [];
const EVENING_POOL: string[] = [];

type Block = { teacher: string; start: string; end: string; label: string };
const MOCK_BLOCKS: Block[] = [];

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

type PrefWeek = "asap" | "this-week" | "next-week";

const PREF_WEEK_LABELS: Record<PrefWeek, string> = {
  "asap": "ASAP",
  "this-week": "This week",
  "next-week": "Next week",
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
  const diff = (target - current + 7) % 7 || 7;
  date.setUTCDate(date.getUTCDate() + diff);
  return date.toISOString().slice(0, 10);
}

function computeTargetDateFromPrefs(
  fromIso: string,
  prefDay: string,
  prefWeek: PrefWeek,
): string {
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const fromDate = fromIso ? new Date(fromIso + "T00:00:00Z") : todayUtc;

  if (prefWeek === "asap") {
    if (!prefDay) return fromDate.toISOString().slice(0, 10);
    return shiftIsoToNextDayName(fromDate.toISOString().slice(0, 10), prefDay);
  }

  // Compute Monday of the target ISO week (Mon–Sun)
  const todayDow = todayUtc.getUTCDay();
  const daysToMonday = todayDow === 0 ? -6 : 1 - todayDow;
  const thisMonday = new Date(todayUtc);
  thisMonday.setUTCDate(todayUtc.getUTCDate() + daysToMonday);

  const targetMonday = new Date(thisMonday);
  if (prefWeek === "next-week") {
    targetMonday.setUTCDate(thisMonday.getUTCDate() + 7);
  }

  if (!prefDay) {
    const start = targetMonday > fromDate ? targetMonday : fromDate;
    return start.toISOString().slice(0, 10);
  }

  const targetDow = DAYS_OF_WEEK.indexOf(prefDay);
  const offsetFromMonday = (targetDow + 6) % 7; // Mon=0 … Sun=6
  const targetDate = new Date(targetMonday);
  targetDate.setUTCDate(targetMonday.getUTCDate() + offsetFromMonday);
  return targetDate.toISOString().slice(0, 10);
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

// Returns best { teacher, time } for a single subject row, or null if no slot available.
function findSlotForRow(
  rowIndex: number,
  yearGroup: string,
): { teacher: string; time: string } | null {
  const windows = [
    { start: 8 * 60, end: 12 * 60 },
    { start: 12 * 60, end: 17 * 60 },
    { start: 17 * 60, end: 20 * 60 },
  ];
  const preferredDept = departmentFor(yearGroup);
  for (const { start, end } of windows) {
    for (let t = start; t + 15 <= end; t += 15) {
      const timeStr = fromMins(t);
      const slot = addMinutes(timeStr, rowIndex * 15);
      const available = ALL_TEACHERS.filter((n) => teacherAvailableAt(n, slot));
      if (available.length === 0) continue;
      const preferred = available.find((n) => TEACHER_POOL[n].department === preferredDept);
      return { teacher: preferred ?? available[0], time: slot };
    }
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // New preferred window: single day + week scope
  const [prefDay, setPrefDay] = useState<string>("");
  const [prefWeek, setPrefWeek] = useState<PrefWeek>("asap");

  // Per-row "no slot found" tracking (set of row IDs)
  const [rowNoSlot, setRowNoSlot] = useState<Set<string>>(new Set());

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
    setDragIndex(null);
    setOverIndex(null);
    setRowNoSlot(new Set());
    // Seed from lead prefs: first preferred day → prefDay, window → ignored (new model)
    const leadDay = lead?.preferredDays?.[0] ?? (isBilal ? "Saturday" : "");
    setPrefDay(leadDay);
    setPrefWeek("asap");
  }, [open, lead, isBilal]);

  const windowPillLabel = useMemo(() => {
    const dayPart = prefDay || "Any day";
    const weekPart = PREF_WEEK_LABELS[prefWeek];
    return `${weekPart} · ${dayPart}`;
  }, [prefDay, prefWeek]);

  // Row mutators
  const updateRow = useCallback((id: string, patch: Partial<Row>) => {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    // Clear no-slot marker when user edits a row
    setRowNoSlot((cur) => { const next = new Set(cur); next.delete(id); return next; });
  }, []);

  function handleTimeChange(index: number, value: string) {
    setRows((cur) => {
      const copy = [...cur];
      copy[index] = { ...copy[index], time: value };
      for (let i = index + 1; i < copy.length; i++) {
        copy[i] = { ...copy[i], time: addMinutes(value, (i - index) * 15), teacher: "" };
      }
      if (index === 0) {
        for (let i = 1; i < copy.length; i++) {
          copy[i] = { ...copy[i], teacher: "" };
        }
      } else {
        copy[index] = { ...copy[index], teacher: "" };
      }
      return copy;
    });
  }

  function addRow() {
    setRows((cur) => {
      const last = cur[cur.length - 1];
      const nextTime = last?.time ? addMinutes(last.time, 15) : "";
      return [...cur, newRow({ time: nextTime })];
    });
  }

  function removeRow(id: string) {
    setRows((cur) => {
      const next = cur.filter((r) => r.id !== id);
      if (next.length === 0) return next;
      const start = next[0].time;
      if (!start) return next;
      return cascadeTimes(next, start);
    });
    setRowNoSlot((cur) => { const next = new Set(cur); next.delete(id); return next; });
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
    setRowNoSlot(new Set());
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

  // Smart scheduler — per-row slot finding
  function findBestSlots() {
    if (rows.length === 0) return;

    const targetDate = computeTargetDateFromPrefs(
      date || nextSaturdayIso(),
      prefDay,
      prefWeek,
    );

    // Compute synchronously so toast logic sees the correct counts
    const noSlotIds = new Set<string>();
    const newRows = rows.map((row, i) => {
      const slot = findSlotForRow(i, yearGroup);
      if (!slot) {
        noSlotIds.add(row.id);
        return row;
      }
      return { ...row, teacher: row.teacher || slot.teacher, time: slot.time };
    });

    setRows(newRows);
    setRowNoSlot(noSlotIds);
    if (targetDate !== date) setDate(targetDate);

    if (noSlotIds.size === rows.length) {
      toast.error("No available slots found — please assign teachers manually");
    } else if (noSlotIds.size > 0) {
      toast.warning(`${noSlotIds.size} subject${noSlotIds.size === 1 ? "" : "s"} could not be auto-assigned`);
    } else {
      toast.success(`Best slots applied for ${rows.length} subject${rows.length === 1 ? "" : "s"}`);
    }
  }

  // Derived
  const totalMinutes = rows.length * 15;
  const teachersList = rows.map((r) => r.teacher).filter(Boolean);
  const canSubmit =
    Boolean(date) &&
    rows.length > 0 &&
    rows.every((r) => r.subject.trim() && r.time);

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
        teachers: r.teacher ? [r.teacher] : [],
        notes: notes.trim() || undefined,
        leadId: lead?.id,
      });
    });

    const leadId = lead?.id ?? BILAL_LEAD_ID;
    const dueLabel = formatTaskDueDate(date);
    rows.forEach((r) => {
      if (!r.teacher) return; // skip task creation when no teacher assigned
      fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: nextAutoTaskId(),
          title: `Log assessment outcome — ${studentName} · ${r.subject.trim()}`,
          type: "Academic",
          priority: "High",
          status: "Open",
          assignees: [r.teacher],
          dueDate: dueLabel,
          linkedRecord: null,
          description: `Assessment booked for ${formatDate(date)} at ${r.time}. Please log the outcome in Enrolla after the session.`,
          subtasks: [],
          overdue: false,
          sourceLeadId: leadId,
          sourceLeadName: studentName,
        }),
      }).catch(() => {});
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

    // Persist preferences back to lead (map to legacy format)
    if (lead) {
      onUpdatePrefs?.(lead.id, {
        preferredDays: prefDay ? [prefDay] : [],
        preferredWindow: "Any",
      });
    }

    if (isBilal) {
      const first = rows[0];
      const label =
        rows.length === 1
          ? first.teacher || "TBC"
          : `${first.teacher || "TBC"} +${rows.length - 1}`;
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

    const assignedCount = rows.filter((r) => r.teacher).length;
    const teachersLabel = Array.from(new Set(rows.map((r) => r.teacher).filter(Boolean))).join(", ");
    toast.success(
      assignedCount > 0
        ? `${rows.length} assessment${rows.length === 1 ? "" : "s"} booked · ${assignedCount} task${assignedCount === 1 ? "" : "s"} created for ${teachersLabel}`
        : `${rows.length} assessment${rows.length === 1 ? "" : "s"} booked`,
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
          {/* HEADER: from date + preferred window + find slots */}
          <div className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-3">
              <FieldLabel htmlFor="ba-date" required>From date</FieldLabel>
              <input
                id="ba-date"
                type="date"
                className={FIELD}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="col-span-6">
              <FieldLabel>Preferred window</FieldLabel>
              <div className="flex items-center gap-2">
                {/* Day dropdown */}
                <select
                  value={prefDay}
                  onChange={(e) => setPrefDay(e.target.value)}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 min-w-[108px]"
                >
                  <option value="">Any day</option>
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => (
                    <option key={d} value={d}>{DAY_SHORT[d]}</option>
                  ))}
                </select>

                {/* Week segmented control */}
                <div className="flex rounded-md border border-slate-300 overflow-hidden text-xs font-medium">
                  {(["asap", "this-week", "next-week"] as PrefWeek[]).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setPrefWeek(w)}
                      className={cn(
                        "px-2.5 py-1.5 transition-colors cursor-pointer border-r border-slate-300 last:border-r-0",
                        prefWeek === w
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {PREF_WEEK_LABELS[w]}
                    </button>
                  ))}
                </div>
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

          {/* LINE ITEM TABLE */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div
              className="grid text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200"
              style={{ gridTemplateColumns: "32px 36px 1.4fr 1.4fr 160px 32px" }}
            >
              <div className="px-2 py-2" />
              <div className="px-2 py-2">#</div>
              <div className="px-2 py-2">Subject</div>
              <div className="px-2 py-2">Teacher <span className="normal-case font-normal text-slate-400">(optional)</span></div>
              <div className="px-2 py-2">Time</div>
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
              const noSlot = rowNoSlot.has(row.id);
              return (
                <div key={row.id}>
                  <div
                    onDragOver={(e) => onDragOver(e, index)}
                    onDrop={(e) => onDrop(e, index)}
                    onDragEnd={onDragEnd}
                    className={cn(
                      "grid items-center border-b border-slate-100 last:border-b-0 transition-colors",
                      isOver && "bg-amber-50",
                      dragIndex === index && "opacity-50",
                      noSlot && "last:border-b",
                    )}
                    style={{ gridTemplateColumns: "32px 36px 1.4fr 1.4fr 160px 32px" }}
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
                        <option value="">{timeReady ? "Unassigned" : "Select time first"}</option>
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

                  {/* Per-row "no slot found" message */}
                  {noSlot && (
                    <div className="flex items-center gap-1.5 px-10 py-1.5 bg-orange-50 border-b border-slate-100 last:border-b-0">
                      <AlertCircle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      <span className="text-xs text-orange-700">
                        No available slots found — please select manually.
                      </span>
                    </div>
                  )}
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
              <span className="text-slate-500">From date</span>
              <span className="text-slate-800 font-semibold">
                {date ? formatDate(date) : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Preferred window</span>
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
