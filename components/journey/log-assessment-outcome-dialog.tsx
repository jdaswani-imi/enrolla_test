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
import { useJourney, BILAL_LEAD_ID } from "@/lib/journey-store";
import { useAssessments } from "@/lib/assessment-store";
import { tasks as taskStore, type Lead, type TaskStatus } from "@/lib/mock-data";
import { FIELD, FieldLabel, FormActions } from "./dialog-parts";

const RECOMMENDATIONS = [
  "Enrol — same level",
  "Enrol — higher level",
  "Enrol — lower level",
  "Do not enrol",
  "Further assessment needed",
];

export function LogAssessmentOutcomeDialog({
  open,
  onOpenChange,
  lead,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead?: Lead | null;
}) {
  const { logAssessmentOutcome, revertAssessmentOutcome } = useJourney();
  const { assessments, markDone: markAssessmentDone } = useAssessments();
  const [recommendation, setRecommendation] = useState(RECOMMENDATIONS[0]);
  const [observedLevel, setObservedLevel] = useState("Strong Y7 — approaching Y8");
  const [targetGrade, setTargetGrade] = useState("A");
  const [notes, setNotes] = useState("");
  const [sharedWithParent, setSharedWithParent] = useState(false);

  useEffect(() => {
    if (open) {
      setRecommendation(RECOMMENDATIONS[0]);
      setObservedLevel("Strong Y7 — approaching Y8");
      setTargetGrade("A");
      setNotes("");
      setSharedWithParent(false);
    }
  }, [open]);

  const canSubmit = Boolean(recommendation && observedLevel && targetGrade);

  function submit() {
    if (!canSubmit) return;
    const leadId = lead?.id ?? BILAL_LEAD_ID;

    logAssessmentOutcome({ recommendation, observedLevel, targetGrade, notes });

    // Mark related assessment records as Done
    const affectedAssessmentIds: string[] = [];
    for (const a of assessments) {
      if (a.leadId === leadId && a.status === "Booked") {
        markAssessmentDone(a.id);
        affectedAssessmentIds.push(a.id);
      }
    }

    // Mark auto-created teacher tasks as Done
    const previousTaskStatuses: { id: string; status: TaskStatus }[] = [];
    for (const t of taskStore) {
      if (
        t.sourceLeadId === leadId &&
        t.title.startsWith("Log assessment outcome —") &&
        t.status !== "Done"
      ) {
        previousTaskStatuses.push({ id: t.id, status: t.status });
        t.status = "Done";
      }
    }

    toast.success(`Assessment outcome logged — ${recommendation}`, {
      action: {
        label: "Undo",
        onClick: () => {
          revertAssessmentOutcome();
          for (const { id, status } of previousTaskStatuses) {
            const t = taskStore.find((x) => x.id === id);
            if (t) t.status = status;
          }
        },
      },
    });

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Log assessment outcome</DialogTitle>
          <DialogDescription>Complete after the assessment session.</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div>
            <FieldLabel htmlFor="lo-rec" required>Recommendation</FieldLabel>
            <select
              id="lo-rec"
              className={FIELD}
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
            >
              {RECOMMENDATIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="lo-level">Observed level</FieldLabel>
              <input
                id="lo-level"
                className={FIELD}
                value={observedLevel}
                onChange={(e) => setObservedLevel(e.target.value)}
                placeholder="e.g. Strong Y7 — approaching Y8"
              />
            </div>
            <div>
              <FieldLabel htmlFor="lo-grade">Target grade</FieldLabel>
              <input
                id="lo-grade"
                className={FIELD}
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                placeholder='e.g. "A" or "7"'
              />
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="lo-notes">Notes</FieldLabel>
            <textarea
              id="lo-notes"
              rows={4}
              className={FIELD}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sharedWithParent}
              onChange={(e) => setSharedWithParent(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
            />
            <span className="text-sm text-slate-700">Mark as shared with parent</span>
          </label>
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
