"use client";

import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarInset } from "@/components/ui/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-svh">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] p-6">
          <div key={pathname} className="page-enter min-h-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
