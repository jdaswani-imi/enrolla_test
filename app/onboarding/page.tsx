"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  GitBranch,
  Layers,
  Receipt,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Plus,
  Trash2,
  ArrowRight,
  Check,
  X,
  DoorOpen,
  BookOpen,
  Plug,
  FileText,
  Upload,
  Menu,
  ShieldCheck,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const YEAR_GROUPS = [
  "FS1","FS2","Y1","Y2","Y3","Y4","Y5","Y6","Y7","Y8","Y9","Y10","Y11","Y12","Y13",
] as const;

const DEPT_COLOURS = [
  { hex: "#F97316", label: "Orange" },
  { hex: "#3B82F6", label: "Blue" },
  { hex: "#8B5CF6", label: "Purple" },
  { hex: "#22C55E", label: "Green" },
  { hex: "#EF4444", label: "Red" },
  { hex: "#EAB308", label: "Yellow" },
  { hex: "#EC4899", label: "Pink" },
  { hex: "#64748B", label: "Grey" },
];

const INTEGRATIONS_LIST = [
  { name: "Google Classroom", abbr: "GC", color: "bg-blue-100 text-blue-700",   desc: "Sync assignments and grades" },
  { name: "WhatsApp",         abbr: "WA", color: "bg-green-100 text-green-700", desc: "Parent & student notifications" },
  { name: "Zoom",             abbr: "Zm", color: "bg-sky-100 text-sky-700",     desc: "Virtual session management" },
  { name: "Stripe",           abbr: "St", color: "bg-purple-100 text-purple-700", desc: "Payment processing" },
  { name: "Xero",             abbr: "Xe", color: "bg-teal-100 text-teal-700",   desc: "Accounting & invoicing sync" },
  { name: "Microsoft Teams",  abbr: "MT", color: "bg-indigo-100 text-indigo-700", desc: "Communication & sessions" },
];

function ygIndex(yg: string) {
  return YEAR_GROUPS.indexOf(yg as (typeof YEAR_GROUPS)[number]);
}

// ─── Format string utilities ──────────────────────────────────────────────────

const FORMAT_TOKENS = ["{YEAR}", "{SEQ}", "{MONTH}"] as const;

function previewFormatString(fmt: string, type: "student" | "invoice"): string {
  if (!fmt.trim()) return "";
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = type === "invoice" ? "00001" : "001";
  return fmt
    .replace(/\{YEAR\}/g, year)
    .replace(/\{MONTH\}/g, month)
    .replace(/\{SEQ\}/g, seq);
}

function validateFormatString(fmt: string): string {
  if (!fmt.trim()) return "";
  const tokens = fmt.match(/\{[^}]+\}/g) ?? [];
  const unknown = tokens.filter((t) => !(FORMAT_TOKENS as readonly string[]).includes(t));
  if (unknown.length > 0)
    return `Unknown token${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}`;
  return "";
}

function FormatField({
  label, value, onChange, placeholder, type, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; type: "student" | "invoice"; hint?: string;
}) {
  const preview = previewFormatString(value, type);
  const warning = validateFormatString(value);

  function insertToken(token: string) {
    onChange(value + token);
  }

  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all font-mono"
      />
      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
        <span className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold shrink-0">Insert:</span>
        {FORMAT_TOKENS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => insertToken(t)}
            className="px-2 py-0.5 text-[11px] font-mono bg-slate-100 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded text-slate-600 hover:text-amber-700 transition-colors cursor-pointer"
          >
            {t}
          </button>
        ))}
      </div>
      {warning ? (
        <p className="text-xs text-orange-600 mt-1.5 flex items-center gap-1">
          <span className="font-bold">⚠</span> {warning}
        </p>
      ) : preview ? (
        <p className="text-xs text-slate-500 mt-1.5">
          Preview:{" "}
          <code className="font-mono text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-[11px]">
            {preview}
          </code>
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-400 mt-1">{hint}</p>
      ) : null}
    </div>
  );
}

// ─── Day-of-week multi-select ─────────────────────────────────────────────────

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

