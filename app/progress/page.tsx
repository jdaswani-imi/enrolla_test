"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreHorizontal,
  X,
  Eye,
  FileText,
  User,
  Download,
  CheckCircle,
  Sparkles,
  ArrowUpCircle,
  AlertTriangle,
  Calendar,
  ExternalLink,
} from "lucide-react";
import {
  timetableSessions,
  assignments as seedAssignments,
  tasks,
  type Assignment,
  type AssignmentStatus,
  type AssignmentType,
  type Task,
} from "@/lib/mock-data";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { DateRangePicker, DATE_PRESETS, type DateRange } from "@/components/ui/date-range-picker";
import { SortableHeader } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { RoleBanner } from "@/components/ui/role-banner";
import { AccessDenied } from "@/components/ui/access-denied";
import { ExportDialog } from "@/components/ui/export-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { FIELD, FieldLabel } from "@/components/journey/dialog-parts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier = "Pass" | "Requires Support" | "Not Submitted";
type ReportStatus = "Approved" | "Pending HOD" | "Draft" | "Not Generated" | "Revision Requested" | "Rejected" | "Delivered";
type Severity = "Critical" | "High" | "Medium" | "Low";
type AlertStatus = "Open" | "Escalated to Concern" | "Acknowledged" | "Resolved" | "Dismissed";
type AlertLevel = "L1" | "L2" | "L3";
interface Tracker {
  student: string;
  year: string;
  subject: string;
  topicsCovered: string;
  avgScore: number;
  predictedGrade: string;
  targetGrade: string;
  tier: Tier;
  reportStatus: ReportStatus;
}

interface Report {
  student: string;
  subject: string;
  teacher: string;
  draftReady: string;
  status: ReportStatus;
}

interface Alert {
  student: string;
  year: string;
  subject: string;
  alertType: string;
  signal: string;
  raised: string;
  severity: Severity;
  status: AlertStatus;
  level: AlertLevel;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const TRACKERS: Tracker[] = [
  { student: "Aisha Rahman",       year: "Y8",  subject: "Y8 Maths",     topicsCovered: "8 / 12",  avgScore: 82, predictedGrade: "B+", targetGrade: "A*", tier: "Pass",             reportStatus: "Draft"         },
  { student: "Aisha Rahman",       year: "Y8",  subject: "Y8 English",   topicsCovered: "9 / 10",  avgScore: 78, predictedGrade: "A-", targetGrade: "A",  tier: "Pass",             reportStatus: "Approved"      },
  { student: "Omar Al-Farsi",      year: "Y5",  subject: "Y5 Maths",     topicsCovered: "5 / 12",  avgScore: 61, predictedGrade: "C+", targetGrade: "B",  tier: "Requires Support", reportStatus: "Not Generated" },
  { student: "Layla Hassan",       year: "Y10", subject: "Y10 Physics",  topicsCovered: "7 / 14",  avgScore: 74, predictedGrade: "B",  targetGrade: "A",  tier: "Pass",             reportStatus: "Pending HOD"   },
  { student: "Layla Hassan",       year: "Y10", subject: "Y10 Maths",    topicsCovered: "9 / 14",  avgScore: 88, predictedGrade: "A",  targetGrade: "A*", tier: "Pass",             reportStatus: "Draft"         },
  { student: "Khalid Mansoor",     year: "Y12", subject: "Y12 Maths",    topicsCovered: "11 / 18", avgScore: 91, predictedGrade: "A*", targetGrade: "A*", tier: "Pass",             reportStatus: "Approved"      },
  { student: "Sara Nasser",        year: "Y9",  subject: "Y9 Maths",     topicsCovered: "6 / 12",  avgScore: 55, predictedGrade: "D",  targetGrade: "B+", tier: "Requires Support", reportStatus: "Not Generated" },
  { student: "Faris Qasim",        year: "Y11", subject: "Y11 Physics",  topicsCovered: "8 / 14",  avgScore: 70, predictedGrade: "B-", targetGrade: "A",  tier: "Pass",             reportStatus: "Draft"         },
  { student: "Hamdan Al-Maktoum",  year: "Y7",  subject: "Y7 Maths",     topicsCovered: "7 / 10",  avgScore: 83, predictedGrade: "B+", targetGrade: "B",  tier: "Pass",             reportStatus: "Approved"      },
  { student: "Mariam Al-Suwaidi",  year: "Y13", subject: "Y13 Maths",    topicsCovered: "14 / 18", avgScore: 79, predictedGrade: "B",  targetGrade: "A",  tier: "Pass",             reportStatus: "Pending HOD"   },
  { student: "Nour Ibrahim",       year: "Y4",  subject: "Y4 Maths",     topicsCovered: "3 / 10",  avgScore: 48, predictedGrade: "E",  targetGrade: "C",  tier: "Requires Support", reportStatus: "Not Generated" },
  { student: "Ziad Khalil",        year: "Y3",  subject: "Y3 English",   topicsCovered: "6 / 8",   avgScore: 86, predictedGrade: "A",  targetGrade: "A",  tier: "Pass",             reportStatus: "Approved"      },
];

const REPORTS: Report[] = [
  { student: "Aisha Rahman",       subject: "Y8 Maths",    teacher: "Mr Ahmed Khalil",   draftReady: "15 Apr 2026", status: "Draft"       },
  { student: "Layla Hassan",       subject: "Y10 Physics", teacher: "Mr Faris Al-Amin",  draftReady: "14 Apr 2026", status: "Pending HOD" },
  { student: "Layla Hassan",       subject: "Y10 Maths",   teacher: "Mr Faris Al-Amin",  draftReady: "14 Apr 2026", status: "Draft"       },
  { student: "Faris Qasim",        subject: "Y11 Physics", teacher: "Mr Faris Al-Amin",  draftReady: "13 Apr 2026", status: "Draft"       },
  { student: "Mariam Al-Suwaidi",  subject: "Y13 Maths",   teacher: "Mr Faris Al-Amin",  draftReady: "12 Apr 2026", status: "Pending HOD" },
  { student: "Hamdan Al-Maktoum",  subject: "Y7 Maths",    teacher: "Mr Tariq Al-Amin",  draftReady: "10 Apr 2026", status: "Approved"    },
  { student: "Khalid Mansoor",     subject: "Y12 Maths",   teacher: "Mr Faris Al-Amin",  draftReady: "8 Apr 2026",  status: "Approved"    },
  { student: "Aisha Rahman",       subject: "Y8 English",  teacher: "Ms Sarah Mitchell", draftReady: "8 Apr 2026",  status: "Approved"    },
  { student: "Hamdan Al-Maktoum",  subject: "Y7 English",  teacher: "Ms Sarah Mitchell", draftReady: "7 Apr 2026",  status: "Approved"    },
  { student: "Ziad Khalil",        subject: "Y3 English",  teacher: "Ms Sarah Mitchell", draftReady: "5 Apr 2026",  status: "Approved"    },
];

const ALERTS: Alert[] = [
  { student: "Nour Ibrahim",      year: "Y4",  subject: "Y4 Maths",    alertType: "Below Pass Threshold",      signal: "3 consecutive Requires Support",          raised: "14 Apr 2026", severity: "Critical", status: "Open",                 level: "L1" },
  { student: "Sara Nasser",       year: "Y9",  subject: "Y9 Maths",    alertType: "Below Pass Threshold",      signal: "Avg score 55% — below 80% threshold",     raised: "12 Apr 2026", severity: "Critical", status: "Open",                 level: "L1" },
  { student: "Omar Al-Farsi",     year: "Y5",  subject: "Y5 Maths",    alertType: "Predicted Grade Gap",       signal: "Predicted C+, target B — gap widening",   raised: "10 Apr 2026", severity: "High",     status: "Open",                 level: "L1" },
  { student: "Aisha Rahman",      year: "Y8",  subject: "Y8 Maths",    alertType: "Assignment Non-submission", signal: "30%+ non-submission rate this term",       raised: "8 Apr 2026",  severity: "Medium",   status: "Escalated to Concern", level: "L2" },
  { student: "Faris Qasim",       year: "Y11", subject: "Y11 Physics", alertType: "Predicted Grade Gap",       signal: "Predicted B-, target A — 2 grade gap",    raised: "6 Apr 2026",  severity: "Medium",   status: "Open",                 level: "L1" },
  { student: "Mariam Al-Suwaidi", year: "Y13", subject: "Y13 Maths",   alertType: "Predicted Grade Gap",       signal: "Predicted B, target A — monitored",        raised: "4 Apr 2026",  severity: "Low",      status: "Acknowledged",         level: "L1" },
  { student: "Reem Al-Dosari",    year: "Y6",  subject: "Y6 Science",  alertType: "Attendance Impact",         signal: "Attendance below 80% affecting progress",  raised: "2 Apr 2026",  severity: "Medium",   status: "Open",                 level: "L1" },
  { student: "Dana Al-Zaabi",     year: "Y2",  subject: "Y2 English",  alertType: "Topic Gap",                 signal: "2 topics not yet assessed this term",       raised: "1 Apr 2026",  severity: "Low",      status: "Resolved",             level: "L1" },
];

type TopicStatus = "Not Started" | "In Progress" | "Complete";

interface TrackerTopic {
  topic: string;
  status: TopicStatus;
  lastUpdated: string;
  notes: string;
}

const MOCK_TOPICS: TrackerTopic[] = [
  { topic: "Algebra",      status: "Complete",    lastUpdated: "14 Apr 2026", notes: "Strong grasp of linear equations"               },
  { topic: "Quadratics",   status: "Complete",    lastUpdated: "10 Apr 2026", notes: "Completing the square — practice paper issued"  },
  { topic: "Geometry",     status: "Complete",    lastUpdated: "07 Apr 2026", notes: "Excellent spatial reasoning"                    },
  { topic: "Statistics",   status: "In Progress", lastUpdated: "02 Apr 2026", notes: "Struggling with probability trees"              },
  { topic: "Calculus",     status: "In Progress", lastUpdated: "28 Mar 2026", notes: "Introduction only — needs reinforcement"        },
  { topic: "Trigonometry", status: "Not Started", lastUpdated: "—",           notes: "Scheduled for next half-term"                   },
];

function getTopicStatusClass(s: TopicStatus): string {
  switch (s) {
    case "Complete":    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "In Progress": return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Not Started": return "bg-slate-100 text-slate-500 border border-slate-200";
  }
}

function getTeacherForSubject(subject: string): string {
  if (subject.includes("English")) return "Ms Sarah Mitchell";
  if (subject.includes("Physics")) return "Mr Faris Al-Amin";
  const yearMatch = subject.match(/Y(\d+)/);
  const yearNum = yearMatch ? parseInt(yearMatch[1]) : 0;
  if (yearNum >= 10) return "Mr Faris Al-Amin";
  if (yearNum === 8) return "Mr Ahmed Khalil";
  return "Mr Tariq Al-Amin";
}

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h);
}

