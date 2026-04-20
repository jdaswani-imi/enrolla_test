"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useJourney } from "@/lib/journey-store";
import { FIELD, FieldLabel, FormActions } from "./dialog-parts";

const OUTCOMES = [
  "Recommended for enrolment",
  "Not recommended",
  "Parent to decide",
];

export function LogTrialOutcomeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const { logTrialOutcome } = useJourney();
  const [outcome, setOutcome] = useState(OUTCOMES[0]);
  const [notes, setNotes] = useState("");
  const [paid, setPaid] = useState(true);

  useEffect(() => {
    if (open) {
      setOutcome(OUTCOMES[0]);
      setNotes("");
      setPaid(true);
    }
  }, [open]);

  function submit() {
    logTrialOutcome({ outcome, notes, paid });
    toast.success("Trial outcome logged");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Log Trial Outcome</DialogTitle>
          <DialogDescription>Record the teacher&apos;s recommendation after the trial.</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div>
            <FieldLabel htmlFor="lt-outcome" required>Outcome</FieldLabel>
            <select id="lt-outcome" className={FIELD} value={outcome} onChange={(e) => setOutcome(e.target.value)}>
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel htmlFor="lt-notes">Notes</FieldLabel>
            <textarea id="lt-notes" rows={4} className={FIELD} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={paid}
              onChange={(e) => setPaid(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
            />
            Trial invoice marked as paid
          </label>
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Log trial outcome"
        />
      </DialogContent>
    </Dialog>
  );
}
