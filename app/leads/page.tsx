"use client";

import { useState, useMemo, useRef, useEffect } from "react";
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
} from "lucide-react";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { DateRangePicker, DATE_PRESETS, type DateRange } from "@/components/ui/date-range-picker";
import { SortableHeader } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useSavedSegments } from "@/hooks/use-saved-segments";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { ExportDialog } from "@/components/ui/export-dialog";
import { leads as leadsData, tasks as taskStore, students as studentsStore, type Lead, type LeadStage, type LeadSource, type PreferredWindow, type Task, type Student } from "@/lib/mock-data";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useJourney, BILAL_LEAD_ID, formatDate, type ActivityEntry } from "@/lib/journey-store";
import { useAssessments } from "@/lib/assessment-store";
import { BookAssessmentDialog } from "@/components/journey/book-assessment-dialog";
import { LogAssessmentOutcomeDialog } from "@/components/journey/log-assessment-outcome-dialog";
import { BookTrialDialog } from "@/components/journey/book-trial-dialog";
import { LogTrialOutcomeDialog } from "@/components/journey/log-trial-outcome-dialog";
import { ConvertToStudentDialog } from "@/components/journey/convert-to-student-dialog";
import { CreateEnrolmentDialog } from "@/components/journey/create-enrolment-dialog";
import { ScheduleOfferDialog } from "@/components/journey/schedule-offer-dialog";
import { ScheduleConfirmDialog } from "@/components/journey/schedule-confirm-dialog";
import { InvoiceBuilderDialog } from "@/components/journey/invoice-builder-dialog";
import { RecordPaymentDialog } from "@/components/journey/record-payment-dialog";
import { SkipWarningDialog, shouldWarnSkip } from "@/components/journey/skip-warning-dialog";
import { TrialSkipPromptDialog } from "@/components/journey/trial-skip-prompt-dialog";
import { NeedsMoreTimeDialog } from "@/components/journey/needs-more-time-dialog";
import { SkipAssessmentDialog } from "@/components/journey/skip-assessment-dialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: LeadStage[] = [
  "New",
  "Contacted",
  "Assessment Booked",
  "Assessment Done",
  "Trial Booked",
  "Trial Done",
  "Schedule Offered",
  "Schedule Confirmed",
  "Invoice Sent",
  "Paid",
  "Won",
];

const STAGE_CONFIG: Record<
  LeadStage,
  { color: string; badge: string; colBg: string; headerText: string }
