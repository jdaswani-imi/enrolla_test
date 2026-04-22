"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  Users,
  X,
  MoreHorizontal,
  Eye,
  UserPlus2,
  MessageSquare,
  Archive,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { ExportDialog } from "@/components/ui/export-dialog";
import { guardians as seedGuardians, type Guardian } from "@/lib/mock-data";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { SortableHeader } from "@/components/ui/sortable-header";
import { DateRangePicker, type DateRange, type PresetItem } from "@/components/ui/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS          = ["Active", "Inactive"];
const LINKED_STUDENTS_OPTIONS = ["Has 1 student", "Has 2 students", "Has 3+ students", "No linked students"];
const DEPT_OPTIONS            = ["Primary", "Lower Secondary", "Senior", "Mixed"];
const COMM_PREF_OPTIONS       = ["WhatsApp", "Email", "Both", "None set"];

const DEPT_MAP: Record<string, string> = {
  "Primary":         "primary",
  "Lower Secondary": "lower-secondary",
  "Senior":          "senior",
  "Mixed":           "mixed",
};

const COMM_MAP: Record<string, string> = {
  "WhatsApp": "whatsapp",
  "Email":    "email",
  "Both":     "both",
  "None set": "none",
};

function matchLinkedStudents(count: number, selected: string[]): boolean {
  if (selected.length === 0) return true;
  return selected.some((opt) => {
    if (opt === "No linked students") return count === 0;
    if (opt === "Has 1 student")      return count === 1;
    if (opt === "Has 2 students")     return count === 2;
    if (opt === "Has 3+ students")    return count >= 3;
    return false;
  });
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function inDateRange(iso: string, range: DateRange): boolean {
  if (!range.from && !range.to) return true;
  const d = new Date(iso);
  if (range.from) {
    const from = new Date(range.from);
    from.setHours(0, 0, 0, 0);
    if (d < from) return false;
  }
  if (range.to) {
    const to = new Date(range.to);
    to.setHours(23, 59, 59, 999);
    if (d > to) return false;
  }
  return true;
}

function formatISODate(iso: string): string {
  const d = new Date(iso);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateChip(range: DateRange): string | null {
  if (!range.from && !range.to) return null;
  const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  if (range.from && range.to) return `${fmt(range.from)} – ${fmt(range.to)}`;
  if (range.from) return `From ${fmt(range.from)}`;
  return null;
}

function getTermRange(now: Date, offset: 0 | -1): DateRange {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let from: Date, to: Date;

  if (offset === 0) {
    if (month >= 9)      { from = new Date(year, 8, 1);  to = new Date(year, 11, 31); }
    else if (month <= 4) { from = new Date(year, 0, 1);  to = new Date(year, 3, 30); }
    else                 { from = new Date(year, 4, 1);  to = new Date(year, 7, 31); }
  } else {
    if (month >= 9)      { from = new Date(year, 4, 1);      to = new Date(year, 7, 31); }
    else if (month <= 4) { from = new Date(year - 1, 8, 1);  to = new Date(year - 1, 11, 31); }
    else                 { from = new Date(year, 0, 1);      to = new Date(year, 3, 30); }
  }

  return { from, to };
}

function getAcademicYearRange(now: Date, offset: 0 | -1): DateRange {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startYear = (month >= 9 ? year : year - 1) + offset;
  return { from: new Date(startYear, 8, 1), to: new Date(startYear + 1, 7, 31) };
}

function buildAddedOnPresets(): PresetItem[] {
  return [
    { label: "Today",      getValue: () => { const d = new Date(); return { from: d, to: d }; } },
    { label: "Yesterday",  getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return { from: d, to: d }; } },
    { label: "This Week",  getValue: () => {
      const now = new Date();
      const mon = new Date(now);
      mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      mon.setHours(0, 0, 0, 0);
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      return { from: mon, to: sun };
    }},
    { label: "Last 7 Days",  getValue: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 6); return { from, to }; } },
    { label: "Last Month",   getValue: () => { const now = new Date(); return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) }; } },
    { label: "Last 30 Days", getValue: () => { const to = new Date(); const from = new Date(); from.setDate(from.getDate() - 29); return { from, to }; } },
    { label: "This Term",          getValue: () => getTermRange(new Date(), 0) },
    { label: "Last Term",          getValue: () => getTermRange(new Date(), -1) },
    { label: "This Academic Year", getValue: () => getAcademicYearRange(new Date(), 0) },
    { label: "Last Academic Year", getValue: () => getAcademicYearRange(new Date(), -1) },
    { label: "All Time",           getValue: () => ({ from: null, to: null }) },
    { separator: true } as const,
    { label: "Custom Range", getValue: () => ({ from: null, to: null }), keepOpen: true },
  ];
}

