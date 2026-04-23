"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { departmentFor } from "@/lib/journey-store";
import type { Lead } from "@/lib/mock-data";
import { FIELD, FieldLabel, FormActions } from "./dialog-parts";

export interface ConvertFormData {
  firstName: string;
  lastName: string;
  yearGroup: string;
  guardianName: string;
  guardianPhone: string;
  school: string;
  dob: string;
  medicalNotes: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

export function ConvertToStudentDialog({
  open,
  onOpenChange,
  lead,
  onConverted,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  lead: Lead | null;
  onConverted?: (data: ConvertFormData) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");

  // Step 2 fields
  const [dob, setDob] = useState("");
  const [school, setSchool] = useState("");
  const [medicalNotes, setMedicalNotes] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [consent1, setConsent1] = useState(false);
  const [consent2, setConsent2] = useState(false);

  useEffect(() => {
    if (!open) return;
    const parts = (lead?.childName ?? "").trim().split(/\s+/);
    setFirstName(parts[0] ?? "");
    setLastName(parts.slice(1).join(" "));
    setYearGroup(lead?.yearGroup ?? "");
    setGuardianName(lead?.guardian ?? "");
    setGuardianPhone(lead?.guardianPhone ?? "");
    setDob("");
    setSchool("");
    setMedicalNotes("");
    setEmergencyContactName("");
    setEmergencyContactPhone("");
    setConsent1(false);
    setConsent2(false);
    setStep(1);
  }, [open, lead]);

  const department = departmentFor(yearGroup);

  const step1Valid = Boolean(firstName && lastName && yearGroup && guardianName && guardianPhone);
  const step2Valid = Boolean(dob && school && emergencyContactName && emergencyContactPhone && consent1 && consent2);

  function handleConfirm() {
    if (!step2Valid) return;
    onConverted?.({
      firstName,
      lastName,
      yearGroup,
      guardianName,
      guardianPhone,
      school,
      dob,
      medicalNotes,
      emergencyContactName,
      emergencyContactPhone,
    });
    onOpenChange(false);
  }

  const STEP_LABELS = ["Confirm Details", "Enrolment Info", "Confirm & Create"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[640px] max-w-[95vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Convert to Student — Step {step} of 3</DialogTitle>
          <DialogDescription>{STEP_LABELS[step - 1]}</DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="px-6 pt-2 flex items-center gap-2">
          {([1, 2, 3] as const).map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  s < step
                    ? "bg-emerald-500 text-white"
                    : s === step
                    ? "bg-amber-500 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
              </div>
              <span className={`text-xs font-medium ${s === step ? "text-slate-800" : "text-slate-400"}`}>
                {STEP_LABELS[s - 1]}
              </span>
              {s < 3 && <div className="flex-1 h-px bg-slate-200 mx-1" />}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* ── Step 1: Confirm Details ── */}
          {step === 1 && (
            <div className="px-6 py-5 space-y-4">
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
              </div>
              {lead?.subjects && lead.subjects.length > 0 && (
                <div>
                  <FieldLabel>Subject(s) of interest</FieldLabel>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {lead.subjects.map((s) => (
                      <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded font-medium border border-blue-100">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <FormActions
                onCancel={() => onOpenChange(false)}
                onSubmit={() => setStep(2)}
                submitLabel="Continue →"
                submitDisabled={!step1Valid}
              />
            </div>
          )}

          {/* ── Step 2: Enrolment Info ── */}
          {step === 2 && (
            <div className="px-6 py-5 space-y-4">
              <p className="text-xs text-slate-500">
                Fill in on the parent's behalf for this prototype. In production, parents complete this via a secure link.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="cs-dob" required>Date of birth</FieldLabel>
                  <input id="cs-dob" type="date" className={FIELD} value={dob} onChange={(e) => setDob(e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="cs-school" required>Current school</FieldLabel>
                  <input id="cs-school" className={FIELD} value={school} onChange={(e) => setSchool(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <FieldLabel htmlFor="cs-medical">Medical / allergy notes</FieldLabel>
                  <textarea
                    id="cs-medical"
                    className={`${FIELD} resize-none`}
                    rows={2}
                    value={medicalNotes}
                    onChange={(e) => setMedicalNotes(e.target.value)}
                    placeholder="Optional — e.g. nut allergy, asthma"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="cs-ecname" required>Emergency contact name</FieldLabel>
                  <input id="cs-ecname" className={FIELD} value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
                </div>
                <div>
                  <FieldLabel htmlFor="cs-ecphone" required>Emergency contact phone</FieldLabel>
                  <input id="cs-ecphone" className={FIELD} value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} placeholder="+971 50 000 0000" />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Parental Consent</p>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consent1}
                    onChange={(e) => setConsent1(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 leading-snug group-hover:text-slate-900">
                    I agree to the terms and conditions of enrolment at IMI.
                    <span className="text-red-500 ml-0.5">*</span>
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={consent2}
                    onChange={(e) => setConsent2(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                  <span className="text-sm text-slate-700 leading-snug group-hover:text-slate-900">
                    I consent to my child's data being stored and processed in accordance with IMI's privacy policy.
                    <span className="text-red-500 ml-0.5">*</span>
                  </span>
                </label>
                {(!consent1 || !consent2) && (
                  <p className="text-xs text-slate-400">Both consents are required to proceed.</p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!step2Valid}
                    onClick={() => setStep(3)}
                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                      step2Valid
                        ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm"
                        : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    }`}
                  >
                    Review →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Confirm & Create ── */}
          {step === 3 && (
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-slate-400 text-xs">Name</span><p className="font-medium text-slate-800">{firstName} {lastName}</p></div>
                  <div><span className="text-slate-400 text-xs">Year Group</span><p className="font-medium text-slate-800">{yearGroup} · {department}</p></div>
                  <div><span className="text-slate-400 text-xs">Date of Birth</span><p className="font-medium text-slate-800">{dob}</p></div>
                  <div><span className="text-slate-400 text-xs">School</span><p className="font-medium text-slate-800">{school}</p></div>
                  {medicalNotes && (
                    <div className="col-span-2"><span className="text-slate-400 text-xs">Medical Notes</span><p className="font-medium text-slate-800">{medicalNotes}</p></div>
                  )}
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Guardian & Emergency Contact</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div><span className="text-slate-400 text-xs">Guardian</span><p className="font-medium text-slate-800">{guardianName}</p></div>
                    <div><span className="text-slate-400 text-xs">Guardian Phone</span><p className="font-medium text-slate-800">{guardianPhone}</p></div>
                    <div><span className="text-slate-400 text-xs">Emergency Contact</span><p className="font-medium text-slate-800">{emergencyContactName}</p></div>
                    <div><span className="text-slate-400 text-xs">Emergency Phone</span><p className="font-medium text-slate-800">{emergencyContactPhone}</p></div>
                  </div>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Consent</p>
                  <div className="flex items-center gap-2 text-xs text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Both consents confirmed
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="px-4 py-2 text-sm font-semibold rounded-lg bg-amber-500 text-white hover:bg-amber-600 cursor-pointer shadow-sm transition-colors"
                  >
                    Create Student Record
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
