"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Info, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { enrolments, staffMembers, type Enrolment } from "@/lib/mock-data";
import {
  SUBJECTS,
  type SubjectBand,
  type SubjectOption,
} from "@/components/journey/subjects";

// ─── Types ───────────────────────────────────────────────────────────────────

export type StudentDepartment = "Primary" | "Lower Secondary" | "Senior";

type Frequency = 1 | 2 | 3 | 4;
type TimeBand = "Morning" | "Afternoon" | "Evening";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
type Day = (typeof DAYS)[number];

const TIME_BANDS: { value: TimeBand; label: string; hint: string }[] = [
  { value: "Morning",   label: "Morning",   hint: "8am–12pm" },
  { value: "Afternoon", label: "Afternoon", hint: "12pm–5pm" },
  { value: "Evening",   label: "Evening",   hint: "5pm–8pm" },
];

const FREQUENCY_OPTIONS: { value: Frequency; tier: string }[] = [
  { value: 1, tier: "Standard" },
  { value: 2, tier: "Mid" },
  { value: 3, tier: "Next" },
  { value: 4, tier: "Top" },
];

function tierForFrequency(f: Frequency): string {
  return FREQUENCY_OPTIONS.find((o) => o.value === f)!.tier;
}

// Map a student's department to the subject catalogue band.
function bandForDepartment(d: StudentDepartment): SubjectBand {
  if (d === "Primary") return "Primary";
  if (d === "Lower Secondary") return "Lower Secondary";
  return "Upper Secondary";
}

function subjectsForDepartment(
  dept: StudentDepartment,
  yearGroup: string,
): SubjectOption[] {
  const band = bandForDepartment(dept);
  return SUBJECTS.filter((s) => {
    if (s.band !== band) return false;
    if (s.yearGroups && !s.yearGroups.includes(yearGroup)) return false;
    return true;
  });
}

