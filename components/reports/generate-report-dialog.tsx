"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ReportTypeOption = "Attendance" | "Finance" | "Academic" | "Churn" | "Staff CPD";
export type DepartmentOption = "All" | "Primary" | "Lower Secondary" | "Senior";
export type FormatOption = "PDF" | "Excel" | "CSV";
export type SectionOption = "Summary" | "Detailed breakdown" | "Charts" | "Comparison vs last term";

const REPORT_TYPES: ReportTypeOption[] = ["Attendance", "Finance", "Academic", "Churn", "Staff CPD"];
const DEPARTMENTS: DepartmentOption[] = ["All", "Primary", "Lower Secondary", "Senior"];
const FORMATS: FormatOption[] = ["PDF", "Excel", "CSV"];
const SECTIONS: SectionOption[] = ["Summary", "Detailed breakdown", "Charts", "Comparison vs last term"];

const CURRENT_TERM_FROM = "2026-01-12";
const CURRENT_TERM_TO = "2026-04-03";
const CURRENT_TERM_LABEL = "Spring Term 2026";

export interface GeneratedReportInput {
  type: ReportTypeOption;
  department: DepartmentOption;
  from: string;
  to: string;
  format: FormatOption;
  sections: SectionOption[];
  name: string;
}

function formatDateShort(iso: string): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function defaultReportName(type: ReportTypeOption, from: string, to: string): string {
  if (from === CURRENT_TERM_FROM && to === CURRENT_TERM_TO) {
    return `${type} Report — ${CURRENT_TERM_LABEL}`;
  }
  return `${type} Report — ${formatDateShort(from)} to ${formatDateShort(to)}`;
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer",
            value === opt
              ? "bg-[#0F172A] text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800",
            disabled && "opacity-60 cursor-not-allowed",
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function GenerateReportDialog({
  open,
  onOpenChange,
  onGenerate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (input: GeneratedReportInput) => void;
}) {
  const [type, setType] = useState<ReportTypeOption>("Attendance");
  const [department, setDepartment] = useState<DepartmentOption>("All");
  const [from, setFrom] = useState(CURRENT_TERM_FROM);
  const [to, setTo] = useState(CURRENT_TERM_TO);
  const [format, setFormat] = useState<FormatOption>("PDF");
  const [sections, setSections] = useState<SectionOption[]>([...SECTIONS]);
  const [customName, setCustomName] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const name = customName ?? defaultReportName(type, from, to);

  const resetForm = () => {
    setType("Attendance");
    setDepartment("All");
    setFrom(CURRENT_TERM_FROM);
    setTo(CURRENT_TERM_TO);
    setFormat("PDF");
    setSections([...SECTIONS]);
    setCustomName(null);
    setGenerating(false);
  };

  const toggleSection = (s: SectionOption) => {
    setSections((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const handleSubmit = () => {
    if (generating) return;
    setGenerating(true);
    setTimeout(() => {
      const trimmed = name.trim() || defaultReportName(type, from, to);
      onGenerate({ type, department, from, to, format, sections, name: trimmed });
      toast.success("Report generated — available in Reports Inbox");
      onOpenChange(false);
      resetForm();
    }, 1500);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (generating) return;
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Generate Report</DialogTitle>
          <DialogDescription>
            Configure your report — it will be added to your Reports Inbox.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Report type</p>
            <PillGroup options={REPORT_TYPES} value={type} onChange={setType} disabled={generating} />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Department</p>
            <PillGroup options={DEPARTMENTS} value={department} onChange={setDepartment} disabled={generating} />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Date range</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="report-from" className="block text-[11px] text-slate-500 mb-1">From</label>
                <input
                  id="report-from"
                  type="date"
                  value={from}
                  disabled={generating}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
              <div>
                <label htmlFor="report-to" className="block text-[11px] text-slate-500 mb-1">To</label>
                <input
                  id="report-to"
                  type="date"
                  value={to}
                  disabled={generating}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Format</p>
            <PillGroup options={FORMATS} value={format} onChange={setFormat} disabled={generating} />
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-600 mb-2">Include sections</p>
            <div className="grid grid-cols-2 gap-2">
              {SECTIONS.map((s) => {
                const checked = sections.includes(s);
                return (
                  <label
                    key={s}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-slate-700 transition-colors",
                      checked ? "border-amber-300 bg-amber-50/60" : "border-slate-200 hover:bg-slate-50",
                      generating ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={generating}
                      onChange={() => toggleSection(s)}
                      className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    {s}
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="report-name" className="block text-xs font-semibold text-slate-600 mb-2">
              Report name
            </label>
            <input
              id="report-name"
              type="text"
              value={name}
              disabled={generating}
              onChange={(e) => {
                setCustomName(e.target.value);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 disabled:bg-slate-50 disabled:text-slate-400"
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={generating}
            className={cn(
              "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors cursor-pointer",
              generating ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50",
            )}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={generating}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer min-w-[130px]",
              generating ? "opacity-90 cursor-not-allowed" : "hover:bg-amber-600",
            )}
          >
            {generating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {generating ? "Generating…" : "Generate"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
