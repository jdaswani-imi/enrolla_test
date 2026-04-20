"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
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
import { staffMembers, type Lead } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { FormActions } from "./dialog-parts";
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

function teachersForDept(dept: string) {
  return staffMembers.filter(
    (s) =>
      (s.role === "Teacher" || s.role === "HOD") &&
      s.department === dept &&
      s.status === "Active",
  );
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
  const teacherPool = useMemo(() => teachersForDept(dept), [dept]);
  const guardianFirstName = (lead?.guardian ?? "Tariq Mahmood").split(" ")[0];
  const childName = lead?.childName ?? "Bilal Mahmood";

  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [sent, setSent] = useState(false);

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

  const canSubmit =
    rows.length > 0 &&
    rows.every((r) => r.subject.trim() && r.days.length > 0 && r.time && r.teacher && r.sessionsPerWeek > 0);

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
      <DialogContent className="w-[640px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Propose a schedule</DialogTitle>
          <DialogDescription>Propose a timetable to the parent for confirmation.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Table header */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-x-auto">
            <div
              className="grid text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200 gap-2 px-2 py-2 min-w-[640px]"
              style={{ gridTemplateColumns: "1.1fr minmax(230px, 1.6fr) 160px 1.3fr 0.8fr 28px" }}
            >
              <div>Subject</div>
              <div>Days</div>
              <div>Time</div>
              <div>Teacher ({dept})</div>
              <div>Sessions/wk</div>
              <div />
            </div>

            {rows.map((row) => (
              <div
                key={row.id}
                className="grid gap-2 px-2 py-2 border-b border-slate-100 last:border-b-0 items-center min-w-[640px]"
                style={{ gridTemplateColumns: "1.1fr minmax(230px, 1.6fr) 160px 1.3fr 0.8fr 28px" }}
              >
                <SubjectSelect
                  value={row.subject}
                  onChange={(next) => updateRow(row.id, { subject: next })}
                  yearGroup={yearGroup}
                />
                <div className="flex flex-nowrap gap-1 py-0.5 overflow-x-auto">
                  {DAYS.map((d) => {
                    const on = row.days.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(row.id, d)}
                        className={cn(
                          "shrink-0 min-w-[30px] px-1.5 py-0.5 rounded text-[11px] font-semibold border cursor-pointer transition-colors",
                          on
                            ? "bg-amber-500 border-amber-500 text-white"
                            : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50",
                        )}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
                <TimeSelect
                  value={row.time}
                  onChange={(next) => updateRow(row.id, { time: next })}
                />
                <select
                  value={row.teacher}
                  onChange={(e) => updateRow(row.id, { teacher: e.target.value })}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                >
                  <option value="">Select teacher</option>
                  {teacherPool.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <select
                  value={row.sessionsPerWeek}
                  onChange={(e) => updateRow(row.id, { sessionsPerWeek: Number(e.target.value) })}
                  className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                >
                  {SESSIONS_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}{n === 4 ? "+" : ""}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  aria-label="Remove row"
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer self-center"
                >
                  <X className="w-4 h-4" />
                </button>
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

          <WhatsAppBlock message={message || "Add subject rows to generate message"} sent={sent} onSentChange={setSent} />

          <p className="text-xs text-slate-500">
            Proposed on {formatDate(new Date().toISOString().slice(0, 10))}. Confirmation will be logged in the next step.
          </p>
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Mark as Offered"
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
