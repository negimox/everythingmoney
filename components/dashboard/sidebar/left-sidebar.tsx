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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import AtomIcon from "@/components/icons/atom";
import BracketsIcon from "@/components/icons/brackets";
import ProcessorIcon from "@/components/icons/proccesor";
import GearIcon from "@/components/icons/gear";
import MonkeyIcon from "@/components/icons/monkey";
import DotsVerticalIcon from "@/components/icons/dots-vertical";
import { Bullet } from "@/components/ui/bullet";
import { SlidersHorizontal, PieChart, Activity, Newspaper, Eye, Landmark } from "lucide-react";
import LockIcon from "@/components/icons/lock";
import Image from "next/image";

// This is sample data for the sidebar
const data = {
  navMain: [
    {
      title: "Platform",
      items: [
        {
          title: "Dashboard",
          url: "/",
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
  user: {
    name: "Investor",
    email: "investor@tickertape.in",
    avatar: "/avatars/user_krimson.png",
  },
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
                   const isActive = item.url === "/" ? pathname === "/" : pathname?.startsWith(item.url);
                   
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
            User
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <Popover>
                  <PopoverTrigger className="flex gap-2 w-full group cursor-pointer items-center p-1 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground overflow-hidden">
                    <div className="shrink-0 flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground overflow-clip">
                      <Image
                        src={data.user.avatar || "/placeholder.svg"}
                        alt={data.user.name}
                        width={32}
                        height={32}
                      />
                    </div>
                    <div className="flex-1 text-left text-sm leading-tight grid group-data-[collapsible=icon]:hidden">
                      <span className="truncate font-semibold text-sm">
                        {data.user.name}
                      </span>
                      <span className="truncate text-xs opacity-70">
                        {data.user.email}
                      </span>
                    </div>
                    <DotsVerticalIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-56 p-0"
                    side="right"
                    align="end"
                    sideOffset={4}
                  >
                    <div className="flex flex-col">
                      <button className="flex items-center px-4 py-2 text-sm hover:bg-accent">
                        <MonkeyIcon className="mr-2 h-4 w-4" />
                        Account
                      </button>
                      <button className="flex items-center px-4 py-2 text-sm hover:bg-accent">
                        <GearIcon className="mr-2 h-4 w-4" />
                        Settings
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
