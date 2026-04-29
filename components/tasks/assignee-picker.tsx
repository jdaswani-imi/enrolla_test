"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StaffLite {
  id: string;
  name: string;
  status: string;
  role?: string;
  department?: string;
}

function getInitials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

export function AssigneePicker({
  assignees,
  onChange,
  staffList,
  placeholder = "Unassigned",
}: {
  assignees: string[];
  onChange: (names: string[]) => void;
  staffList: StaffLite[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const active = staffList.filter(
    (s) => s.status !== "Off-boarded" && s.status !== "Inactive"
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? active.filter((s) => s.name.toLowerCase().includes(q)) : active;
  }, [query, active]);

  function toggle(name: string) {
    onChange(
      assignees.includes(name)
        ? assignees.filter((n) => n !== name)
        : [...assignees, name]
    );
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2 min-h-[38px] px-3 py-1.5 border rounded-lg text-sm bg-white text-left transition-colors cursor-pointer",
          open
            ? "border-amber-400 ring-2 ring-amber-300"
            : "border-slate-200 hover:border-slate-300"
        )}
      >
        <span className="flex-1 flex flex-wrap gap-1 min-w-0">
          {assignees.length === 0 ? (
            <span className="text-slate-400 text-sm py-0.5">{placeholder}</span>
          ) : (
            assignees.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
              >
                <span className="font-bold">{getInitials(name)}</span>
                <span className="hidden sm:inline truncate max-w-[80px]">
                  {name.split(" ")[0]}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(name);
                  }}
                  className="ml-0.5 text-amber-600 hover:text-amber-900 cursor-pointer"
                  aria-label={`Remove ${name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="relative border-b border-slate-100">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search staff…"
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 focus:outline-none focus:bg-white transition-colors placeholder:text-slate-400"
            />
          </div>
          <div className="max-h-44 overflow-y-auto divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <p className="px-4 py-5 text-sm text-slate-400 text-center">
                No staff found
              </p>
            ) : (
              filtered.map((s) => {
                const checked = assignees.includes(s.name);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.name)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer",
                      checked ? "bg-amber-50" : "hover:bg-slate-50"
                    )}
                  >
                    <span
                      className={cn(
                        "flex-shrink-0 w-4 h-4 rounded border-[1.5px] flex items-center justify-center transition-colors",
                        checked
                          ? "bg-amber-500 border-amber-500"
                          : "border-slate-300 bg-white"
                      )}
                    >
                      {checked && (
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      )}
                    </span>
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600">
                      {getInitials(s.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-800 truncate leading-tight">
                        {s.name}
                      </span>
                      {(s.role || s.department) && (
                        <span className="block text-xs text-slate-400 truncate leading-tight mt-0.5">
                          {[s.role, s.department].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
