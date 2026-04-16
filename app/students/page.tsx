"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Upload,
  UserPlus,
  X,
  ChevronDown,
  MoreHorizontal,
  Eye,
  BookOpen,
  FileText,
  MessageSquare,
  UserX,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { students, type Student } from "@/lib/mock-data";

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

// ─── Badge helpers ────────────────────────────────────────────────────────────

function getChurnRiskLevel(score: number | null): string | null {
  if (score === null) return null;
  if (score >= 70) return "Critical";
  if (score >= 40) return "High";
  if (score >= 20) return "Medium";
  return "Low";
}

function getChurnScoreBadgeClass(score: number): string {
  if (score >= 70) return "bg-red-100 text-red-700 border border-red-200";
  if (score >= 40) return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
}

function getStatusBadgeClass(status: Student["status"]): string {
  switch (status) {
    case "Active":    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Withdrawn": return "bg-red-100 text-red-700 border border-red-200";
    case "Graduated": return "bg-blue-100 text-blue-700 border border-blue-200";
    case "Alumni":    return "bg-slate-100 text-slate-600 border border-slate-200";
  }
}

// ─── FilterDropdown ───────────────────────────────────────────────────────────

interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  active: boolean;
}

function FilterDropdown({ label, value, options, onChange, active }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer whitespace-nowrap",
          active
            ? "bg-amber-500 text-white border-amber-500 shadow-sm"
            : "bg-white text-slate-600 border-slate-200 hover:border-amber-300 hover:text-amber-700"
        )}
      >
        {active ? `${label}: ${value}` : label}
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-150", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[160px] py-1">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm transition-colors flex items-center justify-between gap-2 cursor-pointer",
                value === opt
                  ? "text-amber-600 font-medium bg-amber-50"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {opt}
              {value === opt && <Check className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Column visibility toggle ─────────────────────────────────────────────────

const TOGGLEABLE_COLUMNS = [
  { key: "department",  label: "Department" },
  { key: "school",      label: "School" },
  { key: "guardian",    label: "Guardian" },
  { key: "enrolments",  label: "Enrolments" },
  { key: "churnScore",  label: "Churn Score" },
  { key: "lastContact", label: "Last Contact" },
];

function ColumnToggle({ hidden, onToggle }: { hidden: Set<string>; onToggle: (key: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle column visibility"
        className="flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-white hover:border-amber-300 hover:text-amber-600 text-slate-500 transition-colors cursor-pointer"
      >
        <SlidersHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[180px] py-2 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-2 mb-1.5">
            Columns
          </p>
          {TOGGLEABLE_COLUMNS.map((col) => (
            <button
              key={col.key}
              type="button"
              onClick={() => onToggle(col.key)}
              className="w-full text-left flex items-center gap-2.5 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer transition-colors"
            >
              <div
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0",
                  hidden.has(col.key)
                    ? "border-slate-300 bg-white"
                    : "border-amber-500 bg-amber-500"
                )}
              >
                {!hidden.has(col.key) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-slate-700">{col.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
    { icon: Eye,          label: "View Profile",   onClick: () => router.push(`/students/${student.id}`), danger: false },
    { icon: BookOpen,     label: "Add Enrolment",  onClick: () => {},                                      danger: false },
    { icon: FileText,     label: "Create Invoice", onClick: () => {},                                      danger: false },
    { icon: MessageSquare,label: "Log Note",       onClick: () => {},                                      danger: false },
    { icon: UserX,        label: "Withdraw",       onClick: () => {},                                      danger: true  },
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

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS  = ["All", "Active", "Withdrawn", "Graduated", "Alumni"];
const DEPT_OPTIONS    = ["All", "Primary", "Lower Secondary", "Senior"];
const YEAR_OPTIONS    = ["All", "FS1", "FS2", "Y1", "Y2", "Y3", "Y4", "Y5", "Y6", "Y7", "Y8", "Y9", "Y10", "Y11", "Y12", "Y13"];
const CHURN_OPTIONS   = ["All", "Critical", "High", "Medium", "Low"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const router = useRouter();

  // Filters
  const [statusFilter,  setStatusFilter]  = useState("All");
  const [deptFilter,    setDeptFilter]    = useState("All");
  const [yearFilter,    setYearFilter]    = useState("All");
  const [churnFilter,   setChurnFilter]   = useState("All");
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);

  // Selection
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set());

  // Column visibility
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  // Row actions dropdown
  const [openMenuId,    setOpenMenuId]    = useState<string | null>(null);

  // Pagination
  const [currentPage,   setCurrentPage]   = useState(1);
  const [rowsPerPage,   setRowsPerPage]   = useState(20);

  const isAnyFilterActive = statusFilter !== "All" || deptFilter !== "All" || yearFilter !== "All" || churnFilter !== "All" || searchQuery !== "";

  function clearFilters() {
    setStatusFilter("All");
    setDeptFilter("All");
    setYearFilter("All");
    setChurnFilter("All");
    setSearchQuery("");
    setCurrentPage(1);
  }

  function toggleColumn(key: string) {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  const col = (key: string) => !hiddenColumns.has(key);

  // Filtered data
  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (statusFilter !== "All" && s.status !== statusFilter) return false;
      if (deptFilter !== "All" && s.department !== deptFilter) return false;
      if (yearFilter !== "All" && s.yearGroup !== yearFilter) return false;
      if (churnFilter !== "All" && getChurnRiskLevel(s.churnScore) !== churnFilter) return false;
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
  }, [statusFilter, deptFilter, yearFilter, churnFilter, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const startItem = filtered.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1;
  const endItem   = Math.min(currentPage * rowsPerPage, filtered.length);

  // Selection
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

  return (
    <div className="flex flex-col gap-4 max-w-[1400px] mx-auto">

      {/* ── Page header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-sm text-slate-500">
          1,847 students&nbsp;·&nbsp;1,634 active&nbsp;·&nbsp;89 withdrawn&nbsp;·&nbsp;124 graduated
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Student
          </button>
        </div>
      </div>

      {/* ── Filter & search bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left — filter chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown
            label="Status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}
            active={statusFilter !== "All"}
          />
          <FilterDropdown
            label="Department"
            value={deptFilter}
            options={DEPT_OPTIONS}
            onChange={(v) => { setDeptFilter(v); setCurrentPage(1); }}
            active={deptFilter !== "All"}
          />
          <FilterDropdown
            label="Year Group"
            value={yearFilter}
            options={YEAR_OPTIONS}
            onChange={(v) => { setYearFilter(v); setCurrentPage(1); }}
            active={yearFilter !== "All"}
          />
          <FilterDropdown
            label="Churn Risk"
            value={churnFilter}
            options={CHURN_OPTIONS}
            onChange={(v) => { setChurnFilter(v); setCurrentPage(1); }}
            active={churnFilter !== "All"}
          />
          {isAnyFilterActive && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear filters
            </button>
          )}
        </div>

        {/* Right — search + column toggle */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "relative flex items-center border border-slate-200 bg-white rounded-md transition-all duration-200",
              searchExpanded || searchQuery ? "w-64" : "w-8"
            )}
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
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
                onClick={() => { setSearchQuery(""); setCurrentPage(1); }}
                aria-label="Clear search"
                className="absolute right-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <ColumnToggle hidden={hiddenColumns} onToggle={toggleColumn} />
        </div>
      </div>

      {/* ── Bulk actions bar ───────────────────────────────────────────────────── */}
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
            {/* Sticky header */}
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAll}
                    aria-label="Select all on page"
                    className="rounded border-slate-300 cursor-pointer accent-amber-500"
                  />
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                  Student
                </th>
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                  Year
                </th>
                {col("department") && (
                  <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                    Department
                  </th>
                )}
                {col("school") && (
                  <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap hidden md:table-cell">
                    School
                  </th>
                )}
                {col("guardian") && (
                  <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap hidden lg:table-cell">
                    Guardian
                  </th>
                )}
                {col("enrolments") && (
                  <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                    Enrolments
                  </th>
                )}
                {col("churnScore") && (
                  <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                    Churn
                  </th>
                )}
                <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                  Status
                </th>
                {col("lastContact") && (
                  <th className="px-3 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap hidden xl:table-cell">
                    Last Contact
                  </th>
                )}
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Search className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No students match your filters</p>
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors cursor-pointer"
                      >
                        Clear filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginated.map((student, index) => {
                  const palette = getAvatarPalette(student.name);
                  const initials = getInitials(student.name);
                  const isSelected = selectedIds.has(student.id);
                  const openUpward = index >= paginated.length - 3;
                  const showChurnScore =
                    student.status === "Active" &&
                    student.churnScore !== null &&
                    student.enrolments > 0;

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

                      {/* Year group */}
                      <td className="px-3 py-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 whitespace-nowrap">
                          {student.yearGroup}
                        </span>
                      </td>

                      {/* Department */}
                      {col("department") && (
                        <td className="px-3 py-0 text-slate-600 text-sm whitespace-nowrap">
                          {student.department}
                        </td>
                      )}

                      {/* School */}
                      {col("school") && (
                        <td className="px-3 py-0 hidden md:table-cell max-w-[180px]">
                          <span className="text-slate-500 text-sm truncate block">
                            {student.school}
                          </span>
                        </td>
                      )}

                      {/* Guardian */}
                      {col("guardian") && (
                        <td className="px-3 py-0 hidden lg:table-cell">
                          <p className="text-sm text-slate-700 leading-tight">{student.guardian}</p>
                          <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                            {student.guardianPhone}
                          </p>
                        </td>
                      )}

                      {/* Enrolments */}
                      {col("enrolments") && (
                        <td className="px-3 py-0">
                          {student.enrolments > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 whitespace-nowrap">
                              {student.enrolments}{" "}
                              {student.enrolments === 1 ? "subject" : "subjects"}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </td>
                      )}

                      {/* Churn score */}
                      {col("churnScore") && (
                        <td className="px-3 py-0">
                          {showChurnScore ? (
                            <span
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                                getChurnScoreBadgeClass(student.churnScore!)
                              )}
                            >
                              {student.churnScore}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-sm">—</span>
                          )}
                        </td>
                      )}

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

                      {/* Last contact */}
                      {col("lastContact") && (
                        <td className="px-3 py-0 text-slate-400 text-xs whitespace-nowrap hidden xl:table-cell">
                          {student.lastContact}
                        </td>
                      )}

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
      </div>

      {/* ── Pagination ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 text-sm flex-wrap pb-2">
        <p className="text-slate-500">
          {filtered.length === 0
            ? "No students found"
            : `Showing ${startItem}–${endItem} of ${filtered.length} students`}
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Rows per page */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Rows per page</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-sm border border-slate-200 rounded px-2 py-1 bg-white text-slate-600 cursor-pointer outline-none hover:border-amber-300 transition-colors"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="flex items-center justify-center w-7 h-7 rounded border border-slate-200 bg-white hover:border-amber-300 hover:text-amber-600 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val) && val >= 1 && val <= totalPages) setCurrentPage(val);
                }}
                className="w-12 text-center text-sm border border-slate-200 rounded px-1 py-1 bg-white text-slate-600 outline-none hover:border-amber-300 focus:border-amber-400 transition-colors"
              />
              <span className="text-xs text-slate-400">of {totalPages}</span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="flex items-center justify-center w-7 h-7 rounded border border-slate-200 bg-white hover:border-amber-300 hover:text-amber-600 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
