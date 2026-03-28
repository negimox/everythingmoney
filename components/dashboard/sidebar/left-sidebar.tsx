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
import MonkeyIcon from "@/components/icons/monkey";
import { Bullet } from "@/components/ui/bullet";
import { SlidersHorizontal, PieChart, Activity, Newspaper, Eye, Landmark } from "lucide-react";
import LockIcon from "@/components/icons/lock";
import { UserButton } from "@clerk/nextjs";

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
        },
        {
          title: "Research",
          url: "/research",
          icon: AtomIcon,
        },
        {
          title: "Portfolio",
          url: "/portfolio",
          icon: ProcessorIcon,
        },
        {
          title: "Watchlist",
          url: "/watchlist",
          icon: Eye,
        },
        {
          title: "Financial Data",
          url: "/financial-data",
          icon: Landmark,
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
        },
        {
          title: "Mutual Funds",
          url: "/funds",
          icon: PieChart,
        },
        {
          title: "Market Sentiment",
          url: "/sentiment",
          icon: Activity,
        },
        {
          title: "News & Analysis",
          url: "/news",
          icon: Newspaper,
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
    <Sidebar collapsible="icon" {...props} className={cn("py-4", className)}>
      <SidebarHeader className="rounded-t-lg flex gap-3 flex-row rounded-b-none p-2">
        <div className="flex overflow-clip size-8 shrink-0 items-center justify-center rounded bg-sidebar-primary-foreground/10 transition-colors group-hover:bg-sidebar-primary text-sidebar-primary-foreground">
          <MonkeyIcon className="size-6 group-hover:scale-[1.7] origin-top-left transition-transform" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
          <span className="text-xl font-black">GTNinja</span>
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
  );
}
