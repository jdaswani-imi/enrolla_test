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
  ClipboardList,
  MessageSquare,
  UserX,
  Download,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { ExportDialog } from "@/components/ui/export-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddStudentDialog, type NewStudentData } from "@/components/add-student-dialog";
import {
  NewEnrolmentDialog,
  type StudentDepartment,
} from "@/components/enrolment/new-enrolment-dialog";
import {
  students as studentsStore,
  studentDetail,
  tasks as tasksStore,
  staffMembers,
  currentUser,
  type Student,
  type Task,
  type TaskPriority,
  type TaskType,
} from "@/lib/mock-data";
import { EmptyState } from "@/components/ui/empty-state";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { SortableHeader } from "@/components/ui/sortable-header";
import { useSavedSegments } from "@/hooks/use-saved-segments";
import { DateRangePicker, type DateRange, type PresetItem } from "@/components/ui/date-range-picker";

function getNextStudentId(): string {
  const max = studentsStore.reduce((acc, s) => {
    const n = parseInt(s.id.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `IMI-${String(max + 1).padStart(4, "0")}`;
}

function formatCreatedOn(d: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

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
  onAddEnrolment,
  onNewTask,
  onLogNote,
  onWithdraw,
}: {
  student: Student;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  openUpward: boolean;
  onAddEnrolment: (s: Student) => void;
  onNewTask: (s: Student) => void;
  onLogNote: (s: Student) => void;
  onWithdraw: (s: Student) => void;
}) {
  const router = useRouter();
  const { can } = usePermission();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, onClose]);

  const alreadyWithdrawn = student.status === "Withdrawn";

  type Item = {
    kind: "action";
    icon: typeof Eye;
    label: string;
    onClick: () => void;
    danger?: boolean;
    show: boolean;
  } | { kind: "separator"; show: boolean };

  const rawItems: Item[] = [
    { kind: "action", icon: Eye,           label: "View profile",     onClick: () => router.push(`/students/${student.id}`), show: true },
    { kind: "action", icon: BookOpen,      label: "Add enrolment",    onClick: () => onAddEnrolment(student),                show: can('enrolment.create') && !alreadyWithdrawn },
    { kind: "action", icon: ClipboardList, label: "New task",         onClick: () => onNewTask(student),                     show: can('tasks.create') },
    { kind: "action", icon: MessageSquare, label: "Log contact note", onClick: () => onLogNote(student),                     show: true },
    { kind: "separator", show: can('enrolment.withdraw') && !alreadyWithdrawn },
    { kind: "action", icon: UserX,         label: "Withdraw student", onClick: () => onWithdraw(student), danger: true,       show: can('enrolment.withdraw') && !alreadyWithdrawn },
  ];
  const items = rawItems.filter((i) => i.show);

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
          role="menu"
          className={cn(
            "absolute right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-lg min-w-[184px] py-1",
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          )}
        >
          {items.map((item, i) => {
            if (item.kind === "separator") {
              return <div key={`sep-${i}`} className="my-1 border-t border-slate-100" />;
            }
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); item.onClick(); onClose(); }}
                className={cn(
                  "w-full text-left flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors cursor-pointer",
                  item.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {item.label}
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

// ─── Date filter helpers ──────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseCreatedOn(s: string): Date | null {
  const parts = s.trim().split(/\s+/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = MONTH_MAP[parts[1]];
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  return null;
}

function inDateRange(createdOn: string, range: DateRange): boolean {
  if (!range.from && !range.to) return true;
  const d = parseCreatedOn(createdOn);
  if (!d) return true;
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

function getTermRange(now: Date, offset: 0 | -1): DateRange {
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let from: Date, to: Date;

  if (offset === 0) {
    if (month >= 9)       { from = new Date(year, 8, 1);  to = new Date(year, 11, 31); }
    else if (month <= 4)  { from = new Date(year, 0, 1);  to = new Date(year, 3, 30); }
    else                  { from = new Date(year, 4, 1);  to = new Date(year, 7, 31); }
  } else {
    if (month >= 9)       { from = new Date(year, 4, 1);      to = new Date(year, 7, 31); }
    else if (month <= 4)  { from = new Date(year - 1, 8, 1);  to = new Date(year - 1, 11, 31); }
    else                  { from = new Date(year, 0, 1);      to = new Date(year, 3, 30); }
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
    { label: "Last 7 Days", getValue: () => {
      const to = new Date(); const from = new Date();
      from.setDate(from.getDate() - 6);
      return { from, to };
    }},
    { label: "Last Month", getValue: () => {
      const now = new Date();
      return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 0) };
    }},
    { label: "Last 30 Days", getValue: () => {
      const to = new Date(); const from = new Date();
      from.setDate(from.getDate() - 29);
      return { from, to };
    }},
    { label: "This Term",          getValue: () => getTermRange(new Date(), 0) },
    { label: "Last Term",          getValue: () => getTermRange(new Date(), -1) },
    { label: "This Academic Year", getValue: () => getAcademicYearRange(new Date(), 0) },
    { label: "Last Academic Year", getValue: () => getAcademicYearRange(new Date(), -1) },
    { label: "All Time",           getValue: () => ({ from: null, to: null }) },
    { separator: true } as const,
    { label: "Custom Range", getValue: () => ({ from: null, to: null }), keepOpen: true },
  ];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const { can } = usePermission();
  const router = useRouter();
  const [exportOpen, setExportOpen] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [studentsVersion, setStudentsVersion] = useState(0);

  // Filters
  const [statusFilter,     setStatusFilter]     = useState<string[]>([]);
  const [yearFilter,       setYearFilter]       = useState<string[]>([]);
  const [deptFilter,       setDeptFilter]       = useState<string[]>([]);
  const [enrolmentsFilter, setEnrolmentsFilter] = useState<string[]>([]);
  const [dateFilter,       setDateFilter]       = useState<DateRange>({ from: null, to: null });
  const [searchQuery,      setSearchQuery]      = useState("");
  const [searchExpanded,   setSearchExpanded]   = useState(false);

  const addedOnPresets = useMemo(() => buildAddedOnPresets(), []);

  // Sort
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir,   setSortDir]   = useState<"asc" | "desc">("asc");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Row actions dropdown
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Row action dialogs
  const [enrolmentStudent, setEnrolmentStudent] = useState<Student | null>(null);
  const [taskStudent,      setTaskStudent]      = useState<Student | null>(null);
  const [noteStudent,      setNoteStudent]      = useState<Student | null>(null);
  const [withdrawStudent,  setWithdrawStudent]  = useState<Student | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Segments
  const { segments, saveSegment, deleteSegment } = useSavedSegments("students");
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);

  const isAnyFilterActive =
    statusFilter.length > 0 || yearFilter.length > 0 ||
    deptFilter.length > 0 || enrolmentsFilter.length > 0 ||
    searchQuery !== "" || !!(dateFilter.from || dateFilter.to);

  useEffect(() => { setCurrentPage(1); }, [statusFilter, yearFilter, deptFilter, enrolmentsFilter, searchQuery, dateFilter]);

  function clearFilters() {
    setStatusFilter([]);
    setYearFilter([]);
    setDeptFilter([]);
    setEnrolmentsFilter([]);
    setDateFilter({ from: null, to: null });
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
    let data = studentsStore.filter((s) => {
      if (statusFilter.length > 0 && !statusFilter.includes(s.status)) return false;
      if (yearFilter.length > 0 && !yearFilter.includes(s.yearGroup)) return false;
      if (deptFilter.length > 0 && !deptFilter.includes(s.department)) return false;
      if (!matchEnrolmentFilter(s.enrolments, enrolmentsFilter)) return false;
      if ((dateFilter.from || dateFilter.to) && !inDateRange(s.createdOn, dateFilter)) return false;
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
  }, [statusFilter, yearFilter, deptFilter, enrolmentsFilter, dateFilter, searchQuery, sortField, sortDir, studentsVersion]);

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

  if (!can('students.view')) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-4 max-w-[1400px] mx-auto">

      {/* ── Page header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2">
        {can('import') && (
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Import CSV
          </button>
        )}
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
        {can('students.create') && (
          <button
            type="button"
            onClick={() => setAddStudentOpen(true)}
            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Student
          </button>
        )}
      </div>

      <AddStudentDialog
        open={addStudentOpen}
        onOpenChange={setAddStudentOpen}
        existingStudents={studentsStore}
        onCreated={(data: NewStudentData) => {
          const fullName = `${data.firstName} ${data.lastName}`.trim();
          const guardianName = data.primaryGuardian
            ? `${data.primaryGuardian.firstName} ${data.primaryGuardian.lastName}`.trim()
            : "";
          const newStudent: Student = {
            id: getNextStudentId(),
            name: fullName,
            yearGroup: data.yearGroup,
            department: data.department,
            school: data.school,
            guardian: guardianName,
            guardianPhone: data.primaryGuardian
              ? `${data.primaryGuardian.dialCode || "+971"} ${data.primaryGuardian.phone}`.trim()
              : "",
            enrolments: 0,
            churnScore: null,
            status: "Active",
            lastContact: "Today",
            createdOn: formatCreatedOn(new Date()),
          };
          studentsStore.unshift(newStudent);
          setStudentsVersion((v) => v + 1);
          toast.success(`${fullName} added`, { description: `Student ID ${newStudent.id}` });
        }}
      />

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Students"
        recordCount={1847}
        formats={[
          { id: 'csv-summary', label: 'Student Summary', description: 'One row per student. Name, year, subjects, status, guardian contact.', icon: 'rows', recommended: true },
          { id: 'csv-full', label: 'Full Export', description: 'All fields including enrolment history and notes.', icon: 'items' },
        ]}
      />

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
          <DateRangePicker
            value={dateFilter}
            onChange={(r) => { setDateFilter(r); setCurrentPage(1); }}
            presets={addedOnPresets}
            placeholder="Added On"
            twoMonth
          />
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
          {can('students.export') && (
            <>
              <span className="text-amber-300 hidden sm:inline">·</span>
              <button type="button" className="text-amber-700 hover:text-amber-900 font-medium transition-colors cursor-pointer">Export</button>
            </>
          )}
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
                          onAddEnrolment={setEnrolmentStudent}
                          onNewTask={setTaskStudent}
                          onLogNote={setNoteStudent}
                          onWithdraw={setWithdrawStudent}
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

      {/* ── Row-action dialogs ────────────────────────────────────────────────── */}
      {enrolmentStudent && (
        <NewEnrolmentDialog
          open={true}
          onOpenChange={(v) => { if (!v) setEnrolmentStudent(null); }}
          studentId={enrolmentStudent.id}
          studentName={enrolmentStudent.name}
          yearGroup={enrolmentStudent.yearGroup}
          department={enrolmentStudent.department as StudentDepartment}
        />
      )}

      <NewTaskDialog
        student={taskStudent}
        onClose={() => setTaskStudent(null)}
      />

      <LogNoteDialog
        student={noteStudent}
        onClose={() => setNoteStudent(null)}
      />

      <WithdrawStudentDialog
        student={withdrawStudent}
        onClose={() => setWithdrawStudent(null)}
        onConfirmed={() => setStudentsVersion((v) => v + 1)}
      />
    </div>
  );
}

