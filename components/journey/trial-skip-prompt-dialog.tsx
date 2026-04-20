"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function TrialSkipPromptDialog({
  open,
  onOpenChange,
  onBookTrialFirst,
  onSkipToScheduling,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onBookTrialFirst: (suppress: boolean) => void;
  onSkipToScheduling: (suppress: boolean) => void;
}) {
  const [suppress, setSuppress] = useState(false);

  useEffect(() => {
    if (open) setSuppress(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[560px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Skip straight to scheduling?</DialogTitle>
          <DialogDescription>
            Decide whether to book a trial session first or go straight to proposing a schedule.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed">
            No trial class has been booked for this lead. Would you like to book a trial session
            before proposing a schedule, or proceed directly to scheduling?
          </p>

          <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
            <span
              role="checkbox"
              aria-checked={suppress}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  setSuppress((s) => !s);
                }
              }}
              onClick={() => setSuppress((s) => !s)}
              className={cn(
                "inline-flex h-4 w-4 items-center justify-center rounded border transition-colors",
                suppress
                  ? "bg-amber-500 border-amber-500 text-white"
                  : "bg-white border-slate-300 hover:border-slate-400",
              )}
            >
              {suppress && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <input
              type="checkbox"
              className="sr-only"
              checked={suppress}
              onChange={(e) => setSuppress(e.target.checked)}
            />
            <span className="text-sm text-slate-600">
              Don&apos;t show this again for this lead
            </span>
          </label>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onBookTrialFirst(suppress)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Book a Trial First
          </button>
          <button
            type="button"
            onClick={() => onSkipToScheduling(suppress)}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Skip to Scheduling
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
