"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Upload,
  UserPlus,
  UserCheck,
  Users,
  X,
  MoreHorizontal,
  Eye,
  BookOpen,
  FileText,
  MessageSquare,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { students, type Student } from "@/lib/mock-data";
import { EmptyState } from "@/components/ui/empty-state";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { SortableHeader } from "@/components/ui/sortable-header";
import { useSavedSegments } from "@/hooks/use-saved-segments";

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-teal-100", text: "text-teal-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
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

function getGuardianEmail(guardianName: string): string {
  const parts = guardianName.trim().toLowerCase().split(/\s+/);
  if (parts.length >= 2) return `${parts[0]}.${parts[parts.length - 1]}@gmail.com`;
  return `${parts[0]}@gmail.com`;
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function getStatusBadgeClass(status: Student["status"]): string {
  switch (status) {
    case "Active":    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Withdrawn": return "bg-red-100 text-red-700 border border-red-200";
    case "Graduated": return "bg-blue-100 text-blue-700 border border-blue-200";
    case "Alumni":    return "bg-slate-100 text-slate-600 border border-slate-200";
  }
}

// ─── Row actions menu ─────────────────────────────────────────────────────────

function RowActions({
  student,
  isOpen,
  onOpen,
  onClose,
  openUpward,
}: {
  student: Student;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  openUpward: boolean;
}) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, onClose]);

  const actions = [
    { icon: Eye,           label: "View Profile",   onClick: () => router.push(`/students/${student.id}`), danger: false },
    { icon: BookOpen,      label: "Add Enrolment",  onClick: () => {},                                      danger: false },
    { icon: FileText,      label: "Create Invoice", onClick: () => {},                                      danger: false },
    { icon: MessageSquare, label: "Log Note",        onClick: () => {},                                      danger: false },
    { icon: UserX,         label: "Withdraw",        onClick: () => {},                                      danger: true  },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (isOpen) onClose(); else onOpen(); }}
        aria-label="Row actions"
        className="flex items-center justify-center w-7 h-7 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-lg min-w-[168px] py-1",
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          )}
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={(e) => { e.stopPropagation(); action.onClick(); onClose(); }}
                className={cn(
                  "w-full text-left flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors cursor-pointer",
                  action.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Saved segment popover ────────────────────────────────────────────────────

function SaveSegmentPopover({
  onSave,
  onClose,
}: {
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-56 top-full left-0 mt-1">
      <p className="text-xs font-medium text-slate-700 mb-2">Name this segment</p>
      <input
        autoFocus
        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:border-amber-400"
        placeholder="e.g. High-risk Primary"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) { onSave(name.trim()); }
          if (e.key === "Escape") onClose();
        }}
      />
      <div className="flex gap-2">
        <button
          onClick={() => name.trim() && onSave(name.trim())}
          className="flex-1 bg-amber-500 text-white text-xs py-1.5 rounded-lg hover:bg-amber-600 cursor-pointer"
        >
          Save
        </button>
        <button
          onClick={onClose}
          className="flex-1 border border-slate-200 text-slate-600 text-xs py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Stat cards ───────────────────────────────────────────────────────────────

const studentStats = [
  {
    label: "Total Students",
    value: "1,847",
    icon: Users,
    iconColor: "text-slate-500",
    sub: "All time",
    trend: null,
    trendUp: false,
  },
  {
    label: "Active Students",
    value: "1,634",
    icon: UserCheck,
    iconColor: "text-green-500",
    sub: "88.5% of total",
    trend: null,
    trendUp: false,
  },
  {
    label: "New This Week",
    value: "12",
    icon: UserPlus,
    iconColor: "text-amber-500",
    sub: "Last 7 days",
    trend: "+12",
    trendUp: true,
  },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS    = ["Active", "Withdrawn", "Graduated", "Alumni"];
const YEAR_OPTIONS      = ["FS1", "FS2", "Y1", "Y2", "Y3", "Y4", "Y5", "Y6", "Y7", "Y8", "Y9", "Y10", "Y11", "Y12", "Y13"];
const DEPT_OPTIONS      = ["Primary", "Lower Secondary", "Senior"];
const ENROLMENT_OPTIONS = ["0 subjects", "1 subject", "2+ subjects", "3+ subjects"];

function matchEnrolmentFilter(enrolments: number, selected: string[]): boolean {
  if (selected.length === 0) return true;
  return selected.some((opt) => {
    if (opt === "0 subjects")  return enrolments === 0;
    if (opt === "1 subject")   return enrolments === 1;
    if (opt === "2+ subjects") return enrolments >= 2;
    if (opt === "3+ subjects") return enrolments >= 3;
    return false;
  });
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const router = useRouter();

  // Filters
  const [statusFilter,     setStatusFilter]     = useState<string[]>([]);
  const [yearFilter,       setYearFilter]       = useState<string[]>([]);
  const [deptFilter,       setDeptFilter]       = useState<string[]>([]);
  const [enrolmentsFilter, setEnrolmentsFilter] = useState<string[]>([]);
  const [searchQuery,      setSearchQuery]      = useState("");
  const [searchExpanded,   setSearchExpanded]   = useState(false);

  // Sort
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir,   setSortDir]   = useState<"asc" | "desc">("asc");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Row actions dropdown
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Segments
  const { segments, saveSegment, deleteSegment } = useSavedSegments("students");
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);

  const isAnyFilterActive =
    statusFilter.length > 0 || yearFilter.length > 0 ||
    deptFilter.length > 0 || enrolmentsFilter.length > 0 || searchQuery !== "";

  useEffect(() => { setCurrentPage(1); }, [statusFilter, yearFilter, deptFilter, enrolmentsFilter, searchQuery]);

  function clearFilters() {
    setStatusFilter([]);
    setYearFilter([]);
    setDeptFilter([]);
    setEnrolmentsFilter([]);
    setSearchQuery("");
    setCurrentPage(1);
  }

  function toggleSort(field: string) {
    if (sortField === field) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function applySegment(filters: Record<string, string[]>) {
    setStatusFilter(filters.status ?? []);
    setYearFilter(filters.yearGroup ?? []);
    setDeptFilter(filters.department ?? []);
    setEnrolmentsFilter(filters.enrolments ?? []);
    setCurrentPage(1);
  }

  const filtered = useMemo(() => {
    let data = students.filter((s) => {
      if (statusFilter.length > 0 && !statusFilter.includes(s.status)) return false;
      if (yearFilter.length > 0 && !yearFilter.includes(s.yearGroup)) return false;
      if (deptFilter.length > 0 && !deptFilter.includes(s.department)) return false;
      if (!matchEnrolmentFilter(s.enrolments, enrolmentsFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !s.name.toLowerCase().includes(q) &&
          !s.id.toLowerCase().includes(q) &&
          !s.guardian.toLowerCase().includes(q) &&
          !s.school.toLowerCase().includes(q)
        ) return false;
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
  }, [statusFilter, yearFilter, deptFilter, enrolmentsFilter, searchQuery, sortField, sortDir]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const allOnPageSelected = paginated.length > 0 && paginated.every((s) => selectedIds.has(s.id));
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) paginated.forEach((s) => next.delete(s.id));
      else paginated.forEach((s) => next.add(s.id));
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const currentFilters = {
    status:     statusFilter,
    yearGroup:  yearFilter,
    department: deptFilter,
    enrolments: enrolmentsFilter,
  };

  return (
    <div className="flex flex-col gap-4 max-w-[1400px] mx-auto">

      {/* ── Page header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          Import CSV
        </button>
        <button
          type="button"
          className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add Student
        </button>
      </div>

      {/* ── Stat cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {studentStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 min-h-[100px] relative"
            >
              <Icon className={cn("absolute top-4 right-4 w-5 h-5", stat.iconColor)} />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-1">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-slate-800 leading-tight mb-1">
                {stat.value}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-slate-400">{stat.sub}</p>
                {stat.trend && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold border border-green-200">
                    {stat.trend} this week
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Saved segments row ────────────────────────────────────────────────── */}
      {segments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 uppercase tracking-wide">Saved:</span>
          {segments.map((seg) => (
            <div key={seg.id} className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <button
                onClick={() => applySegment(seg.filters)}
                className="text-xs text-amber-700 font-medium hover:text-amber-900 cursor-pointer"
              >
                {seg.name}
              </button>
              <button
                onClick={() => deleteSegment(seg.id)}
                className="text-amber-400 hover:text-amber-700 ml-1 text-xs cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter & search bar ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left — filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelectFilter label="Status"     options={STATUS_OPTIONS}    selected={statusFilter}     onChange={setStatusFilter}     />
          <MultiSelectFilter label="Year Group" options={YEAR_OPTIONS}      selected={yearFilter}       onChange={setYearFilter}       />
          <MultiSelectFilter label="Department" options={DEPT_OPTIONS}      selected={deptFilter}       onChange={setDeptFilter}       />
          <MultiSelectFilter label="Enrolments" options={ENROLMENT_OPTIONS} selected={enrolmentsFilter} onChange={setEnrolmentsFilter} />
          {isAnyFilterActive && (
            <div className="relative flex items-center gap-2">
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </button>
              <button
                type="button"
                onClick={() => setSavePopoverOpen(true)}
                className="text-xs text-amber-600 hover:text-amber-800 underline cursor-pointer"
              >
                Save segment
              </button>
              {savePopoverOpen && (
                <SaveSegmentPopover
                  onSave={(name) => {
                    saveSegment(name, currentFilters);
                    setSavePopoverOpen(false);
                  }}
                  onClose={() => setSavePopoverOpen(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* Right — search */}
        <div className="relative flex items-center border border-slate-200 bg-white rounded-md transition-all duration-200"
          style={{ width: searchExpanded || searchQuery ? "16rem" : "2rem" }}
        >
          <button
            type="button"
            onClick={() => setSearchExpanded(true)}
            aria-label="Search students"
            className="absolute left-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer z-10"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <input
            type="text"
            placeholder="Search by name, ID, guardian, school..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchExpanded(true)}
            onBlur={() => { if (!searchQuery) setSearchExpanded(false); }}
            className={cn(
              "w-full pl-7 pr-7 py-1.5 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400 transition-opacity",
              !searchExpanded && !searchQuery ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Bulk actions bar ──────────────────────────────────────────────────── */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm flex-wrap">
          <span className="font-semibold text-amber-800">{selectedIds.size} selected</span>
          <span className="text-amber-300 hidden sm:inline">·</span>
          <button type="button" className="text-amber-700 hover:text-amber-900 font-medium transition-colors cursor-pointer">Export</button>
          <span className="text-amber-300 hidden sm:inline">·</span>
          <button type="button" className="text-amber-700 hover:text-amber-900 font-medium transition-colors cursor-pointer">Send Message</button>
          <span className="text-amber-300 hidden sm:inline">·</span>
          <button type="button" className="text-amber-700 hover:text-amber-900 font-medium transition-colors cursor-pointer">Assign Tag</button>
          <span className="text-amber-300 hidden sm:inline">·</span>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-amber-700 hover:text-amber-900 font-medium transition-colors cursor-pointer"
          >
            Deselect All
          </button>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all on page"
                    className="rounded border-slate-300 cursor-pointer accent-amber-500"
                  />
                </th>
                <SortableHeader label="Student"    field="name"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Status"     field="status"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Year Group" field="yearGroup"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Subjects"   field="enrolments" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">Email</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">Phone</th>
                <SortableHeader label="Added On"   field="createdOn"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon={Users}
                      title="No students found"
                      description="No students match your current filters. Try adjusting or clearing them."
                      action={{ label: "Clear filters", onClick: clearFilters }}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((student, index) => {
                  const palette = getAvatarPalette(student.name);
                  const initials = getInitials(student.name);
                  const isSelected = selectedIds.has(student.id);
                  const openUpward = index >= paginated.length - 3;

                  return (
                    <tr
                      key={student.id}
                      onClick={() => router.push(`/students/${student.id}`)}
                      className={cn(
                        "border-b border-slate-100 last:border-0 transition-colors cursor-pointer",
                        isSelected ? "bg-amber-50/60 hover:bg-amber-50" : "hover:bg-slate-50"
                      )}
                      style={{ height: "56px" }}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-0 w-10">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(student.id)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Select ${student.name}`}
                          className="rounded border-slate-300 cursor-pointer accent-amber-500"
                        />
                      </td>

                      {/* Student name + ID */}
                      <td className="px-3 py-0">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                              palette.bg,
                              palette.text
                            )}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 leading-tight truncate">
                              {student.name}
                            </p>
                            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                              {student.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-0">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
                            getStatusBadgeClass(student.status)
                          )}
                        >
                          {student.status}
                        </span>
                      </td>

                      {/* Year group */}
                      <td className="px-3 py-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 whitespace-nowrap">
                          {student.yearGroup}
                        </span>
                      </td>

                      {/* Subjects / Enrolments */}
                      <td className="px-3 py-0">
                        {student.enrolments > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold border border-teal-100 whitespace-nowrap">
                            {student.enrolments} {student.enrolments === 1 ? "subject" : "subjects"}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-sm">—</span>
                        )}
                      </td>

                      {/* Email (derived from guardian name) */}
                      <td className="px-3 py-0 max-w-[180px]">
                        <span className="text-slate-500 text-sm truncate block">
                          {getGuardianEmail(student.guardian)}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-3 py-0">
                        <span className="text-slate-400 text-xs whitespace-nowrap">
                          {student.guardianPhone}
                        </span>
                      </td>

                      {/* Added On */}
                      <td className="px-3 py-0">
                        <span className="text-slate-400 text-xs whitespace-nowrap">
                          {student.createdOn}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-3 py-0 w-12"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RowActions
                          student={student}
                          isOpen={openMenuId === student.id}
                          onOpen={() => setOpenMenuId(student.id)}
                          onClose={() => setOpenMenuId(null)}
                          openUpward={openUpward}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          total={filtered.length}
          page={currentPage}
          pageSize={rowsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setRowsPerPage(size); setCurrentPage(1); }}
        />
      </div>
    </div>
  );
}
