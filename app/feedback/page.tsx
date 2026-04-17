"use client";

import { useState, useMemo } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageSquare,
  Plus,
  Send,
  Star,
  Users,
  X,
} from "lucide-react";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { DateRangePicker, DATE_PRESETS, type DateRange } from "@/components/ui/date-range-picker";
import { SortableHeader } from "@/components/ui/sortable-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { RoleBanner } from "@/components/ui/role-banner";
import { AccessDenied } from "@/components/ui/access-denied";
import {
  feedbackItems,
  announcements,
  complaintTickets,
  surveyResponses,
  surveyPending,
  classGroups,
  type FeedbackItem,
  type FeedbackStatus,
  type Announcement,
  type AnnouncementType,
  type AnnouncementStatus,
  type ComplaintTicket,
  type ComplaintCategory,
  type ComplaintStatus,
  type SurveyResponse,
  type SurveyType,
  type SurveyPendingItem,
  type ClassGroup,
  type PostType,
} from "@/lib/mock-data";

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

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Status configs ────────────────────────────────────────────────────────────

const FEEDBACK_STATUS_CONFIG: Record<FeedbackStatus, string> = {
  Draft:              "bg-slate-100 text-slate-600",
  "Pending Approval": "bg-amber-100 text-amber-700",
  Approved:           "bg-emerald-100 text-emerald-700",
  Sent:               "bg-blue-100 text-blue-700",
};

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

const POST_TYPE_CONFIG: Record<PostType, string> = {
  Announcement: "bg-blue-100 text-blue-700",
  Discussion:   "bg-emerald-100 text-emerald-700",
  Question:     "bg-amber-100 text-amber-700",
};

// ─── Tab 1 — Feedback Queue ───────────────────────────────────────────────────

