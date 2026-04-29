"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AppNotificationType =
  | "invoice-overdue"
  | "feedback"
  | "concern"
  | "trial"
  | "task"
  | "report"
  | "lead"
  | "payment"
  | "leave"
  | "cpd"
  | "mention"
  | "reaction";

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  time: string;
  href: string;
  unread: boolean;
  urgent?: boolean;
  mention?: boolean;
  // mention-specific
  senderName?: string;
  leadId?: string;
  messageId?: string;
  timestamp: number;
  // reaction-specific
  emoji?: string;
  leadName?: string;
  messagePreview?: string;
}

// ─── Module-level store ────────────────────────────────────────────────────────

let _notifications: AppNotification[] = [];
const _subs = new Set<() => void>();

function _notify(): void {
  _subs.forEach((fn) => fn());
}

function _dbRowToNotification(row: {
  id: string;
  type: string;
  title: string;
  href: string | null;
  metadata: Record<string, unknown>;
  unread: boolean;
  created_at: string;
}): AppNotification {
  return {
    id: row.id,
    type: row.type as AppNotificationType,
    title: row.title,
    time: relativeTime(new Date(row.created_at).getTime()),
    href: row.href ?? "/",
    unread: row.unread,
    mention: row.type === "mention",
    senderName: row.metadata?.senderName as string | undefined,
    leadId: row.metadata?.leadId as string | undefined,
    messageId: row.metadata?.messageId as string | undefined,
    timestamp: new Date(row.created_at).getTime(),
  };
}

// Merge server rows into the local list, deduplicating by id.
// Server rows take precedence (they have the authoritative unread state).
function _mergeServer(serverRows: AppNotification[]): void {
  const serverById = new Map(serverRows.map((n) => [n.id, n]));
  // Keep local-only entries (optimistic pushes not yet in DB), merge the rest
  const localOnly = _notifications.filter((n) => !serverById.has(n.id));
  _notifications = [
    ...localOnly,
    ...serverRows,
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
  _notify();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Push an optimistic notification immediately (e.g. for the sender's own bell). */
export function pushNotification(n: AppNotification): void {
  // Deduplicate — if server already delivered it, don't add twice
  if (_notifications.some((x) => x.id === n.id)) return;
  _notifications = [n, ..._notifications].slice(0, 50);
  _notify();
}

export function markNotificationRead(id: string): void {
  _notifications = _notifications.map((n) =>
    n.id === id ? { ...n, unread: false } : n,
  );
  _notify();
  // Persist to server (fire-and-forget)
  fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  }).catch(() => {});
}

export function markAllNotificationsRead(): void {
  _notifications = _notifications.map((n) => ({ ...n, unread: false }));
  _notify();
  fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ all: true }),
  }).catch(() => {});
}

/** Check if a reaction notification already exists (for deduplication). */
export function hasReactionNotification(opts: {
  senderId: string;
  messageId: string;
  emoji: string;
}): boolean {
  return _notifications.some(
    (n) =>
      n.type === "reaction" &&
      n.senderName === opts.senderId &&
      n.messageId === opts.messageId &&
      n.emoji === opts.emoji,
  );
}

/** Remove a reaction notification when the user un-reacts. */
export function removeReactionNotification(opts: {
  senderId: string;
  messageId: string;
  emoji: string;
}): void {
  _notifications = _notifications.filter(
    (n) =>
      !(
        n.type === "reaction" &&
        n.senderName === opts.senderId &&
        n.messageId === opts.messageId &&
        n.emoji === opts.emoji
      ),
  );
  _notify();
}

// ─── React hook ───────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 30_000; // 30 s

export function useNotifications() {
  const [, tick] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    const sub = () => tick((c) => c + 1);
    _subs.add(sub);

    // Initial fetch + polling
    async function fetchFromServer() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const json = await res.json();
        const rows = (json.data ?? []) as Parameters<typeof _dbRowToNotification>[0][];
        _mergeServer(rows.map(_dbRowToNotification));
      } catch {
        // network error — silently skip
      }
    }

    fetchFromServer();
    pollingRef.current = setInterval(fetchFromServer, POLL_INTERVAL_MS);

    return () => {
      _subs.delete(sub);
      clearInterval(pollingRef.current);
    };
  }, []);

  return {
    notifications: _notifications,
    markRead: markNotificationRead,
    markAllRead: markAllNotificationsRead,
  };
}

// ─── Relative-time helper ─────────────────────────────────────────────────────

export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
