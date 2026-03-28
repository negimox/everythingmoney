"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import AtomIcon from "@/components/icons/atom";
import BracketsIcon from "@/components/icons/brackets";
import ProcessorIcon from "@/components/icons/proccesor";
import { Bullet } from "@/components/ui/bullet";
import { SlidersHorizontal, PieChart, Activity, Newspaper, Eye, Landmark } from "lucide-react";
import LockIcon from "@/components/icons/lock";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { EditProfileDialog } from "@/components/advisor/edit-profile-dialog";
import { OnboardingGuard } from "@/components/advisor/onboarding-guard";

// This is sample data for the sidebar
const data = {
  navMain: [
    {
      title: "Platform",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: BracketsIcon,
          locked: false,
        },
        {
          title: "Research",
          url: "/research",
          icon: AtomIcon,
          locked: false,
        },
        {
          title: "Portfolio",
          url: "/portfolio",
          icon: ProcessorIcon,
          locked: false,
        },
        {
          title: "Watchlist",
          url: "/watchlist",
          icon: Eye,
          locked: false,
        },
        {
          title: "Financial Data",
          url: "/financial-data",
          icon: Landmark,
          locked: false,
        },
      ],
    },
    {
      title: "Tools",
      items: [
        {
          title: "Stock Screener",
          url: "/screener",
          icon: SlidersHorizontal,
          locked: false,
        },
        {
          title: "Mutual Funds",
          url: "/funds",
          icon: PieChart,
          locked: false,
        },
        {
          title: "Market Sentiment",
          url: "/sentiment",
          icon: Activity,
          locked: false,
        },
        {
          title: "News & Analysis",
          url: "/news",
          icon: Newspaper,
          locked: false,
        },
      ],
    },
  ],
};

export function LeftSidebar({
  className,
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <OnboardingGuard>
      <Sidebar collapsible="icon" {...props} className={cn("py-4", className)}>
      <SidebarHeader className="rounded-t-lg flex flex-row rounded-b-none p-2 items-center justify-center">
        <div className="flex items-center justify-center w-full px-2">
          <Image 
            src="/logo.png" 
            alt="Everything Money" 
            width={160} 
            height={40} 
            className="h-8 w-auto object-contain group-data-[collapsible=icon]:hidden"
          />
          {/* Small logo for collapsed state */}
          <div className="hidden group-data-[collapsible=icon]:flex size-8 items-center justify-center translate-x-[4px]">
             <Image src="/logo-small.png" alt="E" width={32} height={32} className="size-8 object-contain" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {data.navMain.map((group, i) => (
          <SidebarGroup
            className={cn(i === 0 && "rounded-t-none")}
            key={group.title}
          >
            <SidebarGroupLabel>
              <Bullet className="mr-2 group-data-[collapsible=icon]:hidden" />
              {group.title}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                   // Simple active check
                   const isActive = item.url === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(item.url);
                   
                   return (
                    <SidebarMenuItem
                      key={item.title}
                      className={cn(
                        item.locked && "pointer-events-none opacity-50"
                      )}
                    >
                    <SidebarMenuButton
                      asChild={!item.locked}
                      isActive={isActive}
                      disabled={item.locked}
                      tooltip={item.title}
                      className={cn(
                        "disabled:cursor-not-allowed",
                        item.locked && "pointer-events-none"
                      )}
                    >
                      {item.locked ? (
                        <div className="flex items-center gap-3 w-full">
                          <item.icon className="size-5" />
                          <span>{item.title}</span>
                        </div>
                      ) : (
                        <a href={item.url}>
                          <item.icon className="size-5" />
                          <span>{item.title}</span>
                        </a>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )})}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            <Bullet className="mr-2" />
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <EditProfileDialog />
              <SidebarMenuItem className="flex items-center justify-center p-1">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "size-8",
                    },
                  }}
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
    </OnboardingGuard>
  );
}
