"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { subjectsForYearGroup, stripYearGroupPrefix, type SubjectOption } from "./subjects";

interface SubjectSelectProps {
  value: string;
  onChange: (next: string) => void;
  yearGroup: string;
  className?: string;
  placeholder?: string;
  id?: string;
}

export function SubjectSelect({
  value,
  onChange,
  yearGroup,
  className,
  placeholder = "Select subject",
  id,
}: SubjectSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const options = useMemo(() => subjectsForYearGroup(yearGroup), [yearGroup]);
  const displayValue = useMemo(() => stripYearGroupPrefix(value), [value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q));
  }, [options, query]);

  const grouped = useMemo(() => {
    const map: Record<string, SubjectOption[]> = {};
    for (const o of filtered) {
      if (!map[o.band]) map[o.band] = [];
      map[o.band].push(o);
    }
    return map;
  }, [filtered]);

  const updateRect = () => {
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setRect({ top: r.bottom + 4, left: r.left, width: r.width });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updateRect();
    const onScroll = () => updateRect();
    const onResize = () => updateRect();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        wrapRef.current &&
        !wrapRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        setOpen(false);
        setQuery("");
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  function choose(name: string) {
    onChange(name);
    setOpen(false);
    setQuery("");
  }

  const bandOrder: SubjectOption["band"][] = ["Primary", "Lower Secondary", "Upper Secondary", "Enrichment"];

  const panel = open && rect && mounted
    ? createPortal(
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top: rect.top,
            left: rect.left,
            width: rect.width,
            zIndex: 1000,
          }}
          className="rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden"
        >
          <div className="bg-white border-b border-slate-100 p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search subjects…"
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-xs text-slate-400 text-center">No subjects match</div>
            ) : (
              bandOrder
                .filter((b) => grouped[b]?.length)
                .map((band) => (
                  <div key={band}>
                    <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {band}
                    </div>
                    {grouped[band].map((opt) => {
                      const selected = opt.name === displayValue;
                      return (
                        <button
                          key={`${band}-${opt.name}`}
                          type="button"
                          onClick={() => choose(opt.name)}
                          className={cn(
                            "w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors",
                            selected
                              ? "bg-amber-50 text-amber-800 font-semibold"
                              : "text-slate-700 hover:bg-slate-50",
                          )}
                        >
                          {opt.name}
                        </button>
                      );
                    })}
                  </div>
                ))
            )}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full inline-flex items-center justify-between rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-left focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 cursor-pointer",
          !displayValue && "text-slate-400",
        )}
      >
        <span className="truncate">{displayValue || placeholder}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
      </button>
      {panel}
    </div>
  );
}
