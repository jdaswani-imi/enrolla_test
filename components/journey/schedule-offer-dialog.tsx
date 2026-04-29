"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useJourney,
  departmentFor,
  formatDate,
  type ScheduleRow,
} from "@/lib/journey-store";
import type { Lead } from "@/lib/types/lead";
import { cn } from "@/lib/utils";
import { WhatsAppBlock } from "./whatsapp-block";
import { TimeSelect } from "./time-select";
import { SubjectSelect } from "./subject-select";
import { normaliseSubject } from "./subjects";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const SESSIONS_OPTIONS = [1, 2, 3, 4] as const;

function newRow(subject = ""): ScheduleRow {
  return {
    id: `sr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    subject,
    days: [],
    time: "16:00",
    teacher: "",
    sessionsPerWeek: 1,
  };
}

export function ScheduleOfferDialog({
  open,
  onOpenChange,
  lead,
  onCommit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead?: Lead | null;
  onCommit?: () => void;
}) {
  const journey = useJourney();

  const leadId = lead?.id ?? "";
  const yearGroup = lead?.yearGroup ?? "Y7";
  const dept = useMemo(() => departmentFor(yearGroup), [yearGroup]);

  const [allStaff, setAllStaff] = useState<{ id: string; name: string; role: string; department: string; status: string }[]>([]);
  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.staff ?? []);
        setAllStaff(list.map((s: { id: string; first_name?: string; last_name?: string; name?: string; role?: string; department?: string; status?: string }) => ({
          id: s.id,
          name: s.name ?? `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim(),
          role: s.role ?? "",
          department: s.department ?? "",
          status: s.status ?? "",
        })));
      })
      .catch(() => {});
  }, []);

  const activeTeachers = allStaff.filter(
    (s) => (s.role === "Teacher" || s.role === "HOD") && s.status === "Active",
  );
  const deptTeachers = activeTeachers.filter((s) => s.department === dept);
  // Fall back to all active teachers when department data is incomplete in DB
  const teacherPool = deptTeachers.length > 0 ? deptTeachers : activeTeachers;

  const guardianFirstName = (lead?.guardian ?? "Tariq Mahmood").split(" ")[0];
  const childName = lead?.childName ?? "Bilal Mahmood";

  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [sent, setSent] = useState(false);
  const [step, setStep] = useState<"schedule" | "message">("schedule");

  useEffect(() => {
    if (!open) return;
    const existing = leadId ? journey.scheduleByLead[leadId] : undefined;
    if (existing?.rows?.length) {
      setRows(existing.rows);
    } else {
      const subjects = lead?.subjects?.length ? lead.subjects : ["Mathematics"];
      setRows(subjects.map((s) => newRow(normaliseSubject(s, yearGroup))));
    }
    setSent(false);
    setStep("schedule");
  }, [open, leadId, lead?.subjects, journey.scheduleByLead]);

  function updateRow(id: string, patch: Partial<ScheduleRow>) {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function toggleDay(id: string, day: string) {
    setRows((cur) =>
      cur.map((r) =>
        r.id === id
          ? { ...r, days: r.days.includes(day) ? r.days.filter((d) => d !== day) : [...r.days, day] }
          : r,
      ),
    );
  }

  function addRow() {
    setRows((cur) => [...cur, newRow()]);
  }

  function removeRow(id: string) {
    setRows((cur) => cur.filter((r) => r.id !== id));
  }

  function findBestSchedule() {
    if (rows.length === 0) return;
    if (teacherPool.length === 0) {
      toast.error("No teachers available for this department — please assign manually");
      return;
    }
    let assigned = 0;
    setRows((cur) =>
      cur.map((row) => {
        if (row.teacher) return row; // keep manual selection
        const teacher = teacherPool[assigned % teacherPool.length];
        if (teacher) { assigned++; return { ...row, teacher: teacher.name }; }
        return row;
      }),
    );
    if (assigned > 0) {
      toast.success(`${assigned} teacher${assigned === 1 ? "" : "s"} auto-assigned`);
    } else {
      toast.info("All rows already have teachers assigned");
    }
  }

  const scheduleComplete =
    rows.length > 0 &&
    rows.every((r) => r.subject.trim() && r.days.length > 0 && r.time && r.teacher && r.sessionsPerWeek > 0);

  const canSubmit = scheduleComplete;

  const message = useMemo(() => {
    if (!rows.length) return "";
    const lines = rows.map((r) => {
      const days = r.days.join("/") || "TBC";
      return `• ${r.subject} — ${days} · ${r.time} · with ${r.teacher || "TBC"} · ${r.sessionsPerWeek}×/week`;
    });
    return `Hi ${guardianFirstName}, here is the proposed schedule for ${childName} (${yearGroup}) next term:

${lines.join("\n")}

Please reply to confirm so we can hold these slots. Thank you — Improve ME Institute.`;
  }, [rows, guardianFirstName, childName, yearGroup]);

  function submit() {
    if (!canSubmit || !leadId) return;
    const summary = rows
      .map((r) => `${r.subject} ${r.days.join("/")} ${r.time}`)
      .join("; ");
    journey.setSchedule(
      leadId,
      {
        rows,
        sentVia: sent ? "WhatsApp" : undefined,
        proposedOn: new Date().toISOString().slice(0, 10),
      },
      `Schedule proposed — ${summary}`,
    );
    if (sent) {
      toast.success("Schedule proposed — sent to parent via WhatsApp");
    } else {
      toast.success("Schedule marked as offered");
    }
    onCommit?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[860px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>Propose a schedule</DialogTitle>
          <DialogDescription>
            {step === "schedule"
              ? "Build the timetable for each subject. Days and teacher are required."
              : "Review and copy the message to send to the parent."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="px-6 pt-1 pb-0 flex items-center gap-3">
          {(["schedule", "message"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold border-2 transition-colors",
                step === s
                  ? "bg-amber-500 border-amber-500 text-white"
                  : i === 0 && step === "message"
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "bg-white border-slate-300 text-slate-400",
              )}>
                {i === 0 && step === "message" ? "✓" : i + 1}
              </div>
              <span className={cn(
                "text-xs font-medium",
                step === s ? "text-slate-800" : "text-slate-400",
              )}>
                {s === "schedule" ? "Schedule" : "Preview message"}
              </span>
              {i === 0 && <ChevronRight className="w-4 h-4 text-slate-300" />}
            </div>
          ))}
        </div>

        {step === "schedule" && (
          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Toolbar: Find best schedule */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {rows.length} subject{rows.length === 1 ? "" : "s"} · select days and assign a teacher for each
              </p>
              <button
                type="button"
                onClick={findBestSchedule}
                disabled={rows.length === 0}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-400 text-sm font-semibold text-amber-700 bg-white hover:bg-amber-50 cursor-pointer transition-colors shadow-sm",
                  rows.length === 0 && "opacity-50 cursor-not-allowed hover:bg-white",
                )}
              >
                <Sparkles className="w-4 h-4" />
                Find best schedule
              </button>
            </div>

            {/* Subject cards */}
            <div className="space-y-3">
              {rows.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400">
                  No subjects yet — add one below.
                </div>
              )}

              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-slate-200 bg-white overflow-hidden"
                >
                  {/* Row header: number + remove */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-100">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Subject {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label="Remove subject"
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-4 py-3 space-y-3">
                    {/* Controls row: Subject | Time | Teacher | Sessions/wk */}
                    <div className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-4">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Subject</label>
                        <SubjectSelect
                          value={row.subject}
                          onChange={(next) => updateRow(row.id, { subject: next })}
                          yearGroup={yearGroup}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Time</label>
                        <TimeSelect
                          value={row.time}
                          onChange={(next) => updateRow(row.id, { time: next })}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                          Teacher <span className="normal-case font-normal text-slate-400">({dept})</span>
                        </label>
                        <select
                          value={row.teacher}
                          onChange={(e) => updateRow(row.id, { teacher: e.target.value })}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                        >
                          <option value="">Select teacher</option>
                          {teacherPool.map((t) => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">Sessions/wk</label>
                        <select
                          value={row.sessionsPerWeek}
                          onChange={(e) => updateRow(row.id, { sessionsPerWeek: Number(e.target.value) })}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                        >
                          {SESSIONS_OPTIONS.map((n) => (
                            <option key={n} value={n}>{n}{n === 4 ? "+" : ""}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Days row — full width */}
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Days</label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS.map((d) => {
                          const on = row.days.includes(d);
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => toggleDay(row.id, d)}
                              className={cn(
                                "px-4 py-2 rounded-lg text-sm font-semibold border cursor-pointer transition-colors min-w-[60px]",
                                on
                                  ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                                  : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400",
                              )}
                            >
                              {d}
                            </button>
                          );
                        })}
                        {row.days.length > 0 && (
                          <span className="self-center text-xs text-slate-500 ml-1">
                            {row.days.length} day{row.days.length === 1 ? "" : "s"} selected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 hover:text-amber-800 hover:bg-amber-50 rounded-md cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add subject
            </button>
          </div>
        )}

        {step === "message" && (
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Quick summary of what was scheduled */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Schedule summary</p>
              {rows.map((r) => (
                <div key={r.id} className="flex items-baseline gap-2 text-sm">
                  <span className="font-semibold text-slate-800 min-w-[120px]">{r.subject || "—"}</span>
                  <span className="text-slate-500">{r.days.join("/") || "—"}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-500">{r.time}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-600">{r.teacher || "TBC"}</span>
                  <span className="text-slate-400 text-xs ml-auto">{r.sessionsPerWeek}×/wk</span>
                </div>
              ))}
            </div>

            <WhatsAppBlock
              message={message || "Add subject rows to generate message"}
              sent={sent}
              onSentChange={setSent}
            />

            <p className="text-xs text-slate-500">
              Proposed on {formatDate(new Date().toISOString().slice(0, 10))}. Confirmation will be logged in the next step.
            </p>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          {step === "schedule" ? (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-sm font-medium border border-slate-300 bg-white rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep("message")}
                disabled={!scheduleComplete}
                className={cn(
                  "inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors shadow-sm",
                  scheduleComplete
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed",
                )}
              >
                Next: Preview message
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStep("schedule")}
                className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium border border-slate-300 bg-white rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!canSubmit}
                className={cn(
                  "px-5 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors shadow-sm",
                  canSubmit
                    ? "bg-amber-500 text-white hover:bg-amber-600"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed",
                )}
              >
                Mark as Offered
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
