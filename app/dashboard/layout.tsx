import React from "react";
import { cookies } from "next/headers";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { LeftSidebar } from "@/components/dashboard/sidebar/left-sidebar";
import { RightSidebar } from "@/components/dashboard/sidebar/right-sidebar";
import { OnboardingGuard } from "@/components/advisor/onboarding-guard";
import mockDataJson from "@/mock.json";
import type { MockData } from "@/types/dashboard";

const mockData = mockDataJson as unknown as MockData;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const leftSidebarState = cookieStore.get("sidebar:state");
  const rightSidebarState = cookieStore.get("sidebar:right_state");
  const leftSidebarWidth = cookieStore.get("sidebar:width");
  const rightSidebarWidth = cookieStore.get("sidebar:right_width");

  const defaultOpenLeft = leftSidebarState ? leftSidebarState.value === "true" : true;
  const defaultOpenRight = rightSidebarState ? rightSidebarState.value === "true" : true;
  const defaultWidthLeft = leftSidebarWidth ? leftSidebarWidth.value : "18rem";
  const defaultWidthRight = rightSidebarWidth ? rightSidebarWidth.value : "22rem";

  return (
    <OnboardingGuard>
      {/* Outer Provider for Left Sidebar */}
      <SidebarProvider defaultOpen={defaultOpenLeft} defaultWidth={defaultWidthLeft} cookieName="sidebar:state">
        <LeftSidebar />
        
        {/* Main Content Area + Right Sidebar Scope */}
        <SidebarInset>
          {/* Mobile Header - only visible on mobile */}
          <MobileHeader mockData={mockData} />

          <div className="flex flex-1 h-full overflow-hidden">
             {/* Inner Provider for Right Sidebar */}
             <SidebarProvider 
                defaultOpen={defaultOpenRight} 
                defaultWidth={defaultWidthRight}
                cookieName="sidebar:right_state"
                className="flex-1 flex flex-row h-full overflow-hidden"
             >
                <main className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto relative">
                   <div className="p-4 md:p-6 lg:p-8 flex-1">
                      {children}
                   </div>
                </main>
                <RightSidebar />
             </SidebarProvider>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </OnboardingGuard>
  );
}
