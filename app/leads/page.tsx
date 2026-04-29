"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutGrid,
  List,
  Table2,
  MoreHorizontal,
  Bell,
  Plus,
  Search,
  X,
  MoveRight,
  XCircle,
  Archive,
  Eye,
  Filter,
  Download,
  Edit3,
  BookOpen,
  UserPlus,
  ArrowRight,
  MessageSquare,
  Paperclip,
  AtSign,
  Link2,
  Check,
  CheckCircle2,
  CheckSquare,
  Smile,
  SendHorizontal,
  User as UserIcon,
  FileText,
  ListTodo,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronsDown,
  ChevronsUp,
  GripVertical,
  AlertCircle,
  Phone,
  Mail,
  SlidersHorizontal,
} from "lucide-react";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { DateRangePicker, DATE_PRESETS, type DateRange } from "@/components/ui/date-range-picker";
import { SortableHeader } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useSavedSegments } from "@/hooks/use-saved-segments";
import { useSafePopover } from "@/hooks/use-safe-popover";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { ExportDialog } from "@/components/ui/export-dialog";
import { MentionInput, type MentionInputRef, type MentionContent, type MentionData } from "@/components/chat/mention-input";
import { pushNotification } from "@/lib/notifications-store";
import { createClient } from "@/lib/supabase/client";

// ─── Inline types (previously from mock-data) ─────────────────────────────────

type LeadStage =
  | "New"
  | "Contacted"
  | "Assessment Booked"
  | "Assessment Done"
  | "Trial Booked"
  | "Trial Done"
  | "Schedule Offered"
  | "Schedule Confirmed"
  | "Invoice Sent"
  | "Won"
  | "Lost";

type LeadSource = "Website" | "Phone" | "Walk-in" | "Referral" | "Event";
type PreferredWindow = "Morning" | "Afternoon" | "Evening" | "Any";

type Lead = {
  id: string;
  ref: string;
  childName: string;
  yearGroup: string;
  department: string;
  subjects: string[];
  guardian: string;
  guardianPhone: string;
  source: LeadSource;
  stage: LeadStage;
  assignedTo: string;
  lastActivity: string;
  daysInStage: number;
  daysInPipeline: number;
  dnc: boolean;
  sibling: boolean;
  stageMessagePending: boolean;
  preferredDays?: string[];
  preferredWindow?: PreferredWindow;
  createdOn?: string;
  lostReason?: string;
  lostNotes?: string;
  reEngage?: boolean;
  reEngageAfter?: string;
  status?: 'active' | 'converted' | 'lost' | 'archived';
  convertedStudentId?: string;
  convertedOn?: string;
};

// ─── Kanban Personalisation Types ────────────────────────────────────────────

type CardDensity = "compact" | "default" | "comfortable";

type KanbanFieldVisibility = {
  guardian: boolean;
  phone: boolean;
  sourceBadge: boolean;
  assignedTo: boolean;
  daysInStage: boolean;
  daysInPipeline: boolean;
  enquiryDate: boolean;
};

type KanbanPrefs = {
  density: CardDensity;
  columnWidth: number;
  fields: KanbanFieldVisibility;
  collapsedColumns: string[];
};

const DEFAULT_KANBAN_PREFS: KanbanPrefs = {
  density: "default",
  columnWidth: 280,
  fields: {
    guardian: true,
    phone: false,
    sourceBadge: true,
    assignedTo: true,
    daysInStage: true,
    daysInPipeline: false,
    enquiryDate: false,
  },
  collapsedColumns: [],
};

type TaskType = "Admin" | "Academic" | "Finance" | "HR" | "Student Follow-up" | "Cover" | "Personal";
type TaskPriority = "Urgent" | "High" | "Medium" | "Low";
type TaskStatus = "Open" | "In Progress" | "Blocked" | "Done";

type Task = {
  id: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignee: string;
  dueDate: string;
  linkedRecord: { type: string; name: string; id: string } | null;
  description: string;
  subtasks: string[];
  overdue: boolean;
  sourceLeadId?: string;
  sourceLeadName?: string;
};

type StudentStatus = "Active" | "Withdrawn" | "Graduated" | "Alumni" | "Archived";

type Student = {
  id: string;
  name: string;
  studentRef?: string;
  yearGroup: string;
  department?: string;
  school?: string;
  status: StudentStatus;
  enrolledDate?: string;
  guardian?: string;
  guardianPhone?: string;
  guardianId?: string;
  enrolments?: number;
  churnScore?: number | null;
  lastContact?: string;
  createdOn?: string;
  sourceLeadId?: string;
};

// ─── Inline constant (previously from mock-data) ──────────────────────────────

const LEAD_STAGES: LeadStage[] = [
  "New",
  "Contacted",
  "Assessment Booked",
  "Assessment Done",
  "Trial Booked",
  "Trial Done",
  "Schedule Offered",
  "Schedule Confirmed",
  "Invoice Sent",
  "Won",
  "Lost",
];
import { AVATAR_PALETTES, getAvatarPalette, getInitials } from "@/lib/avatar-utils";
import { useCurrentUser } from "@/lib/use-current-user";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useJourney, BILAL_LEAD_ID, departmentFor, formatDate, type ActivityEntry } from "@/lib/journey-store";
import { useAssessments } from "@/lib/assessment-store";
import { BookAssessmentDialog } from "@/components/journey/book-assessment-dialog";
import { LogAssessmentOutcomeDialog } from "@/components/journey/log-assessment-outcome-dialog";
import { BookTrialDialog } from "@/components/journey/book-trial-dialog";
import { LogTrialOutcomeDialog } from "@/components/journey/log-trial-outcome-dialog";
import { ConvertToStudentDialog, type ConvertFormData } from "@/components/journey/convert-to-student-dialog";
import { CreateEnrolmentDialog } from "@/components/journey/create-enrolment-dialog";
import { ScheduleOfferDialog } from "@/components/journey/schedule-offer-dialog";
import { ScheduleConfirmDialog } from "@/components/journey/schedule-confirm-dialog";
import dynamic from "next/dynamic";
const InvoiceBuilderDialog = dynamic(
  () => import("@/components/journey/invoice-builder-dialog").then((m) => ({ default: m.InvoiceBuilderDialog })),
  { loading: () => null }
);
import { RecordPaymentDialog } from "@/components/journey/record-payment-dialog";
import { SkipWarningDialog, shouldWarnSkip } from "@/components/journey/skip-warning-dialog";
import { TrialSkipPromptDialog } from "@/components/journey/trial-skip-prompt-dialog";
import { NeedsMoreTimeDialog } from "@/components/journey/needs-more-time-dialog";
import { SkipAssessmentDialog } from "@/components/journey/skip-assessment-dialog";

// ─── API adapter ─────────────────────────────────────────────────────────────

type ApiLead = {
  id: string
  ref: string | null
  child_name: string
  year_group: string | null
  department: string | null
  subjects: string[] | null
  guardian: string | null
  guardian_phone: string | null
  source: string | null
  stage: LeadStage
  assigned_to: string | null
  dnc: boolean
  sibling: boolean
  lost_reason: string | null
  lost_notes: string | null
  re_engage: boolean
  re_engage_after: string | null
  status: string | null
  converted_student_id: string | null
  created_at: string
  updated_at: string
  last_activity: string | null
  days_in_stage: number | null
  days_in_pipeline: number | null
}

type ApiStudent = {
  id: string
  student_number: string | null
  first_name: string
  last_name: string
}

function _daysBetween(from: string, to: string) {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24))
}

function _fmtActivity(ts: string | null): string {
  if (!ts) return "—"
  const d = _daysBetween(ts, new Date().toISOString())
  if (d <= 0) return "Today"
  if (d === 1) return "Yesterday"
  return `${d} days ago`
}

function toLead(r: ApiLead): Lead {
  let status: Lead['status'] = 'active'
  if (r.status === 'lost') status = 'lost'
  else if (r.status === 'archived') status = 'archived'
  else if (r.status === 'converted' || r.converted_student_id) status = 'converted'
  return {
    id: r.id,
    ref: r.ref ?? '',
    childName: r.child_name,
    yearGroup: r.year_group ?? '',
    department: r.department ?? '',
    subjects: r.subjects ?? [],
    guardian: r.guardian ?? '',
    guardianPhone: r.guardian_phone ?? '',
    source: (r.source as LeadSource) ?? 'Website',
    stage: r.stage,
    assignedTo: r.assigned_to ?? '',
    lastActivity: _fmtActivity(r.last_activity ?? r.updated_at),
    daysInStage: r.days_in_stage ?? 0,
    daysInPipeline: r.days_in_pipeline ?? _daysBetween(r.created_at, new Date().toISOString()),
    dnc: r.dnc,
    sibling: r.sibling,
    stageMessagePending: false,
    createdOn: r.created_at.slice(0, 10),
    lostReason: r.lost_reason ?? undefined,
    lostNotes: r.lost_notes ?? undefined,
    reEngage: r.re_engage,
    reEngageAfter: r.re_engage_after ?? undefined,
    status,
    convertedStudentId: r.converted_student_id ?? undefined,
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES = LEAD_STAGES;

const STAGE_CONFIG: Record<
  LeadStage,
  { color: string; badge: string; colBg: string; headerText: string; dot: string }
> = {
  New: {
    color: "border-l-slate-400",
    badge: "bg-slate-100 text-slate-700",
    colBg: "bg-slate-50",
    headerText: "text-slate-700",
    dot: "bg-slate-400",
  },
  Contacted: {
    color: "border-l-blue-400",
    badge: "bg-blue-100 text-blue-700",
    colBg: "bg-blue-50/40",
    headerText: "text-blue-700",
    dot: "bg-blue-500",
  },
  "Assessment Booked": {
    color: "border-l-purple-400",
    badge: "bg-purple-100 text-purple-700",
    colBg: "bg-purple-50/40",
    headerText: "text-purple-700",
    dot: "bg-purple-500",
  },
  "Assessment Done": {
    color: "border-l-indigo-400",
    badge: "bg-indigo-100 text-indigo-700",
    colBg: "bg-indigo-50/40",
    headerText: "text-indigo-700",
    dot: "bg-indigo-500",
  },
  "Trial Booked": {
    color: "border-l-amber-400",
    badge: "bg-amber-100 text-amber-700",
    colBg: "bg-amber-50/40",
    headerText: "text-amber-700",
    dot: "bg-amber-500",
  },
  "Trial Done": {
    color: "border-l-emerald-400",
    badge: "bg-emerald-100 text-emerald-700",
    colBg: "bg-emerald-50/40",
    headerText: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  "Schedule Offered": {
    color: "border-l-orange-400",
    badge: "bg-orange-100 text-orange-700",
    colBg: "bg-orange-50/40",
    headerText: "text-orange-700",
    dot: "bg-orange-500",
  },
  "Schedule Confirmed": {
    color: "border-l-cyan-400",
    badge: "bg-cyan-100 text-cyan-700",
    colBg: "bg-cyan-50/40",
    headerText: "text-cyan-700",
    dot: "bg-cyan-500",
  },
  "Invoice Sent": {
    color: "border-l-teal-400",
    badge: "bg-teal-100 text-teal-700",
    colBg: "bg-teal-50/40",
    headerText: "text-teal-700",
    dot: "bg-teal-500",
  },
  Won: {
    color: "border-l-green-400",
    badge: "bg-green-100 text-green-700",
    colBg: "bg-green-50/50",
    headerText: "text-green-700",
    dot: "bg-green-500",
  },
  Lost: {
    color: "border-l-red-400",
    badge: "bg-red-100 text-red-700",
    colBg: "bg-red-50/40",
    headerText: "text-red-700",
    dot: "bg-red-500",
  },
};

const SOURCE_CONFIG: Record<LeadSource, string> = {
  Website: "bg-blue-100 text-blue-700",
  Referral: "bg-green-100 text-green-700",
  Phone: "bg-slate-100 text-slate-600",
  "Walk-in": "bg-orange-100 text-orange-700",
  Event: "bg-purple-100 text-purple-700",
};

const STAGE_FILTER_OPTIONS: string[] = [...STAGES];
const SOURCE_FILTER_OPTIONS: string[] = ["Website", "Phone", "Walk-in", "Referral", "Event"];
const DEPT_FILTER_OPTIONS = ["Primary", "Lower Secondary", "Senior"];
const ASSIGNED_FILTER_OPTIONS: string[] = [];

const ADD_LEAD_YEAR_OPTIONS = [
  "KG1", "KG2", "Y1", "Y2", "Y3", "Y4", "Y5", "Y6",
  "Y7", "Y8", "Y9", "Y10", "Y11", "Y12", "Y13",
];
const ADD_LEAD_SUBJECT_OPTIONS = [
  "Maths", "English", "Science", "Physics",
  "Chemistry", "Biology", "Business", "Economics",
];
const ADD_LEAD_SOURCE_OPTIONS: LeadSource[] = ["Website", "Referral", "Event", "Phone", "Walk-in"];

// ─── Lead action handlers (shared across menus & detail dialog) ───────────────

function nextStageOf(stage: LeadStage): LeadStage | null {
  if (stage === "Won" || stage === "Lost") return null;
  const idx = STAGES.indexOf(stage);
  if (idx < 0 || idx >= STAGES.length - 1) return null;
  return STAGES[idx + 1];
}

// ─── Save Segment Popover ──────────────────────────────────────────────────────

function SaveSegmentPopover({ onSave, onClose }: { onSave: (name: string) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  return (
    <div className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-56 top-full left-0 mt-1">
      <p className="text-xs font-medium text-slate-700 mb-2">Name this segment</p>
      <input
        autoFocus
        className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:border-amber-400"
        placeholder="e.g. High-priority leads"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onSave(name.trim());
          if (e.key === "Escape") onClose();
        }}
      />
      <div className="flex gap-2">
        <button onClick={() => name.trim() && onSave(name.trim())} className="flex-1 bg-amber-500 text-white text-xs py-1.5 rounded-lg hover:bg-amber-600 cursor-pointer">Save</button>
        <button onClick={onClose} className="flex-1 border border-slate-200 text-slate-600 text-xs py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">Cancel</button>
      </div>
    </div>
  );
}

// ─── Kanban Personalisation ───────────────────────────────────────────────────

function useKanbanPrefs(userEmail: string | undefined) {
  const storageKey = `enrolla_kanban_prefs_${userEmail ?? "guest"}`;
  const [prefs, setPrefsState] = useState<KanbanPrefs>(DEFAULT_KANBAN_PREFS);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userEmail) return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<KanbanPrefs>;
        setPrefsState({
          ...DEFAULT_KANBAN_PREFS,
          ...parsed,
          fields: { ...DEFAULT_KANBAN_PREFS.fields, ...(parsed.fields ?? {}) },
          collapsedColumns: parsed.collapsedColumns ?? [],
        });
      }
    } catch {}
  }, [userEmail, storageKey]);

  const setPrefs = useCallback(
    (updater: (prev: KanbanPrefs) => KanbanPrefs) => {
      setPrefsState((prev) => {
        const next = updater(prev);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch {}
        }, 500);
        return next;
      });
    },
    [storageKey],
  );

  const resetPrefs = useCallback(() => {
    setPrefsState(DEFAULT_KANBAN_PREFS);
    try { localStorage.removeItem(storageKey); } catch {}
  }, [storageKey]);

  return { prefs, setPrefs, resetPrefs };
}

const DENSITY_OPTIONS: { key: CardDensity; label: string }[] = [
  { key: "compact", label: "Compact" },
  { key: "default", label: "Default" },
  { key: "comfortable", label: "Comfortable" },
];

const COL_WIDTH_SNAP_POINTS = [
  { value: 220, label: "Narrow" },
  { value: 280, label: "Default" },
  { value: 400, label: "Wide" },
];

const FIELD_OPTIONS: { key: keyof KanbanFieldVisibility; label: string }[] = [
  { key: "guardian", label: "Guardian name" },
  { key: "phone", label: "Phone number" },
  { key: "sourceBadge", label: "Source badge" },
  { key: "assignedTo", label: "Assigned to" },
  { key: "daysInStage", label: "Days in stage" },
  { key: "daysInPipeline", label: "Days in pipeline" },
  { key: "enquiryDate", label: "Enquiry date" },
];

function PersonalisePopover({
  popoverRef,
  pos,
  prefs,
  setPrefs,
  onReset,
}: {
  popoverRef: React.RefObject<HTMLDivElement | null>;
  pos: { top: number; left: number };
  prefs: KanbanPrefs;
  setPrefs: (updater: (prev: KanbanPrefs) => KanbanPrefs) => void;
  onReset: () => void;
}) {
  return createPortal(
    <div
      ref={popoverRef}
      role="dialog"
      aria-label="Personalise view"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        zIndex: 1000,
        width: 300,
        maxHeight: "calc(100vh - 120px)",
      }}
      className="overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100">
        <p className="text-sm font-semibold text-slate-800">Personalise View</p>
      </div>

      <div className="px-4 py-3 space-y-5">
        {/* Card Density */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Card Density</p>
          <div className="grid grid-cols-3 gap-1.5">
            {DENSITY_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                aria-pressed={prefs.density === key}
                onClick={() => setPrefs((p) => ({ ...p, density: key }))}
                className={cn(
                  "px-2 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer",
                  prefs.density === key
                    ? "bg-amber-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Column Width */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Column Width <span className="font-normal normal-case">({prefs.columnWidth}px)</span>
          </p>
          <input
            type="range"
            min={220}
            max={400}
            step={10}
            value={prefs.columnWidth}
            onChange={(e) => setPrefs((p) => ({ ...p, columnWidth: Number(e.target.value) }))}
            aria-label="Column width"
            aria-valuenow={prefs.columnWidth}
            aria-valuemin={220}
            aria-valuemax={400}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between mt-1">
            {COL_WIDTH_SNAP_POINTS.map(({ value, label }) => (
              <button
                key={label}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, columnWidth: value }))}
                className={cn(
                  "text-[10px] cursor-pointer transition-colors",
                  prefs.columnWidth === value
                    ? "text-amber-600 font-semibold"
                    : "text-slate-400 hover:text-slate-600",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Card Fields */}
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Card Fields</p>
          <div className="space-y-2">
            {FIELD_OPTIONS.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={prefs.fields[key]}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, fields: { ...p.fields, [key]: e.target.checked } }))
                  }
                  className="w-3.5 h-3.5 rounded accent-amber-500 cursor-pointer"
                />
                <span className="text-xs text-slate-700 group-hover:text-slate-900 transition-colors">{label}</span>
              </label>
            ))}
            <p className="text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-100">
              Always shown: student name, year group, subjects
            </p>
          </div>
        </div>
      </div>

      {/* Reset — pinned footer */}
      <div className="px-4 py-3 border-t border-slate-100">
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-amber-600 transition-colors cursor-pointer underline"
        >
          Reset to default
        </button>
      </div>
    </div>,
    document.body,
  );
}

