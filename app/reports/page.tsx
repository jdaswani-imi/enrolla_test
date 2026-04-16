"use client";

import { useState, useMemo, useEffect } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationBar } from "@/components/ui/pagination-bar";
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
  BarChart2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ReportType = "Digest" | "Revenue" | "Churn" | "Academic" | "Staff" | "Pipeline" | "Attendance";
type ReportFormat = "PDF" | "CSV";

interface Report {
  id: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  size: string;
  generatedAt: string;
  read: boolean;
}

interface ScheduledReport {
  name: string;
  cadence: string;
  nextRun: string;
  recipients: string;
  format: ReportFormat;
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const reports: Report[] = [
  { id: "R-001", name: "Weekly Digest — 14 Apr 2025",          type: "Digest",     format: "PDF", size: "1.2 MB",  generatedAt: "14 Apr 2025, 07:00", read: false },
  { id: "R-002", name: "Churn Risk Report — Term 3",           type: "Churn",      format: "PDF", size: "2.4 MB",  generatedAt: "13 Apr 2025, 00:00", read: false },
  { id: "R-003", name: "Term 3 Revenue Summary",               type: "Revenue",    format: "CSV", size: "84 KB",   generatedAt: "12 Apr 2025, 00:00", read: false },
  { id: "R-004", name: "Academic Alerts Summary — Week 3",     type: "Academic",   format: "PDF", size: "980 KB",  generatedAt: "10 Apr 2025, 07:00", read: true  },
  { id: "R-005", name: "Staff Attendance Report — Mar 2025",   type: "Staff",      format: "CSV", size: "56 KB",   generatedAt: "8 Apr 2025, 07:00",  read: true  },
  { id: "R-006", name: "Lead Pipeline Report — Term 3",        type: "Pipeline",   format: "PDF", size: "1.8 MB",  generatedAt: "5 Apr 2025, 00:00",  read: true  },
  { id: "R-007", name: "Attendance Summary — March 2025",      type: "Attendance", format: "PDF", size: "1.4 MB",  generatedAt: "1 Apr 2025, 07:00",  read: true  },
  { id: "R-008", name: "Revenue by Teacher — Term 2",          type: "Revenue",    format: "CSV", size: "44 KB",   generatedAt: "28 Mar 2025, 00:00", read: true  },
  { id: "R-009", name: "CPD Progress Report — All Staff",      type: "Staff",      format: "PDF", size: "760 KB",  generatedAt: "25 Mar 2025, 07:00", read: true  },
  { id: "R-010", name: "Weekly Digest — 24 Mar 2025",          type: "Digest",     format: "PDF", size: "1.1 MB",  generatedAt: "24 Mar 2025, 07:00", read: true  },
  { id: "R-011", name: "Overdue Invoice Report — Mar 2025",    type: "Revenue",    format: "CSV", size: "38 KB",   generatedAt: "20 Mar 2025, 00:00", read: true  },
  { id: "R-012", name: "Academic Alerts Summary — Week 2",     type: "Academic",   format: "PDF", size: "890 KB",  generatedAt: "14 Mar 2025, 07:00", read: true  },
];

const scheduledReports: ScheduledReport[] = [
  { name: "Weekly Digest",    cadence: "Weekly — Monday 07:00",  nextRun: "21 Apr 2025", recipients: "Jason Daswani",                   format: "PDF" },
  { name: "Churn Risk Report",cadence: "Weekly — Sunday 00:00",  nextRun: "20 Apr 2025", recipients: "Jason Daswani, Sarah Thompson",    format: "PDF" },
  { name: "Revenue Summary",  cadence: "Monthly — 1st",          nextRun: "1 May 2025",  recipients: "Jason Daswani",                   format: "CSV" },
  { name: "Academic Alerts",  cadence: "Weekly — Monday 07:00",  nextRun: "21 Apr 2025", recipients: "Jason Daswani",                   format: "PDF" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ReportType, { label: string; icon: React.ElementType; iconBg: string; iconColor: string }> = {
  Digest:     { label: "Digest",     icon: FileText,      iconBg: "bg-slate-100",   iconColor: "text-slate-500"   },
  Revenue:    { label: "Revenue",    icon: TrendingUp,    iconBg: "bg-emerald-50",  iconColor: "text-emerald-600" },
  Churn:      { label: "Churn",      icon: AlertTriangle, iconBg: "bg-red-50",      iconColor: "text-red-500"     },
  Academic:   { label: "Academic",   icon: BookOpen,      iconBg: "bg-teal-50",     iconColor: "text-teal-600"    },
  Staff:      { label: "Staff",      icon: Users,         iconBg: "bg-purple-50",   iconColor: "text-purple-600"  },
  Pipeline:   { label: "Pipeline",   icon: BarChart2,     iconBg: "bg-amber-50",    iconColor: "text-amber-500"   },
  Attendance: { label: "Attendance", icon: Calendar,      iconBg: "bg-blue-50",     iconColor: "text-blue-600"    },
};

const FILTER_TYPES: (ReportType | "All")[] = ["All", "Revenue", "Attendance", "Churn", "Academic", "Staff", "Pipeline"];
const FILTER_STATUSES = ["All", "Unread", "Read"] as const;
const FILTER_FORMATS: (ReportFormat | "All")[] = ["All", "PDF", "CSV"];
const FILTER_DATES = ["This Month", "Last Month", "This Term", "All Time"] as const;

type StatusFilter = typeof FILTER_STATUSES[number];
type DateFilter = typeof FILTER_DATES[number];

// ─── Components ────────────────────────────────────────────────────────────────

function FormatBadge({ format }: { format: ReportFormat }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide",
      format === "PDF" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
    )}>
      {format}
    </span>
  );
}

