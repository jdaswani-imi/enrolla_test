"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  List,
  LayoutGrid,
  CalendarDays,
  Plus,
  Search,
  ChevronRight,
  MoreHorizontal,
  Check,
  X,
  ArrowUpRight,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tasks as allTasks, type Task, type TaskStatus } from "@/lib/mock-data";
import { EmptyState } from "@/components/ui/empty-state";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { useSavedSegments } from "@/hooks/use-saved-segments";

// ─── Constants ────────────────────────────────────────────────────────────────

const TODAY_DATE = "16 Apr 2025";
const TODAY_DAY = 16;
const MONTH_YEAR = "April 2025";

const ASSIGNEE_OPTIONS = ["Jason Daswani", "Sarah Thompson", "Ahmed Khalil", "Sarah Mitchell"];
const TYPE_OPTIONS     = ["Admin", "Academic", "Finance", "HR", "Student Follow-up", "Cover", "Personal"];
const PRIORITY_OPTIONS = ["High", "Medium", "Low"];
const STATUS_OPTIONS   = ["Open", "In Progress", "Blocked", "Done"];

const ACTIVITY_LOG = [
  { text: "Task created by Jason Daswani", date: "14 Apr" },
  { text: "Assigned to Jason Daswani", date: "14 Apr" },
  { text: "Priority changed to High", date: "15 Apr" },
];

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "bg-amber-100",   text: "text-amber-700"   },
  { bg: "bg-teal-100",    text: "text-teal-700"    },
  { bg: "bg-blue-100",    text: "text-blue-700"    },
  { bg: "bg-violet-100",  text: "text-violet-700"  },
  { bg: "bg-rose-100",    text: "text-rose-700"    },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
];

function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function getPriorityClass(priority: Task["priority"]): string {
  switch (priority) {
    case "High":   return "bg-red-100 text-red-700 border border-red-200";
    case "Medium": return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Low":    return "bg-slate-100 text-slate-600 border border-slate-200";
  }
}

function getPriorityDot(priority: Task["priority"]): string {
  switch (priority) {
    case "High":   return "bg-red-500";
    case "Medium": return "bg-amber-500";
    case "Low":    return "bg-slate-400";
  }
}

function getTypeClass(type: Task["type"]): string {
  switch (type) {
    case "Admin":             return "bg-slate-100 text-slate-600 border border-slate-200";
    case "Academic":          return "bg-teal-100 text-teal-700 border border-teal-200";
    case "Finance":           return "bg-orange-100 text-orange-700 border border-orange-200";
    case "HR":                return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Student Follow-up": return "bg-blue-100 text-blue-700 border border-blue-200";
    case "Cover":             return "bg-purple-100 text-purple-700 border border-purple-200";
    case "Personal":          return "bg-slate-100 text-slate-500 border border-slate-200";
  }
}

function getStatusClass(status: TaskStatus): string {
  switch (status) {
    case "Open":        return "bg-red-100 text-red-700 border border-red-200";
    case "In Progress": return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Blocked":     return "bg-white text-red-600 border border-red-400";
    case "Done":        return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }
}

function getDueDateClass(task: Task, isDone: boolean): string {
  if (isDone) return "text-slate-400";
  if (task.overdue) return "text-red-600 font-medium";
  if (task.dueDate === TODAY_DATE) return "text-amber-600 font-medium";
  return "text-slate-500";
}

function parseDayNumber(dueDate: string): number | null {
  const match = dueDate.match(/(\d+) Apr/);
  return match ? parseInt(match[1]) : null;
}

// ─── Three-dot Actions menu ───────────────────────────────────────────────────

