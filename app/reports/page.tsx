"use client";

import { useState, useMemo, useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  DateRangePicker,
  type DateRange,
  type PresetItem,
} from "@/components/ui/date-range-picker";
import { staffMembers, currentUser } from "@/lib/mock-data";
import {
  FileText,
  Download,
  Share2,
  MoreHorizontal,
  Plus,
  Package,
  Trash2,
  RefreshCw,
  Calendar,
  TrendingUp,
  Users,
  BookOpen,
  AlertTriangle,
  DollarSign,
  X,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import {
  GenerateReportDialog,
  type GeneratedReportInput,
  type ReportTypeOption,
} from "@/components/reports/generate-report-dialog";

// ─── Types ──────────────────────────────────────────────────────────────────────

type ReportType =
  | "Revenue Summary"
  | "Payment Reconciliation"
  | "Attendance Summary"
  | "Churn Report"
  | "Academic Alerts"
  | "Staff Report";

type ReportFormat = "PDF" | "Excel" | "CSV";
type ReportStatus = "ready" | "processing" | "failed";
type Department = "Primary" | "Lower Secondary" | "Senior";
type Frequency = "Daily" | "Weekly" | "Monthly" | "Termly";
type ScheduledStatus = "active" | "paused";

interface Report {
  id: string;
  name: string;
  reportType: ReportType;
  format: ReportFormat;
  size: string;
  generatedAt: string;
  generatedDate: Date;
  generatedBy: string;
  department: Department | "All";
  status: ReportStatus;
  read: boolean;
}

interface ScheduledReport {
  id: string;
  name: string;
  reportType: ReportType;
  cadence: string;
  frequency: Frequency;
  nextRun: string;
  recipients: string;
  format: ReportFormat;
  status: ScheduledStatus;
}

// ─── Mock data ──────────────────────────────────────────────────────────────────

function mkDate(day: number, month: number, year: number): Date {
  return new Date(year, month - 1, day);
}

const initialReports: Report[] = [
  { id: "R-001", name: "Weekly Digest — 14 Apr 2026",          reportType: "Academic Alerts",        format: "PDF", size: "1.2 MB",  generatedAt: "14 Apr 2026, 07:00", generatedDate: mkDate(14,4,2026), generatedBy: "System",         department: "All",            status: "ready",      read: false },
  { id: "R-002", name: "Churn Risk Report — Term 3",           reportType: "Churn Report",           format: "PDF", size: "2.4 MB",  generatedAt: "13 Apr 2026, 00:00", generatedDate: mkDate(13,4,2026), generatedBy: "Jason Daswani",  department: "Senior",         status: "ready",      read: false },
  { id: "R-003", name: "Term 3 Revenue Summary",               reportType: "Revenue Summary",        format: "CSV", size: "84 KB",   generatedAt: "12 Apr 2026, 00:00", generatedDate: mkDate(12,4,2026), generatedBy: "Rania Aziz",     department: "All",            status: "ready",      read: false },
  { id: "R-004", name: "Academic Alerts Summary — Week 3",     reportType: "Academic Alerts",        format: "PDF", size: "980 KB",  generatedAt: "10 Apr 2026, 07:00", generatedDate: mkDate(10,4,2026), generatedBy: "Sarah Thompson", department: "Lower Secondary",status: "ready",      read: true  },
  { id: "R-005", name: "Staff Attendance Report — Mar 2026",   reportType: "Staff Report",           format: "CSV", size: "56 KB",   generatedAt: "8 Apr 2026, 07:00",  generatedDate: mkDate(8,4,2026),  generatedBy: "System",         department: "Primary",        status: "failed",     read: true  },
  { id: "R-006", name: "Payment Reconciliation — Term 3",      reportType: "Payment Reconciliation", format: "PDF", size: "1.8 MB",  generatedAt: "5 Apr 2026, 00:00",  generatedDate: mkDate(5,4,2026),  generatedBy: "Rania Aziz",     department: "All",            status: "ready",      read: true  },
  { id: "R-007", name: "Attendance Summary — March 2026",      reportType: "Attendance Summary",     format: "PDF", size: "1.4 MB",  generatedAt: "1 Apr 2026, 07:00",  generatedDate: mkDate(1,4,2026),  generatedBy: "System",         department: "Primary",        status: "ready",      read: true  },
  { id: "R-008", name: "Revenue by Teacher — Term 2",          reportType: "Revenue Summary",        format: "CSV", size: "44 KB",   generatedAt: "28 Mar 2026, 00:00", generatedDate: mkDate(28,3,2026), generatedBy: "Jason Daswani",  department: "Lower Secondary",status: "processing", read: true  },
  { id: "R-009", name: "CPD Progress Report — All Staff",      reportType: "Staff Report",           format: "PDF", size: "760 KB",  generatedAt: "25 Mar 2026, 07:00", generatedDate: mkDate(25,3,2026), generatedBy: "Sarah Thompson", department: "Senior",         status: "ready",      read: true  },
  { id: "R-010", name: "Weekly Digest — 24 Mar 2026",          reportType: "Academic Alerts",        format: "PDF", size: "1.1 MB",  generatedAt: "24 Mar 2026, 07:00", generatedDate: mkDate(24,3,2026), generatedBy: "System",         department: "All",            status: "ready",      read: true  },
  { id: "R-011", name: "Overdue Invoice Report — Mar 2026",    reportType: "Payment Reconciliation", format: "CSV", size: "38 KB",   generatedAt: "20 Mar 2026, 00:00", generatedDate: mkDate(20,3,2026), generatedBy: "Rania Aziz",     department: "All",            status: "failed",     read: true  },
  { id: "R-012", name: "Academic Alerts Summary — Week 2",     reportType: "Academic Alerts",        format: "PDF", size: "890 KB",  generatedAt: "14 Mar 2026, 07:00", generatedDate: mkDate(14,3,2026), generatedBy: "System",         department: "Lower Secondary",status: "ready",      read: true  },
];

const initialScheduledReports: ScheduledReport[] = [
  { id: "SR-001", name: "Weekly Digest",          reportType: "Academic Alerts",        cadence: "Weekly — Monday 07:00",  frequency: "Weekly",  nextRun: "21 Apr 2026", recipients: "Jason Daswani",                 format: "PDF", status: "active" },
  { id: "SR-002", name: "Churn Risk Report",      reportType: "Churn Report",           cadence: "Weekly — Sunday 00:00",  frequency: "Weekly",  nextRun: "20 Apr 2026", recipients: "Jason Daswani, Sarah Thompson", format: "PDF", status: "active" },
  { id: "SR-003", name: "Revenue Summary",        reportType: "Revenue Summary",        cadence: "Monthly — 1st",          frequency: "Monthly", nextRun: "1 May 2026",  recipients: "Jason Daswani",                 format: "CSV", status: "active" },
  { id: "SR-004", name: "Academic Alerts",        reportType: "Academic Alerts",        cadence: "Weekly — Monday 07:00",  frequency: "Weekly",  nextRun: "21 Apr 2026", recipients: "Jason Daswani",                 format: "PDF", status: "paused" },
  { id: "SR-005", name: "Attendance Summary",     reportType: "Attendance Summary",     cadence: "Monthly — 1st",          frequency: "Monthly", nextRun: "1 May 2026",  recipients: "Sarah Thompson",                format: "PDF", status: "active" },
  { id: "SR-006", name: "Payment Reconciliation", reportType: "Payment Reconciliation", cadence: "Termly",                 frequency: "Termly",  nextRun: "1 Jul 2026",  recipients: "Rania Aziz",                    format: "CSV", status: "active" },
  { id: "SR-007", name: "Staff CPD Report",       reportType: "Staff Report",           cadence: "Daily — 06:00",          frequency: "Daily",   nextRun: "22 Apr 2026", recipients: "Jason Daswani, Sarah Thompson", format: "PDF", status: "paused" },
];

// ─── Config & constants ─────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ReportType, { icon: React.ElementType; iconBg: string; iconColor: string }> = {
  "Revenue Summary":        { icon: TrendingUp,    iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  "Payment Reconciliation": { icon: DollarSign,    iconBg: "bg-blue-50",    iconColor: "text-blue-600"    },
  "Attendance Summary":     { icon: Calendar,      iconBg: "bg-indigo-50",  iconColor: "text-indigo-600"  },
  "Churn Report":           { icon: AlertTriangle, iconBg: "bg-red-50",     iconColor: "text-red-500"     },
  "Academic Alerts":        { icon: BookOpen,      iconBg: "bg-teal-50",    iconColor: "text-teal-600"    },
  "Staff Report":           { icon: Users,         iconBg: "bg-purple-50",  iconColor: "text-purple-600"  },
};

const TYPE_MAP: Record<ReportTypeOption, ReportType> = {
  "Attendance": "Attendance Summary",
  "Finance":    "Revenue Summary",
  "Academic":   "Academic Alerts",
  "Churn":      "Churn Report",
  "Staff CPD":  "Staff Report",
};

const REPORT_TYPES: (ReportType | "All")[] = [
  "All",
  "Revenue Summary",
  "Payment Reconciliation",
  "Attendance Summary",
  "Churn Report",
  "Academic Alerts",
  "Staff Report",
];

const DEPARTMENTS: (Department | "All")[] = ["All", "Primary", "Lower Secondary", "Senior"];
const FREQUENCIES: (Frequency | "All")[] = ["All", "Daily", "Weekly", "Monthly", "Termly"];
const GENERATED_BY_OPTIONS: string[] = ["All", "System", ...staffMembers.map((s) => s.name)];

const GEN_STATUSES = ["All", "Ready", "Processing", "Failed"] as const;
type GenStatusFilter = (typeof GEN_STATUSES)[number];

const SCHED_STATUSES = ["All", "Active", "Paused"] as const;
type SchedStatusFilter = (typeof SCHED_STATUSES)[number];

// ─── Date presets ───────────────────────────────────────────────────────────────

const REPORT_DATE_PRESETS: PresetItem[] = [
  { label: "Today",     getValue: () => { const d = new Date(); return { from: d, to: d }; } },
  { label: "Yesterday", getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return { from: d, to: d }; } },
  { separator: true },
  {
    label: "This week",
    getValue: () => {
      const now = new Date();
      const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { from: mon, to: sun };
    },
  },
  {
    label: "Last week",
    getValue: () => {
      const now = new Date();
      const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 7);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { from: mon, to: sun };
    },
  },
  { separator: true },
  {
    label: "This month",
    getValue: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
    },
  },
  {
    label: "Last month",
    getValue: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) };
    },
  },
  { separator: true },
  { label: "This term", getValue: () => ({ from: new Date(2026, 1, 2),  to: new Date(2026, 3, 25) }) },
  { label: "Last term", getValue: () => ({ from: new Date(2025, 8, 1),  to: new Date(2026, 0, 23) }) },
  { separator: true },
  {
    label: "This year",
    getValue: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear(), 0, 1), to: new Date(now.getFullYear(), 11, 31) };
    },
  },
  { label: "All time", getValue: () => ({ from: null, to: null }) },
];

