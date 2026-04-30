"use client";

import { useState, useEffect, useRef, useMemo } from "react"; // useEffect/useRef used in UserMenu
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  HelpCircle,
  LogOut,
  Settings as SettingsIcon,
  User,
} from "lucide-react";

import { useCurrentUser } from "@/lib/use-current-user";
import { useUserAvatar } from "@/lib/user-avatar-context";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { GlobalSearch } from "./global-search";
import { useNotifications } from "@/lib/notifications-store";

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
  "/notifications":   "Notifications",
};

// ─── User Menu ────────────────────────────────────────────────────────────────

function UserMenu() {
  const currentUser = useCurrentUser();
  const initials = currentUser.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
  const router = useRouter();
  const { avatarUrl } = useUserAvatar();
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

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
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
          {avatarUrl ? (
            <img
              src={avatarUrl}
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
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
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
                <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
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

  const { notifications } = useNotifications();
  const unreadCount = useMemo(() => notifications.filter((n) => n.unread).length, [notifications]);

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

        {/* Notifications bell — navigates to /notifications */}
        <button
          aria-label={`${unreadCount} unread notifications`}
          onClick={() => router.push("/notifications")}
          className="relative p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold leading-none flex items-center justify-center ring-2 ring-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Help */}
        <button
          title="Help & documentation"
          aria-label="Help & documentation"
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all text-sm cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden lg:inline text-xs font-medium">Help</span>
        </button>

        {/* Divider */}
        <div className="hidden sm:block w-px h-5 bg-slate-200 mx-1" />

        {/* User avatar with dropdown menu */}
        <UserMenu />
      </div>
    </header>
  );
}
