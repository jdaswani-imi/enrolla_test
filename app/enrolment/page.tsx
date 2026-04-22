"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreHorizontal,
  BookOpen,
  RefreshCw,
  UserMinus,
  Eye,
  Download,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  UserPlus,
  XCircle,
} from "lucide-react";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { DateRangePicker, DATE_PRESETS, type DateRange } from "@/components/ui/date-range-picker";
import { SortableHeader } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { ExportDialog } from "@/components/ui/export-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  enrolments as seedEnrolments,
  trials,
  withdrawals as seedWithdrawals,
  students,
  type Enrolment,
  type EnrolmentStatus,
  type EnrolmentInvoiceStatus,
  type Withdrawal,
  type Trial,
  type TrialOutcome,
} from "@/lib/mock-data";
import {
  LogTrialOutcomeDialog,
  ConvertTrialDialog,
  CancelTrialDialog,
} from "@/components/enrolment/trial-action-dialogs";

const WITHDRAW_REASONS = [
  "Relocating",
  "Cost",
  "Schedule conflict",
  "Academic fit",
  "Other",
] as const;
type WithdrawReason = (typeof WITHDRAW_REASONS)[number];

const RETENTION_OPTIONS = [
  "Offered session credit",
  "Offered schedule change",
  "Spoke with guardian",
  "Offered trial pause",
] as const;

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-teal-100",  text: "text-teal-700"  },
  { bg: "bg-blue-100",  text: "text-blue-700"  },
  { bg: "bg-violet-100",text: "text-violet-700"},
  { bg: "bg-rose-100",  text: "text-rose-700"  },
  { bg: "bg-emerald-100",text:"text-emerald-700"},
];

function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─── Badge classes ────────────────────────────────────────────────────────────

function getEnrolmentStatusClass(status: EnrolmentStatus): string {
  switch (status) {
    case "Active":    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Pending":   return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Expiring":  return "bg-orange-100 text-orange-700 border border-orange-200";
    case "Expired":   return "bg-slate-100 text-slate-500 border border-slate-200";
    case "Withdrawn": return "bg-red-100 text-red-700 border border-red-200";
  }
}

function getInvoiceStatusClass(status: EnrolmentInvoiceStatus | "Paid" | "Pending"): string {
  switch (status) {
    case "Paid":    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Part":    return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Overdue": return "bg-red-100 text-red-700 border border-red-200";
    case "Pending": return "bg-slate-100 text-slate-500 border border-slate-200";
    default:        return "bg-slate-100 text-slate-500 border border-slate-200";
  }
}

function getRowTintClass(status: EnrolmentStatus): string {
  switch (status) {
    case "Expiring": return "bg-orange-50";
    case "Expired":  return "bg-slate-50";
    case "Pending":  return "bg-amber-50";
    default:         return "";
  }
}

// ─── Session Dot Visualisation ────────────────────────────────────────────────

