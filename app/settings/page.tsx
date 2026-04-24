"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FIELD, FieldLabel, FormActions } from "@/components/journey/dialog-parts";
import {
  Building2,
  GitBranch,
  Layers,
  DoorOpen,
  Receipt,
  CalendarCheck,
  Calendar,
  BookOpen,
  Users,
  Shield,
  Bell,
  FileText,
  ToggleLeft,
  Plug,
  BarChart2,
  List,
  Lock,
  Plus,
  Upload,
  Lock as LockIcon,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Search,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PERMISSIONS, type Role } from "@/lib/role-config";
import {
  orgSettings,
  departments as mockDepartments,
  timetableSessions,
  academicYears as seedAcademicYears,
  calendarPeriods as seedPeriods,
  publicHolidays as seedHolidays,
  type Department as DeptData,
  type PeriodType,
  type AcademicYear,
  type CalendarPeriod,
  type DepartmentPause,
  type PublicHoliday,
} from "@/lib/mock-data";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import SubjectsCatalogueSection from "./subjects-catalogue";

// ─── Nav Structure ─────────────────────────────────────────────────────────────

type SectionId =
  | "organisation" | "branches" | "departments" | "rooms"
  | "billing" | "payment-plans"
  | "academic-calendar" | "subjects"
  | "staff-hr" | "roles"
  | "notifications" | "templates"
  | "feature-toggles" | "integrations" | "churn"
  | "audit-log" | "data-privacy";

const NAV_SECTIONS = [
  {
    label: "PLATFORM",
    items: [
      { id: "organisation" as SectionId, label: "Organisation", icon: Building2 },
      { id: "branches" as SectionId, label: "Branches", icon: GitBranch },
      { id: "departments" as SectionId, label: "Departments", icon: Layers },
      { id: "rooms" as SectionId, label: "Rooms", icon: DoorOpen },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { id: "billing" as SectionId, label: "Billing & Invoicing", icon: Receipt },
      { id: "payment-plans" as SectionId, label: "Payment Plans", icon: CalendarCheck },
    ],
  },
  {
    label: "ACADEMIC",
    items: [
      { id: "academic-calendar" as SectionId, label: "Academic Calendar", icon: Calendar },
      { id: "subjects" as SectionId, label: "Subjects & Catalogue", icon: BookOpen },
    ],
  },
  {
    label: "PEOPLE",
    items: [
      { id: "staff-hr" as SectionId, label: "Staff & HR", icon: Users },
      { id: "roles" as SectionId, label: "Roles & Permissions", icon: Shield },
    ],
  },
  {
    label: "COMMUNICATIONS",
    items: [
      { id: "notifications" as SectionId, label: "Notifications", icon: Bell },
      { id: "templates" as SectionId, label: "Templates", icon: FileText },
    ],
  },
  {
    label: "PLATFORM ADVANCED",
    items: [
      { id: "feature-toggles" as SectionId, label: "Feature Toggles", icon: ToggleLeft },
      { id: "integrations" as SectionId, label: "Integrations", icon: Plug },
      { id: "churn" as SectionId, label: "Churn & Dashboard", icon: BarChart2 },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { id: "audit-log" as SectionId, label: "Audit Log", icon: List },
      { id: "data-privacy" as SectionId, label: "Data & Privacy", icon: Lock },
    ],
  },
];

// ─── Shared UI ─────────────────────────────────────────────────────────────────

function FormField({
  label,
  defaultValue,
  type = "text",
  span2 = false,
}: {
  label: string;
  defaultValue?: string;
  type?: string;
  span2?: boolean;
}) {
  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <input
        type={type}
        defaultValue={defaultValue}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  options,
}: {
  label: string;
  value: string;
  options: string[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <select
        defaultValue={value}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors cursor-pointer appearance-none"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function FormTextarea({
  label,
  defaultValue,
}: {
  label: string;
  defaultValue?: string;
}) {
  return (
    <div className="col-span-2">
      <label className="block text-xs font-medium text-slate-500 mb-1.5">{label}</label>
      <textarea
        defaultValue={defaultValue}
        rows={2}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 transition-colors resize-none"
      />
    </div>
  );
}

function SaveButton() {
  return (
    <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
      <button className="px-4 py-2 bg-amber-500 text-white text-sm font-medium rounded-md hover:bg-amber-600 transition-colors cursor-pointer">
        Save Changes
      </button>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-sm font-medium rounded-md hover:bg-amber-600 transition-colors cursor-pointer"
    >
      <Plus className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function OutlineButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white text-sm text-slate-600 font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
    >
      {icon}
      {label}
    </button>
  );
}

function TableAction({
  label,
  disabled = false,
  danger = false,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "text-xs font-medium px-2 py-1 rounded transition-colors",
        disabled
          ? "text-slate-300 cursor-not-allowed"
          : danger
          ? "text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
      )}
    >
      {label}
    </button>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-white rounded-lg border border-slate-200", className)}>
      {children}
    </div>
  );
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
        checked ? "bg-amber-500" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        )}
      />
    </button>
  );
}

type FeatureState = "On" | "Off" | "Later";

// ─── Section 1: Organisation ───────────────────────────────────────────────────

function OrganisationSection() {
  const [toast, setToast] = useState("");

  function handleUploadLogo() {
    orgSettings.logoUrl = "/images/imi-logo-placeholder.png";
    setToast("Logo updated — refresh to see changes");
    setTimeout(() => setToast(""), 3000);
  }

  return (
    <div>
      <SectionHeader
        title="Organisation"
        description="Core platform identity, regional settings, and branding."
      />

      <Card className="p-6 mb-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <FormField label="Organisation Name" defaultValue="Improve ME Institute" />
          <FormField label="Legal Name" defaultValue="Improve ME Institute LLC" />
          <FormField label="Student ID Format" defaultValue="IMI-####" />
          <FormField label="VAT Registration Number" defaultValue="100123456700003" />
          <FormSelect label="Currency" value="AED" options={["AED", "USD", "GBP", "EUR"]} />
          <FormSelect
            label="Timezone"
            value="UTC+4 (Gulf Standard Time)"
            options={["UTC+4 (Gulf Standard Time)", "UTC+0 (GMT)", "UTC+3 (AST)"]}
          />
          <FormSelect label="Default Language" value="English" options={["English", "Arabic"]} />
          <FormSelect label="Start Day of Week" value="Monday" options={["Monday", "Sunday"]} />
          <FormField label="Weekly Closure Days" defaultValue="Sunday" />
          <FormField label="Office Hours" defaultValue="Mon–Sat: 08:00 – 20:00" />
        </div>
        <SaveButton />
      </Card>

      <Card className="p-6 mb-5">
        <p className="text-sm font-semibold text-slate-700 mb-4">Logo</p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-slate-400" />
          </div>
          <OutlineButton
            label="Upload Logo"
            icon={<Upload className="w-3.5 h-3.5" />}
            onClick={handleUploadLogo}
          />
        </div>
      </Card>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">Onboarding completed</span> — 14 Mar 2025.{" "}
          <a href="#" className="text-amber-600 hover:text-amber-700 hover:underline">
            View onboarding summary →
          </a>
        </p>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── Section 2: Branches ───────────────────────────────────────────────────────

type Branch = { id: string; name: string; address: string; phone: string };

function BranchDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Branch | null;
  onSave: (branch: { name: string; address: string; phone: string }) => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setAddress(initial?.address ?? "");
      setPhone(initial?.phone ?? "");
    }
  }, [open, initial]);

  const canSubmit = name.trim() && address.trim() && phone.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[480px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit branch" : "Add branch"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update branch details." : "Create a new campus location."}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div>
            <FieldLabel required>Branch name</FieldLabel>
            <input
              className={FIELD}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Downtown Campus"
            />
          </div>
          <div>
            <FieldLabel required>Address</FieldLabel>
            <input
              className={FIELD}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, area, city"
            />
          </div>
          <div>
            <FieldLabel required>Phone</FieldLabel>
            <input
              className={FIELD}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 4 000 0000"
            />
          </div>
        </div>
        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={() => {
            if (!canSubmit) return;
            onSave({ name: name.trim(), address: address.trim(), phone: phone.trim() });
            onOpenChange(false);
          }}
          submitLabel={initial ? "Save changes" : "Add branch"}
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

