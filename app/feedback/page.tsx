"use client";

import { useState, useMemo, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Info,
  MessageSquare,
  Star,
  Users,
  X,
  Reply,
  Smile,
  SmilePlus,
  Copy,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { DateRangePicker, DATE_PRESETS, type DateRange } from "@/components/ui/date-range-picker";
import { SortableHeader } from "@/components/ui/sortable-header";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { RoleBanner } from "@/components/ui/role-banner";
import { AccessDenied } from "@/components/ui/access-denied";
// ─── Inline types (previously imported from @/lib/mock-data) ─────────────────

type FeedbackStatus = "Draft" | "Pending Approval" | "Approved" | "Sent" | "Rejected";

interface FeedbackSelector { label: string; value: string; }

interface FeedbackItem {
  id: string;
  studentName: string;
  subject: string;
  teacher: string;
  department: string;
  sessionDate: string;
  status: FeedbackStatus;
  score: number;
  aiSummary: string | null;
  selectors: FeedbackSelector[];
  teacherNotes: string;
}

type TaskType = "Admin" | "Academic" | "Finance" | "HR" | "Student Follow-up" | "Cover" | "Personal";
type TaskPriority = "Urgent" | "High" | "Medium" | "Low";
type TaskStatus = "Open" | "In Progress" | "Blocked" | "Done";

interface Task {
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
  linkedAssignmentId?: string;
  linkedInventoryItemId?: string;
  createdOn?: string;
}

type PostType = "Announcement" | "Discussion" | "Question";

// ─── Local data stubs ─────────────────────────────────────────────────────────

const feedbackItems: FeedbackItem[] = [];
interface ClassPost {
  id: string;
  sender: string;
  role: string;
  timestamp: string;
  type: PostType;
  content: string;
  removed: boolean;
  replyTo?: { postId: string; authorName: string; preview: string };
}

const SEED_POSTS_MATHS: ClassPost[] = [
  { id: 'cp1', sender: 'Sarah Jones', role: 'Teacher', timestamp: '09:05', type: 'Announcement', content: "Reminder: this week's session will cover quadratic equations. Please review Chapter 4 beforehand.", removed: false },
  { id: 'cp2', sender: 'Ahmed Ali', role: 'TA', timestamp: '09:12', type: 'Question', content: "Will we need to bring the practice booklets or just the textbook?", removed: false, replyTo: { postId: 'cp1', authorName: 'Sarah Jones', preview: "Reminder: this week's session will cover quadratic equations. Please review Chapter 4 beforehand." } },
  { id: 'cp3', sender: 'Sarah Jones', role: 'Teacher', timestamp: '09:15', type: 'Discussion', content: "Just the textbook is fine, Ahmed. I'll provide the worksheets in class.", removed: false, replyTo: { postId: 'cp2', authorName: 'Ahmed Ali', preview: "Will we need to bring the practice booklets or just the textbook?" } },
];

const classGroups: { id: string; name: string; teacher: string; unreadCount: number; posts: ClassPost[] }[] = [
  { id: 'cg1', name: 'Maths — Year 10A', teacher: 'Sarah Jones', unreadCount: 2, posts: SEED_POSTS_MATHS },
  { id: 'cg2', name: 'English — Year 9B', teacher: 'Tariq Mahmood', unreadCount: 0, posts: [] },
  { id: 'cg3', name: 'Science — Year 11C', teacher: 'Hana Patel', unreadCount: 1, posts: [] },
];
const tasks: Task[] = [];
const students: { id: string; name: string }[] = [];
import { useCurrentUser } from "@/lib/use-current-user";
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

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Status config ─────────────────────────────────────────────────────────────
// Draft → grey, Pending Approval → amber, Approved → blue, Sent → green

const FEEDBACK_STATUS_CONFIG: Record<FeedbackStatus, string> = {
  Draft:              "bg-slate-100 text-slate-600",
  "Pending Approval": "bg-amber-100 text-amber-700",
  Approved:           "bg-blue-100 text-blue-700",
  Sent:               "bg-emerald-100 text-emerald-700",
  Rejected:           "bg-red-100 text-red-700",
};

const POST_TYPE_CONFIG: Record<PostType, string> = {
  Announcement: "bg-blue-100 text-blue-700",
  Discussion:   "bg-emerald-100 text-emerald-700",
  Question:     "bg-amber-100 text-amber-700",
};

// ─── Tab 1 — Feedback Queue ───────────────────────────────────────────────────

function ReviewSlideover({
  item,
  onClose,
  onApprove,
  onReject,
}: {
  item: FeedbackItem;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const { can } = usePermission();
  const canAct = can('feedback.approve') && item.status === "Pending Approval";
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-800">Review Feedback</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Student</p>
              <p className="font-medium text-slate-800">{item.studentName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Subject</p>
              <p className="text-slate-700">{item.subject}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Teacher</p>
              <p className="text-slate-700">{item.teacher}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">Date submitted</p>
              <p className="text-slate-700">{item.sessionDate}</p>
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-400 font-medium mb-1">Rating</p>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={cn(
                      "w-5 h-5",
                      n <= item.score ? "fill-amber-400 text-amber-400" : "text-slate-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-700">{item.score}/5</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Feedback</p>
            <textarea
              readOnly
              value={item.teacherNotes}
              rows={5}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-slate-50 resize-none focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">AI Summary</p>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
                AI Generated
              </span>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {item.aiSummary ?? "Overall a constructive session with balanced engagement and clear next steps."}
            </p>
          </div>
        </div>

        <DialogFooter className="flex items-center gap-3">
          {canAct ? (
            <>
              <button
                type="button"
                onClick={() => onReject(item.id)}
                className="flex-1 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => onApprove(item.id)}
                className="flex-1 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer"
              >
                Approve
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-slate-200 bg-white text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectReasonDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const trimmed = reason.trim();
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-slate-800">Reject feedback</DialogTitle>
          <p className="text-xs text-slate-400 mt-0.5">Let the teacher know why this feedback isn&apos;t ready to send.</p>
        </DialogHeader>
        <div className="px-6 py-5">
          <label className="text-xs text-slate-500 font-medium mb-1 block" htmlFor="reject-reason">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reject-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="e.g. Please expand on the homework notes before sending."
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white resize-none focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            autoFocus
          />
        </div>
        <DialogFooter className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!trimmed}
            onClick={() => onConfirm(trimmed)}
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-lg transition-colors",
              trimmed
                ? "bg-red-600 text-white hover:bg-red-700 cursor-pointer"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            Confirm rejection
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FeedbackQueueTab() {
  const currentUser = useCurrentUser();
  const [subjectFilter, setSubjectFilter] = useState<string[]>([]);
  const [teacherFilter, setTeacherFilter] = useState<string[]>([]);
  const [deptFilter, setDeptFilter]       = useState<string[]>([]);
  const [statusFilter, setStatusFilter]   = useState<string[]>([]);
  const [dateRange, setDateRange]         = useState<DateRange>({ from: null, to: null });
  const [sortField, setSortField]         = useState<string | null>(null);
  const [sortDir, setSortDir]             = useState<"asc" | "desc">("asc");
  const [selected, setSelected]           = useState<FeedbackItem | null>(null);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, FeedbackStatus>>({});
  const [rejectingId, setRejectingId]     = useState<string | null>(null);

  function toggleSort(field: string) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("asc"); }
  }

  const rows = useMemo(
    () => feedbackItems.map((i) => ({ ...i, status: statusOverrides[i.id] ?? i.status })),
    [statusOverrides],
  );

  const filtered = useMemo(() => {
    let data = rows.filter((item) => {
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
  }, [rows, subjectFilter, teacherFilter, deptFilter, statusFilter, sortField, sortDir]);

  function handleApprove(id: string) {
    const item = rows.find(r => r.id === id);
    setStatusOverrides((prev) => ({ ...prev, [id]: "Approved" }));
    setSelected(null);

    if (item) {
      const student = students.find(s => s.name === item.studentName);
      const newTask: Task = {
        id: `TK-FB-${Date.now()}`,
        title: `Share feedback with parent — ${item.studentName}`,
        type: "Admin",
        priority: "Medium",
        status: "Open",
        assignee: "",
        dueDate: "22 Apr 2026",
        linkedRecord: student
          ? { type: "student", name: item.studentName, id: student.id }
          : null,
        description: `Feedback for ${item.studentName} has been approved by ${currentUser.name}. Please share it with the parent via WhatsApp or their preferred channel.`,
        subtasks: ["Contact guardian via WhatsApp", "Confirm receipt"],
        overdue: false,
        createdOn: "21 Apr 2026",
      };
      tasks.push(newTask);
      toast.success(`Feedback approved — task created: Share feedback with ${item.studentName}'s parent`);
    } else {
      toast.success("Feedback approved");
    }
  }

  function handleRejectConfirm(id: string) {
    setStatusOverrides((prev) => ({ ...prev, [id]: "Rejected" }));
    setRejectingId(null);
    setSelected(null);
    toast.success("Feedback rejected");
  }

  function handleSend(id: string) {
    setStatusOverrides((prev) => ({ ...prev, [id]: "Sent" }));
    toast.success("Feedback sent to guardian");
  }

  const subjects = [...new Set(feedbackItems.map((i) => i.subject))];
  const teachers = [...new Set(feedbackItems.map((i) => i.teacher))];

  return (
    <div className="space-y-4">
      {/* Template notice */}
      <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-600">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <span>
          Feedback templates are configured per subject and year group in{" "}
          <strong className="font-medium">Settings → Subjects &amp; Catalogue</strong>.
          The fields and grade ratings shown in each feedback entry reflect the template defined for that subject.
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Pending Approval"         value="0"  accent="amber" />
        <StatCard label="Sent This Week"            value="0"  accent="green" />
        <StatCard label="Overdue (window closing)"  value="0"  accent="red"   />
        <StatCard label="AI-Generated"              value="—"  accent="slate" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectFilter label="Subject"    options={subjects}                                                        selected={subjectFilter} onChange={setSubjectFilter} />
        <MultiSelectFilter label="Teacher"    options={teachers}                                                        selected={teacherFilter} onChange={setTeacherFilter} />
        <MultiSelectFilter label="Department" options={["Primary", "Lower Secondary", "Senior"]}                        selected={deptFilter}    onChange={setDeptFilter}    />
        <MultiSelectFilter label="Status"     options={["Draft", "Pending Approval", "Approved", "Rejected", "Sent"]}  selected={statusFilter}  onChange={setStatusFilter}  />
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
                    {item.status === "Pending Approval" && (
                      <button
                        onClick={() => setSelected(item)}
                        className="px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100"
                      >
                        Review
                      </button>
                    )}
                    {item.status === "Approved" && (
                      <button
                        onClick={() => handleSend(item.id)}
                        className="px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
                      >
                        Send
                      </button>
                    )}
                    {(item.status === "Draft" || item.status === "Rejected") && (
                      <button
                        onClick={() => setSelected(item)}
                        className="px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
                      >
                        View
                      </button>
                    )}
                    {item.status === "Sent" && (
                      <span className="text-xs text-slate-400">—</span>
                    )}
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

      {selected && (
        <ReviewSlideover
          item={selected}
          onClose={() => setSelected(null)}
          onApprove={handleApprove}
          onReject={(id) => setRejectingId(id)}
        />
      )}
      {rejectingId && (
        <RejectReasonDialog
          onCancel={() => setRejectingId(null)}
          onConfirm={() => handleRejectConfirm(rejectingId)}
        />
      )}
    </div>
  );
}

// ─── Tab 2 — Class Discussion ─────────────────────────────────────────────────

function ClassDiscussionTab() {
  const { can, role } = usePermission();
  const { name: cdCurrentUser } = useCurrentUser();
  const isTA = role === 'TA';
  const canPostDiscussion = can('feedback.postDiscussion');

  const [activeGroupId, setActiveGroupId] = useState(classGroups[0]?.id ?? "");
  const [newContent, setNewContent]       = useState("");
  const [newType, setNewType]             = useState<PostType>("Discussion");
  const [postsByGroup, setPostsByGroup]   = useState<Record<string, ClassPost[]>>(() => {
    const init: Record<string, ClassPost[]> = {};
    classGroups.forEach(g => { init[g.id] = [...g.posts]; });
    return init;
  });

  // Reply / context-menu state
  const [replyTarget, setReplyTarget]     = useState<{ postId: string; authorName: string; preview: string } | null>(null);
  type CdCtx = { postId: string; x: number; y: number; isOwn: boolean } | null;
  const [contextMenu, setContextMenu]     = useState<CdCtx>(null);
  const [contextEmojiOpen, setContextEmojiOpen] = useState(false);
  const [flashPostId, setFlashPostId]     = useState<string | null>(null);

  const feedRef   = useRef<HTMLDivElement | null>(null);
  const inputRef  = useRef<HTMLTextAreaElement | null>(null);

  const activePosts = postsByGroup[activeGroupId] ?? [];
  const activeGroup = classGroups.find((g) => g.id === activeGroupId) ?? classGroups[0];

  // Close context menu on outside click / Escape
  useEffect(() => {
    if (!contextMenu) return;
    function handle(e: MouseEvent | KeyboardEvent) {
      if ('key' in e) { if (e.key === 'Escape') { setContextMenu(null); setContextEmojiOpen(false); } }
      else { setContextMenu(null); setContextEmojiOpen(false); }
    }
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handle);
    return () => { document.removeEventListener('mousedown', handle); document.removeEventListener('keydown', handle); };
  }, [contextMenu]);

  // Close reply on Escape
  useEffect(() => {
    if (!replyTarget) return;
    function handle(e: KeyboardEvent) { if (e.key === 'Escape') setReplyTarget(null); }
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [replyTarget]);

  function roleColor(r: string) {
    if (r === "Teacher") return "bg-amber-500";
    if (r === "Admin")   return "bg-violet-500";
    return "bg-slate-400";
  }

  function scrollToPost(postId: string) {
    const container = feedRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-post-id="${postId}"]`) as HTMLElement | null;
    if (!el) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    container.scrollTop = Math.max(0, container.scrollTop + (elRect.top - containerRect.top) - containerRect.height / 2 + elRect.height / 2);
    setFlashPostId(postId);
    setTimeout(() => setFlashPostId(null), 600);
  }

  function sendPost() {
    const trimmed = newContent.trim();
    if (!trimmed) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const newPost: ClassPost = {
      id: `p-${Date.now()}`,
      sender: cdCurrentUser || 'You',
      role: role || 'Teacher',
      timestamp: `${hh}:${mm}`,
      type: newType,
      content: trimmed,
      removed: false,
      replyTo: replyTarget ?? undefined,
    };
    setPostsByGroup(prev => ({ ...prev, [activeGroupId]: [...(prev[activeGroupId] ?? []), newPost] }));
    setNewContent('');
    setReplyTarget(null);
  }

  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

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
            onClick={() => { setActiveGroupId(group.id); setReplyTarget(null); }}
            className={cn(
              "w-full text-left px-4 py-3 border-b border-slate-100 transition-colors cursor-pointer flex items-start justify-between gap-2",
              activeGroupId === group.id
                ? "bg-slate-100 border-l-2 border-l-amber-500"
                : "hover:bg-slate-50 border-l-2 border-l-transparent"
            )}
          >
            <div className="min-w-0">
              <p className={cn("text-sm font-medium truncate", activeGroupId === group.id ? "text-slate-800" : "text-slate-700")}>
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
        {/* Header */}
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
        <div ref={feedRef} className="flex-1 overflow-y-auto px-4 py-4 bg-[#F0F2F5] space-y-1">
          {activePosts.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <MessageSquare className="w-7 h-7" />
              <p className="text-xs">No posts yet in this group.</p>
            </div>
          )}
          {activePosts.map((post, i) => {
            if (post.removed) {
              return (
                <div key={post.id} className="flex items-center gap-2 py-1 px-2">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <span className="text-[9px] text-slate-400">?</span>
                  </div>
                  <p className="text-xs text-slate-400 italic">Post removed by admin</p>
                </div>
              );
            }
            const prevPost = activePosts[i - 1];
            const isOwn = post.sender === cdCurrentUser;
            const grouped = !!prevPost && !prevPost.removed && prevPost.sender === post.sender;

            return (
              <div
                key={post.id}
                data-post-id={post.id}
                onContextMenu={e => {
                  e.preventDefault();
                  setContextMenu({ postId: post.id, x: e.clientX, y: e.clientY, isOwn: isOwn });
                  setContextEmojiOpen(false);
                }}
                className={cn(
                  'group flex items-end gap-1.5 px-2',
                  isOwn ? 'flex-row-reverse' : 'flex-row',
                  grouped ? 'mt-0.5' : 'mt-2',
                  flashPostId === post.id && 'rounded-xl bg-yellow-100 transition-colors duration-300',
                )}
              >
                {/* Avatar (received only) */}
                {!isOwn && (
                  <div className="w-8 flex-shrink-0 self-end pb-0.5">
                    {!grouped ? (
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold", roleColor(post.role))}>
                        {initials(post.sender)}
                      </div>
                    ) : (
                      <div className="w-8" />
                    )}
                  </div>
                )}

                {/* Bubble column */}
                <div className={cn('flex flex-col min-w-0 max-w-[72%]', isOwn ? 'items-end' : 'items-start')}>
                  {/* Sender + role (received, non-grouped) */}
                  {!isOwn && !grouped && (
                    <div className="flex items-center gap-1.5 mb-1 ml-1">
                      <span className="text-xs font-semibold text-amber-600">{post.sender}</span>
                      <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-semibold", POST_TYPE_CONFIG[post.type])}>{post.type}</span>
                    </div>
                  )}
                  {isOwn && !grouped && (
                    <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full mb-1 mr-1", POST_TYPE_CONFIG[post.type])}>{post.type}</span>
                  )}

                  {/* Bubble */}
                  <div
                    className={cn(
                      'relative px-3 py-2 rounded-2xl shadow-sm',
                      isOwn
                        ? 'bg-amber-500 text-white rounded-tr-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm',
                    )}
                  >
                    {/* Chevron dropdown trigger — top-right of bubble, visible on row hover */}
                    <button
                      type="button"
                      aria-label="Post options"
                      onClick={e => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setContextMenu({ postId: post.id, x: rect.left - 160, y: rect.bottom + 4, isOwn });
                        setContextEmojiOpen(false);
                      }}
                      className={cn(
                        'absolute top-1.5 right-2 w-4 h-4 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer',
                        isOwn ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-slate-600',
                      )}
                    >
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {/* Quoted reply block */}
                    {post.replyTo && (
                      <button
                        type="button"
                        onClick={() => scrollToPost(post.replyTo!.postId)}
                        className={cn(
                          'w-full text-left border-l-2 rounded-r-md px-2 py-1 mb-2 block cursor-pointer hover:opacity-80 transition-opacity',
                          isOwn ? 'border-amber-200 bg-white/20' : 'border-amber-500 bg-amber-50',
                        )}
                      >
                        <p className={cn('text-[11px] font-semibold truncate', isOwn ? 'text-amber-100' : 'text-amber-600')}>
                          {post.replyTo.authorName}
                        </p>
                        <p className={cn('text-[11px] truncate', isOwn ? 'text-amber-200' : 'text-slate-500')}>
                          {post.replyTo.preview}
                        </p>
                      </button>
                    )}

                    <p className={cn('text-sm leading-relaxed break-words whitespace-pre-wrap pr-3', isOwn ? 'text-white' : 'text-slate-700')}>
                      {post.content}
                    </p>
                    <p className={cn('text-[10px] mt-1 text-right select-none', isOwn ? 'text-amber-200' : 'text-slate-400')}>
                      {post.timestamp}
                    </p>
                  </div>
                </div>

                {/* Hover action buttons — appear beside bubble on row hover */}
                <div className="flex items-center gap-0.5 self-end pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
                  <button
                    type="button"
                    aria-label="React"
                    onClick={e => {
                      setContextMenu({ postId: post.id, x: e.clientX - 180, y: e.clientY - 120, isOwn });
                      setContextEmojiOpen(true);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white hover:bg-slate-100 shadow-sm border border-slate-200/60 cursor-pointer transition-colors"
                  >
                    <SmilePlus className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                  {!isTA && canPostDiscussion && (
                    <button
                      type="button"
                      aria-label="Reply"
                      onClick={() => {
                        setReplyTarget({ postId: post.id, authorName: post.sender, preview: post.content.slice(0, 80) });
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-white hover:bg-slate-100 shadow-sm border border-slate-200/60 cursor-pointer transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Composer (hidden for TA read-only) */}
        {canPostDiscussion ? (
          <div className="border-t border-slate-200 px-5 py-3 bg-white">
            {/* Reply bar */}
            {replyTarget && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-2">
                <div className="flex-1 border-l-2 border-amber-500 pl-2 min-w-0">
                  <p className="text-xs font-semibold text-amber-600 truncate">{replyTarget.authorName}</p>
                  <p className="text-xs text-slate-500 truncate">{replyTarget.preview}</p>
                </div>
                <button
                  type="button"
                  aria-label="Cancel reply"
                  onClick={() => setReplyTarget(null)}
                  className="p-1 rounded-md hover:bg-slate-200 text-slate-400 cursor-pointer transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <textarea
                  ref={inputRef}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendPost(); } }}
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
                <button
                  onClick={sendPost}
                  className="px-4 py-1.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        ) : isTA ? (
          <div className="border-t border-slate-200 px-5 py-3 bg-slate-50 flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 flex-shrink-0" />
            <span>You can view and react to posts. Posting requires Teacher or Admin role.</span>
          </div>
        ) : null}
      </div>

      {/* CONTEXT MENU */}
      {contextMenu && (() => {
        const ctxPost = activePosts.find(p => p.id === contextMenu.postId);
        return (
          <div
            style={{
              position: 'fixed',
              left: Math.min(contextMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 1440) - 200),
              top: Math.min(contextMenu.y, (typeof window !== 'undefined' ? window.innerHeight : 900) - 200),
              zIndex: 9999,
            }}
            className="bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-48"
            onMouseDown={e => e.stopPropagation()}
          >
            {contextEmojiOpen ? (
              <div className="px-2 py-2 flex gap-1 flex-wrap justify-center">
                {QUICK_EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setContextMenu(null)}
                    className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-amber-50 cursor-pointer transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {!isTA && canPostDiscussion && (
                  <button
                    type="button"
                    onClick={() => {
                      if (ctxPost) setReplyTarget({ postId: ctxPost.id, authorName: ctxPost.sender, preview: ctxPost.content.slice(0, 80) });
                      setContextMenu(null);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <Reply className="w-4 h-4 text-slate-500" /> Reply
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setContextEmojiOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Smile className="w-4 h-4 text-slate-500" /> React
                </button>
                <button
                  type="button"
                  onClick={() => { if (ctxPost) navigator.clipboard.writeText(ctxPost.content).catch(() => {}); setContextMenu(null); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-500" /> Copy text
                </button>
                {!isTA && contextMenu.isOwn && (
                  <button
                    type="button"
                    onClick={() => {
                      setPostsByGroup(prev => ({
                        ...prev,
                        [activeGroupId]: (prev[activeGroupId] ?? []).map(p =>
                          p.id === contextMenu.postId ? { ...p, removed: true } : p
                        ),
                      }));
                      setContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "queue" | "class-discussion";

const TABS: { key: Tab; label: string }[] = [
  { key: "queue",            label: "Feedback Queue"  },
  { key: "class-discussion", label: "Class Discussion" },
];

function FeedbackPageContent() {
  const { can, role } = usePermission();
  const searchParams = useSearchParams();
  const router = useRouter();

  const raw = searchParams.get('tab');
  const tab: Tab = (raw && TABS.some(t => t.key === raw)) ? (raw as Tab) : 'queue';

  function handleTabChange(key: Tab) {
    router.replace(`?tab=${key}`, { scroll: false });
  }

  if (!can('feedback.view')) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-4 min-h-0">
      {(role === 'Teacher' || role === 'TA') && (
        <RoleBanner message="You can submit and view feedback. Approvals and sign-offs require a higher role." />
      )}
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
          {tab === "queue"            && <FeedbackQueueTab    />}
          {tab === "class-discussion" && <ClassDiscussionTab  />}
        </div>
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  return (
    <Suspense>
      <FeedbackPageContent />
    </Suspense>
  );
}
