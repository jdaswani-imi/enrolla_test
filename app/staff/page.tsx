"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  MoreHorizontal,
  X,
  Plus,
  UserCheck,
  Clock,
  UserX,
  Eye,
  Edit2,
  Send,
  Download,
  Check,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { RoleBanner } from "@/components/ui/role-banner";
import { AccessDenied } from "@/components/ui/access-denied";
import { staffMembers, type StaffMember, type StaffStatus } from "@/lib/mock-data";
import { EmptyState } from "@/components/ui/empty-state";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { SortableHeader } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { ExportDialog } from "@/components/ui/export-dialog";
import {
  AddStaffDialog,
  DeactivateStaffDialog,
  type NewStaffData,
} from "@/components/staff/add-staff-dialog";
import {
  RequestLeaveDialog,
  type LeaveRequestSubmission,
} from "@/components/staff/request-leave-dialog";
import { currentUser } from "@/lib/mock-data";

// ─── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "bg-amber-100",   text: "text-amber-700"   },
  { bg: "bg-teal-100",    text: "text-teal-700"     },
  { bg: "bg-blue-100",    text: "text-blue-700"     },
  { bg: "bg-violet-100",  text: "text-violet-700"   },
  { bg: "bg-rose-100",    text: "text-rose-700"     },
  { bg: "bg-emerald-100", text: "text-emerald-700"  },
  { bg: "bg-indigo-100",  text: "text-indigo-700"   },
  { bg: "bg-orange-100",  text: "text-orange-700"   },
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

// ─── Role badge config ─────────────────────────────────────────────────────────

const ROLE_BADGE: Record<string, string> = {
  "Super Admin":   "bg-slate-800 text-white",
  "Admin Head":    "bg-indigo-100 text-indigo-700 border border-indigo-200",
  "Admin":         "bg-slate-100 text-slate-600 border border-slate-200",
  "HOD":           "bg-purple-100 text-purple-700 border border-purple-200",
  "Teacher":       "bg-teal-100 text-teal-700 border border-teal-200",
  "TA":            "bg-blue-100 text-blue-700 border border-blue-200",
  "HR-Finance":    "bg-orange-100 text-orange-700 border border-orange-200",
  "Academic Head": "bg-emerald-100 text-emerald-700 border border-emerald-200",
};

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<StaffStatus, string> = {
  "Active":       "bg-emerald-100 text-emerald-700 border border-emerald-200",
  "On Leave":     "bg-amber-100 text-amber-700 border border-amber-200",
  "Inactive":     "bg-slate-200 text-slate-700 border border-slate-300",
  "Suspended":    "bg-red-100 text-red-700 border border-red-200",
  "Off-boarded":  "bg-slate-100 text-slate-500 border border-slate-200",
};

// ─── Workload config ───────────────────────────────────────────────────────────

const WORKLOAD_BADGE: Record<string, string> = {
  "Low":      "bg-emerald-100 text-emerald-700",
  "Moderate": "bg-amber-100 text-amber-700",
  "High":     "bg-red-100 text-red-700",
};

const WORKLOAD_DOT: Record<string, string> = {
  "Low":      "bg-emerald-500",
  "Moderate": "bg-amber-500",
  "High":     "bg-red-500",
};

// ─── CPD progress bar ──────────────────────────────────────────────────────────

function CpdBar({ hours, target }: { hours: number; target: number }) {
  const pct = Math.min((hours / target) * 100, 100);
  const danger = hours < 10;
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", danger ? "bg-red-400" : "bg-amber-400")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={cn("text-xs tabular-nums shrink-0", danger ? "text-red-500" : "text-slate-500")}>
        {hours} / {target}
      </span>
    </div>
  );
}

// ─── RowActionsMenu ────────────────────────────────────────────────────────────

