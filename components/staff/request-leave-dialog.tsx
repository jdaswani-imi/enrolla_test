"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  staffMembers,
  timetableSessions,
  type StaffMember,
  type TimetableSession,
} from "@/lib/mock-data";

// ─── Types ──────────────────────────────────────────────────────────────────

export type LeaveType = "Annual" | "Medical" | "Personal" | "Other";

export interface LeaveRequestSubmission {
  staffName: string;
  leaveType: LeaveType;
  fromDate: string; // yyyy-mm-dd
  toDate: string;   // yyyy-mm-dd
  rangeLabel: string;
  days: number;
  notes: string;
  totalSessions: number;
  coveredSessions: number;
}

interface Props {
  open: boolean;
  staffName: string;
  onOpenChange: (open: boolean) => void;
  onSubmit: (result: LeaveRequestSubmission) => void;
}

const LEAVE_TYPES: LeaveType[] = ["Annual", "Medical", "Personal", "Other"];
const COVER_NONE = "__none__";
const STEP_TITLES = ["Leave Details", "Cover Proposal"];

// ─── Helpers ────────────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatISO(iso: string): { day: number; month: number; year: number } | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map((v) => Number(v));
  if (!y || !m || !d) return null;
  return { day: d, month: m, year: y };
}

function computeRangeLabel(fromIso: string, toIso: string): string {
  const a = formatISO(fromIso);
  const b = formatISO(toIso);
  if (!a || !b) return "";
  if (a.year === b.year && a.month === b.month && a.day === b.day) {
    return `${a.day} ${MONTHS[a.month - 1]}`;
  }
  if (a.year === b.year && a.month === b.month) {
    return `${a.day}–${b.day} ${MONTHS[a.month - 1]}`;
  }
  if (a.year === b.year) {
    return `${a.day} ${MONTHS[a.month - 1]}–${b.day} ${MONTHS[b.month - 1]}`;
  }
  return `${a.day} ${MONTHS[a.month - 1]} ${a.year}–${b.day} ${MONTHS[b.month - 1]} ${b.year}`;
}

