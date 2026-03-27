import React from "react"
import { Google_Sans_Flex, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { MobileHeader } from "@/components/dashboard/mobile-header";
import { LeftSidebar } from "@/components/dashboard/sidebar/left-sidebar";
import { RightSidebar } from "@/components/dashboard/sidebar/right-sidebar";
import mockDataJson from "@/mock.json";
import type { MockData } from "@/types/dashboard";

const mockData = mockDataJson as unknown as MockData;

const googleSans = Google_Sans_Flex({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const merriweather = Source_Serif_4({
  subsets: ['latin'],
  // weight: ['300', '400', '700', '900'],
  display: 'swap',
  variable: '--font-display',
});



export const metadata: Metadata = {
  title: {
    template: "GTNinja",
    default: "GTNinja - Indian Stock Market Analysis",
  },
  description:
    "Investment analysis platform for Indian stocks, mutual funds, and ETFs. Research, analyze portfolios, and track market sentiment in real-time.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${googleSans.className} ${merriweather.variable} antialiased`}
      >
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
                       {/* Floating Sidebar Trigger moved into page content or header if needed, 
                           but standard is fine for now. 
                           However, shadcn Sidebar uses a cookie. 
                           Nesting same provider might conflict cookies without distinct ids.
                           Current implementation of SidebarProvider doesn't support 'id' prop for cookie names.
                           This might link the states (expanding one expands both).
                           We will proceed to verify this behavior.
                       */}
                       <div className="p-4 md:p-6 lg:p-8 flex-1">
                          {children}
                       </div>
                    </main>
                    <RightSidebar />
                 </SidebarProvider>
              </div>
            </SidebarInset>
          </SidebarProvider>
      </body>
    </html>
  );
}
