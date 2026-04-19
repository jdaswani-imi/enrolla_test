"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, HelpCircle, LogOut, Search, Settings as SettingsIcon, Shield, User } from "lucide-react";

import { currentUser, notificationCount } from "@/lib/mock-data";
import { useRole } from "@/lib/role-context";
import { type Role } from "@/lib/role-config";
import { cn } from "@/lib/utils";

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
  "/feedback":   "Feedback",
  "/inventory":  "Inventory",
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

const MOCK_NOTIFICATIONS = [
  { title: "Overdue invoice — Aisha Rahman",       time: "2 min ago",  unread: true  },
  { title: "New lead — Bilal Mahmood (Y7 Maths)",  time: "14 min ago", unread: true  },
  { title: "Concern raised — L1, Y8 Maths",        time: "1 hr ago",   unread: true  },
  { title: "Assessment completed — Ahmed Saleh",   time: "2 hr ago",   unread: false },
];

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
  const [toast, setToast] = useState("");
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

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }

  function go(path: string) {
    setOpen(false);
    router.push(path);
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
                onClick={() => {
                  setOpen(false);
                  showToast("Sign out — coming soon");
                }}
                className="w-full text-left px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-2.5"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-[300]">
          {toast}
        </div>
      )}
    </>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export function TopBar() {
  const pathname = usePathname();
  const title = routeTitles[pathname] ?? "Enrolla";

  const [notificationsOpen, setNotificationsOpen] = useState(false);

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
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64 focus-within:bg-white focus-within:border-amber-400 transition-all">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search students, leads, invoices..."
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
          />
        </div>

        {/* Role switcher */}
        <RoleSwitcher />

        {/* Notifications */}
        <div id="bell-container" className="relative">
          <button
            aria-label={`${notificationCount} notifications`}
            onClick={() => setNotificationsOpen((o) => !o)}
            className="relative p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Bell className="size-4" />
            {notificationCount > 0 && (
              <span className="notification-dot absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-800 text-sm">Notifications</span>
                <button onClick={() => setNotificationsOpen(false)} className="text-xs text-amber-600 cursor-pointer hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {MOCK_NOTIFICATIONS.map((n, i) => (
                  <div
                    key={i}
                    className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${n.unread ? "bg-amber-50/50" : ""}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.unread ? "bg-amber-500" : "bg-transparent"}`} />
                    <div>
                      <p className="text-sm text-slate-800 leading-snug">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-3 border-t border-slate-100 text-center">
                <button onClick={() => setNotificationsOpen(false)} className="text-xs text-amber-600 cursor-pointer hover:underline">
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
