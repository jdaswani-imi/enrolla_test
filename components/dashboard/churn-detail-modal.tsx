"use client";

import { useRouter } from "next/navigation";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ChurnRiskStudent } from "@/lib/mock-data";

interface ChurnDetailModalProps {
  student: ChurnRiskStudent | null;
  open: boolean;
  onClose: () => void;
}

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);

  const color =
    score >= 70 ? "#EF4444"
    : score >= 40 ? "#F59E0B"
    : "#10B981";

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#F1F5F9"
        strokeWidth={6}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function scoreColor(score: number) {
  if (score >= 70) return "text-red-500";
  if (score >= 40) return "text-amber-500";
  return "text-emerald-500";
}

function TrendIcon({ trend }: { trend: ChurnRiskStudent["trend"] }) {
  if (trend === "rising") return <TrendingUp className="w-4 h-4 text-red-500" />;
  if (trend === "falling") return <TrendingDown className="w-4 h-4 text-emerald-500" />;
  return <Minus className="w-4 h-4 text-slate-400" />;
}

function trendLabel(trend: ChurnRiskStudent["trend"]) {
  if (trend === "rising") return <span className="text-xs text-red-500 font-medium">↑ Rising</span>;
  if (trend === "falling") return <span className="text-xs text-emerald-500 font-medium">↓ Falling</span>;
  return <span className="text-xs text-slate-400 font-medium">→ Stable</span>;
}

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const initials = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2);
  return (
    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 shrink-0">
      {initials.toUpperCase()}
    </div>
  );
}

export function ChurnDetailModal({ student, open, onClose }: ChurnDetailModalProps) {
  const router = useRouter();

  if (!student) return null;

  const sortedReasons = [...student.reasons].sort((a, b) => b.weight - a.weight);

  function handleViewProfile() {
    onClose();
    router.push(`/students/${student!.studentId}?tab=overview`);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Initials name={student.name} />
            <div>
              <DialogTitle className="text-base font-bold text-slate-900">{student.name}</DialogTitle>
              <p className="text-xs text-slate-400 mt-0.5">{student.yearGroup} · {student.department}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-5">
          {/* Churn Score */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <ScoreRing score={student.churnScore} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-lg font-black", scoreColor(student.churnScore))}>
                  {student.churnScore}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Churn Score</p>
              <div className="flex items-center gap-1.5">
                <TrendIcon trend={student.trend} />
                {trendLabel(student.trend)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Last 30 days</p>
            </div>
          </div>

          {/* Churn Signals */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2.5">Churn Signals</p>
            <div className="space-y-2.5">
              {sortedReasons.map((r) => (
                <div key={r.label} className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex items-center rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600 shrink-0 border border-red-100">
                    {r.weight}%
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{r.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100" />

          {/* Retention Confidence */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2.5">Retention Confidence</p>
            <div className="flex items-center gap-4 mb-3">
              <div className="relative">
                <ScoreRing score={student.retentionConfidence} size={60} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn("text-sm font-black", scoreColor(student.retentionConfidence))}>
                    {student.retentionConfidence}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {student.retentionConfidence >= 60
                  ? "Moderate retention likelihood — some positive signals present."
                  : student.retentionConfidence >= 40
                  ? "Low retention confidence — intervention recommended."
                  : "Very low retention confidence — immediate action needed."}
              </p>
            </div>
            <div className="space-y-2">
              {student.retentionFactors.map((f) => (
                <div key={f.label} className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0 border border-emerald-100">
                    {f.weight}%
                  </span>
                  <p className="text-xs text-slate-700 font-medium">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-0">
          <button
            type="button"
            onClick={handleViewProfile}
            className="w-full rounded-lg bg-amber-400 hover:bg-amber-500 text-amber-950 font-semibold text-sm py-2.5 transition-colors cursor-pointer"
          >
            View Full Profile
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
