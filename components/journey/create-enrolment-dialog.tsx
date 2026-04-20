"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useJourney, enrolmentRateFor, BILAL_STUDENT_ID } from "@/lib/journey-store";
import { staffMembers } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { FIELD, FieldLabel, FormActions, SummaryRow } from "./dialog-parts";

const Y7_SUBJECTS = [
  "Y7 Maths",
  "Y7 English",
  "Y7 Science",
  "Y7 Biology",
  "Y7 Chemistry",
  "Y7 Physics",
];

const TERMS = ["Term 3 2025–26", "Term 1 2026–27"];
const SESSIONS_PER_WEEK_OPTIONS = [1, 2, 3, 4];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const ENROLMENT_FEE = 300;
const TERM_WEEKS = 12;

const TEACHERS = staffMembers.filter((s) => s.role === "Teacher" || s.role === "HOD");

export function CreateEnrolmentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const { student, enrolment, createEnrolment } = useJourney();

  const [subject, setSubject] = useState("Y7 Maths");
  const [term, setTerm] = useState(TERMS[0]);
  const [sessionsPerWeek, setSessionsPerWeek] = useState(1);
  const [teacher, setTeacher] = useState("Ahmed Khalil");
  const [preferredDays, setPreferredDays] = useState<string[]>(["Sat"]);
  const [preferredTime, setPreferredTime] = useState("10:00");

  useEffect(() => {
    if (open) {
      setSubject("Y7 Maths");
      setTerm(TERMS[0]);
      setSessionsPerWeek(1);
      setTeacher("Ahmed Khalil");
      setPreferredDays(["Sat"]);
      setPreferredTime("10:00");
    }
  }, [open]);

  const yearGroup = student?.yearGroup ?? "Y7";
  const isFirstEnrolment = !enrolment;

  const pricing = useMemo(() => {
    const ratePerSession = enrolmentRateFor(yearGroup);
    const sessionsThisTerm = TERM_WEEKS * sessionsPerWeek;
    const subtotal = ratePerSession * sessionsThisTerm;
    const enrolmentFee = isFirstEnrolment ? ENROLMENT_FEE : 0;
    const vatBase = subtotal + enrolmentFee;
    const vat = Math.round(vatBase * 0.05 * 100) / 100;
    const total = vatBase + vat;
    return { ratePerSession, sessionsThisTerm, subtotal, enrolmentFee, vat, total };
  }, [yearGroup, sessionsPerWeek, isFirstEnrolment]);

  const canSubmit = Boolean(subject && term && teacher && preferredDays.length > 0 && preferredTime);

  function toggleDay(d: string) {
    setPreferredDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function submit() {
    if (!canSubmit) return;
    createEnrolment({
      subject,
      term,
      sessionsPerWeek,
      teacher,
      preferredDays,
      preferredTime,
      ...pricing,
    });
    toast.success("Enrolment created — proceeding to invoice");
    onOpenChange(false);
    router.push(`/finance/invoice/new?student=${BILAL_STUDENT_ID}&source=journey`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[640px] max-w-[95vw] max-h-[92vh]">
        <DialogHeader>
          <DialogTitle>Create Enrolment</DialogTitle>
          <DialogDescription>
            {student ? `Enrolling ${student.name} (${student.id}).` : "Configure subject, teacher, and schedule."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="ce-subject" required>Subject</FieldLabel>
              <select id="ce-subject" className={FIELD} value={subject} onChange={(e) => setSubject(e.target.value)}>
                {Y7_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="ce-term" required>Term</FieldLabel>
              <select id="ce-term" className={FIELD} value={term} onChange={(e) => setTerm(e.target.value)}>
                {TERMS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="ce-freq" required>Sessions per week</FieldLabel>
              <select
                id="ce-freq"
                className={FIELD}
                value={sessionsPerWeek}
                onChange={(e) => setSessionsPerWeek(Number(e.target.value))}
              >
                {SESSIONS_PER_WEEK_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n === 4 ? "4+" : n}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel htmlFor="ce-teacher" required>Teacher</FieldLabel>
              <select id="ce-teacher" className={FIELD} value={teacher} onChange={(e) => setTeacher(e.target.value)}>
                {TEACHERS.map((t) => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Preferred days</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const active = preferredDays.includes(d);
                return (
                  <button
                    type="button"
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-sm font-medium cursor-pointer transition-colors",
                      active
                        ? "bg-amber-100 border-amber-400 text-amber-800"
                        : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="ce-time">Preferred time</FieldLabel>
            <input id="ce-time" type="time" className={FIELD} value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Pricing preview</p>
            <SummaryRow label="Rate per session" value={`AED ${pricing.ratePerSession}`} />
            <SummaryRow label={`Sessions this term (${sessionsPerWeek}/wk × ${TERM_WEEKS} wks)`} value={pricing.sessionsThisTerm} />
            <SummaryRow label="Subtotal" value={`AED ${pricing.subtotal.toLocaleString()}`} />
            {isFirstEnrolment && <SummaryRow label="Enrolment fee (first only)" value={`AED ${pricing.enrolmentFee}`} />}
            <SummaryRow label="VAT (5%)" value={`AED ${pricing.vat.toFixed(2)}`} />
            <div className="border-t border-slate-200 pt-1.5">
              <SummaryRow label="Total" value={`AED ${pricing.total.toLocaleString()}`} strong />
            </div>
          </div>
        </div>

        <FormActions
          onCancel={() => onOpenChange(false)}
          onSubmit={submit}
          submitLabel="Proceed to Invoice"
          submitDisabled={!canSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
