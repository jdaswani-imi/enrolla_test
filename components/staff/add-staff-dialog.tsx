"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FIELD, FieldLabel, FormActions } from "@/components/journey/dialog-parts";
import { PhoneInput } from "@/components/add-student-dialog";
import { cn } from "@/lib/utils";
import { staffMembers, type StaffMember, type StaffStatus } from "@/lib/mock-data";

// ─── Options ──────────────────────────────────────────────────────────────────

const STAFF_ROLES = [
  "Teacher",
  "TA",
  "Admin",
  "Admin Head",
  "HOD",
  "Academic Head",
  "HR-Finance",
] as const;

const STAFF_DEPARTMENTS = ["Primary", "Lower Secondary", "Senior"] as const;

type StaffRole = (typeof STAFF_ROLES)[number];
type StaffDepartment = (typeof STAFF_DEPARTMENTS)[number];

export interface NewStaffData {
  firstName: string;
  lastName: string;
  role: StaffRole;
  department: StaffDepartment;
  email: string;
  dialCode: string;
  phone: string;
  startDate: string;
  subjects: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTitleCase(input: string): string {
  return input
    .toLowerCase()
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

function suggestedEmail(firstName: string, lastName: string): string {
  const f = firstName.trim().toLowerCase().replace(/[^a-z]/g, "");
  const l = lastName.trim().toLowerCase().replace(/[^a-z]/g, "");
  if (!f || !l) return "";
  return `${f[0]}.${l}@improvemeinstitute.com`;
}

function formatDateDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${Number(d)} ${months[Number(m) - 1]} ${y}`;
}

// ─── Subjects multi-select ────────────────────────────────────────────────────

function SubjectsSelect({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;

  function toggle(s: string) {
    if (value.includes(s)) onChange(value.filter((v) => v !== s));
    else onChange([...value, s]);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-left cursor-pointer hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
      >
        <span className={cn("truncate", value.length === 0 && "text-slate-400")}>
          {value.length === 0 ? "Select subjects…" : `${value.length} selected`}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
      </button>

      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-medium"
            >
              {s}
              <button
                type="button"
                onClick={() => toggle(s)}
                aria-label={`Remove ${s}`}
                className="text-amber-600 hover:text-amber-800 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter subjects…"
                className="w-full pl-7 pr-2 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
            ) : (
              filtered.map((s) => {
                const selected = value.includes(s);
                return (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => toggle(s)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-amber-50 cursor-pointer",
                        selected && "bg-amber-50 text-amber-700 font-medium",
                      )}
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                          selected ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300 bg-white",
                        )}
                      >
                        {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                      </span>
                      <span className="flex-1 text-left truncate">{s}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

function useSubjectCatalogue(): string[] {
  return useMemo(() => {
    const set = new Set<string>();
    for (const s of staffMembers) for (const sub of s.subjects) set.add(sub);
    return [...set].sort();
  }, []);
}

function defaultState(): {
  firstName: string;
  lastName: string;
  role: StaffRole;
  department: StaffDepartment;
  dialCode: string;
  phone: string;
  startDate: string;
  subjects: string[];
} {
  return {
    firstName: "",
    lastName: "",
    role: "Teacher",
    department: "Primary",
    dialCode: "+971",
    phone: "",
    startDate: "",
    subjects: [],
  };
}

type Mode =
  | { kind: "add" }
  | { kind: "edit"; staff: StaffMember };

export function AddStaffDialog({
  open,
  onOpenChange,
  onConfirm,
  mode = { kind: "add" },
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (data: NewStaffData) => void;
  mode?: Mode;
}) {
  const catalogue = useSubjectCatalogue();
  const [state, setState] = useState(defaultState);
  const [attempted, setAttempted] = useState(false);

  // Seed form state when the dialog opens (or mode changes).
  useEffect(() => {
    if (!open) return;
    setAttempted(false);
    if (mode.kind === "edit") {
      const s = mode.staff;
      const [first, ...rest] = s.name.split(" ");
      setState({
        firstName: first ?? "",
        lastName: rest.join(" "),
        role: (STAFF_ROLES as readonly string[]).includes(s.role)
          ? (s.role as StaffRole)
          : "Teacher",
        department: (STAFF_DEPARTMENTS as readonly string[]).includes(s.department)
          ? (s.department as StaffDepartment)
          : "Primary",
        dialCode: "+971",
        phone: "",
        startDate: "",
        subjects: [...s.subjects],
      });
    } else {
      setState(defaultState());
    }
  }, [open, mode]);

  function patch<K extends keyof typeof state>(key: K, value: (typeof state)[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  const email = suggestedEmail(state.firstName, state.lastName);

  const errors: Record<string, string> = {};
  if (!state.firstName.trim()) errors.firstName = "Required";
  if (!state.lastName.trim()) errors.lastName = "Required";
  if (!state.startDate) errors.startDate = "Required";

  const canSubmit = Object.keys(errors).length === 0;

  function submit() {
    setAttempted(true);
    if (!canSubmit) return;
    const first = toTitleCase(state.firstName.trim());
    const last = toTitleCase(state.lastName.trim());
    const data: NewStaffData = {
      firstName: first,
      lastName: last,
      role: state.role,
      department: state.department,
      email,
      dialCode: state.dialCode,
      phone: state.phone.trim(),
      startDate: state.startDate,
      subjects: state.subjects,
    };
    onConfirm(data);
    onOpenChange(false);
  }

  const isEdit = mode.kind === "edit";
  const title = isEdit ? "Edit staff details" : "Add staff member";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[640px] max-w-[92vw] max-h-[88vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the staff profile. All fields marked * are required."
              : "Create a new staff profile. All fields marked * are required."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="as-first" required>First name</FieldLabel>
              <input
                id="as-first"
                type="text"
                value={state.firstName}
                onChange={(e) => patch("firstName", e.target.value)}
                onBlur={(e) => patch("firstName", toTitleCase(e.target.value))}
                placeholder="e.g. Ahmed"
                className={cn(
                  FIELD,
                  attempted && errors.firstName && "border-red-300 focus:ring-red-300 focus:border-red-400",
                )}
              />
            </div>
            <div>
              <FieldLabel htmlFor="as-last" required>Last name</FieldLabel>
              <input
                id="as-last"
                type="text"
                value={state.lastName}
                onChange={(e) => patch("lastName", e.target.value)}
                onBlur={(e) => patch("lastName", toTitleCase(e.target.value))}
                placeholder="e.g. Khalil"
                className={cn(
                  FIELD,
                  attempted && errors.lastName && "border-red-300 focus:ring-red-300 focus:border-red-400",
                )}
              />
            </div>
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="as-role" required>Role</FieldLabel>
              <select
                id="as-role"
                value={state.role}
                onChange={(e) => patch("role", e.target.value as StaffRole)}
                className={cn(FIELD, "cursor-pointer")}
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="as-dept" required>Department</FieldLabel>
              <select
                id="as-dept"
                value={state.department}
                onChange={(e) => patch("department", e.target.value as StaffDepartment)}
                className={cn(FIELD, "cursor-pointer")}
              >
                {STAFF_DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Work email (read-only, derived) */}
          <div>
            <FieldLabel htmlFor="as-email" required>Work email</FieldLabel>
            <input
              id="as-email"
              type="email"
              value={email}
              readOnly
              placeholder="firstinitial.lastname@improvemeinstitute.com"
              className={cn(FIELD, "bg-slate-50 text-slate-600")}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Auto-generated: <span className="font-medium text-slate-500">firstinitial.lastname@improvemeinstitute.com</span>
            </p>
          </div>

          {/* Phone (optional) */}
          <div>
            <FieldLabel htmlFor="as-phone">Phone <span className="text-slate-400 font-normal">(optional)</span></FieldLabel>
            <PhoneInput
              id="as-phone"
              dialCode={state.dialCode}
              onDialCodeChange={(v) => patch("dialCode", v)}
              value={state.phone}
              onChange={(v) => patch("phone", v)}
            />
          </div>

          {/* Start date */}
          <div>
            <FieldLabel htmlFor="as-start" required>Start date</FieldLabel>
            <input
              id="as-start"
              type="date"
              value={state.startDate}
              onChange={(e) => patch("startDate", e.target.value)}
              className={cn(
                FIELD,
                attempted && errors.startDate && "border-red-300 focus:ring-red-300 focus:border-red-400",
              )}
            />
            {state.startDate && (
              <p className="mt-1 text-[11px] text-slate-400">{formatDateDisplay(state.startDate)}</p>
            )}
          </div>

          {/* Subjects */}
          <div>
            <FieldLabel>Subjects <span className="text-slate-400 font-normal">(optional)</span></FieldLabel>
            <SubjectsSelect
              value={state.subjects}
              onChange={(v) => patch("subjects", v)}
              options={catalogue}
            />
          </div>
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel={isEdit ? "Save changes" : "Add staff member"}
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

// ─── Deactivate dialog ────────────────────────────────────────────────────────

export function DeactivateStaffDialog({
  staff,
  open,
  onOpenChange,
  onConfirm,
}: {
  staff: StaffMember | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!staff) return null;

  const canSubmit = reason.trim().length > 0;

  function submit() {
    if (!canSubmit) return;
    onConfirm(reason.trim());
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[480px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle className="text-red-700">Deactivate {staff.name}?</DialogTitle>
          <DialogDescription>
            The staff member will be marked Inactive and lose access to all systems. This cannot be undone without re-activation by an admin.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div>
            <FieldLabel htmlFor="ds-reason" required>Reason for deactivation</FieldLabel>
            <textarea
              id="ds-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Contract ended, resigned, policy violation…"
              className={FIELD}
            />
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-slate-200 bg-slate-50 p-4 rounded-b-xl flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Keep active
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cn(
              "rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer",
              canSubmit ? "hover:bg-red-700" : "opacity-50 cursor-not-allowed",
            )}
          >
            Deactivate staff
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Re-export for convenience
export type { StaffStatus };
