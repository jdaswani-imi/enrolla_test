"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, X, GraduationCap, Users, Briefcase, UserPlus, Receipt } from "lucide-react";

import { students, guardians, staffMembers, leads, invoices } from "@/lib/mock-data";
import type { Student, Guardian, StaffMember, Lead, Invoice, InvoiceStatus, LeadStage, StudentStatus } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type EntityKind = "student" | "guardian" | "staff" | "lead" | "invoice";

interface ResultItem {
  kind: EntityKind;
  id: string;
  href: string;
  data: Student | Guardian | StaffMember | Lead | Invoice;
}

interface Grouped {
  kind: EntityKind;
  label: string;
  icon: typeof GraduationCap;
  seeAllHref: string;
  total: number;
  items: ResultItem[];
}

const RECENT_KEY = "enrolla-recent-searches";
const MAX_RECENT = 3;
const MAX_PER_GROUP = 3;
const DEBOUNCE_MS = 200;
const MIN_CHARS = 2;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string").slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

function saveRecent(list: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT)));
  } catch {
    /* ignore */
  }
}

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function studentStatusClass(s: StudentStatus) {
  if (s === "Active") return "bg-emerald-100 text-emerald-700";
  if (s === "Graduated") return "bg-sky-100 text-sky-700";
  return "bg-slate-100 text-slate-600";
}

