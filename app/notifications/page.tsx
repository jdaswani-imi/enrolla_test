"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import { getAvatarPalette, getInitials } from "@/lib/avatar-utils";
import {
  useNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  relativeTime,
  type AppNotification,
} from "@/lib/notifications-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "all" | "unread";

// ─── Deep-link helper ─────────────────────────────────────────────────────────

function resolveHref(n: AppNotification): string {
  if (n.deepLink) {
    const { surface, surfaceId, messageId } = n.deepLink;
    if (surface === "lead") {
      return `/leads?leadId=${surfaceId}${messageId ? `&messageId=${messageId}` : ""}`;
    }
    if (surface === "team") {
      return `/automations?tab=internal-messages${surfaceId ? `&channelId=${surfaceId}` : ""}${messageId ? `&messageId=${messageId}` : ""}`;
    }
    if (surface === "class") {
      return `/feedback?tab=class-discussion${surfaceId ? `&discussionId=${surfaceId}` : ""}${messageId ? `&messageId=${messageId}` : ""}`;
    }
  }
  return n.href;
}

// ─── Avatar with badge ────────────────────────────────────────────────────────

function NotifAvatar({ n }: { n: AppNotification }) {
  const name = n.actorName ?? n.senderName ?? "?";
  const palette = getAvatarPalette(name);

  return (
    <div className="relative flex-shrink-0">
      <div
        className={cn(
          "size-9 rounded-full flex items-center justify-center text-[12px] font-bold",
          palette.bg,
          palette.text,
        )}
      >
        {getInitials(name)}
      </div>

      {/* Reaction — emoji badge */}
      {n.type === "reaction" && n.emoji && (
        <div className="absolute -bottom-0.5 -right-0.5 size-[18px] rounded-full bg-white border-2 border-amber-300 flex items-center justify-center shadow-sm">
          <span style={{ fontSize: "10px", lineHeight: 1 }}>{n.emoji}</span>
        </div>
      )}

      {/* Mention — amber @ badge */}
      {n.type === "mention" && (
        <div className="absolute -bottom-0.5 -right-0.5 size-[18px] rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-sm">
          <span className="text-white font-bold" style={{ fontSize: "9px", lineHeight: 1 }}>@</span>
        </div>
      )}

      {/* Reply — small reply icon badge */}
      {n.type === "reply" && (
        <div className="absolute -bottom-0.5 -right-0.5 size-[18px] rounded-full bg-sky-500 border-2 border-white flex items-center justify-center shadow-sm">
          <Reply className="text-white" style={{ width: 9, height: 9 }} />
        </div>
      )}
    </div>
  );
}

// ─── Notification row ─────────────────────────────────────────────────────────

function NotifRow({
  n,
  onMark,
  onNavigate,
}: {
  n: AppNotification;
  onMark: (id: string) => void;
  onNavigate: (n: AppNotification) => void;
}) {
  const [hovering, setHovering] = useState(false);

  const displayTime = relativeTime(n.timestamp);
  const isChat = n.type === "mention" || n.type === "reaction" || n.type === "reply";

  return (
    <li
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      className={cn(
        "relative group flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors border-b border-slate-100 last:border-b-0",
        n.unread
          ? "bg-amber-50/50 hover:bg-amber-50"
          : "bg-white hover:bg-slate-50/60",
      )}
      onClick={() => onNavigate(n)}
    >
      {/* Avatar */}
      <NotifAvatar n={n} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title + timestamp */}
        <div className="flex items-start justify-between gap-3">
          <p
            className={cn(
              "text-sm leading-snug",
              n.unread ? "font-medium text-slate-800" : "font-normal text-slate-600",
            )}
          >
            {n.title}
          </p>
          <span className="text-[11px] text-slate-400 flex-shrink-0 mt-0.5">{displayTime}</span>
        </div>

        {/* Body preview */}
        {(n.body ?? n.messagePreview) && (
          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">
            {n.body ?? `"${n.messagePreview}"`}
          </p>
        )}

        {/* Surface chip */}
        {isChat && n.surfaceLabel && (
          <span className="inline-flex mt-1.5 text-[11px] bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 font-medium">
            {n.surfaceLabel}
          </span>
        )}
      </div>

      {/* Right: unread dot + hover mark-as-read */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1.5 self-start mt-1">
        {n.unread && !hovering && (
          <span className="size-2 rounded-full bg-amber-500 block" />
        )}
        {hovering && n.unread && (
          <button
            aria-label="Mark as read"
            onClick={(e) => {
              e.stopPropagation();
              onMark(n.id);
            }}
            className="size-6 rounded-full bg-white border border-slate-200 hover:bg-amber-50 hover:border-amber-300 flex items-center justify-center shadow-sm transition-colors cursor-pointer"
          >
            <Check className="size-3 text-amber-600" />
          </button>
        )}
        {!n.unread && hovering && (
          <span className="size-6 rounded-full flex items-center justify-center">
            <Check className="size-3 text-slate-300" />
          </span>
        )}
      </div>
    </li>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Bell className="size-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700">
        {tab === "unread" ? "No unread notifications" : "You're all caught up"}
      </p>
      <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
        {tab === "unread"
          ? "All notifications have been read."
          : "New reactions, replies, and mentions will appear here."}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications } = useNotifications();
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.unread).length,
    [notifications],
  );

  const visible = useMemo(
    () => (activeTab === "unread" ? notifications.filter((n) => n.unread) : notifications),
    [notifications, activeTab],
  );

  function handleNavigate(n: AppNotification) {
    markNotificationRead(n.id);
    router.push(resolveHref(n));
  }

  function handleMark(id: string) {
    markNotificationRead(id);
  }

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "all", label: "All", count: unreadCount },
    { id: "unread", label: "Unread", count: unreadCount },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Page header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-5">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2.5">
              <Bell className="size-4 text-slate-600" />
              <h1 className="text-[15px] font-semibold text-slate-800">Notifications</h1>
              {unreadCount > 0 && (
                <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <button
              onClick={markAllNotificationsRead}
              disabled={unreadCount === 0}
              className="text-xs font-medium text-amber-600 hover:underline cursor-pointer disabled:text-slate-300 disabled:cursor-not-allowed disabled:no-underline transition-colors"
            >
              Mark all as read
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 -mb-px">
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer",
                    active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                        active ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                  {active && (
                    <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-amber-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-2xl mx-auto">
        {visible.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <ul className="bg-white mt-4 rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {visible.map((n) => (
              <NotifRow
                key={n.id}
                n={n}
                onMark={handleMark}
                onNavigate={handleNavigate}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
