"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, HelpCircle, Search } from "lucide-react";

import { currentUser, notificationCount } from "@/lib/mock-data";
import { SidebarTrigger } from "@/components/ui/sidebar";

const routeTitles: Record<string, string> = {
  "/dashboard":  "Dashboard",
  "/students":   "Students",
  "/leads":      "Leads",
  "/enrolment":  "Enrolment",
  "/timetable":  "Timetable",
  "/attendance": "Attendance",
  "/assessments":"Assessments",
  "/progress":   "Progress",
  "/finance":    "Billing & Invoices",
  "/staff":      "Staff",
  "/tasks":      "Tasks",
  "/analytics":  "Analytics",
  "/reports":    "Reports",
  "/settings":   "Settings",
};

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
      {/* Toggle + Page Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <SidebarTrigger className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer" />
        <div className="w-px h-5 bg-slate-200" />
        <h1 className="text-[15px] font-semibold text-slate-800 truncate">{title}</h1>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        {/* Search — always visible */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 w-64 focus-within:bg-white focus-within:border-amber-400 transition-all">
          <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search students, leads, invoices..."
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none w-full"
          />
        </div>

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

        {/* User avatar */}
        <button
          aria-label={`${currentUser.name} — account menu`}
          className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-amber-400 hover:ring-offset-1 transition-all"
        >
          <span className="text-slate-900 font-bold text-[11px] leading-none">{initials}</span>
        </button>
      </div>
    </header>
  );
}