function getAttendanceSnapshot(tracker: Tracker) {
  const seed = hashSeed(tracker.student + tracker.subject);
  const booked = 24;
  const attended = Math.max(
    0,
    Math.min(booked, Math.round(booked * (0.78 + (tracker.avgScore / 100) * 0.2)) - (seed % 2))
  );
  const absences = booked - attended;
  const makeups  = seed % 3;
  return { booked, attended, absences, makeups };
}

function getCurrentGrade(avgScore: number): string {
  if (avgScore >= 90) return "A*";
  if (avgScore >= 85) return "A";
  if (avgScore >= 80) return "A-";
  if (avgScore >= 75) return "B+";
  if (avgScore >= 70) return "B";
  if (avgScore >= 65) return "B-";
  if (avgScore >= 60) return "C+";
  if (avgScore >= 55) return "C";
  if (avgScore >= 50) return "C-";
  if (avgScore >= 45) return "D";
  if (avgScore >= 40) return "E";
  return "F";
}

const CURRENT_TERM = "Spring Term 2026";

// ─── Grade ordering ───────────────────────────────────────────────────────────

const GRADE_ORDER = ["A*", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "E", "F", "U"];

function gradeCompare(predicted: string, target: string): "above" | "equal" | "below" {
  const p = GRADE_ORDER.indexOf(predicted);
  const t = GRADE_ORDER.indexOf(target);
  if (p === -1 || t === -1) return "equal";
  if (p < t)  return "above";  // lower index = better grade
  if (p === t) return "equal";
  return "below";
}

// ─── Avatar helpers ───────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "bg-amber-100",   text: "text-amber-700"   },
  { bg: "bg-teal-100",    text: "text-teal-700"     },
  { bg: "bg-blue-100",    text: "text-blue-700"     },
  { bg: "bg-violet-100",  text: "text-violet-700"   },
  { bg: "bg-rose-100",    text: "text-rose-700"     },
  { bg: "bg-emerald-100", text: "text-emerald-700"  },
];

function getAvatarPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

function getTierClass(tier: Tier): string {
  switch (tier) {
    case "Pass":             return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Requires Support": return "bg-red-100 text-red-700 border border-red-200";
    case "Not Submitted":    return "bg-slate-100 text-slate-500 border border-slate-200";
  }
}

function getReportStatusClass(status: ReportStatus): string {
  switch (status) {
    case "Approved":           return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Pending HOD":        return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Draft":              return "bg-blue-100 text-blue-700 border border-blue-200";
    case "Not Generated":      return "bg-slate-100 text-slate-500 border border-slate-200";
    case "Revision Requested": return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Rejected":           return "bg-red-100 text-red-700 border border-red-200";
    case "Delivered":          return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }
}

function getSeverityClass(s: Severity): string {
  switch (s) {
    case "Critical": return "bg-red-700 text-white";
    case "High":     return "bg-red-500 text-white";
    case "Medium":   return "bg-amber-100 text-amber-800 border border-amber-200";
    case "Low":      return "bg-slate-100 text-slate-500 border border-slate-200";
  }
}

function getAlertStatusClass(s: AlertStatus): string {
  switch (s) {
    case "Open":                 return "bg-red-100 text-red-700 border border-red-200";
    case "Escalated to Concern": return "bg-white text-red-600 border border-red-400";
    case "Acknowledged":         return "bg-slate-100 text-slate-600 border border-slate-200";
    case "Resolved":             return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Dismissed":            return "bg-slate-100 text-slate-500 border border-slate-200";
  }
}

function getAlertLevelClass(l: AlertLevel): string {
  switch (l) {
    case "L1": return "bg-slate-100 text-slate-600 border border-slate-200";
    case "L2": return "bg-red-100 text-red-700 border border-red-200";
    case "L3": return "bg-red-600 text-white border border-red-700";
  }
}

