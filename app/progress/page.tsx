"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
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
} from "lucide-react";
import { MultiSelectFilter } from "@/components/ui/multi-select-filter";
import { SortableHeader } from "@/components/ui/sortable-header";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { RoleBanner } from "@/components/ui/role-banner";
import { AccessDenied } from "@/components/ui/access-denied";
import { ExportDialog } from "@/components/ui/export-dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier = "Pass" | "Requires Support" | "Not Submitted";
type ReportStatus = "Approved" | "Pending HOD" | "Draft" | "Not Generated";
type Severity = "Critical" | "High" | "Medium" | "Low";
type AlertStatus = "Open" | "Escalated to Concern" | "Acknowledged" | "Resolved";
type AssignmentStatus = "Complete" | "Partial" | "Pending" | "Upcoming";
type AssignmentType = "Test" | "Homework" | "Classwork" | "Past Paper";

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
}

interface Assignment {
  assignment: string;
  subject: string;
  teacher: string;
  type: AssignmentType;
  dueDate: string;
  submissions: string;
  marked: string;
  status: AssignmentStatus;
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
  { student: "Aisha Rahman",       subject: "Y8 Maths",    teacher: "Mr Ahmed Khalil",   draftReady: "15 Apr 2025", status: "Draft"       },
  { student: "Layla Hassan",       subject: "Y10 Physics", teacher: "Mr Faris Al-Amin",  draftReady: "14 Apr 2025", status: "Pending HOD" },
  { student: "Layla Hassan",       subject: "Y10 Maths",   teacher: "Mr Faris Al-Amin",  draftReady: "14 Apr 2025", status: "Draft"       },
  { student: "Faris Qasim",        subject: "Y11 Physics", teacher: "Mr Faris Al-Amin",  draftReady: "13 Apr 2025", status: "Draft"       },
  { student: "Mariam Al-Suwaidi",  subject: "Y13 Maths",   teacher: "Mr Faris Al-Amin",  draftReady: "12 Apr 2025", status: "Pending HOD" },
  { student: "Hamdan Al-Maktoum",  subject: "Y7 Maths",    teacher: "Mr Tariq Al-Amin",  draftReady: "10 Apr 2025", status: "Approved"    },
  { student: "Khalid Mansoor",     subject: "Y12 Maths",   teacher: "Mr Faris Al-Amin",  draftReady: "8 Apr 2025",  status: "Approved"    },
  { student: "Aisha Rahman",       subject: "Y8 English",  teacher: "Ms Sarah Mitchell", draftReady: "8 Apr 2025",  status: "Approved"    },
  { student: "Hamdan Al-Maktoum",  subject: "Y7 English",  teacher: "Ms Sarah Mitchell", draftReady: "7 Apr 2025",  status: "Approved"    },
  { student: "Ziad Khalil",        subject: "Y3 English",  teacher: "Ms Sarah Mitchell", draftReady: "5 Apr 2025",  status: "Approved"    },
];

const ALERTS: Alert[] = [
  { student: "Nour Ibrahim",      year: "Y4",  subject: "Y4 Maths",    alertType: "Below Pass Threshold",      signal: "3 consecutive Requires Support",          raised: "14 Apr 2025", severity: "Critical", status: "Open"                 },
  { student: "Sara Nasser",       year: "Y9",  subject: "Y9 Maths",    alertType: "Below Pass Threshold",      signal: "Avg score 55% — below 80% threshold",     raised: "12 Apr 2025", severity: "Critical", status: "Open"                 },
  { student: "Omar Al-Farsi",     year: "Y5",  subject: "Y5 Maths",    alertType: "Predicted Grade Gap",       signal: "Predicted C+, target B — gap widening",   raised: "10 Apr 2025", severity: "High",     status: "Open"                 },
  { student: "Aisha Rahman",      year: "Y8",  subject: "Y8 Maths",    alertType: "Assignment Non-submission", signal: "30%+ non-submission rate this term",       raised: "8 Apr 2025",  severity: "Medium",   status: "Escalated to Concern" },
  { student: "Faris Qasim",       year: "Y11", subject: "Y11 Physics", alertType: "Predicted Grade Gap",       signal: "Predicted B-, target A — 2 grade gap",    raised: "6 Apr 2025",  severity: "Medium",   status: "Open"                 },
  { student: "Mariam Al-Suwaidi", year: "Y13", subject: "Y13 Maths",   alertType: "Predicted Grade Gap",       signal: "Predicted B, target A — monitored",        raised: "4 Apr 2025",  severity: "Low",      status: "Acknowledged"         },
  { student: "Reem Al-Dosari",    year: "Y6",  subject: "Y6 Science",  alertType: "Attendance Impact",         signal: "Attendance below 80% affecting progress",  raised: "2 Apr 2025",  severity: "Medium",   status: "Open"                 },
  { student: "Dana Al-Zaabi",     year: "Y2",  subject: "Y2 English",  alertType: "Topic Gap",                 signal: "2 topics not yet assessed this term",       raised: "1 Apr 2025",  severity: "Low",      status: "Resolved"             },
];