> = {
  New: {
    color: "border-l-slate-400",
    badge: "bg-slate-100 text-slate-700",
    colBg: "bg-slate-50",
    headerText: "text-slate-700",
  },
  Contacted: {
    color: "border-l-blue-400",
    badge: "bg-blue-100 text-blue-700",
    colBg: "bg-blue-50/40",
    headerText: "text-blue-700",
  },
  "Assessment Booked": {
    color: "border-l-purple-400",
    badge: "bg-purple-100 text-purple-700",
    colBg: "bg-purple-50/40",
    headerText: "text-purple-700",
  },
  "Assessment Done": {
    color: "border-l-indigo-400",
    badge: "bg-indigo-100 text-indigo-700",
    colBg: "bg-indigo-50/40",
    headerText: "text-indigo-700",
  },
  "Trial Booked": {
    color: "border-l-amber-400",
    badge: "bg-amber-100 text-amber-700",
    colBg: "bg-amber-50/40",
    headerText: "text-amber-700",
  },
  "Trial Done": {
    color: "border-l-emerald-400",
    badge: "bg-emerald-100 text-emerald-700",
    colBg: "bg-emerald-50/40",
    headerText: "text-emerald-700",
  },
  "Schedule Offered": {
    color: "border-l-orange-400",
    badge: "bg-orange-100 text-orange-700",
    colBg: "bg-orange-50/40",
    headerText: "text-orange-700",
  },
  "Schedule Confirmed": {
    color: "border-l-cyan-400",
    badge: "bg-cyan-100 text-cyan-700",
    colBg: "bg-cyan-50/40",
    headerText: "text-cyan-700",
  },
  "Invoice Sent": {
    color: "border-l-teal-400",
    badge: "bg-teal-100 text-teal-700",
    colBg: "bg-teal-50/40",
    headerText: "text-teal-700",
  },
  Paid: {
    color: "border-l-lime-500",
    badge: "bg-lime-100 text-lime-700",
    colBg: "bg-lime-50/40",
    headerText: "text-lime-700",
  },
  Won: {
    color: "border-l-green-400",
    badge: "bg-green-100 text-green-700",
    colBg: "bg-green-50/50",
    headerText: "text-green-700",
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
const ASSIGNED_FILTER_OPTIONS = ["Jason Daswani", "Sarah Admin"];

const ADD_LEAD_YEAR_OPTIONS = [
  "KG1", "KG2", "Y1", "Y2", "Y3", "Y4", "Y5", "Y6",
  "Y7", "Y8", "Y9", "Y10", "Y11", "Y12", "Y13",
];
const ADD_LEAD_SUBJECT_OPTIONS = [
  "Maths", "English", "Science", "Physics",
  "Chemistry", "Biology", "Business", "Economics",
];
const ADD_LEAD_SOURCE_OPTIONS: LeadSource[] = ["Website", "Referral", "Event", "Phone", "Walk-in"];

// ─── Avatar helpers ───────────────────────────────────────────────────────────

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

// ─── Lead action handlers (shared across menus & detail dialog) ───────────────

function nextStageOf(stage: LeadStage): LeadStage | null {
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

  const canConvert = lead.stage === "Paid";

  const items: { icon: React.ElementType; label: string; onClick: () => void; hidden?: boolean; danger?: boolean }[] = [
    { icon: Eye, label: "View", onClick: actions.onView },
    { icon: Edit3, label: "Edit Lead", onClick: actions.onEdit },
    { icon: MoveRight, label: "Move Stage", onClick: actions.onMoveStage },
    { icon: BookOpen, label: "Book Assessment", onClick: actions.onBookAssessment },
    { icon: BookOpen, label: "Book Trial Session", onClick: actions.onBookTrial },
    { icon: UserPlus, label: "Convert to Student", onClick: actions.onConvertToStudent, hidden: !canConvert },
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
}: {
  lead: Lead;
  onOpenDetail: () => void;
  onOpenReminder: () => void;
  actions: LeadActions;
}) {
  const cfg = STAGE_CONFIG[lead.stage];
  const palette = getAvatarPalette(lead.assignedTo);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenDetail();
        }
      }}
      className={cn(
        "rounded-lg border border-slate-200 shadow-sm border-l-4 p-3 cursor-pointer hover:shadow-md transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-amber-400",
        lead.dnc ? "border-l-red-400" : cfg.color,
        lead.stage === "Won" ? "bg-green-50" : "bg-white"
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="font-semibold text-sm text-slate-800 leading-tight">{lead.childName}</span>
          {lead.dnc && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200 shrink-0">
              DNC
            </span>
          )}
          {lead.sibling && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
              Sibling
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {lead.stageMessagePending && (
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
          <LeadActionMenu lead={lead} actions={actions} size="sm" />
        </div>
      </div>

      {/* Source badge */}
      <div className="mb-1.5">
        <span className={cn("inline-flex px-1.5 py-0.5 rounded text-xs font-medium", SOURCE_CONFIG[lead.source])}>
          {lead.source}
        </span>
      </div>

      {/* Year + subjects */}
      <p className="text-xs text-slate-500 mb-0.5">
        {lead.yearGroup} · {lead.subjects.join(", ")}
      </p>

      {/* Guardian */}
      <p className="text-xs text-slate-400 mb-2">{lead.guardian}</p>

      {/* Bottom row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
              palette.bg,
              palette.text
            )}
          >
            {getInitials(lead.assignedTo)}
          </div>
          <span className="text-xs text-slate-400">{lead.lastActivity}</span>
        </div>
        <span className="text-xs text-slate-400 font-medium">{lead.daysInStage}d</span>
      </div>
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
}: {
  stage: LeadStage;
  stageLeads: Lead[];
  onOpenDetail: (lead: Lead) => void;
  onOpenReminder: (lead: Lead) => void;
  onAddLead: (stage: LeadStage) => void;
  makeActions: (lead: Lead) => LeadActions;
}) {
  const cfg = STAGE_CONFIG[stage];

  return (
    <div className="flex flex-col shrink-0 w-[260px]">
      {/* Column header */}
      <div className={cn("flex items-center justify-between px-3 py-2 rounded-t-lg border border-b-0 border-slate-200", cfg.colBg)}>
        <span className={cn("font-semibold text-sm", cfg.headerText)}>{stage}</span>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", cfg.badge)}>
          {stageLeads.length}
        </span>
      </div>

      {/* Cards area */}
      <div
        className={cn(
          "flex flex-col gap-2 p-2 border border-t-0 border-slate-200 rounded-b-lg min-h-[120px] overflow-y-auto",
          cfg.colBg
        )}
        style={{ maxHeight: "calc(100vh - 280px)" }}
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
            />
          ))
        )}

        {/* Add ghost button */}
        <button
          type="button"
          onClick={() => onAddLead(stage)}
          className="flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-colors cursor-pointer mt-1"
        >
          <Plus className="w-3 h-3" />
          Add Lead
        </button>
      </div>
    </div>
  );
}

