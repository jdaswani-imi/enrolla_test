"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart2,
  Briefcase,
  Calendar,
  CheckCircle,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  Funnel,
  Home,
  LogOut,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { currentUser } from "@/lib/mock-data";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navSections = [
  {
    label: "Main",
    items: [
      { label: "Dashboard", icon: Home, href: "/dashboard" },
      { label: "Students", icon: Users, href: "/students" },
      { label: "Leads", icon: Funnel, href: "/leads" },
      { label: "Enrolment", icon: ClipboardList, href: "/enrolment" },
    ],
  },
  {
    label: "Academic",
    items: [
      { label: "Timetable", icon: Calendar, href: "/timetable" },
      { label: "Attendance", icon: CheckSquare, href: "/attendance" },
      { label: "Assessments", icon: ClipboardCheck, href: "/assessments" },
      { label: "Progress", icon: TrendingUp, href: "/progress" },
    ],
  },
  {
    label: "Finance",
    items: [
      { label: "Billing & Invoices", icon: CreditCard, href: "/finance" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Staff", icon: Briefcase, href: "/staff" },
      { label: "Tasks", icon: CheckCircle, href: "/tasks" },
    ],
  },
  {
    label: "Management",
    items: [
      { label: "Analytics", icon: BarChart2, href: "/analytics" },
      { label: "Reports", icon: FileText, href: "/reports" },
    ],
  },
  {
    label: "Settings",
    items: [{ label: "Settings", icon: Settings, href: "/settings" }],
  },
];

const initials = currentUser.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .slice(0, 2);

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      {/* Header: Logo + Org */}
      <SidebarHeader className="px-4 py-4 border-b border-white/6">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          {/* Enrolla wordmark icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <span className="text-slate-900 font-bold text-sm leading-none">E</span>
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-white font-semibold text-sm leading-tight tracking-wide">
              Enrolla
            </span>
            <span className="text-slate-400 text-[11px] leading-tight mt-0.5">
              {currentUser.org} — Tutoring Centre
            </span>
          </div>
        </div>
      </SidebarHeader>

      {/* Nav */}
      <SidebarContent className="py-2">
        {navSections.map((section) => (
          <SidebarGroup key={section.label} className="py-1">
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-slate-600 font-medium px-3 mb-1">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        tooltip={item.label}
                        className={cn(
                          "relative h-9 rounded-md transition-colors duration-150 cursor-pointer",
                          isActive
                            ? [
                                "bg-white/10 text-white font-semibold",
                                "before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-r-full before:bg-amber-500",
                              ]
                            : "text-slate-400 hover:text-white hover:bg-slate-800/60 font-normal"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "size-4 flex-shrink-0",
                            isActive ? "text-amber-500" : "text-slate-400"
                          )}
                        />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer: User */}
      <SidebarFooter className="border-t border-slate-700 p-3">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center hover:bg-slate-800 rounded-lg px-2 py-1.5 -mx-2 transition-colors duration-150 cursor-default">
          {/* Avatar */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
            <span className="text-slate-900 font-bold text-xs leading-none">
              {initials}
            </span>
          </div>

          {/* User info */}
          <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="text-white text-sm font-medium leading-tight truncate">
              {currentUser.name}
            </span>
            <span className="inline-flex items-center mt-0.5">
              <span className="text-[10px] font-medium text-amber-400 bg-amber-400/10 rounded px-1.5 py-0.5 leading-none">
                {currentUser.role}
              </span>
            </span>
          </div>

          {/* Logout */}
          <button
            aria-label="Log out"
            className="flex-shrink-0 p-1.5 rounded-md text-slate-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
