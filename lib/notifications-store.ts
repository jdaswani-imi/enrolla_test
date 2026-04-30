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
  | "reaction"
  | "reply";

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  /** Preview body line shown under the title. */
  body?: string;
  time: string;
  href: string;
  unread: boolean;
  urgent?: boolean;
  mention?: boolean;
  // actor (who triggered the notification)
  actorName?: string;
  actorInitials?: string;
  // backward-compat alias — same as actorName
  senderName?: string;
  leadId?: string;
  messageId?: string;
  timestamp: number;
  // reaction-specific
  emoji?: string;
  leadName?: string;
  messagePreview?: string;
  // human-readable label for the surface (e.g. "Jude2 lead chat", "#general")
  surfaceLabel?: string;
  // deep-link: where clicking this notification navigates to
  deepLink?: {
    surface: "lead" | "team" | "class";
    surfaceId: string;
    messageId: string;
  };
}

// ─── Seed mock notifications ───────────────────────────────────────────────────

const _NOW = Date.now();
const _H = 3_600_000;
const _D = 86_400_000;

const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: "seed-reaction-1",
    type: "reaction",
    title: "Jason Daswani reacted 👍 to your message",
    body: '"When is the assessment rescheduled?" · Jude2 lead chat',
    time: "2h ago",
    href: "/leads",
    unread: true,
    actorName: "Jason Daswani",
    actorInitials: "JD",
    senderName: "Jason Daswani",
    emoji: "👍",
    messagePreview: "When is the assessment rescheduled?",
    surfaceLabel: "Jude2 lead chat",
    timestamp: _NOW - 2 * _H,
    deepLink: { surface: "lead", surfaceId: "seed-lead-1", messageId: "seed-msg-1" },
  },
  {
    id: "seed-reply-1",
    type: "reply",
    title: "Sarah Mitchell replied to your message",
    body: '"Sure, I\'ll confirm with the parents today" · Ahmed lead chat',
    time: "3h ago",
    href: "/leads",
    unread: true,
    actorName: "Sarah Mitchell",
    actorInitials: "SM",
    senderName: "Sarah Mitchell",
    messagePreview: "Sure, I'll confirm with the parents today",
    surfaceLabel: "Ahmed lead chat",
    timestamp: _NOW - 3 * _H,
    deepLink: { surface: "lead", surfaceId: "seed-lead-2", messageId: "seed-msg-2" },
  },
  {
    id: "seed-mention-1",
    type: "mention",
    title: "Jason Daswani mentioned you in Jude2 lead chat",
    body: '"@Sarah can you follow up on this assessment?" · Jude2 lead chat',
    time: "5h ago",
    href: "/leads",
    unread: true,
    mention: true,
    actorName: "Jason Daswani",
    actorInitials: "JD",
    senderName: "Jason Daswani",
    messagePreview: "@Sarah can you follow up on this assessment?",
    surfaceLabel: "Jude2 lead chat",
    timestamp: _NOW - 5 * _H,
    deepLink: { surface: "lead", surfaceId: "seed-lead-1", messageId: "seed-msg-3" },
  },
  {
    id: "seed-reaction-2",
    type: "reaction",
    title: "Aisha Patel reacted ❤️ to your message",
    body: '"Great news — trial session confirmed for Thursday!" · Rania lead chat',
    time: "Yesterday",
    href: "/leads",
    unread: false,
    actorName: "Aisha Patel",
    actorInitials: "AP",
    senderName: "Aisha Patel",
    emoji: "❤️",
    messagePreview: "Great news — trial session confirmed for Thursday!",
    surfaceLabel: "Rania lead chat",
    timestamp: _NOW - 22 * _H,
    deepLink: { surface: "lead", surfaceId: "seed-lead-3", messageId: "seed-msg-4" },
  },
  {
    id: "seed-reply-2",
    type: "reply",
    title: "Omar Hassan replied to your message",
    body: '"Invoice has been sent to the guardian" · Finance discussion',
    time: "Yesterday",
    href: "/leads",
    unread: false,
    actorName: "Omar Hassan",
    actorInitials: "OH",
    senderName: "Omar Hassan",
    messagePreview: "Invoice has been sent to the guardian",
    surfaceLabel: "Finance discussion",
    timestamp: _NOW - 26 * _H,
    deepLink: { surface: "lead", surfaceId: "seed-lead-4", messageId: "seed-msg-5" },
  },
  {
    id: "seed-mention-2",
    type: "mention",
    title: "Aisha Patel mentioned you in #general",
    body: '"@Jason could you review the new intake schedule?" · #general',
    time: "2d ago",
    href: "/automations",
    unread: false,
    mention: true,
    actorName: "Aisha Patel",
    actorInitials: "AP",
    senderName: "Aisha Patel",
    messagePreview: "@Jason could you review the new intake schedule?",
    surfaceLabel: "#general",
    timestamp: _NOW - 2 * _D,
    deepLink: { surface: "team", surfaceId: "seed-channel-1", messageId: "seed-msg-6" },
  },
  {
    id: "seed-reaction-3",
    type: "reaction",
    title: "Sarah Mitchell reacted 🎉 to your message",
    body: '"Welcome to IMI — enrolment complete!" · Ahmed lead chat',
    time: "3d ago",
    href: "/leads",
    unread: false,
    actorName: "Sarah Mitchell",
    actorInitials: "SM",
    senderName: "Sarah Mitchell",
    emoji: "🎉",
    messagePreview: "Welcome to IMI — enrolment complete!",
    surfaceLabel: "Ahmed lead chat",
    timestamp: _NOW - 3 * _D,
    deepLink: { surface: "lead", surfaceId: "seed-lead-2", messageId: "seed-msg-7" },
  },
  {
    id: "seed-reply-3",
    type: "reply",
    title: "Jason Daswani replied to your message",
    body: '"Agreed, let\'s move it to next week" · Y8 Maths discussion',
    time: "4d ago",
    href: "/feedback",
    unread: false,
    actorName: "Jason Daswani",
    actorInitials: "JD",
    senderName: "Jason Daswani",
    messagePreview: "Agreed, let's move it to next week",
    surfaceLabel: "Y8 Maths discussion",
    timestamp: _NOW - 4 * _D,
    deepLink: { surface: "class", surfaceId: "seed-discussion-1", messageId: "seed-msg-8" },
  },
];

