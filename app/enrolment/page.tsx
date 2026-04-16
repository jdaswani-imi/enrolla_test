"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  MoreHorizontal,
  ChevronDown,
  X,
  BookOpen,
  RefreshCw,
  UserMinus,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  enrolments,
  trials,
  withdrawals,
  type Enrolment,
  type EnrolmentStatus,
  type EnrolmentInvoiceStatus,
} from "@/lib/mock-data";

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-teal-100",  text: "text-teal-700"  },
  { bg: "bg-blue-100",  text: "text-blue-700"  },
  { bg: "bg-violet-100",text: "text-violet-700"},
  { bg: "bg-rose-100",  text: "text-rose-700"  },
  { bg: "bg-emerald-100",text:"text-emerald-700"},
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

// ─── Badge classes ────────────────────────────────────────────────────────────

function getEnrolmentStatusClass(status: EnrolmentStatus): string {
  switch (status) {
    case "Active":   return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Pending":  return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Expiring": return "bg-orange-100 text-orange-700 border border-orange-200";
    case "Expired":  return "bg-slate-100 text-slate-500 border border-slate-200";
  }
}

function getInvoiceStatusClass(status: EnrolmentInvoiceStatus | "Paid" | "Pending"): string {
  switch (status) {
    case "Paid":    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Part":    return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Overdue": return "bg-red-100 text-red-700 border border-red-200";
    case "Pending": return "bg-slate-100 text-slate-500 border border-slate-200";
    default:        return "bg-slate-100 text-slate-500 border border-slate-200";
  }
}

function getRowTintClass(status: EnrolmentStatus): string {
  switch (status) {
    case "Expiring": return "bg-orange-50";
    case "Expired":  return "bg-slate-50";
    case "Pending":  return "bg-amber-50";
    default:         return "";
  }
}

// ─── FilterDropdown ───────────────────────────────────────────────────────────

interface FilterDropdownProps {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const displayLabel = value === options[0] ? label : value;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer",
          value === options[0]
            ? "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
            : "bg-amber-50 border-amber-300 text-amber-800"
        )}
      >
        {displayLabel}
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[140px] py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-sm hover:bg-slate-50 cursor-pointer transition-colors",
                value === opt ? "text-amber-700 font-medium" : "text-slate-700"
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

// ─── Session Dot Visualisation ────────────────────────────────────────────────