function DaySelect({
  value, onChange,
}: {
  value: string; onChange: (v: string) => void;
}) {
  const selected = value ? value.split(",").map((d) => d.trim()).filter(Boolean) : [];
  function toggle(day: string) {
    const next = selected.includes(day)
      ? selected.filter((d) => d !== day)
      : [...selected, day];
    onChange(next.join(", "));
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {DAYS_OF_WEEK.map((day) => {
          const active = selected.includes(day);
          return (
            <button
              key={day}
              type="button"
              onClick={() => toggle(day)}
              className={cn(
                "px-3 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer select-none",
                active
                  ? "bg-slate-800 text-white border-slate-800"
                  : "bg-white text-slate-500 border-slate-200 hover:border-amber-400 hover:text-amber-700"
              )}
            >
              {day.slice(0, 3)}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-slate-400 mt-1.5">
          Closed: <span className="text-slate-600 font-medium">{selected.join(", ")}</span>
        </p>
      )}
    </div>
  );
}

// ─── Time picker ─────────────────────────────────────────────────────────────

const TIME_SLOTS: { value: string; label: string }[] = (() => {
  const slots: { value: string; label: string }[] = [];
  for (let h = 5; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
      const period = h >= 12 ? "PM" : "AM";
      const label = `${hour12}:${String(m).padStart(2, "0")} ${period}`;
      slots.push({ value, label });
    }
  }
  return slots;
})();

function TimeSelect({
  value, onChange, disabled = false,
}: {
  value: string; onChange: (v: string) => void; disabled?: boolean;
}) {
  return (
    <div className="relative">
      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all cursor-pointer appearance-none disabled:opacity-50"
      >
        {TIME_SLOTS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Compact time picker (no label, for table cells) ─────────────────────────

function TimeSelectRaw({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none z-10" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-7 pr-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-400 transition-all cursor-pointer appearance-none"
      >
        {TIME_SLOTS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Per-day schedule grid ────────────────────────────────────────────────────

type DayRowState = { open: boolean; start: string; end: string };
type ScheduleMap = Record<string, DayRowState>;

function parseScheduleMap(
  scheduleJson: string,
  closureDays: string,
  globalStart: string,
  globalEnd: string,
): ScheduleMap {
  const closed = new Set(
    closureDays ? closureDays.split(",").map((d) => d.trim()).filter(Boolean) : [],
  );
  let saved: Record<string, Partial<DayRowState>> = {};
  try { saved = JSON.parse(scheduleJson || "{}"); } catch {}
  return Object.fromEntries(
    DAYS_OF_WEEK.map((day) => [
      day,
      {
        open: saved[day]?.open !== undefined ? Boolean(saved[day].open) : !closed.has(day),
        start: (saved[day]?.start as string | undefined) || globalStart || "08:00",
        end:   (saved[day]?.end   as string | undefined) || globalEnd   || "18:00",
      },
    ]),
  ) as ScheduleMap;
}

function DayScheduleGrid({
  globalStart, globalEnd, closureDays, scheduleJson, onChange,
}: {
  globalStart: string; globalEnd: string; closureDays: string; scheduleJson: string;
  onChange: (u: { day_start_time: string; day_end_time: string; weekly_closure_days: string; day_schedules: string }) => void;
}) {
  const [schedule, setSchedule] = useState<ScheduleMap>(() =>
    parseScheduleMap(scheduleJson, closureDays, globalStart, globalEnd),
  );
  const [defStart, setDefStart] = useState(globalStart || "08:00");
  const [defEnd,   setDefEnd]   = useState(globalEnd   || "18:00");

  const initKey = useRef("");
  useEffect(() => {
    const key = scheduleJson + "|" + closureDays + "|" + globalStart + "|" + globalEnd;
    if (key !== initKey.current && (scheduleJson || closureDays || globalStart !== "08:00" || globalEnd !== "18:00")) {
      initKey.current = key;
      setSchedule(parseScheduleMap(scheduleJson, closureDays, globalStart, globalEnd));
      if (globalStart) setDefStart(globalStart);
      if (globalEnd)   setDefEnd(globalEnd);
    }
  }, [scheduleJson, closureDays, globalStart, globalEnd]);

  function emit(sched: ScheduleMap, ds: string, de: string) {
    onChange({
      day_start_time: ds,
      day_end_time: de,
      weekly_closure_days: DAYS_OF_WEEK.filter((d) => !sched[d].open).join(", "),
      day_schedules: JSON.stringify(sched),
    });
  }

  function toggleDay(day: string) {
    const next = { ...schedule, [day]: { ...schedule[day], open: !schedule[day].open } };
    setSchedule(next);
    emit(next, defStart, defEnd);
  }

  function setDayTime(day: string, field: "start" | "end", val: string) {
    const next = { ...schedule, [day]: { ...schedule[day], [field]: val } };
    setSchedule(next);
    emit(next, defStart, defEnd);
  }

  function updateDefault(field: "start" | "end", val: string) {
    const ns = field === "start" ? val : defStart;
    const ne = field === "end"   ? val : defEnd;
    if (field === "start") setDefStart(val); else setDefEnd(val);
    const oldDef = field === "start" ? defStart : defEnd;
    const next: ScheduleMap = {};
    for (const day of DAYS_OF_WEEK) {
      next[day] = {
        ...schedule[day],
        [field]: schedule[day].open && schedule[day][field] === oldDef ? val : schedule[day][field],
      };
    }
    setSchedule(next);
    emit(next, ns, ne);
  }

  function applyToAll() {
    const next: ScheduleMap = {};
    for (const day of DAYS_OF_WEEK) {
      next[day] = { ...schedule[day], start: defStart, end: defEnd };
    }
    setSchedule(next);
    emit(next, defStart, defEnd);
  }

  return (
    <div className="space-y-3">
      <Label>Daily Schedule</Label>

      <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <span className="text-xs text-slate-500 font-medium shrink-0">Default hours:</span>
        <div className="flex items-center gap-2 flex-1">
          <TimeSelectRaw value={defStart} onChange={(v) => updateDefault("start", v)} />
          <span className="text-xs text-slate-400 shrink-0">to</span>
          <TimeSelectRaw value={defEnd} onChange={(v) => updateDefault("end", v)} />
        </div>
        <button
          type="button"
          onClick={applyToAll}
          className="text-xs text-amber-600 hover:text-amber-700 font-medium whitespace-nowrap cursor-pointer shrink-0"
        >
          Apply to all
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Day</th>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Open From</th>
              <th className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Open Until</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DAYS_OF_WEEK.map((day) => {
              const row = schedule[day];
              return (
                <tr key={day} className={cn(!row.open ? "bg-slate-50/60" : "bg-white")}>
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-700 w-28">{day}</td>
                  <td className="px-4 py-2.5 w-28">
                    <button
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors cursor-pointer",
                        row.open
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200 hover:text-slate-600",
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", row.open ? "bg-emerald-500" : "bg-slate-300")} />
                      {row.open ? "Open" : "Closed"}
                    </button>
                  </td>
                  <td className="px-4 py-2">
                    {row.open
                      ? <TimeSelectRaw value={row.start} onChange={(v) => setDayTime(day, "start", v)} />
                      : <span className="text-xs text-slate-300 pl-1">—</span>}
                  </td>
                  <td className="px-4 py-2">
                    {row.open
                      ? <TimeSelectRaw value={row.end} onChange={(v) => setDayTime(day, "end", v)} />
                      : <span className="text-xs text-slate-300 pl-1">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEPS = [
  { id: "organisation", label: "Organisation",  description: "Core details & regional settings",  icon: Building2 },
  { id: "branches",     label: "Branches",      description: "Physical locations & campuses",     icon: GitBranch },
  { id: "rooms",        label: "Rooms",         description: "Teaching spaces per branch",        icon: DoorOpen,    optional: true },
  { id: "departments",  label: "Departments",   description: "Academic department structure",     icon: Layers },
  { id: "billing",      label: "Billing",       description: "Invoice & payment settings",        icon: Receipt,     optional: true },
  { id: "academic",     label: "Academic Year", description: "Current year & term structure",     icon: Calendar,    optional: true },
  { id: "subjects",     label: "Subjects",      description: "Subject catalogue setup",           icon: BookOpen,    optional: true },
  { id: "documents",    label: "Documents",     description: "T&Cs, policies & handbooks",       icon: ShieldCheck, optional: true },
  { id: "integrations", label: "Integrations",  description: "Phase 2 platform connections",      icon: Plug,        optional: true },
  { id: "complete",     label: "Complete",      description: "Setup summary",                     icon: CheckCircle2 },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

type OrgState = {
  org_name: string; legal_name: string; student_id_format: string;
  currency: string; timezone: string; default_language: string; start_day_of_week: string;
  day_start_time: string; day_end_time: string; weekly_closure_days: string; day_schedules: string;
};

type BranchRow = { id?: string; name: string; address: string; phone: string; _saved?: boolean };

type RoomRow = { id?: string; branchId: string; name: string; capacity: string; _saved?: boolean };

type DeptRow = { id?: string; name: string; yearGroupFrom: string; yearGroupTo: string; colour: string; _saved?: boolean };

type BillingState = {
  invoice_number_prefix: string; invoice_number_format: string;
  vat_rate: string; default_payment_terms: string;
  enrolment_fee: string; enrolment_fee_type: string; invoice_footer_text: string;
};

type TermRow = { id?: string; name: string; startDate: string; endDate: string };

type AcademicState = {
  id?: string;
  name: string; startDate: string; endDate: string;
  isCurrent: boolean; terms: TermRow[];
};

type SubjectRow = {
  id?: string;
  departmentId: string;
  departmentName: string;
  name: string;
  sessionDurationMins: number;
  price: string;
  isActive: boolean;
  _saved?: boolean;
};

type WizardFormData = {
  org: OrgState;
  branches: BranchRow[];
  rooms: RoomRow[];
  depts: DeptRow[];
  billing: BillingState;
  academic: AcademicState;
  subjects: SubjectRow[];
};

const DEFAULT_FORM: WizardFormData = {
  org: {
    org_name: "", legal_name: "", student_id_format: "",
    currency: "AED", timezone: "UTC+4 (Gulf Standard Time)",
    default_language: "English", start_day_of_week: "Monday",
    day_start_time: "08:00", day_end_time: "18:00", weekly_closure_days: "", day_schedules: "",
  },
  branches: [{ name: "", address: "", phone: "" }],
  rooms: [],
  depts: [{ name: "", yearGroupFrom: "FS1", yearGroupTo: "Y6", colour: DEPT_COLOURS[0].hex }],
  billing: {
    invoice_number_prefix: "", invoice_number_format: "",
    vat_rate: "", default_payment_terms: "",
    enrolment_fee: "", enrolment_fee_type: "Lifetime (charged once per student)",
    invoice_footer_text: "",
  },
  academic: { name: "", startDate: "", endDate: "", isCurrent: true, terms: [] },
  subjects: [],
};

type SummaryData = {
  orgName: string; branchCount: number; roomCount: number; deptCount: number;
  billingConfigured: boolean; academicYearConfigured: boolean;
  termCount: number; subjectCount: number;
};

// ─── Toggle switch ────────────────────────────────────────────────────────────

function ToggleSwitch({
  checked, onChange, label, sublabel,
}: {
  checked: boolean; onChange: (v: boolean) => void;
  label: string; sublabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 cursor-pointer group text-left w-full"
    >
      <span className={cn(
        "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out mt-0.5",
        checked ? "bg-amber-500" : "bg-slate-200"
      )}>
        <span className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm",
          "ring-0 transition-transform duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )} />
      </span>
      <span>
        <span className="block text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors leading-6">
          {label}
        </span>
        {sublabel && (
          <span className="block text-xs text-slate-400 mt-0.5">{sublabel}</span>
        )}
      </span>
    </button>
  );
}

// ─── Shared form primitives ───────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function Input({
  value, onChange, placeholder = "", type = "text", disabled = false, max,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean; max?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      max={max}
      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all disabled:opacity-50"
    />
  );
}

function WSelect({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all cursor-pointer appearance-none"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FieldGroup({ children, cols = 1 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  return (
    <div className={cn("grid gap-4", cols === 3 ? "grid-cols-3" : cols === 2 ? "grid-cols-2" : "grid-cols-1")}>
      {children}
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
      <X className="w-4 h-4 shrink-0" /> {msg}
    </div>
  );
}

function NavButtons({
  onBack, onNext, onSkip,
  nextLabel = "Next", saving = false,
}: {
  onBack?: () => void; onNext: () => void; onSkip?: () => void;
  nextLabel?: string; saving?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40"
          >
            Back
          </button>
        )}
        {onSkip && (
          <button onClick={onSkip} disabled={saving} className="text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            Skip for now
          </button>
        )}
      </div>
      <button
        onClick={onNext}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60"
      >
        {saving ? "Saving…" : nextLabel}
        {!saving && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── Step 1: Organisation ─────────────────────────────────────────────────────

function StepOrganisation({
  data, onChange, onNext,
}: {
  data: OrgState;
  onChange: (d: OrgState) => void;
  onNext: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (data.org_name) return;
    fetch("/api/settings/org").then((r) => r.json()).then((d) => {
      onChange({
        org_name:          d.org_name          || "",
        legal_name:        d.legal_name        || "",
        student_id_format: d.student_id_format || "",
        currency:          d.currency          || "AED",
        timezone:          d.timezone          || "UTC+4 (Gulf Standard Time)",
        default_language:  d.default_language  || "English",
        start_day_of_week: d.start_day_of_week || "Monday",
        day_start_time:      d.day_start_time      || "08:00",
        day_end_time:        d.day_end_time        || "18:00",
        weekly_closure_days: d.weekly_closure_days || "",
        day_schedules:       d.day_schedules ? (typeof d.day_schedules === "string" ? d.day_schedules : JSON.stringify(d.day_schedules)) : "",
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(k: keyof OrgState) {
    return (v: string) => { setErr(""); onChange({ ...data, [k]: v }); };
  }

  async function handleNext() {
    if (!data.org_name.trim()) { setErr("Organisation name is required"); return; }
    setSaving(true);
    await onNext();
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Tell us about your organisation</h2>
        <p className="text-sm text-slate-500 mt-1">This sets up your core platform identity and regional preferences.</p>
      </div>
      <div className="space-y-4">
        <FieldGroup cols={2}>
          <Field label="Organisation Name *">
            <Input value={data.org_name} onChange={set("org_name")} placeholder="Improve ME Institute" />
          </Field>
          <Field label="Legal Name">
            <Input value={data.legal_name} onChange={set("legal_name")} placeholder="Improve ME Institute LLC" />
          </Field>
        </FieldGroup>
        <FormatField
          label="Student ID Format"
          value={data.student_id_format}
          onChange={set("student_id_format")}
          placeholder="STU-{YEAR}-{SEQ}"
          type="student"
          hint="Leave blank to use auto-generated IDs"
        />
        <FieldGroup cols={2}>
          <Field label="Currency">
            <WSelect value={data.currency} onChange={set("currency")} options={["AED", "USD", "GBP", "EUR", "SAR"]} />
          </Field>
          <Field label="Timezone">
            <WSelect value={data.timezone} onChange={set("timezone")} options={["UTC+4 (Gulf Standard Time)", "UTC+0 (GMT)", "UTC+3 (AST)", "UTC+5:30 (IST)"]} />
          </Field>
          <Field label="Default Language">
            <WSelect value={data.default_language} onChange={set("default_language")} options={["English", "Arabic", "French"]} />
          </Field>
          <Field label="Start Day of Week">
            <WSelect value={data.start_day_of_week} onChange={set("start_day_of_week")} options={["Monday", "Sunday", "Saturday"]} />
          </Field>
        </FieldGroup>
        <DayScheduleGrid
          globalStart={data.day_start_time}
          globalEnd={data.day_end_time}
          closureDays={data.weekly_closure_days}
          scheduleJson={data.day_schedules}
          onChange={(u) => onChange({ ...data, ...u })}
        />
        {err && <ErrorBanner msg={err} />}
      </div>
      <NavButtons onNext={handleNext} saving={saving} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 2: Branches ─────────────────────────────────────────────────────────

function StepBranches({
  data, onChange, onNext, onBack,
}: {
  data: BranchRow[];
  onChange: (d: BranchRow[]) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const hasContent = data.some((b) => b.name || b.id);
    if (hasContent) return;
    fetch("/api/settings/branches").then((r) => r.json()).then((res: BranchRow[]) => {
      if (Array.isArray(res) && res.length > 0) {
        onChange(res.map((b) => ({ id: b.id, name: b.name ?? "", address: b.address ?? "", phone: b.phone ?? "", _saved: true })));
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(idx: number, field: keyof BranchRow, val: string) {
    setErr("");
    onChange(data.map((b, i) => i === idx ? { ...b, [field]: val, _saved: false } : b));
  }

  function addRow() { onChange([...data, { name: "", address: "", phone: "" }]); }
  function removeRow(idx: number) { if (data.length === 1) return; onChange(data.filter((_, i) => i !== idx)); }

  async function handleNext() {
    const filled = data.filter((b) => b.name.trim());
    if (filled.length === 0) { setErr("Add at least one branch"); return; }
    setSaving(true);
    await onNext();
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Add your branches</h2>
        <p className="text-sm text-slate-500 mt-1">Branches are your physical teaching locations. Add all campuses you operate from.</p>
      </div>
      <div className="space-y-3">
        {data.map((b, idx) => (
          <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Branch {idx + 1} {b._saved && <span className="text-emerald-500">✓ saved</span>}
              </span>
              {data.length > 1 && (
                <button onClick={() => removeRow(idx)} className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Branch Name *">
                  <Input value={b.name} onChange={(v) => setField(idx, "name", v)} placeholder="Main Branch" />
                </Field>
              </div>
              <Field label="Address">
                <Input value={b.address} onChange={(v) => setField(idx, "address", v)} placeholder="Dubai, UAE" />
              </Field>
              <Field label="Phone">
                <Input value={b.phone} onChange={(v) => setField(idx, "phone", v)} placeholder="+971 4 000 0000" />
              </Field>
            </div>
          </div>
        ))}
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2.5 w-full border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add another branch
        </button>
        {err && <ErrorBanner msg={err} />}
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} saving={saving} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 3: Rooms ────────────────────────────────────────────────────────────

function StepRooms({
  data, onChange, onNext, onBack, onSkip, branches,
}: {
  data: RoomRow[];
  onChange: (d: RoomRow[]) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
  branches: BranchRow[];
}) {
  const [saving, setSaving] = useState(false);

  const savedBranches = branches.filter((b) => b.id);

  useEffect(() => {
    if (data.length > 0) return;
    fetch("/api/settings/rooms").then((r) => r.json()).then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        onChange(res.map((r: { id: string; branch_id: string; name: string; capacity?: number }) => ({
          id: r.id,
          branchId: r.branch_id ?? "",
          name: r.name ?? "",
          capacity: r.capacity != null ? String(r.capacity) : "",
          _saved: true,
        })));
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function roomsForBranch(branchId: string) {
    return data.filter((r) => r.branchId === branchId);
  }

  function addRoom(branchId: string) {
    onChange([...data, { branchId, name: "", capacity: "" }]);
  }

  function removeRoom(branchId: string, localIdx: number) {
    const branchRooms = roomsForBranch(branchId);
    const target = branchRooms[localIdx];
    onChange(data.filter((r) => r !== target));
  }

  function setRoomField(branchId: string, localIdx: number, field: "name" | "capacity", val: string) {
    const branchRooms = roomsForBranch(branchId);
    const target = branchRooms[localIdx];
    onChange(data.map((r) => r === target ? { ...r, [field]: val, _saved: false } : r));
  }

  async function handleNext() {
    setSaving(true);
    await onNext();
    setSaving(false);
  }

  if (savedBranches.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Add rooms to your branches</h2>
          <p className="text-sm text-slate-500 mt-1">Go back and save at least one branch first, then you can add rooms.</p>
        </div>
        <NavButtons onBack={onBack} onNext={onSkip} nextLabel="Skip for now" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Add rooms to your branches</h2>
        <p className="text-sm text-slate-500 mt-1">Define the teaching spaces at each branch. You can add more rooms later in Settings → Rooms.</p>
      </div>

      <div className="space-y-4">
        {savedBranches.map((branch) => {
          const branchRooms = roomsForBranch(branch.id!);
          return (
            <div key={branch.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <DoorOpen className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-700">{branch.name}</span>
                <span className="ml-auto text-xs text-slate-400">{branchRooms.length} room{branchRooms.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="p-4 space-y-2">
                {branchRooms.length === 0 && (
                  <p className="text-xs text-slate-400 italic py-1">No rooms added yet — click below to add one.</p>
                )}
                {branchRooms.map((room, localIdx) => (
                  <div key={localIdx} className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        value={room.name}
                        onChange={(v) => setRoomField(branch.id!, localIdx, "name", v)}
                        placeholder="e.g. Room 101, Science Lab"
                      />
                      <Input
                        value={room.capacity}
                        onChange={(v) => setRoomField(branch.id!, localIdx, "capacity", v)}
                        placeholder="Capacity (e.g. 20)"
                        type="number"
                      />
                    </div>
                    <button
                      onClick={() => removeRoom(branch.id!, localIdx)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {room._saved && <span className="text-xs text-emerald-500 shrink-0">✓</span>}
                  </div>
                ))}
                <button
                  onClick={() => addRoom(branch.id!)}
                  className="flex items-center gap-1.5 mt-1 text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add room
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <NavButtons onBack={onBack} onNext={handleNext} onSkip={onSkip} saving={saving} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 4: Departments ──────────────────────────────────────────────────────

function StepDepartments({
  data, onChange, onNext, onBack,
}: {
  data: DeptRow[];
  onChange: (d: DeptRow[]) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const hasContent = data.some((d) => d.name || d.id);
    if (hasContent) return;
    fetch("/api/settings/departments").then((r) => r.json()).then((res: DeptRow[]) => {
      if (Array.isArray(res) && res.length > 0) {
        // Spread YEAR_GROUPS evenly across depts that have no saved range
        const total = YEAR_GROUPS.length;
        onChange(res.map((d, i) => {
          if (d.yearGroupFrom && d.yearGroupTo) {
            return { id: d.id, name: d.name ?? "", yearGroupFrom: d.yearGroupFrom, yearGroupTo: d.yearGroupTo, colour: d.colour ?? DEPT_COLOURS[i % DEPT_COLOURS.length].hex, _saved: true };
          }
          const chunkSize = Math.ceil(total / res.length);
          const from = YEAR_GROUPS[Math.min(i * chunkSize, total - 1)];
          const to = YEAR_GROUPS[Math.min((i + 1) * chunkSize - 1, total - 1)];
          return { id: d.id, name: d.name ?? "", yearGroupFrom: from, yearGroupTo: to, colour: d.colour ?? DEPT_COLOURS[i % DEPT_COLOURS.length].hex, _saved: false };
        }));
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(idx: number, field: keyof DeptRow, val: string) {
    setErr("");
    onChange(data.map((d, i) => {
      if (i !== idx) return d;
      const next = { ...d, [field]: val, _saved: false };
      if (field === "yearGroupFrom" && ygIndex(val) > ygIndex(next.yearGroupTo)) {
        next.yearGroupTo = val;
      }
      return next;
    }));
  }

  function addRow() {
    const colour = DEPT_COLOURS[data.length % DEPT_COLOURS.length].hex;
    onChange([...data, { name: "", yearGroupFrom: "FS1", yearGroupTo: "Y13", colour }]);
  }

  function removeRow(idx: number) {
    if (data.length === 1) return;
    onChange(data.filter((_, i) => i !== idx));
  }

  async function handleNext() {
    const filled = data.filter((d) => d.name.trim());
    if (filled.length === 0) { setErr("Add at least one department"); return; }

    // Check for overlapping year group ranges
    for (let i = 0; i < filled.length; i++) {
      for (let j = i + 1; j < filled.length; j++) {
        const a = filled[i], b = filled[j];
        const aFrom = ygIndex(a.yearGroupFrom), aTo = ygIndex(a.yearGroupTo);
        const bFrom = ygIndex(b.yearGroupFrom), bTo = ygIndex(b.yearGroupTo);
        if (aFrom <= bTo && bFrom <= aTo) {
          setErr(`"${a.name}" and "${b.name}" have overlapping year group ranges. Each year group can only belong to one department.`);
          return;
        }
      }
    }

    setSaving(true);
    await onNext();
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Set up your departments</h2>
        <p className="text-sm text-slate-500 mt-1">
          Departments group students by year range. Each year group maps to the department whose range covers it.
        </p>
      </div>
      <div className="space-y-3">
        {data.map((d, idx) => (
          <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.colour }} />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Department {idx + 1} {d._saved && <span className="text-emerald-500">✓ saved</span>}
                </span>
              </div>
              {data.length > 1 && (
                <button onClick={() => removeRow(idx)} className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Department Name *">
                  <Input value={d.name} onChange={(v) => setField(idx, "name", v)} placeholder="e.g. Primary, Secondary, Enrichment" />
                </Field>
              </div>
              <Field label="Year Groups From">
                <select
                  value={d.yearGroupFrom}
                  onChange={(e) => setField(idx, "yearGroupFrom", e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 cursor-pointer appearance-none"
                >
                  {YEAR_GROUPS.map((yg) => <option key={yg} value={yg}>{yg}</option>)}
                </select>
              </Field>
              <Field label="Year Groups To">
                <select
                  value={d.yearGroupTo}
                  onChange={(e) => setField(idx, "yearGroupTo", e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 cursor-pointer appearance-none"
                >
                  {YEAR_GROUPS.filter((yg) => ygIndex(yg) >= ygIndex(d.yearGroupFrom)).map((yg) => (
                    <option key={yg} value={yg}>{yg}</option>
                  ))}
                </select>
              </Field>
              <div className="col-span-2">
                <Label>Colour</Label>
                <div className="flex gap-2">
                  {DEPT_COLOURS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setField(idx, "colour", c.hex)}
                      title={c.label}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all cursor-pointer ring-offset-2",
                        d.colour === c.hex ? "ring-2 ring-slate-700 scale-110" : "hover:scale-105"
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2.5 w-full border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add another department
        </button>
        {err && <ErrorBanner msg={err} />}
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} saving={saving} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 5: Billing ──────────────────────────────────────────────────────────

function StepBilling({
  data, onChange, onNext, onBack, onSkip,
}: {
  data: BillingState;
  onChange: (d: BillingState) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const hasContent = Object.values(data).some((v) => v && v !== "Lifetime (charged once per student)");
    if (hasContent) return;
    fetch("/api/settings/org").then((r) => r.json()).then((d) => {
      onChange({
        invoice_number_prefix: d.invoice_number_prefix || "",
        invoice_number_format: d.invoice_number_format || "",
        vat_rate:              d.vat_rate              || "",
        default_payment_terms: d.default_payment_terms || "",
        enrolment_fee:         d.enrolment_fee         || "",
        enrolment_fee_type:    d.enrolment_fee_type    || "Lifetime (charged once per student)",
        invoice_footer_text:   d.invoice_footer_text   || "",
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(k: keyof BillingState) {
    return (v: string) => onChange({ ...data, [k]: v });
  }

  async function handleNext() {
    setSaving(true);
    await onNext();
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Billing &amp; Revenue</h2>
        <p className="text-sm text-slate-500 mt-1">Configure how invoices are numbered, VAT settings, and enrolment fee rules.</p>
      </div>
      <div className="space-y-4">
        <FieldGroup cols={2}>
          <div className="col-span-2">
            <FormatField
              label="Invoice Number Format"
              value={data.invoice_number_format}
              onChange={set("invoice_number_format")}
              placeholder="INV-{YEAR}-{SEQ}"
              type="invoice"
              hint="Defines how invoice numbers are generated"
            />
          </div>
          <Field label="VAT Rate (%)">
            <Input value={data.vat_rate} onChange={set("vat_rate")} placeholder="5" type="number" />
          </Field>
          <Field label="Default Payment Terms">
            <WSelect
              value={data.default_payment_terms || "Net 14"}
              onChange={set("default_payment_terms")}
              options={["Due on receipt", "Net 7", "Net 14", "Net 30", "Net 60"]}
            />
          </Field>
          <Field label="Enrolment Fee (AED)">
            <Input value={data.enrolment_fee} onChange={set("enrolment_fee")} placeholder="500" type="number" />
          </Field>
          <Field label="Enrolment Fee Type">
            <WSelect
              value={data.enrolment_fee_type}
              onChange={set("enrolment_fee_type")}
              options={["Lifetime (charged once per student)", "Annual", "Per Enrolment"]}
            />
          </Field>
        </FieldGroup>
        <Field label="Invoice Footer Text">
          <textarea
            value={data.invoice_footer_text}
            onChange={(e) => set("invoice_footer_text")(e.target.value)}
            placeholder="Thank you for your business. Payment is due within the terms stated above."
            rows={2}
            className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all resize-none"
          />
        </Field>
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} onSkip={onSkip} saving={saving} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 6: Academic Year + Terms ────────────────────────────────────────────

function StepAcademic({
  data, onChange, onNext, onBack, onSkip,
}: {
  data: AcademicState;
  onChange: (d: AcademicState) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [termErrors, setTermErrors] = useState<(string | null)[]>([]);
  const [existing, setExisting] = useState<{ id: string; name: string; startDate: string; endDate: string; isCurrent: boolean }[]>([]);
  const [loadingYear, setLoadingYear] = useState<string | null>(null);
  const [addTerms, setAddTerms] = useState(data.terms.length > 0);

  useEffect(() => {
    fetch("/api/settings/academic-years").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setExisting(d);
    }).catch(() => {});
  }, []);

  async function loadExistingYear(y: { id: string; name: string; startDate: string; endDate: string; isCurrent: boolean }) {
    setLoadingYear(y.id);
    try {
      const res = await fetch(`/api/settings/calendar-periods?yearId=${y.id}`);
      const periods = res.ok ? await res.json() : [];
      const terms: TermRow[] = Array.isArray(periods)
        ? periods.filter((p: { type?: string }) => p.type === "term" || !p.type).map((p: { id?: string; name: string; startDate: string; endDate: string }) => ({
            id: p.id, name: p.name, startDate: p.startDate, endDate: p.endDate,
          }))
        : [];
      onChange({ id: y.id, name: y.name, startDate: y.startDate, endDate: y.endDate, isCurrent: y.isCurrent, terms });
      setAddTerms(terms.length > 0);
      setTermErrors(terms.map(() => null));
      setErr("");
    } finally {
      setLoadingYear(null);
    }
  }

  function set<K extends keyof AcademicState>(k: K, v: AcademicState[K]) {
    setErr("");
    onChange({ ...data, [k]: v });
  }

  function setTermField(idx: number, field: keyof TermRow, v: string) {
    setTermErrors((prev) => prev.map((e, i) => (i === idx ? null : e)));
    onChange({ ...data, terms: data.terms.map((t, i) => i === idx ? { ...t, [field]: v } : t) });
  }

  function addTerm() {
    onChange({ ...data, terms: [...data.terms, { name: "", startDate: "", endDate: "" }] });
    setTermErrors((prev) => [...prev, null]);
  }

  function removeTerm(idx: number) {
    onChange({ ...data, terms: data.terms.filter((_, i) => i !== idx) });
    setTermErrors((prev) => prev.filter((_, i) => i !== idx));
  }

  function toggleTerms(on: boolean) {
    setAddTerms(on);
    if (on && data.terms.length === 0) {
      onChange({ ...data, terms: [{ name: "", startDate: "", endDate: "" }] });
      setTermErrors([null]);
    } else if (!on) {
      onChange({ ...data, terms: [] });
      setTermErrors([]);
    }
  }

  async function handleNext() {
    if (!data.name.trim() || !data.startDate || !data.endDate) {
      setErr("Academic year name, start date, and end date are required");
      return;
    }
    if (data.startDate >= data.endDate) {
      setErr("End date must be after start date");
      return;
    }

    const newTermErrors: (string | null)[] = data.terms.map((t) => {
      if (!t.name.trim()) return "Term name is required";
      if (!t.startDate || !t.endDate) return "Start and end dates are required";
      if (t.startDate >= t.endDate) return "End date must be after start date";
      if (data.startDate && t.startDate < data.startDate) return "Term starts before the academic year";
      if (data.endDate && t.endDate > data.endDate) return "Term ends after the academic year";
      return null;
    });

    setTermErrors(newTermErrors);
    if (newTermErrors.some(Boolean)) {
      setErr("Fix the highlighted term errors below");
      return;
    }

    setSaving(true);
    await onNext();
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Academic year</h2>
        <p className="text-sm text-slate-500 mt-1">Define your current academic year and optionally add term dates.</p>
      </div>

      {existing.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-700 mb-1.5">Existing academic years — click to edit</p>
          <div className="flex flex-wrap gap-2">
            {existing.map((y) => (
              <button
                key={y.id}
                type="button"
                onClick={() => loadExistingYear(y)}
                disabled={loadingYear === y.id}
                className={cn(
                  "px-2.5 py-1 text-xs border rounded-md transition-colors cursor-pointer",
                  data.id === y.id
                    ? "bg-amber-500 text-white border-amber-500 font-semibold"
                    : "bg-white border-amber-200 text-slate-700 hover:border-amber-400 hover:bg-amber-50",
                  loadingYear === y.id && "opacity-60"
                )}
              >
                {loadingYear === y.id ? "Loading…" : y.name}
                {y.isCurrent && <span className={cn("font-semibold ml-1", data.id === y.id ? "text-amber-100" : "text-amber-600")}>· Current</span>}
              </button>
            ))}
          </div>
          {data.id && (
            <p className="text-[11px] text-amber-700 mt-2 opacity-70">Editing existing year — saving will update this record.</p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <Field label="Academic Year Name *">
          <Input value={data.name} onChange={(v) => set("name", v)} placeholder="2025/26" />
        </Field>
        <FieldGroup cols={2}>
          <Field label="Start Date *">
            <Input value={data.startDate} onChange={(v) => set("startDate", v)} type="date" max="2099-12-31" />
          </Field>
          <Field label="End Date *">
            <Input value={data.endDate} onChange={(v) => set("endDate", v)} type="date" max="2099-12-31" />
          </Field>
        </FieldGroup>

        <ToggleSwitch
          checked={data.isCurrent}
          onChange={(v) => set("isCurrent", v)}
          label="Mark as current academic year"
        />

        {/* Terms section */}
        <div className="pt-2 border-t border-slate-100">
          <ToggleSwitch
            checked={addTerms}
            onChange={toggleTerms}
            label="Add term dates now"
            sublabel="Define Autumn, Spring, Summer terms — can be configured later in Settings → Academic Calendar"
          />

          {addTerms && (
            <div className="mt-4 space-y-2">
              {data.terms.map((term, idx) => {
                const termErr = termErrors[idx] ?? null;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 border rounded-lg transition-colors",
                      termErr ? "bg-red-50 border-red-300" : "bg-slate-50 border-slate-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex-1 mr-2">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Term Name</p>
                        <input
                          value={term.name}
                          onChange={(e) => setTermField(idx, "name", e.target.value)}
                          placeholder="e.g. Autumn Term"
                          className={cn(
                            "w-full text-sm font-semibold bg-white border rounded-md px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all",
                            termErr ? "border-red-300 text-red-800" : "border-slate-200 text-slate-700"
                          )}
                        />
                      </div>
                      <button
                        onClick={() => removeTerm(idx)}
                        className="p-1.5 text-slate-300 hover:text-red-400 cursor-pointer transition-colors shrink-0 mt-4"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Start</p>
                        <Input value={term.startDate} onChange={(v) => setTermField(idx, "startDate", v)} type="date" max="2099-12-31" />
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">End</p>
                        <Input value={term.endDate} onChange={(v) => setTermField(idx, "endDate", v)} type="date" max="2099-12-31" />
                      </div>
                    </div>
                    {termErr && (
                      <p className="flex items-center gap-1.5 text-xs text-red-600 mt-2 font-medium">
                        <X className="w-3 h-3 shrink-0" /> {termErr}
                      </p>
                    )}
                  </div>
                );
              })}
              <button
                onClick={addTerm}
                className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add term
              </button>
            </div>
          )}
        </div>

        {err && <ErrorBanner msg={err} />}
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} onSkip={onSkip} saving={saving} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 7: Subject Catalogue ────────────────────────────────────────────────

const SESSION_DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
  { label: "120 min", value: 120 },
];

function StepSubjects({
  data, onChange, onNext, onBack, onSkip, depts,
}: {
  data: SubjectRow[];
  onChange: (d: SubjectRow[]) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
  depts: DeptRow[];
}) {
  const [saving, setSaving] = useState(false);

  const availableDepts = depts.filter((d) => d.id && d.name);

  useEffect(() => {
    if (data.length > 0) return;
    fetch("/api/courses").then((r) => r.json()).then((res) => {
      const subjects = Array.isArray(res) ? res : (res?.subjects ?? []);
      if (subjects.length > 0) {
        onChange(subjects.map((s: {
          id: string; departmentId?: string; department?: string; name: string;
          sessionDurationMins?: number; price?: number; isActive?: boolean;
        }) => ({
          id: s.id,
          departmentId: s.departmentId ?? "",
          departmentName: s.department ?? "",
          name: s.name,
          sessionDurationMins: s.sessionDurationMins ?? 60,
          price: s.price != null ? String(s.price) : "",
          isActive: s.isActive ?? true,
          _saved: true,
        })));
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addSubject() {
    const first = availableDepts[0];
    onChange([...data, {
      departmentId: first?.id ?? "",
      departmentName: first?.name ?? "",
      name: "",
      sessionDurationMins: 60,
      price: "",
      isActive: true,
    }]);
  }

  function removeSubject(idx: number) {
    onChange(data.filter((_, i) => i !== idx));
  }

  function setField(idx: number, field: keyof SubjectRow, val: string | number) {
    onChange(data.map((s, i) => {
      if (i !== idx) return s;
      if (field === "departmentId") {
        const dept = availableDepts.find((d) => d.id === val);
        return { ...s, departmentId: String(val), departmentName: dept?.name ?? "", _saved: false };
      }
      return { ...s, [field]: val, _saved: false };
    }));
  }

  function toggleActive(idx: number) {
    onChange(data.map((s, i) => i === idx ? { ...s, isActive: !s.isActive, _saved: false } : s));
  }

  async function handleNext() {
    setSaving(true);
    await onNext();
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Subject catalogue</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add the subjects you teach. Set session durations and base pricing here — grading scales and delivery modes are configurable in Settings → Subjects.
        </p>
      </div>

      {availableDepts.length === 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
          No departments saved yet — subjects will be created without a department assignment.
        </div>
      )}

      <div className="space-y-3">
        {data.length === 0 && (
          <p className="text-sm text-slate-400 italic py-2">No subjects added yet — click below to add your first subject.</p>
        )}

        {data.map((subject, idx) => (
          <div
            key={idx}
            className="border border-slate-200 rounded-xl overflow-hidden bg-white"
          >
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Subject {idx + 1}
                {subject._saved && <span className="ml-2 text-emerald-500 normal-case font-normal">✓ saved</span>}
              </span>
              <button
                onClick={() => removeSubject(idx)}
                className="p-1 text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Row 1: Name + Department */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Subject Name *">
                  <Input
                    value={subject.name}
                    onChange={(v) => setField(idx, "name", v)}
                    placeholder="e.g. Mathematics"
                  />
                </Field>
                <Field label="Department">
                  {availableDepts.length > 0 ? (
                    <select
                      value={subject.departmentId}
                      onChange={(e) => setField(idx, "departmentId", e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 cursor-pointer appearance-none"
                    >
                      <option value="">— No department —</option>
                      {availableDepts.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  ) : (
                    <Input value="" onChange={() => {}} placeholder="No departments configured" disabled />
                  )}
                </Field>
              </div>

              {/* Row 2: Duration + Price */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Session Duration">
                  <select
                    value={subject.sessionDurationMins}
                    onChange={(e) => setField(idx, "sessionDurationMins", Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 cursor-pointer appearance-none"
                  >
                    {SESSION_DURATIONS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Price per Session (AED)">
                  <Input
                    value={subject.price}
                    onChange={(v) => setField(idx, "price", v)}
                    placeholder="e.g. 250"
                    type="number"
                  />
                </Field>
              </div>

              {/* Row 3: Active toggle */}
              <div className="pt-1">
                <ToggleSwitch
                  checked={subject.isActive}
                  onChange={() => toggleActive(idx)}
                  label={subject.isActive ? "Active — enrolments enabled" : "Inactive — not available for enrolment"}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addSubject}
          className="flex items-center gap-2 px-4 py-2.5 w-full border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add subject
        </button>
      </div>

      <NavButtons onBack={onBack} onNext={handleNext} onSkip={onSkip} saving={saving} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 8: Documents & Policies ────────────────────────────────────────────

const DOCUMENT_SLOTS = [
  { key: "terms",    label: "Terms & Conditions",        accept: ".pdf,.doc,.docx" },
  { key: "privacy",  label: "Privacy Policy",             accept: ".pdf,.doc,.docx" },
  { key: "conduct",  label: "Student Code of Conduct",    accept: ".pdf,.doc,.docx" },
  { key: "handbook", label: "Student / Parent Handbook",  accept: ".pdf,.doc,.docx" },
] as const;

type DocSlotKey = (typeof DOCUMENT_SLOTS)[number]["key"];
type DocumentsState = { [K in DocSlotKey]?: File | null };

function StepDocuments({
  onNext, onBack, onSkip,
}: {
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [files, setFiles] = useState<DocumentsState>({});

  function handleFile(key: DocSlotKey, f: File | null) {
    setFiles((prev) => ({ ...prev, [key]: f }));
  }

  const uploadedCount = Object.values(files).filter(Boolean).length;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Documents &amp; Policies</h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload your key documents now. These are stored in Settings → Documents and can be shared with staff, students, and guardians.
        </p>
      </div>

      <div className="space-y-3 mb-5">
        {DOCUMENT_SLOTS.map((slot) => {
          const file = files[slot.key];
          return (
            <label
              key={slot.key}
              className={cn(
                "flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all group",
                file
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-dashed border-slate-200 hover:border-amber-400 hover:bg-amber-50/30"
              )}
            >
              <input
                type="file"
                accept={slot.accept}
                className="sr-only"
                onChange={(e) => handleFile(slot.key, e.target.files?.[0] ?? null)}
              />
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                file ? "bg-emerald-100" : "bg-slate-100 group-hover:bg-amber-100"
              )}>
                {file
                  ? <Check className="w-5 h-5 text-emerald-600" />
                  : <FileText className="w-5 h-5 text-slate-400 group-hover:text-amber-600" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-semibold", file ? "text-emerald-800" : "text-slate-700")}>
                  {slot.label}
                </p>
                {file ? (
                  <p className="text-xs text-emerald-600 truncate">{file.name}</p>
                ) : (
                  <p className="text-xs text-slate-400">Click to upload PDF, DOC, or DOCX</p>
                )}
              </div>
              {file && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleFile(slot.key, null); }}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {!file && (
                <Upload className="w-4 h-4 text-slate-300 group-hover:text-amber-500 shrink-0 transition-colors" />
              )}
            </label>
          );
        })}
      </div>

      {uploadedCount > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
          <p className="text-xs text-amber-700">
            <strong>{uploadedCount} document{uploadedCount !== 1 ? "s" : ""} selected.</strong>{" "}
            Full document management is available in <strong>Settings → Documents</strong> after onboarding.
          </p>
        </div>
      )}

      <NavButtons onBack={onBack} onNext={onNext} onSkip={onSkip} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 9: Integrations ─────────────────────────────────────────────────────

function StepIntegrations({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Platform integrations</h2>
        <p className="text-sm text-slate-500 mt-1">
          Connect Enrolla to the tools your team already uses. All integrations are scheduled for Phase 2.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        {INTEGRATIONS_LIST.map((integ) => (
          <div
            key={integ.name}
            className="relative flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl opacity-60"
          >
            <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full uppercase tracking-wide">
              Phase 2
            </span>
            <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0", integ.color)}>
              {integ.abbr}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{integ.name}</p>
              <p className="text-xs text-slate-400 truncate">{integ.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700">
          Once Phase 2 launches, you&apos;ll be able to connect these from <strong>Settings → Integrations</strong>. We&apos;ll notify you when they&apos;re available.
        </p>
      </div>

      <NavButtons onBack={onBack} onNext={onNext} nextLabel="Got it, Continue" />
    </div>
  );
}

// ─── Step 9: Complete ─────────────────────────────────────────────────────────

function StepComplete({ summary: initialSummary, onFinish }: { summary: SummaryData; onFinish: () => Promise<void> }) {
  const [finishing, setFinishing] = useState(false);
  const [summary, setSummary] = useState(initialSummary);

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/settings/departments").then((r) => r.json()),
      fetch("/api/courses").then((r) => r.json()),
    ]).then(([deptRes, subjectRes]) => {
      const deptCount = deptRes.status === "fulfilled" && Array.isArray(deptRes.value)
        ? deptRes.value.filter((d: { name?: string }) => d.name?.trim()).length
        : initialSummary.deptCount;
      const subjectCount = subjectRes.status === "fulfilled"
        ? (subjectRes.value?.subjects ?? []).filter((s: { name?: string }) => s.name?.trim()).length
        : initialSummary.subjectCount;
      setSummary((p) => ({
        ...p,
        deptCount: Math.max(p.deptCount, deptCount),
        subjectCount: Math.max(p.subjectCount, subjectCount),
      }));
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = [
    { label: "Organisation profile",  done: !!summary.orgName,              detail: summary.orgName || "Not set" },
    { label: "Branches",              done: summary.branchCount > 0,        detail: summary.branchCount > 0 ? `${summary.branchCount} branch${summary.branchCount !== 1 ? "es" : ""} added` : "None added" },
    { label: "Rooms",                 done: summary.roomCount > 0,          detail: summary.roomCount > 0 ? `${summary.roomCount} room${summary.roomCount !== 1 ? "s" : ""} added` : "Skipped — add from Settings → Rooms" },
    { label: "Departments",           done: summary.deptCount > 0,          detail: summary.deptCount > 0 ? `${summary.deptCount} department${summary.deptCount !== 1 ? "s" : ""} configured` : "None added" },
    { label: "Billing & Invoicing",   done: summary.billingConfigured,      detail: summary.billingConfigured ? "Invoice settings saved" : "Skipped — configure in Settings" },
    {
      label: "Academic Year",
      done: summary.academicYearConfigured,
      detail: summary.academicYearConfigured
        ? `Year set${summary.termCount > 0 ? `, ${summary.termCount} term${summary.termCount !== 1 ? "s" : ""} added` : ""}`
        : "Skipped — configure in Settings",
    },
    { label: "Subject Catalogue",     done: summary.subjectCount > 0,       detail: summary.subjectCount > 0 ? `${summary.subjectCount} subject${summary.subjectCount !== 1 ? "s" : ""} added` : "Skipped — configure in Settings" },
    { label: "Documents & Policies",  done: true,                           detail: "Manage from Settings → Documents" },
    { label: "Integrations",          done: true,                           detail: "Phase 2 — configurable from Settings → Integrations" },
  ];

  async function handleFinish() {
    setFinishing(true);
    await onFinish();
  }

  return (
    <div>
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">You&apos;re all set!</h2>
        <p className="text-sm text-slate-500 mt-1">Here&apos;s a summary of what was configured. You can update any of these from Settings.</p>
      </div>
      <div className="space-y-2 mb-6">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
              item.done ? "bg-emerald-100" : "bg-slate-100"
            )}>
              {item.done
                ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-500 truncate">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
        <p className="text-xs text-slate-400">Onboarding can be re-run from Settings → Organisation</p>
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60"
        >
          {finishing ? "Finishing…" : "Go to Dashboard"}
          {!finishing && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#EC4899", "#F97316", "#06B6D4"];

function Confetti() {
  const pieces = Array.from({ length: 72 }, (_, i) => ({
    id: i,
    left: `${(i / 72) * 100 + (Math.sin(i * 2.4) * 3)}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    fallDur: `${2.2 + (i % 7) * 0.3}s`,
    fallDelay: `${(i % 12) * 0.12}s`,
    swayDur: `${1.4 + (i % 5) * 0.3}s`,
    swayDelay: `${(i % 8) * 0.1}s`,
    size: `${7 + (i % 5) * 2}px`,
    borderRadius: i % 3 === 0 ? "2px" : i % 3 === 1 ? "50%" : "0",
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" aria-hidden>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece absolute top-0"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.borderRadius,
            "--fall-dur": p.fallDur,
            "--fall-delay": p.fallDelay,
            "--sway-dur": p.swayDur,
            "--sway-delay": p.swayDelay,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ─── Left Panel ───────────────────────────────────────────────────────────────

function LeftPanel({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) {
  return (
    <aside className="w-64 bg-[#0F172A] flex flex-col p-7 shrink-0">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-lg leading-none">E</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Enrolla</p>
          <p className="text-slate-400 text-xs">Setup Wizard</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <ol className="space-y-0.5">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive   = idx === currentStep;
            const isDone     = completedSteps.has(idx);
            const isUpcoming = idx > currentStep && !isDone;
            return (
              <li key={step.id}>
                <div className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors",
                  isActive ? "bg-white/10" : "",
                  isDone && !isActive ? "opacity-70" : "",
                  isUpcoming ? "opacity-40" : "",
                )}>
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    isActive ? "bg-amber-500" : isDone ? "bg-emerald-500" : "bg-white/10",
                  )}>
                    {isDone && !isActive
                      ? <Check className="w-3 h-3 text-white" />
                      : <Icon className="w-3 h-3 text-white" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-xs font-medium leading-tight truncate", isActive ? "text-white" : "text-slate-400")}>
                      {step.label}
                      {"optional" in step && step.optional && (
                        <span className="ml-1 text-[9px] font-normal text-slate-500 uppercase tracking-wide">opt</span>
                      )}
                    </p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn("ml-6 w-px h-3", isDone ? "bg-emerald-500/40" : "bg-white/10")} />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="pt-5 border-t border-white/10 mt-4">
        <p className="text-xs text-slate-500">Update these settings anytime in <span className="text-slate-400 font-medium">Settings → Organisation</span>.</p>
      </div>
    </aside>
  );
}

// ─── Main Wizard (inner — uses useSearchParams) ───────────────────────────────

function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [formData, setFormData]   = useState<WizardFormData>(DEFAULT_FORM);
  const [summary, setSummary]     = useState<SummaryData>({
    orgName: "", branchCount: 0, roomCount: 0, deptCount: 0,
    billingConfigured: false, academicYearConfigured: false,
    termCount: 0, subjectCount: 0,
  });


  function markDone(idx: number) {
    setCompleted((prev) => new Set([...prev, idx]));
  }

  // ── Step 1: Organisation ─────────────────────────────────────────────────────
  const handleOrg = useCallback(async () => {
    const { org } = formData;
    const res = await fetch("/api/settings/org", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(org),
    });
    if (!res.ok) { toast.error("Failed to save organisation details"); return; }
    setSummary((p) => ({ ...p, orgName: org.org_name }));
    markDone(0); setStep(1);
  }, [formData]);

  // ── Step 2: Branches (capture IDs for rooms step) ───────────────────────────
  const handleBranches = useCallback(async () => {
    const branches = formData.branches.filter((b) => b.name.trim());
    const updated: BranchRow[] = [];
    for (const b of branches) {
      if (b.id) {
        const res = await fetch(`/api/settings/branches/${b.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: b.name, address: b.address, phone: b.phone }),
        });
        updated.push(res.ok ? { ...b, _saved: true } : b);
      } else {
        const res = await fetch("/api/settings/branches", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: b.name, address: b.address, phone: b.phone }),
        });
        if (res.ok) {
          const saved = await res.json();
          updated.push({ ...b, id: saved.id, _saved: true });
        } else {
          updated.push(b);
        }
      }
    }
    setFormData((p) => ({ ...p, branches: updated }));
    setSummary((p) => ({ ...p, branchCount: updated.filter((b) => b.id).length }));
    markDone(1); setStep(2);
  }, [formData]);

  // ── Step 3: Rooms ────────────────────────────────────────────────────────────
  const handleRooms = useCallback(async () => {
    const toSave = formData.rooms.filter((r) => r.name.trim() && !r.id);
    const toUpdate = formData.rooms.filter((r) => r.id && !r._saved && r.name.trim());
    for (const r of toSave) {
      await fetch("/api/settings/rooms", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: r.name, branch_id: r.branchId, capacity: r.capacity ? parseInt(r.capacity) : null }),
      });
    }
    for (const r of toUpdate) {
      await fetch(`/api/settings/rooms/${r.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: r.name, capacity: r.capacity ? parseInt(r.capacity) : null }),
      });
    }
    const total = formData.rooms.filter((r) => r.name.trim()).length;
    setSummary((p) => ({ ...p, roomCount: total }));
    markDone(2); setStep(3);
  }, [formData]);

  // ── Step 4: Departments (capture IDs for subjects step) ──────────────────────
  const handleDepts = useCallback(async () => {
    const depts = formData.depts.filter((d) => d.name.trim());
    const updated: DeptRow[] = [];
    let failed = 0;
    for (const d of depts) {
      if (d.id) {
        const res = await fetch(`/api/settings/departments/${d.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: d.name, yearGroupFrom: d.yearGroupFrom, yearGroupTo: d.yearGroupTo, colour: d.colour }),
        });
        if (res.ok) {
          updated.push({ ...d, _saved: true });
        } else {
          updated.push(d);
          failed++;
        }
      } else {
        const res = await fetch("/api/settings/departments", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: d.name, yearGroupFrom: d.yearGroupFrom, yearGroupTo: d.yearGroupTo, colour: d.colour }),
        });
        if (res.ok) {
          const saved = await res.json();
          updated.push({ ...d, id: saved.id, _saved: true });
        } else {
          const errBody = await res.json().catch(() => ({}));
          console.error("Dept save failed", res.status, errBody);
          updated.push(d);
          failed++;
        }
      }
    }
    if (failed > 0) {
      toast.error(`${failed} department${failed > 1 ? "s" : ""} failed to save — check your connection and try again`);
      return;
    }
    setFormData((p) => ({ ...p, depts: updated }));
    setSummary((p) => ({ ...p, deptCount: updated.filter((d) => d.id).length }));
    markDone(3); setStep(4);
  }, [formData]);

  // ── Step 5: Billing ──────────────────────────────────────────────────────────
  const handleBilling = useCallback(async () => {
    const res = await fetch("/api/settings/org", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData.billing),
    });
    if (!res.ok) { toast.error("Failed to save billing settings"); return; }
    const hasContent = Object.entries(formData.billing).some(
      ([k, v]) => k !== "enrolment_fee_type" && v
    );
    setSummary((p) => ({ ...p, billingConfigured: hasContent }));
    markDone(4); setStep(5);
  }, [formData]);

  // ── Step 6: Academic Year + Terms ────────────────────────────────────────────
  const handleAcademic = useCallback(async () => {
    const { academic } = formData;
    let yearId: string;

    if (academic.id) {
      // Editing an existing academic year — PATCH it
      const res = await fetch(`/api/settings/academic-years/${academic.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: academic.name, startDate: academic.startDate, endDate: academic.endDate, isCurrent: academic.isCurrent }),
      });
      if (!res.ok) { toast.error("Failed to update academic year"); return; }
      yearId = academic.id;
    } else {
      // Creating a new academic year
      const res = await fetch("/api/settings/academic-years", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: academic.name, startDate: academic.startDate, endDate: academic.endDate, isCurrent: academic.isCurrent }),
      });
      if (!res.ok) { toast.error("Failed to save academic year"); return; }
      const yearData = await res.json();
      yearId = yearData.id;
    }

    let termsSaved = 0;
    for (const term of academic.terms) {
      if (!term.name.trim() || !term.startDate || !term.endDate) continue;
      if (term.id) {
        // Update existing term
        const tRes = await fetch(`/api/settings/calendar-periods/${term.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: term.name, startDate: term.startDate, endDate: term.endDate }),
        });
        if (tRes.ok) termsSaved++;
      } else {
        // Create new term
        const tRes = await fetch("/api/settings/calendar-periods", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ academicYearId: yearId, type: "term", name: term.name, startDate: term.startDate, endDate: term.endDate }),
        });
        if (tRes.ok) termsSaved++;
      }
    }
    setSummary((p) => ({ ...p, academicYearConfigured: true, termCount: termsSaved }));
    markDone(5); setStep(6);
  }, [formData]);

  // ── Step 7: Subjects ─────────────────────────────────────────────────────────
  const handleSubjects = useCallback(async () => {
    const toSave = formData.subjects.filter((s) => s.name.trim() && !s.id);
    for (const s of toSave) {
      await fetch("/api/courses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subject",
          name: s.name,
          departmentId: s.departmentId || null,
          sessionDurationMins: s.sessionDurationMins,
          isActive: s.isActive,
          price: s.price ? parseFloat(s.price) : 0,
        }),
      });
    }
    setSummary((p) => ({ ...p, subjectCount: formData.subjects.filter((s) => s.name.trim()).length }));
    markDone(6); setStep(7);
  }, [formData]);

  // ── Step 8: Documents (no API yet, files handled locally) ───────────────────
  function handleDocuments() {
    markDone(7); setStep(8);
  }

  // ── Step 9: Integrations (no API) ───────────────────────────────────────────
  function handleIntegrations() {
    markDone(8); setStep(9);
  }

  // ── Step 10: Finish ──────────────────────────────────────────────────────────
  const handleFinish = useCallback(async () => {
    await fetch("/api/settings/org", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complete: true }),
    });
    toast.success("Onboarding complete! Welcome to Enrolla.");
    router.push("/dashboard");
  }, [router]);

  const totalSteps = STEPS.length - 1;
  const progressPct = Math.round((completed.size / totalSteps) * 100);
  const isComplete = step === 9;

  // Mobile nav drawer state
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      {isComplete && <Confetti />}

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <LeftPanel currentStep={step} completedSteps={completed} />
      </div>

      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileNavOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute left-0 top-0 bottom-0 w-64" onClick={(e) => e.stopPropagation()}>
            <LeftPanel currentStep={step} completedSteps={completed} />
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto flex flex-col items-center">
        {/* Mobile top bar */}
        <div className="md:hidden w-full bg-[#0F172A] flex items-center gap-3 px-4 py-3 shrink-0">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Step {step + 1} of {STEPS.length}</span>
              <span>{progressPct}% complete</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl px-4 md:px-10 pt-8 md:pt-12 pb-12">
          {/* Desktop progress bar */}
          <div className="hidden md:block mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Step {step + 1} of {STEPS.length}
              </span>
              <span className="text-xs text-slate-400">{progressPct}% complete</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Step card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
            {step === 0 && (
              <StepOrganisation
                data={formData.org}
                onChange={(d) => setFormData((p) => ({ ...p, org: d }))}
                onNext={handleOrg}
              />
            )}
            {step === 1 && (
              <StepBranches
                data={formData.branches}
                onChange={(d) => setFormData((p) => ({ ...p, branches: d }))}
                onNext={handleBranches}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <StepRooms
                data={formData.rooms}
                onChange={(d) => setFormData((p) => ({ ...p, rooms: d }))}
                onNext={handleRooms}
                onBack={() => setStep(1)}
                onSkip={() => { markDone(2); setStep(3); }}
                branches={formData.branches}
              />
            )}
            {step === 3 && (
              <StepDepartments
                data={formData.depts}
                onChange={(d) => setFormData((p) => ({ ...p, depts: d }))}
                onNext={handleDepts}
                onBack={() => setStep(2)}
              />
            )}
            {step === 4 && (
              <StepBilling
                data={formData.billing}
                onChange={(d) => setFormData((p) => ({ ...p, billing: d }))}
                onNext={handleBilling}
                onBack={() => setStep(3)}
                onSkip={() => { markDone(4); setStep(5); }}
              />
            )}
            {step === 5 && (
              <StepAcademic
                data={formData.academic}
                onChange={(d) => setFormData((p) => ({ ...p, academic: d }))}
                onNext={handleAcademic}
                onBack={() => setStep(4)}
                onSkip={() => { markDone(5); setStep(6); }}
              />
            )}
            {step === 6 && (
              <StepSubjects
                data={formData.subjects}
                onChange={(d) => setFormData((p) => ({ ...p, subjects: d }))}
                onNext={handleSubjects}
                onBack={() => setStep(5)}
                onSkip={() => { markDone(6); setStep(7); }}
                depts={formData.depts}
              />
            )}
            {step === 7 && (
              <StepDocuments
                onNext={handleDocuments}
                onBack={() => setStep(6)}
                onSkip={() => { markDone(7); setStep(8); }}
              />
            )}
            {step === 8 && (
              <StepIntegrations
                onNext={handleIntegrations}
                onBack={() => setStep(7)}
              />
            )}
            {step === 9 && (
              <StepComplete
                summary={{
                  ...summary,
                  deptCount: Math.max(
                    summary.deptCount,
                    formData.depts.filter((d) => d.id && d.name.trim()).length
                  ),
                  subjectCount: Math.max(
                    summary.subjectCount,
                    formData.subjects.filter((s) => s.name.trim()).length
                  ),
                }}
                onFinish={handleFinish}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Page export (Suspense boundary for useSearchParams) ─────────────────────

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#F8FAFC]">
        <div className="text-sm text-slate-400">Loading…</div>
      </div>
    }>
      <OnboardingWizard />
    </Suspense>
  );
}
