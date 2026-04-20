"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

export function WhatsAppBlock({
  message,
  sent,
  onSentChange,
  label = "COPY TO SEND TO PARENT",
}: {
  message: string;
  sent: boolean;
  onSentChange: (v: boolean) => void;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      // ignore — prototype
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const checkboxId = `wa-sent-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="rounded-lg border border-slate-200 bg-amber-50/40 border-l-4 border-l-amber-400 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 mb-2">{label}</p>
      <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed bg-white rounded-md border border-amber-200 p-2.5 mb-2 max-h-48 overflow-y-auto">
        {message}
      </pre>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label htmlFor={checkboxId} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
          <input
            id={checkboxId}
            type="checkbox"
            checked={sent}
            onChange={(e) => onSentChange(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300 text-amber-500 focus:ring-amber-400 cursor-pointer"
          />
          <span className="font-medium">Mark as sent</span>
        </label>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors",
            copied
              ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
              : "bg-white text-amber-700 border border-amber-300 hover:bg-amber-50",
          )}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? "Copied!" : "Copy message"}
        </button>
      </div>
    </div>
  );
}