function leadStageClass(stage: LeadStage) {
  if (stage === "Won" || stage === "Paid") return "bg-emerald-100 text-emerald-700";
  if (stage === "New" || stage === "Contacted") return "bg-sky-100 text-sky-700";
  if (stage.startsWith("Assessment")) return "bg-violet-100 text-violet-700";
  if (stage.startsWith("Trial")) return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function invoiceStatusClass(s: InvoiceStatus) {
  if (s === "Paid") return "bg-emerald-100 text-emerald-700";
  if (s === "Part") return "bg-amber-100 text-amber-700";
  if (s === "Overdue") return "bg-rose-100 text-rose-700";
  if (s === "Issued") return "bg-sky-100 text-sky-700";
  if (s === "Cancelled") return "bg-slate-100 text-slate-500";
  return "bg-slate-100 text-slate-600";
}

function formatAmount(n: number) {
  return `AED ${n.toLocaleString("en-AE")}`;
}

function searchAll(query: string): Grouped[] {
  const q = normalize(query);

  const studentMatches = students.filter(
    (s) => normalize(s.name).includes(q) || normalize(s.id).includes(q)
  );
  const guardianMatches = guardians.filter(
    (g) => normalize(g.name).includes(q) || normalize(g.phone).includes(q)
  );
  const staffMatches = staffMembers.filter(
    (s) => normalize(s.name).includes(q) || normalize(s.email).includes(q)
  );
  const leadMatches = leads.filter(
    (l) =>
      normalize(l.childName).includes(q) ||
      normalize(l.id).includes(q) ||
      normalize(l.ref).includes(q)
  );
  const invoiceMatches = invoices.filter(
    (i) => normalize(i.id).includes(q) || normalize(i.student).includes(q)
  );

  return [
    {
      kind: "student",
      label: "STUDENTS",
      icon: GraduationCap,
      seeAllHref: `/students?q=${encodeURIComponent(query)}`,
      total: studentMatches.length,
      items: studentMatches.slice(0, MAX_PER_GROUP).map((s) => ({
        kind: "student",
        id: s.id,
        href: `/students/${s.id}`,
        data: s,
      })),
    },
    {
      kind: "guardian",
      label: "GUARDIANS",
      icon: Users,
      seeAllHref: `/guardians?q=${encodeURIComponent(query)}`,
      total: guardianMatches.length,
      items: guardianMatches.slice(0, MAX_PER_GROUP).map((g) => ({
        kind: "guardian",
        id: g.id,
        href: `/guardians`,
        data: g,
      })),
    },
    {
      kind: "staff",
      label: "STAFF",
      icon: Briefcase,
      seeAllHref: `/staff?q=${encodeURIComponent(query)}`,
      total: staffMatches.length,
      items: staffMatches.slice(0, MAX_PER_GROUP).map((s) => ({
        kind: "staff",
        id: s.id,
        href: `/staff`,
        data: s,
      })),
    },
    {
      kind: "lead",
      label: "LEADS",
      icon: UserPlus,
      seeAllHref: `/leads?q=${encodeURIComponent(query)}`,
      total: leadMatches.length,
      items: leadMatches.slice(0, MAX_PER_GROUP).map((l) => ({
        kind: "lead",
        id: l.id,
        href: `/leads`,
        data: l,
      })),
    },
    {
      kind: "invoice",
      label: "INVOICES",
      icon: Receipt,
      seeAllHref: `/finance?q=${encodeURIComponent(query)}`,
      total: invoiceMatches.length,
      items: invoiceMatches.slice(0, MAX_PER_GROUP).map((i) => ({
        kind: "invoice",
        id: i.id,
        href: `/finance`,
        data: i,
      })),
    },
  ];
}

export function GlobalSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const recentLoaded = useRef(false);

  const ensureRecentLoaded = useCallback(() => {
    if (recentLoaded.current) return;
    recentLoaded.current = true;
    setRecent(loadRecent());
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [value]);

  const trimmed = debounced.trim();
  const hasQuery = trimmed.length >= MIN_CHARS;

  const groups = useMemo(() => (hasQuery ? searchAll(trimmed) : []), [hasQuery, trimmed]);
  const nonEmptyGroups = useMemo(() => groups.filter((g) => g.items.length > 0), [groups]);
  const totalResults = useMemo(
    () => groups.reduce((sum, g) => sum + g.total, 0),
    [groups]
  );

  // Flat list of navigable items for keyboard nav
  const flatItems = useMemo(() => {
    const arr: ResultItem[] = [];
    for (const g of nonEmptyGroups) arr.push(...g.items);
    return arr;
  }, [nonEmptyGroups]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const commitRecent = useCallback((query: string) => {
    const q = query.trim();
    if (q.length < MIN_CHARS) return;
    setRecent((prev) => {
      const next = [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, []);

  const navigate = useCallback(
    (href: string, query?: string) => {
      if (query) commitRecent(query);
      setOpen(false);
      inputRef.current?.blur();
      router.push(href);
    },
    [router, commitRecent]
  );

  const clearRecent = useCallback(() => {
    setRecent([]);
    saveRecent([]);
  }, []);

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }
    if (!hasQuery) {
      // Recent-search navigation
      if (e.key === "Enter" && recent[0]) {
        e.preventDefault();
        setValue(recent[0]);
        return;
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(flatItems.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flatItems[activeIndex];
      if (target) navigate(target.href, trimmed);
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  return (
    <div ref={containerRef} className="relative">
      <div
        className={cn(
          "flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64 transition-all",
          open && "bg-white border-amber-400"
        )}
      >
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onFocus={() => {
            ensureRecentLoaded();
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search students, leads, invoices..."
          role="combobox"
          aria-label="Global search"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="global-search-listbox"
          className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
        />
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue("");
              inputRef.current?.focus();
            }}
            className="text-slate-400 hover:text-slate-600 cursor-pointer flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          id="global-search-listbox"
          ref={listRef}
          role="listbox"
          className="absolute right-0 top-full mt-1.5 w-[420px] max-h-[70vh] overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-[200]"
        >
          {!hasQuery ? (
            <RecentPanel
              recent={recent}
              onPick={(q) => {
                setValue(q);
                inputRef.current?.focus();
              }}
              onClear={clearRecent}
            />
          ) : nonEmptyGroups.length === 0 ? (
            <NoResults query={trimmed} />
          ) : (
            <ResultsPanel
              groups={nonEmptyGroups}
              totalResults={totalResults}
              activeIndex={activeIndex}
              onHover={setActiveIndex}
              onPick={navigate}
              query={trimmed}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ─── Sub-panels ───────────────────────────────────────────────────────────────

function RecentPanel({
  recent,
  onPick,
  onClear,
}: {
  recent: string[];
  onPick: (q: string) => void;
  onClear: () => void;
}) {
  if (recent.length === 0) {
    return (
      <div className="px-4 py-6 text-center">
        <Search className="w-5 h-5 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Start typing to search</p>
        <p className="text-xs text-slate-400 mt-0.5">
          Students, guardians, staff, leads, invoices
        </p>
      </div>
    );
  }
  return (
    <div className="py-2">
      <div className="px-4 py-1.5 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          Recent searches
        </span>
        <button
          onClick={onClear}
          className="text-[10px] text-amber-600 font-medium uppercase tracking-wide cursor-pointer hover:underline"
        >
          Clear
        </button>
      </div>
      {recent.map((q) => (
        <button
          key={q}
          onClick={() => onPick(q)}
          className="w-full text-left px-4 py-2 flex items-center gap-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{q}</span>
        </button>
      ))}
    </div>
  );
}

function NoResults({ query }: { query: string }) {
  return (
    <div className="px-4 py-8 text-center">
      <Search className="w-5 h-5 text-slate-300 mx-auto mb-2" />
      <p className="text-sm font-medium text-slate-700">
        No results for &ldquo;{query}&rdquo;
      </p>
      <p className="text-xs text-slate-400 mt-1">
        Check spelling or try a different term.
      </p>
    </div>
  );
}

function ResultsPanel({
  groups,
  totalResults,
  activeIndex,
  onHover,
  onPick,
  query,
}: {
  groups: Grouped[];
  totalResults: number;
  activeIndex: number;
  onHover: (i: number) => void;
  onPick: (href: string, query?: string) => void;
  query: string;
}) {
  let flatIdx = 0;
  return (
    <div className="py-1">
      <div className="px-4 py-1.5 border-b border-slate-100">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          {totalResults} result{totalResults === 1 ? "" : "s"}
        </span>
      </div>
      {groups.map((group) => {
        const Icon = group.icon;
        return (
          <div key={group.kind} className="py-1.5 border-b border-slate-100 last:border-b-0">
            <div className="px-4 py-1 flex items-center gap-1.5">
              <Icon className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                {group.label}
              </span>
            </div>
            {group.items.map((item) => {
              const idx = flatIdx++;
              const active = idx === activeIndex;
              return (
                <button
                  key={item.id}
                  data-idx={idx}
                  onMouseEnter={() => onHover(idx)}
                  onClick={() => onPick(item.href, query)}
                  className={cn(
                    "w-full text-left px-4 py-2 transition-colors cursor-pointer",
                    active ? "bg-amber-50" : "hover:bg-slate-50"
                  )}
                >
                  <ResultRow item={item} />
                </button>
              );
            })}
            {group.total > group.items.length && (
              <button
                onClick={() => onPick(group.seeAllHref, query)}
                className="w-full text-left px-4 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
              >
                See all {group.total} results →
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Per-kind row renderers ───────────────────────────────────────────────────

function ResultRow({ item }: { item: ResultItem }) {
  switch (item.kind) {
    case "student":
      return <StudentRow student={item.data as Student} />;
    case "guardian":
      return <GuardianRow guardian={item.data as Guardian} />;
    case "staff":
      return <StaffRow staff={item.data as StaffMember} />;
    case "lead":
      return <LeadRow lead={item.data as Lead} />;
    case "invoice":
      return <InvoiceRow invoice={item.data as Invoice} />;
  }
}

function Badge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap",
        className
      )}
    >
      {children}
    </span>
  );
}

function StudentRow({ student }: { student: Student }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{student.name}</p>
        <p className="text-xs text-slate-500 truncate">
          {student.yearGroup} · {student.department} · {student.id}
        </p>
      </div>
      <Badge className={studentStatusClass(student.status)}>{student.status}</Badge>
    </div>
  );
}

function GuardianRow({ guardian }: { guardian: Guardian }) {
  const count = guardian.students.length;
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{guardian.name}</p>
        <p className="text-xs text-slate-500 truncate">{guardian.phone}</p>
      </div>
      <span className="text-xs text-slate-500 whitespace-nowrap">
        {count} {count === 1 ? "student" : "students"}
      </span>
    </div>
  );
}

function StaffRow({ staff }: { staff: StaffMember }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{staff.name}</p>
        <p className="text-xs text-slate-500 truncate">{staff.email}</p>
      </div>
      <Badge className="bg-slate-100 text-slate-700">{staff.role}</Badge>
    </div>
  );
}

function LeadRow({ lead }: { lead: Lead }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{lead.childName}</p>
        <p className="text-xs text-slate-500 truncate">
          {lead.ref} · {lead.yearGroup}
        </p>
      </div>
      <Badge className={leadStageClass(lead.stage)}>{lead.stage}</Badge>
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {invoice.id} · {invoice.student}
        </p>
        <p className="text-xs text-slate-500 truncate">{formatAmount(invoice.amount)}</p>
      </div>
      <Badge className={invoiceStatusClass(invoice.status)}>{invoice.status}</Badge>
    </div>
  );
}
