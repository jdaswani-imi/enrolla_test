"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { LeadStage } from "@/lib/mock-data";
import { FormActions } from "./dialog-parts";

export const PIPELINE_STAGES: LeadStage[] = [
  "New",
  "Contacted",
  "Assessment Booked",
  "Assessment Done",
  "Trial Booked",
  "Trial Done",
  "Schedule Offered",
  "Schedule Confirmed",
  "Invoice Sent",
  "Won",
];

const TRIAL_STAGES: ReadonlySet<LeadStage> = new Set(["Trial Booked", "Trial Done"]);
const TERMINAL_STAGES: ReadonlySet<LeadStage> = new Set(["Won"]);

export function skippedStagesBetween(current: LeadStage, target: LeadStage): LeadStage[] {
  const ci = PIPELINE_STAGES.indexOf(current);
  const ti = PIPELINE_STAGES.indexOf(target);
  if (ci < 0 || ti < 0 || ti <= ci + 1) return [];
  return PIPELINE_STAGES.slice(ci + 1, ti);
}

export function shouldWarnSkip(current: LeadStage, target: LeadStage): boolean {
  if (TERMINAL_STAGES.has(target)) return false;
  const ci = PIPELINE_STAGES.indexOf(current);
  const ti = PIPELINE_STAGES.indexOf(target);
  if (ci < 0 || ti < 0) return false;
  if (ti <= ci) return false;
  if (ti - ci < 2) return false;
  const skipped = PIPELINE_STAGES.slice(ci + 1, ti);
  return skipped.some((s) => !TRIAL_STAGES.has(s));
}

export function SkipWarningDialog({
  open,
  onOpenChange,
  currentStage,
  targetStage,
  onContinue,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  currentStage: LeadStage | null;
  targetStage: LeadStage | null;
  onContinue: () => void;
}) {
  const skipped =
    currentStage && targetStage ? skippedStagesBetween(currentStage, targetStage) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[520px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Skipping pipeline stages</DialogTitle>
          <DialogDescription>Confirm you want to skip ahead in the funnel.</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed">
            You&apos;re moving from{" "}
            <span className="font-semibold text-slate-900">{currentStage ?? "—"}</span> to{" "}
            <span className="font-semibold text-slate-900">{targetStage ?? "—"}</span>, skipping{" "}
            {skipped.length > 0 ? (
              <>
                {skipped.map((s, i) => (
                  <span key={s}>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                      {s}
                    </span>
                    {i < skipped.length - 1 ? " " : ""}
                  </span>
                ))}
                .
              </>
            ) : (
              "no stages."
            )}{" "}
            This is allowed but may mean steps were completed outside the system.
          </p>
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={onContinue}
          submitLabel="Continue anyway"
        />
      </DialogContent>
    </Dialog>
  );
}