// ─── Lead Action Menu (three-dot, shared) ─────────────────────────────────────

type LeadActions = {
  onView: () => void;
  onEdit: () => void;
  onMoveStage: () => void;
  onBookAssessment: () => void;
  onBookTrial: () => void;
  onConvertToStudent: () => void;
  onMarkLost: () => void;
  onArchive: () => void;
};

function LeadActionMenu({
  lead,
  actions,
  size = "md",
}: {
  lead: Lead;
  actions: LeadActions;
  size?: "sm" | "md";
}) {
  const { can } = usePermission();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const canConvert = lead.stage === "Won" && lead.status !== "converted";

  const items: { icon: React.ElementType; label: string; onClick: () => void; hidden?: boolean; danger?: boolean }[] = [
    { icon: Eye, label: "View", onClick: actions.onView },
    { icon: Edit3, label: "Edit Lead", onClick: actions.onEdit },
    { icon: MoveRight, label: "Move Stage", onClick: actions.onMoveStage },
    { icon: BookOpen, label: "Book Assessment", onClick: actions.onBookAssessment },
    { icon: BookOpen, label: "Book Trial Session", onClick: actions.onBookTrial },
    { icon: UserPlus, label: "Convert to Student", onClick: actions.onConvertToStudent, hidden: !canConvert || !can('leads.convertToStudent') },
    { icon: XCircle, label: "Mark as Lost", onClick: actions.onMarkLost, hidden: !can("delete.records"), danger: true },
    { icon: Archive, label: "Archive", onClick: actions.onArchive, hidden: !can("delete.records"), danger: true },
  ];

  const btnClass =
    size === "sm"
      ? "p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer"
      : "p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer";
  const iconClass = size === "sm" ? "w-3.5 h-3.5 text-slate-400" : "w-4 h-4 text-slate-400";

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label="Lead actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={btnClass}
      >
        <MoreHorizontal className={iconClass} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[180px]">
          {items.filter((a) => !a.hidden).map(({ icon: Icon, label, onClick, danger }) => (
            <button
              key={label}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onClick();
              }}
              className={cn(
                "w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm transition-colors cursor-pointer",
                danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50",
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

// ─── KanbanCard ───────────────────────────────────────────────────────────────

function KanbanCard({
  lead,
  onOpenDetail,
  onOpenReminder,
  actions,
  prefs,
}: {
  lead: Lead;
  onOpenDetail: () => void;
  onOpenReminder: () => void;
  actions: LeadActions;
  prefs: KanbanPrefs;
}) {
  const cfg = STAGE_CONFIG[lead.stage];
  const palette = getAvatarPalette(lead.assignedTo);
  const { can } = usePermission();
  const [isDragging, setIsDragging] = useState(false);

  const isCompact = prefs.density === "compact";
  const isComfortable = prefs.density === "comfortable";
  const { fields } = prefs;

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead.id);
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetail();
        }
      }}
      className={cn(
        "rounded-lg border border-slate-200 shadow-sm border-l-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
        isCompact ? "p-2" : isComfortable ? "p-4" : "p-3",
        lead.dnc ? "border-l-red-400" : cfg.color,
        lead.stage === "Won" ? "bg-green-50" : lead.stage === "Lost" ? "bg-red-50/30" : "bg-white",
        lead.stage === "Lost" && "opacity-85 grayscale-[0.2]",
        isDragging && "opacity-40 scale-[0.98]",
      )}
    >
      {/* Top row — always visible */}
      <div className={cn("flex items-start justify-between gap-1", isCompact ? "mb-0.5" : "mb-1")}>
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className={cn("font-semibold text-slate-800 leading-tight", isCompact ? "text-xs" : "text-sm")}>
            {lead.childName}
          </span>
          {lead.dnc && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 shrink-0">
              DNC
            </span>
          )}
          {lead.sibling && !isCompact && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
              Sibling
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {lead.stageMessagePending && !isCompact && (
            <button
              type="button"
              aria-label="Set reminder"
              onClick={(e) => {
                e.stopPropagation();
                onOpenReminder();
              }}
              className="p-0.5 rounded hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-amber-500" />
            </button>
          )}
          {!isCompact && <LeadActionMenu lead={lead} actions={actions} size="sm" />}
        </div>
      </div>

      {/* Source badge */}
      {fields.sourceBadge && !isCompact && (
        <div className={isComfortable ? "mb-2" : "mb-1.5"}>
          <span className={cn("inline-flex px-1.5 py-0.5 rounded text-xs font-medium", SOURCE_CONFIG[lead.source])}>
            {lead.source}
          </span>
        </div>
      )}

      {/* Year + subjects — always visible */}
      <p className={cn("text-slate-500", isCompact ? "text-[10px] mb-0" : isComfortable ? "text-xs mb-1" : "text-xs mb-0.5")}>
        {lead.yearGroup} · {lead.subjects.join(", ")}
      </p>

      {/* Guardian */}
      {fields.guardian && !isCompact && (
        <p className={cn("text-xs text-slate-400", isComfortable ? "mb-2" : "mb-1.5")}>{lead.guardian}</p>
      )}

      {/* Phone — only in comfortable density */}
      {fields.phone && isComfortable && (
        <p className="text-xs text-slate-400 mb-1.5">{lead.guardianPhone}</p>
      )}

      {/* Enquiry date */}
      {fields.enquiryDate && isComfortable && lead.createdOn && (
        <p className="text-[10px] text-slate-400 mb-2">Enquired {lead.createdOn}</p>
      )}

      {/* Lost reason + re-engage chip */}
      {lead.stage === "Lost" && !isCompact && (
        <div className="mb-2 space-y-1">
          {lead.lostReason && (
            <p className="text-xs text-slate-400 italic truncate">{lead.lostReason}</p>
          )}
          {lead.reEngage === false ? (
            <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
              Do not re-engage
            </span>
          ) : lead.reEngageAfter ? (
            <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
              Re-engage after {lead.reEngageAfter}
            </span>
          ) : (
            <span className="inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700">
              Re-engage when ready
            </span>
          )}
        </div>
      )}

      {/* Bottom row */}
      {!isCompact && (
        <div className={cn("flex items-center justify-between", isComfortable && "mt-3")}>
          <div className="flex items-center gap-1.5">
            {fields.assignedTo && (
              <div
                className={cn(
                  "rounded-full flex items-center justify-center font-bold shrink-0",
                  isComfortable ? "w-6 h-6 text-xs" : "w-5 h-5 text-[10px]",
                  palette.bg,
                  palette.text,
                )}
              >
                {getInitials(lead.assignedTo)}
              </div>
            )}
            <span className="text-xs text-slate-400">{lead.lastActivity}</span>
          </div>
          <div className="flex items-center gap-2">
            {fields.daysInPipeline && isComfortable && (
              <span className="text-[10px] text-slate-400">{lead.daysInPipeline}d pipeline</span>
            )}
            {fields.daysInStage && (
              <span className="text-xs text-slate-400 font-medium">{lead.daysInStage}d</span>
            )}
          </div>
        </div>
      )}

      {/* Convert to Student CTA — only on Won cards, gated by permission */}
      {lead.stage === "Won" && lead.status !== "converted" && can('leads.convertToStudent') && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            actions.onConvertToStudent();
          }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold rounded-md bg-amber-500 text-white hover:bg-amber-600 cursor-pointer transition-colors shadow-sm"
        >
          <UserPlus className="w-3 h-3" />
          Convert to Student
        </button>
      )}
    </div>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

function KanbanColumn({
  stage,
  stageLeads,
  onOpenDetail,
  onOpenReminder,
  onAddLead,
  makeActions,
  onDropLead,
  prefs,
  collapsed,
  onToggleCollapse,
  columnWidth,
}: {
  stage: LeadStage;
  stageLeads: Lead[];
  onOpenDetail: (lead: Lead) => void;
  onOpenReminder: (lead: Lead) => void;
  onAddLead: (stage: LeadStage) => void;
  makeActions: (lead: Lead) => LeadActions;
  onDropLead: (leadId: string) => void;
  prefs: KanbanPrefs;
  collapsed: boolean;
  onToggleCollapse: () => void;
  columnWidth: number;
}) {
  const cfg = STAGE_CONFIG[stage];
  const { can } = usePermission();
  const [isDragOver, setIsDragOver] = useState(false);

  if (collapsed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center shrink-0 h-full rounded-lg border border-slate-200 overflow-hidden transition-all",
          cfg.colBg,
        )}
        style={{ width: "48px" }}
      >
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={`Expand ${stage} column`}
          title={`${stage} (${stageLeads.length})`}
          className="flex flex-col items-center justify-start gap-3 py-3 px-1 w-full h-full cursor-pointer hover:bg-white/40 transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span
            className={cn("text-[11px] font-semibold select-none", cfg.headerText)}
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {stage}
          </span>
          <span className={cn("text-[10px] font-bold px-1 py-0.5 rounded-full shrink-0", cfg.badge)}>
            {stageLeads.length}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col shrink-0 h-full" style={{ width: `${columnWidth}px` }}>
      {/* Column header */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 rounded-t-lg border border-b-0 border-slate-200 transition-colors group",
          cfg.colBg,
          isDragOver && "border-amber-400",
        )}
        onDoubleClick={onToggleCollapse}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("font-semibold text-sm truncate", cfg.headerText)}>{stage}</span>
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={`Collapse ${stage} column`}
            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 transition-all cursor-pointer shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full shrink-0", cfg.badge)}>
          {stageLeads.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setIsDragOver(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          const leadId = e.dataTransfer.getData("text/plain");
          if (leadId) onDropLead(leadId);
        }}
        className={cn(
          "flex flex-col gap-2 p-2 border border-t-0 border-slate-200 rounded-b-lg min-h-[120px] flex-1 overflow-y-auto transition-colors",
          cfg.colBg,
          isDragOver && "border-amber-400 ring-2 ring-amber-300/50 bg-amber-50/30",
        )}
      >
        {stageLeads.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">No leads at this stage</p>
        ) : (
          stageLeads.map((lead) => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              onOpenDetail={() => onOpenDetail(lead)}
              onOpenReminder={() => onOpenReminder(lead)}
              actions={makeActions(lead)}
              prefs={prefs}
            />
          ))
        )}

        {/* Add ghost button */}
        {can('leads.create') && (
          <button
            type="button"
            onClick={() => onAddLead(stage)}
            className="flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-colors cursor-pointer mt-1"
          >
            <Plus className="w-3 h-3" />
            Add Lead
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Lead Detail Dialog ───────────────────────────────────────────────────────

const DETAIL_TIMELINE: { label: string; text: string; dot: string }[] = [];

// ─── Embedded Team Chat (types, seed, component) ──────────────────────────────

const CHAT_STAFF: string[] = [];
const CHAT_EMOJIS = ["👍", "❤️", "😂", "🎉", "🙏", "🔥", "✅", "👀"];

type ChatChipKind = "student" | "invoice" | "task";

type ChatChip = {
  id: string;
  kind: ChatChipKind;
  label: string;
  ref: string;
  targetId?: string;
  linkedTaskId?: string;
  linkedToTask?: boolean;
};

type ChatReactionMap = Record<string, string[]>;

type ChatMessage = {
  id: string;
  author: string;
  day: string; // "Today" | "Yesterday" | e.g. "17 Apr"
  time: string; // HH:mm
  text: string;
  chips: ChatChip[];
  reactions: ChatReactionMap;
  mentions?: MentionData[];
};

const CHAT_LINK_CATALOGUE: { kind: ChatChipKind; label: string; ref: string; targetId?: string }[] = [];

type DbLeadMessage = {
  id: string;
  author: string;
  text: string;
  chips: ChatChip[];
  reactions: ChatReactionMap;
  mentions: MentionData[];
  created_at: string;
};

function dbRowToMessage(row: DbLeadMessage): ChatMessage {
  const date = new Date(row.created_at);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  const day = isToday ? "Today" : isYesterday ? "Yesterday" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return {
    id: row.id,
    author: row.author,
    day,
    time,
    text: row.text,
    chips: row.chips ?? [],
    reactions: row.reactions ?? {},
    mentions: row.mentions ?? [],
  };
}

let chatIdCounter = 0;
function nextChatId(prefix: string): string {
  chatIdCounter += 1;
  return `${prefix}-${chatIdCounter}`;
}

function formatMentionText(
  text: string,
  mentions?: MentionData[],
  activeStaffNames?: Set<string>,
  currentUserName?: string,
): React.ReactNode {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  const regex = /@([A-Za-z][A-Za-z ]{0,30})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(text)) !== null) {
    const candidate = match[1].trim();
    const mentionEntry = mentions?.find((m) => m.name === candidate);
    const isActive = mentionEntry
      ? (activeStaffNames ? activeStaffNames.has(mentionEntry.name) : true)
      : (activeStaffNames ? activeStaffNames.has(candidate) : false);
    const isKnown = !!mentionEntry || (activeStaffNames?.has(candidate) ?? false);

    if (!isKnown) continue;

    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));

    if (isActive) {
      const isSelf = !!currentUserName && candidate === currentUserName;
      parts.push(
        <span
          key={`m-${keyIdx++}`}
          className={cn(
            "inline-flex items-center rounded-full px-1.5 py-0 text-[12px] font-medium leading-5 mx-0.5",
            isSelf
              ? "bg-amber-200 text-amber-800 border border-amber-300"
              : "bg-blue-50 text-blue-700 border border-blue-200",
          )}
        >
          @{candidate}
        </span>,
      );
    } else {
      parts.push(
        <span
          key={`m-${keyIdx++}`}
          title="User no longer active"
          className="text-slate-400 line-through cursor-default"
        >
          @{candidate}
        </span>,
      );
    }

    lastIndex = match.index + match[0].length;
    regex.lastIndex = lastIndex;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? parts : text;
}

function chipIcon(kind: ChatChipKind): React.ElementType {
  if (kind === "student") return UserIcon;
  if (kind === "invoice") return FileText;
  return ListTodo;
}

function chipColours(kind: ChatChipKind): string {
  if (kind === "student") return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
  if (kind === "invoice") return "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100";
  return "bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100";
}

function chipHref(chip: ChatChip): string {
  if (chip.kind === "student") return `/students/${chip.targetId ?? chip.ref}`;
  if (chip.kind === "invoice") return "/finance";
  return chip.linkedTaskId ? `/tasks?taskId=${chip.linkedTaskId}` : "/tasks";
}

