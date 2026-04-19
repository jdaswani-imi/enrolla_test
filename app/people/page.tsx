"use client";

import { Suspense, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  Clipboard,
  Download,
  FileText,
  Filter,
  GraduationCap,
  GripVertical,
  Layers,
  LayoutGrid,
  Pin,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { SortableHeader } from "@/components/ui/sortable-header";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  peopleAll,
  duplicateDetections,
  segments,
  students,
  extendedGuardians,
  leads,
  staffMembers,
  studentOutstandingBalance,
  broadcastLists,
  broadcastListExclusions,
  forms,
  formSubmissions,
  formSubmissionFields,
  exportHistory,
  type PersonRecord,
  type PersonType,
  type DuplicateDetection,
  type DuplicateThreshold,
  type DuplicateStatus,
  type Segment,
  type SegmentScope,
  type SegmentRecordType,
  type BroadcastList,
  type Form,
} from "@/lib/mock-data";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "blue" | "green" | "amber" | "red" | "slate";
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex flex-col gap-1",
        accent === "blue"  && "border-l-4 border-l-blue-400",
        accent === "green" && "border-l-4 border-l-emerald-400",
        accent === "amber" && "border-l-4 border-l-amber-400",
        accent === "red"   && "border-l-4 border-l-red-400",
        accent === "slate" && "border-l-4 border-l-slate-300",
      )}
    >
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={cn(
        "text-xl font-bold",
        accent === "blue"  && "text-blue-600",
        accent === "green" && "text-emerald-600",
        accent === "amber" && "text-amber-600",
        accent === "red"   && "text-red-600",
        (!accent || accent === "slate") && "text-slate-800",
      )}>
        {value}
      </p>
    </div>
  );
}

function InlineStatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: "red" | "green" | "slate" | "amber" | "blue";
}) {
  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 px-4 py-3 flex flex-col gap-0.5">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className={cn(
        "text-lg font-bold",
        color === "red"   && "text-red-600",
        color === "green" && "text-emerald-600",
        color === "amber" && "text-amber-600",
        color === "slate" && "text-slate-700",
        color === "blue"  && "text-blue-600",
      )}>
        {value}
      </p>
    </div>
  );
}

function TypeBadge({ type }: { type: PersonType }) {
  const cfg: Record<PersonType, string> = {
    Student:  "bg-blue-100 text-blue-700",
    Guardian: "bg-emerald-100 text-emerald-700",
    Lead:     "bg-amber-100 text-amber-700",
    Staff:    "bg-slate-100 text-slate-600",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", cfg[type])}>
      {type}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "enrolled" || s === "active"
      ? "bg-emerald-100 text-emerald-700"
      : s === "withdrawn" || s === "inactive"
      ? "bg-slate-100 text-slate-600"
      : s === "paused"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-600";
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", cls)}>
      {status}
    </span>
  );
}

function ChurnBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-400 text-xs">—</span>;
  const level = score >= 70 ? "High" : score >= 40 ? "Medium" : "Low";
  const cls =
    level === "High"   ? "bg-red-100 text-red-700" :
    level === "Medium" ? "bg-amber-100 text-amber-700" :
                         "bg-emerald-100 text-emerald-700";
  return <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", cls)}>{level}</span>;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveTab = "Overview" | "Duplicates" | "Segments" | "Broadcast" | "Forms" | "Exports";

// ─── Tab 1 — Directory ────────────────────────────────────────────────────────

function parsePeopleDate(s: string): number {
  const [datePart, timePart = "00:00"] = s.split(" ");
  const [dd, mm, yyyy] = datePart.split("/");
  return new Date(`${yyyy}-${mm}-${dd}T${timePart}`).getTime();
}