const ASSIGNMENTS: Assignment[] = [
  { assignment: "Algebra Practice Test",      subject: "Y8 Maths",    teacher: "Mr Ahmed Khalil",   type: "Test",       dueDate: "18 Apr 2025", submissions: "3/3", marked: "3/3", status: "Complete"  },
  { assignment: "Essay — Persuasive Writing", subject: "Y8 English",  teacher: "Ms Sarah Mitchell", type: "Homework",   dueDate: "15 Apr 2025", submissions: "2/3", marked: "2/2", status: "Partial"   },
  { assignment: "Quadratics Quiz",            subject: "Y8 Maths",    teacher: "Mr Ahmed Khalil",   type: "Classwork",  dueDate: "10 Apr 2025", submissions: "3/3", marked: "3/3", status: "Complete"  },
  { assignment: "Physics Problem Set 4",      subject: "Y10 Physics", teacher: "Mr Faris Al-Amin",  type: "Homework",   dueDate: "20 Apr 2025", submissions: "1/2", marked: "0/1", status: "Pending"   },
  { assignment: "Y9 Maths Chapter Test",      subject: "Y9 Maths",    teacher: "Mr Tariq Al-Amin",  type: "Test",       dueDate: "22 Apr 2025", submissions: "0/2", marked: "0/0", status: "Upcoming"  },
  { assignment: "Reading Comprehension",      subject: "Y8 English",  teacher: "Ms Sarah Mitchell", type: "Classwork",  dueDate: "5 Apr 2025",  submissions: "3/3", marked: "3/3", status: "Complete"  },
  { assignment: "Y12 Mechanics Paper 1",      subject: "Y12 Maths",   teacher: "Mr Faris Al-Amin",  type: "Past Paper", dueDate: "16 Apr 2025", submissions: "1/1", marked: "1/1", status: "Complete"  },
  { assignment: "Y3 Spelling Test",           subject: "Y3 English",  teacher: "Ms Sarah Mitchell", type: "Classwork",  dueDate: "14 Apr 2025", submissions: "1/1", marked: "1/1", status: "Complete"  },
];

const MOCK_TOPICS = [
  { topic: "Algebra",    score: 88, tier: "Pass"             as Tier, remark: "Strong grasp of linear equations"         },
  { topic: "Quadratics", score: 76, tier: "Pass"             as Tier, remark: "Needs practice on completing the square"  },
  { topic: "Geometry",   score: 91, tier: "Pass"             as Tier, remark: "Excellent spatial reasoning"              },
  { topic: "Statistics", score: 62, tier: "Requires Support" as Tier, remark: "Struggling with probability trees"        },
  { topic: "Calculus",   score: 55, tier: "Requires Support" as Tier, remark: "Introduction only — needs reinforcement"  },
];

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
    case "Approved":      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Pending HOD":   return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Draft":         return "bg-blue-100 text-blue-700 border border-blue-200";
    case "Not Generated": return "bg-slate-100 text-slate-500 border border-slate-200";
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
    case "Acknowledged":         return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Resolved":             return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }
}

function getAssignmentStatusClass(s: AssignmentStatus): string {
  switch (s) {
    case "Complete":  return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "Partial":   return "bg-amber-100 text-amber-700 border border-amber-200";
    case "Pending":   return "bg-blue-100 text-blue-700 border border-blue-200";
    case "Upcoming":  return "bg-slate-100 text-slate-500 border border-slate-200";
  }
}

