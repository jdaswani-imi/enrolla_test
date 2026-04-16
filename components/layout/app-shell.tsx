"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarInset, useSidebar } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { setOpen } = useSidebar();

  useEffect(() => {
    if (pathname === "/leads") {
      setOpen(false);
    } else {
      setOpen(true);
    }
  }, [pathname, setOpen]);

  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <div className="sticky top-0 z-30 flex-shrink-0">
          <TopBar />
        </div>
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
          <div key={pathname} className="page-enter min-h-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