// ─── Helper fns ─────────────────────────────────────────────────────────────────

function formatGeneratedAt(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

function sizeForFormat(format: ReportFormat): string {
  if (format === "PDF")   return `${(Math.random() * 1.5 + 0.8).toFixed(1)} MB`;
  if (format === "Excel") return `${Math.floor(120 + Math.random() * 240)} KB`;
  return `${Math.floor(40 + Math.random() * 80)} KB`;
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function FormatBadge({ format }: { format: ReportFormat }) {
  const styles =
    format === "PDF"   ? "bg-red-100 text-red-700"
  : format === "Excel" ? "bg-blue-100 text-blue-700"
  :                      "bg-emerald-100 text-emerald-700";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide", styles)}>
      {format}
    </span>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  if (status === "ready") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="w-3 h-3" />
        Ready
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700">
        <Clock className="w-3 h-3" />
        Processing
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-700">
      <XCircle className="w-3 h-3" />
      Failed
    </span>
  );
}

function TypePill({ type }: { type: ReportType }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
      {type}
    </span>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}) {
  const isActive = value !== options[0];
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={cn(
            "h-8 pl-3 pr-8 rounded-full text-xs font-medium border transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 appearance-none",
            isActive
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
          )}
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="text-slate-700 bg-white">{opt}</option>
          ))}
        </select>
        <div className={cn(
          "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2",
          isActive ? "text-white" : "text-slate-400"
        )}>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ActiveFilterChip({
  label,
  value,
  onClear,
}: {
  label: string;
  value: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
      <span className="text-amber-500 font-semibold">{label}:</span>
      {value}
      <button
        type="button"
        onClick={onClear}
        className="ml-0.5 p-0.5 rounded-full hover:bg-amber-200 transition-colors cursor-pointer"
        aria-label={`Clear ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function ReportRow({ report }: { report: Report }) {
  const cfg = TYPE_CONFIG[report.reportType];
  const Icon = cfg.icon;

  return (
    <div className={cn(
      "flex items-center gap-4 px-5 py-4 border-b border-slate-100 hover:bg-slate-50/60 transition-colors",
      !report.read && "bg-amber-50/40"
    )}>
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", cfg.iconBg)}>
        <Icon className={cn("w-4 h-4", cfg.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-slate-800 truncate">{report.name}</span>
          {!report.read && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Unread" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <TypePill type={report.reportType} />
          <span className="text-xs text-slate-400">{report.generatedAt}</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-400">{report.size}</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">by {report.generatedBy}</span>
          {report.department !== "All" && (
            <>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">{report.department}</span>
            </>
          )}
        </div>
      </div>
      <StatusBadge status={report.status} />
      <FormatBadge format={report.format} />
      <div className="flex items-center gap-2 flex-shrink-0">
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
        <div className="relative group">
          <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-slate-200 rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
            <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Re-generate
            </button>
            <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 cursor-pointer">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────

const GEN_STATUS_VALUE: Record<GenStatusFilter, ReportStatus | null> = {
  "All": null, "Ready": "ready", "Processing": "processing", "Failed": "failed",
};

const SCHED_STATUS_VALUE: Record<SchedStatusFilter, ScheduledStatus | null> = {
  "All": null, "Active": "active", "Paused": "paused",
};

export default function ReportsPage() {
  const { can } = usePermission();

  // ── Generated Reports state ───────────────────────────────────────────────────
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [genDateRange, setGenDateRange] = useState<DateRange>({ from: null, to: null });
  const [genReportType, setGenReportType] = useState<ReportType | "All">("All");
  const [genDepartment, setGenDepartment] = useState<Department | "All">("All");
  const [genGeneratedBy, setGenGeneratedBy] = useState("All");
  const [genStatus, setGenStatus] = useState<GenStatusFilter>("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Scheduled Reports state ───────────────────────────────────────────────────
  const [schedFrequency, setSchedFrequency] = useState<Frequency | "All">("All");
  const [schedReportType, setSchedReportType] = useState<ReportType | "All">("All");
  const [schedStatus, setSchedStatus] = useState<SchedStatusFilter>("All");

  const [dialogOpen, setDialogOpen] = useState(false);

  // ── Dialog handler ────────────────────────────────────────────────────────────
  const handleGenerate = (input: GeneratedReportInput) => {
    const format = input.format;
    const now = new Date();
    const newReport: Report = {
      id: `R-${Date.now().toString(36).toUpperCase()}`,
      name: input.name,
      reportType: TYPE_MAP[input.type],
      format,
      size: sizeForFormat(format),
      generatedAt: formatGeneratedAt(now),
      generatedDate: now,
      generatedBy: currentUser.name,
      department: input.department as Department | "All",
      status: "ready",
      read: false,
    };
    setReports((prev) => [newReport, ...prev]);
    setGenDateRange({ from: null, to: null });
    setGenReportType("All");
    setGenDepartment("All");
    setGenGeneratedBy("All");
    setGenStatus("All");
    setPage(1);
  };

  // ── Generated Reports filtering ───────────────────────────────────────────────
  const filteredReports = useMemo(() => {
    const statusVal = GEN_STATUS_VALUE[genStatus];
    return reports.filter((r) => {
      if (genDateRange.from && r.generatedDate < genDateRange.from) return false;
      if (genDateRange.to) {
        const toEnd = new Date(genDateRange.to);
        toEnd.setHours(23, 59, 59, 999);
        if (r.generatedDate > toEnd) return false;
      }
      if (genReportType !== "All" && r.reportType !== genReportType) return false;
      if (genDepartment !== "All" && r.department !== "All" && r.department !== genDepartment) return false;
      if (genGeneratedBy !== "All" && r.generatedBy !== genGeneratedBy) return false;
      if (statusVal !== null && r.status !== statusVal) return false;
      return true;
    });
  }, [reports, genDateRange, genReportType, genDepartment, genGeneratedBy, genStatus]);

  const paginatedReports = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, page, pageSize]);

  useEffect(() => { setPage(1); }, [genDateRange, genReportType, genDepartment, genGeneratedBy, genStatus]);

  // ── Scheduled Reports filtering ───────────────────────────────────────────────
  const filteredScheduled = useMemo(() => {
    const statusVal = SCHED_STATUS_VALUE[schedStatus];
    return initialScheduledReports.filter((sr) => {
      if (schedFrequency !== "All" && sr.frequency !== schedFrequency) return false;
      if (schedReportType !== "All" && sr.reportType !== schedReportType) return false;
      if (statusVal !== null && sr.status !== statusVal) return false;
      return true;
    });
  }, [schedFrequency, schedReportType, schedStatus]);

  // ── Active filter chips ───────────────────────────────────────────────────────
  const genActiveFilters: { label: string; value: string; clear: () => void }[] = [];
  if (genDateRange.from || genDateRange.to) {
    const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    const val =
      genDateRange.from && genDateRange.to ? `${fmt(genDateRange.from)} – ${fmt(genDateRange.to)}`
      : genDateRange.from ? `From ${fmt(genDateRange.from)}`
      : `To ${fmt(genDateRange.to!)}`;
    genActiveFilters.push({ label: "Date", value: val, clear: () => setGenDateRange({ from: null, to: null }) });
  }
  if (genReportType !== "All")   genActiveFilters.push({ label: "Type",   value: genReportType,   clear: () => setGenReportType("All") });
  if (genDepartment !== "All")   genActiveFilters.push({ label: "Dept",   value: genDepartment,   clear: () => setGenDepartment("All") });
  if (genGeneratedBy !== "All")  genActiveFilters.push({ label: "By",     value: genGeneratedBy,  clear: () => setGenGeneratedBy("All") });
  if (genStatus !== "All")       genActiveFilters.push({ label: "Status", value: genStatus,       clear: () => setGenStatus("All") });

  const schedActiveFilters: { label: string; value: string; clear: () => void }[] = [];
  if (schedFrequency !== "All")  schedActiveFilters.push({ label: "Frequency", value: schedFrequency,  clear: () => setSchedFrequency("All") });
  if (schedReportType !== "All") schedActiveFilters.push({ label: "Type",      value: schedReportType, clear: () => setSchedReportType("All") });
  if (schedStatus !== "All")     schedActiveFilters.push({ label: "Status",    value: schedStatus,     clear: () => setSchedStatus("All") });

  const unreadCount = reports.filter((r) => !r.read).length;

  if (!can("reports.view")) return <AccessDenied />;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {reports.length} reports · <span className="text-amber-600 font-medium">{unreadCount} unread</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          {can("reports.generate") && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Generate Report
            </button>
          )}
          {can("export.all") && (
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
              <Package className="w-4 h-4" />
              Export All
            </button>
          )}
        </div>
      </div>

      {/* ── Generated Reports ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Generated Reports</h2>
          <p className="text-xs text-slate-400 mt-0.5">{filteredReports.length} of {reports.length} reports</p>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Date Generated</label>
              <DateRangePicker
                value={genDateRange}
                onChange={setGenDateRange}
                presets={REPORT_DATE_PRESETS}
                twoMonth
              />
            </div>
            <FilterSelect
              label="Report Type"
              value={genReportType}
              options={REPORT_TYPES}
              onChange={setGenReportType}
            />
            <FilterSelect
              label="Department"
              value={genDepartment}
              options={DEPARTMENTS}
              onChange={setGenDepartment}
            />
            <FilterSelect
              label="Generated By"
              value={genGeneratedBy}
              options={GENERATED_BY_OPTIONS as string[]}
              onChange={setGenGeneratedBy}
            />
            <FilterSelect
              label="Status"
              value={genStatus}
              options={GEN_STATUSES}
              onChange={setGenStatus}
            />
          </div>

          {genActiveFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
              {genActiveFilters.map((f) => (
                <ActiveFilterChip key={f.label} label={f.label} value={f.value} onClear={f.clear} />
              ))}
              <button
                type="button"
                onClick={() => {
                  setGenDateRange({ from: null, to: null });
                  setGenReportType("All");
                  setGenDepartment("All");
                  setGenGeneratedBy("All");
                  setGenStatus("All");
                }}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium underline-offset-2 hover:underline cursor-pointer ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Reports list */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {filteredReports.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No reports found"
              description="No reports match your current filters. Try adjusting or clearing them."
            />
          ) : (
            paginatedReports.map((report) => <ReportRow key={report.id} report={report} />)
          )}
          <PaginationBar
            total={filteredReports.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
          />
        </div>
      </div>

      {/* ── Scheduled Reports ─────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Scheduled Reports</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatically generated on configured cadence · {filteredScheduled.length} of {initialScheduledReports.length} schedules
          </p>
        </div>

        {/* Filter bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex flex-wrap gap-3 items-end">
            <FilterSelect
              label="Frequency"
              value={schedFrequency}
              options={FREQUENCIES}
              onChange={setSchedFrequency}
            />
            <FilterSelect
              label="Report Type"
              value={schedReportType}
              options={REPORT_TYPES}
              onChange={setSchedReportType}
            />
            <FilterSelect
              label="Status"
              value={schedStatus}
              options={SCHED_STATUSES}
              onChange={setSchedStatus}
            />
          </div>

          {schedActiveFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
              {schedActiveFilters.map((f) => (
                <ActiveFilterChip key={f.label} label={f.label} value={f.value} onClear={f.clear} />
              ))}
              <button
                type="button"
                onClick={() => {
                  setSchedFrequency("All");
                  setSchedReportType("All");
                  setSchedStatus("All");
                }}
                className="text-xs text-slate-500 hover:text-slate-700 font-medium underline-offset-2 hover:underline cursor-pointer ml-1"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Scheduled table or empty state */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          {filteredScheduled.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No scheduled reports found"
              description="No scheduled reports match your current filters."
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs text-slate-500 font-medium py-3 px-5">Report</th>
                  <th className="text-left text-xs text-slate-500 font-medium py-3 px-4">Type</th>
                  <th className="text-left text-xs text-slate-500 font-medium py-3 px-4">Cadence</th>
                  <th className="text-left text-xs text-slate-500 font-medium py-3 px-4">Next Run</th>
                  <th className="text-left text-xs text-slate-500 font-medium py-3 px-4">Recipient(s)</th>
                  <th className="text-left text-xs text-slate-500 font-medium py-3 px-4">Format</th>
                  <th className="text-left text-xs text-slate-500 font-medium py-3 px-4">Status</th>
                  <th className="py-3 px-5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredScheduled.map((sr) => (
                  <tr key={sr.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-5 font-medium text-slate-800">{sr.name}</td>
                    <td className="py-3.5 px-4">
                      <TypePill type={sr.reportType} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{sr.cadence}</td>
                    <td className="py-3.5 px-4 text-slate-600">{sr.nextRun}</td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate" title={sr.recipients}>
                      {sr.recipients}
                    </td>
                    <td className="py-3.5 px-4">
                      <FormatBadge format={sr.format} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium",
                        sr.status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      )}>
                        {sr.status === "active" ? "Active" : "Paused"}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {can("reports.schedule") && (
                        <button className="text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer">
                          Edit Schedule
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <GenerateReportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onGenerate={handleGenerate}
      />
    </div>
  );
}
