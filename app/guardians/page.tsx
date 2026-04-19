"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  UserPlus,
  Users,
  X,
  MoreHorizontal,
  Eye,
  UserPlus2,
  MessageSquare,
  Archive,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/lib/use-permission";
import { AccessDenied } from "@/components/ui/access-denied";
import { ExportDialog } from "@/components/ui/export-dialog";
import { guardians, type Guardian } from "@/lib/mock-data";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationBar } from "@/components/ui/pagination-bar";

// ─── Avatar palette ───────────────────────────────────────────────────────────

const AVATAR_PALETTES = [
  { bg: "bg-amber-100",   text: "text-amber-700"   },
  { bg: "bg-teal-100",    text: "text-teal-700"     },
  { bg: "bg-blue-100",    text: "text-blue-700"     },
  { bg: "bg-violet-100",  text: "text-violet-700"   },
  { bg: "bg-rose-100",    text: "text-rose-700"     },
  { bg: "bg-emerald-100", text: "text-emerald-700"  },
  { bg: "bg-sky-100",     text: "text-sky-700"      },
  { bg: "bg-orange-100",  text: "text-orange-700"   },
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

// ─── Family chips ─────────────────────────────────────────────────────────────

function FamilyChips({ students }: { students: Guardian["students"] }) {
  return (
    <div className="flex items-center">
      {students.map((student, index) => {
        const palette = getAvatarPalette(student.name);
        return (
          <div
            key={student.id}
            title={student.name}
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ring-2 ring-white cursor-default",
              palette.bg,
              palette.text,
              index > 0 ? "-ml-2" : ""
            )}
            style={{ zIndex: students.length - index }}
          >
            {student.initials}
          </div>
        );
      })}
      {students.length > 1 && (
        <span className="ml-2 text-xs text-slate-400">
          {students.length} students
        </span>
      )}
    </div>
  );
}

// ─── Row actions ──────────────────────────────────────────────────────────────

