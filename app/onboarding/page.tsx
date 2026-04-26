"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Building2,
  GitBranch,
  Layers,
  Receipt,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Plus,
  Trash2,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const YEAR_GROUPS = [
  "FS1","FS2","Y1","Y2","Y3","Y4","Y5","Y6","Y7","Y8","Y9","Y10","Y11","Y12","Y13",
] as const;

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
  return YEAR_GROUPS.indexOf(yg as (typeof YEAR_GROUPS)[number]);
}

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEPS = [
  { id: "organisation", label: "Organisation", description: "Core details & regional settings", icon: Building2 },
  { id: "branches",     label: "Branches",     description: "Physical locations & campuses",    icon: GitBranch },
  { id: "departments",  label: "Departments",  description: "Academic department structure",    icon: Layers },
  { id: "billing",      label: "Billing",      description: "Invoice & payment settings",       icon: Receipt, optional: true },
  { id: "academic",     label: "Academic Year", description: "Current academic year & terms",   icon: Calendar, optional: true },
  { id: "complete",     label: "Complete",      description: "Setup summary",                   icon: CheckCircle2 },
] as const;

// ─── Shared types ─────────────────────────────────────────────────────────────

type OrgState = {
  org_name: string; legal_name: string; student_id_format: string;
  currency: string; timezone: string; default_language: string; start_day_of_week: string;
};

type BranchRow = { id?: string; name: string; address: string; phone: string; _saved?: boolean };

type DeptRow = { id?: string; name: string; yearGroupFrom: string; yearGroupTo: string; colour: string; _saved?: boolean };

type BillingState = {
  invoice_number_prefix: string; invoice_number_format: string;
  vat_rate: string; default_payment_terms: string;
  enrolment_fee: string; enrolment_fee_type: string;
};

type AcademicState = { name: string; startDate: string; endDate: string; isCurrent: boolean };

type WizardFormData = {
  org: OrgState;
  branches: BranchRow[];
  depts: DeptRow[];
  billing: BillingState;
  academic: AcademicState;
};

const DEFAULT_FORM: WizardFormData = {
  org: {
    org_name: "", legal_name: "", student_id_format: "",
    currency: "AED", timezone: "UTC+4 (Gulf Standard Time)",
    default_language: "English", start_day_of_week: "Monday",
  },
  branches: [{ name: "", address: "", phone: "" }],
  depts: [{ name: "", yearGroupFrom: "FS1", yearGroupTo: "Y6", colour: DEPT_COLOURS[0].hex }],
  billing: {
    invoice_number_prefix: "", invoice_number_format: "",
    vat_rate: "", default_payment_terms: "",
    enrolment_fee: "", enrolment_fee_type: "Lifetime (charged once per student)",
  },
  academic: { name: "", startDate: "", endDate: "", isCurrent: true },
};

// ─── Shared form primitives ────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

function Input({
  value, onChange, placeholder = "", type = "text", disabled = false,
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all disabled:opacity-50"
    />
  );
}

