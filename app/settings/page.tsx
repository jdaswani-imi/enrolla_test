"use client";

import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

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

function AddButton({ label }: { label: string }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white text-sm font-medium rounded-md hover:bg-amber-600 transition-colors cursor-pointer">
      <Plus className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function OutlineButton({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white text-sm text-slate-600 font-medium rounded-md hover:bg-slate-50 transition-colors cursor-pointer">
      {icon}
      {label}
    </button>
  );
}

function TableAction({
  label,
  disabled = false,
  danger = false,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      disabled={disabled}
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

function SegmentedToggle({
  value,
  onChange,
  disabled = false,
}: {
  value: FeatureState;
  onChange: (v: FeatureState) => void;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <span className="text-xs text-slate-400 italic">0% — disabled</span>
    );
  }
  return (
    <div className="inline-flex rounded-md border border-slate-200 overflow-hidden text-xs font-medium">
      {(["On", "Off", "Later"] as FeatureState[]).map((option, i) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className={cn(
            "px-3 py-1.5 transition-colors duration-150 cursor-pointer",
            i < 2 && "border-r border-slate-200",
            value === option
              ? option === "On"
                ? "bg-amber-500 text-white"
                : option === "Off"
                ? "bg-rose-500 text-white"
                : "bg-slate-500 text-white"
              : "bg-white text-slate-500 hover:bg-slate-50"
          )}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

// ─── Section 1: Organisation ───────────────────────────────────────────────────

function OrganisationSection() {
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
    </div>
  );
}

// ─── Section 2: Branches ───────────────────────────────────────────────────────

function BranchesSection() {
  return (
    <div>
      <SectionHeader
        title="Branches"
        description="Physical locations and campus settings."
        action={<AddButton label="Add Branch" />}
      />
      <Table headers={["Branch", "Address", "Phone", "Status", "Actions"]}>
        <tr className="hover:bg-slate-50 transition-colors">
          <td className="px-4 py-3.5 text-sm font-medium text-slate-800">
            Gold &amp; Diamond Park
          </td>
          <td className="px-4 py-3.5 text-sm text-slate-600">
            Gold &amp; Diamond Park, Al Quoz, Dubai
          </td>
          <td className="px-4 py-3.5 text-sm text-slate-600">+971 4 123 4567</td>
          <td className="px-4 py-3.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
              Active
            </span>
          </td>
          <td className="px-4 py-3.5">
            <div className="flex items-center gap-1">
              <TableAction label="Edit" />
              <Tooltip>
                <TooltipTrigger>
                  <span>
                    <TableAction label="Archive" disabled />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Cannot archive — only branch.</TooltipContent>
              </Tooltip>
            </div>
          </td>
        </tr>
      </Table>
    </div>
  );
}

// ─── Section 3: Departments ────────────────────────────────────────────────────

function DepartmentsSection() {
  const depts = [
    { name: "Primary", groups: "FS1 – Y6", count: "1,124" },
    { name: "Lower Secondary", groups: "Y7 – Y9", count: "412" },
    { name: "Senior", groups: "Y10 – Y13", count: "311" },
  ];
  return (
    <div>
      <SectionHeader
        title="Departments"
        description="Academic departments and year group mappings."
        action={<AddButton label="Add Department" />}
      />
      <Table headers={["Department", "Year Groups", "Student Count", "Status", "Actions"]}>
        {depts.map((d) => (
          <tr key={d.name} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{d.name}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{d.groups}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{d.count}</td>
            <td className="px-4 py-3.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                Active
              </span>
            </td>
            <td className="px-4 py-3.5">
              <TableAction label="Edit" />
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

// ─── Section 4: Rooms ──────────────────────────────────────────────────────────

function RoomsSection() {
  const rooms = [
    { name: "Room 1A", capacity: 6, soft: 5, hard: 6 },
    { name: "Room 2B", capacity: 4, soft: 4, hard: 4 },
    { name: "Room 3A", capacity: 8, soft: 7, hard: 8 },
    { name: "Room 1C", capacity: 4, soft: 4, hard: 4 },
    { name: "Room 2A", capacity: 6, soft: 5, hard: 6 },
  ];
  return (
    <div>
      <SectionHeader
        title="Rooms"
        description="Classroom capacity and occupancy caps per branch."
        action={<AddButton label="Add Room" />}
      />
      <Table headers={["Room", "Branch", "Capacity", "Soft Cap", "Hard Cap", "Status", "Actions"]}>
        {rooms.map((r) => (
          <tr key={r.name} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{r.name}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">Gold &amp; Diamond Park</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{r.capacity}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{r.soft}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{r.hard}</td>
            <td className="px-4 py-3.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                Active
              </span>
            </td>
            <td className="px-4 py-3.5">
              <div className="flex items-center gap-1">
                <TableAction label="Edit" />
                <TableAction label="Archive" danger />
              </div>
            </td>
          </tr>
        ))}
      </Table>
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

function AcademicCalendarSection() {
  const terms = [
    { name: "Term 1", start: "2 Sep 2024", end: "13 Dec 2024", flex: 14, color: "bg-amber-500 text-white" },
    { name: "Winter Break", start: "14 Dec", end: "5 Jan", flex: 3, color: "bg-slate-200 text-slate-600" },
    { name: "Term 2", start: "6 Jan 2025", end: "28 Mar 2025", flex: 12, color: "bg-teal-500 text-white" },
    { name: "Spring Break", start: "29 Mar", end: "13 Apr", flex: 2, color: "bg-slate-200 text-slate-600" },
    { name: "Term 3", start: "14 Apr 2025", end: "25 Jul 2025", flex: 14, color: "bg-slate-700 text-white" },
    { name: "Graduation", start: "~end Jul", end: "—", flex: 1, color: "bg-violet-500 text-white" },
  ];

  const holidays = [
    { name: "UAE National Day", date: "2 Dec 2024" },
    { name: "Eid Al Fitr (est.)", date: "29 Mar 2025" },
    { name: "Eid Al Adha (est.)", date: "5 Jun 2025" },
    { name: "Islamic New Year (est.)", date: "26 Jun 2025" },
  ];

  return (
    <div>
      <SectionHeader
        title="Academic Calendar"
        description="Academic year structure, term dates, and public holidays."
        action={
          <div className="flex items-center gap-2">
            <OutlineButton label="Edit Academic Year" />
          </div>
        }
      />

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-slate-700">Academic Year 2024–25</p>
        </div>
        <div className="flex rounded-lg overflow-hidden gap-px bg-slate-200">
          {terms.map((t) => (
            <div
              key={t.name}
              className={cn("px-3 py-4 min-w-0 overflow-hidden", t.color)}
              style={{ flex: t.flex }}
            >
              <p className="text-xs font-semibold truncate">{t.name}</p>
              <p className="text-[10px] opacity-80 truncate mt-0.5">{t.start}</p>
              {t.flex > 2 && (
                <p className="text-[10px] opacity-80 truncate">→ {t.end}</p>
              )}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          {[
            { label: "Term blocks", color: "bg-amber-500" },
            { label: "Break periods", color: "bg-slate-300" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className={cn("w-2.5 h-2.5 rounded-sm", l.color)} />
              {l.label}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-700">Public Holidays</p>
        <AddButton label="Add Holiday" />
      </div>
      <Table headers={["Holiday", "Date", "Actions"]}>
        {holidays.map((h) => (
          <tr key={h.name} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3.5 text-sm text-slate-800">{h.name}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{h.date}</td>
            <td className="px-4 py-3.5">
              <TableAction label="Edit" />
            </td>
          </tr>
        ))}
      </Table>
    </div>
  );
}

// ─── Section 8: Subjects & Catalogue ──────────────────────────────────────────

function SubjectsSection() {
  const subjects = [
    { name: "Primary Maths", dept: "Primary", groups: "Y1–Y6", duration: "60 min", rate: "AED 160–180" },
    { name: "Primary English", dept: "Primary", groups: "Y1–Y6", duration: "60 min", rate: "AED 160–180" },
    { name: "Primary Science", dept: "Primary", groups: "Y4–Y6", duration: "60 min", rate: "AED 150–180" },
    { name: "Lower Sec Maths", dept: "Lower Secondary", groups: "Y7–Y9", duration: "60 min", rate: "Tier-based" },
    { name: "Lower Sec English", dept: "Lower Secondary", groups: "Y7–Y9", duration: "60 min", rate: "Tier-based" },
    { name: "Senior Maths", dept: "Senior", groups: "Y10–Y13", duration: "60 min", rate: "Tier-based" },
  ];
  return (
    <div>
      <SectionHeader
        title="Subjects & Catalogue"
        description="47 active subjects across 3 departments."
        action={<AddButton label="Add Subject" />}
      />
      <Table headers={["Subject", "Department", "Year Groups", "Session Duration", "Rate", "Status"]}>
        {subjects.map((s) => (
          <tr key={s.name} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{s.name}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{s.dept}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{s.groups}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{s.duration}</td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{s.rate}</td>
            <td className="px-4 py-3.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                Active
              </span>
            </td>
          </tr>
        ))}
      </Table>
      <div className="mt-3 text-right">
        <button className="text-sm text-amber-600 hover:text-amber-700 hover:underline cursor-pointer">
          View all 47 subjects →
        </button>
      </div>
    </div>
  );
}

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

function RolesSection() {
  const roles = [
    { name: "Super Admin", type: "System", count: "1", desc: "Full platform access. Cannot be restricted." },
    { name: "Admin Head", type: "System", count: "1", desc: "Senior operational authority. Approves gateway actions." },
    { name: "Admin", type: "System", count: "2", desc: "Day-to-day operations. Invoicing, scheduling, leads." },
    { name: "Academic Head", type: "System", count: "0", desc: "Academic oversight across all departments." },
    { name: "HOD", type: "System", count: "1", desc: "Department head. Scoped to assigned department." },
    { name: "Head of Subject", type: "System", count: "0", desc: "Subject-level lead." },
    { name: "Teacher", type: "System", count: "7", desc: "Session delivery. Scoped to own classes." },
    { name: "TA", type: "System", count: "1", desc: "Read access to assigned classes." },
    { name: "HR / Finance", type: "Custom", count: "1", desc: "Salary, staff profiles, documents, finance exports." },
    { name: "Developer", type: "System", count: "0", desc: "Full access. Excluded from all routing and notifications." },
    { name: "Student", type: "System", count: "—", desc: "Phase 2 portal access." },
    { name: "Parent", type: "System", count: "—", desc: "Phase 2 portal access." },
  ];
  return (
    <div>
      <SectionHeader
        title="Roles & Permissions"
        description="Platform roles, access scopes, and custom permission sets."
        action={<AddButton label="Create Custom Role" />}
      />
      <Table headers={["Role", "Type", "Staff Count", "Description"]}>
        {roles.map((r) => (
          <tr key={r.name} className="hover:bg-slate-50 transition-colors">
            <td className="px-4 py-3.5 text-sm font-medium text-slate-800">{r.name}</td>
            <td className="px-4 py-3.5">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  r.type === "Custom"
                    ? "bg-violet-100 text-violet-700"
                    : "bg-slate-100 text-slate-600"
                )}
              >
                {r.type}
              </span>
            </td>
            <td className="px-4 py-3.5 text-sm text-slate-600">{r.count}</td>
            <td className="px-4 py-3.5 text-sm text-slate-500">{r.desc}</td>
          </tr>
        ))}
      </Table>
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
                  onChange={(v) =>
                    setToggles((prev) => ({ ...prev, [n.name]: v }))
                  }
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
    { name: "New Lead Welcome", trigger: "Lead: New", edited: "10 Mar 2025" },
    { name: "Assessment Booking Confirmation", trigger: "Lead: Assessment Booked", edited: "8 Mar 2025" },
    { name: "Trial Booking Confirmation", trigger: "Lead: Trial Booked", edited: "8 Mar 2025" },
    { name: "Invoice Issued", trigger: "Finance: Invoice Issued", edited: "1 Mar 2025" },
    { name: "Payment Reminder", trigger: "Finance: Invoice Overdue", edited: "1 Mar 2025" },
    { name: "Absence Notification", trigger: "Attendance: Absence Marked", edited: "15 Feb 2025" },
    { name: "Session Cancellation", trigger: "Timetable: Session Cancelled", edited: "10 Feb 2025" },
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
              <SegmentedToggle
                value={state}
                onChange={(v) => setFeatures((prev) => ({ ...prev, [name]: v }))}
              />
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
  { ts: "16 Apr 2025, 09:14", user: "Jason Daswani", action: "Settings changed", module: "M20", detail: "VAT rate updated: 5% → 5% (no change)" },
  { ts: "15 Apr 2025, 17:32", user: "Jason Daswani", action: "Invoice created", module: "M08", detail: "INV-1042 issued to Fatima Rahman" },
  { ts: "15 Apr 2025, 16:45", user: "Sarah Thompson", action: "Attendance marked", module: "M06", detail: "Y8 Maths — Mon 14 Apr — 3 students" },
  { ts: "15 Apr 2025, 14:20", user: "Jason Daswani", action: "Staff role updated", module: "M09/PL02", detail: "Mariam Saleh — Access Revoked" },
  { ts: "14 Apr 2025, 11:05", user: "Jason Daswani", action: "Lead stage changed", module: "M01", detail: "L-0060 → Won" },
  { ts: "14 Apr 2025, 10:30", user: "Sarah Thompson", action: "Student created", module: "M02", detail: "IMI-1847 — Amna Al-Qubaisi" },
  { ts: "13 Apr 2025, 16:20", user: "Jason Daswani", action: "Credit issued", module: "M08", detail: "AED 800 — Aisha Rahman — goodwill" },
  { ts: "13 Apr 2025, 09:00", user: "Jason Daswani", action: "Concern raised", module: "M06.A", detail: "Y8 Maths — Aisha Rahman — L1" },
  { ts: "12 Apr 2025, 14:15", user: "Sarah Thompson", action: "Payment recorded", module: "M08", detail: "AED 3,360 — INV-1039 — Bank Transfer" },
  { ts: "11 Apr 2025, 11:45", user: "Jason Daswani", action: "Staff added", module: "M09", detail: "Khalil Mansouri — Teacher — Primary" },
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
    case "subjects":         return <SubjectsSection />;
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
  const [activeSection, setActiveSection] = useState<SectionId>("organisation");

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
        <div className="p-8 max-w-4xl">{renderSection(activeSection)}</div>
      </div>
    </div>
  );
}