// ─── Row-action dialogs ───────────────────────────────────────────────────────

const FIELD =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";
const FIELD_ERROR = "border-red-300 focus:ring-red-300 focus:border-red-400";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block mb-1.5 text-xs font-semibold text-slate-700">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function LinkedChip({ label, name }: { label: string; name: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs">
      <span className="text-amber-700/70 uppercase tracking-wide font-semibold text-[10px]">{label}</span>
      <span className="text-amber-800 font-semibold">{name}</span>
    </div>
  );
}

// ── New Task ────────────────────────────────────────────────────────────────

const TASK_TYPES: TaskType[] = ["Admin", "Academic", "Finance", "HR", "Student Follow-up", "Cover", "Personal"];
const TASK_PRIORITIES: TaskPriority[] = ["High", "Medium", "Low"];

function todayIsoPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatTaskDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getNextTaskId(): string {
  const max = tasksStore.reduce((acc, t) => {
    const n = parseInt(t.id.replace(/[^0-9]/g, ""), 10);
    return Number.isFinite(n) ? Math.max(acc, n) : acc;
  }, 0);
  return `TK-${String(max + 1).padStart(3, "0")}`;
}

function NewTaskDialog({
  student,
  onClose,
}: {
  student: Student | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<TaskType>("Student Follow-up");
  const [priority, setPriority] = useState<TaskPriority>("Medium");
  const [dueDate, setDueDate] = useState<string>(() => todayIsoPlus(3));
  const [assignee, setAssignee] = useState<string>(currentUser.name);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (student) {
      setTitle("");
      setType("Student Follow-up");
      setPriority("Medium");
      setDueDate(todayIsoPlus(3));
      setAssignee(currentUser.name);
      setError("");
    }
  }, [student]);

  function handleSave() {
    if (!student) return;
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }
    const newTask: Task = {
      id: getNextTaskId(),
      title: title.trim(),
      type,
      priority,
      status: "Open",
      assignee,
      dueDate: formatTaskDate(dueDate),
      linkedRecord: { type: "student", name: student.name, id: student.id },
      description: "",
      subtasks: [],
      overdue: false,
    };
    tasksStore.unshift(newTask);
    toast.success("Task created", { description: `${newTask.id} · Linked to ${student.name}` });
    onClose();
  }

  const activeStaff = useMemo(
    () => staffMembers.filter((s) => s.status === "Active"),
    [],
  );

  return (
    <Dialog open={!!student} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[480px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
          <DialogDescription>
            Create a task linked to this student.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {student && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-1.5">
                Linked record
              </p>
              <LinkedChip label="Student" name={`${student.name} · ${student.id}`} />
            </div>
          )}

          <div>
            <FieldLabel required>Task title</FieldLabel>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Follow up on Term 3 enrolment"
              value={title}
              onChange={(e) => { setTitle(e.target.value); if (error) setError(""); }}
              className={cn(FIELD, error && FIELD_ERROR)}
            />
            {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Type</FieldLabel>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className={FIELD}
              >
                {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Priority</FieldLabel>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={FIELD}
              >
                {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Due date</FieldLabel>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={FIELD}
              />
            </div>
            <div>
              <FieldLabel>Assignee</FieldLabel>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className={FIELD}
              >
                <option value={currentUser.name}>{currentUser.name} (me)</option>
                {activeStaff
                  .filter((s) => s.name !== currentUser.name)
                  .map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
            style={{ backgroundColor: "#F59E0B" }}
          >
            Create task
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Log Contact Note ────────────────────────────────────────────────────────

function LogNoteDialog({
  student,
  onClose,
}: {
  student: Student | null;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");

  useEffect(() => { if (student) setNote(""); }, [student]);

  function handleSave() {
    if (!student || !note.trim()) return;
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString("en-GB", { month: "short" });
    studentDetail.communicationLog.unshift({
      date: `${day} ${month}`,
      channel: "Email",
      message: note.trim(),
      sentBy: currentUser.name,
      status: "Logged",
    });
    toast.success("Contact note saved");
    onClose();
  }

  return (
    <Dialog open={!!student} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[440px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Log contact note</DialogTitle>
          <DialogDescription>
            {student ? `Add a note for ${student.name} (${student.id}).` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5">
          <FieldLabel required>Note</FieldLabel>
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={5}
            placeholder="What did you discuss? e.g. Called guardian — confirmed Term 3 schedule…"
            className={cn(FIELD, "resize-none")}
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!note.trim()}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer",
              note.trim() ? "bg-amber-500 hover:bg-amber-600" : "bg-amber-300 cursor-not-allowed",
            )}
            style={note.trim() ? { backgroundColor: "#F59E0B" } : undefined}
          >
            Save note
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Withdraw Student ────────────────────────────────────────────────────────

function WithdrawStudentDialog({
  student,
  onClose,
  onConfirmed,
}: {
  student: Student | null;
  onClose: () => void;
  onConfirmed: () => void;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    if (student) { setReason(""); setError(false); }
  }, [student]);

  function handleConfirm() {
    if (!student) return;
    if (!reason.trim()) { setError(true); return; }
    const target = studentsStore.find((s) => s.id === student.id);
    if (target) target.status = "Withdrawn";
    toast.success(`${student.name} has been withdrawn`);
    onConfirmed();
    onClose();
  }

  return (
    <Dialog open={!!student} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[460px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Withdraw student</DialogTitle>
          <DialogDescription>
            This will mark {student?.name ?? "this student"} as Withdrawn and
            stop future enrolment activity. A reason is required for the record.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-800 leading-relaxed">
              Active enrolments and scheduled sessions should be handled
              separately. This action changes the student&apos;s status only.
            </p>
          </div>

          <div>
            <FieldLabel required>Reason for withdrawal</FieldLabel>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => { setReason(e.target.value); if (error) setError(false); }}
              rows={4}
              placeholder="e.g. Family relocating overseas; completed programme early…"
              className={cn(FIELD, "resize-none", error && FIELD_ERROR)}
            />
            {error && <p className="mt-1 text-[11px] text-red-600">Reason is required</p>}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
          >
            Withdraw student
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