function LinkRecordDialog({
  open,
  onOpenChange,
  onInsert,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onInsert: (chip: ChatChip) => void;
}) {
  const [query, setQuery] = useState("");
  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filter = (k: ChatChipKind) =>
      CHAT_LINK_CATALOGUE.filter(
        (c) => c.kind === k && (!q || c.label.toLowerCase().includes(q) || c.ref.toLowerCase().includes(q)),
      );
    return {
      student: filter("student"),
      invoice: filter("invoice"),
      task: filter("task"),
    };
  }, [query]);

  function pick(kind: ChatChipKind, entry: { label: string; ref: string; targetId?: string }) {
    onInsert({
      id: nextChatId("chip"),
      kind,
      label: entry.label,
      ref: entry.ref,
      targetId: entry.targetId,
    });
    setQuery("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Link a record</DialogTitle>
          <DialogDescription>Attach a student, invoice, or task to this message.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search records…"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
          {(["student", "invoice", "task"] as ChatChipKind[]).map((kind) => {
            const entries = grouped[kind];
            const heading = kind === "student" ? "Students" : kind === "invoice" ? "Invoices" : "Tasks";
            const Icon = chipIcon(kind);
            return (
              <div key={kind}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">{heading}</p>
                {entries.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1.5">No matches</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {entries.map((e) => (
                      <button
                        key={`${kind}-${e.ref}`}
                        type="button"
                        onClick={() => pick(kind, e)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <span className={cn("p-1 rounded", chipColours(kind).split(" ").slice(0, 2).join(" "))}>
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-slate-700 truncate">{e.label}</span>
                          <span className="block text-xs text-slate-400 font-mono">{e.ref}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CreateTaskDialog({
  open,
  onOpenChange,
  lead,
  onCreate,
  staffNames,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: Lead;
  onCreate: (chip: ChatChip) => void;
  staffNames?: string[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CreateTaskDialogBody
          lead={lead}
          staffNames={staffNames}
          onCancel={() => onOpenChange(false)}
          onCreate={(chip) => {
            onCreate(chip);
            onOpenChange(false);
          }}
        />
      ) : (
        <DialogContent className="max-w-md w-full" />
      )}
    </Dialog>
  );
}

let nextLeadTaskSeq = 100;
function nextLeadTaskId(): string {
  nextLeadTaskSeq += 1;
  return `TK-${String(nextLeadTaskSeq).padStart(3, "0")}`;
}

function formatDueDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const STAFF_GROUPS: { label: string; members: string[] }[] = [];

function CreateTaskDialogBody({
  lead,
  onCancel,
  onCreate,
  staffNames: staffNamesProp,
}: {
  lead: Lead;
  onCancel: () => void;
  onCreate: (chip: ChatChip) => void;
  staffNames?: string[];
}) {
  const { name: chatCurrentUser } = useCurrentUser();
  const defaultDue = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }, []);
  const [title, setTitle] = useState(`Follow up with ${lead.childName}`);
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeBoxRef = useRef<HTMLDivElement>(null);
  const [dueDate, setDueDate] = useState(defaultDue);

  useEffect(() => {
    if (chatCurrentUser) setAssignees(prev => prev.length === 0 ? [chatCurrentUser] : prev);
  }, [chatCurrentUser]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (assigneeBoxRef.current && !assigneeBoxRef.current.contains(e.target as Node)) {
        setAssigneeDropdownOpen(false);
      }
    }
    if (assigneeDropdownOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [assigneeDropdownOpen]);

  const filteredStaff = useMemo(() => {
    const pool = staffNamesProp && staffNamesProp.length > 0 ? staffNamesProp : CHAT_STAFF;
    const q = assigneeQuery.trim().toLowerCase();
    return pool.filter((name) => !q || name.toLowerCase().includes(q));
  }, [assigneeQuery, staffNamesProp]);

  function addAssignee(name: string) {
    setAssignees((cur) => (cur.includes(name) ? cur : [...cur, name]));
  }

  function addGroup(members: string[]) {
    setAssignees((cur) => {
      const next = [...cur];
      for (const m of members) if (!next.includes(m)) next.push(m);
      return next;
    });
    setAssigneeQuery("");
  }

  function removeAssignee(name: string) {
    setAssignees((cur) => cur.filter((n) => n !== name));
  }

  function submit() {
    const trimmed = title.trim();
    if (!trimmed || assignees.length === 0) return;
    const taskId = nextLeadTaskId();
    const primary = assignees[0];
    const othersNote = assignees.length > 1 ? ` Also assigned to ${assignees.slice(1).join(", ")}.` : "";
    const newTask: Task = {
      id: taskId,
      title: trimmed,
      type: "Student Follow-up",
      priority,
      status: "Open",
      assignee: primary,
      dueDate: formatDueDateLabel(dueDate),
      linkedRecord: null,
      description: `Created from ${lead.childName} (${lead.ref}) lead chat.${othersNote}`,
      subtasks: [],
      overdue: false,
      sourceLeadId: lead.id,
      sourceLeadName: lead.childName,
    };
    // Persist task to API (fire-and-forget; toast already shown below)
    fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title:          newTask.title,
        type:           newTask.type,
        priority:       newTask.priority,
        assignee:       newTask.assignee,
        dueDateIso:     dueDate,
        description:    newTask.description,
        subtasks:       newTask.subtasks,
        linkedRecord:   newTask.linkedRecord,
        sourceLeadId:   newTask.sourceLeadId,
        sourceLeadName: newTask.sourceLeadName,
      }),
    }).catch(() => { /* non-critical */ });
    onCreate({
      id: nextChatId("chip"),
      kind: "task",
      label: trimmed,
      ref: taskId,
      linkedTaskId: taskId,
      linkedToTask: true,
    });
    const who = assignees.length === 1 ? primary : `${primary} +${assignees.length - 1}`;
    toast.success(`Task ${taskId} created in M16 · ${priority} · ${who} · due ${dueDate}`);
  }

  return (
    <DialogContent className="max-w-md w-full">
      <DialogHeader>
        <DialogTitle>Create & link task</DialogTitle>
        <DialogDescription>Creates a task in M16 and links it back to this lead.</DialogDescription>
      </DialogHeader>
      <div className="px-6 py-4 space-y-3">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "Low" | "Medium" | "High")}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer bg-white"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
        </div>
        <div ref={assigneeBoxRef} className="relative">
          <label className="block text-xs font-medium uppercase tracking-wide text-slate-400 mb-1">
            Assignees
            <span className="ml-1 font-normal lowercase tracking-normal text-slate-400">· at least 1 required</span>
          </label>
          <div
            className={cn(
              "flex flex-wrap gap-1.5 px-2 py-1.5 min-h-[40px] border rounded-lg bg-white transition-all cursor-text",
              assigneeDropdownOpen
                ? "border-amber-400 ring-2 ring-amber-200"
                : "border-slate-200 hover:border-slate-300",
            )}
            onClick={() => {
              setAssigneeDropdownOpen(true);
              const el = assigneeBoxRef.current?.querySelector("input");
              (el as HTMLInputElement | null)?.focus();
            }}
          >
            {assignees.map((name) => {
              const palette = getAvatarPalette(name);
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs"
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold",
                      palette.bg,
                      palette.text,
                    )}
                  >
                    {getInitials(name)}
                  </span>
                  <span className="text-slate-700">{name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAssignee(name);
                    }}
                    className="ml-0.5 p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
            <input
              value={assigneeQuery}
              placeholder={assignees.length === 0 ? "Search staff..." : ""}
              onChange={(e) => {
                setAssigneeQuery(e.target.value);
                setAssigneeDropdownOpen(true);
              }}
              onFocus={() => setAssigneeDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredStaff.length > 0) {
                  const candidate = filteredStaff.find((n) => !assignees.includes(n));
                  if (candidate) {
                    e.preventDefault();
                    addAssignee(candidate);
                    setAssigneeQuery("");
                  }
                }
                if (e.key === "Backspace" && assigneeQuery === "" && assignees.length > 0) {
                  removeAssignee(assignees[assignees.length - 1]);
                }
                if (e.key === "Escape") setAssigneeDropdownOpen(false);
              }}
              className="flex-1 min-w-[120px] px-1 py-0.5 text-sm bg-transparent border-0 focus:outline-none placeholder-slate-400"
            />
          </div>

          {assigneeDropdownOpen && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50/50">
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Quick groups</p>
                <div className="px-2 pb-2 flex flex-wrap gap-1">
                  {STAFF_GROUPS.map((g) => (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => addGroup(g.members)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      {g.label}
                      <span className="font-mono text-[10px] text-slate-400">· {g.members.length}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto py-1">
                {filteredStaff.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-400">No staff match &quot;{assigneeQuery}&quot;</p>
                ) : (
                  filteredStaff.map((name) => {
                    const palette = getAvatarPalette(name);
                    const already = assignees.includes(name);
                    return (
                      <button
                        key={name}
                        type="button"
                        disabled={already}
                        onClick={() => {
                          addAssignee(name);
                          setAssigneeQuery("");
                        }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                          already
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-slate-50 cursor-pointer",
                        )}
                      >
                        <span
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                            palette.bg,
                            palette.text,
                          )}
                        >
                          {getInitials(name)}
                        </span>
                        <span className="flex-1 text-sm text-slate-700">{name}</span>
                        {already && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <DialogFooter className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={assignees.length === 0 || !title.trim()}
          className={cn(
            "px-3 py-2 text-sm font-semibold rounded-lg shadow-sm transition-colors",
            assignees.length === 0 || !title.trim()
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer",
          )}
        >
          Create & Link
        </button>
      </DialogFooter>
    </DialogContent>
  );
}

function ChatChipIcon({ kind, className }: { kind: ChatChipKind; className?: string }) {
  if (kind === "student") return <UserIcon className={className} />;
  if (kind === "invoice") return <FileText className={className} />;
  return <ListTodo className={className} />;
}

function ChatChipPill({
  chip,
  onClick,
  onRemove,
  size = "md",
}: {
  chip: ChatChip;
  onClick?: () => void;
  onRemove?: () => void;
  size?: "sm" | "md";
}) {
  const interactive = !!onClick;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border rounded-md font-medium transition-colors",
        chipColours(chip.kind),
        size === "sm" ? "text-[11px] px-1.5 py-0.5" : "text-xs px-2 py-0.5",
        interactive && "cursor-pointer",
      )}
      onClick={onClick}
      role={interactive ? "button" : undefined}
    >
      <ChatChipIcon kind={chip.kind} className="w-3 h-3" />
      <span className="truncate max-w-[160px]">{chip.label}</span>
      <span className="font-mono opacity-60">· {chip.ref}</span>
      {chip.linkedToTask && (
        <span className="opacity-60 italic font-normal">· linked to M16</span>
      )}
      {onRemove && (
        <button
          type="button"
          aria-label="Remove chip"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 p-0.5 rounded hover:bg-black/10 cursor-pointer"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
}

// Ease-out cubic scroll animation — fast start, gentle arrival
function smoothScrollTo(container: HTMLElement, targetScrollTop: number, duration = 420) {
  const start = container.scrollTop;
  const distance = targetScrollTop - start;
  const startTime = performance.now();
  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    container.scrollTop = start + distance * eased;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function EmbeddedTeamChat({
  lead,
  timelineContent,
  scrollToMessageId,
}: {
  lead: Lead;
  timelineContent?: React.ReactNode;
  scrollToMessageId?: { id: string; seq: number } | null;
}) {
  const router = useRouter();
  const { name: chatCurrentUser } = useCurrentUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draftChips, setDraftChips] = useState<ChatChip[]>([]);
  const [chatEmpty, setChatEmpty] = useState(true);
  const [hoverMsgId, setHoverMsgId] = useState<string | null>(null);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [staffNames, setStaffNames] = useState<string[]>(CHAT_STAFF);
  const [activeStaffNames, setActiveStaffNames] = useState<Set<string>>(new Set());
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mentionInputRef = useRef<MentionInputRef>(null);

  // Fetch all staff for assignee picker and mention rendering.
  // No status filter — invited/on_leave staff should still be mentionable.
  // API returns { data: [...] }, so unwrap before use.
  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        const rows = (json?.data ?? []) as Array<{ name?: string }>;
        const names = rows
          .map((s) => s.name?.trim())
          .filter((n): n is string => Boolean(n));
        if (names.length > 0) {
          setStaffNames(names);
          setActiveStaffNames(new Set(names));
        }
      })
      .catch(() => {});
  }, []);

  // Load persisted messages from Supabase on open
  useEffect(() => {
    fetch(`/api/leads/${lead.id}/messages`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (!json?.data) return;
        setMessages((json.data as DbLeadMessage[]).map(dbRowToMessage));
      })
      .catch(() => {});
  }, [lead.id]);

  // Supabase Realtime — receive messages from other users in real time
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`lead-messages-${lead.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "lead_messages", filter: `lead_id=eq.${lead.id}` },
        (payload) => {
          const msg = dbRowToMessage(payload.new as DbLeadMessage);
          setMessages((cur) => cur.some((m) => m.id === msg.id) ? cur : [...cur, msg]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lead_messages", filter: `lead_id=eq.${lead.id}` },
        (payload) => {
          const updated = dbRowToMessage(payload.new as DbLeadMessage);
          setMessages((cur) => cur.map((m) => m.id === updated.id ? { ...m, reactions: updated.reactions } : m));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [lead.id]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Scroll to a specific message and apply highlight (triggered by notification click)
  useEffect(() => {
    if (!scrollToMessageId) return;
    const { id: targetId } = scrollToMessageId;

    // Small delay so the dialog DOM is fully painted before we query it
    const timer = window.setTimeout(() => {
      const container = scrollRef.current;
      if (!container) return;

      const msgEl = container.querySelector(`[data-message-id="${targetId}"]`) as HTMLElement | null;
      if (!msgEl) {
        toast.error("This message may have been removed");
        return;
      }

      // Compute scroll position to centre the message in the container
      const containerRect = container.getBoundingClientRect();
      const msgRect = msgEl.getBoundingClientRect();
      const offset = msgRect.top - containerRect.top - (containerRect.height - msgRect.height) / 2;
      smoothScrollTo(container, container.scrollTop + offset);

      // Highlight after the scroll animation completes (~430 ms)
      window.setTimeout(() => {
        setHighlightedMessageId(targetId);
        window.setTimeout(() => setHighlightedMessageId(null), 2500);
      }, 430);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [scrollToMessageId]);

  // Close reaction/emoji popovers on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-chat-popover]")) {
        setReactionPickerFor(null);
        setEmojiPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function sendMessage(args?: { extraChips?: ChatChip[]; content?: MentionContent }) {
    const content = args?.content ?? mentionInputRef.current?.getContent() ?? { text: "", mentions: [] };
    const chips = [...draftChips, ...(args?.extraChips ?? [])];
    if (!content.text && chips.length === 0) return;

    mentionInputRef.current?.clear();
    setDraftChips([]);
    setEmojiPickerOpen(false);

    // Persist to Supabase — response includes the real UUID used for Realtime dedup
    const res = await fetch(`/api/leads/${lead.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: chatCurrentUser,
        text: content.text,
        chips,
        reactions: {},
        mentions: content.mentions,
      }),
    })
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null);

    if (res?.data) {
      const msg = dbRowToMessage(res.data as DbLeadMessage);
      // Optimistically add for the sender; Realtime will skip if already present
      setMessages((cur) => cur.some((m) => m.id === msg.id) ? cur : [...cur, msg]);
    }

    // ── Create mention notifications ─────────────────────────────────────────
    if (content.mentions.length > 0) {
      const ts = Date.now();
      const msgId = res?.data?.id ?? "";

      const groupMembers: Record<string, string[]> = {};
      const recipientIds = new Set<string>();
      for (const m of content.mentions) {
        if (groupMembers[m.id]) {
          for (const id of groupMembers[m.id]) recipientIds.add(id);
        } else {
          recipientIds.add(m.id);
        }
      }
      recipientIds.delete(chatCurrentUser);

      for (const recipientId of recipientIds) {
        pushNotification({
          id: crypto.randomUUID(),
          type: "mention",
          title: `You were mentioned in ${lead.childName}'s ticket`,
          time: "just now",
          href: `/leads?leadId=${lead.id}&messageId=${msgId}`,
          unread: true,
          mention: true,
          senderName: chatCurrentUser,
          leadId: lead.id,
          messageId: msgId,
          timestamp: ts,
        });
        void recipientId;
      }

      fetch("/api/notifications/mentions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mentionedStaffIds: content.mentions.map((m) => m.id),
          leadId: lead.id,
          leadRef: lead.ref,
          message: content.text,
        }),
      }).catch(() => {});
    }
  }

  function toggleReaction(msgId: string, emoji: string) {
    let updatedReactions: ChatReactionMap = {};
    setMessages((cur) => {
      const next = cur.map((m) => {
        if (m.id !== msgId) return m;
        const users = m.reactions[emoji] ?? [];
        const had = users.includes(chatCurrentUser);
        const nextUsers = had ? users.filter((u) => u !== chatCurrentUser) : [...users, chatCurrentUser];
        const nextReactions = { ...m.reactions };
        if (nextUsers.length === 0) delete nextReactions[emoji];
        else nextReactions[emoji] = nextUsers;
        updatedReactions = nextReactions;
        return { ...m, reactions: nextReactions };
      });
      return next;
    });
    setReactionPickerFor(null);

    // Persist updated reactions to Supabase
    fetch(`/api/leads/${lead.id}/messages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msgId, reactions: updatedReactions }),
    }).catch(() => {});
  }

  function handleChipClick(chip: ChatChip) {
    router.push(chipHref(chip));
  }

  function handleAttach() {
    toast("File upload coming in Phase 2");
  }

  function handleTaskCreated(chip: ChatChip) {
    sendMessage({ extraChips: [chip] });
  }

  // Render rows with day dividers + consecutive grouping
  const rows: React.ReactNode[] = [];
  let lastDay: string | null = null;
  let lastAuthor: string | null = null;
  messages.forEach((m) => {
    if (m.day !== lastDay) {
      rows.push(
        <div key={`d-${m.id}`} className="flex items-center gap-2 py-1.5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{m.day}</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>,
      );
      lastAuthor = null;
    }
    const grouped = m.author === lastAuthor && m.day === lastDay;
    const palette = getAvatarPalette(m.author);
    const isOwn = m.author === chatCurrentUser;
    rows.push(
      <div
        key={m.id}
        data-message-id={m.id}
        className={cn(
          "group relative flex gap-2 px-3 py-1",
          highlightedMessageId === m.id && "mention-highlight-active",
        )}
        onMouseEnter={() => setHoverMsgId(m.id)}
        onMouseLeave={() => setHoverMsgId((cur) => (cur === m.id ? null : cur))}
      >
        <div className="w-7 shrink-0">
          {grouped ? (
            <span
              className={cn(
                "block text-[10px] text-slate-400 text-right pr-1 pt-1 transition-opacity",
                hoverMsgId === m.id ? "opacity-100" : "opacity-0",
              )}
            >
              {m.time}
            </span>
          ) : (
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold",
                palette.bg,
                palette.text,
              )}
            >
              {getInitials(m.author)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {!grouped && (
            <div className="flex items-baseline gap-1.5">
              <span
                className={cn(
                  "text-xs font-semibold",
                  isOwn ? "text-amber-600" : "text-slate-700",
                )}
              >
                {m.author}
              </span>
              <span className="text-[10px] text-slate-400">· {m.time}</span>
            </div>
          )}
          {m.chips.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-0.5">
              {m.chips.map((chip) => (
                <ChatChipPill key={chip.id} chip={chip} onClick={() => handleChipClick(chip)} />
              ))}
            </div>
          )}
          {m.text && (
            <p className="text-sm text-slate-600 leading-snug mt-0.5 whitespace-pre-wrap break-words">
              {formatMentionText(m.text, m.mentions, activeStaffNames, chatCurrentUser)}
            </p>
          )}
          {Object.keys(m.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(m.reactions).map(([emoji, users]) => {
                const own = users.includes(chatCurrentUser);
                return (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => toggleReaction(m.id, emoji)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition-colors cursor-pointer",
                      own
                        ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    <span>{emoji}</span>
                    <span className="font-medium">{users.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {/* Quick-react button on hover */}
        <div
          data-chat-popover
          className={cn(
            "absolute right-3 -top-2 transition-opacity",
            hoverMsgId === m.id || reactionPickerFor === m.id ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <div className="relative">
            <button
              type="button"
              aria-label="Add reaction"
              onClick={() =>
                setReactionPickerFor((cur) => (cur === m.id ? null : m.id))
              }
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white shadow-sm px-1.5 py-0.5 text-xs hover:bg-slate-50 cursor-pointer"
            >
              <span>👍</span>
              <Plus className="w-3 h-3 text-slate-400" />
            </button>
            {reactionPickerFor === m.id && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 flex gap-0.5">
                {CHAT_EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => toggleReaction(m.id, e)}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer text-base"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>,
    );
    lastDay = m.day;
    lastAuthor = m.author;
  });

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Unified scroll: timeline content + chat messages */}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 pt-5 pb-2 space-y-5">
          {timelineContent}

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide flex items-center gap-1.5 mb-3">
              <MessageSquare className="w-3.5 h-3.5" /> Team Chat
              <span className="text-[10px] font-normal normal-case tracking-normal text-slate-400">
                · only visible to staff
              </span>
            </p>
            {messages.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-400">No messages yet. Start the conversation with the team.</p>
              </div>
            ) : rows}
          </div>
        </div>

        {/* Input pinned at bottom */}
        <div className="shrink-0 border-t border-slate-200 bg-white">
          {/* Draft attachment chips */}
          {draftChips.length > 0 && (
            <div className="px-3 pt-2 flex flex-wrap gap-1 border-b border-slate-100">
              {draftChips.map((chip) => (
                <ChatChipPill
                  key={chip.id}
                  chip={chip}
                  onRemove={() => setDraftChips((cur) => cur.filter((c) => c.id !== chip.id))}
                />
              ))}
            </div>
          )}

          {/* Input + toolbar — MentionInput replaces old textarea */}
          <div>
            <MentionInput
              ref={mentionInputRef}
              placeholder="Message the team… Enter to send, Shift+Enter for new line"
              onSend={(content) => sendMessage({ content })}
              onEmptyChange={setChatEmpty}
            />
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-0.5">
                <ChatToolbarButton label="Attach file" onClick={handleAttach} icon={Paperclip} />
                <ChatToolbarButton
                  label="Mention teammate"
                  onClick={() => mentionInputRef.current?.triggerMention()}
                  icon={AtSign}
                />
                <ChatToolbarButton
                  label="Link record"
                  onClick={() => setLinkDialogOpen(true)}
                  icon={Link2}
                />
                <ChatToolbarButton
                  label="Create task"
                  onClick={() => setTaskDialogOpen(true)}
                  icon={CheckSquare}
                />
                <div data-chat-popover className="relative">
                  <ChatToolbarButton
                    label="Insert emoji"
                    onClick={() => setEmojiPickerOpen((o) => !o)}
                    icon={Smile}
                    active={emojiPickerOpen}
                  />
                  {emojiPickerOpen && (
                    <div className="absolute bottom-full left-0 mb-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 flex gap-0.5">
                      {CHAT_EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => {
                            mentionInputRef.current?.insertText(e);
                            setEmojiPickerOpen(false);
                          }}
                          className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100 cursor-pointer text-base"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={chatEmpty && draftChips.length === 0}
                aria-label="Send message"
                className={cn(
                  "inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                  !chatEmpty || draftChips.length > 0
                    ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed",
                )}
              >
                Send
                <SendHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <LinkRecordDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onInsert={(chip) => setDraftChips((cur) => [...cur, chip])}
      />
      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        lead={lead}
        onCreate={handleTaskCreated}
        staffNames={staffNames}
      />
    </>
  );
}

function ChatToolbarButton({
  label,
  onClick,
  icon: Icon,
  active,
}: {
  label: string;
  onClick: () => void;
  icon: React.ElementType;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded-md transition-colors cursor-pointer",
        active ? "bg-amber-50 text-amber-600" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

function JourneyStatusPill({
  status,
  label,
}: {
  status: "pending" | "booked" | "done" | "skipped";
  label: string;
}) {
  const map: Record<typeof status, string> = {
    pending: "bg-slate-100 text-slate-600",
    booked: "bg-amber-100 text-amber-700",
    done: "bg-emerald-100 text-emerald-700",
    skipped: "bg-slate-200 text-slate-600 line-through decoration-slate-400 decoration-1",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", map[status])}>
      {label}
    </span>
  );
}

function StageFooterActions({
  lead,
  isJourneyLead,
  journey,
  canConvert,
  onMarkAsContacted,
  onBookAssessment,
  onBookTrialFirst,
  onNeedsMoreTime,
  onSkipAssessment,
  onLogAssessmentOutcome,
  onLogTrialOutcome,
  onOfferSchedule,
  onConfirmSchedule,
  onSendInvoice,
  onRecordPayment,
  onConvert,
}: {
  lead: Lead;
  isJourneyLead: boolean;
  journey: ReturnType<typeof useJourney>;
  canConvert: boolean;
  onMarkAsContacted: (lead: Lead) => void;
  onBookAssessment: (lead: Lead) => void;
  onBookTrialFirst: (lead: Lead) => void;
  onNeedsMoreTime: (lead: Lead, stageLabel: string) => void;
  onSkipAssessment: (lead: Lead) => void;
  onLogAssessmentOutcome: (lead: Lead) => void;
  onLogTrialOutcome: (lead: Lead) => void;
  onOfferSchedule: (lead: Lead) => void;
  onConfirmSchedule: (lead: Lead) => void;
  onSendInvoice: (lead: Lead) => void;
  onRecordPayment: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
}) {
  const primaryClass =
    "w-full flex items-center justify-center gap-1.5 px-3 h-9 text-sm font-medium rounded-md bg-amber-500 text-white hover:bg-amber-600 cursor-pointer transition-colors";
  const outlineClass =
    "flex-1 px-3 h-8 text-sm font-medium border border-slate-300 bg-white rounded-md hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors";
  const linkClass =
    "text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer underline-offset-2 hover:underline";

  const { can } = usePermission();
  const canAdvance = can('leads.advancePipeline');
  const canAdvanceBeyondScheduled = can('leads.advanceBeyondScheduled');

  const stage = lead.stage;

  if (stage === "New") {
    return (
      <div className="w-full">
        <button type="button" onClick={() => onMarkAsContacted(lead)} className={primaryClass}>
          Mark as Contacted →
        </button>
      </div>
    );
  }

  if (stage === "Contacted") {
    return (
      <div className="w-full flex flex-col gap-2">
        <button type="button" onClick={() => onBookAssessment(lead)} className={primaryClass}>
          Book Assessment →
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={() => onBookTrialFirst(lead)} className={outlineClass}>
            Book Trial First
          </button>
          <button
            type="button"
            onClick={() => onNeedsMoreTime(lead, "Contacted")}
            className={outlineClass}
          >
            Needs more time
          </button>
        </div>
        <div className="flex justify-end">
          <button type="button" onClick={() => onSkipAssessment(lead)} className={linkClass}>
            Skip Assessment →
          </button>
        </div>
      </div>
    );
  }

  if (stage === "Assessment Booked") {
    return (
      <div className="w-full">
        <button type="button" onClick={() => onLogAssessmentOutcome(lead)} className={primaryClass}>
          Log Outcome →
        </button>
      </div>
    );
  }

  if (stage === "Assessment Done") {
    return (
      <div className="w-full flex flex-col gap-2">
        <button type="button" onClick={() => onOfferSchedule(lead)} className={primaryClass}>
          Propose Schedule →
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={() => onBookTrialFirst(lead)} className={outlineClass}>
            Book Trial First
          </button>
          <button
            type="button"
            onClick={() => onNeedsMoreTime(lead, "Assessment Done")}
            className={outlineClass}
          >
            Needs more time
          </button>
        </div>
      </div>
    );
  }

  if (stage === "Trial Booked") {
    return (
      <div className="w-full">
        <button type="button" onClick={() => onLogTrialOutcome(lead)} className={primaryClass}>
          Log Trial Outcome →
        </button>
      </div>
    );
  }

  if (stage === "Trial Done") {
    return (
      <div className="w-full">
        <button type="button" onClick={() => onOfferSchedule(lead)} className={primaryClass}>
          Propose Schedule →
        </button>
      </div>
    );
  }

  if (stage === "Schedule Offered") {
    return (
      <div className="w-full">
        <button type="button" onClick={() => onConfirmSchedule(lead)} className={primaryClass}>
          Confirm Schedule →
        </button>
      </div>
    );
  }

  if (stage === "Schedule Confirmed") {
    return (
      <div className="w-full flex flex-col gap-2">
        {canAdvanceBeyondScheduled ? (
          <button type="button" onClick={() => onSendInvoice(lead)} className={primaryClass}>
            Send Invoice →
          </button>
        ) : (
          <div className="w-full rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            To proceed to invoicing, please speak to Admin or Admin Head.
          </div>
        )}
        <div className="flex">
          <button
            type="button"
            onClick={() => onNeedsMoreTime(lead, "Schedule Confirmed")}
            className={outlineClass}
          >
            Needs more time
          </button>
        </div>
      </div>
    );
  }

  if (stage === "Invoice Sent") {
    if (!canAdvanceBeyondScheduled) {
      return (
        <div className="w-full rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          To proceed to invoicing, please speak to Admin or Admin Head.
        </div>
      );
    }
    return (
      <div className="w-full flex flex-col gap-2">
        <button type="button" onClick={() => onRecordPayment(lead)} className={primaryClass}>
          Record Payment →
        </button>
        <div className="flex">
          <button
            type="button"
            onClick={() => onNeedsMoreTime(lead, "Invoice Sent")}
            className={outlineClass}
          >
            Needs more time
          </button>
        </div>
      </div>
    );
  }

  if (stage === "Won") {
    if (lead.status === "converted") {
      return (
        <span className="inline-flex px-3 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
          ✓ Converted to student
        </span>
      );
    }
    if (isJourneyLead && journey.student) {
      return (
        <span className="inline-flex px-3 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
          Student record created — {journey.student.id}
        </span>
      );
    }
    if (!canAdvanceBeyondScheduled) {
      return (
        <div className="w-full rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          To proceed to invoicing, please speak to Admin or Admin Head.
        </div>
      );
    }
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={() => onConvert(lead)}
          className={primaryClass}
        >
          Convert to Student →
        </button>
      </div>
    );
  }

  // "Lost" — terminal
  return null;
}

const DAYS_OF_WEEK: string[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};
const PREFERRED_WINDOW_LABELS: Record<PreferredWindow, string> = {
  Morning: "Morning (08:00–12:00)",
  Afternoon: "Afternoon (12:00–17:00)",
  Evening: "Evening (17:00–20:00)",
  Any: "Any time",
};

function LeadPreferencesSection({
  lead,
  onUpdatePrefs,
  compact = false,
}: {
  lead: Lead;
  onUpdatePrefs: (leadId: string, prefs: { preferredDays: string[]; preferredWindow: PreferredWindow }) => void;
  compact?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [days, setDays] = useState<string[]>(lead.preferredDays ?? []);
  const [window, setWindow] = useState<PreferredWindow>(lead.preferredWindow ?? "Any");

  useEffect(() => {
    setDays(lead.preferredDays ?? []);
    setWindow(lead.preferredWindow ?? "Any");
  }, [lead.id, lead.preferredDays, lead.preferredWindow]);

  function toggleDay(d: string) {
    setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]));
  }

  function save() {
    onUpdatePrefs(lead.id, { preferredDays: days, preferredWindow: window });
    setEditing(false);
    toast.success("Preferences updated");
  }

  const daysLabel =
    (lead.preferredDays?.length ?? 0) === 0
      ? "Not set"
      : lead.preferredDays!.join(", ");
  const windowLabel = lead.preferredWindow
    ? PREFERRED_WINDOW_LABELS[lead.preferredWindow]
    : "Not set";

  const editingUI = (
    <div className="space-y-3">
      <div>
        <p className="text-xs text-slate-500 font-medium mb-1.5">Preferred days</p>
        <div className="flex flex-wrap gap-1.5">
          {DAYS_OF_WEEK.map((d) => {
            const on = days.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium transition-colors cursor-pointer",
                  on
                    ? "bg-amber-100 border-amber-400 text-amber-800"
                    : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50",
                )}
              >
                <span
                  className={cn(
                    "w-3 h-3 rounded-sm border flex items-center justify-center",
                    on ? "bg-amber-500 border-amber-500" : "bg-white border-slate-300",
                  )}
                >
                  {on && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </span>
                {DAY_SHORT[d]}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label htmlFor="pref-window" className="block text-xs text-slate-500 font-medium mb-1.5">
          Preferred window
        </label>
        <select
          id="pref-window"
          value={window}
          onChange={(e) => setWindow(e.target.value as PreferredWindow)}
          className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="Morning">Morning (08:00–12:00)</option>
          <option value="Afternoon">Afternoon (12:00–17:00)</option>
          <option value="Evening">Evening (17:00–20:00)</option>
          <option value="Any">Any</option>
        </select>
      </div>
      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            setDays(lead.preferredDays ?? []);
            setWindow(lead.preferredWindow ?? "Any");
            setEditing(false);
          }}
          className="px-2.5 py-1 text-xs font-medium border border-slate-300 bg-white rounded-md hover:bg-slate-50 text-slate-700 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={save}
          className="px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm"
        >
          Save
        </button>
      </div>
    </div>
  );

  if (compact) {
    return (
      <div>
        {editing ? editingUI : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-xs text-slate-400">Preferred days</p>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  aria-label="Edit preferences"
                  className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm font-medium text-slate-700">{daysLabel}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Preferred time</p>
              <p className="text-sm font-medium text-slate-700">{windowLabel}</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide">Preferences</p>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Edit preferences"
            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {!editing ? (
        <div className="space-y-1">
          <div className="flex gap-2 text-sm">
            <span className="text-slate-500 w-28 shrink-0">Preferred days:</span>
            <span className="text-slate-800 font-medium">{daysLabel}</span>
          </div>
          <div className="flex gap-2 text-sm">
            <span className="text-slate-500 w-28 shrink-0">Preferred time:</span>
            <span className="text-slate-800 font-medium">{windowLabel}</span>
          </div>
        </div>
      ) : editingUI}
    </div>
  );
}

// ─── Status History ───────────────────────────────────────────────────────────

type HistoryEntry = {
  id: string
  changed_by_name: string
  previous_status: string
  new_status: string
  changed_at: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

function StatusHistorySection({
  entityType,
  entityId,
  refreshKey,
}: {
  entityType: string
  entityId: string
  refreshKey?: string
}) {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)

  useEffect(() => {
    setHistory(null)
    fetch(`/api/status-history?entity_type=${entityType}&entity_id=${entityId}`)
      .then((r) => r.json())
      .then(({ data }) => setHistory(data ?? []))
      .catch(() => setHistory([]))
  }, [entityType, entityId, refreshKey])

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Stage History</p>
      {history === null ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-slate-200 shrink-0" />
              <div className="h-3.5 bg-slate-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <p className="text-sm text-slate-400 italic">No stage changes recorded yet.</p>
      ) : (
        <div className="space-y-3.5">
          {history.map((entry) => {
            const p = getAvatarPalette(entry.changed_by_name)
            return (
              <div key={entry.id} className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                    p.bg, p.text
                  )}
                >
                  {getInitials(entry.changed_by_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-sm leading-snug">
                    <span className="font-semibold text-slate-700">{entry.changed_by_name}</span>
                    <span className="text-slate-400">moved stage from</span>
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {entry.previous_status}
                    </span>
                    <span className="text-slate-400">→</span>
                    <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      {entry.new_status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(entry.changed_at)}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Lead Detail Dialog ────────────────────────────────────────────────────────

function LeadDetailDialog({
  lead,
  open,
  onOpenChange,
  onMarkAsContacted,
  onBookAssessment,
  onBookTrialFirst,
  onNeedsMoreTime,
  onSkipAssessment,
  onConvert,
  onArchive,
  onLogAssessmentOutcome,
  onLogTrialOutcome,
  onSendInvoice,
  onOfferSchedule,
  onConfirmSchedule,
  onRecordPayment,
  onStageChange,
  onUpdatePrefs,
  leadActivity,
  followUpBanner,
  onDismissFollowUpBanner,
  scrollToMessageId,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onMarkAsContacted: (lead: Lead) => void;
  onBookAssessment: (lead: Lead) => void;
  onBookTrialFirst: (lead: Lead) => void;
  onNeedsMoreTime: (lead: Lead, stageLabel: string) => void;
  onSkipAssessment: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onArchive: (lead: Lead) => void;
  onLogAssessmentOutcome: (lead: Lead) => void;
  onLogTrialOutcome: (lead: Lead) => void;
  onSendInvoice: (lead: Lead) => void;
  onOfferSchedule: (lead: Lead) => void;
  onConfirmSchedule: (lead: Lead) => void;
  onRecordPayment: (lead: Lead) => void;
  onStageChange: (lead: Lead, stage: LeadStage) => void;
  onUpdatePrefs: (leadId: string, prefs: { preferredDays: string[]; preferredWindow: PreferredWindow }) => void;
  leadActivity: ActivityEntry[];
  followUpBanner: { taskTitle: string } | null;
  onDismissFollowUpBanner: () => void;
  scrollToMessageId?: { id: string; seq: number } | null;
}) {
  const { can } = usePermission();
  const journey = useJourney();
  const isJourneyLead = lead?.id === BILAL_LEAD_ID;
  const stageFooterRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const [rightWidth, setRightWidth] = useState(360);
  const [isResizingState, setIsResizingState] = useState(false);
  const [showEmptyFields, setShowEmptyFields] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const dialog = dialogRef.current?.getBoundingClientRect();
      if (!dialog) return;
      const newRightWidth = dialog.right - e.clientX;
      setRightWidth(Math.min(520, Math.max(280, newRightWidth)));
    };
    const onMouseUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      setIsResizingState(false);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  if (!lead) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[80vw] max-w-6xl" />
      </Dialog>
    );
  }

  const currentStage = lead.stage;
  const cfg = STAGE_CONFIG[currentStage];
  const palette = getAvatarPalette(lead.assignedTo);
  const next = nextStageOf(currentStage);
  const isTerminal = currentStage === "Won" || currentStage === "Lost";
  const isConverted = lead.status === "converted";
  const canConvert = currentStage === "Won" && !isConverted && !(isJourneyLead && journey.student);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogRef} className={cn("w-[90vw] max-w-[90vw] h-[90vh]", isResizingState && "select-none")}>
        <DialogHeader>
          <div className="flex items-center gap-2.5 flex-wrap">
            <DialogTitle>{lead.childName}</DialogTitle>
            <span className={cn("inline-flex items-center justify-center min-w-[130px] px-2.5 py-1 rounded-full text-xs font-semibold text-center whitespace-nowrap", cfg.badge)}>
              {currentStage}
            </span>
          </div>
          <DialogDescription className="font-mono">{lead.ref}</DialogDescription>
        </DialogHeader>

        {/* Two-column body — left column has its own scoped footer */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── LEFT COLUMN: fields (scroll) + scoped footer ── */}
          <div className="flex flex-col flex-1 min-h-0 min-w-0 overflow-hidden">
          <div className="overflow-y-auto flex-1 min-h-0 px-6 py-5 space-y-5">

            {/* Banners */}
            {isConverted && lead.convertedStudentId && (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-emerald-900 font-semibold">
                    Converted to student — {lead.convertedStudentId}
                    {lead.convertedOn ? ` · ${lead.convertedOn}` : ""}
                  </p>
                </div>
                <a
                  href={`/students/${lead.convertedStudentId}`}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline underline-offset-2 cursor-pointer whitespace-nowrap"
                >
                  View Student Profile →
                </a>
              </div>
            )}

            {followUpBanner && (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-sm text-amber-900 truncate">
                    <span className="font-semibold">Follow-up task completed.</span> Ready to continue?
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onDismissFollowUpBanner();
                      stageFooterRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="px-2.5 py-1 rounded-md bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 cursor-pointer shadow-sm"
                  >
                    Continue journey →
                  </button>
                  <button
                    type="button"
                    onClick={onDismissFollowUpBanner}
                    className="text-xs font-medium text-amber-700 hover:text-amber-900 cursor-pointer px-1"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            {/* ── Toggle: show/hide empty fields ── */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Lead Details</span>
              <button
                type="button"
                onClick={() => setShowEmptyFields((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <Eye className="w-3 h-3" />
                {showEmptyFields ? "Hide empty fields" : "Show empty fields"}
              </button>
            </div>

            {/* ── SECTION: Student ── */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Student</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Year Group & Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                      {lead.yearGroup}
                    </span>
                    {lead.subjects.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                {(lead.department || showEmptyFields) && (
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Programme</p>
                    <p className="text-sm font-medium text-slate-700">{lead.department || <span className="text-slate-300">—</span>}</p>
                  </div>
                )}
                {showEmptyFields && (
                  <>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">School</p>
                      <p className="text-sm font-medium text-slate-300">—</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Preferred Name</p>
                      <p className="text-sm font-medium text-slate-300">—</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Nationality</p>
                      <p className="text-sm font-medium text-slate-300">—</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Date of Birth</p>
                      <p className="text-sm font-medium text-slate-300">—</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Home Area</p>
                      <p className="text-sm font-medium text-slate-300">—</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── SECTION: Guardian & Contact ── */}
            <div className="space-y-3 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Guardian & Contact</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Guardian</p>
                  <p className="text-sm font-medium text-slate-700">{lead.guardian}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Phone</p>
                  <a
                    href={`tel:${lead.guardianPhone}`}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-amber-600 cursor-pointer transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {lead.guardianPhone}
                  </a>
                </div>
                {showEmptyFields && (
                  <>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Email</p>
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-300">
                        <Mail className="w-3.5 h-3.5" />
                        —
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">WhatsApp</p>
                      <p className="text-sm font-medium text-slate-300">—</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── SECTION: Enquiry ── */}
            <div className="space-y-3 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Enquiry</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Source</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className={cn("inline-flex px-2 py-0.5 rounded text-xs font-medium", SOURCE_CONFIG[lead.source])}>
                      {lead.source}
                    </span>
                    {lead.sibling && (
                      <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                        Sibling
                      </span>
                    )}
                    {lead.dnc && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        <AlertCircle className="w-3 h-3" />
                        DNC
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1.5">Assigned to</p>
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                        palette.bg,
                        palette.text,
                      )}
                    >
                      {getInitials(lead.assignedTo)}
                    </div>
                    <span className="text-sm font-medium text-slate-700">{lead.assignedTo}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">In pipeline</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    {lead.daysInPipeline}d
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">In stage</p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                    {lead.daysInStage}d
                  </span>
                </div>
                {(lead.createdOn || showEmptyFields) && (
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Enquiry date</p>
                    <p className="text-sm font-medium text-slate-700">
                      {lead.createdOn
                        ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(lead.createdOn))
                        : <span className="text-slate-300">—</span>}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Last activity</p>
                  <p className="text-sm font-medium text-slate-700">{lead.lastActivity}</p>
                </div>
                {showEmptyFields && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-0.5">How did you hear about us</p>
                    <p className="text-sm font-medium text-slate-300">—</p>
                  </div>
                )}
                {showEmptyFields && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-0.5">Referral source</p>
                    <p className="text-sm font-medium text-slate-300">—</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── SECTION: Programme ── */}
            <div className="space-y-3 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-1.5">Programme</p>
              <LeadPreferencesSection lead={lead} onUpdatePrefs={onUpdatePrefs} compact />
              {showEmptyFields && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Qualification Route</p>
                    <p className="text-sm font-medium text-slate-300">—</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Exam Board</p>
                    <p className="text-sm font-medium text-slate-300">—</p>
                  </div>
                </div>
              )}
            </div>

            {/* ── SECTION: Notes ── */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Notes</p>
                {!editingNotes && (
                  <button
                    type="button"
                    onClick={() => setEditingNotes(true)}
                    aria-label="Edit notes"
                    className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {editingNotes ? (
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => { setEditingNotes(false); if (notes.trim()) toast.success("Notes saved"); }}
                  placeholder="Add internal notes visible to staff only..."
                  rows={3}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                  autoFocus
                />
              ) : (
                <p
                  className={cn(
                    "text-sm leading-relaxed cursor-pointer hover:bg-slate-50 rounded-md px-1 py-1 -mx-1 transition-colors",
                    notes ? "text-slate-700" : "text-slate-400 italic",
                  )}
                  onClick={() => setEditingNotes(true)}
                >
                  {notes || "No notes yet — click to add."}
                </p>
              )}
            </div>

        {currentStage === "Lost" && (
              <div className="pt-1 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Lost Details</p>
                <div className="rounded-lg border border-red-100 bg-red-50/30 p-4 space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Reason</p>
                    <p className="text-sm font-medium text-slate-700">{lead.lostReason ?? "—"}</p>
                  </div>
                  {lead.lostNotes && (
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Notes</p>
                      <p className="text-sm text-slate-600">{lead.lostNotes}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Re-engage</p>
                    {lead.reEngage === false ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Do not re-engage
                      </span>
                    ) : lead.reEngageAfter ? (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Re-engage after {lead.reEngageAfter}
                      </span>
                    ) : (
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Re-engage when ready
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isJourneyLead && (
              <div className="pt-1 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Assessment & Trial</p>
                <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
                  {/* Assessment row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap min-w-0">
                      <span className="text-xs font-semibold uppercase text-slate-500 w-20 shrink-0">Assessment</span>
                      <JourneyStatusPill
                        status={
                          !journey.assessment
                            ? "pending"
                            : journey.assessment.status === "Done"
                              ? "done"
                              : "booked"
                        }
                        label={
                          !journey.assessment
                            ? "Not yet booked"
                            : journey.assessment.status === "Done"
                              ? "Done ✓"
                              : "Booked"
                        }
                      />
                      {journey.assessment && (
                        <span className="text-sm text-slate-700">
                          {journey.assessment.yearGroup} {journey.assessment.subject} · {formatDate(journey.assessment.date)} · {journey.assessment.teacher}
                        </span>
                      )}
                    </div>
                    {journey.assessment?.status === "Booked" && (
                      <button
                        type="button"
                        onClick={() => onLogAssessmentOutcome(lead)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 cursor-pointer shadow-sm"
                      >
                        Log Outcome
                      </button>
                    )}
                  </div>

                  {/* Trial row (always visible once assessment exists) */}
                  {journey.assessment && (
                    <div className="flex items-center justify-between gap-3 flex-wrap pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-3 flex-wrap min-w-0">
                        <span className="text-xs font-semibold uppercase text-slate-500 w-20 shrink-0">Trial</span>
                        <JourneyStatusPill
                          status={
                            !journey.trial
                              ? "pending"
                              : journey.trial.status === "Skipped"
                                ? "skipped"
                                : journey.trial.status === "Done"
                                  ? "done"
                                  : "booked"
                          }
                          label={
                            !journey.trial
                              ? "Awaiting decision"
                              : journey.trial.status === "Skipped"
                                ? "Skipped"
                                : journey.trial.status === "Done"
                                  ? "Done ✓"
                                  : "Booked"
                          }
                        />
                        {journey.trial && journey.trial.status !== "Skipped" && (
                          <span className="text-sm text-slate-700">
                            {journey.trial.yearGroup} {journey.trial.subject} · {formatDate(journey.trial.date)} · AED {journey.trial.total.toFixed(0)}
                          </span>
                        )}
                        {journey.trial?.status === "Skipped" && (
                          <span className="text-sm text-slate-500">Proceeded directly to enrolment</span>
                        )}
                      </div>
                      {journey.trial?.status === "Booked" && (
                        <button
                          type="button"
                          onClick={() => onLogTrialOutcome(lead)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 cursor-pointer shadow-sm"
                        >
                          Log Trial Outcome
                        </button>
                      )}
                    </div>
                  )}

                  {/* Student row once converted */}
                  {journey.student && (
                    <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-100">
                      <span className="text-xs font-semibold uppercase text-slate-500 w-20 shrink-0">Student</span>
                      <JourneyStatusPill status="done" label={`Created — ${journey.student.id}`} />
                      <span className="text-sm text-slate-700">{journey.student.name} · {journey.student.status}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>{/* end left fields scroll */}

          {/* Footer scoped to left column only */}
          <div className="shrink-0 border-t border-slate-100 px-6 py-3 space-y-3">
            <div ref={stageFooterRef}>
            <StageFooterActions
              lead={lead}
              isJourneyLead={isJourneyLead}
              journey={journey}
              canConvert={canConvert}
              onMarkAsContacted={onMarkAsContacted}
              onBookAssessment={onBookAssessment}
              onBookTrialFirst={onBookTrialFirst}
              onNeedsMoreTime={onNeedsMoreTime}
              onSkipAssessment={onSkipAssessment}
              onLogAssessmentOutcome={onLogAssessmentOutcome}
              onLogTrialOutcome={onLogTrialOutcome}
              onOfferSchedule={onOfferSchedule}
              onConfirmSchedule={onConfirmSchedule}
              onSendInvoice={onSendInvoice}
              onRecordPayment={onRecordPayment}
              onConvert={onConvert}
            />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              {can('delete.records') && (
                <button
                  type="button"
                  onClick={() => onArchive(lead)}
                  className="px-3 py-2 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer transition-colors"
                >
                  Archive Lead
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
          </div>{/* end LEFT COLUMN */}

          {/* Drag handle */}
          <div
            onMouseDown={() => { isResizing.current = true; setIsResizingState(true); }}
            className="w-1 shrink-0 cursor-col-resize bg-slate-200 hover:bg-amber-400 active:bg-amber-500 transition-colors"
          />

          {/* ── RIGHT COLUMN: timeline + chat — full height ── */}
          <div style={{ width: rightWidth }} className="shrink-0 flex flex-col min-h-0 overflow-hidden">
            <EmbeddedTeamChat
              key={lead.id}
              lead={lead}
              scrollToMessageId={scrollToMessageId}
              timelineContent={
                <>
                  {/* Activity Timeline */}
                  <div>
                    <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Activity Timeline</p>
                    <div className="space-y-3">
                      {(isJourneyLead
                        ? [...journey.activity, ...DETAIL_TIMELINE]
                        : [...leadActivity, ...DETAIL_TIMELINE]
                      ).map((entry, i, arr) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", entry.dot)} />
                            {i < arr.length - 1 && (
                              <div className="w-px flex-1 bg-slate-200 mt-1" />
                            )}
                          </div>
                          <div className="pb-2 min-w-0 flex-1">
                            <p className="text-sm text-slate-700">{entry.text}</p>
                            <p className="text-xs text-slate-400">{entry.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stage History */}
                  <div className="border-t border-slate-100 pt-4">
                    <StatusHistorySection entityType="lead" entityId={lead.id} refreshKey={lead.stage} />
                  </div>
                </>
              }
            />
          </div>{/* end RIGHT COLUMN */}

        </div>{/* end two-column flex */}
      </DialogContent>
    </Dialog>
  );
}

// ─── Reminder Dialog ──────────────────────────────────────────────────────────

function ReminderDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) {
      setDate("");
      setTime("");
      setNote("");
    }
  }, [open, lead]);

  const canSave = date && time;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <DialogTitle>Set Reminder</DialogTitle>
          {lead && <DialogDescription>{lead.childName}</DialogDescription>}
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label htmlFor="reminder-date" className="block text-xs text-slate-500 mb-1 font-medium">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              id="reminder-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="reminder-time" className="block text-xs text-slate-500 mb-1 font-medium">
              Time <span className="text-red-500">*</span>
            </label>
            <input
              id="reminder-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="reminder-note" className="block text-xs text-slate-500 mb-1 font-medium">
              Note
            </label>
            <textarea
              id="reminder-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note..."
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            onClick={() => {
              toast.success("Reminder set");
              onOpenChange(false);
            }}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
              canSave
                ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed",
            )}
          >
            Save Reminder
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Lead Dialog ──────────────────────────────────────────────────────────

function AddLeadDialog({
  open,
  onOpenChange,
  initialStage,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialStage: LeadStage | null;
  onSaved?: () => void;
}) {
  const [name, setName] = useState("");
  const [guardian, setGuardian] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState(true);
  const [year, setYear] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [source, setSource] = useState<LeadSource | "">("");
  const [assigned, setAssigned] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [staffNames, setStaffNames] = useState<string[]>([]);

  useEffect(() => {
    if (!open || staffNames.length > 0) return;
    fetch('/api/staff')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!json?.data) return;
        const names: string[] = json.data
          .map((s: { name: string }) => s.name)
          .filter(Boolean)
          .sort((a: string, b: string) => a.localeCompare(b));
        setStaffNames(names);
      })
      .catch(() => {});
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      setName("");
      setGuardian("");
      setPhone("");
      setWhatsapp(true);
      setYear("");
      setSubjects([]);
      setSource("");
      setAssigned("");
      setNotes("");
    }
  }, [open]);

  const canSave = name.trim() && guardian.trim() && phone.trim() && year && subjects.length > 0 && source;

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childName: name.trim(),
          guardianName: guardian.trim(),
          phone: phone.trim(),
          whatsapp,
          yearGroup: year,
          subjects,
          source,
          assignedTo: assigned,
          notes: notes.trim(),
          stage: initialStage ?? 'New',
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Lead added successfully");
      onOpenChange(false);
      onSaved?.();
    } catch {
      toast.error("Failed to add lead");
    } finally {
      setSaving(false);
    }
  }

  function toggleSubject(s: string) {
    setSubjects((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lead</DialogTitle>
          {initialStage && (
            <DialogDescription>Starting stage: {initialStage}</DialogDescription>
          )}
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-name" className="block text-xs text-slate-500 mb-1 font-medium">
                Lead Name <span className="text-red-500">*</span>
              </label>
              <input
                id="new-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="new-guardian" className="block text-xs text-slate-500 mb-1 font-medium">
                Guardian Name <span className="text-red-500">*</span>
              </label>
              <input
                id="new-guardian"
                value={guardian}
                onChange={(e) => setGuardian(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="new-phone" className="block text-xs text-slate-500 mb-1 font-medium">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="new-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971 50 000 0000"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="block text-xs text-slate-500 font-medium">WhatsApp</label>
              <button
                type="button"
                role="switch"
                aria-checked={whatsapp}
                onClick={() => setWhatsapp((w) => !w)}
                className={cn(
                  "relative inline-flex w-9 h-5 rounded-full transition-colors cursor-pointer focus:outline-none",
                  whatsapp ? "bg-amber-500" : "bg-slate-200",
                )}
              >
                <span
                  className={cn(
                    "inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform absolute top-0.5",
                    whatsapp ? "translate-x-4" : "translate-x-0.5",
                  )}
                />
              </button>
              <span className="text-sm text-slate-600">{whatsapp ? "Enabled" : "Disabled"}</span>
            </div>

            <div>
              <label htmlFor="new-year" className="block text-xs text-slate-500 mb-1 font-medium">
                Year Group <span className="text-red-500">*</span>
              </label>
              <select
                id="new-year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer"
              >
                <option value="">Select year group…</option>
                {ADD_LEAD_YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="new-source" className="block text-xs text-slate-500 mb-1 font-medium">
                Source <span className="text-red-500">*</span>
              </label>
              <select
                id="new-source"
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer"
              >
                <option value="">Select source…</option>
                {ADD_LEAD_SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="new-assigned" className="block text-xs text-slate-500 mb-1 font-medium">
                Assigned To
              </label>
              <select
                id="new-assigned"
                value={assigned}
                onChange={(e) => setAssigned(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer"
              >
                <option value="">Unassigned</option>
                {staffNames.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="block text-xs text-slate-500 mb-1.5 font-medium">
              Subject(s) <span className="text-red-500">*</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ADD_LEAD_SUBJECT_OPTIONS.map((s) => {
                const on = subjects.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSubject(s)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                      on
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-slate-600 border-slate-200 hover:border-amber-400",
                    )}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="new-notes" className="block text-xs text-slate-500 mb-1 font-medium">
              Notes
            </label>
            <textarea
              id="new-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave || saving}
            onClick={handleSave}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
              canSave && !saving
                ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed",
            )}
          >
            {saving ? "Saving…" : "Save Lead"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Archive Confirm Dialog ───────────────────────────────────────────────────

function ArchiveConfirmDialog({
  lead,
  open,
  onOpenChange,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Archive lead?</DialogTitle>
          {lead && <DialogDescription>{lead.childName}</DialogDescription>}
        </DialogHeader>

        <div className="px-6 py-5 text-sm text-slate-600">
          Archive this lead? You can restore it later.
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              toast.success("Lead archived");
              onOpenChange(false);
            }}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer transition-colors shadow-sm"
          >
            Confirm
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Mark as Lost Modal ───────────────────────────────────────────────────────

const LOST_REASON_OPTIONS = [
  "Price — too expensive",
  "Chose a competitor",
  "Location / timing not suitable",
  "Student not ready",
  "Parent changed mind",
  "No response after follow-up",
  "Enrolled elsewhere",
  "Other",
];

type LostData = {
  lostReason: string;
  lostNotes: string;
  reEngage: boolean;
  reEngageAfter?: string;
};

function MarkAsLostModal({
  lead,
  open,
  onOpenChange,
  onConfirm,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (lead: Lead, data: LostData) => void;
}) {
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [reEngage, setReEngage] = useState(true);
  const [reEngageAfter, setReEngageAfter] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setNotes("");
      setReEngage(true);
      setReEngageAfter("");
      setSubmitted(false);
    }
  }, [open]);

  const reasonMissing = !reason;
  const notesMissing = reason === "Other" && !notes.trim();

  function handleConfirm() {
    setSubmitted(true);
    if (reasonMissing || notesMissing || !lead) return;
    onOpenChange(false);
    onConfirm(lead, {
      lostReason: reason,
      lostNotes: notes,
      reEngage,
      reEngageAfter: reEngage && reEngageAfter ? reEngageAfter : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Mark as Lost</DialogTitle>
          {lead && <DialogDescription>{lead.childName}</DialogDescription>}
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent cursor-pointer"
            >
              <option value="">Select a reason…</option>
              {LOST_REASON_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {submitted && reasonMissing && (
              <p className="text-xs text-red-500 mt-1">Please select a reason</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Notes {reason === "Other" && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional context…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
            {submitted && notesMissing && (
              <p className="text-xs text-red-500 mt-1">Notes are required when reason is &ldquo;Other&rdquo;</p>
            )}
          </div>

          {/* Re-engage toggle */}
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-medium text-slate-700">Re-engage in future?</label>
            <button
              type="button"
              onClick={() => setReEngage((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                reEngage ? "bg-green-500" : "bg-slate-200",
              )}
              role="switch"
              aria-checked={reEngage}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                  reEngage ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>

          {/* Re-engage after date */}
          {reEngage && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Re-engage after <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="date"
                value={reEngageAfter}
                onChange={(e) => setReEngageAfter(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent cursor-pointer"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 cursor-pointer shadow-sm transition-colors"
          >
            Confirm Lost
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Move Stage Dialog ────────────────────────────────────────────────────────

function MoveStageDialog({
  lead,
  open,
  onOpenChange,
  onConfirm,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (lead: Lead, stage: LeadStage) => void;
}) {
  const [stage, setStage] = useState<LeadStage | null>(null);

  useEffect(() => {
    if (lead) setStage(lead.stage);
  }, [lead, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm w-full">
        <DialogHeader>
          <DialogTitle>Move stage</DialogTitle>
          {lead && <DialogDescription>{lead.childName}</DialogDescription>}
        </DialogHeader>

        <div className="px-6 py-5">
          <label htmlFor="move-stage" className="block text-xs text-slate-500 mb-1.5 font-medium uppercase tracking-wide">
            New stage
          </label>
          <select
            id="move-stage"
            value={stage ?? ""}
            onChange={(e) => setStage(e.target.value as LeadStage)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer"
          >
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!stage || stage === lead?.stage}
            onClick={() => {
              if (!stage || !lead) return;
              onOpenChange(false);
              onConfirm(lead, stage);
            }}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
              stage && stage !== lead?.stage
                ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed",
            )}
          >
            Move stage
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = "kanban" | "list" | "table";

export default function LeadsPage() {
  const currentUser = useCurrentUser();
  const { can } = usePermission();

  const [leadsData, setLeadsData] = useState<Lead[]>([]);
  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      const { data } = await res.json();
      setLeadsData((data as ApiLead[]).map(toLead));
    } catch {
      toast.error('Failed to load leads');
    }
  }, []);
  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Students list — used for converted-student lookup and ID generation
  const [studentsData, setStudentsData] = useState<ApiStudent[]>([]);
  useEffect(() => {
    fetch('/api/students')
      .then((r) => r.json())
      .then(({ data }) => { if (data) setStudentsData(data as ApiStudent[]); })
      .catch(() => { /* non-critical */ });
  }, []);

  // Kanban personalisation
  const { prefs: kanbanPrefs, setPrefs: setKanbanPrefs, resetPrefs: resetKanbanPrefs } = useKanbanPrefs(currentUser.email);
  const {
    triggerRef: personaliseTriggerRef,
    popoverRef: personalisePopoverRef,
    open: personaliseOpen,
    toggle: togglePersonalise,
    pos: personalisePos,
  } = useSafePopover();

  // Effective column width — step down to Narrow on small viewports
  const [viewportWidth, setViewportWidth] = useState(1440);
  useEffect(() => {
    const update = () => setViewportWidth(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const effectiveColWidth = viewportWidth < 1280 ? Math.min(kanbanPrefs.columnWidth, 220) : kanbanPrefs.columnWidth;

  // Kanban column collapse — stored in kanbanPrefs.collapsedColumns
  const collapsedColumnsSet = useMemo(
    () => new Set(kanbanPrefs.collapsedColumns),
    [kanbanPrefs.collapsedColumns],
  );
  const toggleColumnCollapse = useCallback(
    (stage: string) => {
      setKanbanPrefs((p) => ({
        ...p,
        collapsedColumns: collapsedColumnsSet.has(stage)
          ? p.collapsedColumns.filter((s) => s !== stage)
          : [...p.collapsedColumns, stage],
      }));
    },
    [setKanbanPrefs, collapsedColumnsSet],
  );

  const [exportOpen, setExportOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("kanban");
  useEffect(() => {
    if (window.innerWidth < 768) setView("list");
  }, []);
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [deptFilter, setDeptFilter] = useState<string[]>([]);
  const [assignedFilter, setAssignedFilter] = useState<string[]>([]);
  const [myLeads, setMyLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [createdOnRange, setCreatedOnRange] = useState<DateRange>({ from: null, to: null });
  const [searchFocused, setSearchFocused] = useState(false);

  // Dialogs
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [scrollToMessage, setScrollToMessage] = useState<{ id: string; seq: number } | null>(null);
  const [reminderLead, setReminderLead] = useState<Lead | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [archiveLead, setArchiveLead] = useState<Lead | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [moveStageLead, setMoveStageLead] = useState<Lead | null>(null);
  const [moveStageOpen, setMoveStageOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addLeadStage, setAddLeadStage] = useState<LeadStage | null>(null);
  const [lostModalOpen, setLostModalOpen] = useState(false);
  const [lostModalLead, setLostModalLead] = useState<Lead | null>(null);

  // Sort
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Pagination (list/table views)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Grouped list view state
  const [collapsedStages, setCollapsedStages] = useState<Set<string>>(new Set());
  const [showEmptyStages, setShowEmptyStages] = useState(false);
  const [dragOverStage, setDragOverStage] = useState<LeadStage | null>(null);
  useEffect(() => {
    if (!currentUser.email) return;
    try {
      const s = localStorage.getItem(`enrolla_leads_list_collapsed_${currentUser.email}`);
      if (s) setCollapsedStages(new Set(JSON.parse(s) as string[]));
      const e = localStorage.getItem(`enrolla_leads_list_empty_${currentUser.email}`);
      if (e !== null) setShowEmptyStages(e === "true");
    } catch {}
  }, [currentUser.email]);

  // Segments
  const { segments, saveSegment, deleteSegment } = useSavedSegments("leads");
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);

  const hasActiveFilters =
    stageFilter.length > 0 || statusFilter.length > 0 || sourceFilter.length > 0 ||
    deptFilter.length > 0 || assignedFilter.length > 0 || myLeads || searchQuery !== "" ||
    createdOnRange.from !== null || createdOnRange.to !== null;

  // Journey store — used to override Bilal's stage & power the journey dialogs
  const journey = useJourney();
  const { assessments, cancel: cancelAssessment } = useAssessments();

  // Active undo toast: only one can be live at a time. Holds the sonner toast
  // id + a timer used to clean up the refs on auto-dismiss.
  const undoToastIdRef = useRef<string | number | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Per-lead stage overrides + activity (for every non-Bilal lead)
  const [leadStageOverrides, setLeadStageOverrides] = useState<Record<string, LeadStage>>({});
  const [leadActivity, setLeadActivity] = useState<Record<string, ActivityEntry[]>>({});
  const [leadLostData, setLeadLostData] = useState<Record<string, LostData>>({});
  const [leadConvertedData, setLeadConvertedData] = useState<Record<string, { studentId: string; studentName: string; convertedOn: string }>>({});
  const [convertTargetLead, setConvertTargetLead] = useState<Lead | null>(null);
  // Per-lead "follow-up task completed" banner, shown once the linked task is Done.
  const [followUpBanners, setFollowUpBanners] = useState<Record<string, { taskTitle: string }>>({});
  const [leadPrefs, setLeadPrefs] = useState<
    Record<string, { preferredDays: string[]; preferredWindow: PreferredWindow }>
  >({});

  // Compute the effective leads list with journey + per-lead overrides applied
  const leads = useMemo<Lead[]>(() => {
    return leadsData.map((l) => {
      const prefs = leadPrefs[l.id];
      const base: Lead = prefs
        ? { ...l, preferredDays: prefs.preferredDays, preferredWindow: prefs.preferredWindow }
        : l;
      let result: Lead;
      if (l.id === BILAL_LEAD_ID) {
        result = { ...base, stage: journey.leadStage, lastActivity: "Today" };
      } else {
        const override = leadStageOverrides[l.id];
        result = override ? { ...base, stage: override, lastActivity: "Today" } : base;
      }
      const lostData = leadLostData[l.id];
      if (lostData) result = { ...result, ...lostData };
      const converted = leadConvertedData[l.id];
      if (converted) result = { ...result, status: "converted" as const, convertedStudentId: converted.studentId, convertedOn: converted.convertedOn };
      return result;
    });
  }, [leadsData, journey.leadStage, leadStageOverrides, leadPrefs, leadLostData, leadConvertedData]);

  const updateLeadPrefs = (
    leadId: string,
    prefs: { preferredDays: string[]; preferredWindow: PreferredWindow },
  ) => {
    setLeadPrefs((prev) => ({ ...prev, [leadId]: prefs }));
  };

  // Journey dialog state
  const [bookAssessmentOpen, setBookAssessmentOpen] = useState(false);
  const [logAssessmentOpen, setLogAssessmentOpen] = useState(false);
  const [bookTrialOpen, setBookTrialOpen] = useState(false);
  const [logTrialOpen, setLogTrialOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [createEnrolmentOpen, setCreateEnrolmentOpen] = useState(false);
  const [scheduleOfferOpen, setScheduleOfferOpen] = useState(false);
  const [scheduleConfirmOpen, setScheduleConfirmOpen] = useState(false);
  const [invoiceBuilderOpen, setInvoiceBuilderOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);

  // Pending stage-change context (the lead + target) used by gated dialogs + skip warning
  const [pendingGate, setPendingGate] = useState<{ lead: Lead; target: LeadStage } | null>(null);
  const [skipWarningOpen, setSkipWarningOpen] = useState(false);

  // Soft prompt: offer trial-first path when moving to Schedule Offered with no trial record
  const [trialPromptOpen, setTrialPromptOpen] = useState(false);
  const [trialPromptSuppressed, setTrialPromptSuppressed] = useState<Set<string>>(() => new Set());
  // Ref-driven flag so the BookTrialDialog's commit can chain into ScheduleOfferDialog
  // without the close handler clobbering the newly-set pendingGate.
  const chainAfterTrialRef = useRef(false);
  // When true, the next BookTrialDialog commit also logs an "assessment skipped" activity entry.
  const bookTrialFromContactedRef = useRef(false);

  // Needs more time / Skip assessment dialog state
  const [needsMoreTimeOpen, setNeedsMoreTimeOpen] = useState(false);
  const [needsMoreTimeLead, setNeedsMoreTimeLead] = useState<Lead | null>(null);
  const [needsMoreTimeStage, setNeedsMoreTimeStage] = useState<string>("");
  const [skipAssessmentOpen, setSkipAssessmentOpen] = useState(false);
  const [skipAssessmentLead, setSkipAssessmentLead] = useState<Lead | null>(null);

  // Dismiss any live undo toast and clear its cleanup timer.
  function dismissUndoToast() {
    if (undoToastIdRef.current != null) {
      toast.dismiss(undoToastIdRef.current);
      undoToastIdRef.current = null;
    }
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }
  }

  // Persist a lead stage change to the DB (fire-and-forget, optimistic UI).
  // Also updates leadsData in-place on success so overrides are no longer needed.
  function persistLeadStage(
    leadId: string,
    newStage: LeadStage,
    extra?: Record<string, unknown>,
  ) {
    fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage, ...extra }),
    })
      .then(async (r) => {
        if (!r.ok) {
          toast.error('Failed to save stage change')
        } else {
          setLeadsData((prev) =>
            prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l))
          )
        }
      })
      .catch(() => toast.error('Failed to save stage change'))
  }

  // Revert a stage change. `assessmentIdToCancel` is set when the committed
  // change was a gated stage (Assessment/Trial Booked) that wrote a record
  // to the assessment store — we remove that record as part of the undo.
  function performUndo(
    lead: Lead,
    previousStage: LeadStage,
    assessmentIdToCancel: string | undefined,
    onExtra?: () => void,
  ) {
    dismissUndoToast();
    if (lead.id === BILAL_LEAD_ID) {
      journey.setStage(previousStage, currentUser.name);
    } else {
      setLeadStageOverrides((prev) => ({ ...prev, [lead.id]: previousStage }));
      setLeadActivity((prev) => ({
        ...prev,
        [lead.id]: [
          {
            label: "Just now",
            text: `Stage change undone — reverted to ${previousStage} by ${currentUser.name}`,
            dot: "bg-slate-400",
          },
          ...(prev[lead.id] ?? []),
        ],
      }));
    }
    persistLeadStage(lead.id, previousStage);
    if (assessmentIdToCancel) cancelAssessment(assessmentIdToCancel);
    if (onExtra) onExtra();
    toast.custom(
      () => (
        <div className="bg-slate-800 text-white text-sm font-medium rounded-lg shadow-lg px-4 py-2.5 min-w-[220px]">
          Stage change undone
        </div>
      ),
      { duration: 2000 },
    );
  }

  function showUndoToast(
    lead: Lead,
    newStage: LeadStage,
    previousStage: LeadStage,
    assessmentIdToCancel: string | undefined,
    onExtra?: () => void,
  ) {
    dismissUndoToast();
    const id = toast.custom(
      () => (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg flex items-center gap-3 pl-3 pr-1.5 py-2.5 min-w-[320px] relative overflow-hidden">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium text-slate-900 flex-1">
            Lead moved to {newStage}
          </span>
          <button
            type="button"
            onClick={() => performUndo(lead, previousStage, assessmentIdToCancel, onExtra)}
            className="text-sm font-semibold text-amber-600 hover:text-amber-700 px-2.5 py-1 rounded cursor-pointer"
          >
            Undo
          </button>
          <div className="absolute bottom-0 left-0 h-0.5 bg-emerald-500 undo-toast-progress" />
        </div>
      ),
      { duration: 5000 },
    );
    undoToastIdRef.current = id;
    undoTimerRef.current = setTimeout(() => {
      undoToastIdRef.current = null;
      undoTimerRef.current = null;
    }, 5000);
  }

  // Commit the stage change without any gating — writes to journey store (Bilal) or overrides
  function applyStageChange(lead: Lead, newStage: LeadStage) {
    if (newStage === lead.stage) return;
    const previousStage = lead.stage;
    // For gated stages, the Book-Assessment dialog has already pushed a new
    // record into the assessment store right before this commit. Capture the
    // most recent record for this lead so we can cancel it on undo.
    let assessmentIdToCancel: string | undefined;
    if (newStage === "Assessment Booked" || newStage === "Trial Booked") {
      for (let i = assessments.length - 1; i >= 0; i--) {
        if (assessments[i].leadId === lead.id) {
          assessmentIdToCancel = assessments[i].id;
          break;
        }
      }
    }

    if (lead.id === BILAL_LEAD_ID) {
      journey.setStage(newStage, currentUser.name);
    } else {
      setLeadStageOverrides((prev) => ({ ...prev, [lead.id]: newStage }));
      setLeadActivity((prev) => ({
        ...prev,
        [lead.id]: [
          {
            label: "Just now",
            text: `Stage changed to ${newStage} by ${currentUser.name}`,
            dot: "bg-slate-400",
          },
          ...(prev[lead.id] ?? []),
        ],
      }));
    }
    persistLeadStage(lead.id, newStage);
    showUndoToast(lead, newStage, previousStage, assessmentIdToCancel);
  }

  // Route a stage-change intent to a gated dialog or commit directly
  function routeStageChange(lead: Lead, target: LeadStage) {
    setPendingGate({ lead, target });
    if (target === "Assessment Booked") {
      setBookAssessmentOpen(true);
    } else if (target === "Trial Booked") {
      setBookTrialOpen(true);
    } else if (target === "Schedule Offered") {
      setScheduleOfferOpen(true);
    } else if (target === "Schedule Confirmed") {
      setScheduleConfirmOpen(true);
    } else if (target === "Invoice Sent") {
      setInvoiceBuilderOpen(true);
    } else if (target === "Lost") {
      setLostModalLead(lead);
      setLostModalOpen(true);
    } else {
      applyStageChange(lead, target);
      setPendingGate(null);
    }
  }

  // Entry point for ALL stage-change intents (dropdown, Move-to-next button,
  // journey footer actions). Applies the skip-warning rule before routing.
  function commitStageChange(lead: Lead, newStage: LeadStage) {
    if (newStage === lead.stage) return;
    // Lost is a special terminal action — bypass skip-warn and go straight to modal
    if (newStage === "Lost") {
      setLostModalLead(lead);
      setLostModalOpen(true);
      return;
    }
    if (newStage === "Schedule Offered") {
      const hasTrialRecord =
        lead.stage === "Trial Booked" ||
        lead.stage === "Trial Done" ||
        (lead.id === BILAL_LEAD_ID && journey.trial != null);
      if (!hasTrialRecord && !trialPromptSuppressed.has(lead.id)) {
        setPendingGate({ lead, target: newStage });
        setTrialPromptOpen(true);
        return;
      }
    }
    if (shouldWarnSkip(lead.stage, newStage)) {
      setPendingGate({ lead, target: newStage });
      setSkipWarningOpen(true);
      return;
    }
    routeStageChange(lead, newStage);
  }

  function applyMarkAsLost(lead: Lead, data: LostData) {
    const previousStage = lead.stage;
    setLeadLostData((prev) => ({ ...prev, [lead.id]: data }));
    if (lead.id === BILAL_LEAD_ID) {
      journey.setStage("Lost", currentUser.name);
    } else {
      setLeadStageOverrides((prev) => ({ ...prev, [lead.id]: "Lost" }));
      setLeadActivity((prev) => ({
        ...prev,
        [lead.id]: [
          {
            label: "Just now",
            text: `Lead marked as Lost — ${data.lostReason}${data.lostNotes ? ` · ${data.lostNotes}` : ""}`,
            dot: "bg-red-400",
          },
          ...(prev[lead.id] ?? []),
        ],
      }));
    }
    persistLeadStage(lead.id, "Lost", {
      lostReason: data.lostReason,
      lostNotes: data.lostNotes,
      reEngage: data.reEngage,
      reEngageAfter: data.reEngageAfter,
    });
    toast.success("Lead marked as lost");
    showUndoToast(lead, "Lost", previousStage, undefined, () => {
      setLeadLostData((prev) => {
        const next = { ...prev };
        delete next[lead.id];
        return next;
      });
    });
  }

  // Reset page when filters/view change
  useEffect(() => { setPage(1); }, [stageFilter, statusFilter, sourceFilter, deptFilter, assignedFilter, myLeads, view, createdOnRange]);

  // Keep the open detail lead in sync with journey overrides (Bilal's stage)
  useEffect(() => {
    setDetailLead((prev) => {
      if (!prev) return prev;
      const fresh = leads.find((l) => l.id === prev.id);
      return fresh && fresh.stage !== prev.stage ? fresh : prev;
    });
  }, [leads]);

  // Deep-link: open detail dialog if ?leadId= present (e.g. navigating from notification)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("leadId");
    if (!id) return;
    const lead = leads.find((l) => l.id === id || l.ref === id);
    if (!lead) return;
    setDetailLead(lead);
    setDetailOpen(true);
    const msgId = params.get("messageId");
    if (msgId) {
      setScrollToMessage({ id: msgId, seq: Date.now() });
    } else if (params.get("panel") === "chat") {
      window.setTimeout(() => {
        const el = document.getElementById("team-chat-panel");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same-page navigation: notification clicked while already on /leads
  useEffect(() => {
    function handler(e: Event) {
      const { leadId, messageId } = (e as CustomEvent<{ leadId: string; messageId?: string }>).detail;
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) {
        toast.error("This ticket is no longer available");
        return;
      }
      setDetailLead(lead);
      setDetailOpen(true);
      if (messageId) {
        setScrollToMessage({ id: messageId, seq: Date.now() });
      }
    }
    window.addEventListener("enrolla:open-lead-message", handler);
    return () => window.removeEventListener("enrolla:open-lead-message", handler);
  }, [leads]);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  function toggleCollapse(stage: LeadStage) {
    setCollapsedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stage)) next.delete(stage); else next.add(stage);
      try { localStorage.setItem(`enrolla_leads_list_collapsed_${currentUser.email}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  function toggleShowEmpty() {
    setShowEmptyStages((prev) => {
      const next = !prev;
      try { localStorage.setItem(`enrolla_leads_list_empty_${currentUser.email}`, String(next)); } catch {}
      return next;
    });
  }

  const majorityCollapsed = collapsedStages.size >= STAGES.length / 2;

  function toggleAll() {
    setCollapsedStages(() => {
      const next = majorityCollapsed ? new Set<string>() : new Set<string>(STAGES);
      try { localStorage.setItem(`enrolla_leads_list_collapsed_${currentUser.email}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  }

  const filteredLeads = useMemo(() => {
    let data = leads.filter((l) => {
      if (l.status === "converted" && !statusFilter.includes("Converted")) return false;
      if (stageFilter.length > 0 && !stageFilter.includes(l.stage)) return false;
      if (sourceFilter.length > 0 && !sourceFilter.includes(l.source)) return false;
      if (deptFilter.length > 0 && !deptFilter.includes(l.department)) return false;
      if (assignedFilter.length > 0 && !assignedFilter.includes(l.assignedTo)) return false;
      if (myLeads && l.assignedTo !== currentUser.name) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !l.childName.toLowerCase().includes(q) &&
          !l.guardian.toLowerCase().includes(q) &&
          !l.subjects.join(" ").toLowerCase().includes(q)
        ) return false;
      }
      if (createdOnRange.from || createdOnRange.to) {
        const d = l.createdOn ? new Date(l.createdOn) : null;
        if (!d || isNaN(d.getTime())) return false;
        if (createdOnRange.from && d < createdOnRange.from) return false;
        if (createdOnRange.to) {
          const to = new Date(createdOnRange.to); to.setHours(23, 59, 59, 999);
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
  }, [leads, statusFilter, stageFilter, sourceFilter, deptFilter, assignedFilter, myLeads, searchQuery, sortField, sortDir, createdOnRange]);

  const paginatedLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, page, pageSize]);

  function clearFilters() {
    setStageFilter([]);
    setStatusFilter([]);
    setSourceFilter([]);
    setDeptFilter([]);
    setAssignedFilter([]);
    setMyLeads(false);
    setSearchQuery("");
    setCreatedOnRange({ from: null, to: null });
  }

  const currentFilters = {
    stage: stageFilter,
    source: sourceFilter,
    department: deptFilter,
    assigned: assignedFilter,
  };

  function applySegment(filters: Record<string, string[]>) {
    setStageFilter(filters.stage ?? []);
    setSourceFilter(filters.source ?? []);
    setDeptFilter(filters.department ?? []);
    setAssignedFilter(filters.assigned ?? []);
    setPage(1);
  }

  // Dialog openers
  function openDetail(lead: Lead) {
    setDetailLead(lead);
    setDetailOpen(true);
  }
  function openReminder(lead: Lead) {
    setReminderLead(lead);
    setReminderOpen(true);
  }
  function openArchive(lead: Lead) {
    setArchiveLead(lead);
    setArchiveOpen(true);
    setDetailOpen(false);
  }
  function openMoveStage(lead: Lead) {
    setMoveStageLead(lead);
    setMoveStageOpen(true);
  }
  function openAddLead(stage: LeadStage | null = null) {
    setAddLeadStage(stage);
    setAddLeadOpen(true);
  }

  function handleBookAssessment(lead: Lead) {
    commitStageChange(lead, "Assessment Booked");
  }

  function handleBookTrial(lead: Lead) {
    commitStageChange(lead, "Trial Booked");
  }

  function handleSendInvoice(lead: Lead) {
    commitStageChange(lead, "Invoice Sent");
  }

  function handleOfferSchedule(lead: Lead) {
    commitStageChange(lead, "Schedule Offered");
  }

  function handleConfirmSchedule(lead: Lead) {
    commitStageChange(lead, "Schedule Confirmed");
  }

  function handleRecordPayment(lead: Lead) {
    setPendingGate({ lead, target: "Won" });
    setRecordPaymentOpen(true);
  }

  // Record an activity entry against any lead — routes to the journey store
  // (Bilal) or the per-lead override activity log.
  function recordLeadActivity(lead: Lead, entry: ActivityEntry) {
    if (lead.id === BILAL_LEAD_ID) {
      journey.pushActivity(entry);
    } else {
      setLeadActivity((prev) => ({
        ...prev,
        [lead.id]: [entry, ...(prev[lead.id] ?? [])],
      }));
    }
  }

  function handleMarkAsContacted(lead: Lead) {
    commitStageChange(lead, "Contacted");
  }

  function handleOpenNeedsMoreTime(lead: Lead, stageLabel: string) {
    setNeedsMoreTimeLead(lead);
    setNeedsMoreTimeStage(stageLabel);
    setNeedsMoreTimeOpen(true);
  }

  function handleOpenSkipAssessment(lead: Lead) {
    setSkipAssessmentLead(lead);
    setSkipAssessmentOpen(true);
  }

  function handleConfirmSkipAssessment() {
    const lead = skipAssessmentLead;
    setSkipAssessmentOpen(false);
    if (!lead) return;
    recordLeadActivity(lead, {
      label: "Just now",
      text: "Assessment skipped — moved to Schedule Offered",
      dot: "bg-slate-400",
    });
    commitStageChange(lead, "Schedule Offered");
  }

  function handleBookTrialFirst(lead: Lead) {
    bookTrialFromContactedRef.current = true;
    setPendingGate({ lead, target: "Trial Booked" });
    setBookTrialOpen(true);
  }

  function handleLogAssessmentOutcomeForLead(lead: Lead) {
    if (lead.id === BILAL_LEAD_ID) {
      setLogAssessmentOpen(true);
    } else {
      recordLeadActivity(lead, {
        label: "Just now",
        text: "Assessment outcome logged",
        dot: "bg-indigo-400",
      });
      commitStageChange(lead, "Assessment Done");
    }
  }

  function handleLogTrialOutcomeForLead(lead: Lead) {
    if (lead.id === BILAL_LEAD_ID) {
      setLogTrialOpen(true);
    } else {
      recordLeadActivity(lead, {
        label: "Just now",
        text: "Trial outcome logged",
        dot: "bg-emerald-400",
      });
      commitStageChange(lead, "Trial Done");
    }
  }

  // Track ad-hoc student records created for non-Bilal leads (so we can undo).
  const createdStudentsRef = useRef<Record<string, Student>>({});

  function nextStudentIdForNonBilal(): string {
    // Derive next IMI number from API students (student_number field) + any
    // locally-created non-Bilal records still in the ref (not yet persisted).
    let max = 0;
    for (const s of studentsData) {
      const raw = s.student_number ?? '';
      const n = Number(raw.replace(/^IMI-/i, ''));
      if (!Number.isNaN(n) && n > max) max = n;
    }
    for (const s of Object.values(createdStudentsRef.current)) {
      const n = Number(s.id.replace("IMI-", ""));
      if (!Number.isNaN(n) && n > max) max = n;
    }
    return `IMI-${String(max + 1).padStart(4, "0")}`;
  }

  function handlePaidAutoConvert(
    lead: Lead,
    payment: { amount: number; method: string },
  ): { studentId: string; studentName: string; previousStage: LeadStage } | null {
    const previousStage: LeadStage = "Invoice Sent";

    if (lead.id === BILAL_LEAD_ID) {
      const parts = lead.childName.trim().split(" ");
      const created = journey.convertToStudent({
        firstName: parts[0] ?? "Bilal",
        lastName: parts.slice(1).join(" ") || "Mahmood",
        yearGroup: lead.yearGroup,
        guardianName: lead.guardian,
        guardianPhone: lead.guardianPhone,
        school: "IMI Dubai",
      });
      return { studentId: created.id, studentName: created.name, previousStage };
    }

    const paymentLine: ActivityEntry = {
      label: "Just now",
      text: `Payment recorded — AED ${payment.amount.toFixed(0)} via ${payment.method}`,
      dot: "bg-lime-500",
    };
    const studentId = nextStudentIdForNonBilal();
    const newStudent: Student = {
      id: studentId,
      name: lead.childName,
      yearGroup: lead.yearGroup,
      department: lead.department,
      school: "—",
      guardian: lead.guardian,
      guardianPhone: lead.guardianPhone,
      enrolments: 1,
      churnScore: null,
      status: "Active",
      lastContact: "Today",
      createdOn: new Date().toISOString().slice(0, 10),
    };
    // Track locally for undo and ID generation; also optimistically add to state.
    createdStudentsRef.current[lead.id] = newStudent;
    setStudentsData((prev) => [
      ...prev,
      { id: newStudent.id, student_number: newStudent.id, first_name: newStudent.name.split(' ')[0], last_name: newStudent.name.split(' ').slice(1).join(' ') },
    ]);

    setLeadStageOverrides((prev) => ({ ...prev, [lead.id]: "Won" }));
    persistLeadStage(lead.id, "Won");
    setLeadActivity((prev) => ({
      ...prev,
      [lead.id]: [
        {
          label: "Just now",
          text: `Lead converted to student — ${studentId} · Won`,
          dot: "bg-emerald-500",
        },
        paymentLine,
        ...(prev[lead.id] ?? []),
      ],
    }));
    return { studentId, studentName: lead.childName, previousStage };
  }

  // Listen for undo events raised from RecordPaymentDialog's toast (non-Bilal).
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ leadId: string; studentId: string; previousStage: LeadStage }>).detail;
      if (!detail) return;
      const { leadId, studentId, previousStage } = detail;
      // Remove created student
      // Remove the optimistically-added student from local state.
      setStudentsData((prev) => prev.filter((s) => s.id !== studentId));
      delete createdStudentsRef.current[leadId];
      // Revert stage
      setLeadStageOverrides((prev) => ({ ...prev, [leadId]: previousStage }));
      persistLeadStage(leadId, previousStage);
      setLeadActivity((prev) => ({
        ...prev,
        [leadId]: [
          {
            label: "Just now",
            text: "Conversion undone — student record removed",
            dot: "bg-slate-400",
          },
          ...(prev[leadId] ?? []),
        ],
      }));
    }
    window.addEventListener("enrolla:undo-paid-conversion", handler);
    return () => window.removeEventListener("enrolla:undo-paid-conversion", handler);
  }, []);

  // Listen for follow-up task completions dispatched from the Tasks page.
  // Adds an activity entry to the source lead and, when the task was a
  // "Follow up —" task, queues an amber banner on the lead ticket.
  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent<{ leadId: string; taskId: string; taskTitle: string; completedBy: string }>).detail;
      if (!detail) return;
      const { leadId, taskTitle, completedBy } = detail;
      const entry: ActivityEntry = {
        label: "Just now",
        text: `Follow-up task completed — ${taskTitle} · marked done by ${completedBy}`,
        dot: "bg-emerald-400",
      };
      if (leadId === BILAL_LEAD_ID) {
        journey.pushActivity(entry);
      } else {
        setLeadActivity((prev) => ({
          ...prev,
          [leadId]: [entry, ...(prev[leadId] ?? [])],
        }));
      }
      if (taskTitle.startsWith("Follow up —")) {
        setFollowUpBanners((prev) => ({ ...prev, [leadId]: { taskTitle } }));
      }
    }
    window.addEventListener("enrolla:lead-followup-completed", handler);
    return () => window.removeEventListener("enrolla:lead-followup-completed", handler);
  }, [journey]);

  function handleConvert(lead: Lead) {
    setConvertTargetLead(lead);
    setConvertOpen(true);
  }

  function makeActions(lead: Lead): LeadActions {
    return {
      onView: () => openDetail(lead),
      onEdit: () => toast("Edit lead — coming soon"),
      onMoveStage: () => openMoveStage(lead),
      onBookAssessment: () => handleBookAssessment(lead),
      onBookTrial: () => handleBookTrial(lead),
      onConvertToStudent: () => handleConvert(lead),
      onMarkLost: () => { setLostModalLead(lead); setLostModalOpen(true); },
      onArchive: () => openArchive(lead),
    };
  }

  const viewButtons: { key: ViewMode; Icon: React.ElementType; label: string }[] = [
    { key: "kanban", Icon: LayoutGrid, label: "Kanban" },
    { key: "list", Icon: List, label: "List" },
    { key: "table", Icon: Table2, label: "Table" },
  ];

  if (!can('leads.view')) return <AccessDenied />;

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          No active leads
        </p>
        <div className="flex items-center gap-2">
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
          {can('leads.create') && (
            <button
              type="button"
              onClick={() => openAddLead()}
              className="btn-primary flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Lead
            </button>
          )}
        </div>
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Leads"
        recordCount={28}
        formats={[
          { id: 'csv-pipeline', label: 'Pipeline Export', description: 'One row per lead. Name, stage, source, assigned to, days in pipeline.', icon: 'rows', recommended: true },
          { id: 'csv-full', label: 'Full Export', description: 'All fields including notes and activity history.', icon: 'items' },
        ]}
      />

      {/* ── Saved segments ──────────────────────────────────────────────────── */}
      {segments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-xs text-slate-400 uppercase tracking-wide">Saved:</span>
          {segments.map(seg => (
            <div key={seg.id} className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <button onClick={() => applySegment(seg.filters)} className="text-xs text-amber-700 font-medium hover:text-amber-900 cursor-pointer">{seg.name}</button>
              <button onClick={() => deleteSegment(seg.id)} className="text-amber-400 hover:text-amber-700 ml-1 text-xs cursor-pointer">×</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter & View Bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search — leftmost */}
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, guardian, school, subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                "pl-8 pr-7 py-1.5 text-sm border border-slate-200 bg-white rounded-md outline-none text-slate-700 placeholder:text-slate-400 transition-[width] duration-200 focus:border-amber-400",
                searchFocused || searchQuery ? "w-72" : "w-56"
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
          <MultiSelectFilter label="Stage"       options={STAGE_FILTER_OPTIONS}    selected={stageFilter}    onChange={setStageFilter}    />
          <MultiSelectFilter label="Status"      options={["Converted"]}           selected={statusFilter}   onChange={setStatusFilter}   />
          <MultiSelectFilter label="Source"      options={SOURCE_FILTER_OPTIONS}   selected={sourceFilter}   onChange={setSourceFilter}   />
          <MultiSelectFilter label="Department"  options={DEPT_FILTER_OPTIONS}     selected={deptFilter}     onChange={setDeptFilter}     />
          <MultiSelectFilter label="Assigned to" options={ASSIGNED_FILTER_OPTIONS} selected={assignedFilter} onChange={setAssignedFilter} />

          {/* My Leads toggle */}
          <div className="flex items-center gap-2 pl-1">
            <button
              role="switch"
              aria-checked={myLeads}
              onClick={() => setMyLeads((m) => !m)}
              className={cn(
                "relative inline-flex w-9 h-5 rounded-full transition-colors cursor-pointer focus:outline-none",
                myLeads ? "bg-amber-500" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "inline-block w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform absolute top-0.5",
                  myLeads ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
            <span className="text-sm text-slate-600 font-medium">My Leads</span>
          </div>

          <DateRangePicker
            value={createdOnRange}
            onChange={setCreatedOnRange}
            presets={DATE_PRESETS}
            placeholder="Created on"
          />

          {hasActiveFilters && (
            <div className="relative flex items-center gap-2">
              <button onClick={clearFilters} className="text-xs text-slate-500 hover:text-amber-600 underline cursor-pointer transition-colors">
                Clear filters
              </button>
              <button onClick={() => setSavePopoverOpen(true)} className="text-xs text-amber-600 hover:text-amber-800 underline cursor-pointer">
                Save segment
              </button>
              {savePopoverOpen && (
                <SaveSegmentPopover
                  onSave={(name) => { saveSegment(name, currentFilters); setSavePopoverOpen(false); }}
                  onClose={() => setSavePopoverOpen(false)}
                />
              )}
            </div>
          )}
        </div>

        {/* View toggle + Personalise */}
        <div className="flex items-center gap-2">
          {/* Personalise popover — only relevant on Kanban */}
          {view === "kanban" && (
            <>
              <button
                ref={personaliseTriggerRef}
                type="button"
                onClick={togglePersonalise}
                aria-label="Personalise kanban view"
                aria-expanded={personaliseOpen}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border",
                  personaliseOpen
                    ? "bg-amber-50 border-amber-300 text-amber-700"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300",
                )}
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Personalise</span>
              </button>
              {personaliseOpen && typeof window !== "undefined" && (
                <PersonalisePopover
                  popoverRef={personalisePopoverRef}
                  pos={personalisePos}
                  prefs={kanbanPrefs}
                  setPrefs={setKanbanPrefs}
                  onReset={resetKanbanPrefs}
                />
              )}
            </>
          )}

          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {viewButtons.map(({ key, Icon, label }) => (
              <button
                key={key}
                onClick={() => setView(key)}
                aria-label={label}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  view === key
                    ? "bg-white text-amber-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Kanban View ─────────────────────────────────────────────────── */}
      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-3 min-h-0 flex-1 -mx-6 px-6">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              stageLeads={filteredLeads.filter((l) => l.stage === stage)}
              onOpenDetail={openDetail}
              onOpenReminder={openReminder}
              onAddLead={(s) => openAddLead(s)}
              makeActions={makeActions}
              onDropLead={(leadId) => {
                const lead = leads.find((l) => l.id === leadId);
                if (lead) commitStageChange(lead, stage);
              }}
              prefs={kanbanPrefs}
              collapsed={collapsedColumnsSet.has(stage)}
              onToggleCollapse={() => toggleColumnCollapse(stage)}
              columnWidth={effectiveColWidth}
            />
          ))}
        </div>
      )}

      {/* ── List View (grouped by stage) ────────────────────────────────── */}
      {view === "list" && (
        <div className="flex-1 overflow-auto">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleShowEmpty}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer",
                    showEmptyStages
                      ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700",
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  {showEmptyStages ? "Hide empty stages" : "Show empty stages"}
                </button>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white transition-colors cursor-pointer"
                >
                  {majorityCollapsed ? (
                    <>
                      <ChevronsDown className="h-3.5 w-3.5" />
                      Expand all
                    </>
                  ) : (
                    <>
                      <ChevronsUp className="h-3.5 w-3.5" />
                      Collapse all
                    </>
                  )}
                </button>
              </div>
              <span className="text-xs text-slate-400">{filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}</span>
            </div>

            {filteredLeads.length === 0 ? (
              <EmptyState
                icon={Filter}
                title="No leads match your filters"
                description="Try adjusting the stage, source, or department filters."
                action={{ label: "Clear filters", onClick: clearFilters }}
              />
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-slate-200 bg-white shadow-[0_1px_0_0_#e2e8f0]">
                    <th className="w-8 px-2 py-3" />
                    <SortableHeader label="Lead"          field="childName"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Guardian"      field="guardian"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Year"          field="yearGroup"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Subject(s)</th>
                    <SortableHeader label="Source"        field="source"         sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Assigned"      field="assignedTo"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Last Activity" field="lastActivity"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Days"          field="daysInPipeline" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                    <th className="w-12 px-4 py-3" />
                  </tr>
                </thead>

                {STAGES.map((stage) => {
                  const stageLeads = filteredLeads.filter((l) => l.stage === stage);
                  if (!showEmptyStages && stageLeads.length === 0) return null;
                  const isCollapsed = collapsedStages.has(stage);
                  const isOver = dragOverStage === stage;
                  const now = Date.now();

                  return (
                    <tbody
                      key={stage}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (dragOverStage !== stage) setDragOverStage(stage);
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                          setDragOverStage(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOverStage(null);
                        const leadId = e.dataTransfer.getData("text/plain");
                        const lead = leads.find((l) => l.id === leadId);
                        if (lead) commitStageChange(lead, stage);
                      }}
                    >
                      {/* Section header */}
                      <tr
                        onClick={() => toggleCollapse(stage)}
                        className={cn(
                          "cursor-pointer select-none transition-colors",
                          isOver ? "bg-amber-50" : "bg-slate-50 hover:bg-slate-100",
                        )}
                      >
                        <td
                          colSpan={10}
                          className={cn(
                            "px-4 py-2 border-b border-t border-slate-200 transition-colors",
                            isOver && "border-l-2 border-l-amber-400",
                          )}
                        >
                          {(() => {
                            const cfg = STAGE_CONFIG[stage];
                            return (
                              <div className="flex items-center gap-2">
                                <ChevronDown
                                  className={cn(
                                    "w-3.5 h-3.5 shrink-0 transition-transform",
                                    isCollapsed ? "-rotate-90" : "rotate-0",
                                    cfg.headerText,
                                  )}
                                />
                                <span className={cn(
                                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                  cfg.badge,
                                )}>
                                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dot)} />
                                  {stage}
                                </span>
                                <span className="text-xs text-slate-400 font-medium tabular-nums">
                                  {stageLeads.length}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>

                      {/* Lead rows */}
                      {!isCollapsed && stageLeads.map((lead) => {
                        const palette = getAvatarPalette(lead.assignedTo);
                        const isNew = lead.createdOn
                          ? now - new Date(lead.createdOn).getTime() < 48 * 60 * 60 * 1000
                          : false;
                        const isConverted = lead.status === "converted";
                        const convertedStudentName = lead.convertedStudentId
                          ? (() => {
                              const s = studentsData.find((s) => s.id === lead.convertedStudentId);
                              return s ? `${s.first_name} ${s.last_name}`.trim() : lead.convertedStudentId;
                            })()
                          : null;

                        return (
                          <tr
                            key={lead.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", lead.id);
                              e.dataTransfer.effectAllowed = "move";
                            }}
                            onClick={() => openDetail(lead)}
                            className="border-b border-slate-100 hover:bg-amber-50/30 transition-colors cursor-pointer group"
                            style={{ height: "48px" }}
                          >
                            {/* Drag handle */}
                            <td className="w-8 px-2 py-3">
                              <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
                            </td>

                            {/* Lead name */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-slate-800 text-sm leading-tight">{lead.childName}</span>
                                    {isNew && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Created in last 48 h" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 font-mono">{lead.ref}</p>
                                  {lead.stage === "Lost" && lead.lostReason && (
                                    <p className="text-[10px] text-slate-400 italic truncate max-w-[200px]">{lead.lostReason}</p>
                                  )}
                                  {isConverted && lead.convertedStudentId && (
                                    <a
                                      href={`/students/${lead.convertedStudentId}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-[10px] font-medium text-emerald-700 hover:text-emerald-900 underline underline-offset-1 cursor-pointer"
                                    >
                                      {convertedStudentName ?? lead.convertedStudentId}
                                    </a>
                                  )}
                                </div>
                                {lead.dnc && (
                                  <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                    DNC
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Guardian */}
                            <td className="px-4 py-3">
                              <p className="text-sm text-slate-700 whitespace-nowrap">{lead.guardian}</p>
                              <p className="text-xs text-slate-400">{lead.guardianPhone}</p>
                            </td>

                            {/* Year */}
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                                {lead.yearGroup}
                              </span>
                            </td>

                            {/* Subjects */}
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {lead.subjects.map((s) => (
                                  <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Source */}
                            <td className="px-4 py-3">
                              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SOURCE_CONFIG[lead.source])}>
                                {lead.source}
                              </span>
                            </td>

                            {/* Assigned */}
                            <td className="px-4 py-3">
                              <div
                                className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold", palette.bg, palette.text)}
                                title={lead.assignedTo}
                              >
                                {getInitials(lead.assignedTo)}
                              </div>
                            </td>

                            {/* Last Activity */}
                            <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{lead.lastActivity}</td>

                            {/* Days */}
                            <td className="px-4 py-3 text-sm text-slate-500 text-center tabular-nums">{lead.daysInPipeline}</td>

                            {/* Actions */}
                            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                              <LeadActionMenu lead={lead} actions={makeActions(lead)} />
                            </td>
                          </tr>
                        );
                      })}

                      {/* Empty section row */}
                      {!isCollapsed && stageLeads.length === 0 && (
                        <tr>
                          <td colSpan={10} className="px-6 py-3 text-xs text-slate-400 text-center italic border-b border-slate-100">
                            No leads at this stage
                          </td>
                        </tr>
                      )}
                    </tbody>
                  );
                })}
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Table View (compact) ────────────────────────────────────────── */}
      {view === "table" && (
        <div className="flex-1 overflow-auto">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <SortableHeader label="Child Name"    field="childName"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Year"          field="yearGroup"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Stage"         field="stage"          sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Source"        field="source"         sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Assigned"      field="assignedTo"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Last Activity" field="lastActivity"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Days"          field="daysInPipeline" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                </tr>
              </thead>
              <tbody>
                {paginatedLeads.map((lead) => {
                  const cfg = STAGE_CONFIG[lead.stage];
                  const palette = getAvatarPalette(lead.assignedTo);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => openDetail(lead)}
                      className="border-b border-slate-100 hover:bg-amber-50/30 transition-colors cursor-pointer"
                      style={{ height: "40px" }}
                    >
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800 text-sm">{lead.childName}</span>
                          {lead.dnc && (
                            <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                              DNC
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                          {lead.yearGroup}
                        </span>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap", cfg.badge)}>
                            {lead.stage}
                          </span>
                          {lead.stage === "Lost" && (
                            lead.reEngage === false ? (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 whitespace-nowrap">
                                Do not re-engage
                              </span>
                            ) : lead.reEngageAfter ? (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 whitespace-nowrap">
                                Re-engage after {lead.reEngageAfter}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-100 text-green-700 whitespace-nowrap">
                                Re-engage when ready
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-1.5">
                        <span className={cn("px-1.5 py-0.5 rounded text-xs font-medium", SOURCE_CONFIG[lead.source])}>
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-4 py-1.5">
                        <div
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                            palette.bg,
                            palette.text
                          )}
                          title={lead.assignedTo}
                        >
                          {getInitials(lead.assignedTo)}
                        </div>
                      </td>
                      <td className="px-4 py-1.5 text-xs text-slate-500 whitespace-nowrap">{lead.lastActivity}</td>
                      <td className="px-4 py-1.5 text-xs text-slate-500 text-center">{lead.daysInPipeline}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <EmptyState
                icon={Filter}
                title="No leads match your filters"
                description="Try adjusting the stage, source, or department filters."
                action={{ label: "Clear filters", onClick: clearFilters }}
              />
            )}
            <PaginationBar
              total={filteredLeads.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          </div>
        </div>
      )}

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <LeadDetailDialog
        lead={detailLead}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onMarkAsContacted={handleMarkAsContacted}
        onBookAssessment={handleBookAssessment}
        onBookTrialFirst={handleBookTrialFirst}
        onNeedsMoreTime={handleOpenNeedsMoreTime}
        onSkipAssessment={handleOpenSkipAssessment}
        onConvert={handleConvert}
        onArchive={(l) => openArchive(l)}
        onLogAssessmentOutcome={handleLogAssessmentOutcomeForLead}
        onLogTrialOutcome={handleLogTrialOutcomeForLead}
        onSendInvoice={handleSendInvoice}
        onOfferSchedule={handleOfferSchedule}
        onConfirmSchedule={handleConfirmSchedule}
        onRecordPayment={handleRecordPayment}
        onStageChange={commitStageChange}
        onUpdatePrefs={updateLeadPrefs}
        leadActivity={detailLead ? leadActivity[detailLead.id] ?? [] : []}
        followUpBanner={detailLead ? followUpBanners[detailLead.id] ?? null : null}
        onDismissFollowUpBanner={() => {
          if (!detailLead) return;
          const leadId = detailLead.id;
          setFollowUpBanners((prev) => {
            if (!prev[leadId]) return prev;
            const next = { ...prev };
            delete next[leadId];
            return next;
          });
        }}
        scrollToMessageId={scrollToMessage}
      />
      <NeedsMoreTimeDialog
        open={needsMoreTimeOpen}
        onOpenChange={setNeedsMoreTimeOpen}
        lead={needsMoreTimeLead}
        currentStage={needsMoreTimeStage}
        onCreated={({ assignees, dueLabel }) => {
          if (needsMoreTimeLead) {
            const names = assignees.length > 0 ? assignees.join(", ") : "Unassigned";
            recordLeadActivity(needsMoreTimeLead, {
              label: "Just now",
              text: `Follow-up task created — ${names} · due ${dueLabel}`,
              dot: "bg-slate-400",
            });
          }
        }}
      />
      <SkipAssessmentDialog
        open={skipAssessmentOpen}
        onOpenChange={setSkipAssessmentOpen}
        onConfirm={handleConfirmSkipAssessment}
      />
      <BookAssessmentDialog
        open={bookAssessmentOpen}
        onOpenChange={(o) => {
          setBookAssessmentOpen(o);
          if (!o) setPendingGate(null);
        }}
        lead={pendingGate?.lead ?? null}
        onCommit={() => {
          if (pendingGate) applyStageChange(pendingGate.lead, pendingGate.target);
          setPendingGate(null);
        }}
        onUpdatePrefs={updateLeadPrefs}
        onRecordActivity={(leadId, entry) =>
          setLeadActivity((prev) => ({
            ...prev,
            [leadId]: [entry, ...(prev[leadId] ?? [])],
          }))
        }
      />
      <LogAssessmentOutcomeDialog
        open={logAssessmentOpen}
        onOpenChange={setLogAssessmentOpen}
        lead={detailLead}
      />
      <BookTrialDialog
        open={bookTrialOpen}
        onOpenChange={(o) => {
          setBookTrialOpen(o);
          if (!o) {
            // Preserve pendingGate when the soft prompt is chaining into a
            // schedule-offer step; otherwise clear it on close.
            if (chainAfterTrialRef.current) {
              chainAfterTrialRef.current = false;
            } else {
              setPendingGate(null);
            }
            if (bookTrialFromContactedRef.current) {
              bookTrialFromContactedRef.current = false;
            }
          }
        }}
        lead={pendingGate?.lead ?? null}
        onCommit={() => {
          if (!pendingGate) return;
          const { lead, target } = pendingGate;
          const skippedAssessment = bookTrialFromContactedRef.current;
          applyStageChange(lead, target);
          if (skippedAssessment) {
            recordLeadActivity(lead, {
              label: "Just now",
              text: "Trial booked directly — assessment skipped",
              dot: "bg-amber-400",
            });
            bookTrialFromContactedRef.current = false;
          }
          if (chainAfterTrialRef.current) {
            setPendingGate({ lead, target: "Schedule Offered" });
            setScheduleOfferOpen(true);
          } else {
            setPendingGate(null);
          }
        }}
        onRecordActivity={(leadId, entry) =>
          setLeadActivity((prev) => ({
            ...prev,
            [leadId]: [entry, ...(prev[leadId] ?? [])],
          }))
        }
      />
      <LogTrialOutcomeDialog open={logTrialOpen} onOpenChange={setLogTrialOpen} />
      <ScheduleOfferDialog
        open={scheduleOfferOpen}
        onOpenChange={(o) => {
          setScheduleOfferOpen(o);
          if (!o) setPendingGate(null);
        }}
        lead={pendingGate?.lead ?? null}
        onCommit={() => {
          if (pendingGate) applyStageChange(pendingGate.lead, pendingGate.target);
          setPendingGate(null);
        }}
      />
      <ScheduleConfirmDialog
        open={scheduleConfirmOpen}
        onOpenChange={(o) => {
          setScheduleConfirmOpen(o);
          if (!o) setPendingGate(null);
        }}
        lead={pendingGate?.lead ?? null}
        onCommit={() => {
          if (pendingGate) applyStageChange(pendingGate.lead, pendingGate.target);
          setPendingGate(null);
        }}
      />
      <InvoiceBuilderDialog
        open={invoiceBuilderOpen}
        onOpenChange={(o) => {
          setInvoiceBuilderOpen(o);
          if (!o) setPendingGate(null);
        }}
        lead={pendingGate?.lead ?? null}
        onCommit={() => {
          if (pendingGate) applyStageChange(pendingGate.lead, pendingGate.target);
          setPendingGate(null);
        }}
      />
      <RecordPaymentDialog
        open={recordPaymentOpen}
        onOpenChange={(o) => {
          setRecordPaymentOpen(o);
          if (!o) setPendingGate(null);
        }}
        lead={pendingGate?.lead ?? null}
        onCommit={() => {
          if (pendingGate) applyStageChange(pendingGate.lead, pendingGate.target);
          setPendingGate(null);
        }}
      />
      <SkipWarningDialog
        open={skipWarningOpen}
        onOpenChange={(o) => {
          setSkipWarningOpen(o);
          if (!o) setPendingGate(null);
        }}
        currentStage={pendingGate?.lead.stage ?? null}
        targetStage={pendingGate?.target ?? null}
        onContinue={() => {
          setSkipWarningOpen(false);
          if (pendingGate) {
            const { lead, target } = pendingGate;
            routeStageChange(lead, target);
          }
        }}
      />
      <TrialSkipPromptDialog
        open={trialPromptOpen}
        onOpenChange={(o) => {
          setTrialPromptOpen(o);
          if (!o && !chainAfterTrialRef.current) setPendingGate(null);
        }}
        onBookTrialFirst={(suppress) => {
          if (!pendingGate) {
            setTrialPromptOpen(false);
            return;
          }
          const { lead } = pendingGate;
          if (suppress) {
            setTrialPromptSuppressed((prev) => {
              const next = new Set(prev);
              next.add(lead.id);
              return next;
            });
          }
          chainAfterTrialRef.current = true;
          setPendingGate({ lead, target: "Trial Booked" });
          setTrialPromptOpen(false);
          setBookTrialOpen(true);
        }}
        onSkipToScheduling={(suppress) => {
          if (!pendingGate) {
            setTrialPromptOpen(false);
            return;
          }
          const { lead, target } = pendingGate;
          if (suppress) {
            setTrialPromptSuppressed((prev) => {
              const next = new Set(prev);
              next.add(lead.id);
              return next;
            });
          }
          setTrialPromptOpen(false);
          routeStageChange(lead, target);
        }}
      />
      <ConvertToStudentDialog
        open={convertOpen}
        onOpenChange={(o) => {
          setConvertOpen(o);
          if (!o) setConvertTargetLead(null);
        }}
        lead={convertTargetLead}
        onConverted={(data) => {
          const lead = convertTargetLead;
          if (!lead) return;
          const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
          let studentId: string;
          let studentName: string;
          if (lead.id === BILAL_LEAD_ID) {
            const created = journey.convertToStudent({
              firstName: data.firstName,
              lastName: data.lastName,
              yearGroup: data.yearGroup,
              guardianName: data.guardianName,
              guardianPhone: data.guardianPhone,
              school: data.school,
            });
            studentId = created.id;
            studentName = created.name;
          } else {
            studentId = nextStudentIdForNonBilal();
            studentName = `${data.firstName} ${data.lastName}`.trim();
            const newStudent: Student = {
              id: studentId,
              name: studentName,
              yearGroup: data.yearGroup,
              department: departmentFor(data.yearGroup),
              school: data.school,
              guardian: data.guardianName,
              guardianPhone: data.guardianPhone,
              enrolments: 1,
              churnScore: null,
              status: "Active",
              lastContact: "Today",
              createdOn: new Date().toISOString().slice(0, 10),
              sourceLeadId: lead.id,
            };
            createdStudentsRef.current[lead.id] = newStudent;
            setStudentsData((prev) => [
              ...prev,
              { id: newStudent.id, student_number: newStudent.id, first_name: data.firstName, last_name: data.lastName },
            ]);
            setLeadStageOverrides((prev) => ({ ...prev, [lead.id]: "Won" }));
            persistLeadStage(lead.id, "Won");
            setLeadConvertedData((prev) => ({ ...prev, [lead.id]: { studentId, studentName, convertedOn: today } }));
            setLeadActivity((prev) => ({
              ...prev,
              [lead.id]: [
                { label: "Just now", text: `Converted to student — ${studentId} · ${studentName}`, dot: "bg-emerald-500" },
                ...(prev[lead.id] ?? []),
              ],
            }));
          }
          toast.success(`Student record created — ${studentId}`);
        }}
      />
      <CreateEnrolmentDialog open={createEnrolmentOpen} onOpenChange={setCreateEnrolmentOpen} />
      <ReminderDialog
        lead={reminderLead}
        open={reminderOpen}
        onOpenChange={setReminderOpen}
      />
      <AddLeadDialog
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        initialStage={addLeadStage}
        onSaved={fetchLeads}
      />
      <ArchiveConfirmDialog
        lead={archiveLead}
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
      />
      <MoveStageDialog
        lead={moveStageLead}
        open={moveStageOpen}
        onOpenChange={setMoveStageOpen}
        onConfirm={(l, s) => commitStageChange(l, s)}
      />
      <MarkAsLostModal
        lead={lostModalLead}
        open={lostModalOpen}
        onOpenChange={setLostModalOpen}
        onConfirm={(l, data) => applyMarkAsLost(l, data)}
      />
    </div>
  );
}
