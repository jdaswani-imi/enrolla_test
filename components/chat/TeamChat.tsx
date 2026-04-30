"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Paperclip,
  AtSign,
  Link2,
  CheckSquare,
  Smile,
  SmilePlus,
  SendHorizontal,
  User as UserIcon,
  FileText,
  ListTodo,
  Trash2,
  ArrowDown,
  MessageSquare,
  X,
  Search,
  Plus,
  Check,
  Reply,
  Copy,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarPalette, getInitials } from "@/lib/avatar-utils";
import { useCurrentUser } from "@/lib/use-current-user";
import { pushNotification, hasReactionNotification, removeReactionNotification } from "@/lib/notifications-store";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { createClient } from "@/lib/supabase/client";
import { MentionInput, type MentionInputRef, type MentionContent, type MentionData } from "@/components/chat/mention-input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type ChatChipKind = "student" | "invoice" | "task";

export type ChatChip = {
  id: string;
  kind: ChatChipKind;
  label: string;
  ref: string;
  targetId?: string;
  linkedTaskId?: string;
  linkedToTask?: boolean;
};

type ChatReactionMap = Record<string, string[]>;

export type ChatReplyTo = {
  messageId: string;
  authorName: string;
  preview: string;
};

export type ChatMessage = {
  id: string;
  author: string;
  day: string;
  time: string;
  createdAt: string;
  text: string;
  chips: ChatChip[];
  reactions: ChatReactionMap;
  mentions?: MentionData[];
  replyTo?: ChatReplyTo;
};

export type StageHistoryEntry = {
  id: string;
  changed_by_name: string;
  previous_status: string;
  new_status: string;
  changed_at: string;
};

export type DbMessage = {
  id: string;
  author: string;
  text: string;
  chips: ChatChip[];
  reactions: ChatReactionMap;
  mentions: MentionData[];
  created_at: string;
  reply_to?: ChatReplyTo;
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const CHAT_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "🎉", "👏", "✅", "💯", "🙏", "👀"];

const STAGE_BADGE_COLORS: Record<string, string> = {
  New:                  "bg-slate-100 text-slate-700 border-slate-200",
  Contacted:            "bg-blue-100 text-blue-700 border-blue-200",
  "Assessment Booked":  "bg-purple-100 text-purple-700 border-purple-200",
  "Assessment Done":    "bg-indigo-100 text-indigo-700 border-indigo-200",
  "Trial Booked":       "bg-amber-100 text-amber-700 border-amber-200",
  "Trial Done":         "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Schedule Offered":   "bg-orange-100 text-orange-700 border-orange-200",
  "Schedule Confirmed": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Invoice Sent":       "bg-teal-100 text-teal-700 border-teal-200",
  Won:                  "bg-green-100 text-green-700 border-green-200",
  Lost:                 "bg-red-100 text-red-700 border-red-200",
};

function stageBadgeCls(stage: string) {
  return STAGE_BADGE_COLORS[stage] ?? "bg-slate-100 text-slate-600 border-slate-200";
}

function timeAgoShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

const CHAT_LINK_CATALOGUE: { kind: ChatChipKind; label: string; ref: string; targetId?: string }[] = [];

const STAFF_GROUPS: { label: string; members: string[] }[] = [];

// ─── Helpers ───────────────────────────────────────────────────────────────────

let chatIdCounter = 0;
export function nextChatId(prefix: string): string {
  chatIdCounter += 1;
  return `${prefix}-${chatIdCounter}`;
}

