"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BarChart,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  DollarSign,
  Download,
  FileText,
  Filter,
  GraduationCap,
  Layers,
  LayoutDashboard,
  MessageSquare,
  Receipt,
  Settings,
  TrendingUp,
  User,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";

import { currentUser } from "@/lib/mock-data";
import { usePermission } from "@/lib/use-permission";

// ─── Types ────────────────────────────────────────────────────────────────────

type SubItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  navId: string;
};

type FlyoutSection = {
  label: string;
  items: SubItem[];
};

type LinkNavItemDef = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  type: "link";
};

type FlyoutNavItemDef = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  type: "flyout";
  sections: FlyoutSection[];
};

type NavItemDef = LinkNavItemDef | FlyoutNavItemDef;

// ─── Nav data ─────────────────────────────────────────────────────────────────

const navItems: NavItemDef[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    type: "link",
  },
  {
    id: "people",
    label: "People",
    icon: User,
    type: "flyout",
    sections: [
      {
        label: "Overview",
        items: [
          { label: "Dashboard", href: "/people", icon: LayoutDashboard, navId: "people" },
        ],
      },
      {
        label: "Students",
        items: [
          { label: "Students",  href: "/students",  icon: UserCheck, navId: "students"  },
          { label: "Guardians", href: "/guardians", icon: Users,     navId: "guardians" },
        ],
      },
      {
        label: "Pipeline",
        items: [
          { label: "Leads",       href: "/leads",       icon: Filter,        navId: "leads"       },
          { label: "Enrolment",   href: "/enrolment",   icon: ClipboardList, navId: "enrolment"   },
          { label: "Assessments", href: "/assessments", icon: ClipboardCheck,navId: "assessments" },
        ],
      },
      {
        label: "Tools",
        items: [
          { label: "Segments", href: "/people?tab=Segments", icon: Layers,   navId: "people" },
          { label: "Forms",    href: "/people?tab=Forms",    icon: FileText,  navId: "people" },
          { label: "Exports",  href: "/people?tab=Exports",  icon: Download,  navId: "people" },
        ],
      },
    ],
  },
  {
    id: "timetable",
    label: "Timetable",
    icon: Calendar,
    href: "/timetable",
    type: "link",
  },
  {
    id: "attendance",
    label: "Attendance",
    icon: ClipboardCheck,
    href: "/attendance",
    type: "link",
  },
  {
    id: "academic",
    label: "Academic",
    icon: GraduationCap,
    type: "flyout",
    sections: [
      {
        label: "Communications",
        items: [
          { label: "Feedback", href: "/feedback", icon: MessageSquare, navId: "feedback" },
        ],
      },
      {
        label: "Learning",
        items: [
          { label: "Progress",    href: "/progress",                 icon: TrendingUp, navId: "progress" },
          { label: "Assignments", href: "/progress?tab=assignments", icon: BookOpen,   navId: "progress" },
        ],
      },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: CreditCard,
    type: "flyout",
    sections: [
      {
        label: "Billing",
        items: [
          { label: "Invoices & Payments", href: "/finance",             icon: Receipt,    navId: "finance" },
          { label: "Credits",             href: "/finance?tab=credits", icon: DollarSign, navId: "finance" },
        ],
      },
    ],
  },
  {
    id: "reporting",
    label: "Reporting",
    icon: BarChart,
    type: "flyout",
    sections: [
      {
        label: "Insights",
        items: [
          { label: "Analytics", href: "/analytics", icon: BarChart,  navId: "analytics" },
          { label: "Reports",   href: "/reports",   icon: FileText,  navId: "reports"   },
        ],
      },
    ],
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: CheckCircle,
    href: "/tasks",
    type: "link",
  },
  {
    id: "automations",
    label: "Automations",
    icon: Zap,
    href: "/automations",
    type: "link",
  },
  {
    id: "staff",
    label: "Staff",
    icon: Briefcase,
    href: "/staff",
    type: "link",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    href: "/settings",
    type: "link",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Divider() {
  return <div className="my-3 mx-auto w-6 border-t border-slate-700/40" />;
}

// ─── Direct link nav item ─────────────────────────────────────────────────────

function LinkNavItem({ item }: { item: LinkNavItemDef }) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(item.href + "/");

  return (
    <div className="relative w-full flex items-center justify-center py-0.5">
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-amber-400 rounded-r-full z-10" />
      )}
      <Link
        href={item.href}
        aria-label={item.label}
        className={[
          "relative group w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150",
          isActive
            ? "bg-slate-700/80 text-amber-400"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
        ].join(" ")}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {/* Hover label */}
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[999] shadow-lg border border-slate-700">
          {item.label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
        </div>
      </Link>
    </div>
  );
}

// ─── Flyout panel ─────────────────────────────────────────────────────────────