function TypePill({ type }: { type: ReportType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
      {cfg.label}
    </span>
  );
}

function FilterChip<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer",
            value === opt
              ? "bg-[#0F172A] text-white"
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function ReportRow({ report }: { report: Report }) {
  const cfg = TYPE_CONFIG[report.type];
  const Icon = cfg.icon;

  return (
    <div className={cn(
      "flex items-center gap-4 px-5 py-4 border-b border-slate-100 hover:bg-slate-50/60 transition-colors",
      !report.read && "bg-amber-50/40"
    )}>
      {/* Icon square */}
      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", cfg.iconBg)}>
        <Icon className={cn("w-4 h-4", cfg.iconColor)} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm text-slate-800 truncate">{report.name}</span>
          {!report.read && (
            <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="Unread" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <TypePill type={report.type} />
          <span className="text-xs text-slate-400">{report.generatedAt}</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-400">{report.size}</span>
        </div>
      </div>

      {/* Format badge */}
      <FormatBadge format={report.format} />

      {/* Actions */}
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
          {/* Dropdown — shown via group-hover for simplicity */}
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [typeFilter, setTypeFilter] = useState<ReportType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [formatFilter, setFormatFilter] = useState<ReportFormat | "All">("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("This Month");
  const [search, setSearch] = useState("");
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => reports.filter((r) => {
    if (typeFilter !== "All" && r.type !== typeFilter) return false;
    if (statusFilter === "Unread" && r.read) return false;
    if (statusFilter === "Read" && !r.read) return false;
    if (formatFilter !== "All" && r.format !== formatFilter) return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [typeFilter, statusFilter, formatFilter, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => { setPage(1); }, [typeFilter, statusFilter, formatFilter, search]);

  const unreadCount = reports.filter((r) => !r.read).length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports Inbox</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {reports.length} reports · <span className="text-amber-600 font-medium">{unreadCount} unread</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm">
            <Plus className="w-4 h-4" />
            Generate Report
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
            <Package className="w-4 h-4" />
            Export All
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap gap-4 items-start">
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Report Type</p>
            <FilterChip options={FILTER_TYPES} value={typeFilter} onChange={setTypeFilter} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Status</p>
            <FilterChip options={FILTER_STATUSES} value={statusFilter} onChange={setStatusFilter} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Format</p>
            <FilterChip options={FILTER_FORMATS} value={formatFilter} onChange={setFormatFilter} />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Date</p>
            <FilterChip options={FILTER_DATES} value={dateFilter} onChange={setDateFilter} />
          </div>
        </div>
        <div>
          <input
            type="text"
            placeholder="Search reports..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 rounded-md border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
          />
        </div>
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No reports found"
            description="No reports match your current filters."
          />
        ) : (
          paginated.map((report) => <ReportRow key={report.id} report={report} />)
        )}
        <PaginationBar
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      </div>

      {/* Scheduled Reports section */}
      <div className="space-y-3">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Scheduled Reports</h2>
          <p className="text-xs text-slate-400 mt-0.5">Automatically generated on configured cadence.</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left text-xs text-slate-500 font-medium py-3 px-5">Report</th>
                <th className="text-left text-xs text-slate-500 font-medium py-3 px-4">Cadence</th>
                <th className="text-left text-xs text-slate-500 font-medium py-3 px-4">Next Run</th>
                <th className="text-left text-xs text-slate-500 font-medium py-3 px-4">Recipient(s)</th>
                <th className="text-left text-xs text-slate-500 font-medium py-3 px-4">Format</th>
                <th className="py-3 px-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {scheduledReports.map((sr) => (
                <tr key={sr.name} className="hover:bg-slate-50/50">
                  <td className="py-3.5 px-5 font-medium text-slate-800">{sr.name}</td>
                  <td className="py-3.5 px-4 text-slate-600">{sr.cadence}</td>
                  <td className="py-3.5 px-4 text-slate-600">{sr.nextRun}</td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate" title={sr.recipients}>
                    {sr.recipients}
                  </td>
                  <td className="py-3.5 px-4">
                    <FormatBadge format={sr.format} />
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button className="text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer">
                      Edit Schedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