// ─── Lead Detail Dialog ───────────────────────────────────────────────────────

const DETAIL_TIMELINE = [
  { label: "Today", text: "Lead created via website form", dot: "bg-amber-400" },
  { label: "Yesterday", text: "Contacted by Sarah Thompson", dot: "bg-blue-400" },
  { label: "2 days ago", text: "Assessment booked for Sat 19 Apr", dot: "bg-purple-400" },
];

// ─── Embedded Team Chat (types, seed, component) ──────────────────────────────

const CHAT_STAFF = [
  "Jason Daswani",
  "Sarah Thompson",
  "Ahmed Khalil",
  "Tariq Al Nasser",
  "Hana Malik",
];
const CHAT_CURRENT_USER = "Jason Daswani";
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
};

const CHAT_LINK_CATALOGUE: { kind: ChatChipKind; label: string; ref: string; targetId?: string }[] = [
  { kind: "student", label: "Aisha Rahman", ref: "IMI-0001", targetId: "IMI-0001" },
  { kind: "student", label: "Omar Al-Farsi", ref: "IMI-0002", targetId: "IMI-0002" },
  { kind: "student", label: "Layla Hassan", ref: "IMI-0003", targetId: "IMI-0003" },
  { kind: "student", label: "Bilal Mahmood", ref: "IMI-L-0041", targetId: "IMI-0001" },
  { kind: "invoice", label: "Rahman · Term 3 Maths", ref: "INV-2416" },
  { kind: "invoice", label: "Al-Farsi · Assessment Pack", ref: "INV-2418" },
  { kind: "invoice", label: "Mahmood · Sibling Offer", ref: "INV-2422" },
  { kind: "task", label: "Prep Y7 Maths rubric", ref: "T-0112" },
  { kind: "task", label: "Confirm Sat assessment slot", ref: "T-0113" },
  { kind: "task", label: "Follow up on sibling discount", ref: "T-0114" },
];

const INITIAL_CHAT_BY_LEAD: Record<string, ChatMessage[]> = {
  "L-0041": [
    {
      id: "c-0041-1",
      author: "Jason Daswani",
      day: "17 Apr",
      time: "09:12",
      text: "Guardian called — very keen, looking for Y7 Maths starting this term. Mentioned sibling at another centre.",
      chips: [],
      reactions: { "👍": ["Sarah Thompson"] },
    },
    {
      id: "c-0041-2",
      author: "Sarah Thompson",
      day: "Yesterday",
      time: "14:30",
      text: "Sent intro WhatsApp. She replied, assessment confirmed for Saturday. Dad will attend too.",
      chips: [],
      reactions: {},
    },
    {
      id: "c-0041-3",
      author: "Jason Daswani",
      day: "Today",
      time: "08:05",
      text: "Reminder: bring assessment rubric for Y7 Maths. Check if sibling discount applies.",
      chips: [],
      reactions: {},
    },
  ],
  "L-0045": [
    {
      id: "c-0045-1",
      author: "Sarah Thompson",
      day: "17 Apr",
      time: "10:22",
      text: "Saif's mum prefers evening slots — Tues/Thurs ideally. Year 9 Science.",
      chips: [],
      reactions: {},
    },
    {
      id: "c-0045-2",
      author: "Jason Daswani",
      day: "Yesterday",
      time: "11:45",
      text: "@Sarah Thompson check Tariq Al Nasser's availability — he mentioned he could do Tues 17:00.",
      chips: [],
      reactions: { "✅": ["Sarah Thompson"] },
    },
    {
      id: "c-0045-3",
      author: "Ahmed Khalil",
      day: "Today",
      time: "09:00",
      text: "Intake form still pending. Will chase the guardian today.",
      chips: [],
      reactions: {},
    },
  ],
};

function getInitialChat(leadId: string): ChatMessage[] {
  return INITIAL_CHAT_BY_LEAD[leadId] ?? [];
}

let chatIdCounter = 0;
function nextChatId(prefix: string): string {
  chatIdCounter += 1;
  return `${prefix}-${chatIdCounter}`;
}