function ActionsMenu({ onEdit }: { onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const items = [
    { label: "Edit",     action: onEdit,   danger: false },
    { label: "Reassign", action: () => {}, danger: false },
    { label: "Snooze",   action: () => {}, danger: false },
    { label: "Delete",   action: () => {}, danger: true  },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        aria-label="Task actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[140px] py-1">
          {items.map(({ label, action, danger }) => (
            <button
              key={label}
              type="button"
              onClick={(e) => { e.stopPropagation(); action(); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer",
                danger ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Task Slide-Over ──────────────────────────────────────────────────────────

interface TaskSlideOverProps {
  task: Task;
  isDone: boolean;
  onClose: () => void;
  onComplete: (id: string) => void;
}

function TaskSlideOver({ task, isDone, onClose, onComplete }: TaskSlideOverProps) {
  const [subtasksDone, setSubtasksDone] = useState<boolean[]>(
    task.subtasks.map(() => isDone)
  );

  function toggleSubtask(i: number) {
    setSubtasksDone((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  return (
    <>
      <div className="fade-in fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div className="slide-in-right fixed right-0 top-0 h-full w-[480px] bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 shrink-0">
          <div className="flex-1 pr-4">
            <h2 className={cn("text-base font-semibold text-slate-800 leading-snug", isDone && "line-through text-slate-400")}>
              {task.title}
            </h2>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getTypeClass(task.type))}>
                {task.type}
              </span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getPriorityClass(task.priority))}>
                {task.priority}
              </span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getStatusClass(task.status))}>
                {task.status}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Description */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Description</p>
            <p className="text-sm text-slate-700 leading-relaxed">{task.description}</p>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Assignee</p>
              <div className="flex items-center gap-2">
                {(() => {
                  const p = getAvatarPalette(task.assignee);
                  return (
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0", p.bg, p.text)}>
                      {getInitials(task.assignee)}
                    </div>
                  );
                })()}
                <span className="text-sm text-slate-700">{task.assignee}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Due Date</p>
              <p className={cn("text-sm", getDueDateClass(task, isDone))}>{task.dueDate}</p>
            </div>
          </div>

          {/* Linked record */}
          {task.linkedRecord && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Linked Record</p>
              <a
                href={`/students/${task.linkedRecord.id}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
              >
                <ArrowUpRight className="w-3 h-3" />
                {task.linkedRecord.name} — {task.linkedRecord.id}
              </a>
            </div>
          )}

          {/* Subtasks */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Sub-tasks</p>
            <div className="space-y-2">
              {task.subtasks.map((sub, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => toggleSubtask(i)}
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                      subtasksDone[i]
                        ? "bg-amber-500 border-amber-500"
                        : "border-slate-300 hover:border-amber-400"
                    )}
                    aria-label={subtasksDone[i] ? "Mark incomplete" : "Mark complete"}
                  >
                    {subtasksDone[i] && <Check className="w-2.5 h-2.5 text-white" />}
                  </button>
                  <span className={cn("text-sm text-slate-700", subtasksDone[i] && "line-through text-slate-400")}>
                    {sub}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Activity log */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Activity</p>
            <div className="space-y-2.5">
              {ACTIVITY_LOG.map((entry, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                  <p className="text-sm text-slate-600">
                    {entry.text}{" "}
                    <span className="text-slate-400">— {entry.date}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 shrink-0">
          {!isDone && (
            <button
              type="button"
              onClick={() => { onComplete(task.id); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Mark Complete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer",
              isDone ? "flex-1" : "px-5"
            )}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ─── List Group Section ───────────────────────────────────────────────────────

interface ListSectionProps {
  label: string;
  count: number;
  badgeClass: string;
  labelClass: string;
  tasks: Task[];
  doneTasks: Set<string>;
  defaultCollapsed?: boolean;
  onToggleDone: (id: string) => void;
  onSelectTask: (task: Task) => void;
}

function ListSection({
  label,
  count,
  badgeClass,
  labelClass,
  tasks,
  doneTasks,
  defaultCollapsed = false,
  onToggleDone,
  onSelectTask,
}: ListSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  if (count === 0) return null;

  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 w-full text-left py-2 px-1 cursor-pointer"
      >
        <ChevronRight
          className={cn("w-4 h-4 text-slate-400 transition-transform duration-150", !collapsed && "rotate-90")}
        />
        <span className={cn("text-xs font-bold uppercase tracking-wider", labelClass)}>{label}</span>
        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", badgeClass)}>{count}</span>
      </button>

      {!collapsed && (
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
          {tasks.map((task) => {
            const isDone = doneTasks.has(task.id);
            const palette = getAvatarPalette(task.assignee);
            return (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer",
                  task.overdue && !isDone && "bg-red-50 border-l-[3px] border-l-red-400",
                  task.dueDate === TODAY_DATE && !task.overdue && !isDone && "bg-amber-50",
                  isDone && "opacity-60"
                )}
              >
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onToggleDone(task.id); }}
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer",
                    isDone
                      ? "bg-emerald-500 border-emerald-500"
                      : "border-slate-300 hover:border-amber-400"
                  )}
                  aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                >
                  {isDone && <Check className="w-2.5 h-2.5 text-white" />}
                </button>

                {/* Priority */}
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", getPriorityClass(task.priority))}>
                  {task.priority}
                </span>

                {/* Title + linked record */}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium text-slate-800 truncate", isDone && "line-through text-slate-400")}>
                    {task.title}
                  </p>
                  {task.linkedRecord && (
                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-0.5">
                      <ArrowUpRight className="w-3 h-3" />
                      {task.linkedRecord.name} — {task.linkedRecord.id}
                    </span>
                  )}
                </div>

                {/* Type */}
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0 hidden lg:inline-flex", getTypeClass(task.type))}>
                  {task.type}
                </span>

                {/* Assignee */}
                <div
                  className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0", palette.bg, palette.text)}
                  title={task.assignee}
                >
                  {getInitials(task.assignee)}
                </div>

                {/* Due date */}
                <span className={cn("text-xs shrink-0 w-24 text-right", getDueDateClass(task, isDone))}>
                  {task.dueDate}
                </span>

                {/* Status */}
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium shrink-0 hidden xl:inline-flex", getStatusClass(task.status))}>
                  {task.status}
                </span>

                {/* Actions */}
                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                  <ActionsMenu onEdit={() => onSelectTask(task)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Kanban Card ──────────────────────────────────────────────────────────────

function KanbanCard({ task, isDone, onClick }: { task: Task; isDone: boolean; onClick: () => void }) {
  const palette = getAvatarPalette(task.assignee);
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all select-none",
        task.overdue && !isDone
          ? "border-l-[3px] border-l-red-400 border-r border-t border-b border-slate-200"
          : "border-slate-200",
        isDone && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={cn("text-sm font-medium text-slate-800 leading-snug line-clamp-2", isDone && "line-through text-slate-400")}>
          {task.title}
        </p>
        <div className={cn("w-2 h-2 rounded-full shrink-0 mt-1", getPriorityDot(task.priority))} />
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getTypeClass(task.type))}>
          {task.type}
        </span>
      </div>

      <p className={cn("text-xs mb-2", getDueDateClass(task, isDone))}>
        {task.dueDate}
      </p>

      {task.linkedRecord && (
        <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
          <ArrowUpRight className="w-3 h-3" />
          <span className="truncate">{task.linkedRecord.name}</span>
        </div>
      )}

      <div className="flex justify-end">
        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold", palette.bg, palette.text)}>
          {getInitials(task.assignee)}
        </div>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

// April 2025 starts on a Tuesday (index 1 in Mon–Sun week)
const APRIL_START_DOF = 1;
const APRIL_DAYS = 30;
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarView({
  tasks,
  doneTasks,
  onSelectTask,
}: {
  tasks: Task[];
  doneTasks: Set<string>;
  onSelectTask: (task: Task) => void;
}) {
  const tasksByDay = useMemo(() => {
    const map: Record<number, Task[]> = {};
    for (const task of tasks) {
      const day = parseDayNumber(task.dueDate);
      if (day !== null) {
        if (!map[day]) map[day] = [];
        map[day].push(task);
      }
    }
    return map;
  }, [tasks]);

  const cells: (number | null)[] = [
    ...Array(APRIL_START_DOF).fill(null),
    ...Array.from({ length: APRIL_DAYS }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200">
        {DAY_LABELS.map((d) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="min-h-[100px] border-b border-r border-slate-100 bg-slate-50/50" />;
          }

          const dayTasks = tasksByDay[day] || [];
          const hasOverdue = dayTasks.some((t) => t.overdue && !doneTasks.has(t.id));
          const isToday = day === TODAY_DAY;

          return (
            <div
              key={day}
              className={cn(
                "min-h-[100px] border-b border-r border-slate-100 p-1.5 flex flex-col",
                hasOverdue && "bg-red-50/30",
                isToday && "ring-2 ring-inset ring-amber-400"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 self-end",
                isToday ? "bg-amber-400 text-white" : "text-slate-500"
              )}>
                {day}
              </div>

              <div className="space-y-0.5 flex-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onSelectTask(task)}
                    className={cn(
                      "w-full flex items-center gap-1 px-1.5 py-0.5 rounded text-left cursor-pointer hover:opacity-80 transition-opacity",
                      doneTasks.has(task.id) ? "bg-slate-100" : "bg-white border border-slate-200"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", getPriorityDot(task.priority))} />
                    <span className="text-[10px] text-slate-700 truncate leading-tight">{task.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 && (
                  <p className="text-[10px] text-slate-400 pl-1">+{dayTasks.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type ViewMode = "list" | "kanban" | "calendar";

export default function TasksPage() {
  const [view, setView] = useState<ViewMode>("list");
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [typeFilter,     setTypeFilter]     = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [statusFilter,   setStatusFilter]   = useState<string[]>([]);
  const [myTasksOnly, setMyTasksOnly] = useState(true);

  const { segments, saveSegment, deleteSegment } = useSavedSegments("tasks");
  const [savePopoverOpen, setSavePopoverOpen]    = useState(false);
  const [segmentName, setSegmentName]            = useState("");

  function applySegment(filters: Record<string, string[]>) {
    setAssigneeFilter(filters.assignee ?? []);
    setTypeFilter(filters.type ?? []);
    setPriorityFilter(filters.priority ?? []);
    setStatusFilter(filters.status ?? []);
  }
  const [search, setSearch] = useState("");
  const [doneTasks, setDoneTasks] = useState<Set<string>>(
    new Set(allTasks.filter((t) => t.status === "Done").map((t) => t.id))
  );
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  function toggleDone(id: string) {
    setDoneTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filtered = useMemo(() => {
    return allTasks.filter((t) => {
      if (myTasksOnly && t.assignee !== "Jason Daswani") return false;
      if (assigneeFilter.length > 0 && !assigneeFilter.includes(t.assignee)) return false;
      if (typeFilter.length > 0 && !typeFilter.includes(t.type)) return false;
      if (priorityFilter.length > 0 && !priorityFilter.includes(t.priority)) return false;
      if (statusFilter.length > 0) {
        if (statusFilter.includes("Done") && doneTasks.has(t.id)) return true;
        if (!statusFilter.includes("Done") && doneTasks.has(t.id)) return false;
        if (!statusFilter.includes(t.status)) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !t.type.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [assigneeFilter, typeFilter, priorityFilter, statusFilter, myTasksOnly, search, doneTasks]);

  // List view groups
  const overdue  = filtered.filter((t) => t.overdue && !doneTasks.has(t.id));
  const today    = filtered.filter((t) => !t.overdue && t.dueDate === TODAY_DATE && !doneTasks.has(t.id));
  const upcoming = filtered.filter((t) => !t.overdue && t.dueDate !== TODAY_DATE && !doneTasks.has(t.id));
  const done     = filtered.filter((t) => doneTasks.has(t.id));

  // Header counts (global, not filtered)
  const openCount    = allTasks.filter((t) => !doneTasks.has(t.id)).length;
  const overdueCount = allTasks.filter((t) => t.overdue && !doneTasks.has(t.id)).length;

  // Kanban columns
  const priorityOrder: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
  const kanbanTodo = filtered
    .filter((t) => !doneTasks.has(t.id) && t.status === "Open")
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const kanbanInProgress = filtered
    .filter((t) => !doneTasks.has(t.id) && (t.status === "In Progress" || t.status === "Blocked"))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  const kanbanDone = filtered.filter((t) => doneTasks.has(t.id));

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 bg-white shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Tasks</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            My Tasks —{" "}
            <span className="text-slate-700 font-medium">{openCount} open</span>
            {" · "}
            <span className="text-red-600 font-medium">{overdueCount} overdue</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
            {(
              [
                { mode: "list"     as const, Icon: List,         label: "List"     },
                { mode: "kanban"   as const, Icon: LayoutGrid,   label: "Kanban"   },
                { mode: "calendar" as const, Icon: CalendarDays, label: "Calendar" },
              ]
            ).map(({ mode, Icon, label }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setView(mode)}
                title={label}
                aria-label={label}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer",
                  view === mode
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Task
          </button>
        </div>
      </div>

      {/* ── Saved Segments ──────────────────────────────────────────────────── */}
      {segments.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap px-6 py-2 bg-white border-b border-slate-100">
          <span className="text-xs text-slate-400 uppercase tracking-wide">Saved:</span>
          {segments.map(seg => (
            <div key={seg.id} className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <button onClick={() => applySegment(seg.filters)} className="text-xs text-amber-700 font-medium hover:text-amber-900 cursor-pointer">{seg.name}</button>
              <button onClick={() => deleteSegment(seg.id)} className="text-amber-400 hover:text-amber-700 ml-1 text-xs cursor-pointer">×</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-6 py-3 bg-white border-b border-slate-200 flex-wrap shrink-0">
        <MultiSelectFilter label="Assignee" options={ASSIGNEE_OPTIONS} selected={assigneeFilter} onChange={setAssigneeFilter} />
        <MultiSelectFilter label="Type"     options={TYPE_OPTIONS}     selected={typeFilter}     onChange={setTypeFilter}     />
        <MultiSelectFilter label="Priority" options={PRIORITY_OPTIONS} selected={priorityFilter} onChange={setPriorityFilter} />
        <MultiSelectFilter label="Status"   options={STATUS_OPTIONS}   selected={statusFilter}   onChange={setStatusFilter}   />

        {/* My Tasks toggle */}
        <button
          type="button"
          onClick={() => setMyTasksOnly((v) => !v)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer",
            myTasksOnly
              ? "bg-amber-500 text-white border-amber-500"
              : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
          )}
        >
          <div className={cn(
            "w-7 h-4 rounded-full relative transition-colors",
            myTasksOnly ? "bg-white/30" : "bg-slate-200"
          )}>
            <div className={cn(
              "absolute top-0.5 w-3 h-3 rounded-full transition-all",
              myTasksOnly ? "left-3.5 bg-white" : "left-0.5 bg-white"
            )} />
          </div>
          My Tasks
        </button>

        {/* Save segment */}
        {(assigneeFilter.length > 0 || typeFilter.length > 0 || priorityFilter.length > 0 || statusFilter.length > 0) && (
          <div className="relative">
            <button onClick={() => setSavePopoverOpen(true)} className="text-xs text-amber-600 hover:text-amber-800 underline cursor-pointer">Save segment</button>
            {savePopoverOpen && (
              <div className="absolute z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-56 bottom-full left-0 mb-1">
                <p className="text-xs font-medium text-slate-700 mb-2">Name this segment</p>
                <input
                  autoFocus
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm mb-2 focus:outline-none focus:border-amber-400"
                  placeholder="e.g. My High Priority"
                  value={segmentName}
                  onChange={(e) => setSegmentName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && segmentName.trim()) {
                      saveSegment(segmentName.trim(), { assignee: assigneeFilter, type: typeFilter, priority: priorityFilter, status: statusFilter });
                      setSegmentName("");
                      setSavePopoverOpen(false);
                    }
                    if (e.key === "Escape") setSavePopoverOpen(false);
                  }}
                />
                <div className="flex gap-2">
                  <button onClick={() => { if (segmentName.trim()) { saveSegment(segmentName.trim(), { assignee: assigneeFilter, type: typeFilter, priority: priorityFilter, status: statusFilter }); setSegmentName(""); setSavePopoverOpen(false); } }} className="flex-1 bg-amber-500 text-white text-xs py-1.5 rounded-lg hover:bg-amber-600 cursor-pointer">Save</button>
                  <button onClick={() => setSavePopoverOpen(false)} className="flex-1 border border-slate-200 text-slate-600 text-xs py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">Cancel</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-full bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 w-48 transition-all"
          />
        </div>
      </div>

      {/* ── View Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* LIST */}
        {view === "list" && (
          <div className="px-6 py-5 max-w-6xl mx-auto w-full">
            {filtered.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="No tasks found"
                description="No tasks match your filters. Try 'All Assignees' or clearing the type filter."
                action={{
                  label: "Show all tasks",
                  onClick: () => {
                    setAssigneeFilter([]);
                    setTypeFilter([]);
                    setPriorityFilter([]);
                    setStatusFilter([]);
                    setMyTasksOnly(false);
                    setSearch("");
                  },
                }}
              />
            ) : (
              <>
                <ListSection
                  label="Overdue"
                  count={overdue.length}
                  badgeClass="bg-red-100 text-red-700"
                  labelClass="text-red-600"
                  tasks={overdue}
                  doneTasks={doneTasks}
                  onToggleDone={toggleDone}
                  onSelectTask={setSelectedTask}
                />
                <ListSection
                  label="Today"
                  count={today.length}
                  badgeClass="bg-amber-100 text-amber-700"
                  labelClass="text-amber-600"
                  tasks={today}
                  doneTasks={doneTasks}
                  onToggleDone={toggleDone}
                  onSelectTask={setSelectedTask}
                />
                <ListSection
                  label="Upcoming"
                  count={upcoming.length}
                  badgeClass="bg-emerald-100 text-emerald-700"
                  labelClass="text-slate-700"
                  tasks={upcoming}
                  doneTasks={doneTasks}
                  onToggleDone={toggleDone}
                  onSelectTask={setSelectedTask}
                />
                <ListSection
                  label="Done"
                  count={done.length}
                  badgeClass="bg-slate-100 text-slate-500"
                  labelClass="text-slate-400"
                  tasks={done}
                  doneTasks={doneTasks}
                  defaultCollapsed
                  onToggleDone={toggleDone}
                  onSelectTask={setSelectedTask}
                />
              </>
            )}
          </div>
        )}

        {/* KANBAN */}
        {view === "kanban" && (
          <div className="px-6 py-5 flex gap-5 items-start overflow-x-auto">
            {/* To Do */}
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-700">To Do</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">{kanbanTodo.length}</span>
              </div>
              <div className="space-y-2">
                {kanbanTodo.map((task) => (
                  <KanbanCard key={task.id} task={task} isDone={false} onClick={() => setSelectedTask(task)} />
                ))}
                {kanbanTodo.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400">No tasks</div>
                )}
              </div>
            </div>

            {/* In Progress */}
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-700">In Progress</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{kanbanInProgress.length}</span>
              </div>
              <div className="space-y-2">
                {kanbanInProgress.map((task) => (
                  <KanbanCard key={task.id} task={task} isDone={false} onClick={() => setSelectedTask(task)} />
                ))}
                {kanbanInProgress.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400">No tasks</div>
                )}
              </div>
            </div>

            {/* Done */}
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-700">Done</h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{kanbanDone.length}</span>
              </div>
              <div className="space-y-2">
                {kanbanDone.map((task) => (
                  <KanbanCard key={task.id} task={task} isDone={true} onClick={() => setSelectedTask(task)} />
                ))}
                {kanbanDone.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400">No tasks</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CALENDAR */}
        {view === "calendar" && (
          <div className="px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-800">{MONTH_YEAR}</h2>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500" /> High
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500" /> Medium
                </span>
                <span className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-slate-400" /> Low
                </span>
              </div>
            </div>
            <CalendarView tasks={filtered} doneTasks={doneTasks} onSelectTask={setSelectedTask} />
          </div>
        )}
      </div>

      {/* ── Slide-Over ──────────────────────────────────────────────────────── */}
      {selectedTask && (
        <TaskSlideOver
          task={selectedTask}
          isDone={doneTasks.has(selectedTask.id)}
          onClose={() => setSelectedTask(null)}
          onComplete={toggleDone}
        />
      )}
    </div>
  );
}
