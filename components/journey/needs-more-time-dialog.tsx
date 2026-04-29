"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Lead } from "@/lib/types/lead";
import { cn } from "@/lib/utils";
import { FIELD, FieldLabel, FormActions } from "./dialog-parts";
import { AssigneePicker } from "@/components/tasks/assignee-picker";
import type { StaffLite } from "@/components/tasks/assignee-picker";

const FOLLOW_UP_OPTIONS: { label: string; days: number }[] = [
  { label: "1 day",   days: 1  },
  { label: "2 days",  days: 2  },
  { label: "3 days",  days: 3  },
  { label: "1 week",  days: 7  },
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
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface NeedsMoreTimeResult {
  taskId: string;
  assignees: string[];
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
  const router = useRouter();
  const [note, setNote]         = useState("");
  const [days, setDays]         = useState<number>(2);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [staffList, setStaffList] = useState<StaffLite[]>([]);

  useEffect(() => {
    if (open) {
      setNote("");
      setDays(2);
      setAssignees(lead?.assignedTo ? [lead.assignedTo] : []);
      fetch("/api/staff")
        .then((r) => r.json())
        .then((res) => setStaffList(res.data ?? []))
        .catch(() => {});
    }
  }, [open, lead?.assignedTo]);

  const dueIso = useMemo(() => addDays(days), [days]);

  function submit() {
    if (!lead) return;
    const taskId = nextNmtTaskId();
    const title = `Follow up — ${lead.guardian} · ${lead.childName} · ${currentStage}`;
    const description =
      note.trim().length > 0
        ? note.trim()
        : `Parent needs more time at ${currentStage}. Follow up with ${lead.guardian}.`;
    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: taskId,
        title,
        type: "Admin",
        priority: "Medium",
        status: "Open",
        assignees,
        dueDateIso: dueIso,
        linkedRecord: null,
        description,
        subtasks: [],
        sourceLeadId: lead.id,
        sourceLeadName: lead.childName,
      }),
    }).catch(() => {});
    const dueShort = shortDate(dueIso);
    toast.success(`Follow-up task created · due ${dueShort}`, {
      action: {
        label: "View task",
        onClick: () => router.push(`/tasks?taskId=${taskId}`),
      },
    });
    onCreated({ taskId, assignees, dueLabel: dueShort, note: description });
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
                <option key={o.days} value={o.days}>{o.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Due {shortDate(dueIso)}</p>
          </div>

          <div>
            <FieldLabel>
              Assign to
              {assignees.length > 1 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 normal-case tracking-normal">
                  {assignees.length} people
                </span>
              )}
            </FieldLabel>
            <AssigneePicker
              assignees={assignees}
              onChange={setAssignees}
              staffList={staffList}
              placeholder="Select staff…"
            />
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
