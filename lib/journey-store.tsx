"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { LeadStage } from "@/lib/mock-data";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssessmentStatus = "Booked" | "Done";
export type TrialStatus = "Booked" | "Done" | "Skipped";
export type JourneyStudentStatus = "Pending" | "Active";
export type JourneyEnrolmentStatus = "Pending" | "Active";
export type JourneyInvoiceStatus = "Draft" | "Issued" | "Paid";

export interface JourneyAssessment {
  status: AssessmentStatus;
  subject: string;
  yearGroup: string;
  teacher: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  room: string;
  notes?: string;
  recommendation?: string;
  observedLevel?: string;
  targetGrade?: string;
  outcomeNotes?: string;
}

export interface JourneyTrial {
  status: TrialStatus;
  subject: string;
  yearGroup: string;
  teacher: string;
  date: string;
  time: string;
  room: string;
  fee: number;
  vat: number;
  total: number;
  outcome?: string;
  notes?: string;
  paid?: boolean;
}

export interface JourneyStudent {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  yearGroup: string;
  department: string;
  guardianName: string;
  guardianPhone: string;
  school: string;
  status: JourneyStudentStatus;
  createdOn: string;
}

export interface JourneyEnrolment {
  subject: string;
  term: string;
  sessionsPerWeek: number;
  teacher: string;
  preferredDays: string[];
  preferredTime: string;
  ratePerSession: number;
  sessionsThisTerm: number;
  subtotal: number;
  enrolmentFee: number;
  vat: number;
  total: number;
  status: JourneyEnrolmentStatus;
}

export interface JourneyInvoice {
  id: string;
  amount: number;
  amountPaid: number;
  status: JourneyInvoiceStatus;
  paymentMethod?: string;
  paymentReference?: string;
  paymentDate?: string;
}

// ─── Schedule / Invoice Builder / Payment (Stages 1–4) ────────────────────────

export interface ScheduleRow {
  id: string;
  subject: string;
  days: string[];
  time: string;
  teacher: string;
  sessionsPerWeek: number;
}

export interface ScheduleData {
  rows: ScheduleRow[];
  sentVia?: string;
  proposedOn?: string;
  confirmedVia?: string;
  confirmedOn?: string;
  confirmationNotes?: string;
}

export interface InvoiceLine {
  subject: string;
  term: string;
  sessions: number;
  rate: number;
  subtotal: number;
  isEnrolmentFee?: boolean;
}

export interface InvoiceBuilderData {
  invoiceNumber: string;
  lines: InvoiceLine[];
  tuitionSubtotal: number;
  enrolmentFee: number;
  discountAmount: number;
  discountReason?: string;
  postDiscountSubtotal: number;
  vat: number;
  total: number;
  dueDate: string;
  notes?: string;
  revenueTag: string;
  paymentPlan?: {
    firstAmount: number;
    secondAmount: number;
    secondDueDate: string;
  };
  status: "Draft" | "Issued";
}

export interface PaymentData {
  amount: number;
  method: string;
  reference?: string;
  date: string;
  notes?: string;
  totalDue: number;
  remainingBalance: number;
  status: "Paid" | "Part";
}

export interface ActivityEntry {
  label: string;
  text: string;
  dot: string;
}

export type BilalStage =
  | LeadStage
  | "Student Created"
  | "Enrolment Pending"
  | "Student Active";

interface JourneyState {
  bilalStage: BilalStage;
  leadStage: LeadStage;
  assessment: JourneyAssessment | null;
  trial: JourneyTrial | null;
  student: JourneyStudent | null;
  enrolment: JourneyEnrolment | null;
  invoice: JourneyInvoice | null;
  activity: ActivityEntry[];
  scheduleByLead: Record<string, ScheduleData>;
  invoiceByLead: Record<string, InvoiceBuilderData>;
  paymentByLead: Record<string, PaymentData>;
}