function FlyoutPanel({
  item,
  onClose,
  triggerRef,
}: {
  item: FlyoutNavItemDef;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        ref.current &&
        !ref.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose, triggerRef]);

  return (
    <div
      ref={ref}
      className="fixed left-14 top-0 h-screen w-56 bg-[#1E293B] border-r border-slate-700 z-[998] shadow-2xl flex flex-col"
      style={{ animation: "slideInLeft 0.15s ease-out" }}
    >
      {/* Panel header */}
      <div className="px-4 pt-5 pb-3 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <item.icon className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">{item.label}</span>
        </div>
      </div>

      {/* Sections */}
      <div className="py-3 overflow-y-auto flex-1 min-h-0">
        {item.sections.map((section, si) => (
          <div key={si} className={si > 0 ? "mt-4" : ""}>
            {item.sections.length > 1 && (
              <div className="px-4 pb-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                  {section.label}
                </span>
              </div>
            )}
            {section.items.map((subItem) => {
              const isActive =
                pathname === subItem.href ||
                pathname.startsWith(subItem.href.split("?")[0] + "/");
              return (
                <Link
                  key={subItem.href + subItem.label}
                  href={subItem.href}
                  onClick={onClose}
                  className={[
                    "flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                    isActive
                      ? "bg-amber-500/20 text-amber-400 font-medium"
                      : "text-slate-300 hover:bg-slate-700/50 hover:text-white",
                  ].join(" ")}
                >
                  <subItem.icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? "text-amber-400" : "text-slate-400"
                    }`}
                  />
                  {subItem.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Flyout trigger nav item ──────────────────────────────────────────────────

function FlyoutNavItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FlyoutNavItemDef;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isActive = item.sections.some((s) =>
    s.items.some(
      (i) =>
        pathname === i.href ||
        pathname.startsWith(i.href.split("?")[0] + "/")
    )
  );

  return (
    <div className="relative w-full flex items-center justify-center py-0.5">
      {(isActive || isOpen) && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-amber-400 rounded-r-full z-10" />
      )}
      <button
        ref={buttonRef}
        onClick={onToggle}
        aria-label={item.label}
        aria-expanded={isOpen}
        className={[
          "relative group w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer",
          isActive || isOpen
            ? "bg-slate-700/80 text-amber-400"
            : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
        ].join(" ")}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {/* Hover label — only when panel is closed */}
        {!isOpen && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[999] shadow-lg border border-slate-700">
            {item.label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
          </div>
        )}
      </button>

      {isOpen && (
        <FlyoutPanel item={item} onClose={onToggle} triggerRef={buttonRef} />
      )}
    </div>
  );
}

// ─── Initials ─────────────────────────────────────────────────────────────────

const initials = currentUser.name
  .split(" ")
  .map((n) => n[0])
  .join("")
  .slice(0, 2);

// ─── Main sidebar ─────────────────────────────────────────────────────────────

export function AppSidebar() {
  const { sees, role } = usePermission();
  const pathname = usePathname();
  const [openFlyout, setOpenFlyout] = useState<string | null>(null);

  // Close flyout on route change
  useEffect(() => {
    setOpenFlyout(null);
  }, [pathname]);

  function toggleFlyout(id: string) {
    setOpenFlyout((prev) => (prev === id ? null : id));
  }

  // ── Filter nav items by role permissions ────────────────────────────────────
  const dashboard = navItems[0] as LinkNavItemDef; // always visible

  const mainItems = (navItems.slice(1, 7) as NavItemDef[]).reduce<NavItemDef[]>((acc, item) => {
    if (item.type === "link") {
      if (sees(item.id)) acc.push(item);
    } else {
      const fly = item as FlyoutNavItemDef;
      const filteredSections = fly.sections
        .map((s) => ({ ...s, items: s.items.filter((si) => sees(si.navId)) }))
        .filter((s) => s.items.length > 0);
      if (filteredSections.length > 0) {
        acc.push({ ...fly, sections: filteredSections });
      }
    }
    return acc;
  }, []);

  const midItems = (navItems.slice(7, 10) as LinkNavItemDef[]).filter((item) => sees(item.id));
  const settingsItem = sees("settings") ? (navItems[10] as LinkNavItemDef) : undefined;

  return (
    <aside className="w-14 h-screen bg-[#0F172A] flex flex-col items-center py-4 flex-shrink-0 border-r border-slate-800">
      {/* Logo */}
      <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center mb-6 flex-shrink-0">
        <span className="text-white font-bold text-sm">E</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col items-center gap-0.5 flex-1 w-full">
        {/* Dashboard — always visible */}
        <LinkNavItem item={dashboard} />

        <Divider />

        {/* Main items */}
        {mainItems.map((item) =>
          item.type === "link" ? (
            <LinkNavItem key={item.id} item={item as LinkNavItemDef} />
          ) : (
            <FlyoutNavItem
              key={item.id}
              item={item as FlyoutNavItemDef}
              isOpen={openFlyout === item.id}
              onToggle={() => toggleFlyout(item.id)}
            />
          )
        )}

        {midItems.length > 0 && (
          <>
            <Divider />
            {midItems.map((item) => (
              <LinkNavItem key={item.id} item={item} />
            ))}
          </>
        )}

        {/* Settings — pushed to bottom */}
        {settingsItem && (
          <div className="mt-auto w-full flex flex-col">
            <Divider />
            <LinkNavItem item={settingsItem} />
          </div>
        )}
      </nav>

      {/* User avatar */}
      <div className="mt-4 relative group cursor-pointer">
        <div className="w-9 h-9 rounded-full bg-amber-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-[999] shadow-lg border border-slate-700">
          {currentUser.name}
          <div className="text-amber-400 font-normal text-[10px]">
            {role}
          </div>
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
        </div>
      </div>
    </aside>
  );
}
