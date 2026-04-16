"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
import { cn } from "@/lib/utils";
import { assessments, type AssessmentStatus } from "@/lib/mock-data";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { SortableHeader } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { DateRangePicker, DATE_PRESETS, type DateRange } from "@/components/ui/date-range-picker";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const AVATAR_PALETTES = [
  { bg: "bg-amber-100",   text: "text-amber-700"   },
  { bg: "bg-teal-100",    text: "text-teal-700"     },
  { bg: "bg-blue-100",    text: "text-blue-700"     },
  { bg: "bg-violet-100",  text: "text-violet-700"   },
  { bg: "bg-rose-100",    text: "text-rose-700"     },
  { bg: "bg-emerald-100", text: "text-emerald-700"  },
];

function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

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

function RowActionMenu() {
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
          {[
            { icon: Eye, label: "View Details", danger: false },
            { icon: X,   label: "Cancel",       danger: true  },
          ].map(({ icon: Icon, label, danger }) => (
            <button
              key={label}
              onClick={() => setOpen(false)}
              className={cn(
                "w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm transition-colors cursor-pointer",
                danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  amber,
}: {
  label: string;
  value: string | number;
  amber?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-col gap-1",
        amber && "border-l-4 border-l-amber-400"
      )}
    >
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 — Upcoming
// ─────────────────────────────────────────────────────────────────────────────

function UpcomingTab() {
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
  }, [statusFilter, deptFilter, search, sortField, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const hasFilters = deptFilter.length > 0 || statusFilter.length > 0 || dateRange.from != null || search !== "";

  return (
    <div className="space-y-4">
      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Assessments This Week" value={8} />
        <StatCard label="Awaiting Booking"       value={5} amber />
        <StatCard label="Links Sent (Unused)"    value={3} amber />
        <StatCard label="Outcomes Pending"        value={6} />
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelectFilter label="Department" options={["Primary", "Lower Secondary", "Senior"]} selected={deptFilter} onChange={setDeptFilter} />
          <MultiSelectFilter label="Status" options={["Booked", "Link Sent", "Awaiting Booking", "Completed"]} selected={statusFilter} onChange={setStatusFilter} />
          <DateRangePicker value={dateRange} onChange={setDateRange} presets={DATE_PRESETS} placeholder="Date range" />

          {/* Search */}
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

        <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer shadow-sm shrink-0">
          <Plus className="w-4 h-4" />
          Book Assessment
        </button>
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
              {paginated.map((a) => {
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
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                            palette.bg,
                            palette.text
                          )}
                        >
                          {getInitials(a.name)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 leading-tight">{a.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{a.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Year Group */}
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                        {a.yearGroup}
                      </span>
                    </td>

                    {/* Subjects */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {a.subjects.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Assessor */}
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {a.assessor ?? <span className="text-slate-400">—</span>}
                    </td>

                    {/* Date & Time */}
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">
                      {a.date && a.time ? (
                        <span>
                          {a.date} <span className="text-slate-400">·</span> {a.time}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
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
                      {isBooked && <RowActionMenu />}
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
          {filtered.length === 0 && (
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

const OUTCOMES_DATA = [
  { name: "Amna Al-Qubaisi",   type: "Lead" as const, yearGroup: "Y3",  subjects: ["English", "Maths"],  assessor: "Ms Sarah Mitchell", completedDate: "15 Apr 2025", recommendedPlacement: "Y3 English — Group",               outcome: "Recommended" },
  { name: "Hamdan Al-Maktoum", type: "Lead" as const, yearGroup: "Y7",  subjects: ["Maths"],             assessor: "Mr Ahmed Khalil",   completedDate: "12 Apr 2025", recommendedPlacement: "Y7 Maths — Group",                 outcome: "Recommended" },
  { name: "Rashid Al-Ketbi",   type: "Lead" as const, yearGroup: "Y12", subjects: ["Maths", "Physics"],  assessor: "Mr Faris Al-Amin",  completedDate: "10 Apr 2025", recommendedPlacement: "Y12 Maths — Private, Y12 Physics", outcome: "Recommended" },
  { name: "Mira Al-Suwaidi",   type: "Lead" as const, yearGroup: "Y7",  subjects: ["English"],           assessor: "Ms Sarah Mitchell", completedDate: "8 Apr 2025",  recommendedPlacement: "Y7 English — Group",               outcome: "Recommended" },
  { name: "Obaid Al-Falasi",   type: "Lead" as const, yearGroup: "Y9",  subjects: ["Science", "Maths"],  assessor: "Mr Tariq Al-Amin",  completedDate: "5 Apr 2025",  recommendedPlacement: "Y9 Science — Group",               outcome: "Parent to decide" },
  { name: "Shaikha Bin Saeed", type: "Lead" as const, yearGroup: "Y1",  subjects: ["English"],           assessor: "Ms Sarah Mitchell", completedDate: "3 Apr 2025",  recommendedPlacement: "Y1 English — Group",               outcome: "Recommended" },
  { name: "Talal Mansouri",    type: "Lead" as const, yearGroup: "Y11", subjects: ["Chemistry"],         assessor: "Ms Hana Yusuf",     completedDate: "1 Apr 2025",  recommendedPlacement: "Y11 Chemistry — Group",            outcome: "Not recommended" },
  { name: "Rawan Al-Zarooni",  type: "Lead" as const, yearGroup: "Y4",  subjects: ["Maths"],             assessor: "Mr Ahmed Khalil",   completedDate: "28 Mar 2025", recommendedPlacement: "Y4 Maths — Group",                 outcome: "Recommended" },
];

function OutcomesTab() {
  return (
    <div className="space-y-4">
      {/* Stat strip */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Assessments Completed"     value={24} />
        <StatCard label="Recommended for Enrolment" value={19} />
        <StatCard label="Conversion Rate"            value="79%" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Student / Lead", "Year Group", "Subject(s)", "Assessor", "Completed", "Recommended Placement", "Outcome", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OUTCOMES_DATA.map((o, i) => {
                const palette    = getAvatarPalette(o.name);
                const outcomeLabel =
                  o.outcome === "Recommended"     ? "Recommended ✅"  :
                  o.outcome === "Not recommended" ? "Not recommended ❌" :
                  o.outcome;

                return (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                            palette.bg,
                            palette.text
                          )}
                        >
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

                    {/* Year Group */}
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                        {o.yearGroup}
                      </span>
                    </td>

                    {/* Subjects */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {o.subjects.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Assessor */}
                    <td className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap">{o.assessor}</td>

                    {/* Completed */}
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{o.completedDate}</td>

                    {/* Recommended Placement */}
                    <td className="px-4 py-3 text-sm text-slate-700 max-w-[220px]">{o.recommendedPlacement}</td>

                    {/* Outcome */}
                    <td className="px-4 py-3">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", outcomeClass(outcomeLabel))}>
                        {outcomeLabel}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button className="flex items-center gap-1 px-2.5 py-1 border border-slate-300 text-slate-600 text-xs font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap">
                        <BookOpen className="w-3 h-3" />
                        View Full Report
                      </button>
                    </td>
                  </tr>
                );
              })}
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

const THIS_WEEK: DaySlots[] = [
  {
    day: "Sat 19 Apr",
    slots: [
      { time: "10:15", room: "Room 2B", assessor: "Mr Ahmed Khalil",   student: "Bilal Mahmood" },
      { time: "10:30", room: "Room 1A", assessor: "Ms Sarah Mitchell", student: "Hessa Al-Blooshi" },
      { time: "11:15", room: "Room 2A", assessor: "Mr Faris Al-Amin",  student: "Ahmed Saleh" },
      { time: "11:30", room: "Room 2B", assessor: "Mr Ahmed Khalil",   student: null },
      { time: "12:15", room: "Room 1A", assessor: "Ms Sarah Mitchell", student: null },
    ],
  },
  {
    day: "Wed 23 Apr",
    slots: [
      { time: "10:15", room: "Room 2B", assessor: "Mr Ahmed Khalil",   student: "Nour Ibrahim" },
    ],
  },
  {
    day: "Thu 24 Apr",
    slots: [
      { time: "10:30", room: "Room 1A", assessor: "Ms Sarah Mitchell", student: null },
    ],
  },
  {
    day: "Fri 25 Apr",
    slots: [
      { time: "11:15", room: "Room 2A", assessor: "Mr Faris Al-Amin",  student: null },
    ],
  },
];

const NEXT_WEEK: DaySlots[] = [
  {
    day: "Sat 26 Apr",
    slots: [
      { time: "10:30", room: "Room 1A", assessor: "Ms Sarah Mitchell", student: "Rana Farouk" },
      { time: "11:15", room: "Room 2B", assessor: "Mr Ahmed Khalil",   student: null },
      { time: "11:30", room: "Room 2A", assessor: "Mr Faris Al-Amin",  student: null },
      { time: "12:15", room: "Room 1A", assessor: "Ms Sarah Mitchell", student: null },
    ],
  },
  {
    day: "Mon 28 Apr",
    slots: [
      { time: "10:15", room: "Room 2B", assessor: "Mr Ahmed Khalil",   student: null },
    ],
  },
  {
    day: "Tue 29 Apr",
    slots: [
      { time: "11:00", room: "Room 1A", assessor: "Ms Sarah Mitchell", student: null },
    ],
  },
  {
    day: "Thu 1 May",
    slots: [
      { time: "10:30", room: "Room 2A", assessor: "Mr Faris Al-Amin",  student: null },
    ],
  },
];

function SlotCard({ slot }: { slot: Slot }) {
  const booked = slot.student !== null;
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 border-l-4 px-3 py-2.5",
        booked ? "border-l-blue-400 bg-white" : "border-l-green-400 bg-white"
      )}
    >
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
          <span className="shrink-0 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            Booked
          </span>
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
      </div>
    </div>
  );
}

function SlotManagementTab() {
  return (
    <div className="space-y-4">
      {/* Info banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <p>
          Assessment slots start at{" "}
          <span className="font-semibold">15, 30, or 45 minutes past the hour only</span> — never on the hour.
          This prevents front-desk congestion at class start times.
        </p>
      </div>

      {/* Two-week grid */}
      <div className="flex gap-6 flex-col lg:flex-row">
        <WeekPanel title="This Week (19–25 Apr)" days={THIS_WEEK} />
        <div className="hidden lg:block w-px bg-slate-200 self-stretch" />
        <WeekPanel title="Next Week (26 Apr – 2 May)" days={NEXT_WEEK} />
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

export default function AssessmentsPage() {
  const [tab, setTab] = useState<Tab>("upcoming");

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">10 assessments in pipeline · 3 slots available this week</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px",
              tab === key
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "upcoming" && <UpcomingTab />}
      {tab === "outcomes" && <OutcomesTab />}
      {tab === "slots"    && <SlotManagementTab />}
    </div>
  );
}