function getAssignmentStatusClass(s: AssignmentStatus): string {
  switch (s) {
    case "Complete":  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Partial":   return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Pending":   return "bg-blue-100 text-blue-700 border border-blue-200";
    case "Upcoming":  return "bg-slate-100 text-slate-500 border border-slate-200";
    case "Overdue":   return "bg-red-100 text-red-700 border border-red-200";
  }
}

function getAssignmentTypeClass(t: AssignmentType): string {
  switch (t) {
    case "Test":       return "bg-red-100 text-red-700 border border-red-200";
    case "Homework":   return "bg-blue-100 text-blue-700 border border-blue-200";
    case "Classwork":  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Past Paper": return "bg-purple-100 text-purple-700 border border-purple-200";
  }
}

// ─── Shared components ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  accent?: "amber" | "red" | "none";
}

function StatCard({ label, value, accent = "none" }: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 px-5 py-4 flex flex-col gap-1",
        accent === "amber" && "border-l-4 border-l-amber-400",
        accent === "red"   && "border-l-4 border-l-red-400"
      )}
    >
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-slate-800">{value}</span>
    </div>
  );
}

interface ActionMenuItem {
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
}

function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
        aria-label="Row actions"
      >
        <MoreHorizontal className="w-4 h-4 text-slate-500" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 min-w-[180px] py-1">
            {items.map((item, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-slate-50 transition-colors cursor-pointer",
                  item.danger ? "text-red-600" : "text-slate-700"
                )}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function AvatarCell({ name }: { name: string }) {
  const palette  = getAvatarPalette(name);
  const initials = getInitials(name);
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0", palette.bg, palette.text)}>
        {initials}
      </div>
      <span className="font-medium text-slate-800 whitespace-nowrap">{name}</span>
    </div>
  );
}

function PredictedGradeCell({ predicted, target }: { predicted: string; target: string }) {
  const rel = gradeCompare(predicted, target);
  const cls =
    rel === "above" ? "text-amber-600" :
    rel === "equal" ? "text-emerald-600" :
    "text-red-600";

  return (
    <span className={cn("font-bold text-sm", cls)}>
      {predicted}
      {rel === "above" && <span className="ml-0.5 text-xs">↑</span>}
    </span>
  );
}