// ─── Avatar palette ───────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "bg-amber-100",   text: "text-amber-700"   },
  { bg: "bg-teal-100",    text: "text-teal-700"     },
  { bg: "bg-blue-100",    text: "text-blue-700"     },
  { bg: "bg-violet-100",  text: "text-violet-700"   },
  { bg: "bg-rose-100",    text: "text-rose-700"     },
  { bg: "bg-emerald-100", text: "text-emerald-700"  },
  { bg: "bg-sky-100",     text: "text-sky-700"      },
  { bg: "bg-orange-100",  text: "text-orange-700"   },
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

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Guardian["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border",
        status === "active"
          ? "bg-emerald-100 text-emerald-700 border-emerald-200"
          : "bg-slate-100 text-slate-500 border-slate-200"
      )}
    >
      {status === "active" ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Family chips ─────────────────────────────────────────────────────────────

function FamilyChips({ students }: { students: Guardian["students"] }) {
  if (students.length === 0) {
    return <span className="text-xs text-slate-400 italic">None</span>;
  }
  return (
    <div className="flex items-center">
      {students.map((student, index) => {
        const palette = getAvatarPalette(student.name);
        return (
          <div
            key={student.id}
            title={student.name}
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ring-2 ring-white cursor-default",
              palette.bg,
              palette.text,
              index > 0 ? "-ml-2" : ""
            )}
            style={{ zIndex: students.length - index }}
          >
            {student.initials}
          </div>
        );
      })}
      <span className="ml-2 text-xs text-slate-400">
        {students.length === 1 ? "1 student" : `${students.length} students`}
      </span>
    </div>
  );
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function RowActions({
  guardian,
  isOpen,
  onOpen,
  onClose,
  openUpward,
  onView,
  onAddStudent,
  onSendMessage,
  onArchive,
  onDelete,
}: {
  guardian: Guardian;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  openUpward: boolean;
  onView: () => void;
  onAddStudent: () => void;
  onSendMessage: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const { can } = usePermission();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, onClose]);

  const actions = [
    { icon: Eye,           label: "View Profile",  onClick: onView,        danger: false, show: true },
    { icon: UserPlus2,     label: "Add Student",   onClick: onAddStudent,  danger: false, show: can('students.create') },
    { icon: MessageSquare, label: "Send Message",  onClick: onSendMessage, danger: false, show: true },
    { icon: Archive,       label: "Archive",       onClick: onArchive,     danger: true,  show: can('guardians.edit') },
    { icon: Trash2,        label: "Delete",        onClick: onDelete,      danger: true,  show: can('delete.records') },
  ].filter(a => a.show);

  void guardian;

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

