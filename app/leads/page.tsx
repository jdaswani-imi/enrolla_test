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
} from "lucide-react";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { SortableHeader } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useSavedSegments } from "@/hooks/use-saved-segments";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { ExportDialog } from "@/components/ui/export-dialog";
import { leads, type Lead, type LeadStage, type LeadSource } from "@/lib/mock-data";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGES: LeadStage[] = [
  "New",
  "Contacted",
  "Assessment Booked",
  "Assessment Done",
  "Trial Booked",
  "Schedule Offered",
  "Invoice Sent",
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
  "Schedule Offered": {
    color: "border-l-orange-400",
    badge: "bg-orange-100 text-orange-700",
    colBg: "bg-orange-50/40",
    headerText: "text-orange-700",
  },
  "Invoice Sent": {
    color: "border-l-teal-400",
    badge: "bg-teal-100 text-teal-700",
    colBg: "bg-teal-50/40",
    headerText: "text-teal-700",
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

  const canConvert = lead.stage === "Trial Booked" || lead.stage === "Assessment Done";

  const items: { icon: React.ElementType; label: string; onClick: () => void; hidden?: boolean; danger?: boolean }[] = [
    { icon: Eye, label: "View", onClick: actions.onView },
    { icon: Edit3, label: "Edit Lead", onClick: actions.onEdit },
    { icon: MoveRight, label: "Move Stage", onClick: actions.onMoveStage },
    { icon: BookOpen, label: "Book Assessment", onClick: actions.onBookAssessment },
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

type InternalNote = { id: string; author: string; time: string; text: string };

const INITIAL_INTERNAL_NOTES: InternalNote[] = [
  {
    id: "n1",
    author: "Jason Daswani",
    time: "2 days ago",
    text: "Guardian called — very keen, looking for Y7 Maths starting this term. Mentioned sibling at another centre.",
  },
  {
    id: "n2",
    author: "Sarah Thompson",
    time: "Yesterday",
    text: "Sent intro WhatsApp. She replied, assessment confirmed for Saturday. Dad will attend too.",
  },
  {
    id: "n3",
    author: "Jason Daswani",
    time: "Today",
    text: "Reminder: bring assessment rubric for Y7 Maths. Check if sibling discount applies.",
  },
];

type LeadTeamChatMessage = { author: string; time: string; text: string };

function buildLeadTeamChat(lead: Lead): LeadTeamChatMessage[] {
  const firstName = lead.childName.split(" ")[0];
  return [
    {
      author: "Sarah Thompson",
      time: "09:12",
      text:
        lead.stage === "New" || lead.stage === "Contacted"
          ? `New enquiry for ${firstName} — I'll pick up the intro call today.`
          : lead.stage === "Trial Booked" || lead.stage === "Assessment Done" || lead.stage === "Assessment Booked"
          ? `${firstName}'s assessment is locked in. Prep pack sent to the teacher.`
          : `Still chasing ${firstName}'s guardian — left a voicemail this morning.`,
    },
    {
      author: "Ahmed Khalil",
      time: "09:34",
      text: `Noted. Flagging ${firstName} in #leads-pipeline so the team has eyes on it.`,
    },
  ];
}

function LeadDetailDialog({
  lead,
  open,
  onOpenChange,
  onBookAssessment,
  onConvert,
  onArchive,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onBookAssessment: (lead: Lead) => void;
  onConvert: (lead: Lead) => void;
  onArchive: (lead: Lead) => void;
}) {
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState<LeadStage | null>(null);
  const [notes, setNotes] = useState<InternalNote[]>(INITIAL_INTERNAL_NOTES);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    if (lead) {
      setCurrentStage(lead.stage);
      setNotes(INITIAL_INTERNAL_NOTES);
      setNoteDraft("");
    }
  }, [lead]);

  if (!lead || !currentStage) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl w-full" />
      </Dialog>
    );
  }

  function postNote() {
    const text = noteDraft.trim();
    if (!text) return;
    setNotes((cur) => [
      ...cur,
      {
        id: `n-${Date.now()}`,
        author: "Jason Daswani",
        time: "Just now",
        text,
      },
    ]);
    setNoteDraft("");
  }

  const cfg = STAGE_CONFIG[currentStage];
  const palette = getAvatarPalette(lead.assignedTo);
  const next = nextStageOf(currentStage);
  const canConvert = currentStage === "Trial Booked" || currentStage === "Assessment Done";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-full max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{lead.childName}</DialogTitle>
          <DialogDescription className="font-mono">{lead.ref}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">

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
                  setCurrentStage(newStage);
                  toast.success(`Stage changed to ${newStage}`);
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
              disabled={!next}
              onClick={() => {
                if (!next) return;
                setCurrentStage(next);
                toast.success(`Lead moved to ${next}`);
              }}
              className={cn(
                "w-full flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
                next
                  ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed",
              )}
            >
              Move to next stage
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TIMELINE */}
        <div className="px-6 pb-2">
          <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">Activity Timeline</p>
          <div className="space-y-3">
            {DETAIL_TIMELINE.map((entry, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn("w-2.5 h-2.5 rounded-full mt-1 shrink-0", entry.dot)} />
                  {i < DETAIL_TIMELINE.length - 1 && (
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

        {/* TEAM CHAT PREVIEW */}
        <div className="px-6 pt-4 pb-2 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Team Chat
            </p>
            <span className="text-[10px] text-slate-400">#leads-pipeline</span>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 divide-y divide-slate-200">
            {buildLeadTeamChat(lead).map((m, i) => {
              const palette = getAvatarPalette(m.author);
              return (
                <div key={i} className="flex gap-2 px-3 py-2">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      palette.bg,
                      palette.text,
                    )}
                  >
                    {getInitials(m.author)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-semibold text-slate-700">{m.author}</span>
                      <span className="text-[10px] text-slate-400">· {m.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-snug mt-0.5">{m.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => router.push("/automations?tab=Internal%20Messages&channel=leads-pipeline")}
            className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-700 cursor-pointer inline-flex items-center gap-1 transition-colors"
          >
            View full conversation <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* INTERNAL NOTES */}
        <div className="px-6 py-5 border-t border-slate-100">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Internal Notes</p>
          <p className="text-xs text-slate-400 mb-3">Only visible to staff — not shared with parents</p>

          <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 divide-y divide-slate-200">
            {notes.map((n) => {
              const palette = getAvatarPalette(n.author);
              return (
                <div key={n.id} className="flex gap-3 px-3 py-2.5">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      palette.bg,
                      palette.text,
                    )}
                  >
                    {getInitials(n.author)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-slate-700">{n.author}</span>
                      <span className="text-xs text-slate-400">· {n.time}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-snug mt-0.5 whitespace-pre-wrap">{n.text}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3">
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Add a note for your team..."
              rows={2}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                disabled={!noteDraft.trim()}
                onClick={postNote}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors",
                  noteDraft.trim()
                    ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed",
                )}
              >
                Post Note
              </button>
            </div>
          </div>
        </div>

        </div>

        <DialogFooter className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => onBookAssessment(lead)}
            className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors"
          >
            Book Assessment
          </button>
          {canConvert && (
            <button
              type="button"
              onClick={() => onConvert(lead)}
              className="px-3 py-2 text-sm font-medium border border-amber-300 bg-amber-50 rounded-lg hover:bg-amber-100 text-amber-700 cursor-pointer transition-colors"
            >
              Convert to Student
            </button>
          )}
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
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
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
              if (!stage) return;
              toast.success(`Lead moved to ${stage}`);
              onOpenChange(false);
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
    deptFilter.length > 0 || assignedFilter.length > 0 || myLeads || searchQuery !== "";

  // Reset page when filters/view change
  useEffect(() => { setPage(1); }, [stageFilter, sourceFilter, deptFilter, assignedFilter, myLeads, view]);

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
  }, [stageFilter, sourceFilter, deptFilter, assignedFilter, myLeads, sortField, sortDir]);

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

  function makeActions(lead: Lead): LeadActions {
    return {
      onView: () => openDetail(lead),
      onEdit: () => toast("Edit lead — coming soon"),
      onMoveStage: () => openMoveStage(lead),
      onBookAssessment: () => toast("Opening assessment booking..."),
      onConvertToStudent: () => toast("Converting lead to student — coming soon"),
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
        onBookAssessment={() => toast("Opening assessment booking...")}
        onConvert={() => toast("Converting lead to student — coming soon")}
        onArchive={(l) => openArchive(l)}
      />
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
      />
    </div>
  );
}