function SessionDots({ total, remaining }: { total: number; remaining: number }) {
  const consumed = total - remaining;
  // Build dot array: consumed first (could be attended or absent — simplified to green/red pattern)
  // For slide-over: first 14 green (attended), 2 red (absent), rest empty
  // Generic: show consumed as green, remaining as empty
  const dots = Array.from({ length: total }, (_, i) => {
    if (i < consumed) return "green";
    return "empty";
  });

  const row1 = dots.slice(0, 10);
  const row2 = dots.slice(10);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {row1.map((type, i) => (
          <span
            key={i}
            className={cn(
              "w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold",
              type === "green" && "bg-emerald-500 border-emerald-600 text-white",
              type === "empty" && "bg-white border-slate-300 text-slate-300"
            )}
          >
            {type === "green" ? "✓" : "○"}
          </span>
        ))}
      </div>
      {row2.length > 0 && (
        <div className="flex gap-1.5">
          {row2.map((type, i) => (
            <span
              key={i}
              className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold",
                type === "green" && "bg-emerald-500 border-emerald-600 text-white",
                type === "empty" && "bg-white border-slate-300 text-slate-300"
              )}
            >
              {type === "green" ? "✓" : "○"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Detailed session dots for slide-over (E-001 specific: 14 green, 2 red, 4 empty)
function SessionDotsDetailed({ total, attended, absent }: { total: number; attended: number; absent: number }) {
  const dots = Array.from({ length: total }, (_, i) => {
    if (i < attended) return "green";
    if (i < attended + absent) return "red";
    return "empty";
  });

  const row1 = dots.slice(0, 10);
  const row2 = dots.slice(10);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {row1.map((type, i) => (
          <span
            key={i}
            className={cn(
              "w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold",
              type === "green" && "bg-emerald-500 border-emerald-600 text-white",
              type === "red"   && "bg-red-400 border-red-500 text-white",
              type === "empty" && "bg-white border-slate-300 text-slate-300"
            )}
          >
            {type === "green" ? "✓" : type === "red" ? "✗" : "○"}
          </span>
        ))}
      </div>
      {row2.length > 0 && (
        <div className="flex gap-1.5">
          {row2.map((type, i) => (
            <span
              key={i}
              className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold",
                type === "green" && "bg-emerald-500 border-emerald-600 text-white",
                type === "red"   && "bg-red-400 border-red-500 text-white",
                type === "empty" && "bg-white border-slate-300 text-slate-300"
              )}
            >
              {type === "green" ? "✓" : type === "red" ? "✗" : "○"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sessions Progress Cell ───────────────────────────────────────────────────

function SessionsProgress({ total, remaining }: { total: number; remaining: number }) {
  const consumed = total - remaining;
  const pct = total > 0 ? (consumed / total) * 100 : 0;

  return (
    <div className="min-w-[72px]">
      <span className="text-sm text-slate-700 font-medium">
        {consumed} / {total}
      </span>
      <div className="mt-1 h-1 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: "amber" | "red" | "none";
}

function StatCard({ label, value, accent = "none" }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-col gap-1",
        accent === "amber" && "border-l-4 border-l-amber-400",
        accent === "red"   && "border-l-4 border-l-red-400"
      )}
    >
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-slate-800">{value}</span>
    </div>
  );
}

// ─── Three-dot Menu ───────────────────────────────────────────────────────────

interface ActionMenuItem {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  separatorAbove?: boolean;
  onClick?: () => void;
}

function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Row actions"
      >
        <MoreHorizontal className="w-4 h-4 text-slate-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[180px] py-1">
            {items.map((item, i) => (
              <div key={i}>
                {item.separatorAbove && i > 0 && (
                  <div className="my-1 border-t border-slate-100" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); item.onClick?.(); setOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 transition-colors cursor-pointer",
                    item.danger ? "text-red-600" : "text-slate-700"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Enrolment Detail Slide-Over ──────────────────────────────────────────────

function EnrolmentSlideOver({
  enrolment,
  onClose,
  onWithdraw,
}: {
  enrolment: Enrolment;
  onClose: () => void;
  onWithdraw: (enrolment: Enrolment) => void;
}) {
  const { can } = usePermission();
  const palette = getAvatarPalette(enrolment.student);
  const initials = getInitials(enrolment.student);
  const consumed = enrolment.sessionsTotal - enrolment.sessionsRemaining;

  // Derive attended/absent for detail view (simplified approximation)
  const absent = Math.max(0, Math.round(consumed * 0.12));
  const attended = consumed - absent;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[560px] max-h-[80vh]">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-5 pr-12 border-b border-slate-200 flex-row items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
              palette.bg,
              palette.text
            )}
          >
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle className="text-base font-semibold text-slate-800">{enrolment.student}</DialogTitle>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                {enrolment.yearGroup}
              </span>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  getEnrolmentStatusClass(enrolment.enrolmentStatus)
                )}
              >
                {enrolment.enrolmentStatus}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{enrolment.subject}</p>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">
          {/* Details Grid */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Enrolment Details
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: "Student",          value: `${enrolment.student} (${enrolment.studentId})` },
                { label: "Subject",          value: enrolment.subject },
                { label: "Department",       value: enrolment.department },
                { label: "Teacher",          value: enrolment.teacher },
                { label: "Term",             value: "Term 3, 2024–25" },
                { label: "Start Date",       value: "14 Apr 2026" },
                { label: "Sessions Total",   value: String(enrolment.sessionsTotal) },
                { label: "Sessions Remaining", value: String(enrolment.sessionsRemaining) },
                { label: "Frequency",        value: enrolment.frequency },
                { label: "Package",          value: enrolment.package },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="text-xs text-slate-400 block mb-0.5">{label}</span>
                  <span className="text-sm text-slate-700 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Invoice
            </h3>
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">INV-1042</span>
                    <span className="text-sm text-slate-600">— AED 3,360</span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        getInvoiceStatusClass(enrolment.invoiceStatus)
                      )}
                    >
                      {enrolment.invoiceStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Due 20 Apr 2026</p>
                </div>
              </div>
              <button className="text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer transition-colors">
                View Invoice
              </button>
            </div>
          </div>

          {/* Session Dots */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Session Progress
            </h3>
            <SessionDotsDetailed
              total={enrolment.sessionsTotal}
              attended={attended}
              absent={absent}
            />
            <div className="flex gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                Attended ({attended})
              </span>
              {absent > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                  Absent ({absent})
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-white border border-slate-300 inline-block" />
                Remaining ({enrolment.sessionsRemaining})
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="flex items-center gap-2 flex-wrap">
          <button className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer">
            Extend Package
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
            Add Subject
          </button>
          {can('enrolment.withdraw') && (
            <button
              type="button"
              onClick={() => onWithdraw(enrolment)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              Withdraw
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab 1 — Active Enrolments ────────────────────────────────────────────────

function ActiveEnrolmentsTab() {
  const { can } = usePermission();
  const router = useRouter();
  const [, bumpVersion] = useState(0);
  const forceRefresh = () => bumpVersion((v) => v + 1);

  const [exportOpen, setExportOpen] = useState(false);
  const [dept, setDept]     = useState<string[]>([]);
  const [status, setStatus] = useState<string[]>([]);
  const [year, setYear]     = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [enrolledOnRange, setEnrolledOnRange] = useState<DateRange>({ from: null, to: null });
  const [selected, setSelected] = useState<Enrolment | null>(null);
  const [withdrawTarget, setWithdrawTarget] = useState<Enrolment | null>(null);

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("asc");
  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(20);
  useEffect(() => { setPage(1); }, [dept, status, year, search, enrolledOnRange]);

  function applyWithdraw(data: WithdrawConfirmData) {
    createWithdrawals(data);
    forceRefresh();
    setWithdrawTarget(null);
    toast.success(buildWithdrawToast(data));
  }

  const filtered = useMemo(() => {
    let data = seedEnrolments.filter((e) => {
      if (e.enrolmentStatus === "Withdrawn")                               return false;
      if (dept.length > 0   && !dept.includes(e.department))               return false;
      if (status.length > 0 && !status.includes(e.enrolmentStatus))        return false;
      if (year.length > 0   && !year.includes(e.yearGroup))                return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.student.toLowerCase().includes(q) && !e.subject.toLowerCase().includes(q)) return false;
      }
      if (enrolledOnRange.from || enrolledOnRange.to) {
        const d = e.enrolledOn ? new Date(e.enrolledOn) : null;
        if (!d || isNaN(d.getTime())) return false;
        if (enrolledOnRange.from && d < enrolledOnRange.from) return false;
        if (enrolledOnRange.to) {
          const to = new Date(enrolledOnRange.to); to.setHours(23, 59, 59, 999);
          if (d > to) return false;
        }
      }
      return true;
    });
    if (sortField) {
      data = [...data].sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sortField];
        const bv = (b as unknown as Record<string, unknown>)[sortField];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [dept, status, year, search, enrolledOnRange, sortField, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Enrolments" value="3,847" />
        <StatCard label="New This Term"      value="143"   />
        <StatCard label="Pending Payment"    value="12"    accent="amber" />
        <StatCard label="Expiring This Week" value="8"     accent="red"   />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectFilter label="Department" options={["Primary", "Lower Secondary", "Senior"]} selected={dept} onChange={setDept} />
        <MultiSelectFilter label="Status" options={["Active", "Pending", "Expiring", "Expired"]} selected={status} onChange={setStatus} />
        <MultiSelectFilter label="Year Group" options={["Y1","Y2","Y3","Y4","Y5","Y6","Y7","Y8","Y9","Y10","Y11","Y12","Y13"]} selected={year} onChange={setYear} />

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all placeholder:text-slate-400"
          />
        </div>

        <DateRangePicker
          value={enrolledOnRange}
          onChange={setEnrolledOnRange}
          presets={DATE_PRESETS}
          placeholder="Enrolled on"
        />

        <div className="ml-auto flex items-center gap-2">
          {can('export') && (
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          {can('enrolment.create') && (
            <button className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
              New Enrolment
            </button>
          )}
        </div>
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Enrolments"
        recordCount={3847}
        formats={[
          { id: 'csv-summary', label: 'Enrolment Summary', description: 'One row per enrolment. Student, subject, teacher, sessions, status.', icon: 'rows', recommended: true },
          { id: 'csv-invoiced', label: 'With Invoice Data', description: 'Includes invoice status and payment information per enrolment.', icon: 'items' },
        ]}
      />

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <SortableHeader label="Student"   field="student"          sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Year"      field="yearGroup"        sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Subject"   field="subject"          sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Teacher"   field="teacher"          sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Sessions</th>
                <SortableHeader label="Frequency" field="frequency"        sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Package</th>
                <SortableHeader label="Invoice"   field="invoiceStatus"    sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Status"    field="enrolmentStatus"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((enr) => {
                const palette = getAvatarPalette(enr.student);
                const initials = getInitials(enr.student);
                const rowTint = getRowTintClass(enr.enrolmentStatus);

                return (
                  <tr
                    key={enr.id}
                    onClick={() => setSelected(enr)}
                    className={cn(
                      "border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer group",
                      rowTint
                    )}
                  >
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                            palette.bg,
                            palette.text
                          )}
                        >
                          {initials}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 whitespace-nowrap">{enr.student}</div>
                          <div className="text-xs text-slate-400">{enr.studentId}</div>
                        </div>
                      </div>
                    </td>

                    {/* Year */}
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">
                        {enr.yearGroup}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{enr.subject}</td>

                    {/* Teacher */}
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{enr.teacher}</td>

                    {/* Sessions */}
                    <td className="px-4 py-3">
                      <SessionsProgress
                        total={enr.sessionsTotal}
                        remaining={enr.sessionsRemaining}
                      />
                    </td>

                    {/* Frequency */}
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{enr.frequency}</td>

                    {/* Package */}
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{enr.package}</td>

                    {/* Invoice Status */}
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", getInvoiceStatusClass(enr.invoiceStatus))}>
                        {enr.invoiceStatus}
                      </span>
                    </td>

                    {/* Enrolment Status */}
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", getEnrolmentStatusClass(enr.enrolmentStatus))}>
                        {enr.enrolmentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        items={[
                          { label: "View Student", icon: <Eye className="w-3.5 h-3.5" />, onClick: () => router.push(`/students/${enr.studentId}`) },
                          ...(can('enrolment.edit') ? [{ label: "Edit Enrolment", icon: <BookOpen className="w-3.5 h-3.5" /> }] : []),
                          ...(can('enrolment.edit') ? [{ label: "Add Subject", icon: <Plus className="w-3.5 h-3.5" /> }] : []),
                          ...(can('enrolment.withdraw') ? [{ label: "Withdraw", icon: <UserMinus className="w-3.5 h-3.5" />, danger: true as const, onClick: () => setWithdrawTarget(enr) }] : []),
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">
                    No enrolments match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      </div>

      {/* Slide-over */}
      {selected && (
        <EnrolmentSlideOver
          enrolment={selected}
          onClose={() => setSelected(null)}
          onWithdraw={(e) => { setSelected(null); setWithdrawTarget(e); }}
        />
      )}

      {/* Withdraw dialog */}
      {withdrawTarget && (
        <WithdrawEnrolmentDialog
          initialEnrolment={withdrawTarget}
          onClose={() => setWithdrawTarget(null)}
          onConfirm={applyWithdraw}
        />
      )}
    </div>
  );
}

// ─── Tab 2 — Trials ───────────────────────────────────────────────────────────

function departmentForYearGroup(yg: string): string {
  const n = parseInt(yg.replace(/\D/g, ""), 10);
  if (isNaN(n)) return "Primary";
  if (n <= 6) return "Primary";
  if (n <= 9) return "Lower Secondary";
  return "Senior";
}

function TrialsTab() {
  const [, bumpVersion] = useState(0);
  const forceRefresh = () => bumpVersion((v) => v + 1);

  const [logTrial, setLogTrial] = useState<Trial | null>(null);
  const [convertTrial, setConvertTrial] = useState<Trial | null>(null);
  const [cancelTrial, setCancelTrial] = useState<Trial | null>(null);

  function getOutcomeClass(outcome: string): string {
    if (outcome.startsWith("Recommended") || outcome === "Converted")
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    if (outcome === "Parent to decide" || outcome === "Needs More Time")
      return "bg-amber-100 text-amber-700 border border-amber-200";
    if (outcome === "Not recommended" || outcome === "Not Interested" || outcome === "Cancelled")
      return "bg-red-100 text-red-700 border border-red-200";
    if (outcome === "No Show")
      return "bg-slate-200 text-slate-600 border border-slate-300";
    return "bg-slate-100 text-slate-500 border border-slate-200";
  }

  function applyLogOutcome(
    trial: Trial,
    patch: { outcome: TrialOutcome; notes: string; followUpDate?: string },
  ) {
    const idx = trials.findIndex((x) => x.id === trial.id);
    if (idx < 0) return;
    trials[idx] = {
      ...trials[idx],
      outcome: patch.outcome,
      notes: patch.notes,
      followUpDate: patch.followUpDate,
    };
    forceRefresh();
  }

  function applyConvert(trial: Trial) {
    const idx = trials.findIndex((x) => x.id === trial.id);
    if (idx >= 0) {
      trials[idx] = { ...trials[idx], outcome: "Converted" };
    }
    const nextNum = seedEnrolments.length + 1;
    seedEnrolments.push({
      id: `E-${String(nextNum).padStart(3, "0")}`,
      studentId: `IMI-T-${trial.id.replace("T-", "")}`,
      student: trial.student,
      yearGroup: trial.yearGroup,
      department: departmentForYearGroup(trial.yearGroup),
      subject: trial.subject,
      teacher: trial.teacher,
      sessionsTotal: 20,
      sessionsRemaining: 20,
      frequency: "1×/week",
      package: "Term — 20 sessions",
      invoiceStatus: "Pending",
      enrolmentStatus: "Pending",
    });
    forceRefresh();
  }

  function applyCancel(trial: Trial, reason: string) {
    const idx = trials.findIndex((x) => x.id === trial.id);
    if (idx < 0) return;
    trials[idx] = { ...trials[idx], outcome: "Cancelled", cancellationReason: reason };
    forceRefresh();
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Trials This Term"        value="18" />
        <StatCard label="Pending Outcome"         value="3"  accent="amber" />
        <StatCard label="Converted to Enrolment"  value="14" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Student","Year","Subject","Teacher","Trial Date","Invoice","Outcome","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trials.map((t) => {
                const palette  = getAvatarPalette(t.student);
                const initials = getInitials(t.student);

                return (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0", palette.bg, palette.text)}>
                          {initials}
                        </div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{t.student}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">{t.yearGroup}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{t.subject}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.teacher}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.trialDate}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium",
                        t.invoiceStatus === "Paid"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      )}>
                        {t.invoiceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", getOutcomeClass(t.outcome))}>
                        {t.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ActionMenu
                        items={[
                          {
                            label: "Log Outcome",
                            icon: <ClipboardCheck className="w-3.5 h-3.5" />,
                            onClick: () => setLogTrial(t),
                          },
                          {
                            label: "Convert to Enrolment",
                            icon: <UserPlus className="w-3.5 h-3.5" />,
                            onClick: () => setConvertTrial(t),
                          },
                          {
                            label: "Cancel Trial",
                            icon: <XCircle className="w-3.5 h-3.5" />,
                            danger: true,
                            separatorAbove: true,
                            onClick: () => setCancelTrial(t),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <LogTrialOutcomeDialog
        trial={logTrial}
        open={logTrial !== null}
        onOpenChange={(o) => { if (!o) setLogTrial(null); }}
        onSave={(patch) => { if (logTrial) applyLogOutcome(logTrial, patch); }}
      />
      <ConvertTrialDialog
        trial={convertTrial}
        open={convertTrial !== null}
        onOpenChange={(o) => { if (!o) setConvertTrial(null); }}
        onConfirm={() => { if (convertTrial) applyConvert(convertTrial); }}
      />
      <CancelTrialDialog
        trial={cancelTrial}
        open={cancelTrial !== null}
        onOpenChange={(o) => { if (!o) setCancelTrial(null); }}
        onConfirm={(reason) => { if (cancelTrial) applyCancel(cancelTrial, reason); }}
      />
    </div>
  );
}

// ─── Tab 3 — Withdrawals ──────────────────────────────────────────────────────

function WithdrawalsTab() {
  const router = useRouter();
  const [, bumpVersion] = useState(0);
  const forceRefresh = () => bumpVersion((v) => v + 1);

  const [reinstateTarget, setReinstateTarget] = useState<Withdrawal | null>(null);
  const [initiateOpen, setInitiateOpen] = useState(false);
  const [withdrawalDateRange, setWithdrawalDateRange] = useState<DateRange>({ from: null, to: null });

  const displayedWithdrawals = useMemo(() => seedWithdrawals.filter((w) => {
    if (!withdrawalDateRange.from && !withdrawalDateRange.to) return true;
    if (w.withdrawalDate === 'Pending') return true;
    const d = new Date(w.withdrawalDate);
    if (isNaN(d.getTime())) return true;
    if (withdrawalDateRange.from && d < withdrawalDateRange.from) return false;
    if (withdrawalDateRange.to) {
      const to = new Date(withdrawalDateRange.to); to.setHours(23, 59, 59, 999);
      if (d > to) return false;
    }
    return true;
  }), [withdrawalDateRange]);

  function applyInitiate(data: WithdrawConfirmData) {
    createWithdrawals(data);
    forceRefresh();
    setInitiateOpen(false);
    toast.success(buildWithdrawToast(data));
  }

  function getInvoiceCellClass(status: string): string {
    if (status === "Overdue") return "bg-red-50";
    return "";
  }

  function handleViewProfile(w: Withdrawal) {
    const id = w.studentId ?? students.find((s) => s.name === w.student)?.id;
    if (id) {
      router.push(`/students/${id}`);
    } else {
      toast.error("Student profile not found");
    }
  }

  function applyReinstate(w: Withdrawal) {
    if (w.enrolmentId) {
      const idx = seedEnrolments.findIndex((x) => x.id === w.enrolmentId);
      if (idx >= 0) {
        seedEnrolments[idx] = { ...seedEnrolments[idx], enrolmentStatus: "Active" };
      }
    }
    const wIdx = seedWithdrawals.findIndex((x) => x.id === w.id);
    if (wIdx >= 0) seedWithdrawals.splice(wIdx, 1);
    forceRefresh();
    setReinstateTarget(null);
    toast.success(`${w.student} reinstated successfully`);
  }

  function applyResolve(w: Withdrawal) {
    const idx = seedWithdrawals.findIndex((x) => x.id === w.id);
    if (idx >= 0) {
      seedWithdrawals.splice(idx, 1, { ...seedWithdrawals[idx], recordStatus: "Resolved" });
    }
    forceRefresh();
    toast.success("Marked as resolved");
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-2 gap-4 flex-1">
          <StatCard label="Withdrawn This Term" value="31" />
          <StatCard label="Pending Withdrawal"  value="2"  accent="amber" />
        </div>
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setInitiateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <UserMinus className="w-3.5 h-3.5" />
            Initiate Withdrawal
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <DateRangePicker
          value={withdrawalDateRange}
          onChange={setWithdrawalDateRange}
          presets={DATE_PRESETS}
          placeholder="Withdrawal date"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Student","Year","Department","Subjects","Withdrawal Date","Reason","Invoice","Status","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayedWithdrawals.map((w) => {
                const palette  = getAvatarPalette(w.student);
                const initials = getInitials(w.student);
                const isPending = w.withdrawalDate === "Pending";
                const isResolved = w.recordStatus === "Resolved";
                const rowClass  = isResolved ? "bg-slate-50/70" : isPending ? "bg-amber-50" : "";
                const invoiceCellClass = getInvoiceCellClass(w.invoiceStatus);

                return (
                  <tr key={w.id} className={cn("border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors", rowClass)}>
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0", palette.bg, palette.text)}>
                          {initials}
                        </div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{w.student}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">{w.yearGroup}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{w.department}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {w.subjects.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 text-xs rounded bg-slate-100 text-slate-600">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {isPending ? (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium">Pending</span>
                      ) : (
                        w.withdrawalDate
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{w.reason}</td>
                    <td className={cn("px-4 py-3", invoiceCellClass)}>
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", getInvoiceStatusClass(w.invoiceStatus as EnrolmentInvoiceStatus))}>
                        {w.invoiceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isResolved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Resolved
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          Open
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActionMenu
                        items={[
                          { label: "View Student Profile", icon: <Eye className="w-3.5 h-3.5" />, onClick: () => handleViewProfile(w) },
                          { label: "Reinstate Enrolment",  icon: <RefreshCw className="w-3.5 h-3.5" />, onClick: () => setReinstateTarget(w) },
                          ...(isResolved ? [] : [{ label: "Mark as Resolved", icon: <CheckCircle2 className="w-3.5 h-3.5" />, onClick: () => applyResolve(w) }]),
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
              {seedWithdrawals.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-400">
                    No withdrawals on record.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reinstateTarget && (
        <ReinstateConfirmDialog
          withdrawal={reinstateTarget}
          onClose={() => setReinstateTarget(null)}
          onConfirm={() => applyReinstate(reinstateTarget)}
        />
      )}

      {initiateOpen && (
        <WithdrawEnrolmentDialog
          pickStudent
          onClose={() => setInitiateOpen(false)}
          onConfirm={applyInitiate}
        />
      )}
    </div>
  );
}

// ─── Withdraw Enrolment Dialog ────────────────────────────────────────────────

interface WithdrawConfirmData {
  enrolments: Enrolment[];
  reason: WithdrawReason;
  notes: string;
  retention: string[];
  fullWithdrawal: boolean;
}

function createWithdrawals(data: WithdrawConfirmData) {
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const stamp = Date.now().toString(36).toUpperCase();
  data.enrolments.forEach((enrolment, i) => {
    const idx = seedEnrolments.findIndex((x) => x.id === enrolment.id);
    if (idx >= 0) {
      seedEnrolments[idx] = { ...seedEnrolments[idx], enrolmentStatus: "Withdrawn" };
    }
    seedWithdrawals.unshift({
      id: `W-${stamp}-${i}`,
      student: enrolment.student,
      studentId: enrolment.studentId,
      enrolmentId: enrolment.id,
      yearGroup: enrolment.yearGroup,
      department: enrolment.department,
      subjects: [enrolment.subject],
      withdrawalDate: today,
      reason: data.reason,
      invoiceStatus: enrolment.invoiceStatus,
      notes: data.notes || undefined,
      sessionsRemaining: enrolment.sessionsRemaining,
      recordStatus: "Active",
    });
  });
  if (data.fullWithdrawal && data.enrolments.length > 0) {
    const sId = data.enrolments[0].studentId;
    const sIdx = students.findIndex((s) => s.id === sId);
    if (sIdx >= 0) students[sIdx] = { ...students[sIdx], status: "Withdrawn" };
  }
}

function buildWithdrawToast(data: WithdrawConfirmData): string {
  const first = data.enrolments[0];
  if (!first) return "Withdrawal recorded";
  if (data.fullWithdrawal) return `${first.student} fully withdrawn`;
  if (data.enrolments.length === 1) return `${first.student} withdrawn from ${first.subject}`;
  return `${first.student} withdrawn from ${data.enrolments.length} subjects`;
}

function WithdrawEnrolmentDialog({
  initialEnrolment,
  pickStudent,
  onClose,
  onConfirm,
}: {
  initialEnrolment?: Enrolment;
  pickStudent?: boolean;
  onClose: () => void;
  onConfirm: (data: WithdrawConfirmData) => void;
}) {
  const [studentId, setStudentId] = useState<string>(initialEnrolment?.studentId ?? "");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentPickerOpen, setStudentPickerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initialEnrolment ? [initialEnrolment.id] : []
  );
  const [reason, setReason] = useState<WithdrawReason | "">("");
  const [notes, setNotes] = useState("");
  const [retention, setRetention] = useState<string[]>([]);

  const studentActiveEnrolments = useMemo(
    () => seedEnrolments.filter((e) => e.studentId === studentId && e.enrolmentStatus !== "Withdrawn"),
    [studentId]
  );

  const selectedStudent = useMemo(() => students.find((s) => s.id === studentId), [studentId]);
  const studentName = selectedStudent?.name ?? initialEnrolment?.student ?? "";

  const studentOptions = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return students
      .filter((s) => s.status === "Active")
      .filter((s) => {
        if (!q) return true;
        return s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [studentSearch]);

  const allSelected =
    studentActiveEnrolments.length > 0 &&
    selectedIds.length === studentActiveEnrolments.length;

  const totalRemaining = useMemo(
    () =>
      studentActiveEnrolments
        .filter((e) => selectedIds.includes(e.id))
        .reduce((sum, e) => sum + e.sessionsRemaining, 0),
    [studentActiveEnrolments, selectedIds]
  );

  function toggleSubject(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleSelectAll() {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(studentActiveEnrolments.map((e) => e.id));
  }
  function toggleRetention(option: string) {
    setRetention((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]));
  }

  function pickStudentById(id: string) {
    setStudentId(id);
    setSelectedIds([]);
    setStudentPickerOpen(false);
    setStudentSearch("");
  }

  const canConfirm = !!studentId && !!reason && selectedIds.length > 0;

  function handleConfirm() {
    if (!canConfirm) return;
    const chosen = studentActiveEnrolments.filter((e) => selectedIds.includes(e.id));
    onConfirm({
      enrolments: chosen,
      reason: reason as WithdrawReason,
      notes,
      retention,
      fullWithdrawal: allSelected,
    });
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[560px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-base">Withdraw Enrolment</DialogTitle>
          <p className="text-sm text-slate-500 mt-1">
            {studentId
              ? `${studentName}${selectedIds.length > 0 ? ` — ${selectedIds.length} subject${selectedIds.length === 1 ? "" : "s"} selected` : ""}`
              : "Choose a student and the subjects to withdraw from."}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
          {/* Student picker — only when no student is pre-selected */}
          {pickStudent && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Student <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={studentPickerOpen || !studentId ? studentSearch : `${studentName} (${studentId})`}
                  onFocus={() => { setStudentPickerOpen(true); setStudentSearch(""); }}
                  onChange={(e) => { setStudentSearch(e.target.value); setStudentPickerOpen(true); }}
                  placeholder="Search by name or student ID…"
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all placeholder:text-slate-400"
                />
                {studentPickerOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setStudentPickerOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-64 overflow-y-auto py-1">
                      {studentOptions.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-400">No matching students.</div>
                      ) : (
                        studentOptions.map((s) => {
                          const pal = getAvatarPalette(s.name);
                          const init = getInitials(s.name);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => pickStudentById(s.id)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0", pal.bg, pal.text)}>
                                {init}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-slate-800 font-medium truncate">{s.name}</div>
                                <div className="text-xs text-slate-400">{s.id} · {s.yearGroup}</div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Subject multi-select */}
          {studentId && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Withdraw from which subjects? <span className="text-red-500">*</span>
                </label>
                {studentActiveEnrolments.length > 1 && (
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700 cursor-pointer"
                  >
                    {allSelected ? "Clear all" : "Select all"}
                  </button>
                )}
              </div>
              {studentActiveEnrolments.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-500">
                  This student has no active enrolments to withdraw from.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {studentActiveEnrolments.map((e) => {
                    const checked = selectedIds.includes(e.id);
                    return (
                      <label
                        key={e.id}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors select-none",
                          checked
                            ? "border-amber-300 bg-amber-50"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSubject(e.id)}
                          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-300 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-800">{e.subject}</span>
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                getEnrolmentStatusClass(e.enrolmentStatus)
                              )}
                            >
                              {e.enrolmentStatus}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {e.teacher} · {e.sessionsRemaining} of {e.sessionsTotal} sessions remaining
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}

              {allSelected && studentActiveEnrolments.length > 0 && (
                <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>This will fully withdraw the student.</span>
                </div>
              )}
            </div>
          )}

          {/* Sessions warning — shown once a selection exists */}
          {studentId && selectedIds.length > 0 && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
              <span>
                <strong>{totalRemaining}</strong> session{totalRemaining === 1 ? "" : "s"} remaining across the selected subject{selectedIds.length === 1 ? "" : "s"} will be noted on the record.
              </span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as WithdrawReason)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
            >
              <option value="" disabled>Select a reason…</option>
              {WITHDRAW_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
              Notes <span className="text-slate-400 font-normal normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any context for this withdrawal…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Retention checklist */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">
              Retention Checklist
            </label>
            <div className="space-y-2">
              {RETENTION_OPTIONS.map((option) => {
                const checked = retention.includes(option);
                return (
                  <label
                    key={option}
                    className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRetention(option)}
                      className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-300 cursor-pointer"
                    />
                    {option}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!reason}
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            Confirm Withdrawal
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reinstate Confirmation Dialog ────────────────────────────────────────────

function ReinstateConfirmDialog({
  withdrawal,
  onClose,
  onConfirm,
}: {
  withdrawal: Withdrawal;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="text-base">Reinstate Enrolment?</DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-3 text-sm">
          <p className="text-slate-600">
            This will move the enrolment back to Active and remove it from the withdrawals list.
          </p>
          <dl className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Student</dt>
              <dd className="font-medium text-slate-800 text-right">{withdrawal.student}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Subject{withdrawal.subjects.length > 1 ? "s" : ""}</dt>
              <dd className="font-medium text-slate-800 text-right">{withdrawal.subjects.join(", ")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Withdrawal reason</dt>
              <dd className="font-medium text-slate-800 text-right">{withdrawal.reason}</dd>
            </div>
          </dl>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
          >
            Reinstate
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "enrolments", label: "Active Enrolments" },
  { id: "trials",     label: "Trials"            },
  { id: "withdrawals",label: "Withdrawals"        },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function EnrolmentPage() {
  const { can } = usePermission();
  const [activeTab, setActiveTab] = useState<TabId>("enrolments");

  if (!can('enrolment.view')) return <AccessDenied />;

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Enrolment</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage active enrolments, trials, and withdrawals.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer relative",
              activeTab === tab.id
                ? "text-slate-800"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "enrolments"  && <ActiveEnrolmentsTab />}
      {activeTab === "trials"      && <TrialsTab />}
      {activeTab === "withdrawals" && <WithdrawalsTab />}
    </div>
  );
}