function formatMentionText(text: string): React.ReactNode {
  if (!text) return null;
  const parts: React.ReactNode[] = [];
  const regex = /@([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;
  while ((match = regex.exec(text)) !== null) {
    const candidate = match[1];
    const isKnown = CHAT_STAFF.some((n) => n === candidate || candidate.startsWith(n));
    if (!isKnown) continue;
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Use exact known name
    const known = CHAT_STAFF.find((n) => candidate.startsWith(n)) ?? candidate;
    parts.push(
      <span key={`m-${keyIdx++}`} className="font-semibold text-amber-600">
        @{known}
      </span>,
    );
    const consumed = match.index + 1 + known.length;
    lastIndex = consumed;
    regex.lastIndex = consumed;
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
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: Lead;
  onCreate: (chip: ChatChip) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CreateTaskDialogBody
          lead={lead}
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

const STAFF_GROUPS: { label: string; members: string[] }[] = [
  { label: "All Admins", members: ["Jason Daswani", "Sarah Thompson"] },
  { label: "Academic Team", members: ["Ahmed Khalil", "Tariq Al Nasser", "Hana Malik"] },
  { label: "All Staff", members: [...CHAT_STAFF] },
];

function CreateTaskDialogBody({
  lead,
  onCancel,
  onCreate,
}: {
  lead: Lead;
  onCancel: () => void;
  onCreate: (chip: ChatChip) => void;
}) {
  const defaultDue = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }, []);
  const [title, setTitle] = useState(`Follow up with ${lead.childName}`);
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [assignees, setAssignees] = useState<string[]>([CHAT_CURRENT_USER]);
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeBoxRef = useRef<HTMLDivElement>(null);
  const [dueDate, setDueDate] = useState(defaultDue);

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
    const q = assigneeQuery.trim().toLowerCase();
    return CHAT_STAFF.filter((name) => !q || name.toLowerCase().includes(q));
  }, [assigneeQuery]);

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
    taskStore.push(newTask);
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
                  <p className="px-3 py-2 text-xs text-slate-400">No staff match "{assigneeQuery}"</p>
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

function EmbeddedTeamChat({ lead }: { lead: Lead }) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialChat(lead.id));
  const [draft, setDraft] = useState("");
  const [draftChips, setDraftChips] = useState<ChatChip[]>([]);
  const [mentionMenu, setMentionMenu] = useState<{ open: boolean; query: string }>({ open: false, query: "" });
  const [hoverMsgId, setHoverMsgId] = useState<string | null>(null);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // close popovers on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-chat-popover]")) {
        setReactionPickerFor(null);
        setEmojiPickerOpen(false);
        setMentionMenu((cur) => (cur.open ? { open: false, query: "" } : cur));
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function sendMessage(args?: { extraChips?: ChatChip[]; autoText?: string }) {
    const text = (args?.autoText ?? draft).trim();
    const chips = [...draftChips, ...(args?.extraChips ?? [])];
    if (!text && chips.length === 0) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const id = nextChatId("c");
    setMessages((cur) => [
      ...cur,
      {
        id,
        author: CHAT_CURRENT_USER,
        day: "Today",
        time,
        text,
        chips,
        reactions: {},
      },
    ]);
    setDraft("");
    setDraftChips([]);
    setMentionMenu({ open: false, query: "" });
    setEmojiPickerOpen(false);
  }

  function handleDraftChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value;
    setDraft(v);
    const cursor = e.target.selectionStart ?? v.length;
    const before = v.slice(0, cursor);
    const match = /@([A-Za-z][A-Za-z ]{0,24})?$/.exec(before);
    if (match) {
      setMentionMenu({ open: true, query: (match[1] ?? "").toLowerCase() });
    } else {
      setMentionMenu({ open: false, query: "" });
    }
  }

  function insertMention(name: string) {
    const ta = textareaRef.current;
    const cursor = ta?.selectionStart ?? draft.length;
    const before = draft.slice(0, cursor);
    const after = draft.slice(cursor);
    const newBefore = before.replace(/@([A-Za-z][A-Za-z ]{0,24})?$/, `@${name} `);
    const newVal = newBefore + after;
    setDraft(newVal);
    setMentionMenu({ open: false, query: "" });
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const pos = newBefore.length;
        el.setSelectionRange(pos, pos);
      }
    });
  }

  function triggerMention() {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.focus();
    const cursor = ta.selectionStart ?? draft.length;
    const before = draft.slice(0, cursor);
    const after = draft.slice(cursor);
    const needsSpace = before.length > 0 && !/\s$/.test(before);
    const insert = `${needsSpace ? " " : ""}@`;
    const newVal = before + insert + after;
    setDraft(newVal);
    setMentionMenu({ open: true, query: "" });
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const pos = before.length + insert.length;
        el.setSelectionRange(pos, pos);
      }
    });
  }

  function insertEmojiIntoDraft(emoji: string) {
    const ta = textareaRef.current;
    const cursor = ta?.selectionStart ?? draft.length;
    const before = draft.slice(0, cursor);
    const after = draft.slice(cursor);
    setDraft(before + emoji + after);
    setEmojiPickerOpen(false);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const pos = before.length + emoji.length;
        el.setSelectionRange(pos, pos);
      }
    });
  }

  function toggleReaction(msgId: string, emoji: string) {
    setMessages((cur) =>
      cur.map((m) => {
        if (m.id !== msgId) return m;
        const users = m.reactions[emoji] ?? [];
        const had = users.includes(CHAT_CURRENT_USER);
        const nextUsers = had ? users.filter((u) => u !== CHAT_CURRENT_USER) : [...users, CHAT_CURRENT_USER];
        const nextReactions = { ...m.reactions };
        if (nextUsers.length === 0) delete nextReactions[emoji];
        else nextReactions[emoji] = nextUsers;
        return { ...m, reactions: nextReactions };
      }),
    );
    setReactionPickerFor(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      if (mentionMenu.open && filteredMentions.length > 0) {
        e.preventDefault();
        insertMention(filteredMentions[0]);
        return;
      }
      e.preventDefault();
      sendMessage();
    }
    if (e.key === "Escape") {
      setMentionMenu({ open: false, query: "" });
    }
  }

  const filteredMentions = mentionMenu.open
    ? CHAT_STAFF.filter((n) => n.toLowerCase().includes(mentionMenu.query))
    : [];

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
    const isOwn = m.author === CHAT_CURRENT_USER;
    rows.push(
      <div
        key={m.id}
        className="group relative flex gap-2 px-3 py-1"
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
              {formatMentionText(m.text)}
            </p>
          )}
          {Object.keys(m.reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(m.reactions).map(([emoji, users]) => {
                const own = users.includes(CHAT_CURRENT_USER);
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
      <div id="team-chat-panel" className="px-6 pt-4 pb-5 border-t border-slate-100 scroll-mt-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" /> Team Chat
            <span className="text-[10px] font-normal normal-case tracking-normal text-slate-400">
              · only visible to staff — not shared with parents
            </span>
          </p>
        </div>

        <div
          className="flex flex-col rounded-lg border border-slate-200 bg-slate-50/60 overflow-hidden"
          style={{ height: 420 }}
        >
          <div ref={scrollRef} className="flex-1 overflow-y-auto py-2">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center px-6 text-center">
                <p className="text-xs text-slate-400">
                  No messages yet. Start the conversation with the team.
                </p>
              </div>
            ) : (
              rows
            )}
          </div>

          {/* Draft attachment chips */}
          {draftChips.length > 0 && (
            <div className="px-3 pt-2 flex flex-wrap gap-1 border-t border-slate-200 bg-white">
              {draftChips.map((chip) => (
                <ChatChipPill
                  key={chip.id}
                  chip={chip}
                  onRemove={() => setDraftChips((cur) => cur.filter((c) => c.id !== chip.id))}
                />
              ))}
            </div>
          )}

          {/* Input + toolbar */}
          <div className="relative border-t border-slate-200 bg-white">
            {mentionMenu.open && filteredMentions.length > 0 && (
              <div
                data-chat-popover
                className="absolute bottom-full left-3 mb-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[200px]"
              >
                {filteredMentions.map((name) => {
                  const palette = getAvatarPalette(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => insertMention(name)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50 cursor-pointer"
                    >
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold",
                          palette.bg,
                          palette.text,
                        )}
                      >
                        {getInitials(name)}
                      </div>
                      <span className="text-sm text-slate-700">{name}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={handleDraftChange}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Message the team… Enter to send, Shift+Enter for a new line"
              className="w-full resize-none px-3 pt-2 pb-0 text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
            />
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-0.5">
                <ChatToolbarButton label="Attach file" onClick={handleAttach} icon={Paperclip} />
                <ChatToolbarButton label="Mention teammate" onClick={triggerMention} icon={AtSign} />
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
                          onClick={() => insertEmojiIntoDraft(e)}
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
                disabled={!draft.trim() && draftChips.length === 0}
                aria-label="Send message"
                className={cn(
                  "inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                  draft.trim() || draftChips.length > 0
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
    "w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-white shadow-sm hover:bg-amber-600 cursor-pointer transition-colors";
  const outlineClass =
    "flex-1 px-3 py-2 text-sm font-medium border border-slate-300 bg-white rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors";
  const linkClass =
    "text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer underline-offset-2 hover:underline";

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
        <button type="button" onClick={() => onSendInvoice(lead)} className={primaryClass}>
          Send Invoice →
        </button>
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
    return (
      <div className="w-full flex flex-col gap-2">
        <button type="button" onClick={() => onRecordPayment(lead)} className={primaryClass}>
          Mark as Paid →
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

  if (stage === "Paid") {
    if (canConvert && !isJourneyLead) {
      return (
        <div className="w-full">
          <button
            type="button"
            onClick={() => onConvert(lead)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 cursor-pointer transition-colors"
          >
            Convert to Student
          </button>
        </div>
      );
    }
    if (isJourneyLead && !journey.student) {
      return (
        <div className="w-full">
          <button type="button" onClick={() => onConvert(lead)} className={primaryClass}>
            Convert to Student
          </button>
        </div>
      );
    }
    if (isJourneyLead && journey.student) {
      return (
        <span className="inline-flex px-3 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
          Student record created — {journey.student.id}
        </span>
      );
    }
    return null;
  }

  // "Won" — terminal
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
}: {
  lead: Lead;
  onUpdatePrefs: (leadId: string, prefs: { preferredDays: string[]; preferredWindow: PreferredWindow }) => void;
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
      ) : (
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
      )}
    </div>
  );
}

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
}) {
  const journey = useJourney();
  const isJourneyLead = lead?.id === BILAL_LEAD_ID;
  const stageFooterRef = useRef<HTMLDivElement>(null);

  if (!lead) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-full" />
      </Dialog>
    );
  }

  const currentStage = lead.stage;
  const cfg = STAGE_CONFIG[currentStage];
  const palette = getAvatarPalette(lead.assignedTo);
  const next = nextStageOf(currentStage);
  const isTerminal = currentStage === "Won";
  const canConvert = currentStage === "Paid";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{lead.childName}</DialogTitle>
          <DialogDescription className="font-mono">{lead.ref}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">

        {followUpBanner && (
          <div className="px-6 pt-4">
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
          </div>
        )}

        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            <div>
              <p className="text-lg font-bold text-slate-800 leading-tight">{lead.childName}</p>
              <p className="text-xs text-slate-400 mt-0.5">{lead.department}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-0.5">Guardian</p>
              <p className="text-sm font-medium text-slate-700">{lead.guardian}</p>
              <p className="text-xs text-slate-500">{lead.guardianPhone}</p>
            </div>

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
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                  DNC
                </span>
              )}
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-1.5">Year Group & Subjects</p>
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

            <div>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                {lead.daysInPipeline}d in pipeline
              </span>
            </div>

            <LeadPreferencesSection lead={lead} onUpdatePrefs={onUpdatePrefs} />

            <div>
              <p className="text-xs text-slate-400 mb-1.5">Assigned to</p>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                    palette.bg,
                    palette.text,
                  )}
                >
                  {getInitials(lead.assignedTo)}
                </div>
                <span className="text-sm font-medium text-slate-700">{lead.assignedTo}</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">Stage</p>
              <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-semibold", cfg.badge)}>
                {currentStage}
              </span>
            </div>

            <div>
              <label htmlFor="lead-stage-select" className="block text-xs text-slate-400 mb-1.5 font-medium uppercase tracking-wide">
                Change stage
              </label>
              <select
                id="lead-stage-select"
                value={currentStage}
                onChange={(e) => {
                  const newStage = e.target.value as LeadStage;
                  if (newStage !== currentStage) onStageChange(lead, newStage);
                }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer bg-white"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={isTerminal || !next}
              onClick={() => {
                if (!next) return;
                onStageChange(lead, next);
              }}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
                !isTerminal && next
                  ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed",
              )}
            >
              {isTerminal ? (
                "Converted"
              ) : (
                <>
                  Move to next stage
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* TIMELINE */}
        <div className="px-6 pb-2">
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

        {isJourneyLead && (
          <div className="px-6 pb-4">
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

        <EmbeddedTeamChat key={lead.id} lead={lead} />

        </div>

        <DialogFooter className="flex flex-col items-stretch gap-3">
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
            <button
              type="button"
              onClick={() => onArchive(lead)}
              className="px-3 py-2 text-sm font-medium border border-red-200 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer transition-colors"
            >
              Archive Lead
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </DialogFooter>
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
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initialStage: LeadStage | null;
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
                {ASSIGNED_FILTER_OPTIONS.map((a) => (
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
            disabled={!canSave}
            onClick={() => {
              toast.success("Lead added successfully");
              onOpenChange(false);
            }}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
              canSave
                ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed",
            )}
          >
            Save Lead
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
  const { can } = usePermission();
  const [exportOpen, setExportOpen] = useState(false);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) return "list";
    return "kanban";
  });
  const [stageFilter, setStageFilter] = useState<string[]>([]);
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
  const [reminderLead, setReminderLead] = useState<Lead | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [archiveLead, setArchiveLead] = useState<Lead | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [moveStageLead, setMoveStageLead] = useState<Lead | null>(null);
  const [moveStageOpen, setMoveStageOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [addLeadStage, setAddLeadStage] = useState<LeadStage | null>(null);

  // Sort
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Pagination (list/table views)
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Segments
  const { segments, saveSegment, deleteSegment } = useSavedSegments("leads");
  const [savePopoverOpen, setSavePopoverOpen] = useState(false);

  const hasActiveFilters =
    stageFilter.length > 0 || sourceFilter.length > 0 ||
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
      if (l.id === BILAL_LEAD_ID) {
        return { ...base, stage: journey.leadStage, lastActivity: "Today" };
      }
      const override = leadStageOverrides[l.id];
      return override ? { ...base, stage: override, lastActivity: "Today" } : base;
    });
  }, [journey.leadStage, leadStageOverrides, leadPrefs]);

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

  // Revert a stage change. `assessmentIdToCancel` is set when the committed
  // change was a gated stage (Assessment/Trial Booked) that wrote a record
  // to the assessment store — we remove that record as part of the undo.
  function performUndo(
    lead: Lead,
    previousStage: LeadStage,
    assessmentIdToCancel: string | undefined,
  ) {
    dismissUndoToast();
    if (lead.id === BILAL_LEAD_ID) {
      journey.setStage(previousStage, "Jason Daswani");
    } else {
      setLeadStageOverrides((prev) => ({ ...prev, [lead.id]: previousStage }));
      setLeadActivity((prev) => ({
        ...prev,
        [lead.id]: [
          {
            label: "Just now",
            text: `Stage change undone — reverted to ${previousStage} by Jason Daswani`,
            dot: "bg-slate-400",
          },
          ...(prev[lead.id] ?? []),
        ],
      }));
    }
    if (assessmentIdToCancel) cancelAssessment(assessmentIdToCancel);
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
            onClick={() => performUndo(lead, previousStage, assessmentIdToCancel)}
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
      journey.setStage(newStage, "Jason Daswani");
    } else {
      setLeadStageOverrides((prev) => ({ ...prev, [lead.id]: newStage }));
      setLeadActivity((prev) => ({
        ...prev,
        [lead.id]: [
          {
            label: "Just now",
            text: `Stage changed to ${newStage} by Jason Daswani`,
            dot: "bg-slate-400",
          },
          ...(prev[lead.id] ?? []),
        ],
      }));
    }
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
    } else if (target === "Paid") {
      setRecordPaymentOpen(true);
    } else {
      applyStageChange(lead, target);
      setPendingGate(null);
    }
  }

  // Entry point for ALL stage-change intents (dropdown, Move-to-next button,
  // journey footer actions). Applies the skip-warning rule before routing.
  function commitStageChange(lead: Lead, newStage: LeadStage) {
    if (newStage === lead.stage) return;
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

  // Reset page when filters/view change
  useEffect(() => { setPage(1); }, [stageFilter, sourceFilter, deptFilter, assignedFilter, myLeads, view, createdOnRange]);

  // Keep the open detail lead in sync with journey overrides (Bilal's stage)
  useEffect(() => {
    setDetailLead((prev) => {
      if (!prev) return prev;
      const fresh = leads.find((l) => l.id === prev.id);
      return fresh && fresh.stage !== prev.stage ? fresh : prev;
    });
  }, [leads]);

  // Deep-link: open detail dialog if ?leadId= present (e.g. navigating from Tasks)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get("leadId");
    if (!id) return;
    const lead = leads.find((l) => l.id === id || l.ref === id);
    if (!lead) return;
    setDetailLead(lead);
    setDetailOpen(true);
    if (params.get("panel") === "chat") {
      window.setTimeout(() => {
        const el = document.getElementById("team-chat-panel");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  const filteredLeads = useMemo(() => {
    let data = leads.filter((l) => {
      if (stageFilter.length > 0 && !stageFilter.includes(l.stage)) return false;
      if (sourceFilter.length > 0 && !sourceFilter.includes(l.source)) return false;
      if (deptFilter.length > 0 && !deptFilter.includes(l.department)) return false;
      if (assignedFilter.length > 0 && !assignedFilter.includes(l.assignedTo)) return false;
      if (myLeads && l.assignedTo !== "Jason Daswani") return false;
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
  }, [leads, stageFilter, sourceFilter, deptFilter, assignedFilter, myLeads, searchQuery, sortField, sortDir, createdOnRange]);

  const paginatedLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLeads.slice(start, start + pageSize);
  }, [filteredLeads, page, pageSize]);

  function clearFilters() {
    setStageFilter([]);
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
    commitStageChange(lead, "Paid");
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
    const existing = [...studentsStore, ...Object.values(createdStudentsRef.current)];
    let max = 0;
    for (const s of existing) {
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
    studentsStore.push(newStudent);
    createdStudentsRef.current[lead.id] = newStudent;

    setLeadStageOverrides((prev) => ({ ...prev, [lead.id]: "Won" }));
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
      const idx = studentsStore.findIndex((s) => s.id === studentId);
      if (idx >= 0) studentsStore.splice(idx, 1);
      delete createdStudentsRef.current[leadId];
      // Revert stage
      setLeadStageOverrides((prev) => ({ ...prev, [leadId]: previousStage }));
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
    if (lead.id === BILAL_LEAD_ID) {
      setConvertOpen(true);
    } else {
      toast("Converting lead to student — coming soon");
    }
  }

  function makeActions(lead: Lead): LeadActions {
    return {
      onView: () => openDetail(lead),
      onEdit: () => toast("Edit lead — coming soon"),
      onMoveStage: () => openMoveStage(lead),
      onBookAssessment: () => handleBookAssessment(lead),
      onBookTrial: () => handleBookTrial(lead),
      onConvertToStudent: () => handleConvert(lead),
      onMarkLost: () => toast.success("Lead marked as Lost"),
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
    <div className="flex flex-col h-full min-h-0">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          28 active leads · 6 stages with pending action
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

        {/* View toggle */}
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

      {/* ── Kanban View ─────────────────────────────────────────────────── */}
      {view === "kanban" && (
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-0 flex-1 -mx-6 px-6">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              stageLeads={filteredLeads.filter((l) => l.stage === stage)}
              onOpenDetail={openDetail}
              onOpenReminder={openReminder}
              onAddLead={(s) => openAddLead(s)}
              makeActions={makeActions}
            />
          ))}
        </div>
      )}

      {/* ── List View ───────────────────────────────────────────────────── */}
      {view === "list" && (
        <div className="flex-1 overflow-auto">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <SortableHeader label="Lead"          field="childName"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Guardian"      field="guardian"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Year"          field="yearGroup"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Subject(s)</th>
                  <SortableHeader label="Source"        field="source"         sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Stage"         field="stage"          sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Assigned"      field="assignedTo"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Last Activity" field="lastActivity"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                  <SortableHeader label="Days"          field="daysInPipeline" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" />
                  <th className="w-12 px-4 py-3" />
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
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-tight">{lead.childName}</p>
                            <p className="text-xs text-slate-400 font-mono">{lead.ref}</p>
                          </div>
                          {lead.dnc && (
                            <span className="ml-1 px-1.5 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                              DNC
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700 whitespace-nowrap">{lead.guardian}</p>
                        <p className="text-xs text-slate-400">{lead.guardianPhone}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                          {lead.yearGroup}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {lead.subjects.map((s) => (
                            <span key={s} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", SOURCE_CONFIG[lead.source])}>
                          {lead.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", cfg.badge)}>
                          {lead.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                            palette.bg,
                            palette.text
                          )}
                          title={lead.assignedTo}
                        >
                          {getInitials(lead.assignedTo)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{lead.lastActivity}</td>
                      <td className="px-4 py-3 text-sm text-slate-500 text-center">{lead.daysInPipeline}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <LeadActionMenu lead={lead} actions={makeActions(lead)} />
                      </td>
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
                        <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap", cfg.badge)}>
                          {lead.stage}
                        </span>
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
      />
      <NeedsMoreTimeDialog
        open={needsMoreTimeOpen}
        onOpenChange={setNeedsMoreTimeOpen}
        lead={needsMoreTimeLead}
        currentStage={needsMoreTimeStage}
        onCreated={({ assignee, dueLabel }) => {
          if (needsMoreTimeLead) {
            recordLeadActivity(needsMoreTimeLead, {
              label: "Just now",
              text: `Follow-up task created — ${assignee} · due ${dueLabel}`,
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
        onAutoConvert={(lead, payment) => {
          const result = handlePaidAutoConvert(lead, payment);
          setPendingGate(null);
          return result;
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
        onOpenChange={setConvertOpen}
        lead={detailLead}
        onOpenCreateEnrolment={() => setCreateEnrolmentOpen(true)}
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
    </div>
  );
}
