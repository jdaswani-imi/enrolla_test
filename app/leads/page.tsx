"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  LayoutGrid,
  List,
  Table2,
  ChevronDown,
  MoreHorizontal,
  Bell,
  Plus,
  X,
  MoveRight,
  StickyNote,
  XCircle,
  Archive,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { leads, type Lead, type LeadStage, type LeadSource } from "@/lib/mock-data";

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

const STAGE_FILTERS = ["All", ...STAGES];
const SOURCE_FILTERS: string[] = ["All", "Website", "Phone", "Walk-in", "Referral", "Event"];
const DEPT_FILTERS = ["All", "Primary", "Lower Secondary", "Senior"];
const ASSIGNED_FILTERS = ["All", "Jason Daswani", "Sarah Admin"];

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

// ─── FilterDropdown ───────────────────────────────────────────────────────────

function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const active = value !== "All";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer",
          active
            ? "bg-amber-50 border-amber-300 text-amber-800"
            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        )}
      >
        {active ? `${label}: ${value}` : label}
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[160px]">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer",
                value === opt
                  ? "bg-amber-50 text-amber-800 font-medium"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── KanbanCard ───────────────────────────────────────────────────────────────

function KanbanCard({ lead }: { lead: Lead }) {
  const cfg = STAGE_CONFIG[lead.stage];
  const palette = getAvatarPalette(lead.assignedTo);

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 shadow-sm border-l-4 p-3 cursor-pointer hover:shadow-md transition-shadow",
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
            <Bell className="w-3.5 h-3.5 text-amber-500" />
          )}
          <button className="p-0.5 rounded hover:bg-slate-100 transition-colors cursor-pointer">
            <MoreHorizontal className="w-3.5 h-3.5 text-slate-400" />
          </button>
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

function KanbanColumn({ stage, stageLeads }: { stage: LeadStage; stageLeads: Lead[] }) {
  const cfg = STAGE_CONFIG[stage];

  return (
    <div className="flex flex-col shrink-0 w-[280px]">
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
          stageLeads.map((lead) => <KanbanCard key={lead.id} lead={lead} />)
        )}

        {/* Add ghost button */}
        <button className="flex items-center justify-center gap-1 py-2 rounded-lg border border-dashed border-slate-300 text-xs text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-colors cursor-pointer mt-1">
          <Plus className="w-3 h-3" />
          Add Lead
        </button>
      </div>
    </div>
  );
}

// ─── Slideover ────────────────────────────────────────────────────────────────

const MOCK_STAGE_HISTORY = [
  { stage: "New", date: "1 Apr", note: "Lead created via website enquiry" },
  { stage: "Contacted", date: "3 Apr", note: "Called guardian — interested in the programme" },
  { stage: "Assessment Booked", date: "6 Apr", note: "Assessment scheduled for 10 Apr" },
];