function ArchiveConfirmDialog({
  open,
  onOpenChange,
  label,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  label: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[440px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Archive {label}?
          </DialogTitle>
          <DialogDescription>
            Archived items are hidden from active lists but their history is preserved.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 text-sm text-slate-600">
          You can restore it later from the archive.
        </div>
        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={() => {
            onConfirm();
            onOpenChange(false);
          }}
          submitLabel="Archive"
        />
      </DialogContent>
    </Dialog>
  );
}

function BranchesSection() {
  const [branches, setBranches] = useState<Branch[]>([
    {
      id: "b1",
      name: "Gold & Diamond Park",
      address: "Gold & Diamond Park, Al Quoz, Dubai",
      phone: "+971 4 123 4567",
    },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [archiving, setArchiving] = useState<Branch | null>(null);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(b: Branch) {
    setEditing(b);
    setDialogOpen(true);
  }

  function handleSave(data: { name: string; address: string; phone: string }) {
    if (editing) {
      setBranches((prev) =>
        prev.map((b) => (b.id === editing.id ? { ...b, ...data } : b))
      );
      toast.success("Branch updated");
    } else {
      setBranches((prev) => [
        ...prev,
        { id: `b${Date.now()}`, ...data },
      ]);
      toast.success("Branch added");
    }
  }

  function handleArchive(id: string) {
    setBranches((prev) => prev.filter((b) => b.id !== id));
    toast.success("Branch archived");
  }

  const onlyOne = branches.length <= 1;

  return (
    <div>
      <SectionHeader
        title="Branches"
        description="Physical locations and campus settings."
        action={<AddButton label="Add Branch" onClick={openAdd} />}
      />
      <Table headers={["Branch", "Address", "Phone", "Status", "Actions"]}>
        {branches.map((b) => (
          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{b.name}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{b.address}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{b.phone}</td>
            <td className="px-4 py-3.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                Active
              </span>
            </td>
            <td className="px-4 py-3.5">
              <div className="flex items-center gap-1">
                <TableAction label="Edit" onClick={() => openEdit(b)} />
                {onlyOne ? (
                  <Tooltip>
                    <TooltipTrigger>
                      <span>
                        <TableAction label="Archive" disabled />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Cannot archive — only branch.</TooltipContent>
                  </Tooltip>
                ) : (
                  <TableAction
                    label="Archive"
                    danger
                    onClick={() => setArchiving(b)}
                  />
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>

      <BranchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSave={handleSave}
      />
      <ArchiveConfirmDialog
        open={archiving !== null}
        onOpenChange={(o) => !o && setArchiving(null)}
        label={archiving?.name ?? ""}
        onConfirm={() => archiving && handleArchive(archiving.id)}
      />
    </div>
  );
}

// ─── Section 3: Departments ────────────────────────────────────────────────────

const YEAR_GROUPS = ["FS1", "FS2", "Y1", "Y2", "Y3", "Y4", "Y5", "Y6", "Y7", "Y8", "Y9", "Y10", "Y11", "Y12", "Y13"] as const;
type YearGroup = typeof YEAR_GROUPS[number];

const DEPT_COLOURS = [
  { hex: "#F97316", label: "Orange" },
  { hex: "#3B82F6", label: "Blue" },
  { hex: "#8B5CF6", label: "Purple" },
  { hex: "#22C55E", label: "Green" },
  { hex: "#EF4444", label: "Red" },
  { hex: "#EAB308", label: "Yellow" },
  { hex: "#EC4899", label: "Pink" },
  { hex: "#64748B", label: "Grey" },
];

function ygIndex(yg: string) {
  return YEAR_GROUPS.indexOf(yg as YearGroup);
}

function rangesOverlap(aFrom: string, aTo: string, bFrom: string, bTo: string) {
  const ai = ygIndex(aFrom), aj = ygIndex(aTo);
  const bi = ygIndex(bFrom), bj = ygIndex(bTo);
  return ai <= bj && bi <= aj;
}

function DepartmentDialog({
  open,
  onOpenChange,
  initial,
  allDepts,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: DeptData | null;
  allDepts: DeptData[];
  onSave: (data: Omit<DeptData, "id" | "active" | "studentCount">) => void;
}) {
  const [name, setName]           = useState("");
  const [ygFrom, setYgFrom]       = useState<string>("FS1");
  const [ygTo, setYgTo]           = useState<string>("FS1");
  const [colour, setColour]       = useState(DEPT_COLOURS[0].hex);
  const [hexInput, setHexInput]   = useState(DEPT_COLOURS[0].hex);
  const [sortOrder, setSortOrder] = useState("");
  const [overlapErr, setOverlapErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setYgFrom(initial?.yearGroupFrom ?? "FS1");
      setYgTo(initial?.yearGroupTo ?? "FS1");
      setColour(initial?.colour ?? DEPT_COLOURS[0].hex);
      setHexInput(initial?.colour ?? DEPT_COLOURS[0].hex);
      setSortOrder(initial ? String(initial.sortOrder) : String(allDepts.filter(d => d.active).length + 1));
      setOverlapErr(null);
    }
  }, [open, initial, allDepts]);

  // keep ygTo >= ygFrom
  useEffect(() => {
    if (ygIndex(ygTo) < ygIndex(ygFrom)) setYgTo(ygFrom);
  }, [ygFrom, ygTo]);

  function validate() {
    const conflict = allDepts.find(
      (d) =>
        d.active &&
        d.id !== initial?.id &&
        rangesOverlap(ygFrom, ygTo, d.yearGroupFrom, d.yearGroupTo)
    );
    if (conflict) {
      setOverlapErr(`Year groups ${conflict.yearGroupFrom}–${conflict.yearGroupTo} are already assigned to ${conflict.name}.`);
      return false;
    }
    setOverlapErr(null);
    return true;
  }

  function handleColourSwatch(hex: string) {
    setColour(hex);
    setHexInput(hex);
  }

  function handleHexInput(val: string) {
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) setColour(val);
  }

  const canSubmit = name.trim() && ygFrom && ygTo && sortOrder && Number(sortOrder) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[520px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit department" : "Add department"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update department details." : "Create a new academic department."}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div>
            <FieldLabel required>Department name</FieldLabel>
            <input
              className={FIELD}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Foundation"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Year group from</FieldLabel>
              <select
                className={FIELD}
                value={ygFrom}
                onChange={(e) => setYgFrom(e.target.value)}
              >
                {YEAR_GROUPS.map((yg) => (
                  <option key={yg} value={yg}>{yg}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel required>Year group to</FieldLabel>
              <select
                className={FIELD}
                value={ygTo}
                onChange={(e) => setYgTo(e.target.value)}
              >
                {YEAR_GROUPS.filter((yg) => ygIndex(yg) >= ygIndex(ygFrom)).map((yg) => (
                  <option key={yg} value={yg}>{yg}</option>
                ))}
              </select>
            </div>
          </div>

          {overlapErr && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
              {overlapErr}
            </p>
          )}

          <div>
            <FieldLabel required>Colour</FieldLabel>
            <div className="flex items-center gap-3 flex-wrap">
              {DEPT_COLOURS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => handleColourSwatch(c.hex)}
                  title={c.label}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-transform cursor-pointer",
                    colour === c.hex ? "border-slate-800 scale-110" : "border-white shadow-sm"
                  )}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
              <div className="flex items-center gap-1.5 ml-1">
                <div
                  className="w-7 h-7 rounded-full border border-slate-200 flex-shrink-0"
                  style={{ backgroundColor: /^#[0-9A-Fa-f]{6}$/.test(hexInput) ? hexInput : "#fff" }}
                />
                <input
                  className="w-24 px-2 py-1 text-xs border border-slate-200 rounded-md font-mono bg-white focus:outline-none focus:border-amber-400"
                  value={hexInput}
                  onChange={(e) => handleHexInput(e.target.value)}
                  placeholder="#F97316"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          <div className="w-32">
            <FieldLabel required>Sort order</FieldLabel>
            <input
              className={FIELD}
              type="number"
              min={1}
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
        </div>
        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={() => {
            if (!canSubmit) return;
            if (!validate()) return;
            onSave({
              name: name.trim(),
              yearGroupFrom: ygFrom,
              yearGroupTo: ygTo,
              colour,
              sortOrder: Number(sortOrder),
            });
            onOpenChange(false);
          }}
          submitLabel={initial ? "Save changes" : "Add department"}
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

function DepartmentArchiveDialog({
  open,
  onOpenChange,
  dept,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  dept: DeptData | null;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[440px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            Archive {dept?.name}?
          </DialogTitle>
          <DialogDescription>
            Archived departments are hidden from all pickers but their historical data is retained.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4 text-sm text-slate-600">
          You can restore this department at any time from the archived section below.
        </div>
        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={() => { onConfirm(); onOpenChange(false); }}
          submitLabel="Archive"
        />
      </DialogContent>
    </Dialog>
  );
}

function DepartmentsSection() {
  const [depts, setDepts] = useState<DeptData[]>(() =>
    [...mockDepartments].sort((a, b) => a.sortOrder - b.sortOrder)
  );
  const [dialogOpen, setDialogOpen]       = useState(false);
  const [editing, setEditing]             = useState<DeptData | null>(null);
  const [archiving, setArchiving]         = useState<DeptData | null>(null);
  const [archivedOpen, setArchivedOpen]   = useState(false);

  const activeDepts   = depts.filter((d) => d.active).sort((a, b) => a.sortOrder - b.sortOrder);
  const archivedDepts = depts.filter((d) => !d.active);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(d: DeptData) {
    setEditing(d);
    setDialogOpen(true);
  }

  function handleSave(data: Omit<DeptData, "id" | "active" | "studentCount">) {
    if (editing) {
      setDepts((prev) => prev.map((d) => d.id === editing.id ? { ...d, ...data } : d));
      toast.success("Department saved");
    } else {
      setDepts((prev) => [
        ...prev,
        {
          id: `d${Date.now()}`,
          active: true,
          studentCount: 0,
          ...data,
        },
      ]);
      toast.success("Department added");
    }
  }

  function handleArchive(id: string) {
    setDepts((prev) => prev.map((d) => d.id === id ? { ...d, active: false } : d));
    toast.success("Department archived");
  }

  function handleRestore(id: string) {
    setDepts((prev) => prev.map((d) => d.id === id ? { ...d, active: true } : d));
    toast.success("Department restored");
  }

  // Year group mapping — derived
  const ygMap = useMemo(() => {
    const map: Record<string, DeptData | null> = {};
    for (const yg of YEAR_GROUPS) {
      map[yg] = activeDepts.find(
        (d) => ygIndex(yg) >= ygIndex(d.yearGroupFrom) && ygIndex(yg) <= ygIndex(d.yearGroupTo)
      ) ?? null;
    }
    return map;
  }, [activeDepts]);

  return (
    <div>
      <SectionHeader
        title="Departments"
        description="Academic departments and year group mappings."
        action={<AddButton label="Add Department" onClick={openAdd} />}
      />

      {/* Active departments */}
      <Table headers={["", "Department", "Year Groups", "Students", "Status", "Actions"]}>
        {activeDepts.map((d) => {
          const canArchive = d.studentCount === 0;
          return (
            <tr key={d.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3.5 w-8">
                <span
                  className="block w-3.5 h-3.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: d.colour }}
                />
              </td>
              <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{d.name}</td>
              <td className="px-4 py-3.5 text-sm text-slate-600">
                {d.yearGroupFrom} – {d.yearGroupTo}
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {d.studentCount.toLocaleString()} students
                </span>
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  Active
                </span>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1">
                  <TableAction label="Edit" onClick={() => openEdit(d)} />
                  {canArchive ? (
                    <TableAction
                      label="Archive"
                      danger
                      onClick={() => setArchiving(d)}
                    />
                  ) : (
                    <Tooltip>
                      <TooltipTrigger>
                        <span>
                          <TableAction label="Archive" disabled />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Cannot archive — {d.studentCount.toLocaleString()} students are enrolled in this department.
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </Table>

      {/* Archived departments */}
      {archivedDepts.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setArchivedOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-3"
          >
            {archivedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Archived ({archivedDepts.length})
          </button>
          {archivedOpen && (
            <Table headers={["", "Department", "Year Groups", "Students", "Status", "Actions"]}>
              {archivedDepts.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors opacity-60">
                  <td className="px-4 py-3.5 w-8">
                    <span
                      className="block w-3.5 h-3.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: d.colour }}
                    />
                  </td>
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-700">{d.name}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">
                    {d.yearGroupFrom} – {d.yearGroupTo}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      {d.studentCount.toLocaleString()} students
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      Archived
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <TableAction label="Restore" onClick={() => handleRestore(d.id)} />
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}

      {/* Year Group Mapping */}
      <div className="mt-8">
        <p className="text-sm font-semibold text-slate-700 mb-3">Year Group Mapping</p>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Year Group</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {YEAR_GROUPS.map((yg) => {
                const dept = ygMap[yg];
                return (
                  <tr key={yg} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-sm font-medium text-slate-700">{yg}</td>
                    <td className="px-4 py-2.5">
                      {dept ? (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: dept.colour }}
                          />
                          <span className="text-sm text-slate-700">{dept.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-start gap-1.5 mt-2.5">
          <Info className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-slate-500">
            Year group assignments are used for automatic department assignment when a student record is created.
          </p>
        </div>
      </div>

      <DepartmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        allDepts={depts}
        onSave={handleSave}
      />
      <DepartmentArchiveDialog
        open={archiving !== null}
        onOpenChange={(o) => !o && setArchiving(null)}
        dept={archiving}
        onConfirm={() => archiving && handleArchive(archiving.id)}
      />
    </div>
  );
}

// ─── Section 4: Rooms ──────────────────────────────────────────────────────────

type RoomType = "Classroom" | "Lab" | "Office";
type Room = {
  id: string;
  name: string;
  branch: string;
  capacity: number;
  soft: number;
  hard: number;
  type: RoomType;
  active: boolean;
};

const ROOM_BRANCH_OPTIONS = ["Gold & Diamond Park"];

function RoomDialog({
  open,
  onOpenChange,
  initial,
  branches,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: Room | null;
  branches: string[];
  onSave: (data: { name: string; branch: string; capacity: number; soft: number; hard: number; type: RoomType }) => void;
}) {
  const [roomName, setRoomName] = useState("");
  const [branch, setBranch]    = useState(branches[0] ?? "");
  const [capacity, setCapacity] = useState("");
  const [soft, setSoft]        = useState("");
  const [hard, setHard]        = useState("");
  const [type, setType]        = useState<RoomType>("Classroom");

  useEffect(() => {
    if (open) {
      setRoomName(initial?.name ?? "");
      setBranch(initial?.branch ?? branches[0] ?? "");
      setCapacity(initial ? String(initial.capacity) : "");
      setSoft(initial ? String(initial.soft) : "");
      setHard(initial ? String(initial.hard) : "");
      setType(initial?.type ?? "Classroom");
    }
  }, [open, initial, branches]);

  // sync soft/hard to capacity when blank
  const capNum  = Number(capacity);
  const softNum = soft !== "" ? Number(soft)  : capNum;
  const hardNum = hard !== "" ? Number(hard)  : capNum;

  const canSubmit = roomName.trim() && branch && capNum > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[480px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit room" : "Add room"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update room details." : "Register a new room and its default capacity."}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div>
            <FieldLabel required>Room name</FieldLabel>
            <input
              className={FIELD}
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="e.g. Room 4A"
            />
          </div>
          <div>
            <FieldLabel required>Branch</FieldLabel>
            <select
              className={FIELD}
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
            >
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel required>Capacity</FieldLabel>
              <input
                className={FIELD}
                type="number"
                min={1}
                max={100}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                placeholder="6"
              />
            </div>
            <div>
              <FieldLabel>Soft cap</FieldLabel>
              <input
                className={FIELD}
                type="number"
                min={1}
                max={100}
                value={soft}
                onChange={(e) => setSoft(e.target.value)}
                placeholder={capacity || "—"}
              />
            </div>
            <div>
              <FieldLabel>Hard cap</FieldLabel>
              <input
                className={FIELD}
                type="number"
                min={1}
                max={100}
                value={hard}
                onChange={(e) => setHard(e.target.value)}
                placeholder={capacity || "—"}
              />
            </div>
          </div>
          <div>
            <FieldLabel required>Type</FieldLabel>
            <select
              className={FIELD}
              value={type}
              onChange={(e) => setType(e.target.value as RoomType)}
            >
              <option>Classroom</option>
              <option>Lab</option>
              <option>Office</option>
            </select>
          </div>
        </div>
        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={() => {
            if (!canSubmit) return;
            onSave({
              name: roomName.trim(),
              branch,
              capacity: capNum,
              soft: softNum,
              hard: hardNum,
              type,
            });
            onOpenChange(false);
          }}
          submitLabel={initial ? "Save changes" : "Add room"}
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

function RoomsSection() {
  const [rooms, setRooms] = useState<Room[]>([
    { id: "r1", name: "Room 1A", branch: "Gold & Diamond Park", capacity: 6, soft: 5, hard: 6, type: "Classroom", active: true },
    { id: "r2", name: "Room 2B", branch: "Gold & Diamond Park", capacity: 4, soft: 4, hard: 4, type: "Classroom", active: true },
    { id: "r3", name: "Room 3A", branch: "Gold & Diamond Park", capacity: 8, soft: 7, hard: 8, type: "Classroom", active: true },
    { id: "r4", name: "Room 1C", branch: "Gold & Diamond Park", capacity: 4, soft: 4, hard: 4, type: "Classroom", active: true },
    { id: "r5", name: "Room 2A", branch: "Gold & Diamond Park", capacity: 6, soft: 5, hard: 6, type: "Classroom", active: true },
  ]);
  const [dialogOpen, setDialogOpen]   = useState(false);
  const [editing, setEditing]         = useState<Room | null>(null);
  const [archiving, setArchiving]     = useState<Room | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const activeRooms   = rooms.filter((r) => r.active);
  const archivedRooms = rooms.filter((r) => !r.active);

  // rooms with scheduled timetable sessions cannot be archived
  const scheduledRoomNames = useMemo(
    () => new Set(timetableSessions.map((s) => s.room)),
    []
  );

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(r: Room) {
    setEditing(r);
    setDialogOpen(true);
  }

  function handleSave(data: { name: string; branch: string; capacity: number; soft: number; hard: number; type: RoomType }) {
    if (editing) {
      setRooms((prev) => prev.map((r) => r.id === editing.id ? { ...r, ...data } : r));
      toast.success("Room saved");
    } else {
      setRooms((prev) => [
        ...prev,
        { id: `r${Date.now()}`, active: true, ...data },
      ]);
      toast.success("Room added");
    }
  }

  function handleArchive(id: string) {
    setRooms((prev) => prev.map((r) => r.id === id ? { ...r, active: false } : r));
    toast.success("Room archived");
  }

  function handleRestore(id: string) {
    setRooms((prev) => prev.map((r) => r.id === id ? { ...r, active: true } : r));
    toast.success("Room restored");
  }

  return (
    <div>
      <SectionHeader
        title="Rooms"
        description="Classroom capacity and occupancy caps per branch."
        action={<AddButton label="Add Room" onClick={openAdd} />}
      />
      <Table headers={["Room", "Branch", "Capacity", "Soft Cap", "Hard Cap", "Status", "Actions"]}>
        {activeRooms.map((r) => {
          const hasScheduled = scheduledRoomNames.has(r.name);
          return (
            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{r.name}</td>
              <td className="px-4 py-3.5 text-sm text-slate-600">{r.branch}</td>
              <td className="px-4 py-3.5 text-sm text-slate-600">{r.capacity}</td>
              <td className="px-4 py-3.5 text-sm text-slate-600">
                {r.soft !== r.capacity ? r.soft : <span className="text-slate-400">—</span>}
              </td>
              <td className="px-4 py-3.5 text-sm text-slate-600">
                {r.hard !== r.capacity ? r.hard : <span className="text-slate-400">—</span>}
              </td>
              <td className="px-4 py-3.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                  Active
                </span>
              </td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-1">
                  <TableAction label="Edit" onClick={() => openEdit(r)} />
                  {hasScheduled ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <span>
                          <TableAction label="Archive" disabled />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Cannot archive — sessions scheduled in this room.</TooltipContent>
                    </Tooltip>
                  ) : (
                    <TableAction
                      label="Archive"
                      danger
                      onClick={() => setArchiving(r)}
                    />
                  )}
                </div>
              </td>
            </tr>
          );
        })}
      </Table>

      {/* Archived rooms */}
      {archivedRooms.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setArchivedOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer mb-3"
          >
            {archivedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Archived ({archivedRooms.length})
          </button>
          {archivedOpen && (
            <Table headers={["Room", "Branch", "Capacity", "Soft Cap", "Hard Cap", "Status", "Actions"]}>
              {archivedRooms.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors opacity-60">
                  <td className="px-4 py-3.5 text-sm font-medium text-slate-700">{r.name}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{r.branch}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{r.capacity}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{r.soft}</td>
                  <td className="px-4 py-3.5 text-sm text-slate-500">{r.hard}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      Archived
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <TableAction label="Restore" onClick={() => handleRestore(r.id)} />
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>
      )}

      <RoomDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        branches={ROOM_BRANCH_OPTIONS}
        onSave={handleSave}
      />
      <ArchiveConfirmDialog
        open={archiving !== null}
        onOpenChange={(o) => !o && setArchiving(null)}
        label={archiving?.name ?? ""}
        onConfirm={() => archiving && handleArchive(archiving.id)}
      />
    </div>
  );
}

// ─── Section 5: Billing & Invoicing ───────────────────────────────────────────

function BillingSection() {
  const revenue = [
    {
      dept: "Primary",
      account: "Emirates NBD — Primary",
      iban: "AE07 0331 234567890123456",
    },
    {
      dept: "Lower Secondary",
      account: "Emirates NBD — Secondary",
      iban: "AE07 0331 234567890123457",
    },
    {
      dept: "Senior",
      account: "Emirates NBD — Senior",
      iban: "AE07 0331 234567890123458",
    },
  ];
  return (
    <div>
      <SectionHeader
        title="Billing & Invoicing"
        description="Invoice configuration, VAT settings, and revenue routing."
      />
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <FormField label="Invoice Number Prefix" defaultValue="INV-" />
          <FormField label="Invoice Number Format" defaultValue="INV-#### (sequential)" />
          <FormField label="VAT Rate" defaultValue="5%" />
          <FormField label="Default Payment Terms" defaultValue="7 days" />
          <FormField label="Enrolment Fee" defaultValue="AED 300" />
          <FormSelect
            label="Enrolment Fee Type"
            value="Lifetime (charged once per student)"
            options={[
              "Lifetime (charged once per student)",
              "Annual",
              "Per Enrolment",
            ]}
          />
          <FormTextarea
            label="Invoice Footer Text"
            defaultValue="Thank you for choosing Improve ME Institute."
          />
        </div>
        <SaveButton />
      </Card>

      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-700">Revenue Tags</p>
        <p className="text-xs text-slate-500 mt-0.5">
          Map departments to bank accounts for financial reporting.
        </p>
      </div>
      <Table headers={["Department", "Bank Account", "IBAN"]}>
        {revenue.map((r) => (
          <tr key={r.dept} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{r.dept}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{r.account}</td>
            <td className="px-4 py-3.5 text-sm font-mono text-slate-600 text-xs">{r.iban}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

// ─── Section 6: Payment Plans ──────────────────────────────────────────────────

function PaymentPlansSection() {
  return (
    <div>
      <SectionHeader
        title="Payment Plans"
        description="Instalment splits, late fees, and automated reminder schedules."
      />
      <Card className="p-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <FormField label="Minimum First Instalment" defaultValue="50% of invoice total" />
          <FormSelect
            label="Late Payment Fee"
            value="None"
            options={["None", "AED 50 flat", "5% of outstanding"]}
          />
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Payment Plan Splits Available
            </label>
            <div className="flex flex-wrap gap-2">
              {["Full", "60-40", "50-50", "Monthly"].map((plan) => (
                <span
                  key={plan}
                  className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200"
                >
                  {plan}
                </span>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Overdue Auto-Reminder Schedule
            </label>
            <div className="flex flex-wrap gap-2">
              {["7 days before", "3 days before", "Due date", "3 days after", "7 days after"].map(
                (r) => (
                  <span
                    key={r}
                    className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full"
                  >
                    {r}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
        <SaveButton />
      </Card>
    </div>
  );
}

// ─── Section 7: Academic Calendar ─────────────────────────────────────────────

// ── Utilities ──────────────────────────────────────────────────────────────────

const CAL_DAY_MS = 86_400_000;

function calDayDiff(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / CAL_DAY_MS);
}

function calDurationLabel(start: string, end: string): string {
  const days = calDayDiff(start, end) + 1;
  const w = Math.floor(days / 7);
  const d = days % 7;
  if (d === 0) return `${w} week${w !== 1 ? "s" : ""}`;
  return `${w} week${w !== 1 ? "s" : ""} ${d} day${d !== 1 ? "s" : ""}`;
}

function fmtISODate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Part 3 helper — not exported; referenced by invoice builder in future use
function getBillableWeeks(
  termId: string,
  departmentId: string,
  periods: CalendarPeriod[]
): { totalWeeks: number; pausedWeeks: number; billableWeeks: number } {
  const term = periods.find((p) => p.id === termId && p.type === "term");
  if (!term) return { totalWeeks: 0, pausedWeeks: 0, billableWeeks: 0 };

  const termStartMs = new Date(term.startDate).getTime();
  const termEndMs   = new Date(term.endDate).getTime();
  const totalWeeks  = Math.floor((termEndMs - termStartMs) / (7 * CAL_DAY_MS));

  const halfTermsInTerm = periods.filter(
    (p) =>
      p.type === "half_term" &&
      new Date(p.startDate).getTime() >= termStartMs &&
      new Date(p.endDate).getTime() <= termEndMs
  );

  let pausedWeeks = 0;
  for (const ht of halfTermsInTerm) {
    const pause = ht.departmentPauses?.find((dp) => dp.departmentId === departmentId);
    if (pause?.paused) {
      const dur =
        (new Date(ht.endDate).getTime() - new Date(ht.startDate).getTime()) / CAL_DAY_MS;
      pausedWeeks += Math.ceil(dur / 7);
    }
  }

  return { totalWeeks, pausedWeeks, billableWeeks: totalWeeks - pausedWeeks };
}

function hasSessionsInPeriod(period: CalendarPeriod): boolean {
  const startMs = new Date(period.startDate).getTime();
  const endMs   = new Date(period.endDate).getTime();
  return timetableSessions.some((s) => {
    const parts = s.date.split(" ");
    if (parts.length !== 2) return false;
    for (const yr of [2025, 2026]) {
      const d = new Date(`${parts[0]} ${parts[1]} ${yr}`);
      if (!isNaN(d.getTime()) && d.getTime() >= startMs && d.getTime() <= endMs) return true;
    }
    return false;
  });
}

function getMonthLabels(
  yearStart: string,
  yearEnd: string
): Array<{ label: string; pct: number }> {
  const totalDays = calDayDiff(yearStart, yearEnd);
  const end = new Date(yearEnd);
  const cur = new Date(
    new Date(yearStart).getFullYear(),
    new Date(yearStart).getMonth(),
    1
  );
  const labels: Array<{ label: string; pct: number }> = [];
  while (cur <= end) {
    const iso    = cur.toISOString().split("T")[0];
    const offset = calDayDiff(yearStart, iso);
    labels.push({
      label: cur.toLocaleDateString("en-GB", { month: "short" }),
      pct:   (Math.max(0, offset) / totalDays) * 100,
    });
    cur.setMonth(cur.getMonth() + 1);
  }
  return labels;
}

// ── Colour maps ────────────────────────────────────────────────────────────────

const PERIOD_BG: Record<string, string> = {
  term:          "bg-green-500",
  half_term:     "bg-amber-400",
  holiday_break: "bg-gray-300",
  summer_term:   "bg-teal-500",
  closure:       "bg-red-300",
};

const PERIOD_BADGE: Record<string, string> = {
  term:          "bg-green-50 text-green-700 border-green-200",
  half_term:     "bg-amber-50 text-amber-700 border-amber-200",
  holiday_break: "bg-gray-100 text-gray-600 border-gray-200",
  summer_term:   "bg-teal-50 text-teal-700 border-teal-200",
  closure:       "bg-red-50 text-red-700 border-red-200",
};

const PERIOD_TYPE_LABEL: Record<string, string> = {
  term:          "Term",
  half_term:     "Half-Term",
  holiday_break: "Holiday Break",
  summer_term:   "Summer Term",
  closure:       "Closure",
};

const DEPT_COLOUR_BY_ID: Record<string, string> = {
  "dept-primary":  "#F97316",
  "dept-lowersec": "#3B82F6",
  "dept-senior":   "#8B5CF6",
};

const DEPT_PAUSE_ROWS = [
  { id: "dept-primary",  name: "Primary"         },
  { id: "dept-lowersec", name: "Lower Secondary" },
  { id: "dept-senior",   name: "Senior"          },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function PauseToggle({ paused, onChange }: { paused: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={paused}
      onClick={onChange}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
        paused ? "bg-amber-400" : "bg-green-500"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200",
          paused ? "translate-x-[3px]" : "translate-x-[18px]"
        )}
      />
    </button>
  );
}

function CalendarTimeline({
  year,
  periods,
  holidays,
}: {
  year: AcademicYear;
  periods: CalendarPeriod[];
  holidays: PublicHoliday[];
}) {
  const totalDays  = calDayDiff(year.startDate, year.endDate);
  const monthLabels = getMonthLabels(year.startDate, year.endDate);

  return (
    <div>
      {/* Public holiday triangle markers */}
      <div className="relative h-4 mb-1">
        {holidays.map((h) => {
          const offset = calDayDiff(year.startDate, h.date);
          if (offset < 0 || offset > totalDays) return null;
          const pct = (offset / totalDays) * 100;
          return (
            <Tooltip key={h.id}>
              <TooltipTrigger>
                <div
                  className="absolute -translate-x-1/2 cursor-default w-0 h-0"
                  style={{
                    left: `${pct}%`,
                    top: 0,
                    borderLeft: "5px solid transparent",
                    borderRight: "5px solid transparent",
                    borderBottom: "8px solid #EF4444",
                  }}
                />
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs font-medium">{h.name}</p>
                <p className="text-xs text-slate-400">{fmtISODate(h.date)}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Proportional bar */}
      <div className="relative h-10 bg-slate-100 rounded-lg overflow-hidden">
        {periods.map((p) => {
          const offset = calDayDiff(year.startDate, p.startDate);
          const dur    = calDayDiff(p.startDate, p.endDate) + 1;
          const left   = (offset / totalDays) * 100;
          const width  = (dur / totalDays) * 100;
          return (
            <Tooltip key={p.id}>
              <TooltipTrigger>
                <div
                  className={cn(
                    "absolute inset-y-0 flex items-center justify-center overflow-hidden cursor-default",
                    PERIOD_BG[p.type],
                    p.type === "half_term" ? "opacity-75" : ""
                  )}
                  style={{ left: `${left}%`, width: `${width}%` }}
                >
                  {width > 4 && (
                    <span
                      className={cn(
                        "text-[10px] font-semibold truncate px-1.5",
                        p.type === "holiday_break" ? "text-slate-600" : "text-white"
                      )}
                    >
                      {p.name}
                    </span>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs font-semibold">{p.name}</p>
                <p className="text-xs text-slate-400">
                  {fmtISODate(p.startDate)} – {fmtISODate(p.endDate)}
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Month labels */}
      <div className="relative h-5 mt-1">
        {monthLabels.map(({ label, pct }) => (
          <span
            key={`${label}-${pct}`}
            className="absolute text-[10px] text-slate-400 -translate-x-1/2 select-none"
            style={{ left: `${pct}%` }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-100">
        {(Object.entries(PERIOD_TYPE_LABEL) as [string, string][]).map(([type, label]) => (
          <div key={type} className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className={cn("w-2.5 h-2.5 rounded-sm inline-block", PERIOD_BG[type])} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <div
            className="w-0 h-0 inline-block"
            style={{
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderBottom: "6px solid #EF4444",
            }}
          />
          Public Holiday
        </div>
      </div>
    </div>
  );
}

function TermBillableTable({
  termId,
  periods,
}: {
  termId: string;
  periods: CalendarPeriod[];
}) {
  return (
    <div className="mt-4 rounded-md border border-slate-100 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {["Department", "Total weeks", "Paused weeks", "Billable weeks"].map((h) => (
              <th
                key={h}
                className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {DEPT_PAUSE_ROWS.map((dept) => {
            const { totalWeeks, pausedWeeks, billableWeeks } = getBillableWeeks(
              termId,
              dept.id,
              periods
            );
            return (
              <tr key={dept.id}>
                <td className="px-3 py-2 text-slate-700 font-medium">{dept.name}</td>
                <td className="px-3 py-2 text-slate-600">{totalWeeks}</td>
                <td className="px-3 py-2">
                  {pausedWeeks > 0 ? (
                    <span className="text-amber-600 font-semibold">{pausedWeeks}</span>
                  ) : (
                    <span className="text-slate-400">0</span>
                  )}
                </td>
                <td className="px-3 py-2 font-semibold text-green-700">{billableWeeks}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function PeriodCard({
  period,
  allPeriods,
  onEdit,
  onDelete,
  onTogglePause,
}: {
  period: CalendarPeriod;
  allPeriods: CalendarPeriod[];
  onEdit: (p: CalendarPeriod) => void;
  onDelete: (id: string) => void;
  onTogglePause: (periodId: string, deptId: string) => void;
}) {
  const hasSessions = hasSessionsInPeriod(period);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const parentTerm =
    period.type === "half_term"
      ? allPeriods.find(
          (p) =>
            p.type === "term" &&
            new Date(p.startDate).getTime() <= new Date(period.startDate).getTime() &&
            new Date(p.endDate).getTime() >= new Date(period.endDate).getTime()
        )
      : undefined;

  return (
    <Card className="mb-3 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: badge + name + date range */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0",
                  PERIOD_BADGE[period.type]
                )}
              >
                {PERIOD_TYPE_LABEL[period.type]}
              </span>
              <span className="text-sm font-semibold text-slate-900">{period.name}</span>
            </div>
            <p className="text-xs text-slate-500">
              {fmtISODate(period.startDate)} – {fmtISODate(period.endDate)}
              <span className="mx-1.5 text-slate-300">·</span>
              {calDurationLabel(period.startDate, period.endDate)}
            </p>
          </div>

          {/* Right: edit + delete */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={() => onEdit(period)}
              className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Edit period"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <Tooltip>
              <TooltipTrigger>
                <button
                  onClick={() => !hasSessions && setDeleteConfirm(true)}
                  disabled={hasSessions}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    hasSessions
                      ? "text-slate-200 cursor-not-allowed"
                      : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                  )}
                  aria-label="Delete period"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </TooltipTrigger>
              {hasSessions && (
                <TooltipContent side="left">
                  <p className="text-xs">Sessions are scheduled in this period</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>

        {/* Term: billable weeks table */}
        {period.type === "term" && (
          <TermBillableTable termId={period.id} periods={allPeriods} />
        )}

        {/* Summer term: ad hoc billing note */}
        {period.type === "summer_term" && (
          <div className="mt-3 rounded-md bg-teal-50 border border-teal-100 px-3 py-2">
            <p className="text-xs text-teal-700">
              Ad hoc billing · Sessions booked and invoiced individually · No regular weekly
              sessions · All departments active
            </p>
          </div>
        )}

        {/* Holiday break: info note */}
        {period.type === "holiday_break" && (
          <div className="mt-3 rounded-md bg-slate-50 border border-slate-200 px-3 py-2">
            <p className="text-xs text-slate-500">
              Regular weekly sessions do not run · Departments may schedule intensive or revision
              sessions independently
            </p>
          </div>
        )}

        {/* Half-term: department pause toggles */}
        {period.type === "half_term" && period.departmentPauses && (
          <div className="mt-3 space-y-2.5">
            {period.departmentPauses.map((dp) => {
              // Compute impact: billable weeks for parent term with vs without this pause
              const withPause = parentTerm
                ? getBillableWeeks(parentTerm.id, dp.departmentId, allPeriods).billableWeeks
                : null;
              const withoutPause =
                parentTerm && dp.paused
                  ? getBillableWeeks(
                      parentTerm.id,
                      dp.departmentId,
                      allPeriods.map((p) =>
                        p.id === period.id
                          ? {
                              ...p,
                              departmentPauses: p.departmentPauses?.map((d) =>
                                d.departmentId === dp.departmentId ? { ...d, paused: false } : d
                              ),
                            }
                          : p
                      )
                    ).billableWeeks
                  : null;

              return (
                <div key={dp.departmentId}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: DEPT_COLOUR_BY_ID[dp.departmentId] ?? "#94A3B8",
                        }}
                      />
                      <span className="text-xs text-slate-700">{dp.departmentName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          dp.paused ? "text-amber-600" : "text-green-600"
                        )}
                      >
                        {dp.paused ? "Pauses" : "Continues"}
                      </span>
                      <PauseToggle
                        paused={dp.paused}
                        onChange={() => onTogglePause(period.id, dp.departmentId)}
                      />
                    </div>
                  </div>
                  {dp.paused && parentTerm && withPause !== null && withoutPause !== null && (
                    <p className="text-[10px] text-slate-400 mt-0.5 pl-4">
                      {parentTerm.name} billable weeks for {dp.departmentName}: {withoutPause} →{" "}
                      {withPause}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inline delete confirmation strip */}
      {deleteConfirm && (
        <div className="border-t border-rose-100 bg-rose-50 px-4 py-3 flex items-center justify-between gap-4">
          <p className="text-xs text-rose-700 font-medium">
            Delete "{period.name}"? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setDeleteConfirm(false)}
              className="text-xs px-3 py-1.5 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onDelete(period.id);
                setDeleteConfirm(false);
              }}
              className="text-xs px-3 py-1.5 bg-rose-500 text-white rounded hover:bg-rose-600 transition-colors cursor-pointer"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function AddPublicHolidayModal({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (h: { name: string; date: string }) => void;
}) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setDate("");
    }
  }, [open]);

  const canSubmit = name.trim() && date;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[440px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Add Public Holiday</DialogTitle>
          <DialogDescription>Add a custom public holiday to this academic year.</DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div>
            <FieldLabel required>Holiday name</FieldLabel>
            <input
              className={FIELD}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eid Arafat Day"
            />
          </div>
          <div>
            <FieldLabel required>Date</FieldLabel>
            <input
              className={FIELD}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <p className="text-xs text-slate-400">Source will be set to "Custom".</p>
        </div>
        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={() => {
            if (!canSubmit) return;
            onSave({ name: name.trim(), date });
            onOpenChange(false);
          }}
          submitLabel="Add holiday"
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

function PublicHolidaysPanel({
  holidays,
  useUaeTemplate,
  onToggleTemplate,
  onAdd,
  onDelete,
}: {
  holidays: PublicHoliday[];
  useUaeTemplate: boolean;
  onToggleTemplate: (v: boolean) => void;
  onAdd: (h: { name: string; date: string }) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen]                       = useState(false);
  const [addOpen, setAddOpen]                 = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const visible = useUaeTemplate
    ? holidays
    : holidays.filter((h) => h.source === "custom");

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="text-sm font-semibold text-slate-900">Public Holidays</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{visible.length} entries</span>
          {open ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {open && (
        <div className="border border-t-0 border-slate-200 rounded-b-lg bg-white overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Toggle checked={useUaeTemplate} onChange={onToggleTemplate} />
              <span className="text-sm text-slate-700">Use UAE public holiday template</span>
            </div>
            <AddButton label="Add Public Holiday" onClick={() => setAddOpen(true)} />
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Holiday", "Date", "Source", ""].map((h, i) => (
                  <th
                    key={i}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-sm text-slate-400 text-center">
                    No public holidays configured.
                  </td>
                </tr>
              )}
              {visible.map((h) => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-slate-800">{h.name}</td>
                  <td className="px-4 py-3 text-slate-600">{fmtISODate(h.date)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full border font-medium",
                        h.source === "uae_template"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      )}
                    >
                      {h.source === "uae_template" ? "UAE Template" : "Custom"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {h.source === "custom" &&
                      (deleteConfirmId === h.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              onDelete(h.id);
                              setDeleteConfirmId(null);
                            }}
                            className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                          >
                            Confirm delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(h.id)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          aria-label="Delete holiday"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddPublicHolidayModal open={addOpen} onOpenChange={setAddOpen} onSave={onAdd} />
    </div>
  );
}

const PERIOD_TYPE_OPTIONS: Array<{ value: PeriodType; label: string }> = [
  { value: "term",          label: "Term"            },
  { value: "half_term",     label: "Half-Term Break" },
  { value: "holiday_break", label: "Holiday Break"   },
  { value: "summer_term",   label: "Summer Term"     },
  { value: "closure",       label: "Closure"         },
];

const DEFAULT_PAUSES: DepartmentPause[] = [
  { departmentId: "dept-primary",  departmentName: "Primary",         paused: true },
  { departmentId: "dept-lowersec", departmentName: "Lower Secondary", paused: true },
  { departmentId: "dept-senior",   departmentName: "Senior",          paused: true },
];

function AddEditPeriodModal({
  open,
  onOpenChange,
  initial,
  existingPeriods,
  academicYearId,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial: CalendarPeriod | null;
  existingPeriods: CalendarPeriod[];
  academicYearId: string;
  onSave: (data: Omit<CalendarPeriod, "sortOrder" | "id"> & { id?: string }) => void;
}) {
  const [type, setType]             = useState<PeriodType>("term");
  const [name, setName]             = useState("");
  const [startDate, setStartDate]   = useState("");
  const [endDate, setEndDate]       = useState("");
  const [deptPauses, setDeptPauses] = useState<DepartmentPause[]>(
    DEFAULT_PAUSES.map((d) => ({ ...d }))
  );

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setType(initial.type);
      setName(initial.name);
      setStartDate(initial.startDate);
      setEndDate(initial.endDate);
      setDeptPauses(
        initial.departmentPauses
          ? initial.departmentPauses.map((d) => ({ ...d }))
          : DEFAULT_PAUSES.map((d) => ({ ...d }))
      );
    } else {
      setType("term");
      setName("");
      setStartDate("");
      setEndDate("");
      setDeptPauses(DEFAULT_PAUSES.map((d) => ({ ...d })));
    }
  }, [open, initial]);

  function handleTypeChange(t: PeriodType) {
    setType(t);
    const label = PERIOD_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? "";
    if (!name || PERIOD_TYPE_OPTIONS.some((o) => o.label === name)) setName(label);
    if (t === "half_term" && !initial) setDeptPauses(DEFAULT_PAUSES.map((d) => ({ ...d })));
  }

  const dateError = Boolean(startDate && endDate && new Date(endDate) <= new Date(startDate));

  const overlapWith =
    startDate && endDate && !dateError
      ? existingPeriods.find(
          (p) =>
            p.id !== initial?.id &&
            new Date(p.startDate) <= new Date(endDate) &&
            new Date(p.endDate) >= new Date(startDate)
        )
      : null;

  const canSubmit = Boolean(name.trim() && startDate && endDate && !dateError);

  function handleSubmit() {
    if (!canSubmit) return;
    onSave({
      id:               initial?.id,
      academicYearId,
      type,
      name:             name.trim(),
      startDate,
      endDate,
      departmentPauses: type === "half_term" ? deptPauses : undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[520px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit period" : "Add period"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Update this calendar period."
              : "Add a new period to the academic calendar."}
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div>
            <FieldLabel required>Period type</FieldLabel>
            <select
              className={FIELD}
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as PeriodType)}
            >
              {PERIOD_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <FieldLabel required>Name</FieldLabel>
            <input
              className={FIELD}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Term 4"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Start date</FieldLabel>
              <input
                className={FIELD}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel required>End date</FieldLabel>
              <input
                className={FIELD}
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {dateError && (
            <p className="text-xs text-rose-600 -mt-2">End date must be after start date.</p>
          )}

          {overlapWith && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                These dates overlap with <strong>{overlapWith.name}</strong>. Confirm to proceed.
              </p>
            </div>
          )}

          {type === "half_term" && (
            <div>
              <FieldLabel>Department pause settings</FieldLabel>
              <div className="space-y-2 mt-2 rounded-md border border-slate-100 p-3 bg-slate-50">
                {deptPauses.map((dp) => (
                  <div key={dp.departmentId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: DEPT_COLOUR_BY_ID[dp.departmentId] ?? "#94A3B8",
                        }}
                      />
                      <span className="text-sm text-slate-700">{dp.departmentName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          dp.paused ? "text-amber-600" : "text-green-600"
                        )}
                      >
                        {dp.paused ? "Pauses" : "Continues"}
                      </span>
                      <PauseToggle
                        paused={dp.paused}
                        onChange={() =>
                          setDeptPauses((prev) =>
                            prev.map((d) =>
                              d.departmentId === dp.departmentId
                                ? { ...d, paused: !d.paused }
                                : d
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={handleSubmit}
          submitLabel={initial ? "Save changes" : "Add period"}
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddAcademicYearModal({
  open,
  onOpenChange,
  existingYears,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  existingYears: AcademicYear[];
  onSave: (
    data: { name: string; startDate: string; endDate: string; isCurrent: boolean },
    copyFromId?: string
  ) => void;
}) {
  const [yearName, setYearName]     = useState("");
  const [startDate, setStartDate]   = useState("");
  const [endDate, setEndDate]       = useState("");
  const [isCurrent, setIsCurrent]   = useState(false);
  const [copyFromId, setCopyFromId] = useState("");

  useEffect(() => {
    if (open) {
      setYearName("");
      setStartDate("");
      setEndDate("");
      setIsCurrent(false);
      setCopyFromId("");
    }
  }, [open]);

  const dateError  = Boolean(startDate && endDate && new Date(endDate) <= new Date(startDate));
  const canSubmit  = Boolean(yearName.trim() && startDate && endDate && !dateError);
  const hasCurrentYear = existingYears.some((y) => y.isCurrent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[520px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Add Academic Year</DialogTitle>
          <DialogDescription>
            Create a new academic year for this organisation.
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div>
            <FieldLabel required>Year name</FieldLabel>
            <input
              className={FIELD}
              value={yearName}
              onChange={(e) => setYearName(e.target.value)}
              placeholder="e.g. 2026–27"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required>Start date</FieldLabel>
              <input
                className={FIELD}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel required>End date</FieldLabel>
              <input
                className={FIELD}
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          {dateError && (
            <p className="text-xs text-rose-600 -mt-2">End date must be after start date.</p>
          )}

          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-slate-700">Set as current year</span>
            <Toggle checked={isCurrent} onChange={(v) => setIsCurrent(v)} />
          </div>
          {isCurrent && hasCurrentYear && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                This will make <strong>{yearName || "the new year"}</strong> the active academic
                year across the platform.
              </p>
            </div>
          )}

          <div>
            <FieldLabel>Copy period structure from</FieldLabel>
            <select
              className={FIELD}
              value={copyFromId}
              onChange={(e) => setCopyFromId(e.target.value)}
            >
              <option value="">— Start blank</option>
              {existingYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.name}
                </option>
              ))}
            </select>
            {copyFromId && (
              <p className="text-xs text-slate-400 mt-1">
                Dates will shift proportionally · Pause toggles copied
              </p>
            )}
          </div>
        </div>
        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={() => {
            if (!canSubmit) return;
            onSave(
              { name: yearName.trim(), startDate, endDate, isCurrent },
              copyFromId || undefined
            );
            onOpenChange(false);
          }}
          submitLabel="Create academic year"
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────

function AcademicCalendarSection() {
  const [years, setYears]       = useState<AcademicYear[]>([...seedAcademicYears]);
  const [periods, setPeriods]   = useState<CalendarPeriod[]>([...seedPeriods]);
  const [holidays, setHolidays] = useState<PublicHoliday[]>([...seedHolidays]);
  const [selectedYearId, setSelectedYearId] = useState(
    seedAcademicYears.find((y) => y.isCurrent)?.id ?? seedAcademicYears[0]?.id ?? ""
  );
  const [useUaeTemplate, setUseUaeTemplate] = useState(true);
  const [addYearOpen, setAddYearOpen]       = useState(false);
  const [editPeriodOpen, setEditPeriodOpen] = useState(false);
  const [editingPeriod, setEditingPeriod]   = useState<CalendarPeriod | null>(null);

  const selectedYear = years.find((y) => y.id === selectedYearId);
  const yearPeriods  = periods
    .filter((p) => p.academicYearId === selectedYearId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const yearHolidays = holidays.filter((h) => h.academicYearId === selectedYearId);

  function handleSavePeriod(data: Omit<CalendarPeriod, "sortOrder" | "id"> & { id?: string }) {
    if (data.id) {
      setPeriods((prev) =>
        prev.map((p) => (p.id === data.id ? ({ ...p, ...data } as CalendarPeriod) : p))
      );
      toast.success("Period updated");
    } else {
      const nextSort =
        yearPeriods.length > 0 ? Math.max(...yearPeriods.map((p) => p.sortOrder)) + 1 : 1;
      const newPeriod: CalendarPeriod = {
        ...data,
        id: `cp-${Date.now()}`,
        sortOrder: nextSort,
      } as CalendarPeriod;
      setPeriods((prev) => [...prev, newPeriod]);
      toast.success("Period added");
    }
  }

  function handleDeletePeriod(id: string) {
    setPeriods((prev) => prev.filter((p) => p.id !== id));
    toast.success("Period deleted");
  }

  function handleTogglePause(periodId: string, deptId: string) {
    setPeriods((prev) =>
      prev.map((p) => {
        if (p.id !== periodId) return p;
        return {
          ...p,
          departmentPauses: (p.departmentPauses ?? []).map((dp) =>
            dp.departmentId === deptId ? { ...dp, paused: !dp.paused } : dp
          ),
        };
      })
    );
  }

  function handleAddHoliday(h: { name: string; date: string }) {
    setHolidays((prev) => [
      ...prev,
      {
        id:             `ph-${Date.now()}`,
        academicYearId: selectedYearId,
        name:           h.name,
        date:           h.date,
        source:         "custom" as const,
      },
    ]);
    toast.success("Public holiday added");
  }

  function handleDeleteHoliday(id: string) {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
    toast.success("Holiday removed");
  }

  function handleAddYear(
    data: { name: string; startDate: string; endDate: string; isCurrent: boolean },
    copyFromId?: string
  ) {
    const newYear: AcademicYear = {
      ...data,
      id: `ay-${Date.now()}`,
      financialYearStartMonth: 1,
    };

    setYears((prev) =>
      data.isCurrent
        ? prev.map((y) => ({ ...y, isCurrent: false })).concat(newYear)
        : [...prev, newYear]
    );

    if (copyFromId) {
      const srcYear    = years.find((y) => y.id === copyFromId);
      const srcPeriods = periods.filter((p) => p.academicYearId === copyFromId);
      if (srcYear && srcPeriods.length > 0) {
        const shiftMs =
          new Date(newYear.startDate).getTime() - new Date(srcYear.startDate).getTime();
        const copied: CalendarPeriod[] = srcPeriods.map((p) => ({
          ...p,
          id:             `cp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          academicYearId: newYear.id,
          startDate:      new Date(new Date(p.startDate).getTime() + shiftMs)
            .toISOString()
            .split("T")[0],
          endDate:        new Date(new Date(p.endDate).getTime() + shiftMs)
            .toISOString()
            .split("T")[0],
        }));
        setPeriods((prev) => [...prev, ...copied]);
      }
    }

    setSelectedYearId(newYear.id);
    toast.success("Academic year created");
  }

  const finMonthName = selectedYear
    ? new Date(2000, (selectedYear.financialYearStartMonth ?? 1) - 1, 1).toLocaleDateString(
        "en-GB",
        { month: "long" }
      )
    : "January";

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Academic Calendar</h2>
          <p className="text-sm text-slate-500 mt-1">
            Academic year structure, term dates, and public holidays.
          </p>
        </div>
        <AddButton label="Add Academic Year" onClick={() => setAddYearOpen(true)} />
      </div>

      {/* Academic year segmented selector */}
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {years.map((y) => (
          <button
            key={y.id}
            onClick={() => setSelectedYearId(y.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer",
              selectedYearId === y.id
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            {y.name}
            {y.isCurrent && (
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                  selectedYearId === y.id
                    ? "bg-white/25 text-white"
                    : "bg-green-100 text-green-700"
                )}
              >
                Current
              </span>
            )}
          </button>
        ))}
      </div>

      {selectedYear && (
        <>
          {/* Financial year info banner */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-6">
            <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-700">
              Financial year: <strong>{finMonthName} – December</strong> · Reports and revenue
              figures can be sliced by term or by calendar quarter.
            </p>
          </div>

          {/* Timeline visualisation */}
          <Card className="p-5 mb-6">
            <p className="text-sm font-semibold text-slate-700 mb-4">
              {selectedYear.name} · {fmtISODate(selectedYear.startDate)} –{" "}
              {fmtISODate(selectedYear.endDate)}
            </p>
            <CalendarTimeline
              year={selectedYear}
              periods={yearPeriods}
              holidays={
                useUaeTemplate
                  ? yearHolidays
                  : yearHolidays.filter((h) => h.source === "custom")
              }
            />
          </Card>

          {/* Period cards header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-700">
              Calendar Periods ({yearPeriods.length})
            </p>
            <AddButton
              label="Add Period"
              onClick={() => {
                setEditingPeriod(null);
                setEditPeriodOpen(true);
              }}
            />
          </div>

          {/* Period cards list */}
          {yearPeriods.length === 0 ? (
            <Card className="p-8 text-center mb-6">
              <p className="text-sm text-slate-400">
                No periods configured for this academic year.
              </p>
            </Card>
          ) : (
            <div className="mb-2">
              {yearPeriods.map((p) => (
                <PeriodCard
                  key={p.id}
                  period={p}
                  allPeriods={periods}
                  onEdit={(period) => {
                    setEditingPeriod(period);
                    setEditPeriodOpen(true);
                  }}
                  onDelete={handleDeletePeriod}
                  onTogglePause={handleTogglePause}
                />
              ))}
            </div>
          )}

          {/* Public holidays panel */}
          <PublicHolidaysPanel
            holidays={yearHolidays}
            useUaeTemplate={useUaeTemplate}
            onToggleTemplate={setUseUaeTemplate}
            onAdd={handleAddHoliday}
            onDelete={handleDeleteHoliday}
          />
        </>
      )}

      {/* Modals */}
      <AddAcademicYearModal
        open={addYearOpen}
        onOpenChange={setAddYearOpen}
        existingYears={years}
        onSave={handleAddYear}
      />
      <AddEditPeriodModal
        open={editPeriodOpen}
        onOpenChange={setEditPeriodOpen}
        initial={editingPeriod}
        existingPeriods={yearPeriods}
        academicYearId={selectedYearId}
        onSave={handleSavePeriod}
      />
    </div>
  );
}

// ─── Section 8: Subjects & Catalogue ──────────────────────────────────────────
// Implementation lives in ./subjects-catalogue.tsx to keep this file tractable.

// ─── Section 9: Staff & HR ─────────────────────────────────────────────────────

function StaffHRSection() {
  return (
    <div>
      <SectionHeader
        title="Staff & HR"
        description="HR configuration, compliance settings, and onboarding requirements."
      />
      <Card className="p-6 mb-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <FormField label="CPD Annual Target" defaultValue="20 hours" />
          <FormSelect
            label="Performance Review Cadence"
            value="Annual"
            options={["Annual", "Bi-annual", "Quarterly"]}
          />
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Off-boarding Notification Lead Times
            </label>
            <div className="flex flex-wrap gap-2">
              {["7 days", "3 days", "1 day"].map((d) => (
                <span
                  key={d}
                  className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Mandatory Staff Profile Fields
            </label>
            <div className="flex flex-wrap gap-2">
              {["Work email", "Home address", "Emergency contact"].map((f) => (
                <span
                  key={f}
                  className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full border border-amber-200"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
          <FormSelect
            label="Org Domain Restriction"
            value="Off"
            options={["Off", "On — @improveме.ae"]}
          />
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Staff Milestones</label>
            <div className="flex flex-wrap gap-2">
              {["6 months", "1 year"].map((m) => (
                <span
                  key={m}
                  className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-full"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
        <SaveButton />
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm text-amber-800">
          <span className="font-semibold">Salary and contract details</span> are accessible only to
          HR/Finance and Super Admin. All reads are logged.
        </p>
      </div>
    </div>
  );
}

// ─── Section 10: Roles & Permissions ──────────────────────────────────────────

const ROLES_ORDERED: Role[] = [
  'Super Admin', 'Admin Head', 'Admin', 'Academic Head', 'HOD', 'Teacher', 'TA', 'HR/Finance',
];

const ROLE_META: Record<Role, { color: string; description: string; initials: string; shortName: string }> = {
  'Super Admin':   { color: '#0F172A', description: 'Full platform access',       initials: 'SA',  shortName: 'SA'   },
  'Admin Head':    { color: '#DC2626', description: 'Senior admin oversight',      initials: 'AH',  shortName: 'AH'   },
  'Admin':         { color: '#EA580C', description: 'Day-to-day operations',       initials: 'Ad',  shortName: 'Adm'  },
  'Academic Head': { color: '#7C3AED', description: 'Academic strategy & staff',   initials: 'AcH', shortName: 'AcH'  },
  'HOD':           { color: '#2563EB', description: 'Department management',       initials: 'HD',  shortName: 'HOD'  },
  'Teacher':       { color: '#059669', description: 'Teaching & feedback',         initials: 'Tc',  shortName: 'Tchr' },
  'TA':            { color: '#0891B2', description: 'Teaching assistant duties',   initials: 'TA',  shortName: 'TA'   },
  'HR/Finance':    { color: '#CA8A04', description: 'HR and finance operations',   initials: 'HF',  shortName: 'HR/F' },
};

const PERM_GROUPS: { id: string; label: string; prefixes: string[] }[] = [
  { id: 'students',    label: 'Students',                prefixes: ['students.'] },
  { id: 'guardians',   label: 'Guardians',               prefixes: ['guardians.'] },
  { id: 'leads',       label: 'Leads',                   prefixes: ['leads.'] },
  { id: 'enrolment',   label: 'Enrolment',               prefixes: ['enrolment.'] },
  { id: 'finance',     label: 'Finance',                 prefixes: ['finance.'] },
  { id: 'timetable',   label: 'Timetable',               prefixes: ['timetable.'] },
  { id: 'attendance',  label: 'Attendance',              prefixes: ['attendance.'] },
  { id: 'feedback',    label: 'Feedback',                prefixes: ['feedback.'] },
  { id: 'progress',    label: 'Progress',                prefixes: ['progress.'] },
  { id: 'concerns',    label: 'Concerns',                prefixes: ['concerns.'] },
  { id: 'tasks',       label: 'Tasks',                   prefixes: ['tasks.'] },
  { id: 'staff',       label: 'Staff',                   prefixes: ['staff.'] },
  { id: 'automations', label: 'Automations & Templates', prefixes: ['automations.', 'templates.'] },
  { id: 'people',      label: 'People & Segments',       prefixes: ['people.'] },
  { id: 'assessments', label: 'Assessments',             prefixes: ['assessments.'] },
  { id: 'analytics',   label: 'Analytics & Reports',     prefixes: ['analytics.', 'reports.'] },
  { id: 'settings',    label: 'Settings',                prefixes: ['settings.'] },
];

function fmtAction(key: string): string {
  const verb = key.split('.')[1] ?? key;
  return verb
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase());
}

function RolesSection() {
  const { role, can } = usePermission();
  const canManageRoles = can('manage.roles');

  const [editMode, setEditMode]                   = useState(false);
  const [editedPermissions, setEditedPermissions] = useState<Record<string, Role[]>>({});
  const [savedMsg, setSavedMsg]                   = useState(false);

  const [search, setSearch]       = useState('');
  const [modFilter, setModFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState<'All' | Role>('All');
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set(PERM_GROUPS.map((g) => g.id))
  );

  useEffect(() => {
    setEditMode(false);
    setEditedPermissions({});
  }, [role]);

  useEffect(() => {
    if (editMode) {
      setEditedPermissions(
        Object.fromEntries(
          Object.entries(PERMISSIONS).map(([k, v]) => [k, [...v]])
        )
      );
    }
  }, [editMode]);

  const activePermissions: Record<string, Role[]> =
    editMode && Object.keys(editedPermissions).length > 0 ? editedPermissions : PERMISSIONS;

  function togglePermission(action: string, r: Role) {
    if (r === 'Super Admin') return;
    setEditedPermissions((prev) => {
      const current = prev[action] ?? [];
      const hasRole = current.includes(r);
      return {
        ...prev,
        [action]: hasRole ? current.filter((x) => x !== r) : [...current, r],
      };
    });
  }

  function handleSave() {
    setSavedMsg(true);
    setEditMode(false);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  function handleCancel() {
    setEditMode(false);
    setEditedPermissions({});
  }

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase();
    return PERM_GROUPS
      .filter((g) => modFilter === 'All' || g.label === modFilter)
      .map((g) => {
        const actions = (Object.entries(PERMISSIONS) as [string, Role[]][]).filter(([key, roles]) => {
          if (!g.prefixes.some((p) => key.startsWith(p))) return false;
          if (q && !fmtAction(key).toLowerCase().includes(q) && !key.toLowerCase().includes(q)) return false;
          if (roleFilter !== 'All' && !roles.includes(roleFilter as Role)) return false;
          return true;
        });
        return { ...g, actions };
      })
      .filter((g) => g.actions.length > 0);
  }, [search, modFilter, roleFilter]);

  const visibleActions = useMemo(
    () => filteredGroups.flatMap((g) => g.actions),
    [filteredGroups]
  );

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const hasFilter = search !== '' || modFilter !== 'All' || roleFilter !== 'All';

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Roles & Permissions</h2>
          <p className="text-sm text-slate-500 mt-0.5">Define what each role can see and do across the platform.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-3 py-1">Live from role-config.ts</span>
          {savedMsg && (
            <span className="text-xs bg-green-100 text-green-700 rounded-full px-3 py-1 font-medium">
              Permissions updated — changes apply immediately
            </span>
          )}
          {canManageRoles && !editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-sm font-medium rounded-md hover:bg-amber-600 transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit Permissions
            </button>
          )}
          {canManageRoles && editMode && (
            <>
              <button
                onClick={handleCancel}
                className="px-3 py-2 border border-slate-200 bg-white text-sm text-slate-600 font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Role Legend Strip ── */}
      <div className="flex gap-3 overflow-x-auto pb-2 mb-4">
        {ROLES_ORDERED.map((r) => {
          const meta = ROLE_META[r];
          const actionCount = Object.values(PERMISSIONS).filter((roles) => roles.includes(r)).length;
          const isActive = role === r;
          return (
            <div
              key={r}
              className={cn(
                'flex items-center gap-3 px-4 py-3 bg-white border rounded-xl min-w-fit flex-shrink-0',
                isActive ? 'border-amber-400 bg-amber-50/30' : 'border-slate-200'
              )}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: meta.color }}
              >
                {meta.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{r}</p>
                <p className="text-xs text-slate-400">{meta.description}</p>
              </div>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 whitespace-nowrap">
                {actionCount} actions
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400"
            />
          </div>
          <select
            value={modFilter}
            onChange={(e) => setModFilter(e.target.value)}
            className="w-48 px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="All">All modules</option>
            {PERM_GROUPS.map((g) => (
              <option key={g.id} value={g.label}>{g.label}</option>
            ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'All' | Role)}
            className="w-40 px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            <option value="All">All roles</option>
            {ROLES_ORDERED.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {hasFilter && (
            <button
              onClick={() => { setSearch(''); setModFilter('All'); setRoleFilter('All'); }}
              className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
        {search && (
          <p className="text-xs text-slate-500 mt-2">
            {visibleActions.length} permission{visibleActions.length !== 1 ? 's' : ''} match &lsquo;{search}&rsquo;
          </p>
        )}
      </div>

      {/* ── Edit Mode Banner ── */}
      {editMode && (
        <div className="flex items-center gap-2 bg-amber-50 border-l-4 border-amber-400 px-4 py-2 mb-4 rounded-r-md">
          <Pencil className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            Edit mode active — click any cell to toggle a permission. Super Admin cannot be restricted.
          </p>
        </div>
      )}

      {/* ── Permission Table ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '65vh' }}>
          <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '180px' }} />
              {ROLES_ORDERED.map((r) => <col key={r} />)}
            </colgroup>

            {/* Sticky header */}
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr className="border-b-2 border-slate-200">
                <th className="pl-5 py-3 text-left">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400">PERMISSION</span>
                </th>
                {ROLES_ORDERED.map((r) => {
                  const meta = ROLE_META[r];
                  const isFiltered = roleFilter === r;
                  const count = Object.values(activePermissions).filter((roles) => roles.includes(r)).length;
                  return (
                    <th
                      key={r}
                      className={cn(
                        'py-3 text-center border-b-2 -mb-px',
                        isFiltered ? 'bg-amber-50 border-amber-400' : 'border-transparent'
                      )}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: meta.color, fontSize: '9px', fontWeight: 700 }}
                        >
                          {meta.initials}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-700 leading-tight">{meta.shortName}</span>
                        <span className="text-[10px] text-slate-400">{count}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {filteredGroups.length === 0 ? (
                <tr>
                  <td
                    colSpan={ROLES_ORDERED.length + 1}
                    className="px-4 py-8 text-center text-sm text-slate-400"
                  >
                    No actions match your filters.
                  </td>
                </tr>
              ) : (
                filteredGroups.flatMap((group) => {
                  const isOpen = openGroups.has(group.id);

                  const headerRow = (
                    <tr
                      key={`${group.id}__hdr`}
                      className="cursor-pointer hover:bg-slate-50 transition-colors"
                      onClick={() => toggleGroup(group.id)}
                    >
                      <td className="pl-4 py-3">
                        <div className="flex items-center gap-2">
                          {isOpen
                            ? <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            : <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          }
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{group.label}</span>
                          <span className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 ml-1">{group.actions.length}</span>
                        </div>
                      </td>
                      {ROLES_ORDERED.map((r) => {
                        const checked = group.actions.filter(([key]) => (activePermissions[key] ?? []).includes(r)).length;
                        const total = group.actions.length;
                        const allChecked = checked === total;
                        const noneChecked = checked === 0;
                        return (
                          <td key={r} className="py-3 text-center">
                            <span className={cn(
                              'text-[10px]',
                              allChecked ? 'text-green-600 font-medium' : noneChecked ? 'text-slate-300' : 'text-slate-400'
                            )}>
                              {checked}/{total}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );

                  const actionRows = isOpen
                    ? group.actions.map(([key], rowIdx) => (
                        <tr
                          key={key}
                          className={cn(
                            'border-b border-slate-100 hover:bg-slate-50/80 transition-colors',
                            rowIdx % 2 === 1 && 'bg-slate-50/40'
                          )}
                          style={{ height: '44px' }}
                        >
                          <td className="pl-8 pr-2 text-sm text-slate-700">{fmtAction(key)}</td>
                          {ROLES_ORDERED.map((r) => {
                            const permitted = (activePermissions[key] ?? []).includes(r);
                            const isSuperAdminCol = r === 'Super Admin';
                            const isChanged = editMode && !isSuperAdminCol &&
                              permitted !== (PERMISSIONS[key] ?? []).includes(r);

                            if (!editMode) {
                              return (
                                <td key={r} className="text-center">
                                  {permitted ? (
                                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                                      <Check size={13} className="text-green-600" strokeWidth={2.5} />
                                    </div>
                                  ) : (
                                    <div className="w-7 h-7 flex items-center justify-center mx-auto">
                                      <span className="text-slate-200 text-lg leading-none">—</span>
                                    </div>
                                  )}
                                </td>
                              );
                            }

                            if (isSuperAdminCol) {
                              return (
                                <td key={r} className="text-center">
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <span className="inline-flex">
                                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                                          <Lock size={12} className="text-slate-300" />
                                        </div>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>Super Admin always has full access</TooltipContent>
                                  </Tooltip>
                                </td>
                              );
                            }

                            return (
                              <td key={r} className="text-center">
                                {permitted ? (
                                  <button
                                    onClick={() => togglePermission(key, r)}
                                    className={cn(
                                      'w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center mx-auto transition-colors cursor-pointer',
                                      isChanged && 'ring-2 ring-amber-400 ring-offset-1'
                                    )}
                                  >
                                    <Check size={13} className="text-green-600" strokeWidth={2.5} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => togglePermission(key, r)}
                                    className={cn(
                                      'w-7 h-7 rounded-full bg-slate-100 hover:bg-amber-100 flex items-center justify-center mx-auto transition-colors cursor-pointer group',
                                      isChanged && 'ring-2 ring-amber-400 ring-offset-1'
                                    )}
                                  >
                                    <span className="text-slate-300 group-hover:text-amber-400 text-lg leading-none">—</span>
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    : [];

                  return [headerRow, ...actionRows];
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Stats Footer ── */}
        <div className="border-t-2 border-slate-200 bg-slate-50 px-5 py-3 flex-shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-slate-500">Total permissions granted:</span>
            <div className="flex items-center gap-4 flex-wrap">
              {ROLES_ORDERED.map((r) => {
                const meta = ROLE_META[r];
                const count = visibleActions.filter(([key]) => (activePermissions[key] ?? []).includes(r)).length;
                const total = visibleActions.length;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={r} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.color }} />
                    <span className="text-xs text-slate-500">{meta.shortName}</span>
                    <span className="text-xs font-medium text-slate-700">{count}/{total}</span>
                    <span className="text-xs text-slate-400">({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section 11: Notifications ────────────────────────────────────────────────

const SYSTEM_NOTIFICATIONS = [
  { name: "Password Reset Request", trigger: "User-triggered", recipients: "User", channel: "Email" },
  { name: "Data Export Completed", trigger: "Export triggered", recipients: "Requester", channel: "In-app + Email" },
  { name: "Login from New Device", trigger: "Auth event", recipients: "Account owner", channel: "Email" },
  { name: "Invoice Payment Confirmed", trigger: "Payment gateway", recipients: "Admin, Finance", channel: "In-app" },
  { name: "Role Permissions Changed", trigger: "Admin action", recipients: "Affected user", channel: "In-app + Email" },
  { name: "Audit Log Anomaly Detected", trigger: "System monitor", recipients: "Super Admin", channel: "In-app + Email" },
];

function NotificationsSection() {
  const [activeTab, setActiveTab] = useState<"system" | "configurable">("system");
  const [toggles, setToggles] = useState({
    "New lead captured": true,
    "Overdue invoice alert": true,
    "Absence recorded": true,
    "Session reminder": true,
    "Concern raised (L1)": true,
    "Makeup expiring (7 days)": true,
    "Re-enrolment reminder": true,
    "Weekly digest": false,
  });

  const configurableRows = [
    { name: "New lead captured", recipients: "Admin", channel: "In-app" },
    { name: "Overdue invoice alert", recipients: "Admin, Admin Head", channel: "In-app" },
    { name: "Absence recorded", recipients: "Guardian", channel: "WhatsApp" },
    { name: "Session reminder", recipients: "Guardian", channel: "WhatsApp" },
    { name: "Concern raised (L1)", recipients: "Teacher, HOD", channel: "In-app" },
    { name: "Makeup expiring (7 days)", recipients: "Admin", channel: "In-app" },
    { name: "Re-enrolment reminder", recipients: "Admin", channel: "In-app" },
    { name: "Weekly digest", recipients: "Admin Head", channel: "In-app + Email" },
  ];

  return (
    <div>
      <SectionHeader
        title="Notifications"
        description="Configure system and user-facing notification rules."
      />

      {/* Sub-tabs */}
      <div className="flex border-b border-slate-200 mb-6 gap-1">
        {(["system", "configurable"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px",
              activeTab === tab
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            {tab === "system" ? "System Notifications" : "Configurable Notifications"}
          </button>
        ))}
      </div>

      {activeTab === "system" && (
        <>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-5">
            <p className="text-sm text-slate-600">
              <LockIcon className="w-3.5 h-3.5 inline-block mr-1.5 text-slate-400" />
              These notifications cannot be disabled. They cover compliance, security, and platform
              integrity.
            </p>
          </div>
          <Table headers={["Notification", "Trigger", "Recipients", "Channel", ""]}>
            {SYSTEM_NOTIFICATIONS.map((n) => (
              <tr key={n.name} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{n.name}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{n.trigger}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{n.recipients}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{n.channel}</td>
                <td className="px-4 py-3.5 text-slate-400">
                  <LockIcon className="w-3.5 h-3.5" />
                </td>
              </tr>
            ))}
          </Table>
        </>
      )}

      {activeTab === "configurable" && (
        <Table headers={["Notification", "Recipients", "Channel", "Enabled"]}>
          {configurableRows.map((n) => (
            <tr key={n.name} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{n.name}</td>
              <td className="px-4 py-3.5 text-sm text-slate-600">{n.recipients}</td>
              <td className="px-4 py-3.5 text-sm text-slate-600">{n.channel}</td>
              <td className="px-4 py-3.5">
                <Toggle
                  checked={toggles[n.name as keyof typeof toggles]}
                  onChange={(v) => {
                    setToggles((prev) => ({ ...prev, [n.name]: v }));
                    toast.success("Notification preference updated", {
                      description: `${n.name} — ${v ? "enabled" : "disabled"}`,
                    });
                  }}
                />
              </td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

// ─── Section 12: Templates ────────────────────────────────────────────────────

function TemplatesSection() {
  const templates = [
    { name: "New Lead Welcome", trigger: "Lead: New", edited: "10 Mar 2026" },
    { name: "Assessment Booking Confirmation", trigger: "Lead: Assessment Booked", edited: "8 Mar 2026" },
    { name: "Trial Booking Confirmation", trigger: "Lead: Trial Booked", edited: "8 Mar 2026" },
    { name: "Invoice Issued", trigger: "Finance: Invoice Issued", edited: "1 Mar 2026" },
    { name: "Payment Reminder", trigger: "Finance: Invoice Overdue", edited: "1 Mar 2026" },
    { name: "Absence Notification", trigger: "Attendance: Absence Marked", edited: "15 Feb 2026" },
    { name: "Session Cancellation", trigger: "Timetable: Session Cancelled", edited: "10 Feb 2026" },
  ];
  return (
    <div>
      <SectionHeader
        title="Templates"
        description="Communication templates for automated messages and notifications."
        action={<AddButton label="Add Template" />}
      />
      <Table headers={["Template Name", "Stage / Trigger", "Last Edited", "Actions"]}>
        {templates.map((t) => (
          <tr key={t.name} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{t.name}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{t.trigger}</td>
            <td className="px-4 py-3.5 text-sm text-slate-500">{t.edited}</td>
            <td className="px-4 py-3.5">
              <div className="flex items-center gap-1">
                <TableAction label="Edit" />
                <TableAction label="Preview" />
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

// ─── Section 13: Feature Toggles ──────────────────────────────────────────────

const INITIAL_FEATURES: Record<string, FeatureState> = {
  "Lead Management": "On",
  "Assessment & Placement": "On",
  "Makeups & Concern Engine": "On",
  "Per-Class Feedback": "On",
  "Progress Tracking": "Later",
  "Assignment Library": "On",
  "Task Management": "On",
  "Management Dashboard": "On",
  "Inventory Management": "Later",
  "Parent Portal": "Later",
  "Student Portal": "Later",
  "WhatsApp BSP": "Later",
};

const FEATURE_DESCRIPTIONS: Record<string, string> = {
  "Lead Management": "Pipeline and capture",
  "Assessment & Placement": "CAT4 and placement assessments",
  "Makeups & Concern Engine": "Makeup eligibility and concern tracking",
  "Per-Class Feedback": "Session feedback and NPS surveys",
  "Progress Tracking": "AI-assisted progress reports",
  "Assignment Library": "Homework and quick score entry",
  "Task Management": "Kanban task inbox",
  "Management Dashboard": "KPI cards and analytics",
  "Inventory Management": "Stationery and supplies tracking",
  "Parent Portal": "Guardian-facing mobile portal",
  "Student Portal": "Student-facing access",
  "WhatsApp BSP": "Automated WhatsApp messaging",
};

function ComingSoonBadge() {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
      Coming soon
    </span>
  );
}

function OnOffToggle({
  value,
  onChange,
}: {
  value: "On" | "Off";
  onChange: (v: "On" | "Off") => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-slate-200 overflow-hidden text-xs font-medium">
      {(["On", "Off"] as const).map((option, i) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "px-3 py-1.5 transition-colors duration-150 cursor-pointer",
            i === 0 && "border-r border-slate-200",
            value === option
              ? option === "On"
                ? "bg-amber-500 text-white"
                : "bg-rose-500 text-white"
              : "bg-white text-slate-500 hover:bg-slate-50"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

function FeatureTogglesSection() {
  const [features, setFeatures] = useState<Record<string, FeatureState>>(INITIAL_FEATURES);

  return (
    <div>
      <SectionHeader
        title="Feature Toggles"
        description="Enable, disable, or schedule platform modules."
      />
      <Table headers={["Feature", "Description", "Status"]}>
        {Object.entries(features).map(([name, state]) => (
          <tr key={name} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{name}</td>
            <td className="px-4 py-3.5 text-sm text-slate-500">
              {FEATURE_DESCRIPTIONS[name]}
            </td>
            <td className="px-4 py-3.5">
              {state === "Later" ? (
                <ComingSoonBadge />
              ) : (
                <OnOffToggle
                  value={state}
                  onChange={(v) => {
                    setFeatures((prev) => ({ ...prev, [name]: v }));
                    toast.success("Feature toggle updated", {
                      description: `${name} — ${v}`,
                    });
                  }}
                />
              )}
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

// ─── Section 14: Integrations ──────────────────────────────────────────────────

const INTEGRATIONS = [
  { name: "Zoho Books", abbr: "ZB", desc: "Bidirectional financial sync", color: "bg-red-100 text-red-700" },
  { name: "Zoho People", abbr: "ZP", desc: "Staff profile sync", color: "bg-orange-100 text-orange-700" },
  { name: "WhatsApp BSP", abbr: "WA", desc: "Automated messaging", color: "bg-emerald-100 text-emerald-700" },
  { name: "Mailchimp", abbr: "MC", desc: "Email marketing CSV sync", color: "bg-yellow-100 text-yellow-700" },
  { name: "Telr", abbr: "TL", desc: "Payment gateway", color: "bg-blue-100 text-blue-700" },
  { name: "Network International", abbr: "NI", desc: "Payment gateway", color: "bg-violet-100 text-violet-700" },
  { name: "Stripe", abbr: "ST", desc: "Payment gateway", color: "bg-indigo-100 text-indigo-700" },
  { name: "Instagram Graph API", abbr: "IG", desc: "Lead capture from DMs", color: "bg-pink-100 text-pink-700" },
];

function IntegrationsSection() {
  return (
    <div>
      <SectionHeader
        title="Integrations"
        description="Third-party platform connections. All integrations are scheduled for Phase 2."
      />
      <div className="grid grid-cols-2 gap-4">
        {INTEGRATIONS.map((integ) => (
          <div
            key={integ.name}
            className="relative bg-white border border-slate-200 rounded-lg p-5 opacity-60"
          >
            <span className="absolute top-3 right-3 px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-semibold rounded-full uppercase tracking-wide">
              Phase 2
            </span>
            <div className="flex items-start gap-3 mb-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                  integ.color
                )}
              >
                {integ.abbr}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{integ.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{integ.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Disconnected</span>
              <button
                disabled
                className="px-3 py-1.5 border border-slate-200 text-xs text-slate-400 rounded-md cursor-not-allowed bg-slate-50"
              >
                Connect
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section 15: Churn & Dashboard ────────────────────────────────────────────

const CHURN_SIGNALS = [
  { name: "Teaching Quality Concern", weight: 28 },
  { name: "Missed 3+ Sessions (45-day window)", weight: 17 },
  { name: "Overdue Invoice", weight: 17 },
  { name: "Inconsistency", weight: 11 },
  { name: "Unresolved Concern", weight: 11 },
  { name: "NPS Score", weight: 11 },
  { name: "Unsubscribed", weight: 5 },
  { name: "App Inactive (Phase 2)", weight: 0, disabled: true },
];

function ChurnSection() {
  return (
    <div>
      <SectionHeader
        title="Churn & Dashboard"
        description="Risk thresholds, signal weights, and dashboard configuration."
      />
      <Card className="p-6 mb-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <FormField label="Churn High-Risk Threshold" defaultValue="70" />
          <FormField label="Churn Medium-Risk Threshold" defaultValue="40" />
          <FormField label="Churn Alert Cooldown" defaultValue="7 days" />
          <FormField label="Seat Occupancy Target" defaultValue="80%" />
          <FormField label="Low Occupancy Alert Threshold" defaultValue="50%" />
          <FormField label="Activity Feed Max Depth" defaultValue="500 entries" />
          <FormField label="Peak Hours" defaultValue="15:00 – 19:00" />
        </div>
        <SaveButton />
      </Card>

      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-700">Churn Signal Weights</p>
        <p className="text-xs text-slate-500 mt-0.5">v1 weights — App Inactive signal is disabled. Weights are redistributed proportionally.</p>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Signal
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-20">
                Weight
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Distribution
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {CHURN_SIGNALS.map((s) => (
              <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5 text-sm text-slate-700">
                  {s.name}
                  {s.disabled && (
                    <span className="ml-2 text-xs text-slate-400 italic">disabled</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-sm font-medium text-slate-700">
                  {s.disabled ? "0%" : `${s.weight}%`}
                </td>
                <td className="px-4 py-3.5">
                  {!s.disabled && (
                    <div className="w-full max-w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{ width: `${s.weight}%` }}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Section 16: Audit Log ────────────────────────────────────────────────────

const AUDIT_ENTRIES = [
  { ts: "16 Apr 2026, 09:14", user: "Jason Daswani", action: "Settings changed", module: "M20", detail: "VAT rate updated: 5% → 5% (no change)" },
  { ts: "15 Apr 2026, 17:32", user: "Jason Daswani", action: "Invoice created", module: "M08", detail: "INV-1042 issued to Fatima Rahman" },
  { ts: "15 Apr 2026, 16:45", user: "Sarah Thompson", action: "Attendance marked", module: "M06", detail: "Y8 Maths — Mon 14 Apr — 3 students" },
  { ts: "15 Apr 2026, 14:20", user: "Jason Daswani", action: "Staff role updated", module: "M09/PL02", detail: "Mariam Saleh — Access Revoked" },
  { ts: "14 Apr 2026, 11:05", user: "Jason Daswani", action: "Lead stage changed", module: "M01", detail: "L-0060 → Won" },
  { ts: "14 Apr 2026, 10:30", user: "Sarah Thompson", action: "Student created", module: "M02", detail: "IMI-1847 — Amna Al-Qubaisi" },
  { ts: "13 Apr 2026, 16:20", user: "Jason Daswani", action: "Credit issued", module: "M08", detail: "AED 800 — Aisha Rahman — goodwill" },
  { ts: "13 Apr 2026, 09:00", user: "Jason Daswani", action: "Concern raised", module: "M06.A", detail: "Y8 Maths — Aisha Rahman — L1" },
  { ts: "12 Apr 2026, 14:15", user: "Sarah Thompson", action: "Payment recorded", module: "M08", detail: "AED 3,360 — INV-1039 — Bank Transfer" },
  { ts: "11 Apr 2026, 11:45", user: "Jason Daswani", action: "Staff added", module: "M09", detail: "Khalil Mansouri — Teacher — Primary" },
];

function AuditLogSection() {
  return (
    <div>
      <SectionHeader
        title="Audit Log"
        description="Immutable record of all platform actions. Read-only."
        action={
          <div className="flex items-center gap-2">
            <select className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-600 focus:outline-none focus:border-amber-400 cursor-pointer">
              <option>All dates</option>
            </select>
            <select className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-600 focus:outline-none focus:border-amber-400 cursor-pointer">
              <option>All modules</option>
            </select>
            <select className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white text-slate-600 focus:outline-none focus:border-amber-400 cursor-pointer">
              <option>All users</option>
            </select>
            <OutlineButton label="Export CSV" />
          </div>
        }
      />
      <Table headers={["Timestamp", "User", "Action", "Module", "Details"]}>
        {AUDIT_ENTRIES.map((e, i) => (
          <tr key={i} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{e.ts}</td>
            <td className="px-4 py-3 text-sm font-medium text-slate-800 whitespace-nowrap">
              {e.user}
            </td>
            <td className="px-4 py-3 text-sm text-slate-700">{e.action}</td>
            <td className="px-4 py-3">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-mono rounded">
                {e.module}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-slate-500">{e.detail}</td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

// ─── Section 17: Data & Privacy ───────────────────────────────────────────────

function DataPrivacySection() {
  const retention = [
    { type: "Financial records", period: "5 years minimum (UAE VAT Law)" },
    { type: "Student academic records", period: "3 years post-withdrawal (configurable, min 1 year)" },
    { type: "Personal ID data", period: "Anonymised when financial records active; deleted after 5-year window" },
    { type: "Consent & T&C records", period: "Permanent" },
    { type: "Audit log entries", period: "Permanent" },
  ];

  return (
    <div>
      <SectionHeader
        title="Data & Privacy"
        description="Retention policies, DPA status, and erasure request management."
      />

      {/* Retention Policy */}
      <div className="mb-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Data Retention Policy</p>
        <Table headers={["Record Type", "Retention Period"]}>
          {retention.map((r) => (
            <tr key={r.type} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{r.type}</td>
              <td className="px-4 py-3.5 text-sm text-slate-600">{r.period}</td>
            </tr>
          ))}
        </Table>
      </div>

      {/* DPA Status */}
      <Card className="p-5 mb-5">
        <p className="text-sm font-semibold text-slate-700 mb-4">DPA Status</p>
        <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-sm">
          <div>
            <span className="text-xs text-slate-500">Status</span>
            <p className="mt-0.5 font-medium text-emerald-700 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Signed
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-500">DPA Version</span>
            <p className="mt-0.5 font-medium text-slate-800">v2.1</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Signed at onboarding</span>
            <p className="mt-0.5 text-slate-700">14 Mar 2025 (Stage 1)</p>
          </div>
          <div>
            <span className="text-xs text-slate-500">Re-confirmed at go-live</span>
            <p className="mt-0.5 text-slate-700">14 Mar 2025 (Stage 10)</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <a
            href="#"
            className="text-sm text-amber-600 hover:text-amber-700 hover:underline cursor-pointer"
          >
            Download signed DPA →
          </a>
        </div>
      </Card>

      {/* Erasure Requests */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-slate-700">Data Erasure Requests</p>
        <OutlineButton label="+ New Erasure Request" />
      </div>
      <Card className="p-12 text-center">
        <p className="text-sm text-slate-400">No erasure requests received.</p>
      </Card>
    </div>
  );
}

// ─── Section Renderer ──────────────────────────────────────────────────────────

function renderSection(id: SectionId) {
  switch (id) {
    case "organisation":     return <OrganisationSection />;
    case "branches":         return <BranchesSection />;
    case "departments":      return <DepartmentsSection />;
    case "rooms":            return <RoomsSection />;
    case "billing":          return <BillingSection />;
    case "payment-plans":    return <PaymentPlansSection />;
    case "academic-calendar":return <AcademicCalendarSection />;
    case "subjects":         return <SubjectsCatalogueSection />;
    case "staff-hr":         return <StaffHRSection />;
    case "roles":            return <RolesSection />;
    case "notifications":    return <NotificationsSection />;
    case "templates":        return <TemplatesSection />;
    case "feature-toggles":  return <FeatureTogglesSection />;
    case "integrations":     return <IntegrationsSection />;
    case "churn":            return <ChurnSection />;
    case "audit-log":        return <AuditLogSection />;
    case "data-privacy":     return <DataPrivacySection />;
  }
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { can } = usePermission();
  const [activeSection, setActiveSection] = useState<SectionId>("organisation");

  if (!can('settings.view')) return <AccessDenied />;

  return (
    <div className="flex -m-6 h-[calc(100svh-4rem)]">
      {/* Left Nav */}
      <aside className="w-60 flex-shrink-0 border-r border-slate-200 bg-white overflow-y-auto">
        <div className="p-4">
          {NAV_SECTIONS.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => setActiveSection(item.id)}
                        className={cn(
                          "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer text-left",
                          isActive
                            ? "bg-amber-50 text-amber-700 border-l-[3px] border-amber-500 pl-[calc(0.75rem-3px)]"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-l-[3px] border-transparent pl-[calc(0.75rem-3px)]"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 flex-shrink-0",
                            isActive ? "text-amber-500" : "text-slate-400"
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </aside>

      {/* Right Content */}
      <div className="flex-1 overflow-y-auto">
        <div className={cn("p-8", activeSection !== "roles" && activeSection !== "subjects" && "max-w-4xl")}>
          {renderSection(activeSection)}
        </div>
      </div>
    </div>
  );
}