// ─── Module-level store ────────────────────────────────────────────────────────

let _notifications: AppNotification[] = [...SEED_NOTIFICATIONS];
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
  const meta = row.metadata ?? {};
  return {
    id: row.id,
    type: row.type as AppNotificationType,
    title: row.title,
    body: meta.body as string | undefined,
    time: relativeTime(new Date(row.created_at).getTime()),
    href: row.href ?? "/",
    unread: row.unread,
    mention: row.type === "mention",
    actorName: (meta.actorName ?? meta.senderName) as string | undefined,
    actorInitials: meta.actorInitials as string | undefined,
    senderName: (meta.senderName ?? meta.actorName) as string | undefined,
    leadId: meta.leadId as string | undefined,
    messageId: meta.messageId as string | undefined,
    timestamp: new Date(row.created_at).getTime(),
    emoji: meta.emoji as string | undefined,
    leadName: meta.leadName as string | undefined,
    messagePreview: meta.messagePreview as string | undefined,
    surfaceLabel: meta.surfaceLabel as string | undefined,
    deepLink: meta.deepLink as AppNotification["deepLink"],
  };
}

// Merge server rows into the local list, deduplicating by id.
// Server rows take precedence (they have the authoritative unread state).
function _mergeServer(serverRows: AppNotification[]): void {
  const serverById = new Map(serverRows.map((n) => [n.id, n]));
  // Keep local-only entries (seed data + optimistic pushes not yet in DB)
  const localOnly = _notifications.filter((n) => !serverById.has(n.id));
  _notifications = [
    ...localOnly,
    ...serverRows,
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 100);
  _notify();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Push an optimistic notification immediately (e.g. for the recipient's own bell). */
export function pushNotification(n: AppNotification): void {
  if (_notifications.some((x) => x.id === n.id)) return;
  _notifications = [n, ..._notifications].slice(0, 100);
  _notify();
}

export function markNotificationRead(id: string): void {
  _notifications = _notifications.map((n) =>
    n.id === id ? { ...n, unread: false } : n,
  );
  _notify();
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
      (n.actorName === opts.senderId || n.senderName === opts.senderId) &&
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
        (n.actorName === opts.senderId || n.senderName === opts.senderId) &&
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
  if (d === 1) return "Yesterday";
  return `${d}d ago`;
}
