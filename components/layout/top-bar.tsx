"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  AtSign,
  Bell,
  CalendarClock,
  CheckSquare,
  ChevronDown,
  DollarSign,
  FileText,
  FileWarning,
  GraduationCap,
  HelpCircle,
  LogOut,
  MessageSquare,
  Settings as SettingsIcon,
  Shield,
  User,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { currentUser } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { type Role } from "@/lib/role-config";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./global-search";

const routeTitles: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/people":     "People",
  "/students":   "Students",
  "/guardians":  "Guardians",
  "/leads":      "Leads",
  "/enrolment":  "Enrolment",
  "/timetable":  "Timetable",
  "/attendance": "Attendance",
  "/assessments":"Assessments",
  "/progress":   "Progress",
  "/finance":    "Billing & Invoices",
  "/finance/invoice/new": "New Invoice",
  "/staff":      "Staff",
  "/tasks":      "Tasks",
  "/analytics":  "Analytics",
  "/reports":    "Reports",
  "/settings":   "Settings",
  "/profile":    "My Profile",
  "/automations":"Automations",
  "/feedback":        "Feedback",
  "/communications":  "Communications",
  "/inventory":       "Inventory",
};

const ROLES: Role[] = [
  "Super Admin",
  "Admin Head",
  "Admin",
  "Academic Head",
  "HOD",
  "Teacher",
  "TA",
  "HR/Finance",
];

const initials = currentUser.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .slice(0, 2);

// ─── Notifications ────────────────────────────────────────────────────────────

type NotificationType =
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

type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  time: string;
  href: string;
  unread: boolean;
  urgent?: boolean;
  mention?: boolean;
};

const NOTIFICATION_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  "invoice-overdue": FileWarning,
  feedback: MessageSquare,
  concern: AlertTriangle,
  trial: UserCheck,
  task: CheckSquare,
  report: FileText,
  lead: UserPlus,
  payment: DollarSign,
  leave: CalendarClock,
  cpd: GraduationCap,
  mention: AtSign,
};

const NOTIFICATION_ICON_TONE: Record<NotificationType, string> = {
  "invoice-overdue": "bg-rose-50 text-rose-600",
  feedback: "bg-sky-50 text-sky-600",
  concern: "bg-rose-50 text-rose-600",
  trial: "bg-emerald-50 text-emerald-600",
  task: "bg-violet-50 text-violet-600",
  report: "bg-amber-50 text-amber-600",
  lead: "bg-indigo-50 text-indigo-600",
  payment: "bg-emerald-50 text-emerald-600",
  leave: "bg-slate-100 text-slate-600",
  cpd: "bg-amber-50 text-amber-600",
  mention: "bg-blue-50 text-blue-600",
};

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n-1",
    type: "invoice-overdue",
    title: "Invoice #1042 overdue · Layla Hassan · AED 3,200",
    time: "2 min ago",
    href: "/finance",
    unread: true,
    urgent: true,
  },
  {
    id: "n-2",
    type: "concern",
    title: "L1 concern escalated to L2 · Aisha Rahman · Y8 Maths",
    time: "14 min ago",
    href: "/progress",
    unread: true,
    urgent: true,
  },
  {
    id: "n-3",
    type: "feedback",
    title: "Ahmed Khalil submitted feedback · Omar Al-Farsi · Y5 Maths",
    time: "38 min ago",
    href: "/feedback",
    unread: true,
    mention: true,
  },
  {
    id: "n-4",
    type: "task",
    title: "Task due: Review Y8 progress report draft",
    time: "1 hr ago",
    href: "/tasks",
    unread: true,
  },
  {
    id: "n-5",
    type: "trial",
    title: "Trial converted · Hessa Al-Blooshi · Y4 Maths",
    time: "2 hr ago",
    href: "/enrolment",
    unread: true,
  },
  {
    id: "n-6",
    type: "lead",
    title: "New enquiry via WhatsApp · Y6 Science",
    time: "3 hr ago",
    href: "/leads",
    unread: true,
  },
  {
    id: "n-7",
    type: "payment",
    title: "AED 1,800 received · Ziad Khalil · Y3 Maths",
    time: "4 hr ago",
    href: "/finance",
    unread: true,
  },
  {
    id: "n-8",
    type: "mention",
    title: "Sara Al-Mansoori mentioned you · \"Can you review Y10 Physics roster?\"",
    time: "5 hr ago",
    href: "/tasks",
    unread: true,
    mention: true,
  },
  {
    id: "n-9",
    type: "report",
    title: "Progress report pending · Khalid Mansour · Y12 Maths",
    time: "Yesterday",
    href: "/progress",
    unread: false,
  },
  {
    id: "n-10",
    type: "leave",
    title: "Khalil Mansouri requested leave · 22 Apr",
    time: "Yesterday",
    href: "/staff",
    unread: false,
  },
  {
    id: "n-11",
    type: "cpd",
    title: "CPD target at risk · Ahmed Khalil · 8/20 hrs",
    time: "2 days ago",
    href: "/staff",
    unread: false,
  },
  {
    id: "n-12",
    type: "feedback",
    title: "New feedback submitted · Layla Hassan · Y6 English",
    time: "3 days ago",
    href: "/feedback",
    unread: false,
  },
];

