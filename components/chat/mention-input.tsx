"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarPalette, getInitials } from "@/lib/avatar-utils";
import { useStaffSearch, type StaffMention } from "./use-staff-search";

// ─── Public types ──────────────────────────────────────────────────────────────

export interface MentionData {
  id: string;
  name: string;
}

export interface MentionContent {
  text: string;
  mentions: MentionData[];
}

export interface MentionInputRef {
  clear: () => void;
  focus: () => void;
  isEmpty: () => boolean;
  getContent: () => MentionContent;
  triggerMention: () => void;
  insertText: (text: string) => void;
}

interface MentionInputProps {
  placeholder?: string;
  onSend: (content: MentionContent) => void;
  onEmptyChange?: (isEmpty: boolean) => void;
  className?: string;
}

// ─── Group handles ─────────────────────────────────────────────────────────────

interface MentionGroup {
  id: string;
  handle: string;
  label: string;
}

const MENTION_GROUPS: MentionGroup[] = [
  { id: "group-all", handle: "all", label: "@all" },
  { id: "group-admins", handle: "admins", label: "@admins" },
  { id: "group-teachers", handle: "teachers", label: "@teachers" },
];

// ─── DOM helpers ───────────────────────────────────────────────────────────────

interface AtTriggerInfo {
  query: string;
  atRange: Range;
}

function getAtTrigger(el: HTMLElement): AtTriggerInfo | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!el.contains(range.startContainer)) return null;

  let node: Node = range.startContainer;
  let offset = range.startOffset;

  // If cursor is in an element node, try to read the previous text child
  if (node.nodeType === Node.ELEMENT_NODE) {
    if (offset === 0) return null;
    const prev = node.childNodes[offset - 1];
    if (prev?.nodeType !== Node.TEXT_NODE) return null;
    node = prev;
    offset = (prev.textContent ?? "").length;
  }

  if (node.nodeType !== Node.TEXT_NODE) return null;

  const textBefore = (node.textContent ?? "").slice(0, offset);
  // Only trigger when @ is at start-of-string, after a space, or after a newline
  // (prevents triggering inside email addresses like hello@domain.com)
  const match = /(^|[ \n\t])@([A-Za-z][A-Za-z ]{0,30})?$/.exec(textBefore);
  if (!match) return null;

  const query = (match[2] ?? "").toLowerCase();
  const atStart = match.index + match[1].length; // position of @ in the text node

  const atRange = document.createRange();
  atRange.setStart(node as Text, atStart);
  atRange.setEnd(node as Text, offset);

  return { query, atRange };
}

function serializeContent(el: HTMLDivElement): MentionContent {
  const mentions: MentionData[] = [];
  let text = "";

  function walk(node: Node, isRoot: boolean) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? "";
    } else if (node instanceof HTMLElement) {
      if (node.dataset.mentionId) {
        mentions.push({ id: node.dataset.mentionId, name: node.dataset.mentionName ?? "" });
        text += `@${node.dataset.mentionName ?? ""}`;
      } else if (node.tagName === "BR") {
        text += "\n";
      } else {
        if (!isRoot && (node.tagName === "DIV" || node.tagName === "P")) {
          text += "\n";
        }
        for (const child of Array.from(node.childNodes)) walk(child, false);
      }
    }
  }

  for (const child of Array.from(el.childNodes)) walk(child, true);
  return { text: text.trim(), mentions };
}

// ─── Highlight matched query text ─────────────────────────────────────────────

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="font-semibold text-amber-700">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

// ─── Dropdown (absolute, anchored above composer) ─────────────────────────────