function computeDays(fromIso: string, toIso: string): number {
  if (!fromIso || !toIso) return 0;
  const from = new Date(fromIso);
  const to = new Date(toIso);
  if (Number.isNaN(from.valueOf()) || Number.isNaN(to.valueOf())) return 0;
  const diff = Math.round((to.valueOf() - from.valueOf()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

function extractSubjectArea(subject: string): string {
  const parts = subject.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
}

function teacherTeachesSubject(staff: StaffMember, subjectArea: string): boolean {
  const key = subjectArea.toLowerCase();
  return staff.subjects.some((s) => s.toLowerCase().includes(key));
}

// ─── Dialog ─────────────────────────────────────────────────────────────────

export function RequestLeaveDialog({ open, staffName, onOpenChange, onSubmit }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [leaveType, setLeaveType] = useState<LeaveType>("Annual");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [notes, setNotes] = useState("");
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setStep(1);
      setLeaveType("Annual");
      setFromDate("");
      setToDate("");
      setNotes("");
      setAssignments({});
    }
  }, [open]);

  const sessions = useMemo<TimetableSession[]>(() => {
    if (!staffName) return [];
    const key = staffName.toLowerCase();
    return timetableSessions
      .filter((s) => s.teacher.toLowerCase().includes(key))
      .filter((s) => s.type !== "Meeting" && s.type !== "Blocked")
      .slice(0, 8);
  }, [staffName]);

  function candidatesFor(session: TimetableSession): StaffMember[] {
    const subjectArea = extractSubjectArea(session.subject);
    return staffMembers.filter((s) => {
      if (s.status !== "Active") return false;
      if (!["Teacher", "HOD", "TA"].includes(s.role)) return false;
      if (s.name.toLowerCase() === staffName.toLowerCase()) return false;
      if (session.teacher.toLowerCase().includes(s.name.toLowerCase())) return false;
      return teacherTeachesSubject(s, subjectArea);
    });
  }

  const days = useMemo(() => computeDays(fromDate, toDate), [fromDate, toDate]);
  const rangeLabel = useMemo(() => computeRangeLabel(fromDate, toDate), [fromDate, toDate]);

  const coveredCount = useMemo(
    () => sessions.filter((s) => assignments[s.id] && assignments[s.id] !== COVER_NONE).length,
    [sessions, assignments],
  );
  const uncoveredCount = sessions.length - coveredCount;

  const step1Valid = fromDate !== "" && toDate !== "" && fromDate <= toDate;

  function setAssignment(sessionId: string, value: string) {
    setAssignments((prev) => ({ ...prev, [sessionId]: value }));
  }

  function handleSubmit() {
    onSubmit({
      staffName,
      leaveType,
      fromDate,
      toDate,
      rangeLabel,
      days,
      notes: notes.trim(),
      totalSessions: sessions.length,
      coveredSessions: coveredCount,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[88vh]">
        <DialogHeader>
          <DialogTitle>Request Leave</DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Tell us when you need time off."
              : "Propose cover for your sessions during this period."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-700">
              Step {step} of 2
              <span className="text-slate-400 font-normal">  ·  {STEP_TITLES[step - 1]}</span>
            </span>
            {step === 2 && sessions.length > 0 && (
              <span className="text-xs text-slate-500 tabular-nums">
                {coveredCount} / {sessions.length} covered
              </span>
            )}
          </div>
          <StepCircles step={step} />
          <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            />
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {step === 1 && (
            <StepOne
              leaveType={leaveType}
              setLeaveType={setLeaveType}
              fromDate={fromDate}
              setFromDate={setFromDate}
              toDate={toDate}
              setToDate={setToDate}
              notes={notes}
              setNotes={setNotes}
              rangeLabel={rangeLabel}
              days={days}
            />
          )}

          {step === 2 && (
            <StepTwo
              sessions={sessions}
              assignments={assignments}
              setAssignment={setAssignment}
              candidatesFor={candidatesFor}
              uncoveredCount={uncoveredCount}
              staffName={staffName}
              rangeLabel={rangeLabel}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back
              </button>
            )}
            {step === 1 ? (
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!step1Valid}
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" strokeWidth={3} />
                Submit request
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Step circles ───────────────────────────────────────────────────────────

function StepCircles({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2].map((n, i) => {
        const done = n < step;
        const current = n === step;
        return (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                done && "bg-amber-500 text-white",
                current && "bg-white text-amber-600 ring-2 ring-amber-500 ring-offset-2 ring-offset-white",
                !done && !current && "bg-slate-100 text-slate-400 border border-slate-200",
              )}
            >
              {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : n}
            </div>
            {i < 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded transition-colors",
                  done ? "bg-amber-500" : "bg-slate-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 ─────────────────────────────────────────────────────────────────

function StepOne({
  leaveType,
  setLeaveType,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  notes,
  setNotes,
  rangeLabel,
  days,
}: {
  leaveType: LeaveType;
  setLeaveType: (v: LeaveType) => void;
  fromDate: string;
  setFromDate: (v: string) => void;
  toDate: string;
  setToDate: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  rangeLabel: string;
  days: number;
}) {
  const rangeInvalid = fromDate !== "" && toDate !== "" && fromDate > toDate;

  return (
    <div className="space-y-5">
      {/* Leave type */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
          Leave type
        </p>
        <div className="flex flex-wrap gap-2">
          {LEAVE_TYPES.map((t) => {
            const active = leaveType === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setLeaveType(t)}
                aria-pressed={active}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer",
                  active
                    ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dates */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
          Leave window
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1 block">From date</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600 mb-1 block">To date</span>
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition"
            />
          </label>
        </div>
        {rangeInvalid && (
          <p className="mt-2 text-xs text-red-600 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            The end date must be on or after the start date.
          </p>
        )}
        {!rangeInvalid && rangeLabel && (
          <p className="mt-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{rangeLabel}</span>
            <span className="text-slate-400"> · {days} day{days === 1 ? "" : "s"}</span>
          </p>
        )}
      </div>

      {/* Notes */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
          Notes <span className="text-slate-300 normal-case tracking-normal font-normal">(optional)</span>
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Anything your manager should know?"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition resize-none"
        />
      </div>
    </div>
  );
}

// ─── Step 2 ─────────────────────────────────────────────────────────────────

function StepTwo({
  sessions,
  assignments,
  setAssignment,
  candidatesFor,
  uncoveredCount,
  staffName,
  rangeLabel,
}: {
  sessions: TimetableSession[];
  assignments: Record<string, string>;
  setAssignment: (id: string, value: string) => void;
  candidatesFor: (s: TimetableSession) => StaffMember[];
  uncoveredCount: number;
  staffName: string;
  rangeLabel: string;
}) {
  if (sessions.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
            <Check className="w-5 h-5 text-emerald-600" strokeWidth={3} />
          </div>
          <p className="text-sm font-semibold text-slate-800">No sessions to cover</p>
          <p className="text-xs text-slate-500 mt-1">
            You have no scheduled sessions{rangeLabel ? ` during ${rangeLabel}` : ""}. Nothing to hand over.
          </p>
        </div>
        <p className="text-xs text-slate-500 italic text-center">
          Your manager will review and may adjust cover assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        These are your sessions during the leave window. Propose a cover teacher for each one.
      </p>

      {uncoveredCount > 0 && (
        <p className="text-xs text-amber-700 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          {uncoveredCount} session{uncoveredCount === 1 ? "" : "s"} still need cover.
        </p>
      )}

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Date</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Time</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Subject</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Room</th>
              <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">Students</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Proposed cover</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => {
              const value = assignments[s.id] ?? "";
              const assigned = value && value !== COVER_NONE;
              const candidates = candidatesFor(s);
              return (
                <tr key={s.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    <span className="font-medium">{s.day}</span>{" "}
                    <span className="text-slate-500">{s.date}</span>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-600 tabular-nums">
                    {s.startTime}–{s.endTime}
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">
                    <div className="font-medium">{s.subject}</div>
                    <div className="text-[11px] text-slate-400">{s.department}</div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">{s.room}</td>
                  <td className="px-3 py-2.5 text-center text-slate-600 tabular-nums">{s.studentCount}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <CoverSelect
                        value={value}
                        onChange={(v) => setAssignment(s.id, v)}
                        candidates={candidates}
                      />
                      {!assigned && (
                        <span title="No cover proposed">
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500 italic">
        Your manager will review and may adjust cover assignments.
      </p>
    </div>
  );
}

// ─── Cover select ───────────────────────────────────────────────────────────

function CoverSelect({
  value,
  onChange,
  candidates,
}: {
  value: string;
  onChange: (v: string) => void;
  candidates: StaffMember[];
}) {
  return (
    <div className="relative flex-1 min-w-[160px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs rounded-lg border bg-white text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300 transition",
          value && value !== COVER_NONE ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200",
        )}
      >
        <option value="">Select cover…</option>
        <option value={COVER_NONE}>No cover needed</option>
        {candidates.length > 0 && (
          <optgroup label="Eligible teachers">
            {candidates.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </optgroup>
        )}
        {candidates.length === 0 && (
          <option value="" disabled>
            No eligible teachers
          </option>
        )}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
    </div>
  );
}