// Next Monday in YYYY-MM-DD. If today is Monday, returns today + 7.
function nextMondayIso(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay(); // 0 Sun … 6 Sat
  const offset = ((8 - day) % 7) || 7;
  const d = new Date(now.getTime() + offset * 24 * 60 * 60 * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day2 = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day2}`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Style constants ─────────────────────────────────────────────────────────

const FIELD =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400";
const FIELD_ERROR = "border-red-300 focus:ring-red-300 focus:border-red-400";

const STEP_TITLES = ["Subject & Schedule", "Pricing & Package", "Review & Confirm"];

// ─── Dialog ──────────────────────────────────────────────────────────────────

export function NewEnrolmentDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  yearGroup,
  department,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  studentId: string;
  studentName: string;
  yearGroup: string;
  department: StudentDepartment;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [subject, setSubject] = useState("");
  const [frequency, setFrequency] = useState<Frequency | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [timeBand, setTimeBand] = useState<TimeBand | null>(null);
  const [teacher, setTeacher] = useState("");

  // Step 2
  const [sessions, setSessions] = useState<number>(20);
  const [startDate, setStartDate] = useState<string>(() => nextMondayIso());

  const [errors, setErrors] = useState<Record<string, string>>({});

  const subjectOptions = useMemo(
    () => subjectsForDepartment(department, yearGroup),
    [department, yearGroup],
  );

  // Teachers who list the selected subject (matching by substring on subject
  // name — staff `subjects` are prefixed like "Y8 Maths", so a contains match
  // on the subject display name is the right heuristic here).
  const availableTeachers = useMemo(() => {
    if (!subject) return [] as typeof staffMembers;
    const needle = subject.toLowerCase();
    return staffMembers.filter(
      (s) =>
        (s.role === "Teacher" || s.role === "HOD") &&
        s.status === "Active" &&
        s.subjects.some((sub) => sub.toLowerCase().includes(needle)),
    );
  }, [subject]);

  const resetAll = useCallback(() => {
    setStep(1);
    setSubject("");
    setFrequency(null);
    setDays([]);
    setTimeBand(null);
    setTeacher("");
    setSessions(20);
    setStartDate(nextMondayIso());
    setErrors({});
  }, []);

  useEffect(() => {
    if (!open) resetAll();
  }, [open, resetAll]);

  // When subject changes, clear teacher if it's no longer valid.
  useEffect(() => {
    if (!teacher) return;
    if (!availableTeachers.some((t) => t.name === teacher)) setTeacher("");
  }, [availableTeachers, teacher]);

  const showDiscountNote =
    department === "Primary" &&
    subject === "Science" &&
    ["Y4", "Y5", "Y6"].includes(yearGroup);

  // ── Validation ─────────────────────────────────────────────────────────────

  function validateStep1(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!subject) e.subject = "Subject is required";
    if (!frequency) e.frequency = "Session frequency is required";
    if (days.length === 0) e.days = "Pick at least one preferred day";
    if (!timeBand) e.timeBand = "Preferred time is required";
    return e;
  }

  function validateStep2(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!sessions || sessions < 10) e.sessions = "Minimum 10 sessions";
    if (!startDate) e.startDate = "Start date is required";
    return e;
  }

  const stepErrors = useMemo(
    () => Array.from(new Set(Object.values(errors).filter(Boolean))),
    [errors],
  );

  function handleContinue() {
    let e: Record<string, string> = {};
    if (step === 1) e = validateStep1();
    else if (step === 2) e = validateStep2();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    setErrors({});
    setStep(((step + 1) as 1 | 2 | 3));
  }

  function handleBack() {
    setErrors({});
    if (step > 1) setStep(((step - 1) as 1 | 2 | 3));
  }

  function toggleDay(d: Day) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function handleConfirm() {
    const all = { ...validateStep1(), ...validateStep2() };
    if (Object.keys(all).length > 0) {
      setErrors(all);
      setStep(Object.keys(validateStep1()).length ? 1 : 2);
      return;
    }

    const nextNum = enrolments.length + 1;
    const newEnrolment: Enrolment = {
      id: `E-${String(nextNum).padStart(3, "0")}`,
      studentId,
      student: studentName,
      yearGroup,
      department,
      subject: `${yearGroup} ${subject}`,
      teacher: teacher || "—",
      sessionsTotal: sessions,
      sessionsRemaining: sessions,
      frequency: `${frequency}×/week`,
      package: `Term — ${sessions} sessions`,
      invoiceStatus: "Pending",
      enrolmentStatus: "Pending",
    };
    enrolments.push(newEnrolment);

    toast.success("Enrolment added — go to Invoices to issue the invoice");
    onOpenChange(false);
  }

  const tier = frequency ? tierForFrequency(frequency) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[600px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>New Enrolment</DialogTitle>
          <DialogDescription>
            Enrol {studentName} in a new subject package.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-slate-700">
              Step {step} of 3
              <span className="text-slate-400 font-normal">
                  ·  {STEP_TITLES[step - 1]}
              </span>
            </span>
          </div>
          <StepCircles step={step} />
          <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Error banner */}
        {stepErrors.length > 0 && step < 3 && (
          <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-red-800 mb-0.5">
                  Please fix the following before continuing:
                </p>
                <ul className="text-xs text-red-700 list-disc pl-4 space-y-0.5">
                  {stepErrors.slice(0, 6).map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5 space-y-4 max-h-[62vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject" required>
                  Subject
                </Label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={cn(FIELD, errors.subject && FIELD_ERROR)}
                >
                  <option value="">Select a subject…</option>
                  {subjectOptions.map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500">
                  Showing {department} subjects for {yearGroup}.
                </p>
              </div>

              <div>
                <Label required>Session frequency</Label>
                <div className="flex flex-wrap gap-1.5">
                  {FREQUENCY_OPTIONS.map((o) => (
                    <Pill
                      key={o.value}
                      selected={frequency === o.value}
                      error={Boolean(errors.frequency) && frequency === null}
                      onClick={() => setFrequency(o.value)}
                    >
                      {o.value}× per week
                    </Pill>
                  ))}
                </div>
              </div>

              <div>
                <Label required>Preferred days</Label>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => (
                    <Pill
                      key={d}
                      selected={days.includes(d)}
                      error={Boolean(errors.days) && days.length === 0}
                      onClick={() => toggleDay(d)}
                    >
                      {d}
                    </Pill>
                  ))}
                </div>
              </div>

              <div>
                <Label required>Preferred time</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TIME_BANDS.map((t) => (
                    <Pill
                      key={t.value}
                      selected={timeBand === t.value}
                      error={Boolean(errors.timeBand) && timeBand === null}
                      onClick={() => setTimeBand(t.value)}
                    >
                      <span className="font-semibold">{t.label}</span>
                      <span className="text-slate-400 font-normal ml-1.5">
                        {t.hint}
                      </span>
                    </Pill>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="teacher" hint="Optional">
                  Teacher preference
                </Label>
                <select
                  id="teacher"
                  value={teacher}
                  onChange={(e) => setTeacher(e.target.value)}
                  className={FIELD}
                  disabled={!subject}
                >
                  <option value="">
                    {subject
                      ? availableTeachers.length
                        ? "e.g. Lucius Fox"
                        : "No teachers match this subject"
                      : "Select a subject first…"}
                  </option>
                  {availableTeachers.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label>Package tier</Label>
                <div className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-semibold text-amber-800">
                    {tier || "—"}
                  </span>
                  <span className="text-[11px] text-amber-700/80 font-medium">
                    (based on {frequency ?? 0}×/week)
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  Tier determines pricing — final rate is set on the invoice.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sessions" required hint="min 10">
                    Sessions to purchase
                  </Label>
                  <input
                    id="sessions"
                    type="number"
                    min={10}
                    step={1}
                    value={sessions}
                    onChange={(e) => setSessions(Number(e.target.value))}
                    className={cn(FIELD, errors.sessions && FIELD_ERROR)}
                  />
                </div>
                <div>
                  <Label htmlFor="start" required>
                    Package start date
                  </Label>
                  <input
                    id="start"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={cn(FIELD, errors.startDate && FIELD_ERROR)}
                  />
                </div>
              </div>

              {showDiscountNote && (
                <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 flex items-start gap-2">
                  <Info className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                  <p className="text-xs text-teal-800 leading-relaxed">
                    Discounted rate applies if student is also enrolled in
                    Maths and English with 10+ sessions each.
                  </p>
                </div>
              )}

              <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Package summary
                </p>
                <div className="space-y-1.5">
                  <SummaryLine label="Subject" value={subject || "—"} />
                  <SummaryLine label="Tier" value={tier || "—"} />
                  <SummaryLine label="Sessions" value={String(sessions)} />
                  <SummaryLine label="Start date" value={formatDate(startDate)} />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
                  Enrolment
                </p>
                <div className="space-y-1.5">
                  <SummaryLine label="Student" value={`${studentName} · ${studentId}`} />
                  <SummaryLine label="Year / Department" value={`${yearGroup} · ${department}`} />
                  <SummaryLine label="Subject" value={subject} />
                  <SummaryLine label="Frequency" value={`${frequency}× per week`} />
                  <SummaryLine label="Tier" value={tier} />
                  <SummaryLine
                    label="Preferred days"
                    value={days.length ? days.join(", ") : "—"}
                  />
                  <SummaryLine label="Preferred time" value={timeBand ?? "—"} />
                  <SummaryLine label="Teacher" value={teacher || "No preference"} />
                  <SummaryLine label="Sessions" value={String(sessions)} />
                  <SummaryLine label="Start date" value={formatDate(startDate)} />
                </div>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  An invoice will be generated after this enrolment is
                  confirmed. Go to the Invoices tab to issue it.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 px-6 py-3 border-t border-slate-200 bg-slate-50/50">
          <div>
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={handleContinue}
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
                style={{ backgroundColor: "#F59E0B" }}
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
                style={{ backgroundColor: "#F59E0B" }}
              >
                Confirm Enrolment
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Primitives ──────────────────────────────────────────────────────────────

function Label({
  children,
  required,
  htmlFor,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block mb-1.5">
      <span className="text-xs font-semibold text-slate-700">
        {children}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {hint && (
        <span className="ml-2 text-[11px] text-slate-400 font-normal">
          {hint}
        </span>
      )}
    </label>
  );
}

function Pill({
  children,
  selected,
  error,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  error?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
        selected
          ? "border-amber-500 bg-amber-50 text-amber-800"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
        error && !selected && "border-red-200 bg-red-50/40",
      )}
    >
      {children}
    </button>
  );
}

function StepCircles({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((n, i) => {
        const done = n < step;
        const current = n === step;
        return (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                done && "bg-amber-500 text-white",
                current &&
                  "bg-white text-amber-600 ring-2 ring-amber-500 ring-offset-2 ring-offset-white",
                !done &&
                  !current &&
                  "bg-slate-100 text-slate-400 border border-slate-200",
              )}
            >
              {done ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : n}
            </div>
            {i < 2 && (
              <div
                className={cn(
                  "h-0.5 flex-1 rounded transition-colors",
                  done ? "bg-amber-500" : "bg-slate-200",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SummaryLine({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="text-slate-800 font-medium text-right break-words min-w-0">
        {value || <span className="text-slate-400">—</span>}
      </span>
    </div>
  );
}
