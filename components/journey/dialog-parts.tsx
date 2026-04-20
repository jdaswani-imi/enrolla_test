"use client";

import { cn } from "@/lib/utils";
import { DialogFooter } from "@/components/ui/dialog";

export const FIELD =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";

export function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-xs font-semibold text-slate-600 block mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

export function FormActions({
  onCancel,
  onSubmit,
  submitLabel = "Confirm",
  submitDisabled,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}) {
  return (
    <DialogFooter className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitDisabled}
        className={cn(
          "rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer",
          submitDisabled ? "opacity-50 cursor-not-allowed" : "hover:bg-amber-600",
        )}
      >
        {submitLabel}
      </button>
    </DialogFooter>
  );
}

export function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={cn(strong ? "text-slate-900 font-bold" : "text-slate-800 font-medium")}>{value}</span>
    </div>
  );
}
