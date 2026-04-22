"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Plus,
  Send,
  Star,
  X,
} from "lucide-react";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { DateRangePicker, DATE_PRESETS, type DateRange } from "@/components/ui/date-range-picker";
import { SortableHeader } from "@/components/ui/sortable-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import {
  announcements,
  complaintTickets,
  surveyResponses,
  surveyPending,
  type Announcement,
  type AnnouncementType,
  type AnnouncementStatus,
  type ComplaintTicket,
  type ComplaintStatus,
  type SurveyResponse,
  type SurveyType,
} from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "red" | "amber" | "green" | "slate";
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col gap-1",
        accent === "red"   && "border-l-4 border-l-red-400",
        accent === "amber" && "border-l-4 border-l-amber-400",
        accent === "green" && "border-l-4 border-l-emerald-400",
        accent === "slate" && "border-l-4 border-l-slate-300",
      )}
    >
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={cn(
        "text-xl font-bold",
        accent === "red"   ? "text-red-600"      : "",
        accent === "amber" ? "text-amber-600"    : "",
        accent === "green" ? "text-emerald-600"  : "",
        !accent || accent === "slate" ? "text-slate-800" : "",
      )}>
        {value}
      </p>
    </div>
  );
}

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "w-3.5 h-3.5",
            n <= score ? "fill-amber-400 text-amber-400" : "text-slate-200"
          )}
        />
      ))}
    </div>
  );
}

// ─── Status configs ────────────────────────────────────────────────────────────

const ANN_TYPE_CONFIG: Record<AnnouncementType, string> = {
  "Pre-session":  "bg-blue-100 text-blue-700",
  "Post-session": "bg-emerald-100 text-emerald-700",
};

const ANN_STATUS_CONFIG: Record<AnnouncementStatus, string> = {
  Draft:              "bg-slate-100 text-slate-600",
  "Pending Approval": "bg-amber-100 text-amber-700",
  Sent:               "bg-emerald-100 text-emerald-700",
};

const COMPLAINT_STATUS_CONFIG: Record<ComplaintStatus, string> = {
  New:           "bg-red-100 text-red-700",
  Investigating: "bg-amber-100 text-amber-700",
  Resolved:      "bg-emerald-100 text-emerald-700",
  Escalated:     "bg-orange-100 text-orange-700",
  Closed:        "bg-slate-100 text-slate-500",
};

const SURVEY_TYPE_CONFIG: Record<SurveyType, string> = {
  "Mid-term":        "bg-blue-100 text-blue-700",
  "End of term":     "bg-emerald-100 text-emerald-700",
  "Post-trial":      "bg-amber-100 text-amber-700",
  "Post-withdrawal": "bg-slate-100 text-slate-600",
  Manual:            "bg-violet-100 text-violet-700",
};

// ─── Tab 1 — Announcements ────────────────────────────────────────────────────