function SessionDots({ total, remaining }: { total: number; remaining: number }) {
  const consumed = total - remaining;
  // Build dot array: consumed first (could be attended or absent — simplified to green/red pattern)
  // For slide-over: first 14 green (attended), 2 red (absent), rest empty
  // Generic: show consumed as green, remaining as empty
  const dots = Array.from({ length: total }, (_, i) => {
    if (i < consumed) return "green";
    return "empty";
  });

  const row1 = dots.slice(0, 10);
  const row2 = dots.slice(10);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {row1.map((type, i) => (
          <span
            key={i}
            className={cn(
              "w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold",
              type === "green" && "bg-emerald-500 border-emerald-600 text-white",
              type === "empty" && "bg-white border-slate-300 text-slate-300"
            )}
          >
            {type === "green" ? "✓" : "○"}
          </span>
        ))}
      </div>
      {row2.length > 0 && (
        <div className="flex gap-1.5">
          {row2.map((type, i) => (
            <span
              key={i}
              className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold",
                type === "green" && "bg-emerald-500 border-emerald-600 text-white",
                type === "empty" && "bg-white border-slate-300 text-slate-300"
              )}
            >
              {type === "green" ? "✓" : "○"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Detailed session dots for slide-over (E-001 specific: 14 green, 2 red, 4 empty)
function SessionDotsDetailed({ total, attended, absent }: { total: number; attended: number; absent: number }) {
  const dots = Array.from({ length: total }, (_, i) => {
    if (i < attended) return "green";
    if (i < attended + absent) return "red";
    return "empty";
  });

  const row1 = dots.slice(0, 10);
  const row2 = dots.slice(10);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1.5">
        {row1.map((type, i) => (
          <span
            key={i}
            className={cn(
              "w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold",
              type === "green" && "bg-emerald-500 border-emerald-600 text-white",
              type === "red"   && "bg-red-400 border-red-500 text-white",
              type === "empty" && "bg-white border-slate-300 text-slate-300"
            )}
          >
            {type === "green" ? "✓" : type === "red" ? "✗" : "○"}
          </span>
        ))}
      </div>
      {row2.length > 0 && (
        <div className="flex gap-1.5">
          {row2.map((type, i) => (
            <span
              key={i}
              className={cn(
                "w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold",
                type === "green" && "bg-emerald-500 border-emerald-600 text-white",
                type === "red"   && "bg-red-400 border-red-500 text-white",
                type === "empty" && "bg-white border-slate-300 text-slate-300"
              )}
            >
              {type === "green" ? "✓" : type === "red" ? "✗" : "○"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sessions Progress Cell ───────────────────────────────────────────────────

function SessionsProgress({ total, remaining }: { total: number; remaining: number }) {
  const consumed = total - remaining;
  const pct = total > 0 ? (consumed / total) * 100 : 0;

  return (
    <div className="min-w-[72px]">
      <span className="text-sm text-slate-700 font-medium">
        {consumed} / {total}
      </span>
      <div className="mt-1 h-1 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: "amber" | "red" | "none";
}

function StatCard({ label, value, accent = "none" }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-col gap-1",
        accent === "amber" && "border-l-4 border-l-amber-400",
        accent === "red"   && "border-l-4 border-l-red-400"
      )}
    >
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-slate-800">{value}</span>
    </div>
  );
}

// ─── Three-dot Menu ───────────────────────────────────────────────────────────

interface ActionMenuItem {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
}

function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Row actions"
      >
        <MoreHorizontal className="w-4 h-4 text-slate-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[180px] py-1">
            {items.map((item, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); item.onClick?.(); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 transition-colors cursor-pointer",
                  item.danger ? "text-red-600" : "text-slate-700"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Enrolment Detail Slide-Over ──────────────────────────────────────────────

function EnrolmentSlideOver({
  enrolment,
  onClose,
}: {
  enrolment: Enrolment;
  onClose: () => void;
}) {
  const palette = getAvatarPalette(enrolment.student);
  const initials = getInitials(enrolment.student);
  const consumed = enrolment.sessionsTotal - enrolment.sessionsRemaining;

  // Derive attended/absent for detail view (simplified approximation)
  const absent = Math.max(0, Math.round(consumed * 0.12));
  const attended = consumed - absent;

  return (
    <>
      {/* Overlay */}
      <div
        className="fade-in fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="slide-in-right fixed right-0 top-0 h-full w-[640px] bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
                palette.bg,
                palette.text
              )}
            >
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-slate-800">{enrolment.student}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
                  {enrolment.yearGroup}
                </span>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    getEnrolmentStatusClass(enrolment.enrolmentStatus)
                  )}
                >
                  {enrolment.enrolmentStatus}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{enrolment.subject}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-400"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Details Grid */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Enrolment Details
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {[
                { label: "Student",          value: `${enrolment.student} (${enrolment.studentId})` },
                { label: "Subject",          value: enrolment.subject },
                { label: "Department",       value: enrolment.department },
                { label: "Teacher",          value: enrolment.teacher },
                { label: "Term",             value: "Term 3, 2024–25" },
                { label: "Start Date",       value: "14 Apr 2025" },
                { label: "Sessions Total",   value: String(enrolment.sessionsTotal) },
                { label: "Sessions Remaining", value: String(enrolment.sessionsRemaining) },
                { label: "Frequency",        value: enrolment.frequency },
                { label: "Package",          value: enrolment.package },
              ].map(({ label, value }) => (
                <div key={label}>
                  <span className="text-xs text-slate-400 block mb-0.5">{label}</span>
                  <span className="text-sm text-slate-700 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Invoice */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Invoice
            </h3>
            <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">INV-1042</span>
                    <span className="text-sm text-slate-600">— AED 3,360</span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        getInvoiceStatusClass(enrolment.invoiceStatus)
                      )}
                    >
                      {enrolment.invoiceStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Due 20 Apr 2025</p>
                </div>
              </div>
              <button className="text-xs text-amber-600 hover:text-amber-700 font-medium cursor-pointer transition-colors">
                View Invoice
              </button>
            </div>
          </div>

          {/* Session Dots */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Session Progress
            </h3>
            <SessionDotsDetailed
              total={enrolment.sessionsTotal}
              attended={attended}
              absent={absent}
            />
            <div className="flex gap-4 mt-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                Attended ({attended})
              </span>
              {absent > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
                  Absent ({absent})
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-white border border-slate-300 inline-block" />
                Remaining ({enrolment.sessionsRemaining})
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 px-6 py-4 flex gap-3">
          <button className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
            Add Subject
          </button>
          <button className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer">
            Extend Package
          </button>
          <button className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
            Withdraw
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Tab 1 — Active Enrolments ────────────────────────────────────────────────

function ActiveEnrolmentsTab() {
  const [dept, setDept]     = useState("All Departments");
  const [status, setStatus] = useState("All Statuses");
  const [year, setYear]     = useState("All Years");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Enrolment | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return enrolments.filter((e) => {
      if (dept !== "All Departments" && e.department !== dept) return false;
      if (status !== "All Statuses" && e.enrolmentStatus !== status) return false;
      if (year !== "All Years" && e.yearGroup !== year) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!e.student.toLowerCase().includes(q) && !e.subject.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [dept, status, year, search]);

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Enrolments" value="3,847" />
        <StatCard label="New This Term"      value="143"   />
        <StatCard label="Pending Payment"    value="12"    accent="amber" />
        <StatCard label="Expiring This Week" value="8"     accent="red"   />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterDropdown
          label="All Departments"
          value={dept}
          options={["All Departments", "Primary", "Lower Secondary", "Senior"]}
          onChange={setDept}
        />
        <FilterDropdown
          label="All Statuses"
          value={status}
          options={["All Statuses", "Active", "Pending", "Expiring", "Expired"]}
          onChange={setStatus}
        />
        <FilterDropdown
          label="All Years"
          value={year}
          options={["All Years", "Y1","Y2","Y3","Y4","Y5","Y6","Y7","Y8","Y9","Y10","Y11","Y12","Y13"]}
          onChange={setYear}
        />
        <div className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-500 cursor-default select-none">
          Term 3 2024–25
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student, subject…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all placeholder:text-slate-400"
          />
        </div>

        <button className="ml-auto flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
          <Plus className="w-3.5 h-3.5" />
          New Enrolment
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Student","Year","Subject","Teacher","Sessions","Frequency","Package","Invoice","Status",""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((enr) => {
                const palette = getAvatarPalette(enr.student);
                const initials = getInitials(enr.student);
                const rowTint = getRowTintClass(enr.enrolmentStatus);

                return (
                  <tr
                    key={enr.id}
                    onClick={() => setSelected(enr)}
                    className={cn(
                      "border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer group",
                      rowTint
                    )}
                  >
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                            palette.bg,
                            palette.text
                          )}
                        >
                          {initials}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 whitespace-nowrap">{enr.student}</div>
                          <div className="text-xs text-slate-400">{enr.studentId}</div>
                        </div>
                      </div>
                    </td>

                    {/* Year */}
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">
                        {enr.yearGroup}
                      </span>
                    </td>

                    {/* Subject */}
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{enr.subject}</td>

                    {/* Teacher */}
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{enr.teacher}</td>

                    {/* Sessions */}
                    <td className="px-4 py-3">
                      <SessionsProgress
                        total={enr.sessionsTotal}
                        remaining={enr.sessionsRemaining}
                      />
                    </td>

                    {/* Frequency */}
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{enr.frequency}</td>

                    {/* Package */}
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">{enr.package}</td>

                    {/* Invoice Status */}
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", getInvoiceStatusClass(enr.invoiceStatus))}>
                        {enr.invoiceStatus}
                      </span>
                    </td>

                    {/* Enrolment Status */}
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", getEnrolmentStatusClass(enr.enrolmentStatus))}>
                        {enr.enrolmentStatus}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <ActionMenu
                        items={[
                          { label: "View Student",    icon: <Eye className="w-3.5 h-3.5" /> },
                          { label: "Edit Enrolment",  icon: <BookOpen className="w-3.5 h-3.5" /> },
                          { label: "Add Subject",     icon: <Plus className="w-3.5 h-3.5" /> },
                          { label: "Withdraw",        icon: <UserMinus className="w-3.5 h-3.5" />, danger: true },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">
                    No enrolments match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over */}
      {selected && (
        <EnrolmentSlideOver enrolment={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ─── Tab 2 — Trials ───────────────────────────────────────────────────────────

function TrialsTab() {
  const [toast, setToast] = useState(false);

  function showToast() {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  }

  function getOutcomeClass(outcome: string): string {
    if (outcome.startsWith("Recommended")) return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    if (outcome === "Parent to decide")    return "bg-amber-100 text-amber-700 border border-amber-200";
    if (outcome === "Not recommended")     return "bg-red-100 text-red-700 border border-red-200";
    return "bg-slate-100 text-slate-500 border border-slate-200";
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Trials This Term"        value="18" />
        <StatCard label="Pending Outcome"         value="3"  accent="amber" />
        <StatCard label="Converted to Enrolment"  value="14" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Student","Year","Subject","Teacher","Trial Date","Invoice","Outcome","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trials.map((t) => {
                const palette  = getAvatarPalette(t.student);
                const initials = getInitials(t.student);
                const isRecommended = t.outcome.startsWith("Recommended");

                return (
                  <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0", palette.bg, palette.text)}>
                          {initials}
                        </div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{t.student}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">{t.yearGroup}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{t.subject}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.teacher}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.trialDate}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium",
                        t.invoiceStatus === "Paid"
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-500 border border-slate-200"
                      )}>
                        {t.invoiceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", getOutcomeClass(t.outcome))}>
                        {t.outcome}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isRecommended && (
                        <button
                          onClick={showToast}
                          className="px-3 py-1 text-xs font-medium bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Convert to Enrolment
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white text-sm px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          Enrolment conversion — coming soon.
        </div>
      )}
    </div>
  );
}

// ─── Tab 3 — Withdrawals ──────────────────────────────────────────────────────

function WithdrawalsTab() {
  function getInvoiceCellClass(status: string): string {
    if (status === "Overdue") return "bg-red-50";
    return "";
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-2 gap-4 flex-1">
          <StatCard label="Withdrawn This Term" value="31" />
          <StatCard label="Pending Withdrawal"  value="2"  accent="amber" />
        </div>
        <div className="pt-1">
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap">
            <UserMinus className="w-3.5 h-3.5" />
            Initiate Withdrawal
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Student","Year","Department","Subjects","Withdrawal Date","Reason","Invoice","Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w, i) => {
                const palette  = getAvatarPalette(w.student);
                const initials = getInitials(w.student);
                const isPending = w.withdrawalDate === "Pending";
                const rowClass  = isPending ? "bg-amber-50" : "";
                const invoiceCellClass = getInvoiceCellClass(w.invoiceStatus);

                return (
                  <tr key={i} className={cn("border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors", rowClass)}>
                    {/* Student */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0", palette.bg, palette.text)}>
                          {initials}
                        </div>
                        <span className="font-medium text-slate-800 whitespace-nowrap">{w.student}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">{w.yearGroup}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{w.department}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {w.subjects.map((s) => (
                          <span key={s} className="px-1.5 py-0.5 text-xs rounded bg-slate-100 text-slate-600">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {isPending ? (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium">Pending</span>
                      ) : (
                        w.withdrawalDate
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{w.reason}</td>
                    <td className={cn("px-4 py-3", invoiceCellClass)}>
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", getInvoiceStatusClass(w.invoiceStatus as EnrolmentInvoiceStatus))}>
                        {w.invoiceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ActionMenu
                        items={[
                          { label: "View Student",   icon: <Eye className="w-3.5 h-3.5" /> },
                          { label: "View Details",   icon: <BookOpen className="w-3.5 h-3.5" /> },
                          { label: "Re-enrol",       icon: <RefreshCw className="w-3.5 h-3.5" /> },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "enrolments", label: "Active Enrolments" },
  { id: "trials",     label: "Trials"            },
  { id: "withdrawals",label: "Withdrawals"        },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function EnrolmentPage() {
  const [activeTab, setActiveTab] = useState<TabId>("enrolments");

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Enrolment</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage active enrolments, trials, and withdrawals.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer relative",
              activeTab === tab.id
                ? "text-slate-800"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "enrolments"  && <ActiveEnrolmentsTab />}
      {activeTab === "trials"      && <TrialsTab />}
      {activeTab === "withdrawals" && <WithdrawalsTab />}
    </div>
  );
}
