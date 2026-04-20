"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { tasks as taskStore, type Lead, type Task } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { FIELD, FieldLabel, FormActions } from "./dialog-parts";

const STAFF = [
  "Jason Daswani",
  "Sarah Thompson",
  "Ahmed Khalil",
  "Tariq Al Nasser",
  "Hana Malik",
];

const FOLLOW_UP_OPTIONS: { label: string; days: number }[] = [
  { label: "1 day", days: 1 },
  { label: "2 days", days: 2 },
  { label: "3 days", days: 3 },
  { label: "1 week", days: 7 },
  { label: "2 weeks", days: 14 },
];

let nextNmtTaskSeq = 400;
function nextNmtTaskId(): string {
  nextNmtTaskSeq += 1;
  return `TK-${String(nextNmtTaskSeq).padStart(3, "0")}`;
}

function formatDueLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface NeedsMoreTimeResult {
  taskId: string;
  assignee: string;
  dueLabel: string;
  note: string;
}

export function NeedsMoreTimeDialog({
  open,
  onOpenChange,
  lead,
  currentStage,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: Lead | null;
  currentStage: string;
  onCreated: (result: NeedsMoreTimeResult) => void;
}) {
  const [note, setNote] = useState("");
  const [days, setDays] = useState<number>(2);
  const [assignee, setAssignee] = useState<string>(lead?.assignedTo ?? STAFF[0]);
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setNote("");
      setDays(2);
      setAssignee(lead?.assignedTo ?? STAFF[0]);
      setAssigneeQuery("");
      setAssigneeOpen(false);
    }
  }, [open, lead?.assignedTo]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setAssigneeOpen(false);
      }
    }
    if (assigneeOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [assigneeOpen]);

  const filtered = useMemo(() => {
    const q = assigneeQuery.trim().toLowerCase();
    return STAFF.filter((n) => !q || n.toLowerCase().includes(q));
  }, [assigneeQuery]);

  const dueIso = useMemo(() => addDays(days), [days]);

  function submit() {
    if (!lead) return;
    const taskId = nextNmtTaskId();
    const title = `Follow up — ${lead.guardian} · ${lead.childName} · ${currentStage}`;
    const description =
      note.trim().length > 0
        ? note.trim()
        : `Parent needs more time at ${currentStage}. Follow up with ${lead.guardian}.`;
    const newTask: Task = {
      id: taskId,
      title,
      type: "Admin",
      priority: "Medium",
      status: "Open",
      assignee,
      dueDate: formatDueLabel(dueIso),
      linkedRecord: null,
      description,
      subtasks: [],
      overdue: false,
      sourceLeadId: lead.id,
      sourceLeadName: lead.childName,
    };
    taskStore.push(newTask);
    const dueShort = shortDate(dueIso);
    toast.success(`Follow-up task created · due ${dueShort}`);
    onCreated({ taskId, assignee, dueLabel: dueShort, note: description });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Create follow-up task</DialogTitle>
          <DialogDescription>
            The parent needs more time. A task will be created to follow up.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          <div>
            <FieldLabel htmlFor="nmt-note">Follow-up note</FieldLabel>
            <textarea
              id="nmt-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. Parent travelling until next week..."
              className={cn(FIELD, "resize-none")}
            />
          </div>

          <div>
            <FieldLabel htmlFor="nmt-days">Follow-up in</FieldLabel>
            <select
              id="nmt-days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className={cn(FIELD, "cursor-pointer bg-white")}
            >
              {FOLLOW_UP_OPTIONS.map((o) => (
                <option key={o.days} value={o.days}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Due {shortDate(dueIso)}</p>
          </div>

          <div ref={boxRef} className="relative">
            <FieldLabel htmlFor="nmt-assignee">Assignee</FieldLabel>
            <button
              type="button"
              id="nmt-assignee"
              onClick={() => setAssigneeOpen((o) => !o)}
              className={cn(FIELD, "flex items-center justify-between text-left cursor-pointer")}
            >
              <span>{assignee}</span>
              <span className="text-slate-400 text-xs">▾</span>
            </button>
            {assigneeOpen && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                <input
                  autoFocus
                  value={assigneeQuery}
                  onChange={(e) => setAssigneeQuery(e.target.value)}
                  placeholder="Search staff..."
                  className="w-full px-3 py-2 text-sm border-b border-slate-200 focus:outline-none"
                />
                <div className="max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-slate-500">No match</div>
                  ) : (
                    filtered.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setAssignee(name);
                          setAssigneeOpen(false);
                          setAssigneeQuery("");
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 text-sm hover:bg-amber-50 cursor-pointer",
                          assignee === name ? "text-amber-700 font-medium" : "text-slate-700",
                        )}
                      >
                        {name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Create Task"
          submitDisabled={!lead}
        />
      </DialogContent>
    </Dialog>
  );
}