function DirectoryTab({ setActiveTab }: { setActiveTab: (tab: ActiveTab) => void }) {
  const router = useRouter();

  const recentRecords = useMemo(() => {
    return [...peopleAll]
      .sort((a, b) => parsePeopleDate(b.createdOn) - parsePeopleDate(a.createdOn))
      .slice(0, 10);
  }, []);

  const cards = [
    {
      icon: GraduationCap,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      title: "Students",
      subtitle: "312 records",
      stats: "Enrolled: 287  |  Paused: 14  |  Withdrawn: 11",
      href: "/students",
    },
    {
      icon: Users,
      iconBg: "bg-green-50",
      iconColor: "text-green-600",
      title: "Guardians",
      subtitle: "198 records",
      stats: "DNC: 4  |  Unsubscribed: 12  |  WhatsApp: 174",
      href: "/guardians",
    },
    {
      icon: Filter,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      title: "Leads",
      subtitle: "47 records",
      stats: "New: 8  |  In Progress: 23  |  Won: 16",
      href: "/leads",
    },
    {
      icon: Briefcase,
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
      title: "Staff",
      subtitle: "41 records",
      stats: "Active: 38  |  On Leave: 2  |  Offboarded: 1",
      href: "/staff",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Section 1 — Record Directories */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Record Directories
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map(({ icon: Icon, iconBg, iconColor, title, subtitle, stats, href }) => (
            <div
              key={title}
              onClick={() => router.push(href)}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn("rounded-lg p-2", iconBg)}>
                    <Icon className={cn("w-5 h-5", iconColor)} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{title}</p>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); router.push(href); }}
                  className="text-sm font-medium text-amber-600 hover:text-amber-700 whitespace-nowrap cursor-pointer shrink-0"
                >
                  Open {title} →
                </button>
              </div>
              <p className="text-xs text-slate-400">{stats}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Section — Quick Tools */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Quick Tools
        </p>
        <div className="grid grid-cols-3 gap-4">
          {([
            {
              icon: Layers,
              iconBg: "bg-blue-50",
              iconColor: "text-blue-600",
              title: "Segments",
              subtitle: "14 active segments",
              description: "Build dynamic contact groups for targeting and automation",
              tab: "Segments" as ActiveTab,
            },
            {
              icon: FileText,
              iconBg: "bg-purple-50",
              iconColor: "text-purple-600",
              title: "Forms",
              subtitle: "5 active forms · 341 submissions",
              description: "Manage lead enquiry, profile update, and custom forms",
              tab: "Forms" as ActiveTab,
            },
            {
              icon: Download,
              iconBg: "bg-green-50",
              iconColor: "text-green-600",
              title: "Exports",
              subtitle: "12 exports this month",
              description: "Export contact lists as Standard CSV or Google Contacts",
              tab: "Exports" as ActiveTab,
            },
          ] as const).map(({ icon: Icon, iconBg, iconColor, title, subtitle, description, tab }) => (
            <div
              key={title}
              onClick={() => setActiveTab(tab)}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className={cn("rounded-lg p-2 flex-shrink-0", iconBg)}>
                  <Icon className={cn("w-5 h-5", iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-sm text-slate-500">{subtitle}</p>
                  <p className="text-xs text-slate-400 mt-1">{description}</p>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setActiveTab(tab); }}
                className="text-sm font-medium text-amber-600 hover:text-amber-700 text-left cursor-pointer"
              >
                Open {title} →
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 — Recent Record Activity */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Recent Record Activity
        </p>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Name</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Type</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap hidden md:table-cell">Created On</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map(p => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{p.name}</td>
                    <td className="px-4 py-3"><TypeBadge type={p.type} /></td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap hidden md:table-cell">{p.createdOn}</td>
                    <td className="px-4 py-3">
                      <button className="px-3 py-1 text-xs font-medium text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400 text-center py-3 italic">
            View full directory in each section above
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2 — Duplicates ───────────────────────────────────────────────────────

type ReviewStep = 1 | 2 | 3;

function DuplicateReviewSheet({
  dup,
  onClose,
  onMerged,
  onRequestMerge,
}: {
  dup: DuplicateDetection;
  onClose: () => void;
  onMerged: () => void;
  onRequestMerge: () => void;
}) {
  const { can } = usePermission();
  const canMerge = can('merge.duplicates');
  const [step, setStep]       = useState<ReviewStep>(1);
  const [fieldChoices, setFc] = useState<Record<string, "A" | "B">>({
    Phone: "A", Email: "A", "Year Group": "A",
  });

  const diffFields = [
    { label: "Phone",      valA: dup.recordA.phone, valB: dup.recordB.phone },
    { label: "Email",      valA: dup.recordA.email, valB: dup.recordB.email },
    { label: "Year Group", valA: "Y9",              valB: "Y10"             },
  ];

  const stepper = (
    <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-center gap-0">
      {([1, 2, 3] as ReviewStep[]).map((s, i) => {
        const labels = ["Compare", "Merge Fields", "Confirm"];
        const done   = step > s;
        const active = step === s;
        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2",
                done   ? "bg-emerald-500 border-emerald-500 text-white" :
                active ? "bg-amber-500 border-amber-500 text-white"    :
                         "bg-white border-slate-300 text-slate-400"
              )}>
                {s}
              </div>
              <span className={cn("text-xs font-medium whitespace-nowrap",
                active ? "text-amber-600" : done ? "text-emerald-600" : "text-slate-400"
              )}>
                {labels[i]}
              </span>
            </div>
            {s < 3 && <div className={cn(
              "w-16 h-0.5 mx-3 mb-4 transition-colors",
              step > s ? "bg-emerald-400" : "bg-slate-200",
            )} />}
          </div>
        );
      })}
    </div>
  );

  const footer =
    step === 1 ? (
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
          Keep Separate
        </button>
        {canMerge ? (
          <button onClick={() => setStep(2)} className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer">
            Proceed to Merge →
          </button>
        ) : (
          <button onClick={() => { onRequestMerge(); onClose(); }} className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer">
            Request Merge
          </button>
        )}
      </div>
    ) : step === 2 ? (
      <div className="flex justify-end gap-3">
        <button onClick={() => setStep(1)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
          ← Back
        </button>
        <button onClick={() => setStep(3)} className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer">
          Confirm Merge →
        </button>
      </div>
    ) : (
      <div className="flex justify-end gap-3">
        <button onClick={() => setStep(2)} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
          Go Back
        </button>
        <button
          onClick={() => { onMerged(); onClose(); }}
          className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
        >
          Merge Records
        </button>
      </div>
    );

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{`Duplicate Review — ${dup.matchScore}% match`}</DialogTitle>
          <DialogDescription>{`${dup.recordA.name} · ${dup.recordB.name}`}</DialogDescription>
        </DialogHeader>
        {stepper}
        <div className="p-6">

      {step === 1 && (
        <div className="grid grid-cols-2 gap-6">
          {[
            { label: "Record A", rec: dup.recordA, color: "border-l-blue-400" },
            { label: "Record B", rec: dup.recordB, color: "border-l-amber-400" },
          ].map(({ label, rec, color }) => (
            <div key={label} className={cn("bg-white rounded-xl border border-slate-200 border-l-4 p-4 space-y-2", color)}>
              <p className={cn("text-sm font-semibold", label === "Record A" ? "text-blue-700" : "text-amber-600")}>
                {label}
              </p>
              {([
                ["Full Name",  rec.name,      dup.recordA.name      !== dup.recordB.name],
                ["Phone",      rec.phone,     dup.recordA.phone     !== dup.recordB.phone],
                ["Email",      rec.email,     dup.recordA.email     !== dup.recordB.email],
                ["Type",       rec.type,      dup.recordA.type      !== dup.recordB.type],
                ["Created On", rec.createdOn, dup.recordA.createdOn !== dup.recordB.createdOn],
              ] as [string, string, boolean][]).map(([k, v, differs]) => (
                <div key={k} className={cn("rounded-lg px-3 py-2", differs ? "bg-amber-50 border border-amber-200" : "bg-slate-50")}>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{k}</p>
                  <p className="text-sm font-medium text-slate-800">{v}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            For each differing field, choose which value to keep.
          </p>
          <div className="space-y-3">
            {diffFields.map(({ label, valA, valB }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{label}</p>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <input type="radio" checked={fieldChoices[label] === "A"} onChange={() => setFc(prev => ({ ...prev, [label]: "A" }))} className="accent-amber-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Record A</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{valA}</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 rounded-lg px-3 py-2">
                    <input type="radio" checked={fieldChoices[label] === "B"} onChange={() => setFc(prev => ({ ...prev, [label]: "B" }))} className="accent-amber-500" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">Record B</p>
                      <p className="text-sm font-medium text-slate-700 truncate">{valB}</p>
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
            <p className="text-sm font-semibold text-slate-700">
              Merging <span className="text-blue-700">{dup.recordA.name}</span> into <span className="text-amber-600">{dup.recordB.name}</span>
            </p>
            <div className="space-y-1 pt-1">
              {diffFields.map(({ label, valA, valB }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">{label}:</span>
                  <span>{fieldChoices[label] === "A" ? valA : valB}</span>
                  <span className="text-xs text-slate-400">(from Record {fieldChoices[label]})</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <span className="text-red-600 text-lg leading-none mt-0.5">⚠</span>
            <p className="text-sm font-semibold text-red-700">This cannot be undone</p>
          </div>
        </div>
      )}
        </div>
        <div className="border-t border-slate-200 bg-slate-50 p-4 rounded-b-xl">
          {footer}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DuplicatesTab() {
  const { can } = usePermission();
  const [typeFilter, setType]     = useState<string[]>([]);
  const [tierFilter, setTier]     = useState<string[]>([]);
  const [statusFilter, setStatus] = useState<string[]>([]);
  const [reviewing, setReviewing] = useState<DuplicateDetection | null>(null);
  const [toast, setToast]         = useState<string | null>(null);

  function fireToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const filtered = useMemo(() => duplicateDetections.filter(d => {
    if (typeFilter.length > 0) {
      const types = [d.recordA.type, d.recordB.type];
      if (!typeFilter.some(t => types.includes(t as PersonType))) return false;
    }
    if (tierFilter.length > 0 && !tierFilter.includes(d.threshold)) return false;
    if (statusFilter.length > 0 && !statusFilter.includes(d.status)) return false;
    return true;
  }), [typeFilter, tierFilter, statusFilter]);

  const pending    = duplicateDetections.filter(d => d.status === "Pending").length;
  const resolved   = duplicateDetections.filter(d => d.status === "Resolved").length;
  const dismissed  = duplicateDetections.filter(d => d.status === "Dismissed").length;

  const TIER_CONFIG: Record<DuplicateThreshold, string> = {
    High:   "bg-red-100 text-red-700",
    Medium: "bg-amber-100 text-amber-700",
    Low:    "bg-slate-100 text-slate-600",
  };

  const STATUS_CONFIG: Record<DuplicateStatus, string> = {
    Pending:   "bg-amber-100 text-amber-700",
    Resolved:  "bg-emerald-100 text-emerald-700",
    Dismissed: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="space-y-4">
      {/* Inline stats */}
      <div className="flex gap-3">
        <InlineStatCard label="Pending Review"        value={pending}   color="red"   />
        <InlineStatCard label="Resolved This Month"   value={resolved}  color="green" />
        <InlineStatCard label="Auto-Dismissed"        value={dismissed} color="slate" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectFilter label="Record Type" options={["Student", "Guardian", "Lead", "Staff"]} selected={typeFilter} onChange={setType} />
        <MultiSelectFilter label="Tier" options={["High", "Medium", "Low"]} selected={tierFilter} onChange={setTier} />
        <MultiSelectFilter label="Status" options={["Pending", "Resolved", "Dismissed"]} selected={statusFilter} onChange={setStatus} />
        {(typeFilter.length > 0 || tierFilter.length > 0 || statusFilter.length > 0) && (
          <button
            onClick={() => { setType([]); setTier([]); setStatus([]); }}
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
                {["Record A", "Record B", "Score", "Matched Fields", "Tier", "Status", "Detected", "Action"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 text-sm whitespace-nowrap">{d.recordA.name}</div>
                    <div className="text-xs text-slate-400">{d.recordA.type}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 text-sm whitespace-nowrap">{d.recordB.name}</div>
                    <div className="text-xs text-slate-400">{d.recordB.type}</div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{d.matchScore}%</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{d.matchedFields.join(", ")}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", TIER_CONFIG[d.threshold])}>
                      {d.threshold}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", STATUS_CONFIG[d.status])}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">{d.detected}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => d.status === "Pending" && can('students.merge') ? setReviewing(d) : (d.status !== "Pending" ? undefined : undefined)}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap",
                        d.status === "Pending" && can('students.merge')
                          ? "text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100"
                          : "text-slate-600 border-slate-200 bg-white hover:bg-slate-50"
                      )}
                    >
                      {d.status === "Pending" ? "Review" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState icon={Filter} title="No duplicates found" description="No duplicate detections match your current filters." />
          )}
        </div>
      </div>

      {reviewing && (
        <DuplicateReviewSheet
          dup={reviewing}
          onClose={() => setReviewing(null)}
          onMerged={() => fireToast("Records merged successfully")}
          onRequestMerge={() => fireToast("Merge request sent to Admin Head for approval")}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Tab 3 — Segments ────────────────────────────────────────────────────────

function NewSegmentSlideover({ onClose }: { onClose: () => void }) {
  const { can } = usePermission();
  const [name, setName]           = useState("");
  const [scope, setScope]         = useState<SegmentScope>("Personal");
  const [recType, setRecType]     = useState<SegmentRecordType>("Students");
  const [filters, setFilters]     = useState([{ id: 1, field: "", operator: "is", value: "" }]);
  const [previewed, setPreviewed] = useState(false);
  let nextId = 2;

  function addFilter() {
    setFilters(prev => [...prev, { id: nextId++, field: "", operator: "is", value: "" }]);
  }
  function removeFilter(id: number) {
    setFilters(prev => prev.filter(f => f.id !== id));
  }

  return (
    <>
      <div className="fade-in fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="slide-in-right fixed right-0 top-0 h-full w-[560px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <p className="font-semibold text-slate-800 text-base">New Segment</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block" htmlFor="seg-name">Name</label>
            <input
              id="seg-name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Y9–Y11 Active Students"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium mb-2">Scope</p>
            <div className="flex gap-4">
              {(["Personal", "Org-Wide"] as SegmentScope[]).map(s => (
                <label key={s} className={cn("flex items-center gap-2", s === "Org-Wide" && !can('people.createOrgSegment') ? "cursor-not-allowed opacity-40" : "cursor-pointer")}>
                  <input
                    type="radio"
                    checked={scope === s}
                    onChange={() => setScope(s)}
                    disabled={s === "Org-Wide" && !can('people.createOrgSegment')}
                    className="accent-amber-500"
                  />
                  <span className="text-sm text-slate-700">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block" htmlFor="seg-rectype">Record Type</label>
            <select
              id="seg-rectype"
              value={recType}
              onChange={e => setRecType(e.target.value as SegmentRecordType)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
            >
              {["Students", "Guardians", "Leads", "Staff"].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium mb-2">Filter criteria</p>
            <div className="space-y-2">
              {filters.map(f => (
                <div key={f.id} className="flex items-center gap-2">
                  <select className="flex-1 border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer">
                    <option value="">Field…</option>
                    <option>Status</option>
                    <option>Year Group</option>
                    <option>Department</option>
                    <option>Churn Risk</option>
                    <option>Created On</option>
                  </select>
                  <select className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer">
                    {["is", "is not", "contains", "greater than", "less than"].map(o => <option key={o}>{o}</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Value…"
                    className="flex-1 border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <button onClick={() => removeFilter(f.id)} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addFilter}
              className="mt-2 flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />Add filter
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPreviewed(true)}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Preview
            </button>
            {previewed && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                ~47 matching records
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-white">
          <button className="flex-1 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer">
            Save Segment
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

function ViewSegmentSheet({
  seg,
  onClose,
  onAction,
}: {
  seg: Segment;
  onClose: () => void;
  onAction: (msg: string) => void;
}) {
  const router = useRouter();
  const previewMembers = [
    { name: "Aisha Rahman",      type: "Student" as PersonType, status: "Enrolled" },
    { name: "Omar Al-Farsi",     type: "Student" as PersonType, status: "Enrolled" },
    { name: "Layla Hassan",      type: "Student" as PersonType, status: "Enrolled" },
    { name: "Faris Qasim",       type: "Student" as PersonType, status: "Enrolled" },
    { name: "Khalid Mansoor",    type: "Student" as PersonType, status: "Enrolled" },
    { name: "Sara Nasser",       type: "Student" as PersonType, status: "Enrolled" },
    { name: "Hamdan Al-Maktoum", type: "Student" as PersonType, status: "Enrolled" },
    { name: "Dana Al-Zaabi",     type: "Student" as PersonType, status: "Enrolled" },
  ];
  const preview = previewMembers.slice(0, Math.min(10, seg.members));
  const criteriaTags = seg.filterSummary.split(/\s+AND\s+|\s*,\s*/).filter(Boolean);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{seg.name}</DialogTitle>
          <DialogDescription>{`${seg.scope} · ${seg.recordType} · ${seg.members.toLocaleString()} members`}</DialogDescription>
        </DialogHeader>
        <div className="p-6">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Filter summary</p>
          <div className="flex flex-wrap gap-2">
            {criteriaTags.map((t, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                {t.trim()}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            First {preview.length} of {seg.members.toLocaleString()} members
          </p>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  {["Name", "Type", "Status"].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map(m => (
                  <tr key={m.name} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 text-sm font-medium text-slate-800">{m.name}</td>
                    <td className="px-3 py-2"><TypeBadge type={m.type} /></td>
                    <td className="px-3 py-2"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => { onClose(); router.push("/students"); }}
            className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium cursor-pointer"
          >
            View all {seg.members.toLocaleString()} in {seg.recordType} →
          </button>
        </div>
      </div>
        </div>
        <div className="border-t border-slate-200 bg-slate-50 p-4 rounded-b-xl">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAction("Segment deleted")}
              className="px-4 py-2 border border-red-200 bg-white text-red-700 text-sm font-semibold rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
            >
              Delete Segment
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => onAction("Segment edit opened")}
                className="px-4 py-2 border border-slate-200 bg-white text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Edit Segment
              </button>
              <button
                onClick={() => onAction("Segment export queued")}
                className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
              >
                Export Segment
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SegmentsTab() {
  const { can } = usePermission();
  const [scopeFilter, setScopeFilter]   = useState<SegmentScope | "All">("All");
  const [typeFilter, setTypeFilter]     = useState<string[]>([]);
  const [search, setSearch]             = useState("");
  const [newOpen, setNewOpen]           = useState(false);
  const [viewing, setViewing]           = useState<Segment | null>(null);
  const [sortField, setSortField]       = useState<string | null>(null);
  const [sortDir, setSortDir]           = useState<"asc" | "desc">("asc");
  const [toast, setToast]               = useState<string | null>(null);

  function fireToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  function toggleSort(f: string) {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("asc"); }
  }

  const filtered = useMemo(() => {
    let data = segments.filter(s => {
      if (scopeFilter !== "All" && s.scope !== scopeFilter) return false;
      if (typeFilter.length > 0 && !typeFilter.includes(s.recordType)) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
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
  }, [scopeFilter, typeFilter, search, sortField, sortDir]);

  const orgWide  = segments.filter(s => s.scope === "Org-Wide").length;
  const personal = segments.filter(s => s.scope === "Personal").length;

  return (
    <div className="space-y-4">
      {/* Inline stats */}
      <div className="flex gap-3">
        <InlineStatCard label="Total Segments" value={segments.length} color="slate" />
        <InlineStatCard label="Org-Wide"        value={orgWide}         color="slate" />
        <InlineStatCard label="Personal"        value={personal}        color="amber" />
      </div>

      {/* Filters + New button */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Scope toggle */}
        <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
          {(["All", "Org-Wide", "Personal"] as const).map(s => (
            <button
              key={s}
              onClick={() => setScopeFilter(s)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                scopeFilter === s
                  ? "bg-amber-500 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <MultiSelectFilter label="Record Type" options={["Students", "Guardians", "Leads", "Staff"]} selected={typeFilter} onChange={setTypeFilter} />
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search segments…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        {can('people.createSegment') && (
          <button
            onClick={() => setNewOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />New Segment
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <SortableHeader label="Segment Name"   field="name"          sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Scope"          field="scope"         sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Record Type"    field="recordType"    sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell" />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap hidden lg:table-cell">Filter Summary</th>
                <SortableHeader label="Members"        field="members"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Last Refreshed" field="lastRefreshed" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="hidden lg:table-cell" />
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap hidden xl:table-cell">Created By</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(seg => (
                <tr key={seg.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{seg.name}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold",
                      seg.scope === "Org-Wide" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {seg.scope}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap hidden md:table-cell">{seg.recordType}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 max-w-[200px] truncate hidden lg:table-cell">
                    {seg.filterSummary}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-slate-700">{seg.members.toLocaleString()}</span>
                      <button className="p-0.5 text-slate-400 hover:text-amber-500 transition-colors cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap hidden lg:table-cell">{seg.lastRefreshed}</td>
                  <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap hidden xl:table-cell">{seg.createdBy}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewing(seg)} className="text-xs text-slate-600 hover:text-amber-600 font-medium cursor-pointer transition-colors">View</button>
                      {can('people.createSegment') && (
                        <>
                          <span className="text-slate-300">|</span>
                          <button className="text-xs text-slate-600 hover:text-amber-600 font-medium cursor-pointer transition-colors">Edit</button>
                        </>
                      )}
                      {can('people.export') && (
                        <>
                          <span className="text-slate-300">|</span>
                          <button className="text-xs text-slate-600 hover:text-amber-600 font-medium cursor-pointer transition-colors">Export</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState icon={Layers} title="No segments found" description="No segments match your current filters." />
          )}
        </div>
      </div>

      {newOpen  && <NewSegmentSlideover onClose={() => setNewOpen(false)} />}
      {viewing  && (
        <ViewSegmentSheet
          seg={viewing}
          onClose={() => setViewing(null)}
          onAction={(msg) => { fireToast(msg); setViewing(null); }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Tab 4 — Broadcast Lists ─────────────────────────────────────────────────

function NewBroadcastListSheet({ onClose }: { onClose: () => void }) {
  const [name, setName]         = useState("");
  const [listType, setListType] = useState<"Manual" | "Auto">("Manual");

  return (
    <>
      <div className="fade-in fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="slide-in-right fixed right-0 top-0 h-full w-[480px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <p className="font-semibold text-slate-800 text-base">New List</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block" htmlFor="bl-name">Name</label>
            <input
              id="bl-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. IGCSE Parents Group"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium mb-2">Type</p>
            <div className="flex gap-6">
              {(["Manual", "Auto-managed"] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={listType === (t === "Manual" ? "Manual" : "Auto")}
                    onChange={() => setListType(t === "Manual" ? "Manual" : "Auto")}
                    className="accent-amber-500"
                  />
                  <span className="text-sm text-slate-700">{t}</span>
                </label>
              ))}
            </div>
          </div>

          {listType === "Auto" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
              <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Configure the automation rule in /automations after saving.</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-white">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button className="flex-1 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer">
            Create List
          </button>
        </div>
      </div>
    </>
  );
}

function ManageBroadcastListSheet({
  list,
  onClose,
  onAction,
}: {
  list: BroadcastList;
  onClose: () => void;
  onAction: (msg: string) => void;
}) {
  const router = useRouter();
  const [memberSearch, setMemberSearch] = useState("");
  const [addMember, setAddMember]       = useState("");
  const [tplCopied, setTplCopied]       = useState(false);
  const exclusions = broadcastListExclusions[list.id] ?? [];
  const listType = list.autoRule ? "Auto-managed" : "Manual";

  async function copyTemplate() {
    const template = `Hi {first_name}, this is a message for the ${list.name} list from IMI.`;
    try {
      await navigator.clipboard.writeText(template);
      setTplCopied(true);
      setTimeout(() => setTplCopied(false), 2000);
    } catch {
      onAction("Copy failed — please copy manually");
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl w-full max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{list.name}</DialogTitle>
          <DialogDescription>{`${list.members} members · ${listType}`}</DialogDescription>
        </DialogHeader>
        <div className="p-6 flex-1 overflow-y-auto">
      <div className="space-y-6">
        {/* Members */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Members</p>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="w-10 px-3 py-2"></th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Name</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Type</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">How Added</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {list.membersList.slice(0, 8).map((m, i) => {
                    const ini = m.name.split(" ").map(n => n[0]).join("").slice(0, 2);
                    return (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <span className="text-xs font-semibold text-slate-600">{ini}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-slate-800 truncate">{m.name}</td>
                        <td className="px-3 py-2"><TypeBadge type={m.type} /></td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-semibold",
                            m.addedBy === "Auto" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                          )}>
                            {m.addedBy}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => onAction(`${m.name} removed`)}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  value={memberSearch}
                  onChange={e => setMemberSearch(e.target.value)}
                  placeholder="Search by name…"
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                value={addMember}
                onChange={e => setAddMember(e.target.value)}
                placeholder="Add member by name or email…"
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                onClick={() => { if (addMember) { onAction(`${addMember} added`); setAddMember(""); } }}
                className="px-3 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Auto-Rule */}
          {list.autoRule && list.autoRuleName && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Auto-Rule</p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-medium text-slate-800">{list.autoRuleName}</p>
                </div>
                <button
                  onClick={() => router.push("/automations")}
                  className="text-xs text-amber-600 cursor-pointer hover:text-amber-700 transition-colors"
                >
                  Edit this rule in Automations →
                </button>
              </div>
            </div>
          )}

          {/* Exclusions */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Exclusions</p>
            {exclusions.length === 0 ? (
              <p className="text-sm text-slate-400">No exclusions</p>
            ) : (
              <div className="space-y-2">
                {exclusions.map((ex, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <p className="text-sm text-slate-700">{ex.name}</p>
                    <button
                      onClick={() => onAction(`Exclusion removed for ${ex.name}`)}
                      className="text-xs text-amber-600 hover:text-amber-700 transition-colors cursor-pointer"
                    >
                      Remove exclusion
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

      </div>
        </div>
        <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 p-4 rounded-b-xl">
          <div className="flex justify-end items-center gap-2">
            <button
              onClick={copyTemplate}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Clipboard className="w-4 h-4" />{tplCopied ? "Copied!" : "Copy message template"}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function BroadcastListsTab() {
  const { can } = usePermission();
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Auto" | "Manual">("All");
  const [newOpen, setNewOpen]       = useState(false);
  const [managing, setManaging]     = useState<BroadcastList | null>(null);
  const [toast, setToast]           = useState<string | null>(null);

  function fireToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const autoCount       = broadcastLists.filter(l => l.autoRule).length;
  const totalRecipients = broadcastLists.reduce((s, l) => s + l.members, 0);

  const filtered = useMemo(() => broadcastLists.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter === "Auto" && !l.autoRule) return false;
    if (typeFilter === "Manual" && l.autoRule) return false;
    return true;
  }), [search, typeFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <InlineStatCard label="Active Lists"     value={broadcastLists.length} color="slate" />
        <InlineStatCard label="Auto-Managed"     value={autoCount}             color="blue"  />
        <InlineStatCard label="Total Recipients" value={totalRecipients}       color="green" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search lists…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
          {(["All", "Auto", "Manual"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
                typeFilter === t ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {t === "Auto" ? "Auto-managed" : t}
            </button>
          ))}
        </div>
        {can('people.manageBroadcasts') && (
        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />New List
        </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["List Name", "Members", "Type", "Last Updated", "Action"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(list => (
                <tr key={list.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{list.name}</td>
                  <td className="px-4 py-3 text-slate-600">{list.members}</td>
                  <td className="px-4 py-3">
                    {list.autoRule ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                        <Zap className="w-3 h-3" />Auto-managed
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">Manual</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{list.lastUpdated}</td>
                  <td className="px-4 py-3">
                    {can('people.manageBroadcasts') && (
                    <button
                      onClick={() => setManaging(list)}
                      className="px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                    >
                      Manage
                    </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState icon={Users} title="No lists found" description="No broadcast lists match your current filters." />
          )}
        </div>
      </div>

      {newOpen  && <NewBroadcastListSheet onClose={() => setNewOpen(false)} />}
      {managing && (
        <ManageBroadcastListSheet
          list={managing}
          onClose={() => setManaging(null)}
          onAction={fireToast}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Tab 5 — Forms ────────────────────────────────────────────────────────────

function ShareFormSheet({ form, onClose }: { form: Form; onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const [toast, setToast]   = useState<string | null>(null);

  async function handleCopy(which: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      setTimeout(() => setCopied(curr => (curr === which ? null : curr)), 2000);
    } catch {
      setToast("Copy failed — please copy manually");
      setTimeout(() => setToast(null), 2500);
    }
  }

  const slug = form.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const url  = `https://forms.enrolla.app/imi/${slug}`;
  const embed = `<iframe src="${url}" width="100%" height="600"></iframe>`;

  const statusBadge = (
    <span className={cn(
      "px-2.5 py-1 rounded-full text-xs font-semibold",
      form.status === "Active"   ? "bg-emerald-100 text-emerald-700" :
      form.status === "Draft"    ? "bg-amber-100 text-amber-700"     :
                                    "bg-slate-100 text-slate-600",
    )}>
      {form.status}
    </span>
  );

  return (
    <>
      <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
        <DialogContent className="max-w-lg w-full max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <DialogTitle>{form.name}</DialogTitle>
              {statusBadge}
            </div>
          </DialogHeader>
          <div className="p-6">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Standalone URL</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={url}
                onFocus={e => e.currentTarget.select()}
                className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                onClick={() => handleCopy("url", url)}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex-shrink-0"
              >
                <Clipboard className="w-3.5 h-3.5" />{copied === "url" ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Embed Code</p>
            <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-2 overflow-x-auto">
              <code className="text-sm text-slate-700 font-mono whitespace-pre">{embed}</code>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => handleCopy("code", embed)}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Clipboard className="w-3.5 h-3.5" />{copied === "code" ? "Copied!" : "Copy code"}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">QR Code</p>
            <div className="flex flex-col items-center gap-3">
              <div className="h-36 w-36 bg-slate-50 border border-slate-200 rounded flex flex-col items-center justify-center gap-1">
                <QrCode className="w-12 h-12 text-slate-400" />
                <span className="text-xs font-semibold text-slate-400 tracking-wide">QR</span>
              </div>
              <button
                onClick={() => setToast("QR download — Phase 2")}
                className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white text-slate-700 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />Download QR
              </button>
            </div>
          </div>
        </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-50 p-4 rounded-b-xl">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-slate-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg fade-in">
          {toast}
        </div>
      )}
    </>
  );
}

function SubmissionReviewSheet({
  form,
  submissionId,
  onClose,
  onAction,
}: {
  form: Form;
  submissionId: string;
  onClose: () => void;
  onAction: (msg: string, markReviewed?: boolean) => void;
}) {
  const sub = formSubmissions.find(s => s.id === submissionId);
  const fields = formSubmissionFields[submissionId] ?? [];
  if (!sub) return null;

  return (
    <Sheet open={true} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-[560px] sm:max-w-[560px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Submission — {sub.submittedBy}</SheetTitle>
          <SheetDescription>{form.name} · {sub.submittedAt}</SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-4 space-y-4">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold",
              sub.status === "New" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
            )}>
              {sub.status}
            </span>
            <span className="bg-slate-100 rounded px-2 py-0.5 text-xs text-slate-700">{sub.linkedRecord}</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="grid grid-cols-1 gap-x-6 gap-y-3">
              {fields.map(f => (
                <div key={f.label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">{f.label}</span>
                  <span className="text-sm font-medium text-slate-900">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              onClick={() => { onAction("Marked as reviewed", true); onClose(); }}
              className="px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              Mark as Reviewed
            </button>
            {form.type === "Lead Enquiry" && (
              <button
                onClick={() => onAction("Lead created from submission")}
                className="px-4 py-2 border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
              >
                Create Lead from submission
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-auto px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SubmissionsSheet({
  form,
  onClose,
  onAction,
}: {
  form: Form;
  onClose: () => void;
  onAction: (msg: string) => void;
}) {
  const [statusFilter, setStatusFilter]     = useState<"All" | "New" | "Reviewed">("All");
  const [reviewingId, setReviewingId]       = useState<string | null>(null);
  const [reviewedIds, setReviewedIds]       = useState<Set<string>>(new Set());

  const subs = formSubmissions.filter(s => s.formId === form.id);
  const filtered = useMemo(() => subs.filter(s => {
    const effectiveStatus = reviewedIds.has(s.id) ? "Reviewed" : s.status;
    if (statusFilter === "All") return true;
    return effectiveStatus === statusFilter;
  }), [statusFilter, subs, reviewedIds]);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl w-full max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.name}</DialogTitle>
          <DialogDescription>{form.submissions} submissions · {form.status}</DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white overflow-hidden">
              {(["All", "New", "Reviewed"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                    statusFilter === s ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <input type="date" className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400" />
              <span className="text-slate-400 text-xs">–</span>
              <input type="date" className="border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400" />
            </div>
          </div>

          {/* Submissions table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState icon={Filter} title="No submissions" description="No submissions match your current filters." />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {["Submitted At", "Submitted By", "Status", "Linked Record", "Action"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(sub => {
                    const effectiveStatus = reviewedIds.has(sub.id) ? "Reviewed" : sub.status;
                    return (
                      <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-3 text-slate-500 whitespace-nowrap text-xs">{sub.submittedAt}</td>
                        <td className="px-3 py-3 font-medium text-slate-800 whitespace-nowrap">{sub.submittedBy}</td>
                        <td className="px-3 py-3">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-semibold",
                            effectiveStatus === "New" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {effectiveStatus}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <span className="bg-slate-100 rounded px-2 py-0.5 text-xs text-slate-700">{sub.linkedRecord}</span>
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => setReviewingId(sub.id)}
                            className="px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Form actions */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <button
              onClick={() => onAction("Form editor opened")}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Edit Form
            </button>
            <button
              onClick={() => onAction("Form duplicated")}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Duplicate
            </button>
            <button
              onClick={() => onAction("Form archived")}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Archive
            </button>
            <button
              onClick={() => onAction("Link copied")}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              <Clipboard className="w-4 h-4" />Copy form link
            </button>
          </div>
        </div>

        {reviewingId && (
          <SubmissionReviewSheet
            form={form}
            submissionId={reviewingId}
            onClose={() => setReviewingId(null)}
            onAction={(msg, markReviewed) => {
              if (markReviewed && reviewingId) {
                setReviewedIds(prev => new Set(prev).add(reviewingId));
              }
              onAction(msg);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function NewFormSheet({ onClose }: { onClose: () => void }) {
  const [name, setName]           = useState("");
  const [status, setStatus]       = useState<"Draft" | "Active">("Draft");
  const [autoCreate, setAutoCreate] = useState(false);
  const [sourceTag, setSourceTag]  = useState("");
  const [fields, setFields]       = useState([
    { id: 1, type: "Text", label: "", required: false },
    { id: 2, type: "Text", label: "", required: false },
  ]);

  function addField() {
    setFields(prev => [...prev, { id: Date.now(), type: "Text", label: "", required: false }]);
  }
  function removeField(id: number) {
    setFields(prev => prev.filter(f => f.id !== id));
  }
  function updateField(id: number, key: "type" | "label" | "required", value: string | boolean) {
    setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
  }

  return (
    <>
      <div className="fade-in fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="slide-in-right fixed right-0 top-0 h-full w-[640px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <p className="font-semibold text-slate-800 text-base">New Form</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block" htmlFor="nf-name">Name</label>
            <input
              id="nf-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Parent Satisfaction Survey"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium mb-2">Status</p>
            <div className="flex gap-6">
              {(["Draft", "Active"] as const).map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={status === s} onChange={() => setStatus(s)} className="accent-amber-500" />
                  <span className="text-sm text-slate-700">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <p className="text-xs text-slate-500 font-medium">Auto-create record</p>
              <button
                onClick={() => setAutoCreate(p => !p)}
                className={cn(
                  "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                  autoCreate ? "bg-amber-500" : "bg-slate-200"
                )}
              >
                <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform", autoCreate ? "translate-x-4" : "translate-x-0")} />
              </button>
            </div>
            {autoCreate && (
              <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer">
                <option>Create Lead in M01</option>
                <option>Create Student in M01</option>
              </select>
            )}
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block" htmlFor="nf-source">Source tag</label>
            <input
              id="nf-source"
              value={sourceTag}
              onChange={e => setSourceTag(e.target.value)}
              placeholder="e.g. website-enquiry-form"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium mb-2">Form fields</p>
            <div className="space-y-2">
              {fields.map(f => (
                <div key={f.id} className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <select
                    value={f.type}
                    onChange={e => updateField(f.id, "type", e.target.value)}
                    className="border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  >
                    {["Text", "Long Text", "Dropdown", "Multi-select", "Date", "Checkbox", "Radio"].map(t => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={f.label}
                    onChange={e => updateField(f.id, "label", e.target.value)}
                    placeholder="Field label…"
                    className="flex-1 border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={f.required}
                      onChange={e => updateField(f.id, "required", e.target.checked)}
                      className="accent-amber-500"
                    />
                    Required
                  </label>
                  <button onClick={() => removeField(f.id)} className="p-1 text-red-400 hover:text-red-600 transition-colors cursor-pointer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addField} className="mt-2 flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium cursor-pointer">
              <Plus className="w-3.5 h-3.5" />Add field
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-700 font-medium">Conditional logic — configure after saving in form editor</p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-4 border-t border-slate-200 bg-white">
          <button onClick={onClose} className="px-4 py-2 border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            Save as Draft
          </button>
          <button className="flex-1 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer">
            Save &amp; Activate
          </button>
        </div>
      </div>
    </>
  );
}

function FormsTab() {
  const { can } = usePermission();
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [newOpen, setNewOpen]         = useState(false);
  const [sharingForm, setSharingForm] = useState<Form | null>(null);
  const [viewingSubs, setViewingSubs] = useState<Form | null>(null);
  const [toast, setToast]             = useState<string | null>(null);

  function fireToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const activeCount = forms.filter(f => f.status === "Active").length;
  const draftCount  = forms.filter(f => f.status === "Draft").length;
  const totalSubs   = forms.reduce((s, f) => s + f.submissions, 0);

  const filtered = useMemo(() =>
    forms
      .filter(f => {
        if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (statusFilter.length > 0 && !statusFilter.includes(f.status)) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      }),
  [search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <InlineStatCard label="Active Forms"      value={activeCount} color="green" />
        <InlineStatCard label="Draft"             value={draftCount}  color="amber" />
        <InlineStatCard label="Total Submissions" value={totalSubs}   color="slate" />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search forms…"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <MultiSelectFilter
          label="Status"
          options={["Active", "Draft", "Archived"]}
          selected={statusFilter}
          onChange={setStatusFilter}
        />
        {can('people.manageForms') && (
        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />New Form
        </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Form Name</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Type</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Status</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Submissions</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap hidden md:table-cell">Last Submission</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap hidden lg:table-cell">Created By</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {f.pinned && <Pin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                      <span className="font-medium text-slate-800 whitespace-nowrap">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                      f.type === "Lead Enquiry"   ? "bg-amber-100 text-amber-700"   :
                      f.type === "Profile Update" ? "bg-blue-100 text-blue-700"     :
                                                    "bg-slate-100 text-slate-600"
                    )}>
                      {f.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                      f.status === "Active"   ? "bg-emerald-100 text-emerald-700" :
                      f.status === "Draft"    ? "bg-amber-100 text-amber-700"     :
                                                "bg-slate-100 text-slate-600"
                    )}>
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{f.submissions}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap hidden md:table-cell">
                    {f.lastSubmission ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap hidden lg:table-cell">{f.createdBy}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => f.status === "Active" ? setSharingForm(f) : undefined}
                        className={cn(
                          "text-xs font-medium transition-colors",
                          f.status === "Active"
                            ? "text-slate-600 hover:text-amber-600 cursor-pointer"
                            : "text-slate-300 cursor-not-allowed"
                        )}
                      >
                        Share
                      </button>
                      <span className="text-slate-300">|</span>
                      <button onClick={() => setViewingSubs(f)} className="text-xs font-medium text-slate-600 hover:text-amber-600 transition-colors cursor-pointer">
                        Submissions
                      </button>
                      <span className="text-slate-300">|</span>
                      {can('people.manageForms') && (
                      <button className="text-xs font-medium text-slate-600 hover:text-amber-600 transition-colors cursor-pointer">
                        Edit
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState icon={Filter} title="No forms found" description="No forms match your current filters." />
          )}
        </div>
      </div>

      {newOpen     && <NewFormSheet onClose={() => setNewOpen(false)} />}
      {sharingForm && <ShareFormSheet form={sharingForm} onClose={() => setSharingForm(null)} />}
      {viewingSubs && (
        <SubmissionsSheet
          form={viewingSubs}
          onClose={() => setViewingSubs(null)}
          onAction={fireToast}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Tab 6 — Exports ──────────────────────────────────────────────────────────

const EXPORT_FIELDS = [
  { key: "fullName",   label: "Full Name",           locked: false },
  { key: "yearGroup",  label: "Year Group",          locked: false },
  { key: "department", label: "Department",          locked: false },
  { key: "school",     label: "School",              locked: false },
  { key: "phone",      label: "Phone",               locked: false },
  { key: "email",      label: "Email",               locked: false },
  { key: "status",     label: "Status",              locked: false },
  { key: "churnRisk",  label: "Churn Risk Score",    locked: false },
  { key: "balance",    label: "Outstanding Balance", locked: false },
  { key: "attendance", label: "Attendance Rate",     locked: false },
  { key: "subjects",   label: "Subjects Enrolled",   locked: false },
  { key: "staff",      label: "Assigned Staff",      locked: false },
  { key: "createdOn",  label: "Created On",          locked: true  },
  { key: "dnc",        label: "DNC Status",          locked: true  },
];

function ExportsTab() {
  const { can } = usePermission();
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(["fullName", "yearGroup", "department", "school", "phone", "email", "status", "createdOn", "dnc"])
  );
  const [format, setFormat]     = useState<"Standard CSV" | "Google Contacts CSV">("Standard CSV");
  const [exported, setExported] = useState(false);

  function toggleField(key: string) {
    setSelectedFields(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleExport() {
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <InlineStatCard label="Exports This Month" value={exportHistory.length} color="slate" />
        <InlineStatCard label="Last Export"        value="Today 09:14"          color="blue"  />
      </div>

      {exported && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
          <p className="text-sm text-emerald-700 font-medium">Export queued — your file will download shortly</p>
        </div>
      )}

      {/* Section A — New Export */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <p className="font-semibold text-slate-900 mb-4">Configure Export</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-2">Record Type</p>
            <div className="flex flex-wrap gap-3">
              {["Students", "Guardians", "Leads", "Staff"].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={t === "Students" || t === "Guardians"}
                    className="accent-amber-500"
                  />
                  <span className="text-sm text-slate-700">{t}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-slate-500 font-medium mb-2">Format</p>
            <div className="flex gap-4">
              {(["Standard CSV", "Google Contacts CSV"] as const).map(f => (
                <label key={f} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={format === f}
                    onChange={() => setFormat(f)}
                    className="accent-amber-500"
                  />
                  <span className="text-sm text-slate-700">{f}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Department</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer">
              <option value="">All departments</option>
              <option>Primary</option>
              <option>Lower Secondary</option>
              <option>Senior</option>
              <option>Admin</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Status</label>
            <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer">
              <option value="">All statuses</option>
              <option>Active</option>
              <option>Enrolled</option>
              <option>Withdrawn</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className="text-xs text-slate-500 font-medium mb-1 block">Date range</label>
          <div className="flex items-center gap-2">
            <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
            <span className="text-slate-400">–</span>
            <input type="date" className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 font-medium mb-2">Fields to include</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">Created On and DNC Status are always included and cannot be removed.</p>
          </div>
          <div className="grid grid-cols-3 gap-y-2 gap-x-4">
            {EXPORT_FIELDS.filter(f => !f.locked).map(f => (
              <label key={f.key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedFields.has(f.key)}
                  onChange={() => toggleField(f.key)}
                  className="accent-amber-500"
                />
                <span className="text-xs text-slate-700">{f.label}</span>
              </label>
            ))}
            {EXPORT_FIELDS.filter(f => f.locked).map(f => (
              <label key={f.key} className="flex items-center gap-2 opacity-50 cursor-not-allowed pointer-events-none">
                <input type="checkbox" checked readOnly className="accent-amber-500" />
                <span className="text-xs text-slate-500">{f.label}</span>
              </label>
            ))}
          </div>
        </div>

        {can('people.export') && (
        <button
          onClick={handleExport}
          className="mt-5 w-full py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
        >
          Export
        </button>
        )}
      </div>

      {/* Section B — Export History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200">
          <p className="font-semibold text-slate-900">Export History</p>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded">Audit log — immutable</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {["#", "Exported By", "Format", "Record Types", "Filters", "Rows", "Exported At", "Download"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {exportHistory.map((rec, i) => (
                <tr key={rec.id} className={cn("border-b border-slate-100 hover:bg-slate-50 transition-colors", i % 2 === 1 && "bg-slate-50/60")}>
                  <td className="px-4 py-3 text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{rec.exportedBy}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap",
                      rec.format === "Standard CSV" ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"
                    )}>
                      {rec.format}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{rec.recordType}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs max-w-[180px] truncate">{rec.filtersApplied}</td>
                  <td className="px-4 py-3 text-slate-600">{rec.rowCount}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">{rec.exportedAt}</td>
                  <td className="px-4 py-3">
                    <button className="text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer transition-colors">
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Coming Soon Placeholder ──────────────────────────────────────────────────

function ComingSoonTab({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
        <LayoutGrid className="w-6 h-6 text-slate-400" />
      </div>
      <p className="text-base font-semibold text-slate-700">{label}</p>
      <p className="text-sm text-slate-400">Coming in next build</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS: { key: ActiveTab; label: string }[] = [
  { key: "Overview",   label: "Overview"        },
  { key: "Duplicates", label: "Duplicates"      },
  { key: "Segments",   label: "Segments"        },
  { key: "Broadcast",  label: "Broadcast Lists" },
  { key: "Forms",      label: "Forms"           },
  { key: "Exports",    label: "Exports"         },
];

function PeoplePageContent() {
  const { can } = usePermission();
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawTab = searchParams.get("tab");
  const activeTab: ActiveTab =
    rawTab && TABS.some((t) => t.key === rawTab)
      ? (rawTab as ActiveTab)
      : "Overview";

  function setActiveTab(key: ActiveTab) {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "Overview") {
      params.delete("tab");
    } else {
      params.set("tab", key);
    }
    router.push(`/people${params.size > 0 ? `?${params.toString()}` : ""}`);
  }

  if (!can('people.view')) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-4 min-h-0">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">People</h1>
        <p className="text-sm text-slate-500 mt-0.5">Unified directory of all contact records</p>
      </div>

      {/* Stat bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total Contacts" value="487" accent="slate" />
        <StatCard label="Students"       value="312" accent="blue"  />
        <StatCard label="Guardians"      value="198" accent="green" />
        <StatCard label="Staff"          value="41"  accent="amber" />
      </div>

      {/* Tab strip */}
      <div className="flex items-center gap-0 border-b border-slate-200 -mt-1 overflow-x-auto">
        {TABS.map(({ key, label }) => {
          if (key === "Exports" && !can('people.export')) return null;
          return (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap",
              activeTab === key
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {label}
          </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 pb-4">
        <div key={activeTab} className="page-enter">
          {activeTab === "Overview"   && <DirectoryTab setActiveTab={setActiveTab} />}
          {activeTab === "Duplicates" && <DuplicatesTab />}
          {activeTab === "Segments"   && <SegmentsTab />}
          {activeTab === "Broadcast"  && <BroadcastListsTab />}
          {activeTab === "Forms"      && <FormsTab />}
          {activeTab === "Exports"    && <ExportsTab />}
        </div>
      </div>
    </div>
  );
}

export default function PeoplePage() {
  return (
    <Suspense>
      <PeoplePageContent />
    </Suspense>
  );
}
