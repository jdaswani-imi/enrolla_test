"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useJourney, departmentFor, BILAL_STUDENT_ID } from "@/lib/journey-store";
import type { Lead } from "@/lib/mock-data";
import { FIELD, FieldLabel, FormActions, SummaryRow } from "./dialog-parts";

const ENROLMENT_FEE = 300;

export function ConvertToStudentDialog({
  open,
  onOpenChange,
  lead,
  onOpenCreateEnrolment,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: Lead | null;
  onOpenCreateEnrolment?: () => void;
}) {
  const router = useRouter();
  const { assessment, trial, convertToStudent, student } = useJourney();

  const [firstName, setFirstName] = useState("Bilal");
  const [lastName, setLastName] = useState("Mahmood");
  const [yearGroup, setYearGroup] = useState("Y7");
  const [guardianName, setGuardianName] = useState("Fatima Mahmood");
  const [guardianPhone, setGuardianPhone] = useState("+971 50 111 2222");
  const [school, setSchool] = useState("");
  const [created, setCreated] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fallbackName = lead?.childName ?? "Bilal Mahmood";
    const parts = fallbackName.split(/\s+/);
    setFirstName(parts[0] ?? "Bilal");
    setLastName(parts.slice(1).join(" ") || "Mahmood");
    setYearGroup(lead?.yearGroup ?? "Y7");
    setGuardianName("Fatima Mahmood");
    setGuardianPhone(lead?.guardianPhone ?? "+971 50 111 2222");
    setSchool("");
    setCreated(false);
  }, [open, lead]);

  const department = departmentFor(yearGroup);
  const canSubmit = Boolean(firstName && lastName && yearGroup && guardianName && guardianPhone);

  function submit() {
    if (!canSubmit) return;
    convertToStudent({ firstName, lastName, yearGroup, guardianName, guardianPhone, school });
    setCreated(true);
    toast.success(`Student record created — ${BILAL_STUDENT_ID}`);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[640px] max-w-[95vw]">
        <DialogHeader>
          <DialogTitle>{created ? "Student created" : "Convert lead to student"}</DialogTitle>
          <DialogDescription>
            {created
              ? `${student?.name ?? `${firstName} ${lastName}`} has been added to the student directory.`
              : "Review the details carried over from the lead, then create the student record."}
          </DialogDescription>
        </DialogHeader>

        {created ? (
          <>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-emerald-900">Student record created</p>
                  <p className="text-emerald-700">
                    {firstName} {lastName} · {BILAL_STUDENT_ID} · {yearGroup} · {department}
                  </p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                Next, create an enrolment to start scheduling sessions and generate the first invoice.
              </p>
            </div>
            <DialogFooter className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/students/${BILAL_STUDENT_ID}`);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                View Student Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onOpenCreateEnrolment?.();
                }}
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 cursor-pointer"
              >
                Create Enrolment
              </button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="cs-first" required>First name</FieldLabel>
                  <input id="cs-first" className={FIELD} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="cs-last" required>Last name</FieldLabel>
                  <input id="cs-last" className={FIELD} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="cs-yg" required>Year group</FieldLabel>
                  <input id="cs-yg" className={FIELD} value={yearGroup} onChange={(e) => setYearGroup(e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="cs-dept">Department</FieldLabel>
                  <input id="cs-dept" className={FIELD} value={department} readOnly />
                </div>
                <div>
                  <FieldLabel htmlFor="cs-gn" required>Guardian name</FieldLabel>
                  <input id="cs-gn" className={FIELD} value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="cs-gp" required>Guardian phone</FieldLabel>
                  <input id="cs-gp" className={FIELD} value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <FieldLabel htmlFor="cs-school">School</FieldLabel>
                  <input id="cs-school" className={FIELD} value={school} onChange={(e) => setSchool(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Carried over from lead</p>
                {assessment && (
                  <SummaryRow
                    label="Assessment"
                    value={
                      <span className="text-right">
                        {assessment.status === "Done" && assessment.recommendation
                          ? `${assessment.recommendation} · Target ${assessment.targetGrade}`
                          : `Booked — ${assessment.date}`}
                      </span>
                    }
                  />
                )}
                {trial && (
                  <SummaryRow
                    label="Trial"
                    value={trial.status === "Done" && trial.outcome ? trial.outcome : `Booked — ${trial.date}`}
                  />
                )}
                <div className="border-t border-slate-200 pt-2">
                  <SummaryRow label="Enrolment fee (first invoice)" value={`AED ${ENROLMENT_FEE}`} />
                </div>
              </div>
            </div>

            <FormActions
              onCancel={() => onOpenChange(false)}
              onSubmit={submit}
              submitLabel="Create Student Record"
              submitDisabled={!canSubmit}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