function Slideover({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [note, setNote] = useState("");
  const cfg = STAGE_CONFIG[lead.stage];

  return (
    <>
      {/* Overlay */}
      <div className="fade-in fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      {/* Panel */}
      <div className="slide-in-right fixed right-0 top-0 h-full w-[480px] bg-white z-50 shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white">
          <div>
            <p className="text-xs text-slate-400 font-mono">{lead.ref}</p>
            <h2 className="text-lg font-bold text-slate-800">{lead.childName}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 px-6 py-4 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Year Group</p>
              <p className="text-sm font-medium text-slate-700">{lead.yearGroup}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Department</p>
              <p className="text-sm font-medium text-slate-700">{lead.department}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Guardian</p>
              <p className="text-sm font-medium text-slate-700">{lead.guardian}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Phone</p>
              <p className="text-sm font-medium text-slate-700">{lead.guardianPhone}</p>
            </div>
          </div>

          {/* Stage */}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Current Stage</p>
            <span className={cn("inline-flex px-2.5 py-1 rounded-full text-xs font-semibold", cfg.badge)}>
              {lead.stage}
            </span>
          </div>

          {/* Subjects */}
          <div>
            <p className="text-xs text-slate-400 mb-1.5">Subject Interest</p>
            <div className="flex flex-wrap gap-1.5">
              {lead.subjects.map((s) => (
                <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs rounded-full font-medium">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Stage history */}
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Stage History</p>
            <div className="space-y-3">
              {MOCK_STAGE_HISTORY.map((entry, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-400 mt-1 shrink-0" />
                    {i < MOCK_STAGE_HISTORY.length - 1 && (
                      <div className="w-px flex-1 bg-slate-200 mt-1" />
                    )}
                  </div>
                  <div className="pb-3 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-slate-700">{entry.stage}</span>
                      <span className="text-xs text-slate-400">{entry.date}</span>
                    </div>
                    <p className="text-xs text-slate-500">{entry.note}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">Add Note</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Type a note..."
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
            <button className="mt-2 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer">
              Save Note
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── ActionMenu ───────────────────────────────────────────────────────────────

function ActionMenu({ lead, onView }: { lead: Lead; onView: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const actions: { icon: React.ElementType; label: string; onClick: () => void }[] = [
    { icon: Eye, label: "View", onClick: onView },
    { icon: MoveRight, label: "Move Stage", onClick: () => {} },
    { icon: StickyNote, label: "Log Note", onClick: () => {} },
    { icon: XCircle, label: "Mark Lost", onClick: () => {} },
    { icon: Archive, label: "Archive", onClick: () => {} },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
          {actions.map(({ icon: Icon, label, onClick }) => (
            <button
              key={label}
              onClick={() => { onClick(); setOpen(false); }}
              className={cn(
                "w-full text-left flex items-center gap-2 px-3 py-1.5 text-sm transition-colors cursor-pointer",
                label === "Mark Lost" || label === "Archive"
                  ? "text-red-600 hover:bg-red-50"
                  : "text-slate-700 hover:bg-slate-50"
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

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewMode = "kanban" | "list" | "table";

export default function LeadsPage() {
  const [view, setView] = useState<ViewMode>("kanban");
  const [stageFilter, setStageFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [assignedFilter, setAssignedFilter] = useState("All");
  const [myLeads, setMyLeads] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const hasActiveFilters =
    stageFilter !== "All" ||
    sourceFilter !== "All" ||
    deptFilter !== "All" ||
    assignedFilter !== "All" ||
    myLeads;

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (stageFilter !== "All" && l.stage !== stageFilter) return false;
      if (sourceFilter !== "All" && l.source !== sourceFilter) return false;
      if (deptFilter !== "All" && l.department !== deptFilter) return false;
      if (assignedFilter !== "All" && l.assignedTo !== assignedFilter) return false;
      if (myLeads && l.assignedTo !== "Jason Daswani") return false;
      return true;
    });
  }, [stageFilter, sourceFilter, deptFilter, assignedFilter, myLeads]);

  function clearFilters() {
    setStageFilter("All");
    setSourceFilter("All");
    setDeptFilter("All");
    setAssignedFilter("All");
    setMyLeads(false);
  }

  const viewButtons: { key: ViewMode; Icon: React.ElementType; label: string }[] = [
    { key: "kanban", Icon: LayoutGrid, label: "Kanban" },
    { key: "list", Icon: List, label: "List" },
    { key: "table", Icon: Table2, label: "Table" },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Page Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          28 active leads · 6 stages with pending action
        </p>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer shadow-sm">
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* ── Filter & View Bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <FilterDropdown label="Stage" value={stageFilter} options={STAGE_FILTERS} onChange={setStageFilter} />
          <FilterDropdown label="Source" value={sourceFilter} options={SOURCE_FILTERS} onChange={setSourceFilter} />
          <FilterDropdown label="Department" value={deptFilter} options={DEPT_FILTERS} onChange={setDeptFilter} />
          <FilterDropdown label="Assigned to" value={assignedFilter} options={ASSIGNED_FILTERS} onChange={setAssignedFilter} />

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
            <button
              onClick={clearFilters}
              className="text-xs text-slate-500 hover:text-amber-600 underline cursor-pointer transition-colors"
            >
              Clear filters
            </button>
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
        <div className="flex gap-3 overflow-x-auto pb-4 min-h-0 flex-1">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              stageLeads={filteredLeads.filter((l) => l.stage === stage)}
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
                  {["Lead", "Guardian", "Year", "Subject(s)", "Source", "Stage", "Assigned", "Last Activity", "Days", ""].map((h) => (
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
                {filteredLeads.map((lead) => {
                  const cfg = STAGE_CONFIG[lead.stage];
                  const palette = getAvatarPalette(lead.assignedTo);
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
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
                        <ActionMenu lead={lead} onView={() => setSelectedLead(lead)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredLeads.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-sm">No leads match the current filters.</div>
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
                  {["Child Name", "Year", "Stage", "Source", "Assigned", "Last Activity", "Days"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-2.5 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => {
                  const cfg = STAGE_CONFIG[lead.stage];
                  const palette = getAvatarPalette(lead.assignedTo);
                  return (
                    <tr
                      key={lead.id}
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
              <div className="py-10 text-center text-slate-400 text-sm">No leads match the current filters.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Slide-over ──────────────────────────────────────────────────── */}
      {selectedLead && (
        <Slideover lead={selectedLead} onClose={() => setSelectedLead(null)} />
      )}
    </div>
  );
}