function ViewAnnouncementModal({
  announcement,
  onClose,
}: {
  announcement: Announcement;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-800">{announcement.title}</DialogTitle>
          <p className="text-xs text-slate-400 mt-0.5">{announcement.type} · {announcement.audience}</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Created By</p>
              <p className="font-medium text-slate-800">{announcement.createdBy}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Send Date</p>
              <p className="text-slate-700">{announcement.sendDate}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Status</p>
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", ANN_STATUS_CONFIG[announcement.status])}>
                {announcement.status}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Audience</p>
              <p className="text-slate-700">{announcement.audience}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Message</p>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
              {announcement.message || <span className="text-slate-400 italic">No message content.</span>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-slate-200 bg-white text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewAnnouncementSlideover({ onClose }: { onClose: () => void }) {
  const [title, setTitle]       = useState("");
  const [type, setType]         = useState<AnnouncementType>("Pre-session");
  const [audience, setAudience] = useState("Tenant-wide");
  const [message, setMessage]   = useState("");
  const [sendNow, setSendNow]   = useState(false);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[640px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-800">New Announcement</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block" htmlFor="ann-title">Title</label>
            <input
              id="ann-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mock Exam Preparation — Y11 Physics"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium mb-2">Type</p>
            <div className="flex gap-3">
              {(["Pre-session", "Post-session"] as AnnouncementType[]).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={type === t}
                    onChange={() => setType(t)}
                    className="accent-amber-500"
                  />
                  <span className="text-sm text-slate-700">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block" htmlFor="ann-audience">Audience</label>
            <select
              id="ann-audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent cursor-pointer"
            >
              <option>Tenant-wide</option>
              <option>Department</option>
              <option>Class Group</option>
              <option>Specific Students</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block" htmlFor="ann-message">Message</label>
            <textarea
              id="ann-message"
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your announcement here…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>

          <button className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 text-slate-400 text-sm rounded-lg w-full justify-center cursor-pointer hover:border-slate-400 hover:text-slate-500 transition-colors">
            <Plus className="w-4 h-4" />
            Attach — Phase 2
          </button>

          <div className="flex items-center justify-between py-2 border-t border-slate-100 mt-2">
            <div>
              <p className="text-sm font-medium text-slate-700">Send immediately</p>
              <p className="text-xs text-slate-400">Skip approval and send now</p>
            </div>
            <button
              onClick={() => setSendNow(!sendNow)}
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors cursor-pointer",
                sendNow ? "bg-amber-500" : "bg-slate-200"
              )}
            >
              <span className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                sendNow ? "translate-x-5" : "translate-x-0.5"
              )} />
            </button>
          </div>
        </div>

        <DialogFooter className="flex items-center gap-3">
          <button className="flex-1 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer">
            Submit for Approval
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Cancel
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementsTab() {
  const [typeFilter, setTypeFilter]     = useState<string[]>([]);
  const [deptFilter, setDeptFilter]     = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRange, setDateRange]       = useState<DateRange>({ from: null, to: null });
  const [newOpen, setNewOpen]           = useState(false);
  const [approvedIds, setApprovedIds]   = useState<Set<string>>(new Set());
  const [viewingAnn, setViewingAnn]     = useState<Announcement | null>(null);

  const rows = useMemo(
    () => announcements.map((a) => ({
      ...a,
      status: approvedIds.has(a.id) ? ("Sent" as AnnouncementStatus) : a.status,
    })),
    [approvedIds],
  );

  const filtered = useMemo(() => rows.filter((a) => {
    if (typeFilter.length > 0 && !typeFilter.includes(a.type))       return false;
    if (statusFilter.length > 0 && !statusFilter.includes(a.status)) return false;
    return true;
  }), [rows, typeFilter, deptFilter, statusFilter]);

  function handleApprove(id: string) {
    setApprovedIds((prev) => new Set(prev).add(id));
    toast.success("Announcement approved");
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectFilter label="Type"       options={["Pre-session", "Post-session"]}          selected={typeFilter}   onChange={setTypeFilter}   />
        <MultiSelectFilter label="Department" options={["Primary", "Lower Secondary", "Senior"]} selected={deptFilter}   onChange={setDeptFilter}   />
        <MultiSelectFilter label="Status"     options={["Draft", "Pending Approval", "Sent"]}    selected={statusFilter} onChange={setStatusFilter} />
        <DateRangePicker value={dateRange} onChange={setDateRange} presets={DATE_PRESETS} placeholder="Send date" />
        {(typeFilter.length > 0 || deptFilter.length > 0 || statusFilter.length > 0) && (
          <button
            onClick={() => { setTypeFilter([]); setDeptFilter([]); setStatusFilter([]); }}
            className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />Clear
          </button>
        )}
        <div className="ml-auto">
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />New Announcement
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["Title", "Type", "Audience", "Created By", "Send Date", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-default">
                  <td className="px-4 py-3 font-medium text-slate-800 text-sm max-w-[200px] truncate">{a.title}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", ANN_TYPE_CONFIG[a.type])}>
                      {a.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{a.audience}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{a.createdBy}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{a.sendDate}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", ANN_STATUS_CONFIG[a.status])}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {a.status === "Pending Approval" ? (
                      <button
                        onClick={() => handleApprove(a.id)}
                        className="px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        onClick={() => setViewingAnn(a)}
                        className="px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState icon={Bell} title="No announcements found" description="No announcements match your current filters." />
          )}
        </div>
      </div>

      {newOpen && <NewAnnouncementSlideover onClose={() => setNewOpen(false)} />}
      {viewingAnn && <ViewAnnouncementModal announcement={viewingAnn} onClose={() => setViewingAnn(null)} />}
    </div>
  );
}

// ─── Tab 2 — Concerns & Tickets ───────────────────────────────────────────────

const SEVERITY_WEIGHT: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

function TicketSlideover({ ticket, onClose }: { ticket: ComplaintTicket; onClose: () => void }) {
  const { can } = usePermission();
  const signedCount = ticket.signOffs.filter((s) => s.timestamp !== null).length;
  const isResolved  = signedCount === 2;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[640px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono font-bold text-slate-800 text-base">{ticket.id}</span>
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", COMPLAINT_STATUS_CONFIG[ticket.status])}>
              {ticket.status}
            </span>
            <span className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold",
              ticket.severity === "High"   ? "bg-red-100 text-red-700"     : "",
              ticket.severity === "Medium" ? "bg-amber-100 text-amber-700" : "",
              ticket.severity === "Low"    ? "bg-slate-100 text-slate-600"  : "",
            )}>
              {ticket.severity}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Student</p>
              <p className="font-medium text-slate-800">{ticket.student}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Guardian</p>
              <p className="text-slate-700">{ticket.guardianName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Category</p>
              <p className="text-slate-700">{ticket.category}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Date Raised</p>
              <p className="text-slate-700">{ticket.createdDate}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Description</p>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
              {ticket.description}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Linked Tickets</p>
            {ticket.linkedTickets.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No linked tickets.</p>
            ) : (
              <div className="space-y-2">
                {ticket.linkedTickets.map((lt) => (
                  <div key={lt.id} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{lt.description}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{lt.assignee} · Due {lt.dueDate}</p>
                    </div>
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ml-3",
                      lt.status === "Done"        ? "bg-emerald-100 text-emerald-700" : "",
                      lt.status === "In Progress" ? "bg-amber-100 text-amber-700"    : "",
                      lt.status === "Open"        ? "bg-slate-100 text-slate-600"     : "",
                    )}>
                      {lt.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Sign-offs</p>
            {isResolved && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="text-sm font-semibold text-emerald-700">Resolved — both sign-offs complete</span>
              </div>
            )}
            <div className="space-y-2">
              {ticket.signOffs.map((so, i) => (
                <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Sign-off {i + 1}: {so.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{so.role}</p>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ml-3",
                    so.timestamp ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                  )}>
                    {so.timestamp ?? "Awaiting"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Escalation Log</p>
            {ticket.escalationLog.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No events logged.</p>
            ) : (
              <div className="space-y-2">
                {ticket.escalationLog.map((ev, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-slate-700">{ev.event}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{ev.actor} · {ev.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center gap-2 flex-wrap">
          {can('feedback.resolveComplaint') && (
            <button
              disabled={signedCount >= 2}
              className={cn(
                "flex-1 min-w-0 px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer",
                signedCount < 2
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              Add Sign-off
            </button>
          )}
          {can('feedback.resolveComplaint') && (
            <button className="px-4 py-2 border border-orange-200 text-orange-700 bg-orange-50 text-sm font-medium rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
              Escalate
            </button>
          )}
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConcernsTicketsTab() {
  const [catFilter, setCatFilter]           = useState<string[]>([]);
  const [statusFilter, setStatusFilter]     = useState<string[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string[]>([]);
  const [assignFilter, setAssignFilter]     = useState<string[]>([]);
  const [selected, setSelected]             = useState<ComplaintTicket | null>(null);
  const [sortField, setSortField]           = useState<string | null>(null);
  const [sortDir, setSortDir]               = useState<"asc" | "desc">("asc");

  function toggleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  const assignees = [...new Set(complaintTickets.map((t) => t.assignedTo))];

  const filtered = useMemo(() => {
    let data = complaintTickets.filter((t) => {
      if (catFilter.length > 0 && !catFilter.includes(t.category))           return false;
      if (statusFilter.length > 0 && !statusFilter.includes(t.status))       return false;
      if (severityFilter.length > 0 && !severityFilter.includes(t.severity)) return false;
      if (assignFilter.length > 0 && !assignFilter.includes(t.assignedTo))   return false;
      return true;
    });
    if (sortField) {
      data = [...data].sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sortField];
        const bv = (b as unknown as Record<string, unknown>)[sortField];
        if (sortField === "severity") {
          const wa = SEVERITY_WEIGHT[String(av ?? "")] ?? 0;
          const wb = SEVERITY_WEIGHT[String(bv ?? "")] ?? 0;
          return sortDir === "asc" ? wb - wa : wa - wb;
        }
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [catFilter, statusFilter, severityFilter, assignFilter, sortField, sortDir]);

  const hasFilters = catFilter.length > 0 || statusFilter.length > 0 || severityFilter.length > 0 || assignFilter.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Open Tickets"        value="4"  accent="red"   />
        <StatCard label="Under Investigation" value="2"  accent="amber" />
        <StatCard label="Resolved This Term"  value="11" accent="green" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectFilter
          label="Category"
          options={["Teaching Quality", "Administrative", "Facilities", "Safety & Wellbeing", "Other"]}
          selected={catFilter}
          onChange={setCatFilter}
        />
        <MultiSelectFilter
          label="Status"
          options={["New", "Investigating", "Resolved", "Escalated", "Closed"]}
          selected={statusFilter}
          onChange={setStatusFilter}
        />
        <MultiSelectFilter
          label="Severity"
          options={["High", "Medium", "Low"]}
          selected={severityFilter}
          onChange={setSeverityFilter}
        />
        <MultiSelectFilter label="Assigned To" options={assignees} selected={assignFilter} onChange={setAssignFilter} />
        {hasFilters && (
          <button
            onClick={() => { setCatFilter([]); setStatusFilter([]); setSeverityFilter([]); setAssignFilter([]); }}
            className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />Clear
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <SortableHeader label="Ticket #"  field="id"           sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Student"   field="student"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Category"  field="category"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell" />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap hidden lg:table-cell">Raised By</th>
                <SortableHeader label="Status"    field="status"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Severity"  field="severity"     sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Sign-offs</th>
                <SortableHeader label="Created"   field="createdDate"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="hidden xl:table-cell" />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const signed = t.signOffs.filter((s) => s.timestamp !== null).length;
                return (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-default">
                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 text-sm whitespace-nowrap">{t.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 text-sm whitespace-nowrap">{t.student}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 hidden md:table-cell whitespace-nowrap">{t.category}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 hidden lg:table-cell whitespace-nowrap">{t.raisedBy}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", COMPLAINT_STATUS_CONFIG[t.status])}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                        t.severity === "High"   ? "bg-red-100 text-red-700"    : "",
                        t.severity === "Medium" ? "bg-amber-100 text-amber-700": "",
                        t.severity === "Low"    ? "bg-slate-100 text-slate-600" : "",
                      )}>
                        {t.severity}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {signed === 2 ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-semibold">2/2</span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-slate-500">{signed}/2</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap hidden xl:table-cell">{t.createdDate}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(t)}
                        className="px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        Open
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState icon={AlertCircle} title="No tickets found" description="No concern tickets match your current filters." />
          )}
        </div>
      </div>

      {selected && <TicketSlideover ticket={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Tab 3 — Surveys ─────────────────────────────────────────────────────────

function SurveyBuilderModal({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-800">Survey Form Builder</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-6 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <Send className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm font-medium text-slate-700 mb-1">Survey form builder</p>
          <p className="text-sm text-slate-500">Configure in <span className="font-medium text-amber-600">Settings → Templates</span></p>
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-slate-200 bg-white text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SurveyDetailSlideover({ survey, onClose }: { survey: SurveyResponse; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[560px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-800">{survey.student}</DialogTitle>
          <p className="text-xs text-slate-400 mt-0.5">{survey.surveyType} · {survey.sentDate}</p>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">Guardian</p>
              <p className="text-slate-700">{survey.guardian}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">Survey Type</p>
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", SURVEY_TYPE_CONFIG[survey.surveyType])}>
                {survey.surveyType}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">Score</p>
              <div className="flex items-center gap-2">
                <StarRating score={survey.score} />
                <span className="text-sm font-semibold text-slate-700">{survey.score}/5</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-1">Category</p>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-semibold",
                survey.category === "Promoter"  ? "bg-emerald-100 text-emerald-700" : "",
                survey.category === "Passive"   ? "bg-amber-100 text-amber-700"    : "",
                survey.category === "Detractor" ? "bg-red-100 text-red-700"        : "",
              )}>
                {survey.category}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Full Comment</p>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
              {survey.comment || <span className="text-slate-400 italic">No comment provided.</span>}
            </div>
          </div>
        </div>
        <DialogFooter className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
          >
            Follow Up
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 border border-slate-200 bg-white text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SurveysTab() {
  const { can } = usePermission();
  const [selectedSurvey, setSelectedSurvey]       = useState<SurveyResponse | null>(null);
  const [surveyBuilderOpen, setSurveyBuilderOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          <StatCard label="Sent This Term"          value="34"    accent="slate" />
          <StatCard label="Response Rate"            value="71%"   accent="green" />
          <StatCard label="Average Score"            value="4.2★"  accent="amber" />
          <StatCard label="Detractors (score ≤ 2)"  value="3"     accent="red"   />
        </div>
        {can('feedback.sendSurvey') && (
          <button
            onClick={() => setSurveyBuilderOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer whitespace-nowrap self-start mt-1"
          >
            <Send className="w-4 h-4" />Send Manual Survey
          </button>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">Survey Responses</p>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Student", "Guardian", "Survey Type", "Sent Date", "Score", "Category", "Comment", "Action"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {surveyResponses.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-default">
                    <td className="px-4 py-3 font-medium text-slate-800 text-sm whitespace-nowrap">{s.student}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{s.guardian}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", SURVEY_TYPE_CONFIG[s.surveyType])}>
                        {s.surveyType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{s.sentDate}</td>
                    <td className="px-4 py-3">
                      <StarRating score={s.score} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                        s.category === "Promoter"  ? "bg-emerald-100 text-emerald-700" : "",
                        s.category === "Passive"   ? "bg-amber-100 text-amber-700"    : "",
                        s.category === "Detractor" ? "bg-red-100 text-red-700"        : "",
                      )}>
                        {s.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">
                      {s.comment.slice(0, 50)}{s.comment.length > 50 ? "…" : ""}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedSurvey(s)}
                        className="px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {surveyResponses.length === 0 && (
              <EmptyState icon={Star} title="No survey responses" description="Survey responses will appear here once submitted." />
            )}
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700 mb-3">Pending Surveys</p>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Student", "Guardian", "Trigger", "Scheduled Date", "Status", "Action"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {surveyPending.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-default">
                    <td className="px-4 py-3 font-medium text-slate-800 text-sm whitespace-nowrap">{p.student}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{p.guardian}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{p.trigger}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{p.scheduledDate}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                        p.status === "Scheduled" ? "bg-slate-100 text-slate-600" : "",
                        p.status === "Sent"      ? "bg-blue-100 text-blue-700"   : "",
                        p.status === "Expired"   ? "bg-red-100 text-red-700"     : "",
                      )}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.status === "Scheduled" && can('feedback.sendSurvey') ? (
                        <button className="px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer whitespace-nowrap">
                          Send Now
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {surveyPending.length === 0 && (
              <EmptyState icon={Send} title="No pending surveys" description="Scheduled surveys will appear here." />
            )}
          </div>
        </div>
      </div>

      {selectedSurvey && <SurveyDetailSlideover survey={selectedSurvey} onClose={() => setSelectedSurvey(null)} />}
      {surveyBuilderOpen && <SurveyBuilderModal onClose={() => setSurveyBuilderOpen(false)} />}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "announcements" | "concerns-tickets" | "surveys";

const TABS: { key: Tab; label: string }[] = [
  { key: "announcements",   label: "Announcements"     },
  { key: "concerns-tickets", label: "Concerns & Tickets" },
  { key: "surveys",         label: "Surveys"            },
];

function CommunicationsPageContent() {
  const { can } = usePermission();
  const searchParams = useSearchParams();
  const router = useRouter();

  const raw = searchParams.get('tab');
  const tab: Tab = (raw && TABS.some(t => t.key === raw)) ? (raw as Tab) : 'announcements';

  function handleTabChange(key: Tab) {
    router.replace(`?tab=${key}`, { scroll: false });
  }

  if (!can('feedback.view')) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <div className="flex items-center gap-0 border-b border-slate-200 -mt-1 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap",
              tab === key
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto pb-4">
        <div key={tab} className="page-enter">
          {tab === "announcements"   && <AnnouncementsTab     />}
          {tab === "concerns-tickets" && <ConcernsTicketsTab  />}
          {tab === "surveys"         && <SurveysTab           />}
        </div>
      </div>
    </div>
  );
}

export default function CommunicationsPage() {
  return (
    <Suspense>
      <CommunicationsPageContent />
    </Suspense>
  );
}