function RowActions({
  guardian,
  isOpen,
  onOpen,
  onClose,
  openUpward,
}: {
  guardian: Guardian;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  openUpward: boolean;
}) {
  const { can } = usePermission();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [isOpen, onClose]);

  const actions = [
    { icon: Eye,          label: "View Profile",  onClick: () => {}, danger: false, show: true },
    { icon: UserPlus2,    label: "Add Student",   onClick: () => {}, danger: false, show: can('students.create') },
    { icon: MessageSquare,label: "Send Message",  onClick: () => {}, danger: false, show: true },
    { icon: Archive,      label: "Archive",       onClick: () => {}, danger: true,  show: can('guardians.edit') },
  ].filter(a => a.show);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); if (isOpen) onClose(); else onOpen(); }}
        aria-label="Row actions"
        className="flex items-center justify-center w-7 h-7 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute right-0 z-50 bg-white border border-slate-200 rounded-lg shadow-lg min-w-[168px] py-1",
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          )}
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={(e) => { e.stopPropagation(); action.onClick(); onClose(); }}
                className={cn(
                  "w-full text-left flex items-center gap-2.5 px-3 py-1.5 text-sm transition-colors cursor-pointer",
                  action.danger
                    ? "text-red-600 hover:bg-red-50"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuardiansPage() {
  const { can } = usePermission();
  const [exportOpen,     setExportOpen]     = useState(false);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [bulkSelect,     setBulkSelect]     = useState(false);
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [openMenuId,     setOpenMenuId]     = useState<string | null>(null);
  const [currentPage,    setCurrentPage]    = useState(1);
  const [rowsPerPage,    setRowsPerPage]    = useState(20);

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  function clearSearch() {
    setSearchQuery("");
    setCurrentPage(1);
  }

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return guardians;
    const q = searchQuery.toLowerCase();
    return guardians.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      g.email.toLowerCase().includes(q) ||
      g.phone.includes(q) ||
      g.students.some((s) => s.name.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, currentPage, rowsPerPage]);

  const allOnPageSelected = paginated.length > 0 && paginated.every((g) => selectedIds.has(g.id));
  const someSelected = selectedIds.size > 0;

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) paginated.forEach((g) => next.delete(g.id));
      else paginated.forEach((g) => next.add(g.id));
      return next;
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  if (!can('guardians.view')) return <AccessDenied />;

  return (
    <div className="flex flex-col gap-4 max-w-[1400px] mx-auto">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 leading-tight">Guardians</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage guardians and their linked students.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {can('export') && (
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          )}
          {can('guardians.create') && (
            <button
              type="button"
              className="btn-primary flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add Guardian
            </button>
          )}
        </div>
      </div>

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        title="Export Guardians"
        recordCount={198}
        formats={[
          { id: 'csv-contacts', label: 'Contact List', description: 'Name, email, phone, WhatsApp status, linked students.', icon: 'rows', recommended: true },
          { id: 'csv-full', label: 'Full Export', description: 'All fields including DNC status, communication history.', icon: 'items' },
        ]}
      />

      {/* ── Filter & search bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        {/* Search — always visible on left */}
        <div
          className="relative flex items-center border border-slate-200 bg-white rounded-md transition-all duration-200"
          style={{ width: searchExpanded || searchQuery ? "16rem" : "2rem" }}
        >
          <button
            type="button"
            onClick={() => setSearchExpanded(true)}
            aria-label="Search guardians"
            className="absolute left-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer z-10"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <input
            type="text"
            placeholder="Search guardian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchExpanded(true)}
            onBlur={() => { if (!searchQuery) setSearchExpanded(false); }}
            className={cn(
              "w-full pl-7 pr-7 py-1.5 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400 transition-opacity",
              !searchExpanded && !searchQuery ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Bulk select toggle */}
        <button
          type="button"
          onClick={() => {
            setBulkSelect((v) => !v);
            if (bulkSelect) setSelectedIds(new Set());
          }}
          className={cn(
            "px-3 py-1.5 rounded-md border text-sm font-medium transition-colors cursor-pointer",
            bulkSelect
              ? "border-amber-400 bg-amber-50 text-amber-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
          )}
        >
          Bulk select
        </button>
      </div>

      {/* ── Bulk actions bar ─────────────────────────────────────────────────── */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm flex-wrap">
          <span className="font-semibold text-amber-800">{selectedIds.size} selected</span>
          <span className="text-amber-300 hidden sm:inline">·</span>
          <button type="button" className="text-amber-700 hover:text-amber-900 font-medium transition-colors cursor-pointer">Export</button>
          <span className="text-amber-300 hidden sm:inline">·</span>
          <button type="button" className="text-amber-700 hover:text-amber-900 font-medium transition-colors cursor-pointer">Send Message</button>
          <span className="text-amber-300 hidden sm:inline">·</span>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-amber-700 hover:text-amber-900 font-medium transition-colors cursor-pointer"
          >
            Deselect All
          </button>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {bulkSelect && (
                  <th className="w-10 px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAll}
                      aria-label="Select all on page"
                      className="rounded border-slate-300 cursor-pointer accent-amber-500"
                    />
                  </th>
                )}
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 whitespace-nowrap">Name</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">Email</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">Phone</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-3 whitespace-nowrap">Family</th>
                <th className="w-12 px-3 py-3" />
              </tr>
            </thead>

            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={bulkSelect ? 6 : 5}>
                    <EmptyState
                      icon={Users}
                      title="No guardians found"
                      description="No guardians match your search. Try a different query."
                      action={{ label: "Clear search", onClick: clearSearch }}
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((guardian, index) => {
                  const palette    = getAvatarPalette(guardian.name);
                  const initials   = getInitials(guardian.name);
                  const isSelected = selectedIds.has(guardian.id);
                  const openUpward = index >= paginated.length - 3;

                  return (
                    <tr
                      key={guardian.id}
                      className={cn(
                        "border-b border-slate-100 last:border-0 transition-colors cursor-pointer",
                        isSelected ? "bg-amber-50/60 hover:bg-amber-50" : "hover:bg-slate-50"
                      )}
                      style={{ height: "56px" }}
                    >
                      {/* Checkbox (bulk mode) */}
                      {bulkSelect && (
                        <td className="px-4 py-0 w-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(guardian.id)}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select ${guardian.name}`}
                            className="rounded border-slate-300 cursor-pointer accent-amber-500"
                          />
                        </td>
                      )}

                      {/* Name */}
                      <td className="px-4 py-0">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                              palette.bg,
                              palette.text
                            )}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 leading-tight truncate">
                              {guardian.name}
                            </p>
                            <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                              {guardian.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-3 py-0 max-w-[200px]">
                        <span className="text-slate-500 text-sm truncate block">
                          {guardian.email}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="px-3 py-0">
                        <span className="text-slate-400 text-xs whitespace-nowrap">
                          {guardian.phone}
                        </span>
                      </td>

                      {/* Family */}
                      <td className="px-3 py-0">
                        <FamilyChips students={guardian.students} />
                      </td>

                      {/* Actions */}
                      <td
                        className="px-3 py-0 w-12"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <RowActions
                          guardian={guardian}
                          isOpen={openMenuId === guardian.id}
                          onOpen={() => setOpenMenuId(guardian.id)}
                          onClose={() => setOpenMenuId(null)}
                          openUpward={openUpward}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <PaginationBar
          total={filtered.length}
          page={currentPage}
          pageSize={rowsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={(size) => { setRowsPerPage(size); setCurrentPage(1); }}
        />
      </div>
    </div>
  );
}
