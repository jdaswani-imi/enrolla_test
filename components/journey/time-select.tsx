"use client";

import { cn } from "@/lib/utils";

const HOURS = ["08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"];
const MINUTES = ["00", "15", "30", "45"];

function split(value: string): { h: string; m: string } {
  if (!value || !/^\d{1,2}:\d{2}$/.test(value)) return { h: "", m: "" };
  const [h, m] = value.split(":");
  return { h: h.padStart(2, "0"), m };
}

export function TimeSelect({
  value,
  onChange,
  disabled,
  className,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const { h, m } = split(value);
  const selectClass = cn(
    "w-16 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 cursor-pointer appearance-none",
    disabled && "bg-slate-50 text-slate-400 cursor-not-allowed",
  );

  function setHour(nextH: string) {
    onChange(`${nextH}:${m || "00"}`);
  }
  function setMinute(nextM: string) {
    onChange(`${h || "10"}:${nextM}`);
  }

  return (
    <div className={cn("inline-flex items-center gap-1", className)} aria-label={ariaLabel}>
      <select
        value={h}
        onChange={(e) => setHour(e.target.value)}
        disabled={disabled}
        className={selectClass}
        aria-label="Hour"
      >
        {!h && <option value="">HH</option>}
        {HOURS.map((hr) => (
          <option key={hr} value={hr}>
            {hr}
          </option>
        ))}
      </select>
      <span className="text-slate-500 font-semibold">:</span>
      <select
        value={m}
        onChange={(e) => setMinute(e.target.value)}
        disabled={disabled}
        className={selectClass}
        aria-label="Minute"
      >
        {!m && <option value="">MM</option>}
        {MINUTES.map((mm) => (
          <option key={mm} value={mm}>
            {mm}
          </option>
        ))}
      </select>
    </div>
  );
}