interface JourneyContextValue extends JourneyState {
  pushActivity: (entry: ActivityEntry) => void;
  bookAssessment: (input: Omit<JourneyAssessment, "status">) => void;
  logAssessmentOutcome: (input: {
    recommendation: string;
    observedLevel: string;
    targetGrade: string;
    notes?: string;
  }) => void;
  revertAssessmentOutcome: () => void;
  bookTrial: (input: Omit<JourneyTrial, "status" | "fee" | "vat" | "total" | "yearGroup"> & {
    yearGroup: string;
  }) => void;
  logTrialOutcome: (input: { outcome: string; notes?: string; paid: boolean }) => void;
  skipTrial: () => void;
  convertToStudent: (input: {
    firstName: string;
    lastName: string;
    yearGroup: string;
    guardianName: string;
    guardianPhone: string;
    school: string;
  }) => JourneyStudent;
  createEnrolment: (input: {
    subject: string;
    term: string;
    sessionsPerWeek: number;
    teacher: string;
    preferredDays: string[];
    preferredTime: string;
    ratePerSession: number;
    sessionsThisTerm: number;
    subtotal: number;
    enrolmentFee: number;
    vat: number;
    total: number;
  }) => void;
  recordPayment: (input: {
    amount: number;
    method: string;
    reference?: string;
    date: string;
  }) => void;
  setInvoiceIssued: (invoiceId: string, amount: number) => void;
  setStage: (stage: LeadStage, actor?: string) => void;
  markScheduleOffered: () => void;
  markScheduleConfirmed: () => void;
  sendInvoice: () => void;
  markPaid: () => void;
  clearPayment: (leadId: string) => void;
  undoConvertToStudent: (previousStage: LeadStage) => void;
  setSchedule: (leadId: string, data: ScheduleData, summary?: string) => void;
  confirmSchedule: (leadId: string, patch: { confirmedVia: string; confirmedOn: string; notes?: string }) => void;
  setInvoice: (leadId: string, data: InvoiceBuilderData) => void;
  setPayment: (leadId: string, data: PaymentData) => void;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

// The lead detail view seeds its own "Lead created via website form" entry,
// so the journey activity starts empty to avoid duplicates.
const INITIAL_ACTIVITY: ActivityEntry[] = [];

const TRIAL_RATE_BY_DEPT: Record<string, number> = {
  Primary: 250,
  "Lower Secondary": 300,
  Senior: 350,
};

export function trialRateFor(department: string): number {
  return TRIAL_RATE_BY_DEPT[department] ?? 300;
}

export function enrolmentRateFor(yearGroup: string): number {
  if (yearGroup.startsWith("KG")) return 150;
  const n = Number(yearGroup.replace("Y", ""));
  if (n <= 6) return 160;
  if (n <= 9) return 170;
  return 190;
}

// Per-session rate by department and total weekly sessions across all subjects.
// Tier thresholds: 1 session/wk → Entry, 2 → Mid, 3+ → Frequent.
export function sessionRateFor(department: string, totalSessionsPerWeek: number): number {
  const tiers: Record<string, [number, number, number]> = {
    Primary: [160, 140, 130],
    "Lower Secondary": [200, 180, 160],
    Senior: [230, 210, 190],
  };
  const t = tiers[department] ?? tiers["Lower Secondary"];
  if (totalSessionsPerWeek <= 1) return t[0];
  if (totalSessionsPerWeek === 2) return t[1];
  return t[2];
}

export const TERM_WEEKS = 12;
export const ENROLMENT_FEE = 300;
export const VAT_RATE = 0.05;
export const MIN_SESSIONS_PER_SUBJECT = 10;

// ─── Context ──────────────────────────────────────────────────────────────────

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [bilalStage, setBilalStage] = useState<BilalStage>("New");
  const [leadStage, setLeadStage] = useState<LeadStage>("New");
  const [assessment, setAssessment] = useState<JourneyAssessment | null>(null);
  const [trial, setTrial] = useState<JourneyTrial | null>(null);
  const [student, setStudent] = useState<JourneyStudent | null>(null);
  const [enrolment, setEnrolment] = useState<JourneyEnrolment | null>(null);
  const [invoice, setInvoice] = useState<JourneyInvoice | null>(null);
  const [activity, setActivity] = useState<ActivityEntry[]>(INITIAL_ACTIVITY);
  const [scheduleByLead, setScheduleByLead] = useState<Record<string, ScheduleData>>({});
  const [invoiceByLead, setInvoiceByLead] = useState<Record<string, InvoiceBuilderData>>({});
  const [paymentByLead, setPaymentByLead] = useState<Record<string, PaymentData>>({});

  const addActivity = useCallback((entry: ActivityEntry) => {
    setActivity((prev) => [entry, ...prev]);
  }, []);

  const bookAssessment = useCallback<JourneyContextValue["bookAssessment"]>((input) => {
    setAssessment({ status: "Booked", ...input });
    setLeadStage("Assessment Booked");
    setBilalStage("Assessment Booked");
    addActivity({
      label: "Just now",
      text: `Assessment booked — ${input.yearGroup} ${input.subject}, ${formatDate(input.date)} ${input.time}, ${input.teacher}`,
      dot: "bg-purple-400",
    });
  }, [addActivity]);

