"use client";

import { useState, useMemo, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Send,
  CalendarCheck,
  Eye,
  X,
  Info,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { getAvatarPalette, getInitials, type Assessment, type AssessmentStatus } from "@/lib/mock-data";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { SortableHeader } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { DateRangePicker, DATE_PRESETS, type DateRange } from "@/components/ui/date-range-picker";

// ─── Status / type pill classes ───────────────────────────────────────────────

function statusClass(status: AssessmentStatus): string {
  switch (status) {
    case "Booked":           return "bg-blue-100 text-blue-700 border border-blue-200";
    case "Link Sent":        return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Awaiting Booking": return "bg-slate-100 text-slate-600 border border-slate-200";
    case "Completed":        return "bg-green-100 text-green-700 border border-green-200";
  }
}

function typeClass(type: "Lead" | "Student"): string {
  return type === "Lead"
    ? "bg-purple-100 text-purple-700"
    : "bg-teal-100 text-teal-700";
}

function outcomeClass(outcome: string): string {
  if (outcome.startsWith("Recommended ✅") || outcome === "Recommended") return "bg-green-100 text-green-700 border border-green-200";
  if (outcome.startsWith("Not recommended") || outcome === "Not recommended") return "bg-red-100 text-red-700 border border-red-200";
  return "bg-amber-100 text-amber-700 border border-amber-200";
}

// ─── RowActionMenu ────────────────────────────────────────────────────────────

function RowActionMenu({ assessmentId, onCancel }: { assessmentId: string; onCancel: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Row actions"
      >
        <MoreHorizontal className="w-4 h-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
          <button
            onClick={() => setOpen(false)}
            className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            View Details
          </button>
          <button
            onClick={() => { setOpen(false); onCancel(assessmentId); }}
            className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, amber }: { label: string; value: string | number; amber?: boolean }) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-col gap-1", amber && "border-l-4 border-l-amber-400")}>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 — Upcoming
// ─────────────────────────────────────────────────────────────────────────────

function UpcomingTab({ assessments, loading, onCancel }: {
  assessments: Assessment[];
  loading: boolean;
  onCancel: (id: string) => void;
}) {
  const { can } = usePermission();
  const [deptFilter, setDeptFilter]     = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRange, setDateRange]       = useState<DateRange>({ from: null, to: null });
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const [pageSize, setPageSize]         = useState(20);
  const [sortField, setSortField]       = useState<string | null>(null);
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("asc");

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  useEffect(() => { setPage(1); }, [deptFilter, statusFilter, dateRange, search]);

  // Stat card counts
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0, 0, 0, 0);
  const weekEnd   = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6); weekEnd.setHours(23, 59, 59, 999);

  const thisWeekCount      = assessments.filter(a => a.date && new Date(a.date) >= weekStart && new Date(a.date) <= weekEnd).length;
  const awaitingCount      = assessments.filter(a => a.status === "Awaiting Booking").length;
  const linkSentCount      = assessments.filter(a => a.status === "Link Sent").length;
  const outcomesPending    = assessments.filter(a => a.status === "Booked").length;

  const filtered = useMemo(() => {
    let data = assessments.filter((a) => {
      if (statusFilter.length > 0 && !statusFilter.includes(a.status)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!a.name.toLowerCase().includes(q)) return false;
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
  }, [assessments, statusFilter, search, sortField, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const hasFilters = deptFilter.length > 0 || statusFilter.length > 0 || dateRange.from != null || search !== "";

  return (
    <div className="space-y-4">
      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Assessments This Week" value={thisWeekCount} />
        <StatCard label="Awaiting Booking"       value={awaitingCount} amber />
        <StatCard label="Links Sent (Unused)"    value={linkSentCount} amber />
        <StatCard label="Outcomes Pending"        value={outcomesPending} />
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelectFilter label="Department" options={["Primary", "Lower Secondary", "Senior"]} selected={deptFilter} onChange={setDeptFilter} />
          <MultiSelectFilter label="Status" options={["Booked", "Link Sent", "Awaiting Booking", "Completed"]} selected={statusFilter} onChange={setStatusFilter} />
          <DateRangePicker value={dateRange} onChange={setDateRange} presets={DATE_PRESETS} placeholder="Date range" />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student or lead name..."
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-full bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent w-64"
            />
          </div>

          {hasFilters && (
            <button
              onClick={() => { setDeptFilter([]); setStatusFilter([]); setDateRange({ from: null, to: null }); setSearch(""); }}
              className="text-xs text-slate-500 hover:text-amber-600 underline cursor-pointer transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {can('assessments.book') && (
          <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer shadow-sm shrink-0">
            <Plus className="w-4 h-4" />
            Book Assessment
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <SortableHeader label="Student / Lead" field="name"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Year Group"     field="yearGroup" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Subject(s)</th>
                <SortableHeader label="Assessor"       field="assessor"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Date & Time"    field="date"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Slot</th>
                <SortableHeader label="Type"           field="type"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Status"         field="status"    sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 text-sm">Loading assessments…</td>
                </tr>
              )}
              {!loading && paginated.map((a) => {
                const isAwaitingBooking = a.status === "Awaiting Booking";
                const isLinkSent        = a.status === "Link Sent";
                const isBooked          = a.status === "Booked";
                const palette           = getAvatarPalette(a.name);

                return (
                  <tr
                    key={a.id}
                    className={cn(
                      "border-b border-slate-100 transition-colors",
                      isAwaitingBooking ? "bg-amber-50/40" : "hover:bg-slate-50/60"
                    )}
                  >
                    {/* Student / Lead */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0", palette.bg, palette.text)}>
                          {getInitials(a.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 leading-tight">{a.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{a.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>

                    {/* Year Group */}
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                        {a.yearGroup || "—"}
                      </span>
                    </td>

                    {/* Subjects */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.subjects.length > 0
                          ? a.subjects.map((s) => (
                              <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium">{s}</span>
                            ))
                          : <span className="text-slate-400">—</span>
                        }
                      </div>
                    </td>

                    {/* Assessor */}
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {a.assessor ?? <span className="text-slate-400">—</span>}
                    </td>

                    {/* Date & Time */}
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {a.date && a.time
                        ? <span>{a.date} <span className="text-slate-400">·</span> {a.time}</span>
                        : <span className="text-slate-400">—</span>
                      }
                    </td>

                    {/* Slot */}
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {a.room ?? <span className="text-slate-400">—</span>}
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", typeClass(a.type))}>
                        {a.type}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", statusClass(a.status))}>
                        {a.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      {isBooked && <RowActionMenu assessmentId={a.id} onCancel={onCancel} />}
                      {isLinkSent && (
                        <button className="flex items-center gap-1 px-2.5 py-1 border border-amber-300 text-amber-700 text-xs font-medium rounded-md hover:bg-amber-50 transition-colors cursor-pointer whitespace-nowrap">
                          <Send className="w-3 h-3" />
                          Send Booking Link
                        </button>
                      )}
                      {isAwaitingBooking && (
                        <button className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 text-slate-600 text-xs font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap">
                          <CalendarCheck className="w-3 h-3" />
                          Book Slot
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-sm">
              No assessments match the current filters.
            </div>
          )}
        </div>
        <PaginationBar
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 — Outcomes
// ─────────────────────────────────────────────────────────────────────────────

function outcomeLabel(recommendation: string | null): string {
  if (!recommendation) return "Pending";
  if (recommendation.startsWith("Enrol")) return "Recommended";
  if (recommendation === "Do not enrol") return "Not recommended";
  return recommendation;
}

function OutcomesTab({ assessments, loading }: { assessments: Assessment[]; loading: boolean }) {
  const recommended = assessments.filter(a => a.outcome?.startsWith("Enrol")).length;
  const convRate = assessments.length > 0
    ? `${Math.round((recommended / assessments.length) * 100)}%`
    : "—";

  return (
    <div className="space-y-4">
      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Assessments Completed"     value={assessments.length} />
        <StatCard label="Recommended for Enrolment" value={recommended} />
        <StatCard label="Conversion Rate"            value={convRate} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Student / Lead", "Year Group", "Subject(s)", "Assessor", "Completed", "Recommended Placement", "Outcome", "Actions"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">Loading…</td>
                </tr>
              )}
              {!loading && assessments.map((o) => {
                const palette = getAvatarPalette(o.name);
                const label   = outcomeLabel(o.outcome);
                const display = label === "Recommended" ? "Recommended ✅" : label === "Not recommended" ? "Not recommended ❌" : label;

                return (
                  <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0", palette.bg, palette.text)}>
                          {getInitials(o.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 leading-tight">{o.name}</p>
                          <span className={cn("text-[11px] font-semibold px-1.5 py-0.5 rounded-full", typeClass(o.type))}>
                            {o.type}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                        {o.yearGroup || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {o.subjects.length > 0
                          ? o.subjects.map((s) => (
                              <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium">{s}</span>
                            ))
                          : <span className="text-slate-400">—</span>
                        }
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {o.assessor ?? <span className="text-slate-400">—</span>}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                      {o.date ?? "—"}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700 max-w-[220px]">
                      {o.outcome ?? <span className="text-slate-400">—</span>}
                    </td>

                    <td className="px-4 py-3">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", outcomeClass(display))}>
                        {display}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <button className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 text-slate-600 text-xs font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap">
                        <BookOpen className="w-3 h-3" />
                        View Full Report
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && assessments.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-sm">No completed assessments yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3 — Slot Management
// ─────────────────────────────────────────────────────────────────────────────

interface Slot {
  time: string;
  room: string;
  assessor: string;
  student: string | null;
}

interface DaySlots {
  day: string;
  slots: Slot[];
}

function SlotCard({ slot }: { slot: Slot }) {
  const booked = slot.student !== null;
  return (
    <div className={cn("rounded-lg border border-slate-200 border-l-4 px-3 py-2.5", booked ? "border-l-blue-400 bg-white" : "border-l-green-400 bg-white")}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-700">{slot.time}</span>
            <span className="text-xs text-slate-400">{slot.room}</span>
            <span className="text-xs text-slate-500">{slot.assessor}</span>
          </div>
          {booked && (
            <span className="mt-1 inline-flex px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              {slot.student}
            </span>
          )}
        </div>
        {booked ? (
          <span className="shrink-0 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Booked</span>
        ) : (
          <button className="shrink-0 flex items-center gap-1 px-2.5 py-1 border border-green-300 text-green-700 text-xs font-medium rounded-md hover:bg-green-50 transition-colors cursor-pointer whitespace-nowrap">
            <CalendarCheck className="w-3 h-3" />
            Book
          </button>
        )}
      </div>
    </div>
  );
}

function WeekPanel({ title, days }: { title: string; days: DaySlots[] }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <button className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 text-slate-600 text-xs font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap">
          <Plus className="w-3 h-3" />
          Add Slot
        </button>
      </div>
      <div className="space-y-5">
        {days.map((dayData) => (
          <div key={dayData.day}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{dayData.day}</p>
            <div className="space-y-2">
              {dayData.slots.map((slot, i) => (
                <SlotCard key={i} slot={slot} />
              ))}
            </div>
          </div>
        ))}
        {days.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No slots configured.</p>
        )}
      </div>
    </div>
  );
}

function SlotManagementTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p>
          Assessment slots start at{" "}
          <span className="font-semibold">15, 30, or 45 minutes past the hour only</span> — never on the hour.
          This prevents front-desk congestion at class start times.
        </p>
      </div>
      <div className="flex gap-6 flex-col lg:flex-row">
        <WeekPanel title="This Week" days={[]} />
        <div className="hidden lg:block w-px bg-slate-200 self-stretch" />
        <WeekPanel title="Next Week" days={[]} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page root
// ─────────────────────────────────────────────────────────────────────────────

type Tab = "upcoming" | "outcomes" | "slots";

const TABS: { key: Tab; label: string }[] = [
  { key: "upcoming", label: "Upcoming"       },
  { key: "outcomes", label: "Outcomes"        },
  { key: "slots",    label: "Slot Management" },
];

function AssessmentsPageContent() {
  const { can } = usePermission();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchAssessments() {
    try {
      const res = await fetch("/api/assessments");
      const json = await res.json();
      if (res.ok) setAllAssessments(json);
    } catch {
      // leave list empty on network error
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAssessments(); }, []);

  async function handleCancel(id: string) {
    const res = await fetch(`/api/assessments?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Assessment cancelled");
      setAllAssessments((prev) => prev.filter((a) => a.id !== id));
    } else {
      const json = await res.json().catch(() => ({}));
      toast.error((json as { error?: string }).error ?? "Failed to cancel assessment");
    }
  }

  const raw = searchParams.get("tab");
  const tab: Tab = (raw && TABS.some(t => t.key === raw)) ? (raw as Tab) : "upcoming";

  function handleTabChange(key: Tab) {
    router.replace(`?tab=${key}`, { scroll: false });
  }

  if (!can("assessments.view")) return <AccessDenied />;

  const upcoming  = allAssessments.filter(a => a.status !== "Completed");
  const completed = allAssessments.filter(a => a.status === "Completed");

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {loading ? "Loading…" : `${upcoming.length} assessment${upcoming.length === 1 ? "" : "s"} in pipeline · 0 slots available this week`}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map(({ key, label }) => {
          if (key === "slots" && !can("assessments.manageSlots")) return null;
          return (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px",
                tab === key
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tab === "upcoming" && <UpcomingTab assessments={upcoming}  loading={loading} onCancel={handleCancel} />}
      {tab === "outcomes" && <OutcomesTab assessments={completed} loading={loading} />}
      {tab === "slots"    && <SlotManagementTab />}
    </div>
  );
}

export default function AssessmentsPage() {
  return (
    <Suspense>
      <AssessmentsPageContent />
    </Suspense>
  );
}
