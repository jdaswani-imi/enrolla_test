"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, CalendarClock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FIELD, FieldLabel, FormActions, SummaryRow } from "@/components/journey/dialog-parts";
import { cn } from "@/lib/utils";
import type { Trial, TrialOutcome } from "@/lib/mock-data";

type LogOutcomePill = "Converted" | "No Show" | "Needs More Time" | "Not Interested";

const OUTCOME_PILLS: LogOutcomePill[] = [
  "Converted",
  "No Show",
  "Needs More Time",
  "Not Interested",
];

// ─── Log Outcome ──────────────────────────────────────────────────────────────

export function LogTrialOutcomeDialog({
  trial,
  open,
  onOpenChange,
  onSave,
}: {
  trial: Trial | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (patch: { outcome: TrialOutcome; notes: string; followUpDate?: string }) => void;
}) {
  const [outcome, setOutcome] = useState<LogOutcomePill>("Converted");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState("");

  if (!trial) return null;

  const notesMissing = notes.trim().length === 0;
  const followUpMissing = outcome === "Needs More Time" && !followUp;
  const canSubmit = !notesMissing && !followUpMissing;

  function submit() {
    if (!canSubmit) return;
    onSave({
      outcome,
      notes: notes.trim(),
      followUpDate: outcome === "Needs More Time" ? followUp : undefined,
    });
    if (outcome === "Converted") {
      toast.success("Trial outcome logged — move to active enrolment and issue an invoice");
    } else if (outcome === "Needs More Time") {
      toast.success(`Follow-up scheduled for ${followUp}`);
    } else {
      toast.success(`Trial outcome logged: ${outcome}`);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Log Trial Outcome</DialogTitle>
          <DialogDescription>
            {trial.student} · {trial.subject} · {trial.trialDate}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div>
            <FieldLabel required>Outcome</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {OUTCOME_PILLS.map((o) => {
                const active = outcome === o;
                return (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOutcome(o)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full border transition-colors cursor-pointer",
                      active
                        ? "bg-amber-500 border-amber-500 text-white"
                        : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
          </div>

          {outcome === "Converted" && (
            <div className="flex gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <span>
                This will move the student to active enrolment. An invoice will need to be issued from
                the student profile.
              </span>
            </div>
          )}

          {outcome === "Needs More Time" && (
            <div>
              <FieldLabel htmlFor="lt-followup" required>Schedule follow-up</FieldLabel>
              <div className="relative">
                <CalendarClock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="lt-followup"
                  type="date"
                  value={followUp}
                  onChange={(e) => setFollowUp(e.target.value)}
                  className={cn(FIELD, "pl-9")}
                />
              </div>
            </div>
          )}

          <div>
            <FieldLabel htmlFor="lt-notes" required>Notes</FieldLabel>
            <textarea
              id="lt-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summary of the trial and next steps…"
              className={FIELD}
            />
          </div>
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Log outcome"
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Convert to Enrolment ─────────────────────────────────────────────────────

export function ConvertTrialDialog({
  trial,
  open,
  onOpenChange,
  onConfirm,
}: {
  trial: Trial | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
}) {
  if (!trial) return null;

  const tier = "Standard · Term — 20 sessions";

  function submit() {
    onConfirm();
    toast.success("Trial converted — issue an invoice from the student profile");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[480px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Convert to enrolment?</DialogTitle>
          <DialogDescription>
            Are you sure you want to convert this trial to a full enrolment?
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-2.5">
          <SummaryRow label="Student" value={trial.student} strong />
          <SummaryRow label="Subject" value={trial.subject} />
          <SummaryRow label="Tier" value={tier} />
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Convert to enrolment"
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Cancel Trial ─────────────────────────────────────────────────────────────

export function CancelTrialDialog({
  trial,
  open,
  onOpenChange,
  onConfirm,
}: {
  trial: Trial | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  if (!trial) return null;
  const t = trial;

  const canSubmit = reason.trim().length > 0;

  function submit() {
    if (!canSubmit) return;
    onConfirm(reason.trim());
    toast.success(`${t.student} trial cancelled`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[480px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle className="text-red-700">Cancel trial?</DialogTitle>
          <DialogDescription>
            Cancel {trial.student}&apos;s {trial.subject} trial on {trial.trialDate}. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div>
            <FieldLabel htmlFor="ct-reason" required>Cancellation reason</FieldLabel>
            <textarea
              id="ct-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this trial being cancelled?"
              className={FIELD}
            />
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 p-4 rounded-b-xl flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Keep trial
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cn(
              "rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer",
              canSubmit ? "hover:bg-red-700" : "opacity-50 cursor-not-allowed"
            )}
          >
            Cancel trial
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