function getAssignmentTypeClass(t: AssignmentType): string {
  switch (t) {
    case "Test":       return "bg-purple-100 text-purple-700 border border-purple-200";
    case "Homework":   return "bg-teal-100 text-teal-700 border border-teal-200";
    case "Classwork":  return "bg-slate-100 text-slate-500 border border-slate-200";
    case "Past Paper": return "bg-blue-50 text-blue-900 border border-blue-200";
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

// ─── Tracker Slide-Over ───────────────────────────────────────────────────────

function TrackerSlideOver({ tracker, onClose }: { tracker: Tracker; onClose: () => void }) {
  const { can } = usePermission();
  const palette  = getAvatarPalette(tracker.student);
  const initials = getInitials(tracker.student);

  return (
    <>
      <div className="fade-in fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="slide-in-right fixed right-0 top-0 h-full w-[560px] bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200">
          <div className="flex items-start gap-3">
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0", palette.bg, palette.text)}>
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-slate-800">{tracker.student}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">{tracker.year}</span>
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getTierClass(tracker.tier))}>{tracker.tier}</span>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">{tracker.subject}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors cursor-pointer text-slate-400"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
              <p className="text-xs text-slate-400 mb-1">Topics Covered</p>
              <p className="text-sm font-semibold text-slate-700">{tracker.topicsCovered}</p>
            </div>
            <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
              <p className="text-xs text-slate-400 mb-1">Average Score</p>
              <AvgScoreCell score={tracker.avgScore} />
            </div>
          </div>

          {/* Topic table */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Topic Breakdown</h3>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Topic", "Score", "Tier", "Remark"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TOPICS.map((t, i) => (
                    <tr key={t.topic} className={cn("border-b border-slate-100 last:border-0", i % 2 === 1 && "bg-slate-50/60")}>
                      <td className="px-4 py-2.5 font-medium text-slate-700">{t.topic}</td>
                      <td className="px-4 py-2.5">
                        <span className={cn("font-medium text-sm",
                          t.score >= 80 ? "text-emerald-600" :
                          t.score >= 60 ? "text-amber-600"   :
                          "text-red-600"
                        )}>{t.score}%</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium", getTierClass(t.tier))}>
                          {t.tier === "Pass" ? "Pass ✓" : "Requires Support ⚠️"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-slate-500">{t.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4">
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-center gap-8">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Predicted Grade</p>
                <p className="text-2xl font-bold text-amber-500">{tracker.predictedGrade}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-0.5">Target Grade</p>
                <p className="text-2xl font-bold text-slate-400">{tracker.targetGrade}</p>
              </div>
            </div>
          </div>
          {can('progress.generateReport') && (
          <button className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">
            Generate Report
          </button>
          )}
        </div>
      </div>
    </>
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
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
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
                        onClick={() => setSelected(t)}
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

      {selected && <TrackerSlideOver tracker={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Tab 2 — Reports ──────────────────────────────────────────────────────────

function ReportsTab() {
  const { can } = usePermission();
  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Reports Generated This Term" value="142" />
        <StatCard label="Pending Approval"            value="12"  accent="amber" />
        <StatCard label="Delivered to Parents"        value="108" />
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
              {REPORTS.map((r, i) => (
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
                          <button className="px-3 py-1 text-xs font-medium bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                            Review &amp; Edit
                          </button>
                          <button className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap">
                            <Sparkles className="w-3 h-3" />
                            Generate AI Narrative
                          </button>
                        </>
                      )}
                      {r.status === "Pending HOD" && (
                        <>
                          {can('progress.approveReport') && (
                          <button className="px-3 py-1 text-xs font-medium bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap">
                            Approve
                          </button>
                          )}
                          <button className="px-3 py-1 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap">
                            Send Back
                          </button>
                        </>
                      )}
                      {r.status === "Approved" && (
                        <>
                          <button className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap">
                            <Download className="w-3 h-3" />
                            Download PDF
                          </button>
                          <button className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap">
                            <CheckCircle className="w-3 h-3" />
                            Mark as Delivered
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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

function AlertsTab() {
  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Active Alerts"       value="11" />
        <StatCard label="Critical"            value="2"  accent="red" />
        <StatCard label="Resolved This Week"  value="4"  />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {["Student", "Year", "Subject", "Alert Type", "Signal", "Raised", "Severity", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALERTS.map((a, i) => {
                const canRaiseConcern = a.status === "Open" || a.severity === "Critical";
                return (
                  <tr key={i} className={cn("border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors", a.severity === "Critical" && "bg-red-50/40")}>
                    <td className="px-4 py-3"><AvatarCell name={a.student} /></td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">{a.year}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{a.subject}</td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600 whitespace-nowrap">{a.alertType}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px]">{a.signal}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{a.raised}</td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap", getSeverityClass(a.severity))}>{a.severity}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap", getAlertStatusClass(a.status))}>{a.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1 text-xs font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap">
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
                        {canRaiseConcern && (
                          <button className="px-3 py-1 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap">
                            <ArrowUpCircle className="w-3 h-3" />
                            Raise Concern
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 4 — Assignments ──────────────────────────────────────────────────────

function AssignmentsTab() {
  return (
    <div className="space-y-5">
      {/* Summary strip */}
      <div className="flex items-start justify-between gap-4">
        <div className="grid grid-cols-3 gap-4 flex-1">
          <StatCard label="Assignments Set This Term" value="284" />
          <StatCard label="Pending Marking"           value="43"  accent="amber" />
          <StatCard label="Overdue Submissions"       value="28"  accent="red"   />
        </div>
        <div className="pt-1">
          <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-amber-400 hover:bg-amber-500 text-white rounded-lg transition-colors cursor-pointer whitespace-nowrap">
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
                {["Assignment", "Subject", "Teacher", "Type", "Due Date", "Submissions", "Marked", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ASSIGNMENTS.map((a, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{a.assignment}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{a.subject}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{a.teacher}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap", getAssignmentTypeClass(a.type))}>{a.type}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{a.dueDate}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{a.submissions}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{a.marked}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 text-xs rounded-full font-medium whitespace-nowrap", getAssignmentStatusClass(a.status))}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
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

export default function ProgressPage() {
  const { can, role } = usePermission();
  const [activeTab, setActiveTab] = useState<TabId>("trackers");
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab") as TabId | null;
    if (tab && TABS.some((t) => t.id === tab)) setActiveTab(tab);
  }, []);

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
            onClick={() => setActiveTab(tab.id)}
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
      {activeTab === "alerts"      && <AlertsTab />}
      {activeTab === "assignments" && <AssignmentsTab />}
    </div>
  );
}