  const logAssessmentOutcome = useCallback<JourneyContextValue["logAssessmentOutcome"]>((input) => {
    setAssessment((prev) =>
      prev
        ? {
            ...prev,
            status: "Done",
            recommendation: input.recommendation,
            observedLevel: input.observedLevel,
            targetGrade: input.targetGrade,
            outcomeNotes: input.notes,
          }
        : prev,
    );
    setLeadStage("Assessment Done");
    setBilalStage("Assessment Done");
    addActivity({
      label: "Just now",
      text: `Assessment outcome logged — ${input.recommendation} · Target: ${input.targetGrade}`,
      dot: "bg-indigo-400",
    });
  }, [addActivity]);

  const revertAssessmentOutcome = useCallback<JourneyContextValue["revertAssessmentOutcome"]>(() => {
    setAssessment((prev) =>
      prev
        ? {
            ...prev,
            status: "Booked",
            recommendation: undefined,
            observedLevel: undefined,
            targetGrade: undefined,
            outcomeNotes: undefined,
          }
        : prev,
    );
    setLeadStage("Assessment Booked");
    setBilalStage("Assessment Booked");
    addActivity({
      label: "Just now",
      text: "Assessment outcome undone",
      dot: "bg-slate-400",
    });
  }, [addActivity]);

  const bookTrial = useCallback<JourneyContextValue["bookTrial"]>((input) => {
    const department = departmentFor(input.yearGroup);
    const fee = trialRateFor(department);
    const vat = Math.round(fee * 0.05 * 100) / 100;
    const total = fee + vat;
    setTrial({ status: "Booked", ...input, fee, vat, total });
    setLeadStage("Trial Booked");
    setBilalStage("Trial Booked");
    addActivity({
      label: "Just now",
      text: `Trial booked — ${input.yearGroup} ${input.subject}, ${formatDate(input.date)}, AED ${total.toFixed(0)} invoice pending`,
      dot: "bg-amber-400",
    });
  }, [addActivity]);

  const logTrialOutcome = useCallback<JourneyContextValue["logTrialOutcome"]>((input) => {
    setTrial((prev) =>
      prev
        ? { ...prev, status: "Done", outcome: input.outcome, notes: input.notes, paid: input.paid }
        : prev,
    );
    setLeadStage("Trial Done");
    setBilalStage("Trial Done");
    addActivity({
      label: "Just now",
      text: `Trial outcome — ${input.outcome}${input.paid ? " · trial invoice paid" : ""}`,
      dot: "bg-emerald-400",
    });
  }, [addActivity]);

  const skipTrial = useCallback<JourneyContextValue["skipTrial"]>(() => {
    setTrial({
      status: "Skipped",
      subject: "",
      yearGroup: "",
      teacher: "",
      date: "",
      time: "",
      room: "",
      fee: 0,
      vat: 0,
      total: 0,
    });
    addActivity({
      label: "Just now",
      text: "Trial skipped — proceeding directly to enrolment",
      dot: "bg-slate-400",
    });
  }, [addActivity]);

  const convertToStudent = useCallback<JourneyContextValue["convertToStudent"]>((input) => {
    const department = departmentFor(input.yearGroup);
    const created: JourneyStudent = {
      id: "IMI-0099",
      name: `${input.firstName} ${input.lastName}`.trim(),
      firstName: input.firstName,
      lastName: input.lastName,
      yearGroup: input.yearGroup,
      department,
      guardianName: input.guardianName,
      guardianPhone: input.guardianPhone,
      school: input.school,
      status: "Pending",
      createdOn: new Date().toISOString().slice(0, 10),
    };
    setStudent(created);
    setLeadStage("Won");
    setBilalStage("Student Created");
    addActivity({
      label: "Just now",
      text: `Converted to student — IMI-0099`,
      dot: "bg-emerald-500",
    });
    return created;
  }, [addActivity]);

  const createEnrolment = useCallback<JourneyContextValue["createEnrolment"]>((input) => {
    setEnrolment({
      ...input,
      status: "Pending",
    });
    setBilalStage("Enrolment Pending");
    addActivity({
      label: "Just now",
      text: `Enrolment created — ${input.subject}, ${input.term}, ${input.sessionsThisTerm} sessions`,
      dot: "bg-blue-500",
    });
  }, [addActivity]);