function AvgScoreCell({ score }: { score: number }) {
  const barColor =
    score >= 80 ? "bg-emerald-500" :
    score >= 60 ? "bg-amber-400"   :
    "bg-red-400";

  return (
    <div className="min-w-[56px]">
      <span className="text-sm font-medium text-slate-700">{score}%</span>
      <div className="mt-1 h-1 rounded-full bg-slate-100 overflow-hidden w-16">
        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

// ─── View Tracker Dialog ──────────────────────────────────────────────────────

function TrackerViewDialog({ tracker, onClose }: { tracker: Tracker; onClose: () => void }) {
  const palette  = getAvatarPalette(tracker.student);
  const initials = getInitials(tracker.student);
  const teacher  = getTeacherForSubject(tracker.subject);
  const { booked, attended, absences, makeups } = getAttendanceSnapshot(tracker);
  const completionPct = booked === 0 ? 0 : Math.round((attended / booked) * 100);
  const currentGrade  = getCurrentGrade(tracker.avgScore);

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[85vh]">
        {/* Header */}
        <DialogHeader className="flex-row items-start gap-3">
          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0", palette.bg, palette.text)}>
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-base font-semibold text-slate-800">{tracker.student}</DialogTitle>
            <p className="text-sm text-slate-500 mt-0.5">
              {tracker.subject} · {teacher} · {CURRENT_TERM}
            </p>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">
          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Overall completion</span>
              <span className="text-sm font-semibold text-slate-800">{completionPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-amber-400" style={{ width: `${completionPct}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">{attended} of {booked} sessions attended</p>
          </div>

          {/* Topics table */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Topics</h3>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Topic", "Status", "Last updated", "Notes"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TOPICS.map((t) => (
                    <tr key={t.topic} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">{t.topic}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap", getTopicStatusClass(t.status))}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{t.lastUpdated}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{t.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grades */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Grades</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Target</p>
                <p className="text-2xl font-bold text-slate-700">{tracker.targetGrade}</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Current</p>
                <p className="text-2xl font-bold text-slate-700">{currentGrade}</p>
              </div>
              <div className="bg-white rounded-lg border border-slate-200 border-l-4 border-l-amber-400 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Predicted</p>
                <p className="text-2xl font-bold text-amber-600">{tracker.predictedGrade}</p>
              </div>
            </div>
          </div>

          {/* Attendance snapshot */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Attendance snapshot</h3>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg border border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Booked</p>
                <p className="text-lg font-semibold text-slate-700">{booked}</p>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Attended</p>
                <p className="text-lg font-semibold text-emerald-600">{attended}</p>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Absences</p>
                <p className={cn("text-lg font-semibold", absences > 0 ? "text-red-600" : "text-slate-700")}>{absences}</p>
              </div>
              <div className="bg-slate-50 rounded-lg border border-slate-100 px-4 py-3">
                <p className="text-xs text-slate-500 mb-1">Makeups</p>
                <p className="text-lg font-semibold text-slate-700">{makeups}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tab 1 — Trackers ─────────────────────────────────────────────────────────

function TrackersTab() {
  const [dept,    setDept]    = useState<string[]>([]);
  const [subject, setSubject] = useState<string[]>([]);
  const [year,    setYear]    = useState<string[]>([]);
  const [tier,    setTier]    = useState<string[]>([]);
  const [search,  setSearch]  = useState("");
  const [selected, setSelected] = useState<Tracker | null>(null);

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("asc");
  function toggleSort(field: string) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  }
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => { setPage(1); }, [dept, subject, year, tier, search]);

  const filtered = useMemo(() => {
    let data = TRACKERS.filter((t) => {
      if (dept.length > 0) {
        const yNum = parseInt(t.year.replace("Y", ""));
        if (dept.includes("Primary")         && !(yNum >= 1  && yNum <= 6))  return false;
        if (dept.includes("Lower Secondary") && !(yNum >= 7  && yNum <= 9))  return false;
        if (dept.includes("Senior")          && !(yNum >= 10 && yNum <= 13)) return false;
        // If dept filter is set but no dept matches this student, exclude
        const inPrimary  = yNum >= 1  && yNum <= 6;
        const inLower    = yNum >= 7  && yNum <= 9;
        const inSenior   = yNum >= 10 && yNum <= 13;
        const allowed = dept.some(d =>
          (d === "Primary" && inPrimary) ||
          (d === "Lower Secondary" && inLower) ||
          (d === "Senior" && inSenior)
        );
        if (!allowed) return false;
      }
      if (year.length > 0    && !year.includes(t.year))     return false;
      if (tier.length > 0    && !tier.includes(t.tier))     return false;
      if (subject.length > 0) {
        const subjectMatch = subject.some(s => t.subject.toLowerCase().includes(s.toLowerCase()));
        if (!subjectMatch) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        if (!t.student.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    if (sortField) {
      data = [...data].sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sortField];
        const bv = (b as unknown as Record<string, unknown>)[sortField];
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return data;
  }, [dept, subject, year, tier, search, sortField, sortDir]);

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Trackers"        value="3,847" />
        <StatCard label="Below Pass Threshold"   value="94"    accent="red"   />
        <StatCard label="Reports Due This Cycle" value="47"    />
        <StatCard label="Pending Approval"       value="12"    accent="amber" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <MultiSelectFilter label="Department" options={["Primary", "Lower Secondary", "Senior"]} selected={dept} onChange={setDept} />
        <MultiSelectFilter label="Subject" options={["Maths", "English", "Physics", "Science"]} selected={subject} onChange={setSubject} />
        <MultiSelectFilter label="Year Group" options={["Y1","Y2","Y3","Y4","Y5","Y6","Y7","Y8","Y9","Y10","Y11","Y12","Y13"]} selected={year} onChange={setYear} />
        <MultiSelectFilter label="Eval Tier" options={["Pass", "Requires Support", "Not Submitted"]} selected={tier} onChange={setTier} />
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <SortableHeader label="Student"        field="student"        sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Year"           field="year"           sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Subject"        field="subject"        sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Topics Covered</th>
                <SortableHeader label="Avg Score"      field="avgScore"       sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Predicted"      field="predictedGrade" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Target"         field="targetGrade"    sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Tier"           field="tier"           sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Report"         field="reportStatus"   sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((t, i) => (
                <tr
                  key={i}
                  onClick={() => setSelected(t)}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3"><AvatarCell name={t.student} /></td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">{t.year}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{t.subject}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{t.topicsCovered}</td>
                  <td className="px-4 py-3"><AvgScoreCell score={t.avgScore} /></td>
                  <td className="px-4 py-3"><PredictedGradeCell predicted={t.predictedGrade} target={t.targetGrade} /></td>
                  <td className="px-4 py-3 text-slate-500 font-medium text-sm">{t.targetGrade}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap", getTierClass(t.tier))}>{t.tier}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap", getReportStatusClass(t.reportStatus))}>{t.reportStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelected(t); }}
                        className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        View Tracker
                      </button>
                      <ActionMenu items={[
                        { label: "Generate Report", icon: <FileText className="w-3.5 h-3.5" /> },
                        { label: "View Student",    icon: <User      className="w-3.5 h-3.5" /> },
                      ]} />
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">No trackers match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationBar
          total={filtered.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      </div>

      {selected && <TrackerViewDialog tracker={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Tab 2 — Reports ──────────────────────────────────────────────────────────

type ReportAction = "approve" | "revision" | "reject";

function ReportsTab() {
  const { can } = usePermission();
  const [reports, setReports] = useState<Report[]>(REPORTS);
  const [action, setAction] = useState<{ kind: ReportAction; index: number } | null>(null);
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState(false);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  const [deliverIndex, setDeliverIndex] = useState<number | null>(null);

  function openReview(index: number) {
    setReviewIndex(index);
    toast("Opening report editor…");
  }

  function confirmDeliver() {
    if (deliverIndex === null) return;
    updateStatus(deliverIndex, "Delivered");
    toast.success("Report marked as delivered");
    setDeliverIndex(null);
  }

  const reviewReport = reviewIndex !== null ? reports[reviewIndex] : null;
  const deliverReport = deliverIndex !== null ? reports[deliverIndex] : null;

  function openAction(kind: ReportAction, index: number) {
    setAction({ kind, index });
    setNotes("");
    setNotesError(false);
  }

  function closeAction() {
    setAction(null);
    setNotes("");
    setNotesError(false);
  }

  function updateStatus(index: number, status: ReportStatus) {
    setReports((prev) => prev.map((r, i) => (i === index ? { ...r, status } : r)));
  }

  function confirmApprove() {
    if (!action) return;
    updateStatus(action.index, "Approved");
    toast.success("Report approved and sent to guardian");
    closeAction();
  }

  function confirmRevision() {
    if (!action) return;
    if (!notes.trim()) { setNotesError(true); return; }
    updateStatus(action.index, "Revision Requested");
    toast.success("Revision requested — teacher has been notified");
    closeAction();
  }

  function confirmReject() {
    if (!action) return;
    if (!notes.trim()) { setNotesError(true); return; }
    updateStatus(action.index, "Rejected");
    toast.success("Report rejected");
    closeAction();
  }

  const activeReport = action ? reports[action.index] : null;

  const [draftReadyRange, setDraftReadyRange] = useState<DateRange>({ from: null, to: null });
  const filteredReports = useMemo(() => reports.filter((r) => {
    if (!draftReadyRange.from && !draftReadyRange.to) return true;
    const d = new Date(r.draftReady);
    if (isNaN(d.getTime())) return true;
    if (draftReadyRange.from && d < draftReadyRange.from) return false;
    if (draftReadyRange.to) {
      const to = new Date(draftReadyRange.to); to.setHours(23, 59, 59, 999);
      if (d > to) return false;
    }
    return true;
  }), [reports, draftReadyRange]);

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Reports Generated This Term" value="142" />
        <StatCard label="Pending Approval"            value="12"  accent="amber" />
        <StatCard label="Delivered to Parents"        value="108" />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <DateRangePicker
          value={draftReadyRange}
          onChange={setDraftReadyRange}
          presets={DATE_PRESETS}
          placeholder="Draft ready"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Student", "Subject", "Teacher", "Draft Ready", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((r) => { const i = reports.indexOf(r); return (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3"><AvatarCell name={r.student} /></td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{r.subject}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.teacher}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{r.draftReady}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap", getReportStatusClass(r.status))}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {r.status === "Draft" && (
                        <>
                          <button
                            onClick={() => openReview(i)}
                            className="px-3 py-1 text-xs font-medium bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Review &amp; Edit
                          </button>
                          <button
                            onClick={() => toast.success("AI narrative generated")}
                            className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                          >
                            <Sparkles className="w-3 h-3" />
                            Generate AI Narrative
                          </button>
                        </>
                      )}
                      {r.status === "Pending HOD" && can('progress.approveReport') && (
                        <>
                          <button
                            onClick={() => openAction("approve", i)}
                            className="px-3 py-1 text-xs font-medium bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => openAction("revision", i)}
                            className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Request Revision
                          </button>
                          <button
                            onClick={() => openAction("reject", i)}
                            className="px-3 py-1 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {r.status === "Approved" && (
                        <>
                          <button
                            onClick={() => toast.success("Downloading report PDF…")}
                            className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                          >
                            <Download className="w-3 h-3" />
                            Download PDF
                          </button>
                          <button
                            onClick={() => setDeliverIndex(i)}
                            className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Mark as Delivered
                          </button>
                        </>
                      )}
                      {r.status === "Delivered" && (
                        <button
                          onClick={() => toast.success("Downloading report PDF…")}
                          className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                        >
                          <Download className="w-3 h-3" />
                          Download PDF
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ); })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
        <AlertTriangle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-600 italic">
          AI narratives are draft-only. Teacher reviews and edits before HOD approves. No report is sent without explicit approval.
        </p>
      </div>

      {/* Approve confirmation */}
      <Dialog open={action?.kind === "approve"} onOpenChange={(o) => { if (!o) closeAction(); }}>
        <DialogContent className="w-[480px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Approve this report?</DialogTitle>
          </DialogHeader>
          {activeReport && (
            <div className="px-6 py-5 space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-slate-500 w-20 shrink-0">Student</span>
                <span className="font-medium text-slate-800">{activeReport.student}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-slate-500 w-20 shrink-0">Report</span>
                <span className="font-medium text-slate-800">{activeReport.subject}</span>
              </div>
              <p className="text-xs text-slate-500 pt-2">
                The approved report will be delivered to the student&apos;s guardian.
              </p>
            </div>
          )}
          <DialogFooter className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeAction}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmApprove}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              Approve report
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Revision */}
      <Dialog open={action?.kind === "revision"} onOpenChange={(o) => { if (!o) closeAction(); }}>
        <DialogContent className="w-[520px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Request Revision</DialogTitle>
          </DialogHeader>
          {activeReport && (
            <div className="px-6 py-5 space-y-3 text-sm">
              <p className="text-slate-500">
                <span className="font-medium text-slate-800">{activeReport.student}</span> — {activeReport.subject}
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Revision notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); if (notesError) setNotesError(false); }}
                  rows={5}
                  placeholder="Explain what the teacher should change before resubmitting…"
                  className={cn(
                    "w-full px-3 py-2 text-sm border rounded-lg bg-white outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-amber-300 resize-none",
                    notesError ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-amber-400"
                  )}
                />
                {notesError && <p className="mt-1 text-xs text-red-600">Revision notes are required.</p>}
              </div>
            </div>
          )}
          <DialogFooter className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeAction}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmRevision}
              className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition-colors cursor-pointer"
            >
              Send to teacher
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject */}
      <Dialog open={action?.kind === "reject"} onOpenChange={(o) => { if (!o) closeAction(); }}>
        <DialogContent className="w-[520px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle className="text-red-700">Reject Report</DialogTitle>
          </DialogHeader>
          {activeReport && (
            <div className="px-6 py-5 space-y-3 text-sm">
              <p className="text-slate-500">
                <span className="font-medium text-slate-800">{activeReport.student}</span> — {activeReport.subject}
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason for rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); if (notesError) setNotesError(false); }}
                  rows={5}
                  placeholder="Why is this report being rejected? This will be recorded on the report."
                  className={cn(
                    "w-full px-3 py-2 text-sm border rounded-lg bg-white outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-red-200 resize-none",
                    notesError ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-red-400"
                  )}
                />
                {notesError && <p className="mt-1 text-xs text-red-600">A reason is required to reject this report.</p>}
              </div>
            </div>
          )}
          <DialogFooter className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeAction}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmReject}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
            >
              Reject report
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review & Edit (placeholder editor) */}
      <Dialog open={reviewIndex !== null} onOpenChange={(o) => { if (!o) setReviewIndex(null); }}>
        <DialogContent className="w-[640px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Edit report</DialogTitle>
            {reviewReport && (
              <DialogDescription>
                {reviewReport.student} — {reviewReport.subject}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="px-6 py-5">
            <label className="block text-xs font-medium text-slate-700 mb-1">Report narrative</label>
            <textarea
              readOnly
              rows={10}
              value={`Term progress summary for ${reviewReport?.student ?? "the student"} in ${reviewReport?.subject ?? "this subject"}.\n\n${reviewReport?.student ?? "The student"} has demonstrated steady engagement across the term, with consistent attendance and active participation in class discussions. Assessment performance shows a positive trajectory, particularly on application-style questions.\n\nAreas for development: deepen revision of foundational topics ahead of the upcoming mock exam, and continue practising past-paper questions under timed conditions.\n\n— Placeholder draft. The full editor is not yet wired up in this prototype.`}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 outline-none resize-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
            />
            <p className="mt-2 text-xs text-slate-400 italic">Read-only placeholder — full inline editor coming soon.</p>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setReviewIndex(null)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              disabled
              className="rounded-lg bg-amber-300 px-3 py-1.5 text-sm font-semibold text-white shadow-sm opacity-60 cursor-not-allowed"
            >
              Edit
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Delivered confirmation */}
      <Dialog open={deliverIndex !== null} onOpenChange={(o) => { if (!o) setDeliverIndex(null); }}>
        <DialogContent className="w-[460px] max-w-[90vw]">
          <DialogHeader>
            <DialogTitle>Mark this report as delivered to the guardian?</DialogTitle>
          </DialogHeader>
          {deliverReport && (
            <div className="px-6 py-5 space-y-2 text-sm">
              <div className="flex gap-3">
                <span className="text-slate-500 w-20 shrink-0">Student</span>
                <span className="font-medium text-slate-800">{deliverReport.student}</span>
              </div>
              <div className="flex gap-3">
                <span className="text-slate-500 w-20 shrink-0">Report</span>
                <span className="font-medium text-slate-800">{deliverReport.subject}</span>
              </div>
            </div>
          )}
          <DialogFooter className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeliverIndex(null)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDeliver}
              className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors cursor-pointer"
            >
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Alert student ID lookup ──────────────────────────────────────────────────