function RowActionsMenu({
  staff,
  isOpen,
  onOpen,
  onClose,
  onViewProfile,
  onEdit,
  onMarkOnLeave,
  onDeactivate,
}: {
  staff: StaffMember;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onViewProfile: () => void;
  onEdit: () => void;
  onMarkOnLeave: () => void;
  onDeactivate: () => void;
}) {
  const { can } = usePermission();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [isOpen, onClose]);

  const canEdit         = can('staff.edit');
  const canSetLeave     = can('staff.edit') && staff.status === "Active";
  const canDeactivate   = can('staff.revokeAccess') && staff.status !== "Inactive";

  return (
    <div ref={ref} className="relative flex justify-end">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); isOpen ? onClose() : onOpen(); }}
        aria-label="Row actions"
        className="w-7 h-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 min-w-[200px] py-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onViewProfile(); onClose(); }}
            className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 cursor-pointer text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            View profile
          </button>

          {canEdit && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEdit(); onClose(); }}
              className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 cursor-pointer text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 shrink-0" />
              Edit details
            </button>
          )}

          {canSetLeave && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onMarkOnLeave(); onClose(); }}
              className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 cursor-pointer text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              Mark as on leave
            </button>
          )}

          {canDeactivate && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDeactivate(); onClose(); }}
                className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 cursor-pointer text-red-600 hover:bg-red-50 transition-colors"
              >
                <Ban className="w-3.5 h-3.5 shrink-0" />
                Deactivate
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── CPD log mock data (shared) ────────────────────────────────────────────────

const CPD_LOG = [
  { activity: "Differentiation Strategies Workshop", date: "10 Mar 2026", hours: 3, type: "Training",   status: "Verified"   },
  { activity: "Reading: Cambridge Assessment Guide", date: "2 Feb 2026",  hours: 2, type: "Reading",    status: "Unverified" },
  { activity: "Regional Teachers Conference",        date: "15 Jan 2026", hours: 6, type: "Conference", status: "Verified"   },
  { activity: "Classroom Management Webinar",        date: "5 Dec 2024",  hours: 2, type: "Training",   status: "Queried"    },
];

const CPD_STATUS_BADGE: Record<string, string> = {
  "Verified":   "bg-emerald-100 text-emerald-700",
  "Unverified": "bg-slate-100 text-slate-600",
  "Queried":    "bg-amber-100 text-amber-700",
};

const CPD_STATUS_LABEL: Record<string, string> = {
  "Verified":   "Verified ✓",
  "Unverified": "Unverified",
  "Queried":    "Queried ⚠",
};

// ─── Performance trend data ────────────────────────────────────────────────────

const PERF_TREND = [
  { term: "T1 23", score: 4.1 },
  { term: "T2 23", score: 4.3 },
  { term: "T1 24", score: 4.0 },
  { term: "T2 24", score: 4.5 },
  { term: "T1 25", score: 4.4 },
];

// ─── StaffSlideOver ────────────────────────────────────────────────────────────