// ─── Active filter chip ───────────────────────────────────────────────────────

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-medium border border-amber-200">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear ${label} filter`}
        className="flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-amber-300 transition-colors cursor-pointer"
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuardiansPage() {
  const { can } = usePermission();
  const router = useRouter();

  const [exportOpen,       setExportOpen]       = useState(false);
  const [searchQuery,      setSearchQuery]      = useState("");
  const [searchExpanded,   setSearchExpanded]   = useState(false);
  const [bulkSelect,       setBulkSelect]       = useState(false);
  const [selectedIds,      setSelectedIds]      = useState<Set<string>>(new Set());
  const [openMenuId,       setOpenMenuId]       = useState<string | null>(null);
  const [currentPage,      setCurrentPage]      = useState(1);
  const [rowsPerPage,      setRowsPerPage]      = useState(20);
  const [removedIds,       setRemovedIds]       = useState<Set<string>>(new Set());
  const [toast,            setToast]            = useState<{ msg: string; tone: "default" | "success" | "warning" } | null>(null);
  const [archiveTarget,    setArchiveTarget]    = useState<Guardian | null>(null);
  const [deleteTarget,     setDeleteTarget]     = useState<Guardian | null>(null);
  const [addStudentTarget, setAddStudentTarget] = useState<Guardian | null>(null);

  // Filters
  const [statusFilter,          setStatusFilter]          = useState<string[]>([]);
  const [linkedStudentsFilter,  setLinkedStudentsFilter]  = useState<string[]>([]);
  const [deptFilter,            setDeptFilter]            = useState<string[]>([]);
  const [commPrefFilter,        setCommPrefFilter]        = useState<string[]>([]);
  const [dateFilter,            setDateFilter]            = useState<DateRange>({ from: null, to: null });

  // Sort
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir,   setSortDir]   = useState<"asc" | "desc">("asc");

  const addedOnPresets = useMemo(() => buildAddedOnPresets(), []);

  const isAnyFilterActive =
    statusFilter.length > 0 ||
    linkedStudentsFilter.length > 0 ||
    deptFilter.length > 0 ||
    commPrefFilter.length > 0 ||
    !!(dateFilter.from || dateFilter.to);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, linkedStudentsFilter, deptFilter, commPrefFilter, dateFilter, searchQuery]);

  function clearFilters() {
    setStatusFilter([]);
    setLinkedStudentsFilter([]);
    setDeptFilter([]);
    setCommPrefFilter([]);
    setDateFilter({ from: null, to: null });
    setSearchQuery("");
    setCurrentPage(1);
  }

  function clearSearch() {
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

  function fireToast(msg: string, tone: "default" | "success" | "warning" = "default") {
    setToast({ msg, tone });
    window.setTimeout(() => setToast(null), 2000);
  }

  const visibleGuardians = useMemo(
    () => seedGuardians.filter((g) => !removedIds.has(g.id)),
    [removedIds],
  );

  const filtered = useMemo(() => {
    let data = visibleGuardians.filter((g) => {
      // Status
      if (statusFilter.length > 0) {
        const statusVal = statusFilter.map(s => s.toLowerCase());
        if (!statusVal.includes(g.status)) return false;
      }

      // Linked students count
      if (!matchLinkedStudents(g.students.length, linkedStudentsFilter)) return false;

      // Department
      if (deptFilter.length > 0) {
        if (!deptFilter.some(d => DEPT_MAP[d] === g.department)) return false;
      }

      // Communication preference
      if (commPrefFilter.length > 0) {
        if (!commPrefFilter.some(p => COMM_MAP[p] === g.communicationPreference)) return false;
      }

      // Added On date
      if ((dateFilter.from || dateFilter.to) && !inDateRange(g.createdOn, dateFilter)) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !g.name.toLowerCase().includes(q) &&
          !g.email.toLowerCase().includes(q) &&
          !g.phone.includes(q) &&
          !g.students.some((s) => s.name.toLowerCase().includes(q))
        ) return false;
      }

      return true;
    });

    if (sortField) {
      data = [...data].sort((a, b) => {
        let av: unknown, bv: unknown;
        if (sortField === "studentsCount") {
          av = a.students.length;
          bv = b.students.length;
        } else {
          av = (a as unknown as Record<string, unknown>)[sortField];
          bv = (b as unknown as Record<string, unknown>)[sortField];
        }
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return data;
  }, [visibleGuardians, statusFilter, linkedStudentsFilter, deptFilter, commPrefFilter, dateFilter, searchQuery, sortField, sortDir]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const allOnPageSelected = paginated.length > 0 && paginated.every((g) => selectedIds.has(g.id));
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) paginated.forEach((g) => next.delete(g.id));
      else paginated.forEach((g) => next.add(g.id));
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

  // Build chip labels for active filters
  function chipLabel(filterName: string, values: string[]): string {
    if (values.length === 1) return `${filterName}: ${values[0]}`;
    if (values.length === 2) return `${filterName}: ${values[0]}, ${values[1]}`;
    return `${filterName}: ${values[0]} +${values.length - 1}`;
  }

  if (!can('guardians.view')) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-4 max-w-[1400px] mx-auto">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">Guardians</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage guardians and their linked students.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
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
          {can('guardians.create') && (
            <button
              type="button"
              className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Guardian
            </button>
          )}
        </div>
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Guardians"
        recordCount={198}
        formats={[
          { id: 'csv-contacts', label: 'Contact List', description: 'Name, email, phone, WhatsApp status, linked students.', icon: 'rows', recommended: true },
          { id: 'csv-full', label: 'Full Export', description: 'All fields including DNC status, communication history.', icon: 'items' },
        ]}
      />

      {/* ── Filter & search bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left — filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <MultiSelectFilter
            label="Status"
            options={STATUS_OPTIONS}
            selected={statusFilter}
            onChange={setStatusFilter}
          />
          <MultiSelectFilter
            label="Linked Students"
            options={LINKED_STUDENTS_OPTIONS}
            selected={linkedStudentsFilter}
            onChange={setLinkedStudentsFilter}
          />
          <MultiSelectFilter
            label="Department"
            options={DEPT_OPTIONS}
            selected={deptFilter}
            onChange={setDeptFilter}
          />
          <MultiSelectFilter
            label="Comm. Preference"
            options={COMM_PREF_OPTIONS}
            selected={commPrefFilter}
            onChange={setCommPrefFilter}
          />
          <DateRangePicker
            value={dateFilter}
            onChange={(r) => { setDateFilter(r); setCurrentPage(1); }}
            presets={addedOnPresets}
            placeholder="Added On"
            twoMonth
          />
        </div>

        {/* Right — search + bulk select */}
        <div className="flex items-center gap-2">
          <div
            className="relative flex items-center border border-slate-200 bg-white rounded-md transition-all duration-200"
            style={{ width: searchExpanded || searchQuery ? "16rem" : "2rem" }}
          >
            <button
              type="button"
              onClick={() => setSearchExpanded(true)}
              aria-label="Search guardians"
              className="absolute left-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer z-10"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
            <input
              type="text"
              placeholder="Search guardian..."
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
                onClick={clearSearch}
                aria-label="Clear search"
                className="absolute right-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setBulkSelect((v) => !v);
              if (bulkSelect) setSelectedIds(new Set());
            }}
            className={cn(
              "px-3 py-1.5 rounded-md border text-sm font-medium transition-colors cursor-pointer whitespace-nowrap",
              bulkSelect
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
            )}
          >
            Bulk select
          </button>
        </div>
      </div>

      {/* ── Active filter chips ──────────────────────────────────────────────── */}
      {isAnyFilterActive && (
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilter.length > 0 && (
            <FilterChip
              label={chipLabel("Status", statusFilter)}
              onClear={() => setStatusFilter([])}
            />
          )}
          {linkedStudentsFilter.length > 0 && (
            <FilterChip
              label={chipLabel("Linked Students", linkedStudentsFilter)}
              onClear={() => setLinkedStudentsFilter([])}
            />
          )}
          {deptFilter.length > 0 && (
            <FilterChip
              label={chipLabel("Department", deptFilter)}
              onClear={() => setDeptFilter([])}
            />
          )}
          {commPrefFilter.length > 0 && (
            <FilterChip
              label={chipLabel("Comm. Preference", commPrefFilter)}
              onClear={() => setCommPrefFilter([])}
            />
          )}
          {(dateFilter.from || dateFilter.to) && (
            <FilterChip
              label={`Added On: ${formatDateChip(dateFilter)}`}
              onClear={() => setDateFilter({ from: null, to: null })}
            />
          )}
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-amber-600 hover:text-amber-800 font-medium transition-colors cursor-pointer ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Bulk actions bar ─────────────────────────────────────────────────── */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm flex-wrap">
          <span className="font-semibold text-amber-800">{selectedIds.size} selected</span>
          <span className="text-amber-300 hidden sm:inline">·</span>
          <button type="button" className="text-amber-700 hover:text-amber-900 font-medium transition-colors cursor-pointer">Export</button>
          <span className="text-amber-300 hidden sm:inline">·</span>
          <button type="button" className="text-amber-700 hover:text-amber-900 font-medium transition-colors cursor-pointer">Send Message</button>
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

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {bulkSelect && (
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all on page"
                      className="rounded border-slate-300 cursor-pointer accent-amber-500"
                    />
                  </th>
                )}
                <SortableHeader label="Guardian Name"   field="name"          sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">Email</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">Phone</th>
                <SortableHeader label="Linked Students" field="studentsCount"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Added On"        field="createdOn"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={bulkSelect ? 8 : 7}>
                    <EmptyState
                      icon={Users}
                      title="No guardians found"
                      description="No guardians match your current filters. Try adjusting or clearing them."
                      action={{ label: "Clear filters", onClick: clearFilters }}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((guardian, index) => {
                  const palette    = getAvatarPalette(guardian.name);
                  const initials   = getInitials(guardian.name);
                  const isSelected = selectedIds.has(guardian.id);
                  const openUpward = index >= paginated.length - 3;

                  return (
                    <tr
                      key={guardian.id}
                      onClick={() => router.push(`/guardians/${guardian.id}`)}
                      className={cn(
                        "border-b border-slate-100 last:border-0 transition-colors cursor-pointer",
                        isSelected ? "bg-amber-50/60 hover:bg-amber-50" : "hover:bg-slate-50"
                      )}
                      style={{ height: "56px" }}
                    >
                      {/* Checkbox (bulk mode) */}
                      {bulkSelect && (
                        <td className="px-4 py-0 w-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(guardian.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${guardian.name}`}
                            className="rounded border-slate-300 cursor-pointer accent-amber-500"
                          />
                        </td>
                      )}

                      {/* Name */}
                      <td className="px-4 py-0">
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
                              {guardian.name}
                            </p>
                            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                              {guardian.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-0">
                        <StatusBadge status={guardian.status} />
                      </td>

                      {/* Email */}
                      <td className="px-3 py-0 max-w-[200px]">
                        <span className="text-slate-500 text-sm truncate block">
                          {guardian.email}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-3 py-0">
                        <span className="text-slate-400 text-xs whitespace-nowrap">
                          {guardian.phone}
                        </span>
                      </td>

                      {/* Linked Students */}
                      <td className="px-3 py-0">
                        <FamilyChips students={guardian.students} />
                      </td>

                      {/* Added On */}
                      <td className="px-3 py-0">
                        <span className="text-slate-400 text-xs whitespace-nowrap">
                          {formatISODate(guardian.createdOn)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td
                        className="px-3 py-0 w-12"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RowActions
                          guardian={guardian}
                          isOpen={openMenuId === guardian.id}
                          onOpen={() => setOpenMenuId(guardian.id)}
                          onClose={() => setOpenMenuId(null)}
                          openUpward={openUpward}
                          onView={() => router.push(`/guardians/${guardian.id}`)}
                          onAddStudent={() => setAddStudentTarget(guardian)}
                          onSendMessage={() => fireToast("Message sent", "success")}
                          onArchive={() => setArchiveTarget(guardian)}
                          onDelete={() => setDeleteTarget(guardian)}
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

      <ArchiveGuardianDialog
        guardian={archiveTarget}
        open={archiveTarget !== null}
        onOpenChange={(o) => !o && setArchiveTarget(null)}
        onConfirm={() => {
          if (!archiveTarget) return;
          setRemovedIds((prev) => new Set(prev).add(archiveTarget.id));
          fireToast("Guardian archived", "success");
          setArchiveTarget(null);
        }}
      />
      <DeleteGuardianDialog
        guardian={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          setRemovedIds((prev) => new Set(prev).add(deleteTarget.id));
          fireToast("Guardian deleted", "warning");
          setDeleteTarget(null);
        }}
      />
      <AddStudentDialog
        guardian={addStudentTarget}
        open={addStudentTarget !== null}
        onOpenChange={(o) => !o && setAddStudentTarget(null)}
        onSave={() => {
          fireToast("Saved", "success");
          setAddStudentTarget(null);
        }}
      />

      {toast && (
        <div
          className={cn(
            "fixed bottom-6 right-6 z-[100] rounded-xl px-4 py-3 text-sm shadow-lg",
            toast.tone === "warning"
              ? "bg-red-600 text-white"
              : toast.tone === "success"
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-white",
          )}
        >
          {toast.tone === "success" ? (
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {toast.msg}
            </span>
          ) : (
            toast.msg
          )}
        </div>
      )}
    </div>
  );
}

// ─── Action Dialogs ───────────────────────────────────────────────────────────

function ArchiveGuardianDialog({
  guardian,
  open,
  onOpenChange,
  onConfirm,
}: {
  guardian: Guardian | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  if (!guardian) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Archive Guardian</DialogTitle>
          <DialogDescription>Archive {guardian.name} from the active list?</DialogDescription>
        </DialogHeader>
        <div className="p-6">
          <p className="text-sm text-slate-600">
            Archived guardians no longer appear in the directory but records are preserved.
            Linked students will remain intact.
          </p>
        </div>
        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Archive
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteGuardianDialog({
  guardian,
  open,
  onOpenChange,
  onConfirm,
}: {
  guardian: Guardian | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  if (!guardian) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Delete Guardian</DialogTitle>
          <DialogDescription>Permanently delete {guardian.name}?</DialogDescription>
        </DialogHeader>
        <div className="p-6">
          <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">
              This cannot be undone. All contact history and referral credit will be lost.
            </p>
          </div>
        </div>
        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
          >
            Delete permanently
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddStudentDialog({
  guardian,
  open,
  onOpenChange,
  onSave,
}: {
  guardian: Guardian | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  const [studentQuery, setStudentQuery] = useState("");
  const [relationship, setRelationship] = useState("Mother");

  useEffect(() => {
    if (open) {
      setStudentQuery("");
      setRelationship("Mother");
    }
  }, [open]);

  if (!guardian) return null;
  const valid = studentQuery.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Link Student to {guardian.name}</DialogTitle>
          <DialogDescription>Search and link an additional student.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Student name</label>
            <input
              type="text"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
              placeholder="e.g. Aisha Rahman"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600">Relationship</label>
            <select
              value={relationship}
              onChange={(e) => setRelationship(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            >
              {["Mother", "Father", "Grandparent", "Uncle", "Aunt", "Legal Guardian", "Other"].map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!valid}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