function ReviewSlideover({ item, onClose }: { item: FeedbackItem; onClose: () => void }) {
  const { can } = usePermission();
  const [editedSummary, setEditedSummary] = useState(item.aiSummary ?? "");
  return (
    <>
      <div className="fade-in fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="slide-in-right fixed right-0 top-0 h-full w-[640px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div>
            <p className="font-semibold text-slate-800 text-base">{item.studentName}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.subject} · {item.sessionDate}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Selectors */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Feedback Selectors</p>
            <div className="flex flex-wrap gap-2">
              {item.selectors.map((sel) => (
                <div key={sel.label} className="flex items-center gap-1.5 bg-slate-100 rounded-full px-3 py-1">
                  <span className="text-xs text-slate-500">{sel.label}:</span>
                  <span className="text-xs font-semibold text-slate-700">{sel.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Teacher Notes */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Teacher Notes</p>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
              {item.teacherNotes}
            </div>
          </div>

          {/* AI Summary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">AI Summary</p>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                AI Generated
              </span>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-700 leading-relaxed mb-3">
              {item.aiSummary ?? <span className="text-slate-400 italic">No AI summary generated.</span>}
            </div>
            <label className="text-xs text-slate-500 mb-1 block">Edit before approving</label>
            <textarea
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              rows={4}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-white">
          {can('feedback.approve') && (
          <button className="flex-1 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer">
            Approve & Mark Ready to Send
          </button>
          )}
          {can('feedback.approve') && (
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Return to Teacher
          </button>
          )}
        </div>
      </div>
    </>
  );
}

function FeedbackQueueTab() {
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [teacherFilter, setTeacherFilter] = useState<string[]>([]);
  const [deptFilter, setDeptFilter]       = useState<string[]>([]);
  const [statusFilter, setStatusFilter]   = useState<string[]>([]);
  const [dateRange, setDateRange]         = useState<DateRange>({ from: null, to: null });
  const [sortField, setSortField]         = useState<string | null>(null);
  const [sortDir, setSortDir]             = useState<"asc" | "desc">("asc");
  const [selected, setSelected]           = useState<FeedbackItem | null>(null);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  const filtered = useMemo(() => {
    let data = feedbackItems.filter((item) => {
      if (subjectFilter.length > 0 && !subjectFilter.includes(item.subject))    return false;
      if (teacherFilter.length > 0 && !teacherFilter.includes(item.teacher))    return false;
      if (deptFilter.length > 0 && !deptFilter.includes(item.department))       return false;
      if (statusFilter.length > 0 && !statusFilter.includes(item.status))       return false;
      return true;
    });
    if (sortField) {
      data = [...data].sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sortField];
        const bv = (b as unknown as Record<string, unknown>)[sortField];
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [subjectFilter, teacherFilter, deptFilter, statusFilter, sortField, sortDir]);

  const subjects    = [...new Set(feedbackItems.map((i) => i.subject))];
  const teachers    = [...new Set(feedbackItems.map((i) => i.teacher))];

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Pending Approval"      value="12"  accent="amber" />
        <StatCard label="Sent This Week"         value="47"  accent="green" />
        <StatCard label="Overdue (window closing)" value="3" accent="red"   />
        <StatCard label="AI-Generated"           value="89%" accent="slate" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectFilter label="Subject"    options={subjects}                                               selected={subjectFilter} onChange={setSubjectFilter} />
        <MultiSelectFilter label="Teacher"    options={teachers}                                               selected={teacherFilter} onChange={setTeacherFilter} />
        <MultiSelectFilter label="Department" options={["Primary", "Lower Secondary", "Senior"]}              selected={deptFilter}    onChange={setDeptFilter}    />
        <MultiSelectFilter label="Status"     options={["Draft", "Pending Approval", "Approved", "Sent"]}     selected={statusFilter}  onChange={setStatusFilter}  />
        <DateRangePicker value={dateRange} onChange={setDateRange} presets={DATE_PRESETS} placeholder="Session date" />
        {(subjectFilter.length > 0 || teacherFilter.length > 0 || deptFilter.length > 0 || statusFilter.length > 0) && (
          <button
            onClick={() => { setSubjectFilter([]); setTeacherFilter([]); setDeptFilter([]); setStatusFilter([]); }}
            className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <SortableHeader label="Student"      field="studentName"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Subject"      field="subject"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Teacher"      field="teacher"      sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="hidden lg:table-cell" />
                <SortableHeader label="Session Date" field="sessionDate"  sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Status"       field="status"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap hidden xl:table-cell">AI Summary</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-default">
                  <td className="px-4 py-3 font-medium text-slate-800 text-sm whitespace-nowrap">{item.studentName}</td>
                  <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{item.subject}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap hidden lg:table-cell">{item.teacher}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{item.sessionDate}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", FEEDBACK_STATUS_CONFIG[item.status])}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-xs text-slate-500 block max-w-[240px] truncate">
                      {item.aiSummary ? item.aiSummary.slice(0, 60) + (item.aiSummary.length > 60 ? "…" : "") : "–"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(item)}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap",
                        item.status === "Pending Approval"
                          ? "text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100"
                          : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      {item.status === "Pending Approval" ? "Review" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState
              icon={MessageSquare}
              title="No feedback items found"
              description="No feedback matches your current filters."
            />
          )}
        </div>
      </div>

      {selected && <ReviewSlideover item={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Tab 2 — Announcements ────────────────────────────────────────────────────

function NewAnnouncementSlideover({ onClose }: { onClose: () => void }) {
  const [title, setTitle]       = useState("");
  const [type, setType]         = useState<AnnouncementType>("Pre-session");
  const [audience, setAudience] = useState("Tenant-wide");
  const [message, setMessage]   = useState("");
  const [sendNow, setSendNow]   = useState(false);

  return (
    <>
      <div className="fade-in fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="slide-in-right fixed right-0 top-0 h-full w-[560px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <p className="font-semibold text-slate-800 text-base">New Announcement</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
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

        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-white">
          <button className="flex-1 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer">
            Submit for Approval
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

function AnnouncementsTab() {
  const [typeFilter, setTypeFilter]     = useState<string[]>([]);
  const [deptFilter, setDeptFilter]     = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateRange, setDateRange]       = useState<DateRange>({ from: null, to: null });
  const [newOpen, setNewOpen]           = useState(false);

  const filtered = useMemo(() => announcements.filter((a) => {
    if (typeFilter.length > 0 && !typeFilter.includes(a.type))     return false;
    if (statusFilter.length > 0 && !statusFilter.includes(a.status)) return false;
    return true;
  }), [typeFilter, deptFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectFilter label="Type"       options={["Pre-session", "Post-session"]}                   selected={typeFilter}   onChange={setTypeFilter}   />
        <MultiSelectFilter label="Department" options={["Primary", "Lower Secondary", "Senior"]}          selected={deptFilter}   onChange={setDeptFilter}   />
        <MultiSelectFilter label="Status"     options={["Draft", "Pending Approval", "Sent"]}             selected={statusFilter} onChange={setStatusFilter} />
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
                    <button
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap",
                        a.status === "Pending Approval"
                          ? "text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100"
                          : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      {a.status === "Pending Approval" ? "Approve" : "View"}
                    </button>
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
    </div>
  );
}

// ─── Tab 3 — Complaints & Tickets ────────────────────────────────────────────

function TicketSlideover({ ticket, onClose }: { ticket: ComplaintTicket; onClose: () => void }) {
  const { can } = usePermission();
  const signedCount = ticket.signOffs.filter((s) => s.timestamp !== null).length;
  const isResolved  = signedCount === 2;

  return (
    <>
      <div className="fade-in fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="slide-in-right fixed right-0 top-0 h-full w-[640px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5 flex-wrap">
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
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Meta */}
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

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Description</p>
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {/* Linked Tickets */}
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

          {/* Sign-offs */}
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

          {/* Escalation Log */}
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

        {/* Footer */}
        <div className="flex items-center gap-2 px-6 py-4 border-t border-slate-200 bg-white flex-wrap">
          {can('feedback.resolveComplaint') && (
          <button
            disabled={signedCount >= 2}
            className={cn(
              "px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer",
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
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer ml-auto">
            Close Ticket
          </button>
        </div>
      </div>
    </>
  );
}

function ComplaintsTab() {
  const [catFilter, setCatFilter]       = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [assignFilter, setAssignFilter] = useState<string[]>([]);
  const [selected, setSelected]         = useState<ComplaintTicket | null>(null);
  const [sortField, setSortField]       = useState<string | null>(null);
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("asc");

  function toggleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  const assignees = [...new Set(complaintTickets.map((t) => t.assignedTo))];

  const filtered = useMemo(() => {
    let data = complaintTickets.filter((t) => {
      if (catFilter.length > 0 && !catFilter.includes(t.category))     return false;
      if (statusFilter.length > 0 && !statusFilter.includes(t.status)) return false;
      if (assignFilter.length > 0 && !assignFilter.includes(t.assignedTo)) return false;
      return true;
    });
    if (sortField) {
      data = [...data].sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sortField];
        const bv = (b as unknown as Record<string, unknown>)[sortField];
        const cmp = String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [catFilter, statusFilter, assignFilter, sortField, sortDir]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Open Tickets"        value="4"  accent="red"   />
        <StatCard label="Under Investigation" value="2"  accent="amber" />
        <StatCard label="Resolved This Term"  value="11" accent="green" />
      </div>

      {/* Filters */}
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
        <MultiSelectFilter label="Assigned To" options={assignees} selected={assignFilter} onChange={setAssignFilter} />
        {(catFilter.length > 0 || statusFilter.length > 0 || assignFilter.length > 0) && (
          <button
            onClick={() => { setCatFilter([]); setStatusFilter([]); setAssignFilter([]); }}
            className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />Clear
          </button>
        )}
      </div>

      {/* Table */}
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
            <EmptyState icon={AlertCircle} title="No tickets found" description="No complaint tickets match your current filters." />
          )}
        </div>
      </div>

      {selected && <TicketSlideover ticket={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Tab 4 — Surveys ─────────────────────────────────────────────────────────

function SurveyDetailSlideover({ survey, onClose }: { survey: SurveyResponse; onClose: () => void }) {
  return (
    <>
      <div className="fade-in fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="slide-in-right fixed right-0 top-0 h-full w-[480px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div>
            <p className="font-semibold text-slate-800 text-base">{survey.student}</p>
            <p className="text-xs text-slate-400 mt-0.5">{survey.surveyType} · {survey.sentDate}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
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
      </div>
    </>
  );
}

function SurveysTab() {
  const { can } = usePermission();
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyResponse | null>(null);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center justify-between gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
          <StatCard label="Sent This Term"       value="34"    accent="slate" />
          <StatCard label="Response Rate"         value="71%"   accent="green" />
          <StatCard label="Average Score"         value="4.2★"  accent="amber" />
          <StatCard label="Detractors (score ≤ 2)" value="3"   accent="red"   />
        </div>
        {can('feedback.sendSurvey') && (
        <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer whitespace-nowrap self-start mt-1">
          <Send className="w-4 h-4" />Send Manual Survey
        </button>
        )}
      </div>

      {/* Section A: Survey Responses */}
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

      {/* Section B: Pending Surveys */}
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
                        p.status === "Scheduled" ? "bg-slate-100 text-slate-600"    : "",
                        p.status === "Sent"      ? "bg-blue-100 text-blue-700"      : "",
                        p.status === "Expired"   ? "bg-red-100 text-red-700"        : "",
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
    </div>
  );
}

// ─── Tab 5 — Class Discussion ─────────────────────────────────────────────────

function ClassDiscussionTab() {
  const { can } = usePermission();
  const [activeGroupId, setActiveGroupId] = useState(classGroups[0]?.id ?? "");
  const [newContent, setNewContent]       = useState("");
  const [newType, setNewType]             = useState<PostType>("Discussion");

  const activeGroup = classGroups.find((g) => g.id === activeGroupId) ?? classGroups[0];

  function roleColor(role: string) {
    if (role === "Teacher") return "bg-amber-500";
    if (role === "Admin")   return "bg-violet-500";
    return "bg-slate-400";
  }

  return (
    <div className="flex gap-0 bg-white rounded-xl border border-slate-200 overflow-hidden" style={{ height: "calc(100vh - 220px)", minHeight: "520px" }}>
      {/* Left panel */}
      <div className="w-80 shrink-0 border-r border-slate-200 overflow-y-auto">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Class Groups</p>
        </div>
        {classGroups.map((group) => (
          <button
            key={group.id}
            onClick={() => setActiveGroupId(group.id)}
            className={cn(
              "w-full text-left px-4 py-3 border-b border-slate-100 transition-colors cursor-pointer flex items-start justify-between gap-2",
              activeGroupId === group.id
                ? "bg-slate-100 border-l-2 border-l-amber-500"
                : "hover:bg-slate-50 border-l-2 border-l-transparent"
            )}
          >
            <div className="min-w-0">
              <p className={cn(
                "text-sm font-medium truncate",
                activeGroupId === group.id ? "text-slate-800" : "text-slate-700"
              )}>
                {group.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{group.teacher}</p>
            </div>
            {group.unreadCount > 0 && (
              <span className="shrink-0 min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {group.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Thread header */}
        <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center gap-3">
          <div className="flex-1">
            <p className="font-semibold text-slate-800 text-sm">{activeGroup?.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{activeGroup?.teacher}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="w-3.5 h-3.5" />
            <span>4 participants</span>
          </div>
        </div>

        {/* Posts feed */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {activeGroup?.posts.map((post) =>
            post.removed ? (
              <div key={post.id} className="flex items-center gap-2 py-1">
                <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <span className="text-[9px] text-slate-400">?</span>
                </div>
                <p className="text-xs text-slate-400 italic">Post removed by admin</p>
              </div>
            ) : (
              <div key={post.id} className="flex gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold", roleColor(post.role))}>
                  {initials(post.sender)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-slate-800">{post.sender}</span>
                    <span className="text-xs text-slate-400">{post.role}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold", POST_TYPE_CONFIG[post.type])}>
                      {post.type}
                    </span>
                    <span className="text-xs text-slate-400 ml-auto">{post.timestamp}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* New post bar */}
        <div className="border-t border-slate-200 px-5 py-3 bg-white">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Write a post…"
                rows={2}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
              />
            </div>
            <div className="flex flex-col gap-2 pt-0.5">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as PostType)}
                className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                <option value="Announcement">Announcement</option>
                <option value="Discussion">Discussion</option>
                <option value="Question">Question</option>
              </select>
              {can('feedback.postDiscussion') && (
              <button
                onClick={() => setNewContent("")}
                className="px-4 py-1.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
              >
                Post
              </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "queue" | "announcements" | "complaints" | "surveys" | "discussion";

const TABS: { key: Tab; label: string }[] = [
  { key: "queue",         label: "Feedback Queue"       },
  { key: "announcements", label: "Announcements"         },
  { key: "complaints",    label: "Complaints & Tickets"  },
  { key: "surveys",       label: "Surveys"               },
  { key: "discussion",    label: "Class Discussion"      },
];

export default function FeedbackPage() {
  const { can, role } = usePermission();
  const [tab, setTab] = useState<Tab>("queue");

  if (!can('feedback.view')) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-4 min-h-0">
      {(role === 'Teacher' || role === 'TA') && (
        <RoleBanner message="You can submit and view feedback. Approvals and sign-offs require a higher role." />
      )}
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-slate-200 -mt-1 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
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
          {tab === "queue"         && <FeedbackQueueTab  />}
          {tab === "announcements" && <AnnouncementsTab  />}
          {tab === "complaints"    && <ComplaintsTab     />}
          {tab === "surveys"       && <SurveysTab        />}
          {tab === "discussion"    && <ClassDiscussionTab />}
        </div>
      </div>
    </div>
  );
}
