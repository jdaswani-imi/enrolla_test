"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, CircleHelp, Search, X } from "lucide-react";

import { currentUser, notificationCount } from "@/lib/mock-data";
import { SidebarTrigger } from "@/components/ui/sidebar";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/leads": "Leads",
  "/enrolment": "Enrolment",
  "/timetable": "Timetable",
  "/attendance": "Attendance",
  "/assessments": "Assessments",
  "/progress": "Progress",
  "/finance": "Billing & Invoices",
  "/staff": "Staff",
  "/tasks": "Tasks",
  "/analytics": "Analytics",
  "/reports": "Reports",
  "/settings": "Settings",
};

const initials = currentUser.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .slice(0, 2);

export function TopBar() {
  const pathname = usePathname();
  const title = routeTitles[pathname] ?? "Enrolla";

  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="h-14 flex items-center px-4 bg-white border-b border-slate-200 flex-shrink-0 gap-4">
      {/* Toggle + Page Title */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <SidebarTrigger className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer" />
        <div className="w-px h-5 bg-slate-200" />
        <h1 className="text-[15px] font-semibold text-slate-800 truncate">
          {title}
        </h1>
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        {/* Search — expands on click */}
        <div className="flex items-center">
          {searchOpen ? (
            <div className="flex items-center gap-1 w-64 transition-all duration-200">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search students, invoices, leads..."
                  className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                />
              </div>
              <button
                aria-label="Close search"
                onClick={() => setSearchOpen(false)}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Search className="size-4" />
            </button>
          )}
        </div>

        {/* Notifications */}
        <button
          aria-label={`${notificationCount} notifications`}
          className="relative p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell className="size-4" />
          {notificationCount > 0 && (
            <span className="notification-dot absolute top-1.5 right-1.5 w-[7px] h-[7px] rounded-full bg-amber-500 ring-2 ring-white" />
          )}
        </button>

        {/* Help */}
        <button
          aria-label="Help"
          className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <CircleHelp className="size-4" />
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 mx-1" />

        {/* User avatar */}
        <button
          aria-label={`${currentUser.name} — account menu`}
          className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-amber-400 hover:ring-offset-1 transition-all"
        >
          <span className="text-slate-900 font-bold text-[11px] leading-none">
            {initials}
          </span>
        </button>
      </div>
    </header>
  );
}
