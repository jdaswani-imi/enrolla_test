"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  currentUser,
  staffMembers,
  students,
  tasks as tasksStore,
  type Task,
  type TaskPriority,
  type TaskType,
} from "@/lib/mock-data";

const TYPE_PILLS: { label: string; value: TaskType }[] = [
  { label: "Student",  value: "Student Follow-up" },
  { label: "Admin",    value: "Admin"             },
  { label: "Personal", value: "Personal"          },
];

const PRIORITY_PILLS: TaskPriority[] = ["Low", "Medium", "High", "Urgent"];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Reference "today" for this prototype (matches TODAY_DATE used across the tasks page).
const TODAY_ISO = "2026-04-21";
const TODAY_LABEL = "21 Apr 2026";

function formatDueDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function nextTaskId(): string {
  let maxSeq = 0;
  for (const t of tasksStore) {
    const match = t.id.match(/TK-(\d+)/);
    if (match) maxSeq = Math.max(maxSeq, parseInt(match[1], 10));
  }
  return `TK-${String(maxSeq + 1).padStart(3, "0")}`;
}

type StudentLite = (typeof students)[number];

interface NewTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (task: Task) => void;
}

export function NewTaskDialog({ open, onOpenChange, onCreated }: NewTaskDialogProps) {
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [type, setType]               = useState<TaskType>("Student Follow-up");
  const [priority, setPriority]       = useState<TaskPriority>("Medium");
  const [dueDateIso, setDueDateIso]   = useState<string>(TODAY_ISO);
  const [assignee, setAssignee]       = useState<string>(currentUser.name);
  const [linkedStudent, setLinkedStudent] = useState<StudentLite | null>(null);

  const [studentQuery, setStudentQuery] = useState("");
  const [studentOpen, setStudentOpen]   = useState(false);
  const studentBoxRef = useRef<HTMLDivElement>(null);

  function reset() {
    setTitle("");
    setDescription("");
    setType("Student Follow-up");
    setPriority("Medium");
    setDueDateIso(TODAY_ISO);
    setAssignee(currentUser.name);
    setLinkedStudent(null);
    setStudentQuery("");
    setStudentOpen(false);
  }

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (studentBoxRef.current && !studentBoxRef.current.contains(e.target as Node)) {
        setStudentOpen(false);
      }
    }
    if (studentOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [studentOpen]);

  const studentResults = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    if (!q) return students.slice(0, 6);
    return students
      .filter((s) => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
      .slice(0, 8);
  }, [studentQuery]);

  const titleTrimmed = title.trim();
  const canSubmit = titleTrimmed.length > 0 && dueDateIso.length > 0;

  function handleConfirm() {
    if (!canSubmit) return;

    const dueLabel = formatDueDateLabel(dueDateIso);
    const isOverdue = dueDateIso < TODAY_ISO;

    const newTask: Task = {
      id: nextTaskId(),
      title: titleTrimmed,
      type,
      priority,
      status: "Open",
      assignee: assignee || currentUser.name,
      dueDate: dueLabel,
      linkedRecord: linkedStudent
        ? { type: "student", name: linkedStudent.name, id: linkedStudent.id }
        : null,
      description: description.trim(),
      subtasks: [],
      overdue: isOverdue,
    };

    tasksStore.push(newTask);
    onCreated(newTask);
    toast.success("Task created");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-lg">New Task</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
          {/* Title */}
          <div>
            <label htmlFor="new-task-title" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="new-task-title"
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Follow up with Aisha's guardian"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="new-task-desc" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Description
            </label>
            <textarea
              id="new-task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Add context, next steps, or notes..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 resize-none"
            />
          </div>

          {/* Type */}
          <div>
            <p className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Type</p>
            <div className="flex flex-wrap gap-1.5">
              {TYPE_PILLS.map(({ label, value }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                    type === value
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <p className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Priority</p>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_PILLS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                    priority === p
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-slate-600 border-slate-200 hover:border-amber-300"
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Due date + Assignee row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="new-task-due" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                id="new-task-due"
                type="date"
                value={dueDateIso}
                onChange={(e) => setDueDateIso(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
              />
              {dueDateIso === TODAY_ISO && (
                <p className="text-[11px] text-amber-600 mt-1">Today — {TODAY_LABEL}</p>
              )}
            </div>

            <div>
              <label htmlFor="new-task-assignee" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Assigned To
              </label>
              <select
                id="new-task-assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 cursor-pointer"
              >
                <option value="">Unassigned</option>
                {staffMembers
                  .filter((s) => s.status !== "Off-boarded")
                  .map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Linked record */}
          <div>
            <p className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Linked Record
            </p>

            {linkedStudent ? (
              <div className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
                <ArrowUpRight className="w-3 h-3" />
                Student — {linkedStudent.name} ({linkedStudent.id})
                <button
                  type="button"
                  onClick={() => setLinkedStudent(null)}
                  aria-label="Remove linked record"
                  className="ml-1 p-0.5 rounded hover:bg-blue-100 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div ref={studentBoxRef} className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={studentQuery}
                  onChange={(e) => { setStudentQuery(e.target.value); setStudentOpen(true); }}
                  onFocus={() => setStudentOpen(true)}
                  placeholder="Search students by name or ID..."
                  className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
                />
                {studentOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto py-1">
                    {studentResults.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-slate-400">No matching students.</p>
                    ) : (
                      studentResults.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            setLinkedStudent(s);
                            setStudentOpen(false);
                            setStudentQuery("");
                          }}
                          className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-amber-50 cursor-pointer flex items-center justify-between gap-2"
                        >
                          <span className="truncate">
                            Student — {s.name} ({s.id})
                          </span>
                          <span className="text-[11px] text-slate-400 shrink-0">{s.yearGroup}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className={cn(
              "flex-1 py-2 rounded-lg text-sm font-semibold transition-colors",
              canSubmit
                ? "btn-primary shadow-sm"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            Create Task
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
