"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronDown, Copy, MessageCircle, Users } from "lucide-react";
import { toast } from "sonner";
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

// ─── Step indicator (same pattern as add-student-dialog) ─────────────────────

const STEP_TITLES = ["Cover Assignment", "Summary & Notify"];

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

// ─── Subject matching helpers ────────────────────────────────────────────────

function extractSubjectArea(sessionSubject: string): string {
  // "Y8 Maths" -> "Maths", "CAT4 Assessment" -> "Assessment"
  const parts = sessionSubject.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : parts[0];
}

function teacherTeachesSubject(staff: StaffMember, subjectArea: string): boolean {
  const key = subjectArea.toLowerCase();
  return staff.subjects.some((s) => s.toLowerCase().includes(key));
}

// ─── Types & props ───────────────────────────────────────────────────────────

const COVER_NONE = "__none__";

export interface HandoverConfirmResult {
  totalSessions: number;
  coveredSessions: number;
}

interface Props {
  open: boolean;
  staffName: string;
  leaveDates: string; // e.g. "5–9 May"
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: HandoverConfirmResult) => void;
}

// ─── Dialog ──────────────────────────────────────────────────────────────────

export function LeaveHandoverDialog({ open, staffName, leaveDates, onOpenChange, onConfirm }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  // sessionId -> teacher name or COVER_NONE
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  // Filter that staff's non-meeting sessions. In this prototype, leave-window
  // date-range filtering is loose — we show all of their scheduled sessions.
  const sessions = useMemo<TimetableSession[]>(() => {
    if (!staffName) return [];
    const key = staffName.toLowerCase();
    return timetableSessions
      .filter((s) => s.teacher.toLowerCase().includes(key))
      .filter((s) => s.type !== "Meeting" && s.type !== "Blocked")
      .slice(0, 8);
  }, [staffName]);

  // Reset state when the dialog opens.
  useEffect(() => {
    if (open) {
      setStep(1);
      setAssignments({});
    }
  }, [open, staffName]);

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

  function setAssignment(sessionId: string, value: string) {
    setAssignments((prev) => ({ ...prev, [sessionId]: value }));
  }

  function assignAllTo(teacherName: string) {
    const next: Record<string, string> = {};
    for (const s of sessions) {
      const isEligible = candidatesFor(s).some((c) => c.name === teacherName);
      next[s.id] = isEligible ? teacherName : (assignments[s.id] ?? COVER_NONE);
    }
    setAssignments(next);
  }

  // Pick the first teacher that's been assigned (for the "assign same to all" shortcut).
  const firstPickedTeacher = useMemo(() => {
    for (const s of sessions) {
      const v = assignments[s.id];
      if (v && v !== COVER_NONE) return v;
    }
    return null;
  }, [assignments, sessions]);

  const coveredCount = useMemo(
    () => sessions.filter((s) => assignments[s.id] && assignments[s.id] !== COVER_NONE).length,
    [sessions, assignments],
  );

  const uncoveredCount = sessions.length - coveredCount;

  // Group cover assignments by teacher for the summary view.
  const assignmentsByTeacher = useMemo(() => {
    const map: Record<string, TimetableSession[]> = {};
    for (const s of sessions) {
      const v = assignments[s.id];
      if (!v || v === COVER_NONE) continue;
      (map[v] ??= []).push(s);
    }
    return map;
  }, [assignments, sessions]);

  const whatsappTemplate = useMemo(() => {
    const lines: string[] = [];
    lines.push(`Hi ${staffName.split(" ")[0]}, hope you feel better soon.`);
    lines.push("");
    lines.push(`Cover arranged for ${leaveDates}.`);
    const teachers = Object.keys(assignmentsByTeacher);
    if (teachers.length === 1) {
      lines.push(`${teachers[0]} will take your sessions.`);
    } else if (teachers.length > 1) {
      lines.push("Your sessions will be covered by:");
      for (const t of teachers) {
        lines.push(`• ${t} — ${assignmentsByTeacher[t].length} session${assignmentsByTeacher[t].length === 1 ? "" : "s"}`);
      }
    } else {
      lines.push("No cover required for this period.");
    }
    lines.push("");
    lines.push("Enjoy your time off — the IMI team.");
    return lines.join("\n");
  }, [staffName, leaveDates, assignmentsByTeacher]);

  function handleNext() {
    setStep(2);
  }

  function handleBack() {
    setStep(1);
  }

  function handleConfirm() {
    onConfirm({ totalSessions: sessions.length, coveredSessions: coveredCount });
    toast.success(`Handover complete — ${coveredCount} session${coveredCount === 1 ? "" : "s"} covered`);
    onOpenChange(false);
  }

  function copyTemplate() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(whatsappTemplate).catch(() => {});
      toast.success("Template copied to clipboard");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[88vh]">
        <DialogHeader>
          <DialogTitle>Leave Handover</DialogTitle>
          <DialogDescription>
            {staffName} is on leave {leaveDates}. Assign cover for their sessions.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-700">
              Step {step} of 2
              <span className="text-slate-400 font-normal">  ·  {STEP_TITLES[step - 1]}</span>
            </span>
            {step === 1 && sessions.length > 0 && (
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
              staffName={staffName}
              leaveDates={leaveDates}
              sessions={sessions}
              assignments={assignments}
              setAssignment={setAssignment}
              candidatesFor={candidatesFor}
              firstPickedTeacher={firstPickedTeacher}
              onAssignAll={assignAllTo}
              uncoveredCount={uncoveredCount}
            />
          )}

          {step === 2 && (
            <StepTwo
              staffName={staffName}
              leaveDates={leaveDates}
              totalSessions={sessions.length}
              coveredCount={coveredCount}
              assignmentsByTeacher={assignmentsByTeacher}
              whatsappTemplate={whatsappTemplate}
              onCopy={copyTemplate}
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
                onClick={handleBack}
                className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Back
              </button>
            )}
            {step === 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" strokeWidth={3} />
                Confirm &amp; close
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Step 1 ───────────────────────────────────────────────────────────────────

function StepOne({
  staffName,
  leaveDates,
  sessions,
  assignments,
  setAssignment,
  candidatesFor,
  firstPickedTeacher,
  onAssignAll,
  uncoveredCount,
}: {
  staffName: string;
  leaveDates: string;
  sessions: TimetableSession[];
  assignments: Record<string, string>;
  setAssignment: (id: string, value: string) => void;
  candidatesFor: (s: TimetableSession) => StaffMember[];
  firstPickedTeacher: string | null;
  onAssignAll: (teacher: string) => void;
  uncoveredCount: number;
}) {
  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
          <Check className="w-5 h-5 text-emerald-600" strokeWidth={3} />
        </div>
        <p className="text-sm font-semibold text-slate-800">No sessions in the leave window</p>
        <p className="text-xs text-slate-500 mt-1">
          {staffName} has no scheduled sessions during {leaveDates}. Nothing to hand over.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Assign-same-to-all shortcut */}
      {firstPickedTeacher && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <Users className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 truncate">
              Assign <span className="font-semibold">{firstPickedTeacher}</span> to all eligible sessions?
            </p>
          </div>
          <button
            type="button"
            onClick={() => onAssignAll(firstPickedTeacher)}
            className="text-xs font-semibold text-amber-700 hover:text-amber-900 hover:underline cursor-pointer shrink-0"
          >
            Apply to all
          </button>
        </div>
      )}

      {/* Unassigned warning summary */}
      {uncoveredCount > 0 && (
        <p className="text-xs text-amber-700 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          {uncoveredCount} session{uncoveredCount === 1 ? "" : "s"} still need cover.
        </p>
      )}

      {/* Sessions table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Date</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Time</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Subject</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Room</th>
              <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-400">Students</th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Cover</th>
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
                        <span title="No cover assigned">
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
    </div>
  );
}

// ─── Cover select ────────────────────────────────────────────────────────────

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

// ─── Step 2 ───────────────────────────────────────────────────────────────────

function StepTwo({
  staffName,
  leaveDates,
  totalSessions,
  coveredCount,
  assignmentsByTeacher,
  whatsappTemplate,
  onCopy,
}: {
  staffName: string;
  leaveDates: string;
  totalSessions: number;
  coveredCount: number;
  assignmentsByTeacher: Record<string, TimetableSession[]>;
  whatsappTemplate: string;
  onCopy: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Summary</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <p className="text-[11px] text-slate-500">Staff member</p>
            <p className="font-semibold text-slate-800">{staffName}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Leave dates</p>
            <p className="font-semibold text-slate-800">{leaveDates}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Total sessions</p>
            <p className="font-semibold text-slate-800 tabular-nums">{totalSessions}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-500">Sessions covered</p>
            <p className={cn(
              "font-semibold tabular-nums",
              coveredCount === totalSessions ? "text-emerald-700" : "text-amber-700",
            )}>
              {coveredCount} / {totalSessions}
            </p>
          </div>
        </div>
      </div>

      {/* Cover assignments list */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Cover assignments</p>
        {Object.keys(assignmentsByTeacher).length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center">
            <p className="text-xs text-slate-500">No cover assignments made.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {Object.entries(assignmentsByTeacher).map(([teacher, list]) => (
              <div key={teacher} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-semibold text-slate-800">{teacher}</p>
                  <span className="text-[11px] text-slate-500 tabular-nums">
                    {list.length} session{list.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ul className="space-y-0.5">
                  {list.map((s) => (
                    <li key={s.id} className="text-xs text-slate-600">
                      <span className="text-slate-400">{s.day} {s.date}</span>{" "}
                      <span className="text-slate-500">· {s.startTime}</span>{" "}
                      · {s.subject} <span className="text-slate-400">({s.room})</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* WhatsApp template */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5" />
            WhatsApp notification (preview)
          </p>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 hover:underline cursor-pointer"
          >
            <Copy className="w-3 h-3" />
            Copy
          </button>
        </div>
        <pre className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
{whatsappTemplate}
        </pre>
      </div>
    </div>
  );
}
