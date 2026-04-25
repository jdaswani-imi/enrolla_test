"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  History,
  Search,
  GripVertical,
  Info,
  AlertTriangle,
  X,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type Department = "Primary" | "Lower Secondary" | "Upper Secondary" | "Enrichment";
type SubjectStatus = "Active" | "Archived";
type DeliveryMode = "Group" | "1-to-1" | "Trial";
type BillingCadence = "Termly" | "Monthly" | "Weekly" | "Annual" | "One-off" | "Per-session";
type FrequencyTier = "None" | "Standard (1x/wk)" | "Mid (2x/wk)" | "Next (3x/wk)" | "Top (4+/wk)";
type GradingScale =
  | "Percentage (0–100%)"
  | "GCSE Numeric (1–9)"
  | "A-Level Grade (A*–U)"
  | "IB Grade (1–7)"
  | "Primary Descriptor"
  | "Score out of N"
  | "Custom";
type QualificationRoute =
  | "UK (British)"
  | "IB"
  | "Other"
  | "GCSE"
  | "IGCSE"
  | "IB MYP"
  | "A-Level"
  | "International A-Level (IAL)"
  | "IB Diploma";

type Subject = {
  id: string;
  name: string;
  code: string;
  department: Department;
  yearGroups: string[];
  phase: string;
  description: string;
  colour: string;
  status: SubjectStatus;
  duration: 45 | 60 | 120;
  maxStudents: number;
  allowsMakeup: boolean;
  requiresAssessment: boolean;
  billingCadenceDefault: BillingCadence;
  gradingScale: GradingScale;
  weighting: { classwork: number; homework: number; test: number; other: number };
  qualificationRoutes: QualificationRoute[];
  examBoards: string[];
  examCountdown: boolean;
  conditionalRate: boolean;
  conditionDescription?: string;
};

type PricingRow = {
  id: string;
  subjectId: string;
  yearGroup: string;
  mode: DeliveryMode;
  duration: number;
  rate: number | null;
  trialRate?: number | null;
  tier: FrequencyTier;
  minSessions: number;
  cadence: BillingCadence;
  conditional: boolean;
  conditionalRate?: number;
  condition?: string;
  fallbackRate?: number;
  effectiveFrom: string;
  active: boolean;
  history: { rate: number | null; from: string; by: string; reason: string; ts: string }[];
};

type Package = {
  id: string;
  name: string;
  linkedCourse: string;
  sessions: number;
  price: number;
  validFrom?: string;
  validUntil?: string;
  makeup: boolean;
  proRata: boolean;
  weeklyCap?: number;
  regFee: boolean;
  revenueTag: "Primary" | "Lower Secondary" | "Senior" | "Enrichment";
  activeEnrolments: number;
  status: "Active" | "Archived";
};

type LearningObjective = { id: string; label: string };
type Subtopic = { id: string; label: string; objectives: LearningObjective[] };
type Topic = { id: string; label: string; subtopics: Subtopic[] };
type TopicTree = Record<string, Topic[]>;

type GradeRow = { label: string; min: number; max: number };
type GradeBoundarySet = {
  id: string;
  subject: string;
  qualification: string;
  specifier?: string;
  examBoard?: string;
  academicYear: string;
  updatedAt: string;
  rows: GradeRow[];
};

type SelectorType =
  | "Star Rating 1–5"
  | "Numeric Scale"
  | "Checkbox List"
  | "Single-Select Enum"
  | "Free-text Prompt";

type Selector = {
  id: string;
  name: string;
  type: SelectorType;
  options: string[];
  required: boolean;
};

type DeptSelectors = {
  department: Department;
  aiSummary: boolean;
  window: string;
  selectors: Selector[];
};

type SubjectOverride = {
  subjectId: string;
  selectors: Selector[];
};

// ─── Mock Data ────────────────────────────────────────────────────────────────

const COLOURS = [
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-orange-500",
];

const YEAR_GROUPS = [
  "FS1/Nursery", "FS2/KG1",
  "Y1", "Y2", "Y3", "Y4", "Y5", "Y6",
  "Y7", "Y8", "Y9",
  "Y10", "Y11", "Y12", "Y13",
  "Ages vary", "All ages",
];

const DEPARTMENTS: Department[] = ["Primary", "Lower Secondary", "Upper Secondary", "Enrichment"];

function phaseFor(years: string[]): string {
  if (years.some((y) => y === "FS1/Nursery" || y === "FS2/KG1")) return "EYFS";
  if (years.some((y) => ["Y1", "Y2"].includes(y))) return "KS1";
  if (years.some((y) => ["Y3", "Y4", "Y5", "Y6"].includes(y))) return "KS2";
  if (years.some((y) => ["Y7", "Y8", "Y9"].includes(y))) return "KS3";
  if (years.some((y) => ["Y10", "Y11"].includes(y))) return "KS4";
  if (years.some((y) => ["Y12", "Y13"].includes(y))) return "KS5";
  return "Enrichment";
}

function suggestCode(name: string, dept: Department): string {
  const letters = name.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();
  const deptCode = { "Primary": "PRI", "Lower Secondary": "LSC", "Upper Secondary": "USC", "Enrichment": "ENR" }[dept];
  return `${letters}-${deptCode}`;
}

function mkSubject(
  name: string,
  department: Department,
  yearGroups: string[],
  extras: Partial<Subject> = {}
): Subject {
  const id = `${name}-${department}`.replace(/\s+/g, "_").toLowerCase();
  return {
    id,
    name,
    code: suggestCode(name, department),
    department,
    yearGroups,
    phase: phaseFor(yearGroups),
    description: "",
    colour: COLOURS[0],
    status: "Active",
    duration: 60,
    maxStudents: 6,
    allowsMakeup: true,
    requiresAssessment: false,
    billingCadenceDefault: "Termly",
    gradingScale: "Percentage (0–100%)",
    weighting: { classwork: 10, homework: 20, test: 40, other: 30 },
    qualificationRoutes: [],
    examBoards: [],
    examCountdown: ["Y10", "Y11", "Y12", "Y13"].some((y) => yearGroups.includes(y)),
    conditionalRate: false,
    ...extras,
  };
}

const INITIAL_SUBJECTS: Subject[] = [];

const INITIAL_PRICING: PricingRow[] = [];

const INITIAL_PACKAGES: Package[] = [];

const INITIAL_TOPIC_TREES: TopicTree = {};

const INITIAL_BOUNDARIES: GradeBoundarySet[] = [];

const INITIAL_DEPT_SELECTORS: DeptSelectors[] = [];

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Toast({ msg, onDone }: { msg: string; onDone: () => void }) {
  return (
    <div
      className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-[60] animate-in fade-in slide-in-from-bottom-2"
      onAnimationEnd={() => setTimeout(onDone, 2000)}
    >
      {msg}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const active = status === "Active";
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
      active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
    )}>
      {status}
    </span>
  );
}

function InfoChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
      <Link2 className="w-3 h-3" />
      {children}
    </span>
  );
}

function Pill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600", className)}>
      {children}
    </span>
  );
}

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "cursor-pointer",
        checked ? "bg-amber-500" : "bg-slate-200"
      )}
    >
      <span className={cn(
        "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
        checked ? "translate-x-[18px]" : "translate-x-[3px]"
      )} />
    </button>
  );
}

function TextInput({ value, onChange, placeholder, type = "text", className }: {
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400",
        className
      )}
    />
  );
}