  const setInvoiceIssued = useCallback((invoiceId: string, amount: number) => {
    setInvoice({ id: invoiceId, amount, amountPaid: 0, status: "Issued" });
    addActivity({
      label: "Just now",
      text: `Invoice ${invoiceId} issued — AED ${amount.toFixed(0)}`,
      dot: "bg-teal-500",
    });
  }, [addActivity]);

  const setStage = useCallback<JourneyContextValue["setStage"]>((stage, actor = "Jason Daswani") => {
    setLeadStage(stage);
    setBilalStage(stage);
    addActivity({
      label: "Just now",
      text: `Stage changed to ${stage} by ${actor}`,
      dot: "bg-slate-400",
    });
  }, [addActivity]);

  const markScheduleOffered = useCallback<JourneyContextValue["markScheduleOffered"]>(() => {
    setLeadStage("Schedule Offered");
    setBilalStage("Schedule Offered");
    addActivity({
      label: "Just now",
      text: "Schedule offered — awaiting guardian confirmation",
      dot: "bg-orange-400",
    });
  }, [addActivity]);

  const markScheduleConfirmed = useCallback<JourneyContextValue["markScheduleConfirmed"]>(() => {
    setLeadStage("Schedule Confirmed");
    setBilalStage("Schedule Confirmed");
    addActivity({
      label: "Just now",
      text: "Schedule confirmed by guardian",
      dot: "bg-cyan-500",
    });
  }, [addActivity]);

  const sendInvoice = useCallback<JourneyContextValue["sendInvoice"]>(() => {
    setInvoice((prev) =>
      prev ?? { id: "INV-0099", amount: 0, amountPaid: 0, status: "Issued" },
    );
    setLeadStage("Invoice Sent");
    setBilalStage("Invoice Sent");
    addActivity({
      label: "Just now",
      text: "Invoice sent to guardian",
      dot: "bg-teal-500",
    });
  }, [addActivity]);

  const markPaid = useCallback<JourneyContextValue["markPaid"]>(() => {
    setInvoice((prev) =>
      prev
        ? { ...prev, status: "Paid", amountPaid: prev.amount }
        : { id: "INV-0099", amount: 0, amountPaid: 0, status: "Paid" },
    );
    setLeadStage("Won");
    setBilalStage("Won");
    addActivity({
      label: "Just now",
      text: "Payment received — invoice marked paid",
      dot: "bg-lime-500",
    });
  }, [addActivity]);

  const recordPayment = useCallback<JourneyContextValue["recordPayment"]>((input) => {
    setInvoice((prev) =>
      prev
        ? {
            ...prev,
            amountPaid: input.amount,
            status: "Paid",
            paymentMethod: input.method,
            paymentReference: input.reference,
            paymentDate: input.date,
          }
        : prev,
    );
    setEnrolment((prev) => (prev ? { ...prev, status: "Active" } : prev));
    setStudent((prev) => (prev ? { ...prev, status: "Active" } : prev));
    setBilalStage("Student Active");
    addActivity({
      label: "Just now",
      text: `Payment recorded — AED ${input.amount.toFixed(0)} via ${input.method} · enrolment activated`,
      dot: "bg-emerald-600",
    });
  }, [addActivity]);

  const clearPayment = useCallback<JourneyContextValue["clearPayment"]>((leadId) => {
    setPaymentByLead((prev) => {
      if (!prev[leadId]) return prev;
      const next = { ...prev };
      delete next[leadId];
      return next;
    });
    if (leadId === BILAL_LEAD_ID) {
      setInvoice((prev) =>
        prev
          ? { ...prev, amountPaid: 0, status: "Issued", paymentMethod: undefined, paymentReference: undefined, paymentDate: undefined }
          : prev,
      );
    }
  }, []);

  const undoConvertToStudent = useCallback<JourneyContextValue["undoConvertToStudent"]>((previousStage) => {
    setStudent(null);
    setEnrolment(null);
    setLeadStage(previousStage);
    setBilalStage(previousStage as BilalStage);
    addActivity({
      label: "Just now",
      text: "Conversion undone — student record removed",
      dot: "bg-slate-400",
    });
  }, [addActivity]);

  const setSchedule = useCallback<JourneyContextValue["setSchedule"]>((leadId, data, summary) => {
    setScheduleByLead((prev) => ({ ...prev, [leadId]: data }));
    if (leadId === BILAL_LEAD_ID) {
      addActivity({
        label: "Just now",
        text: summary ?? "Schedule proposed — awaiting guardian confirmation",
        dot: "bg-orange-400",
      });
    }
  }, [addActivity]);

