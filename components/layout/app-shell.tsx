"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { useRole } from "@/lib/role-context";
import { type Role } from "@/lib/role-config";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setRole } = useRole();

  // Sync the role from the server on every app load so sessionStorage never
  // stays stale (e.g. after a role change or a session that predates local storage).
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok ? r.json() : null)
      .then((me) => { if (me?.role) setRole(me.role as Role); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (
    pathname === "/login" || pathname?.startsWith("/login/") ||
    pathname === "/onboarding" || pathname?.startsWith("/onboarding/") ||
    pathname === "/welcome" || pathname?.startsWith("/welcome/") ||
    pathname === "/auth/callback" || pathname?.startsWith("/auth/") ||
    pathname === "/reset-password" || pathname?.startsWith("/reset-password/")
  ) {
    return <div className="flex-1">{children}</div>;
  }

  return (
    <>
      <AppSidebar />
      <div className="flex flex-col h-screen overflow-hidden flex-1">
        <div className="sticky top-0 z-30 flex-shrink-0">
          <TopBar />
        </div>
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
          <div key={pathname} className="page-enter min-h-full">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