function MentionDropdown({
  results,
  loading,
  query,
  filteredGroups,
  selectedIdx,
  onSelect,
  onSelectGroup,
  onHover,
}: {
  results: StaffMention[];
  loading: boolean;
  query: string;
  filteredGroups: MentionGroup[];
  selectedIdx: number;
  onSelect: (s: StaffMention) => void;
  onSelectGroup: (g: MentionGroup) => void;
  onHover: (i: number) => void;
}) {
  const totalItems = filteredGroups.length + results.length;
  const showNoResults = !loading && query.length >= 2 && totalItems === 0;

  return (
    <div
      data-mention-dropdown
      style={{
        position: "absolute",
        bottom: "100%",
        left: 0,
        right: 0,
        marginBottom: 6,
        maxHeight: 192,
        zIndex: 50,
        overflowY: "auto",
        borderRadius: 10,
        border: "1px solid #E2E8F0",
        background: "white",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        scrollbarWidth: "thin" as const,
        scrollbarColor: "#CBD5E1 transparent",
      }}
    >
      {/* webkit scrollbar */}
      <style>{`
        [data-mention-dropdown]::-webkit-scrollbar { width: 4px; }
        [data-mention-dropdown]::-webkit-scrollbar-track { background: transparent; }
        [data-mention-dropdown]::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 2px; }
      `}</style>

      {/* Header */}
      <div className="px-3 pt-3 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
          Mention a teammate
        </span>
        {query.length === 0 && !loading && (
          <p className="text-[11px] text-slate-300 mt-1 mb-0">Type a name to filter</p>
        )}
      </div>

      {/* Loading */}
      {loading && totalItems === 0 && (
        <div className="px-3 py-3 text-center text-[13px] text-slate-400">Searching…</div>
      )}

      {/* Empty state — only when query ≥ 2 chars */}
      {showNoResults && (
        <div className="px-3 py-4 text-center text-[13px] text-slate-400">No staff found</div>
      )}

      {/* Group rows */}
      {filteredGroups.map((g, i) => {
        const active = i === selectedIdx;
        return (
          <button
            key={g.id}
            type="button"
            data-mention-dropdown
            data-mention-idx={i}
            onMouseEnter={() => onHover(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelectGroup(g);
            }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 h-10 text-left cursor-pointer transition-colors border-none outline-none",
              active ? "bg-amber-100" : "hover:bg-amber-50",
            )}
          >
            <Users size={16} className="text-slate-500 shrink-0" />
            <span className="text-[13px] text-slate-600 font-medium">{g.label}</span>
          </button>
        );
      })}

      {/* Staff rows */}
      {results.map((s, i) => {
        const flatIdx = filteredGroups.length + i;
        const palette = getAvatarPalette(s.name);
        const active = flatIdx === selectedIdx;
        return (
          <button
            key={s.id}
            type="button"
            data-mention-dropdown
            data-mention-idx={flatIdx}
            onMouseEnter={() => onHover(flatIdx)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(s);
            }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 h-10 text-left cursor-pointer transition-colors border-none outline-none",
              active ? "bg-amber-100" : "hover:bg-amber-50",
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                "w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold",
                palette.bg,
                palette.text,
              )}
            >
              {getInitials(s.name)}
            </div>
            {/* Name + role */}
            <div className="min-w-0">
              <p className="text-[13px] text-slate-800 font-medium leading-tight m-0">
                <HighlightMatch text={s.name} query={query} />
              </p>
              <p className="text-[11px] text-slate-400 truncate m-0">
                {s.role !== "—" ? s.role : s.department !== "—" ? s.department : "Staff"}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(
  function MentionInput({ placeholder, onSend, onEmptyChange, className }, ref) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [dropdownQuery, setDropdownQuery] = useState("");
    const [editorEmpty, setEditorEmpty] = useState(true);
    const atRangeRef = useRef<Range | null>(null);
    const blurTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const { results, loading, search, clear: clearSearch } = useStaffSearch();

    // Stable ref to onEmptyChange to avoid stale closure warnings
    const onEmptyChangeRef = useRef(onEmptyChange);
    useEffect(() => { onEmptyChangeRef.current = onEmptyChange; }, [onEmptyChange]);

    // Scroll active item into view on keyboard navigation
    useEffect(() => {
      if (!dropdownOpen) return;
      const el = document.querySelector<HTMLElement>(`[data-mention-idx="${selectedIdx}"]`);
      el?.scrollIntoView({ block: "nearest" });
    }, [selectedIdx, dropdownOpen]);

    const checkIsEmpty = useCallback((el: HTMLDivElement): boolean => {
      const text = (el.textContent ?? "").trim();
      const hasChip = !!el.querySelector("[data-mention-id]");
      return !text && !hasChip;
    }, []);

    const updateEmpty = useCallback(() => {
      const el = editorRef.current;
      if (!el) return;
      const empty = checkIsEmpty(el);
      setEditorEmpty(empty);
      onEmptyChangeRef.current?.(empty);
    }, [checkIsEmpty]);

    // Filter groups by query
    const filteredGroups = dropdownQuery.length === 0
      ? MENTION_GROUPS
      : MENTION_GROUPS.filter((g) => g.handle.startsWith(dropdownQuery.replace(/^@/, "")));

    const totalItems = filteredGroups.length + results.length;

    function openDropdown(query: string, atRange: Range) {
      atRangeRef.current = atRange;
      setDropdownQuery(query);
      search(query);
      setSelectedIdx(0);
      setDropdownOpen(true);
    }

    function closeDropdown() {
      clearTimeout(blurTimerRef.current);
      setDropdownOpen(false);
      setDropdownQuery("");
      clearSearch();
      atRangeRef.current = null;
    }

    function insertMention(staff: StaffMention) {
      const atRange = atRangeRef.current;
      if (!atRange) return;

      const sel = window.getSelection();
      if (!sel) return;
      sel.removeAllRanges();
      sel.addRange(atRange);
      atRange.deleteContents();

      // Build chip
      const chip = document.createElement("span");
      chip.className = [
        "mention-chip inline-flex items-center",
        "rounded-full px-2 py-0 text-[13px] font-medium leading-5",
        "bg-blue-50 text-blue-700 border border-blue-200 mx-0.5 select-none",
      ].join(" ");
      chip.contentEditable = "false";
      chip.dataset.mentionId = staff.id;
      chip.dataset.mentionName = staff.name;
      chip.textContent = `@${staff.name}`;

      atRange.insertNode(chip);

      const space = document.createTextNode(" ");
      chip.after(space);
      const after = document.createRange();
      after.setStartAfter(space);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);

      closeDropdown();
      updateEmpty();
    }

    function insertGroup(group: MentionGroup) {
      const atRange = atRangeRef.current;
      if (!atRange) return;

      const sel = window.getSelection();
      if (!sel) return;
      sel.removeAllRanges();
      sel.addRange(atRange);
      atRange.deleteContents();

      const chip = document.createElement("span");
      chip.className = [
        "mention-chip inline-flex items-center",
        "rounded-full px-2 py-0 text-[13px] font-medium leading-5",
        "bg-amber-50 text-amber-700 border border-amber-200 mx-0.5 select-none",
      ].join(" ");
      chip.contentEditable = "false";
      chip.dataset.mentionId = group.id;
      chip.dataset.mentionName = group.handle;
      chip.textContent = group.label;

      atRange.insertNode(chip);

      const space = document.createTextNode(" ");
      chip.after(space);
      const after = document.createRange();
      after.setStartAfter(space);
      after.collapse(true);
      sel.removeAllRanges();
      sel.addRange(after);

      closeDropdown();
      updateEmpty();
    }

    function handleInput() {
      updateEmpty();
      const el = editorRef.current;
      if (!el) return;

      const info = getAtTrigger(el);

      if (!info) {
        if (dropdownOpen) closeDropdown();
        return;
      }

      // Recompute position every keystroke so dropdown tracks line-wrapping
      openDropdown(info.query, info.atRange);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      if (dropdownOpen && totalItems > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIdx((i) => (i + 1) % totalItems);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIdx((i) => (i - 1 + totalItems) % totalItems);
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          if (selectedIdx < filteredGroups.length) {
            insertGroup(filteredGroups[selectedIdx]);
          } else {
            insertMention(results[selectedIdx - filteredGroups.length]);
          }
          return;
        }
      }

      if (e.key === "Escape") {
        if (dropdownOpen) {
          e.preventDefault();
          closeDropdown();
          return;
        }
      }

      // Enter without Shift → send (only when dropdown is closed)
      if (e.key === "Enter" && !e.shiftKey && !dropdownOpen) {
        e.preventDefault();
        const el = editorRef.current;
        if (!el || checkIsEmpty(el)) return;
        onSend(serializeContent(el));
      }
    }

    function handleBlur() {
      // Delay so mousedown on dropdown items fires before we close
      blurTimerRef.current = setTimeout(() => {
        if (dropdownOpen) closeDropdown();
      }, 150);
    }

    // Close on outside click
    useEffect(() => {
      function onMouseDown(e: MouseEvent) {
        const target = e.target as Node;
        const isInsideEditor = editorRef.current?.contains(target);
        const isInsideDropdown = (target as HTMLElement).closest?.("[data-mention-dropdown]");
        if (!isInsideEditor && !isInsideDropdown) closeDropdown();
      }
      document.addEventListener("mousedown", onMouseDown);
      return () => document.removeEventListener("mousedown", onMouseDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Imperative API ──────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      clear() {
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
          setEditorEmpty(true);
          onEmptyChangeRef.current?.(true);
        }
        closeDropdown();
      },
      focus() {
        editorRef.current?.focus();
      },
      isEmpty() {
        const el = editorRef.current;
        return !el || checkIsEmpty(el);
      },
      getContent() {
        return editorRef.current
          ? serializeContent(editorRef.current)
          : { text: "", mentions: [] };
      },
      triggerMention() {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        document.execCommand("insertText", false, "@");
        setTimeout(() => {
          const info = getAtTrigger(el);
          if (info) {
            atRangeRef.current = info.atRange;
            setDropdownQuery(info.query);
            search(info.query);
            setSelectedIdx(0);
            setDropdownOpen(true);
          }
        }, 50);
      },
      insertText(text: string) {
        const el = editorRef.current;
        if (!el) return;
        el.focus();
        // eslint-disable-next-line @typescript-eslint/no-deprecated
        document.execCommand("insertText", false, text);
        updateEmpty();
      },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [checkIsEmpty, search, updateEmpty]);

    return (
      <div className={cn("relative", className)}>
        {/* Floating placeholder */}
        {editorEmpty && (
          <div
            className="absolute top-2 left-3 pointer-events-none text-sm text-slate-400 select-none"
            aria-hidden
          >
            {placeholder ?? "Message the team…"}
          </div>
        )}

        {/* Contenteditable editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-full min-h-[52px] px-3 pt-2 pb-1 text-sm text-slate-700 focus:outline-none bg-transparent leading-relaxed whitespace-pre-wrap break-words"
          aria-label={placeholder ?? "Message the team"}
          aria-multiline="true"
          role="textbox"
        />

        {/* Mention dropdown — absolutely positioned above the composer */}
        {dropdownOpen && (
          <MentionDropdown
            results={results}
            loading={loading}
            query={dropdownQuery}
            filteredGroups={filteredGroups}
            selectedIdx={selectedIdx}
            onSelect={insertMention}
            onSelectGroup={insertGroup}
            onHover={setSelectedIdx}
          />
        )}
      </div>
    );
  },
);