  const confirmSchedule = useCallback<JourneyContextValue["confirmSchedule"]>((leadId, patch) => {
    setScheduleByLead((prev) => {
      const existing = prev[leadId];
      if (!existing) return prev;
      return {
        ...prev,
        [leadId]: {
          ...existing,
          confirmedVia: patch.confirmedVia,
          confirmedOn: patch.confirmedOn,
          confirmationNotes: patch.notes,
        },
      };
    });
    if (leadId === BILAL_LEAD_ID) {
      addActivity({
        label: "Just now",
        text: `Schedule confirmed by parent via ${patch.confirmedVia}`,
        dot: "bg-cyan-500",
      });
    }
  }, [addActivity]);

  const setInvoiceBuilder = useCallback<JourneyContextValue["setInvoice"]>((leadId, data) => {
    setInvoiceByLead((prev) => ({ ...prev, [leadId]: data }));
    if (leadId === BILAL_LEAD_ID) {
      setInvoice({ id: data.invoiceNumber, amount: data.total, amountPaid: 0, status: data.status === "Draft" ? "Draft" : "Issued" });
      addActivity({
        label: "Just now",
        text: `Invoice ${data.invoiceNumber} issued — AED ${data.total.toFixed(0)} due ${formatDate(data.dueDate)}`,
        dot: "bg-teal-500",
      });
    }
  }, [addActivity]);

  const setPaymentDetail = useCallback<JourneyContextValue["setPayment"]>((leadId, data) => {
    setPaymentByLead((prev) => ({ ...prev, [leadId]: data }));
    if (leadId === BILAL_LEAD_ID) {
      setInvoice((prev) =>
        prev
          ? {
              ...prev,
              amountPaid: data.amount,
              status: data.status === "Paid" ? "Paid" : "Issued",
              paymentMethod: data.method,
              paymentReference: data.reference,
              paymentDate: data.date,
            }
          : prev,
      );
      addActivity({
        label: "Just now",
        text: `Payment recorded — AED ${data.amount.toFixed(0)} via ${data.method}${data.reference ? ` · Ref: ${data.reference}` : ""}`,
        dot: "bg-lime-500",
      });
    }
  }, [addActivity]);

  const value = useMemo<JourneyContextValue>(
    () => ({
      bilalStage,
      leadStage,
      assessment,
      trial,
      student,
      enrolment,
      invoice,
      activity,
      scheduleByLead,
      invoiceByLead,
      paymentByLead,
      pushActivity: addActivity,
      bookAssessment,
      logAssessmentOutcome,
      revertAssessmentOutcome,
      bookTrial,
      logTrialOutcome,
      skipTrial,
      convertToStudent,
      createEnrolment,
      setInvoiceIssued,
      setStage,
      recordPayment,
      markScheduleOffered,
      markScheduleConfirmed,
      sendInvoice,
      markPaid,
      clearPayment,
      undoConvertToStudent,
      setSchedule,
      confirmSchedule,
      setInvoice: setInvoiceBuilder,
      setPayment: setPaymentDetail,
    }),
    [
      bilalStage,
      leadStage,
      assessment,
      trial,
      student,
      enrolment,
      invoice,
      activity,
      scheduleByLead,
      invoiceByLead,
      paymentByLead,
      addActivity,
      bookAssessment,
      logAssessmentOutcome,
      revertAssessmentOutcome,
      bookTrial,
      logTrialOutcome,
      skipTrial,
      convertToStudent,
      createEnrolment,
      setInvoiceIssued,
      setStage,
      recordPayment,
      markScheduleOffered,
      markScheduleConfirmed,
      sendInvoice,
      markPaid,
      clearPayment,
      undoConvertToStudent,
      setSchedule,
      confirmSchedule,
      setInvoiceBuilder,
      setPaymentDetail,
    ],
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney(): JourneyContextValue {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used inside JourneyProvider");
  return ctx;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function departmentFor(yearGroup: string): string {
  if (yearGroup.startsWith("KG")) return "Primary";
  const n = Number(yearGroup.replace("Y", ""));
  if (n <= 6) return "Primary";
  if (n <= 9) return "Lower Secondary";
  return "Senior";
}

export function nextSaturdayIso(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun ... 6=Sat
  const daysUntilSat = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSat);
  return d.toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, dd] = iso.split("-").map(Number);
  if (!y || !m || !dd) return iso;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${dd} ${months[m - 1]} ${y}`;
}

export const BILAL_LEAD_ID = "L-0041";
export const BILAL_STUDENT_ID = "IMI-0099";