function Select({ value, onChange, options, className }: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 cursor-pointer",
        className
      )}
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-slate-500 mb-1.5">
      {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

function PrimaryBtn({ onClick, children, disabled, className }: { onClick?: () => void; children: React.ReactNode; disabled?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-md hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

function GhostBtn({ onClick, children, className }: { onClick?: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-2 border border-slate-200 bg-white text-sm text-slate-600 font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer",
        className
      )}
    >
      {children}
    </button>
  );
}

// ─── Tab 1: Subjects ──────────────────────────────────────────────────────────

function SubjectsTab({
  subjects, setSubjects, depts, onToast,
}: {
  subjects: Subject[];
  setSubjects: (s: Subject[]) => void;
  depts: { id: string; name: string }[];
  onToast: (m: string) => void;
}) {
  const { can } = usePermission();
  const canEdit = can("catalogue.edit");

  const [filterDept, setFilterDept] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<string>("Active");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);

  const filtered = subjects.filter((s) =>
    (filterDept === "All" || s.department === filterDept) &&
    (filterStatus === "All" || s.status === filterStatus) &&
    (search === "" || s.name.toLowerCase().includes(search.toLowerCase()))
  );

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(s: Subject) {
    setEditing(s);
    setDialogOpen(true);
  }

  async function archive(s: Subject) {
    const newActive = s.status !== "Active";
    const res = await fetch(`/api/courses/${s.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "subject", isActive: newActive }),
    });
    if (!res.ok) { onToast("Failed to update subject"); return; }
    setSubjects(subjects.map((x) => x.id === s.id ? { ...x, status: newActive ? "Active" : "Archived" } : x));
    onToast(`Subject ${s.status === "Active" ? "archived" : "reactivated"}`);
  }

  async function save(next: Subject): Promise<string | null> {
    const duplicate = subjects.find((x) =>
      x.id !== next.id &&
      x.name.trim().toLowerCase() === next.name.trim().toLowerCase() &&
      x.department === next.department
    );
    if (duplicate) {
      return `A subject named "${next.name}" already exists in ${next.department}`;
    }

    const deptId = depts.find((d) => d.name === next.department)?.id ?? null;
    const payload = {
      type: "subject",
      name: next.name,
      code: next.code,
      departmentId: deptId,
      yearGroups: next.yearGroups,
      description: next.description,
      colour: next.colour,
      isActive: next.status === "Active",
      sessionDurationMins: next.duration,
      gradingScale: next.gradingScale,
      maxStudents: next.maxStudents,
      allowsMakeup: next.allowsMakeup,
      requiresAssessment: next.requiresAssessment,
      billingCadenceDefault: next.billingCadenceDefault,
      examCountdown: next.examCountdown,
      conditionalRate: next.conditionalRate,
      conditionDescription: next.conditionDescription ?? null,
      weighting: next.weighting,
      qualificationRoutes: next.qualificationRoutes,
      examBoards: next.examBoards,
      phase: next.phase,
    };

    try {
      if (editing) {
        const res = await fetch(`/api/courses/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.status === 409) return "Subject has active enrolments — rename blocked";
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return (err as { error?: string }).error ?? "Failed to save subject";
        }
        setSubjects(subjects.map((x) => x.id === editing.id ? next : x));
      } else {
        const res = await fetch("/api/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          return (err as { error?: string }).error ?? "Failed to create subject";
        }
        const data = await res.json() as { id: string };
        setSubjects([...subjects, { ...next, id: data.id }]);
      }
    } catch {
      return "Network error — please try again";
    }

    onToast("Subject saved");
    setDialogOpen(false);
    return null;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Select value={filterDept} onChange={setFilterDept} options={["All", ...DEPARTMENTS]} className="w-48" />
        <Select value={filterStatus} onChange={setFilterStatus} options={["All", "Active", "Archived"]} className="w-40" />
        <div className="relative flex-1 min-w-[220px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <InfoChip>Used in: Timetable · Invoices · Progress Tracking · Assignments</InfoChip>
          {canEdit && (
            <PrimaryBtn onClick={openNew}>
              <span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />New Subject</span>
            </PrimaryBtn>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Name", "Department", "Year Groups", "Duration", "Grading Scale", "Topic Tree", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-3.5 text-sm font-medium text-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", s.colour)} />
                    {s.name}
                    {s.conditionalRate && (
                      <span title={s.conditionDescription}>
                        <Info className="w-3.5 h-3.5 text-amber-500" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{s.department}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{s.yearGroups.join(", ")}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{s.duration} min</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{s.gradingScale}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">
                  {INITIAL_TOPIC_TREES[s.id] ? <Pill className="bg-emerald-50 text-emerald-700">Configured</Pill> : <Pill>Empty</Pill>}
                </td>
                <td className="px-4 py-3.5"><StatusPill status={s.status} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1">
                    <button
                      disabled={!canEdit}
                      onClick={() => openEdit(s)}
                      className="text-xs font-medium px-2 py-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Edit
                    </button>
                    <button
                      disabled={!canEdit}
                      onClick={() => archive(s)}
                      className="text-xs font-medium px-2 py-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {s.status === "Active" ? "Archive" : "Reactivate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-slate-400">No subjects match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <SubjectDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editing}
        onSave={save}
        onToast={onToast}
      />
    </div>
  );
}