function StaffSlideOver({ staff, onClose }: { staff: StaffMember; onClose: () => void }) {
  const [tab, setTab] = useState<"overview" | "cpd" | "performance">("overview");
  const pal = getAvatarPalette(staff.name);

  const workloadLabel: Record<string, string> = {
    "Low":      "Low load",
    "Moderate": `Moderate load — ${staff.sessionsThisWeek} sessions/week`,
    "High":     `High load — ${staff.sessionsThisWeek} sessions/week`,
  };

  const workloadStripColor: Record<string, string> = {
    "Low":      "bg-emerald-500",
    "Moderate": "bg-amber-500",
    "High":     "bg-red-500",
  };

  const tabs = [
    { id: "overview",     label: "Overview"    },
    { id: "cpd",          label: "CPD Log"     },
    { id: "performance",  label: "Performance" },
  ] as const;

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-[640px] max-h-[80vh]">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 pt-5 pb-0 border-b border-slate-200 flex flex-col gap-0">
          {/* Staff identity row */}
          <div className="flex items-start gap-4 mb-4 pr-8">
            <div className={cn("w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shrink-0", pal.bg, pal.text)}>
              {getInitials(staff.name)}
            </div>
            <div className="pt-0.5 min-w-0">
              <DialogTitle className="text-lg font-bold text-slate-900 leading-tight">{staff.name}</DialogTitle>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", ROLE_BADGE[staff.role] ?? "bg-slate-100 text-slate-600")}>
                  {staff.role}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  {staff.department}
                </span>
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", STATUS_BADGE[staff.status])}>
                  {staff.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Joined {staff.hireDate}</p>
            </div>
          </div>

          {/* Inner tab bar */}
          <div className="flex gap-0">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={cn(
                  "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer",
                  tab === id
                    ? "border-amber-500 text-amber-600"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* ── Overview tab ── */}
          {tab === "overview" && (
            <div className="px-6 py-5 space-y-5">
              {/* Key info grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Work Email</p>
                  <p className="text-slate-700 break-all">{staff.email}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Department</p>
                  <p className="text-slate-700">{staff.department}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Contract</p>
                  <p className="text-slate-700">{staff.contractType}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Line Manager</p>
                  <p className="text-slate-700">{staff.lineManager}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-0.5">Sessions This Week</p>
                  <p className="text-slate-700">{staff.sessionsThisWeek}</p>
                </div>
                {staff.subjects.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">Subjects Taught</p>
                    <p className="text-slate-700">{staff.subjects.join(", ")}</p>
                  </div>
                )}
              </div>

              {/* Workload strip */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Workload</p>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                  <div className={cn("w-3 h-3 rounded-full shrink-0", workloadStripColor[staff.workloadLevel])} />
                  <span className="text-sm text-slate-700 font-medium">{workloadLabel[staff.workloadLevel]}</span>
                  <span className={cn("ml-auto px-2.5 py-0.5 rounded-full text-xs font-semibold", WORKLOAD_BADGE[staff.workloadLevel])}>
                    {staff.workloadLevel}
                  </span>
                </div>
              </div>

              {/* Quick stats grid */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">This Term</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Sessions Delivered",  value: String(staff.sessionsThisWeek * 11) },
                    { label: "Avg Feedback Score",   value: "4.3 / 5"                          },
                    { label: "Attendance Rate",       value: "96%"                              },
                    { label: "CPD Hours",             value: `${staff.cpdHours} / ${staff.cpdTarget}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white border border-slate-200 rounded-lg p-3">
                      <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── CPD Log tab ── */}
          {tab === "cpd" && (
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-slate-700">CPD Activities</p>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Log CPD
                </button>
              </div>

              {/* Annual progress */}
              <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-slate-600 font-medium">Annual progress</span>
                  <span className={cn("font-semibold tabular-nums", staff.cpdHours < 10 ? "text-red-500" : "text-amber-600")}>
                    {staff.cpdHours} / {staff.cpdTarget} hrs
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all", staff.cpdHours < 10 ? "bg-red-400" : "bg-amber-400")}
                    style={{ width: `${Math.min((staff.cpdHours / staff.cpdTarget) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {CPD_LOG.map((entry) => (
                  <div key={entry.activity} className="border border-slate-200 rounded-lg p-3 bg-white">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 leading-snug">{entry.activity}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-slate-400">{entry.date}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-500">{entry.hours} hrs</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-xs text-slate-500">{entry.type}</span>
                        </div>
                      </div>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium shrink-0 whitespace-nowrap", CPD_STATUS_BADGE[entry.status])}>
                        {CPD_STATUS_LABEL[entry.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Performance tab ── */}
          {tab === "performance" && (
            <div className="px-6 py-5 space-y-5">
              {/* Overall rating */}
              <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="text-3xl font-bold text-amber-600 leading-none">4.0</div>
                <div>
                  <div className="flex items-center gap-0.5 mb-1">
                    {[1,2,3,4,5].map((s) => (
                      <svg key={s} className={cn("w-4 h-4", s <= 4 ? "text-amber-400" : "text-slate-200")} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-amber-800">Exceeds Expectations</p>
                </div>
              </div>

              {/* Review dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Last Review</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">Term 2, 2024–25</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-3">
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Next Review Due</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">Term 2, 2025–26</p>
                </div>
              </div>

              {/* Agreed targets */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Agreed Targets</p>
                <ul className="space-y-2">
                  {[
                    "Improve 48-hour marking compliance rate to 95%",
                    "Complete 20 CPD hours by July 2026",
                    "Take on Year 9 Science group from Term 3",
                  ].map((target) => (
                    <li key={target} className="flex items-start gap-2 text-sm text-slate-700">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      {target}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feedback trend chart */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-2">Feedback Score Trend</p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl pt-3 pb-1 px-1">
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={PERF_TREND} margin={{ top: 8, right: 12, bottom: 4, left: 12 }}>
                      <Tooltip
                        formatter={(v) => [typeof v === "number" ? v.toFixed(1) : v, "Score"]}
                        labelFormatter={(l) => String(l)}
                        contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0", padding: "4px 10px" }}
                        cursor={{ stroke: "#f59e0b", strokeWidth: 1, strokeDasharray: "3 3" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
                        activeDot={{ r: 5, fill: "#d97706" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex justify-between px-3 pb-2">
                    {PERF_TREND.map((d) => (
                      <span key={d.term} className="text-[10px] text-slate-400">{d.term}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors cursor-pointer"
          >
            <Edit2 className="w-4 h-4" />
            Edit Staff
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  accent = "slate",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent?: "green" | "amber" | "red" | "slate";
}) {
  const iconCls = {
    green: "text-emerald-500 bg-emerald-50",
    amber: "text-amber-500 bg-amber-50",
    red:   "text-red-500 bg-red-50",
    slate: "text-slate-500 bg-slate-100",
  }[accent];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", iconCls)}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

// ─── Filters ───────────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = ["Active", "On Leave", "Inactive", "Suspended", "Off-boarded"];
const DEPT_FILTER_OPTIONS   = ["Primary", "Lower Secondary", "Senior", "Admin"];
const ROLE_FILTER_OPTIONS   = ["Teacher", "TA", "Admin", "Admin Head", "HOD", "Academic Head", "HR-Finance", "Super Admin"];

// ─── Page ──────────────────────────────────────────────────────────────────────

type LeaveRequestStatus = "Pending" | "Approved" | "Rejected";

interface LeaveRequest {
  id: string;
  staffId: string;
  name: string;
  type: string;
  range: string;
  days: number;
  submitted: string;
  status: LeaveRequestStatus;
  coverProposed?: boolean;
  coverCoveredCount?: number;
  coverTotalCount?: number;
}

const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: "LR-01", staffId: "ST-003", name: "Ahmed Khalil",   type: "Annual leave",   range: "5–9 May",  days: 5, submitted: "18 Apr 2026", status: "Pending" },
  { id: "LR-02", staffId: "ST-006", name: "Hana Yusuf",     type: "Personal",       range: "29 Apr",   days: 1, submitted: "17 Apr 2026", status: "Pending" },
  { id: "LR-03", staffId: "ST-012", name: "Khalil Mansouri",type: "Medical",        range: "22 Apr",   days: 1, submitted: "19 Apr 2026", status: "Pending" },
  { id: "LR-04", staffId: "ST-004", name: "Sarah Mitchell", type: "Annual leave",   range: "12–14 May",days: 3, submitted: "16 Apr 2026", status: "Pending" },
];

export default function StaffPage() {
  const { can, role } = usePermission();
  const [exportOpen,    setExportOpen]    = useState(false);
  const [outerTab,      setOuterTab]      = useState<"directory" | "hr">("directory");
  const [statusFilter,  setStatusFilter]  = useState<string[]>([]);
  const [deptFilter,    setDeptFilter]    = useState<string[]>([]);
  const [roleFilter,    setRoleFilter]    = useState<string[]>([]);
  const [search,        setSearch]        = useState("");
  const [openMenu,      setOpenMenu]      = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Mutable staff list — seeded from mock data, edited in-memory.
  const [rows, setRows] = useState<StaffMember[]>(() => staffMembers.map((s) => ({ ...s })));

  // Dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);
  const [deactivateStaff, setDeactivateStaff] = useState<StaffMember | null>(null);

  // HR dashboard — leave requests
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);
  const [requestLeaveOpen, setRequestLeaveOpen] = useState(false);

  function updateRow(id: string, patch: Partial<StaffMember>) {
    setRows((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function handleMarkOnLeave(s: StaffMember) {
    updateRow(s.id, { status: "On Leave" });
    toast.success(`${s.name} marked as on leave`);
  }

  function handleDeactivate(s: StaffMember) {
    updateRow(s.id, { status: "Inactive" });
    toast.success(`${s.name} deactivated`);
  }

  function handleAddStaff(data: NewStaffData) {
    const name = `${data.firstName} ${data.lastName}`.trim();
    const id = `ST-${String(rows.length + 1).padStart(3, "0")}`;
    const startDisplay = (() => {
      if (!data.startDate) return "";
      const [y, m, d] = data.startDate.split("-");
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
    })();
    const next: StaffMember = {
      id,
      name,
      email: data.email,
      role: data.role,
      department: data.department,
      subjects: data.subjects,
      sessionsThisWeek: 0,
      cpdHours: 0,
      cpdTarget: 20,
      status: "Active",
      hireDate: startDisplay,
      contractType: "Full-time",
      lineManager: "—",
      workloadLevel: "Low",
    };
    setRows((prev) => [next, ...prev]);
    toast.success(`${name} added to staff`);
  }

  function handleEditStaff(data: NewStaffData) {
    if (!editStaff) return;
    const name = `${data.firstName} ${data.lastName}`.trim();
    updateRow(editStaff.id, {
      name,
      email: data.email,
      role: data.role,
      department: data.department,
      subjects: data.subjects,
    });
    toast.success(`${name} updated`);
    setEditStaff(null);
  }

  function handleLeaveDecision(id: string, decision: "Approved" | "Rejected") {
    const req = leaveRequests.find((r) => r.id === id);
    setLeaveRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: decision } : r)));
    if (!req) return;
    if (decision === "Approved") {
      toast.success(`Leave approved — ${req.name} · ${req.range}`);
    } else {
      toast.error(`Leave rejected — ${req.name} · ${req.range}`);
    }
  }

  function handleRequestLeaveSubmit(payload: LeaveRequestSubmission) {
    const nextId = `LR-${String(leaveRequests.length + 1).padStart(2, "0")}`;
    const today = new Date();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const submitted = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
    const next: LeaveRequest = {
      id: nextId,
      staffId: "—",
      name: payload.staffName,
      type: `${payload.leaveType} leave`,
      range: payload.rangeLabel,
      days: payload.days,
      submitted,
      status: "Pending",
      coverProposed: true,
      coverCoveredCount: payload.coveredSessions,
      coverTotalCount: payload.totalSessions,
    };
    setLeaveRequests((prev) => [next, ...prev]);
    toast.success("Leave request submitted");
  }

  function openStaffById(id: string) {
    const s = rows.find((x) => x.id === id);
    if (s) setSelectedStaff(s);
  }

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir,   setSortDir]   = useState<"asc" | "desc">("asc");
  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }

  const [page,     setPage]     = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => { setPage(1); }, [statusFilter, deptFilter, roleFilter, search]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let data = rows.filter((s) => {
      if (statusFilter.length > 0 && !statusFilter.includes(s.status)) return false;
      if (deptFilter.length > 0   && !deptFilter.includes(s.department)) return false;
      if (roleFilter.length > 0   && !roleFilter.includes(s.role)) return false;
      if (q && !s.name.toLowerCase().includes(q) && !s.email.toLowerCase().includes(q) && !s.role.toLowerCase().includes(q)) return false;
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
  }, [rows, statusFilter, deptFilter, roleFilter, search, sortField, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const teachingStaff = useMemo(
    () => [...rows.filter((s) => ["Teacher", "TA", "HOD"].includes(s.role))].sort((a, b) => b.sessionsThisWeek - a.sessionsThisWeek),
    [rows],
  );

  const outerTabs = [
    { id: "directory", label: "Staff Directory" },
    { id: "hr",        label: "HR Dashboard"    },
  ] as const;

  if (!can('staff.view')) return <AccessDenied />;

  return (
    <div className="px-6 py-6 min-h-full">
      {role === 'Academic Head' && (
        <RoleBanner message="You have full access to staff management, including HR data and access controls." />
      )}
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
        <p className="text-sm text-slate-500 mt-0.5">People management — IMI teaching and admin team</p>
      </div>

      {/* Outer tabs */}
      <div className="flex gap-0 border-b border-slate-200 mb-6">
        {outerTabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setOuterTab(id)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer",
              outerTab === id
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════ STAFF DIRECTORY ═══════════ */}
      {outerTab === "directory" && (
        <div key="directory" className="page-enter space-y-5">

          {/* Summary strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={UserCheck} label="Total Staff"        value={18} accent="slate" />
            <StatCard icon={UserCheck} label="Active"             value={16} accent="green" />
            <StatCard icon={Clock}     label="On Leave"           value={1}  accent="amber" />
            <StatCard icon={UserX}     label="Pending Onboarding" value={1}  accent="slate" />
          </div>

          {/* Filter bar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <MultiSelectFilter label="Status"     options={STATUS_FILTER_OPTIONS} selected={statusFilter} onChange={setStatusFilter} />
              <MultiSelectFilter label="Department" options={DEPT_FILTER_OPTIONS}   selected={deptFilter}   onChange={setDeptFilter}   />
              <MultiSelectFilter label="Role"       options={ROLE_FILTER_OPTIONS}   selected={roleFilter}   onChange={setRoleFilter}   />

              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by name, email, role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-full bg-slate-50 placeholder-slate-400 text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition"
                />
              </div>

              <div className="ml-auto flex items-center gap-2">
                {can('export') && (
                  <button
                    type="button"
                    onClick={() => setExportOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                )}
                {can('staff.create') && (
                  <button
                    type="button"
                    onClick={() => setAddOpen(true)}
                    className="btn-primary flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold shadow-sm whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    Add Staff
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <SortableHeader label="Staff Member"  field="name"             sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Role"          field="role"             sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    <SortableHeader label="Department"    field="department"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell" />
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap hidden lg:table-cell">Subjects</th>
                    <SortableHeader label="Sessions/Wk"  field="sessionsThisWeek" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="hidden lg:table-cell" />
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap hidden xl:table-cell">CPD Progress</th>
                    <SortableHeader label="Status"        field="status"           sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((s) => {
                    const pal = getAvatarPalette(s.name);
                    const rowTint =
                      s.status === "Suspended" ? "bg-red-50 hover:bg-red-100/60" :
                      s.status === "On Leave"  ? "bg-amber-50 hover:bg-amber-100/60" :
                      "hover:bg-slate-50";

                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedStaff(s)}
                        className={cn("border-b border-slate-100 last:border-0 transition-colors cursor-pointer", rowTint)}
                      >
                        {/* Staff member */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", pal.bg, pal.text)}>
                              {getInitials(s.name)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 leading-snug">{s.name}</p>
                              <p className="text-xs text-slate-400">{s.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap", ROLE_BADGE[s.role] ?? "bg-slate-100 text-slate-600")}>
                            {s.role}
                          </span>
                        </td>

                        {/* Department */}
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap hidden md:table-cell">{s.department}</td>

                        {/* Subjects */}
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {s.subjects.length === 0 ? (
                            <span className="text-slate-400 text-xs">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {s.subjects.slice(0, 2).map((sub) => (
                                <span key={sub} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-xs whitespace-nowrap">
                                  {sub}
                                </span>
                              ))}
                              {s.subjects.length > 2 && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-xs">
                                  +{s.subjects.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Sessions */}
                        <td className="px-4 py-3 text-slate-600 text-center tabular-nums hidden lg:table-cell">{s.sessionsThisWeek}</td>

                        {/* CPD */}
                        <td className="px-4 py-3 hidden xl:table-cell">
                          <CpdBar hours={s.cpdHours} target={s.cpdTarget} />
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap", STATUS_BADGE[s.status])}>
                            {s.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <RowActionsMenu
                            staff={s}
                            isOpen={openMenu === s.id}
                            onOpen={() => setOpenMenu(s.id)}
                            onClose={() => setOpenMenu(null)}
                            onViewProfile={() => { setSelectedStaff(s); setOpenMenu(null); }}
                            onEdit={() => { setEditStaff(s); setOpenMenu(null); }}
                            onMarkOnLeave={() => { handleMarkOnLeave(s); setOpenMenu(null); }}
                            onDeactivate={() => { setDeactivateStaff(s); setOpenMenu(null); }}
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState
                          icon={UserCheck}
                          title="No staff found"
                          description="No staff match the current filters."
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar
              total={filtered.length}
              page={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
            />
          </div>
        </div>
      )}

      {/* ═══════════ HR DASHBOARD ═══════════ */}
      {outerTab === "hr" && (
        <div key="hr" className="page-enter space-y-6">

          {/* 2×2 panel grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Panel 1 — Onboarding Completion */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-800">Onboarding Completion</h3>
              <p className="text-xs text-slate-400 mt-0.5 mb-4">Staff with incomplete mandatory fields</p>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Staff</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Missing</th>
                      <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">Progress</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-3 py-3 font-medium text-slate-800 whitespace-nowrap">Khalil Mansouri</td>
                      <td className="px-3 py-3 text-xs text-slate-500">Home address, Emergency contact</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400" style={{ width: "60%" }} />
                          </div>
                          <span className="text-xs text-slate-500 tabular-nums">60%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Send className="w-3 h-3" />
                          Send Reminder
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Panel 2 — CPD Summary by Department */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-800">CPD Summary</h3>
              <p className="text-xs text-slate-400 mt-0.5 mb-4">Average CPD progress by department</p>
              <div className="space-y-4">
                {[
                  { dept: "Primary",         count: 4, avg: 12 },
                  { dept: "Lower Secondary", count: 3, avg: 8  },
                  { dept: "Senior",          count: 3, avg: 17 },
                ].map(({ dept, count, avg }) => (
                  <div key={dept}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div>
                        <span className="text-sm font-medium text-slate-700">{dept}</span>
                        <span className="text-slate-400 ml-1.5 text-xs">({count} staff)</span>
                      </div>
                      <span className={cn("text-xs font-semibold tabular-nums", avg < 10 ? "text-red-500" : avg < 15 ? "text-amber-600" : "text-emerald-600")}>
                        {avg} / 20 hrs avg
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", avg < 10 ? "bg-red-400" : avg < 15 ? "bg-amber-400" : "bg-emerald-400")}
                        style={{ width: `${(avg / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel 3 — Upcoming Milestones */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-800">Upcoming Milestones</h3>
              <p className="text-xs text-slate-400 mt-0.5 mb-4">Staff events and achievements</p>
              <div className="space-y-2">
                {[
                  { name: "Hana Yusuf",     event: "3-year anniversary",  whenLabel: "1 Sep 2026"  },
                  { name: "Ahmed Khalil",    event: "CPD 100% complete",   whenLabel: "Today"       },
                  { name: "Sarah Mitchell",  event: "CPD 90% reached",     whenLabel: "3 days ago"  },
                ].map(({ name, event, whenLabel }) => {
                  const pal = getAvatarPalette(name);
                  return (
                    <div key={name} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-amber-200 hover:bg-amber-50/40 transition-colors">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0", pal.bg, pal.text)}>
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {event} <span className="text-slate-400">· {whenLabel}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedStaff(rows.find((s) => s.name === name) ?? null)}
                        className="text-xs text-amber-600 font-medium hover:underline cursor-pointer whitespace-nowrap shrink-0"
                      >
                        View Profile
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel 4 — HR Actions Pending */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-800">HR Actions Pending</h3>
              <p className="text-xs text-slate-400 mt-0.5 mb-4">Active flags requiring attention</p>
              <div className="space-y-2">
                {[
                  {
                    dotCls:      "bg-red-500",
                    name:        "Mariam Saleh",
                    label:       "Access Revoked",
                    detail:      "15 Apr 2026",
                    action:      "View Details",
                    actionCls:   "text-red-600 hover:bg-red-50 border-red-200",
                  },
                  {
                    dotCls:      "bg-amber-400",
                    name:        "Rania Aziz",
                    label:       "Emergency Leave active",
                    detail:      "Since 10 Apr 2026 · 12 sessions need cover",
                    action:      "Assign Cover",
                    actionCls:   "text-amber-700 hover:bg-amber-50 border-amber-200",
                  },
                  {
                    dotCls:      "bg-slate-300",
                    name:        "Khalil Mansouri",
                    label:       "Onboarding incomplete",
                    detail:      "Day 25",
                    action:      "Complete Profile",
                    actionCls:   "text-slate-600 hover:bg-slate-50 border-slate-200",
                  },
                ].map(({ dotCls, name, label, detail, action, actionCls }) => (
                  <div key={name} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
                    <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", dotCls)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{name}</p>
                      <p className="text-xs text-slate-500 truncate">{label} · <span className="text-slate-400">{detail}</span></p>
                    </div>
                    <button
                      type="button"
                      className={cn("text-xs font-medium px-2.5 py-1 rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0", actionCls)}
                    >
                      {action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Workload Overview Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-bold text-slate-800">Workload Overview</h3>
              <p className="text-xs text-slate-400 mt-0.5">Teaching staff — sessions per week and load rating</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {["Staff", "Role", "Sessions / Week", "Workload"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {teachingStaff.map((s) => {
                    const pal = getAvatarPalette(s.name);
                    const rowBg =
                      s.status === "Suspended" ? "bg-red-50" :
                      s.status === "On Leave"  ? "bg-amber-50/60" :
                      "";
                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedStaff(s)}
                        className={cn("border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer", rowBg)}
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0", pal.bg, pal.text)}>
                              {getInitials(s.name)}
                            </div>
                            <span className="font-medium text-slate-800">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", ROLE_BADGE[s.role] ?? "bg-slate-100 text-slate-600")}>
                            {s.role}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600 tabular-nums">
                          {s.status === "Suspended" ? (
                            <span className="text-slate-400 italic text-xs">Access revoked</span>
                          ) : (
                            s.sessionsThisWeek
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {s.status === "Suspended" ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">Suspended</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className={cn("w-2 h-2 rounded-full shrink-0", WORKLOAD_DOT[s.workloadLevel])} />
                              <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", WORKLOAD_BADGE[s.workloadLevel])}>
                                {s.workloadLevel}
                              </span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Leave Requests Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Leave Requests</h3>
                <p className="text-xs text-slate-400 mt-0.5">Pending approvals and recent decisions</p>
              </div>
              <button
                type="button"
                onClick={() => setRequestLeaveOpen(true)}
                className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                Request Leave
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {["Staff", "Type", "Dates", "Days", "Submitted", "Status", ""].map((h, i) => (
                      <th key={`${h}-${i}`} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map((r) => {
                    const pal = getAvatarPalette(r.name);
                    return (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0", pal.bg, pal.text)}>
                              {getInitials(r.name)}
                            </div>
                            <button
                              type="button"
                              onClick={() => openStaffById(r.staffId)}
                              className="font-medium text-slate-800 hover:text-amber-600 cursor-pointer transition-colors"
                            >
                              {r.name}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-600">{r.type}</td>
                        <td className="px-5 py-3 text-slate-600 whitespace-nowrap">{r.range}</td>
                        <td className="px-5 py-3 text-slate-600 tabular-nums">{r.days}</td>
                        <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">{r.submitted}</td>
                        <td className="px-5 py-3">
                          {r.status === "Pending" ? (
                            <div className="flex flex-col gap-0.5 items-start">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                Pending
                              </span>
                              {r.coverProposed && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                  Cover proposed
                                  {typeof r.coverCoveredCount === "number" && typeof r.coverTotalCount === "number" && r.coverTotalCount > 0 && (
                                    <span className="text-slate-400 tabular-nums">
                                      {" "}· {r.coverCoveredCount}/{r.coverTotalCount}
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          ) : r.status === "Approved" ? (
                            <div className="flex flex-col gap-0.5 items-start">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                Approved
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700">
                                <Check className="w-3 h-3" strokeWidth={3} />
                                Cover confirmed
                                {typeof r.coverCoveredCount === "number" && typeof r.coverTotalCount === "number" && r.coverTotalCount > 0 && (
                                  <span className="text-slate-400 tabular-nums">
                                    {" "}· {r.coverCoveredCount}/{r.coverTotalCount}
                                  </span>
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200">
                              Rejected
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {r.status === "Pending" ? (
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => handleLeaveDecision(r.id, "Approved")}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-200 bg-emerald-50 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <Check className="w-3 h-3" />
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleLeaveDecision(r.id, "Rejected")}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors cursor-pointer whitespace-nowrap"
                              >
                                <X className="w-3 h-3" />
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="block text-right text-[11px] text-slate-400 italic">Decided</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Staff slide-over */}
      {selectedStaff && (
        <StaffSlideOver
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
        />
      )}

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Staff"
        recordCount={18}
        formats={[
          { id: 'csv-directory', label: 'Staff Directory', description: 'Name, email, role, department, subjects, status.', icon: 'rows', recommended: true },
          { id: 'csv-hr', label: 'HR Export', description: 'Includes CPD hours, review dates, employment type, and leave records.', icon: 'items' },
        ]}
      />

      <AddStaffDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onConfirm={handleAddStaff}
      />

      <AddStaffDialog
        open={editStaff !== null}
        onOpenChange={(o) => { if (!o) setEditStaff(null); }}
        onConfirm={handleEditStaff}
        mode={editStaff ? { kind: "edit", staff: editStaff } : { kind: "add" }}
      />

      <DeactivateStaffDialog
        staff={deactivateStaff}
        open={deactivateStaff !== null}
        onOpenChange={(o) => { if (!o) setDeactivateStaff(null); }}
        onConfirm={() => { if (deactivateStaff) handleDeactivate(deactivateStaff); }}
      />

      <RequestLeaveDialog
        open={requestLeaveOpen}
        staffName={currentUser.name}
        onOpenChange={setRequestLeaveOpen}
        onSubmit={handleRequestLeaveSubmit}
      />
    </div>
  );
}
