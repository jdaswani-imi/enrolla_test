"use client";

import { useState, useEffect } from "react";

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
  | "mention";

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  time: string;
  href: string;
  unread: boolean;
  urgent?: boolean;
  mention?: boolean;
  // mention-specific fields
  senderName?: string;
  leadId?: string;
  messageId?: string;
  timestamp: number;
}

// ─── Module-level store (resets on page refresh — acceptable for prototype) ───

let _notifications: AppNotification[] = [];
const _subs = new Set<() => void>();

function _notify(): void {
  _subs.forEach((fn) => fn());
}

export function pushNotification(n: AppNotification): void {
  _notifications = [n, ..._notifications];
  _notify();
}

export function markNotificationRead(id: string): void {
  _notifications = _notifications.map((n) =>
    n.id === id ? { ...n, unread: false } : n,
  );
  _notify();
}

export function markAllNotificationsRead(): void {
  _notifications = _notifications.map((n) => ({ ...n, unread: false }));
  _notify();
}

// ─── React hook ───────────────────────────────────────────────────────────────

export function useNotifications() {
  const [, tick] = useState(0);

  useEffect(() => {
    const sub = () => tick((c) => c + 1);
    _subs.add(sub);
    return () => {
      _subs.delete(sub);
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
