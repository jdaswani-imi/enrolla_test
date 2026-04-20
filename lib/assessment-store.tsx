"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AssessmentStatus = "Booked" | "Done";

export interface AssessmentRecord {
  id: string;
  studentName: string;
  subject: string;
  yearGroup: string;
  department: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  endTime: string; // HH:MM
  room: string;
  teachers: string[];
  notes?: string;
  status: AssessmentStatus;
  leadId?: string;
}

interface AssessmentContextValue {
  assessments: AssessmentRecord[];
  addAssessment: (
    input: Omit<AssessmentRecord, "id" | "status" | "endTime"> & { endTime?: string },
  ) => AssessmentRecord;
  markDone: (id: string) => void;
  cancel: (id: string) => void;
}

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}

let _seq = 0;
function nextId(): string {
  _seq += 1;
  return `AS-${Date.now().toString(36)}-${_seq}`;
}

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [assessments, setAssessments] = useState<AssessmentRecord[]>([]);

  const addAssessment = useCallback<AssessmentContextValue["addAssessment"]>((input) => {
    const endTime = input.endTime ?? addMinutes(input.time, 15);
    const rec: AssessmentRecord = {
      ...input,
      endTime,
      id: nextId(),
      status: "Booked",
    };
    setAssessments((prev) => [...prev, rec]);
    return rec;
  }, []);

  const markDone = useCallback<AssessmentContextValue["markDone"]>((id) => {
    setAssessments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "Done" } : a)),
    );
  }, []);

  const cancel = useCallback<AssessmentContextValue["cancel"]>((id) => {
    setAssessments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const value = useMemo<AssessmentContextValue>(
    () => ({ assessments, addAssessment, markDone, cancel }),
    [assessments, addAssessment, markDone, cancel],
  );

  return <AssessmentContext.Provider value={value}>{children}</AssessmentContext.Provider>;
}

export function useAssessments(): AssessmentContextValue {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error("useAssessments must be used inside AssessmentProvider");
  return ctx;
}

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function isoToDayKey(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "Mon";
  const date = new Date(Date.UTC(y, m - 1, d));
  return DAY_KEYS[date.getUTCDay()];
}

export function isoToDateLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]}`;
}