function SubjectDialog({
  open, onClose, initial, onSave, onToast,
}: {
  open: boolean;
  onClose: () => void;
  initial: Subject | null;
  onSave: (s: Subject) => Promise<string | null>;
  onToast: (m: string) => void;
}) {
  const blank: Subject = useMemo(() => ({
    id: Math.random().toString(36).slice(2),
    name: "",
    code: "",
    department: "Primary",
    yearGroups: [],
    phase: "EYFS",
    description: "",
    colour: COLOURS[0],
    status: "Active",
    duration: 60,
    maxStudents: 6,
    allowsMakeup: true,
    requiresAssessment: false,
    billingCadenceDefault: "Termly",
    gradingScale: "Percentage (0–100%)",
    weighting: { classwork: 10, homework: 20, test: 40, other: 30 },
    qualificationRoutes: [],
    examBoards: [],
    examCountdown: false,
    conditionalRate: false,
  }), []);

  const [form, setForm] = useState<Subject>(initial ?? blank);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ?? blank);
      setError(null);
      setSaving(false);
    }
  }, [open, initial, blank]);

  function update<K extends keyof Subject>(k: K, v: Subject[K]) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "yearGroups") next.phase = phaseFor(v as string[]);
      if (k === "name" || k === "department") {
        if (!initial) next.code = suggestCode(next.name, next.department);
      }
      return next;
    });
  }

  function toggleYear(y: string) {
    const has = form.yearGroups.includes(y);
    const next = has ? form.yearGroups.filter((x) => x !== y) : [...form.yearGroups, y];
    update("yearGroups", next);
  }

  const weightingTotal = form.weighting.classwork + form.weighting.homework + form.weighting.test + form.weighting.other;

  const qualOptions = useMemo(() => {
    const hasKS4 = form.yearGroups.some((y) => ["Y10", "Y11"].includes(y));
    const hasKS5 = form.yearGroups.some((y) => ["Y12", "Y13"].includes(y));
    if (form.department === "Enrichment") return [];
    if (hasKS5) return ["A-Level", "International A-Level (IAL)", "IB Diploma"] as QualificationRoute[];
    if (hasKS4) return ["GCSE", "IGCSE", "IB MYP"] as QualificationRoute[];
    return ["UK (British)", "IB", "Other"] as QualificationRoute[];
  }, [form.department, form.yearGroups]);

  const showExamBoards = form.yearGroups.some((y) => ["Y10", "Y11", "Y12", "Y13"].includes(y));
  const examBoardOptions = ["AQA", "Pearson Edexcel", "OCR", "WJEC", "CCEA", "Cambridge (CIE)", "IB Organisation"];
  const examCountdownLocked = form.yearGroups.some((y) => ["Y10", "Y11", "Y12", "Y13"].includes(y));
  const hideExamCountdown = form.department === "Primary";

  async function handleSave() {
    if (!form.name.trim()) { setError("Subject name is required"); return; }
    if (form.yearGroups.length === 0) { setError("Select at least one year group"); return; }
    if (weightingTotal !== 100) { setError("Work type weighting must total 100%"); return; }
    setSaving(true);
    const err = await onSave({ ...form, examCountdown: examCountdownLocked || form.examCountdown });
    setSaving(false);
    if (err) setError(err);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Subject" : "New Subject"}</DialogTitle>
          <DialogDescription>Configure identity, session defaults, and academic routes.</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Section A — Identity */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Identity</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label required>Subject Name</Label>
                <TextInput value={form.name} onChange={(v) => update("name", v)} placeholder="e.g. Mathematics" />
              </div>
              <div>
                <Label>Subject Code</Label>
                <TextInput value={form.code} onChange={(v) => update("code", v)} />
              </div>
              <div>
                <Label required>Department</Label>
                <Select value={form.department} onChange={(v) => update("department", v as Department)} options={DEPARTMENTS} />
              </div>
              <div>
                <Label>Phase (auto)</Label>
                <input value={form.phase} readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-slate-50 text-slate-600" />
              </div>
              <div className="col-span-2">
                <Label required>Year Groups</Label>
                <div className="flex flex-wrap gap-1.5">
                  {YEAR_GROUPS.map((y) => {
                    const active = form.yearGroups.includes(y);
                    return (
                      <button
                        key={y}
                        onClick={() => toggleYear(y)}
                        className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer",
                          active
                            ? "bg-amber-500 text-white border-amber-500"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {y}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <textarea
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 resize-none"
                />
              </div>
              <div>
                <Label>Subject Image</Label>
                <GhostBtn onClick={() => onToast("Image upload coming soon")}>Upload image</GhostBtn>
              </div>
              <div>
                <Label>Colour Tag</Label>
                <div className="flex gap-1.5 pt-1">
                  {COLOURS.map((c) => (
                    <button
                      key={c}
                      onClick={() => update("colour", c)}
                      className={cn("w-6 h-6 rounded-full cursor-pointer border-2", c, form.colour === c ? "border-slate-900" : "border-transparent")}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 col-span-2">
                <Toggle checked={form.status === "Active"} onChange={(v) => update("status", v ? "Active" : "Archived")} />
                <span className="text-sm text-slate-700">Active</span>
              </div>
            </div>
          </div>

          {/* Section B — Session Settings */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Session Settings</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label required>Default Session Duration</Label>
                <div className="flex gap-2">
                  {([45, 60, 120] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => update("duration", d)}
                      className={cn(
                        "px-4 py-2 rounded-md text-sm font-medium border transition-colors cursor-pointer",
                        form.duration === d
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {d} min
                    </button>
                  ))}
                  <span className="px-4 py-2 rounded-md text-sm font-medium border border-slate-200 bg-slate-50 text-slate-400 line-through">90 min</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">90 min blocked per PRD.</p>
              </div>
              <div>
                <Label>Max Students Per Session</Label>
                <TextInput type="number" value={form.maxStudents} onChange={(v) => update("maxStudents", Number(v) || 0)} />
              </div>
              <div>
                <Label>Billing Cadence Default</Label>
                <Select
                  value={form.billingCadenceDefault}
                  onChange={(v) => update("billingCadenceDefault", v as BillingCadence)}
                  options={["Termly", "Monthly", "Weekly", "Annual", "One-off", "Per-session"]}
                />
              </div>
              <div className="flex items-center gap-3">
                <Toggle checked={form.allowsMakeup} onChange={(v) => update("allowsMakeup", v)} />
                <span className="text-sm text-slate-700">Allows makeup sessions</span>
              </div>
              <div className="flex items-center gap-3">
                <Toggle checked={form.requiresAssessment} onChange={(v) => update("requiresAssessment", v)} />
                <span className="text-sm text-slate-700">Requires assessment before enrolment</span>
              </div>
            </div>
          </div>

          {/* Section C — Academic */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Academic</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label required>Grading Scale</Label>
                <Select
                  value={form.gradingScale}
                  onChange={(v) => update("gradingScale", v as GradingScale)}
                  options={[
                    "Percentage (0–100%)",
                    "GCSE Numeric (1–9)",
                    "A-Level Grade (A*–U)",
                    "IB Grade (1–7)",
                    "Primary Descriptor",
                    "Score out of N",
                    "Custom",
                  ]}
                />
              </div>

              <div className="col-span-2">
                <Label>Work Type Weighting</Label>
                <div className="space-y-2">
                  {(["classwork", "homework", "test", "other"] as const).map((k) => (
                    <div key={k} className="flex items-center gap-3">
                      <span className="text-sm text-slate-700 capitalize w-24">{k}</span>
                      <input
                        type="number"
                        value={form.weighting[k]}
                        onChange={(e) => update("weighting", { ...form.weighting, [k]: Number(e.target.value) || 0 })}
                        className="w-24 px-3 py-1.5 text-sm border border-slate-200 rounded-md"
                      />
                      <span className="text-xs text-slate-400">%</span>
                    </div>
                  ))}
                  <div className={cn("text-sm font-medium", weightingTotal === 100 ? "text-emerald-600" : "text-rose-600")}>
                    Total: {weightingTotal}%
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  HOD configures weighting per subject. Feeds M19 predicted grade calculation.
                </p>
              </div>

              {qualOptions.length > 0 && (
                <div className="col-span-2">
                  <Label>Qualification Routes Available</Label>
                  <div className="flex flex-wrap gap-2">
                    {qualOptions.map((q) => {
                      const active = form.qualificationRoutes.includes(q);
                      return (
                        <button
                          key={q}
                          onClick={() => update(
                            "qualificationRoutes",
                            active ? form.qualificationRoutes.filter((x) => x !== q) : [...form.qualificationRoutes, q]
                          )}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer",
                            active ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          {q}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {showExamBoards && (
                <div className="col-span-2">
                  <Label>Available Exam Boards</Label>
                  <div className="flex flex-wrap gap-2">
                    {examBoardOptions.map((b) => {
                      const active = form.examBoards.includes(b);
                      return (
                        <button
                          key={b}
                          onClick={() => update(
                            "examBoards",
                            active ? form.examBoards.filter((x) => x !== b) : [...form.examBoards, b]
                          )}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium border cursor-pointer",
                            active ? "bg-amber-500 text-white border-amber-500" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          {b}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!hideExamCountdown && (
                <div className="flex items-center gap-3 col-span-2">
                  <Toggle
                    checked={examCountdownLocked || form.examCountdown}
                    onChange={(v) => update("examCountdown", v)}
                    disabled={examCountdownLocked}
                  />
                  <span className="text-sm text-slate-700">
                    Exam Countdown {examCountdownLocked && <span className="text-xs text-slate-400">(locked on for Y10–Y13)</span>}
                  </span>
                </div>
              )}

              <div className="col-span-2 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3 mb-2">
                  <Toggle checked={form.conditionalRate} onChange={(v) => update("conditionalRate", v)} />
                  <span className="text-sm text-slate-700">Conditional Rate Applies</span>
                </div>
                {form.conditionalRate && (
                  <>
                    <Label>Condition description</Label>
                    <textarea
                      value={form.conditionDescription ?? ""}
                      onChange={(e) => update("conditionDescription", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md resize-none"
                      placeholder="e.g. AED 150 when combined with Maths + English (min 10 sessions)…"
                    />
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-2">
                      Informational only — actual rate is configured in the Pricing Matrix tab.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2 rounded-md">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save Subject"}</PrimaryBtn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab 2: Pricing Matrix ────────────────────────────────────────────────────

function PricingTab({
  subjects, rows, setRows, onToast,
}: {
  subjects: Subject[];
  rows: PricingRow[];
  setRows: (r: PricingRow[]) => void;
  onToast: (m: string) => void;
}) {
  const { can, role } = usePermission();
  const canEdit = can("catalogue.edit");

  const [filterDept, setFilterDept] = useState("All");
  const [filterSubject, setFilterSubject] = useState("All");
  const [filterMode, setFilterMode] = useState("All");
  const [filterActive, setFilterActive] = useState("All");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PricingRow | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<{ next: PricingRow; prevRate: number | null } | null>(null);
  const [historyRow, setHistoryRow] = useState<PricingRow | null>(null);

  const subjectMap = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects]);

  const filtered = rows.filter((r) => {
    const s = subjectMap[r.subjectId];
    if (!s) return false;
    if (filterDept !== "All" && s.department !== filterDept) return false;
    if (filterSubject !== "All" && s.id !== filterSubject) return false;
    if (filterMode !== "All" && r.mode !== filterMode) return false;
    if (filterActive === "Active" && !r.active) return false;
    if (filterActive === "Inactive" && r.active) return false;
    return true;
  });

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(r: PricingRow) {
    setEditing(r);
    setDialogOpen(true);
  }

  async function handleDialogSave(next: PricingRow, reason: string) {
    if (editing) {
      const rateChanged = editing.rate !== next.rate;
      if (rateChanged) {
        setPendingConfirm({ next: { ...next, history: [...editing.history, { rate: editing.rate, from: editing.effectiveFrom, by: role, reason, ts: new Date().toISOString() }] }, prevRate: editing.rate });
        setDialogOpen(false);
        return;
      }
      const res = await fetch(`/api/courses/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "course",
          yearGroup: next.yearGroup,
          mode: next.mode,
          sessionDurationMins: next.duration,
          ratePerSession: next.rate,
          tier: next.tier,
          minSessions: next.minSessions,
          billingCadence: next.cadence,
          effectiveFrom: next.effectiveFrom,
          isActive: next.active,
          conditional: next.conditional,
          conditionalRateVal: next.conditionalRate ?? null,
          conditionText: next.condition ?? null,
          fallbackRate: next.fallbackRate ?? null,
          trialRate: next.trialRate ?? null,
          rateHistory: next.history,
        }),
      });
      if (!res.ok) { onToast("Failed to update course row"); return; }
      setRows(rows.map((r) => r.id === editing.id ? next : r));
      onToast("Course row updated");
    } else {
      const subject = subjectMap[next.subjectId];
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "course",
          subjectId: next.subjectId,
          subjectName: subject?.name,
          yearGroup: next.yearGroup,
          mode: next.mode,
          sessionDurationMins: next.duration,
          ratePerSession: next.rate,
          tier: next.tier,
          minSessions: next.minSessions,
          billingCadence: next.cadence,
          effectiveFrom: next.effectiveFrom,
          isActive: next.active,
          conditional: next.conditional,
          conditionalRateVal: next.conditionalRate ?? null,
          conditionText: next.condition ?? null,
          fallbackRate: next.fallbackRate ?? null,
          trialRate: next.trialRate ?? null,
          rateHistory: next.history,
        }),
      });
      if (!res.ok) { onToast("Failed to create course row"); return; }
      const data = await res.json() as { id: string };
      setRows([...rows, { ...next, id: data.id }]);
      onToast("Course row added");
    }
    setDialogOpen(false);
  }

  async function confirmRateChange() {
    if (!pendingConfirm) return;
    const next = pendingConfirm.next;
    const res = await fetch(`/api/courses/${next.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "course",
        ratePerSession: next.rate,
        rateHistory: next.history,
        yearGroup: next.yearGroup,
        mode: next.mode,
        sessionDurationMins: next.duration,
        tier: next.tier,
        minSessions: next.minSessions,
        billingCadence: next.cadence,
        effectiveFrom: next.effectiveFrom,
        isActive: next.active,
        conditional: next.conditional,
        conditionalRateVal: next.conditionalRate ?? null,
        conditionText: next.condition ?? null,
        fallbackRate: next.fallbackRate ?? null,
        trialRate: next.trialRate ?? null,
      }),
    });
    if (!res.ok) { onToast("Failed to update rate"); return; }
    setRows(rows.map((r) => r.id === next.id ? next : r));
    onToast("Rate updated — logged for audit");
    setPendingConfirm(null);
  }

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-900 mb-4">
        Rates are applied automatically by the invoice builder (M08). Changes apply to new invoices only. All rate changes are logged permanently for audit.
      </div>
      {!canEdit && (
        <div className="bg-slate-100 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-600 mb-4">
          You have view-only access to the pricing matrix.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Select value={filterDept} onChange={setFilterDept} options={["All", ...DEPARTMENTS]} className="w-48" />
        <Select value={filterSubject} onChange={setFilterSubject} options={["All", ...subjects.map((s) => s.id)]} className="w-56" />
        <Select value={filterMode} onChange={setFilterMode} options={["All", "Group", "1-to-1", "Trial"]} className="w-36" />
        <Select value={filterActive} onChange={setFilterActive} options={["All", "Active", "Inactive"]} className="w-32" />
        <div className="ml-auto flex items-center gap-2">
          <InfoChip>Feeds: Invoice Builder (M08)</InfoChip>
          {canEdit && <PrimaryBtn onClick={openNew}><span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />New Course Row</span></PrimaryBtn>}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Subject", "Year", "Mode", "Duration", "Rate (AED)", "Tier", "Min", "Cadence", "Cond.", "Effective", "Active", "Actions"].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => {
              const s = subjectMap[r.subjectId];
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">{s?.name}</td>
                  <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{r.yearGroup}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{r.mode}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{r.duration}m</td>
                  <td className="px-3 py-3 text-sm">
                    {r.rate === null
                      ? <span className="text-amber-600 font-medium">Not set</span>
                      : <span className="text-slate-800 font-medium">AED {r.rate}</span>}
                  </td>
                  <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{r.tier}</td>
                  <td className="px-3 py-3 text-sm text-slate-600">{r.minSessions}</td>
                  <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{r.cadence}</td>
                  <td className="px-3 py-3 text-sm">{r.conditional ? <Pill className="bg-amber-50 text-amber-700">Yes</Pill> : <span className="text-slate-300">—</span>}</td>
                  <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{r.effectiveFrom}</td>
                  <td className="px-3 py-3"><StatusPill status={r.active ? "Active" : "Archived"} /></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setHistoryRow(r)}
                        className="text-xs font-medium px-2 py-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                        title="Rate history"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={!canEdit}
                        onClick={() => openEdit(r)}
                        className="text-xs font-medium px-2 py-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer disabled:opacity-40"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={12} className="px-4 py-12 text-center text-sm text-slate-400">No course rows match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <PricingDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        initial={editing}
        subjects={subjects}
        onSave={handleDialogSave}
      />

      <Dialog open={!!pendingConfirm} onOpenChange={(o) => { if (!o) setPendingConfirm(null); }}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Confirm rate change</DialogTitle>
          </DialogHeader>
          {pendingConfirm && (
            <div className="p-6 text-sm text-slate-700 space-y-3">
              <p>
                You are changing the rate for{" "}
                <strong>{subjectMap[pendingConfirm.next.subjectId]?.name}</strong>{" "}
                {pendingConfirm.next.yearGroup} {pendingConfirm.next.mode} from{" "}
                <strong>AED {pendingConfirm.prevRate ?? "—"}</strong> to{" "}
                <strong>AED {pendingConfirm.next.rate}</strong>.
              </p>
              <p>This applies to all new invoices from <strong>{pendingConfirm.next.effectiveFrom}</strong>. Existing invoices are not affected.</p>
            </div>
          )}
          <DialogFooter className="flex justify-end gap-2">
            <GhostBtn onClick={() => setPendingConfirm(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={confirmRateChange}>Confirm</PrimaryBtn>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyRow} onOpenChange={(o) => { if (!o) setHistoryRow(null); }}>
        <DialogContent className="max-w-xl w-full max-h-[75vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rate history</DialogTitle>
            <DialogDescription>
              {historyRow && `${subjectMap[historyRow.subjectId]?.name} · ${historyRow.yearGroup} · ${historyRow.mode}`}
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            {historyRow && historyRow.history.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <th className="text-left py-2">Rate</th>
                    <th className="text-left py-2">Effective from</th>
                    <th className="text-left py-2">Changed by</th>
                    <th className="text-left py-2">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {historyRow.history.map((h, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      <td className="py-2 font-medium">AED {h.rate ?? "—"}</td>
                      <td className="py-2 text-slate-600">{h.from}</td>
                      <td className="py-2 text-slate-600">{h.by}</td>
                      <td className="py-2 text-slate-600">{h.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">No rate changes recorded yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PricingDialog({
  open, onClose, initial, subjects, onSave,
}: {
  open: boolean;
  onClose: () => void;
  initial: PricingRow | null;
  subjects: Subject[];
  onSave: (r: PricingRow, reason: string) => Promise<void>;
}) {
  const blank: PricingRow = useMemo(() => ({
    id: Math.random().toString(36).slice(2),
    subjectId: subjects[0]?.id ?? "",
    yearGroup: "",
    mode: "Group",
    duration: 60,
    rate: null,
    tier: "Standard (1x/wk)",
    minSessions: 1,
    cadence: "Termly",
    conditional: false,
    effectiveFrom: new Date().toISOString().slice(0, 10),
    active: true,
    history: [],
  }), [subjects]);

  const [form, setForm] = useState<PricingRow>(initial ?? blank);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initial ?? blank);
      setReason("");
      setSaving(false);
    }
  }, [open, initial, blank]);

  function update<K extends keyof PricingRow>(k: K, v: PricingRow[K]) {
    setForm((f) => {
      const next = { ...f, [k]: v };
      if (k === "tier" && v === "Top (4+/wk)") next.minSessions = 10;
      return next;
    });
  }

  const subject = subjects.find((s) => s.id === form.subjectId);

  async function handleSave() {
    if (initial && form.rate !== initial.rate && reason.trim() === "") return;
    setSaving(true);
    await onSave(form, reason);
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Course Row" : "New Course Row"}</DialogTitle>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Subject</Label>
              <select
                value={form.subjectId}
                onChange={(e) => update("subjectId", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white"
              >
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
              </select>
            </div>
            <div>
              <Label required>Year Group</Label>
              <Select
                value={form.yearGroup || (subject?.yearGroups[0] ?? "")}
                onChange={(v) => update("yearGroup", v)}
                options={subject?.yearGroups ?? []}
              />
            </div>
            <div>
              <Label required>Delivery Mode</Label>
              <Select value={form.mode} onChange={(v) => update("mode", v as DeliveryMode)} options={["Group", "1-to-1", "Trial"]} />
            </div>
            <div>
              <Label required>Session Duration (min)</Label>
              <TextInput type="number" value={form.duration} onChange={(v) => update("duration", Math.round(Number(v) || 0))} />
            </div>
            <div className="col-span-2">
              <Label required>Per-Session Rate (AED)</Label>
              <TextInput
                type="number"
                value={form.rate ?? ""}
                onChange={(v) => update("rate", v === "" ? null : Number(v))}
                placeholder="Leave blank if not yet confirmed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Leave blank if not yet confirmed — shows as &quot;Not set&quot; in amber on rate card.
              </p>
            </div>
            {form.mode === "Trial" && (
              <div className="col-span-2">
                <Label required>Trial Rate (AED)</Label>
                <TextInput type="number" value={form.trialRate ?? ""} onChange={(v) => update("trialRate", v === "" ? null : Number(v))} />
                <p className="text-[11px] text-slate-400 mt-1">IMI defaults: Primary AED 250, Secondary AED 300 — enter your rate.</p>
              </div>
            )}
            <div>
              <Label>Frequency Tier</Label>
              <Select
                value={form.tier}
                onChange={(v) => update("tier", v as FrequencyTier)}
                options={["None", "Standard (1x/wk)", "Mid (2x/wk)", "Next (3x/wk)", "Top (4+/wk)"]}
              />
              {form.tier === "Top (4+/wk)" && (
                <p className="text-[11px] text-amber-700 mt-1">Minimum 10 sessions required per PRD.</p>
              )}
            </div>
            <div>
              <Label>Min Sessions Required</Label>
              <TextInput type="number" value={form.minSessions} onChange={(v) => update("minSessions", Math.max(1, Number(v) || 1))} />
            </div>
            <div>
              <Label required>Billing Cadence</Label>
              <Select value={form.cadence} onChange={(v) => update("cadence", v as BillingCadence)} options={["Termly", "Monthly", "Weekly", "Annual", "One-off", "Per-session"]} />
            </div>
            <div>
              <Label>Rate Effective From</Label>
              <TextInput type="date" value={form.effectiveFrom} onChange={(v) => update("effectiveFrom", v)} />
            </div>

            <div className="col-span-2 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-3 mb-2">
                <Toggle checked={form.conditional} onChange={(v) => update("conditional", v)} />
                <span className="text-sm text-slate-700">Conditional rate</span>
              </div>
              {form.conditional && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Conditional Rate (AED)</Label>
                    <TextInput type="number" value={form.conditionalRate ?? ""} onChange={(v) => update("conditionalRate", Number(v) || 0)} />
                  </div>
                  <div>
                    <Label>Fallback Rate (AED)</Label>
                    <TextInput type="number" value={form.fallbackRate ?? ""} onChange={(v) => update("fallbackRate", Number(v) || 0)} />
                  </div>
                  <div className="col-span-2">
                    <Label>Condition</Label>
                    <TextInput value={form.condition ?? ""} onChange={(v) => update("condition", v)} placeholder="e.g. Only when enrolled in Maths + English with min 10 sessions each" />
                  </div>
                </div>
              )}
            </div>

            {initial && form.rate !== initial.rate && (
              <div className="col-span-2 bg-amber-50 border border-amber-200 rounded-md p-3 space-y-2">
                <p className="text-xs text-amber-900">
                  Previous rate: AED {initial.rate ?? "—"}
                </p>
                <Label required>Reason for rate change</Label>
                <TextInput value={reason} onChange={setReason} placeholder="Audit trail — required" />
              </div>
            )}

            <div className="flex items-center gap-3 col-span-2">
              <Toggle checked={form.active} onChange={(v) => update("active", v)} />
              <span className="text-sm text-slate-700">Active</span>
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={handleSave} disabled={saving || (initial !== null && form.rate !== initial.rate && reason.trim() === "")}>
            {saving ? "Saving…" : "Save Course Row"}
          </PrimaryBtn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab 3: Packages ──────────────────────────────────────────────────────────

function PackagesTab({
  packages, setPackages, onToast,
}: {
  packages: Package[];
  setPackages: (p: Package[]) => void;
  onToast: (m: string) => void;
}) {
  const { can } = usePermission();
  const canEdit = can("catalogue.edit");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Package | null>(null);

  function openNew() { setEditing(null); setDialogOpen(true); }
  function openEdit(p: Package) { setEditing(p); setDialogOpen(true); }

  function save(p: Package) {
    if (editing) setPackages(packages.map((x) => x.id === editing.id ? p : x));
    else setPackages([...packages, p]);
    onToast("Package saved");
    setDialogOpen(false);
  }

  function archiveOrReactivate(p: Package) {
    if (p.status === "Active" && p.activeEnrolments > 0) {
      setConfirmArchive(p);
      return;
    }
    setPackages(packages.map((x) => x.id === p.id ? { ...x, status: x.status === "Active" ? "Archived" : "Active" } : x));
    onToast(p.status === "Active" ? "Package archived" : "Package reactivated");
  }

  function doArchive() {
    if (!confirmArchive) return;
    setPackages(packages.map((x) => x.id === confirmArchive.id ? { ...x, status: "Archived" } : x));
    onToast("Package archived — active enrolments retained");
    setConfirmArchive(null);
  }

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">
        Packages bundle sessions at a fixed price. They replaced the abolished holiday pricing system. Appear as shortcuts in the invoice builder (M08).
      </p>

      <div className="flex items-center justify-between mb-4">
        <InfoChip>Used in: Invoice Builder (M08)</InfoChip>
        {canEdit && <PrimaryBtn onClick={openNew}><span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />New Package</span></PrimaryBtn>}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Package", "Linked Course", "Sessions", "Price (AED)", "Valid From", "Valid Until", "Enrolments", "Status", "Actions"].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {packages.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 text-sm font-medium text-slate-800">{p.name}</td>
                <td className="px-3 py-3 text-sm text-slate-600">{p.linkedCourse}</td>
                <td className="px-3 py-3 text-sm text-slate-600">{p.sessions}</td>
                <td className="px-3 py-3 text-sm font-medium text-slate-800">AED {p.price.toLocaleString()}</td>
                <td className="px-3 py-3 text-xs text-slate-600">{p.validFrom ?? "—"}</td>
                <td className="px-3 py-3 text-xs text-slate-600">{p.validUntil ?? "—"}</td>
                <td className="px-3 py-3 text-sm text-slate-600">{p.activeEnrolments}</td>
                <td className="px-3 py-3"><StatusPill status={p.status} /></td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button disabled={!canEdit} onClick={() => openEdit(p)} className="text-xs font-medium px-2 py-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer disabled:opacity-40">Edit</button>
                    <button disabled={!canEdit} onClick={() => archiveOrReactivate(p)} className="text-xs font-medium px-2 py-1 rounded text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer disabled:opacity-40">
                      {p.status === "Active" ? "Archive" : "Reactivate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PackageDialog open={dialogOpen} onClose={() => setDialogOpen(false)} initial={editing} onSave={save} />

      <Dialog open={!!confirmArchive} onOpenChange={(o) => { if (!o) setConfirmArchive(null); }}>
        <DialogContent className="max-w-md w-full">
          <DialogHeader>
            <DialogTitle>Archive package?</DialogTitle>
          </DialogHeader>
          {confirmArchive && (
            <div className="p-6 text-sm text-slate-700">
              This package has <strong>{confirmArchive.activeEnrolments}</strong> active enrolments. Archiving will not affect current students but no new enrolments will be possible. Confirm archive?
            </div>
          )}
          <DialogFooter className="flex justify-end gap-2">
            <GhostBtn onClick={() => setConfirmArchive(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={doArchive}>Confirm archive</PrimaryBtn>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PackageDialog({ open, onClose, initial, onSave }: {
  open: boolean;
  onClose: () => void;
  initial: Package | null;
  onSave: (p: Package) => void;
}) {
  const blank: Package = useMemo(() => ({
    id: Math.random().toString(36).slice(2),
    name: "",
    linkedCourse: "",
    sessions: 10,
    price: 0,
    makeup: true,
    proRata: false,
    regFee: false,
    revenueTag: "Primary",
    activeEnrolments: 0,
    status: "Active",
  }), []);

  const [form, setForm] = useState<Package>(initial ?? blank);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) { setForm(initial ?? blank); setError(""); }
  }, [open, initial, blank]);

  function update<K extends keyof Package>(k: K, v: Package[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSave() {
    if (!form.name.trim()) { setError("Package name required"); return; }
    if (!Number.isInteger(form.sessions)) { setError("Decimal sessions are not permitted"); return; }
    if (form.sessions <= 0) { setError("Session count must be at least 1"); return; }
    onSave(form);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Edit Package" : "New Package"}</DialogTitle></DialogHeader>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label required>Package Name</Label>
              <TextInput value={form.name} onChange={(v) => update("name", v)} placeholder="e.g. Term 3 — Primary Maths Y4–6" />
            </div>
            <div className="col-span-2">
              <Label required>Linked Course Row</Label>
              <TextInput value={form.linkedCourse} onChange={(v) => update("linkedCourse", v)} placeholder="Subject · Year · Mode" />
            </div>
            <div>
              <Label required>Session Count</Label>
              <TextInput type="number" value={form.sessions} onChange={(v) => update("sessions", Math.round(Number(v) || 0))} />
              <p className="text-[11px] text-slate-400 mt-1">Decimal sessions are not permitted.</p>
            </div>
            <div>
              <Label required>Headline Price (AED)</Label>
              <TextInput type="number" value={form.price} onChange={(v) => update("price", Number(v) || 0)} />
            </div>
            <div>
              <Label>Valid From</Label>
              <TextInput type="date" value={form.validFrom ?? ""} onChange={(v) => update("validFrom", v)} />
            </div>
            <div>
              <Label>Valid Until</Label>
              <TextInput type="date" value={form.validUntil ?? ""} onChange={(v) => update("validUntil", v)} />
            </div>
            <div className="flex items-center gap-3"><Toggle checked={form.makeup} onChange={(v) => update("makeup", v)} /><span className="text-sm text-slate-700">Makeup sessions</span></div>
            <div className="flex items-center gap-3"><Toggle checked={form.proRata} onChange={(v) => update("proRata", v)} /><span className="text-sm text-slate-700">Pro rata</span></div>
            <div>
              <Label>Weekly Sessions Cap</Label>
              <TextInput type="number" value={form.weeklyCap ?? ""} onChange={(v) => update("weeklyCap", v === "" ? undefined : Number(v))} />
            </div>
            <div className="flex items-center gap-3"><Toggle checked={form.regFee} onChange={(v) => update("regFee", v)} /><span className="text-sm text-slate-700">Registration fee</span></div>
            <div>
              <Label required>Revenue Tag</Label>
              <Select value={form.revenueTag} onChange={(v) => update("revenueTag", v as Package["revenueTag"])} options={["Primary", "Lower Secondary", "Senior", "Enrichment"]} />
            </div>
            <div className="flex items-center gap-3"><Toggle checked={form.status === "Active"} onChange={(v) => update("status", v ? "Active" : "Archived")} /><span className="text-sm text-slate-700">Active</span></div>
          </div>
          <p className="text-[11px] text-slate-400">Default off — full price applies unless enabled per enrolment.</p>
          {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-3 py-2 rounded-md">{error}</div>}
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={handleSave}>Save Package</PrimaryBtn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab 4: Topic Trees ───────────────────────────────────────────────────────

function TopicTreesTab({
  subjects, trees, setTrees, onToast,
}: {
  subjects: Subject[];
  trees: TopicTree;
  setTrees: (t: TopicTree) => void;
  onToast: (m: string) => void;
}) {
  const { can } = usePermission();
  const canEdit = can("topic.edit");

  const [selectedSubject, setSelectedSubject] = useState<string | null>(subjects[0]?.id ?? null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("All");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState<{ kind: "topic" } | { kind: "subtopic"; topicId: string } | { kind: "objective"; topicId: string; subtopicId: string } | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  const filteredSubjects = subjects.filter((s) =>
    (filterDept === "All" || s.department === filterDept) &&
    (search === "" || s.name.toLowerCase().includes(search.toLowerCase())) &&
    s.status === "Active"
  );

  const subject = subjects.find((s) => s.id === selectedSubject);
  const tree = selectedSubject ? trees[selectedSubject] ?? [] : [];

  function setTree(next: Topic[]) {
    if (!selectedSubject) return;
    setTrees({ ...trees, [selectedSubject]: next });
  }

  function addTopic() {
    if (!newLabel.trim()) return;
    setTree([...tree, { id: `t-${Date.now()}`, label: newLabel.trim(), subtopics: [] }]);
    setNewLabel(""); setAdding(null); onToast("Topic added");
  }

  function addSubtopic(topicId: string) {
    if (!newLabel.trim()) return;
    setTree(tree.map((t) => t.id === topicId ? { ...t, subtopics: [...t.subtopics, { id: `s-${Date.now()}`, label: newLabel.trim(), objectives: [] }] } : t));
    setNewLabel(""); setAdding(null); onToast("Subtopic added");
  }

  function addObjective(topicId: string, subtopicId: string) {
    if (!newLabel.trim()) return;
    setTree(tree.map((t) => t.id === topicId ? {
      ...t,
      subtopics: t.subtopics.map((s) => s.id === subtopicId ? { ...s, objectives: [...s.objectives, { id: `o-${Date.now()}`, label: newLabel.trim() }] } : s),
    } : t));
    setNewLabel(""); setAdding(null); onToast("Learning objective added");
  }

  function renameItem(id: string) {
    if (!editingLabel.trim()) { setEditingId(null); return; }
    setTree(tree.map((t) => {
      if (t.id === id) return { ...t, label: editingLabel };
      return {
        ...t,
        subtopics: t.subtopics.map((s) => {
          if (s.id === id) return { ...s, label: editingLabel };
          return { ...s, objectives: s.objectives.map((o) => o.id === id ? { ...o, label: editingLabel } : o) };
        }),
      };
    }));
    setEditingId(null);
    onToast("Saved");
  }

  function deleteItem(id: string) {
    setTree(
      tree
        .filter((t) => t.id !== id)
        .map((t) => ({
          ...t,
          subtopics: t.subtopics
            .filter((s) => s.id !== id)
            .map((s) => ({ ...s, objectives: s.objectives.filter((o) => o.id !== id) })),
        }))
    );
    onToast("Deleted");
  }

  const totalCount = tree.reduce((a, t) => a + 1 + t.subtopics.reduce((b, s) => b + 1 + s.objectives.length, 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Topic trees structure progress tracking (M19) and assignment tagging (M14). Topics must be set up before assignments can be created for a subject.
        </p>
        <InfoChip>Used by: Assignments (M14) · Progress Tracker (M19)</InfoChip>
      </div>

      <div className="flex gap-4" style={{ minHeight: 500 }}>
        <aside className="w-[280px] flex-shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          <div className="p-3 border-b border-slate-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded-md" />
            </div>
            <Select value={filterDept} onChange={setFilterDept} options={["All", ...DEPARTMENTS]} className="text-xs py-1.5" />
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            {filteredSubjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSubject(s.id)}
                className={cn(
                  "w-full text-left px-2.5 py-2 rounded-md flex items-center justify-between gap-2 cursor-pointer",
                  selectedSubject === s.id ? "bg-amber-50 text-amber-700" : "hover:bg-slate-50 text-slate-700"
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{s.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{s.department}</p>
                </div>
                <Pill className={cn("text-[10px]", trees[s.id]?.length ? "bg-emerald-50 text-emerald-700" : "")}>
                  {(trees[s.id]?.reduce((a, t) => a + 1 + t.subtopics.reduce((b, sub) => b + 1 + sub.objectives.length, 0), 0) ?? 0)}
                </Pill>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col">
          {subject ? (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{subject.name}</p>
                  <p className="text-xs text-slate-500">{subject.department} · {subject.yearGroups.join(", ")} · {totalCount} items</p>
                </div>
                {canEdit && (
                  <PrimaryBtn onClick={() => { setAdding({ kind: "topic" }); setNewLabel(""); }}>
                    <span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Add Topic</span>
                  </PrimaryBtn>
                )}
              </div>

              {!canEdit && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-900">
                  You are viewing topics in read-only mode. Ask your HOD or Academic Head to make changes.
                </div>
              )}

              {totalCount > 50 && (
                <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-start gap-2 text-xs text-amber-900">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  Deep nesting can make progress tracking harder to navigate. Consider consolidating subtopics.
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4">
                {tree.length === 0 ? (
                  <div className="text-center py-16">
                    <p className="text-sm text-slate-500 max-w-md mx-auto">
                      No topics added yet. Click &quot;Add Topic&quot; to build the topic tree for this subject. Topics are required before assignments can be tagged in M14.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tree.map((t) => {
                      const tOpen = expanded[t.id] !== false;
                      return (
                        <div key={t.id} className="border border-slate-200 rounded-md overflow-hidden">
                          <div className="bg-slate-50 px-3 py-2 flex items-center gap-2 group">
                            {canEdit && <GripVertical className="w-3.5 h-3.5 text-slate-300" />}
                            <button onClick={() => setExpanded({ ...expanded, [t.id]: !tOpen })} className="cursor-pointer">
                              {tOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                            </button>
                            {editingId === t.id ? (
                              <input autoFocus value={editingLabel} onChange={(e) => setEditingLabel(e.target.value)} onBlur={() => renameItem(t.id)} onKeyDown={(e) => e.key === "Enter" && renameItem(t.id)} className="flex-1 px-2 py-0.5 text-sm border border-amber-400 rounded" />
                            ) : (
                              <span className="flex-1 text-sm font-medium text-slate-800">{t.label}</span>
                            )}
                            {canEdit && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingId(t.id); setEditingLabel(t.label); }} className="p-1 hover:bg-slate-200 rounded cursor-pointer"><Pencil className="w-3 h-3 text-slate-500" /></button>
                                <button onClick={() => deleteItem(t.id)} className="p-1 hover:bg-rose-100 rounded cursor-pointer"><Trash2 className="w-3 h-3 text-rose-500" /></button>
                              </div>
                            )}
                          </div>
                          {tOpen && (
                            <div className="p-2 space-y-1">
                              {t.subtopics.map((sub) => {
                                const sOpen = expanded[sub.id] !== false;
                                return (
                                  <div key={sub.id} className="ml-4 border-l-2 border-slate-100 pl-3">
                                    <div className="py-1.5 flex items-center gap-2 group">
                                      {canEdit && <GripVertical className="w-3 h-3 text-slate-300" />}
                                      <button onClick={() => setExpanded({ ...expanded, [sub.id]: !sOpen })} className="cursor-pointer">
                                        {sOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                      </button>
                                      {editingId === sub.id ? (
                                        <input autoFocus value={editingLabel} onChange={(e) => setEditingLabel(e.target.value)} onBlur={() => renameItem(sub.id)} onKeyDown={(e) => e.key === "Enter" && renameItem(sub.id)} className="flex-1 px-2 py-0.5 text-sm border border-amber-400 rounded" />
                                      ) : (
                                        <span className="flex-1 text-sm text-slate-700">{sub.label}</span>
                                      )}
                                      {canEdit && (
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                          <button onClick={() => { setEditingId(sub.id); setEditingLabel(sub.label); }} className="p-1 hover:bg-slate-100 rounded cursor-pointer"><Pencil className="w-3 h-3 text-slate-500" /></button>
                                          <button onClick={() => deleteItem(sub.id)} className="p-1 hover:bg-rose-100 rounded cursor-pointer"><Trash2 className="w-3 h-3 text-rose-500" /></button>
                                        </div>
                                      )}
                                    </div>
                                    {sOpen && (
                                      <div className="ml-5 space-y-0.5">
                                        {sub.objectives.map((o) => (
                                          <div key={o.id} className="py-1 flex items-center gap-2 group">
                                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                                            {editingId === o.id ? (
                                              <input autoFocus value={editingLabel} onChange={(e) => setEditingLabel(e.target.value)} onBlur={() => renameItem(o.id)} onKeyDown={(e) => e.key === "Enter" && renameItem(o.id)} className="flex-1 px-2 py-0.5 text-sm border border-amber-400 rounded" />
                                            ) : (
                                              <span className="flex-1 text-sm text-slate-600">{o.label}</span>
                                            )}
                                            {canEdit && (
                                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                                <button onClick={() => { setEditingId(o.id); setEditingLabel(o.label); }} className="p-1 hover:bg-slate-100 rounded cursor-pointer"><Pencil className="w-3 h-3 text-slate-500" /></button>
                                                <button onClick={() => deleteItem(o.id)} className="p-1 hover:bg-rose-100 rounded cursor-pointer"><Trash2 className="w-3 h-3 text-rose-500" /></button>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                        {canEdit && adding?.kind === "objective" && adding.subtopicId === sub.id ? (
                                          <div className="flex items-center gap-2 py-1">
                                            <input autoFocus value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addObjective(t.id, sub.id)} placeholder="New learning objective…" className="flex-1 px-2 py-1 text-sm border border-amber-400 rounded" />
                                            <button onClick={() => addObjective(t.id, sub.id)} className="text-xs text-amber-600 font-medium cursor-pointer">Add</button>
                                            <button onClick={() => setAdding(null)} className="text-xs text-slate-400 cursor-pointer">Cancel</button>
                                          </div>
                                        ) : canEdit && (
                                          <button onClick={() => { setAdding({ kind: "objective", topicId: t.id, subtopicId: sub.id }); setNewLabel(""); }} className="text-[11px] text-amber-600 hover:text-amber-700 cursor-pointer py-1 ml-2">
                                            + Add learning objective
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              {canEdit && adding?.kind === "subtopic" && adding.topicId === t.id ? (
                                <div className="flex items-center gap-2 py-1 ml-4">
                                  <input autoFocus value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSubtopic(t.id)} placeholder="New subtopic…" className="flex-1 px-2 py-1 text-sm border border-amber-400 rounded" />
                                  <button onClick={() => addSubtopic(t.id)} className="text-xs text-amber-600 font-medium cursor-pointer">Add</button>
                                  <button onClick={() => setAdding(null)} className="text-xs text-slate-400 cursor-pointer">Cancel</button>
                                </div>
                              ) : canEdit && (
                                <button onClick={() => { setAdding({ kind: "subtopic", topicId: t.id }); setNewLabel(""); }} className="text-xs text-amber-600 hover:text-amber-700 cursor-pointer py-1 ml-4">
                                  + Add subtopic
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {canEdit && adding?.kind === "topic" && (
                      <div className="flex items-center gap-2 py-1">
                        <input autoFocus value={newLabel} onChange={(e) => setNewLabel(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTopic()} placeholder="New topic…" className="flex-1 px-3 py-2 text-sm border border-amber-400 rounded" />
                        <button onClick={addTopic} className="px-3 py-2 text-sm bg-amber-500 text-white rounded cursor-pointer">Add</button>
                        <button onClick={() => setAdding(null)} className="px-3 py-2 text-sm text-slate-500 cursor-pointer">Cancel</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Select a subject to view its topic tree.</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 5: Grade Boundaries ──────────────────────────────────────────────────

function GradeBoundariesTab({
  subjects, boundaries, setBoundaries, onToast,
}: {
  subjects: Subject[];
  boundaries: GradeBoundarySet[];
  setBoundaries: (b: GradeBoundarySet[]) => void;
  onToast: (m: string) => void;
}) {
  const { can } = usePermission();
  const canEdit = can("grades.edit");

  const [filterSubject, setFilterSubject] = useState("All");
  const [filterQual, setFilterQual] = useState("All");
  const [filterYear, setFilterYear] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GradeBoundarySet | null>(null);

  const filtered = boundaries.filter((b) =>
    (filterSubject === "All" || b.subject === filterSubject) &&
    (filterQual === "All" || b.qualification === filterQual) &&
    (filterYear === "All" || b.academicYear === filterYear)
  );

  function save(next: GradeBoundarySet) {
    if (editing) setBoundaries(boundaries.map((b) => b.id === editing.id ? next : b));
    else setBoundaries([...boundaries, next]);
    onToast("Grade boundaries saved");
    setDialogOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Grade boundaries define how percentage scores map to grade labels. Used by M19 to calculate predicted grades and by the assignment library (M14) for grading scales.
        </p>
        <InfoChip>Used by: Progress Tracker (M19) · Student Profile Grades tab</InfoChip>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <Select value={filterSubject} onChange={setFilterSubject} options={["All", ...Array.from(new Set(subjects.map((s) => s.name)))]} className="w-56" />
        <Select value={filterQual} onChange={setFilterQual} options={["All", "GCSE", "IGCSE", "A-Level", "International A-Level (IAL)", "IB Diploma", "IB MYP", "Primary Descriptor", "Custom"]} className="w-56" />
        <Select value={filterYear} onChange={setFilterYear} options={["All", "2024–25", "2025–26", "2026–27"]} className="w-36" />
        <div className="ml-auto">
          {canEdit && <PrimaryBtn onClick={() => { setEditing(null); setDialogOpen(true); }}><span className="inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />New Boundary Set</span></PrimaryBtn>}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {["Subject", "Qualification", "Specifier", "Grade Labels", "Academic Year", "Last Updated", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{b.subject}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{b.qualification}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{b.specifier ?? "—"}</td>
                <td className="px-4 py-3.5 text-xs text-slate-600">{b.rows.map((r) => r.label).join(" · ")}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{b.academicYear}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{b.updatedAt}</td>
                <td className="px-4 py-3.5">
                  <button disabled={!canEdit} onClick={() => { setEditing(b); setDialogOpen(true); }} className="text-xs font-medium px-2 py-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer disabled:opacity-40">Edit</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">No boundary sets match.</td></tr>}
          </tbody>
        </table>
      </div>

      <BoundaryDialog open={dialogOpen} onClose={() => setDialogOpen(false)} initial={editing} subjects={subjects} onSave={save} />
    </div>
  );
}

function BoundaryDialog({ open, onClose, initial, subjects, onSave }: {
  open: boolean;
  onClose: () => void;
  initial: GradeBoundarySet | null;
  subjects: Subject[];
  onSave: (b: GradeBoundarySet) => void;
}) {
  const blank: GradeBoundarySet = useMemo(() => ({
    id: Math.random().toString(36).slice(2),
    subject: subjects[0]?.name ?? "",
    qualification: "GCSE",
    specifier: "Higher Tier",
    examBoard: "AQA",
    academicYear: "2025–26",
    updatedAt: new Date().toISOString().slice(0, 10),
    rows: [{ label: "", min: 0, max: 100 }],
  }), [subjects]);

  const [form, setForm] = useState<GradeBoundarySet>(initial ?? blank);

  useEffect(() => { if (open) setForm(initial ?? blank); }, [open, initial, blank]);

  function update<K extends keyof GradeBoundarySet>(k: K, v: GradeBoundarySet[K]) { setForm((f) => ({ ...f, [k]: v })); }

  function updateRow(i: number, patch: Partial<GradeRow>) {
    update("rows", form.rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  }
  function addRow() { update("rows", [...form.rows, { label: "", min: 0, max: 0 }]); }
  function removeRow(i: number) { update("rows", form.rows.filter((_, idx) => idx !== i)); }

  const sortedRows = [...form.rows].sort((a, b) => a.min - b.min);
  let gap = false, overlap = false;
  for (let i = 0; i < sortedRows.length; i++) {
    const r = sortedRows[i];
    if (r.min < 0 || r.max > 100 || r.min > r.max) overlap = true;
    if (i > 0 && sortedRows[i - 1].max >= r.min) overlap = true;
    if (i > 0 && sortedRows[i - 1].max + 1 < r.min) gap = true;
  }
  const missingLow = sortedRows.length > 0 && sortedRows[0].min !== 0;
  const missingHigh = sortedRows.length > 0 && sortedRows[sortedRows.length - 1].max !== 100;

  const valid = form.rows.length > 0 && !overlap && !gap && !missingLow && !missingHigh && form.rows.every((r) => r.label.trim());

  const showSpecifier = ["GCSE", "IGCSE", "A-Level", "International A-Level (IAL)", "IB Diploma", "IB MYP"].includes(form.qualification);
  const specifierOptions =
    form.qualification === "GCSE" || form.qualification === "IGCSE" ? ["Higher Tier", "Foundation Tier", "Extended", "Core"] :
    form.qualification === "A-Level" || form.qualification === "International A-Level (IAL)" ? ["AS Level", "A2 Level", "Full A-Level"] :
    form.qualification === "IB Diploma" ? ["HL", "SL", "AA-HL", "AA-SL", "AI-HL", "AI-SL"] :
    form.qualification === "IB MYP" ? ["Standard", "Extended"] : [];

  const showExamBoard = ["GCSE", "IGCSE", "A-Level", "International A-Level (IAL)", "IB Diploma"].includes(form.qualification);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial ? "Edit Boundary Set" : "New Boundary Set"}</DialogTitle></DialogHeader>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Subject</Label>
              <Select value={form.subject} onChange={(v) => update("subject", v)} options={Array.from(new Set(subjects.map((s) => s.name)))} />
            </div>
            <div>
              <Label required>Qualification Route</Label>
              <Select value={form.qualification} onChange={(v) => update("qualification", v)} options={["GCSE", "IGCSE", "A-Level", "International A-Level (IAL)", "IB Diploma", "IB MYP", "Primary Descriptor", "Custom"]} />
            </div>
            {showSpecifier && (
              <div>
                <Label>Specifier</Label>
                <Select value={form.specifier ?? ""} onChange={(v) => update("specifier", v)} options={specifierOptions} />
              </div>
            )}
            {showExamBoard && (
              <div>
                <Label>Exam Board</Label>
                <Select value={form.examBoard ?? ""} onChange={(v) => update("examBoard", v)} options={["AQA", "Pearson Edexcel", "OCR", "WJEC", "CCEA", "Cambridge (CIE)", "IB Organisation"]} />
              </div>
            )}
            <div>
              <Label required>Academic Year</Label>
              <Select value={form.academicYear} onChange={(v) => update("academicYear", v)} options={["2024–25", "2025–26", "2026–27"]} />
            </div>
          </div>

          <div>
            <Label>Grade Rows</Label>
            <div className="space-y-2">
              {form.rows.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <TextInput value={r.label} onChange={(v) => updateRow(i, { label: v })} placeholder="Grade" className="w-24" />
                  <TextInput type="number" value={r.min} onChange={(v) => updateRow(i, { min: Number(v) || 0 })} className="w-24" />
                  <span className="text-xs text-slate-400">–</span>
                  <TextInput type="number" value={r.max} onChange={(v) => updateRow(i, { max: Number(v) || 0 })} className="w-24" />
                  <span className="text-xs text-slate-400">%</span>
                  <button onClick={() => removeRow(i)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <GhostBtn onClick={addRow}>+ Add grade</GhostBtn>
            </div>
            {!valid && (
              <div className="mt-2 text-xs text-rose-600">
                {overlap && <p>• Ranges overlap or are inverted</p>}
                {gap && <p>• Gaps between ranges</p>}
                {missingLow && <p>• Must start at 0%</p>}
                {missingHigh && <p>• Must end at 100%</p>}
                {form.rows.some((r) => !r.label.trim()) && <p>• All grades need labels</p>}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2">
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={() => onSave(form)} disabled={!valid}>Save Boundaries</PrimaryBtn>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab 6: Feedback Selectors ────────────────────────────────────────────────

function FeedbackSelectorsTab({
  deptSelectors, setDeptSelectors,
  overrides, setOverrides,
  subjects, onToast,
}: {
  deptSelectors: DeptSelectors[];
  setDeptSelectors: (d: DeptSelectors[]) => void;
  overrides: SubjectOverride[];
  setOverrides: (o: SubjectOverride[]) => void;
  subjects: Subject[];
  onToast: (m: string) => void;
}) {
  const { can } = usePermission();
  const canEdit = can("feedback.selectors.edit");

  const [selectedDept, setSelectedDept] = useState<Department>("Primary");
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState<Selector>({ id: "", name: "", type: "Single-Select Enum", options: [], required: true });
  const [newOption, setNewOption] = useState("");
  const [overrideSubject, setOverrideSubject] = useState("");
  const [showAddOverride, setShowAddOverride] = useState(false);

  const dept = deptSelectors.find((d) => d.department === selectedDept)!;

  function updateDept<K extends keyof DeptSelectors>(k: K, v: DeptSelectors[K]) {
    setDeptSelectors(deptSelectors.map((d) => d.department === selectedDept ? { ...d, [k]: v } : d));
  }

  function saveSelector() {
    if (!form.name.trim()) return;
    const list = dept.selectors;
    const exists = list.find((s) => s.id === form.id);
    const next = exists ? list.map((s) => s.id === form.id ? form : s) : [...list, { ...form, id: `sel-${Date.now()}` }];
    updateDept("selectors", next);
    setAddingNew(false);
    setForm({ id: "", name: "", type: "Single-Select Enum", options: [], required: true });
    onToast("Selector saved");
  }

  function removeSelector(id: string) {
    updateDept("selectors", dept.selectors.filter((s) => s.id !== id));
    onToast("Selector removed");
  }

  function editSelector(s: Selector) {
    setForm({ ...s });
    setAddingNew(true);
  }

  function addOverride() {
    if (!overrideSubject) return;
    if (overrides.some((o) => o.subjectId === overrideSubject)) return;
    setOverrides([...overrides, { subjectId: overrideSubject, selectors: dept.selectors.map((s) => ({ ...s, id: `${s.id}-o-${Date.now()}` })) }]);
    setShowAddOverride(false);
    setOverrideSubject("");
    onToast("Override added");
  }

  function resetOverride(subjectId: string) {
    setOverrides(overrides.filter((o) => o.subjectId !== subjectId));
    onToast("Reset to department default");
  }

  const deptSubjects = subjects.filter((s) => s.department === selectedDept);
  const deptOverrides = overrides.filter((o) => deptSubjects.some((s) => s.id === o.subjectId));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-slate-500">
          Feedback selectors are the structured options teachers use when completing per-session feedback (M07). Each department has a base selector set. Individual subjects can override.
        </p>
        <InfoChip>Used by: Per-class Feedback (M07) · Communication Log</InfoChip>
      </div>

      <div className="flex gap-4" style={{ minHeight: 500 }}>
        <aside className="w-[280px] flex-shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="p-2">
            {DEPARTMENTS.map((d) => {
              const s = deptSelectors.find((x) => x.department === d);
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDept(d)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-md cursor-pointer",
                    selectedDept === d ? "bg-amber-50 text-amber-700" : "hover:bg-slate-50 text-slate-700"
                  )}
                >
                  <span className="text-sm font-medium">{d}</span>
                  <Pill>{s?.selectors.length ?? 0}</Pill>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="flex-1 bg-white border border-slate-200 rounded-lg p-5 space-y-5">
          <div>
            <p className="text-sm font-semibold text-slate-800">{selectedDept} Feedback Selectors</p>
            <p className="text-xs text-slate-500">Flows into M07 parent summaries.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <Toggle checked={dept.aiSummary} onChange={(v) => updateDept("aiSummary", v)} disabled={!canEdit} />
              <span className="text-sm text-slate-700">AI Summary</span>
            </div>
            <div>
              <Label>Feedback Window</Label>
              <TextInput value={dept.window} onChange={(v) => updateDept("window", v)} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-700">Selector Set</p>
              {canEdit && !addingNew && (
                <GhostBtn onClick={() => { setAddingNew(true); setForm({ id: "", name: "", type: "Single-Select Enum", options: [], required: true }); }}>+ Add Selector</GhostBtn>
              )}
            </div>

            <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase border-b border-slate-200">
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Type</th>
                    <th className="text-left px-3 py-2">Options</th>
                    <th className="text-left px-3 py-2">Required</th>
                    <th className="text-left px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {dept.selectors.map((s) => (
                    <tr key={s.id} className="border-b border-slate-100">
                      <td className="px-3 py-2 text-sm font-medium">{s.name}</td>
                      <td className="px-3 py-2 text-xs text-slate-600">{s.type}</td>
                      <td className="px-3 py-2 text-xs text-slate-600 max-w-xs truncate">{s.options.join(" / ") || "—"}</td>
                      <td className="px-3 py-2">{s.required ? <Pill className="bg-amber-50 text-amber-700">Required</Pill> : <span className="text-slate-300">—</span>}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button disabled={!canEdit} onClick={() => editSelector(s)} className="text-xs text-slate-500 hover:text-slate-900 px-2 py-1 rounded hover:bg-slate-100 cursor-pointer disabled:opacity-40">Edit</button>
                          <button disabled={!canEdit} onClick={() => removeSelector(s.id)} className="text-xs text-rose-500 hover:text-rose-700 px-2 py-1 rounded hover:bg-rose-50 cursor-pointer disabled:opacity-40">Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {addingNew && (
              <div className="mt-3 p-4 border border-amber-200 bg-amber-50/40 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Selector Name</Label>
                    <TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Engagement" />
                  </div>
                  <div>
                    <Label required>Type</Label>
                    <Select value={form.type} onChange={(v) => setForm({ ...form, type: v as SelectorType })} options={["Star Rating 1–5", "Numeric Scale", "Checkbox List", "Single-Select Enum", "Free-text Prompt"]} />
                  </div>
                  {(form.type === "Single-Select Enum" || form.type === "Checkbox List") && (
                    <div className="col-span-2">
                      <Label>Options</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {form.options.map((o, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded text-xs">
                            {o}
                            <button onClick={() => setForm({ ...form, options: form.options.filter((_, idx) => idx !== i) })} className="cursor-pointer"><X className="w-3 h-3" /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <TextInput value={newOption} onChange={setNewOption} placeholder="Add option…" className="flex-1" />
                        <GhostBtn onClick={() => { if (newOption.trim()) { setForm({ ...form, options: [...form.options, newOption.trim()] }); setNewOption(""); } }}>Add</GhostBtn>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 col-span-2">
                    <Toggle checked={form.required} onChange={(v) => setForm({ ...form, required: v })} />
                    <span className="text-sm text-slate-700">Required</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <GhostBtn onClick={() => setAddingNew(false)}>Cancel</GhostBtn>
                  <PrimaryBtn onClick={saveSelector}>Save Selector</PrimaryBtn>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Subject Overrides</p>
                <p className="text-[11px] text-slate-400">Override replaces (not adds to) the department selector set for this subject.</p>
              </div>
              {canEdit && !showAddOverride && (
                <GhostBtn onClick={() => setShowAddOverride(true)}>+ Add Subject Override</GhostBtn>
              )}
            </div>
            {showAddOverride && (
              <div className="flex gap-2 mb-3">
                <Select value={overrideSubject} onChange={setOverrideSubject} options={["", ...deptSubjects.filter((s) => !overrides.some((o) => o.subjectId === s.id)).map((s) => s.id)]} />
                <PrimaryBtn onClick={addOverride}>Add</PrimaryBtn>
                <GhostBtn onClick={() => setShowAddOverride(false)}>Cancel</GhostBtn>
              </div>
            )}
            {deptOverrides.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No subject overrides. Department defaults apply.</p>
            ) : (
              <div className="space-y-1">
                {deptOverrides.map((o) => {
                  const s = subjects.find((x) => x.id === o.subjectId);
                  return (
                    <div key={o.subjectId} className="flex items-center justify-between px-3 py-2 border border-slate-200 rounded-md bg-white">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{s?.name}</span>
                        <Pill className="bg-amber-50 text-amber-700">Override ({o.selectors.length})</Pill>
                      </div>
                      <div className="flex items-center gap-2">
                        <button disabled={!canEdit} className="text-xs text-slate-500 hover:text-slate-900 cursor-pointer disabled:opacity-40">Edit</button>
                        <button disabled={!canEdit} onClick={() => resetOverride(o.subjectId)} className="text-xs text-rose-500 hover:text-rose-700 cursor-pointer disabled:opacity-40">Reset to default</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type TabId = "subjects" | "pricing" | "packages" | "topics" | "grades" | "feedback";

const TABS: { id: TabId; label: string }[] = [
  { id: "subjects", label: "Subjects" },
  { id: "pricing", label: "Pricing Matrix" },
  { id: "packages", label: "Packages" },
  { id: "topics", label: "Topic Trees" },
  { id: "grades", label: "Grade Boundaries" },
  { id: "feedback", label: "Feedback Selectors" },
];

export default function SubjectsCatalogueSection() {
  const [activeTab, setActiveTab] = useState<TabId>("subjects");
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [pricing, setPricing] = useState<PricingRow[]>(INITIAL_PRICING);
  const [packages, setPackages] = useState<Package[]>(INITIAL_PACKAGES);
  const [trees, setTrees] = useState<TopicTree>(INITIAL_TOPIC_TREES);
  const [boundaries, setBoundaries] = useState<GradeBoundarySet[]>(INITIAL_BOUNDARIES);
  const [deptSelectors, setDeptSelectors] = useState<DeptSelectors[]>(INITIAL_DEPT_SELECTORS);
  const [overrides, setOverrides] = useState<SubjectOverride[]>([]);
  const [depts, setDepts] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState<string | null>(null);
  function showToast(m: string) { setToast(m); }

  useEffect(() => {
    Promise.all([
      fetch("/api/settings/departments").then((r) => r.json()),
      fetch("/api/courses").then((r) => r.json()),
    ]).then(([ds, catalogData]) => {
      setDepts(
        (ds as { id: string; name: string }[]).map((d) => ({ id: d.id, name: d.name }))
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSubjects((catalogData.subjects ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        code: s.code ?? "",
        department: (s.department ?? "") as typeof s.department,
        yearGroups: s.yearGroups ?? [],
        phase: s.phase ?? "",
        description: s.description ?? "",
        colour: s.colour ?? "bg-amber-500",
        status: s.isActive ? "Active" : "Archived",
        duration: (s.sessionDurationMins ?? 60) as 45 | 60 | 120,
        maxStudents: s.maxStudents ?? 6,
        allowsMakeup: s.allowsMakeup ?? true,
        requiresAssessment: s.requiresAssessment ?? false,
        billingCadenceDefault: s.billingCadenceDefault ?? "Termly",
        gradingScale: s.gradingScale ?? "Percentage (0–100%)",
        weighting: s.weighting ?? { classwork: 10, homework: 20, test: 40, other: 30 },
        qualificationRoutes: s.qualificationRoutes ?? [],
        examBoards: s.examBoards ?? [],
        examCountdown: s.examCountdown ?? false,
        conditionalRate: s.conditionalRate ?? false,
        conditionDescription: s.conditionDescription ?? undefined,
      })));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPricing((catalogData.courses ?? []).map((c: any) => ({
        id: c.id,
        subjectId: c.subjectId,
        yearGroup: c.yearGroup ?? "",
        mode: (c.mode ?? "Group") as "Group" | "1-to-1" | "Trial",
        duration: c.sessionDurationMins ?? 60,
        rate: c.ratePerSession != null ? Number(c.ratePerSession) : null,
        trialRate: c.trialRate != null ? Number(c.trialRate) : undefined,
        tier: (c.tier ?? "None") as typeof c.tier,
        minSessions: c.minSessions ?? 1,
        cadence: (c.billingCadence ?? "Termly") as typeof c.billingCadence,
        conditional: c.conditional ?? false,
        conditionalRate: c.conditionalRateVal != null ? Number(c.conditionalRateVal) : undefined,
        condition: c.conditionText ?? undefined,
        fallbackRate: c.fallbackRate != null ? Number(c.fallbackRate) : undefined,
        effectiveFrom: c.effectiveFrom ?? "",
        active: c.isActive,
        history: c.rateHistory ?? [],
      })));

      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="-mx-8 -my-8 px-8 py-8 max-w-none">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Subjects &amp; Catalogue</h2>
          <p className="text-sm text-slate-500 mt-1">
            Authoritative source for academic and commercial data — feeds scheduling, billing, assignments, progress and feedback.
          </p>
        </div>
      </div>

      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer -mb-px",
                activeTab === t.id
                  ? "border-amber-500 text-amber-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-4">
        {loading && (
          <div className="flex items-center justify-center py-16 text-sm text-slate-400">
            Loading catalogue…
          </div>
        )}
        {!loading && activeTab === "subjects" && <SubjectsTab subjects={subjects} setSubjects={setSubjects} depts={depts} onToast={showToast} />}
        {!loading && activeTab === "pricing" && <PricingTab subjects={subjects} rows={pricing} setRows={setPricing} onToast={showToast} />}
        {activeTab === "packages" && <PackagesTab packages={packages} setPackages={setPackages} onToast={showToast} />}
        {activeTab === "topics" && <TopicTreesTab subjects={subjects} trees={trees} setTrees={setTrees} onToast={showToast} />}
        {activeTab === "grades" && <GradeBoundariesTab subjects={subjects} boundaries={boundaries} setBoundaries={setBoundaries} onToast={showToast} />}
        {activeTab === "feedback" && <FeedbackSelectorsTab deptSelectors={deptSelectors} setDeptSelectors={setDeptSelectors} overrides={overrides} setOverrides={setOverrides} subjects={subjects} onToast={showToast} />}
      </div>

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