const ALERT_STUDENT_IDS: Record<string, string> = {
  "Nour Ibrahim":      "IMI-0008",
  "Sara Nasser":       "IMI-0005",
  "Omar Al-Farsi":     "IMI-0002",
  "Aisha Rahman":      "IMI-0001",
  "Faris Qasim":       "IMI-0007",
  "Mariam Al-Suwaidi": "IMI-0014",
  "Reem Al-Dosari":    "IMI-0006",
  "Dana Al-Zaabi":     "IMI-0012",
};

// ─── Tab 3 — Academic Alerts ──────────────────────────────────────────────────

function nextLevel(l: AlertLevel): AlertLevel | null {
  if (l === "L1") return "L2";
  if (l === "L2") return "L3";
  return null;
}

function EscalateAlertDialog({
  alert,
  open,
  onOpenChange,
  onConfirm,
}: {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (notes: string) => void;
}) {
  const [notes, setNotes] = useState("");

  if (!alert) return null;
  const target = nextLevel(alert.level);
  const canSubmit = notes.trim().length > 0 && target !== null;

  function close() {
    setNotes("");
    onOpenChange(false);
  }

  function submit() {
    if (!canSubmit) return;
    onConfirm(notes.trim());
    close();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); else onOpenChange(true); }}>
      <DialogContent className="w-[520px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle>Escalate alert</DialogTitle>
          <DialogDescription>
            {alert.student} · {alert.subject} · {alert.alertType}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div>
            <FieldLabel>Escalation level</FieldLabel>
            {target ? (
              <div className="flex items-center gap-2">
                <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", getAlertLevelClass(alert.level))}>
                  {alert.level}
                </span>
                <ArrowUpCircle className="w-4 h-4 text-slate-400" />
                <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", getAlertLevelClass(target))}>
                  {target}
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Alert is already at the highest level (L3).</p>
            )}
          </div>

          <div>
            <FieldLabel htmlFor="esc-notes" required>Escalation notes</FieldLabel>
            <textarea
              id="esc-notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why is this being escalated? What intervention is needed?"
              className={FIELD}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cn(
              "rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer",
              canSubmit ? "hover:bg-amber-600" : "opacity-50 cursor-not-allowed"
            )}
          >
            {target ? `Escalate to ${target}` : "Escalate"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DismissAlertDialog({
  alert,
  open,
  onOpenChange,
  onConfirm,
}: {
  alert: Alert | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  if (!alert) return null;
  const canSubmit = reason.trim().length > 0;

  function close() {
    setReason("");
    onOpenChange(false);
  }

  function submit() {
    if (!canSubmit) return;
    onConfirm(reason.trim());
    close();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); else onOpenChange(true); }}>
      <DialogContent className="w-[480px] max-w-[92vw]">
        <DialogHeader>
          <DialogTitle className="text-red-700">Dismiss alert?</DialogTitle>
          <DialogDescription>
            Dismiss the {alert.alertType.toLowerCase()} alert for {alert.student}. This removes it from the active alerts list.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div>
            <FieldLabel htmlFor="dis-reason" required>Reason for dismissal</FieldLabel>
            <textarea
              id="dis-reason"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this alert being dismissed?"
              className={FIELD}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Keep alert
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className={cn(
              "rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer",
              canSubmit ? "hover:bg-red-700" : "opacity-50 cursor-not-allowed"
            )}
          >
            Dismiss alert
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AlertsTab({ onNavigateToTrackers }: { onNavigateToTrackers: () => void }) {
  const [alerts, setAlerts] = useState<Alert[]>(ALERTS);
  const [showDismissed, setShowDismissed] = useState(false);
  const [escalateTarget, setEscalateTarget] = useState<number | null>(null);
  const [dismissTarget, setDismissTarget] = useState<number | null>(null);
  const [trackerDialog, setTrackerDialog] = useState<Tracker | null>(null);

  function viewTracker(a: Alert) {
    const match = TRACKERS.find((t) => t.student === a.student && t.subject === a.subject);
    if (match) {
      setTrackerDialog(match);
    } else {
      onNavigateToTrackers();
      toast("Viewing trackers for this student");
    }
  }

  const visible = useMemo(() => {
    return alerts
      .map((a, i) => ({ a, i }))
      .filter(({ a }) => {
        if (a.status === "Dismissed") return showDismissed;
        return a.status !== "Acknowledged" && a.status !== "Resolved";
      });
  }, [alerts, showDismissed]);

  function acknowledge(index: number) {
    setAlerts((prev) => prev.map((a, i) => (i === index ? { ...a, status: "Acknowledged" } : a)));
    toast.success("Alert acknowledged");
  }

  function escalate(index: number, notes: string) {
    const current = alerts[index];
    const target = nextLevel(current.level);
    if (!target) return;
    setAlerts((prev) =>
      prev.map((a, i) =>
        i === index ? { ...a, level: target, status: "Escalated to Concern" } : a
      )
    );
    toast.success(`Alert escalated to ${target}`);
    // Notes are captured in the dialog but the prototype doesn't persist them beyond the toast.
    void notes;
  }

  function dismiss(index: number, reason: string) {
    setAlerts((prev) => prev.map((a, i) => (i === index ? { ...a, status: "Dismissed" } : a)));
    toast.success("Alert dismissed");
    void reason;
  }

  const escalateAlert = escalateTarget != null ? alerts[escalateTarget] : null;
  const dismissAlert  = dismissTarget  != null ? alerts[dismissTarget]  : null;

  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Alerts"       value="11" />
        <StatCard label="Critical"            value="2"  accent="red" />
        <StatCard label="Resolved This Week"  value="4"  />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-end">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showDismissed}
            onChange={(e) => setShowDismissed(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
          />
          Show dismissed
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Student", "Year", "Subject", "Alert Type", "Signal", "Raised", "Severity", "Level", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map(({ a, i }) => {
                const isDismissed   = a.status === "Dismissed";
                const isHandled     = isDismissed || a.status === "Acknowledged" || a.status === "Resolved";
                const canEscalate   = !isHandled && nextLevel(a.level) !== null;
                return (
                  <tr
                    key={i}
                    className={cn(
                      "border-b border-slate-100 last:border-0 transition-colors",
                      isDismissed
                        ? "bg-slate-50/60 text-slate-400 opacity-70 hover:bg-slate-50"
                        : "hover:bg-slate-50",
                      !isDismissed && a.severity === "Critical" && "bg-red-50/40"
                    )}
                  >
                    <td className={cn("px-4 py-3", isDismissed && "opacity-80")}>
                      <AvatarCell name={a.student} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">{a.year}</span>
                    </td>
                    <td className={cn("px-4 py-3 whitespace-nowrap", isDismissed ? "text-slate-400" : "text-slate-700")}>{a.subject}</td>
                    <td className={cn("px-4 py-3 text-xs font-medium whitespace-nowrap", isDismissed ? "text-slate-400" : "text-slate-600")}>{a.alertType}</td>
                    <td className={cn("px-4 py-3 text-xs max-w-[200px]", isDismissed ? "text-slate-400" : "text-slate-500")}>{a.signal}</td>
                    <td className={cn("px-4 py-3 text-xs whitespace-nowrap", isDismissed ? "text-slate-400" : "text-slate-500")}>{a.raised}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap", getSeverityClass(a.severity))}>{a.severity}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap", getAlertLevelClass(a.level))}>{a.level}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap", getAlertStatusClass(a.status))}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => viewTracker(a)}
                          className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          View Tracker
                        </button>
                        {ALERT_STUDENT_IDS[a.student] && (
                          <Link
                            href={`/students/${ALERT_STUDENT_IDS[a.student]}`}
                            className="px-3 py-1 text-xs font-medium border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer whitespace-nowrap"
                          >
                            View Student
                          </Link>
                        )}
                        {!isHandled && (
                          <>
                            <button
                              onClick={() => acknowledge(i)}
                              className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Acknowledge
                            </button>
                            {canEscalate && (
                              <button
                                onClick={() => setEscalateTarget(i)}
                                className="px-3 py-1 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                              >
                                <ArrowUpCircle className="w-3 h-3" />
                                Escalate
                              </button>
                            )}
                            <button
                              onClick={() => setDismissTarget(i)}
                              className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap"
                            >
                              <X className="w-3 h-3" />
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-400">
                    No active alerts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EscalateAlertDialog
        alert={escalateAlert}
        open={escalateTarget != null}
        onOpenChange={(o) => { if (!o) setEscalateTarget(null); }}
        onConfirm={(notes) => { if (escalateTarget != null) escalate(escalateTarget, notes); }}
      />
      <DismissAlertDialog
        alert={dismissAlert}
        open={dismissTarget != null}
        onOpenChange={(o) => { if (!o) setDismissTarget(null); }}
        onConfirm={(reason) => { if (dismissTarget != null) dismiss(dismissTarget, reason); }}
      />
      {trackerDialog && (
        <TrackerViewDialog tracker={trackerDialog} onClose={() => setTrackerDialog(null)} />
      )}
    </div>
  );
}

// ─── Tab 4 — Assignments (helpers) ───────────────────────────────────────────

function getStudentsForAssignment(a: Assignment): string[] {
  if (a.linkedSessionId) {
    const sess = timetableSessions.find((s) => s.id === a.linkedSessionId);
    if (sess?.students?.length) return sess.students;
  }
  const sess = timetableSessions.find(
    (s) => s.subject === a.subject && s.teacher === a.teacher
  );
  if (sess?.students?.length) return sess.students;
  return [];
}

function mockGradeForStudent(name: string): string {
  const seed = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return `${60 + (seed % 36)}%`;
}

function sessionDateToInput(sessionDate: string): string {
  const MM: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const [d, mon] = sessionDate.split(" ");
  return `2026-${MM[mon] ?? "04"}-${d.padStart(2, "0")}`;
}

function inputToDisplayDate(input: string): string {
  const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [y, m, d] = input.split("-");
  return `${parseInt(d)} ${MN[parseInt(m) - 1]} ${y}`;
}

function addDaysToDisplayDate(dateStr: string, days: number): string {
  const MM: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const parts = dateStr.split(" ");
  if (parts.length < 3) return dateStr;
  const result = new Date(parseInt(parts[2]), MM[parts[1]], parseInt(parts[0]) + days);
  return `${result.getDate()} ${MN[result.getMonth()]} ${result.getFullYear()}`;
}

// ─── Create Assignment Modal ──────────────────────────────────────────────────

function CreateAssignmentModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (a: Assignment) => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AssignmentType>("Homework");
  const [subject, setSubject] = useState("");
  const [linkedSessionId, setLinkedSessionId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [instructions, setInstructions] = useState("");
  const [assignTo, setAssignTo] = useState<"class" | "individual">("class");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const upcomingSessions = useMemo(
    () =>
      timetableSessions.filter(
        (s) =>
          s.status === "Scheduled" &&
          !["Meeting", "Blocked", "Assessment"].includes(s.type)
      ),
    []
  );

  const subjects = useMemo(
    () =>
      Array.from(
        new Set(
          timetableSessions
            .filter((s) => !["Meeting", "Blocked", "Assessment"].includes(s.type))
            .map((s) => s.subject)
        )
      ).sort(),
    []
  );

  function handleSessionChange(sid: string) {
    setLinkedSessionId(sid);
    if (!sid) return;
    const sess = timetableSessions.find((s) => s.id === sid);
    if (sess) {
      setSubject(sess.subject);
      setDueDate(sessionDateToInput(sess.date));
      setErrors((p) => ({ ...p, subject: "", dueDate: "" }));
    }
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Title is required";
    if (!subject) errs.subject = "Subject is required";
    if (!dueDate) errs.dueDate = "Due date is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const sess = linkedSessionId
      ? timetableSessions.find((s) => s.id === linkedSessionId)
      : null;
    const teacher = sess?.teacher ?? getTeacherForSubject(subject);
    const newAssignment: Assignment = {
      id: `AS-${Date.now()}`,
      assignment: title.trim(),
      subject,
      teacher,
      teacherId: sess?.teacherId,
      type,
      dueDate: inputToDisplayDate(dueDate),
      submissions: "0/0",
      marked: "0/0",
      status: "Upcoming",
      linkedSessionId: linkedSessionId || undefined,
      instructions: instructions.trim() || undefined,
      assignTo,
    };
    onSave(newAssignment);
  }

  function inputCls(field: string) {
    return cn(
      "w-full px-3 py-2 h-9 text-sm border rounded-lg bg-white outline-none transition-all",
      "placeholder:text-slate-400 focus:ring-2 focus:ring-amber-300 focus:border-amber-400",
      errors[field] ? "border-red-300" : "border-slate-200"
    );
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[540px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle>Create Assignment</DialogTitle>
          <DialogDescription>
            Set a new assignment and optionally link it to a timetable session.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <FieldLabel htmlFor="a-title" required>Title</FieldLabel>
            <input
              id="a-title"
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: "" })); }}
              placeholder="e.g. Algebra Practice Test"
              className={inputCls("title")}
            />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
          </div>

          {/* Type */}
          <div>
            <FieldLabel htmlFor="a-type">Type</FieldLabel>
            <select
              id="a-type"
              value={type}
              onChange={(e) => setType(e.target.value as AssignmentType)}
              className={inputCls("type")}
            >
              {(["Homework", "Classwork", "Test", "Past Paper"] as AssignmentType[]).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Linked Session */}
          <div>
            <FieldLabel htmlFor="a-session">
              Linked Session{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </FieldLabel>
            <select
              id="a-session"
              value={linkedSessionId}
              onChange={(e) => handleSessionChange(e.target.value)}
              className={inputCls("session")}
            >
              <option value="">No session linked</option>
              {upcomingSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.subject} · {s.day} {s.date} · {s.teacher}
                </option>
              ))}
            </select>
            {linkedSessionId && (
              <p className="mt-1 text-xs text-slate-500">
                Subject and due date auto-filled from the selected session.
              </p>
            )}
          </div>

          {/* Subject */}
          <div>
            <FieldLabel htmlFor="a-subject" required>Subject</FieldLabel>
            <select
              id="a-subject"
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setErrors((p) => ({ ...p, subject: "" })); }}
              className={inputCls("subject")}
            >
              <option value="">Select subject…</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
          </div>

          {/* Due Date */}
          <div>
            <FieldLabel htmlFor="a-due" required>Due Date</FieldLabel>
            <input
              id="a-due"
              type="date"
              value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); setErrors((p) => ({ ...p, dueDate: "" })); }}
              className={inputCls("dueDate")}
            />
            {errors.dueDate && <p className="mt-1 text-xs text-red-600">{errors.dueDate}</p>}
          </div>

          {/* Instructions */}
          <div>
            <FieldLabel htmlFor="a-instructions">
              Instructions{" "}
              <span className="font-normal text-slate-400">(optional)</span>
            </FieldLabel>
            <textarea
              id="a-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              placeholder="Any additional instructions for students…"
              className={FIELD}
            />
          </div>

          {/* Assign To */}
          <div>
            <FieldLabel htmlFor="a-assign-to">Assign To</FieldLabel>
            <select
              id="a-assign-to"
              value={assignTo}
              onChange={(e) => setAssignTo(e.target.value as "class" | "individual")}
              className={inputCls("assignTo")}
            >
              <option value="class">Whole Class</option>
              <option value="individual">Individual Students</option>
            </select>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-lg bg-amber-400 hover:bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer"
          >
            Create Assignment
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Assignment Slide-Over ────────────────────────────────────────────────────

