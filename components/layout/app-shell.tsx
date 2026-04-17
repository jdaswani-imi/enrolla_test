"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

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
