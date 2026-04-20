"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useJourney, formatDate } from "@/lib/journey-store";
import type { Lead } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { FIELD, FieldLabel, FormActions } from "./dialog-parts";
import { WhatsAppBlock } from "./whatsapp-block";

const METHODS = [
  { id: "WhatsApp", label: "Parent confirmed via WhatsApp" },
  { id: "In person", label: "Parent confirmed in person" },
  { id: "Email", label: "Parent confirmed via Email" },
] as const;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function ScheduleConfirmDialog({
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
  const schedule = leadId ? journey.scheduleByLead[leadId] : undefined;

  const [method, setMethod] = useState<(typeof METHODS)[number]["id"]>("WhatsApp");
  const [date, setDate] = useState(todayIso());
  const [notes, setNotes] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMethod("WhatsApp");
    setDate(todayIso());
    setNotes("");
    setSent(false);
  }, [open]);

  const guardianFirstName = (lead?.guardian ?? "Tariq Mahmood").split(" ")[0];
  const childName = lead?.childName ?? "Bilal Mahmood";

  const message = useMemo(() => {
    if (!schedule?.rows?.length) return "";
    const lines = schedule.rows.map(
      (r) => `• ${r.subject} — ${r.days.join("/")} · ${r.time} · ${r.teacher} · ${r.sessionsPerWeek}×/week`,
    );
    return `Hi ${guardianFirstName}, thank you for confirming ${childName}'s schedule:

${lines.join("\n")}

We will now issue the term invoice. Thank you — Improve ME Institute.`;
  }, [schedule, guardianFirstName, childName]);

  function submit() {
    if (!leadId) return;
    journey.confirmSchedule(leadId, {
      confirmedVia: method,
      confirmedOn: date,
      notes: notes.trim() || undefined,
    });
    toast.success(`Schedule confirmed by parent via ${method}`);
    onCommit?.();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Confirm schedule</DialogTitle>
          <DialogDescription>Record the guardian&apos;s confirmation of the proposed schedule.</DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {/* Read-only summary */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">Proposed schedule</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 divide-y divide-slate-200">
              {schedule?.rows?.length ? (
                schedule.rows.map((r) => (
                  <div key={r.id} className="px-3 py-2 text-sm flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-800">{r.subject}</span>
                    <span className="text-slate-600 text-xs text-right">
                      {r.days.join("/")} · {r.time} · {r.teacher} · {r.sessionsPerWeek}×/wk
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-slate-400">
                  No schedule on file. Propose one first.
                </div>
              )}
            </div>
          </div>

          {/* Confirmation method */}
          <div>
            <FieldLabel required>Confirmation method</FieldLabel>
            <div className="space-y-1.5">
              {METHODS.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors",
                    method === m.id
                      ? "border-amber-400 bg-amber-50 text-amber-800"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  )}
                >
                  <input
                    type="radio"
                    name="confirm-method"
                    value={m.id}
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                    className="accent-amber-500 cursor-pointer"
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="sc-date" required>Date of confirmation</FieldLabel>
              <input
                id="sc-date"
                type="date"
                className={FIELD}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel htmlFor="sc-notes">Notes</FieldLabel>
              <input
                id="sc-notes"
                className={FIELD}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>

          {schedule?.rows?.length ? (
            <WhatsAppBlock message={message} sent={sent} onSentChange={setSent} />
          ) : null}

          <p className="text-xs text-slate-500">
            Confirmation will be logged for {formatDate(date)}.
          </p>
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Mark as Confirmed"
          submitDisabled={!schedule?.rows?.length}
        />
      </DialogContent>
    </Dialog>
  );
}