function AssignmentSlideOver({
  assignment,
  onClose,
}: {
  assignment: Assignment;
  onClose: () => void;
}) {
  const router = useRouter();
  const [markingOpen, setMarkingOpen] = useState(false);
  const [grades, setGrades] = useState<Record<string, string>>({});

  const linkedSession = assignment.linkedSessionId
    ? (timetableSessions.find((s) => s.id === assignment.linkedSessionId) ?? null)
    : null;

  const students = getStudentsForAssignment(assignment);
  const submittedCount = parseInt(assignment.submissions.split("/")[0]) || 0;
  const markedCount    = parseInt(assignment.marked.split("/")[0]) || 0;

  const submissionRows = students.map((name, i) => ({
    name,
    submitted: i < submittedCount,
    graded: i < markedCount,
  }));

  function handleNavigateToTimetable() {
    onClose();
    router.push("/timetable");
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[480px] max-w-[95vw] bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-start gap-3 px-6 py-4 border-b border-slate-200 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-800 leading-tight">
              {assignment.assignment}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap",
                  getAssignmentTypeClass(assignment.type)
                )}
              >
                {assignment.type}
              </span>
              <span
                className={cn(
                  "px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap",
                  getAssignmentStatusClass(assignment.status)
                )}
              >
                {assignment.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-100 transition-colors cursor-pointer shrink-0 mt-0.5"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Key details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Subject</p>
              <p className="text-sm font-medium text-slate-800">{assignment.subject}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Teacher</p>
              <p className="text-sm font-medium text-slate-800">{assignment.teacher}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Due Date</p>
              <p className="text-sm font-medium text-slate-800">{assignment.dueDate}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Assign To</p>
              <p className="text-sm font-medium text-slate-800">
                {assignment.assignTo === "class" ? "Whole Class" : "Individual Students"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Submissions</p>
              <p className="text-sm font-medium text-slate-800">{assignment.submissions}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Marked</p>
              <p className="text-sm font-medium text-slate-800">{assignment.marked}</p>
            </div>
          </div>

          {/* Linked session chip */}
          {linkedSession && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Linked Session
              </p>
              <button
                onClick={handleNavigateToTimetable}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 rounded-lg text-sm text-slate-700 transition-colors cursor-pointer text-left"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="flex-1 min-w-0 text-sm">
                  {linkedSession.subject} · {linkedSession.day} {linkedSession.date} · {linkedSession.teacher}
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
              </button>
            </div>
          )}

          {/* Instructions */}
          {assignment.instructions && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Instructions
              </p>
              <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-100 leading-relaxed">
                {assignment.instructions}
              </p>
            </div>
          )}

          {/* Student submissions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Student Submissions
              </p>
              {students.length > 0 && (
                <button
                  onClick={() => setMarkingOpen((o) => !o)}
                  className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-3 h-3" />
                  Mark All
                </button>
              )}
            </div>

            {students.length > 0 ? (
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Student
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Status
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissionRows.map((row) => (
                      <tr key={row.name} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-2.5">
                          <AvatarCell name={row.name} />
                        </td>
                        <td className="px-4 py-2.5">
                          {row.submitted ? (
                            <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                              Submitted
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-slate-100 text-slate-500 border border-slate-200">
                              Not Submitted
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 font-medium text-xs">
                          {row.graded
                            ? grades[row.name] || mockGradeForStudent(row.name)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-lg border border-slate-100">
                No student data linked to this assignment.
              </p>
            )}
          </div>

          {/* Mark All inline grading panel */}
          {markingOpen && students.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                Enter Grades
              </p>
              <div className="space-y-2">
                {submissionRows.map((row) => (
                  <div key={row.name} className="flex items-center gap-3">
                    <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">
                      {row.name}
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. 85%"
                      value={grades[row.name] || ""}
                      onChange={(e) =>
                        setGrades((prev) => ({ ...prev, [row.name]: e.target.value }))
                      }
                      className="w-28 px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400"
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    toast.success("Grades saved");
                    setMarkingOpen(false);
                  }}
                  className="px-4 py-1.5 text-sm font-medium bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer"
                >
                  Save grades
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Tab 4 — Assignments ──────────────────────────────────────────────────────

function AssignmentsTab() {
  const [assignmentsList, setAssignmentsList] = useState<Assignment[]>(seedAssignments);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  function handleSave(newAssignment: Assignment) {
    setAssignmentsList((prev) => [newAssignment, ...prev]);
    toast.success("Assignment created");

    const linkedSession = newAssignment.linkedSessionId
      ? timetableSessions.find((s) => s.id === newAssignment.linkedSessionId)
      : null;

    const markingDue = addDaysToDisplayDate(newAssignment.dueDate, 2);
    const markingTask: Task = {
      id: `TK-${Date.now()}`,
      title: `Mark: ${newAssignment.assignment}`,
      type: "Academic",
      priority: "Medium",
      status: "Open",
      assignee: linkedSession?.teacher ?? "Unassigned",
      dueDate: markingDue,
      linkedRecord: null,
      description: `Mark student submissions for "${newAssignment.assignment}" — ${newAssignment.subject}.`,
      subtasks: ["Review submissions", "Enter grades", "Return feedback"],
      overdue: false,
      linkedAssignmentId: newAssignment.id,
    };
    tasks.push(markingTask);

    if (linkedSession) {
      toast.info(`Marking task created and assigned to ${linkedSession.teacher}`);
    } else {
      toast.info("Marking task created — assign a teacher manually");
    }

    setCreateOpen(false);
  }

  return (
    <div className="space-y-5">
      {/* Summary strip + Create button */}
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-3 gap-4 flex-1">
          <StatCard label="Assignments Set This Term" value="284" />
          <StatCard label="Pending Marking"           value="43"  accent="amber" />
          <StatCard label="Overdue Submissions"       value="28"  accent="red"   />
        </div>
        <div className="pt-1">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Assignment
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Assignment", "Subject", "Teacher", "Type", "Due Date", "Submissions", "Marked", "Status"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {assignmentsList.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => setSelectedAssignment(a)}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{a.assignment}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{a.subject}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{a.teacher}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap",
                        getAssignmentTypeClass(a.type)
                      )}
                    >
                      {a.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{a.dueDate}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{a.submissions}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{a.marked}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap",
                        getAssignmentStatusClass(a.status)
                      )}
                    >
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
              {assignmentsList.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-400">
                    No assignments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {createOpen && (
        <CreateAssignmentModal onClose={() => setCreateOpen(false)} onSave={handleSave} />
      )}

      {selectedAssignment && (
        <AssignmentSlideOver
          assignment={selectedAssignment}
          onClose={() => setSelectedAssignment(null)}
        />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "trackers",    label: "Trackers"        },
  { id: "reports",     label: "Reports"         },
  { id: "alerts",      label: "Academic Alerts" },
  { id: "assignments", label: "Assignments"     },
] as const;

type TabId = (typeof TABS)[number]["id"];

function ProgressPageContent() {
  const { can, role } = usePermission();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [exportOpen, setExportOpen] = useState(false);

  const raw = searchParams.get('tab');
  const activeTab: TabId = (raw && TABS.some(t => t.id === raw)) ? (raw as TabId) : 'trackers';

  function handleTabChange(id: TabId) {
    router.replace(`?tab=${id}`, { scroll: false });
  }

  if (!can('progress.view')) return <AccessDenied />;

  return (
    <div className="space-y-6">
      {(role === 'Teacher' || role === 'TA') && (
        <RoleBanner message="You can view progress trackers and student data. Report approvals require a higher role." />
      )}
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Progress</h1>
          <p className="text-sm text-slate-500 mt-0.5">Academic monitoring — track student progress, manage reports, and review alerts.</p>
        </div>
        {can('export') && (
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        )}
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Progress Data"
        recordCount={3847}
        formats={[
          { id: 'csv-trackers', label: 'Tracker Export', description: 'One row per tracker. Student, subject, avg score, predicted grade, tier.', icon: 'rows', recommended: true },
          { id: 'pdf-reports', label: 'Progress Reports (PDF)', description: 'Batch export of all approved progress reports as a single PDF.', icon: 'pdf' },
        ]}
      />

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer relative",
              activeTab === tab.id
                ? "text-slate-800"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "trackers"    && <TrackersTab />}
      {activeTab === "reports"     && <ReportsTab />}
      {activeTab === "alerts"      && (
        <AlertsTab
          onNavigateToTrackers={() => {
            router.replace('?tab=trackers', { scroll: false });
          }}
        />
      )}
      {activeTab === "assignments" && <AssignmentsTab />}
    </div>
  );
}

export default function ProgressPage() {
  return (
    <Suspense>
      <ProgressPageContent />
    </Suspense>
  );
}