function isoToDay(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  return isToday
    ? "Today"
    : isYesterday
    ? "Yesterday"
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function dbRowToMessage(row: DbMessage): ChatMessage {
  const date = new Date(row.created_at);
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  return {
    id: row.id,
    author: row.author,
    day: isoToDay(row.created_at),
    time,
    createdAt: row.created_at,
    text: row.text,
    chips: row.chips ?? [],
    reactions: row.reactions ?? {},
    mentions: row.mentions ?? [],
    replyTo: row.reply_to,
  };
}

export function formatMentionText(
  text: string,
  mentions?: MentionData[],
  activeStaffNames?: Set<string> | null,
  currentUserName?: string,
  isOwnBubble?: boolean,
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
            "font-semibold underline underline-offset-2 cursor-default",
            isOwnBubble
              ? "text-white decoration-white/60"
              : isSelf
              ? "text-amber-600 decoration-amber-400"
              : "text-blue-600 decoration-blue-400",
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

function smoothScrollTo(
  container: HTMLElement,
  targetScrollTop: number,
  duration = 480,
  onComplete?: () => void,
) {
  const start = container.scrollTop;
  const distance = targetScrollTop - start;
  const startTime = performance.now();
  function step(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    container.scrollTop = start + distance * eased;
    if (progress < 1) requestAnimationFrame(step);
    else onComplete?.();
  }
  requestAnimationFrame(step);
}

function reactionTooltipText(users: string[], emoji: string): string {
  if (users.length === 0) return "";
  if (users.length === 1) return users[0];
  if (users.length === 2) return `${users[0]}, ${users[1]}`;
  return `${users[0]}, ${users[1]} and ${users.length - 2} others reacted with ${emoji}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ChatChipIcon({ kind, className }: { kind: ChatChipKind; className?: string }) {
  if (kind === "student") return <UserIcon className={className} />;
  if (kind === "invoice") return <FileText className={className} />;
  return <ListTodo className={className} />;
}

export function ChatChipPill({
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

function ReactionEmojiPickerPortal({
  anchorRect,
  onSelect,
  onClose,
}: {
  anchorRect: DOMRect;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const PICKER_WIDTH = 280;
  const MARGIN = 12;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showAbove = anchorRect.top > 260;
  let left = anchorRect.right - PICKER_WIDTH;
  left = Math.max(MARGIN, Math.min(left, window.innerWidth - PICKER_WIDTH - MARGIN));

  const posStyle: React.CSSProperties = {
    position: "fixed",
    left,
    zIndex: 9999,
    width: PICKER_WIDTH,
    ...(showAbove
      ? { bottom: window.innerHeight - anchorRect.top + 6 }
      : { top: anchorRect.bottom + 6 }),
  };

  return createPortal(
    <div
      data-chat-popover
      style={posStyle}
      className="bg-white border border-slate-200 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.14)] p-3"
    >
      <div className="flex flex-wrap gap-1.5">
        {CHAT_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => { onSelect(e); onClose(); }}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer text-lg transition-colors"
            aria-label={`React with ${e}`}
          >
            {e}
          </button>
        ))}
      </div>
    </div>,
    document.body,
  );
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
  const grouped = {
    student: CHAT_LINK_CATALOGUE.filter(
      (c) => c.kind === "student" && (!query.trim() || c.label.toLowerCase().includes(query.trim().toLowerCase())),
    ),
    invoice: CHAT_LINK_CATALOGUE.filter(
      (c) => c.kind === "invoice" && (!query.trim() || c.label.toLowerCase().includes(query.trim().toLowerCase())),
    ),
    task: CHAT_LINK_CATALOGUE.filter(
      (c) => c.kind === "task" && (!query.trim() || c.label.toLowerCase().includes(query.trim().toLowerCase())),
    ),
  };

  function pick(kind: ChatChipKind, entry: { label: string; ref: string; targetId?: string }) {
    onInsert({ id: nextChatId("chip"), kind, label: entry.label, ref: entry.ref, targetId: entry.targetId });
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

function formatDueDateLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

let nextLeadTaskSeq = 200;
function nextLeadTaskId(): string {
  nextLeadTaskSeq += 1;
  return `TK-${String(nextLeadTaskSeq).padStart(3, "0")}`;
}

function CreateTaskDialog({
  open,
  onOpenChange,
  staffNames,
  leadContext,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  staffNames: string[];
  leadContext?: { id: string; name: string };
  onCreate: (chip: ChatChip) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CreateTaskDialogBody
          staffNames={staffNames}
          leadContext={leadContext}
          onCancel={() => onOpenChange(false)}
          onCreate={(chip) => { onCreate(chip); onOpenChange(false); }}
        />
      ) : (
        <DialogContent className="max-w-md w-full" />
      )}
    </Dialog>
  );
}

function CreateTaskDialogBody({
  staffNames: staffNamesProp,
  leadContext,
  onCancel,
  onCreate,
}: {
  staffNames: string[];
  leadContext?: { id: string; name: string };
  onCancel: () => void;
  onCreate: (chip: ChatChip) => void;
}) {
  const { name: chatCurrentUser } = useCurrentUser();
  const defaultDue = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  })();
  const [title, setTitle] = useState(leadContext ? `Follow up with ${leadContext.name}` : "");
  const [priority, setPriority] = useState<"Low" | "Medium" | "High">("Medium");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeBoxRef = useRef<HTMLDivElement>(null);
  const [dueDate, setDueDate] = useState(defaultDue);

  useEffect(() => {
    if (chatCurrentUser) setAssignees((prev) => (prev.length === 0 ? [chatCurrentUser] : prev));
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

  const filteredStaff = staffNamesProp.filter(
    (name) => !assigneeQuery.trim() || name.toLowerCase().includes(assigneeQuery.trim().toLowerCase()),
  );

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
    const description = leadContext
      ? `Created from ${leadContext.name} lead chat.${othersNote}`
      : `Created from team chat.${othersNote}`;

    fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: trimmed,
        type: "Admin",
        priority,
        assignee: primary,
        dueDateIso: dueDate,
        description,
        subtasks: [],
        linkedRecord: null,
        sourceLeadId: leadContext?.id ?? null,
        sourceLeadName: leadContext?.name ?? null,
      }),
    }).catch(() => {});

    onCreate({
      id: nextChatId("chip"),
      kind: "task",
      label: trimmed,
      ref: taskId,
      linkedTaskId: taskId,
      linkedToTask: true,
    });
    const who = assignees.length === 1 ? primary : `${primary} +${assignees.length - 1}`;
    toast.success(`Task ${taskId} created · ${priority} · ${who} · due ${dueDate}`);
  }

  return (
    <DialogContent className="max-w-md w-full">
      <DialogHeader>
        <DialogTitle>Create &amp; link task</DialogTitle>
        <DialogDescription>
          {leadContext
            ? `Creates a task in M16 and links it back to this lead.`
            : `Creates a new task in M16 and links it to this chat.`}
        </DialogDescription>
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
              (assigneeBoxRef.current?.querySelector("input") as HTMLInputElement | null)?.focus();
            }}
          >
            {assignees.map((name) => {
              const palette = getAvatarPalette(name);
              return (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-xs"
                >
                  <span className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold", palette.bg, palette.text)}>
                    {getInitials(name)}
                  </span>
                  <span className="text-slate-700">{name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={(e) => { e.stopPropagation(); removeAssignee(name); }}
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
              onChange={(e) => { setAssigneeQuery(e.target.value); setAssigneeDropdownOpen(true); }}
              onFocus={() => setAssigneeDropdownOpen(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredStaff.length > 0) {
                  const candidate = filteredStaff.find((n) => !assignees.includes(n));
                  if (candidate) { e.preventDefault(); addAssignee(candidate); setAssigneeQuery(""); }
                }
                if (e.key === "Backspace" && assigneeQuery === "" && assignees.length > 0) removeAssignee(assignees[assignees.length - 1]);
                if (e.key === "Escape") setAssigneeDropdownOpen(false);
              }}
              className="flex-1 min-w-[120px] px-1 py-0.5 text-sm bg-transparent border-0 focus:outline-none placeholder-slate-400"
            />
          </div>
          {assigneeDropdownOpen && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
              {STAFF_GROUPS.length > 0 && (
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
              )}
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
                        onClick={() => { addAssignee(name); setAssigneeQuery(""); }}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                          already ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50 cursor-pointer",
                        )}
                      >
                        <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold", palette.bg, palette.text)}>
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
        <button type="button" onClick={onCancel} className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-white text-slate-700 cursor-pointer transition-colors">
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
          Create &amp; Link
        </button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── TeamChat Props ────────────────────────────────────────────────────────────

export interface TeamChatProps {
  entityId: string;
  entityType: "lead" | "task";
  scrollToMessageId?: { id: string; seq: number } | null;
  /** Content rendered above the chat messages in the unified scroll container (leads panel only). */
  aboveContent?: React.ReactNode;
  /** Lead context — when provided, enables the "Create task" toolbar button. */
  leadContext?: { id: string; name: string };
  /** When true, the messages area uses flex-1 to fill available height (leads panel). When false, uses a fixed max-height (task dialog). */
  fillHeight?: boolean;
  /** Changing this value triggers a re-fetch of stage history (pass lead.stage). */
  stageRefreshKey?: string;
}

// ─── TeamChat ─────────────────────────────────────────────────────────────────

export function TeamChat({
  entityId,
  entityType,
  scrollToMessageId,
  aboveContent,
  leadContext,
  fillHeight = false,
  stageRefreshKey,
}: TeamChatProps) {
  const router = useRouter();
  const { name: chatCurrentUser } = useCurrentUser();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draftChips, setDraftChips] = useState<ChatChip[]>([]);
  const [chatEmpty, setChatEmpty] = useState(true);
  const [reactionPickerFor, setReactionPickerFor] = useState<string | null>(null);
  const [pickerAnchorRect, setPickerAnchorRect] = useState<DOMRect | null>(null);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const reactionBtnRefs = useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [staffNames, setStaffNames] = useState<string[]>([]);
  const [activeStaffNames, setActiveStaffNames] = useState<Set<string> | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [newMessagesCount, setNewMessagesCount] = useState(0);

  // WhatsApp-style reply
  const [replyTarget, setReplyTarget] = useState<ChatReplyTo | null>(null);

  // Right-click context menu
  type TcCtx = { msgId: string; x: number; y: number; isOwn: boolean } | null;
  const [contextMenu, setContextMenu] = useState<TcCtx>(null);
  const [contextEmojiOpen, setContextEmojiOpen] = useState(false);

  // Flash highlight for scroll-to-original
  const [flashMessageId, setFlashMessageId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const mentionInputRef = useRef<MentionInputRef>(null);
  const isNearBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const highlightDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pendingDeleteMessages, setPendingDeleteMessages] = useState<Map<string, ChatMessage>>(new Map());
  const [dismissingDeleteIds, setDismissingDeleteIds] = useState<Set<string>>(new Set());
  const pendingDeleteTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const [stageHistory, setStageHistory] = useState<StageHistoryEntry[]>([]);

  const apiPath = `/api/${entityType}s/${entityId}/messages`;
  const channelName = `${entityType}-messages-${entityId}`;
  const dbTable = entityType === "lead" ? "lead_messages" : "task_messages";
  const dbEntityFilter = entityType === "lead" ? `lead_id=eq.${entityId}` : `task_id=eq.${entityId}`;

  useEffect(() => {
    const timers = pendingDeleteTimers.current;
    return () => { timers.forEach((t) => clearTimeout(t)); };
  }, []);

  // Fetch staff for mention autocomplete
  useEffect(() => {
    fetch("/api/staff")
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        const rows = (json?.data ?? []) as Array<{ name?: string }>;
        const names = rows.map((s) => s.name?.trim()).filter((n): n is string => Boolean(n));
        if (names.length > 0) {
          setStaffNames(names);
          setActiveStaffNames(new Set(names));
        }
      })
      .catch(() => {});
  }, []);

  // Load persisted messages
  useEffect(() => {
    fetch(apiPath)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => {
        if (!json?.data) return;
        setMessages((json.data as DbMessage[]).map(dbRowToMessage));
      })
      .catch(() => {});
  }, [apiPath]);

  // Load stage history for leads
  useEffect(() => {
    if (entityType !== "lead") return;
    fetch(`/api/status-history?entity_type=lead&entity_id=${entityId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((json) => setStageHistory(json?.data ?? []))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, entityType, stageRefreshKey]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: dbTable, filter: dbEntityFilter },
        (payload) => {
          const msg = dbRowToMessage(payload.new as DbMessage);
          setMessages((cur) => cur.some((m) => m.id === msg.id) ? cur : [...cur, msg]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: dbTable, filter: dbEntityFilter },
        (payload) => {
          const updated = dbRowToMessage(payload.new as DbMessage);
          setMessages((cur) => cur.map((m) => m.id === updated.id ? { ...m, reactions: updated.reactions } : m));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: dbTable, filter: dbEntityFilter },
        (payload) => {
          const deletedId = (payload.old as { id?: string }).id;
          if (deletedId) setMessages((cur) => cur.filter((m) => m.id !== deletedId));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [channelName, dbTable, dbEntityFilter]);

  // Track whether user is near the bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
      if (isNearBottomRef.current) setNewMessagesCount(0);
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const added = messages.length > prevMessageCountRef.current;
    prevMessageCountRef.current = messages.length;
    if (!added) return;
    if (isNearBottomRef.current) {
      el.scrollTop = el.scrollHeight;
      setNewMessagesCount(0);
    } else {
      setNewMessagesCount((c) => c + 1);
    }
  }, [messages]);

  // Scroll-to-message highlight (notification deep link)
  useEffect(() => {
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
    if (highlightDelayRef.current) { clearTimeout(highlightDelayRef.current); highlightDelayRef.current = null; }
    if (highlightClearRef.current) { clearTimeout(highlightClearRef.current); highlightClearRef.current = null; }

    if (!scrollToMessageId) return;
    const { id: targetId } = scrollToMessageId;

    setHighlightedMessageId(null);

    const POLL_INTERVAL = 50;
    const POLL_MAX_MS = 5000;
    let elapsed = 0;

    function attemptScroll() {
      const container = scrollRef.current;
      if (!container) return;
      const msgEl = container.querySelector(`[data-message-id="${targetId}"]`) as HTMLElement | null;

      if (!msgEl) {
        elapsed += POLL_INTERVAL;
        if (elapsed >= POLL_MAX_MS) {
          if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
          toast.error("This message is no longer available.");
        }
        return;
      }

      if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }

      const containerRect = container.getBoundingClientRect();
      const msgRect = msgEl.getBoundingClientRect();
      const alreadyVisible = msgRect.top >= containerRect.top && msgRect.bottom <= containerRect.bottom;

      function onScrollComplete() {
        highlightDelayRef.current = setTimeout(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setHighlightedMessageId(targetId);
              highlightClearRef.current = setTimeout(() => setHighlightedMessageId(null), 3000);
            });
          });
        }, 0);
      }

      if (alreadyVisible) {
        onScrollComplete();
      } else {
        const targetScrollTop =
          container.scrollTop +
          (msgRect.top - containerRect.top) -
          (containerRect.height / 2) +
          (msgRect.height / 2);
        smoothScrollTo(container, targetScrollTop, 480, onScrollComplete);
      }
    }

    pollTimerRef.current = setInterval(attemptScroll, POLL_INTERVAL);
    attemptScroll();

    return () => {
      if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
      if (highlightDelayRef.current) { clearTimeout(highlightDelayRef.current); highlightDelayRef.current = null; }
      if (highlightClearRef.current) { clearTimeout(highlightClearRef.current); highlightClearRef.current = null; }
    };
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

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!contextMenu) return;
    function handle(e: MouseEvent | KeyboardEvent) {
      if ('key' in e) { if (e.key === 'Escape') { setContextMenu(null); setContextEmojiOpen(false); } }
      else { setContextMenu(null); setContextEmojiOpen(false); }
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", handle);
    return () => { document.removeEventListener("mousedown", handle); document.removeEventListener("keydown", handle); };
  }, [contextMenu]);

  // Close reply bar on Escape
  useEffect(() => {
    if (!replyTarget) return;
    function handle(e: KeyboardEvent) { if (e.key === 'Escape') setReplyTarget(null); }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [replyTarget]);

  async function sendMessage(args?: { extraChips?: ChatChip[]; content?: MentionContent }) {
    const content = args?.content ?? mentionInputRef.current?.getContent() ?? { text: "", mentions: [] };
    const chips = [...draftChips, ...(args?.extraChips ?? [])];
    if (!content.text && chips.length === 0) return;

    const currentReplyTo = replyTarget;
    mentionInputRef.current?.clear();
    setDraftChips([]);
    setEmojiPickerOpen(false);
    setReplyTarget(null);

    const res = await fetch(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: chatCurrentUser,
        text: content.text,
        chips,
        reactions: {},
        mentions: content.mentions,
        reply_to: currentReplyTo ?? undefined,
      }),
    })
      .then((r) => r.ok ? r.json() : null)
      .catch(() => null);

    if (res?.data) {
      const msg = dbRowToMessage(res.data as DbMessage);
      setMessages((cur) => {
        if (cur.some((m) => m.id === msg.id)) return cur.map((m) => m.id === msg.id ? msg : m);
        return [...cur, msg];
      });
    }

    // Mention notifications — fire server-side only so recipients (not the sender) receive them
    if (content.mentions.length > 0) {
      const msgId = res?.data?.id ?? "";
      // Exclude group pseudo-ids (group-all, group-admins, group-teachers)
      const staffMentionIds = content.mentions
        .map((m) => m.id)
        .filter((id) => !id.startsWith("group-"));
      if (staffMentionIds.length > 0) {
        fetch("/api/notifications/mentions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mentionedStaffIds: staffMentionIds,
            entityId,
            entityType,
            messageId: msgId,
            message: content.text,
          }),
        }).catch(() => {});
      }
    }
  }

  function toggleReaction(msgId: string, emoji: string) {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;
    const wasReacted = (msg.reactions[emoji] ?? []).includes(chatCurrentUser);

    const users = msg.reactions[emoji] ?? [];
    const nextUsers = wasReacted
      ? users.filter((u) => u !== chatCurrentUser)
      : [...users, chatCurrentUser];
    const updatedReactions = { ...msg.reactions };
    if (nextUsers.length === 0) delete updatedReactions[emoji];
    else updatedReactions[emoji] = nextUsers;

    setMessages((cur) => cur.map((m) => m.id !== msgId ? m : { ...m, reactions: updatedReactions }));
    setReactionPickerFor(null);

    fetch(apiPath, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msgId, reactions: updatedReactions }),
    }).catch(() => {});

    if (msg && msg.author !== chatCurrentUser) {
      const href =
        entityType === "lead"
          ? `/leads?leadId=${entityId}&messageId=${msgId}`
          : `/tasks?taskId=${entityId}&messageId=${msgId}`;
      if (!wasReacted) {
        if (!hasReactionNotification({ senderId: chatCurrentUser, messageId: msgId, emoji })) {
          pushNotification({
            id: crypto.randomUUID(),
            type: "reaction",
            title: `${chatCurrentUser} reacted to your message`,
            time: "just now",
            href,
            unread: true,
            senderName: chatCurrentUser,
            leadId: entityType === "lead" ? entityId : undefined,
            messageId: msgId,
            messagePreview: msg.text.slice(0, 40),
            emoji,
            timestamp: Date.now(),
          });
        }
      } else {
        removeReactionNotification({ senderId: chatCurrentUser, messageId: msgId, emoji });
      }
    }
  }

  function deleteMessage(msgId: string) {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg) return;

    const timerId = setTimeout(() => {
      setDismissingDeleteIds((s) => new Set(s).add(msgId));
      setTimeout(() => {
        pendingDeleteTimers.current.delete(msgId);
        setPendingDeleteMessages((prev) => { const next = new Map(prev); next.delete(msgId); return next; });
        setDismissingDeleteIds((s) => { const next = new Set(s); next.delete(msgId); return next; });
        setMessages((cur) => cur.filter((m) => m.id !== msgId));
        fetch(`${apiPath}?messageId=${msgId}`, { method: "DELETE" })
          .then((r) => { if (!r.ok) throw new Error(); })
          .catch(() => toast.error("Failed to delete message"));
      }, 300);
    }, 9700);

    pendingDeleteTimers.current.set(msgId, timerId);
    setPendingDeleteMessages((prev) => { const next = new Map(prev); next.set(msgId, msg); return next; });
  }

  function undoDelete(msgId: string) {
    const timerId = pendingDeleteTimers.current.get(msgId);
    if (timerId !== undefined) clearTimeout(timerId);
    pendingDeleteTimers.current.delete(msgId);
    setPendingDeleteMessages((prev) => { const next = new Map(prev); next.delete(msgId); return next; });
  }

  function scrollToOriginal(messageId: string) {
    const container = scrollRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement | null;
    if (!el) return;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const targetScrollTop = container.scrollTop + (elRect.top - containerRect.top) - containerRect.height / 2 + elRect.height / 2;
    smoothScrollTo(container, Math.max(0, targetScrollTop), 300, () => {
      setFlashMessageId(messageId);
      setTimeout(() => setFlashMessageId(null), 600);
    });
  }

  function handleChipClick(chip: ChatChip) {
    router.push(chipHref(chip));
  }

  function scrollToBottom() {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setNewMessagesCount(0);
  }

  // Build grouped message rows (WhatsApp style), interleaved with stage history events
  const QUICK_EMOJIS_TC = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
  const parseMin = (t: string) => { const [h, mn] = t.split(":").map(Number); return (h||0)*60+(mn||0); };

  type ChatItem =
    | { kind: "msg"; msg: ChatMessage; ts: number }
    | { kind: "stage"; entry: StageHistoryEntry; ts: number };

  const allItems: ChatItem[] = [
    ...messages.map((msg) => ({ kind: "msg" as const, msg, ts: new Date(msg.createdAt).getTime() })),
    ...stageHistory.map((entry) => ({ kind: "stage" as const, entry, ts: new Date(entry.changed_at).getTime() })),
  ].sort((a, b) => a.ts - b.ts);

  const rows: React.ReactNode[] = [];
  let lastDay: string | null = null;
  let lastMsgAuthor: string | null = null;
  let lastMsgDay: string | null = null;
  let lastMsgTime: string | null = null;

  allItems.forEach((item, idx) => {
    const itemDay = item.kind === "msg" ? item.msg.day : isoToDay(item.entry.changed_at);

    if (itemDay !== lastDay) {
      rows.push(
        <div key={`d-${idx}`} className="flex items-center gap-2 py-1.5">
          <div className="flex-1 h-px bg-slate-300/60" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-white/80 rounded-full px-2 py-0.5 shadow-sm">{itemDay}</span>
          <div className="flex-1 h-px bg-slate-300/60" />
        </div>,
      );
      lastDay = itemDay;
    }

    if (item.kind === "stage") {
      const e = item.entry;
      const p = getAvatarPalette(e.changed_by_name);
      rows.push(
        <div key={`stage-${e.id}`} className="flex items-center gap-2 my-1.5">
          <div className="flex-1 h-px bg-slate-200/80" />
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full px-2.5 py-1 shadow-sm max-w-[90%] min-w-0">
            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0", p.bg, p.text)}>
              {getInitials(e.changed_by_name)}
            </div>
            <span className="text-[11px] font-medium text-slate-600 truncate shrink min-w-0">{e.changed_by_name}</span>
            <span className="text-[11px] text-slate-400 shrink-0">moved to</span>
            <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0", stageBadgeCls(e.new_status))}>
              {e.new_status}
            </span>
            <span className="text-[10px] text-slate-400 shrink-0">· {timeAgoShort(e.changed_at)}</span>
          </div>
          <div className="flex-1 h-px bg-slate-200/80" />
        </div>,
      );
      lastMsgAuthor = null;
      return;
    }

    // item.kind === "msg"
    const m = item.msg;

    if (pendingDeleteMessages.has(m.id)) {
      rows.push(
        <div
          key={m.id}
          className={cn(
            "rounded-xl border border-slate-200 bg-white/80 px-3 py-2 flex items-center gap-2 transition-opacity duration-300",
            dismissingDeleteIds.has(m.id) ? "opacity-0" : "opacity-100",
          )}
        >
          <span className="text-sm text-slate-500 flex-1 italic">Message deleted.</span>
          <button type="button" onClick={() => undoDelete(m.id)} className="text-xs font-semibold text-amber-600 hover:text-amber-700 cursor-pointer transition-colors">Undo</button>
        </div>,
      );
      lastMsgAuthor = m.author;
      lastMsgDay = m.day;
      lastMsgTime = m.time;
      return;
    }

    const palette = getAvatarPalette(m.author);
    const isOwn = m.author === chatCurrentUser;
    const grouped =
      !!lastMsgAuthor &&
      lastMsgAuthor === m.author &&
      lastMsgDay === m.day &&
      !!lastMsgTime &&
      parseMin(m.time) - parseMin(lastMsgTime) <= 2;

    rows.push(
      <div
        key={m.id}
        data-message-id={m.id}
        onContextMenu={e => {
          e.preventDefault();
          setContextMenu({ msgId: m.id, x: e.clientX, y: e.clientY, isOwn });
          setContextEmojiOpen(false);
        }}
        className={cn(
          "group flex items-end gap-1.5",
          isOwn ? "flex-row-reverse" : "flex-row",
          grouped ? "mt-0.5" : "mt-2",
          (highlightedMessageId === m.id || flashMessageId === m.id) && "rounded-xl bg-yellow-100 transition-colors duration-300",
        )}
      >
        {/* Avatar — received only, hidden when grouped */}
        {!isOwn && (
          <div className="w-7 flex-shrink-0 self-end pb-0.5">
            {!grouped ? (
              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0", palette.bg, palette.text)}>
                {getInitials(m.author)}
              </div>
            ) : (
              <div className="w-7" />
            )}
          </div>
        )}

        {/* Bubble column */}
        <div className={cn("flex flex-col min-w-0 max-w-[72%]", isOwn ? "items-end" : "items-start")}>
          {/* Author name (received, non-grouped) */}
          {!isOwn && !grouped && (
            <span className="text-xs font-semibold text-amber-600 mb-1 ml-1 truncate">{m.author}</span>
          )}

          {/* Bubble */}
          <div
            className={cn(
              "relative px-3 py-2 rounded-2xl shadow-sm",
              isOwn
                ? "bg-amber-500 text-white rounded-tr-sm"
                : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm",
            )}
          >
            {/* Chevron dropdown trigger — top-right of bubble, visible on row hover */}
            <button
              type="button"
              aria-label="Message options"
              onClick={e => {
                const rect = e.currentTarget.getBoundingClientRect();
                setContextMenu({ msgId: m.id, x: rect.left - 160, y: rect.bottom + 4, isOwn });
                setContextEmojiOpen(false);
              }}
              className={cn(
                "absolute top-1.5 right-2 w-4 h-4 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer",
                isOwn ? "text-white/60 hover:text-white" : "text-slate-400 hover:text-slate-600",
              )}
            >
              <ChevronDown className="w-3 h-3" />
            </button>

            {/* Quoted reply block */}
            {m.replyTo && (
              <button
                type="button"
                onClick={() => scrollToOriginal(m.replyTo!.messageId)}
                className={cn(
                  "w-full text-left border-l-2 rounded-r-md px-2 py-1 mb-2 block cursor-pointer hover:opacity-80 transition-opacity",
                  isOwn ? "border-amber-200 bg-white/20" : "border-amber-500 bg-amber-50",
                )}
              >
                <p className={cn("text-[11px] font-semibold truncate", isOwn ? "text-amber-100" : "text-amber-600")}>
                  {m.replyTo.authorName}
                </p>
                <p className={cn("text-[11px] truncate", isOwn ? "text-amber-200" : "text-slate-500")}>
                  {m.replyTo.preview}
                </p>
              </button>
            )}

            {/* Chips */}
            {m.chips.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {m.chips.map((chip) => (
                  <ChatChipPill key={chip.id} chip={chip} onClick={() => handleChipClick(chip)} />
                ))}
              </div>
            )}

            {/* Message text */}
            {m.text && (
              <p className={cn("text-sm leading-snug whitespace-pre-wrap break-words pr-3", isOwn ? "text-white" : "text-slate-700")}>
                {formatMentionText(m.text, m.mentions, activeStaffNames, chatCurrentUser, isOwn)}
              </p>
            )}

            {/* Timestamp */}
            <p className={cn("text-[10px] mt-1 text-right select-none", isOwn ? "text-amber-200" : "text-slate-400")}>
              {m.time}
            </p>
          </div>

          {/* Reaction pills below bubble */}
          {Object.keys(m.reactions).length > 0 && (
            <div className={cn("flex flex-wrap gap-1 mt-1", isOwn ? "justify-end" : "justify-start")}>
              {Object.entries(m.reactions).map(([emoji, users]) => {
                const own = users.includes(chatCurrentUser);
                return (
                  <Tooltip key={emoji}>
                    <TooltipTrigger
                      onClick={() => toggleReaction(m.id, emoji)}
                      className={cn(
                        "inline-flex items-center gap-1 h-5 rounded-full border px-2 text-[11px] transition-colors cursor-pointer",
                        own
                          ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      <span className="text-[12px]">{emoji}</span>
                      <span className="font-medium">{users.length}</span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-[#1E293B] text-white text-[11px] max-w-[220px]">
                      {reactionTooltipText(users, emoji)}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>

        {/* Hover action buttons — appear beside bubble on row hover */}
        <div className="flex items-center gap-0.5 self-end pb-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
          <button
            type="button"
            aria-label="React"
            onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setPickerAnchorRect(rect);
              setReactionPickerFor(m.id);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white hover:bg-slate-100 shadow-sm border border-slate-200/60 cursor-pointer transition-colors"
          >
            <SmilePlus className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <button
            type="button"
            aria-label="Reply"
            onClick={() => {
              setReplyTarget({ messageId: m.id, authorName: m.author, preview: m.text.slice(0, 80) });
              setTimeout(() => mentionInputRef.current?.focus?.(), 50);
            }}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white hover:bg-slate-100 shadow-sm border border-slate-200/60 cursor-pointer transition-colors"
          >
            <Reply className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>,
    );
    lastMsgAuthor = m.author;
    lastMsgDay = m.day;
    lastMsgTime = m.time;
  });

  return (
    <>
      <div className={cn("flex flex-col min-h-0 overflow-hidden relative", fillHeight && "flex-1")}>
        {/* Scroll area: optional above-content + messages */}
        <div
          ref={scrollRef}
          data-chat-scroll
          className={cn(
            "overflow-y-auto px-3 pt-4 pb-2 bg-[#F0F2F5]",
            fillHeight ? "flex-1 min-h-0" : "max-h-[300px]",
          )}
        >
          {aboveContent}

          <div className={cn(aboveContent && "border-t border-slate-100 pt-4")}>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide flex items-center gap-1.5 mb-3 px-1">
              <MessageSquare className="w-3.5 h-3.5" /> Team Chat
              <span className="text-[10px] font-normal normal-case tracking-normal text-slate-400">
                · only visible to staff
              </span>
            </p>
            {allItems.length === 0 ? (
              <div className="py-4 text-center">
                <p className="text-xs text-slate-400">No messages yet. Start the conversation with the team.</p>
              </div>
            ) : (
              <div className="pb-2">{rows}</div>
            )}
          </div>
        </div>

        {/* New replies banner */}
        {newMessagesCount > 0 && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
            <button
              type="button"
              onClick={scrollToBottom}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-semibold shadow-lg hover:bg-amber-600 cursor-pointer transition-colors"
            >
              <ArrowDown className="w-3 h-3" />
              {newMessagesCount} new {newMessagesCount === 1 ? "reply" : "replies"}
            </button>
          </div>
        )}

        {/* Input area pinned at bottom */}
        <div className="shrink-0 border-t border-slate-200 bg-white">
          {/* Reply bar */}
          {replyTarget && (
            <div className="flex items-center gap-2 bg-slate-50 border-b border-slate-100 px-3 py-2">
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

          {/* Draft chips */}
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

          <div>
            <MentionInput
              ref={mentionInputRef}
              placeholder="Message the team… Enter to send, Shift+Enter for new line"
              onSend={(content) => sendMessage({ content })}
              onEmptyChange={setChatEmpty}
            />
            <div className="flex items-center justify-between px-2 py-1.5">
              <div className="flex items-center gap-0.5">
                <ChatToolbarButton
                  label="Attach file (coming soon)"
                  onClick={() => toast("File upload coming in Phase 2")}
                  icon={Paperclip}
                />
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
                {leadContext && (
                  <ChatToolbarButton
                    label="Create task"
                    onClick={() => setTaskDialogOpen(true)}
                    icon={CheckSquare}
                  />
                )}
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
                          onClick={() => { mentionInputRef.current?.insertText(e); setEmojiPickerOpen(false); }}
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

      {leadContext && (
        <CreateTaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          staffNames={staffNames}
          leadContext={leadContext}
          onCreate={(chip) => sendMessage({ extraChips: [chip] })}
        />
      )}

      {reactionPickerFor && pickerAnchorRect && (
        <ReactionEmojiPickerPortal
          anchorRect={pickerAnchorRect}
          onSelect={(emoji) => toggleReaction(reactionPickerFor, emoji)}
          onClose={() => setReactionPickerFor(null)}
        />
      )}

      {/* Right-click context menu */}
      {contextMenu && (() => {
        const ctxMsg = messages.find(m => m.id === contextMenu.msgId);
        return (
          <div
            style={{
              position: "fixed",
              left: Math.min(contextMenu.x, (typeof window !== "undefined" ? window.innerWidth : 1440) - 200),
              top: Math.min(contextMenu.y, (typeof window !== "undefined" ? window.innerHeight : 900) - 220),
              zIndex: 9999,
            }}
            className="bg-white border border-slate-200 rounded-xl shadow-xl py-1 w-48"
            onMouseDown={e => e.stopPropagation()}
          >
            {contextEmojiOpen ? (
              <div className="px-2 py-2 flex gap-1 flex-wrap justify-center">
                {QUICK_EMOJIS_TC.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { if (ctxMsg) toggleReaction(ctxMsg.id, e); setContextMenu(null); setContextEmojiOpen(false); }}
                    className="w-9 h-9 flex items-center justify-center text-xl rounded-lg hover:bg-amber-50 cursor-pointer transition-colors"
                  >
                    {e}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    if (ctxMsg) setReplyTarget({ messageId: ctxMsg.id, authorName: ctxMsg.author, preview: ctxMsg.text.slice(0, 80) });
                    setContextMenu(null);
                    setTimeout(() => mentionInputRef.current?.focus?.(), 50);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Reply className="w-4 h-4 text-slate-500" /> Reply
                </button>
                <button
                  type="button"
                  onClick={() => setContextEmojiOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Smile className="w-4 h-4 text-slate-500" /> React
                </button>
                <button
                  type="button"
                  onClick={() => { if (ctxMsg) navigator.clipboard.writeText(ctxMsg.text).catch(() => {}); setContextMenu(null); }}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <Copy className="w-4 h-4 text-slate-500" /> Copy text
                </button>
                {contextMenu.isOwn && (
                  <button
                    type="button"
                    onClick={() => { deleteMessage(contextMenu.msgId); setContextMenu(null); }}
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
    </>
  );
}
