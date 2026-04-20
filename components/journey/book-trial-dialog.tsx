"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  nextSaturdayIso,
  departmentFor,
  trialRateFor,
  formatDate,
  BILAL_LEAD_ID,
  VAT_RATE,
  type ActivityEntry,
} from "@/lib/journey-store";
import { staffMembers, tasks as taskStore, type Lead, type Task } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { FormActions } from "./dialog-parts";
import { TimeSelect } from "./time-select";
import { SubjectSelect } from "./subject-select";
import { normaliseSubject } from "./subjects";

const ROOM_OPTIONS = ["Room 1A", "Room 1B", "Room 2A", "Room 2B", "Room 3A", "TBC"];

interface Row {
  id: string;
  subject: string;
  teacher: string;
  date: string;
  time: string;
  room: string;
  waived: boolean;
  waiveReason: string;
}

let _rowSeq = 0;
function newRow(partial: Partial<Row> = {}): Row {
  _rowSeq += 1;
  return {
    id: `tr-${Date.now().toString(36)}-${_rowSeq}`,
    subject: "",
    teacher: "",
    date: nextSaturdayIso(),
    time: "10:00",
    room: "TBC",
    waived: false,
    waiveReason: "",
    ...partial,
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

let _autoTaskSeq = 800;
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

export function BookTrialDialog({
  open,
  onOpenChange,
  lead,
  onCommit,
  onRecordActivity,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead?: Lead | null;
  onCommit?: () => void;
  onRecordActivity?: (leadId: string, entry: ActivityEntry) => void;
}) {
  const { bookTrial, pushActivity } = useJourney();

  const isBilal = !lead || lead.id === BILAL_LEAD_ID;
  const studentName = isBilal ? "Bilal Mahmood" : lead?.childName ?? "Bilal Mahmood";
  const yearGroup = isBilal ? "Y7" : lead?.yearGroup ?? "Y7";
  const dept = useMemo(() => departmentFor(yearGroup), [yearGroup]);
  const teacherPool = useMemo(() => teachersForDept(dept), [dept]);
  const feePerRow = useMemo(() => trialRateFor(dept), [dept]);

  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!open) return;
    const subjects = lead?.subjects?.length ? lead.subjects : ["Mathematics"];
    setRows(
      subjects.map((s) =>
        newRow({
          subject: normaliseSubject(s, yearGroup),
        }),
      ),
    );
  }, [open, lead, yearGroup]);

  const updateRow = useCallback((id: string, patch: Partial<Row>) => {
    setRows((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  function addRow() {
    setRows((cur) => [...cur, newRow()]);
  }

  function removeRow(id: string) {
    setRows((cur) => cur.filter((r) => r.id !== id));
  }

  const pricing = useMemo(() => {
    const lines = rows.map((r) => {
      const base = r.waived ? 0 : feePerRow;
      const vat = Math.round(base * VAT_RATE * 100) / 100;
      return { rowId: r.id, base, vat, total: base + vat };
    });
    const subtotal = lines.reduce((s, l) => s + l.base, 0);
    const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
    const total = subtotal + vat;
    return { lines, subtotal, vat, total };
  }, [rows, feePerRow]);

  const canSubmit =
    rows.length > 0 &&
    rows.every(
      (r) =>
        r.subject.trim() &&
        r.teacher &&
        r.date &&
        r.time &&
        (!r.waived || r.waiveReason.trim().length > 0),
    );

  function submit() {
    if (!canSubmit) return;
    const leadId = lead?.id ?? BILAL_LEAD_ID;

    rows.forEach((r) => {
      const task: Task = {
        id: nextAutoTaskId(),
        title: `Log trial outcome — ${studentName} · ${r.subject.trim()}`,
        type: "Academic",
        priority: "High",
        status: "Open",
        assignee: r.teacher,
        dueDate: formatTaskDueDate(r.date),
        linkedRecord: null,
        description: `Trial booked for ${formatDate(r.date)} at ${r.time} · Room ${r.room || "TBC"}. Please log the outcome in Enrolla after the session.`,
        subtasks: [],
        overdue: false,
        sourceLeadId: leadId,
        sourceLeadName: studentName,
      };
      taskStore.push(task);
    });

    const teacherList = Array.from(new Set(rows.map((r) => r.teacher))).filter(Boolean);
    const subjectList = rows.map((r) => r.subject.trim()).join(", ");

    const activityEntry: ActivityEntry = {
      label: "Just now",
      text: `Trial booked — ${rows.length} subject${rows.length === 1 ? "" : "s"}: ${subjectList}. Tasks created for ${teacherList.join(", ")}.`,
      dot: "bg-amber-400",
    };
    if (isBilal) {
      pushActivity(activityEntry);
    } else if (lead?.id) {
      onRecordActivity?.(lead.id, activityEntry);
    }

    rows
      .filter((r) => r.waived)
      .forEach((r) => {
        const waiverEntry: ActivityEntry = {
          label: "Just now",
          text: `Trial fee waived — ${r.subject.trim()} · ${r.waiveReason.trim()} · Approved by Jason Daswani`,
          dot: "bg-slate-400",
        };
        if (isBilal) {
          pushActivity(waiverEntry);
        } else if (lead?.id) {
          onRecordActivity?.(lead.id, waiverEntry);
        }
      });

    if (isBilal) {
      const first = rows[0];
      const teacherLabel =
        rows.length === 1 ? first.teacher : `${first.teacher} +${rows.length - 1}`;
      bookTrial({
        subject: rows.map((r) => r.subject).join(", "),
        yearGroup,
        teacher: teacherLabel,
        date: first.date,
        time: first.time,
        room: first.room || "TBC",
      });
    } else {
      onCommit?.();
    }

    toast.success(
      `Trial booked · ${rows.length} task${rows.length === 1 ? "" : "s"} created for ${teacherList.length} teacher${teacherList.length === 1 ? "" : "s"}`,
      {
        action: {
          label: "Undo",
          onClick: () => toast.message("Undo not implemented in prototype"),
        },
      },
    );
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[860px] max-w-[94vw]">
        <DialogHeader>
          <DialogTitle>Book Trial Session(s)</DialogTitle>
          <DialogDescription>Schedule paid trial sessions for this lead.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[76vh] overflow-y-auto">
          {/* LINE ITEM TABLE */}
          <div className="rounded-lg border border-slate-200 bg-white overflow-visible">
            <div
              className="grid text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200"
              style={{ gridTemplateColumns: "1.3fr 1.3fr 140px 170px 110px 80px 32px" }}
            >
              <div className="px-2 py-2">Subject</div>
              <div className="px-2 py-2">Teacher</div>
              <div className="px-2 py-2">Date</div>
              <div className="px-2 py-2">Time</div>
              <div className="px-2 py-2">Room</div>
              <div className="px-2 py-2">Waive</div>
              <div className="px-2 py-2" />
            </div>

            {rows.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                No subjects yet — add one below.
              </div>
            )}

            {rows.map((row) => (
              <div
                key={row.id}
                className="border-b border-slate-100 last:border-b-0"
              >
                <div
                  className="grid items-center"
                  style={{ gridTemplateColumns: "1.3fr 1.3fr 140px 170px 110px 80px 32px" }}
                >
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
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                    >
                      <option value="">Select teacher</option>
                      {teacherPool.map((t) => (
                        <option key={t.id} value={t.name}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="px-2 py-2">
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateRow(row.id, { date: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                    />
                  </div>
                  <div className="px-2 py-2">
                    <TimeSelect
                      value={row.time}
                      onChange={(next) => updateRow(row.id, { time: next })}
                    />
                  </div>
                  <div className="px-2 py-2">
                    <select
                      value={row.room}
                      onChange={(e) => updateRow(row.id, { room: e.target.value })}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                    >
                      {ROOM_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="px-2 py-2 flex items-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={row.waived}
                      onClick={() =>
                        updateRow(row.id, {
                          waived: !row.waived,
                          waiveReason: row.waived ? "" : row.waiveReason,
                        })
                      }
                      className={cn(
                        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer",
                        row.waived ? "bg-amber-500" : "bg-slate-300",
                      )}
                      title="Waive fee"
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                          row.waived ? "translate-x-4" : "translate-x-0.5",
                        )}
                      />
                    </button>
                  </div>
                  <div className="px-2 py-2 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      aria-label="Remove row"
                      className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {row.waived && (
                  <div className="px-2 pb-3">
                    <div className="ml-2 rounded-md bg-amber-50/60 border border-amber-200 p-2">
                      <label className="block text-[11px] font-semibold text-amber-800 mb-1">
                        Reason for waiver <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={row.waiveReason}
                        onChange={(e) => updateRow(row.id, { waiveReason: e.target.value })}
                        placeholder="e.g. Sibling discount, goodwill gesture"
                        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}
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

          {/* FEE SUMMARY */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
            {rows.length === 0 ? (
              <p className="text-sm text-slate-500">No subjects — add a row to see the fee summary.</p>
            ) : (
              <>
                {rows.map((r) => {
                  const base = feePerRow;
                  const vat = Math.round(base * VAT_RATE * 100) / 100;
                  const subjectLabel = r.subject.trim() || "Subject";
                  return (
                    <div key={r.id} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-slate-600 min-w-0">
                        {subjectLabel} trial — {dept}
                      </span>
                      <span className="text-slate-800 font-medium text-right shrink-0">
                        {r.waived ? (
                          <>
                            <span className="line-through text-slate-400 mr-2">
                              AED {base.toFixed(0)}
                            </span>
                            <span className="text-emerald-700">Trial fee waived — AED 0</span>
                          </>
                        ) : (
                          <>AED {base.toFixed(0)} + AED {vat.toFixed(2)} VAT = AED {(base + vat).toFixed(2)}</>
                        )}
                      </span>
                    </div>
                  );
                })}
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-sm">
                  <span className="text-slate-500">VAT (5%)</span>
                  <span className="text-slate-800 font-medium">AED {pricing.vat.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Total</span>
                  <span className="text-slate-900 font-bold">AED {pricing.total.toFixed(2)}</span>
                </div>
                {rows.some((r) => r.waived) && (
                  <p className="text-xs text-slate-500 pt-1">
                    Zero-value trial invoice will be auto-resolved to Paid. Admin Head will be notified.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Book trial(s)"
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