type NotificationTab = "all" | "unread" | "mentions";

// ─── Role Switcher ────────────────────────────────────────────────────────────

function RoleSwitcher() {
  const { role, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
        aria-label="Switch role"
      >
        <Shield className="w-3 h-3 flex-shrink-0" />
        <span className="max-w-[100px] truncate">{role}</span>
        <ChevronDown className={cn("w-3 h-3 opacity-60 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-[200] overflow-hidden min-w-[170px]">
          <div className="px-3 py-2 border-b border-slate-100">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Switch role (demo)</p>
          </div>
          <div className="py-1">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r); setOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-1.5 text-sm transition-colors cursor-pointer flex items-center gap-2",
                  r === role
                    ? "bg-amber-50 text-amber-700 font-medium"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                {r === role && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />}
                {r !== role && <span className="w-1.5 h-1.5 flex-shrink-0" />}
                {r}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── User Menu ────────────────────────────────────────────────────────────────

function UserMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  function go(path: string) {
    setOpen(false);
    router.push(path);
  }

  function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setOpen(false);
    toast.success("Signed out successfully", { duration: 1500 });
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={`${currentUser.name} — account menu`}
          aria-expanded={open}
          className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-amber-400 hover:ring-offset-1 transition-all overflow-hidden"
        >
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-slate-900 font-bold text-[11px] leading-none">{initials}</span>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-[200] overflow-hidden">
            {/* Header */}
            <div className="px-3 py-3 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {currentUser.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-slate-900 font-bold text-xs leading-none">{initials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 truncate">{currentUser.name}</p>
                <p className="text-[11px] text-amber-600 font-medium">{currentUser.role}</p>
                <p className="text-[11px] text-slate-400 truncate">j.daswani@improvemeinstitute.com</p>
              </div>
            </div>

            {/* Items */}
            <div className="py-1">
              <button
                onClick={() => go("/profile")}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2.5"
              >
                <User className="w-4 h-4 text-slate-400" />
                My Profile
              </button>
              <button
                onClick={() => go("/settings")}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-2.5"
              >
                <SettingsIcon className="w-4 h-4 text-slate-400" />
                Settings
              </button>
            </div>

            <div className="border-t border-slate-100 py-1">
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <LogOut className="w-4 h-4" />
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const title = routeTitles[pathname] ?? "Enrolla";

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");

  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);
  const mentionCount = useMemo(() => notifications.filter((n) => n.mention).length, [notifications]);

  const visibleNotifications = useMemo(() => {
    if (activeTab === "unread") return notifications.filter((n) => n.unread);
    if (activeTab === "mentions") return notifications.filter((n) => n.mention);
    return notifications;
  }, [notifications, activeTab]);

  function markAllAsRead() {
    setNotifications((list) => list.map((n) => ({ ...n, unread: false })));
  }

  function handleNotificationClick(n: Notification) {
    setNotifications((list) => list.map((item) => (item.id === n.id ? { ...item, unread: false } : item)));
    setNotificationsOpen(false);
    router.push(n.href);
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNotificationsOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;
    function handleOutside(e: MouseEvent) {
      const bell = document.getElementById("bell-container");
      if (bell && !bell.contains(e.target as Node)) setNotificationsOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [notificationsOpen]);

  return (
    <header className="h-14 flex items-center px-4 bg-white border-b border-slate-200 flex-shrink-0 gap-4">
      {/* Page Title */}
      <div className="flex items-center flex-1 min-w-0">
        <h1 className="text-[15px] font-semibold text-slate-800 truncate">{title}</h1>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <GlobalSearch />

        {/* Role switcher */}
        <RoleSwitcher />

        {/* Notifications */}
        <div id="bell-container" className="relative">
          <button
            aria-label={`${unreadCount} unread notifications`}
            onClick={() => setNotificationsOpen((o) => !o)}
            className="relative p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Bell className="size-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold leading-none flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-[380px] bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden flex flex-col">
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="text-xs text-amber-600 cursor-pointer hover:underline disabled:text-slate-300 disabled:cursor-not-allowed disabled:no-underline"
                >
                  Mark all as read
                </button>
              </div>

              {/* Tab strip */}
              <div className="flex items-center gap-1 px-2 pt-2 border-b border-slate-100">
                {([
                  { id: "all" as const,      label: "All",      count: notifications.length },
                  { id: "unread" as const,   label: "Unread",   count: unreadCount },
                  { id: "mentions" as const, label: "Mentions", count: mentionCount },
                ]).map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-md transition-colors cursor-pointer",
                        active
                          ? "text-slate-900"
                          : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span
                          className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded-full font-semibold",
                            active ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                          )}
                        >
                          {tab.count}
                        </span>
                      )}
                      {active && (
                        <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-amber-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* List */}
              <div className="max-h-[500px] overflow-y-auto">
                {visibleNotifications.length === 0 ? (
                  <div className="px-4 py-12 flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                      <Bell className="w-4 h-4 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">You&apos;re all caught up</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeTab === "unread"
                        ? "No unread notifications"
                        : activeTab === "mentions"
                        ? "No mentions yet"
                        : "No notifications"}
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {visibleNotifications.map((n) => {
                      const Icon = NOTIFICATION_ICONS[n.type];
                      return (
                        <li key={n.id}>
                          <button
                            onClick={() => handleNotificationClick(n)}
                            className={cn(
                              "w-full text-left px-4 py-3 flex gap-3 cursor-pointer transition-colors hover:bg-slate-50 border-l-2",
                              n.unread
                                ? "bg-blue-50/40 border-l-blue-500"
                                : "bg-white border-l-transparent"
                            )}
                          >
                            <div
                              className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                NOTIFICATION_ICON_TONE[n.type]
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                <p
                                  className={cn(
                                    "text-[13px] leading-snug flex-1",
                                    n.unread ? "text-slate-900 font-medium" : "text-slate-600"
                                  )}
                                >
                                  {n.title}
                                </p>
                                {n.urgent && (
                                  <span
                                    aria-label="urgent"
                                    className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 mt-1.5"
                                  />
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1">{n.time}</p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="text-xs font-medium text-amber-600 cursor-pointer hover:underline"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Help */}
        <button
          title="Help & documentation"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all text-sm cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden lg:inline text-xs font-medium">Help</span>
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* User avatar with dropdown menu */}
        <UserMenu />
      </div>
    </header>
  );
}