function WSelect({
  value, onChange, options,
}: {
  value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all cursor-pointer appearance-none"
    >
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function FieldGroup({ children, cols = 1 }: { children: React.ReactNode; cols?: 1 | 2 }) {
  return (
    <div className={cn("grid gap-4", cols === 2 ? "grid-cols-2" : "grid-cols-1")}>
      {children}
    </div>
  );
}

function ErrorBanner({ msg }: { msg: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
      <X className="w-4 h-4 shrink-0" /> {msg}
    </div>
  );
}

function NavButtons({
  onBack, onNext, onSkip,
  nextLabel = "Next", saving = false,
}: {
  onBack?: () => void; onNext: () => void; onSkip?: () => void;
  nextLabel?: string; saving?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            onClick={onBack}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-40"
          >
            Back
          </button>
        )}
        {onSkip && (
          <button onClick={onSkip} disabled={saving} className="text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
            Skip for now
          </button>
        )}
      </div>
      <button
        onClick={onNext}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60"
      >
        {saving ? "Saving…" : nextLabel}
        {!saving && <ArrowRight className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ─── Step 1: Organisation ─────────────────────────────────────────────────────

function StepOrganisation({
  data, onChange, onNext,
}: {
  data: OrgState;
  onChange: (d: OrgState) => void;
  onNext: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Pre-fill from API only if fields are still blank (first visit)
  useEffect(() => {
    if (data.org_name) return; // already have data, don't overwrite
    fetch("/api/settings/org").then((r) => r.json()).then((d) => {
      onChange({
        org_name:          d.org_name          || "",
        legal_name:        d.legal_name        || "",
        student_id_format: d.student_id_format || "",
        currency:          d.currency          || "AED",
        timezone:          d.timezone          || "UTC+4 (Gulf Standard Time)",
        default_language:  d.default_language  || "English",
        start_day_of_week: d.start_day_of_week || "Monday",
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(k: keyof OrgState) {
    return (v: string) => { setErr(""); onChange({ ...data, [k]: v }); };
  }

  async function handleNext() {
    if (!data.org_name.trim()) { setErr("Organisation name is required"); return; }
    setSaving(true);
    await onNext();
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Tell us about your organisation</h2>
        <p className="text-sm text-slate-500 mt-1">This sets up your core platform identity and regional preferences.</p>
      </div>
      <div className="space-y-4">
        <FieldGroup cols={2}>
          <Field label="Organisation Name *">
            <Input value={data.org_name} onChange={set("org_name")} placeholder="Improve ME Institute" />
          </Field>
          <Field label="Legal Name">
            <Input value={data.legal_name} onChange={set("legal_name")} placeholder="Improve ME Institute LLC" />
          </Field>
        </FieldGroup>
        <Field label="Student ID Format">
          <Input value={data.student_id_format} onChange={set("student_id_format")} placeholder="STU-{YEAR}-{SEQ}" />
          <p className="text-xs text-slate-400 mt-1">e.g. STU-2025-001 — leave blank to use auto-generated IDs</p>
        </Field>
        <FieldGroup cols={2}>
          <Field label="Currency">
            <WSelect value={data.currency} onChange={set("currency")} options={["AED", "USD", "GBP", "EUR", "SAR"]} />
          </Field>
          <Field label="Timezone">
            <WSelect value={data.timezone} onChange={set("timezone")} options={["UTC+4 (Gulf Standard Time)", "UTC+0 (GMT)", "UTC+3 (AST)", "UTC+5:30 (IST)"]} />
          </Field>
          <Field label="Default Language">
            <WSelect value={data.default_language} onChange={set("default_language")} options={["English", "Arabic", "French"]} />
          </Field>
          <Field label="Start Day of Week">
            <WSelect value={data.start_day_of_week} onChange={set("start_day_of_week")} options={["Monday", "Sunday", "Saturday"]} />
          </Field>
        </FieldGroup>
        {err && <ErrorBanner msg={err} />}
      </div>
      <NavButtons onNext={handleNext} saving={saving} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 2: Branches ─────────────────────────────────────────────────────────

function StepBranches({
  data, onChange, onNext, onBack,
}: {
  data: BranchRow[];
  onChange: (d: BranchRow[]) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Load existing branches only on first visit (data has one empty row)
  useEffect(() => {
    const hasContent = data.some((b) => b.name || b.id);
    if (hasContent) return;
    fetch("/api/settings/branches").then((r) => r.json()).then((res: BranchRow[]) => {
      if (Array.isArray(res) && res.length > 0) {
        onChange(res.map((b) => ({ id: b.id, name: b.name ?? "", address: b.address ?? "", phone: b.phone ?? "", _saved: true })));
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(idx: number, field: keyof BranchRow, val: string) {
    setErr("");
    onChange(data.map((b, i) => i === idx ? { ...b, [field]: val, _saved: false } : b));
  }

  function addRow() {
    onChange([...data, { name: "", address: "", phone: "" }]);
  }

  function removeRow(idx: number) {
    if (data.length === 1) return;
    onChange(data.filter((_, i) => i !== idx));
  }

  async function handleNext() {
    const filled = data.filter((b) => b.name.trim());
    if (filled.length === 0) { setErr("Add at least one branch"); return; }
    setSaving(true);
    await onNext();
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Add your branches</h2>
        <p className="text-sm text-slate-500 mt-1">Branches are your physical teaching locations. Add all campuses you operate from.</p>
      </div>
      <div className="space-y-3">
        {data.map((b, idx) => (
          <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Branch {idx + 1} {b._saved && <span className="text-emerald-500">✓ saved</span>}
              </span>
              {data.length > 1 && (
                <button onClick={() => removeRow(idx)} className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Branch Name *">
                  <Input value={b.name} onChange={(v) => setField(idx, "name", v)} placeholder="Main Branch" />
                </Field>
              </div>
              <Field label="Address">
                <Input value={b.address} onChange={(v) => setField(idx, "address", v)} placeholder="Dubai, UAE" />
              </Field>
              <Field label="Phone">
                <Input value={b.phone} onChange={(v) => setField(idx, "phone", v)} placeholder="+971 4 000 0000" />
              </Field>
            </div>
          </div>
        ))}
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2.5 w-full border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add another branch
        </button>
        {err && <ErrorBanner msg={err} />}
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} saving={saving} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 3: Departments ──────────────────────────────────────────────────────

function StepDepartments({
  data, onChange, onNext, onBack,
}: {
  data: DeptRow[];
  onChange: (d: DeptRow[]) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const hasContent = data.some((d) => d.name || d.id);
    if (hasContent) return;
    fetch("/api/settings/departments").then((r) => r.json()).then((res: DeptRow[]) => {
      if (Array.isArray(res) && res.length > 0) {
        onChange(res.map((d) => ({
          id: d.id, name: d.name ?? "", yearGroupFrom: d.yearGroupFrom ?? "FS1",
          yearGroupTo: d.yearGroupTo ?? "Y6", colour: d.colour ?? DEPT_COLOURS[0].hex, _saved: true,
        })));
      }
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setField(idx: number, field: keyof DeptRow, val: string) {
    setErr("");
    onChange(data.map((d, i) => {
      if (i !== idx) return d;
      const next = { ...d, [field]: val, _saved: false };
      if (field === "yearGroupFrom" && ygIndex(val) > ygIndex(next.yearGroupTo)) {
        next.yearGroupTo = val;
      }
      return next;
    }));
  }

  function addRow() {
    const colour = DEPT_COLOURS[data.length % DEPT_COLOURS.length].hex;
    onChange([...data, { name: "", yearGroupFrom: "FS1", yearGroupTo: "Y13", colour }]);
  }

  function removeRow(idx: number) {
    if (data.length === 1) return;
    onChange(data.filter((_, i) => i !== idx));
  }

  async function handleNext() {
    const filled = data.filter((d) => d.name.trim());
    if (filled.length === 0) { setErr("Add at least one department"); return; }
    setSaving(true);
    await onNext();
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Set up your departments</h2>
        <p className="text-sm text-slate-500 mt-1">
          Departments group students by year range. Graduated &amp; Alumni students without a department are automatically assigned to your highest year-group department.
        </p>
      </div>
      <div className="space-y-3">
        {data.map((d, idx) => (
          <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.colour }} />
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Department {idx + 1} {d._saved && <span className="text-emerald-500">✓ saved</span>}
                </span>
              </div>
              {data.length > 1 && (
                <button onClick={() => removeRow(idx)} className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Department Name *">
                  <Input value={d.name} onChange={(v) => setField(idx, "name", v)} placeholder="e.g. Primary, Secondary, Enrichment" />
                </Field>
              </div>
              <Field label="Year Groups From">
                <select
                  value={d.yearGroupFrom}
                  onChange={(e) => setField(idx, "yearGroupFrom", e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 cursor-pointer appearance-none"
                >
                  {YEAR_GROUPS.map((yg) => <option key={yg} value={yg}>{yg}</option>)}
                </select>
              </Field>
              <Field label="Year Groups To">
                <select
                  value={d.yearGroupTo}
                  onChange={(e) => setField(idx, "yearGroupTo", e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 cursor-pointer appearance-none"
                >
                  {YEAR_GROUPS.filter((yg) => ygIndex(yg) >= ygIndex(d.yearGroupFrom)).map((yg) => (
                    <option key={yg} value={yg}>{yg}</option>
                  ))}
                </select>
              </Field>
              <div className="col-span-2">
                <Label>Colour</Label>
                <div className="flex gap-2">
                  {DEPT_COLOURS.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setField(idx, "colour", c.hex)}
                      title={c.label}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all cursor-pointer ring-offset-2",
                        d.colour === c.hex ? "ring-2 ring-slate-700 scale-110" : "hover:scale-105"
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
        <button
          onClick={addRow}
          className="flex items-center gap-2 px-4 py-2.5 w-full border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:border-amber-400 hover:text-amber-600 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add another department
        </button>
        {err && <ErrorBanner msg={err} />}
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} saving={saving} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 4: Billing ──────────────────────────────────────────────────────────

function StepBilling({
  data, onChange, onNext, onBack, onSkip,
}: {
  data: BillingState;
  onChange: (d: BillingState) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const hasContent = Object.values(data).some((v) => v && v !== "Lifetime (charged once per student)");
    if (hasContent) return;
    fetch("/api/settings/org").then((r) => r.json()).then((d) => {
      onChange({
        invoice_number_prefix: d.invoice_number_prefix || "",
        invoice_number_format: d.invoice_number_format || "",
        vat_rate:              d.vat_rate              || "",
        default_payment_terms: d.default_payment_terms || "",
        enrolment_fee:         d.enrolment_fee         || "",
        enrolment_fee_type:    d.enrolment_fee_type    || "Lifetime (charged once per student)",
      });
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set(k: keyof BillingState) {
    return (v: string) => onChange({ ...data, [k]: v });
  }

  async function handleNext() {
    setSaving(true);
    await onNext();
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Billing &amp; Invoicing</h2>
        <p className="text-sm text-slate-500 mt-1">Configure how invoices are numbered and any VAT or enrolment fee rules.</p>
      </div>
      <div className="space-y-4">
        <FieldGroup cols={2}>
          <Field label="Invoice Number Prefix">
            <Input value={data.invoice_number_prefix} onChange={set("invoice_number_prefix")} placeholder="INV" />
          </Field>
          <Field label="Invoice Number Format">
            <Input value={data.invoice_number_format} onChange={set("invoice_number_format")} placeholder="INV-{YEAR}-{SEQ}" />
          </Field>
          <Field label="VAT Rate (%)">
            <Input value={data.vat_rate} onChange={set("vat_rate")} placeholder="5" />
          </Field>
          <Field label="Default Payment Terms">
            <Input value={data.default_payment_terms} onChange={set("default_payment_terms")} placeholder="Net 14" />
          </Field>
          <Field label="Enrolment Fee">
            <Input value={data.enrolment_fee} onChange={set("enrolment_fee")} placeholder="500" />
          </Field>
          <Field label="Enrolment Fee Type">
            <WSelect
              value={data.enrolment_fee_type}
              onChange={set("enrolment_fee_type")}
              options={["Lifetime (charged once per student)", "Annual", "Per Enrolment"]}
            />
          </Field>
        </FieldGroup>
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} onSkip={onSkip} saving={saving} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 5: Academic Year ────────────────────────────────────────────────────

function StepAcademic({
  data, onChange, onNext, onBack, onSkip,
}: {
  data: AcademicState;
  onChange: (d: AcademicState) => void;
  onNext: () => Promise<void>;
  onBack: () => void;
  onSkip: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [existing, setExisting] = useState<{ id: string; name: string; isCurrent: boolean }[]>([]);

  useEffect(() => {
    fetch("/api/settings/academic-years").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setExisting(d);
    }).catch(() => {});
  }, []);

  function set<K extends keyof AcademicState>(k: K, v: AcademicState[K]) {
    setErr("");
    onChange({ ...data, [k]: v });
  }

  async function handleNext() {
    if (!data.name.trim() || !data.startDate || !data.endDate) {
      setErr("Academic year name, start date, and end date are required");
      return;
    }
    if (data.startDate >= data.endDate) {
      setErr("End date must be after start date");
      return;
    }
    setSaving(true);
    await onNext();
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Academic year</h2>
        <p className="text-sm text-slate-500 mt-1">Define your current academic year. You can add terms and holidays from Settings later.</p>
      </div>

      {existing.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-semibold text-amber-700 mb-1.5">Existing academic years</p>
          <div className="flex flex-wrap gap-2">
            {existing.map((y) => (
              <span key={y.id} className="px-2 py-1 text-xs bg-white border border-amber-200 rounded-md text-slate-700">
                {y.name} {y.isCurrent && <span className="text-amber-600 font-semibold">· Current</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <Field label="Academic Year Name *">
          <Input value={data.name} onChange={(v) => set("name", v)} placeholder="2025–2026" />
        </Field>
        <FieldGroup cols={2}>
          <Field label="Start Date *">
            <Input value={data.startDate} onChange={(v) => set("startDate", v)} type="date" />
          </Field>
          <Field label="End Date *">
            <Input value={data.endDate} onChange={(v) => set("endDate", v)} type="date" />
          </Field>
        </FieldGroup>

        <button
          onClick={() => set("isCurrent", !data.isCurrent)}
          className="flex items-center gap-3 cursor-pointer group w-full text-left"
        >
          <div className={cn(
            "w-10 h-6 rounded-full transition-colors relative shrink-0",
            data.isCurrent ? "bg-amber-500" : "bg-slate-200"
          )}>
            <span className={cn(
              "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
              data.isCurrent ? "translate-x-5" : "translate-x-1"
            )} />
          </div>
          <span className="text-sm text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
            Mark as current academic year
          </span>
        </button>

        {err && <ErrorBanner msg={err} />}
      </div>
      <NavButtons onBack={onBack} onNext={handleNext} onSkip={onSkip} saving={saving} nextLabel="Save & Continue" />
    </div>
  );
}

// ─── Step 6: Complete ─────────────────────────────────────────────────────────

type SummaryData = {
  orgName: string; branchCount: number; deptCount: number;
  billingConfigured: boolean; academicYearConfigured: boolean;
};

function StepComplete({ summary, onFinish }: { summary: SummaryData; onFinish: () => Promise<void> }) {
  const [finishing, setFinishing] = useState(false);

  const items = [
    { label: "Organisation profile", done: !!summary.orgName,                 detail: summary.orgName || "Not set" },
    { label: "Branches",            done: summary.branchCount > 0,            detail: summary.branchCount > 0 ? `${summary.branchCount} branch${summary.branchCount !== 1 ? "es" : ""} added` : "None added" },
    { label: "Departments",         done: summary.deptCount > 0,              detail: summary.deptCount > 0 ? `${summary.deptCount} department${summary.deptCount !== 1 ? "s" : ""} configured` : "None added" },
    { label: "Billing & Invoicing", done: summary.billingConfigured,          detail: summary.billingConfigured ? "Invoice settings saved" : "Skipped — configure in Settings" },
    { label: "Academic Year",       done: summary.academicYearConfigured,     detail: summary.academicYearConfigured ? "Current year set" : "Skipped — configure in Settings" },
  ];

  async function handleFinish() {
    setFinishing(true);
    await onFinish();
  }

  return (
    <div>
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 mb-6">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">You&apos;re all set!</h2>
        <p className="text-sm text-slate-500 mt-1">Here&apos;s a summary of what was configured. You can update any of these settings later.</p>
      </div>
      <div className="space-y-2 mb-6">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
              item.done ? "bg-emerald-100" : "bg-slate-100"
            )}>
              {item.done
                ? <Check className="w-3.5 h-3.5 text-emerald-600" />
                : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-500 truncate">{item.detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-6 border-t border-slate-100">
        <p className="text-xs text-slate-400">Onboarding can be re-run from Settings → Organisation</p>
        <button
          onClick={handleFinish}
          disabled={finishing}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-60"
        >
          {finishing ? "Finishing…" : "Go to Dashboard"}
          {!finishing && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Left Panel ────────────────────────────────────────────────────────────────

function LeftPanel({ currentStep, completedSteps }: { currentStep: number; completedSteps: Set<number> }) {
  return (
    <aside className="w-72 bg-[#0F172A] flex flex-col p-8 shrink-0">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center">
          <span className="text-white font-bold text-lg leading-none">E</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Enrolla</p>
          <p className="text-slate-400 text-xs">Setup Wizard</p>
        </div>
      </div>

      <nav className="flex-1">
        <ol className="space-y-1">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive   = idx === currentStep;
            const isDone     = completedSteps.has(idx);
            const isUpcoming = idx > currentStep && !isDone;
            return (
              <li key={step.id}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive ? "bg-white/10" : "",
                  isDone && !isActive ? "opacity-70" : "",
                  isUpcoming ? "opacity-40" : "",
                )}>
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors",
                    isActive ? "bg-amber-500" : isDone ? "bg-emerald-500" : "bg-white/10",
                  )}>
                    {isDone && !isActive
                      ? <Check className="w-3.5 h-3.5 text-white" />
                      : <Icon className="w-3.5 h-3.5 text-white" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium leading-tight", isActive ? "text-white" : "text-slate-400")}>
                      {step.label}
                      {"optional" in step && step.optional && (
                        <span className="ml-1.5 text-[10px] font-normal text-slate-500 uppercase tracking-wide">optional</span>
                      )}
                    </p>
                    {isActive && <p className="text-xs text-slate-400 truncate mt-0.5">{step.description}</p>}
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn("ml-6 w-px h-4 mt-0.5", isDone ? "bg-emerald-500/40" : "bg-white/10")} />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="pt-6 border-t border-white/10">
        <p className="text-xs text-slate-500">You can always update these settings later in <span className="text-slate-400 font-medium">Settings → Organisation</span>.</p>
      </div>
    </aside>
  );
}

// ─── Main Wizard ───────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]           = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  // All form data lifted to parent — survives step navigation
  const [formData, setFormData] = useState<WizardFormData>(DEFAULT_FORM);

  const [summary, setSummary] = useState<SummaryData>({
    orgName: "", branchCount: 0, deptCount: 0,
    billingConfigured: false, academicYearConfigured: false,
  });

  useEffect(() => {
    fetch("/api/settings/org").then((r) => r.json()).then((d) => {
      if (d.onboarding_completed_at) router.replace("/dashboard");
    }).catch(() => {});
  }, [router]);

  function markDone(idx: number) {
    setCompleted((prev) => new Set([...prev, idx]));
  }

  // ── Step handlers (only API calls; form data already in parent state) ───────

  const handleOrg = useCallback(async () => {
    const { org } = formData;
    const res = await fetch("/api/settings/org", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(org),
    });
    if (!res.ok) { toast.error("Failed to save organisation details"); return; }
    setSummary((p) => ({ ...p, orgName: org.org_name }));
    markDone(0); setStep(1);
  }, [formData]);

  const handleBranches = useCallback(async () => {
    const branches = formData.branches.filter((b) => b.name.trim());
    let saved = 0;
    for (const b of branches) {
      if (b.id) {
        await fetch(`/api/settings/branches/${b.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: b.name, address: b.address, phone: b.phone }),
        });
      } else {
        const res = await fetch("/api/settings/branches", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: b.name, address: b.address, phone: b.phone }),
        });
        if (res.ok) saved++;
      }
    }
    const total = branches.filter((b) => b.id).length + saved;
    setSummary((p) => ({ ...p, branchCount: total || branches.length }));
    markDone(1); setStep(2);
  }, [formData]);

  const handleDepts = useCallback(async () => {
    const depts = formData.depts.filter((d) => d.name.trim());
    let saved = 0;
    for (const d of depts) {
      if (d.id) {
        await fetch(`/api/settings/departments/${d.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: d.name, yearGroupFrom: d.yearGroupFrom, yearGroupTo: d.yearGroupTo, colour: d.colour }),
        });
      } else {
        const res = await fetch("/api/settings/departments", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: d.name, yearGroupFrom: d.yearGroupFrom, yearGroupTo: d.yearGroupTo, colour: d.colour }),
        });
        if (res.ok) saved++;
      }
    }
    const total = depts.filter((d) => d.id).length + saved;
    setSummary((p) => ({ ...p, deptCount: total || depts.length }));
    markDone(2); setStep(3);
  }, [formData]);

  const handleBilling = useCallback(async () => {
    const res = await fetch("/api/settings/org", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData.billing),
    });
    if (!res.ok) { toast.error("Failed to save billing settings"); return; }
    const hasContent = Object.values(formData.billing).some((v) => v && v !== "Lifetime (charged once per student)");
    setSummary((p) => ({ ...p, billingConfigured: hasContent }));
    markDone(3); setStep(4);
  }, [formData]);

  const handleAcademic = useCallback(async () => {
    const res = await fetch("/api/settings/academic-years", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData.academic),
    });
    if (!res.ok) { toast.error("Failed to save academic year"); return; }
    setSummary((p) => ({ ...p, academicYearConfigured: true }));
    markDone(4); setStep(5);
  }, [formData]);

  const handleFinish = useCallback(async () => {
    await fetch("/api/settings/org", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complete: true }),
    });
    toast.success("Onboarding complete! Welcome to Enrolla.");
    router.push("/dashboard");
  }, [router]);

  const totalSteps = STEPS.length - 1; // exclude Complete step from progress calc
  const progressPct = Math.round((completed.size / totalSteps) * 100);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      <LeftPanel currentStep={step} completedSteps={completed} />

      <main className="flex-1 overflow-y-auto flex items-start justify-center p-10 pt-16">
        <div className="w-full max-w-2xl">
          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Step {step + 1} of {STEPS.length}
              </span>
              <span className="text-xs text-slate-400">{progressPct}% complete</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Step card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            {step === 0 && (
              <StepOrganisation
                data={formData.org}
                onChange={(d) => setFormData((p) => ({ ...p, org: d }))}
                onNext={handleOrg}
              />
            )}
            {step === 1 && (
              <StepBranches
                data={formData.branches}
                onChange={(d) => setFormData((p) => ({ ...p, branches: d }))}
                onNext={handleBranches}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <StepDepartments
                data={formData.depts}
                onChange={(d) => setFormData((p) => ({ ...p, depts: d }))}
                onNext={handleDepts}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <StepBilling
                data={formData.billing}
                onChange={(d) => setFormData((p) => ({ ...p, billing: d }))}
                onNext={handleBilling}
                onBack={() => setStep(2)}
                onSkip={() => { markDone(3); setStep(4); }}
              />
            )}
            {step === 4 && (
              <StepAcademic
                data={formData.academic}
                onChange={(d) => setFormData((p) => ({ ...p, academic: d }))}
                onNext={handleAcademic}
                onBack={() => setStep(3)}
                onSkip={() => { markDone(4); setStep(5); }}
              />
            )}
            {step === 5 && (
              <StepComplete summary={summary} onFinish={handleFinish} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
